// How a game mode takes part in the career campaign.
//
// The career page links to a mode with ?mission=<id>. The mode starts that
// case straight away, and when the case ends it calls report(), which records
// the result in the career and returns what changed (XP, medal, promotion,
// newly opened missions). render() shows that summary on the results screen.

import * as career from './career.js';
import * as streak from './streak.js';
import * as weekly from './weekly.js';
import { missionById, MEDALS } from './missions.js';
import { medalIcon, rankBadge } from './art.js';

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
export function report(mission, result) {
  if (mission.weekly) return { weekly: true, mission, ...weekly.record(mission.weekly.id, result) };
  const s = career.load();
  const res = career.recordAttempt(s, { missionId: mission.id, ...result });
  career.save();
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

export function render(container, res) {
  if (res.weekly) return renderWeekly(container, res);
  container.replaceChildren();
  container.hidden = false;
  const m = res.mission;
  const box = el('div', `mission-card medal-${res.tier}`);

  let heading;
  if (m.exam) heading = res.passed ? 'Promotion exam passed' : 'Promotion exam not passed yet';
  else heading = res.tier > 0 ? `Mission complete: ${MEDALS[res.tier]}` : 'Not passed yet';
  const head = el('div', 'result-head');
  head.append(medalIcon(res.tier, 44));
  const headText = el('div');
  headText.append(el('p', 'mission-eyebrow', `Campaign · ${m.title}`), el('h2', '', heading));
  head.append(headText);
  box.append(head);

  const lines = [];
  if (m.exam && !res.passed) lines.push(`You need silver or better to pass. Your best so far is ${res.bestMedal.toLowerCase()}.`);
  else if (res.tier === 0) lines.push('You need at least bronze to pass. Replay it and try a different approach.');
  if (res.xpGained > 0) lines.push(`+${res.xpGained} campaign XP.`);
  else if (res.tier > 0) lines.push(res.improved ? '' : `No new XP: XP is only earned by improving your medal (best so far: ${res.bestMedal.toLowerCase()}).`);
  for (const l of lines.filter(Boolean)) box.append(el('p', l.startsWith('+') ? 'xp-gain' : '', l));

  if (res.promoted) {
    const up = el('div', 'rankup');
    const txt = el('div');
    txt.append(el('small', '', 'Rank up'), el('strong', '', `Promoted to ${res.promoted.name}!`));
    up.append(rankBadge(career.rankBadgeSpec(res.path, res.promoted), 58), txt);
    box.append(up);
  }
  const st = streak.status();
  if (st.current > 0) box.append(el('p', 'mission-streak', `Day streak: ${st.current}${st.current === 1 ? ' day' : ' days'}. Come back tomorrow to keep it going.`));
  if (res.featuredDone) box.append(el('p', 'mission-unlock', "This week's featured case: done."));
  if (res.newlyUnlocked.length) box.append(el('p', 'mission-unlock', `Unlocked: ${res.newlyUnlocked.map((u) => u.title).join(', ')}.`));

  // What to do next: the career's own recommendation, when it is a different mission.
  const next = career.recommend(career.load(), { pathId: res.path });
  const row = el('div', 'btn-row');
  const a = el('a', 'btn primary big', 'Back to the mission map');
  a.href = CAMPAIGN_URL;
  row.append(a);
  if (next && next.mission.id !== m.id) {
    const n = el('a', 'btn big', `Next: ${next.mission.title}`);
    n.href = `/games/${next.mission.mode}/?mission=${next.mission.id}`;
    row.append(n);
  }
  box.append(row);
  container.append(box);
}
