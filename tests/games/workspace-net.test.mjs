import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const N = await import(pathToFileURL(GAMES + 'workspace/net.js').href);
const { NET_FLAT: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/net-flat.js').href);

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
const LT = 'LT-CONT-9';
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);
const add = (st, action, src, dst, port = '*', proto = '*', where = 'top') => E.fwAdd(S, st, { action, src, dst, port, proto }, where);

// The reference answer: a segmented guest zone with two exceptions, DNS limited, and the attacker's address blocked.
function reference(st) {
  add(st, 'deny', '*', '203.0.113.9');
  add(st, 'deny', 'GUEST', 'INTERNET', 53, 'udp');
  add(st, 'deny', 'GUEST', 'SERVERS');
  add(st, 'deny', 'GUEST', 'CORP');
  add(st, 'allow', 'GUEST', 'DNS-01', 53, 'udp');
  add(st, 'allow', 'GUEST', 'APP-01', 443, 'tcp');
}
const GOOD = { source: 'LT-CONT-9', first: '13:52', zones: ['CORP', 'SERVERS'], types: ['scan', 'smb', 'c2', 'dns-tunnel'], cause: 'flat', fixes: ['segment-guest', 'dns-egress', 'default-deny'], summary: 'A contractor laptop on the guest wifi scanned the office, copied the finance share and sent it out over DNS. Fixed by walling off the guest zone and limiting DNS.' };
const PINS = ['e-join', 'e-c2-' + m(13, 52), 'e-sc-' + m(13, 55), 'e-smb-' + m(14, 8), 'e-dnsprobe'];
const ACTS = [['notify', 'IT manager'], ['notify', 'Northwind Systems (the contractor\'s company)']];

