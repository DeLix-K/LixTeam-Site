// Senior Vulnerability Management Cyber Detective cases (see cases.js for the format). Everything here
// is fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const VULN_LEAD = [
  {
    id: 'invisible-server',
    title: 'The server on no report',
    skill: 'hardening',
    blurb: 'An outside tester got into Contoso through a web server that has never appeared in a vulnerability report. Find out how a known-exploited flaw sat on the internet for fourteen months without anyone seeing it.',
    brief: [
      'A penetration tester hired by Contoso reports that they reached the internal network through an old web server, "web-promo-03". Your vulnerability reports have never mentioned it. The flaw they used was published, and widely exploited, fourteen months ago.',
      'You have the scan scope to start with, and deeper records as you find the right clues. Work out why the programme never saw this server, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      scope: { strength: 'strong', text: 'The scanner only scans addresses listed in the asset register, and web-promo-03 was never added to it.' },
      owner: { strength: 'strong', text: 'The server was created by a marketing agency for a campaign and nobody at Contoso took ownership when the campaign ended.' },
      old: { strength: 'strong', text: 'It runs a version of its web software with a flaw that has been widely exploited for fourteen months.' },
      nodisc: { strength: 'strong', text: 'No process ever compares what is on the network with the asset register, so unregistered systems stay invisible.' },
      reach: { strength: 'weak', text: 'The server sits in the same network zone as internal systems, which is how the tester moved on.' },
    },
    artefacts: [
      {
        id: 'scope', title: 'Scan scope and results',
        blurb: 'What the programme scans, and what it found.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'scope', text: 'Scan target list: generated each month from the asset register (3,100 assets). web-promo-03 (address 198.51.100.84): not in the target list. Last scanned: never', note: 'The scanner cannot see what it was never told to look at. The programme reports 100% scan success for the list it has.' },
          { id: 'a2', type: 'herring', text: 'Last month\'s scan: 3,100 of 3,100 assets scanned successfully, 0 failures', note: 'Perfect for the list it was given. It says nothing about the systems not on it.' },
          { id: 'a3', type: 'herring', text: 'Scanner software is fully patched and licensed for 3,500 assets', note: 'The tool works. It was not aimed at this server.' },
          { id: 'a4', type: 'plain', text: 'Internet-facing scans run weekly for registered systems', note: 'Good practice that only helps for systems that are registered.' },
        ],
      },
      {
        id: 'server', title: 'The server and its history',
        blurb: 'Who made it, what it runs and what it can reach.',
        unlockedBy: 'scope',
        lines: [
          { id: 'b1', type: 'clue', clue: 'owner', text: 'Hosting record for web-promo-03: requested by Brightline Agency, 17 months ago, campaign "Spring Promo". Contoso contact: left the company 11 months ago. Campaign ended: 15 months ago', note: 'The agency built it and the only Contoso contact left. Nobody owns it, so nobody patched or removed it.' },
          { id: 'b2', type: 'clue', clue: 'old', text: 'Banner: web framework version 2.3.1. Vendor advisory: versions before 2.3.9 allow remote code execution; listed as known exploited for 14 months', note: 'An easily avoided flaw that attackers use every day, sitting on the internet.' },
          { id: 'b3', type: 'clue', clue: 'reach', text: 'Network zone: DMZ-2, which has open connections to the internal application servers', note: 'Once the server was taken, the tester could move on. A secondary weakness.' },
          { id: 'b4', type: 'herring', text: 'Server hosts a static page that has had 12 visitors this year', note: 'It is almost unused. That is why it was forgotten, not why it was reachable.' },
          { id: 'b5', type: 'plain', text: 'The domain "promo.contoso.example" points to the server', note: 'How the server is reached by name.' },
        ],
      },
      {
        id: 'process', title: 'How the register is kept',
        blurb: 'What the programme does to find new systems.',
        unlockedBy: 'owner',
        lines: [
          { id: 'c1', type: 'clue', clue: 'nodisc', text: 'Register update process: assets are added when a team files a request. Network discovery: never run. Reconciliation of register against the network: not part of any process', note: 'The register contains only what people remembered to tell you. Nothing finds the rest.' },
          { id: 'c2', type: 'herring', text: 'The register is reviewed for typos each quarter', note: 'It checks the quality of what is there, not what is missing.' },
          { id: 'c3', type: 'herring', text: 'The vulnerability team has four people', note: 'Team size does not explain why a system was missed.' },
          { id: 'c4', type: 'plain', text: 'An internal discovery run last Friday found 960 live addresses that are not in the register', note: 'The gap is much bigger than one server.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'blind', correct: true, text: 'The programme only scans systems in the asset register, and nothing finds systems that are missing from it, so an abandoned, exploitable server went unseen', explain: 'The scan list, the missing owner and the lack of any discovery process explain why a flaw known for fourteen months was never reported.' },
        { id: 'scanner', correct: false, text: 'The scanner failed to detect the flaw', explain: 'The scanner never looked at this server. Its detection is not in question.' },
        { id: 'ignored', correct: false, text: 'The team saw the finding and chose not to fix it', explain: 'The server never appeared in any report. There was nothing to choose about.' },
        { id: 'zero', correct: false, text: 'The tester used a flaw nobody knew about', explain: 'The flaw had been public and widely exploited for fourteen months.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Take web-promo-03 off the internet and review it for signs of compromise, run network discovery now and then weekly, reconcile it with the register so every live system has an owner or is removed, and review how the agency servers are handed over', explain: 'Deal with the exposed server, find the other hidden ones, and make sure the gap cannot reopen.' },
        { id: 'patch', correct: false, text: 'Patch web-promo-03 and carry on', explain: 'It leaves 959 other unknown systems and does not check whether the server was already used.' },
        { id: 'scan', correct: false, text: 'Run the scanner more often', explain: 'A more frequent scan of the same list would still miss the same systems.' },
        { id: 'blame', correct: false, text: 'Write to the agency about their negligence', explain: 'It does not fix the programme\'s own blind spot.' },
      ],
    },
    story: [
      'A marketing agency builds a campaign server and Contoso\'s only contact leaves the company.',
      'The campaign ends, the server stays, and nobody owns it. It is never added to the asset register.',
      'A vulnerability programme scans the register and reports full success every month. A widely exploited flaw sits on the internet for fourteen months.',
      'A tester finds it in an afternoon. The lesson is that a programme is only as good as its list of what exists: find the systems before scanning them.',
    ],
  },
];
