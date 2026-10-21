import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const V = await import(pathToFileURL(GAMES + 'workspace/vm.js').href);
const { VM_PATCH: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/vm-patch.js').href);

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
const find = (id) => S.vm.findings.find((f) => f.id === id);

// The best plan the optimiser found, as decisions; the rest are accepted or marked as false positives where that is right.
const OPT = V.optimum(S).used.map((u) => [u.finding, u.option]);
const FREE = [['F113', 'fp'], ['F116', 'fp'], ['F109', 'accept'], ['F114', 'accept'], ['F115', 'defer']];
const GOOD = { residual: 'F101', why: 'context', fps: ['F113', 'F116'], accept: ['F108', 'F109', 'F111', 'F114'], ask: 'retire', summary: 'I closed the web server and VPN exposure first, restricted the database admin port, filtered the payment form, and left the low-value findings. Two were false positives. The ERP needs replacing.' };

function play({ plan = [...OPT, ...FREE], report = GOOD, wait = 0, dry = [], look = true } = {}) {
  const st = E.newRun(S);
  if (look) for (const f of S.vm.findings) E.vmInspect(S, st, f.id);
  for (const [f, o] of dry) E.vmDry(S, st, f, o);
  for (const [f, o] of plan) E.vmDecide(S, st, f, o);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('the scan has 16 findings, two of them false positives, and the highest score is on the least valuable asset', () => {
  assert.equal(S.vm.findings.length, 16);
  assert.deepEqual(S.vm.findings.filter((f) => f.fp).map((f) => f.id).sort(), ['F113', 'F116']);
  const asset = (id) => S.entities.find((e) => e.id === id).asset;
  assert.equal(asset(find('F108').asset).crit, 1);
  assert.equal(find('F108').cvss, 9.8);
  assert.ok(find('F103').cvss < 8 && find('F103').risk >= 70, 'a moderate score on the crown jewels is a top risk');
});
t('the optimiser spends the budget on the right things and beats a CVSS-ordered plan', () => {
  const best = V.optimum(S);
  assert.ok(best.value > 420 && best.value < 450, 'value ' + best.value);
  const ids = best.used.map((u) => u.finding);
  for (const f of ['F101', 'F104', 'F103', 'F102']) assert.ok(ids.includes(f), f);
  assert.ok(!ids.includes('F108') || best.used.find((u) => u.finding === 'F108').option === 'stop', 'if the print server is touched at all it is the half-hour option');
  const cost = best.used.reduce((a, u) => a + V.optionOf(find(u.finding), u.option).cost, 0);
  assert.ok(cost <= S.vm.budget);
  assert.ok(!best.used.some((u) => V.optionOf(find(u.finding), u.option).breaks), 'the best plan breaks nothing');
});
t('risk is hidden behind the asset: advisories change it as the day goes on', () => {
  const f = find('F104');
  assert.equal(V.riskAt(f, m(9, 0)), 55);
  assert.equal(V.riskAt(f, m(9, 50)), 88);
  assert.equal(V.band(V.riskAt(f, m(9, 0))), 'High');
  assert.equal(V.band(V.riskAt(f, m(10, 0))), 'Critical');
  assert.equal(V.exploitedAt(f, m(9, 49)), false);
  assert.equal(V.exploitedAt(f, m(9, 50)), true);
  assert.equal(V.exploitedAt(find('F101'), m(9, 0)), true);
});
t('opening a finding costs a minute once and a second look is free', () => {
  const st = E.newRun(S);
  const c = st.clock;
  assert.equal(E.vmInspect(S, st, 'F101').first, true);
  assert.equal(st.clock, c + 1);
  assert.equal(E.vmInspect(S, st, 'F101').first, false);
  assert.equal(st.clock, c + 1);
  assert.equal(E.vmInspect(S, st, 'F999'), null);
  assert.equal(E.vmInspected(st, 'F101'), true);
  assert.equal(E.vmInspected(st, 'F102'), false);
});
t('a dry run costs an hour of budget and three minutes, once, and reveals a breaking patch', () => {
  const st = E.newRun(S);
  const c = st.clock;
  const r = E.vmDry(S, st, 'F102', 'patch');
  assert.match(r.text, /checkout plugin crashes/);
  assert.equal(V.remaining(S, st), 19);
  assert.equal(st.clock, c + 3);
  const again = E.vmDry(S, st, 'F102', 'patch');
  assert.equal(again.again, true);
  assert.equal(V.remaining(S, st), 19, 'the second look is free');
  assert.match(E.vmDry(S, st, 'F102', 'patchplug').text, /passes once the checkout plugin/);
  assert.equal(E.vmDry(S, st, 'F102', 'nope').ok, false);
});
t('free decisions cost no budget; remediations cost budget and six minutes an hour', () => {
  const st = E.newRun(S);
  const c = st.clock;
  assert.equal(E.vmDecide(S, st, 'F113', 'fp').ok, true);
  assert.equal(V.remaining(S, st), 20);
  assert.equal(st.clock, c + 1);
  E.vmDecide(S, st, 'F103', 'restrict');
  assert.equal(V.remaining(S, st), 19);
  assert.equal(st.clock, c + 1 + 6);
  E.vmDecide(S, st, 'F101', 'patch');
  assert.equal(V.remaining(S, st), 15);
  assert.equal(st.clock, c + 1 + 6 + 24);
});
t('the budget cannot be overspent', () => {
  const st = E.newRun(S);
  const r = E.vmDecide(S, st, 'F110', 'replace');
  assert.equal(r.ok, false);
  assert.match(r.text, /Not enough budget/);
  assert.equal(V.remaining(S, st), 20);
  E.vmDecide(S, st, 'F101', 'patch');
  E.vmDecide(S, st, 'F104', 'patch');
  E.vmDecide(S, st, 'F102', 'patchplug');
  assert.equal(V.remaining(S, st), 2);
  assert.equal(E.vmDecide(S, st, 'F107', 'push').ok, false);
});
t('a patch that breaks something costs the rollback, harms the business, does not fix the finding and cannot be retried', () => {
  const st = E.newRun(S);
  const r = E.vmDecide(S, st, 'F102', 'patch');
  assert.equal(r.failed, true);
  assert.equal(V.remaining(S, st), 20 - 6 - 3);
  assert.equal(st.disruption, 3);
  assert.equal(V.effectOf(S, st, find('F102')), 0);
  assert.equal(E.vmDecide(S, st, 'F102', 'patch').ok, false);
  assert.equal(E.vmDecide(S, st, 'F102', 'filter').ok, true, 'another option still works');
  assert.equal(V.effectOf(S, st, find('F102')), 0.6);
  assert.equal(E.vmDecide(S, st, 'F102', 'patchplug').ok, false, 'a finished remediation cannot be redone');
});
t('accepting or deferring can be changed later, a finished remediation cannot', () => {
  const st = E.newRun(S);
  E.vmDecide(S, st, 'F105', 'defer');
  assert.equal(E.vmDecide(S, st, 'F105', 'tls').ok, true);
  assert.equal(E.vmDecide(S, st, 'F105', 'accept').ok, false);
});
t('protecting the web server before 10:45 prevents the compromise; later is too late; protecting does not rewrite the past', () => {
  const a = E.newRun(S);
  E.vmDecide(S, a, 'F101', 'waf'); // done at 09:06
  E.advance(a, 180);
  assert.ok(!has(a, 'e-breach1'));
  assert.ok(!has(a, 'e-ids2'), 'the later attempts stopped, the earlier ones are in the feed');
  assert.ok(has(a, 'e-ids1'));
  assert.equal(E.consequences(S, a, S.horizon).filter((e) => e.id === 'e-breach1').length, 0);
  const b = E.newRun(S);
  E.advance(b, 110); // 10:50
  E.vmDecide(S, b, 'F101', 'waf');
  assert.ok(has(b, 'e-breach1'));
  assert.equal(E.consequences(S, b, S.horizon).filter((e) => e.id === 'e-breach1').length, 1);
});
t('the VPN needs protecting by 11:30', () => {
  const a = play({ plan: [['F104', 'portal']], wait: 240 });
  assert.ok(!has(a.st, 'e-breach2'));
  const b = play({ plan: [], wait: 240 });
  assert.ok(has(b.st, 'e-breach2'));
  assert.equal(E.consequences(S, b.st, S.horizon).length, 2);
});
t('the threat feed is searchable and the advisory appears on time', () => {
  const st = E.newRun(S);
  assert.deepEqual(E.search(S, st, 'type:advisory').map((e) => e.id), [], 'nothing yet at 09:00');
  E.advance(st, 25);
  assert.deepEqual(E.search(S, st, 'type:advisory').map((e) => e.id), ['e-ti']);
  E.advance(st, 30);
  assert.ok(E.search(S, st, 'type:advisory').some((e) => e.id === 'e-adv1'));
  assert.ok(E.search(S, st, 'F101').length >= 1);
});

t('the optimal plan earns gold with little harm', () => {
  const { g } = play();
  assert.ok(g.total >= 85, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.ok(g.lines.some((l) => /Risk removed: 4\d\d of the 4\d\d/.test(l.label)));
});
t('a plan that follows CVSS scores spends the budget on the wrong things and is not gold', () => {
  const byCvss = S.vm.findings.slice().sort((a, b) => b.cvss - a.cvss);
  const st = E.newRun(S);
  for (const f of S.vm.findings) E.vmInspect(S, st, f.id);
  for (const f of byCvss) {
    if (f.fp) E.vmDecide(S, st, f.id, 'fp');
    else if (f.options.length) E.vmDecide(S, st, f.id, f.options[0].id);
  }
  const g = E.grade(S, st, GOOD);
  assert.ok(g.tier < 3, 'total ' + g.total);
  const best = play().g;
  assert.ok(best.total > g.total + 10, `${best.total} vs ${g.total}`);
});
t('doing nothing lets both systems be compromised and fails', () => {
  const { g } = play({ plan: [], wait: 240 });
  assert.equal(g.tier, 0, 'total ' + g.total);
  assert.ok(g.lines.some((l) => /The public web server was compromised/.test(l.label)));
});
t('marking a real, exploited finding as a false positive is the worst decision and the breach happens', () => {
  const { g, st } = play({ plan: [...OPT.filter(([f]) => f !== 'F101'), ['F101', 'fp'], ...FREE], wait: 240 });
  assert.ok(has(st, 'e-breach1'));
  assert.ok(g.lines.some((l) => /Mark as a false positive: F101/.test(l.label) && l.points === 0));
  assert.ok(g.tier < 3);
});
t('not marking the real false positives wastes decisions but not budget', () => {
  const withFp = play().g;
  const without = play({ plan: [...OPT, ['F109', 'accept'], ['F114', 'accept'], ['F115', 'defer'], ['F113', 'accept'], ['F116', 'accept']] }).g;
  assert.ok(without.total < withFp.total, 'accepting a false positive earns half the decision points');
  assert.ok(withFp.total - without.total <= 3);
});
t('blind patching that breaks things costs harm and budget compared with testing first', () => {
  const blind = play({ plan: [['F102', 'patch'], ['F115', 'patch'], ['F103', 'restrict'], ['F101', 'waf'], ['F104', 'portal']] }).g;
  const careful = play({ plan: [['F102', 'filter'], ['F115', 'patchagent'], ['F103', 'restrict'], ['F101', 'waf'], ['F104', 'portal']], dry: [['F102', 'patch'], ['F115', 'patch']] }).g;
  assert.equal(blind.disruption, 3 + 2 + 1, 'two breakages and the VPN portal');
  assert.ok(careful.total > blind.total, `${careful.total} vs ${blind.total}`);
});
t('undecided findings score nothing and are named', () => {
  const { g } = play({ plan: [['F101', 'waf']] });
  assert.equal(g.lines.filter((l) => /Not dealt with/.test(l.label)).length, 15);
});
t('leftover budget is mentioned', () => {
  const { g } = play({ plan: [['F103', 'restrict'], ['F101', 'waf'], ['F104', 'portal']] });
  assert.ok(g.lines.some((l) => /Budget left unspent: 17 h/.test(l.label)));
});
t('the report: the wrong biggest danger, false positives and ask lose points; the summary needs substance', () => {
  const bad = play({ report: { ...GOOD, residual: 'F108', why: 'cvss-complete', fps: ['F105'], accept: ['F101'], ask: 'nothing', summary: 'ok' } }).g;
  assert.ok(bad.parts.report <= 1, 'report ' + bad.parts.report);
  const full = play().g;
  assert.equal(full.parts.report, 35);
});
t('a report written without opening the findings earns only 40% credit', () => {
  const blind = play({ look: false }).g;
  const full = play().g;
  assert.ok(blind.parts.report <= 14.1, 'report ' + blind.parts.report);
  assert.ok(blind.lines.some((l) => /not fully backed by looking \(40% credit\)/.test(l.label)));
  assert.ok(full.parts.report === 35);
});
t('grading adds up to 100 and every debrief question has one right answer', () => {
  assert.equal(S.grading.triage + S.grading.evidence + S.vm.riskPoints + S.grading.reportTotal, 100);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
