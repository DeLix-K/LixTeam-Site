// Cloud Security workspace, assignment 1: "The bucket that anyone could read".
// Everything here is fictional. Service names are generic on purpose; addresses come from the documentation ranges.
//
// The story (kept here so the tests and the debrief can both use it):
//   11:12  Jamie, a developer, makes the customer exports bucket public to share a file with a partner.
//   13:50  A secret scanner finds the ETL service account's access key in a public code repository.
//   14:02  Someone starts listing and downloading the exports bucket anonymously from 203.0.113.60.
//   14:12  The same address uses the leaked ETL key to read the production secrets, then the orders database.
//   After 14:30 (your shift starts): the downloads continue every five minutes, the orders database is exported
//   again and again, and each chunk that gets out is a leak. Every fix you apply takes effect from the minute you
//   apply it; it never rewrites the past.
// Underneath is the usual story: access grew without review. The ETL service account has full access to everything,
// developers can reach production and the emergency administrator role, and nobody was watching for public storage.

const m = (h, mi = 0) => h * 60 + mi;

// ── The estate ──────────────────────────────────────────────────
const entities = [
  { id: 'alex', kind: 'user', name: 'Alex M.', role: 'Data analyst', facts: ['Reads the customer exports for the weekly report.', 'Member of grp-analytics.'], x: 13, y: 44 },
  { id: 'jamie', kind: 'user', name: 'Jamie P.', role: 'Developer', facts: ['Makes changes to the web server and the dev bucket.', 'Has no multi-factor sign-in set up.', 'Made the exports bucket public at 11:12 to share a file with a partner (ticket SUP-212).'], x: 13, y: 56 },
  { id: 'kit', kind: 'user', name: 'Kit R.', role: 'Developer', facts: ['Member of grp-dev. Multi-factor sign-in is on.'], x: 13, y: 68 },
  { id: 'sam', kind: 'user', name: 'Sam T.', role: 'Customer support', facts: ['Reads customer uploads to help with tickets.'], x: 13, y: 80 },
  { id: 'dana', kind: 'user', name: 'Dana K.', role: 'Head of engineering', facts: ['Administrator. Multi-factor sign-in is on.'], x: 13, y: 92 },
  { id: 'grp-analytics', kind: 'group', name: 'Analytics team', role: 'Group', facts: ['Reads the exports and the analytics warehouse.'], x: 32, y: 44 },
  { id: 'grp-dev', kind: 'group', name: 'Developers', role: 'Group', facts: ['Holds a broad "working access" grant. Can also assume the break-glass role.'], x: 32, y: 60 },
  { id: 'grp-support', kind: 'group', name: 'Support team', role: 'Group', facts: ['Reads uploads.'], x: 32, y: 76 },
  { id: 'grp-admins', kind: 'group', name: 'Administrators', role: 'Group', facts: ['Full access to everything, by design.'], x: 32, y: 91 },
  { id: 'svc-etl', kind: 'service', name: 'ETL service account', role: 'Loads the analytics warehouse', facts: ['Reads the exports and loads the analytics warehouse every 30 minutes from the office address.', 'Holds a grant of full access to everything.', 'Its access key is 412 days old and was found in a public code repository at 13:50.'], x: 32, y: 18 },
  { id: 'svc-ci', kind: 'service', name: 'CI pipeline', role: 'Deploys the site and web server', facts: ['Deploys website assets and the web server, and reads the deploy secrets.'], x: 32, y: 30 },
  { id: 'svc-backup', kind: 'service', name: 'Backup service account', role: 'Stores backups', facts: ['Reads the orders database and writes the backups bucket.'], x: 32, y: 6 },
  { id: 'role-web', kind: 'role', name: 'Web app role', role: 'Role used by the web server', facts: ['Assumed by vm-web. Reads and writes the orders database and the uploads bucket.'], x: 55, y: 12 },
  { id: 'role-export', kind: 'role', name: 'Export job role', role: 'Role used by the nightly export', facts: ['Assumed by fn-export. Reads orders and writes the exports bucket.'], x: 55, y: 26 },
  { id: 'role-break-glass', kind: 'role', name: 'Break-glass role', role: 'Emergency full access', facts: ['Meant for administrators in an emergency.', 'Developers are currently allowed to assume it, with no multi-factor check.'], x: 55, y: 85 },
  { id: 'bkt-exports', kind: 'resource', name: 'Customer exports', role: 'Storage bucket · critical', facts: ['A nightly CSV of customer orders, including names, addresses and email addresses.', 'Personal data: a leak is a reportable incident.'], x: 87, y: 6 },
  { id: 'bkt-uploads', kind: 'resource', name: 'Customer uploads', role: 'Storage bucket · internal', facts: ['Files customers attach to support tickets.'], x: 87, y: 16 },
  { id: 'bkt-site', kind: 'resource', name: 'Website assets', role: 'Storage bucket · public by design', facts: ['Images and scripts for the public website. It is meant to be readable by anyone.'], x: 87, y: 26 },
  { id: 'bkt-backups', kind: 'resource', name: 'Backups', role: 'Storage bucket · sensitive', facts: ['Nightly database backups.'], x: 87, y: 36 },
  { id: 'bkt-dev', kind: 'resource', name: 'Dev scratch', role: 'Storage bucket · internal', facts: ['Temporary files for developers.'], x: 87, y: 46 },
  { id: 'db-orders', kind: 'resource', name: 'Orders database', role: 'Database · critical', facts: ['Every customer order, with personal and delivery data.'], x: 87, y: 56 },
  { id: 'db-analytics', kind: 'resource', name: 'Analytics warehouse', role: 'Database · sensitive', facts: ['Summarised data for reports.'], x: 87, y: 66 },
  { id: 'sec-prod', kind: 'resource', name: 'Production secrets', role: 'Secret store · critical', facts: ['Database passwords and signing keys for production.'], x: 87, y: 76 },
  { id: 'vm-web', kind: 'resource', name: 'Web server', role: 'Virtual machine · internal', facts: ['Runs the public web app. Uses the web app role.'], x: 87, y: 86 },
  { id: 'fn-export', kind: 'resource', name: 'Nightly export', role: 'Serverless function · internal', facts: ['Runs at 02:00 and writes the exports file. Uses the export job role.'], x: 87, y: 96 },
  { id: '203.0.113.60', kind: 'ip', name: 'External address', role: 'Unknown hosting provider', facts: ['First seen at 14:02 today.', 'Not an address any employee or supplier uses.'] },
  { id: '198.51.100.20', kind: 'ip', name: 'External address', role: 'The company\'s office address', facts: ['Where staff and the ETL job normally connect from.'] },
];

