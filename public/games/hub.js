import * as profile from './core/profile.js';
import * as career from './core/career.js';
import * as streak from './core/streak.js';
import * as weekly from './core/weekly.js';
import { PATHS, MEDALS } from './core/missions.js';
import { rankBadge, modeIcon, pathIcon, MODE_COLOUR } from './core/art.js';

const $ = (id) => document.getElementById(id);

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}

// The free-practice modes. The career campaign (career/) uses these same modes as missions.
const MODES = [
  { n: 1, name: 'Phish or Legit', blurb: 'Judge emails, calls and everyday choices, say how sure you are, learn the red flags.', href: 'phish-or-legit/', id: 'phish-or-legit' },
  { n: 2, name: 'Incident Commander', blurb: 'An incident unfolds and your choices change what happens next.', href: 'incident-commander/', id: 'incident-commander' },
  { n: 3, name: 'Cyber Detective', blurb: 'Collect clues from headers, URLs and logs, then name the attack.', href: 'cyber-detective/', id: 'cyber-detective' },
  { n: 4, name: 'Social Engineering Simulator', blurb: 'Talk to people who are not who they say they are.', href: 'social-engineering/', id: 'social-engineering' },
  { n: 5, name: 'Cyber Escape Room', blurb: 'Solve connected security puzzles to protect the vault.', href: 'escape-room/', id: 'escape-room' },
  { n: 6, name: 'The Breach Room', blurb: 'Reconstruct how an organisation was compromised.', href: 'breach-room/', id: 'breach-room' },
  { n: 7, name: 'Incident Simulation', blurb: 'Work a whole incident from the first alert to the final report.', href: 'simulation/', id: 'simulation' },
  { n: 8, name: 'Hands-on Workspaces', blurb: 'A SOC console, a forensics bench, a firewall and a cloud estate: live logs, real tools, a clock that keeps moving. Investigate, fix and report.', href: 'workspace/', id: 'workspace' },
];

// The home screen belongs to no single path. It lists every path, and the one you last chose
// is offered as "Continue". Everything specific to a path (ranks, skills, exams) lives on career/.
function renderPaths() {
  const s = career.load();
  const list = $('path-list');
  list.replaceChildren();
  let startedCount = 0;
  let gold = 0;
  for (const m of Object.values(s.missions)) if (m.bestTier === 3) gold += 1;
  for (const path of PATHS) {
    const sum = career.pathSummary(s, path.id);
    if (!sum.live) continue;
    if (sum.started) startedCount += 1;
    const ranks = career.ranksOf(path.id);
    const tile = h(
      'a',
      { class: `path-tile${s.path === path.id ? ' active' : ''}`, href: `career/?path=${path.id}`, 'data-path': path.id },
      h(
        'div',
        { class: 'p-top' },
        h('span', { class: 'p-icon' }, pathIcon(path.id, 28)),
        h('div', {}, h('span', { class: 'p-tag', text: sum.started ? (sum.isTop ? 'Top rank' : 'In progress') : 'New path' }), h('h3', { text: path.name }))
      ),
      h('p', { text: path.blurb }),
      h(
        'div',
        { class: 'p-foot' },
        h('div', { class: 'pips', 'aria-hidden': 'true' }, ...ranks.map((_, i) => h('span', { class: `pip${sum.started && i <= sum.rankIndex ? ' on' : ''}` }))),
        h('div', { class: 'p-status' }, h('span', { text: sum.started ? sum.rank.name : 'Not started' }), h('span', { text: sum.started ? `${sum.passed}/${sum.total} missions` : 'Start' }))
      )
    );
    tile.style.setProperty('--path', path.colour);
    tile.addEventListener('click', () => {
      const now = career.load();
      career.setPath(now, path.id);
      career.save();
    });
    list.append(tile);
  }
  $('p-gold').textContent = String(gold);
  $('p-paths').replaceChildren(document.createTextNode(String(startedCount)), h('small', { text: '/' + PATHS.filter((p) => career.pathSummary(s, p.id).live).length }));

  // Continue: only once a path has been chosen and started
  const pid = career.pathOf(s);
  const path = PATHS.find((x) => x.id === pid);
  const r = career.rankOf(s, pid);
  const go = !!s.path && career.pathSummary(s, pid).started;
  $('continue').hidden = !go;
  $('hero-btn').textContent = go ? 'Pick another path' : 'Choose your path';
  if (go) {
    $('continue').style.setProperty('--path', path.colour);
    $('continue-path').textContent = path.name;
    $('continue-line').textContent = r.isTop ? `${r.rank.name} · top rank on this path` : `${r.rank.name} · ${career.xpOf(s, pid)} XP · next: ${r.next.name}`;
    $('continue-badge').replaceChildren(rankBadge(career.rankBadgeSpec(pid, r.rank), 54));
  }
}

