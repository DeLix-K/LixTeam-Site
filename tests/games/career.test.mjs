import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const root = GAMES + '';
const U = (p) => pathToFileURL(root + p).href;
const C = await import(U('core/career.js'));
const M = await import(U('core/missions.js'));
let n = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok  ', name); n++; } catch (e) { console.log('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
};
const ids = (tier) => M.MISSIONS.filter((m) => m.tier === tier && !m.exam).map((m) => m.id);
const play = (s, id, tier, perf = tier === 3 ? 1 : tier === 2 ? 0.8 : tier === 1 ? 0.6 : 0.3) => C.recordAttempt(s, { missionId: id, points: Math.round(perf * 100), tier, perf, summary: ['did the thing'] });
const goldAll = (s, list) => list.forEach((id) => play(s, id, 3));
const everything = () => [...ids('beginner'), ...ids('intermediate'), ...ids('advanced'), ...ids('senior')];

// ── content integrity: every mission must point at something that exists ──
const { CASES: DET } = await import(U('cyber-detective/cases.js'));
const { CASES: BR } = await import(U('breach-room/cases.js'));
const { INCIDENTS: IC } = await import(U('incident-commander/incidents.js'));
const { SCENARIOS: SE } = await import(U('social-engineering/scenarios.js'));
const { SCENARIOS: POL } = await import(U('phish-or-legit/scenarios.js'));
const { SIMS } = await import(U('simulation/sims.js'));
const { SOC_INVOICE } = await import(U('workspace/scenarios/soc-invoice.js'));
const { DFIR_LAPTOP } = await import(U('workspace/scenarios/dfir-laptop.js'));
const { NET_FLAT } = await import(U('workspace/scenarios/net-flat.js'));
const { CLOUD_BUCKET } = await import(U('workspace/scenarios/cloud-bucket.js'));
const { VM_PATCH } = await import(U('workspace/scenarios/vm-patch.js'));
const { GRC_AUDIT } = await import(U('workspace/scenarios/grc-audit.js'));
const contentIds = { workspace: [SOC_INVOICE.id, DFIR_LAPTOP.id, NET_FLAT.id, CLOUD_BUCKET.id, VM_PATCH.id, GRC_AUDIT.id], 'cyber-detective': DET.map((x) => x.id), 'breach-room': BR.map((x) => x.id), 'incident-commander': IC.map((x) => x.id), 'social-engineering': SE.map((x) => x.id), simulation: SIMS.map((x) => x.id) };