const identities = [
  { id: 'alex', memberOf: ['grp-analytics'], config: { mfa: true } },
  { id: 'jamie', memberOf: ['grp-dev'], config: { mfa: false } },
  { id: 'kit', memberOf: ['grp-dev'], config: { mfa: true } },
  { id: 'sam', memberOf: ['grp-support'], config: { mfa: true } },
  { id: 'dana', memberOf: ['grp-admins'], config: { mfa: true } },
  { id: 'grp-analytics', config: {} },
  { id: 'grp-dev', config: {} },
  { id: 'grp-support', config: {} },
  { id: 'grp-admins', config: {} },
  { id: 'svc-etl', config: { keyAgeDays: 412 } },
  { id: 'svc-ci', config: { keyAgeDays: 40 } },
  { id: 'svc-backup', config: { keyAgeDays: 90 } },
  { id: 'role-web', config: {} },
  { id: 'role-export', config: {} },
  { id: 'role-break-glass', config: {} },
];

const resources = [
  { id: 'bkt-exports', name: 'Customer exports', kind: 'storage', config: { public: 'read', encrypted: false, logging: true } },
  { id: 'bkt-uploads', name: 'Customer uploads', kind: 'storage', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'bkt-site', name: 'Website assets', kind: 'storage', config: { public: 'read', encrypted: true, logging: true } },
  { id: 'bkt-backups', name: 'Backups', kind: 'storage', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'bkt-dev', name: 'Dev scratch', kind: 'storage', config: { public: 'none', encrypted: false, logging: false } },
  { id: 'db-orders', name: 'Orders database', kind: 'database', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'db-analytics', name: 'Analytics warehouse', kind: 'database', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'sec-prod', name: 'Production secrets', kind: 'secret', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'vm-web', name: 'Web server', kind: 'server', config: { public: 'none', encrypted: true, logging: true } },
  { id: 'fn-export', name: 'Nightly export', kind: 'function', config: { public: 'none', encrypted: true, logging: true } },
];

const grants = [
  { id: 'g1', who: 'role-web', label: 'Web app: uploads bucket', resources: ['bkt-uploads'], actions: ['read', 'write'] },
  { id: 'g1b', who: 'role-web', label: 'Web app: orders database', resources: ['db-orders'], actions: ['read', 'write'] },
  { id: 'g2', who: 'role-export', label: 'Export job: read orders', resources: ['db-orders'], actions: ['read'] },
  { id: 'g2b', who: 'role-export', label: 'Export job: write exports', resources: ['bkt-exports'], actions: ['write'] },
  { id: 'g3', who: 'grp-analytics', label: 'Analytics: read exports', resources: ['bkt-exports'], actions: ['read'] },
  { id: 'g3b', who: 'grp-analytics', label: 'Analytics: read the warehouse', resources: ['db-analytics'], actions: ['read'] },
  { id: 'g4', who: 'svc-etl', label: 'ETL service: full access to everything', resources: ['*'], actions: ['admin'] },
  { id: 'g5', who: 'grp-dev', label: 'Developers: working access to everything', resources: ['*'], actions: ['read', 'write', 'delete'] },
  { id: 'g6', who: 'grp-support', label: 'Support: read uploads', resources: ['bkt-uploads'], actions: ['read'] },
  { id: 'g7', who: 'grp-admins', label: 'Administrators: full access', resources: ['*'], actions: ['admin'] },
  { id: 'g8', who: 'svc-backup', label: 'Backups: store backups', resources: ['bkt-backups'], actions: ['write'] },
  { id: 'g8b', who: 'svc-backup', label: 'Backups: read orders', resources: ['db-orders'], actions: ['read'] },
  { id: 'g9', who: 'svc-ci', label: 'CI: deploy the web server', resources: ['vm-web'], actions: ['write'] },
  { id: 'g9b', who: 'svc-ci', label: 'CI: deploy website assets', resources: ['bkt-site'], actions: ['write'] },
  { id: 'g9c', who: 'svc-ci', label: 'CI: read the deploy secrets', resources: ['sec-prod'], actions: ['read'] },
  { id: 'g10', who: 'role-break-glass', label: 'Break-glass: full access', resources: ['*'], actions: ['admin'] },
];

const trusts = [
  { id: 't1', from: 'vm-web', to: 'role-web', needsMfa: false },
  { id: 't2', from: 'fn-export', to: 'role-export', needsMfa: false },
  { id: 't4', from: 'grp-dev', to: 'role-break-glass', needsMfa: false },
  { id: 't5', from: 'grp-admins', to: 'role-break-glass', needsMfa: false },
];

