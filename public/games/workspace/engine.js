// The simulation engine behind every RootLine workspace.
//
// A workspace is a fictional workplace: a world of events and entities, a clock, some tools the player
// operates, and actions that change what happens next. This file holds the rules and nothing else, so it
// can be tested without a page. The look of each workspace and the data of each assignment live elsewhere.
//
// How it works
//   * Time is in minutes since midnight. The clock starts partway through an incident and moves on whenever
//     the player does real work (a search, opening an entity, taking an action). The attacker does not wait.
//   * An event is visible when its time has come and nothing the player did has stopped it. Past events are
//     fixed; an action only changes events that had not yet happened when it was taken.
//   * Actions have consequences: some stop the attack, some do nothing, some hurt the business.
//   * Everything the player concludes is graded against what really happened in the scenario.

import * as Net from './net.js';
import * as Cloud from './cloud.js';
import * as VM from './vm.js';
import * as GRC from './grc.js';
import * as TI from './ti.js';
import * as SE from './se.js';
import * as Eng from './eng.js';

export const COSTS = { search: 1, entity: 1, tree: 1, map: 1, action: 3, alert: 1, rule: 3, tweak: 1 };

export const pad = (n) => String(n).padStart(2, '0');
export const clockText = (t) => `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
export const parseClock = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? h * 60 + mi : null;
};

// ── Starting a run ──────────────────────────────────────────────
export function newRun(scn) {
  const st = {
    clock: scn.clockStart,
    flags: {}, // name -> the minute it was set
    log: [], // what the player did, in order
    extra: [], // events created by the player's actions (for example "host isolated")
    pins: [], // event ids pinned to the case timeline
    alerts: {}, // alert id -> { status: 'closed' | 'escalated', reason, at }
    actions: [], // { key, action, target, at, rule }
    seen: new Set(), // things already opened (so a second look costs no time)
    disruption: 0, // harm done to the business by the player's own actions
    searches: 0,
    submitted: false,
  };
  if (scn.vm) st.vm = VM.newState(scn);
  if (scn.grc) st.grc = GRC.newState();
  if (scn.ti) st.ti = TI.newState(scn);
  if (scn.se) st.se = SE.newState();
  if (scn.eng) {
    const init = Eng.initialState(scn);
    st.eng = { working: Eng.cloneState(init), prod: [{ at: -1, state: init, forced: false }], runs: [], lastPass: null, forced: 0, releases: 0, harm: [] };
  }
  if (scn.cloud) st.cloud = { history: [{ at: -1, applied: [] }] };
  if (scn.net) st.fw = { history: [{ at: -1, policy: Net.initialPolicy(scn) }], next: scn.net.rules.length + 1 };
  return st;
}

const flagName = (action, target) => `${action}:${target}`;

// ── Events ──────────────────────────────────────────────────────
function suppressed(e, st, scn) {
  if (scn && scn.net && e.flow && Net.decide(scn, Net.policyAt(st, e.t), e.flow).action === 'deny') return true;
  if (scn && scn.cloud && e.access && !Cloud.can(scn, Cloud.stateAtTime(scn, st, e.t), e.access.who, e.access.resource, e.access.action)) return true;
  // Aftermath: an event that only happens if the player did something earlier (for example, helped an attacker).
  if (e.when && !e.when.some((f) => st.flags[f] !== undefined && st.flags[f] <= e.t)) return true;
  if (scn && scn.eng && e.unlessProd && e.unlessProd.some((c) => Eng.holds(c, prodAt(st, e.t)))) return true;
  if (!e.unless) return false;
  return e.unless.some((f) => st.flags[f] !== undefined && st.flags[f] <= e.t);
}

// What is deployed to production at a given minute: the last release at or before it.
export function prodAt(st, t) {
  let cur = st.eng.prod[0].state;
  for (const r of st.eng.prod) if (r.at <= t) cur = r.state;
  return cur;
}
export const prodNow = (st) => st.eng.prod[st.eng.prod.length - 1].state;

// Evidence that lives on a machine the attacker can still reach. Once the event named in `lostBy` has
// happened, it can no longer be seen, unless something in `keptBy` was done before that moment.
const indexes = new WeakMap();
const byId = (scn) => {
  if (!indexes.has(scn)) indexes.set(scn, new Map(scn.events.map((e) => [e.id, e])));
  return indexes.get(scn);
};
function lost(scn, e, st) {
  const kept = (t) => (e.keptBy || []).some((f) => st.flags[f] !== undefined && st.flags[f] <= t);
  // Destroyed by something the player did (for example rebuilding the machine).
  for (const f of e.lostWhen || []) if (st.flags[f] !== undefined && !kept(st.flags[f])) return true;
  if (!e.lostBy) return false;
  const w = byId(scn).get(e.lostBy);
  if (!w || w.t > st.clock || suppressed(w, st, scn)) return false;
  return !kept(w.t);
}

// Every event the player can see right now (scenario events whose time has come, plus the player's own).
export function visibleEvents(scn, st) {
  const out = [];
  for (const e of scn.events) {
    if (e.t > st.clock) continue;
    if (suppressed(e, st, scn)) {
      // A flow the firewall stopped shows up as a denied connection, so the player can see their rule working.
      if (scn.net && e.flow && e.t <= st.clock) {
        const d = Net.decide(scn, Net.policyAt(st, e.t), e.flow);
        out.push({ id: `deny-${e.id}`, t: e.t, type: 'firewall', sev: 'info', host: scn.net.fw, summary: `Firewall denied ${e.flow.src} to ${e.flow.dst}:${e.flow.port}/${e.flow.proto} (${d.rule ? 'rule ' + d.rule.id : 'default policy'})`, fields: { src: e.flow.src, dst: e.flow.dst, port: e.flow.port, proto: e.flow.proto, szone: e.fields.szone, dzone: e.fields.dzone, action: 'deny', rule: d.rule ? d.rule.id : 'default' }, synthetic: true, denied: e.id });
      }
      if (scn.cloud && e.access && e.t <= st.clock) {
        out.push({ id: `deny-${e.id}`, t: e.t, type: 'denied', sev: 'info', host: e.host, summary: `Access denied: ${e.fields.actor} tried to ${e.fields.action} ${e.fields.resource} (a fix you applied removed that access)`, fields: { actor: e.fields.actor, action: e.fields.action, resource: e.fields.resource, result: 'denied', src: e.fields.src }, synthetic: true, denied: e.id });
      }
      continue;
    }
    if (!lost(scn, e, st)) out.push(e);
  }
  for (const e of st.extra) out.push(e);
  return out.sort((a, b) => a.t - b.t || String(a.id).localeCompare(String(b.id)));
}

// Events that would have happened by now but were stopped by something the player did.
export function preventedEvents(scn, st) {
  return scn.events.filter((e) => suppressed(e, st, scn) && e.t > 0);
}

export const eventById = (scn, st, id) => visibleEvents(scn, st).find((e) => e.id === id) || null;

// ── Search ──────────────────────────────────────────────────────
// Query words: user:priya.n host:WS-FIN-07 ip:203.0.113.44 proc:powershell type:logon sev:high file:zip
// Anything else is plain text, matched against the summary and every field. All words must match.
const FIELD_ALIASES = { user: ['user'], host: ['host'], type: ['type'], sev: ['sev'], proc: ['proc', 'parent'], file: ['file'], ip: ['dst', 'src', 'ip'], dst: ['dst'], src: ['src'], domain: ['domain', 'dst'], from: ['from'], to: ['to'], port: ['port'], proto: ['proto'], zone: ['szone', 'dzone'], actor: ['actor'], action: ['action'], resource: ['resource'], auth: ['auth'], region: ['region'] };

export function parseQuery(q) {
  const words = String(q || '').trim().split(/\s+/).filter(Boolean);
  const terms = [];
  for (const w of words) {
    const m = /^([a-z]+):(.+)$/i.exec(w);
    if (m && FIELD_ALIASES[m[1].toLowerCase()]) terms.push({ key: m[1].toLowerCase(), value: m[2].toLowerCase() });
    else terms.push({ key: null, value: w.toLowerCase() });
  }
  return terms;
}

function valueOf(e, key) {
  if (key === 'user') return e.user || '';
  if (key === 'host') return e.host || '';
  if (key === 'type') return e.type || '';
  if (key === 'sev') return e.sev || '';
  const f = e.fields || {};
  return (FIELD_ALIASES[key] || [key]).map((k) => (k === 'user' || k === 'host' || k === 'type' || k === 'sev' ? e[k] : f[k]) ?? '').join(' ');
}

const haystack = (e) => `${e.summary} ${e.user || ''} ${e.host || ''} ${e.type || ''} ${Object.values(e.fields || {}).join(' ')}`.toLowerCase();

export function matches(e, terms) {
  return terms.every((t) => {
    if (!t.key) return haystack(e).includes(t.value);
    return valueOf(e, t.key).toLowerCase().includes(t.value);
  });
}

// Run a search. `filters` may add { from, to } (minutes), { sev: [...] } and { types: [...] }.
// Each search costs a minute, because the analyst is waiting on the log platform.
export function search(scn, st, query, filters = {}) {
  const terms = parseQuery(query);
  let rows = visibleEvents(scn, st).filter((e) => matches(e, terms));
  if (Number.isFinite(filters.from)) rows = rows.filter((e) => e.t >= filters.from);
  if (Number.isFinite(filters.to)) rows = rows.filter((e) => e.t <= filters.to);
  if (filters.sev && filters.sev.length) rows = rows.filter((e) => filters.sev.includes(e.sev));
  if (filters.types && filters.types.length) rows = rows.filter((e) => filters.types.includes(e.type));
  st.searches += 1;
  advance(st, COSTS.search, `Searched logs: ${String(query || '').trim() || '(everything)'}`);
  return rows;
}

// ── Time ────────────────────────────────────────────────────────
export function advance(st, minutes, why) {
  st.clock += minutes;
  if (why) st.log.push({ t: st.clock, kind: 'work', text: why });
}

// ── Entities and graphs ─────────────────────────────────────────
export const entityList = (scn, kind) => scn.entities.filter((x) => !kind || x.kind === kind);
export const entityById = (scn, id) => scn.entities.find((x) => x.id === id) || null;

// What the player sees when they open an entity: its profile, its state and its recent activity.
export function openEntity(scn, st, id) {
  const ent = entityById(scn, id);
  if (!ent) return null;
  const key = `entity:${id}`;
  const first = !st.seen.has(key);
  if (first) {
    st.seen.add(key);
    advance(st, COSTS.entity, `Opened ${ent.kind} ${ent.id}`);
  }
  const ev = visibleEvents(scn, st).filter((e) => e.user === id || e.host === id || Object.values(e.fields || {}).some((v) => String(v).includes(id)));
  const state = [];
  if (st.flags[flagName('isolate', id)] !== undefined) state.push('Isolated from the network');
  if (st.flags[flagName('disable', id)] !== undefined) state.push('Account disabled');
  if (st.flags[flagName('reset', id)] !== undefined) state.push('Password reset');
  if (st.flags[flagName('block-ip', id)] !== undefined) state.push('Blocked at the firewall');
  if (st.flags[flagName('block-domain', id)] !== undefined) state.push('Blocked at the proxy');
  return { entity: ent, events: ev, count: ev.length, last: ev.length ? ev[ev.length - 1].t : null, state, first };
}

// Process tree for a host: process events linked by pid/ppid, up to now.
export function processTree(scn, st, host) {
  const key = `tree:${host}`;
  if (!st.seen.has(key)) {
    st.seen.add(key);
    advance(st, COSTS.tree, `Opened the process tree for ${host}`);
  }
  const procs = visibleEvents(scn, st).filter((e) => e.host === host && e.fields && e.fields.pid !== undefined);
  const nodes = new Map();
  for (const e of procs) nodes.set(e.fields.pid, { pid: e.fields.pid, ppid: e.fields.ppid, name: e.fields.proc, cmd: e.fields.cmd || '', t: e.t, event: e, children: [], sev: e.sev });
  const roots = [];
  for (const n of nodes.values()) {
    const parent = nodes.get(n.ppid);
    if (parent) parent.children.push(n);
    else roots.push(n);
  }
  return roots;
}

// Network map: which hosts talked to which addresses, up to now. Edges are counted, with the latest time.
export function networkEdges(scn, st) {
  const key = 'map';
  if (!st.seen.has(key)) {
    st.seen.add(key);
    advance(st, COSTS.map, 'Opened the network map');
  }
  const edges = new Map();
  for (const e of visibleEvents(scn, st)) {
    if (e.type !== 'network' || !e.host || !e.fields || !e.fields.dst) continue;
    const k = `${e.host}>${e.fields.dst}`;
    const cur = edges.get(k) || { from: e.host, to: e.fields.dst, count: 0, bytes: 0, last: 0, sev: 'info', events: [] };
    cur.count += 1;
    cur.bytes += Number(e.fields.bytes || 0);
    cur.last = Math.max(cur.last, e.t);
    cur.events.push(e.id);
    if (rank(e.sev) > rank(cur.sev)) cur.sev = e.sev;
    edges.set(k, cur);
  }
  return [...edges.values()];
}
export const rank = (s) => ({ info: 0, low: 1, medium: 2, high: 3, critical: 4 }[s] ?? 0);

// ── Alerts ──────────────────────────────────────────────────────
export const alertsNow = (scn, st) => scn.alerts.filter((a) => a.at <= st.clock);

// status: 'closed' (with a reason) or 'escalated' (into the incident)
export function triage(scn, st, id, status, reason) {
  const a = scn.alerts.find((x) => x.id === id);
  if (!a || a.at > st.clock) return null;
  if (!['closed', 'escalated'].includes(status)) return null;
  st.alerts[id] = { status, reason: reason || '', at: st.clock };
  advance(st, COSTS.alert, `${status === 'closed' ? 'Closed' : 'Escalated'} alert: ${a.title}`);
  return st.alerts[id];
}

// ── Pinned evidence ─────────────────────────────────────────────
export function pin(st, id) {
  if (!st.pins.includes(id)) st.pins.push(id);
}
export function unpin(st, id) {
  st.pins = st.pins.filter((x) => x !== id);
}

// ── Response actions ────────────────────────────────────────────
// A response is an action on a target. The scenario lists the ones that matter; anything else uses the
// generic rule for that kind of action (usually harmless, sometimes it hurts the business).
export function ruleFor(scn, action, target) {
  const exact = scn.responses.find((r) => r.action === action && r.target === target);
  if (exact) return exact;
  const def = scn.defaults[action];
  return def ? { action, target, ...def, generic: true } : null;
}

export function perform(scn, st, action, target) {
  const def = scn.actions.find((a) => a.id === action);
  if (!def) return { ok: false, reason: 'unknown action' };
  const key = flagName(action, target);
  if (st.flags[key] !== undefined) return { ok: false, reason: 'already done', text: `${def.label} on ${target} has already been done.` };
  const rule = ruleFor(scn, action, target);
  if (!rule) return { ok: false, reason: 'not possible' };
  if ((rule.blockedBy || []).some((f) => st.flags[f] !== undefined)) return { ok: false, reason: 'blocked', text: rule.blockedText || 'That is no longer possible.' };

  st.flags[key] = st.clock;
  for (const f of rule.sets || []) if (st.flags[f] === undefined) st.flags[f] = st.clock;
  if (rule.harm) st.disruption += rule.harm;
  st.actions.push({ key, action, target, at: st.clock, rule });
  const when = st.clock;
  const ev = {
    id: `act-${st.actions.length}`,
    t: when,
    host: def.targetKind === 'host' ? target : undefined,
    user: def.targetKind === 'user' ? target : undefined,
    type: 'response',
    sev: 'info',
    summary: `${def.label}: ${target} (by you)`,
    fields: {},
    synthetic: true,
  };
  st.extra.push(ev);
  for (const x of rule.effects || []) st.extra.push({ id: `fx-${st.extra.length}`, t: when, type: x.type || 'response', sev: x.sev || 'info', host: x.host, user: x.user, summary: x.summary, fields: x.fields || {}, synthetic: true });
  advance(st, def.cost ?? COSTS.action, `${def.label}: ${target}`);
  return { ok: true, rule, text: rule.text, harm: rule.harm || 0 };
}

// ── Firewall ────────────────────────────────────────────────────
// Every edit makes a new version of the policy, stamped with the time. A connection is judged by the policy in
// force when it happened, so a new rule stops what comes next and never rewrites the past.
function pushPolicy(scn, st, policy, minutes, why) {
  st.fw.history.push({ at: st.clock, policy });
  advance(st, minutes, why);
}
export function fwAdd(scn, st, spec, where = 'top') {
  const bad = Net.checkRule(scn, spec);
  if (bad) return { ok: false, text: bad };
  const rule = { id: `R${st.fw.next++}`, action: spec.action, src: spec.src, dst: spec.dst, port: spec.port, proto: spec.proto, mine: true };
  const p = Net.clonePolicy(Net.currentPolicy(st));
  if (where === 'bottom') p.rules.push(rule);
  else p.rules.unshift(rule);
  pushPolicy(scn, st, p, COSTS.rule, `Firewall: ${Net.ruleText(scn, rule)}`);
  return { ok: true, rule };
}
export function fwRemove(scn, st, id) {
  const p = Net.clonePolicy(Net.currentPolicy(st));
  const i = p.rules.findIndex((r) => r.id === id);
  if (i < 0) return { ok: false, text: 'No such rule.' };
  const [gone] = p.rules.splice(i, 1);
  pushPolicy(scn, st, p, COSTS.tweak, `Firewall: removed ${gone.id}`);
  return { ok: true };
}
export function fwMove(scn, st, id, dir) {
  const p = Net.clonePolicy(Net.currentPolicy(st));
  const i = p.rules.findIndex((r) => r.id === id);
  const j = i + (dir === 'up' ? -1 : 1);
  if (i < 0 || j < 0 || j >= p.rules.length) return { ok: false, text: 'It cannot move that way.' };
  [p.rules[i], p.rules[j]] = [p.rules[j], p.rules[i]];
  pushPolicy(scn, st, p, COSTS.tweak, `Firewall: moved ${id} ${dir}`);
  return { ok: true };
}
export function fwDefault(scn, st, def) {
  if (!['allow', 'deny'].includes(def)) return { ok: false, text: 'Choose allow or deny.' };
  const p = Net.clonePolicy(Net.currentPolicy(st));
  if (p.def === def) return { ok: false, text: 'That is already the default.' };
  p.def = def;
  pushPolicy(scn, st, p, COSTS.rule, `Firewall: default policy is now ${def}`);
  return { ok: true };
}
export const fwTest = (scn, st, flow) => Net.decide(scn, Net.currentPolicy(st), flow);

// ── Cloud fixes ─────────────────────────────────────────────────
// A fix is one named change. Only one fix may stand on each target; undo it first to try a different one.
export function cloudFix(scn, st, id) {
  const fix = Cloud.fixById(scn, id);
  if (!fix) return { ok: false, text: 'No such fix.' };
  const cur = Cloud.currentApplied(st);
  if (cur.includes(id)) return { ok: false, text: 'That fix is already applied.' };
  const clash = cur.map((x) => Cloud.fixById(scn, x)).find((f) => f && f.target === fix.target);
  if (clash) return { ok: false, text: `"${clash.label}" is already applied to this. Undo it first to try a different fix.` };
  st.cloud.history.push({ at: st.clock, applied: [...cur, id] });
  advance(st, fix.cost ?? COSTS.rule, `Fix: ${fix.label}`);
  return { ok: true, fix };
}
export function cloudUndo(scn, st, id) {
  const cur = Cloud.currentApplied(st);
  if (!cur.includes(id)) return { ok: false, text: 'That fix is not applied.' };
  st.cloud.history.push({ at: st.clock, applied: cur.filter((x) => x !== id) });
  advance(st, COSTS.tweak, `Undid fix: ${Cloud.fixById(scn, id).label}`);
  return { ok: true };
}

// ── Vulnerability management ────────────────────────────────────
const hourMinutes = (scn) => scn.vm.hourMinutes || 6;
export function vmInspect(scn, st, id) {
  const f = scn.vm.findings.find((x) => x.id === id);
  if (!f) return null;
  const key = `finding:${id}`;
  const first = !st.seen.has(key);
  if (first) {
    st.seen.add(key);
    advance(st, COSTS.entity, `Opened finding ${id}`);
  }
  return { finding: f, first };
}
export const vmInspected = (st, id) => st.seen.has(`finding:${id}`);

// A dry run in the test environment costs an hour of budget (once per option) and reveals whether the change works.
export function vmDry(scn, st, id, optionId) {
  const f = scn.vm.findings.find((x) => x.id === id);
  const o = f && VM.optionOf(f, optionId);
  if (!o) return { ok: false, text: 'No such option.' };
  const key = `${id}:${optionId}`;
  if (st.vm.dry[key]) return { ok: true, text: st.vm.dry[key], again: true };
  if (VM.remaining(scn, st) < 1) return { ok: false, text: 'There is no budget left for a test run.' };
  st.vm.spent += 1;
  st.vm.dry[key] = o.dry || 'Test environment: the change applies cleanly and nothing else is affected.';
  advance(st, 3, `Dry run: ${id} ${o.label}`);
  return { ok: true, text: st.vm.dry[key] };
}

// Commit to a decision. Remediations spend budget and take time; accepting, deferring and marking a false positive
// are free. A change that breaks something is rolled back, costs the rollback time and harms the business, and does
// not fix the finding.
export function vmDecide(scn, st, id, optionId) {
  const f = scn.vm.findings.find((x) => x.id === id);
  const o = f && VM.findOption(f, optionId);
  if (!o) return { ok: false, text: 'No such option.' };
  const cur = st.vm.decisions[id];
  if (cur && cur.kind === 'done') return { ok: false, text: 'This finding has already been remediated.' };
  if ((st.vm.failed[id] || []).includes(optionId)) return { ok: false, text: 'That change already failed and was rolled back.' };
  if (o.cost > VM.remaining(scn, st)) return { ok: false, text: `Not enough budget: that costs ${o.cost} h and ${VM.remaining(scn, st)} h are left.` };
  if (!o.cost) {
    st.vm.decisions[id] = { kind: o.kind, option: o.id, at: st.clock };
    advance(st, COSTS.alert, `${f.id}: ${o.label}`);
    return { ok: true, text: o.kind === 'accept' ? 'Recorded. The risk is accepted: it will be reviewed at the next cycle.' : o.kind === 'defer' ? 'Recorded. It goes to the next patch window.' : 'Recorded as a false positive.' };
  }
  st.vm.spent += o.cost;
  if (o.breaks) {
    st.vm.spent += o.breaks.rollback || 0;
    st.disruption += o.breaks.harm || 0;
    st.vm.failed[id] = [...(st.vm.failed[id] || []), optionId];
    st.vm.harm.push({ label: `${f.id}: ${o.label} broke something`, harm: o.breaks.harm || 0, text: o.breaks.text });
    st.vm.decisions[id] = { kind: 'failed', option: o.id, at: st.clock };
    advance(st, (o.cost + (o.breaks.rollback || 0)) * hourMinutes(scn), `${f.id}: ${o.label} (rolled back)`);
    return { ok: true, failed: true, text: o.breaks.text };
  }
  advance(st, o.cost * hourMinutes(scn), `${f.id}: ${o.label}`);
  st.vm.decisions[id] = { kind: 'done', option: o.id, at: st.clock };
  for (const fl of o.sets || []) if (st.flags[fl] === undefined) st.flags[fl] = st.clock;
  if (o.harm) {
    st.disruption += o.harm;
    st.vm.harm.push({ label: `${f.id}: ${o.label}`, harm: o.harm, text: o.harmText || 'The change has a side effect on the business.' });
  }
  return { ok: true, text: o.done || 'Done.', harm: o.harm || 0 };
}

// ── Governance, risk and compliance ─────────────────────────────
export function grcOpenDoc(scn, st, fid, did) {
  const f = scn.grc.findings.find((x) => x.id === fid);
  const d = f && f.docs.find((x) => x.id === did);
  if (!d) return null;
  const list = (st.grc.docs[fid] = st.grc.docs[fid] || []);
  const first = !list.includes(did);
  if (first) {
    list.push(did);
    advance(st, 4, `Read ${fid}: ${d.title}`);
  }
  return { doc: d, first };
}
export function grcRate(scn, st, fid, L, I) {
  const f = scn.grc.findings.find((x) => x.id === fid);
  if (!f || ![L, I].every((v) => Number.isInteger(v) && v >= 1 && v <= 5)) return { ok: false, text: 'Likelihood and impact are each from 1 to 5.' };
  st.grc.rate[fid] = { L, I };
  advance(st, 1, `Rated ${fid}: ${L} x ${I}`);
  return { ok: true };
}
export function grcOwner(scn, st, fid, role) {
  if (!scn.grc.findings.some((x) => x.id === fid) || !scn.grc.owners.includes(role)) return { ok: false, text: 'Choose an owner from the list.' };
  st.grc.owner[fid] = role;
  advance(st, 1, `Assigned ${fid} to ${role}`);
  return { ok: true };
}
export function grcMap(scn, st, control, req, on) {
  if (!scn.grc.controls.some((c) => c.id === control) || !scn.grc.requirements.some((r) => r.id === req)) return { ok: false };
  GRC.toggleMap(st, control, req, on);
  return { ok: true };
}
export function grcTreat(scn, st, fid, optionId) {
  const f = scn.grc.findings.find((x) => x.id === fid);
  const o = f && GRC.findOption(f, optionId);
  if (!o) return { ok: false, text: 'No such option.' };
  const cur = st.grc.treat[fid];
  if (cur && cur.kind === 'done') return { ok: false, text: 'This finding has already been dealt with.' };
  if ((st.grc.failed[fid] || []).includes(optionId)) return { ok: false, text: 'That has already been tried and rejected.' };
  if (o.cost > GRC.remaining(scn, st)) return { ok: false, text: `Not enough budget: that costs £${o.cost}k and £${GRC.remaining(scn, st)}k is left.` };
  const reject = (harm, text) => {
    st.grc.failed[fid] = [...(st.grc.failed[fid] || []), optionId];
    st.grc.treat[fid] = { kind: 'failed', option: optionId, at: st.clock };
    st.disruption += harm;
    st.grc.harm.push({ label: `${f.id}: the auditor rejected your challenge`, harm, text });
    advance(st, 5, `${fid}: challenge rejected`);
    return { ok: true, failed: true, text };
  };
  if (o.kind === 'accept') {
    st.grc.treat[fid] = { kind: 'accept', option: o.id, at: st.clock };
    advance(st, 1, `${fid}: accepted`);
    return { ok: true, text: 'Recorded. The owner signs the risk off and it is reviewed next cycle.' };
  }
  if (o.kind === 'challenge') {
    if (!f.challenge) return reject(2, 'The auditor looks at the evidence and rejects the challenge: the finding is sound. Challenging something real costs you credibility with the audit team.');
    if (!f.challenge.valid) return reject(2, f.challenge.rejected || 'The auditor rejects the challenge.');
    if (!GRC.hasDoc(st, fid, f.challenge.proof)) return { ok: false, text: 'You have no evidence in hand. Open the documents for this finding first: the auditor will only accept evidence you can show them.' };
    st.grc.treat[fid] = { kind: 'done', option: 'challenge', at: st.clock };
    if (st.flags[`plan:${fid}`] === undefined) st.flags[`plan:${fid}`] = st.clock;
    advance(st, 5, `${fid}: challenge accepted`);
    return { ok: true, text: f.challenge.accepted };
  }
  st.grc.spent += o.cost;
  advance(st, o.cost * 2, `${fid}: ${o.label}`);
  st.grc.treat[fid] = { kind: 'done', option: o.id, at: st.clock };
  for (const fl of o.sets || []) if (st.flags[fl] === undefined) st.flags[fl] = st.clock;
  return { ok: true, text: o.done || 'Done.' };
}

// ── Threat intelligence ─────────────────────────────────────────
// Handing in the finished piece of work. Events can depend on it having been handed in by a deadline.
export function submit(st) {
  if (st.flags.submitted === undefined) st.flags.submitted = st.clock;
}
export function tiRead(scn, st, rid) {
  const r = scn.ti.reports.find((x) => x.id === rid);
  if (!r) return null;
  const first = !TI.reportRead(st, rid);
  if (first) {
    st.ti.read.push(rid);
    advance(st, 5, `Read: ${r.title}`);
  }
  return { report: r, first };
}
export function tiRate(scn, st, rid, rel, cred) {
  if (!TI.reportRead(st, rid)) return { ok: false, text: 'Read the report before you rate it.' };
  if (!TI.REL.some((x) => x[0] === rel) || !TI.CRED.some((x) => x[0] === cred)) return { ok: false, text: 'Choose a reliability and a credibility.' };
  st.ti.rate[rid] = { rel, cred };
  return { ok: true };
}
export function tiClaim(scn, st, cid, cls) {
  const c = scn.ti.claims.find((x) => x.id === cid);
  if (!c || !TI.reportRead(st, c.report)) return { ok: false, text: 'Read the report that makes this claim first.' };
  if (!TI.CLASSES.some((x) => x[0] === cls)) return { ok: false, text: 'Choose what kind of statement this is.' };
  st.ti.claim[cid] = cls;
  return { ok: true };
}
export function tiEnrich(scn, st, iid) {
  const i = scn.ti.indicators.find((x) => x.id === iid);
  if (!i || !TI.visibleIndicators(scn, st).includes(i)) return { ok: false, text: 'You have not seen that indicator yet.' };
  if (st.ti.enriched.includes(iid)) return { ok: true, again: true, indicator: i };
  if (st.ti.credits < 1) return { ok: false, text: 'No lookup credits left. Choose what to look up with care.' };
  st.ti.credits -= 1;
  st.ti.enriched.push(iid);
  advance(st, 2, `Looked up ${i.value}`);
  return { ok: true, indicator: i };
}
export function tiLink(scn, st, a, b, basis) {
  const vis = TI.visibleIndicators(scn, st).map((x) => x.id);
  if (!vis.includes(a) || !vis.includes(b) || a === b) return { ok: false, text: 'Choose two different indicators you have seen.' };
  if (!TI.BASES.some((x) => x[0] === basis)) return { ok: false, text: 'Say why they are linked.' };
  if (TI.hasLink(st, a, b)) return { ok: false, text: 'Those two are already linked.' };
  st.ti.links.push({ a, b, basis });
  advance(st, 1, `Linked ${a} and ${b}`);
  return { ok: true };
}
export function tiUnlink(scn, st, a, b) {
  const n = st.ti.links.length;
  st.ti.links = st.ti.links.filter((l) => TI.pairKey(l.a, l.b) !== TI.pairKey(a, b));
  return { ok: st.ti.links.length < n };
}

// ── Social engineering at the service desk ──────────────────────
// A contact who waited too long gives up. A real colleague left hanging is harm to the business; an attacker simply
// tries another route, which is no credit to the agent.
export function seSweep(scn, st) {
  const gone = [];
  for (const c of SE.arrived(scn, st)) {
    if (st.se.decisions[c.id] || st.clock <= c.at + c.patience) continue;
    st.se.decisions[c.id] = { action: 'left', at: c.at + c.patience };
    if (c.genuine) {
      const harm = c.leftHarm ?? 2;
      st.disruption += harm;
      st.se.harm.push({ label: `${c.from} gave up waiting`, harm, text: c.leftText || 'A real colleague was left without help.' });
    }
    gone.push(c);
  }
  return gone;
}
export function seTool(scn, st, cid, tool) {
  const c = SE.arrived(scn, st).find((x) => x.id === cid);
  if (!c) return { ok: false, text: 'That contact is not waiting.' };
  const t = SE.toolOf(c, tool);
  if (!t) return { ok: false, text: 'That check is not possible for this contact.' };
  if (st.se.decisions[cid]) return { ok: false, text: 'You have already dealt with this contact.' };
  if (SE.usedTools(st, cid).includes(tool)) return { ok: true, again: true, tool: t };
  st.se.used[cid] = [...SE.usedTools(st, cid), tool];
  advance(st, t.cost ?? 1, `${c.from}: ${SE.label(SE.TOOLS, tool)}`);
  return { ok: true, tool: t };
}
export function seAct(scn, st, cid, action) {
  const c = SE.arrived(scn, st).find((x) => x.id === cid);
  const o = c && c.actions[action];
  if (!o) return { ok: false, text: 'That cannot be done.' };
  if (st.se.decisions[cid]) return { ok: false, text: 'You have already dealt with this contact.' };
  st.se.decisions[cid] = { action, at: st.clock, verified: SE.strongUsed(c, st) };
  if (o.harm) {
    st.disruption += o.harm;
    st.se.harm.push({ label: `${c.from}: ${SE.label(SE.ACTIONS, action).toLowerCase()}`, harm: o.harm, text: o.text });
  }
  if (o.breach) st.se.breaches += 1;
  for (const f of o.sets || []) if (st.flags[f] === undefined) st.flags[f] = st.clock;
  advance(st, 2, `${c.from}: ${SE.label(SE.ACTIONS, action)}`);
  return { ok: true, text: o.text, harm: o.harm || 0, breach: !!o.breach };
}
export function seWait(scn, st) {
  const next = scn.se.contacts.map((c) => c.at).filter((t) => t > st.clock).sort((a, b) => a - b)[0];
  const by = next ? next - st.clock : 15;
  advance(st, by, 'Waited for the next contact');
  return { minutes: by, next: !!next };
}

// ── Security engineering ────────────────────────────────────────
// Edits change the working copy only. A pipeline run tests it, and a release puts it into production.
export function engSet(scn, st, id, value) {
  const found = Eng.settingOf(scn, id);
  if (!found) return { ok: false, text: 'No such setting.' };
  const s = found.setting;
  let v = value;
  if (s.type === 'toggle') v = value === true || value === 'true';
  else if (s.type === 'number') {
    v = Number(value);
    if (!Number.isInteger(v) || v < 0) return { ok: false, text: 'Enter a whole number of 0 or more.' };
  } else if (!s.options.includes(value)) return { ok: false, text: 'Choose one of the options.' };
  if (st.eng.working.cfg[id] === v) return { ok: true, same: true };
  st.eng.working.cfg[id] = v;
  advance(st, 1, `Set ${id} to ${v}`);
  return { ok: true };
}
export function engEdge(scn, st, id, allow) {
  if (!scn.eng.edges.some((e) => e.id === id)) return { ok: false, text: 'No such connection.' };
  if (st.eng.working.edges[id] === !!allow) return { ok: true, same: true };
  st.eng.working.edges[id] = !!allow;
  advance(st, 1, `${allow ? 'Allowed' : 'Blocked'} connection ${id}`);
  return { ok: true };
}
export function engDiscard(scn, st) {
  st.eng.working = Eng.cloneState(prodNow(st));
  advance(st, 1, 'Discarded the working changes');
  return { ok: true };
}
export function engRun(scn, st) {
  const res = Eng.runPipeline(scn, st.eng.working);
  const key = Eng.stateKey(st.eng.working);
  advance(st, scn.eng.runMinutes, 'Ran the pipeline');
  const run = { at: st.clock, key, passed: res.passed, stages: res.stages };
  st.eng.runs.push(run);
  st.eng.lastPass = res.passed ? key : null;
  return { ok: true, run };
}
// A normal release needs a passing run on exactly this config. A forced release skips the pipeline entirely.
export function engRelease(scn, st, force = false) {
  const w = st.eng.working;
  if (Eng.sameState(w, prodNow(st))) return { ok: false, text: 'Nothing has changed: production already has this configuration.' };
  if (!force && st.eng.lastPass !== Eng.stateKey(w)) return { ok: false, text: 'The pipeline has not passed on this exact configuration. Run it again, or force the release in an emergency.' };
  advance(st, scn.eng.releaseMinutes, force ? 'Forced release to production' : 'Released to production');
  st.eng.prod.push({ at: st.clock, state: Eng.cloneState(w), forced: force });
  st.eng.releases += 1;
  let note = '';
  if (force) {
    st.eng.forced += 1;
    const broken = Eng.featureResults(scn, w).filter((f) => !f.ok);
    if (broken.length) {
      const harm = broken.reduce((n, f) => n + f.weight, 0) / 2;
      st.disruption += harm;
      st.eng.harm.push({ label: `Forced release broke: ${broken.map((f) => f.label).join('; ')}`, harm, text: 'A release that skipped the pipeline put broken features into production.' });
      note = ` It broke ${broken.length} feature${broken.length === 1 ? '' : 's'} that the integration tests would have caught.`;
    }
  }
  return { ok: true, text: `Released.${note}`, forced: force };
}

// What the state of the estate says about the scenario's threats and the services that must keep working.
export function stateChecks(scn, st) {
  if (scn.net) {
    const pol = Net.currentPolicy(st);
    return { threats: Net.threatStatus(scn, pol), services: Net.serviceStatus(scn, pol) };
  }
  if (scn.cloud) {
    const state = Cloud.stateNow(scn, st);
    return { threats: Cloud.threatStatus(scn, state), services: Cloud.needStatus(scn, state) };
  }
  return null;
}

// Harm the business suffers right now: what the player's actions cost plus every service the firewall now blocks.
export const budgetLeft = (scn, st) => (scn.vm ? VM.remaining(scn, st) : scn.grc ? GRC.remaining(scn, st) : null);
export const budgetText = (scn, st) => (scn.vm ? `${VM.remaining(scn, st)} h` : scn.grc ? `£${GRC.remaining(scn, st)}k` : '');
export const disruptionNow = (scn, st) => st.disruption + (stateChecks(scn, st) || { services: [] }).services.reduce((n, x) => n + (x.ok ? 0 : x.weight), 0);

// ── What happened that the player did not stop ──────────────────
// Events with a `consequence` that actually occurred (not suppressed) by the end of the run.
export function consequences(scn, st, atClock = st.clock) {
  // atClock can be later than the player's own clock: what would happen once they stop working.
  const probe = { ...st, clock: atClock };
  return scn.events.filter((e) => e.consequence && e.t <= atClock && !suppressed(e, probe, scn));
}

// ── Grading ─────────────────────────────────────────────────────
// report: { verdict, severity, hosts: [], users: [], cause, summary }
export function grade(scn, st, report) {
  const g = scn.grading;
  const lines = [];
  const add = (group, label, points, max, note) => lines.push({ group, label, points: Math.round(points * 10) / 10, max, note: note || '' });

  // Triage. Alerts that only appear if the attack went unchecked count only when the player saw them.
  let tri = 0;
  const base = scn.alerts.filter((x) => !x.late);
  const each = base.length ? g.triage / base.length : 0;
  for (const a of scn.alerts) {
    const got = st.alerts[a.id];
    if (a.late && !got) continue;
    const want = a.truth;
    if (!got) add('Triage', `Alert not handled: ${a.title}`, 0, each, 'Every alert needs a decision.');
    else if (want === 'incident' && got.status === 'escalated') {
      tri += each;
      add('Triage', `Escalated correctly: ${a.title}`, each, each);
    } else if (want === 'benign' && got.status === 'closed') {
      tri += each;
      add('Triage', `Closed correctly: ${a.title}`, each, each, a.why || '');
    } else if (want === 'incident') add('Triage', `Missed a real alert: ${a.title}`, 0, each, a.why || 'This alert was part of the incident.');
    else {
      tri += each * 0.4;
      add('Triage', `Escalated a false alarm: ${a.title}`, each * 0.4, each, a.why || 'This had an innocent explanation.');
    }
  }
  if (scn.vm) {
    const per = g.triage / scn.vm.findings.length;
    for (const f of scn.vm.findings) {
      const d = st.vm.decisions[f.id];
      const label = `${f.id} ${f.title}`;
      if (!d || d.kind === 'failed') {
        add('Triage', `Not dealt with: ${label}`, 0, per, f.why || 'Every finding needs a decision.');
        continue;
      }
      const o = VM.findOption(f, d.option);
      if (f.good.includes(d.option)) {
        tri += per;
        add('Triage', `${o.label}: ${label}`, per, per, f.why);
      } else if ((f.fine || []).includes(d.option)) {
        tri += per * 0.5;
        add('Triage', `${o.label}: ${label}`, per * 0.5, per, f.why);
      } else add('Triage', `${o.label}: ${label}`, 0, per, f.why);
    }
  }
  if (scn.grc) {
    const per = g.triage / scn.grc.findings.length;
    for (const f of scn.grc.findings) {
      const d = st.grc.treat[f.id];
      const label = `${f.id} ${f.title}`;
      const o = d && d.kind !== 'failed' ? GRC.findOption(f, d.option) : null;
      const treat = !o ? 0 : f.good.includes(d.option) ? 1 : (f.fine || []).includes(d.option) ? 0.5 : 0;
      const rt = st.grc.rate[f.id];
      const axis = (a, b) => (a === b ? 1 : Math.abs(a - b) === 1 ? 0.5 : 0);
      const rate = rt ? (axis(rt.L, f.L) + axis(rt.I, f.I)) / 2 : 0;
      const ow = st.grc.owner[f.id];
      const owner = ow ? (f.ownerGood.includes(ow) ? 1 : (f.ownerFine || []).includes(ow) ? 0.5 : 0) : 0;
      const pts = per * (0.6 * treat + 0.2 * rate + 0.2 * owner);
      tri += pts;
      const bits = [];
      bits.push(o ? o.label : 'no treatment');
      bits.push(rt ? `rated ${rt.L} x ${rt.I} (true ${f.L} x ${f.I})` : 'not rated');
      bits.push(ow ? `owner ${ow}` : 'no owner');
      add('Triage', `${f.id}: ${bits.join(' · ')}`, pts, per, `${f.title}. ${f.why}`);
    }
  }
  if (scn.ti) {
    for (const r of TI.scoreReports(scn, st)) {
      tri += r.points;
      const got = r.got ? `${r.got.rel}${r.got.cred}` : 'not rated';
      add('Triage', `${r.report.title}: rated ${got} (assessed ${r.report.rel}${r.report.cred})`, r.points, r.max, r.report.why || '');
    }
    for (const c of TI.scoreClaims(scn, st)) {
      tri += c.points;
      const label = c.claim.text.length > 90 ? `${c.claim.text.slice(0, 88)}…` : c.claim.text;
      add('Triage', `${label}: marked ${c.got || 'nothing'} (it is ${c.claim.truth})`, c.points, c.max, c.claim.why || '');
    }
  }
  if (scn.se) {
    SE.arrived(scn, st);
    seSweep(scn, st);
    const n = scn.se.contacts.length;
    const per = g.triage / n;
    for (const c of scn.se.contacts) {
      const d = st.se.decisions[c.id];
      const sc = SE.decisionScore(c, d);
      tri += per * sc;
      const what = !d ? 'never arrived or never dealt with' : d.action === 'left' ? 'left waiting until they gave up' : SE.label(SE.ACTIONS, d.action).toLowerCase();
      add('Triage', `${c.from} (${c.channel}): ${what}`, per * sc, per, `${c.genuine ? 'A genuine request.' : 'An attack.'} ${c.why}`);
    }
  }
  if (scn.eng) {
    const e = st.eng;
    const released = e.releases > 0;
    const through = released && e.forced < e.releases;
    add('Triage', through ? 'Released through a passing pipeline' : released ? 'Every release skipped the pipeline' : 'Nothing was released', through ? 8 : 0, 8, through ? '' : 'A change that is never released fixes nothing, and one that skips the pipeline is a gamble.');
    if (through) tri += 8;
    const clean = released && e.forced === 0;
    add('Triage', clean ? 'No forced releases' : released ? `${e.forced} forced release${e.forced === 1 ? '' : 's'}` : 'No release', clean ? 4 : 0, 4, clean ? '' : 'An emergency release should be rare and followed by a proper one.');
    if (clean) tri += 4;
    const over = Math.max(0, e.runs.length - scn.eng.runBudget);
    const pts = released ? Math.max(0, 3 - 0.5 * over) : 0;
    add('Triage', `${e.runs.length} pipeline run${e.runs.length === 1 ? '' : 's'}`, pts, 3, over ? `More than ${scn.eng.runBudget} runs means guessing rather than reading the failures.` : '');
    tri += pts;
  }
  const triMax = g.triage;

  // Evidence
  const keyRoles = scn.events.filter((e) => e.key && e.keyWeight !== 0);
  const roles = [...new Set(keyRoles.map((e) => e.key))];
  const pinnedRoles = new Set(
    st.pins
      .map((id) => scn.events.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => e.key)
      .filter(Boolean)
  );
  const perRole = roles.length ? g.evidence / roles.length : 0;
  let evi = 0;
  for (const r of roles) {
    const label = scn.roleLabels[r] || r;
    if (pinnedRoles.has(r)) {
      evi += perRole;
      add('Evidence', `Pinned: ${label}`, perRole, perRole);
    } else add('Evidence', `Not on your timeline: ${label}`, 0, perRole, scn.roleHints[r] || '');
  }
  if (scn.grc) {
    const ms = GRC.mapScore(scn, st);
    const pts = g.evidence * ms.ratio;
    evi += pts;
    const bad = ms.detail.filter((x) => x.kind === 'false').slice(0, 3).map((x) => `${x.control} does not really satisfy ${x.req}`);
    const missed = ms.detail.filter((x) => x.kind === 'missed').slice(0, 3).map((x) => `${x.control} satisfies ${x.req}`);
    add('Evidence', `Controls mapped to the frameworks: ${Math.round(ms.ratio * 100)}% right`, pts, g.evidence, [...bad.map((b) => `Over-claimed: ${b}.`), ...missed.map((b) => `Missed: ${b}.`)].join(' '));
    const gaps = GRC.coverage(scn, st).filter((r) => !r.controls.length).map((r) => r.id);
    const real = scn.grc.requirements.filter((r) => !scn.grc.controls.some((c) => (c.fits || {})[r.id])).map((r) => r.id);
    if (real.some((id) => gaps.includes(id)) === false && real.length) add('Evidence', `Real gap with no control: ${real.join(', ')}`, 0, 0, 'A requirement that no control addresses is a gap the audit did not list.');
  }
  if (scn.ti) {
    const ls = TI.scoreLinks(scn, st);
    evi += ls.points;
    const bits = [];
    if (ls.missed.length) bits.push(`Missed: ${ls.missed.slice(0, 3).map((t) => `${t.a} and ${t.b} (${t.basis})`).join('; ')}.`);
    if (ls.falseLinks.length) bits.push(`Not linked in reality: ${ls.falseLinks.slice(0, 3).map((l) => `${l.a} and ${l.b}`).join('; ')}. Coincidence and shared hosting are not links.`);
    add('Evidence', `Indicator links: ${ls.found.length} of ${scn.ti.links.length} real links found${ls.falseLinks.length ? `, ${ls.falseLinks.length} false` : ''}`, ls.points, ls.max, bits.join(' '));
  }
  if (scn.se) {
    const perV = g.evidence / scn.se.contacts.length;
    for (const c of scn.se.contacts) {
      const sh = SE.verifyShare(c, st);
      evi += perV * sh;
      const how = !c.needsVerify ? 'no check needed' : SE.strongUsed(c, st) ? 'checked through a channel they did not provide' : SE.anyUsed(st, c.id) ? 'only weak checks' : 'no check before deciding';
      add('Evidence', `${c.from}: ${how}`, perV * sh, perV, sh < 1 && c.needsVerify ? c.verifyNote || '' : '');
    }
  }
  if (scn.eng) {
    const fin = prodNow(st);
    for (const p of Eng.policyResults(scn, fin)) {
      if (p.ok) evi += p.weight;
      add('Evidence', `${p.ok ? 'Meets' : 'Fails'} the baseline: ${p.label}`, p.ok ? p.weight : 0, p.weight, p.ok ? '' : p.fix);
    }
  }
  const wrongPins = st.pins.map((id) => scn.events.find((e) => e.id === id)).filter((e) => e && !e.key).length;
  const penalty = Math.min(g.evidence * 0.2, wrongPins * 1.5);
  if (penalty > 0) add('Evidence', `Unrelated events pinned (${wrongPins})`, -penalty, 0, 'Only pin events that belong to the incident.');
  evi = Math.max(0, evi - penalty);

  // Response
  let res = 0;
  let harmNet = 0;
  let lateToReport = 0; // with no response score to take it from, a missed deadline comes off the report
  const goodRules = scn.responses.filter((r) => r.good);
  const doneKeys = new Set(st.actions.map((a) => a.key));
  const hits = [];
  for (const r of goodRules) {
    if (doneKeys.has(flagName(r.action, r.target))) {
      res += r.points;
      hits.push(r);
      add('Response', `Done: ${r.label}`, r.points, r.points);
    } else add('Response', `Not done: ${r.label}`, 0, r.points, r.why || '');
  }
  if (scn.eng) {
    const fin = prodNow(st);
    for (const f of Eng.featureResults(scn, fin)) {
      if (f.ok) res += f.weight;
      add('Response', `${f.ok ? 'Still works' : 'Broken'}: ${f.label}`, f.ok ? f.weight : 0, f.weight, f.ok ? '' : f.why);
    }
    for (const hm of st.eng.harm) {
      harmNet += hm.harm * g.harmScale;
      add('Response', `Cost: ${hm.label}`, -hm.harm * g.harmScale, 0, hm.text);
    }
  }
  if (scn.se) {
    res += scn.se.outcomePoints;
    if (!st.se.harm.length) add('Response', 'Nothing your decisions did harmed anyone', scn.se.outcomePoints, scn.se.outcomePoints);
    for (const hm of st.se.harm) {
      harmNet += hm.harm * g.harmScale;
      add('Response', `Cost: ${hm.label}`, -hm.harm * g.harmScale, 0, hm.text);
    }
  }
  if (scn.grc) {
    const best = GRC.optimum(scn).value;
    const got = GRC.removed(scn, st);
    const ratio = best ? Math.min(1, got / best) : 0;
    const pts = scn.grc.riskPoints * Math.max(0, (ratio - 0.35) / 0.65);
    res += pts;
    add('Response', `Risk removed: ${Math.round(got)} of the ${Math.round(best)} that was achievable (${Math.round(ratio * 100)}%)`, pts, scn.grc.riskPoints, ratio < 0.85 ? 'The best use of the budget would have removed more. Look at what each pound buys, and at the findings that cost nothing to resolve.' : '');
    for (const hm of st.grc.harm) {
      harmNet += hm.harm * g.harmScale;
      add('Response', `Cost to your credibility: ${hm.label}`, -hm.harm * g.harmScale, 0, hm.text);
    }
    const left = GRC.remaining(scn, st);
    if (left > 0) add('Response', `Budget left unspent: £${left}k`, 0, 0, 'Unspent budget is risk left in place.');
  }
  if (scn.vm) {
    const best = VM.optimum(scn).value;
    const got = VM.removed(scn, st);
    const ratio = best ? Math.min(1, got / best) : 0;
    // The first third of the achievable risk is easy to get; the points are for the rest.
    const pts = scn.vm.riskPoints * Math.max(0, (ratio - 0.35) / 0.65);
    res += pts;
    add('Response', `Risk removed: ${Math.round(got)} of the ${Math.round(best)} that was achievable (${Math.round(ratio * 100)}%)`, pts, scn.vm.riskPoints, ratio < 0.85 ? 'The best use of the budget would have removed more. Look at what each hour buys: a high CVSS on a low-value asset buys little.' : '');
    for (const hm of st.vm.harm) {
      harmNet += hm.harm * g.harmScale;
      add('Response', `Cost to the business: ${hm.label}`, -hm.harm * g.harmScale, 0, hm.text);
    }
    const left = VM.remaining(scn, st);
    if (left > 0) add('Response', `Budget left unspent: ${left} h`, 0, 0, 'Unused budget is wasted effort: every hour could have removed risk.');
  }
  const ck = stateChecks(scn, st);
  if (ck) {
    for (const th of ck.threats) {
      if (th.blocked) {
        res += th.points;
        add('Response', `Closed: ${th.label}`, th.points, th.points);
      } else add('Response', `Still open: ${th.label}`, 0, th.points, th.why);
    }
    for (const sv of ck.services) {
      if (sv.ok) continue;
      harmNet += sv.weight * g.harmScale;
      add('Response', `Broken: ${sv.label}`, -sv.weight * g.harmScale, 0, sv.note);
    }
  }
  const harmful = st.actions.filter((a) => a.rule.harm);
  const harmTotal = harmful.reduce((s, a) => s + a.rule.harm, 0);
  for (const a of harmful) add('Response', `Cost to the business: ${a.rule.label || `${a.action} ${a.target}`}`, -a.rule.harm * g.harmScale, 0, a.rule.text);
  res = Math.max(0, res - harmTotal * g.harmScale - harmNet);
  const resMax = goodRules.reduce((s, r) => s + r.points, 0);
  const late = consequences(scn, st, scn.horizon ?? st.clock).filter((e) => e.consequence && e.consequence.cost);
  let lateCost = 0;
  const byLabel = new Map();
  for (const e of late) {
    lateCost += e.consequence.cost;
    const cur = byLabel.get(e.consequence.label) || { n: 0, cost: 0, text: e.consequence.text };
    cur.n += 1;
    cur.cost += e.consequence.cost;
    byLabel.set(e.consequence.label, cur);
  }
  for (const [label, c] of byLabel) add(g.response ? 'Response' : 'Report', c.n > 1 ? `${label} (${c.n} times)` : label, -c.cost, 0, c.text);
  res = Math.max(0, res - lateCost);
  if (!g.response) lateToReport = lateCost;

  // Report: the scenario lists the fields, what is true and what each is worth.
  let rep = 0;
  const R = report || {};
  for (const f of scn.report) {
    const got = R[f.id];
    let pts = 0;
    let label;
    let note = f.note || '';
    if (f.kind === 'choice' || f.kind === 'ordinal') {
      const ok = got === f.truth;
      const near = !ok && f.kind === 'ordinal' && got && Math.abs(f.order.indexOf(got) - f.order.indexOf(f.truth)) === 1;
      pts = ok ? f.points : near ? f.points * 0.4 : 0;
      label = ok ? `${f.title} correct` : near ? `${f.title} one level out` : `${f.title} wrong`;
      if (ok) note = '';
    } else if (f.kind === 'set') {
      const sc = setScore(got, f.truth, f.points);
      pts = sc.points;
      label = `${f.title}: ${sc.right} right${sc.wrong ? `, ${sc.wrong} wrong` : ''}${sc.missed ? `, ${sc.missed} missed` : ''}`;
    } else if (f.kind === 'time') {
      const t = parseClock(got);
      const diff = t === null ? Infinity : Math.abs(t - f.truth);
      pts = diff <= f.tolerance ? f.points : diff <= f.near ? f.points * 0.5 : 0;
      label = diff <= f.tolerance ? `${f.title} correct (${clockText(f.truth)})` : diff <= f.near ? `${f.title} close (${clockText(f.truth)})` : `${f.title} wrong (it was ${clockText(f.truth)})`;
      if (diff <= f.tolerance) note = '';
    } else {
      const ok = String(got || '').trim().length >= f.minLength;
      pts = ok ? f.points : 0;
      label = ok ? `${f.title} written` : `${f.title} missing or too short`;
      note = '';
    }
    rep += pts;
    add('Report', label, pts, f.points, note);
  }

  if (scn.ti) {
    const sb = TI.scoreBrief(scn, report);
    for (const l of sb.lines) add('Report', l.label, l.points, l.max, l.note);
    rep += sb.points;
  }
  // A report written without the evidence behind it is mostly a guess: it earns 40% plus a share of the rest for the evidence found.
  let grounded = g.evidence ? 0.4 + 0.6 * Math.min(1, evi / g.evidence) : 1;
  if (scn.ti) {
    const read = scn.ti.reports.filter((r) => TI.reportRead(st, r.id)).length;
    grounded = 0.4 + 0.6 * (read / scn.ti.reports.length);
  }
  if (scn.grc) {
    const opened = scn.grc.findings.filter((f) => GRC.docsOpened(st, f.id) > 0).length;
    grounded = 0.4 + 0.6 * (opened / scn.grc.findings.length);
  }
  if (scn.vm) {
    // A report is only as good as the looking behind it: how many findings did the player actually open?
    const opened = scn.vm.findings.filter((f) => st.seen.has(`finding:${f.id}`)).length;
    grounded = 0.4 + 0.6 * (opened / scn.vm.findings.length);
  }
  if (grounded < 1) add('Report', scn.vm || scn.grc || scn.ti ? `Report not fully backed by looking (${Math.round(grounded * 100)}% credit)` : `Report not fully backed by pinned evidence (${Math.round(grounded * 100)}% credit)`, -(rep - rep * grounded), 0, scn.ti ? 'Read every report before you brief the defender: the one you skipped may be the one that changes the answer.' : scn.vm || scn.grc ? 'Read the evidence for every finding before you report on it: it changes the answer.' : 'Pin the events that prove each part of your report.');
  rep = Math.max(0, rep * grounded - lateToReport);
  const parts = { triage: Math.min(tri, triMax), evidence: Math.min(evi, g.evidence), response: Math.min(res, g.response), report: Math.min(rep, g.reportTotal) };
  const total = Math.round(parts.triage + parts.evidence + parts.response + parts.report);
  let tier = total >= g.gold ? 3 : total >= g.silver ? 2 : total >= g.bronze ? 1 : 0;
  // However well the rest went, a breach you could have stopped caps the medal.
  const capped = !!g.cap && late.length >= (g.capAt ?? 1) && tier > 1;
  if (capped) {
    tier = 1;
    add('Response', 'Medal capped at bronze', 0, 0, g.cap);
  }
  return { total, tier, capped, parts, max: { triage: triMax, evidence: g.evidence, response: g.response, report: g.reportTotal }, lines, minutes: st.clock - scn.clockStart, disruption: disruptionNow(scn, st) };
}

const SEV_ORDER = ['low', 'medium', 'high', 'critical'];
export const severityIndex = (s) => SEV_ORDER.indexOf(s);

// Score a chosen set against the true set: each right item earns its share, each wrong item costs half a share.
function setScore(chosen, truth, max) {
  const picked = new Set(chosen || []);
  const want = new Set(truth || []);
  const per = max / Math.max(1, want.size);
  let right = 0;
  let wrong = 0;
  for (const x of picked) (want.has(x) ? right++ : wrong++);
  const missed = [...want].filter((x) => !picked.has(x)).length;
  return { right, wrong, missed, points: Math.max(0, right * per - wrong * per * 0.5) };
}

// ── What a scenario must provide (checked in the tests) ─────────
export function problems(scn) {
  const out = [];
  const ids = new Set();
  for (const e of scn.events) {
    if (ids.has(e.id)) out.push(`duplicate event id ${e.id}`);
    ids.add(e.id);
    if (!Number.isFinite(e.t) || !e.summary || !e.type) out.push(`event ${e.id} needs t, type and summary`);
  }
  const known = new Set(scn.entities.map((x) => x.id));
  for (const e of scn.events) {
    if (e.host && !known.has(e.host)) out.push(`event ${e.id}: unknown host ${e.host}`);
    if (e.user && !known.has(e.user)) out.push(`event ${e.id}: unknown user ${e.user}`);
  }
  for (const a of scn.alerts) for (const id of a.events || []) if (!ids.has(id)) out.push(`alert ${a.id}: unknown event ${id}`);
  for (const r of scn.responses) {
    const def = scn.actions.find((a) => a.id === r.action);
    if (!def) out.push(`response ${r.action}/${r.target}: unknown action`);
    else if (!scn.targets[def.targetKind] || !scn.targets[def.targetKind].includes(r.target)) out.push(`response ${r.action}/${r.target}: target is not on the list for ${def.targetKind}`);
  }
  for (const e of scn.events) for (const f of e.unless || []) {
    if (f === 'submitted') continue;
    const [action, target] = f.split(':');
    if (!scn.responses.some((r) => (r.action === action && r.target === target) || (r.sets || []).includes(f)) && !(scn.vm && scn.vm.findings.some((x) => x.options.some((o) => (o.sets || []).includes(f)))) && !(scn.grc && scn.grc.findings.some((x) => x.options.some((o) => (o.sets || []).includes(f)) || (x.challenge && f === `plan:${x.id}`)))) out.push(`event ${e.id}: nothing the player can do sets ${f}`);
  }
  const goodSum = scn.responses.filter((r) => r.good).reduce((n, r) => n + r.points, 0) + ((scn.net || scn.cloud) ? (scn.net || scn.cloud).threats.reduce((n, th) => n + th.points, 0) : 0) + (scn.vm ? scn.vm.riskPoints : 0) + (scn.grc ? scn.grc.riskPoints : 0) + (scn.se ? scn.se.outcomePoints : 0) + (scn.eng ? scn.eng.features.reduce((n, f) => n + f.weight, 0) : 0);
  if (goodSum !== scn.grading.response) out.push(`good responses are worth ${goodSum}, the response score is ${scn.grading.response}`);
  const roles = new Set(scn.events.filter((e) => e.key && e.keyWeight !== 0).map((e) => e.key));
  for (const r of roles) if (!scn.roleLabels[r] || !scn.roleHints[r]) out.push(`evidence role ${r} needs a label and a hint`);
  const repSum = scn.report.reduce((n, f) => n + f.points, 0);
  if (!scn.ti && repSum !== scn.grading.reportTotal) out.push(`report parts add up to ${repSum}, not ${scn.grading.reportTotal}`);
  const total = scn.grading.triage + scn.grading.evidence + scn.grading.response + scn.grading.reportTotal;
  if (total !== 100) out.push(`grading adds up to ${total}, not 100`);
  for (const f of scn.report) {
    if (!f.id || !f.title || !f.points) out.push(`report field ${f.id} needs an id, a title and points`);
    if (f.kind !== 'text' && f.truth === undefined) out.push(`report field ${f.id} has no truth`);
  }
  if (scn.net) {
    const pol = Net.initialPolicy(scn);
    for (const sv of scn.net.services) if (Net.decide(scn, pol, sv.flow).action !== 'allow') out.push(`service ${sv.id} is blocked by the starting rules`);
    for (const th of scn.net.threats) if (th.flows.every((f) => Net.decide(scn, pol, f).action === 'deny')) out.push(`threat ${th.id} is already blocked by the starting rules`);
    const zones = new Set(scn.net.zones.map((z) => z.id));
    for (const x of scn.entities) if (x.kind === 'host' && x.id !== scn.net.fw && !zones.has(x.zone)) out.push(`host ${x.id} is in an unknown zone`);
    for (const e of scn.events) if (e.flow && (!scn.entities.some((x) => x.id === e.flow.src) || !scn.entities.some((x) => x.id === e.flow.dst))) out.push(`event ${e.id}: flow uses an unknown address`);
  }
  if (scn.vm) {
    const v = scn.vm;
    const ids = new Set();
    for (const f of v.findings) {
      if (ids.has(f.id)) out.push(`duplicate finding ${f.id}`);
      ids.add(f.id);
      if (!scn.entities.some((x) => x.id === f.asset)) out.push(`finding ${f.id}: unknown asset ${f.asset}`);
      const optIds = new Set(VM.allOptions(f).map((o) => o.id));
      for (const id of [...f.good, ...(f.fine || [])]) if (!optIds.has(id)) out.push(`finding ${f.id}: unknown option ${id} in good/fine`);
      if (!f.good.length) out.push(`finding ${f.id} has no good decision`);
      if (f.fp && f.risk) out.push(`finding ${f.id} is a false positive but has risk`);
      for (const o of f.options) if (!(o.cost > 0) || !(o.effect > 0 && o.effect <= 1)) out.push(`finding ${f.id}: option ${o.id} needs a cost and an effect between 0 and 1`);
    }
    if (v.riskPoints + scn.grading.triage + scn.grading.evidence + scn.grading.reportTotal !== 100) out.push('the vm risk points do not make the scores add up to 100');
    const opt = VM.optimum(scn);
    const cost = v.findings.flatMap((f) => f.options.filter((o) => !o.breaks)).reduce((n, o) => n + o.cost, 0);
    if (cost <= v.budget * 1.5) out.push('the budget is too generous: the whole backlog nearly fits');
    if (!opt.value) out.push('nothing can be removed within the budget');
  }
  if (scn.eng) {
    const x = scn.eng;
    const init = Eng.initialState(scn);
    const settings = new Set(Object.keys(init.cfg));
    const edges = new Set(x.edges.map((e) => e.id));
    const check = (c, where) => {
      if (c.all) return c.all.forEach((y) => check(y, where));
      if (c.any) return c.any.forEach((y) => check(y, where));
      if (c.e) {
        if (!edges.has(c.e)) out.push(`${where}: unknown connection ${c.e}`);
      } else if (!settings.has(c.s)) out.push(`${where}: unknown setting ${c.s}`);
    };
    for (const p of x.policy) check(p.test, `policy ${p.id}`);
    for (const f of x.features) check(f.needs, `feature ${f.id}`);
    for (const b of x.secretScan) check(b.when, 'secret scan');
    for (const b of x.deployBlockers) check(b.when, 'deploy blocker');
    for (const e of scn.events) for (const c of e.unlessProd || []) check(c, `event ${e.id}`);
    if (x.policy.reduce((n, p) => n + p.weight, 0) !== scn.grading.evidence) out.push('policy weights must add up to the evidence score');
    if (x.features.reduce((n, f) => n + f.weight, 0) !== scn.grading.response) out.push('feature weights must add up to the response score');
    if (scn.grading.triage !== 15) out.push('the pipeline discipline score is 15');
    if (Eng.featureResults(scn, init).some((f) => !f.ok)) out.push('a feature is already broken in the starting configuration');
    if (!Eng.policyResults(scn, init).some((p) => !p.ok && p.sev === 'critical')) out.push('the starting configuration has no critical failure');
    if (x.reference) {
      const ref = Eng.cloneState(init);
      Object.assign(ref.cfg, x.reference.cfg || {});
      Object.assign(ref.edges, x.reference.edges || {});
      const run = Eng.runPipeline(scn, ref);
      if (!run.passed) out.push('the reference configuration does not pass the pipeline: ' + run.stages.filter((y) => y.status === 'fail').map((y) => y.lines.join(' ')).join(' '));
      if (Eng.policyScore(scn, ref) !== scn.grading.evidence) out.push('the reference configuration does not meet the whole baseline');
      if (Eng.featureScore(scn, ref) !== scn.grading.response) out.push('the reference configuration breaks a feature');
    }
  }
  if (scn.se) {
    const q = scn.se;
    const ids = new Set();
    for (const c of q.contacts) {
      if (ids.has(c.id)) out.push(`duplicate contact ${c.id}`);
      ids.add(c.id);
      for (const a of Object.keys(c.actions)) if (!SE.ACTIONS.some((x) => x[0] === a)) out.push(`contact ${c.id}: unknown action ${a}`);
      for (const a of [...c.good, ...(c.fine || [])]) if (!c.actions[a]) out.push(`contact ${c.id}: ${a} is rated but not offered`);
      if (!c.good.length) out.push(`contact ${c.id} has no good action`);
      for (const tl of Object.keys(c.tools || {})) if (!SE.TOOLS.some((x) => x[0] === tl)) out.push(`contact ${c.id}: unknown tool ${tl}`);
      for (const tl of c.strongTools || []) if (!(c.tools || {})[tl]) out.push(`contact ${c.id}: strong tool ${tl} is not available`);
      if (c.needsVerify && !(c.strongTools || []).length) out.push(`contact ${c.id} needs verifying but has no strong check`);
      if (!c.genuine && c.good.includes('help')) out.push(`contact ${c.id}: helping an attacker cannot be good`);
      if (c.genuine && c.good.includes('refuse') && c.risk !== 'high') out.push(`contact ${c.id}: refusing a genuine low-risk request cannot be good`);
      if (!(c.patience > 0)) out.push(`contact ${c.id} needs a patience`);
    }
    for (const e of scn.events) for (const f of e.when || []) {
      const m = /^breach:(.+)$/.exec(f);
      if (!m || !q.contacts.some((c) => c.id === m[1] && Object.values(c.actions).some((a) => (a.sets || []).includes(f)))) out.push(`event ${e.id}: nothing sets ${f}`);
    }
    if (q.outcomePoints !== scn.grading.response) out.push('outcome points must equal the response score');
  }
  if (scn.ti) {
    const t = scn.ti;
    const P = t.points;
    if (P.reports + P.claims !== scn.grading.triage) out.push('report and claim points do not add up to the triage score');
    if (P.links !== scn.grading.evidence) out.push('link points do not add up to the evidence score');
    if (P.judgements + P.iocs + P.recs + P.decision + P.summary !== scn.grading.reportTotal) out.push('brief points do not add up to the report score');
    const rep = new Set(t.reports.map((r) => r.id));
    const ind = new Set(t.indicators.map((i) => i.id));
    for (const c of t.claims) if (!rep.has(c.report)) out.push(`claim ${c.id}: unknown report`);
    for (const i of t.indicators) for (const r of i.from) if (!rep.has(r)) out.push(`indicator ${i.id}: unknown report ${r}`);
    for (const l of t.links) {
      if (!ind.has(l.a) || !ind.has(l.b)) out.push(`link ${l.a}-${l.b}: unknown indicator`);
      if (!TI.BASES.some((b) => b[0] === l.basis)) out.push(`link ${l.a}-${l.b}: unknown basis`);
    }
    if (P.judgements !== t.judgements.filter((j) => j.include).reduce((n, j) => n + j.weight, 0)) out.push('judgement weights do not add up');
    for (const i of t.indicators) if (!i.enrich) out.push(`indicator ${i.id} has no lookup result`);
    for (const r of t.reports) if (!t.sources.some((x) => x.id === r.source)) out.push(`report ${r.id}: unknown source`);
    if (t.credits >= t.indicators.length) out.push('there are enough lookups to look up everything');
    for (const e of scn.events) for (const fl of e.unless || []) if (fl !== 'submitted' && !/^plan:/.test(fl)) out.push(`event ${e.id}: nothing sets ${fl}`);
  }
  if (scn.grc) {
    const gr = scn.grc;
    const ids = new Set();
    const req = new Set(gr.requirements.map((r) => r.id));
    for (const f of gr.findings) {
      if (ids.has(f.id)) out.push(`duplicate finding ${f.id}`);
      ids.add(f.id);
      for (const v of [f.L, f.I]) if (!(Number.isInteger(v) && v >= 1 && v <= 5)) out.push(`finding ${f.id}: bad rating`);
      const opts = new Set(GRC.allOptions(f).map((o) => o.id));
      for (const id of [...f.good, ...(f.fine || [])]) if (!opts.has(id)) out.push(`finding ${f.id}: unknown option ${id}`);
      for (const r of [...f.ownerGood, ...(f.ownerFine || [])]) if (!gr.owners.includes(r)) out.push(`finding ${f.id}: unknown owner ${r}`);
      if (!f.ownerGood.length || !f.good.length) out.push(`finding ${f.id} needs a good owner and a good treatment`);
      if (f.challenge && !f.docs.some((d) => d.id === f.challenge.proof)) out.push(`finding ${f.id}: the proof document does not exist`);
      for (const o of f.options) if (!(Number.isInteger(o.cost) && o.cost > 0) || !(o.effect > 0 && o.effect <= 1)) out.push(`finding ${f.id}: option ${o.id} needs a whole-pound cost and an effect between 0 and 1`);
    }
    for (const c of gr.controls) for (const r of Object.keys(c.fits || {})) if (!req.has(r)) out.push(`control ${c.id}: unknown requirement ${r}`);
    for (const e of scn.events) for (const fl of e.unless || []) {
      const m = /^plan:(.+)$/.exec(fl);
      if (m && !ids.has(m[1])) out.push(`event ${e.id}: unknown finding in ${fl}`);
    }
    if (GRC.optimum(scn).value <= 0) out.push('nothing can be removed within the budget');
    const cost = gr.findings.flatMap((f) => f.options).reduce((n, o) => n + o.cost, 0);
    if (cost <= gr.budget * 1.5) out.push('the budget is too generous');
    if (gr.riskPoints + scn.grading.triage + scn.grading.evidence + scn.grading.reportTotal !== 100) out.push('the grc risk points do not make the scores add up to 100');
  }
  if (scn.cloud) {
    const c = scn.cloud;
    const ck = stateChecks(scn, newRun(scn));
    for (const sv of ck.services) if (!sv.ok) out.push(`need ${sv.id} is already broken at the start`);
    for (const th of ck.threats) if (th.blocked) out.push(`threat ${th.id} is already closed at the start`);
    const known = new Set(scn.entities.map((x) => x.id));
    const rid = new Set(c.resources.map((r) => r.id));
    for (const g of c.grants) {
      if (!known.has(g.who)) out.push(`grant ${g.id}: unknown identity ${g.who}`);
      for (const r of g.resources) if (r !== '*' && !rid.has(r)) out.push(`grant ${g.id}: unknown resource ${r}`);
    }
    for (const f of c.fixes) {
      if (!f.effects || !f.effects.length) out.push(`fix ${f.id} has no effect`);
      for (const e of f.effects || []) {
        const list = e.kind === 'res' ? c.resources : e.kind === 'id' ? c.identities : e.kind === 'grant' ? c.grants : c.trusts;
        if (!list.some((x) => x.id === e.id)) out.push(`fix ${f.id}: unknown ${e.kind} ${e.id}`);
      }
    }
    for (const e of scn.events) if (e.access && !(e.access.who.startsWith('LEAK:') || e.access.who === 'PUBLIC' || known.has(e.access.who))) out.push(`event ${e.id}: unknown principal ${e.access.who}`);
    // the reference fixes (if the scenario names them) must close every threat and break nothing
    if (c.reference) {
      let st = newRun(scn);
      for (const id of c.reference) {
        const r = cloudFix(scn, st, id);
        if (!r.ok) out.push(`reference fix ${id}: ${r.text}`);
      }
      const after = stateChecks(scn, st);
      for (const th of after.threats) if (!th.blocked) out.push(`the reference fixes leave ${th.id} open`);
      for (const sv of after.services) if (!sv.ok) out.push(`the reference fixes break ${sv.id}`);
    }
  }
  if (!Number.isFinite(scn.horizon) || scn.horizon <= scn.clockStart) out.push('horizon must be after the start');
  if (scn.alerts.some((a) => !a.late && a.at > scn.clockStart)) out.push('an alert that is not marked late appears after the start');
  return out;
}
