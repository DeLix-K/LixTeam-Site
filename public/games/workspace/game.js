// The SOC workspace: the page around the simulation engine. Everything on screen is built with
// textContent; nothing from the scenario data is parsed as HTML.

import * as E from './engine.js';
import * as Net from './net.js';
import * as Cloud from './cloud.js';
import * as VM from './vm.js';
import { SOC_INVOICE } from './scenarios/soc-invoice.js';
import { DFIR_LAPTOP } from './scenarios/dfir-laptop.js';
import { NET_FLAT } from './scenarios/net-flat.js';
import { CLOUD_BUCKET } from './scenarios/cloud-bucket.js';
import { VM_PATCH } from './scenarios/vm-patch.js';
import { medalIcon } from '../core/art.js';
import { MEDALS } from '../core/missions.js';
import * as streak from '../core/streak.js';
import * as missionLink from '../core/mission-link.js';

const SCENARIOS = [SOC_INVOICE, DFIR_LAPTOP, NET_FLAT, CLOUD_BUCKET, VM_PATCH];
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
  traceFlow: null,
  nodeId: null,
  cloudMsg: null,
  findingId: null,
  vmSort: 'cvss',
  vmFilter: 'all',
  vmMsg: null,
  assetId: null,
  fwForm: { action: 'deny', src: '*', dst: '*', port: '*', proto: '*', where: 'top' },
  fwTest: scn.net ? { ...scn.net.test, port: String(scn.net.test.port) } : {},
  fwMsg: null,
});

const KIND = { asset: 'Asset', user: 'Account', host: 'Machine', file: 'File', ip: 'Address', domain: 'Domain', mail: 'Sender' };
const SEV_LABEL = { info: 'Info', low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const NAV_ALL = {
  alerts: { label: 'Alerts' },
  brief: { label: 'Case brief' },
  logs: { label: 'Log search' },
  entities: { label: 'People & machines' },
  tree: { label: 'Process tree' },
  map: { label: 'Network map' },
  topology: { label: 'Topology' },
  findings: { label: 'Findings' },
  estate: { label: 'Estate' },
  changes: { label: 'Changes' },
  queue: { label: 'Findings' },
  assets: { label: 'Assets' },
  firewall: { label: 'Firewall' },
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
  $('ws-budget-wrap').hidden = !scn.vm;
  if (scn.vm) $('ws-budget').textContent = `${E.budgetLeft(scn, st)} h`;
  const dis = Math.min(40, E.disruptionNow(scn, st));
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
  const fn = { queue: viewQueue, assets: viewAssets, findings: viewFindings, estate: viewEstate, changes: viewChanges, topology: viewTopology, firewall: viewFirewall, alerts: viewAlerts, brief: viewBrief, logs: viewLogs, entities: viewEntities, tree: viewTree, map: viewMap, respond: viewRespond, case: scn.vm ? viewPlan : viewCase, report: viewReport }[ui.view];
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
  if (e.flow || (e.synthetic && f.port !== undefined && f.src)) {
    const fw = e.flow || { src: f.src, dst: f.dst, port: f.port, proto: f.proto };
    add('Trace this connection', () => { ui.traceFlow = fw; setView('topology'); });
    add(`Everything on port ${fw.port}`, () => pivotSearch(`port:${fw.port}`));
  }
  if (f.file && !String(f.file).includes('*')) add(`Everything with ${f.file}`, () => pivotSearch(`file:${f.file}`));
  if (f.domain) add(`Domain ${f.domain}`, () => pivotSearch(`domain:${f.domain}`));
  if (f.from) add(`Sender ${f.from}`, () => pivotSearch(`from:${f.from}`));
  if (f.pid !== undefined && e.host) add(`Process tree on ${e.host}`, () => { ui.treeHost = e.host; ui.eventId = e.id; setView('tree'); });
  for (const id of new Set([e.user, e.host, f.dst, f.src, f.domain, f.from, f.file, f.actor, f.resource])) if (id && entity(id)) add(`Open ${id}`, () => { if (scn.cloud) { ui.nodeId = id; setView('estate'); } else { ui.entityId = id; setView('entities'); } });
  if (scn.cloud && f.actor && f.actor !== 'anonymous' && f.actor !== 'secret-scanner') add(`Everything by ${f.actor}`, () => pivotSearch(`actor:${f.actor}`));
  if (scn.cloud && f.resource) add(`Everything on ${f.resource}`, () => pivotSearch(`resource:${f.resource}`));
  const rows = Object.entries(f).map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: String(v) })));
  return h(
    'aside',
    { class: 'inspector', 'aria-label': 'Event details' },
    h('header', {}, h('strong', { text: 'Event details' }), h('button', { class: 'x', type: 'button', 'aria-label': 'Close details', onclick: () => selectEvent(e.id), text: '×' })),
    h('p', { class: 'ins-sum', text: e.summary }),
    h('dl', { class: 'ins-meta' }, h('dt', { text: 'Time' }), h('dd', { text: timeText(e.t) }), h('dt', { text: 'Severity' }), h('dd', {}, sevChip(e.sev)), h('dt', { text: 'Type' }), h('dd', { text: e.type }), e.host ? h('dt', { text: 'Machine' }) : null, e.host ? h('dd', { text: e.host }) : null, e.user ? h('dt', { text: 'Account' }) : null, e.user ? h('dd', { text: e.user }) : null),
    rows.length ? h('table', { class: 'fields' }, h('tbody', {}, rows)) : null,
    e.synthetic || scn.ui.noPins ? null : h('button', { class: `btn small ${pinned ? '' : 'primary'}`, type: 'button', 'data-key': 'pin', onclick: () => { pinned ? E.unpin(st, e.id) : E.pin(st, e.id); refresh(); }, text: pinned ? 'Unpin from case file' : 'Pin to case file' }),
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
  return h('div', { class: 'map-view' }, tipFor('map', 'Thicker links carry more traffic; red and amber links are the ones that were flagged. Click a link to see the individual connections, or a machine to open it.'), h('div', { class: 'mapwrap' }, svg), withInspector(h('div', {}, detail, h('h3', { text: 'All links' }), h('div', { class: 'tablewrap' }, table))));
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
  box.replaceChildren(...[
    h('header', {}, h('strong', { text: 'Case file' }), h('small', { text: `${E.clockText(st.clock)}` })),
    h('dl', { class: 'cstat' }, scn.alerts.length ? h('dt', { text: 'Alerts' }) : null, scn.alerts.length ? h('dd', { text: `${openAlerts().length} open · ${esc} escalated · ${closed} closed` }) : null, h('dt', { text: 'Searches' }), h('dd', { text: String(st.searches) }), h('dt', { text: 'Actions' }), h('dd', { text: String(st.actions.length) })),
    scn.net || scn.cloud ? servicesBlock() : null,
    scn.vm ? vmSide() : null,
    scn.vm ? null : h('h3', { text: 'Pinned timeline' }),
    scn.vm ? null : pins.length
      ? h('ol', { class: 'pintl' }, pins.map((e) => h('li', {}, h('time', { text: timeText(e.t) }), h('span', { text: e.summary }), h('button', { class: 'x', type: 'button', 'aria-label': 'Unpin', onclick: () => { E.unpin(st, e.id); refresh(); }, text: '×' }))))
      : h('p', { class: 'empty', text: 'Nothing pinned yet. Pin the events that prove what happened.' }),
  ].filter(Boolean));
}
function viewCase() {
  const box = h('div', { class: 'casefile-inline' });
  renderCaseFile(box);
  return h('div', {}, tipFor('case', 'This is your evidence timeline, in time order. A good one tells the story of the attack from the first email to the data staged for removal.'), box);
}

