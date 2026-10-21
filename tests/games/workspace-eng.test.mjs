import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const X = await import(pathToFileURL(GAMES + 'workspace/eng.js').href);
const { ENG_TICKETS: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/eng-tickets.js').href);

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
const REF = S.eng.reference;
const GOOD = { worst: 'debug', tradeoffs: ['tls13', 'cors-none', 'private-storage', 'secret-store', 'low-rate'], rollback: 'redeploy', residual: ['tls-provider', 'rotate', 'purge'], summary: 'I closed the debug console and the database path, moved the password to the secret store, kept TLS 1.2 and signed links, and released through the pipeline. Roll back by redeploying the previous release.' };

function apply(st, change) {
  for (const [k, v] of Object.entries(change.cfg || {})) assert.equal(E.engSet(S, st, k, v).ok, true, k);
  for (const [k, v] of Object.entries(change.edges || {})) assert.equal(E.engEdge(S, st, k, v).ok, true, k);
}
function ship(change = REF) {
  const st = E.newRun(S);
  apply(st, change);
  E.engRun(S, st);
  const r = E.engRelease(S, st);
  return { st, r };
}
const failing = (st) => X.runPipeline(S, st.eng.working).stages.filter((x) => x.status === 'fail');

t('the scenario passes the engine validator, including the reference configuration', () => {
  assert.deepEqual(E.problems(S), []);
});
t('the starting configuration is insecure and fully functional', () => {
  const st = E.newRun(S);
  const init = X.initialState(S);
  assert.equal(X.policyScore(S, init), 0);
  assert.equal(X.featureScore(S, init), 25);
  assert.equal(X.policyResults(S, init).filter((p) => p.sev === 'critical').every((p) => !p.ok), true);
  assert.equal(X.sameState(st.eng.working, init), true);
});
t('settings are validated by type, and each edit costs a minute', () => {
  const st = E.newRun(S);
  const c = st.clock;
  assert.equal(E.engSet(S, st, 'web.debug', false).ok, true);
  assert.equal(st.clock, c + 1);
  assert.equal(E.engSet(S, st, 'web.debug', false).same, true);
  assert.equal(st.clock, c + 1, 'no change, no time');
  assert.equal(E.engSet(S, st, 'web.tls_min', '9.9').ok, false);
  assert.equal(E.engSet(S, st, 'web.rate_limit', -5).ok, false);
  assert.equal(E.engSet(S, st, 'web.rate_limit', 'lots').ok, false);
  assert.equal(E.engSet(S, st, 'web.rate_limit', 60).ok, true);
  assert.equal(E.engSet(S, st, 'no.such', 1).ok, false);
  assert.equal(E.engEdge(S, st, 'e99', true).ok, false);
});
t('the working copy is separate from production until a release', () => {
  const st = E.newRun(S);
  E.engSet(S, st, 'web.debug', false);
  assert.equal(E.prodNow(st).cfg['web.debug'], true);
  assert.equal(st.eng.working.cfg['web.debug'], false);
  E.engDiscard(S, st);
  assert.equal(st.eng.working.cfg['web.debug'], true);
});
t('the diff lists what would change, settings and connections', () => {
  const st = E.newRun(S);
  E.engSet(S, st, 'web.debug', false);
  E.engEdge(S, st, 'e5', false);
  const d = X.diff(S, E.prodNow(st), st.eng.working);
  assert.deepEqual(d.map((x) => x.id).sort(), ['e5', 'web.debug']);
});
t('the pipeline stops at the first failing stage: the untouched system fails on the secret in the repository', () => {
  const st = E.newRun(S);
  const run = E.engRun(S, st).run;
  assert.equal(run.passed, false);
  assert.deepEqual(run.stages.map((x) => x.status), ['pass', 'fail', 'skipped', 'skipped', 'skipped']);
  assert.match(run.stages[1].lines[0], /database password/);
});
t('moving the password to the environment passes the scan but not the baseline: it gates on critical and high only', () => {
  const st = E.newRun(S);
  E.engSet(S, st, 'api.db_credentials_source', 'env');
  const f = failing(st);
  assert.equal(f[0].id, 'policy');
  assert.ok(f[0].lines.some((l) => /FAIL \(critical\): The debug console/.test(l)));
  assert.ok(f[0].lines.some((l) => /FAIL \(high\): Database credentials come from the secret store/.test(l)));
  assert.ok(f[0].lines.some((l) => /Warning \(medium\): TLS 1.2 or newer/.test(l)), 'medium and low are only warnings');
});
t('the reference configuration passes every stage and meets the whole baseline and every feature', () => {
  const st = E.newRun(S);
  apply(st, REF);
  const run = E.engRun(S, st).run;
  assert.equal(run.passed, true);
  assert.ok(run.stages.every((x) => x.status === 'pass'));
  assert.equal(X.policyScore(S, st.eng.working), 40);
  assert.equal(X.featureScore(S, st.eng.working), 25);
});
t('trap: TLS 1.3 satisfies the baseline and breaks payment confirmations, which only the integration tests catch', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, cfg: { ...REF.cfg, 'web.tls_min': '1.3' } });
  const f = failing(st);
  assert.equal(f.length, 1);
  assert.equal(f[0].id, 'integration');
  assert.match(f[0].lines.join(' '), /Payment confirmations arrive/);
  assert.match(f[0].lines.join(' '), /TLS 1\.2 or older/);
  assert.equal(X.policyResults(S, st.eng.working).find((p) => p.id === 'P6').ok, true);
});
t('trap: blocking all cross-origin requests breaks the partner widget', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, cfg: { ...REF.cfg, 'web.cors_origins': 'none' } });
  assert.match(failing(st)[0].lines.join(' '), /partner/);
});
t('trap: private storage without signed links breaks ticket downloads, and signed links fix it', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, cfg: { ...REF.cfg, 'storage.signed_urls': false } });
  assert.match(failing(st)[0].lines.join(' '), /ticket PDFs/);
  E.engSet(S, st, 'storage.signed_urls', true);
  assert.equal(failing(st).length, 0);
});
t('trap: the secret store without a connection to it stops the API starting, caught at staging', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, edges: { ...REF.edges, e7: false } });
  const f = failing(st);
  assert.equal(f[0].id, 'staging');
  assert.match(f[0].lines[0], /secret store/);
});
t('trap: a very low login rate limit meets the baseline and breaks browsing', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, cfg: { ...REF.cfg, 'web.rate_limit': 5 } });
  assert.equal(X.policyResults(S, st.eng.working).find((p) => p.id === 'P9').ok, true);
  assert.match(failing(st)[0].lines.join(' '), /browse and book/);
  E.engSet(S, st, 'web.rate_limit', 60);
  assert.equal(failing(st).length, 0);
});
t('a pipeline run costs eight minutes and a release four', () => {
  const st = E.newRun(S);
  apply(st, REF);
  const c = st.clock;
  E.engRun(S, st);
  assert.equal(st.clock, c + 8);
  E.engRelease(S, st);
  assert.equal(st.clock, c + 12);
});
t('a normal release needs a pipeline pass on exactly this configuration; any later edit invalidates it', () => {
  const st = E.newRun(S);
  apply(st, REF);
  assert.equal(E.engRelease(S, st).ok, false, 'no run yet');
  E.engRun(S, st);
  E.engSet(S, st, 'web.hsts', false);
  assert.equal(E.engRelease(S, st).ok, false, 'edited after the run');
  E.engSet(S, st, 'web.hsts', true);
  assert.equal(E.engRelease(S, st).ok, true);
  assert.equal(E.engRelease(S, st).ok, false, 'nothing has changed');
});
t('a failed run cannot be released', () => {
  const st = E.newRun(S);
  E.engSet(S, st, 'web.debug', false);
  E.engRun(S, st);
  assert.equal(E.engRelease(S, st).ok, false);
});
t('a forced release skips the pipeline, and what it breaks is logged and costs the business', () => {
  const st = E.newRun(S);
  apply(st, { cfg: { 'web.debug': false, 'web.tls_min': '1.3' }, edges: { e5: false } });
  const r = E.engRelease(S, st, true);
  assert.equal(r.ok, true);
  assert.equal(r.forced, true);
  assert.match(r.text, /broke 1 feature/);
  assert.equal(st.disruption, 2.5);
  assert.equal(st.eng.forced, 1);
});
t('production changes only when released, and the history keeps every release', () => {
  const st = E.newRun(S);
  apply(st, { cfg: { 'web.debug': false } });
  E.engRelease(S, st, true);
  assert.equal(E.prodAt(st, S.clockStart).cfg['web.debug'], true, 'before the release it was open');
  assert.equal(E.prodNow(st).cfg['web.debug'], false);
  assert.equal(st.eng.prod.length, 2);
});
t('attacks land at their time unless production has been fixed by then', () => {
  const none = E.newRun(S);
  E.advance(none, 4.5 * 60);
  for (const id of ['e-debug', 'e-stuff', 'e-db']) assert.ok(has(none, id), id);
  assert.equal(E.consequences(S, none, S.horizon).length, 3);
  const fixed = E.newRun(S);
  apply(fixed, REF);
  E.engRun(S, fixed);
  E.engRelease(S, fixed);
  E.advance(fixed, 4.5 * 60);
  for (const id of ['e-debug', 'e-stuff', 'e-db']) assert.ok(!has(fixed, id), id);
  assert.equal(E.consequences(S, fixed, S.horizon).length, 0);
});
t('a fix that arrives after the attack does not undo it', () => {
  const st = E.newRun(S);
  E.advance(st, m(15, 45) - m(13, 0));
  apply(st, { cfg: { 'web.debug': false } });
  E.engRelease(S, st, true);
  assert.ok(has(st, 'e-debug'));
  assert.equal(E.consequences(S, st, S.horizon).filter((e) => e.id === 'e-debug').length, 1);
});
t('an emergency release of just the critical fixes stops the debug exploit and the database export', () => {
  const st = E.newRun(S);
  apply(st, { cfg: { 'web.debug': false, 'api.admin_auth': true }, edges: { e5: false } });
  E.engRelease(S, st, true);
  E.advance(st, 4.5 * 60);
  assert.ok(!has(st, 'e-debug') && !has(st, 'e-db'));
  assert.ok(has(st, 'e-stuff'), 'the rate limit was not shipped');
});

