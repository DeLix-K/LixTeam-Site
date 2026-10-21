import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const G = await import(pathToFileURL(GAMES + 'workspace/grc.js').href);
const { GRC_AUDIT: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/grc-audit.js').href);

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
const find = (id) => S.grc.findings.find((f) => f.id === id);
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);

// The best plan, as decisions with sensible ratings and owners.
const OPT = G.optimum(S).used.map((u) => [u.finding, u.option]);
function ideal(st, fid, option) {
  const f = find(fid);
  for (const d of f.docs) E.grcOpenDoc(S, st, fid, d.id);
  E.grcRate(S, st, fid, f.L, f.I);
  E.grcOwner(S, st, fid, f.ownerGood[0]);
  return E.grcTreat(S, st, fid, option);
}
function mapAll(st, truth = true) {
  for (const c of S.grc.controls) for (const r of S.grc.requirements) if (truth ? (c.fits || {})[r.id] : false) E.grcMap(S, st, c.id, r.id, true);
}
const GOOD = { top: ['AF-04', 'AF-01', 'AF-03'], wrong: ['AF-02', 'AF-11'], under: 'AF-04', gap: 'CE-CFG', board: 'fund-prioritised', summary: 'I challenged two findings with signed evidence, rated AF-04 as the top risk, fixed the majors within £36k and left three low risks accepted with sign-off. Secure configuration needs a control.' };

