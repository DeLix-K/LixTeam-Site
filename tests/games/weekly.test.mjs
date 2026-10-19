import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const W = await import(pathToFileURL(GAMES + 'core/weekly.js').href);
const P = await import(pathToFileURL(GAMES + 'core/profile.js').href);
const { SIMS } = await import(pathToFileURL(GAMES + 'simulation/sims.js').href);
const { CASES: DET } = await import(pathToFileURL(GAMES + 'cyber-detective/cases.js').href);
const { CASES: BR } = await import(pathToFileURL(GAMES + 'breach-room/cases.js').href);
const { INCIDENTS: IC } = await import(pathToFileURL(GAMES + 'incident-commander/incidents.js').href);
const { MISSIONS } = await import(pathToFileURL(GAMES + 'core/missions.js').href);

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
const at = (y, m, d, h = 9) => new Date(y, m - 1, d, h, 0, 0);
const content = { 'cyber-detective': DET, 'breach-room': BR, 'incident-commander': IC, simulation: SIMS };

t('every weekly case points at content that exists, in a mode that supports weekly cases', () => {
  for (const e of W.WEEKLY) {
    assert.ok(content[e.mode], e.id + ' has a supported mode: ' + e.mode);
    assert.ok(content[e.mode].some((x) => x.id === e.ref), `${e.id}: ${e.mode}/${e.ref} exists`);
    assert.ok(e.title && e.blurb && e.minutes > 0, e.id + ' has a title, blurb and length');
  }
});
t('ids are unique, and each case is used once', () => {
  const ids = W.WEEKLY.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  const refs = W.WEEKLY.map((e) => `${e.mode}/${e.ref}`);
  assert.equal(new Set(refs).size, refs.length);
});
t('a weekly case is not also a career mission (it would be reachable early)', () => {
  const used = new Set(MISSIONS.filter((m) => m.kind !== 'triage').map((m) => `${m.mode}/${m.ref}`));
  for (const e of W.WEEKLY) assert.ok(!used.has(`${e.mode}/${e.ref}`), e.id + ' is also a mission');
});
t('releases are on Mondays, a week apart, in order', () => {
  const dates = W.WEEKLY.map((e) => e.release);
  for (const d of dates) {
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
    const [y, m, day] = d.split('-').map(Number);
    assert.equal(new Date(y, m - 1, day, 12).getDay(), 1, d + ' is a Monday');
  }
  for (let i = 1; i < dates.length; i++) {
    const [y1, m1, d1] = dates[i - 1].split('-').map(Number);
    const [y2, m2, d2] = dates[i].split('-').map(Number);
    const gap = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
    assert.equal(gap, 7, `${dates[i - 1]} to ${dates[i]}`);
  }
});
t('nothing is current before the first release; the first case is current on its day', () => {
  assert.equal(W.current(at(2026, 10, 18)), null);
  assert.equal(W.current(at(2026, 10, 19, 0)).id, 'wk01');
  assert.equal(W.current(at(2026, 10, 25, 23)).id, 'wk01', 'still the first until Monday');
  assert.equal(W.current(at(2026, 10, 26)).id, 'wk02');
});
t('the current case is always the newest released one, and released/upcoming split cleanly', () => {
  const now = at(2026, 11, 10);
  assert.equal(W.current(now).id, 'wk04');
  assert.equal(W.released(now).length, 4);
  assert.equal(W.upcoming(now).length, W.WEEKLY.length - 4);
});
t('next() counts the days to the next Monday, and is null once everything is out', () => {
  assert.equal(W.next(at(2026, 10, 19)).days, 7);
  assert.equal(W.next(at(2026, 10, 25)).days, 1);
  assert.equal(W.next(at(2026, 10, 25)).entry.id, 'wk02');
  assert.equal(W.next(at(2030, 1, 1)), null);
});
t('an unreleased weekly case is hidden from its mode\'s list; released and ordinary cases are visible', () => {
  const now = at(2026, 10, 20);
  assert.equal(W.visible('cyber-detective', 'qr-meter', now), true);
  assert.equal(W.visible('incident-commander', 'usb-in-car-park', now), false);
  assert.equal(W.visible('incident-commander', 'usb-in-car-park', at(2026, 10, 26)), true);
  assert.equal(W.visible('cyber-detective', 'a-case-that-is-not-weekly', now), true);
});
t('bronze or better pays a one-off bonus by medal, once', () => {
  P.reset(); W.reset();
  const before = P.load().xp;
  const r1 = W.record('wk01', { tier: 2, points: 210 }, at(2026, 10, 20));
  assert.equal(r1.bonus, W.BONUS[2]);
  assert.equal(P.load().xp - before, W.BONUS[2]);
  const r2 = W.record('wk01', { tier: 3, points: 260 }, at(2026, 10, 21));
  assert.equal(r2.bonus, 0, 'the bonus is paid once');
  assert.equal(W.resultOf('wk01').tier, 3, 'but the best medal is kept');
  assert.equal(W.resultOf('wk01').attempts, 2);
});
t('failing pays nothing, and the bonus is still available after a later pass', () => {
  P.reset(); W.reset();
  const fail = W.record('wk02', { tier: 0, points: 20 }, at(2026, 10, 27));
  assert.equal(fail.bonus, 0);
  assert.equal(fail.passed, false);
  const pass = W.record('wk02', { tier: 1, points: 90 }, at(2026, 10, 28));
  assert.equal(pass.bonus, W.BONUS[1]);
});
t('an unknown case id is ignored', () => {
  assert.equal(W.record('wk99', { tier: 3, points: 100 }), null);
});
t('results are saved and reloaded, and junk in storage is ignored', () => {
  P.reset(); W.reset();
  W.record('wk01', { tier: 3, points: 250 }, at(2026, 10, 20));
  W.forgetMemory();
  assert.equal(W.resultOf('wk01').tier, 3);
  W.forgetMemory(); store.set('lixteam.weekly.v1', JSON.stringify({ done: { wk01: { tier: 99, points: -5 }, nope: { tier: 2 }, wk02: 'x' } }));
  assert.equal(W.resultOf('wk01').tier, 3, 'a silly tier is clamped to the maximum');
  assert.equal(W.resultOf('wk01').points, 0);
  assert.equal(W.resultOf('nope'), null);
  assert.equal(W.resultOf('wk02'), null);
  W.forgetMemory(); store.set('lixteam.weekly.v1', '{not json');
  assert.equal(W.doneCount(), 0);
});

console.log(n, 'passed');
