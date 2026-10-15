import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'simulation/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { SIMS } = await import(pathToFileURL(base + 'sims.js').href);
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};

// Play a simulation. `mode` is applied to every stage of a type:
//   best (default) | worst | slip (one small mistake per stage that can have one)
// `override[stageId]` can force a specific decision option id.
function play(sim, { mode = 'best', override = {}, omitHonest = false, addWrong = false, everything = false } = {}) {
  const st = E.newSim();
  let report = null;
  for (const stage of sim.stages) {
    let res;
    if (stage.type === 'triage') {
      const answers = {};
      const alerts = E.visible(stage.alerts, st.flags);
      alerts.forEach((a, i) => {
        const wrong = mode === 'worst' || (mode === 'slip' && i === 0);
        answers[a.id] = wrong ? E.TRIAGE_ACTIONS.find((x) => x.id !== a.answer).id : a.answer;
      });
      res = E.scoreTriage(stage, st.flags, answers);
    } else if (stage.type === 'prioritise') {
      const items = E.visible(stage.items, st.flags);
      let order = [...items].sort((a, b) => a.priority - b.priority).map((x) => x.id);
      if (mode === 'worst') order = [...order].reverse();
      if (mode === 'slip') order = [order[1], order[0], ...order.slice(2)];
      res = E.scorePrioritise(stage, st.flags, order);
    } else if (stage.type === 'evidence') {
      const lines = E.allLines(stage, st.flags);
      let flagged = lines.filter((l) => l.type === 'clue').map((l) => l.id);
      if (mode === 'worst') flagged = [];
      if (mode === 'slip') flagged = [...flagged, ...lines.filter((l) => l.type !== 'clue').slice(0, 1).map((l) => l.id)];
      if (everything) flagged = lines.map((l) => l.id);
      res = E.scoreEvidence(stage, st.flags, flagged);
    } else if (stage.type === 'decision') {
      const opts = E.visible(stage.options, st.flags);
      const want = override[stage.id] ? null : mode === 'worst' ? 0 : mode === 'slip' ? 2 : 3;
      const pick = override[stage.id] ? opts.find((o) => o.id === override[stage.id]) : [...opts].sort((a, b) => Math.abs(a.quality - want) - Math.abs(b.quality - want) || b.quality - a.quality)[0];
      res = E.scoreDecision(stage, st.flags, pick.id);
    } else if (stage.type === 'allocate') {
      const items = E.visible(stage.items, st.flags);
      const alloc = Object.fromEntries(items.map((i) => [i.id, i.ideal]));
      if (mode === 'worst') {
        for (const i of items) alloc[i.id] = 0;
        alloc[[...items].sort((a, b) => a.ideal - b.ideal)[0].id] = stage.budget;
      }
      if (mode === 'slip') { alloc[items[0].id] -= 1; alloc[items[1].id] += 1; }
      res = E.scoreAllocate(stage, st.flags, alloc);
    } else if (stage.type === 'review') {
      const items = E.visible(stage.statements, st.flags);
      let flagged = items.filter((x) => !x.sound).map((x) => x.id);
      if (mode === 'worst') flagged = items.filter((x) => x.sound).map((x) => x.id);
      if (mode === 'slip') flagged = flagged.slice(1);
      res = E.scoreReview(stage, st.flags, flagged);
    } else if (stage.type === 'report') {
      const ss = E.visible(stage.statements, st.flags);
      const aa = E.visible(stage.actions, st.flags);
      let sIds = ss.filter((x) => x.correct).map((x) => x.id);
      let aIds = aa.filter((x) => x.correct).map((x) => x.id);
      if (omitHonest) sIds = sIds.filter((id) => !ss.find((x) => x.id === id).when);
      if (addWrong) { sIds = [...sIds, ...ss.filter((x) => !x.correct).map((x) => x.id)]; aIds = [...aIds, ...aa.filter((x) => !x.correct).map((x) => x.id)]; }
      if (mode === 'worst') { sIds = []; aIds = []; }
      res = E.scoreReport(stage, st.flags, sIds, aIds);
      report = E.reportText(sim, stage, res);
    }
    E.completeStage(sim, st, res);
  }
  return { st, tot: E.totals(st), report };
}

