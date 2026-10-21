// Security engineering logic: a small system described by settings and connections, a baseline the system must meet,
// features that must keep working, and a simulated pipeline that checks both. Pure functions: no page, no clock.
//
// The engineer edits a working copy. Nothing changes in production until a release, and a release normally needs a
// pipeline run that passed on exactly the config being released. The pipeline tests the baseline (security) and the
// features (function) separately, so a change that satisfies one can break the other.

// ── Conditions ──────────────────────────────────────────────────
// { s: 'web.debug', eq: false } | { s, in: [...] } | { s, gte } | { s, lte } | { e: 'e5', allow: false } | { all: [...] } | { any: [...] }
export function holds(c, state) {
  if (c.all) return c.all.every((x) => holds(x, state));
  if (c.any) return c.any.some((x) => holds(x, state));
  if (c.e) return state.edges[c.e] === c.allow;
  const v = state.cfg[c.s];
  if ('eq' in c) return v === c.eq;
  if ('in' in c) return c.in.includes(v);
  if ('gte' in c) return Number(v) >= c.gte;
  if ('lte' in c) return Number(v) <= c.lte;
  return false;
}

export function initialState(scn) {
  const cfg = {};
  for (const c of scn.eng.components) for (const s of c.settings || []) cfg[`${c.id}.${s.id}`] = s.value;
  const edges = Object.fromEntries(scn.eng.edges.map((e) => [e.id, e.initial]));
  return { cfg, edges };
}
export const cloneState = (s) => ({ cfg: { ...s.cfg }, edges: { ...s.edges } });
export const stateKey = (s) => JSON.stringify([Object.entries(s.cfg).sort(), Object.entries(s.edges).sort()]);
export const sameState = (a, b) => stateKey(a) === stateKey(b);

export const settingOf = (scn, id) => {
  for (const c of scn.eng.components) for (const s of c.settings || []) if (`${c.id}.${s.id}` === id) return { component: c, setting: s };
  return null;
};

export function diff(scn, from, to) {
  const out = [];
  for (const k of Object.keys(from.cfg)) if (from.cfg[k] !== to.cfg[k]) out.push({ kind: 'setting', id: k, from: from.cfg[k], to: to.cfg[k] });
  for (const e of scn.eng.edges) if (from.edges[e.id] !== to.edges[e.id]) out.push({ kind: 'edge', id: e.id, from: from.edges[e.id], to: to.edges[e.id], edge: e });
  return out;
}

// ── Baseline and features ───────────────────────────────────────
export const policyResults = (scn, state) => scn.eng.policy.map((p) => ({ ...p, ok: holds(p.test, state) }));
export const featureResults = (scn, state) => scn.eng.features.map((f) => ({ ...f, ok: holds(f.needs, state) }));
export const policyScore = (scn, state) => policyResults(scn, state).reduce((n, p) => n + (p.ok ? p.weight : 0), 0);
export const featureScore = (scn, state) => featureResults(scn, state).reduce((n, f) => n + (f.ok ? f.weight : 0), 0);

// ── The pipeline ────────────────────────────────────────────────
// Stages run in order and stop at the first failure. Each reports what it found.
export function runPipeline(scn, state) {
  const stages = [];
  const stop = () => stages.some((x) => x.status === 'fail');
  const add = (id, name, status, lines) => stages.push({ id, name, status, lines });
  const skipped = (id, name) => add(id, name, 'skipped', []);
  const defs = [
    ['validate', 'Validate the configuration'],
    ['secrets', 'Scan for secrets'],
    ['policy', 'Check the security baseline'],
    ['staging', 'Deploy to staging'],
    ['integration', 'Run the integration tests'],
  ];
  for (const [id, name] of defs) {
    if (stop()) {
      skipped(id, name);
      continue;
    }
    if (id === 'validate') {
      const bad = scn.eng.components.flatMap((c) => (c.settings || []).filter((s) => s.type === 'number' && !(Number.isInteger(Number(state.cfg[`${c.id}.${s.id}`])) && Number(state.cfg[`${c.id}.${s.id}`]) >= 0)).map((s) => `${c.id}.${s.id} must be a whole number of 0 or more`));
      add(id, name, bad.length ? 'fail' : 'pass', bad.length ? bad : ['The configuration parses and every value is valid.']);
    } else if (id === 'secrets') {
      const hit = scn.eng.secretScan.filter((x) => holds(x.when, state));
      add(id, name, hit.length ? 'fail' : 'pass', hit.length ? hit.map((x) => x.message) : ['No secrets found in the repository.']);
    } else if (id === 'policy') {
      const res = policyResults(scn, state);
      const gating = res.filter((p) => !p.ok && ['critical', 'high'].includes(p.sev));
      const warn = res.filter((p) => !p.ok && !['critical', 'high'].includes(p.sev));
      const lines = [...gating.map((p) => `FAIL (${p.sev}): ${p.label}`), ...warn.map((p) => `Warning (${p.sev}): ${p.label}`)];
      add(id, name, gating.length ? 'fail' : 'pass', lines.length ? lines : ['Every baseline check passes.']);
    } else if (id === 'staging') {
      const hard = scn.eng.deployBlockers.filter((b) => holds(b.when, state));
      add(id, name, hard.length ? 'fail' : 'pass', hard.length ? hard.map((b) => b.message) : ['The staging environment starts and passes its health checks.']);
    } else if (id === 'integration') {
      const res = featureResults(scn, state);
      const broken = res.filter((f) => !f.ok);
      add(id, name, broken.length ? 'fail' : 'pass', broken.length ? broken.map((f) => `FAIL: ${f.label}. ${f.why}`) : ['Every feature test passes.']);
    }
  }
  return { stages, passed: stages.every((x) => x.status === 'pass') };
}
