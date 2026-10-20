// Access logic for the cloud workspaces. Pure functions: no page, no clock.
//
// A cloud estate is a set of identities (people, groups, roles, service accounts) and resources (storage,
// databases, servers, secrets). Access comes from grants ("this identity may do these things to these
// resources"), from group membership, from roles an identity is allowed to assume, and from resources that are
// open to the public. Everything the player does is a fix: a small named change to one of those things. The state
// is never edited directly; it is always rebuilt from the scenario plus the list of fixes applied, which makes
// undo trivial and lets the logs be judged by the state in force when each event happened.

export const PUBLIC = 'PUBLIC';
export const ATTACKER = 'ATTACKER';

const IMPLIES = { admin: ['admin', 'read', 'write', 'list', 'delete'], write: ['write', 'list'], read: ['read', 'list'], list: ['list'], delete: ['delete'] };
export const expand = (actions) => [...new Set(actions.flatMap((a) => IMPLIES[a] || [a]))];

// ── State ───────────────────────────────────────────────────────
export function materialize(scn, applied) {
  const c = scn.cloud;
  const s = {
    res: Object.fromEntries(c.resources.map((r) => [r.id, { ...r.config }])),
    grants: c.grants.map((g) => ({ ...g, resources: [...g.resources], actions: [...g.actions] })),
    trusts: c.trusts.map((t) => ({ ...t })),
    ids: Object.fromEntries(c.identities.map((i) => [i.id, { ...i.config }])),
    applied: [...applied],
  };
  for (const id of applied) {
    const fix = c.fixes.find((f) => f.id === id);
    if (!fix) continue;
    for (const e of fix.effects) {
      if (e.kind === 'res') Object.assign(s.res[e.id], e.set);
      else if (e.kind === 'id') Object.assign(s.ids[e.id], e.set);
      else if (e.kind === 'grant') Object.assign(s.grants.find((g) => g.id === e.id), e.set);
      else if (e.kind === 'trust') Object.assign(s.trusts.find((t) => t.id === e.id), e.set);
    }
  }
  return s;
}

export const appliedAt = (st, t) => {
  let cur = st.cloud.history[0].applied;
  for (const h of st.cloud.history) if (h.at <= t) cur = h.applied;
  return cur;
};
export const currentApplied = (st) => st.cloud.history[st.cloud.history.length - 1].applied;
const memo = new WeakMap();
export function stateFor(scn, applied) {
  const key = applied.join('|');
  let byScn = memo.get(scn);
  if (!byScn) memo.set(scn, (byScn = new Map()));
  if (!byScn.has(key)) byScn.set(key, materialize(scn, applied));
  return byScn.get(key);
}
export const stateNow = (scn, st) => stateFor(scn, currentApplied(st));
export const stateAtTime = (scn, st, t) => stateFor(scn, appliedAt(st, t));

// ── Who can do what ─────────────────────────────────────────────
// For one principal: every (resource, action) it can reach, each with the chain that gives it.
function reachFor(scn, s, who) {
  const out = new Map();
  const give = (resId, actions, why) => {
    if (s.res[resId].deleted) return;
    for (const a of expand(actions)) if (!out.has(`${resId}|${a}`)) out.set(`${resId}|${a}`, why);
  };
  const allRes = scn.cloud.resources.map((r) => r.id);
  if (who === PUBLIC) {
    for (const r of scn.cloud.resources) {
      const p = s.res[r.id].public;
      if (p && p !== 'none') give(r.id, [p], [`${r.name} is open to the public (${p})`]);
    }
    return out;
  }
  if (s.ids[who] && s.ids[who].disabled) return out;
  // identities whose grants apply: itself, its groups, and roles it may assume, transitively
  const chain = new Map([[who, [who]]]);
  const queue = [who];
  const idCfg = (id) => scn.cloud.identities.find((i) => i.id === id);
  while (queue.length) {
    const cur = queue.shift();
    const meta = idCfg(cur);
    for (const g of (meta && meta.memberOf) || []) if (!chain.has(g)) { chain.set(g, [...chain.get(cur), `member of ${g}`]); queue.push(g); }
    for (const t of s.trusts) {
      if (t.removed || chain.has(t.to)) continue;
      const holds = t.from === cur;
      if (!holds) continue;
      if (t.needsMfa && !(s.ids[who] && s.ids[who].mfa)) continue;
      chain.set(t.to, [...chain.get(cur), `may assume ${t.to}`]);
      queue.push(t.to);
    }
  }
  for (const g of s.grants) {
    if (g.removed || !chain.has(g.who)) continue;
    const res = g.resources.includes('*') ? allRes : g.resources;
    for (const r of res) give(r, g.actions, [...chain.get(g.who), `grant "${g.label}"`]);
  }
  return out;
}

