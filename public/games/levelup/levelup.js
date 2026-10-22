// Level Up in Cyber Security: the progression game's home. A path becomes a mission map; each node is a real
// mission with a real status from the career rules. The rest of this page is the original ROOTLINE hub (path
// chooser, weekly case, daily mission, practice modes and skill stats), moved here unchanged in behaviour.

import * as shell from '../core/shell.js';
import * as settings from '../core/settings.js';
import * as profile from '../core/profile.js';
import * as career from '../core/career.js';
import * as streak from '../core/streak.js';
import * as weekly from '../core/weekly.js';
import { buildMap, briefing, whatsNew } from '../core/map.js';
import { PATHS, MEDALS } from '../core/missions.js';
import { rankBadge, modeIcon, pathIcon, MODE_COLOUR } from '../core/art.js';

shell.init({ addButton: false });
settings.noteGame('levelup');

const $ = (id) => document.getElementById(id);
const BASE = '../';
const SEEN_KEY = 'lixteam.rootline.seen.v1';

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}

// The free-practice modes. The career campaign uses these same modes as missions.
const MODES = [
  { name: 'Phish or Legit', blurb: 'Judge emails, calls and everyday choices, say how sure you are, learn the red flags.', id: 'phish-or-legit' },
  { name: 'Incident Commander', blurb: 'An incident unfolds and your choices change what happens next.', id: 'incident-commander' },
  { name: 'Cyber Detective', blurb: 'Collect clues from headers, URLs and logs, then name the attack.', id: 'cyber-detective' },
  { name: 'Social Engineering Simulator', blurb: 'Talk to people who are not who they say they are.', id: 'social-engineering' },
  { name: 'Cyber Escape Room', blurb: 'Solve connected security puzzles to protect the vault.', id: 'escape-room' },
  { name: 'The Breach Room', blurb: 'Reconstruct how an organisation was compromised.', id: 'breach-room' },
  { name: 'Incident Simulation', blurb: 'Work a whole incident from the first alert to the final report.', id: 'simulation' },
];
const MODE_NAME = { workspace: 'Hands-on Workspace', 'cyber-detective': 'Cyber Detective', 'breach-room': 'The Breach Room', 'incident-commander': 'Incident Commander', simulation: 'Incident Simulation', 'phish-or-legit': 'Phish or Legit', 'social-engineering': 'Social Engineering', 'escape-room': 'Cyber Escape Room' };

const ui = { node: null, seen: null, announced: false };

function loadSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
}
function saveSeen(v) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(v));
  } catch {
    /* optional */
  }
}

function toast(text, kind = '') {
  const t = h('div', { class: `lv-toast ${kind}`, text });
  $('toasts').append(t);
  setTimeout(() => t.remove(), 7500);
}

// ── The mission map ─────────────────────────────────────────────
const STATUS_TEXT = { done: 'Passed', ready: 'Ready', locked: 'Locked' };