// ── Vulnerability management: findings queue, assets and plan ───
const EXPO = { internet: 'Internet-facing', internal: 'Internal', isolated: 'Isolated' };
const dots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
const findingAsset = (f) => entity(f.asset).asset;
function decisionText(f) {
  const d = st.vm.decisions[f.id];
  if (!d) return 'Open';
  if (d.kind === 'failed') return 'Failed: open';
  const o = VM.findOption(f, d.option);
  return d.kind === 'done' ? (o.kind === 'mitigate' ? 'Mitigated' : 'Fixed') : d.kind === 'accept' ? 'Accepted' : d.kind === 'defer' ? 'Deferred' : 'False positive';
}
function bandOf(f) {
  if (!E.vmInspected(st, f.id)) return null;
  return VM.band(VM.riskAt(f, st.clock));
}
const BAND_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function vmSide() {
  const done = Object.values(st.vm.decisions).filter((d) => d.kind === 'done').length;
  const open = scn.vm.findings.filter((f) => !st.vm.decisions[f.id] || st.vm.decisions[f.id].kind === 'failed').length;
  const looked = scn.vm.findings.filter((f) => E.vmInspected(st, f.id)).length;
  const pct = Math.round((VM.remaining(scn, st) / scn.vm.budget) * 100);
  return h('div', {}, h('h3', { text: 'Budget' }), h('div', { class: 'dbar budget', role: 'progressbar', 'aria-label': 'Budget left', 'aria-valuemin': '0', 'aria-valuemax': String(scn.vm.budget), 'aria-valuenow': String(VM.remaining(scn, st)) }, h('div', { style: `width:${pct}%` })),
    h('p', { class: 'dim', text: `${VM.remaining(scn, st)} of ${scn.vm.budget} hours left. ${done} remediated, ${open} still open, ${looked} of ${scn.vm.findings.length} opened.` }));
}

function viewQueue() {
  const f0 = scn.vm.findings;
  const rows = f0.filter((f) => ui.vmFilter === 'all' || (ui.vmFilter === 'open' ? !st.vm.decisions[f.id] || st.vm.decisions[f.id].kind === 'failed' : st.vm.decisions[f.id] && st.vm.decisions[f.id].kind !== 'failed'));
  const sorters = {
    cvss: (a, b) => b.cvss - a.cvss,
    priority: (a, b) => (BAND_RANK[bandOf(b)] || 0) - (BAND_RANK[bandOf(a)] || 0) || b.cvss - a.cvss,
    asset: (a, b) => a.asset.localeCompare(b.asset),
    status: (a, b) => decisionText(a).localeCompare(decisionText(b)),
    id: (a, b) => a.id.localeCompare(b.id),
  };
  rows.sort(sorters[ui.vmSort]);
  const sortBtn = (key, label) => h('button', { class: `chip-btn${ui.vmSort === key ? ' on' : ''}`, type: 'button', 'data-key': `sort-${key}`, 'aria-pressed': ui.vmSort === key ? 'true' : 'false', onclick: () => { ui.vmSort = key; renderView(); }, text: label });
  const filBtn = (key, label) => h('button', { class: `chip-btn${ui.vmFilter === key ? ' on' : ''}`, type: 'button', 'data-key': `fil-${key}`, 'aria-pressed': ui.vmFilter === key ? 'true' : 'false', onclick: () => { ui.vmFilter = key; renderView(); }, text: label });
  const list = h('ul', { class: 'queue' }, rows.map((f) => {
    const band = bandOf(f);
    const status = decisionText(f);
    return h('li', {}, h('button', { class: `acard fcard${ui.findingId === f.id ? ' sel' : ''}${st.vm.decisions[f.id] && st.vm.decisions[f.id].kind !== 'failed' ? ' done-closed' : ''}`, type: 'button', 'data-key': `f-${f.id}`, 'aria-pressed': ui.findingId === f.id ? 'true' : 'false', onclick: () => { ui.findingId = f.id; ui.vmMsg = null; E.vmInspect(scn, st, f.id); refresh(); toDetail(); } },
      h('div', { class: 'acard-top' }, h('span', { class: 'cvss', text: `CVSS ${f.cvss.toFixed(1)}` }), band ? h('span', { class: `band b-${band}`, text: band }) : h('span', { class: 'band b-unk', text: 'Not opened' })),
      h('strong', { text: f.title }), h('small', { class: 'mono', text: `${f.id} · ${f.asset}` }), h('small', { class: `astate ${status === 'Open' || status === 'Failed: open' ? 'st-new' : 'st-closed'}`, text: status })));
  }));
  const sel = f0.find((f) => f.id === ui.findingId);
  return h('div', { class: 'queue-view' }, tipFor('queue', 'Open a finding.'),
    h('div', { class: 'sortbar' }, h('span', { class: 'dim', text: 'Sort ' }), sortBtn('cvss', 'CVSS'), sortBtn('priority', 'Priority'), sortBtn('asset', 'Asset'), sortBtn('status', 'Status'), h('span', { class: 'dim sep', text: 'Show ' }), filBtn('all', 'All'), filBtn('open', 'Open'), filBtn('done', 'Decided')),
    h('div', { class: 'two-col' }, h('div', { class: 'col-list' }, list), h('div', { class: 'col-detail' }, sel ? findingDetail(sel) : h('p', { class: 'empty', text: 'Choose a finding. Opening it takes a minute and shows the asset behind it.' }))));
}

