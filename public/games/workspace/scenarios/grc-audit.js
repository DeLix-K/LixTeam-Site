// Governance, Risk and Compliance workspace, assignment 1: "The audit with twelve findings".
// Everything here is fictional. The framework requirements are simplified teaching labels, not clause-by-clause
// quotations of any standard or law, and the company, its people and its documents are invented.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   09:00  The auditors' draft report arrives with 12 findings, 5 of them rated "major". The closing meeting is at
//          15:00. The finance director has £40k for the whole plan. The board wants a one-page plan by 15:30.
//   Two of the majors are wrong (the auditor sampled the wrong place or the wrong system) and can be challenged, but
//   only with evidence you have actually read. One finding rated "minor" is the single biggest risk. One requirement
//   in the frameworks has no control behind it at all, and the audit did not notice.
//   At 15:00 any major finding with no plan and no accepted challenge is recorded as a major non-conformity.

const m = (h, mi = 0) => h * 60 + mi;

const OWNERS = ['CEO', 'CISO', 'Head of IT', 'DPO', 'HR Director', 'Facilities manager', 'Finance Director', 'Head of Engineering', 'Procurement lead'];

const doc = (id, title, text) => ({ id, title, text });

const findings = [
  {
    id: 'AF-01', rating: 'Major', title: 'No tested incident response plan or breach notification procedure', area: 'Incident management and data protection', L: 3, I: 5,
    docs: [
      doc('D1', 'Auditor working paper', 'We asked for the incident response plan. We were given a two-page draft dated 2024 that was never approved or exercised. We asked how the company would tell the regulator within 72 hours of becoming aware of a personal data breach. There is no procedure.'),
      doc('D2', 'On-call rota and ticket extract', 'The security on-call rota is staffed and works. Incidents are logged in the ticket system with times and owners. Nothing in the tickets records a decision about whether a regulator or customers had to be told.'),
      doc('D3', 'Last year\'s incident log', 'Two incidents were logged: a lost phone and a misdirected email containing a client\'s health details. Neither has a record that anyone assessed whether it had to be reported.'),
    ],
    options: [
      { id: 'iplan', kind: 'treat', label: 'Write, approve and exercise a plan and a notification procedure', cost: 12, effect: 0.9, sets: ['plan:AF-01'], done: 'The plan is written and approved, and the leadership team runs a tabletop exercise.' },
      { id: 'iwrite', kind: 'treat', label: 'Write and approve a plan and a notification procedure (no exercise yet)', cost: 4, effect: 0.5, sets: ['plan:AF-01'], done: 'A plan and a notification procedure are written and signed off.' },
      { id: 'insure', kind: 'transfer', label: 'Buy cyber insurance to cover the cost of an incident', cost: 6, effect: 0.25, done: 'A policy is bought. It pays for some costs; it does not make an incident less likely or less damaging.' },
    ],
    good: ['iplan', 'iwrite'], fine: ['insure'], ownerGood: ['CISO'], ownerFine: ['DPO', 'CEO'],
    why: 'The auditor was right: without a tested plan and a notification procedure, the first real breach is also a late and disorganised one.',
  },
  {
    id: 'AF-02', rating: 'Major', title: 'Privileged access is not reviewed', area: 'Access control', L: 1, I: 2,
    docs: [
      doc('D1', 'Auditor working paper', 'We asked IT for evidence of periodic reviews of privileged access. The IT share contained none. Access to privileged accounts is therefore not being reviewed.'),
      doc('D2', 'Quarterly access review pack (HR share)', 'Reviews took place in January, April, July and October. Each pack lists every privileged account, signed by the HR Director and the Head of IT. After the July review 14 accounts were removed or reduced. The packs are stored on the HR share, not the IT share.'),
      doc('D3', 'Privileged account list', 'Fourteen accounts, each with an owner and a last-review date within the last quarter.'),
    ],
    challenge: { valid: true, proof: 'D2', accepted: 'The auditor reads the signed packs and withdraws the finding. Evidence dated before the audit is exactly what was asked for.', rejected: '' },
    options: [{ id: 'workflow', kind: 'treat', label: 'Build an access review workflow in the IT tools', cost: 8, effect: 0.5, sets: ['plan:AF-02'], done: 'A workflow is built. Reviews were already happening, so this adds convenience, not control.' }],
    good: ['challenge'], fine: ['workflow'], ownerGood: ['Head of IT', 'HR Director'], ownerFine: ['CISO'],
    why: 'The reviews were done and signed. The auditor looked in the wrong place. Evidence you can show, read before the auditor sees it, is the whole answer.',
  },
  {
    id: 'AF-03', rating: 'Major', title: 'Backups have never been restore-tested', area: 'Backup and recovery', L: 3, I: 5,
    docs: [
      doc('D1', 'Auditor working paper', 'Nightly backup jobs report success. We asked when a full restore was last tested. Nobody could say. The ticket history shows no restore test in at least 18 months.'),
      doc('D2', 'Backup job report', 'Last 30 nights: 30 successes. Backup size has fallen by 40% in the last 6 months without a recorded reason.'),
    ],
    options: [
      { id: 'once', kind: 'treat', label: 'Run a full restore test now and fix what it finds', cost: 2, effect: 0.5, sets: ['plan:AF-03'], done: 'A full restore is tested. It exposes two jobs that were silently skipping a database, which are fixed.' },
      { id: 'restore', kind: 'treat', label: 'Automate quarterly restore tests with reporting to the board', cost: 10, effect: 0.9, sets: ['plan:AF-03'], done: 'Restore tests are scheduled and automated, and the results go to the board each quarter.' },
      { id: 'insure', kind: 'transfer', label: 'Add data-loss cover to the insurance', cost: 6, effect: 0.25, done: 'Cover is added. It pays out if data is lost; it does not stop it being lost.' },
    ],
    good: ['once', 'restore'], fine: ['insure'], ownerGood: ['Head of IT'], ownerFine: ['CISO'],
    why: 'A backup that has never been restored is a hope, not a control. A single restore test is cheap and tells you whether the rest is worth paying for.',
  },
  {
    id: 'AF-04', rating: 'Minor', title: 'Remote access does not require multi-factor authentication', area: 'Access control', L: 4, I: 5,
    docs: [
      doc('D1', 'Auditor working paper', 'Administrators use multi-factor authentication. Staff connecting to the VPN and the email system from outside the office use a password only. About 140 staff work remotely at least one day a week. Rated minor because administrators are covered.'),
      doc('D2', 'Sign-in log extract', 'In the last 30 days there were 11,400 password-only remote sign-ins and 312 failed attempts from addresses in 9 countries. Two accounts had 40 failed attempts each from the same address before the password was correct.'),
      doc('D3', 'Recent industry incident reports', 'Reports from peers show stolen or guessed passwords on remote access with no second factor as the most common way into healthcare-sector networks this year.'),
    ],
    options: [{ id: 'mfa', kind: 'treat', label: 'Require multi-factor authentication for all remote access', cost: 6, effect: 0.95, sets: ['plan:AF-04'], done: 'Multi-factor authentication is required for the VPN and email from outside the office.' }],
    good: ['mfa'], fine: [], ownerGood: ['Head of IT'], ownerFine: ['CISO'],
    why: 'The auditor rated it minor because administrators are covered. Real attackers go for the 140 staff passwords. It is the biggest risk on the list and one of the cheapest to fix.',
  },
  {
    id: 'AF-05', rating: 'Minor', title: 'Disk encryption is not enforced on 12% of laptops', area: 'Device security', L: 3, I: 4,
    docs: [
      doc('D1', 'Auditor working paper', 'Of 250 laptops sampled from the asset list, 30 had no disk encryption enabled. Some staff carry client records on laptops when visiting homes.'),
      doc('D2', 'Device management report', 'The management console can enforce encryption by policy. 30 laptops are excluded from the policy because they were enrolled before it existed.'),
    ],
    options: [{ id: 'enforce', kind: 'treat', label: 'Enforce encryption by policy and enrol the 30 laptops', cost: 5, effect: 0.9, sets: ['plan:AF-05'], done: 'The 30 laptops are brought under the policy and encrypted.' }],
    good: ['enforce'], fine: [], ownerGood: ['Head of IT'], ownerFine: ['CISO'],
    why: 'A lost laptop with client records and no encryption is a reportable breach. The fix is a policy change the tools already support.',
  },
  {
    id: 'AF-06', rating: 'Minor', title: 'Supplier security reviews are out of date for 3 of 8 critical suppliers', area: 'Suppliers', L: 3, I: 3,
    docs: [
      doc('D1', 'Auditor working paper', 'All critical suppliers completed a security checklist when they were onboarded. For three of the eight, the last review was more than two years ago.'),
      doc('D2', 'Supplier register', 'The three are the payroll provider, the appointment-booking platform and the document storage provider. The booking platform holds client names and contact details.'),
    ],
    options: [
      { id: 'review3', kind: 'treat', label: 'Review the three overdue critical suppliers now', cost: 4, effect: 0.7, sets: ['plan:AF-06'], done: 'The three suppliers are reviewed and the gaps are logged with dates.' },
      { id: 'programme', kind: 'treat', label: 'Build a full supplier assurance programme for all suppliers', cost: 18, effect: 0.95, sets: ['plan:AF-06'], done: 'A programme is designed and staffed. It will take months to show results.' },
    ],
    good: ['review3'], fine: ['programme'], ownerGood: ['Procurement lead'], ownerFine: ['CISO', 'Finance Director'],
    why: 'Three overdue reviews is a job, not a programme. Reviewing the three that hold client data buys most of the benefit for a fraction of the cost.',
  },
  {
    id: 'AF-07', rating: 'Observation', title: 'Security awareness training completion is 82%', area: 'People', L: 2, I: 3,
    docs: [
      doc('D1', 'Auditor working paper', 'Mandatory annual training: 82% completion this year, 91% last year. Observed; no non-conformity raised.'),
      doc('D2', 'Training report', 'The 18% who have not completed are mostly part-time field staff. Reminders are sent ad hoc.'),
    ],
    options: [{ id: 'remind', kind: 'treat', label: 'Send scheduled reminders and escalate to line managers', cost: 3, effect: 0.8, sets: ['plan:AF-07'], done: 'Reminders and manager escalation are scheduled.' }],
    good: ['remind', 'accept'], fine: [], ownerGood: ['HR Director'], ownerFine: ['CISO'],
    why: 'A low risk within appetite. Fixing it or accepting it with sign-off are both reasonable.',
  },
  {
    id: 'AF-08', rating: 'Minor', title: 'No visitor log is kept at reception', area: 'Physical security', L: 2, I: 2,
    docs: [
      doc('D1', 'Auditor working paper', 'We walked in and were not asked to sign in. The reception desk has no visitor book or system.'),
      doc('D2', 'Building plan', 'Reception is separate from the data room, which is badge-controlled. No client records are held at reception.'),
    ],
    options: [{ id: 'logbook', kind: 'treat', label: 'Introduce a visitor book and badges', cost: 1, effect: 1, sets: ['plan:AF-08'], done: 'Visitors sign in and wear badges from Monday.' }],
    good: ['logbook', 'accept'], fine: [], ownerGood: ['Facilities manager'], ownerFine: [],
    why: 'A cheap, low-risk gap. Fix it for £1k or accept it: either is defensible, as long as someone owns it.',
  },
  {
    id: 'AF-09', rating: 'Major', title: 'Customer records are kept for ten years; the retention schedule is not applied', area: 'Data protection', L: 4, I: 3,
    docs: [
      doc('D1', 'Auditor working paper', 'The retention schedule says client records are kept for 6 years after the last service. The care system holds records going back 10 years and nothing is ever deleted. Keeping personal data longer than needed breaches the storage limitation principle.'),
      doc('D2', 'Care system report', 'Of 82,000 client records, 19,000 are older than 6 years after the last service. Purging requires a tested script and sign-off from the clinical lead.'),
      doc('D3', 'Legal note', 'Some records must be kept longer if a complaint or claim is open. 340 records are flagged for that and must be excluded from any purge.'),
    ],
    options: [
      { id: 'purge', kind: 'treat', label: 'Build and run a tested purge of expired records (excluding legal holds)', cost: 9, effect: 0.8, sets: ['plan:AF-09'], done: 'Expired records are purged, with the 340 on legal hold excluded.' },
      { id: 'policy', kind: 'treat', label: 'Update the policy text to match what is actually done', cost: 1, effect: 0.2, sets: ['plan:AF-09'], done: 'The policy is updated. The data is still there, and the practice is still non-compliant.' },
    ],
    good: ['purge'], fine: ['policy'], ownerGood: ['DPO'], ownerFine: ['CISO', 'Head of IT'],
    why: 'The auditor was right. Rewriting the policy to match a bad practice makes the document honest, not the practice compliant.',
  },
  {
    id: 'AF-10', rating: 'Observation', title: 'Penetration testing is annual, not repeated after major changes', area: 'Technical assurance', L: 2, I: 3,
    docs: [
      doc('D1', 'Auditor working paper', 'An external penetration test is done every year. There were two major changes this year (the booking platform and a new VPN) that were not tested separately. Observed; no non-conformity raised.'),
      doc('D2', 'Quote for post-change testing', 'Testing after each major change would cost about £15k a year.'),
    ],
    options: [{ id: 'postchange', kind: 'treat', label: 'Add a penetration test after each major change', cost: 15, effect: 0.5, sets: ['plan:AF-10'], done: 'Post-change testing is added to the plan.' }],
    good: ['accept'], fine: ['postchange'], ownerGood: ['CISO'], ownerFine: ['Head of IT'],
    why: 'A genuine improvement but low risk, and £15k is more than a third of the budget. Accepting it with sign-off and revisiting next year is the stronger plan.',
  },
  {
    id: 'AF-11', rating: 'Major', title: 'The password policy allows 6-character passwords', area: 'Access control', L: 1, I: 2,
    docs: [
      doc('D1', 'Auditor working paper', 'During testing we found a payroll system (LEGACY-PAYROLL) that accepted 6-character passwords.'),
      doc('D2', 'System inventory', 'LEGACY-PAYROLL was decommissioned on 12 March. Payroll now runs on the shared sign-in service, which requires 12 characters and multi-factor authentication. The legacy server was left powered on for archive reads and has no live accounts.'),
      doc('D3', 'Password policy v4', 'Minimum length 12 characters, enforced in the identity provider for every active system.'),
    ],
    challenge: { valid: true, proof: 'D2', accepted: 'The auditor accepts that the system tested was decommissioned and withdraws the finding. The system inventory was the evidence.', rejected: '' },
    options: [{ id: 'enforce', kind: 'treat', label: 'Retire the archive server and re-test password settings', cost: 2, effect: 0.5, sets: ['plan:AF-11'], done: 'The archive server is retired and the password settings re-tested.' }],
    good: ['challenge'], fine: ['enforce'], ownerGood: ['Head of IT'], ownerFine: ['CISO'],
    why: 'The auditor tested a system that no longer has users. The inventory and the current policy show the requirement is met.',
  },
  {
    id: 'AF-12', rating: 'Minor', title: 'There is no register of cloud services in use', area: 'Asset management', L: 3, I: 3,
    docs: [
      doc('D1', 'Auditor working paper', 'We asked for a list of cloud services holding company or client data. IT produced a list of 11. A review of expense claims found at least 6 more.'),
      doc('D2', 'Expense extract', 'The extra services include a file-sharing tool and two survey tools. Staff signed up with company email addresses and card payments.'),
    ],
    options: [
      { id: 'manual', kind: 'treat', label: 'Build the register by hand from expenses, single sign-on logs and a staff survey', cost: 2, effect: 0.4, sets: ['plan:AF-12'], done: 'A first register is built from expense and sign-in records.' },
      { id: 'discover', kind: 'treat', label: 'Deploy a cloud discovery tool and keep the register current', cost: 7, effect: 0.8, sets: ['plan:AF-12'], done: 'A discovery tool is deployed and the register updates automatically.' },
    ],
    good: ['manual', 'discover'], fine: [], ownerGood: ['Head of IT'], ownerFine: ['CISO', 'Head of Engineering'],
    why: 'You cannot protect what you cannot list. A hand-built register is a fast first step; a discovery tool keeps it true.',
  },
];

