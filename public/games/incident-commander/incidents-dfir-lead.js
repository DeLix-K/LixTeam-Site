// Incident Response and Forensics senior-tier Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. The incident is about doing things in the right order when the business wants
// the fastest answer and evidence is at risk. It contains no technique.

export const DFIR_LEAD = [
  {
    id: 'restore-pressure',
    title: 'The server the business wants back',
    skill: 'hardening',
    blurb: 'An accounts server is compromised on the Friday before month end. The finance director wants it restored by Monday and IT wants to wipe it tonight. Preserve what cannot be redone, restore in parallel and keep everyone told.',
    role: 'Incident lead, Contoso',
    startClock: '16:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Friday, 16:30. The accounts server has been found running an unknown program that is sending small amounts of data to an outside address. Month-end payroll runs on Monday morning from that server.',
      'You are the incident lead. IT is ready to wipe and rebuild the server at once. The finance director says payroll must run on Monday. Legal has not yet been told. Every action takes time, and the server is still online.',
    ],
    initial: {
      flags: {
        online: true,
        scoped: false,
        imaged: false,
        isolated: false,
        restored: false,
        legalTold: false,
        financeTold: false,
        evidenceLost: false,
        restoredEarly: false,
        poweroff: false,
      },
    },
    passive: (s) => (s.flags.online ? 4 : 0),
    events: [
      {
        id: 'it-wipe', at: 4, expires: true,
        when: (s) => !s.flags.imaged && !s.flags.evidenceLost,
        run: () => ({ set: { evidenceLost: true, online: false }, severity: 'high', text: 'IT, unable to wait, wipes and rebuilds the server. The disk and memory are gone, and so is any chance of knowing what the program took.' }),
      },
      {
        id: 'spread', at: 6, expires: true,
        when: (s) => s.flags.online,
        run: () => ({ threat: 20, severity: 'high', text: 'The program starts reaching other servers from the accounts server, and the outside address now receives much larger transfers.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'scope', group: 'Investigate', label: 'Find out what the server holds, what the program is doing now and which other machines it can reach', hint: 'Know what you are dealing with.', tag: 'key',
        run: () => ({
          set: { scoped: true },
          reveal: { scope: 'The server holds payroll data for 1,400 staff. The program runs only in memory and sends small packets to one outside address every minute. It can reach two other servers, and nothing shows it has used them yet. The last verified backup is from Thursday night.' },
          text: 'The program is memory-resident, small and so far limited to the accounts server. A Thursday backup exists.',
        }),
      },
      {
        id: 'logs', group: 'Investigate', label: 'Save the firewall, directory and server logs for the week, without changing anything', hint: 'Keep what the attacker cannot undo.', tag: 'useful',
        when: (s) => !!s.facts.scope,
        run: () => ({ reveal: { logs: 'The logs show the first outside contact on Wednesday at 22:12 and nothing else unusual. They are copied and hashed.' }, text: 'The logs are saved and hashed. The first contact was on Wednesday night.' }),
      },
      // ── Preserve
      {
        id: 'image', group: 'Preserve', label: 'Capture the server\'s memory, then take a verified image of its disk, with hashes and a record of who did it', hint: 'The one thing that cannot be redone.', tag: 'key',
        when: (s) => !!s.facts.scope && !s.flags.imaged && !s.flags.evidenceLost,
        run: () => ({ set: { imaged: true }, disruption: 2, text: 'Memory is captured, and the disk is imaged and hashed. The record shows who did it and when.' }),
        cost: 2,
      },
      {
        id: 'hold', group: 'Preserve', label: 'Ask IT to hold the wipe until the image is done, and tell them why', hint: 'Stop the well-meant mistake.', tag: 'useful',
        when: (s) => !s.flags.imaged && !s.flags.evidenceLost,
        run: () => ({ text: 'IT agrees to wait, grudgingly. The wipe is scheduled for after the image.' }),
      },
      // ── Contain
      {
        id: 'isolate', group: 'Contain', label: 'Cut the server off from the network, leaving it powered on', hint: 'Stop it reaching anything else.', tag: 'key',
        when: (s) => !!s.facts.scope && s.flags.online,
        run: () => ({ set: { isolated: true, online: false }, disruption: 2, text: 'The server is cut off. The program can no longer reach the outside address or the other servers, and memory is intact.' }),
      },
      {
        id: 'poweroff', group: 'Contain', label: 'Power the server off now to stop it', hint: 'Quickest stop?', tag: 'bad',
        run: () => ({ set: { poweroff: true, online: false }, threat: 5, text: 'The server powers off. The memory contents, including the program, are lost, and the disk is the only thing left.' }),
      },
      {
        id: 'rebuild', group: 'Contain', label: 'Wipe and rebuild the server now, before the weekend', hint: 'Be sure it is clean?', tag: 'bad',
        run: () => ({ set: { evidenceLost: true, online: false }, disruption: 10, text: 'The server is rebuilt in four hours. Nothing is left to examine, and nobody can say what the program took.' }),
      },
      // ── Recover
      {
        id: 'restore', group: 'Recover', label: 'Build a clean replacement from the standard image and the Thursday backup, and check it before payroll', hint: 'Give the business its server.', tag: 'key',
        when: (s) => !!s.flags.imaged && !!s.flags.isolated && !s.flags.restored,
        run: () => ({ set: { restored: true }, text: 'The replacement is built and checked from a known-good backup. Payroll will run on Monday.' }),
        cost: 2,
      },
      {
        id: 'restoreearly', group: 'Recover', label: 'Restore the replacement from backup straight away, while the old server is still online', hint: 'Save time?', tag: 'weak',
        when: (s) => !!s.facts.scope && s.flags.online && !s.flags.restored,
        run: () => ({ set: { restoredEarly: true }, threat: 10, text: 'The replacement is built while the compromised server is still on the network. The program reaches it before it is checked.' }),
      },
      // ── Communicate
      {
        id: 'legal', group: 'Communicate', label: 'Bring Legal in and agree how the investigation is documented and who must be told, including the payroll data', hint: 'Start the clock properly.', tag: 'useful',
        when: (s) => !!s.facts.scope && !s.flags.legalTold,
        run: () => ({ set: { legalTold: true }, text: 'Legal opens a privileged file, asks for a record of every decision and starts a timeline for any notification.' }),
      },
      {
        id: 'finance', group: 'Communicate', label: 'Tell the finance director what will and will not be ready by Monday, and what is being done to protect payroll', hint: 'Give an honest date.', tag: 'useful',
        when: (s) => !!s.facts.scope && !s.flags.financeTold,
        run: () => ({ set: { financeTold: true }, text: 'The finance director agrees to the plan. She asks for an update on Sunday night and will have a manual check ready.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when it is cut off, preserved and replaced.', tag: 'key', ends: true,
        when: (s) => !s.flags.online && s.flags.restored,
        run: () => ({ text: 'You declare the immediate risk contained and hand the image to the forensic contractor.' }),
      },
    ],
    contained: (s) => !s.flags.online && s.flags.restored,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.evidenceLost ? { label: 'The disk and memory were destroyed before they were preserved', points: -45 } : s.flags.imaged ? { label: 'Memory and disk were captured, hashed and recorded', points: 14 } : { label: 'The evidence was not preserved', points: -20 });
      out.push(s.flags.isolated ? { label: 'The server was cut off while it kept running', points: 8 } : { label: 'The server was not isolated cleanly', points: -8 });
      out.push(s.flags.restored ? { label: 'A clean replacement was built and checked for Monday', points: 10 } : { label: 'No replacement was built', points: -12 });
      out.push(s.flags.legalTold ? { label: 'Legal was brought in and a record kept', points: 8 } : { label: 'Legal was not told', points: -12 });
      out.push(s.flags.financeTold ? { label: 'The finance director was given an honest plan', points: 8 } : { label: 'The finance director was not told', points: -8 });
      if (s.facts.logs) out.push({ label: 'The logs were saved and hashed', points: 6 });
      if (s.flags.restoredEarly) out.push({ label: 'The replacement was built while the old server was still online', points: -20 });
      if (s.flags.poweroff) out.push({ label: 'The server was powered off, losing the memory', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The evidence was destroyed, the program spread, or the business was left without a plan.' },
      { min: 50, name: 'Costly', blurb: 'The server was dealt with, with gaps: preserving first, telling Legal, or giving the finance director a plan.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 150, name: 'Textbook', blurb: 'You found the scope, preserved memory and disk before anything was changed, cut the server off without powering it down, built a clean replacement and kept Legal and the business informed.' },
    ],
    debrief: [
      {
        id: 'ic-dr-order',
        question: 'IT wanted to wipe and rebuild the server at once. Why was imaging it first the right order, even though it cost two hours?',
        options: [
          { text: 'Evidence cannot be recreated: once the disk and memory are gone, nobody can say what the program did or took, and that decides what the company must tell staff and the regulator', correct: true, explain: 'Rebuilding is quick and can be done in parallel. Preserving evidence is the step that cannot be undone, so it goes first.' },
          { text: 'Because wiping a server is never allowed', correct: false, explain: 'It is allowed once the evidence is preserved. The order was the point.' },
          { text: 'Because the finance director asked for it', correct: false, explain: 'She asked for payroll by Monday. The order came from what cannot be redone.' },
          { text: 'Because imaging makes the server clean', correct: false, explain: 'Imaging only copies it. Cleaning is a separate step.' },
        ],
      },
      {
        id: 'ic-dr-power',
        question: 'Why was powering the server off a poor way to contain it?',
        options: [
          { text: 'The program ran only in memory, so powering off destroyed the best evidence of what it was doing; cutting it off from the network stops it just as well', correct: true, explain: 'Contain by isolating, not by switching off, when memory holds the evidence.' },
          { text: 'Because servers cannot be powered off', correct: false, explain: 'They can. It was the wrong way to contain this one.' },
          { text: 'Because it would delay payroll', correct: false, explain: 'Payroll was handled by the replacement.' },
          { text: 'Because the program would be harder to find on the disk', correct: false, explain: 'The issue is the memory, not the disk.' },
        ],
      },
    ],
  },
];
