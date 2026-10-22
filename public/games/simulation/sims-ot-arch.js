// OT/IoT Security lead-tier simulations. Everything here is fictional: the utility, the plant, the devices and the people
// are invented. They are decision-based: how to bring the safety case and the security case together, how to spend a
// limited programme budget over years and how to keep the plant owners as partners. They contain no technique for
// attacking control systems.
//
// The tier's themes: safety and security are one conversation, a programme is measured by what the plant is better able to
// survive, and an OT lead keeps the operators on side by never changing the plant behind their backs.

const RATINGS = [
  { name: 'IT in the plant', blurb: 'An office mindset won: a change was made without the safety case, a budget went to the easy things or the operators were left out. Read each stage note.' },
  { name: 'OT lead in training', blurb: 'Safe and well argued in most places, with gaps in joining safety and security, in the order of spending or in keeping operations with you.' },
  { name: 'OT security lead', blurb: 'Safety and security decided together, money spent where the plant is most improved and operations as partners.' },
  { name: 'Head of plant security', blurb: 'Safety engineers asked for your view, the board trusted your plan and the plant was harder to harm and no harder to run.' },
];

export const OT_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'safety-and-security',
    title: 'The safety case and the security case',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The operations director wants remote control of the pump stations to save night call-outs. The safety engineer says it changes the safety case. Bring safety and security together and decide what to recommend.',
    brief: [
      'Contoso Water\'s operations director wants to let engineers start, stop and adjust the pump stations from home, to save about 300 night call-outs a year. The safety engineer says any new way to command a pump changes the plant\'s safety case. The security manager says it also adds a route in.',
      'You are the OT security lead. You will rank what to settle in a joint review, read the proposal and the safety case, spend a limited number of engineer-days, decide how to answer the request for full remote control, and review the draft paper.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a joint safety and security review needs first',
        intro: 'Tap the items in order, the most important first. Think about what could harm people soonest and what is hardest to undo.',
        items: [
          { id: 'a1', source: 'Hazards', priority: 1, text: 'What could go wrong if a pump is started or stopped remotely, by mistake or by someone else, and what protects against it.', why: 'The safety question comes first, and the security question is part of it.' },
          { id: 'a2', source: 'Need', priority: 2, text: 'What the operations director really needs: fewer night call-outs, or remote control specifically.', why: 'The need may have a safer answer than the proposal.' },
          { id: 'a3', source: 'Route', priority: 3, text: 'What a remote route would add for an attacker, and what would stop it being used to command a pump.', why: 'The security side of the same hazard.' },
          { id: 'a4', source: 'Fail-safe', priority: 4, text: 'Whether the plant would still fail safely if the remote link were lost or abused.', why: 'The last line of protection.' },
          { id: 'a5', source: 'Cost', priority: 5, text: 'The saving from fewer call-outs.', why: 'Real, and the last thing to weigh against a hazard.' },
        ],
      },
      {
        id: 'case', type: 'evidence', title: 'Read the proposal and the safety case',
        intro: 'You have the operations proposal, the safety case and the call-out records. Look for what shapes the recommendation. Flag only what the records support.',
        clues: {
          needs: { strength: 'strong', text: 'Of the 300 night call-outs, 240 are only to read a value or restart a monitor, and 60 need a physical action on the pump.' },
          safetycase: { strength: 'strong', text: 'The safety case assumes pumps can only be started or stopped by someone at the station or in the control room, which a remote command would change.' },
          failsafe: { strength: 'strong', text: 'The pump stations are designed to stop safely if they lose contact with the control room for 30 seconds, and a remote command route would sit outside that protection.' },
          oneway: { strength: 'strong', text: 'A read-only link from each station to a monitoring screen at home would cover the 240 read-and-restart call-outs without any way to send a command.' },
          saving: { strength: 'weak', text: 'Each call-out costs about £180 in call-out pay and travel.' },
        },
        artefacts: [
          {
            id: 'proposal', title: 'The proposal and the call-out records',
            lines: [
              { id: 'b1', type: 'clue', clue: 'needs', text: 'Call-out analysis, last year: "300 night call-outs. Read a value or acknowledge an alarm: 150. Restart a monitoring screen: 90. Physical action on a pump or valve: 60."', note: 'Four in five call-outs need information and not control. The proposal solves a bigger problem than the one in the data.' },
              { id: 'b2', type: 'clue', clue: 'saving', text: 'Proposal: "Saving: 300 call-outs x £180 = £54,000 a year. Cost of remote access project: £35,000."', note: 'A real saving, and a number that does not include the safety work.' },
              { id: 'b3', type: 'herring', text: 'A neighbouring utility has already introduced remote pump control', note: 'Their safety case and network are not Contoso\'s.' },
              { id: 'b4', type: 'herring', text: 'The vendor offers remote control as a standard feature', note: 'Available does not mean safe to enable.' },
              { id: 'b5', type: 'plain', text: 'The operations director is under pressure to cut overtime', note: 'The reason for the proposal.' },
            ],
          },
          {
            id: 'safety', title: 'The safety case and the options',
            lines: [
              { id: 'b6', type: 'clue', clue: 'safetycase', text: 'Safety case, section 3: "Hazard: unintended pump start or stop. Control: pumps can only be commanded from the station panel or the control room, by an operator."', note: 'Adding remote command would remove one of the safety case\'s stated controls.' },
              { id: 'b7', type: 'clue', clue: 'failsafe', text: 'Safety case, section 5: "Loss of communication with the control room for 30 seconds stops the pumps in a safe state."', note: 'A good protection against a lost link, and no protection against a deliberate or mistaken remote command that arrives over a live link.' },
              { id: 'b8', type: 'clue', clue: 'oneway', text: 'Options note from the engineers: "A read-only telemetry link to a monitoring page on the engineer\'s phone can show values and alarms. It cannot send commands. Cost: about £12,000."', note: 'Meets most of the need with none of the new hazard.' },
              { id: 'b9', type: 'herring', text: 'Remote control would let one engineer cover three stations', note: 'A benefit, to be weighed after the hazard.' },
              { id: 'b10', type: 'herring', text: 'The safety engineer is described as "cautious" by the operations director', note: 'A label, not an argument.' },
              { id: 'b11', type: 'plain', text: 'The plant is due its five-yearly safety review next year', note: 'A natural point to revisit the case.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your first ten engineer-days',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Joint review', ideal: 3, text: 'Run a joint hazard review with the safety engineer, the operations director and the security manager, asking what could go wrong with remote commands.', why: 'Puts safety and security in one conversation.' },
          { id: 'e2', source: 'Read-only', ideal: 3, text: 'Design the read-only monitoring option and cost it properly, including how the data leaves the plant.', why: 'The option that meets most of the need.' },
          { id: 'e3', source: 'Remaining 60', ideal: 2, text: 'Look at the 60 call-outs that need a physical action, and ask whether better local automation or a better rota would reduce them.', why: 'Tests whether remote control is needed at all.' },
          { id: 'e4', source: 'Brief', ideal: 2, text: 'Brief the operations director on what the data shows, before anyone writes a paper.', why: 'Keeps the operations director as a partner.' },
        ],
      },
      {
        id: 'remote', type: 'decision', title: 'Decide: the request for full remote control',
        intro: 'The operations director says: "I do not want a lecture. I want engineers able to start and stop pumps from home, with two-factor sign-in. The safety engineer is just being cautious." The board has seen the saving.',
        prompt: 'What do you recommend?',
        options: [
          { id: 'readonly', quality: 3, text: 'Recommend the read-only link now (it removes 240 of the 300 call-outs), keep commands at the station and the control room, and revisit remote commands through the safety review next year with the hazards assessed, offering to help the operations director present it', set: { readonly: true }, consequence: 'The operations director is disappointed and then pleased: the call-outs fall by 80%. The safety engineer co-signs the paper, and the board approves.' },
          { id: 'mfa', quality: 2, text: 'Allow remote control with two-factor sign-in, a jump host and a record of every command, with the safety engineer\'s agreement', set: { mfa: true }, consequence: 'It works for six months. The safety case is amended with extra controls, which cost more than the read-only link, and the second-factor device of one engineer is lost.' },
          { id: 'refuse', quality: 1, text: 'Refuse any remote link of any kind', set: { refuse: true }, consequence: 'The plant stays as it is. The operations director goes round you to the vendor and a remote link is installed without review.' },
          { id: 'enable', quality: 0, text: 'Enable the vendor\'s remote control feature as it is, to deliver the saving', set: { enable: true }, consequence: 'The feature has no command logging and a default login. A mistaken command from an engineer\'s phone stops a pump during a hot afternoon, and the safety case no longer describes the plant.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft paper for the board',
        intro: 'A colleague has drafted the paper.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'Eighty percent of night call-outs are to read a value or restart a monitor, which a read-only link would remove.', why: 'Shown by the call-out analysis.' },
          { id: 'v2', sound: false, text: 'Remote control of pumps is safe if two-factor sign-in is used.', why: 'The safety hazard is mistaken or unintended commands as well as unauthorised ones.' },
          { id: 'v3', sound: true, text: 'The safety case assumes pumps can only be commanded from the station or the control room, and a remote command would change that.', why: 'Shown by the safety case.' },
          { id: 'v4', sound: false, text: 'The 30-second fail-safe protects against remote commands.', why: 'It protects against a lost link, not a live one.' },
          { id: 'v5', sound: false, text: 'The saving is £54,000 a year with no other cost.', why: 'It leaves out the safety and security work.' },
          { id: 'v6', sound: true, text: 'Remote commands can be reconsidered at the safety review next year, with the hazards assessed.', why: 'A route to a safe yes.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the paper for the board',
        intro: 'Say what the data shows, what you recommend now and what would be needed to go further.',
        statements: [
          { id: 'r1', correct: true, text: 'Of 300 night call-outs, 240 are only to read a value or restart a monitor, and 60 need physical action on a pump or valve.', why: 'Shown by the call-out analysis.' },
          { id: 'r2', correct: true, text: 'The safety case assumes pumps can only be commanded from the station or control room, so remote commands would change it.', why: 'Shown by the safety case.' },
          { id: 'r3', correct: true, text: 'A read-only monitoring link would remove most of the call-outs at about £12,000 and add no way to send a command.', why: 'Shown by the options note.' },
          { id: 'r4', correct: true, text: 'The 30-second loss-of-contact stop does not protect against a mistaken or unauthorised command over a working link.', why: 'Follows from the safety case.' },
          { id: 'r5', correct: false, text: 'Remote control with two-factor sign-in is as safe as a command at the station.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The vendor\'s remote control feature can be enabled as supplied.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The safety engineer\'s concern is overcautious.', why: 'Unsupported.' },
          { id: 'r8', when: 'readonly', correct: true, text: 'We recommended the read-only link now and remote commands through the safety review, and call-outs fell by 80%.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'mfa', correct: true, text: 'We allowed remote control with two factors and logging, which worked and cost more than the read-only link.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused any remote link, and the operations director installed one without review.', why: 'An honest account.' },
          { id: 'r11', when: 'enable', correct: true, text: 'We enabled the vendor\'s remote control as supplied, and a mistaken command stopped a pump.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Install a read-only monitoring link for engineers, and keep commands at the station and control room.', why: 'Meets most of the need safely.' },
          { id: 'a2', correct: true, text: 'Bring remote commands into next year\'s safety review, with the hazards and the extra controls assessed.', why: 'A route to a safe yes.' },
          { id: 'a3', correct: true, text: 'Review the 60 physical call-outs for local automation or rota changes.', why: 'Tests whether remote control is needed.' },
          { id: 'a4', correct: false, text: 'Enable remote pump control as supplied by the vendor.', why: 'Changes the safety case without assessment.' },
          { id: 'a5', correct: false, text: 'Allow remote control on the basis of two-factor sign-in alone.', why: 'Does not address mistaken commands.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ot-lead-exam',
    title: 'Promotion exam: OT Security Lead',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A five-year programme, one year of budget at a time, a regulator and an operations manager who has seen security projects come and go. Decide where the money goes and what to say. Silver or better to pass.',
    brief: [
      'The board has approved £600,000 over the next two years for plant security, and asked you for a plan. The regulator\'s inspector has asked what Contoso will do about its oldest controllers. The operations manager says: "I have seen four security projects come and go. Every one added work for my team and left the plant no safer."',
      'You are the OT security lead. You will rank where the money does most good, spend a limited budget of units across four areas, read the evidence about what has worked, decide how to answer the operations manager, and review the draft plan.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank where the money does most good',
        intro: 'Tap the items in order, the first to fund at the top. Think about what reduces the chance and the effect of harm to the plant, and what operations will accept.',
        items: [
          { id: 'x1', source: 'Separation', priority: 1, text: 'Separate the office from the plant and the plant into cells, in stages with rollbacks.', why: 'The biggest reduction in how far a problem can spread.' },
          { id: 'x2', source: 'Watching', priority: 2, text: 'Passive monitoring of the plant network and a way for operators to see what it finds.', why: 'Finds what the other measures miss, and costs the plant nothing.' },
          { id: 'x3', source: 'Recovery', priority: 3, text: 'Tested offline backups and a rehearsed manual-mode plan for each station.', why: 'Limits the effect of anything that gets through.' },
          { id: 'x4', source: 'People', priority: 4, text: 'Joint exercises with operators, so security is practised with the people who run the plant.', why: 'Builds the trust the operations manager is missing.' },
          { id: 'x5', source: 'Replacement', priority: 5, text: 'Replacing the oldest controllers.', why: 'Right in the end and expensive, and protection by separation and watching can precede it.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: '£100k units', budget: 6, title: 'Spend the £600,000 over two years',
        intro: 'Spend all six units (each £100,000) across these four areas.',
        items: [
          { id: 'e1', source: 'Separation', ideal: 2, text: 'Office firewall, jump host and the first plant cells, with rehearsal on the test bench.', why: 'The biggest reduction in exposure.' },
          { id: 'e2', source: 'Watching', ideal: 1, text: 'Passive monitoring across the plant and a simple operator view.', why: 'Cheap and effective.' },
          { id: 'e3', source: 'Recovery', ideal: 2, text: 'Offline backups, a tested restore and a manual-mode drill at each station.', why: 'Protects against what gets through.' },
          { id: 'e4', source: 'Replacement', ideal: 1, text: 'A first replacement of the oldest controller, planned for a maintenance window.', why: 'Starts the long job.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the evidence about what has worked',
        intro: 'You have the notes from the four earlier security projects and the plant\'s incident history. Look for what operations has reason to distrust. Flag only what the records support.',
        clues: {
          extra: { strength: 'strong', text: 'Three of the four earlier projects added a weekly manual task for operators, such as a password change on each station, and none gave them anything back.' },
          unseen: { strength: 'strong', text: 'In the last three years, every plant incident (11) was caused by a component fault or a human error, and none by an attacker.' },
          trust: { strength: 'strong', text: 'The operations manager has agreed to every change that was rehearsed on the test bench with operators present, and refused every one that was not.' },
          old: { strength: 'strong', text: 'The oldest controller cannot be patched, and replacing all of them would cost about £1.4 million.' },
          fear: { strength: 'weak', text: 'A news story last month described attacks on water utilities elsewhere.' },
        },
        artefacts: [
          {
            id: 'history', title: 'The earlier projects and the incident history',
            lines: [
              { id: 'f1', type: 'clue', clue: 'extra', text: 'Project review (all four): "Added to the operators\' routine: weekly password change on each station (3 projects); quarterly USB check (2); monthly access review sign-off (1). Removed from the routine: nothing."', note: 'Operations has been given work and no relief. Distrust is earned.' },
              { id: 'f2', type: 'clue', clue: 'unseen', text: 'Plant incident log, three years: "11 incidents. Causes: component fault 6, operator or maintenance error 4, power supply 1. Malicious: 0."', note: 'The plant\'s real incidents are about faults and errors. A plan that helps with those as well will be welcomed.' },
              { id: 'f3', type: 'herring', text: 'The plant won an industry award for its safety record', note: 'A real strength, and not evidence about attackers.' },
              { id: 'f4', type: 'herring', text: 'Two of the four earlier projects were run by an outside consultancy', note: 'Not a measure of the quality of the projects.' },
              { id: 'f5', type: 'plain', text: 'The plant has 14 stations and one control room', note: 'Scale.' },
            ],
          },
          {
            id: 'ops', title: 'The operations manager and the controllers',
            lines: [
              { id: 'f6', type: 'clue', clue: 'trust', text: 'Change log: "Firewall change to the sludge plant: rehearsed on the bench with operators, agreed, in window, completed. Alarm-network monitor: not rehearsed, refused."', note: 'The operations manager says yes to rehearsal and no to surprises. The method is known.' },
              { id: 'f7', type: 'clue', clue: 'old', text: 'Asset report: "Controllers older than 12 years: 5 of 14 stations. Unpatchable. Replacement of all: £1.4m."', note: 'Replacement is beyond the budget. Protection by structure and watching is not.' },
              { id: 'f8', type: 'clue', clue: 'fear', text: 'News summary: "Attacks on water utilities elsewhere raise concerns."', note: 'A reason for attention, and no basis for a threat to Contoso on its own.' },
              { id: 'f9', type: 'herring', text: 'The regulator\'s inspector asked about "state of the art" protection', note: 'Loose wording, and no reason to spend the budget on appearance.' },
              { id: 'f10', type: 'herring', text: 'A supplier offers a "plant security platform" for £500,000', note: 'A product is not a plan.' },
              { id: 'f11', type: 'plain', text: 'The board approved the budget unanimously', note: 'Goodwill to protect.' },
            ],
          },
        ],
      },
      {
        id: 'ops', type: 'decision', title: 'Decide: how to answer the operations manager',
        intro: 'The operations manager says: "Another security programme. Tell me what it takes off my team\'s plate, or I will not support it." The regulator\'s inspector is waiting for the plan.',
        prompt: 'What do you do?',
        options: [
          { id: 'partner', quality: 3, text: 'Make the plan with the operations manager: every change rehearsed on the bench with operators and rolled back in an hour, recovery and manual-mode drills that also help with the plant\'s real faults and errors, no new weekly tasks for operators without taking one away, and a joint steering group; give the inspector the staged plan, including the controllers that cannot be patched and how they are protected', set: { partner: true }, consequence: 'The operations manager co-signs the plan. The first stage goes in on time, and the manual-mode drills catch a real fault in a backup power supply. The inspector accepts the plan.' },
          { id: 'sell', quality: 2, text: 'Make the case to the operations manager that the plan is needed and will make the plant safer, and ask for support', set: { sell: true }, consequence: 'The operations manager listens and remains unconvinced. The plan proceeds with grudging compliance and few volunteers.' },
          { id: 'board', quality: 1, text: 'Go to the board with the plan and ask for it to be mandated', set: { board: true }, consequence: 'The plan is mandated. Operators comply on paper and rehearse nothing, and the first change fails in its window.' },
          { id: 'platform', quality: 0, text: 'Buy the supplier\'s £500,000 platform to show the inspector something concrete', set: { platform: true }, consequence: 'The platform arrives with its own alerts and a weekly task for operators. Within three months it is switched off, and £500,000 is spent.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the board and the inspector',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'Every change inside the plant will be rehearsed on the test bench with operators and have a rollback of an hour or less.', why: 'The operations manager\'s own rule.' },
          { id: 'v2', sound: false, text: 'The plan will make the plant completely secure within two years.', why: 'Unsupported: oldest controllers remain, and security is never complete.' },
          { id: 'v3', sound: true, text: 'Five of the 14 stations have controllers older than 12 years that cannot be patched, and will be protected by separation and monitoring until they are replaced.', why: 'Shown by the asset report, with an honest plan.' },
          { id: 'v4', sound: false, text: 'All the controllers will be replaced within two years.', why: 'The cost is £1.4m against a budget of £600,000 for everything.' },
          { id: 'v5', sound: false, text: 'The plant has suffered several cyber attacks that justify the programme.', why: 'The incident log shows none.' },
          { id: 'v6', sound: true, text: 'No new routine task will be given to operators without one being taken away.', why: 'Answers the operations manager\'s objection.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the summary for the board and the inspector',
        intro: 'Say what the money will do, what it will not do and how operations are involved.',
        statements: [
          { id: 'r1', correct: true, text: 'The plan separates the office from the plant in rehearsed stages, adds passive monitoring and builds recovery and manual-mode drills at every station.', why: 'The spending priorities.' },
          { id: 'r2', correct: true, text: 'Five stations have controllers that cannot be patched, and will be protected by separation and watching until they are replaced, which needs a later budget.', why: 'An honest statement of what remains.' },
          { id: 'r3', correct: true, text: 'The plant\'s eleven incidents in three years were all faults or errors, so the plan also targets recovery and rehearsal that help with those.', why: 'Shown by the incident log.' },
          { id: 'r4', correct: true, text: 'Operations will co-own the plan, rehearse each change with operators and add no routine task without removing one.', why: 'Keeps the partner.' },
          { id: 'r5', correct: false, text: 'The plant will be fully secure by the end of the programme.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The oldest controllers will be replaced within the budget.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The plant has been attacked repeatedly.', why: 'Unsupported.' },
          { id: 'r8', when: 'partner', correct: true, text: 'We made the plan with the operations manager, who co-signed it, and the inspector accepted it.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'sell', correct: true, text: 'We argued the case to operations, who remained unconvinced, and the plan proceeded with grudging compliance.', why: 'An honest account.' },
          { id: 'r10', when: 'board', correct: true, text: 'We had the plan mandated by the board, and operators complied on paper while the first change failed.', why: 'An honest account.' },
          { id: 'r11', when: 'platform', correct: true, text: 'We bought a £500,000 platform to show the inspector, and it was switched off within three months.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Run a joint steering group with the operations manager and rehearse every change on the bench.', why: 'Keeps operations as a partner.' },
          { id: 'a2', correct: true, text: 'Fund separation, monitoring and recovery drills first, and budget the controller replacement for later.', why: 'The order that reduces harm the most.' },
          { id: 'a3', correct: true, text: 'Give operators something back: drills that also catch real faults and no new task without one removed.', why: 'Answers the distrust.' },
          { id: 'a4', correct: false, text: 'Buy a security platform to show the inspector.', why: 'A product is not a plan.' },
          { id: 'a5', correct: false, text: 'Tell the board the programme will make the plant secure.', why: 'Unsupported.' },
        ],
      },
    ],
  },
];