// ── Frameworks and controls ─────────────────────────────────────
const requirements = [
  { id: 'ISO-ACC', framework: 'ISO 27001 (simplified)', label: 'Access control' },
  { id: 'ISO-BKP', framework: 'ISO 27001 (simplified)', label: 'Information backup' },
  { id: 'ISO-INC', framework: 'ISO 27001 (simplified)', label: 'Incident management' },
  { id: 'ISO-SUP', framework: 'ISO 27001 (simplified)', label: 'Supplier relationships' },
  { id: 'ISO-AWR', framework: 'ISO 27001 (simplified)', label: 'Awareness and training' },
  { id: 'ISO-VUL', framework: 'ISO 27001 (simplified)', label: 'Management of technical vulnerabilities' },
  { id: 'CE-FW', framework: 'UK Cyber Essentials (simplified)', label: 'Firewalls' },
  { id: 'CE-CFG', framework: 'UK Cyber Essentials (simplified)', label: 'Secure configuration' },
  { id: 'CE-USR', framework: 'UK Cyber Essentials (simplified)', label: 'User access control' },
  { id: 'CE-MAL', framework: 'UK Cyber Essentials (simplified)', label: 'Malware protection' },
  { id: 'CE-UPD', framework: 'UK Cyber Essentials (simplified)', label: 'Security update management' },
  { id: 'GD-SEC', framework: 'UK GDPR (simplified)', label: 'Security of processing' },
  { id: 'GD-BRN', framework: 'UK GDPR (simplified)', label: 'Breach notification' },
  { id: 'GD-DPIA', framework: 'UK GDPR (simplified)', label: 'Data protection impact assessment' },
];

