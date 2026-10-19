import { ESCAPES } from './escapes.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';

const BEST_KEY = 'lixteam.escapeRoom.best';
const params = new URLSearchParams(location.search);
const TEST_TIME = Number(params.get('time')) || 0; // ?time=20 shortens the clock, for testing
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), play: $('screen-play'), end: $('screen-end') };

// Elements are built with textContent only; nothing from the data is parsed as HTML.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}
function readBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeBest(o) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(o));
  } catch {
    /* progress just is not remembered */
  }
}
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let esc = null;
let g = null;
let reader = null; // reads the current answer from the puzzle widget
let clock = null; // { total, elapsed, last }
let ticker = null;

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo({ top: 0 });
}

// ── Picking ─────────────────────────────────────────────────────
function renderPicker() {
  const best = readBest();
  const list = $('escape-list');
  list.replaceChildren();
  for (const e of ESCAPES) {
    const skill = profile.SKILLS.find((s) => s.id === e.skill);
    const card = h(
      'button',
      { class: 'escape-card', type: 'button' },
      h('h3', { text: e.title }),
      h('p', { text: e.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: `${e.rooms.length} rooms` }),
        h('span', { class: 'chip', text: `${Math.round(e.totalSeconds / 60)} minutes` }),
        h('span', { class: 'chip', text: profile.skillLabel(e.skill) }),
        best[e.id] ? h('span', { class: 'chip best', text: `Best: ${best[e.id].rating} (${best[e.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(e));
    list.append(card);
  }
}

// ── The clock ───────────────────────────────────────────────────
const fmt = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, Math.ceil(s) % 60)).padStart(2, '0')}`;
const timeLeft = () => (clock ? clock.total - clock.elapsed : 0);

function startClock() {
  stopClock();
  if (!g.timed) return;
  clock.last = performance.now();
  ticker = setInterval(() => {
    const now = performance.now();
    // The clock stops while the tab is hidden, so switching away does not cost you.
    if (!document.hidden) clock.elapsed += (now - clock.last) / 1000;
    clock.last = now;
    renderTimer();
    if (timeLeft() <= 0 && !g.done) {
      engine.timeOut(g);
      finish();
    }
  }, 250);
}
function stopClock() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}
let announced = new Set();
function renderTimer() {
  if (!g.timed) return;
  const left = timeLeft();
  $('timer').textContent = fmt(left);
  $('timer-box').classList.toggle('low', left <= 60);
  for (const mark of [60, 30]) {
    if (left <= mark && !announced.has(mark)) {
      announced.add(mark);
      $('timer-live').textContent = `${mark} seconds left.`;
    }
  }
}

// ── Playing ─────────────────────────────────────────────────────
function start(e) {
  profile.load();
  esc = e;
  g = engine.newGame(e, { timed: !$('practice').checked });
  clock = { total: TEST_TIME || e.totalSeconds, elapsed: 0, last: 0 };
  announced = new Set();
  $('timer-box').hidden = !g.timed;
  $('timer-label').textContent = 'time left';
  $('timer').textContent = fmt(clock.total);
  $('timer-box').classList.remove('low');
  show('play');
  renderRoom();
  startClock();
}

function renderCode(into, final) {
  into.replaceChildren(
    ...esc.rooms.map((r, i) => h('span', { class: g.solved[i] ? 'on' : '', text: g.solved[i] ? r.fragment : '?', 'aria-hidden': 'false' }))
  );
  into.setAttribute('aria-label', `Escape code: ${esc.rooms.map((r, i) => (g.solved[i] ? r.fragment : 'blank')).join(' ')}`);
}

function renderBar() {
  $('rooms-bar').replaceChildren(
    ...esc.rooms.map((r, i) => h('li', { class: g.solved[i] ? 'done' : i === g.room ? 'now' : '', 'aria-label': `${r.title}${g.solved[i] ? ', solved' : i === g.room ? ', current' : ''}` }))
  );
}

function renderRoom() {
  const room = engine.currentRoom(esc, g);
  $('solved').hidden = true;
  $('room').hidden = false;
  $('room-title').textContent = room.title;
  $('room-scene').textContent = esc.rooms.indexOf(room) === 0 ? `${esc.premise} ${room.scene}` : room.scene;
  renderCode($('code'));
  renderBar();

  // objects
  const objs = $('objects');
  objs.replaceChildren();
  $('noticed').replaceChildren();
  for (const o of room.objects) {
    const btn = h('button', { class: 'obj', type: 'button', text: o.label });
    btn.addEventListener('click', () => {
      const r = engine.lookAt(esc, g, o.id);
      if (!r.ok) return;
      btn.disabled = true;
      btn.classList.add('seen');
      $('noticed').append(h('li', {}, h('small', { text: o.label }), r.text));
    });
    objs.append(btn);
  }

  // puzzle
  $('prompt').textContent = room.puzzle.prompt;
  buildPuzzle(room.puzzle);
  $('feedback-msg').textContent = '';
  $('hintbox').hidden = true;
  $('hintbox').replaceChildren();
  updateHintButton();
  $('check-btn').disabled = true;
  updateCheck();
  $('room-title').scrollIntoView({ block: 'start' });
}

function updateHintButton() {
  const room = engine.currentRoom(esc, g);
  const left = room.puzzle.hints.length - g.hints[g.room];
  $('hint-btn').disabled = left <= 0;
  $('hint-btn').textContent = left > 0 ? `Hint (${left} left)` : 'No hints left';
  $('hint-cost').textContent = g.timed
    ? `Each hint costs ${engine.HINT_POINT_COST} points and ${engine.HINT_TIME_COST} seconds.`
    : `Each hint costs ${engine.HINT_POINT_COST} points.`;
}

// ── Puzzle widgets ──────────────────────────────────────────────
function buildPuzzle(p) {
  const box = $('puzzle');
  box.replaceChildren();
  const onChange = () => updateCheck();

  if (p.type === 'choose' || p.type === 'select') {
    const multi = p.type === 'select';
    const fs = h('fieldset', { class: `opts${p.type === 'choose' && p.options.some((o) => /^[A-Za-z0-9$#!-]{6,}$/.test(o.text)) ? ' mono' : ''}` }, h('legend', { text: p.prompt }));
    for (const o of shuffle(p.options)) {
      const input = h('input', { type: multi ? 'checkbox' : 'radio', name: 'pz', value: o.id });
      input.addEventListener('change', onChange);
      fs.append(h('label', {}, input, h('span', { class: 'box' }, o.text, o.detail ? h('small', { text: o.detail }) : null)));
    }
    box.append(fs);
    reader = () => (multi ? [...box.querySelectorAll('input:checked')].map((i) => i.value) : box.querySelector('input:checked')?.value);
    p._ready = () => (multi ? box.querySelectorAll('input:checked').length > 0 : !!box.querySelector('input:checked'));
  } else if (p.type === 'order') {
    const picked = [];
    const wrap = h('div', { class: 'order-lists' });
    const avail = h('div', { class: 'order-col' }, h('h4', { text: 'Steps' }), h('ul'));
    const chosen = h('div', { class: 'order-col picked' }, h('h4', { text: 'Your order' }), h('ol'));
    const reset = h('button', { class: 'linkbtn', type: 'button', text: 'Clear my order' });
    const shuffled = shuffle(p.items);
    const draw = () => {
      avail.querySelector('ul').replaceChildren(
        ...shuffled
          .filter((it) => !picked.includes(it.id))
          .map((it) => {
            const b = h('button', { class: 'step', type: 'button', text: it.text });
            b.addEventListener('click', () => {
              picked.push(it.id);
              draw();
              onChange();
            });
            return h('li', {}, b);
          })
      );
      chosen.querySelector('ol').replaceChildren(
        ...picked.map((id, i) => {
          const it = p.items.find((x) => x.id === id);
          const b = h('button', { class: 'step', type: 'button', 'aria-label': `Step ${i + 1}: ${it.text}. Tap to remove.` }, h('span', { class: 'n', text: String(i + 1) }), it.text);
          b.addEventListener('click', () => {
            picked.splice(i, 1);
            draw();
            onChange();
          });
          return h('li', {}, b);
        })
      );
    };
    reset.addEventListener('click', () => {
      picked.length = 0;
      draw();
      onChange();
    });
    wrap.append(avail, chosen);
    box.append(wrap, reset);
    draw();
    reader = () => [...picked];
    p._ready = () => picked.length === p.items.length;
  } else if (p.type === 'toggle') {
    const list = h('div', { class: 'switches' });
    for (const s of p.settings) {
      const input = h('input', { type: 'checkbox', role: 'switch', 'data-id': s.id, checked: s.on });
      const state = h('span', { class: 'state', text: s.on ? 'On' : 'Off', 'aria-hidden': 'true' });
      input.addEventListener('change', () => {
        state.textContent = input.checked ? 'On' : 'Off';
        onChange();
      });
      list.append(h('label', { class: 'switch' }, h('span', { text: s.text }), input, h('span', { class: 'tr', 'aria-hidden': 'true' }), state));
    }
    box.append(list);
    reader = () => Object.fromEntries([...box.querySelectorAll('input[data-id]')].map((i) => [i.dataset.id, i.checked]));
    p._ready = () => true;
  } else if (p.type === 'match') {
    const list = h('div', { class: 'matches' });
    for (const it of p.items) {
      const sel = h('select', { id: `m-${it.id}`, 'data-id': it.id }, h('option', { value: '', text: 'Choose a role…' }), ...shuffle(p.options).map((o) => h('option', { value: o.id, text: o.text })));
      sel.addEventListener('change', onChange);
      list.append(h('div', { class: 'match' }, h('label', { for: `m-${it.id}`, text: it.text }), sel));
    }
    box.append(list);
    reader = () => Object.fromEntries([...box.querySelectorAll('select')].map((s) => [s.dataset.id, s.value]));
    p._ready = () => [...box.querySelectorAll('select')].every((s) => s.value !== '');
  }
}

function updateCheck() {
  const room = engine.currentRoom(esc, g);
  $('check-btn').disabled = !(room.puzzle._ready ? room.puzzle._ready() : false);
}

function check() {
  if (g.done) return;
  const room = engine.currentRoom(esc, g);
  const res = engine.attempt(esc, g, reader());
  if (!res.ok) return;
  if (!res.correct) {
    $('feedback-msg').textContent = `Not quite. ${res.detail}`;
    return;
  }
  $('feedback-msg').textContent = '';
  $('room').hidden = true;
  renderCode($('code'));
  renderBar();
  $('solved-title').textContent = `Room unlocked. Letter: ${room.fragment}`;
  $('solved-explain').textContent = res.explain;
  $('next-room').textContent = res.escaped ? 'Open the vault' : 'Next room';
  $('solved').hidden = false;
  $('next-room').focus({ preventScroll: false });
}

function hint() {
  const r = engine.nextHint(esc, g);
  if (!r.ok) return;
  if (g.timed) clock.elapsed += engine.HINT_TIME_COST;
  const box = $('hintbox');
  box.hidden = false;
  box.append(h('div', { text: `Hint ${g.hints[g.room]}: ${r.text}` }));
  updateHintButton();
  renderTimer();
  if (g.timed && timeLeft() <= 0 && !g.done) {
    engine.timeOut(g);
    finish();
  }
}

// ── Results ─────────────────────────────────────────────────────
function finish() {
  stopClock();
  const out = engine.grade(esc, g, { timeLeft: Math.max(0, timeLeft()), total: clock.total });

  // Record each solved room for the skill bars. A hint means it was not secure knowledge.
  esc.rooms.forEach((r, i) => {
    if (!g.solved[i]) return;
    profile.recordAnswer({ id: `er-${esc.id}-${r.id}`, skill: r.skill, correct: g.attempts[i] === 1, confidence: g.hints[i] ? 'guess' : 'fairly', revise: false });
  });
  const xp = 20 + Math.round(Math.max(0, out.points) / 6) + (g.escaped ? 15 : 0);
  const lv = profile.addXp(xp);
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[esc.id];
  const improved = !prev || out.points > prev.points;
  if (improved) {
    best[esc.id] = { points: out.points, rating: out.rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = esc.title;
  $('res-rating').textContent = out.rating.name;
  $('res-blurb').textContent = g.escaped ? `${esc.finale} ${out.rating.blurb}` : out.rating.blurb;
  renderCode($('res-code'));
  $('res-points').textContent = String(out.points);
  $('res-rooms').textContent = `${out.solvedCount}/${esc.rooms.length}`;
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.` +
    (improved && prev ? ' New personal best for this escape.' : '');

  $('res-lessons').replaceChildren(
    ...esc.rooms.map((r, i) =>
      h(
        'li',
        { class: g.solved[i] ? '' : 'unsolved' },
        h('strong', { text: `${r.concept}${g.solved[i] ? '' : ' (not solved)'}` }),
        h('small', { text: r.puzzle.explain })
      )
    )
  );
  $('res-breakdown').replaceChildren(
    ...out.breakdown.map((b) => h('li', {}, h('span', { text: b.label }), h('span', { class: `pts ${b.points > 0 ? 'pos' : b.points < 0 ? 'neg' : 'zero'}`, text: `${b.points >= 0 ? '+' : ''}${b.points}` })))
  );
  show('end');
  $('res-again').focus({ preventScroll: true });
}

// ── Wiring ──────────────────────────────────────────────────────
$('check-btn').addEventListener('click', check);
$('hint-btn').addEventListener('click', hint);
$('next-room').addEventListener('click', () => {
  if (g.done) return finish();
  renderRoom();
});
$('res-again').addEventListener('click', () => start(esc));
$('res-other').addEventListener('click', () => {
  stopClock();
  renderPicker();
  show('pick');
});

renderPicker();
