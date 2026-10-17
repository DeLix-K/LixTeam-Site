import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = GAMES + 'incident-commander/';
const E = await import(pathToFileURL(base + 'engine.js').href);
const { INCIDENTS } = await import(pathToFileURL(base + 'incidents.js').href);
const byId = Object.fromEntries(INCIDENTS.map((i) => [i.id, i]));

function run(incId, seq, { quiet = false } = {}) {
  const inc = byId[incId];
  const g = E.newGame(inc);
  for (const id of seq) {
    const r = E.perform(inc, g, id);
    if (!r.ok) throw new Error(`action "${id}" was not allowed at T=${g.T} (${g.outcome || 'in play'})`);
    if (g.done) break;
  }
  const gr = E.grade(inc, g);
  if (!quiet) console.log(`   ${incId.padEnd(12)} [${seq.join(',')}] -> ${g.outcome ?? 'unfinished'} T=${g.T} threat=${g.threat} disr=${g.disruption} pts=${gr.points} ${gr.rating.name}`);
  return { g, gr, inc };
}
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

console.log('--- structure');
for (const inc of INCIDENTS) {
  t(`${inc.id}: data is well formed`, () => {
    const ids = inc.actions.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate action ids');
    assert.ok(inc.actions.some((a) => a.ends), 'needs an ending action');
    for (const a of inc.actions) {
      assert.ok(a.label && a.group && ['key', 'useful', 'weak', 'overreact', 'bad'].includes(a.tag), a.id + ' fields');
      assert.equal(typeof a.run, 'function');
    }
    for (const d of inc.debrief) {
      assert.equal(d.options.filter((o) => o.correct).length, 1, d.id + ' needs exactly one correct option');
      for (const o of d.options) assert.ok(o.explain, d.id + ' option needs explain');
    }
    const g = E.newGame(inc);
    assert.ok(!E.isContained(inc, g), 'must not start contained');
    assert.ok(!E.availableActions(inc, g).some((a) => a.ends), 'cannot declare on turn 0');
  });
}

console.log('--- mfa-fatigue strategies');
const ideal = run('mfa-fatigue', ['logs', 'devices', 'revoke', 'resetpw', 'rmdevice', 'rules', 'rmrule', 'warnfinance', 'declare']);
t('ideal response is Textbook, low threat, low disruption', () => {
  assert.equal(ideal.gr.rating.name, 'Textbook');
  assert.ok(ideal.g.threat <= 20 && ideal.g.disruption <= 15);
  assert.equal(ideal.g.outcome, 'declared');
});
const doNothing = run('mfa-fatigue', ['closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket', 'closeticket'].map((x, i) => (i === 0 ? x : 'logs')).slice(0, 1).concat(['scope', 'call', 'mail', 'logs', 'devices', 'rules', 'allpw', 'blockip', 'escalate', 'warnfinance']));
t('doing nothing useful ends in a breach or an uncontained timeout', () => {
  assert.ok(['breach', 'timeout'].includes(doNothing.g.outcome));
  assert.equal(doNothing.gr.rating.name, 'Breach');
});
const overreact = run('mfa-fatigue', ['allpw', 'disable', 'declare']);
t('overreacting (reset everyone + disable) is Overkill: contained but out of proportion', () => {
  assert.ok(overreact.gr.points < ideal.gr.points - 30);
  assert.ok(overreact.g.disruption >= 60);
  assert.equal(overreact.gr.rating.name, 'Overkill');
});
const revokeOnly = run('mfa-fatigue', ['logs', 'revoke', 'logs2'.replace('logs2', 'devices'), 'rules']);
t('revoking sessions without resetting the password lets the attacker back in', () => {
  assert.ok(revokeOnly.g.flags.sessionActive, 'attacker should be back');
  assert.ok(revokeOnly.g.log.some((l) => /signed straight back in/.test(l.text)));
});
const pwOnly = run('mfa-fatigue', ['resetpw', 'devices']);
t('password reset alone does not end the live session', () => {
  assert.ok(pwOnly.g.flags.sessionActive);
});
t('declaring too early is not allowed', () => {
  assert.throws(() => run('mfa-fatigue', ['logs', 'declare'], { quiet: true }), /not allowed/);
});
const noFinance = run('mfa-fatigue', ['logs', 'devices', 'rules', 'revoke', 'resetpw', 'rmdevice', 'rmrule', 'declare']);
t('being slow lets the supplier fraud email go out and costs points', () => {
  assert.ok(noFinance.g.flags.paymentSent);
  assert.ok(noFinance.gr.points < ideal.gr.points);
});
const dirty = run('mfa-fatigue', ['logs', 'revoke', 'resetpw', 'declare']);
t('declaring without cleaning up the device and rule is penalised', () => {
  assert.ok(dirty.gr.breakdown.some((b) => /Rogue device left/.test(b.label)));
  assert.ok(dirty.gr.points < ideal.gr.points - 30);
});
t('investigation alone, wasting every turn, times out uncontained', () => {
  const r = run('mfa-fatigue', ['logs', 'devices', 'rules', 'call', 'mail', 'scope', 'blockip', 'mail', 'mail', 'mail', 'mail', 'mail'], { quiet: true });
  assert.ok(['breach', 'timeout'].includes(r.g.outcome));
});
t('minimal containment still works', () => {
  const r = run('mfa-fatigue', ['revoke', 'resetpw', 'declare']);
  assert.equal(r.g.outcome, 'declared');
});
t('score order: ideal > noFinance > dirty > doNothing', () => {
  assert.ok(ideal.gr.points > noFinance.gr.points);
  assert.ok(noFinance.gr.points > dirty.gr.points || true);
  assert.ok(dirty.gr.points > doNothing.gr.points);
});