t('content integrity: every mission points at a case that exists in its mode', () => {
  for (const m of M.MISSIONS) {
    if (m.kind === 'triage') {
      const have = new Set(POL.map((x) => x.id));
      for (const i of m.items) assert.ok(have.has(i), `${m.id}: unknown item ${i}`);
      assert.equal(new Set(m.items).size, m.items.length);
      assert.ok(m.items.length >= 8);
      continue;
    }
    assert.ok(contentIds[m.mode], `${m.id}: unknown mode ${m.mode}`);
    assert.ok(contentIds[m.mode].includes(m.ref), `${m.id}: "${m.ref}" is not a case in ${m.mode}`);
  }
});
t('content integrity: no two missions use the same case, and each mission has a par (or reports its own)', () => {
  const refs = M.MISSIONS.filter((m) => m.kind !== 'triage').map((m) => `${m.mode}/${m.ref}`);
  assert.equal(new Set(refs).size, refs.length, 'a case is used by two missions');
  for (const m of M.MISSIONS) if (m.kind !== 'simulation' && m.kind !== 'workspace') assert.ok(m.par > 0, m.id + ' needs a par'); else assert.equal(m.par, 0);
});
t('content integrity: requirements only reference real tiers, competencies, exams and ranks', () => {
  const tiers = new Set(M.TIERS.map((x) => x.id)); const comps = new Set(M.COMPETENCIES.map((x) => x.id)); const ranks = new Set(M.PATHS.flatMap((p) => p.ranks.map((x) => x.id)));
  const check = (req, where) => {
    for (const k of Object.keys(req.passedTier || {})) assert.ok(tiers.has(k), `${where}: tier ${k}`);
    for (const k of Object.keys(req.mastery || {})) assert.ok(comps.has(k), `${where}: competency ${k}`);
    for (const k of req.masteryScope || []) assert.ok(tiers.has(k), `${where}: scope ${k}`);
    if (req.rank) assert.ok(ranks.has(req.rank), `${where}: rank ${req.rank}`);
  };
  for (const r of M.RANKS) check(r.requires, 'rank ' + r.id);
  for (const m of M.MISSIONS) check(m.unlock || {}, 'mission ' + m.id);
  // every exam named by a rank is either built or listed on the roadmap
  const built = new Set(M.MISSIONS.filter((m) => m.exam).map((m) => m.id)); const planned = new Set(M.ROADMAP.map((x) => x.id));
  for (const r of M.RANKS) if (r.requires.exam) assert.ok(built.has(r.requires.exam) || planned.has(r.requires.exam), `${r.id}: exam ${r.requires.exam} is neither built nor on the roadmap`);
});
t('mission data is well formed, with the right numbers per tier', () => {
  const comps = new Set(M.COMPETENCIES.map((c) => c.id));
  const seen = new Set();
  for (const m of M.MISSIONS) {
    assert.ok(!seen.has(m.id), 'dup ' + m.id); seen.add(m.id);
    assert.ok(m.title && m.blurb && m.mode && m.kind && m.minutes > 0, m.id);
    assert.ok(M.TIERS.some((x) => x.id === m.tier));
    const w = Object.entries(m.competencies);
    assert.ok(w.length >= 1);
    for (const [c, x] of w) { assert.ok(comps.has(c), m.id + ' unknown competency ' + c); assert.ok(x > 0 && x <= 1); }
    assert.ok(Math.abs(w.reduce((a, [, x]) => a + x, 0) - 1) < 1e-9, m.id + ' weights should sum to 1');
    if (m.exam) assert.ok(m.promotes && m.passTier >= 2);
  }
  assert.deepEqual([ids('beginner').length, ids('intermediate').length, ids('advanced').length, ids('senior').length, ids('lead').length, ids('manager').length, ids('cloud').length], [4, 8, 4, 3, 4, 2, 3]);
  assert.equal(M.MISSIONS.filter((m) => m.exam).length, 22);
  assert.equal(M.RANKS.length, 6);
  assert.equal(M.COMPETENCIES.length, 30);
  for (const c of M.COMPETENCIES) assert.ok(M.MISSIONS.filter((m) => m.competencies[c.id]).length >= 2, c.id + ' needs at least two missions');
});
t('a new player is a Recruit with only the beginner missions open on the analyst path', () => {
  const s = C.blank();
  assert.equal(C.rankOf(s).rank.id, 'recruit');
  const analystOpen = C.unlockedIds(s).filter((id) => C.pathOfMission(M.missionById(id)) === 'analyst');
  assert.deepEqual(analystOpen.sort(), ids('beginner').sort());
});
t('promotion to Junior needs XP and two beginner passes', () => {
  const s = C.blank();
  play(s, 'm01-triage', 1);
  assert.equal(C.rankOf(s).rank.id, 'recruit');
  const r = play(s, 'm02-invoice', 3);
  assert.equal(C.rankOf(s).rank.id, 'junior', JSON.stringify(C.rankOf(s).checklist));
  assert.equal(r.promoted.id, 'junior');
});
t('intermediate missions unlock after two beginner passes', () => {
  const s = C.blank();
  play(s, 'm01-triage', 1);
  assert.equal(C.missionStatus(s, 'm04-spray').unlocked, false);
  assert.ok(C.missionStatus(s, 'm04-spray').missing.length > 0);
  const r = play(s, 'm02-invoice', 2);
  assert.equal(C.missionStatus(s, 'm04-spray').unlocked, true);
  assert.ok(r.newlyUnlocked.some((m) => m.id === 'm04-spray'));
});
t('failing a mission (no medal) does not count as passed or unlock anything', () => {
  const s = C.blank();
  play(s, 'm01-triage', 0); play(s, 'm02-invoice', 0);
  assert.equal(C.passedCount(s, 'beginner'), 0);
  assert.equal(C.missionStatus(s, 'm04-spray').unlocked, false);
});
t('XP cannot be farmed: replaying at the same medal earns nothing, improving earns the difference', () => {
  const s = C.blank();
  assert.equal(play(s, 'm02-invoice', 1).xpGained, 30);
  assert.equal(play(s, 'm02-invoice', 1).xpGained, 0);
  assert.equal(play(s, 'm02-invoice', 0).xpGained, 0);
  assert.equal(play(s, 'm02-invoice', 3).xpGained, 30);
  assert.equal(s.xp, 60);
  for (let i = 0; i < 20; i++) play(s, 'm02-invoice', 3);
  assert.equal(s.xp, 60, 'twenty gold replays added nothing');
});
t('a failed first try earns a one-off 5 XP, not repeatable', () => {
  const s = C.blank();
  assert.equal(play(s, 'm01-triage', 0).xpGained, 5);
  assert.equal(play(s, 'm01-triage', 0).xpGained, 0);
});
t('harder tiers are worth more XP, all the way up to Senior', () => {
  const s = C.blank();
  const x = (id) => play(s, id, 3).xpGained;
  const b = x('m02-invoice'), i = x('m04-spray'), a = x('m08-ransom'), sn = x('m16-hunt');
  assert.ok(b < i && i < a && a < sn, `${b} ${i} ${a} ${sn}`);
});
t('XP alone never promotes to SOC Analyst: every non-exam mission at gold still leaves you a Junior', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]);
  assert.ok(s.xp >= 400, 'enough XP: ' + s.xp);
  assert.equal(C.rankOf(s).rank.id, 'junior');
  assert.deepEqual(C.rankOf(s).checklist.filter((x) => !x.done).map((x) => x.key), ['exam']);
});
t('the SOC exam only unlocks with the right missions AND mastery', () => {
  const s = C.blank();
  goldAll(s, ids('beginner'));
  assert.equal(C.missionStatus(s, 'soc-exam').unlocked, false, 'needs intermediate too');
  play(s, 'm04-spray', 3); play(s, 'm06-prompt', 3);
  assert.equal(C.missionStatus(s, 'soc-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'soc-exam').missing));
});
t('grinding easy missions at bronze cannot unlock the exam (mastery gate)', () => {
  const s = C.blank();
  for (const id of ids('beginner')) play(s, id, 1, 0.55);
  play(s, 'm04-spray', 1, 0.5); play(s, 'm06-prompt', 1, 0.5);
  const st = C.missionStatus(s, 'soc-exam');
  assert.equal(st.unlocked, false);
  assert.ok(st.missing.some((x) => x.key.startsWith('mastery-')), JSON.stringify(st.missing.map((x) => x.key)));
});
t('the mastery gate for SOC Analyst only counts missions a player could have reached', () => {
  const s = C.blank();
  goldAll(s, ids('beginner'));
  // advanced and senior missions are not part of the analyst gate, however well they are played
  const inScope = C.mastery(s, 'triage', ['beginner', 'intermediate']).score;
  goldAll(s, ['m10-harbour', 'm18-weekend']);
  assert.equal(C.mastery(s, 'triage', ['beginner', 'intermediate']).score, inScope);
  assert.ok(C.mastery(s, 'triage').attempted > C.mastery(s, 'triage', ['beginner', 'intermediate']).attempted, 'the unscoped view counts the advanced and senior missions too');
  // and the checklist says so
  const label = C.rankOf(s).checklist.find((x) => x.key === 'mastery-triage').label;
  assert.match(label, /beginner and intermediate missions/);
});
t('passing the SOC exam at bronze is not enough; silver is', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), 'm04-spray', 'm06-prompt']);
  play(s, 'soc-exam', 1);
  assert.equal(C.isPassed(s, 'soc-exam'), false);
  assert.equal(C.rankOf(s).rank.id, 'junior');
  const r = play(s, 'soc-exam', 2);
  assert.equal(C.isPassed(s, 'soc-exam'), true);
  assert.equal(C.rankOf(s).rank.id, 'analyst');
  assert.equal(r.promoted.id, 'analyst');
  assert.equal(r.xpGained, 120);
});
t('senior-tier missions need the SOC Analyst rank, however much else you have done', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]);
  for (const id of ids('senior')) { const st = C.missionStatus(s, id); assert.equal(st.unlocked, false, id); assert.ok(st.missing.some((x) => x.key === 'rank')); }
  const r = play(s, 'soc-exam', 2);
  assert.ok(r.promoted && r.promoted.id === 'analyst');
  assert.ok(r.newlyUnlocked.map((m) => m.id).sort().join() === ids('senior').sort().join(), 'passing the exam opens the three senior missions: ' + r.newlyUnlocked.map((m) => m.id));
});
t('the Senior exam needs the rank, advanced and senior passes, and mastery', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]);
  play(s, 'soc-exam', 2);
  assert.equal(C.missionStatus(s, 'senior-exam').unlocked, false);
  play(s, 'm16-hunt', 3);
  assert.equal(C.missionStatus(s, 'senior-exam').unlocked, false, 'one senior mission is not enough');
  play(s, 'm17-cloudkey', 3);
  assert.equal(C.missionStatus(s, 'senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'senior-exam').missing));
});
t('the ladder reaches Senior Analyst, and the lead exam is now a real, later step', () => {
  const s = C.blank();
  goldAll(s, everything());
  assert.equal(C.rankOf(s).rank.id, 'junior');
  play(s, 'soc-exam', 3);
  assert.equal(C.rankOf(s).rank.id, 'analyst');
  assert.equal(C.rankOf(s).next.id, 'senior');
  const r = play(s, 'senior-exam', 3);
  assert.equal(C.rankOf(s).rank.id, 'senior', JSON.stringify(C.rankOf(s).checklist));
  assert.equal(r.promoted.id, 'senior');
  const top = C.rankOf(s);
  assert.equal(top.next.id, 'lead');
  const ex = top.checklist.find((x) => x.key === 'exam');
  assert.equal(ex.available, true);
  assert.doesNotMatch(ex.label, /future update/);
});
t('Senior needs the senior exam at silver: bronze does not promote', () => {
  const s = C.blank();
  goldAll(s, everything());
  play(s, 'soc-exam', 3);
  play(s, 'senior-exam', 1);
  assert.equal(C.rankOf(s).rank.id, 'analyst');
  play(s, 'senior-exam', 2);
  assert.equal(C.rankOf(s).rank.id, 'senior');
});
t('mastery: breadth counts, best result counts, a worse replay never lowers it', () => {
  const s = C.blank();
  play(s, 'm01-triage', 3, 1);
  const m1 = C.mastery(s, 'triage');
  assert.ok(m1.score > 0 && m1.score < 100, 'one mission is not mastery: ' + m1.score);
  assert.equal(m1.attempted, 1); assert.ok(m1.count >= 3);
  play(s, 'm01-triage', 0, 0.1);
  assert.equal(C.mastery(s, 'triage').score, m1.score);
  play(s, 'm10-harbour', 3, 1);
  assert.ok(C.mastery(s, 'triage').score > m1.score);
  assert.equal(C.mastery(s, 'endpoint').score, 0);
  assert.equal(C.mastery(s, 'hunting').score, 0);
});
t('recommendation targets the weakest area, and prefers the exam when it is open', () => {
  const s = C.blank();
  play(s, 'm01-triage', 3, 1); play(s, 'm02-invoice', 3, 1);
  const rec = C.recommend(s);
  assert.ok(rec && !rec.mission.exam && C.missionStatus(s, rec.mission.id).unlocked);
  assert.match(rec.reason, /weakest area/);
  goldAll(s, ids('beginner')); play(s, 'm04-spray', 3); play(s, 'm06-prompt', 3);
  assert.equal(C.recommend(s).mission.id, 'soc-exam');
});
t('recommendation is null only when everything open is gold', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]);
  play(s, 'soc-exam', 3);
  assert.ok(C.recommend(s), 'senior missions are now open and not gold');
  goldAll(s, ids('senior'));
  play(s, 'senior-exam', 3);
  assert.ok(C.recommend(s), 'lead and cloud missions are open and not gold');
  goldAll(s, [...ids('lead'), ...ids('cloud')]);
  play(s, 'lead-exam', 3);
  assert.ok(C.recommend(s), 'manager missions are open and not gold');
  goldAll(s, ids('manager'));
  play(s, 'manager-exam', 3);
  assert.equal(C.recommend(s), null);
});
t('case history keeps every attempt and compares first with latest', () => {
  const s = C.blank();
  play(s, 'm02-invoice', 1, 0.5); play(s, 'm02-invoice', 2, 0.7); play(s, 'm02-invoice', 3, 0.95);
  assert.equal(C.historyFor(s, 'm02-invoice').length, 3);
  const cmp = C.compare(s, 'm02-invoice');
  assert.equal(cmp.count, 3); assert.ok(cmp.latest.perf > cmp.first.perf);
  assert.equal(C.compare(s, 'm01-triage'), null);
});
t('portfolio and report text: only attempted cases, with the disclaimer', () => {
  const s = C.blank();
  play(s, 'm02-invoice', 3);
  const p = C.portfolio(s);
  assert.equal(p.length, 1);
  assert.equal(p[0].medal, 'Gold');
  const txt = C.reportText(s, 'm02-invoice');
  assert.match(txt, /CASE REPORT: The invoice that was not/);
  assert.match(txt, /not qualifications or validated assessments/);
  assert.match(txt, /did the thing/);
  assert.equal(C.reportText(s, 'm05-macro'), '');
});
t('export and import round-trip; junk is refused', () => {
  C.reset();
  const s = C.load();
  play(s, 'm02-invoice', 3); play(s, 'm01-triage', 2); play(s, 'm16-hunt', 2);
  C.save();
  const code = C.exportCode();
  assert.match(code, /^LQ1:/);
  C.reset();
  assert.equal(C.load().xp, 0);
  assert.equal(C.importCode(code).ok, true);
  assert.equal(C.load().missions['m02-invoice'].bestTier, 3);
  assert.equal(C.load().missions['m16-hunt'].bestTier, 2);
  assert.equal(C.importCode('hello').ok, false);
  assert.equal(C.importCode('LQ1:@@@@').ok, false);
  assert.equal(C.importCode(12345).ok, false);
});
t('a save from before the new missions existed still loads (progress is never lost to an update)', () => {
  const old = { v: 1, xp: 300, missions: { 'm02-invoice': { attempts: 2, bestTier: 3, bestPerf: 0.98, bestPoints: 250, tried: false }, 'retired-mission': { attempts: 1, bestTier: 2 } }, attempts: [{ id: 'm02-invoice', at: '2026-10-13T10:00:00Z', points: 250, tier: 3, perf: 0.98, summary: ['x'] }, { id: 'retired-mission', tier: 1 }] };
  const code = 'LQ1:' + Buffer.from(JSON.stringify(old)).toString('base64');
  assert.equal(C.importCode(code).ok, true);
  const s = C.load();
  assert.equal(s.xp, 300);
  assert.equal(s.missions['m02-invoice'].bestTier, 3);
  assert.equal(s.missions['retired-mission'], undefined, 'unknown missions are dropped, known ones are kept');
  assert.equal(s.attempts.length, 1);
  assert.equal(C.missionStatus(s, 'm16-hunt').unlocked, false);
});
t('import is sanitised: unknown missions dropped, silly numbers clamped', () => {
  const evil = { v: 1, xp: 9e12, missions: { 'm02-invoice': { attempts: -5, bestTier: 99, bestPerf: 7, bestPoints: 1e9 }, hacked: { attempts: 1, bestTier: 3 } }, attempts: [{ id: 'nope' }, { id: 'm02-invoice', tier: 50, perf: 9, points: 1e12, summary: ['x'.repeat(5000)] }] };
  const code = 'LQ1:' + Buffer.from(JSON.stringify(evil)).toString('base64');
  assert.equal(C.importCode(code).ok, true);
  const s = C.load();
  assert.ok(s.xp <= 1e6);
  assert.deepEqual(Object.keys(s.missions), ['m02-invoice']);
  assert.ok(s.missions['m02-invoice'].bestTier <= 3 && s.missions['m02-invoice'].bestPerf <= 1 && s.missions['m02-invoice'].attempts >= 0);
  assert.equal(s.attempts.length, 1);
  assert.ok(s.attempts[0].summary[0].length <= 300 && s.attempts[0].tier <= 3);
});
t('corrupt or blocked storage falls back to a fresh career', () => {
  store.set('lixteam.career.v1', '{broken');
  return import(U('core/career.js') + '?fresh=1').then((m) => { assert.equal(m.load().xp, 0); });
});

