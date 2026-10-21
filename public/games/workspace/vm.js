// Vulnerability management logic: findings, assets, a remediation budget, and a model of true risk.
// Pure functions: no page, no clock. The state lives in the run (`st.vm`); the engine wraps these with time.
//
// The point of the exercise is that the number a scanner shows (CVSS) is not the risk. Each finding carries a hidden
// "true risk" from 0 to 100 that comes from the asset behind it, whether it is reachable, whether it is being
// exploited, and what already protects it. The player sees the ingredients, decides, and is graded against the best
// that could have been done with the same budget.

export const KINDS = ['patch', 'mitigate', 'config', 'accept', 'defer', 'fp'];

export const finalRisk = (f) => f.riskExploited ?? f.risk;
// What the player can know at a given minute: advisories change the picture as the day goes on.
export const riskAt = (f, t) => (f.exploitedFrom !== undefined && t >= f.exploitedFrom && f.riskExploited !== undefined ? f.riskExploited : f.risk);
export const exploitedAt = (f, t) => f.exploited || (f.exploitedFrom !== undefined && t >= f.exploitedFrom);
export const band = (r) => (r >= 70 ? 'Critical' : r >= 45 ? 'High' : r >= 20 ? 'Medium' : 'Low');

export const newState = (scn) => ({ decisions: {}, failed: {}, dry: {}, spent: 0, harm: [] });
export const remaining = (scn, st) => scn.vm.budget - st.vm.spent;

export const optionOf = (f, id) => f.options.find((o) => o.id === id) || null;
// Every finding can also be accepted, deferred, or marked as a false positive, at no cost.
export const FREE = [
  { id: 'accept', kind: 'accept', label: 'Accept the risk', cost: 0, effect: 0 },
  { id: 'defer', kind: 'defer', label: 'Defer to the next window', cost: 0, effect: 0 },
  { id: 'fp', kind: 'fp', label: 'Mark as a false positive', cost: 0, effect: 0 },
];
export const allOptions = (f) => [...f.options, ...FREE];
export const findOption = (f, id) => allOptions(f).find((o) => o.id === id) || null;

// What a decision achieved: the share of the finding's true risk that is gone.
export function effectOf(scn, st, f) {
  const d = st.vm.decisions[f.id];
  if (!d || d.kind !== 'done') return 0;
  return findOption(f, d.option).effect;
}
export const removed = (scn, st) => scn.vm.findings.reduce((n, f) => n + finalRisk(f) * effectOf(scn, st, f), 0);
export const totalRisk = (scn) => scn.vm.findings.reduce((n, f) => n + finalRisk(f), 0);

// The best that could have been done: choose at most one working option per finding to remove the most risk
// within the budget. Options that break something are not candidates. Costs are in half hours.
const memo = new WeakMap();
export function optimum(scn) {
  if (memo.has(scn)) return memo.get(scn);
  const cap = Math.round(scn.vm.budget * 2);
  let best = new Array(cap + 1).fill(0);
  let pick = [];
  for (const f of scn.vm.findings) {
    const next = best.slice();
    const choice = new Array(cap + 1).fill(null);
    for (const o of f.options) {
      if (o.breaks) continue;
      const c = Math.round(o.cost * 2);
      const v = finalRisk(f) * o.effect;
      for (let b = c; b <= cap; b++) if (best[b - c] + v > next[b]) {
        next[b] = best[b - c] + v;
        choice[b] = o.id;
      }
    }
    pick.push(choice);
    best = next;
  }
  // walk back to see which options the best plan used (the debrief can name them)
  const used = [];
  let b = cap;
  for (let i = scn.vm.findings.length - 1; i >= 0; i--) {
    const id = pick[i][b];
    if (id) {
      used.push({ finding: scn.vm.findings[i].id, option: id });
      b -= Math.round(optionOf(scn.vm.findings[i], id).cost * 2);
    }
  }
  const out = { value: best[cap], used: used.reverse() };
  memo.set(scn, out);
  return out;
}
