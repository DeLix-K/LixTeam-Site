// The Incident Simulation: a whole incident in stages (triage, investigate,
// decide, communicate, report). Pure rules, no screen code, so every stage and
// every branch can be tested.
//
// Branching: a decision option can `set` flags. Any later item (an alert, an
// evidence line, a report statement) may carry `when: 'flag'` (or
// `when: { flag, value }`) and only appears if that flag is set. Poor early
// choices therefore change what you face and what an honest report must say.
//
// Scoring: each stage has a maximum. The total as a share of the maximum
// gives a tier (0..3). Being careful matters: a wrong triage call, a flagged
// red herring, or an unsupported statement in the report all cost points.

export const TIER_CUTS = [0.55, 0.75, 0.9]; // share of full marks for tiers 1, 2, 3
export const TRIAGE_ACTIONS = [
  { id: 'noise', label: 'Routine: log and close' },
  { id: 'investigate', label: 'Investigate' },
  { id: 'escalate', label: 'Escalate now' },
];
export const EVIDENCE = { strong: 12, weak: 4, falseFlag: 6 };
export const DECISION_POINTS = [0, 8, 16, 24];
export const REPORT = { statement: 8, action: 10 };
export const PRIORITY = { exact: 10, adjacent: 5 }; // points per incident ranked
export const REVIEW = { flaw: 8 }; // points per flaw found; the same is lost for flagging a sound claim
export const ALLOCATE = { exact: 10, near: 4 }; // points per item given exactly / within one unit of the sensible amount

export function newSim() {
  return { stage: 0, flags: {}, results: [], done: false };
}

// Does an item show up, given the flags set so far?
export function shows(item, flags) {
  if (!item.when) return true;
  if (typeof item.when === 'string') return !!flags[item.when];
  return flags[item.when.flag] === (item.when.value === undefined ? true : item.when.value);
}
export const visible = (items, flags) => items.filter((i) => shows(i, flags));

// Story notes a stage shows when it opens, depending on earlier choices.
export const notes = (stage, flags) => visible(stage.notes || [], flags).map((n) => n.text);

// ── Triage ──────────────────────────────────────────────────────
export function scoreTriage(stage, flags, answers) {
  const alerts = visible(stage.alerts, flags);
  let score = 0;
  const detail = alerts.map((a) => {
    const right = answers[a.id] === a.answer;
    if (right) score += 10;
    return { id: a.id, right, chosen: answers[a.id], answer: a.answer, explain: a.explain };
  });
  return { score, max: alerts.length * 10, detail };
}

// ── Evidence ────────────────────────────────────────────────────
export function allLines(stage, flags) {
  return stage.artefacts.flatMap((a) => visible(a.lines, flags));
}
export function evidenceMax(stage, flags) {
  return allLines(stage, flags)
    .filter((l) => l.type === 'clue')
    .reduce((n, l) => n + (stage.clues[l.clue].strength === 'strong' ? EVIDENCE.strong : EVIDENCE.weak), 0);
}
// flagged: array of line ids the player flagged
export function scoreEvidence(stage, flags, flagged) {
  const lines = allLines(stage, flags);
  let gained = 0;
  let wrong = 0;
  const found = [];
  const missed = [];
  for (const l of lines) {
    const picked = flagged.includes(l.id);
    if (l.type === 'clue') {
      if (picked) {
        gained += stage.clues[l.clue].strength === 'strong' ? EVIDENCE.strong : EVIDENCE.weak;
        found.push(l);
      } else missed.push(l);
    } else if (picked) wrong += 1;
  }
  return { score: Math.max(0, gained - wrong * EVIDENCE.falseFlag), max: evidenceMax(stage, flags), found, missed, wrong };
}

// ── Decision ────────────────────────────────────────────────────
export function scoreDecision(stage, flags, optionId) {
  const opt = visible(stage.options, flags).find((o) => o.id === optionId);
  if (!opt) return null;
  return { score: DECISION_POINTS[opt.quality], max: DECISION_POINTS[3], option: opt, set: opt.set || {} };
}

// ── Report ──────────────────────────────────────────────────────
export function reportMax(stage, flags) {
  return visible(stage.statements, flags).filter((s) => s.correct).length * REPORT.statement + visible(stage.actions, flags).filter((a) => a.correct).length * REPORT.action;
}
export function scoreReport(stage, flags, statementIds, actionIds) {
  const ss = visible(stage.statements, flags);
  const aa = visible(stage.actions, flags);
  let score = 0;
  const statements = ss.map((s) => {
    const picked = statementIds.includes(s.id);
    if (picked) score += s.correct ? REPORT.statement : -REPORT.statement;
    return { ...s, picked };
  });
  const actions = aa.map((a) => {
    const picked = actionIds.includes(a.id);
    if (picked) score += a.correct ? REPORT.action : -REPORT.action;
    return { ...a, picked };
  });
  return { score: Math.max(0, score), max: reportMax(stage, flags), statements, actions };
}

