import { CASES } from './cases.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';
import * as missionLink from '../core/mission-link.js';

const BEST_KEY = 'lixteam.breachRoom.best';
const MISSION = missionLink.current('breach-room');
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), play: $('screen-play'), q: $('screen-q'), end: $('screen-end') };

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

let c = null;
let st = null;
let activePivot = null; // the indicator currently highlighted
let wrongHint = {}; // cardId -> hint shown after a wrong placement
let qIndex = 0;
let answers = {};

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
    const card = h(
      'button',
      { class: 'case-card', type: 'button' },
      h('h3', { text: cs.title }),
      h('p', { text: cs.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: `${cs.cards.length} pieces of evidence` }),
        h('span', { class: 'chip', text: `${cs.stages.length} stages` }),
        h('span', { class: 'chip', text: skill ? skill.name : cs.skill }),
        best[cs.id] ? h('span', { class: 'chip best', text: `Best: ${best[cs.id].rating} (${best[cs.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(cs));
    list.append(card);
  }
}

// ── The board ───────────────────────────────────────────────────
function start(cs) {
  profile.load();
  c = cs;
  st = engine.newGame(cs);
  activePivot = null;
  wrongHint = {};
  answers = {};
  $('case-title').textContent = cs.title;
  const skill = profile.SKILLS.find((s) => s.id === cs.skill);
  $('case-sub').textContent = skill ? skill.name : '';
  $('brief-body').replaceChildren(...cs.brief.map((p) => h('p', { text: p })));
  $('brief').open = true;
  $('pivot-note').textContent = '';
  show('play');
  renderAll();
}

function renderAll() {
  $('n-placed').textContent = String(Object.keys(st.placed).length);
  $('n-total').textContent = `of ${c.cards.length}`;
  $('n-wrong').textContent = String(st.wrong);
  $('n-pivots').textContent = String(st.pivots.length);

  // attack path + what has been uncovered so far
  $('path').replaceChildren(
    ...c.stages.map((s) => {
      const done = st.unlocked.includes(s.id);
      return h('li', { class: done ? 'done' : '', 'aria-label': `${s.name}${done ? ', complete' : ', not complete yet'}` }, s.name, h('small', { text: done ? 'Uncovered' : s.desc }));
    })
  );
  $('uncovered').replaceChildren(
    ...c.stages.filter((s) => st.unlocked.includes(s.id)).map((s) => h('p', {}, h('strong', { text: `${s.name}. ` }), s.story))
  );

  // indicators
  const inds = [...new Set(c.cards.flatMap((x) => x.indicators))].sort();
  $('indicators').replaceChildren(
    ...inds.map((i) => {
      const b = h('button', { class: 'ind', type: 'button', text: i, 'aria-pressed': String(activePivot === i) });
      b.addEventListener('click', () => doPivot(i));
      return b;
    })
  );

  renderCards();

  const all = engine.allPlaced(c, st);
  $('final').hidden = !all;
  if (all) $('final-summary').textContent = c.summary;
}

function renderCards() {
  const hit = activePivot ? new Set(c.cards.filter((x) => x.indicators.includes(activePivot)).map((x) => x.id)) : null;
  const list = $('cards');
  list.classList.toggle('pivoting', !!hit);
  const sorted = [...c.cards].sort((a, b) => a.time.localeCompare(b.time));
  list.replaceChildren(
    ...sorted.map((card) => {
      const placed = st.placed[card.id];
      const li = h('li', { class: `card${placed !== undefined ? ' placed' : ''}${placed === 'noise' ? ' noise' : ''}${hit && hit.has(card.id) ? ' hit' : ''}` });
      li.append(
        h('div', { class: 'card-top' }, h('time', { text: card.time }), h('span', { class: `src ${card.source.toLowerCase()}`, text: card.source })),
        h('p', { class: 'card-text', text: card.text })
      );
      if (card.indicators.length) {
        const mini = h('div', { class: 'mini' });
        for (const i of card.indicators) {
          const b = h('button', { class: 'ind', type: 'button', text: i, 'aria-pressed': String(activePivot === i) });
          b.addEventListener('click', () => doPivot(i));
          mini.append(b);
        }
        li.append(mini);
      }
      if (placed !== undefined) {
        const label = placed === 'noise' ? 'Unrelated noise' : c.stages.find((s) => s.id === placed).name;
        li.append(h('div', { class: 'verdict ok' }, h('b', { text: label }), card.note));
      } else {
        if (wrongHint[card.id]) li.append(h('div', { class: 'verdict no', role: 'status' }, h('b', { text: `Not that one (-${engine.WRONG_COST}). ` }), wrongHint[card.id]));
        const btns = h('div', { class: 'stage-btns', role: 'group', 'aria-label': `Which stage is this ${card.source} evidence from ${card.time}?` });
        for (const s of c.stages) {
          const b = h('button', { type: 'button', text: s.name });
          b.addEventListener('click', () => place(card.id, s.id));
          btns.append(b);
        }
        const nb = h('button', { class: 'noise', type: 'button', text: 'Unrelated noise' });
        nb.addEventListener('click', () => place(card.id, 'noise'));
        btns.append(nb);
        li.append(btns);
      }
      return li;
    })
  );
}

function place(cardId, stageId) {
  const r = engine.assign(c, st, cardId, stageId);
  if (!r.ok) return;
  $('brief').open = false;
  if (r.correct) delete wrongHint[cardId];
  else wrongHint[cardId] = r.hint;
  renderAll();
  if (r.correct && r.done) $('final').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function doPivot(indicator) {
  if (activePivot === indicator) {
    activePivot = null;
    $('pivot-note').textContent = '';
  } else {
    activePivot = indicator;
    const ids = engine.pivot(c, st, indicator);
    const sources = [...new Set(c.cards.filter((x) => ids.includes(x.id)).map((x) => x.source))];
    $('pivot-note').textContent =
      ids.length > 1
        ? `"${indicator}" appears in ${ids.length} cards across ${sources.join(', ')}. Connecting evidence like this is how an investigation is built.`
        : `"${indicator}" only appears once. Not a strong thread to pull.`;
  }
  renderAll();
}

// ── Questions ───────────────────────────────────────────────────
function startQuestions() {
  qIndex = 0;
  answers = {};
  show('q');
  renderQuestion();
}

function renderQuestion() {
  const q = c.questions[qIndex];
  $('q-step').textContent = `Question ${qIndex + 1} of ${c.questions.length}`;
  $('q-h').textContent = q.prompt;
  const box = $('q-options');
  box.classList.remove('locked');
  box.replaceChildren(h('legend', { class: 'sr', text: 'Choose an answer' }));
  for (const o of shuffle(q.options)) {
    const input = h('input', { type: 'radio', name: 'qq', value: o.id });
    input.addEventListener('change', () => ($('q-submit').disabled = false));
    box.append(h('label', { 'data-id': o.id }, input, h('span', { text: o.text })));
  }
  $('q-submit').disabled = true;
  $('q-submit').hidden = false;
  $('q-conf').hidden = false;
  $('q-feedback').hidden = true;
}

function submitQuestion() {
  const q = c.questions[qIndex];
  const picked = document.querySelector('input[name="qq"]:checked')?.value;
  if (!picked) return;
  const conf = document.querySelector('input[name="qconf"]:checked')?.value || 'fairly';
  const opt = q.options.find((o) => o.id === picked);
  answers[q.id] = { option: picked, conf };
  profile.recordAnswer({ id: `br-${c.id}-${q.id}`, skill: c.skill, correct: opt.correct, confidence: conf, revise: false });

  const box = $('q-options');
  box.classList.add('locked');
  for (const lab of box.querySelectorAll('label')) {
    const o = q.options.find((x) => x.id === lab.dataset.id);
    if (o.correct) lab.classList.add('right');
    else if (lab.dataset.id === picked) lab.classList.add('wrong');
  }
  const fb = $('q-feedback');
  fb.className = `feedback ${opt.correct ? 'good' : 'bad'}`;
  $('qf-title').textContent = opt.correct ? 'Correct' : conf === 'certain' ? 'Not quite, and you were certain' : 'Not quite';
  $('qf-explain').textContent = opt.correct ? opt.explain : q.options.find((o) => o.correct).explain;
  $('q-next').textContent = qIndex + 1 >= c.questions.length ? 'See my results' : 'Next question';
  fb.hidden = false;
  $('q-submit').hidden = true;
  $('q-conf').hidden = true;
  $('q-next').focus({ preventScroll: false });
}

function nextQuestion() {
  qIndex += 1;
  if (qIndex >= c.questions.length) return showResults();
  renderQuestion();
  window.scrollTo({ top: 0 });
}

// ── Results ─────────────────────────────────────────────────────
function showResults() {
  const out = engine.grade(c, st, answers);
  const firstTime = c.cards.filter((x) => !st.wrongByCard[x.id]).length;
  let xp = 20 + Math.round(Math.max(0, out.points) / 8) + out.right * 15;
  for (const q of c.questions) {
    const a = answers[q.id];
    if (a && a.conf === 'certain' && engine.isRight(c, q.id, a.option)) xp += 5;
  }
  const lv = profile.addXp(xp);
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[c.id];
  const improved = !prev || out.points > prev.points;
  if (improved) {
    best[c.id] = { points: out.points, rating: out.rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = c.title;
  $('res-rating').textContent = out.rating.name;
  $('res-blurb').textContent = out.rating.blurb;
  $('res-points').textContent = String(out.points);
  $('res-placed').textContent = `${firstTime}/${c.cards.length}`;
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.` +
    ` Questions: ${out.right} of ${c.questions.length} right.` +
    (improved && prev ? ' New personal best for this case.' : '');

  $('res-story').replaceChildren(
    ...c.stages.map((s) => h('li', {}, h('strong', { text: s.name }), s.story)),
    h('li', {}, h('strong', { text: 'In short' }), c.summary)
  );
  $('res-breakdown').replaceChildren(
    ...out.breakdown.map((b) => h('li', {}, h('span', { text: b.label }), h('span', { class: `pts ${b.points > 0 ? 'pos' : b.points < 0 ? 'neg' : 'zero'}`, text: `${b.points >= 0 ? '+' : ''}${b.points}` })))
  );
  // Campaign: record the result when this was launched as a mission.
  $('mission-result').hidden = true;
  if (MISSION && MISSION.ref === c.id) {
    missionLink.render(
      $('mission-result'),
      missionLink.report(MISSION, {
        points: out.points,
        tier: Math.max(0, c.ratings.findIndex((r) => r.name === out.rating.name)),
        summary: [
          `Placed ${firstTime} of ${c.cards.length} pieces of evidence correctly first time`,
          `Pivoted on ${st.pivots.length} indicator${st.pivots.length === 1 ? '' : 's'} to connect evidence`,
          `Root cause, prevention and last-chance questions: ${out.right} of ${c.questions.length} right`,
          `Result: ${out.rating.name}`,
        ],
      })
    );
  }
  show('end');
  $('res-again').focus({ preventScroll: true });
}

// ── Wiring ──────────────────────────────────────────────────────
$('to-questions').addEventListener('click', startQuestions);
$('q-submit').addEventListener('click', submitQuestion);
$('q-next').addEventListener('click', nextQuestion);
$('res-again').addEventListener('click', () => start(c));
$('res-other').addEventListener('click', () => {
  renderPicker();
  show('pick');
});

renderPicker();

// Opened from the campaign: go straight to the mission's case.
if (MISSION) {
  missionLink.applyChrome();
  const target = CASES.find((x) => x.id === MISSION.ref);
  if (target) start(target);
}
