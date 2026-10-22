// Achievements for Level Up in Cyber Security. Every one is worked out from the player's saved career, so it can
// never drift from what they actually did. Pure functions: the screens pass in the career state and the day-streak
// record, and the only thing stored is which achievements the player has already been shown.

import { MISSIONS, PATHS, TIERS } from './missions.js';
import * as career from './career.js';

const passedMissions = (s) => MISSIONS.filter((m) => !m.exam && career.isPassed(s, m.id));
const passedExams = (s) => MISSIONS.filter((m) => m.exam && career.isPassed(s, m.id));
const livePaths = (s) => PATHS.filter((p) => career.pathSummary(s, p.id).live);

// A tier is "swept" when it has at least three missions and every one is at gold.
const sweptTiers = (s) =>
  TIERS.filter((t) => {
    const list = MISSIONS.filter((m) => m.tier === t.id && !m.exam);
    return list.length >= 3 && list.every((m) => career.bestTier(s, m.id) === 3);
  });

export const ACHIEVEMENTS = [
  { id: 'first-step', name: 'First step', hint: 'Pass your first mission.', icon: 'step', test: (s) => passedMissions(s).length >= 1 },
  { id: 'gold-standard', name: 'Gold standard', hint: 'Earn a gold medal.', icon: 'medal', test: (s) => MISSIONS.some((m) => career.bestTier(s, m.id) === 3) },
  { id: 'on-a-roll', name: 'On a roll', hint: 'Pass five missions.', icon: 'flame', test: (s) => passedMissions(s).length >= 5 },
  { id: 'explorer', name: 'Explorer', hint: 'Start three different career paths.', icon: 'compass', test: (s) => livePaths(s).filter((p) => career.pathSummary(s, p.id).started).length >= 3 },
  { id: 'well-rounded', name: 'Well rounded', hint: 'Pass missions in five different game modes.', icon: 'grid', test: (s) => new Set(passedMissions(s).map((m) => m.mode)).size >= 5 },
  { id: 'on-the-floor', name: 'On the floor', hint: 'Pass a Hands-on Workspace mission.', icon: 'screen', test: (s) => passedMissions(s).some((m) => m.mode === 'workspace') },
  { id: 'floor-regular', name: 'Operations regular', hint: 'Pass three Hands-on Workspace missions.', icon: 'screen', test: (s) => passedMissions(s).filter((m) => m.mode === 'workspace').length >= 3 },
  { id: 'promoted', name: 'Promoted', hint: 'Earn a rank above Recruit on any path.', icon: 'chevrons', test: (s) => livePaths(s).some((p) => career.rankOf(s, p.id).index >= 1) },
  { id: 'climbing', name: 'Climbing', hint: 'Reach the third rank on any path.', icon: 'chevrons', test: (s) => livePaths(s).some((p) => career.rankOf(s, p.id).index >= 2) },
  { id: 'exam-passed', name: 'Exam passed', hint: 'Pass a promotion exam.', icon: 'seal', test: (s) => passedExams(s).length >= 1 },
  { id: 'clean-sweep', name: 'Clean sweep', hint: 'Take every mission in a stage to gold.', icon: 'star', test: (s) => sweptTiers(s).length >= 1 },
  { id: 'top-of-ladder', name: 'Top of the ladder', hint: 'Reach the top rank on any path.', icon: 'crown', test: (s) => livePaths(s).some((p) => career.rankOf(s, p.id).isTop && career.pathSummary(s, p.id).started) },
  { id: 'streak-3', name: 'Three in a row', hint: 'Play on three days in a row.', icon: 'flame', test: (s, ctx) => (ctx.streakBest || 0) >= 3 },
  { id: 'streak-7', name: 'A full week', hint: 'Play on seven days in a row.', icon: 'flame', test: (s, ctx) => (ctx.streakBest || 0) >= 7 },
];

export function earned(s, ctx = {}) {
  return ACHIEVEMENTS.filter((a) => a.test(s, ctx)).map((a) => a.id);
}

// ── What the player has already been shown ──────────────────────
const KEY = 'lixteam.rootline.ach.v1';
export function seen() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : null;
  } catch {
    return null;
  }
}
export function markSeen(ids) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* optional */
  }
}
// New since last time. On the very first look nothing is "new": the player is shown what they already hold, not a flood of toasts.
export function fresh(nowEarned, before = seen()) {
  if (before === null) return [];
  const had = new Set(before);
  return nowEarned.filter((id) => !had.has(id));
}
export const byId = (id) => ACHIEVEMENTS.find((a) => a.id === id) || null;
