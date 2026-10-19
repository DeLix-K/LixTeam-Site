// The player's progress, shared by every game mode. It lives only in this
// browser's localStorage: no account, no server, nothing sent anywhere.
// If storage is blocked (private mode), everything still works for the
// session; progress just is not remembered.

import * as streak from './streak.js';

// The key keeps its original name (from before the game was called RootLine) so nobody loses saved progress.
const KEY = 'lixteam.cyberRange.v1';

// Cases written for the career paths use finer skill names than the practice categories above.
const EXTRA_LABELS = { hardening: 'Career case', correlation: 'Evidence correlation', devices: 'Everyday digital safety' };
export const SKILLS = [
  { id: 'email', name: 'Email & message security', blurb: 'Phishing, fake invoices, QR scams' },
  { id: 'identity', name: 'Identity & account security', blurb: 'MFA, sign-ins, account recovery' },
  { id: 'data', name: 'Data protection & privacy', blurb: 'Misdirected data, oversharing' },
  { id: 'everyday', name: 'Everyday digital safety', blurb: 'Public Wi-Fi, lost devices, updates' },
  { id: 'ai', name: 'AI-powered scams', blurb: 'Voice cloning, deepfakes, impersonation' },
  { id: 'iot', name: 'Connected devices', blurb: 'Default passwords, cameras, networks' },
];

export const CONFIDENCE = [
  { id: 'guess', label: 'Guess', bonus: 0, xp: 0 },
  { id: 'fairly', label: 'Fairly sure', bonus: 10, xp: 2 },
  { id: 'certain', label: 'Certain', bonus: 25, xp: 5 },
];

// Days until a missed idea is asked again: 1, 3, 7, 14, 30. Getting it right
// with confidence moves it one step along; getting it wrong sends it back.
const INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY = 24 * 60 * 60 * 1000;

function blank() {
  return {
    v: 1,
    xp: 0,
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, { seen: 0, correct: 0 }])),
    items: {}, // id -> { box, due, skill }   only ideas that needed revisiting
    calibration: { certainRight: 0, certainWrong: 0, unsureRight: 0, unsureWrong: 0 },
    daily: { last: '', streak: 0, total: 0 },
    played: 0,
  };
}

let memory = null;

export function load() {
  if (memory) return memory;
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    data = null;
  }
  // Merge over a blank profile so older saves never miss a field.
  const b = blank();
  memory = data && data.v === 1 ? { ...b, ...data, skills: { ...b.skills, ...data.skills }, calibration: { ...b.calibration, ...data.calibration }, daily: { ...b.daily, ...data.daily } } : b;
  return memory;
}

function save() {
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

// Level n starts at 50 * (n-1)^2 XP: 0, 50, 200, 450, 800, ...
export function levelInfo(xp) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const from = 50 * (level - 1) ** 2;
  const to = 50 * level ** 2;
  return { level, from, to, progress: (xp - from) / (to - from) };
}

// The name shown on a case card for a skill id: a practice category, or a friendly label for career cases.
export function skillLabel(id) {
  const s = SKILLS.find((x) => x.id === id);
  return s ? s.name : EXTRA_LABELS[id] || 'Career case';
}

export function addXp(n) {
  streak.touch(); // any finished round keeps the day streak alive
  const p = load();
  const before = levelInfo(p.xp).level;
  p.xp += Math.max(0, Math.round(n));
  save();
  return { xp: p.xp, leveledUp: levelInfo(p.xp).level > before, level: levelInfo(p.xp).level };
}

// Record one judged answer. Returns whether the idea was queued for revision.
// `revise: false` records the answer (skill stats, confidence) without adding it to
// the spaced-revision queue, for modes whose questions the daily mission cannot replay.
export function recordAnswer({ id, skill, correct, confidence, now = Date.now(), revise = true }) {
  const p = load();
  const sk = (p.skills[skill] ||= { seen: 0, correct: 0 });
  sk.seen += 1;
  if (correct) sk.correct += 1;

  const sure = confidence === 'certain' || confidence === 'fairly';
  const c = p.calibration;
  if (sure) correct ? (c.certainRight += 1) : (c.certainWrong += 1);
  else correct ? (c.unsureRight += 1) : (c.unsureWrong += 1);

  const item = p.items[id];
  let queued = false;
  if (!revise) {
    save();
    return false;
  }
  if (!correct || confidence === 'guess') {
    // Wrong, or right by luck: ask again tomorrow.
    p.items[id] = { box: 0, due: now + INTERVALS_DAYS[0] * DAY, skill };
    queued = true;
  } else if (item) {
    const box = item.box + 1;
    if (box >= INTERVALS_DAYS.length) delete p.items[id]; // learned
    else p.items[id] = { box, due: now + INTERVALS_DAYS[box] * DAY, skill };
  }
  save();
  return queued;
}

export function dueItems(now = Date.now()) {
  const p = load();
  return Object.entries(p.items)
    .filter(([, v]) => v.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function pendingCount() {
  return Object.keys(load().items).length;
}

export function skillAccuracy(skillId) {
  const s = load().skills[skillId];
  return s && s.seen ? Math.round((s.correct / s.seen) * 100) : null;
}

export function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function dailyDone(now = new Date()) {
  return load().daily.last === todayKey(now);
}

// Call when a daily mission is finished. Streak counts consecutive days.
export function completeDaily(now = new Date()) {
  const p = load();
  const today = todayKey(now);
  if (p.daily.last === today) return { streak: p.daily.streak, total: p.daily.total || 0, first: false };
  const yesterday = todayKey(new Date(now.getTime() - DAY));
  p.daily.streak = p.daily.last === yesterday ? p.daily.streak + 1 : 1;
  p.daily.last = today;
  p.daily.total = (p.daily.total || 0) + 1; // a count that never goes down
  save();
  return { streak: p.daily.streak, total: p.daily.total, first: true };
}

export function noteRoundPlayed() {
  load().played += 1;
  save();
}
