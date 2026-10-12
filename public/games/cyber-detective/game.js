import { CASES } from './cases.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';

const BEST_KEY = 'lixteam.cyberDetective.best';
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), play: $('screen-play'), solve: $('screen-solve'), end: $('screen-end') };

// Elements are built with textContent only; nothing from the data is parsed as HTML.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
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
function writeBest(obj) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(obj));
  } catch {
    /* progress just is not remembered */
  }
}

let c = null; // the case
let st = null; // engine state
let active = null; // artefact id being viewed
let fresh = new Set(); // artefacts unlocked but not opened yet
let step = 0;
let answers = null;
let outcome = null;

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo({ top: 0 });
}

// ── Picking ─────────────────────────────────────────────────────
function renderPicker() {
  const best = readBest();
  const list = $('case-list');
  list.replaceChildren();
  for (const cs of CASES) {
    const skill = profile.SKILLS.find((s) => s.id === cs.skill);
    const strongTotal = Object.values(cs.clues).filter((x) => x.strength === 'strong').length;
    const card = h(
      'button',
      { class: 'case-card', type: 'button' },
      h('h3', { text: cs.title }),
      h('p', { text: cs.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: skill ? skill.name : cs.skill }),
        h('span', { class: 'chip', text: `${cs.artefacts.length} pieces of evidence` }),
        h('span', { class: 'chip', text: `${strongTotal} key clues` }),
        best[cs.id] ? h('span', { class: 'chip best', text: `Best: ${best[cs.id].rating} (${best[cs.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(cs));
    list.append(card);
  }
}

// ── Investigating ───────────────────────────────────────────────
function start(cs) {
  profile.load();
  c = cs;
  st = engine.newCase(cs);
  active = cs.artefacts[0].id;
  fresh = new Set();
  $('case-title').textContent = cs.title;
  const skill = profile.SKILLS.find((s) => s.id === cs.skill);
  $('case-skill').textContent = skill ? skill.name : '';
  $('brief-body').replaceChildren(...cs.brief.map((p) => h('p', { text: p })));
  $('brief').open = true;
  $('announce').textContent = '';
  show('play');
  renderAll();
}

function renderAll() {
  renderCounters();
  renderTabs();
  renderViewer();
  renderBoard();
}

function renderCounters() {
  $('n-clues').textContent = String(st.found.length);
  $('n-wrong').textContent = String(st.falseFlags);
  const ok = engine.canSolve(c, st);
  $('solve-btn').disabled = !ok;
  $('solve-hint').textContent = ok
    ? 'Ready when you are. You can keep investigating first.'
    : 'Find at least two clues first.';
}

function renderTabs() {
  const tabs = $('tabs');
  tabs.replaceChildren();
  for (const a of c.artefacts) {
    const open = engine.isUnlocked(a, st);
    const btn = h(
      'button',
      { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(open && a.id === active), disabled: open ? null : 'disabled' },
      h('span', {}, a.title, open && fresh.has(a.id) ? h('span', { class: 'new', text: 'New' }) : null),
      h('small', { text: open ? '' : 'Locked: find the right clue' })
    );
    if (!open) btn.disabled = true;
    else btn.removeAttribute('disabled');
    if (open) {
      btn.addEventListener('click', () => {
        active = a.id;
        fresh.delete(a.id);
        renderTabs();
        renderViewer();
      });
    }
    tabs.append(btn);
  }
}

function noteFor(line) {
  const type = st.flagged[line.id];
  if (!type) return null;
  const isClue = type === 'clue';
  const label = isClue
    ? 'Clue found'
    : type === 'herring'
      ? `Red herring (-${engine.FALSE_FLAG_PENALTY} points)`
      : `Nothing to see (-${engine.FALSE_FLAG_PENALTY} points)`;
  return h('div', { class: `note ${isClue ? 'clue' : 'no'}`, tabindex: '-1' }, h('b', { text: label }), line.note);
}

function renderViewer() {
  const a = c.artefacts.find((x) => x.id === active);
  $('viewer-blurb').textContent = a.blurb;
  const list = $('lines');
  list.replaceChildren();
  for (const line of a.lines) {
    const type = st.flagged[line.id];
    const btn = h('button', { class: 'line', type: 'button', text: line.text, 'aria-label': `Flag this line: ${line.text}` });
    if (type) btn.disabled = true;
    else btn.addEventListener('click', () => flag(a, line));
    list.append(h('li', { class: type ? (type === 'clue' ? 'is-clue' : 'is-no') : '' }, btn, noteFor(line)));
  }
}

function renderBoard() {
  $('board-empty').hidden = st.found.length > 0;
  $('board').replaceChildren(...st.found.map((id) => h('li', { text: c.clues[id].text })));
}

function flag(artefact, line) {
  const r = engine.flagLine(c, st, artefact.id, line.id);
  if (!r.ok) return;
  $('brief').open = false;
  let msg;
  if (r.type === 'clue') {
    msg = `Clue found: ${c.clues[r.clue].strength === 'strong' ? 'a key one.' : 'useful, but not proof on its own.'}`;
    for (const id of r.unlocked) {
      fresh.add(id);
      msg += ` New evidence unlocked: ${c.artefacts.find((x) => x.id === id).title}.`;
    }
  } else {
    msg = `Not a clue. -${engine.FALSE_FLAG_PENALTY} points.`;
  }
  $('announce').textContent = msg;
  renderCounters();
  renderTabs();
  renderViewer();
  renderBoard();
  // Keep keyboard focus where the player was: on the explanation they just earned.
  const note = [...$('lines').querySelectorAll('li')][artefact.lines.indexOf(line)]?.querySelector('.note');
  if (note) note.focus({ preventScroll: true });
}

// ── Solving ─────────────────────────────────────────────────────
function startSolve() {
  step = 0;
  answers = { attack: null, attackConf: 'fairly', support: [], action: null };
  show('solve');
  renderStep();
}

const STEPS = ['attack', 'support', 'action'];

function renderStep() {
  const kind = STEPS[step];
  $('solve-step').textContent = `Solve the case: ${step + 1} of ${STEPS.length}`;
  const box = $('solve-options');
  box.classList.remove('locked');
  box.replaceChildren(h('legend', { class: 'sr', text: 'Choose' }));
  $('solve-feedback').hidden = true;
  $('solve-submit').hidden = false;
  $('solve-submit').disabled = true;
  $('solve-conf').hidden = kind !== 'attack';
  const hint = $('solve-hint2');

  if (kind === 'attack' || kind === 'action') {
    $('solve-h').textContent = kind === 'attack' ? 'What kind of attack is this?' : 'What should you do first?';
    hint.hidden = true;
    const opts = c.solution[kind];
    const order = opts.map((o, i) => i).sort(() => Math.random() - 0.5);
    for (const i of order) {
      const lab = h('label', { 'data-id': opts[i].id }, h('input', { type: 'radio', name: 'sq', value: opts[i].id }), h('span', { text: opts[i].text }));
      lab.firstChild.addEventListener('change', () => ($('solve-submit').disabled = false));
      box.append(lab);
    }
  } else {
    $('solve-h').textContent = 'Which clues prove it?';
    hint.hidden = false;
    hint.textContent = 'Choose up to three clues from your case board that make the strongest case.';
    for (const id of st.found) {
      const lab = h('label', { 'data-id': id }, h('input', { type: 'checkbox', name: 'sc', value: id }), h('span', { text: c.clues[id].text }));
      lab.firstChild.addEventListener('change', syncSupport);
      box.append(lab);
    }
  }
}

function syncSupport() {
  const boxes = [...document.querySelectorAll('input[name="sc"]')];
  const picked = boxes.filter((b) => b.checked);
  for (const b of boxes) b.disabled = !b.checked && picked.length >= 3;
  $('solve-submit').disabled = picked.length === 0;
}

function submitStep() {
  const kind = STEPS[step];
  const fb = $('solve-feedback');
  const box = $('solve-options');
  box.classList.add('locked');
  let good = false;
  let title;
  let explain;

  if (kind === 'attack' || kind === 'action') {
    const picked = document.querySelector('input[name="sq"]:checked').value;
    const opt = c.solution[kind].find((o) => o.id === picked);
    const right = opt.correct;
    good = right;
    if (kind === 'attack') {
      answers.attack = picked;
      answers.attackConf = document.querySelector('input[name="sconf"]:checked')?.value || 'fairly';
    } else {
      answers.action = picked;
    }
    const conf = kind === 'attack' ? answers.attackConf : 'fairly';
    title = right ? 'Correct' : conf === 'certain' ? 'Not quite, and you were certain' : 'Not quite';
    explain = right ? opt.explain : c.solution[kind].find((o) => o.correct).explain;
    for (const lab of box.querySelectorAll('label')) {
      const o = c.solution[kind].find((x) => x.id === lab.dataset.id);
      if (o.correct) lab.classList.add('right');
      else if (lab.dataset.id === picked) lab.classList.add('wrong');
    }
    profile.recordAnswer({ id: `cd-${c.id}-${kind}`, skill: c.skill, correct: right, confidence: conf, revise: false });
  } else {
    const picks = [...document.querySelectorAll('input[name="sc"]:checked')].map((b) => b.value);
    answers.support = picks;
    const strongPicked = picks.filter((id) => c.clues[id].strength === 'strong');
    good = strongPicked.length === picks.length;
    const strongAll = st.found.filter((id) => c.clues[id].strength === 'strong');
    title = good ? 'Strong evidence' : strongPicked.length > 0 ? 'Partly strong' : 'Weak evidence';
    explain = `The clues that actually prove it: ${strongAll.map((id) => c.clues[id].text).join(' ')} Minor clues are true but any one of them could have an innocent explanation.`;
    for (const lab of box.querySelectorAll('label')) {
      const id = lab.dataset.id;
      if (c.clues[id].strength === 'strong') lab.classList.add('right');
      else if (picks.includes(id)) lab.classList.add('wrong');
    }
  }

  fb.className = `feedback ${good ? 'good' : 'bad'}`;
  $('sf-title').textContent = title;
  $('sf-explain').textContent = explain;
  $('solve-next').textContent = step + 1 >= STEPS.length ? 'See my results' : 'Next';
  fb.hidden = false;
  $('solve-submit').hidden = true;
  $('solve-conf').hidden = true;
  $('solve-next').focus({ preventScroll: false });
}

function nextStep() {
  step += 1;
  if (step >= STEPS.length) return showResults();
  renderStep();
  window.scrollTo({ top: 0 });
}

// ── Results ─────────────────────────────────────────────────────
function showResults() {
  outcome = engine.grade(c, st, answers);
  let xp = 20 + Math.round(Math.max(0, outcome.points) / 8);
  if (outcome.attackRight) xp += 15 + (answers.attackConf === 'certain' ? 5 : 0);
  if (outcome.actionRight) xp += 10;
  const lv = profile.addXp(xp);
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[c.id];
  const improved = !prev || outcome.points > prev.points;
  if (improved) {
    best[c.id] = { points: outcome.points, rating: outcome.rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = c.title;
  $('res-rating').textContent = outcome.rating.name;
  $('res-blurb').textContent = outcome.rating.blurb;
  $('res-points').textContent = String(outcome.points);
  $('res-clues').textContent = `${st.found.length}/${Object.keys(c.clues).length}`;
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.` +
    (improved && prev ? ' New personal best for this case.' : '');

  $('res-story').replaceChildren(...c.story.map((s) => h('li', { text: s })));
  $('res-breakdown').replaceChildren(
    ...outcome.breakdown.map((b) =>
      h('li', {}, h('span', { text: b.label }), h('span', { class: `pts ${b.points > 0 ? 'pos' : b.points < 0 ? 'neg' : 'zero'}`, text: `${b.points >= 0 ? '+' : ''}${b.points}` }))
    )
  );
  const missed = $('res-missed');
  missed.replaceChildren(
    ...outcome.missed.map((id) => {
      const art = c.artefacts.find((a) => a.lines.some((l) => l.clue === id));
      const line = art.lines.find((l) => l.clue === id);
      return h('li', {}, h('strong', { text: c.clues[id].text }), h('small', { text: `In "${art.title}": ${line.note}` }));
    })
  );
  $('res-missed-wrap').hidden = outcome.missed.length === 0;
  show('end');
  $('res-again').focus({ preventScroll: true });
}

// ── Wiring ──────────────────────────────────────────────────────
$('solve-btn').addEventListener('click', startSolve);
$('solve-submit').addEventListener('click', submitStep);
$('solve-next').addEventListener('click', nextStep);
$('res-again').addEventListener('click', () => start(c));
$('res-other').addEventListener('click', () => {
  renderPicker();
  show('pick');
});

renderPicker();