// ── What must keep working, and what must be closed ─────────────
const needs = [
  { id: 'n-site', label: 'The public website loading its assets', who: 'PUBLIC', resource: 'bkt-site', action: 'read', weight: 5, note: 'Customers see a broken website.' },
  { id: 'n-web-db', label: 'The web app writing orders', who: 'role-web', resource: 'db-orders', action: 'write', weight: 6, note: 'Nobody can place an order.' },
  { id: 'n-web-up', label: 'Customers uploading files', who: 'role-web', resource: 'bkt-uploads', action: 'write', weight: 3, note: 'Support tickets lose their attachments.' },
  { id: 'n-exp-read', label: 'The nightly export reading orders', who: 'role-export', resource: 'db-orders', action: 'read', weight: 3, note: 'The weekly report has no data.' },
  { id: 'n-exp-write', label: 'The nightly export writing its file', who: 'role-export', resource: 'bkt-exports', action: 'write', weight: 3, note: 'The weekly report has no data.' },
  { id: 'n-alex', label: 'Analysts reading the exports', who: 'alex', resource: 'bkt-exports', action: 'read', weight: 4, note: 'Alex cannot do the weekly report.' },
  { id: 'n-etl-read', label: 'The ETL job reading the exports', who: 'svc-etl', resource: 'bkt-exports', action: 'read', weight: 4, note: 'The analytics warehouse stops updating.' },
  { id: 'n-etl-write', label: 'The ETL job loading the warehouse', who: 'svc-etl', resource: 'db-analytics', action: 'write', weight: 5, note: 'The analytics warehouse stops updating.' },
  { id: 'n-dev-web', label: 'Developers deploying the web server', who: 'jamie', resource: 'vm-web', action: 'write', weight: 4, note: 'Fixes cannot be shipped.' },
  { id: 'n-dev-bkt', label: 'Developers using the dev bucket', who: 'jamie', resource: 'bkt-dev', action: 'write', weight: 3, note: 'Developers lose their scratch space.' },
  { id: 'n-bk-w', label: 'Backups being stored', who: 'svc-backup', resource: 'bkt-backups', action: 'write', weight: 4, note: 'Nightly backups fail.' },
  { id: 'n-bk-r', label: 'Backups reading the orders database', who: 'svc-backup', resource: 'db-orders', action: 'read', weight: 3, note: 'Nightly backups fail.' },
  { id: 'n-sam', label: 'Support reading uploads', who: 'sam', resource: 'bkt-uploads', action: 'read', weight: 3, note: 'Support cannot see customer attachments.' },
  { id: 'n-ci-web', label: 'CI deploying the web server', who: 'svc-ci', resource: 'vm-web', action: 'write', weight: 3, note: 'Releases stop.' },
  { id: 'n-ci-site', label: 'CI deploying the website assets', who: 'svc-ci', resource: 'bkt-site', action: 'write', weight: 3, note: 'Releases stop.' },
  { id: 'n-ci-sec', label: 'CI reading the deploy secrets', who: 'svc-ci', resource: 'sec-prod', action: 'read', weight: 3, note: 'Releases stop.' },
  { id: 'n-dana', label: 'Administrators administering the database', who: 'dana', resource: 'db-orders', action: 'admin', weight: 3, note: 'Nobody can administer production.' },
];

const threats = [
  { id: 'exports', label: 'anyone, or the attacker, reading the customer exports', points: 10, checks: [{ who: 'ATTACKER', resource: 'bkt-exports', action: 'read' }], why: 'The bucket is public, and the leaked ETL key can read it as well. Both routes have to be closed: block public access and rotate the key.' },
  { id: 'orders', label: 'the attacker reading the orders database', points: 6, checks: [{ who: 'ATTACKER', resource: 'db-orders', action: 'read' }], why: 'The leaked key belongs to an account with full access. Rotating the key shuts the attacker out; narrowing the account\'s grant also limits what any future leak could reach.' },
  { id: 'secrets', label: 'the attacker reading the production secrets', points: 6, checks: [{ who: 'ATTACKER', resource: 'sec-prod', action: 'read' }], why: 'The same leaked key reaches the secrets. Anything it read has to be treated as exposed.' },
  { id: 'etl', label: 'the ETL account reaching things it never needs', points: 6, checks: [{ who: 'svc-etl', resource: 'sec-prod', action: 'read' }, { who: 'svc-etl', resource: 'db-orders', action: 'read' }, { who: 'svc-etl', resource: 'bkt-backups', action: 'read' }], why: 'The ETL job needs the exports and the warehouse, nothing else. Limit its grant to those two resources.' },
  { id: 'dev', label: 'developers writing to production or reading its secrets', points: 6, checks: [{ who: 'grp-dev', resource: 'db-orders', action: 'write' }, { who: 'grp-dev', resource: 'sec-prod', action: 'read' }, { who: 'grp-dev', resource: 'bkt-exports', action: 'read' }], why: 'Developers need the dev bucket and the web server. Limit the grant to those, rather than removing it or making it read-only everywhere, and close the route to the break-glass role as well.' },
  { id: 'breakglass', label: 'a developer becoming an administrator through the break-glass role', points: 6, checks: [{ who: 'jamie', resource: 'db-orders', action: 'admin' }], why: 'The emergency role is for administrators. Stop developers assuming it, or at least require multi-factor sign-in (and remember Jamie has none).' },
];

