// Cyber Escape Room rules, with no screen code so every puzzle can be tested.
//
// An escape is a short run of rooms. In each room the player can look at
// objects (some hold clues, some are red herrings), may ask for hints (which
// cost points and, in timed mode, time), and must solve one puzzle to unlock the
// next room. The score rewards solving first time, finding clues and using few
// hints; speed adds a small bonus. Fast is not the goal: a fast wrong answer
// loses more than a slow right one.

export const HINT_TIME_COST = 30; // seconds taken off the clock in timed mode
export const HINT_POINT_COST = 10;
export const WRONG_POINT_COST = 4;

export function newGame(esc, { timed = true } = {}) {
  return {
    timed,
    room: 0,
    solved: esc.rooms.map(() => false),
    attempts: esc.rooms.map(() => 0),
    hints: esc.rooms.map(() => 0),
    looked: {}, // objectId -> true
    clues: 0, // relevant objects found
    wrong: 0,
    firstTry: 0,
    done: false,
    escaped: false,
  };
}

export function currentRoom(esc, g) {
  return esc.rooms[g.room];
}

// Look at an object. Returns { ok, text, clue } (ok false if repeated).
export function lookAt(esc, g, objectId) {
  const room = currentRoom(esc, g);
  const obj = room.objects.find((o) => o.id === objectId);
  if (!obj || g.done) return { ok: false };
  const first = !g.looked[`${room.id}/${obj.id}`];
  if (first) {
    g.looked[`${room.id}/${obj.id}`] = true;
    if (obj.clue) g.clues += 1;
  }
  return { ok: true, text: obj.text, clue: !!obj.clue, first };
}

export function nextHint(esc, g) {
  const room = currentRoom(esc, g);
  if (g.done || g.hints[g.room] >= room.puzzle.hints.length) return { ok: false };
  const text = room.puzzle.hints[g.hints[g.room]];
  g.hints[g.room] += 1;
  return { ok: true, text, left: room.puzzle.hints.length - g.hints[g.room] };
}

export function hintsUsed(g) {
  return g.hints.reduce((a, b) => a + b, 0);
}

// Is this answer right? answer shapes by puzzle type:
//   choose: option id          select: [ids]         order: [ids]
//   toggle: { settingId: bool } match: { itemId: optionId }
export function isCorrect(p, answer) {
  switch (p.type) {
    case 'choose':
      return p.options.find((o) => o.id === answer)?.correct === true;
    case 'select': {
      const want = p.options.filter((o) => o.correct).map((o) => o.id).sort();
      const got = [...new Set(answer || [])].sort();
      return want.length === got.length && want.every((id, i) => id === got[i]);
    }
    case 'order':
      return Array.isArray(answer) && answer.length === p.order.length && p.order.every((id, i) => answer[i] === id);
    case 'toggle':
      return p.settings.every((s) => (answer && answer[s.id] !== undefined ? answer[s.id] : s.on) === s.secure);
    case 'match':
      return p.items.every((it) => answer && answer[it.id] === it.answer);
    default:
      return false;
  }
}

// A little feedback on a wrong answer that does not give the answer away.
export function wrongDetail(p, answer) {
  switch (p.type) {
    case 'choose': {
      const o = p.options.find((x) => x.id === answer);
      return o && o.explain ? o.explain : 'That is not the best answer.';
    }
    case 'select': {
      const want = new Set(p.options.filter((o) => o.correct).map((o) => o.id));
      const got = new Set(answer || []);
      const right = [...got].filter((id) => want.has(id)).length;
      const extra = got.size - right;
      return `${right} of your picks are right${extra ? `, ${extra} should not be selected` : ''}, and ${want.size - right} are still missing.`;
    }
    case 'order': {
      const inPlace = p.order.filter((id, i) => answer && answer[i] === id).length;
      return `${inPlace} of ${p.order.length} steps are in the right place.`;
    }
    case 'toggle': {
      const wrong = p.settings.filter((s) => (answer && answer[s.id] !== undefined ? answer[s.id] : s.on) !== s.secure).length;
      return `${wrong} setting${wrong === 1 ? ' is' : 's are'} still unsafe, or you changed one that was fine.`;
    }
    case 'match': {
      const right = p.items.filter((it) => answer && answer[it.id] === it.answer).length;
      return `${right} of ${p.items.length} are matched correctly.`;
    }
    default:
      return 'Not quite.';
  }
}

// Submit an answer for the current room. Returns { ok, correct, detail }.
export function attempt(esc, g, answer) {
  if (g.done) return { ok: false };
  const room = currentRoom(esc, g);
  g.attempts[g.room] += 1;
  if (isCorrect(room.puzzle, answer)) {
    if (g.attempts[g.room] === 1) g.firstTry += 1;
    g.solved[g.room] = true;
    const last = g.room >= esc.rooms.length - 1;
    if (last) {
      g.done = true;
      g.escaped = true;
    } else {
      g.room += 1;
    }
    return { ok: true, correct: true, explain: room.puzzle.explain, fragment: room.fragment, escaped: last };
  }
  g.wrong += 1;
  return { ok: true, correct: false, detail: wrongDetail(room.puzzle, answer), attempts: g.attempts[g.room] };
}

export function timeOut(g) {
  g.done = true;
  g.escaped = false;
}

// timeLeft and total in seconds (ignored in practice mode)
export function grade(esc, g, { timeLeft = 0, total = 0 } = {}) {
  const breakdown = [];
  const add = (label, points) => breakdown.push({ label, points: Math.round(points) });
  add('Base', 100);

  let solvedFirst = 0;
  let solvedSecond = 0;
  let solvedLater = 0;
  esc.rooms.forEach((_, i) => {
    if (!g.solved[i]) return;
    if (g.attempts[i] === 1) solvedFirst += 1;
    else if (g.attempts[i] === 2) solvedSecond += 1;
    else solvedLater += 1;
  });
  if (solvedFirst) add(`Solved first time (${solvedFirst})`, solvedFirst * 25);
  if (solvedSecond) add(`Solved on the second try (${solvedSecond})`, solvedSecond * 15);
  if (solvedLater) add(`Solved after several tries (${solvedLater})`, solvedLater * 5);

  const cluesCap = 5 * esc.rooms.length;
  const clueCount = Math.min(g.clues, cluesCap);
  if (clueCount) add(`Hidden clues found (${g.clues})`, clueCount * 3);
  if (g.wrong) add(`Wrong answers (${g.wrong})`, -g.wrong * WRONG_POINT_COST);
  const hints = hintsUsed(g);
  if (hints) add(`Hints used (${hints})`, -hints * HINT_POINT_COST);

  if (g.escaped && g.timed && total > 0) add('Time left on the clock', Math.max(0, Math.min(1, timeLeft / total)) * 30);
  else if (g.escaped && !g.timed) add('Practice mode (no time bonus)', 0);

  let points = breakdown.reduce((n, b) => n + b.points, 0);
  const solvedCount = g.solved.filter(Boolean).length;
  if (!g.escaped) points = Math.min(points, 99); // trapped: no top ratings, however tidy
  // ratings[0] is the "trapped" rating; the rest apply to a successful escape.
  const pool = g.escaped ? esc.ratings.slice(1) : [esc.ratings[0]];
  const rating = [...pool].reverse().find((r) => points >= r.min) || pool[0];
  return { points, rating, breakdown, solvedCount };
}
