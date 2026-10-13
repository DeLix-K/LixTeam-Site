// More Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges
// (203.0.113.0/24, 198.51.100.0/24), and the .example domains are not real.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right attack and the right first move.' },
];

export const EXTRA = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'traveller',
    title: 'The impossible traveller',
    skill: 'identity',
    blurb: 'An "impossible travel" alert fires for a finance manager. Is it the VPN, or something worse?',
    brief: [
      'Your SIEM raised an alert: s.patel (Finance Manager) signed in from London at 08:10 and from Singapore at 08:45. These alerts are often false positives caused by VPNs, so you cannot simply escalate or dismiss it.',
      'You have the sign-in log to start with and can dig deeper as you find the right clues. Flag the lines that matter, and leave alone the ones that are only noise.',
    ],
    ratings: RATINGS,
    clues: {
      impossible: { strength: 'strong', text: 'Thirty-five minutes after signing in from London, the account signed in from Singapore, which is physically impossible.' },
      nomfa: { strength: 'strong', text: 'The Singapore session carries an MFA claim, but there was no MFA prompt or approval: it reused a stolen session token.' },
      client: { strength: 'strong', text: 'The Singapore sign-in came from a scripted client on a never-seen device, not a browser.' },
      aitm: { strength: 'strong', text: 'Minutes earlier, s.patel opened a lookalike sign-in page (registered four days ago) that relayed the real login: adversary-in-the-middle phishing.' },
      rule: { strength: 'strong', text: 'The attacker\'s session created a mailbox rule to hide invoice mail.' },
      lure: { strength: 'weak', text: 'The user received an "Action required: re-verify your account" email just before.' },
    },
    artefacts: [
      {
        id: 'signins', title: 'Sign-in log: s.patel',
        blurb: 'The alert and the surrounding sign-ins.',
        lines: [
          { id: 'l1', type: 'plain', text: '08:10  London  Chrome on a managed Windows laptop  MFA prompt approved', note: 'The user\'s normal sign-in, on their usual device, with MFA.' },
          { id: 'l2', type: 'clue', clue: 'impossible', text: '08:45  Singapore (hosting provider)  new device  MFA: satisfied', note: 'London to Singapore in 35 minutes cannot happen. One of these sign-ins is not the user.' },
          { id: 'l3', type: 'herring', text: '09:02  Frankfurt  via the corporate VPN gateway (known egress address)', note: 'This is the company VPN exit. It is the usual cause of "impossible travel" false positives, and it is expected.' },
          { id: 'l4', type: 'herring', text: '07:30  j.owen  Manchester  known laptop', note: 'A different user on approved travel. Not related.' },
        ],
      },
      {
        id: 'tokens', title: 'Authentication and token details',
        blurb: 'How did the Singapore session authenticate?',
        unlockedBy: 'impossible',
        lines: [
          { id: 'k1', type: 'clue', clue: 'nomfa', text: '08:45 session: MFA claim present in the token. MFA events for s.patel between 08:10 and 08:45: none.', note: 'The token says MFA was done, yet no prompt or approval happened. The session was copied from a real login: token replay.' },
          { id: 'k2', type: 'clue', clue: 'client', text: '08:45 session: user agent "axios/1.6.7" (a scripted HTTP client), device ID never seen before', note: 'A person at a browser does not look like this. It is automated tooling replaying a stolen session.' },
          { id: 'k3', type: 'plain', text: 'Session lifetime policy: 90 days', note: 'A policy setting, not evidence of an attack.' },
          { id: 'k4', type: 'herring', text: 'Conditional access: legacy authentication blocked tenant-wide', note: 'A good control, but it is not tied to this event.' },
        ],
      },
      {
        id: 'proxy', title: 'Web proxy and email records',
        blurb: 'What was the user doing just before?',
        unlockedBy: 'nomfa',
        lines: [
          { id: 'p1', type: 'clue', clue: 'lure', text: '07:58  s.patel received "Action required: re-verify your account" from no-reply@contoso-sso.example', note: 'The likely lure. True and helpful, but plenty of real emails also say this.' },
          { id: 'p2', type: 'clue', clue: 'aitm', text: '08:02  s.patel opened https://login.contoso-sso.example/ (domain registered 4 days ago); the page relayed the real Contoso sign-in', note: 'A lookalike page that passes the real login through to the user, and steals the session. The user sees a normal login and MFA works as expected, but the attacker captures the token.' },
          { id: 'p3', type: 'herring', text: '08:05  s.patel visited the intranet and a news site', note: 'Ordinary browsing after the login.' },
        ],
      },
      {
        id: 'mailbox', title: 'Mailbox audit',
        blurb: 'What did the Singapore session do?',
        unlockedBy: 'aitm',
        lines: [
          { id: 'm1', type: 'clue', clue: 'rule', text: '08:50  Rule "Archive" created in s.patel\'s mailbox: move messages containing "invoice" to RSS Subscriptions, mark as read', note: 'Created by the attacker\'s session. It hides invoice-related mail from the user, a standard step before payment fraud.' },
          { id: 'm2', type: 'herring', text: '08:20  s.patel created an internal calendar invite (from the London session)', note: 'The genuine user working normally.' },
          { id: 'm3', type: 'plain', text: '08:52  214 messages read by the Singapore session', note: 'Bulk reading is consistent with the takeover, but it is not needed to prove it.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'aitm', correct: true, text: 'Adversary-in-the-middle phishing: the attacker stole a session token and replayed it from abroad', explain: 'A lookalike login page relayed the real sign-in and captured the session token. MFA was satisfied by the real user, but the attacker reuses the token without any prompt.' },
        { id: 'vpn', correct: false, text: 'A false positive caused by the corporate VPN', explain: 'The VPN sign-in (Frankfurt) is real noise, but it is a separate event. The Singapore session has no MFA event, a scripted client, and follows a phishing page.' },
        { id: 'spray', correct: false, text: 'Password spraying', explain: 'Spraying guesses passwords. There are no failed attempts here, and the session carried a valid MFA claim.' },
        { id: 'travel', correct: false, text: 'The user really was travelling and signed in themselves', explain: 'They signed in from London 35 minutes earlier and the Singapore session used a scripted client.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'contain', correct: true, text: 'Revoke s.patel\'s sessions and refresh tokens, reset the password, remove the mailbox rule, and block the phishing domain', explain: 'The attacker holds a valid token, so you must end all sessions, not just reset the password, and remove their persistence and the infrastructure.' },
        { id: 'pwonly', correct: false, text: 'Reset the password only', explain: 'A stolen session token keeps working after a password change until it is revoked.' },
        { id: 'vpnfp', correct: false, text: 'Close the alert as a VPN false positive', explain: 'It would leave an active attacker in a finance manager\'s mailbox.' },
        { id: 'blockcountry', correct: false, text: 'Block sign-ins from Singapore', explain: 'The attacker can use another address in minutes, and the session is already established.' },
      ],
    },
    story: [
      '07:58: s.patel receives an "Action required: re-verify your account" email from a lookalike domain.',
      '08:02: they open the link. A reverse proxy shows the real Contoso sign-in, passes their password and MFA through, and keeps a copy of the session token.',
      '08:45: the attacker replays that token from Singapore with a scripted client. No password or MFA prompt is needed.',
      '08:50: they create a mailbox rule to hide invoice mail, setting up payment fraud. The fix is to revoke the token, not only the password.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'forwarder',
    title: 'The quiet forwarder',
    skill: 'email',
    blurb: 'Accounts Payable paid a supplier £86,400 to a new account. The supplier says they never asked for the change.',
    brief: [
      'a.lee (Accounts Payable) paid £86,400 to Northwind Logistics at 14:20 yesterday, to a bank account that differs from every previous payment. Today Northwind\'s real finance contact rings to ask where their money is, and says they never changed their bank details.',
      'You have the mailbox audit to start with. Work out how the fraud was set up, and what to do about it right now.',
    ],
    ratings: RATINGS,
    clues: {
      rule: { strength: 'strong', text: 'A hidden mailbox rule moves the real supplier\'s replies out of a.lee\'s sight.' },
      hijack: { strength: 'strong', text: 'A fake "our bank has changed" reply was inserted into a genuine, existing supplier thread.' },
      lookalike: { strength: 'strong', text: 'The fake reply came from northwind-logistics.co, a lookalike of the real northwind-logistics.com.' },
      earlier: { strength: 'strong', text: 'a.lee\'s account was accessed from a hosting address, at night, two days before the fraud.' },
      paid: { strength: 'strong', text: 'The payment went to a new account that differs from every earlier one.' },
      urgency: { strength: 'weak', text: 'The fake message pressed for payment before Friday to "keep the discount".' },
      scope: { strength: 'weak', text: 'Two more payments to Northwind are queued for next week.' },
    },
    artefacts: [
      {
        id: 'rules', title: 'Mailbox rules and audit: a.lee',
        blurb: 'What has been configured on the mailbox?',
        lines: [
          { id: 'r1', type: 'clue', clue: 'rule', text: 'Rule "x": if the sender domain is northwind-logistics.com, move to RSS Subscriptions and mark as read. Created two days ago, 21:20.', note: 'A rule with a meaningless name that hides the real supplier\'s messages from the user. Without it, a.lee would have seen the supplier\'s replies.' },
          { id: 'r2', type: 'herring', text: 'Rule "Newsletters": move newsletters to a folder. Created by a.lee in 2024.', note: 'An old, ordinary rule the user made themselves.' },
          { id: 'r3', type: 'plain', text: 'Out-of-office message set for a.lee: no', note: 'Nothing unusual.' },
          { id: 'r4', type: 'herring', text: 'Delegate access: a.lee\'s manager can see a.lee\'s calendar (set up in 2023)', note: 'A long-standing, ordinary delegation. It has nothing to do with the fraud.' },
        ],
      },
      {
        id: 'thread', title: 'The supplier email thread',
        blurb: 'The conversation about purchase order 7712.',
        unlockedBy: 'rule',
        lines: [
          { id: 't1', type: 'plain', text: 'Mon 10:02  emma.lindqvist@northwind-logistics.com: "PO 7712 will be delivered Thursday. Invoice attached."', note: 'The real start of the thread, from the real supplier domain.' },
          { id: 't2', type: 'clue', clue: 'hijack', text: 'Wed 08:41  reply on the same thread: "Our bank has changed. Please use the new details below for PO 7712."', note: 'A new message slipped into an existing, genuine conversation. Attackers do this because the thread looks trusted.' },
          { id: 't3', type: 'clue', clue: 'lookalike', text: 'Wed 08:41  sender: emma.lindqvist@northwind-logistics.co (the real domain ends .com)', note: 'One letter different: .co, not .com. The attacker owns the lookalike domain.' },
          { id: 't5', type: 'herring', text: 'Mon 10:30  a.lee forwarded the delivery note to the warehouse team (internal)', note: 'Normal internal handling of the genuine email.' },
          { id: 't4', type: 'clue', clue: 'urgency', text: 'Wed 08:44  "Please pay before Friday to keep your 5% discount."', note: 'Pressure to pay quickly. Common, but also something real suppliers say, so it is weak evidence on its own.' },
        ],
      },
      {
        id: 'signins', title: 'Sign-in log: a.lee',
        blurb: 'Who has been in this mailbox?',
        unlockedBy: 'hijack',
        lines: [
          { id: 's1', type: 'clue', clue: 'earlier', text: 'Mon 21:14  Sign-in from 203.0.113.58, hosting provider abroad (a.lee never signs in after 18:00)', note: 'The attacker was in the mailbox two days before the fraud, long enough to study the thread and set up the rule.' },
          { id: 's2', type: 'herring', text: 'Wed 09:00  Sign-in from the London office, usual laptop', note: 'a.lee\'s normal activity. It does not clear the account of the earlier sign-in.' },
          { id: 's3', type: 'plain', text: 'Wed 14:05  Outlook web: a.lee reads the "new bank details" message', note: 'This is where a.lee acted on the fake request.' },
          { id: 's4', type: 'herring', text: 'Tue 12:40  Sign-in from the London office on a phone (known device)', note: 'The user\'s usual mobile. Ordinary.' },
        ],
      },
      {
        id: 'payments', title: 'Payments',
        blurb: 'What has been paid and what is queued?',
        unlockedBy: 'lookalike',
        lines: [
          { id: 'y1', type: 'clue', clue: 'paid', text: 'Wed 14:20  £86,400 paid to Northwind Logistics. Sort code and account number differ from all four previous payments.', note: 'The money has gone to an account the attacker controls. Time matters for any chance to recover it.' },
          { id: 'y2', type: 'clue', clue: 'scope', text: 'Queued: Northwind invoices NL-2291 (£12,100) and NL-2304 (£8,750), due next week', note: 'More payments could be diverted. This shapes how urgent and wide your response must be.' },
          { id: 'y3', type: 'herring', text: 'Wed 11:30  £2,310 paid to Fabrikam Parts (existing bank details)', note: 'An ordinary payment to a different supplier.' },
          { id: 'y4', type: 'plain', text: 'Wed 16:00  Batch of 12 staff expense payments released', note: 'Routine payments, unrelated.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'bec', correct: true, text: 'Business email compromise: an attacker with access to a.lee\'s mailbox hijacked a supplier thread with a lookalike domain', explain: 'The attacker sat in the mailbox, hid the real supplier\'s replies with a rule, and inserted a fake bank-change message from a lookalike domain.' },
        { id: 'supplier', correct: false, text: 'Northwind\'s own mailbox was hacked', explain: 'The fake message came from a lookalike domain, not from Northwind\'s real one, and the mailbox rule is in a.lee\'s mailbox.' },
        { id: 'malware', correct: false, text: 'Malware on a.lee\'s computer', explain: 'Nothing shows malware. The evidence is a mailbox account being accessed and configured.' },
        { id: 'insider', correct: false, text: 'a.lee committed the fraud', explain: 'a.lee acted on a request they believed was genuine. The sign-in from abroad and the hidden rule show someone else was in the mailbox.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'recall', correct: true, text: 'Ring Northwind on a number you already hold, contact the bank at once to try to recall the payment, hold the queued payments, then revoke a.lee\'s sessions, reset the password and remove the rule', explain: 'Speed matters for any recall, and the supplier must be confirmed through a trusted channel. Then you evict the attacker and hold the other payments.' },
        { id: 'emailnew', correct: false, text: 'Email the "new" address asking Northwind to confirm the change', explain: 'You would be asking the attacker to confirm their own fraud.' },
        { id: 'delrule', correct: false, text: 'Delete the rule and carry on', explain: 'It does nothing about the money already gone, the other payments, or the attacker\'s access.' },
        { id: 'wait', correct: false, text: 'Wait for the supplier to follow up', explain: 'Every hour reduces the chance of recovering the funds, and the next payments could be diverted.' },
      ],
    },
    story: [
      'Two days earlier, 21:14: an attacker signs in to a.lee\'s mailbox from a hosting provider. a.lee never works at that hour.',
      '21:20: they create a rule named "x" that hides all mail from the real Northwind domain, then read the PO 7712 thread.',
      'Wednesday 08:41: they register northwind-logistics.co and reply in the existing thread: "our bank has changed", with a discount deadline.',
      '14:20: a.lee pays £86,400 to the new account. The real supplier\'s replies were hidden, so nobody noticed until they phoned.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'beacon-hunt',
    title: 'Hunting the quiet beacon',
    skill: 'everyday',
    blurb: 'There is no alert. You hypothesise that something is beaconing out, and go looking for it.',
    brief: [
      'This is a threat hunt: there is no alert. Your hypothesis is that a compromised machine is "beaconing" to its operator at regular intervals, hidden among normal traffic.',
      'You have a week of proxy summaries to start with. A lot of regular traffic is legitimate, so the skill is telling the unusual from the merely regular. Flag only what you can justify.',
    ],
    ratings: RATINGS,
    clues: {
      regular: { strength: 'strong', text: 'LAPTOP-221 contacts one rare domain once a minute, with tiny, uniform responses: a beacon.' },
      newdom: { strength: 'strong', text: 'That domain was registered nine days ago and only this one laptop has ever looked it up.' },
      masq: { strength: 'strong', text: 'The process making the connection is a fake "svchost.exe" running from C:\\Users\\Public.' },
      persist: { strength: 'strong', text: 'A Run-key entry named "OneDriveUpdate" launches that fake program at every logon.' },
      parent: { strength: 'strong', text: 'Its parent is explorer.exe. A real service host is started by services.exe.' },
      ua: { strength: 'weak', text: 'The beacon uses an outdated browser identification string.' },
    },
    artefacts: [
      {
        id: 'proxy', title: 'Proxy summary: regular outbound connections (7 days)',
        blurb: 'Hosts that contact the same destination at steady intervals.',
        lines: [
          { id: 'h1', type: 'clue', clue: 'regular', text: 'LAPTOP-221  ->  cdn-assets-sync.example:443   1,440 connections/day (one per 60s, +/- 2s), response ~230 bytes each', note: 'A very steady heartbeat, to one destination, with almost identical tiny responses. That is a beacon: malware checking in for instructions.' },
          { id: 'h2', type: 'herring', text: '130 hosts  ->  update.vendor-av.example:443   1 connection every 30 minutes', note: 'Regular, but from the whole estate, to the antivirus vendor\'s own update service. Regularity alone is not suspicious.' },
          { id: 'h3', type: 'herring', text: 'All hosts  ->  time.windows.com:123   periodic', note: 'Clock synchronisation. Always regular, always expected.' },
          { id: 'h4', type: 'plain', text: 'LAPTOP-009  ->  outlook.office365.com:443   steady', note: 'Ordinary mail traffic.' },
          { id: 'h5', type: 'herring', text: 'All protected hosts  ->  telemetry.vendor-edr.example:443   1 per 5 minutes', note: 'The security agent reporting in. Every protected host does the same, to the vendor\'s known domain.' },
        ],
      },
      {
        id: 'domain', title: 'Domain intelligence and DNS',
        blurb: 'What do we know about the destinations?',
        unlockedBy: 'regular',
        lines: [
          { id: 'd1', type: 'clue', clue: 'newdom', text: 'cdn-assets-sync.example: registered 9 days ago. First queried in the company by LAPTOP-221; no other host has ever asked.', note: 'A brand-new domain that exactly one machine talks to, despite a name chosen to look like a content network.' },
          { id: 'd2', type: 'herring', text: 'update.vendor-av.example: registered 2011, queried by 130 hosts', note: 'Old, widely used and expected. It is the opposite of the first domain.' },
          { id: 'd4', type: 'herring', text: 'DNS: no unusually long or numerous TXT queries from any host this week', note: 'No sign of DNS tunnelling. The beacon runs over HTTPS, not DNS, which rules out one explanation.' },
          { id: 'd3', type: 'clue', clue: 'ua', text: 'Beacon requests use User-Agent: Mozilla/5.0 ... Chrome/79.0 (an outdated version)', note: 'Malware often hard-codes an old browser string. True and helpful, but not proof by itself.' },
        ],
      },
      {
        id: 'endpoint', title: 'LAPTOP-221: process and persistence',
        blurb: 'What is making those connections?',
        unlockedBy: 'newdom',
        lines: [
          { id: 'e1', type: 'clue', clue: 'masq', text: 'Connecting process: svchost.exe, path C:\\Users\\Public\\svchost.exe', note: 'The genuine svchost.exe lives in C:\\Windows\\System32. A copy under a public user folder is masquerading.' },
          { id: 'e2', type: 'clue', clue: 'parent', text: 'Parent process of that svchost.exe: explorer.exe', note: 'The real service host is started by services.exe. A "svchost" launched from the user\'s desktop is a fake.' },
          { id: 'e3', type: 'clue', clue: 'persist', text: 'Registry Run key "OneDriveUpdate" -> C:\\Users\\Public\\svchost.exe', note: 'A disguised startup entry so the beacon survives a reboot.' },
          { id: 'e4', type: 'herring', text: 'OneDrive.exe running from C:\\Users\\a.lee\\AppData\\Local (normal)', note: 'The real OneDrive in its proper location. Names are being borrowed, but this one is genuine.' },
          { id: 'e5', type: 'herring', text: 'chrome.exe  ->  various sites', note: 'Ordinary browsing.' },
          { id: 'e6', type: 'herring', text: 'Windows Defender signatures last updated yesterday', note: 'Up to date and unrelated. It did not catch the fake svchost, which is a separate lesson about relying on antivirus alone.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'c2', correct: true, text: 'Command-and-control beaconing from malware masquerading as a Windows process', explain: 'A steady heartbeat to a brand-new domain, from a fake svchost with its own persistence, is malware waiting for instructions.' },
        { id: 'av', correct: false, text: 'Legitimate antivirus update traffic', explain: 'The AV update pattern is real, but it comes from 130 hosts to an old, well-known domain. This is one laptop to a new domain.' },
        { id: 'dns', correct: false, text: 'Data exfiltration through DNS tunnelling', explain: 'The evidence shows regular HTTPS beacons with tiny responses, not unusually long or frequent DNS lookups.' },
        { id: 'adware', correct: false, text: 'Harmless adware', explain: 'Adware does not masquerade as svchost, hide a Run key under a OneDrive name, or beacon to a domain registered a week ago.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'isolate', correct: true, text: 'Isolate LAPTOP-221, collect memory and the binary, block the domain, and hunt for the same file hash, domain and Run key across the estate', explain: 'Contain it, keep the evidence, stop the callbacks, and check whether other machines are infected. One beacon is rarely the only one.' },
        { id: 'delete', correct: false, text: 'Delete the file and move on', explain: 'You lose the evidence, you do not know how it arrived, and you have not checked any other host.' },
        { id: 'ignore', correct: false, text: 'Ignore it: it is only one laptop', explain: 'A foothold on one laptop is how larger incidents start.' },
        { id: 'rebuild', correct: false, text: 'Rebuild the laptop immediately', explain: 'You would remove the evidence and miss the chance to find out what was taken and who else is affected.' },
      ],
    },
    story: [
      'Nine days earlier: the attacker registers cdn-assets-sync.example, chosen to look like a content network.',
      'Sometime before the hunt: malware lands on LAPTOP-221 and copies itself to C:\\Users\\Public as "svchost.exe", with a Run key named after OneDrive so it restarts at every logon.',
      'Every 60 seconds since: it calls home with a tiny request and waits for orders, hiding among thousands of normal connections.',
      'Nothing alerted. It was found only because someone went looking and knew that regular is not the same as malicious.',
    ],
  },
];
