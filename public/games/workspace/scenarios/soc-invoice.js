// SOC Analyst workspace, assignment 1: "The invoice that phoned home".
// Everything here is fictional. Addresses come from the reserved documentation ranges.
//
// The story (kept here so the tests and the debrief can both use it):
//   08:12  A fake invoice email reaches a finance analyst, Priya.
//   09:03  She opens the attached document. It starts a hidden command and drops a small program.
//   09:05  The program starts calling an outside address every five minutes.
//   10:14  It reads the credential store on her workstation.
//   11:41  A backup service account, which never signs in to workstations, signs in to hers.
//   12:06  That account moves to the finance file server.
//   12:21  It reads the whole Payroll folder, and at 12:41 packs it into one archive.
//   15:05  If nobody has stopped it, the archive leaves for the outside address.
// Three other alerts have innocent explanations: a travelling director, a scheduled backup and an
// authorised network audit by IT.

const m = (h, mi = 0) => h * 60 + mi;

// ── The world ───────────────────────────────────────────────────
const entities = [
  { id: 'priya.n', kind: 'user', name: 'Priya N.', role: 'Finance analyst', facts: ['Works 08:30 to 17:00 on WS-FIN-07.', 'Handles supplier invoices every day.', 'Normal sign-in country: UK.'] },
  { id: 'tom.w', kind: 'user', name: 'Tom W.', role: 'Finance analyst', facts: ['Works on WS-FIN-03.', 'Normal sign-in country: UK.'] },
  { id: 'svc-backup', kind: 'user', name: 'Backup service account', role: 'Service account', facts: ['Runs the nightly backup of FS-02 and BK-01 at 01:00.', 'Is never used to sign in to a workstation.', 'Password last changed 14 months ago.'] },
  { id: 'dee.k', kind: 'user', name: 'Dee K.', role: 'IT administrator', facts: ['Works on WS-IT-02.', 'Change CHG-1182 (approved): authorised network audit of the office subnet, 10:30 to 12:00 today.'] },
  { id: 'omar.r', kind: 'user', name: 'Omar R.', role: 'Sales director', facts: ['Works on WS-SAL-11.', 'Calendar: at a conference in Lisbon, 20 to 22 October.', 'Uses the company VPN when travelling.'] },
  { id: 'amy.s', kind: 'user', name: 'Amy S.', role: 'HR adviser', facts: ['Works on WS-HR-04.'] },
  { id: 'WS-FIN-07', kind: 'host', name: 'Finance workstation 7', role: 'Priya\'s laptop', facts: ['Windows laptop, finance team.', 'Standard build with endpoint protection.', 'Holds saved sessions for the payment portal.'], x: 14, y: 50 },
  { id: 'WS-FIN-03', kind: 'host', name: 'Finance workstation 3', role: 'Tom\'s laptop', facts: ['Windows laptop, finance team.'], x: 14, y: 72 },
  { id: 'WS-IT-02', kind: 'host', name: 'IT workstation 2', role: 'Dee\'s workstation', facts: ['Used for administration and network audits.'], x: 36, y: 86 },
  { id: 'WS-SAL-11', kind: 'host', name: 'Sales laptop 11', role: 'Omar\'s laptop', facts: ['Travelling with the owner.'], x: 58, y: 86 },
  { id: 'WS-HR-04', kind: 'host', name: 'HR workstation 4', role: 'Amy\'s workstation', facts: ['Windows desktop, HR team.'], x: 80, y: 86 },
  { id: 'FS-02', kind: 'host', name: 'Finance file server', role: 'File server', facts: ['Holds the Finance share, including Payroll.', 'Business critical: payroll runs from it on the 28th.', 'Backed up nightly at 01:00.'], x: 46, y: 24 },
  { id: 'DC-01', kind: 'host', name: 'Domain controller', role: 'Directory', facts: ['Handles every sign-in in the office.'], x: 46, y: 52 },
  { id: 'BK-01', kind: 'host', name: 'Backup server', role: 'Backups', facts: ['Copies to the offsite provider every Tuesday at 13:30. Change record BKP-77 (standing approval).'], x: 72, y: 24 },
  { id: 'MAIL-GW', kind: 'host', name: 'Mail gateway', role: 'Email', facts: ['Filters inbound email.'], x: 72, y: 52 },
  { id: '203.0.113.44', kind: 'ip', name: 'External address', role: 'Unknown hosting provider', facts: ['Never seen on the network before today (first connection 09:05).', 'Hosted at a low-cost provider.', 'Not in any approved supplier list.'], x: 90, y: 6 },
  { id: '198.51.100.33', kind: 'ip', name: 'External address', role: 'Residential provider, Lisbon', facts: ['Matches the hotel used for the Lisbon conference.'], x: 90, y: 44 },
  { id: '198.51.100.150', kind: 'ip', name: 'External address', role: 'Backup provider', facts: ['Contoso\'s offsite backup provider, on the approved supplier list.'], x: 90, y: 72 },
  { id: 'invoices-ontime.example', kind: 'domain', name: 'Domain', role: 'Unknown sender domain', facts: ['Registered 6 days ago.', 'Not an existing supplier.', 'Name imitates Fabrikam Parts, a real supplier (fabrikamparts.example).'] },
  { id: 'accounts@invoices-ontime.example', kind: 'mail', name: 'Sender', role: 'Unknown sender', facts: ['First email to Contoso on 14 October.'] },
];

