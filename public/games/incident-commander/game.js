import { INCIDENTS } from './incidents.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';
import * as missionLink from '../core/mission-link.js';
import * as weekly from '../core/weekly.js';

const BEST_KEY = 'lixteam.incidentCommander.best';
const MISSION = missionLink.current('incident-commander');
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), play: $('screen-play'), debrief: $('screen-debrief'), end: $('screen-end') };

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

let incident = null;
let game = null;
let result = null; // the grade, once the incident ends
let debriefIndex = 0;
let debriefScore = { right: 0, certainRight: 0, results: [] };

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo({ top: 0 });
}

// ── Picking ─────────────────────────────────────────────────────
function renderPicker() {
  const best = readBest();
  const list = $('incident-list');
  list.replaceChildren();
  for (const inc of INCIDENTS.filter((x) => weekly.visible('incident-commander', x.id))) {
    const skill = profile.SKILLS.find((s) => s.id === inc.skill);
    const card = h(
      'button',
      { class: 'incident-card', type: 'button' },
      h('h3', { text: inc.title }),
      h('p', { text: inc.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: profile.skillLabel(inc.skill) }),
        h('span', { class: 'chip', text: `${inc.maxTime * inc.minutesPerUnit} min of working time` }),
        best[inc.id] ? h('span', { class: 'chip best', text: `Best: ${best[inc.id].rating} (${best[inc.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(inc));
    list.append(card);
  }
}

// ── Playing ─────────────────────────────────────────────────────
function start(inc) {
  profile.load();
  incident = inc;
  game = engine.newGame(inc);
  result = null;
  $('ic-title').textContent = inc.title;
  $('ic-role').textContent = inc.role;
  const body = $('brief-body');
  body.replaceChildren(...inc.brief.map((p) => h('p', { text: p })));
  $('brief').open = true;
  $('feed').replaceChildren();
  $('end-panel').hidden = true;
  show('play');
  render();
}

function setMeter(name, value) {
  const id = name === 'threat' ? 'threat' : 'disr';
  $(`m-${id}`).textContent = `${value}%`;
  $(`fill-${id}`).style.width = `${value}%`;
  $(`bar-${id}`).setAttribute('aria-valuenow', String(value));
}

function logItem(entry) {
  const cls = ['', entry.kind, entry.kind === 'event' ? entry.severity || '' : ''].join(' ').trim();
  return h('li', { class: cls }, h('time', { text: engine.clock(incident, entry.T) }), h('span', { text: entry.text }));
}

function render() {
  $('ic-clock').textContent = engine.clock(incident, game.T);
  const left = incident.maxTime - game.T;
  $('ic-time-left').textContent = `${left} of ${incident.maxTime} time units left`;
  setMeter('threat', game.threat);
  setMeter('disr', game.disruption);
  document.querySelector('.meter.threat').classList.toggle('hot', game.threat >= 60);

  // Newest first, so the latest news is always at the top.
  $('feed').replaceChildren(
    ...(game.log.length
      ? [...game.log].reverse().map(logItem)
      : [h('li', { class: 'event info' }, h('time', { text: engine.clock(incident, 0) }), h('span', { text: 'Ticket received. Nothing has happened yet: your actions and any new alerts will appear here. Choose your first move below.' }))])
  );

  const facts = Object.values(game.facts);
  $('evidence-panel').hidden = facts.length === 0;
  $('evidence').replaceChildren(...facts.map((f) => h('li', { text: f })));

  renderActions();
}

function renderActions() {
  const wrap = $('actions');
  wrap.replaceChildren();
  if (game.done) return;
  const avail = engine.availableActions(incident, game);
  const groups = [];
  for (const a of avail) {
    let g = groups.find((x) => x.name === a.group);
    if (!g) groups.push((g = { name: a.group, items: [] }));
    g.items.push(a);
  }
  for (const g of groups) {
    const acts = h('div', { class: 'acts' });
    for (const a of g.items) {
      const mins = (a.ends ? 0 : a.cost ?? 1) * incident.minutesPerUnit;
      const btn = h(
        'button',
        { class: a.ends ? 'act finish' : 'act', type: 'button', 'data-action': a.id },
        h('span', {}, h('span', { class: 't', text: a.label }), h('span', { class: 'h', text: a.hint || '' })),
        mins ? h('span', { class: 'cost', text: `${mins} min` }) : null
      );
      btn.addEventListener('click', () => doAction(a.id));
      acts.append(btn);
    }
    wrap.append(h('div', { class: 'group' }, h('h4', { text: g.name }), acts));
  }
}

function doAction(id) {
  const r = engine.perform(incident, game, id);
  if (!r.ok) return;
  $('brief').open = false;
  render();
  if (game.done) return endIncident();
  // Keep the move list where the player is; the feed is a live region and announces itself.
}

function endIncident() {
  result = engine.grade(incident, game);
  const titles = { declared: 'Incident closed', breach: 'The attacker got there first', timeout: 'Time ran out' };
  const texts = {
    declared: 'You declared the incident contained. Before the score, a short debrief: what did the evidence tell you?',
    breach: 'The threat reached 100%. The damage is done. Before the score, a short debrief on what happened.',
    timeout: 'The working time ran out before you closed the incident. Before the score, a short debrief on what happened.',
  };
  $('end-title').textContent = titles[game.outcome];
  $('end-text').textContent = texts[game.outcome];
  $('end-panel').hidden = false;
  $('actions').replaceChildren();
  $('to-debrief').focus({ preventScroll: false });
  $('end-panel').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// ── Debrief ─────────────────────────────────────────────────────
function startDebrief() {
  debriefIndex = 0;
  debriefScore = { right: 0, certainRight: 0, results: [] };
  show('debrief');
  renderQuestion();
}

function renderQuestion() {
  const q = incident.debrief[debriefIndex];
  $('debrief-step').textContent = `Debrief ${debriefIndex + 1} of ${incident.debrief.length}`;
  $('debrief-h').textContent = q.question;
  const box = $('debrief-options');
  box.classList.remove('locked');
  box.replaceChildren(h('legend', { class: 'sr', text: 'Choose an answer' }));
  // Shuffle so the right answer is not always in the same place.
  const order = q.options.map((o, i) => i).sort(() => Math.random() - 0.5);
  for (const i of order) {
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
  const q = incident.debrief[debriefIndex];
  const picked = document.querySelector('input[name="dq"]:checked');
  if (!picked) return;
  const idx = Number(picked.value);
  const opt = q.options[idx];
  const conf = document.querySelector('input[name="dconf"]:checked')?.value || 'fairly';
  const right = opt.correct;

  profile.recordAnswer({ id: q.id, skill: incident.skill, correct: right, confidence: conf, revise: false });
  debriefScore.results.push({ right, conf });
  if (right) {
    debriefScore.right += 1;
    if (conf === 'certain') debriefScore.certainRight += 1;
  }

  const box = $('debrief-options');
  box.classList.add('locked');
  for (const lab of box.querySelectorAll('label')) {
    const o = q.options[Number(lab.dataset.i)];
    if (o.correct) lab.classList.add('right');
    else if (lab.dataset.i === String(idx)) lab.classList.add('wrong');
  }
  const fb = $('debrief-feedback');
  fb.className = `feedback ${right ? 'good' : 'bad'}`;
  $('df-title').textContent = right ? 'Correct' : conf === 'certain' ? 'Not quite, and you were certain' : 'Not quite';
  $('df-explain').textContent = right ? opt.explain : `${q.options.find((o) => o.correct).explain}`;
  $('debrief-next').textContent = debriefIndex + 1 >= incident.debrief.length ? 'See my results' : 'Next question';
  fb.hidden = false;
  $('debrief-submit').hidden = true;
  $('debrief-conf').hidden = true;
  $('debrief-next').focus({ preventScroll: false });
}

function nextQuestion() {
  debriefIndex += 1;
  if (debriefIndex >= incident.debrief.length) return showResults();
  renderQuestion();
  window.scrollTo({ top: 0 });
}

// ── Results ─────────────────────────────────────────────────────
function showResults() {
  let xp = 20 + Math.round(Math.max(0, result.points) / 6);
  xp += debriefScore.right * 15 + debriefScore.certainRight * 5;
  const lv = profile.addXp(xp);
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[incident.id];
  const improved = !prev || result.points > prev.points;
  if (improved) {
    best[incident.id] = { points: result.points, rating: result.rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = incident.title;
  $('res-rating').textContent = result.rating.name;
  $('res-blurb').textContent = result.rating.blurb;
  $('res-points').textContent = String(result.points);
  $('res-evidence').textContent = String(result.facts);
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.` +
    ` Debrief: ${debriefScore.right} of ${incident.debrief.length} right.` +
    (improved && prev ? ' New personal best for this incident.' : '');

  const bd = $('res-breakdown');
  bd.replaceChildren(
    ...result.breakdown.map((b) =>
      h('li', {}, h('span', { text: b.label }), h('span', { class: `pts ${b.points >= 0 ? 'pos' : 'neg'}`, text: `${b.points >= 0 ? '+' : ''}${b.points}` }))
    )
  );

  const missed = $('res-missed');
  missed.replaceChildren(...result.missed.map((a) => h('li', {}, h('strong', { text: a.label }), h('small', { text: a.hint || '' }))));
  $('res-missed-wrap').hidden = result.missed.length === 0;

  $('res-timeline').replaceChildren(...game.log.map(logItem));
  // Campaign: record the result when this was launched as a mission.
  $('mission-result').hidden = true;
  if (MISSION && MISSION.ref === incident.id) {
    // "Overkill" is not in the rating list: it counts as no pass.
    const facts = Object.keys(game.facts).length;
    missionLink.render(
      $('mission-result'),
      missionLink.report(MISSION, {
        points: result.points,
        tier: Math.max(0, incident.ratings.findIndex((r) => r.name === result.rating.name)),
        summary: [
          `Outcome: ${game.outcome === 'declared' ? 'declared contained' : game.outcome === 'breach' ? 'the attacker got there first' : 'ran out of time'}, with threat at ${game.threat}% and business disruption at ${game.disruption}%`,
          `Gathered ${facts} piece${facts === 1 ? '' : 's'} of evidence before acting`,
          `Debrief questions: ${debriefScore.right} of ${incident.debrief.length} right`,
          `Result: ${result.rating.name}`,
        ],
      })
    );
  }
  show('end');
  $('res-again').focus({ preventScroll: true });
}

// ── Wiring ──────────────────────────────────────────────────────
$('to-debrief').addEventListener('click', startDebrief);
$('debrief-submit').addEventListener('click', submitAnswer);
$('debrief-next').addEventListener('click', nextQuestion);
$('res-again').addEventListener('click', () => start(incident));
$('res-other').addEventListener('click', () => {
  renderPicker();
  show('pick');
});

renderPicker();

// Opened from the campaign: go straight to the mission's incident.
if (MISSION) {
  missionLink.applyChrome();
  const target = INCIDENTS.find((x) => x.id === MISSION.ref);
  if (target) start(target);
}