const KNOWN = ['triage', 'evidence', 'decision', 'prioritise', 'review', 'report', 'allocate'];
for (const sim of SIMS) {
  console.log('--- ' + sim.id + '  [' + sim.stages.map((s) => s.type).join(' > ') + ']');
  t('data is well formed', () => {
    assert.ok(sim.title && sim.blurb && sim.brief.length && sim.ratings.length === 4 && sim.skill && sim.minutes > 0);
    const ids = sim.stages.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate stage ids');
    assert.ok(sim.stages.every((s) => KNOWN.includes(s.type) && s.title && s.intro !== undefined));
    assert.equal(sim.stages[sim.stages.length - 1].type, 'report', 'ends with a report');
    assert.ok(sim.stages.some((s) => s.type === 'evidence'));
    assert.ok(sim.stages.filter((s) => s.type === 'decision').length >= 1);
    const flagsSet = new Set(sim.stages.filter((s) => s.type === 'decision').flatMap((s) => s.options.flatMap((o) => Object.keys(o.set || {}))));
    const flagsUsed = (items = []) => items.flatMap((i) => (i.when ? [typeof i.when === 'string' ? i.when : i.when.flag] : []));
    for (const s of sim.stages) {
      const used = [...flagsUsed(s.alerts), ...flagsUsed(s.options), ...flagsUsed(s.statements), ...flagsUsed(s.actions), ...flagsUsed(s.notes), ...flagsUsed(s.items), ...(s.artefacts || []).flatMap((a) => flagsUsed(a.lines))];
      for (const f of used) assert.ok(flagsSet.has(f), `${s.id} uses flag "${f}" that no decision sets`);
      if (s.type === 'triage') {
        const act = s.alerts.map((a) => a.answer);
        for (const a of E.TRIAGE_ACTIONS) assert.ok(act.includes(a.id), s.id + ' needs at least one "' + a.id + '" alert');
        for (const a of s.alerts) assert.ok(a.explain && a.text && a.source && a.time);
      }
      if (s.type === 'prioritise') {
        const pr = s.items.filter((i) => !i.when).map((i) => i.priority).sort((a, b) => a - b);
        assert.deepEqual(pr, pr.map((_, i) => i + 1), 'priorities must be 1..n with no gaps or ties');
        assert.ok(pr.length >= 3);
        for (const i of s.items) assert.ok(i.text && i.why && i.source);
      }
      if (s.type === 'evidence') {
        const lineIds = s.artefacts.flatMap((a) => a.lines.map((l) => l.id));
        assert.equal(new Set(lineIds).size, lineIds.length, 'duplicate line ids');
        for (const id of Object.keys(s.clues)) assert.equal(s.artefacts.flatMap((a) => a.lines).filter((l) => l.clue === id).length, 1, 'clue ' + id);
        assert.ok(Object.values(s.clues).filter((c) => c.strength === 'strong').length >= 4);
        for (const l of s.artefacts.flatMap((a) => a.lines)) assert.ok(l.note && l.text);
        assert.ok(s.artefacts.flatMap((a) => a.lines).filter((l) => l.type === 'herring').length >= 3, 'needs red herrings');
      }
      if (s.type === 'decision') {
        assert.ok(s.options.some((o) => o.quality === 3) && s.options.some((o) => o.quality === 0));
        for (const o of s.options) assert.ok([0, 1, 2, 3].includes(o.quality) && o.consequence && o.text);
        assert.equal(s.options.filter((o) => o.quality === 3).length, 1, 'exactly one best option');
      }
      if (s.type === 'allocate') {
        assert.ok(s.budget >= 4 && s.unit && s.items.length >= 3);
        assert.equal(s.items.filter((i) => !i.when).reduce((n, i) => n + i.ideal, 0), s.budget, 'the sensible amounts must add up to the budget');
        for (const i of s.items) assert.ok(Number.isInteger(i.ideal) && i.ideal >= 0 && i.text && i.why && i.source);
        assert.ok(new Set(s.items.map((i) => i.ideal)).size >= 2, 'not an even split');
      }
      if (s.type === 'review') {
        assert.ok(s.statements.filter((x) => !x.sound).length >= 3 && s.statements.filter((x) => x.sound).length >= 2);
        for (const x of s.statements) assert.ok(x.text && x.why);
      }
      if (s.type === 'report') {
        assert.ok(s.statements.filter((x) => !x.when && x.correct).length >= 4 && s.statements.filter((x) => !x.when && !x.correct).length >= 2);
        assert.ok(s.actions.filter((x) => x.correct).length >= 3 && s.actions.some((x) => !x.correct));
        for (const x of [...s.statements, ...s.actions]) assert.ok(x.text && x.why);
      }
    }
  });
  const perfect = play(sim);
  t('perfect play scores 100% (tier 3)', () => { assert.equal(perfect.tot.tier, 3); assert.equal(perfect.tot.points, perfect.tot.max); });
  t('the report text lists findings and recommendations', () => { assert.match(perfect.report, /INCIDENT REPORT/); assert.match(perfect.report, /Findings:/); assert.match(perfect.report, /Recommendations:/); assert.match(perfect.report, /Not a real incident/); });
  t('flagging every evidence line is punished', () => { const r = play(sim, { everything: true }); assert.ok(r.tot.points < perfect.tot.points - 15, `${r.tot.points} vs ${perfect.tot.points}`); });
  t('padding the report with unsupported claims is punished', () => { const r = play(sim, { addWrong: true }); assert.ok(r.tot.points < perfect.tot.points - 40, `${r.tot.points}`); assert.ok(r.tot.tier < 3); });
  t('the worst play at every stage is tier 0', () => { const r = play(sim, { mode: 'worst' }); assert.equal(r.tot.tier, 0, JSON.stringify(r.tot)); });
  t('one slip per stage still passes at silver or better, but is not perfect', () => {
    const r = play(sim, { mode: 'slip' });
    assert.ok(r.tot.points < perfect.tot.points, 'slips must cost something');
    assert.ok(r.tot.tier >= 1, `tier ${r.tot.tier} (${Math.round(r.tot.perf * 100)}%)`);
  });
  t('a good first decision earns more than a poor one, and the maximum adapts to the branch', () => {
    const dec = sim.stages.find((s) => s.type === 'decision');
    const poor = dec.options.find((o) => o.quality === 1) || dec.options.find((o) => o.quality === 2);
    const p = play(sim, { override: { [dec.id]: poor.id } });
    assert.ok(perfect.tot.points > p.tot.points);
    assert.ok(p.tot.max > 0);
  });
  t('decisions branch the story: different choices change what the report contains', () => {
    const contain = sim.stages.find((s) => s.type === 'decision' && s.options.some((o) => o.set && Object.keys(o.set).length >= 1));
    assert.ok(contain, 'a decision that sets flags');
    const report = sim.stages.find((s) => s.type === 'report');
    const seen = new Set(contain.options.filter((o) => o.set).map((o) => E.visible(report.statements, { ...o.set }).map((x) => x.id).join(',')));
    assert.ok(seen.size >= 2, 'different choices give different reports');
  });
  t('honesty is rewarded: leaving out a flagged "what went wrong" statement costs points', () => {
    const decs = sim.stages.filter((s) => s.type === 'decision');
    let tested = false;
    for (const dec of decs) {
      const bad = dec.options.find((o) => o.set && Object.keys(o.set).length && o.quality < 3 && sim.stages.find((s) => s.type === 'report').statements.some((x) => x.when && (typeof x.when === 'string' ? o.set[x.when] : o.set[x.when.flag])));
      if (!bad) continue;
      const full = play(sim, { override: { [dec.id]: bad.id } });
      const omitted = play(sim, { override: { [dec.id]: bad.id }, omitHonest: true });
      assert.ok(omitted.tot.points < full.tot.points, `${omitted.tot.points} vs ${full.tot.points}`);
      tested = true;
      break;
    }
    assert.ok(tested, 'found a decision to test');
  });
  t('stage notes appear only on the branches that trigger them', () => {
    const stage = sim.stages.find((s) => s.notes);
    if (!stage) return;
    assert.deepEqual(E.notes(stage, {}), []);
    for (const nn of stage.notes) assert.deepEqual(E.notes(stage, { [typeof nn.when === 'string' ? nn.when : nn.when.flag]: true }).includes(nn.text), true);
  });
  const slip = play(sim, { mode: 'slip' });
  console.log(`   max=${perfect.tot.max}  perfect=${perfect.tot.points}  one-slip-per-stage=${slip.tot.points} (${Math.round(slip.tot.perf * 100)}%, tier ${slip.tot.tier})  worst=${play(sim, { mode: 'worst' }).tot.points}`);
}

