// Governance, Risk and Compliance senior-tier Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. The case is about records that look too tidy and how to say what they do and do not show; it
// contains no technique.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const GRC_LEAD = [
  {
    id: 'twelve-reviews',
    title: 'Twelve reviews in one afternoon',
    skill: 'correlation',
    blurb: 'An auditor notices that twelve monthly access reviews were all signed on the same afternoon, the day before the audit. Work out what happened, what the records do and do not show, and how to report it.',
    brief: [
      'Contoso\'s access control policy requires a monthly review of who has access to the finance system. The audit file contains twelve signed reviews, one for each month of the year. The auditor has spotted that the electronic record behind all twelve was created on the same afternoon, the day before the audit began.',
      'You have the audit file to start with, and deeper evidence as you find the right clues. Work out what the records really show, flag the lines that matter and decide the right first move. Do not assume what the records do not show.',
    ],
    ratings: RATINGS,
    clues: {
      oneday: { strength: 'strong', text: 'All twelve review records were created between 16:10 and 17:40 on the day before the audit, in order from January to December.' },
      typed: { strength: 'strong', text: 'The sign-off date on each review was typed in by hand as the first of the month it covers, and does not match the date the record was created.' },
      real: { strength: 'strong', text: 'The reviews contain real findings: seven accounts of leavers who still had access, each disabled during that afternoon.' },
      reviewer: { strength: 'strong', text: 'The reviewer\'s own note says the reviews were not done at the time and were all done that afternoon, working back from a single list.' },
      award: { strength: 'weak', text: 'The access review template was praised in last year\'s internal newsletter.' },
    },
    artefacts: [
      {
        id: 'file', title: 'The audit file',
        blurb: 'What the auditor was given.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'oneday', text: 'System record, access review module: "Records created: Review Jan 16:10, Review Feb 16:22, Review Mar 16:35 ... Review Dec 17:40. Created by: R. Patel. Day: 11 November."', note: 'The records were created together, not over a year. The audit begins on 12 November.' },
          { id: 'a2', type: 'herring', text: 'The reviews all use the same format and wording', note: 'A template makes them look alike. It says nothing about when they were done.' },
          { id: 'a3', type: 'herring', text: 'R. Patel is a new member of the team, who joined in October', note: 'A reason to ask how it happened, and not evidence of wrongdoing.' },
          { id: 'a4', type: 'plain', text: 'The finance system has about 220 accounts', note: 'The scope of the review.' },
          { id: 'a5', type: 'plain', text: 'The policy requires a monthly review, signed by the system owner', note: 'The requirement being tested.' },
        ],
      },
      {
        id: 'dates', title: 'The dates and the findings',
        blurb: 'What each record says and what it led to.',
        unlockedBy: 'oneday',
        lines: [
          { id: 'b1', type: 'clue', clue: 'typed', text: 'Review Mar, sign-off date field: "01/03". Record created: 11 November 16:35. Audit trail of the field: "Edited manually, R. Patel, 11 November 16:36".', note: 'The date shown does not say when the review was done. It says when the review was due. That misstates the record.' },
          { id: 'b2', type: 'clue', clue: 'real', text: 'Review Nov findings: "7 accounts belong to staff who left between February and October. All 7 disabled today. Sign-in log: 2 of the 7 were used after the person left."', note: 'The review was real and found real problems. It was done late, not invented.' },
          { id: 'b3', type: 'herring', text: 'The system owner signed all twelve reviews on 11 November at 17:45', note: 'A signature at the end, and not a sign of when the work was done.' },
          { id: 'b4', type: 'herring', text: 'The audit had been announced six weeks earlier', note: 'Shows the pressure, not the facts.' },
          { id: 'b5', type: 'plain', text: 'Last year\'s audit found no problems with the access review', note: 'Context.' },
        ],
      },
      {
        id: 'note', title: 'What the reviewer says',
        blurb: 'An explanation in the reviewer\'s own words.',
        unlockedBy: 'typed',
        lines: [
          { id: 'c1', type: 'clue', clue: 'reviewer', text: 'Reviewer note, 11 November 17:50: "I found that the reviews had not been done since last year. I did them all today from the current list and filled the earlier months in by working out who had access then. I put the first of each month as the date, so it would look like the policy."', note: 'An honest explanation, and an admission that the dates were set to match the policy. It is a failure of the process more than of one person.' },
          { id: 'c2', type: 'clue', clue: 'award', text: 'Newsletter: "Our access review template was voted Best Process Tool of the year."', note: 'Praise for a form says nothing about whether it was used.' },
          { id: 'c3', type: 'herring', text: 'The system owner was on leave for three weeks in August', note: 'A possible reason, and not an explanation for twelve months.' },
          { id: 'c4', type: 'herring', text: 'Two other teams have similar review processes', note: 'Not evidence about this one.' },
          { id: 'c5', type: 'plain', text: 'The reminder for the monthly review was switched off in the migration last December', note: 'A likely reason nobody noticed.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'late', correct: true, text: 'The monthly reviews were not done through the year, then all done on one afternoon, with sign-off dates entered as the original due dates; the reviews were real and found leavers with access, but the dates misstate when the control operated', explain: 'The creation times, the hand-typed dates, the real findings and the reviewer\'s note together show a control that did not operate, and records that overstate it.' },
        { id: 'forged', correct: false, text: 'The reviews are entirely fabricated: nobody looked at any accounts', explain: 'The findings are real: seven leavers were found and disabled.' },
        { id: 'fine', correct: false, text: 'The control worked: the reviews were simply entered late', explain: 'They were done late, and the dates were changed to look on time. The control did not operate as written.' },
        { id: 'bug', correct: false, text: 'A fault in the system created all the records together', explain: 'The creation was done by a named user who explains why.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'report', correct: true, text: 'Tell the auditor plainly that the control did not operate for the period, correct the recorded dates to the real ones, close and check the leaver accounts (including the two that were used), switch the monthly reminder back on, and treat the failure as a process problem with a named owner, not as one person\'s fault', explain: 'Honest about the gap, repairs the record, deals with the real risk and fixes the cause.' },
        { id: 'leave', correct: false, text: 'Leave the dates as they are, since the reviews were real', explain: 'The dates misstate when the control was run. The auditor would be misled.' },
        { id: 'blame', correct: false, text: 'Discipline the reviewer for falsifying the records', explain: 'The reviewer was honest about what was done, and the cause was a switched-off reminder and a missed month in a handover.' },
        { id: 'delete', correct: false, text: 'Delete the eleven earlier reviews and report only November', explain: 'Deleting records is worse than the problem.' },
      ],
    },
    story: [
      'In last December\'s migration, the reminder for the monthly access review was switched off. Nobody noticed for eleven months.',
      'The day before the audit, a newcomer found the reviews had never been done. He did a real review from the current list and then created twelve records, typing the first of each month as the date so they would look on time.',
      'The findings were real: seven leavers still had access, and two of them had used it. The dates, however, were not true.',
      'The lesson is that a record can be accurate in its findings and false in its dates. Say what the evidence shows, repair what is wrong and fix the process, not just the paperwork.',
    ],
  },
];