const findings = [
  { id: 'f-public', sev: 'high', title: 'The customer exports bucket is open to the public', detail: 'Anyone on the internet can list and read its objects. It holds personal data.', resource: 'bkt-exports', checks: [{ who: 'PUBLIC', resource: 'bkt-exports', action: 'read' }] },
  { id: 'f-key', sev: 'high', title: 'An access key for svc-etl was found in a public code repository', detail: 'The key is 412 days old and still valid. Treat it as stolen.', resource: 'svc-etl', checks: [{ who: 'LEAK:svc-etl', resource: 'sec-prod', action: 'read' }] },
  { id: 'f-etl', sev: 'medium', title: 'The ETL service account has full access to everything', detail: 'Its job only needs the exports and the analytics warehouse.', resource: 'svc-etl', checks: [{ who: 'svc-etl', resource: 'sec-prod', action: 'read' }] },
  { id: 'f-dev', sev: 'medium', title: 'Developers can change production and read its secrets', detail: 'One group grant covers every resource.', resource: 'grp-dev', checks: [{ who: 'grp-dev', resource: 'db-orders', action: 'write' }] },
  { id: 'f-bg', sev: 'medium', title: 'Developers can assume the break-glass administrator role without multi-factor sign-in', detail: 'The role gives full access to everything.', resource: 'role-break-glass', checks: [{ who: 'jamie', resource: 'db-orders', action: 'admin' }] },
  { id: 'f-site', sev: 'low', title: 'The website assets bucket is open to the public', detail: 'This is how the public website loads its images and scripts.', resource: 'bkt-site', checks: [{ who: 'PUBLIC', resource: 'bkt-site', action: 'read' }] },
  { id: 'f-enc', sev: 'low', title: 'The customer exports bucket is not encrypted at rest', detail: 'Encryption does not stop someone who has access, but it is baseline hygiene.', resource: 'bkt-exports', cfg: { res: 'bkt-exports', key: 'encrypted', value: true }, checks: [] },
  { id: 'f-mfa', sev: 'low', title: 'Jamie has no multi-factor sign-in', detail: 'A stolen password would be enough to sign in as Jamie.', resource: 'jamie', cfg: { id: 'jamie', key: 'mfa', value: true }, checks: [] },
];

// ── Fixes ───────────────────────────────────────────────────────
const ALL_BUT_SECRETS = ['bkt-exports', 'bkt-uploads', 'bkt-site', 'bkt-backups', 'bkt-dev', 'db-orders', 'db-analytics'];
const fixes = [
  { id: 'fx-exports-private', target: 'res:bkt-exports', label: 'Block public access to the exports bucket', detail: 'Nobody outside the company can read it without credentials.', effects: [{ kind: 'res', id: 'bkt-exports', set: { public: 'none' } }] },
  { id: 'fx-exports-delete', target: 'res:bkt-exports', label: 'Delete the exports bucket', detail: 'Removes the bucket and everything in it.', effects: [{ kind: 'res', id: 'bkt-exports', set: { deleted: true, public: 'none' } }] },
  { id: 'fx-exports-encrypt', target: 'res:bkt-exports:enc', label: 'Turn on encryption at rest for the exports bucket', detail: 'Baseline hygiene. It does not change who can read it.', effects: [{ kind: 'res', id: 'bkt-exports', set: { encrypted: true } }] },
  { id: 'fx-site-private', target: 'res:bkt-site', label: 'Block public access to the website assets bucket', detail: 'Nobody outside the company can read it without credentials.', effects: [{ kind: 'res', id: 'bkt-site', set: { public: 'none' } }] },
  { id: 'fx-etl-rotate', target: 'id:svc-etl', label: 'Rotate the ETL service account\'s key', detail: 'The old key stops working. The job is given a new one.', effects: [{ kind: 'id', id: 'svc-etl', set: { keyRotated: true } }] },
  { id: 'fx-etl-disable', target: 'id:svc-etl', label: 'Disable the ETL service account', detail: 'Nothing can sign in as it until it is re-enabled.', effects: [{ kind: 'id', id: 'svc-etl', set: { disabled: true } }] },
  { id: 'fx-g4-narrow', target: 'grant:g4', label: 'Limit the ETL grant to the exports bucket and the analytics warehouse', detail: 'Read and write on those two resources only.', effects: [{ kind: 'grant', id: 'g4', set: { resources: ['bkt-exports', 'db-analytics'], actions: ['read', 'write'] } }] },
  { id: 'fx-g4-remove', target: 'grant:g4', label: 'Remove the ETL grant', detail: 'The account keeps no permissions of its own.', effects: [{ kind: 'grant', id: 'g4', set: { removed: true } }] },
  { id: 'fx-g4-readall', target: 'grant:g4', label: 'Reduce the ETL grant to read-only on all storage and databases', detail: 'Read on everything except the secrets.', effects: [{ kind: 'grant', id: 'g4', set: { resources: ALL_BUT_SECRETS, actions: ['read'] } }] },
  { id: 'fx-g5-narrow', target: 'grant:g5', label: 'Limit developers to the dev bucket and the web server', detail: 'Read and write on those two resources only.', effects: [{ kind: 'grant', id: 'g5', set: { resources: ['bkt-dev', 'vm-web'], actions: ['read', 'write'] } }] },
  { id: 'fx-g5-remove', target: 'grant:g5', label: 'Remove the developers\' grant', detail: 'The group keeps no permissions of its own.', effects: [{ kind: 'grant', id: 'g5', set: { removed: true } }] },
  { id: 'fx-g5-readonly', target: 'grant:g5', label: 'Make developer access read-only everywhere', detail: 'Read on every resource, write on none.', effects: [{ kind: 'grant', id: 'g5', set: { actions: ['read'] } }] },
  { id: 'fx-t4-remove', target: 'trust:t4', label: 'Stop developers assuming the break-glass role', detail: 'Only administrators keep that route.', effects: [{ kind: 'trust', id: 't4', set: { removed: true } }] },
  { id: 'fx-t4-mfa', target: 'trust:t4', label: 'Require multi-factor sign-in to assume the break-glass role', detail: 'Anyone assuming it must have multi-factor sign-in switched on.', effects: [{ kind: 'trust', id: 't4', set: { needsMfa: true } }] },
  { id: 'fx-jamie-mfa', target: 'id:jamie', label: 'Require multi-factor sign-in for Jamie', detail: 'Jamie must set up a second factor.', effects: [{ kind: 'id', id: 'jamie', set: { mfa: true } }] },
];

