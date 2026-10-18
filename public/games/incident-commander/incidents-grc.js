// Governance, Risk and Compliance Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. "Threat" is the harm to the company from a regulatory or legal failure.
// Legal references are general and are not legal advice.

export const GRC = [
  {
    id: 'regulator-enquiry',
    title: 'A letter from the regulator',
    skill: 'identity',
    blurb: 'The data protection regulator has written to Contoso about last year\'s incident and wants documents and answers in ten days. Preserve the records, answer truthfully and resist the urge to tidy up.',
    role: 'GRC analyst, Contoso',
    startClock: '09:00',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Tuesday, 09:00. A letter arrives from the data protection regulator. It refers to last year\'s incident and asks for the incident report, the policies in place at the time, the staff training records and a description of what has changed. The deadline is ten days away.',
      'You are the GRC analyst. Some of the policies were out of date at the time and the training records are incomplete. A manager suggests "updating the documents so they look right". Every action takes time, and a false or backdated document would be far worse than a gap.',
    ],
    initial: {
      flags: {
        docsAtRisk: true, // records could be changed or lost
        legalIn: false,
        held: false,
        gapsKnown: false,
        truthful: false,
        backdated: false,
        contact: false,
        boardTold: false,
        ownerTold: false,
        shutdown: false,
        delayed: false,
      },
    },
    passive: (s) => (s.flags.docsAtRisk ? 3 : 0) + (!s.flags.legalIn ? 2 : 0),
    events: [
      {
        id: 'tidy', at: 4, expires: true,
        when: (s) => s.flags.docsAtRisk && !s.flags.held,
        run: () => ({ set: { backdated: true }, threat: 20, severity: 'high', text: 'A well-meaning manager "tidies" the out-of-date policy and changes its date to last year. The change is recorded in the document system.' }),
      },
      {
        id: 'deadline', at: 8, expires: true,
        when: (s) => !s.flags.contact,
        run: () => ({ set: { delayed: true }, threat: 10, severity: 'medium', text: 'Nobody has contacted the regulator. A reminder arrives asking who your point of contact is.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'read', group: 'Investigate', label: 'Read the letter closely and list exactly what is being asked for and by when', hint: 'What do they want?', tag: 'key',
        run: () => ({
          reveal: { read: 'The regulator asks for four things: the incident report, the policies in force at the time and their approval dates, training completion records for staff involved, and a summary of changes since. It asks for documents "as they existed", not new versions.' },
          text: 'The regulator wants records as they existed, not revised ones.',
        }),
      },
      {
        id: 'gaps', group: 'Investigate', label: 'Compare what exists with what is being asked for, and list the gaps honestly', hint: 'What do we really have?', tag: 'key',
        when: (s) => !!s.facts.read,
        run: () => ({
          set: { gapsKnown: true },
          reveal: { gaps: 'The incident report exists and is dated. Two of the four policies were last reviewed three years before the incident. Training records are complete for 71% of the staff involved, and the rest are missing, not failed.' },
          text: 'There are real gaps: two stale policies and 29% of training records missing.',
        }),
      },
      {
        id: 'research', group: 'Investigate', label: 'Spend a day researching how other companies answered similar regulator letters', hint: 'See what others did?', tag: 'weak',
        run: () => ({ set: { delayed: true }, text: 'A day passes, and you learn little that bears on your own records.' }),
      },
      // ── Contain
      {
        id: 'legal', group: 'Contain', label: 'Bring in Legal and the data protection officer, and agree a single point of contact for the regulator', hint: 'One voice, with the right advice.', tag: 'key',
        when: (s) => !s.flags.legalIn,
        run: () => ({ set: { legalIn: true, contact: true }, text: 'Legal and the DPO take charge of the reply, and the regulator is told who to contact.' }),
      },
      {
        id: 'hold', group: 'Contain', label: 'Place a hold on the relevant documents, emails and training records, and freeze changes to the policies', hint: 'Keep it as it was.', tag: 'key',
        when: (s) => s.flags.legalIn && !s.flags.held,
        run: () => ({ set: { held: true, docsAtRisk: false }, disruption: 2, text: 'A legal hold is placed. The documents and their history cannot be edited or deleted, and a note goes to anyone who manages them.' }),
      },
      {
        id: 'backdate', group: 'Contain', label: 'Update the stale policies and date them to before the incident, so the pack looks complete', hint: 'Make it look right?', tag: 'bad',
        run: () => ({ set: { backdated: true }, threat: 25, text: 'The documents now look complete. The change history shows they were edited this week, and creating records that falsely look older is a serious problem in itself.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Stop all other compliance work in the company until the regulator\'s enquiry is closed', hint: 'Focus on one thing?', tag: 'overreact',
        run: () => ({ set: { shutdown: true }, disruption: 40, text: 'An audit due next week and two supplier reviews are put on hold, and the business starts to ask why.' }),
      },
      // ── Communicate
      {
        id: 'truth', group: 'Communicate', label: 'Draft the answer: send the documents as they were, state the gaps plainly, and describe what has changed since', hint: 'Honest and complete.', tag: 'key',
        when: (s) => !!s.facts.gaps && s.flags.held && !s.flags.truthful,
        run: () => ({ set: { truthful: true }, text: 'The draft sends the original records, says which policies were out of date and which training records are missing, and lists the real changes since the incident.' }),
      },
      {
        id: 'owner', group: 'Communicate', label: 'Tell the owners of each policy and the training lead what is being asked and what they must not change', hint: 'Make sure nobody tidies.', tag: 'useful',
        when: (s) => !!s.facts.read && !s.flags.ownerTold,
        run: () => ({ set: { ownerTold: true }, text: 'The policy owners and the training lead are told clearly: preserve everything, change nothing, and send you what they hold.' }),
      },
      {
        id: 'board', group: 'Communicate', label: 'Brief the chief executive and the audit committee chair that an enquiry has arrived, what it covers and what the gaps are', hint: 'No surprises for leadership.', tag: 'useful',
        when: (s) => !!s.facts.gaps && !s.flags.boardTold,
        run: () => ({ set: { boardTold: true }, text: 'The chief executive and the audit committee chair are told, and back the honest approach.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Send the response through Legal and confirm what has been sent', hint: 'Only when it is true and complete.', tag: 'key', ends: true,
        when: (s) => s.flags.truthful && s.flags.held && s.flags.legalIn,
        run: () => ({ text: 'The response goes to the regulator on time, through Legal, with the records as they were.' }),
      },
    ],
    contained: (s) => s.flags.truthful && s.flags.held && s.flags.legalIn,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.held ? { label: 'The documents were put on hold before anyone changed them', points: 12 } : { label: 'The documents were not protected', points: -14 });
      out.push(s.flags.legalIn ? { label: 'Legal and the DPO took charge, with one point of contact', points: 10 } : { label: 'Legal and the DPO were not involved', points: -14 });
      if (s.flags.gapsKnown) out.push({ label: 'You listed the real gaps honestly', points: 8 });
      else out.push({ label: 'You did not establish what records actually existed', points: -10 });
      if (s.flags.truthful) out.push({ label: 'The answer sent the original records and stated the gaps', points: 12 });
      else out.push({ label: 'No truthful answer was prepared', points: -12 });
      if (s.flags.ownerTold) out.push({ label: 'Document owners told not to change anything', points: 6 });
      else out.push({ label: 'Document owners were not told to change nothing', points: -6 });
      if (s.flags.boardTold) out.push({ label: 'Leadership briefed', points: 4 });
      else out.push({ label: 'Leadership were not told about the enquiry', points: -6 });
      if (s.flags.backdated) out.push({ label: 'A document was edited and backdated to look older', points: -90 });
      if (s.flags.delayed) out.push({ label: 'Time was lost before the regulator was contacted', points: -6 });
      if (s.flags.shutdown) out.push({ label: 'Halted all other compliance work', points: -30 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Integrity breach', blurb: 'Records were altered or backdated, or the regulator was not answered truthfully.' },
      { min: 50, name: 'Costly', blurb: 'The records were kept, with gaps: no hold, late contact, or Legal not in charge.' },
      { min: 80, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 146, name: 'Textbook', blurb: 'You froze the records, let Legal lead, listed the gaps honestly and sent the answer with the originals.' },
    ],
    debrief: [
      {
        id: 'ic-reg-tidy',
        question: 'Why is "updating the documents to look right" worse than sending them with their gaps?',
        options: [
          { text: 'Altering or backdating a record to mislead a regulator is itself a serious wrong and can be shown from the change history, while an honest gap can be explained and fixed', correct: true, explain: 'A gap is a weakness. A falsified record is deceit. Regulators treat them very differently.' },
          { text: 'Because the regulator will not read the documents', correct: false, explain: 'They will, and they will look at the history.' },
          { text: 'Because policies cannot be updated', correct: false, explain: 'They can, and should be, for the future, with today\'s date.' },
          { text: 'It is fine as long as the policy would have been correct', correct: false, explain: 'The date and content as they were at the time are the point.' },
        ],
      },
      {
        id: 'ic-reg-gaps',
        question: 'How should the gaps be presented to the regulator?',
        options: [
          { text: 'Stated plainly, with what has changed since and by when the rest will be fixed', correct: true, explain: 'Honesty with a credible plan is what regulators respond to. Concealment is what they punish.' },
          { text: 'Left out unless the regulator asks', correct: false, explain: 'The regulator asked for the records and a summary of changes. Omission would mislead.' },
          { text: 'Described as unimportant', correct: false, explain: 'It is not for you to minimise them. State the facts.' },
          { text: 'Blamed on the staff involved', correct: false, explain: 'It would be unfair and it does not answer what the regulator asked.' },
        ],
      },
    ],
  },
];
