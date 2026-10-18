// Cloud Security Architect simulations. Everything here is fictional. Cloud terms are generic
// ("account", "guardrail", "policy as code") so the lessons apply to any provider.
//
// The tier's themes: turning cloud rules into code that is the same everywhere, handling exceptions so they
// do not become permanent holes, and giving a board an honest answer about risk when a cost-cutting idea
// would remove a control.

const RATINGS = [
  { name: 'Rules on paper', blurb: 'The rules existed in documents and exceptions piled up. Read each stage note: a control that people can switch off is a suggestion.' },
  { name: 'Cloud lead', blurb: 'You built real controls, with gaps in how exceptions, evidence or pressure were handled.' },
  { name: 'Cloud architect', blurb: 'Guardrails in code, exceptions that expire, and honest answers when asked to cut a control.' },
  { name: 'Trusted architect', blurb: 'A cloud estate where the safe way is the default, and a board that can rely on what it is told.' },
];

export const CLOUD_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'guardrails-as-code',
    title: 'Guardrails as code',
    skill: 'identity',
    minutes: 24,
    blurb: 'Contoso\'s cloud rules live in a document and in a hundred hand-made settings. Decide what to turn into code first, check what the exception list is really hiding, spend your budget well and deal with a manager who wants a permanent exemption.',
    brief: [
      'Contoso now has sixty cloud accounts and a thirty-page cloud security standard. Teams follow it in different ways, and there are 180 approved exceptions to its rules. An audit found that the rules a team follows depend on who set up its account.',
      'You are the cloud security architect. You will rank which rules to turn into code first, check what the exception list really shows, spend a limited budget of engineer-weeks, decide how to answer a request for a permanent exemption, and review the summary before it goes to the engineering directors.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the rules to put into code first',
        intro: 'Tap the rules in order, the most important to enforce automatically first. Think about the damage a broken rule can do, how often it is broken, and how hard the check is.',
        items: [
          { id: 'g1', source: 'Public storage', priority: 1, text: 'No storage that holds company data may be readable by the public.', why: 'The classic cloud breach, easy to check by machine and very damaging when broken.' },
          { id: 'g2', source: 'Logging', priority: 2, text: 'Every account must send its audit logs to the central archive, and nobody in the account may stop them.', why: 'Without logs you cannot investigate anything, and the rule is simple to enforce.' },
          { id: 'g3', source: 'Administrator rights', priority: 3, text: 'Nobody may create a user with full administrator rights outside the approved identity system.', why: 'Stops access growing out of sight. Important, and slightly harder to check.' },
          { id: 'g4', source: 'Regions', priority: 4, text: 'Resources may only be created in the two approved regions.', why: 'Reduces surprise costs and unmonitored space. Useful, but with a lower security payoff than the first three.' },
          { id: 'g5', source: 'Naming', priority: 5, text: 'Resources must follow the naming standard.', why: 'Good housekeeping. It does not reduce risk.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what the exception list is really hiding',
        intro: 'You have the exception register and a scan of the accounts. Look for what should shape the plan. Flag only what the records support.',
        clues: {
          expired: { strength: 'strong', text: 'Of 180 exceptions, 74 are past their review date, and 31 have no named owner.' },
          public: { strength: 'strong', text: 'Nine of the exceptions allow public storage, and a scan found customer files in two of those buckets.' },
          drift: { strength: 'strong', text: 'In 23 accounts, the settings no longer match what the template created, because someone changed them by hand.' },
          logs: { strength: 'strong', text: 'Eleven accounts have an exception that lets their own administrators stop audit logging.' },
          size: { strength: 'weak', text: 'Teams say the exception process takes two weeks, so they ask for long exceptions to avoid asking again.' },
        },
        artefacts: [
          {
            id: 'register', title: 'Exception register',
            lines: [
              { id: 'k1', type: 'clue', clue: 'expired', text: 'Exceptions: 180. Past review date: 74 (oldest by 2 years). No named owner: 31. Average requested length: "permanent"', note: 'The register is full of exceptions that nobody reviews and nobody owns.' },
              { id: 'k2', type: 'clue', clue: 'public', text: 'Exceptions to the public-storage rule: 9. Scan of those buckets: 2 contain files that look like customer data (invoices, contact lists)', note: 'A real exposure behind a quiet exception, and one that the rules were meant to stop.' },
              { id: 'k3', type: 'clue', clue: 'logs', text: 'Exceptions that allow account administrators to disable audit logging: 11. Reason given in 7 of them: "performance"', note: 'The most powerful accounts can switch off the evidence. Performance is rarely a good reason.' },
              { id: 'k4', type: 'herring', text: 'Exceptions to the naming standard: 52', note: 'A large number with no security consequence.' },
              { id: 'k5', type: 'plain', text: 'The exception form has 14 questions', note: 'Part of why teams avoid it.' },
            ],
          },
          {
            id: 'scan', title: 'Account scan and team feedback',
            lines: [
              { id: 'k6', type: 'clue', clue: 'drift', text: 'Accounts whose live settings differ from the approved template: 23 of 60. Typical difference: a rule switched off by hand, never recorded', note: 'Hand-made changes are how rules disappear. Code that re-applies the template would undo them.' },
              { id: 'k7', type: 'clue', clue: 'size', text: 'Team survey: "Exceptions take about two weeks, so we ask for permanent ones just in case"', note: 'A process problem that explains the long exceptions. It is a smaller cause than the missing enforcement.' },
              { id: 'k8', type: 'herring', text: 'Number of cloud accounts created this year: 14', note: 'Context for growth.' },
              { id: 'k9', type: 'herring', text: 'Cloud spend rose 22% year on year', note: 'A cost figure, not a security one.' },
              { id: 'k10', type: 'plain', text: 'The standard has 41 rules, 6 of which can be checked by machine today', note: 'The room for improvement.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next quarter.',
        items: [
          { id: 'e1', source: 'Enforcement', ideal: 4, text: 'Turn the three highest-value rules into code that blocks the action and re-applies the template, starting in audit mode.', why: 'The core of the work, and it needs care to avoid stopping teams.' },
          { id: 'e2', source: 'Exceptions', ideal: 3, text: 'Review every exception: end the public-storage and logging ones, give every other an owner and an expiry, and make the form short and quick.', why: 'Brings the worst holes back under control and removes the reason teams ask for permanent ones.' },
          { id: 'e3', source: 'Drift', ideal: 2, text: 'Detect and correct hand-made changes in the 23 drifted accounts.', why: 'Stops rules quietly disappearing again.' },
          { id: 'e4', source: 'Reporting', ideal: 1, text: 'Report on rule coverage and exception age to the directors every month.', why: 'Keeps attention on the right numbers, and is quick once the rest exists.' },
        ],
      },
      {
        id: 'exemption', type: 'decision', title: 'Decide: a permanent exemption',
        intro: 'The head of the data team says: "Our research account needs a permanent exemption from the public-storage rule. We share datasets with universities, and your process takes two weeks every time. Just give us the exemption."',
        prompt: 'What do you do?',
        options: [
          { id: 'design', quality: 3, text: 'Do not grant a permanent exemption. Give the team a safe way to share: a dedicated sharing account with no company data, a controlled sharing method with expiry, and a fast route (two days) to approve each dataset, plus an owner and a yearly review', set: { design: true }, consequence: 'The team can share what they need within two days. No customer data sits in public storage, and the new route is used by two other teams.' },
          { id: 'timebox', quality: 2, text: 'Grant the exemption for six months with a named owner and a promise to find a better way', set: { timebox: true }, consequence: 'The team is happy. Six months pass, the owner moves on, and the exception becomes permanent.' },
          { id: 'refuse', quality: 1, text: 'Refuse and tell them to follow the existing two-week process', set: { refuse: true }, consequence: 'The team moves its sharing to a personal cloud account that the company cannot see.' },
          { id: 'grant', quality: 0, text: 'Grant it permanently, because the data team is trusted', set: { grant: true }, consequence: 'A year later, a dataset that included staff details is found in the public bucket.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the directors',
        intro: 'A colleague has drafted the summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'There are 180 exceptions to the cloud rules, 74 past their review date and 31 with no named owner.', why: 'Supported by the register.' },
          { id: 'p2', sound: false, text: 'Customer data has been stolen from the public buckets.', why: 'Unsupported. Files that look like customer data are exposed. The records do not show who has read them.' },
          { id: 'p3', sound: false, text: 'A written standard is enough to keep the cloud safe.', why: 'In 23 accounts, settings have drifted away from the standard.' },
          { id: 'p4', sound: true, text: 'Two of the buckets with public-storage exceptions contain files that look like customer data.', why: 'Supported by the scan.' },
          { id: 'p5', sound: false, text: 'The teams are deliberately avoiding the rules.', why: 'Unsupported and unfair. The two-week process explains why they ask for permanent exceptions.' },
          { id: 'p6', sound: true, text: 'Putting the highest-value rules into code that re-applies the template would undo hand-made changes automatically.', why: 'Well-founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the directors',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Of 180 exceptions, 74 are past their review date and 31 have no owner, and nine allow public storage.', why: 'Shown by the register.' },
          { id: 'r2', correct: true, text: 'Two buckets covered by those exceptions contain files that look like customer data.', why: 'Shown by the scan.' },
          { id: 'r3', correct: true, text: 'In 23 of 60 accounts, live settings no longer match the approved template.', why: 'Shown by the scan.' },
          { id: 'r4', correct: true, text: 'It is not yet known whether anyone has read the exposed files, and the access logs for them are being checked.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The company has been breached through these buckets.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The exception process should be abolished.', why: 'Not supported. It should be faster and exceptions should expire.' },
          { id: 'r7', correct: false, text: 'Automated rules will remove all cloud risk.', why: 'Overstated.' },
          { id: 'r8', when: 'design', correct: true, text: 'The data team was offered a safe sharing route with a two-day approval, in place of a permanent exemption, and two other teams have adopted it.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'timebox', correct: true, text: 'A six-month exemption was granted, and it became permanent when its owner moved on.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'The data team\'s sharing request was refused and the team moved its sharing to a personal account outside the company\'s view.', why: 'An honest account of the cost of refusing.' },
          { id: 'r11', when: 'grant', correct: true, text: 'A permanent exemption was granted, and a dataset with staff details was later found in public storage.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Check the access logs for the two exposed buckets, close them, and tell the data protection officer if customer data was read.', why: 'Deals with the live exposure.' },
          { id: 'a2', correct: true, text: 'Put the public-storage, logging and administrator rules into code, in audit mode first, and re-apply the template to drifted accounts.', why: 'Makes the rules hold without relying on people.' },
          { id: 'a3', correct: true, text: 'Give every exception an owner and an expiry, shorten the form and speed up approval to two days.', why: 'Stops exceptions becoming permanent and removes the reason for long ones.' },
          { id: 'a4', correct: false, text: 'Ban all exceptions.', why: 'Some are legitimate. The problem is that they never expire.' },
          { id: 'a5', correct: false, text: 'Wait for the next audit to review the list.', why: 'The exposure is live now.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'cloud-architect-exam',
    title: 'Promotion exam: Cloud Security Architect',
    skill: 'identity',
    minutes: 28,
    blurb: 'A rival\'s breach, a board that asks "are we safe?" and a finance idea that would remove a control. Silver or better to pass.',
    brief: [
      'This is your promotion exam. A competitor has just been breached through its cloud account, and it has been in the news for three days. Contoso\'s board has asked you: "Are we safe?" At the same time, the finance director has proposed merging all sixty cloud accounts into three, to save money.',
      'The case tests the role: ranking risks across the whole estate, spending limited effort, finding what is really true, standing firm on a cost idea that removes a control, and answering a board honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks the board should hear about',
        intro: 'A first review found five risks. Rank them by the damage they could do to the company, highest first.',
        items: [
          { id: 'x1', source: 'Recovery', priority: 1, text: 'Backups of the main production data are stored in the same account and can be deleted by the same administrators.', why: 'If an attacker takes the account, they can destroy both the data and the backups. It is the difference between an incident and a catastrophe.' },
          { id: 'x2', source: 'Break glass', priority: 2, text: 'The emergency administrator accounts have never been tested, and nobody is sure they still work.', why: 'In a crisis, the way back in may not exist. It is a quiet failure that shows up at the worst time.' },
          { id: 'x3', source: 'Third party', priority: 3, text: 'Eight suppliers have standing administrator access to some accounts, and nobody reviews it.', why: 'A real route in, which the competitor\'s breach resembles. Important, and quicker to fix than the first two.' },
          { id: 'x4', source: 'Detection', priority: 4, text: 'Alerts on unusual cloud activity exist for only 40% of accounts.', why: 'Slower detection. A serious gap, but it follows after the controls that decide whether an attack can succeed.' },
          { id: 'x5', source: 'Tags', priority: 5, text: 'Many resources have no cost-centre tag.', why: 'A finance irritation, not a risk.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next two months.',
        items: [
          { id: 'y1', source: 'Recovery', ideal: 3, text: 'Put backups in a separate, locked account that production administrators cannot delete from, and test a restore.', why: 'The most valuable protection against a catastrophic loss.' },
          { id: 'y2', source: 'Break glass', ideal: 2, text: 'Create tested emergency access that does not depend on the main identity system, and rehearse using it.', why: 'Quick to build, and essential in a crisis.' },
          { id: 'y3', source: 'Suppliers', ideal: 3, text: 'End standing supplier access, replace it with approved time-limited access, and review all eight.', why: 'A broad piece of work across eight suppliers and many accounts.' },
          { id: 'y4', source: 'Detection', ideal: 2, text: 'Extend alerts for unusual activity to every account, starting with production.', why: 'Speeds up detection once the controls above are in place.' },
        ],
      },
      {
        id: 'reality', type: 'evidence', title: 'Find out what is really true before answering the board',
        intro: 'You have the results of a rapid check of the production accounts and the finance director\'s proposal. Look for what matters. Flag only what the records support.',
        clues: {
          backups: { strength: 'strong', text: 'The backups of the main production database are in the same account and the production administrators can delete them.' },
          bg: { strength: 'strong', text: 'The emergency accounts have not been used in 22 months, and a test sign-in on Tuesday failed.' },
          merge: { strength: 'strong', text: 'The finance proposal puts production, the audit-log archive and the backups into the same account to save cost.' },
          third: { strength: 'strong', text: 'Eight suppliers hold administrator roles with no expiry, and two have not been used in over a year.' },
          news: { strength: 'weak', text: 'The competitor\'s breach started with a stolen supplier credential, according to press reports.' },
        },
        artefacts: [
          {
            id: 'check', title: 'Rapid check of production accounts',
            lines: [
              { id: 'z1', type: 'clue', clue: 'backups', text: 'prod-data account: database snapshots stored in the same account. Delete permission: production administrators (12 people)', note: 'Anyone who takes a production administrator can erase the data and its backups together.' },
              { id: 'z2', type: 'clue', clue: 'bg', text: 'Emergency accounts: 2. Last used: 22 months ago. Test sign-in Tuesday: failed (password expired, second factor device not found)', note: 'The emergency way in does not work. If the main identity system fails, nobody can get in.' },
              { id: 'z3', type: 'clue', clue: 'third', text: 'Supplier roles: 8, all "AdministratorAccess", no expiry. Unused for over 12 months: 2', note: 'Standing, powerful access for people outside the company that nobody reviews.' },
              { id: 'z4', type: 'herring', text: 'All production accounts are in an approved region', note: 'Good, and unrelated to what the board is asking.' },
              { id: 'z5', type: 'herring', text: 'Cloud bill: £84,000 last month', note: 'A number with no bearing on risk.' },
            ],
          },
          {
            id: 'finance', title: 'The finance proposal and the press report',
            lines: [
              { id: 'z6', type: 'clue', clue: 'merge', text: 'Proposal: "Consolidate 60 accounts into 3: Production, Corporate, Everything Else. Move the audit-log archive and backups into Production to remove duplicate charges. Estimated saving: £9,000 a month"', note: 'The saving is real, and the proposal removes the separation that protects logs and backups from production administrators.' },
              { id: 'z7', type: 'clue', clue: 'news', text: 'Press: "The company says attackers used a credential belonging to a supplier to reach its cloud account"', note: 'A pattern Contoso should check. It does not prove Contoso is exposed in the same way.' },
              { id: 'z8', type: 'herring', text: 'Competitor\'s share price fell 8%', note: 'Interesting, and not evidence about Contoso.' },
              { id: 'z9', type: 'herring', text: 'The finance director has an MBA', note: 'No bearing.' },
              { id: 'z10', type: 'plain', text: 'Board meeting: Thursday', note: 'The time available.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the finance director\'s consolidation',
        intro: 'The finance director says: "We can save £108,000 a year by merging the accounts. The board will want savings after this news. Put the logs and backups in with Production and tell them it is simpler."',
        prompt: 'What do you do?',
        options: [
          { id: 'staged', quality: 3, text: 'Support consolidating the many small accounts that hold no sensitive data, which captures most of the saving, and keep production, the audit-log archive and the backups in separate accounts, explaining that the separation is what lets Contoso recover from an attack like the competitor\'s', set: { staged: true }, consequence: 'About two thirds of the saving is achieved. The board hears a clear reason for keeping three accounts apart and approves the plan.' },
          { id: 'defer', quality: 2, text: 'Agree to merge everything but promise to add extra controls inside the merged account later', set: { defer: true }, consequence: 'The saving is made. The controls inside the account never fully replace the separation, and the backups can still be deleted by the same administrators.' },
          { id: 'refuse', quality: 1, text: 'Reject consolidation altogether', set: { refuse: true }, consequence: 'You lose the saving and the finance director\'s goodwill, and ordinary small accounts continue to cost money for no benefit.' },
          { id: 'agree', quality: 0, text: 'Agree, because savings matter after the news and the board will like it', set: { agree: true }, consequence: 'Months later, an attacker who takes a production administrator deletes the data and the backups in the same afternoon.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft answer to the board',
        intro: 'A colleague has drafted an answer to "Are we safe?"',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Production backups are stored in the same account and can be deleted by production administrators.', why: 'Supported by the check.' },
          { id: 'j2', sound: false, text: 'We are not affected, because our suppliers are all reputable.', why: 'Unsupported. Eight suppliers hold unreviewed administrator access.' },
          { id: 'j3', sound: false, text: 'We were breached in the same way as the competitor.', why: 'Unsupported. There is no evidence of a breach.' },
          { id: 'j4', sound: true, text: 'The emergency accounts have not been tested for 22 months and a test sign-in failed on Tuesday.', why: 'Supported by the check.' },
          { id: 'j5', sound: false, text: 'Cost savings and security are in direct conflict.', why: 'Overstated. Consolidating accounts that hold no sensitive data saves money without removing controls.' },
          { id: 'j6', sound: true, text: 'The work needed to recover from a similar attack is mostly practical: separate locked backups, tested emergency access and reviewed supplier access.', why: 'A fair, constructive statement.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your answer for the board',
        intro: 'Your own answer. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'Production backups are in the same account and can be deleted by the same administrators who run production.', why: 'Shown by the check.' },
          { id: 'q2', correct: true, text: 'The emergency access accounts have not been used for 22 months and a test failed.', why: 'Shown by the check.' },
          { id: 'q3', correct: true, text: 'Eight suppliers hold standing administrator access that nobody reviews, a pattern similar to what was reported at the competitor.', why: 'Shown by the check and the press report.' },
          { id: 'q4', correct: true, text: 'We have found no evidence that Contoso has been breached, and we are checking supplier access logs to be sure.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'Contoso is completely safe.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'Contoso is certain to be attacked in the same way.', why: 'Unsupported.' },
          { id: 'q7', correct: false, text: 'The finance director\'s proposal is reckless.', why: 'A judgement about a colleague.' },
          { id: 'q8', when: 'staged', correct: true, text: 'Small accounts without sensitive data will be consolidated for most of the saving, and production, the audit logs and the backups will stay in separate accounts so that Contoso can recover from an attack.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'defer', correct: true, text: 'All accounts were merged with extra controls promised later, and the backups can still be deleted by production administrators.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'Consolidation was rejected altogether, so the saving on low-risk accounts was lost.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'Logs and backups were merged into Production for the saving, and a later attack deleted the data and the backups together.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Move backups to a separate locked account, and test a full restore.', why: 'The strongest protection against a catastrophic loss.' },
          { id: 'a2', correct: true, text: 'Fix and test the emergency access accounts, and rehearse using them.', why: 'Makes sure there is a way in during a crisis.' },
          { id: 'a3', correct: true, text: 'End standing supplier access, review each supplier, and check the access logs for unusual use.', why: 'Closes the route that the competitor suffered through.' },
          { id: 'a4', correct: false, text: 'Reassure the board and take no action until the next audit.', why: 'The exposures are real now.' },
          { id: 'a5', correct: false, text: 'Merge all accounts to save money and add controls later.', why: 'Removes the separation that protects recovery.' },
        ],
      },
    ],
  },
];
