// The SOC Analyst Career Campaign: data only. Ranks, competencies and missions.
//
// Adding a mission = add the case to its game mode, then add an entry here. The
// career code (career.js) needs no changes, and the content-integrity test fails
// if a mission points at a case that does not exist.
//
// Ranks and scores are GAME progression. They are not qualifications, they are
// not validated assessments, and they do not guarantee job readiness.

export const COMPETENCIES = [
  { id: 'triage', name: 'Alert triage', blurb: 'Deciding what is noise, what needs a look and what is urgent.' },
  { id: 'phishing', name: 'Phishing and social engineering', blurb: 'Spotting lures, impersonation and pressure tactics.' },
  { id: 'identity', name: 'Identity investigation', blurb: 'Sign-ins, MFA, tokens, accounts and access.' },
  { id: 'endpoint', name: 'Endpoint and malware analysis', blurb: 'What ran, what it did, and where it called home.' },
  { id: 'correlation', name: 'Evidence correlation', blurb: 'Joining clues across tools into an attack chain.' },
  { id: 'hunting', name: 'Threat hunting', blurb: 'Looking for the attack nobody has alerted on yet.' },
  { id: 'response', name: 'Incident response', blurb: 'Containing, eradicating and recovering in the right order.' },
  { id: 'reporting', name: 'Reporting and communication', blurb: 'Telling people what happened, accurately and usefully.' },
  { id: 'leadership', name: 'Leadership and risk', blurb: 'Putting people and money where the risk is, and being straight with the board.', visibleFrom: 'lead' },
  { id: 'cloud', name: 'Cloud security', blurb: 'Keys, roles, storage and consoles in the cloud.' },
  { id: 'hardening', name: 'Secure configuration and hardening', blurb: 'Setting systems up to an agreed baseline, and making sure they stay that way.' },
  { id: 'secretsiam', name: 'Identity, secrets and access', blurb: 'Keeping passwords, keys and permissions under control, and giving each thing only what it needs.' },
  { id: 'pipeline', name: 'Secure build and delivery', blurb: 'Protecting the pipelines and dependencies that build and ship software.' },
  { id: 'scope', name: 'Scoping and rules of engagement', blurb: 'Knowing what you are authorised to test, what you are not, and how to stop safely.' },
  { id: 'recon', name: 'Reconnaissance and attack surface', blurb: 'Reading what an organisation exposes and deciding where to look first.' },
  { id: 'findings', name: 'Findings and reporting', blurb: 'Rating findings by real risk, evidencing them safely and reporting honestly.' },
  { id: 'netdesign', name: 'Network design and segmentation', blurb: 'Deciding which zones exist, and who should be able to reach what.' },
  { id: 'fwrules', name: 'Firewall rules and access control', blurb: 'Reading, writing and reviewing the rules that allow and deny traffic.' },
  { id: 'nettraffic', name: 'Traffic analysis and monitoring', blurb: 'Reading flows, DNS and logs to spot scanning, beacons and data leaving.' },
  { id: 'vulnscan', name: 'Scanning and validation', blurb: 'Reading scanner output, telling real findings from noise, and knowing what a scan does not cover.' },
  { id: 'vulnrisk', name: 'Risk-based prioritisation', blurb: 'Ranking by exploitation, exposure and impact, not by score alone.' },
  { id: 'remediate', name: 'Remediation and patching', blurb: 'Getting the right fixes done safely, and checking that they worked.' },
];

export const TIERS = [
  { id: 'beginner', name: 'Beginner', xpMultiplier: 1 },
  { id: 'intermediate', name: 'Intermediate', xpMultiplier: 1.5 },
  { id: 'advanced', name: 'Advanced', xpMultiplier: 2 },
  { id: 'senior', name: 'Senior', xpMultiplier: 2.5 },
  { id: 'lead', name: 'Lead', xpMultiplier: 3, note: 'Needs the Senior Analyst rank.' },
  { id: 'manager', name: 'Manager', xpMultiplier: 3.5, note: 'Needs the Incident Response Lead rank.' },
  // Every tier belongs to one career path (see PATHS). A tier with no `path` is on the analyst path.
  { id: 'cloud', name: 'Foundations', xpMultiplier: 2, path: 'cloud' },
  { id: 'cloud-prac', name: 'Practitioner', xpMultiplier: 2.5, path: 'cloud', note: 'Needs two Foundations missions passed.' },
  { id: 'cloud-lead', name: 'Senior', xpMultiplier: 3, path: 'cloud', note: 'Opens when you reach Cloud Security Engineer.' },
  { id: 'se-found', name: 'Foundations', xpMultiplier: 1, path: 'engineer' },
  { id: 'se-prac', name: 'Practitioner', xpMultiplier: 1.5, path: 'engineer', note: 'Needs two Foundations missions passed.' },
  { id: 'se-lead', name: 'Senior', xpMultiplier: 2.5, path: 'engineer', note: 'Opens when you reach Security Engineer.' },
  { id: 'pt-found', name: 'Foundations', xpMultiplier: 1, path: 'pentest' },
  { id: 'pt-prac', name: 'Practitioner', xpMultiplier: 1.5, path: 'pentest', note: 'Needs two Foundations missions passed.' },
  { id: 'pt-lead', name: 'Senior', xpMultiplier: 2.5, path: 'pentest', note: 'Opens when you reach Penetration Tester.' },
  { id: 'net-found', name: 'Foundations', xpMultiplier: 1, path: 'network' },
  { id: 'net-prac', name: 'Practitioner', xpMultiplier: 1.5, path: 'network', note: 'Needs two Foundations missions passed.' },
  { id: 'net-lead', name: 'Senior', xpMultiplier: 2.5, path: 'network', note: 'Opens when you reach Network Security Engineer.' },
  { id: 'vm-found', name: 'Foundations', xpMultiplier: 1, path: 'vuln' },
  { id: 'vm-prac', name: 'Practitioner', xpMultiplier: 1.5, path: 'vuln', note: 'Needs two Foundations missions passed.' },
  { id: 'vm-lead', name: 'Senior', xpMultiplier: 2.5, path: 'vuln', note: 'Opens when you reach Vulnerability Management Analyst.' },
];

// XP for a mission by medal (before the tier multiplier). Medal 0 = no pass.
export const MEDAL_XP = [0, 30, 45, 60];
export const MEDALS = ['No medal', 'Bronze', 'Silver', 'Gold'];
export const TRY_XP = 5; // once, for a first attempt that does not earn a medal
export const EXAM_XP = [0, 0, 120, 150]; // an exam must be passed at silver or better

