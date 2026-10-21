// Operational technology logic: a plant described as assets in zones, links between them, controls that change the links,
// exposure paths an attacker could use and the operations that must keep running. Pure functions: no page, no clock.
//
// Defensive judgement only. A link means "this asset can start a connection to that one". A control changes links: remove one,
// make it one-way, put a guard on it (a jump host with a second factor, or an industrial firewall that allows only the one
// protocol), or add new ones. An exposure path is open while its entry link exists, is not guarded, and an attacker who gets
// through it can reach a safety-critical controller along unguarded links. An operation is running while one of its routes
// has every link in place. Nothing here describes how to attack anything.

const clone = (x) => JSON.parse(JSON.stringify(x));

export const newState = () => ({ applied: [], trips: [], seq: 0 });

export const controlOf = (scn, id) => scn.ot.controls.find((c) => c.id === id) || null;

// ── The graph at a moment ───────────────────────────────────────
// A control takes effect at `eff`: when the work is finished, or when its maintenance window opens.
export function graphAt(scn, st, t) {
  const g = { assets: clone(scn.ot.assets.filter((a) => !a.hidden)), links: clone(scn.ot.links) };
  const list = st.ot.applied.filter((a) => a.eff <= t).sort((a, b) => a.eff - b.eff || a.seq - b.seq);
  for (const a of list) applyEffect(g, controlOf(scn, a.id).effect);
  return g;
}
export const graphNow = (scn, st) => graphAt(scn, st, st.clock);
export const graphFinal = (scn, st) => graphAt(scn, st, Infinity);

function applyEffect(g, fx = {}) {
  for (const a of fx.addAssets || []) if (!g.assets.some((x) => x.id === a.id)) g.assets.push({ ...clone(a), hidden: false });
  g.links = g.links.filter((l) => !(fx.remove || []).includes(l.id));
  for (const l of g.links) {
    if ((fx.oneway || []).includes(l.id)) l.both = false;
    if ((fx.guard || []).includes(l.id)) l.guarded = true;
  }
  for (const l of fx.add || []) if (!g.links.some((x) => x.id === l.id)) g.links.push(clone(l));
}

// ── Exposure ────────────────────────────────────────────────────
const out = (g, id, guardedOk) => g.links.filter((l) => (guardedOk || !l.guarded) && (l.a === id || (l.both && l.b === id))).map((l) => (l.a === id ? l.b : l.a));

export function reachable(g, from, guardedOk = false) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const nxt of out(g, cur, guardedOk)) if (!seen.has(nxt)) { seen.add(nxt); queue.push(nxt); }
  }
  return seen;
}

const zoneOf = (g, id) => (g.assets.find((a) => a.id === id) || {}).zone;

// What an attacker who gets through the entry link can reach, and by which assets.
export function threatOpen(scn, g, th) {
  const entry = g.links.find((l) => l.id === th.entry);
  if (!entry || entry.guarded) return false;
  const from = th.source === 'INTERNET' ? zoneOf(g, entry.a) === 'INTERNET' : entry.a === th.source;
  if (!from) return false;
  const reach = reachable(g, entry.b);
  return g.assets.some((a) => a.critical && reach.has(a.id));
}
export const threatStatus = (scn, g) => scn.ot.threats.map((th) => ({ ...th, blocked: !threatOpen(scn, g, th) }));
export const threatClosedAt = (scn, st, id, t) => {
  const th = scn.ot.threats.find((x) => x.id === id);
  return th ? !threatOpen(scn, graphAt(scn, st, t), th) : false;
};

// The route an attacker would take, for the plant map.
export function route(scn, g, th) {
  const entry = g.links.find((l) => l.id === th.entry);
  if (!entry) return [];
  const prev = new Map([[entry.b, entry.a]]);
  const queue = [entry.b];
  let hit = null;
  while (queue.length && !hit) {
    const cur = queue.shift();
    if ((g.assets.find((a) => a.id === cur) || {}).critical) { hit = cur; break; }
    for (const nxt of out(g, cur, false)) if (!prev.has(nxt)) { prev.set(nxt, cur); queue.push(nxt); }
  }
  if (!hit) return [entry.a, entry.b];
  const path = [hit];
  while (prev.has(path[0])) path.unshift(prev.get(path[0]));
  return path;
}

// ── Operations that must keep running ───────────────────────────
export const opRunning = (g, op) => op.routes.some((r) => r.every((id) => g.links.some((l) => l.id === id)));
export const opStatus = (scn, g) => scn.ot.ops.map((o) => ({ ...o, ok: opRunning(g, o) }));

// ── Monitoring ──────────────────────────────────────────────────
export const monitored = (scn, st) => scn.ot.controls.filter((c) => c.monitors && st.ot.applied.some((a) => a.id === c.id));

// ── Windows and money ───────────────────────────────────────────
export const inWindow = (scn, t) => scn.ot.windows.some(([a, b]) => t >= a && t < b);
export const nextWindow = (scn, t) => scn.ot.windows.find(([, b]) => t < b) || null;
export const spent = (scn, st) => st.ot.applied.reduce((n, a) => n + controlOf(scn, a.id).cost, 0);
export const remaining = (scn, st) => Math.round((scn.ot.budget - spent(scn, st)) * 10) / 10;
export const isApplied = (st, id) => st.ot.applied.some((a) => a.id === id);

// What a control would do to the plant if it went in now: used for the "what breaks" preview.
export function preview(scn, st, id) {
  const c = controlOf(scn, id);
  // A control that needs another is judged as if the other were already in place: the preview is about this control's own effect.
  const before = graphFinal(scn, st);
  const needs = [];
  const want = (x) => { for (const n of controlOf(scn, x).needs || []) if (!isApplied(st, n) && !needs.includes(n)) { want(n); needs.push(n); } };
  want(id);
  for (const n of needs) applyEffect(before, controlOf(scn, n).effect);
  const after = clone(before);
  applyEffect(after, c.effect);
  const th0 = threatStatus(scn, before);
  const th1 = threatStatus(scn, after);
  const op0 = opStatus(scn, before);
  const op1 = opStatus(scn, after);
  return {
    closes: th1.filter((t, i) => t.blocked && !th0[i].blocked),
    breaks: op1.filter((o, i) => !o.ok && op0[i].ok),
    fixes: op1.filter((o, i) => o.ok && !op0[i].ok),
  };
}