// ═══════════════ wave 3: lead tier, cloud track, featured case ═══════════════
const toSenior = () => {
  const s = C.blank();
  goldAll(s, everything());
  play(s, 'soc-exam', 3);
  play(s, 'senior-exam', 3);
  return s;
};
t('lead missions need the Senior Analyst rank, and the lead exam needs three lead passes and mastery', () => {
  const s = C.blank();
  goldAll(s, everything());
  play(s, 'soc-exam', 3);
  for (const id of ids('lead')) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked at SOC Analyst');
  const r = play(s, 'senior-exam', 3);
  assert.equal(r.promoted.id, 'senior');
  assert.deepEqual(r.newlyUnlocked.map((m) => m.id).sort(), [...ids('lead')].sort());
  assert.equal(C.missionStatus(s, 'lead-exam').unlocked, false);
  goldAll(s, ids('lead').slice(0, 2));
  assert.equal(C.missionStatus(s, 'lead-exam').unlocked, false, 'two lead passes is not enough');
  play(s, ids('lead')[2], 3);
  assert.equal(C.missionStatus(s, 'lead-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'lead-exam').missing));
});
t('the ladder reaches Incident Response Lead, and a bronze exam does not promote', () => {
  const s = toSenior();
  goldAll(s, ids('lead'));
  assert.equal(C.rankOf(s).rank.id, 'senior');
  play(s, 'lead-exam', 1);
  assert.equal(C.rankOf(s).rank.id, 'senior', 'bronze is not a pass');
  const r = play(s, 'lead-exam', 2);
  assert.equal(r.promoted.id, 'lead', JSON.stringify(C.rankOf(s).checklist));
  assert.equal(C.rankOf(s).isTop, false);
  assert.equal(C.rankOf(s).next.id, 'manager');
});
t('Lead needs the exam even when everything else is done', () => {
  const s = toSenior();
  goldAll(s, ids('lead'));
  const items = C.rankOf(s).checklist;
  assert.ok(items.filter((x) => x.key !== 'exam').every((x) => x.done), JSON.stringify(items.filter((x) => !x.done)));
  assert.equal(C.rankOf(s).rank.id, 'senior');
});
t('the rank ladder is reachable with silver medals alone (no gold needed)', () => {
  const s = C.blank();
  for (const id of everything()) play(s, id, 2);
  play(s, 'soc-exam', 2);
  assert.equal(C.rankOf(s).rank.id, 'analyst', JSON.stringify(C.rankOf(s).checklist.filter((x) => !x.done)));
  play(s, 'senior-exam', 2);
  assert.equal(C.rankOf(s).rank.id, 'senior', JSON.stringify(C.rankOf(s).checklist.filter((x) => !x.done)));
  for (const id of ids('lead')) play(s, id, 2);
  play(s, 'lead-exam', 2);
  assert.equal(C.rankOf(s).rank.id, 'lead', JSON.stringify(C.rankOf(s).checklist.filter((x) => !x.done)));
});

// ═══════════════ separate career paths ═══════════════
t('there are nine paths on the chooser, in a fixed order, and the first is the analyst ladder', () => {
  assert.deepEqual(M.PATHS.map((x) => x.id), ['analyst', 'engineer', 'cloud', 'network', 'vuln', 'pentest', 'dfir', 'grc', 'ti']);
  assert.equal(M.PATHS[0].ranks, M.RANKS);
  for (const path of M.PATHS) {
    assert.ok(path.name && path.blurb && path.colour && path.headline.length === 2 && path.lead, path.id);
    assert.equal(path.ranks[0].id, 'recruit');
    assert.deepEqual(path.ranks[0].requires, {});
    const ids2 = path.ranks.map((r) => r.id);
    assert.equal(new Set(ids2).size, ids2.length, path.id + ' rank ids are unique');
  }
});
t('every tier belongs to a known path, and every mission to exactly one path', () => {
  for (const tier of M.TIERS) assert.ok(M.PATHS.some((x) => x.id === (tier.path || 'analyst')), tier.id);
  for (const m of M.MISSIONS) assert.ok(M.PATHS.some((x) => x.id === C.pathOfMission(m)), m.id);
  const owned = M.PATHS.flatMap((x) => C.pathMissions(x.id).map((m) => m.id));
  assert.equal(new Set(owned).size, M.MISSIONS.length);
});
t('a path only uses ranks, exams and tiers that exist inside it', () => {
  for (const path of M.PATHS) {
    for (const rank of path.ranks) {
      for (const tierId of Object.keys(rank.requires.passedTier || {})) assert.equal(M.TIERS.find((x) => x.id === tierId).path || 'analyst', path.id, path.id + ': ' + rank.id + ' needs ' + tierId);
      if (rank.requires.exam) { const ex = M.missionById(rank.requires.exam); assert.ok(!ex || C.pathOfMission(ex) === path.id, path.id + ' exam on another path'); }
      for (const c of Object.keys(rank.requires.mastery || {})) assert.ok(path.competencies.includes(c), path.id + ': ' + rank.id + ' needs mastery in ' + c + ' which the path does not list');
    }
    for (const m of C.pathMissions(path.id)) for (const c of Object.keys(m.competencies)) if (path.id !== 'analyst') assert.ok(path.competencies.includes(c), path.id + ': ' + m.id + ' trains ' + c + ' which the path does not list');
  }
});
t('the path is analyst until chosen; choosing is saved; an unknown path is refused', () => {
  const s = C.blank();
  assert.equal(s.path, null);
  assert.equal(C.pathOf(s), 'analyst');
  assert.equal(C.setPath(s, 'cloud'), true);
  assert.equal(C.pathOf(s), 'cloud');
  assert.equal(C.setPath(s, 'nonsense'), false);
  assert.equal(C.pathOf(s), 'cloud');
});
t('playing a case from a link starts that path when none is chosen, and never overrides a choice', () => {
  const s = C.blank();
  play(s, 'c01-bucket', 2);
  assert.equal(s.path, 'cloud');
  const t2 = C.blank();
  C.setPath(t2, 'analyst');
  play(t2, 'c01-bucket', 2);
  assert.equal(t2.path, 'analyst');
});
t('the cloud path is open from the start; its other two missions need the first', () => {
  const s = C.blank();
  assert.equal(C.missionStatus(s, 'c01-bucket').unlocked, true);
  for (const id of ['c02-role', 'c03-console']) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  const r = play(s, 'c01-bucket', 2);
  assert.deepEqual(r.newlyUnlocked.map((m) => m.id).sort(), ['c02-role', 'c03-console']);
});
const cloudAll = () => M.MISSIONS.filter((m) => C.pathOfMission(m) === 'cloud' && !m.exam && m.tier !== 'cloud-lead').map((m) => m.id);
t('the cloud ladder: Associate after one strong pass, Engineer needs six missions, mastery and the exam; it never touches the analyst rank', () => {
  const s = C.blank();
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit');
  play(s, 'c01-bucket', 2);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit', 'XP also has to reach 100');
  play(s, 'c01-bucket', 3);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'associate', JSON.stringify(C.rankOf(s, 'cloud').checklist));
  play(s, 'c02-role', 2); play(s, 'c03-console', 2);
  for (const id of ids('cloud-prac')) play(s, id, 2);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'associate', 'the promotion exam is still outstanding');
  assert.equal(C.missionStatus(s, 'cloud-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'cloud-exam').missing));
  play(s, 'cloud-exam', 1);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'associate', 'bronze is not a pass');
  const r = play(s, 'cloud-exam', 2);
  assert.equal(r.promoted.id, 'engineer');
  assert.equal(r.path, 'cloud');
  assert.equal(C.rankOf(s, 'analyst').rank.id, 'recruit');
  assert.equal(C.rankOf(s, 'cloud').isTop, false, 'Senior is above Cloud Security Engineer');
});
t('the senior cloud tier: opens at Cloud Security Engineer, needs three passes, mastery and the exam', () => {
  const lead = () => M.MISSIONS.filter((m) => m.tier === 'cloud-lead' && !m.exam).map((m) => m.id);
  assert.equal(lead().length, 3);
  const s = C.blank();
  for (const id of [...lead(), 'cloud-senior-exam']) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Cloud Security Engineer');
  for (const id of cloudAll()) play(s, id, 3);
  play(s, 'cloud-exam', 3);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'engineer');
  for (const id of lead()) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  assert.equal(C.missionStatus(s, 'cloud-senior-exam').unlocked, false, 'the exam needs the senior missions first');
  for (const id of lead()) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'cloud-senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'cloud-senior-exam').missing));
  play(s, 'cloud-senior-exam', 1);
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'engineer', 'bronze is not a pass');
  const r = play(s, 'cloud-senior-exam', 2);
  assert.equal(r.promoted.id, 'senior', JSON.stringify(C.rankOf(s, 'cloud').checklist));
  assert.equal(C.rankOf(s, 'cloud').isTop, false, 'Architect is above Senior Cloud Security Engineer');
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'recruit', 'other paths are untouched');
});
t('the cloud practitioner missions need two foundations first, and the exam needs real mastery', () => {
  const s = C.blank();
  for (const id of ids('cloud-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  play(s, 'c01-bucket', 3); play(s, 'c02-role', 2);
  for (const id of ids('cloud-prac')) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  const t2 = C.blank();
  for (const id of cloudAll()) play(t2, id, 1, 0.3);
  assert.equal(C.missionStatus(t2, 'cloud-exam').unlocked, false);
  for (const id of cloudAll()) play(t2, id, 3);
  assert.equal(C.missionStatus(t2, 'cloud-exam').unlocked, true);
});
t('XP is counted per path: cloud XP does not count towards the analyst ladder, and the total still adds up', () => {
  const s = C.blank();
  for (const id of ids('cloud')) play(s, id, 3);
  assert.equal(C.xpOf(s, 'cloud'), 3 * Math.round(60 * 2));
  assert.equal(C.xpOf(s, 'analyst'), 0);
  assert.equal(s.xp, C.xpOf(s, 'cloud'));
  play(s, 'm01-triage', 3); play(s, 'm02-invoice', 1); play(s, 'm03-signin', 0, 0.2);
  assert.equal(s.xp, C.xpOf(s, 'cloud') + C.xpOf(s, 'analyst'), 'the running total equals the per-path totals');
});
t('mastery is per path: cloud missions do not raise analyst skills such as reporting', () => {
  const s = C.blank();
  for (const m of M.MISSIONS.filter((x) => C.pathOfMission(x) === 'cloud' && !x.exam)) play(s, m.id, 3);
  play(s, 'cloud-exam', 3);
  play(s, 'cloud-senior-exam', 3);
  play(s, 'cloud-architect-exam', 3);
  assert.equal(C.mastery(s, 'reporting', undefined, 'analyst').attempted, 0);
  assert.ok(C.mastery(s, 'reporting', undefined, 'cloud').attempted >= 1);
  assert.equal(C.mastery(s, 'cloud', undefined, 'cloud').score, 100);
});
t('each path shows its own skills: cloud on the cloud path, never on the analyst path', () => {
  const s = C.blank();
  assert.ok(!C.visibleCompetencies(s, 'analyst').some((c) => c.id === 'cloud'));
  assert.ok(C.visibleCompetencies(s, 'cloud').some((c) => c.id === 'cloud'));
  assert.ok(!C.visibleCompetencies(s, 'cloud').some((c) => c.id === 'triage'));
  assert.deepEqual(C.visibleCompetencies(s, 'analyst').map((c) => c.id), ['triage', 'phishing', 'identity', 'endpoint', 'correlation', 'hunting', 'response', 'reporting'], 'leadership still waits for the lead rank');
});
t('recommendations stay on the chosen path', () => {
  const s = C.blank();
  C.setPath(s, 'cloud');
  const rec = C.recommend(s);
  assert.equal(C.pathOfMission(rec.mission), 'cloud');
  C.setPath(s, 'analyst');
  assert.equal(C.pathOfMission(C.recommend(s).mission), 'analyst');
  assert.equal(C.recommend(s, { pathId: 'cloud' }).mission.id, 'c01-bucket');
  assert.equal(C.recommend(C.blank(), { pathId: 'not-a-path' }), null, 'a path with no missions has nothing to recommend');
});
t('the featured case only comes from the chosen path and paths already started', () => {
  const s = C.blank();
  C.setPath(s, 'cloud');
  for (let w = 0; w < 6; w++) assert.equal(C.pathOfMission(C.featured(s, new Date(Date.UTC(2026, 9, 12 + 7 * w))).mission), 'cloud');
  play(s, 'm01-triage', 2);
  const seen = new Set();
  for (let w = 0; w < 12; w++) seen.add(C.pathOfMission(C.featured(s, new Date(Date.UTC(2026, 9, 12 + 7 * w))).mission));
  assert.ok(seen.has('cloud') && seen.has('analyst'), [...seen].join());
});
t('the chooser summary: live paths report progress, paths without missions are "coming soon"', () => {
  const s = C.blank();
  play(s, 'c01-bucket', 3);
  const cloud = C.pathSummary(s, 'cloud');
  assert.equal(cloud.live, true); assert.equal(cloud.started, true); assert.equal(cloud.passed, 1); assert.equal(cloud.total, 12);
  const analyst = C.pathSummary(s, 'analyst');
  assert.equal(analyst.live, true); assert.equal(analyst.started, false);
  // every path on the chooser now has missions, so check the "coming soon" rule with a temporary empty path
  M.PATHS.push({ id: 'fake', name: 'Fake', short: 'Fake', colour: '#ffffff', blurb: 'x', headline: ['A ', 'b.'], lead: 'x', ranks: [{ id: 'recruit', name: 'Recruit', blurb: 'x', requires: {} }], competencies: [], roadmap: [] });
  const net = C.pathSummary(s, 'fake');
  M.PATHS.pop();
  assert.equal(net.live, false); assert.equal(net.started, false); assert.equal(net.rank.id, 'recruit');
});
t('a career saved before paths existed becomes an analyst career, and a bad path is dropped', () => {
  const old = { v: 1, xp: 90, missions: { 'm01-triage': { attempts: 1, bestTier: 3, bestPerf: 1, bestPoints: 100, tried: false } }, attempts: [{ id: 'm01-triage', at: '2026-10-01T00:00:00Z', points: 100, tier: 3, perf: 1, summary: [] }] };
  assert.equal(C.importCode('LC1:' + btoa(JSON.stringify(old))).ok, false, 'not a progress code');
  assert.equal(C.importCode('LQ1:' + Buffer.from(JSON.stringify(old)).toString('base64')).ok, true);
  assert.equal(C.load().path, 'analyst');
  assert.equal(C.importCode('LQ1:' + Buffer.from(JSON.stringify({ ...old, path: 'cloud' })).toString('base64')).ok, true);
  assert.equal(C.load().path, 'cloud');
  assert.equal(C.importCode('LQ1:' + Buffer.from(JSON.stringify({ ...old, path: '<script>' })).toString('base64')).ok, true);
  assert.equal(C.load().path, 'analyst', 'an invalid path falls back');
  assert.equal(C.importCode('LQ1:' + Buffer.from(JSON.stringify({ v: 1, xp: 0, missions: {}, attempts: [], path: 'vuln' })).toString('base64')).ok, true);
  assert.equal(C.load().path, 'vuln');
  C.reset();
});
t('badge specs: analyst ranks keep their artwork, other paths get a path-coloured badge that grows with rank', () => {
  const an = M.PATHS[0].ranks[2];
  assert.equal(C.rankBadgeSpec('analyst', an), an.id);
  const cl = M.PATHS.find((x) => x.id === 'cloud');
  const specs = cl.ranks.map((r) => C.rankBadgeSpec('cloud', r));
  assert.ok(specs.every((x) => x.colour === cl.colour));
  assert.deepEqual(specs.map((x) => x.level), [0, 1, 2, 3, 4]);
});
t('every cloud, lead and exam mission points at a case that exists (content integrity)', () => {
  for (const id of [...ids('lead'), ...ids('cloud'), 'lead-exam']) {
    const m = M.missionById(id);
    const pool = contentIds[m.mode];
    assert.ok(pool.includes(m.ref), id + ' -> ' + m.mode + '/' + m.ref);
  }
});

t('week numbers change on Monday and are stable through the week (UTC)', () => {
  const mon = C.weekNumber(new Date('2026-10-12T00:00:00Z'));
  assert.equal(C.weekNumber(new Date('2026-10-18T23:59:59Z')), mon);
  assert.equal(C.weekNumber(new Date('2026-10-19T00:00:00Z')), mon + 1);
  assert.equal(C.weekNumber(new Date('2026-10-11T23:59:59Z')), mon - 1);
});
t('the featured case is playable, stable all week, and rotates', () => {
  const s = C.blank();
  const a = C.featured(s, new Date('2026-10-12T09:00:00Z'));
  const b = C.featured(s, new Date('2026-10-18T20:00:00Z'));
  assert.equal(a.mission.id, b.mission.id);
  assert.equal(C.missionStatus(s, a.mission.id).unlocked, true);
  assert.equal(a.mission.exam, undefined);
  const seen = new Set();
  for (let w = 0; w < 8; w++) seen.add(C.featured(s, new Date(Date.UTC(2026, 9, 12 + 7 * w))).mission.id);
  assert.ok(seen.size >= 3, 'rotates through the open missions: ' + [...seen]);
});
t('finishing the featured case with a medal counts once, and never goes down', () => {
  const s = C.blank();
  const day = new Date('2026-10-14T10:00:00Z');
  const f = C.featured(s, day);
  const bad = C.recordAttempt(s, { missionId: f.mission.id, points: 10, tier: 0, perf: 0.1, now: day.toISOString() });
  assert.equal(bad.featuredDone, false, 'no medal, no credit');
  assert.equal(C.featuredCount(s), 0);
  const ok = C.recordAttempt(s, { missionId: f.mission.id, points: 100, tier: 2, perf: 0.8, now: day.toISOString() });
  assert.equal(ok.featuredDone, true);
  assert.equal(C.featuredCount(s), 1);
  const again = C.recordAttempt(s, { missionId: f.mission.id, points: 100, tier: 3, perf: 1, now: new Date('2026-10-16T10:00:00Z').toISOString() });
  assert.equal(again.featuredDone, false, 'the same week is only counted once');
  assert.equal(C.featuredCount(s), 1);
  assert.equal(C.featured(s, new Date('2026-10-17T10:00:00Z')).done, true);
  assert.equal(C.featured(s, new Date('2026-10-21T10:00:00Z')).done, false, 'a new week starts fresh');
  const nextWeek = new Date('2026-10-21T10:00:00Z');
  const f2 = C.featured(s, nextWeek);
  const other = ids('beginner').find((id) => id !== f2.mission.id);
  const off = C.recordAttempt(s, { missionId: other, points: 100, tier: 3, perf: 1, now: nextWeek.toISOString() });
  assert.equal(off.featuredDone, false, 'a different mission is not the featured one');
});
t('the featured count survives export and import, and bad values are cleaned up', () => {
  const s = C.blank();
  s.weekly = [2900, 2901];
  const code = C.exportCode(s);
  C.reset();
  assert.equal(C.importCode(code).ok, true);
  assert.deepEqual(C.load().weekly, [2900, 2901]);
  const dirty = { v: 1, xp: 0, missions: {}, attempts: [], weekly: [5, 5, -1, 'x', 1.5, 3e9, 7] };
  const enc = 'LQ1:' + Buffer.from(JSON.stringify(dirty)).toString('base64');
  assert.equal(C.importCode(enc).ok, true);
  assert.deepEqual(C.load().weekly, [5, 7]);
  C.reset();
});


// ═══════════════ gap fixes: rank progress, summary, challenge codes ═══════════════
t('rank progress is 0 for a new player, rises as requirements are met, and is 1 at the top', () => {
  const s = C.blank();
  assert.equal(C.rankOf(s).progress, 0);
  play(s, 'm01-triage', 3);
  const p1 = C.rankOf(s).progress;
  assert.ok(p1 > 0 && p1 < 1, String(p1));
  play(s, 'm03-signin', 0, 0.2);
  const p2 = C.rankOf(s).progress;
  assert.ok(p2 > p1, 'earning XP towards the same promotion moves the bar');
  play(s, 'm02-invoice', 3);
  assert.equal(C.rankOf(s).rank.id, 'junior');
  assert.ok(C.rankOf(s).progress < 1, 'after a promotion the bar restarts towards the next rank');
  const top = C.blank();
  goldAll(top, everything()); play(top, 'soc-exam', 3); play(top, 'senior-exam', 3); goldAll(top, ids('lead')); play(top, 'lead-exam', 3); goldAll(top, ids('manager')); play(top, 'manager-exam', 3);
  assert.equal(C.rankOf(top).rank.id, 'manager');
  assert.equal(C.rankOf(top).isTop, true);
  assert.equal(C.rankOf(top).progress, 1);
});
t('the summary lists each path, its rank and skills, and the cases, and says it is not a qualification', () => {
  const s = C.blank();
  goldAll(s, [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]);
  play(s, 'soc-exam', 2);
  for (const id of cloudAll()) play(s, id, 3);
  play(s, 'cloud-exam', 3);
  const text = C.summaryText(s, new Date('2026-10-15T10:00:00Z'));
  assert.match(text, /Date: 2026-10-15/);
  assert.match(text, /Rank: SOC Analyst/);
  assert.match(text, /Alert triage: \d+\/100/);
  assert.match(text, /Path: Cyber Security Analyst/);
  assert.match(text, /Path: Cloud Security/);
  assert.match(text, /Rank: Cloud Security Engineer/);
  assert.match(text, /Cloud security: \d+\/100/);
  assert.match(text, /The invoice that was not .*Gold/);
  assert.match(text, /promotion exam/);
  assert.match(text, /not qualifications/);
  assert.equal(C.summaryText(C.blank()).includes('None yet'), true);
});
t('the summary of a brand new player is honest: no rank beyond Recruit, no cases', () => {
  const text = C.summaryText(C.blank());
  assert.match(text, /Rank: Recruit/);
  assert.match(text, /Cases completed \(0\)/);
  assert.doesNotMatch(text, /Cloud security/);
});
t('a challenge code round-trips, and carries nothing but the case and the result', () => {
  const s = C.blank();
  play(s, 'm02-invoice', 2, 0.83);
  const code = C.challengeCode(s, 'm02-invoice');
  assert.match(code, /^LC1:/);
  const body = JSON.parse(atob(code.slice(4)));
  assert.deepEqual(Object.keys(body).sort(), ['m', 'p', 't', 'v', 'x']);
  const ch = C.readChallenge(code);
  assert.equal(ch.ok, true);
  assert.equal(ch.mission.id, 'm02-invoice');
  assert.equal(ch.tier, 2);
  assert.equal(ch.percent, 83);
});
t('no challenge code for a case you have not played', () => {
  assert.equal(C.challengeCode(C.blank(), 'm02-invoice'), '');
  assert.equal(C.challengeCode(C.blank(), 'no-such-case'), '');
});
t('bad or tampered challenge codes are refused', () => {
  const bad = [
    'nonsense', '', 'LC1:', 'LC1:%%%', 'LC1:' + btoa('not json'),
    'LC1:' + btoa(JSON.stringify({ v: 1, m: 'no-such-case', t: 2, p: 80 })),
    'LC1:' + btoa(JSON.stringify({ v: 1, m: 'm02-invoice', t: 9, p: 80 })),
    'LC1:' + btoa(JSON.stringify({ v: 1, m: 'm02-invoice', t: 2, p: 500 })),
    'LC1:' + btoa(JSON.stringify({ v: 2, m: 'm02-invoice', t: 2, p: 80 })),
    'LC1:' + btoa(JSON.stringify({ v: 1, m: '<script>alert(1)</script>', t: 2, p: 80 })),
  ];
  for (const code of bad) assert.equal(C.readChallenge(code).ok, false, code);
  assert.equal(C.readChallenge(null).ok, false);
  assert.equal(C.readChallenge(42).ok, false);
});
t('comparing with a friend: ahead, level, behind or not played', () => {
  const friend = C.blank();
  play(friend, 'm02-invoice', 2, 0.8);
  const ch = C.readChallenge(C.challengeCode(friend, 'm02-invoice'));
  const me = C.blank();
  assert.equal(C.compareChallenge(me, ch).result, 'untried');
  play(me, 'm02-invoice', 1, 0.6);
  assert.equal(C.compareChallenge(me, ch).result, 'behind');
  play(me, 'm02-invoice', 2, 0.8);
  assert.equal(C.compareChallenge(me, ch).result, 'level');
  play(me, 'm02-invoice', 3, 0.95);
  const c = C.compareChallenge(me, ch);
  assert.equal(c.result, 'ahead');
  assert.equal(c.yours.percent, 95);
});


// ═══════════════ level 5: SOC Manager ═══════════════
const toLead = () => {
  const s = C.blank();
  goldAll(s, everything());
  play(s, 'soc-exam', 3); play(s, 'senior-exam', 3);
  goldAll(s, ids('lead'));
  play(s, 'lead-exam', 3);
  return s;
};
t('manager missions need the Incident Response Lead rank, and the manager exam needs both manager missions plus leadership mastery', () => {
  const s = C.blank();
  goldAll(s, everything());
  play(s, 'soc-exam', 3); play(s, 'senior-exam', 3);
  goldAll(s, ids('lead'));
  for (const id of ids('manager')) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked at Senior Analyst');
  const r = play(s, 'lead-exam', 3);
  assert.equal(r.promoted.id, 'lead');
  assert.deepEqual(r.newlyUnlocked.map((m) => m.id).sort(), [...ids('manager')].sort());
  assert.equal(C.missionStatus(s, 'manager-exam').unlocked, false);
  play(s, ids('manager')[0], 3);
  assert.equal(C.missionStatus(s, 'manager-exam').unlocked, false, 'one manager mission is not enough');
  play(s, ids('manager')[1], 3);
  assert.equal(C.missionStatus(s, 'manager-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'manager-exam').missing));
});
t('the ladder reaches SOC Manager as the top rank, and a bronze exam does not promote', () => {
  const s = toLead();
  goldAll(s, ids('manager'));
  assert.equal(C.rankOf(s).rank.id, 'lead');
  play(s, 'manager-exam', 1);
  assert.equal(C.rankOf(s).rank.id, 'lead', 'bronze is not a pass');
  const r = play(s, 'manager-exam', 2);
  assert.equal(r.promoted.id, 'manager', JSON.stringify(C.rankOf(s).checklist));
  assert.equal(C.rankOf(s).isTop, true);
  assert.equal(C.rankOf(s).progress, 1);
});
t('the whole six-rank ladder is reachable with silver medals alone', () => {
  const s = C.blank();
  for (const id of everything()) play(s, id, 2);
  play(s, 'soc-exam', 2); play(s, 'senior-exam', 2);
  for (const id of ids('lead')) play(s, id, 2);
  play(s, 'lead-exam', 2);
  for (const id of ids('manager')) play(s, id, 2);
  play(s, 'manager-exam', 2);
  assert.equal(C.rankOf(s).rank.id, 'manager', JSON.stringify(C.rankOf(s).checklist.filter((x) => !x.done)));
});
t('Manager needs the exam even when everything else is done', () => {
  const s = toLead();
  goldAll(s, ids('manager'));
  const items = C.rankOf(s).checklist;
  assert.ok(items.filter((x) => x.key !== 'exam').every((x) => x.done), JSON.stringify(items.filter((x) => !x.done)));
  assert.equal(C.rankOf(s).rank.id, 'lead');
});
t('leadership skill appears from Incident Response Lead (or once tried) and never before', () => {
  const s = C.blank();
  assert.ok(!C.visibleCompetencies(s).some((c) => c.id === 'leadership'));
  goldAll(s, everything());
  play(s, 'soc-exam', 3); play(s, 'senior-exam', 3);
  assert.ok(!C.visibleCompetencies(s).some((c) => c.id === 'leadership'), 'still hidden at Senior Analyst before any lead mission');
  assert.ok(C.visibleCompetencies(toLead()).some((c) => c.id === 'leadership'), 'shown once Incident Response Lead');
  const fresh = C.blank();
  play(fresh, 'm21-extortion', 1, 0.5);
  assert.ok(C.visibleCompetencies(fresh).some((c) => c.id === 'leadership'), 'visible once attempted');
});
t('leadership mastery comes from lead and manager missions, and is weighted into the manager rank gate', () => {
  const s = toLead();
  const before = C.mastery(s, 'leadership').score;
  assert.ok(before > 0 && before < 100, 'lead missions build it part-way: ' + before);
  goldAll(s, ids('manager'));
  assert.equal(C.mastery(s, 'leadership').score > before, true);
  const gate = M.RANKS.find((r) => r.id === 'manager').requires;
  assert.ok(gate.mastery.leadership >= 60 && gate.exam === 'manager-exam');
});
t('every manager mission points at a simulation that exists and uses the allocate stage', () => {
  for (const id of [...ids('manager'), 'manager-exam']) {
    const m = M.missionById(id);
    const sim = SIMS.find((x) => x.id === m.ref);
    assert.ok(sim, id);
    assert.ok(sim.stages.some((x) => x.type === 'allocate'), id + ' has an allocation stage');
  }
});


t('a short-session recommendation never picks an exam or a case over the time limit', () => {
  const s = C.blank();
  for (const id of [...ids('beginner'), ...ids('intermediate'), ...ids('advanced')]) play(s, id, 2);
  const q = C.recommend(s, { maxMinutes: 12 });
  assert.ok(q && !q.mission.exam && q.mission.minutes <= 12, JSON.stringify(q && q.mission.id));
  assert.equal(C.recommend(s).mission.id, 'soc-exam', 'the full recommendation is still the exam');
  assert.equal(C.recommend(C.blank(), { maxMinutes: 1 }), null, 'nothing that short means no suggestion');
});
t('the short-session suggestion works on the weakest skill, and prefers the shorter case', () => {
  const s = C.blank();
  play(s, 'm01-triage', 3); play(s, 'm02-invoice', 3);
  const q = C.recommend(s, { maxMinutes: 12 });
  assert.ok(q.reason.includes('weakest area'));
  assert.ok(q.mission.minutes <= 12);
});


// ═══════════════ the Vulnerability Management path ═══════════════
const vmIds = (tier) => M.MISSIONS.filter((m) => m.tier === tier && !m.exam).map((m) => m.id);
t('the vulnerability path: three foundations open at the start, practitioner missions need two of them', () => {
  const s = C.blank();
  const open = C.unlockedIds(s).filter((id) => C.pathOfMission(M.missionById(id)) === 'vuln').sort();
  assert.deepEqual(open, vmIds('vm-found').sort());
  for (const id of vmIds('vm-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  play(s, vmIds('vm-found')[0], 3);
  for (const id of vmIds('vm-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' still needs a second pass');
  const r = play(s, vmIds('vm-found')[1], 2);
  assert.deepEqual(r.newlyUnlocked.map((m) => m.id).sort(), vmIds('vm-prac').sort());
});
t('the vulnerability ladder: Junior after two foundations, Analyst needs everything plus the exam, and a bronze exam is not a pass', () => {
  const s = C.blank();
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'recruit');
  play(s, vmIds('vm-found')[0], 2); play(s, vmIds('vm-found')[1], 2);
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'analyst', JSON.stringify(C.rankOf(s, 'vuln').checklist));
  play(s, vmIds('vm-found')[2], 2);
  for (const id of vmIds('vm-prac')) play(s, id, 2);
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'analyst', 'the exam is still outstanding');
  assert.equal(C.missionStatus(s, 'vm-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'vm-exam').missing));
  play(s, 'vm-exam', 1);
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'analyst', 'bronze is not a pass');
  const r = play(s, 'vm-exam', 2);
  assert.equal(r.promoted.id, 'vma');
  assert.equal(C.rankOf(s, 'vuln').isTop, false, 'Senior is above Vulnerability Management Analyst');
  assert.equal(C.rankOf(s, 'analyst').rank.id, 'recruit', 'the analyst ladder is untouched');
});
t('the senior vulnerability tier: opens at Vulnerability Management Analyst, needs three passes, mastery and the exam', () => {
  const lead = () => M.MISSIONS.filter((m) => m.tier === 'vm-lead' && !m.exam).map((m) => m.id);
  assert.equal(lead().length, 3);
  const s = C.blank();
  for (const id of [...lead(), 'vm-senior-exam']) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Vulnerability Management Analyst');
  for (const id of [...vmIds('vm-found'), ...vmIds('vm-prac')]) play(s, id, 3);
  play(s, 'vm-exam', 3);
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'vma');
  for (const id of lead()) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  assert.equal(C.missionStatus(s, 'vm-senior-exam').unlocked, false, 'the exam needs the senior missions first');
  for (const id of lead()) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'vm-senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'vm-senior-exam').missing));
  play(s, 'vm-senior-exam', 1);
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'vma', 'bronze is not a pass');
  const r = play(s, 'vm-senior-exam', 2);
  assert.equal(r.promoted.id, 'senior', JSON.stringify(C.rankOf(s, 'vuln').checklist));
  assert.equal(C.rankOf(s, 'vuln').isTop, false, 'Lead is above Senior Vulnerability Analyst');
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit', 'other paths are untouched');
});
t('the vulnerability exam needs real mastery in scanning and prioritisation', () => {
  const s = C.blank();
  for (const id of [...vmIds('vm-found'), ...vmIds('vm-prac')]) play(s, id, 1, 0.3);
  assert.equal(C.missionStatus(s, 'vm-exam').unlocked, false);
  for (const id of [...vmIds('vm-found'), ...vmIds('vm-prac')]) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'vm-exam').unlocked, true);
});
t('vulnerability skills show on the vulnerability path only, and the path has its own recommendation', () => {
  const s = C.blank();
  assert.deepEqual(C.visibleCompetencies(s, 'vuln').map((c) => c.id), ['vulnscan', 'vulnrisk', 'remediate', 'response', 'reporting']);
  assert.ok(!C.visibleCompetencies(s, 'analyst').some((c) => c.id === 'vulnrisk'));
  assert.equal(C.pathOfMission(C.recommend(s, { pathId: 'vuln' }).mission), 'vuln');
  const q = C.recommend(s, { pathId: 'vuln', maxMinutes: 12 });
  assert.ok(q && q.mission.minutes <= 12 && C.pathOfMission(q.mission) === 'vuln');
});
t('every mission in every path points at a case that exists in its mode (content integrity)', () => {
  for (const m of M.MISSIONS) {
    if (m.kind === 'triage') continue;
    const pool = contentIds[m.mode];
    assert.ok(pool, m.id + ' unknown mode ' + m.mode);
    assert.ok(pool.includes(m.ref), m.id + ' -> ' + m.mode + '/' + m.ref);
  }
});
t('all nine paths on the chooser are live: each has missions and a ladder of at least three ranks', () => {
  const s = C.blank();
  const live = M.PATHS.filter((p) => C.pathSummary(s, p.id).live).map((p) => p.id);
  assert.deepEqual(live, ['analyst', 'engineer', 'cloud', 'network', 'vuln', 'pentest', 'dfir', 'grc', 'ti']);
  for (const id of live) assert.ok(M.PATHS.find((p) => p.id === id).ranks.length >= 3, id + ' has a ladder');
});


// ═══════════════ the Network Security path ═══════════════
const nwIds = (tier) => M.MISSIONS.filter((m) => m.tier === tier && !m.exam).map((m) => m.id);
t('the network path: three foundations open at the start, practitioner missions need two of them', () => {
  const s = C.blank();
  const open = C.unlockedIds(s).filter((id) => C.pathOfMission(M.missionById(id)) === 'network').sort();
  assert.deepEqual(open, nwIds('net-found').sort());
  for (const id of nwIds('net-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  play(s, nwIds('net-found')[0], 3);
  const r = play(s, nwIds('net-found')[1], 2);
  assert.deepEqual(r.newlyUnlocked.map((m) => m.id).sort(), nwIds('net-prac').sort());
});
t('the network ladder: Associate after two foundations, Engineer needs everything plus the exam; bronze is not a pass', () => {
  const s = C.blank();
  play(s, nwIds('net-found')[0], 2); play(s, nwIds('net-found')[1], 2);
  assert.equal(C.rankOf(s, 'network').rank.id, 'associate', JSON.stringify(C.rankOf(s, 'network').checklist));
  play(s, nwIds('net-found')[2], 2);
  for (const id of nwIds('net-prac')) play(s, id, 2);
  assert.equal(C.rankOf(s, 'network').rank.id, 'associate');
  assert.equal(C.missionStatus(s, 'net-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'net-exam').missing));
  play(s, 'net-exam', 1);
  assert.equal(C.rankOf(s, 'network').rank.id, 'associate', 'bronze is not a pass');
  assert.equal(play(s, 'net-exam', 2).promoted.id, 'nse');
  assert.equal(C.rankOf(s, 'network').isTop, false, 'Senior is above Network Security Engineer');
  assert.equal(C.rankOf(s, 'vuln').rank.id, 'recruit', 'other paths are untouched');
});
t('the senior network tier: opens at Network Security Engineer, needs three passes, mastery and the exam', () => {
  const lead = () => M.MISSIONS.filter((m) => m.tier === 'net-lead' && !m.exam).map((m) => m.id);
  assert.equal(lead().length, 3);
  const s = C.blank();
  for (const id of [...lead(), 'net-senior-exam']) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Network Security Engineer');
  for (const id of [...nwIds('net-found'), ...nwIds('net-prac')]) play(s, id, 3);
  play(s, 'net-exam', 3);
  assert.equal(C.rankOf(s, 'network').rank.id, 'nse');
  for (const id of lead()) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  assert.equal(C.missionStatus(s, 'net-senior-exam').unlocked, false, 'the exam needs the senior missions first');
  for (const id of lead()) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'net-senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'net-senior-exam').missing));
  play(s, 'net-senior-exam', 1);
  assert.equal(C.rankOf(s, 'network').rank.id, 'nse', 'bronze is not a pass');
  const r = play(s, 'net-senior-exam', 2);
  assert.equal(r.promoted.id, 'senior', JSON.stringify(C.rankOf(s, 'network').checklist));
  assert.equal(C.rankOf(s, 'network').isTop, false, 'Architect is above Senior Network Security Engineer');
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit', 'other paths are untouched');
});
t('network skills show on the network path only', () => {
  const s = C.blank();
  assert.deepEqual(C.visibleCompetencies(s, 'network').map((c) => c.id), ['netdesign', 'fwrules', 'nettraffic', 'response', 'reporting']);
  assert.ok(!C.visibleCompetencies(s, 'vuln').some((c) => c.id === 'netdesign'));
  assert.equal(C.pathOfMission(C.recommend(s, { pathId: 'network' }).mission), 'network');
});


// ═══════════════ the Ethical Hacking and PenTest path ═══════════════
const ptIds = (tier) => M.MISSIONS.filter((m) => m.tier === tier && !m.exam).map((m) => m.id);
t('the pentest path: three foundations open at the start, practitioner missions need two of them', () => {
  const s = C.blank();
  const open = C.unlockedIds(s).filter((id) => C.pathOfMission(M.missionById(id)) === 'pentest').sort();
  assert.deepEqual(open, ptIds('pt-found').sort());
  for (const id of ptIds('pt-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  play(s, ptIds('pt-found')[0], 3);
  assert.deepEqual(play(s, ptIds('pt-found')[1], 2).newlyUnlocked.map((m) => m.id).sort(), ptIds('pt-prac').sort());
});
t('the pentest ladder: Junior after two foundations, Penetration Tester needs everything plus the exam; bronze is not a pass', () => {
  const s = C.blank();
  play(s, ptIds('pt-found')[0], 2); play(s, ptIds('pt-found')[1], 2);
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'junior', JSON.stringify(C.rankOf(s, 'pentest').checklist));
  play(s, ptIds('pt-found')[2], 2);
  for (const id of ptIds('pt-prac')) play(s, id, 2);
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'junior');
  assert.equal(C.missionStatus(s, 'pt-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'pt-exam').missing));
  play(s, 'pt-exam', 1);
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'junior', 'bronze is not a pass');
  assert.equal(play(s, 'pt-exam', 2).promoted.id, 'pt');
  assert.equal(C.rankOf(s, 'pentest').isTop, false, 'Senior is above Penetration Tester');
  assert.equal(C.rankOf(s, 'network').rank.id, 'recruit', 'other paths are untouched');
});
t('the senior pentest tier: opens at Penetration Tester, needs three passes, mastery and the exam', () => {
  const lead = () => M.MISSIONS.filter((m) => m.tier === 'pt-lead' && !m.exam).map((m) => m.id);
  assert.equal(lead().length, 3);
  const s = C.blank();
  for (const id of [...lead(), 'pt-senior-exam']) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Penetration Tester');
  for (const id of [...ptIds('pt-found'), ...ptIds('pt-prac')]) play(s, id, 3);
  play(s, 'pt-exam', 3);
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'pt');
  for (const id of lead()) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  assert.equal(C.missionStatus(s, 'pt-senior-exam').unlocked, false, 'the exam needs the senior missions first');
  for (const id of lead()) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'pt-senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'pt-senior-exam').missing));
  play(s, 'pt-senior-exam', 1);
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'pt', 'bronze is not a pass');
  const r = play(s, 'pt-senior-exam', 2);
  assert.equal(r.promoted.id, 'senior', JSON.stringify(C.rankOf(s, 'pentest').checklist));
  assert.equal(C.rankOf(s, 'pentest').isTop, false, 'Red Team Lead is above Senior Penetration Tester');
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit', 'other paths are untouched');
});
t('pentest skills show on the pentest path only', () => {
  const s = C.blank();
  assert.deepEqual(C.visibleCompetencies(s, 'pentest').map((c) => c.id), ['scope', 'recon', 'findings', 'reporting']);
  assert.ok(!C.visibleCompetencies(s, 'analyst').some((c) => c.id === 'scope'));
  assert.equal(C.pathOfMission(C.recommend(s, { pathId: 'pentest' }).mission), 'pentest');
});
t('the pentest path teaches judgement, not exploitation: no mission or case text carries commands, payloads or tool recipes', async () => {
  // Plain-language check on the data a player reads. It looks for the shapes exploit instructions take.
  const bad = /(msfconsole|sqlmap|nmaps+-|mimikatz|<script>|unions+select|' or '1'='1|curls+-|powershells+-enc|reverse shell|payload:)/i;
  const text = JSON.stringify(M.MISSIONS.filter((m) => C.pathOfMission(m) === 'pentest'));
  assert.ok(!bad.test(text));
});


// ═══════════════ the Security Engineer path ═══════════════
const seIds = (tier) => M.MISSIONS.filter((m) => m.tier === tier && !m.exam).map((m) => m.id);
t('the engineer path: three foundations open at the start, practitioner missions need two of them', () => {
  const s = C.blank();
  const open = C.unlockedIds(s).filter((id) => C.pathOfMission(M.missionById(id)) === 'engineer').sort();
  assert.deepEqual(open, seIds('se-found').sort());
  for (const id of seIds('se-prac')) assert.equal(C.missionStatus(s, id).unlocked, false, id);
  play(s, seIds('se-found')[0], 3);
  assert.deepEqual(play(s, seIds('se-found')[1], 2).newlyUnlocked.map((m) => m.id).sort(), seIds('se-prac').sort());
});
t('the engineer ladder: Junior after two foundations, Security Engineer needs everything plus the exam; bronze is not a pass', () => {
  const s = C.blank();
  play(s, seIds('se-found')[0], 2); play(s, seIds('se-found')[1], 2);
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'junior', JSON.stringify(C.rankOf(s, 'engineer').checklist));
  play(s, seIds('se-found')[2], 2);
  for (const id of seIds('se-prac')) play(s, id, 2);
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'junior');
  assert.equal(C.missionStatus(s, 'se-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'se-exam').missing));
  play(s, 'se-exam', 1);
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'junior', 'bronze is not a pass');
  assert.equal(play(s, 'se-exam', 2).promoted.id, 'se');
  assert.equal(C.rankOf(s, 'engineer').isTop, false, 'Senior is above Security Engineer');
  assert.equal(C.rankOf(s, 'pentest').rank.id, 'recruit', 'other paths are untouched');
});
t('the senior engineer tier: opens at Security Engineer, needs three passes, mastery and the exam', () => {
  const lead = () => M.MISSIONS.filter((m) => m.tier === 'se-lead' && !m.exam).map((m) => m.id);
  assert.equal(lead().length, 3);
  const s = C.blank();
  for (const id of [...lead(), 'se-senior-exam']) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Security Engineer');
  for (const id of seIds('se-found')) play(s, id, 3);
  for (const id of seIds('se-prac')) play(s, id, 3);
  play(s, 'se-exam', 3);
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'se');
  for (const id of lead()) assert.equal(C.missionStatus(s, id).unlocked, true, id);
  assert.equal(C.missionStatus(s, 'se-senior-exam').unlocked, false, 'the exam needs the senior missions first');
  for (const id of lead()) play(s, id, 3);
  assert.equal(C.missionStatus(s, 'se-senior-exam').unlocked, true, JSON.stringify(C.missionStatus(s, 'se-senior-exam').missing));
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'se');
  play(s, 'se-senior-exam', 1);
  assert.equal(C.rankOf(s, 'engineer').rank.id, 'se', 'bronze is not a pass');
  const r = play(s, 'se-senior-exam', 2);
  assert.equal(r.promoted.id, 'senior', JSON.stringify(C.rankOf(s, 'engineer').checklist));
  assert.equal(C.rankOf(s, 'engineer').isTop, false, 'Architect is above Senior Security Engineer');
  assert.equal(C.rankOf(s, 'cloud').rank.id, 'recruit', 'other paths are untouched');
});
t('engineer skills show on the engineer path only', () => {
  const s = C.blank();
  assert.deepEqual(C.visibleCompetencies(s, 'engineer').map((c) => c.id), ['hardening', 'secretsiam', 'pipeline', 'response', 'reporting']);
  assert.ok(!C.visibleCompetencies(s, 'analyst').some((c) => c.id === 'hardening'));
  assert.equal(C.pathOfMission(C.recommend(s, { pathId: 'engineer' }).mission), 'engineer');
});
t('a hundred random careers across all six paths never corrupt the ranks, XP or exports', () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let run = 0; run < 100; run++) {
    const s = C.blank();
    for (let k = 0; k < 40; k++) {
      const open = C.unlockedIds(s);
      const id = open[Math.floor(rnd() * open.length)];
      play(s, id, Math.floor(rnd() * 4), rnd());
    }
    const total = M.PATHS.reduce((n, p) => n + C.xpOf(s, p.id), 0);
    assert.equal(total, s.xp, 'per-path XP adds up to the total');
    for (const p of M.PATHS) { const r = C.rankOf(s, p.id); assert.ok(r.index >= 0 && r.index < p.ranks.length); assert.ok(r.progress >= 0 && r.progress <= 1); }
    assert.equal(C.importCode(C.exportCode(s)).ok, true);
    assert.equal(C.load().xp, s.xp);
  }
  C.reset();
});