// ── The events ──────────────────────────────────────────────────
const people = new Set(entities.filter((x) => ['user', 'group', 'role', 'service'].includes(x.kind)).map((x) => x.id));
function api(id, t, actor, action, resource, o = {}) {
  const { fields = {}, summary, access, ...rest } = o;
  const base = { id, t, type: 'api', host: resource, sev: 'info', summary: summary || `${actor} ${action} ${resource}`, fields: { actor, action, resource, src: '198.51.100.20', auth: 'sign-in', region: 'uk', result: 'allowed', ...fields }, ...rest };
  if (people.has(actor)) base.user = actor;
  if (access) base.access = access;
  return base;
}

const ATK = '203.0.113.60';
const story = [
  { id: 'e-cfg', t: m(11, 12), type: 'config', host: 'bkt-exports', user: 'jamie', sev: 'medium', key: 'misconfig', summary: 'jamie set the exports bucket to public read (ticket SUP-212: "share a file with a partner")', fields: { actor: 'jamie', action: 'set-public-read', resource: 'bkt-exports', ticket: 'SUP-212', before: 'private', after: 'public read' } },
  { id: 'e-repo', t: m(13, 50), type: 'repo', sev: 'high', key: 'leak', user: 'svc-etl', summary: 'Secret scanner: an access key for svc-etl was found in the public repository contoso/etl-scripts (commit 4f2a9c1)', fields: { actor: 'secret-scanner', repo: 'contoso/etl-scripts', commit: '4f2a9c1', key_owner: 'svc-etl', key_age_days: 412 } },
  api('e-anon-first', m(14, 2), 'anonymous', 'list', 'bkt-exports', { sev: 'medium', key: 'anon', summary: 'anonymous listed the exports bucket from 203.0.113.60 (first time seen)', access: { who: 'PUBLIC', resource: 'bkt-exports', action: 'read' }, fields: { src: ATK, auth: 'none (public)', region: 'unknown', objects: 412 } }),
  api('e-key-sec', m(14, 12), 'svc-etl', 'read', 'sec-prod', { sev: 'high', key: 'keyuse', summary: 'svc-etl read the production secrets from 203.0.113.60 (never seen before for this account)', access: { who: 'LEAK:svc-etl', resource: 'sec-prod', action: 'read' }, fields: { src: ATK, auth: 'access key (old)', region: 'unknown', secrets: 9 } }),
  api('e-key-db', m(14, 20), 'svc-etl', 'read', 'db-orders', { sev: 'high', key: 'dbread', summary: 'svc-etl requested an orders database snapshot from 203.0.113.60 (12 tables)', access: { who: 'LEAK:svc-etl', resource: 'db-orders', action: 'read' }, fields: { src: ATK, auth: 'access key (old)', region: 'unknown', tables: 12 } }),
];
// the downloads continue every five minutes; four of them are the ones that count
const ANON_LEAKS = [m(15, 0), m(15, 15), m(15, 30), m(15, 45)];
for (let t = m(14, 5); t <= m(15, 55); t += 5) {
  const leak = ANON_LEAKS.includes(t);
  story.push(api(`e-anon-${t}`, t, 'anonymous', 'read', 'bkt-exports', { sev: 'high', key: 'anon', keyWeight: 0, summary: `anonymous read 25 objects from the exports bucket (1.1 GB) from ${ATK}`, access: { who: 'PUBLIC', resource: 'bkt-exports', action: 'read' }, fields: { src: ATK, auth: 'none (public)', region: 'unknown', objects: 25, bytes: 1181116006 }, ...(leak ? { consequence: { cost: 3, label: 'Customer data downloaded from the public bucket', prevented: 'no more customer data was downloaded from the public bucket', text: 'Customer names, addresses and email addresses were downloaded by someone outside the company. This is a personal data breach and the company must assess whether to report it.' } } : {}) }));
}
for (const t of [m(14, 50), m(15, 20), m(15, 50)]) story.push(api(`e-key-snap-${t}`, t, 'svc-etl', 'read', 'db-orders', { sev: 'high', key: 'dbread', keyWeight: 0, summary: 'svc-etl exported an orders database snapshot (2.3 GB) from 203.0.113.60', access: { who: 'LEAK:svc-etl', resource: 'db-orders', action: 'read' }, fields: { src: ATK, auth: 'access key (old)', region: 'unknown', bytes: 2469606195 }, consequence: { cost: 4, label: 'Orders data exported with the leaked key', prevented: 'the leaked key could not export any more orders data', text: 'A copy of the orders database left the company using the leaked key. This is a personal data breach and the company must assess whether to report it.' } }));
for (let t = m(14, 40); t <= m(15, 55); t += 30) story.push(api(`e-key-sec-${t}`, t, 'svc-etl', 'read', 'sec-prod', { sev: 'high', key: 'keyuse', keyWeight: 0, summary: 'svc-etl read the production secrets from 203.0.113.60', access: { who: 'LEAK:svc-etl', resource: 'sec-prod', action: 'read' }, fields: { src: ATK, auth: 'access key (old)', region: 'unknown', secrets: 9 } }));

