// Network Security simulations. Everything here is fictional. IP addresses come from the reserved
// documentation ranges (203.0.113.0/24, 198.51.100.0/24) and private ranges (10.x) that belong to no
// real network.
//
// The path teaches how to think about a network: who should be able to talk to whom, how to read the
// rules and traffic that tell you who actually does, and how to change a network that is already in use
// without breaking the business.

const RATINGS = [
  { name: 'Wide open', blurb: 'The network stayed flat, or changes were rushed or ignored. Read each stage note: network security is mostly deciding what should not be allowed.' },
  { name: 'Patching holes', blurb: 'You closed real gaps, with gaps of your own in priorities, evidence or how you made the change.' },
  { name: 'Network engineer', blurb: 'Sound priorities, rules based on what traffic is needed, and changes made safely and honestly reported.' },
  { name: 'Network architect', blurb: 'Well-judged zones, rules and rollout, checked against the evidence, with reporting leadership can act on.' },
];

export const NETWORK = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'flat-network',
    title: 'The flat network',
    skill: 'data',
    minutes: 18,
    blurb: 'Everything at Contoso Manufacturing can talk to everything. Decide what to separate first, check how bad it really is, and plan a change the plant can live with.',
    brief: [
      'Contoso Manufacturing grew quickly, and its network grew with it. Staff laptops, servers, the finance database, the plant\'s cameras, the building controls and the guest Wi-Fi all sit on one big routed network. A recent penetration test described it as "flat": once you are on it, you can reach nearly everything.',
      'You have just joined as the network security engineer. You will rank what to separate first, check the evidence for how exposed things really are, decide how to make the change without stopping production, and review the design proposal before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to separate first',
        intro: 'Tap the problems in order, the most important to separate first. Think about who could reach what, how bad it would be, and how easy it is to do.',
        items: [
          { id: 'n1', source: 'Guest Wi-Fi', priority: 1, text: 'Visitors\' devices on the guest Wi-Fi can reach the finance servers.', why: 'Untrusted devices next to the most valuable systems, and it can be blocked straight away with no impact on staff.' },
          { id: 'n2', source: 'Web servers', priority: 2, text: 'The internet-facing web servers sit on the same network as the database and staff laptops, with no buffer zone in between.', why: 'If a web server is compromised, nothing stops the attacker reaching everything behind it. A separate zone for exposed servers is a core design rule.' },
          { id: 'n3', source: 'Plant', priority: 3, text: 'CCTV cameras and building controls share the staff network and still use their default passwords.', why: 'Poorly protected devices that rarely get updates. They are a common foothold, so they belong in their own isolated zone.' },
          { id: 'n4', source: 'Test lab', priority: 4, text: 'The test lab, where engineers run unfinished software, shares the production network.', why: 'A real risk, but the lab holds no customer data and the systems are not exposed. It follows the more urgent separations.' },
          { id: 'n5', source: 'Printers', priority: 5, text: 'Office printers can talk to every server.', why: 'Printers rarely need to reach servers, and it is worth tidying up, but it is low risk and low impact.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Check how bad it really is',
        intro: 'The plant manager doubts the penetration test. Look at the network\'s own records and work out what is really reachable. Flag only what the records support.',
        clues: {
          guest: { strength: 'strong', text: 'The guest Wi-Fi VLAN is routed to the server VLAN with no access list between them.' },
          db: { strength: 'strong', text: 'Any device on any VLAN can reach the finance database port.' },
          mgmt: { strength: 'strong', text: 'The management interfaces of the switches can be reached from every VLAN.' },
          cams: { strength: 'strong', text: 'The cameras sit on the staff VLAN and still use the manufacturer\'s default login.' },
          nonac: { strength: 'weak', text: 'There is no network access control: any device plugged into a wall port gets an address.' },
        },
        artefacts: [
          {
            id: 'routing', title: 'Routing and access lists',
            lines: [
              { id: 'e1', type: 'clue', clue: 'guest', text: 'Core router: VLAN 40 (guest Wi-Fi) routed to VLAN 10 (servers); ACLs applied: none', note: 'Nothing stops a guest device sending traffic to the servers. This is the sharpest finding because it is both dangerous and easy to fix.' },
              { id: 'e2', type: 'clue', clue: 'db', text: 'Firewall log (sample): 10.30.4.17 (a staff laptop), 10.60.2.9 (a camera) and 10.40.8.3 (guest) all connected to FINDB01 on tcp/1433 yesterday', note: 'A camera and a guest device can reach the finance database. There is no reason for either to.' },
              { id: 'e3', type: 'herring', text: 'Core switch uptime: 410 days', note: 'A long uptime is a patching concern, but it says nothing about which devices can reach which.' },
              { id: 'e4', type: 'herring', text: 'Link utilisation: core uplink 22%', note: 'Capacity is fine, and has no bearing on the question.' },
            ],
          },
          {
            id: 'devices', title: 'Device and management records',
            lines: [
              { id: 'e5', type: 'clue', clue: 'mgmt', text: 'Switch management (SSH/HTTPS): reachable from 10.30.0.0/16, 10.40.0.0/16 and 10.60.0.0/16 (staff, guest, cameras)', note: 'Anyone who can reach a switch\'s management page can try to take it over. Management should only be reachable from a small admin network.' },
              { id: 'e6', type: 'clue', clue: 'cams', text: 'Inventory: 14 cameras on VLAN 30 (staff); credentials unchanged since install; firmware from 2021', note: 'Cameras on the staff network with default passwords are an easy foothold.' },
              { id: 'e7', type: 'clue', clue: 'nonac', text: 'Switch port config: 802.1X/NAC not enabled on access ports', note: 'Anyone who plugs in gets on the network. A weakness, but it does not show what the network allows once someone is on.' },
              { id: 'e8', type: 'herring', text: 'Guest Wi-Fi uses WPA3 with a rotating password', note: 'Good practice for the wireless link itself. It does not control where guests can go once connected.' },
              { id: 'e9', type: 'herring', text: 'Firewall firmware: current release', note: 'A well-kept firewall that has not been given the job of separating the internal zones.' },
            ],
          },
        ],
      },
      {
        id: 'plan', type: 'decision', title: 'Decide: how to make the change',
        intro: 'The plant manager says: "We cannot have any downtime. A stopped line costs us tens of thousands an hour. Whatever you do, do not break production."',
        prompt: 'How do you approach it?',
        options: [
          { id: 'phased', quality: 3, text: 'Phase it: block guest-to-internal first (no impact on staff), then build zones for servers, cameras and building controls in planned windows, running new rules in log-only mode first to find the legitimate traffic before enforcing them', set: { phased: true }, consequence: 'The most dangerous gap closes on day one with no downtime, and you learn what traffic is genuinely needed before anything can break. The plant manager is kept informed and trusts the plan.' },
          { id: 'bigbang', quality: 2, text: 'Rebuild the whole network over one weekend', set: { bigbang: true }, consequence: 'It is quick, but there is no time to test. Two production systems stop working on Monday because rules block traffic nobody knew about.' },
          { id: 'hardware', quality: 1, text: 'Buy a new, more powerful firewall and expect it to fix the problem', set: { hardware: true }, consequence: 'The new firewall sits at the edge. The internal network is still flat, because nothing tells it to separate the zones.' },
          { id: 'nothing', quality: 0, text: 'Leave the network as it is and add more antivirus on the laptops', set: { nothing: true }, consequence: 'Antivirus helps on laptops, but the cameras, building controls and the finance database are all still reachable from anywhere.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the design proposal',
        intro: 'A colleague, Dev, has drafted the proposal that goes to the board.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported, so Dev can fix it before it goes out.',
        statements: [
          { id: 'p1', sound: true, text: 'The guest Wi-Fi is routed to the server network with no access list, so isolating it is the first and quickest step.', why: 'Supported by the routing configuration.' },
          { id: 'p2', sound: false, text: 'Placing everything behind one firewall at the edge makes the internal network safe.', why: 'An edge firewall does nothing about traffic between internal devices. Internal zones need their own controls.' },
          { id: 'p3', sound: false, text: 'Creating separate VLANs will isolate the zones from each other.', why: 'A VLAN only splits a broadcast domain. If the router still routes between them with no rules, nothing is isolated.' },
          { id: 'p4', sound: true, text: 'New rules will run in log-only mode first so that legitimate traffic is identified before anything is blocked.', why: 'A sensible safeguard that avoids unexpected outages.' },
          { id: 'p5', sound: false, text: 'Once the network is segmented we will no longer need to monitor traffic.', why: 'Segmentation reduces what an attacker can reach, but monitoring is how you notice that they are trying.' },
          { id: 'p6', sound: true, text: 'The cameras and building controls will move to their own isolated zone with internet access removed where it is not needed.', why: 'Least privilege applied to devices that are hard to update.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports, be honest about the decisions made, and recommend sensible next steps.',
        statements: [
          { id: 's1', correct: true, text: 'The guest Wi-Fi network is routed to the server network with no access list, and any device can reach the finance database.', why: 'Shown by the routing and firewall records.' },
          { id: 's2', correct: true, text: 'Fourteen cameras sit on the staff network with their default passwords, and the switch management interfaces are reachable from every VLAN.', why: 'Shown by the inventory and the switch configuration.' },
          { id: 's3', correct: true, text: 'Nothing in the evidence shows that anyone has exploited these gaps. They are exposures, not a confirmed breach.', why: 'An honest statement of what is and is not known.' },
          { id: 's4', correct: true, text: 'The plan separates the network in stages, starting with the guest network, to avoid stopping production.', why: 'An accurate description of the approach.' },
          { id: 's5', correct: false, text: 'The network has already been breached.', why: 'Unsupported. You have gaps, not evidence of an attack.' },
          { id: 's6', correct: false, text: 'The IT team has been negligent.', why: 'A judgement about colleagues, not a finding. A network that grew quickly is a common situation.' },
          { id: 's7', correct: false, text: 'A new firewall alone will fix the problem.', why: 'Unsupported. The gaps are in internal rules and design.' },
          { id: 's8', when: 'phased', correct: true, text: 'The guest network was blocked first with no downtime, and the other zones are being built in planned windows with new rules tested in log-only mode first.', why: 'An accurate record of a sound approach.' },
          { id: 's9', when: 'bigbang', correct: true, text: 'The network was rebuilt over a single weekend, which caused two production systems to fail on Monday.', why: 'An honest account of the cost of rushing.' },
          { id: 's10', when: 'hardware', correct: true, text: 'A new firewall was bought, but the internal network remains flat because no zones or rules were designed.', why: 'An honest statement that spending did not change the exposure.' },
          { id: 's11', when: 'nothing', correct: true, text: 'No network changes were made, so the gaps remain open.', why: 'An honest record of inaction.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Block the guest network from all internal networks immediately and confirm it with a test.', why: 'The largest risk and the easiest fix.' },
          { id: 'a2', correct: true, text: 'Restrict switch management to a small admin network and change the default passwords on the cameras.', why: 'Closes two cheap, serious gaps.' },
          { id: 'a3', correct: true, text: 'Design zones for servers, exposed servers, plant devices and staff, with default-deny between them and logging on the rules.', why: 'The core design change, done with evidence.' },
          { id: 'a4', correct: false, text: 'Disconnect the plant from the network entirely.', why: 'Out of proportion and it would stop production.' },
          { id: 'a5', correct: false, text: 'Block all traffic between every device and then see what breaks.', why: 'It will break production. Learn the legitimate flows first.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'change-window',
    title: 'The urgent firewall request',
    skill: 'data',
    minutes: 20,
    blurb: 'Five firewall change requests are waiting and one of them is urgent. Rank them by risk, check the facts on the worst, decide, and make sure the approval record is honest.',
    brief: [
      'The network team gets a queue of firewall change requests, and each one is a decision about what the company will allow. Most are routine. Some are not.',
      'You are the network security engineer reviewing today\'s queue. You will rank the five requests by the risk they would add, investigate the most worrying one, decide what to approve and on what terms, check the written approval before it is filed, and report on the day.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'queue', type: 'prioritise', title: 'Rank the requests by risk',
        intro: 'Tap the requests in order, the one that would add the most risk first. Think about how wide the access is, who it is open to, and what it reaches.',
        items: [
          { id: 'c1', source: 'Partner', priority: 1, text: 'Allow the partner\'s whole address range (any port) to reach the customer database, "for a week while we test".', why: 'Wide access, to an entire external network, to the most valuable data. "Temporary" rules often stay forever.' },
          { id: 'c2', source: 'Developers', priority: 2, text: 'Open SSH from the internet to a development server so contractors can work from home.', why: 'An administration service exposed to the internet will be attacked within hours. It needs a VPN or an allow-list.' },
          { id: 'c3', source: 'Marketing', priority: 3, text: 'Allow the new email marketing service\'s addresses to send mail through the company mail relay.', why: 'A named service, one port and a clear purpose. Reasonable with the right logging.' },
          { id: 'c4', source: 'Finance', priority: 4, text: 'Allow two named finance PCs to reach the bank\'s payment portal on port 443.', why: 'Narrow, specific and for a business need. Low risk.' },
          { id: 'c5', source: 'Reception', priority: 5, text: 'Allow the new visitor sign-in tablet to reach its cloud service on port 443.', why: 'One device, one destination, one port. The easiest of the five.' },
        ],
      },
      {
        id: 'partner', type: 'evidence', title: 'Investigate the partner request',
        intro: 'The partner\'s account manager says it is "just a test, and it is the standard setup". Find out what the request would really allow and who is behind the address range. Flag only what the records support.',
        clues: {
          wide: { strength: 'strong', text: 'The requested source is a whole /16, about 65,000 addresses, not the partner\'s one test server.' },
          anyport: { strength: 'strong', text: 'The requested destination ports are "any", not the one port the database uses.' },
          shared: { strength: 'strong', text: 'The address range belongs to a hosting provider and is shared with other customers, not owned by the partner.' },
          noexpiry: { strength: 'strong', text: 'The request has no expiry date and no named owner, so nothing will remove the rule after the week.' },
          urgent: { strength: 'weak', text: 'The request was marked "urgent" by the partner\'s account manager, not by anyone at Contoso.' },
        },
        artefacts: [
          {
            id: 'ticket', title: 'The change request',
            lines: [
              { id: 'q1', type: 'clue', clue: 'wide', text: 'Source: 203.0.113.0/16 (partner). Destination: DB-CUST01. Service: any.', note: 'The source is a huge range, far beyond one test server. Anyone using the range could reach the database.' },
              { id: 'q2', type: 'clue', clue: 'anyport', text: 'Service: any (all ports and protocols)', note: 'The database needs one port. Opening all of them also exposes remote administration and anything else listening.' },
              { id: 'q3', type: 'clue', clue: 'noexpiry', text: 'Expiry: not set. Owner: blank. Business justification: "partner testing".', note: 'A rule with no end date and no owner is permanent by default. This is how "temporary" rules survive for years.' },
              { id: 'q4', type: 'herring', text: 'Change category: "standard"', note: 'The requester picked the category. It is not evidence that the request is routine.' },
            ],
          },
          {
            id: 'whois', title: 'Address ownership and history',
            lines: [
              { id: 'q5', type: 'clue', clue: 'shared', text: 'Registry lookup: 203.0.113.0/16 is allocated to a cloud hosting provider; thousands of customers use addresses in the range', note: 'Allowing the range lets any customer of that provider in, not just the partner.' },
              { id: 'q6', type: 'clue', clue: 'urgent', text: 'Email: "Urgent, please do today" from the partner\'s account manager', note: 'Pressure from outside. It tells you about the requester\'s hurry, not about the risk.' },
              { id: 'q7', type: 'herring', text: 'The partner contract was renewed last month', note: 'The business relationship is genuine, but that does not justify this rule.' },
              { id: 'q8', type: 'herring', text: 'DB-CUST01 backup completed last night', note: 'Good practice, but irrelevant to the request.' },
            ],
          },
        ],
      },
      {
        id: 'terms', type: 'decision', title: 'Decide: what to approve',
        intro: 'The partner\'s account manager phones: "We need this today or the test slips a week. It is a standard rule: just approve it."',
        prompt: 'What do you do?',
        options: [
          { id: 'narrow', quality: 3, text: 'Do not approve it as written. Offer a narrow rule instead: the partner\'s one named test address, only the database port, for seven days with a named owner, logging switched on and an automatic expiry', set: { narrow: true }, consequence: 'The test can go ahead today with a rule that is small, watched and self-removing. The partner gets what they actually need.' },
          { id: 'approve', quality: 2, text: 'Approve it as requested, because the partner is trusted', set: { approved: true }, consequence: 'The test works. So do scans from other customers of the hosting provider, and nobody removes the rule after the week.' },
          { id: 'refuse', quality: 1, text: 'Refuse and tell the partner to submit it through the normal process next month', set: { refused: true }, consequence: 'The contract is strained. Under pressure, the partner\'s team finds another route, which you do not control.' },
          { id: 'quiet', quality: 0, text: 'Approve it quietly and skip the logging so nobody asks questions', set: { quiet: true }, consequence: 'An open rule with no logs is the worst combination. If it is abused, you cannot even tell.' },
        ],
      },
      {
        id: 'record', type: 'review', title: 'Review the draft approval record',
        intro: 'A colleague has written the approval record that will be filed with the change.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'k1', sound: true, text: 'The original request asked for a whole /16 address range and every port to reach the customer database.', why: 'Supported by the ticket.' },
          { id: 'k2', sound: false, text: 'The partner owns the requested address range.', why: 'Contradicted by the registry lookup: it belongs to a hosting provider and is shared.' },
          { id: 'k3', sound: false, text: 'The request is low risk because the partner is a trusted company.', why: 'Trust in a business does not make a rule safe. The risk comes from what the rule allows.' },
          { id: 'k4', sound: true, text: 'The approved rule is limited to one address, one port and seven days, with an owner and logging.', why: 'Describes what makes the rule acceptable.' },
          { id: 'k5', sound: false, text: 'Temporary rules always remove themselves.', why: 'Only if an expiry is set. Without one they are permanent, which is why this one has an automatic expiry.' },
          { id: 'k6', sound: true, text: 'The rule will be reviewed on its expiry date and removed unless extended with a new justification.', why: 'Good practice.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary of the day',
        intro: 'Your own summary for the network team lead. Include what the evidence supports and how your decisions went.',
        statements: [
          { id: 'r1', correct: true, text: 'The partner request asked for a /16 range and every port to the customer database, with no expiry or owner.', why: 'Shown by the ticket.' },
          { id: 'r2', correct: true, text: 'The address range belongs to a shared hosting provider, so allowing it would admit other customers.', why: 'Shown by the registry lookup.' },
          { id: 'r3', correct: true, text: 'The other four requests were narrower and were ranked as lower risk.', why: 'An accurate description of the ranking.' },
          { id: 'r4', correct: true, text: 'The pressure to approve came from the requester\'s side, not from a risk assessment.', why: 'An honest observation.' },
          { id: 'r5', correct: false, text: 'The partner tried to attack us.', why: 'Unsupported. The request was careless, not hostile.' },
          { id: 'r6', correct: false, text: 'All requests from partners should be refused.', why: 'Overbroad. The point is to narrow them, not to refuse everything.' },
          { id: 'r7', correct: false, text: 'The database has been accessed from the partner range.', why: 'Unsupported. The rule has not been approved as requested.' },
          { id: 'r8', when: 'narrow', correct: true, text: 'A narrow rule was approved: one address, one port, seven days, a named owner, logging and an automatic expiry.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'approved', correct: true, text: 'The request was approved as written, with the whole range and every port open and no expiry.', why: 'An honest account of an approval that left the exposure.' },
          { id: 'r10', when: 'refused', correct: true, text: 'The request was refused outright, which strained the partner relationship and may push the partner to workarounds.', why: 'An honest account of the cost of refusing without offering an alternative.' },
          { id: 'r11', when: 'quiet', correct: true, text: 'The rule was approved with logging disabled, so any use of it would not be visible.', why: 'An honest record of a risky decision.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Require an expiry date and a named owner on every temporary firewall rule, and report on rules that have expired.', why: 'It stops temporary rules becoming permanent.' },
          { id: 'a2', correct: true, text: 'Ask partners to supply the exact addresses and ports they need before the request is raised.', why: 'Fixes the cause of overly broad requests.' },
          { id: 'a3', correct: true, text: 'Review the rule on its expiry date and remove it unless it is renewed with a fresh reason.', why: 'Keeps the rule base clean.' },
          { id: 'a4', correct: false, text: 'Block all partner traffic until the contracts are renegotiated.', why: 'Out of proportion.' },
          { id: 'a5', correct: false, text: 'Approve every request marked urgent.', why: 'Urgency is not a risk assessment.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'net-exam',
    title: 'Promotion exam: Network Security Engineer',
    skill: 'data',
    minutes: 26,
    blurb: 'A newly acquired company, a flat network, a broken remote-access setup and a board that wants answers. Silver or better to pass.',
    brief: [
      'It is your promotion exam. Contoso has just acquired Fabrikam Logistics, and its network now connects to yours through a site-to-site link. The deal closes next week and the board wants to know whether connecting the two is safe.',
      'The case tests the role: ranking what to fix, spending limited effort, reading the evidence about the new network, standing firm on a request to "just connect it", and checking what is reported to the board. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the issues in the new network',
        intro: 'A review of Fabrikam\'s network found five issues. Rank them by the risk they pose to Contoso now that the networks are linked, highest first.',
        items: [
          { id: 'x1', source: 'Link', priority: 1, text: 'The site-to-site link lets every Fabrikam device reach every Contoso server, with no firewall between the two.', why: 'It exposes Contoso to everything that is wrong at Fabrikam, and it is a design decision you control today.' },
          { id: 'x2', source: 'Remote access', priority: 2, text: 'Fabrikam\'s remote desktop service is open to the internet with passwords only.', why: 'A very commonly attacked service, and a route in to a network now attached to yours.' },
          { id: 'x3', source: 'Wi-Fi', priority: 3, text: 'The warehouse Wi-Fi uses an old, easily broken security setting.', why: 'A real weakness, but it needs an attacker nearby and the impact is limited to that network, which is now behind a firewall.' },
          { id: 'x4', source: 'Logging', priority: 4, text: 'Fabrikam\'s firewall keeps only seven days of logs.', why: 'It limits investigations, but it does not make an attack more likely. It is a gap to fix, not an urgent one.' },
          { id: 'x5', source: 'Documentation', priority: 5, text: 'Fabrikam\'s network diagrams are two years out of date.', why: 'Annoying, and it slows work, but it exposes nothing.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your effort before the deal closes',
        intro: 'You have ten engineer-days before closing. Spend all ten across these four pieces of work.',
        items: [
          { id: 'y1', source: 'Link', ideal: 4, text: 'Put a firewall in the link, with default-deny rules that only allow the traffic the business needs.', why: 'The most important change, and the one that needs the most careful design and testing.' },
          { id: 'y2', source: 'Remote access', ideal: 3, text: 'Move Fabrikam\'s remote access behind a VPN with multi-factor authentication.', why: 'Closes the most likely way in. It involves other teams and takes real effort.' },
          { id: 'y3', source: 'Discovery', ideal: 2, text: 'Map what is really on Fabrikam\'s network and what talks to what.', why: 'You cannot write good rules without knowing the flows. A little time here pays off.' },
          { id: 'y4', source: 'Logging', ideal: 1, text: 'Extend log retention and send the logs to Contoso\'s monitoring.', why: 'Cheap, and it makes everything else investigable.' },
        ],
      },
      {
        id: 'traffic', type: 'evidence', title: 'Check what the traffic shows',
        intro: 'Before you connect the networks, look at a week of Fabrikam\'s traffic. Find out whether anything is already wrong. Flag only what the records support.',
        clues: {
          beacon: { strength: 'strong', text: 'One Fabrikam server contacts an outside address every 60 seconds, around the clock, sending small amounts of data.' },
          rdpfail: { strength: 'strong', text: 'The remote desktop service logged over 9,000 failed sign-ins from the internet this week.' },
          oneok: { strength: 'strong', text: 'One of those sign-ins succeeded, for an account that has never signed in remotely before.' },
          scan: { strength: 'strong', text: 'The same server that sends the regular signals also scanned other Fabrikam systems on tcp/445 and tcp/3389 on Tuesday night.' },
          offhours: { strength: 'weak', text: 'The successful sign-in came at 03:12 local time.' },
        },
        artefacts: [
          {
            id: 'flows', title: 'Network flow records',
            lines: [
              { id: 't1', type: 'clue', clue: 'beacon', text: 'FAB-APP07 to 203.0.113.58:443: 10,080 connections this week, one every 60 seconds, 1-2 KB each', note: 'A perfectly regular small signal is what automated malware looks like. People do not browse on a stopwatch.' },
              { id: 't2', type: 'clue', clue: 'scan', text: 'Tuesday 23:40-23:52: FAB-APP07 connected to 412 internal addresses on tcp/445 and tcp/3389', note: 'A server sweeping the internal network for file shares and remote desktop is looking for more targets.' },
              { id: 't3', type: 'herring', text: 'Backup traffic: 380 GB to the offsite provider nightly', note: 'Large but expected and to a known destination.' },
              { id: 't4', type: 'herring', text: 'Peak internet usage: 600 Mb/s at 09:30', note: 'A normal working-day peak.' },
            ],
          },
          {
            id: 'rdp', title: 'Remote desktop and sign-in logs',
            lines: [
              { id: 't5', type: 'clue', clue: 'rdpfail', text: 'Remote desktop service: 9,214 failed sign-ins this week from 38 internet addresses', note: 'A constant guessing attack on an exposed service.' },
              { id: 't6', type: 'clue', clue: 'oneok', text: 'One success: account "warehouse-admin" from 198.51.100.77 at 03:12; no previous remote sign-ins for this account', note: 'One guess has worked, on an account that never uses remote access. This is the most worrying single line.' },
              { id: 't7', type: 'clue', clue: 'offhours', text: 'Sign-in time: 03:12 local time (outside any shift)', note: 'Suspicious, but not proof by itself: it only means something alongside the other evidence.' },
              { id: 't8', type: 'herring', text: 'Routine certificate renewal for the VPN appliance', note: 'Maintenance that has nothing to do with the attack.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the deal team wants it connected',
        intro: 'The deal lead says: "We close on Friday. Connect the networks now so integration can start Monday. Security can tidy up afterwards."',
        prompt: 'What do you do?',
        options: [
          { id: 'hold', quality: 3, text: 'Do not connect it as it is. Connect only through a firewall with default-deny rules once Fabrikam\'s remote access is secured and the suspicious server has been isolated and checked, and tell the deal lead what you found and why', set: { hold: true }, consequence: 'Integration starts a few days later on a safe footing, and the deal team has an accurate account to give the board. The suspicious server is dealt with before it can reach Contoso.' },
          { id: 'restrict', quality: 2, text: 'Connect now, but only to a small test network, and fix the rest in parallel', set: { restricted: true }, consequence: 'It limits what is reachable, but the compromised server is still on a network you have linked to, and nobody has checked what it has already done.' },
          { id: 'connect', quality: 1, text: 'Connect it as the deal lead asked and tidy up afterwards', set: { connected: true }, consequence: 'Within two weeks, the attacker uses the link to reach a Contoso file server. It is far harder to unpick than preventing it would have been.' },
          { id: 'block', quality: 0, text: 'Refuse to connect anything until Fabrikam has rebuilt its entire network', set: { blocked: true }, consequence: 'Nothing is connected for months, and the business works around you with USB drives and personal email.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft for the board',
        intro: 'A colleague has drafted the update to the board.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Fabrikam\'s network shows signs of a compromised server that sends regular signals to an outside address.', why: 'Supported by the flow records.' },
          { id: 'j2', sound: false, text: 'Fabrikam\'s network is secure and can be connected safely.', why: 'Contradicted by the evidence of a compromised server and an exposed remote access service.' },
          { id: 'j3', sound: false, text: 'Fabrikam has been the victim of a nation-state attack.', why: 'Unsupported. You have evidence of compromise, not of who is responsible.' },
          { id: 'j4', sound: true, text: 'We recommend connecting only through a firewall with default-deny rules, once remote access is secured.', why: 'A sound recommendation.' },
          { id: 'j5', sound: false, text: 'No Contoso systems have been affected.', why: 'Not yet known. The networks were not connected, but you have not checked every system.' },
          { id: 'j6', sound: true, text: 'We do not yet know what the compromised server has accessed, and the investigation is continuing.', why: 'An honest statement of what is unknown.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and recommend proportionate actions.',
        statements: [
          { id: 'b1', correct: true, text: 'A Fabrikam server contacts an outside address every 60 seconds and scanned the internal network on Tuesday night.', why: 'Shown by the flow records.' },
          { id: 'b2', correct: true, text: 'Fabrikam\'s remote desktop service is open to the internet and had one successful sign-in from an unfamiliar address at 03:12.', why: 'Shown by the sign-in logs.' },
          { id: 'b3', correct: true, text: 'The proposed link currently has no firewall between the two networks.', why: 'Shown by the design.' },
          { id: 'b4', correct: true, text: 'It is not yet known what the compromised server has done or whether any Contoso system is affected.', why: 'An honest statement of what is unknown.' },
          { id: 'b5', correct: false, text: 'Fabrikam is a criminal organisation.', why: 'Unsupported and unfair. Fabrikam is a victim.' },
          { id: 'b6', correct: false, text: 'The deal should be cancelled.', why: 'Not your decision, and not what the evidence says. The issue is how the networks are connected.' },
          { id: 'b7', correct: false, text: 'Connecting the networks is safe if we install antivirus.', why: 'Antivirus does not close an exposed service or isolate a compromised server.' },
          { id: 'b8', when: 'hold', correct: true, text: 'The link was held until it could be connected through a firewall with default-deny rules, remote access was secured and the suspicious server was isolated.', why: 'An accurate record of a sound decision.' },
          { id: 'b9', when: 'restricted', correct: true, text: 'The link was connected to a small test network only, while the compromised server was still on the network.', why: 'An honest description of a partial measure.' },
          { id: 'b10', when: 'connected', correct: true, text: 'The networks were connected as requested before the issues were fixed, and the attacker later used the link.', why: 'An honest account of the cost of connecting early.' },
          { id: 'b11', when: 'blocked', correct: true, text: 'Nothing was connected, and staff have been using unofficial workarounds in the meantime.', why: 'An honest account of the cost of an over-cautious refusal.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Isolate the suspicious server, investigate it, and check Contoso for any traffic from the same address.', why: 'The urgent unknown.' },
          { id: 'a2', correct: true, text: 'Secure Fabrikam\'s remote access with a VPN and multi-factor authentication, and reset the exposed account.', why: 'Closes the most likely way in.' },
          { id: 'a3', correct: true, text: 'Connect the networks only through a firewall with default-deny rules, and add log monitoring.', why: 'The core design.' },
          { id: 'a4', correct: false, text: 'Disconnect all of Fabrikam\'s systems from the internet.', why: 'It stops their business and does not fix the cause.' },
          { id: 'a5', correct: false, text: 'Tell staff nothing, to avoid alarm.', why: 'The board and the affected staff need an accurate account.' },
        ],
      },
    ],
  },
];