console.log('--- new stage types');
const LW = SIMS.find((s) => s.id === 'long-weekend');
const SX = SIMS.find((s) => s.id === 'senior-exam');
t('prioritise: exact ranking = full marks; adjacent swap = half; reversed is poor; missing item = 0', () => {
  const stage = LW.stages[0];
  const items = [...stage.items].sort((a, b) => a.priority - b.priority).map((x) => x.id);
  assert.equal(E.scorePrioritise(stage, {}, items).score, E.scorePrioritise(stage, {}, items).max);
  const swapped = E.scorePrioritise(stage, {}, [items[1], items[0], ...items.slice(2)]);
  assert.equal(swapped.score, 5 + 5 + 10 + 10);
  assert.ok(E.scorePrioritise(stage, {}, [...items].reverse()).score < swapped.score);
  assert.equal(E.scorePrioritise(stage, {}, []).score, 0);
});
t('review: each flaw found +8, each sound claim challenged -8, floor 0, max = flaws x 8', () => {
  const stage = SX.stages.find((s) => s.type === 'review');
  const flawed = stage.statements.filter((x) => !x.sound).map((x) => x.id);
  const sound = stage.statements.filter((x) => x.sound).map((x) => x.id);
  const r = E.scoreReview(stage, {}, flawed);
  assert.equal(r.score, r.max); assert.equal(r.max, flawed.length * 8);
  assert.equal(E.scoreReview(stage, {}, [...flawed, sound[0]]).score, r.max - 8);
  assert.equal(E.scoreReview(stage, {}, sound).score, 0);
  assert.equal(E.scoreReview(stage, {}, []).score, 0);
});
t('the senior exam: strong play passes (tier 2+), one slip per stage still does, sloppy play does not', () => {
  assert.ok(play(SX).tot.tier === 3);
  assert.ok(play(SX, { mode: 'slip' }).tot.tier >= 2, `slip tier ${play(SX, { mode: 'slip' }).tot.tier}`);
  const sloppy = play(SX, { mode: 'worst', override: {} });
  assert.ok(sloppy.tot.tier < 2);
});
t('tiers: cut-offs are 55 / 75 / 90 percent', () => {
  const mk = (perf) => E.totals({ results: [{ score: perf * 100, max: 100 }] }).tier;
  assert.equal(mk(0.54), 0); assert.equal(mk(0.55), 1); assert.equal(mk(0.74), 1); assert.equal(mk(0.75), 2); assert.equal(mk(0.89), 2); assert.equal(mk(0.9), 3);
});
t('scoring helpers: null for an unknown option, floor at zero', () => {
  const sim = SIMS[0];
  assert.equal(E.scoreDecision(sim.stages[2], {}, 'nope'), null);
  const ev = sim.stages[1];
  assert.equal(E.scoreEvidence(ev, {}, E.allLines(ev, {}).filter((l) => l.type !== 'clue').map((l) => l.id)).score, 0);
});

