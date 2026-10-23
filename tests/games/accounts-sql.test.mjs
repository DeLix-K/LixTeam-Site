// Runs supabase/rootline/001_accounts.sql and 002_missions.sql in a real (in-process, WASM) Postgres and checks the
// rules that matter: who can see what, nickname rules, the server-side XP and rate limits, moderation and deletion.
//
// It needs the PGlite package, which is deliberately NOT a dependency of the site. To run it:
//   npm install --no-save @electric-sql/pglite      (or set PGLITE_DIR to a folder that has it in node_modules)
// Without it the test says so and exits cleanly. A passing run here is a test against stand-ins for Supabase's
// auth schema and roles, not against Supabase itself.
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
  console.log('  skipped: @electric-sql/pglite is not installed (see the top of this file)');
  console.log('0 passed');
  process.exit(0);
}

const db = new PGlite();
// Stand-ins for what Supabase provides: roles, auth.users and auth.uid() (read from a session setting).
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated;
  grant usage on schema auth to anon, authenticated;
`);
await db.exec(readFileSync(ROOT + 'supabase/rootline/001_accounts.sql', 'utf8'));
await db.exec(readFileSync(ROOT + 'supabase/rootline/002_missions.sql', 'utf8'));
// Run it twice: the files promise to be repeatable.
await db.exec(readFileSync(ROOT + 'supabase/rootline/001_accounts.sql', 'utf8'));
await db.exec(readFileSync(ROOT + 'supabase/rootline/002_missions.sql', 'utf8'));

const U = {
  ann: '00000000-0000-0000-0000-00000000000a',
  ben: '00000000-0000-0000-0000-00000000000b',
  cat: '00000000-0000-0000-0000-00000000000c',
};
for (const [k, id] of Object.entries(U)) await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${k}@example.com`]);

// Call a function as a role and user, the way PostgREST does.
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
const call = async (uid, sql, params) => (await as(uid ? 'authenticated' : 'anon', uid, sql, params))[0];
const val = async (uid, fn, params = []) => Object.values(await call(uid, `select public.${fn}(${params.map((_, i) => '$' + (i + 1)).join(', ')}) as v`, params))[0];
const fails = async (code, fn) => {
  try {
    await fn();
  } catch (e) {
    assert.equal(e.message, code, `expected ${code}, got ${e.message}`);
    return;
  }
  assert.fail(`expected ${code}, but it succeeded`);
};

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

const missions = (await db.query('select * from public.rl_missions order by id')).rows;
const normal = missions.filter((m) => !m.is_exam);
const exam = missions.find((m) => m.is_exam);
const ageOk = true;
// Pretend time has passed for the rate limits.
const rewind = (uid, secs) => db.query(`update public.rl_profiles set last_submit_at = now() - ($2 || ' seconds')::interval where user_id = $1`, [uid, String(secs)]);

await t('the mission table has every game mission with sane rewards', async () => {
  assert.ok(missions.length > 100);
  for (const m of missions) assert.ok(m.xp1 >= 0 && m.xp2 >= m.xp1 && m.xp3 >= m.xp2, m.id);
  assert.ok(exam && exam.xp1 === 0 && exam.xp2 > 0);
});

await t('nobody can read or write the tables directly', async () => {
  for (const role of ['anon', 'authenticated']) {
    for (const table of ['rl_profiles', 'rl_results', 'rl_gains', 'rl_reports', 'rl_config', 'rl_blocked_terms']) {
      await assert.rejects(() => as(role, U.ann, `select * from public.${table}`), /permission denied/);
    }
    await assert.rejects(() => as(role, U.ann, `insert into public.rl_profiles (user_id, nickname, age_confirmed_at) values ('${U.ann}', 'Hacker', now())`), /permission denied/);
  }
});

await t('signed-out callers cannot use the account functions, but can read the board', async () => {
  await assert.rejects(() => as('anon', null, `select public.rl_submit_progress('{}'::jsonb)`), /permission denied/);
  await assert.rejects(() => as('anon', null, `select public.rl_my_profile()`), /permission denied/);
  await assert.rejects(() => as('anon', null, `select public.rl_delete_my_account()`), /permission denied/);
  const rows = await as('anon', null, `select * from public.rl_leaderboard('all', null, 10)`);
  assert.deepEqual(rows, []);
});

