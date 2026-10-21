import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const T = await import(pathToFileURL(GAMES + 'workspace/ti.js').href);
const { TI_PAPERTRAIL: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/ti-papertrail.js').href);

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

const GOOD = {
  judge: { J1: 'moderate', J2: 'high', J3: 'moderate', J4: 'high', J5: 'low', J6: 'moderate' },
  iocs: ['I1', 'I2', 'I3', 'I5', 'I8', 'I7'],
  recs: ['A1', 'A2', 'A3', 'A4', 'A5'],
  decision: 'raise',
  summary: 'The campaign is aimed at the freight sector and has already reached our finance staff. The domains are one operation. Block the core indicators, hunt for 14 days, warn finance, and do not declare an incident.',
};
const LOOKUPS = ['I1', 'I2', 'I3', 'I5', 'I7', 'I8', 'I10', 'I6', 'I13'];

function worked({ read = true, rate = true, claims = true, enrich = LOOKUPS, link = true, brief = GOOD, submitAt = null } = {}) {
  const st = E.newRun(S);
  if (read) for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  if (rate && read) for (const r of S.ti.reports) E.tiRate(S, st, r.id, r.rel, r.cred);
  if (claims && read) for (const c of S.ti.claims) E.tiClaim(S, st, c.id, c.truth);
  if (read) for (const id of enrich) E.tiEnrich(S, st, id);
  if (link && read) for (const l of S.ti.links) E.tiLink(S, st, l.a, l.b, l.basis);
  if (submitAt !== null) st.clock = submitAt;
  E.submit(st);
  return { st, g: E.grade(S, st, brief) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('there are seven sources of different quality, fifteen claims and thirteen indicators, and fewer lookups than indicators', () => {
  assert.equal(S.ti.sources.length, 7);
  assert.equal(S.ti.reports.length, 7);
  assert.equal(S.ti.claims.length, 15);
  assert.equal(S.ti.indicators.length, 13);
  assert.ok(S.ti.credits < S.ti.indicators.length);
  assert.deepEqual([...new Set(S.ti.claims.map((c) => c.truth))].sort(), ['assessment', 'assumption', 'fact', 'rumour']);
});
t('reading a report costs five minutes once; nothing in it is visible before', () => {
  const st = E.newRun(S);
  assert.equal(T.visibleIndicators(S, st).length, 0);
  assert.equal(T.visibleClaims(S, st).length, 0);
  const c = st.clock;
  assert.equal(E.tiRead(S, st, 'R1').first, true);
  assert.equal(st.clock, c + 5);
  assert.equal(E.tiRead(S, st, 'R1').first, false);
  assert.equal(st.clock, c + 5);
  assert.equal(E.tiRead(S, st, 'R99'), null);
  assert.deepEqual(T.visibleClaims(S, st).map((x) => x.id), ['c1', 'c2', 'c3', 'c4']);
  assert.ok(T.visibleIndicators(S, st).some((i) => i.id === 'I8'));
  assert.ok(!T.visibleIndicators(S, st).some((i) => i.id === 'I13'), 'the feed-only indicator waits for the feed');
});
t('a report must be read before it can be rated, and its claims marked', () => {
  const st = E.newRun(S);
  assert.equal(E.tiRate(S, st, 'R4', 'C', '3').ok, false);
  assert.equal(E.tiClaim(S, st, 'c9', 'rumour').ok, false);
  E.tiRead(S, st, 'R4');
  assert.equal(E.tiRate(S, st, 'R4', 'C', '3').ok, true);
  assert.equal(E.tiRate(S, st, 'R4', 'Z', '3').ok, false);
  assert.equal(E.tiClaim(S, st, 'c9', 'rumour').ok, true);
  assert.equal(E.tiClaim(S, st, 'c9', 'maybe').ok, false);
});
t('lookups cost a credit and two minutes, are not repeated, and run out', () => {
  const st = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  const c = st.clock;
  assert.equal(E.tiEnrich(S, st, 'I2').ok, true);
  assert.equal(st.ti.credits, 8);
  assert.equal(st.clock, c + 2);
  assert.equal(E.tiEnrich(S, st, 'I2').again, true);
  assert.equal(st.ti.credits, 8);
  for (const id of ['I1', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'I9']) assert.equal(E.tiEnrich(S, st, id).ok, true);
  assert.equal(st.ti.credits, 0);
  const r = E.tiEnrich(S, st, 'I10');
  assert.equal(r.ok, false);
  assert.match(r.text, /No lookup credits/);
  assert.equal(E.tiEnrich(S, E.newRun(S), 'I2').ok, false, 'an indicator you have not seen cannot be looked up');
});
t('links need two different visible indicators, a reason, and no duplicates; they can be removed', () => {
  const st = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  assert.equal(E.tiLink(S, st, 'I2', 'I2', 'same-cert').ok, false);
  assert.equal(E.tiLink(S, st, 'I2', 'I3', 'because').ok, false);
  assert.equal(E.tiLink(S, st, 'I2', 'I3', 'same-cert').ok, true);
  assert.equal(E.tiLink(S, st, 'I3', 'I2', 'same-cert').ok, false, 'the pair is the same either way round');
  assert.equal(E.tiUnlink(S, st, 'I3', 'I2').ok, true);
  assert.equal(st.ti.links.length, 0);
  assert.equal(E.tiLink(S, E.newRun(S), 'I2', 'I3', 'same-cert').ok, false, 'nothing read yet');
});
t('report and claim scoring: exact earns full, one step off half, and unrated earns nothing', () => {
  const st = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  assert.equal(T.scoreReports(S, st).reduce((a, x) => a + x.points, 0), 0);
  for (const r of S.ti.reports) E.tiRate(S, st, r.id, r.rel, r.cred);
  assert.ok(Math.abs(T.scoreReports(S, st).reduce((a, x) => a + x.points, 0) - 12) < 1e-9);
  E.tiRate(S, st, 'R6', 'B', '1'); // reliability one step off
  const r6 = T.scoreReports(S, st).find((x) => x.id === 'R6');
  assert.ok(Math.abs(r6.points - r6.max * 0.75) < 1e-9);
  for (const c of S.ti.claims) E.tiClaim(S, st, c.id, c.truth);
  assert.ok(Math.abs(T.scoreClaims(S, st).reduce((a, x) => a + x.points, 0) - 18) < 1e-9);
  E.tiClaim(S, st, 'c3', 'fact');
  E.tiClaim(S, st, 'c9', 'fact');
  const sc = T.scoreClaims(S, st);
  assert.ok(Math.abs(sc.find((x) => x.id === 'c3').points - sc[0].max * 0.5) < 1e-9, 'assessment taken for fact: half');
  assert.equal(sc.find((x) => x.id === 'c9').points, 0, 'a rumour taken for a fact: nothing');
});
t('link scoring: strong links earn, the wrong reason earns half, a false link costs, a hosting-range link is a trap', () => {
  const st = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  assert.equal(T.scoreLinks(S, st).points, 0);
  for (const l of S.ti.links) E.tiLink(S, st, l.a, l.b, l.basis);
  assert.ok(Math.abs(T.scoreLinks(S, st).points - 25) < 1e-9);
  E.tiLink(S, st, 'I5', 'I6', 'same-network');
  E.tiLink(S, st, 'I4', 'I13', 'same-pattern');
  const bad = T.scoreLinks(S, st);
  assert.equal(bad.falseLinks.length, 2);
  assert.ok(bad.points < 25);
  const half = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, half, r.id);
  E.tiLink(S, half, 'I3', 'I8', 'same-pattern'); // right pair, wrong reason
  const hl = T.scoreLinks(S, half);
  assert.ok(Math.abs(hl.points - (25 / 12.5) * 0.5) < 1e-9);
  assert.deepEqual(hl.falseLinks, []);
});
t('the brief: confidence is judged, overclaiming costs, and including a false judgement costs', () => {
  const full = T.scoreBrief(S, GOOD);
  assert.equal(Math.round(full.points), 45);
  const over = T.scoreBrief(S, { ...GOOD, judge: { ...GOOD.judge, J5: 'high' } });
  assert.ok(over.points < full.points);
  const wrong = T.scoreBrief(S, { ...GOOD, judge: { ...GOOD.judge, J7: 'high', J8: 'high' } });
  assert.ok(wrong.points < full.points - 3);
  assert.ok(wrong.lines.some((l) => /Should not be in the brief: Contoso has been breached/.test(l.label)));
  const left = T.scoreBrief(S, { ...GOOD, judge: { J1: 'moderate' } });
  assert.ok(left.lines.filter((l) => /^Left out/.test(l.label)).length === 5);
});
t('the block list: harmful entries cost double, optional ones earn half, and the noise is named', () => {
  const clean = T.scoreBrief(S, GOOD).points;
  const harmful = T.scoreBrief(S, { ...GOOD, iocs: [...GOOD.iocs, 'I6', 'I13'] });
  assert.ok(harmful.points < clean - 5);
  const line = harmful.lines.find((l) => /Block list/.test(l.label));
  assert.match(line.note, /shared hosting address with 412 unrelated websites/);
  assert.match(line.note, /update server for the freight management software/);
  const musts = T.scoreBrief(S, { ...GOOD, iocs: ['I1', 'I2', 'I3', 'I5', 'I8'] }).lines.find((l) => /Block list/.test(l.label));
  assert.equal(musts.points, 8);
  assert.equal(T.scoreBrief(S, { ...GOOD, iocs: [] }).lines.find((l) => /Block list/.test(l.label)).points, 0);
});
t('recommendations and the decision', () => {
  const rec = (recs) => T.scoreBrief(S, { ...GOOD, recs }).lines.find((l) => /Recommendations/.test(l.label));
  assert.equal(rec(['A1', 'A2', 'A3', 'A4', 'A5']).points, 9);
  assert.ok(rec(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']).points < 9);
  assert.equal(rec(['A8', 'A9']).points, 0);
  const dec = (decision) => T.scoreBrief(S, { ...GOOD, decision }).lines.find((l) => /^Decision|No decision/.test(l.label)).points;
  assert.equal(dec('raise'), 4);
  assert.ok(Math.abs(dec('watch') - 1.6) < 1e-9);
  assert.equal(dec('incident'), 0);
  assert.equal(dec(undefined), 0);
});
t('a summary shorter than forty characters earns nothing', () => {
  assert.equal(T.scoreBrief(S, { ...GOOD, summary: 'ok' }).lines.find((l) => /Summary/.test(l.label)).points, 0);
});
t('our own telemetry and the updates arrive on time', () => {
  const st = E.newRun(S);
  assert.ok(has(st, 'e-tel1'));
  assert.ok(!has(st, 'e-tel4'));
  E.advance(st, 4 * 60 + 20);
  assert.ok(has(st, 'e-tel4') && has(st, 'e-tel5'));
  assert.ok(E.search(S, st, 'type:update').length === 2);
});
t('a brief handed in before 15:00 is on time; after, the CISO decides without it', () => {
  const early = worked({ submitAt: m(14, 30) });
  assert.equal(E.consequences(S, early.st, S.horizon).length, 0);
  const late = worked({ submitAt: m(15, 20) });
  assert.equal(E.consequences(S, late.st, S.horizon).length, 1);
  assert.ok(late.g.lines.some((l) => /missed the decision meeting/.test(l.label)));
  assert.ok(late.g.total < early.g.total);
  const never = E.newRun(S);
  E.advance(never, 6 * 60);
  assert.equal(E.consequences(S, never, S.horizon).length, 1);
});
t('the whole job, done well, earns gold', () => {
  const { g } = worked({ submitAt: m(14, 30) });
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.max.triage, 30);
  assert.equal(g.max.evidence, 25);
  assert.equal(g.max.report, 45);
});
t('the work fits in the time if you are selective: reading everything, nine lookups and the links take under three hours', () => {
  const { st } = worked({ submitAt: null });
  assert.ok(st.clock - S.clockStart < 180, 'minutes ' + (st.clock - S.clockStart));
});
t('a brief without reading the reports earns 40% credit and no triage', () => {
  const { g } = worked({ read: false, submitAt: m(14, 30) });
  assert.ok(g.parts.report <= 18.1, 'report ' + g.parts.report);
  assert.equal(g.parts.triage, 0);
  assert.ok(g.lines.some((l) => /not fully backed by looking \(40% credit\)/.test(l.label)));
});
t('trusting everything: believing the rumour, blocking the noise and declaring an incident is not gold', () => {
  const st = E.newRun(S);
  for (const r of S.ti.reports) E.tiRead(S, st, r.id);
  for (const r of S.ti.reports) E.tiRate(S, st, r.id, 'A', '1');
  for (const c of S.ti.claims) E.tiClaim(S, st, c.id, 'fact');
  E.submit(st);
  const g = E.grade(S, st, { judge: { J1: 'high', J2: 'high', J3: 'high', J4: 'high', J5: 'high', J6: 'high', J7: 'high', J8: 'high', J9: 'high', J10: 'high' }, iocs: S.ti.indicators.filter((i) => i.blockable !== false).map((i) => i.id), recs: ['A6', 'A7', 'A8', 'A10'], decision: 'incident', summary: 'It is a nation state and we are breached, block everything.' });
  assert.equal(g.tier, 0, 'total ' + g.total);
});
t('the debrief questions have one right answer each', () => {
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
  assert.equal(S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal, 100);
});

console.log(n, 'passed');
