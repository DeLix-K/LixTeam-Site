-- ROOTLINE accounts and leaderboard: schema, row-level security and the functions the site calls.
--
-- REVIEW BEFORE RUNNING. This file has NOT been applied to any database.
--
--   * Run it in a DEDICATED Supabase project for ROOTLINE, not in the project the FitNFree app uses. Both
--     projects would otherwise share one list of logins (auth.users), and a ROOTLINE "delete my account"
--     could remove a person's FitNFree login. As a second guard, rl_delete_my_account() only removes the
--     login itself when rl_config.allow_auth_user_delete is 'true' (see the end of this file).
--   * It is safe to run twice: everything is "if not exists" or "create or replace".
--   * Run 002_missions.sql after it (that file is generated from the game's mission list).
--   * Nothing here is reachable except through the functions below. Every table has row-level security on
--     and no policy, and the anon/authenticated roles have no direct table privileges.

-- ── Settings the operator controls ───────────────────────────────────────────────────────────────────
create table if not exists public.rl_config (
  key   text primary key,
  value text not null
);
insert into public.rl_config (key, value) values ('allow_auth_user_delete', 'false') on conflict (key) do nothing;

-- ── The mission list (what each result is worth). Seeded by 002_missions.sql. ───────────────────────
create table if not exists public.rl_missions (
  id      text primary key,
  path    text not null,
  is_exam boolean not null,
  minutes int not null,
  xp1     int not null,
  xp2     int not null,
  xp3     int not null
);

-- ── A player ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.rl_profiles (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  nickname            text not null,
  on_board            boolean not null default true,      -- the player's choice: show me on the public board
  hidden              boolean not null default false,     -- the operator's choice: moderation
  age_confirmed_at    timestamptz not null,
  created_at          timestamptz not null default now(),
  nickname_changed_at timestamptz,
  last_submit_at      timestamptz,
  imported            boolean not null default false,     -- has the first (one-off) sync of existing progress happened
  constraint rl_nickname_format check (nickname ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{2,19}$')
);
create unique index if not exists rl_profiles_nickname_ci on public.rl_profiles (lower(nickname));

-- Best medal per mission (1 bronze, 2 silver, 3 gold).
create table if not exists public.rl_results (
  user_id    uuid not null references auth.users (id) on delete cascade,
  mission_id text not null references public.rl_missions (id),
  best_tier  smallint not null check (best_tier between 1 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

-- Every accepted improvement, kept for the weekly board and for rate limits.
create table if not exists public.rl_gains (
  id         bigserial primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  mission_id text not null references public.rl_missions (id),
  tier       smallint not null check (tier between 1 and 3),
  xp         int not null check (xp >= 0),
  source     text not null check (source in ('import', 'play')),
  at         timestamptz not null default now()
);
create index if not exists rl_gains_user_at on public.rl_gains (user_id, at);
create index if not exists rl_gains_at on public.rl_gains (at);

create table if not exists public.rl_reports (
  id            bigserial primary key,
  reporter      uuid references auth.users (id) on delete set null,
  reported_user uuid not null references auth.users (id) on delete cascade,
  reason        text not null check (reason in ('offensive', 'impersonation', 'cheating', 'other')),
  created_at    timestamptz not null default now()
);
create index if not exists rl_reports_reporter_at on public.rl_reports (reporter, created_at);

-- Words a nickname may not contain. A STARTER list: read it, edit it, add to it.
create table if not exists public.rl_blocked_terms (term text primary key check (term = lower(term)));
insert into public.rl_blocked_terms (term) values
  ('admin'), ('moderator'), ('rootline'), ('lixteam'), ('staff'), ('support'), ('official'),
  ('fuck'), ('shit'), ('cunt'), ('bitch'), ('whore'), ('slut'), ('wank'), ('twat'),
  ('nigg'), ('fagg'), ('retard'), ('nazi'), ('hitler'), ('rape')
on conflict (term) do nothing;

-- ── Lock the tables: only the functions below can touch them ────────────────────────────────────────
alter table public.rl_config        enable row level security;
alter table public.rl_missions      enable row level security;
alter table public.rl_profiles      enable row level security;
alter table public.rl_results       enable row level security;
alter table public.rl_gains         enable row level security;
alter table public.rl_reports       enable row level security;
alter table public.rl_blocked_terms enable row level security;

revoke all on public.rl_config, public.rl_missions, public.rl_profiles, public.rl_results,
              public.rl_gains, public.rl_reports, public.rl_blocked_terms from anon, authenticated;
revoke all on sequence public.rl_gains_id_seq, public.rl_reports_id_seq from anon, authenticated;

-- ── Nickname rules ───────────────────────────────────────────────────────────────────────────────────
-- 3-20 characters: letters, digits, "_", "." and "-", starting with a letter or digit. The block-list is
-- matched after removing separators and undoing common look-alike digits, so "f.u.c.k" and "sh1t" are caught.
create or replace function public.rl_nick_state(p text)
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  flat text;
begin
  if p is null or p !~ '^[A-Za-z0-9][A-Za-z0-9_.-]{2,19}$' then return 'invalid'; end if;
  flat := lower(regexp_replace(p, '[_.-]', '', 'g'));
  if exists (
    select 1 from public.rl_blocked_terms t
    where translate(flat, '013457', 'oieast') like '%' || t.term || '%'
       or translate(flat, '013457', 'oleast') like '%' || t.term || '%'
  ) then return 'blocked'; end if;
  return 'ok';
end $$;

-- ── Functions the site calls ─────────────────────────────────────────────────────────────────────────
-- Errors are raised as short codes (message = the code) so the site can show a plain sentence.

create or replace function public.rl_check_nickname(p_nickname text)
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  st text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  st := public.rl_nick_state(p_nickname);
  if st <> 'ok' then return st; end if;
  if exists (select 1 from public.rl_profiles where lower(nickname) = lower(p_nickname) and user_id <> auth.uid()) then return 'taken'; end if;
  return 'ok';
end $$;

create or replace function public.rl_create_profile(p_nickname text, p_age_confirmed boolean, p_on_board boolean default true)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  st  text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_age_confirmed is distinct from true then raise exception 'age_required'; end if;
  if exists (select 1 from public.rl_profiles where user_id = uid) then raise exception 'profile_exists'; end if;
  st := public.rl_nick_state(p_nickname);
  if st = 'invalid' then raise exception 'nickname_invalid'; end if;
  if st = 'blocked' then raise exception 'nickname_blocked'; end if;
  begin
    insert into public.rl_profiles (user_id, nickname, on_board, age_confirmed_at)
    values (uid, p_nickname, coalesce(p_on_board, true), now());
  exception when unique_violation then
    raise exception 'nickname_taken';
  end;
  return public.rl_my_profile();
end $$;

create or replace function public.rl_set_nickname(p_nickname text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid  uuid := auth.uid();
  prof public.rl_profiles%rowtype;
  st   text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into prof from public.rl_profiles where user_id = uid for update;
  if not found then raise exception 'profile_required'; end if;
  if prof.nickname = p_nickname then return public.rl_my_profile(); end if;
  if prof.nickname_changed_at is not null and prof.nickname_changed_at > now() - interval '7 days' then
    raise exception 'nickname_cooldown';
  end if;
  st := public.rl_nick_state(p_nickname);
  if st = 'invalid' then raise exception 'nickname_invalid'; end if;
  if st = 'blocked' then raise exception 'nickname_blocked'; end if;
  begin
    update public.rl_profiles set nickname = p_nickname, nickname_changed_at = now() where user_id = uid;
  exception when unique_violation then
    raise exception 'nickname_taken';
  end;
  return public.rl_my_profile();
end $$;

create or replace function public.rl_set_visibility(p_on_board boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_on_board is null then raise exception 'bad_request'; end if;
  update public.rl_profiles set on_board = p_on_board where user_id = auth.uid();
  if not found then raise exception 'profile_required'; end if;
  return public.rl_my_profile();
end $$;

-- The signed-in player's own profile and totals (null when they have not chosen a nickname yet).
create or replace function public.rl_my_profile()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid  uuid := auth.uid();
  prof public.rl_profiles%rowtype;
  tot  record;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into prof from public.rl_profiles where user_id = uid;
  if not found then return null; end if;
  select coalesce(sum(case r.best_tier when 1 then m.xp1 when 2 then m.xp2 else m.xp3 end), 0)::bigint as xp,
         count(*) filter (where not (m.is_exam and r.best_tier < 2))::int as passed,
         count(*) filter (where r.best_tier = 3)::int as golds
    into tot
    from public.rl_results r join public.rl_missions m on m.id = r.mission_id
   where r.user_id = uid;
  return jsonb_build_object(
    'nickname', prof.nickname,
    'on_board', prof.on_board,
    'created_at', prof.created_at,
    'synced_at', prof.last_submit_at,
    'nickname_can_change_at', case when prof.nickname_changed_at is null then null else prof.nickname_changed_at + interval '7 days' end,
    'xp', tot.xp, 'passed', tot.passed, 'golds', tot.golds
  );
end $$;

-- Send the player's best medal per mission: { "mission-id": 1|2|3, ... }.
-- The server never trusts XP from the browser. It works the XP out itself from rl_missions, accepts only
-- known missions and medals 1-3, only ever raises a medal, and limits how fast a result can build up:
--   * the first sync of a player is a one-off import of progress they already had (not counted as "this week");
--   * after that, at most 15 improvements per rolling hour and 3000 XP per rolling 24 hours (the rest is held
--     back, reported as "deferred", and is accepted on a later sync);
--   * at most one sync every 15 seconds.
-- These are limits on a SELF-REPORTED score, not proof that the missions were played.
create or replace function public.rl_submit_progress(p_results jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid        uuid := auth.uid();
  prof       public.rl_profiles%rowtype;
  rec        record;
  mis        public.rl_missions%rowtype;
  new_tier   int;
  old_tier   int;
  gain       int;
  accepted   int := 0;
  deferred   int := 0;
  unknown    int := 0;
  first_sync boolean;
  src        text;
  hour_count int;
  day_xp     int;
  out        jsonb;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_results is null or jsonb_typeof(p_results) <> 'object' then raise exception 'bad_request'; end if;
  if (select count(*) from jsonb_object_keys(p_results)) > 500 then raise exception 'bad_request'; end if;

  select * into prof from public.rl_profiles where user_id = uid for update;
  if not found then raise exception 'profile_required'; end if;
  if prof.last_submit_at is not null and prof.last_submit_at > now() - interval '15 seconds' then raise exception 'too_fast'; end if;

  first_sync := not prof.imported;
  src := case when first_sync then 'import' else 'play' end;
  select count(*) into hour_count from public.rl_gains where user_id = uid and source = 'play' and at > now() - interval '1 hour';
  select coalesce(sum(xp), 0) into day_xp from public.rl_gains where user_id = uid and source = 'play' and at > now() - interval '24 hours';

  for rec in select key, value from jsonb_each(p_results) order by key loop
    if jsonb_typeof(rec.value) <> 'number' or rec.value::text !~ '^[123]$' then raise exception 'bad_request'; end if;
    new_tier := (rec.value::text)::int;
    select * into mis from public.rl_missions where id = rec.key;
    if not found then unknown := unknown + 1; continue; end if;
    select best_tier into old_tier from public.rl_results where user_id = uid and mission_id = mis.id;
    old_tier := coalesce(old_tier, 0);
    if new_tier <= old_tier then continue; end if;
    gain := (case new_tier when 1 then mis.xp1 when 2 then mis.xp2 else mis.xp3 end)
          - (case old_tier when 0 then 0 when 1 then mis.xp1 when 2 then mis.xp2 else mis.xp3 end);
    if not first_sync and (hour_count + 1 > 15 or day_xp + gain > 3000) then
      deferred := deferred + 1;
      continue;
    end if;
    insert into public.rl_results (user_id, mission_id, best_tier) values (uid, mis.id, new_tier)
      on conflict (user_id, mission_id) do update set best_tier = excluded.best_tier, updated_at = now();
    insert into public.rl_gains (user_id, mission_id, tier, xp, source) values (uid, mis.id, new_tier, gain, src);
    accepted := accepted + 1;
    hour_count := hour_count + 1;
    day_xp := day_xp + gain;
  end loop;

  update public.rl_profiles set last_submit_at = now(), imported = true where user_id = uid;
  out := public.rl_my_profile();
  return jsonb_build_object('accepted', accepted, 'deferred', deferred, 'unknown', unknown, 'first_sync', first_sync,
                            'xp', out -> 'xp', 'passed', out -> 'passed', 'golds', out -> 'golds');
end $$;

-- The public board. Anyone may read it. It returns nickname and totals only, never an id or an email.
-- p_scope: 'all' (all time) or 'week' (last 7 days, play only: the one-off import is not counted).
-- p_path: optional career path to count (all-time only counts missions on that path; the week counts it too).
-- The signed-in player's own row is always included, even if it is outside the top p_limit.
create or replace function public.rl_leaderboard(p_scope text default 'all', p_path text default null, p_limit int default 50)
returns table (pos bigint, nickname text, xp bigint, passed int, golds int, is_me boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  lim int := greatest(1, least(coalesce(p_limit, 50), 100));
  me  uuid := auth.uid();
begin
  if p_scope is null or p_scope not in ('all', 'week') then raise exception 'bad_request'; end if;
  if p_scope = 'all' then
    return query
    with t as (
      select p.user_id, p.nickname,
             sum(case r.best_tier when 1 then m.xp1 when 2 then m.xp2 else m.xp3 end)::bigint as xp,
             (count(*) filter (where not (m.is_exam and r.best_tier < 2)))::int as passed,
             (count(*) filter (where r.best_tier = 3))::int as golds
        from public.rl_profiles p
        join public.rl_results r on r.user_id = p.user_id
        join public.rl_missions m on m.id = r.mission_id
       where p.on_board and not p.hidden and (p_path is null or m.path = p_path)
       group by p.user_id, p.nickname
    ), ranked as (
      select rank() over (order by t.xp desc, t.passed desc) as pos, t.* from t where t.xp > 0
    )
    select ranked.pos, ranked.nickname, ranked.xp, ranked.passed, ranked.golds, coalesce(ranked.user_id = me, false)
      from ranked where ranked.pos <= lim or ranked.user_id = me
     order by ranked.pos, ranked.nickname;
  else
    return query
    with t as (
      select p.user_id, p.nickname,
             sum(g.xp)::bigint as xp,
             (count(distinct g.mission_id))::int as passed,
             (count(*) filter (where g.tier = 3))::int as golds
        from public.rl_profiles p
        join public.rl_gains g on g.user_id = p.user_id and g.source = 'play' and g.at > now() - interval '7 days'
        join public.rl_missions m on m.id = g.mission_id
       where p.on_board and not p.hidden and (p_path is null or m.path = p_path)
       group by p.user_id, p.nickname
    ), ranked as (
      select rank() over (order by t.xp desc, t.passed desc) as pos, t.* from t where t.xp > 0
    )
    select ranked.pos, ranked.nickname, ranked.xp, ranked.passed, ranked.golds, coalesce(ranked.user_id = me, false)
      from ranked where ranked.pos <= lim or ranked.user_id = me
     order by ranked.pos, ranked.nickname;
  end if;
end $$;

-- Report a nickname. Reports are only stored; the operator reads them (see the notes at the end).
create or replace function public.rl_report_player(p_nickname text, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  target uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_reason is null or p_reason not in ('offensive', 'impersonation', 'cheating', 'other') then raise exception 'bad_request'; end if;
  select user_id into target from public.rl_profiles where lower(nickname) = lower(p_nickname);
  if not found then raise exception 'not_found'; end if;
  if target = uid then raise exception 'bad_request'; end if;
  if (select count(*) from public.rl_reports where reporter = uid and created_at > now() - interval '24 hours') >= 5 then raise exception 'report_limit'; end if;
  insert into public.rl_reports (reporter, reported_user, reason) values (uid, target, p_reason);
end $$;

-- Everything held about the signed-in player in these tables (their right of access). The email address and
-- sign-in method are held by Supabase Auth, not here.
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
    'reports_about_you', (select count(*) from public.rl_reports where reported_user = uid)
  );
end $$;

-- Delete the player's data, and (only when the operator has switched it on for this dedicated project)
-- their login as well. Returns 'account_deleted' or 'data_deleted'.
create or replace function public.rl_delete_my_account()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  delete from public.rl_reports  where reporter = uid or reported_user = uid;
  delete from public.rl_gains    where user_id = uid;
  delete from public.rl_results  where user_id = uid;
  delete from public.rl_profiles where user_id = uid;
  if exists (select 1 from public.rl_config where key = 'allow_auth_user_delete' and value = 'true') then
    delete from auth.users where id = uid;
    return 'account_deleted';
  end if;
  return 'data_deleted';
end $$;

-- ── Who may call what ────────────────────────────────────────────────────────────────────────────────
revoke all on function public.rl_nick_state(text) from public, anon, authenticated;
revoke all on function public.rl_check_nickname(text) from public, anon;
revoke all on function public.rl_create_profile(text, boolean, boolean) from public, anon;
revoke all on function public.rl_set_nickname(text) from public, anon;
revoke all on function public.rl_set_visibility(boolean) from public, anon;
revoke all on function public.rl_my_profile() from public, anon;
revoke all on function public.rl_submit_progress(jsonb) from public, anon;
revoke all on function public.rl_report_player(text, text) from public, anon;
revoke all on function public.rl_export_my_data() from public, anon;
revoke all on function public.rl_delete_my_account() from public, anon;
revoke all on function public.rl_leaderboard(text, text, int) from public;

grant execute on function public.rl_check_nickname(text) to authenticated;
grant execute on function public.rl_create_profile(text, boolean, boolean) to authenticated;
grant execute on function public.rl_set_nickname(text) to authenticated;
grant execute on function public.rl_set_visibility(boolean) to authenticated;
grant execute on function public.rl_my_profile() to authenticated;
grant execute on function public.rl_submit_progress(jsonb) to authenticated;
grant execute on function public.rl_report_player(text, text) to authenticated;
grant execute on function public.rl_export_my_data() to authenticated;
grant execute on function public.rl_delete_my_account() to authenticated;
grant execute on function public.rl_leaderboard(text, text, int) to anon, authenticated;

-- ── Operator notes (run these by hand in the SQL editor; nothing here is called by the site) ─────────
--   Read open reports:
--     select r.created_at, p.nickname, r.reason from public.rl_reports r join public.rl_profiles p on p.user_id = r.reported_user order by r.created_at desc;
--   Hide a player from the board (reversible):
--     update public.rl_profiles set hidden = true where lower(nickname) = lower('SomeNickname');
--   Remove a player's results entirely:
--     delete from public.rl_results where user_id = (select user_id from public.rl_profiles where lower(nickname) = lower('SomeNickname'));
--   Block more words in nicknames:
--     insert into public.rl_blocked_terms (term) values ('someword') on conflict do nothing;
--   Only in a DEDICATED ROOTLINE project, let "delete my account" remove the login too:
--     update public.rl_config set value = 'true' where key = 'allow_auth_user_delete';
