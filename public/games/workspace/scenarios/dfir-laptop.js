// Incident Response and Forensics workspace, assignment 1: "The laptop that kept its secrets".
// Everything here is fictional. Addresses come from the reserved documentation ranges.
//
// The story (kept here so the tests and the debrief can both use it):
//   07:58  Jonas, a procurement manager, downloads a free PDF tool from a lookalike site.
//   08:01  He runs it. It drops a program, pdfhelper.exe, and a scheduled task, "PDFUpdate", to keep it running.
//   08:05  The program starts calling an outside address every ten minutes.
//   08:41  It reads the browser's stored credentials.
//   09:30  Jonas's account reads 340 files in Procurement\Contracts on the file server, and by 09:46 the laptop
//          holds them in one 340 MB file in the Temp folder.
//   09:52  The program changes the dates on its own file and on the big file, to make them look old.
//   10:30  The 340 MB file is sent to the outside address.
//   11:20  Endpoint protection notices pdfhelper.exe. That is where the case starts.
//   12:15  A clean-up routine already on the laptop clears its local logs, unless a copy was taken first.
// Two things look suspicious and are not: IT's remote inventory at 10:00 and a 120 MB sync to the approved
// cloud storage at 11:00.

const m = (h, mi = 0) => h * 60 + mi;
const LAPTOP = 'WS-PRO-05';

// ── The world ───────────────────────────────────────────────────
const entities = [
  { id: 'jonas.b', kind: 'user', name: 'Jonas B.', role: 'Procurement manager', facts: ['Works 08:00 to 17:30 on WS-PRO-05.', 'Has normal access to Procurement\\Contracts.', 'Reports the laptop has been "a bit slow since this morning".'] },
  { id: 'priti.s', kind: 'user', name: 'Priti S.', role: 'Procurement analyst', facts: ['Works on WS-PRO-02, in the same team as Jonas.'] },
  { id: 'dee.k', kind: 'user', name: 'Dee K.', role: 'IT administrator', facts: ['Works on WS-IT-02.', 'Ran an approved software inventory on several laptops this morning (change CHG-1190).'] },
  { id: 'WS-PRO-05', kind: 'host', name: 'Procurement laptop 5', role: 'Jonas\'s laptop', facts: ['Windows laptop, standard build with endpoint protection.', 'Has not been touched by IT since the alert at 11:20.', 'Local logs are kept on the laptop and also forwarded for some events.'], x: 14, y: 50 },
  { id: 'WS-PRO-02', kind: 'host', name: 'Procurement laptop 2', role: 'Priti\'s laptop', facts: ['Windows laptop, same team.'], x: 14, y: 74 },
  { id: 'WS-IT-02', kind: 'host', name: 'IT workstation 2', role: 'Dee\'s workstation', facts: ['Used for administration.'], x: 40, y: 88 },
  { id: 'FS-03', kind: 'host', name: 'Procurement file server', role: 'File server', facts: ['Holds Procurement\\Contracts and Procurement\\Budgets.', 'Its audit log is kept on the server and is not reachable from the laptops.'], x: 46, y: 26 },
  { id: 'DC-01', kind: 'host', name: 'Domain controller', role: 'Directory', facts: ['Handles every sign-in in the office.'], x: 46, y: 54 },
  { id: 'PROXY-01', kind: 'host', name: 'Web proxy and firewall', role: 'Internet gateway', facts: ['Records every web request and outside connection.', 'Its logs are kept centrally and are out of reach of the laptops.'], x: 72, y: 40 },
  { id: '192.0.2.77', kind: 'ip', name: 'External address', role: 'Unknown hosting provider', facts: ['First seen on the network at 08:05 today.', 'Not on any approved supplier list.'], x: 90, y: 10 },
  { id: '198.51.100.150', kind: 'ip', name: 'External address', role: 'Cloud storage provider', facts: ['Contoso\'s approved cloud storage, used by everyone for synced documents.'], x: 90, y: 74 },
  { id: 'freepdf-tools.example', kind: 'domain', name: 'Domain', role: 'Free software download site', facts: ['Registered 9 days ago.', 'Not on the approved software sources list.'] },
  {
    id: 'PDFOptimizerSetup.exe', kind: 'file', name: 'PDF installer', role: 'Downloaded installer', facts: ['Downloaded from freepdf-tools.example.', 'Not digitally signed.'],
    meta: [['Path', 'C:\\Users\\jonas.b\\Downloads'], ['Size', '4.8 MB'], ['Created', '2026-10-20 07:58'], ['Modified', '2026-10-20 07:58'], ['Accessed', '2026-10-20 08:01'], ['Record changed', '2026-10-20 07:58'], ['SHA-256', '4be1c0…90c7']],
  },
  {
    id: 'pdfhelper.exe', kind: 'file', name: 'Program in AppData', role: 'Flagged at 11:20', facts: ['Endpoint protection flagged it as suspicious at 11:20 but has not removed it.', 'Not signed, and not on the approved software list.', 'A reputation service has seen it on 2 other organisations\' machines.'],
    meta: [['Path', 'C:\\Users\\jonas.b\\AppData\\Roaming\\PDFHelper'], ['Size', '612 KB'], ['Created', '2025-03-02 10:14'], ['Modified', '2025-03-02 10:14'], ['Accessed', '2026-10-20 11:20'], ['Record changed', '2026-10-20 09:52'], ['SHA-256', 'a91d77…3e08']],
  },
  {
    id: 'cache.dat', kind: 'file', name: 'Large file in Temp', role: 'Single 340 MB file', facts: ['The contents cannot be read without special tools.', 'A single file this large in Temp is unusual for this user.'],
    meta: [['Path', 'C:\\Users\\jonas.b\\AppData\\Local\\Temp'], ['Size', '340 MB'], ['Created', '2024-11-19 16:40'], ['Modified', '2024-11-19 16:40'], ['Accessed', '2026-10-20 10:30'], ['Record changed', '2026-10-20 09:52'], ['SHA-256', '77c0e9…b2f5']],
  },
  {
    id: 'Budget_FY27.xlsx', kind: 'file', name: 'Budget workbook', role: 'Normal working file', facts: ['A routine file the Procurement team edits every week.'],
    meta: [['Path', 'Procurement\\Budgets (FS-03)'], ['Size', '1.1 MB'], ['Created', '2026-09-30 14:02'], ['Modified', '2026-10-19 16:48'], ['Accessed', '2026-10-20 08:55'], ['Record changed', '2026-10-19 16:48'], ['SHA-256', 'c3d2a1…18e4']],
  },
  {
    id: 'inventory.exe', kind: 'file', name: 'IT inventory tool', role: 'Approved IT tool', facts: ['Signed by the vendor and on the approved software list.'],
    meta: [['Path', 'C:\\ProgramData\\ITTools'], ['Size', '2.2 MB'], ['Created', '2026-02-11 09:00'], ['Modified', '2026-02-11 09:00'], ['Accessed', '2026-10-20 10:02'], ['Record changed', '2026-02-11 09:00'], ['SHA-256', 'e8b4f0…6a31']],
  },
];

