// ROOTLINE Plus billing logic (supabase/functions/_shared/billing.js): signed webhooks, what Stripe objects mean, how checkout
// and the billing portal are created, who is allowed to call them. No network and no database: Stripe and the database are
// stand-ins. The same logic against the real SQL is in billing-sql.test.mjs.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/\\/g, '/');
const B = await import(pathToFileURL(ROOT + 'supabase/functions/_shared/billing.js').href);

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

const SECRET = 'whsec_test_secret';
const NOW = 1_800_000_000_000;
const UID = '11111111-2222-3333-4444-555555555555';
const header = async (body, { secret = SECRET, t = Math.floor(NOW / 1000) } = {}) => `t=${t},v1=${await B.signPayload(secret, t, body)}`;

await t('a correctly signed webhook verifies', async () => {
  const body = '{"id":"evt_1"}';
  assert.equal(await B.verifyStripeSignature(body, await header(body), SECRET, { now: NOW }), true);
});

await t('a tampered body, wrong secret, missing or garbled signature, or old timestamp is refused', async () => {
  const body = '{"id":"evt_1"}';
  const good = await header(body);
  assert.equal(await B.verifyStripeSignature(body + ' ', good, SECRET, { now: NOW }), false, 'tampered body');
  assert.equal(await B.verifyStripeSignature(body, await header(body, { secret: 'other' }), SECRET, { now: NOW }), false, 'wrong secret');
  for (const bad of ['', 't=1', 'v1=abc', 't=abc,v1=abc', `t=${Math.floor(NOW / 1000)},v1=`, null, undefined]) assert.equal(await B.verifyStripeSignature(body, bad, SECRET, { now: NOW }), false, String(bad));
  assert.equal(await B.verifyStripeSignature(body, await header(body, { t: Math.floor(NOW / 1000) - 3600 }), SECRET, { now: NOW }), false, 'replayed an hour later');
  assert.equal(await B.verifyStripeSignature(body, await header(body, { t: Math.floor(NOW / 1000) + 3600 }), SECRET, { now: NOW }), false, 'from the future');
  assert.equal(await B.verifyStripeSignature(body, good, '', { now: NOW }), false, 'no secret configured');
});

await t('an extra, wrong signature next to the right one is fine (Stripe rotates secrets)', async () => {
  const body = '{"id":"evt_2"}';
  const ts = Math.floor(NOW / 1000);
  const h = `t=${ts},v1=${'0'.repeat(64)},v1=${await B.signPayload(SECRET, ts, body)}`;
  assert.equal(await B.verifyStripeSignature(body, h, SECRET, { now: NOW }), true);
});

const sub = (over = {}) => ({
  id: 'sub_1', customer: 'cus_1', status: 'active', cancel_at_period_end: false, metadata: { user_id: UID },
  items: { data: [{ price: { id: 'price_plus' }, current_period_end: 1_800_100_000 }] }, ...over,
});

await t('Stripe subscriptions are read in both the old and the new API shapes', () => {
  const a = B.subscriptionFromStripe(sub());
  assert.deepEqual([a.customer, a.subscription, a.status, a.price, a.userId, a.cancel], ['cus_1', 'sub_1', 'active', 'price_plus', UID, false]);
  assert.equal(a.periodEnd, new Date(1_800_100_000 * 1000).toISOString());
  const old = B.subscriptionFromStripe(sub({ current_period_end: 1_800_200_000, items: { data: [{ price: { id: 'price_plus' } }] } }));
  assert.equal(old.periodEnd, new Date(1_800_200_000 * 1000).toISOString());
  assert.equal(B.subscriptionFromStripe(sub({ cancel_at_period_end: true })).cancel, true);
  assert.equal(B.subscriptionFromStripe(sub({ cancel_at: 1_800_100_000 })).cancel, true, 'a scheduled cancel date counts');
  assert.equal(B.subscriptionFromStripe(sub({ customer: { id: 'cus_9' } })).customer, 'cus_9');
  assert.equal(B.subscriptionFromStripe(sub({ metadata: { user_id: 'not-a-uuid' } })).userId, null);
  assert.equal(B.subscriptionFromStripe(sub({ metadata: {} })).userId, null);
});

