// The ROOTLINE Plus page. Anyone can read what it is; paying needs an account, and what the page shows once signed in comes
// from the player's real plan. When billing is not switched on, or there is nothing real to offer yet, it says so.

import * as shell from '../core/shell.js';
import * as settings from '../core/settings.js';
import { initNav, accountUrl } from '../core/account-nav.js';
import { auth } from '../core/account.js';
import { billingOn, myPlan } from '../core/billing.js';
import { planPanel } from '../core/plan-ui.js';

shell.init({ addButton: false });
settings.noteGame('levelup');
initNav();

const root = document.getElementById('plus');
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return n;
};
const card = (...kids) => el('section', { class: 'lv-bp-card ac-card' }, ...kids);
const head = (title, lead) => [el('p', { class: 'lv-kicker', text: 'ROOTLINE Plus' }), el('h1', { text: title }), lead ? el('p', { class: 'lead', text: lead }) : null];

async function start() {
  if (!billingOn()) {
    root.replaceChildren(card(...head('Everything is free for now', 'ROOTLINE has no paid plan at the moment. All missions and both games are free to play, with or without an account.'), el('a', { class: 'btn primary big', href: '/games/levelup/' }, 'Back to Level Up')));
    return;
  }
  if (!auth.session()) {
    root.replaceChildren(card(...head('ROOTLINE Plus', 'Create a free account or sign in first. Your progress and the leaderboard are free either way.'), el('div', { class: 'btn-row' }, el('a', { class: 'btn primary big', href: accountUrl('create', '/games/levelup/plus.html') }, 'CREATE FREE ACCOUNT'), el('a', { class: 'btn big', href: accountUrl('signin', '/games/levelup/plus.html') }, 'SIGN IN'), el('a', { class: 'btn big', href: '/games/levelup/' }, 'CONTINUE FREE'))));
    return;
  }
  try {
    const plan = await myPlan();
    root.replaceChildren(card(...head('Your plan'), planPanel(plan)));
  } catch {
    root.replaceChildren(card(...head('We could not load your plan', 'Please try again in a moment. Nothing was charged.'), el('a', { class: 'btn primary big', href: '/games/levelup/plus.html' }, 'Try again')));
  }
}
start();