const controls = [
  { id: 'C1', name: 'Access control policy and quarterly access reviews', evidence: 'Policy v4. Review packs signed in January, April, July and October (held on the HR share).', fits: { 'ISO-ACC': 'full', 'CE-USR': 'full', 'GD-SEC': 'partial' } },
  { id: 'C2', name: 'Multi-factor authentication for administrators', evidence: 'Enforced for 14 administrator accounts. Not enforced for staff remote access.', fits: { 'ISO-ACC': 'partial', 'CE-USR': 'partial' } },
  { id: 'C3', name: 'Nightly backups to a second site', evidence: 'Jobs run nightly and report success. No restore has been tested in 18 months.', fits: { 'ISO-BKP': 'partial', 'GD-SEC': 'partial' } },
  { id: 'C4', name: 'Endpoint protection on all laptops', evidence: 'Agent on every managed laptop, central console, weekly reports.', fits: { 'CE-MAL': 'full', 'GD-SEC': 'partial' } },
  { id: 'C5', name: 'Critical patches within 14 days', evidence: 'The target was met for 96% of critical patches last quarter, tracked in tickets.', fits: { 'CE-UPD': 'full', 'ISO-VUL': 'full' } },
  { id: 'C6', name: 'Annual security awareness training', evidence: 'A mandatory annual module. 82% completion this year; reminders are ad hoc.', fits: { 'ISO-AWR': 'partial' } },
  { id: 'C7', name: 'Incident logging and an on-call rota', evidence: 'Incidents are logged in tickets and the rota works. There is no approved, tested response or notification procedure.', fits: { 'ISO-INC': 'partial', 'GD-BRN': 'partial' } },
  { id: 'C8', name: 'Supplier onboarding security checklist', evidence: 'Completed for every new supplier since 2023. No periodic review afterwards for 3 of 8 critical suppliers.', fits: { 'ISO-SUP': 'partial' } },
  { id: 'C9', name: 'Data protection impact assessments', evidence: 'A template and a register. Nine assessments completed for new projects since 2023.', fits: { 'GD-DPIA': 'full' } },
  { id: 'C10', name: 'Firewall change control', evidence: 'Every firewall change goes through a ticket with a second approver.', fits: { 'CE-FW': 'full' } },
];