const targets = {
  host: ['WS-FIN-07', 'WS-FIN-03', 'WS-IT-02', 'WS-SAL-11', 'WS-HR-04', 'FS-02', 'DC-01', 'BK-01'],
  user: ['priya.n', 'tom.w', 'svc-backup', 'dee.k', 'omar.r', 'amy.s'],
  ip: ['203.0.113.44', '198.51.100.33', '198.51.100.150'],
  domain: ['invoices-ontime.example'],
  mail: ['accounts@invoices-ontime.example'],
  contact: ['Head of Finance', 'IT manager', 'Whole company'],
};

const actions = [
  { id: 'isolate', label: 'Isolate host', targetKind: 'host', cost: 3 },
  { id: 'disable', label: 'Disable account', targetKind: 'user', cost: 3 },
  { id: 'reset', label: 'Force password reset', targetKind: 'user', cost: 3 },
  { id: 'block-ip', label: 'Block address at the firewall', targetKind: 'ip', cost: 3 },
  { id: 'block-domain', label: 'Block domain at the proxy', targetKind: 'domain', cost: 3 },
  { id: 'quarantine', label: 'Quarantine email from sender', targetKind: 'mail', cost: 3 },
  { id: 'snapshot', label: 'Capture forensic snapshot', targetKind: 'host', cost: 4 },
  { id: 'notify', label: 'Notify', targetKind: 'contact', cost: 2 },
];