function play({ plan = OPT, map = true, report = GOOD, wait = 0, free = [], read = true } = {}) {
  const st = E.newRun(S);
  if (read) for (const f of S.grc.findings) for (const d of f.docs) E.grcOpenDoc(S, st, f.id, d.id);
  for (const [f, o] of plan) ideal(st, f, o);
  if (map) mapAll(st);
  for (const [f, o] of free) E.grcTreat(S, st, f, o);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('the audit has 12 findings, 5 rated major, 2 of them wrong, and the biggest risk is rated minor', () => {
  assert.equal(S.grc.findings.length, 12);
  assert.deepEqual(S.grc.findings.filter((f) => f.rating === 'Major').map((f) => f.id), ['AF-01', 'AF-02', 'AF-03', 'AF-09', 'AF-11']);
  assert.deepEqual(S.grc.findings.filter((f) => f.challenge && f.challenge.valid).map((f) => f.id), ['AF-02', 'AF-11']);
  const top = S.grc.findings.slice().sort((a, b) => G.risk(b) - G.risk(a))[0];
  assert.equal(top.id, 'AF-04');
  assert.equal(top.rating, 'Minor');
});
t('risk appetite bands: 12 or more must be treated, 6 or less may be tolerated', () => {
  assert.equal(G.bandOf(12), 'Treat');
  assert.equal(G.bandOf(6), 'Tolerable');
  assert.equal(G.bandOf(9), 'Owner decides');
  assert.equal(G.heat(20), 'extreme');
  assert.equal(G.risk(find('AF-04')), 20);
  for (const id of ['AF-07', 'AF-08', 'AF-10']) assert.equal(G.bandOf(G.risk(find(id))), 'Tolerable', id);
});
t('the optimal plan challenges the two wrong majors for free, fixes AF-04 first and stays inside £40k', () => {
  const best = G.optimum(S);
  const used = Object.fromEntries(best.used.map((u) => [u.finding, u.option]));
  assert.equal(used['AF-02'], 'challenge');
  assert.equal(used['AF-11'], 'challenge');
  assert.equal(used['AF-04'], 'mfa');
  const cost = best.used.reduce((a, u) => a + (u.option === 'challenge' ? 0 : find(u.finding).options.find((o) => o.id === u.option).cost), 0);
  assert.ok(cost <= S.grc.budget, 'cost ' + cost);
  assert.ok(best.value > 280);
});
t('reading a document costs four minutes once', () => {
  const st = E.newRun(S);
  const c = st.clock;
  assert.equal(E.grcOpenDoc(S, st, 'AF-02', 'D2').first, true);
  assert.equal(st.clock, c + 4);
  assert.equal(E.grcOpenDoc(S, st, 'AF-02', 'D2').first, false);
  assert.equal(st.clock, c + 4);
  assert.equal(E.grcOpenDoc(S, st, 'AF-02', 'D9'), null);
  assert.equal(G.docsOpened(st, 'AF-02'), 1);
});
t('ratings must be 1 to 5 and owners must come from the list', () => {
  const st = E.newRun(S);
  assert.equal(E.grcRate(S, st, 'AF-01', 0, 3).ok, false);
  assert.equal(E.grcRate(S, st, 'AF-01', 3, 6).ok, false);
  assert.equal(E.grcRate(S, st, 'AF-01', 3, 5).ok, true);
  assert.equal(E.grcOwner(S, st, 'AF-01', 'The intern').ok, false);
  assert.equal(E.grcOwner(S, st, 'AF-01', 'CISO').ok, true);
});
t('a challenge needs the proving document in hand, and succeeds with it', () => {
  const st = E.newRun(S);
  const r = E.grcTreat(S, st, 'AF-02', 'challenge');
  assert.equal(r.ok, false);
  assert.match(r.text, /no evidence in hand/);
  assert.equal(st.disruption, 0, 'no credibility lost for not having read it yet');
  E.grcOpenDoc(S, st, 'AF-02', 'D1');
  assert.equal(E.grcTreat(S, st, 'AF-02', 'challenge').ok, false, 'the wrong document does not prove it');
  E.grcOpenDoc(S, st, 'AF-02', 'D2');
  const ok = E.grcTreat(S, st, 'AF-02', 'challenge');
  assert.equal(ok.ok, true);
  assert.match(ok.text, /withdraws the finding/);
  assert.equal(G.effectOf(S, st, find('AF-02')), 1);
  assert.ok(st.flags['plan:AF-02'] !== undefined);
  assert.equal(G.remaining(S, st), 40, 'it cost nothing');
});
t('challenging a sound finding is rejected, costs credibility, and cannot be repeated', () => {
  const st = E.newRun(S);
  const r = E.grcTreat(S, st, 'AF-01', 'challenge');
  assert.equal(r.failed, true);
  assert.equal(st.disruption, 2);
  assert.equal(E.grcTreat(S, st, 'AF-01', 'challenge').ok, false);
  assert.equal(E.grcTreat(S, st, 'AF-01', 'iwrite').ok, true, 'a real treatment is still possible');
});
t('treatments cost money and time, cannot exceed the budget, and cannot be redone', () => {
  const st = E.newRun(S);
  const c = st.clock;
  assert.equal(E.grcTreat(S, st, 'AF-04', 'mfa').ok, true);
  assert.equal(G.remaining(S, st), 34);
  assert.equal(st.clock, c + 12, 'two minutes per £1k');
  assert.equal(E.grcTreat(S, st, 'AF-04', 'mfa').ok, false);
  E.grcTreat(S, st, 'AF-01', 'iplan');
  E.grcTreat(S, st, 'AF-03', 'restore');
  assert.equal(G.remaining(S, st), 12);
  const r = E.grcTreat(S, st, 'AF-06', 'programme');
  assert.equal(r.ok, false);
  assert.match(r.text, /Not enough budget/);
});
t('accepting costs nothing and does not count as a plan', () => {
  const st = E.newRun(S);
  assert.equal(E.grcTreat(S, st, 'AF-09', 'accept').ok, true);
  assert.equal(G.remaining(S, st), 40);
  assert.equal(st.flags['plan:AF-09'], undefined);
});
t('at 15:00 every major without a plan or an accepted challenge is recorded; accepting a major does not help', () => {
  const none = E.newRun(S);
  E.advance(none, 6 * 60);
  assert.equal(E.consequences(S, none, S.horizon).length, 5);
  assert.ok(has(none, 'e-nc-AF-01'));
  const accepted = E.newRun(S);
  E.grcTreat(S, accepted, 'AF-01', 'accept');
  assert.equal(E.consequences(S, accepted, S.horizon).filter((e) => e.id === 'e-nc-AF-01').length, 1);
  const planned = E.newRun(S);
  E.grcTreat(S, planned, 'AF-01', 'iwrite');
  E.grcTreat(S, planned, 'AF-03', 'once');
  E.grcTreat(S, planned, 'AF-09', 'policy');
  for (const d of ['D1', 'D2']) { E.grcOpenDoc(S, planned, 'AF-02', d); }
  E.grcOpenDoc(S, planned, 'AF-11', 'D2');
  E.grcTreat(S, planned, 'AF-02', 'challenge');
  E.grcTreat(S, planned, 'AF-11', 'challenge');
  E.advance(planned, 6 * 60);
  assert.equal(E.consequences(S, planned, S.horizon).length, 0);
  assert.ok(!has(planned, 'e-nc-AF-02'));
});
t('control mapping: the truth scores in full, an over-claim is penalised, a partial fit earns half', () => {
  const st = E.newRun(S);
  assert.equal(G.mapScore(S, st).ratio, 0);
  mapAll(st);
  assert.equal(G.mapScore(S, st).ratio, 1);
  assert.equal(G.mapScore(S, st).max, 12);
  E.grcMap(S, st, 'C3', 'ISO-BKP', false);
  assert.ok(G.mapScore(S, st).ratio < 1);
  E.grcMap(S, st, 'C3', 'ISO-BKP', true);
  E.grcMap(S, st, 'C6', 'CE-CFG', true);
  const s2 = G.mapScore(S, st);
  assert.ok(s2.detail.some((d) => d.kind === 'false' && d.req === 'CE-CFG'));
  assert.ok(s2.ratio < 1);
  assert.equal(E.grcMap(S, st, 'C99', 'ISO-ACC', true).ok, false);
});
t('coverage shows the requirement nobody addresses', () => {
  const st = E.newRun(S);
  mapAll(st);
  const gaps = G.coverage(S, st).filter((r) => !r.controls.length).map((r) => r.id);
  assert.deepEqual(gaps, ['CE-CFG']);
});
t('the control evidence texts explain why some fits are only partial', () => {
  for (const id of ['C3', 'C6', 'C7', 'C8']) assert.ok(Object.values(S.grc.controls.find((c) => c.id === id).fits).every((v) => v === 'partial'), id);
  assert.match(S.grc.controls.find((c) => c.id === 'C3').evidence, /No restore/);
});

t('the optimal plan with a correct control map earns gold', () => {
  const { g } = play();
  assert.ok(g.total >= 90, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.max.triage, 30);
  assert.equal(g.max.evidence, 15);
});
t('doing nothing records five majors, fails and is capped', () => {
  const { g } = play({ plan: [], map: false, wait: 6 * 60, read: false });
  assert.equal(g.tier, 0, 'total ' + g.total);
  assert.ok(g.lines.some((l) => /Major non-conformity recorded \(5 times\)/.test(l.label)));
});
t('accepting every finding is a plan of doing nothing about the real risks', () => {
  const plan = S.grc.findings.map((f) => [f.id, 'accept']);
  const { g } = play({ plan, wait: 6 * 60 });
  assert.ok(g.tier <= 1, 'total ' + g.total);
});
t('spending on the loud findings and not the risky one is worse than the plan that follows the true risk', () => {
  const loud = [['AF-09', 'purge'], ['AF-03', 'restore'], ['AF-01', 'iplan'], ['AF-06', 'programme'], ['AF-12', 'manual'], ['AF-10', 'postchange']];
  const a = play({ plan: loud }).g;
  const b = play().g;
  assert.ok(b.total > a.total + 10, `${b.total} vs ${a.total}`);
  assert.ok(a.lines.some((l) => /AF-04: no treatment/.test(l.label)));
});
t('a failed challenge costs credibility in the score', () => {
  const clean = play().g;
  const stained = play({ free: [['AF-10', 'challenge']] }).g;
  assert.ok(stained.lines.some((l) => /auditor rejected your challenge/.test(l.label)));
  assert.ok(stained.disruption === 2);
  assert.ok(stained.total <= clean.total);
});
t('ratings and owners earn part of each finding\'s points', () => {
  const st = E.newRun(S);
  for (const d of find('AF-04').docs) E.grcOpenDoc(S, st, 'AF-04', d.id);
  E.grcTreat(S, st, 'AF-04', 'mfa');
  const bare = E.grade(S, st, GOOD).lines.find((l) => /^AF-04/.test(l.label)).points;
  E.grcRate(S, st, 'AF-04', 4, 5);
  E.grcOwner(S, st, 'AF-04', 'Head of IT');
  const full = E.grade(S, st, GOOD).lines.find((l) => /^AF-04/.test(l.label)).points;
  assert.equal(S.grading.triage / 12, full, 'a perfect finding earns its full share');
  assert.ok(Math.abs(bare - full * 0.6) < 0.01);
  E.grcRate(S, st, 'AF-04', 3, 5);
  E.grcOwner(S, st, 'AF-04', 'CISO');
  const mid = E.grade(S, st, GOOD).lines.find((l) => /^AF-04/.test(l.label)).points;
  assert.ok(mid < full && mid > bare);
  E.grcOwner(S, st, 'AF-04', 'HR Director');
  assert.ok(E.grade(S, st, GOOD).lines.find((l) => /^AF-04/.test(l.label)).points < mid);
});
t('a report written without reading the evidence earns 40% credit', () => {
  const st = E.newRun(S);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.lines.some((l) => /not fully backed by looking \(40% credit\)/.test(l.label)));
  assert.ok(g.parts.report <= 14.1);
  assert.equal(play().g.parts.report, 35);
});
t('wrong report answers lose their points', () => {
  const bad = play({ report: { ...GOOD, top: ['AF-08'], wrong: ['AF-05'], under: 'AF-07', gap: 'CE-FW', board: 'all-fine', summary: 'ok' } }).g;
  assert.ok(bad.parts.report <= 1, 'report ' + bad.parts.report);
});
t('grading adds up to 100 and every debrief question has one right answer', () => {
  assert.equal(S.grading.triage + S.grading.evidence + S.grc.riskPoints + S.grading.reportTotal, 100);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