console.log('--- allocate stage');
const NS = SIMS.find((x) => x.id === 'night-shift');
const staffing = NS.stages.find((x) => x.type === 'allocate');
const ideal = () => Object.fromEntries(staffing.items.map((i) => [i.id, i.ideal]));
t('allocate: the sensible split is full marks; being one out is partial; being further out is nothing', () => {
  assert.equal(E.scoreAllocate(staffing, {}, ideal()).score, staffing.items.length * E.ALLOCATE.exact);
  const one = { ...ideal(), live: ideal().live - 1, phish: ideal().phish + 1 };
  assert.equal(E.scoreAllocate(staffing, {}, one).score, staffing.items.length * 10 - 20 + 2 * E.ALLOCATE.near);
  const far = { ...ideal(), live: 0, phish: ideal().phish + ideal().live };
  assert.equal(E.scoreAllocate(staffing, {}, far).detail.find((d) => d.id === 'live').points, 0);
});
t('allocate: an even split earns clearly less than the sensible one', () => {
  const even = Object.fromEntries(staffing.items.map((i, k) => [i.id, k < staffing.budget % staffing.items.length ? Math.ceil(staffing.budget / staffing.items.length) : Math.floor(staffing.budget / staffing.items.length)]));
  assert.ok(E.scoreAllocate(staffing, {}, even).score < E.scoreAllocate(staffing, {}, ideal()).score - 10);
});
t('allocate: missing items count as zero units, junk values are ignored, and the total is counted', () => {
  const r = E.scoreAllocate(staffing, {}, { live: 'x', phish: -3, nonsense: 99 });
  assert.ok(r.score >= 0 && r.score <= r.max);
  assert.equal(E.allocateTotal({ a: 2, b: 3, c: NaN }), 5);
});
t('allocate: stageMax matches the scoring maximum, and the stage is in the manager sims', () => {
  assert.equal(E.stageMax(staffing, {}), staffing.items.length * 10);
  const types = SIMS.filter((x) => ['night-shift', 'risk-register', 'manager-exam'].includes(x.id)).map((x) => x.stages.some((y) => y.type === 'allocate'));
  assert.deepEqual(types, [true, true, true]);
});

console.log(n, 'passed');