function optionRow(f, o) {
  const d = st.vm.decisions[f.id];
  const dry = st.vm.dry[`${f.id}:${o.id}`];
  const failed = (st.vm.failed[f.id] || []).includes(o.id);
  const done = d && d.kind === 'done';
  const chosen = d && d.option === o.id && d.kind !== 'failed';
  const tooDear = o.cost > VM.remaining(scn, st);
  const effectText = !o.cost ? '' : o.effect >= 1 ? 'Fully fixes it' : o.effect >= 0.7 ? 'Greatly reduces the risk' : 'Reduces the risk';
  return h('li', { class: `fixrow${chosen ? ' on' : ''}${failed ? ' failed' : ''}` },
    h('div', {}, h('strong', { text: o.label }), h('small', { text: o.cost ? `${o.cost} h · ${effectText}${o.harm || o.breaks ? '' : ''}` : o.kind === 'fp' ? 'No cost. Only right if the finding is not real.' : o.kind === 'accept' ? 'No cost. The risk stays, with sign-off.' : 'No cost. Nothing is reduced yet.' }), dry ? h('small', { class: dry.includes('crashes') || dry.includes('stops working') ? 'dry bad' : 'dry', text: dry }) : null, failed ? h('small', { class: 'dry bad', text: 'This change failed and was rolled back.' }) : null),
    h('div', { class: 'fixbtns' },
      o.cost && !dry && !done ? h('button', { class: 'btn small', type: 'button', 'data-key': `dry-${f.id}-${o.id}`, disabled: VM.remaining(scn, st) < 1 ? true : null, onclick: () => { const r = E.vmDry(scn, st, f.id, o.id); ui.vmMsg = { ok: r.ok, text: r.text }; refresh(); }, text: 'Dry run (1 h)' }) : null,
      chosen ? h('span', { class: 'astate st-closed', text: d.kind === 'done' ? 'Done' : 'Chosen' }) : h('button', { class: `btn small ${o.cost ? 'danger' : ''}`, type: 'button', 'data-key': `do-${f.id}-${o.id}`, disabled: done || failed || tooDear ? true : null, title: tooDear ? 'Not enough budget' : null, onclick: () => { const r = E.vmDecide(scn, st, f.id, o.id); ui.vmMsg = { ok: r.ok && !r.failed, text: r.text }; refresh(); }, text: o.cost ? `Commit (${o.cost} h)` : 'Choose' })));
}

function findingDetail(f) {
  const a = findingAsset(f);
  const ent = entity(f.asset);
  const t = st.clock;
  const exploited = VM.exploitedAt(f, t);
  const band = VM.band(VM.riskAt(f, t));
  const reasons = [`${ent.name} is worth ${a.crit} out of 5 to the business (${a.data.toLowerCase()})`, `${EXPO[a.exposure]}${a.exposure === 'internet' ? ': anyone can try it' : a.exposure === 'isolated' ? ': no route from outside' : ': an attacker needs a foothold first'}`, exploited ? 'Being exploited in the wild now' : 'No known exploitation yet', a.controls.length ? `Already protected: ${a.controls.join('; ').toLowerCase()}` : 'Nothing specific already protects it'];
  if (f.fp) reasons.push('Check the verification note: is this finding real?');
  return h('div', { class: 'fdetail' },
    h('header', {}, h('span', { class: 'cvss', text: `CVSS ${f.cvss.toFixed(1)}` }), h('span', { class: `band b-${band}`, text: `Priority: ${band}` }), h('span', { class: 'mono dim', text: ` ${f.id} · ${decisionText(f)}` }), h('h2', { text: f.title })),
    h('p', { text: f.desc }),
    h('p', { class: 'dim', text: `Verification: ${f.verify}` }),
    h('div', { class: 'acard-asset' }, h('h3', { text: 'The asset behind it' }), h('strong', { class: 'mono', text: ent.id }), h('span', { class: 'dim', text: ` ${ent.name} · ${ent.role}` }),
      h('dl', { class: 'ins-meta' }, h('dt', { text: 'Value' }), h('dd', {}, h('span', { class: 'dots', text: dots(a.crit) }), ` ${a.crit} / 5`), h('dt', { text: 'Exposure' }), h('dd', { text: EXPO[a.exposure] }), h('dt', { text: 'Owner' }), h('dd', { text: a.owner }), h('dt', { text: 'Holds' }), h('dd', { text: a.data }), h('dt', { text: 'Protection' }), h('dd', { text: a.controls.length ? a.controls.join('; ') : 'None specific' }))),
    h('h3', { text: 'Why this priority' }), h('ul', { class: 'facts' }, reasons.map((r) => h('li', { text: r }))),
    ui.vmMsg ? h('div', { class: `result ${ui.vmMsg.ok ? 'ok' : 'bad'}`, role: 'status' }, h('p', { text: ui.vmMsg.text })) : null,
    h('h3', { text: 'What to do' }), h('ul', { class: 'fixes' }, [...f.options, ...VM.FREE].map((o) => optionRow(f, o))));
}

function viewAssets() {
  const list = scn.entities.filter((x) => x.kind === 'asset').slice().sort((a, b) => b.asset.crit - a.asset.crit || a.id.localeCompare(b.id));
  const selId = ui.assetId;
  const rows = list.map((x) => {
    const fs = scn.vm.findings.filter((f) => f.asset === x.id);
    return h('tr', { class: selId === x.id ? 'sel' : '' }, h('td', {}, h('button', { class: 'linkbtn', type: 'button', 'data-key': `as-${x.id}`, onclick: () => { ui.assetId = x.id; E.openEntity(scn, st, x.id); refresh(); }, text: x.id })), h('td', { text: x.role }), h('td', {}, h('span', { class: 'dots', text: dots(x.asset.crit) })), h('td', { text: EXPO[x.asset.exposure] }), h('td', { text: x.asset.owner }), h('td', { text: String(fs.length) }));
  });
  const x = selId && entity(selId);
  const detail = x ? h('div', { class: 'acard-asset' }, h('h3', { text: x.id }), h('p', { class: 'dim', text: `${x.name} · ${x.role}` }), h('ul', { class: 'facts' }, x.facts.map((t) => h('li', { text: t }))), h('p', { class: 'dim', text: `Protection: ${x.asset.controls.length ? x.asset.controls.join('; ') : 'none specific'}. Holds: ${x.asset.data}.` }), h('div', { class: 'quick' }, scn.vm.findings.filter((f) => f.asset === x.id).map((f) => h('button', { class: 'btn small', type: 'button', onclick: () => { ui.findingId = f.id; E.vmInspect(scn, st, f.id); setView('queue'); }, text: `${f.id} · CVSS ${f.cvss.toFixed(1)}` })))) : null;
  return h('div', { class: 'assets-view' }, tipFor('assets', 'What each asset is worth.'), h('div', { class: 'tablewrap' }, h('table', { class: 'links' }, h('thead', {}, h('tr', {}, ['Asset', 'What it is', 'Value', 'Exposure', 'Owner', 'Findings'].map((c) => h('th', { text: c })))), h('tbody', {}, rows))), detail);
}

