import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const { SOC_INVOICE: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/soc-invoice.js').href);

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
const ids = (rows) => rows.map((e) => e.id);

// A full report, as the best analyst would write it.
const GOOD_REPORT = { verdict: 'confirmed', severity: 'high', hosts: ['WS-FIN-07', 'FS-02'], users: ['priya.n', 'svc-backup'], cause: 'phish-attachment', summary: 'A fake invoice opened by Priya started a program that stole credentials, used the backup account to reach the file server and staged the Payroll folder in an archive. Contained before it left.' };
const PIN_ROLES = ['e-mail', 'e-macro', 'e-drop', 'e-b' + m(9, 5), 'e-cred', 'e-svc1', 'e-lat', 'e-read', 'e-zip'];

function play({ triage = {}, pins = [], acts = [], report = GOOD_REPORT, wait = 0 } = {}) {
  const st = E.newRun(S);
  for (const [id, status] of Object.entries(triage)) E.triage(S, st, id, status, '');
  for (const [a, tg] of acts) E.perform(S, st, a, tg);
  for (const p of pins) E.pin(st, p);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}
const RIGHT_TRIAGE = { 'A-1': 'escalated', 'A-2': 'escalated', 'A-3': 'escalated', 'A-4': 'closed', 'A-5': 'closed', 'A-6': 'closed' };
const GOOD_ACTS = [['isolate', 'WS-FIN-07'], ['disable', 'svc-backup'], ['block-ip', '203.0.113.44'], ['reset', 'priya.n'], ['snapshot', 'WS-FIN-07'], ['quarantine', 'accounts@invoices-ontime.example'], ['block-domain', 'invoices-ontime.example'], ['notify', 'Head of Finance']];

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('the clock helpers round-trip', () => {
  assert.equal(E.clockText(m(14, 5)), '14:05');
  assert.equal(E.parseClock('9:07'), m(9, 7));
  assert.equal(E.parseClock('25:00'), null);
  assert.equal(E.parseClock('nonsense'), null);
});
t('at the start only past events are visible, and the exfiltration has not happened', () => {
  const st = E.newRun(S);
  const v = E.visibleEvents(S, st);
  assert.ok(v.every((e) => e.t <= S.clockStart));
  assert.ok(!v.some((e) => e.id === 'e-exfil'));
  assert.ok(v.some((e) => e.id === 'e-read'));
});
t('events appear as the clock moves on', () => {
  const st = E.newRun(S);
  E.advance(st, 30);
  assert.ok(E.visibleEvents(S, st).some((e) => e.id === 'e-b' + m(14, 30)));
  assert.ok(!E.visibleEvents(S, st).some((e) => e.id === 'e-exfil'));
  E.advance(st, 40);
  assert.ok(E.visibleEvents(S, st).some((e) => e.id === 'e-exfil'), 'the archive leaves if nobody acts');
  assert.ok(E.alertsNow(S, st).some((a) => a.id === 'A-7'));
});
t('searching costs a minute and finds events by field', () => {
  const st = E.newRun(S);
  const rows = E.search(S, st, 'user:svc-backup type:logon');
  assert.deepEqual(ids(rows), ['e-svc1', 'e-lat']);
  assert.equal(st.clock, S.clockStart + 1);
  assert.equal(st.searches, 1);
});
t('search tokens: host, ip, proc, sev, file and free text', () => {
  const st = E.newRun(S);
  assert.ok(E.search(S, st, 'host:FS-02 sev:high').some((e) => e.id === 'e-read'));
  assert.ok(E.search(S, st, 'ip:203.0.113.44').every((e) => JSON.stringify(e).includes('203.0.113.44')));
  assert.ok(E.search(S, st, 'proc:update_svc').length >= 2);
  assert.deepEqual(ids(E.search(S, st, 'file:zip')), ['e-zip']);
  assert.ok(E.search(S, st, 'payroll').some((e) => e.id === 'e-read'));
  assert.equal(E.search(S, st, 'user:nobody').length, 0);
});
t('time and severity filters narrow a search', () => {
  const st = E.newRun(S);
  const rows = E.search(S, st, 'host:WS-FIN-07', { from: m(9, 0), to: m(9, 10), sev: ['medium'] });
  assert.ok(rows.length >= 3 && rows.every((e) => e.t >= m(9, 0) && e.t <= m(9, 10) && e.sev === 'medium'));
});
t('opening an entity costs a minute once and shows what it did', () => {
  const st = E.newRun(S);
  const a = E.openEntity(S, st, 'svc-backup');
  assert.equal(a.first, true);
  assert.ok(a.count >= 3);
  const c1 = st.clock;
  const b = E.openEntity(S, st, 'svc-backup');
  assert.equal(b.first, false);
  assert.equal(st.clock, c1, 'a second look is free');
  assert.equal(E.openEntity(S, st, 'ghost'), null);
});
t('the process tree links Word to cmd, PowerShell and the dropped program', () => {
  const st = E.newRun(S);
  const roots = E.processTree(S, st, 'WS-FIN-07');
  const find = (nodes, name) => nodes.flatMap((x) => [...(x.name === name ? [x] : []), ...find(x.children, name)]);
  const w = find(roots, 'WINWORD.EXE')[0];
  assert.ok(w, 'Word is in the tree');
  assert.equal(w.children[0].name, 'cmd.exe');
  assert.equal(w.children[0].children[0].name, 'powershell.exe');
  assert.equal(w.children[0].children[0].children[0].name, 'update_svc.exe');
});
t('the network map shows the beacon to the attacker and the backup to the provider', () => {
  const st = E.newRun(S);
  const edges = E.networkEdges(S, st);
  const beacon = edges.find((x) => x.from === 'WS-FIN-07' && x.to === '203.0.113.44');
  assert.ok(beacon && beacon.count > 30);
  assert.ok(edges.some((x) => x.from === 'BK-01' && x.to === '198.51.100.150'));
});
t('alerts: only handled once they have appeared, and only closed or escalated', () => {
  const st = E.newRun(S);
  assert.equal(E.alertsNow(S, st).length, 6);
  assert.equal(E.triage(S, st, 'A-7', 'escalated'), null, 'A-7 has not fired yet');
  assert.equal(E.triage(S, st, 'A-1', 'ignored'), null);
  assert.equal(E.triage(S, st, 'A-1', 'escalated').status, 'escalated');
});
t('blocking the address stops the future beacons and the exfiltration but keeps the past', () => {
  const st = E.newRun(S);
  const before = E.search(S, st, 'ip:203.0.113.44').length;
  E.perform(S, st, 'block-ip', '203.0.113.44');
  E.advance(st, 120);
  const after = E.visibleEvents(S, st).filter((e) => (e.fields || {}).dst === '203.0.113.44');
  assert.ok(after.length >= before, 'earlier connections are still in the log');
  assert.ok(after.every((e) => e.t <= S.clockStart + 1), 'nothing new after the block');
  assert.ok(!E.visibleEvents(S, st).some((e) => e.id === 'e-exfil'));
  assert.equal(E.consequences(S, st, S.horizon).length, 0);
});
t('isolating the file server or disabling the account also stops the exfiltration', () => {
  for (const [a, tg] of [['isolate', 'FS-02'], ['disable', 'svc-backup']]) {
    const st = E.newRun(S);
    E.perform(S, st, a, tg);
    E.advance(st, 120);
    assert.ok(!E.visibleEvents(S, st).some((e) => e.id === 'e-exfil'), `${a} ${tg}`);
  }
});
t('acting too late does not undo the exfiltration', () => {
  const st = E.newRun(S);
  E.advance(st, 65); // 15:10
  E.perform(S, st, 'block-ip', '203.0.113.44');
  assert.ok(E.visibleEvents(S, st).some((e) => e.id === 'e-exfil'));
  assert.equal(E.consequences(S, st, S.horizon).length, 1);
});
t('doing the same action twice is refused and costs nothing the second time', () => {
  const st = E.newRun(S);
  assert.equal(E.perform(S, st, 'isolate', 'WS-FIN-07').ok, true);
  const c = st.clock;
  assert.equal(E.perform(S, st, 'isolate', 'WS-FIN-07').ok, false);
  assert.equal(st.clock, c);
});
t('harmful actions add disruption, and a generic rule covers hosts nobody planned for', () => {
  const st = E.newRun(S);
  const r = E.perform(S, st, 'isolate', 'DC-01');
  assert.equal(r.harm, 20);
  const g = E.perform(S, st, 'isolate', 'WS-HR-04');
  assert.equal(g.ok, true);
  assert.ok(g.harm > 0);
  assert.equal(st.disruption, 24);
  assert.equal(E.perform(S, st, 'launch', 'x').ok, false);
});
t('the entity page shows the state the player has put something in', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'disable', 'svc-backup');
  assert.deepEqual(E.openEntity(S, st, 'svc-backup').state, ['Account disabled']);
});

