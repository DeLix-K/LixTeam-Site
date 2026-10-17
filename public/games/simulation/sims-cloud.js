// Cloud Security simulations. Everything here is fictional. IP addresses come from the reserved
// documentation ranges (203.0.113.0/24, 198.51.100.0/24). Cloud terms are generic ("access key", "role",
// "storage bucket") on purpose, so the lessons apply to any provider.
//
// The path's themes: permissions that are too broad, resources nobody owns, logging that is off or
// local, and changes that are easy to make and hard to see. The decisions are about least privilege,
// visibility and rolling changes out without stopping the people who use the cloud.

const RATINGS = [
  { name: 'Wide open', blurb: 'Permissions stayed broad, visibility stayed poor, or changes were rushed. Read each stage note: in the cloud, an identity is the perimeter.' },
  { name: 'Patching holes', blurb: 'You closed real gaps, with gaps of your own in priorities, evidence or rollout.' },
  { name: 'Cloud engineer', blurb: 'Sound priorities, least privilege backed by evidence, and honest reporting.' },
  { name: 'Cloud architect', blurb: 'Well-judged priorities and designs, changes that stick, and reporting leadership can act on.' },
];

export const CLOUD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'iam-review',
    title: 'Too many keys',
    skill: 'identity',
    minutes: 20,
    blurb: 'Almost everyone has administrator rights in the cloud account. Rank what to fix, find out who really needs what, and cut permissions down without stopping the developers.',
    brief: [
      'Contoso\'s cloud account grew quickly, and so did its permissions. A review has found that most developers have administrator access in production, several access keys are years old, and a role trusts an outside account nobody recognises.',
      'You are the cloud security engineer. You will rank what to fix first, check what the permission records actually show, decide how to remove access without breaking the teams, and review the draft remediation plan before it goes to the engineering directors.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the permission problems',
        intro: 'Tap the problems in order, the most serious first. Think about how much an attacker could do with it, how likely it is to be abused, and how easy it is to fix.',
        items: [
          { id: 'i1', source: 'Trust', priority: 1, text: 'A role that can change anything in production trusts an outside account that Contoso does not own.', why: 'Anyone who controls that outside account can take full control of production. It is the sharpest and the quickest to fix.' },
          { id: 'i2', source: 'Admin rights', priority: 2, text: '36 developers have administrator rights in production, and 22 of them have no second factor on their console sign-in.', why: 'One stolen password gives full control. Both the rights and the missing second factor need dealing with.' },
          { id: 'i3', source: 'Keys', priority: 3, text: 'Eleven access keys have not been used for over a year, and two belong to people who left the company.', why: 'Free access for anyone who finds one, and nobody would notice. Worth removing, though they do not give as much power as the first two.' },
          { id: 'i4', source: 'Pipeline', priority: 4, text: 'The deployment role has a wildcard permission that allows every action on every resource.', why: 'A real over-grant, but it needs the pipeline to be compromised first, and it is the hardest to narrow without breaking deploys.' },
          { id: 'i5', source: 'Tags', priority: 5, text: 'Half the roles have no description or owner tag.', why: 'Makes review harder, but exposes nothing by itself.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what the permission records show',
        intro: 'Before cutting access, find out what is really used and what is really exposed. Flag only what the records support.',
        clues: {
          trust: { strength: 'strong', text: 'The outside account in the production role\'s trust policy belongs to a former contractor.' },
          unused: { strength: 'strong', text: 'Most developers\' administrator permissions have not been used in the last 90 days.' },
          nomfa: { strength: 'strong', text: '22 administrators can sign in to the console with a password alone.' },
          wild: { strength: 'strong', text: 'The deployment role\'s wildcard permission is used for only 14 distinct actions.' },
          old: { strength: 'weak', text: 'Eleven access keys are over 400 days old.' },
        },
        artefacts: [
          {
            id: 'trust', title: 'Roles and trust relationships',
            lines: [
              { id: 'r1', type: 'clue', clue: 'trust', text: 'Role prod-admin: trust policy allows account 5521-0000-9917 to assume it. Account owner (registry): Dorset Consulting Ltd, contract ended 8 months ago', note: 'A former contractor can still take full control of production. It is the most urgent fix and needs no analysis.' },
              { id: 'r2', type: 'clue', clue: 'wild', text: 'Role deploy-pipeline: allows * on *. Actions actually used in the last 90 days: 14 distinct', note: 'The role needs a short, known list of permissions. The data to write that list already exists.' },
              { id: 'r3', type: 'herring', text: 'Role names follow the naming convention in 91% of cases', note: 'Tidy naming is nice. It says nothing about what the roles can do.' },
              { id: 'r4', type: 'herring', text: 'Total roles in the account: 214', note: 'A count, not a finding.' },
            ],
          },
          {
            id: 'users', title: 'People, keys and sign-ins',
            lines: [
              { id: 'r5', type: 'clue', clue: 'unused', text: 'Access analysis (90 days): of 36 developers with administrator rights, 31 used fewer than 12 distinct permissions; 19 used none', note: 'The evidence shows people do not need what they have. It is the basis for replacing admin with scoped roles.' },
              { id: 'r6', type: 'clue', clue: 'nomfa', text: 'Console sign-in report: 22 of 36 administrators have no multi-factor authentication configured', note: 'A password alone gives full production control.' },
              { id: 'r7', type: 'clue', clue: 'old', text: 'Key age report: 11 keys unused for over 400 days (2 belong to leavers)', note: 'Hygiene issues worth removing. Less urgent than rights that are in use.' },
              { id: 'r8', type: 'herring', text: 'Password policy: 14 characters minimum', note: 'A reasonable policy that does not address the problem of passwords being enough on their own.' },
              { id: 'r9', type: 'herring', text: 'Account has 3 regions enabled', note: 'A normal footprint with no bearing on permissions.' },
            ],
          },
        ],
      },
      {
        id: 'rollout', type: 'decision', title: 'Decide: how to remove the access',
        intro: 'The engineering lead says: "If you take admin from the developers, they cannot deploy or debug production. Last time you changed permissions, a release was blocked for two days."',
        prompt: 'How do you proceed?',
        options: [
          { id: 'scoped', quality: 3, text: 'Remove the outside trust today, then replace admin with scoped roles based on the 90-day usage data, add a time-limited, approved way to get elevated access for emergencies, require a second factor for everyone, and roll it out team by team', set: { scoped: true }, consequence: 'The dangerous trust is closed immediately. Developers keep what they use, and still have a safe route in an emergency. The first team trials it for a week before the rest follow.' },
          { id: 'allnow', quality: 2, text: 'Remove administrator rights from everyone tonight', set: { allnow: true }, consequence: 'It is quick and it breaks things: a release fails and an on-call engineer cannot fix an outage at 02:00.' },
          { id: 'policy', quality: 1, text: 'Send a reminder to follow least privilege', set: { policy: true }, consequence: 'A reminder changes nothing. The permissions are the same a month later.' },
          { id: 'trustonly', quality: 0, text: 'Remove the outside trust and leave everything else alone, since that is the only urgent one', set: { trustonly: true }, consequence: 'The most dangerous item is fixed, but 36 people still hold the keys to production and 22 can be taken over with one password.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft remediation plan',
        intro: 'A colleague has drafted the plan that goes to the engineering directors.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'A role that controls production trusts an account owned by a former contractor, and this will be removed immediately.', why: 'Supported by the trust policy and the registry record.' },
          { id: 'p2', sound: false, text: 'Developers need administrator rights to do their jobs.', why: 'Contradicted by the usage data: most used a handful of permissions and 19 used none.' },
          { id: 'p3', sound: false, text: 'A strong password policy makes a second factor unnecessary.', why: 'A password can still be stolen or phished. A second factor stops that from being enough.' },
          { id: 'p4', sound: true, text: 'Scoped roles will be based on the permissions people actually used over the last 90 days.', why: 'The sensible way to write least-privilege roles.' },
          { id: 'p5', sound: false, text: 'The account has been breached through the outside trust.', why: 'Unsupported. You have an exposure, not evidence anyone used it.' },
          { id: 'p6', sound: true, text: 'An approved, time-limited route to elevated access will remain for emergencies.', why: 'Prevents the changes from creating a safety problem.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the engineering directors',
        intro: 'Your own summary. Include what the evidence supports, be honest about the decisions made, and recommend sensible actions.',
        statements: [
          { id: 's1', correct: true, text: 'The production admin role trusts an outside account owned by a former contractor.', why: 'Shown by the trust policy and the registry.' },
          { id: 's2', correct: true, text: '36 developers have administrator rights in production, 22 without a second factor, though most used very few permissions.', why: 'Shown by the sign-in and usage reports.' },
          { id: 's3', correct: true, text: 'Eleven access keys have not been used for over a year, and two belong to leavers.', why: 'Shown by the key report.' },
          { id: 's4', correct: true, text: 'Nothing in the records shows that any of these permissions has been misused.', why: 'An honest statement of what is known.' },
          { id: 's5', correct: false, text: 'Production has been compromised.', why: 'Unsupported.' },
          { id: 's6', correct: false, text: 'The developers have been irresponsible.', why: 'A judgement about colleagues. The report states the findings and the fixes.' },
          { id: 's7', correct: false, text: 'Removing all administrator rights will have no effect on anyone.', why: 'Overstated. Some people have used elevated access for real work.' },
          { id: 's8', when: 'scoped', correct: true, text: 'The outside trust was removed the same day, and administrator rights are being replaced with scoped roles based on usage, with an approved emergency route and a second factor for everyone, team by team.', why: 'An accurate record of a sound approach.' },
          { id: 's9', when: 'allnow', correct: true, text: 'Administrator rights were removed from everyone overnight, which blocked a release and prevented an on-call fix.', why: 'An honest account of the cost of rushing.' },
          { id: 's10', when: 'policy', correct: true, text: 'Only a reminder was sent, so permissions are unchanged.', why: 'An honest statement that nothing was changed.' },
          { id: 's11', when: 'trustonly', correct: true, text: 'Only the outside trust was removed, leaving 36 administrators in production.', why: 'An honest account of what was and was not done.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Remove the outside trust, delete unused keys (including leavers\' keys) and require a second factor for every console user.', why: 'The quickest, highest-value changes.' },
          { id: 'a2', correct: true, text: 'Replace administrator rights with scoped roles built from the usage data, and keep an approved, time-limited route for emergencies.', why: 'Least privilege without stopping the work.' },
          { id: 'a3', correct: true, text: 'Review permissions every quarter and alert on any new administrator or outside trust.', why: 'Stops it creeping back.' },
          { id: 'a4', correct: false, text: 'Disable all developer access to production.', why: 'Out of proportion.' },
          { id: 'a5', correct: false, text: 'Wait for a breach to justify the work.', why: 'The exposure is already real.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'cloud-exam',
    title: 'Promotion exam: Cloud Security Engineer',
    skill: 'identity',
    minutes: 26,
    blurb: 'An acquired start-up\'s cloud account, a deadline and a request to cut corners. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso has acquired a small start-up, Fabrikam Labs, and its cloud account must be merged into Contoso\'s environment within two weeks. The account was built quickly by developers, with little review.',
      'The case tests the role: ranking what matters, spending limited effort, finding what is really exposed, standing firm on a shortcut, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the issues in the acquired account',
        intro: 'A first review of the Fabrikam Labs account found five issues. Rank them by the risk they pose once the accounts are joined, highest first.',
        items: [
          { id: 'x1', source: 'Storage', priority: 1, text: 'A storage bucket holding customer data is readable by anyone on the internet.', why: 'Customer data open to the whole world right now. It is the most urgent thing, and the quickest to close.' },
          { id: 'x2', source: 'Keys', priority: 2, text: 'A root-level access key is stored in a document shared with the whole start-up.', why: 'The most powerful credential in the account, widely readable. A close second.' },
          { id: 'x3', source: 'Network', priority: 3, text: 'Databases are reachable from the internet with only a password.', why: 'A very commonly attacked configuration. Important, but not holding data as exposed as the first item.' },
          { id: 'x4', source: 'Logging', priority: 4, text: 'Audit logging was never switched on.', why: 'You will not see anything that happens, including in an investigation. A serious gap, but it does not cause harm by itself.' },
          { id: 'x5', source: 'Cost', priority: 5, text: 'Several large virtual machines have been running unused for months.', why: 'Wasted money, not a security risk.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'Spend all ten days across these four pieces of work before the accounts are joined.',
        items: [
          { id: 'y1', source: 'Exposure', ideal: 3, text: 'Close the public storage bucket and find out who has read it.', why: 'The most urgent. It needs fixing now and then investigating.' },
          { id: 'y2', source: 'Identity', ideal: 3, text: 'Remove the root key, rotate everything it could reach and set up individual accounts with a second factor.', why: 'The credentials are the keys to everything. It takes real effort to do properly.' },
          { id: 'y3', source: 'Network', ideal: 2, text: 'Take the databases off the internet and put them behind private access.', why: 'A well-understood fix, and an important one.' },
          { id: 'y4', source: 'Logging', ideal: 2, text: 'Switch on audit logging in every region and send it to a protected account.', why: 'Without it you cannot answer any question afterwards, so it deserves a proper share.' },
        ],
      },
      {
        id: 'exposure', type: 'evidence', title: 'Find out who has already been in',
        intro: 'You have now closed the public bucket. Check what the records show about who accessed it. Flag only what the records support.',
        clues: {
          reads: { strength: 'strong', text: 'The bucket\'s access records show 3,100 downloads from 41 outside addresses over the last month.' },
          listing: { strength: 'strong', text: 'The same addresses first listed the bucket\'s contents before downloading, which suggests automated scanning.' },
          personal: { strength: 'strong', text: 'The files contain customer names, email addresses and order histories.' },
          nobefore: { strength: 'strong', text: 'Access logging for the bucket was only switched on 9 days ago, so earlier access cannot be seen.' },
          odd: { strength: 'weak', text: 'Most downloads came from a single hosting provider\'s address range.' },
        },
        artefacts: [
          {
            id: 'access', title: 'Bucket access records',
            lines: [
              { id: 'e1', type: 'clue', clue: 'reads', text: 'Access log (last 9 days): 3,100 GET requests from 41 addresses outside the company; none from the start-up\'s own ranges', note: 'The data has been read by people outside the company. This turns an exposure into a likely breach.' },
              { id: 'e2', type: 'clue', clue: 'listing', text: 'First request from each address: LIST (directory listing), then GET for each file', note: 'Listing and then fetching everything is how automated tools find and take open storage.' },
              { id: 'e3', type: 'clue', clue: 'odd', text: '1,900 of the requests came from addresses allocated to one hosting provider', note: 'A clue about the kind of actor. It does not change what must be done.' },
              { id: 'e4', type: 'herring', text: 'Bucket versioning: enabled', note: 'Useful for recovery, not related to who read it.' },
              { id: 'e5', type: 'herring', text: 'Bucket created 14 months ago', note: 'History with no bearing on the question.' },
            ],
          },
          {
            id: 'data', title: 'What is in the bucket',
            lines: [
              { id: 'e6', type: 'clue', clue: 'personal', text: 'Contents: customers.csv (41,000 rows: name, email, order history); order-exports/ (monthly)', note: 'Personal data about identifiable people. The data protection rules apply.' },
              { id: 'e7', type: 'clue', clue: 'nobefore', text: 'Logging configuration: server access logging enabled 9 days ago; before that, none', note: 'You cannot see anything before then. You must say so honestly rather than assume nobody looked.' },
              { id: 'e8', type: 'herring', text: 'No passwords or payment card numbers found in the files', note: 'Good news for the risk to people, but not proof that no harm is possible.' },
              { id: 'e9', type: 'herring', text: 'Total bucket size: 1.2 GB', note: 'Size has no bearing on the finding.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the deal team wants no fuss',
        intro: 'The deal lead says: "The accounts merge on Friday. Do not mention the open bucket to the board: we have closed it, so the problem is gone, and a data breach could derail the integration."',
        prompt: 'What do you do?',
        options: [
          { id: 'tell', quality: 3, text: 'Tell the data protection officer and Legal today, because 3,100 outside downloads of personal data may be a reportable breach; give the deal lead an accurate summary of what is known and unknown; and keep the merge on plan with the bucket closed', set: { tell: true }, consequence: 'The DPO starts the assessment inside the 72-hour window. The deal lead is uncomfortable but has an accurate account for the board, and the merge goes ahead.' },
          { id: 'partial', quality: 2, text: 'Tell the DPO but agree to keep it out of the board report until the assessment is complete', set: { partial: true }, consequence: 'The legal duty is met, but the board is not told for a week and finds out from someone else.' },
          { id: 'close', quality: 1, text: 'Say nothing: it is closed, and nobody can prove anyone looked', set: { closed: true }, consequence: 'A researcher finds the downloads in the logs six weeks later and reports it. The company is accused of hiding a breach.' },
          { id: 'block', quality: 0, text: 'Refuse to merge the accounts until every issue is fixed', set: { blocked: true }, consequence: 'The integration stalls for two months and the business builds a workaround outside your control.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement for the board',
        intro: 'A colleague has drafted the update to the board.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'A storage bucket holding customer names, emails and order histories was open to the internet and was downloaded from outside addresses 3,100 times in the last nine days.', why: 'Supported by the access records.' },
          { id: 'j2', sound: false, text: 'No customer data has been exposed.', why: 'Contradicted by the access log and the contents.' },
          { id: 'j3', sound: false, text: 'Nobody accessed the bucket before it was closed.', why: 'Contradicted by the access log for the last nine days, and logging did not exist before that.' },
          { id: 'j4', sound: true, text: 'Access logging was only enabled nine days ago, so earlier access cannot be assessed.', why: 'An honest statement of a limit.' },
          { id: 'j5', sound: false, text: 'The attackers were a known criminal group.', why: 'Unsupported. You know the addresses, not who is behind them.' },
          { id: 'j6', sound: true, text: 'The data protection officer has been told and is assessing whether this is a reportable breach.', why: 'An accurate statement of the legal step.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not yet known.',
        statements: [
          { id: 'r1', correct: true, text: 'A bucket of customer data in the acquired account was publicly readable, and the access records show 3,100 downloads from 41 outside addresses in nine days.', why: 'Shown by the records.' },
          { id: 'r2', correct: true, text: 'The files contain personal data (names, emails and order histories) for about 41,000 people.', why: 'Shown by the contents.' },
          { id: 'r3', correct: true, text: 'Logging was only enabled nine days ago, so earlier access cannot be seen and is not yet known.', why: 'An honest statement.' },
          { id: 'r4', correct: true, text: 'The bucket has been closed, and a root-level key and exposed databases have been identified for urgent fixing.', why: 'An accurate account of the position.' },
          { id: 'r5', correct: false, text: 'Customer data has been sold.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The start-up\'s developers were negligent.', why: 'A judgement about people.' },
          { id: 'r7', correct: false, text: 'There is no need to tell the regulator.', why: 'That is for the DPO to decide after an assessment.' },
          { id: 'r8', when: 'tell', correct: true, text: 'The data protection officer and Legal were told the same day, and the assessment began inside the 72-hour window.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'partial', correct: true, text: 'The DPO was told, but the board was not informed until the assessment was complete.', why: 'An honest account of a delay.' },
          { id: 'r10', when: 'closed', correct: true, text: 'The exposure was not reported to the DPO or the board, and the evidence of downloads was not reviewed.', why: 'An honest record of a serious failure.' },
          { id: 'r11', when: 'blocked', correct: true, text: 'The account merge was blocked until everything was fixed, which stalled the integration for two months.', why: 'An honest account of the cost of refusing to compromise.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Complete the data protection assessment and notify the regulator within 72 hours if there is a risk to people.', why: 'Meets the legal duty.' },
          { id: 'a2', correct: true, text: 'Remove the root key and rotate everything it could reach, take the databases off the internet and switch on audit logging everywhere.', why: 'Closes the other serious gaps.' },
          { id: 'a3', correct: true, text: 'Do not join the accounts until the serious items are fixed, and join them by stages afterwards.', why: 'A measured, proportionate approach.' },
          { id: 'a4', correct: false, text: 'Delete the account.', why: 'It destroys evidence and the business.' },
          { id: 'a5', correct: false, text: 'Tell customers now that they were definitely breached.', why: 'Premature. Assess first and then tell people accurately.' },
        ],
      },
    ],
  },
];
