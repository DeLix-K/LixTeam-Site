import { SCENARIOS } from './scenarios.js';
import * as profile from '../core/profile.js';

const LIVES = 3;
const BEST_KEY = 'lixteam.phishOrLegit.best';
const DAILY = new URLSearchParams(location.search).get('mode') === 'daily';
const ROUNDS = DAILY ? 5 : 10;

const $ = (id) => document.getElementById(id);
const screens = { start: $('screen-start'), play: $('screen-play'), end: $('screen-end') };

// Build elements with textContent only. Nothing from the scenario data is ever
// parsed as HTML, so a typo in the content can never become script.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeBest(n) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* private mode: the game works without it */
  }
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A normal round mixes four to six scams so the answer is never a pattern.
function buildRound() {
  const phishCount = 4 + Math.floor(Math.random() * 3);
  const phish = shuffle(SCENARIOS.filter((s) => s.kind === 'phish')).slice(0, phishCount);
  const legit = shuffle(SCENARIOS.filter((s) => s.kind === 'legit')).slice(0, ROUNDS - phishCount);
  return shuffle([...phish, ...legit]);
}

// The daily mission starts with ideas the player missed before and are due
// again, then fills the rest with fresh emails.
function buildDaily() {
  const due = profile.dueItems().map((id) => SCENARIOS.find((s) => s.id === id)).filter(Boolean);
  const picked = due.slice(0, ROUNDS);
  const rest = shuffle(SCENARIOS.filter((s) => !picked.includes(s)));
  return shuffle([...picked, ...rest.slice(0, ROUNDS - picked.length)]);
}

let game = null;

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  window.scrollTo({ top: 0 });
}

function renderLives() {
  const wrap = $('hud-lives');
  wrap.replaceChildren();
  if (DAILY) return; // the daily mission is for learning: no lives
  for (let i = 0; i < LIVES; i++) wrap.append(h('span', { class: i < game.lives ? 'pip' : 'pip lost' }));
  wrap.setAttribute('aria-label', `${game.lives} ${game.lives === 1 ? 'life' : 'lives'} left`);
}

function renderHud() {
  $('hud-round').textContent = `${DAILY ? 'Mission' : 'Email'} ${Math.min(game.index + 1, ROUNDS)} of ${ROUNDS}`;
  $('hud-score').textContent = String(game.score);
  $('progress-bar').style.width = `${(game.index / ROUNDS) * 100}%`;
  renderLives();
}

function selectedConfidence() {
  const r = document.querySelector('input[name="conf"]:checked');
  return r ? r.value : 'fairly';
}

function renderEmail(s) {
  const mail = $('mail');
  mail.className = 'mail';
  void mail.offsetWidth; // restart the slide-in animation
  $('context').hidden = !s.context;
  $('context').textContent = s.context ? `Situation: ${s.context}` : '';

  $('mail-avatar').textContent = (s.from.name.trim()[0] || '?').toUpperCase();
  $('mail-from-name').textContent = s.from.name;
  $('mail-from-addr').textContent = `<${s.from.addr}>`;
  $('mail-subject').textContent = s.subject;

  const body = $('mail-body');
  body.replaceChildren();
  for (const para of s.body) {
    if (para === '[ QR code image ]') body.append(h('div', { class: 'qr', role: 'img', 'aria-label': 'A QR code image' }));
    else body.append(h('p', { text: para }));
  }
  if (s.link) {
    const btn = h('button', { class: 'fake-link', type: 'button', text: s.link.text });
    btn.addEventListener('click', () => {
      game.inspected = true;
      const p = $('link-preview');
      p.hidden = false;
      p.replaceChildren('This link really goes to: ', h('b', { text: s.link.href }));
    });
    body.append(h('p', {}, btn));
  }

  const attach = $('mail-attach');
  attach.replaceChildren();
  if (s.attachment) {
    attach.append(h('span', { class: 'attach' }, h('small', { text: 'Attachment' }), h('span', { text: s.attachment })));
  }

  $('link-preview').hidden = true;
  $('feedback').hidden = true;
  $('answer-area').hidden = false;
  $('ans-legit').disabled = false;
  $('ans-phish').disabled = false;
  game.shownAt = performance.now();
  game.inspected = false;
}

