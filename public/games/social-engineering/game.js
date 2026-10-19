import { SCENARIOS } from './scenarios.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';
import * as missionLink from '../core/mission-link.js';

const BEST_KEY = 'lixteam.socialEngineering.best';
const MISSION = missionLink.current('social-engineering');
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), play: $('screen-play'), debrief: $('screen-debrief'), end: $('screen-end') };

// People take a moment to reply. That pause is decoration, so it is skipped
// for anyone who prefers reduced motion (and with ?fast, used for testing).
const INSTANT = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fast');
const wait = (ms) => (INSTANT ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

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
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let sc = null;
let run = null;
let token = 0; // bumped on restart so a slow playback cannot write into a new game
let outcome = null;
let debriefAnswer = null;

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo({ top: 0 });
}

// ── Picking ─────────────────────────────────────────────────────
function renderPicker() {
  const best = readBest();
  const list = $('scenario-list');
  list.replaceChildren();
  for (const s of SCENARIOS) {
    const skill = profile.SKILLS.find((x) => x.id === s.skill);
    const card = h(
      'button',
      { class: 'scenario-card', type: 'button' },
      h('h3', { text: s.title }),
      h('p', { text: s.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: s.channel }),
        h('span', { class: 'chip', text: profile.skillLabel(s.skill) }),
        best[s.id] ? h('span', { class: 'chip best', text: `Best: ${best[s.id].rating} (${best[s.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(s));
    list.append(card);
  }
}

// ── The conversation ────────────────────────────────────────────
function start(scenario) {
  profile.load();
  sc = scenario;
  run = engine.newRun(sc);
  token += 1;
  $('sc-title').textContent = sc.title;
  $('sc-channel').textContent = sc.channel;
  $('chat').replaceChildren(h('div', { class: 'bubble narr setting', text: sc.setting }));
  $('replies').replaceChildren();
  show('play');
  renderMeters();
  playNode(token);
}

function renderMeters() {
  $('m-risk').textContent = `${run.risk}%`;
  $('fill-risk').style.width = `${run.risk}%`;
  $('bar-risk').setAttribute('aria-valuenow', String(run.risk));
  $('m-rel').textContent = `${run.rel}%`;
  $('fill-rel').style.width = `${run.rel}%`;
  $('bar-rel').setAttribute('aria-valuenow', String(run.rel));
  document.querySelector('.meter.risk').classList.toggle('hot', run.risk >= 60);
}

function bubble(line, mood) {
  if (line.who === 'narr') return h('div', { class: 'bubble narr', text: line.text });
  const who = sc.cast[line.who];
  return h('div', { class: `bubble other ${mood || 'calm'}` }, h('span', { class: 'who', text: who ? who.name : '' }), line.text);
}

function scrollToEnd() {
  const last = $('chat').lastElementChild;
  if (last) last.scrollIntoView({ block: 'nearest', behavior: INSTANT ? 'auto' : 'smooth' });
}

async function playNode(myToken) {
  const node = engine.currentNode(sc, run);
  $('replies').replaceChildren();
  for (const line of node.lines || []) {
    if (myToken !== token) return;
    if (line.who !== 'narr' && !INSTANT) {
      const typing = h('div', { class: 'bubble other typing' }, h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));
      $('chat').append(typing);
      scrollToEnd();
      await wait(Math.min(1400, 450 + line.text.length * 9));
      typing.remove();
    } else {
      await wait(250);
    }
    if (myToken !== token) return;
    $('chat').append(bubble(line, node.mood));
    scrollToEnd();
  }
  if (myToken !== token) return;

  const replies = $('replies');
  if (node.end) {
    const card = h(
      'div',
      { class: `ending ${node.end.outcome}` },
      h('h3', { text: node.end.title }),
      h('p', { text: node.end.text })
    );
    const btn = h('button', { class: 'btn primary big', type: 'button', text: 'Continue to the debrief' });
    btn.addEventListener('click', startDebrief);
    card.append(btn);
    $('chat').append(card);
    scrollToEnd();
    btn.focus({ preventScroll: true });
    return;
  }
  if (node.continue) {
    const btn = h('button', { class: 'reply', type: 'button', text: 'Continue' });
    btn.addEventListener('click', () => {
      engine.advance(sc, run);
      playNode(myToken);
    });
    replies.append(btn);
    btn.focus({ preventScroll: true });
    return;
  }
  // Shuffle so the safest reply is not always in the same place.
  for (const c of shuffle(node.choices)) {
    const btn = h('button', { class: 'reply', type: 'button', text: c.label });
    btn.addEventListener('click', () => pick(c, myToken));
    replies.append(btn);
  }
  replies.firstElementChild?.focus({ preventScroll: true });
}

function pick(choice, myToken) {
  if (myToken !== token) return;
  $('replies').replaceChildren();
  $('chat').append(h('div', { class: 'bubble you', text: choice.label }));
  engine.choose(sc, run, choice.id);
  renderMeters();
  scrollToEnd();
  playNode(myToken);
}

// ── Debrief ─────────────────────────────────────────────────────
function startDebrief() {
  show('debrief');
  const q = sc.question;
  $('debrief-h').textContent = q.text;
  const box = $('debrief-options');
  box.classList.remove('locked');
  box.replaceChildren(h('legend', { class: 'sr', text: 'Choose an answer' }));
  for (const i of shuffle(q.options.map((o, idx) => idx))) {
    const lab = h('label', { 'data-i': String(i) }, h('input', { type: 'radio', name: 'dq', value: String(i) }), h('span', { text: q.options[i].text }));
    lab.firstChild.addEventListener('change', () => ($('debrief-submit').disabled = false));
    box.append(lab);
  }
  $('debrief-submit').disabled = true;
  $('debrief-submit').hidden = false;
  $('debrief-conf').hidden = false;
  $('debrief-feedback').hidden = true;
}

function submitAnswer() {
  const q = sc.question;
  const picked = document.querySelector('input[name="dq"]:checked');
  if (!picked) return;
  const idx = Number(picked.value);
  const opt = q.options[idx];
  const conf = document.querySelector('input[name="dconf"]:checked')?.value || 'fairly';
  debriefAnswer = { right: opt.correct, conf };
  profile.recordAnswer({ id: `se-${sc.id}-tactic`, skill: sc.skill, correct: opt.correct, confidence: conf, revise: false });

  const box = $('debrief-options');
  box.classList.add('locked');
  for (const lab of box.querySelectorAll('label')) {
    const o = q.options[Number(lab.dataset.i)];
    if (o.correct) lab.classList.add('right');
    else if (lab.dataset.i === String(idx)) lab.classList.add('wrong');
  }
  const fb = $('debrief-feedback');
  fb.className = `feedback ${opt.correct ? 'good' : 'bad'}`;
  $('df-title').textContent = opt.correct ? 'Correct' : conf === 'certain' ? 'Not quite, and you were certain' : 'Not quite';
  $('df-explain').textContent = opt.correct ? opt.explain : q.options.find((o) => o.correct).explain;
  fb.hidden = false;
  $('debrief-submit').hidden = true;
  $('debrief-conf').hidden = true;
  $('debrief-next').focus({ preventScroll: false });
}

// ── Results ─────────────────────────────────────────────────────
const TAG_LABEL = { good: 'Smart', ok: 'Okay', bad: 'Risky' };

function showResults() {
  outcome = engine.grade(sc, run, debriefAnswer || {});
  const end = engine.currentNode(sc, run).end;
  let xp = 20 + Math.round(Math.max(0, outcome.points) / 6);
  if (debriefAnswer?.right) xp += 15 + (debriefAnswer.conf === 'certain' ? 5 : 0);
  const lv = profile.addXp(xp);
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[sc.id];
  const improved = !prev || outcome.points > prev.points;
  if (improved) {
    best[sc.id] = { points: outcome.points, rating: outcome.rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = sc.title;
  $('res-title').textContent = end.title;
  $('res-text').textContent = outcome.rating.blurb;
  $('res-rating').textContent = outcome.rating.name;
  $('res-points').textContent = String(outcome.points);
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.` +
    (improved && prev ? ' New personal best for this scenario.' : '');

  $('res-decisions').replaceChildren(
    ...engine.taken(sc, run).map(({ choice }) =>
      h('li', {}, h('span', { class: `tag ${choice.tag}`, text: TAG_LABEL[choice.tag] }), h('span', { class: 'said', text: `You: ${choice.label}` }), h('span', { class: 'coach', text: choice.coach }))
    )
  );
  $('res-ideal').textContent = sc.ideal;
  $('res-tactics').replaceChildren(...sc.tactics.map((t) => h('li', {}, h('strong', { text: t.name }), h('span', { text: t.desc }))));
  $('res-breakdown').replaceChildren(
    ...outcome.breakdown.map((b) =>
      h('li', {}, h('span', { text: b.label }), h('span', { class: `pts ${b.points >= 0 ? 'pos' : 'neg'}`, text: `${b.points >= 0 ? '+' : ''}${b.points}` }))
    )
  );
  // Campaign: record the result when this was launched as a mission.
  $('mission-result').hidden = true;
  if (MISSION && MISSION.ref === sc.id) {
    missionLink.render(
      $('mission-result'),
      missionLink.report(MISSION, {
        points: outcome.points,
        tier: Math.max(0, sc.ratings.findIndex((r) => r.name === outcome.rating.name)),
        summary: [
          `Ending: ${end.title}`,
          run.flags.verified ? 'Verified the request through a channel I controlled' : 'Did not verify the request independently',
          run.flags.reported ? 'Reported it to the right people' : 'Did not report it',
          debriefAnswer && debriefAnswer.right ? 'Identified the manipulation tactic' : 'Missed the manipulation tactic',
          `Result: ${outcome.rating.name}`,
        ],
      })
    );
  }
  show('end');
  $('res-again').focus({ preventScroll: true });
}

// ── Wiring ──────────────────────────────────────────────────────
$('debrief-submit').addEventListener('click', submitAnswer);
$('debrief-next').addEventListener('click', showResults);
$('res-again').addEventListener('click', () => start(sc));
$('res-other').addEventListener('click', () => {
  token += 1;
  renderPicker();
  show('pick');
});

renderPicker();

// Opened from the campaign: go straight to the mission's scenario.
if (MISSION) {
  missionLink.applyChrome();
  const target = SCENARIOS.find((x) => x.id === MISSION.ref);
  if (target) start(target);
}