// Ordinary activity: the things the business needs, from a fixed seed.
function ordinary() {
  let seed = 20261023;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out = [];
  const every = (idp, from, to, step, f) => {
    for (let t = from + Math.floor(rnd() * step); t <= to; t += step) out.push(f(`${idp}-${t}`, t));
  };
  const END = m(15, 59);
  every('o-site', m(13, 0), END, 2, (id, t) => api(id, t, 'anonymous', 'read', 'bkt-site', { summary: 'anonymous read website assets (public site)', access: { who: 'PUBLIC', resource: 'bkt-site', action: 'read' }, fields: { src: `192.0.2.${10 + Math.floor(rnd() * 80)}`, auth: 'none (public)', objects: 6 } }));
  every('o-web', m(13, 0), END, 3, (id, t) => api(id, t, 'role-web', 'write', 'db-orders', { summary: 'role-web wrote an order to the orders database', access: { who: 'role-web', resource: 'db-orders', action: 'write' }, fields: { auth: 'role (vm-web)' } }));
  every('o-up', m(13, 0), END, 9, (id, t) => api(id, t, 'role-web', 'write', 'bkt-uploads', { summary: 'role-web saved a customer upload', access: { who: 'role-web', resource: 'bkt-uploads', action: 'write' }, fields: { auth: 'role (vm-web)' } }));
  every('o-sam', m(13, 0), END, 20, (id, t) => api(id, t, 'sam', 'read', 'bkt-uploads', { summary: 'sam read a customer upload', access: { who: 'sam', resource: 'bkt-uploads', action: 'read' } }));
  every('o-etl', m(13, 0), END, 30, (id, t) => api(id, t, 'svc-etl', 'write', 'db-analytics', { summary: 'svc-etl loaded the analytics warehouse (office address)', access: { who: 'svc-etl', resource: 'db-analytics', action: 'write' }, fields: { auth: 'access key', bytes: 41000000 } }));
  every('o-etlr', m(13, 0), END, 30, (id, t) => api(id, t, 'svc-etl', 'read', 'bkt-exports', { summary: 'svc-etl read the exports file (office address)', access: { who: 'svc-etl', resource: 'bkt-exports', action: 'read' }, fields: { auth: 'access key', bytes: 410000000 } }));
  every('o-ci', m(13, 0), END, 40, (id, t) => api(id, t, 'svc-ci', 'write', 'vm-web', { summary: 'svc-ci deployed the web server', access: { who: 'svc-ci', resource: 'vm-web', action: 'write' }, fields: { auth: 'access key' } }));
  every('o-cis', m(13, 0), END, 40, (id, t) => api(id, t, 'svc-ci', 'read', 'sec-prod', { summary: 'svc-ci read the deploy secrets', access: { who: 'svc-ci', resource: 'sec-prod', action: 'read' }, fields: { auth: 'access key' } }));
  every('o-cit', m(13, 0), END, 60, (id, t) => api(id, t, 'svc-ci', 'write', 'bkt-site', { summary: 'svc-ci published website assets', access: { who: 'svc-ci', resource: 'bkt-site', action: 'write' }, fields: { auth: 'access key' } }));
  every('o-dev', m(13, 0), END, 25, (id, t) => api(id, t, 'jamie', 'write', 'bkt-dev', { summary: 'jamie saved a file to the dev bucket', access: { who: 'jamie', resource: 'bkt-dev', action: 'write' } }));
  every('o-dep', m(13, 0), END, 50, (id, t) => api(id, t, 'kit', 'write', 'vm-web', { summary: 'kit deployed to the web server', access: { who: 'kit', resource: 'vm-web', action: 'write' } }));
  out.push(api('o-alex-1', m(14, 0), 'alex', 'read', 'bkt-exports', { summary: 'alex read the exports file for the weekly report', access: { who: 'alex', resource: 'bkt-exports', action: 'read' }, fields: { bytes: 410000000 } }));
  out.push(api('o-alex-2', m(15, 10), 'alex', 'read', 'bkt-exports', { summary: 'alex read the exports file for the weekly report', access: { who: 'alex', resource: 'bkt-exports', action: 'read' }, fields: { bytes: 410000000 } }));
  out.push(api('o-exp-w', m(13, 30), 'role-export', 'write', 'bkt-exports', { summary: 'role-export wrote exports.csv (410 MB) for the nightly run', access: { who: 'role-export', resource: 'bkt-exports', action: 'write' }, fields: { auth: 'role (fn-export)', bytes: 410000000 } }));
  out.push(api('o-exp-r', m(13, 28), 'role-export', 'read', 'db-orders', { summary: 'role-export read the orders for the nightly run', access: { who: 'role-export', resource: 'db-orders', action: 'read' }, fields: { auth: 'role (fn-export)' } }));
  out.push(api('o-bk-w', m(15, 15), 'svc-backup', 'write', 'bkt-backups', { summary: 'svc-backup stored the afternoon backup (6 GB)', access: { who: 'svc-backup', resource: 'bkt-backups', action: 'write' }, fields: { auth: 'access key', bytes: 6442450944 } }));
  out.push(api('o-bk-r', m(15, 12), 'svc-backup', 'read', 'db-orders', { summary: 'svc-backup read the orders database for the afternoon backup', access: { who: 'svc-backup', resource: 'db-orders', action: 'read' }, fields: { auth: 'access key' } }));
  out.push(api('o-dana', m(14, 25), 'dana', 'admin', 'db-orders', { summary: 'dana ran a maintenance task on the orders database (multi-factor sign-in)', access: { who: 'dana', resource: 'db-orders', action: 'admin' }, fields: { auth: 'sign-in + MFA' } }));
  return out;
}

const events = [...story, ...ordinary()];

