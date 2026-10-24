// Billing against the real SQL (001 + 002 + 003) in an in-process Postgres, driven by the real webhook handler: signed
// Stripe events in, access rules and lock-down out. Needs PGlite, like accounts-sql.test.mjs (see the top of that file);
// without it this test says it was skipped.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/\\/g, '/');
let PGlite = null;
for (const base of [ROOT, process.env.PGLITE_DIR ? process.env.PGLITE_DIR.replace(/\\/g, '/').replace(/\/?$/, '/') : null]) {
  if (!base) continue;
  try {
    const req = createRequire(pathToFileURL(base + 'x.js'));
    ({ PGlite } = await import(pathToFileURL(req.resolve('@electric-sql/pglite')).href));
    break;
  } catch {
    /* try the next place */
  }
}
if (!PGlite) {
  console.log('  skipped: @electric-sql/pglite is not installed (see accounts-sql.test.mjs)');
  console.log('0 passed');
  process.exit(0);
}
const B = await import(pathToFileURL(ROOT + 'supabase/functions/_shared/billing.js').href);

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated;
`);
for (const f of ['001_accounts.sql', '002_missions.sql', '003_billing.sql']) await db.exec(readFileSync(ROOT + 'supabase/rootline/' + f, 'utf8'));
for (const f of ['001_accounts.sql', '002_missions.sql', '003_billing.sql']) await db.exec(readFileSync(ROOT + 'supabase/rootline/' + f, 'utf8')); // twice: repeatable

const U = { ann: '00000000-0000-0000-0000-00000000000a', ben: '00000000-0000-0000-0000-00000000000b', cat: '00000000-0000-0000-0000-00000000000c' };
for (const [k, id] of Object.entries(U)) await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${k}@example.com`]);

async function as(role, uid, sql, params = []) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid || '']);
    const r = await db.query(sql, params);
    await db.exec('commit');
    return r.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
const player = async (uid, fn, params = []) => Object.values((await as('authenticated', uid, `select public.${fn}(${params.map((_, i) => '$' + (i + 1)).join(', ')}) as v`, params))[0])[0];
const fails = async (code, fn) => {
  try {
    await fn();
  } catch (e) {
    assert.equal(e.message, code, `expected ${code}, got ${e.message}`);
    return;
  }
  assert.fail(`expected ${code}, but it succeeded`);
};

// The database as the Edge Functions see it: the service role.
const svc = async (sql, params) => (await as('service_role', null, sql, params))[0];
const serviceDb = {
  prepare: async (u, c) => (await svc('select public.rl_billing_prepare($1, $2) as v', [u, c])).v,
  linkCustomer: async (u, c) => svc('select public.rl_billing_link_customer($1, $2)', [u, c]),
  applyEvent: async (e) => (await svc('select public.rl_billing_apply_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as v', [e.eventId, e.type, e.created, e.userId, e.customer, e.subscription, e.status, e.price, e.periodEnd, e.cancel])).v,
};

const SECRET = 'whsec_test';
const env = { STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_ID: 'price_plus' };
let seq = 0;
const hour = 3600;
const nowS = () => Math.floor(Date.now() / 1000);
const subObj = (uid, over = {}) => ({ id: 'sub_' + uid.slice(-1), customer: 'cus_' + uid.slice(-1), status: 'active', cancel_at_period_end: false, metadata: { user_id: uid }, items: { data: [{ price: { id: 'price_plus' }, current_period_end: nowS() + 30 * 24 * hour }] }, ...over });
async function deliver(type, object, { id = 'evt_' + ++seq, created = nowS() } = {}) {
  const raw = JSON.stringify({ id, type, created, data: { object } });
  const ts = nowS();
  const r = await B.handleWebhook({ rawBody: raw, signature: `t=${ts},v1=${await B.signPayload(SECRET, ts, raw)}`, env, db: serviceDb });
  return { ...r, id, created, raw };
}
const plan = (uid) => player(uid, 'rl_my_plan');
const setProfile = (uid, nick) => db.query(`insert into public.rl_profiles (user_id, nickname, age_confirmed_at) values ($1, $2, now())`, [uid, nick]);

