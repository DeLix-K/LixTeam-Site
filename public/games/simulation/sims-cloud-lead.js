// Senior Cloud Security simulations. Everything here is fictional. Cloud terms are generic ("account",
// "guardrail", "audit log archive") on purpose, so the lessons apply to any provider.
//
// The tier's themes: designing for many accounts at once, guardrails that are rolled out safely, and
// holding the line on logging and separation when someone wants to save money or time.

const RATINGS = [
  { name: 'Sprawl', blurb: 'Accounts, access and logs grew without a plan, or controls were rushed in and broke things. In the cloud at scale, defaults are the design.' },
  { name: 'Tidying up', blurb: 'You fixed real problems, with gaps in priorities, evidence or rollout.' },
  { name: 'Cloud lead', blurb: 'Sound priorities, guardrails matched to real risk, and a rollout teams can live with.' },
  { name: 'Cloud architect', blurb: 'A structure that stays safe as it grows, effort spent where it counts, and the judgement to hold a line.' },
];

export const CLOUD_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'landing-zone',
    title: 'Forty accounts, no plan',
    skill: 'identity',
    minutes: 22,
    blurb: 'Contoso has grown to forty cloud accounts, each set up by whoever needed one. Work out what to fix first, spend your effort well and roll out guardrails without stopping the teams.',
    brief: [
      'Contoso now has forty cloud accounts. Teams created them as needed, each with its own settings, its own administrators and its own idea of logging. There is no central view of any of it.',
      'You are the senior cloud security engineer. You will rank what to fix first, check what the account records show, spend a limited budget of engineer-weeks, decide how to introduce central guardrails, and review the plan before it goes to the engineering directors.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the account-level problems',
        intro: 'Tap the problems in order, the most serious first. Think about how much damage it could do across all forty accounts, how likely it is to be used, and how hard it is to fix.',
        items: [
          { id: 'l1', source: 'Logging', priority: 1, text: 'Audit logs are kept inside each account, where anyone with administrator rights there can switch them off or delete them. Nine accounts have no logging at all.', why: 'An intruder with administrator rights can erase the evidence. Without central, protected logs you cannot investigate anything reliably.' },
          { id: 'l2', source: 'Separation', priority: 2, text: 'Production, test and personal-experiment workloads share the same accounts in 14 cases.', why: 'A mistake or a compromise in a test environment reaches production data. Separating them limits how far a problem can spread.' },
          { id: 'l3', source: 'Access', priority: 3, text: 'Each account has its own local administrators, with no link to the company\'s people directory. 31 belong to people who have since left.', why: 'Real, easily abused access that nobody is watching. It is a large clean-up, but each item is simple.' },
          { id: 'l4', source: 'Guardrails', priority: 4, text: 'There are no central rules about what any account may do. Teams can switch on any region or service and make storage public.', why: 'Permits mistakes at scale. Valuable, but most of it is prevention of future problems rather than an exposure today.' },
          { id: 'l5', source: 'Tagging', priority: 5, text: 'Resource tags for owner and cost centre are missing on about half of all resources.', why: 'Untidy and annoying for finance. It exposes nothing.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what the account records show',
        intro: 'You have the account inventory and the logging report. Look for the facts that decide the plan. Flag only what the records support.',
        clues: {
          nocentral: { strength: 'strong', text: 'No account sends its audit logs to a central, protected location, and 9 accounts have logging switched off.' },
          mixed: { strength: 'strong', text: 'Fourteen accounts hold both production and test workloads, including one with live customer data and an experimental public web server.' },
          leavers: { strength: 'strong', text: '31 local administrator accounts belong to people who have left, and 6 of them have been used in the last 30 days.' },
          noguard: { strength: 'strong', text: 'Nothing prevents any account from making storage public or starting resources in any region.' },
          tags: { strength: 'weak', text: 'About half of all resources have no owner tag.' },
        },
        artefacts: [
          {
            id: 'inventory', title: 'Account inventory',
            lines: [
              { id: 'm1', type: 'clue', clue: 'mixed', text: 'Account prod-web-2 (live customer data): also hosts "exp-demo" public web server created by a contractor 5 months ago', note: 'An experiment next to customer data. The experiment is the weak point that exposes the data.' },
              { id: 'm2', type: 'clue', clue: 'noguard', text: 'Organisation policy: none. Public storage allowed in 40 of 40 accounts. Regions enabled: all', note: 'There are no central limits at all. Every account is one click from a serious mistake.' },
              { id: 'm3', type: 'clue', clue: 'tags', text: 'Owner tag present on 53% of resources', note: 'Poor housekeeping. It makes work harder but is not a security exposure.' },
              { id: 'm4', type: 'herring', text: 'Total monthly spend across all accounts: £84,000', note: 'A number with no bearing on the priorities.' },
              { id: 'm5', type: 'plain', text: 'Accounts created in the last year: 17', note: 'Context. Growth is why central design is needed now.' },
            ],
          },
          {
            id: 'logs', title: 'Logging and access report',
            lines: [
              { id: 'm6', type: 'clue', clue: 'nocentral', text: 'Audit logging: on in 31 accounts, off in 9. Central log archive: none. Log deletion: allowed by local administrators in all 40', note: 'The evidence can be switched off or removed by exactly the people an attacker would become.' },
              { id: 'm7', type: 'clue', clue: 'leavers', text: 'Local administrators: 112. Linked to the directory: 81. Belonging to leavers: 31, of whom 6 signed in during the last 30 days', note: 'People who have left are still signing in to production accounts. Active, current risk.' },
              { id: 'm8', type: 'herring', text: 'Password policy for local administrators: 12 characters minimum', note: 'A reasonable rule that does not help with accounts nobody has removed.' },
              { id: 'm9', type: 'herring', text: 'Average accounts per team: 1.9', note: 'Interesting for planning. No finding.' },
              { id: 'm10', type: 'plain', text: 'Central identity directory with multi-factor sign-in exists and is used for company systems', note: 'Something to build on. It is not yet connected to the cloud accounts.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next quarter.',
        items: [
          { id: 'n1', source: 'Logging', ideal: 3, text: 'Create a protected log archive account and send every account\'s audit logs to it, with deletion blocked.', why: 'The most important foundation. Without it nothing else can be investigated.' },
          { id: 'n2', source: 'Access', ideal: 3, text: 'Connect every account to the company directory, remove leavers and replace local administrators with directory groups.', why: 'The active risk, and a real piece of work across forty accounts.' },
          { id: 'n3', source: 'Separation', ideal: 2, text: 'Move production data out of the shared accounts into dedicated production accounts, starting with prod-web-2.', why: 'Stops a test mistake reaching customer data. It takes care, so it deserves a proper share.' },
          { id: 'n4', source: 'Guardrails', ideal: 2, text: 'Set central rules that block public storage and unused regions, introduced in audit mode first.', why: 'Prevents the commonest mistakes, and can be done quickly once logging and access are in hand.' },
        ],
      },
      {
        id: 'rollout', type: 'decision', title: 'Decide: how to introduce the guardrails',
        intro: 'Several teams are nervous. One engineering manager says: "Switch the guardrails on for everyone on Monday, or do not touch my accounts."',
        prompt: 'What do you do?',
        options: [
          { id: 'staged', quality: 3, text: 'Switch the rules on in audit mode in every account this week to see what would be blocked, fix the real conflicts with teams, then enforce them in waves, starting with the accounts that hold customer data', set: { staged: true }, consequence: 'The audit shows only three real conflicts, which are fixed before enforcement. The first wave goes in without an outage and the manager sees evidence rather than a promise.' },
          { id: 'monday', quality: 2, text: 'Enforce everywhere on Monday as asked, and fix anything that breaks', set: { monday: true }, consequence: 'It is quick and it breaks a nightly data job and a release. Two teams escalate and one asks for an exemption that stays.' },
          { id: 'optin', quality: 1, text: 'Let each team opt in when it is ready', set: { optin: true }, consequence: 'Six months later nine accounts have opted in. The ones holding customer data have not.' },
          { id: 'skip', quality: 0, text: 'Leave the manager\'s accounts out entirely and enforce everywhere else', set: { skip: true }, consequence: 'The exempt accounts are the ones with the most exposure, and others quickly ask for the same treatment.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the engineering directors',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Audit logs are kept inside each account, so a local administrator can switch them off or delete them, and nine accounts have no logging at all.', why: 'Supported by the logging report.' },
          { id: 'p2', sound: false, text: 'The company has already been breached through one of the 31 leavers\' accounts.', why: 'Unsupported. Six were used recently, but nothing shows who used them or why.' },
          { id: 'p3', sound: false, text: 'Having a strong password policy makes the leavers\' accounts safe.', why: 'A policy does nothing about accounts that should have been removed.' },
          { id: 'p4', sound: true, text: 'A public experiment shares an account with live customer data in prod-web-2.', why: 'Supported by the inventory.' },
          { id: 'p5', sound: false, text: 'Missing tags are the biggest security risk in the estate.', why: 'Tags are housekeeping. The biggest risks are the logs, the leavers and the shared accounts.' },
          { id: 'p6', sound: true, text: 'A central log archive with deletion blocked is the foundation for investigating anything else.', why: 'Well founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the engineering directors',
        intro: 'Your own summary. Include what the records support and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Audit logs stay inside each account where local administrators can remove them, and nine accounts have no logging.', why: 'Shown by the logging report.' },
          { id: 'r2', correct: true, text: '31 local administrator accounts belong to leavers and six of them were used in the last 30 days.', why: 'Shown by the access report.' },
          { id: 'r3', correct: true, text: 'Fourteen accounts mix production and test, including prod-web-2, where a public experiment sits next to customer data.', why: 'Shown by the inventory.' },
          { id: 'r4', correct: true, text: 'Nothing in the records shows that any of this has been misused, and without central logs that cannot be confirmed either way.', why: 'An honest statement of what is and is not known.' },
          { id: 'r5', correct: false, text: 'Customer data has been stolen from prod-web-2.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The teams have been careless.', why: 'A judgement about people. The structure allowed this to happen.' },
          { id: 'r7', correct: false, text: 'Guardrails will stop all cloud mistakes.', why: 'Overstated. They prevent the commonest ones.' },
          { id: 'r8', when: 'staged', correct: true, text: 'Guardrails ran in audit mode first, three real conflicts were fixed, and enforcement is going in by waves, customer-data accounts first.', why: 'An accurate record of a sound approach.' },
          { id: 'r9', when: 'monday', correct: true, text: 'Guardrails were enforced everywhere on the first Monday, which broke a nightly job and a release and led to one lasting exemption.', why: 'An honest account of the cost of rushing.' },
          { id: 'r10', when: 'optin', correct: true, text: 'Teams opted in at their own pace, and the accounts with customer data have not yet adopted the rules.', why: 'An honest account of what opt-in delivered.' },
          { id: 'r11', when: 'skip', correct: true, text: 'The accounts of one manager were left out of the guardrails, and they are the ones with the most exposure.', why: 'An honest record of a gap.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Create a protected central log archive and send every account\'s audit logs to it, with deletion blocked.', why: 'The foundation for everything else.' },
          { id: 'a2', correct: true, text: 'Connect accounts to the company directory, remove leavers\' access and replace local administrators with directory groups.', why: 'Closes the active access risk.' },
          { id: 'a3', correct: true, text: 'Separate production from test accounts, starting with customer data, and introduce central guardrails in audit mode first.', why: 'Limits how far a mistake can spread, without stopping teams.' },
          { id: 'a4', correct: false, text: 'Close forty accounts and start again.', why: 'Out of proportion and disruptive.' },
          { id: 'a5', correct: false, text: 'Wait for a breach to justify the budget.', why: 'The exposure is already real.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'cloud-senior-exam',
    title: 'Promotion exam: Senior Cloud Security Engineer',
    skill: 'identity',
    minutes: 28,
    blurb: 'A cost-saving programme, a request to remove logging and an account nobody can explain. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso\'s finance director has started a cost-saving programme and asked every team to cut cloud spend by 15% within a month. A review has also found spending in accounts that nobody on the platform team can explain.',
      'The case tests the role: ranking risks, spending limited effort, finding what is really going on, standing firm when someone wants to remove a control to save money, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the findings from the spend review',
        intro: 'The spend review found five things. Rank them by the risk they pose to the company, highest first.',
        items: [
          { id: 'x1', source: 'Unknown account', priority: 1, text: 'An account called "temp-analytics" is spending £6,000 a month. It is not in the inventory, and it can reach the production customer database.', why: 'Nobody owns an account that can reach customer data. It could be an intruder, a forgotten project or a shortcut, and each is serious.' },
          { id: 'x2', source: 'Logging', priority: 2, text: 'The central audit log archive costs £9,000 a month and the finance director proposes deleting logs older than 14 days.', why: 'Fourteen days is too short to investigate many incidents and may break legal and customer commitments. It would also remove the evidence needed for the first finding.' },
          { id: 'x3', source: 'Idle machines', priority: 3, text: 'About 60 large virtual machines in test accounts have run unused for four months.', why: 'Wasted money and a larger attack surface, but no direct exposure. It is a safe, easy saving.' },
          { id: 'x4', source: 'Data copies', priority: 4, text: 'Three full copies of last year\'s production database sit in cheap storage accounts used by analysts.', why: 'Customer data in more places than it needs to be. A real concern, and one to deal with after the first two.' },
          { id: 'x5', source: 'Reservations', priority: 5, text: 'Reserved capacity has not been renewed on several steady services, so the company pays the higher rate.', why: 'Costs money. It carries no security risk.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'Spend all ten days across these four pieces of work this month.',
        items: [
          { id: 'y1', source: 'Unknown account', ideal: 4, text: 'Find out who made and uses temp-analytics, what it has accessed, and whether anything was taken. Contain it if it is not legitimate.', why: 'The most urgent and the most uncertain, so it needs the most time.' },
          { id: 'y2', source: 'Logging', ideal: 3, text: 'Keep the log archive and cut its cost by moving older logs to cheaper storage and compressing them, keeping at least a year.', why: 'Saves money without losing the evidence.' },
          { id: 'y3', source: 'Idle machines', ideal: 2, text: 'Shut down and delete unused machines in test accounts after checking owners.', why: 'A safe, quick saving that also reduces exposure.' },
          { id: 'y4', source: 'Data copies', ideal: 1, text: 'List and remove unneeded copies of production data, and agree where analysts may work.', why: 'Worthwhile, and lower in urgency than the rest.' },
        ],
      },
      {
        id: 'account', type: 'evidence', title: 'Find out what temp-analytics really is',
        intro: 'You have the records for the unknown account. Check what they show. Flag only what the records support.',
        clues: {
          created: { strength: 'strong', text: 'The account was created 7 weeks ago by a user whose directory entry was disabled 3 weeks before that.' },
          reach: { strength: 'strong', text: 'It holds a role that lets it read the production customer database, and it did so on 9 nights last month.' },
          outside: { strength: 'strong', text: 'Its sign-ins come from addresses outside Contoso and outside the countries where staff work.' },
          nolog: { strength: 'strong', text: 'The account was set up so that its own audit logs go to a bucket inside the account, not to the central archive.' },
          size: { strength: 'weak', text: 'Its spend rose sharply in the last two weeks.' },
        },
        artefacts: [
          {
            id: 'meta', title: 'Account records',
            lines: [
              { id: 'z1', type: 'clue', clue: 'created', text: 'Created: 7 weeks ago by the directory user f.hart. That user was disabled 10 weeks ago, when they left the company', note: 'The account could not have been created by that person legitimately. A leaver\'s credentials were used.' },
              { id: 'z2', type: 'clue', clue: 'nolog', text: 'Audit log destination: bucket "ta-logs" inside the account. Central archive: not configured', note: 'The account was built to keep its activity out of sight.' },
              { id: 'z3', type: 'herring', text: 'Account tag: "project: analytics-pilot"', note: 'A tag anyone can add. It proves nothing about the account\'s purpose.' },
              { id: 'z4', type: 'herring', text: 'Billing contact: analytics-team@contoso.example (mailbox unmonitored)', note: 'An unmonitored mailbox explains why nobody saw the bills, not who is behind them.' },
            ],
          },
          {
            id: 'activity', title: 'Activity and sign-ins',
            lines: [
              { id: 'z5', type: 'clue', clue: 'reach', text: 'Role analytics-reader: read access to prod-customers database. Queries on 9 of the last 30 nights, between 02:00 and 03:00', note: 'Regular reads of customer data at night by an account nobody owns.' },
              { id: 'z6', type: 'clue', clue: 'outside', text: 'Sign-ins (last 30 days): 41, all from 198.51.100.0/24 (a hosting provider); no sign-in from Contoso addresses', note: 'The person using it is not on the company network.' },
              { id: 'z7', type: 'clue', clue: 'size', text: 'Spend: £400 in week 1 of last month, £2,900 in week 4', note: 'The spending has grown, which suggests more activity. It does not say what the activity is.' },
              { id: 'z8', type: 'herring', text: 'Account region: eu-west, the same as production', note: 'A normal choice with no bearing on who made it.' },
              { id: 'z9', type: 'herring', text: 'The account uses the standard instance types', note: 'No finding.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the finance director wants the logs cut',
        intro: 'The finance director says: "The log archive is the second biggest line on the bill. Delete everything older than 14 days. We have never looked at it anyway, and the programme needs this saving today."',
        prompt: 'What do you do?',
        options: [
          { id: 'protect', quality: 3, text: 'Refuse to shorten retention, explain that the logs are exactly what lets you investigate temp-analytics, and offer a real saving instead by moving older logs to cheaper storage, which cuts about 60% of the cost while keeping a year', set: { protect: true }, consequence: 'The finance director gets most of the saving and an explanation they can repeat to the board. The investigation has the evidence it needs.' },
          { id: 'compromise', quality: 2, text: 'Agree to 90 days instead of 14, and ask the DPO whether that meets legal commitments', set: { compromise: true }, consequence: 'It saves more than you offered, and costs you the oldest evidence. The first sign-in by the unknown account is two days older than the new limit.' },
          { id: 'defer', quality: 1, text: 'Ask for a month to think about it', set: { defer: true }, consequence: 'The director goes to the platform team directly and the logs are cut in the meantime.' },
          { id: 'agree', quality: 0, text: 'Agree. Finance has authority over the budget', set: { agree: true }, consequence: 'The logs older than 14 days are deleted, including the records of when the unknown account was created and first used.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft update for the leadership team',
        intro: 'A colleague has drafted the update.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'An account nobody owns was created by a leaver\'s credentials and has read the production customer database on nine nights.', why: 'Supported by the account records.' },
          { id: 'j2', sound: false, text: 'Customer data has been stolen.', why: 'Unsupported. You know it was read, not what happened to it afterwards.' },
          { id: 'j3', sound: false, text: 'The account is a forgotten internal analytics project.', why: 'Contradicted by the leaver\'s credentials, the outside sign-ins and the hidden logging.' },
          { id: 'j4', sound: true, text: 'The account was set up to keep its own audit logs inside itself rather than in the central archive.', why: 'Supported by the records.' },
          { id: 'j5', sound: false, text: 'The finance director is putting the company at risk.', why: 'A judgement about a colleague. State what shortening retention would lose.' },
          { id: 'j6', sound: true, text: 'Moving old logs to cheaper storage can save most of the archive\'s cost without losing evidence.', why: 'A sound alternative.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the leadership team',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'An unowned account created with a leaver\'s credentials can read the production customer database and did so on nine nights last month.', why: 'Shown by the records.' },
          { id: 'q2', correct: true, text: 'The account is signed in to from outside the company and was set up to keep its logs out of the central archive.', why: 'Shown by the records.' },
          { id: 'q3', correct: true, text: 'It is not yet known what the account did with the data it read.', why: 'An honest statement of the limit.' },
          { id: 'q4', correct: true, text: 'Savings are available from idle machines and from moving old logs to cheaper storage.', why: 'An accurate, positive finding.' },
          { id: 'q5', correct: false, text: 'Contoso has been the victim of a major data theft.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'The leaver is responsible.', why: 'Unsupported. You know their credentials were used, not who used them.' },
          { id: 'q7', correct: false, text: 'The cost-saving programme should stop.', why: 'Not what the evidence supports. Real savings are available.' },
          { id: 'q8', when: 'protect', correct: true, text: 'Log retention was kept, older logs are moving to cheaper storage for about a 60% saving, and the investigation has its evidence.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'compromise', correct: true, text: 'Retention was cut to 90 days, and the earliest records of the unknown account fall just outside it.', why: 'An honest account of the cost.' },
          { id: 'q10', when: 'defer', correct: true, text: 'The decision was put off, and the logs were cut by the platform team in the meantime.', why: 'An honest account.' },
          { id: 'q11', when: 'agree', correct: true, text: 'Logs older than 14 days were deleted, including the records of the unknown account\'s creation and first use.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Contain temp-analytics: disable its role and sign-ins, preserve its logs and records, and review what it read.', why: 'Stops the exposure and keeps the evidence.' },
          { id: 'a2', correct: true, text: 'Tell the data protection officer, since customer data was read by an unauthorised party.', why: 'The legal clock may already be running.' },
          { id: 'a3', correct: true, text: 'Keep logs for at least a year, move older ones to cheaper storage, and find other leaver-created accounts.', why: 'Cuts cost and closes the same gap elsewhere.' },
          { id: 'a4', correct: false, text: 'Delete the account immediately.', why: 'It destroys the evidence.' },
          { id: 'a5', correct: false, text: 'Say nothing until the cost-saving programme has finished.', why: 'Delays containment and the legal duty.' },
        ],
      },
    ],
  },
];
