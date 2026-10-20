// The SOC workspace: the page around the simulation engine. Everything on screen is built with
// textContent; nothing from the scenario data is parsed as HTML.

import * as E from './engine.js';
import { SOC_INVOICE } from './scenarios/soc-invoice.js';
import { DFIR_LAPTOP } from './scenarios/dfir-laptop.js';
import { medalIcon } from '../core/art.js';
import { MEDALS } from '../core/missions.js';
import * as streak from '../core/streak.js';
import * as missionLink from '../core/mission-link.js';

const SCENARIOS = [SOC_INVOICE, DFIR_LAPTOP];
const MISSION = missionLink.current('workspace');
const BEST_KEY = 'lixteam.workspace.best.v1';
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}
function sv(tag, props = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
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
    /* the best result just is not remembered */
  }
}

// ── State ───────────────────────────────────────────────────────
let scn = null;
let st = null;
let ui = null;
let toastTimers = [];

const freshUi = () => ({
  view: 'alerts',
  alertId: null,
  eventId: null,
  query: '',
  from: '',
  to: '',
  sev: [],
  newest: false,
  results: null,
  resultsAt: null,
  treeHost: scn.ui.treeHost,
  entityId: null,
  edgeKey: null,
  respond: {},
  lastResult: null,
  seenAlerts: new Set(),
  report: Object.fromEntries(scn.report.map((f) => [f.id, f.kind === 'set' ? [] : ''])),
  closeReason: 'Explained by context',
});

