// Incident Response and Forensics senior-tier simulations. Everything here is fictional: the companies, people, systems
// and times are invented. They are decision-based: how to lead people through an incident, in what order to do things when
// evidence is at risk, and how to say only what you can show. They contain no attack technique.
//
// The tier's themes: evidence is lost by good intentions as often as by attackers, a lead's job is to keep the order of
// things straight under pressure, and a report is the one product that outlasts the incident.

const RATINGS = [
  { name: 'Lost the evidence', blurb: 'The pressure won: evidence was lost, roles were unclear or a claim went further than the facts. Read each stage note.' },
  { name: 'Senior responder in training', blurb: 'You kept most things in order, with gaps in preserving evidence, in who owned what, or in how you told leaders the truth.' },
  { name: 'Senior incident responder', blurb: 'Evidence kept, roles clear, the business served and the facts stated plainly under pressure.' },
  { name: 'Incident lead', blurb: 'The response ran in the right order, nothing was lost that did not have to be, and the report stood up to every question.' },
];

export const DFIR_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'incident-lead',
    title: 'Leading the response',
    skill: 'hardening',
    minutes: 22,
    blurb: 'A file server has been compromised and nine people are trying to help. The chief executive wants it back by Monday. Decide what to settle first, who owns what, and what to do about the order of imaging and restoring.',
    brief: [
      'Friday, 16:30. Contoso\'s main file server has been found running a program nobody installed. The IT team, Legal, HR, Communications and a forensic contractor are all on a call, and everybody has an opinion. The chief executive has said: "I want the server back by Monday morning."',
      'You are the incident lead. You will rank what to settle in the first hour, read the situation notes, spend a limited budget of hours, decide what to do about the rush to rebuild the server, and review the draft status note before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle in the first hour',
        intro: 'Tap the items in order, the first to settle at the top. Think about what cannot be undone and what everything else depends on.',
        items: [
          { id: 'a1', source: 'Evidence', priority: 1, text: 'Stop anyone rebuilding, rebooting or cleaning the server until its disk and memory have been preserved.', why: 'It is the one thing that cannot be undone. Everything you will want to say later depends on it.' },
          { id: 'a2', source: 'Owners', priority: 2, text: 'Name who owns what: one person for technical work, one for Legal, one for communications, one keeping the decision log.', why: 'Nine people with no owners make duplicated work and dropped tasks.' },
          { id: 'a3', source: 'Containment', priority: 3, text: 'Cut the server off from the network while leaving it powered on.', why: 'Stops any further harm and keeps the memory.' },
          { id: 'a4', source: 'Legal', priority: 4, text: 'Bring Legal in and agree how the investigation is documented and who is told.', why: 'Affects what you write down and how, and starts any notification clock properly.' },
          { id: 'a5', source: 'Restore plan', priority: 5, text: 'Plan how the business gets a working file server by Monday.', why: 'Matters a great deal, and it can run in parallel once the evidence is safe.' },
        ],
      },
      {
        id: 'notes', type: 'evidence', title: 'Read the situation notes',
        intro: 'You have the call notes, the server\'s details and the backup record. Look for what shapes the plan. Flag only what the notes support.',
        clues: {
          rebuild: { strength: 'strong', text: 'The IT manager says he will rebuild the server at 18:00 to be ready for Monday, and does not plan to image it first.' },
          owners: { strength: 'strong', text: 'Three different people each say they thought someone else had told Legal.' },
          backup: { strength: 'strong', text: 'The last verified backup is from Wednesday night, before the program appeared; Thursday\'s backup has not been checked.' },
          memory: { strength: 'strong', text: 'The suspicious program runs only in memory and is gone if the server is restarted.' },
          rumour: { strength: 'weak', text: 'A manager says the program "looks like the one on the news".' },
        },
        artefacts: [
          {
            id: 'call', title: 'The call notes and the server record',
            lines: [
              { id: 'n1', type: 'clue', clue: 'rebuild', text: 'Call notes, 16:40: "IT manager: the quickest way to be sure it is clean is to wipe it and rebuild from the standard image. I can start at 18:00 and have it back by midnight. No need to keep the old disk."', note: 'A reasonable instinct that would destroy the only copy of the evidence.' },
              { id: 'n2', type: 'clue', clue: 'owners', text: 'Call notes, 16:50: "Has anyone told Legal?" "I thought you had." "I thought the IT manager had." "I assumed HR."', note: 'Without owners, the call to Legal has not been made. Naming owners is the first job of a lead.' },
              { id: 'n3', type: 'clue', clue: 'memory', text: 'Forensic contractor, 17:05: "The process is not on disk. If the machine is restarted we lose the only record of what it was doing."', note: 'A reboot is as destructive as a wipe. Memory must be captured while the machine is running.' },
              { id: 'n4', type: 'herring', text: 'The server is 6 years old and is due for replacement next year', note: 'Age is not a reason to rebuild it tonight.' },
              { id: 'n5', type: 'herring', text: 'The chief executive has sent two messages asking for a time', note: 'Pressure, not evidence.' },
              { id: 'n6', type: 'plain', text: 'About 1,200 staff use the file server daily', note: 'Context for why the business wants it back.' },
            ],
          },
          {
            id: 'backups', title: 'The backup record and the rumours',
            lines: [
              { id: 'n7', type: 'clue', clue: 'backup', text: 'Backup log: "Wednesday 23:00 verified OK. Thursday 23:00 completed, not verified. Friday 23:00 scheduled."', note: 'There is a clean-enough backup from before the program, so the business can have a working server without the old disk.' },
              { id: 'n8', type: 'clue', clue: 'rumour', text: 'Marketing manager: "That looks like the thing in the news this week. It is definitely a foreign group."', note: 'A guess from a news story. It has no place in the record.' },
              { id: 'n9', type: 'herring', text: 'The contractor charges a premium rate at weekends', note: 'A cost, not a reason to wait.' },
              { id: 'n10', type: 'herring', text: 'Staff have already started to ask on the intranet whether files are safe', note: 'A communications issue, not an evidence one.' },
              { id: 'n11', type: 'plain', text: 'The server has 4 TB of data and imaging it will take about two hours', note: 'The time cost of preserving the evidence.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend the first ten hours of the team\'s time',
        intro: 'Spend all ten across these five pieces of work this evening.',
        items: [
          { id: 'e1', source: 'Preserve', ideal: 3, text: 'Capture the server\'s memory and take a verified image of its disk, with hashes and a record of who did it and when.', why: 'The one thing that cannot be redone.' },
          { id: 'e2', source: 'Restore', ideal: 3, text: 'Build a clean replacement from the standard image and the Wednesday backup, in parallel.', why: 'Gets the business its server without destroying the evidence.' },
          { id: 'e3', source: 'Scope', ideal: 2, text: 'Check the other servers and the accounts for signs of the same program, from the logs.', why: 'You need to know if there is more than one machine.' },
          { id: 'e4', source: 'Tell', ideal: 2, text: 'Brief Legal and the chief executive: what is known, what is not, and what happens by Monday.', why: 'Keeps leaders on the same page.' },
          { id: 'e5', source: 'Clean', ideal: 0, text: 'Remove the suspicious program from the live server so staff can use it tonight.', why: 'It destroys evidence for a short-lived gain, and a clean replacement is on its way.' },
        ],
      },
      {
        id: 'rebuild', type: 'decision', title: 'Decide: the rush to rebuild',
        intro: 'The IT manager says: "I will wipe and rebuild at 18:00. Imaging takes two hours and we do not have a place to keep 4 TB. The chief executive wants it Monday." It is 17:20.',
        prompt: 'What do you decide?',
        options: [
          { id: 'both', quality: 3, text: 'Image the server and capture its memory first, cut it off from the network but leave it running until the capture is done, and build a clean replacement in parallel from the Wednesday backup so the business still opens on Monday', set: { both: true }, consequence: 'The memory capture is done by 18:15 and the image by 20:30. The replacement is ready by Sunday night. Monday opens on time, and the contractor has the evidence to work from.' },
          { id: 'imageonly', quality: 2, text: 'Image the disk first and then wipe and rebuild the original', set: { imageonly: true }, consequence: 'You keep the disk and lose the memory, so the contractor cannot say what the program was doing. Monday opens on time.' },
          { id: 'delay', quality: 1, text: 'Keep the server as it is, untouched, until the investigation is finished, and tell the business there is no date', set: { delay: true }, consequence: 'The evidence is safe. The business has no file server on Monday, and the chief executive is furious.' },
          { id: 'rebuild', quality: 0, text: 'Let IT wipe and rebuild at 18:00, as planned, and investigate from the logs', set: { rebuild: true }, consequence: 'The server is back at midnight. The contractor has no memory and no disk, and cannot say what the program took. The company will not be able to tell customers or the regulator what was lost.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft status note for the board',
        intro: 'A colleague has drafted the note.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'A program that nobody installed was found running on the file server at 16:30 on Friday.', why: 'Supported by the call notes.' },
          { id: 'v2', sound: false, text: 'The attack was carried out by a foreign group.', why: 'Unsupported: it comes from a guess in the marketing team.' },
          { id: 'v3', sound: true, text: 'The server has been cut off from the network and its memory and disk are being preserved.', why: 'Supported, if done.' },
          { id: 'v4', sound: false, text: 'No customer data has been taken.', why: 'Not known: the investigation has only just begun.' },
          { id: 'v5', sound: false, text: 'The server will be wiped tonight to be sure it is clean.', why: 'It would destroy the evidence the company needs for every later question.' },
          { id: 'v6', sound: true, text: 'A clean replacement will be built from the Wednesday backup so staff can work on Monday.', why: 'Supported by the backup record.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the status note for the board',
        intro: 'Say what is known, what is not, and what you decided. Say nothing you cannot show.',
        statements: [
          { id: 'r1', correct: true, text: 'A program nobody installed was found running in memory on the main file server at 16:30 on Friday.', why: 'Shown by the call notes.' },
          { id: 'r2', correct: true, text: 'We do not yet know what the program did, what it could reach or whether data left the company.', why: 'An honest statement of the limit.' },
          { id: 'r3', correct: true, text: 'The last verified backup is from Wednesday night, so a clean replacement can be built without the old disk.', why: 'Shown by the backup record.' },
          { id: 'r4', correct: true, text: 'The program runs only in memory, so the evidence has to be captured while the server is running.', why: 'Shown by the contractor.' },
          { id: 'r5', correct: false, text: 'A foreign group is responsible.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'No data has been taken.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Restoring Monday morning is guaranteed whatever the investigation finds.', why: 'Overstated.' },
          { id: 'r8', when: 'both', correct: true, text: 'We captured memory and a disk image first and built a replacement in parallel, so Monday opens on time and the evidence is intact.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'imageonly', correct: true, text: 'We imaged the disk and then rebuilt the server, so the disk is preserved and the memory was lost.', why: 'An honest account.' },
          { id: 'r10', when: 'delay', correct: true, text: 'We kept the server untouched, which kept the evidence and left the business without a file server on Monday.', why: 'An honest account.' },
          { id: 'r11', when: 'rebuild', correct: true, text: 'We wiped and rebuilt the server at 18:00 without imaging it, so we cannot say what the program did or what it took.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Name an owner for technical work, Legal, communications and the decision log, and record every decision with its reason.', why: 'The first job of a lead.' },
          { id: 'a2', correct: true, text: 'Check other servers and accounts for the same program, from the logs, without changing them.', why: 'Finds out whether there is more than one machine.' },
          { id: 'a3', correct: true, text: 'Bring in Legal tonight and agree how the investigation is documented and who is told.', why: 'Starts any clock properly.' },
          { id: 'a4', correct: false, text: 'Wipe and rebuild the server tonight.', why: 'Destroys the evidence.' },
          { id: 'a5', correct: false, text: 'Tell staff that no data has been affected.', why: 'Unsupported.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'dr-senior-exam',
    title: 'Promotion exam: Senior Incident Responder',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A breach two days old, a lawyer, a forensic report that contradicts the logs and a director who wants a name. Decide what to preserve, what to say and what to refuse to say. Silver or better to pass.',
    brief: [
      'Two days ago Contoso found that a customer database had been copied. The contractor\'s preliminary report says the copy happened on Tuesday at 02:10 from an administrator account. The logs on the database server say 02:40. The finance director wants the administrator who owns the account suspended and named in the regulator notification.',
      'You are the incident lead. You will rank what to settle, spend a limited budget of hours, read the evidence, decide how to handle the demand to name someone, and review the draft regulator note.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first to settle at the top. Think about what would be hard to undo.',
        items: [
          { id: 'x1', source: 'Time', priority: 1, text: 'The 30-minute difference between the contractor\'s time and the server\'s log time for the copy.', why: 'A discrepancy in the central fact of the case undermines every statement built on it, and it can be checked now.' },
          { id: 'x2', source: 'The account', priority: 2, text: 'Whether the administrator\'s account was used by the administrator, before anyone is accused.', why: 'An account is not a person. Naming someone without evidence harms them and the investigation.' },
          { id: 'x3', source: 'Evidence', priority: 3, text: 'Keeping the logs and the image safe, with who has handled them.', why: 'The evidence must survive challenge.' },
          { id: 'x4', source: 'Notification', priority: 4, text: 'The regulator notification, due within 72 hours of becoming aware.', why: 'A legal deadline, and it must be honest about what is not known.' },
          { id: 'x5', source: 'Staff', priority: 5, text: 'What to say to staff and customers.', why: 'Important, and it follows what you can actually say.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the deadline',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Reconcile', ideal: 3, text: 'Work out why the contractor\'s time and the server\'s log time differ, by checking both systems\' clocks and settings.', why: 'The most important fact in the case.' },
          { id: 'e2', source: 'The account', ideal: 3, text: 'Check where the administrator\'s account was used from, when, and what else was happening on that account that night.', why: 'Tests whether the owner did it, without accusing anyone.' },
          { id: 'e3', source: 'Notify', ideal: 3, text: 'Draft the regulator notification with Legal: what happened, what is known, what is not and what is being done.', why: 'Has a deadline, and takes care.' },
          { id: 'e4', source: 'Speak', ideal: 1, text: 'Prepare a short holding statement for staff and customers.', why: 'Useful, and quick.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read what the evidence says',
        intro: 'You have the contractor\'s report, the database logs and the account record. Look for what is solid and what is not. Flag only what the sources support.',
        clues: {
          clock: { strength: 'strong', text: 'The database server\'s clock was found to be 30 minutes fast, so its logs show 02:40 for an event that really happened at 02:10.' },
          account: { strength: 'strong', text: 'The administrator\'s account signed in at 02:08 from the company\'s own VPN, from an address that the administrator\'s laptop never uses.' },
          travel: { strength: 'strong', text: 'The administrator was on a flight at the time and has the boarding pass to show it.' },
          reuse: { strength: 'strong', text: 'The same account password appears in a list of credentials from another company\'s breach last year.' },
          press: { strength: 'weak', text: 'The administrator had asked about a pay rise the week before.' },
        },
        artefacts: [
          {
            id: 'report', title: 'The contractor\'s report and the database logs',
            lines: [
              { id: 'f1', type: 'clue', clue: 'clock', text: 'Contractor: "Copy at 02:10 Tuesday, from firewall and VPN logs." Database log: "Export started 02:40." Time service check: "database server offset +30 minutes since 14 March".', note: 'Both are right: the database clock was wrong. A lead resolves the difference before building anything on it.' },
              { id: 'f2', type: 'clue', clue: 'account', text: 'VPN log: "admin.k signed in 02:08 from 192.0.2.88. This device has never been used by this account before."', note: 'The account was used from an unfamiliar device. That is a fact about the account, not the person.' },
              { id: 'f3', type: 'herring', text: 'The administrator has the highest access in the company', note: 'Highest access makes the account valuable, not guilty.' },
              { id: 'f4', type: 'herring', text: 'The administrator was late for the Monday meeting', note: 'Unrelated.' },
              { id: 'f5', type: 'plain', text: 'The database holds about 80,000 customer records', note: 'The scale of what may have been taken.' },
            ],
          },
          {
            id: 'person', title: 'The account record and the administrator',
            lines: [
              { id: 'f6', type: 'clue', clue: 'travel', text: 'HR record: "Administrator K travelled to Lisbon on Monday night, flight departing 22:15 and arriving 01:40 Tuesday." Boarding pass provided.', note: 'The person was at an airport or in the air at the time and later in a hotel. The account was used by someone else.' },
              { id: 'f7', type: 'clue', clue: 'reuse', text: 'Threat intelligence: "Account password hash admin.k found in a published list from an unrelated breach, March of last year."', note: 'An old reused password is a likely way in, and it points away from the owner.' },
              { id: 'f8', type: 'clue', clue: 'press', text: 'Finance director: "He asked about a pay rise last week. That is motive."', note: 'Speculation. A conversation about pay is not evidence of a copy.' },
              { id: 'f9', type: 'herring', text: 'The administrator\'s manager says he has seemed unhappy lately', note: 'An opinion, not evidence.' },
              { id: 'f10', type: 'plain', text: 'The account has no second factor, because it is a legacy service account', note: 'Context: why a stolen password was enough.' },
            ],
          },
        ],
      },
      {
        id: 'name', type: 'decision', title: 'Decide: the demand to name the administrator',
        intro: 'The finance director says: "The account is his. Suspend him today and put his name in the regulator notification." The regulator deadline is in 26 hours.',
        prompt: 'What do you decide?',
        options: [
          { id: 'facts', quality: 3, text: 'Refuse to name anyone, state in the notification what is known (the account was used from an unfamiliar device while the owner was travelling, a password reused from an earlier breach is a likely cause), reset the account and add a second factor, and keep the person informed and supported', set: { facts: true }, consequence: 'The regulator accepts the notification as clear and honest. The administrator is shaken and relieved, and the investigation continues without distraction.' },
          { id: 'hold', quality: 2, text: 'Neither suspend nor name anyone, and leave the account reset until the investigation is complete, so the notification says only that an account was used', set: { hold: true }, consequence: 'Nobody is wrongly accused. The notification is thin, and the regulator asks for more detail within the week.' },
          { id: 'suspend', quality: 1, text: 'Suspend the administrator as a precaution but do not name him to the regulator', set: { suspend: true }, consequence: 'The administrator is treated as a suspect for two days before the evidence clears him. His manager and colleagues learn he has been suspended, and he considers leaving.' },
          { id: 'name', quality: 0, text: 'Suspend him and name him as the person responsible in the notification', set: { name: true }, consequence: 'The boarding pass later shows he was in the air. The regulator is told the company named the wrong person, and the administrator\'s lawyer writes to you.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft regulator note',
        intro: 'A colleague has drafted the notification.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'b1', sound: true, text: 'Customer records were copied from a database on Tuesday at about 02:10, according to firewall logs; the database server\'s own logs showed 02:40 because its clock was 30 minutes fast.', why: 'Supported, and it explains the discrepancy.' },
          { id: 'b2', sound: false, text: 'The copy was made by a member of staff.', why: 'Unsupported: the account was used from an unfamiliar device while its owner was travelling.' },
          { id: 'b3', sound: true, text: 'The account\'s password also appears in a list from an unrelated breach, which is a likely route.', why: 'Supported by the intelligence record, and stated as likely.' },
          { id: 'b4', sound: false, text: 'About 80,000 customers are affected.', why: 'The database holds that many records; how many were copied is not yet known.' },
          { id: 'b5', sound: false, text: 'The administrator had a motive and is responsible.', why: 'Speculation.' },
          { id: 'b6', sound: true, text: 'We will update the regulator as the investigation continues.', why: 'The honest position when the facts are incomplete.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the incident note for the executive team',
        intro: 'Say what is known, what is not and what you decided. Do not name anyone.',
        statements: [
          { id: 'r1', correct: true, text: 'A customer database was copied on Tuesday at about 02:10, using an administrator account that signed in from an unfamiliar device.', why: 'Shown by the VPN log.' },
          { id: 'r2', correct: true, text: 'The 30-minute difference between the contractor\'s time and the database log is explained by a fast clock on the database server.', why: 'Shown by the time service check.' },
          { id: 'r3', correct: true, text: 'The account owner was travelling at the time, so the account was probably used by someone else.', why: 'Shown by the boarding pass.' },
          { id: 'r4', correct: true, text: 'We do not yet know how many records were copied or who used the account.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The administrator copied the database.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'All 80,000 customer records have been stolen.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'A pay dispute was the motive.', why: 'Unsupported.' },
          { id: 'r8', when: 'facts', correct: true, text: 'We declined to name anyone, stated the facts plainly, reset the account and added a second factor, and the regulator accepted the notification.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'hold', correct: true, text: 'We named nobody and kept the notification thin, and the regulator asked for more within the week.', why: 'An honest account.' },
          { id: 'r10', when: 'suspend', correct: true, text: 'We suspended the administrator for two days as a precaution before the evidence cleared him.', why: 'An honest account.' },
          { id: 'r11', when: 'name', correct: true, text: 'We suspended the administrator and named him to the regulator, and later found he was in the air at the time.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Reset the account, add a second factor and check where else the reused password was used.', why: 'Closes the likely route.' },
          { id: 'a2', correct: true, text: 'Correct the server\'s clock, and review time settings across the estate.', why: 'Prevents the same confusion.' },
          { id: 'a3', correct: true, text: 'Preserve the logs and the image with a record of who handled them, and keep the regulator updated.', why: 'Supports every later question.' },
          { id: 'a4', correct: false, text: 'Name the account owner in the notification.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Tell customers no data was taken.', why: 'Unsupported.' },
        ],
      },
    ],
  },
];
