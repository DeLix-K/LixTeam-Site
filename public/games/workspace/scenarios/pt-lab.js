// Penetration Tester workspace, assignment 1: "Four hours, five systems, one rulebook".
// Everything here is fictional: the company, the lab, the services and every result. Nothing in this file describes how
// to attack anything. A "scan" is a table of invented results, a "check" is a one-line outcome, and the point is what a
// professional does with them: stay inside the rules of engagement, use proportionate checks, collect evidence, stop and
// tell the client when something serious turns up, and report what the evidence supports at the right severity.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   Harbour Mutual, a small insurer, has hired you for a four-hour test of five named systems. The rules of engagement
//   list what is in scope, forbid password guessing, denial of service and opening real customer data, ask for gentle
//   scans only on the old printer, and say to stop and tell them at once if you find exposed personal data or signs that
//   someone else has already broken in.
//   The customer website links to a payment gateway that is not in scope (it belongs to the payment provider). Testing
//   it, even briefly, is a breach of the engagement. The old printer crashes under a fast scan. A backup file on the file
//   server holds real customer data: seeing that it is there and unprotected is the finding; opening it is a conduct breach.
//   Five real findings exist, each with evidence you must collect, a defensible severity, an impact and a good fix. Three
//   things look alarming but are expected behaviour: the findings you write about them are false positives.
//   Breaking the rules has consequences that arrive later in the shift and cap the medal at bronze.

const m = (h, mi = 0) => h * 60 + mi;

const evidence = [
  { id: 'ev-admin-page', label: 'The staff admin page is reachable from the internet' },
  { id: 'ev-default-cred', label: 'The vendor\'s documented default login is still accepted' },
  { id: 'ev-portal-banner', label: 'The website announces its software name' },
  { id: 'ev-http-redirect', label: 'The website redirects plain web traffic to the secure address' },
  { id: 'ev-backup-listed', label: 'A customer database backup is listed in a public folder' },
  { id: 'ev-backup-open', label: 'The backup can be requested without signing in' },
  { id: 'ev-brochures', label: 'A folder of public brochures is listable' },
  { id: 'ev-backup-contents', label: 'The backup contains real customer records (opened, which the rules forbid)' },
  { id: 'ev-wiki-version', label: 'The intranet wiki reports an old version number' },
  { id: 'ev-wiki-advisory', label: 'That version is covered by a published vendor security advisory' },
  { id: 'ev-prior-signs', label: 'The intranet audit log shows an unfamiliar admin account and logins from abroad' },
  { id: 'ev-jump-pw', label: 'The jump host accepts password sign-in' },
  { id: 'ev-jump-nomfa', label: 'The jump host asks for no second factor' },
  { id: 'ev-printer-panel', label: 'The printer\'s admin panel is reachable from the office network' },
  { id: 'ev-printer-default', label: 'The printer is still on its factory settings, with an address book anyone on the network can read' },
];

