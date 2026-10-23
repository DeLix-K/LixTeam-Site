// The public leaderboard: nickname, mission XP, missions passed and golds, for players who chose to appear.
// Scores are self-reported (the server checks they are possible, it cannot prove the missions were played) and the page
// says so. Built with textContent only.

import * as shell from '../core/shell.js';
import * as settings from '../core/settings.js';
import { initNav } from '../core/account-nav.js';
import { auth, enabled, syncNow, AuthError } from '../core/account.js';
import { messageFor } from '../core/sync.js';
import { PATHS } from '../core/missions.js';

shell.init({ addButton: false });
settings.noteGame('levelup');
initNav();

const root = document.getElementById('board');
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return n;
};
const codeOf = (e) => (e instanceof AuthError ? e.code : 'unknown');
const fmt = new Intl.NumberFormat();

const state = { scope: 'all', path: '' };
let rows = null;

function shell_() {
  const pathSel = el('select', { class: 'lb-select', id: 'lb-path', 'aria-label': 'Career path' }, el('option', { value: '', text: 'All career paths' }), ...PATHS.map((p) => el('option', { value: p.id, text: p.name })));
  pathSel.addEventListener('change', () => { state.path = pathSel.value; load(); });
  const mk = (scope, label) => {
    const b = el('button', { type: 'button', class: 'ac-tab', id: `lb-${scope}`, 'aria-pressed': String(state.scope === scope) }, label);
    b.addEventListener('click', () => {
      state.scope = scope;
      for (const x of root.querySelectorAll('.ac-tab')) x.setAttribute('aria-pressed', String(x === b));
      load();
    });
    return b;
  };
  root.replaceChildren(
    el('div', { class: 'lb-head' },
      el('div', {}, el('p', { class: 'lv-kicker', text: 'Level Up in Cyber Security' }), el('h1', { text: 'Leaderboard' })),
      el('div', { class: 'lb-controls' }, el('div', { class: 'ac-tabs', role: 'group', 'aria-label': 'Time period' }, mk('all', 'All time'), mk('week', 'This week')), pathSel)),
    el('p', { class: 'lb-note' }, el('b', { text: 'Self-reported. ' }), 'Scores come from progress saved in each player’s own browser. The server checks that they are possible (real missions, medals that only go up, limits on how fast a score can grow) but cannot prove the missions were played. Only nicknames are shown. Spotted something wrong? Use Report.'),
    el('div', { id: 'lb-body', 'aria-live': 'polite' }, el('p', { class: 'lb-empty', text: 'Loading…' })),
    el('div', { class: 'lb-foot', id: 'lb-foot' })
  );
}

function renderFoot(needsProfile) {
  const foot = document.getElementById('lb-foot');
  if (!foot) return;
  const s = auth.session();
  foot.replaceChildren();
  if (!s) foot.append(el('a', { class: 'btn primary', href: '/games/levelup/account.html' }, 'Sign in to join the leaderboard'), el('span', { class: 'ac-fine', text: 'Accounts are optional. The game works fully without one.' }));
  else if (needsProfile) foot.append(el('a', { class: 'btn primary', href: '/games/levelup/account.html' }, 'Choose a nickname to appear here'));
  else foot.append(el('a', { class: 'btn', href: '/games/levelup/account.html' }, 'Your account'));
}