// What each response does. `good` ones are what a sound analyst would do; `harm` costs the business.
const responses = [
  { action: 'isolate', target: 'WS-FIN-07', good: true, points: 5, label: 'Isolate WS-FIN-07', why: 'The infected workstation was still calling the attacker and holding saved sessions. Isolating it (not switching it off) stops that and keeps the evidence.', text: 'WS-FIN-07 is cut off from the network but left running, so memory and logs survive. The calls to 203.0.113.44 stop.', effects: [{ type: 'edr', sev: 'info', host: 'WS-FIN-07', summary: 'EDR: network containment applied to WS-FIN-07' }] },
  { action: 'disable', target: 'svc-backup', good: true, points: 5, label: 'Disable svc-backup', why: 'The attacker was using the backup service account, which should never sign in to a workstation. Its password was 14 months old.', text: 'svc-backup is disabled and its open sessions end. The nightly backup will need a new account before 01:00.', harm: 0, effects: [{ type: 'auth', sev: 'info', user: 'svc-backup', summary: 'Directory: svc-backup disabled, 2 sessions terminated' }] },
  { action: 'reset', target: 'svc-backup', good: false, points: 0, label: 'Reset svc-backup', text: 'The password is changed, but the attacker\'s existing session stays open until it expires. Disabling the account is the faster way to stop it.', effects: [{ type: 'auth', sev: 'info', user: 'svc-backup', summary: 'Directory: password reset for svc-backup' }] },
  { action: 'reset', target: 'priya.n', good: true, points: 3, label: 'Reset Priya\'s password', why: 'The program read the credential store on her workstation, so her password should be treated as stolen.', text: 'Priya is signed out everywhere and must choose a new password.', effects: [{ type: 'auth', sev: 'info', user: 'priya.n', summary: 'Directory: password reset forced for priya.n' }] },
  { action: 'disable', target: 'priya.n', good: false, points: 0, label: 'Disable Priya', harm: 3, text: 'Priya cannot work and her payment run is delayed. A password reset would have been enough.' },
  { action: 'block-ip', target: '203.0.113.44', good: true, points: 4, label: 'Block 203.0.113.44', why: 'It was the attacker\'s controlling address, and it would also have received the archive.', text: 'Traffic to 203.0.113.44 is blocked at the firewall from every host.', effects: [{ type: 'firewall', sev: 'info', summary: 'Firewall: rule added, deny any to 203.0.113.44' }] },
  { action: 'block-domain', target: 'invoices-ontime.example', good: true, points: 1, label: 'Block the sender domain', why: 'Stops further emails and any links from the lookalike domain.', text: 'The domain is blocked at the proxy and the mail gateway.', effects: [{ type: 'firewall', sev: 'info', summary: 'Proxy: invoices-ontime.example blocked' }] },
  { action: 'quarantine', target: 'accounts@invoices-ontime.example', good: true, points: 2, label: 'Quarantine the sender\'s emails', why: 'The same sender may have emailed other staff.', text: 'Two more copies of the email are found in other mailboxes and quarantined, unopened.', effects: [{ type: 'email', sev: 'info', host: 'MAIL-GW', summary: 'Mail gateway: 3 messages from accounts@invoices-ontime.example quarantined' }] },
  { action: 'snapshot', target: 'WS-FIN-07', good: true, points: 3, label: 'Capture a snapshot of WS-FIN-07', why: 'Memory and disk are the evidence of what ran, and a clean-up would destroy them.', text: 'A forensic snapshot of memory and disk is taken and stored for the investigation.', effects: [{ type: 'edr', sev: 'info', host: 'WS-FIN-07', summary: 'EDR: forensic snapshot of WS-FIN-07 captured' }] },
  { action: 'notify', target: 'Head of Finance', good: true, points: 2, label: 'Tell the Head of Finance', why: 'Finance staff need to stop opening the email and be ready for a payroll disruption.', text: 'The Head of Finance is told. Finance staff are asked not to open invoices from unknown senders.' },
  { action: 'isolate', target: 'FS-02', good: false, points: 0, label: 'Isolate FS-02', harm: 6, text: 'The file server is cut off. The attacker is stopped from using it, but the whole finance team loses its files and the payroll preparation stops. Blocking the address and disabling the account would have done the job.', effects: [{ type: 'edr', sev: 'info', host: 'FS-02', summary: 'EDR: network containment applied to FS-02' }] },
  { action: 'isolate', target: 'DC-01', good: false, points: 0, label: 'Isolate DC-01', harm: 20, text: 'Nobody in the company can sign in. Every system that needs the directory stops until it is reconnected.' },
  { action: 'disable', target: 'omar.r', good: false, points: 0, label: 'Disable Omar', harm: 5, text: 'Omar is locked out in the middle of a conference presentation. His travel explained the alert.' },
  { action: 'disable', target: 'dee.k', good: false, points: 0, label: 'Disable Dee', harm: 5, text: 'The IT administrator is locked out, and the approved audit stops. Dee\'s activity was an authorised change.' },
  { action: 'isolate', target: 'BK-01', good: false, points: 0, label: 'Isolate BK-01', harm: 6, text: 'The backup server is cut off. Its weekly offsite copy fails, and nothing about it was suspicious.' },
  { action: 'isolate', target: 'WS-SAL-11', good: false, points: 0, label: 'Isolate WS-SAL-11', harm: 5, text: 'Omar\'s laptop is cut off from the network, in the middle of a conference presentation.' },
  { action: 'block-ip', target: '198.51.100.33', good: false, points: 0, label: 'Block the Lisbon address', harm: 3, text: 'Omar\'s VPN connection fails and he cannot reach any company system.' },
  { action: 'block-ip', target: '198.51.100.150', good: false, points: 0, label: 'Block the backup provider', harm: 4, text: 'The offsite backup copy fails. This is Contoso\'s approved backup provider.' },
  { action: 'notify', target: 'Whole company', good: false, points: 0, label: 'Email the whole company', harm: 2, text: 'A company-wide email goes out before the facts are known, and staff start guessing who was affected.' },
  { action: 'notify', target: 'IT manager', good: false, points: 0, label: 'Tell the IT manager', text: 'The IT manager is told and offers help.' },
];