t('best play earns gold', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS });
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.disruption, 0);
});
t('best play without the optional extras still earns gold', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: [['isolate', 'WS-FIN-07'], ['disable', 'svc-backup'], ['block-ip', '203.0.113.44'], ['reset', 'priya.n']] });
  assert.equal(g.tier, 3, 'total ' + g.total);
});
t('right call, no containment: the data leaves and the score drops a tier', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: [] });
  assert.ok(g.lines.some((l) => /archive left/i.test(l.label)));
  assert.ok(g.tier <= 2 && g.total < 85, 'total ' + g.total);
});
t('letting the data leave caps the medal at bronze however good the rest is', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: [] });
  assert.equal(g.capped, true);
  assert.equal(g.tier, 1);
  assert.ok(g.total >= 65, 'it would have been silver without the cap: ' + g.total);
});
t('a report written without evidence is mostly a guess: it earns well under half', () => {
  const { g } = play({ triage: {}, pins: [], acts: [] });
  assert.ok(g.parts.report <= 12.01, 'report ' + g.parts.report);
  assert.equal(g.tier, 0);
});
t('an analyst who contains the attack but investigates nothing is not gold', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: [], acts: GOOD_ACTS, report: { ...GOOD_REPORT, hosts: [], users: [] } });
  assert.ok(g.tier < 3, 'total ' + g.total);
});
t('closing every alert and doing nothing fails', () => {
  const { g } = play({ triage: { 'A-1': 'closed', 'A-2': 'closed', 'A-3': 'closed', 'A-4': 'closed', 'A-5': 'closed', 'A-6': 'closed' }, report: { verdict: 'false-positive', severity: 'low', hosts: [], users: [], cause: 'lost-device', summary: '' } });
  assert.equal(g.tier, 0, 'total ' + g.total);
});
t('escalating everything and shutting everything down fails', () => {
  const { g } = play({
    triage: { 'A-1': 'escalated', 'A-2': 'escalated', 'A-3': 'escalated', 'A-4': 'escalated', 'A-5': 'escalated', 'A-6': 'escalated' },
    pins: ['e-om2', 'e-bk1', 'e-d1', 'e-a4'],
    acts: [['isolate', 'DC-01'], ['disable', 'omar.r'], ['disable', 'dee.k'], ['isolate', 'BK-01'], ['isolate', 'FS-02']],
    report: { ...GOOD_REPORT, hosts: ['WS-FIN-07', 'FS-02', 'BK-01', 'DC-01', 'WS-IT-02'], users: ['priya.n', 'svc-backup', 'omar.r', 'dee.k'] },
  });
  assert.equal(g.tier, 0, 'total ' + g.total);
  assert.ok(g.disruption >= 40);
});
t('finding the incident but also locking out Omar costs a medal', () => {
  const clean = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS }).g;
  const messy = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: [...GOOD_ACTS, ['disable', 'omar.r'], ['isolate', 'BK-01'], ['isolate', 'DC-01']] }).g;
  assert.ok(messy.total < clean.total - 15, `${messy.total} vs ${clean.total}`);
  assert.ok(messy.tier < 3);
});
t('pinning unrelated events costs evidence points, up to a cap', () => {
  const clean = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS }).g.parts.evidence;
  const noisy = play({ triage: RIGHT_TRIAGE, pins: [...PIN_ROLES, 'e-om2', 'e-bk1', 'e-d1', 'e-d2', 'e-a4', 'e-a5', 'e-a6', 'n1', 'n2', 'n3'], acts: GOOD_ACTS }).g.parts.evidence;
  assert.ok(noisy < clean && noisy >= clean - 25 * 0.2 - 0.01);
});
t('the report: wrong verdict, wrong cause and wrong hosts lose their points', () => {
  const ok = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS }).g.parts.report;
  const bad = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS, report: { verdict: 'false-positive', severity: 'low', hosts: ['BK-01'], users: ['omar.r'], cause: 'insider', summary: 'x' } }).g.parts.report;
  assert.equal(ok, 30);
  assert.equal(bad, 0);
  const near = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS, report: { ...GOOD_REPORT, severity: 'medium' } }).g.parts.report;
  assert.ok(near > 25 && near < 30, 'one level out earns part of the points: ' + near);
});
t('a short summary earns no summary points', () => {
  const { g } = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS, report: { ...GOOD_REPORT, summary: 'Bad.' } });
  assert.ok(g.lines.some((l) => /too short/i.test(l.label)));
});
t('an unhandled real alert is flagged, and A-7 is only counted when it fired and was seen', () => {
  const unhandled = play({ triage: { 'A-1': 'escalated' }, acts: GOOD_ACTS }).g;
  assert.equal(unhandled.lines.filter((l) => /not handled/i.test(l.label)).length, 5);
  assert.ok(!unhandled.lines.some((l) => /rare external/i.test(l.label)), 'A-7 never fired');
  const st = E.newRun(S);
  E.advance(st, 70);
  E.triage(S, st, 'A-7', 'escalated');
  const g = E.grade(S, st, GOOD_REPORT);
  assert.ok(g.lines.some((l) => /rare external/i.test(l.label)));
});
t('grading is the same for the same play (nothing random)', () => {
  const a = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS }).g;
  const b = play({ triage: RIGHT_TRIAGE, pins: PIN_ROLES, acts: GOOD_ACTS }).g;
  assert.deepEqual(a, b);
});
t('thorough searching before acting is affordable: 12 searches and the three key actions still beat the exfiltration', () => {
  const st = E.newRun(S);
  for (let i = 0; i < 12; i++) E.search(S, st, 'host:WS-FIN-07');
  for (const [a, tg] of [['isolate', 'WS-FIN-07'], ['disable', 'svc-backup'], ['block-ip', '203.0.113.44']]) E.perform(S, st, a, tg);
  assert.ok(st.clock < m(15, 5));
});
t('every debrief question has exactly one correct answer', () => {
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});
t('every alert points at events that exist', () => {
  const have = new Set(S.events.map((e) => e.id));
  for (const a of S.alerts) for (const id of a.events) assert.ok(have.has(id), id);
});

console.log(n, 'passed');
