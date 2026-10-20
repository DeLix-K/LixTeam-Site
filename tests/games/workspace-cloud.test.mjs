import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const C = await import(pathToFileURL(GAMES + 'workspace/cloud.js').href);
const { CLOUD_BUCKET: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/cloud-bucket.js').href);

let n = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log('  ok  ', name);
    n++;
  } catch (e) {
    console.log('  FAIL', name, '\n      ', e.message);
    process.exitCode = 1;
  }
};
const m = (h, mi = 0) => h * 60 + mi;
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);
const fix = (st, ...ids) => ids.forEach((id) => assert.equal(E.cloudFix(S, st, id).ok, true, id));
const now = (st) => C.stateNow(S, st);
const open = (st) => E.stateChecks(S, st).threats.filter((x) => !x.blocked).map((x) => x.id);
const broken = (st) => E.stateChecks(S, st).services.filter((x) => !x.ok).map((x) => x.id);
const REF = S.cloud.reference;
const GOOD = { entry: ['public-bucket', 'leaked-key'], first: '14:02', data: ['exports', 'orders', 'secrets'], excess: ['svc-etl', 'grp-dev', 'role-break-glass'], root: 'no-guardrails', followup: ['block-public-default', 'short-lived', 'secret-scanning', 'least-privilege'], summary: 'The exports bucket was public and the ETL key leaked. An attacker read the exports, secrets and orders. I closed the bucket, rotated the key and narrowed three grants.' };
const PINS = ['e-cfg', 'e-repo', 'e-anon-first', 'e-key-sec', 'e-key-db'];
const ACTS = [['notify', 'Head of engineering'], ['notify', 'Data protection officer']];
function play({ fixes = REF, pins = PINS, acts = ACTS, report = GOOD, wait = 0 } = {}) {
  const st = E.newRun(S);
  for (const f of fixes) E.cloudFix(S, st, f);
  for (const [a, tg] of acts) E.perform(S, st, a, tg);
  for (const p of pins) E.pin(st, p);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator, including its reference fixes', () => {
  assert.deepEqual(E.problems(S), []);
});
t('at the start every business need works and every threat is open', () => {
  const st = E.newRun(S);
  assert.deepEqual(broken(st), []);
  assert.deepEqual(open(st).sort(), ['breakglass', 'dev', 'etl', 'exports', 'orders', 'secrets'].sort());
});
t('the public can read the exports and the website assets, and nothing else', () => {
  const st = E.newRun(S);
  const reach = C.whatCanReach(S, now(st), C.PUBLIC).map((x) => x.resource).sort();
  assert.deepEqual(reach, ['bkt-exports', 'bkt-site']);
});
t('a developer reaches administrator through group membership and the break-glass role, and the path says how', () => {
  const st = E.newRun(S);
  const path = C.explain(S, now(st), 'jamie', 'db-orders', 'admin');
  assert.ok(path);
  const text = path.join(' | ');
  assert.match(text, /member of grp-dev/);
  assert.match(text, /may assume role-break-glass/);
  assert.match(text, /Break-glass: full access/);
});
t('the attacker holds the public plus the leaked key, so reaches the exports, the secrets and the orders', () => {
  const st = E.newRun(S);
  assert.deepEqual(C.attackerHolds(S, now(st)), ['PUBLIC', 'LEAK:svc-etl']);
  for (const r of ['bkt-exports', 'sec-prod', 'db-orders']) assert.ok(C.can(S, now(st), C.ATTACKER, r, 'read'), r);
  assert.ok(!C.can(S, now(st), C.PUBLIC, 'bkt-site', 'write'), 'the public alone cannot write to the site bucket');
});
t('rotating the leaked key shuts the attacker out of the orders and secrets but not the public bucket, and the ETL job still works', () => {
  const st = E.newRun(S);
  fix(st, 'fx-etl-rotate');
  assert.ok(!C.can(S, now(st), C.ATTACKER, 'db-orders', 'read'));
  assert.ok(!C.can(S, now(st), C.ATTACKER, 'sec-prod', 'read'));
  assert.ok(C.can(S, now(st), C.ATTACKER, 'bkt-exports', 'read'), 'the bucket is still public');
  assert.deepEqual(broken(st), []);
  fix(st, 'fx-exports-private');
  assert.ok(!open(st).includes('exports'));
});
t('blocking public access alone leaves the leaked key reading the exports', () => {
  const st = E.newRun(S);
  fix(st, 'fx-exports-private');
  assert.ok(open(st).includes('exports'), 'the key still works');
});
t('narrowing the ETL grant keeps its job working and closes its excess, but does not stop a leaked key reading what it legitimately reads', () => {
  const st = E.newRun(S);
  fix(st, 'fx-g4-narrow');
  assert.deepEqual(broken(st), []);
  assert.ok(!open(st).includes('etl'));
  assert.ok(!open(st).includes('orders') && !open(st).includes('secrets'), 'the leaked key no longer reaches orders or secrets');
  assert.ok(open(st).includes('exports'), 'but it still reads the exports');
});
t('removing the ETL grant or disabling the account stops the attacker and breaks the ETL job', () => {
  for (const id of ['fx-g4-remove', 'fx-etl-disable']) {
    const st = E.newRun(S);
    fix(st, id);
    assert.deepEqual(broken(st).sort(), ['n-etl-read', 'n-etl-write'], id);
  }
});
t('reducing the ETL grant to read on everything still lets it read backups and orders', () => {
  const st = E.newRun(S);
  fix(st, 'fx-g4-readall');
  assert.ok(open(st).includes('etl'));
  assert.deepEqual(broken(st), ['n-etl-write']);
});
t('developers: narrowing works; removing or read-only break them (once the break-glass back door is shut)', () => {
  const a = E.newRun(S);
  fix(a, 'fx-g5-narrow');
  assert.ok(open(a).includes('dev'), 'the break-glass route still gives developers everything');
  fix(a, 'fx-t4-remove');
  assert.ok(!open(a).includes('dev'));
  assert.deepEqual(broken(a), []);
  const b = E.newRun(S);
  fix(b, 'fx-g5-remove', 'fx-t4-remove');
  assert.deepEqual(broken(b).sort(), ['n-dev-bkt', 'n-dev-web']);
  const c = E.newRun(S);
  fix(c, 'fx-g5-readonly', 'fx-t4-remove');
  assert.ok(open(c).includes('dev'), 'read-only everywhere still reads the secrets');
  assert.deepEqual(broken(c).sort(), ['n-dev-bkt', 'n-dev-web']);
  const d = E.newRun(S);
  fix(d, 'fx-g5-remove');
  assert.deepEqual(broken(d), [], 'while the break-glass role is open, developers are never short of access');
});
t('the break-glass role: removing the trust closes it, requiring MFA closes it while Jamie has none, and turning MFA on for Jamie reopens it', () => {
  const a = E.newRun(S);
  fix(a, 'fx-t4-remove');
  assert.ok(!open(a).includes('breakglass') || open(a).includes('breakglass') === false);
  const b = E.newRun(S);
  fix(b, 'fx-t4-mfa');
  assert.ok(!open(b).includes('breakglass'));
  assert.ok(C.can(S, now(b), 'kit', 'db-orders', 'admin'), 'Kit has MFA, so Kit can still assume it');
  fix(b, 'fx-jamie-mfa');
  assert.ok(open(b).includes('breakglass'), 'Jamie now has MFA, so the route is open again');
});
t('blocking the website assets breaks the website; deleting the exports breaks three needs', () => {
  const a = E.newRun(S);
  fix(a, 'fx-site-private');
  assert.deepEqual(broken(a), ['n-site']);
  const b = E.newRun(S);
  fix(b, 'fx-exports-delete');
  assert.deepEqual(broken(b).sort(), ['n-alex', 'n-etl-read', 'n-exp-write']);
});
t('only one fix may stand on a target, and undo frees it', () => {
  const st = E.newRun(S);
  fix(st, 'fx-g4-remove');
  const r = E.cloudFix(S, st, 'fx-g4-narrow');
  assert.equal(r.ok, false);
  assert.match(r.text, /Undo it first/);
  assert.equal(E.cloudUndo(S, st, 'fx-g4-remove').ok, true);
  assert.deepEqual(broken(st), []);
  fix(st, 'fx-g4-narrow');
  assert.equal(E.cloudFix(S, st, 'fx-g4-narrow').ok, false, 'already applied');
  assert.equal(E.cloudUndo(S, st, 'fx-nothing').ok, false);
  assert.equal(E.cloudFix(S, st, 'nope').ok, false);
});
t('each fix costs time, and an undo costs a minute', () => {
  const st = E.newRun(S);
  const c = st.clock;
  fix(st, 'fx-exports-private');
  assert.equal(st.clock, c + E.COSTS.rule);
  E.cloudUndo(S, st, 'fx-exports-private');
  assert.equal(st.clock, c + E.COSTS.rule + E.COSTS.tweak);
});
t('a fix stops what comes next and never rewrites the past, and the stopped calls show as denied', () => {
  const st = E.newRun(S);
  E.advance(st, 12); // 14:42
  assert.ok(has(st, 'e-anon-' + m(14, 35)));
  fix(st, 'fx-exports-private'); // takes effect at 14:42
  E.advance(st, 90);
  assert.ok(has(st, 'e-anon-' + m(14, 35)), 'earlier downloads stay in the log');
  assert.ok(!has(st, 'e-anon-' + m(14, 45)), 'later ones never happened');
  const d = E.visibleEvents(S, st).find((e) => e.id === 'deny-e-anon-' + m(14, 45));
  assert.ok(d && d.synthetic && /Access denied/.test(d.summary));
});
t('an undone fix lets later calls through again', () => {
  const st = E.newRun(S);
  fix(st, 'fx-exports-private');
  E.cloudUndo(S, st, 'fx-exports-private'); // back at 14:34
  E.advance(st, 60);
  assert.ok(has(st, 'e-anon-' + m(15, 5)));
});
t('rotating the key stops the leaked-key calls but not the ETL job\'s own, which come from the office address', () => {
  const st = E.newRun(S);
  fix(st, 'fx-etl-rotate');
  E.advance(st, 90);
  assert.ok(!has(st, 'e-key-snap-' + m(15, 20)));
  assert.ok(E.visibleEvents(S, st).some((e) => e.id.startsWith('o-etl-') && e.t > m(15, 0)), 'the legitimate job carries on');
});
t('the five investigation events are all visible at the start', () => {
  const st = E.newRun(S);
  for (const id of PINS) assert.ok(has(st, id), id);
});
t('searches understand actor, action, resource, src and auth', () => {
  const st = E.newRun(S);
  assert.ok(E.search(S, st, 'actor:svc-etl src:203.0.113.60').length >= 2);
  assert.ok(E.search(S, st, 'resource:bkt-exports actor:anonymous').some((e) => e.id === 'e-anon-first'));
  assert.deepEqual(E.search(S, st, 'type:config').map((e) => e.id), ['e-cfg']);
  assert.ok(E.search(S, st, 'auth:old').every((e) => e.fields.auth.includes('old')));
});
t('findings: all open at the start, the by-design one stays open, hygiene ones close with their own fix', () => {
  const st = E.newRun(S);
  const f = () => Object.fromEntries(C.findingStatus(S, now(st)).map((x) => [x.id, x.closed]));
  assert.ok(Object.values(f()).every((c) => !c));
  fix(st, ...REF);
  assert.equal(f()['f-public'], true);
  assert.equal(f()['f-key'], true);
  assert.equal(f()['f-site'], false, 'public by design: leave it');
  assert.equal(f()['f-enc'], false);
  fix(st, 'fx-exports-encrypt', 'fx-jamie-mfa');
  assert.equal(f()['f-enc'], true);
  assert.equal(f()['f-mfa'], true);
});

