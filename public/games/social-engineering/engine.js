// Social Engineering Simulator rules, with no screen code so every path can be
// tested. A scenario is a graph of nodes. Each node has lines of dialogue and
// either choices (the player's replies), a `continue` to the next node, or an
// `end`. Choices carry a tag and effects on two meters:
//   risk         how much danger the company is in because of your choices
//   relationship how well you are getting on with the other person; being
//                needlessly rude to someone genuine costs you
// There is no timer: a real social engineer's weapon is pressure, so the
// characters push and the player has to hold steady.

export const START_RELATIONSHIP = 70;

export function newRun(sc) {
  return {
    node: sc.start,
    risk: 0,
    rel: START_RELATIONSHIP,
    flags: {},
    history: [], // { node, choice }
    done: false,
    outcome: null,
  };
}

export function getNode(sc, id) {
  const n = sc.nodes[id];
  if (!n) throw new Error(`Unknown node "${id}" in ${sc.id}`);
  return n;
}

export function currentNode(sc, run) {
  return getNode(sc, run.node);
}

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

function enter(sc, run, id) {
  run.node = id;
  const n = getNode(sc, id);
  if (n.end) {
    run.done = true;
    run.outcome = n.end.outcome;
  }
}

// Apply the player's choice. Returns { ok, choice }.
export function choose(sc, run, choiceId) {
  if (run.done) return { ok: false };
  const node = currentNode(sc, run);
  const choice = (node.choices || []).find((c) => c.id === choiceId);
  if (!choice) return { ok: false };
  run.history.push({ node: node.id, choice: choice.id });
  run.risk = clamp(run.risk + (choice.risk || 0));
  run.rel = clamp(run.rel + (choice.rel || 0));
  if (choice.set) Object.assign(run.flags, choice.set);
  enter(sc, run, choice.next);
  return { ok: true, choice };
}

// For nodes with no choices, only a continue.
export function advance(sc, run) {
  if (run.done) return { ok: false };
  const node = currentNode(sc, run);
  if (!node.continue) return { ok: false };
  enter(sc, run, node.continue);
  return { ok: true };
}

export function taken(sc, run) {
  return run.history.map((h) => {
    const node = getNode(sc, h.node);
    return { node, choice: node.choices.find((c) => c.id === h.choice) };
  });
}

// answers: { right: boolean, conf }
export function grade(sc, run, answers = {}) {
  const picks = taken(sc, run).map((t) => t.choice);
  const good = picks.filter((c) => c.tag === 'good').length;
  const bad = picks.filter((c) => c.tag === 'bad').length;
  const breakdown = [];
  const add = (label, points) => breakdown.push({ label, points: Math.round(points) });

  add('Base', 100);
  if (good) add(`Smart moves (${good})`, good * 8);
  if (bad) add(`Risky moves (${bad})`, -bad * 15);
  if (run.risk) add(`Risk you let through (${run.risk}%)`, -run.risk * 0.4);
  const relPoints = (run.rel - START_RELATIONSHIP) * 0.3;
  if (relPoints) add(run.rel >= START_RELATIONSHIP ? 'Relationship kept healthy' : 'Relationship damaged', relPoints);
  if (run.flags.verified) add('Verified through your own channel', 20);
  if (run.flags.reported) add('Reported it', 10);
  if (answers.right !== undefined) {
    add(answers.right ? 'Spotted the tactic' : 'Missed the tactic', answers.right ? 15 : 0);
    if (answers.conf === 'certain') add(answers.right ? 'Confident and right' : 'Certain, but wrong', answers.right ? 5 : -10);
  }

  let points = breakdown.reduce((n, b) => n + b.points, 0);
  // The outcome caps the grade: a charming tone cannot rescue a compromise.
  if (run.outcome === 'compromised') points = Math.min(points, 49);
  else if (run.outcome === 'obstructive') points = Math.min(points, 79);
  else if (run.outcome === 'partial') points = Math.min(points, 129);
  // Nothing bad happening is not the same as being careful: no top marks without checking.
  if (!run.flags.verified && run.outcome !== 'compromised') points = Math.min(points, 99);

  const rating = [...sc.ratings].reverse().find((r) => points >= r.min) || sc.ratings[0];
  return { points, rating, breakdown, good, bad };
}

// Every route from the start to an ending, for testing and for the replay.
export function allPaths(sc) {
  const out = [];
  const walk = (id, path, seen) => {
    const n = getNode(sc, id);
    if (n.end) return out.push({ path, end: n.end.outcome, last: id });
    const edges = n.choices ? n.choices.map((c) => ({ c: c.id, next: c.next })) : n.continue ? [{ c: null, next: n.continue }] : [];
    if (!edges.length) throw new Error(`Node "${id}" has no way forward`);
    for (const e of edges) {
      if (seen.has(e.next)) throw new Error(`Cycle at ${id} -> ${e.next}`);
      walk(e.next, [...path, { node: id, choice: e.c }], new Set([...seen, e.next]));
    }
  };
  walk(sc.start, [], new Set([sc.start]));
  return out;
}
