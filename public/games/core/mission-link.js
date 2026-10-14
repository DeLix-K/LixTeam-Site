// How a game mode takes part in the career campaign.
//
// The career page links to a mode with ?mission=<id>. The mode starts that
// case straight away, and when the case ends it calls report(), which records
// the result in the career and returns what changed (XP, medal, promotion,
// newly opened missions). render() shows that summary on the results screen.

import * as career from './career.js';
import { missionById, MEDALS } from './missions.js';
import { medalIcon, rankBadge } from './art.js';

const CAMPAIGN_URL = '/games/career/';

// The mission this page was opened for, if it belongs to this mode.
export function current(mode) {
  const id = new URLSearchParams(location.search).get('mission');
  const m = id ? missionById(id) : null;
  return m && (!mode || m.mode === mode) ? m : null;
}

// In mission mode the way back goes to the campaign, not the games hub.
export function applyChrome() {
  const back = document.querySelector('a.back');
  if (back) {
    back.href = CAMPAIGN_URL;
    back.textContent = '← Campaign';
  }
  for (const id of ['res-other']) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }
}

// result: { points, tier (0..3), perf (0..1, optional), summary: string[] }
export function report(mission, result) {
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

export function render(container, res) {
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
  for (const l of lines.filter(Boolean)) box.append(el('p', '', l));

  if (res.promoted) {
    const up = el('div', 'rankup');
    const txt = el('div');
    txt.append(el('small', '', 'Rank up'), el('strong', '', `Promoted to ${res.promoted.name}!`));
    up.append(rankBadge(res.promoted.id, 58), txt);
    box.append(up);
  }
  if (res.newlyUnlocked.length) box.append(el('p', 'mission-unlock', `Unlocked: ${res.newlyUnlocked.map((u) => u.title).join(', ')}.`));

  const a = el('a', 'btn primary big', 'Back to the campaign');
  a.href = CAMPAIGN_URL;
  box.append(a);
  container.append(box);
}
