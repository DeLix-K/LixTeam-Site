// Senior Network Security Incident Commander incidents (see incidents.js for the format). Everything
// here is fictional. IP addresses come from the reserved documentation ranges.

export const NETWORK_LEAD = [
  {
    id: 'dns-hijack',
    title: 'The login page that was not ours',
    skill: 'identity',
    blurb: 'Customers say the Contoso sign-in page asks for their details twice. Someone has changed where your domain points. Take the name back, fix what was served in the meantime and tell the right people.',
    role: 'Senior network security engineer, Contoso',
    startClock: '09:20',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Monday, 09:20. The support desk is receiving calls: customers say the Contoso sign-in page loaded slowly, asked for their password and then asked again. Your monitoring shows the address of the sign-in page has changed.',
      'You are the senior network security engineer on call. The domain is managed through an external registrar and DNS provider. Every action takes time, and your DNS records are cached around the internet for a while after you change them.',
    ],
    initial: {
      flags: {
        recordsHijacked: true, // the sign-in name points to the attacker's server
        accountOpen: true, // the registrar account is still controlled by the attacker
        certIssued: true, // a valid certificate for the sign-in name exists in the attacker's hands
        recordsRestored: false,
        accountSecured: false,
        certRevoked: false,
        customersWarned: false,
        resetForced: false,
        mgrTold: false,
        shutdown: false,
        evidenceKept: false,
      },
    },
    passive: (s) => (s.flags.recordsHijacked ? 5 : 0) + (s.flags.accountOpen ? 2 : 0),
    events: [
      {
        id: 'more-changes', at: 5, expires: true,
        when: (s) => s.flags.accountOpen && !s.flags.accountSecured,
        run: () => ({ set: { recordsHijacked: true }, threat: 18, severity: 'high', text: 'The attacker, still in the registrar account, changes the mail records as well, so they now receive Contoso\'s email, including password resets.' }),
      },
      {
        id: 'cert-use', at: 7, expires: true,
        when: (s) => s.flags.certIssued && !s.flags.certRevoked,
        run: () => ({ threat: 12, severity: 'medium', text: 'The attacker\'s server keeps presenting a valid certificate, so browsers show no warning even after you fix the records for some customers.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'records', group: 'Investigate', label: 'Compare the live DNS records with the approved copy', hint: 'What changed, and when?', tag: 'key',
        run: () => ({
          reveal: { records: 'The sign-in name was changed at 08:41 to 203.0.113.35, and the mail records at the same time were left alone. The change was made through the registrar account.' },
          text: 'The records were changed through the registrar, so the registrar account has been taken over.',
        }),
      },
      {
        id: 'registrar', group: 'Investigate', label: 'Read the registrar account\'s sign-in and change history', hint: 'Who got in, and how?', tag: 'key',
        when: (s) => !!s.facts.records,
        run: () => ({
          reveal: { registrar: 'A sign-in at 08:35 from 198.51.100.140 used the account password and a code sent by text message. The account owner\'s phone number was moved to a new SIM at 08:20 that morning. There is no hardware key on the account.' },
          text: 'Someone took over the owner\'s phone number, received the text code and signed in. A text code was the only second factor.',
        }),
      },
      {
        id: 'cert', group: 'Investigate', label: 'Search public certificate records for your domain', hint: 'Has someone got a certificate?', tag: 'useful',
        when: (s) => !!s.facts.records,
        run: () => ({
          reveal: { cert: 'A valid certificate for the sign-in name was issued at 08:46 by a public authority to an unknown party, five minutes after the records changed.' },
          text: 'The attacker holds a valid certificate for your sign-in page, so customers see no warning.',
        }),
      },
      {
        id: 'fullscan', group: 'Investigate', label: 'Run a vulnerability scan of every public Contoso website', hint: 'Look for the weakness?', tag: 'weak',
        run: () => ({ text: 'The scan takes hours and finds routine items. Nothing in the websites is the problem. The change was made at the registrar.' }),
      },
      // ── Contain
      {
        id: 'secure', group: 'Contain', label: 'Take back the registrar account: reset the password, remove the phone number as a second factor, add hardware keys and lock the domain against changes', hint: 'Stop further changes.', tag: 'key',
        when: (s) => !!s.facts.registrar && !s.flags.accountSecured,
        run: () => ({ set: { accountSecured: true, accountOpen: false }, disruption: 3, text: 'The registrar confirms the account is yours again. Sessions are ended and the domain is locked, so the attacker can no longer change anything.' }),
      },
      {
        id: 'preserve', group: 'Contain', label: 'Save the registrar logs, the changed records and the attacker\'s server details before restoring anything', hint: 'Keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.records && !s.flags.evidenceKept,
        run: () => ({ set: { evidenceKept: true }, disruption: 1, text: 'The change history, the old records and the attacker\'s address are saved for the investigation and the registrar\'s fraud team.' }),
      },
      {
        id: 'restore', group: 'Eradicate & recover', label: 'Restore the correct records and set a short cache lifetime so the fix spreads quickly', hint: 'Point the name home.', tag: 'key',
        when: (s) => !!s.facts.records && s.flags.accountSecured && !s.flags.recordsRestored,
        run: () => ({ set: { recordsRestored: true, recordsHijacked: false }, disruption: -10, text: 'The correct records are back. Customers reach the real sign-in page within minutes as caches refresh.' }),
      },
      {
        id: 'restore-early', group: 'Eradicate & recover', label: 'Change the records back right now, before you have the account back', hint: 'Fast fix?', tag: 'bad',
        when: (s) => !!s.facts.records && !s.flags.accountSecured && !s.flags.recordsRestored,
        run: () => ({ threat: 15, text: 'You put the records back, and the attacker, still in the account, changes them again within minutes.' }),
      },
      {
        id: 'revoke-cert', group: 'Eradicate & recover', label: 'Ask the authority to revoke the attacker\'s certificate, and turn on monitoring for any new certificate for your domain', hint: 'Stop them looking genuine.', tag: 'key',
        when: (s) => !!s.facts.cert && !s.flags.certRevoked,
        run: () => ({ set: { certRevoked: true }, disruption: 1, text: 'The certificate is revoked, and alerts are set for any new one. Browsers that check will warn about the attacker\'s server.' }),
      },
      {
        id: 'reset', group: 'Eradicate & recover', label: 'Force a password reset for customers who signed in during the window and warn them', hint: 'Their passwords were typed into the attacker\'s page.', tag: 'key',
        when: (s) => !!s.facts.registrar && !s.flags.customersWarned,
        run: () => ({ set: { customersWarned: true, resetForced: true }, disruption: 4, text: 'Customers who signed in between 08:41 and the fix are forced to reset their password and receive a clear warning, so the stolen passwords stop working.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Take the whole sign-in service offline until further notice', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { shutdown: true }, disruption: 55, text: 'Customers cannot sign in at all, and the attacker\'s fake page, which is not on your service, keeps working.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Tell the head of customer support, the DPO and the on-call manager what happened', hint: 'Customer passwords may have been taken.', tag: 'useful',
        when: (s) => !!s.facts.records,
        run: () => ({ set: { mgrTold: true }, text: 'Support gets a script for customers, and the DPO begins an assessment of a likely reportable breach.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.recordsHijacked && !s.flags.accountOpen,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.recordsHijacked && !s.flags.accountOpen,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.accountOpen ? { label: 'The registrar account was left in the attacker\'s hands', points: -40 } : { label: 'The registrar account was taken back and locked', points: 12 });
      out.push(s.flags.recordsHijacked ? { label: 'The sign-in name still pointed at the attacker', points: -15 } : { label: 'The records were restored', points: 10 });
      if (s.flags.certIssued && !s.flags.certRevoked) out.push({ label: 'The attacker\'s certificate was not revoked', points: -10 });
      else if (s.flags.certRevoked) out.push({ label: 'The certificate was revoked and monitored', points: 8 });
      if (s.flags.customersWarned) out.push({ label: 'Affected customers warned and passwords reset', points: 12 });
      else out.push({ label: 'Customers whose passwords were typed into the fake page were not warned', points: -18 });
      if (s.flags.evidenceKept) out.push({ label: 'Evidence saved before restoring', points: 6 });
      if (s.flags.mgrTold) out.push({ label: 'Support and the DPO informed', points: 6 });
      else out.push({ label: 'Support and the DPO not told', points: -6 });
      if (s.flags.shutdown) out.push({ label: 'Took the whole sign-in service offline', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept the domain, or customers were never told their passwords were taken.' },
      { min: 50, name: 'Costly', blurb: 'Contained, but with gaps: customers not warned, a certificate left, or evidence not saved.' },
      { min: 90, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 135, name: 'Textbook', blurb: 'You took the account back first, restored the records, revoked the certificate, protected the customers and told the right people.' },
    ],
    debrief: [
      {
        id: 'ic-dns-order',
        question: 'Why take back the registrar account before changing the records?',
        options: [
          { text: 'While the attacker still controls the account, they can simply change the records again', correct: true, explain: 'Fixing the symptom while the attacker holds the control point achieves nothing. Close the way in first, then restore.' },
          { text: 'Records cannot be changed until the account is reset', correct: false, explain: 'They can, which is the trap: the change is undone straight away.' },
          { text: 'Because the registrar insists on an account reset', correct: false, explain: 'It is about the attacker, not the registrar\'s rules.' },
          { text: 'The order does not matter', correct: false, explain: 'It matters a great deal here.' },
        ],
      },
      {
        id: 'ic-dns-factor',
        question: 'Which change would have prevented the attacker signing in to the registrar account?',
        options: [
          { text: 'Hardware security keys instead of a text message as the second factor, and a registrar lock on the domain', correct: true, explain: 'A text code can be intercepted when someone takes over a phone number. A hardware key cannot be used from the attacker\'s machine, and a lock stops changes without extra checks.' },
          { text: 'A longer password', correct: false, explain: 'The attacker had the password. The text code was the only extra step.' },
          { text: 'Buying more domain names', correct: false, explain: 'It does nothing about the account.' },
          { text: 'Faster internet', correct: false, explain: 'Irrelevant.' },
        ],
      },
    ],
  },
];
