// Senior Network Security simulations. Everything here is fictional. IP addresses come from the
// reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24) and private ranges.
//
// The tier's themes: cutting a large network into zones without breaking the business, treating remote
// access as a front door, and holding a line when a supplier, a deadline or a senior person asks
// for a hole in the perimeter.

const RATINGS = [
  { name: 'Flat and exposed', blurb: 'Zones stayed open, the perimeter was loosened, or changes were rushed. Read each stage note: the design is the control.' },
  { name: 'Patching the perimeter', blurb: 'You closed real gaps, with gaps of your own in priorities, evidence or rollout.' },
  { name: 'Network lead', blurb: 'Sound priorities, zones matched to real risk, and a rollout the business can live with.' },
  { name: 'Network architect', blurb: 'A design that limits the spread of any single failure, effort spent where it counts, and the judgement to say no safely.' },
];

export const NETWORK_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'segmentation-programme',
    title: 'Cutting the network into zones',
    skill: 'hardening',
    minutes: 22,
    blurb: 'Contoso\'s office network is one big space where every device can reach every server. Work out which zones to build first, check what the traffic shows and roll it out without a Monday morning outage.',
    brief: [
      'Contoso has grown from one office to four, and the network grew with it. Today, a laptop in the sales team can open a connection to the finance database, the door-entry system and the factory-floor controllers.',
      'You are the senior network security engineer. You will rank which separations matter most, check the traffic records, spend a limited budget of engineer-weeks, decide how to roll out the new rules, and check the plan before it goes to the directors.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the separations',
        intro: 'Tap the separations in order, the most important first. Think about what an intruder on an ordinary laptop could reach today, how bad it would be, and how hard each is to build.',
        items: [
          { id: 'z1', source: 'Factory floor', priority: 1, text: 'The factory-floor controllers, which run the production machines, can be reached from every office laptop.', why: 'A compromise in the office could stop production or damage equipment. These systems cannot be patched quickly, so keeping them off the main network matters most.' },
          { id: 'z2', source: 'Finance', priority: 2, text: 'The finance database and payment systems can be reached from any device on any site.', why: 'The data an attacker most wants, reachable by anyone who gets onto one laptop.' },
          { id: 'z3', source: 'Servers', priority: 3, text: 'Ordinary users can open administrative connections (remote desktop and shell) to servers.', why: 'The tools attackers use to move around are open to everyone. Closing them to a small admin network removes a large part of the risk.' },
          { id: 'z4', source: 'Guest', priority: 4, text: 'Guest wireless shares a network with staff laptops at two sites.', why: 'A real risk, but the fix is well understood and the guests reach less than the staff network does.' },
          { id: 'z5', source: 'Printers', priority: 5, text: 'Printers and meeting-room screens are on the same network as the laptops.', why: 'Untidy, and they can be a minor foothold. They hold little of value.' },
        ],
      },
      {
        id: 'traffic', type: 'evidence', title: 'Check what the traffic records show',
        intro: 'You have a month of flow records between the office network and the key systems. Look for facts that decide the design. Flag only what the records support.',
        clues: {
          nolegit: { strength: 'strong', text: 'Of 4.1 million connections to the factory controllers last month, only three source addresses were involved, all belonging to the engineers\' workstations.' },
          finance: { strength: 'strong', text: 'The finance database was reached by 14 devices in finance and by 212 devices elsewhere, which opened a connection once or twice each and never completed a login.' },
          admin: { strength: 'strong', text: 'Remote administration connections to servers came from 2,300 different workstations, though only 9 people are administrators.' },
          scan: { strength: 'strong', text: 'One office laptop made 11,000 connection attempts to other devices in one night, which matches a scan.' },
          printers: { strength: 'weak', text: 'Printers talk to laptops on the print ports and to the internet for updates.' },
        },
        artefacts: [
          {
            id: 'ot', title: 'Flows to the factory controllers',
            lines: [
              { id: 'f1', type: 'clue', clue: 'nolegit', text: 'Destination: factory controller subnet. Source addresses seen last month: 3 (engineering workstations ENG-04, ENG-05, ENG-11). Connections: 4.1 million', note: 'Only three machines ever need to reach them. Everything else can be blocked without anyone noticing.' },
              { id: 'f2', type: 'clue', clue: 'scan', text: 'Source SALES-LT-0338: 11,000 connection attempts to 2,400 internal addresses between 01:10 and 01:40, mostly refused', note: 'A single laptop probing the network at night looks like scanning, by malware or by a person. It is exactly what a flat network invites.' },
              { id: 'f3', type: 'herring', text: 'Average round-trip time to the controllers: 3 ms', note: 'A performance figure with no bearing on security.' },
              { id: 'f4', type: 'herring', text: 'The controllers\' vendor logo is on the door of the control room', note: 'No finding.' },
              { id: 'f5', type: 'plain', text: 'Controllers cannot be patched without a production stop, planned twice a year', note: 'Why they should be kept off the general network.' },
            ],
          },
          {
            id: 'it', title: 'Flows to finance and to servers',
            lines: [
              { id: 'f6', type: 'clue', clue: 'finance', text: 'Destination: finance database. Sources: 14 finance devices (all completed logins); 212 other devices (opened a connection, no login)', note: '212 devices outside finance reach it and have no business purpose. They are probing or being probed.' },
              { id: 'f7', type: 'clue', clue: 'admin', text: 'Remote administration (ports 3389 and 22) to servers: 2,300 distinct sources. Accounts with admin rights: 9', note: 'The tools that attackers use to move around are open from nearly every machine.' },
              { id: 'f8', type: 'clue', clue: 'printers', text: 'Printers: print ports from 1,900 laptops; updates from the vendor over the internet', note: 'Expected. A minor finding that needs tidying, not urgent.' },
              { id: 'f9', type: 'herring', text: 'Peak network usage is 4 pm on Thursdays', note: 'A capacity figure, not a security one.' },
              { id: 'f10', type: 'plain', text: 'Monthly flow records are kept for 90 days', note: 'Enough to plan from.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next quarter.',
        items: [
          { id: 'e1', source: 'Factory floor', ideal: 3, text: 'Put the controllers in their own zone, reachable only from the three engineering workstations through a monitored gateway.', why: 'The most dangerous system on the network, and a careful change, so it takes real effort.' },
          { id: 'e2', source: 'Finance', ideal: 2, text: 'Zone finance systems and allow only finance devices and named administrators.', why: 'High value and well understood.' },
          { id: 'e3', source: 'Admin access', ideal: 3, text: 'Move all remote administration to a small admin network with jump hosts and multi-factor sign-in, and block it from everywhere else.', why: 'Removes the attacker\'s main tool across the whole estate. It needs the most effort.' },
          { id: 'e4', source: 'Monitoring', ideal: 2, text: 'Alert on connections that break the new zones, and on scanning from any device.', why: 'Shows the rules are working and catches the next scan.' },
        ],
      },
      {
        id: 'rollout', type: 'decision', title: 'Decide: how to roll out the rules',
        intro: 'The operations manager says: "Production cannot stop. If you break the factory network I will have to override you. Can we just switch it on over a weekend?"',
        prompt: 'What do you do?',
        options: [
          { id: 'monitor', quality: 3, text: 'Switch the new rules on in monitoring mode first, so they log what they would block without blocking it; fix the genuine dependencies with the operations team; then enforce zone by zone, factory floor in a planned maintenance window with a tested rollback', set: { monitor: true }, consequence: 'The monitoring mode finds two forgotten dependencies, which are fixed. The factory zone goes in during a planned window and nobody notices on Monday.' },
          { id: 'weekend', quality: 2, text: 'Enforce everything over the weekend, as asked, with a rollback plan', set: { weekend: true }, consequence: 'It works for most things. A forgotten backup job from the factory to the file server breaks, and the rollback is used for the whole factory zone.' },
          { id: 'paper', quality: 1, text: 'Write the policy and ask each site to follow it', set: { paper: true }, consequence: 'Two sites follow it in part. The factory floor remains reachable from every laptop.' },
          { id: 'skipot', quality: 0, text: 'Leave the factory floor alone because it is too risky to touch, and segment the rest', set: { skipot: true }, consequence: 'The most dangerous system is the only one left exposed, and the operations manager takes it as proof it can stay that way.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the directors',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Only three workstations ever connect to the factory controllers, but every office laptop can reach them.', why: 'Supported by the flow records.' },
          { id: 'p2', sound: false, text: 'The sales laptop that scanned the network has been taken over by an attacker.', why: 'Unsupported. The records show scanning, not who or what caused it.' },
          { id: 'p3', sound: false, text: 'A good firewall at the edge means the internal network does not need zones.', why: 'The edge does nothing about a compromised laptop inside.' },
          { id: 'p4', sound: true, text: '2,300 workstations make remote administration connections to servers although only nine people are administrators.', why: 'Supported by the flow records.' },
          { id: 'p5', sound: false, text: 'Segmentation will stop all attacks on the company.', why: 'Overstated. It limits how far an attack can spread.' },
          { id: 'p6', sound: true, text: 'Running the new rules in monitoring mode first will show what depends on the old access before anything is blocked.', why: 'Well founded and the safe way to roll out.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the directors',
        intro: 'Your own summary. Include what the records support and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Every office laptop can reach the factory controllers, although only three workstations ever do.', why: 'Shown by the flow records.' },
          { id: 'r2', correct: true, text: '212 devices outside finance connect to the finance database without ever logging in.', why: 'Shown by the flow records.' },
          { id: 'r3', correct: true, text: 'Remote administration is open from 2,300 workstations, and one laptop scanned the internal network for half an hour one night.', why: 'Shown by the records.' },
          { id: 'r4', correct: true, text: 'The records do not show that any of this access has been abused, and the cause of the night-time scan is not yet known.', why: 'An honest statement of what is and is not known.' },
          { id: 'r5', correct: false, text: 'Production has already been attacked.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The network team built this carelessly.', why: 'A judgement about people. The network grew with the business.' },
          { id: 'r7', correct: false, text: 'Zones will make the network impossible to break into.', why: 'Overstated.' },
          { id: 'r8', when: 'monitor', correct: true, text: 'The rules ran in monitoring mode first, two forgotten dependencies were fixed, and zones were enforced one at a time, with the factory floor in a planned window.', why: 'An accurate record of a sound approach.' },
          { id: 'r9', when: 'weekend', correct: true, text: 'All rules were enforced in one weekend, a backup job from the factory broke, and the factory zone was rolled back.', why: 'An honest account of the cost of rushing.' },
          { id: 'r10', when: 'paper', correct: true, text: 'A policy was issued and sites followed it in part, and the factory floor is still reachable from every laptop.', why: 'An honest account of what a policy delivered.' },
          { id: 'r11', when: 'skipot', correct: true, text: 'The factory floor was left out because it was judged too risky to change, and it is the most exposed system.', why: 'An honest record of a gap.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Put the factory controllers and finance systems in their own zones, and allow only the devices that need them.', why: 'Protects the most valuable and most fragile systems.' },
          { id: 'a2', correct: true, text: 'Move administration to a small admin network with jump hosts and multi-factor sign-in.', why: 'Removes the attacker\'s main route.' },
          { id: 'a3', correct: true, text: 'Run rules in monitoring mode before enforcing them, and alert on connections that break the zones.', why: 'Safe rollout and early warning.' },
          { id: 'a4', correct: false, text: 'Block all traffic between sites.', why: 'Out of proportion and would stop the business.' },
          { id: 'a5', correct: false, text: 'Wait for an incident to justify the work.', why: 'The exposure is already real.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'net-senior-exam',
    title: 'Promotion exam: Senior Network Security Engineer',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A new site, a supplier who wants a door left open and an executive who backs them. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso is opening a new distribution centre in six weeks. A supplier that runs its conveyor system wants permanent remote access from the internet to maintain it, and the operations director has promised them it will be in place for opening day.',
      'The case tests the role: ranking risks, spending limited effort, finding what is really exposed, standing firm when a senior person asks for a hole in the perimeter, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks in the new site design',
        intro: 'A first review of the draft design found five risks. Rank them by the damage they could do once the site is live, highest first.',
        items: [
          { id: 'x1', source: 'Supplier access', priority: 1, text: 'The supplier asks for a permanent, open remote desktop connection from the internet to the conveyor control network, protected only by a shared password.', why: 'A permanent door into the system that moves the goods, with one shared password. It is the most attacked kind of access.' },
          { id: 'x2', source: 'Zoning', priority: 2, text: 'The conveyor controllers, warehouse management servers and office laptops share a single network.', why: 'Anything that reaches the office can reach the controllers. The design needs separating before the site opens.' },
          { id: 'x3', source: 'Wi-fi', priority: 3, text: 'Handheld scanners connect over a wireless network that uses a shared password printed on the wall.', why: 'A real weakness with a well-known fix, though it reaches less than the first two.' },
          { id: 'x4', source: 'Monitoring', priority: 4, text: 'No logging or alerting is planned for the site network until six months after opening.', why: 'You would not see an attack. Important, but dependent on the access and zoning decisions.' },
          { id: 'x5', source: 'Addressing', priority: 5, text: 'The address plan for the new site overlaps with one at the head office.', why: 'An annoyance that causes routing problems. It is not a security exposure.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work before opening day.',
        items: [
          { id: 'y1', source: 'Supplier access', ideal: 3, text: 'Design a safe route for the supplier: individual accounts, multi-factor sign-in, access only when requested and approved, and recorded sessions.', why: 'The supplier does need access. Doing it safely is a proper piece of work.' },
          { id: 'y2', source: 'Zoning', ideal: 4, text: 'Separate the conveyor controllers, warehouse servers, office devices and wireless scanners into zones with only the connections each needs.', why: 'The structural fix, and the largest piece of work.' },
          { id: 'y3', source: 'Wi-fi', ideal: 1, text: 'Move scanners to individual device credentials or certificates instead of a shared password.', why: 'A quick, well-understood improvement.' },
          { id: 'y4', source: 'Monitoring', ideal: 2, text: 'Collect logs from firewalls and the remote access gateway, and alert on use outside the agreed windows.', why: 'Gives early warning and a record of what the supplier does.' },
        ],
      },
      {
        id: 'design', type: 'evidence', title: 'Find what is really exposed in the draft design',
        intro: 'You have the draft network plan and the supplier\'s request. Check them for the gaps that matter. Flag only what the documents support.',
        clues: {
          open: { strength: 'strong', text: 'The plan opens remote desktop from any internet address to the control network, with one shared account and no second factor.' },
          flat: { strength: 'strong', text: 'The office, the warehouse servers and the conveyor controllers are on a single subnet.' },
          history: { strength: 'strong', text: 'The supplier\'s own network was reported as compromised by a security news site two months ago.' },
          nolog: { strength: 'strong', text: 'The remote access gateway has no session recording or logging planned.' },
          wifi: { strength: 'weak', text: 'Scanners use a shared wireless password.' },
        },
        artefacts: [
          {
            id: 'plan', title: 'Draft network plan',
            lines: [
              { id: 'd1', type: 'clue', clue: 'flat', text: 'Subnet 10.40.0.0/22: office laptops, warehouse management servers, conveyor controllers, printers, scanners', note: 'One zone for everything. A laptop compromise is also a controller compromise.' },
              { id: 'd2', type: 'clue', clue: 'nolog', text: 'Remote access gateway: logging "to be enabled in phase 2". Session recording: not planned', note: 'You would have no record of what the supplier, or anyone using their password, did.' },
              { id: 'd3', type: 'clue', clue: 'wifi', text: 'Scanner wireless network "WH-SCAN": WPA2, passphrase on the wall poster in each aisle', note: 'A shared passphrase that everyone who passes can read. Real, but smaller than the other gaps.' },
              { id: 'd4', type: 'herring', text: 'Internet connection: two links from different providers', note: 'Resilience, not security.' },
              { id: 'd5', type: 'plain', text: 'Opening date: 6 weeks away; supplier on site for commissioning in 3 weeks', note: 'The time available for the fixes.' },
            ],
          },
          {
            id: 'supplier', title: 'The supplier\'s request',
            lines: [
              { id: 'd6', type: 'clue', clue: 'open', text: 'Request: "Permanent inbound remote desktop to the controller VLAN from our support network (any address), one account \'support\', password shared with our engineers"', note: 'A permanent open door with a shared credential. It is the commonest way into industrial systems.' },
              { id: 'd7', type: 'clue', clue: 'history', text: 'Security news, 2 months ago: "Conveyor-systems supplier confirms customer access credentials may have been taken in a breach"', note: 'Credentials for customer networks may already be in an attacker\'s hands. A permanent shared password is the worst thing to depend on.' },
              { id: 'd8', type: 'herring', text: 'The supplier holds an industry quality certification', note: 'Not about security.' },
              { id: 'd9', type: 'herring', text: 'The supplier has supported Contoso\'s other site for four years without incident', note: 'A good record, but it says nothing about the current state of their network.' },
              { id: 'd10', type: 'plain', text: 'The supplier says it needs access for faults at any hour', note: 'A real need that can be met safely.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the operations director has promised the supplier',
        intro: 'The operations director says: "I have promised them access for opening day, and I will not look foolish. Open the port and we will tighten it up later."',
        prompt: 'What do you do?',
        options: [
          { id: 'safe', quality: 3, text: 'Say yes to access and no to the open port: offer the supplier named accounts with multi-factor sign-in through a controlled gateway that is switched on when they request it and approved, with sessions recorded, ready for commissioning in three weeks; and give the director a short written explanation they can show the supplier', set: { safe: true }, consequence: 'The supplier is able to work from the first day of commissioning. The director has a reasonable answer for them, and the controllers are never exposed to the internet.' },
          { id: 'temp', quality: 2, text: 'Open the port for the commissioning period only, with a dated commitment to replace it with the controlled route before opening day', set: { temp: true }, consequence: 'The supplier works. The controllers are exposed for three weeks, and the replacement slips to week eight.' },
          { id: 'refuse', quality: 1, text: 'Refuse any remote access until the site has been open for three months', set: { refuse: true }, consequence: 'The supplier cannot commission the conveyors, the opening slips, and the director escalates over your head.' },
          { id: 'agree', quality: 0, text: 'Agree. Operations knows the business and the supplier is trusted', set: { agree: true }, consequence: 'The port is scanned within hours of going live. Three weeks later, someone signs in as "support" at 03:00 and stops a conveyor.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft update for the leadership team',
        intro: 'A colleague has drafted the update.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The supplier has asked for a permanent open remote desktop connection to the controller network using one shared account with no second factor.', why: 'Supported by the request.' },
          { id: 'j2', sound: false, text: 'The supplier\'s credentials have definitely been stolen.', why: 'Unsupported. The news report says they may have been.' },
          { id: 'j3', sound: false, text: 'The design is safe because the site has two internet links.', why: 'Two links do nothing for security.' },
          { id: 'j4', sound: true, text: 'The office, warehouse servers and conveyor controllers share a single network in the draft design.', why: 'Supported by the plan.' },
          { id: 'j5', sound: false, text: 'The operations director is acting recklessly.', why: 'A judgement about a colleague. State the risk and the alternative.' },
          { id: 'j6', sound: true, text: 'A controlled gateway with named accounts and recorded sessions can give the supplier the access they need.', why: 'A sound and workable alternative.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the leadership team',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'The supplier has asked for a permanent open remote desktop connection to the controller network with a shared password.', why: 'Shown by the request.' },
          { id: 'q2', correct: true, text: 'The draft design puts the controllers, warehouse servers and office devices on one network.', why: 'Shown by the plan.' },
          { id: 'q3', correct: true, text: 'The supplier reported a breach two months ago that may have exposed customer access credentials, and the extent is not yet known.', why: 'An honest statement of what is and is not known.' },
          { id: 'q4', correct: true, text: 'No logging or session recording is planned for the remote access gateway.', why: 'Shown by the plan.' },
          { id: 'q5', correct: false, text: 'The supplier is a risk to Contoso and should be dropped.', why: 'Unsupported. Safe access is possible.' },
          { id: 'q6', correct: false, text: 'The site cannot open on time.', why: 'Overstated. The safe route fits in the available time.' },
          { id: 'q7', correct: false, text: 'The conveyors will be attacked.', why: 'Unsupported. It is a risk to remove, not a prediction.' },
          { id: 'q8', when: 'safe', correct: true, text: 'The supplier will use named accounts with multi-factor sign-in through a controlled gateway, switched on on request, with sessions recorded, from the first day of commissioning.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'temp', correct: true, text: 'The port was opened for commissioning with a dated commitment to replace it, and the replacement slipped to week eight.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'Remote access was refused, commissioning was blocked and the opening date slipped.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'The port was opened to the internet with a shared password and was used by an unknown party three weeks later.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Give the supplier named, multi-factor, request-and-approve access through a controlled gateway with recorded sessions.', why: 'Meets the need safely.' },
          { id: 'a2', correct: true, text: 'Separate the controllers, warehouse servers, office and scanners into zones before opening day.', why: 'Limits how far any single problem can spread.' },
          { id: 'a3', correct: true, text: 'Ask the supplier about the breach and whether the credentials they hold for Contoso need to be replaced.', why: 'Finds out the real position.' },
          { id: 'a4', correct: false, text: 'Open the port and trust the supplier.', why: 'The exposure is the problem.' },
          { id: 'a5', correct: false, text: 'Run the site without remote access for the first year.', why: 'Out of proportion and unworkable.' },
        ],
      },
    ],
  },
];
