import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'breach-room/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { CASES } = await import(pathToFileURL(base + 'cases.js').href);
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};
const right = (c) => Object.fromEntries(c.questions.map((q) => [q.id, { option: q.options.find((o) => o.correct).id, conf: 'certain' }]));
const wrongQ = (c) => Object.fromEntries(c.questions.map((q) => [q.id, { option: q.options.find((o) => !o.correct).id, conf: 'certain' }]));
function place(c, st, { mistakesPerCard = 0, pivots = true } = {}) {
  for (const card of c.cards) {
    for (let i = 0; i < mistakesPerCard; i++) {
      const wrongStage = [...c.stages.map((s) => s.id), 'noise'].find((s) => s !== (card.stage || 'noise'));
      E.assign(c, st, card.id, wrongStage);
    }
    E.assign(c, st, card.id, card.stage || 'noise');
  }
  if (pivots) { const inds = [...new Set(c.cards.flatMap((x) => x.indicators))]; for (const i of inds) E.pivot(c, st, i); }
}

for (const c of CASES) {
  console.log('--- ' + c.id);
  t('data is well formed', () => {
    assert.ok(c.title && c.blurb && c.brief.length && c.summary && c.ratings.length === 4);
    assert.ok(c.stages.length >= 4);
    const stageIds = c.stages.map((s) => s.id);
    assert.equal(new Set(stageIds).size, stageIds.length);
    for (const s of c.stages) assert.ok(s.name && s.desc && s.story);
    const ids = c.cards.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate card ids');
    for (const card of c.cards) {
      assert.ok(card.source && /^\d\d:\d\d$/.test(card.time) && card.text && card.note && card.hint, card.id);
      assert.ok(Array.isArray(card.indicators));
      if (card.stage) assert.ok(stageIds.includes(card.stage), card.id + ' unknown stage');
    }
    for (const s of c.stages) assert.ok(E.stageCards(c, s.id).length >= 2, s.id + ' needs at least two cards');
    assert.ok(c.cards.filter((x) => !x.stage).length >= 3, 'needs noise cards');
    assert.ok(new Set(c.cards.map((x) => x.source)).size >= 4, 'needs evidence from at least four sources');
    for (const q of c.questions) { assert.equal(q.options.filter((o) => o.correct).length, 1); for (const o of q.options) assert.ok(o.explain && o.text); }
    const sorted = [...c.cards].map((x) => x.time);
    // chain cards should read in time order within the case (so the story makes sense)
    const chain = c.cards.filter((x) => x.stage).map((x) => x.time);
    assert.deepEqual([...chain].sort(), chain.slice().sort());
  });
  t('every stage contains evidence that precedes the next stage', () => {
    const firstTime = (sid) => E.stageCards(c, sid).map((x) => x.time).sort()[0];
    const times = c.stages.map((s) => firstTime(s.id));
    assert.deepEqual([...times].sort(), times, 'stages should begin in order');
  });
  t('placing every card correctly completes and unlocks every stage in order', () => {
    const st = E.newGame(c);
    const unlockedLog = [];
    for (const card of [...c.cards].sort((a, b) => a.time.localeCompare(b.time))) {
      const r = E.assign(c, st, card.id, card.stage || 'noise');
      assert.equal(r.correct, true);
      unlockedLog.push(...r.unlocked);
    }
    assert.equal(E.allPlaced(c, st), true);
    assert.deepEqual(unlockedLog, c.stages.map((s) => s.id));
  });
  t('a wrong placement is refused, counted, and leaves the card free', () => {
    const st = E.newGame(c);
    const card = c.cards.find((x) => x.stage);
    const r = E.assign(c, st, card.id, 'noise');
    assert.equal(r.correct, false);
    assert.ok(r.hint);
    assert.equal(st.wrong, 1);
    assert.equal(st.placed[card.id], undefined);
    assert.equal(E.assign(c, st, card.id, card.stage).correct, true);
    assert.equal(E.assign(c, st, card.id, card.stage).ok, false, 'cannot place twice');
  });
  t('noise has to be recognised as noise (not forced into the chain)', () => {
    const st = E.newGame(c);
    const noise = c.cards.find((x) => !x.stage);
    for (const s of c.stages) assert.equal(E.assign(c, st, noise.id, s.id).correct, false);
    assert.equal(E.assign(c, st, noise.id, 'noise').correct, true);
  });
  t('pivoting returns every card with the indicator and counts once', () => {
    const st = E.newGame(c);
    const ind = c.cards.flatMap((x) => x.indicators).find((i) => c.cards.filter((x) => x.indicators.includes(i)).length >= 3);
    const ids = E.pivot(c, st, ind);
    assert.ok(ids.length >= 3);
    E.pivot(c, st, ind);
    assert.equal(st.pivots.length, 1);
    assert.deepEqual(E.pivot(c, st, 'nothing-here'), []);
    assert.equal(st.pivots.length, 1);
  });
  const perfect = (() => { const st = E.newGame(c); place(c, st); return { st, g: E.grade(c, st, right(c)) }; })();
  const noPivots = (() => { const st = E.newGame(c); place(c, st, { pivots: false }); return E.grade(c, st, right(c)); })();
  const guessy = (() => { const st = E.newGame(c); place(c, st, { mistakesPerCard: 2 }); return E.grade(c, st, right(c)); })();
  const badThinking = (() => { const st = E.newGame(c); place(c, st); return E.grade(c, st, wrongQ(c)); })();
  t('perfect play is Master investigator', () => assert.equal(perfect.g.rating.name, 'Master investigator', String(perfect.g.points)));
  t('skipping pivots costs a little but is still strong', () => { assert.ok(noPivots.points < perfect.g.points); assert.ok(['Master investigator', 'Senior analyst'].includes(noPivots.rating.name), noPivots.rating.name + noPivots.points); });
  t('guessing every card twice before getting it right is clearly worse', () => assert.ok(guessy.points < perfect.g.points - 50 && guessy.rating.name !== 'Master investigator', `${guessy.points}`));
  t('perfect evidence but wrong conclusions is not top rated', () => { assert.notEqual(badThinking.rating.name, 'Master investigator'); assert.ok(badThinking.breakdown.some((b) => /certain, but wrong/.test(b.label))); });
  t('questions are optional in grading (partial answers)', () => { const st = E.newGame(c); place(c, st); assert.ok(E.grade(c, st, {}).points < perfect.g.points - 50); });
  console.log(`   perfect=${perfect.g.points} noPivots=${noPivots.points} guessy=${guessy.points} badThinking=${badThinking.points}`);
}
console.log(n, 'passed');