let n = 0;
const t = async (name, fn) => {
  try {
    await fn();
    console.log('  ok  ', name);
    n++;
  } catch (e) {
    console.log('  FAIL', name, '\n      ', e.message);
    process.exitCode = 1;
  }
};

await t('the access rules map every Stripe status to the right plan state', async () => {
  const q = async (status, endOffsetDays, cancel = false) => (await db.query(`select public.rl_plus_state($1, now() + ($2 || ' days')::interval, $3) as s`, [status, String(endOffsetDays), cancel])).rows[0].s;
  assert.equal(await q('active', 10), 'active');
  assert.equal(await q('trialing', 10), 'active');
  assert.equal(await q('active', 10, true), 'cancelling');
  assert.equal(await q('active', -1), 'active', 'one day late is still inside the 3-day allowance for a slow webhook');
  assert.equal(await q('active', -4), 'ended', 'a missed webhook cannot leave Plus on forever');
  assert.equal(await q('past_due', -2), 'past_due');
  assert.equal(await q('past_due', -8), 'ended');
  for (const s of ['canceled', 'unpaid', 'incomplete_expired', 'paused']) assert.equal(await q(s, 10), 'ended', s);
  assert.equal(await q('incomplete', 10), 'pending');
  assert.equal(await q('none', 10), 'free');
});

await t('a new player is on the free plan, and nobody can read or write billing tables', async () => {
  const p = await plan(U.ann);
  assert.deepEqual([p.state, p.plus], ['free', false]);
  for (const role of ['anon', 'authenticated']) {
    for (const table of ['rl_subscriptions', 'rl_stripe_events', 'rl_billing_attempts']) {
      await assert.rejects(() => as(role, U.ann, `select * from public.${table}`), /permission denied/);
      await assert.rejects(() => as(role, U.ann, `insert into public.${table} (${table === 'rl_stripe_events' ? 'event_id, type' : 'user_id'}) values (${table === 'rl_stripe_events' ? "'x', 'y'" : `'${U.ann}'`})`), /permission denied/);
    }
  }
});

await t('a player cannot grant themselves Plus, or call the billing functions', async () => {
  await assert.rejects(() => as('authenticated', U.ann, `select public.rl_billing_apply_event('e','t',1,'${U.ann}','c','s','active','p', now() + interval '30 days', false)`), /permission denied/);
  await assert.rejects(() => as('authenticated', U.ann, `select public.rl_billing_link_customer('${U.ann}', 'cus_x')`), /permission denied/);
  await assert.rejects(() => as('authenticated', U.ann, `select public.rl_billing_prepare('${U.ann}', true)`), /permission denied/);
  await assert.rejects(() => as('authenticated', U.ann, `select public.rl_has_plus('${U.ann}')`), /permission denied/);
  await assert.rejects(() => as('anon', null, `select public.rl_my_plan()`), /permission denied/);
  await assert.rejects(() => as('anon', null, `select public.rl_require_plus()`), /permission denied/);
  assert.equal((await plan(U.ann)).plus, false);
});

await t('Plus-only functions refuse a free player', async () => {
  await fails('plus_required', () => player(U.ann, 'rl_require_plus'));
});

await t('checkout is only prepared for a player with a profile, and is rate limited', async () => {
  assert.equal((await serviceDb.prepare(U.ann, false)).has_profile, false);
  await setProfile(U.ann, 'Ann_Analyst');
  await setProfile(U.ben, 'Ben_Blue');
  await setProfile(U.cat, 'Cat.Cyber');
  const p = await serviceDb.prepare(U.ann, true);
  assert.deepEqual([p.has_profile, p.plus, p.customer_id], [true, false, null]);
  for (let i = 0; i < 9; i++) await serviceDb.prepare(U.ann, true);
  await assert.rejects(() => serviceDb.prepare(U.ann, true), /rate_limited/);
  await db.query('delete from public.rl_billing_attempts');
});

