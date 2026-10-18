// Security Architect Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

export const ENGINEER_ARCH = [
  {
    id: 'supplier-breach',
    title: 'The supplier we all use',
    skill: 'hardening',
    blurb: 'A collaboration tool used by eleven teams reports that attackers took its customers\' access tokens. You do not know who connected what. Find out, protect the most dangerous connections first and bring the rest in without stopping the company.',
    role: 'Security architect, Contoso',
    startClock: '10:05',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Wednesday, 10:05. The vendor of a team collaboration tool has emailed every customer: attackers copied a store of access tokens, and any integration set up before the 3rd may be affected. The vendor has no list of what was used.',
      'You are the security architect. Contoso\'s teams have connected the tool to their code, tickets and customer data in ways nobody has recorded centrally. Every action takes time, and the teams need the tool to work today.',
    ],
    initial: {
      flags: {
        tokensLive: true, // the stolen tokens still work
        inventoried: false,
        priorityRotated: false,
        restRotated: false,
        blocked: false,
        misuseHit: false,
        secondHit: false,
        vendorPressed: false,
        teamsTold: false,
        dpoTold: false,
        mgrTold: false,
        shutdown: false,
      },
    },
    passive: (s) => (s.flags.tokensLive ? 4 : 0) + (!s.flags.priorityRotated ? 1 : 0),
    events: [
      {
        id: 'broad-token-used', at: 5, expires: true,
        when: (s) => s.flags.tokensLive && !s.flags.priorityRotated && !s.flags.blocked,
        run: () => ({ set: { misuseHit: true }, threat: 22, severity: 'high', text: 'A token with broad access is used from an unfamiliar address to read a code repository and a customer-data export.' }),
      },
      {
        id: 'more-tokens-used', at: 8, expires: true,
        when: (s) => s.flags.tokensLive && !s.flags.restRotated && !s.flags.blocked,
        run: () => ({ set: { secondHit: true }, threat: 10, severity: 'medium', text: 'Two more tokens that you have not yet replaced are tried from the same address.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'notice', group: 'Investigate', label: 'Read the vendor\'s notice and ask which tokens and which dates are affected', hint: 'What exactly was taken?', tag: 'key',
        run: () => ({
          reveal: { notice: 'Tokens for integrations created before the 3rd were in the copied store. The vendor says some tokens were used from outside, but cannot say which customers. Replacing a token makes the copied one useless.' },
          text: 'Replacing a token cuts off the attackers. You need to find out which ones Contoso has.',
        }),
      },
      {
        id: 'inventory', group: 'Investigate', label: 'Find every Contoso integration with the tool, who owns it and what it can reach', hint: 'What have we connected?', tag: 'key',
        when: (s) => !!s.facts.notice,
        run: () => ({
          set: { inventoried: true },
          reveal: { inventory: 'There are 22 integrations across 11 teams. Three have broad access: one to the main code repository, one to the customer support system and one to a shared data export. The other 19 can only read a single project each. Six teams did not know they had an integration.' },
          text: 'Three integrations are dangerous. The other nineteen are limited.',
        }),
      },
      {
        id: 'usage', group: 'Investigate', label: 'Check the tool\'s access logs for use of Contoso tokens from addresses you do not recognise', hint: 'Has anyone already used them?', tag: 'key',
        when: (s) => !!s.facts.inventory,
        run: () => ({
          reveal: { usage: 'The broad code-repository token and one data-export token were used from 203.0.113.99 on the 5th and 7th. No sign of use from that address on the other 20.' },
          text: 'Two of the three dangerous tokens have been used from outside already.',
        }),
      },
      {
        id: 'auditall', group: 'Investigate', label: 'Start a review of all 400 software tools the company uses', hint: 'Look at everything?', tag: 'weak',
        run: () => ({ text: 'The review will take weeks and does not tell you anything about the tokens in this incident.' }),
      },
      // ── Contain
      {
        id: 'rotate-priority', group: 'Contain', label: 'Replace the three broad-access tokens, and the two used ones, now, with the owning teams on a call', hint: 'The most dangerous first.', tag: 'key',
        when: (s) => !!s.facts.inventory && !s.flags.priorityRotated,
        run: () => ({ set: { priorityRotated: true }, disruption: 4, text: 'The five most dangerous tokens are replaced within the hour. The attackers\' copies stop working, and the affected teams reconnect with new tokens.' }),
      },
      {
        id: 'rotate-rest', group: 'Contain', label: 'Replace the remaining integrations in waves, with each owner, over the next day', hint: 'Close the rest.', tag: 'key',
        when: (s) => s.flags.priorityRotated && !s.flags.restRotated,
        run: () => ({ set: { restRotated: true, tokensLive: false }, disruption: 4, text: 'The remaining tokens are replaced in three waves. The stolen set is now useless against Contoso.' }),
      },
      {
        id: 'block', group: 'Contain', label: 'Suspend every integration with the tool until the vendor says it is safe', hint: 'Cut it all off?', tag: 'overreact',
        run: () => ({ set: { blocked: true, tokensLive: false }, disruption: 40, text: 'The stolen tokens stop working, and so do all the integrations. Eleven teams lose their normal tools, and nobody has a list of what to restore.' }),
      },
      {
        id: 'vendor', group: 'Contain', label: 'Press the vendor for their evidence: which Contoso tokens were used, from where and when', hint: 'Get their facts.', tag: 'useful',
        when: (s) => !!s.facts.notice && !s.flags.vendorPressed,
        run: () => ({ set: { vendorPressed: true }, text: 'The vendor shares a short timeline, which matches what you found in the logs and adds the first date of use.' }),
      },
      {
        id: 'wait', group: 'Contain', label: 'Wait for the vendor to tell you which tokens are affected', hint: 'Let them lead?', tag: 'bad',
        run: () => ({ threat: 14, text: 'You wait. The vendor cannot say, and the tokens remain live.' }),
      },
      // ── Communicate
      {
        id: 'teams', group: 'Communicate', label: 'Tell the eleven owning teams what has happened, what you are replacing and what they must check', hint: 'Teams need to act.', tag: 'useful',
        when: (s) => !!s.facts.inventory && !s.flags.teamsTold,
        run: () => ({ set: { teamsTold: true }, text: 'The teams are told in one clear message, and they check their own code and tickets for anything unusual.' }),
      },
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the data protection officer that a customer-data export token was used from outside', hint: 'Customer data may have been read.', tag: 'key',
        when: (s) => !!s.facts.usage && !s.flags.dpoTold,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts an assessment of what was in the export, as a possible reportable breach.' }),
      },
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the CISO and the head of engineering', hint: 'Keep the right people informed.', tag: 'useful',
        when: (s) => !!s.facts.notice,
        run: () => ({ set: { mgrTold: true }, text: 'The CISO and the head of engineering are briefed and support the plan.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.tokensLive,
        run: () => ({ text: 'You declare the immediate risk contained.' }),
      },
    ],
    contained: (s) => !s.flags.tokensLive,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.tokensLive ? { label: 'The stolen tokens were left working', points: -20 } : { label: 'Every affected token was replaced', points: 10 });
      if (s.flags.misuseHit) out.push({ label: 'A broad-access token was used before it was replaced', points: -18 });
      else if (s.flags.priorityRotated) out.push({ label: 'The most dangerous tokens were replaced before further misuse', points: 12 });
      if (s.flags.secondHit) out.push({ label: 'More tokens were tried before they were replaced', points: -6 });
      out.push(s.flags.inventoried ? { label: 'Every integration was found, including six teams did not know they had', points: 8 } : { label: 'No inventory of what was connected', points: -14 });
      if (s.flags.dpoTold) out.push({ label: 'DPO told that a customer-data token was used', points: 8 });
      else if (s.flags.misuseHit || s.flags.inventoried) out.push({ label: 'DPO not told about the customer-data export token', points: -16 });
      if (s.flags.teamsTold) out.push({ label: 'Owning teams told what to do', points: 8 });
      else out.push({ label: 'Owning teams not told what to do', points: -6 });
      if (s.flags.vendorPressed) out.push({ label: 'Vendor pressed for evidence', points: 4 });
      if (s.flags.mgrTold) out.push({ label: 'Leadership briefed', points: 4 });
      if (s.flags.blocked) out.push({ label: 'Suspended every integration', points: -30 });
      if (s.flags.shutdown) out.push({ label: 'Shut down everything', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The tokens stayed live, or the most dangerous ones were used before you replaced them.' },
      { min: 50, name: 'Costly', blurb: 'The tokens were replaced, with gaps: damage already done, an overreaction, or the DPO not told.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 140, name: 'Textbook', blurb: 'You found every integration, replaced the dangerous ones first, told the right people and kept the company working.' },
    ],
    debrief: [
      {
        id: 'ic-supplier-priority',
        question: 'Why replace the five dangerous tokens first rather than all 22 at once?',
        options: [
          { text: 'The broad tokens could do the most damage and two had already been used, so closing them fast matters most, while replacing the rest in waves avoids breaking eleven teams\' work', correct: true, explain: 'Speed where the risk is highest, care where it is lower. Replacing everything at once would have caused an outage and left no one able to check their own systems.' },
          { text: 'Because the vendor said to', correct: false, explain: 'The vendor could not say which tokens were affected. The priority comes from what each token can reach.' },
          { text: 'Because replacing tokens is expensive', correct: false, explain: 'Cost is not the reason.' },
          { text: 'It does not matter what order they are replaced in', correct: false, explain: 'It does: two dangerous tokens were being used while the rest sat idle.' },
        ],
      },
      {
        id: 'ic-supplier-design',
        question: 'What design change would have made this incident much smaller?',
        options: [
          { text: 'A central register of integrations, with tokens limited to the least they need and a short lifetime so they have to be renewed regularly', correct: true, explain: 'A register means you know what you have on day one. Narrow, short-lived tokens limit what a stolen copy can do and how long it works.' },
          { text: 'Buying a stronger firewall', correct: false, explain: 'The tokens were stolen from the vendor, not from Contoso\'s network.' },
          { text: 'Banning all third-party tools', correct: false, explain: 'Out of proportion. The problem is how they are connected and tracked.' },
          { text: 'Asking teams to be more careful', correct: false, explain: 'Six teams did not know they had an integration. Care cannot cover what you do not know about.' },
        ],
      },
    ],
  },
];