function viewPlan() {
  const decided = scn.vm.findings.filter((f) => st.vm.decisions[f.id]);
  const pend = scn.vm.findings.filter((f) => !st.vm.decisions[f.id] || st.vm.decisions[f.id].kind === 'failed');
  return h('div', { class: 'plan-view' }, tipFor('case', 'Your decisions and budget.'),
    vmSide(),
    h('h3', { text: `Decisions (${decided.length} of ${scn.vm.findings.length})` }),
    decided.length ? h('ol', { class: 'did' }, decided.slice().sort((a, b) => st.vm.decisions[a.id].at - st.vm.decisions[b.id].at).map((f) => { const d = st.vm.decisions[f.id]; const o = VM.findOption(f, d.option); return h('li', {}, h('time', { text: timeText(d.at) }), ' ', `${f.id} ${o.label}`, d.kind === 'failed' ? ' (failed, rolled back)' : '', o.cost ? ` · ${o.cost} h` : ''); })) : h('p', { class: 'empty', text: 'Nothing decided yet.' }),
    h('h3', { text: `Still open (${pend.length})` }),
    pend.length ? h('div', { class: 'quick' }, pend.map((f) => h('button', { class: 'btn small', type: 'button', onclick: () => { ui.findingId = f.id; E.vmInspect(scn, st, f.id); setView('queue'); }, text: `${f.id} · ${f.asset}` }))) : h('p', { class: 'empty', text: 'Every finding has a decision.' }));
}

// ── Cloud: findings, estate and changes ─────────────────────────
function viewFindings() {
  const list = Cloud.findingStatus(scn, Cloud.stateNow(scn, st));
  const open = list.filter((f) => !f.closed).length;
  return h('div', { class: 'findings-view' }, tipFor('findings', 'Open a finding to see it on the estate.'), h('p', { class: 'dim', text: `${open} of ${list.length} findings open.` }),
    h('ul', { class: 'queue' }, list.map((f) => h('li', {}, h('div', { class: `acard${f.closed ? ' done-closed' : ''}` },
      h('div', { class: 'acard-top' }, sevChip(f.sev), h('span', { class: `astate ${f.closed ? 'st-closed' : 'st-new'}`, text: f.closed ? 'Closed' : 'Open' })),
      h('strong', { text: f.title }), h('small', { text: f.detail }),
      h('div', { class: 'quick' }, h('button', { class: 'btn small', type: 'button', 'data-key': `find-${f.id}`, onclick: () => { ui.nodeId = f.resource; setView('estate'); }, text: 'Show on the estate' })))))));
}

const NODE_LABEL = { PUBLIC: 'The internet', ATTACKER: 'Attacker (leaked key)', ALL: 'Everything' };
function viewEstate() {
  const s2 = Cloud.stateNow(scn, st);
  const W = 800;
  const H = 520;
  const px = (x) => (x / 100) * W;
  const py = (y) => (y / 100) * H;
  const POSN = { PUBLIC: { x: 13, y: 8 }, ATTACKER: { x: 14, y: 24 }, ALL: { x: 62, y: 97 } };
  const at = (id) => { const p = POSN[id] || entity(id) || { x: 50, y: 50 }; return { x: px(p.x), y: py(p.y) }; };
  const holds = Cloud.attackerHolds(scn, s2).filter((x) => x.startsWith('LEAK:')).map((x) => x.slice(5));
  const edges = [];
  for (const g of s2.grants) {
    if (g.removed) continue;
    const top = g.actions.includes('admin') ? 'adm' : g.actions.some((a) => a === 'write' || a === 'delete') ? 'wr' : 'rd';
    for (const r of g.resources.includes('*') ? ['ALL'] : g.resources) edges.push({ a: g.who, b: r, cls: `gr-${top}`, label: g.label });
  }
  for (const t of s2.trusts) if (!t.removed) edges.push({ a: t.from, b: t.to, cls: 'trust', label: t.needsMfa ? 'may assume (needs MFA)' : 'may assume' });
  for (const i of scn.cloud.identities) for (const g of i.memberOf || []) edges.push({ a: i.id, b: g, cls: 'mem', label: 'member of' });
  for (const r of scn.cloud.resources) if (s2.res[r.id].public && s2.res[r.id].public !== 'none' && !s2.res[r.id].deleted) edges.push({ a: 'PUBLIC', b: r.id, cls: 'pub', label: 'open to the public' });
  for (const id of holds) edges.push({ a: 'ATTACKER', b: id, cls: 'leak', label: 'leaked key' });
  const sel = ui.nodeId;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'netmap estate', role: 'group', 'aria-label': 'The cloud estate as a graph of identities and resources' });
  for (const e of edges) {
    const A = at(e.a);
    const B = at(e.b);
    svg.append(sv('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: `eg ${e.cls}${sel ? (e.a === sel || e.b === sel ? ' hot' : ' dim') : ''}` }, sv('title', {}, `${e.a} → ${e.b === 'ALL' ? 'everything' : e.b}: ${e.label}`)));
  }
  const ids = [...new Set([...scn.entities.filter((x) => ['user', 'group', 'role', 'service', 'resource'].includes(x.kind)).map((x) => x.id), 'PUBLIC', 'ATTACKER', 'ALL'])];
  for (const id of ids) {
    if (id === 'ATTACKER' && !holds.length) continue;
    const x = entity(id);
    const label = NODE_LABEL[id] || id;
    const p = at(id);
    const w = Math.max(60, label.length * 7 + 14);
    const kind = x ? x.kind : id === 'ALL' ? 'all' : id === 'ATTACKER' ? 'attacker' : 'public';
    const gone = x && x.kind === 'resource' && s2.res[id] && s2.res[id].deleted;
    const sick = x && x.kind === 'service' && s2.ids[id] && (s2.ids[id].disabled || s2.ids[id].keyRotated);
    const pick = () => { ui.nodeId = id === sel ? null : id; ui.cloudMsg = null; renderView(); };
    svg.append(sv('g', { class: `node ck-${kind}${id === sel ? ' sel' : ''}${gone ? ' gone' : ''}${sick ? ' fixed' : ''}`, tabindex: 0, role: 'button', 'aria-label': label, 'aria-pressed': id === sel ? 'true' : 'false', onclick: pick, onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } } }, sv('rect', { x: p.x - w / 2, y: p.y - 13, width: w, height: 26, rx: 7 }), sv('text', { x: p.x, y: p.y + 4, 'text-anchor': 'middle' }, label)));
  }
  const legend = h('p', { class: 'legend dim' }, h('span', { class: 'lg adm' }, 'full access'), ' ', h('span', { class: 'lg wr' }, 'write'), ' ', h('span', { class: 'lg rd' }, 'read'), ' ', h('span', { class: 'lg trust' }, 'may assume'), ' ', h('span', { class: 'lg pub' }, 'open to the public'), ' ', h('span', { class: 'lg leak' }, 'leaked key'));
  return h('div', { class: 'estate-view' }, tipFor('estate', 'Click a node.'), h('div', { class: 'mapwrap' }, svg), legend, sel ? nodeInspector(sel, s2) : h('p', { class: 'empty', text: 'Choose a node to see its settings, who can reach it, what it can reach and the fixes on offer.' }));
}