await t('opening checkout alone grants nothing; the customer link is not a subscription', async () => {
  await serviceDb.linkCustomer(U.ann, 'cus_a');
  const r = await deliver('checkout.session.completed', { mode: 'subscription', customer: 'cus_a', client_reference_id: U.ann, payment_status: 'paid' });
  assert.equal(r.body.outcome, 'linked');
  assert.equal((await plan(U.ann)).plus, false);
  assert.equal((await serviceDb.prepare(U.ann, false)).customer_id, 'cus_a');
});

await t('a verified active subscription grants Plus, and the plan view carries no Stripe ids', async () => {
  const r = await deliver('customer.subscription.created', subObj(U.ann));
  assert.equal(r.status, 200);
  assert.equal(r.body.outcome, 'applied');
  const p = await plan(U.ann);
  assert.deepEqual([p.state, p.plus, p.cancel_at_period_end], ['active', true, false]);
  assert.ok(new Date(p.current_period_end) > new Date());
  assert.ok(!/cus_|sub_|price_/.test(JSON.stringify(p)));
  await player(U.ann, 'rl_require_plus'); // does not raise for a subscriber
  assert.equal((await serviceDb.prepare(U.ann, false)).plus, true);
});

await t('the same event delivered twice changes nothing', async () => {
  const first = await deliver('customer.subscription.updated', subObj(U.ben), { id: 'evt_dup' });
  assert.equal(first.body.outcome, 'applied');
  await db.query(`update public.rl_subscriptions set status = 'canceled' where user_id = $1`, [U.ben]); // something changed since
  const again = await B.handleWebhook({ rawBody: first.raw, signature: `t=${nowS()},v1=${await B.signPayload(SECRET, nowS(), first.raw)}`, env, db: serviceDb });
  assert.equal(again.status, 200);
  assert.equal(again.body.outcome, 'duplicate');
  assert.equal((await db.query(`select status from public.rl_subscriptions where user_id = $1`, [U.ben])).rows[0].status, 'canceled', 'the replay did not overwrite it');
  assert.equal((await db.query(`select count(*)::int as c from public.rl_stripe_events where event_id = 'evt_dup'`)).rows[0].c, 1);
});

await t('an older event cannot overwrite a newer one', async () => {
  const base = nowS();
  await deliver('customer.subscription.updated', subObj(U.cat), { created: base + 100 });
  assert.equal((await plan(U.cat)).plus, true);
  const old = await deliver('customer.subscription.updated', subObj(U.cat, { status: 'canceled' }), { created: base + 50 });
  assert.equal(old.body.outcome, 'stale');
  assert.equal((await plan(U.cat)).plus, true, 'the late cancellation from before did not apply');
  const newer = await deliver('customer.subscription.updated', subObj(U.cat, { status: 'canceled' }), { created: base + 200 });
  assert.equal(newer.body.outcome, 'applied');
  assert.equal((await plan(U.cat)).state, 'ended');
});

await t('cancelling at period end keeps Plus until the paid time runs out, then removes it', async () => {
  await deliver('customer.subscription.updated', subObj(U.ann, { cancel_at_period_end: true }));
  let p = await plan(U.ann);
  assert.deepEqual([p.state, p.plus, p.cancel_at_period_end], ['cancelling', true, true]);
  // The paid period ends and Stripe sends the final deletion.
  await deliver('customer.subscription.deleted', subObj(U.ann, { status: 'canceled', cancel_at_period_end: true }));
  p = await plan(U.ann);
  assert.deepEqual([p.state, p.plus], ['ended', false]);
  await fails('plus_required', () => player(U.ann, 'rl_require_plus'));
});

await t('a failed renewal keeps access during the retry window and loses it after', async () => {
  await deliver('customer.subscription.updated', subObj(U.ann, { status: 'past_due' }));
  assert.deepEqual([(await plan(U.ann)).state, (await plan(U.ann)).plus], ['past_due', true]);
  await db.query(`update public.rl_subscriptions set current_period_end = now() - interval '9 days' where user_id = $1`, [U.ann]);
  assert.deepEqual([(await plan(U.ann)).state, (await plan(U.ann)).plus], ['ended', false]);
});

