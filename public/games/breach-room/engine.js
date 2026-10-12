// The Breach Room rules, with no screen code so they can be tested on their own.
//
// A case is a pile of evidence cards from different sources (email, identity,
// endpoint, files, network). The player reconstructs the attack by deciding
// which stage of the attack each card belongs to, or that it is unrelated
// noise. Indicators on the cards (an IP address, an account, a domain) can be
// pivoted on to see every card they appear in, which is how real analysts
// connect evidence across tools. When every stage is complete, the full
// explanation unlocks and the player answers questions about root cause and
// prevention.

export const WRONG_COST = 5;
export const PIVOT_BONUS = 3;
export const PIVOT_CAP = 5;

export function newGame(c) {
  return {
    placed: {}, // cardId -> stageId | 'noise'
    wrongByCard: {},
    wrong: 0,
    pivots: [], // distinct indicators the player pivoted on
    unlocked: [], // stage ids completed, in order
  };
}

export function allPlaced(c, st) {
  return c.cards.every((card) => st.placed[card.id] !== undefined);
}

export function stageCards(c, stageId) {
  return c.cards.filter((card) => card.stage === stageId);
}

export function stageComplete(c, st, stageId) {
  return stageCards(c, stageId).every((card) => st.placed[card.id] === stageId);
}

// stageId may be a stage id or 'noise'. Returns { ok, correct, note, unlocked }.
export function assign(c, st, cardId, stageId) {
  const card = c.cards.find((x) => x.id === cardId);
  if (!card || st.placed[cardId] !== undefined) return { ok: false };
  const truth = card.stage || 'noise';
  if (stageId !== truth) {
    st.wrong += 1;
    st.wrongByCard[cardId] = (st.wrongByCard[cardId] || 0) + 1;
    return { ok: true, correct: false, hint: card.hint };
  }
  st.placed[cardId] = truth;
  const newly = [];
  if (truth !== 'noise' && !st.unlocked.includes(truth) && stageComplete(c, st, truth)) {
    st.unlocked.push(truth);
    newly.push(truth);
  }
  return { ok: true, correct: true, note: card.note, unlocked: newly, done: allPlaced(c, st) };
}

// Cards that share an indicator. Returns the card ids (and counts the pivot once).
export function pivot(c, st, indicator) {
  const ids = c.cards.filter((card) => card.indicators.includes(indicator)).map((card) => card.id);
  if (ids.length > 1 && !st.pivots.includes(indicator)) st.pivots.push(indicator);
  return ids;
}

export function isRight(c, qId, optionId) {
  const q = c.questions.find((x) => x.id === qId);
  return q.options.find((o) => o.id === optionId)?.correct === true;
}

// answers: { [questionId]: { option, conf } }
export function grade(c, st, answers = {}) {
  const breakdown = [];
  const add = (label, points) => breakdown.push({ label, points: Math.round(points) });
  add('Base', 100);
  const placed = Object.keys(st.placed).length;
  const noiseTotal = c.cards.filter((x) => !x.stage).length;
  const chainTotal = c.cards.length - noiseTotal;
  add(`Evidence placed correctly (${placed} of ${c.cards.length})`, placed * 6);
  if (st.wrong) add(`Wrong placements (${st.wrong})`, -st.wrong * WRONG_COST);
  const pv = Math.min(st.pivots.length, PIVOT_CAP);
  if (pv) add(`Pivots that connected evidence (${st.pivots.length})`, pv * PIVOT_BONUS);

  let right = 0;
  for (const q of c.questions) {
    const a = answers[q.id];
    if (!a) continue;
    const ok = isRight(c, q.id, a.option);
    if (ok) right += 1;
    add(`${q.short}: ${ok ? 'correct' : 'missed'}`, ok ? 20 : 0);
    if (a.conf === 'certain') add(`${q.short}: ${ok ? 'confident and right' : 'certain, but wrong'}`, ok ? 5 : -10);
  }
  const points = breakdown.reduce((n, b) => n + b.points, 0);
  const rating = [...c.ratings].reverse().find((r) => points >= r.min) || c.ratings[0];
  return { points, rating, breakdown, right, chainTotal, noiseTotal };
}