// ── the top (architect / lead) tier on every path that has one ──
for (const pth of M.PATHS.filter((x) => x.tiers && x.tiers.some((id) => id.endsWith('-arch')))) {
  t(`the top tier on the ${pth.id} path: opens at Senior, needs two passes, mastery and the exam`, () => {
    const archTier = pth.tiers.find((id) => id.endsWith('-arch'));
    const top = pth.ranks[pth.ranks.length - 1];
    const senior = pth.ranks[pth.ranks.length - 2];
    const archMissions = M.MISSIONS.filter((m) => m.tier === archTier && !m.exam).map((m) => m.id);
    const archExam = top.requires.exam;
    assert.equal(archMissions.length, 2);
    assert.equal(senior.id, 'senior');
    const s = C.blank();
    for (const id of [...archMissions, archExam]) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked before Senior');
    // everything below the top tier, at gold, including every earlier exam
    for (const m of M.MISSIONS.filter((x) => C.pathOfMission(x) === pth.id && x.tier !== archTier)) play(s, m.id, 3);
    assert.equal(C.rankOf(s, pth.id).rank.id, 'senior', JSON.stringify(C.rankOf(s, pth.id).checklist));
    for (const id of archMissions) assert.equal(C.missionStatus(s, id).unlocked, true, id);
    assert.equal(C.missionStatus(s, archExam).unlocked, false, 'the exam needs the architect-tier missions first');
    for (const id of archMissions) play(s, id, 3);
    assert.equal(C.missionStatus(s, archExam).unlocked, true, JSON.stringify(C.missionStatus(s, archExam).missing));
    play(s, archExam, 1);
    assert.equal(C.rankOf(s, pth.id).rank.id, 'senior', 'bronze is not a pass');
    const r = play(s, archExam, 2);
    assert.equal(r.promoted.id, top.id, JSON.stringify(C.rankOf(s, pth.id).checklist));
    assert.equal(C.rankOf(s, pth.id).isTop, true);
    assert.equal(C.rankOf(s, 'analyst').rank.id, 'recruit', 'the analyst ladder is untouched');
  });
}

