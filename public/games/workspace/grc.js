// Governance, risk and compliance logic: audit findings, a risk register, a control-to-framework map and a treatment budget.
// Pure functions: no page, no clock. The state lives in the run (`st.grc`); the engine wraps these with time.
//
// A finding has a hidden true rating (likelihood and impact, each 1 to 5), so a hidden true risk. The player reads the
// evidence, rates the risk, names an owner, and chooses a treatment: fix it, transfer it, accept it or challenge the
// auditor. Some findings are overrated, one is underrated and two are wrong. The plan is graded against the best use
// of the same budget.

export const KINDS = ['treat', 'transfer', 'accept', 'challenge'];
export const risk = (f) => f.L * f.I;
export const trueRisk = (f) => f.L * f.I * 4; // 0 to 100, for removal arithmetic
export const bandOf = (score) => (score >= 12 ? 'Treat' : score <= 6 ? 'Tolerable' : 'Owner decides');
export const heat = (score) => (score >= 15 ? 'extreme' : score >= 12 ? 'high' : score >= 8 ? 'medium' : 'low');

export const newState = () => ({ docs: {}, rate: {}, owner: {}, treat: {}, failed: {}, spent: 0, harm: [], map: {} });
export const remaining = (scn, st) => scn.grc.budget - st.grc.spent;

export const FREE = [
  { id: 'accept', kind: 'accept', label: 'Accept the risk (with the owner\'s sign-off)', cost: 0, effect: 0 },
  { id: 'challenge', kind: 'challenge', label: 'Challenge the finding with evidence', cost: 0, effect: 0 },
];
export const allOptions = (f) => [...f.options, ...FREE];
export const findOption = (f, id) => allOptions(f).find((o) => o.id === id) || null;

export const docsOpened = (st, fid) => (st.grc.docs[fid] || []).length;
export const hasDoc = (st, fid, did) => (st.grc.docs[fid] || []).includes(did);

// What a decision achieved: the share of the finding's true risk that is gone.
export function effectOf(scn, st, f) {
  const d = st.grc.treat[f.id];
  if (!d || d.kind !== 'done') return 0;
  return d.option === 'challenge' ? 1 : findOption(f, d.option).effect;
}
export const removed = (scn, st) => scn.grc.findings.reduce((n, f) => n + trueRisk(f) * effectOf(scn, st, f), 0);

// The best that could have been done within the budget (in £k). A valid challenge removes the finding for free;
// a challenge of a finding that is real is not a candidate.
const memo = new WeakMap();
export function optimum(scn) {
  if (memo.has(scn)) return memo.get(scn);
  const cap = scn.grc.budget;
  let best = new Array(cap + 1).fill(0);
  const picks = [];
  for (const f of scn.grc.findings) {
    const next = best.slice();
    const choice = new Array(cap + 1).fill(null);
    const opts = [...f.options.map((o) => ({ id: o.id, cost: o.cost, v: trueRisk(f) * o.effect }))];
    if (f.challenge && f.challenge.valid) opts.push({ id: 'challenge', cost: 0, v: trueRisk(f) });
    for (const o of opts) for (let b = o.cost; b <= cap; b++) if (best[b - o.cost] + o.v > next[b]) {
      next[b] = best[b - o.cost] + o.v;
      choice[b] = o.id;
    }
    picks.push(choice);
    best = next;
  }
  const used = [];
  let b = cap;
  for (let i = scn.grc.findings.length - 1; i >= 0; i--) {
    const id = picks[i][b];
    if (id) {
      const f = scn.grc.findings[i];
      used.push({ finding: f.id, option: id });
      b -= id === 'challenge' ? 0 : f.options.find((o) => o.id === id).cost;
    }
  }
  const out = { value: best[cap], used: used.reverse() };
  memo.set(scn, out);
  return out;
}

// ── The control map ─────────────────────────────────────────────
export const toggleMap = (st, control, req, on) => {
  const cur = new Set(st.grc.map[control] || []);
  if (on) cur.add(req);
  else cur.delete(req);
  st.grc.map[control] = [...cur];
};
export const mapped = (st, control, req) => (st.grc.map[control] || []).includes(req);
export const coverage = (scn, st) => scn.grc.requirements.map((r) => ({ ...r, controls: scn.grc.controls.filter((c) => mapped(st, c.id, r.id)).map((c) => c.id) }));

// Full marks for a ticked genuine fit, half for a partial one, and a penalty for claiming a fit that is not there.
export function mapScore(scn, st) {
  let earned = 0;
  let max = 0;
  const detail = [];
  for (const c of scn.grc.controls) {
    for (const r of scn.grc.requirements) {
      const truth = (c.fits || {})[r.id];
      const ticked = mapped(st, c.id, r.id);
      if (truth === 'full') max += 1;
      else if (truth === 'partial') max += 0.5;
      if (ticked) {
        const pts = truth === 'full' ? 1 : truth === 'partial' ? 0.5 : -0.5;
        earned += pts;
        if (pts < 0) detail.push({ control: c.id, req: r.id, kind: 'false' });
      } else if (truth === 'full') detail.push({ control: c.id, req: r.id, kind: 'missed' });
    }
  }
  return { earned: Math.max(0, earned), max, ratio: max ? Math.max(0, earned) / max : 0, detail };
}
