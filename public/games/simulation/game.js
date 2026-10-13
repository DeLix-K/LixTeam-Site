import { SIMS } from './sims.js';
import * as engine from './engine.js';
import * as profile from '../core/profile.js';
import * as missionLink from '../core/mission-link.js';

const BEST_KEY = 'lixteam.simulation.best';
const MISSION = missionLink.current('simulation');
const $ = (id) => document.getElementById(id);
const screens = { pick: $('screen-pick'), stage: $('screen-stage'), end: $('screen-end') };

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

let sim = null;
let st = null;
let details = {}; // stageId -> what happened, for the summary and report
let pending = null; // the current stage's result, waiting for Continue
let readAnswer = null; // reads the player's input for the current stage

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo({ top: 0 });
}

// ── Picking ─────────────────────────────────────────────────────
function renderPicker() {
  const best = readBest();
  const list = $('sim-list');
  list.replaceChildren();
  for (const s of SIMS) {
    const skill = profile.SKILLS.find((x) => x.id === s.skill);
    const card = h(
      'button',
      { class: 'sim-card', type: 'button' },
      h('h3', { text: s.title }),
      h('p', { text: s.blurb }),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'chip', text: `${s.stages.length} stages` }),
        h('span', { class: 'chip', text: `About ${s.minutes} minutes` }),
        h('span', { class: 'chip', text: skill ? skill.name : s.skill }),
        best[s.id] ? h('span', { class: 'chip best', text: `Best: ${best[s.id].rating} (${best[s.id].points})` }) : null
      )
    );
    card.addEventListener('click', () => start(s));
    list.append(card);
  }
}

// ── Stages ──────────────────────────────────────────────────────
function start(s) {
  profile.load();
  sim = s;
  st = engine.newSim();
  details = {};
  $('brief-body').replaceChildren(...s.brief.map((p) => h('p', { text: p })));
  $('brief').open = true;
  show('stage');
  renderStage();
}

function renderStage() {
  const stage = sim.stages[st.stage];
  pending = null;
  $('stage-count').textContent = `Stage ${st.stage + 1} of ${sim.stages.length}`;
  $('stage-bar').style.width = `${(st.stage / sim.stages.length) * 100}%`;
  $('stage-title').textContent = stage.title;
  $('stage-intro').textContent = stage.intro;
  $('stage-notes').replaceChildren(...engine.notes(stage, st.flags).map((t) => h('p', { text: t })));
  $('stage-msg').textContent = '';
  $('stage-submit').hidden = false;
  $('stage-submit').disabled = true;
  $('stage-next').hidden = true;
  $('stage-body').replaceChildren();
  if (st.stage > 0) $('brief').open = false;
  ({ triage: buildTriage, evidence: buildEvidence, decision: buildDecision, report: buildReport })[stage.type](stage);
  $('stage-title').scrollIntoView({ block: 'start' });
}

function finishStage(result, msg) {
  pending = result;
  $('stage-submit').hidden = true;
  $('stage-next').hidden = false;
  $('stage-next').textContent = st.stage + 1 >= sim.stages.length ? 'See my results' : 'Continue';
  $('stage-msg').textContent = msg;
  $('stage-next').focus({ preventScroll: false });
}

// ── Triage ──────────────────────────────────────────────────────
function buildTriage(stage) {
  const alerts = engine.visible(stage.alerts, st.flags);
  const body = $('stage-body');
  const list = h('div', { class: 'cards' });
  const cards = {};
  for (const a of alerts) {
    const fs = h('fieldset', { class: 'triage-opts' }, h('legend', { text: `Decision for the ${a.source} alert at ${a.time}` }));
    for (const act of engine.TRIAGE_ACTIONS) {
      const input = h('input', { type: 'radio', name: `t-${a.id}`, value: act.id });
      input.addEventListener('change', () => ($('stage-submit').disabled = !alerts.every((x) => body.querySelector(`input[name="t-${x.id}"]:checked`))));
      fs.append(h('label', {}, input, h('span', { text: act.label })));
    }
    const card = h('div', { class: 'card' }, h('div', { class: 'card-top' }, h('time', { text: a.time }), h('span', { class: 'src', text: a.source })), h('p', { class: 'card-text', text: a.text }), fs);
    cards[a.id] = card;
    list.append(card);
  }
  body.append(list);
  $('stage-submit').textContent = 'Submit my triage';
  $('stage-submit').onclick = () => {
    const answers = Object.fromEntries(alerts.map((a) => [a.id, body.querySelector(`input[name="t-${a.id}"]:checked`).value]));
    const res = engine.scoreTriage(stage, st.flags, answers);
    for (const d of res.detail) {
      const card = cards[d.id];
      card.classList.add(d.right ? 'right' : 'wrong');
      for (const i of card.querySelectorAll('input')) i.disabled = true;
      const label = engine.TRIAGE_ACTIONS.find((x) => x.id === d.answer).label;
      card.append(h('div', { class: `verdict ${d.right ? 'ok' : 'no'}` }, h('b', { text: d.right ? 'Right call' : `Better call: ${label}` }), d.explain));
    }
    details.triage = { right: res.detail.filter((d) => d.right).length, total: res.detail.length };
    finishStage(res, `Triage: ${details.triage.right} of ${details.triage.total} handled correctly (+${res.score}).`);
  };
}

