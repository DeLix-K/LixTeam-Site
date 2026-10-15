import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'social-engineering/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { SCENARIOS } = await import(pathToFileURL(base + 'scenarios.js').href);
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};

// Play a path through the real engine.
function runPath(sc, path) {
  const run = E.newRun(sc);
  for (const step of path) {
    const node = E.currentNode(sc, run);
    assert.equal(node.id, step.node, 'path went off the rails');
    if (step.choice) assert.ok(E.choose(sc, run, step.choice).ok, `choice ${step.choice} refused at ${node.id}`);
    else assert.ok(E.advance(sc, run).ok, `advance refused at ${node.id}`);
  }
  return run;
}

for (const sc of SCENARIOS) {
  console.log('--- ' + sc.id);
  t('data is well formed', () => {
    assert.ok(sc.title && sc.blurb && sc.setting && sc.ideal && sc.cast && sc.tactics.length);
    assert.equal(sc.question.options.filter((o) => o.correct).length, 1);
    for (const o of sc.question.options) assert.ok(o.text && o.explain);
    assert.ok(sc.nodes[sc.start]);
    for (const [id, node] of Object.entries(sc.nodes)) {
      assert.equal(node.id, id, `node id mismatch ${id}`);
      for (const l of node.lines || []) {
        assert.ok(l.text, `${id} empty line`);
        assert.ok(l.who === 'narr' || sc.cast[l.who], `${id} unknown speaker ${l.who}`);
      }
      const kinds = [node.choices ? 1 : 0, node.continue ? 1 : 0, node.end ? 1 : 0].reduce((a, b) => a + b, 0);
      assert.equal(kinds, 1, `${id} must have exactly one of choices / continue / end`);
      if (node.end) {
        assert.ok(['safe', 'partial', 'compromised', 'obstructive'].includes(node.end.outcome));
        assert.ok(node.end.title && node.end.text);
      }
      if (node.continue) assert.ok(sc.nodes[node.continue], `${id} continue -> unknown ${node.continue}`);
      if (node.choices) {
        assert.ok(node.choices.length >= 1);
        const ids = node.choices.map((c) => c.id);
        assert.equal(new Set(ids).size, ids.length, `${id} duplicate choice ids`);
        for (const c of node.choices) {
          assert.ok(['good', 'ok', 'bad'].includes(c.tag), `${id}/${c.id} tag`);
          assert.ok(c.label && c.coach, `${id}/${c.id} needs label and coach`);
          assert.ok(sc.nodes[c.next], `${id}/${c.id} -> unknown ${c.next}`);
        }
      }
    }
  });
  const paths = (() => { try { return E.allPaths(sc); } catch (e) { return e; } })();
  t('graph is acyclic and every node is reachable', () => {
    assert.ok(Array.isArray(paths), String(paths));
    const reached = new Set([sc.start, ...paths.flatMap((p) => p.path.map((s) => s.node)), ...paths.map((p) => p.last)]);
    assert.deepEqual(Object.keys(sc.nodes).filter((id) => !reached.has(id)), [], 'unreachable nodes');
  });
  if (!Array.isArray(paths)) continue;
  const grades = paths.map((p) => {
    const run = runPath(sc, p.path);
    const right = { right: true, conf: 'fairly' };
    return { p, run, g: E.grade(sc, run, right) };
  });
  console.log(`   ${paths.length} paths; endings: ${[...new Set(paths.map((p) => p.end))].join(', ')}`);
  t('there is a safe ending, and a way to fail', () => {
    assert.ok(paths.some((p) => p.end === 'safe'), 'no safe ending');
    assert.ok(paths.some((p) => ['compromised', 'obstructive'].includes(p.end)), 'no failing ending');
  });
  t('the best path is Unshakeable', () => {
    const best = grades.reduce((a, b) => (b.g.points > a.g.points ? b : a));
    assert.equal(best.g.rating.name, 'Unshakeable', `${best.g.points} ${best.g.rating.name}`);
    assert.equal(best.p.end, 'safe');
  });
  t('every compromise is "Taken in", even with the right debrief answer', () => {
    for (const x of grades.filter((g) => g.p.end === 'compromised')) assert.equal(x.g.rating.name, 'Taken in', `${x.g.points} via ${x.p.path.map((s) => s.choice).join('>')}`);
  });
  t('an unverified or unreported "safe" ending can never beat the full-marks route', () => {
    const best = Math.max(...grades.map((g) => g.g.points));
    for (const x of grades.filter((g) => g.p.end !== 'safe')) assert.ok(x.g.points < best, `non-safe ${x.g.points} >= best ${best}`);
  });
  t('the debrief answer adds points; certain+wrong costs', () => {
    const { run } = grades.reduce((a, b) => (b.g.points > a.g.points ? b : a));
    const right = E.grade(sc, run, { right: true, conf: 'fairly' }).points;
    const wrong = E.grade(sc, run, { right: false, conf: 'certain' }).points;
    assert.ok(right - wrong >= 20);
  });
  const scores = grades.map((g) => g.g.points);
  console.log(`   scores: min ${Math.min(...scores)}, max ${Math.max(...scores)}; ratings: ${[...new Set(grades.map((g) => g.g.rating.name))].join(', ')}`);
}

console.log('--- scenario-specific');
const real = SCENARIOS.find((s) => s.id === 'real-it');
t('real-it: hanging up on a genuine caller is rated no higher than Cautious', () => {
  const run = E.newRun(real);
  E.choose(real, run, 'a4');
  assert.equal(run.outcome, 'obstructive');
  const g = E.grade(real, run, { right: true, conf: 'fairly' });
  assert.ok(['Taken in', 'Cautious'].includes(g.rating.name), g.rating.name);
});
t('real-it: trusting without checking is not full marks even though nothing went wrong', () => {
  const run = E.newRun(real);
  E.choose(real, run, 'a1');
  E.advance(real, run);
  assert.equal(run.outcome, 'partial');
  assert.notEqual(E.grade(real, run, { right: true, conf: 'fairly' }).rating.name, 'Unshakeable');
});
t('relationship is clamped 0..100 and risk is clamped', () => {
  const run = E.newRun(real);
  run.rel = 5; run.risk = 95;
  E.choose(real, run, 'a4');
  assert.equal(run.rel, 0);
  const it = SCENARIOS[0];
  const r2 = E.newRun(it);
  r2.risk = 90;
  E.choose(it, r2, 'a1');
  assert.equal(r2.risk, 100);
});
t('choosing after the end is refused', () => {
  const it = SCENARIOS[0];
  const r = E.newRun(it);
  E.choose(it, r, 'a1'); E.advance(it, r);
  assert.equal(r.done, true);
  assert.equal(E.choose(it, r, 'a1').ok, false);
});
console.log(n, 'passed');
