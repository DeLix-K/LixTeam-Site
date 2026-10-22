// The Level Up mission map: what a path looks like as a journey. Pure functions over a career state, so the screen
// and the tests read the same facts. Nothing here is invented: every node is a real mission and its status comes from
// the career rules (what is passed, what is unlocked, what is still missing).

import { MISSIONS, TIERS, PATHS, COMPETENCIES } from './missions.js';
import * as career from './career.js';

const tierName = (id) => (TIERS.find((t) => t.id === id) || {}).name || id;
const compName = (id) => (COMPETENCIES.find((c) => c.id === id) || {}).name || id;

// status: 'done' (passed), 'ready' (open and not yet passed) or 'locked'. A node is the recommended next step at most once.
export function buildMap(s, pathId = career.pathOf(s)) {
  const path = PATHS.find((p) => p.id === pathId) || PATHS[0];
  const rec = career.recommend(s, { pathId: path.id });
  // The analyst ladder predates path-owned tiers: its tiers are the ones that name no path.
  const tierIds = path.tiers || TIERS.filter((t) => !t.path).map((t) => t.id);
  const stages = tierIds.map((tierId, i) => {
    const tier = TIERS.find((t) => t.id === tierId);
    const list = MISSIONS.filter((m) => m.tier === tierId).sort((a, b) => Number(!!a.exam) - Number(!!b.exam));
    const nodes = list.map((m) => {
      const st = career.missionStatus(s, m.id);
      return {
        id: m.id,
        title: m.title,
        mode: m.mode,
        kind: m.exam ? 'exam' : 'mission',
        minutes: m.minutes,
        status: st.passed ? 'done' : st.unlocked ? 'ready' : 'locked',
        medal: st.medal,
        attempts: st.attempts,
        missing: st.missing.map((x) => ({ label: x.label, detail: x.detail })),
        recommended: !!(rec && rec.mission.id === m.id),
      };
    });
    return {
      id: tierId,
      name: tier ? tier.name : tierId,
      index: i,
      multiplier: tier ? tier.xpMultiplier : 1,
      note: tier && tier.note ? tier.note : '',
      nodes,
      passed: nodes.filter((n) => n.status === 'done').length,
      total: nodes.length,
      open: nodes.some((n) => n.status !== 'locked'),
    };
  });
  return { path, stages, recommended: rec ? rec.mission.id : null, reason: rec ? rec.reason : '' };
}

// Everything the briefing panel shows about one mission.
export function briefing(s, missionId) {
  const m = MISSIONS.find((x) => x.id === missionId);
  if (!m) return null;
  const st = career.missionStatus(s, m.id);
  const trains = Object.entries(m.competencies)
    .map(([id, w]) => ({ id, name: compName(id), weight: w }))
    .sort((a, b) => b.weight - a.weight);
  return {
    mission: m,
    tier: tierName(m.tier),
    multiplier: (TIERS.find((t) => t.id === m.tier) || {}).xpMultiplier || 1,
    status: st.passed ? 'done' : st.unlocked ? 'ready' : 'locked',
    medal: st.medal,
    attempts: st.attempts,
    missing: st.missing,
    trains,
    xp: { bronze: career.xpReward(m, 1), silver: career.xpReward(m, 2), gold: career.xpReward(m, 3) },
    href: `/games/${m.mode}/?mission=${m.id}`,
  };
}

// What changed since the last time the player looked at the map: used for the unlock and level-up moments.
export function whatsNew(s, seen) {
  const ready = career.unlockedIds(s);
  const known = new Set((seen && seen.ready) || []);
  const fresh = seen ? ready.filter((id) => !known.has(id)) : [];
  return { fresh, ready };
}
