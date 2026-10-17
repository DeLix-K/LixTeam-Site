// Vulnerability Management Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. Vulnerability ids use the impossible year 2099. IP addresses come
// from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).

export const VULN = [
  {
    id: 'known-exploited',
    title: 'Exploited before the patch',
    skill: 'data',
    blurb: 'The vendor warns that a flaw in your VPN gateway is being exploited. Patching is only the start.',
    role: 'Vulnerability manager, Contoso',
    startClock: '08:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Thursday, 08:30. The vendor of your VPN gateway has published an urgent advisory: a critical flaw (CVE-2099-5120, no sign-in needed) is being used in attacks, and a fix is available. Your gateway is on the internet and 800 staff use it.',
      'You are the vulnerability manager and you run the response. The obvious move is to patch, but the advisory was published days after attacks began, so you need to find out whether anyone got in before you act. Every action takes time, and the gateway is exposed until it is dealt with.',
    ],
    initial: {
      flags: {
        exposed: true, // the vulnerable management interface is reachable from the internet
        compromised: true, // someone already used the flaw (the player does not know yet)
        persistence: true, // a rogue admin account and a planted file are still on the gateway
        patched: false,
        credsReset: false,
        sessionsKilled: false,
        hunted: false,
        mgrTold: false,
        vpnOff: false,
      },
    },
    passive: (s) => (s.flags.exposed ? 3 : 0) + (s.flags.persistence ? 3 : 0),
    events: [
      {
        id: 'new-attempts', at: 3, expires: true,
        when: (s) => s.flags.exposed,
        run: () => ({ threat: 12, severity: 'high', text: 'A second group begins exploiting the flaw against the gateway: it is still open to the internet.' }),
      },
      {
        id: 'lateral', at: 6, expires: true,
        when: (s) => s.flags.persistence && !s.flags.credsReset,
        run: () => ({ threat: 22, severity: 'high', text: 'Using the directory account stored on the gateway, the attacker begins signing in to internal servers.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'advisory', group: 'Investigate', label: 'Read the vendor advisory and the known-exploited listing', hint: 'How urgent, and what does it say to do?', tag: 'key',
        run: () => ({
          reveal: { advisory: 'The flaw is in the gateway\'s web management interface and needs no sign-in. It is on the known-exploited list, attacks began two weeks ago, and the vendor warns that patching does not remove an attacker who has already got in. It also describes a mitigation: block the management interface from the internet.' },
          text: 'This is actively exploited, and the vendor itself warns that patching alone may not be enough.',
        }),
      },
      {
        id: 'logs', group: 'Investigate', label: 'Check the gateway logs for signs it was already exploited', hint: 'Did anyone get in before the advisory?', tag: 'key',
        run: () => ({
          reveal: { logs: 'On 3 October at 03:12, requests matching the exploit came from 203.0.113.58. A new administrator account "svc-support" was created minutes later, and a file was written to the web directory. The account has signed in four times since.' },
          text: 'You were hit before the advisory existed. There is a rogue admin account and a planted file on the gateway.',
        }),
      },
      {
        id: 'hunt', group: 'Investigate', label: 'Search internal systems for activity from the gateway\'s directory account', hint: 'Has the attacker moved on?', tag: 'key',
        when: (s) => !!s.facts.logs && !s.flags.hunted,
        run: (s) => ({
          set: { hunted: true },
          reveal: { hunt: s.flags.credsReset ? 'The directory account has not been used outside normal patterns since its password was reset.' : 'The directory account stored on the gateway is being used to query the directory for 214 users, and to try signing in to two internal servers.' },
          text: s.flags.credsReset ? 'Nothing unusual since the reset.' : 'The attacker is already using the gateway\'s directory account to look around inside.',
        }),
      },
      {
        id: 'rescan', group: 'Investigate', label: 'Run another vulnerability scan against the gateway', hint: 'Confirm the flaw is there.', tag: 'weak',
        run: () => ({ text: 'The scan confirms what the advisory already says. It tells you nothing about whether the gateway has been attacked.' }),
      },
      // ── Contain
      {
        id: 'mitigate', group: 'Contain', label: 'Apply the vendor mitigation: block the management interface from the internet', hint: 'Close the door now, patch next.', tag: 'key',
        when: (s) => !!s.facts.advisory && s.flags.exposed,
        run: () => ({ set: { exposed: false }, disruption: 2, text: 'The management interface is no longer reachable from the internet. New exploitation stops.' }),
      },
      {
        id: 'kill-sessions', group: 'Contain', label: 'End all active sessions on the gateway and force sign-in again', hint: 'Throw out anyone who is signed in.', tag: 'useful',
        when: (s) => !s.flags.sessionsKilled,
        run: () => ({ set: { sessionsKilled: true }, disruption: 6, text: 'Every session is ended. Staff have to sign in again, and so does anyone who should not be there.' }),
      },
      {
        id: 'remove', group: 'Contain', label: 'Delete the rogue admin account and the planted file, and restore the settings from a known-good backup', hint: 'Remove the attacker\'s foothold.', tag: 'key',
        when: (s) => !!s.facts.logs && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 4, text: 'The rogue account and the planted file are removed, and the gateway\'s settings are restored from a backup made before the attack.' }),
      },
      {
        id: 'patch', group: 'Contain', label: 'Install the fixed version (the VPN restarts for about ten minutes)', hint: 'Close the flaw itself.', tag: 'key',
        when: (s) => !!s.facts.advisory && !s.flags.patched,
        run: () => ({ set: { patched: true, exposed: false }, disruption: 8, text: 'The gateway is running the fixed version. The flaw can no longer be used, but anything the attacker left behind is still there if you have not removed it.' }),
      },
      {
        id: 'reset-creds', group: 'Contain', label: 'Reset the gateway admin passwords, replace its certificates and rotate the directory account it uses', hint: 'Whatever the gateway holds, the attacker may have.', tag: 'key',
        when: (s) => !s.flags.credsReset,
        run: () => ({ set: { credsReset: true }, disruption: 5, text: 'The passwords, certificates and the directory account are replaced. Anything the attacker copied from the gateway no longer works.' }),
      },
      {
        id: 'vpn-off', group: 'Contain', label: 'Switch off the VPN for everyone until this is over', hint: 'Cut everything off.', tag: 'overreact',
        run: () => ({ set: { exposed: false, vpnOff: true }, disruption: 32, text: 'The VPN is off and 800 people cannot work remotely. The exposure stops, but the attacker\'s foothold and stolen details are untouched.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the IT director and the security manager', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The IT director and security manager are briefed, and they agree to handle staff messages about the VPN restart.' }),
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
      out.push(s.flags.patched ? { label: 'The flaw was patched', points: 12 } : s.flags.exposed ? { label: 'The gateway was left exposed', points: -14 } : { label: 'Mitigated, but not yet patched', points: 4 });
      out.push(s.flags.persistence ? { label: 'The attacker\'s account and file were left in place', points: -15 } : { label: 'The attacker\'s foothold was removed', points: 12 });
      out.push(s.flags.credsReset ? { label: 'Credentials the gateway held were replaced', points: 10 } : { label: 'Credentials the gateway held were left working', points: -12 });
      out.push(s.flags.hunted ? { label: 'Internal systems searched for follow-on activity', points: 6 } : { label: 'Did not check for follow-on activity', points: -6 });
      if (s.flags.sessionsKilled) out.push({ label: 'Active sessions ended', points: 3 });
      if (s.flags.mgrTold) out.push({ label: 'IT director and security manager briefed', points: 4 });
      if (s.flags.vpnOff) out.push({ label: 'Switched off the VPN for everyone', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker stayed in and spread, or the business was cut off for no benefit.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: a foothold left behind, credentials not replaced, or too much disruption.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'You closed the door, removed what was already inside, replaced what the gateway held and checked for spread.' },
    ],
    debrief: [
      {
        id: 'ic-kev-after',
        question: 'The gateway was exploited before the patch existed. After you patch, what else must you do?',
        options: [
          { text: 'Check for compromise, remove anything the attacker left, and replace the credentials the device held', correct: true, explain: 'A patch closes the hole, but it does not evict someone who is already inside. The vendor\'s own advice was to look for signs of attack as well as patch.' },
          { text: 'Nothing: once it is patched the risk is gone', correct: false, explain: 'Patching does not remove an account or a planted file, and it does not make stolen passwords stop working.' },
          { text: 'Rescan to confirm the flaw is fixed and close the ticket', correct: false, explain: 'A scan confirms the flaw is fixed. It says nothing about whether you were attacked beforehand.' },
          { text: 'Wait to see whether anything bad happens', correct: false, explain: 'By the time something visible happens, an attacker has had time to move to other systems.' },
        ],
      },
      {
        id: 'ic-kev-priority',
        question: 'The flaw scored lower than several other open critical findings. Why was it the most urgent?',
        options: [
          { text: 'It was being exploited in the wild and the gateway was reachable from the internet', correct: true, explain: 'Active exploitation and exposure turn a theoretical flaw into a live one. The score alone would have ranked it lower.' },
          { text: 'Because the vendor is well known', correct: false, explain: 'Reputation does not make a flaw urgent. Exploitation and exposure do.' },
          { text: 'Because it was the newest finding', correct: false, explain: 'Newness is not a measure of risk.' },
          { text: 'Because it had the highest CVSS score of all findings', correct: false, explain: 'It did not. The urgency came from exploitation and exposure, not the score.' },
        ],
      },
    ],
  },
];