function fixRow(f) {
  const applied = Cloud.currentApplied(st).includes(f.id);
  const clash = !applied && Cloud.currentApplied(st).map((x) => Cloud.fixById(scn, x)).find((x) => x && x.target === f.target);
  return h('li', { class: `fixrow${applied ? ' on' : ''}` }, h('div', {}, h('strong', { text: f.label }), h('small', { text: f.detail })),
    applied ? h('button', { class: 'btn small', type: 'button', 'data-key': `undo-${f.id}`, onclick: () => { E.cloudUndo(scn, st, f.id); ui.cloudMsg = { ok: true, text: `Undid: ${f.label}.` }; refresh(); }, text: 'Undo' })
      : h('button', { class: 'btn small danger', type: 'button', 'data-key': `fix-${f.id}`, disabled: clash ? true : null, title: clash ? `Undo "${clash.label}" first` : null, onclick: () => { const r = E.cloudFix(scn, st, f.id); ui.cloudMsg = r.ok ? { ok: true, text: `Applied: ${f.label}.` } : { ok: false, text: r.text }; refresh(); }, text: `Apply (${f.cost ?? E.COSTS.rule} min)` }));
}

function nodeInspector(id, s2) {
  const pseudo = NODE_LABEL[id];
  const x = entity(id);
  if (pseudo) {
    return h('div', { class: 'ninsp' }, h('h2', { text: pseudo }), h('p', { class: 'dim', text: id === 'PUBLIC' ? 'Requests with no credentials. They can reach only what a resource has been opened to the public.' : id === 'ATTACKER' ? 'Whoever found the leaked access key. They hold everything that key can do, plus anything open to the public.' : 'A grant on "everything" applies to every resource in the account, including ones created later.' }));
  }
  const isRes = x.kind === 'resource';
  const cfg = isRes ? s2.res[id] : s2.ids[id] || {};
  const rows = [];
  if (isRes) rows.push(['Public access', cfg.deleted ? 'deleted' : cfg.public === 'none' ? 'none' : cfg.public], ['Encrypted at rest', cfg.encrypted ? 'yes' : 'no'], ['Audit logging', cfg.logging ? 'on' : 'off']);
  else {
    if (x.kind === 'user') rows.push(['Multi-factor sign-in', cfg.mfa ? 'on' : 'off']);
    if (x.kind === 'service') rows.push(['Access key age', `${cfg.keyAgeDays} days`], ['Key', cfg.disabled ? 'account disabled' : cfg.keyRotated ? 'rotated: the old key no longer works' : 'original']);
  }
  const targets = [];
  const tid = (t) => `${t}`;
  if (isRes) {
    targets.push({ title: 'Settings', t: [`res:${id}`, `res:${id}:enc`] });
  } else {
    targets.push({ title: 'Account', t: [`id:${id}`] });
    for (const g of s2.grants.filter((g) => g.who === id)) targets.push({ title: `Grant: ${g.label}${g.removed ? ' (removed)' : ''}`, t: [`grant:${g.id}`] });
    for (const t of s2.trusts.filter((t) => t.from === id || t.to === id)) targets.push({ title: `Trust: ${t.from} may assume ${t.to}${t.removed ? ' (removed)' : ''}`, t: [`trust:${t.id}`] });
  }
  const fixSections = targets.map((sec) => ({ title: sec.title, list: sec.t.flatMap((tg) => Cloud.fixesFor(scn, tg)) })).filter((sec) => sec.list.length);
  const reach = isRes
    ? Cloud.whoCanReach(scn, s2, id).map((r) => ({ a: r.who === 'PUBLIC' ? 'Anyone on the internet' : r.who, lvl: r.action, why: r.why }))
    : Cloud.whatCanReach(scn, s2, id).map((r) => ({ a: r.resource, lvl: r.action, why: r.why }));
  if (isRes && Cloud.can(scn, s2, Cloud.ATTACKER, id, 'read')) reach.unshift({ a: 'The attacker', lvl: 'read', why: Cloud.explain(scn, s2, Cloud.ATTACKER, id, 'read') });
  const table = reach.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'links' }, h('thead', {}, h('tr', {}, [isRes ? 'Who' : 'Resource', 'Level', 'How'].map((c) => h('th', { text: c })))), h('tbody', {}, reach.map((r) => h('tr', {}, h('td', { class: 'mono', text: r.a }), h('td', {}, h('span', { class: `lvl lvl-${r.lvl}`, text: r.lvl })), h('td', { class: 'how', text: r.why.join(' → ') })))))) : h('p', { class: 'empty', text: isRes ? 'Nobody can reach this.' : 'It cannot reach anything.' });
  return h('div', { class: 'ninsp' },
    h('header', {}, h('span', { class: 'chip', text: x.kind === 'resource' ? 'Resource' : x.kind === 'service' ? 'Service account' : x.kind === 'role' ? 'Role' : x.kind === 'group' ? 'Group' : 'Person' }), h('h2', { class: 'mono', text: id }), h('p', { class: 'dim', text: `${x.name} · ${x.role}` })),
    rows.length ? h('table', { class: 'fields meta' }, h('tbody', {}, rows.map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: v }))))) : null,
    h('ul', { class: 'facts' }, x.facts.map((f) => h('li', { text: f }))),
    h('div', { class: 'quick' }, h('button', { class: 'btn small', type: 'button', onclick: () => pivotSearch(isRes ? `resource:${id}` : `actor:${id}`), text: 'Search the log for it' })),
    h('h3', { text: isRes ? 'Who can reach this' : 'What this can reach' }), table,
    ui.cloudMsg ? h('div', { class: `result ${ui.cloudMsg.ok ? 'ok' : 'bad'}`, role: 'status' }, h('p', { text: ui.cloudMsg.text })) : null,
    fixSections.length ? h('h3', { text: 'Fixes on offer' }) : null,
    fixSections.map((sec) => h('div', { class: 'fixsec' }, h('h4', { text: sec.title }), h('ul', { class: 'fixes' }, sec.list.map(fixRow)))));
}

