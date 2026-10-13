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
];

export const TIERS = [
  { id: 'beginner', name: 'Beginner', xpMultiplier: 1 },
  { id: 'intermediate', name: 'Intermediate', xpMultiplier: 1.5 },
  { id: 'advanced', name: 'Advanced', xpMultiplier: 2 },
  { id: 'senior', name: 'Senior', xpMultiplier: 2.5 },
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
    requires: { xp: 1900, passedTier: { senior: 3 }, mastery: { response: 75, reporting: 70, correlation: 70 }, exam: 'lead-exam' },
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
];

// Planned, not built. Shown on the roadmap so players can see what is coming.
export const ROADMAP = [
  { id: 'lead-exam', title: 'Promotion exam: Incident Response Lead', note: 'Unlocks the Incident Response Lead rank, with major-incident command and executive briefings.' },
  { id: 'cloud', title: 'Cloud security career path', note: 'Investigate identity events, misconfigurations and suspicious cloud activity.' },
  { id: 'dfir', title: 'Digital forensics and incident response path', note: 'Reconstruct what happened and determine scope.' },
  { id: 'weekly', title: 'New cases on a regular schedule', note: 'Fresh incidents added to the campaign over time.' },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || null;
}