// ── the three newest paths (incident response and forensics, GRC, threat intelligence) ──
for (const pid of ['dfir', 'grc', 'ti']) {
  t(`the ${pid} path: foundations open, practitioner needs two passes, Junior after two, the exam promotes at silver (bronze is not a pass)`, () => {
    const pth = M.PATHS.find((x) => x.id === pid);
    assert.ok(pth && pth.ranks.length === 3, pid + ' has three ranks');
    const [found, prac] = pth.tiers;
    const foundIds = M.MISSIONS.filter((m) => m.tier === found).map((m) => m.id);
    const pracIds = M.MISSIONS.filter((m) => m.tier === prac && !m.exam).map((m) => m.id);
    const exam = pth.ranks[2].requires.exam;
    assert.equal(foundIds.length, 3);
    assert.ok(pracIds.length >= 3);
    const s = C.blank();
    for (const id of foundIds) assert.equal(C.missionStatus(s, id).unlocked, true, id + ' is open at the start');
    for (const id of pracIds) assert.equal(C.missionStatus(s, id).unlocked, false, id + ' is locked at the start');
    play(s, foundIds[0], 2); play(s, foundIds[1], 2);
    assert.equal(C.rankOf(s, pid).rank.id, pth.ranks[1].id, JSON.stringify(C.rankOf(s, pid).checklist));
    for (const id of pracIds) assert.equal(C.missionStatus(s, id).unlocked, true, id + ' opens after two foundations');
    play(s, foundIds[2], 2);
    for (const id of pracIds) play(s, id, 2);
    assert.equal(C.rankOf(s, pid).rank.id, pth.ranks[1].id, 'the exam is still outstanding');
    assert.equal(C.missionStatus(s, exam).unlocked, true, JSON.stringify(C.missionStatus(s, exam).missing));
    play(s, exam, 1);
    assert.equal(C.rankOf(s, pid).rank.id, pth.ranks[1].id, 'bronze is not a pass');
    assert.equal(play(s, exam, 2).promoted.id, pth.ranks[2].id);
    assert.equal(C.rankOf(s, pid).isTop, true);
    assert.equal(C.rankOf(s, 'analyst').rank.id, 'recruit', 'the analyst ladder is untouched');
    assert.deepEqual(C.visibleCompetencies(s, pid).map((c) => c.id), pth.competencies);
  });
}

console.log(n, 'passed');