// requires: xp, passedTier { tier: count }, mastery { competency: min score },
//           masteryScope [tiers] (mastery counted only from those tiers' missions),
//           exam: id of a promotion exam that must have been passed
export const RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how an analyst thinks.', requires: {} },
  {
    id: 'junior', name: 'Junior Analyst', blurb: 'You can triage alerts, spot phishing and read a sign-in log.',
    requires: { xp: 80, passedTier: { beginner: 2 } },
  },
  {
    id: 'analyst', name: 'SOC Analyst', blurb: 'You correlate evidence across systems and separate false alarms from real threats.',
    requires: {
      xp: 400, passedTier: { beginner: 3, intermediate: 2 },
      mastery: { triage: 55, phishing: 50, identity: 55 }, masteryScope: ['beginner', 'intermediate'],
      exam: 'soc-exam',
    },
  },
  {
    id: 'senior', name: 'Senior Analyst', blurb: 'You hunt threats, work ambiguous evidence, prioritise competing incidents and mentor others.',
    requires: {
      xp: 1100, passedTier: { intermediate: 5, advanced: 3, senior: 2 },
      mastery: { correlation: 65, endpoint: 60, response: 60 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior'],
      exam: 'senior-exam',
    },
  },
  {
    id: 'lead', name: 'Incident Response Lead', blurb: 'You coordinate containment, weigh business impact and brief leadership.',
    requires: {
      xp: 1900, passedTier: { lead: 3 },
      mastery: { response: 70, reporting: 65, correlation: 65 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior'],
      exam: 'lead-exam',
    },
  },
  {
    id: 'manager', name: 'SOC Manager', blurb: 'You manage team capacity, put resources where the risk is, and give the board an honest account.',
    requires: {
      xp: 2600, passedTier: { manager: 2 },
      mastery: { leadership: 65, reporting: 70, response: 70 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior', 'lead', 'manager'],
      exam: 'manager-exam',
    },
  },
];

// kind -> which game runs it. `ref` is the id of the case inside that game.
// par = the score that counts as full marks (for the mastery score); simulations
// report their own share of full marks, so theirs is 0.
export const MISSIONS = [
  // ── Beginner
  {
    id: 'm01-triage', title: 'Triage 101', tier: 'beginner', kind: 'triage', mode: 'phish-or-legit', minutes: 5, par: 1500, access: 'free',
    blurb: 'Ten messages and alerts. Which are real, and which are not? Say how sure you are.',
    competencies: { triage: 0.6, phishing: 0.4 },
    items: ['p-lookalike-pw', 'l-pw-reset', 'p-invoice-html', 'l-calendar', 'p-mfa-approve', 'l-security-alert', 'p-qr-mfa', 'l-newsletter', 'p-bank-card', 'l-it-maint'],
    unlock: {},
  },
  {
    id: 'm02-invoice', title: 'The invoice that was not', tier: 'beginner', kind: 'detective', mode: 'cyber-detective', ref: 'invoice', minutes: 10, par: 250, access: 'free',
    blurb: 'A finance colleague clicked a supplier link and typed her password. Trace what happened.',
    competencies: { phishing: 0.7, identity: 0.3 },
    unlock: {},
  },
  {
    id: 'm03-signin', title: 'Approve this sign-in?', tier: 'beginner', kind: 'social', mode: 'social-engineering', ref: 'it-chat', minutes: 5, par: 155, access: 'free',
    blurb: 'A friendly "IT" message wants you to approve a sign-in you did not start.',
    competencies: { identity: 0.5, phishing: 0.5 },
    unlock: {},
  },
  {
    id: 'm11-realit', title: 'The genuine IT call', tier: 'beginner', kind: 'social', mode: 'social-engineering', ref: 'real-it', minutes: 5, par: 150, access: 'free',
    blurb: 'This time the caller is real. Can you verify properly without being difficult?',
    competencies: { identity: 0.6, phishing: 0.4 },
    unlock: {},
  },
  // ── Intermediate
  {
    id: 'm04-spray', title: 'Midnight sign-ins', tier: 'intermediate', kind: 'detective', mode: 'cyber-detective', ref: 'spray', minutes: 10, par: 245, access: 'plus',
    blurb: 'Hundreds of failed overnight logins and one that worked. What are you looking at?',
    competencies: { identity: 0.7, correlation: 0.3 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm05-macro', title: 'The budget spreadsheet', tier: 'intermediate', kind: 'detective', mode: 'cyber-detective', ref: 'budget', minutes: 10, par: 250, access: 'plus',
    blurb: 'A salesperson enabled content on a spreadsheet and his laptop has been odd since.',
    competencies: { endpoint: 0.7, correlation: 0.3 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm06-prompt', title: 'The sixth prompt', tier: 'intermediate', kind: 'incident', mode: 'incident-commander', ref: 'mfa-fatigue', minutes: 10, par: 125, access: 'plus',
    blurb: 'A colleague approved a prompt she did not start. Contain it without breaking the business.',
    competencies: { response: 0.6, identity: 0.4 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm07-friday', title: 'The Friday breach', tier: 'intermediate', kind: 'breach', mode: 'breach-room', ref: 'friday', minutes: 12, par: 258, access: 'plus',
    blurb: 'HR data left the company. Reconstruct how, from a phishing email to a 2 GB upload.',
    competencies: { correlation: 0.7, identity: 0.3 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm12-traveller', title: 'The impossible traveller', tier: 'intermediate', kind: 'detective', mode: 'cyber-detective', ref: 'traveller', minutes: 12, par: 250, access: 'plus',
    blurb: 'An "impossible travel" alert fires. Is it the VPN, or a stolen session?',
    competencies: { identity: 0.6, phishing: 0.4 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm13-forwarder', title: 'The quiet forwarder', tier: 'intermediate', kind: 'detective', mode: 'cyber-detective', ref: 'forwarder', minutes: 12, par: 255, access: 'plus',
    blurb: 'Accounts Payable paid £86,400 to a new account. How was the fraud set up?',
    competencies: { phishing: 0.6, correlation: 0.2, reporting: 0.2 },
    unlock: { passedTier: { beginner: 2 } },
  },
  {
    id: 'm14-ceo', title: 'The CEO needs a payment today', tier: 'intermediate', kind: 'social', mode: 'social-engineering', ref: 'ceo-pay', minutes: 6, par: 155, access: 'plus',
    blurb: 'A confidential, urgent £48,000 payment request from the CEO. Hold your nerve.',
    competencies: { phishing: 0.7, reporting: 0.3 },
    unlock: { passedTier: { beginner: 2 } },
  },
  // ── Advanced
  {
    id: 'm08-ransom', title: 'The macro that kept going', tier: 'advanced', kind: 'breach', mode: 'breach-room', ref: 'ransom', minutes: 12, par: 255, access: 'plus',
    blurb: 'Files were encrypted at lunchtime. Trace it back and find the last chance to stop it.',
    competencies: { correlation: 0.5, endpoint: 0.5 },
    unlock: { passedTier: { intermediate: 3 } },
  },
  {
    id: 'm09-laptop', title: 'The laptop on the train', tier: 'advanced', kind: 'incident', mode: 'incident-commander', ref: 'lost-laptop', minutes: 10, par: 124, access: 'plus',
    blurb: 'Customer data on a lost laptop. Limit the exposure and make the right notifications.',
    competencies: { response: 0.5, reporting: 0.5 },
    unlock: { passedTier: { intermediate: 3 } },
  },
  {
    id: 'm10-harbour', title: 'Operation Quiet Harbour', tier: 'advanced', kind: 'simulation', mode: 'simulation', ref: 'harbour', minutes: 18, par: 0, access: 'plus',
    blurb: 'A full incident from the first alert to the final report: triage, investigate, decide, report.',
    competencies: { triage: 0.2, correlation: 0.3, response: 0.3, reporting: 0.2 },
    unlock: { passedTier: { intermediate: 3 } },
  },
  {
    id: 'm15-ransomday', title: 'Ransomware on Tuesday', tier: 'advanced', kind: 'incident', mode: 'incident-commander', ref: 'ransomware-day', minutes: 10, par: 150, access: 'plus',
    blurb: 'Encryption is spreading. Stop it, protect the backups and recover without reinfecting the network.',
    competencies: { response: 0.7, reporting: 0.3 },
    unlock: { passedTier: { intermediate: 3 } },
  },
  // ── Senior (needs the SOC Analyst rank)
  {
    id: 'm16-hunt', title: 'Hunting the quiet beacon', tier: 'senior', kind: 'detective', mode: 'cyber-detective', ref: 'beacon-hunt', minutes: 14, par: 250, access: 'plus',
    blurb: 'There is no alert. Find the beacon hiding in a week of normal traffic.',
    competencies: { hunting: 0.6, endpoint: 0.2, correlation: 0.2 },
    unlock: { rank: 'analyst' },
  },
  {
    id: 'm17-cloudkey', title: 'The key in the repository', tier: 'senior', kind: 'breach', mode: 'breach-room', ref: 'cloudkey', minutes: 14, par: 250, access: 'plus',
    blurb: 'A cloud bill jumped 4,000% in two hours. Trace it back to a developer\'s commit.',
    competencies: { correlation: 0.5, identity: 0.3, hunting: 0.2 },
    unlock: { rank: 'analyst' },
  },
  {
    id: 'm18-weekend', title: 'Operation Long Weekend', tier: 'senior', kind: 'simulation', mode: 'simulation', ref: 'long-weekend', minutes: 20, par: 0, access: 'plus',
    blurb: 'Four incidents land at once before a bank holiday. Prioritise, contain the worst, hand over the rest.',
    competencies: { triage: 0.3, correlation: 0.2, response: 0.3, reporting: 0.2 },
    unlock: { rank: 'analyst' },
  },
  // ── Lead (needs the Senior Analyst rank)
  {
    id: 'm19-supplier', title: 'The update that came with a visitor', tier: 'lead', kind: 'breach', mode: 'breach-room', ref: 'supply-chain', minutes: 14, par: 255, access: 'plus',
    blurb: 'A trusted monitoring tool updated itself overnight. By afternoon, 3.4 GB had left the building.',
    competencies: { correlation: 0.5, hunting: 0.3, response: 0.2 },
    unlock: { rank: 'senior' },
  },
  {
    id: 'm20-insider', title: 'The departing engineer', tier: 'lead', kind: 'detective', mode: 'cyber-detective', ref: 'insider', minutes: 14, par: 250, access: 'plus',
    blurb: 'An engineer who resigned has been moving a lot of data. Is it theft, and how do you handle it properly?',
    competencies: { correlation: 0.4, reporting: 0.3, identity: 0.3 },
    unlock: { rank: 'senior' },
  },
  {
    id: 'm21-extortion', title: 'We have your data', tier: 'lead', kind: 'incident', mode: 'incident-commander', ref: 'data-extortion', minutes: 12, par: 160, access: 'plus',
    blurb: 'An email claims 40 GB of customer data has been stolen. Is it true, and what must you do first?',
    competencies: { response: 0.3, reporting: 0.5, leadership: 0.2 },
    unlock: { rank: 'senior' },
  },
  {
    id: 'm22-board', title: 'Operation Glass House', tier: 'lead', kind: 'simulation', mode: 'simulation', ref: 'board-brief', minutes: 22, par: 0, access: 'plus',
    blurb: 'A payment problem and a suspected breach in peak trading. Establish the facts, brief the board and meet your obligations.',
    competencies: { reporting: 0.3, triage: 0.2, response: 0.2, correlation: 0.1, leadership: 0.2 },
    unlock: { rank: 'senior' },
  },
  // ── Manager (needs the Incident Response Lead rank)
  {
    id: 'm23-capacity', title: 'Operation Short Staffed', tier: 'manager', kind: 'simulation', mode: 'simulation', ref: 'night-shift', minutes: 22, par: 0, access: 'plus',
    blurb: 'Eight analysts, five demands and a dashboard that looks too good. Allocate people, read the numbers critically and report honestly.',
    competencies: { leadership: 0.5, reporting: 0.3, triage: 0.1, response: 0.1 },
    unlock: { rank: 'lead' },
  },
  {
    id: 'm24-risk', title: 'The Risk Appetite Meeting', tier: 'manager', kind: 'simulation', mode: 'simulation', ref: 'risk-register', minutes: 24, par: 0, access: 'plus',
    blurb: 'Rank the company\'s risks, check the facts on the biggest, spend a limited budget and tell the board what it must hear.',
    competencies: { leadership: 0.5, reporting: 0.3, correlation: 0.1, response: 0.1 },
    unlock: { rank: 'lead' },
  },
  // ── Specialist track: Cloud (needs the SOC Analyst rank, then each other mission needs the first)
  {
    id: 'c01-bucket', title: 'The bucket anyone could read', tier: 'cloud', kind: 'detective', mode: 'cyber-detective', ref: 'open-bucket', minutes: 12, par: 250, access: 'plus',
    blurb: 'A scanner says a cloud storage bucket is readable by the whole internet. It was private yesterday.',
    competencies: { cloud: 0.6, reporting: 0.2, correlation: 0.2 },
    unlock: {},
  },
  {
    id: 'c02-role', title: 'The role anyone could assume', tier: 'cloud', kind: 'breach', mode: 'breach-room', ref: 'role-chain', minutes: 14, par: 250, access: 'plus',
    blurb: 'A read-only key leaks in a build log. Within an hour it has become administrator access.',
    competencies: { cloud: 0.6, identity: 0.3, correlation: 0.1 },
    unlock: { passedTier: { cloud: 1 } },
  },
  {
    id: 'c03-console', title: 'The open admin console', tier: 'cloud', kind: 'incident', mode: 'incident-commander', ref: 'exposed-console', minutes: 10, par: 135, access: 'plus',
    blurb: 'Your cloud bill is climbing and the cluster is at full load. The management console has no sign-in.',
    competencies: { cloud: 0.6, response: 0.4 },
    unlock: { passedTier: { cloud: 1 } },
  },
  // ── Cloud Security path: practitioner tier
  {
    id: 'c04-iam', title: 'Too many keys', tier: 'cloud-prac', kind: 'simulation', mode: 'simulation', ref: 'iam-review', minutes: 20, par: 0, access: 'plus',
    blurb: 'Almost everyone has administrator rights in the cloud account. Rank what to fix and cut access down without stopping the developers.',
    competencies: { cloud: 0.4, identity: 0.4, reporting: 0.2 },
    unlock: { passedTier: { cloud: 2 } },
  },
  {
    id: 'c05-silent', title: 'The silent week', tier: 'cloud-prac', kind: 'detective', mode: 'cyber-detective', ref: 'logging-gap', minutes: 12, par: 250, access: 'plus',
    blurb: 'For six days one region produced no audit events at all. Find out why, and what happened while no one was watching.',
    competencies: { cloud: 0.5, correlation: 0.3, identity: 0.2 },
    unlock: { passedTier: { cloud: 2 } },
  },
  {
    id: 'c06-wipe', title: 'The bucket that emptied itself', tier: 'cloud-prac', kind: 'incident', mode: 'incident-commander', ref: 'bucket-wipe', minutes: 10, par: 130, access: 'plus',
    blurb: 'Files are vanishing from production storage and a message demands payment. Stop it, protect the backups and get the data back.',
    competencies: { cloud: 0.4, response: 0.4, identity: 0.2 },
    unlock: { passedTier: { cloud: 2 } },
  },
  // ── Security Engineer path
  {
    id: 'se01-baseline', title: 'The server nobody hardened', tier: 'se-found', kind: 'simulation', mode: 'simulation', ref: 'hardening-baseline', minutes: 18, par: 0, access: 'free',
    blurb: 'A new server is about to go live with default settings. Decide what to harden first and how to roll it out safely.',
    competencies: { hardening: 0.7, reporting: 0.3 },
    unlock: {},
  },
  {
    id: 'se02-drift', title: 'The secure build that stopped being secure', tier: 'se-found', kind: 'detective', mode: 'cyber-detective', ref: 'config-drift', minutes: 12, par: 250, access: 'free',
    blurb: 'Every server was built hardened and the dashboard says they all comply. An audit disagrees.',
    competencies: { hardening: 0.6, pipeline: 0.2, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'se03-secrets', title: 'Secrets everywhere', tier: 'se-found', kind: 'simulation', mode: 'simulation', ref: 'secrets-sprawl', minutes: 20, par: 0, access: 'plus',
    blurb: 'Passwords and keys are scattered through code, logs and wikis. Find them, spend your effort well and rotate without an outage.',
    competencies: { secretsiam: 0.7, pipeline: 0.3 },
    unlock: {},
  },
  {
    id: 'se04-ci', title: 'The build that shipped a visitor', tier: 'se-prac', kind: 'incident', mode: 'incident-commander', ref: 'ci-compromise', minutes: 10, par: 130, access: 'plus',
    blurb: 'Your deployment pipeline has been modified, and customers may be running software with a backdoor in it.',
    competencies: { pipeline: 0.4, response: 0.4, secretsiam: 0.2 },
    unlock: { passedTier: { 'se-found': 2 } },
  },
  {
    id: 'se05-deps', title: 'The package that was not ours', tier: 'se-prac', kind: 'breach', mode: 'breach-room', ref: 'dependency-chain', minutes: 12, par: 250, access: 'plus',
    blurb: 'A build pulled in a library with the same name as an internal one, and the pipeline\'s keys were used from outside.',
    competencies: { pipeline: 0.6, secretsiam: 0.2, reporting: 0.2 },
    unlock: { passedTier: { 'se-found': 2 } },
  },
  {
    id: 'se06-review', title: 'The architecture review', tier: 'se-prac', kind: 'simulation', mode: 'simulation', ref: 'design-review', minutes: 20, par: 0, access: 'plus',
    blurb: 'A new internal app wants to launch on Friday. Review its design, rank the risks and decide what must be fixed first.',
    competencies: { secretsiam: 0.4, hardening: 0.3, reporting: 0.3 },
    unlock: { passedTier: { 'se-found': 2 } },
  },
  // ── Ethical Hacking and PenTest path: senior tier (judgement, not exploitation)
  {
    id: 'pt07-plan', title: 'Planning the engagement', tier: 'pt-lead', kind: 'simulation', mode: 'simulation', ref: 'engagement-plan', minutes: 22, par: 0, access: 'plus',
    blurb: 'A client wants a three-week red team test. Work out which rules matter most, find the gaps in the agreement and decide who must be told.',
    competencies: { scope: 0.5, findings: 0.2, reporting: 0.3 },
    unlock: { rank: 'pt' },
  },
  {
    id: 'pt08-cover', title: 'Hiding behind the test', tier: 'pt-lead', kind: 'detective', mode: 'cyber-detective', ref: 'cover-of-the-test', minutes: 12, par: 250, access: 'plus',
    blurb: 'The client closed every alert during the test as "pentest". After it, a customer\'s data is for sale. Find out how a real intruder was missed.',
    competencies: { recon: 0.3, findings: 0.4, reporting: 0.3 },
    unlock: { rank: 'pt' },
  },
  {
    id: 'pt09-outage', title: 'The test that took the shop down', tier: 'pt-lead', kind: 'incident', mode: 'incident-commander', ref: 'test-outage', minutes: 10, par: 120, access: 'plus',
    blurb: 'Your testing coincides with the client\'s shop going down on a busy Saturday. Decide what to stop, who to call and what to say.',
    competencies: { scope: 0.5, findings: 0.2, reporting: 0.3 },
    unlock: { rank: 'pt' },
  },
  // ── Vulnerability Management path: senior tier
  {
    id: 'vm07-dashboard', title: 'The dashboard that looks green', tier: 'vm-lead', kind: 'simulation', mode: 'simulation', ref: 'honest-dashboard', minutes: 22, par: 0, access: 'plus',
    blurb: 'The dashboard says 97% of systems are patched. Check what the number really covers and decide what the board is told.',
    competencies: { reporting: 0.4, vulnrisk: 0.3, vulnscan: 0.3 },
    unlock: { rank: 'vma' },
  },
  {
    id: 'vm08-invisible', title: 'The server on no report', tier: 'vm-lead', kind: 'detective', mode: 'cyber-detective', ref: 'invisible-server', minutes: 12, par: 250, access: 'plus',
    blurb: 'A tester got in through a server that has never appeared in a vulnerability report. Find out how a known flaw sat on the internet for fourteen months.',
    competencies: { vulnscan: 0.6, remediate: 0.2, reporting: 0.2 },
    unlock: { rank: 'vma' },
  },
  {
    id: 'vm09-nopatch', title: 'Critical flaw, no patch yet', tier: 'vm-lead', kind: 'incident', mode: 'incident-commander', ref: 'no-patch-yet', minutes: 10, par: 125, access: 'plus',
    blurb: 'A critical flaw is being exploited and the vendor has no fix. Find where you are exposed, reduce the risk and check whether anyone got there first.',
    competencies: { response: 0.4, vulnrisk: 0.3, remediate: 0.3 },
    unlock: { rank: 'vma' },
  },
  // ── Network Security path: senior tier
  {
    id: 'nw07-zones', title: 'Cutting the network into zones', tier: 'net-lead', kind: 'simulation', mode: 'simulation', ref: 'segmentation-programme', minutes: 22, par: 0, access: 'plus',
    blurb: 'Every laptop can reach the finance database and the factory controllers. Decide which zones to build first and roll them out without an outage.',
    competencies: { netdesign: 0.5, fwrules: 0.2, reporting: 0.3 },
    unlock: { rank: 'nse' },
  },
  {
    id: 'nw08-gateway', title: 'The gateway that let them in', tier: 'net-lead', kind: 'breach', mode: 'breach-room', ref: 'edge-appliance', minutes: 14, par: 250, access: 'plus',
    blurb: 'Finance files have appeared on a leak site and nobody was phished. Rebuild how someone got from the internet to a file server.',
    competencies: { nettraffic: 0.5, netdesign: 0.2, response: 0.3 },
    unlock: { rank: 'nse' },
  },
  {
    id: 'nw09-dns', title: 'The login page that was not ours', tier: 'net-lead', kind: 'incident', mode: 'incident-commander', ref: 'dns-hijack', minutes: 10, par: 125, access: 'plus',
    blurb: 'Customers are typing their passwords into a fake sign-in page because someone changed where your domain points. Take the name back and protect your customers.',
    competencies: { response: 0.5, nettraffic: 0.3, reporting: 0.2 },
    unlock: { rank: 'nse' },
  },
  // ── Cloud Security path: senior tier
  {
    id: 'c07-landing', title: 'Forty accounts, no plan', tier: 'cloud-lead', kind: 'simulation', mode: 'simulation', ref: 'landing-zone', minutes: 22, par: 0, access: 'plus',
    blurb: 'Forty cloud accounts, each set up by whoever needed one. Decide what to fix first and roll out guardrails without stopping the teams.',
    competencies: { cloud: 0.4, identity: 0.3, reporting: 0.3 },
    unlock: { rank: 'engineer' },
  },
  {
    id: 'c08-pivot', title: 'One account to the next', tier: 'cloud-lead', kind: 'breach', mode: 'breach-room', ref: 'cross-account-pivot', minutes: 14, par: 250, access: 'plus',
    blurb: "A developer's test account was compromised on Monday. By Wednesday, production audit logs had been deleted. Rebuild how the attacker moved between accounts.",
    competencies: { cloud: 0.4, correlation: 0.4, identity: 0.2 },
    unlock: { rank: 'engineer' },
  },
  {
    id: 'c09-leak', title: 'The key in the public repository', tier: 'cloud-lead', kind: 'incident', mode: 'incident-commander', ref: 'leaked-admin-key', minutes: 10, par: 125, access: 'plus',
    blurb: 'An administrator key is in a public repository and someone has already used it. Stop them, find what they changed and protect what they read.',
    competencies: { identity: 0.4, response: 0.4, cloud: 0.2 },
    unlock: { rank: 'engineer' },
  },
  // ── Security Engineer path: senior tier
  {
    id: 'se07-threat', title: 'Before it is built', tier: 'se-lead', kind: 'simulation', mode: 'simulation', ref: 'threat-model', minutes: 20, par: 0, access: 'plus',
    blurb: 'A new payments feature is a week from build. Model the threats, find the design gaps and decide how security should work with the team.',
    competencies: { hardening: 0.4, secretsiam: 0.3, reporting: 0.3 },
    unlock: { rank: 'se' },
  },
  {
    id: 'se08-blind', title: 'The alert that never fired', tier: 'se-lead', kind: 'detective', mode: 'cyber-detective', ref: 'blind-rule', minutes: 12, par: 250, access: 'plus',
    blurb: 'A detection rule shows as healthy and has never raised an alert, and a customer has found Contoso data for sale. Find out why it stayed silent.',
    competencies: { hardening: 0.4, response: 0.3, reporting: 0.3 },
    unlock: { rank: 'se' },
  },
  {
    id: 'se09-breakout', title: 'The container that reached the host', tier: 'se-lead', kind: 'incident', mode: 'incident-commander', ref: 'cluster-breakout', minutes: 10, par: 130, access: 'plus',
    blurb: 'A service on the shared container platform is running a program nobody deployed. Contain it, keep the evidence and keep thirty teams running.',
    competencies: { pipeline: 0.4, response: 0.4, hardening: 0.2 },
    unlock: { rank: 'se' },
  },
  // ── Ethical Hacking and PenTest path (judgement, not exploitation)
  {
    id: 'pt01-scope', title: 'The scope letter', tier: 'pt-found', kind: 'simulation', mode: 'simulation', ref: 'scope-letter', minutes: 18, par: 0, access: 'free',
    blurb: 'Before you touch anything, work out what you are authorised to do, and hold the line when someone offers you more.',
    competencies: { scope: 0.6, findings: 0.2, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'pt02-surface', title: 'Reading the attack surface', tier: 'pt-found', kind: 'detective', mode: 'cyber-detective', ref: 'attack-surface', minutes: 12, par: 250, access: 'free',
    blurb: 'Work out what a company exposes and what a real attacker would try first, and what to do with a password you find.',
    competencies: { recon: 0.6, scope: 0.2, findings: 0.2 },
    unlock: {},
  },
  {
    id: 'pt03-rate', title: 'The finding rated "critical"', tier: 'pt-found', kind: 'simulation', mode: 'simulation', ref: 'rate-findings', minutes: 20, par: 0, access: 'plus',
    blurb: 'Rate the findings by real risk, and hold your ground when the client asks you to soften the worst one.',
    competencies: { findings: 0.6, reporting: 0.4 },
    unlock: {},
  },
  {
    id: 'pt04-first', title: 'Someone else was here first', tier: 'pt-prac', kind: 'incident', mode: 'incident-commander', ref: 'tester-found-breach', minutes: 10, par: 130, access: 'plus',
    blurb: 'Halfway through a test you find signs that a real attacker is already inside. What you do next is the test.',
    competencies: { scope: 0.5, findings: 0.2, reporting: 0.3 },
    unlock: { passedTier: { 'pt-found': 2 } },
  },
  {
    id: 'pt05-chain', title: 'The red team\'s path', tier: 'pt-prac', kind: 'breach', mode: 'breach-room', ref: 'red-team-chain', minutes: 12, par: 250, access: 'plus',
    blurb: 'An authorised red team reached the finance share in a day. Rebuild their path from the defender\'s logs.',
    competencies: { recon: 0.5, findings: 0.3, reporting: 0.2 },
    unlock: { passedTier: { 'pt-found': 2 } },
  },
  {
    id: 'pt06-safe', title: 'The test that slowed the shop', tier: 'pt-prac', kind: 'simulation', mode: 'simulation', ref: 'safe-testing', minutes: 20, par: 0, access: 'plus',
    blurb: 'Your testing tool may have slowed a busy shop. Work out whether it was you, and be honest about it.',
    competencies: { scope: 0.5, findings: 0.3, reporting: 0.2 },
    unlock: { passedTier: { 'pt-found': 2 } },
  },
  // ── Network Security path
  {
    id: 'nw01-flat', title: 'The flat network', tier: 'net-found', kind: 'simulation', mode: 'simulation', ref: 'flat-network', minutes: 18, par: 0, access: 'free',
    blurb: 'Everything can talk to everything. Decide what to separate first and plan a change the plant can live with.',
    competencies: { netdesign: 0.6, fwrules: 0.2, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'nw02-rules', title: 'The rule nobody understands', tier: 'net-found', kind: 'detective', mode: 'cyber-detective', ref: 'firewall-audit', minutes: 12, par: 250, access: 'free',
    blurb: 'A routine firewall audit finds something that has been there for years.',
    competencies: { fwrules: 0.6, netdesign: 0.2, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'nw03-dns', title: 'The quiet lookups', tier: 'net-found', kind: 'breach', mode: 'breach-room', ref: 'dns-beacon', minutes: 12, par: 250, access: 'plus',
    blurb: 'Nothing was blocked and nothing alarmed, but 6 GB left the building through DNS.',
    competencies: { nettraffic: 0.7, reporting: 0.3 },
    unlock: {},
  },
  {
    id: 'nw04-rdp', title: 'The open door on port 3389', tier: 'net-prac', kind: 'incident', mode: 'incident-commander', ref: 'exposed-remote', minutes: 10, par: 140, access: 'plus',
    blurb: 'Thousands of failed remote desktop sign-ins, and one that worked. Close the door, then find out who walked through it.',
    competencies: { fwrules: 0.3, response: 0.4, nettraffic: 0.3 },
    unlock: { passedTier: { 'net-found': 2 } },
  },
  {
    id: 'nw05-rogue', title: 'The device that should not be there', tier: 'net-prac', kind: 'detective', mode: 'cyber-detective', ref: 'rogue-device', minutes: 12, par: 250, access: 'plus',
    blurb: 'An unknown device has appeared on the finance network. What is it, and what has it done?',
    competencies: { nettraffic: 0.4, netdesign: 0.3, response: 0.3 },
    unlock: { passedTier: { 'net-found': 2 } },
  },
  {
    id: 'nw06-change', title: 'The urgent firewall request', tier: 'net-prac', kind: 'simulation', mode: 'simulation', ref: 'change-window', minutes: 20, par: 0, access: 'plus',
    blurb: 'Five firewall change requests and one of them is urgent. Rank them, check the facts and decide on what terms.',
    competencies: { fwrules: 0.5, reporting: 0.3, netdesign: 0.2 },
    unlock: { passedTier: { 'net-found': 2 } },
  },
  // ── Vulnerability Management path
  {
    id: 'vm01-scan', title: 'Monday\'s scan', tier: 'vm-found', kind: 'simulation', mode: 'simulation', ref: 'scan-triage', minutes: 16, par: 0, access: 'free',
    blurb: '2,400 findings and one week. Rank by risk, check the top finding is real, and report honestly.',
    competencies: { vulnrisk: 0.5, vulnscan: 0.3, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'vm02-recurring', title: 'The finding that keeps coming back', tier: 'vm-found', kind: 'detective', mode: 'cyber-detective', ref: 'recurring-vuln', minutes: 12, par: 250, access: 'free',
    blurb: 'A critical finding has been closed four times and keeps returning on new servers. Find out why.',
    competencies: { vulnscan: 0.4, remediate: 0.4, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'vm03-patch', title: 'Patch Tuesday', tier: 'vm-found', kind: 'simulation', mode: 'simulation', ref: 'patch-tuesday', minutes: 20, par: 0, access: 'plus',
    blurb: 'Spread limited patching capacity where it cuts the most risk, and handle a patch that breaks payroll.',
    competencies: { remediate: 0.5, vulnrisk: 0.3, reporting: 0.2 },
    unlock: {},
  },
  {
    id: 'vm04-exploited', title: 'Exploited before the patch', tier: 'vm-prac', kind: 'incident', mode: 'incident-commander', ref: 'known-exploited', minutes: 10, par: 130, access: 'plus',
    blurb: 'A flaw in your VPN gateway is being exploited. Patching is only the start.',
    competencies: { vulnrisk: 0.3, remediate: 0.4, response: 0.3 },
    unlock: { passedTier: { 'vm-found': 2 } },
  },
  {
    id: 'vm05-unscanned', title: 'The server nobody scanned', tier: 'vm-prac', kind: 'breach', mode: 'breach-room', ref: 'unscanned-server', minutes: 12, par: 250, access: 'plus',
    blurb: 'Ransomware used a flaw that was fixed everywhere except one forgotten server.',
    competencies: { vulnscan: 0.5, remediate: 0.3, reporting: 0.2 },
    unlock: { passedTier: { 'vm-found': 2 } },
  },
  {
    id: 'vm06-exception', title: 'The exception request', tier: 'vm-prac', kind: 'simulation', mode: 'simulation', ref: 'risk-exception', minutes: 20, par: 0, access: 'plus',
    blurb: 'A department wants to keep running a critical flaw. Decide what to approve, and on what terms.',
    competencies: { vulnrisk: 0.5, reporting: 0.3, remediate: 0.2 },
    unlock: { passedTier: { 'vm-found': 2 } },
  },
  // ── Promotion exams
  {
    id: 'soc-exam', title: 'Promotion exam: SOC Analyst', tier: 'advanced', kind: 'simulation', mode: 'simulation', ref: 'soc-exam', minutes: 20, par: 0, access: 'plus',
    exam: true, promotes: 'analyst', passTier: 2,
    blurb: 'One larger case that tests triage, identity, response and reporting together. Silver or better to pass.',
    competencies: { triage: 0.2, identity: 0.3, response: 0.2, reporting: 0.3 },
    unlock: { passedTier: { beginner: 3, intermediate: 2 }, mastery: { triage: 55, phishing: 50, identity: 55 }, masteryScope: ['beginner', 'intermediate'] },
  },
  {
    id: 'senior-exam', title: 'Promotion exam: Senior Analyst', tier: 'senior', kind: 'simulation', mode: 'simulation', ref: 'senior-exam', minutes: 25, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'Ambiguous evidence, competing priorities and a junior analyst who needs your review. Silver or better to pass.',
    competencies: { triage: 0.2, correlation: 0.2, hunting: 0.2, reporting: 0.2, response: 0.2 },
    unlock: { rank: 'analyst', passedTier: { advanced: 3, senior: 2 }, mastery: { correlation: 60, endpoint: 55, response: 55 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior'] },
  },
  {
    id: 'lead-exam', title: 'Promotion exam: Incident Response Lead', tier: 'lead', kind: 'simulation', mode: 'simulation', ref: 'lead-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'lead', passTier: 2,
    blurb: 'Launch day. A hidden script is stealing card details at checkout while the business wants the launch to go ahead. Silver or better to pass.',
    competencies: { triage: 0.1, correlation: 0.2, response: 0.3, reporting: 0.2, leadership: 0.2 },
    unlock: { rank: 'senior', passedTier: { lead: 3 }, mastery: { response: 70, reporting: 65, correlation: 65 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior'] },
  },
  {
    id: 'manager-exam', title: 'Promotion exam: SOC Manager', tier: 'manager', kind: 'simulation', mode: 'simulation', ref: 'manager-exam', minutes: 30, par: 0, access: 'plus',
    exam: true, promotes: 'manager', passTier: 2,
    blurb: 'Quarter-end week: a live phishing attack, a supplier breach, an outage and an audit, with eight analysts. Silver or better to pass.',
    competencies: { leadership: 0.4, reporting: 0.2, response: 0.2, triage: 0.1, correlation: 0.1 },
    unlock: { rank: 'lead', passedTier: { manager: 2 }, mastery: { leadership: 65 }, masteryScope: ['beginner', 'intermediate', 'advanced', 'senior', 'lead', 'manager'] },
  },
  {
    id: 'vm-exam', title: 'Promotion exam: Vulnerability Management Analyst', tier: 'vm-prac', kind: 'simulation', mode: 'simulation', ref: 'vm-exam', minutes: 26, par: 0, access: 'plus',
    exam: true, promotes: 'vma', passTier: 2,
    blurb: 'A critical flaw, thin capacity and a sceptical director. Silver or better to pass.',
    competencies: { vulnscan: 0.2, vulnrisk: 0.3, remediate: 0.3, reporting: 0.2 },
    unlock: { passedTier: { 'vm-found': 3, 'vm-prac': 2 }, mastery: { vulnscan: 55, vulnrisk: 55 }, masteryScope: ['vm-found', 'vm-prac'] },
  },
  {
    id: 'net-exam', title: 'Promotion exam: Network Security Engineer', tier: 'net-prac', kind: 'simulation', mode: 'simulation', ref: 'net-exam', minutes: 26, par: 0, access: 'plus',
    exam: true, promotes: 'nse', passTier: 2,
    blurb: 'A newly acquired company, a flat network, exposed remote access and a board that wants answers. Silver or better to pass.',
    competencies: { netdesign: 0.3, fwrules: 0.2, nettraffic: 0.2, response: 0.1, reporting: 0.2 },
    unlock: { passedTier: { 'net-found': 3, 'net-prac': 2 }, mastery: { netdesign: 55, fwrules: 55 }, masteryScope: ['net-found', 'net-prac'] },
  },
  {
    id: 'pt-exam', title: 'Promotion exam: Penetration Tester', tier: 'pt-prac', kind: 'simulation', mode: 'simulation', ref: 'pt-exam', minutes: 26, par: 0, access: 'plus',
    exam: true, promotes: 'pt', passTier: 2,
    blurb: 'A scope that does not quite fit, a worrying finding and a client under pressure. Silver or better to pass.',
    competencies: { scope: 0.3, recon: 0.1, findings: 0.4, reporting: 0.2 },
    unlock: { passedTier: { 'pt-found': 3, 'pt-prac': 2 }, mastery: { scope: 55, findings: 55 }, masteryScope: ['pt-found', 'pt-prac'] },
  },
  {
    id: 'se-exam', title: 'Promotion exam: Security Engineer', tier: 'se-prac', kind: 'simulation', mode: 'simulation', ref: 'se-exam', minutes: 26, par: 0, access: 'plus',
    exam: true, promotes: 'se', passTier: 2,
    blurb: 'A cloud migration, a deadline and a shortcut that is not safe. Silver or better to pass.',
    competencies: { hardening: 0.2, secretsiam: 0.3, pipeline: 0.3, reporting: 0.2 },
    unlock: { passedTier: { 'se-found': 3, 'se-prac': 2 }, mastery: { hardening: 55, secretsiam: 55 }, masteryScope: ['se-found', 'se-prac'] },
  },
  {
    id: 'se-senior-exam', title: 'Promotion exam: Senior Security Engineer', tier: 'se-lead', kind: 'simulation', mode: 'simulation', ref: 'se-senior-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'A shared container platform, a launch date and a request to skip two controls. Silver or better to pass.',
    competencies: { hardening: 0.3, pipeline: 0.2, response: 0.2, reporting: 0.3 },
    unlock: { rank: 'se', passedTier: { 'se-lead': 3 }, mastery: { hardening: 60, pipeline: 50 }, masteryScope: ['se-found', 'se-prac', 'se-lead'] },
  },
  {
    id: 'pt-senior-exam', title: 'Promotion exam: Senior Penetration Tester', tier: 'pt-lead', kind: 'simulation', mode: 'simulation', ref: 'pt-senior-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'Midway through a red team engagement: an out-of-scope discovery, a request to wait and an unhappy executive. Silver or better to pass.',
    competencies: { scope: 0.3, recon: 0.1, findings: 0.4, reporting: 0.2 },
    unlock: { rank: 'pt', passedTier: { 'pt-lead': 3 }, mastery: { scope: 60, findings: 55 }, masteryScope: ['pt-found', 'pt-prac', 'pt-lead'] },
  },
  {
    id: 'vm-senior-exam', title: 'Promotion exam: Senior Vulnerability Analyst', tier: 'vm-lead', kind: 'simulation', mode: 'simulation', ref: 'vm-senior-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'An audit in three weeks, twelve thousand findings and a division that wants a blanket exception. Silver or better to pass.',
    competencies: { vulnscan: 0.2, vulnrisk: 0.3, remediate: 0.2, reporting: 0.3 },
    unlock: { rank: 'vma', passedTier: { 'vm-lead': 3 }, mastery: { vulnscan: 60, vulnrisk: 55 }, masteryScope: ['vm-found', 'vm-prac', 'vm-lead'] },
  },
  {
    id: 'net-senior-exam', title: 'Promotion exam: Senior Network Security Engineer', tier: 'net-lead', kind: 'simulation', mode: 'simulation', ref: 'net-senior-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'A new site, a supplier who wants a door left open and an executive who backs them. Silver or better to pass.',
    competencies: { netdesign: 0.3, fwrules: 0.2, nettraffic: 0.2, response: 0.1, reporting: 0.2 },
    unlock: { rank: 'nse', passedTier: { 'net-lead': 3 }, mastery: { netdesign: 60, nettraffic: 55 }, masteryScope: ['net-found', 'net-prac', 'net-lead'] },
  },
  {
    id: 'cloud-senior-exam', title: 'Promotion exam: Senior Cloud Security Engineer', tier: 'cloud-lead', kind: 'simulation', mode: 'simulation', ref: 'cloud-senior-exam', minutes: 28, par: 0, access: 'plus',
    exam: true, promotes: 'senior', passTier: 2,
    blurb: 'A cost-saving programme, a request to remove logging and an account nobody can explain. Silver or better to pass.',
    competencies: { cloud: 0.3, identity: 0.3, response: 0.2, reporting: 0.2 },
    unlock: { rank: 'engineer', passedTier: { 'cloud-lead': 3 }, mastery: { cloud: 60, identity: 55 }, masteryScope: ['cloud', 'cloud-prac', 'cloud-lead'] },
  },
  {
    id: 'cloud-exam', title: 'Promotion exam: Cloud Security Engineer', tier: 'cloud-prac', kind: 'simulation', mode: 'simulation', ref: 'cloud-exam', minutes: 26, par: 0, access: 'plus',
    exam: true, promotes: 'engineer', passTier: 2,
    blurb: 'An acquired start-up\'s cloud account, a deadline and a request to cut corners. Silver or better to pass.',
    competencies: { cloud: 0.3, identity: 0.3, response: 0.2, reporting: 0.2 },
    unlock: { passedTier: { cloud: 3, 'cloud-prac': 2 }, mastery: { cloud: 60, identity: 55 }, masteryScope: ['cloud', 'cloud-prac'] },
  },
];

// ── Career paths ────────────────────────────────────────────────
// Each path is its own ladder: its own ranks, XP, skills and missions. A player picks one to
// start and can try the others at any time. A rank's `requires` and a mission's `unlock` are read
// inside their own path, so 'rank: "senior"' means the senior rank of that path.
// `live: false` paths are on the chooser as "coming soon" until they have missions.

const ENGINEER_RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how to build security in rather than bolt it on.', requires: {} },
  { id: 'junior', name: 'Junior Security Engineer', blurb: 'You can harden a system to a baseline, find secrets in the wrong places and spot configuration drift.', requires: { xp: 60, passedTier: { 'se-found': 2 } } },
  {
    id: 'se', name: 'Security Engineer', blurb: 'You design controls into systems and pipelines, roll them out safely and prove they stay in place.',
    requires: { xp: 250, passedTier: { 'se-found': 3, 'se-prac': 2 }, mastery: { hardening: 55, secretsiam: 55 }, masteryScope: ['se-found', 'se-prac'], exam: 'se-exam' },
  },
  {
    id: 'senior', name: 'Senior Security Engineer', blurb: 'You model threats before anything is built, spend limited effort where it removes the most risk, and hold a line under deadline pressure.',
    requires: { xp: 600, passedTier: { 'se-lead': 3 }, mastery: { hardening: 60, pipeline: 50 }, masteryScope: ['se-found', 'se-prac', 'se-lead'], exam: 'se-senior-exam' },
  },
];

const PENTEST_RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how an authorised test works, and why the rules come first.', requires: {} },
  { id: 'junior', name: 'Junior Penetration Tester', blurb: 'You know what is in scope, how to read what a company exposes and how to rate a finding.', requires: { xp: 60, passedTier: { 'pt-found': 2 } } },
  {
    id: 'pt', name: 'Penetration Tester', blurb: 'You stay inside the rules under pressure, find what matters and report honestly.',
    requires: { xp: 250, passedTier: { 'pt-found': 3, 'pt-prac': 2 }, mastery: { scope: 55, findings: 55 }, masteryScope: ['pt-found', 'pt-prac'], exam: 'pt-exam' },
  },
  {
    id: 'senior', name: 'Senior Penetration Tester', blurb: 'You plan and lead an engagement, agree rules that protect everyone, know who must be told, and report honestly when someone wants the result to look different.',
    requires: { xp: 650, passedTier: { 'pt-lead': 3 }, mastery: { scope: 60, findings: 55 }, masteryScope: ['pt-found', 'pt-prac', 'pt-lead'], exam: 'pt-senior-exam' },
  },
];

const NETWORK_RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how networks are built, defended and watched.', requires: {} },
  { id: 'associate', name: 'Network Security Associate', blurb: 'You can read a rule base, spot a flat network and recognise odd traffic.', requires: { xp: 60, passedTier: { 'net-found': 2 } } },
  {
    id: 'nse', name: 'Network Security Engineer', blurb: 'You design zones, write rules from evidence, and make changes safely and honestly.',
    requires: { xp: 250, passedTier: { 'net-found': 3, 'net-prac': 2 }, mastery: { netdesign: 55, fwrules: 55 }, masteryScope: ['net-found', 'net-prac'], exam: 'net-exam' },
  },
  {
    id: 'senior', name: 'Senior Network Security Engineer', blurb: 'You cut a large network into zones without breaking the business, treat remote access as a front door, and say no safely when someone wants a hole in the perimeter.',
    requires: { xp: 650, passedTier: { 'net-lead': 3 }, mastery: { netdesign: 60, nettraffic: 55 }, masteryScope: ['net-found', 'net-prac', 'net-lead'], exam: 'net-senior-exam' },
  },
];

const VULN_RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how weaknesses are found, ranked and fixed.', requires: {} },
  { id: 'analyst', name: 'Junior Vulnerability Analyst', blurb: 'You can read a scan, tell a real finding from noise and start ranking by risk.', requires: { xp: 60, passedTier: { 'vm-found': 2 } } },
  {
    id: 'vma', name: 'Vulnerability Management Analyst', blurb: 'You rank by risk, run a patching cycle sensibly and report honestly on what is and is not fixed.',
    requires: { xp: 250, passedTier: { 'vm-found': 3, 'vm-prac': 2 }, mastery: { vulnscan: 55, vulnrisk: 55 }, masteryScope: ['vm-found', 'vm-prac'], exam: 'vm-exam' },
  },
  {
    id: 'senior', name: 'Senior Vulnerability Analyst', blurb: 'You run a programme rather than a scan, measure it honestly, and hold the line on the numbers when leadership wants a cleaner headline than the facts support.',
    requires: { xp: 650, passedTier: { 'vm-lead': 3 }, mastery: { vulnscan: 60, vulnrisk: 55 }, masteryScope: ['vm-found', 'vm-prac', 'vm-lead'], exam: 'vm-senior-exam' },
  },
];

const CLOUD_RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how cloud accounts get exposed.', requires: {} },
  { id: 'associate', name: 'Cloud Security Associate', blurb: 'You can read a cloud audit log and spot an exposed resource.', requires: { xp: 100, passedTier: { cloud: 1 } } },
  {
    id: 'engineer', name: 'Cloud Security Engineer', blurb: 'You trace how keys, roles and consoles are abused, and close the gap in the right order.',
    requires: { xp: 400, passedTier: { cloud: 3, 'cloud-prac': 2 }, mastery: { cloud: 60, identity: 55 }, masteryScope: ['cloud', 'cloud-prac'], exam: 'cloud-exam' },
  },
  {
    id: 'senior', name: 'Senior Cloud Security Engineer', blurb: 'You design for many accounts at once, roll guardrails out safely, and hold the line on logging and separation when someone wants to save money or time.',
    requires: { xp: 1000, passedTier: { 'cloud-lead': 3 }, mastery: { cloud: 60, identity: 55 }, masteryScope: ['cloud', 'cloud-prac', 'cloud-lead'], exam: 'cloud-senior-exam' },
  },
];

export const PATHS = [
  {
    id: 'analyst', name: 'Cyber Security Analyst', short: 'Analyst', colour: '#a3e635', live: true,
    blurb: 'Investigate alerts and incidents, then work up to running a security operations centre.',
    headline: ['Become the ', 'analyst.'],
    lead: 'Investigate realistic cases, make decisions and prove your skills. Rank is earned through mastery and a practical exam, not by grinding XP.',
    ranks: RANKS,
    competencies: ['triage', 'phishing', 'identity', 'endpoint', 'correlation', 'hunting', 'response', 'reporting', 'leadership'],
    roadmap: [{ id: 'weekly', title: 'New cases on a regular schedule', note: 'New incidents added to the path over time. Until then, one existing case is featured each week.' }],
  },
  {
    id: 'engineer', name: 'Security Engineer', short: 'Engineer', colour: '#38bdf8', live: true,
    blurb: 'Build and harden systems: secure configuration, identity and secrets, and the pipelines that ship code.',
    headline: ['Build it ', 'secure.'],
    lead: 'Make sound design and configuration decisions, and prove they hold. Rank is earned through mastery and a practical exam.',
    ranks: ENGINEER_RANKS,
    tiers: ['se-found', 'se-prac', 'se-lead'],
    competencies: ['hardening', 'secretsiam', 'pipeline', 'response', 'reporting'],
    roadmap: [
      { id: 'se-architect', title: 'Security Architect rank', note: 'Architecture at scale, multi-team platform security and security strategy.' },
      { id: 'se-more', title: 'More missions', note: 'Container and cloud platform security, infrastructure as code, and logging and detection design.' },
    ],
  },
  {
    id: 'cloud', name: 'Cloud Security', short: 'Cloud', colour: '#a78bfa', live: true,
    blurb: 'Keep cloud accounts safe: keys, roles, storage and consoles.',
    headline: ['Secure the ', 'cloud.'],
    lead: 'Investigate how cloud accounts are exposed and abused, and close the gap in the right order.',
    ranks: CLOUD_RANKS,
    tiers: ['cloud', 'cloud-prac', 'cloud-lead'],
    competencies: ['cloud', 'identity', 'correlation', 'response', 'reporting'],
    roadmap: [
      { id: 'cloud-architect', title: 'Cloud Security Architect rank', note: 'Policy as code, and cloud detection and response at scale.' },
      { id: 'cloud-more', title: 'More cloud missions', note: 'Containers and Kubernetes, serverless, data protection and cloud incident response.' },
    ],
  },
  {
    id: 'network', name: 'Network Security', short: 'Network', colour: '#2dd4bf', live: true,
    blurb: 'Design and defend networks: segmentation, firewall rules, remote access and spotting what should not be on the wire.',
    headline: ['Defend the ', 'network.'],
    lead: 'Read the network like an engineer, decide what should talk to what, and find what should not be there. Rank is earned through mastery and a practical exam.',
    ranks: NETWORK_RANKS,
    tiers: ['net-found', 'net-prac', 'net-lead'],
    competencies: ['netdesign', 'fwrules', 'nettraffic', 'response', 'reporting'],
    roadmap: [
      { id: 'net-architect', title: 'Network Security Architect rank', note: 'Zero trust, data centre and cloud networking, and large-scale rule management.' },
      { id: 'net-more', title: 'More missions', note: 'Wireless security, VPN design, intrusion detection and network forensics.' },
    ],
  },
  {
    id: 'vuln', name: 'Vulnerability Management', short: 'Vulnerabilities', colour: '#fbbf24', live: true,
    blurb: 'Find weaknesses and fix the right ones first: scanning, risk-based prioritisation, patching and reporting.',
    headline: ['Fix what ', 'matters.'],
    lead: 'Cut through thousands of findings to the few that matter, and get them fixed. Rank is earned through mastery and a practical exam.',
    ranks: VULN_RANKS,
    tiers: ['vm-found', 'vm-prac', 'vm-lead'],
    competencies: ['vulnscan', 'vulnrisk', 'remediate', 'response', 'reporting'],
    roadmap: [
      { id: 'vm-lead-rank', title: 'Vulnerability Management Lead rank', note: 'Running a whole programme: strategy, budget and reporting to the board.' },
      { id: 'vm-more', title: 'More missions', note: 'Asset discovery, cloud and container scanning, patch automation and board reporting.' },
    ],
  },
  {
    id: 'pentest', name: 'Ethical Hacking and PenTest', short: 'PenTest', colour: '#f87171', live: true,
    blurb: 'Think like an attacker, within the rules: scoping, reconnaissance, judgement calls and clear reporting.',
    headline: ['Hack ', 'ethically.'],
    lead: 'Decision-based practice in method and judgement: what is in scope, what to do when you find something serious, and how to report it honestly. It does not teach working exploits.',
    ranks: PENTEST_RANKS,
    tiers: ['pt-found', 'pt-prac', 'pt-lead'],
    competencies: ['scope', 'recon', 'findings', 'reporting'],
    roadmap: [
      { id: 'pt-redteam-lead', title: 'Red Team Lead rank', note: 'Adversary simulation, purple teaming and running a team of testers.' },
      { id: 'pt-more', title: 'More missions', note: 'Web application, wireless and cloud testing judgement, and working with clients on remediation.' },
    ],
  },
];

// More paths planned beyond the six on the chooser.
export const ROADMAP = [
  { id: 'dfir', title: 'Digital forensics and incident response', note: 'Reconstruct what happened from disk, memory and logs, and determine scope.' },
  { id: 'grc', title: 'GRC and risk', note: 'Assess risk, weigh evidence and explain findings to management.' },
  { id: 'ti', title: 'Threat intelligence', note: 'Connect indicators, assess context and brief decision-makers.' },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || null;
}
