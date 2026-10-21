// Security Engineer workspace, assignment 1: "The booking app nobody hardened".
// Everything here is fictional: the company, the product, the teams and the settings. Settings are simplified so
// each one teaches a single idea.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   Contoso Tickets sells event tickets. It was built quickly and never hardened: a debug console is open to the
//   internet, the database is reachable from anywhere, an admin endpoint needs no login, the database password sits
//   in the repository, ticket PDFs are public, and TLS 1.0 is allowed. The security baseline says what a secure
//   configuration looks like. Seven features must keep working while you fix it.
//   Several fixes are traps: a TLS minimum of 1.3 breaks the payment provider's confirmations, blocking all
//   cross-origin requests breaks the partner's booking widget, making storage private without signed links breaks
//   ticket downloads, and moving the password to the secret store without connecting the API to it stops the API
//   starting. The pipeline finds each of these, but only if you read what it says.
//   Nothing reaches production until you release. A normal release needs a pipeline run that passed on exactly the
//   configuration being released. You can force a release in an emergency, and the features it breaks stay broken.
//   Attackers are already active: the debug console is exploited at 15:30 and the database at 16:15 unless the
//   production configuration has been fixed by then.

const m = (h, mi = 0) => h * 60 + mi;
const S = (id, label, type, value, extra = {}) => ({ id, label, type, value, ...extra });

const components = [
  { id: 'internet', name: 'The internet', kind: 'external', x: 7, y: 42, settings: [] },
  {
    id: 'web', name: 'Web server', kind: 'service', x: 30, y: 42, settings: [
      S('tls_min', 'Minimum TLS version', 'select', '1.0', { options: ['1.0', '1.2', '1.3'], note: 'The oldest encryption protocol the server will accept.' }),
      S('hsts', 'Strict transport security', 'toggle', false, { note: 'Tells browsers to use HTTPS only.' }),
      S('debug', 'Debug console', 'toggle', true, { note: 'A developer console that shows environment variables and lets you run code.' }),
      S('cookie_secure', 'Secure cookies', 'toggle', false, { note: 'Session cookies are only sent over HTTPS.' }),
      S('cors_origins', 'Cross-origin requests allowed from', 'select', '*', { options: ['*', 'partner-list', 'none'], note: 'Which other websites\' pages may call this API from a browser. "*" is everyone; "partner-list" is the approved partner sites; "none" is nobody.' }),
      S('rate_limit', 'Login requests allowed per address per minute (0 = no limit)', 'number', 0, { note: 'A limit slows down guessing and credential stuffing.' }),
    ],
  },
  {
    id: 'api', name: 'API', kind: 'service', x: 54, y: 42, settings: [
      S('admin_auth', 'Admin endpoints require sign-in', 'toggle', false, { note: 'The /admin endpoints used by staff.' }),
      S('db_credentials_source', 'Database credentials come from', 'select', 'repo', { options: ['repo', 'env', 'secret-store'], note: '"repo" means the password is written in a file in the code repository. "secret-store" fetches it when the API starts.' }),
      S('log_pii', 'Log customers\' personal details', 'toggle', true, { note: 'Names and email addresses in the application logs.' }),
      S('audit_log', 'Audit log', 'toggle', false, { note: 'A record of who did what in the admin area.' }),
    ],
  },
  { id: 'db', name: 'Database', kind: 'data', x: 78, y: 42, settings: [S('encryption', 'Encrypted at rest', 'toggle', false, { note: 'The stored data is encrypted on disk.' })] },
  {
    id: 'storage', name: 'Ticket storage', kind: 'data', x: 54, y: 74, settings: [
      S('public_read', 'Anyone can read the files', 'toggle', true, { note: 'The ticket PDFs are stored here.' }),
      S('signed_urls', 'Signed download links', 'toggle', false, { note: 'Short-lived links that let one customer fetch one file.' }),
    ],
  },
  { id: 'secrets', name: 'Secret store', kind: 'service', x: 30, y: 74, settings: [] },
  { id: 'reports', name: 'Reporting tool', kind: 'service', x: 78, y: 12, settings: [] },
  { id: 'office', name: 'Office network', kind: 'external', x: 7, y: 74, settings: [] },
  { id: 'monitor', name: 'Monitoring', kind: 'service', x: 78, y: 74, settings: [] },
  { id: 'ci', name: 'CI/CD pipeline', kind: 'service', x: 30, y: 12, settings: [] },
];

