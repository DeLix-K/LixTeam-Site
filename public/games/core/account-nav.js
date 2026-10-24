// The Leaderboard and Account links in the top bar. They only appear when accounts are switched on, and the Account link
// shows the player's nickname once they are signed in. Reads local storage only: no network call.

import { ACCOUNTS } from './accounts-config.js';

const SESSION_KEY = 'lixteam.rootline.session.v1';
const NICK_KEY = 'lixteam.rootline.nick.v1';

// If a player is signed in, send their results to the leaderboard shortly. A signed-out player never loads the account code.
export function syncIfSignedIn(delayMs = 1500) {
  try {
    if (localStorage.getItem(SESSION_KEY)) import('./account.js').then((m) => m.scheduleSync(delayMs)).catch(() => {});
  } catch {
    /* no storage, no account */
  }
}

export const accountsOn = () => !!(ACCOUNTS.url && ACCOUNTS.anonKey);
export function isSignedIn() {
  try {
    return !!localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}
// The address of the account page, optionally opening on "Create account" and remembering where to come back to.
export function accountUrl(mode, next) {
  const q = new URLSearchParams();
  if (mode) q.set('mode', mode);
  if (next) q.set('next', next);
  const s = q.toString();
  return '/games/levelup/account.html' + (s ? '?' + s : '');
}

export function initNav() {
  const on = !!(ACCOUNTS.url && ACCOUNTS.anonKey);
  const board = document.getElementById('nav-board');
  const acct = document.getElementById('nav-account');
  if (board) board.hidden = !on;
  if (acct) acct.hidden = !on;
  if (!on || !acct) return;
  let signedIn = false;
  let nick = '';
  try {
    signedIn = !!localStorage.getItem(SESSION_KEY);
    const n = JSON.parse(localStorage.getItem(NICK_KEY) || 'null');
    nick = n && typeof n.nick === 'string' ? n.nick : '';
  } catch {
    /* stays signed out */
  }
  acct.textContent = signedIn ? nick || 'Account' : 'Sign in';
}

// After the profile is loaded or the nickname changes, keep the link in step.
export function showNickname(nick) {
  const acct = document.getElementById('nav-account');
  if (acct && !acct.hidden) acct.textContent = nick || 'Account';
}