function startGame() {
  profile.load();
  game = {
    queue: DAILY ? buildDaily() : buildRound(),
    index: 0, score: 0, lives: LIVES, streak: 0, bestStreak: 0, correct: 0, missed: [],
    xp: 0, certainWrong: 0, certainRight: 0, answered: false,
  };
  show('play');
  renderHud();
  renderEmail(game.queue[0]);
  $('ans-legit').focus({ preventScroll: true });
}

function answer(choice) {
  if (!game || game.answered) return;
  game.answered = true;
  const s = game.queue[game.index];
  const right = choice === s.kind;
  const seconds = (performance.now() - game.shownAt) / 1000;
  const confId = selectedConfidence();
  const conf = profile.CONFIDENCE.find((c) => c.id === confId);

  let xpGain;
  if (right) {
    const streakBonus = Math.min(game.streak, 5) * 10;
    const speedBonus = Math.max(0, 50 - Math.floor(seconds * 3));
    game.score += 100 + streakBonus + speedBonus + conf.bonus;
    game.streak += 1;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.correct += 1;
    if (confId === 'certain') game.certainRight += 1;
    xpGain = 10 + conf.xp;
  } else {
    game.streak = 0;
    if (!DAILY) game.lives -= 1;
    game.missed.push(s);
    if (confId === 'certain') {
      game.certainWrong += 1;
      game.score = Math.max(0, game.score - 25); // being sure and wrong costs extra
    }
    xpGain = 2; // you still learn something from a miss
  }
  game.xp += xpGain;
  profile.recordAnswer({ id: s.id, skill: s.skill || 'email', correct: right, confidence: confId });

  $('mail').classList.add(right ? 'flash-good' : 'flash-bad');
  $('ans-legit').disabled = true;
  $('ans-phish').disabled = true;

  const fb = $('feedback');
  fb.className = `feedback ${right ? 'good' : 'bad'}`;
  $('fb-title').textContent = right ? 'Correct' : confId === 'certain' ? 'Not quite, and you were certain' : 'Not quite';
  $('fb-lead').textContent =
    s.kind === 'phish'
      ? right
        ? 'This was a phishing email. Here is what gave it away:'
        : 'This was a phishing email. Here is what you could have spotted:'
      : 'This one was genuine. Here is why it was safe:';
  const list = $('fb-list');
  list.replaceChildren();
  const points = s.kind === 'phish' ? s.flags : [s.why];
  for (const p of points) list.append(h('li', { text: p }));
  if (s.kind === 'phish' && s.link && !game.inspected) {
    list.append(h('li', { text: 'Tip: you did not check where the link went. Inspecting a link is often the quickest giveaway.' }));
  }
  const revisit = !right || confId === 'guess';
  $('fb-xp').textContent = `+${xpGain} XP${revisit ? ' · we will ask you about this one again in a day' : ''}`;
  const lastEmail = game.index + 1 >= ROUNDS || (!DAILY && game.lives <= 0);
  $('next-btn').textContent = lastEmail ? 'See my results' : 'Next email';
  fb.hidden = false;
  $('answer-area').hidden = true;
  renderHud();
  $('next-btn').focus({ preventScroll: false });
}

function next() {
  game.index += 1;
  game.answered = false;
  if (game.index >= ROUNDS || (!DAILY && game.lives <= 0)) return finish();
  renderHud();
  renderEmail(game.queue[game.index]);
  $('ans-legit').focus({ preventScroll: true });
}

const RANKS = [
  [0, 'Fresh inbox'],
  [400, 'Careful reader'],
  [800, 'Sharp-eyed analyst'],
  [1200, 'Threat hunter'],
  [1500, 'Phishing slayer'],
];

