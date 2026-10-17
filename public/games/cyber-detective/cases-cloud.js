// Cloud Security Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. Cloud terms are generic on purpose.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const CLOUD = [
  {
    id: 'logging-gap',
    title: 'The silent week',
    skill: 'identity',
    blurb: 'For six days one region of the cloud account produced no audit events at all. Nobody noticed. Find out why, and what happened while no one was watching.',
    brief: [
      'During a quarterly review the cloud team notices that the audit log for one region, eu-west, has no events at all between 3 and 9 October. The region is not used for anything important, so nobody raised an alarm.',
      'You have the audit log summary to start with, and deeper records as you find the right clues. Work out why the log is silent, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      stopped: { strength: 'strong', text: 'Audit logging for the region was deliberately switched off on 3 October, by a role, not by a failure.' },
      role: { strength: 'strong', text: 'The role that switched it off was assumed from an outside address using the credentials of a service account.' },
      newres: { strength: 'strong', text: 'During the silent week a large number of virtual machines were created in that region, which the company has never used.' },
      bill: { strength: 'strong', text: 'The bill for that region went from almost nothing to several thousand pounds in six days.' },
      back: { strength: 'strong', text: 'Logging was switched back on on 9 October by the same role, after the new machines had been shut down.' },
      alert: { strength: 'weak', text: 'No alert exists for logging being switched off.' },
    },
    artefacts: [
      {
        id: 'logs', title: 'Audit log summary by region',
        blurb: 'What the audit log says about each region.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'stopped', text: 'eu-west: events per day: 3 Oct 112 -> then 0 each day until 9 Oct. A "StopLogging" event is recorded at 02:14 on 3 Oct', note: 'A recorded StopLogging event means this was a deliberate act, not a fault or an outage in the logging service.' },
          { id: 'a2', type: 'herring', text: 'eu-central: normal activity, 4,200 events a day', note: 'The company\'s main region is fine.' },
          { id: 'a3', type: 'herring', text: 'us-east: 38 events a day, all from the monitoring service', note: 'A quiet region with only the usual automated checks.' },
          { id: 'a4', type: 'plain', text: 'Audit log retention: 90 days', note: 'The log that exists is kept long enough to investigate, which is why you can see this now.' },
        ],
      },
      {
        id: 'who', title: 'Who switched it off, and what else did they do?',
        blurb: 'Sign-in and role records around the time.',
        unlockedBy: 'stopped',
        lines: [
          { id: 'w1', type: 'clue', clue: 'role', text: '02:12 on 3 Oct: role ops-automation assumed from 203.0.113.58 using the credentials of service account svc-ops (normally used only from the company network)', note: 'A service account used from a hosting provider address, at night. This is how the attacker got the power to switch logging off.' },
          { id: 'w2', type: 'clue', clue: 'alert', text: 'Alert rules for audit configuration changes: none defined', note: 'It is why the switching-off went unseen. A gap in the controls, not an event.' },
          { id: 'w3', type: 'herring', text: 'svc-ops password last changed 14 months ago', note: 'Worth noting, but it does not show how the credentials were taken.' },
          { id: 'w4', type: 'plain', text: 'Console sign-ins on 3 Oct: 61, all from the company\'s offices', note: 'People working normally. The attacker did not use the console.' },
        ],
      },
      {
        id: 'region', title: 'Activity and cost in the unused region',
        blurb: 'What happened in eu-west while nobody was watching?',
        unlockedBy: 'role',
        lines: [
          { id: 'r1', type: 'clue', clue: 'newres', text: 'Resource inventory (eu-west): 38 large compute instances created between 02:20 and 03:10 on 3 Oct; terminated on 8 Oct', note: 'A burst of machines in a region the company never uses. The footprint of someone using your account for their own purposes.' },
          { id: 'r2', type: 'clue', clue: 'bill', text: 'Billing: eu-west spend 2 Oct £4; 3 Oct £610; 4-8 Oct £1,100 per day; 9 Oct £20', note: 'The bill is the one record that was not switched off, and it shows the cost of the silent week.' },
          { id: 'r3', type: 'clue', clue: 'back', text: '09 Oct 07:02: StartLogging by role ops-automation, from the same address as before', note: 'The attacker restored the log after finishing, to hide the gap.' },
          { id: 'r4', type: 'herring', text: 'Instances were tagged "owner: platform-team"', note: 'A tag anyone with access can add. It does not show who really made them.' },
          { id: 'r5', type: 'herring', text: 'Data transfer out of eu-west: 3 GB', note: 'Low and not part of the main finding.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'evasion', correct: true, text: 'An intruder with a stolen service account switched audit logging off in an unused region, used it for their own computing, and switched it back on', explain: 'The deliberate StopLogging, the outside address, the machines created in an unused region and the cost all fit an attacker hiding their activity while they ran machines at the company\'s expense.' },
        { id: 'outage', correct: false, text: 'A fault in the logging service caused the gap', explain: 'A fault would not record a StopLogging event, and a later StartLogging by the same role.' },
        { id: 'staff', correct: false, text: 'An engineer legitimately switched logging off for maintenance', explain: 'The role was used from an outside address with a service account\'s credentials, and the machines and cost are not maintenance.' },
        { id: 'billing', correct: false, text: 'A billing error produced the cost', explain: 'The inventory shows real machines running for five days.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Revoke and replace the svc-ops credentials, re-enable and protect logging in every region, check the account\'s resources and billing for anything else created, and add alerts for any change to audit settings', explain: 'Cut off the attacker, restore visibility, find what else they did, and make sure the same trick would be noticed next time.' },
        { id: 'justlog', correct: false, text: 'Switch logging back on and close the ticket', explain: 'Logging is already back on, and the attacker still holds the credentials.' },
        { id: 'delete', correct: false, text: 'Delete the unused region\'s resources and the region itself', explain: 'The resources are already terminated, and deleting more would destroy evidence.' },
        { id: 'ignore', correct: false, text: 'Treat it as harmless because no data was in that region', explain: 'The attacker used your account and your credentials. They may have done more than you have seen.' },
      ],
    },
    story: [
      'An attacker obtains the credentials of a service account used by automation, which is allowed to change many settings.',
      'At 02:12 they use it from outside the company, switch audit logging off in an unused region and start 38 large machines there.',
      'For five days nobody notices: the log is silent and the region is quiet. They shut the machines down, switch logging back on and leave.',
      'The one record that told the truth was the bill. The lessons are alerts on audit changes, protection against switching logging off, and watching spend in unused regions.',
    ],
  },
];