const hosts = [
  {
    id: 'portal', name: 'Customer portal', address: 'portal.harbour.example', inScope: true, listed: true, fragile: false,
    ask: 'The client confirms the portal is in scope. Staff use it too, so "the admin page" is theirs.',
    scan: { services: ['Secure website (443)', 'Plain website (80), redirects to 443'], evidence: ['ev-portal-banner'] },
    nodes: [
      { id: 'p-home', title: 'Portal home page', entry: true, links: ['p-admin', 'p-checkout'], evidence: [], text: 'A login box for customers and a footer that says "Powered by InsureDesk 4.2". A link in the footer leads to "Staff".' },
      { id: 'p-admin', title: 'Staff admin page', links: [], evidence: ['ev-admin-page'], text: 'A sign-in page for staff, titled "InsureDesk Administration". It is reachable from any address on the internet.' },
      { id: 'p-checkout', title: 'Pay your premium', links: [], evidence: [], text: 'A page explaining payments. The "Pay now" button hands you over to a payment gateway at pay.gatewaypro.example, run by a payment provider.' },
    ],
    checks: [
      { id: 'redirect', label: 'Look at what plain web traffic does', cost: 2, evidence: ['ev-http-redirect'], result: 'Plain web requests are sent straight to the secure address. This is how it should behave.' },
      { id: 'default', label: 'Try the vendor\'s documented default admin login once', cost: 3, evidence: ['ev-default-cred'], result: 'The sign-in is accepted. The vendor\'s default password was never changed. You stop there and note it.' },
      { id: 'guess', label: 'Run a password-guessing tool against the customer login', cost: 6, prohibited: 'brute', result: 'The rules of engagement forbid password guessing. The tool locks several customer accounts before you stop it.' },
    ],
  },
  {
    id: 'files', name: 'File server', address: 'files.harbour.example', inScope: true, listed: true, fragile: false,
    ask: 'The client confirms the file server is in scope, including the public folders. They remind you: do not open real customer data.',
    scan: { services: ['Web file listing (443)'], evidence: [] },
    nodes: [
      { id: 'f-index', title: 'File server index', entry: true, links: ['f-brochures', 'f-backup'], evidence: [], text: 'A plain list of folders: brochures/ and archive/.' },
      { id: 'f-brochures', title: 'brochures/', links: [], evidence: ['ev-brochures'], text: 'Marketing PDFs: policy guides, a claims leaflet, a price list. These are meant to be public.' },
      { id: 'f-backup', title: 'archive/', links: ['f-file'], trigger: 'pii', evidence: ['ev-backup-listed'], text: 'One item: customers_full_2024.sql.gz, 412 MB, last changed in March. It is a database backup, in a folder anyone can list.' },
      { id: 'f-file', title: 'customers_full_2024.sql.gz', links: [], real: true, evidence: ['ev-backup-contents'], text: 'You opened it. Real names, addresses, dates of birth and policy numbers. The rules said not to open real customer data: seeing that the file exists, and is exposed, was enough.' },
    ],
    checks: [
      { id: 'headonly', label: 'Ask for the backup\'s size and type without downloading it, signed out', cost: 2, evidence: ['ev-backup-open'], result: 'The server answers the request with the file\'s size and type. It did not ask who you are. You have not downloaded or opened it.' },
    ],
  },
  {
    id: 'intranet', name: 'Staff intranet wiki', address: 'wiki.harbour.internal', inScope: true, listed: true, fragile: false,
    ask: 'The client confirms the wiki is in scope. It is internal only: reachable from the office network and the test laptop.',
    scan: { services: ['Wiki web interface (8080)'], evidence: ['ev-wiki-version'] },
    nodes: [
      { id: 'i-wiki', title: 'Wiki home', entry: true, links: ['i-audit'], evidence: [], text: 'A staff wiki. The footer reads "WikiWorks 3.1". A link leads to the admin audit log.' },
      { id: 'i-audit', title: 'Admin audit log', links: [], trigger: 'prior', evidence: ['ev-prior-signs'], text: 'The log lists an admin account called "svc-backup2" created five weeks ago, which the client\'s IT team may not know about, with sign-ins from two countries where Harbour Mutual has no staff.' },
    ],
    checks: [
      { id: 'advisory', label: 'Compare the version number with the vendor\'s security advisories', cost: 3, evidence: ['ev-wiki-advisory'], result: 'The vendor\'s advisory list says versions up to 3.4 have a published security fix that this version does not have. You have not tried to use it.' },
    ],
  },
  {
    id: 'jump', name: 'Remote access host', address: 'jump.harbour.example', inScope: true, listed: true, fragile: false,
    ask: 'The client confirms the remote access host is in scope.',
    scan: { services: ['Remote shell (22)'], evidence: ['ev-jump-pw'] },
    nodes: [
      { id: 'j-banner', title: 'Sign-in banner', entry: true, links: [], evidence: [], text: 'The host greets you with a warning: "Authorised use only. All activity is logged."' },
    ],
    checks: [
      { id: 'auth', label: 'List which sign-in methods the host offers', cost: 2, evidence: ['ev-jump-nomfa'], result: 'The host offers a password and nothing else: no key, no second factor. Anyone with a stolen password could sign in from anywhere.' },
      { id: 'flood', label: 'Send a flood of connections to see how it copes', cost: 4, prohibited: 'dos', result: 'The rules forbid anything that could deny service. The host slows to a crawl, and staff working from home are cut off for ten minutes.' },
    ],
  },
  {
    id: 'printer', name: 'Office printer', address: '10.20.4.31', inScope: true, listed: true, fragile: true,
    ask: 'The client says the printer is old and has locked up under scans before: gentle scans only.',
    scan: { services: ['Printer admin web page (80)', 'Print service (9100)'], evidence: [] },
    nodes: [
      { id: 'pr-panel', title: 'Printer admin panel', entry: true, links: [], evidence: ['ev-printer-panel'], text: 'The printer\'s own settings page opens without asking who you are.' },
    ],
    checks: [
      { id: 'defaults', label: 'Check whether the factory settings were ever changed', cost: 2, evidence: ['ev-printer-default'], result: 'The factory settings are still in place, and the scan-to-email address book, with 40 staff addresses, can be read by anyone on the network.' },
    ],
  },
  {
    id: 'pay-gw', name: 'Payment gateway', address: 'pay.gatewaypro.example', inScope: false, listed: false, fragile: false, discoveredBy: ['p-checkout'],
    ask: 'The client says no: the gateway belongs to the payment provider, who has not agreed to be tested. Leave it alone. If you think there is something wrong with it, tell the client and they will tell the provider.',
    scan: { services: [], evidence: [] },
    nodes: [{ id: 'g-home', title: 'Gateway landing page', entry: true, links: [], evidence: [], text: 'A payment page run by a third party.' }],
    checks: [],
  },
];

