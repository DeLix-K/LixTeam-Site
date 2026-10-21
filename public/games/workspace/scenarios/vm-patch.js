// Vulnerability Management workspace, assignment 1: "Patch day with half the team".
// Everything here is fictional. Product names are generic on purpose; addresses come from the documentation ranges.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   09:00  The weekly scan lands: 16 findings on 14 assets. There are 20 hours of remediation time today.
//   09:45  An intrusion sensor sees exploit attempts against the public web server (F101). If it is not protected
//          by 10:45, it is compromised.
//   09:50  A vendor advisory says the VPN appliance flaw (F104) is now being exploited. If it is not protected by
//          11:30, the VPN is compromised.
//   Two findings are false positives, one asset cannot be patched at all, and the finding with the highest CVSS
//   score (the print spooler) is on the least valuable machine in the company.
// A finding's true risk is hidden. The player sees CVSS, then learns more by opening it: the asset's value, whether it
// is reachable, whether it is being exploited, and what already protects it.

const m = (h, mi = 0) => h * 60 + mi;

const asset = (id, name, role, a, facts) => ({ id, kind: 'asset', name, role, asset: a, facts });
const entities = [
  asset('WEB-01', 'Public web server', 'Serves the shop and the company site', { crit: 4, exposure: 'internet', owner: 'Platform team', data: 'Public content and session data', controls: ['A web application firewall sits in front of it'] }, ['Reachable from anywhere on the internet.', 'Behind a web application firewall that can be given new rules in minutes.']),
  asset('PAY-APP', 'Payment application', 'Takes card payments for the shop', { crit: 5, exposure: 'internal', owner: 'Applications team', data: 'Card payment data', controls: ['Only WEB-01 and the finance network can reach it'] }, ['Handles every customer payment.', 'Only reachable through WEB-01, so a compromised web server is a way in.']),
  asset('DB-CUST', 'Customer database', 'Names, addresses and orders', { crit: 5, exposure: 'internal', owner: 'Data team', data: 'Personal data for 400,000 customers', controls: ['Allowed from the application servers only'] }, ['The most valuable data the company holds.']),
  asset('MAIL-GW', 'Mail gateway', 'Filters inbound and outbound email', { crit: 4, exposure: 'internet', owner: 'Platform team', data: 'All email in transit', controls: ['Mail filtering and sandboxing'] }, ['Reachable from the internet on mail ports only.']),
  asset('VPN-01', 'Remote access gateway', 'The VPN for staff and contractors', { crit: 5, exposure: 'internet', owner: 'Network team', data: 'Gateway to the internal network', controls: [] }, ['Reachable from anywhere. Everyone working remotely uses it.']),
  asset('FS-HR', 'HR file server', 'Staff records', { crit: 4, exposure: 'internal', owner: 'Platform team', data: 'Staff personal records', controls: ['Segmented from the general network'] }, ['Holds personal records for every employee.']),
  asset('DC-01', 'Domain controller', 'Runs sign-in for the whole company', { crit: 5, exposure: 'internal', owner: 'Platform team', data: 'Every account and password hash', controls: ['Administrators only; no internet access'] }, ['If it falls, everything falls.']),
  asset('WS-FLEET', 'Office laptops', '200 managed laptops', { crit: 2, exposure: 'internal', owner: 'Desktop team', data: 'Individual users\' files', controls: ['Endpoint protection on every laptop'] }, ['Receive email and open documents all day.']),
  asset('PRINT-01', 'Print server', 'Office printing', { crit: 1, exposure: 'internal', owner: 'Desktop team', data: 'Print jobs', controls: ['No sensitive data stored; reachable from the office network only'] }, ['The least valuable machine on the scan.']),
  asset('INTRANET', 'Intranet wiki', 'Staff documentation', { crit: 2, exposure: 'internal', owner: 'Applications team', data: 'Internal documents', controls: ['Staff network only'] }, ['Internal pages and policies.']),
  asset('LEGACY-ERP', 'Legacy ERP server', 'Runs the old stock system', { crit: 3, exposure: 'internal', owner: 'Applications team', data: 'Stock and supplier data', controls: ['None specific'] }, ['Runs an operating system the vendor stopped supporting years ago. No patch exists.']),
  asset('TEST-01', 'Test server', 'Developer test lab', { crit: 1, exposure: 'isolated', owner: 'Applications team', data: 'Fake data', controls: ['Lab network with no route to production or the internet'] }, ['Isolated lab. Nothing real lives on it.']),
  asset('CAM-NVR', 'Camera recorder', 'Records the building cameras', { crit: 2, exposure: 'isolated', owner: 'Facilities', data: 'Video', controls: ['Cameras are on their own isolated VLAN'] }, ['Not reachable from the office network or the internet.']),
  asset('BUILD-01', 'Build server', 'Builds and ships the software', { crit: 3, exposure: 'internal', owner: 'Applications team', data: 'Source code and build secrets', controls: ['Developer network only'] }, ['Compiles the code that goes to production.']),
  { id: '203.0.113.20', kind: 'ip', name: 'External address', role: 'Unknown hosting provider', facts: ['Seen probing WEB-01 and VPN-01 this morning.'] },
];