const targets = {
  host: [LAPTOP, 'WS-PRO-02', 'WS-IT-02', 'FS-03', 'DC-01', 'PROXY-01'],
  user: ['jonas.b', 'priti.s', 'dee.k'],
  ip: ['192.0.2.77', '198.51.100.150'],
  domain: ['freepdf-tools.example'],
  contact: ['Head of Procurement', 'Data protection officer', 'Whole company'],
};

const actions = [
  { id: 'memory', label: 'Capture memory', targetKind: 'host', cost: 4, group: 'Preserve the evidence' },
  { id: 'image', label: 'Create a disk image', targetKind: 'host', cost: 8, group: 'Preserve the evidence' },
  { id: 'logs', label: 'Export and fingerprint the logs', targetKind: 'host', cost: 3, group: 'Preserve the evidence' },
  { id: 'isolate', label: 'Isolate from the network', targetKind: 'host', cost: 3, group: 'Contain' },
  { id: 'block-ip', label: 'Block address at the firewall', targetKind: 'ip', cost: 3, group: 'Contain' },
  { id: 'block-domain', label: 'Block domain at the proxy', targetKind: 'domain', cost: 3, group: 'Contain' },
  { id: 'reset', label: 'Force password reset', targetKind: 'user', cost: 3, group: 'Contain' },
  { id: 'disable', label: 'Disable account', targetKind: 'user', cost: 3, group: 'Contain' },
  { id: 'poweroff', label: 'Power the machine off', targetKind: 'host', cost: 1, group: 'Quick fixes (think first)' },
  { id: 'clean', label: 'Delete the suspicious files', targetKind: 'host', cost: 2, group: 'Quick fixes (think first)' },
  { id: 'reimage', label: 'Rebuild the machine from a clean image', targetKind: 'host', cost: 6, group: 'Quick fixes (think first)' },
  { id: 'notify', label: 'Notify', targetKind: 'contact', cost: 2, group: 'Tell people' },
];

