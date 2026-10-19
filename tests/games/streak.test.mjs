import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const S = await import(pathToFileURL(GAMES + 'core/streak.js').href);

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
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0);
const run = (...keys) => keys; // a list of YYYY-MM-DD days
const NOW = at(2026, 10, 20); // a Tuesday

t('no activity: streak is 0 and nothing is at risk', () => {
  const s = S.compute([], NOW);
  assert.equal(s.current, 0);
  assert.equal(s.atRisk, false);
  assert.equal(s.today, false);
});
t('playing today starts a streak of 1', () => {
  const s = S.compute(run('2026-10-20'), NOW);
  assert.equal(s.current, 1);
  assert.equal(s.today, true);
  assert.equal(s.atRisk, false);
});
t('played yesterday and the day before, not yet today: the streak waits and is at risk', () => {
  const s = S.compute(run('2026-10-18', '2026-10-19'), NOW);
  assert.equal(s.current, 2);
  assert.equal(s.today, false);
  assert.equal(s.atRisk, true);
});
t('consecutive days including today count up', () => {
  const s = S.compute(run('2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'), NOW);
  assert.equal(s.current, 5);
  assert.equal(s.best, 5);
});
t('a missed day with no shield breaks the streak, and the best is remembered', () => {
  const s = S.compute(run('2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-17', '2026-10-18'), NOW);
  assert.equal(s.current, 0, 'two days since the last play with no shield');
  assert.equal(s.best, 4);
  const t2 = S.compute(run('2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-19', '2026-10-20'), NOW);
  assert.equal(t2.current, 2);
  assert.equal(t2.best, 4);
});
t('seven days in a row earn a shield, and the shield covers one missed day', () => {
  const week = run('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11');
  const earned = S.compute(week, at(2026, 10, 11));
  assert.equal(earned.current, 7);
  assert.equal(earned.shields, 1);
  const covered = S.compute([...week, '2026-10-13'], at(2026, 10, 13)); // missed the 12th
  assert.equal(covered.current, 8, 'the shield kept the streak alive: 7 + the new day');
  assert.equal(covered.shields, 0, 'and was used up');
});
t('a second missed day breaks the streak even after a shield', () => {
  const week = run('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11');
  const s = S.compute([...week, '2026-10-14'], at(2026, 10, 14)); // missed the 12th and 13th
  assert.equal(s.current, 1);
  assert.equal(s.best, 7);
});
t('only one shield is held at a time', () => {
  const days = [];
  for (let i = 0; i < 14; i++) days.push(`2026-10-${String(1 + i).padStart(2, '0')}`);
  assert.equal(S.compute(days, at(2026, 10, 14)).shields, 1);
});
t('the clocks changing do not break a run (UK, 29 March 2026)', () => {
  const s = S.compute(run('2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30'), at(2026, 3, 30));
  assert.equal(s.current, 4);
  const autumn = S.compute(run('2026-10-24', '2026-10-25', '2026-10-26'), at(2026, 10, 26));
  assert.equal(autumn.current, 3);
});
t('garbage and duplicates in the saved list are ignored', () => {
  const s = S.compute(['nonsense', 12, null, '2026-10-20', '2026-10-20', '2026-13-45x'], NOW);
  assert.equal(s.current, 1);
});
t('touch records the day once, reports a first play of the day and an extension', () => {
  S.forgetMemory(); store.clear();
  const first = S.touch(at(2026, 10, 19));
  assert.equal(first.current, 1);
  assert.equal(first.firstToday, true);
  const again = S.touch(at(2026, 10, 19, 18));
  assert.equal(again.firstToday, false);
  assert.equal(again.extended, false);
  const next = S.touch(at(2026, 10, 20));
  assert.equal(next.current, 2);
  assert.equal(next.firstToday, true);
  assert.equal(next.extended, true);
  assert.deepEqual(S.load().days, ['2026-10-19', '2026-10-20']);
});
t('the streak is saved and reloaded from storage', () => {
  S.forgetMemory();
  assert.deepEqual(S.load().days, ['2026-10-19', '2026-10-20']);
  assert.equal(S.status(at(2026, 10, 20)).current, 2);
});
t('seeding from an existing career adds past days once and never again', () => {
  S.forgetMemory(); store.clear();
  S.seedFrom(['2026-10-15T09:00:00.000Z', '2026-10-16T22:30:00.000Z', 'garbage']);
  const first = S.load().days.length;
  assert.ok(first >= 2, 'the two real timestamps became days');
  S.seedFrom(['2026-09-01T09:00:00.000Z']);
  assert.equal(S.load().days.length, first, 'a second seed changes nothing');
});
t('history is capped so storage cannot grow without limit', () => {
  const days = [];
  const d = new Date(2022, 0, 1, 12);
  for (let i = 0; i < 1000; i++) {
    days.push(S.dayKey(d));
    d.setDate(d.getDate() + 1);
  }
  S.forgetMemory(); store.clear();
  store.set('lixteam.streak.v1', JSON.stringify({ days, seeded: true }));
  assert.ok(S.load().days.length <= 800);
});
t('a corrupt saved value falls back to an empty streak', () => {
  S.forgetMemory(); store.clear();
  store.set('lixteam.streak.v1', '{not json');
  assert.equal(S.status(NOW).current, 0);
});
t('reset clears the streak', () => {
  S.reset();
  assert.equal(S.status(NOW).current, 0);
});

console.log(n, 'passed');