t('the reference fixes earn gold with no disruption', () => {
  const { g } = play();
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.disruption, 0);
});
t('doing nothing lets seven chunks of data out and the medal is capped', () => {
  const { g, st } = play({ fixes: [], wait: 120 });
  assert.equal(E.consequences(S, st, S.horizon).length, 7);
  assert.ok(g.tier <= 1);
  assert.ok(g.lines.some((l) => /Customer data downloaded from the public bucket \(4 times\)/.test(l.label)));
  assert.ok(g.lines.some((l) => /Orders data exported with the leaked key \(3 times\)/.test(l.label)));
});
t('a quick partial response (block public and rotate) stops the leaks but leaves the permissions wide', () => {
  const { g, st } = play({ fixes: ['fx-exports-private', 'fx-etl-rotate'], wait: 120 });
  assert.equal(E.consequences(S, st, S.horizon).length, 0);
  assert.ok(g.lines.some((l) => /Still open: the ETL account/.test(l.label)));
  assert.ok(g.total < 95, 'total ' + g.total);
});
t('closing everything with blunt fixes stops the attack but costs the business', () => {
  const clean = play().g;
  const blunt = play({ fixes: ['fx-exports-delete', 'fx-etl-disable', 'fx-g5-remove', 'fx-site-private', 'fx-t4-remove'] }).g;
  assert.ok(blunt.disruption >= 20, 'disruption ' + blunt.disruption);
  assert.ok(blunt.total < clean.total - 15, `${blunt.total} vs ${clean.total}`);
});
t('the traps (read-only everywhere, read on everything) do not earn the points', () => {
  const { g } = play({ fixes: ['fx-exports-private', 'fx-etl-rotate', 'fx-g4-readall', 'fx-g5-readonly', 'fx-t4-mfa'] });
  assert.ok(g.lines.some((l) => /Still open: the ETL account/.test(l.label)));
  assert.ok(g.lines.some((l) => /Still open: developers/i.test(l.label)));
  assert.ok(g.lines.some((l) => /Closed: a developer becoming/.test(l.label)), 'requiring MFA does close the break-glass route while Jamie has none');
  assert.ok(g.tier < 3);
});
t('the report: wrong entry, time and data lose points; no pinned evidence is mostly a guess', () => {
  const bad = play({ report: { ...GOOD, entry: ['weak-password'], first: '11:12', data: ['backups'], excess: ['svc-ci'], root: 'provider', followup: ['disable-logging'] } }).g;
  assert.ok(bad.parts.report <= 5, 'report ' + bad.parts.report);
  const guess = play({ pins: [] }).g;
  assert.ok(guess.parts.report <= 14.1, 'report ' + guess.parts.report);
});
t('grading adds up to 100, the needs outweigh the cap on disruption, and every debrief question has one right answer', () => {
  assert.equal(S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal, 100);
  assert.ok(S.cloud.needs.reduce((a, x) => a + x.weight, 0) >= 40);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