const responses = [
  { action: 'memory', target: LAPTOP, good: true, points: 5, label: 'Capture memory on the laptop', why: 'Memory holds what is running right now, which no disk image can show, and it disappears when the machine is powered off.', blockedBy: [`poweroff:${LAPTOP}`, `reimage:${LAPTOP}`], blockedText: 'The machine has been powered off or rebuilt, so what was in memory is gone for good.', text: 'A memory capture is taken, with its fingerprint recorded in your notes. It holds the running program, its network connections and anything it had open.', effects: [{ type: 'forensics', sev: 'info', host: LAPTOP, summary: 'Forensics: memory capture of WS-PRO-05 taken, fingerprint recorded' }] },
  { action: 'image', target: LAPTOP, good: true, points: 6, label: 'Create a disk image of the laptop', why: 'An image is a copy you can examine without changing the original, and it keeps the logs and files if anything is later wiped.', blockedBy: [`reimage:${LAPTOP}`], blockedText: 'The machine has already been rebuilt: there is nothing left to image.', text: 'A bit-for-bit image of the disk is taken and its fingerprint recorded. The original is left untouched, and the logs and files are now safe.', effects: [{ type: 'forensics', sev: 'info', host: LAPTOP, summary: 'Forensics: disk image of WS-PRO-05 taken, fingerprint recorded' }] },
  { action: 'logs', target: LAPTOP, good: true, points: 3, label: 'Export and fingerprint the laptop\'s logs', why: 'Local logs are the first thing an attacker clears. A fingerprinted copy keeps them usable as evidence.', blockedBy: [`reimage:${LAPTOP}`], blockedText: 'The machine has been rebuilt: its logs are gone.', text: 'The event logs are exported and their fingerprint recorded. Even if the laptop\'s own logs are cleared, you hold a copy.', effects: [{ type: 'forensics', sev: 'info', host: LAPTOP, summary: 'Forensics: event logs of WS-PRO-05 exported and fingerprinted' }] },
  { action: 'isolate', target: LAPTOP, good: true, points: 6, label: 'Isolate the laptop', why: 'The program was still calling the attacker every ten minutes. Isolating (not switching off) cuts that and keeps memory and disk intact.', text: 'The laptop is cut off from the network but left running, so memory and logs survive. The calls to 192.0.2.77 stop.', effects: [{ type: 'edr', sev: 'info', host: LAPTOP, summary: 'EDR: network containment applied to WS-PRO-05' }] },
  { action: 'block-ip', target: '192.0.2.77', good: true, points: 3, label: 'Block 192.0.2.77', why: 'It was the attacker\'s address, and any other infected machine would be calling it too.', text: 'Traffic to 192.0.2.77 is blocked at the firewall from every machine.', effects: [{ type: 'firewall', sev: 'info', host: 'PROXY-01', summary: 'Firewall: rule added, deny any to 192.0.2.77' }] },
  { action: 'reset', target: 'jonas.b', good: true, points: 3, label: 'Reset Jonas\'s password', why: 'The program read the stored credentials on his laptop, so his passwords should be treated as stolen.', text: 'Jonas is signed out everywhere and must choose a new password.', effects: [{ type: 'auth', sev: 'info', user: 'jonas.b', summary: 'Directory: password reset forced for jonas.b' }] },
  { action: 'notify', target: 'Data protection officer', good: true, points: 2, label: 'Tell the data protection officer', why: '340 contract files left the network. The DPO decides whether personal data was involved and whether anyone outside has to be told, and the clock for that starts when you become aware.', text: 'The data protection officer is told, with the time you became aware and what is known so far. They will assess whether the contracts hold personal data.' },
  { action: 'notify', target: 'Head of Procurement', good: true, points: 2, label: 'Tell the Head of Procurement', why: 'The business owner needs to know what left, and that the team should not use the file share from that laptop.', text: 'The Head of Procurement is told that contract files were taken and asked to list who the contracts involve.' },
  { action: 'poweroff', target: LAPTOP, good: false, points: 0, label: 'Power off the laptop', harm: 8, text: 'The laptop is switched off. The disk is intact, but everything in memory is gone: the running program, its connections and anything it had decrypted. You can no longer capture memory.' },
  { action: 'clean', target: LAPTOP, good: false, points: 0, label: 'Delete the suspicious files', harm: 6, text: 'The files you can see are deleted. You have changed the evidence before copying it, and the scheduled task that keeps the program alive was not removed.', effects: [{ type: 'file', sev: 'info', host: LAPTOP, summary: 'Files deleted on WS-PRO-05 (by you)' }] },
  { action: 'reimage', target: LAPTOP, good: false, points: 0, label: 'Rebuild the laptop', harm: 15, text: 'The laptop is rebuilt from a clean image and Jonas is working again within the hour. Every trace of what happened on it has been destroyed: you can no longer show how it began, what it did or what was taken.' },
  { action: 'isolate', target: 'FS-03', good: false, points: 0, label: 'Isolate the file server', harm: 6, text: 'The file server is cut off and the whole Procurement team loses its files. It was not compromised: only an account was used to read from it.' },
  { action: 'isolate', target: 'DC-01', good: false, points: 0, label: 'Isolate the domain controller', harm: 20, text: 'Nobody in the company can sign in until it is reconnected.' },
  { action: 'isolate', target: 'PROXY-01', good: false, points: 0, label: 'Isolate the gateway', harm: 12, text: 'The whole office loses internet access, including the evidence you needed from its logs.' },
  { action: 'disable', target: 'jonas.b', good: false, points: 0, label: 'Disable Jonas', harm: 2, text: 'Jonas cannot work, and a password reset would have been enough.' },
  { action: 'disable', target: 'dee.k', good: false, points: 0, label: 'Disable Dee', harm: 4, text: 'The IT administrator is locked out. Dee\'s remote session was an approved change (CHG-1190).' },
  { action: 'block-ip', target: '198.51.100.150', good: false, points: 0, label: 'Block the cloud storage provider', harm: 4, text: 'Everyone\'s synced documents stop working. This is the approved cloud storage, and the 11:00 transfer was ordinary.' },
  { action: 'notify', target: 'Whole company', good: false, points: 0, label: 'Email the whole company', harm: 2, text: 'A company-wide email goes out before the facts are known, and staff start guessing who was affected.' },
];

