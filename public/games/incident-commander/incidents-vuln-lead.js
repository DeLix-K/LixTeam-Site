// Senior Vulnerability Management Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. IP addresses come from the reserved documentation ranges.

export const VULN_LEAD = [
  {
    id: 'no-patch-yet',
    title: 'Critical flaw, no patch yet',
    skill: 'hardening',
    blurb: 'A critical flaw is announced in software that runs across your estate. Attackers are already using it, and the vendor has no fix. Work out where you are exposed, reduce the risk with what you have and check whether anyone got there first.',
    role: 'Senior vulnerability management analyst, Contoso',
    startClock: '16:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Friday, 16:30. The vendor of a widely used web application server has published a critical flaw that lets anyone on the internet run commands on it. It is being used in attacks now. There is no patch. The vendor suggests a temporary configuration change.',
      'You are the senior vulnerability management analyst on call. Contoso runs this software on about 200 servers, but you do not have an up-to-date list of which, and the weekend is coming. Every action takes time.',
    ],
    initial: {
      flags: {
        edgeExposed: true, // the internet-facing servers are unprotected
        hostCompromised: true, // at least one server has already been taken
        inventoried: false,
        isolated: false,
        rebuilt: false,
        monitored: false,
        internalPlanned: false,
        mgrTold: false,
        shutdown: false,
        brokeProduction: false,
        secondHit: false,
      },
    },
    passive: (s) => (s.flags.edgeExposed ? 5 : 0) + (s.flags.hostCompromised ? 3 : 0),
    events: [
      {
        id: 'second-server', at: 5, expires: true,
        when: (s) => s.flags.edgeExposed,
        run: () => ({ set: { secondHit: true }, threat: 22, severity: 'high', text: 'Attackers using the flaw take a second internet-facing server that was still unprotected.' }),
      },
      {
        id: 'internal-spread', at: 8, expires: true,
        when: (s) => s.flags.hostCompromised && !s.flags.isolated,
        run: () => ({ threat: 15, severity: 'high', text: 'The compromised server starts connecting to internal systems it has never contacted before.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'advisory', group: 'Investigate', label: 'Read the vendor advisory and the threat intelligence on exploitation', hint: 'What exactly is the risk and the workaround?', tag: 'key',
        run: () => ({
          reveal: { advisory: 'The flaw lets an unauthenticated visitor run commands on the server. Attacks began 36 hours ago. The vendor\'s temporary fix is to switch off one feature in the server\'s configuration; a patch is expected next week. Public exploit code is circulating.' },
          text: 'The risk is serious and immediate. A workaround exists: switch off the affected feature.',
        }),
      },
      {
        id: 'inventory', group: 'Investigate', label: 'Find every instance of the software and split them into internet-facing and internal', hint: 'Where are you exposed?', tag: 'key',
        when: (s) => !!s.facts.advisory,
        run: () => ({
          set: { inventoried: true },
          reveal: { inventory: 'The software runs on 212 servers: 14 are reachable from the internet, 198 are internal only. Three of the 14 were not in your asset register.' },
          text: 'You have the list: 14 internet-facing servers, and 198 internal. Three of the 14 were unknown to your register.',
        }),
      },
      {
        id: 'hunt', group: 'Investigate', label: 'Check the internet-facing servers for signs they have already been attacked', hint: 'Has anyone got there first?', tag: 'key',
        when: (s) => !!s.facts.inventory,
        run: () => ({
          reveal: { hunt: 'One server, web-ext-07, shows an unfamiliar file in its web folder created 29 hours ago, and outbound connections to 203.0.113.35 that began soon after.' },
          text: 'One internet-facing server was taken before the advisory was published.',
        }),
      },
      {
        id: 'fullscan', group: 'Investigate', label: 'Start a full vulnerability scan of every system in the company', hint: 'Check everything?', tag: 'weak',
        run: () => ({ text: 'The scan will take two days, floods the findings with unrelated items and does not tell you which servers have the affected feature.' }),
      },
      // ── Contain
      {
        id: 'mitigate', group: 'Contain', label: 'Apply the vendor\'s workaround to the 14 internet-facing servers, and add a filter rule in front of them that blocks the known attack pattern', hint: 'Reduce the exposure now.', tag: 'key',
        when: (s) => !!s.facts.inventory && s.flags.edgeExposed,
        run: () => ({ set: { edgeExposed: false }, disruption: 3, text: 'The feature is switched off and the filter is live on all 14. The attack pattern is blocked. One minor internal tool that used the feature stops working.' }),
      },
      {
        id: 'isolate', group: 'Contain', label: 'Take web-ext-07 off the network and preserve a copy of it', hint: 'Contain the server already taken.', tag: 'key',
        when: (s) => !!s.facts.hunt && !s.flags.isolated,
        run: () => ({ set: { isolated: true, hostCompromised: false }, disruption: 2, text: 'web-ext-07 is isolated and a copy kept for investigation. Its outbound connection stops.' }),
      },
      {
        id: 'rebuild', group: 'Eradicate & recover', label: 'Rebuild web-ext-07 from a clean image with the workaround applied, and replace any credentials it held', hint: 'Do not trust it again.', tag: 'key',
        when: (s) => !!s.facts.hunt && s.flags.isolated && !s.flags.rebuilt,
        run: () => ({ set: { rebuilt: true }, disruption: -6, text: 'The server is rebuilt, protected and back in service. Its stored credentials are replaced.' }),
      },
      {
        id: 'monitor', group: 'Contain', label: 'Add alerts for the exploit pattern and for new files or outbound connections on every server running the software', hint: 'See the next attempt.', tag: 'useful',
        when: (s) => !!s.facts.inventory && !s.flags.monitored,
        run: () => ({ set: { monitored: true }, disruption: 1, text: 'Alerts are in place. Any further attempt, or any new connection from these servers, is flagged to you.' }),
      },
      {
        id: 'internal', group: 'Contain', label: 'Plan the 198 internal servers: apply the workaround this weekend in order of exposure, and patch when the vendor releases it', hint: 'Do not forget the inside.', tag: 'useful',
        when: (s) => !!s.facts.inventory && !s.flags.internalPlanned,
        run: () => ({ set: { internalPlanned: true }, text: 'An ordered plan is agreed with the platform team, starting with servers that hold the most sensitive data. The workaround will be applied this weekend.' }),
      },
      {
        id: 'unsafe-patch', group: 'Contain', label: 'Apply the vendor\'s unreleased "preview" fix to every server at once', hint: 'Fix everything now?', tag: 'bad',
        run: () => ({ set: { edgeExposed: false, brokeProduction: true }, disruption: 40, text: 'The untested preview breaks the application on 60 servers, including two that run payroll. The exposure is closed, and so is part of the business.' }),
      },
      {
        id: 'wait', group: 'Contain', label: 'Wait until the vendor releases the official patch next week', hint: 'Do nothing?', tag: 'bad',
        run: () => ({ threat: 12, text: 'You decide to wait. The attacks carry on over the weekend.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Switch off every server that runs the software', hint: 'Remove the risk entirely.', tag: 'overreact',
        run: () => ({ set: { shutdown: true, edgeExposed: false }, disruption: 60, text: 'Customer-facing and internal services all go down, while the one server already taken is still running.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Tell the CIO and the on-call manager about the flaw, what you have done and what you need over the weekend', hint: 'Keep the right people informed.', tag: 'useful',
        when: (s) => !!s.facts.advisory,
        run: () => ({ set: { mgrTold: true }, text: 'The CIO and on-call manager are told and approve weekend work from the platform team.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.edgeExposed && !s.flags.hostCompromised,
        run: () => ({ text: 'You declare the immediate risk contained.' }),
      },
    ],
    contained: (s) => !s.flags.edgeExposed && !s.flags.hostCompromised,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.edgeExposed ? { label: 'Internet-facing servers were left exposed', points: -20 } : { label: 'Internet-facing servers protected with the workaround and a filter', points: 12 });
      if (s.flags.hostCompromised) out.push({ label: 'A server already taken was left on the network', points: -25 });
      else if (s.flags.isolated) out.push({ label: 'The compromised server was isolated and preserved', points: 10 });
      if (s.flags.secondHit) out.push({ label: 'A second internet-facing server was taken before it was protected', points: -15 });
      out.push(s.flags.rebuilt ? { label: 'The compromised server was rebuilt and its credentials replaced', points: 14 } : { label: 'The compromised server was not rebuilt', points: -16 });
      out.push(s.flags.inventoried ? { label: 'Every instance was found, including three not in the register', points: 6 } : { label: 'No inventory of where the software runs', points: -10 });
      if (s.flags.monitored) out.push({ label: 'Detection added for the exploit pattern', points: 6 });
      if (s.flags.internalPlanned) out.push({ label: 'The 198 internal servers were planned', points: 10 });
      else out.push({ label: 'Internal servers left without a plan', points: -10 });
      if (s.flags.brokeProduction) out.push({ label: 'An untested fix broke production', points: -35 });
      if (s.flags.mgrTold) out.push({ label: 'Leadership informed', points: 4 });
      if (s.flags.shutdown) out.push({ label: 'Switched off every affected server', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The exposure stayed, a taken server stayed on the network, or an untested fix broke the business.' },
      { min: 55, name: 'Costly', blurb: 'The exposure was closed, with gaps: the taken server not rebuilt, no inventory, or no plan for the inside.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 145, name: 'Textbook', blurb: 'You found every instance, reduced the exposure with the workaround, dealt with the server already taken and planned the rest.' },
    ],
    debrief: [
      {
        id: 'ic-nopatch-mitigate',
        question: 'There was no patch. Why was acting immediately still right?',
        options: [
          { text: 'A workaround and a filter reduce the exposure now, and waiting for a patch leaves exploited servers on the internet over the weekend', correct: true, explain: 'Risk is reduced by whatever means are available. A patch is one control. A workaround, a filter and detection are others.' },
          { text: 'Because patches are never released on time', correct: false, explain: 'The patch is coming. The point is the time before it.' },
          { text: 'Because the vendor demands it', correct: false, explain: 'The vendor suggested it, but the reason is the risk.' },
          { text: 'It was not right: waiting would have been safer', correct: false, explain: 'Active exploitation of internet-facing servers means waiting is the risky option.' },
        ],
      },
      {
        id: 'ic-nopatch-inventory',
        question: 'Why did finding every instance of the software come first?',
        options: [
          { text: 'You cannot protect systems you do not know about, and three of the exposed servers were missing from the register', correct: true, explain: 'The inventory showed three unknown servers on the internet. Protecting only the known ones would have left them open.' },
          { text: 'To make a report for the vendor', correct: false, explain: 'The inventory is for action, not paperwork.' },
          { text: 'Because the scanner needs a list to start', correct: false, explain: 'That is a tool detail. The reason is that unknown systems stay exposed.' },
          { text: 'It did not need to come first', correct: false, explain: 'It is what let you protect every exposed server, not just the known ones.' },
        ],
      },
    ],
  },
];
