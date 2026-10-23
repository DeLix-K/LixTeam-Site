// How a game mode takes part in the career campaign.
//
// The career page links to a mode with ?mission=<id>. The mode starts that
// case straight away, and when the case ends it calls report(), which records
// the result in the career and returns what changed (XP, medal, promotion,
// newly opened missions). render() shows that summary on the results screen.

import * as career from './career.js';
import * as streak from './streak.js';
import * as weekly from './weekly.js';
import { missionById, MEDALS, TIERS } from './missions.js';
import { medalIcon, rankBadge, modeIcon, MODE_COLOUR } from './art.js';
import * as settings from './settings.js';
import * as profile from './profile.js';
import * as ach from './achievements.js';
import { skillScores, skillGains } from './map.js';
import { modeInfo } from './modes.js';
import { syncIfSignedIn } from './account-nav.js';

const CAMPAIGN_URL = '/games/levelup/';
const HOME_URL = '/games/levelup/';

// The mission this page was opened for, if it belongs to this mode. A weekly case (?weekly=wk01) is
// described the same way, so each game mode handles it without knowing the difference.
export function current(mode) {
  const params = new URLSearchParams(location.search);
  const wid = params.get('weekly');
  if (wid) {
    const e = weekly.byId(wid);
    if (e && weekly.isReleased(e) && (!mode || e.mode === mode)) {
      return { id: 'weekly:' + e.id, weekly: e, mode: e.mode, ref: e.ref, title: e.title, minutes: e.minutes, par: 0, exam: false };
    }
    return null;
  }
  const id = params.get('mission');
  const m = id ? missionById(id) : null;
  return m && (!mode || m.mode === mode) ? m : null;
}

// In mission mode the way back goes to the campaign, not the games hub.
export function applyChrome() {
  const back = document.querySelector('a.back');
  const isWeekly = new URLSearchParams(location.search).has('weekly');
  if (back) {
    back.href = isWeekly ? HOME_URL : CAMPAIGN_URL;
    back.textContent = isWeekly ? '← Level Up' : '← Mission map';
  }
  for (const id of ['res-other']) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
}

