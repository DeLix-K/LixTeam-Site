import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'escape-room/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { ESCAPES } = await import(pathToFileURL(base + 'escapes.js').href);
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};

const rightAnswer = (p) => {
  switch (p.type) {
    case 'choose': return p.options.find((o) => o.correct).id;
    case 'select': return p.options.filter((o) => o.correct).map((o) => o.id);
    case 'order': return [...p.order];
    case 'toggle': return Object.fromEntries(p.settings.map((s) => [s.id, s.secure]));
    case 'match': return Object.fromEntries(p.items.map((i) => [i.id, i.answer]));
  }
};
const wrongAnswers = (p) => {
  switch (p.type) {
    case 'choose': return p.options.filter((o) => !o.correct).map((o) => o.id);
    case 'select': {
      const right = p.options.filter((o) => o.correct).map((o) => o.id);
      const wrong = p.options.filter((o) => !o.correct).map((o) => o.id);
      return [right.slice(1), [...right, wrong[0]], [], wrong];
    }
    case 'order': return [[...p.order].reverse(), [p.order[1], p.order[0], ...p.order.slice(2)], p.order.slice(0, -1)];
    case 'toggle': return [Object.fromEntries(p.settings.map((s) => [s.id, s.on])), Object.fromEntries(p.settings.map((s) => [s.id, !s.secure]))];
    case 'match': {
      const ids = p.items.map((i) => i.answer);
      const rot = [...ids.slice(1), ids[0]];
      return [Object.fromEntries(p.items.map((it, i) => [it.id, rot[i]]))];
    }
  }
};