const KIND = { user: 'Account', host: 'Machine', file: 'File', ip: 'Address', domain: 'Domain', mail: 'Sender' };
const SEV_LABEL = { info: 'Info', low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const NAV_ALL = {
  alerts: { label: 'Alerts' },
  brief: { label: 'Case brief' },
  logs: { label: 'Log search' },
  entities: { label: 'People & machines' },
  tree: { label: 'Process tree' },
  map: { label: 'Network map' },
  respond: { label: 'Respond' },
  case: { label: 'Case file', narrow: true },
  report: { label: 'Report' },
};
// Each scenario says which tools its workspace has, in order, and may rename them.
const navItems = () => scn.ui.nav.map((id, i) => ({ id, n: String(i + 1).padStart(2, '0'), label: (scn.ui.labels || {})[id] || NAV_ALL[id].label, narrow: !!NAV_ALL[id].narrow }));
const tipFor = (view, fallback) => tip((scn.ui.tips || {})[view] || fallback);
const entity = (id) => E.entityById(scn, id);
const shiftOver = () => st.clock >= scn.horizon;
const openAlerts = () => E.alertsNow(scn, st).filter((a) => !st.alerts[a.id]);

// ── Screens ─────────────────────────────────────────────────────
function show(name) {
  $('app').hidden = !(name === 'pick' || name === 'brief');
  $('screen-pick').hidden = name !== 'pick';
  $('screen-brief').hidden = name !== 'brief';
  $('screen-ws').hidden = name !== 'ws';
  $('app2').hidden = name !== 'end';
  document.body.classList.toggle('in-ws', name === 'ws');
  window.scrollTo(0, 0);
}

function renderPicker() {
  const list = $('assignment-list');
  list.replaceChildren();
  const best = readBest();
  for (const s of SCENARIOS) {
    const b = best[s.id];
    const card = h('article', { class: 'assign-card' }, h('div', { class: 'assign-top' }, h('span', { class: 'chip' }, s.pathLabel), b ? h('span', { class: 'chip best' }, `Best: ${MEDALS[b.tier] || 'No medal'} · ${b.total}/100`) : h('span', { class: 'chip' }, 'New')), h('h3', { text: s.title }), h('p', { text: s.blurb }), h('button', { class: 'btn primary', type: 'button', onclick: () => openBrief(s) }, b ? 'Play again' : 'Take the shift'));
    list.append(card);
  }
}

let chosen = null;
function openBrief(s) {
  chosen = s;
  $('brief-h').textContent = s.title;
  const body = $('brief-body');
  body.replaceChildren(...s.brief.map((p) => h('p', { text: p })));
  $('toolkit').replaceChildren(...s.ui.toolkit.map(([a, b]) => h('li', {}, h('strong', { text: a }), ' ', b)));
  show('brief');
}

function startShift() {
  scn = chosen || SCENARIOS[0];
  st = E.newRun(scn);
  ui = freshUi();
  for (const a of E.alertsNow(scn, st)) ui.seenAlerts.add(a.id);
  $('ws-name').textContent = scn.ui.name;
  $('ws-sub').textContent = scn.title;
  buildRail();
  show('ws');
  setView(scn.ui.nav[0]);
  refresh();
}

// ── Chrome around the stage ─────────────────────────────────────
function buildRail() {
  const rail = $('rail');
  rail.replaceChildren();
  for (const n of navItems()) {
    rail.append(
      h('button', { class: `rail-item${n.narrow ? ' only-narrow' : ''}`, type: 'button', 'data-view': n.id, onclick: () => setView(n.id) }, h('span', { class: 'rail-n', text: n.n }), h('span', { class: 'rail-l', text: n.label }), h('span', { class: 'rail-badge', hidden: true }))
    );
  }
}

function updateChrome() {
  $('ws-clock').textContent = E.clockText(st.clock);
  const open = openAlerts().length;
  $('ws-open').textContent = String(open);
  $('ws-open').parentElement.hidden = scn.alerts.length === 0;
  $('ws-pins').textContent = String(st.pins.length);
  const dis = Math.min(40, st.disruption);
  $('ws-dis').style.width = `${(dis / 40) * 100}%`;
  $('ws-dis').parentElement.setAttribute('aria-valuenow', String(dis));
  $('ws-dis').className = dis >= 20 ? 'hot' : dis >= 8 ? 'warm' : '';
  $('ws-clock').parentElement.classList.toggle('late', st.clock >= scn.horizon - 30);
  const over = shiftOver();
  for (const b of $('rail').children) {
    const id = b.dataset.view;
    b.setAttribute('aria-current', id === ui.view ? 'page' : 'false');
    b.disabled = over && !['report', 'case'].includes(id);
    const badge = b.querySelector('.rail-badge');
    const count = id === 'alerts' ? open : id === 'case' ? st.pins.length : 0;
    badge.hidden = !count;
    badge.textContent = String(count);
    badge.classList.toggle('alarm', id === 'alerts' && open > 0);
  }
  $('ws-report-btn').onclick = () => setView('report');
}

function toast(text, kind = '') {
  const t = h('div', { class: `toast ${kind}`, text });
  $('toasts').append(t);
  toastTimers.push(setTimeout(() => t.remove(), 7000));
}

// Called after anything that may have moved the clock or changed the case.
function refresh({ keepView = false } = {}) {
  for (const a of E.alertsNow(scn, st)) {
    if (!ui.seenAlerts.has(a.id)) {
      ui.seenAlerts.add(a.id);
      toast(`New ${a.sev} alert: ${a.title}`, 'alarm');
    }
  }
  if (shiftOver() && !['report', 'case'].includes(ui.view)) {
    toast('The shift is over. File your report.', 'alarm');
    ui.view = 'report';
  }
  updateChrome();
  renderCaseFile($('casefile'));
  if (!keepView) renderView();
}

function setView(v) {
  ui.view = v;
  refresh();
  const first = document.querySelector('.ws-bar');
  if (first && window.scrollY > first.offsetTop + 200) window.scrollTo(0, 0);
}

function renderView() {
  const keep = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.key : null;
  const stage = $('view');
  const fn = { alerts: viewAlerts, brief: viewBrief, logs: viewLogs, entities: viewEntities, tree: viewTree, map: viewMap, respond: viewRespond, case: viewCase, report: viewReport }[ui.view];
  stage.replaceChildren(fn());
  if (keep) {
    const again = stage.querySelector(`[data-key="${CSS.escape(keep)}"]`);
    if (again) again.focus({ preventScroll: true });
  }
}

// ── Small pieces ────────────────────────────────────────────────
const sevChip = (sev) => h('span', { class: `sev sev-${sev}`, text: SEV_LABEL[sev] || sev });
const tip = (text) => h('p', { class: 'tip', text });
const timeText = (t) => E.clockText(t);

function eventRow(e) {
  const pinned = st.pins.includes(e.id);
  return h(
    'button',
    { class: `erow${ui.eventId === e.id ? ' sel' : ''}${pinned ? ' pinned' : ''}${e.synthetic ? ' mine' : ''}`, type: 'button', 'data-key': `row-${e.id}`, 'aria-pressed': ui.eventId === e.id ? 'true' : 'false', onclick: () => selectEvent(e.id) },
    h('time', { text: timeText(e.t) }),
    sevChip(e.sev),
    h('span', { class: 'etype', text: e.type }),
    h('span', { class: 'esum', text: e.summary }),
    h('span', { class: 'ewho', text: [e.host, e.user].filter(Boolean).join(' · ') }),
    pinned ? h('span', { class: 'pinmark', text: 'Pinned', 'aria-label': 'Pinned' }) : null
  );
}

// On a phone the detail sits below the list, so bring it into view after a choice.
function toDetail() {
  const d = document.querySelector('.col-detail');
  if (d && window.innerWidth < 900) d.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function selectEvent(id) {
  ui.eventId = ui.eventId === id ? null : id;
  renderView();
  const insp = document.querySelector('.inspector');
  if (insp && ui.eventId && window.innerWidth < 900) insp.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function pivotSearch(q) {
  ui.query = q;
  ui.from = '';
  ui.to = '';
  ui.sev = [];
  runSearch();
  ui.view = 'logs';
  refresh();
}

function runSearch() {
  const f = {};
  const from = E.parseClock(ui.from);
  const to = E.parseClock(ui.to);
  if (from !== null) f.from = from;
  if (to !== null) f.to = to;
  if (ui.sev.length) f.sev = ui.sev;
  ui.results = E.search(scn, st, ui.query, f);
  ui.resultsAt = st.clock;
  ui.eventId = null;
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
function inspector() {
  const e = ui.eventId ? E.eventById(scn, st, ui.eventId) : null;
  if (!e) return null;
  const f = e.fields || {};
  const pinned = st.pins.includes(e.id);
  const piv = [];
  const add = (label, fn) => piv.push(h('button', { class: 'btn small', type: 'button', onclick: fn, text: label }));
  if (e.user) add(`Everything by ${e.user}`, () => pivotSearch(`user:${e.user}`));
  if (e.host) add(`Everything on ${e.host}`, () => pivotSearch(`host:${e.host}`));
  for (const k of ['dst', 'src']) if (f[k] && IPV4.test(String(f[k]))) add(`Everything with ${f[k]}`, () => pivotSearch(`ip:${f[k]}`));
  if (f.proc) add(`Process ${f.proc}`, () => pivotSearch(`proc:${f.proc}`));
  if (f.file && !String(f.file).includes('*')) add(`Everything with ${f.file}`, () => pivotSearch(`file:${f.file}`));
  if (f.domain) add(`Domain ${f.domain}`, () => pivotSearch(`domain:${f.domain}`));
  if (f.from) add(`Sender ${f.from}`, () => pivotSearch(`from:${f.from}`));
  if (f.pid !== undefined && e.host) add(`Process tree on ${e.host}`, () => { ui.treeHost = e.host; ui.eventId = e.id; setView('tree'); });
  for (const id of [e.user, e.host, f.dst, f.src, f.domain, f.from, f.file]) if (id && entity(id)) add(`Open ${id}`, () => { ui.entityId = id; setView('entities'); });
  const rows = Object.entries(f).map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: String(v) })));
  return h(
    'aside',
    { class: 'inspector', 'aria-label': 'Event details' },
    h('header', {}, h('strong', { text: 'Event details' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Close details', onclick: () => selectEvent(e.id), text: '×' })),
    h('p', { class: 'ins-sum', text: e.summary }),
    h('dl', { class: 'ins-meta' }, h('dt', { text: 'Time' }), h('dd', { text: timeText(e.t) }), h('dt', { text: 'Severity' }), h('dd', {}, sevChip(e.sev)), h('dt', { text: 'Type' }), h('dd', { text: e.type }), e.host ? h('dt', { text: 'Machine' }) : null, e.host ? h('dd', { text: e.host }) : null, e.user ? h('dt', { text: 'Account' }) : null, e.user ? h('dd', { text: e.user }) : null),
    rows.length ? h('table', { class: 'fields' }, h('tbody', {}, rows)) : null,
    e.synthetic ? null : h('button', { class: `btn small ${pinned ? '' : 'primary'}`, type: 'button', 'data-key': 'pin', onclick: () => { pinned ? E.unpin(st, e.id) : E.pin(st, e.id); refresh(); }, text: pinned ? 'Unpin from case file' : 'Pin to case file' }),
    piv.length ? h('div', { class: 'pivots' }, h('small', { text: 'Pivot' }), h('div', { class: 'pivot-row' }, piv)) : null
  );
}

const withInspector = (main, extra) => h('div', { class: `split${ui.eventId ? ' has-ins' : ''}` }, h('div', { class: 'split-main' }, main), ui.eventId ? h('div', { class: 'split-side' }, inspector(), extra) : null);

// ── Case brief (for assignments that start from a referral instead of an alert queue) ──
function viewBrief() {
  const b = scn.ui.briefPanel;
  return h('div', { class: 'brief-view' },
    tipFor('brief', 'Read the referral, then start where the evidence is. Nothing here is a conclusion yet.'),
    h('h2', { text: b.heading }),
    b.paragraphs.map((p) => h('p', { class: 'dim', text: p })),
    h('h3', { text: 'What is known so far' }),
    h('ul', { class: 'facts' }, b.known.map((k) => h('li', { text: k }))),
    h('h3', { text: 'What you are asked for' }),
    h('ul', { class: 'facts' }, b.asks.map((k) => h('li', { text: k }))));
}

// ── Alerts ──────────────────────────────────────────────────────
function viewAlerts() {
  const alerts = E.alertsNow(scn, st).slice().sort((a, b) => E.rank(b.sev) - E.rank(a.sev) || b.at - a.at);
  const list = h('ul', { class: 'queue', 'aria-label': 'Alert queue' });
  for (const a of alerts) {
    const got = st.alerts[a.id];
    const state = got ? (got.status === 'escalated' ? 'Escalated' : 'Closed') : 'New';
    list.append(
      h('li', {}, h('button', { class: `acard${ui.alertId === a.id ? ' sel' : ''} ${got ? 'done-' + got.status : ''}`, type: 'button', 'data-key': `alert-${a.id}`, 'aria-pressed': ui.alertId === a.id ? 'true' : 'false', onclick: () => { ui.alertId = a.id; ui.eventId = null; renderView(); toDetail(); } },
        h('div', { class: 'acard-top' }, sevChip(a.sev), h('span', { class: `astate st-${state.toLowerCase()}`, text: state })),
        h('strong', { text: a.title }),
        h('small', { text: `${a.id} · ${timeText(a.at)} · ${a.source}` }),
        h('small', { class: 'mono', text: [a.host, a.user].filter(Boolean).join(' · ') })))
    );
  }
  const sel = alerts.find((a) => a.id === ui.alertId);
  return h('div', { class: 'alerts-view' },
    tipFor('alerts', 'Open an alert to see what fired it. Then decide: escalate it into the incident, or close it as benign. Check the context before you decide: an alert is a question, not an answer.'),
    h('div', { class: 'two-col' }, h('div', { class: 'col-list' }, list), h('div', { class: 'col-detail' }, sel ? alertDetail(sel) : h('p', { class: 'empty', text: 'Choose an alert from the queue.' }))));
}

function alertDetail(a) {
  const got = st.alerts[a.id];
  const evs = a.events.map((id) => E.eventById(scn, st, id)).filter(Boolean).sort((x, y) => x.t - y.t);
  const reasons = ['Explained by context', 'Authorised activity', 'Expected behaviour', 'Duplicate', 'False positive'];
  const act = (status) => () => {
    E.triage(scn, st, a.id, status, status === 'closed' ? ui.closeReason : 'Part of the incident');
    refresh();
  };
  return h('div', { class: 'adetail' },
    h('header', {}, h('div', {}, sevChip(a.sev), h('span', { class: 'mono dim', text: ` ${a.id} · ${timeText(a.at)} · ${a.source}` })), h('h2', { text: a.title })),
    h('p', { class: 'dim', text: `Raised on ${a.host}${a.user ? ' for ' + a.user : ''}. ${got ? 'Your decision: ' + (got.status === 'escalated' ? 'escalated' : 'closed as benign (' + got.reason + ')') + ' at ' + timeText(got.at) + '.' : 'Waiting for a decision.'}` }),
    h('div', { class: 'quick' },
      a.host ? h('button', { class: 'btn small', type: 'button', onclick: () => pivotSearch(`host:${a.host}`), text: `Search ${a.host}` }) : null,
      a.user ? h('button', { class: 'btn small', type: 'button', onclick: () => pivotSearch(`user:${a.user}`), text: `Search ${a.user}` }) : null,
      a.user ? h('button', { class: 'btn small', type: 'button', onclick: () => { ui.entityId = a.user; setView('entities'); }, text: `Open ${a.user}` }) : null),
    h('h3', { text: 'What fired it' }),
    h('div', { class: 'erows' }, evs.map(eventRow)),
    ui.eventId ? inspector() : null,
    h('div', { class: 'decide' },
      h('button', { class: 'btn primary', type: 'button', 'data-key': 'esc', onclick: act('escalated'), text: got && got.status === 'escalated' ? 'Escalated to incident' : 'Escalate to incident' }),
      h('div', { class: 'closeblock' },
        h('button', { class: 'btn', type: 'button', 'data-key': 'close', onclick: act('closed'), text: got && got.status === 'closed' ? 'Closed as benign' : 'Close as benign' }),
        h('label', { class: 'sel-label' }, 'Reason ', h('select', { 'aria-label': 'Reason for closing', onchange: (ev) => { ui.closeReason = ev.target.value; } }, reasons.map((r) => h('option', { value: r, selected: r === ui.closeReason ? true : null, text: r })))))));
}

// ── Logs ────────────────────────────────────────────────────────
function viewLogs() {
  const examples = scn.ui.examples;
  const form = h('form', { class: 'sform', onsubmit: (ev) => { ev.preventDefault(); ui.query = ev.target.q.value; ui.from = ev.target.from.value; ui.to = ev.target.to.value; runSearch(); refresh(); } },
    h('div', { class: 'qrow' },
      h('label', { class: 'sr', for: 'q' }, 'Search the logs'),
      h('input', { id: 'q', name: 'q', type: 'text', value: ui.query, placeholder: scn.ui.searchHint, autocomplete: 'off', spellcheck: 'false', 'data-key': 'q' }),
      h('button', { class: 'btn primary', type: 'submit', text: 'Search (1 min)' })),
    h('div', { class: 'frow' },
      h('label', {}, 'From ', h('input', { name: 'from', type: 'text', value: ui.from, placeholder: '09:00', size: 5, inputmode: 'numeric', autocomplete: 'off' })),
      h('label', {}, 'To ', h('input', { name: 'to', type: 'text', value: ui.to, placeholder: '14:05', size: 5, inputmode: 'numeric', autocomplete: 'off' })),
      ['low', 'medium', 'high'].map((s) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: ui.sev.includes(s) ? true : null, onchange: (ev) => { ui.sev = ev.target.checked ? [...ui.sev, s] : ui.sev.filter((x) => x !== s); } }), ' ', SEV_LABEL[s])),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: ui.newest ? true : null, onchange: (ev) => { ui.newest = ev.target.checked; renderView(); } }), ' Newest first')),
    h('div', { class: 'examples' }, h('small', { text: 'Try: ' }), examples.map((x) => h('button', { class: 'ex', type: 'button', onclick: () => pivotSearch(x), text: x }))));

  let body;
  if (!ui.results) body = h('div', { class: 'empty' }, h('p', { text: 'No search yet. Every search takes a minute, so make it count.' }), h('p', { class: 'dim', text: 'Prefixes: user: host: ip: proc: type: sev: file: domain: from:. Words with no prefix match the whole event. All of your words must match.' }));
  else {
    const rows = ui.results.slice().sort((a, b) => (ui.newest ? b.t - a.t : a.t - b.t));
    const shown = rows.slice(0, 150);
    body = h('div', {},
      h('p', { class: 'rescount', text: `${rows.length} event${rows.length === 1 ? '' : 's'} for "${ui.query.trim() || 'everything'}" as at ${timeText(ui.resultsAt)}${rows.length > shown.length ? `. Showing the first ${shown.length}: narrow your search.` : '.'}` }),
      rows.length ? h('div', { class: 'erows' }, shown.map(eventRow)) : h('p', { class: 'empty', text: 'Nothing matches. Check the spelling, or try fewer words.' }));
  }
  return h('div', { class: 'logs-view' }, tipFor('logs', 'Search the logs. Click an event to inspect it, pin the ones that prove the story and pivot to the next question.'), form, withInspector(body));
}

