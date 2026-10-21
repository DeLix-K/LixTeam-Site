import { fileURLToPath as __fileURLToPath } from 'node:url';
const GAMES = __fileURLToPath(new URL('../../public/games/', import.meta.url)).replace(/\\/g, '/');
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const E = await import(pathToFileURL(GAMES + 'workspace/engine.js').href);
const P = await import(pathToFileURL(GAMES + 'workspace/pt.js').href);
const { PT_LAB: S } = await import(pathToFileURL(GAMES + 'workspace/scenarios/pt-lab.js').href);

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
const has = (st, id) => E.visibleEvents(S, st).some((e) => e.id === id);
const GOOD = {
  priority: 'backup',
  immediate: ['backup', 'prior'],
  gateway: 'leave',
  limits: ['gateway', 'printer', 'time', 'scope'],
  summary: 'I tested the five listed systems inside the rules, found five real problems, told you about the exposed backup and the earlier break-in at once, and left the payment gateway alone.',
};

// The best run: stay in scope, gentle on the printer, proportionate checks, tell them, five well-evidenced findings.
function best() {
  const st = E.newRun(S);
  for (const h of ['portal', 'files', 'intranet', 'jump']) assert.equal(E.ptScan(S, st, h, 'fast').ok, true, h);
  assert.equal(E.ptScan(S, st, 'printer', 'gentle').ok, true);
  for (const nid of ['p-home', 'p-admin', 'f-index', 'f-backup', 'i-wiki', 'i-audit', 'j-banner', 'pr-panel']) assert.equal(E.ptBrowse(S, st, nid).ok, true, nid);
  for (const [h, c] of [['portal', 'default'], ['files', 'headonly'], ['intranet', 'advisory'], ['jump', 'auth'], ['printer', 'defaults']]) assert.equal(E.ptCheck(S, st, h, c).ok, true, c);
  E.ptAsk(S, st, 'portal');
  assert.equal(E.ptNotify(S, st, 'pii').valid, true);
  assert.equal(E.ptNotify(S, st, 'prior').valid, true);
  const fin = (vuln, severity, impact, fix) => assert.equal(E.ptFinding(S, st, { vuln, severity, impact, fix, evidence: S.pt.truths.find((x) => x.id === vuln).requires }).ok, true, vuln);
  fin('T1', 'high', 'admin-takeover', 'change-restrict');
  fin('T2', 'critical', 'data-breach', 'remove-rotate');
  fin('T3', 'medium', 'internal-compromise', 'patch');
  fin('T4', 'high', 'stolen-password', 'mfa-keys');
  fin('T5', 'low', 'contacts', 'settings');
  return st;
}

