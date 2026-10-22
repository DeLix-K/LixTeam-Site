import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

// A tiny in-memory localStorage so the settings code can be exercised without a browser.
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const S = await import(pathToFileURL(GAMES + 'core/settings.js').href);
const C = await import(pathToFileURL(GAMES + 'core/career.js').href);
const M = await import(pathToFileURL(GAMES + 'core/missions.js').href);
const MAP = await import(pathToFileURL(GAMES + 'core/map.js').href);
const CAT = await import(pathToFileURL(GAMES + 'workspace/catalog.js').href);

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

// ── settings ────────────────────────────────────────────────────
t('settings default to following the device with scanlines on', () => {
  store.clear();
  assert.deepEqual(S.load(), { motion: 'auto', scanlines: true });
});
t('settings round-trip and ignore anything unexpected', () => {
  store.clear();
  S.save({ motion: 'reduce', scanlines: false });
  assert.deepEqual(S.load(), { motion: 'reduce', scanlines: false });
  S.save({ motion: 'fast', scanlines: 'yes' });
  assert.deepEqual(S.load(), { motion: 'auto', scanlines: true }, 'unknown values fall back to the defaults');
  store.set('lixteam.rootline.settings.v1', '{not json');
  assert.deepEqual(S.load(), { motion: 'auto', scanlines: true }, 'corrupt storage does not throw');
});
t('reduced motion follows the player\'s own choice', () => {
  assert.equal(S.reducedMotion({ motion: 'reduce', scanlines: true }), true);
  assert.equal(S.reducedMotion({ motion: 'auto', scanlines: true }), false, 'no matchMedia in node means no device preference');
});
t('the last game played is remembered, and only the two real games are accepted', () => {
  store.clear();
  assert.equal(S.lastGame(), null);
  S.noteGame('nonsense');
  assert.equal(S.lastGame(), null);
  S.noteGame('workspace', 'The invoice that phoned home', 1000);
  assert.deepEqual(S.lastGame(), { game: 'workspace', detail: 'The invoice that phoned home', at: 1000 });
  S.noteGame('levelup', '', 2000);
  assert.equal(S.lastGame().game, 'levelup');
  assert.deepEqual(Object.keys(S.GAMES), ['workspace', 'levelup']);
});

