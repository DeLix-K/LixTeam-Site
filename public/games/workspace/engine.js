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

export const COSTS = { search: 1, entity: 1, tree: 1, map: 1, action: 3, alert: 1 };

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
  return {
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
}

const flagName = (action, target) => `${action}:${target}`;

// ── Events ──────────────────────────────────────────────────────
function suppressed(e, st) {
  if (!e.unless) return false;
  return e.unless.some((f) => st.flags[f] !== undefined && st.flags[f] <= e.t);
}

// Every event the player can see right now (scenario events whose time has come, plus the player's own).
export function visibleEvents(scn, st) {
  const out = [];
  for (const e of scn.events) if (e.t <= st.clock && !suppressed(e, st)) out.push(e);
  for (const e of st.extra) out.push(e);
  return out.sort((a, b) => a.t - b.t || String(a.id).localeCompare(String(b.id)));
}

// Events that would have happened by now but were stopped by something the player did.
export function preventedEvents(scn, st) {
  return scn.events.filter((e) => suppressed(e, st) && e.t > 0);
}

export const eventById = (scn, st, id) => visibleEvents(scn, st).find((e) => e.id === id) || null;

// ── Search ──────────────────────────────────────────────────────
// Query words: user:priya.n host:WS-FIN-07 ip:203.0.113.44 proc:powershell type:logon sev:high file:zip
// Anything else is plain text, matched against the summary and every field. All words must match.
const FIELD_ALIASES = { user: ['user'], host: ['host'], type: ['type'], sev: ['sev'], proc: ['proc', 'parent'], file: ['file'], ip: ['dst', 'src', 'ip'], dst: ['dst'], src: ['src'], domain: ['domain', 'dst'], from: ['from'], to: ['to'] };

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

