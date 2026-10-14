// Inline SVG art for the games: rank badges, medals, mode icons and the skill radar.
// Everything is built with createElementNS from fixed shapes and numbers; no data is
// ever parsed as markup, and there are no images, fonts or libraries to load.

const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

// ── Ranks ───────────────────────────────────────────────────────
export const RANK_COLOUR = {
  recruit: '#94a3b8',
  junior: '#38bdf8',
  analyst: '#a3e635',
  senior: '#fbbf24',
  lead: '#c084fc',
};
const CHEVRONS = { recruit: 0, junior: 1, analyst: 2, senior: 3, lead: 0 };

function star(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// A shield with one chevron per step up the ladder; the lead gets a star.
// `locked` greys it out for ranks not reached yet.
export function rankBadge(rankId, size = 64, { locked = false, label } = {}) {
  const colour = locked ? '#525252' : RANK_COLOUR[rankId] || '#94a3b8';
  const shield = 'M32 3 L58 12 V36 C58 53 46 65 32 70 C18 65 6 53 6 36 V12 Z';
  const g = s('g');
  g.append(s('path', { d: shield, fill: '#0f0f0f', stroke: colour, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  g.append(s('path', { d: shield, fill: colour, 'fill-opacity': locked ? 0.05 : 0.16 }));
  g.append(s('path', { d: 'M32 10 L52 17 V35 C52 48 43 58 32 62 C21 58 12 48 12 35 V17 Z', fill: 'none', stroke: colour, 'stroke-opacity': 0.35, 'stroke-width': 1.5 }));
  const n = CHEVRONS[rankId] ?? 0;
  if (rankId === 'lead') {
    g.append(s('polygon', { points: star(32, 36, 15, 6.5), fill: colour, stroke: colour, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  } else if (n === 0) {
    g.append(s('circle', { cx: 32, cy: 36, r: 6, fill: 'none', stroke: colour, 'stroke-width': 3 }));
  } else {
    const gap = 10;
    const top = 36 - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const y = top + i * gap;
      g.append(s('polyline', { points: `20,${y + 4} 32,${y - 6} 44,${y + 4}`, fill: 'none', stroke: colour, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
  }
  const svg = s('svg', { viewBox: '0 0 64 73', width: size, height: Math.round((size * 73) / 64), class: `rank-badge${locked ? ' locked' : ''}`, role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true', focusable: 'false' }, g);
  return svg;
}

// ── Medals ──────────────────────────────────────────────────────
export const MEDAL_COLOUR = { 1: '#d97706', 2: '#cbd5e1', 3: '#fbbf24' };

// tier 1..3 = bronze/silver/gold. tier 0 draws an empty ring, 'lock' a padlock.
export function medalIcon(tier, size = 36, label) {
  const a = { viewBox: '0 0 36 36', width: size, height: size, class: 'medal-icon', focusable: 'false', role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true' };
  if (tier === 'lock') {
    return s('svg', a, s('rect', { x: 9, y: 16, width: 18, height: 13, rx: 3, fill: '#1e1e1e', stroke: '#737373', 'stroke-width': 2 }), s('path', { d: 'M13 16v-3.5a5 5 0 0 1 10 0V16', fill: 'none', stroke: '#737373', 'stroke-width': 2, 'stroke-linecap': 'round' }), s('circle', { cx: 18, cy: 22.5, r: 1.8, fill: '#737373' }));
  }
  if (!tier) {
    return s('svg', a, s('circle', { cx: 18, cy: 15, r: 9, fill: 'none', stroke: '#525252', 'stroke-width': 2, 'stroke-dasharray': '3 3' }), s('path', { d: 'M13 24l-2 8 7-3 7 3-2-8', fill: 'none', stroke: '#525252', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  }
  const c = MEDAL_COLOUR[tier];
  return s(
    'svg',
    a,
    s('path', { d: 'M12 21l-3 12 9-4 9 4-3-12', fill: c, 'fill-opacity': 0.35, stroke: c, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }),
    s('circle', { cx: 18, cy: 14, r: 10, fill: c, 'fill-opacity': 0.22, stroke: c, 'stroke-width': 2.5 }),
    s('text', { x: 18, y: 18.5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: c, 'font-family': 'Arial, sans-serif' }, document.createTextNode(String(tier)))
  );
}

// ── Mode icons (24 x 24, stroke only) ───────────────────────────
export const MODE_COLOUR = {
  'phish-or-legit': '#a3e635',
  'incident-commander': '#fb923c',
  'cyber-detective': '#38bdf8',
  'social-engineering': '#c084fc',
  'escape-room': '#fbbf24',
  'breach-room': '#f87171',
  simulation: '#2dd4bf',
};

const ICONS = {
  'phish-or-legit': () => [s('rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }), s('polyline', { points: '3,7 12,13 21,7' })],
  'incident-commander': () => [s('path', { d: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z' }), s('path', { d: 'M10 21a2 2 0 0 0 4 0' })],
  'cyber-detective': () => [s('circle', { cx: 10, cy: 10, r: 6 }), s('line', { x1: 15, y1: 15, x2: 21, y2: 21 })],
  'social-engineering': () => [s('path', { d: 'M4 5h16v11H9l-5 4z' }), s('line', { x1: 8, y1: 9, x2: 16, y2: 9 }), s('line', { x1: 8, y1: 12, x2: 13, y2: 12 })],
  'escape-room': () => [s('circle', { cx: 8, cy: 12, r: 4 }), s('line', { x1: 12, y1: 12, x2: 21, y2: 12 }), s('line', { x1: 18, y1: 12, x2: 18, y2: 16 }), s('line', { x1: 21, y1: 12, x2: 21, y2: 15 })],
  'breach-room': () => [s('line', { x1: 5, y1: 6, x2: 19, y2: 6 }), s('line', { x1: 5, y1: 6, x2: 12, y2: 18 }), s('line', { x1: 19, y1: 6, x2: 12, y2: 18 }), s('circle', { cx: 5, cy: 6, r: 2 }), s('circle', { cx: 19, cy: 6, r: 2 }), s('circle', { cx: 12, cy: 18, r: 2 })],
  simulation: () => [s('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }), s('polyline', { points: '7,10 10,13 7,16' }), s('line', { x1: 12, y1: 16, x2: 17, y2: 16 })],
};

export function modeIcon(modeId, size = 24) {
  const draw = ICONS[modeId];
  const g = s('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ...(draw ? draw() : []));
  return s('svg', { viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true', focusable: 'false', class: 'mode-icon' }, g);
}

// ── Skill radar ─────────────────────────────────────────────────
const SHORT = { triage: 'Triage', phishing: 'Phishing', identity: 'Identity', endpoint: 'Endpoint', correlation: 'Correlation', hunting: 'Hunting', response: 'Response', reporting: 'Reporting' };

// items: [{ id, name, score (0..100) }]
export function skillRadar(items) {
  const W = 420;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const R = 112;
  const n = items.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (r) => items.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'radar', role: 'img', 'aria-label': `Skill profile: ${items.map((x) => `${x.name} ${x.score} out of 100`).join(', ')}.` });
  for (const f of [0.25, 0.5, 0.75, 1]) svg.append(s('polygon', { points: poly(R * f), fill: 'none', stroke: '#2a2a2a', 'stroke-width': 1 }));
  items.forEach((_, i) => {
    const [x, y] = pt(i, R);
    svg.append(s('line', { x1: cx, y1: cy, x2: x.toFixed(1), y2: y.toFixed(1), stroke: '#2a2a2a', 'stroke-width': 1 }));
  });
  const shape = items.map((it, i) => pt(i, (R * Math.max(it.score, 3)) / 100).map((v) => v.toFixed(1)).join(',')).join(' ');
  svg.append(s('polygon', { points: shape, fill: '#a3e635', 'fill-opacity': 0.22, stroke: '#a3e635', 'stroke-width': 2, 'stroke-linejoin': 'round', class: 'radar-shape' }));
  items.forEach((it, i) => {
    const [x, y] = pt(i, (R * Math.max(it.score, 3)) / 100);
    svg.append(s('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.5, fill: '#a3e635' }));
    const [lx, ly] = pt(i, R + 16);
    const cos = Math.cos(ang(i));
    const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
    const label = s('text', { x: lx.toFixed(1), y: (ly + 4).toFixed(1), 'text-anchor': anchor, 'font-size': 13, 'font-weight': 700, fill: it.score > 0 ? '#e5e5e5' : '#737373', 'font-family': 'system-ui, sans-serif' });
    label.append(document.createTextNode(SHORT[it.id] || it.name));
    svg.append(label);
  });
  return svg;
}
