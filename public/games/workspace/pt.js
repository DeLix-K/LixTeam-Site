// Penetration testing logic: an engagement with rules, a small lab of mock services, simulated tools and a findings report.
// Pure functions: no page, no clock. Judgement level only: nothing here describes how to exploit anything. The lab is fiction,
// every "scan" is a table of invented results, every "check" is a one-line outcome, and the point is what a professional
// does with them: stay in scope, use proportionate checks, collect evidence, stop when told to, and report what the
// evidence supports at the right severity with a sensible fix.

export const SEVERITIES = [['info', 'Informational'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']];
export const SCAN_MODES = [['gentle', 'Gentle scan'], ['fast', 'Fast scan']];

export const newState = () => ({ scanned: {}, visited: [], checks: [], evidence: [], asked: [], findings: [], violations: [], notified: [], crashed: [], triggers: [], harm: [] });

export const discovered = (scn, st) => scn.pt.hosts.filter((h) => h.listed || (h.discoveredBy || []).some((n) => st.pt.visited.includes(n)));
export const hasEvidence = (st, id) => st.pt.evidence.includes(id);
export const hostOf = (scn, id) => scn.pt.hosts.find((h) => h.id === id) || null;
export const nodeOf = (scn, nid) => scn.pt.hosts.flatMap((h) => h.nodes.map((n) => ({ ...n, host: h.id }))).find((n) => n.id === nid) || null;
export const label = (list, id) => (list.find((x) => x[0] === id) || [])[1];

// A node can be opened once its host has been scanned (for entry pages) or once a page that links to it has been seen.
export function reachable(scn, st, host, node) {
  if (node.entry && st.pt.scanned[host.id]) return true;
  return st.pt.visited.some((v) => (nodeOf(scn, v)?.links || []).includes(node.id));
}

const step = (a, b, order) => {
  const d = Math.abs(order.indexOf(a) - order.indexOf(b));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
};

// How well a drafted finding matches one real finding.
export function scoreFinding(scn, st, t) {
  const f = st.pt.findings.find((x) => x.vuln === t.id);
  if (!f) return { found: false, points: 0, max: scn.pt.points.perFinding, parts: [] };
  const per = scn.pt.points.perFinding;
  const cited = f.evidence || [];
  const needed = t.requires.every((e) => cited.includes(e) && st.pt.evidence.includes(e));
  const parts = [];
  const doc = needed ? 0.4 : cited.some((e) => t.requires.includes(e)) ? 0.2 : 0.1;
  parts.push({ what: 'documented', got: doc, max: 0.4, note: needed ? '' : 'The evidence that proves it was not all collected and cited.' });
  const sev = 0.2 * step(f.severity, t.severity, SEVERITIES.map((x) => x[0]));
  parts.push({ what: 'severity', got: sev, max: 0.2, note: f.severity === t.severity ? '' : `Rated ${f.severity}; the evidence and the context support ${t.severity}.` });
  const imp = f.impact === t.impact ? 0.2 : 0;
  parts.push({ what: 'impact', got: imp, max: 0.2, note: imp ? '' : 'The impact statement over- or under-states what the evidence shows.' });
  const fixOpt = t.fixes.find((x) => x.id === f.fix);
  const fix = fixOpt ? (fixOpt.rating === 'good' ? 0.2 : fixOpt.rating === 'fine' ? 0.1 : 0) : 0;
  parts.push({ what: 'fix', got: fix, max: 0.2, note: fixOpt && fixOpt.rating !== 'good' ? fixOpt.why : '' });
  const total = parts.reduce((n, p) => n + p.got, 0);
  return { found: true, points: per * total, max: per, parts, finding: f };
}

// Findings written about things that are not vulnerabilities, or that the evidence does not support.
export function falsePositives(scn, st) {
  return st.pt.findings.filter((f) => {
    const t = scn.pt.truths.find((x) => x.id === f.vuln);
    if (t) return false;
    const d = scn.pt.decoys.find((x) => x.id === f.vuln);
    return !d || f.severity !== 'info'; // an informational note about an expected service is fine
  });
}
