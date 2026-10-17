// Security Engineer Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).

export const ENGINEER = [
  {
    id: 'ci-compromise',
    title: 'The build that shipped a visitor',
    skill: 'data',
    blurb: 'Your deployment pipeline has been quietly modified. Customers may be running software with a backdoor in it.',
    role: 'Security engineer, Contoso',
    startClock: '09:00',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Wednesday, 09:00. A customer\'s security team reports that version 4.8.2 of your product makes an outbound connection to an address they do not recognise as soon as it starts. Your product is deployed to about 50 customers.',
      'You are the security engineer on call. The product is built and released by an automated pipeline. If the pipeline has been tampered with, every release is suspect, and the attacker may still be able to push more. Every action takes time, and a new release is scheduled for this afternoon.',
    ],
    initial: {
      flags: {
        tokenActive: true, // the stolen deployment token still works
        stepPresent: true, // a malicious build step is in the pipeline configuration
        prodTainted: true, // the latest releases contain the backdoor
        frozen: false,
        secretsRotated: false,
        customersTold: false,
        mgrTold: false,
        ciWiped: false,
      },
    },
    passive: (s) => (s.flags.tokenActive ? 3 : 0) + (s.flags.stepPresent ? 2 : 0) + (s.flags.prodTainted ? 2 : 0),
    events: [
      {
        id: 'new-release', at: 3, expires: true,
        when: (s) => s.flags.stepPresent && !s.flags.frozen,
        run: () => ({ threat: 14, severity: 'high', text: 'The afternoon release goes out early on schedule and carries the backdoor to another 20 customers.' }),
      },
      {
        id: 'rogue-push', at: 6, expires: true,
        when: (s) => s.flags.tokenActive,
        run: () => ({ threat: 20, severity: 'high', text: 'Using the stolen deployment token, the attacker pushes a rogue release of their own.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'history', group: 'Investigate', label: 'Review the pipeline\'s configuration history and recent changes', hint: 'Has anyone changed how releases are built?', tag: 'key',
        run: () => ({
          reveal: { history: 'Eleven days ago a new build step was added to the pipeline by the account "ci-bot" from an unfamiliar address. It runs after the tests, adds a small extra file to every build and was committed without review.' },
          text: 'The pipeline was changed 11 days ago by an account that does not normally edit it, with no review.',
        }),
      },
      {
        id: 'artifacts', group: 'Investigate', label: 'Rebuild recent releases from clean source and compare them with what was shipped', hint: 'Which releases are affected?', tag: 'key',
        when: (s) => !!s.facts.history,
        run: () => ({
          reveal: { artifacts: 'Releases 4.8.1, 4.8.2 and 4.8.3 contain an extra file and make an outbound call to 203.0.113.58 on start-up. 4.8.0 and earlier match a clean rebuild exactly.' },
          text: 'Three releases carry the backdoor. The last clean release is 4.8.0.',
        }),
      },
      {
        id: 'secrets', group: 'Investigate', label: 'List the secrets the pipeline can read', hint: 'What could the attacker have taken?', tag: 'useful',
        run: () => ({
          reveal: { secrets: 'The pipeline can read a cloud deployment key, the container registry token and the key that signs releases.' },
          text: 'The pipeline holds powerful secrets, including the key that signs your releases.',
        }),
      },
      {
        id: 'rescan', group: 'Investigate', label: 'Run a vulnerability scan on the pipeline servers', hint: 'Look for a flaw?', tag: 'weak',
        run: () => ({ text: 'The scan finds only routine issues. The pipeline was changed using a valid token, not by exploiting a flaw.' }),
      },
      // ── Contain
      {
        id: 'freeze', group: 'Contain', label: 'Freeze all deployments and stop scheduled releases', hint: 'Stop shipping.', tag: 'key',
        when: (s) => !s.flags.frozen,
        run: () => ({ set: { frozen: true }, disruption: 5, text: 'No new release can go out, including this afternoon\'s. The backdoor stops reaching new customers.' }),
      },
      {
        id: 'revoke', group: 'Contain', label: 'Revoke the deployment token and every active pipeline session', hint: 'Cut the attacker off.', tag: 'key',
        when: (s) => !!s.facts.history && s.flags.tokenActive,
        run: () => ({ set: { tokenActive: false }, disruption: 4, text: 'The token and all sessions are revoked. The attacker can no longer push to the pipeline.' }),
      },
      {
        id: 'remove-step', group: 'Contain', label: 'Remove the added build step and restore the pipeline configuration from the last reviewed version', hint: 'Remove the change.', tag: 'key',
        when: (s) => !!s.facts.history && s.flags.stepPresent,
        run: () => ({ set: { stepPresent: false }, disruption: 3, text: 'The malicious step is removed and the configuration is restored from a version that had been reviewed.' }),
      },
      {
        id: 'rollback', group: 'Contain', label: 'Withdraw releases 4.8.1 to 4.8.3 and return customers to the clean 4.8.0', hint: 'Get clean software out.', tag: 'key',
        when: (s) => !!s.facts.artifacts && s.flags.prodTainted,
        run: () => ({ set: { prodTainted: false }, disruption: 10, text: 'The three affected releases are withdrawn, and customers are told how to return to the clean 4.8.0. It costs some features, but the backdoor is no longer being distributed.' }),
      },
      {
        id: 'rotate', group: 'Contain', label: 'Rotate every secret the pipeline held, including the release signing key', hint: 'Assume it was all taken.', tag: 'key',
        when: (s) => !!s.facts.secrets && !s.flags.secretsRotated,
        run: () => ({ set: { secretsRotated: true }, disruption: 6, text: 'The cloud key, registry token and signing key are replaced. Anything the attacker copied no longer works, and customers are given the new signing key.' }),
      },
      {
        id: 'wipe', group: 'Contain', label: 'Wipe and rebuild the entire build system from scratch', hint: 'Start again?', tag: 'overreact',
        run: () => ({ set: { ciWiped: true }, disruption: 40, text: 'The build system is gone for days. Nothing can be released, and the backdoored releases are still in customers\' hands because nobody withdrew them.' }),
      },
      // ── Communicate
      {
        id: 'notify', group: 'Communicate', label: 'Tell affected customers which releases to remove, and tell the data protection officer', hint: 'Customers need to act.', tag: 'useful',
        when: (s) => !!s.facts.artifacts,
        run: () => ({ set: { customersTold: true }, text: 'Customers are told exactly which versions are affected, what to do, and how to check for the outbound connection. The DPO starts an assessment.' }),
      },
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the engineering director and the head of support', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The engineering director and the head of support are briefed, and support prepares to take calls.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.tokenActive && !s.flags.stepPresent && !s.flags.prodTainted,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.tokenActive && !s.flags.stepPresent && !s.flags.prodTainted,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.tokenActive ? { label: 'The stolen deployment token was left working', points: -14 } : { label: 'The stolen token and sessions were revoked', points: 10 });
      out.push(s.flags.stepPresent ? { label: 'The malicious build step was left in the pipeline', points: -14 } : { label: 'The malicious build step was removed', points: 10 });
      out.push(s.flags.prodTainted ? { label: 'Backdoored releases were left in customers\' hands', points: -14 } : { label: 'Backdoored releases were withdrawn', points: 10 });
      out.push(s.flags.secretsRotated ? { label: 'Every secret the pipeline held was rotated', points: 10 } : { label: 'Secrets the pipeline held were left working', points: -10 });
      if (s.flags.frozen) out.push({ label: 'Deployments frozen while the cause was found', points: 4 });
      if (s.flags.customersTold) out.push({ label: 'Affected customers and the DPO told', points: 6 });
      if (s.flags.mgrTold) out.push({ label: 'Engineering director and support briefed', points: 4 });
      if (s.flags.ciWiped) out.push({ label: 'Wiped the whole build system', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept control of the pipeline, or the backdoor kept spreading.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: affected releases left out, secrets not replaced, or too much disruption.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'You stopped the spread, cut the attacker off, removed the change, withdrew the bad releases and replaced everything the pipeline held.' },
    ],
    debrief: [
      {
        id: 'ic-ci-why',
        question: 'Why is a compromised build pipeline more serious than a single compromised server?',
        options: [
          { text: 'Everything it builds is trusted by customers, so an attacker can ship their code to all of them, signed as yours', correct: true, explain: 'A pipeline turns trust into reach. Customers install what you release, so tampering with the build compromises everyone who receives it.' },
          { text: 'Because build servers are more powerful', correct: false, explain: 'Power is not the point. Trust and distribution are.' },
          { text: 'Because pipelines are always open to the internet', correct: false, explain: 'Many are not. The risk comes from what they can do.' },
          { text: 'Because developers do not understand them', correct: false, explain: 'The risk is structural, not about understanding.' },
        ],
      },
      {
        id: 'ic-ci-secrets',
        question: 'The pipeline held a release signing key. Why did it have to be replaced even without proof it was stolen?',
        options: [
          { text: 'Because anything the pipeline could read must be treated as taken, and a stolen signing key lets an attacker sign malicious releases as you', correct: true, explain: 'You cannot prove a negative. The cost of replacing the key is small compared with the cost of a signed rogue release.' },
          { text: 'Because keys should be replaced every Wednesday', correct: false, explain: 'There is no such rule. The reason is exposure.' },
          { text: 'It did not need replacing if the token was revoked', correct: false, explain: 'The attacker had time to read other secrets during the 11 days.' },
          { text: 'Because customers asked for it', correct: false, explain: 'The reason is risk, not a request.' },
        ],
      },
    ],
  },
];