// ── What lands during the day ───────────────────────────────────
const MAJORS = findings.filter((f) => f.rating === 'Major').map((f) => f.id);
const events = [
  { id: 'e-open', t: m(9, 0), type: 'audit', sev: 'info', summary: 'Opening meeting: three frameworks in scope, a draft report with 12 findings (5 rated major), closing meeting at 15:00', fields: { from: 'audit team' } },
  { id: 'e-rule', t: m(9, 20), type: 'email', sev: 'info', summary: 'Lead auditor: a challenge needs evidence that existed before the audit began, and that you can show us today', fields: { from: 'lead auditor' } },
  { id: 'e-owner', t: m(10, 30), type: 'email', sev: 'medium', summary: 'Lead auditor: any finding with no named owner by the closing meeting will be recorded as unmanaged', fields: { from: 'lead auditor' } },
  { id: 'e-appetite', t: m(9, 5), type: 'board', sev: 'info', summary: 'Board risk appetite (from the policy): a risk scoring 12 or more (likelihood x impact) must be treated. 6 or less may be tolerated with the owner\'s sign-off. In between is the owner\'s decision', fields: { from: 'board' } },
  { id: 'e-budget', t: m(12, 0), type: 'email', sev: 'medium', summary: 'Finance Director: the budget for this plan is £40k, not the £100k hoped for. It must cover everything', fields: { from: 'Finance Director', budget: 40 } },
  { id: 'e-board', t: m(13, 30), type: 'board', sev: 'medium', summary: 'Board chair: a one-page plan and a short summary are needed by 15:30', fields: { from: 'board chair' } },
  { id: 'e-sup', t: m(11, 0), type: 'email', sev: 'info', summary: 'Procurement: the document storage provider renews at 14:00 and wants an answer', fields: { from: 'Procurement lead' } },
  { id: 'e-close', t: m(15, 0), type: 'audit', sev: 'high', summary: 'Closing meeting: any major finding with no plan and no accepted challenge is recorded as a major non-conformity. Three or more and certification is withheld', fields: { from: 'audit team' } },
  ...MAJORS.map((id) => ({
    id: `e-nc-${id}`, t: m(15, 0), type: 'audit', sev: 'high', summary: `Recorded as a major non-conformity: ${findings.find((f) => f.id === id).title}`, fields: { finding: id },
    unless: [`plan:${id}`], consequence: { cost: 5, label: 'Major non-conformity recorded', prevented: 'no major finding was left without a plan or an accepted challenge', text: 'A major finding with no plan and no accepted challenge was recorded at the closing meeting. Three or more and certification is withheld.' },
  })),
];