const impact = (id, text) => ({ id, text });
const fix = (id, text, rating, why) => ({ id, text, rating, why: why || '' });

const truths = [
  {
    id: 'T1', host: 'portal', title: 'Staff admin page uses the vendor\'s default password', severity: 'high', seen: ['ev-admin-page', 'ev-default-cred'],
    requires: ['ev-admin-page', 'ev-default-cred'],
    hint: 'Find the staff page, then confirm the default login with a single, allowed check.',
    impact: 'admin-takeover',
    impacts: [
      impact('admin-takeover', 'Anyone on the internet could sign in as an administrator and read or change customer records'),
      impact('cosmetic', 'The admin page looks unprofessional'),
      impact('nothing', 'No impact: the page needs a login'),
    ],
    fixes: [
      fix('change-restrict', 'Change the password now, and limit the admin page to the office network and staff with a second factor', 'good'),
      fix('change-only', 'Change the default password', 'fine', 'A better password helps, but the page would still be open to the whole internet with only a password in front of it.'),
      fix('hide-url', 'Move the admin page to an address nobody knows', 'bad', 'Hiding an address is not access control: it will be found.'),
      fix('accept', 'Accept the risk', 'bad', 'The page lets someone take over the system. This is not a risk to accept.'),
    ],
  },
  {
    id: 'T2', host: 'files', title: 'Customer database backup downloadable without signing in', severity: 'critical', seen: ['ev-backup-listed'],
    requires: ['ev-backup-listed', 'ev-backup-open'],
    hint: 'See the backup in the listing, then ask for its size without downloading it, signed out. Opening it is a conduct breach.',
    impact: 'data-breach',
    impacts: [
      impact('data-breach', 'Anyone could download every customer\'s personal details: a reportable personal data breach'),
      impact('minor', 'An old file is lying around, which wastes disk space'),
      impact('internal', 'Only staff could read it, so the risk is small'),
    ],
    fixes: [
      fix('remove-rotate', 'Take the file down now, move backups somewhere private and encrypted, tell the data protection officer, and assume it has been taken', 'good'),
      fix('remove-only', 'Delete the file', 'fine', 'Removing it stops further access, but the client must also assume it has already been downloaded and handle it as a breach.'),
      fix('rename', 'Rename the file', 'bad', 'A new name is still a public file.'),
      fix('later', 'Review it in the next quarterly clean-up', 'bad', 'It is exposed now.'),
    ],
  },
  {
    id: 'T3', host: 'intranet', title: 'Intranet wiki is running a version with a published security fix missing', severity: 'medium', seen: ['ev-wiki-version', 'ev-wiki-advisory'],
    requires: ['ev-wiki-version', 'ev-wiki-advisory'],
    hint: 'Note the version from the scan, then compare it with the vendor\'s advisory. Do not try to use the weakness.',
    impact: 'internal-compromise',
    impacts: [
      impact('internal-compromise', 'Someone already on the internal network could take over the wiki and the information in it'),
      impact('internet-takeover', 'Anyone on the internet could take over the wiki'),
      impact('nothing', 'No impact, because the wiki is not important'),
    ],
    fixes: [
      fix('patch', 'Update the wiki to the current version and keep it on a patch schedule', 'good'),
      fix('firewall', 'Limit access to the wiki to the people who need it, until it can be updated', 'fine', 'This reduces who can reach it, but the missing fix remains.'),
      fix('replace-banner', 'Hide the version number from the page footer', 'bad', 'Hiding a version number does not remove the weakness.'),
      fix('ignore', 'Leave it, because it is internal', 'bad', 'Internal systems are what an attacker uses once they are in.'),
    ],
  },
  {
    id: 'T4', host: 'jump', title: 'Remote access host allows password-only sign-in', severity: 'high', seen: ['ev-jump-pw', 'ev-jump-nomfa'],
    requires: ['ev-jump-pw', 'ev-jump-nomfa'],
    hint: 'The scan shows password sign-in; one allowed check shows whether there is a second factor.',
    impact: 'stolen-password',
    impacts: [
      impact('stolen-password', 'A stolen or guessed password would give an outsider a way into the internal network'),
      impact('outage', 'The host could crash'),
      impact('nothing', 'No impact: staff passwords are strong'),
    ],
    fixes: [
      fix('mfa-keys', 'Require keys or a second factor, switch off password sign-in and limit where it can be reached from', 'good'),
      fix('longer-pw', 'Require longer passwords', 'fine', 'Better, but a password alone is still the only barrier.'),
      fix('port', 'Move it to a different port', 'bad', 'Changing the port hides the service from the laziest scans only.'),
      fix('banner', 'Make the warning banner stronger', 'bad', 'A banner does not stop anyone.'),
    ],
  },
  {
    id: 'T5', host: 'printer', title: 'Office printer on factory settings with a readable address book', severity: 'low', seen: ['ev-printer-panel', 'ev-printer-default'],
    requires: ['ev-printer-panel', 'ev-printer-default'],
    hint: 'A gentle scan only. Open the panel, then use the one check.',
    impact: 'contacts',
    impacts: [
      impact('contacts', 'Someone on the office network could read staff addresses and change printer settings'),
      impact('internet', 'Anyone on the internet could take over the printer'),
      impact('data-breach', 'All customer data has been exposed'),
    ],
    fixes: [
      fix('settings', 'Change the admin password, limit the panel to IT, and update the printer\'s firmware', 'good'),
      fix('replace', 'Buy a new printer', 'fine', 'It would fix this, but it is far more than the finding needs.'),
      fix('unplug', 'Unplug it', 'bad', 'That fixes it by removing the feature, which the office needs.'),
      fix('ignore', 'Ignore it, because printers are not important', 'bad', 'Printers sit on the network with staff addresses and can be a way in.'),
    ],
  },
];