// The incident report text the player has just written.
export function reportText(sim, stage, result) {
  const lines = [`INCIDENT REPORT: ${sim.title}`, '', 'Findings:'];
  const s = result.statements.filter((x) => x.picked);
  lines.push(...(s.length ? s.map((x) => `- ${x.text}`) : ['- (none recorded)']));
  lines.push('', 'Recommendations:');
  const a = result.actions.filter((x) => x.picked);
  lines.push(...(a.length ? a.map((x) => `- ${x.text}`) : ['- (none recorded)']));
  lines.push('', 'Written in a training simulation. Not a real incident.');
  return lines.join('\n');
}

// ── Prioritise ──────────────────────────────────────────────────
// order: array of item ids, most urgent first. Being one place out earns half.
export function scorePrioritise(stage, flags, order) {
  const items = visible(stage.items, flags);
  let score = 0;
  const detail = items.map((it) => {
    const chosen = order.indexOf(it.id) + 1;
    const diff = Math.abs(chosen - it.priority);
    const pts = chosen === 0 ? 0 : diff === 0 ? PRIORITY.exact : diff === 1 ? PRIORITY.adjacent : 0;
    score += pts;
    return { id: it.id, chosen, priority: it.priority, points: pts, why: it.why };
  });
  return { score, max: items.length * PRIORITY.exact, detail };
}

// ── Review a junior's draft ─────────────────────────────────────
// flaggedIds: the claims the player says are flawed or unsupported.
export function scoreReview(stage, flags, flaggedIds) {
  const items = visible(stage.statements, flags);
  let score = 0;
  const detail = items.map((it) => {
    const flagged = flaggedIds.includes(it.id);
    const flawed = !it.sound;
    if (flagged) score += flawed ? REVIEW.flaw : -REVIEW.flaw;
    return { ...it, flagged, flawed };
  });
  return { score: Math.max(0, score), max: items.filter((x) => !x.sound).length * REVIEW.flaw, detail };
}

// ── Allocate ────────────────────────────────────────────────────
// alloc: { itemId: units }. The player must spend the whole budget. Each item has an `ideal`
// number of units (the ideals add up to the budget); being exactly right earns full marks and
// being one unit out earns half. There is more than one defensible split, but not many.
export function allocateTotal(alloc) {
  return Object.values(alloc).reduce((n, v) => n + (Number.isFinite(v) ? v : 0), 0);
}
export function scoreAllocate(stage, flags, alloc) {
  const items = visible(stage.items, flags);
  let score = 0;
  const detail = items.map((it) => {
    const chosen = Math.max(0, Math.round(Number(alloc[it.id]) || 0));
    const diff = Math.abs(chosen - it.ideal);
    const pts = diff === 0 ? ALLOCATE.exact : diff === 1 ? ALLOCATE.near : 0;
    score += pts;
    return { id: it.id, chosen, ideal: it.ideal, points: pts, why: it.why };
  });
  return { score, max: items.length * ALLOCATE.exact, detail };
}

// ── Stage bookkeeping and totals ────────────────────────────────
// Records a stage's result, applies any flags it set, and advances.
export function completeStage(sim, st, result) {
  st.results.push({ stageId: sim.stages[st.stage].id, score: result.score, max: result.max });
  if (result.set) Object.assign(st.flags, result.set);
  st.stage += 1;
  if (st.stage >= sim.stages.length) st.done = true;
}

export function totals(st) {
  const points = st.results.reduce((n, r) => n + r.score, 0);
  const max = st.results.reduce((n, r) => n + r.max, 0);
  const perf = max ? points / max : 0;
  const tier = perf >= TIER_CUTS[2] ? 3 : perf >= TIER_CUTS[1] ? 2 : perf >= TIER_CUTS[0] ? 1 : 0;
  return { points, max, perf, tier };
}

// The best score possible given the choices made (for the "what was available" line).
export function stageMax(stage, flags) {
  switch (stage.type) {
    case 'triage': return visible(stage.alerts, flags).length * 10;
    case 'evidence': return evidenceMax(stage, flags);
    case 'decision': return DECISION_POINTS[3];
    case 'report': return reportMax(stage, flags);
    case 'prioritise': return visible(stage.items, flags).length * PRIORITY.exact;
    case 'review': return visible(stage.statements, flags).filter((x) => !x.sound).length * REVIEW.flaw;
    case 'allocate': return visible(stage.items, flags).length * ALLOCATE.exact;
    default: return 0;
  }
}