const defaults = {
  memory: { text: 'A memory capture is taken. It was not needed here and it cost time.' },
  image: { text: 'An image is taken. It was not needed here and it cost time.' },
  logs: { text: 'The logs are exported.' },
  isolate: { harm: 4, text: 'The host is cut off from the network. Nothing showed it was involved, and its user cannot work.' },
  disable: { harm: 3, text: 'The account is disabled. Nothing showed it was involved, and its owner cannot work.' },
  reset: { harm: 1, text: 'The user is forced to change their password. Nothing showed they were involved.' },
  'block-ip': { harm: 1, text: 'The address is blocked. Nothing showed it was involved.' },
  'block-domain': { text: 'The domain is blocked at the proxy. Nobody will be able to download from that site again.' },
  poweroff: { harm: 2, text: 'The machine is switched off. Nothing showed it was involved.' },
  clean: { harm: 2, text: 'Files are deleted. Nothing showed they mattered.' },
  reimage: { harm: 6, text: 'The machine is rebuilt. Nothing showed it was involved, and its user loses an hour.' },
  notify: { text: 'Done.' },
};

// ── The events ──────────────────────────────────────────────────
// Events recorded on the laptop itself can be destroyed. They are lost when the clean-up routine runs at
// 12:15 (unless a copy was taken first) or if the laptop is rebuilt, and they stay visible only if the logs
// or an image were taken first. Gateway, file server and directory logs are kept centrally and survive.
const local = { lostBy: 'e-wipe', lostWhen: [`reimage:${LAPTOP}`], keptBy: [`image:${LAPTOP}`, `logs:${LAPTOP}`] };
const B = { host: LAPTOP, user: 'jonas.b' };

