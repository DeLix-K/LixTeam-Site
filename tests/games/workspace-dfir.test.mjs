import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const { DFIR_LAPTOP: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/dfir-laptop.js').href);

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
const L = 'WS-PRO-05';
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);

const GOOD = { entry: 'fake-installer', first: '08:01', data: ['contracts', 'creds'], exfil: 'yes', persist: ['task', 'program'], hosts: [L], summary: 'A fake PDF tool run by Jonas at 08:01 installed a program and a scheduled task, read his stored credentials, gathered 340 contract files and sent them out at 10:30. Preserved and contained.' };
const PINS = ['e-dl', 'e-run', 'e-sch', 'e-b' + m(8, 5), 'e-cred', 'e-fsread', 'e-tamper', 'e-exfil'];
const GOOD_ACTS = [['image', L], ['logs', L], ['memory', L], ['isolate', L], ['block-ip', '192.0.2.77'], ['reset', 'jonas.b'], ['notify', 'Data protection officer'], ['notify', 'Head of Procurement']];

function play({ acts = [], pins = PINS, report = GOOD, wait = 0 } = {}) {
  const st = E.newRun(S);
  for (const [a, tg] of acts) E.perform(S, st, a, tg);
  for (const p of pins) E.pin(st, p);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('this workspace has no alert queue and grades no triage', () => {
  assert.equal(S.alerts.length, 0);
  assert.equal(S.grading.triage, 0);
  assert.ok(!S.ui.nav.includes('alerts'));
});
t('at the start the laptop\'s own records are all visible, and the clean-up has not happened', () => {
  const st = E.newRun(S);
  for (const id of ['e-run', 'e-drop', 'e-sch', 'e-cred', 'e-stage', 'e-tamper', 'e-dl', 'e-fsread', 'e-exfil']) assert.ok(has(st, id), id);
  assert.ok(!has(st, 'e-wipe'));
});
t('left alone, the laptop clears its logs at 12:15 and the local evidence is lost, but central logs survive', () => {
  const st = E.newRun(S);
  E.advance(st, 50);
  assert.ok(has(st, 'e-wipe'));
  for (const id of ['e-run', 'e-drop', 'e-sch', 'e-cred', 'e-stage', 'e-tamper']) assert.ok(!has(st, id), id + ' should be gone');
  for (const id of ['e-dl', 'e-fsread', 'e-exfil', 'e-av']) assert.ok(has(st, id), id + ' is kept centrally');
});
t('a disk image taken first keeps everything, and the clean-up never shows', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'image', L);
  E.advance(st, 60);
  assert.ok(has(st, 'e-sch') && has(st, 'e-tamper'));
  assert.ok(!has(st, 'e-wipe'));
  assert.equal(E.consequences(S, st, S.horizon).length, 0);
});
t('exporting the logs first is enough to keep the laptop\'s records', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'logs', L);
  E.advance(st, 60);
  assert.ok(has(st, 'e-cred') && has(st, 'e-stage'));
});
t('a copy taken after the clean-up is too late', () => {
  const st = E.newRun(S);
  E.advance(st, 50);
  E.perform(S, st, 'image', L);
  assert.ok(!has(st, 'e-sch'), 'the evidence is already gone');
  assert.equal(E.consequences(S, st, S.horizon).length, 1);
});
t('isolating the laptop stops the beacons but not the clean-up routine already on it', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'isolate', L);
  E.advance(st, 50);
  assert.ok(!has(st, 'e-b' + m(11, 55)), 'no more calls after isolation');
  assert.ok(has(st, 'e-wipe'), 'the local routine still ran');
  assert.ok(!has(st, 'e-sch'));
});
t('rebuilding the laptop destroys its records at once, blocks every preservation action and costs the business', () => {
  const st = E.newRun(S);
  const r = E.perform(S, st, 'reimage', L);
  assert.equal(r.harm, 15);
  assert.ok(!has(st, 'e-sch') && !has(st, 'e-run'));
  for (const a of ['memory', 'image', 'logs']) assert.equal(E.perform(S, st, a, L).ok, false, a);
  assert.ok(has(st, 'e-dl'), 'gateway logs remain');
});
t('a copy taken before the rebuild keeps the records', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'image', L);
  E.perform(S, st, 'reimage', L);
  assert.ok(has(st, 'e-sch'));
});
t('powering off loses memory capture but keeps the disk', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'poweroff', L);
  const r = E.perform(S, st, 'memory', L);
  assert.equal(r.ok, false);
  assert.match(r.text, /memory is gone/i);
  assert.ok(E.perform(S, st, 'image', L).ok);
});
t('process tree: the installer, its scheduled task and the program, until the logs are cleared', () => {
  const st = E.newRun(S);
  const find = (nodes, name) => nodes.flatMap((x) => [...(x.name === name ? [x] : []), ...find(x.children, name)]);
  let roots = E.processTree(S, st, L);
  const inst = find(roots, 'PDFOptimizerSetup.exe')[0];
  assert.ok(inst, 'installer in the tree');
  assert.deepEqual(inst.children.map((c) => c.name).sort(), ['pdfhelper.exe', 'schtasks.exe']);
  E.advance(st, 50);
  roots = E.processTree(S, st, L);
  assert.equal(find(roots, 'PDFOptimizerSetup.exe').length, 0, 'gone once the logs are cleared');
});
t('every file shows four dates, and the forged ones disagree with their record change', () => {
  const files = E.entityList(S, 'file');
  assert.equal(files.length, 5);
  const get = (f, k) => Object.fromEntries(f.meta)[k];
  for (const f of files) for (const k of ['Created', 'Modified', 'Accessed', 'Record changed', 'SHA-256']) assert.ok(get(f, k), `${f.id} ${k}`);
  const forged = ['pdfhelper.exe', 'cache.dat'].map((id) => files.find((f) => f.id === id));
  for (const f of forged) {
    assert.ok(get(f, 'Created') < '2026-01-01');
    assert.equal(get(f, 'Record changed'), '2026-10-20 09:52');
  }
  const normal = files.filter((f) => !forged.includes(f));
  for (const f of normal) assert.ok(get(f, 'Record changed') >= get(f, 'Created'), f.id);
  assert.ok(forged.every((f) => get(f, 'Record changed') > get(f, 'Modified')));
});
t('opening a file shows its activity, and the laptop\'s sync and IT inventory are ordinary', () => {
  const st = E.newRun(S);
  const info = E.openEntity(S, st, 'pdfhelper.exe');
  assert.ok(info.count >= 4);
  assert.ok(E.search(S, st, 'ip:198.51.100.150').every((e) => e.sev === 'low'));
});
t('searches find events by file, domain and process', () => {
  const st = E.newRun(S);
  assert.ok(E.search(S, st, 'file:pdfhelper').length >= 4);
  assert.deepEqual(E.search(S, st, 'domain:freepdf-tools.example').map((e) => e.id).sort(), ['e-dl', 'e-dns']);
  assert.ok(E.search(S, st, 'proc:schtasks').some((e) => e.id === 'e-sch'));
});

