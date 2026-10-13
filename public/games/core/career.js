// Career progression for the SOC Analyst Career Campaign.
//
// Two separate systems:
//   RANK     the promotion. XP is necessary but never sufficient: a rank also
//            needs missions passed, mastery scores, and (for most) an exam.
//   MASTERY  a score per competency, from the best result on each mission that
//            exercises it. Missions you have not attempted count as zero, so
//            the score reflects breadth as well as skill.
// XP rewards activity; it cannot be ground out of easy missions, because a
// replay only earns XP when it improves the medal.
//
// Everything lives in this browser's localStorage. There is no account and no
// server. A progress code lets a player move between devices by hand.
// Ranks and scores are game progression, not qualifications.

import { MISSIONS, RANKS, COMPETENCIES, TIERS, MEDAL_XP, MEDALS, TRY_XP, EXAM_XP, missionById } from './missions.js';

const KEY = 'lixteam.career.v1';
const MAX_ATTEMPTS = 300;

export function blank() {
  return { v: 1, xp: 0, missions: {}, attempts: [] };
}

// ── Storage ─────────────────────────────────────────────────────
let memory = null;

export function load() {
  if (memory) return memory;
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    data = null;
  }
  memory = sanitize(data) || blank();
  return memory;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* progress just is not remembered */
  }
}

export function reset() {
  memory = blank();
  save();
  return memory;
}

// Only keep what we understand: known missions, numbers in range.
function sanitize(d) {
  if (!d || typeof d !== 'object' || d.v !== 1) return null;
  const out = blank();
  out.xp = Number.isFinite(d.xp) ? Math.max(0, Math.min(1e6, Math.round(d.xp))) : 0;
  for (const m of MISSIONS) {
    const r = d.missions && d.missions[m.id];
    if (!r || typeof r !== 'object') continue;
    out.missions[m.id] = {
      attempts: Math.max(0, Math.min(1e4, Math.round(Number(r.attempts) || 0))),
      bestTier: Math.max(0, Math.min(3, Math.round(Number(r.bestTier) || 0))),
      bestPerf: Math.max(0, Math.min(1, Number(r.bestPerf) || 0)),
      bestPoints: Math.max(0, Math.min(1e5, Math.round(Number(r.bestPoints) || 0))),
      tried: !!r.tried,
    };
  }
  if (Array.isArray(d.attempts)) {
    out.attempts = d.attempts
      .filter((a) => a && missionById(a.id))
      .slice(-MAX_ATTEMPTS)
      .map((a) => ({
        id: a.id,
        at: typeof a.at === 'string' ? a.at.slice(0, 40) : '',
        points: Math.round(Number(a.points) || 0),
        tier: Math.max(0, Math.min(3, Math.round(Number(a.tier) || 0))),
        perf: Math.max(0, Math.min(1, Number(a.perf) || 0)),
        summary: Array.isArray(a.summary) ? a.summary.slice(0, 8).map((s) => String(s).slice(0, 300)) : [],
      }));
  }
  return out;
}

// A progress code a player can copy to another device. Nothing is sent anywhere.
export function exportCode(s = load()) {
  const json = JSON.stringify(s);
  return 'LQ1:' + btoa(unescape(encodeURIComponent(json)));
}
export function importCode(code) {
  try {
    if (typeof code !== 'string' || !code.trim().startsWith('LQ1:')) return { ok: false, error: 'That does not look like a progress code.' };
    const json = decodeURIComponent(escape(atob(code.trim().slice(4))));
    const clean = sanitize(JSON.parse(json));
    if (!clean) return { ok: false, error: 'That progress code is not valid.' };
    memory = clean;
    save();
    return { ok: true };
  } catch {
    return { ok: false, error: 'That progress code could not be read.' };
  }
}

// ── Derived facts about a state ─────────────────────────────────
export const bestTier = (s, id) => (s.missions[id] ? s.missions[id].bestTier : 0);

export function isPassed(s, id) {
  const m = missionById(id);
  if (!m) return false;
  return bestTier(s, id) >= (m.exam ? m.passTier : 1);
}

export function passedCount(s, tierId) {
  return MISSIONS.filter((m) => m.tier === tierId && !m.exam && isPassed(s, m.id)).length;
}

export function tierTotal(tierId) {
  return MISSIONS.filter((m) => m.tier === tierId && !m.exam).length;
}