// ── People & machines ───────────────────────────────────────────
const TOKEN = { user: 'user', host: 'host', file: 'file', ip: 'ip', domain: 'domain', mail: 'from' };
function viewEntities() {
  const groups = h('div', { class: 'egroups' });
  for (const kind of ['user', 'host', 'file', 'ip', 'domain', 'mail']) {
    const items = E.entityList(scn, kind);
    if (!items.length) continue;
    groups.append(h('h3', { text: KIND[kind] + (kind === 'mail' ? '' : 's') }), h('ul', { class: 'elist' }, items.map((x) => h('li', {}, h('button', { class: `eitem${ui.entityId === x.id ? ' sel' : ''}`, type: 'button', 'data-key': `ent-${x.id}`, onclick: () => { ui.entityId = x.id; ui.eventId = null; renderView(); toDetail(); } }, h('strong', { text: x.id }), h('small', { text: x.role }))))));
  }
  let card = h('p', { class: 'empty', text: 'Choose an account, machine or address to open its profile.' });
  if (ui.entityId) {
    const info = E.openEntity(scn, st, ui.entityId);
    if (info) {
      updateChrome();
      const x = info.entity;
      const recent = info.events.slice(-8).reverse();
      card = h('div', { class: 'ecard' },
        h('header', {}, h('span', { class: 'chip', text: KIND[x.kind] }), h('h2', { text: x.id }), h('p', { class: 'dim', text: `${x.name} · ${x.role}` })),
        info.state.length ? h('p', {}, info.state.map((s) => h('span', { class: 'chip state', text: s }))) : null,
        x.meta ? h('table', { class: 'fields meta' }, h('tbody', {}, x.meta.map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: v }))))) : null,
        h('ul', { class: 'facts' }, x.facts.map((f) => h('li', { text: f }))),
        h('p', { class: 'dim', text: `${info.count} logged event${info.count === 1 ? '' : 's'}${info.last !== null ? ', last at ' + timeText(info.last) : ''}.` }),
        h('div', { class: 'quick' },
          h('button', { class: 'btn small', type: 'button', onclick: () => pivotSearch(`${TOKEN[x.kind]}:${x.id}`), text: 'Search its activity' }),
          x.kind === 'host' ? h('button', { class: 'btn small', type: 'button', onclick: () => { ui.treeHost = x.id; setView('tree'); }, text: 'Process tree' }) : null,
          h('button', { class: 'btn small', type: 'button', onclick: () => { ui.respond.pref = x.id; setView('respond'); }, text: 'Respond…' })),
        recent.length ? h('div', {}, h('h3', { text: 'Latest activity' }), h('div', { class: 'erows' }, recent.map(eventRow))) : null);
    }
  }
  return h('div', { class: 'ent-view' }, tipFor('entities', 'Context is how you tell an attack from a normal day. Open an account or machine to see who it belongs to and what it normally does.'), h('div', { class: 'two-col' }, h('div', { class: 'col-list' }, groups), h('div', { class: 'col-detail' }, withInspector(card))));
}

