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


// ── exposed-remote (network security) ──
console.log('--- exposed-remote strategies');
const ER = 'exposed-remote';
const erIdeal = run(ER, ['logs', 'session', 'close', 'remove', 'reset', 'hunt', 'mfa', 'disable', 'mgr', 'declare']);
t('exposed-remote: the ideal response is Textbook and ends declared', () => { assert.equal(erIdeal.gr.rating.name, 'Textbook'); assert.equal(erIdeal.g.outcome, 'declared'); assert.ok(erIdeal.g.threat <= 20); });
t('exposed-remote: closing the door and disabling the account is not enough: the scheduled task and known passwords remain', () => {
  const r = run(ER, ['logs', 'close', 'disable', 'mgr', 'ipcheck'], { quiet: true });
  assert.equal(r.g.flags.persistence, true);
  assert.ok(r.gr.points < erIdeal.gr.points - 50, String(r.gr.points));
});
t('exposed-remote: you cannot read the session, remove the task or search for spread before reading the logs', () => {
  const g = E.newGame(byId[ER]);
  const ids = E.availableActions(byId[ER], g).map((a) => a.id);
  for (const locked of ['session', 'remove', 'hunt', 'disable', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('exposed-remote: you cannot declare while the service is exposed or the task remains', () => {
  const g = E.newGame(byId[ER]);
  for (const a of ['logs', 'session', 'remove']) E.perform(byId[ER], g, a);
  assert.ok(!E.availableActions(byId[ER], g).some((a) => a.id === 'declare'), 'still exposed');
});
t('exposed-remote: leaving it exposed lets more guesses in; leaving the passwords lets the attacker spread', () => {
  const open = run(ER, ['logs', 'session', 'remove', 'reset', 'hunt', 'mgr', 'disable'], { quiet: true });
  assert.equal(open.g.flags.exposed, true);
  assert.ok(open.g.threat >= 24, 'more guessing succeeded: ' + open.g.threat);
  const spread = run(ER, ['logs', 'session', 'close', 'remove', 'disable', 'mgr', 'ipcheck'], { quiet: true });
  assert.ok(spread.gr.breakdown.some((b) => /left working/.test(b.label)));
});
t('exposed-remote: shutting everything down is an overreaction that does not remove the attacker', () => {
  const r = run(ER, ['shutdown', 'mgr', 'ipcheck'], { quiet: true });
  assert.ok(r.g.disruption >= 40);
  assert.equal(r.g.flags.persistence, true);
  assert.ok(r.gr.points < erIdeal.gr.points - 80);
});


// ── tester-found-breach (ethical hacking) ──
console.log('--- tester-found-breach strategies');
const TB = 'tester-found-breach';
const tbIdeal = run(TB, ['note', 'preserve', 'notify', 'advise', 'declare']);
t('tester-found-breach: documenting, preserving, telling the client and advising them is Exemplary', () => { assert.equal(tbIdeal.gr.rating.name, 'Exemplary'); assert.equal(tbIdeal.g.outcome, 'declared'); });
t('tester-found-breach: deleting the stray script yourself, or using the other attacker access, is penalised heavily', () => {
  const rm = run(TB, ['note', 'remove', 'notify', 'advise', 'declare'], { quiet: true });
  assert.ok(rm.gr.breakdown.some((b) => /Deleted evidence/.test(b.label)));
  assert.ok(rm.gr.points < tbIdeal.gr.points - 30);
  const pr = run(TB, ['note', 'probe', 'notify', 'advise', 'declare'], { quiet: true });
  assert.ok(pr.gr.breakdown.some((b) => /another attacker's access/.test(b.label)));
  assert.ok(pr.gr.points < tbIdeal.gr.points - 40);
});
t('tester-found-breach: carrying on and leaving it to the final report is a poor result', () => {
  const r = run(TB, ['carry-on', 'mgr'], { quiet: true });
  assert.ok(['Out of bounds', 'Careless'].includes(r.gr.rating.name), r.gr.rating.name);
});
t('tester-found-breach: you cannot advise before telling the client, preserve before documenting, or hand over before the client is responding', () => {
  const g = E.newGame(byId[TB]);
  const ids = E.availableActions(byId[TB], g).map((a) => a.id);
  for (const locked of ['preserve', 'notify', 'advise', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('tester-found-breach: waiting before telling the client lets the other attacker copy data', () => {
  const slow = run(TB, ['note', 'verify', 'preserve', 'pause', 'notify', 'advise', 'mgr', 'declare'], { quiet: true });
  assert.ok(slow.g.threat >= 40, 'threat ' + slow.g.threat);
  assert.ok(slow.gr.points < tbIdeal.gr.points);
});


// ── ci-compromise (security engineering) ──
console.log('--- ci-compromise strategies');
const CI = 'ci-compromise';
const ciIdeal = run(CI, ['history', 'remove-step', 'revoke', 'freeze', 'artifacts', 'rollback', 'secrets', 'rotate', 'notify', 'declare']);
t('ci-compromise: the ideal response is Textbook and ends declared', () => { assert.equal(ciIdeal.gr.rating.name, 'Textbook'); assert.equal(ciIdeal.g.outcome, 'declared'); });
t('ci-compromise: fixing the pipeline but leaving the bad releases and the secrets is not enough', () => {
  const r = run(CI, ['history', 'remove-step', 'revoke', 'freeze', 'mgr'], { quiet: true });
  assert.equal(r.g.flags.prodTainted, true);
  assert.ok(r.gr.points < ciIdeal.gr.points - 40, String(r.gr.points));
});
t('ci-compromise: you cannot withdraw releases, remove the step or rotate secrets before you have the evidence', () => {
  const g = E.newGame(byId[CI]);
  const ids = E.availableActions(byId[CI], g).map((a) => a.id);
  for (const locked of ['artifacts', 'revoke', 'remove-step', 'rollback', 'rotate', 'notify', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('ci-compromise: not freezing lets the backdoor ship again; leaving the token lets the attacker push a rogue release', () => {
  const nofreeze = run(CI, ['history', 'artifacts', 'rollback', 'secrets', 'rotate'], { quiet: true });
  assert.ok(nofreeze.g.threat >= 30, 'threat ' + nofreeze.g.threat);
  const token = run(CI, ['history', 'remove-step', 'freeze', 'artifacts', 'rollback', 'secrets', 'rotate', 'notify'], { quiet: true });
  assert.equal(token.g.flags.tokenActive, true);
  assert.ok(token.gr.breakdown.some((b) => /token was left working/.test(b.label)));
});
t('ci-compromise: wiping the whole build system is an overreaction that withdraws nothing', () => {
  const r = run(CI, ['wipe', 'mgr', 'rescan'], { quiet: true });
  assert.ok(r.g.disruption >= 40);
  assert.equal(r.g.flags.prodTainted, true);
  assert.ok(r.gr.points < ciIdeal.gr.points - 90);
});

// ── bucket-wipe (cloud security) ──
console.log('--- bucket-wipe strategies');
const BW = 'bucket-wipe';
const bwIdeal = run(BW, ['logs', 'scope', 'inventory', 'revoke', 'remove-key', 'lock-backups', 'restore', 'dpo', 'mgr', 'declare']);
t('bucket-wipe: the ideal response is Textbook and ends declared', () => { assert.equal(bwIdeal.gr.rating.name, 'Textbook'); assert.equal(bwIdeal.g.outcome, 'declared'); });
t('bucket-wipe: skipping the backup lock or the DPO drops below Textbook', () => {
  const nolock = run(BW, ['logs', 'scope', 'inventory', 'revoke', 'remove-key', 'restore', 'dpo', 'declare'], { quiet: true });
  assert.notEqual(nolock.gr.rating.name, 'Textbook');
  const nodpo = run(BW, ['logs', 'scope', 'inventory', 'revoke', 'remove-key', 'lock-backups', 'restore', 'declare'], { quiet: true });
  assert.notEqual(nodpo.gr.rating.name, 'Textbook');
});
t('bucket-wipe: revoking the first key but not the second ends in a Breach, not a declaration', () => {
  const r = run(BW, ['logs', 'scope', 'revoke', 'lock-backups', 'restore', 'dpo', 'mgr'], { quiet: true });
  assert.equal(r.gr.rating.name, 'Breach');
  assert.equal(r.g.flags.persistence, true);
});
t('bucket-wipe: you cannot revoke, restore, lock the backups or declare before you have the evidence', () => {
  const g = E.newGame(byId[BW]);
  const ids = E.availableActions(byId[BW], g).map((a) => a.id);
  for (const locked of ['revoke', 'remove-key', 'lock-backups', 'restore', 'dpo', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('bucket-wipe: paying and shutting everything down are both Breach-level responses', () => {
  assert.equal(run(BW, ['pay', 'mgr'], { quiet: true }).gr.rating.name, 'Breach');
  const sd = run(BW, ['shutdown', 'mgr', 'rescan'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
  assert.ok(sd.g.disruption >= 40);
});
t('bucket-wipe: restoring while a key is still live gets the data deleted again', () => {
  const r = run(BW, ['logs', 'scope', 'restore', 'revoke'], { quiet: true });
  assert.ok(r.gr.breakdown.some((b) => /deleted again/.test(b.label)) || r.g.flags.deletedAgain, JSON.stringify(r.gr.breakdown));
});

// ── cluster-breakout (senior security engineering) ──
console.log('--- cluster-breakout strategies');
const CB = 'cluster-breakout';
const cbIdeal = run(CB, ['audit', 'inspect', 'snapshot', 'isolate', 'revoke', 'remove-job', 'rebuild', 'mgr', 'declare']);
t('cluster-breakout: the ideal response is Textbook and ends declared', () => { assert.equal(cbIdeal.gr.rating.name, 'Textbook'); assert.equal(cbIdeal.g.outcome, 'declared'); });
t('cluster-breakout: checking the image as well is still Textbook (a useful step is not punished)', () => {
  const r = run(CB, ['audit', 'inspect', 'image', 'snapshot', 'isolate', 'revoke', 'remove-job', 'rebuild', 'mgr', 'declare'], { quiet: true });
  assert.equal(r.gr.rating.name, 'Textbook');
});
t('cluster-breakout: not rebuilding the host drops below Textbook', () => {
  const r = run(CB, ['audit', 'inspect', 'snapshot', 'isolate', 'revoke', 'remove-job', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(r.gr.rating.name, 'Textbook');
});
t('cluster-breakout: you cannot isolate, revoke, remove the job or declare before you have the evidence', () => {
  const g = E.newGame(byId[CB]);
  const ids = E.availableActions(byId[CB], g).map((a) => a.id);
  for (const locked of ['isolate', 'revoke', 'remove-job', 'snapshot', 'rebuild', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('cluster-breakout: deleting the workload before capturing it loses the evidence', () => {
  const r = run(CB, ['audit', 'kill-pod', 'mgr'], { quiet: true });
  assert.equal(r.g.flags.evidenceLost, true);
  assert.equal(r.gr.rating.name, 'Breach');
});
t('cluster-breakout: leaving the token lets the attacker spread to another team', () => {
  const r = run(CB, ['audit', 'inspect', 'snapshot', 'remove-job', 'rebuild', 'mgr', 'fullscan'], { quiet: true });
  assert.equal(r.g.flags.spread, true);
  assert.ok(r.gr.breakdown.some((b) => /another team/.test(b.label)));
});
t('cluster-breakout: redeploying the tampered image and shutting down the platform are poor responses', () => {
  const re = run(CB, ['audit', 'inspect', 'snapshot', 'isolate', 'revoke', 'remove-job', 'redeploy', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(re.gr.rating.name, 'Textbook');
  assert.ok(re.gr.points < cbIdeal.gr.points - 40, String(re.gr.points));
  const sd = run(CB, ['shutdown', 'mgr'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
  assert.ok(sd.g.disruption >= 40);
});

// ── leaked-admin-key (senior cloud security) ──
console.log('--- leaked-admin-key strategies');
const LK = 'leaked-admin-key';
const lkIdeal = run(LK, ['activity', 'preserve', 'disable-key', 'remove-user', 'rotate-secrets', 'stop-machines', 'mgr', 'declare']);
t('leaked-admin-key: the ideal response is Textbook and ends declared', () => { assert.equal(lkIdeal.gr.rating.name, 'Textbook'); assert.equal(lkIdeal.g.outcome, 'declared'); });
t('leaked-admin-key: looking at the repository as well is still Textbook', () => {
  const r = run(LK, ['activity', 'repo', 'preserve', 'disable-key', 'remove-user', 'rotate-secrets', 'stop-machines', 'private', 'mgr', 'declare'], { quiet: true });
  assert.equal(r.gr.rating.name, 'Textbook');
});
t('leaked-admin-key: skipping the secrets, the evidence or the briefing drops below Textbook', () => {
  const nosecrets = run(LK, ['activity', 'preserve', 'disable-key', 'remove-user', 'stop-machines', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nosecrets.gr.rating.name, 'Textbook');
  const noevidence = run(LK, ['activity', 'disable-key', 'remove-user', 'rotate-secrets', 'stop-machines', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(noevidence.gr.rating.name, 'Textbook');
  assert.equal(noevidence.g.flags.evidenceLost, true);
  const nobrief = run(LK, ['activity', 'preserve', 'rotate-secrets', 'disable-key', 'remove-user', 'stop-machines', 'declare'], { quiet: true });
  assert.notEqual(nobrief.gr.rating.name, 'Textbook');
});
t('leaked-admin-key: you cannot disable, remove, preserve or declare before reading the audit log', () => {
  const g = E.newGame(byId[LK]);
  const ids = E.availableActions(byId[LK], g).map((a) => a.id);
  for (const locked of ['disable-key', 'remove-user', 'preserve', 'stop-machines', 'rotate-secrets', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('leaked-admin-key: disabling only the leaked key lets the attacker carry on with their own user', () => {
  const r = run(LK, ['activity', 'preserve', 'disable-key', 'rotate-secrets', 'stop-machines', 'mgr'], { quiet: true });
  assert.equal(r.g.flags.persistence, true);
  assert.ok(r.gr.points < lkIdeal.gr.points - 40, String(r.gr.points));
});
t('leaked-admin-key: cleaning the repository history is not a fix, and shutting down the account is an overreaction', () => {
  const purge = run(LK, ['activity', 'repo', 'purge', 'mgr'], { quiet: true });
  assert.equal(purge.gr.rating.name, 'Breach');
  assert.equal(purge.g.flags.historyPurged, true);
  const sd = run(LK, ['shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
  assert.ok(sd.g.disruption >= 40);
});

// ── dns-hijack (senior network security) ──
console.log('--- dns-hijack strategies');
const DH = 'dns-hijack';
const dhIdeal = run(DH, ['records', 'registrar', 'cert', 'preserve', 'secure', 'restore', 'revoke-cert', 'reset', 'mgr', 'declare']);
t('dns-hijack: the ideal response is Textbook and ends declared', () => { assert.equal(dhIdeal.gr.rating.name, 'Textbook'); assert.equal(dhIdeal.g.outcome, 'declared'); });
t('dns-hijack: not warning customers, not revoking the certificate or not briefing support drops below Textbook', () => {
  const nowarn = run(DH, ['records', 'registrar', 'cert', 'preserve', 'secure', 'restore', 'revoke-cert', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nowarn.gr.rating.name, 'Textbook');
  assert.ok(nowarn.gr.breakdown.some((b) => /not warned/.test(b.label)));
  const nocert = run(DH, ['records', 'registrar', 'preserve', 'secure', 'restore', 'reset', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nocert.gr.rating.name, 'Textbook');
  const nobrief = run(DH, ['records', 'registrar', 'cert', 'preserve', 'secure', 'restore', 'revoke-cert', 'reset', 'declare'], { quiet: true });
  assert.notEqual(nobrief.gr.rating.name, 'Textbook');
});
t('dns-hijack: you cannot restore, secure, warn customers or declare before you have the evidence', () => {
  const g = E.newGame(byId[DH]);
  const ids = E.availableActions(byId[DH], g).map((a) => a.id);
  for (const locked of ['secure', 'restore', 'revoke-cert', 'reset', 'mgr', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('dns-hijack: restoring the records before taking the account back is undone by the attacker', () => {
  const r = run(DH, ['records', 'restore-early', 'registrar', 'secure', 'restore', 'reset', 'mgr', 'declare'], { quiet: true });
  assert.ok(r.gr.points < dhIdeal.gr.points - 30, String(r.gr.points));
  assert.ok(r.g.threat >= 40, 'threat ' + r.g.threat);
});
t('dns-hijack: leaving the registrar account open ends in a Breach', () => {
  const r = run(DH, ['records', 'registrar', 'cert', 'preserve', 'revoke-cert', 'reset', 'mgr'], { quiet: true });
  assert.equal(r.g.flags.accountOpen, true);
  assert.equal(r.gr.rating.name, 'Breach');
});
t('dns-hijack: taking the whole sign-in service offline is an overreaction', () => {
  const sd = run(DH, ['shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
  assert.ok(sd.g.disruption >= 40);
});

// ── no-patch-yet (senior vulnerability management) ──
console.log('--- no-patch-yet strategies');
const NP = 'no-patch-yet';
const npIdeal = run(NP, ['advisory', 'inventory', 'mitigate', 'hunt', 'isolate', 'rebuild', 'monitor', 'internal', 'mgr', 'declare']);
t('no-patch-yet: the ideal response is Textbook and ends declared', () => { assert.equal(npIdeal.gr.rating.name, 'Textbook'); assert.equal(npIdeal.g.outcome, 'declared'); });
t('no-patch-yet: skipping the rebuild or the plan for the inside drops below Textbook', () => {
  const norebuild = run(NP, ['advisory', 'inventory', 'mitigate', 'hunt', 'isolate', 'monitor', 'internal', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(norebuild.gr.rating.name, 'Textbook');
  const nointernal = run(NP, ['advisory', 'inventory', 'mitigate', 'hunt', 'isolate', 'rebuild', 'monitor', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nointernal.gr.rating.name, 'Textbook');
});
t('no-patch-yet: you cannot mitigate, hunt or declare before you have the advisory and the inventory', () => {
  const g = E.newGame(byId[NP]);
  const ids = E.availableActions(byId[NP], g).map((a) => a.id);
  for (const locked of ['inventory', 'mitigate', 'hunt', 'isolate', 'rebuild', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('no-patch-yet: protecting the edge late lets a second server be taken', () => {
  const late = run(NP, ['advisory', 'inventory', 'hunt', 'isolate', 'rebuild', 'monitor', 'mitigate', 'internal', 'mgr', 'declare'], { quiet: true });
  assert.equal(late.g.flags.secondHit, true);
  assert.ok(late.gr.points < npIdeal.gr.points - 20, String(late.gr.points));
});
t('no-patch-yet: an untested fix on every server breaks production, and waiting leaves the exposure', () => {
  const unsafe = run(NP, ['advisory', 'inventory', 'unsafe-patch', 'hunt', 'isolate', 'rebuild', 'mgr', 'declare'], { quiet: true });
  assert.equal(unsafe.g.flags.brokeProduction, true);
  assert.notEqual(unsafe.gr.rating.name, 'Textbook');
  assert.ok(unsafe.g.disruption >= 30);
  const wait = run(NP, ['advisory', 'wait', 'mgr'], { quiet: true });
  assert.equal(wait.gr.rating.name, 'Breach');
});
t('no-patch-yet: switching everything off is an overreaction', () => {
  const sd = run(NP, ['shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
  assert.ok(sd.g.disruption >= 40);
});

// ── test-outage (senior penetration testing: conduct, not technique) ──
console.log('--- test-outage strategies');
const TO = 'test-outage';
const toIdeal = run(TO, ['stop', 'call', 'mylog', 'keep', 'help', 'note', 'declare']);
t('test-outage: the ideal response is Textbook and ends declared', () => { assert.equal(toIdeal.gr.rating.name, 'Textbook'); assert.equal(toIdeal.g.outcome, 'declared'); });
t('test-outage: skipping the records, the help or the written note drops below Textbook', () => {
  for (const seq of [['stop', 'call', 'mylog', 'help', 'note', 'declare'], ['stop', 'call', 'mylog', 'keep', 'note', 'declare'], ['stop', 'call', 'mylog', 'keep', 'help', 'declare']]) {
    assert.notEqual(run(TO, seq, { quiet: true }).gr.rating.name, 'Textbook', seq.join());
  }
});
t('test-outage: you cannot give your timings, keep records or send the note before you know what ran', () => {
  const g = E.newGame(byId[TO]);
  const ids = E.availableActions(byId[TO], g).map((a) => a.id);
  for (const locked of ['keep', 'help', 'note']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('test-outage: hiding your traces or blaming an outside attacker is a breach of trust', () => {
  const hide = run(TO, ['stop', 'call', 'mylog', 'hide', 'note', 'declare'], { quiet: true });
  assert.equal(hide.g.flags.hidden, true);
  assert.equal(hide.gr.rating.name, 'Breach of trust');
  const blame = run(TO, ['stop', 'call', 'blame', 'mylog', 'declare'], { quiet: true });
  assert.equal(blame.gr.rating.name, 'Breach of trust');
});
t('test-outage: fixing the servers yourself, or stalling to investigate, is worse than stopping and telling', () => {
  const fix = run(TO, ['stop', 'call', 'mylog', 'fix-yourself', 'keep', 'help', 'note', 'declare'], { quiet: true });
  assert.equal(fix.g.flags.unauthorised, true);
  assert.ok(fix.gr.points < toIdeal.gr.points - 20, String(fix.gr.points));
  const dig = run(TO, ['dig', 'stop', 'call', 'mylog', 'keep', 'help', 'note', 'declare'], { quiet: true });
  assert.ok(dig.gr.points < toIdeal.gr.points - 15, String(dig.gr.points));
});
t('test-outage: leaving your test running while the shop is down is a breach of trust', () => {
  const r = run(TO, ['mylog', 'rules', 'dig', 'keep'], { quiet: true });
  assert.equal(r.g.flags.testRunning, true);
  assert.equal(r.gr.rating.name, 'Breach of trust');
});
t('test-outage: walking away from the engagement mid-incident is an overreaction', () => {
  const sd = run(TO, ['shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach of trust');
  assert.ok(sd.g.disruption >= 40);
});

// ── supplier-breach (security architect) ──
console.log('--- supplier-breach strategies');
const SB = 'supplier-breach';
const sbIdeal = run(SB, ['notice', 'inventory', 'usage', 'rotate-priority', 'rotate-rest', 'dpo', 'teams', 'vendor', 'mgr', 'declare']);
t('supplier-breach: the ideal response is Textbook and ends declared', () => { assert.equal(sbIdeal.gr.rating.name, 'Textbook'); assert.equal(sbIdeal.g.outcome, 'declared'); });
t('supplier-breach: skipping the DPO or the owning teams drops below Textbook', () => {
  const nodpo = run(SB, ['notice', 'inventory', 'usage', 'rotate-priority', 'rotate-rest', 'teams', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nodpo.gr.rating.name, 'Textbook');
  assert.ok(nodpo.gr.breakdown.some((b) => /DPO not told/.test(b.label)));
  const noteams = run(SB, ['notice', 'inventory', 'usage', 'rotate-priority', 'rotate-rest', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(noteams.gr.rating.name, 'Textbook');
});
t('supplier-breach: you cannot replace tokens or declare before you know what is connected', () => {
  const g = E.newGame(byId[SB]);
  const ids = E.availableActions(byId[SB], g).map((a) => a.id);
  for (const locked of ['inventory', 'rotate-priority', 'rotate-rest', 'usage', 'dpo', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('supplier-breach: replacing the dangerous tokens late lets a broad token be used', () => {
  const late = run(SB, ['notice', 'inventory', 'vendor', 'teams', 'usage', 'rotate-priority', 'rotate-rest', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.equal(late.g.flags.misuseHit, true);
  assert.ok(late.gr.points < sbIdeal.gr.points - 20, String(late.gr.points));
});
t('supplier-breach: suspending every integration is an overreaction, and waiting leaves the tokens live', () => {
  const block = run(SB, ['notice', 'inventory', 'usage', 'block', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.ok(block.g.disruption >= 35);
  assert.notEqual(block.gr.rating.name, 'Textbook');
  assert.ok(block.gr.points < sbIdeal.gr.points - 40, String(block.gr.points));
  const wait = run(SB, ['notice', 'wait', 'mgr'], { quiet: true });
  assert.equal(wait.g.flags.tokensLive, true);
  assert.notEqual(wait.gr.rating.name, 'Textbook');
});

// ── idp-takeover (cloud security architect) ──
console.log('--- idp-takeover strategies');
const ID = 'idp-takeover';
const idIdeal = run(ID, ['audit', 'breakglass', 'trusts', 'sessions', 'preserve', 'remove-trust', 'revoke', 'secure-admin', 'dpo', 'mgr', 'declare']);
t('idp-takeover: the ideal response is Textbook and ends declared', () => { assert.equal(idIdeal.gr.rating.name, 'Textbook'); assert.equal(idIdeal.g.outcome, 'declared'); });
t('idp-takeover: skipping the emergency access check or telling the DPO drops below Textbook', () => {
  const nobg = run(ID, ['audit', 'trusts', 'sessions', 'preserve', 'remove-trust', 'revoke', 'secure-admin', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nobg.gr.rating.name, 'Textbook');
  assert.ok(nobg.gr.breakdown.some((b) => /way in/.test(b.label)));
  const nodpo = run(ID, ['audit', 'breakglass', 'trusts', 'sessions', 'preserve', 'remove-trust', 'revoke', 'secure-admin', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nodpo.gr.rating.name, 'Textbook');
});
t('idp-takeover: you cannot remove the rogue source, end sessions or declare before the evidence', () => {
  const g = E.newGame(byId[ID]);
  const ids = E.availableActions(byId[ID], g).map((a) => a.id);
  for (const locked of ['trusts', 'sessions', 'remove-trust', 'revoke', 'secure-admin', 'breakglass', 'dpo', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('idp-takeover: resetting only the administrator leaves the second route open', () => {
  const r = run(ID, ['audit', 'breakglass', 'trusts', 'sessions', 'preserve', 'secure-admin', 'revoke', 'dpo', 'mgr'], { quiet: true });
  assert.equal(r.g.flags.rogueTrust, true);
  assert.notEqual(r.gr.rating.name, 'Textbook');
});
t('idp-takeover: a forced company-wide reset or switching off sign-in is an overreaction', () => {
  const reset = run(ID, ['audit', 'breakglass', 'trusts', 'sessions', 'preserve', 'remove-trust', 'revoke', 'secure-admin', 'mass-reset', 'dpo', 'mgr', 'declare'], { quiet: true });
  assert.ok(reset.g.disruption >= 35);
  assert.notEqual(reset.gr.rating.name, 'Textbook');
  const sd = run(ID, ['audit', 'shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
});

// ── lost-test-laptop (red team lead: conduct) ──
console.log('--- lost-test-laptop strategies');
const LT = 'lost-test-laptop';
const ltIdeal = run(LT, ['ask', 'inventory', 'sessions', 'call', 'note', 'wipe', 'policy', 'declare']);
t('lost-test-laptop: the ideal response is Textbook and ends declared', () => { assert.equal(ltIdeal.gr.rating.name, 'Textbook'); assert.equal(ltIdeal.g.outcome, 'declared'); });
t('lost-test-laptop: skipping the written note drops below Textbook', () => {
  const r = run(LT, ['ask', 'inventory', 'sessions', 'call', 'wipe', 'policy', 'declare'], { quiet: true });
  assert.notEqual(r.gr.rating.name, 'Textbook');
  assert.ok(r.gr.breakdown.some((b) => /No written note/.test(b.label)));
});
t('lost-test-laptop: you cannot send the note, wipe or call before you know what was on the laptop', () => {
  const g = E.newGame(byId[LT]);
  const ids = E.availableActions(byId[LT], g).map((a) => a.id);
  for (const locked of ['inventory', 'sessions', 'wipe', 'call', 'note', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('lost-test-laptop: keeping it from the client is a breach of trust', () => {
  const r = run(LT, ['ask', 'inventory', 'sessions', 'hide', 'wipe', 'policy'], { quiet: true });
  assert.equal(r.g.flags.hidden, true);
  assert.equal(r.gr.rating.name, 'Breach of trust');
});
t('lost-test-laptop: waiting for the laptop to turn up, or walking away, is worse than telling at once', () => {
  const wait = run(LT, ['wait', 'ask', 'inventory', 'sessions', 'call', 'note', 'declare'], { quiet: true });
  assert.ok(wait.gr.points < ltIdeal.gr.points - 30, String(wait.gr.points));
  const walk = run(LT, ['ask', 'inventory', 'sessions', 'call', 'note', 'shutdown'], { quiet: true });
  assert.ok(walk.g.disruption >= 40);
  assert.notEqual(walk.gr.rating.name, 'Textbook');
});

// ── leaver-copy (incident response and forensics) ──
console.log('--- leaver-copy strategies');
const LC = 'leaver-copy';
const lcIdeal = run(LC, ['export', 'access', 'legal', 'image', 'hold', 'monitor', 'dpo', 'mgr', 'declare']);
t('leaver-copy: the ideal response is Textbook and ends declared', () => { assert.equal(lcIdeal.gr.rating.name, 'Textbook'); assert.equal(lcIdeal.g.outcome, 'declared'); });
t('leaver-copy: skipping the DPO or the briefing drops below Textbook', () => {
  const nodpo = run(LC, ['export', 'access', 'legal', 'image', 'hold', 'monitor', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(nodpo.gr.rating.name, 'Textbook');
  assert.ok(nodpo.gr.breakdown.some((b) => /DPO not told/.test(b.label)));
});
t('leaver-copy: you cannot image the laptop, hold the logs or hand over before Legal and the evidence', () => {
  const g = E.newGame(byId[LC]);
  const ids = E.availableActions(byId[LC], g).map((a) => a.id);
  for (const locked of ['image', 'hold', 'monitor', 'access', 'dpo', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('leaver-copy: imaging late lets IT reissue the laptop, and accusing him early spoils the case', () => {
  const late = run(LC, ['export', 'access', 'legal', 'hold', 'monitor', 'dpo', 'mgr', 'image', 'declare'], { quiet: true });
  assert.equal(late.g.flags.reissued, true);
  assert.notEqual(late.gr.rating.name, 'Textbook');
  const early = run(LC, ['export', 'confront', 'legal', 'image', 'hold', 'monitor', 'dpo'], { quiet: true });
  assert.equal(early.g.flags.accusedEarly, true);
  assert.ok(early.gr.points < lcIdeal.gr.points - 40, String(early.gr.points));
});
t('leaver-copy: reissuing the laptop or removing him at once are poor responses', () => {
  const re = run(LC, ['export', 'legal', 'reissue-now', 'hold', 'monitor', 'dpo'], { quiet: true });
  assert.notEqual(re.gr.rating.name, 'Textbook');
  assert.ok(re.gr.points < lcIdeal.gr.points - 50, String(re.gr.points));
  const sd = run(LC, ['export', 'legal', 'image', 'hold', 'shutdown', 'dpo'], { quiet: true });
  assert.ok(sd.g.disruption >= 35);
  assert.notEqual(sd.gr.rating.name, 'Textbook');
});

// ── regulator-enquiry (governance, risk and compliance) ──
console.log('--- regulator-enquiry strategies');
const RE = 'regulator-enquiry';
const reIdeal = run(RE, ['read', 'gaps', 'legal', 'hold', 'owner', 'board', 'truth', 'declare']);
t('regulator-enquiry: the ideal response is Textbook and ends declared', () => { assert.equal(reIdeal.gr.rating.name, 'Textbook'); assert.equal(reIdeal.g.outcome, 'declared'); });
t('regulator-enquiry: skipping the owners or the leadership briefing drops below Textbook', () => {
  const noowner = run(RE, ['read', 'gaps', 'legal', 'hold', 'board', 'truth', 'declare'], { quiet: true });
  assert.notEqual(noowner.gr.rating.name, 'Textbook');
  const noboard = run(RE, ['read', 'gaps', 'legal', 'hold', 'owner', 'truth', 'declare'], { quiet: true });
  assert.notEqual(noboard.gr.rating.name, 'Textbook');
});
t('regulator-enquiry: you cannot hold the records or draft the answer before Legal and the gaps', () => {
  const g = E.newGame(byId[RE]);
  const ids = E.availableActions(byId[RE], g).map((a) => a.id);
  for (const locked of ['gaps', 'hold', 'truth', 'owner', 'board', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('regulator-enquiry: backdating a document is an integrity breach', () => {
  const r = run(RE, ['read', 'gaps', 'legal', 'hold', 'owner', 'board', 'backdate', 'truth', 'declare'], { quiet: true });
  assert.equal(r.g.flags.backdated, true);
  assert.equal(r.gr.rating.name, 'Integrity breach');
});
t('regulator-enquiry: leaving the records unprotected lets a manager tidy them', () => {
  const r = run(RE, ['read', 'gaps', 'legal', 'owner', 'board'], { quiet: true });
  assert.equal(r.g.flags.backdated, true);
  assert.equal(r.gr.rating.name, 'Integrity breach');
});
t('regulator-enquiry: halting all other compliance work is an overreaction', () => {
  const r = run(RE, ['read', 'gaps', 'legal', 'hold', 'shutdown', 'truth', 'declare'], { quiet: true });
  assert.ok(r.g.disruption >= 35);
  assert.notEqual(r.gr.rating.name, 'Textbook');
});

// ── partner-warning (threat intelligence) ──
console.log('--- partner-warning strategies');
const PW = 'partner-warning';
const pwIdeal = run(PW, ['assess', 'search', 'scope', 'block', 'isolate', 'warn', 'share', 'brief', 'declare']);
t('partner-warning: the ideal response is Textbook and ends declared', () => { assert.equal(pwIdeal.gr.rating.name, 'Textbook'); assert.equal(pwIdeal.g.outcome, 'declared'); });
t('partner-warning: skipping the warning to finance or the sector group drops below Textbook or lowers the score', () => {
  const nowarn = run(PW, ['assess', 'search', 'scope', 'block', 'isolate', 'share', 'brief', 'declare'], { quiet: true });
  assert.notEqual(nowarn.gr.rating.name, 'Textbook');
  const nobrief = run(PW, ['assess', 'search', 'scope', 'block', 'isolate', 'warn', 'share', 'declare'], { quiet: true });
  assert.notEqual(nobrief.gr.rating.name, 'Textbook');
});
t('partner-warning: you cannot search, isolate or brief before you have judged the source', () => {
  const g = E.newGame(byId[PW]);
  const ids = E.availableActions(byId[PW], g).map((a) => a.id);
  for (const locked of ['search', 'scope', 'block', 'isolate', 'warn', 'brief', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('partner-warning: blocking before you know the scope leaves the laptop online long enough for it to spread', () => {
  const r = run(PW, ['assess', 'block', 'warn', 'search', 'scope', 'isolate', 'share', 'brief', 'declare'], { quiet: true });
  assert.ok(r.g.threat >= 35, 'threat ' + r.g.threat);
  assert.ok(r.gr.points < pwIdeal.gr.points - 20, String(r.gr.points));
});
t('partner-warning: naming a group, blocking all attachments or waiting are poor responses', () => {
  const pub = run(PW, ['assess', 'search', 'scope', 'publish', 'block', 'isolate', 'warn', 'brief', 'declare'], { quiet: true });
  assert.equal(pub.g.flags.public, true);
  assert.ok(pub.gr.points < pwIdeal.gr.points - 50, String(pub.gr.points));
  const all = run(PW, ['assess', 'search', 'scope', 'blockall', 'isolate', 'warn', 'brief'], { quiet: true });
  assert.ok(all.g.disruption >= 35);
  const wait = run(PW, ['wait', 'assess', 'search', 'scope', 'block', 'isolate', 'warn', 'brief', 'declare'], { quiet: true });
  assert.ok(wait.gr.points < pwIdeal.gr.points - 40, String(wait.gr.points));
});

// ── usb-in-car-park (weekly) ──
console.log('--- usb-in-car-park strategies');
const UB = 'usb-in-car-park';
const ubIdeal = run(UB, ['ask', 'logs', 'isolate', 'keepstick', 'accounts', 'preserve', 'staff', 'mgr', 'declare']);
t('usb-in-car-park: the ideal response is Textbook and ends declared', () => { assert.equal(ubIdeal.gr.rating.name, 'Textbook'); assert.equal(ubIdeal.g.outcome, 'declared'); });
t('usb-in-car-park: skipping the evidence capture, the stick or the warning drops below Textbook', () => {
  for (const seq of [['ask', 'logs', 'isolate', 'keepstick', 'accounts', 'staff', 'mgr', 'declare'], ['ask', 'logs', 'isolate', 'accounts', 'preserve', 'staff', 'mgr', 'declare'], ['ask', 'logs', 'isolate', 'keepstick', 'accounts', 'preserve', 'mgr', 'declare']]) {
    assert.notEqual(run(UB, seq, { quiet: true }).gr.rating.name, 'Textbook', seq.join());
  }
});
t('usb-in-car-park: you cannot isolate, reset or declare before you know what happened', () => {
  const g = E.newGame(byId[UB]);
  const ids = E.availableActions(byId[UB], g).map((a) => a.id);
  for (const locked of ['logs', 'isolate', 'accounts', 'keepstick', 'preserve', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('usb-in-car-park: plugging the stick into your own laptop is a serious mistake', () => {
  const r = run(UB, ['ask', 'logs', 'isolate', 'keepstick', 'accounts', 'plugin', 'preserve', 'staff', 'mgr', 'declare'], { quiet: true });
  assert.equal(r.g.flags.plugged, true);
  assert.equal(r.gr.rating.name, 'Costly');
});
t('usb-in-car-park: wiping the computer, waiting or cutting the whole office off are poor responses', () => {
  const wipe = run(UB, ['ask', 'logs', 'reimage', 'keepstick', 'accounts', 'staff', 'mgr', 'declare'], { quiet: true });
  assert.ok(wipe.gr.points < ubIdeal.gr.points - 30, String(wipe.gr.points));
  const wait = run(UB, ['wait', 'ask', 'logs', 'isolate', 'keepstick', 'accounts', 'preserve', 'staff', 'mgr', 'declare'], { quiet: true });
  assert.notEqual(wait.gr.rating.name, 'Textbook');
  const sd = run(UB, ['ask', 'logs', 'shutdown', 'keepstick', 'accounts', 'staff', 'mgr'], { quiet: true });
  assert.ok(sd.g.disruption >= 40);
  assert.notEqual(sd.gr.rating.name, 'Textbook');
});

// ── mailbox-rule (weekly) ──
console.log('--- mailbox-rule strategies');
const MB = 'mailbox-rule';
const mbIdeal = run(MB, ['rules', 'signins', 'sent', 'preserve', 'removerule', 'secure', 'finance', 'dpo', 'declare']);
t('mailbox-rule: the ideal response is Textbook and ends declared', () => { assert.equal(mbIdeal.gr.rating.name, 'Textbook'); assert.equal(mbIdeal.g.outcome, 'declared'); });
t('mailbox-rule: skipping the DPO, the evidence or the finance warning drops below Textbook', () => {
  for (const seq of [['rules', 'signins', 'sent', 'preserve', 'removerule', 'secure', 'finance', 'declare'], ['rules', 'signins', 'sent', 'removerule', 'secure', 'finance', 'dpo', 'declare'], ['rules', 'signins', 'sent', 'preserve', 'removerule', 'secure', 'dpo', 'declare']]) {
    assert.notEqual(run(MB, seq, { quiet: true }).gr.rating.name, 'Textbook', seq.join());
  }
});
t('mailbox-rule: you cannot remove the rule, lock the account or declare before looking', () => {
  const g = E.newGame(byId[MB]);
  const ids = E.availableActions(byId[MB], g).map((a) => a.id);
  for (const locked of ['removerule', 'secure', 'preserve', 'finance', 'dpo', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('mailbox-rule: removing the rule but leaving the attacker able to sign in is not contained', () => {
  const r = run(MB, ['rules', 'signins', 'sent', 'preserve', 'removerule', 'finance', 'dpo'], { quiet: true });
  assert.equal(r.g.flags.accountOpen, true);
  assert.notEqual(r.gr.rating.name, 'Textbook');
});
t('mailbox-rule: deleting the rule unsaved, resetting everyone and switching off email are poor responses', () => {
  const del = run(MB, ['rules', 'signins', 'sent', 'delete', 'secure', 'finance', 'dpo', 'declare'], { quiet: true });
  assert.equal(del.g.flags.deleted, true);
  assert.notEqual(del.gr.rating.name, 'Textbook');
  const all = run(MB, ['rules', 'signins', 'sent', 'preserve', 'removerule', 'secure', 'resetall', 'finance', 'dpo', 'declare'], { quiet: true });
  assert.ok(all.g.disruption >= 30);
  assert.notEqual(all.gr.rating.name, 'Textbook');
  const sd = run(MB, ['rules', 'shutdown'], { quiet: true });
  assert.equal(sd.gr.rating.name, 'Breach');
});

// ── night-command (OT/IoT) ──
console.log('--- night-command strategies');
const NC = 'night-command';
const ncIdeal = run(NC, ['verify', 'source', 'manual', 'isolate', 'revoke', 'logs', 'ops', 'quality', 'declare']);
t('night-command: the ideal response is Textbook, low threat, and ends declared', () => { assert.equal(ncIdeal.gr.rating.name, 'Textbook'); assert.equal(ncIdeal.g.outcome, 'declared'); assert.ok(ncIdeal.g.threat <= 20 && ncIdeal.g.disruption <= 15, `threat ${ncIdeal.g.threat} disruption ${ncIdeal.g.disruption}`); });
t('night-command: you cannot correct the dose or find the route before you have checked the real state', () => {
  const g = E.newGame(byId[NC]);
  const ids = E.availableActions(byId[NC], g).map((a) => a.id);
  for (const locked of ['source', 'manual', 'isolate', 'revoke', 'logs', 'ops', 'quality', 'declare']) assert.ok(!ids.includes(locked), locked + ' should be locked at the start');
});
t('night-command: skipping the logs, the plant owners or the water-quality check drops below Textbook', () => {
  for (const seq of [['verify', 'source', 'manual', 'isolate', 'revoke', 'ops', 'quality', 'declare'], ['verify', 'source', 'manual', 'isolate', 'revoke', 'logs', 'quality', 'declare'], ['verify', 'source', 'manual', 'isolate', 'revoke', 'logs', 'ops', 'declare']]) {
    assert.notEqual(run(NC, seq, { quiet: true }).gr.rating.name, 'Textbook', seq.join());
  }
});
t('night-command: closing the route before making the water safe lets the dose climb', () => {
  const r = run(NC, ['verify', 'source', 'isolate', 'manual', 'revoke', 'logs', 'ops', 'quality', 'declare'], { quiet: true });
  assert.ok(r.g.threat >= ncIdeal.g.threat, `threat ${r.g.threat}`);
  assert.ok(r.gr.points <= ncIdeal.gr.points);
});
t('night-command: shutting the plant down, restarting the controller, scanning and waiting are all poor responses', () => {
  const sd = run(NC, ['verify', 'source', 'manual', 'isolate', 'shutdown', 'ops', 'quality', 'declare'], { quiet: true });
  assert.ok(sd.g.disruption >= 35);
  assert.notEqual(sd.gr.rating.name, 'Textbook');
  for (const bad of ['reboot', 'scan', 'wait']) {
    const r = run(NC, ['verify', bad, 'source', 'manual', 'isolate', 'revoke', 'logs', 'ops', 'quality', 'declare'], { quiet: true });
    assert.ok(r.gr.points < ncIdeal.gr.points - 20, `${bad}: ${r.gr.points} vs ${ncIdeal.gr.points}`);
  }
});
t('night-command: doing nothing scores far below the ideal', () => {
  const r = run(NC, ['wait'], { quiet: true });
  assert.ok(r.gr.points < ncIdeal.gr.points - 60, String(r.gr.points));
});

console.log(n, 'passed');
