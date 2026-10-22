// The ROOTLINE landing page. It shows the two games and a dashboard built from the player's own saved progress.
// Nothing on this page is invented: with no progress it says so instead of showing zeros dressed up as achievements.

import * as shell from './core/shell.js';
import * as settings from './core/settings.js';
import * as profile from './core/profile.js';
import * as career from './core/career.js';
import * as streak from './core/streak.js';
import { MISSIONS, MEDALS, PATHS, missionById } from './core/missions.js';
import { CATALOG } from './workspace/catalog.js';

shell.init({ addButton: false });

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return n;
};

const WS_BEST_KEY = 'lixteam.workspace.best.v1';
function workspaceBest() {
  try {
    const raw = JSON.parse(localStorage.getItem(WS_BEST_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

// ── The two games: facts from the real catalogue ────────────────
function facts() {
  const s = career.load();
  const best = workspaceBest();
  const wsDone = CATALOG.filter((c) => best[c.id] && best[c.id].tier > 0).length;
  const live = PATHS.filter((p) => career.pathSummary(s, p.id).live);
  const passed = MISSIONS.filter((m) => !m.exam && career.isPassed(s, m.id)).length;
  const fill = (id, items) => $(id).replaceChildren(...items.map((t) => el('li', { text: t })));
  fill('facts-ws', [`${CATALOG.length} simulated workplaces`, 'Real tools, a moving clock', wsDone ? `${wsDone} completed` : 'Free, no sign-up']);
  fill('facts-lu', [`${live.length} career paths`, `${MISSIONS.filter((m) => !m.exam).length} missions`, passed ? `${passed} passed` : 'XP, ranks and medals']);
}

// ── The dashboard ───────────────────────────────────────────────
const when = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

function dashboard() {
  const box = $('dash');
  const p = profile.load();
  const s = career.load();
  const best = workspaceBest();
  const played = p.xp > 0 || s.attempts.length > 0 || Object.keys(best).length > 0 || !!settings.lastGame();
  if (!played) {
    box.replaceChildren(el('p', { class: 'rl-empty', text: 'No missions finished yet. Choose a game above: your level, XP, day streak and medals will appear here as you play.' }));
    return;
  }
  streak.seedFrom(s.attempts.map((a) => a.at));
  const st = streak.status();
  const info = profile.levelInfo(p.xp);
  let gold = 0;
  for (const m of Object.values(s.missions)) if (m.bestTier === 3) gold += 1;

  const tiles = [];
  const last = settings.lastGame();
  if (last) {
    const g = settings.GAMES[last.game];
    let line = last.detail;
    if (last.game === 'levelup') {
      const rec = career.recommend(s);
      line = rec ? `Next: ${rec.mission.title}` : line || 'Pick a mission';
    }
    tiles.push(
      el('a', { class: 'rl-tile rl-resume', href: g.href }, el('div', { class: 'grow' }, el('span', { class: 'hud-label', text: 'Pick up where you left off' }), el('strong', { text: g.name }), el('small', { text: line || 'Resume' })), el('span', { class: 'btn primary', text: 'Resume' }))
    );
  }
  const xpBar = el('div', { class: 'progress' }, el('div', {}));
  xpBar.firstChild.style.width = `${Math.round(info.progress * 100)}%`;
  tiles.push(el('div', { class: 'rl-tile' }, el('span', { class: 'hud-label', text: 'Player level' }), el('span', { class: 'rl-big lit', text: String(info.level) }), xpBar, el('small', { text: `${p.xp} XP · ${info.to - p.xp} to level ${info.level + 1}` })));
  tiles.push(el('div', { class: 'rl-tile' }, el('span', { class: 'hud-label', text: 'Day streak' }), el('span', { class: `rl-big${st.today && st.current > 0 ? ' lit' : ''}`, text: String(st.current) }), el('small', { text: st.current === 0 ? 'Finish any case to start' : st.atRisk ? 'Play today to keep it' : `Best ${st.best}` })));
  tiles.push(el('div', { class: 'rl-tile' }, el('span', { class: 'hud-label', text: 'Gold medals' }), el('span', { class: 'rl-big gold', text: String(gold) }), el('small', { text: 'Career missions' })));
  const pid = career.pathOf(s);
  const sum = career.pathSummary(s, pid);
  if (sum.started) tiles.push(el('div', { class: 'rl-tile' }, el('span', { class: 'hud-label', text: 'Current path' }), el('strong', { text: sum.path.name }), el('small', { text: `${sum.rank.name} · ${sum.passed}/${sum.total} missions` })));

  const recent = s.attempts.slice(-3).reverse();
  if (recent.length) {
    tiles.push(
      el('div', { class: 'rl-tile rl-recent' }, el('span', { class: 'hud-label', text: 'Recently completed' }), el('ul', {}, ...recent.map((a) => { const m = missionById(a.id); return el('li', {}, el('span', { text: m ? m.title : a.id }), el('span', { text: `${a.tier > 0 ? MEDALS[a.tier] : 'Not passed'} · ${when(a.at)}` })); })))
    );
  }
  box.replaceChildren(el('div', { class: 'rl-tiles' }, ...tiles));
}

// ── Choosing a game ─────────────────────────────────────────────
// A plain click plays a short "enter" transition and then follows the link; modified clicks and reduced motion go straight through.
const gates = $('games');
for (const gate of gates.querySelectorAll('.gate')) {
  gate.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (settings.reducedMotion()) return;
    e.preventDefault();
    gates.classList.add('leaving');
    gate.classList.add('chosen');
    const href = gate.getAttribute('href');
    setTimeout(() => {
      window.location.href = href;
    }, 280);
  });
  gate.addEventListener('pointermove', (e) => {
    if (settings.reducedMotion()) return;
    const r = gate.getBoundingClientRect();
    gate.style.setProperty('--mx', `${Math.round(((e.clientX - r.left) / r.width) * 100)}%`);
    gate.style.setProperty('--my', `${Math.round(((e.clientY - r.top) / r.height) * 100)}%`);
  });
}
// Coming back with the browser's back button restores the page from cache: undo the leaving state.
window.addEventListener('pageshow', () => {
  gates.classList.remove('leaving');
  for (const g of gates.querySelectorAll('.gate')) g.classList.remove('chosen');
  facts();
  dashboard();
});
document.addEventListener('rootline:reset', () => dashboard());

facts();
dashboard();