const DRY_OK = 'Test environment: the change applies cleanly and nothing else is affected.';
const findings = [
  {
    id: 'F101', title: 'Remote code execution in the web framework', cvss: 9.8, asset: 'WEB-01', exploited: true, risk: 90,
    desc: 'A flaw in the web framework lets an unauthenticated visitor run code on the server.',
    verify: 'Verified by the scanner with a safe test request: the server is vulnerable.',
    options: [
      { id: 'patch', kind: 'patch', label: 'Patch the web framework', cost: 4, effect: 1, sets: ['protect:F101'], dry: DRY_OK, done: 'The framework is patched and the server restarted.' },
      { id: 'waf', kind: 'mitigate', label: 'Add a web application firewall rule for the exploit', cost: 1, effect: 0.7, sets: ['protect:F101'], dry: DRY_OK, done: 'The firewall now blocks the exploit pattern. The framework still needs patching later.' },
    ],
    good: ['patch', 'waf'], fine: [],
    why: 'It is internet-facing and being exploited right now. Even the one-hour firewall rule is worth far more than most patches.',
  },
  {
    id: 'F104', title: 'Remote code execution in the VPN appliance', cvss: 9.8, asset: 'VPN-01', exploitedFrom: m(9, 50), risk: 55, riskExploited: 88,
    desc: 'The VPN\'s web portal has a flaw that lets an unauthenticated visitor run code on the appliance.',
    verify: 'Verified by the scanner. Public exploit code exists.',
    options: [
      { id: 'patch', kind: 'patch', label: 'Install the vendor firmware update', cost: 5, effect: 1, sets: ['protect:F104'], harm: 1, harmText: 'The VPN restarted and remote staff were disconnected for ten minutes.', dry: 'Test environment: the update applies, with a ten-minute restart.', done: 'The VPN is updated.' },
      { id: 'portal', kind: 'mitigate', label: 'Switch off the vulnerable portal feature', cost: 1, effect: 0.8, sets: ['protect:F104'], harm: 1, harmText: 'Contractors lose the self-service portal until the next release.', dry: 'Test environment: the feature switches off cleanly, and contractors lose the self-service portal.', done: 'The vulnerable feature is off.' },
    ],
    good: ['patch', 'portal'], fine: [],
    why: 'A vendor advisory at 09:50 moved this from serious to urgent. Anyone who read the threat feed knew; anyone who only read the scan did not.',
  },
  {
    id: 'F103', title: 'Admin port on the customer database open to the network', cvss: 7.5, asset: 'DB-CUST', risk: 70,
    desc: 'The database\'s administration port accepts connections from any internal machine, with a weak authentication method.',
    verify: 'Verified from a test machine on the office network.',
    options: [{ id: 'restrict', kind: 'config', label: 'Restrict the admin port to the admin network', cost: 1, effect: 1, dry: DRY_OK, done: 'Only the admin network can reach the port.' }],
    good: ['restrict'], fine: [],
    why: 'A moderate score on the most valuable data the company holds, closed with a one-hour configuration change. The best return on the page.',
  },
  {
    id: 'F102', title: 'SQL injection in the payment application', cvss: 8.1, asset: 'PAY-APP', risk: 60,
    desc: 'One search form on the payment application does not sanitise its input.',
    verify: 'Verified by the scanner. It needs a route to the application, which a compromised web server would give.',
    options: [
      { id: 'patch', kind: 'patch', label: 'Patch the payment application', cost: 6, effect: 1, breaks: { harm: 3, rollback: 3, text: 'The patch broke the legacy checkout plugin: customers could not pay for twenty minutes until it was rolled back. The finding is still open.' }, dry: 'Test environment: the legacy checkout plugin crashes after this patch.' },
      { id: 'patchplug', kind: 'patch', label: 'Patch the application and update the checkout plugin', cost: 9, effect: 1, dry: 'Test environment: passes once the checkout plugin is updated as well.', done: 'Both are updated and checkout works.' },
      { id: 'filter', kind: 'mitigate', label: 'Add input filtering in front of the application', cost: 2, effect: 0.6, dry: DRY_OK, done: 'Requests to the vulnerable form are filtered.' },
    ],
    good: ['filter', 'patchplug'], fine: [],
    why: 'High value, but the straightforward patch breaks checkout. A dry run finds that for an hour of budget.',
  },
  {
    id: 'F107', title: 'Remote code execution through the office suite (document macros)', cvss: 8.8, asset: 'WS-FLEET', exploited: true, risk: 50,
    desc: 'Opening a crafted document can run code. The flaw is being used in phishing campaigns.',
    verify: 'Verified on a sample laptop. 200 laptops are affected.',
    options: [
      { id: 'push', kind: 'patch', label: 'Push the update to all laptops', cost: 3, effect: 1, dry: DRY_OK, done: 'The update is deployed to the fleet.' },
      { id: 'macros', kind: 'mitigate', label: 'Block macros from the internet by policy', cost: 1, effect: 0.7, harm: 1, harmText: 'Finance\'s macro-based spreadsheets stop working until they are signed.', dry: 'Test environment: the policy applies, and finance\'s unsigned spreadsheets stop opening.', done: 'Macros from the internet are blocked.' },
    ],
    good: ['push', 'macros'], fine: [],
    why: 'Each laptop is low value, but there are 200, the flaw is exploited and phishing reaches everyone.',
  },
  {
    id: 'F106', title: 'Privilege escalation on the domain controller', cvss: 7.8, asset: 'DC-01', risk: 45,
    desc: 'A local user can become a system administrator.',
    verify: 'Verified by the scanner. Needs a foothold on the machine first. Exploit code is public.',
    options: [{ id: 'patch', kind: 'patch', label: 'Patch the domain controller', cost: 3, effect: 1, dry: DRY_OK, done: 'The patch is installed and the server restarted.' }],
    good: ['patch'], fine: ['defer'],
    why: 'Needs a foothold first, but the machine controls every account in the company.',
  },
  {
    id: 'F110', title: 'Operating system no longer supported', cvss: 9.0, asset: 'LEGACY-ERP', risk: 40,
    desc: 'The vendor stopped supporting this operating system years ago. Several known flaws have no patch.',
    verify: 'Confirmed. There is nothing to patch.',
    options: [
      { id: 'segment', kind: 'mitigate', label: 'Put it in its own segment, reachable only from the stock team', cost: 3, effect: 0.8, dry: DRY_OK, done: 'The server is walled off. It is still unsupported.' },
      { id: 'replace', kind: 'patch', label: 'Replace it with a supported system', cost: 40, effect: 1, dry: 'Test environment: a migration project, not a change.', done: 'It is replaced.' },
    ],
    good: ['segment'], fine: ['defer'],
    why: 'There is nothing to patch, so the choices are to wall it off now and ask for money to replace it. Both belong in your plan.',
  },
  {
    id: 'F115', title: 'Outdated kernel on the HR file server', cvss: 6.7, asset: 'FS-HR', risk: 25,
    desc: 'A local privilege flaw in the operating system kernel.',
    verify: 'Verified by the scanner.',
    options: [
      { id: 'patch', kind: 'patch', label: 'Patch the server', cost: 3, effect: 1, breaks: { harm: 2, rollback: 2, text: 'The patch stopped the legacy backup agent, so the night\'s backup would have been missed. It was rolled back. The finding is still open.' }, dry: 'Test environment: the legacy backup agent stops working after this patch.' },
      { id: 'patchagent', kind: 'patch', label: 'Patch the server and update the backup agent', cost: 4, effect: 1, dry: 'Test environment: passes once the backup agent is updated as well.', done: 'Both are updated and the backup still runs.' },
    ],
    good: ['patchagent'], fine: ['defer'],
    why: 'Medium value and medium risk. Worth doing if budget allows, but the plain patch breaks the backups.',
  },
  {
    id: 'F108', title: 'Critical flaw in the print spooler', cvss: 9.8, asset: 'PRINT-01', risk: 14,
    desc: 'A remote code execution flaw in the print spooler service.',
    verify: 'Verified. The print server is reachable only from the office network and holds nothing sensitive.',
    options: [
      { id: 'patch', kind: 'patch', label: 'Patch the print server', cost: 2, effect: 1, dry: DRY_OK, done: 'The print server is patched.' },
      { id: 'stop', kind: 'mitigate', label: 'Stop the spooler service', cost: 0.5, effect: 1, harm: 1, harmText: 'Printing stops until the service is back.', dry: 'Test environment: the spooler stops cleanly, and nothing can print.', done: 'The service is stopped.' },
    ],
    good: ['accept', 'defer'], fine: ['patch', 'stop'],
    why: 'The highest score on the scan, on the least valuable machine in the company. Fixing it first is the classic mistake.',
  },
  {
    id: 'F105', title: 'Outdated TLS configuration on the mail gateway', cvss: 5.9, asset: 'MAIL-GW', risk: 12,
    desc: 'The gateway still offers old encryption protocols.',
    verify: 'Verified by the scanner. No known exploitation.',
    options: [{ id: 'tls', kind: 'config', label: 'Disable the old protocols', cost: 1, effect: 1, dry: DRY_OK, done: 'Old protocols are disabled.' }],
    good: ['tls'], fine: ['defer'],
    why: 'A cheap hardening change on an internet-facing system. Reasonable now or next cycle.',
  },
  {
    id: 'F112', title: 'Default credentials on the camera recorder', cvss: 9.8, asset: 'CAM-NVR', risk: 10,
    desc: 'The recorder still uses its factory username and password.',
    verify: 'Verified from the isolated camera VLAN.',
    options: [{ id: 'creds', kind: 'config', label: 'Change the credentials', cost: 0.5, effect: 1, dry: DRY_OK, done: 'The credentials are changed.' }],
    good: ['creds', 'accept', 'defer'], fine: [],
    why: 'Bad in general, but the recorder is on an isolated VLAN. A half-hour fix, so reasonable either way.',
  },
  {
    id: 'F111', title: 'Weak TLS configuration on the build server', cvss: 5.3, asset: 'BUILD-01', risk: 8,
    desc: 'The build server accepts weak cipher suites.',
    verify: 'Verified. Reachable from the developer network only.',
    options: [{ id: 'tlsb', kind: 'config', label: 'Tighten the cipher settings', cost: 1, effect: 1, dry: DRY_OK, done: 'The ciphers are tightened.' }],
    good: ['tlsb', 'accept', 'defer'], fine: [],
    why: 'Low risk on an internal system.',
  },
  {
    id: 'F109', title: 'Information disclosure in a wiki plugin', cvss: 4.3, asset: 'INTRANET', risk: 6,
    desc: 'A plugin shows page titles to users who should not see them.',
    verify: 'Verified. Staff network only.',
    options: [{ id: 'plugin', kind: 'patch', label: 'Update the plugin', cost: 1, effect: 1, dry: DRY_OK, done: 'The plugin is updated.' }],
    good: ['plugin', 'accept', 'defer'], fine: [],
    why: 'A low score on a low-value internal system.',
  },
  {
    id: 'F114', title: 'Vulnerable library on the test server', cvss: 8.8, asset: 'TEST-01', risk: 5,
    desc: 'An old library in a test application has known flaws.',
    verify: 'Verified. The lab has no route to production or the internet.',
    options: [{ id: 'lib', kind: 'patch', label: 'Update the library', cost: 1, effect: 1, dry: DRY_OK, done: 'The library is updated.' }],
    good: ['accept', 'defer', 'lib'], fine: [],
    why: 'A high score in an isolated lab with fake data. Nothing to protect.',
  },
  {
    id: 'F113', title: 'Directory listing enabled on the web server', cvss: 5.3, asset: 'WEB-01', fp: true, risk: 0,
    desc: 'The scanner found a directory with a listable index.',
    verify: 'The path is the public assets folder, which is meant to be listable. Nothing sensitive is in it.',
    options: [],
    good: ['fp'], fine: ['accept'],
    why: 'The "directory" is the public assets folder, which is supposed to be browsable. Fixing it would only break the website.',
  },
  {
    id: 'F116', title: 'SMBv1 enabled on the payment application server', cvss: 8.1, asset: 'PAY-APP', fp: true, risk: 0,
    desc: 'The scanner reports the old SMBv1 file-sharing protocol on this server.',
    verify: 'Port 445 is closed on this server and no file-sharing service runs. The scanner misread a banner.',
    options: [],
    good: ['fp'], fine: ['accept'],
    why: 'The server does not run file sharing at all. Checking the verification note would have shown that.',
  },
];

