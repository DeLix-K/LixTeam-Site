// OT/IoT Security senior-tier Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. The incident is about ransomware in the office while the plant runs: protect the plant by controlled
// separation, with the operators, without shutting anything down. It contains no technique.

export const OT_LEAD = [
  {
    id: 'office-ransomware',
    title: 'Ransomware in the office, the plant still running',
    skill: 'hardening',
    blurb: 'On Saturday at 03:10 ransomware is spreading through Contoso Water\'s office network. The plant is running and is linked to the office by a few connections. Protect the plant by separating it in a controlled way, with the operators, without stopping it.',
    role: 'Senior OT security engineer on call, Contoso Water',
    startClock: '03:10',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Saturday, 03:10. IT reports that file servers in the office are being encrypted, and the spread is fast. The plant network is linked to the office by a historian feed, a reporting connection and a jump host used by vendors. The plant is running normally, with one operator on night shift.',
      'You are the senior OT security engineer on call. The plant must keep running. Every action takes time, and the office infection is still spreading. You must not decide alone to stop the plant.',
    ],
    initial: {
      flags: {
        linked: true,
        checked: false,
        opsTold: false,
        linkCut: false,
        vendorOff: false,
        backupsSafe: false,
        plantHit: false,
        shutdown: false,
        rebooted: false,
        waited: false,
      },
    },
    passive: (s) => (s.flags.linked ? 3 : 0),
    events: [
      {
        id: 'historian', at: 4, expires: true,
        when: (s) => s.flags.linked,
        run: () => ({ set: { plantHit: true }, threat: 25, severity: 'high', text: 'The infection reaches the plant historian through the reporting connection and begins encrypting its files. Trends and the regulator\'s daily report are affected.' }),
      },
      {
        id: 'scada', at: 8, expires: true,
        when: (s) => s.flags.linked,
        run: () => ({ threat: 25, severity: 'high', text: 'The infection is now probing the SCADA server from the historian. The operator reports slow screens.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Understand
      {
        id: 'check', group: 'Understand', label: 'Check the plant boundary logs and the operator\'s screens: is anything in the plant affected, and which links to the office are open?', hint: 'Know where you stand.', tag: 'key',
        run: () => ({
          set: { checked: true },
          reveal: { check: 'The plant is running normally. Three links to the office are open: the historian feed, the reporting connection and the vendor jump host. No sign of infection inside the plant yet. Control does not depend on any of them: SCADA, the controllers and the operator screens work on the plant network alone.' },
          text: 'The plant is unaffected so far, and none of the three links is needed to keep it running.',
        }),
      },
      // ── Tell
      {
        id: 'ops', group: 'Tell', label: 'Call the night operator and the duty engineer: what is happening, what you plan to cut and what they must watch for', hint: 'The plant owners first.', tag: 'key',
        when: (s) => !!s.facts.check && !s.flags.opsTold,
        run: () => ({ set: { opsTold: true }, text: 'The operator agrees to watch the screens and to run the plant in its normal local mode. The duty engineer is on the way in and agrees to the plan.' }),
      },
      // ── Separate
      {
        id: 'cut', group: 'Separate', label: 'Cut the plant\'s links to the office (historian feed, reporting connection and vendor jump host) at the plant firewall, in agreement with the operator', hint: 'A controlled separation.', tag: 'key',
        when: (s) => !!s.flags.opsTold && s.flags.linked,
        run: () => ({ set: { linkCut: true, linked: false }, disruption: 4, text: 'The three links are cut. Reports and trends stop updating, and the plant keeps running as before. The infection cannot reach any more of the plant.' }),
      },
      {
        id: 'vendor', group: 'Separate', label: 'Disable the vendors\' remote access and tell them why', hint: 'Close the other door.', tag: 'useful',
        when: (s) => !!s.facts.check && !s.flags.vendorOff,
        run: () => ({ set: { vendorOff: true }, text: 'Vendor access is switched off. The vendors acknowledge, and know to call the duty engineer in an emergency.' }),
      },
      {
        id: 'backups', group: 'Protect', label: 'Check that the plant\'s offline backups of controller programs and settings are intact and not connected to the network', hint: 'Be ready to restore.', tag: 'useful',
        when: (s) => !!s.facts.check && !s.flags.backupsSafe,
        run: () => ({ set: { backupsSafe: true }, reveal: { backups: 'The controller programs and settings are on a disconnected drive in the control room safe, dated last Monday. They are intact.' }, text: 'The offline backups are intact and unconnected.' }),
      },
      // ── Poor choices
      {
        id: 'shutdown', group: 'Separate', label: 'Shut down the whole plant until the office is clean', hint: 'Safest?', tag: 'overreact',
        run: () => ({ set: { shutdown: true, linked: false }, disruption: 65, text: 'Supply to 200,000 people begins to fall within the hour. The plant did not need to stop: nothing it needs depended on the office.' }),
      },
      {
        id: 'reboot', group: 'Protect', label: 'Restart the SCADA server as a precaution', hint: 'Clear anything?', tag: 'bad',
        run: () => ({ set: { rebooted: true }, threat: 5, disruption: 15, text: 'The SCADA server restarts, and operators lose their screens and automatic control for twenty minutes, with only one operator on shift.' }),
      },
      {
        id: 'wait', group: 'Separate', label: 'Wait to see whether the infection reaches the plant before doing anything', hint: 'Avoid a hasty change?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 10, text: 'You wait. The infection does not.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the plant isolated and safe', hint: 'Only when the links are cut and the operator knows.', tag: 'key', ends: true,
        when: (s) => !s.flags.linked && s.flags.opsTold && s.flags.checked,
        run: () => ({ text: 'You declare the plant separated from the office and running normally, and leave the office recovery to IT.' }),
      },
    ],
    contained: (s) => !s.flags.linked && s.flags.opsTold && s.flags.checked,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.checked ? { label: 'You checked the plant and its links before acting', points: 10 } : { label: 'You did not check the plant first', points: -12 });
      out.push(s.flags.opsTold ? { label: 'The operator and the duty engineer were told before the change', points: 12 } : { label: 'The plant owners were not told', points: -16 });
      out.push(s.flags.linkCut ? { label: 'The links to the office were cut in a controlled way', points: 14 } : { label: 'The links to the office were left open', points: -25 });
      if (s.flags.vendorOff) out.push({ label: 'Vendor remote access was switched off', points: 6 });
      if (s.facts.backups) out.push({ label: 'The offline backups were checked', points: 6 });
      if (s.flags.plantHit) out.push({ label: 'The infection reached the plant historian', points: -20 });
      if (s.flags.shutdown) out.push({ label: 'The whole plant was shut down', points: -35 });
      if (s.flags.rebooted) out.push({ label: 'The SCADA server was restarted as a precaution', points: -20 });
      if (s.flags.waited) out.push({ label: 'You waited while the infection could spread', points: -20 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The infection reached the control systems, or the plant was stopped for no reason.' },
      { min: 50, name: 'Costly', blurb: 'The plant stayed up, with gaps: the check, the operator, the backups or a disruptive step.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 145, name: 'Textbook', blurb: 'You checked the plant first, told the operator, cut the links in a controlled way and kept the plant running.' },
    ],
    debrief: [
      {
        id: 'ic-ot-keep',
        question: 'Why was it right to cut the three links and keep the plant running, instead of shutting everything down?',
        options: [
          { text: 'The plant did not depend on the office links, so cutting them removed the route for the infection while supply carried on; stopping the plant would have harmed 200,000 people for no gain', correct: true, explain: 'Separation protects the plant without stopping it. A plant designed to run on its own is what makes that choice possible.' },
          { text: 'Because shutting down is always forbidden', correct: false, explain: 'It is sometimes right. Here it was not needed.' },
          { text: 'Because the office could be fixed more quickly', correct: false, explain: 'That is not the reason.' },
          { text: 'Because the infection could not spread to the plant', correct: false, explain: 'It could have, through the links. That is why they were cut.' },
        ],
      },
      {
        id: 'ic-ot-ops',
        question: 'Why call the operator before cutting the links?',
        options: [
          { text: 'The operator runs the plant and needs to know what will stop updating and what to watch; changes to the plant boundary are made with the people who own the plant', correct: true, explain: 'A cut that surprises the operator can look like a failure and cause the wrong reaction.' },
          { text: 'Because the operator can approve the budget', correct: false, explain: 'That is not the reason.' },
          { text: 'Because the operator knows the passwords', correct: false, explain: 'The reason is ownership and awareness of the plant.' },
          { text: 'It was not necessary, since the links are in the office', correct: false, explain: 'The links are at the plant boundary, and the plant owners decide what changes there.' },
        ],
      },
    ],
  },
];
