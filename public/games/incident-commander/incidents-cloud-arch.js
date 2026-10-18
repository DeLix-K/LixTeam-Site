// Cloud Security Architect Incident Commander incidents (see incidents.js for the format). Everything
// here is fictional. IP addresses come from the reserved documentation ranges. Cloud terms are generic.

export const CLOUD_ARCH = [
  {
    id: 'idp-takeover',
    title: 'The keys to every door',
    skill: 'identity',
    blurb: 'Someone has taken over an administrator of your company\'s sign-in system. Every cloud account trusts it. Cut them out without locking out the whole company, and make sure you can still get in yourself.',
    role: 'Cloud security architect, Contoso',
    startClock: '13:20',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Thursday, 13:20. Your identity provider, the system that every cloud account uses to sign people in, shows a new administrator sign-in from an unfamiliar address, followed by a change to how sign-in works for the cloud accounts. You think someone has taken over an administrator.',
      'You are the cloud security architect. If you switch off the sign-in system, nobody in the company can reach any cloud account. Every action takes time, and the production support team is mid-release.',
    ],
    initial: {
      flags: {
        adminHeld: true, // the attacker controls an identity administrator
        rogueTrust: true, // the attacker added a second sign-in source they control
        sessionsLive: true, // the attacker holds active sessions into cloud accounts
        breakGlassReady: false,
        evidenceKept: false,
        cloudChange: false,
        sessionsUsed: false,
        dpoTold: false,
        mgrTold: false,
        shutdown: false,
        massReset: false,
      },
    },
    passive: (s) => (s.flags.adminHeld ? 2 : 0) + (s.flags.rogueTrust ? 2 : 0) + (s.flags.sessionsLive ? 1 : 0),
    events: [
      {
        id: 'cloud-change', at: 4, expires: true,
        when: (s) => s.flags.rogueTrust && !s.flags.breakGlassReady,
        run: () => ({ set: { cloudChange: true }, threat: 18, severity: 'high', text: 'Using the second sign-in source, the attacker signs in to the production cloud account as an administrator and creates a new access key.' }),
      },
      {
        id: 'lockout-risk', at: 7, expires: true,
        when: (s) => s.flags.adminHeld && !s.flags.breakGlassReady,
        run: () => ({ threat: 10, severity: 'medium', text: 'The attacker changes the second factor on two more administrators. If you have to switch off sign-in now, you will have no emergency way in.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'audit', group: 'Investigate', label: 'Read the identity provider\'s administrator audit log', hint: 'Who did what?', tag: 'key',
        run: () => ({
          reveal: { audit: 'Administrator "j.okafor" signed in from 198.51.100.140 at 12:48, after a password reset requested from a new device. The account has no hardware key. Within ten minutes it added a new sign-in source to the cloud accounts\' trust settings.' },
          text: 'An administrator account has been taken over, and the attacker has changed how the cloud accounts decide who can sign in.',
        }),
      },
      {
        id: 'trusts', group: 'Investigate', label: 'List every sign-in source the cloud accounts trust, and compare it with the approved list', hint: 'What has been added?', tag: 'key',
        when: (s) => !!s.facts.audit,
        run: () => ({
          reveal: { trusts: 'There is one source you do not recognise, "partner-sso-2", added at 12:58. It points to an identity system outside the company and is trusted by the production and finance cloud accounts.' },
          text: 'The attacker has a second route in that does not depend on the stolen administrator.',
        }),
      },
      {
        id: 'sessions', group: 'Investigate', label: 'Check which cloud sessions were started through the new source', hint: 'Are they already inside?', tag: 'key',
        when: (s) => !!s.facts.trusts,
        run: () => ({
          reveal: { sessions: 'Three active cloud sessions came from partner-sso-2 in the last 20 minutes: two read-only in the finance account, one with administrator rights in the production account.' },
          text: 'The attacker is already in the cloud accounts, including one with administrator rights.',
        }),
      },
      {
        id: 'bigscan', group: 'Investigate', label: 'Scan every cloud account for vulnerabilities', hint: 'Look for the weakness?', tag: 'weak',
        run: () => ({ text: 'The scan takes hours and tells you nothing about the identity takeover. The weakness is not a vulnerability in the accounts.' }),
      },
      // ── Contain
      {
        id: 'breakglass', group: 'Contain', label: 'Confirm the emergency administrator accounts work and are kept separate from the identity provider, and have two people on standby', hint: 'Keep your own way in.', tag: 'key',
        when: (s) => !!s.facts.audit && !s.flags.breakGlassReady,
        run: () => ({ set: { breakGlassReady: true }, disruption: 1, text: 'You test the two emergency accounts. They work, they do not rely on the identity provider, and two senior engineers are standing by.' }),
      },
      {
        id: 'preserve', group: 'Contain', label: 'Save the identity provider\'s audit log, the trust settings and the session details before changing anything', hint: 'Keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.audit && !s.flags.evidenceKept,
        run: () => ({ set: { evidenceKept: true }, disruption: 1, text: 'The logs, the old trust list and the session records are copied to a protected account.' }),
      },
      {
        id: 'remove-trust', group: 'Contain', label: 'Remove partner-sso-2 from every cloud account\'s trust settings', hint: 'Close the second route.', tag: 'key',
        when: (s) => !!s.facts.trusts && s.flags.rogueTrust,
        run: () => ({ set: { rogueTrust: false }, disruption: 3, text: 'The unfamiliar sign-in source is removed from all cloud accounts. New sessions from it cannot be started.' }),
      },
      {
        id: 'revoke', group: 'Contain', label: 'End every cloud session started through the new source, and disable the access key the attacker created', hint: 'Remove them from inside.', tag: 'key',
        when: (s) => !!s.facts.sessions && s.flags.sessionsLive,
        run: () => ({ set: { sessionsLive: false }, disruption: 3, text: 'The three sessions are ended and the access key is disabled. The attacker is out of the cloud accounts.' }),
      },
      {
        id: 'secure-admin', group: 'Contain', label: 'Lock the taken-over administrator, reset their access, and require hardware keys for every identity administrator', hint: 'Take the control point back.', tag: 'key',
        when: (s) => !!s.facts.audit && s.flags.adminHeld,
        run: () => ({ set: { adminHeld: false }, disruption: 4, text: 'The administrator is locked and recovered, and hardware keys are required for all identity administrators. The attacker can no longer change sign-in settings.' }),
      },
      {
        id: 'mass-reset', group: 'Contain', label: 'Force every one of the 1,500 staff to reset their password and sign in again now', hint: 'Be safe?', tag: 'bad',
        run: () => ({ set: { massReset: true }, disruption: 30, text: 'Everyone is signed out in the middle of the afternoon. The attacker\'s second source is untouched, and the help desk is swamped.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Switch off the identity provider so that nobody can sign in to anything', hint: 'Stop it dead?', tag: 'overreact',
        run: () => ({ set: { shutdown: true }, disruption: 60, text: 'Nobody in the company can reach any cloud account, including you. The attacker\'s existing sessions carry on until they expire.' }),
      },
      // ── Communicate
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the data protection officer that finance systems were read through a hijacked sign-in route', hint: 'Personal or financial data may have been read.', tag: 'key',
        when: (s) => !!s.facts.sessions && !s.flags.dpoTold,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts an assessment of what the finance sessions could have read.' }),
      },
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the CISO and the head of production support', hint: 'Keep the right people informed.', tag: 'useful',
        when: (s) => !!s.facts.audit,
        run: () => ({ set: { mgrTold: true }, text: 'The CISO and the head of production support are briefed, and the release is paused for an hour.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.adminHeld && !s.flags.rogueTrust && !s.flags.sessionsLive,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.adminHeld && !s.flags.rogueTrust && !s.flags.sessionsLive,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.adminHeld ? { label: 'The taken-over administrator was left in the attacker\'s hands', points: -20 } : { label: 'The administrator account was recovered and hardened', points: 10 });
      out.push(s.flags.rogueTrust ? { label: 'The attacker\'s sign-in source was left in place', points: -20 } : { label: 'The rogue sign-in source was removed', points: 12 });
      out.push(s.flags.sessionsLive ? { label: 'The attacker\'s cloud sessions were left running', points: -15 } : { label: 'The attacker\'s sessions were ended', points: 8 });
      if (s.flags.cloudChange) out.push({ label: 'The attacker created an access key in production before the second source was removed', points: -15 });
      if (s.flags.breakGlassReady) out.push({ label: 'Emergency access confirmed before you changed anything', points: 10 });
      else out.push({ label: 'You did not check you had a way in that does not depend on the identity provider', points: -12 });
      if (s.flags.evidenceKept) out.push({ label: 'Evidence saved before changes', points: 6 });
      if (s.flags.dpoTold) out.push({ label: 'DPO told', points: 6 });
      else if (s.flags.sessionsUsed || s.flags.sessionsLive === false) out.push({ label: 'DPO not told about the finance sessions', points: -8 });
      if (s.flags.mgrTold) out.push({ label: 'Leadership briefed', points: 4 });
      if (s.flags.massReset) out.push({ label: 'Forced a company-wide password reset', points: -12 });
      if (s.flags.shutdown) out.push({ label: 'Switched off the identity provider', points: -15 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept control, or you locked yourself and the company out.' },
      { min: 50, name: 'Costly', blurb: 'Contained, but with gaps: no emergency access, evidence lost, or a disruptive overreaction.' },
      { min: 90, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 135, name: 'Textbook', blurb: 'You secured your own way in first, removed the second route and the sessions, took back the administrator and told the right people.' },
    ],
    debrief: [
      {
        id: 'ic-idp-breakglass',
        question: 'Why confirm your emergency access before changing anything in the identity provider?',
        options: [
          { text: 'Everything signs in through it, so if your containment steps lock people out, a separate emergency route is the only way back in', correct: true, explain: 'Emergency accounts that do not depend on the identity provider keep you in control while you take it back. Without them, a mistake or an attacker\'s change can lock everyone out.' },
          { text: 'Because the audit requires it', correct: false, explain: 'It is a practical safeguard, not a paperwork one.' },
          { text: 'To impress the board', correct: false, explain: 'It is about keeping control of the response.' },
          { text: 'It is not needed if you act quickly', correct: false, explain: 'Speed does not replace a way in. The attacker changed more administrators while you worked.' },
        ],
      },
      {
        id: 'ic-idp-order',
        question: 'Why remove the rogue sign-in source and not just reset the stolen administrator?',
        options: [
          { text: 'The attacker\'s second source works without the stolen account, so resetting the administrator alone would leave them in', correct: true, explain: 'The attacker created a second route so they would not depend on one account. You must close every route, not only the one you found first.' },
          { text: 'Because resetting an administrator is not possible', correct: false, explain: 'It is possible, and necessary, but not enough.' },
          { text: 'Because the rogue source is cheaper to remove', correct: false, explain: 'Cost is not the reason.' },
          { text: 'It is enough to reset the administrator', correct: false, explain: 'It would leave the attacker able to sign in to production.' },
        ],
      },
    ],
  },
];
