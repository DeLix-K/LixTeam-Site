// Security Architect simulations. Everything here is fictional.
//
// The tier's themes: choosing what a whole organisation should do about security next year, buying
// and building for the right reasons, and keeping control of risk when the business is moving fast
// (an acquisition, a deadline, a senior person who wants a shortcut).

const RATINGS = [
  { name: 'Tool collector', blurb: 'Effort went to what was visible or fashionable rather than to the causes of real incidents. Read each stage note: an architect\'s job is to pick the few things that matter.' },
  { name: 'Programme builder', blurb: 'You chose real priorities, with gaps in evidence, balance or how you handled pressure.' },
  { name: 'Security architect', blurb: 'A plan tied to what actually goes wrong, spending matched to risk, and the judgement to hold a line.' },
  { name: 'Trusted architect', blurb: 'A strategy the business, the engineers and the board could all explain, and the courage to stage a risky decision rather than refuse or accept it.' },
];

export const ENGINEER_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'security-roadmap',
    title: 'The twelve-month plan',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The CISO wants a security plan for fourteen product teams, a fixed budget and a vendor pitching a shiny platform. Work out what actually causes your incidents, spend the budget on that, and decide what to do about the pitch.',
    brief: [
      'Contoso runs fourteen product teams, each with its own way of doing identity, secrets, releases and monitoring. Last year there were 31 security incidents. The CISO has asked you, as security architect, for next year\'s plan.',
      'You will rank the candidate initiatives, check what last year\'s incidents really had in common, spend a limited budget of engineer-quarters, decide how to answer a vendor-backed request for a flagship platform, and review the summary before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the candidate initiatives',
        intro: 'Tap the initiatives in order, the most valuable first. Think about how many incidents each would have prevented, how widely it helps, and how long it takes to deliver.',
        items: [
          { id: 'i1', source: 'Identity', priority: 1, text: 'One company-wide way to sign in and to remove access, replacing the fourteen separate arrangements.', why: 'Stale and over-broad access sits behind many incidents, and a single route fixes it for every team at once.' },
          { id: 'i2', source: 'Supplier access', priority: 2, text: 'A review and register of every third-party tool and integration that holds company data or tokens.', why: 'Nobody has a full list. Supplier problems hit many teams at once and cannot be fixed one team at a time.' },
          { id: 'i3', source: 'Secure defaults', priority: 3, text: 'A shared set of build and deployment templates with the main controls already built in.', why: 'Makes the right thing the easy thing for every new service. Valuable, though slower to show results.' },
          { id: 'i4', source: 'Detection', priority: 4, text: 'A central place for security logs, with alerts for the handful of attacks that matter most.', why: 'Shortens the time to notice. It helps once the causes above are being addressed.' },
          { id: 'i5', source: 'Awareness', priority: 5, text: 'A second round of company-wide security awareness videos.', why: 'Low cost and low effect on the incident pattern. Worth keeping small.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what last year\'s incidents had in common',
        intro: 'You have the incident register for the year and the audit summary. Look for the patterns that should decide the plan. Flag only what the records support.',
        clues: {
          access: { strength: 'strong', text: 'Of 31 incidents, 14 involved access that should have been removed or reduced: leavers, old contractors or over-broad roles.' },
          third: { strength: 'strong', text: 'Eight incidents started with a third-party tool or integration, and five of those teams did not know the tool had access to their data.' },
          repeat: { strength: 'strong', text: 'Five problems were found by auditors that the same teams had been told about the year before.' },
          tools: { strength: 'strong', text: 'Contoso owns 23 security tools, and four of them are not switched on for more than half of the teams that should use them.' },
          awareness: { strength: 'weak', text: 'Eleven of the incidents involved a staff member clicking a link.' },
        },
        artefacts: [
          {
            id: 'register', title: 'Incident register: root causes',
            lines: [
              { id: 'm1', type: 'clue', clue: 'access', text: 'Root cause tally (31 incidents): stale or excess access 14; third-party tool or integration 8; unpatched internet-facing system 4; staff clicked a link 11 (overlaps with others); other 3', note: 'Access is the largest single cause. Two causes together (access and suppliers) account for most of the year.' },
              { id: 'm2', type: 'clue', clue: 'third', text: 'Supplier-origin incidents: 8. Teams that did not know the tool had access to company data: 5', note: 'You cannot protect connections you do not know exist. The register has to come first.' },
              { id: 'm3', type: 'clue', clue: 'awareness', text: 'Clicked-link incidents: 11. In 9 of them, the account involved had access that was wider than the person\'s role needed', note: 'The click is the start, but the damage was caused by access. This reinforces the access fix more than it argues for more videos.' },
              { id: 'm4', type: 'herring', text: 'Average time to close an incident: 6 days', note: 'A performance measure. It does not point to causes.' },
              { id: 'm5', type: 'plain', text: 'No incident last year involved a flaw that had no fix available at the time', note: 'Nothing exotic. The problems were ordinary and fixable.' },
            ],
          },
          {
            id: 'audit', title: 'Audit summary and tool inventory',
            lines: [
              { id: 'm6', type: 'clue', clue: 'repeat', text: 'Audit: 12 findings; 5 repeat findings from last year (unowned systems, access reviews not done, secrets in code). Same teams in all 5', note: 'Telling teams does not make them fix things. The plan needs a way to make the right behaviour the default.' },
              { id: 'm7', type: 'clue', clue: 'tools', text: 'Security tool inventory: 23 tools. Deployed across fewer than half of eligible teams: 4. Unused licences: £310,000', note: 'There is plenty of tooling. The gap is use, not purchase.' },
              { id: 'm8', type: 'herring', text: 'Security budget as a share of IT spend: 6%, against a sector average of 7%', note: 'A comparison with no bearing on where the money should go.' },
              { id: 'm9', type: 'herring', text: 'Number of staff in the security team: 14', note: 'A resource fact, not a priority.' },
              { id: 'm10', type: 'plain', text: 'Fourteen product teams: 3 have a named security champion', note: 'Context for how the plan will land.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-quarters', budget: 10, title: 'Spend your ten engineer-quarters',
        intro: 'Spend all ten across these four programmes for the year.',
        items: [
          { id: 'a1', source: 'Identity', ideal: 4, text: 'One sign-in and access-removal route for every team, with leaver removal automated and a yearly access review.', why: 'The largest cause, and the work that takes the most effort to do across fourteen teams.' },
          { id: 'a2', source: 'Suppliers', ideal: 2, text: 'A register of every third-party tool and integration with owners, scopes and a regular review.', why: 'The second pattern, and one that the plan needs to know the full extent of.' },
          { id: 'a3', source: 'Defaults', ideal: 3, text: 'Shared deployment templates with secrets handling, logging and network rules built in, which teams adopt in waves.', why: 'Stops the repeat findings, because the right thing becomes the default.' },
          { id: 'a4', source: 'Detection', ideal: 1, text: 'Send security logs to a central place and alert on a short list of high-value events.', why: 'Useful, and cheaper once the earlier work gives it good data.' },
        ],
      },
      {
        id: 'vendor', type: 'decision', title: 'Decide: the vendor\'s flagship platform',
        intro: 'The CISO says: "A vendor has shown me a platform that promises to find and fix everything automatically. It costs £1.2 million a year. The board loves the idea. Can we just buy it and put that on the plan?"',
        prompt: 'What do you recommend?',
        options: [
          { id: 'pilot', quality: 3, text: 'Fund the basics from the plan first, then run a time-limited pilot of the platform with one team against the specific causes you found, with success measures set in advance and a decision to buy only if it moves them', set: { pilot: true }, consequence: 'The board sees a serious evaluation. The pilot shows the platform helps with one cause and duplicates tools Contoso already owns, so only part of it is bought.' },
          { id: 'buy', quality: 2, text: 'Buy it, but keep the basics in the plan as well and cut something else to pay for it', set: { buy: true }, consequence: 'The platform is installed. The basics are cut back to fit, and by mid-year the repeat audit findings return.' },
          { id: 'refuse', quality: 1, text: 'Reject it outright because the money is better spent on the basics', set: { refuse: true }, consequence: 'You may be right, but you did not test the idea. The CISO feels overruled and the board still wonders about the platform.' },
          { id: 'swap', quality: 0, text: 'Replace the plan with the platform, since it promises to do the work automatically', set: { swap: true }, consequence: 'A year later the platform shows hundreds of findings. The identity, supplier and default problems are untouched.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the board',
        intro: 'A colleague has drafted the summary of the plan.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Stale or excess access was a root cause in 14 of last year\'s 31 incidents, and third-party tools in 8.', why: 'Supported by the incident register.' },
          { id: 'p2', sound: false, text: 'More awareness training would have prevented most of last year\'s incidents.', why: 'Contradicted by the evidence: in 9 of the 11 clicked-link incidents, over-broad access caused the damage.' },
          { id: 'p3', sound: false, text: 'Contoso has too little security tooling.', why: 'Contoso owns 23 tools and £310,000 of licences are unused. The gap is adoption.' },
          { id: 'p4', sound: true, text: 'Five audit findings repeat from last year, so reminders to teams have not worked.', why: 'Supported by the audit.' },
          { id: 'p5', sound: false, text: 'The incidents show that the security team is failing.', why: 'A judgement about people. The evidence shows where the causes are.' },
          { id: 'p6', sound: true, text: 'A time-limited pilot with set success measures is a fair way to evaluate a new platform.', why: 'A sound way to test a purchase.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the plan summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Stale or excess access caused 14 of last year\'s 31 incidents, and third-party tools caused 8.', why: 'Shown by the register.' },
          { id: 'r2', correct: true, text: 'Five audit findings repeat from last year, and four security tools are not switched on for most of the teams that should use them.', why: 'Shown by the audit and tool inventory.' },
          { id: 'r3', correct: true, text: 'The plan puts most of its effort into identity, shared secure defaults and a register of supplier access, ahead of new tools.', why: 'An accurate statement of the plan.' },
          { id: 'r4', correct: true, text: 'We do not yet know how many third-party tools have access to company data, and the first task is to find out.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The plan will prevent all security incidents next year.', why: 'Overstated.' },
          { id: 'r6', correct: false, text: 'The teams have ignored security.', why: 'A judgement about people.' },
          { id: 'r7', correct: false, text: 'The flagship platform will find and fix everything.', why: 'Unsupported vendor claim.' },
          { id: 'r8', when: 'pilot', correct: true, text: 'The platform will be piloted with one team against the causes above, with success measures agreed first, and bought only if it moves them.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'buy', correct: true, text: 'The platform was bought, and the basics were cut to pay for it, and repeat audit findings returned.', why: 'An honest account of the trade-off.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'The platform was rejected without a trial, and the board still has questions about it.', why: 'An honest account.' },
          { id: 'r11', when: 'swap', correct: true, text: 'The plan was replaced by the platform, and the identity, supplier and default problems were not addressed.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Build one company-wide route for sign-in and access removal, and automate leaver removal.', why: 'Targets the largest cause.' },
          { id: 'a2', correct: true, text: 'Create and review a register of third-party tools and the access they hold.', why: 'Finds the unknown connections.' },
          { id: 'a3', correct: true, text: 'Publish shared deployment templates with the main controls built in, and move teams on in waves.', why: 'Makes the secure way the easy way.' },
          { id: 'a4', correct: false, text: 'Buy a new platform and wait for it to produce results.', why: 'Treats the symptoms and ignores the causes.' },
          { id: 'a5', correct: false, text: 'Send the audit findings to the teams again and ask them to act.', why: 'It has not worked.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'se-architect-exam',
    title: 'Promotion exam: Security Architect',
    skill: 'hardening',
    minutes: 28,
    blurb: 'An acquisition in eight weeks, a request to trust the other company\'s network fully and an executive who wants it done now. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso is acquiring Northwind Software, a company of 300 people with its own cloud accounts, tools and habits. The chief executive wants the two companies connected within eight weeks so that Northwind staff can use Contoso systems and the sales teams can share data.',
      'The case tests the role: ranking risks across two organisations, spending limited effort, finding what is really in the other company\'s environment, standing firm on a "full trust" request, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks of connecting the two companies',
        intro: 'A first review found five risks. Rank them by the damage they could do once the companies are connected, highest first.',
        items: [
          { id: 'x1', source: 'Trust', priority: 1, text: 'The plan connects Northwind\'s network and identity system to Contoso\'s with full two-way trust from day one.', why: 'A compromise in the smaller, less known company would reach Contoso\'s crown jewels directly.' },
          { id: 'x2', source: 'Unknown estate', priority: 2, text: 'Nobody has a list of what runs at Northwind or who administers it.', why: 'You cannot decide what to connect without knowing what is there.' },
          { id: 'x3', source: 'Identity', priority: 3, text: 'Northwind staff share some administrator accounts and 40 people have not signed in with a second factor in a year.', why: 'A weak identity system that is about to be joined to a strong one.' },
          { id: 'x4', source: 'Data', priority: 4, text: 'Northwind holds customer data of unknown sensitivity in a mix of tools, and no data owner is named.', why: 'A genuine duty of care. It matters once you know where the data is.' },
          { id: 'x5', source: 'Branding', priority: 5, text: 'Staff at Northwind still use the old company logo on internal tools.', why: 'No security impact.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work before the companies are connected.',
        items: [
          { id: 'y1', source: 'Discovery', ideal: 3, text: 'Find out what runs at Northwind, who owns it, and where the customer data is.', why: 'Everything else depends on it, and it takes real chasing.' },
          { id: 'y2', source: 'Boundary', ideal: 3, text: 'Design a controlled connection: separate networks, access only to named systems, and identity federation with limits.', why: 'The core design work that replaces "full trust".' },
          { id: 'y3', source: 'Identity', ideal: 3, text: 'Remove shared administrator accounts at Northwind and require a second factor for everyone before they join Contoso systems.', why: 'The identity gap is the quickest route in.' },
          { id: 'y4', source: 'Monitoring', ideal: 1, text: 'Send Northwind\'s logs to Contoso\'s central logging and add alerts for the connection.', why: 'Valuable, and relatively quick once the design is known.' },
        ],
      },
      {
        id: 'estate', type: 'evidence', title: 'Find out what is really in the Northwind environment',
        intro: 'You have the first discovery report and the integration plan. Check them for what matters. Flag only what the records support.',
        clues: {
          shared: { strength: 'strong', text: 'Northwind has three shared administrator accounts, one of which was used from a country where it has no staff.' },
          mfa: { strength: 'strong', text: '40 of the 300 staff, including 11 administrators, have no second factor on their accounts.' },
          legacy: { strength: 'strong', text: 'A server running an out-of-support operating system holds customer contracts and is reachable from the internet.' },
          trust: { strength: 'strong', text: 'The integration plan gives Northwind\'s administrators rights in Contoso\'s directory from day one.' },
          size: { strength: 'weak', text: 'Northwind has 300 staff, a fifth of Contoso\'s size.' },
        },
        artefacts: [
          {
            id: 'report', title: 'Discovery report',
            lines: [
              { id: 'z1', type: 'clue', clue: 'shared', text: 'Administrator accounts: nwadmin, nw-support, dbadmin (each shared by 3 to 6 people). Sign-in on 9 October: nw-support from 198.51.100.91, a hosting provider address outside the company\'s countries', note: 'Shared accounts cannot be traced to a person, and one has been used from somewhere unexpected. This needs investigating before anything is connected.' },
              { id: 'z2', type: 'clue', clue: 'mfa', text: 'Second factor enabled: 260 of 300 accounts, including 14 of 25 administrators. 11 administrators have none', note: 'The most powerful accounts are among the least protected.' },
              { id: 'z3', type: 'clue', clue: 'legacy', text: 'Server NW-FS-02: operating system out of support since 2023. Holds customer contracts. Open to the internet on remote access ports', note: 'Customer data on an unsupported, internet-facing server. This is exposed now, before any connection.' },
              { id: 'z4', type: 'herring', text: 'Northwind passed an external audit of its quality processes last year', note: 'A quality audit is not a security assessment.' },
              { id: 'z5', type: 'herring', text: 'The Northwind IT manager has been in post for 11 years', note: 'Experience is welcome. It does not say what is installed.' },
            ],
          },
          {
            id: 'plan', title: 'The integration plan',
            lines: [
              { id: 'z6', type: 'clue', clue: 'trust', text: 'Plan, step 3: "Add the Northwind administrators group to Contoso\'s Domain Admins and open all internal networks in both directions, to simplify migration"', note: 'This is full trust. Anyone who compromises a Northwind account gets Contoso\'s most powerful rights.' },
              { id: 'z7', type: 'clue', clue: 'size', text: 'Headcount: Northwind 300, Contoso 1,500', note: 'Size is context. It does not change what has to be done.' },
              { id: 'z8', type: 'herring', text: 'The plan runs to 41 pages and was written by an external consultancy', note: 'Length and authorship say nothing about safety.' },
              { id: 'z9', type: 'herring', text: 'The deal announcement describes "one team, one network"', note: 'A slogan. It does not make full trust a safe design.' },
              { id: 'z10', type: 'plain', text: 'Connection date in the plan: 8 weeks from today', note: 'The time available.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the chief executive wants "one network"',
        intro: 'The chief executive says: "We told the market it is one company in eight weeks. Do not slow this down with security. Give them access to everything now, and we can tidy up afterwards."',
        prompt: 'What do you do?',
        options: [
          { id: 'stage', quality: 3, text: 'Give the chief executive a staged plan that still meets the date for what the business needs: day-one access for Northwind staff to email, calendar and a few named systems through a controlled connection; fix the shared administrators, second factor and the exposed server first; and widen access in steps as each part is made safe', set: { stage: true }, consequence: 'The announcement date is met in substance: staff can work together on day one. The widest access arrives over three months, as each area passes its checks.' },
          { id: 'timebox', quality: 2, text: 'Agree to full trust for a fixed 60 days, with executive sign-off and a dated commitment to replace it', set: { timebox: true }, consequence: 'Everyone can work. Sixty days becomes five months, and an attacker uses the shared nw-support account during the window.' },
          { id: 'refuse', quality: 1, text: 'Refuse to connect anything until Northwind meets Contoso\'s full security standard', set: { refuse: true }, consequence: 'The date slips by four months and the business finds its own ways to share data in the meantime.' },
          { id: 'agree', quality: 0, text: 'Agree. It is a business decision and you have flagged the concerns', set: { agree: true }, consequence: 'Within weeks, the compromised shared account is used to reach Contoso\'s directory from the internet.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft update for the board',
        intro: 'A colleague has drafted the update.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The integration plan as drafted would give Northwind\'s administrators rights in Contoso\'s directory from day one.', why: 'Supported by the plan.' },
          { id: 'j2', sound: false, text: 'Northwind has already been breached and Contoso must not proceed.', why: 'Unsupported. One shared account was used from an unexpected address, which needs investigating, not a conclusion.' },
          { id: 'j3', sound: false, text: 'Northwind\'s quality certification shows its systems are secure.', why: 'A quality audit is not a security assessment.' },
          { id: 'j4', sound: true, text: 'A server holding customer contracts is out of support and reachable from the internet.', why: 'Supported by the discovery report.' },
          { id: 'j5', sound: false, text: 'The chief executive is putting the company at risk.', why: 'A judgement about a colleague. State the risk and the alternative.' },
          { id: 'j6', sound: true, text: 'A controlled connection with named systems can meet the date for what the business needs on day one.', why: 'A workable alternative.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'The draft integration plan gives Northwind administrators rights in Contoso\'s directory from day one with all networks open in both directions.', why: 'Shown by the plan.' },
          { id: 'q2', correct: true, text: 'Northwind has shared administrator accounts, 11 administrators without a second factor and an out-of-support, internet-facing server holding customer contracts.', why: 'Shown by the discovery report.' },
          { id: 'q3', correct: true, text: 'One shared account was used from an unexpected address on 9 October, and it is not yet known what was done with it.', why: 'An honest statement of the limit.' },
          { id: 'q4', correct: true, text: 'Staff can work together on day one through a controlled connection while the larger issues are fixed.', why: 'An accurate, positive statement.' },
          { id: 'q5', correct: false, text: 'Northwind\'s customer data has been stolen.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'Northwind\'s IT team has been negligent.', why: 'A judgement about people.' },
          { id: 'q7', correct: false, text: 'The acquisition should not go ahead.', why: 'Not what the evidence supports.' },
          { id: 'q8', when: 'stage', correct: true, text: 'A staged plan meets the date for what the business needs on day one, with the shared accounts, second factor and the exposed server fixed first and wider access added in steps.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'timebox', correct: true, text: 'Full trust was agreed for 60 days, the end date slipped, and an attacker used the shared account during the window.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'Connection was refused until Northwind met the full standard, and the date slipped by four months.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'Full trust was agreed with concerns noted, and the compromised shared account was used to reach Contoso\'s directory.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Investigate the use of nw-support from the unexpected address, and replace the shared administrator accounts with named ones.', why: 'Deals with the live concern and the identity gap.' },
          { id: 'a2', correct: true, text: 'Require a second factor for every Northwind account before it joins any Contoso system, and take NW-FS-02 off the internet.', why: 'Closes the quickest routes in.' },
          { id: 'a3', correct: true, text: 'Build a controlled connection to named systems and widen it in steps, with monitoring on the link.', why: 'Meets the business need safely.' },
          { id: 'a4', correct: false, text: 'Give Northwind administrators Domain Admin rights to simplify migration.', why: 'Full trust, which is the central risk.' },
          { id: 'a5', correct: false, text: 'Delay the whole integration for a year.', why: 'Out of proportion.' },
        ],
      },
    ],
  },
];