// Actions with no specific rule use these. Hosts and accounts that are not involved should not be touched.
const defaults = {
  isolate: { harm: 4, text: 'The host is cut off from the network. There was nothing to show it was involved, and its user cannot work.' },
  disable: { harm: 3, text: 'The account is disabled. Nothing showed it was involved, and its owner cannot work.' },
  reset: { harm: 1, text: 'The user is forced to change their password. Nothing showed they were involved.' },
  'block-ip': { harm: 1, text: 'The address is blocked. Nothing showed it was involved.' },
  'block-domain': { harm: 1, text: 'The domain is blocked.' },
  quarantine: { harm: 1, text: 'The sender is quarantined.' },
  snapshot: { text: 'A snapshot is taken. It was not needed here, and it cost time.' },
  notify: { text: 'Done.' },
};

// ── The events ──────────────────────────────────────────────────
const attack = [
  { id: 'e-mail', t: m(8, 12), type: 'email', host: 'MAIL-GW', user: 'priya.n', sev: 'low', key: 'email', summary: 'Delivered to priya.n: "Invoice 88413 overdue" from accounts@invoices-ontime.example, attachment Remittance_Advice.docm', fields: { from: 'accounts@invoices-ontime.example', domain: 'invoices-ontime.example', file: 'Remittance_Advice.docm', subject: 'Invoice 88413 overdue' } },
  { id: 'e-open', t: m(9, 2), type: 'process', host: 'WS-FIN-07', user: 'priya.n', sev: 'info', key: 'macro', summary: 'priya.n opened Remittance_Advice.docm in WINWORD.EXE', fields: { pid: 5200, ppid: 4100, proc: 'WINWORD.EXE', parent: 'explorer.exe', file: 'Remittance_Advice.docm', cmd: 'WINWORD.EXE Remittance_Advice.docm' } },
  { id: 'e-macro', t: m(9, 3), type: 'process', host: 'WS-FIN-07', user: 'priya.n', sev: 'medium', key: 'macro', summary: 'WINWORD.EXE started cmd.exe /c powershell -w hidden', fields: { pid: 6300, ppid: 5200, proc: 'cmd.exe', parent: 'WINWORD.EXE', cmd: 'cmd /c powershell -w hidden -enc ...' } },
  { id: 'e-ps', t: m(9, 3), type: 'process', host: 'WS-FIN-07', user: 'priya.n', sev: 'medium', key: 'macro', summary: 'cmd.exe started powershell.exe (hidden window)', fields: { pid: 6344, ppid: 6300, proc: 'powershell.exe', parent: 'cmd.exe', cmd: 'powershell -w hidden -enc ...' } },
  { id: 'e-drop', t: m(9, 4), type: 'process', host: 'WS-FIN-07', user: 'priya.n', sev: 'medium', key: 'dropper', summary: 'powershell.exe wrote and started update_svc.exe in AppData\\Roaming', fields: { pid: 6410, ppid: 6344, proc: 'update_svc.exe', parent: 'powershell.exe', file: 'C:\\Users\\priya.n\\AppData\\Roaming\\update_svc.exe', cmd: 'update_svc.exe' } },
  { id: 'e-a1', t: m(9, 21), type: 'alert', host: 'WS-FIN-07', user: 'priya.n', sev: 'medium', key: 'macro', summary: 'ALERT: Office application started a command shell on WS-FIN-07', fields: { alert: 'A-1' } },
  { id: 'e-cred', t: m(10, 14), type: 'process', host: 'WS-FIN-07', user: 'priya.n', sev: 'high', key: 'cred', summary: 'update_svc.exe read the local credential store', fields: { proc: 'update_svc.exe', action: 'credential store read' } },
  { id: 'e-a2', t: m(10, 15), type: 'alert', host: 'WS-FIN-07', user: 'priya.n', sev: 'high', key: 'cred', summary: 'ALERT: Unsigned program accessed credential store on WS-FIN-07', fields: { alert: 'A-2' } },
  { id: 'e-svc1', t: m(11, 41), type: 'logon', host: 'WS-FIN-07', user: 'svc-backup', sev: 'medium', key: 'svclogon', summary: 'Interactive logon by svc-backup on WS-FIN-07', fields: { logon: 'interactive', src: 'local' } },
  { id: 'e-lat', t: m(12, 6), type: 'logon', host: 'FS-02', user: 'svc-backup', sev: 'medium', key: 'lateral', summary: 'Network logon by svc-backup on FS-02, from WS-FIN-07', fields: { logon: 'network', src: 'WS-FIN-07' } },
  { id: 'e-read', t: m(12, 21), type: 'file', host: 'FS-02', user: 'svc-backup', sev: 'high', key: 'read', summary: 'svc-backup read 4,112 files in Finance\\Payroll in 6 minutes', fields: { file: 'Finance\\Payroll\\*', count: 4112, src: 'WS-FIN-07' } },
  { id: 'e-a3', t: m(12, 22), type: 'alert', host: 'FS-02', user: 'svc-backup', sev: 'high', key: 'read', summary: 'ALERT: Unusual volume of file reads by svc-backup on FS-02', fields: { alert: 'A-3' } },
  { id: 'e-zip', t: m(12, 41), type: 'file', host: 'FS-02', user: 'svc-backup', sev: 'high', key: 'archive', summary: 'svc-backup created C:\\Temp\\fin_q3.zip (1.2 GB) on FS-02', fields: { file: 'C:\\Temp\\fin_q3.zip', bytes: 1288490188 } },
  { id: 'e-exfil', t: m(15, 5), type: 'network', host: 'FS-02', user: 'svc-backup', sev: 'high', key: 'exfil', keyWeight: 0, summary: 'FS-02 sent 1.2 GB to 203.0.113.44 over 18 minutes', fields: { dst: '203.0.113.44', port: 443, bytes: 1288490188 }, unless: ['block-ip:203.0.113.44', 'isolate:FS-02', 'disable:svc-backup'], consequence: { cost: 14, label: 'The archive left the network', prevented: 'the Payroll archive never left the network', text: 'The Payroll archive (1.2 GB) was sent to 203.0.113.44 before it was stopped. This is a data breach and the company must assess whether to report it.' } },
  { id: 'e-a7', t: m(15, 6), type: 'alert', host: 'FS-02', user: 'svc-backup', sev: 'high', summary: 'ALERT: Large outbound transfer from FS-02 to a rare external address', fields: { alert: 'A-7' }, unless: ['block-ip:203.0.113.44', 'isolate:FS-02', 'disable:svc-backup'] },
];