function finish() {
  const answered = game.correct + game.missed.length;
  const accuracy = answered ? Math.round((game.correct / answered) * 100) : 0;
  const finishedAll = game.index >= ROUNDS;

  // Rewards for finishing, then bank the XP.
  let bonusXp = finishedAll ? 20 : 0;
  let dailyMsg = '';
  if (DAILY && finishedAll) {
    const d = profile.completeDaily();
    if (d.first) {
      bonusXp += 50;
      dailyMsg = `Daily mission complete. ${d.streak} ${d.streak === 1 ? 'day' : 'days'} in a row.`;
    } else {
      dailyMsg = "You have already finished today's mission. Come back tomorrow for the next one.";
    }
  }
  game.xp += bonusXp;
  const lv = profile.addXp(game.xp);
  profile.noteRoundPlayed();

  const prevBest = readBest();
  const newBest = !DAILY && game.score > prevBest;
  if (newBest) writeBest(game.score);

  const rank = DAILY ? 'Daily mission' : [...RANKS].reverse().find(([min]) => game.score >= min)[1];
  $('end-rank').textContent = rank;
  $('end-score').textContent = String(game.score);
  $('end-acc').textContent = `${accuracy}%`;
  $('end-streak').textContent = String(game.bestStreak);
  $('end-xp').textContent = `+${game.xp}`;
  $('end-summary').textContent =
    (!DAILY && game.lives <= 0 ? 'Out of lives. ' : 'Round complete. ') +
    `You got ${game.correct} of ${answered} right${newBest && prevBest > 0 ? ', and set a new personal best' : ''}.`;

  const info = profile.levelInfo(lv.xp);
  const levelLine = $('end-level');
  levelLine.hidden = false;
  levelLine.textContent =
    `${lv.leveledUp ? `Level up! You are now level ${info.level}. ` : `Level ${info.level}. `}` +
    `${info.to - lv.xp} XP to level ${info.level + 1}.` +
    (dailyMsg ? ` ${dailyMsg}` : '');

  const calib = $('end-calibration');
  if (game.certainWrong > 0) {
    calib.hidden = false;
    calib.textContent = `You were certain about ${game.certainWrong} ${game.certainWrong === 1 ? 'answer' : 'answers'} that turned out wrong. Those are the risky mistakes: when you feel certain, that is the moment to double-check the sender and the link.`;
  } else if (game.certainRight > 0) {
    calib.hidden = false;
    calib.textContent = 'Your confidence matched your results: every time you said you were certain, you were right.';
  } else {
    calib.hidden = true;
  }

  const lessons = $('lessons-list');
  lessons.replaceChildren();
  for (const s of game.missed) {
    const tip = s.kind === 'phish' ? s.flags[0] : s.why;
    lessons.append(h('li', {}, h('small', { text: `${s.kind === 'phish' ? 'Missed scam' : 'Wrongly flagged'}: "${s.subject}"` }), h('span', { text: tip })));
  }
  $('end-lessons').hidden = game.missed.length === 0;
  $('copy-status').textContent = '';
  show('end');
  $('again-btn').focus({ preventScroll: true });
}

async function copyScore() {
  const text = `I scored ${game.score} on Phish or Legit (${game.correct}/${game.correct + game.missed.length} right, best streak ${game.bestStreak}). Can you beat it?`;
  try {
    await navigator.clipboard.writeText(text);
    $('copy-status').textContent = 'Copied. Paste it anywhere.';
  } catch {
    $('copy-status').textContent = text;
  }
}

function setup() {
  const best = readBest();
  if (DAILY) {
    const due = profile.dueItems().length;
    $('start-eyebrow').textContent = 'Daily mission';
    $('start-lead').textContent =
      `Five emails, about two minutes. ${due > 0 ? `${Math.min(due, 5)} of them are ideas you missed before, to help them stick.` : 'Fresh ones today.'}`;
    $('start-btn').textContent = "Start today's mission";
    $('again-btn').hidden = true;
    $('copy-btn').hidden = true;
  } else if (best > 0) {
    $('best-line').hidden = false;
    $('best-line').textContent = `Your best: ${best}`;
  }
  $('start-btn').addEventListener('click', startGame);
  $('again-btn').addEventListener('click', startGame);
  $('copy-btn').addEventListener('click', copyScore);
  $('ans-legit').addEventListener('click', () => answer('legit'));
  $('ans-phish').addEventListener('click', () => answer('phish'));
  $('next-btn').addEventListener('click', next);
  document.addEventListener('keydown', (e) => {
    if (screens.play.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' && e.target.name !== 'conf') answer('legit');
    if (e.key === 'ArrowRight' && e.target.name !== 'conf') answer('phish');
  });
}

setup();