const decoys = [
  { id: 'D1', host: 'portal', title: 'The website shows the name of its software', seen: ['ev-portal-banner'], why: 'A footer that names a product is normal and is not a vulnerability. It becomes interesting only if that version is out of date, which you did not show.' },
  { id: 'D2', host: 'portal', title: 'The website redirects plain web traffic to the secure address', seen: ['ev-http-redirect'], why: 'That is the correct behaviour. There is nothing to fix.' },
  { id: 'D3', host: 'files', title: 'The brochures folder can be listed without signing in', seen: ['ev-brochures'], why: 'The brochures are marketing material meant to be public. A listing of public files is not a finding.' },
];

const topics = [
  { id: 'pii', label: 'Customer personal data is exposed on the file server', trigger: 'pii', reply: 'The client\'s security lead thanks you and says they are taking the backup offline now and calling their data protection officer. You carry on with the rest of the test.', why: 'Exposed personal data is a live incident. Waiting for the final report leaves it open for days.' },
  { id: 'prior', label: 'There are signs that someone else has already broken in', trigger: 'prior', reply: 'The client says they will start their incident process and asks you to send them the audit log entries you saw, and to keep notes of exactly what you did and when.', why: 'If someone else is in the network, your test and their activity get tangled together. The client needs to know straight away.' },
  { id: 'gateway', label: 'I think the payment gateway is vulnerable', fake: true, reply: 'The client asks what you tested to know that, and reminds you that the gateway is out of scope.', why: 'You cannot honestly report a weakness you were not allowed to look for.' },
];

