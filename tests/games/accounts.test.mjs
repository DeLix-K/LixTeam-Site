// ROOTLINE accounts: the pure rules (what the board counts, nicknames, messages), that the committed SQL matches the
// game's mission list, that the sign-in client behaves against a stand-in service, and that the site's settings are
// consistent (switched-off by default, content-security policy matches the configured host).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/\\/g, '/');
const GAMES = ROOT + 'public/games/';
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const U = (p) => pathToFileURL(GAMES + p).href;
const S = await import(U('core/sync.js'));
const C = await import(U('core/career.js'));
const M = await import(U('core/missions.js'));
const A = await import(U('core/auth.js'));
const CFG = await import(U('core/accounts-config.js'));

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

// ── What the board counts ───────────────────────────────────────
await t('there is one mission row per career mission, worth what the game pays', () => {
  const rows = S.missionRows();
  assert.equal(rows.length, M.MISSIONS.length);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  for (const m of M.MISSIONS) {
    const r = rows.find((x) => x.id === m.id);
    for (const tier of [1, 2, 3]) assert.equal(r['xp' + tier], C.xpReward(m, tier), `${m.id} tier ${tier}`);
    assert.equal(r.is_exam, !!m.exam);
    assert.ok(r.xp1 <= r.xp2 && r.xp2 <= r.xp3);
  }
});

await t('the committed 002_missions.sql is up to date with the mission list', () => {
  const file = readFileSync(ROOT + 'supabase/rootline/002_missions.sql', 'utf8');
  assert.equal(file, S.missionsSql(S.missionRows()), 'run: node tools/gen-rl-missions.mjs');
});

await t('mission ids are safe to put in generated SQL', () => {
  for (const r of S.missionRows()) assert.match(r.id, /^[a-z0-9][a-z0-9-]*$/, r.id);
});

await t('the board total equals the career XP earned from medals', () => {
  const s = C.blank();
  const picks = M.MISSIONS.filter((m) => !m.exam).slice(0, 12);
  picks.forEach((m, i) => C.recordAttempt(s, { missionId: m.id, points: m.par || 100, tier: (i % 3) + 1 }));
  // Improve two of them, and replay one at a lower medal: only the best counts.
  C.recordAttempt(s, { missionId: picks[0].id, points: 999, tier: 3 });
  C.recordAttempt(s, { missionId: picks[2].id, points: 1, tier: 1 });
  const sub = S.buildSubmission(s);
  assert.equal(Object.keys(sub).length, 12);
  assert.equal(sub[picks[0].id], 3);
  assert.equal(S.boardTotals(sub).xp, s.xp, 'matches the XP the game awarded for medals');
  assert.equal(S.boardTotals(sub).golds, Object.values(sub).filter((x) => x === 3).length);
});

await t('a failed attempt is not submitted, and an exam at bronze does not count as passed', () => {
  const s = C.blank();
  const m = M.MISSIONS.find((x) => !x.exam);
  const e = M.MISSIONS.find((x) => x.exam);
  C.recordAttempt(s, { missionId: m.id, points: 0, tier: 0 });
  assert.deepEqual(S.buildSubmission(s), {});
  C.recordAttempt(s, { missionId: e.id, points: 1, tier: 1 });
  const sub = S.buildSubmission(s);
  assert.equal(S.boardTotals(sub).passed, 0);
  assert.equal(S.boardTotals(sub).xp, 0);
});

await t('unknown ids and bad medals in a submission are ignored by the totals', () => {
  assert.deepEqual(S.boardTotals({ nope: 3, [M.MISSIONS[0].id]: 9 }), { xp: 0, passed: 0, golds: 0 });
  assert.deepEqual(S.boardTotals(null), { xp: 0, passed: 0, golds: 0 });
});

