// Network Security Architect Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges and private ranges.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const NETWORK_ARCH = [
  {
    id: 'forgotten-exception',
    title: 'The exception nobody remembered',
    skill: 'data',
    blurb: 'A design drawing says contractors cannot reach the finance servers. Yesterday someone using a contractor account copied finance files. Rebuild how a rule that said no was quietly overridden.',
    brief: [
      'On Monday the finance team notices that a payroll file was opened by a contractor account that should not have been able to see finance systems. The firewall design says it cannot.',
      'You have evidence from the contractor\'s laptop, the VPN, the firewall, the identity system and the file server. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a device, an account or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'A stolen contractor login', desc: 'How the attacker got the credentials.', story: 'A contractor, Priya, installed a free browser add-on on her personal laptop. It copied the passwords that her browser had saved, including her company VPN sign-in. The attacker had a working login that did not need her laptop.' },
      { id: 'foothold', name: 'Signing in as the contractor', desc: 'Using the stolen login.', story: 'The attacker signed in to the company VPN as Priya from an address in another country. The VPN accepted it because contractors are allowed to connect from anywhere and the account was protected only by a password.' },
      { id: 'pivot', name: 'A rule that said yes', desc: 'Reaching a system the design said was off limits.', story: 'Three years ago, an engineer added a firewall rule allowing the contractor VPN pool to reach the finance file server, to help one audit. It was meant to last two weeks. Nobody removed it, and it was not on the design drawing.' },
      { id: 'abuse', name: 'Taking the files', desc: 'What the attacker did with the access.', story: 'The attacker browsed the finance file server, copied the payroll and supplier folders to a compressed file, and sent it out over a normal encrypted connection.' },
    ],
    cards: [
      { id: 'e0', source: 'Endpoint', time: '08:03', stage: 'initial', text: 'On the contractor\'s personal laptop CTR-LAPTOP-PN, priya.n installs a free "PDF tools" browser add-on from the public store. The listing was updated the day before by a new publisher.', indicators: ['CTR-LAPTOP-PN', 'priya.n'], note: 'A popular-looking add-on that changed hands is a common way for password-stealing code to reach a browser.', hint: 'Where did the stolen login start?' },
      { id: 'e1', source: 'Endpoint', time: '08:12', stage: 'initial', text: 'On the contractor\'s personal laptop CTR-LAPTOP-PN, a newly installed browser add-on reads the browser\'s saved passwords and sends them to 203.0.113.145.', indicators: ['CTR-LAPTOP-PN', '203.0.113.145', 'priya.n'], note: 'The add-on is how the credentials were taken, from a device the company did not control.', hint: 'How did the attacker get a login?' },
      { id: 'n1', source: 'Network', time: '08:40', text: 'The office guest wireless records 85 normal sign-ins.', indicators: [], note: 'Routine traffic unrelated to the attack.', hint: 'Does it involve the contractor, the laptop or the address?' },
      { id: 'e2', source: 'VPN', time: '09:05', stage: 'foothold', text: 'priya.n signs in to the VPN from 203.0.113.145. Her usual sign-in country is the UK; this address is in another country. No second factor is recorded.', indicators: ['priya.n', '203.0.113.145'], note: 'A valid login from an unusual place with only a password. The VPN had no reason to refuse it.', hint: 'The stolen login is used.' },
      { id: 'e3', source: 'Identity', time: '09:06', stage: 'foothold', text: 'The identity system shows priya.n holds a "Contractor-Standard" role, with no multi-factor requirement because contractors were exempted last year.', indicators: ['priya.n'], note: 'The exemption removed the one check that would have stopped a password-only login.', hint: 'Why did the login work?' },
      { id: 'e4', source: 'Firewall', time: '09:14', stage: 'pivot', text: 'The firewall allows the connection from the contractor VPN pool 10.60.0.0/24 to FIN-FS-01 on the file-sharing port, matched by rule 4417 ("audit access, temp").', indicators: ['FIN-FS-01', 'rule 4417', '10.60.0.0/24'], note: 'A rule meant to be temporary allows the contractor pool to reach finance. It is the break in the design.', hint: 'Which rule lets them through?' },
      { id: 'n2', source: 'File server', time: '09:30', text: 'FIN-FS-01 runs its nightly index of the shared folders.', indicators: ['FIN-FS-01'], note: 'The server is involved but the job is routine.', hint: 'The server appears, but is this part of the chain?' },
      { id: 'e5', source: 'File server', time: '09:41', stage: 'pivot', text: 'priya.n successfully opens the share \\\\FIN-FS-01\\Payroll. The account has no permissions on the share, but the share allows "Everyone" to read.', indicators: ['priya.n', 'FIN-FS-01'], note: 'A second weakness: the share is open to everyone, so the rule was enough to reach it.', hint: 'The attacker reaches finance.' },
      { id: 'e6', source: 'File server', time: '09:52', stage: 'abuse', text: 'priya.n reads 7,800 files in Payroll and Suppliers and creates a 2.4 GB compressed archive in a temporary folder.', indicators: ['priya.n', 'FIN-FS-01'], note: 'Reading thousands of files and packing them into one archive is how data is prepared to be taken.', hint: 'The files are collected.' },
      { id: 'e7', source: 'Network', time: '10:20', stage: 'abuse', text: 'A 2.4 GB upload leaves the contractor VPN pool for 203.0.113.145 over 20 minutes.', indicators: ['203.0.113.145', '10.60.0.0/24'], note: 'The archive leaves to the same address that signed in. The VPN allows outbound traffic from contractors.', hint: 'The data leaves.' },
      { id: 'n3', source: 'VPN', time: '10:45', text: 'Four other contractors sign in to the VPN from the UK and complete their work.', indicators: [], note: 'Normal contractor activity from usual locations.', hint: 'Does it involve priya.n or the unusual address?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'Which combination of weaknesses allowed this?',
        options: [
          { id: 'layers', correct: true, text: 'A password-only contractor login, a temporary firewall rule that was never removed and that bypassed the design, and a share open to everyone', explain: 'Three separate gaps lined up. Any one of them fixed would have broken the chain.' },
          { id: 'zero', correct: false, text: 'A previously unknown flaw in the VPN', explain: 'The VPN worked as configured. The weaknesses were in the settings and the rules.' },
          { id: 'insider', correct: false, text: 'A malicious contractor', explain: 'The contractor\'s credentials were stolen by an add-on. The sign-in came from another country.' },
          { id: 'weak', correct: false, text: 'A weak firewall product', explain: 'The firewall did what a rule told it to. The rule was the problem.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of controls would have stopped the chain earliest and most reliably?',
        options: [
          { id: 'controls', correct: true, text: 'Require multi-factor sign-in for contractors, give every firewall rule an owner and an expiry and review them against the design, and remove "Everyone" from sensitive shares', explain: 'Each breaks a link. Expiring rules are the fix for the forgotten exception.' },
          { id: 'av', correct: false, text: 'Antivirus on the finance server', explain: 'The attacker used legitimate access, not malicious software on the server.' },
          { id: 'training', correct: false, text: 'Training contractors not to install browser add-ons', explain: 'Helpful, but it should not be the only barrier. The design must still hold when someone slips.' },
          { id: 'bigger', correct: false, text: 'A faster VPN', explain: 'Speed is not the issue.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should the response include beyond blocking the address?',
        options: [
          { id: 'full', correct: true, text: 'Disable priya.n and force a password reset, require multi-factor for every contractor, remove rule 4417 and review every other temporary rule, close the open share, and assess what was in the 2.4 GB and who must be told', explain: 'The credential, the rule, the share and the data loss all need dealing with.' },
          { id: 'block', correct: false, text: 'Block 203.0.113.145 and carry on', explain: 'The credentials and the rule are still in place, and the attacker can use another address.' },
          { id: 'laptop', correct: false, text: 'Ask the contractor to reinstall her laptop', explain: 'It does nothing about the stolen login or the rule.' },
          { id: 'wait', correct: false, text: 'Wait to see if the files appear online', explain: 'The data has already left, and a legal clock may be running.' },
        ],
      },
    ],
    summary: 'No flaw was exploited. A password-only contractor login, a firewall rule that was meant to be temporary and a share open to everyone gave a thief a straight road to the payroll files. Multi-factor sign-in, rules that expire and are checked against the design, and tightly set sharing each break the chain.',
  },
];