t('the scenario passes the engine validator', () => {
  assert.deepEqual(E.problems(S), []);
});
t('the lab starts with five listed hosts and one hidden one', () => {
  const st = E.newRun(S);
  assert.equal(P.discovered(S, st).length, 5);
  assert.equal(P.discovered(S, st).some((h) => h.id === 'pay-gw'), false);
});
t('the payment gateway only appears after the checkout page is opened', () => {
  const st = E.newRun(S);
  E.ptScan(S, st, 'portal', 'gentle');
  E.ptBrowse(S, st, 'p-home');
  assert.equal(P.discovered(S, st).some((h) => h.id === 'pay-gw'), false);
  E.ptBrowse(S, st, 'p-checkout');
  assert.equal(P.discovered(S, st).some((h) => h.id === 'pay-gw'), true);
});
t('pages cannot be opened until the host is scanned or a page links to them', () => {
  const st = E.newRun(S);
  assert.equal(E.ptBrowse(S, st, 'p-home').ok, false);
  E.ptScan(S, st, 'portal', 'gentle');
  assert.equal(E.ptBrowse(S, st, 'p-admin').ok, false, 'admin page is only linked from home');
  assert.equal(E.ptBrowse(S, st, 'p-home').ok, true);
  assert.equal(E.ptBrowse(S, st, 'p-admin').ok, true);
});
t('checks need a scan first and are only counted once', () => {
  const st = E.newRun(S);
  assert.equal(E.ptCheck(S, st, 'portal', 'default').ok, false);
  E.ptScan(S, st, 'portal', 'gentle');
  const c = st.clock;
  assert.equal(E.ptCheck(S, st, 'portal', 'default').ok, true);
  const after = st.clock;
  assert.ok(after > c);
  assert.equal(E.ptCheck(S, st, 'portal', 'default').again, true);
  assert.equal(st.clock, after, 'repeat costs nothing');
  assert.equal(P.hasEvidence(st, 'ev-default-cred'), true);
});
t('a gentle scan takes longer than a fast one', () => {
  const a = E.newRun(S);
  const b = E.newRun(S);
  E.ptScan(S, a, 'jump', 'gentle');
  E.ptScan(S, b, 'jump', 'fast');
  assert.ok(a.clock > b.clock);
});
t('a fast scan crashes the fragile printer, which the client notices later', () => {
  const st = E.newRun(S);
  const r = E.ptScan(S, st, 'printer', 'fast');
  assert.equal(r.crashed, true);
  assert.equal(st.pt.crashed.includes('printer'), true);
  assert.equal(E.ptBrowse(S, st, 'pr-panel').ok, false, 'a crashed printer does not answer');
  E.advance(st, 200, 'wait');
  assert.equal(has(st, 'e-printer-down'), true);
});
t('a gentle scan of the printer is safe', () => {
  const st = E.newRun(S);
  assert.equal(E.ptScan(S, st, 'printer', 'gentle').crashed, undefined);
  E.advance(st, 200, 'wait');
  assert.equal(has(st, 'e-printer-down'), false);
});
t('scanning the out-of-scope gateway is a breach, with a consequence', () => {
  const st = E.newRun(S);
  E.ptScan(S, st, 'portal', 'gentle');
  E.ptBrowse(S, st, 'p-home');
  E.ptBrowse(S, st, 'p-checkout');
  const r = E.ptScan(S, st, 'pay-gw', 'gentle');
  assert.equal(r.violation, 'scope');
  assert.equal(st.pt.violations.length, 1);
  E.advance(st, 240, 'wait');
  assert.equal(has(st, 'e-pay-call'), true);
});
t('asking the client about the gateway is free of consequences and earns the credit', () => {
  const st = best();
  E.ptBrowse(S, st, 'p-checkout');
  const r = E.ptAsk(S, st, 'pay-gw');
  assert.match(r.text, /no/i);
  const g = E.grade(S, st, GOOD);
  const line = g.lines.find((l) => /Asked the client about the host/.test(l.label));
  assert.ok(line && line.points > 0);
});
t('failing to ask about the unlisted gateway costs conduct points', () => {
  const st = best();
  E.ptBrowse(S, st, 'p-checkout');
  const g = E.grade(S, st, GOOD);
  assert.equal(g.lines.find((l) => /Did not ask about the host/.test(l.label)).points, 0);
});
t('prohibited checks are logged as violations with their own consequence', () => {
  const st = E.newRun(S);
  E.ptScan(S, st, 'portal', 'gentle');
  const r = E.ptCheck(S, st, 'portal', 'guess');
  assert.equal(r.violation, 'brute');
  E.ptScan(S, st, 'jump', 'gentle');
  assert.equal(E.ptCheck(S, st, 'jump', 'flood').violation, 'dos');
  E.advance(st, 240, 'wait');
  assert.equal(has(st, 'e-lock'), true);
  assert.equal(has(st, 'e-slow'), true);
});
t('opening the backup is a data breach; seeing the listing is not', () => {
  const st = E.newRun(S);
  E.ptScan(S, st, 'files', 'gentle');
  E.ptBrowse(S, st, 'f-index');
  E.ptBrowse(S, st, 'f-backup');
  assert.equal(st.pt.violations.length, 0);
  assert.equal(st.pt.triggers.includes('pii'), true);
  const r = E.ptBrowse(S, st, 'f-file');
  assert.equal(r.violation, 'data');
  E.advance(st, 240, 'wait');
  assert.equal(has(st, 'e-data-dpo'), true);
});
t('telling the client only counts when there was something to tell', () => {
  const st = E.newRun(S);
  assert.equal(E.ptNotify(S, st, 'pii').valid, false);
  assert.equal(E.ptNotify(S, st, 'pii').ok, false, 'cannot tell them twice');
  assert.equal(E.ptNotify(S, st, 'gateway').valid, false, 'a fake topic is never valid');
});
t('no consequences arrive for a clean run', () => {
  const st = best();
  E.advance(st, 300, 'wait');
  for (const id of ['e-pay-call', 'e-data-dpo', 'e-lock', 'e-slow', 'e-printer-down']) assert.equal(has(st, id), false, id);
});
t('the best run is gold, with a high score', () => {
  const st = best();
  E.submit(st);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.total >= 95, `score ${g.total}`);
  assert.equal(g.tier, 3);
});
t('a finding needs evidence that was collected, not just claimed', () => {
  const st = E.newRun(S);
  E.ptFinding(S, st, { vuln: 'T2', severity: 'critical', impact: 'data-breach', fix: 'remove-rotate', evidence: ['ev-backup-listed', 'ev-backup-open'] });
  const f = st.pt.findings[0];
  assert.deepEqual(f.evidence, [], 'evidence that was never collected is dropped');
  const r = P.scoreFinding(S, st, S.pt.truths[1]);
  assert.ok(r.points < r.max * 0.8);
});
t('severity, impact and fix each change the finding score', () => {
  const run = (sev, imp, fx) => {
    const st = E.newRun(S);
    for (const h of ['files']) E.ptScan(S, st, h, 'gentle');
    E.ptBrowse(S, st, 'f-index');
    E.ptBrowse(S, st, 'f-backup');
    E.ptCheck(S, st, 'files', 'headonly');
    E.ptFinding(S, st, { vuln: 'T2', severity: sev, impact: imp, fix: fx, evidence: ['ev-backup-listed', 'ev-backup-open'] });
    return P.scoreFinding(S, st, S.pt.truths[1]).points;
  };
  const full = run('critical', 'data-breach', 'remove-rotate');
  assert.ok(full > run('high', 'data-breach', 'remove-rotate'), 'one step off is half credit');
  assert.ok(run('high', 'data-breach', 'remove-rotate') > run('info', 'data-breach', 'remove-rotate'));
  assert.ok(full > run('critical', 'minor', 'remove-rotate'));
  assert.ok(full > run('critical', 'data-breach', 'remove-only'));
  assert.ok(run('critical', 'data-breach', 'remove-only') > run('critical', 'data-breach', 'rename'));
});
t('writing up things that are not vulnerabilities costs points', () => {
  const st = best();
  const base = E.grade(S, st, GOOD).total;
  E.ptFinding(S, st, { vuln: 'D2', severity: 'medium', impact: 'x', fix: 'x', evidence: [] });
  E.ptFinding(S, st, { vuln: 'D3', severity: 'high', impact: 'x', fix: 'x', evidence: [] });
  const after = E.grade(S, st, GOOD).total;
  assert.ok(after < base, `${after} < ${base}`);
  assert.equal(P.falsePositives(S, st).length, 2);
});
t('an informational note about an expected service is not a false positive', () => {
  const st = best();
  E.ptFinding(S, st, { vuln: 'D1', severity: 'info', impact: 'x', fix: 'x', evidence: [] });
  assert.equal(P.falsePositives(S, st).length, 0);
});
t('stopping to tell the client scores; not telling does not', () => {
  const told = best();
  const silent = best();
  silent.pt.notified = [];
  assert.ok(E.grade(S, told, GOOD).total > E.grade(S, silent, GOOD).total + 6);
});
t('a scope breach caps the medal at bronze however good the rest is', () => {
  const st = best();
  E.ptBrowse(S, st, 'p-checkout');
  E.ptScan(S, st, 'pay-gw', 'gentle');
  E.advance(st, 240, 'wait');
  E.submit(st);
  const g = E.grade(S, st, GOOD);
  assert.ok(g.tier <= 1, `tier ${g.tier}`);
  assert.equal(g.capped, true);
});
t('a crashed printer and forbidden checks each cost conduct points', () => {
  const clean = E.grade(S, best(), GOOD).total;
  const st = best();
  st.pt.crashed.push('printer');
  st.pt.violations.push({ kind: 'brute', text: 'x', at: 0 });
  assert.ok(E.grade(S, st, GOOD).total <= clean - 8);
});
t('doing nothing scores almost nothing, and testing fewer hosts weakens the report', () => {
  const st = E.newRun(S);
  const g = E.grade(S, st, { priority: 'wiki', immediate: [], gateway: 'report', limits: [], summary: '' });
  assert.ok(g.total < 35, `score ${g.total}`);
  assert.equal(g.tier, 0);
  const half = E.newRun(S);
  E.ptScan(S, half, 'portal', 'gentle');
  const some = E.grade(S, half, GOOD);
  const all = E.grade(S, best(), GOOD);
  assert.ok(some.total < all.total);
});
t('the workspace never exposes which observations are real before the evidence is seen', () => {
  const st = E.newRun(S);
  const offered = [...S.pt.truths, ...S.pt.decoys].filter((x) => x.seen.some((e) => P.hasEvidence(st, e)));
  assert.equal(offered.length, 0);
});

console.log(n, 'passed');
