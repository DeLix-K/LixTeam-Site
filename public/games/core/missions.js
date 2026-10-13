// The SOC Analyst Career Campaign: data only. Ranks, competencies and missions.
//
// Adding a mission = add the case to its game mode, then add an entry here. The
// career code (career.js) needs no changes.
//
// Ranks and scores are GAME progression. They are not qualifications, they are
// not validated assessments, and they do not guarantee job readiness.

export const COMPETENCIES = [
  { id: 'triage', name: 'Alert triage', blurb: 'Deciding what is noise, what needs a look and what is urgent.' },
  { id: 'phishing', name: 'Phishing and social engineering', blurb: 'Spotting lures, impersonation and pressure tactics.' },
  { id: 'identity', name: 'Identity investigation', blurb: 'Sign-ins, MFA, accounts and access.' },
  { id: 'endpoint', name: 'Endpoint and malware analysis', blurb: 'What ran, what it did, and where it called home.' },
  { id: 'correlation', name: 'Evidence correlation', blurb: 'Joining clues across tools into an attack chain.' },
  { id: 'response', name: 'Incident response', blurb: 'Containing, eradicating and recovering in the right order.' },
  { id: 'reporting', name: 'Reporting and communication', blurb: 'Telling people what happened, accurately and usefully.' },
];

export const TIERS = [
  { id: 'beginner', name: 'Beginner', xpMultiplier: 1 },
  { id: 'intermediate', name: 'Intermediate', xpMultiplier: 1.5 },
  { id: 'advanced', name: 'Advanced', xpMultiplier: 2 },
];

// XP for a mission by medal (before the tier multiplier). Medal 0 = no pass.
export const MEDAL_XP = [0, 30, 45, 60];
export const MEDALS = ['No medal', 'Bronze', 'Silver', 'Gold'];
export const TRY_XP = 5; // once, for a first attempt that does not earn a medal
export const EXAM_XP = [0, 0, 120, 150]; // an exam must be passed at silver or better

// requires: xp, passedTier { tier: count }, mastery { competency: min score },
//           exam: id of a promotion exam that must have been passed
export const RANKS = [
  { id: 'recruit', name: 'Recruit', blurb: 'You are learning how an analyst thinks.', requires: {} },
  {
    id: 'junior', name: 'Junior Analyst', blurb: 'You can triage alerts, spot phishing and read a sign-in log.',
    requires: { xp: 80, passedTier: { beginner: 2 } },
  },
  {
    id: 'analyst', name: 'SOC Analyst', blurb: 'You correlate evidence across systems and separate false alarms from real threats.',
    requires: { xp: 400, passedTier: { beginner: 3, intermediate: 2 }, mastery: { triage: 55, phishing: 55, identity: 55 }, exam: 'soc-exam' },
  },
  {
    id: 'senior', name: 'Senior Analyst', blurb: 'You analyse attack chains, prioritise incidents and mentor others.',
    requires: { xp: 900, passedTier: { intermediate: 4, advanced: 2 }, mastery: { correlation: 65, endpoint: 60, response: 60 }, exam: 'senior-exam' },
  },
  {
    id: 'lead', name: 'Incident Response Lead', blurb: 'You coordinate containment, weigh business impact and brief leadership.',
    requires: { xp: 1600, passedTier: { advanced: 3 }, mastery: { response: 75, reporting: 70, correlation: 70 }, exam: 'lead-exam' },
  },
];

// kind -> which game runs it. `ref` is the id of the case inside that game.
// par = the score that counts as full marks (used for the mastery score).
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
  // ── Promotion exam
  {
    id: 'soc-exam', title: 'Promotion exam: SOC Analyst', tier: 'advanced', kind: 'simulation', mode: 'simulation', ref: 'soc-exam', minutes: 20, par: 0, access: 'plus',
    exam: true, promotes: 'analyst', passTier: 2,
    blurb: 'One larger case that tests triage, identity, response and reporting together. Silver or better to pass.',
    competencies: { triage: 0.2, identity: 0.3, response: 0.2, reporting: 0.3 },
    unlock: { passedTier: { beginner: 3, intermediate: 2 }, mastery: { triage: 55, phishing: 55, identity: 55 } },
  },
];

// Planned, not built. Shown on the roadmap so players can see what is coming.
export const ROADMAP = [
  { id: 'senior-exam', title: 'Promotion exam: Senior Analyst', note: 'Unlocks the Senior Analyst rank.' },
  { id: 'lead-exam', title: 'Promotion exam: Incident Response Lead', note: 'Unlocks the Incident Response Lead rank.' },
  { id: 'cloud', title: 'Cloud security career path', note: 'Investigate identity events, misconfigurations and suspicious cloud activity.' },
  { id: 'dfir', title: 'Digital forensics and incident response path', note: 'Reconstruct what happened and determine scope.' },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) || null;
}