// A stand-in database that records what it was asked to do.
const fakeDb = (over = {}) => {
  const calls = [];
  return {
    calls,
    linkCustomer: async (u, c) => calls.push(['link', u, c]),
    applyEvent: async (e) => (calls.push(['apply', e]), 'applied'),
    prepare: async () => ({ has_profile: true, plus: false, customer_id: null }),
    ...over,
  };
};
const env = { STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_ID: 'price_plus', STRIPE_SECRET_KEY: 'sk_test_123', SITE_URL: 'https://site.example', SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon' };
const evt = (type, object, id = 'evt_1') => ({ id, type, created: 1_800_000_000, data: { object } });
const send = async (event, db, e = env, signed = true) => {
  const raw = JSON.stringify(event);
  return B.handleWebhook({ rawBody: raw, signature: signed ? await header(raw) : 't=1,v1=00', env: e, db, now: NOW });
};

await t('an unsigned or wrongly signed webhook changes nothing', async () => {
  const db = fakeDb();
  const r = await send(evt('customer.subscription.updated', sub()), db, env, false);
  assert.equal(r.status, 400);
  assert.equal(db.calls.length, 0);
  const none = await send(evt('customer.subscription.updated', sub()), db, { ...env, STRIPE_WEBHOOK_SECRET: '' });
  assert.equal(none.status, 503);
  assert.equal(db.calls.length, 0);
});

await t('a signed subscription event is applied with the values from Stripe', async () => {
  const db = fakeDb();
  const r = await send(evt('customer.subscription.created', sub()), db);
  assert.equal(r.status, 200);
  const e = db.calls[0][1];
  assert.deepEqual([e.eventId, e.userId, e.customer, e.subscription, e.status, e.price, e.cancel], ['evt_1', UID, 'cus_1', 'sub_1', 'active', 'price_plus', false]);
});

await t('events for another price, other event types, and junk are ignored', async () => {
  const db = fakeDb();
  assert.equal((await send(evt('customer.subscription.updated', sub({ items: { data: [{ price: { id: 'price_other' }, current_period_end: 1 }] } })), db)).body.outcome, 'ignored');
  assert.equal((await send(evt('invoice.paid', { id: 'in_1' }), db)).body.outcome, 'ignored');
  assert.equal((await send(evt('customer.subscription.updated', sub({ status: 'bogus' })), db)).body.outcome, 'ignored');
  assert.equal((await send({ id: 'evt_x', type: 'customer.subscription.updated' }, db)).body.outcome, 'ignored');
  assert.equal(db.calls.length, 0);
});

await t('checkout completion links the Stripe customer to the player, but grants nothing', async () => {
  const db = fakeDb();
  const r = await send(evt('checkout.session.completed', { mode: 'subscription', customer: 'cus_1', client_reference_id: UID, payment_status: 'paid' }), db);
  assert.equal(r.body.outcome, 'linked');
  assert.deepEqual(db.calls, [['link', UID, 'cus_1']]);
  const db2 = fakeDb();
  await send(evt('checkout.session.completed', { mode: 'payment', customer: 'cus_1', client_reference_id: UID }), db2);
  await send(evt('checkout.session.completed', { mode: 'subscription', customer: 'cus_1', client_reference_id: 'not-a-uuid' }), db2);
  assert.equal(db2.calls.length, 0);
});

await t('a failure inside asks Stripe to retry, and an unknown player is retried too', async () => {
  const boom = fakeDb({ applyEvent: async () => { throw new Error('db down'); } });
  assert.equal((await send(evt('customer.subscription.updated', sub()), boom)).status, 500);
  const unknown = fakeDb({ applyEvent: async () => 'unknown_user' });
  assert.equal((await send(evt('customer.subscription.updated', sub()), unknown)).status, 500);
  const dup = fakeDb({ applyEvent: async () => 'duplicate' });
  assert.equal((await send(evt('customer.subscription.updated', sub()), dup)).status, 200);
});

// A stand-in Stripe.
const stripeFake = (over = {}) => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = Object.fromEntries(new URLSearchParams(init.body));
    calls.push({ url, body, headers: init.headers });
    if (over.fail) return { ok: false, json: async () => ({ error: { message: 'secret detail: card_declined sk_test_123' } }) };
    if (url.endsWith('/customers')) return { ok: true, json: async () => ({ id: 'cus_new' }) };
    if (url.endsWith('/checkout/sessions')) return { ok: true, json: async () => ({ url: over.url || 'https://checkout.stripe.com/c/pay/cs_test_1' }) };
    if (url.endsWith('/billing_portal/sessions')) return { ok: true, json: async () => ({ url: 'https://billing.stripe.com/p/session/x' }) };
    return { ok: false, json: async () => ({}) };
  };
  return { calls, fetchImpl };
};
const user = { id: UID, email: 'p@example.com' };