const events = [
  { id: 'e-brief', t: m(9, 0), type: 'note', sev: 'info', summary: 'Client: Welcome to Harbour Mutual. You have until 13:00. The five systems are the customer portal, the file server, the intranet wiki, the remote access host and the office printer', fields: { from: 'client security lead' } },
  { id: 'e-roe', t: m(9, 5), type: 'note', sev: 'info', summary: 'Rules of engagement: test only what is listed. No password guessing, no denial of service, no opening real customer data. If you find exposed personal data or signs that someone else is already inside, stop and tell us at once', fields: { from: 'client security lead' } },
  { id: 'e-printer', t: m(9, 20), type: 'note', sev: 'info', summary: 'Facilities: the office printer is old and has locked up under scans before. Gentle scans only, please', fields: { from: 'facilities' } },
  { id: 'e-window', t: m(11, 0), type: 'note', sev: 'info', summary: 'Client: a reminder that the testing window closes at 13:00. We would like your findings written up by then', fields: { from: 'client security lead' } },
  { id: 'e-pay-call', t: m(12, 10), type: 'incident', sev: 'high', summary: 'The payment provider\'s security team called Harbour Mutual: someone from your address range tested their payment gateway without their permission. They are considering a complaint', fields: { source: 'client' }, when: ['violation:scope'], consequence: { cost: 10, label: 'A third-party payment gateway was tested without permission', prevented: 'you stayed away from the gateway', text: 'The gateway was not in scope and belonged to someone else. The client now has an angry supplier, and you may have broken the law.' } },
  { id: 'e-data-dpo', t: m(12, 20), type: 'incident', sev: 'high', summary: 'The client\'s data protection officer heard that a tester opened a file of real customer records. That is now a second breach to handle', fields: { source: 'client' }, when: ['violation:data'], consequence: { cost: 8, label: 'A tester opened real customer records', prevented: 'you did not open the customer data', text: 'Seeing that the backup was exposed was enough. Opening it meant the tester now holds real customer data, which the client must treat as another breach.' } },
  { id: 'e-lock', t: m(12, 5), type: 'incident', sev: 'medium', summary: 'Several customers could not sign in this morning because their accounts were locked. The support desk traced it to the test', fields: { source: 'client' }, when: ['violation:brute'], consequence: { cost: 5, label: 'Customer accounts were locked out by the test', prevented: 'you did not guess passwords', text: 'Password guessing against live accounts locks real customers out. The rules forbade it for that reason.' } },
  { id: 'e-slow', t: m(12, 0), type: 'incident', sev: 'medium', summary: 'Staff working from home lost their connection for ten minutes. IT blames the remote access host and the test', fields: { source: 'client' }, when: ['violation:dos'], consequence: { cost: 5, label: 'The test cut remote staff off', prevented: 'you did not flood the remote access host', text: 'A flood of connections can take a service down. The rules forbade anything that could.' } },
  { id: 'e-printer-down', t: m(11, 30), type: 'incident', sev: 'medium', summary: 'Front desk: the printer has stopped responding and the morning\'s claim forms cannot be printed', fields: { source: 'client' }, when: ['crash:printer'], consequence: { cost: 4, label: 'The office printer was crashed by the scan', prevented: 'the printer was scanned gently', text: 'The client warned you the printer was fragile. A fast scan was the wrong tool.' } },
];