// 0..100. Unattempted missions count as zero, so breadth matters.
export function mastery(s, compId) {
  let have = 0;
  let total = 0;
  let attempted = 0;
  let count = 0;
  for (const m of MISSIONS) {
    const w = m.competencies[compId];
    if (!w) continue;
    total += w;
    count += 1;
    const r = s.missions[m.id];
    if (r && r.attempts > 0) {
      have += w * r.bestPerf;
      attempted += 1;
    }
  }
  return { score: total ? Math.round((have / total) * 100) : 0, attempted, count };
}

// ── Requirements (used by missions and ranks) ───────────────────
function checklist(req, s) {
  const items = [];
  if (req.xp) items.push({ key: 'xp', label: `Earn ${req.xp} XP`, detail: `${Math.min(s.xp, req.xp)} / ${req.xp}`, done: s.xp >= req.xp, progress: Math.min(1, s.xp / req.xp) });
  for (const [tierId, n] of Object.entries(req.passedTier || {})) {
    const have = passedCount(s, tierId);
    const tier = TIERS.find((t) => t.id === tierId);
    items.push({ key: `tier-${tierId}`, label: `Pass ${n} ${tier ? tier.name.toLowerCase() : tierId} mission${n === 1 ? '' : 's'}`, detail: `${Math.min(have, n)} / ${n}`, done: have >= n, progress: Math.min(1, have / n) });
  }
  for (const [compId, min] of Object.entries(req.mastery || {})) {
    const comp = COMPETENCIES.find((c) => c.id === compId);
    const sc = mastery(s, compId).score;
    items.push({ key: `mastery-${compId}`, label: `${comp ? comp.name : compId} mastery ${min}+`, detail: `${sc} / ${min}`, done: sc >= min, progress: Math.min(1, sc / min) });
  }
  if (req.exam) {
    const exam = missionById(req.exam);
    items.push({
      key: 'exam', exam: req.exam, available: !!exam,
      label: exam ? `Pass the promotion exam` : 'Pass the promotion exam (arrives in a future update)',
      detail: exam ? (isPassed(s, req.exam) ? 'Passed' : 'Not yet') : 'Not available yet',
      done: !!exam && isPassed(s, req.exam), progress: exam && isPassed(s, req.exam) ? 1 : 0,
    });
  }
  return items;
}
export const meets = (req, s) => checklist(req || {}, s).every((i) => i.done);

// ── Missions ────────────────────────────────────────────────────
export function missionStatus(s, id) {
  const m = missionById(id);
  const items = checklist(m.unlock || {}, s);
  const r = s.missions[id];
  return {
    mission: m,
    unlocked: items.every((i) => i.done),
    missing: items.filter((i) => !i.done),
    medal: bestTier(s, id),
    passed: isPassed(s, id),
    attempts: r ? r.attempts : 0,
    bestPerf: r ? r.bestPerf : 0,
    bestPoints: r ? r.bestPoints : 0,
  };
}
export const unlockedIds = (s) => MISSIONS.filter((m) => missionStatus(s, m.id).unlocked).map((m) => m.id);

// ── Ranks ───────────────────────────────────────────────────────
export function rankOf(s) {
  let index = 0;
  for (let i = 1; i < RANKS.length; i++) {
    if (meets(RANKS[i].requires, s)) index = i;
    else break;
  }
  const next = RANKS[index + 1] || null;
  return { rank: RANKS[index], index, next, checklist: next ? checklist(next.requires, s) : [], isTop: !next };
}

// ── Recording a result ──────────────────────────────────────────
const xpFor = (m, tier) => (m.exam ? EXAM_XP[tier] : Math.round(MEDAL_XP[tier] * (TIERS.find((t) => t.id === m.tier)?.xpMultiplier || 1)));