const reachMemo = new WeakMap();
function reach(scn, s, who) {
  let m = reachMemo.get(s);
  if (!m) reachMemo.set(s, (m = new Map()));
  if (!m.has(who)) m.set(who, reachFor(scn, s, who));
  return m.get(who);
}

// The attacker is the public plus every leaked key that has not been rotated or disabled.
export const attackerHolds = (scn, s) => [PUBLIC, ...scn.cloud.attacker.leaked.filter((id) => !s.ids[id].keyRotated && !s.ids[id].disabled).map((id) => `LEAK:${id}`)];

export function explain(scn, s, who, resId, action) {
  if (who === ATTACKER) {
    for (const h of attackerHolds(scn, s)) {
      const e = explain(scn, s, h, resId, action);
      if (e) return e;
    }
    return null;
  }
  if (who.startsWith('LEAK:')) {
    const id = who.slice(5);
    if (s.ids[id].keyRotated || s.ids[id].disabled) return null;
    const e = explain(scn, s, id, resId, action);
    return e ? [`the attacker holds the leaked key for ${id}`, ...e] : null;
  }
  return reach(scn, s, who).get(`${resId}|${action}`) || null;
}
export const can = (scn, s, who, resId, action) => !!explain(scn, s, who, resId, action);

// Everything one principal can do to one resource, or everyone who can do anything to it.
export function whoCanReach(scn, s, resId) {
  const list = [];
  const principals = [PUBLIC, ...scn.cloud.identities.map((i) => i.id)];
  for (const p of principals) {
    const acts = ['admin', 'write', 'read'].filter((a) => reach(scn, s, p).has(`${resId}|${a}`));
    if (acts.length) list.push({ who: p, action: acts[0], why: reach(scn, s, p).get(`${resId}|${acts[0]}`) });
  }
  return list;
}
export function whatCanReach(scn, s, who) {
  const list = [];
  for (const r of scn.cloud.resources) {
    const acts = ['admin', 'write', 'read'].filter((a) => reach(scn, s, who).has(`${r.id}|${a}`));
    if (acts.length) list.push({ resource: r.id, action: acts[0], why: reach(scn, s, who).get(`${r.id}|${acts[0]}`) });
  }
  return list;
}

// ── Checks the grading and the business panel use ───────────────
const open = (scn, s, chk) => can(scn, s, chk.who, chk.resource, chk.action);
export const threatStatus = (scn, s) => scn.cloud.threats.map((th) => ({ ...th, blocked: !th.checks.some((c) => open(scn, s, c)) }));
export const needStatus = (scn, s) => scn.cloud.needs.map((n) => ({ ...n, ok: can(scn, s, n.who, n.resource, n.action) }));
const cfgDone = (s, c) => (c.res ? s.res[c.res][c.key] : s.ids[c.id][c.key]) === c.value;
export const findingStatus = (scn, s) => scn.cloud.findings.map((f) => ({ ...f, closed: f.cfg ? cfgDone(s, f.cfg) : !f.checks.some((c) => open(scn, s, c)) }));

export const fixById = (scn, id) => scn.cloud.fixes.find((f) => f.id === id);
export const fixesFor = (scn, target) => scn.cloud.fixes.filter((f) => f.target === target);