export const GRC_AUDIT = {
  id: 'grc-audit',
  title: 'The audit with twelve findings',
  workspace: 'grc',
  path: 'grc',
  pathLabel: 'Governance, Risk and Compliance',
  blurb: 'An audit report with twelve findings and £40k. Read the evidence, challenge what is wrong, rate the real risks, name the owners, and turn it into a plan the board can fund.',
  brief: [
    'It is 09:00 on Tuesday. Contoso Care, a home-care provider with 900 staff and the records of 82,000 clients, has the draft audit report in front of it: 12 findings across three frameworks, five rated major. The closing meeting is at 15:00. You are the risk adviser.',
    'Some findings are right. Some are wrong. One that the auditor rated minor is the biggest risk the company has. There is £40k for the whole plan. Read the evidence, map the controls to the frameworks, rate each risk, give each one an owner, and choose a treatment: fix it, transfer it, accept it with sign-off, or challenge the auditor with evidence. Then report to the board.',
  ],
  clockStart: m(9, 0),
  horizon: m(16, 0),
  grc: { budget: 40, unit: 'k', riskPoints: 20, owners: OWNERS, findings, requirements, controls },
  ui: {
    name: 'Contoso risk and audit console',
    nav: ['brief', 'register', 'controls', 'heatmap', 'logs', 'case', 'report'],
    labels: { logs: 'Auditor emails', case: 'Plan' },
    noPins: true,
    examples: ['type:email', 'type:board', 'type:audit', 'owner', 'budget'],
    searchHint: 'type:email   type:board   type:audit   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known so far.'],
      ['Risk register', 'The auditor\'s 12 findings. Open one, read the evidence documents, rate the likelihood and impact, choose an owner and choose a treatment. Each document takes a few minutes to read.'],
      ['Controls', 'A matrix of the company\'s existing controls against the requirements in three frameworks. Tick what each control genuinely satisfies. A control that is claimed but not evidenced only partly counts.'],
      ['Heatmap', 'Your own ratings on a 5 by 5 grid, against the board\'s risk appetite, and what your plan does to them.'],
      ['Auditor emails', 'Messages from the audit team, the board and the finance director. They contain rules and deadlines.'],
      ['Plan', 'Your decisions, owners and budget.'],
    ],
    briefPanel: {
      heading: 'Referral: the draft audit report',
      paragraphs: ['The external auditors have issued a draft report for the certification audit. The closing meeting is at 15:00, and the board wants a one-page plan by 15:30.', 'The audit covers an information security standard, the UK Cyber Essentials requirements and data protection law. Contoso Care holds health-related records for 82,000 clients, so a data breach here is serious.'],
      known: ['12 findings: 5 rated major, 5 minor, 2 observations.', 'The board\'s risk appetite: a risk scoring 12 or more (likelihood x impact) must be treated; 6 or less may be tolerated with the owner\'s sign-off.', 'The budget is £40k for the whole plan.', 'The auditors say a challenge needs evidence that existed before the audit began.'],
      asks: ['Read the evidence for each finding and decide whether the auditor was right.', 'Rate each risk honestly, whatever the auditor called it.', 'Give every risk an owner who can actually act on it.', 'Spend the £40k where it removes the most risk, and tell the board what remains.'],
    },
    tips: {
      brief: 'Read the referral first. An audit rating is the auditor\'s opinion. The risk is yours to judge.',
      register: 'Open a finding and read its documents before you decide. Challenge only what the evidence supports: a failed challenge costs credibility. Rate the risk yourself.',
      controls: 'Tick only what a control genuinely satisfies. A control that exists on paper but has no evidence behind it counts for less. A requirement with no control at all is a gap the audit did not list.',
      heatmap: 'This is your own view of the risks. The line is the board\'s risk appetite: anything at 12 or above must be treated.',
      logs: 'Rules and deadlines from the audit team, the board and the finance director. Read them: they change what you can do.',
      case: 'Your decisions, owners and budget. Money spent on something low-risk is not available for something high.',
      report: 'Your report is graded against the true risks. Use the evidence, not the auditor\'s ratings.',
    },
    groupLabels: { triage: 'Risk register decisions', evidence: 'Control mapping', response: 'Risk removed' },
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
    { id: 'top', kind: 'set', title: 'Top risks', label: 'Which three findings are the biggest risks to the company?', options: findings.map((f) => [f.id, `${f.id} ${f.title}`]), truth: ['AF-04', 'AF-01', 'AF-03'], points: 8, note: 'AF-04 (remote access with no second factor), AF-01 (no tested incident plan) and AF-03 (backups never restored). The auditor rated the first of these minor.' },
    { id: 'wrong', kind: 'set', title: 'Findings the auditor got wrong', label: 'Which findings were wrong and could be challenged?', options: findings.filter((f) => ['AF-02', 'AF-11', 'AF-05', 'AF-09'].includes(f.id)).map((f) => [f.id, `${f.id} ${f.title}`]), truth: ['AF-02', 'AF-11'], points: 6, note: 'AF-02 (the reviews were done and signed, on the HR share) and AF-11 (the system tested was decommissioned). AF-05 and AF-09 were right.' },
    { id: 'under', kind: 'choice', title: 'Underrated finding', label: 'Which finding did the auditor under-rate most?', options: findings.filter((f) => f.rating !== 'Major').map((f) => [f.id, `${f.id} ${f.title}`]), truth: 'AF-04', points: 4, note: 'AF-04: rated minor because administrators are covered, but 140 staff sign in remotely with a password only.' },
    { id: 'gap', kind: 'choice', title: 'The gap nobody listed', label: 'Which requirement had no control behind it at all?', options: requirements.map((r) => [r.id, `${r.label} (${r.framework.split(' (')[0]})`]), truth: 'CE-CFG', points: 5, note: 'Secure configuration: none of the ten controls addresses it, and the audit did not list it.' },
    { id: 'board', kind: 'choice', title: 'What to tell the board', label: 'What should you tell the board?', options: [['fund-prioritised', 'Fund the prioritised plan: it removes most of the real risk, two findings are being challenged, and the remaining risks are within appetite or have named owners and dates'], ['all-fine', 'The audit is mostly paperwork and nothing needs funding'], ['more-money', 'We need £200k and a new CISO before anything else'], ['accept-all', 'Accept every finding and revisit next year']], truth: 'fund-prioritised', points: 5, note: 'A prioritised plan inside the budget, with the challenges and the remaining risks explained, is what a board can act on.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'One-page summary for the board', minLength: 40, points: 7, placeholder: 'What you found, what you challenged and why, what you will fix and what it costs, what you accepted and who signed it off, and what remains.' },
  ],
  grading: { triage: 30, evidence: 15, response: 20, reportTotal: 35, harmScale: 2, cap: 'Three or more major non-conformities were recorded at the closing meeting and certification is withheld. A good analysis does not make up for that.', capAt: 3, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'grc-rating',
      question: 'The auditor rated "no multi-factor authentication for remote access" as minor. Why was that rating too low?',
      options: [
        { text: 'The auditor looked at administrators only. The real exposure is 140 staff signing in remotely with a password, which is how most incidents in the sector begin. Likelihood and impact are both high', correct: true, explain: 'An audit rating reflects what the auditor sampled and the standard\'s wording. Your job as the adviser is to rate the risk to the organisation.' },
        { text: 'Minor findings are never important', correct: false, explain: 'Ratings are the auditor\'s opinion. This one hid the biggest risk on the list.' },
        { text: 'The auditor was biased', correct: false, explain: 'Nothing suggests that. The rating followed a narrow sample.' },
        { text: 'It was not a real gap', correct: false, explain: 'It was real, and the sign-in log showed attempts from nine countries.' },
      ],
    },
    {
      id: 'grc-challenge',
      question: 'Challenging "privileged access is not reviewed" succeeded, but challenging a real finding would have failed. What made the difference?',
      options: [
        { text: 'The signed review packs were evidence that existed before the audit and could be shown to the auditor. A challenge without that, or against a sound finding, costs credibility', correct: true, explain: 'Challenging well means reading the evidence first and challenging only what it supports. The auditor can only change a finding in response to evidence.' },
        { text: 'Challenges succeed if the company is persistent', correct: false, explain: 'Persistence without evidence is how credibility is lost.' },
        { text: 'Major findings can always be withdrawn', correct: false, explain: 'Most of the majors here were right and had to be treated.' },
        { text: 'The auditor had made a mistake in the rating, not the facts', correct: false, explain: 'The facts were wrong: the auditor looked in the wrong place.' },
      ],
    },
  ],
  story: [
    '09:00 The draft report lands: 12 findings, five rated major, closing meeting at 15:00, £40k.',
    'Two majors were wrong: the access reviews were done and signed on the HR share, and the password finding was about a decommissioned system. Both could be withdrawn with evidence.',
    'The finding rated minor, remote access without multi-factor authentication, was the single biggest risk. Incident response and untested backups were the next two, and both were rated major correctly.',
    'Ten controls were mapped to fourteen requirements. None of them addressed secure configuration, and the audit did not notice.',
    '15:00 Any major with no plan and no accepted challenge is recorded as a major non-conformity. Three or more and certification is withheld.',
  ],
};