// ── The scenario ────────────────────────────────────────────────
export const CLOUD_BUCKET = {
  id: 'cloud-bucket',
  title: 'The bucket that anyone could read',
  workspace: 'cloud',
  path: 'cloud',
  pathLabel: 'Cloud Security',
  blurb: 'A posture scanner flags a public customer bucket and a leaked key. Map who can reach what, close the exposure, and keep every legitimate service working.',
  brief: [
    'It is 14:30 on Tuesday. The cloud posture scanner raised two high findings at 14:25: a customer data bucket that anyone can read, and an access key found in a public code repository. The platform team is in a meeting and has handed it to you.',
    'The estate is small but tangled: people, groups, roles and service accounts, ten resources, and a set of grants that grew over the years. Work out who can reach what, find out what has already happened, and apply fixes. Each fix takes effect from the minute you apply it. Cut too much and real services break.',
  ],
  clockStart: m(14, 30),
  horizon: m(16, 30),
  ui: {
    name: 'Contoso cloud console',
    nav: ['brief', 'findings', 'logs', 'estate', 'changes', 'respond', 'case', 'report'],
    labels: { respond: 'Tell people', changes: 'Changes & services' },
    examples: ['actor:anonymous', 'src:203.0.113.60', 'resource:db-orders', 'actor:svc-etl', 'type:config', 'sev:high', 'auth:key'],
    searchHint: 'actor:svc-etl   resource:bkt-exports   src:203.0.113.60   action:read   type:config   or plain words',
    toolkit: [
      ['Case brief', 'The referral, what is known and what you are asked for.'],
      ['Findings', 'What the posture scanner reports. Some matter a great deal, some are public by design, and some are hygiene.'],
      ['Log search', 'The audit log of every call. Search by actor:, resource:, action:, src:, auth:, region: or plain words. Each search takes a minute.'],
      ['Estate', 'The whole estate as a graph. Click a person, group, role, service account or resource to see its settings, who can reach it, what it can reach and the fixes available.'],
      ['Changes & services', 'The fixes you have applied (with undo) and the business services that must keep working.'],
      ['Case file', 'Pin the events that prove what happened.'],
    ],
    briefPanel: {
      heading: 'Referral: two high findings',
      paragraphs: ['At 14:25 the posture scanner flagged the customer exports bucket as open to the public, and found an access key for the ETL service account in a public code repository. Nobody has looked at either since.', 'The cloud account holds the web shop: orders, customer exports, backups and the secrets that run production. People and services both reach it, so be careful what you cut.'],
      known: ['The customer exports bucket holds names, addresses and email addresses.', 'The ETL key is 412 days old and still valid.', 'Backups, payroll-style exports and the weekly report all run through this account.', 'The public website loads its images from a bucket that is public on purpose.'],
      asks: ['Find out what has already happened, and when it began.', 'Close the exposure: public access, the leaked key and any permission that is far wider than its job.', 'Keep every legitimate service working.', 'Record how far it got and what should change permanently.'],
    },
    tips: {
      brief: 'Read the referral first. Two of the findings are about the same attacker and have to be closed in different ways.',
      findings: 'The scanner lists what it noticed, not what matters most. Open one to see it on the graph. Public by design is not the same as public by mistake.',
      logs: 'The audit log shows every call. Look for access from addresses nobody uses, anonymous requests to private-looking data, and keys used from somewhere new. Calls your fixes have stopped show as denied.',
      estate: 'Click a node to see its settings, who can reach it, what it can reach and the fixes on offer. Select carefully: a fix that is too blunt breaks a service.',
      changes: 'Every fix you have applied, with undo, and every service that has to keep working. A red one is something you have broken.',
      respond: 'Tell the people who need to act. A company-wide email before the facts are known does harm.',
      case: 'Your evidence timeline, in time order.',
      report: 'Your report is graded against what really happened, and credit depends on the evidence you pinned.',
    },
    groupLabels: { evidence: 'Evidence pinned', response: 'Exposure and services' },
  },
  entities,
  targets: { contact: ['Head of engineering', 'Data protection officer', 'Whole company'] },
  actions: [{ id: 'notify', label: 'Notify', targetKind: 'contact', cost: 2, group: 'Tell people' }],
  responses: [
    { action: 'notify', target: 'Head of engineering', good: true, points: 2, label: 'Tell the head of engineering', why: 'Engineering owns the permissions and the code repository, and has to clean up the leak at its source.', text: 'Dana is told what you found, and starts removing the key from the repository history.' },
    { action: 'notify', target: 'Data protection officer', good: true, points: 3, label: 'Tell the data protection officer', why: 'Customer personal data was downloaded from a public bucket. The DPO decides whether the regulator and customers must be told, and the clock starts when you become aware.', text: 'The data protection officer is told, with the times and what is known. They will assess whether to report it.' },
    { action: 'notify', target: 'Whole company', good: false, points: 0, label: 'Email the whole company', harm: 2, text: 'A company-wide email goes out before the facts are known, and staff start guessing who was affected.' },
  ],
  defaults: { notify: { text: 'Done.' } },
  events,
  alerts: [],
  cloud: {
    resources,
    identities,
    grants,
    trusts,
    attacker: { leaked: ['svc-etl'] },
    needs,
    threats,
    findings,
    fixes,
    reference: ['fx-exports-private', 'fx-etl-rotate', 'fx-g4-narrow', 'fx-g5-narrow', 'fx-t4-remove'],
  },
  roleLabels: {
    misconfig: 'the bucket being made public',
    leak: 'the key found in the public repository',
    anon: 'the anonymous downloads of the exports',
    keyuse: 'the leaked key being used from a new address',
    dbread: 'the orders database being read with the leaked key',
  },
  roleHints: {
    misconfig: 'Search type:config or resource:bkt-exports action:set-public-read.',
    leak: 'Search type:repo or actor:secret-scanner.',
    anon: 'Search actor:anonymous resource:bkt-exports.',
    keyuse: 'Search actor:svc-etl src:203.0.113.60. The office address is 198.51.100.20.',
    dbread: 'Search resource:db-orders src:203.0.113.60.',
  },
  report: [
    { id: 'entry', kind: 'set', title: 'What exposed the data', label: 'What exposed the data?', options: [['public-bucket', 'A bucket made public'], ['leaked-key', 'An access key leaked in a public repository'], ['weak-password', 'A weak or guessed password'], ['vulnerable-server', 'An unpatched server'], ['insider', 'A member of staff']], truth: ['public-bucket', 'leaked-key'], points: 6, note: 'Two things: the exports bucket was made public at 11:12, and the ETL key was leaked in a public repository.' },
    { id: 'first', kind: 'time', title: 'First access', label: 'When did the attacker first reach customer data? (HH:MM)', hint: 'Use the first request from the unfamiliar address.', truth: m(14, 2), tolerance: 5, near: 30, points: 4, note: 'The first anonymous listing of the exports bucket was at 14:02.' },
    { id: 'data', kind: 'set', title: 'Data reached', label: 'What data did the attacker reach?', options: [['exports', 'Customer exports'], ['orders', 'The orders database'], ['secrets', 'The production secrets'], ['backups', 'The backups'], ['site', 'The website assets']], truth: ['exports', 'orders', 'secrets'], points: 6, note: 'The exports (publicly and with the key), the orders database and the secrets (with the key). Nothing shows the backups were touched, and the website assets are public on purpose.' },
    { id: 'excess', kind: 'set', title: 'Over-privileged', label: 'Which grants were far wider than their job?', options: [['svc-etl', 'The ETL service account'], ['grp-dev', 'Developers'], ['role-break-glass', 'The break-glass role (assumable by developers)'], ['svc-ci', 'The CI pipeline'], ['grp-support', 'The support team']], truth: ['svc-etl', 'grp-dev', 'role-break-glass'], points: 6, note: 'The ETL account had full access, developers could change production, and developers could become administrators. The CI pipeline and support team had narrow, justified access.' },
    { id: 'root', kind: 'choice', title: 'Root cause', label: 'Why was this possible?', options: [['no-guardrails', 'Access grew without review: public storage, a full-access service account and a long-lived key, with nothing to stop or flag them'], ['provider', 'A breach at the cloud provider'], ['phish', 'An administrator was phished'], ['insider', 'A member of staff did it deliberately'], ['zero-day', 'A brand-new flaw in the cloud platform']], truth: 'no-guardrails', points: 4, note: 'No attacker needed a clever exploit: the exposure was configuration that nobody reviewed.' },
    { id: 'followup', kind: 'set', title: 'Permanent fixes', label: 'What should change permanently?', options: [['block-public-default', 'Block public access by default, with an approval step for exceptions'], ['short-lived', 'Replace long-lived keys with short-lived credentials, and rotate the rest'], ['secret-scanning', 'Scan code for secrets before it is pushed'], ['least-privilege', 'Review grants regularly against what each identity needs'], ['disable-logging', 'Turn off logging to reduce noise'], ['share-admin', 'Share one administrator login for emergencies']], truth: ['block-public-default', 'short-lived', 'secret-scanning', 'least-privilege'], points: 5, note: 'Block public by default, short-lived credentials, secret scanning and regular least-privilege reviews. Disabling logging and sharing a login would make it worse.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary', minLength: 40, points: 4, placeholder: 'What happened and when, what was exposed, which fixes you applied and why, what it cost, and what should change.' },
  ],
  grading: { triage: 0, evidence: 20, response: 45, reportTotal: 35, harmScale: 1, cap: 'Customer data left the company before the exposure was closed. A good investigation does not make up for that.', capAt: 3, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'cloud-rotate',
      question: 'You blocked public access to the exports bucket, but the attacker could still read it. Why?',
      options: [
        { text: 'They also held the leaked ETL key, and that account was allowed to read the bucket. The key has to be rotated as well', correct: true, explain: 'Closing one route does not close another. A leaked key works wherever its account has access, so removing the exposure and revoking the credential are separate jobs.' },
        { text: 'Blocking public access never works on storage buckets', correct: false, explain: 'It works. It closed the anonymous route; the key was a second one.' },
        { text: 'The bucket needed encryption turned on first', correct: false, explain: 'Encryption protects data at rest, not from someone who has been given access.' },
        { text: 'The change takes 24 hours to apply', correct: false, explain: 'It took effect at once. The log shows the anonymous requests stopped.' },
      ],
    },
    {
      id: 'cloud-narrow',
      question: 'Why was "remove the ETL service account\'s grant" a worse fix than "limit it to the exports bucket and the analytics warehouse"?',
      options: [
        { text: 'Removing it broke the ETL job, which needs those two things. Narrowing keeps what the job needs and removes what it does not', correct: true, explain: 'Least privilege means exactly the access a job needs. Removing everything is as unhelpful as leaving everything.' },
        { text: 'Removed grants come back by themselves after a day', correct: false, explain: 'They do not. The cost was an immediate outage of the ETL job.' },
        { text: 'The ETL account is not allowed to have any grants', correct: false, explain: 'Service accounts need grants to do their work.' },
        { text: 'There is no difference, because both leave the leaked key working', correct: false, explain: 'Rotating the key is what stops the leaked key. Narrowing limits what a key could reach.' },
      ],
    },
  ],
  story: [
    '11:12 Jamie makes the customer exports bucket public to share a file with a partner. Nothing flags it.',
    '13:50 A scanner finds the ETL service account\'s access key in a public code repository. The key is 412 days old.',
    '14:02 Someone starts listing and downloading the exports bucket anonymously from 203.0.113.60.',
    '14:12 The same address uses the leaked key to read the production secrets, then requests snapshots of the orders database.',
    'The data kept leaving until the bucket was closed and the key rotated. Underneath, access had grown without review: a service account with full access, developers who could change production and become administrators, and nothing to catch a public bucket.',
  ],
};