// ── Process tree ────────────────────────────────────────────────
function viewTree() {
  const hosts = scn.targets.host.filter((x) => scn.events.some((e) => e.host === x && e.fields && e.fields.pid !== undefined));
  const roots = E.processTree(scn, st, ui.treeHost);
  updateChrome();
  const node = (n) => h('li', {},
    h('button', { class: `pnode sev-b-${n.sev}${ui.eventId === n.event.id ? ' sel' : ''}`, type: 'button', 'data-key': `pn-${n.pid}`, onclick: () => selectEvent(n.event.id) },
      h('span', { class: 'pname', text: n.name }), h('span', { class: 'ppid', text: `pid ${n.pid}` }), h('time', { text: timeText(n.t) }), n.cmd && n.cmd !== n.name ? h('span', { class: 'pcmd', text: n.cmd }) : null),
    n.children.length ? h('ul', {}, n.children.map(node)) : null);
  const sel = h('label', { class: 'sel-label' }, 'Machine ', h('select', { 'aria-label': 'Machine', 'data-key': 'treehost', onchange: (ev) => { ui.treeHost = ev.target.value; ui.eventId = null; renderView(); } }, hosts.map((x) => h('option', { value: x, selected: x === ui.treeHost ? true : null, text: x }))));
  const tree = roots.length ? h('ul', { class: 'ptree' }, roots.map(node)) : h('p', { class: 'empty', text: 'No process activity recorded on this machine yet.' });
  return h('div', { class: 'tree-view' }, tipFor('tree', 'Read the tree top to bottom: each process was started by the one above it. Ask what a document, a mail client or a browser has no business starting.'), sel, withInspector(tree));
}