const edge = (id, from, to, label, initial, curve = 0) => ({ id, from, to, label, initial, curve });
const edges = [
  edge('e1', 'internet', 'web', 'HTTPS 443', true),
  edge('e2', 'web', 'api', 'Internal API', true),
  edge('e3', 'api', 'db', 'SQL 5432', true),
  edge('e4', 'web', 'db', 'Direct SQL (bypasses the API)', true, 80),
  edge('e5', 'internet', 'db', 'SQL 5432 from the internet', true, -135),
  edge('e6', 'api', 'storage', 'Ticket files', true),
  edge('e7', 'api', 'secrets', 'Fetch credentials', false),
  edge('e8', 'reports', 'db', 'Reporting queries', true),
  edge('e9', 'office', 'monitor', 'Dashboards', true),
  edge('e10', 'ci', 'web', 'Deploy', true),
  edge('e11', 'internet', 'monitor', 'Admin port 8443 from the internet', true),
];

const policy = [
  { id: 'P1', sev: 'critical', weight: 6, label: 'The debug console is off in production', test: { s: 'web.debug', eq: false }, fix: 'Turn the debug console off.' },
  { id: 'P2', sev: 'critical', weight: 5, label: 'The database cannot be reached from the internet', test: { e: 'e5', allow: false }, fix: 'Block the connection from the internet to the database.' },
  { id: 'P3', sev: 'critical', weight: 5, label: 'Admin endpoints require sign-in', test: { s: 'api.admin_auth', eq: true }, fix: 'Turn on sign-in for the admin endpoints.' },
  { id: 'P4', sev: 'high', weight: 4, label: 'Database credentials come from the secret store, not the repository', test: { s: 'api.db_credentials_source', eq: 'secret-store' }, fix: 'Use the secret store, and connect the API to it.' },
  { id: 'P5', sev: 'high', weight: 4, label: 'Ticket files are not publicly readable', test: { s: 'storage.public_read', eq: false }, fix: 'Make the files private, and turn on signed links so customers can still download them.' },
  { id: 'P6', sev: 'medium', weight: 3, label: 'TLS 1.2 or newer', test: { s: 'web.tls_min', in: ['1.2', '1.3'] }, fix: 'Raise the minimum TLS version from 1.0.' },
  { id: 'P7', sev: 'medium', weight: 3, label: 'Session cookies are marked secure', test: { s: 'web.cookie_secure', eq: true }, fix: 'Turn on secure cookies.' },
  { id: 'P8', sev: 'medium', weight: 3, label: 'Cross-origin requests are limited to known sites', test: { s: 'web.cors_origins', in: ['partner-list', 'none'] }, fix: 'Do not allow every website to call the API.' },
  { id: 'P9', sev: 'medium', weight: 2, label: 'Login is rate limited (1 to 120 a minute)', test: { all: [{ s: 'web.rate_limit', gte: 1 }, { s: 'web.rate_limit', lte: 120 }] }, fix: 'Set a login rate limit between 1 and 120 a minute.' },
  { id: 'P10', sev: 'medium', weight: 2, label: 'The database is encrypted at rest', test: { s: 'db.encryption', eq: true }, fix: 'Turn on encryption at rest.' },
  { id: 'P11', sev: 'low', weight: 1, label: 'Strict transport security is on', test: { s: 'web.hsts', eq: true }, fix: 'Turn on strict transport security.' },
  { id: 'P12', sev: 'low', weight: 1, label: 'Audit logging is on and personal details are not logged', test: { all: [{ s: 'api.audit_log', eq: true }, { s: 'api.log_pii', eq: false }] }, fix: 'Turn the audit log on and stop logging personal details.' },
  { id: 'P13', sev: 'low', weight: 1, label: 'No direct web-to-database path and no internet path to the monitoring admin port', test: { all: [{ e: 'e4', allow: false }, { e: 'e11', allow: false }] }, fix: 'Block the web-to-database and internet-to-monitoring connections.' },
];