const MODE_NAME = { workspace: 'Hands-on Workspace', 'cyber-detective': 'Cyber Detective', 'breach-room': 'The Breach Room', 'incident-commander': 'Incident Commander', simulation: 'Incident Simulation' };

// This week's case, and the ones before it. One new case is released every Monday.
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
  $('weekly-btn').href = `${cur.mode}/?weekly=${cur.id}`;
  $('weekly-btn').textContent = res && res.tier > 0 ? 'Play again' : 'Play';
  const past = weekly.released().filter((e) => e.id !== cur.id).sort((a, b) => (a.release < b.release ? 1 : -1));
  $('weekly-archive').hidden = past.length === 0;
  $('weekly-list').replaceChildren(
    ...past.map((e) => {
      const r = weekly.resultOf(e.id);
      const a = h('a', { href: `${e.mode}/?weekly=${e.id}` }, h('strong', { text: e.title }), h('small', { text: ` ${MODE_NAME[e.mode] || e.mode}${r && r.tier > 0 ? ' · ' + MEDALS[r.tier] : ''}` }));
      return h('li', {}, a);
    })
  );
}

function render() {
  renderPaths();
  renderWeekly();
  const p = profile.load();
  const info = profile.levelInfo(p.xp);

  $('p-level').textContent = String(info.level);
  $('p-xp').textContent = `${p.xp} XP`;
  $('p-next').textContent = `${info.to - p.xp} to level ${info.level + 1}`;
  $('p-bar').style.width = `${Math.round(info.progress * 100)}%`;
  streak.seedFrom(career.load().attempts.map((a) => a.at));
  const st = streak.status();
  $('p-streak').textContent = String(st.current);
  $('p-streak').classList.toggle('lit', st.today && st.current > 0);
  $('streak-note').textContent = st.current === 0 ? 'Finish any case to start' : st.atRisk ? 'Play today to keep it' : st.shields ? `Best ${st.best} · shield ready` : `Best ${st.best}`;
  $('streak-note').classList.toggle('warn', st.atRisk);

  // Daily mission
  const done = profile.dailyDone();
  const due = profile.dueItems().length;
  $('daily').classList.toggle('done', done);
  $('daily-text').textContent = done
    ? 'Done for today. Come back whenever you like for the next one.'
    : due > 0
      ? `Five quick emails, about two minutes. ${Math.min(due, 5)} are ideas you missed before, so they stick.`
      : 'Five quick emails. About two minutes.';
  $('daily-btn').textContent = done ? 'Play again' : 'Start';
  if (done) $('daily-btn').classList.remove('primary');
  else $('daily-btn').classList.add('primary');

  // Modes
  const modes = $('modes');
  modes.replaceChildren();
  for (const m of MODES) {
    const inner = [
      h('span', { class: 'mode-tile' }, modeIcon(m.id, 24)),
      h('div', {}, h('h3', { text: m.name }), h('p', { text: m.blurb })),
      h('span', { class: m.href ? 'tag play' : 'tag', text: m.href ? 'Play' : 'Coming soon' }),
    ];
    const card = m.href ? h('a', { class: 'mode', href: m.href }, ...inner) : h('div', { class: 'mode soon' }, ...inner);
    card.style.setProperty('--mode', MODE_COLOUR[m.id] || '#a3e635');
    modes.append(card);
  }

  // Skills
  const skills = $('skills');
  skills.replaceChildren();
  let anySeen = false;
  for (const s of profile.SKILLS) {
    const rec = p.skills[s.id] || { seen: 0, correct: 0 };
    const acc = profile.skillAccuracy(s.id);
    if (rec.seen) anySeen = true;
    const bar = h('div', { class: 'progress' }, h('div', {}));
    bar.firstChild.style.width = `${acc ?? 0}%`;
    skills.append(
      h(
        'div',
        { class: 'skill' },
        h('div', { class: 'skill-top' }, h('span', { text: s.name }), h('span', { text: acc === null ? 'Not played yet' : `${acc}% · ${rec.seen} answered` })),
        h('small', { text: s.blurb }),
        bar
      )
    );
  }
  $('skills-sub').hidden = anySeen;
}

$('reset-btn').addEventListener('click', () => {
  if (confirm('Reset your practice level, XP, streak and skill history on this device? Your career ranks are kept.')) {
    profile.reset();
    streak.reset();
    render();
  }
});

render();