const story = [
  { id: 'e-logon', t: m(7, 50), type: 'logon', ...B, sev: 'info', summary: 'jonas.b signed in to WS-PRO-05', fields: { logon: 'interactive', src: 'local' } },
  { id: 'e-dns', t: m(7, 58), type: 'dns', ...B, sev: 'low', summary: 'WS-PRO-05 looked up freepdf-tools.example', fields: { domain: 'freepdf-tools.example' } },
  { id: 'e-dl', t: m(7, 58), type: 'web', host: 'PROXY-01', user: 'jonas.b', sev: 'medium', key: 'download', summary: 'jonas.b downloaded PDFOptimizerSetup.exe (4.8 MB) from freepdf-tools.example', fields: { domain: 'freepdf-tools.example', file: 'PDFOptimizerSetup.exe', bytes: 5033164, src: LAPTOP } },
  { id: 'e-run', t: m(8, 1), type: 'process', ...B, sev: 'medium', key: 'install', ...local, summary: 'PDFOptimizerSetup.exe started by explorer.exe', fields: { pid: 6100, ppid: 4100, proc: 'PDFOptimizerSetup.exe', parent: 'explorer.exe', file: 'PDFOptimizerSetup.exe', cmd: 'PDFOptimizerSetup.exe' } },
  { id: 'e-drop', t: m(8, 1), type: 'file', ...B, sev: 'medium', key: 'install', ...local, summary: 'PDFOptimizerSetup.exe wrote pdfhelper.exe to AppData\\Roaming\\PDFHelper', fields: { file: 'pdfhelper.exe', proc: 'PDFOptimizerSetup.exe', path: 'C:\\Users\\jonas.b\\AppData\\Roaming\\PDFHelper' } },
  { id: 'e-sch', t: m(8, 2), type: 'process', ...B, sev: 'medium', key: 'persist', ...local, summary: 'PDFOptimizerSetup.exe created the scheduled task "PDFUpdate" (runs pdfhelper.exe at every sign-in)', fields: { pid: 6130, ppid: 6100, proc: 'schtasks.exe', parent: 'PDFOptimizerSetup.exe', cmd: 'schtasks /create (task: PDFUpdate)', file: 'pdfhelper.exe' } },
  { id: 'e-hlp', t: m(8, 3), type: 'process', ...B, sev: 'medium', key: 'install', ...local, summary: 'pdfhelper.exe started by PDFOptimizerSetup.exe', fields: { pid: 6150, ppid: 6100, proc: 'pdfhelper.exe', parent: 'PDFOptimizerSetup.exe', cmd: 'pdfhelper.exe', file: 'pdfhelper.exe' } },
  { id: 'e-cred', t: m(8, 41), type: 'process', ...B, sev: 'high', key: 'cred', ...local, summary: 'pdfhelper.exe read the browser\'s stored credentials', fields: { proc: 'pdfhelper.exe', action: 'credential store read' } },
  { id: 'e-fsread', t: m(9, 30), type: 'file', host: 'FS-03', user: 'jonas.b', sev: 'high', key: 'stage', summary: 'jonas.b read 340 files in Procurement\\Contracts in 16 minutes (usually 5 to 10 a day)', fields: { file: 'Procurement\\Contracts\\*', count: 340, src: LAPTOP } },
  { id: 'e-stage', t: m(9, 46), type: 'file', ...B, sev: 'high', key: 'stage', ...local, summary: 'pdfhelper.exe wrote C:\\Users\\jonas.b\\AppData\\Local\\Temp\\cache.dat (340 MB)', fields: { file: 'cache.dat', proc: 'pdfhelper.exe', bytes: 356515840 } },
  { id: 'e-tamper', t: m(9, 52), type: 'file', ...B, sev: 'high', key: 'tamper', ...local, summary: 'pdfhelper.exe changed the file dates on pdfhelper.exe and cache.dat to earlier dates', fields: { file: 'pdfhelper.exe cache.dat', proc: 'pdfhelper.exe', action: 'timestamp change' } },
  { id: 'e-exfil', t: m(10, 30), type: 'network', ...B, sev: 'high', key: 'exfil', summary: 'WS-PRO-05 sent 340 MB to 192.0.2.77 over 14 minutes', fields: { dst: '192.0.2.77', port: 443, bytes: 356515840, proc: 'pdfhelper.exe' } },
  { id: 'e-av', t: m(11, 20), type: 'alert', ...B, sev: 'medium', key: 'detect', keyWeight: 0, summary: 'ALERT: Endpoint protection flagged pdfhelper.exe as suspicious (not removed)', fields: { file: 'pdfhelper.exe', alert: 'AV-1' } },
  { id: 'e-wipe', t: m(12, 15), type: 'system', ...B, sev: 'high', summary: 'Windows event logs cleared on WS-PRO-05 by a scheduled routine', fields: { action: 'log clear', proc: 'pdfhelper.exe' }, unless: [`image:${LAPTOP}`, `logs:${LAPTOP}`], consequence: { cost: 8, label: 'The laptop\'s logs were cleared', prevented: 'the clean-up routine destroyed nothing, because you already held a copy', text: 'The clean-up routine already on the laptop ran at 12:15 and cleared its local logs. Whatever you had not copied was destroyed, and nothing you hold can prove it.' } },
];

// The program calls home every ten minutes until the laptop is isolated or the address blocked.
const beacon = [];
for (let t = m(8, 5); t <= m(12, 55); t += 10) {
  beacon.push({ id: `e-b${t}`, t, type: 'network', ...B, sev: t === m(8, 5) ? 'medium' : 'low', key: 'beacon', keyWeight: t === m(8, 5) ? 1 : 0, summary: `pdfhelper.exe connected to 192.0.2.77:443 (${t === m(8, 5) ? 'first time seen' : 'repeat'})`, fields: { proc: 'pdfhelper.exe', dst: '192.0.2.77', port: 443, bytes: 600 + (t % 11) * 17 }, unless: [`isolate:${LAPTOP}`, 'block-ip:192.0.2.77'] });
}

const distractors = [
  { id: 'e-it1', t: m(10, 0), type: 'logon', host: LAPTOP, user: 'dee.k', sev: 'low', summary: 'dee.k connected to WS-PRO-05 remotely from WS-IT-02 (software inventory, CHG-1190)', fields: { logon: 'remote', src: 'WS-IT-02' } },
  { id: 'e-it2', t: m(10, 2), type: 'process', host: LAPTOP, user: 'dee.k', sev: 'low', ...local, summary: 'dee.k ran inventory.exe on WS-PRO-05', fields: { pid: 6700, ppid: 4000, proc: 'inventory.exe', parent: 'remote-agent.exe', file: 'inventory.exe', cmd: 'inventory.exe /scan' } },
  { id: 'e-sync', t: m(11, 0), type: 'network', ...B, sev: 'low', summary: 'WS-PRO-05 sent 120 MB to 198.51.100.150 (approved cloud storage)', fields: { dst: '198.51.100.150', port: 443, bytes: 125829120, proc: 'cloudsync.exe' } },
];