// ── The events: what the outside world is doing ─────────────────
const events = [
  { id: 'e-scan', t: m(9, 0), type: 'info', sev: 'info', summary: 'Weekly scan finished: 16 findings on 14 assets', fields: { findings: 16, assets: 14 } },
  { id: 'e-ti', t: m(9, 20), type: 'advisory', sev: 'medium', summary: 'Threat feed: phishing campaigns are delivering the office-suite macro flaw (F107)', fields: { finding: 'F107', source: 'threat feed' } },
  { id: 'e-ids1', t: m(9, 45), type: 'ids', sev: 'high', host: 'WEB-01', summary: 'Intrusion sensor: exploit attempts against WEB-01 matching the web framework flaw (F101), from 203.0.113.20', fields: { finding: 'F101', src: '203.0.113.20', dst: 'WEB-01', attempts: 14 } },
  { id: 'e-adv1', t: m(9, 50), type: 'advisory', sev: 'high', summary: 'Vendor advisory: the VPN appliance flaw (F104) is now being exploited in the wild', fields: { finding: 'F104', source: 'vendor advisory' } },
  { id: 'e-ids2', t: m(10, 5), type: 'ids', sev: 'high', host: 'WEB-01', summary: 'Intrusion sensor: 60 more exploit attempts against WEB-01 (F101)', fields: { finding: 'F101', src: '203.0.113.20', dst: 'WEB-01', attempts: 60 }, unless: ['protect:F101'] },
  { id: 'e-ids3', t: m(10, 30), type: 'ids', sev: 'high', host: 'VPN-01', summary: 'Intrusion sensor: scanning of VPN-01 for the portal flaw (F104), from 203.0.113.20', fields: { finding: 'F104', src: '203.0.113.20', dst: 'VPN-01' }, unless: ['protect:F104'] },
  { id: 'e-breach1', t: m(10, 45), type: 'incident', sev: 'high', host: 'WEB-01', summary: 'WEB-01 was compromised through the web framework flaw (F101)', fields: { finding: 'F101', src: '203.0.113.20', dst: 'WEB-01' }, unless: ['protect:F101'], consequence: { cost: 12, label: 'The public web server was compromised', prevented: 'the public web server was not compromised', text: 'The exploit attempts succeeded. WEB-01 was taken over, and from there an attacker could reach the payment application.' } },
  { id: 'e-breach2', t: m(11, 30), type: 'incident', sev: 'high', host: 'VPN-01', summary: 'VPN-01 was compromised through the portal flaw (F104)', fields: { finding: 'F104', src: '203.0.113.20', dst: 'VPN-01' }, unless: ['protect:F104'], consequence: { cost: 12, label: 'The VPN was compromised', prevented: 'the VPN was not compromised', text: 'The advisory was right: the VPN was taken over and an attacker had a path into the internal network.' } },
  { id: 'e-change', t: m(9, 5), type: 'info', sev: 'info', summary: 'Change board: emergency changes are allowed today for anything that is being exploited', fields: { source: 'change board' } },
  { id: 'e-team', t: m(9, 8), type: 'info', sev: 'info', summary: 'Rota: half the platform team is out today. You have 20 hours of remediation time in total', fields: { budget: 20 } },
  { id: 'e-rep', t: m(9, 30), type: 'info', sev: 'info', summary: 'Reputation service: 203.0.113.20 is a known scanner of internet-facing appliances', fields: { src: '203.0.113.20' } },
  { id: 'e-sensor', t: m(10, 0), type: 'info', sev: 'info', summary: 'Intrusion sensor: routine scanning from several addresses, no action needed', fields: {} },
  { id: 'e-win', t: m(12, 0), type: 'info', sev: 'info', summary: 'Maintenance window opens for servers that need a restart', fields: {} },
];

