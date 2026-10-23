// The mission briefing: a full-screen read before a mission starts. It shows what the mission asks, which skills it
// builds and what it pays, from the same career rules the map uses. "Begin" is a plain link to the mission itself, so
// nothing about how the game modes start or time themselves changes.

import * as shell from '../core/shell.js';
import * as settings from '../core/settings.js';
import * as career from '../core/career.js';
import * as weekly from '../core/weekly.js';
import { briefing } from '../core/map.js';
import { modeInfo } from '../core/modes.js';
import { MEDALS } from '../core/missions.js';
import { modeIcon, MODE_COLOUR } from '../core/art.js';
import { initNav } from '../core/account-nav.js';

shell.init({ addButton: false });
initNav();
settings.noteGame('levelup');

const root = document.getElementById('brief');
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

const params = new URLSearchParams(location.search);

function notFound(text) {
  root.replaceChildren(
    el('section', { class: 'lv-bp-card' }, el('p', { class: 'eyebrow', text: 'Mission briefing' }), el('h1', { text: 'That mission is not here' }), el('p', { class: 'lead', text }), el('a', { class: 'btn primary big', href: '/games/levelup/' }, 'Back to the mission map'))
  );
  document.title = 'Mission not found · ROOTLINE';
}

function chips(list) {
  return el('div', { class: 'lv-chiprow' }, ...list.filter(Boolean).map(([text, cls]) => el('span', { class: `chip${cls ? ' ' + cls : ''}`, text })));
}

function render(view) {
  const colour = MODE_COLOUR[view.modeId] || '#a3e635';
  const goal = view.goal;
  const left = el(
    'section',
    { class: 'lv-bp-card lv-bp-main' },
    el('p', { class: 'lv-kicker', text: view.kicker }),
    el('h1', { text: view.title }),
    chips(view.chips),
    el('p', { class: 'lv-bp-blurb', text: view.blurb }),
    el('h2', { text: 'Your objectives' }),
    el('ol', { class: 'lv-objectives' }, ...view.objectives.map((o) => el('li', { text: o }))),
    el('h2', { text: `How ${modeInfo(view.modeId).name} works` }),
    el('ul', { class: 'lv-how' }, ...modeInfo(view.modeId).how.map((t) => el('li', { text: t })))
  );
  const side = el('aside', { class: 'lv-bp-side', 'aria-label': 'Rewards and requirements' });
  side.append(el('div', { class: 'lv-bp-badge', 'aria-hidden': 'true' }, modeIcon(view.modeId, 38)));
  if (view.trains && view.trains.length) {
    side.append(
      el('h2', { text: 'Skills it builds' }),
      el('ul', { class: 'lv-trains' }, ...view.trains.map((t) => { const bar = el('span', { class: 'lv-bar' }, el('i')); bar.firstChild.style.width = `${Math.round(t.weight * 100)}%`; return el('li', {}, el('span', { text: t.name }), bar); }))
    );
  }
  side.append(el('h2', { text: view.xpTitle }), el('p', { class: 'lv-xp' }, ...view.xp.map(([t, g]) => el('span', { class: g ? 'gold' : '', text: t }))));
  if (view.status) side.append(el('h2', { text: 'Your record' }), el('p', { class: 'lv-record', text: view.status }));
  if (view.missing && view.missing.length) {
    side.append(el('h2', { text: 'To unlock this' }), el('ul', { class: 'lv-missing' }, ...view.missing.map((x) => el('li', {}, el('span', { text: x.label }), el('small', { text: x.detail })))));
  }
  const actions = el('div', { class: 'lv-bp-actions' });
  if (view.locked) actions.append(el('button', { class: 'btn big', type: 'button', disabled: true }, 'Locked'));
  else actions.append(el('a', { class: 'btn primary big', id: 'begin', href: view.href }, view.cta));
  actions.append(el('a', { class: 'btn big', href: '/games/levelup/' }, 'Back to the mission map'));
  side.append(actions);
  side.style.setProperty('--mode', colour);
  root.style.setProperty('--mode', colour);
  root.replaceChildren(el('div', { class: 'lv-bp' }, left, side));
  document.title = `${view.title} · Mission briefing · ROOTLINE`;
  if (goal) root.dataset.goal = goal;
}