// Ordinary activity, generated from a fixed seed so every run of the assignment is identical.
function noise() {
  let seed = 20261021;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const people = [{ u: 'jonas.b', h: LAPTOP }, { u: 'priti.s', h: 'WS-PRO-02' }, { u: 'dee.k', h: 'WS-IT-02' }];
  const out = [];
  let n = 0;
  const pids = {};
  const add = (t, o) => out.push({ id: `n${++n}`, t, sev: 'info', ...(o.host === LAPTOP && (o.type === 'process' || o.type === 'file') ? local : {}), ...o });
  for (const p of people) {
    const t = m(7, 40) + Math.floor(rnd() * 25);
    if (p.h !== LAPTOP) add(t, { type: 'logon', host: p.h, user: p.u, summary: `${p.u} signed in to ${p.h}`, fields: { logon: 'interactive', src: 'local' } });
    add(t + 1, { type: 'process', host: p.h, user: p.u, summary: `${p.u} started explorer.exe on ${p.h}`, fields: { pid: 4100, ppid: 1, proc: 'explorer.exe', parent: 'winlogon.exe', cmd: 'explorer.exe' }, ...(p.h === LAPTOP ? { lostBy: undefined, lostWhen: undefined, keptBy: undefined } : {}) });
    pids[p.h] = 7000;
  }
  const domains = ['intranet.contoso.example', 'mail.contoso.example', 'news.example', 'suppliers.example', 'docs.contoso.example', 'weather.example', 'travel.example'];
  const files = ['Budget_FY27.xlsx', 'Supplier_list.xlsx', 'Minutes_Oct.docx', 'Rota.xlsx', 'Policy_v3.docx', 'PO_88112.pdf', 'PO_88201.pdf'];
  const procs = ['chrome.exe', 'outlook.exe', 'excel.exe', 'teams.exe', 'acrobat.exe'];
  for (let t = m(7, 55); t < m(12, 55); t += 7 + Math.floor(rnd() * 11)) {
    const p = pick(people);
    const k = rnd();
    if (k < 0.34) {
      const d = pick(domains);
      add(t, { type: 'dns', host: p.h, user: p.u, summary: `${p.h} looked up ${d}`, fields: { domain: d } });
    } else if (k < 0.55) {
      const f = pick(files);
      add(t, { type: 'file', host: 'FS-03', user: p.u, summary: `${p.u} opened ${f} on FS-03`, fields: { file: f } });
    } else if (k < 0.82) {
      const proc = pick(procs);
      add(t, { type: 'process', host: p.h, user: p.u, summary: `${p.u} started ${proc} on ${p.h}`, fields: { pid: pids[p.h]++, ppid: 4100, proc, parent: 'explorer.exe', cmd: proc } });
    } else {
      const dst = `192.0.2.${100 + Math.floor(rnd() * 40)}`;
      add(t, { type: 'web', host: 'PROXY-01', user: p.u, summary: `${p.u} browsed to ${pick(domains)} via the proxy`, fields: { src: p.h, dst, bytes: 3000 + Math.floor(rnd() * 80000) } });
    }
  }
  for (let i = 0; i < 3; i++) add(m(8, 10) + i * 80 + Math.floor(rnd() * 30), { type: 'logon', host: 'DC-01', user: pick(people).u, summary: 'Failed sign-in (wrong password), then succeeded', fields: { logon: 'failed-then-ok' } });
  return out;
}

const events = [...story, ...beacon, ...distractors, ...noise()];

