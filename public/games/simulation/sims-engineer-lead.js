// Senior Security Engineer simulations. Everything here is fictional. Terms are generic ("container
// platform", "image", "network policy") so the lessons apply to any vendor.
//
// The tier's themes: thinking about attackers before anything is built, spending a limited security
// budget where it removes the most risk, and holding a line when a deadline pushes you to skip a control.

const RATINGS = [
  { name: 'Bolted on', blurb: 'Controls were added late, in the wrong order, or skipped under pressure. Read each stage note: design is where security is cheapest.' },
  { name: 'Reviewer', blurb: 'You found real problems, with gaps in priorities, evidence or how you handled the pressure.' },
  { name: 'Senior engineer', blurb: 'Sound priorities, controls matched to real threats, and the courage to hold a line.' },
  { name: 'Security architect', blurb: 'Threats modelled before build, effort spent where it counts, and reporting that leaders can act on.' },
];

export const ENGINEER_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'threat-model',
    title: 'Before it is built',
    skill: 'hardening',
    minutes: 20,
    blurb: 'A new payments feature is a week from build. Model the threats, check the design for gaps, spend a small budget well and decide how the team should work.',
    brief: [
      'Contoso is adding a "pay by link" feature: staff create a payment link, email it to a customer, and the customer pays on a Contoso page. Design is signed off on Monday and building starts on Tuesday.',
      'You are the senior security engineer. You will rank the threats, look for the gaps in the design documents, spend your limited review time, decide how security will work with the team, and check the summary before it goes to the product lead.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the threats',
        intro: 'Tap the threats in order, the most serious first. Think about what an attacker gains, how easy it is, and how hard it is to fix once the feature is built.',
        items: [
          { id: 't1', source: 'Links', priority: 1, text: 'Payment links use a short number in the web address, so anyone can change the number and see or pay someone else\'s payment.', why: 'Guessable identifiers expose other customers\' payments and are very easy to abuse. They are also much cheaper to fix in the design than after launch.' },
          { id: 't2', source: 'Staff access', priority: 2, text: 'Any member of staff can create a link for any amount and see every link ever created.', why: 'A single stolen staff login could be used to create fake links and read customers\' details. It needs proper roles and logging.' },
          { id: 't3', source: 'Email', priority: 3, text: 'Customers receive payment links by email, so criminals can copy the format and send fake ones.', why: 'A real risk, but it cannot be fully fixed by this feature. It needs clear, consistent wording and customer guidance.' },
          { id: 't4', source: 'Logs', priority: 4, text: 'The design logs the full link and the customer\'s email address in application logs.', why: 'Logs often reach more people than the database. A leak is plausible, but it is a quick fix at build time.' },
          { id: 't5', source: 'Load', priority: 5, text: 'A large burst of requests could slow the payment page.', why: 'An availability concern the platform team already handles. It does not put customer money or data at risk.' },
        ],
      },
      {
        id: 'design', type: 'evidence', title: 'Check the design documents for gaps',
        intro: 'You have the draft design pack. Look for the places where a threat has no control. Flag only what the documents support.',
        clues: {
          guess: { strength: 'strong', text: 'The link identifier is a sequential number, with no check that the person opening it is the intended customer.' },
          roles: { strength: 'strong', text: 'There is one staff role, and it can create, view and refund any payment.' },
          audit: { strength: 'strong', text: 'No record is kept of who created or viewed a link, so misuse could not be investigated afterwards.' },
          expiry: { strength: 'strong', text: 'Links never expire and can be paid more than once.' },
          tls: { strength: 'weak', text: 'The design says traffic will use encryption in transit.' },
        },
        artefacts: [
          {
            id: 'flow', title: 'Data flow and link design',
            lines: [
              { id: 'd1', type: 'clue', clue: 'guess', text: 'Link format: pay.contoso.example/p/10482 (order number). The page loads the order for that number', note: 'Anyone can try 10483, 10484 and so on. A link must be hard to guess and tied to the customer.' },
              { id: 'd2', type: 'clue', clue: 'expiry', text: 'Link lifetime: unlimited. Status after payment: "paid" (link still opens and can be paid again)', note: 'An old link in an old email stays dangerous forever, and a link that can be paid twice causes double charges and disputes.' },
              { id: 'd3', type: 'clue', clue: 'tls', text: 'All pages and the card service are reached over HTTPS', note: 'Good, expected practice. It protects data in transit and does nothing about the problems above.' },
              { id: 'd4', type: 'herring', text: 'The payment page uses the company colour scheme and logo', note: 'Presentation. No bearing on security.' },
              { id: 'd5', type: 'plain', text: 'Card details are handled by an external payment provider, not stored by Contoso', note: 'A strong design choice that removes a large category of risk.' },
            ],
          },
          {
            id: 'access', title: 'Staff access and logging',
            lines: [
              { id: 'd6', type: 'clue', clue: 'roles', text: 'Roles: "staff" (create link, view any link, refund any payment). No other roles defined', note: 'Everyone can do everything. Creating links and refunding money should not sit with the same people.' },
              { id: 'd7', type: 'clue', clue: 'audit', text: 'Logging: application errors only. Link creation, viewing and refunds: not logged', note: 'You cannot investigate misuse you cannot see.' },
              { id: 'd8', type: 'herring', text: 'Staff sign in with single sign-on and a second factor', note: 'Good, and already true for every internal system. It does not address what a signed-in person can do.' },
              { id: 'd9', type: 'herring', text: 'The feature will be built by the web team using the standard framework', note: 'Background. No finding.' },
              { id: 'd10', type: 'plain', text: 'Estimated launch: three weeks after build starts', note: 'Time to fix design gaps, if they are raised now.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'review-days', budget: 10, title: 'Spend your ten review-days',
        intro: 'You have ten days of your own and your team\'s time before launch. Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Link design', ideal: 4, text: 'Work with the developers on unguessable, single-use, expiring links tied to the customer.', why: 'The biggest risk and the one that is cheapest to get right at design time.' },
          { id: 'e2', source: 'Roles and audit', ideal: 3, text: 'Define separate roles for creating links and for refunds, and log who created, viewed and refunded each payment.', why: 'Needed so misuse can be prevented and investigated.' },
          { id: 'e3', source: 'Testing', ideal: 2, text: 'Write abuse tests (guessing identifiers, replaying links, refunding as the wrong role) to run on every build.', why: 'Stops the same flaws returning later.' },
          { id: 'e4', source: 'Customer wording', ideal: 1, text: 'Agree email wording and a short guide so customers can recognise a genuine link.', why: 'Helps with fake links, though it cannot solve them alone.' },
        ],
      },
      {
        id: 'approach', type: 'decision', title: 'Decide: how security works with the team',
        intro: 'The product lead says: "Build starts tomorrow. Can you just give us a list of rules at the end, and we will tick them off before launch?"',
        prompt: 'What do you propose?',
        options: [
          { id: 'embed', quality: 3, text: 'Share the three design gaps now with proposed fixes, agree they go into the first sprint, and join the team\'s design reviews and test runs rather than checking at the end', set: { embed: true }, consequence: 'The fixes cost days now rather than weeks later. The team treats the abuse tests as part of the definition of done.' },
          { id: 'checklist', quality: 2, text: 'Send the checklist tomorrow and review the finished feature the week before launch', set: { checklist: true }, consequence: 'Most items are met. The identifier design is deeply built in, so fixing it costs two weeks and delays launch.' },
          { id: 'gate', quality: 1, text: 'Refuse to let building start until every threat has a written control', set: { gate: true }, consequence: 'Build slips by two weeks and the product team plans the next feature without involving you.' },
          { id: 'trust', quality: 0, text: 'Tell them the standard framework is secure and wish them luck', set: { trust: true }, consequence: 'The feature launches with sequential links. A researcher finds it in the first month and posts about it.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the product lead',
        intro: 'A colleague has drafted the security summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Link identifiers are sequential, so one customer\'s payment could be opened by changing the number.', why: 'Supported by the design.' },
          { id: 'p2', sound: false, text: 'The feature is safe because it uses HTTPS.', why: 'HTTPS protects data in transit. It does nothing about guessable links or over-broad staff access.' },
          { id: 'p3', sound: false, text: 'Card numbers are at risk of being stolen from Contoso\'s database.', why: 'Card details are handled by the payment provider and never stored by Contoso.' },
          { id: 'p4', sound: true, text: 'Creating links and refunding money are performed by the same role, and neither action is logged.', why: 'Supported by the access design.' },
          { id: 'p5', sound: false, text: 'Attackers are already exploiting the feature.', why: 'It has not been built. These are design risks.' },
          { id: 'p6', sound: true, text: 'Fixing these in the design now will cost far less than fixing them after launch.', why: 'Well-founded and a good reason to act now.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the product lead',
        intro: 'Your own summary. Include what the documents support and be honest about what is still open.',
        statements: [
          { id: 'r1', correct: true, text: 'Payment links use a sequential number, so other customers\' payments could be opened or paid by changing it.', why: 'Shown by the design.' },
          { id: 'r2', correct: true, text: 'Links never expire and can be paid more than once.', why: 'Shown by the design.' },
          { id: 'r3', correct: true, text: 'One role can create links, view all links and refund payments, and none of these actions is logged.', why: 'Shown by the access design.' },
          { id: 'r4', correct: true, text: 'Card details are handled by the payment provider, which removes a large risk, but it does not address these gaps.', why: 'An accurate, balanced statement.' },
          { id: 'r5', correct: false, text: 'The feature will be breached after launch.', why: 'Unsupported. These are risks to remove, not predictions.' },
          { id: 'r6', correct: false, text: 'The web team has built this insecurely.', why: 'A judgement about people. Nothing has been built yet.' },
          { id: 'r7', correct: false, text: 'The feature should not launch.', why: 'Not what the evidence supports. The gaps can be fixed in time.' },
          { id: 'r8', when: 'embed', correct: true, text: 'The three gaps were shared before building, are in the first sprint, and abuse tests will run on every build.', why: 'An accurate record of a sound approach.' },
          { id: 'r9', when: 'checklist', correct: true, text: 'Security reviewed the finished feature a week before launch, and redesigning the link identifier delayed launch by two weeks.', why: 'An honest account of the cost of late review.' },
          { id: 'r10', when: 'gate', correct: true, text: 'Building was held until every threat had a written control, which delayed the project by two weeks.', why: 'An honest account of the cost of blocking.' },
          { id: 'r11', when: 'trust', correct: true, text: 'No security review took place and the feature launched with guessable links.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Replace sequential identifiers with long random, single-use, expiring links tied to the customer.', why: 'Removes the most serious risk.' },
          { id: 'a2', correct: true, text: 'Split link creation from refunds into separate roles, and log creation, viewing and refunds.', why: 'Prevents and detects misuse.' },
          { id: 'a3', correct: true, text: 'Add abuse tests to the build so these flaws cannot return unnoticed.', why: 'Makes the fix stick.' },
          { id: 'a4', correct: false, text: 'Add a warning to the page telling people not to change the number.', why: 'It stops no one.' },
          { id: 'a5', correct: false, text: 'Wait until after launch and fix whatever is reported.', why: 'The cost of fixing rises sharply after build.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'se-senior-exam',
    title: 'Promotion exam: Senior Security Engineer',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A shared container platform, a launch date and a request to skip two controls. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso\'s platform team is launching a shared container platform that thirty product teams will run their services on, in six weeks. The first services move on in two.',
      'The case tests the role: ranking risks that apply to every team, spending limited effort, finding what is really wrong in the draft design, standing firm on a shortcut, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the platform risks',
        intro: 'A first review of the platform design found five risks. Rank them by how much damage they could do once thirty teams are running on it, highest first.',
        items: [
          { id: 'x1', source: 'Isolation', priority: 1, text: 'Every team\'s services can talk to every other team\'s services, with no network rules between them.', why: 'One compromised service can reach everything. On a shared platform it turns one team\'s incident into thirty teams\' problem.' },
          { id: 'x2', source: 'Images', priority: 2, text: 'Services can run any image from any public source, and nothing checks where an image came from.', why: 'A poisoned or outdated image runs with the platform\'s trust. It is the common entry point on shared platforms.' },
          { id: 'x3', source: 'Privilege', priority: 3, text: 'Services run as administrator inside their containers by default, and some can reach the host\'s files.', why: 'Makes an escape from a container to the underlying machine far easier. Serious, but it needs an attacker to be inside a service first.' },
          { id: 'x4', source: 'Secrets', priority: 4, text: 'Teams pass passwords to services as plain settings visible to anyone who can view the service.', why: 'A real leak path, with a clear fix, though narrower than the first three.' },
          { id: 'x5', source: 'Naming', priority: 5, text: 'Services are named inconsistently across teams.', why: 'Untidy and annoying. It exposes nothing.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks of platform and security effort across these four pieces of work before the first teams move on.',
        items: [
          { id: 'y1', source: 'Isolation', ideal: 3, text: 'Default-deny network rules between teams, with a simple way for each team to open only what it needs.', why: 'The largest risk, and the hardest to retrofit once thirty teams depend on open access.' },
          { id: 'y2', source: 'Images', ideal: 3, text: 'Only run images built by the company pipeline, scanned and signed, from a trusted registry.', why: 'Closes the most likely route in, and takes real work to do well.' },
          { id: 'y3', source: 'Privilege', ideal: 2, text: 'Run services as non-administrator users with a read-only filesystem by default.', why: 'Makes escapes harder. A reasonable share of time.' },
          { id: 'y4', source: 'Secrets', ideal: 2, text: 'Move passwords into a managed store that services read at start-up.', why: 'Removes a common leak path.' },
        ],
      },
      {
        id: 'draft', type: 'evidence', title: 'Find what is really wrong in the draft design',
        intro: 'The platform team has sent the draft rollout plan and the first team\'s configuration. Check them for the gaps that matter. Flag only what the documents support.',
        clues: {
          open: { strength: 'strong', text: 'The draft sets network rules to "allow all" for the pilot, with a plan to tighten them after launch.' },
          unsigned: { strength: 'strong', text: 'The pilot team already pulls an image from a public source by tag, and the tag can be changed by whoever owns it.' },
          admin: { strength: 'strong', text: 'The pilot service runs as administrator and mounts the host\'s file system.' },
          nowatch: { strength: 'strong', text: 'No alerts exist for new images, new privileged services or changes to network rules.' },
          docs: { strength: 'weak', text: 'The design includes an architecture diagram with every component labelled.' },
        },
        artefacts: [
          {
            id: 'plan', title: 'Rollout plan',
            lines: [
              { id: 'z1', type: 'clue', clue: 'open', text: 'Pilot network policy: allow all between teams. "Tighten after launch once teams have settled."', note: '"After launch" rarely arrives. Teams build on open access and then refuse to give it up.' },
              { id: 'z2', type: 'clue', clue: 'nowatch', text: 'Monitoring scope: node health, CPU and memory. Security events: not in scope for launch', note: 'Nobody would notice a poisoned image, a privileged service or a changed network rule.' },
              { id: 'z3', type: 'clue', clue: 'docs', text: 'Appendix: architecture diagram v3, with all components and data flows', note: 'Good documentation. It does not show whether controls exist.' },
              { id: 'z4', type: 'herring', text: 'Pilot team has 14 engineers', note: 'A size with no bearing on risk.' },
              { id: 'z5', type: 'plain', text: 'Launch date: six weeks away; first teams move on in two', note: 'Context. The fixes will have to fit that timetable.' },
            ],
          },
          {
            id: 'config', title: 'First team\'s service configuration',
            lines: [
              { id: 'z6', type: 'clue', clue: 'unsigned', text: 'image: registry.example/community/webtools:latest (no digest, no signature check)', note: 'The tag "latest" can be changed by whoever owns it. You are running whatever they put there.' },
              { id: 'z7', type: 'clue', clue: 'admin', text: 'securityContext: runAsUser: 0; hostPath mount: /var/lib', note: 'An administrator inside the container with a window onto the host machine makes an escape much easier.' },
              { id: 'z8', type: 'herring', text: 'Resource limits are set on every container', note: 'Good practice for stability. It does not address these security gaps.' },
              { id: 'z9', type: 'herring', text: 'Service replicas: 3', note: 'A reliability setting, not a security finding.' },
              { id: 'z10', type: 'plain', text: 'Health checks are defined for every service', note: 'Useful for operations. Unrelated.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the platform lead wants to skip two controls',
        intro: 'The platform lead says: "We are two weeks from the first teams. Default-deny network rules and signed images will take too long. Let us launch with allow-all and public images, and add the controls in the next quarter."',
        prompt: 'What do you do?',
        options: [
          { id: 'stage', quality: 3, text: 'Agree to launch the pilot on a narrow scope: one team, in its own isolated space, with signed images from the company registry and default-deny between teams from the first day, then widen the platform as each control is ready', set: { stage: true }, consequence: 'The pilot team has a working platform on time. The risky controls are never skipped, and every later team joins a platform that is safe by default.' },
          { id: 'timebox', quality: 2, text: 'Allow the shortcut for the pilot only, with a dated commitment and an executive sign-off to fix both controls before the second team joins', set: { timebox: true }, consequence: 'The pilot launches on time. The date slips once and the second team joins before the fix, with an owner who accepted the risk in writing.' },
          { id: 'refuse', quality: 1, text: 'Refuse to support the launch until both controls are complete', set: { refuse: true }, consequence: 'The launch slips by six weeks. The platform team finds workarounds outside your reach.' },
          { id: 'agree', quality: 0, text: 'Agree. The platform team knows its own timetable', set: { agree: true }, consequence: 'Thirty teams build on open access and public images. A year later, a poisoned image reaches several teams at once.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft status update for the leadership team',
        intro: 'A colleague has drafted the update.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The draft platform allows all traffic between teams and runs images from public sources without checking where they came from.', why: 'Supported by the rollout plan and configuration.' },
          { id: 'j2', sound: false, text: 'The platform is secure because every component is documented.', why: 'Documentation shows what exists, not whether controls are in place.' },
          { id: 'j3', sound: false, text: 'A poisoned image has already reached production.', why: 'Unsupported. You have found a gap, not an incident.' },
          { id: 'j4', sound: true, text: 'No security alerting is planned for launch, so image or network changes would not be noticed.', why: 'Supported by the monitoring scope.' },
          { id: 'j5', sound: false, text: 'The pilot team has been careless.', why: 'A judgement about people. The configuration reflects the platform defaults.' },
          { id: 'j6', sound: true, text: 'Fixing network rules and image trust now will cost far less than doing it once thirty teams depend on the open defaults.', why: 'Well-founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the leadership team',
        intro: 'Your own summary. Include what the evidence supports and be honest about what you do not know.',
        statements: [
          { id: 'q1', correct: true, text: 'The draft design allows all traffic between teams and runs unsigned images from a public source.', why: 'Shown by the plan and the configuration.' },
          { id: 'q2', correct: true, text: 'The pilot service runs as administrator with access to the host\'s files, which would make a container escape easier.', why: 'Shown by the configuration.' },
          { id: 'q3', correct: true, text: 'No security monitoring is in scope for launch.', why: 'Shown by the monitoring plan.' },
          { id: 'q4', correct: true, text: 'No evidence shows that any of these gaps has been used by an attacker.', why: 'An honest statement of what is known.' },
          { id: 'q5', correct: false, text: 'The platform has been breached.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'The platform team does not care about security.', why: 'A judgement about people.' },
          { id: 'q7', correct: false, text: 'The platform cannot launch safely at all.', why: 'Overstated. A staged launch is possible.' },
          { id: 'q8', when: 'stage', correct: true, text: 'The pilot launches on time on a narrow scope, with signed images and default-deny between teams from the first day, and the platform widens as each control is ready.', why: 'An accurate record of a sound approach.' },
          { id: 'q9', when: 'timebox', correct: true, text: 'The pilot launched with a time-limited shortcut and an executive sign-off, and the deadline for the fix slipped once.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'Security refused to support the launch until both controls were complete, and the launch slipped by six weeks.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'Both controls were deferred without a date or owner, and thirty teams are building on open access and public images.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Enforce default-deny network rules and signed images from the company registry before widening beyond the pilot.', why: 'Closes the two largest risks.' },
          { id: 'a2', correct: true, text: 'Make non-administrator, read-only services the default, and move passwords into a managed store.', why: 'Sets safe defaults for every team.' },
          { id: 'a3', correct: true, text: 'Add alerts for new images, privileged services and network rule changes before launch.', why: 'So that misuse is noticed.' },
          { id: 'a4', correct: false, text: 'Block the platform until every possible control is built.', why: 'Out of proportion, and the business will route around it.' },
          { id: 'a5', correct: false, text: 'Ask each team to harden its own services however it chooses.', why: 'Inconsistent. Safe defaults belong in the platform.' },
        ],
      },
    ],
  },
];