function viewChanges() {
  const status = E.stateChecks(scn, st).services;
  const broken = status.filter((x) => !x.ok);
  const times = new Map();
  let prev = [];
  for (const hst of st.cloud.history) {
    for (const f of hst.applied) if (!prev.includes(f)) times.set(f, hst.at);
    prev = hst.applied;
  }
  const applied = Cloud.currentApplied(st);
  return h('div', { class: 'changes-view' }, tipFor('changes', 'Your fixes and the services that must keep working.'),
    h('h3', { text: `Business services (${status.length - broken.length} of ${status.length} working)` }),
    h('div', { class: 'svc-grid', role: 'list' }, status.map((x) => h('div', { class: `svc-chip ${x.ok ? 'up' : 'down'}`, role: 'listitem', title: x.note }, h('strong', { text: x.label }), h('small', { text: x.ok ? 'Working' : `Broken (cost ${x.weight}): ${x.note}` })))),
    h('h3', { text: 'Fixes you have applied' }),
    applied.length ? h('ol', { class: 'did' }, applied.map((id) => { const f = Cloud.fixById(scn, id); return h('li', {}, h('time', { text: timeText(times.get(id) ?? st.clock) }), ' ', f.label, ' ', h('button', { class: 'btn small', type: 'button', 'data-key': `chg-undo-${id}`, onclick: () => { E.cloudUndo(scn, st, id); refresh(); }, text: 'Undo' })); })) : h('p', { class: 'empty', text: 'None yet. Click a node on the Estate to see the fixes on offer.' }));
}

// ── Network: topology and trace ─────────────────────────────────
const sevRank = (e) => E.rank(e.sev);
function servicesBlock() {
  const st2 = E.stateChecks(scn, st).services;
  const broken = st2.filter((x) => !x.ok);
  return h('div', { class: 'svc' }, h('h3', { text: 'Services' }), h('p', { class: broken.length ? 'svc-bad' : 'svc-ok', text: broken.length ? `${st2.length - broken.length} of ${st2.length} running. Broken: ${broken.map((x) => x.label.replace(/^./, (c) => c.toLowerCase())).join('; ')}.` : `All ${st2.length} services running.` }));
}

function flowGroups() {
  const groups = new Map();
  for (const e of E.visibleEvents(scn, st)) {
    if (e.type !== 'flow' && !(e.synthetic && e.denied)) continue;
    const f = e.fields;
    const denied = !!e.denied;
    const key = `${f.szone}>${f.dzone}:${f.port}/${f.proto}`;
    const g = groups.get(key) || { key, szone: f.szone, dzone: f.dzone, port: f.port, proto: f.proto, count: 0, denied: 0, bytes: 0, last: 0, sev: 'info', events: [], flow: { src: f.src, dst: f.dst, port: f.port, proto: f.proto } };
    if (denied) g.denied += 1;
    else {
      g.count += 1;
      g.bytes += Number(f.bytes_out || 0) + Number(f.bytes_in || 0);
    }
    g.last = Math.max(g.last, e.t);
    if (sevRank(e) > E.rank(g.sev)) g.sev = e.sev;
    g.events.push(e);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => E.rank(b.sev) - E.rank(a.sev) || b.bytes - a.bytes);
}

