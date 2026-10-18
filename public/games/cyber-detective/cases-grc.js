// Governance, Risk and Compliance Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const GRC = [
  {
    id: 'policy-vs-practice',
    title: 'What the policy says',
    skill: 'identity',
    blurb: 'The access policy says every user is reviewed every quarter. An audit says no review has happened for 14 months. Find out how a policy that everyone follows on paper was never followed in practice.',
    brief: [
      'Contoso\'s access control policy requires each system owner to review who has access every quarter, and the compliance dashboard has shown "100% complete" for three years. An auditor has just reported that no real review has happened in 14 months.',
      'You have the policy and the dashboard to start with, and deeper records as you find the right clues. Work out how a control can look complete and not be, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      auto: { strength: 'strong', text: 'The review "completes" automatically if the owner does not respond within 10 days, and the dashboard counts it as done.' },
      nochange: { strength: 'strong', text: 'In 14 months of reviews, owners removed access in only 6 cases out of 9,400 accounts, and in 78% of reviews nobody opened the list.' },
      owners: { strength: 'strong', text: 'Review requests go to 31 system owners, of whom 9 have left the company, so their requests went to nobody.' },
      measure: { strength: 'strong', text: 'The compliance measure is "reviews closed", and not "accounts checked" or "access removed".' },
      volume: { strength: 'weak', text: 'Some owners have more than 2,000 accounts to review.' },
    },
    artefacts: [
      {
        id: 'policy', title: 'The policy and the dashboard',
        blurb: 'What the policy requires and how it is reported.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'measure', text: 'Dashboard: "Access reviews completed this quarter: 31 of 31 (100%)". Metric definition: "a review request is closed"', note: 'The measure counts closed requests. It does not tell you whether anybody looked at the list.' },
          { id: 'a2', type: 'herring', text: 'The policy was approved by the board and last updated in 2023', note: 'A well-approved policy can still not be followed.' },
          { id: 'a3', type: 'herring', text: 'The policy is 6 pages long', note: 'Length does not change whether it operates.' },
          { id: 'a4', type: 'plain', text: 'Policy section 4.2: "System owners shall review all user access quarterly and remove any that is not needed"', note: 'What the policy requires.' },
        ],
      },
      {
        id: 'system', title: 'How the review system really works',
        blurb: 'The workflow tool behind the dashboard.',
        unlockedBy: 'measure',
        lines: [
          { id: 'b1', type: 'clue', clue: 'auto', text: 'Workflow rule: "If no response is received within 10 days, close the request as complete." Requests auto-closed in the last 14 months: 118 of 124', note: 'The system closes the request if nobody acts. It turns silence into a pass.' },
          { id: 'b2', type: 'clue', clue: 'nochange', text: 'Reviews where the owner opened the list: 27 of 124 (22%). Access removed as a result: 6 accounts from 9,400', note: 'Nearly all reviews were not performed, and the few that were found very little to remove.' },
          { id: 'b3', type: 'clue', clue: 'volume', text: 'Largest review list: 2,150 accounts for one owner', note: 'A heavy burden may explain why some owners ignore requests. It is not the main cause.' },
          { id: 'b4', type: 'herring', text: 'The review tool was bought from a well-known vendor', note: 'Reputation does not affect how it is configured.' },
          { id: 'b5', type: 'plain', text: 'Reminder emails are sent on day 5', note: 'A good step, with no consequence if ignored.' },
        ],
      },
      {
        id: 'owners', title: 'Who receives the requests',
        blurb: 'The owners behind the requests.',
        unlockedBy: 'auto',
        lines: [
          { id: 'c1', type: 'clue', clue: 'owners', text: 'System owner list: 31 names. Left the company: 9 (average 11 months ago). Requests for their systems go to their old mailboxes, which are disabled', note: 'Nearly a third of the requests went nowhere, and auto-closed.' },
          { id: 'c2', type: 'herring', text: 'The compliance team sends a monthly summary to the directors', note: 'It reports the same 100% measure.' },
          { id: 'c3', type: 'herring', text: 'The reviews are tracked in a tool rated 4.5 stars by users', note: 'No bearing.' },
          { id: 'c4', type: 'plain', text: 'Leavers from the past 14 months: 52. Accounts still active: 9', note: 'Context: the effect on real access.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'silent', correct: true, text: 'The review process closes a request automatically if the owner does nothing, requests were sent to owners who had left, and the dashboard measures closed requests rather than reviews done, so a control that was not operating reported 100%', explain: 'The auto-close rule, the departed owners and the measure explain why a failing control looked perfect.' },
        { id: 'lazy', correct: false, text: 'System owners deliberately ignored the policy', explain: 'Most owners were never really asked, or were not there. The design turned silence into a pass.' },
        { id: 'fake', correct: false, text: 'The compliance team falsified the dashboard', explain: 'The dashboard counted exactly what it was defined to count. It was the definition that was misleading.' },
        { id: 'audit', correct: false, text: 'The auditor made an error', explain: 'The auditor\'s finding is supported by the workflow and the owner records.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Run a real review of the finance and other critical systems now, remove access that is not needed, stop requests auto-closing, assign every system a current owner and escalate unanswered requests, and change the measure to accounts reviewed and access removed', explain: 'Do the review, fix the design that hid the failure, and measure what matters.' },
        { id: 'remind', correct: false, text: 'Send owners a reminder to complete their reviews', explain: 'Reminders already exist and are ignored. The design needs to change.' },
        { id: 'blame', correct: false, text: 'Discipline the owners who did not respond', explain: 'Many had left and the process closed the requests for them.' },
        { id: 'accept', correct: false, text: 'Tell the auditor the reviews were completed because the dashboard says so', explain: 'It would mislead the auditor with a measure you now know is false.' },
      ],
    },
    story: [
      'A policy requires quarterly reviews of who has access to what, and a workflow tool sends a request to each owner.',
      'If nobody replies within ten days, the tool closes the request as complete, and the dashboard counts closed requests.',
      'Nine of the owners have left, so their requests go nowhere. In fourteen months, only 22% of lists were even opened, and six accounts were removed.',
      'The lesson is to measure the work, not the paperwork: close a review only when a named person has looked and decided.',
    ],
  },
];