function renderMap() {
  const s = career.load();
  const pid = career.pathOf(s);
  const map = buildMap(s, pid);
  const box = $('stages');
  box.replaceChildren();
  let order = 0;
  for (const stage of map.stages) {
    const list = h('ol', { class: 'lv-nodes' });
    for (const n of stage.nodes) {
      const fresh = ui.seen && ui.freshIds && ui.freshIds.includes(n.id);
      const orb = h('span', { class: 'lv-orb', 'aria-hidden': 'true' });
      if (n.status === 'locked') orb.append(lockIcon());
      else orb.append(n.kind === 'exam' ? crownIcon() : modeIcon(n.mode, 22));
      const sub = n.status === 'done' ? `${MEDALS[n.medal] || 'Passed'} · ${n.minutes} min` : n.status === 'ready' ? `${n.minutes} min` : 'Locked';
      const btn = h(
        'button',
        { class: 'lv-node-btn', type: 'button', 'data-id': n.id, 'aria-pressed': ui.node === n.id ? 'true' : 'false', 'aria-label': `${n.title}. ${n.kind === 'exam' ? 'Promotion exam. ' : ''}${STATUS_TEXT[n.status]}${n.recommended ? '. Recommended next' : ''}` },
        orb,
        h('span', { class: 'lv-label', text: n.title }),
        h('span', { class: 'lv-sub', text: sub })
      );
      btn.addEventListener('click', () => {
        ui.node = n.id;
        renderMap();
        renderBrief();
        if (window.matchMedia('(max-width: 880px)').matches) $('brief').scrollIntoView({ block: 'nearest', behavior: settings.reducedMotion() ? 'auto' : 'smooth' });
      });
      const li = h('li', { class: `lv-node ${n.status}${n.kind === 'exam' ? ' boss' : ''}${n.recommended ? ' current' : ''}${ui.node === n.id ? ' sel' : ''}${fresh ? ' fresh' : ''}` }, btn);
      li.style.setProperty('--i', String(order++));
      list.append(li);
    }
    box.append(
      h(
        'section',
        { class: `lv-stage${stage.open ? '' : ' dim'}`, 'aria-label': `${stage.name} stage` },
        h('header', { class: 'lv-stage-h' }, h('h3', { text: stage.name }), h('span', { class: 'lv-mult', text: `×${stage.multiplier} XP` }), h('span', { class: 'lv-count', text: `${stage.passed}/${stage.total}` }), stage.note ? h('small', { text: stage.note }) : null),
        list
      )
    );
  }
  return map;
}

function lockIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  const g = document.createElementNS(ns, 'g');
  for (const [k, v] of Object.entries({ fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) g.setAttribute(k, v);
  const r = document.createElementNS(ns, 'rect');
  for (const [k, v] of Object.entries({ x: 5, y: 11, width: 14, height: 9, rx: 2 })) r.setAttribute(k, v);
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M8 11V8a4 4 0 0 1 8 0v3');
  g.append(r, p);
  svg.append(g);
  return svg;
}
function crownIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z');
  for (const [k, v] of Object.entries({ fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round' })) p.setAttribute(k, v);
  svg.append(p);
  return svg;
}

function renderBrief() {
  const box = $('brief');
  const s = career.load();
  const b = ui.node ? briefing(s, ui.node) : null;
  if (!b) {
    box.replaceChildren(h('p', { class: 'empty', text: 'Choose a mission on the map to read its briefing.' }));
    return;
  }
  const m = b.mission;
  const rows = [h('p', { class: 'lv-kicker', text: `${m.exam ? 'Promotion exam' : 'Mission'} · ${MODE_NAME[m.mode] || m.mode}` }), h('h3', { id: 'brief-h', text: m.title }), h('p', { class: 'lv-blurb', text: m.blurb })];
  rows.push(
    h('div', { class: 'lv-chiprow' }, h('span', { class: 'chip', text: `${b.tier} · ×${b.multiplier} XP` }), h('span', { class: 'chip', text: `About ${m.minutes} min` }), h('span', { class: `chip st-${b.status}`, text: b.status === 'done' ? `Passed · ${MEDALS[b.medal]}` : b.status === 'ready' ? (b.attempts ? `Tried ${b.attempts}×, not passed yet` : 'New') : 'Locked' }))
  );
  rows.push(h('h4', { text: 'Skills it builds' }));
  rows.push(
    h('ul', { class: 'lv-trains' }, ...b.trains.map((t) => { const bar = h('span', { class: 'lv-bar' }, h('i', {})); bar.firstChild.style.width = `${Math.round(t.weight * 100)}%`; return h('li', {}, h('span', { text: t.name }), bar); }))
  );
  rows.push(h('h4', { text: 'XP for a first medal' }), h('p', { class: 'lv-xp' }, h('span', { text: `Bronze ${b.xp.bronze}` }), h('span', { text: `Silver ${b.xp.silver}` }), h('span', { class: 'gold', text: `Gold ${b.xp.gold}` })));
  if (b.status === 'locked') {
    rows.push(h('h4', { text: 'To unlock this' }), h('ul', { class: 'lv-missing' }, ...b.missing.map((x) => h('li', {}, h('span', { text: x.label }), h('small', { text: x.detail })))));
    rows.push(h('button', { class: 'btn big', type: 'button', disabled: true }, 'Locked'));
  } else {
    rows.push(h('a', { class: 'btn primary big', href: b.href, 'data-start': m.id }, b.status === 'done' ? 'Replay for a better medal' : b.attempts ? 'Try again' : 'Start mission'));
  }
  box.replaceChildren(...rows);
}

// ── Objective and path chips ────────────────────────────────────
function renderObjective(map) {
  const s = career.load();
  const pid = career.pathOf(s);
  const sum = career.pathSummary(s, pid);
  const r = career.rankOf(s, pid);
  $('obj-badge').replaceChildren(rankBadge(career.rankBadgeSpec(pid, r.rank), 52));
  const rec = map.recommended ? map.stages.flatMap((st) => st.nodes).find((n) => n.id === map.recommended) : null;
  if (rec) {
    $('obj-h').textContent = rec.kind === 'exam' ? `Promotion exam: ${rec.title}` : rec.title;
    $('obj-line').textContent = `${map.path.name} · ${sum.started ? r.rank.name : 'Recruit'}. ${map.reason}`;
    $('obj-btn').textContent = 'Open this mission';
    $('obj-btn').onclick = (e) => {
      e.preventDefault();
      ui.node = rec.id;
      renderMap();
      renderBrief();
      $('brief').scrollIntoView({ block: 'nearest', behavior: settings.reducedMotion() ? 'auto' : 'smooth' });
    };
  } else {
    $('obj-h').textContent = r.isTop ? 'Top rank reached' : 'Everything open is at gold';
    $('obj-line').textContent = r.isTop ? `You hold ${r.rank.name} on ${map.path.name}. Try another path, or replay a mission.` : 'Check the locked missions for what opens next.';
    $('obj-btn').textContent = 'Pick another path';
    $('obj-btn').onclick = null;
    $('obj-btn').setAttribute('href', '#paths-h');
  }
}

function renderChips() {
  const s = career.load();
  const pid = career.pathOf(s);
  const box = $('path-chips');
  box.replaceChildren();
  for (const p of PATHS) {
    const sum = career.pathSummary(s, p.id);
    if (!sum.live) continue;
    const chip = h('button', { class: `lv-chip${p.id === pid ? ' on' : ''}`, type: 'button', 'aria-pressed': p.id === pid ? 'true' : 'false', 'data-path': p.id }, h('span', { class: 'lv-chip-i' }, pathIcon(p.id, 18)), h('span', { text: p.short || p.name }));
    chip.style.setProperty('--path', p.colour);
    chip.addEventListener('click', () => selectPath(p.id));
    box.append(chip);
  }
}

function selectPath(id) {
  const s = career.load();
  career.setPath(s, id);
  career.save();
  ui.node = null;
  ui.freshIds = [];
  renderAll();
  const map = buildMap(career.load(), id);
  if (map.recommended) {
    ui.node = map.recommended;
    renderMap();
    renderBrief();
  }
}

// ── The path tiles (the original hub chooser) ───────────────────
function renderPaths() {
  const s = career.load();
  const list = $('path-list');
  list.replaceChildren();
  let startedCount = 0;
  let gold = 0;
  for (const m of Object.values(s.missions)) if (m.bestTier === 3) gold += 1;
  let live = 0;
  for (const path of PATHS) {
    const sum = career.pathSummary(s, path.id);
    if (!sum.live) continue;
    live += 1;
    if (sum.started) startedCount += 1;
    const ranks = career.ranksOf(path.id);
    const tile = h(
      'a',
      { class: `path-tile${s.path === path.id ? ' active' : ''}`, href: `${BASE}career/?path=${path.id}`, 'data-path': path.id },
      h('div', { class: 'p-top' }, h('span', { class: 'p-icon' }, pathIcon(path.id, 28)), h('div', {}, h('span', { class: 'p-tag', text: sum.started ? (sum.isTop ? 'Top rank' : 'In progress') : 'New path' }), h('h3', { text: path.name }))),
      h('p', { text: path.blurb }),
      h('div', { class: 'p-foot' }, h('div', { class: 'pips', 'aria-hidden': 'true' }, ...ranks.map((_, i) => h('span', { class: `pip${sum.started && i <= sum.rankIndex ? ' on' : ''}` }))), h('div', { class: 'p-status' }, h('span', { text: sum.started ? sum.rank.name : 'Not started' }), h('span', { text: sum.started ? `${sum.passed}/${sum.total} missions` : 'Start' })))
    );
    tile.style.setProperty('--path', path.colour);
    tile.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      selectPath(path.id);
      $('map-h').scrollIntoView({ behavior: settings.reducedMotion() ? 'auto' : 'smooth' });
    });
    list.append(tile);
  }
  $('p-gold').textContent = String(gold);
  $('p-paths').replaceChildren(document.createTextNode(String(startedCount)), h('small', { text: '/' + live }));
  $('nav-profile').setAttribute('href', `${BASE}career/?path=${career.pathOf(s)}`);
}

// ── Weekly case, daily mission, practice modes, stats ───────────
function renderWeekly() {
  const cur = weekly.current();
  $('weekly').hidden = !cur;
  if (!cur) return;
  const res = weekly.resultOf(cur.id);
  $('weekly-title').textContent = cur.title;
  $('weekly-blurb').textContent = cur.blurb;
  $('weekly-mode').textContent = `${MODE_NAME[cur.mode] || cur.mode} · about ${cur.minutes} min`;
  $('weekly-status').textContent = res && res.tier > 0 ? `Done: ${MEDALS[res.tier]}` : res ? 'Not passed yet' : 'New';
  $('weekly-status').classList.toggle('done', !!(res && res.tier > 0));
  const nx = weekly.next();
  $('weekly-next').textContent = nx ? `Next case ${nx.days === 0 ? 'today' : nx.days === 1 ? 'tomorrow' : 'in ' + nx.days + ' days'}` : '';
  $('weekly-btn').href = `${BASE}${cur.mode}/?weekly=${cur.id}`;
  $('weekly-btn').textContent = res && res.tier > 0 ? 'Play again' : 'Play';
  const past = weekly.released().filter((e) => e.id !== cur.id).sort((a, b) => (a.release < b.release ? 1 : -1));
  $('weekly-archive').hidden = past.length === 0;
  $('weekly-list').replaceChildren(
    ...past.map((e) => {
      const r = weekly.resultOf(e.id);
      return h('li', {}, h('a', { href: `${BASE}${e.mode}/?weekly=${e.id}` }, h('strong', { text: e.title }), h('small', { text: ` ${MODE_NAME[e.mode] || e.mode}${r && r.tier > 0 ? ' · ' + MEDALS[r.tier] : ''}` })));
    })
  );
}

function renderRest() {
  const p = profile.load();
  const info = profile.levelInfo(p.xp);
  $('p-level').textContent = String(info.level);
  $('p-xp').textContent = `${p.xp} XP`;
  $('p-next').textContent = `${info.to - p.xp} to level ${info.level + 1}`;
  const from = ui.seen && Number.isFinite(ui.seen.progress) && ui.seen.level === info.level ? ui.seen.progress : 0;
  const bar = $('p-bar');
  bar.style.transition = 'none';
  bar.style.width = `${Math.round(from * 100)}%`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = '';
    bar.style.width = `${Math.round(info.progress * 100)}%`;
  }));
  streak.seedFrom(career.load().attempts.map((a) => a.at));
  const st = streak.status();
  $('p-streak').textContent = String(st.current);
  $('p-streak').classList.toggle('lit', st.today && st.current > 0);
  $('streak-note').textContent = st.current === 0 ? 'Finish any case to start' : st.atRisk ? 'Play today to keep it' : st.shields ? `Best ${st.best} · shield ready` : `Best ${st.best}`;
  $('streak-note').classList.toggle('warn', st.atRisk);

  const done = profile.dailyDone();
  const due = profile.dueItems().length;
  $('daily').classList.toggle('done', done);
  $('daily-text').textContent = done ? 'Done for today. Come back whenever you like for the next one.' : due > 0 ? `Five quick emails, about two minutes. ${Math.min(due, 5)} are ideas you missed before, so they stick.` : 'Five quick emails. About two minutes.';
  $('daily-btn').textContent = done ? 'Play again' : 'Start';
  $('daily-btn').classList.toggle('primary', !done);

  const modes = $('modes');
  modes.replaceChildren();
  for (const m of MODES) {
    const card = h('a', { class: 'mode', href: `${BASE}${m.id}/` }, h('span', { class: 'mode-tile' }, modeIcon(m.id, 24)), h('div', {}, h('h3', { text: m.name }), h('p', { text: m.blurb })), h('span', { class: 'tag play', text: 'Play' }));
    card.style.setProperty('--mode', MODE_COLOUR[m.id] || '#a3e635');
    modes.append(card);
  }

  const skills = $('skills');
  skills.replaceChildren();
  let anySeen = false;
  for (const sk of profile.SKILLS) {
    const rec = p.skills[sk.id] || { seen: 0, correct: 0 };
    const acc = profile.skillAccuracy(sk.id);
    if (rec.seen) anySeen = true;
    const sbar = h('div', { class: 'progress' }, h('div', {}));
    sbar.firstChild.style.width = `${acc ?? 0}%`;
    skills.append(h('div', { class: 'skill' }, h('div', { class: 'skill-top' }, h('span', { text: sk.name }), h('span', { text: acc === null ? 'Not played yet' : `${acc}% · ${rec.seen} answered` })), h('small', { text: sk.blurb }), sbar));
  }
  $('skills-sub').hidden = anySeen;
}

