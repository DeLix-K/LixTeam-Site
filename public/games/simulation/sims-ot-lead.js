// OT/IoT Security senior-tier simulations. Everything here is fictional: the utility, the plant, the devices and the
// people are invented. They are decision-based: how to separate a live plant in safe stages, how to keep the plant
// owners on side, and how to say plainly what is and is not protected. They contain no technique for attacking control
// systems.
//
// The tier's themes: a plant is segmented in stages with a way back at each one, every change belongs to the people who
// run the plant, and a status report for the board is the place to resist saying "secure".

const RATINGS = [
  { name: 'Big-bang change', blurb: 'Too much was changed at once, or without the plant owners, or a claim of security went further than the facts. Read each stage note.' },
  { name: 'Senior OT analyst in training', blurb: 'Mostly safe and staged, with gaps in rollback, in who agreed to what, or in how plainly you described the remaining risk.' },
  { name: 'Senior OT security engineer', blurb: 'Staged changes with a way back, the plant owners in charge of timing, and a truthful account of what is left.' },
  { name: 'Plant security lead', blurb: 'The plant never stopped, every change had a rollback and an owner, and the board heard the truth about what remained.' },
];

export const OT_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'segmentation-plan',
    title: 'Segmenting a live plant',
    skill: 'hardening',
    minutes: 22,
    blurb: 'You have a budget, three maintenance windows this year and a plant that has never been separated from the office. Decide what to do in what order, with a way back at each step, and what to say to the board.',
    brief: [
      'Contoso Water has approved £120,000 and three maintenance windows this year (March, July and November) to separate its plant network from the office network. The current design has one flat network. The operations manager has said that every window is precious, and that anything that fails must be put back within an hour.',
      'You are the senior OT security engineer. You will rank what to do first, read the dependency notes, spend a limited number of engineer-days, decide how to respond to the request to do it all in one window, and review the draft plan before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the stages of the plan',
        intro: 'Tap the stages in order, the first to do at the top. Think about what is least risky to the plant and most reduces exposure.',
        items: [
          { id: 'a1', source: 'Inventory', priority: 1, text: 'Build a full map of what talks to what, with operators, using passive monitoring and walk-rounds.', why: 'You cannot separate what you have not mapped, and mapping touches nothing in the plant.' },
          { id: 'a2', source: 'Perimeter', priority: 2, text: 'Close the routes from the internet and set up a jump host for vendors, in the DMZ.', why: 'The biggest exposure, and done outside the control network.' },
          { id: 'a3', source: 'Office split', priority: 3, text: 'Put a firewall between the office and the plant, allowing only the connections the map shows are needed.', why: 'The main separation, and the first change inside the plant boundary: it needs a window.' },
          { id: 'a4', source: 'Cells', priority: 4, text: 'Split the plant itself into cells so a problem in one area cannot reach the rest.', why: 'The deepest separation and the hardest, so it comes last.' },
          { id: 'a5', source: 'Tidy', priority: 5, text: 'Replace old switches and cables for neatness.', why: 'Useful and risky, and it adds nothing to security.' },
        ],
      },
      {
        id: 'notes', type: 'evidence', title: 'Read the dependency notes',
        intro: 'You have the operators\' notes and the first results of passive monitoring. Look for what shapes the staging. Flag only what the notes support.',
        clues: {
          hidden: { strength: 'strong', text: 'Passive monitoring found 11 connections between the office and the plant that nobody had listed, including a reporting tool, a backup job and an old remote desktop.' },
          rollback: { strength: 'strong', text: 'The operations manager will accept a change only if it can be reversed within an hour and has been rehearsed on the test bench.' },
          window: { strength: 'strong', text: 'The three windows are two hours each, and a failed change in the first one means a wait of four months.' },
          legacy: { strength: 'strong', text: 'The oldest controller cannot be moved to a new address range without a vendor visit.' },
          award: { strength: 'weak', text: 'A consultant says "a full redesign in one window is achievable".' },
        },
        artefacts: [
          {
            id: 'monitor', title: 'Passive monitoring and the operators\' notes',
            lines: [
              { id: 'b1', type: 'clue', clue: 'hidden', text: 'Passive monitoring summary, 30 days: "Office to plant connections observed: 18. Documented: 7. Undocumented: 11 (reporting tool, nightly backup, a remote desktop to the historian, and eight others)."', note: 'A firewall built from the old documentation would have broken eleven things nobody had written down.' },
              { id: 'b2', type: 'clue', clue: 'rollback', text: 'Operations manager: "I will agree a change only if you can put it back within an hour, and you have shown me on the test bench that it works. No rehearsal, no window."', note: 'The plant owner\'s rule: reversibility and rehearsal. It shapes every stage.' },
              { id: 'b3', type: 'herring', text: 'The test bench is a quarter the size of the plant', note: 'Still enough to rehearse the firewall change.' },
              { id: 'b4', type: 'herring', text: 'The plant has had no unplanned outage this year', note: 'A reason to protect the record, and not to avoid change.' },
              { id: 'b5', type: 'plain', text: 'The plant supplies about 200,000 people', note: 'Why caution is right.' },
            ],
          },
          {
            id: 'constraints', title: 'The windows and the devices',
            lines: [
              { id: 'b6', type: 'clue', clue: 'window', text: 'Maintenance calendar: "Windows: 14 March, 11 July, 7 November. Two hours each. A change not complete and verified by the end of the window is reversed."', note: 'Three chances, and a failure in the first costs four months.' },
              { id: 'b7', type: 'clue', clue: 'legacy', text: 'Asset record, pump controller: "Fixed address in the office range. Moving it needs the manufacturer\'s engineer on site, booked six weeks ahead."', note: 'A device that constrains the design, and the booking time.' },
              { id: 'b8', type: 'clue', clue: 'award', text: 'Consultant\'s proposal: "Full segmentation can be done in a single window with a prepared team."', note: 'Confidence is not rehearsal, and a failure would cost four months.' },
              { id: 'b9', type: 'herring', text: 'The consultant has worked on three other utilities', note: 'Their plants are not this plant.' },
              { id: 'b10', type: 'herring', text: 'The budget includes £20,000 for training', note: 'Useful and not a factor in the order.' },
              { id: 'b11', type: 'plain', text: 'The perimeter changes (jump host, closing internet routes) are outside the control network', note: 'They do not need a window.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your first ten engineer-days',
        intro: 'Spend all ten across these five pieces of work before the March window.',
        items: [
          { id: 'e1', source: 'Map', ideal: 3, text: 'Finish the map of connections with the operators, and have each one confirmed or rejected by the person who runs it.', why: 'The foundation, and it touches nothing.' },
          { id: 'e2', source: 'Perimeter', ideal: 3, text: 'Build the jump host and close the internet routes, outside the control network.', why: 'The biggest exposure, no window needed.' },
          { id: 'e3', source: 'Rehearse', ideal: 2, text: 'Rehearse the office firewall change on the test bench and write the one-hour rollback.', why: 'The operations manager\'s condition for the March window.' },
          { id: 'e4', source: 'Book', ideal: 2, text: 'Book the manufacturer\'s engineer for the pump controller, and plan the cell split for November.', why: 'Long lead times.' },
          { id: 'e5', source: 'Tidy', ideal: 0, text: 'Replace old switches and cabling.', why: 'Adds risk and no security.' },
        ],
      },
      {
        id: 'onewindow', type: 'decision', title: 'Decide: the request to do it all in one window',
        intro: 'The consultant says: "Do everything in the March window. You will save four months and two thirds of the cost." The board likes the idea. The operations manager says nothing.',
        prompt: 'What do you recommend?',
        options: [
          { id: 'staged', quality: 3, text: 'Recommend three stages: perimeter now (no window), the office firewall in March with a rehearsed one-hour rollback, the cell split in November; explain that a failure in a single big window would cost four months and risk the plant, and ask the operations manager to co-sign the plan', set: { staged: true }, consequence: 'The operations manager co-signs. March goes in cleanly with one of the eleven hidden connections reopened in minutes using the rollback. The board sees steady progress and a plant that never stopped.' },
          { id: 'two', quality: 2, text: 'Do the perimeter and the office firewall together in March, without a separate rehearsal', set: { two: true }, consequence: 'It works, narrowly. One undocumented connection breaks the nightly backup, and the fix takes most of the window.' },
          { id: 'nochange', quality: 1, text: 'Refuse to change anything until a full redesign is approved', set: { nochange: true }, consequence: 'The plant stays as it is. The internet routes stay open for another year while the board waits for the plan.' },
          { id: 'big', quality: 0, text: 'Accept the consultant\'s plan and do everything in the March window', set: { big: true }, consequence: 'The firewall and the cell split fail together. Three connections are down, the rollback takes four hours instead of one and the window ends. The next one is in July.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the board',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'Internet routes will be closed first, outside the control network, so no window is needed.', why: 'The biggest exposure and the least risk.' },
          { id: 'v2', sound: false, text: 'The plant will be fully separated by the end of March.', why: 'The cell split and the pump controller move are planned for later.' },
          { id: 'v3', sound: true, text: 'Every change inside the plant boundary will be rehearsed on the test bench and have a rollback of an hour or less.', why: 'The operations manager\'s condition.' },
          { id: 'v4', sound: false, text: 'All connections between the office and the plant are documented.', why: 'Eleven were undocumented.' },
          { id: 'v5', sound: false, text: 'Doing everything in one window carries no extra risk.', why: 'A failure costs four months and a longer outage.' },
          { id: 'v6', sound: true, text: 'The operations manager will agree each window\'s changes in advance.', why: 'The plant owners decide.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the plan for the board',
        intro: 'Say what will be done, when, what could go wrong and what remains. Do not say the plant will be secure.',
        statements: [
          { id: 'r1', correct: true, text: 'Passive monitoring found 11 undocumented connections between the office and the plant, which is why the firewall must be built from the map and not from the old documentation.', why: 'Shown by the monitoring summary.' },
          { id: 'r2', correct: true, text: 'Internet routes and vendor access will be dealt with first, outside the control network, since they carry the biggest exposure.', why: 'The right first stage.' },
          { id: 'r3', correct: true, text: 'The office firewall will go in during the March window, rehearsed on the test bench with a one-hour rollback, and the cell split in November.', why: 'The staged plan.' },
          { id: 'r4', correct: true, text: 'The oldest controller cannot be moved without a vendor visit booked six weeks ahead, and will stay protected by the new firewall until it is.', why: 'Shown by the asset record.' },
          { id: 'r5', correct: false, text: 'The plant will be secure by the end of the year.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'Everything can be done in one window with no extra risk.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The documentation is complete and can be trusted.', why: 'Unsupported.' },
          { id: 'r8', when: 'staged', correct: true, text: 'We proposed three stages with a rehearsed rollback, the operations manager co-signed, and the March change went in cleanly.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'two', correct: true, text: 'We did two stages together in March without a rehearsal, and one undocumented connection took most of the window to fix.', why: 'An honest account.' },
          { id: 'r10', when: 'nochange', correct: true, text: 'We changed nothing until a full redesign was approved, which left the internet routes open for another year.', why: 'An honest account.' },
          { id: 'r11', when: 'big', correct: true, text: 'We did everything in one window and it failed, and the next window is four months away.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Close the internet routes and set up the jump host now, outside the control network.', why: 'The biggest exposure, with no window.' },
          { id: 'a2', correct: true, text: 'Rehearse the firewall change on the test bench and write the one-hour rollback before the March window.', why: 'The operations manager\'s condition.' },
          { id: 'a3', correct: true, text: 'Confirm each of the 18 connections with the person who runs it, and book the manufacturer\'s engineer.', why: 'Prevents surprises.' },
          { id: 'a4', correct: false, text: 'Do the whole redesign in the March window.', why: 'Too much risk in one go.' },
          { id: 'a5', correct: false, text: 'Tell the board the plant will be secure by November.', why: 'Unsupported.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ot-senior-exam',
    title: 'Promotion exam: Senior OT Security Engineer',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A safety engineer, an operations manager and a regulator\'s inspector all ask for different things on the same morning. Decide what to protect, what to change and what to refuse. Silver or better to pass.',
    brief: [
      'The regulator\'s inspector is visiting Contoso Water on Thursday. The operations manager wants nothing to change before then. The safety engineer has found that a new monitoring device installed last month has made the plant\'s alarm system slow by two seconds. The head of IT wants to push a security update to the engineering workstation tonight.',
      'You will rank what to settle, spend a limited budget of engineer-hours, read the notes, decide how to answer the push for tonight\'s update, and review the draft statement for the inspector.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first at the top. In a plant, think about what could harm people soonest.',
        items: [
          { id: 'x1', source: 'Alarm delay', priority: 1, text: 'The two-second delay that the new monitoring device has added to the alarm system.', why: 'A safety function has been slowed. Safety comes first, even if the cause is a security tool.' },
          { id: 'x2', source: 'Tonight\'s update', priority: 2, text: 'The head of IT\'s request to push a security update to the engineering workstation tonight.', why: 'It affects a system that talks to controllers and has not been tested.' },
          { id: 'x3', source: 'Inspector', priority: 3, text: 'What to tell the regulator\'s inspector on Thursday.', why: 'It must be true, and it follows the facts.' },
          { id: 'x4', source: 'Operations', priority: 4, text: 'The operations manager\'s wish for no change before Thursday.', why: 'A reasonable constraint, and it does not outrank the alarm.' },
          { id: 'x5', source: 'Inventory', priority: 5, text: 'Updating the asset inventory for the inspector.', why: 'Useful, and last.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-hours', budget: 10, title: 'Spend your ten engineer-hours before Thursday',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Alarm', ideal: 4, text: 'Work with the safety engineer to find why the device slowed the alarm, and fix or remove it in agreement with operations.', why: 'A safety function first.' },
          { id: 'e2', source: 'Test', ideal: 2, text: 'Test the engineering workstation update on the test bench before anyone pushes it live.', why: 'Makes the update safe.' },
          { id: 'e3', source: 'Inspector', ideal: 3, text: 'Prepare an honest status for the inspector: what is protected, what is not and what is planned.', why: 'The inspector will ask for it.' },
          { id: 'e4', source: 'Inventory', ideal: 1, text: 'Update the inventory.', why: 'Useful and quick.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the notes',
        intro: 'You have the safety engineer\'s note, the device\'s log and the update notes. Look for what decides the order. Flag only what the notes support.',
        clues: {
          delay: { strength: 'strong', text: 'Alarm trip tests show the alarm now reaches the control room about two seconds later than before the monitoring device was fitted.' },
          cause: { strength: 'strong', text: 'The monitoring device sits inline on the alarm network, and its buffering is the likely cause of the delay.' },
          untested: { strength: 'strong', text: 'The engineering workstation update has not been tried on the test bench, and a similar update broke the operator software in 2022.' },
          required: { strength: 'strong', text: 'The plant\'s safety case requires alarms to reach the control room within one second.' },
          inspector: { strength: 'weak', text: 'The inspector\'s letter says they will review "the plant\'s security arrangements".' },
        },
        artefacts: [
          {
            id: 'safety', title: 'The safety engineer\'s note and the device log',
            lines: [
              { id: 'f1', type: 'clue', clue: 'delay', text: 'Safety engineer, trip test report: "Alarm raised at the sensor to display in control room: before the monitoring device, 0.7 seconds. After: 2.8 seconds."', note: 'The delay is measured, not guessed. It is a safety matter.' },
              { id: 'f2', type: 'clue', clue: 'required', text: 'Safety case, section 4: "High-pressure alarms must reach the control room within 1 second of the trip."', note: 'The alarm is now outside what the plant is certified to do.' },
              { id: 'f3', type: 'clue', clue: 'cause', text: 'Device log: "Mode: inline, alarm network port 3 to port 4. Buffering: on (up to 2 seconds)."', note: 'A monitoring device should be passive and not in the path. It is inline, and its buffering explains the delay.' },
              { id: 'f4', type: 'herring', text: 'The monitoring device was installed by an approved contractor', note: 'Approved does not make it safe.' },
              { id: 'f5', type: 'herring', text: 'The device has been praised for catching two unlisted devices', note: 'Its value does not decide whether it can stay inline.' },
              { id: 'f6', type: 'plain', text: 'The plant has had no alarm-related incident since the device was fitted', note: 'No incident does not mean no risk.' },
            ],
          },
          {
            id: 'update', title: 'The update and the inspector',
            lines: [
              { id: 'f7', type: 'clue', clue: 'untested', text: 'IT change record: "Engineering workstation update scheduled tonight 22:00. Test bench: not tested. Previous update on this workstation, 2022: operator software failed to start, two days to recover."', note: 'Pushing an untested update is the way a security change becomes a plant outage.' },
              { id: 'f8', type: 'clue', clue: 'inspector', text: 'Inspector\'s letter: "We will review the security arrangements at the plant on Thursday."', note: 'A visit and a topic. It does not say what to claim.' },
              { id: 'f9', type: 'herring', text: 'The update fixes a vulnerability that scored 8.1 out of 10', note: 'A score does not decide whether it is safe to push tonight.' },
              { id: 'f10', type: 'herring', text: 'The head of IT says the update has been installed on 400 office PCs without trouble', note: 'Office PCs are not the engineering workstation.' },
              { id: 'f11', type: 'plain', text: 'The next maintenance window is on Saturday', note: 'A safe place for the update, after testing.' },
            ],
          },
        ],
      },
      {
        id: 'tonight', type: 'decision', title: 'Decide: tonight\'s update and the slow alarm',
        intro: 'The head of IT says: "The update is critical and the inspector is coming Thursday. Push it tonight." The operations manager says: "Nothing changes before Thursday." The alarm is still slow.',
        prompt: 'What do you decide?',
        options: [
          { id: 'safety', quality: 3, text: 'Fix the alarm delay first with the safety engineer and operations (take the monitoring device out of the alarm path, or make it passive), test the update on the bench and schedule it for Saturday\'s window, and tell the inspector plainly what you found and did', set: { safety: true }, consequence: 'The device is moved to a passive tap within two hours, and the alarm returns to 0.7 seconds. The update passes the bench and goes in on Saturday. The inspector notes that the company found and fixed its own fault.' },
          { id: 'leave', quality: 2, text: 'Fix the alarm delay and leave the update to the next quarter', set: { leave: true }, consequence: 'The plant is safe. The vulnerability stays open for three more months, and the inspector asks why.' },
          { id: 'both', quality: 1, text: 'Do nothing until Thursday, as operations asked, and raise both with the inspector', set: { both: true }, consequence: 'The alarm stays slow for six days, outside the safety case. The inspector is not impressed that a known safety fault was left.' },
          { id: 'push', quality: 0, text: 'Push the update tonight, as IT asked, and fix the alarm later', set: { push: true }, consequence: 'The update stops the operator software on the engineering workstation at 22:20, and engineers cannot work on the controllers for two days. The alarm delay is still there.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement for the inspector',
        intro: 'A colleague has drafted the statement.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'A monitoring device fitted last month added about two seconds to the alarm path, outside the one-second limit in the safety case; it was found by the safety engineer\'s test and corrected.', why: 'Plain and accurate.' },
          { id: 'v2', sound: false, text: 'The plant\'s security measures have never affected safety.', why: 'They did, for a month.' },
          { id: 'v3', sound: true, text: 'Security changes to systems that talk to controllers are tested on the bench and made in agreed windows.', why: 'The plant\'s rule.' },
          { id: 'v4', sound: false, text: 'The plant is fully protected against cyber attack.', why: 'Unsupported.' },
          { id: 'v5', sound: false, text: 'The engineering workstation update has been applied.', why: 'It has not, and should be tested first.' },
          { id: 'v6', sound: true, text: 'The office network is not yet separated from the plant network, and the first stage of the separation is planned.', why: 'An honest statement of what remains.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the status for the inspector',
        intro: 'Say what is protected, what is not and what you found. Do not say the plant is fully protected.',
        statements: [
          { id: 'r1', correct: true, text: 'A security monitoring device fitted last month added about two seconds to the alarm path, outside the one-second requirement in the safety case.', why: 'Shown by the trip test.' },
          { id: 'r2', correct: true, text: 'The device was inline with buffering, which is likely to be the cause, and has been moved to a passive position.', why: 'Shown by the device log.' },
          { id: 'r3', correct: true, text: 'A security update for the engineering workstation will be tested on the bench and applied in the next maintenance window.', why: 'Shown by the change record.' },
          { id: 'r4', correct: true, text: 'The plant\'s security arrangements are still being improved, and not all of them are complete.', why: 'An honest statement.' },
          { id: 'r5', correct: false, text: 'The plant is fully protected against cyber attack.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The alarm delay was never a safety concern.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'All security updates are up to date.', why: 'Unsupported.' },
          { id: 'r8', when: 'safety', correct: true, text: 'We fixed the alarm delay first, tested the update on the bench and scheduled it for Saturday, and told the inspector what we found.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'leave', correct: true, text: 'We fixed the alarm delay and left the update for the next quarter, so the vulnerability stayed open.', why: 'An honest account.' },
          { id: 'r10', when: 'both', correct: true, text: 'We changed nothing until Thursday, leaving the alarm outside its limit for six days.', why: 'An honest account.' },
          { id: 'r11', when: 'push', correct: true, text: 'We pushed the update tonight untested, it broke the operator software and the alarm delay remained.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Keep the monitoring device passive, and check that every security tool is out of any safety path.', why: 'Stops it recurring.' },
          { id: 'a2', correct: true, text: 'Test security updates on the bench and apply them in agreed windows with a rollback.', why: 'The plant\'s rule.' },
          { id: 'a3', correct: true, text: 'Tell the inspector what was found and fixed, and where the plant\'s security work still stands.', why: 'Honest and defensible.' },
          { id: 'a4', correct: false, text: 'Push the update tonight to be able to say it is installed.', why: 'Risks the plant.' },
          { id: 'a5', correct: false, text: 'Say nothing about the alarm delay unless asked.', why: 'Hides a safety matter.' },
        ],
      },
    ],
  },
];
