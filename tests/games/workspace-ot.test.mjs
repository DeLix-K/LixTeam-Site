import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const O = await import(pathToFileURL(GAMES + 'workspace/ot.js').href);
const { OT_PLANT: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/ot-plant.js').href);

let n = 0;
const t = (name, fn) => {
  try {
    fn();
    console.log('  ok  ', name);
    n++;
  } catch (e) {
    console.log('  FAIL', name, '\n      ', e.message);
    process.exitCode = 1;
  }
};
const m = (h, mi = 0) => h * 60 + mi;
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);
const GOOD = {
  worst: 'vendor-rdp',
  legacy: 'isolate',
  windows: ['fw-sensor', 'oneway', 'block-all'],
  broke: ['cell-off', 'hmi-off', 'block-admin', 'block-all'],
  first: 'safety',
  owner: 'ops',
  summary: 'I put the vendor behind a jump host with a second factor, moved reporting and the on-call view to a copy in the DMZ, put IT admin access behind the jump host and watched the internet edge. Nothing was done live.',
};
const ATTACKS = ['e-t1', 'e-t2', 'e-t3', 'e-t4', 'e-t5'];
const run = (ids, st = E.newRun(S)) => {
  for (const id of ids) assert.equal(E.otApply(S, st, id).ok, true, id);
  return st;
};
const open = (st) => O.threatStatus(S, O.graphFinal(S, st)).filter((x) => !x.blocked).map((x) => x.id);
const broken = (st) => O.opStatus(S, O.graphFinal(S, st)).filter((x) => !x.ok).map((x) => x.id);
const end = (st) => { E.advance(st, S.horizon - st.clock, 'wait'); return st; };
const best = () => {
  const st = run(S.ot.reference);
  for (const id of ['e-scan-vendor', 'e-newdev', 'e-scan-hmi', 'e-corp-rdp']) E.pin(st, id);
  E.perform(S, st, 'notify', 'Operations manager');
  E.perform(S, st, 'notify', 'Control room shift lead');
  return end(st);
};