function viewTopology() {
  const W = 800;
  const H = 520;
  const px = (x) => (x / 100) * W;
  const py = (y) => (y / 100) * H;
  const fwEnt = entity(scn.net.fw);
  const fwAt = { x: px(fwEnt.x), y: py(fwEnt.y) };
  const zoneBox = (id) => scn.net.zones.find((z) => z.id === id);
  const anchor = (id) => {
    const z = zoneBox(id);
    return z ? { x: px(z.x + z.w / 2), y: py(z.y + z.h) } : fwAt;
  };
  const hostAt = (id) => {
    const x = entity(id);
    return x && x.x !== undefined ? { x: px(x.x), y: py(x.y) } : anchor(Net.zoneOf(scn, id));
  };
  const policy = Net.currentPolicy(st);
  const groups = flowGroups();
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'netmap topo', role: 'group', 'aria-label': 'Network topology. The traffic between zones is also listed below.' });
  for (const z of scn.net.zones) {
    svg.append(sv('rect', { x: px(z.x), y: py(z.y), width: px(z.w), height: py(z.h), rx: 12, class: `zone zn-${z.id}` }), sv('text', { x: px(z.x) + 10, y: py(z.y) + 17, class: 'zlabel' }, z.label));
    const a = anchor(z.id);
    svg.append(sv('line', { x1: a.x, y1: a.y, x2: fwAt.x, y2: fwAt.y, class: 'uplink' }));
  }
  for (const g of groups) {
    const a = anchor(g.szone);
    const b = anchor(g.dzone);
    if (g.szone === g.dzone) continue;
    const open = Net.decide(scn, policy, g.flow).action === 'allow';
    const w = Math.min(8, 1.4 + Math.log2(1 + g.count + g.denied) * 0.7);
    const d = `M ${a.x} ${a.y} Q ${fwAt.x} ${fwAt.y} ${b.x} ${b.y}`;
    svg.append(sv('path', { d, class: `link lk-${g.sev}${open ? '' : ' blocked'}${ui.edgeKey === g.key ? ' sel' : ''}`, 'stroke-width': w, fill: 'none' }));
    svg.append(sv('path', { d, class: 'hit', 'stroke-width': 14, fill: 'none', tabindex: 0, role: 'button', 'aria-label': `${g.szone} to ${g.dzone} port ${g.port}, ${g.count} connections`, onclick: () => pickGroup(g.key), onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickGroup(g.key); } } }));
  }
  const nodeIds = scn.entities.filter((x) => x.x !== undefined).map((x) => x.id);
  for (const id of nodeIds) {
    const x = entity(id);
    const p = { x: px(x.x), y: py(x.y) };
    const wBox = Math.max(56, id.length * 7 + 14);
    svg.append(sv('g', { class: `node nk-${x.kind}${id === scn.net.fw ? ' fwnode' : ''}`, tabindex: 0, role: 'button', 'aria-label': id, onclick: () => { ui.entityId = id; setView('entities'); }, onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ui.entityId = id; setView('entities'); } } }, sv('rect', { x: p.x - wBox / 2, y: p.y - 13, width: wBox, height: 26, rx: 6 }), sv('text', { x: p.x, y: p.y + 4, 'text-anchor': 'middle' }, id)));
  }
  // the traced connection, hop by hop
  let trace = null;
  if (ui.traceFlow) {
    const hops = Net.pathOf(scn, ui.traceFlow);
    const verdict = Net.decide(scn, policy, ui.traceFlow);
    const pts = hops.map((hp) => (hp.kind === 'host' ? hostAt(hp.id) : hp.kind === 'fw' ? fwAt : anchor(hp.zone)));
    const cut = hops.findIndex((hp) => hp.kind === 'fw');
    const solid = verdict.action === 'allow' || cut < 0 ? pts : pts.slice(0, cut + 1);
    svg.append(sv('polyline', { points: solid.map((q) => `${q.x},${q.y}`).join(' '), class: `trace ${verdict.action === 'allow' ? 'ok' : 'no'}` }));
    if (verdict.action === 'deny' && cut >= 0) svg.append(sv('text', { x: fwAt.x + 40, y: fwAt.y - 20, class: 'tracex' }, 'blocked here'));
    trace = traceTable(hops, verdict);
  }
  const sel = groups.find((x) => x.key === ui.edgeKey);
  const detail = sel ? h('div', { class: 'edge-detail' }, h('h3', { text: `${sel.szone} to ${sel.dzone}, port ${sel.port}/${sel.proto}` }), h('p', { class: 'dim', text: `${sel.count} connection${sel.count === 1 ? '' : 's'} allowed${sel.denied ? `, ${sel.denied} denied` : ''}, ${fmtBytes(sel.bytes)} in total, last at ${timeText(sel.last)}.` }), h('div', { class: 'erows' }, sel.events.slice().sort((a, b) => b.t - a.t).slice(0, 20).map(eventRow))) : null;
  const table = h('table', { class: 'links' }, h('thead', {}, h('tr', {}, ['From zone', 'To zone', 'Port', 'Seen', 'Data', 'Last', 'Now'].map((c) => h('th', { text: c })))), h('tbody', {}, groups.map((g) => {
    const open = Net.decide(scn, policy, g.flow).action === 'allow';
    return h('tr', { class: ui.edgeKey === g.key ? 'sel' : '' }, h('td', {}, h('button', { class: 'linkbtn', type: 'button', 'data-key': `edge-${g.key}`, onclick: () => pickGroup(g.key), text: g.szone })), h('td', { text: g.dzone }), h('td', { text: `${g.port}/${g.proto}` }), h('td', {}, sevChip(g.sev), ` ${g.count}${g.denied ? ' (+' + g.denied + ' denied)' : ''}`), h('td', { text: fmtBytes(g.bytes) }), h('td', { text: timeText(g.last) }), h('td', { class: open ? 'okc' : 'noc', text: open ? 'Allowed' : 'Denied' }));
  })));
  return h('div', { class: 'map-view' }, tipFor('topology', 'Select a flow and trace it.'), h('div', { class: 'mapwrap' }, svg), trace, withInspector(h('div', {}, detail, h('h3', { text: 'Traffic between zones' }), h('div', { class: 'tablewrap' }, table))));
}
function pickGroup(key) {
  ui.edgeKey = ui.edgeKey === key ? null : key;
  ui.eventId = null;
  renderView();
}
function traceTable(hops, verdict) {
  const f = ui.traceFlow;
  const rows = hops.map((hp, i) => {
    let decision = '';
    if (hp.kind === 'fw') decision = verdict.action === 'allow' ? `ALLOWED by ${verdict.rule ? `rule ${verdict.rule.id}` : 'the default policy'}` : `DENIED by ${verdict.rule ? `rule ${verdict.rule.id}` : 'the default policy'}`;
    else if (verdict.action === 'deny' && hops.findIndex((x) => x.kind === 'fw') < i) decision = 'never reached';
    else decision = i === 0 ? 'sends' : hp.kind === 'switch' ? 'forwards' : 'receives';
    const x = entity(hp.id);
    return h('tr', { class: hp.kind === 'fw' ? (verdict.action === 'allow' ? 'hop-ok' : 'hop-no') : '' }, h('td', { text: String(i + 1) }), h('td', { class: 'mono', text: hp.id }), h('td', { text: hp.kind === 'fw' ? 'Firewall' : hp.kind === 'switch' ? `${hp.zone} switch` : x ? x.role : 'Address' }), h('td', { text: decision }));
  });
  return h('div', { class: 'trace-panel' }, h('header', {}, h('strong', { text: `Trace: ${f.src} to ${f.dst}, port ${f.port}/${f.proto}` }), h('button', { class: 'x', type: 'button', 'aria-label': 'Close the trace', onclick: () => { ui.traceFlow = null; renderView(); }, text: '×' })), h('table', { class: 'links' }, h('thead', {}, h('tr', {}, ['Hop', 'Device', 'What it is', 'Result'].map((c) => h('th', { text: c })))), h('tbody', {}, rows)), h('p', { class: verdict.action === 'allow' ? 'okc' : 'noc', text: verdict.action === 'allow' ? 'This connection gets through.' : 'This connection is stopped at the firewall.' }));
}

