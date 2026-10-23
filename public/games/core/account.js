// The browser side of ROOTLINE accounts: one shared sign-in object, the profile, and keeping the leaderboard up to date
// with the player's career. Accounts are optional. With no account, or with accounts switched off in
// accounts-config.js, nothing in here sends anything anywhere.

import { ACCOUNTS } from './accounts-config.js';
import { createAuth, AuthError } from './auth.js';
import * as career from './career.js';
import { buildSubmission, fingerprint, boardTotals } from './sync.js';

const SYNC_KEY = 'lixteam.rootline.sync.v1';
const NICK_KEY = 'lixteam.rootline.nick.v1';

// localStorage / sessionStorage can throw (private windows, blocked site data): fall back to memory.
function safeStore(kind) {
  try {
    const s = globalThis[kind];
    s.getItem('x');
    return s;
  } catch {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  }
}
const local = safeStore('localStorage');

export const auth = createAuth({
  ...ACCOUNTS,
  storage: local,
  session: safeStore('sessionStorage'),
  origin: location.origin,
});
export { AuthError };
export const enabled = auth.enabled;

const readJson = (key) => {
  try {
    return JSON.parse(local.getItem(key) || 'null');
  } catch {
    return null;
  }
};
const writeJson = (key, v) => {
  try {
    if (v === null) local.removeItem(key);
    else local.setItem(key, JSON.stringify(v));
  } catch {
    /* optional */
  }
};

// ── The nickname, remembered only so the menu can show it without a network call ────────────────
export const cachedNickname = () => {
  const v = readJson(NICK_KEY);
  return v && typeof v.nick === 'string' ? v.nick : '';
};
auth.onChange((s) => {
  if (!s) writeJson(NICK_KEY, null);
});

export async function myProfile() {
  const p = await auth.rpc('rl_my_profile');
  writeJson(NICK_KEY, p ? { nick: p.nickname } : null);
  return p; // null when no nickname has been chosen yet
}

// ── Syncing the career ──────────────────────────────────────────────────────────────────────────
export const syncState = () => readJson(SYNC_KEY) || {};

// What a sync would send right now, and what the board would then show for it.
export function localSummary() {
  const sub = buildSubmission(career.load());
  return { submission: sub, ...boardTotals(sub), count: Object.keys(sub).length };
}

let running = null;
let timer = null;

// Sends the player's best medals to the leaderboard if anything changed since the last successful sync.
// Never throws: the result says what happened. { status: 'synced' | 'up_to_date' | 'nothing' | 'signed_out' | 'needs_profile' | 'wait' | 'error' }
export async function syncNow({ force = false } = {}) {
  if (!enabled || !auth.session()) return { status: 'signed_out' };
  if (running) return running;
  running = (async () => {
    try {
      const sub = buildSubmission(career.load());
      const print = fingerprint(sub);
      const last = syncState();
      if (!Object.keys(sub).length) return { status: 'nothing' };
      if (!force && last.print === print && !last.deferred) return { status: 'up_to_date', ...last };
      const r = await auth.rpc('rl_submit_progress', { p_results: sub });
      // If some results were held back by the rate limit, keep the old fingerprint so the next sync tries again.
      writeJson(SYNC_KEY, { print: r.deferred ? last.print || '' : print, at: Date.now(), accepted: r.accepted, deferred: r.deferred, xp: r.xp, passed: r.passed, golds: r.golds });
      return { status: 'synced', ...r };
    } catch (e) {
      const code = e instanceof AuthError ? e.code : 'unknown';
      if (code === 'profile_required') return { status: 'needs_profile' };
      if (code === 'too_fast') return { status: 'wait' };
      return { status: 'error', code };
    } finally {
      running = null;
    }
  })();
  return running;
}

// After a mission: sync a moment later, so several results close together go in one request.
export function scheduleSync(delayMs = 1500) {
  if (!enabled || !auth.session()) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const r = await syncNow();
    // The server allows one sync every 15 seconds. If results came in faster than that, try once more afterwards.
    if (r.status === 'wait') timer = setTimeout(() => syncNow(), 16000);
  }, delayMs);
}

export function forgetSyncState() {
  writeJson(SYNC_KEY, null);
  writeJson(NICK_KEY, null);
}