await t('a resubscription after expiry grants Plus again', async () => {
  await deliver('customer.subscription.created', subObj(U.ann, { id: 'sub_new' }));
  assert.equal((await plan(U.ann)).plus, true);
});

await t('earned progress, achievements and the account survive cancellation and expiry', async () => {
  const m = (await db.query(`select id from public.rl_missions where not is_exam order by id limit 1`)).rows[0].id;
  await db.query(`update public.rl_profiles set last_submit_at = null where user_id = $1`, [U.ann]);
  await player(U.ann, 'rl_submit_progress', [JSON.stringify({ [m]: 3 })]);
  const before = await player(U.ann, 'rl_my_profile');
  await deliver('customer.subscription.deleted', subObj(U.ann, { id: 'sub_new', status: 'canceled' }));
  assert.equal((await plan(U.ann)).plus, false);
  const after = await player(U.ann, 'rl_my_profile');
  assert.deepEqual([after.xp, after.golds, after.nickname], [before.xp, before.golds, before.nickname]);
  assert.ok(before.xp > 0);
  const board = await as('anon', null, `select nickname from public.rl_leaderboard('all', null, 50)`);
  assert.ok(board.some((r) => r.nickname === 'Ann_Analyst'), 'still on the board');
});

await t('an event for an unknown player is not kept, so Stripe\'s retry can succeed once the customer is linked', async () => {
  const obj = subObj(U.ben, { metadata: {}, customer: 'cus_unlinked', id: 'sub_unlinked' });
  const r1 = await deliver('customer.subscription.created', obj, { id: 'evt_retry' });
  assert.equal(r1.status, 500);
  assert.equal((await db.query(`select count(*)::int as c from public.rl_stripe_events where event_id = 'evt_retry'`)).rows[0].c, 0);
  await db.query(`update public.rl_subscriptions set stripe_customer_id = 'cus_unlinked' where user_id = $1`, [U.ben]);
  const r2 = await B.handleWebhook({ rawBody: r1.raw, signature: `t=${nowS()},v1=${await B.signPayload(SECRET, nowS(), r1.raw)}`, env, db: serviceDb });
  assert.equal(r2.body.outcome, 'applied');
});

await t('an event for a player who was deleted is not kept and never grants anything', async () => {
  const ghost = '00000000-0000-0000-0000-0000000000ee';
  const r = await deliver('customer.subscription.created', subObj(ghost));
  assert.equal(r.status, 500);
  assert.equal((await db.query(`select count(*)::int as c from public.rl_subscriptions where user_id = $1`, [ghost])).rows[0].c, 0);
});

await t('a paid plan blocks account deletion until it is cancelled; then deletion removes the billing rows too', async () => {
  await deliver('customer.subscription.created', subObj(U.cat, { id: 'sub_c2', status: 'active' }), { created: nowS() + 500 });
  assert.equal((await plan(U.cat)).plus, true);
  await fails('subscription_active', () => player(U.cat, 'rl_delete_my_account'));
  assert.equal((await db.query(`select count(*)::int as c from public.rl_profiles where user_id = $1`, [U.cat])).rows[0].c, 1, 'nothing was deleted');
  await deliver('customer.subscription.deleted', subObj(U.cat, { id: 'sub_c2', status: 'canceled' }), { created: nowS() + 600 });
  assert.equal(await player(U.cat, 'rl_delete_my_account'), 'data_deleted');
  assert.equal((await db.query(`select count(*)::int as c from public.rl_subscriptions where user_id = $1`, [U.cat])).rows[0].c, 0);
});

await t('the data export includes the plan and nothing from Stripe', async () => {
  const d = await player(U.ann, 'rl_export_my_data');
  assert.ok(d.plan && ['free', 'ended', 'active', 'cancelling', 'past_due', 'pending'].includes(d.plan.state));
  assert.ok(!/cus_|sub_|price_/.test(JSON.stringify(d)));
});

console.log(n, 'passed');
