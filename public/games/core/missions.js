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
  // A specialism, not needed for any rank. Shown once a player reaches SOC Analyst.
  { id: 'cloud', name: 'Cloud security', blurb: 'Keys, roles, storage and consoles in the cloud.', optional: true },
];

export const TIERS = [
  { id: 'beginner', name: 'Beginner', xpMultiplier: 1 },
  { id: 'intermediate', name: 'Intermediate', xpMultiplier: 1.5 },
  { id: 'advanced', name: 'Advanced', xpMultiplier: 2 },
  { id: 'senior', name: 'Senior', xpMultiplier: 2.5 },
  { id: 'lead', name: 'Lead', xpMultiplier: 3, note: 'Needs the Senior Analyst rank.' },
  { id: 'manager', name: 'Manager', xpMultiplier: 3.5, note: 'Needs the Incident Response Lead rank.' },
  { id: 'cloud', name: 'Specialist: Cloud', xpMultiplier: 2, note: 'Optional track. Opens at SOC Analyst; finish all three for the Cloud Security Specialist title.' },
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
    unlock: { rank: 'analyst' },
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
];

// Titles earned for finishing a specialist track. They do not affect rank.
export const SPECIALISMS = [
  {
    id: 'cloud', name: 'Cloud Security Specialist', track: 'cloud',
    blurb: 'Investigate exposure, keys, roles and consoles in the cloud.',
    requires: { passedTier: { cloud: 3 }, mastery: { cloud: 60 } },
  },
];

// Planned, not built. Shown on the roadmap so players can see what is coming.
export const ROADMAP = [
  { id: 'dfir', title: 'Digital forensics and incident response track', note: 'Reconstruct what happened from disk, memory and logs, and determine scope.' },
  { id: 'grc', title: 'GRC and risk analyst track', note: 'Assess risk, weigh evidence and explain findings to management.' },
  { id: 'ti', title: 'Threat intelligence track', note: 'Connect indicators, assess context and brief decision-makers.' },
  { id: 'weekly', title: 'New cases on a regular schedule', note: 'New incidents added to the campaign over time. Until then, one existing case is featured each week.' },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || null;
}
