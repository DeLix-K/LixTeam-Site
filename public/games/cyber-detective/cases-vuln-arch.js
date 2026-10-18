// Vulnerability Management Lead Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const VULN_ARCH = [
  {
    id: 'closed-not-fixed',
    title: 'Closed, but not fixed',
    skill: 'hardening',
    blurb: 'The dashboard says 96% of critical vulnerabilities are fixed. An outside tester found the same flaw on three servers the dashboard says are clean. Find out how a ticket can be closed while the flaw stays.',
    brief: [
      'Contoso\'s vulnerability dashboard has shown a closure rate above 95% for a year. A penetration tester has just reported that three production servers still have a serious flaw the dashboard shows as fixed.',
      'You have the ticket records to start with, and deeper evidence as you find the right clues. Work out how fixed things can still be vulnerable, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      noverify: { strength: 'strong', text: 'A ticket can be closed by anyone assigned to it, and nobody checks with a rescan that the flaw has really gone.' },
      reasons: { strength: 'strong', text: 'Of 600 tickets closed last quarter, 140 were closed as "duplicate", "cannot reproduce" or "risk accepted", and a rescan finds the flaw on 96 of them.' },
      incentive: { strength: 'strong', text: 'Teams are measured on closing tickets quickly, and a closed ticket stops reminders and escalations.' },
      redeploy: { strength: 'strong', text: 'Some flaws returned because an old server image was redeployed after the patch was applied to the running servers only.' },
      volume: { strength: 'weak', text: 'Each team received around 80 new tickets a month.' },
    },
    artefacts: [
      {
        id: 'tickets', title: 'Ticket records',
        blurb: 'How tickets were closed.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'reasons', text: 'Closed last quarter: 600 critical tickets. Closed as "patched": 460. As "duplicate": 52. As "cannot reproduce": 44. As "risk accepted": 44. Rescan of the 140 non-"patched" tickets: flaw still present on 96', note: 'Almost 70% of the tickets closed with a non-fix reason still had the flaw. These are the ones that made the figure look good.' },
          { id: 'a2', type: 'herring', text: 'Average time to close a critical ticket: 4.1 days', note: 'A fast number. It rewards closing, not fixing.' },
          { id: 'a3', type: 'herring', text: 'The three servers in the tester\'s report belong to three different teams', note: 'Shows it is not one team\'s habit. It does not explain the mechanism.' },
          { id: 'a4', type: 'plain', text: 'Tickets are created automatically from scanner findings', note: 'The system works as designed for creation.' },
        ],
      },
      {
        id: 'process', title: 'How tickets are closed and measured',
        blurb: 'The rules around closing.',
        unlockedBy: 'reasons',
        lines: [
          { id: 'b1', type: 'clue', clue: 'noverify', text: 'Process note: "The assignee may close a ticket. A closed ticket is not rescanned until the next scheduled scan, which can be up to 5 weeks later, and a rescan does not reopen it"', note: 'Nothing checks that a fix worked, and nothing reopens a ticket if the flaw is still there.' },
          { id: 'b2', type: 'clue', clue: 'incentive', text: 'Team scorecard: "Critical tickets closed within 7 days" is weighted 40% of the monthly security score. Reopened tickets: not counted', note: 'The incentive is to close. There is no penalty for being wrong.' },
          { id: 'b3', type: 'clue', clue: 'volume', text: 'Average new critical tickets per team per month: 80', note: 'A heavy load may explain some shortcuts. It is a smaller cause than the missing check.' },
          { id: 'b4', type: 'herring', text: 'The scorecard is reviewed by the directors every quarter', note: 'Visibility without checking means the numbers get believed.' },
          { id: 'b5', type: 'plain', text: 'Security training on the ticketing system was completed by 94% of staff', note: 'Training on how to use the tool, not on how to confirm a fix.' },
        ],
      },
      {
        id: 'servers', title: 'The three servers',
        blurb: 'Why the flaw came back.',
        unlockedBy: 'noverify',
        lines: [
          { id: 'c1', type: 'clue', clue: 'redeploy', text: 'web-app-07, web-app-12 and api-03: patched on the running servers in March. In June, all three were rebuilt from the March-dated image, which does not contain the patch', note: 'The fix was applied to the servers and never to the image. A rebuild brought the flaw back, and nothing noticed.' },
          { id: 'c2', type: 'herring', text: 'All three servers are in the same cloud region', note: 'A coincidence with no bearing on cause.' },
          { id: 'c3', type: 'herring', text: 'The tester used publicly available tools', note: 'Expected in a test.' },
          { id: 'c4', type: 'plain', text: 'Image build pipeline runs monthly, but only when a developer starts it', note: 'Explains how an old image stayed in use.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'unverified', correct: true, text: 'Tickets are closed without anyone confirming the fix, teams are rewarded for closing, and fixes made only on running servers were lost when old images were redeployed', explain: 'The unchecked closures, the scorecard that rewards them and the redeployed images explain why a clean dashboard hid real flaws.' },
        { id: 'scanner', correct: false, text: 'The scanner has stopped working', explain: 'The scanner found the flaw again on rescan. It is working.' },
        { id: 'lazy', correct: false, text: 'The teams are lazy and ignore security', explain: 'The teams close tickets quickly. The process lets closed mean different things, and the incentive rewards it.' },
        { id: 'tester', correct: false, text: 'The tester found a brand-new flaw', explain: 'The flaw is a known one that the dashboard recorded as fixed.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Fix the three servers and their images now, reopen every ticket closed without a rescan, require a confirming rescan before any ticket can close, count reopened tickets against the scorecard, and build fixes into the images so a rebuild keeps them', explain: 'Fix what is vulnerable, reopen what is untrue, and change the rules so a closed ticket really means fixed.' },
        { id: 'justfix', correct: false, text: 'Patch the three servers and close the finding', explain: 'It leaves 96 other tickets closed on the same false basis, and the process unchanged.' },
        { id: 'blame', correct: false, text: 'Tell the teams off for closing tickets wrongly', explain: 'It does not change the process or the scorecard that encouraged it.' },
        { id: 'faster', correct: false, text: 'Scan more often', explain: 'More scanning without a rule to reopen tickets still lets false closures stand.' },
      ],
    },
    story: [
      'A scorecard rewards teams for closing critical tickets within seven days, and a closed ticket stops the reminders.',
      'Closing a ticket takes one click, and nothing checks that the fix worked. 140 tickets are closed as duplicates, cannot-reproduce or accepted risk, and 96 of those still have the flaw.',
      'Three servers are patched in place, then rebuilt from an old image that never had the patch. The flaw returns and nothing reopens the ticket.',
      'The lesson is that a measure is only as honest as its check: close tickets only when a rescan confirms the fix, and make sure the fix reaches the image.',
    ],
  },
];