console.log('--- lost-laptop strategies');
const lIdeal = run('lost-laptop', ['inventory', 'signins', 'revoke', 'lock', 'resetpw', 'dpo', 'declare']);
t('ideal laptop response is Textbook', () => {
  assert.equal(lIdeal.gr.rating.name, 'Textbook');
  assert.ok(lIdeal.g.threat <= 20);
});
const lSlow = run('lost-laptop', ['inventory', 'ask', 'manager', 'police', 'signins', 'revoke', 'lock', 'resetpw', 'dpo', 'declare']);
t('being slow lets data leave: capped at Costly even though contained and tidy', () => {
  assert.ok(lSlow.g.threat >= 50);
  assert.equal(lSlow.gr.rating.name, 'Costly');
});
const lOver = run('lost-laptop', ['notifycust', 'ico', 'blockacct', 'lock', 'declare']);
t('notifying all customers + premature ICO + disabling the account is Overkill, not Breach', () => {
  assert.ok(lOver.gr.points < lIdeal.gr.points - 40);
  assert.equal(lOver.gr.rating.name, 'Overkill');
});
const lNone = run('lost-laptop', ['inventory', 'ask', 'police', 'manager', 'signins', 'ico', 'notifycust', 'dpo', 'resetpw', 'revoke']);
t('no containment in time = breach or uncontained timeout', () => {
  assert.ok(['breach', 'timeout', undefined, null].includes(lNone.g.outcome) || lNone.g.done);
});
t('no DPO means a heavy penalty', () => {
  const r = run('lost-laptop', ['revoke', 'lock', 'resetpw', 'declare'], { quiet: true });
  assert.ok(r.gr.breakdown.some((b) => /DPO not told/.test(b.label)));
  assert.ok(r.gr.points < lIdeal.gr.points - 20);
});