function play({ rules = reference, pins = PINS, acts = ACTS, report = GOOD, wait = 0 } = {}) {
  const st = E.newRun(S);
  rules(st);
  for (const [a, tg] of acts) E.perform(S, st, a, tg);
  for (const p of pins) E.pin(st, p);
  E.advance(st, wait);
  return { st, g: E.grade(S, st, report) };
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('policy: first match wins, and the default applies when nothing matches', () => {
  const pol = { def: 'allow', rules: [{ id: 'A', action: 'allow', src: 'GUEST', dst: 'APP-01', port: 443, proto: 'tcp' }, { id: 'B', action: 'deny', src: 'GUEST', dst: 'SERVERS', port: '*', proto: '*' }] };
  const d = (dst, port) => N.decide(S, pol, { src: LT, dst, port, proto: 'tcp' });
  assert.equal(d('APP-01', 443).action, 'allow');
  assert.equal(d('APP-01', 443).rule.id, 'A');
  assert.equal(d('APP-01', 22).action, 'deny', 'the deny catches the rest of the server zone');
  assert.equal(d('FS-01', 445).rule.id, 'B');
  assert.equal(d('192.0.2.77', 443).rule, null);
  assert.equal(d('192.0.2.77', 443).action, 'allow');
  const swapped = { def: 'allow', rules: [pol.rules[1], pol.rules[0]] };
  assert.equal(N.decide(S, swapped, { src: LT, dst: 'APP-01', port: 443, proto: 'tcp' }).action, 'deny', 'the broad deny first blocks the exception');
});
t('rules match zones, hosts, ports and protocols', () => {
  assert.equal(N.zoneOf(S, 'LT-FIN-03'), 'CORP');
  assert.equal(N.zoneOf(S, '203.0.113.9'), 'INTERNET');
  assert.equal(N.zoneOf(S, '10.9.9.9'), 'INTERNET', 'an address nobody knows is the internet');
  const r = { src: 'CORP', dst: '*', port: 53, proto: 'udp' };
  assert.ok(N.ruleMatches(S, r, { src: 'LT-HR-01', dst: 'DNS-01', port: 53, proto: 'udp' }));
  assert.ok(!N.ruleMatches(S, r, { src: 'LT-HR-01', dst: 'DNS-01', port: 53, proto: 'tcp' }));
  assert.ok(!N.ruleMatches(S, r, { src: LT, dst: 'DNS-01', port: 53, proto: 'udp' }));
});
t('the starting policy blocks the internet from the inside and nothing else', () => {
  const pol = N.initialPolicy(S);
  assert.equal(pol.def, 'allow');
  assert.equal(pol.rules.length, 3);
  assert.ok(N.threatStatus(S, pol).every((x) => !x.blocked), 'every threat is open');
  assert.ok(N.serviceStatus(S, pol).every((x) => x.ok), 'every service works');
});
t('the starting rules turn the background scanner away, and the denial is visible', () => {
  const st = E.newRun(S);
  const probe = S.events.find((e) => e.id.startsWith('s-probe-'));
  assert.ok(!has(st, probe.id));
  assert.ok(has(st, 'deny-' + probe.id));
  const d = E.visibleEvents(S, st).find((e) => e.id === 'deny-' + probe.id);
  assert.match(d.summary, /Firewall denied 198\.18\.0\.5/);
  assert.equal(d.synthetic, true);
});
t('at the start, the leaks have not happened and the contractor\'s earlier traffic is in the log', () => {
  const st = E.newRun(S);
  assert.ok(has(st, 'e-smb-' + m(14, 8)) && has(st, 'e-sc-' + m(13, 55)));
  assert.ok(!has(st, 'e-dns-' + m(14, 50)));
  assert.ok(!has(st, 'e-dns-' + m(15, 0)));
});
t('left alone, four chunks leak over DNS', () => {
  const st = E.newRun(S);
  E.advance(st, 80);
  assert.equal(E.consequences(S, st, S.horizon).length, 4);
});
t('a rule stops what comes next and never rewrites the past', () => {
  const st = E.newRun(S);
  E.advance(st, 10); // 14:30
  assert.ok(has(st, 'e-smb-' + m(14, 28)));
  add(st, 'deny', 'GUEST', 'SERVERS');
  E.advance(st, 60);
  assert.ok(has(st, 'e-smb-' + m(14, 28)), 'earlier copies are still in the log');
  assert.ok(!has(st, 'e-smb-' + m(14, 36)), 'later ones never happened');
  assert.ok(has(st, 'deny-e-smb-' + m(14, 36)), 'and show up as denied');
});
t('each edit costs time, and a flow is judged by the policy in force when it happened', () => {
  const st = E.newRun(S);
  const c = st.clock;
  add(st, 'deny', LT, '203.0.113.53', 53, 'udp');
  assert.equal(st.clock, c + 3);
  const id = st.fw.history[1].policy.rules[0].id;
  E.fwRemove(S, st, id);
  assert.equal(st.clock, c + 4);
  E.advance(st, 40); // 15:04: the rule was removed at 14:24, before the exfiltration began
  assert.ok(has(st, 'e-dns-' + m(14, 50)), 'removing the rule lets the next flows through');
  assert.ok(!has(st, 'deny-e-dns-' + m(14, 50)));
});
t('rules can be reordered, removed and added at the bottom', () => {
  const st = E.newRun(S);
  const a = add(st, 'deny', 'GUEST', 'SERVERS').rule;
  const b = add(st, 'allow', 'GUEST', 'APP-01', 443, 'tcp', 'bottom').rule;
  let pol = N.currentPolicy(st);
  assert.deepEqual(pol.rules.map((r) => r.id), [a.id, 'R1', 'R2', 'R3', b.id]);
  assert.equal(N.decide(S, pol, { src: LT, dst: 'APP-01', port: 443, proto: 'tcp' }).action, 'deny', 'the allow sits below the deny');
  for (let i = 0; i < 4; i++) E.fwMove(S, st, b.id, 'up');
  pol = N.currentPolicy(st);
  assert.equal(pol.rules[0].id, b.id);
  assert.equal(N.decide(S, pol, { src: LT, dst: 'APP-01', port: 443, proto: 'tcp' }).action, 'allow');
  assert.equal(E.fwMove(S, st, b.id, 'up').ok, false, 'cannot move past the top');
  assert.equal(E.fwRemove(S, st, 'R99').ok, false);
});
t('bad rules are refused and cost nothing', () => {
  const st = E.newRun(S);
  const c = st.clock;
  for (const spec of [{ action: 'maybe', src: '*', dst: '*', port: '*', proto: '*' }, { action: 'deny', src: 'NOWHERE', dst: '*', port: '*', proto: '*' }, { action: 'deny', src: '*', dst: '*', port: 99999, proto: '*' }, { action: 'deny', src: '*', dst: '*', port: '*', proto: 'icmp' }]) assert.equal(E.fwAdd(S, st, spec).ok, false);
  assert.equal(st.clock, c);
  assert.equal(st.fw.history.length, 1);
});
t('the default policy can be switched, which breaks every service until allows are added', () => {
  const st = E.newRun(S);
  assert.equal(E.fwDefault(S, st, 'deny').ok, true);
  assert.equal(E.fwDefault(S, st, 'deny').ok, false);
  assert.equal(N.serviceStatus(S, N.currentPolicy(st)).filter((x) => !x.ok).length, S.net.services.length);
  assert.ok(E.disruptionNow(S, st) >= 40);
});
t('the packet tracer decides a test flow with the live policy', () => {
  const st = E.newRun(S);
  assert.equal(E.fwTest(S, st, { src: LT, dst: 'FS-01', port: 445, proto: 'tcp' }).action, 'allow');
  add(st, 'deny', 'GUEST', 'SERVERS');
  assert.equal(E.fwTest(S, st, { src: LT, dst: 'FS-01', port: 445, proto: 'tcp' }).action, 'deny');
});
t('the path of a connection crosses the firewall only between zones', () => {
  const inside = N.pathOf(S, { src: 'LT-FIN-03', dst: 'LT-HR-01' }).map((h) => h.id);
  assert.deepEqual(inside, ['LT-FIN-03', 'SW-CORP', 'LT-HR-01']);
  const across = N.pathOf(S, { src: LT, dst: 'FS-01' }).map((h) => h.id);
  assert.deepEqual(across, [LT, 'SW-GUEST', 'FW-01', 'SW-SERVERS', 'FS-01']);
});
t('flows carry packet details to inspect', () => {
  const smb = S.events.find((e) => e.id === 'e-smb-' + m(14, 8));
  for (const k of ['bytes_out', 'bytes_in', 'packets', 'duration_s', 'direction']) assert.ok(smb.fields[k] !== undefined, k);
  const dns = S.events.find((e) => e.id === 'e-dns-' + m(14, 50));
  assert.equal(dns.fields.record, 'TXT');
  assert.ok(dns.fields.avg_name_len > 50);
});
t('searches understand port, protocol and zone', () => {
  const st = E.newRun(S);
  assert.ok(E.search(S, st, 'port:3389 zone:GUEST').length >= 8);
  assert.deepEqual(E.search(S, st, 'port:53 proto:udp host:LT-CONT-9').map((e) => e.id), ['e-dnsprobe'], 'only the first small probe, the tunnel has not started yet');
  assert.ok(E.search(S, st, 'type:dhcp').some((e) => e.id === 'e-join'));
});

t('the reference rules stop every threat and break nothing', () => {
  const st = E.newRun(S);
  reference(st);
  const pol = N.currentPolicy(st);
  assert.ok(N.threatStatus(S, pol).every((x) => x.blocked), JSON.stringify(N.threatStatus(S, pol).filter((x) => !x.blocked).map((x) => x.id)));
  assert.deepEqual(N.serviceStatus(S, pol).filter((x) => !x.ok).map((x) => x.id), []);
  E.advance(st, 90);
  assert.equal(E.consequences(S, st, S.horizon).length, 0);
});
t('best play earns gold with no disruption', () => {
  const { g } = play();
  assert.ok(g.total >= 95, 'total ' + g.total);
  assert.equal(g.tier, 3);
  assert.equal(g.disruption, 0);
});
t('quarantining the contractor laptop works and costs only the contractor portal', () => {
  const { g } = play({ rules: (st) => add(st, 'deny', LT, '*') });
  assert.equal(g.disruption, 3);
  assert.equal(g.tier, 3, 'total ' + g.total);
});
t('doing nothing lets the data leak, caps the medal and fails the response', () => {
  const { g } = play({ rules: () => {}, wait: 80 });
  assert.ok(g.tier <= 1 && g.total < 65, 'total ' + g.total);
  assert.ok(g.lines.some((l) => /leaked over DNS \(4 times\)/.test(l.label)));
});
t('blocking only what is easy leaves the rest open and the score down', () => {
  const { g } = play({ rules: (st) => add(st, 'deny', '*', '203.0.113.9') });
  assert.ok(g.lines.some((l) => /Still open: the DNS tunnel/.test(l.label)));
  assert.ok(g.tier < 3);
});
t('a blanket deny from the guest zone stops the threats but breaks guest services', () => {
  const { g } = play({ rules: (st) => add(st, 'deny', 'GUEST', '*') });
  assert.equal(g.disruption, 3 + 2 + 2, 'portal, guest web, guest DNS');
});
t('denying every DNS packet to the internet breaks name lookups for everyone', () => {
  const st = E.newRun(S);
  add(st, 'deny', '*', 'INTERNET', 53, 'udp');
  const broken = N.serviceStatus(S, N.currentPolicy(st)).filter((x) => !x.ok).map((x) => x.id);
  assert.deepEqual(broken, ['dns-forward']);
  assert.ok(E.disruptionNow(S, st) >= 5);
});
t('denying port 3389 or 445 everywhere breaks the IT and file services', () => {
  const st = E.newRun(S);
  add(st, 'deny', '*', '*', 3389, 'tcp');
  add(st, 'deny', '*', '*', 445, 'tcp');
  const broken = N.serviceStatus(S, N.currentPolicy(st)).filter((x) => !x.ok).map((x) => x.id).sort();
  assert.deepEqual(broken, ['admin-rdp', 'file-share']);
});
t('default-deny with nothing allowed is the worst outcome', () => {
  const { g } = play({ rules: (st) => E.fwDefault(S, st, 'deny'), acts: [], pins: [], report: { ...GOOD, source: 'FS-01', zones: [], types: [], fixes: [] } });
  assert.equal(g.tier, 0, 'total ' + g.total);
  assert.ok(g.disruption >= 40);
});
t('the wrong source, time and zones lose report points', () => {
  const { g } = play({ report: { ...GOOD, source: 'PH-G1', first: '14:30', zones: ['GUEST', 'CCTV'], types: ['ddos'], cause: 'phish', fixes: ['open-all'] } });
  assert.ok(g.parts.report <= 10.5, 'report ' + g.parts.report);
});
t('a report with no pinned evidence is mostly a guess', () => {
  const { g } = play({ pins: [] });
  assert.ok(g.parts.report <= 14.1, 'report ' + g.parts.report);
});
t('unrelated flows pinned cost evidence points', () => {
  const clean = play().g.parts.evidence;
  const noisy = play({ pins: [...PINS, 's-payroll-' + S.events.find((e) => e.id.startsWith('s-payroll-')).t, 's-backup-big'] }).g.parts.evidence;
  assert.ok(noisy < clean);
});
t('grading adds up to 100, the business weights make sense and every debrief question has one right answer', () => {
  const total = S.grading.triage + S.grading.evidence + S.grading.response + S.grading.reportTotal;
  assert.equal(total, 100);
  assert.ok(N.serviceStatus(S, N.initialPolicy(S)).reduce((a, x) => a + x.weight, 0) >= 40);
  for (const q of S.debrief) assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
});

console.log(n, 'passed');