await t('the age confirmation is required, and the nickname rules hold', async () => {
  await fails('age_required', () => val(U.ann, 'rl_create_profile', ['Ann_Analyst', false, true]));
  await fails('age_required', () => val(U.ann, 'rl_create_profile', ['Ann_Analyst', null, true]));
  for (const bad of ['ab', 'x'.repeat(21), 'has space', '-lead', 'emoji😀', "o'brien", '']) {
    await fails('nickname_invalid', () => val(U.ann, 'rl_create_profile', [bad, ageOk, true]));
  }
  for (const blocked of ['Admin', 'RootLine_Staff', 'sh1t_head', 'f.u.c.k', 'NaZi99', 'moderat0r']) {
    await fails('nickname_blocked', () => val(U.ann, 'rl_create_profile', [blocked, ageOk, true]));
  }
});

await t('a nickname is unique regardless of case, and a profile is made once', async () => {
  const mine = await val(U.ann, 'rl_create_profile', ['Ann_Analyst', ageOk, true]);
  assert.equal(mine.nickname, 'Ann_Analyst');
  assert.equal(mine.xp, 0);
  await fails('nickname_taken', () => val(U.ben, 'rl_create_profile', ['ann_analyst', ageOk, true]));
  await fails('profile_exists', () => val(U.ann, 'rl_create_profile', ['Another', ageOk, true]));
  assert.equal(await val(U.ben, 'rl_check_nickname', ['ANN_ANALYST']), 'taken');
  assert.equal(await val(U.ben, 'rl_check_nickname', ['Ben_Blue']), 'ok');
  assert.equal(await val(U.ben, 'rl_check_nickname', ['no']), 'invalid');
  assert.equal(await val(U.ben, 'rl_check_nickname', ['admin1']), 'blocked');
  await val(U.ben, 'rl_create_profile', ['Ben_Blue', ageOk, true]);
  await val(U.cat, 'rl_create_profile', ['Cat.Cyber', ageOk, true]);
});

