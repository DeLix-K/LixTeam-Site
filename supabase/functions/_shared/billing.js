// The logic behind ROOTLINE Plus billing, kept free of any framework so the same file runs in the Supabase Edge Functions
// (Deno) and in the Node tests (tests/games/billing.test.mjs). The three function entry points in ../billing-*/ and
// ../stripe-webhook/ only wire requests into the handlers below.
//
// Rules this file enforces:
//   * The price is never taken from the browser: it is STRIPE_PRICE_ID on the server.
//   * Only a webhook whose Stripe signature verifies can change a subscription.
//   * A live Stripe key is refused unless ALLOW_LIVE_BILLING=yes is set on purpose.
//   * Errors returned to the browser are short codes, never Stripe's messages.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = new TextEncoder();

// ── Signed webhooks ──────────────────────────────────────────────
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function signPayload(secret, timestamp, rawBody) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`)));
}

// Compares two hex strings without stopping at the first difference.
function sameHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// header: the Stripe-Signature header, "t=...,v1=...". Valid only if one v1 matches and the timestamp is recent.
export async function verifyStripeSignature(rawBody, header, secret, { now = Date.now(), toleranceSeconds = 300 } = {}) {
  if (!secret || typeof rawBody !== 'string' || typeof header !== 'string') return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v || '');
  if (!t || !/^\d{1,12}$/.test(t) || !sigs.length) return false;
  if (Math.abs(Math.floor(now / 1000) - Number(t)) > toleranceSeconds) return false;
  const expected = await signPayload(secret, t, rawBody);
  return sigs.some((s) => sameHex(s, expected));
}

// ── Stripe objects -> our rows ───────────────────────────────────
export function subscriptionFromStripe(sub) {
  const item = sub && sub.items && sub.items.data && sub.items.data[0];
  const end = sub && (sub.current_period_end ?? (item && item.current_period_end));
  const uid = sub && sub.metadata && sub.metadata.user_id;
  return {
    customer: sub && typeof sub.customer === 'string' ? sub.customer : sub && sub.customer && sub.customer.id,
    subscription: sub && sub.id,
    status: sub && sub.status,
    price: item && item.price && item.price.id,
    periodEnd: Number.isFinite(end) ? new Date(end * 1000).toISOString() : null,
    cancel: !!(sub && (sub.cancel_at_period_end || (sub.cancel_at != null && sub.cancel_at))),
    userId: typeof uid === 'string' && UUID.test(uid) ? uid.toLowerCase() : null,
  };
}

const STATUSES = ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'];

// Returns { outcome } where outcome is 'applied' | 'duplicate' | 'stale' | 'ignored' | 'unknown_user' | 'linked'.
export async function handleStripeEvent(event, db, env = {}) {
  const type = event && event.type;
  const obj = event && event.data && event.data.object;
  if (!event || typeof event.id !== 'string' || !obj) return { outcome: 'ignored' };

  if (type === 'checkout.session.completed') {
    const uid = typeof obj.client_reference_id === 'string' && UUID.test(obj.client_reference_id) ? obj.client_reference_id.toLowerCase() : null;
    if (obj.mode === 'subscription' && uid && typeof obj.customer === 'string') {
      await db.linkCustomer(uid, obj.customer);
      return { outcome: 'linked' };
    }
    return { outcome: 'ignored' };
  }

  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const s = subscriptionFromStripe(obj);
    if (!STATUSES.includes(s.status) || !s.customer || !s.subscription) return { outcome: 'ignored' };
    // Only the one configured plan counts. Anything else on the same Stripe account is not ours to act on.
    if (env.STRIPE_PRICE_ID && s.price !== env.STRIPE_PRICE_ID) return { outcome: 'ignored' };
    const outcome = await db.applyEvent({
      eventId: event.id, type, created: Number(event.created) || 0, userId: s.userId, customer: s.customer,
      subscription: s.subscription, status: s.status, price: s.price || null, periodEnd: s.periodEnd, cancel: s.cancel,
    });
    return { outcome };
  }
  return { outcome: 'ignored' };
}

// Returns { status, body } for the HTTP response. 5xx makes Stripe retry later.
export async function handleWebhook({ rawBody, signature, env, db, now = Date.now() }) {
  if (!env.STRIPE_WEBHOOK_SECRET) return { status: 503, body: { error: 'billing_unavailable' } };
  if (!(await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET, { now }))) return { status: 400, body: { error: 'bad_signature' } };
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: 'bad_request' } };
  }
  try {
    const r = await handleStripeEvent(event, db, env);
    if (r.outcome === 'unknown_user') return { status: 500, body: { error: 'retry_later' } };
    return { status: 200, body: { received: true, outcome: r.outcome } };
  } catch {
    return { status: 500, body: { error: 'retry_later' } };
  }
}

// ── Talking to Stripe (REST, no library) ─────────────────────────
export function formEncode(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') out.push(...formEncode(v, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}

async function stripe(env, fetchImpl, path, params, idempotencyKey) {
  const res = await fetchImpl(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: formEncode(params).join('&'),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json) throw new Error('stripe_error');
  return json;
}

function billingConfigProblem(env, needPrice) {
  if (!env.STRIPE_SECRET_KEY || !env.SITE_URL || (needPrice && !env.STRIPE_PRICE_ID)) return 'billing_unavailable';
  if (env.STRIPE_SECRET_KEY.startsWith('sk_live_') && env.ALLOW_LIVE_BILLING !== 'yes') return 'live_billing_not_allowed';
  if (!/^(sk|rk)_(test|live)_/.test(env.STRIPE_SECRET_KEY)) return 'billing_unavailable';
  return '';
}

// user: { id, email } from a verified sign-in token. Nothing in the request body is used.
export async function createCheckout({ user, env, db, fetchImpl }) {
  if (!user || !UUID.test(user.id || '')) return { status: 401, body: { error: 'not_signed_in' } };
  const problem = billingConfigProblem(env, true);
  if (problem) return { status: 503, body: { error: problem } };
  let prep;
  try {
    prep = await db.prepare(user.id, true);
  } catch (e) {
    return String(e && e.message).includes('rate_limited') ? { status: 429, body: { error: 'rate_limited' } } : { status: 502, body: { error: 'billing_unavailable' } };
  }
  if (!prep.has_profile) return { status: 409, body: { error: 'profile_required' } };
  if (prep.plus) return { status: 409, body: { error: 'already_subscribed' } };
  try {
    let customer = prep.customer_id;
    if (!customer) {
      const c = await stripe(env, fetchImpl, 'customers', { email: user.email || undefined, metadata: { user_id: user.id } }, `rl-customer-${user.id}`);
      customer = c.id;
      await db.linkCustomer(user.id, customer);
    }
    const site = env.SITE_URL.replace(/\/+$/, '');
    const session = await stripe(env, fetchImpl, 'checkout/sessions', {
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${site}/games/levelup/account.html?billing=success`,
      cancel_url: `${site}/games/levelup/account.html?billing=cancelled`,
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id },
      allow_promotion_codes: false,
    });
    // Send the player only to Stripe's own checkout page. (Tests may name a stand-in host, and only with a test-mode key.)
    const testHost = env.ALLOW_TEST_CHECKOUT_HOST && env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    if (typeof session.url !== 'string' || !(session.url.startsWith('https://checkout.stripe.com/') || (testHost && session.url.startsWith(env.ALLOW_TEST_CHECKOUT_HOST)))) return { status: 502, body: { error: 'billing_unavailable' } };
    return { status: 200, body: { url: session.url } };
  } catch {
    return { status: 502, body: { error: 'billing_unavailable' } };
  }
}

