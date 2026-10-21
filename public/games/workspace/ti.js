// Threat intelligence logic: sources and reports, claims, indicators and the links between them, and the brief.
// Pure functions: no page, no clock. The state lives in the run (`st.ti`); the engine wraps these with time.
//
// The job is not to collect indicators but to judge them. Each report comes from a source of a certain reliability and
// says things of a certain credibility. Each claim is a fact, an assessment, an assumption or a rumour. Each indicator is
// core to the campaign, peripheral, or noise that would do harm if blocked. The brief the player writes is graded for
// what it asserts, how confidently, and what it asks the defender to do.

export const REL = [['A', 'Reliable'], ['B', 'Usually reliable'], ['C', 'Unproven or unreliable']];
export const CRED = [['1', 'Confirmed by other sources'], ['2', 'Probably true'], ['3', 'Doubtful']];
export const CLASSES = [['fact', 'Fact'], ['assessment', 'Assessment'], ['assumption', 'Assumption'], ['rumour', 'Rumour']];
export const CONF = ['low', 'moderate', 'high'];
export const BASES = [
  ['same-cert', 'Shares the same TLS certificate'],
  ['resolves-to', 'Resolves to this address'],
  ['same-registrant', 'Registered by the same contact'],
  ['delivers', 'Delivers this file'],
  ['same-family', 'Same malware family'],
  ['sends-from', 'Sends mail from this address'],
  ['same-pattern', 'Similar name only'],
  ['same-network', 'Addresses in the same range'],
];

export const newState = (scn) => ({ read: [], rate: {}, claim: {}, enriched: [], credits: scn.ti.credits, links: [] });

export const reportRead = (st, id) => st.ti.read.includes(id);
export const visibleIndicators = (scn, st) => scn.ti.indicators.filter((i) => i.from.some((r) => reportRead(st, r)));
export const visibleClaims = (scn, st) => scn.ti.claims.filter((c) => reportRead(st, c.report));
export const pairKey = (a, b) => [a, b].sort().join('|');
export const hasLink = (st, a, b) => st.ti.links.some((l) => pairKey(l.a, l.b) === pairKey(a, b));

// ── Scoring ─────────────────────────────────────────────────────
const step = (a, b, order) => {
  const d = Math.abs(order.indexOf(a) - order.indexOf(b));
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
};

export function scoreReports(scn, st) {
  const per = scn.ti.points.reports / scn.ti.reports.length;
  return scn.ti.reports.map((r) => {
    const g = st.ti.rate[r.id];
    const rel = g ? step(g.rel, r.rel, REL.map((x) => x[0])) : 0;
    const cred = g ? step(g.cred, r.cred, CRED.map((x) => x[0])) : 0;
    return { id: r.id, got: g, points: per * (rel + cred) / 2, max: per, report: r };
  });
}

// A fact needs corroboration; an assessment is a reasoned inference; an assumption has no support; a rumour comes from
// a source nobody should rely on. Adjacent classes earn half.
const CLS_ORDER = ['fact', 'assessment', 'assumption', 'rumour'];
export function scoreClaims(scn, st) {
  const per = scn.ti.points.claims / scn.ti.claims.length;
  return scn.ti.claims.map((c) => {
    const got = st.ti.claim[c.id];
    return { id: c.id, got, points: got ? per * step(got, c.truth, CLS_ORDER) : 0, max: per, claim: c };
  });
}

export function scoreLinks(scn, st) {
  let earned = 0;
  let max = 0;
  const found = [];
  const missed = [];
  const falseLinks = [];
  for (const t of scn.ti.links) {
    const w = t.strength === 'strong' ? 1 : 0.5;
    max += w;
    const mine = st.ti.links.find((l) => pairKey(l.a, l.b) === pairKey(t.a, t.b));
    if (!mine) {
      if (t.strength === 'strong') missed.push(t);
      continue;
    }
    earned += mine.basis === t.basis ? w : w / 2;
    found.push(t);
  }
  for (const l of st.ti.links) if (!scn.ti.links.some((t) => pairKey(t.a, t.b) === pairKey(l.a, l.b))) {
    earned -= 0.5;
    falseLinks.push(l);
  }
  const ratio = max ? Math.max(0, earned) / max : 0;
  return { ratio: Math.min(1, ratio), points: scn.ti.points.links * Math.min(1, ratio), max: scn.ti.points.links, found, missed, falseLinks };
}