// ── Evidence ────────────────────────────────────────────────────
function buildEvidence(stage) {
  const body = $('stage-body');
  const flagged = [];
  const counter = h('p', { class: 'counter', text: 'Tap a line to flag it. You have flagged 0 lines.' });
  body.append(counter);
  const items = {};
  for (const art of stage.artefacts) {
    const ul = h('ul', { class: 'lines' });
    for (const line of engine.visible(art.lines, st.flags)) {
      const btn = h('button', { class: 'line', type: 'button', text: line.text, 'aria-label': `Flag this line: ${line.text}` });
      const li = h('li', {}, btn);
      items[line.id] = { li, btn, line };
      btn.addEventListener('click', () => {
        if (flagged.includes(line.id)) return;
        flagged.push(line.id);
        btn.disabled = true;
        const isClue = line.type === 'clue';
        li.classList.add(isClue ? 'is-clue' : 'is-no');
        const note = h('div', { class: `note ${isClue ? 'clue' : 'no'}`, tabindex: '-1' }, h('b', { text: isClue ? 'Clue found' : `Not a clue (-${engine.EVIDENCE.falseFlag})` }), line.note);
        li.append(note);
        note.focus({ preventScroll: true });
        counter.textContent = `You have flagged ${flagged.length} line${flagged.length === 1 ? '' : 's'}.`;
        $('stage-submit').disabled = false;
      });
      ul.append(li);
    }
    body.append(h('div', { class: 'art' }, h('h3', { text: art.title }), ul));
  }
  $('stage-submit').textContent = 'Finish investigating';
  $('stage-submit').onclick = () => {
    const res = engine.scoreEvidence(stage, st.flags, flagged);
    for (const { btn } of Object.values(items)) btn.disabled = true;
    for (const l of res.missed) {
      const it = items[l.id];
      it.li.classList.add('is-clue');
      it.li.append(h('div', { class: 'note no' }, h('b', { text: 'You missed this clue' }), l.note));
    }
    details.evidence = { found: res.found.length, total: res.found.length + res.missed.length, wrong: res.wrong };
    finishStage(res, `Evidence: ${res.found.length} of ${details.evidence.total} clues found, ${res.wrong} wrong flag${res.wrong === 1 ? '' : 's'} (+${res.score}).`);
  };
}

// ── Decisions ───────────────────────────────────────────────────
function buildDecision(stage) {
  const body = $('stage-body');
  const opts = engine.visible(stage.options, st.flags);
  body.append(h('p', { class: 'stage-intro', text: stage.prompt }));
  const fs = h('fieldset', { class: 'options' }, h('legend', { text: stage.prompt }));
  const labels = {};
  for (const o of shuffle(opts)) {
    const input = h('input', { type: 'radio', name: 'dec', value: o.id });
    input.addEventListener('change', () => ($('stage-submit').disabled = false));
    const lab = h('label', {}, input, h('span', { class: 'box', text: o.text }));
    labels[o.id] = lab;
    fs.append(lab);
  }
  body.append(fs);
  $('stage-submit').textContent = 'Confirm my decision';
  $('stage-submit').onclick = () => {
    const id = body.querySelector('input[name="dec"]:checked').value;
    const res = engine.scoreDecision(stage, st.flags, id);
    for (const i of body.querySelectorAll('input')) i.disabled = true;
    for (const o of opts) {
      if (o.quality === 3) labels[o.id].classList.add('right');
      else if (o.id === id) labels[o.id].classList.add('wrong');
    }
    body.append(h('div', { class: 'consequence' }, h('b', { text: res.option.quality === 3 ? 'The strongest choice' : 'What happens' }), res.option.consequence));
    details[stage.id] = { option: res.option.text, quality: res.option.quality };
    finishStage(res, `${res.score} of ${res.max} points.`);
  };
}