function renderRows(list, canReport) {
  const body = document.getElementById('lb-body');
  if (!list.length) {
    body.replaceChildren(el('p', { class: 'lb-empty', text: state.scope === 'week' ? 'Nobody has earned XP this week yet. Pass a mission to be first.' : 'No one is on the board yet. Pass a mission and sync your account to be first.' }));
    return;
  }
  const table = el('table', { class: 'lb-table' },
    el('caption', { text: `${state.scope === 'week' ? 'This week' : 'All time'} leaderboard` }),
    el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: '#' }), el('th', { scope: 'col', text: 'Player' }), el('th', { scope: 'col', text: 'XP' }), el('th', { scope: 'col', class: 'opt', text: state.scope === 'week' ? 'Missions' : 'Passed' }), el('th', { scope: 'col', class: 'opt', text: 'Golds' }), el('th', { scope: 'col' }, el('span', { class: 'sr', text: 'Report' })))),
    el('tbody', {}, ...list.map((r) => {
      const pos = Number(r.pos);
      const tr = el('tr', { class: `${r.is_me ? 'me' : ''}${pos <= 3 ? ' top' + pos : ''}`.trim() },
        el('td', { class: 'pos', text: String(pos) }),
        el('td', {}, r.nickname, r.is_me ? el('span', { class: 'chip lb-you', text: 'You' }) : null),
        el('td', { text: fmt.format(Number(r.xp)) }),
        el('td', { class: 'opt', text: String(r.passed) }),
        el('td', { class: 'opt', text: String(r.golds) }),
        el('td', {}, !r.is_me && canReport ? el('button', { class: 'lb-report', type: 'button', onclick: () => report(r.nickname), 'aria-label': `Report ${r.nickname}` }, 'Report') : null));
      return tr;
    })));
  body.replaceChildren(el('div', { class: 'lb-wrap' }, table));
}

function report(nickname) {
  const dlg = el('dialog', { class: 'lb-dialog', 'aria-labelledby': 'lb-rep-h' });
  const msg = el('p', { class: 'ac-status', role: 'status' });
  const reasons = [['offensive', 'Offensive or inappropriate nickname'], ['impersonation', 'Pretending to be someone else'], ['cheating', 'Score looks fake'], ['other', 'Something else']];
  const fs = el('fieldset', {}, el('legend', { class: 'sr', text: 'Reason' }), ...reasons.map(([v, t], i) => el('label', { class: 'ac-check', for: 'rep-' + v }, el('input', { type: 'radio', name: 'reason', value: v, id: 'rep-' + v, checked: i === 0 }), el('span', { text: t }))));
  const send = el('button', { class: 'btn primary', type: 'button' }, 'Send report');
  send.addEventListener('click', async () => {
    send.disabled = true;
    try {
      await auth.rpc('rl_report_player', { p_nickname: nickname, p_reason: fs.querySelector('input:checked').value });
      msg.textContent = 'Thank you. The report has been sent.';
      msg.className = 'ac-status good';
      send.hidden = true;
    } catch (e) {
      msg.textContent = messageFor(codeOf(e));
      msg.className = 'ac-status bad';
      send.disabled = false;
    }
  });
  dlg.append(el('h2', { id: 'lb-rep-h', text: `Report ${nickname}` }), el('p', { class: 'ac-fine', text: 'Reports are read by a person. Nothing happens automatically.' }), fs, msg, el('div', { class: 'btn-row' }, send, el('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Close')));
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

let ticket = 0;
async function load() {
  const mine = ++ticket;
  const body = document.getElementById('lb-body');
  body.replaceChildren(el('p', { class: 'lb-empty', text: 'Loading…' }));
  let needsProfile = false;
  if (auth.session()) {
    const r = await syncNow(); // so your own row is current
    needsProfile = r.status === 'needs_profile';
  }
  try {
    const list = await auth.rpc('rl_leaderboard', { p_scope: state.scope, p_path: state.path || null, p_limit: 50 }, { anonymous: !auth.session() });
    if (mine !== ticket) return;
    rows = list;
    renderRows(list, !!auth.session() && !needsProfile);
    renderFoot(needsProfile);
  } catch (e) {
    if (mine !== ticket) return;
    body.replaceChildren(el('p', { class: 'lb-empty', text: codeOf(e) === 'network' ? messageFor('network') : 'The leaderboard could not be loaded right now. Please try again in a moment.' }), el('div', { class: 'btn-row', style: 'justify-content:center' }, el('button', { class: 'btn', type: 'button', onclick: () => load() }, 'Try again')));
    renderFoot(false);
  }
}

if (!enabled) {
  root.replaceChildren(el('section', { class: 'lv-bp-card ac-card' }, el('p', { class: 'lv-kicker', text: 'Leaderboard' }), el('h1', { text: 'The leaderboard is not switched on yet' }), el('p', { class: 'lead', text: 'ROOTLINE works fully without an account. The leaderboard will appear here when accounts are ready.' }), el('a', { class: 'btn primary big', href: '/games/levelup/' }, 'Back to Level Up')));
} else {
  shell_();
  load();
}