await t('checkout is created from server settings only: the price, the redirect addresses and the player', async () => {
  const db = fakeDb();
  const st = stripeFake();
  const r = await B.createCheckout({ user, env, db, fetchImpl: st.fetchImpl, body: { price: 'price_cheap', amount: 1 } });
  assert.equal(r.status, 200);
  assert.match(r.body.url, /^https:\/\/checkout\.stripe\.com\//);
  const [cust, sess] = st.calls;
  assert.match(cust.url, /customers$/);
  assert.equal(cust.headers['Idempotency-Key'], `rl-customer-${UID}`);
  assert.equal(sess.body.mode, 'subscription');
  assert.equal(sess.body['line_items[0][price]'], 'price_plus');
  assert.equal(sess.body['line_items[0][quantity]'], '1');
  assert.equal(sess.body.client_reference_id, UID);
  assert.equal(sess.body['subscription_data[metadata][user_id]'], UID);
  assert.equal(sess.body.success_url, 'https://site.example/games/levelup/account.html?billing=success');
  assert.equal(sess.body.cancel_url, 'https://site.example/games/levelup/account.html?billing=cancelled');
  assert.ok(!('unit_amount' in sess.body) && !JSON.stringify(sess.body).includes('price_cheap'));
  assert.deepEqual(db.calls, [['link', UID, 'cus_new']]);
});

await t('an existing Stripe customer is reused', async () => {
  const st = stripeFake();
  const db = fakeDb({ prepare: async () => ({ has_profile: true, plus: false, customer_id: 'cus_old' }) });
  await B.createCheckout({ user, env, db, fetchImpl: st.fetchImpl });
  assert.equal(st.calls.length, 1);
  assert.equal(st.calls[0].body.customer, 'cus_old');
});

await t('checkout refuses: signed-out, no profile, already subscribed, rate limited, not configured', async () => {
  const st = stripeFake();
  assert.equal((await B.createCheckout({ user: null, env, db: fakeDb(), fetchImpl: st.fetchImpl })).status, 401);
  assert.equal((await B.createCheckout({ user: { id: 'x' }, env, db: fakeDb(), fetchImpl: st.fetchImpl })).status, 401);
  const noProfile = fakeDb({ prepare: async () => ({ has_profile: false, plus: false, customer_id: null }) });
  assert.equal((await B.createCheckout({ user, env, db: noProfile, fetchImpl: st.fetchImpl })).body.error, 'profile_required');
  const already = fakeDb({ prepare: async () => ({ has_profile: true, plus: true, customer_id: 'cus_1' }) });
  assert.equal((await B.createCheckout({ user, env, db: already, fetchImpl: st.fetchImpl })).body.error, 'already_subscribed');
  const limited = fakeDb({ prepare: async () => { throw new Error('rate_limited'); } });
  assert.equal((await B.createCheckout({ user, env, db: limited, fetchImpl: st.fetchImpl })).status, 429);
  for (const missing of ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'SITE_URL']) {
    assert.equal((await B.createCheckout({ user, env: { ...env, [missing]: '' }, db: fakeDb(), fetchImpl: st.fetchImpl })).status, 503, missing);
  }
  assert.equal(st.calls.length, 0, 'Stripe was not contacted for any of these');
});

await t('a live Stripe key is refused unless it was allowed on purpose', async () => {
  const st = stripeFake();
  const live = { ...env, STRIPE_SECRET_KEY: 'sk_live_abc' };
  const r = await B.createCheckout({ user, env: live, db: fakeDb(), fetchImpl: st.fetchImpl });
  assert.equal(r.body.error, 'live_billing_not_allowed');
  assert.equal(st.calls.length, 0);
  assert.equal((await B.createCheckout({ user, env: { ...live, ALLOW_LIVE_BILLING: 'yes' }, db: fakeDb(), fetchImpl: stripeFake().fetchImpl })).status, 200);
  assert.equal((await B.createCheckout({ user, env: { ...env, STRIPE_SECRET_KEY: 'whatever' }, db: fakeDb(), fetchImpl: st.fetchImpl })).status, 503);
});

await t('Stripe errors are never passed on to the browser', async () => {
  const r = await B.createCheckout({ user, env, db: fakeDb(), fetchImpl: stripeFake({ fail: true }).fetchImpl });
  assert.equal(r.status, 502);
  assert.deepEqual(r.body, { error: 'billing_unavailable' });
  assert.ok(!JSON.stringify(r).includes('sk_test') && !JSON.stringify(r).includes('declined'));
});