const features = [
  { id: 'F1', weight: 6, label: 'Customers can browse and book', needs: { all: [{ e: 'e1', allow: true }, { e: 'e2', allow: true }, { e: 'e3', allow: true }, { any: [{ s: 'api.db_credentials_source', in: ['repo', 'env'] }, { e: 'e7', allow: true }] }, { any: [{ s: 'web.rate_limit', eq: 0 }, { s: 'web.rate_limit', gte: 30 }] }] }, why: 'Customers cannot browse or book: a link in the chain is blocked, the API cannot fetch its database credentials, or the login limit is so low that ordinary browsing is throttled.' },
  { id: 'F2', weight: 5, label: 'Payment confirmations arrive', needs: { all: [{ e: 'e1', allow: true }, { s: 'web.tls_min', in: ['1.0', '1.2'] }] }, why: 'The payment provider\'s servers only speak TLS 1.2 or older, so their confirmations are rejected. Keep 1.2 as the minimum and ask them to upgrade.' },
  { id: 'F3', weight: 4, label: 'The partner\'s booking widget works', needs: { s: 'web.cors_origins', in: ['*', 'partner-list'] }, why: 'The browser blocks the partner site\'s widget from calling our API, because the allowed-sites list no longer includes the partner.' },
  { id: 'F4', weight: 4, label: 'Customers can download their ticket PDFs', needs: { all: [{ e: 'e6', allow: true }, { any: [{ s: 'storage.public_read', eq: true }, { s: 'storage.signed_urls', eq: true }] }] }, why: 'Customers get "access denied" on their tickets: the files are private and signed download links are not turned on.' },
  { id: 'F5', weight: 3, label: 'The office reporting tool works', needs: { e: 'e8', allow: true }, why: 'The reporting tool can no longer reach the database.' },
  { id: 'F6', weight: 2, label: 'IT staff can see the monitoring dashboards', needs: { e: 'e9', allow: true }, why: 'The dashboards are unreachable from the office.' },
  { id: 'F7', weight: 1, label: 'The pipeline can deploy', needs: { e: 'e10', allow: true }, why: 'The pipeline can no longer reach the web server to deploy.' },
];

