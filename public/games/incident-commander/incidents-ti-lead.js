// Threat Intelligence senior-tier Incident Commander incidents (see incidents.js for the format). Everything here
// is fictional. The incident is about handling a private warning under an embargo: protect yourself, check whether you
// are already affected, and keep the rule you were given. It contains no technique.

export const TI_LEAD = [
  {
    id: 'embargoed-warning',
    title: 'The warning you are not allowed to repeat',
    skill: 'hardening',
    blurb: 'A vendor privately tells you a critical flaw in your remote access product is being used, and says nothing may be shared until the fix is published on Tuesday. Protect Contoso, find out whether you are already affected and keep to the embargo.',
    role: 'Senior intelligence analyst, Contoso',
    startClock: '15:00',
    minutesPerUnit: 30,
    maxTime: 12,
    brief: [
      'Thursday, 15:00. The security contact at your remote access vendor calls: "A critical flaw in the management page of our gateway is being used in the wild. A fix will be published on Tuesday at 09:00. Until then this is embargoed: please do not share it outside your own organisation. We are telling a small number of customers early so they can protect themselves."',
      'You are the senior intelligence analyst. Contoso runs the gateway for 900 remote staff, and its management page is reachable from the internet. Every action takes time, and the embargo is a rule you have agreed to keep.',
    ],
    initial: {
      flags: {
        exposed: true,
        suspect: false,
        mitigated: false,
        hunted: false,
        sessionsKilled: false,
        briefed: false,
        leaked: false,
        offline: false,
        waited: false,
      },
    },
    passive: (s) => (s.flags.exposed ? 3 : 0),
    events: [
      {
        id: 'probe', at: 4, expires: true,
        when: (s) => s.flags.exposed,
        run: () => ({ threat: 15, severity: 'medium', text: 'The gateway\'s logs show a burst of requests to the management page from an address that has never contacted it before.' }),
      },
      {
        id: 'in', at: 8, expires: true,
        when: (s) => s.flags.exposed && s.flags.suspect,
        run: () => ({ threat: 25, severity: 'high', text: 'The suspicious session is still open, and it creates a second administrator account on the gateway.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Understand
      {
        id: 'read', group: 'Understand', label: 'Read the vendor\'s advisory and confirm which versions are affected and whether Contoso\'s is one of them', hint: 'Are we exposed?', tag: 'key',
        run: () => ({
          reveal: { read: 'The advisory says versions 9.2 to 9.6 are affected, and the interim protection is to limit the management page to internal addresses. Contoso runs 9.5, and its management page is open to the internet.' },
          text: 'Contoso is affected, and the vendor\'s interim protection is simple and does not need the fix.',
        }),
      },
      // ── Protect
      {
        id: 'mitigate', group: 'Protect', label: 'Limit the gateway\'s management page to internal addresses, as the vendor advises', hint: 'The vendor\'s interim fix.', tag: 'key',
        when: (s) => !!s.facts.read && !s.flags.mitigated,
        run: () => ({ set: { mitigated: true, exposed: false }, disruption: 1, text: 'The management page is no longer reachable from the internet. Remote staff are unaffected, since they use a different service.' }),
      },
      {
        id: 'hunt', group: 'Protect', label: 'Search the gateway\'s logs for the signs of exploitation the vendor described, for the past two weeks', hint: 'Are we already hit?', tag: 'key',
        when: (s) => !!s.facts.read,
        run: () => ({
          set: { hunted: true, suspect: true },
          reveal: { hunt: 'One session on Tuesday night used the management page from an unfamiliar address and stayed open. It looks like the pattern in the advisory. Nothing else matches.' },
          text: 'One suspicious management session on Tuesday night, still open.',
        }),
      },
      {
        id: 'kill', group: 'Protect', label: 'End the suspicious session, remove any account or setting it created, and reset the gateway\'s administrator credentials', hint: 'Evict it.', tag: 'key',
        when: (s) => !!s.facts.hunt && !s.flags.sessionsKilled,
        run: () => ({ set: { sessionsKilled: true, suspect: false }, disruption: 2, text: 'The session is ended, the one setting it changed is reverted and the administrator credentials are reset. The gateway keeps serving remote staff.' }),
      },
      // ── Tell
      {
        id: 'brief', group: 'Tell', label: 'Brief the head of IT and the head of security inside Contoso, with the embargo clearly marked, and agree who will patch on Tuesday', hint: 'Within the rule.', tag: 'useful',
        when: (s) => !!s.facts.read && !s.flags.briefed,
        run: () => ({ set: { briefed: true }, text: 'Both agree to keep it inside the company, and the head of IT books the Tuesday patch for 09:30.' }),
      },
      {
        id: 'tellsector', group: 'Tell', label: 'Warn the sector sharing group straight away so other members can protect themselves', hint: 'Help others now?', tag: 'bad',
        run: () => ({ set: { leaked: true }, threat: 15, text: 'The group passes it on the same evening. The vendor learns of it, ends the early-warning arrangement and publishes the details before the fix is ready.' }),
      },
      // ── Poor choices
      {
        id: 'offline', group: 'Protect', label: 'Switch the whole gateway off until the fix is published', hint: 'Safest?', tag: 'overreact',
        run: () => ({ set: { offline: true, exposed: false }, disruption: 55, text: '900 staff lose remote access for four days, when the vendor\'s interim protection was enough.' }),
      },
      {
        id: 'wait', group: 'Protect', label: 'Do nothing until the fix is published on Tuesday', hint: 'Keep to the embargo?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 15, text: 'You wait. The embargo bound you not to share it, not to leave Contoso exposed.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained until the fix is applied', hint: 'Only when protected and checked.', tag: 'key', ends: true,
        when: (s) => !s.flags.exposed && s.flags.hunted && !s.flags.suspect,
        run: () => ({ text: 'You declare the immediate risk contained, and leave the full fix for Tuesday.' }),
      },
    ],
    contained: (s) => !s.flags.exposed && s.flags.hunted && !s.flags.suspect,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.mitigated ? { label: 'The vendor\'s interim protection was applied', points: 12 } : { label: 'The gateway stayed exposed', points: -20 });
      out.push(s.flags.hunted ? { label: 'You checked whether Contoso was already affected', points: 10 } : { label: 'You did not check for an existing compromise', points: -14 });
      if (s.flags.hunted) out.push(s.flags.sessionsKilled ? { label: 'The intruder was removed', points: 12 } : { label: 'A suspicious session was left open', points: -25 });
      out.push(s.flags.briefed ? { label: 'The right people inside Contoso were told, under the embargo', points: 8 } : { label: 'The head of IT and the head of security were not told', points: -10 });
      if (s.flags.leaked) out.push({ label: 'The embargo was broken by telling the sector group', points: -40 });
      if (s.flags.offline) out.push({ label: 'The whole gateway was switched off', points: -30 });
      if (s.flags.waited) out.push({ label: 'You left the gateway exposed while waiting for the fix', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The gateway stayed exposed, an intruder was left inside, or the embargo was broken.' },
      { min: 50, name: 'Costly', blurb: 'Contoso was protected, with gaps: the check for an existing compromise, telling your own leaders, or a disruptive step.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 145, name: 'Textbook', blurb: 'You confirmed you were affected, applied the vendor\'s interim protection, looked for an existing compromise, removed it, told your own leaders under the embargo and told nobody outside.' },
    ],
    debrief: [
      {
        id: 'ic-ti-embargo',
        question: 'Why was it wrong to tell the sector sharing group straight away, even though other members were also at risk?',
        options: [
          { text: 'You agreed to the embargo to get the early warning; breaking it ends the arrangement, and publishing the details early can help the attackers before a fix exists', correct: true, explain: 'An embargo is a promise, and it protects more people than it endangers. You can keep it and still protect yourself.' },
          { text: 'Because sector groups are not trustworthy', correct: false, explain: 'It is not about the group. It is about the promise you made.' },
          { text: 'Because the flaw is not serious', correct: false, explain: 'It is serious, and that is why the embargo matters.' },
          { text: 'Because you cannot protect yourself without telling others', correct: false, explain: 'You can: the vendor\'s interim protection was enough.' },
        ],
      },
      {
        id: 'ic-ti-hunt',
        question: 'Why check the logs for an existing compromise after applying the interim protection?',
        options: [
          { text: 'The flaw was already being used before the warning, and closing the door does not remove someone who is already inside', correct: true, explain: 'A protective step stops new problems. Hunting finds the old one.' },
          { text: 'Because the protection might not have worked', correct: false, explain: 'The protection was fine. The question is whether someone was already in.' },
          { text: 'Because the vendor asked you to', correct: false, explain: 'It is good practice whether or not the vendor asks.' },
          { text: 'Because it is cheaper than patching', correct: false, explain: 'Cost was not the reason.' },
        ],
      },
    ],
  },
];