for (const esc of ESCAPES) {
  console.log('--- ' + esc.id);
  t('data is well formed', () => {
    assert.ok(esc.title && esc.premise && esc.finale && esc.totalSeconds >= 300);
    assert.equal(esc.ratings.length, 4);
    assert.ok(esc.rooms.length >= 3);
    const code = esc.rooms.map((r) => r.fragment).join('');
    assert.equal(code.length, esc.rooms.length, 'one letter per room');
    for (const r of esc.rooms) {
      assert.ok(r.title && r.scene && r.concept && r.skill && r.fragment);
      const ids = r.objects.map((o) => o.id);
      assert.equal(new Set(ids).size, ids.length, r.id + ' duplicate object ids');
      assert.ok(r.objects.filter((o) => o.clue).length >= 2, r.id + ' needs at least two clues');
      assert.ok(r.objects.some((o) => !o.clue), r.id + ' needs a red herring');
      for (const o of r.objects) assert.ok(o.label && o.text);
      const p = r.puzzle;
      assert.ok(['choose', 'select', 'order', 'toggle', 'match'].includes(p.type), r.id + ' type');
      assert.ok(p.prompt && p.explain);
      assert.equal(p.hints.length, 3, r.id + ' wants three hints');
      if (p.type === 'choose') { assert.equal(p.options.filter((o) => o.correct).length, 1); for (const o of p.options) if (!o.correct) assert.ok(o.explain, r.id + ' wrong option needs explain'); }
      if (p.type === 'select') assert.ok(p.options.filter((o) => o.correct).length >= 2 && p.options.some((o) => !o.correct));
      if (p.type === 'order') { assert.deepEqual([...p.order].sort(), p.items.map((i) => i.id).sort()); assert.notDeepEqual(p.items.map((i) => i.id), p.order, 'items must be shuffled in the data'); }
      if (p.type === 'toggle') { assert.ok(p.settings.some((s) => s.on !== s.secure) && p.settings.some((s) => s.on === s.secure)); }
      if (p.type === 'match') { const opt = p.options.map((o) => o.id); for (const it of p.items) assert.ok(opt.includes(it.answer)); assert.equal(new Set(p.items.map((i) => i.answer)).size, p.items.length); }
    }
  });
  t('every puzzle: the right answer passes, wrong ones fail', () => {
    for (const r of esc.rooms) {
      assert.equal(E.isCorrect(r.puzzle, rightAnswer(r.puzzle)), true, r.id + ' right answer rejected');
      for (const w of wrongAnswers(r.puzzle)) assert.equal(E.isCorrect(r.puzzle, w), false, `${r.id} accepted a wrong answer ${JSON.stringify(w)}`);
      assert.equal(E.isCorrect(r.puzzle, undefined), false);
    }
  });
  t('wrong answers give feedback without giving the answer away', () => {
    for (const r of esc.rooms) for (const w of wrongAnswers(r.puzzle)) {
      const d = E.wrongDetail(r.puzzle, w);
      assert.ok(typeof d === 'string' && d.length > 5);
    }
  });
  t('puzzles unlock rooms in order, and solving the last escapes', () => {
    const g = E.newGame(esc);
    esc.rooms.forEach((r, i) => {
      assert.equal(g.room, i);
      const res = E.attempt(esc, g, rightAnswer(r.puzzle));
      assert.equal(res.correct, true);
      assert.equal(res.fragment, r.fragment);
    });
    assert.equal(g.done && g.escaped, true);
    assert.equal(E.attempt(esc, g, 'x').ok, false, 'no moves after escaping');
  });
  t('looking at objects: clues counted once, herrings not counted', () => {
    const g = E.newGame(esc);
    const room = esc.rooms[0];
    for (const o of room.objects) { assert.equal(E.lookAt(esc, g, o.id).ok, true); E.lookAt(esc, g, o.id); }
    assert.equal(g.clues, room.objects.filter((o) => o.clue).length);
    assert.equal(E.lookAt(esc, g, 'nope').ok, false);
  });
  t('hints are progressive and finite', () => {
    const g = E.newGame(esc);
    const room = esc.rooms[0];
    const texts = [];
    for (let i = 0; i < 3; i++) { const h = E.nextHint(esc, g); assert.ok(h.ok); texts.push(h.text); }
    assert.deepEqual(texts, room.puzzle.hints);
    assert.equal(E.nextHint(esc, g).ok, false);
    assert.equal(E.hintsUsed(g), 3);
  });
  // scenarios
  function full({ looks = true, hints = 0, wrongFirst = 0, timed = true, timeLeft = 300 }) {
    const g = E.newGame(esc, { timed });
    for (const r of esc.rooms) {
      if (looks) for (const o of r.objects) E.lookAt(esc, g, o.id);
      for (let i = 0; i < hints; i++) E.nextHint(esc, g);
      for (let i = 0; i < wrongFirst; i++) E.attempt(esc, g, wrongAnswers(r.puzzle)[0]);
      E.attempt(esc, g, rightAnswer(r.puzzle));
    }
    return { g, gr: E.grade(esc, g, { timeLeft, total: esc.totalSeconds }) };
  }
  const master = full({});
  const hinted = full({ hints: 2 });
  const sloppy = full({ wrongFirst: 2, looks: false });
  const practice = full({ timed: false });
  t('flawless play is Master escapist', () => assert.equal(master.gr.rating.name, 'Master escapist', `${master.gr.points}`));
  t('using hints costs points', () => assert.ok(hinted.gr.points < master.gr.points - 40, `${hinted.gr.points} vs ${master.gr.points}`));
  t('guessing a lot and ignoring clues is still an escape, but a lesser one', () => {
    assert.ok(sloppy.g.escaped);
    assert.ok(['Escaped', 'Clean escape'].includes(sloppy.gr.rating.name), `${sloppy.gr.rating.name} ${sloppy.gr.points}`);
    assert.ok(sloppy.gr.points < master.gr.points - 60);
  });
  t('a slow flawless solve beats a fast sloppy one (accuracy over speed)', () => {
    const slowFlawless = full({ timeLeft: 5 });
    const fastSloppy = full({ wrongFirst: 2, looks: false, timeLeft: 590 });
    assert.ok(slowFlawless.gr.points > fastSloppy.gr.points, `${slowFlawless.gr.points} vs ${fastSloppy.gr.points}`);
  });
  t('practice mode has no time bonus and is not penalised for it being untimed', () => {
    assert.ok(practice.gr.breakdown.some((b) => /Practice mode/.test(b.label)));
    assert.ok(practice.gr.points >= 190, String(practice.gr.points));
  });
  t('running out of time = Locked in, capped under 100, even with a tidy partial run', () => {
    const g = E.newGame(esc);
    const r = esc.rooms[0];
    for (const o of r.objects) E.lookAt(esc, g, o.id);
    E.attempt(esc, g, rightAnswer(r.puzzle));
    E.timeOut(g);
    const gr = E.grade(esc, g, { timeLeft: 0, total: esc.totalSeconds });
    assert.equal(gr.rating.name, 'Locked in');
    assert.ok(gr.points <= 99);
    assert.equal(E.attempt(esc, g, 'x').ok, false);
    assert.equal(gr.solvedCount, 1);
  });
  console.log(`   master=${master.gr.points} hinted=${hinted.gr.points} sloppy=${sloppy.gr.points} practice=${practice.gr.points}`);
}
console.log(n, 'passed');