export const VM_PATCH = {
  id: 'vm-patch',
  title: 'Patch day with half the team',
  workspace: 'vm',
  path: 'vuln',
  pathLabel: 'Vulnerability Management',
  blurb: 'Sixteen findings, twenty hours, and an attacker already at the door. Decide what to fix, what to mitigate, what to accept and what is not even real.',
  brief: [
    'It is 09:00 on Tuesday. The weekly scan has landed with 16 findings across 14 assets. Half the platform team is out, so you have 20 hours of remediation time today, and every dry run, rollback and change eats into it.',
    'CVSS tells you how bad a flaw could be in general. It does not tell you how much it matters here. Open each finding, look at the asset behind it, check the threat feed, and decide what to fix, what to mitigate, what to accept with sign-off and what is a false positive. Then report to management.',
  ],
  clockStart: m(9, 0),
  horizon: m(13, 0),
  vm: { budget: 20, hourMinutes: 6, riskPoints: 35, findings },
  ui: {
    name: 'Contoso vulnerability console',
    nav: ['brief', 'queue', 'assets', 'logs', 'case', 'report'],
    labels: { logs: 'Threat feed', case: 'Plan' },
    noPins: true,
    examples: ['type:ids', 'type:advisory', 'sev:high', 'F101', 'WEB-01', '203.0.113.20'],
    searchHint: 'type:advisory   type:ids   F104   WEB-01   203.0.113.20   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known so far.'],
      ['Findings', 'Every finding on the scan. Open one to see the asset behind it, whether it is reachable and being exploited, and what already protects it. Sort the list. Decide: fix, mitigate, accept, defer, or mark as a false positive.'],
      ['Assets', 'What each asset is worth, how exposed it is and who owns it.'],
      ['Threat feed', 'What is happening outside right now: advisories, exploit attempts and reputation data. It changes the picture as the day goes on.'],
      ['Plan', 'Your decisions, your budget and what is still open.'],
    ],
    briefPanel: {
      heading: 'Referral: the weekly scan',
      paragraphs: ['The weekly scan found 16 issues on 14 assets. The security manager has asked you to turn it into a plan for today and a short report for management.', 'You have 20 hours of remediation time. Everything costs some of it: patching, mitigations, dry runs in the test environment, and rolling back a change that breaks something.'],
      known: ['CVSS scores run from 4.3 to 9.8.', 'The change board allows emergency changes today for anything being exploited.', 'Two of the 16 are suspected to be scanner mistakes, and one asset runs an operating system that can no longer be patched.', 'The threat feed and the intrusion sensor are live and will change during the day.'],
      asks: ['Decide what to do with every finding.', 'Spend the budget where it removes the most real risk, without breaking the business.', 'Do not waste hours on false positives or low-value machines.', 'Tell management what you did, what remains and what you need.'],
    },
    tips: {
      brief: 'Read the referral first. Score is how bad a flaw could be anywhere; risk is how much it matters here.',
      queue: 'Open a finding to see the asset, whether it is reachable and being exploited, and what protects it. The priority band only appears once you have looked. A dry run costs an hour but shows whether a change breaks something.',
      assets: 'What each asset is worth, how exposed it is and who owns it. Several low-score findings sit on the most valuable assets, and the highest score may sit on the least.',
      logs: 'The live threat feed. Advisories and exploit attempts change which findings matter. Something you read here at 09:50 may reshape your plan.',
      case: 'Your decisions and your budget. Hours spent on something low-value are hours not spent on something that matters.',
      report: 'Your report is graded against the true risk of each finding. Use what the feed and the assets told you, not the CVSS column.',
    },
    groupLabels: { triage: 'Decisions', response: 'Risk removed' },
  },
  entities,
  targets: {},
  actions: [],
  responses: [],
  defaults: {},
  events,
  alerts: [],
  roleLabels: {},
  roleHints: {},
  report: [
    { id: 'residual', kind: 'choice', title: 'Biggest danger', label: 'Which finding was the biggest danger to the business today?', options: findings.filter((f) => f.risk > 30).map((f) => [f.id, `${f.id} ${f.title}`]), truth: 'F101', points: 8, note: 'F101: internet-facing, already being exploited, on a business-critical server. F104 was close once the advisory landed.' },
    { id: 'why', kind: 'choice', title: 'Why not fix by CVSS', label: 'Why not simply fix the highest CVSS scores first?', options: [['context', 'CVSS measures how bad a flaw could be in general. What matters here is whether the asset is valuable, reachable and being exploited'], ['cvss-complete', 'CVSS already includes everything that matters, so highest first is correct'], ['inaccurate', 'Scanners are inaccurate, so scores mean nothing'], ['compliance', 'Only compliance deadlines matter']], truth: 'context', points: 5, note: 'The highest score on the scan was a print server with nothing on it, and one of the biggest dangers had a score of 7.5.' },
    { id: 'fps', kind: 'set', title: 'False positives', label: 'Which findings were false positives?', options: [['F113', 'F113 Directory listing on the web server'], ['F116', 'F116 SMBv1 on the payment server'], ['F105', 'F105 Outdated TLS on the mail gateway'], ['F112', 'F112 Default credentials on the camera recorder']], truth: ['F113', 'F116'], points: 6, note: 'F113 was a public folder meant to be listable, and F116 was a misread banner: port 445 is closed. The other two were real, but low-risk.' },
    { id: 'accept', kind: 'set', title: 'Reasonable to accept', label: 'Which real findings could reasonably be accepted or deferred with sign-off?', options: [['F108', 'F108 Print spooler flaw'], ['F109', 'F109 Wiki plugin disclosure'], ['F111', 'F111 Build server TLS'], ['F114', 'F114 Library on the test server'], ['F101', 'F101 Web framework flaw'], ['F103', 'F103 Customer database admin port']], truth: ['F108', 'F109', 'F111', 'F114'], points: 6, note: 'Low-value or isolated systems with little to protect. The web framework flaw and the database port are among the most dangerous.' },
    { id: 'ask', kind: 'choice', title: 'What to ask for', label: 'What would you ask management for?', options: [['retire', 'Funding to replace the unsupported ERP server, because it can never be patched'], ['scanner', 'A different scanner'], ['nothing', 'Nothing: the backlog is fine'], ['cvss24', 'A rule that every score of 9 or above is fixed within 24 hours, whatever it runs on']], truth: 'retire', points: 5, note: 'The unsupported ERP server will carry known flaws forever. Wall it off now and ask for the money to replace it.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary for management', minLength: 40, points: 5, placeholder: 'What you fixed and why, what you mitigated, what you accepted or deferred, what was a false positive, and what you need.' },
  ],
  grading: { triage: 30, evidence: 0, response: 35, reportTotal: 35, harmScale: 2, cap: 'An internet-facing system was compromised through a flaw you could have closed. A good backlog does not make up for that.', capAt: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'vm-cvss',
      question: 'The print spooler flaw had the joint highest score on the scan (9.8). Why was fixing it first a poor use of the budget?',
      options: [
        { text: 'The print server is the least valuable asset and is reachable only from the office, so little could be lost. The same hours on the web server, VPN or customer database removed far more risk', correct: true, explain: 'Risk is the flaw multiplied by what it could damage and how reachable it is. The score alone ignores both.' },
        { text: 'Print servers are never attacked', correct: false, explain: 'They can be. Here there was little to gain and a better use of every hour.' },
        { text: 'High scores are usually false alarms', correct: false, explain: 'Two false alarms were in the list, but this one was real. It just mattered less.' },
        { text: 'It could not be patched', correct: false, explain: 'A patch existed. The problem was the value of the asset.' },
      ],
    },
    {
      id: 'vm-dry',
      question: 'Patching the payment application directly took checkout down for twenty minutes. What would have avoided that?',
      options: [
        { text: 'A dry run in the test environment. It costs an hour but shows the incompatibility, so you choose the patch with the plugin update or a mitigation instead', correct: true, explain: 'Testing cost less than the outage and the rollback together. The hours you spend on a dry run are insurance on the valuable systems.' },
        { text: 'Not patching it at all', correct: false, explain: 'The finding was serious. The mitigation or the full patch with the plugin update was the answer.' },
        { text: 'Patching the web server first', correct: false, explain: 'The two are independent. The patch would still have broken checkout.' },
        { text: 'Nothing: patches always break something', correct: false, explain: 'Most patches here applied cleanly. The risk is concentrated in a few places, and a dry run finds them.' },
      ],
    },
  ],
  story: [
    '09:00 The scan lands: 16 findings, 20 hours. The highest score is on a print server with nothing on it.',
    '09:45 The intrusion sensor sees exploit attempts against the public web server. If it is not protected by 10:45 it is compromised.',
    '09:50 A vendor advisory says the VPN flaw is now being exploited. If it is not protected by 11:30 the VPN is compromised.',
    'The cheapest big wins were a one-hour configuration change on the customer database, a one-hour firewall rule for the web server and the VPN portal switch-off. Two findings were false positives and one asset can never be patched.',
  ],
};
