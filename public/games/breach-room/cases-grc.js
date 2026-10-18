// Governance, Risk and Compliance Breach Room cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const GRC = [
  {
    id: 'green-controls',
    title: 'Three controls that were green',
    skill: 'data',
    blurb: 'Last quarter\'s assessment rated every control in this area effective. An attack then passed through three of them in one afternoon. Rebuild how each one failed.',
    brief: [
      'A customer-support agent\'s account was used to read 4,100 customer records. The last self-assessment rated the access, logging and backup controls "effective". The incident report names all three as having failed.',
      'You have evidence from the sign-in records, the permissions system, the logs and the backups. Place each card in the right stage of the incident and spot the noise. Tap an indicator (an account, a server or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'The way in', desc: 'How the attacker got the agent\'s login.', story: 'The agent, Priya, received a message that looked like a password-expiry notice and typed her password into a fake page. The control meant to stop this, a second factor on sign-in, was switched off for her group when the agents were moved to a new phone system, and never turned back on.' },
      { id: 'reach', name: 'More access than the job needed', desc: 'What the account could reach.', story: 'Priya\'s account sat in a group that could read every customer record, though agents only needed the customers they were serving. The access review that should have trimmed the group had been rated effective, but had not been done for three quarters.' },
      { id: 'blind', name: 'Nobody was watching', desc: 'Why the activity went unseen.', story: 'The attacker read 4,100 records over three hours. The alert that would have flagged an unusual volume of record views was set to a threshold of 20,000, and sent to a mailbox that nobody read.' },
      { id: 'recover', name: 'The recovery that did not work', desc: 'What happened when the team tried to put things right.', story: 'The attacker also changed 60 records. To restore them, the team turned to the nightly backup, and found the restore failed, because the backup set had been corrupt for five weeks and the test was marked as passed from an old result.' },
    ],
    cards: [
      { id: 'e1', source: 'Sign-in log', time: '10:12', stage: 'initial', text: 'The support group "CS-Agents" shows "second factor: not required" since 3 March, when the policy was changed during the phone migration. No change request recorded.', indicators: ['CS-Agents', 'priya.n'], note: 'The control that would have stopped a stolen password was off for months, with no record of why.', hint: 'Why did a stolen password work?' },
      { id: 'n1', source: 'Directory', time: '10:30', text: 'The nightly sync of 22 staff accounts completes normally.', indicators: [], note: 'Routine housekeeping unrelated to the incident.', hint: 'Does it involve the agent, the group or the address?' },
      { id: 'e9', source: 'Change record', time: '10:45', stage: 'initial', text: "The change ticket for the phone migration lists 'second factor: switch off for CS-Agents during cut-over', with an end date of 5 March. No ticket was raised to switch it back on.", indicators: ['CS-Agents'], note: 'A step meant to be temporary was never undone, and the change record had no way to remind anyone.', hint: 'How did the control come to be off?' },
      { id: 'e2', source: 'Sign-in log', time: '11:04', stage: 'initial', text: 'priya.n signs in from 203.0.113.60, in another country, with a password only. Her normal location is the UK.', indicators: ['priya.n', '203.0.113.60'], note: 'The stolen password is used from a place she is not. With no second factor, nothing checks.', hint: 'The login is used.' },
      { id: 'e3', source: 'Permissions', time: '11:08', stage: 'reach', text: 'priya.n is a member of "CS-AllCustomers", which has read access to all 640,000 customer records. Agents need access only to the customers assigned to them. Last review of the group: 9 months ago.', indicators: ['priya.n', 'CS-AllCustomers'], note: 'The group gives far more reach than the job needs, and the review that should trim it was not done.', hint: 'What could the account reach?' },
      { id: 'e4', source: 'Audit record', time: '11:10', stage: 'reach', text: 'The self-assessment record for "quarterly access review" says "effective, evidence: reviews completed". The reviews were closed automatically with no owner response.', indicators: ['CS-AllCustomers'], note: 'The control was marked effective on a measure that did not show whether anyone had looked.', hint: 'Why was the group still so wide?' },
      { id: 'n2', source: 'Logs', time: '11:20', text: 'The web server logs 1,900 routine customer-site requests from normal addresses.', indicators: [], note: 'Normal traffic from customers.', hint: 'Does it involve priya.n or the unusual address?' },
      { id: 'e5', source: 'Application log', time: '11:30', stage: 'blind', text: 'priya.n views 4,100 customer records in 3 hours. The alert for unusual record viewing has a threshold of 20,000 views a day.', indicators: ['priya.n', 'alert threshold'], note: 'The attacker kept under a threshold that was far too high to catch this.', hint: 'Why did nobody notice?' },
      { id: 'e6', source: 'Alert system', time: '11:31', stage: 'blind', text: 'The alert routing for record-viewing alerts sends to "csops-alerts@contoso.example", a shared mailbox that nobody has read since July.', indicators: ['alert threshold', 'csops-alerts@contoso.example'], note: 'Even a correct alert would have gone nowhere.', hint: 'Where would an alert have gone?' },
      { id: 'n3', source: 'Application log', time: '12:00', text: 'The support team completes 140 ordinary customer calls.', indicators: [], note: 'Normal operations.', hint: 'Is this part of the attack?' },
      { id: 'e7', source: 'Application log', time: '13:12', stage: 'recover', text: 'priya.n changes the phone number and email on 60 customer records, which the attacker then uses to receive reset messages.', indicators: ['priya.n'], note: 'Changing contact details lets the attacker take over customer accounts, and it is something the team must undo.', hint: 'What did the attacker change?' },
      { id: 'e8', source: 'Backup system', time: '16:40', stage: 'recover', text: 'The team tries to restore the 60 records from the nightly backup. The restore fails: "backup set corrupt since 12 October". The weekly test report still says "passed", based on a result from 5 weeks earlier.', indicators: ['backup set'], note: 'The backup control was rated effective, and the test result was a stale pass.', hint: 'Could the team put it right?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What do the three failures have in common?',
        options: [
          { id: 'paper', correct: true, text: 'Each control was marked effective on a measure that showed the paperwork was done, not that the control worked', explain: 'A switched-off second factor, an access review closed by silence, an alert with no reader and a backup test left over from the past were all reported green.' },
          { id: 'tech', correct: false, text: 'The technology was too old to support them', explain: 'The controls existed and were switched on or off by people and settings.' },
          { id: 'insider', correct: false, text: 'An insider deliberately switched them off', explain: 'Nothing suggests this. Changes were made for ordinary reasons and never reviewed.' },
          { id: 'budget', correct: false, text: 'The company did not spend enough on security tools', explain: 'The tools existed. The testing of whether they worked was missing.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which change to the way controls are assessed would have caught these failures?',
        options: [
          { id: 'test', correct: true, text: 'Test each control against real evidence on a schedule (try a restore, check whether an alert reaches a person, look at who actually has access), and record what was tried', explain: 'Testing the control as it works, rather than reading what its owner says, finds a control that has quietly stopped.' },
          { id: 'more', correct: false, text: 'Write more detailed policies', explain: 'The policies existed. The gap was that nobody checked they were followed.' },
          { id: 'annual', correct: false, text: 'Do the self-assessment less often', explain: 'A less frequent paper review would find less, not more.' },
          { id: 'staff', correct: false, text: 'Train staff not to click on password pages', explain: 'Helpful, but the controls should still work if someone does.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should the response include beyond resetting the agent\'s password?',
        options: [
          { id: 'full', correct: true, text: 'Switch the second factor back on for all groups it was removed from, trim the over-wide group, restore or correct the 60 changed records by other means and tell the affected customers and the data protection officer, fix the alert threshold and routing, repair the backup, and re-test all three controls and correct the self-assessment', explain: 'The customers, the legal duty, the three failed controls and the assessment itself all need attention.' },
          { id: 'reset', correct: false, text: 'Reset the agent\'s password and close the incident', explain: 'It leaves three failed controls, 4,100 viewed records and 60 changed ones.' },
          { id: 'discipline', correct: false, text: 'Discipline the agent who entered her password', explain: 'The design should not depend on nobody being fooled, and it leaves the controls unrepaired.' },
          { id: 'wait', correct: false, text: 'Wait for the next audit to review the controls', explain: 'The failures are known and the customers need telling now.' },
        ],
      },
    ],
    summary: 'Three controls were rated effective on paperwork: a second factor that had been switched off, an access review closed by silence, and an alert nobody read, with a backup that no longer restored. Testing controls against evidence on a schedule, instead of trusting reported status, is what finds them before an attacker does.',
  },
];