// ── the mission map ─────────────────────────────────────────────
t('every live path has a map, and every mission on the path appears on it exactly once', () => {
  const s = C.blank();
  for (const p of M.PATHS) {
    const live = C.pathSummary(s, p.id).live;
    if (!live) continue;
    const map = MAP.buildMap(s, p.id);
    assert.ok(map.stages.length >= 2, p.id + ' has stages');
    const ids = map.stages.flatMap((st) => st.nodes.map((x) => x.id));
    assert.equal(new Set(ids).size, ids.length, p.id + ' lists a mission twice');
    assert.deepEqual([...ids].sort(), C.pathMissions(p.id).map((m) => m.id).sort(), p.id + ' map matches the path\'s missions');
  }
});
t('on a new player\'s map the open missions are ready, the rest locked, and nothing is done', () => {
  const s = C.blank();
  const map = MAP.buildMap(s, 'analyst');
  const nodes = map.stages.flatMap((x) => x.nodes);
  assert.equal(nodes.filter((x) => x.status === 'done').length, 0);
  assert.ok(nodes.some((x) => x.status === 'ready'));
  assert.ok(nodes.some((x) => x.status === 'locked'));
  for (const node of nodes) {
    const st = C.missionStatus(s, node.id);
    assert.equal(node.status, st.unlocked ? 'ready' : 'locked', node.id);
    if (node.status === 'locked') assert.ok(node.missing.length > 0, node.id + ' says what is missing');
  }
});
t('exams are shown last in their stage and marked as exams', () => {
  const map = MAP.buildMap(C.blank(), 'pentest');
  for (const st of map.stages) {
    const kinds = st.nodes.map((x) => x.kind);
    const firstExam = kinds.indexOf('exam');
    if (firstExam >= 0) assert.ok(kinds.slice(firstExam).every((k) => k === 'exam'), st.id);
  }
  assert.ok(map.stages.some((st) => st.nodes.some((x) => x.kind === 'exam')));
});
t('exactly one node is the recommended next step, and it is open', () => {
  const s = C.blank();
  const map = MAP.buildMap(s, 'dfir');
  const rec = map.stages.flatMap((x) => x.nodes).filter((x) => x.recommended);
  assert.equal(rec.length, 1);
  assert.notEqual(rec[0].status, 'locked');
  assert.equal(map.recommended, rec[0].id);
  assert.ok(map.reason.length > 10);
});
t('passing a mission turns its node to done, with the medal, and can unlock others', () => {
  const s = C.blank();
  const first = C.pathMissions('dfir').find((m) => !m.exam && C.missionStatus(s, m.id).unlocked);
  C.recordAttempt(s, { missionId: first.id, points: 90, tier: 3, perf: 0.95 });
  const node = MAP.buildMap(s, 'dfir').stages.flatMap((x) => x.nodes).find((x) => x.id === first.id);
  assert.equal(node.status, 'done');
  assert.equal(node.medal, 3);
  assert.equal(node.attempts, 1);
});
t('a stage reports how many of its missions are passed', () => {
  const s = C.blank();
  const map = MAP.buildMap(s, 'grc');
  for (const st of map.stages) {
    assert.equal(st.total, st.nodes.length);
    assert.equal(st.passed, 0);
  }
});
t('the briefing for a mission names its skills, its XP and where to start it', () => {
  const s = C.blank();
  const b = MAP.briefing(s, 'ot01-priorities');
  assert.equal(b.status, 'ready');
  assert.equal(b.href, '/games/simulation/?mission=ot01-priorities');
  assert.ok(b.trains.length >= 2);
  assert.ok(Math.abs(b.trains.reduce((a, x) => a + x.weight, 0) - 1) < 1e-9);
  assert.ok(b.xp.gold > b.xp.silver && b.xp.silver > b.xp.bronze);
  assert.equal(MAP.briefing(s, 'no-such-mission'), null);
});
t('the briefing for a locked mission lists what is still needed and has no free pass', () => {
  const b = MAP.briefing(C.blank(), 'ot04-night');
  assert.equal(b.status, 'locked');
  assert.ok(b.missing.length > 0);
  assert.ok(b.missing.every((x) => x.label));
});
t('XP rewards match the career rules: gold is worth more, exams pay only at silver or better', () => {
  const exam = M.missionById('ot-exam');
  assert.equal(C.xpReward(exam, 1), 0);
  assert.ok(C.xpReward(exam, 2) > 0);
  const m = M.missionById('ot01-priorities');
  assert.ok(C.xpReward(m, 3) > C.xpReward(m, 1));
});
t('what is new since the last visit: nothing on a first visit, only fresh unlocks afterwards', () => {
  const s = C.blank();
  const first = MAP.whatsNew(s, null);
  assert.deepEqual(first.fresh, []);
  assert.ok(first.ready.length > 0);
  const before = MAP.whatsNew(s, { ready: first.ready });
  assert.deepEqual(before.fresh, []);
  const m = C.pathMissions('ti').find((x) => !x.exam && C.missionStatus(s, x.id).unlocked);
  const m2 = C.pathMissions('ti').find((x) => !x.exam && x.id !== m.id && C.missionStatus(s, x.id).unlocked);
  C.recordAttempt(s, { missionId: m.id, points: 80, tier: 2, perf: 0.8 });
  C.recordAttempt(s, { missionId: m2.id, points: 80, tier: 2, perf: 0.8 });
  const after = MAP.whatsNew(s, { ready: first.ready });
  assert.ok(after.fresh.length >= 1, 'two passes open the practitioner missions');
  for (const id of after.fresh) assert.equal(C.missionStatus(s, id).unlocked, true);
});

// ── the workspace catalogue ─────────────────────────────────────
const files = ['soc-invoice', 'dfir-laptop', 'net-flat', 'cloud-bucket', 'vm-patch', 'grc-audit', 'ti-papertrail', 'se-servicedesk', 'eng-tickets', 'pt-lab', 'ot-plant'];
const scenarioIds = [];
for (const f of files) {
  const mod = await import(pathToFileURL(GAMES + `workspace/scenarios/${f}.js`).href);
  scenarioIds.push(Object.values(mod).find((x) => x && x.workspace).id);
}
t('the light workspace catalogue matches the real scenarios, so the two cannot drift', () => {
  assert.deepEqual([...scenarioIds].sort(), CAT.CATALOG.map((c) => c.id).sort());
  for (const c of CAT.CATALOG) {
    assert.ok(CAT.DIFFICULTY[c.difficulty], c.id + ' has a difficulty');
    assert.ok(c.minutes > 0);
    assert.equal(CAT.difficultyOf(c.id), CAT.DIFFICULTY[c.difficulty]);
  }
  assert.equal(CAT.difficultyOf('nope'), '');
});

console.log(n, 'passed');