export async function createPortal({ user, env, db, fetchImpl }) {
  if (!user || !UUID.test(user.id || '')) return { status: 401, body: { error: 'not_signed_in' } };
  const problem = billingConfigProblem(env, false);
  if (problem) return { status: 503, body: { error: problem } };
  try {
    const prep = await db.prepare(user.id, false);
    if (!prep.customer_id) return { status: 409, body: { error: 'no_billing_account' } };
    const site = env.SITE_URL.replace(/\/+$/, '');
    const s = await stripe(env, fetchImpl, 'billing_portal/sessions', { customer: prep.customer_id, return_url: `${site}/games/levelup/account.html` });
    if (typeof s.url !== 'string') return { status: 502, body: { error: 'billing_unavailable' } };
    return { status: 200, body: { url: s.url } };
  } catch {
    return { status: 502, body: { error: 'billing_unavailable' } };
  }
}

// ── Who is calling ───────────────────────────────────────────────
export async function authenticate(authorization, env, fetchImpl) {
  const m = /^Bearer ([A-Za-z0-9._-]{20,4000})$/.exec(authorization || '');
  if (!m || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${m[1]}` } });
    if (!res.ok) return null;
    const u = await res.json();
    return u && typeof u.id === 'string' && UUID.test(u.id) ? { id: u.id.toLowerCase(), email: typeof u.email === 'string' ? u.email : '' } : null;
  } catch {
    return null;
  }
}

// Only the ROOTLINE site may call the browser-facing functions.
export function corsHeaders(origin, env) {
  const allowed = (env.SITE_URL || '').replace(/\/+$/, '');
  const h = { Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
  if (allowed && origin === allowed) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

// ── The database, reached with the service-role key (Edge Functions only) ───────────────────────
export function restDb({ url, serviceKey, fetchImpl }) {
  const call = async (fn, args) => {
    const res = await fetchImpl(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((json && json.message) || 'db_error');
    return json;
  };
  return {
    prepare: (userId, count) => call('rl_billing_prepare', { p_user: userId, p_count_attempt: count }),
    linkCustomer: (userId, customer) => call('rl_billing_link_customer', { p_user: userId, p_customer: customer }),
    applyEvent: (e) => call('rl_billing_apply_event', {
      p_event_id: e.eventId, p_type: e.type, p_created: e.created, p_user: e.userId, p_customer: e.customer,
      p_subscription: e.subscription, p_status: e.status, p_price: e.price, p_period_end: e.periodEnd, p_cancel: e.cancel,
    }),
  };
}
