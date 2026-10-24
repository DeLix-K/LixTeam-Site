-- ROOTLINE Plus billing: who is subscribed, as confirmed by Stripe, and the rules for what that allows.
--
-- REVIEW BEFORE RUNNING. Not applied anywhere. Run it AFTER 001_accounts.sql and 002_missions.sql, in the same dedicated
-- ROOTLINE project. Safe to run twice.
--
-- How it fits together:
--   * The browser can never write a subscription. Only the billing Edge Functions can, using the project's service-role
--     key, and only after they have verified a signed Stripe webhook. The browser may only ask "what is my plan?".
--   * Access to Plus is worked out here, from the confirmed Stripe status and the paid-until date, not from anything the
--     browser sends or from a success page being opened.
--   * Stripe events are recorded by id, so a repeated event changes nothing, and an older event cannot overwrite a newer one.

-- ── Tables (locked: no direct access for anon or authenticated) ──────────────────────────────────────
create table if not exists public.rl_subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'none'
    check (status in ('none', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  last_event_created     bigint not null default 0,
  updated_at             timestamptz not null default now()
);

create table if not exists public.rl_stripe_events (
  event_id    text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

create table if not exists public.rl_billing_attempts (
  id      bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists rl_billing_attempts_user_at on public.rl_billing_attempts (user_id, at);

alter table public.rl_subscriptions    enable row level security;
alter table public.rl_stripe_events    enable row level security;
alter table public.rl_billing_attempts enable row level security;
revoke all on public.rl_subscriptions, public.rl_stripe_events, public.rl_billing_attempts from anon, authenticated;
revoke all on sequence public.rl_billing_attempts_id_seq from anon, authenticated;

-- ── The access rules ─────────────────────────────────────────────────────────────────────────────────
-- Maps Stripe's status to what ROOTLINE shows and allows:
--   free        never subscribed                         no Plus
--   pending     checkout started, payment not confirmed  no Plus
--   active      paid and renewing                        Plus
--   cancelling  paid, will not renew                     Plus until the paid period ends
--   past_due    a renewal payment failed, Stripe retrying Plus for up to 7 days after the period end (a grace window)
--   ended       cancelled, unpaid or expired             no Plus (the account, progress and free access stay)
-- "active" needs a paid-until date that is not more than 3 days in the past, so a missed webhook cannot leave Plus on forever.
create or replace function public.rl_plus_state(p_status text, p_period_end timestamptz, p_cancel boolean)
returns text language sql stable set search_path = public, pg_temp as $$
  select case
    when p_status in ('active', 'trialing') and (p_period_end is null or p_period_end + interval '3 days' > now())
      then case when coalesce(p_cancel, false) then 'cancelling' else 'active' end
    when p_status = 'past_due' and (p_period_end is null or p_period_end + interval '7 days' > now()) then 'past_due'
    when p_status = 'incomplete' then 'pending'
    when p_status = 'none' or p_status is null then 'free'
    else 'ended'
  end
$$;

create or replace function public.rl_has_plus(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select public.rl_plus_state(s.status, s.current_period_end, s.cancel_at_period_end) in ('active', 'cancelling', 'past_due')
      from public.rl_subscriptions s where s.user_id = p_user
  ), false)
$$;

-- The signed-in player's own plan. Never returns Stripe ids.
create or replace function public.rl_my_plan()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  s   public.rl_subscriptions%rowtype;
  st  text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into s from public.rl_subscriptions where user_id = uid;
  if not found then
    return jsonb_build_object('state', 'free', 'plus', false, 'current_period_end', null, 'cancel_at_period_end', false);
  end if;
  st := public.rl_plus_state(s.status, s.current_period_end, s.cancel_at_period_end);
  return jsonb_build_object('state', st, 'plus', st in ('active', 'cancelling', 'past_due'),
                            'current_period_end', s.current_period_end, 'cancel_at_period_end', s.cancel_at_period_end);
end $$;

-- For any future premium function to call first: raises 'plus_required' unless the caller has Plus.
create or replace function public.rl_require_plus()
returns void language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not public.rl_has_plus(auth.uid()) then raise exception 'plus_required'; end if;
end $$;

-- ── Functions for the billing Edge Functions only (service role) ─────────────────────────────────────
-- Checked before a checkout or billing-portal session is created. Also limits checkout attempts to 10 an hour.
create or replace function public.rl_billing_prepare(p_user uuid, p_count_attempt boolean default true)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  has_profile boolean;
  cust text;
begin
  select exists (select 1 from public.rl_profiles where user_id = p_user) into has_profile;
  select stripe_customer_id into cust from public.rl_subscriptions where user_id = p_user;
  if p_count_attempt then
    delete from public.rl_billing_attempts where at < now() - interval '1 day';
    if (select count(*) from public.rl_billing_attempts where user_id = p_user and at > now() - interval '1 hour') >= 10 then
      raise exception 'rate_limited';
    end if;
    insert into public.rl_billing_attempts (user_id) values (p_user);
  end if;
  return jsonb_build_object('has_profile', has_profile, 'plus', public.rl_has_plus(p_user), 'customer_id', cust);
end $$;

create or replace function public.rl_billing_link_customer(p_user uuid, p_customer text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.rl_subscriptions (user_id, stripe_customer_id) values (p_user, p_customer)
  on conflict (user_id) do update set stripe_customer_id = coalesce(public.rl_subscriptions.stripe_customer_id, excluded.stripe_customer_id);
end $$;

-- Applies one verified Stripe subscription event. Returns 'applied', 'duplicate', 'stale' or 'unknown_user'.
-- 'unknown_user' does NOT keep the event id, so Stripe's retry can succeed once the customer is linked.
create or replace function public.rl_billing_apply_event(
  p_event_id text, p_type text, p_created bigint, p_user uuid, p_customer text,
  p_subscription text, p_status text, p_price text, p_period_end timestamptz, p_cancel boolean)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := p_user;
  cur public.rl_subscriptions%rowtype;
  inserted int;
begin
  insert into public.rl_stripe_events (event_id, type) values (p_event_id, p_type) on conflict (event_id) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return 'duplicate'; end if;

  if uid is null and p_customer is not null then
    select user_id into uid from public.rl_subscriptions where stripe_customer_id = p_customer;
  end if;
  if uid is null or not exists (select 1 from auth.users where id = uid) then
    delete from public.rl_stripe_events where event_id = p_event_id;
    return 'unknown_user';
  end if;

  select * into cur from public.rl_subscriptions where user_id = uid for update;
  if found and cur.last_event_created > p_created then return 'stale'; end if;

  insert into public.rl_subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end, last_event_created, updated_at)
  values (uid, p_customer, p_subscription, p_status, p_price, p_period_end, coalesce(p_cancel, false), p_created, now())
  on conflict (user_id) do update set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.rl_subscriptions.stripe_customer_id),
    stripe_subscription_id = excluded.stripe_subscription_id,
    status = excluded.status, price_id = excluded.price_id,
    current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end,
    last_event_created = excluded.last_event_created, updated_at = now();
  return 'applied';
end $$;

-- ── Account deletion must not leave a subscription billing ───────────────────────────────────────────
-- Replaces the version in 001: it now refuses while a paid plan is still running, and removes billing rows.
create or replace function public.rl_delete_my_account()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if public.rl_has_plus(uid) then raise exception 'subscription_active'; end if;
  delete from public.rl_reports  where reporter = uid or reported_user = uid;
  delete from public.rl_gains    where user_id = uid;
  delete from public.rl_results  where user_id = uid;
  delete from public.rl_billing_attempts where user_id = uid;
  delete from public.rl_subscriptions where user_id = uid;
  delete from public.rl_profiles where user_id = uid;
  if exists (select 1 from public.rl_config where key = 'allow_auth_user_delete' and value = 'true') then
    delete from auth.users where id = uid;
    return 'account_deleted';
  end if;
  return 'data_deleted';
end $$;

-- The data export now also says what plan the player is on (no payment details are held here: Stripe holds those).
create or replace function public.rl_export_my_data()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'user_id' from public.rl_profiles p where p.user_id = uid),
    'results', coalesce((select jsonb_agg(jsonb_build_object('mission', mission_id, 'best_tier', best_tier, 'updated_at', updated_at) order by mission_id) from public.rl_results where user_id = uid), '[]'::jsonb),
    'gains', coalesce((select jsonb_agg(jsonb_build_object('mission', mission_id, 'tier', tier, 'xp', xp, 'source', source, 'at', at) order by at) from public.rl_gains where user_id = uid), '[]'::jsonb),
    'reports_filed', (select count(*) from public.rl_reports where reporter = uid),
    'reports_about_you', (select count(*) from public.rl_reports where reported_user = uid),
    'plan', public.rl_my_plan()
  );
end $$;
revoke all on function public.rl_export_my_data() from public, anon;
grant execute on function public.rl_export_my_data() to authenticated;

-- ── Who may call what ────────────────────────────────────────────────────────────────────────────────
revoke all on function public.rl_plus_state(text, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.rl_has_plus(uuid) from public, anon, authenticated;
revoke all on function public.rl_my_plan() from public, anon;
revoke all on function public.rl_require_plus() from public, anon;
revoke all on function public.rl_billing_prepare(uuid, boolean) from public, anon, authenticated;
revoke all on function public.rl_billing_link_customer(uuid, text) from public, anon, authenticated;
revoke all on function public.rl_billing_apply_event(text, text, bigint, uuid, text, text, text, text, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.rl_delete_my_account() from public, anon;

grant execute on function public.rl_my_plan() to authenticated;
grant execute on function public.rl_require_plus() to authenticated;
grant execute on function public.rl_delete_my_account() to authenticated;
grant execute on function public.rl_billing_prepare(uuid, boolean) to service_role;
grant execute on function public.rl_billing_link_customer(uuid, text) to service_role;
grant execute on function public.rl_billing_apply_event(text, text, bigint, uuid, text, text, text, text, timestamptz, boolean) to service_role;