t('the reference release earns gold with no harm', () => {
  const { st } = ship();
  E.advance(st, 4.5 * 60);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.parts.evidence, 40);
  assert.equal(g.parts.response, 25);
  assert.equal(g.disruption, 0);
});
t('never releasing keeps the features and fixes nothing: the attacks land and the grade fails', () => {
  const st = E.newRun(S);
  E.advance(st, 4.5 * 60);
  const g = E.grade(S, st, GOOD);
  assert.equal(g.parts.evidence, 0);
  assert.equal(g.parts.triage, 0);
  assert.ok(g.tier <= 1, 'total ' + g.total);
  assert.ok(g.lines.some((l) => /Nothing was released/.test(l.label)));
});
t('shipping every trap through the pipeline is impossible; forcing them breaks features and costs', () => {
  const st = E.newRun(S);
  apply(st, { ...REF, cfg: { ...REF.cfg, 'web.tls_min': '1.3', 'web.cors_origins': 'none', 'storage.signed_urls': false, 'web.rate_limit': 5 } });
  E.engRun(S, st);
  assert.equal(E.engRelease(S, st).ok, false);
  E.engRelease(S, st, true);
  E.advance(st, 4.5 * 60);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.parts.response < 12, 'response ' + g.parts.response);
  assert.ok(g.lines.some((l) => /Forced release broke/.test(l.label)));
  assert.ok(g.tier < 3);
});
t('pipeline discipline: a forced release loses the discipline points; many runs lose a few', () => {
  const clean = E.grade(S, (() => { const x = ship().st; E.advance(x, 4.5 * 60); return x; })(), GOOD);
  assert.equal(clean.parts.triage, 15);
  const forced = E.newRun(S);
  apply(forced, REF);
  E.engRelease(S, forced, true);
  const gf = E.grade(S, forced, GOOD);
  assert.equal(gf.parts.triage, 3 + 0, 'only the run-count point, no pipeline points');
  const many = E.newRun(S);
  apply(many, REF);
  for (let i = 0; i < 12; i++) E.engRun(S, many);
  E.engRelease(S, many);
  const gm = E.grade(S, many, GOOD);
  assert.ok(gm.parts.triage < 15 && gm.parts.triage >= 12, 'triage ' + gm.parts.triage);
});
t('the report: wrong answers lose their points and the summary needs substance', () => {
  const { st } = ship();
  const bad = E.grade(S, st, { worst: 'hsts', tradeoffs: ['hsts', 'debug-off'], rollback: 'wait', residual: ['skip-checks'], summary: 'ok' });
  assert.ok(bad.parts.report <= 0.5, 'report ' + bad.parts.report);
  assert.equal(E.grade(S, st, GOOD).parts.report, 20);
});
t('grading adds up to 100 and every debrief question has one right answer', () => {
  assert.equal(S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal, 100);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
