// OT/IoT Security lead-tier Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. The incident is about a vendor session that is changing a controller while the plant is running: how to
// check it, how to end it safely and why cutting it abruptly can be worse than letting it finish. It contains no technique.

export const OT_ARCH = [
  {
    id: 'vendor-mid-change',
    title: 'The vendor is connected right now',
    skill: 'hardening',
    blurb: 'A vendor engineer is connected to a filter controller to update it, and the monitor shows commands the vendor never agreed to send. Check it with the vendor and the operator, and end the session safely without leaving the controller half changed.',
    role: 'OT security lead on call, Contoso Water',
    startClock: '13:20',
    minutesPerUnit: 5,
    maxTime: 12,
    brief: [
      'Wednesday, 13:20. A vendor engineer has been connected through the jump host to the filter controller since 13:00, to apply a firmware update agreed with operations for this afternoon. The plant monitor now shows write commands to registers that are not part of the update, and the update itself is only 60% through.',
      'You are the OT security lead on call. The operator at the filter plant says the readings have started to drift. If the update is interrupted halfway, the controller may be left unusable and the filters would have to be run by hand. Every action takes time.',
    ],
    initial: {
      flags: {
        sessionOpen: true,
        verified: false,
        operatorReady: false,
        recorded: false,
        stopped: false,
        reverted: false,
        briefed: false,
        cut: false,
        shutdown: false,
        ignored: false,
      },
    },
    passive: (s) => (s.flags.sessionOpen ? 3 : 0),
    events: [
      {
        id: 'more-writes', at: 4, expires: true,
        when: (s) => s.flags.sessionOpen && !s.flags.stopped && !s.flags.cut,
        run: () => ({ threat: 20, severity: 'high', text: 'The session writes to two more registers that control backwash timing. The operator reports the filter pressure climbing.' }),
      },
      {
        id: 'alarm', at: 7, expires: true,
        when: (s) => s.flags.sessionOpen && !s.flags.stopped && !s.flags.cut,
        run: () => ({ threat: 20, severity: 'high', text: 'A filter pressure alarm sounds. The operator is still waiting for instructions.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Verify
      {
        id: 'operator', group: 'Prepare', label: 'Tell the filter plant operator what you see, and ask them to be ready to take the filters to manual and watch the pressure', hint: 'The plant owner first.', tag: 'key',
        when: (s) => !s.flags.operatorReady,
        run: () => ({ set: { operatorReady: true }, reveal: { operator: 'The operator will take the filters to manual on your word, and can hold them steady for about an hour. Pressure is rising slowly and is not yet at the alarm limit.' }, text: 'The operator is ready to take manual control if needed, and watching the pressure.' }),
      },
      {
        id: 'call', group: 'Verify', label: 'Phone the vendor on the number you already hold, ask what the engineer is doing and whether the extra writes are theirs', hint: 'Check with the company, not through the session.', tag: 'key',
        run: () => ({
          set: { verified: true },
          reveal: { call: 'The vendor says the engineer is applying the update and says the extra register writes are not part of it. Its support team cannot see the engineer\'s screen. The engineer\'s manager says his phone is off because he is "in the plant\'s control room"; he is not: he is in another country.' },
          text: 'The vendor says the extra writes are not theirs, and the engineer\'s location does not fit the account.',
        }),
      },
      {
        id: 'record', group: 'Prepare', label: 'Record the session and save the monitor\'s logs and the jump host\'s record of the connection', hint: 'Keep the evidence.', tag: 'useful',
        when: (s) => !s.flags.recorded,
        run: () => ({ set: { recorded: true }, reveal: { record: 'The jump host holds the session record, and the monitor holds the register writes with times. Both are copied and hashed.' }, text: 'The session record and the logs are saved and hashed.' }),
      },
      // ── Contain
      {
        id: 'safestop', group: 'Contain', label: 'With the operator ready, end the session at a safe point: have the operator hold the filters in manual, revert the two changed registers to their last good values, and only then close the session and the vendor\'s account', hint: 'End it without breaking the controller.', tag: 'key',
        when: (s) => !!s.flags.operatorReady && !!s.facts.call && s.flags.sessionOpen,
        run: () => ({ set: { stopped: true, sessionOpen: false, reverted: true }, disruption: 3, text: 'The operator holds the filters in manual. The changed registers are reverted to the saved values, then the session and the vendor\'s account are closed. The update is left unfinished and the controller is intact.' }),
      },
      {
        id: 'cut', group: 'Contain', label: 'Cut the connection immediately at the jump host', hint: 'The fastest way to stop it?', tag: 'bad',
        when: (s) => s.flags.sessionOpen,
        run: () => ({ set: { cut: true, sessionOpen: false }, threat: 15, disruption: 25, text: 'The session ends in the middle of the firmware write. The controller reboots into an unusable state, and the operator has to run the filters by hand for the rest of the shift.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the whole filter plant until it is understood', hint: 'Safest?', tag: 'overreact',
        run: () => ({ set: { shutdown: true, sessionOpen: false }, disruption: 55, text: 'The filter plant goes offline and treated water output drops by half. The controller was recoverable with an hour of careful work.' }),
      },
      {
        id: 'ignore', group: 'Verify', label: 'Let the update run to the end, because the vendor is trusted', hint: 'Do not interrupt?', tag: 'bad',
        run: () => ({ set: { ignored: true }, threat: 15, text: 'You let it run. The extra writes continue.' }),
      },
      // ── Communicate
      {
        id: 'brief', group: 'Communicate', label: 'Brief the operations manager and the safety engineer, and agree that the controller will be checked against the saved configuration before the filters return to automatic', hint: 'The plant owners decide the restart.', tag: 'useful',
        when: (s) => !!s.flags.stopped && !s.flags.briefed,
        run: () => ({ set: { briefed: true }, text: 'Both agree. The safety engineer will compare every register with the saved configuration before the filters go back to automatic.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when the session is closed safely.', tag: 'key', ends: true,
        when: (s) => !!s.flags.stopped && !!s.flags.reverted,
        run: () => ({ text: 'You declare the immediate risk contained, with the controller to be checked before the filters return to automatic.' }),
      },
    ],
    contained: (s) => !!s.flags.stopped && !!s.flags.reverted,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.operatorReady ? { label: 'The operator was told and ready to take manual control', points: 12 } : { label: 'The operator was not told', points: -16 });
      out.push(s.flags.verified ? { label: 'You checked with the vendor by phone, outside the session', points: 12 } : { label: 'You did not check with the vendor', points: -16 });
      out.push(s.flags.stopped ? { label: 'The session was ended at a safe point and the changes reverted', points: 14 } : { label: 'The session was not ended safely', points: -25 });
      if (s.flags.recorded) out.push({ label: 'The session and the logs were saved', points: 8 });
      if (s.flags.briefed) out.push({ label: 'The operations manager and the safety engineer agreed the restart', points: 8 });
      if (s.flags.cut) out.push({ label: 'The connection was cut in the middle of the update', points: -25 });
      if (s.flags.shutdown) out.push({ label: 'The whole filter plant was shut down', points: -35 });
      if (s.flags.ignored) out.push({ label: 'You let the session run on', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The session was left running, the controller was broken by an abrupt cut, or an overreaction did more harm than the intruder.' },
      { min: 50, name: 'Costly', blurb: 'The session was ended, with gaps: the operator, the vendor check, the evidence or a disruptive step.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 156, name: 'Textbook', blurb: 'You told the operator, checked with the vendor outside the session, ended it at a safe point with the changes reverted, kept the evidence and agreed the restart with the plant owners.' },
    ],
    debrief: [
      {
        id: 'ic-ot-cut',
        question: 'Why was cutting the connection at once, the quickest way to stop it, a poor choice here?',
        options: [
          { text: 'The controller was in the middle of a firmware write, and interrupting it can leave the device unusable; in a plant, how you stop something can matter as much as whether you do', correct: true, explain: 'The cut stopped the session and broke the controller, and the operator had to run the filters by hand. A safe stop with the operator ready did both jobs.' },
          { text: 'Because the jump host cannot be cut', correct: false, explain: 'It can. The problem was the timing.' },
          { text: 'Because the vendor would be offended', correct: false, explain: 'The reason is the state of the controller.' },
          { text: 'Because cutting would delete the logs', correct: false, explain: 'The logs were not at risk.' },
        ],
      },
      {
        id: 'ic-ot-phone',
        question: 'Why call the vendor on a number Contoso already held instead of asking the engineer in the session?',
        options: [
          { text: 'If the session was an intruder using the engineer\'s account, anything typed into the session could be answered by the intruder; verification has to go through a route the intruder does not control', correct: true, explain: 'The vendor\'s own people could say the writes were not theirs and that the engineer was elsewhere.' },
          { text: 'Because the engineer would not reply in time', correct: false, explain: 'Speed was not the reason.' },
          { text: 'Because the vendor must always be called first', correct: false, explain: 'The operator was told first. The vendor check came next.' },
          { text: 'Because the session cannot send messages', correct: false, explain: 'It could, which was the risk.' },
        ],
      },
    ],
  },
];
