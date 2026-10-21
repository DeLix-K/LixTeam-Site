// OT/IoT Security Incident Commander incidents (see incidents.js for the format). Everything here is fictional.
// The incident is about judgement in a plant: safety first, restore the safe state with the operators, then
// close the route and keep the evidence. It contains no technique.

export const OT = [
  {
    id: 'night-command',
    title: 'The command at two in the morning',
    skill: 'hardening',
    blurb: 'At 02:20 the plant monitor flags a command to the chlorine dosing controller from an engineering workstation that nobody is using. The dose is creeping up. Make the water safe first, then close the route, without shutting the plant down.',
    role: 'Security lead on call, Contoso Water',
    startClock: '02:20',
    minutesPerUnit: 5,
    maxTime: 12,
    brief: [
      'Thursday, 02:20. The plant\'s passive monitor raises a high alert: "A write command was sent to the chlorine dosing controller from the engineering workstation at 02:11. Nobody is logged on at the workstation. The dosing setpoint has changed."',
      'You are the security lead on call. The control room has one operator on shift. Water is leaving the plant for 200,000 people. Every action takes time, and the setpoint is still wrong. Shutting down the whole plant would cut supply and is not yours to decide alone.',
    ],
    initial: {
      flags: {
        dosingWrong: true,
        sessionActive: true,
        verified: false,
        sourceKnown: false,
        logsSaved: false,
        accountOff: false,
        opsTold: false,
        qualityChecked: false,
        shutdown: false,
        rebooted: false,
        scanned: false,
        waited: false,
      },
    },
    passive: (s) => (s.flags.dosingWrong ? 4 : 0) + (s.flags.sessionActive ? 2 : 0),
    events: [
      {
        id: 'second-change', at: 5, expires: true,
        when: (s) => s.flags.sessionActive,
        run: () => ({ threat: 18, severity: 'high', text: 'The session on the engineering workstation changes a second setting: the filter backwash timing. The control room sees a new alarm.' }),
      },
      {
        id: 'analyser-alarm', at: 7, expires: true,
        when: (s) => s.flags.dosingWrong,
        run: () => ({ threat: 20, severity: 'high', text: 'The chlorine analyser reaches its high alarm limit. The control room is paged and the operator is asking what to do.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'verify', group: 'Investigate', label: 'Ask the operator to check the dosing reading, the analyser and the alarm log, and tell you what the setpoint is now', hint: 'Know the real state.', tag: 'key',
        run: () => ({
          set: { verified: true },
          reveal: { verify: 'The dosing setpoint was raised from 1.2 to 2.8 mg/l at 02:11. The analyser reading is rising slowly and is not yet at the alarm limit. The operator can put the dosing into manual and set it back from the SCADA screen.' },
          text: 'The operator confirms the changed setpoint and a slowly rising reading, and says that manual control is available.',
        }),
      },
      {
        id: 'source', group: 'Investigate', label: 'Find where the command came from, using the plant network monitor', hint: 'Which route was used?', tag: 'key',
        when: (s) => !!s.facts.verify,
        run: () => ({
          set: { sourceKnown: true },
          reveal: { source: 'The command came from a remote desktop session on the engineering workstation, started at 02:04 through the vendor\'s support account from an address outside the country. Nobody on the plant staff started it.' },
          text: 'A remote session through the vendor\'s support account, from outside the country, is still open on the engineering workstation.',
        }),
      },
      {
        id: 'logs', group: 'Investigate', label: 'Save copies of the monitor, historian and workstation logs without touching the devices', hint: 'Keep the evidence.', tag: 'useful',
        when: (s) => !!s.facts.verify && !s.flags.logsSaved,
        run: () => ({
          set: { logsSaved: true },
          reveal: { logs: 'The saved logs show the sign-in, the two changed settings and the exact times. Nothing else on the plant network has been written to.' },
          text: 'The logs are copied. They show two changes, both from the one session, and nothing else.',
        }),
      },
      {
        id: 'scan', group: 'Investigate', label: 'Run a full scan of the plant network to find everything that may have been changed', hint: 'Find it all?', tag: 'bad',
        run: () => ({ set: { scanned: true }, threat: 10, disruption: 15, text: 'The scan makes the filter controller restart. The operator now has a filter fault to deal with as well as the dosing.' }),
      },
      // ── Contain
      {
        id: 'manual', group: 'Contain', label: 'Have the operator put dosing into manual and set it back to the safe value from the SCADA screen', hint: 'Make the water safe first.', tag: 'key',
        when: (s) => !!s.facts.verify && s.flags.dosingWrong,
        run: () => ({ set: { dosingWrong: false }, disruption: 1, text: 'The operator takes dosing to manual and sets it back to 1.2 mg/l. The reading turns and starts to fall. The operator stays at the screen.' }),
      },
      {
        id: 'isolate', group: 'Contain', label: 'Cut off the engineering workstation: turn off its remote access and block it from the controllers, leaving the controllers alone', hint: 'Close the door the session is using.', tag: 'key',
        when: (s) => !!s.facts.source && s.flags.sessionActive,
        run: () => ({ set: { sessionActive: false }, disruption: 3, text: 'The remote session ends and the workstation can no longer reach the controllers. Engineers cannot work from it tonight. The controllers are untouched.' }),
      },
      {
        id: 'revoke', group: 'Contain', label: 'Disable the vendor\'s support account and tell the vendor why', hint: 'Stop it coming back.', tag: 'useful',
        when: (s) => !!s.facts.source && !s.flags.accountOff,
        run: () => ({ set: { accountOff: true }, text: 'The account is disabled. The vendor says it did not start the session, and that the shared password was used by several of its engineers.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the whole treatment plant until it is understood', hint: 'Play safe?', tag: 'overreact',
        run: () => ({ set: { shutdown: true }, disruption: 60, text: 'Supply to 200,000 people falls within the hour, and the reservoirs begin to drop. The wrong setpoint could have been put right in minutes.' }),
      },
      {
        id: 'reboot', group: 'Contain', label: 'Restart the dosing controller to clear whatever was changed', hint: 'Reset it?', tag: 'bad',
        run: () => ({ set: { rebooted: true }, threat: 10, disruption: 10, text: 'The controller restarts and loads its last saved settings, which include the changed setpoint. Dosing is off for ten minutes while it restarts.' }),
      },
      {
        id: 'wait', group: 'Contain', label: 'Wait for the morning shift before doing anything', hint: 'Not worth waking people?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 10, text: 'You wait. The setpoint stays wrong and the session stays open.' }),
      },
      // ── Communicate
      {
        id: 'ops', group: 'Communicate', label: 'Call the duty engineer and the operations manager: what you saw, what the operator is doing and what you have closed', hint: 'The plant owners decide.', tag: 'useful',
        when: (s) => !!s.facts.verify && !s.flags.opsTold,
        run: () => ({ set: { opsTold: true }, text: 'The duty engineer comes in. The operations manager agrees with the manual dosing and asks to be told before anything else is changed.' }),
      },
      {
        id: 'quality', group: 'Communicate', label: 'Ask the water-quality team to sample the treated water leaving the plant and to decide whether the regulator must be told', hint: 'Was the water affected?', tag: 'useful',
        when: (s) => !!s.facts.verify && !s.flags.qualityChecked,
        run: () => ({ set: { qualityChecked: true }, reveal: { quality: 'The samples are within limits: the reading did not stay high for long. The water-quality team will tell the regulator as a precaution, with the times.' }, text: 'The samples are within limits, and the regulator will be told as a precaution.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when the dosing is safe and the route is closed.', tag: 'key', ends: true,
        when: (s) => !s.flags.dosingWrong && !s.flags.sessionActive,
        run: () => ({ text: 'You declare the immediate risk contained and ask the operations manager to chair the review.' }),
      },
    ],
    contained: (s) => !s.flags.dosingWrong && !s.flags.sessionActive,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.dosingWrong ? { label: 'Dosing was left at the wrong value', points: -25 } : { label: 'Dosing was put back to the safe value with the operator', points: 10 });
      out.push(s.flags.sessionActive ? { label: 'The remote session was left open', points: -25 } : { label: 'The remote session was cut off at the engineering workstation', points: 10 });
      out.push(s.flags.sourceKnown ? { label: 'You found which route was used', points: 6 } : { label: 'You did not find the route', points: -8 });
      out.push(s.flags.logsSaved ? { label: 'The logs were saved', points: 10 } : { label: 'The logs were not saved', points: -12 });
      out.push(s.flags.opsTold ? { label: 'The duty engineer and the operations manager were told', points: 10 } : { label: 'The plant owners were not told', points: -14 });
      out.push(s.flags.qualityChecked ? { label: 'Treated water was sampled and the regulator question handled', points: 10 } : { label: 'Nobody checked the water that left the plant', points: -12 });
      if (s.flags.accountOff) out.push({ label: 'The vendor account was disabled', points: 4 });
      if (s.flags.shutdown) out.push({ label: 'The whole plant was shut down', points: -35 });
      if (s.flags.rebooted) out.push({ label: 'The dosing controller was restarted', points: -20 });
      if (s.flags.scanned) out.push({ label: 'The plant network was scanned during the incident', points: -30 });
      if (s.flags.waited) out.push({ label: 'You waited while the setpoint was wrong', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The dose stayed wrong or the session stayed open, or an overreaction did more harm than the attacker.' },
      { min: 50, name: 'Costly', blurb: 'The plant was kept safe, with gaps: evidence, the plant owners, the water-quality check, or a disruptive step.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 150, name: 'Textbook', blurb: 'You confirmed the real state with the operator, made the water safe first, closed the route without touching the controllers, kept the evidence and told the people who run the plant.' },
    ],
    debrief: [
      {
        id: 'ic-ot-first',
        question: 'Why was putting the dosing back to the safe value the first priority, ahead of cutting off the session?',
        options: [
          { text: 'In a plant, safety comes first: the water was being dosed wrongly right now, and the operator could correct it in minutes without touching the attacker\'s route', correct: true, explain: 'Restore the safe state first, with the operators. Then close the route. The order is safety, then availability, then the investigation.' },
          { text: 'Because the session could not be cut off', correct: false, explain: 'It could, and was, once the source was known. The dose was the more urgent harm.' },
          { text: 'Because the operator is more senior than the security lead', correct: false, explain: 'It is not about seniority. The operator is the one who runs the plant and can make the water safe.' },
          { text: 'Because evidence does not matter', correct: false, explain: 'It does, and logs were saved. Evidence comes after safety, not before.' },
        ],
      },
      {
        id: 'ic-ot-shutdown',
        question: 'Why was shutting down the whole plant the wrong move?',
        options: [
          { text: 'It would cut supply to 200,000 people for a fault that could be put right in minutes, and stopping a plant suddenly can itself be unsafe', correct: true, explain: 'In a plant the response must be proportionate. The cure must not be worse than the harm, and the operators had a safe, quick fix.' },
          { text: 'Because plants cannot be shut down', correct: false, explain: 'They can. It was disproportionate here.' },
          { text: 'Because the attacker would be pleased', correct: false, explain: 'The reason is harm to customers, not what the attacker thinks.' },
          { text: 'Because it is cheaper to leave it running', correct: false, explain: 'Cost was not the point. Safety and supply were.' },
        ],
      },
    ],
  },
];
