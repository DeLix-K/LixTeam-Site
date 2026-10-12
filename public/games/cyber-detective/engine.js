// Cyber Detective rules, with no screen code so they can be tested on their own.
//
// A case is a set of pieces of evidence ("artefacts"). Each artefact is a list
// of lines. The player flags the lines they think matter:
//   - a real clue is recorded on the case board and may unlock new evidence
//   - a red herring or an ordinary line costs a little (guessing everything
//     does not pay), and the note explains why it was nothing
// At the end the player names the attack, picks the clues that prove it, and
// chooses a first response.

export const FALSE_FLAG_PENALTY = 10;

export function newCase(c) {
  return {
    id: c.id,
    flagged: {}, // lineId -> 'clue' | 'herring' | 'plain'
    found: [], // clue ids, in the order discovered
    falseFlags: 0,
    log: [],
  };
}

export function isUnlocked(artefact, st) {
  return !artefact.unlockedBy || st.found.includes(artefact.unlockedBy);
}

export function unlockedArtefacts(c, st) {
  return c.artefacts.filter((a) => isUnlocked(a, st));
}

// Returns { ok:false } if the line cannot be flagged, otherwise what happened.
export function flagLine(c, st, artefactId, lineId) {
  const art = c.artefacts.find((a) => a.id === artefactId);
  if (!art || !isUnlocked(art, st)) return { ok: false };
  const line = art.lines.find((l) => l.id === lineId);
  if (!line || st.flagged[line.id]) return { ok: false };

  const before = unlockedArtefacts(c, st).map((a) => a.id);
  st.flagged[line.id] = line.type;

  if (line.type === 'clue') {
    if (!st.found.includes(line.clue)) st.found.push(line.clue);
    const unlocked = unlockedArtefacts(c, st).map((a) => a.id).filter((id) => !before.includes(id));
    st.log.push({ line: line.id, type: 'clue', clue: line.clue });
    return { ok: true, type: 'clue', note: line.note, clue: line.clue, unlocked };
  }
  st.falseFlags += 1;
  st.log.push({ line: line.id, type: line.type });
  return { ok: true, type: line.type, note: line.note, unlocked: [] };
}

export function allClueIds(c) {
  return Object.keys(c.clues);
}

export function canSolve(c, st) {
  return st.found.length >= 2;
}

// answers: { attack, attackConf, support: [clueIds], action }
export function grade(c, st, answers) {
  const breakdown = [];
  const add = (label, points) => breakdown.push({ label, points: Math.round(points) });

  add('Base', 100);
  const strong = st.found.filter((id) => c.clues[id].strength === 'strong');
  const weak = st.found.filter((id) => c.clues[id].strength !== 'strong');
  add(`Key clues found (${strong.length} of ${allClueIds(c).filter((id) => c.clues[id].strength === 'strong').length})`, strong.length * 15);
  if (weak.length) add(`Minor clues found (${weak.length})`, weak.length * 5);
  if (st.falseFlags) add(`Wrong flags (${st.falseFlags})`, -st.falseFlags * FALSE_FLAG_PENALTY);

  const attackRight = c.solution.attack.find((o) => o.id === answers.attack)?.correct === true;
  add(attackRight ? 'Named the attack correctly' : 'Named the wrong attack', attackRight ? 30 : 0);
  if (answers.attackConf === 'certain') add(attackRight ? 'Confident and right' : 'Certain, but wrong', attackRight ? 10 : -15);

  const picked = (answers.support || []).filter((id) => st.found.includes(id));
  const goodPicks = picked.filter((id) => c.clues[id].strength === 'strong');
  const badPicks = picked.filter((id) => c.clues[id].strength !== 'strong');
  add(`Best evidence chosen (${goodPicks.length})`, goodPicks.length * 12);
  if (badPicks.length) add(`Weak evidence offered as proof (${badPicks.length})`, -badPicks.length * 6);

  const actionRight = c.solution.action.find((o) => o.id === answers.action)?.correct === true;
  add(actionRight ? 'Chose the right first response' : 'Chose a weaker first response', actionRight ? 20 : 0);

  const points = breakdown.reduce((n, b) => n + b.points, 0);
  const rating = [...c.ratings].reverse().find((r) => points >= r.min) || c.ratings[0];
  const missed = allClueIds(c).filter((id) => !st.found.includes(id));
  return { points, rating, breakdown, missed, attackRight, actionRight };
}