function missionView(id) {
  const s = career.load();
  const b = briefing(s, id);
  if (!b) return null;
  const m = b.mission;
  const pass = m.exam ? 'Pass the exam with silver or better.' : 'Pass with at least bronze.';
  return {
    modeId: m.mode,
    kicker: `${m.exam ? 'Promotion exam' : 'Mission'} · ${b.tier} stage`,
    title: m.title,
    blurb: m.blurb,
    chips: [[`${b.tier} · ×${b.multiplier} XP`], [`About ${m.minutes} min`], [modeInfo(m.mode).name], [b.status === 'done' ? `Passed · ${MEDALS[b.medal]}` : b.status === 'ready' ? (b.attempts ? `Tried ${b.attempts}×` : 'New') : 'Locked', `st-${b.status}`]],
    objectives: [pass, 'Earn a better medal for more XP: gold pays the most.', `Build: ${b.trains.slice(0, 3).map((t) => t.name.toLowerCase()).join(', ')}.`, m.exam ? 'Passing promotes you to the next rank on this path.' : 'Passing can unlock the next missions on the map.'],
    trains: b.trains,
    xpTitle: 'XP for a first medal',
    xp: [[`Bronze ${b.xp.bronze}`], [`Silver ${b.xp.silver}`], [`Gold ${b.xp.gold}`, true]],
    status: b.attempts ? `${b.attempts} attempt${b.attempts === 1 ? '' : 's'} so far. Best: ${MEDALS[b.medal] || 'not passed yet'}.` : 'You have not tried this one yet.',
    missing: b.missing.map((x) => ({ label: x.label, detail: x.detail })),
    locked: b.status === 'locked',
    cta: b.status === 'done' ? 'Replay for a better medal' : b.attempts ? 'Try again' : 'Begin mission',
    href: b.href,
  };
}

function weeklyView(id) {
  const e = weekly.byId(id);
  if (!e || !weekly.isReleased(e)) return null;
  const r = weekly.resultOf(e.id);
  return {
    modeId: e.mode,
    kicker: "This week's case",
    title: e.title,
    blurb: e.blurb,
    chips: [[`About ${e.minutes} min`], [modeInfo(e.mode).name], [r && r.tier > 0 ? `Done · ${MEDALS[r.tier]}` : r ? 'Not passed yet' : 'New', r && r.tier > 0 ? 'st-done' : 'st-ready']],
    objectives: ['Pass with at least bronze.', 'The bonus XP is paid once, the first time you pass it.', 'A weekly case also keeps your day streak alive.'],
    trains: [],
    xpTitle: 'Bonus XP, paid once',
    xp: [[`Bronze ${weekly.BONUS[1]}`], [`Silver ${weekly.BONUS[2]}`], [`Gold ${weekly.BONUS[3]}`, true]],
    status: r ? `Best so far: ${r.tier > 0 ? MEDALS[r.tier] : 'not passed yet'}.` : 'You have not tried this one yet.',
    missing: [],
    locked: false,
    cta: r && r.tier > 0 ? 'Play again' : 'Begin the case',
    href: `/games/${e.mode}/?weekly=${e.id}`,
  };
}

const wid = params.get('weekly');
const mid = params.get('id');
if (wid) {
  const v = weeklyView(wid);
  if (v) render(v);
  else notFound('That weekly case is not out yet, or the link is wrong.');
} else if (mid) {
  const v = missionView(mid);
  if (v) render(v);
  else notFound('There is no mission with that id.');
} else notFound('Choose a mission on the map to read its briefing.');
