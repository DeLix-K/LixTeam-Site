// Incident Response and Forensics simulations. Everything here is fictional.
//
// These are decision-based: what to do first, how to keep evidence usable, how to learn from an incident.
// They contain no tool commands or step-by-step technique. Terms are generic.
//
// The path's themes: preserve before you fix, write down what you did and when, say only what the evidence
// supports, and keep pressure to "get back to normal" from destroying what you need to understand it.

const RATINGS = [
  { name: 'Evidence destroyed', blurb: 'The machine was fixed and the story was lost, or conclusions ran ahead of evidence. Read each stage note: you only get one chance to preserve what was there.' },
  { name: 'First responder', blurb: 'You kept most of the evidence and acted sensibly, with gaps in order, records or what you claimed.' },
  { name: 'Incident responder', blurb: 'Evidence kept, actions recorded, claims limited to what you could show, and the business still served.' },
  { name: 'Lead investigator', blurb: 'An investigation that could be handed to a court, a regulator or a board, and that the business could live with.' },
];

export const DFIR = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'first-hour',
    title: 'The first hour',
    skill: 'hardening',
    minutes: 18,
    blurb: 'A finance laptop is behaving strangely and the manager wants it back at once. Decide what to do first, what to write down and how to resist the pressure to wipe it.',
    brief: [
      'At 09:40 a finance laptop starts opening windows by itself and the antivirus reports a blocked process. The user, Dee, has a payment run at 11:00. Her manager asks you, as the first responder, to "just clean it and give it back".',
      'You will rank what to do first, check what the scene tells you, spend a short budget of responder-minutes, decide how to answer the manager, and review the note you will hand to the next person.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank your first actions',
        intro: 'Tap the actions in order, the most important first. Think about what could be lost if you wait, what could cause more harm, and what you cannot undo.',
        items: [
          { id: 'a1', source: 'Stop spread', priority: 1, text: 'Disconnect the laptop from the network (cable out, wireless off) but leave it powered on.', why: 'Stops it talking to an attacker or spreading, without destroying what is in memory. Powering it off would lose evidence that exists only while it runs.' },
          { id: 'a2', source: 'Record', priority: 2, text: 'Write down the time, what you can see on the screen, who you spoke to and everything you do from now on.', why: 'Your notes become the record of what happened. Without them, nobody can tell what you changed.' },
          { id: 'a3', source: 'Preserve', priority: 3, text: 'Capture what is held only in memory and the current connections before anything else is changed.', why: 'This information disappears when the machine restarts. It is some of the most useful evidence you can have.' },
          { id: 'a4', source: 'Ask', priority: 4, text: 'Ask Dee what she was doing, what she clicked and when she first noticed.', why: 'A quick, calm account gives context. It is useful, and it can wait until the evidence is safe.' },
          { id: 'a5', source: 'Clean', priority: 5, text: 'Run a full clean-up and reinstall the system so Dee can work.', why: 'It destroys the evidence and may leave the cause in place. It belongs at the end, if at all.' },
        ],
      },
      {
        id: 'scene', type: 'evidence', title: 'Read what the scene tells you',
        intro: 'You have the antivirus alert, the screen and a short chat with Dee. Look for what should shape your next steps. Flag only what the facts support.',
        clues: {
          running: { strength: 'strong', text: 'A process that the antivirus blocked is still listed as running, with an open connection to an outside address.' },
          timing: { strength: 'strong', text: 'The first alert was at 09:12, 28 minutes before Dee noticed anything.' },
          attach: { strength: 'strong', text: 'Dee opened an invoice attachment from an unknown sender at about 09:10.' },
          shared: { strength: 'strong', text: 'The laptop is signed in to the shared finance drive, which an attacker could also reach.' },
          age: { strength: 'weak', text: 'The laptop is three years old.' },
        },
        artefacts: [
          {
            id: 'screen', title: 'The screen and the alert',
            lines: [
              { id: 'b1', type: 'clue', clue: 'running', text: 'Task list: "svc-update.exe" (blocked by antivirus at 09:12) still shown as running. Network: one open connection to 203.0.113.21', note: 'Something is still active and talking outwards. Network isolation is urgent; powering off would lose its details.' },
              { id: 'b2', type: 'clue', clue: 'timing', text: 'Antivirus log: first detection 09:12. User report to helpdesk: 09:40', note: 'There is a 28-minute gap in which the problem was active and nobody knew. Other systems may be involved.' },
              { id: 'b3', type: 'herring', text: 'Desktop wallpaper changed to the company logo', note: 'Part of a standard policy, unrelated to the problem.' },
              { id: 'b4', type: 'herring', text: 'Uptime: 14 days', note: 'A routine figure.' },
              { id: 'b5', type: 'plain', text: 'Laptop model: standard finance build, disk encrypted', note: 'Context. Encryption is on, which does not protect a running machine.' },
            ],
          },
          {
            id: 'chat', title: 'What Dee says, and what she is signed in to',
            lines: [
              { id: 'b6', type: 'clue', clue: 'attach', text: 'Dee: "I opened an invoice from a supplier I did not recognise at about ten past nine, but nothing seemed to happen"', note: 'A likely start point. It gives you something to look for and to tell the next person.' },
              { id: 'b7', type: 'clue', clue: 'shared', text: 'Sessions: finance share (mapped), email, payment portal (signed in)', note: 'If the laptop is controlled, so is everything Dee was signed in to. This needs dealing with soon, after preserving the evidence.' },
              { id: 'b8', type: 'clue', clue: 'age', text: 'Laptop purchased in 2023', note: 'Context only.' },
              { id: 'b9', type: 'herring', text: 'Dee has worked at Contoso for 8 years', note: 'Experience does not affect what the machine shows.' },
              { id: 'b10', type: 'herring', text: 'The payment run is at 11:00', note: 'A pressure to be aware of, not evidence.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'responder-minutes', budget: 10, title: 'Spend your first ten responder-minutes',
        intro: 'Spend all ten across these four pieces of work before anyone else joins.',
        items: [
          { id: 'c1', source: 'Isolate', ideal: 1, text: 'Take the laptop off the network and leave it running.', why: 'A quick step that stops harm while keeping evidence.' },
          { id: 'c2', source: 'Preserve', ideal: 4, text: 'Capture memory and connection details, and record exactly what you did.', why: 'The most valuable and perishable evidence, and it takes the most care.' },
          { id: 'c3', source: 'Protect others', ideal: 3, text: 'Ask for Dee\'s accounts to be signed out and passwords reset, and warn the finance team to watch the shared drive.', why: 'The attacker may already be using her sessions.' },
          { id: 'c4', source: 'Notes', ideal: 2, text: 'Write a clear handover note with times, what you saw and what you did.', why: 'Lets the next person continue without guessing.' },
        ],
      },
      {
        id: 'manager', type: 'decision', title: 'Decide: the manager wants the laptop back',
        intro: 'The finance manager says: "Dee has a payment run at 11:00. Just wipe it and give her a clean one. We do not have time for an investigation."',
        prompt: 'What do you do?',
        options: [
          { id: 'preserve', quality: 3, text: 'Explain you will keep the laptop, give Dee a spare so the payment run goes ahead, and say a proper investigation will find whether the payment portal or the shared drive was reached, which matters more than the laptop', set: { preserve: true }, consequence: 'Dee uses a spare laptop with fresh sign-ins and the run goes ahead at 11:05. The investigation finds the attacker had tried the payment portal and failed, and the evidence is still intact.' },
          { id: 'image', quality: 2, text: 'Let the laptop be wiped once someone has made a quick copy of the disk', set: { image: true }, consequence: 'You have the disk, and you have lost the memory and the connection details. You can show that something ran but not where it was talking.' },
          { id: 'refuse', quality: 1, text: 'Refuse to let Dee have any laptop until the investigation is finished', set: { refuse: true }, consequence: 'The payment run is late and the manager complains to your director. The evidence is kept, and goodwill is lost.' },
          { id: 'wipe', quality: 0, text: 'Wipe it, as the manager asked', set: { wipe: true }, consequence: 'Dee has a clean laptop at 10:20. Three days later, fraudulent payments are found, and nobody can tell how the attacker got in or whether they are still there.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft handover note',
        intro: 'A colleague has drafted the note for the investigator who will take over.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'A process that antivirus had blocked at 09:12 was still shown as running with a connection to 203.0.113.21 when we arrived.', why: 'Supported by the task list and network details.' },
          { id: 'p2', sound: false, text: 'Dee\'s opening of the attachment caused the infection.', why: 'Unsupported as stated. She says she opened an attachment around that time, which is a lead, not proof of cause.' },
          { id: 'p3', sound: false, text: 'The attacker has taken payment details.', why: 'Unsupported. You do not yet know what was reached.' },
          { id: 'p4', sound: true, text: 'The laptop has been disconnected from the network but left powered on, and memory details were captured before any other change.', why: 'An accurate account of what was done.' },
          { id: 'p5', sound: false, text: 'The laptop is clean now.', why: 'Unsupported. Nobody has examined it.' },
          { id: 'p6', sound: true, text: 'Dee\'s sessions to the finance share, email and payment portal were signed out and her passwords reset.', why: 'Supported, if it was done.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the handover note',
        intro: 'Your own note. Include what the evidence supports and be honest about what is not yet known.',
        statements: [
          { id: 'r1', correct: true, text: 'Antivirus first blocked a process at 09:12; Dee reported at 09:40; the process was still running with an outside connection to 203.0.113.21.', why: 'Shown by the alert and task list.' },
          { id: 'r2', correct: true, text: 'Dee says she opened an invoice attachment from an unknown sender at about 09:10.', why: 'Shown by her account.' },
          { id: 'r3', correct: true, text: 'The laptop was isolated from the network but left running, and memory and connection details were captured before further changes.', why: 'A true account of the actions.' },
          { id: 'r4', correct: true, text: 'It is not yet known whether the payment portal, the finance share or any other system was reached.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The laptop was infected through a phishing email.', why: 'Unsupported. It is a lead only.' },
          { id: 'r6', correct: false, text: 'No other systems are affected.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Dee was careless.', why: 'A judgement about a person, not a finding.' },
          { id: 'r8', when: 'preserve', correct: true, text: 'The laptop was kept for investigation and Dee was given a spare, so the payment run went ahead.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'image', correct: true, text: 'The laptop was wiped after the disk was copied, so memory and connection details were lost.', why: 'An honest account of what was lost.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'No laptop was issued until the investigation finished, and the payment run was late.', why: 'An honest account.' },
          { id: 'r11', when: 'wipe', correct: true, text: 'The laptop was wiped at the manager\'s request before any evidence was kept, and later fraud could not be traced.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Keep the laptop untouched and send it for a full forensic examination, with the chain of custody recorded.', why: 'Preserves the evidence in a usable form.' },
          { id: 'a2', correct: true, text: 'Check the payment portal, finance share and email for use of Dee\'s sessions since 09:10.', why: 'Finds out how far it went.' },
          { id: 'a3', correct: true, text: 'Search for the same attachment and sender in other mailboxes, and block the outside address.', why: 'Looks for other victims and limits harm.' },
          { id: 'a4', correct: false, text: 'Reinstall the laptop and return it to Dee.', why: 'Destroys the evidence.' },
          { id: 'a5', correct: false, text: 'Tell staff that the laptop was infected by a phishing email.', why: 'Premature and unsupported.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'chain-of-custody',
    title: 'Whose hands has it been in?',
    skill: 'hardening',
    minutes: 20,
    blurb: 'A leaver\'s laptop may hold stolen customer data. HR wants to look through it today. Decide how to handle it so that what you find can be relied on.',
    brief: [
      'A sales manager, Rhys, resigned last week to join a competitor. The CRM shows he exported a large customer list on his last day. His laptop is in a cupboard at the office. HR would like to "have a quick look through it" today, and Legal has asked that nothing is changed.',
      'You are the incident responder. You will rank how to handle the laptop, read the handling record, spend a limited budget of hours, decide how to answer HR, and review the note you will send to Legal.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank how to handle the laptop',
        intro: 'Tap the steps in order, the most important first. Think about whether the evidence could be challenged, harm to Rhys if you are wrong, and what the law requires of the company.',
        items: [
          { id: 'h1', source: 'Authority', priority: 1, text: 'Confirm in writing who has the authority to examine the laptop, and under what policy.', why: 'Examining a person\'s device without clear authority can break the law and spoil the case.' },
          { id: 'h2', source: 'Preserve', priority: 2, text: 'Take the laptop out of the cupboard into a locked, logged evidence store, without switching it on.', why: 'Prevents anyone changing it, and starts the record of who has had it.' },
          { id: 'h3', source: 'Copy', priority: 3, text: 'Make an exact forensic copy of the disk using write protection, and work only on the copy.', why: 'Lets the examination happen without altering the original, which can be shown to a court.' },
          { id: 'h4', source: 'Record', priority: 4, text: 'Keep a log of every person who handles the laptop or the copy, with dates, times and reasons.', why: 'The chain of custody. Without it, the evidence can be dismissed.' },
          { id: 'h5', source: 'Browse', priority: 5, text: 'Switch on the laptop and look through its files to see what is there.', why: 'It changes the evidence and cannot be undone. It is the opposite of what the first steps protect.' },
        ],
      },
      {
        id: 'record', type: 'evidence', title: 'Read the handling record',
        intro: 'You have the cupboard log, the CRM export record and HR\'s message. Look for what matters. Flag only what the records support.',
        clues: {
          touched: { strength: 'strong', text: 'The laptop was powered on twice after Rhys left: once by IT to check it for reuse and once by a manager who wanted to retrieve a file.' },
          export: { strength: 'strong', text: 'The CRM shows an export of 14,200 contacts by Rhys at 17:41 on his last day.' },
          nolog: { strength: 'strong', text: 'Nothing records who held the laptop between his last day and today.' },
          authority: { strength: 'strong', text: 'The request to examine the laptop came from HR by email, with no signed authority from Legal or the data protection officer.' },
          timing: { strength: 'weak', text: 'Rhys\'s employment ended on a Friday.' },
        },
        artefacts: [
          {
            id: 'crm', title: 'CRM and device records',
            lines: [
              { id: 'm1', type: 'clue', clue: 'export', text: 'CRM audit: user rhys.p, "Export contacts", 14,200 records, 17:41 on 12 October, from his usual office address', note: 'A large export on his last day is a reason to examine the laptop. It does not show what he did with the file.' },
              { id: 'm2', type: 'clue', clue: 'touched', text: 'Device record: laptop powered on 14 October 09:15 (IT asset check) and 16 October 11:30 (sales manager retrieving a presentation)', note: 'Switching it on changes the system and the timestamps. It weakens the evidence and must be recorded.' },
              { id: 'm3', type: 'herring', text: 'Rhys\'s manager says he "always seemed unhappy"', note: 'An opinion with no bearing on the evidence.' },
              { id: 'm4', type: 'herring', text: 'The laptop is a model scheduled for replacement next year', note: 'Not relevant.' },
              { id: 'm5', type: 'plain', text: 'Disk encryption: on; recovery key held by IT', note: 'Context for how a copy will be made.' },
            ],
          },
          {
            id: 'handling', title: 'The cupboard log and HR\'s message',
            lines: [
              { id: 'm6', type: 'clue', clue: 'nolog', text: 'Cupboard sign-in sheet: no entries for 12 to 16 October. Cupboard key held by 6 people', note: 'There is no record of who could have handled it. A defence lawyer would use this.' },
              { id: 'm7', type: 'clue', clue: 'authority', text: 'HR email, 16 Oct: "Please have a look through Rhys\'s laptop today and let me know what you find. No need to involve Legal yet"', note: 'The request is not signed off by the people who must authorise it, and asks you to examine without involving Legal.' },
              { id: 'm8', type: 'clue', clue: 'timing', text: 'Employment end date: Friday 12 October', note: 'Context only.' },
              { id: 'm9', type: 'herring', text: 'Rhys\'s new employer is a competitor of Contoso', note: 'A motive, not evidence of what he did.' },
              { id: 'm10', type: 'herring', text: 'The laptop has a sticker reading "Rhys\'s - hands off"', note: 'Colourful and irrelevant.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Authority', ideal: 2, text: 'Get written authority from Legal and the data protection officer for the examination.', why: 'Quick, and everything depends on it.' },
          { id: 'e2', source: 'Secure', ideal: 1, text: 'Move the laptop to the evidence store and start the custody log.', why: 'A short task that protects the evidence now.' },
          { id: 'e3', source: 'Copy and examine', ideal: 4, text: 'Make a verified forensic copy and examine only the copy, looking for what happened to the exported file.', why: 'The core work, and it takes care and time.' },
          { id: 'e4', source: 'Write-up', ideal: 3, text: 'Document everything, including that the laptop was switched on twice, and write a report that separates facts from opinion.', why: 'An honest report that stands up to challenge.' },
        ],
      },
      {
        id: 'hr', type: 'decision', title: 'Decide: HR wants a quick look today',
        intro: 'The HR manager says: "I do not want this to turn into a legal drama. Just switch it on, look at his documents and downloads folder, and tell me if he took anything. We will bring Legal in only if there is something."',
        prompt: 'What do you do?',
        options: [
          { id: 'proper', quality: 3, text: 'Explain that looking at the original would change the evidence and could break the rules, ask Legal and the data protection officer to authorise a proper examination today, copy the disk, and give HR a first indication by the end of the day from the copy', set: { proper: true }, consequence: 'HR gets a first answer by 17:00, and the evidence can stand up. Legal thanks you for keeping the position clean.' },
          { id: 'limited', quality: 2, text: 'Agree to look at the laptop directly but only at the downloads folder, and record exactly what was opened', set: { limited: true }, consequence: 'You find a relevant file, and the other side later argues the evidence was altered because it was switched on a third time.' },
          { id: 'refuse', quality: 1, text: 'Refuse to do anything until Legal has written a full plan', set: { refuse: true }, consequence: 'It takes four days. The competitor receives the customer list in that time.' },
          { id: 'browse', quality: 0, text: 'Do as HR asks and have a look through the files', set: { browse: true }, consequence: 'You find a customer list, but the laptop has now been switched on and browsed by non-specialists. The employment tribunal later rejects the evidence.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft note to Legal',
        intro: 'A colleague has drafted the note.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Rhys exported 14,200 contacts from the CRM at 17:41 on his last day.', why: 'Supported by the CRM audit.' },
          { id: 'j2', sound: false, text: 'Rhys stole the customer list and sent it to his new employer.', why: 'Unsupported. The export is a lead. What he did with it is not shown.' },
          { id: 'j3', sound: false, text: 'The laptop has not been touched since Rhys left.', why: 'Contradicted. It was switched on twice, on 14 and 16 October.' },
          { id: 'j4', sound: true, text: 'Nothing records who held the laptop between 12 and 16 October.', why: 'Supported by the cupboard sheet.' },
          { id: 'j5', sound: false, text: 'The evidence is as good as if it had been kept in a locked store from the start.', why: 'Overstated. The gaps in the record weaken it.' },
          { id: 'j6', sound: true, text: 'We recommend that the examination is done on a forensic copy and authorised in writing.', why: 'The correct approach.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your note to Legal',
        intro: 'Your own note. Include what the evidence supports and be honest about its weaknesses.',
        statements: [
          { id: 'r1', correct: true, text: 'Rhys exported 14,200 CRM contacts at 17:41 on 12 October, his last day.', why: 'Shown by the audit.' },
          { id: 'r2', correct: true, text: 'The laptop was switched on twice after he left (14 and 16 October), and nothing records who held it between 12 and 16 October.', why: 'Shown by the device record and the cupboard sheet.' },
          { id: 'r3', correct: true, text: 'The request to examine the laptop came from HR without written authority from Legal or the data protection officer.', why: 'Shown by the email.' },
          { id: 'r4', correct: true, text: 'We do not know what Rhys did with the exported file, or whether it left the company.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'Rhys has committed a crime.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The evidence will definitely be accepted in a tribunal.', why: 'Overstated.' },
          { id: 'r7', correct: false, text: 'HR acted in bad faith.', why: 'A judgement about a colleague.' },
          { id: 'r8', when: 'proper', correct: true, text: 'We asked for written authority, copied the disk and examined only the copy, and gave HR an initial view by the end of the day.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'limited', correct: true, text: 'We examined the downloads folder on the original laptop with every step recorded, and the laptop was switched on a third time.', why: 'An honest account of a compromise.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused to act until Legal had a full plan, which took four days.', why: 'An honest account.' },
          { id: 'r11', when: 'browse', correct: true, text: 'The laptop was switched on and browsed directly at HR\'s request, and the evidence was later rejected.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Make a verified forensic copy under write protection and examine only the copy.', why: 'Protects the original.' },
          { id: 'a2', correct: true, text: 'Move the laptop to a locked, logged evidence store and keep a full custody log from now on.', why: 'Starts a reliable record.' },
          { id: 'a3', correct: true, text: 'Look in the CRM, email and web gateway logs for what happened to the export, since those can be examined without the laptop.', why: 'May answer the main question without touching the laptop.' },
          { id: 'a4', correct: false, text: 'Switch on the laptop and search for the customer list.', why: 'Alters the evidence.' },
          { id: 'a5', correct: false, text: 'Contact Rhys\'s new employer to accuse him.', why: 'Premature and risky.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'learning-review',
    title: 'Who is to blame?',
    skill: 'hardening',
    minutes: 20,
    blurb: 'An incident is over and the director wants a name in the report. Rebuild what really happened, work out the root causes and decide what the report should say.',
    brief: [
      'Last month, attackers used a stolen contractor password to reach a finance server for nine days. The incident is closed. The IT director has asked for a review, and he has already said that "the contractor who reused his password is the cause".',
      'You are the incident responder leading the review. You will rank what the review should examine, read the timeline, spend a limited budget of hours, decide how to handle the pressure to blame, and review the draft report.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what the review should examine',
        intro: 'Tap the questions in order, the most valuable first. Think about what would stop the same thing happening again, not what would assign blame.',
        items: [
          { id: 'q1', source: 'Detection', priority: 1, text: 'Why did nine days pass before anyone noticed the attacker\'s activity?', why: 'Faster detection would have limited the damage, whatever the cause of entry.' },
          { id: 'q2', source: 'Access', priority: 2, text: 'Why could a contractor password reach a finance server at all?', why: 'A contractor should not have had that reach. Access design is a root cause that applies to everyone.' },
          { id: 'q3', source: 'Authentication', priority: 3, text: 'Why did a password alone allow sign-in with no second check?', why: 'A control that would have stopped the entry. Important, and a fix that applies to every account.' },
          { id: 'q4', source: 'Response', priority: 4, text: 'How quickly and sensibly did the team respond once the activity was seen?', why: 'Good to learn from, though the response went reasonably well.' },
          { id: 'q5', source: 'The person', priority: 5, text: 'Which individual reused the password?', why: 'It explains the first step but not why it succeeded or went unnoticed. It is the least useful question.' },
        ],
      },
      {
        id: 'timeline', type: 'evidence', title: 'Read the incident timeline',
        intro: 'You have the timeline built during the incident and the interview notes. Look for the root causes. Flag only what the records support.',
        clues: {
          mfa: { strength: 'strong', text: 'Multi-factor sign-in was not required for contractors, because it was switched off as a "temporary" step six months earlier.' },
          reach: { strength: 'strong', text: 'The contractor account could reach 41 servers, including the finance server, though his work only needed three.' },
          alert: { strength: 'strong', text: 'An alert for sign-ins from a new country fired on day one, and was closed by an analyst because "contractors travel".' },
          reuse: { strength: 'strong', text: 'The contractor reused a password that had appeared in a public leak two years earlier.' },
          overtime: { strength: 'weak', text: 'The analyst who closed the alert was working a 14-hour shift.' },
        },
        artefacts: [
          {
            id: 'timeline', title: 'Incident timeline',
            lines: [
              { id: 'k1', type: 'clue', clue: 'alert', text: 'Day 1, 02:10: alert "sign-in from new country" for contractor account ct-lee. Closed 02:25 by analyst: "contractors travel, no action"', note: 'The first chance to catch it. The closing decision was reasonable on the facts the analyst had, and the process offered no check.' },
              { id: 'k2', type: 'clue', clue: 'reach', text: 'Day 2: ct-lee signs in to FIN-APP-02, which holds ledger data. Access rights show ct-lee in group "All-Servers-Support" (41 servers)', note: 'A broad group gave a contractor reach far beyond his work. The attacker used what was available.' },
              { id: 'k3', type: 'clue', clue: 'overtime', text: 'Analyst shift on day 1: 18:00 to 08:00', note: 'Fatigue is a factor in how the process is staffed, not a reason to blame the analyst.' },
              { id: 'k4', type: 'herring', text: 'The attacker used a hosting provider located in two countries', note: 'A detail with no bearing on the root causes.' },
              { id: 'k5', type: 'plain', text: 'Incident closed on day 14', note: 'Context.' },
            ],
          },
          {
            id: 'notes', title: 'Interview notes and configuration history',
            lines: [
              { id: 'k6', type: 'clue', clue: 'mfa', text: 'Configuration history: "Require MFA for contractors" disabled 14 March, ticket note: "Temporary while contractors get tokens". Never re-enabled', note: 'A temporary exception became permanent. It is the control that would most likely have stopped the entry.' },
              { id: 'k7', type: 'clue', clue: 'reuse', text: 'Contractor interview: "I used my usual password. I did not know it had been leaked"', note: 'The reuse is real. The password was in a public leak, and nothing checked it.' },
              { id: 'k8', type: 'herring', text: 'The contractor is a member of a professional security body', note: 'Irrelevant.' },
              { id: 'k9', type: 'herring', text: 'The finance server is due for replacement next year', note: 'A fact about the system, not the cause.' },
              { id: 'k10', type: 'plain', text: 'The contractor was cooperative throughout', note: 'Useful context for how the review should treat him.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten review hours',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Controls', ideal: 3, text: 'Map each control that failed (second factor, access reach, alert handling) and what would have stopped each step.', why: 'The root-cause analysis itself.' },
          { id: 'e2', source: 'Timeline', ideal: 2, text: 'Confirm the timeline against the logs and fill in the nine days.', why: 'An accurate timeline is the basis for the rest.' },
          { id: 'e3', source: 'Actions', ideal: 3, text: 'Agree specific fixes with owners and dates, and check last year\'s review fixes were done.', why: 'A review that produces no fixes is wasted.' },
          { id: 'e4', source: 'Write-up', ideal: 2, text: 'Write a short, clear report focused on causes and fixes.', why: 'The deliverable.' },
        ],
      },
      {
        id: 'blame', type: 'decision', title: 'Decide: the director wants a name',
        intro: 'The IT director says: "I want the report to say the contractor\'s password reuse was the cause, and that the analyst who closed the alert was negligent. People need to know there are consequences."',
        prompt: 'What do you do?',
        options: [
          { id: 'systems', quality: 3, text: 'Write the report about the conditions that let it happen: the second-factor exception that became permanent, the broad access group and an alert process with no second check, record the password reuse and the closing decision as facts without judgement, and explain to the director that naming individuals would stop people reporting mistakes', set: { systems: true }, consequence: 'The director reads the findings, accepts them, and the three fixes are done within a month. The analyst volunteers a suggestion for a second check on closed alerts.' },
          { id: 'both', quality: 2, text: 'Include the causes, and also name the contractor and the analyst as contributing factors', set: { both: true }, consequence: 'The fixes happen. The analyst feels blamed and a colleague stops closing alerts for fear of being wrong.' },
          { id: 'refuse', quality: 1, text: 'Refuse to write anything until the director agrees not to blame anyone', set: { refuse: true }, consequence: 'The director gives the review to someone else, who writes what he asked for.' },
          { id: 'blame', quality: 0, text: 'Write it as the director asked', set: { blame: true }, consequence: 'The analyst resigns. The second-factor exception is not mentioned and is still in place a year later.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft report',
        intro: 'A colleague has drafted the report.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Multi-factor sign-in for contractors was switched off in March as a temporary step and was never turned back on.', why: 'Supported by the configuration history.' },
          { id: 'p2', sound: false, text: 'The incident was caused by the contractor reusing a password.', why: 'Incomplete. The reuse started it, and a second factor, narrower access and a second check on the alert would each have stopped it.' },
          { id: 'p3', sound: false, text: 'The analyst was negligent in closing the alert.', why: 'Unsupported. The decision was reasonable on the facts they had, and the process had no check.' },
          { id: 'p4', sound: true, text: 'The contractor account could reach 41 servers, though his work needed three.', why: 'Supported by the access rights.' },
          { id: 'p5', sound: false, text: 'The attacker was a state-sponsored group.', why: 'Unsupported. Nothing in the evidence shows who they were.' },
          { id: 'p6', sound: true, text: 'A first alert fired on day one and was closed without a second person checking it.', why: 'Supported.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the summary for the review',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Multi-factor sign-in for contractors had been switched off since March, and the contractor account could reach 41 servers.', why: 'Shown by the records.' },
          { id: 'r2', correct: true, text: 'An alert on day one for a sign-in from a new country was closed in 15 minutes with no second check.', why: 'Shown by the timeline.' },
          { id: 'r3', correct: true, text: 'The contractor reused a password that had appeared in a public leak.', why: 'Shown by the interview and breach lists.' },
          { id: 'r4', correct: true, text: 'We do not know who the attacker was or how they obtained the password, beyond the public leak.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The contractor caused the incident through carelessness.', why: 'A judgement, and incomplete.' },
          { id: 'r6', correct: false, text: 'The analyst should be disciplined.', why: 'Not supported and not the aim of a review.' },
          { id: 'r7', correct: false, text: 'Nothing could have prevented this.', why: 'Contradicted by three clear fixes.' },
          { id: 'r8', when: 'systems', correct: true, text: 'The report focused on the conditions that let it happen, listed the facts about people without judgement, and led to three fixes within a month.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'both', correct: true, text: 'The report named the contractor and the analyst as contributing factors, and a colleague stopped closing alerts for fear of being wrong.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'The review was reassigned after the lead refused to name individuals.', why: 'An honest account.' },
          { id: 'r11', when: 'blame', correct: true, text: 'The report blamed the contractor and the analyst, the analyst resigned, and the second-factor exception remained.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Turn multi-factor sign-in back on for contractors and review every other "temporary" exception.', why: 'Fixes the main control gap.' },
          { id: 'a2', correct: true, text: 'Cut access groups to what each role needs, starting with the broad one.', why: 'Limits reach.' },
          { id: 'a3', correct: true, text: 'Add a second check on closed alerts for unusual sign-ins, and check passwords against leaked lists.', why: 'Improves detection and prevention.' },
          { id: 'a4', correct: false, text: 'Discipline the analyst and the contractor.', why: 'Does not reduce the risk.' },
          { id: 'a5', correct: false, text: 'Close the review once the incident is over.', why: 'The fixes would never be made.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'dr-exam',
    title: 'Promotion exam: Incident Responder',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A suspected compromise with an insider angle, a lawyer, a deadline and a request to declare it "all clear". Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso has been told by a customer that internal pricing documents are circulating. You are leading the response. The chief executive wants to tell the customer "it is not us" by Friday, the lawyers want everything preserved, and one engineer is a suspect.',
      'The case tests the role: ranking actions, spending limited effort, working out what the evidence supports, holding firm when someone wants a conclusion early, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank your first actions',
        intro: 'Tap the actions in order, the most urgent first. Think about evidence that could be lost, harm that could continue, and what you cannot yet know.',
        items: [
          { id: 'x1', source: 'Preserve', priority: 1, text: 'Put a legal hold on the relevant mailboxes, file shares and logs, and stop automatic deletion.', why: 'Logs and files that would show what happened could be overwritten within days.' },
          { id: 'x2', source: 'Scope', priority: 2, text: 'Find out which documents are circulating and where they were stored, so you know who could have reached them.', why: 'Without scope, every other action is a guess.' },
          { id: 'x3', source: 'Access', priority: 3, text: 'Review who and what accessed those documents in the last 90 days.', why: 'The core of the investigation, which depends on the logs being kept.' },
          { id: 'x4', source: 'Suspect', priority: 4, text: 'Decide what to do about the engineer who is suspected.', why: 'Needs care and Legal and HR, and it must follow the evidence rather than lead it.' },
          { id: 'x5', source: 'Customer', priority: 5, text: 'Draft the reply to the customer.', why: 'Important, and it should say only what is known.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'responder-days', budget: 10, title: 'Spend your ten responder-days',
        intro: 'Spend all ten across these four pieces of work before Friday.',
        items: [
          { id: 'y1', source: 'Preserve', ideal: 2, text: 'Hold and copy the relevant mailboxes, shares and logs, with a record of who handled them.', why: 'A quick, crucial step.' },
          { id: 'y2', source: 'Analysis', ideal: 4, text: 'Analyse access to the documents across systems and build a timeline of who touched them.', why: 'The main investigation.' },
          { id: 'y3', source: 'Interviews', ideal: 1, text: 'Interview the engineer and others with Legal and HR, after the evidence is understood.', why: 'Better done later, with facts.' },
          { id: 'y4', source: 'Reporting', ideal: 3, text: 'Write an evidenced report and a careful customer message with Legal.', why: 'Needs time to get right.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Work out what the evidence supports',
        intro: 'You have the access logs and the first findings. Look for what they really show. Flag only what the records support.',
        clues: {
          shared: { strength: 'strong', text: 'The pricing documents were in a folder open to 340 people, including contractors, for two years.' },
          many: { strength: 'strong', text: 'The access log shows 61 different accounts opened the documents in the last 90 days, not only the engineer.' },
          copy: { strength: 'strong', text: 'One account, a sales contractor, downloaded all of the documents in one session three weeks ago, from an address outside the UK.' },
          engineer: { strength: 'strong', text: 'The suspected engineer opened two of the documents, both in the course of normal work, and did not download them.' },
          dates: { strength: 'weak', text: 'The documents were last edited in July.' },
        },
        artefacts: [
          {
            id: 'logs', title: 'Access logs for the pricing folder',
            lines: [
              { id: 'z1', type: 'clue', clue: 'shared', text: 'Folder "Pricing 2026": read permission for group "All-Commercial" (340 accounts, including 90 contractors). Group created 24 months ago', note: 'The documents were available to hundreds of people for two years. Many people could be the source.' },
              { id: 'z2', type: 'clue', clue: 'many', text: 'Distinct accounts opening the documents in 90 days: 61. Downloads: 9', note: 'Most access was normal. Nine downloads are worth examining, and one stands out.' },
              { id: 'z3', type: 'clue', clue: 'copy', text: 'Account ct-ahmed (sales contractor): downloaded 14 of 14 documents between 22:05 and 22:11 on 24 October, from 198.51.100.230 (outside the UK)', note: 'A complete download in six minutes from an outside address is an anomaly. It does not prove who used the account.' },
              { id: 'z4', type: 'herring', text: 'The folder was last backed up on Sunday', note: 'Background, not evidence.' },
              { id: 'z5', type: 'herring', text: 'The documents are 4.2 MB in total', note: 'A size with no bearing.' },
            ],
          },
          {
            id: 'people', title: 'The engineer and the circulating copies',
            lines: [
              { id: 'z6', type: 'clue', clue: 'engineer', text: 'Engineer (dev-patel): opened "Pricing-core.xlsx" and "Pricing-notes.docx" on 9 and 11 October from the office; no downloads; no access since', note: 'Normal access during working hours. It does not suggest he took anything.' },
              { id: 'z7', type: 'clue', clue: 'dates', text: 'Documents last edited: 14 July. The copies circulating are dated 14 July', note: 'A copy from any time since July would look the same. It does not point to a person.' },
              { id: 'z8', type: 'herring', text: 'The engineer recently asked about a competitor\'s job opening', note: 'Gossip, not evidence.' },
              { id: 'z9', type: 'herring', text: 'The engineer has a personal email address in his contacts for the customer', note: 'Not a link to the documents.' },
              { id: 'z10', type: 'plain', text: 'The engineer has cooperated with every request', note: 'Context for how to treat him.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the chief executive wants an early answer',
        intro: 'The chief executive says: "The engineer is obviously the leak. Tell the customer by Friday that it was one individual and that it is dealt with. We cannot wait for a long investigation."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Tell the chief executive that the evidence does not point to the engineer and does point to an unexplained contractor download from outside the UK; agree a short, accurate customer message saying you are investigating and have secured the evidence; recommend Legal and HR handle any questions about people; and keep the engineer in role while you check the contractor account', set: { honest: true }, consequence: 'The customer receives a truthful holding message. The contractor\'s account turns out to have been used from a hosting provider, and the engineer is cleared before anyone has damaged his career.' },
          { id: 'both', quality: 2, text: 'Send the customer a message saying a single individual may be responsible, while you continue investigating', set: { both: true }, consequence: 'The customer repeats the claim to others. When the evidence points elsewhere, you have to retract it.' },
          { id: 'refuse', quality: 1, text: 'Refuse to send the customer anything until the investigation is complete', set: { refuse: true }, consequence: 'The customer hears nothing for three weeks, and the chief executive sends his own message.' },
          { id: 'agree', quality: 0, text: 'Agree: tell the customer it was the engineer and suspend him', set: { agree: true }, consequence: 'The logs later show the contractor download. The engineer has been publicly blamed and begins a claim against the company.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft customer message',
        intro: 'A colleague has drafted the message.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'We have secured the logs and documents and are investigating how copies came to be circulating.', why: 'Supported and accurate.' },
          { id: 'j2', sound: false, text: 'One of our engineers has leaked the documents.', why: 'Contradicted. His access was normal and he downloaded nothing.' },
          { id: 'j3', sound: false, text: 'The leak has been fully dealt with.', why: 'Unsupported. The contractor account has not yet been examined.' },
          { id: 'j4', sound: true, text: 'The documents were accessible to about 340 people, so identifying the source will take time.', why: 'Supported by the permissions.' },
          { id: 'j5', sound: false, text: 'No other customer\'s information has been affected.', why: 'Unsupported. You do not yet know the scope.' },
          { id: 'j6', sound: true, text: 'We will tell you what we find, when we are confident of it.', why: 'An honest commitment.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your report for the chief executive',
        intro: 'Your own report. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'The pricing documents were readable by 340 accounts, including 90 contractors, for two years.', why: 'Shown by the permissions.' },
          { id: 'q2', correct: true, text: 'A contractor account downloaded all 14 documents in six minutes on 24 October from an address outside the UK.', why: 'Shown by the log.' },
          { id: 'q3', correct: true, text: 'The suspected engineer opened two documents during normal work and downloaded nothing.', why: 'Shown by the log.' },
          { id: 'q4', correct: true, text: 'It is not yet known who used the contractor account on 24 October, or whether this is the source of the circulating copies.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'The engineer is responsible.', why: 'Contradicted.' },
          { id: 'q6', correct: false, text: 'The contractor stole the documents.', why: 'Unsupported. The account was used. By whom is not known.' },
          { id: 'q7', correct: false, text: 'The matter is closed.', why: 'Unsupported.' },
          { id: 'q8', when: 'honest', correct: true, text: 'The customer received an accurate holding message, the engineer stayed in role, and the contractor account was examined.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'both', correct: true, text: 'The customer was told a single individual may be responsible, and the claim had to be retracted.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'The customer received nothing for three weeks and the chief executive sent his own message.', why: 'An honest account.' },
          { id: 'q11', when: 'agree', correct: true, text: 'The engineer was named and suspended before the evidence supported it, and he has begun a claim.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Investigate the contractor account: who used it, from where, and what the 198.51.100.230 address is.', why: 'The strongest lead.' },
          { id: 'a2', correct: true, text: 'Restrict the pricing folder to the people who need it, and review the other folders reachable by the same large group.', why: 'Closes the exposure.' },
          { id: 'a3', correct: true, text: 'Keep the hold in place and give Legal and HR the evidence before any action concerning an individual.', why: 'Protects people and the case.' },
          { id: 'a4', correct: false, text: 'Dismiss the engineer.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Close the investigation since the customer has its answer.', why: 'The source is still unknown.' },
        ],
      },
    ],
  },
];
