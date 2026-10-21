import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const Q = await import(pathToFileURL(GAMES + 'workspace/se.js').href);
const { SE_SERVICEDESK: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/se-servicedesk.js').href);

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
const C = (id) => S.se.contacts.find((c) => c.id === id);
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);

const GOOD = { attempts: ['C2', 'C4', 'C5', 'C7'], tactics: ['authority', 'urgency', 'pretext'], pattern: 'campaign', fixes: ['callback', 'no-admin-pw', 'data-hr', 'vendor-ticket', 'brief-desk'], summary: 'Four of the eight contacts were attacks: a fake CFO assistant, a fake vendor, a fake Security caller and a lookalike Facilities email. I verified each through a call back, a ticket or the sender domain and reported them.' };
const BEST = [['C1', ['callback'], 'safe'], ['C2', ['callback'], 'escalate'], ['C3', ['manager'], 'safe'], ['C4', ['callback'], 'escalate'], ['C5', ['callback'], 'escalate'], ['C6', ['callback'], 'safe'], ['C7', ['sender'], 'escalate'], ['C8', [], 'safe']];

function play(plan = BEST, report = GOOD) {
  const st = E.newRun(S);
  for (const [id, tools, action] of plan) {
    while (!Q.arrived(S, st).some((c) => c.id === id)) E.seWait(S, st);
    for (const tl of tools) E.seTool(S, st, id, tl);
    E.seAct(S, st, id, action);
  }
  E.advance(st, 90);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('eight contacts: four genuine and four attacks, all with strong checks available', () => {
  assert.equal(S.se.contacts.length, 8);
  assert.deepEqual(S.se.contacts.filter((c) => !c.genuine).map((c) => c.id), ['C2', 'C4', 'C5', 'C7']);
  for (const c of S.se.contacts.filter((x) => x.needsVerify)) assert.ok(c.strongTools.length >= 2, c.id);
  for (const c of S.se.contacts) assert.equal(c.tools.question.strength, 'weak', c.id + ' a verification question is always weak');
});
t('contacts arrive as the clock moves, and each takes a minute to arrive on the desk', () => {
  const st = E.newRun(S);
  assert.deepEqual(Q.arrived(S, st).map((c) => c.id), []);
  E.advance(st, 6);
  assert.deepEqual(Q.arrived(S, st).map((c) => c.id), ['C1']);
  E.advance(st, 60);
  assert.deepEqual(Q.arrived(S, st).map((c) => c.id), ['C1', 'C2', 'C3']);
});
t('waiting for the next contact moves the clock to their arrival', () => {
  const st = E.newRun(S);
  const r = E.seWait(S, st);
  assert.equal(st.clock, m(13, 5));
  assert.equal(r.next, true);
  E.advance(st, 12 * 60);
  const r2 = E.seWait(S, st);
  assert.equal(r2.next, false);
  assert.equal(r2.minutes, 15);
});
t('checks cost time, are not repeated, and only work on contacts who have arrived and not yet been dealt with', () => {
  const st = E.newRun(S);
  assert.equal(E.seTool(S, st, 'C1', 'directory').ok, false, 'not arrived');
  E.seWait(S, st);
  const c = st.clock;
  assert.equal(E.seTool(S, st, 'C1', 'callback').ok, true);
  assert.equal(st.clock, c + 4);
  assert.equal(E.seTool(S, st, 'C1', 'callback').again, true);
  assert.equal(st.clock, c + 4);
  assert.equal(E.seTool(S, st, 'C1', 'hypnosis').ok, false);
  E.seAct(S, st, 'C1', 'safe');
  assert.equal(E.seTool(S, st, 'C1', 'directory').ok, false, 'already dealt with');
  assert.equal(E.seAct(S, st, 'C1', 'refuse').ok, false, 'decided once');
});
t('strong checks reach the real person through a channel the contact did not provide; caller ID and questions do not', () => {
  for (const c of S.se.contacts) {
    for (const id of ['sender', 'question']) if (!(c.strongTools || []).includes(id)) assert.equal(c.tools[id].strength, 'weak', `${c.id} ${id}`);
    for (const id of ['callback']) if (c.strongTools.includes(id)) assert.match(c.tools[id].text, /ring|call/i);
  }
  assert.ok(C('C7').strongTools.includes('sender'), 'the lookalike domain is the one place the header is decisive');
});
t('verification share: a strong check earns full, a weak one a little, none nothing, and a contact that needs none is full', () => {
  const st = E.newRun(S);
  E.advance(st, 6);
  assert.equal(Q.verifyShare(C('C1'), st), 0);
  E.seTool(S, st, 'C1', 'sender');
  assert.equal(Q.verifyShare(C('C1'), st), 0.35);
  E.seTool(S, st, 'C1', 'callback');
  assert.equal(Q.verifyShare(C('C1'), st), 1);
  assert.equal(Q.verifyShare(C('C8'), st), 1);
});
t('helping an attacker sets the breach flag and the consequence arrives later in the shift', () => {
  const st = E.newRun(S);
  while (!Q.arrived(S, st).some((c) => c.id === 'C2')) E.seWait(S, st);
  const r = E.seAct(S, st, 'C2', 'help');
  assert.equal(r.breach, true);
  assert.equal(st.se.breaches, 1);
  assert.ok(!has(st, 'e-b2'));
  E.advance(st, 3 * 60);
  assert.ok(has(st, 'e-b2'));
  assert.equal(E.consequences(S, st, S.horizon).length, 1);
  const clean = E.newRun(S);
  while (!Q.arrived(S, clean).some((c) => c.id === 'C2')) E.seWait(S, clean);
  E.seAct(S, clean, 'C2', 'escalate');
  E.advance(clean, 3 * 60);
  assert.ok(!has(clean, 'e-b2'));
  assert.equal(E.consequences(S, clean, S.horizon).length, 0);
});
t('a genuine contact who waits too long gives up and the business is harmed; an attacker who waits just leaves', () => {
  const st = E.newRun(S);
  E.advance(st, m(13, 5) - m(13, 0) + 31); // C1 has patience 30
  const gone = E.seSweep(S, st);
  assert.deepEqual(gone.map((c) => c.id), ['C1']);
  assert.equal(st.disruption, 3);
  assert.equal(st.se.decisions.C1.action, 'left');
  assert.equal(E.seSweep(S, st).length, 0, 'only once');
  const st2 = E.newRun(S);
  E.advance(st2, m(13, 25) - m(13, 0) + 40);
  const g2 = E.seSweep(S, st2).map((c) => c.id);
  assert.ok(g2.includes('C2'));
  assert.ok(!st2.se.harm.some((h) => /Mel/.test(h.label)), 'no harm from an attacker giving up');
});
t('refusing a genuine contact costs the business; escalating one wastes Security\'s time', () => {
  const st = E.newRun(S);
  E.advance(st, 6);
  E.seAct(S, st, 'C1', 'refuse');
  assert.equal(st.disruption, 3);
});
t('the best handling of the whole shift earns gold with no harm', () => {
  const { g, st } = play();
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(st.disruption, 0);
  assert.equal(g.max.triage, 40);
  assert.equal(g.max.evidence, 20);
  assert.equal(g.max.response, 10);
});
t('the whole shift fits the afternoon with every check run', () => {
  const { st } = play();
  assert.ok(st.clock - 90 < S.horizon, 'clock ' + (st.clock - 90));
});
t('helping everyone is a disaster: four breaches, no checks, capped and failed', () => {
  const { g, st } = play(S.se.contacts.map((c) => [c.id, [], 'help']));
  assert.equal(st.se.breaches, 4);
  assert.ok(g.tier <= 1, 'total ' + g.total);
  assert.ok(g.total < 60, 'total ' + g.total);
});
t('refusing everyone protects the company and hurts it: three genuine colleagues are harmed', () => {
  const { g, st } = play(S.se.contacts.map((c) => [c.id, [], 'refuse']));
  assert.equal(st.se.breaches, 0);
  assert.ok(st.disruption >= 9, 'harm ' + st.disruption);
  assert.ok(g.tier < 3, 'total ' + g.total);
});
t('escalating everything is the same mistake from the other side', () => {
  const { g } = play(S.se.contacts.map((c) => [c.id, [], 'escalate']));
  assert.ok(g.tier < 3, 'total ' + g.total);
  assert.ok(g.lines.some((l) => /Cost: Priya Nair/.test(l.label)));
});
t('right decisions without any checks lose the verification points', () => {
  const careful = play().g;
  const lucky = play(BEST.map(([id, , a]) => [id, [], a])).g;
  assert.ok(lucky.parts.evidence <= 3, 'evidence ' + lucky.parts.evidence);
  assert.ok(lucky.total < careful.total - 15, `${lucky.total} vs ${careful.total}`);
});
t('weak checks do not count as verification', () => {
  const weak = play(BEST.map(([id, , a]) => [id, ['sender', 'question'], a])).g;
  const careful = play().g;
  assert.ok(weak.parts.evidence < careful.parts.evidence / 2 + 1, `${weak.parts.evidence} vs ${careful.parts.evidence}`);
});
t('trusting the caller ID display and the right answer to a question still gets you breached', () => {
  const plan = BEST.map(([id, , a]) => [id, ['sender', 'question'], C(id).genuine ? a : 'help']);
  const { g, st } = play(plan);
  assert.equal(st.se.breaches, 4);
  assert.ok(g.tier <= 1);
});
t('the decision for Lena is not the decision for Mel: the same pressure, different checks, different right answer', () => {
  assert.deepEqual(C('C6').good, ['safe']);
  assert.deepEqual(C('C2').good, ['escalate']);
  assert.ok(C('C6').genuine && !C('C2').genuine);
  const lena = play(BEST.map(([id, tl, a]) => (id === 'C6' ? [id, tl, 'refuse'] : [id, tl, a])));
  assert.ok(lena.st.disruption === 4);
  assert.ok(lena.g.total < play().g.total - 5);
});
t('a contact who never gets an answer is a miss, and the supplier who asks too much gets a pointer, not details', () => {
  const unanswered = play(BEST.filter(([id]) => id !== 'C8')).g;
  assert.ok(unanswered.lines.some((l) => /Ellis.*never arrived or never dealt with|Ellis.*left waiting/.test(l.label)));
  const gave = play(BEST.map(([id, tl, a]) => (id === 'C8' ? [id, tl, 'help'] : [id, tl, a]))).g;
  assert.ok(gave.disruption === 1);
});
t('the report: the attacks, tactics and fixes are scored; wrong answers lose their points', () => {
  const bad = play(BEST, { attempts: ['C1', 'C3'], tactics: ['reward', 'threat'], pattern: 'coincidence', fixes: ['callerid', 'faster'], summary: 'ok' }).g;
  assert.ok(bad.parts.report <= 0.5, 'report ' + bad.parts.report);
  assert.equal(play().g.parts.report, 30);
});
t('grading adds up to 100 and every debrief question has one right answer', () => {
  assert.equal(S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal, 100);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