// ── The scenario ────────────────────────────────────────────────
export const DFIR_LAPTOP = {
  id: 'dfir-laptop',
  title: 'The laptop that kept its secrets',
  workspace: 'dfir',
  path: 'dfir',
  pathLabel: 'Incident Response and Forensics',
  blurb: 'Endpoint protection flagged a manager\'s laptop. Reconstruct what happened and when, preserve the evidence properly, contain it and report. Before the laptop clears its own logs.',
  brief: [
    'It is 11:30 on Tuesday. At 11:20 endpoint protection flagged a program on Jonas\'s laptop and did nothing more. IT has not touched the machine. You have been asked to work out what happened, when it started, what was taken, and what to do about it.',
    'The machine is evidence. Everything you do to it changes it, and some of what is on it can be lost. Work out what to protect first, build a timeline you could defend to a manager or a regulator, and file your report.',
  ],
  clockStart: m(11, 30),
  horizon: m(13, 30),
  ui: {
    name: 'Contoso forensics bench',
    nav: ['brief', 'logs', 'entities', 'tree', 'map', 'respond', 'case', 'report'],
    labels: { entities: 'Files & accounts', respond: 'Preserve & contain' },
    treeHost: LAPTOP,
    examples: ['host:WS-PRO-05 sev:high', 'file:pdfhelper', 'ip:192.0.2.77', 'proc:pdfhelper.exe', 'type:process', 'domain:freepdf-tools.example', 'user:jonas.b'],
    searchHint: 'host:WS-PRO-05   file:pdfhelper   ip:192.0.2.77   proc:schtasks   or plain words',
    toolkit: [
      ['Case brief', 'The referral, what is known so far and what you are asked for.'],
      ['Log search', 'Search events from the laptop and from the gateway, file server and directory. Each search takes a minute.'],
      ['Files & accounts', 'Open a file to see its four dates: Created, Modified, Accessed and Record changed. They should tell one story. When they do not, ask why.'],
      ['Process tree', 'See what started what on the laptop. Evidence kept on the laptop can disappear.'],
      ['Network map', 'See where the laptop talked to, and how much it sent.'],
      ['Preserve & contain', 'Capture memory, image the disk, export logs, isolate, block, reset. Some quick fixes destroy evidence.'],
      ['Case file', 'Pin the events that build a defensible timeline. It is sorted by time.'],
    ],
    briefPanel: {
      heading: 'Referral: WS-PRO-05',
      paragraphs: ['Endpoint protection raised a detection on Jonas B.\'s laptop at 11:20 and has not removed anything. Jonas says it has been "a bit slow since this morning" and mentions that he installed a PDF tool.', 'IT used the laptop remotely at 10:00 for an approved software inventory, so some activity on it will not be the attacker\'s.'],
      known: ['11:20: endpoint protection flagged pdfhelper.exe as suspicious.', 'The laptop is on, signed in and still connected to the network.', 'Local logs on the laptop are not yet backed up.', 'Nobody has run anything on it since the alert.'],
      asks: ['Work out how it began and when, using the logs rather than the dates shown on the files.', 'Find out what was reached or taken, and whether it left the network.', 'Preserve the evidence and contain the machine without causing more harm.', 'File a report a manager could act on and a regulator could examine.'],
    },
    tips: {
      brief: 'Read the referral first. Everything on the laptop is evidence, and some of it will not be there at the end of the afternoon.',
      logs: 'Search the logs. Events recorded on the laptop itself can be destroyed; gateway, file server and directory logs are kept elsewhere.',
      entities: 'Open a file to compare its four dates with what the logs say. Normal files tell one story; ask what it means when they do not.',
      tree: 'A process tree shows what started what. Ask what a downloaded installer has started, and what is still running because of it.',
      map: 'Thicker links carry more data. One link here is far larger than anything this laptop normally sends.',
      respond: 'Evidence first, then containment, then clean-up, in that order. Powering off, deleting files or rebuilding the machine cannot be undone.',
      case: 'Your timeline is sorted by time, but it only shows what you pinned. A defensible timeline has no gaps you cannot explain.',
      report: 'Your report is graded against what really happened. Use times from the logs, not from the dates on the files.',
    },
    groupLabels: { evidence: 'Timeline evidence', response: 'Preserve and contain' },
  },
  entities,
  targets,
  actions,
  responses,
  defaults,
  events,
  alerts: [],
  roleLabels: {
    download: 'the installer being downloaded from a lookalike site',
    install: 'the installer running and dropping its program',
    persist: 'the scheduled task that keeps it running',
    beacon: 'the first call to 192.0.2.77',
    cred: 'the stored credentials being read',
    stage: 'the contract files being read and gathered',
    tamper: 'the file dates being changed',
    exfil: 'the 340 MB leaving for 192.0.2.77',
  },
  roleHints: {
    download: 'Search domain:freepdf-tools.example or type:web.',
    install: 'The process tree for WS-PRO-05 shows what the installer started. If it is not there, the laptop\'s logs were not preserved in time.',
    persist: 'Search proc:schtasks, or look at what started under the installer.',
    beacon: 'Search ip:192.0.2.77 and look at the earliest result.',
    cred: 'Search host:WS-PRO-05 sev:high.',
    stage: 'Search file:Contracts or file:cache.dat.',
    tamper: 'Search file:pdfhelper and compare with the file\'s dates under Files & accounts.',
    exfil: 'Search ip:192.0.2.77 and look at the largest transfer, or open the network map.',
  },
  report: [
    { id: 'entry', kind: 'choice', title: 'Entry point', label: 'How did the attacker get in?', options: [['fake-installer', 'A fake software installer the user ran'], ['phishing-email', 'A phishing email attachment'], ['stolen-password', 'A stolen or reused password'], ['usb', 'An infected USB drive'], ['vulnerability', 'An unpatched vulnerability']], truth: 'fake-installer', points: 6, note: 'It began with a free PDF tool from a lookalike site that Jonas downloaded and ran at 08:01.' },
    { id: 'first', kind: 'time', title: 'First compromise', label: 'When did the attacker\'s program first run on the laptop? (HH:MM)', hint: 'Use the logs, not the dates shown on the files.', truth: m(8, 1), tolerance: 5, near: 60, points: 6, note: 'The installer ran at 08:01. The March 2025 date on the file was forged, and 11:20 was only when it was noticed.' },
    { id: 'data', kind: 'set', title: 'Data taken', label: 'What did the attacker take or reach?', options: [['contracts', 'Procurement contract files (340)'], ['payroll', 'Payroll records'], ['customers', 'Customer database'], ['mailbox', 'The user\'s mailbox'], ['creds', 'Stored browser credentials']], truth: ['contracts', 'creds'], points: 5, note: 'The 340 contract files were gathered and sent, and the stored credentials were read. Nothing shows payroll, customers or the mailbox were touched.' },
    { id: 'exfil', kind: 'choice', title: 'Data left the network', label: 'Did the data leave the network?', options: [['yes', 'Yes: it was sent out'], ['no', 'No: it was only gathered'], ['unknown', 'Cannot tell from the evidence']], truth: 'yes', points: 4, note: '340 MB went to 192.0.2.77 at 10:30. The 11:00 transfer to the cloud storage provider was ordinary.' },
    { id: 'persist', kind: 'set', title: 'Persistence', label: 'What was left behind to keep access?', options: [['task', 'A scheduled task (PDFUpdate)'], ['program', 'A program in the user\'s AppData folder'], ['admin', 'A new administrator account'], ['firewall', 'Changed firewall rules'], ['startup', 'Startup entries for all users']], truth: ['task', 'program'], points: 5, note: 'The scheduled task and the program in AppData. Nothing shows new accounts, firewall changes or system-wide startup entries.' },
    { id: 'hosts', kind: 'set', title: 'Affected hosts', label: 'Machines affected', from: 'host', truth: [LAPTOP], points: 5, note: 'Only the laptop was compromised. FS-03 was read using Jonas\'s account but was not itself compromised.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary', minLength: 40, points: 4, placeholder: 'What happened and when, what was taken, what you preserved and what you recommend. Another responder should be able to rely on it.' },
  ],
  grading: { triage: 0, evidence: 35, response: 30, reportTotal: 35, harmScale: 1.2, cap: 'The laptop\'s logs were cleared before you took a copy. A good analysis does not make up for evidence you let be destroyed.', gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'dfir-dates',
      question: 'pdfhelper.exe shows a Created date of March 2025, but the logs show it appearing this morning. What does its "Record changed" time of 09:52 suggest?',
      options: [
        { text: 'Someone altered the file\'s dates at 09:52, so the dates on the file cannot be trusted and the logs must be used instead', correct: true, explain: 'Created and Modified can be set to anything, but the record of the change is left behind. When dates disagree with the logs, trust the logs and ask who changed them.' },
        { text: 'The file was created in March 2025 and run for the first time this morning', correct: false, explain: 'That could be true of a normal file, but the logs show it being written at 08:01 and a log entry shows its dates being changed at 09:52.' },
        { text: 'The clock on the laptop was wrong', correct: false, explain: 'Other events on the laptop agree with the gateway and server logs, so the clock was fine.' },
        { text: 'Record changed times are always when the file was last opened', correct: false, explain: 'Last opened is the Accessed date. Record changed is when the file\'s own record was last edited.' },
      ],
    },
    {
      id: 'dfir-order',
      question: 'Why take a copy of the laptop\'s logs and disk before doing anything else to it, even though isolating it was quick?',
      options: [
        { text: 'Evidence on the machine can be changed or destroyed, and a fingerprinted copy keeps it usable. Isolating does not stop a clean-up routine already on the laptop', correct: true, explain: 'Isolation cuts the attacker off from outside, but it does not remove anything already installed. A routine on the laptop could still wipe its logs.' },
        { text: 'Because isolating a machine always deletes its logs', correct: false, explain: 'It does not. Isolation leaves memory and disk intact.' },
        { text: 'Because the regulator requires an image of every laptop', correct: false, explain: 'There is no such general rule. Preservation matters because you may need the evidence later.' },
        { text: 'It makes no difference, because the gateway logs have everything', correct: false, explain: 'The gateway shows the connections, not what ran on the laptop, which files were changed or how.' },
      ],
    },
  ],
  story: [
    '07:58 Jonas downloads a free PDF tool from a lookalike site registered nine days earlier.',
    '08:01 He runs it. It drops pdfhelper.exe in AppData and creates the scheduled task "PDFUpdate" so the program restarts at every sign-in.',
    '08:05 The program starts calling 192.0.2.77 every ten minutes. At 08:41 it reads the browser\'s stored credentials.',
    '09:30 Jonas\'s account reads 340 files in Procurement\\Contracts. By 09:46 the laptop holds them in one 340 MB file in Temp.',
    '09:52 The program changes the dates on itself and on the big file to look old (March 2025 and November 2024). The 09:52 record change gives it away.',
    '10:30 The 340 MB file is sent to 192.0.2.77. IT\'s inventory at 10:00 and the cloud sync at 11:00 were ordinary.',
    '11:20 Endpoint protection flags the program. At 12:15, if nobody has taken a copy, a routine on the laptop clears its logs.',
  ],
};