t('the scenario passes the engine validator, including the reference plan', () => {
  assert.deepEqual(E.problems(S), []);
});
t('at the start every route is open and every operation runs', () => {
  const st = E.newRun(S);
  assert.deepEqual(open(st), ['T1', 'T2', 'T3', 'T4', 'T5']);
  assert.deepEqual(broken(st), []);
});
t('a route is shown from the entry to the first safety-critical controller', () => {
  const g = O.graphNow(S, E.newRun(S));
  const r = O.route(S, g, S.ot.threats[0]);
  assert.equal(r[0], 'vendor');
  assert.equal(r[1], 'eng-ws');
  assert.equal(g.assets.find((a) => a.id === r[r.length - 1]).critical, true);
});
t('the jump host closes the vendor route and keeps vendor support running', () => {
  const st = run(['jump-vendor']);
  assert.equal(open(st).includes('T1'), false);
  assert.deepEqual(broken(st), []);
});
t('the cheap fixes close a route and break something the plant needs', () => {
  assert.deepEqual(broken(run(['cell-off'])), ['O7']);
  assert.deepEqual(broken(run(['hmi-off'])), ['O8']);
  assert.deepEqual(broken(run(['block-admin'])), ['O9']);
});
t('controls that depend on others cannot go in first', () => {
  const st = E.newRun(S);
  assert.equal(E.otApply(S, st, 'jump-gw').ok, false);
  assert.equal(E.otApply(S, st, 'dash').ok, false);
  assert.equal(E.otApply(S, st, 'jump-admin').ok, false);
});
t('the preview says what a control closes and what it breaks, before it is applied', () => {
  const st = E.newRun(S);
  const p = O.preview(S, st, 'cell-off');
  assert.deepEqual(p.closes.map((x) => x.id), ['T2']);
  assert.deepEqual(p.breaks.map((x) => x.id), ['O7']);
  assert.deepEqual(O.preview(S, st, 'block-all').closes.map((x) => x.id).sort(), ['T1', 'T2', 'T3', 'T4', 'T5']);
  assert.equal(O.preview(S, st, 'block-all').breaks.length, 5);
  assert.equal(O.preview(S, st, 'tap-edge').closes.length + O.preview(S, st, 'tap-edge').breaks.length, 0);
});
t('a control that needs another is previewed as if the other were already in place', () => {
  const st = E.newRun(S);
  const p = O.preview(S, st, 'jump-gw');
  assert.deepEqual(p.closes.map((x) => x.id), ['T2']);
  assert.deepEqual(p.breaks, []);
  assert.deepEqual(O.preview(S, st, 'dash').breaks, []);
});
t('either control closes the historian route, and the one-way gateway keeps the direct reports', () => {
  assert.equal(open(run(['replica'])).includes('T4'), false);
  const ow = E.newRun(S);
  E.otWait(S, ow);
  E.otApply(S, ow, 'oneway');
  assert.equal(open(ow).includes('T4'), false);
  assert.deepEqual(broken(ow), []);
});
t('an industrial firewall limits the gateway to sensor data and closes its route', () => {
  const st = E.newRun(S);
  E.otApply(S, st, 'fw-sensor', { mode: 'window' });
  assert.equal(open(st).includes('T2'), false);
  assert.deepEqual(broken(st), []);
});
t('the budget is a hard limit', () => {
  const st = E.newRun(S);
  run(['jump-vendor', 'replica', 'tap-inner', 'jump-gw', 'dash'], st);
  assert.equal(O.remaining(S, st), 2);
  const r = E.otApply(S, st, 'tap-edge');
  assert.equal(r.ok, false);
  assert.match(r.text, /£5k/);
  assert.equal(E.otApply(S, st, 'hmi-off').ok, true, 'a cheaper control still fits');
});
t('a change inside the control network is refused live, and scheduling needs the window', () => {
  const st = E.newRun(S);
  const r = E.otApply(S, st, 'oneway');
  assert.equal(r.ok, false);
  assert.match(r.text, /maintenance window/);
  const s = E.otApply(S, st, 'oneway', { mode: 'window' });
  assert.equal(s.scheduled, true);
  assert.equal(s.eff, m(12, 0) + 45);
  assert.equal(st.ot.trips.length, 0);
});
t('a scheduled change takes effect only when its window arrives', () => {
  const st = E.newRun(S);
  E.otApply(S, st, 'oneway', { mode: 'window' });
  assert.equal(O.threatClosedAt(S, st, 'T4', m(11, 0)), false);
  assert.equal(O.threatClosedAt(S, st, 'T4', m(13, 0)), true);
  assert.deepEqual(open(st).includes('T4'), false, 'the final plant has it closed');
  assert.equal(O.threatStatus(S, O.graphNow(S, st)).find((x) => x.id === 'T4').blocked, false, 'it is still open right now');
});
t('a scheduled change can be cancelled before it goes in, and its cost comes back', () => {
  const st = E.newRun(S);
  E.otApply(S, st, 'oneway', { mode: 'window' });
  assert.equal(O.remaining(S, st), 36);
  assert.equal(E.otCancel(S, st, 'oneway').ok, true);
  assert.equal(O.remaining(S, st), 45);
});
t('waiting for the window moves the clock, and then the change goes in without a trip', () => {
  const st = E.newRun(S);
  const w = E.otWait(S, st);
  assert.equal(st.clock, m(12, 0));
  assert.equal(w.minutes, 240);
  const r = E.otApply(S, st, 'oneway');
  assert.equal(r.ok, true);
  assert.equal(r.trip, false);
  assert.equal(st.ot.trips.length, 0);
});
t('there is not enough window left to start a long change late in it', () => {
  const st = E.newRun(S);
  E.otWait(S, st);
  E.advance(st, 30, 'wait');
  assert.equal(E.otApply(S, st, 'oneway').ok, false);
});
t('an emergency change outside the window works but trips a process', () => {
  const st = E.newRun(S);
  const r = E.otApply(S, st, 'block-all', { emergency: true });
  assert.equal(r.ok, true);
  assert.equal(r.trip, true);
  assert.equal(st.ot.trips.length, 1);
  assert.ok(st.disruption >= 10);
  assert.equal(has(st, 'trip-block-all'), true);
});
t('patching the unpatchable pump controller changes nothing and wastes time', () => {
  const st = E.newRun(S);
  E.otWait(S, st);
  const c = st.clock;
  const r = E.otApply(S, st, 'patch-pump');
  assert.equal(r.ok, true);
  assert.match(r.text, /no patch/i);
  assert.equal(st.clock, c + 20);
  assert.deepEqual(open(st), ['T1', 'T2', 'T3', 'T4', 'T5']);
});
t('with nothing done every attack happens', () => {
  const st = end(E.newRun(S));
  for (const id of ATTACKS) assert.equal(has(st, id), true, id);
});
t('with the reference plan none of them happen', () => {
  const st = best();
  for (const id of ATTACKS) assert.equal(has(st, id), false, id);
});
t('a window change scheduled for the evening comes too late for the afternoon attack', () => {
  const st = E.newRun(S);
  E.advance(st, m(14, 0) - st.clock, 'wait');
  E.otApply(S, st, 'fw-sensor', { mode: 'window' });
  end(st);
  assert.equal(has(st, 'e-t2'), true);
  const early = E.newRun(S);
  E.otApply(S, early, 'fw-sensor', { mode: 'window' });
  end(early);
  assert.equal(has(early, 'e-t2'), false);
});
t('an attack is only prevented by closing the route it uses', () => {
  const st = run(['cell-off', 'hmi-off']);
  end(st);
  assert.equal(has(st, 'e-t2'), false);
  assert.equal(has(st, 'e-t3'), false);
  assert.equal(has(st, 'e-t1'), true);
});
t('the best plan is gold, with a very high score', () => {
  const st = best();
  E.submit(st);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.total >= 93, `score ${g.total}`);
  assert.equal(g.tier, 3);
});
t('the cheap, breaking plan closes every route but scores clearly lower', () => {
  const cheap = run(['jump-vendor', 'cell-off', 'replica', 'hmi-off', 'block-admin', 'tap-edge', 'tap-inner']);
  for (const id of ['e-scan-vendor', 'e-newdev', 'e-scan-hmi', 'e-corp-rdp']) E.pin(cheap, id);
  E.perform(S, cheap, 'notify', 'Operations manager');
  E.perform(S, cheap, 'notify', 'Control room shift lead');
  end(cheap);
  assert.deepEqual(open(cheap), []);
  const a = E.grade(S, cheap, GOOD).total;
  const b = E.grade(S, best(), GOOD).total;
  assert.ok(a < b - 4, `${a} vs ${b}`);
});
t('blocking everything is a trap: it closes every route and breaks five operations', () => {
  const st = E.newRun(S);
  E.otApply(S, st, 'block-all', { mode: 'window' });
  end(st);
  assert.deepEqual(open(st), []);
  assert.equal(broken(st).length, 5);
  assert.ok(E.grade(S, st, GOOD).total < 60);
});
t('a tripped process caps the medal at bronze however good the rest is', () => {
  const st = best();
  E.otApply(S, st, 'block-all', { emergency: true });
  E.submit(st);
  const g = E.grade(S, st, GOOD);
  assert.equal(g.capped, true);
  assert.ok(g.tier <= 1);
});
t('doing nothing scores very little', () => {
  const st = end(E.newRun(S));
  const g = E.grade(S, st, { worst: 'hmi', legacy: 'ignore', windows: [], broke: [], first: 'speed', owner: 'nobody', summary: '' });
  assert.ok(g.total < 20, `score ${g.total}`);
  assert.equal(g.tier, 0);
});
t('monitoring is worth points on its own', () => {
  const base = S.ot.reference.filter((x) => x !== 'tap-edge');
  assert.equal(E.grade(S, end(run(S.ot.reference)), GOOD).total - E.grade(S, end(run(base)), GOOD).total, 2);
});
t('a plant-wide email does harm', () => {
  const st = best();
  const before = E.grade(S, st, GOOD).total;
  E.perform(S, st, 'notify', 'Everyone at the plant');
  assert.ok(E.grade(S, st, GOOD).total < before);
});

console.log(n, 'passed');