const events = [
  { id: 'e-brief', t: m(13, 0), type: 'note', sev: 'info', summary: 'Release manager: there is a release freeze at 17:00. Ship a secure configuration today, and nothing that breaks a customer', fields: { from: 'release manager' } },
  { id: 'e-pay', t: m(13, 10), type: 'note', sev: 'info', summary: 'Payments team: our provider\'s confirmation servers still use TLS 1.2. They say TLS 1.3 support is "on their roadmap"', fields: { from: 'payments team' } },
  { id: 'e-widget', t: m(13, 25), type: 'note', sev: 'info', summary: 'Frontend team: the booking widget on partner.example calls our API straight from the browser', fields: { from: 'frontend team' } },
  { id: 'e-files', t: m(13, 35), type: 'note', sev: 'info', summary: 'Platform team: customers fetch their ticket PDFs directly from storage', fields: { from: 'platform team' } },
  { id: 'e-scan', t: m(13, 40), type: 'alert', sev: 'high', summary: 'External scanner: the booking site\'s /debug console is reachable from the internet', fields: { source: 'attack surface monitor' } },
  { id: 'e-login', t: m(14, 30), type: 'alert', sev: 'medium', summary: 'Security: an unusual number of sign-in attempts on the login page from a handful of addresses', fields: { source: 'security monitoring' } },
  { id: 'e-probe', t: m(15, 0), type: 'alert', sev: 'high', summary: 'Security: the debug console is being probed from several addresses', fields: { source: 'security monitoring' } },
  { id: 'e-debug', t: m(15, 30), type: 'incident', sev: 'high', summary: 'An attacker used the debug console to read the app\'s environment variables and signed in as the application', fields: { source: 'incident' }, unlessProd: [{ s: 'web.debug', eq: false }], consequence: { cost: 12, label: 'The production app was taken over through the debug console', prevented: 'the debug console was closed before it was used', text: 'Anyone could run code in the production app through the open debug console, and someone did.' } },
  { id: 'e-stuff', t: m(16, 0), type: 'incident', sev: 'medium', summary: 'Credential stuffing against the login page: 38 customer accounts were taken over', fields: { source: 'incident' }, unlessProd: [{ all: [{ s: 'web.rate_limit', gte: 1 }, { s: 'web.rate_limit', lte: 120 }] }], consequence: { cost: 5, label: 'Customer accounts were taken over', prevented: 'the login rate limit held back credential stuffing', text: 'With no rate limit, stolen passwords from other breaches were tried against the login page until some worked.' } },
  { id: 'e-db', t: m(16, 15), type: 'incident', sev: 'high', summary: 'A scan found the database reachable from the internet and a table of customer details was exported', fields: { source: 'incident' }, unlessProd: [{ e: 'e5', allow: false }], consequence: { cost: 10, label: 'Customer data was taken from the exposed database', prevented: 'the database was closed to the internet in time', text: 'The database accepted connections from anywhere. A table of customer details left the company.' } },
];