// The brief: { judge: { J1: 'moderate', ... } (only the ones included), iocs: [], recs: [], decision, summary }
export function scoreBrief(scn, brief) {
  const b = brief || {};
  const P = scn.ti.points;
  const lines = [];
  let jPts = 0;
  for (const j of scn.ti.judgements) {
    const conf = (b.judge || {})[j.id];
    if (j.include) {
      if (!conf) {
        lines.push({ label: `Left out: ${j.text}`, points: 0, max: j.weight, note: j.why });
        continue;
      }
      const m = step(conf, j.conf, CONF);
      const pts = j.weight * (m === 1 ? 1 : m === 0.5 ? 0.6 : 0.25);
      jPts += pts;
      lines.push({ label: `${j.text} (${conf} confidence)`, points: pts, max: j.weight, note: m === 1 ? '' : `The evidence supports ${j.conf} confidence, not ${conf}. ${j.why}` });
    } else if (conf) {
      jPts -= j.weight * 0.5;
      lines.push({ label: `Should not be in the brief: ${j.text}`, points: -j.weight * 0.5, max: 0, note: j.why });
    }
  }
  jPts = Math.max(0, jPts);

  const iocs = new Set(b.iocs || []);
  const must = scn.ti.indicators.filter((i) => i.role === 'core' && i.block === 'must');
  const fine = scn.ti.indicators.filter((i) => i.block === 'fine');
  const bad = scn.ti.indicators.filter((i) => i.block === 'never');
  const hitMust = must.filter((i) => iocs.has(i.id)).length;
  const hitFine = fine.filter((i) => iocs.has(i.id)).length;
  const hitBad = bad.filter((i) => iocs.has(i.id));
  const iRatio = Math.max(0, Math.min(1, (hitMust + 0.5 * hitFine - 2 * hitBad.length) / must.length));
  const iPts = P.iocs * iRatio;
  lines.push({ label: `Block list: ${hitMust} of ${must.length} indicators that must be blocked${hitBad.length ? `, and ${hitBad.length} that would do harm` : ''}`, points: iPts, max: P.iocs, note: hitBad.map((i) => `Blocking ${i.value} would hurt: ${i.harm}`).join(' ') });

  const recs = new Set(b.recs || []);
  const goodRecs = scn.ti.recommendations.filter((r) => r.good);
  const hitGood = goodRecs.filter((r) => recs.has(r.id)).length;
  const hitBadRecs = scn.ti.recommendations.filter((r) => !r.good && recs.has(r.id));
  const rRatio = Math.max(0, Math.min(1, (hitGood - 1.5 * hitBadRecs.length) / goodRecs.length));
  const rPts = P.recs * rRatio;
  lines.push({ label: `Recommendations: ${hitGood} of ${goodRecs.length} good ones${hitBadRecs.length ? `, ${hitBadRecs.length} harmful` : ''}`, points: rPts, max: P.recs, note: hitBadRecs.map((r) => `${r.text}: ${r.why}`).join(' ') });

  const dec = scn.ti.decisions.find((d) => d.id === b.decision);
  const dPts = dec ? P.decision * dec.credit : 0;
  lines.push({ label: dec ? `Decision: ${dec.text}` : 'No decision recommended', points: dPts, max: P.decision, note: dec ? dec.why : 'The defender asked what to do.' });

  const sPts = String(b.summary || '').trim().length >= scn.ti.minSummary ? P.summary : 0;
  lines.push({ label: sPts ? 'Summary written' : 'Summary missing or too short', points: sPts, max: P.summary, note: '' });
  return { lines, points: jPts + iPts + rPts + dPts + sPts };
}