await t('the fingerprint changes when a medal changes, not when order does', () => {
  const a = S.fingerprint({ x: 1, y: 2 });
  assert.equal(a, S.fingerprint({ y: 2, x: 1 }));
  assert.notEqual(a, S.fingerprint({ x: 1, y: 3 }));
  assert.notEqual(a, S.fingerprint({ x: 1 }));
});

await t('nickname checks in the browser match the database format', () => {
  for (const ok of ['abc', 'Ann_Analyst', 'a.b-c_1', 'x'.repeat(20), '9lives']) assert.equal(S.nicknameProblem(ok), '', ok);
  for (const bad of ['', 'ab', 'x'.repeat(21), '_abc', ' abc', 'a b c', "o'neil", 'emoji😀', 'a<b>c']) assert.notEqual(S.nicknameProblem(bad), '', JSON.stringify(bad));
  const sql = readFileSync(ROOT + 'supabase/rootline/001_accounts.sql', 'utf8');
  assert.ok(sql.includes(S.NICKNAME_RE.source.replace(/\\\//g, '/')), 'the same pattern is in the SQL');
});

// ── The SQL file ────────────────────────────────────────────────
const sql = readFileSync(ROOT + 'supabase/rootline/001_accounts.sql', 'utf8');
await t('every table has row-level security switched on, and anon/authenticated have no table privileges', () => {
  const tables = [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
  assert.ok(tables.length >= 7);
  for (const name of tables) {
    assert.ok(new RegExp(`alter table public\\.${name}\\s+enable row level security`).test(sql), `${name} has RLS`);
    assert.ok(new RegExp(`revoke all on[^;]*public\\.${name}\\b[^;]*from anon, authenticated`).test(sql), `${name} is revoked`);
  }
  assert.ok(!/create policy/i.test(sql), 'no policies: tables are reachable only through the functions');
});

await t('every function is security definer with a fixed search_path, and only the board is open to signed-out readers', () => {
  const fns = [...sql.matchAll(/create or replace function public\.(\w+)\(([^)]*)\)([\s\S]*?)\$\$;?/g)];
  assert.ok(fns.length >= 10);
  for (const [, name, , head] of fns) {
    assert.match(head, /security definer/, name);
    assert.match(head, /set search_path = public, pg_temp/, name);
  }
  const anonGrants = [...sql.matchAll(/grant execute on function public\.(\w+)[^;]*to ([^;]*);/g)].filter((m) => /anon/.test(m[2])).map((m) => m[1]);
  assert.deepEqual(anonGrants, ['rl_leaderboard']);
});

await t('every error code the database raises has a plain-language message', () => {
  const codes = new Set([...sql.matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1]));
  assert.ok(codes.size >= 10);
  const generic = S.messageFor('definitely-not-a-code');
  for (const c of codes) assert.notEqual(S.messageFor(c), generic, `${c} has a message`);
});

await t('account deletion removes the login only when the operator switched that on', () => {
  assert.match(sql, /allow_auth_user_delete', 'false'/);
  assert.match(sql, /where key = 'allow_auth_user_delete' and value = 'true'/);
});

// ── Site settings ───────────────────────────────────────────────
await t('accounts are off unless a project URL and key are set, and the policy allows exactly that host', () => {
  const vercel = JSON.parse(readFileSync(ROOT + 'vercel.json', 'utf8'));
  const csp = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
  const connect = /connect-src ([^;]*)/.exec(csp)[1].split(/\s+/);
  if (!CFG.ACCOUNTS.url) {
    assert.equal(CFG.ACCOUNTS.anonKey, '');
    assert.deepEqual(CFG.ACCOUNTS.providers, []);
  } else {
    assert.match(CFG.ACCOUNTS.url, /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    assert.ok(connect.includes(CFG.ACCOUNTS.url), 'vercel.json connect-src lists the accounts project');
    assert.ok(CFG.ACCOUNTS.anonKey.split('.').length === 3, 'looks like a JWT');
    const payload = JSON.parse(Buffer.from(CFG.ACCOUNTS.anonKey.split('.')[1], 'base64url').toString());
    assert.equal(payload.role, 'anon', 'the key in the page must be the public anon key, never a service-role key');
  }
  for (const p of CFG.ACCOUNTS.providers) assert.ok(['google', 'github', 'apple'].includes(p));
  assert.ok(csp.includes("form-action 'self'") && !/connect-src[^;]*\*/.test(csp));
});

// ── The sign-in client against a stand-in service ───────────────
function service() {
  const log = [];
  const users = new Map(); // email -> { id, password, confirmed }
  const tokens = new Map(); // access -> uid
  const refresh = new Map(); // refresh -> uid
  const codes = new Map(); // code -> { uid, challenge }
  let seq = 0;
  let down = false;
  const sess = (uid, email, ttl = 3600) => {
    const at = `at${++seq}`;
    const rt = `rt${++seq}`;
    tokens.set(at, uid);
    refresh.set(rt, uid);
    return { access_token: at, refresh_token: rt, expires_in: ttl, token_type: 'bearer', user: { id: uid, email, app_metadata: { provider: 'email' }, user_metadata: { age_confirmed: true } } };
  };
  const reply = (status, body) => ({ ok: status < 400, status, text: async () => (body === undefined ? '' : JSON.stringify(body)) });
  const sha = async (v) => {
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)));
    return Buffer.from(d).toString('base64url');
  };
  const fetchImpl = async (url, init) => {
    if (down) throw new TypeError('network down');
    const u = new URL(url);
    const body = init.body ? JSON.parse(init.body) : {};
    const bearer = (init.headers.Authorization || '').replace('Bearer ', '');
    log.push({ path: u.pathname, search: u.search, body, bearer, apikey: init.headers.apikey });
    if (init.headers.apikey !== 'anon-key') return reply(401, { message: 'no apikey' });
    const p = u.pathname;
    if (p === '/auth/v1/signup') {
      if (users.has(body.email)) return reply(200, { id: 'x', email: body.email }); // same answer as a new user
      users.set(body.email, { id: `u${++seq}`, password: body.password, confirmed: false, challenge: body.code_challenge });
      return reply(200, { id: users.get(body.email).id, email: body.email });
    }
    if (p === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') {
      const us = users.get(body.email);
      if (!us || us.password !== body.password) return reply(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      if (!us.confirmed) return reply(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
      return reply(200, sess(us.id, body.email));
    }
    if (p === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') {
      const uid = refresh.get(body.refresh_token);
      if (!uid) return reply(400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
      refresh.delete(body.refresh_token);
      return reply(200, sess(uid, [...users].find(([, v]) => v.id === uid)?.[0] || 'a@b.co'));
    }
    if (p === '/auth/v1/token' && u.searchParams.get('grant_type') === 'pkce') {
      const c = codes.get(body.auth_code);
      if (!c || (await sha(body.code_verifier)) !== c.challenge) return reply(400, { error_code: 'validation_failed', msg: 'code verifier mismatch' });
      codes.delete(body.auth_code);
      return reply(200, sess(c.uid, 'p@example.com'));
    }
    if (p === '/auth/v1/logout') return reply(204);
    if (p === '/auth/v1/user') {
      const uid = tokens.get(bearer);
      if (!uid) return reply(401, { msg: 'bad jwt' });
      for (const v of users.values()) if (v.id === uid) v.password = body.password;
      return reply(200, { id: uid });
    }
    if (p.startsWith('/rest/v1/rpc/')) {
      if (bearer !== 'anon-key' && !tokens.has(bearer)) return reply(401, { code: 'PGRST301', message: 'JWT expired' });
      if (p.endsWith('/rl_boom')) return reply(400, { code: 'P0001', message: 'nickname_taken', details: null, hint: null });
      return reply(200, { ok: true, as: bearer === 'anon-key' ? 'anon' : tokens.get(bearer) });
    }
    return reply(404, {});
  };
  return { fetchImpl, log, users, tokens, refresh, codes, down: (v) => { down = v; }, confirm: (email) => { users.get(email).confirmed = true; } };
}
const mkStore = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};
function client(svc, extra = {}) {
  let clock = 1_000_000_000_000;
  const a = A.createAuth({ url: 'https://acct.example.co', anonKey: 'anon-key', providers: ['google', 'github', 'apple', 'twitter'], storage: mkStore(), session: mkStore(), fetchImpl: svc.fetchImpl, origin: 'https://site.example', now: () => clock, ...extra });
  return { a, tick: (s) => { clock += s * 1000; } };
}

await t('with no project configured the client is off and sends nothing', async () => {
  const svc = service();
  const a = A.createAuth({ url: '', anonKey: '', storage: mkStore(), session: mkStore(), fetchImpl: svc.fetchImpl, origin: 'https://site.example' });
  assert.equal(a.enabled, false);
  await assert.rejects(() => a.signIn({ email: 'a@b.co', password: 'x' }), { code: 'unavailable' });
  assert.equal(svc.log.length, 0);
});

await t('only the three real providers are offered', () => {
  const { a } = client(service());
  assert.deepEqual(a.providers, ['google', 'github', 'apple']);
});

await t('sign-up needs the age confirmation and a long enough password, and never reveals if an address exists', async () => {
  const svc = service();
  const { a } = client(svc);
  await assert.rejects(() => a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: false }), { code: 'age_required' });
  await assert.rejects(() => a.signUp({ email: 'a@b.co', password: 'short', ageConfirmed: true }), { code: 'weak_password' });
  assert.equal(svc.log.length, 0, 'nothing sent for invalid input');
  const r1 = await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  const r2 = await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  assert.deepEqual(r1, { status: 'confirm' });
  assert.deepEqual(r2, r1);
  assert.equal(svc.log[0].body.data.age_confirmed, true);
  assert.equal(a.session(), null);
});

await t('sign-in works after confirmation, and errors are mapped to plain codes', async () => {
  const svc = service();
  const { a } = client(svc);
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  await assert.rejects(() => a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' }), { code: 'email_not_confirmed' });
  svc.confirm('a@b.co');
  await assert.rejects(() => a.signIn({ email: 'a@b.co', password: 'wrong-wrong-wrong' }), { code: 'invalid_credentials' });
  await assert.rejects(() => a.signIn({ email: 'nobody@b.co', password: 'wrong-wrong-wrong' }), { code: 'invalid_credentials' });
  const me = await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  assert.equal(me.email, 'a@b.co');
  assert.equal(a.session().email, 'a@b.co');
  assert.ok(!JSON.stringify(a.session()).includes('at'), 'the public view carries no tokens');
});

await t('the provider link uses PKCE and sends the browser back to the account page', async () => {
  const svc = service();
  const { a } = client(svc);
  const link = new URL(await a.providerUrl('github'));
  assert.equal(link.origin + link.pathname, 'https://acct.example.co/auth/v1/authorize');
  assert.equal(link.searchParams.get('provider'), 'github');
  assert.equal(link.searchParams.get('code_challenge_method'), 's256');
  assert.match(link.searchParams.get('code_challenge'), /^[A-Za-z0-9_-]{43}$/);
  assert.equal(link.searchParams.get('redirect_to'), 'https://site.example/games/levelup/account.html?flow=oauth');
  await assert.rejects(() => a.providerUrl('twitter'), { code: 'unavailable' });
});

await t('a returning one-time code is traded for a session only with this browser\'s secret', async () => {
  const svc = service();
  const { a } = client(svc);
  const link = new URL(await a.providerUrl('google'));
  svc.codes.set('good-code', { uid: 'p1', challenge: link.searchParams.get('code_challenge') });
  const r = await a.handleReturn('?flow=oauth&code=good-code');
  assert.deepEqual(r, { handled: true, ok: true, flow: 'oauth' });
  assert.ok(a.session());
  // The secret is single use.
  const again = await a.handleReturn('?flow=oauth&code=good-code');
  assert.equal(again.ok, false);
  assert.equal(again.code, 'other_device');
  // A code planted by someone else cannot be used without the secret.
  const svc2 = service();
  const c2 = client(svc2);
  await c2.a.providerUrl('google');
  svc2.codes.set('stolen', { uid: 'victim', challenge: 'someone-elses-challenge' });
  const bad = await c2.a.handleReturn('?flow=oauth&code=stolen');
  assert.equal(bad.ok, false);
  assert.equal(c2.a.session(), null);
  // No code: nothing to do. An error from the provider is reported, not thrown.
  assert.equal((await c2.a.handleReturn('')).handled, false);
  assert.equal((await c2.a.handleReturn('?error=access_denied&error_description=nope')).code, 'link_failed');
});

await t('a token is refreshed shortly before it runs out, once even for parallel calls', async () => {
  const svc = service();
  const { a, tick } = client(svc);
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  const first = await a.accessToken();
  assert.equal(await a.accessToken(), first, 'still fresh');
  tick(3600 - 30); // inside the last minute
  const [x, y] = await Promise.all([a.accessToken(), a.accessToken()]);
  assert.notEqual(x, first);
  assert.equal(x, y);
  assert.equal(svc.log.filter((l) => l.search.includes('refresh_token')).length, 1);
});

await t('a refused refresh signs the player out; a network failure does not', async () => {
  const svc = service();
  const { a, tick } = client(svc);
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  tick(4000);
  svc.down(true);
  await assert.rejects(() => a.accessToken(), { code: 'network' });
  assert.ok(a.session(), 'still signed in while offline');
  svc.down(false);
  svc.refresh.clear();
  assert.equal(await a.accessToken(), null);
  assert.equal(a.session(), null);
});

await t('database calls: signed in as the player, anonymous on request, errors become codes', async () => {
  const svc = service();
  const { a } = client(svc);
  await assert.rejects(() => a.rpc('rl_my_profile'), { code: 'not_signed_in' });
  assert.equal((await a.rpc('rl_leaderboard', {}, { anonymous: true })).as, 'anon');
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  assert.notEqual((await a.rpc('rl_my_profile')).as, 'anon');
  await assert.rejects(() => a.rpc('rl_boom'), { code: 'nickname_taken' });
  await assert.rejects(() => a.rpc('rl_x; drop table'), { code: 'bad_request' });
});

await t('sign-out forgets the session on this device even if the service is unreachable', async () => {
  const svc = service();
  const { a } = client(svc);
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  svc.down(true);
  await a.signOut();
  assert.equal(a.session(), null);
  assert.equal(await a.accessToken(), null);
});

await t('changing a password needs a session and a long password', async () => {
  const svc = service();
  const { a } = client(svc);
  await assert.rejects(() => a.setPassword('a-very-long-new-pw'), { code: 'not_signed_in' });
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  await assert.rejects(() => a.setPassword('short'), { code: 'weak_password' });
  await a.setPassword('a-very-long-new-pw');
  assert.equal(svc.users.get('a@b.co').password, 'a-very-long-new-pw');
});

await t('passwords are only ever sent to the sign-in service, never stored', async () => {
  const svc = service();
  const storage = mkStore();
  const session = mkStore();
  const { a } = client(svc, { storage, session });
  await a.signUp({ email: 'a@b.co', password: 'a-long-enough-pw', ageConfirmed: true });
  svc.confirm('a@b.co');
  await a.signIn({ email: 'a@b.co', password: 'a-long-enough-pw' });
  for (const m of [storage._m, session._m]) for (const v of m.values()) assert.ok(!v.includes('a-long-enough-pw'));
});

console.log(n, 'passed');
