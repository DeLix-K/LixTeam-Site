// Content checks for Phish or Legit: every item is complete, ids are unique, and every skill has
// both scams and genuine items so the daily mission and the practice rounds are never lopsided.
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GAMES = fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
const { SCENARIOS } = await import(pathToFileURL(GAMES + 'phish-or-legit/scenarios.js').href);
const { SKILLS } = await import(pathToFileURL(GAMES + 'core/profile.js').href);

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

t('ids are unique', () => {
  const ids = SCENARIOS.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});
t('every item is complete', () => {
  for (const x of SCENARIOS) {
    assert.ok(['phish', 'legit'].includes(x.kind), x.id + ' kind');
    assert.ok(SKILLS.some((s) => s.id === x.skill), x.id + ' skill');
    assert.ok(x.subject && Array.isArray(x.body) && x.body.length >= 1, x.id + ' subject and body');
    const channel = x.channel || 'email';
    assert.ok(['email', 'text', 'call', 'situation'].includes(channel), x.id + ' channel');
    if (channel !== 'situation') assert.ok(x.from && x.from.name && x.from.addr, x.id + ' needs a sender');
    if (x.kind === 'phish') assert.ok(Array.isArray(x.flags) && x.flags.length >= 2, x.id + ' needs at least two red flags');
    if (x.kind === 'legit') assert.ok(typeof x.why === 'string' && x.why.length > 30, x.id + ' needs a reason it is safe');
    if (x.link) assert.ok(x.link.text, x.id + ' link text');
  }
});
t('every skill has at least four scams and four genuine items', () => {
  for (const s of SKILLS) {
    const mine = SCENARIOS.filter((x) => x.skill === s.id);
    assert.ok(mine.filter((x) => x.kind === 'phish').length >= 4, s.id + ' scams');
    assert.ok(mine.filter((x) => x.kind === 'legit').length >= 4, s.id + ' genuine');
  }
});
t('genuine items are not given away by the same cues in every case (a mix of channels)', () => {
  const channels = new Set(SCENARIOS.map((x) => x.channel || 'email'));
  for (const c of ['email', 'text', 'call', 'situation']) assert.ok(channels.has(c), 'no ' + c + ' items');
});
t('no item contains markup that the page would have to trust', () => {
  const bad = /<\s*(script|img|iframe|svg|a)\b/i;
  for (const x of SCENARIOS) assert.ok(!bad.test(JSON.stringify(x)), x.id);
});

console.log(n, 'passed');