export const ENG_TICKETS = {
  id: 'eng-tickets',
  title: 'The booking app nobody hardened',
  workspace: 'eng',
  path: 'engineer',
  pathLabel: 'Security Engineer',
  blurb: 'A ticket-booking system with a debug console open to the internet, a public database and a password in the repository. Fix it to the security baseline, through the pipeline, without breaking the seven things the business needs.',
  brief: [
    'It is 13:00 on Friday. Contoso Tickets sells event tickets, and it was built quickly and never hardened. The security baseline says what a secure configuration looks like, and today you are to ship one. A release freeze starts at 17:00.',
    'You edit a working copy: settings, and which components may talk to which. Nothing reaches production until you release, and a normal release needs a pipeline run that passed on exactly what you are releasing. Read what the pipeline says when it fails. Several fixes will break something the business depends on, and attackers are already at the door.',
  ],
  clockStart: m(13, 0),
  horizon: m(17, 30),
  eng: {
    components,
    edges,
    policy,
    features,
    runMinutes: 8,
    releaseMinutes: 4,
    runBudget: 8,
    secretScan: [{ when: { s: 'api.db_credentials_source', eq: 'repo' }, message: 'A database password was found in config/app.yaml in the repository.' }],
    deployBlockers: [
      { when: { all: [{ s: 'api.db_credentials_source', eq: 'secret-store' }, { e: 'e7', allow: false }] }, message: 'The API fails its health check: it cannot reach the secret store to fetch its database credentials.' },
      { when: { e: 'e2', allow: false }, message: 'The web server fails its health check: it cannot reach the API.' },
    ],
    reference: {
      cfg: { 'web.tls_min': '1.2', 'web.hsts': true, 'web.debug': false, 'web.cookie_secure': true, 'web.cors_origins': 'partner-list', 'web.rate_limit': 60, 'api.admin_auth': true, 'api.db_credentials_source': 'secret-store', 'api.log_pii': false, 'api.audit_log': true, 'db.encryption': true, 'storage.public_read': false, 'storage.signed_urls': true },
      edges: { e4: false, e5: false, e7: true, e11: false },
    },
  },
  ui: {
    name: 'Contoso engineering console',
    nav: ['brief', 'config', 'arch', 'diff', 'pipeline', 'logs', 'report'],
    labels: { config: 'Configuration', arch: 'Architecture', diff: 'Changes', pipeline: 'CI/CD pipeline', logs: 'Team notes & alerts' },
    noPins: true,
    examples: ['type:alert', 'type:note', 'type:incident', 'TLS', 'partner'],
    searchHint: 'type:alert   type:note   type:incident   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known.'],
      ['Configuration', 'Every setting of every component, with the baseline it must meet. Edit the working copy: nothing is live until you release.'],
      ['Architecture', 'Which components may talk to which. Block the paths that should not exist and connect the ones that must.'],
      ['Changes', 'A diff of your working copy against what is in production, with what each change does to the baseline.'],
      ['CI/CD pipeline', 'Run the pipeline on your working copy: it validates, scans for secrets, checks the baseline, deploys to staging and runs the integration tests. Release when it passes.'],
      ['Team notes & alerts', 'What the other teams told you, and what the attackers are doing. Both change what you can safely do.'],
    ],
    briefPanel: {
      heading: 'Task: harden Contoso Tickets',
      paragraphs: ['The booking system has never been hardened. A security review produced a baseline of thirteen checks, ranked critical to low. The pipeline gates on critical and high ones; the others show as warnings.', 'Seven business features must keep working: browsing and booking, payment confirmations, the partner widget, ticket downloads, the office reporting tool, the monitoring dashboards and deployments. The other teams have left notes, and the pipeline\'s integration tests will tell you what breaks.'],
      known: ['An outside scan found the /debug console on the booking site at 13:40.', 'The release freeze starts at 17:00.', 'A normal release needs a pipeline run that passed on exactly the configuration you release.', 'A forced release skips the pipeline and anything it would have caught stays broken.'],
      asks: ['Bring production to the security baseline.', 'Keep every business feature working.', 'Release through the pipeline, and avoid forcing a release.', 'Write up the change: what was most serious, what could have broken, the rollback plan and what is left.'],
    },
    tips: {
      brief: 'Read the task first. Fix the critical things before the clock runs out, but do not break the business doing it.',
      config: 'Each setting shows its baseline. Edit the working copy. Some settings have a catch, so read the notes from the other teams in the feed.',
      arch: 'Click a connection to allow or block it. Some paths should not exist at all. Others must exist for something to work.',
      diff: 'What would change if you released now, and what each change does to the baseline. A change that is not here is not going out.',
      pipeline: 'Run the pipeline on your working copy. It stops at the first stage that fails, so read the message and fix that before running again. Release once it passes.',
      logs: 'Other teams\' notes and the attackers\' progress. The notes tell you what the business depends on.',
      report: 'Your change record is graded against what really happened. Say what was most serious, what could have broken, the rollback plan and what is left.',
    },
    groupLabels: { triage: 'Pipeline discipline', evidence: 'Security baseline', response: 'Features still working' },
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
    { id: 'worst', kind: 'choice', title: 'Most serious', label: 'Which finding was the most serious?', options: [['debug', 'The debug console open to the internet'], ['tls', 'TLS 1.0 allowed'], ['hsts', 'Strict transport security off'], ['audit', 'No audit log'], ['encryption', 'The database not encrypted at rest']], truth: 'debug', points: 5, note: 'The debug console: anyone could run code in production, it was being probed and it was exploited at 15:30 unless closed. The exposed database and the unauthenticated admin endpoint were close behind.' },
    { id: 'tradeoffs', kind: 'set', title: 'Could have broken things', label: 'Which changes could have broken a business feature?', options: [['tls13', 'Requiring TLS 1.3'], ['cors-none', 'Blocking all cross-origin requests'], ['private-storage', 'Making ticket storage private without signed links'], ['secret-store', 'Moving the password to the secret store without connecting the API to it'], ['low-rate', 'Setting a very low login rate limit'], ['hsts', 'Turning on strict transport security'], ['debug-off', 'Turning off the debug console']], truth: ['tls13', 'cors-none', 'private-storage', 'secret-store', 'low-rate'], points: 6, note: 'The first five each break a feature. Turning on HSTS and turning off the debug console are safe.' },
    { id: 'rollback', kind: 'choice', title: 'Rollback plan', label: 'What is your rollback plan?', options: [['redeploy', 'Redeploy the previous tagged release and configuration through the same pipeline'], ['rebuild', 'Rebuild the servers from scratch'], ['wait', 'Wait and see whether anyone complains'], ['edit-live', 'Edit the live servers by hand to undo it']], truth: 'redeploy', points: 3, note: 'Because configuration is versioned and releases go through the pipeline, rolling back is redeploying the last good release.' },
    { id: 'residual', kind: 'set', title: 'What is left', label: 'What should be scheduled next?', options: [['tls-provider', 'Ask the payment provider to support TLS 1.3, then raise the minimum'], ['rotate', 'Rotate the database password that was in the repository'], ['purge', 'Remove the old password from the repository history'], ['skip-checks', 'Turn off the pipeline checks to ship faster'], ['open-cors', 'Allow every site to call the API again']], truth: ['tls-provider', 'rotate', 'purge'], points: 3, note: 'The password was in the repository, so it must be treated as exposed: rotate it and purge it. TLS 1.2 is a fair minimum until the provider upgrades. Turning off the checks or reopening CORS would undo the work.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Change record', minLength: 40, points: 3, placeholder: 'What you changed and why, what the pipeline caught, what you released and when, how to roll it back and what remains.' },
  ],
  grading: { triage: 15, evidence: 40, response: 25, reportTotal: 20, harmScale: 1, cap: 'An attacker used a weakness that you had not closed in production by the time they came. A good configuration afterwards does not undo that.', capAt: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'eng-tls',
      question: 'You raised the minimum TLS version to 1.3 and the integration tests failed on payment confirmations. What is the right response?',
      options: [
        { text: 'Keep TLS 1.2 as the minimum, which meets the baseline and keeps the provider working, and schedule a request to the provider to support 1.3', correct: true, explain: 'A security setting is only as good as the systems that can still use it. 1.2 meets the baseline, and you cannot change the provider\'s servers.' },
        { text: 'Keep TLS 1.3 and tell the business that payments are down', correct: false, explain: 'That trades a medium-severity improvement for a broken revenue feature.' },
        { text: 'Force the release and fix payments later', correct: false, explain: 'Forcing past the pipeline ships exactly what the integration tests were built to catch.' },
        { text: 'Go back to TLS 1.0', correct: false, explain: 'That fails the baseline. 1.2 satisfies both.' },
      ],
    },
    {
      id: 'eng-signed',
      question: 'Making the ticket storage private broke ticket downloads. How can the files be private and still downloadable?',
      options: [
        { text: 'Turn on signed download links: short-lived links that let one customer fetch one file, with the storage itself private', correct: true, explain: 'It removes the public access while keeping the feature. The fix is to replace what the public access did, not to remove the feature.' },
        { text: 'Make the storage public again for customers only', correct: false, explain: 'Public means everyone, not just customers.' },
        { text: 'Email the PDFs to customers instead', correct: false, explain: 'That changes the product and moves the exposure into inboxes.' },
        { text: 'Hide the storage address', correct: false, explain: 'Secrecy of an address is not access control.' },
      ],
    },
  ],
  story: [
    '13:00 Contoso Tickets is a quick build that was never hardened. A baseline of thirteen checks and seven business features frame the work.',
    '13:40 An outside scan finds the debug console. The other teams leave notes: payments only speaks TLS 1.2, the partner widget calls the API from the browser, and customers download PDFs straight from storage.',
    'Four of the obvious fixes are traps: TLS 1.3, blocking all cross-origin requests, private storage without signed links, and moving the password to the secret store without connecting the API to it.',
    '15:30 The debug console is used to take over production unless it was closed. 16:00 credential stuffing hits an unlimited login. 16:15 the database is exported unless it was blocked from the internet.',
    'The best answer fixes the baseline, keeps every feature, goes through the pipeline once or twice, and leaves a clear rollback plan.',
  ],
};