// input: { missionId, points, tier (0..3), perf? (0..1), summary?: string[], now? }
export function recordAttempt(s, input) {
  const m = missionById(input.missionId);
  if (!m) return null;
  const tier = Math.max(0, Math.min(3, Math.round(input.tier)));
  const points = Math.max(0, Math.round(input.points || 0));
  const perf = Math.max(0, Math.min(1, input.perf !== undefined ? input.perf : m.par ? points / m.par : 0));

  const beforeRank = rankOf(s).index;
  const beforeUnlocked = new Set(unlockedIds(s));
  const wasPassed = isPassed(s, m.id);

  const r = (s.missions[m.id] ||= { attempts: 0, bestTier: 0, bestPerf: 0, bestPoints: 0, tried: false });
  const prevTier = r.bestTier;
  const firstAttempt = r.attempts === 0;
  r.attempts += 1;
  r.bestTier = Math.max(r.bestTier, tier);
  r.bestPerf = Math.max(r.bestPerf, perf);
  r.bestPoints = Math.max(r.bestPoints, points);

  // XP only for improving the medal, plus a small one-off for trying.
  let xpGained = Math.max(0, xpFor(m, r.bestTier) - xpFor(m, prevTier));
  if (firstAttempt && tier === 0 && !r.tried) {
    xpGained += TRY_XP;
    r.tried = true;
  }
  s.xp += xpGained;

  s.attempts.push({ id: m.id, at: input.now || new Date().toISOString(), points, tier, perf, summary: (input.summary || []).slice(0, 8) });
  if (s.attempts.length > MAX_ATTEMPTS) s.attempts.splice(0, s.attempts.length - MAX_ATTEMPTS);

  const after = rankOf(s);
  const nowUnlocked = unlockedIds(s).filter((id) => !beforeUnlocked.has(id));
  return {
    mission: m,
    tier,
    medal: MEDALS[tier],
    bestMedal: MEDALS[r.bestTier],
    improved: r.bestTier > prevTier,
    passed: isPassed(s, m.id),
    newlyPassed: !wasPassed && isPassed(s, m.id),
    xpGained,
    xp: s.xp,
    perf,
    promoted: after.index > beforeRank ? after.rank : null,
    newlyUnlocked: nowUnlocked.map((id) => missionById(id)),
  };
}

// ── What to do next ─────────────────────────────────────────────
// Prefer the promotion exam when it is open; otherwise the unlocked mission
// that best exercises the player's weakest competency.
export function recommend(s) {
  const exam = MISSIONS.find((m) => m.exam && !isPassed(s, m.id) && missionStatus(s, m.id).unlocked);
  if (exam) return { mission: exam, reason: 'You meet the requirements for a promotion exam. Ready when you are.' };

  const open = MISSIONS.filter((m) => !m.exam && missionStatus(s, m.id).unlocked && bestTier(s, m.id) < 3);
  if (!open.length) return null;
  const comps = COMPETENCIES.map((c) => ({ c, ...mastery(s, c.id) }))
    .filter((x) => open.some((m) => m.competencies[x.c.id]))
    .sort((a, b) => a.score - b.score);
  for (const x of comps) {
    const pick = open
      .filter((m) => m.competencies[x.c.id])
      .sort((a, b) => (s.missions[a.id]?.attempts ? 1 : 0) - (s.missions[b.id]?.attempts ? 1 : 0) || b.competencies[x.c.id] - a.competencies[x.c.id])[0];
    if (pick) {
      const tried = s.missions[pick.id]?.attempts > 0;
      return { mission: pick, reason: `${x.c.name} is your weakest area (${x.score}/100). ${tried ? 'Replay this one to improve your medal.' : 'This mission will build it.'}` };
    }
  }
  return null;
}

// ── Case history and portfolio ──────────────────────────────────
export const historyFor = (s, id) => s.attempts.filter((a) => a.id === id);

export function compare(s, id) {
  const h = historyFor(s, id);
  if (h.length < 2) return null;
  return { first: h[0], latest: h[h.length - 1], count: h.length };
}

export function portfolio(s) {
  return MISSIONS.filter((m) => s.missions[m.id] && s.missions[m.id].attempts > 0).map((m) => {
    const r = s.missions[m.id];
    const best = historyFor(s, m.id).sort((a, b) => b.perf - a.perf || b.points - a.points)[0];
    return { mission: m, medal: MEDALS[r.bestTier], tier: r.bestTier, attempts: r.attempts, bestPoints: r.bestPoints, bestPerf: r.bestPerf, summary: best ? best.summary : [], at: best ? best.at : '' };
  });
}

export function reportText(s, id) {
  const m = missionById(id);
  const p = portfolio(s).find((x) => x.mission.id === id);
  if (!p) return '';
  const comps = Object.entries(m.competencies)
    .sort((a, b) => b[1] - a[1])
    .map(([cid]) => COMPETENCIES.find((c) => c.id === cid)?.name)
    .filter(Boolean);
  const lines = [
    `CASE REPORT: ${m.title}`,
    `Difficulty: ${TIERS.find((t) => t.id === m.tier)?.name}${m.exam ? ' (promotion exam)' : ''}`,
    `Result: ${p.medal}, ${Math.round(p.bestPerf * 100)}% of full marks (best of ${p.attempts} attempt${p.attempts === 1 ? '' : 's'})`,
    `Skills exercised: ${comps.join(', ')}`,
    '',
    'What I demonstrated:',
    ...(p.summary.length ? p.summary.map((x) => `- ${x}`) : ['- Completed the case.']),
    '',
    'This is a training-game result. Ranks and scores are not qualifications or validated assessments.',
  ];
  return lines.join('\n');
}
