// Network Security Incident Commander incidents (see incidents.js for the format). Everything here
// is fictional. IP addresses come from the reserved documentation ranges (203.0.113.0/24,
// 198.51.100.0/24) and private ranges (10.x).

export const NETWORK = [
  {
    id: 'exposed-remote',
    title: 'The open door on port 3389',
    skill: 'identity',
    blurb: 'Thousands of failed remote desktop sign-ins, and one that worked. Close the door, but also find out who walked through it.',
    role: 'Network security engineer, Contoso',
    startClock: '07:20',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Monday, 07:20. Your firewall dashboard shows a spike: over 9,000 failed remote desktop sign-ins over the weekend from dozens of internet addresses. Worse, the log shows one success: the account "warehouse-admin" signed in at 03:12 on Sunday.',
      'You are the network security engineer on call. The remote desktop service on the warehouse server is open to the internet, and someone may already be inside. Every action takes time, and the business needs the warehouse system running by 08:30.',
    ],
    initial: {
      flags: {
        exposed: true, // remote desktop is reachable from the internet
        compromised: true, // the successful sign-in was the attacker
        persistence: true, // a scheduled task the attacker created is still on the server
        credsReset: false,
        accountDisabled: false,
        isolated: false,
        hunted: false,
        mfaAdded: false,
        mgrTold: false,
        shutdown: false,
      },
    },
    passive: (s) => (s.flags.exposed ? 3 : 0) + (s.flags.persistence ? 3 : 0),
    events: [
      {
        id: 'more-guesses', at: 3, expires: true,
        when: (s) => s.flags.exposed,
        run: () => ({ threat: 10, severity: 'high', text: 'More guessing attacks succeed against other accounts on the same open service.' }),
      },
      {
        id: 'lateral', at: 6, expires: true,
        when: (s) => s.flags.persistence && !s.flags.credsReset,
        run: () => ({ threat: 22, severity: 'high', text: 'Using the stolen account, the attacker connects from the warehouse server to the main file server.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'logs', group: 'Investigate', label: 'Read the remote desktop and firewall logs for the weekend', hint: 'What happened, and from where?', tag: 'key',
        run: () => ({
          reveal: { logs: '9,214 failed sign-ins came from 38 internet addresses. At 03:12 on Sunday, "warehouse-admin" signed in from 198.51.100.77, an account that has never used remote access before. The session lasted 41 minutes.' },
          text: 'It is not just noise: one guess succeeded, on an account that never uses remote desktop.',
        }),
      },
      {
        id: 'session', group: 'Investigate', label: 'Look at what the account did on the warehouse server during that session', hint: 'Did they leave anything behind?', tag: 'key',
        when: (s) => !!s.facts.logs,
        run: () => ({
          reveal: { session: 'During the session a new scheduled task, "WinSyncCheck", was created that runs a file from a temporary folder every hour. The account also opened a connection to the main file server.' },
          text: 'The attacker left a way back: a scheduled task that runs every hour.',
        }),
      },
      {
        id: 'hunt', group: 'Investigate', label: 'Search other systems for sign-ins from the same account or address', hint: 'Has it spread?', tag: 'key',
        when: (s) => !!s.facts.session && !s.flags.hunted,
        run: (s) => ({
          set: { hunted: true },
          reveal: { hunt: s.flags.credsReset ? 'No further use of the account or the address since the password was reset.' : 'warehouse-admin has also attempted to sign in to the main file server, twice, and the file share was listed once.' },
          text: s.flags.credsReset ? 'Nothing more since the reset.' : 'The attacker has already started to look at the file server.',
        }),
      },
      {
        id: 'ipcheck', group: 'Investigate', label: 'Look up the attacking address in a reputation service', hint: 'Is it known?', tag: 'weak',
        run: () => ({ text: 'The address has a poor reputation, which is unsurprising. It does not tell you what the account did, and blocking one address will not stop them.' }),
      },
      // ── Contain
      {
        id: 'close', group: 'Contain', label: 'Remove the internet access to remote desktop at the firewall', hint: 'Close the door.', tag: 'key',
        when: (s) => s.flags.exposed,
        run: () => ({ set: { exposed: false }, disruption: 3, text: 'Remote desktop is no longer reachable from the internet. The guessing stops.' }),
      },
      {
        id: 'disable', group: 'Contain', label: 'Disable the warehouse-admin account and end its sessions', hint: 'Throw out the user.', tag: 'useful',
        when: (s) => !!s.facts.logs && !s.flags.accountDisabled,
        run: () => ({ set: { accountDisabled: true }, disruption: 4, text: 'The account is disabled and its sessions are ended. The warehouse team uses a temporary account for the shift.' }),
      },
      {
        id: 'isolate', group: 'Contain', label: 'Isolate the warehouse server from the rest of the network', hint: 'Stop it reaching other systems.', tag: 'useful',
        when: (s) => !s.flags.isolated,
        run: () => ({ set: { isolated: true }, disruption: 14, text: 'The warehouse server is cut off from the network. It cannot reach the file server, but the warehouse team cannot use it either.' }),
      },
      {
        id: 'remove', group: 'Contain', label: 'Delete the scheduled task and the file it runs, after saving a copy as evidence', hint: 'Remove the way back.', tag: 'key',
        when: (s) => !!s.facts.session && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 3, text: 'The task and its file are removed, and a copy is saved for the investigation.' }),
      },
      {
        id: 'reset', group: 'Contain', label: 'Reset the passwords of the local and domain accounts used on the server', hint: 'Assume they are known.', tag: 'key',
        when: (s) => !s.flags.credsReset,
        run: () => ({ set: { credsReset: true }, disruption: 5, text: 'The passwords are reset. Anything the attacker has copied no longer works.' }),
      },
      {
        id: 'mfa', group: 'Contain', label: 'Put remote access behind the VPN with multi-factor authentication', hint: 'The lasting fix.', tag: 'useful',
        when: (s) => !s.flags.mfaAdded,
        run: () => ({ set: { mfaAdded: true }, disruption: 6, text: 'Remote desktop now needs the VPN and a second factor. Staff who work remotely are given instructions.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down all remote access and the warehouse server', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { shutdown: true, exposed: false }, disruption: 40, text: 'The warehouse stops. The exposure is gone, but so is the business, and the attacker\'s task and account are untouched.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the IT manager and the warehouse supervisor', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The IT manager and warehouse supervisor are briefed, and agree how the warehouse will work during the clean-up.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.exposed && !s.flags.persistence,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.exposed && !s.flags.persistence,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.exposed ? { label: 'Remote desktop was left open to the internet', points: -14 } : { label: 'Remote desktop was closed to the internet', points: 12 });
      out.push(s.flags.persistence ? { label: 'The attacker\'s scheduled task was left in place', points: -15 } : { label: 'The attacker\'s way back was removed', points: 12 });
      out.push(s.flags.credsReset ? { label: 'Passwords used on the server were reset', points: 10 } : { label: 'Passwords used on the server were left working', points: -12 });
      out.push(s.flags.hunted ? { label: 'Other systems searched for spread', points: 6 } : { label: 'Did not check other systems for spread', points: -6 });
      if (s.flags.mfaAdded) out.push({ label: 'Remote access put behind a VPN with MFA', points: 8 });
      if (s.flags.accountDisabled) out.push({ label: 'The compromised account disabled', points: 3 });
      if (s.flags.isolated && !s.flags.shutdown) out.push({ label: 'Server isolated to stop it reaching other systems', points: 2 });
      if (s.flags.mgrTold) out.push({ label: 'IT manager and supervisor briefed', points: 4 });
      if (s.flags.shutdown) out.push({ label: 'Shut down the warehouse and remote access entirely', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker stayed in and spread, or the business was stopped for no benefit.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: a way back left behind, passwords not reset, or too much disruption.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'You closed the door, removed what was left inside, reset what was known and checked for spread.' },
    ],
    debrief: [
      {
        id: 'ic-rdp-exposed',
        question: 'Why is remote desktop open to the internet such a serious weakness?',
        options: [
          { text: 'It is constantly guessed at by automated attacks, and a single weak or reused password gives full access to a server', correct: true, explain: 'Attackers scan the internet for exposed remote desktop and guess passwords around the clock. Putting it behind a VPN with a second factor removes it from the internet and makes a guessed password useless.' },
          { text: 'Because it is slow', correct: false, explain: 'Speed is not the issue. Exposure and weak authentication are.' },
          { text: 'Because it uses a non-standard port', correct: false, explain: 'It uses a standard port, which is exactly why scanners find it.' },
          { text: 'It is only a problem if the server is old', correct: false, explain: 'A fully patched server is still compromised by a guessed password.' },
        ],
      },
      {
        id: 'ic-rdp-closing',
        question: 'You closed remote desktop. What else did the successful sign-in make necessary?',
        options: [
          { text: 'Check what the account did, remove anything it left behind, reset passwords and look for spread', correct: true, explain: 'Closing the door does not remove someone who has already got in. A scheduled task and a known password give them a way back.' },
          { text: 'Nothing: once it is closed the risk is gone', correct: false, explain: 'The attacker had a scheduled task running every hour and a password that still worked.' },
          { text: 'Block the one attacking address', correct: false, explain: 'The scheduled task does not need that address, and the attacker can use another.' },
          { text: 'Wait to see what the attacker does next', correct: false, explain: 'Waiting gave them time to reach the file server.' },
        ],
      },
    ],
  },
];
