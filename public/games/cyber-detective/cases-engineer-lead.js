// Senior Security Engineer Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const ENGINEER_LEAD = [
  {
    id: 'blind-rule',
    title: 'The alert that never fired',
    skill: 'hardening',
    blurb: 'You have a detection rule for large transfers of data out of the company. It has never raised an alert, and a customer has just found Contoso\'s data on sale. Find out why the rule stayed silent.',
    brief: [
      'A customer has told Contoso that a list of its accounts is being offered for sale. Your team had a rule that should alert on large data transfers to unknown addresses. It has raised no alerts at all this year, and the detection dashboard shows it as "enabled".',
      'You have the rule\'s record to start with, and deeper evidence as you find the right clues. Work out why a rule that looks healthy never fired, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      field: { strength: 'strong', text: 'The rule looks at a field called bytes_out, which was renamed bytes_sent when logging was moved in August, so it has matched nothing since.' },
      nohealth: { strength: 'strong', text: 'Nothing checks that rules still match real events, so a rule that matches nothing looks exactly like a quiet network.' },
      exfil: { strength: 'strong', text: 'The network flow records show about 31 GB sent to one outside address over eleven nights.' },
      scope: { strength: 'strong', text: 'The same migration changed fields for other rules, so more than one detection may have gone blind.' },
      trickle: { strength: 'weak', text: 'The transfers were small each night, which may also have stayed under the rule\'s threshold.' },
    },
    artefacts: [
      {
        id: 'rule', title: 'The detection rule and its record',
        blurb: 'What the rule says, and what it has done.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'field', text: 'Rule "Large outbound transfer": sum(bytes_out) by destination > 5 GB per hour. Alerts raised since 1 January: 0. Events matched since 14 August: 0', note: 'Matching zero events since a single date is a red flag. A working rule would match at least some traffic.' },
          { id: 'a2', type: 'herring', text: 'Rule status on the dashboard: Enabled. Last edited by: J. Okafor', note: 'Enabled only means switched on. It does not mean working.' },
          { id: 'a3', type: 'herring', text: 'Rule severity: High. Notification: security team channel', note: 'Sensible settings. They do nothing if the rule never matches.' },
          { id: 'a4', type: 'plain', text: 'Rule tested against sample data in staging on 2 February', note: 'It passed at the time, which is why nobody doubted it. It says nothing about what changed afterwards.' },
        ],
      },
      {
        id: 'logs', title: 'What the logs and the migration say',
        blurb: 'Fields before and after the logging move.',
        unlockedBy: 'field',
        lines: [
          { id: 'b1', type: 'clue', clue: 'scope', text: 'Logging migration notes, 14 August: renamed bytes_out to bytes_sent, src_ip to source.address, dst_ip to destination.address. Rules updated: 0 of 41', note: 'No one updated the rules. Several of them used the old names, so more than one detection is likely blind.' },
          { id: 'b2', type: 'clue', clue: 'nohealth', text: 'Detection health checks: none. Last review of rules that matched nothing: never', note: 'No process would catch a silent failure, so the gap went unseen for months.' },
          { id: 'b3', type: 'herring', text: 'The security team completed its annual rule review in March', note: 'It was before the migration. It could not have seen this.' },
          { id: 'b4', type: 'herring', text: 'Log volume in the new system is 12% higher than before', note: 'A side effect of the migration with no bearing on the rule.' },
          { id: 'b5', type: 'plain', text: 'The old logging system was retired on 21 August', note: 'It means rules could only use the new field names from then on.' },
        ],
      },
      {
        id: 'flows', title: 'Network flow records for the data warehouse',
        blurb: 'What actually left, and when.',
        unlockedBy: 'scope',
        lines: [
          { id: 'c1', type: 'clue', clue: 'exfil', text: 'Flows from the warehouse server to 198.51.100.77, 02:00 to 04:00, eleven nights from 3 to 13 November: total about 31 GB, port 443', note: 'A steady nightly transfer to one outside address. This is the real incident the rule should have caught.' },
          { id: 'c2', type: 'clue', clue: 'trickle', text: 'Largest single hour: 3.1 GB. Rule threshold: 5 GB per hour', note: 'It would also have fallen under the threshold. A second weakness, not the main reason.' },
          { id: 'c3', type: 'herring', text: 'Destination address belongs to a common hosting provider', note: 'A clue about where, not about why the rule was silent.' },
          { id: 'c4', type: 'herring', text: 'Backup jobs also transfer around 20 GB each Sunday to an internal storage address', note: 'Normal and internal. Not part of this finding.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'silent', correct: true, text: 'A detection rule silently stopped matching after a logging change, and nothing checked that it still worked, so a real data transfer went unseen', explain: 'The renamed field, the zero matches since August, the missing health checks and the nightly transfers fit together.' },
        { id: 'nodetect', correct: false, text: 'Contoso never had a rule for large transfers', explain: 'The rule exists and was tested in February. It stopped working later.' },
        { id: 'ignored', correct: false, text: 'The rule fired and the security team ignored the alerts', explain: 'It raised no alerts at all. There was nothing to ignore.' },
        { id: 'encrypted', correct: false, text: 'Encrypted traffic cannot be detected, so nothing could have been done', explain: 'The rule looks at volume, not content. Encryption would not have hidden it.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Treat the transfers as an incident now, fix the rule and review every rule that used the old field names, add health checks that confirm each rule still matches test events, and replay last year\'s data to see what else was missed', explain: 'Deal with the live incident, repair the blind spots, and make sure a silent failure would be noticed next time.' },
        { id: 'justfix', correct: false, text: 'Fix the field name in the rule and close the ticket', explain: 'It leaves the incident uninvestigated and the other 40 rules unchecked.' },
        { id: 'disable', correct: false, text: 'Disable the rule since it does not work', explain: 'It removes the one detection you had.' },
        { id: 'people', correct: false, text: 'Hire more analysts to watch the dashboard', explain: 'People cannot see an alert that is never raised.' },
      ],
    },
    story: [
      'In August, logging moves to a new system and several fields are renamed. Nobody updates the 41 detection rules.',
      'The rule for large transfers keeps showing as "enabled" and quietly matches nothing.',
      'In November someone starts copying data from the warehouse, a few gigabytes a night, to an outside address. No alert fires.',
      'The lesson is that a quiet rule is not the same as a healthy one: test each detection against known events, and watch for rules that match nothing.',
    ],
  },
];