// The beacon: update_svc.exe calls 203.0.113.44 every five minutes until the workstation is isolated or the address blocked.
const beacon = [];
for (let t = m(9, 5); t <= m(15, 45); t += 5) {
  beacon.push({ id: `e-b${t}`, t, type: 'network', host: 'WS-FIN-07', user: 'priya.n', sev: t === m(9, 5) ? 'medium' : 'low', key: 'beacon', keyWeight: t === m(9, 5) ? 1 : 0, summary: `update_svc.exe connected to 203.0.113.44:443 (${t === m(9, 5) ? 'first time seen' : 'repeat'})`, fields: { proc: 'update_svc.exe', dst: '203.0.113.44', port: 443, bytes: 740 + (t % 7) * 13 }, unless: ['isolate:WS-FIN-07', 'block-ip:203.0.113.44'] });
}

const distractors = [
  // Omar: impossible travel (alert A-4)
  { id: 'e-om1', t: m(8, 45), type: 'logon', host: 'WS-SAL-11', user: 'omar.r', sev: 'info', summary: 'omar.r signed in to the VPN from 81.2.69.160 (London, airport)', fields: { src: '81.2.69.160', logon: 'vpn' } },
  { id: 'e-om2', t: m(13, 2), type: 'logon', host: 'WS-SAL-11', user: 'omar.r', sev: 'medium', summary: 'omar.r signed in to the VPN from 198.51.100.33 (Lisbon)', fields: { src: '198.51.100.33', logon: 'vpn' } },
  { id: 'e-a4', t: m(13, 3), type: 'alert', host: 'WS-SAL-11', user: 'omar.r', sev: 'medium', summary: 'ALERT: Impossible travel: omar.r signed in from two countries within 4 hours', fields: { alert: 'A-4' } },
  // BK-01: weekly offsite backup (alert A-5)
  { id: 'e-bk1', t: m(13, 30), type: 'network', host: 'BK-01', user: 'svc-backup', sev: 'medium', summary: 'BK-01 sent 8.4 GB to 198.51.100.150 (offsite backup provider)', fields: { dst: '198.51.100.150', port: 443, bytes: 9019431321 } },
  { id: 'e-a5', t: m(13, 31), type: 'alert', host: 'BK-01', sev: 'medium', summary: 'ALERT: Large outbound transfer from BK-01', fields: { alert: 'A-5' } },
  // Dee: network audit tool (alert A-6)
  { id: 'e-d1', t: m(10, 31), type: 'process', host: 'WS-IT-02', user: 'dee.k', sev: 'low', summary: 'dee.k started netscan.exe on WS-IT-02 (scanning 10.20.0.0/24)', fields: { pid: 3112, ppid: 4100, proc: 'netscan.exe', parent: 'explorer.exe', cmd: 'netscan.exe -range 10.20.0.0/24' } },
  { id: 'e-d2', t: m(10, 51), type: 'network', host: 'WS-IT-02', user: 'dee.k', sev: 'low', summary: 'WS-IT-02 made 2,400 connections to hosts in 10.20.0.0/24', fields: { dst: '10.20.0.0/24', count: 2400 } },
  { id: 'e-a6', t: m(10, 52), type: 'alert', host: 'WS-IT-02', user: 'dee.k', sev: 'medium', summary: 'ALERT: Network scanning tool detected on WS-IT-02', fields: { alert: 'A-6' } },
];