// ── Network: firewall ───────────────────────────────────────────
function selOptions() {
  const label = (x) => `${x.id} · ${x.role}`;
  return [
    h('option', { value: '*', text: 'Anything' }),
    h('optgroup', { label: 'Zones' }, scn.net.zones.map((z) => h('option', { value: z.id, text: `${z.label} (zone)` }))),
    h('optgroup', { label: 'Machines' }, scn.entities.filter((x) => x.kind === 'host' && x.id !== scn.net.fw).map((x) => h('option', { value: x.id, text: label(x) }))),
    h('optgroup', { label: 'Internet addresses' }, scn.entities.filter((x) => x.kind === 'ip').map((x) => h('option', { value: x.id, text: label(x) }))),
  ];
}
function viewFirewall() {
  const policy = Net.currentPolicy(st);
  const status = Net.serviceStatus(scn, policy);
  const broken = status.filter((x) => !x.ok);
  const f = ui.fwForm;
  const t = ui.fwTest;
  const pick = (opts, cur, set, key) => h('select', { 'data-key': key, onchange: (ev) => set(ev.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: v === cur ? true : null, text: l })));
  const withSel = (cur, set, key) => {
    const el = h('select', { 'data-key': key, onchange: (ev) => set(ev.target.value) }, selOptions());
    el.value = cur;
    return el;
  };
  const portField = (cur, set, key, listId) => h('span', {}, h('input', { type: 'text', value: cur === '*' ? '' : cur, placeholder: 'any', size: 6, inputmode: 'numeric', list: listId, autocomplete: 'off', 'aria-label': 'Port', 'data-key': key, oninput: (ev) => set(ev.target.value.trim() === '' || /^any$/i.test(ev.target.value.trim()) ? '*' : ev.target.value.trim()) }), h('datalist', { id: listId }, scn.net.ports.map((p) => h('option', { value: String(p) }))));
  const services = h('div', { class: 'svc-grid', role: 'list', 'aria-label': 'Services' }, status.map((x) => h('div', { class: `svc-chip ${x.ok ? 'up' : 'down'}`, role: 'listitem', title: x.note }, h('strong', { text: x.label }), h('small', { text: x.ok ? 'Running' : `Broken (cost ${x.weight})` }))));
  const rows = policy.rules.map((r, i) => h('tr', { class: r.action }, h('td', { class: 'mono', text: String(i + 1) }), h('td', { class: 'mono', text: r.id }), h('td', {}, h('span', { class: `act-${r.action}`, text: r.action === 'allow' ? 'ALLOW' : 'DENY' })), h('td', { text: Net.describeSel(scn, r.src) }), h('td', { text: Net.describeSel(scn, r.dst) }), h('td', { class: 'mono', text: r.port === '*' ? 'any' : String(r.port) }), h('td', { class: 'mono', text: r.proto === '*' ? 'any' : r.proto }), h('td', { class: 'ctl' },
    h('button', { class: 'x', type: 'button', 'aria-label': `Move ${r.id} up`, disabled: i === 0 ? true : null, 'data-key': `up-${r.id}`, onclick: () => { E.fwMove(scn, st, r.id, 'up'); refresh(); }, text: '↑' }),
    h('button', { class: 'x', type: 'button', 'aria-label': `Move ${r.id} down`, disabled: i === policy.rules.length - 1 ? true : null, 'data-key': `down-${r.id}`, onclick: () => { E.fwMove(scn, st, r.id, 'down'); refresh(); }, text: '↓' }),
    h('button', { class: 'x', type: 'button', 'aria-label': `Delete ${r.id}`, 'data-key': `del-${r.id}`, onclick: () => { E.fwRemove(scn, st, r.id); refresh(); }, text: '×' }))));
  const table = h('table', { class: 'rules' }, h('thead', {}, h('tr', {}, ['#', 'Rule', 'Action', 'From', 'To', 'Port', 'Proto', ''].map((c) => h('th', { text: c })))), h('tbody', {}, rows, h('tr', { class: 'dflt' }, h('td', { colSpan: 2, text: '' }), h('td', {}, h('span', { class: `act-${policy.def}`, text: policy.def === 'allow' ? 'ALLOW' : 'DENY' })), h('td', { colSpan: 4, text: 'Everything else (the default policy)' }), h('td', { class: 'ctl' }, h('button', { class: 'btn small', type: 'button', 'data-key': 'default', onclick: () => { ui.fwMsg = null; const r = E.fwDefault(scn, st, policy.def === 'allow' ? 'deny' : 'allow'); ui.fwMsg = r.ok ? { ok: true, text: `The default policy is now ${policy.def === 'allow' ? 'deny' : 'allow'}.` } : { ok: false, text: r.text }; refresh(); }, text: policy.def === 'allow' ? 'Make deny' : 'Make allow' })))));
  const addForm = h('div', { class: 'ruleform' },
    h('label', {}, 'Action ', pick([['deny', 'Deny'], ['allow', 'Allow']], f.action, (v) => (f.action = v), 'f-action')),
    h('label', {}, 'From ', withSel(f.src, (v) => (f.src = v), 'f-src')),
    h('label', {}, 'To ', withSel(f.dst, (v) => (f.dst = v), 'f-dst')),
    h('label', {}, 'Port ', portField(f.port, (v) => (f.port = v), 'f-port', 'ports-add')),
    h('label', {}, 'Protocol ', pick([['*', 'Any'], ['tcp', 'TCP'], ['udp', 'UDP']], f.proto, (v) => (f.proto = v), 'f-proto')),
    h('label', {}, 'Position ', pick([['top', 'Top (checked first)'], ['bottom', 'Bottom (checked last)']], f.where, (v) => (f.where = v), 'f-where')),
    h('button', { class: 'btn primary', type: 'button', 'data-key': 'add-rule', onclick: () => { const r = E.fwAdd(scn, st, { action: f.action, src: f.src, dst: f.dst, port: f.port === '*' ? '*' : Number(f.port), proto: f.proto }, f.where); ui.fwMsg = r.ok ? { ok: true, text: `Added ${r.rule.id}: ${Net.ruleText(scn, r.rule)}.` } : { ok: false, text: r.text }; refresh(); }, text: `Add rule (${E.COSTS.rule} min)` }));
  const testRes = (() => {
    const flow = { src: t.src, dst: t.dst, port: Number(t.port), proto: t.proto };
    if (!entity(t.src) || !entity(t.dst) || !Number.isInteger(flow.port)) return null;
    const r = Net.decide(scn, policy, flow);
    return { flow, r };
  })();
  const tester = h('div', { class: 'tester' },
    h('div', { class: 'ruleform' },
      h('label', {}, 'From ', withSel(t.src, (v) => (t.src = v), 't-src')),
      h('label', {}, 'To ', withSel(t.dst, (v) => (t.dst = v), 't-dst')),
      h('label', {}, 'Port ', portField(t.port, (v) => (t.port = v), 't-port', 'ports-test')),
      h('label', {}, 'Protocol ', pick([['tcp', 'TCP'], ['udp', 'UDP']], t.proto, (v) => (t.proto = v), 't-proto')),
      h('button', { class: 'btn', type: 'button', 'data-key': 'run-test', onclick: renderView, text: 'Test (free)' })),
    !testRes ? h('p', { class: 'dim', text: 'Choose a specific machine or address for each end, and a port number.' }) : h('div', { class: `result ${testRes.r.action === 'allow' ? 'ok' : 'bad'}` }, h('strong', { text: `${testRes.r.action === 'allow' ? 'ALLOWED' : 'DENIED'} ${t.src} to ${t.dst}:${t.port}/${t.proto}` }), h('p', { text: testRes.r.rule ? `Matched rule ${testRes.r.rule.id}: ${Net.ruleText(scn, testRes.r.rule)}.` : `No rule matched, so the default policy (${policy.def}) applied.` }), h('button', { class: 'btn small', type: 'button', onclick: () => { ui.traceFlow = testRes.flow; setView('topology'); }, text: 'Trace it on the map' })));
  return h('div', { class: 'fw-view' }, tipFor('firewall', 'Add rules and watch the services.'),
    h('h3', { text: `Services (${status.length - broken.length} of ${status.length} running)` }), services,
    ui.fwMsg ? h('div', { class: `result ${ui.fwMsg.ok ? 'ok' : 'bad'}`, role: 'status' }, h('p', { text: ui.fwMsg.text })) : null,
    h('h3', { text: 'Rules, checked from the top' }), h('div', { class: 'tablewrap' }, table),
    h('h3', { text: 'Add a rule' }), addForm,
    h('h3', { text: 'Test a connection' }), tester);
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