// ── What happened that the player did not stop ──────────────────
// Events with a `consequence` that actually occurred (not suppressed) by the end of the run.
export function consequences(scn, st, atClock = st.clock) {
  // atClock can be later than the player's own clock: what would happen once they stop working.
  const probe = { ...st, clock: atClock };
  return scn.events.filter((e) => e.consequence && e.t <= atClock && !suppressed(e, probe));
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
  const each = g.triage / base.length;
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
  const perRole = g.evidence / roles.length;
  let evi = 0;
  for (const r of roles) {
    const label = scn.roleLabels[r] || r;
    if (pinnedRoles.has(r)) {
      evi += perRole;
      add('Evidence', `Pinned: ${label}`, perRole, perRole);
    } else add('Evidence', `Not on your timeline: ${label}`, 0, perRole, scn.roleHints[r] || '');
  }
  const wrongPins = st.pins.map((id) => scn.events.find((e) => e.id === id)).filter((e) => e && !e.key).length;
  const penalty = Math.min(g.evidence * 0.2, wrongPins * 1.5);
  if (penalty > 0) add('Evidence', `Unrelated events pinned (${wrongPins})`, -penalty, 0, 'Only pin events that belong to the incident.');
  evi = Math.max(0, evi - penalty);

  // Response
  let res = 0;
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
  const harmful = st.actions.filter((a) => a.rule.harm);
  const harmTotal = harmful.reduce((s, a) => s + a.rule.harm, 0);
  for (const a of harmful) add('Response', `Cost to the business: ${a.rule.label || `${a.action} ${a.target}`}`, -a.rule.harm * g.harmScale, 0, a.rule.text);
  res = Math.max(0, res - harmTotal * g.harmScale);
  const resMax = goodRules.reduce((s, r) => s + r.points, 0);
  const late = consequences(scn, st, scn.horizon ?? st.clock).filter((e) => e.consequence && e.consequence.cost);
  let lateCost = 0;
  for (const e of late) {
    lateCost += e.consequence.cost;
    add('Response', e.consequence.label, -e.consequence.cost, 0, e.consequence.text);
  }
  res = Math.max(0, res - lateCost);

  // Report
  let rep = 0;
  const T = scn.truth;
  const rg = g.report;
  const verdictOk = report && report.verdict === T.verdict;
  rep += verdictOk ? rg.verdict : 0;
  add('Report', verdictOk ? 'Verdict correct' : 'Verdict wrong', verdictOk ? rg.verdict : 0, rg.verdict, verdictOk ? '' : T.verdictNote || '');
  const sevOk = report && report.severity === T.severity;
  const sevNear = report && Math.abs(severityIndex(report.severity) - severityIndex(T.severity)) === 1;
  const sevPts = sevOk ? rg.severity : sevNear ? rg.severity * 0.4 : 0;
  rep += sevPts;
  add('Report', sevOk ? 'Severity correct' : sevNear ? 'Severity one level out' : 'Severity wrong', sevPts, rg.severity, sevOk ? '' : T.severityNote || '');
  const hostScore = setScore(report && report.hosts, T.hosts, rg.hosts);
  rep += hostScore.points;
  add('Report', `Affected hosts: ${hostScore.right} right${hostScore.wrong ? `, ${hostScore.wrong} wrong` : ''}${hostScore.missed ? `, ${hostScore.missed} missed` : ''}`, hostScore.points, rg.hosts, T.hostsNote || '');
  const userScore = setScore(report && report.users, T.users, rg.users);
  rep += userScore.points;
  add('Report', `Affected accounts: ${userScore.right} right${userScore.wrong ? `, ${userScore.wrong} wrong` : ''}${userScore.missed ? `, ${userScore.missed} missed` : ''}`, userScore.points, rg.users, T.usersNote || '');
  const causeOk = report && report.cause === T.cause;
  rep += causeOk ? rg.cause : 0;
  add('Report', causeOk ? 'Root cause correct' : 'Root cause wrong', causeOk ? rg.cause : 0, rg.cause, causeOk ? '' : T.causeNote || '');
  const sumOk = report && String(report.summary || '').trim().length >= g.minSummary;
  rep += sumOk ? rg.summary : 0;
  add('Report', sumOk ? 'Summary written' : 'Summary missing or too short', sumOk ? rg.summary : 0, rg.summary);

  // A report written without the evidence behind it is mostly a guess: it earns 40% plus a share of the rest for the evidence found.
  const grounded = 0.4 + 0.6 * Math.min(1, evi / g.evidence);
  if (grounded < 1) add('Report', `Report not fully backed by pinned evidence (${Math.round(grounded * 100)}% credit)`, -(rep - rep * grounded), 0, 'Pin the events that prove each part of your report.');
  rep *= grounded;
  const parts = { triage: Math.min(tri, triMax), evidence: Math.min(evi, g.evidence), response: Math.min(res, g.response), report: Math.min(rep, g.reportTotal) };
  const total = Math.round(parts.triage + parts.evidence + parts.response + parts.report);
  let tier = total >= g.gold ? 3 : total >= g.silver ? 2 : total >= g.bronze ? 1 : 0;
  // However well the rest went, a breach you could have stopped caps the medal.
  const capped = late.length > 0 && tier > 1;
  if (capped) {
    tier = 1;
    add('Response', 'Medal capped at bronze', 0, 0, 'The data left the network. A good investigation does not make up for that.');
  }
  return { total, tier, capped, parts, max: { triage: triMax, evidence: g.evidence, response: g.response, report: g.reportTotal }, lines, minutes: st.clock - scn.clockStart, disruption: st.disruption };
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
    const [action, target] = f.split(':');
    if (!scn.responses.some((r) => (r.action === action && r.target === target) || (r.sets || []).includes(f))) out.push(`event ${e.id}: nothing the player can do sets ${f}`);
  }
  const goodSum = scn.responses.filter((r) => r.good).reduce((n, r) => n + r.points, 0);
  if (goodSum !== scn.grading.response) out.push(`good responses are worth ${goodSum}, the response score is ${scn.grading.response}`);
  const roles = new Set(scn.events.filter((e) => e.key && e.keyWeight !== 0).map((e) => e.key));
  for (const r of roles) if (!scn.roleLabels[r] || !scn.roleHints[r]) out.push(`evidence role ${r} needs a label and a hint`);
  const repSum = Object.values(scn.grading.report).reduce((n, v) => n + v, 0);
  if (repSum !== scn.grading.reportTotal) out.push(`report parts add up to ${repSum}, not ${scn.grading.reportTotal}`);
  const total = scn.grading.triage + scn.grading.evidence + scn.grading.response + scn.grading.reportTotal;
  if (total !== 100) out.push(`grading adds up to ${total}, not 100`);
  if (!Number.isFinite(scn.horizon) || scn.horizon <= scn.clockStart) out.push('horizon must be after the start');
  if (scn.alerts.some((a) => !a.late && a.at > scn.clockStart)) out.push('an alert that is not marked late appears after the start');
  return out;
}