// Ordinary activity, generated from a fixed seed so every run of the assignment is identical.
function noise() {
  let seed = 20261020;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const people = [
    { u: 'priya.n', h: 'WS-FIN-07' },
    { u: 'tom.w', h: 'WS-FIN-03' },
    { u: 'amy.s', h: 'WS-HR-04' },
    { u: 'dee.k', h: 'WS-IT-02' },
  ];
  const out = [];
  let n = 0;
  const pids = {};
  const add = (t, o) => out.push({ id: `n${++n}`, t, sev: 'info', ...o });
  for (const p of people) {
    const t = m(8, 20) + Math.floor(rnd() * 30);
    add(t, { type: 'logon', host: p.h, user: p.u, summary: `${p.u} signed in to ${p.h}`, fields: { logon: 'interactive', src: 'local' } });
    add(t + 1, { type: 'process', host: p.h, user: p.u, summary: `${p.u} started explorer.exe on ${p.h}`, fields: { pid: 4100, ppid: 1, proc: 'explorer.exe', parent: 'winlogon.exe', cmd: 'explorer.exe' } });
    pids[p.h] = 7000;
  }
  const domains = ['intranet.contoso.example', 'mail.contoso.example', 'news.example', 'fabrikamparts.example', 'docs.contoso.example', 'weather.example', 'bank-portal.example'];
  const files = ['Budget_FY27.xlsx', 'Supplier_list.xlsx', 'Minutes_Oct.docx', 'Holiday_rota.xlsx', 'Policy_v3.docx', 'Invoice_88112.pdf', 'Invoice_88201.pdf'];
  const procs = ['chrome.exe', 'outlook.exe', 'excel.exe', 'teams.exe', 'acrobat.exe'];
  for (let t = m(8, 35); t < m(15, 45); t += 6 + Math.floor(rnd() * 10)) {
    const p = pick(people);
    const k = rnd();
    if (k < 0.34) {
      const d = pick(domains);
      add(t, { type: 'dns', host: p.h, user: p.u, summary: `${p.h} looked up ${d}`, fields: { domain: d } });
    } else if (k < 0.6) {
      const f = pick(files);
      add(t, { type: 'file', host: 'FS-02', user: p.u, summary: `${p.u} opened ${f} on FS-02`, fields: { file: f } });
    } else if (k < 0.85) {
      const proc = pick(procs);
      add(t, { type: 'process', host: p.h, user: p.u, summary: `${p.u} started ${proc} on ${p.h}`, fields: { pid: pids[p.h]++, ppid: 4100, proc, parent: 'explorer.exe', cmd: proc } });
    } else {
      const dst = `192.0.2.${10 + Math.floor(rnd() * 40)}`;
      add(t, { type: 'network', host: p.h, user: p.u, summary: `${p.h} connected to ${dst}:443`, fields: { dst, port: 443, bytes: 2000 + Math.floor(rnd() * 90000) } });
    }
  }
  const senders = ['hr@contoso.example', 'it-notices@contoso.example', 'orders@fabrikamparts.example', 'newsletter@news.example'];
  for (let i = 0; i < 6; i++) {
    const from = pick(senders);
    add(m(8, 5) + i * 55 + Math.floor(rnd() * 20), { type: 'email', host: 'MAIL-GW', user: pick(people).u, summary: `Delivered email from ${from}`, fields: { from } });
  }
  for (let i = 0; i < 4; i++) add(m(8, 30) + i * 70 + Math.floor(rnd() * 30), { type: 'logon', host: 'DC-01', user: pick(people).u, summary: 'Failed sign-in (wrong password), then succeeded', fields: { logon: 'failed-then-ok' } });
  return out;
}

