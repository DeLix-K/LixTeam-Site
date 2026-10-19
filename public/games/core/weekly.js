// Weekly cases: one new case, released every Monday, open to everyone whatever path they are on.
//
// The schedule below is the only thing that needs to change to add a case. The case itself is ordinary
// content in its mode (detective, breach, incident or simulation). Until its release date it is hidden
// from that mode's list of cases, so the weekly case really is new on the day.
//
// Results are kept in this browser only. A weekly case earns a small one-off bonus the first time it
// is passed, and counts towards the day streak like any other case.

import * as profile from './profile.js';

const KEY = 'lixteam.weekly.v1';

// release: the Monday (local date) the case appears. Add new rows at the bottom, one a week.
export const WEEKLY = [
  { id: 'wk01', release: '2026-10-19', mode: 'cyber-detective', ref: 'qr-meter', title: 'The code on the parking meter', blurb: 'Drivers in the car park say the pay-by-phone page looks wrong. Find out where the sticker on the meter really sends them.', minutes: 12 },
  { id: 'wk02', release: '2026-10-26', mode: 'incident-commander', ref: 'usb-in-car-park', title: 'The USB stick in the car park', blurb: 'A receptionist plugged in a stick she found by the bins. Decide what to do in the first hour.', minutes: 10 },
  { id: 'wk03', release: '2026-11-02', mode: 'simulation', ref: 'voice-clone', title: 'The voice on the phone', blurb: 'The finance director rings, sounding stressed, and asks for an urgent payment. Decide how to check before you act.', minutes: 18 },
  { id: 'wk04', release: '2026-11-09', mode: 'breach-room', ref: 'sim-swap', title: 'The text that took the phone number', blurb: 'A manager\'s phone lost signal at lunch, and by the evening her accounts were in someone else\'s hands. Rebuild how.', minutes: 12 },
  { id: 'wk05', release: '2026-11-16', mode: 'cyber-detective', ref: 'cafe-wifi', title: 'The café Wi-Fi', blurb: 'A traveller\'s laptop connected to two networks with the same name. Work out which one was the attacker\'s.', minutes: 12 },
  { id: 'wk06', release: '2026-11-23', mode: 'incident-commander', ref: 'mailbox-rule', title: 'The rule nobody set', blurb: 'The chief executive\'s assistant says some emails never arrive. Find what is quietly changing the mailbox.', minutes: 10 },
];

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNumber = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
};

export const isReleased = (entry, now = new Date()) => entry.release <= ymd(now);
export const released = (now = new Date()) => WEEKLY.filter((e) => isReleased(e, now));
export const upcoming = (now = new Date()) => WEEKLY.filter((e) => !isReleased(e, now));
export const byId = (id) => WEEKLY.find((e) => e.id === id) || null;

// The newest released case, or null before the first release.
export function current(now = new Date()) {
  const list = released(now).sort((a, b) => (a.release < b.release ? 1 : -1));
  return list[0] || null;
}

// The next case that is not out yet, and how many days until it is.
export function next(now = new Date()) {
  const list = upcoming(now).sort((a, b) => (a.release < b.release ? -1 : 1));
  if (!list.length) return null;
  return { entry: list[0], days: Math.max(0, dayNumber(list[0].release) - dayNumber(ymd(now))) };
}

// A mode's list of cases hides any weekly case that has not been released yet.
export function visible(mode, ref, now = new Date()) {
  const e = WEEKLY.find((x) => x.mode === mode && x.ref === ref);
  return !e || isReleased(e, now);
}

// ── Results ─────────────────────────────────────────────────────
let memory = null;
function load() {
  if (memory) return memory;
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    data = null;
  }
  const done = {};
  if (data && data.done && typeof data.done === 'object') {
    for (const [id, r] of Object.entries(data.done)) {
      if (byId(id) && r && Number.isFinite(r.tier)) done[id] = { tier: Math.max(0, Math.min(3, Math.round(r.tier))), points: Math.max(0, Math.round(r.points || 0)), at: String(r.at || '').slice(0, 40), attempts: Math.max(1, Math.round(r.attempts || 1)), bonus: !!r.bonus };
    }
  }
  memory = { done };
  return memory;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* results just are not remembered */
  }
}
export function forgetMemory() {
  memory = null;
}
export function reset() {
  memory = { done: {} };
  save();
}
export const resultOf = (id) => load().done[id] || null;
export const doneCount = () => Object.values(load().done).filter((r) => r.tier > 0).length;

export const BONUS = { 1: 15, 2: 25, 3: 40 };

// Record a finished weekly case. The one-off bonus is paid the first time it is passed (bronze or better).
export function record(id, { tier, points }, now = new Date()) {
  const e = byId(id);
  if (!e) return null;
  const s = load();
  const t = Math.max(0, Math.min(3, Math.round(tier || 0)));
  const prev = s.done[id];
  const first = !prev || !prev.bonus;
  const passed = t > 0;
  const bonus = passed && first ? BONUS[t] : 0;
  const improved = !prev || t > prev.tier;
  s.done[id] = {
    tier: Math.max(t, prev ? prev.tier : 0),
    points: Math.max(Math.round(points || 0), prev ? prev.points : 0),
    at: now.toISOString(),
    attempts: (prev ? prev.attempts : 0) + 1,
    bonus: (prev && prev.bonus) || bonus > 0,
  };
  save();
  if (bonus > 0) profile.addXp(bonus);
  return { entry: e, tier: t, best: s.done[id].tier, bonus, improved, passed };
}
