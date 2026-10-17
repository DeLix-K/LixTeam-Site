// Network Security Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24) and
// private ranges (10.x) that belong to no real network.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const NETWORK = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'firewall-audit',
    title: 'The rule nobody understands',
    skill: 'data',
    blurb: 'A routine audit of the main firewall finds something that has been there for years. Read the rule base and work out what it means.',
    brief: [
      'Your annual firewall audit has begun. The main firewall has 120 rules, written by several engineers over seven years, and nobody can explain all of them. A scan from the outside shows more internal services than anyone expected.',
      'You have the rule base to start with, and deeper records as you find the right clues. Work out what is wrong with it, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      anyany: { strength: 'strong', text: 'Rule 10 allows all traffic from anywhere to anywhere, and it sits above almost every other rule.' },
      shadow: { strength: 'strong', text: 'Dozens of deny rules below it have never matched a single packet, because rule 10 allows the traffic first.' },
      rdp: { strength: 'strong', text: 'Remote desktop (port 3389) to a server is allowed from the whole internet.' },
      nolog: { strength: 'strong', text: 'Logging is switched off on the allow rules, so nobody can see what the permissive rules are being used for.' },
      noowner: { strength: 'weak', text: '41 of the 120 rules have no owner, comment or expiry date.' },
    },
    artefacts: [
      {
        id: 'rules', title: 'The firewall rule base',
        blurb: 'The first rules, read top to bottom.',
        lines: [
          { id: 'r1', type: 'clue', clue: 'anyany', text: 'Rule 10: ALLOW any -> any, any service. Comment: "temp, J. Smith, 2019". Hits: 41,882,110', note: 'A temporary allow-everything rule from 2019 with millions of hits. Rules are checked top to bottom, so this one makes the firewall act as if it were off.' },
          { id: 'r2', type: 'clue', clue: 'rdp', text: 'Rule 12: ALLOW tcp any -> 10.0.5.20 port 3389 (RDP). Comment: "contractor access". Hits: 1,204,332', note: 'Remote desktop open to the whole internet is one of the most attacked services there is. Over a million hits suggests it is being used, or attacked, constantly.' },
          { id: 'r3', type: 'herring', text: 'Rule 11: ALLOW udp 10.0.0.0/8 -> 10.0.1.5 port 53 (DNS). Hits: 9,100,442', note: 'Staff computers using the internal DNS server. A normal, narrow and sensible rule.' },
          { id: 'r4', type: 'herring', text: 'Rule 13: ALLOW tcp 10.0.2.0/24 -> any port 443 (staff web browsing)', note: 'Ordinary outbound web access. Not a problem in itself.' },
        ],
      },
      {
        id: 'counters', title: 'Hit counters and logging settings',
        blurb: 'How are the rules actually behaving?',
        unlockedBy: 'anyany',
        lines: [
          { id: 'c1', type: 'clue', clue: 'shadow', text: 'Rules 30-88 (59 rules, mostly DENY): hit count 0 since the counters were last cleared 14 months ago', note: 'Rules that never match are being skipped because rule 10 allows the traffic first. The restrictions you think you have are not being applied.' },
          { id: 'c2', type: 'clue', clue: 'nolog', text: 'Logging: ENABLED on rules 100-120 (deny). DISABLED on rules 10, 12 and every other allow rule', note: 'You can see the traffic the firewall refuses, but not the traffic the permissive rules allow, which is the traffic that matters.' },
          { id: 'c3', type: 'herring', text: 'Firewall firmware: current release, last updated in September', note: 'A well-maintained device does not make the rules any safer.' },
          { id: 'c4', type: 'herring', text: 'Configuration backup: completed nightly', note: 'Good practice and not related to the problem.' },
          { id: 'c5', type: 'plain', text: 'Total rule count: 120', note: 'A normal size for a company of this size, and not a finding by itself.' },
        ],
      },
      {
        id: 'ownership', title: 'Change history and ownership',
        blurb: 'Who is responsible for these rules?',
        unlockedBy: 'rdp',
        lines: [
          { id: 'o1', type: 'clue', clue: 'noowner', text: 'Rule metadata: 41 of 120 rules have no owner, no business reason and no expiry date', note: 'Without an owner, nobody can say a rule is still needed, so nobody removes it.' },
          { id: 'o2', type: 'herring', text: 'J. Smith left the company in 2022', note: 'Explains why nobody can answer questions about rule 10, but the rule is the problem, not the person.' },
          { id: 'o3', type: 'herring', text: 'Change approval workflow introduced in 2023', note: 'A good process that arrived after most of these rules were written.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'legacy', correct: true, text: 'A forgotten allow-everything rule at the top of the rule base makes the firewall effectively open', explain: 'Rule 10 matches all traffic and sits above the rules that were meant to restrict it, so the controls below it never apply. The exposed remote desktop is one result.' },
        { id: 'malware', correct: false, text: 'Malware has switched the firewall rules off', explain: 'Nothing suggests an attack. The rule has been there since 2019 and the other rules are exactly as written.' },
        { id: 'hardware', correct: false, text: 'A hardware fault is causing the firewall to let traffic through', explain: 'The firewall is doing exactly what the rules tell it to. The rules are the problem.' },
        { id: 'ddos', correct: false, text: 'The firewall is under a denial-of-service attack', explain: 'There is no sign of overload. The large hit counts reflect permissive rules, not an attack on the device.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'fix', correct: true, text: 'Restrict remote desktop now, then use the hit counters and logs to find what rule 10 is really being used for before replacing it with specific rules and removing it', explain: 'Close the most dangerous exposure straight away, then replace the broad rule carefully with what the traffic actually needs. Deleting rule 10 blind could break production.' },
        { id: 'delete', correct: false, text: 'Delete rule 10 straight away', explain: 'Millions of connections rely on it, so removing it without understanding them will break systems and cause an outage.' },
        { id: 'bottom', correct: false, text: 'Add a deny-all rule at the bottom of the list', explain: 'Rule 10 matches first, so a rule at the bottom is never reached.' },
        { id: 'wipe', correct: false, text: 'Delete all the rules and start again', explain: 'A blunt approach that would stop the business, and it throws away the knowledge about what is genuinely needed.' },
      ],
    },
    story: [
      'In 2019 an engineer adds a rule to allow everything "temporarily" while fixing an outage.',
      'It works, so it stays. Over the next years other engineers add careful rules below it, which never match.',
      'Nobody notices, because the firewall passes traffic, and the logs for allowed traffic are switched off.',
      'The way out is to close the worst exposure first, learn what the broad rule is carrying, and replace it with rules that say what is needed.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'rogue-device',
    title: 'The device that should not be there',
    skill: 'data',
    blurb: 'An alert shows an unknown device on the finance network. Work out what it is and what it has done.',
    brief: [
      'Your network monitoring tool has raised an alert: a device nobody recognises has appeared on the finance VLAN. It asked for an address at 18:20 last night and has been active since.',
      'You have the DHCP and switch records to start with, and deeper records as you find the right clues. Work out what the device is, flag the lines that matter and leave the noise alone, and decide the first move.',
    ],
    ratings: RATINGS,
    clues: {
      unknown: { strength: 'strong', text: 'The device\'s hardware address matches no device in the asset inventory.' },
      disguise: { strength: 'strong', text: 'It asked for an address using the name "printer-02", which already belongs to a real printer on a different floor.' },
      port: { strength: 'strong', text: 'It is plugged into a wall port in a meeting room that has not been used for weeks, and that port has no access control.' },
      sweep: { strength: 'strong', text: 'Within ten minutes it began scanning the finance VLAN for open services.' },
      outbound: { strength: 'strong', text: 'It then opened a long-lived connection to an address on the internet.' },
      vendor: { strength: 'weak', text: 'The hardware address belongs to a manufacturer of small single-board computers.' },
    },
    artefacts: [
      {
        id: 'dhcp', title: 'DHCP and inventory records',
        blurb: 'What is it, and what does it call itself?',
        lines: [
          { id: 'd1', type: 'clue', clue: 'unknown', text: '18:20 DHCP lease: hardware address b8:27:eb:00:12:9a, VLAN 20 (finance); not found in the asset inventory', note: 'A device the company does not know it has. That alone makes it worth investigating.' },
          { id: 'd2', type: 'clue', clue: 'vendor', text: 'Hardware address prefix b8:27:eb: manufacturer of small single-board computers', note: 'A hint about the kind of device, but plenty of legitimate devices use these. It supports the story without proving it.' },
          { id: 'd3', type: 'herring', text: '18:35 DHCP lease: a staff laptop renewed its address', note: 'Routine renewal for a known device.' },
          { id: 'd4', type: 'herring', text: 'DHCP pool utilisation on VLAN 20: 71%', note: 'Within normal range, so it does not explain the new device.' },
        ],
      },
      {
        id: 'switch', title: 'Switch and port records',
        blurb: 'Where is it, and how did it get on?',
        unlockedBy: 'unknown',
        lines: [
          { id: 's1', type: 'clue', clue: 'disguise', text: 'DHCP client name: "printer-02" (the real printer-02, address 10.20.8.14, is on the 4th floor)', note: 'Copying the name of a real device is an attempt to blend in. A real printer would not ask for a second address.' },
          { id: 's2', type: 'clue', clue: 'port', text: 'Switch SW-3F-02 port Gi1/0/17 (meeting room M3): link up 18:19. No 802.1X, no port security. Last use before: 41 days ago', note: 'A quiet wall port that anyone can plug into, with nothing to check what connects.' },
          { id: 's3', type: 'herring', text: 'Switch SW-3F-02 uptime: 230 days', note: 'A patching concern, but not related to this device.' },
          { id: 's4', type: 'plain', text: 'Port Gi1/0/17 PoE draw: 2.8 W', note: 'A small, low-power device, which fits a small computer. It is context rather than proof.' },
        ],
      },
      {
        id: 'traffic', title: 'Network traffic from the device',
        blurb: 'What has it done since it connected?',
        unlockedBy: 'disguise',
        lines: [
          { id: 't1', type: 'clue', clue: 'sweep', text: '18:24-18:31 b8:27:eb:00:12:9a (10.20.8.201) connected to 254 addresses on VLAN 20, ports 22, 445 and 3389', note: 'Probing a whole network segment for remote administration and file sharing is looking for targets.' },
          { id: 't2', type: 'clue', clue: 'outbound', text: '18:40 onwards: 10.20.8.201 holds one long-lived HTTPS connection to 203.0.113.58', note: 'A steady outbound link to an outside address. The kind of connection used to give someone remote control.' },
          { id: 't3', type: 'herring', text: 'Finance VLAN: scheduled vulnerability scan ran at 02:00', note: 'The company\'s own authorised scan from a known scanner, which is a different address.' },
          { id: 't4', type: 'herring', text: 'Normal staff traffic: 3,400 web requests an hour', note: 'Ordinary background activity.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'rogue', correct: true, text: 'A rogue device was planted on an open network port to scan the finance network and give an outsider a way in', explain: 'An unknown device with a borrowed name, on an unused and unprotected port, scanned the network and opened a connection to the internet. That is what a planted remote-access device does.' },
        { id: 'printer', correct: false, text: 'A new printer was installed and misconfigured', explain: 'It copied the name of an existing printer, was not in the inventory, scanned the network and connected out. Printers do not do that.' },
        { id: 'byod', correct: false, text: 'A staff member plugged in a personal laptop', explain: 'A laptop would ask for its own name and would not sweep ports across the VLAN or hold a connection to an outside address.' },
        { id: 'dhcpfault', correct: false, text: 'A fault in the DHCP server is creating phantom devices', explain: 'The device is real: it generated traffic, scanned the network and opened a connection outward.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'contain', correct: true, text: 'Disable the switch port, physically find and secure the device as evidence, check what it reached and whether anything else connected to the same address, then add port security and 802.1X', explain: 'Cut the connection, keep the device as evidence, work out the damage, and close the gap that let it in.' },
        { id: 'unplug', correct: false, text: 'Unplug the device and carry on', explain: 'You lose the evidence and learn nothing about what it reached or how it got there.' },
        { id: 'block', correct: false, text: 'Block the one outside address and leave the device', explain: 'The device can use another address in minutes, and it is still inside your network.' },
        { id: 'ignore', correct: false, text: 'Wait to see whether it causes harm', explain: 'It has already scanned your finance network and opened a path to the outside.' },
      ],
    },
    story: [
      'Someone with brief physical access plugs a small, cheap computer into an unused meeting-room port.',
      'Because the port has no access control, the device is given an address on the finance network.',
      'It borrows the name of a real printer, scans the segment for services to attack, and opens a connection to its owner\'s server.',
      'The first move is to cut the port and secure the device, because it is evidence. The lasting fix is controls that stop unknown devices joining.',
    ],
  },
];