const events = [...attack, ...beacon, ...distractors, ...noise()];

// ── Alerts ──────────────────────────────────────────────────────
const alerts = [
  { id: 'A-1', at: m(9, 21), title: 'Office application started a command shell', sev: 'medium', source: 'Endpoint protection', host: 'WS-FIN-07', user: 'priya.n', events: ['e-a1', 'e-macro'], truth: 'incident', why: 'Word starting a hidden command window is the first sign of the malicious document.' },
  { id: 'A-2', at: m(10, 15), title: 'Unsigned program accessed credential store', sev: 'high', source: 'Endpoint protection', host: 'WS-FIN-07', user: 'priya.n', events: ['e-a2', 'e-cred'], truth: 'incident', why: 'The dropped program was stealing stored credentials.' },
  { id: 'A-3', at: m(12, 22), title: 'Unusual volume of file reads', sev: 'high', source: 'File server monitoring', host: 'FS-02', user: 'svc-backup', events: ['e-a3', 'e-read'], truth: 'incident', why: 'The stolen backup account was reading the whole Payroll folder.' },
  { id: 'A-4', at: m(13, 3), title: 'Impossible travel: omar.r', sev: 'medium', source: 'Identity monitoring', host: 'WS-SAL-11', user: 'omar.r', events: ['e-a4', 'e-om1', 'e-om2'], truth: 'benign', why: 'Omar is at a conference in Lisbon (his calendar and the hotel address match).' },
  { id: 'A-5', at: m(13, 31), title: 'Large outbound transfer from BK-01', sev: 'medium', source: 'Network monitoring', host: 'BK-01', events: ['e-a5', 'e-bk1'], truth: 'benign', why: 'It is the weekly offsite backup to the approved provider (change record BKP-77).' },
  { id: 'A-6', at: m(10, 52), title: 'Network scanning tool detected', sev: 'medium', source: 'Endpoint protection', host: 'WS-IT-02', user: 'dee.k', events: ['e-a6', 'e-d1', 'e-d2'], truth: 'benign', why: 'It is the approved network audit by IT (change CHG-1182).' },
  { id: 'A-7', at: m(15, 6), title: 'Large outbound transfer from FS-02 to a rare external address', sev: 'high', source: 'Network monitoring', host: 'FS-02', user: 'svc-backup', events: ['e-a7', 'e-exfil'], truth: 'incident', late: true, why: 'This is the Payroll archive leaving the network.' },
];