t('best play earns gold', () => {
  const { g } = play({ acts: GOOD_ACTS });
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.disruption, 0);
  assert.equal(g.max.triage, 0);
});
t('good play with only the essentials still earns gold', () => {
  const { g } = play({ acts: [['image', L], ['isolate', L], ['block-ip', '192.0.2.77'], ['reset', 'jonas.b']] });
  assert.equal(g.tier, 3, 'total ' + g.total);
});
t('isolating without preserving loses the evidence and the medal', () => {
  const st = E.newRun(S);
  E.perform(S, st, 'isolate', L);
  E.perform(S, st, 'block-ip', '192.0.2.77');
  E.advance(st, 50); // the clean-up runs
  const g = E.grade(S, st, GOOD);
  assert.ok(g.lines.some((l) => /logs were cleared/i.test(l.label)));
  assert.ok(g.tier < 3, 'total ' + g.total);
});
t('letting the evidence be destroyed caps the medal at bronze however good the rest is', () => {
  const { g } = play({ acts: [['isolate', L], ['block-ip', '192.0.2.77'], ['reset', 'jonas.b']], wait: 60 });
  assert.equal(g.capped, true);
  assert.equal(g.tier, 1);
});
t('rebuilding the laptop straight away is the worst response', () => {
  const rebuilt = play({ acts: [['reimage', L]], pins: ['e-dl', 'e-exfil'], report: { ...GOOD, first: '11:20', data: ['contracts'], persist: [] } }).g;
  assert.equal(rebuilt.tier, 0, 'total ' + rebuilt.total);
  assert.ok(rebuilt.disruption >= 15);
});
t('powering off and deleting the files costs the business and the response score', () => {
  const clean = play({ acts: GOOD_ACTS }).g;
  const rash = play({ acts: [['poweroff', L], ['clean', L], ['image', L], ['isolate', L], ['block-ip', '192.0.2.77'], ['reset', 'jonas.b']] }).g;
  assert.ok(rash.total < clean.total - 12, `${rash.total} vs ${clean.total}`);
});
t('shutting the wrong things down fails', () => {
  const { g } = play({ acts: [['isolate', 'DC-01'], ['isolate', 'PROXY-01'], ['disable', 'dee.k'], ['block-ip', '198.51.100.150']], pins: ['e-sync', 'e-it1', 'e-it2'], report: { ...GOOD, hosts: [L, 'FS-03', 'PROXY-01'] } });
  assert.equal(g.tier, 0, 'total ' + g.total);
});
t('the first-compromise time takes the install time, tolerates a few minutes and rejects the detection time', () => {
  const score = (first) => play({ acts: GOOD_ACTS, report: { ...GOOD, first } }).g.lines.find((l) => /First compromise/.test(l.label)).points;
  assert.equal(score('08:01'), 6);
  assert.equal(score('8:05'), 6);
  assert.equal(score('09:00'), 3, 'close, within the hour');
  assert.equal(score('11:20'), 0, 'the time it was noticed is not the time it began');
  assert.equal(score('nonsense'), 0);
});
t('the data, persistence and host answers are scored as sets', () => {
  const g = play({ acts: GOOD_ACTS, report: { ...GOOD, data: ['contracts', 'payroll'], persist: ['task'], hosts: [L, 'FS-03'] } }).g;
  const pts = (re) => g.lines.find((l) => re.test(l.label)).points;
  assert.equal(pts(/Data taken/), 1.3, 'one right (2.5), one wrong (-1.25), rounded');
  assert.equal(pts(/Persistence/), 2.5);
  assert.equal(pts(/Affected hosts/), 2.5);
});
t('a report with no pinned evidence is mostly a guess', () => {
  const { g } = play({ acts: GOOD_ACTS, pins: [] });
  assert.ok(g.parts.report <= 14.1, 'report ' + g.parts.report);
});
t('grading adds up to 100 and every debrief question has one right answer', () => {
  const total = S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal;
  assert.equal(total, 100);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