function renderAll() {
  renderPaths();
  renderChips();
  const map = renderMap();
  renderObjective(map);
  renderBrief();
  renderWeekly();
  renderRest();
}

// ── Unlock and level-up moments: what changed since the last visit ──
function announce() {
  const s = career.load();
  const p = profile.load();
  const info = profile.levelInfo(p.xp);
  const prev = loadSeen();
  ui.seen = prev ? { ...prev } : null;
  const news = whatsNew(s, prev);
  ui.freshIds = news.fresh;
  if (prev) {
    if (info.level > (prev.level || 1)) toast(`Level up! You reached level ${info.level}.`, 'good');
    const titles = news.fresh.map((id) => (briefing(s, id) || {}).mission).filter(Boolean);
    for (const m of titles.slice(0, 3)) toast(`Unlocked: ${m.title}`, 'unlock');
    if (titles.length > 3) toast(`${titles.length - 3} more missions unlocked`, 'unlock');
    const r = career.rankOf(s, career.pathOf(s));
    if (prev.rank !== undefined && prev.rankPath === career.pathOf(s) && r.index > prev.rank) toast(`Promoted to ${r.rank.name}`, 'good');
  }
  saveSeen({ level: info.level, progress: info.progress, ready: news.ready, rank: career.rankOf(s, career.pathOf(s)).index, rankPath: career.pathOf(s) });
}

$('reset-btn').addEventListener('click', () => {
  if (confirm('Reset your practice level, XP, streak and skill history on this device? Your career ranks are kept.')) {
    profile.reset();
    streak.reset();
    renderAll();
  }
});
document.addEventListener('rootline:reset', () => renderAll());

announce();
renderAll();
// Open the recommended mission by default so the briefing is never empty.
{
  const map = buildMap(career.load(), career.pathOf(career.load()));
  if (map.recommended) {
    ui.node = map.recommended;
    renderMap();
    renderBrief();
  }
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    announce();
    renderAll();
  }
});
