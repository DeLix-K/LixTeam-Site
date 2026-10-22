// The ROOTLINE shell shared by every page: it applies the player's settings, builds the settings dialog and adds a
// settings button to a page's top bar. Built with textContent and fixed structure only; nothing here parses markup.

import * as settings from './settings.js';
import * as profile from './profile.js';
import * as streak from './streak.js';

settings.apply();

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

const GEAR = () => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const g = document.createElementNS(ns, 'g');
  for (const [k, v] of Object.entries({ fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) g.setAttribute(k, v);
  const c = document.createElementNS(ns, 'circle');
  c.setAttribute('cx', '12');
  c.setAttribute('cy', '12');
  c.setAttribute('r', '3');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z');
  g.append(c, p);
  svg.append(g);
  return svg;
};

let dialog = null;
let opener = null;

function build() {
  const s = settings.load();
  const motion = (value, label, hint) => {
    const input = el('input', { type: 'radio', name: 'rl-motion', value, id: `rl-motion-${value}` });
    input.checked = s.motion === value;
    input.addEventListener('change', () => {
      const now = { ...settings.load(), motion: value };
      settings.save(now);
      settings.apply(now);
    });
    return el('label', { class: 'rl-opt', for: `rl-motion-${value}` }, input, el('span', {}, el('strong', { text: label }), el('small', { text: hint })));
  };
  const scan = el('input', { type: 'checkbox', id: 'rl-scan' });
  scan.checked = s.scanlines;
  scan.addEventListener('change', () => {
    const now = { ...settings.load(), scanlines: scan.checked };
    settings.save(now);
    settings.apply(now);
  });
  const note = el('p', { class: 'rl-note', role: 'status' });
  const reset = el('button', {
    class: 'btn small',
    type: 'button',
    onclick: () => {
      if (!window.confirm('Reset your practice level, XP, streak and skill history on this device? Your career ranks and medals are kept.')) return;
      profile.reset();
      streak.reset();
      note.textContent = 'Practice stats reset. Career ranks and medals were kept.';
      document.dispatchEvent(new CustomEvent('rootline:reset'));
    },
    text: 'Reset practice stats',
  });
  const close = el('button', { class: 'btn primary', type: 'button', onclick: () => dialog.close(), text: 'Done' });
  dialog = el(
    'dialog',
    { class: 'rl-dialog', 'aria-labelledby': 'rl-settings-h' },
    el('form', { method: 'dialog', class: 'rl-dialog-body', onsubmit: (e) => e.preventDefault() },
      el('h2', { id: 'rl-settings-h', text: 'Settings' }),
      el('fieldset', {}, el('legend', { text: 'Motion' }),
        motion('auto', 'Follow my device', 'Animations play unless your device asks for less motion.'),
        motion('reduce', 'Reduce motion', 'Switches off panel transitions, glows that move and scrolling effects.')),
      el('fieldset', {}, el('legend', { text: 'Screen' }),
        el('label', { class: 'rl-opt', for: 'rl-scan' }, scan, el('span', {}, el('strong', { text: 'Scanline texture' }), el('small', { text: 'A faint CRT texture over the menus. Off gives plain dark surfaces.' })))),
      el('fieldset', {}, el('legend', { text: 'Your data' }),
        el('p', { class: 'rl-note', text: 'Progress is stored only in this browser. Nothing is sent anywhere.' }),
        reset, note,
        el('p', { class: 'rl-note' }, el('a', { href: '/games/privacy/', text: 'Privacy notice' }), ' · ', el('a', { href: '/games/career/', text: 'Export or restore your career progress' }))),
      el('div', { class: 'btn-row' }, close))
  );
  dialog.addEventListener('close', () => {
    if (opener && document.contains(opener)) opener.focus();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
}

export function openSettings(from) {
  if (!dialog) build();
  opener = from || document.activeElement;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

// Any element marked data-open-settings opens the dialog. Pages with a plain top bar get a button added to it.
export function init({ addButton = true } = {}) {
  for (const b of document.querySelectorAll('.rl-gear:empty')) b.append(GEAR());
  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-open-settings]') : null;
    if (t) {
      e.preventDefault();
      openSettings(t);
    }
  });
  const top = document.querySelector('header.top');
  if (addButton && top && !top.querySelector('[data-open-settings]')) {
    const cell = top.querySelector('.spacer, .mode-chip, .top-tools');
    const btn = el('button', { class: 'rl-gear', type: 'button', 'data-open-settings': '', 'aria-label': 'Settings', title: 'Settings' }, GEAR());
    if (cell && cell.classList.contains('top-tools')) cell.append(btn);
    else {
      const tools = el('span', { class: 'top-tools' });
      if (cell) {
        cell.replaceWith(tools);
        if (cell.classList.contains('mode-chip')) tools.append(cell);
        else cell.remove();
      } else top.append(tools);
      tools.append(btn);
    }
  }
}

export { GEAR };
