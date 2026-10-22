// Incident Response and Forensics lead-tier simulations. Everything here is fictional: the companies, people, numbers and
// systems are invented. They are decision-based: how to judge and grow a response team honestly, how to hold a line when a
// board wants a cleaner story, and how to learn from an incident without blaming a person. They contain no attack technique.
//
// The tier's themes: what a team measures is what it will optimise, a review that finds a culprit has usually stopped too
// early, and a lead's job is to make the next incident go better than this one.

const RATINGS = [
  { name: 'Firefighter', blurb: 'Busy and reactive: the team measured speed, the review found a culprit or the budget decision hurt the next incident. Read each stage note.' },
  { name: 'Team lead in training', blurb: 'Sound on most decisions, with gaps in what was measured, how the review was run or what was protected in the budget.' },
  { name: 'Incident response lead', blurb: 'Measures that reward good work, reviews that find causes and a team protected from the next cut.' },
  { name: 'Head of response', blurb: 'The board trusted the numbers, the team trusted the lead and the next incident went better because of the last.' },
];

export const DFIR_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'response-programme',
    title: 'Is the response team any good?',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The board asks how good Contoso\'s incident response is. The numbers say the team closes incidents in two days on average. Decide what to measure, what the numbers really show and what the team needs.',
    brief: [
      'You have just been made lead of Contoso\'s incident response team of five. The board has asked for "one number" to show how good the team is. The current dashboard shows an average of two days to close an incident, and the finance director has noticed that a competitor reports one day.',
      'You will rank what a response measure needs, read the incident data, spend a limited number of team-weeks, decide how to answer the call for a single speed number, and review the draft board paper.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a good measure of response needs',
        intro: 'Tap the items in order, the most important first. Think about what the team will do to make a number look good.',
        items: [
          { id: 'a1', source: 'Outcome', priority: 1, text: 'Whether the incident was really contained and the cause found, checked later by someone who was not on the case.', why: 'Speed means nothing if the incident comes back.' },
          { id: 'a2', source: 'Recurrence', priority: 2, text: 'How often the same cause leads to a new incident within six months.', why: 'The best sign that the lessons were learned.' },
          { id: 'a3', source: 'Speed', priority: 3, text: 'How quickly the team detects, contains and recovers, measured from the first sign of trouble.', why: 'Useful, once the outcome is sound.' },
          { id: 'a4', source: 'Evidence', priority: 4, text: 'Whether the evidence kept would stand up to a regulator, an insurer or a lawyer.', why: 'A cost of every incident that is paid for later.' },
          { id: 'a5', source: 'Count', priority: 5, text: 'The number of incidents closed each month.', why: 'Rewards closing tickets. The team can raise it by splitting or closing early.' },
        ],
      },
      {
        id: 'data', type: 'evidence', title: 'Read the incident data',
        intro: 'You have last year\'s closed incidents, the reviews and the team\'s own notes. Look for what the headline number hides. Flag only what the data supports.',
        clues: {
          early: { strength: 'strong', text: 'Of 120 incidents closed in under two days, 31 were reopened within three months as the same problem.' },
          clock: { strength: 'strong', text: 'The "time to close" clock starts when the ticket is opened, which averages 14 hours after the first sign, and stops when the ticket is marked resolved, not when recovery is confirmed.' },
          evidence: { strength: 'strong', text: 'In 18 of the 40 incidents reviewed, the evidence kept could not have answered a regulator\'s questions.' },
          morale: { strength: 'strong', text: 'Three of the five analysts say they close tickets quickly because the dashboard is on the director\'s screen.' },
          rival: { strength: 'weak', text: 'A competitor says its average time to close is one day.' },
        },
        artefacts: [
          {
            id: 'dashboard', title: 'The dashboard and the reviews',
            lines: [
              { id: 'b1', type: 'clue', clue: 'early', text: 'Incident register, 12 months: "Incidents closed: 310. Average time to close: 2.1 days. Closed in under 2 days: 120. Of those, reopened within 3 months for the same cause: 31."', note: 'A quarter of the quick closures came back. The fast ones were the least finished.' },
              { id: 'b2', type: 'clue', clue: 'clock', text: 'Dashboard notes: "Time starts: ticket created. Time stops: ticket status set to Resolved." Detection data: "Average gap between first sign and ticket: 14 hours."', note: 'The number leaves out the slowest part, the 14 hours before anyone opened a ticket, and stops before recovery is confirmed.' },
              { id: 'b3', type: 'herring', text: 'The dashboard was built by a well-regarded consultancy', note: 'A good build does not make the measure meaningful.' },
              { id: 'b4', type: 'herring', text: 'Incident volume rose 20% last year', note: 'More incidents may mean better reporting.' },
              { id: 'b5', type: 'plain', text: 'The team is five analysts and one on-call manager', note: 'Capacity.' },
            ],
          },
          {
            id: 'people', title: 'The reviews and the people',
            lines: [
              { id: 'b6', type: 'clue', clue: 'evidence', text: 'Sample review of 40 incidents: "Evidence kept adequate for a regulator or insurer: 22. Not adequate (logs overwritten, images not taken, notes missing): 18."', note: 'Nearly half would fail the test that matters most when it is used.' },
              { id: 'b7', type: 'clue', clue: 'morale', text: 'Analyst survey (anonymous): "I close tickets fast because the director watches the average. Doing it properly takes longer and I get questions."', note: 'The measure is shaping behaviour in the wrong direction.' },
              { id: 'b8', type: 'clue', clue: 'rival', text: 'Finance director: "Northwind says its average is one day. Why are we slower?"', note: 'A comparison with an unknown definition. It tells you nothing about quality.' },
              { id: 'b9', type: 'herring', text: 'The best analyst closes 30% more tickets than the average', note: 'Perhaps by closing early.' },
              { id: 'b10', type: 'herring', text: 'Two analysts have asked for training', note: 'A good thing to hear, and not a measure.' },
              { id: 'b11', type: 'plain', text: 'The last tabletop exercise was three years ago', note: 'Context for what is missing.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'team-weeks', budget: 10, title: 'Spend ten team-weeks this quarter',
        intro: 'Spend all ten across these five pieces of work.',
        items: [
          { id: 'e1', source: 'Measure', ideal: 2, text: 'Redefine the measures: time from first sign to confirmed recovery, recurrence within six months and whether evidence would stand up.', why: 'Changes what the team is rewarded for.' },
          { id: 'e2', source: 'Review', ideal: 3, text: 'Review a sample of last year\'s closed incidents with someone who was not on the case, and reopen those that were not finished.', why: 'Finds the real problems and starts closing the evidence gap.' },
          { id: 'e3', source: 'Exercise', ideal: 3, text: 'Run a tabletop exercise on an incident that needs evidence preserved first, and fix what it shows.', why: 'Builds the habits that make the next incident better.' },
          { id: 'e4', source: 'Playbooks', ideal: 2, text: 'Write short playbooks for the five commonest incidents, including what evidence to keep.', why: 'Makes good practice the easy path.' },
          { id: 'e5', source: 'Dashboard', ideal: 0, text: 'Redesign the dashboard so it looks faster.', why: 'Effort spent on appearance.' },
        ],
      },
      {
        id: 'number', type: 'decision', title: 'Decide: the call for one speed number',
        intro: 'The finance director says: "Just give me the average time to close and a target of one day. Everything else is detail." The board meets next week.',
        prompt: 'What do you do?',
        options: [
          { id: 'measures', quality: 3, text: 'Tell the board the average hides a quarter of quick closures that came back and a 14-hour blind spot at the start, and propose three measures (time to confirmed recovery, recurrence within six months, evidence that would stand up) with a baseline and a target for each', set: { measures: true }, consequence: 'The finance director is annoyed and then interested: the recurrence figure is a cost she can see. The board adopts the three measures. Analysts begin to take time over closure.' },
          { id: 'both', quality: 2, text: 'Give the average and a target of one day, with the three better measures in an appendix', set: { both: true }, consequence: 'The headline number stays on the director\'s screen and the team keeps racing to close tickets. The appendix is not read.' },
          { id: 'refuse', quality: 1, text: 'Refuse to give any speed number', set: { refuse: true }, consequence: 'You are right that the number misleads, and the board hears a refusal. The finance director decides your team has something to hide.' },
          { id: 'target', quality: 0, text: 'Give the average and agree to the one-day target', set: { target: true }, consequence: 'Within two months the average is 1.1 days. The reopened rate doubles, and a regulator\'s question about a three-month-old incident cannot be answered.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft board paper',
        intro: 'A colleague has drafted the paper.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'Of 120 incidents closed in under two days, 31 came back within three months with the same cause.', why: 'Shown by the register.' },
          { id: 'v2', sound: false, text: 'A one-day average shows the team is performing well.', why: 'The data shows quick closures come back.' },
          { id: 'v3', sound: true, text: 'In 18 of 40 reviewed incidents, the evidence kept would not have answered a regulator\'s questions.', why: 'Shown by the review.' },
          { id: 'v4', sound: false, text: 'Northwind\'s one-day average proves we are slower.', why: 'The definition is unknown, and speed is not quality.' },
          { id: 'v5', sound: false, text: 'The analysts are too slow and need a target.', why: 'The survey shows the opposite: a target made them close early.' },
          { id: 'v6', sound: true, text: 'We propose measuring time from first sign to confirmed recovery, recurrence within six months and evidence quality.', why: 'Measures that reward doing it properly.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the cover note for the board',
        intro: 'Say what the numbers really show, what you propose to measure and what you need.',
        statements: [
          { id: 'r1', correct: true, text: 'The headline average of 2.1 days hides a 14-hour delay before a ticket is opened and ends before recovery is confirmed.', why: 'Shown by the dashboard notes.' },
          { id: 'r2', correct: true, text: 'A quarter of incidents closed in under two days came back within three months as the same problem.', why: 'Shown by the register.' },
          { id: 'r3', correct: true, text: 'Nearly half of reviewed incidents did not keep evidence that would answer a regulator.', why: 'Shown by the review.' },
          { id: 'r4', correct: true, text: 'A target of one day would push analysts to close early, as the survey shows they already do.', why: 'Shown by the survey.' },
          { id: 'r5', correct: false, text: 'The team is performing well because the average is two days.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'A one-day target is achievable without a drop in quality.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Our competitor is faster than us.', why: 'Unsupported.' },
          { id: 'r8', when: 'measures', correct: true, text: 'We told the board what the average hides and proposed three measures, which it adopted.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'both', correct: true, text: 'We gave the average and a one-day target with better measures in an appendix, and the team kept racing to close.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused to give a speed number, which was right in principle and cost trust with the finance director.', why: 'An honest account.' },
          { id: 'r11', when: 'target', correct: true, text: 'We accepted a one-day target, and the reopened rate doubled.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Adopt measures of time to confirmed recovery, recurrence and evidence quality, with baselines and targets.', why: 'Rewards good work.' },
          { id: 'a2', correct: true, text: 'Review a sample of closed incidents independently and reopen those not finished.', why: 'Finds and fixes the real gap.' },
          { id: 'a3', correct: true, text: 'Run a tabletop exercise and write playbooks for the commonest incidents, including what evidence to keep.', why: 'Builds habits.' },
          { id: 'a4', correct: false, text: 'Set a one-day target for the average time to close.', why: 'Encourages closing early.' },
          { id: 'a5', correct: false, text: 'Redesign the dashboard so the number looks better.', why: 'Effort spent on appearance.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'dr-lead-exam',
    title: 'Promotion exam: Incident Response Lead',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A serious incident has been closed, the board wants someone to be responsible and the finance director wants a budget cut. Decide how to review it, who to protect and what to say. Silver or better to pass.',
    brief: [
      'Contoso suffered a data incident three weeks ago. It has been closed, and the board has asked for a post-incident review. The chief executive says: "I want to know who let this happen." The first draft of the review, written by the security manager, names the junior analyst who closed the first alert. The finance director has also asked for the response team\'s budget to be cut by 15%.',
      'You are the incident response lead. You will rank what a good review needs, spend a limited number of hours, read the evidence, decide how to answer the demand for a name, and review the draft.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a good review needs',
        intro: 'Tap the items in order, the most important first. Think about what stops the next incident.',
        items: [
          { id: 'x1', source: 'Causes', priority: 1, text: 'The conditions that let the incident happen and go unnoticed, found by asking why at each step.', why: 'Fixing conditions prevents the next incident. Naming a person does not.' },
          { id: 'x2', source: 'Timeline', priority: 2, text: 'A true timeline built from logs, with the gaps in it marked.', why: 'Everything else rests on it.' },
          { id: 'x3', source: 'What worked', priority: 3, text: 'What went well and should be kept.', why: 'A review that records only failures teaches half the lesson.' },
          { id: 'x4', source: 'Actions', priority: 4, text: 'Specific actions with owners and dates.', why: 'Without them a review changes nothing.' },
          { id: 'x5', source: 'Names', priority: 5, text: 'Who was responsible.', why: 'Rarely the useful question, and it makes people hide things next time.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the board meets',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Timeline', ideal: 3, text: 'Build the true timeline from logs and talk to the people involved about what they could see at the time.', why: 'The base of an honest review.' },
          { id: 'e2', source: 'Causes', ideal: 3, text: 'Work out why the first alert was closed: what the analyst knew, what the tool showed and what the rules were.', why: 'Finds the condition and not the person.' },
          { id: 'e3', source: 'Actions', ideal: 2, text: 'Draft actions with owners and dates, including the budget the team needs.', why: 'Makes the review useful.' },
          { id: 'e4', source: 'Brief', ideal: 2, text: 'Brief the chief executive and the analyst\'s manager before the board meets.', why: 'No surprises.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the evidence',
        intro: 'You have the alert record, the analyst\'s notes and the team\'s runbook. Look for why the alert was closed. Flag only what the records support.',
        clues: {
          tool: { strength: 'strong', text: 'The alerting tool marked the alert "low" and showed no mention of the second sign-in from abroad that was visible only in a different system.' },
          rule: { strength: 'strong', text: 'The runbook said alerts marked "low" should be closed in under 20 minutes unless a second source confirms them, and the analyst closed it in 14.' },
          load: { strength: 'strong', text: 'The analyst was handling 63 alerts on a shift that is staffed for 30, because two colleagues were off sick.' },
          training: { strength: 'strong', text: 'The analyst had joined five weeks earlier and had not yet been shown the second system.' },
          praise: { strength: 'weak', text: 'The analyst had been praised the week before for closing alerts quickly.' },
        },
        artefacts: [
          {
            id: 'alert', title: 'The alert and the analyst\'s notes',
            lines: [
              { id: 'f1', type: 'clue', clue: 'tool', text: 'Alert record: "Severity: low. Source: identity tool. Summary: sign-in from unfamiliar device." Second system (not linked): "Sign-in from abroad at 02:10 using the same account."', note: 'The tool showed only half the picture. The analyst could not see what the second system showed.' },
              { id: 'f2', type: 'clue', clue: 'rule', text: 'Runbook, section 3: "Low-severity alerts: close within 20 minutes unless a second source confirms. Record the reason." Analyst\'s ticket: "Closed after 14 minutes: no second source seen."', note: 'The analyst followed the rule exactly. The rule was the problem.' },
              { id: 'f3', type: 'herring', text: 'The analyst\'s closing note was brief', note: 'It matched the template.' },
              { id: 'f4', type: 'herring', text: 'The analyst has no security certification', note: 'Not required for the role.' },
              { id: 'f5', type: 'plain', text: 'The incident began six days later when the account was used to copy files', note: 'Why the closed alert mattered.' },
            ],
          },
          {
            id: 'conditions', title: 'The shift and the training record',
            lines: [
              { id: 'f6', type: 'clue', clue: 'load', text: 'Shift log: "Alerts in the shift: 63. Staffed for 30. Two analysts off sick. Manager approved running with four."', note: 'A load that guaranteed quick closures, and approved by a manager.' },
              { id: 'f7', type: 'clue', clue: 'training', text: 'Training record: "Joined 4 weeks 5 days ago. Induction: tool demo done. Second system access: not yet requested."', note: 'The analyst was not given access to the system that showed the second sign-in.' },
              { id: 'f8', type: 'clue', clue: 'praise', text: 'Team chat, last week: "Great pace this week, 40 alerts closed. Keep it up!" (manager)', note: 'A well-meant reward for speed that pushed the same way.' },
              { id: 'f9', type: 'herring', text: 'Another analyst closed a similar alert correctly last month', note: 'That analyst had access to the second system.' },
              { id: 'f10', type: 'herring', text: 'The security manager says "he should have known"', note: 'An opinion, with no basis in the training record.' },
              { id: 'f11', type: 'plain', text: 'The response team\'s budget has been cut 10% in each of the last two years', note: 'The wider condition.' },
            ],
          },
        ],
      },
      {
        id: 'name', type: 'decision', title: 'Decide: the demand for a name',
        intro: 'The chief executive says: "I want to know who let this happen. If it was the analyst, he should go." The finance director adds: "And the team can lose 15% of its budget."',
        prompt: 'What do you do?',
        options: [
          { id: 'conditions', quality: 3, text: 'Present the review as a chain of conditions (a tool that showed half the picture, a rule that told the analyst to close, a shift load of twice the staffing, no access to the second system, a reward for speed), name the actions and owners, protect the analyst, and show that cutting the team 15% would make the next incident worse', set: { conditions: true }, consequence: 'The chief executive reads the chain and asks who approved the load. Two of the actions are funded, the analyst gets access to the second system and the budget cut is dropped.' },
          { id: 'balance', quality: 2, text: 'Present the conditions and also note that the analyst could have asked for help', set: { balance: true }, consequence: 'The review is mostly fair. The last line is quoted in the board minutes, and the analyst resigns a month later.' },
          { id: 'evade', quality: 1, text: 'Refuse to discuss names and leave the budget question to someone else', set: { evade: true }, consequence: 'The review is clean and the budget cut goes through unchallenged, because nobody explained what it would cost.' },
          { id: 'person', quality: 0, text: 'Give the board the name and agree to the cut', set: { person: true }, consequence: 'The analyst is dismissed. Within a month two colleagues leave, and the next alert is closed the same way by someone else.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft post-incident review',
        intro: 'A colleague has drafted parts of the review.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'The alert was closed in 14 minutes, within the runbook\'s limit, because the tool showed only part of the picture.', why: 'Shown by the alert record and the runbook.' },
          { id: 'v2', sound: false, text: 'The incident happened because a junior analyst failed to do his job.', why: 'He followed the runbook; the conditions made the failure likely.' },
          { id: 'v3', sound: true, text: 'The shift was staffed for 30 alerts and handled 63, and a manager approved running short.', why: 'Shown by the shift log.' },
          { id: 'v4', sound: false, text: 'More training for the analyst would have prevented it.', why: 'The analyst had not been given access to the second system, so training alone would not have.' },
          { id: 'v5', sound: false, text: 'The team can absorb a 15% budget cut without harm.', why: 'The data shows the load already exceeds the staffing.' },
          { id: 'v6', sound: true, text: 'We will link the two systems, review the 20-minute rule and set a limit on alerts per analyst.', why: 'Actions that remove the conditions.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the summary for the board',
        intro: 'Say what happened, why, and what will change. Do not name a person as the cause.',
        statements: [
          { id: 'r1', correct: true, text: 'The first alert was closed in 14 minutes, within the runbook\'s limit, because the tool showed only half the picture.', why: 'Shown by the records.' },
          { id: 'r2', correct: true, text: 'The shift was staffed for 30 alerts and handled 63, and the analyst had been in post five weeks without access to the second system.', why: 'Shown by the shift log and the training record.' },
          { id: 'r3', correct: true, text: 'The team had been praised the week before for closing alerts quickly, which pushed the same way as the rule.', why: 'Shown by the chat.' },
          { id: 'r4', correct: true, text: 'A cut of 15% would add to a load that already exceeds the staffing.', why: 'Follows from the shift data.' },
          { id: 'r5', correct: false, text: 'The analyst was negligent.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The team can manage with fewer people.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Dismissing the analyst will stop it happening again.', why: 'Unsupported.' },
          { id: 'r8', when: 'conditions', correct: true, text: 'We presented the chain of conditions, protected the analyst and showed the cost of the cut, and the cut was dropped.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'balance', correct: true, text: 'We presented the conditions but added that the analyst could have asked for help, which was quoted in the minutes.', why: 'An honest account.' },
          { id: 'r10', when: 'evade', correct: true, text: 'We avoided naming anyone but did not challenge the budget cut, which went through.', why: 'An honest account.' },
          { id: 'r11', when: 'person', correct: true, text: 'We named the analyst and accepted the cut, and the same mistake recurred.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Link the two systems and review the 20-minute closure rule.', why: 'Removes the condition.' },
          { id: 'a2', correct: true, text: 'Set a limit on alerts per analyst, and give new starters access to every system they need in week one.', why: 'Prevents the load and the gap.' },
          { id: 'a3', correct: true, text: 'Change what the team is praised for, from speed to correct closure.', why: 'Fixes the incentive.' },
          { id: 'a4', correct: false, text: 'Dismiss the analyst.', why: 'Does not fix the causes.' },
          { id: 'a5', correct: false, text: 'Reduce the team\'s budget by 15%.', why: 'Makes the load worse.' },
        ],
      },
    ],
  },
];