export const PT_LAB = {
  id: 'pt-lab',
  title: 'Four hours, five systems, one rulebook',
  workspace: 'pt',
  path: 'pentest',
  pathLabel: 'Penetration Tester',
  blurb: 'A small insurer has hired you to test five named systems in four hours. There is a rulebook, a fragile printer and a payment gateway that is not yours to touch. Find what is really wrong, prove it with the least you can do, and report it at the right severity.',
  brief: [
    'It is 09:00. Harbour Mutual, a small insurer, has hired you for a four-hour test. The rules of engagement list five systems, forbid password guessing, denial of service and opening real customer data, ask for gentle scans on the old printer, and say to stop and tell them at once if you find exposed personal data or signs that someone else is already inside.',
    'Everything here is simulated. You scan, browse, run a few allowed checks and write up what you find. Some things on the network look alarming and are perfectly normal; some things that look harmless are not. A good tester proves each problem with the least intrusive check, stays inside the rules, and reports what the evidence supports.',
  ],
  clockStart: m(9, 0),
  horizon: m(13, 0),
  pt: {
    hosts, evidence, truths, decoys, topics,
    roe: [
      'Test only the five systems on the list: the customer portal, the file server, the intranet wiki, the remote access host and the office printer.',
      'Do not guess passwords, flood a service or do anything that could take a system down.',
      'Do not open real customer data. Showing that it is exposed is enough.',
      'The office printer is fragile: gentle scans only.',
      'If you find exposed personal data, or signs that someone else is already inside, stop and tell the client at once. Do not wait for the report.',
      'If something that is not on the list turns up, ask before you touch it.',
    ],
    points: { scope: 5, asked: 4, fragile: 4, prohibited: 4, stop: 8, perEvidence: 5, perFinding: 4, noFalse: 5 },
  },
  ui: {
    name: 'Harbour Mutual test console',
    nav: ['brief', 'scope', 'lab', 'drafts', 'logs', 'report'],
    labels: { scope: 'Rules & scope', lab: 'The lab', drafts: 'Findings', logs: 'Client messages' },
    noPins: true,
    examples: ['type:note', 'type:incident', 'printer', 'rules'],
    searchHint: 'type:note   type:incident   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known.'],
      ['Rules & scope', 'The rules of engagement, the systems you may test, and the line to the client: tell them straight away when the rules say to.'],
      ['The lab', 'Every system you know about. Scan it (gently or fast), open its pages, run the few checks that are allowed, and ask the client when something is not on the list. A console records each step.'],
      ['Findings', 'Write up what you can prove: pick the observation, rate the severity, state the impact, cite the evidence and choose a fix.'],
      ['Client messages', 'What the client and their staff tell you, and the fallout of anything that went wrong.'],
    ],
    briefPanel: {
      heading: 'Task: test five systems for Harbour Mutual',
      paragraphs: ['You have until 13:00. The client has listed five systems. Test them, collect evidence, and report what is really wrong. Some of what you see is normal behaviour; do not report it as a weakness.', 'The rules matter as much as the findings. Staying in scope, using proportionate checks and stopping to tell the client when you find something serious are what separates a professional test from an incident.'],
      known: ['Five systems are in scope: the customer portal, the file server, the intranet wiki, the remote access host and the office printer.', 'No password guessing, no denial of service, no opening real customer data.', 'The printer is fragile: gentle scans only.', 'If you find exposed personal data, or signs someone else is already inside, tell the client at once.'],
      asks: ['Stay inside the rules of engagement.', 'Prove each problem with the least intrusive check.', 'Stop and tell the client when the rules say to.', 'Write up each real finding with its evidence, severity, impact and fix. Do not write up things that are not vulnerabilities.'],
    },
    tips: {
      brief: 'Read the task first. The rulebook is part of the test.',
      scope: 'The rules of engagement and what you may touch. When something serious turns up, tell the client here. Telling them early is the job.',
      lab: 'Scan a system, open its pages, then run the checks. Gentle scans are slower but safe. Anything not on the list needs a question to the client first.',
      drafts: 'A finding needs evidence. Only observations you have actually seen are offered. Cite the evidence, rate it fairly, say what could happen and choose a fix.',
      logs: 'What the client has told you, and what happened when things went wrong.',
      report: 'Your report is judged on what the evidence supports. Say what matters most and what you could not test.',
    },
    groupLabels: { triage: 'Conduct and the rules', evidence: 'Evidence collected', response: 'Findings written' },
  },
  entities: [],
  targets: {},
  actions: [],
  responses: [],
  defaults: {},
  events,
  alerts: [],
  roleLabels: {},
  roleHints: {},
  report: [
    { id: 'priority', kind: 'choice', title: 'Fix first', label: 'Which finding should the client fix first?', options: [['default-pw', 'The staff admin page with a default password'], ['backup', 'The exposed customer database backup'], ['wiki', 'The out-of-date wiki'], ['jump', 'The remote access host without a second factor'], ['printer', 'The printer on factory settings']], truth: 'backup', points: 5, note: 'The backup is exposed personal data that anyone can download: a live breach. The admin password and the remote access host are close behind, but nothing else is already giving data away.' },
    { id: 'immediate', kind: 'set', title: 'Tell them at once', label: 'Which discoveries should you have told the client about straight away, not in the final report?', options: [['backup', 'Customer data exposed on the file server'], ['prior', 'Signs that someone else had already broken in'], ['wiki', 'The out-of-date wiki'], ['printer', 'The printer on factory settings'], ['jump', 'Password-only remote access']], truth: ['backup', 'prior'], points: 6, note: 'The rules named two triggers: exposed personal data and signs of an earlier break-in. Everything else can wait for the report.' },
    { id: 'gateway', kind: 'choice', title: 'The gateway', label: 'You think the payment gateway might be weak. What is right?', options: [['leave', 'Leave it alone, and tell the client you noticed it so they can ask the provider'], ['quick', 'Run one quick, gentle scan to be sure'], ['report', 'Add it to your findings as a vulnerability'], ['ignore', 'Say nothing, because it is not yours']], truth: 'leave', points: 4, note: 'You may not test what you are not authorised to test, even gently. You can tell the client what you noticed and let them raise it with the provider.' },
    { id: 'limits', kind: 'set', title: 'What to state', label: 'Which limits should your report state honestly?', options: [['gateway', 'The payment gateway was not tested, because it is out of scope'], ['printer', 'The printer was only scanned gently'], ['time', 'A four-hour test finds some problems, not all of them'], ['clean', 'Systems with no findings are secure'], ['scope', 'Anything not listed was not looked at']], truth: ['gateway', 'printer', 'time', 'scope'], points: 5, note: 'A report must say what was not tested and why. "No findings" means none were found in the time and scope given, not that a system is secure.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary for the client', minLength: 40, points: 5, placeholder: 'What you tested, what you found and how serious it is, what you told them immediately, what you did not test, and what to fix first.' },
  ],
  grading: { triage: 25, evidence: 25, response: 25, reportTotal: 25, harmScale: 1, cap: 'The test itself harmed the client or broke the rules of engagement. Good findings afterwards do not undo that.', capAt: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'pt-open',
      question: 'You found a database backup in a public folder, and wanted to know if it was really customer data. What should you have done?',
      options: [
        { text: 'Record that it is there and unprotected, ask for its size without downloading it, and tell the client at once', correct: true, explain: 'The finding is that it is exposed. Opening real customer data adds nothing to that and makes you a second holder of it.' },
        { text: 'Open it to prove how bad it is', correct: false, explain: 'The rules forbade it, and it is not needed to prove the exposure.' },
        { text: 'Download it and delete it afterwards', correct: false, explain: 'A copy existed, and the client must now treat your copy as another breach.' },
        { text: 'Leave it out of the report because it is private', correct: false, explain: 'That would hide a live breach from the people who need to know.' },
      ],
    },
    {
      id: 'pt-sev',
      question: 'The wiki was missing a published fix, but only reachable from the internal network. Why is it medium and not critical?',
      options: [
        { text: 'Severity depends on context: it needs a foothold inside the network, and nothing shows it has been used', correct: true, explain: 'The same weakness on an internet-facing system would be rated higher. Severity reflects how reachable it is and what the evidence shows.' },
        { text: 'Medium is the default for everything', correct: false, explain: 'There is no default: the rating has to be argued from the evidence.' },
        { text: 'Internal systems are never worth fixing', correct: false, explain: 'Internal systems are what an attacker uses once they are in.' },
        { text: 'Because the wiki is not important', correct: false, explain: 'Importance is part of it, but the reachability is why this one is not critical.' },
      ],
    },
  ],
  story: [
    '09:00 Harbour Mutual hires you for four hours on five named systems. The rules of engagement forbid guessing passwords, denial of service and opening real customer data, and ask for gentle scans on the printer.',
    'The customer website links to a payment gateway that is not in scope. It belongs to the payment provider and was never agreed. Testing it, even briefly, is a breach of the engagement.',
    'There are five real findings: a staff admin page on a default password (high), a customer database backup anyone can download (critical), an out-of-date intranet wiki (medium), a remote access host with a password and nothing else (high) and a printer on factory settings (low).',
    'Three things only look wrong: a footer naming the software, plain web traffic redirecting to the secure address, and a folder of public brochures that can be listed.',
    'Two discoveries needed a phone call, not a line in the report: the exposed backup, and an unfamiliar admin account with sign-ins from abroad that shows someone else got there first.',
    'The best answer stays inside the rules, proves each problem with the least intrusive check, reports the two urgent things at once, and writes only what the evidence supports.',
  ],
};