export const SOC_INVOICE = {
  id: 'soc-invoice',
  title: 'The invoice that phoned home',
  workspace: 'soc',
  path: 'analyst',
  blurb: 'Six alerts are waiting. Some are the same attack, and some have innocent explanations. Find out which, stop the attacker and report what happened.',
  brief: [
    'It is 14:05 on Tuesday and you have taken over the alert queue from the morning shift. The handover note says six alerts are open and nobody has had time to look at them properly.',
    'Open each alert, search the logs, check the people and machines involved, and pin the events that belong to the incident. Containing the attack is part of the job, and so is leaving the business running. Then file your incident report.',
  ],
  clockStart: m(14, 5),
  horizon: m(16, 0),
  entities,
  targets,
  actions,
  responses,
  defaults,
  events,
  alerts,
  roleLabels: {
    email: 'the fake invoice email arriving',
    macro: 'Word starting a hidden command shell',
    dropper: 'the dropped program update_svc.exe',
    beacon: 'the first call to 203.0.113.44',
    cred: 'the credential store being read',
    svclogon: 'svc-backup signing in to a workstation',
    lateral: 'svc-backup moving to the file server',
    read: 'the mass read of the Payroll folder',
    archive: 'the 1.2 GB archive being created',
  },
  roleHints: {
    email: 'Search type:email, or look at the mail gateway around 08:12.',
    macro: 'Open the process tree for WS-FIN-07, or search proc:cmd.exe.',
    dropper: 'The process tree shows what PowerShell started.',
    beacon: 'Search ip:203.0.113.44 and look at the earliest result.',
    cred: 'Search host:WS-FIN-07 sev:high.',
    svclogon: 'Search user:svc-backup type:logon. This account should never sign in to a workstation.',
    lateral: 'Follow svc-backup from WS-FIN-07 to FS-02.',
    read: 'Search host:FS-02 sev:high.',
    archive: 'Search file:zip.',
  },
  truth: {
    verdict: 'confirmed',
    verdictNote: 'The evidence shows a confirmed compromise: malicious code ran, credentials were taken and data was staged.',
    severity: 'high',
    severityNote: 'Credentials were stolen and payroll data was staged for removal: High.',
    hosts: ['WS-FIN-07', 'FS-02'],
    hostsNote: 'WS-FIN-07 was infected and FS-02 held the staged data. BK-01 and the others were innocent.',
    users: ['priya.n', 'svc-backup'],
    usersNote: 'Priya\'s account was exposed and svc-backup was used by the attacker. Omar and Dee were innocent.',
    cause: 'phish-attachment',
    causeNote: 'It began with a malicious attachment in a fake invoice email.',
  },
  causes: [
    { id: 'phish-attachment', label: 'Malicious attachment in a phishing email' },
    { id: 'password-spray', label: 'Guessed or reused password on an exposed service' },
    { id: 'insider', label: 'Deliberate action by an employee' },
    { id: 'unpatched', label: 'An unpatched server vulnerability' },
    { id: 'lost-device', label: 'A lost or stolen device' },
  ],
  grading: { triage: 20, evidence: 25, response: 25, reportTotal: 30, harmScale: 1.4, minSummary: 40, report: { verdict: 8, severity: 4, hosts: 8, users: 4, cause: 4, summary: 2 }, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'soc-travel',
      question: 'The impossible-travel alert for Omar was a false alarm. What made the difference?',
      options: [
        { text: 'Checking context: his calendar, the Lisbon hotel address and the fact that his sign-ins were all normal', correct: true, explain: 'An alert is a question, not an answer. Context turned it from alarming to ordinary, and no containment was needed.' },
        { text: 'The alert was set to low severity', correct: false, explain: 'It was rated medium. Severity is a starting point, not a verdict.' },
        { text: 'Travelling staff are never attacked', correct: false, explain: 'They can be. Here the facts happened to show an innocent cause.' },
        { text: 'Impossible-travel alerts are always wrong', correct: false, explain: 'They are often right. Each one needs checking.' },
      ],
    },
    {
      id: 'soc-isolate',
      question: 'Why isolate WS-FIN-07 from the network instead of switching it off?',
      options: [
        { text: 'Isolation stops the attacker\'s calls and keeps memory and logs for the investigation, which a power-off would lose', correct: true, explain: 'Containment and evidence both matter. You want the machine cut off and still running.' },
        { text: 'Because switching off is not allowed on laptops', correct: false, explain: 'It is allowed. It would lose what was in memory.' },
        { text: 'Because the attacker cannot see an isolated machine', correct: false, explain: 'They lose their connection. Isolation is about containment, not hiding.' },
        { text: 'It makes no difference', correct: false, explain: 'It matters. Memory holds evidence of what the program was doing.' },
      ],
    },
  ],
  story: [
    '08:12 A fake invoice reaches Priya from a lookalike domain registered six days earlier.',
    '09:03 She opens the attachment. Word starts a hidden command shell, which drops update_svc.exe.',
    '09:05 The program calls 203.0.113.44 every five minutes. At 10:14 it reads the credential store.',
    '11:41 The backup service account, which never signs in to workstations, signs in to Priya\'s. At 12:06 it moves to the file server.',
    '12:21 It reads 4,112 Payroll files, and at 12:41 packs them into a 1.2 GB archive.',
    '15:05 If nobody stops it, the archive leaves for 203.0.113.44. Omar, BK-01 and Dee were never part of it.',
  ],
};
