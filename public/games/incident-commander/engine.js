// The Incident Commander rules, with no screen code in it so they can be tested
// on their own. An incident (see incidents.js) is plain data plus small
// functions; this file turns it into a game.
//
// How a turn works: the player picks an action. It happens first, then time
// moves on by the action's cost (each unit is a few minutes), the attacker or
// the exposure keeps going (passive threat), scheduled events fire, and
// reactions check whether the situation has changed (for example the attacker
// logging back in). The game ends on a breach, when time runs out, or when
// the player declares the incident contained.

export const MAX_METER = 100;

export function newGame(incident) {
  return {
    T: 0,
    flags: { ...incident.initial.flags },
    facts: {}, // id -> text the player has learned
    threat: 0,
    disruption: 0,
    log: [], // { T, kind: 'action'|'event'|'result', text }
    used: [], // action ids, in order
    fired: [], // event ids
    done: false,
    outcome: null, // 'declared' | 'breach' | 'timeout'
  };
}

export function clock(incident, T) {
  const [hh, mm] = incident.startClock.split(':').map(Number);
  const total = hh * 60 + mm + T * incident.minutesPerUnit;
  const h = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function clamp(n) {
  return Math.max(0, Math.min(MAX_METER, n));
}

function apply(game, res) {
  if (!res) return;
  if (res.set) Object.assign(game.flags, res.set);
  if (res.threat) game.threat = clamp(game.threat + res.threat);
  if (res.disruption) game.disruption = clamp(game.disruption + res.disruption);
  if (res.reveal) for (const [id, text] of Object.entries(res.reveal)) game.facts[id] = text;
}

export function availableActions(incident, game) {
  return incident.actions.filter((a) => {
    if (game.done) return false;
    if (a.once !== false && !a.repeat && game.used.includes(a.id)) return false;
    if (a.when && !a.when(game)) return false;
    return true;
  });
}

// Returns { ok, results } or { ok: false } if the action is not allowed now.
export function perform(incident, game, actionId) {
  const action = incident.actions.find((a) => a.id === actionId);
  if (!action || game.done || !availableActions(incident, game).includes(action)) return { ok: false };

  game.log.push({ T: game.T, kind: 'action', text: action.label });
  const res = action.run(game);
  apply(game, res);
  if (res && res.text) game.log.push({ T: game.T, kind: 'result', text: res.text });
  game.used.push(action.id);

  if (action.ends) {
    game.done = true;
    game.outcome = 'declared';
    return { ok: true, ended: true };
  }

  // Time passes.
  const cost = action.cost ?? 1;
  for (let i = 0; i < cost && !game.done; i++) tick(incident, game);
  return { ok: true, ended: game.done };
}

function tick(incident, game) {
  game.T += 1;
  const passive = incident.passive ? incident.passive(game) : 0;
  if (passive) game.threat = clamp(game.threat + passive);

  for (const ev of incident.events) {
    if (game.fired.includes(ev.id) || game.T < ev.at) continue;
    if (ev.when && !ev.when(game)) {
      if (ev.expires) game.fired.push(ev.id); // opportunity gone
      continue;
    }
    game.fired.push(ev.id);
    const res = ev.run(game);
    apply(game, res);
    if (res && res.text) game.log.push({ T: game.T, kind: 'event', text: res.text, severity: res.severity || 'info' });
  }

  for (const rx of incident.reactions || []) {
    if (rx.when(game)) {
      const res = rx.run(game);
      apply(game, res);
      if (res && res.text) game.log.push({ T: game.T, kind: 'event', text: res.text, severity: res.severity || 'high' });
    }
  }

  if (game.threat >= MAX_METER) {
    game.done = true;
    game.outcome = 'breach';
  } else if (game.T >= incident.maxTime) {
    game.done = true;
    game.outcome = 'timeout';
  }
}

export function isContained(incident, game) {
  return incident.contained(game);
}

// Final score. Fast is not the goal: the score rewards a proportionate
// response (low threat AND low disruption), real evidence, and a clean
// recovery.
export function grade(incident, game) {
  const breakdown = [];
  const add = (label, points) => breakdown.push({ label, points: Math.round(points) });

  add('Base', 100);
  add(`Threat reached ${game.threat}%`, -game.threat * 0.6);
  add(`Business disruption ${game.disruption}%`, -game.disruption * 0.5);
  const facts = Object.keys(game.facts).length;
  add(`Evidence gathered (${facts})`, Math.min(facts, 6) * 4);
  for (const b of incident.bonuses(game)) add(b.label, b.points);

  let points = breakdown.reduce((n, b) => n + b.points, 0);
  const contained = incident.contained(game);
  // Real damage caps the grade, however tidy the clean-up was afterwards.
  if (game.threat >= 35) points = Math.min(points, 124); // no "Textbook" if the attacker got something
  if (game.threat >= 50) points = Math.min(points, 94); // no "Solid" if real harm was done
  if (game.outcome === 'breach') points = Math.min(points, 40);
  if (game.outcome === 'timeout' && !contained) points = Math.min(points, 54);

  let rating = [...incident.ratings].reverse().find((r) => points >= r.min) || incident.ratings[0];
  // "Breach" is for when the attacker actually won. If you contained it but
  // wrecked the business doing so, say that instead.
  if (rating.name === 'Breach' && contained && game.threat < 60) {
    rating =
      game.disruption >= 50
        ? { name: 'Overkill', blurb: 'You stopped the threat, but the cost to the business was out of proportion.' }
        : incident.ratings.find((r) => r.name === 'Costly') || rating;
  }
  const missed = incident.actions.filter((a) => a.tag === 'key' && !game.used.includes(a.id)).map((a) => a);
  return { points, rating, breakdown, missed, facts };
}
