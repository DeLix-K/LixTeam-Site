// Network Security workspace, assignment 1: "The network with no walls".
// Everything here is fictional. Addresses come from the reserved documentation ranges.
//
// The story (kept here so the tests and the debrief can both use it):
//   13:48  A visiting contractor, Sam, joins the guest wifi with a laptop, LT-CONT-9.
//   13:52  The laptop, already infected, starts calling an outside address, 203.0.113.9, every five minutes.
//   13:55  It starts probing office laptops for remote desktop, a few every three minutes.
//   14:08  It copies about 2 GB from the finance file server over SMB, in 260 MB chunks every four minutes.
//   14:50  It starts sending the data out inside DNS queries to 203.0.113.53, every two minutes.
//   15:00 to 15:30  Four of those chunks are the ones that count: each one that gets out is a leak.
// The firewall has the same fault as many real ones: the guest wifi is not walled off from anything, and the
// only rules protect the inside from the internet. Services that must keep working are listed below, so a
// rule that is too broad breaks something real.

const m = (h, mi = 0) => h * 60 + mi;
const FW = 'FW-01';

// ── The world ───────────────────────────────────────────────────
const entities = [
  { id: 'sam.t', kind: 'user', name: 'Sam T.', role: 'Visiting contractor', facts: ['Contractor from Northwind Systems, on site for a day (visit pass 7).', 'Needs to reach the contractor portal on APP-01 and the internet, nothing else.'] },
  { id: 'dee.k', kind: 'user', name: 'Dee K.', role: 'IT administrator', facts: ['Works on LT-IT-02.', 'Administers FS-01 over remote desktop in the afternoon.'] },
  { id: 'LT-CONT-9', kind: 'host', zone: 'GUEST', name: 'Contractor laptop 9', role: 'Sam\'s laptop', facts: ['Not managed by Contoso: it is the contractor\'s own device.', 'Joined the guest wifi at 13:48 (DHCP lease 10.30.0.14).'], x: 9, y: 16 },
  { id: 'PH-G1', kind: 'host', zone: 'GUEST', name: 'Guest phone', role: 'A visitor\'s phone', facts: ['Browses the web through the guest wifi and uses the company DNS server.'], x: 21, y: 27 },
  { id: 'LT-FIN-03', kind: 'host', zone: 'CORP', name: 'Finance laptop 3', role: 'Office laptop', facts: ['Standard managed build.'], x: 9, y: 53 },
  { id: 'LT-HR-01', kind: 'host', zone: 'CORP', name: 'HR laptop 1', role: 'Office laptop', facts: ['Standard managed build.'], x: 21, y: 53 },
  { id: 'LT-SAL-02', kind: 'host', zone: 'CORP', name: 'Sales laptop 2', role: 'Office laptop', facts: ['Standard managed build.'], x: 9, y: 64 },
  { id: 'LT-IT-02', kind: 'host', zone: 'CORP', name: 'IT laptop 2', role: 'Dee\'s laptop', facts: ['Used for administration. Connects to FS-01 over remote desktop.'], x: 21, y: 64 },
  { id: 'FS-01', kind: 'host', zone: 'SERVERS', name: 'Finance file server', role: 'File server', facts: ['Holds the Finance share, including payroll exports and supplier contracts.', 'Business critical.'], x: 41, y: 14 },
  { id: 'APP-01', kind: 'host', zone: 'SERVERS', name: 'Application server', role: 'Payroll and contractor portal', facts: ['Runs the payroll application and the contractor portal.', 'Talks to DB-01 for payroll.'], x: 55, y: 14 },
  { id: 'DB-01', kind: 'host', zone: 'SERVERS', name: 'Database server', role: 'Payroll database', facts: ['Only APP-01 should connect to it.'], x: 41, y: 27 },
  { id: 'DNS-01', kind: 'host', zone: 'SERVERS', name: 'Company DNS server', role: 'Name resolver', facts: ['Every office and guest device asks it for names.', 'Asks the upstream resolver 192.0.2.8 when it does not know an answer.'], x: 55, y: 27 },
  { id: 'BK-01', kind: 'host', zone: 'SERVERS', name: 'Backup server', role: 'Backups', facts: ['Sends the weekly offsite backup to 198.51.100.150 at 14:30 (change record BKP-77).'], x: 48, y: 39 },
  { id: 'CAM-1', kind: 'host', zone: 'CCTV', name: 'Camera 1', role: 'Reception camera', facts: ['Streams video to NVR-01.'], x: 40, y: 63 },
  { id: 'CAM-2', kind: 'host', zone: 'CCTV', name: 'Camera 2', role: 'Car park camera', facts: ['Streams video to NVR-01.'], x: 49, y: 63 },
  { id: 'NVR-01', kind: 'host', zone: 'CCTV', name: 'Video recorder', role: 'Records the cameras', facts: ['Receives video from the cameras.'], x: 58, y: 63 },
  { id: 'WEB-01', kind: 'host', zone: 'DMZ', name: 'Public website', role: 'Web server', facts: ['Serves the company website to the internet.'], x: 84, y: 63 },
  { id: FW, kind: 'host', zone: 'CORE', name: 'Firewall', role: 'Joins every zone', facts: ['Decides every connection between zones. Rules are read from the top, and the first match wins.'], x: 50, y: 88 },
  { id: '203.0.113.9', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Unknown hosting provider', facts: ['First seen on the network at 13:52 today.', 'Not on any approved supplier list.'], x: 84, y: 9 },
  { id: '203.0.113.53', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Unknown name server', facts: ['Never used by the company\'s DNS server.', 'Hosts the name "cdn-sync.example".'], x: 84, y: 16 },
  { id: '198.51.100.150', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Backup provider', facts: ['The approved offsite backup provider.'], x: 84, y: 23 },
  { id: '192.0.2.8', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Upstream DNS resolver', facts: ['The resolver the company DNS server forwards to.'], x: 84, y: 30 },
  { id: '192.0.2.77', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Popular websites (CDN)', facts: ['Where ordinary browsing goes.'], x: 84, y: 37 },
  { id: '192.0.2.99', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Website visitors', facts: ['Members of the public visiting the company website.'], x: 84, y: 44 },
  { id: '198.18.0.5', kind: 'ip', zone: 'INTERNET', name: 'External address', role: 'Background internet scanner', facts: ['Probes every address on the internet all day, and gets nowhere.'], x: 70, y: 44 },
];
const hostIds = new Set(entities.filter((x) => x.kind === 'host').map((x) => x.id));
const zoneOf = (id) => (entities.find((x) => x.id === id) || {}).zone || 'INTERNET';

const zones = [
  { id: 'GUEST', label: 'Guest and contractor wifi', x: 2, y: 3, w: 26, h: 34 },
  { id: 'CORP', label: 'Office laptops', x: 2, y: 42, w: 26, h: 30 },
  { id: 'SERVERS', label: 'Servers', x: 34, y: 3, w: 30, h: 44 },
  { id: 'CCTV', label: 'Cameras', x: 34, y: 52, w: 30, h: 20 },
  { id: 'INTERNET', label: 'Internet', x: 68, y: 3, w: 30, h: 46 },
  { id: 'DMZ', label: 'Public web', x: 70, y: 52, w: 28, h: 20 },
];

const targets = {
  host: ['LT-CONT-9', 'PH-G1', 'LT-FIN-03', 'LT-HR-01', 'LT-SAL-02', 'LT-IT-02', 'FS-01', 'APP-01', 'DB-01', 'DNS-01', 'BK-01', 'CAM-1', 'CAM-2', 'NVR-01', 'WEB-01'],
  user: ['sam.t', 'dee.k'],
  contact: ['IT manager', 'Northwind Systems (the contractor\'s company)', 'Whole company'],
};

const actions = [{ id: 'notify', label: 'Notify', targetKind: 'contact', cost: 2, group: 'Tell people' }];
const responses = [
  { action: 'notify', target: 'IT manager', good: true, points: 3, label: 'Tell the IT manager', why: 'The IT manager owns the firewall policy and needs to know that the guest wifi has no walls and a machine on it is hostile.', text: 'The IT manager is told what you found and what you have changed, and agrees to review the guest policy.' },
  { action: 'notify', target: 'Northwind Systems (the contractor\'s company)', good: true, points: 2, label: 'Tell the contractor\'s company', why: 'Their laptop is compromised and will go on to infect other customers if nobody tells them.', text: 'Northwind Systems is told that Sam\'s laptop is compromised and asks for it to be collected and rebuilt.' },
  { action: 'notify', target: 'Whole company', good: false, points: 0, label: 'Email the whole company', harm: 2, text: 'A company-wide email goes out before the facts are known, and staff start guessing who was affected.' },
];
const defaults = { notify: { text: 'Done.' } };

// ── Services that must keep working ─────────────────────────────
const SERVICES = [
  { id: 'file-share', label: 'Office file sharing', flow: { src: 'LT-FIN-03', dst: 'FS-01', port: 445, proto: 'tcp' }, weight: 5, note: 'Finance, HR and Sales read and save documents on FS-01 over SMB.', every: 6 },
  { id: 'payroll', label: 'Payroll application to its database', flow: { src: 'APP-01', dst: 'DB-01', port: 1433, proto: 'tcp' }, weight: 6, note: 'Payroll runs on the 28th and cannot be late.', every: 5 },
  { id: 'dns-internal', label: 'Name lookups for the office', flow: { src: 'LT-FIN-03', dst: 'DNS-01', port: 53, proto: 'udp' }, weight: 4, note: 'Every office device asks DNS-01 for names.', every: 2 },
  { id: 'dns-forward', label: 'The company DNS server asking the upstream resolver', flow: { src: 'DNS-01', dst: '192.0.2.8', port: 53, proto: 'udp' }, weight: 5, note: 'If DNS-01 cannot reach 192.0.2.8, nobody can look up an outside name.', every: 3 },
  { id: 'cctv', label: 'Cameras streaming to the recorder', flow: { src: 'CAM-1', dst: 'NVR-01', port: 554, proto: 'tcp' }, weight: 4, note: 'Security footage stops being recorded.', every: 4 },
  { id: 'backup', label: 'Offsite backup', flow: { src: 'BK-01', dst: '198.51.100.150', port: 443, proto: 'tcp' }, weight: 4, note: 'The weekly offsite copy fails.', every: 60 },
  { id: 'public-web', label: 'The public website', flow: { src: '192.0.2.99', dst: 'WEB-01', port: 443, proto: 'tcp' }, weight: 6, note: 'Customers cannot reach the company website.', every: 3 },
  { id: 'staff-web', label: 'Staff browsing the web', flow: { src: 'LT-SAL-02', dst: '192.0.2.77', port: 443, proto: 'tcp' }, weight: 4, note: 'Staff lose the internet.', every: 3 },
  { id: 'admin-rdp', label: 'IT administering the file server', flow: { src: 'LT-IT-02', dst: 'FS-01', port: 3389, proto: 'tcp' }, weight: 3, note: 'IT cannot manage FS-01 remotely.', every: 30 },
  { id: 'contractor-portal', label: 'The contractor portal', flow: { src: 'LT-CONT-9', dst: 'APP-01', port: 443, proto: 'tcp' }, weight: 3, note: 'Sam cannot reach the one internal system the visit is for.', every: 20, start: m(13, 50), end: m(15, 50) },
  { id: 'guest-web', label: 'Guest browsing', flow: { src: 'PH-G1', dst: '192.0.2.77', port: 443, proto: 'tcp' }, weight: 2, note: 'Visitors lose the internet.', every: 5 },
  { id: 'guest-dns', label: 'Guest name lookups', flow: { src: 'PH-G1', dst: 'DNS-01', port: 53, proto: 'udp' }, weight: 2, note: 'Guest devices cannot look up names.', every: 5 },
];

// ── The events ──────────────────────────────────────────────────
const PORT_NAME = { 22: 'SSH', 53: 'DNS', 443: 'HTTPS', 445: 'SMB file sharing', 554: 'camera video', 1433: 'database', 3389: 'remote desktop' };
function fl(id, t, src, dst, port, proto, o = {}) {
  const { fields = {}, summary, ...rest } = o;
  return { id, t, type: 'flow', host: hostIds.has(src) ? src : dst, sev: 'info', summary: summary || `${src} to ${dst}:${port}/${proto} (${PORT_NAME[port] || port})`, fields: { src, dst, port, proto, szone: zoneOf(src), dzone: zoneOf(dst), ...fields }, flow: { src, dst, port, proto }, ...rest };
}

const LT = 'LT-CONT-9';
const attack = [
  { id: 'e-join', t: m(13, 48), type: 'dhcp', host: LT, user: 'sam.t', sev: 'low', key: 'source', summary: 'LT-CONT-9 joined the GUEST network (lease 10.30.0.14), owner sam.t, visit pass 7', fields: { zone: 'GUEST', lease: '10.30.0.14', pass: 7 } },
];
for (let t = m(13, 52); t <= m(15, 55); t += 5) {
  attack.push(fl(`e-c2-${t}`, t, LT, '203.0.113.9', 443, 'tcp', { sev: t === m(13, 52) ? 'medium' : 'low', key: 'c2', keyWeight: t === m(13, 52) ? 1 : 0, summary: `${LT} connected to 203.0.113.9:443 (${t === m(13, 52) ? 'first time seen' : 'repeat'})`, fields: { bytes_out: 820 + (t % 9) * 11, bytes_in: 1300, packets: 14, duration_s: 2, sni: 'updates-cdn.example' } }));
}
const scanTargets = ['LT-FIN-03', 'LT-HR-01', 'LT-SAL-02'];
for (let t = m(13, 55), i = 0; t <= m(14, 55); t += 3, i++) {
  attack.push(fl(`e-sc-${t}`, t, LT, scanTargets[i % 3], 3389, 'tcp', { sev: 'medium', key: 'scan', keyWeight: t === m(13, 55) ? 1 : 0, summary: `${LT} tried ${scanTargets[i % 3]}:3389 (remote desktop), refused`, fields: { bytes_out: 60, bytes_in: 40, packets: 2, duration_s: 0, flags: 'SYN, then RST', result: 'refused' } }));
}
for (let t = m(14, 8); t <= m(14, 40); t += 4) {
  attack.push(fl(`e-smb-${t}`, t, LT, 'FS-01', 445, 'tcp', { sev: 'high', key: 'smb', keyWeight: t === m(14, 8) ? 1 : 0, user: 'sam.t', summary: `${LT} read 262 MB from FS-01 over SMB (Finance share)`, fields: { bytes_out: 4100, bytes_in: 274726912, packets: 190000, duration_s: 210, direction: 'FS-01 to LT-CONT-9', share: 'Finance' } }));
}
// The first, small sign: a handful of DNS queries sent straight to an outside name server instead of the company's own.
attack.push(fl('e-dnsprobe', m(14, 5), LT, '203.0.113.53', 53, 'udp', { sev: 'medium', key: 'dnsexfil', summary: `${LT} sent 12 DNS queries straight to 203.0.113.53 (not the company DNS server)`, fields: { queries: 12, avg_name_len: 44, record: 'TXT', domain: 'cdn-sync.example', bytes_out: 1800, bytes_in: 2400 } }));
const LEAKS = [m(15, 0), m(15, 10), m(15, 20), m(15, 30)];
for (let t = m(14, 50); t <= m(15, 30); t += 2) {
  const leak = LEAKS.includes(t);
  attack.push(fl(`e-dns-${t}`, t, LT, '203.0.113.53', 53, 'udp', { sev: 'high', key: 'dnsexfil', keyWeight: 0, summary: `${LT} sent ${leak ? '9,800' : '4,100'} DNS queries to 203.0.113.53 (long names ending cdn-sync.example)`, fields: { queries: leak ? 9800 : 4100, avg_name_len: 61, record: 'TXT', domain: 'cdn-sync.example', bytes_out: leak ? 38000000 : 16000000, bytes_in: 800000 }, ...(leak ? { consequence: { cost: 4, label: 'Data leaked over DNS', prevented: 'none of the file server data left through DNS', text: 'Company files left the network inside DNS queries to 203.0.113.53. This is a data breach and the company must assess whether to report it.' } } : {}) }));
}

// Ordinary traffic for every service the company depends on, from a fixed seed.
function service() {
  let seed = 20261022;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out = [];
  for (const sv of SERVICES) {
    const start = sv.start || m(13, 0);
    const end = sv.end || m(15, 59);
    for (let t = start + Math.floor(rnd() * sv.every); t <= end; t += sv.every) {
      if (sv.id === 'backup' && t >= m(14, 0) && t < m(15, 0)) continue;
      const { src, dst, port, proto } = sv.flow;
      const bytes = Math.floor(2000 + rnd() * 90000);
      out.push(fl(`s-${sv.id}-${t}`, t, src, dst, port, proto, { fields: { bytes_out: bytes, bytes_in: Math.floor(bytes / 3), packets: Math.floor(bytes / 900), duration_s: 2 + Math.floor(rnd() * 5) } }));
    }
  }
  // the weekly offsite backup, a large transfer that is perfectly ordinary
  out.push(fl('s-backup-big', m(14, 30), 'BK-01', '198.51.100.150', 443, 'tcp', { sev: 'medium', summary: 'BK-01 sent 8.4 GB to 198.51.100.150 (approved offsite backup)', fields: { bytes_out: 9019431321, bytes_in: 90000, packets: 10000000, duration_s: 1500 } }));
  // the camera service uses both cameras
  for (let t = m(13, 1); t <= m(15, 59); t += 4) out.push(fl(`s-cctv2-${t}`, t, 'CAM-2', 'NVR-01', 554, 'tcp', { fields: { bytes_out: 3000000, bytes_in: 4000, packets: 2800, duration_s: 240 } }));
  // the internet knocks on the door and is turned away from the start
  for (let t = m(13, 5); t <= m(15, 55); t += 17) out.push(fl(`s-probe-${t}`, t, '198.18.0.5', rnd() < 0.5 ? 'FS-01' : 'LT-FIN-03', rnd() < 0.5 ? 445 : 3389, 'tcp', { fields: { bytes_out: 60, bytes_in: 0, packets: 1, duration_s: 0, flags: 'SYN' } }));
  return out;
}

const events = [...attack, ...service()];

// ── The scenario ────────────────────────────────────────────────
export const NET_FLAT = {
  id: 'net-flat',
  title: 'The network with no walls',
  workspace: 'net',
  path: 'network',
  pathLabel: 'Network Security',
  blurb: 'A contractor\'s laptop on the guest wifi is probing the office, copying the file server and about to send it out. Find the traffic, write the firewall rules and stop it without breaking the business.',
  brief: [
    'It is 14:20 on Tuesday. The firewall has only ever protected the inside from the internet: guest wifi, offices, servers and cameras can all reach each other. A contractor\'s laptop has been on the guest wifi since 13:48, and the logs look wrong.',
    'Read the flows, find what does not belong, and write firewall rules that stop it. Every rule takes effect from the moment you add it. Block too much and real services break: payroll, cameras, backups and the public website are all running through the same firewall.',
  ],
  clockStart: m(14, 20),
  horizon: m(16, 0),
  ui: {
    name: 'Contoso network console',
    nav: ['brief', 'logs', 'entities', 'topology', 'firewall', 'respond', 'case', 'report'],
    labels: { respond: 'Tell people' },
    examples: ['ip:203.0.113.9', 'host:LT-CONT-9', 'port:3389', 'port:53 sev:high', 'zone:GUEST', 'type:firewall', 'port:445'],
    searchHint: 'host:LT-CONT-9   ip:203.0.113.9   port:445   zone:GUEST   sev:high   or plain words',
    toolkit: [
      ['Case brief', 'The referral, what is known and what you are asked for.'],
      ['Log search', 'Every connection the firewall saw. Search by host, ip:, port:, proto:, zone:, sev: or plain words. Each search takes a minute. Click a flow to see its packet details.'],
      ['People & machines', 'Open a machine, address or account to see what it is and what it has been doing.'],
      ['Topology', 'The zones and how traffic moves between them. Select a flow and trace it hop by hop to see the firewall\'s decision.'],
      ['Firewall', 'Add, remove and reorder rules. Rules are read from the top and the first match wins. Test a connection before you rely on it, and watch the services panel.'],
      ['Case file', 'Pin the events that prove what happened.'],
    ],
    briefPanel: {
      heading: 'Referral: odd traffic on the network',
      paragraphs: ['A colleague noticed the file server was busier than usual this afternoon and asked someone to look at the firewall logs. The firewall has been in place for years and nobody has changed its rules since.', 'The logs show a lot of ordinary traffic. Some of it is not.'],
      known: ['The firewall has three rules, all blocking the internet from reaching the inside. Everything else is allowed.', 'A contractor, Sam, joined the guest wifi at 13:48 for a day on site.', 'IT\'s weekly offsite backup is running (change record BKP-77).', 'Payroll runs on the 28th and the cameras must keep recording.'],
      asks: ['Find the traffic that does not belong and the machine behind it.', 'Write firewall rules that stop it without breaking anything the business needs.', 'Record how far it got, and what should change permanently.'],
    },
    tips: {
      brief: 'Read the referral first. The firewall allows everything that is not explicitly denied, which is the fault behind most of what follows.',
      logs: 'Every connection the firewall saw is here. Scans, large transfers and traffic to places nobody uses are the ones to pin. Connections your rules have stopped show as denied.',
      entities: 'Open an address or machine to see what it is for. A device that talks to places it never has before is worth a closer look.',
      topology: 'Select a flow below the map and press Trace. A connection crosses its zone switch, the firewall, then the destination zone switch. The firewall is the only hop that can stop it.',
      firewall: 'Rules are read from the top and the first match wins. A broad deny above a narrow allow blocks the allow. Test a connection here before you rely on a rule, and keep an eye on the services panel.',
      respond: 'Tell the people who need to act. A company-wide email before the facts are known does harm.',
      case: 'Your evidence timeline, in time order.',
      report: 'Your report is graded against what really happened, and credit depends on the evidence you pinned.',
    },
    groupLabels: { evidence: 'Evidence pinned', response: 'Containment and services' },
  },
  entities,
  targets,
  actions,
  responses,
  defaults,
  events,
  alerts: [],
  net: {
    fw: FW,
    def: 'allow',
    zones,
    ports: [22, 53, 80, 443, 445, 554, 1433, 3389],
    test: { src: 'LT-CONT-9', dst: 'FS-01', port: 445, proto: 'tcp' },
    rules: [
      { id: 'R1', action: 'deny', src: 'INTERNET', dst: 'SERVERS', port: '*', proto: '*' },
      { id: 'R2', action: 'deny', src: 'INTERNET', dst: 'CORP', port: '*', proto: '*' },
      { id: 'R3', action: 'deny', src: 'INTERNET', dst: 'CCTV', port: '*', proto: '*' },
    ],
    services: SERVICES.map(({ every, start, end, ...rest }) => rest),
    threats: [
      { id: 'scan', label: 'the probing of office laptops for remote desktop', points: 8, flows: scanTargets.map((d) => ({ src: LT, dst: d, port: 3389, proto: 'tcp' })), why: 'A guest-zone machine has no business reaching office laptops. A deny from the guest zone (or from the contractor laptop) to the office zone closes it.' },
      { id: 'smb', label: 'the copy of the finance file server', points: 10, flows: [{ src: LT, dst: 'FS-01', port: 445, proto: 'tcp' }], why: 'File sharing from the guest zone to the servers should never have been possible. Deny the guest zone to the servers, keeping only the one thing the contractor needs.' },
      { id: 'c2', label: 'the calls to 203.0.113.9', points: 8, flows: [{ src: LT, dst: '203.0.113.9', port: 443, proto: 'tcp' }], why: 'It is the attacker\'s controlling address. Blocking it also protects any other machine that might call it.' },
      { id: 'dns', label: 'the DNS tunnel to 203.0.113.53', points: 14, flows: [{ src: LT, dst: '203.0.113.53', port: 53, proto: 'udp' }], why: 'Devices should only ask the company DNS server. Stopping port 53 out to the internet from everything except DNS-01 would close this, but DNS-01 itself must still be allowed to reach 192.0.2.8.' },
    ],
  },
  roleLabels: {
    source: 'the contractor laptop joining the guest wifi',
    c2: 'the first call to 203.0.113.9',
    scan: 'the probing of office laptops',
    smb: 'the copy of the file server',
    dnsexfil: 'the DNS tunnel to 203.0.113.53',
  },
  roleHints: {
    source: 'Search type:dhcp, or open LT-CONT-9.',
    c2: 'Search ip:203.0.113.9 and look at the earliest result.',
    scan: 'Search port:3389 zone:GUEST.',
    smb: 'Search host:FS-01 port:445 and look at the large transfers from the GUEST zone.',
    dnsexfil: 'Search port:53 and look for queries that go to 203.0.113.53 instead of the company DNS server, DNS-01.',
  },
  report: [
    { id: 'source', kind: 'choice', title: 'Source', label: 'Which machine is the source?', from: 'host', truth: 'LT-CONT-9', points: 5, note: 'LT-CONT-9, the contractor laptop on the guest wifi, made every one of the suspicious connections.' },
    { id: 'first', kind: 'time', title: 'First suspicious activity', label: 'When did it first call the outside address? (HH:MM)', hint: 'Use the first connection to the unfamiliar external address, not when the scanning began.', truth: m(13, 52), tolerance: 5, near: 30, points: 5, note: 'The first call to 203.0.113.9 was at 13:52.' },
    { id: 'zones', kind: 'set', title: 'Zones reached', label: 'Which zones did it reach?', options: [['GUEST', 'Guest and contractor wifi'], ['CORP', 'Office laptops'], ['SERVERS', 'Servers'], ['CCTV', 'Cameras'], ['DMZ', 'Public web']], truth: ['CORP', 'SERVERS'], points: 5, note: 'It probed office laptops and copied files from the server. Nothing shows it touched the cameras or the public web server.' },
    { id: 'types', kind: 'set', title: 'Kinds of traffic', label: 'What kinds of traffic were involved?', options: [['scan', 'Scanning for remote desktop'], ['smb', 'Copying files over file sharing'], ['c2', 'Calls to an outside controlling address'], ['dns-tunnel', 'Data hidden in DNS queries'], ['ddos', 'A flood of traffic to a server'], ['arp', 'Poisoning of local address tables'], ['brute', 'Guessing passwords on a login page']], truth: ['scan', 'smb', 'c2', 'dns-tunnel'], points: 6, note: 'Four kinds: scanning, file copying, calls to 203.0.113.9 and a DNS tunnel. There was no flood, no address poisoning and no password guessing.' },
    { id: 'cause', kind: 'choice', title: 'Why it was possible', label: 'Why was this possible?', options: [['flat', 'The guest wifi could reach internal systems: the network had no segmentation'], ['firewall-bug', 'A fault in the firewall software'], ['phish', 'An employee fell for a phishing email'], ['insider', 'A member of staff did it'], ['zero-day', 'A brand-new unpatched flaw in a server']], truth: 'flat', points: 5, note: 'The guest and contractor network could reach the office and the servers because nothing separated them.' },
    { id: 'fixes', kind: 'set', title: 'Permanent fixes', label: 'What should change permanently?', options: [['segment-guest', 'Keep guest and contractor devices on their own zone with no route to internal systems'], ['dns-egress', 'Only let the company DNS server ask outside resolvers'], ['default-deny', 'Deny between zones by default and allow only what is needed'], ['open-all', 'Open the firewall so nothing is blocked'], ['no-logs', 'Turn off firewall logging to reduce noise'], ['ban', 'Ban all contractors from the site']], truth: ['segment-guest', 'dns-egress', 'default-deny'], points: 5, note: 'Segment the guest zone, limit DNS to the company server and move to default-deny. The others would make things worse.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary', minLength: 40, points: 4, placeholder: 'What happened, which rules you added and why, what it cost, and what should change.' },
  ],
  grading: { triage: 0, evidence: 20, response: 45, reportTotal: 35, harmScale: 1, cap: 'Company data left the network through DNS before it was stopped. A good investigation does not make up for that.', capAt: 2, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'net-order',
      question: 'You add "Deny guest zone to servers, any port" and then "Allow guest zone to APP-01, port 443" above or below it. Which order lets the contractor still reach the portal?',
      options: [
        { text: 'The allow above the deny, because the firewall reads from the top and the first match wins', correct: true, explain: 'A broad deny above a narrow allow matches first and blocks the connection the allow was meant to permit. Specific exceptions go above the general rule.' },
        { text: 'The deny above the allow, because deny rules always win', correct: false, explain: 'There is no rule that denies always win. The first rule that matches decides.' },
        { text: 'Either order, because the firewall considers every rule', correct: false, explain: 'It stops at the first match. Later rules never see that connection.' },
        { text: 'It only works if both are in the same zone', correct: false, explain: 'Order matters for every rule, in any zone.' },
      ],
    },
    {
      id: 'net-dns',
      question: 'Why was "deny all DNS (port 53) to the internet" a bad rule on its own?',
      options: [
        { text: 'The company DNS server also uses port 53 to reach its upstream resolver, so everyone would lose name lookups. Allow it from DNS-01 above the deny, or restrict the deny to the guest zone', correct: true, explain: 'Blocking a protocol everywhere stops the legitimate use as well as the abuse. Scope the rule to who should not use it.' },
        { text: 'DNS is never used by attackers', correct: false, explain: 'It is a common channel for hiding data, which is why it was worth blocking here.' },
        { text: 'Port 53 is only used inside the company', correct: false, explain: 'The company DNS server uses it to reach outside resolvers every few minutes.' },
        { text: 'The firewall cannot block port 53', correct: false, explain: 'It can: the rule would work, which was the problem.' },
      ],
    },
  ],
  story: [
    '13:48 Sam, a visiting contractor, joins the guest wifi with a laptop. The laptop is already infected.',
    '13:52 It starts calling 203.0.113.9 every five minutes. From 13:55 it probes office laptops for remote desktop.',
    '14:08 It begins copying the finance file server over file sharing, 262 MB at a time, about 2 GB in all.',
    '14:50 It starts sending the data out inside DNS queries to 203.0.113.53. Every chunk sent from 15:00 is a leak.',
    'The fault underneath was a network with no walls: the guest wifi could reach everything. The backup transfer, the IT remote desktop session and the cameras were all ordinary.',
  ],
};
