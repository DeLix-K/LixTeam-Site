import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'cyber-detective/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { CASES } = await import(pathToFileURL(base + 'cases.js').href);
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};

// flag every line (in unlock order) that matches a predicate, repeating until nothing new unlocks
function play(c, want) {
  const st = E.newCase(c);
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const a of E.unlockedArtefacts(c, st)) {
      for (const l of a.lines) {
        if (!st.flagged[l.id] && want(l)) {
          E.flagLine(c, st, a.id, l.id);
          progressed = true;
        }
      }
    }
  }
  return st;
}
const best = (c) => ({
  attack: c.solution.attack.find((o) => o.correct).id,
  attackConf: 'fairly',
  support: Object.keys(c.clues).filter((id) => c.clues[id].strength === 'strong').slice(0, 3),
  action: c.solution.action.find((o) => o.correct).id,
});

for (const c of CASES) {
  console.log('--- ' + c.id);
  t('data is well formed', () => {
    const lineIds = c.artefacts.flatMap((a) => a.lines.map((l) => l.id));
    assert.equal(new Set(lineIds).size, lineIds.length, 'duplicate line ids');
    const artIds = c.artefacts.map((a) => a.id);
    assert.equal(new Set(artIds).size, artIds.length, 'duplicate artefact ids');
    assert.ok(!c.artefacts[0].unlockedBy, 'first artefact must be open');
    for (const a of c.artefacts) {
      if (a.unlockedBy) assert.ok(c.clues[a.unlockedBy], `${a.id} unlockedBy unknown clue`);
      for (const l of a.lines) {
        assert.ok(['clue', 'herring', 'plain'].includes(l.type), l.id + ' type');
        assert.ok(l.note && l.text, l.id + ' needs text and note');
        if (l.type === 'clue') assert.ok(c.clues[l.clue], l.id + ' clue id');
      }
    }
    for (const id of Object.keys(c.clues)) {
      const lines = c.artefacts.flatMap((a) => a.lines).filter((l) => l.clue === id);
      assert.equal(lines.length, 1, `clue ${id} must be on exactly one line (found ${lines.length})`);
      assert.ok(['strong', 'weak'].includes(c.clues[id].strength));
    }
    assert.equal(c.solution.attack.filter((o) => o.correct).length, 1);
    assert.equal(c.solution.action.filter((o) => o.correct).length, 1);
    for (const o of [...c.solution.attack, ...c.solution.action]) assert.ok(o.explain && o.text);
    assert.ok(Object.values(c.clues).filter((x) => x.strength === 'strong').length >= 4, 'needs at least four strong clues');
  });
  t('every clue is reachable by playing', () => {
    const st = play(c, (l) => l.type === 'clue');
    assert.equal(st.found.length, Object.keys(c.clues).length, 'unreachable: ' + Object.keys(c.clues).filter((x) => !st.found.includes(x)));
  });
  t('locked evidence cannot be flagged early', () => {
    const st = E.newCase(c);
    const locked = c.artefacts.find((a) => a.unlockedBy);
    assert.equal(E.flagLine(c, st, locked.id, locked.lines[0].id).ok, false);
  });
  t('flagging a clue unlocks the next evidence and reports it', () => {
    const st = E.newCase(c);
    const first = E.unlockedArtefacts(c, st)[0];
    let unlockedSomething = false;
    for (const a of E.unlockedArtefacts(c, st)) {
      for (const l of a.lines.filter((x) => x.type === 'clue')) {
        const r = E.flagLine(c, st, a.id, l.id);
        if (r.unlocked && r.unlocked.length) unlockedSomething = true;
      }
    }
    assert.ok(unlockedSomething);
  });
  t('a line can only be flagged once', () => {
    const st = E.newCase(c);
    const a = c.artefacts[0];
    assert.equal(E.flagLine(c, st, a.id, a.lines[0].id).ok, true);
    assert.equal(E.flagLine(c, st, a.id, a.lines[0].id).ok, false);
  });
  const ideal = (() => { const st = play(c, (l) => l.type === 'clue'); return { st, g: E.grade(c, st, best(c)) }; })();
  t('perfect play = Chief Inspector', () => assert.equal(ideal.g.rating.name, 'Chief Inspector', `got ${ideal.g.rating.name} (${ideal.g.points})`));
  const strongOnly = (() => { const st = play(c, (l) => l.type === 'clue' && c.clues[l.clue].strength === 'strong'); return E.grade(c, st, best(c)); })();
  t('only the key clues is still Chief Inspector or Detective', () => assert.ok(['Chief Inspector', 'Detective'].includes(strongOnly.rating.name), strongOnly.rating.name + ' ' + strongOnly.points));
  const guessAll = (() => { const st = play(c, () => true); return { st, g: E.grade(c, st, best(c)) }; })();
  t('flagging everything is punished (worse than precise play)', () => { assert.ok(guessAll.st.falseFlags >= 6); assert.ok(guessAll.g.points < ideal.g.points - 30, `${guessAll.g.points} vs ${ideal.g.points}`); });
  const wrongAnswers = (() => {
    const st = play(c, (l) => l.type === 'clue');
    return E.grade(c, st, { attack: c.solution.attack.find((o) => !o.correct).id, attackConf: 'certain', support: Object.keys(c.clues).filter((id) => c.clues[id].strength === 'weak').slice(0, 3), action: c.solution.action.find((o) => !o.correct).id });
  })();
  t('wrong attack, weak evidence and wrong action = Rookie or Junior', () => assert.ok(['Rookie', 'Junior detective'].includes(wrongAnswers.rating.name), wrongAnswers.rating.name + ' ' + wrongAnswers.points));
  t('being certain and wrong costs extra', () => assert.ok(wrongAnswers.breakdown.some((b) => /Certain, but wrong/.test(b.label))));
  const lazy = (() => { const st = E.newCase(c); const a = c.artefacts[0]; const l = a.lines.find((x) => x.type === 'clue'); E.flagLine(c, st, a.id, l.id); return { st, g: E.grade(c, st, best(c)) }; })();
  t('one clue and correct answers is not top rated', () => assert.notEqual(lazy.g.rating.name, 'Chief Inspector', lazy.g.points));
  t('cannot solve with fewer than two clues; can with two', () => {
    const st = E.newCase(c);
    assert.equal(E.canSolve(c, st), false);
    play(c, (l) => l.type === 'clue');
    const st2 = play(c, (l) => l.type === 'clue');
    assert.equal(E.canSolve(c, st2), true);
  });
  t('support picks outside found clues are ignored', () => {
    const st = E.newCase(c);
    const g = E.grade(c, st, { ...best(c) });
    assert.ok(!g.breakdown.some((b) => /Best evidence chosen \([1-9]/.test(b.label)));
  });
  console.log(`   perfect=${ideal.g.points} keyOnly=${strongOnly.points} guessAll=${guessAll.g.points} wrong=${wrongAnswers.points} lazy=${lazy.g.points}`);
}
console.log(n, 'passed');