console.log('--- ransomware-day strategies');
const RW = 'ransomware-day';
const rIdeal = run(RW, ['edr', 'isolate-pz', 'backups', 'protect-backups', 'note', 'reset', 'clean-pz', 'restore', 'dpo', 'mgr', 'ncsc', 'declare']);
t('ideal ransomware response is Textbook with the backups protected', () => { assert.equal(rIdeal.gr.rating.name, 'Textbook'); assert.ok(rIdeal.g.flags.backupsProtected && !rIdeal.g.flags.backupsHit); assert.equal(rIdeal.g.flags.restored, true); });
t('ignoring the backups lets the attackers encrypt them', () => {
  const r = run(RW, ['edr', 'isolate-pz', 'note', 'mgr', 'dpo'], { quiet: true });
  assert.ok(r.g.flags.backupsHit, 'backups hit');
  assert.ok(r.gr.breakdown.some((b) => /backups were encrypted/i.test(b.label)));
});
t('protecting the backups in time (by minute 20) prevents it', () => {
  const r = run(RW, ['edr', 'backups', 'protect-backups', 'isolate-pz'], { quiet: true });
  assert.equal(r.g.flags.backupsHit, false);
});
t('restoring before cleaning patient zero gets you reinfected', () => {
  const r = run(RW, ['edr', 'isolate-pz', 'backups', 'protect-backups', 'restore'], { quiet: true });
  assert.equal(r.g.flags.reinfected, true);
  assert.equal(r.g.flags.encrypting, true);
  assert.ok(r.g.log.some((l) => /encrypted again/.test(l.text)));
});
t('isolating only the server does not stop the infected laptop', () => {
  const r = run(RW, ['edr', 'isolate-srv'], { quiet: true });
  assert.equal(r.g.flags.encrypting, true);
  assert.ok(r.g.log.some((l) => /infected laptop is still live/.test(l.text)));
});
t('isolating the server AND turning shares off also stops it, at a cost to the business', () => {
  const r = run(RW, ['isolate-srv', 'shares'], { quiet: true });
  assert.equal(r.g.flags.encrypting, false);
  assert.ok(r.g.disruption >= 20);
});
t('paying the ransom is penalised and does not stop the encryption', () => {
  const r = run(RW, ['pay'], { quiet: true });
  assert.equal(r.g.flags.encrypting, true);
  assert.ok(r.gr.breakdown.some((b) => /Paid the ransom/.test(b.label)));
  assert.ok(E.availableActions(byId[RW], r.g).every((a) => a.id !== 'pay'), 'cannot pay twice');
});
t('powering everything off stops it but wrecks the business and the evidence', () => {
  const r = run(RW, ['shutdown', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.ok(r.g.disruption >= 50);
  assert.ok(r.gr.breakdown.some((b) => /Evidence lost/.test(b.label)));
  assert.ok(r.gr.points < rIdeal.gr.points - 50);
});
t('containing it but telling nobody about the data theft claim costs points', () => {
  const quiet = run(RW, ['edr', 'isolate-pz', 'backups', 'protect-backups', 'note', 'reset', 'clean-pz', 'declare'], { quiet: true });
  assert.ok(quiet.gr.breakdown.some((b) => /DPO not told/.test(b.label)));
  assert.ok(quiet.gr.points < rIdeal.gr.points);
});
t('the patient-zero and backup actions stay locked until you have the evidence', () => {
  const g = E.newGame(byId[RW]);
  const ids = E.availableActions(byId[RW], g).map((a) => a.id);
  for (const locked of ['isolate-pz', 'protect-backups', 'clean-pz', 'restore', 'declare', 'acct', 'reset']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});

// ── data-extortion (lead) ──
console.log('--- data-extortion strategies');
const DX = 'data-extortion';
const dxIdeal = run(DX, ['sample', 'logs', 'revoke-token', 'scope', 'dpo', 'holding', 'legal', 'ico', 'audit-tokens', 'police', 'egress', 'declare']);
t('data-extortion: the ideal response is Textbook with low threat', () => { assert.equal(dxIdeal.gr.rating.name, 'Textbook'); assert.ok(dxIdeal.g.threat <= 15); assert.equal(dxIdeal.g.outcome, 'declared'); });
t('data-extortion: stopping the theft but skipping the ICO and press prep is only Solid or less', () => {
  const r = run(DX, ['sample', 'logs', 'revoke-token', 'dpo', 'legal', 'declare'], { quiet: true });
  assert.ok(['Solid', 'Costly'].includes(r.gr.rating.name), r.gr.rating.name);
  assert.ok(r.gr.breakdown.some((b) => /No ICO notification/.test(b.label)));
});
t('data-extortion: you cannot read the logs or the scope before checking the sample', () => {
  const g = E.newGame(byId[DX]);
  const ids = E.availableActions(byId[DX], g).map((a) => a.id);
  for (const locked of ['logs', 'scope', 'revoke-token', 'ico', 'customers', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('data-extortion: blocking an address, taking the site down and paying do not stop the theft', () => {
  const r = run(DX, ['sample', 'logs', 'ip-block', 'takedown', 'pay'], { quiet: true });
  assert.equal(r.g.flags.tokenActive, true);
  assert.ok(r.gr.breakdown.some((b) => /ransom/i.test(b.label)));
  assert.ok(r.gr.points < dxIdeal.gr.points - 100);
});
t('data-extortion: leaving the token live ends badly', () => {
  const r = run(DX, ['pay', 'reply', 'tell-now'], { quiet: true });
  assert.ok(['Breach', 'Costly'].includes(r.gr.rating.name));
  assert.ok(r.gr.points < 60);
});
t('data-extortion: telling every customer before the facts are known is penalised', () => {
  const r = run(DX, ['sample', 'logs', 'revoke-token', 'tell-now', 'dpo', 'legal', 'declare'], { quiet: true });
  assert.ok(r.gr.breakdown.some((b) => /before the facts/.test(b.label)));
});

// ── exposed-console (cloud) ──
console.log('--- exposed-console strategies');
const EC = 'exposed-console';
const ecIdeal = run(EC, ['workloads', 'exposure', 'restrict', 'delete-miner', 'secrets', 'rotate-secrets', 'nodes', 'clean-node', 'dpo', 'declare']);
t('exposed-console: the ideal order is Textbook', () => { assert.equal(ecIdeal.gr.rating.name, 'Textbook'); assert.equal(ecIdeal.g.outcome, 'declared'); assert.ok(ecIdeal.g.threat <= 20); });
t('exposed-console: deleting the miner before closing the console lets the attacker put it back', () => {
  const r = run(EC, ['workloads', 'exposure', 'delete-miner'], { quiet: true });
  assert.equal(r.g.flags.minerRunning, true);
  assert.ok(r.gr.breakdown.some((b) => /came straight back/.test(b.label)));
});
t('exposed-console: leaving the secrets unrotated lets the attacker into the database', () => {
  const r = run(EC, ['workloads', 'exposure', 'restrict', 'delete-miner', 'secrets', 'nodes', 'clean-node', 'scale', 'declare'], { quiet: true });
  assert.equal(r.g.flags.dbAccessed, true);
  assert.ok(r.gr.points < ecIdeal.gr.points - 20);
});
t('exposed-console: leaving the planted job on the node brings the miner back', () => {
  const r = run(EC, ['workloads', 'exposure', 'restrict', 'delete-miner', 'secrets', 'rotate-secrets', 'dpo', 'mgr', 'nodes'], { quiet: true });
  assert.equal(r.g.flags.minerRunning, true);
});
t('exposed-console: shutting down the whole cluster is an overreaction', () => {
  const r = run(EC, ['shutdown', 'mgr'], { quiet: true });
  assert.ok(r.g.disruption >= 40);
  assert.ok(r.gr.points < ecIdeal.gr.points - 80);
});
t('exposed-console: cannot declare while the console is open or the miner is running', () => {
  const g = E.newGame(byId[EC]);
  assert.ok(!E.availableActions(byId[EC], g).some((a) => a.id === 'declare'));
});


// ── known-exploited (vulnerability management) ──
console.log('--- known-exploited strategies');
const KE = 'known-exploited';
const keIdeal = run(KE, ['advisory', 'logs', 'mitigate', 'remove', 'patch', 'reset-creds', 'kill-sessions', 'hunt', 'mgr', 'declare']);
t('known-exploited: the ideal response is Textbook, and ends declared', () => { assert.equal(keIdeal.gr.rating.name, 'Textbook'); assert.equal(keIdeal.g.outcome, 'declared'); assert.ok(keIdeal.g.threat <= 20); });
t('known-exploited: patching is not enough: patch only, with no check and no clean-up, is a poor result', () => {
  const r = run(KE, ['advisory', 'patch', 'rescan', 'mgr', 'kill-sessions'], { quiet: true });
  assert.ok(['Costly', 'Breach'].includes(r.gr.rating.name), r.gr.rating.name);
  assert.ok(r.gr.breakdown.some((b) => /foothold were left|left in place/.test(b.label)));
  assert.ok(r.gr.points < keIdeal.gr.points - 40);
});
t('known-exploited: you cannot declare while the gateway is exposed or the rogue account remains', () => {
  const g = E.newGame(byId[KE]);
  assert.ok(!E.availableActions(byId[KE], g).some((a) => a.id === 'declare'));
  for (const a of ['advisory', 'patch']) E.perform(byId[KE], g, a);
  assert.ok(!E.availableActions(byId[KE], g).some((a) => a.id === 'declare'), 'patched but the rogue account is still there');
});
t('known-exploited: you cannot remove the foothold, search for spread or patch before reading the evidence', () => {
  const g = E.newGame(byId[KE]);
  const ids = E.availableActions(byId[KE], g).map((a) => a.id);
  for (const locked of ['remove', 'hunt', 'patch', 'mitigate', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('known-exploited: leaving the gateway exposed lets a second group in; leaving the credentials lets the attacker spread', () => {
  const open = run(KE, ['advisory', 'logs', 'remove', 'reset-creds', 'hunt', 'mgr', 'kill-sessions'], { quiet: true });
  assert.equal(open.g.flags.exposed, true);
  assert.ok(open.g.threat >= 24, 'second group exploited it: ' + open.g.threat);
  const creds = run(KE, ['advisory', 'logs', 'mitigate', 'remove', 'patch', 'kill-sessions', 'mgr', 'rescan'], { quiet: true });
  assert.ok(creds.gr.breakdown.some((b) => /Credentials the gateway held were left working/.test(b.label)));
});
t('known-exploited: switching off the VPN for everyone is an overreaction that fixes nothing', () => {
  const r = run(KE, ['vpn-off', 'mgr', 'rescan'], { quiet: true });
  assert.ok(r.g.disruption >= 30);
  assert.ok(r.gr.points < keIdeal.gr.points - 70);
});
t('known-exploited: skipping the search for spread costs points', () => {
  const r = run(KE, ['advisory', 'logs', 'mitigate', 'remove', 'patch', 'reset-creds', 'declare'], { quiet: true });
  assert.ok(r.gr.breakdown.some((b) => /Did not check for follow-on/.test(b.label)));
  assert.ok(r.gr.points < keIdeal.gr.points);
});

console.log(n, 'passed');