await t('the player is only sent to Stripe\'s own checkout page', async () => {
  const r = await B.createCheckout({ user, env, db: fakeDb(), fetchImpl: stripeFake({ url: 'https://evil.example/pay' }).fetchImpl });
  assert.equal(r.status, 502);
  const ok = await B.createCheckout({ user, env: { ...env, ALLOW_TEST_CHECKOUT_HOST: 'http://localhost:1' }, db: fakeDb(), fetchImpl: stripeFake({ url: 'http://localhost:1/pay' }).fetchImpl });
  assert.equal(ok.status, 200, 'a test host is allowed only with a test key');
  const live = await B.createCheckout({ user, env: { ...env, STRIPE_SECRET_KEY: 'sk_live_x', ALLOW_LIVE_BILLING: 'yes', ALLOW_TEST_CHECKOUT_HOST: 'http://localhost:1' }, db: fakeDb(), fetchImpl: stripeFake({ url: 'http://localhost:1/pay' }).fetchImpl });
  assert.equal(live.status, 502, 'never with a live key');
});

await t('the billing portal needs a Stripe customer and returns to the account page', async () => {
  const st = stripeFake();
  const none = await B.createPortal({ user, env, db: fakeDb(), fetchImpl: st.fetchImpl });
  assert.equal(none.body.error, 'no_billing_account');
  const db = fakeDb({ prepare: async () => ({ has_profile: true, plus: true, customer_id: 'cus_1' }) });
  const r = await B.createPortal({ user, env, db, fetchImpl: st.fetchImpl });
  assert.equal(r.status, 200);
  assert.equal(st.calls[0].body.customer, 'cus_1');
  assert.equal(st.calls[0].body.return_url, 'https://site.example/games/levelup/account.html');
  assert.equal((await B.createPortal({ user: null, env, db, fetchImpl: st.fetchImpl })).status, 401);
});

await t('the caller is identified by the sign-in service, not by anything they send', async () => {
  const ok = async (url, init) => (init.headers.Authorization === 'Bearer ' + 'a'.repeat(30) ? { ok: true, json: async () => ({ id: UID.toUpperCase(), email: 'p@example.com' }) } : { ok: false });
  assert.deepEqual(await B.authenticate('Bearer ' + 'a'.repeat(30), env, ok), { id: UID, email: 'p@example.com' });
  assert.equal(await B.authenticate('Bearer ' + 'b'.repeat(30), env, ok), null);
  for (const bad of [null, '', 'Basic abc', 'Bearer short', 'Bearer ' + 'a'.repeat(30) + ' extra']) assert.equal(await B.authenticate(bad, env, ok), null, String(bad));
  assert.equal(await B.authenticate('Bearer ' + 'a'.repeat(30), env, async () => { throw new Error('down'); }), null);
  assert.equal(await B.authenticate('Bearer ' + 'a'.repeat(30), env, async () => ({ ok: true, json: async () => ({ id: 'not-a-uuid' }) })), null);
});

await t('only the ROOTLINE site may call the browser-facing functions', () => {
  assert.equal(B.corsHeaders('https://site.example', env)['Access-Control-Allow-Origin'], 'https://site.example');
  assert.equal(B.corsHeaders('https://evil.example', env)['Access-Control-Allow-Origin'], undefined);
  assert.equal(B.corsHeaders('', env)['Access-Control-Allow-Origin'], undefined);
  assert.equal(B.corsHeaders('https://site.example', {})['Access-Control-Allow-Origin'], undefined);
});

await t('the form encoder nests like Stripe expects', () => {
  assert.equal(B.formEncode({ a: 1, b: { c: 'x y', d: [{ e: 2 }] }, skip: undefined, n: null }).join('&'), 'a=1&b%5Bc%5D=x%20y&b%5Bd%5D%5B0%5D%5Be%5D=2');
});

await t('the function entry points only wire requests into the shared logic', () => {
  for (const name of ['billing-checkout', 'billing-portal', 'stripe-webhook']) {
    const src = readFileSync(ROOT + `supabase/functions/${name}/index.ts`, 'utf8');
    assert.match(src, /from '\.\.\/_shared\/billing\.js'/, name);
    assert.ok(!/sk_(test|live)_|whsec_/.test(src), 'no secrets in source');
    assert.ok(src.split('\n').length < 25, `${name} stays small`);
  }
  const cfg = readFileSync(ROOT + 'supabase/config.toml', 'utf8');
  assert.match(cfg, /\[functions\.stripe-webhook\]\s*verify_jwt = false/);
  assert.match(cfg, /\[functions\.billing-checkout\]\s*verify_jwt = true/);
});

await t('no Stripe or Supabase secret is anywhere in the site or the functions', () => {
  const walk = [ROOT + 'public/games/core/accounts-config.js', ROOT + 'supabase/functions/_shared/billing.js', ROOT + 'vercel.json'];
  for (const f of walk) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/sk_(test|live)_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|rk_(test|live)_[A-Za-z0-9]{10,}|service_role_key\s*[:=]\s*['"]ey/.test(s), f);
  }
});

console.log(n, 'passed');
