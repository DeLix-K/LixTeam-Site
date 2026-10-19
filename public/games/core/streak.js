// The day streak, shared by every path and every mode.
//
// A day counts when the player finishes any case: a career mission, a free-practice round or the daily
// mission. The streak is the run of consecutive days up to today (or up to yesterday, if today has not
// been played yet, so it is "at risk" rather than broken).
//
// Every seventh day in a row earns a shield (at most one is held). A missed day uses the shield instead of
// breaking the streak. The whole thing is worked out from the list of active days, so there is no other
// state to keep in step and nothing to get out of sync.
//
// Days are local calendar dates, as YYYY-MM-DD. Storage is this browser's localStorage only.

const KEY = 'lixteam.streak.v1';
const KEEP = 800; // days of history kept
export const SHIELD_EVERY = 7;

let memory = null;

export const dayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toDate = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // noon avoids daylight-saving edge cases
};
const addDays = (k, n) => {
  const d = toDate(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};
const isKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);

function clean(list) {
  const out = [...new Set((Array.isArray(list) ? list : []).filter(isKey))].sort();
  return out.slice(-KEEP);
}

export function load() {
  if (memory) return memory;
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    data = null;
  }
  memory = { days: clean(data && data.days), seeded: !!(data && data.seeded) };
  return memory;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* the streak just is not remembered */
  }
}

// Forget everything held in memory (used by tests, and after a reset).
export function reset() {
  memory = { days: [], seeded: true };
  save();
}
export function forgetMemory() {
  memory = null;
}

// Add past activity once, from an existing career: timestamps are ISO strings.
export function seedFrom(isoTimes) {
  const s = load();
  if (s.seeded) return;
  const days = (isoTimes || [])
    .map((t) => new Date(t))
    .filter((d) => !Number.isNaN(d.getTime()))
    .map((d) => dayKey(d));
  s.days = clean([...s.days, ...days]);
  s.seeded = true;
  save();
}

// Record that the player was active on this day. Returns what the streak is now.
export function touch(when = new Date()) {
  const s = load();
  const k = dayKey(when);
  const before = status(when);
  if (!s.days.includes(k)) {
    s.days = clean([...s.days, k]);
    save();
  }
  const after = status(when);
  return { ...after, firstToday: !before.today, extended: after.current > before.current };
}

// Work out the streak from a list of days, as at "now".
export function compute(days, now = new Date()) {
  const set = new Set(clean(days));
  const today = dayKey(now);
  if (!set.size) return { current: 0, best: 0, today: false, atRisk: false, shields: 0, shieldUsed: false, lastActive: null };

  const first = [...set].sort()[0];
  let streak = 0;
  let best = 0;
  let shields = 0;
  let shieldUsed = false;
  let k = first;
  while (k <= today) {
    if (set.has(k)) {
      streak += 1;
      if (streak % SHIELD_EVERY === 0 && shields < 1) shields += 1;
      best = Math.max(best, streak);
    } else if (k < today) {
      if (shields > 0) {
        shields -= 1; // a shield covers the missed day; the streak is kept
        shieldUsed = true;
      } else {
        streak = 0;
        shieldUsed = false;
      }
    }
    // (today not yet played: the streak is waiting, not broken)
    k = addDays(k, 1);
  }
  const playedToday = set.has(today);
  const lastActive = [...set].sort().pop();
  return { current: streak, best, today: playedToday, atRisk: streak > 0 && !playedToday, shields, shieldUsed, lastActive };
}

export function status(now = new Date()) {
  return compute(load().days, now);
}