// ── Report ──────────────────────────────────────────────────────
function buildReport(stage) {
  const body = $('stage-body');
  const ss = engine.visible(stage.statements, st.flags);
  const aa = engine.visible(stage.actions, st.flags);
  const group = (title, items, name) => {
    const fs = h('fieldset', { class: 'options' }, h('legend', { text: title }));
    const labels = {};
    for (const it of shuffle(items)) {
      const input = h('input', { type: 'checkbox', name, value: it.id });
      input.addEventListener('change', () => ($('stage-submit').disabled = !body.querySelector('input:checked')));
      const lab = h('label', {}, input, h('span', { class: 'box', text: it.text }));
      labels[it.id] = lab;
      fs.append(lab);
    }
    body.append(h('p', { class: 'group-title', text: title }), fs);
    return labels;
  };
  const sLabels = group('Findings: what the evidence shows', ss, 'st');
  const aLabels = group('Recommendations', aa, 'ac');
  $('stage-submit').textContent = 'Submit my report';
  $('stage-submit').onclick = () => {
    const sIds = [...body.querySelectorAll('input[name="st"]:checked')].map((i) => i.value);
    const aIds = [...body.querySelectorAll('input[name="ac"]:checked')].map((i) => i.value);
    const res = engine.scoreReport(stage, st.flags, sIds, aIds);
    for (const i of body.querySelectorAll('input')) i.disabled = true;
    const mark = (item, labels) => {
      const lab = labels[item.id];
      const good = item.correct;
      if (item.picked && good) lab.classList.add('right');
      else if (item.picked && !good) lab.classList.add('wrong');
      else if (!item.picked && good) lab.classList.add('right');
      const tag = item.picked ? (good ? 'Included, and right.' : 'Included, but not supported: it cost you points.') : good ? 'You left this out. It belonged in the report.' : 'Correctly left out.';
      lab.append(h('span', { class: 'why' }, `${tag} ${item.why}`));
    };
    res.statements.forEach((s) => mark(s, sLabels));
    res.actions.forEach((a) => mark(a, aLabels));
    details.report = {
      text: engine.reportText(sim, stage, res),
      accurate: res.statements.filter((s) => s.picked && s.correct).length + res.actions.filter((a) => a.picked && a.correct).length,
      unsupported: res.statements.filter((s) => s.picked && !s.correct).length + res.actions.filter((a) => a.picked && !a.correct).length,
    };
    finishStage(res, `Report: ${res.score} of ${res.max} points.`);
  };
}

function next() {
  const stage = sim.stages[st.stage];
  const res = pending;
  engine.completeStage(sim, st, { score: res.score, max: res.max, set: res.set });
  if (st.done) return showResults();
  renderStage();
}

// ── Results ─────────────────────────────────────────────────────
function showResults() {
  const t = engine.totals(st);
  const rating = sim.ratings[t.tier];
  const xp = 20 + Math.round(t.points / 8);
  const lv = profile.addXp(xp);
  profile.recordAnswer({ id: `sim-${sim.id}`, skill: sim.skill, correct: t.tier >= 2, confidence: 'fairly', revise: false });
  profile.noteRoundPlayed();

  const best = readBest();
  const prev = best[sim.id];
  const improved = !prev || t.points > prev.points;
  if (improved) {
    best[sim.id] = { points: t.points, rating: rating.name };
    writeBest(best);
  }

  $('res-eyebrow').textContent = sim.title;
  $('res-rating').textContent = rating.name;
  $('res-blurb').textContent = rating.blurb;
  $('res-points').textContent = String(t.points);
  $('res-of').textContent = `of ${t.max}`;
  $('res-pct').textContent = `${Math.round(t.perf * 100)}%`;
  $('res-xp').textContent = `+${xp}`;
  const info = profile.levelInfo(lv.xp);
  $('res-level').textContent = `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Practice level ${info.level}. `}${info.to - lv.xp} XP to level ${info.level + 1}.${improved && prev ? ' New personal best for this simulation.' : ''}`;
  $('res-stages').replaceChildren(
    ...st.results.map((r) => {
      const stage = sim.stages.find((s) => s.id === r.stageId);
      return h('li', {}, h('span', { text: stage.title }), h('span', { class: 'pts', text: `${r.score} / ${r.max}` }));
    })
  );
  $('res-report').textContent = details.report ? details.report.text : '';

  // Campaign: record the result when this was launched as a mission.
  $('mission-result').hidden = true;
  if (MISSION && MISSION.ref === sim.id) {
    const d = details;
    missionLink.render(
      $('mission-result'),
      missionLink.report(MISSION, {
        points: t.points,
        tier: t.tier,
        perf: t.perf,
        summary: [
          `Triage: ${d.triage.right} of ${d.triage.total} alerts handled correctly`,
          `Evidence: found ${d.evidence.found} of ${d.evidence.total} clues with ${d.evidence.wrong} wrong flag${d.evidence.wrong === 1 ? '' : 's'}`,
          `Containment: ${d.contain.option}`,
          `Report: ${d.report.accurate} supported point${d.report.accurate === 1 ? '' : 's'}, ${d.report.unsupported} unsupported claim${d.report.unsupported === 1 ? '' : 's'}`,
          `Result: ${rating.name} (${Math.round(t.perf * 100)}% of full marks)`,
        ],
      })
    );
  }
  $('copy-status').textContent = '';
  show('end');
  $('res-again').focus({ preventScroll: true });
}

async function copyReport() {
  const text = details.report ? details.report.text : '';
  try {
    await navigator.clipboard.writeText(text);
    $('copy-status').textContent = 'Report copied.';
  } catch {
    $('copy-status').textContent = 'Could not copy automatically: select the report text above and copy it.';
  }
}

// ── Wiring ──────────────────────────────────────────────────────
$('stage-next').addEventListener('click', next);
$('copy-report').addEventListener('click', copyReport);
$('res-again').addEventListener('click', () => start(sim));
$('res-other').addEventListener('click', () => {
  renderPicker();
  show('pick');
});

renderPicker();

// Opened from the campaign: go straight to the mission's simulation.
if (MISSION) {
  missionLink.applyChrome();
  const target = SIMS.find((x) => x.id === MISSION.ref);
  if (target) start(target);
}