await t('a profile is needed before progress can be sent', async () => {
  await db.query(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000dd', 'd@example.com')`);
  await fails('profile_required', () => val('00000000-0000-0000-0000-0000000000dd', 'rl_submit_progress', [{ [normal[0].id]: 1 }]));
});

await t('nickname changes have a cooldown, and respect the same rules', async () => {
  const first = await val(U.ann, 'rl_set_nickname', ['Ann_Analyst']); // same name: no change counted
  assert.equal(first.nickname, 'Ann_Analyst');
  await val(U.ann, 'rl_set_nickname', ['Ann_Renamed']);
  await fails('nickname_cooldown', () => val(U.ann, 'rl_set_nickname', ['Ann_Again']));
  await db.query(`update public.rl_profiles set nickname_changed_at = now() - interval '8 days' where user_id = $1`, [U.ann]);
  await fails('nickname_blocked', () => val(U.ann, 'rl_set_nickname', ['Admin_Ann']));
  await fails('nickname_taken', () => val(U.ann, 'rl_set_nickname', ['ben_blue']));
  await val(U.ann, 'rl_set_nickname', ['Ann_Analyst']);
});

await t('the server works out XP itself and rejects malformed medals', async () => {
  const m = normal[0];
  const r = await val(U.ann, 'rl_submit_progress', [{ [m.id]: 2 }]);
  assert.equal(r.accepted, 1);
  assert.equal(r.xp, m.xp2);
  assert.equal(r.first_sync, true);
  await rewind(U.ann, 60);
  for (const bad of [{ [m.id]: 0 }, { [m.id]: 4 }, { [m.id]: '3' }, { [m.id]: 2.5 }, { [m.id]: null }, { [m.id]: true }, [], 'x']) {
    await fails('bad_request', () => val(U.ann, 'rl_submit_progress', [JSON.stringify(bad)]));
    await rewind(U.ann, 60);
  }
});

await t('medals only go up, unknown missions are ignored, repeats earn nothing', async () => {
  const m = normal[0];
  await rewind(U.ann, 60);
  let r = await val(U.ann, 'rl_submit_progress', [{ [m.id]: 1, 'not-a-mission': 3 }]);
  assert.equal(r.accepted, 0);
  assert.equal(r.unknown, 1);
  assert.equal(r.xp, m.xp2); // not lowered
  await rewind(U.ann, 60);
  r = await val(U.ann, 'rl_submit_progress', [{ [m.id]: 3 }]);
  assert.equal(r.accepted, 1);
  assert.equal(r.xp, m.xp3);
  assert.equal(r.golds, 1);
});

await t('a sync cannot be sent more than once every 15 seconds', async () => {
  await fails('too_fast', () => val(U.ann, 'rl_submit_progress', [{ [normal[1].id]: 1 }]));
});

await t('an exam at bronze is not a pass and earns nothing', async () => {
  const r = await val(U.ben, 'rl_submit_progress', [{ [exam.id]: 1 }]);
  assert.equal(r.xp, 0);
  assert.equal(r.passed, 0);
  await rewind(U.ben, 60);
  const r2 = await val(U.ben, 'rl_submit_progress', [{ [exam.id]: 2 }]);
  assert.equal(r2.xp, exam.xp2);
  assert.equal(r2.passed, 1);
});

await t('after the one-off import, an hour allows at most 15 improvements and the rest wait', async () => {
  // Cat's first sync is the import: it is not limited.
  const big = Object.fromEntries(normal.slice(0, 40).map((m) => [m.id, 1]));
  const imp = await val(U.cat, 'rl_submit_progress', [big]);
  assert.equal(imp.first_sync, true);
  assert.equal(imp.accepted, 40);
  assert.equal(imp.deferred, 0);
  // Later play is limited.
  await rewind(U.cat, 60);
  const upgrades = Object.fromEntries(normal.slice(0, 40).map((m) => [m.id, 2]));
  const r = await val(U.cat, 'rl_submit_progress', [upgrades]);
  assert.equal(r.accepted, 15);
  assert.equal(r.deferred, 25);
  // The deferred ones are not lost: they go through in later hours.
  await rewind(U.cat, 60);
  await db.query(`update public.rl_gains set at = now() - interval '2 hours' where user_id = $1`, [U.cat]);
  const later = await val(U.cat, 'rl_submit_progress', [upgrades]);
  assert.equal(later.accepted, 15, 'another hour, another 15');
  assert.equal(later.deferred, 10);
});

await t('XP in a rolling 24 hours is capped', async () => {
  await rewind(U.cat, 60);
  await db.query(`update public.rl_gains set at = now() - interval '2 hours' where user_id = $1`, [U.cat]);
  // Pretend 2990 XP was already earned in the last day, then ask for more than 10.
  await db.query(`insert into public.rl_gains (user_id, mission_id, tier, xp, source, at) values ($1, $2, 1, 2990, 'play', now() - interval '2 hours')`, [U.cat, normal[0].id]);
  const target = normal.find((m) => m.xp2 > 10 && m.xp3 > 10 && !normal.slice(0, 40).includes(m));
  const r = await val(U.cat, 'rl_submit_progress', [{ [target.id]: 3 }]);
  assert.equal(r.accepted, 0);
  assert.equal(r.deferred, 1);
  await db.query(`delete from public.rl_gains where xp = 2990 and user_id = $1`, [U.cat]);
});

await t('the board shows nicknames and totals only, ranked, with the player marked', async () => {
  const rows = await as('authenticated', U.ben, `select * from public.rl_leaderboard('all', null, 50)`);
  assert.ok(rows.length >= 3);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['golds', 'is_me', 'nickname', 'passed', 'pos', 'xp']);
  for (let i = 1; i < rows.length; i++) assert.ok(Number(rows[i - 1].xp) >= Number(rows[i].xp));
  assert.equal(rows.filter((r) => r.is_me).length, 1);
  assert.equal(rows.find((r) => r.is_me).nickname, 'Ben_Blue');
  const anon = await as('anon', null, `select * from public.rl_leaderboard('all', null, 50)`);
  assert.ok(anon.every((r) => r.is_me === false));
  assert.ok(!JSON.stringify(anon).includes('example.com'));
});