// ── Network map ─────────────────────────────────────────────────
const POS = { other: { x: 50, y: 95 } };
function viewMap() {
  const edges = E.networkEdges(scn, st);
  updateChrome();
  const known = new Set(scn.entities.map((x) => x.id));
  const agg = new Map();
  for (const e of edges) {
    const to = known.has(e.to) ? e.to : 'other';
    const key = `${e.from}>${to}`;
    const cur = agg.get(key) || { key, from: e.from, to, count: 0, bytes: 0, last: 0, sev: 'info', events: [] };
    cur.count += e.count;
    cur.bytes += e.bytes;
    cur.last = Math.max(cur.last, e.last);
    cur.events.push(...e.events);
    if (E.rank(e.sev) > E.rank(cur.sev)) cur.sev = e.sev;
    agg.set(key, cur);
  }
  const list = [...agg.values()].sort((a, b) => E.rank(b.sev) - E.rank(a.sev) || b.bytes - a.bytes);
  const W = 800;
  const H = 520;
  const pos = (id) => {
    const p = id === 'other' ? POS.other : entity(id) || { x: 50, y: 50 };
    return { x: (p.x / 100) * W, y: (p.y / 100) * H };
  };
  const blocked = (e) => st.flags[`isolate:${e.from}`] !== undefined || st.flags[`block-ip:${e.to}`] !== undefined || st.flags[`isolate:${e.to}`] !== undefined;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'netmap', role: 'group', 'aria-label': 'Network map. The links are also listed below.' });
  for (const e of list) {
    const a = pos(e.from);
    const b = pos(e.to);
    const w = Math.min(7, 1.2 + Math.log2(1 + e.count) * 0.7);
    const cls = `link lk-${e.sev}${ui.edgeKey === e.key ? ' sel' : ''}${blocked(e) ? ' blocked' : ''}`;
    svg.append(sv('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls, 'stroke-width': w }));
    svg.append(sv('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'hit', 'stroke-width': 16, tabindex: 0, role: 'button', 'aria-label': `${e.from} to ${e.to}, ${e.count} connections`, onclick: () => pickEdge(e.key), onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickEdge(e.key); } } }));
  }
  const ids = new Set(['other']);
  for (const e of list) { ids.add(e.from); ids.add(e.to); }
  for (const x of scn.entities) if (x.kind === 'host') ids.add(x.id);
  for (const id of ids) {
    const p = pos(id);
    const x = entity(id);
    const label = id === 'other' ? 'Other internet' : id;
    const kind = id === 'other' ? 'ip' : x ? x.kind : 'ip';
    const wBox = Math.max(70, label.length * 7.2 + 16);
    const g = sv('g', { class: `node nk-${kind}${blockedNode(id) ? ' blocked' : ''}`, tabindex: x ? 0 : -1, role: x ? 'button' : 'img', 'aria-label': label, onclick: () => { if (x) { ui.entityId = id; setView('entities'); } }, onkeydown: (ev) => { if (x && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ui.entityId = id; setView('entities'); } } },
      sv('rect', { x: p.x - wBox / 2, y: p.y - 15, width: wBox, height: 30, rx: 7 }),
      sv('text', { x: p.x, y: p.y + 4.5, 'text-anchor': 'middle' }, label));
    svg.append(g);
  }
  const sel = list.find((e) => e.key === ui.edgeKey);
  const detail = sel
    ? h('div', { class: 'edge-detail' }, h('h3', { text: `${sel.from} → ${sel.to === 'other' ? 'other internet addresses' : sel.to}` }), h('p', { class: 'dim', text: `${sel.count} connection${sel.count === 1 ? '' : 's'}, ${fmtBytes(sel.bytes)} in total, last at ${timeText(sel.last)}.${blocked(sel) ? ' Blocked or isolated since.' : ''}` }), h('div', { class: 'erows' }, sel.events.map((id) => E.eventById(scn, st, id)).filter(Boolean).sort((a, b) => b.t - a.t).slice(0, 20).map(eventRow)))
    : null;
  const table = h('table', { class: 'links' }, h('thead', {}, h('tr', {}, ['From', 'To', 'Connections', 'Data', 'Last'].map((c) => h('th', { text: c })))), h('tbody', {}, list.map((e) => h('tr', { class: ui.edgeKey === e.key ? 'sel' : '' }, h('td', {}, h('button', { class: 'linkbtn', type: 'button', 'data-key': `edge-${e.key}`, onclick: () => pickEdge(e.key), text: e.from })), h('td', { text: e.to === 'other' ? 'Other internet' : e.to }), h('td', {}, sevChip(e.sev), ` ${e.count}`), h('td', { text: fmtBytes(e.bytes) }), h('td', { text: timeText(e.last) })))));
  return h('div', { class: 'map-view' }, tipFor('map', 'Thicker links carry more traffic; red and amber links are the ones that were flagged. Click a link to see the individual connections, or a machine to open it.'), h('div', { class: 'mapwrap' }, svg), withInspector(h('div', {}, detail, h('h3', { text: 'All links' }), table)));
}
const blockedNode = (id) => st.flags[`isolate:${id}`] !== undefined || st.flags[`block-ip:${id}`] !== undefined;
function pickEdge(key) {
  ui.edgeKey = ui.edgeKey === key ? null : key;
  ui.eventId = null;
  renderView();
}
const fmtBytes = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n >= 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B');

// ── Respond ─────────────────────────────────────────────────────
function viewRespond() {
  const label = (kind, id) => {
    const x = entity(id);
    return x ? `${id} · ${x.role}` : id;
  };
  const cards = scn.actions.map((a) => {
    const targets = scn.targets[a.targetKind] || [];
    const pref = ui.respond.pref && targets.includes(ui.respond.pref) ? ui.respond.pref : null;
    const value = ui.respond[a.id] || pref || '';
    const select = h('select', { 'aria-label': `${a.label}: target`, 'data-key': `sel-${a.id}`, onchange: (ev) => { ui.respond[a.id] = ev.target.value; renderView(); } },
      h('option', { value: '', text: 'Choose…' }), targets.map((t) => h('option', { value: t, selected: t === value ? true : null, text: label(a.targetKind, t) })));
    const done = value && st.flags[`${a.id}:${value}`] !== undefined;
    return { group: a.group || '', node: h('div', { class: 'act' }, h('strong', { text: a.label }), select,
      h('button', { class: `btn small ${done ? '' : 'danger'}`, type: 'button', disabled: !value || done ? true : null, 'data-key': `do-${a.id}`, onclick: () => doAction(a.id, value), text: done ? 'Done' : `Do it (${a.cost ?? E.COSTS.action} min)` })) };
  });
  const groups = [...new Set(cards.map((c) => c.group))];
  const acts = h('div', { class: 'acts' }, groups.map((g) => h('div', { class: 'agroup' }, g ? h('h3', { text: g }) : null, cards.filter((c) => c.group === g).map((c) => c.node))));
  const res = ui.lastResult;
  return h('div', { class: 'respond-view' },
    tipFor('respond', 'Every action takes time, and the attacker keeps working. Stopping the right things is good; stopping the wrong things costs the business. Past events stay in the logs: an action only changes what happens next.'),
    res ? h('div', { class: `result ${res.ok ? (res.harm ? 'bad' : 'ok') : 'note'}`, role: 'status' }, h('strong', { text: res.title }), h('p', { text: res.text }), res.harm ? h('p', { class: 'harm', text: `Business disruption +${res.harm}` }) : null) : null,
    acts,
    h('h3', { text: 'What you have done' }),
    st.actions.length ? h('ol', { class: 'did' }, st.actions.map((a) => h('li', {}, h('time', { text: timeText(a.at) }), ' ', a.rule.label || `${a.action} ${a.target}`))) : h('p', { class: 'empty', text: 'Nothing yet.' }));
}
function doAction(action, target) {
  const def = scn.actions.find((a) => a.id === action);
  const r = E.perform(scn, st, action, target);
  ui.lastResult = r.ok ? { ok: true, title: `${def.label}: ${target}`, text: r.text, harm: r.harm } : { ok: false, title: `${def.label}: ${target}`, text: r.text || 'That cannot be done.' };
  refresh();
}

// ── Case file ───────────────────────────────────────────────────
function renderCaseFile(box) {
  const pins = st.pins.map((id) => scn.events.find((e) => e.id === id)).filter(Boolean).sort((a, b) => a.t - b.t);
  const esc = Object.values(st.alerts).filter((a) => a.status === 'escalated').length;
  const closed = Object.values(st.alerts).filter((a) => a.status === 'closed').length;
  box.replaceChildren(
    h('header', {}, h('strong', { text: 'Case file' }), h('small', { text: `${E.clockText(st.clock)}` })),
    h('dl', { class: 'cstat' }, scn.alerts.length ? h('dt', { text: 'Alerts' }) : null, scn.alerts.length ? h('dd', { text: `${openAlerts().length} open · ${esc} escalated · ${closed} closed` }) : null, h('dt', { text: 'Searches' }), h('dd', { text: String(st.searches) }), h('dt', { text: 'Actions' }), h('dd', { text: String(st.actions.length) })),
    h('h3', { text: 'Pinned timeline' }),
    pins.length
      ? h('ol', { class: 'pintl' }, pins.map((e) => h('li', {}, h('time', { text: timeText(e.t) }), h('span', { text: e.summary }), h('button', { class: 'x', type: 'button', 'aria-label': 'Unpin', onclick: () => { E.unpin(st, e.id); refresh(); }, text: '×' }))))
      : h('p', { class: 'empty', text: 'Nothing pinned yet. Pin the events that prove what happened.' }));
}
function viewCase() {
  const box = h('div', { class: 'casefile-inline' });
  renderCaseFile(box);
  return h('div', {}, tipFor('case', 'This is your evidence timeline, in time order. A good one tells the story of the attack from the first email to the data staged for removal.'), box);
}

// ── Report ──────────────────────────────────────────────────────
function viewReport() {
  const r = ui.report;
  const submit = h('button', { class: 'btn primary big', type: 'button', 'data-key': 'submit', onclick: finish, text: 'Submit report' });
  const validate = () => {
    submit.disabled = !scn.report.every((f) => f.kind === 'text' || f.kind === 'set' || (f.kind === 'time' ? E.parseClock(r[f.id]) !== null : r[f.id]));
    for (const c of document.querySelectorAll('.count[data-field]')) c.textContent = `${r[c.dataset.field].trim().length} characters (at least ${c.dataset.min} for full credit)`;
  };
  const options = (f) => (f.from ? scn.targets[f.from].map((id) => [id, id, entity(id) ? entity(id).role : '']) : f.options.map(([v, l]) => [v, l, '']));
  const radio = (f) => h('div', { class: 'opts' }, options(f).map(([v, l]) => h('label', { class: 'opt' }, h('input', { type: 'radio', name: f.id, value: v, checked: r[f.id] === v ? true : null, onchange: () => { r[f.id] = v; validate(); } }), h('span', { text: l }))));
  const checks = (f) => h('div', { class: 'opts cols' }, options(f).map(([v, l, role]) => h('label', { class: 'opt' }, h('input', { type: 'checkbox', checked: r[f.id].includes(v) ? true : null, onchange: (ev) => { r[f.id] = ev.target.checked ? [...r[f.id], v] : r[f.id].filter((x) => x !== v); } }), h('span', {}, h('strong', { text: l }), role ? h('small', { text: ` ${role}` }) : null))));
  const field = (f) => {
    if (f.kind === 'set') return checks(f);
    if (f.kind === 'time') return h('div', {}, h('input', { type: 'text', name: f.id, value: r[f.id], placeholder: 'HH:MM', size: 6, inputmode: 'numeric', autocomplete: 'off', 'aria-label': f.label, oninput: (ev) => { r[f.id] = ev.target.value; validate(); } }), f.hint ? h('small', { class: 'count', text: f.hint }) : null);
    if (f.kind === 'text') {
      const ta = h('textarea', { rows: 5, 'aria-label': f.label, placeholder: f.placeholder || '', oninput: (ev) => { r[f.id] = ev.target.value; validate(); } });
      ta.value = r[f.id];
      return h('div', {}, ta, h('small', { class: 'count', 'data-field': f.id, 'data-min': String(f.minLength) }));
    }
    return radio(f);
  };
  const form = h('div', { class: 'report' }, tipFor('report', 'Your report is graded against what really happened, and credit depends on the evidence you pinned. You can keep investigating until you submit; the clock keeps running.'), scn.report.map((f) => h('fieldset', {}, h('legend', { text: f.label }), field(f))), h('div', { class: 'btn-row' }, submit));
  queueMicrotask(validate);
  return form;
}

// ── Finishing ───────────────────────────────────────────────────
function finish() {
  st.submitted = true;
  const report = { ...ui.report };
  const g = E.grade(scn, st, report);
  const best = readBest();
  const prev = best[scn.id];
  if (!prev || g.total > prev.total) best[scn.id] = { total: g.total, tier: g.tier };
  writeBest(best);
  try {
    streak.touch();
  } catch {
    /* streak is optional */
  }
  for (const id of toastTimers) clearTimeout(id);
  toastTimers = [];
  renderEnd(g);
  $('mission-result').hidden = true;
  if (MISSION) {
    const res = missionLink.report(MISSION, { points: g.total, tier: g.tier, perf: g.total / 100, summary: [`Score ${g.total}/100`, ...Object.entries(g.parts).filter(([k]) => g.max[k] > 0).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)} ${Math.round(v)}/${g.max[k]}`), `Business disruption ${g.disruption}`] });
    missionLink.render($('mission-result'), res);
  }
  show('end');
}

const ALL_GROUPS = [['Triage', 'triage', 'Alert decisions'], ['Evidence', 'evidence', 'Evidence pinned'], ['Response', 'response', 'Response'], ['Report', 'report', 'Report']];
function renderEnd(g) {
  const GROUPS = ALL_GROUPS.filter(([, k]) => g.max[k] > 0).map(([n, k, l]) => [n, k, (scn.ui.groupLabels || {})[k] || l]);
  const root = $('end-card');
  root.replaceChildren();
  const head = h('div', { class: 'end-head' }, medalIcon(g.tier, 56), h('div', {}, h('p', { class: 'eyebrow', text: scn.title }), h('h1', {}, h('span', { class: 'accent-text', text: g.tier > 0 ? `${MEDALS[g.tier]} medal` : 'Not passed yet' }))));
  const lead = g.capped ? 'The investigation was strong, but the data left the network. That caps the medal at bronze.' : g.tier === 3 ? 'The incident is contained, the evidence is clear and the report is accurate. This is what the job looks like when it goes well.' : g.tier > 0 ? 'A solid result with room to tighten. The notes below show what was missed.' : 'Not this time. Read what was missed and run it again: the case is the same, the choices are yours.';
  const stats = h('div', { class: 'stats' },
    h('div', {}, h('span', { text: String(g.total) }), h('small', { text: 'score out of 100' })),
    h('div', {}, h('span', { text: String(g.minutes) }), h('small', { text: 'minutes used' })),
    h('div', {}, h('span', { text: String(g.disruption) }), h('small', { text: 'business disruption' })),
    h('div', {}, h('span', { text: String(st.pins.length) }), h('small', { text: 'events pinned' })));
  const bars = h('div', { class: 'parts' }, GROUPS.map(([, k, l]) => h('div', { class: 'part' }, h('div', { class: 'part-top' }, h('span', { text: l }), h('span', { class: 'mono', text: `${Math.round(g.parts[k] * 10) / 10} / ${g.max[k]}` })), h('div', { class: 'pbar' }, h('div', { style: `width:${Math.round((g.parts[k] / g.max[k]) * 100)}%` })))));
  const breakdown = GROUPS.map(([name, , l]) => h('section', { class: 'bgroup' }, h('h3', { text: l }), h('ul', { class: 'lines' }, g.lines.filter((x) => x.group === name).map((x) => h('li', { class: x.points > 0 || (x.max === 0 && x.points === 0 && !/not|missed|wrong|capped|left/i.test(x.label)) ? 'got' : x.points < 0 ? 'cost' : 'miss' }, h('strong', { text: x.label }), x.max || x.points ? h('span', { class: 'mono pts', text: x.points < 0 ? String(x.points) : `${x.points}${x.max ? ' / ' + x.max : ''}` }) : null, x.note ? h('small', { text: x.note }) : null)))));
  const stopped = E.preventedEvents(scn, st);
  const stoppedExfil = stopped.filter((e) => e.consequence);
  const stoppedCalls = stopped.filter((e) => !e.consequence && e.type === 'network').length;
  const story = h('section', {}, h('h2', { text: 'What really happened' }), h('ol', { class: 'story' }, scn.story.map((l) => h('li', { text: l }))), stoppedExfil.length ? h('p', { class: 'callout good', text: `You stopped it: ${stoppedExfil.map((e) => e.consequence.prevented || e.consequence.label).join('; ')}${stoppedCalls ? `. ${stoppedCalls} further calls to the attacker never took place` : ''}.` }) : null);
  const did = h('details', { class: 'brief' }, h('summary', { text: 'Replay what you did' }), h('ol', { class: 'did' }, st.log.map((l) => h('li', {}, h('time', { text: timeText(l.t) }), ' ', l.text))));
  const debrief = h('section', { class: 'debrief' }, h('h2', { text: 'Debrief' }), h('p', { class: 'dim', text: 'Two questions about the decisions you just made. They are not scored.' }), scn.debrief.map(debriefQ));
  const btns = h('div', { class: 'btn-row' }, h('button', { class: 'btn primary big', type: 'button', onclick: startShift, text: 'Play it again' }), h('button', { class: 'btn big', type: 'button', onclick: () => { renderPicker(); show('pick'); }, text: 'Back to assignments' }), h('a', { class: 'btn big', href: '/games/', text: 'All games' }));
  root.append(head, h('p', { class: 'lead', text: lead }), stats, bars, story, h('h2', { text: 'How your score added up' }), h('div', {}, breakdown), did, debrief, btns);
}

function debriefQ(q) {
  const out = h('div', { class: 'dq' }, h('p', { class: 'dq-q', text: q.question }));
  const fb = h('p', { class: 'dq-fb', role: 'status', hidden: true });
  const opts = h('div', { class: 'dq-opts' });
  q.options.forEach((o) => {
    const b = h('button', { class: 'dq-opt', type: 'button', text: o.text, onclick: () => {
      for (const x of opts.children) { x.disabled = true; }
      b.classList.add(o.correct ? 'right' : 'wrong');
      if (!o.correct) [...opts.children][q.options.findIndex((x) => x.correct)].classList.add('right');
      fb.hidden = false;
      fb.textContent = (o.correct ? 'Right. ' : 'Not quite. ') + o.explain;
    } });
    opts.append(b);
  });
  out.append(opts, fb);
  return out;
}

// ── Start ───────────────────────────────────────────────────────
$('brief-start').addEventListener('click', startShift);
$('brief-back').addEventListener('click', () => {
  if (MISSION) location.href = '/games/career/';
  else show('pick');
});
const fromCampaign = MISSION && SCENARIOS.find((x) => x.id === MISSION.ref);
if (fromCampaign) {
  missionLink.applyChrome();
  openBrief(fromCampaign);
} else {
  renderPicker();
  show('pick');
}
