// Incident Response and Forensics lead-tier Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. The incident is about leading a small team through two incidents at once: deciding
// the order, delegating and not doing everything alone. It contains no technique.

export const DFIR_ARCH = [
  {
    id: 'two-incidents',
    title: 'Two incidents, one team',
    skill: 'hardening',
    blurb: 'On Saturday night a compromised mailbox starts sending phishing emails and the chief financial officer reports a phone lost in a taxi. You lead a team of three. Decide the order, delegate and keep both under control without doing it all yourself.',
    role: 'Incident response lead on call, Contoso',
    startClock: '01:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Saturday, 01:30. The monitoring system raises an alert: a marketing mailbox is sending the same email to hundreds of staff. Ten minutes later the chief financial officer phones: she has left her company phone in a taxi. It is signed in to her email, with access to the finance mailbox.',
      'You are the incident response lead on call. You have three analysts, who are awake and available. Two incidents are running, and each gets worse while you are busy with the other. Every action takes time.',
    ],
    initial: {
      flags: {
        aActive: true,
        bActive: true,
        triaged: false,
        delegated: false,
        aScoped: false,
        bScoped: false,
        purged: false,
        briefed: false,
        solo: false,
        everyone: false,
        ignoredB: false,
      },
    },
    passive: (s) => (s.flags.aActive ? 3 : 0) + (s.flags.bActive ? 2 : 0),
    events: [
      {
        id: 'phish-spreads', at: 5, expires: true,
        when: (s) => s.flags.aActive,
        run: () => ({ threat: 20, severity: 'high', text: 'Two finance staff click the link in the phishing email. A second mailbox starts sending it.' }),
      },
      {
        id: 'phone-used', at: 7, expires: true,
        when: (s) => s.flags.bActive,
        run: () => ({ threat: 20, severity: 'high', text: 'The lost phone\'s email session is used to open the finance mailbox from a different part of the city.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Organise
      {
        id: 'triage', group: 'Organise', label: 'List both incidents, rank them by harm and speed (the phishing is spreading; the phone is a locked device with a live session) and say what you will do first', hint: 'Decide the order.', tag: 'key',
        run: () => ({ set: { triaged: true }, reveal: { triage: 'The phishing email is spreading on its own and needs the mailbox closed and the email pulled. The phone is a bounded risk: a live session that can be revoked remotely in minutes, but whoever has it can use it now. Neither is more than an hour of work if each has an owner.' }, text: 'Both are rated serious. The phishing is spreading faster, and the phone can be closed quickly by a second person.' }),
      },
      {
        id: 'delegate', group: 'Organise', label: 'Give the lost phone to one analyst with a short checklist (lock it, revoke its sessions, check what it can reach), and keep the phishing yourself', hint: 'You cannot do both at once.', tag: 'key',
        when: (s) => !!s.facts.triage && !s.flags.delegated,
        run: () => ({ set: { delegated: true }, text: 'Priya takes the phone with a four-line checklist and agrees to report back in thirty minutes. A second analyst, Tom, is put on the mail purge.' }),
      },
      // ── Incident A: the phishing
      {
        id: 'close-a', group: 'Phishing', label: 'Disable the compromised marketing mailbox, end its sessions and remove any forwarding rule it created', hint: 'Stop the source.', tag: 'key',
        when: (s) => !!s.facts.triage && s.flags.aActive,
        run: () => ({ set: { aActive: false, aScoped: true }, disruption: 1, text: 'The mailbox is disabled and a hidden forwarding rule is removed. No more emails are sent from it.' }),
      },
      {
        id: 'purge', group: 'Phishing', label: 'Pull the phishing email from every mailbox and warn the two finance staff who clicked', hint: 'Clean up the spread.', tag: 'key',
        when: (s) => !!s.flags.aScoped && !s.flags.purged,
        run: () => ({ set: { purged: true }, text: 'The email is removed from 480 mailboxes. The two staff reset their passwords and nothing else is found on their accounts.' }),
      },
      // ── Incident B: the phone
      {
        id: 'lock-b', group: 'Phone', label: 'Lock the lost phone remotely, revoke its email sessions and tokens and reset the chief financial officer\'s password', hint: 'Cut the live session.', tag: 'key',
        when: (s) => !!s.facts.triage && s.flags.bActive,
        run: () => ({ set: { bActive: false, bScoped: true }, disruption: 1, text: 'The phone is locked, its sessions are revoked and the password is reset. The chief financial officer is signed out everywhere and signs back in on her laptop.' }),
      },
      {
        id: 'check-b', group: 'Phone', label: 'Check what the phone\'s session opened since it was lost, and whether anything was sent or downloaded', hint: 'Did anyone use it?', tag: 'useful',
        when: (s) => !!s.flags.bScoped,
        run: () => ({ reveal: { checkb: 'The session opened one mailbox view at 01:48, from an address in the city, and nothing was sent or downloaded. Revoked at 01:55.' }, text: 'One brief view of the mailbox, and nothing taken.' }),
      },
      // ── Communicate
      {
        id: 'brief', group: 'Communicate', label: 'Brief the chief executive and the chief financial officer: two incidents, what was done, and what is still open', hint: 'No surprises on Monday.', tag: 'useful',
        when: (s) => !!s.facts.triage && !s.flags.briefed,
        run: () => ({ set: { briefed: true }, text: 'The chief executive is told at 03:00 and has nothing to add. The chief financial officer thanks you for the quick lock.' }),
      },
      // ── Poor choices
      {
        id: 'solo', group: 'Organise', label: 'Handle the phishing yourself first and the phone afterwards, since you are the lead', hint: 'Do it properly yourself?', tag: 'bad',
        run: () => ({ set: { solo: true }, threat: 8, text: 'You work through the phishing alone. The phone session stays live for the hour it takes.' }),
      },
      {
        id: 'everyone', group: 'Organise', label: 'Call the whole security team, the chief executive and the board chair in tonight', hint: 'All hands?', tag: 'overreact',
        run: () => ({ set: { everyone: true }, disruption: 30, text: 'Eleven people join a call at 02:00. Nobody owns anything, and the next hour is spent on updates.' }),
      },
      {
        id: 'ignoreb', group: 'Phone', label: 'Leave the phone until the morning, since it is locked with a passcode', hint: 'It is probably fine?', tag: 'bad',
        run: () => ({ set: { ignoredB: true }, threat: 10, text: 'You decide a lock screen is enough. Its email session was already open.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare both incidents contained and hand over to the day team with notes', hint: 'Only when both are closed.', tag: 'key', ends: true,
        when: (s) => !s.flags.aActive && !s.flags.bActive,
        run: () => ({ text: 'You declare both incidents contained and leave a short note for the day team.' }),
      },
    ],
    contained: (s) => !s.flags.aActive && !s.flags.bActive,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.triaged ? { label: 'You ranked the two incidents and said what came first', points: 8 } : { label: 'You did not rank the incidents', points: -10 });
      out.push(s.flags.delegated ? { label: 'You delegated the phone and the mail purge', points: 14 } : { label: 'You did not delegate', points: -16 });
      out.push(s.flags.aScoped ? { label: 'The compromised mailbox was closed', points: 10 } : { label: 'The compromised mailbox was left open', points: -22 });
      out.push(s.flags.bScoped ? { label: 'The lost phone\'s session was revoked', points: 10 } : { label: 'The lost phone\'s session was left live', points: -22 });
      if (s.flags.purged) out.push({ label: 'The phishing email was pulled from every mailbox', points: 8 });
      if (s.facts.checkb) out.push({ label: 'You checked whether the phone was used', points: 6 });
      out.push(s.flags.briefed ? { label: 'The chief executive and the chief financial officer were told', points: 8 } : { label: 'Leaders were not briefed', points: -8 });
      if (s.flags.solo) out.push({ label: 'You tried to do both alone, one after the other', points: -18 });
      if (s.flags.everyone) out.push({ label: 'The whole team and the board chair were called in', points: -25 });
      if (s.flags.ignoredB) out.push({ label: 'The phone was left because it had a lock screen', points: -18 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'One or both incidents got away from you, or the response did more harm than the problems.' },
      { min: 50, name: 'Costly', blurb: 'Both incidents were dealt with, with gaps: ranking them, delegating, briefing leaders or a poor choice.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 160, name: 'Textbook', blurb: 'You ranked the two incidents, delegated one with a clear checklist, closed both sources, checked whether the phone had been used and told the right people.' },
    ],
    debrief: [
      {
        id: 'ic-dr-delegate',
        question: 'Why was giving the phone to an analyst with a short checklist better than handling both incidents yourself?',
        options: [
          { text: 'Both incidents were getting worse in parallel, so one person doing them in turn left each open for far longer; a lead\'s job is to put the right work in the right hands and keep the overview', correct: true, explain: 'The phone was a bounded task that a good analyst could finish. Doing it yourself first would have left the other incident spreading.' },
          { text: 'Because the lead should never do technical work', correct: false, explain: 'A lead can, and here did. The point was to avoid a bottleneck.' },
          { text: 'Because the analyst was more senior', correct: false, explain: 'The reason was parallel work, not seniority.' },
          { text: 'Because the phone was less important', correct: false, explain: 'Both mattered. The phone was quicker to close with a second person.' },
        ],
      },
      {
        id: 'ic-dr-everyone',
        question: 'Why was calling in the whole team and the board chair at 02:00 a poor choice?',
        options: [
          { text: 'It created a large call with no owners while both incidents continued, and it used up goodwill on something three people could handle; leaders should be told, not recruited', correct: true, explain: 'More people is not more control. Owners and a short, clear brief are.' },
          { text: 'Because nobody should ever be called at night', correct: false, explain: 'Calling people is sometimes right. This was out of proportion.' },
          { text: 'Because the board chair has no role in incidents', correct: false, explain: 'The chair is told when appropriate, not asked to help with the work.' },
          { text: 'Because phone calls are not secure', correct: false, explain: 'That was not the issue.' },
        ],
      },
    ],
  },
];