await t('the week board counts play, not the one-off import', async () => {
  const wk = await as('anon', null, `select * from public.rl_leaderboard('week', null, 50)`);
  const names = wk.map((r) => r.nickname);
  assert.ok(names.includes('Ann_Analyst'), 'Ann played after her import');
  assert.ok(names.includes('Ben_Blue'));
  const ann = wk.find((r) => r.nickname === 'Ann_Analyst');
  assert.equal(Number(ann.xp), normal[0].xp3 - normal[0].xp2, 'only the improvement after the import');
  await assert.rejects(() => as('anon', null, `select * from public.rl_leaderboard('year', null, 5)`), /bad_request/);
});

await t('the path filter only counts missions on that path', async () => {
  const path = normal[0].path;
  const rows = await as('anon', null, `select * from public.rl_leaderboard('all', $1, 50)`, [path]);
  assert.ok(rows.length > 0);
  const none = await as('anon', null, `select * from public.rl_leaderboard('all', 'no-such-path', 50)`);
  assert.equal(none.length, 0);
});

await t('opting out of the board, and operator hiding, both remove a player', async () => {
  await val(U.ann, 'rl_set_visibility', [false]);
  let names = (await as('anon', null, `select nickname from public.rl_leaderboard('all', null, 50)`)).map((r) => r.nickname);
  assert.ok(!names.includes('Ann_Analyst'));
  await val(U.ann, 'rl_set_visibility', [true]);
  await db.query(`update public.rl_profiles set hidden = true where user_id = $1`, [U.ben]);
  names = (await as('anon', null, `select nickname from public.rl_leaderboard('all', null, 50)`)).map((r) => r.nickname);
  assert.ok(!names.includes('Ben_Blue'));
  assert.ok(names.includes('Ann_Analyst'));
  await db.query(`update public.rl_profiles set hidden = false where user_id = $1`, [U.ben]);
});

await t('reports are stored, limited and cannot target yourself', async () => {
  await call(U.ann, `select public.rl_report_player('ben_blue', 'offensive')`);
  assert.equal((await db.query('select count(*)::int as c from public.rl_reports')).rows[0].c, 1);
  await fails('bad_request', () => call(U.ann, `select public.rl_report_player('Ann_Analyst', 'other')`));
  await fails('bad_request', () => call(U.ann, `select public.rl_report_player('Ben_Blue', 'spam')`));
  await fails('not_found', () => call(U.ann, `select public.rl_report_player('nobody_here', 'other')`));
  for (let i = 0; i < 4; i++) await call(U.ann, `select public.rl_report_player('Cat.Cyber', 'cheating')`);
  await fails('report_limit', () => call(U.ann, `select public.rl_report_player('Cat.Cyber', 'cheating')`));
});

await t('export returns your data and nothing of anyone else', async () => {
  const data = await val(U.ann, 'rl_export_my_data');
  assert.equal(data.profile.nickname, 'Ann_Analyst');
  assert.equal(data.results.length, 1);
  assert.equal(data.reports_filed, 5);
  const text = JSON.stringify(data);
  assert.ok(!text.includes('Ben_Blue') && !text.includes('Cat.Cyber') && !text.includes('example.com'));
});

await t('delete removes the data, and the login only when the operator switched that on', async () => {
  assert.equal(await val(U.cat, 'rl_delete_my_account'), 'data_deleted');
  assert.equal((await db.query('select count(*)::int as c from public.rl_results where user_id = $1', [U.cat])).rows[0].c, 0);
  assert.equal((await db.query('select count(*)::int as c from public.rl_profiles where user_id = $1', [U.cat])).rows[0].c, 0);
  assert.equal((await db.query('select count(*)::int as c from public.rl_gains where user_id = $1', [U.cat])).rows[0].c, 0);
  assert.equal((await db.query('select count(*)::int as c from auth.users where id = $1', [U.cat])).rows[0].c, 1, 'login kept by default');
  await db.query(`update public.rl_config set value = 'true' where key = 'allow_auth_user_delete'`);
  assert.equal(await val(U.ben, 'rl_delete_my_account'), 'account_deleted');
  assert.equal((await db.query('select count(*)::int as c from auth.users where id = $1', [U.ben])).rows[0].c, 0);
  const names = (await as('anon', null, `select nickname from public.rl_leaderboard('all', null, 50)`)).map((r) => r.nickname);
  assert.ok(!names.includes('Ben_Blue') && !names.includes('Cat.Cyber'));
});

console.log(n, 'passed');