// result: { points, tier (0..3), perf (0..1, optional), summary: string[] }
// The returned result also carries what the completion screen needs to show: how the skills moved, how far the
// rank progress went and which achievements are new. All of it is worked out from the career before and after.
export function report(mission, result) {
  if (mission.weekly) return { weekly: true, mission, ...weekly.record(mission.weekly.id, result) };
  const s = career.load();
  const pid = career.pathOfMission(mission);
  const ids = Object.keys(mission.competencies || {});
  const before = { skills: skillScores(s, pid, ids), rank: career.rankOf(s, pid), ach: ach.earned(s, { streakBest: streak.status().best }) };
  const res = career.recordAttempt(s, { missionId: mission.id, ...result });
  career.save();
  if (res) {
    const after = career.rankOf(s, pid);
    const earned = ach.earned(s, { streakBest: streak.status().best });
    res.view = {
      skills: skillGains(before.skills, skillScores(s, pid, ids)),
      rankBefore: before.rank.index === after.index ? before.rank.progress : 0,
      rankAfter: after.progress,
      rankName: after.rank.name,
      nextName: after.next ? after.next.name : null,
      isTop: after.isTop,
      careerXp: s.xp,
      achievements: earned.filter((id) => !before.ach.includes(id)),
    };
    ach.markSeen(earned);
    syncIfSignedIn();
  }
  return res;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderWeekly(container, res) {
  container.replaceChildren();
  container.hidden = false;
  const box = el('div', `mission-card medal-${res.tier}`);
  const head = el('div', 'result-head');
  head.append(medalIcon(res.tier, 44));
  const headText = el('div');
  headText.append(el('p', 'mission-eyebrow', `This week's case · ${res.mission.title}`), el('h2', '', res.tier > 0 ? `Weekly case complete: ${MEDALS[res.tier]}` : 'Not passed yet'));
  head.append(headText);
  box.append(head);
  if (res.tier === 0) box.append(el('p', '', 'You need at least bronze to pass. Replay it and try a different approach.'));
  else if (res.bonus > 0) box.append(el('p', '', `+${res.bonus} bonus XP for finishing this week's case.`));
  else box.append(el('p', '', 'Bonus XP is paid once, the first time a weekly case is passed.'));
  const st = streak.status();
  if (st.current > 0) box.append(el('p', 'mission-streak', `Day streak: ${st.current}${st.current === 1 ? ' day' : ' days'}. Come back tomorrow to keep it going.`));
  const nx = weekly.next();
  if (nx) box.append(el('p', 'mission-unlock', `Next weekly case: ${nx.days === 0 ? 'today' : nx.days === 1 ? 'tomorrow' : 'in ' + nx.days + ' days'}.`));
  const a = el('a', 'btn primary big', 'Back to Level Up');
  a.href = HOME_URL;
  box.append(a);
  container.append(box);
}

// A number that counts up to its value, unless the player has asked for less motion.
function countUp(node, to, prefix = '+', suffix = ' XP') {
  if (settings.reducedMotion() || to <= 0) {
    node.textContent = `${prefix}${to}${suffix}`;
    return;
  }
  const start = performance.now();
  const dur = Math.min(1400, 400 + to * 12);
  const tick = (now) => {
    const f = Math.min(1, (now - start) / dur);
    node.textContent = `${prefix}${Math.round(to * (1 - (1 - f) ** 3))}${suffix}`;
    if (f < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// A bar that fills from one value to another.
function fillBar(from, to, cls = 'mc-bar') {
  const bar = el('div', cls);
  const i = el('i');
  i.style.width = `${Math.round(from * 100)}%`;
  bar.append(i);
  requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = `${Math.round(to * 100)}%`; }));
  return bar;
}

export function render(container, res) {
  if (res.weekly) return renderWeekly(container, res);
  container.replaceChildren();
  container.hidden = false;
  const m = res.mission;
  const v = res.view;
  const box = el('div', `mission-card mc medal-${res.tier}`);
  box.style.setProperty('--mode', MODE_COLOUR[m.mode] || '#a3e635');

  let heading;
  if (m.exam) heading = res.passed ? 'Promotion exam passed' : 'Promotion exam not passed yet';
  else heading = res.tier > 0 ? `Mission complete: ${MEDALS[res.tier]}` : 'Not passed yet';
  const head = el('div', 'result-head');
  head.append(medalIcon(res.tier, 64));
  const headText = el('div');
  headText.append(el('p', 'mission-eyebrow', `${m.exam ? 'Promotion exam' : 'Mission'} · ${m.title}`), el('h2', '', heading));
  head.append(headText);
  box.append(head);

  // The reward: XP counted up, and what it did for the rank on this path
  const rewards = el('div', 'mc-rewards');
  const xpTile = el('div', 'mc-tile mc-xp');
  xpTile.append(el('small', '', 'XP earned'));
  const xpBig = el('strong', 'xp-gain', '');
  xpTile.append(xpBig);
  if (res.xpGained > 0) countUp(xpBig, res.xpGained);
  else xpBig.textContent = '+0 XP';
  xpTile.append(el('small', 'mc-note', res.xpGained > 0 ? (v ? `${v.careerXp} career XP in total` : '') : res.tier > 0 ? (res.improved ? '' : `No new XP: XP is only earned by improving your medal (best so far: ${res.bestMedal.toLowerCase()}).`) : m.exam ? `You need silver or better to pass. Your best so far is ${res.bestMedal.toLowerCase()}.` : 'You need at least bronze to pass. Replay it and try a different approach.'));
  rewards.append(xpTile);
  if (v) {
    const rank = el('div', 'mc-tile');
    rank.append(el('small', '', 'Rank progress'), el('strong', '', v.rankName));
    rank.append(fillBar(v.rankBefore, v.isTop ? 1 : v.rankAfter), el('small', 'mc-note', v.isTop ? 'Top rank on this path' : `Next: ${v.nextName}`));
    rewards.append(rank);
  }
  box.append(rewards);

  if (res.promoted) {
    const up = el('div', 'rankup');
    const txt = el('div');
    txt.append(el('small', '', 'Rank up'), el('strong', '', `Promoted to ${res.promoted.name}!`));
    up.append(rankBadge(career.rankBadgeSpec(res.path, res.promoted), 58), txt);
    box.append(up);
  }

  // Skills this mission moved
  if (v && v.skills.length) {
    box.append(el('h3', 'mc-h', 'Skills'));
    const list = el('ul', 'mc-skills');
    for (const sk of v.skills) {
      const li = el('li');
      li.append(el('span', '', sk.name), el('span', 'mc-gain', sk.gain > 0 ? `+${sk.gain}` : `${sk.after}`), fillBar(sk.before / 100, sk.after / 100));
      list.append(li);
    }
    box.append(list);
  }

  // Achievements earned by this result
  if (v && v.achievements.length) {
    box.append(el('h3', 'mc-h', 'Achievement unlocked'));
    const row = el('div', 'mc-ach');
    for (const id of v.achievements) {
      const a = ach.byId(id);
      if (!a) continue;
      const card = el('div', 'mc-ach-card');
      card.append(el('strong', '', a.name), el('small', '', a.hint));
      row.append(card);
    }
    box.append(row);
  }

  const st = streak.status();
  if (st.current > 0) box.append(el('p', 'mission-streak', `Day streak: ${st.current}${st.current === 1 ? ' day' : ' days'}. Come back tomorrow to keep it going.`));
  if (res.featuredDone) box.append(el('p', 'mission-unlock', "This week's featured case: done."));
  if (res.newlyUnlocked.length) {
    box.append(el('h3', 'mc-h', 'Unlocked'));
    const row = el('div', 'mc-unlocks');
    for (const u of res.newlyUnlocked) {
      const a = el('a', 'chip mc-unlock', u.title);
      a.href = `/games/levelup/mission.html?id=${u.id}`;
      row.append(a);
    }
    box.append(row);
  }

  // What to do next: the career's own recommendation, when it is a different mission.
  const next = career.recommend(career.load(), { pathId: res.path });
  const row = el('div', 'btn-row');
  const a = el('a', 'btn primary big', 'Back to the mission map');
  a.href = CAMPAIGN_URL;
  row.append(a);
  if (next && next.mission.id !== m.id) {
    const n = el('a', 'btn big', `Next: ${next.mission.title}`);
    n.href = `/games/levelup/mission.html?id=${next.mission.id}`;
    row.append(n);
  }
  box.append(row);
  container.append(box);
}

// ── The mission strip along the top of a game mode ───────────────
// Shown only when the page was opened for a mission or a weekly case, so the player always knows what they are playing
// for. Everything in it is real: the mission, its stage and the player's own level.
export function mountHud(mode) {
  const m = current(mode);
  const top = document.querySelector('header.top');
  if (!m || !top || document.querySelector('.mission-hud')) return;
  const tier = m.weekly ? null : TIERS.find((t) => t.id === m.tier);
  const info = profile.levelInfo(profile.load().xp);
  const hud = el('div', 'mission-hud');
  hud.setAttribute('role', 'group');
  hud.setAttribute('aria-label', 'Mission');
  hud.style.setProperty('--mode', MODE_COLOUR[mode] || '#a3e635');
  const badge = el('span', 'mh-badge');
  badge.setAttribute('aria-hidden', 'true');
  badge.append(modeIcon(mode, 22));
  const title = el('div', 'mh-title');
  title.append(el('small', '', m.weekly ? "This week's case" : `${m.exam ? 'Promotion exam' : 'Mission'} · ${tier ? tier.name : ''}`), el('strong', '', m.title));
  const chips = el('div', 'mh-chips');
  if (tier) chips.append(el('span', 'chip', `×${tier.xpMultiplier} XP`));
  chips.append(el('span', 'chip', `About ${m.minutes} min`), el('span', 'chip', modeInfo(mode).name));
  const xp = el('div', 'mh-xp');
  const bar = el('div', 'progress');
  const fill = el('div');
  fill.style.width = `${Math.round(info.progress * 100)}%`;
  bar.append(fill);
  xp.append(el('small', '', `Player level ${info.level} · ${profile.load().xp} XP`), bar);
  hud.append(badge, title, chips, xp);
  if (!m.weekly) {
    const a = el('a', 'btn small', 'Briefing');
    a.href = `/games/levelup/mission.html?id=${m.id}`;
    hud.append(a);
  }
  top.after(hud);
}
