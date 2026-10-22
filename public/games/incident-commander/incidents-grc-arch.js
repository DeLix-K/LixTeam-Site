// Governance, Risk and Compliance lead-tier Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. The incident is about finding a serious compliance problem in a company Contoso is about
// to buy, and being honest about it under deal pressure. It is simplified and is not legal advice. It contains no technique.

export const GRC_ARCH = [
  {
    id: 'acquisition-surprise',
    title: 'The company we are about to buy',
    skill: 'hardening',
    blurb: 'Two days before signing an acquisition, due diligence finds the target has been holding customers\' data it should not have, and had a breach it never reported. Decide what to do with what you have found, without becoming part of the problem.',
    role: 'Head of risk, Contoso',
    startClock: '09:00',
    minutesPerUnit: 60,
    maxTime: 12,
    brief: [
      'Wednesday, 09:00. Contoso is due to sign the purchase of Fabrikam on Friday. In the data room your team finds that Fabrikam keeps full payment-card details of 40,000 customers it no longer needs, and that a spreadsheet of 6,000 customer records was emailed to the wrong recipient fourteen months ago and was never reported to anyone.',
      'You are the head of risk. The chief executive wants the deal signed on Friday, and the seller says the documents are "confidential and not to be copied". Your team has already opened some of the data. Every action takes an hour.',
    ],
    initial: {
      flags: {
        scoped: false,
        counsel: false,
        boardTold: false,
        sellerRaised: false,
        planned: false,
        copied: false,
        buried: false,
        walked: false,
        waited: false,
        pressure: true,
      },
    },
    passive: (s) => (s.flags.counsel ? 0 : 2) + (s.flags.boardTold ? 0 : 1),
    events: [
      {
        id: 'seller-pressure', at: 4, expires: true,
        when: (s) => !s.flags.counsel,
        run: () => ({ threat: 15, severity: 'medium', text: 'The seller\'s lawyer calls the chief executive: "We hear your team has been reading customer files. Sign on Friday or the price changes." The chief executive asks you to wrap it up.' }),
      },
      {
        id: 'signing', at: 8, expires: true,
        when: (s) => !s.flags.boardTold,
        run: () => ({ threat: 25, severity: 'high', text: 'Friday morning: the signing papers are on the table and the board has not been told what the data room showed.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Understand
      {
        id: 'scope', group: 'Understand', label: 'Set out exactly what was found, from the file index and the minutes, without opening any more customer data', hint: 'Know what you have, touch nothing more.', tag: 'key',
        run: () => ({
          set: { scoped: true },
          reveal: { scope: 'Fabrikam holds 40,000 sets of full card details in an old database, long past any need. A spreadsheet of 6,000 customers\' names, addresses and account numbers was emailed to a customer by mistake fourteen months ago; the minutes show the managing director knew and decided it was not worth reporting. Nobody on your team has copied anything.' },
          text: 'Two serious findings: data kept without need, and an unreported breach that the seller\'s management knew about.',
        }),
      },
      // ── Take advice
      {
        id: 'counsel', group: 'Act', label: 'Bring in Contoso\'s lawyers and agree how the findings are documented, who sees them and what must be said to whom', hint: 'Get the rules right first.', tag: 'key',
        when: (s) => !!s.facts.scope && !s.flags.counsel,
        run: () => ({ set: { counsel: true }, text: 'Counsel opens a privileged file, tells your team not to copy any customer data and explains that Contoso could acquire the liabilities with the company. They ask for a short note by noon.' }),
      },
      {
        id: 'board', group: 'Act', label: 'Brief the chief executive and the audit committee chair together with the facts, the risk and the options, and recommend the signing waits for the answers', hint: 'The board is owed this before Friday.', tag: 'key',
        when: (s) => !!s.flags.counsel && !s.flags.boardTold,
        run: () => ({ set: { boardTold: true }, text: 'The chief executive is unhappy and the audit committee chair is clear: "We are not signing until we know what we are buying."' }),
      },
      {
        id: 'seller', group: 'Act', label: 'Raise both findings with the seller in writing and ask for the facts, the retention schedule and whether the regulator has been told, before signing', hint: 'Ask, with the board behind you.', tag: 'key',
        when: (s) => !!s.flags.boardTold && !s.flags.sellerRaised,
        run: () => ({ set: { sellerRaised: true }, reveal: { seller: 'The seller admits the card data was never deleted and says the breach was "a minor matter". It will give a warranty, an indemnity and a price reduction, and will report the breach itself if Contoso asks for that to be a condition.' }, text: 'The seller responds within hours, offering protections and agreeing to report the breach.' }),
      },
      {
        id: 'plan', group: 'Act', label: 'Draft a condition and a remediation plan: delete the card data, report the breach, an indemnity and an adjusted price, with a date for each', hint: 'A way to say yes safely.', tag: 'useful',
        when: (s) => !!s.facts.seller && !s.flags.planned,
        run: () => ({ set: { planned: true }, text: 'A one-page conditions list is agreed by counsel. The deal can go ahead only when each item has been done or is covered by an indemnity.' }),
      },
      // ── Poor choices
      {
        id: 'copy', group: 'Understand', label: 'Copy the files to Contoso\'s systems so that your team can review them properly', hint: 'Thorough?', tag: 'bad',
        run: () => ({ set: { copied: true }, threat: 15, text: 'The customer data is now on Contoso\'s servers without any lawful basis, and Contoso has become a holder of it.' }),
      },
      {
        id: 'bury', group: 'Act', label: 'Leave the findings out of the report so that the deal is not disturbed', hint: 'Protect the deal?', tag: 'bad',
        run: () => ({ set: { buried: true }, threat: 25, text: 'The report goes to the board without the findings. If the breach surfaces, Contoso will have known and said nothing.' }),
      },
      {
        id: 'walk', group: 'Act', label: 'Recommend abandoning the acquisition at once', hint: 'Safest?', tag: 'overreact',
        run: () => ({ set: { walked: true }, disruption: 50, text: 'The deal collapses on Wednesday afternoon. A better answer existed in conditions and a lower price, and the board is angry at the lost opportunity.' }),
      },
      {
        id: 'wait', group: 'Act', label: 'Say nothing until after signing and deal with it once the company is yours', hint: 'Sort it later?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 20, text: 'You wait. After Friday, the unreported breach and the stored card data become Contoso\'s own problem.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk managed and hand the conditions to the deal team', hint: 'Only when the board knows and the seller has been asked.', tag: 'key', ends: true,
        when: (s) => !!s.flags.boardTold && !!s.flags.sellerRaised && !s.flags.copied && !s.flags.buried,
        run: () => ({ text: 'You declare the immediate risk managed and hand the conditions list to the deal team.' }),
      },
    ],
    contained: (s) => !!s.flags.boardTold && !!s.flags.sellerRaised && !s.flags.copied && !s.flags.buried,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.scoped ? { label: 'You set out the findings without copying any customer data', points: 8 } : { label: 'The findings were not set out', points: -10 });
      out.push(s.flags.counsel ? { label: 'Lawyers were brought in and the data was handled properly', points: 10 } : { label: 'No legal advice was taken', points: -14 });
      out.push(s.flags.boardTold ? { label: 'The chief executive and the audit committee chair were told before signing', points: 14 } : { label: 'The board was not told before signing', points: -25 });
      out.push(s.flags.sellerRaised ? { label: 'Both findings were raised with the seller in writing', points: 10 } : { label: 'The seller was not asked', points: -10 });
      if (s.flags.planned) out.push({ label: 'A conditions list and remediation plan were agreed', points: 10 });
      if (s.flags.copied) out.push({ label: 'Customer data was copied to Contoso systems', points: -30 });
      if (s.flags.buried) out.push({ label: 'The findings were left out of the report', points: -50 });
      if (s.flags.walked) out.push({ label: 'The deal was abandoned outright', points: -30 });
      if (s.flags.waited) out.push({ label: 'You waited until after signing', points: -30 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The findings were hidden, data was copied, or the board signed without knowing.' },
      { min: 50, name: 'Costly', blurb: 'The deal was handled, with gaps: legal advice, telling the board, asking the seller or an overreaction.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 155, name: 'Textbook', blurb: 'You set out the findings without copying data, took legal advice, told the board and the audit committee, asked the seller in writing and turned the problem into conditions.' },
    ],
    debrief: [
      {
        id: 'ic-gr-copy',
        question: 'Why was copying the customer files to Contoso\'s systems a mistake, even though it would have helped the review?',
        options: [
          { text: 'Contoso has no lawful basis to hold the customers\' data before the deal closes, and copying it would make Contoso responsible for it; findings can be documented from indexes and minutes without taking the data', correct: true, explain: 'Due diligence should find problems without creating new ones. Work from what you are entitled to see.' },
          { text: 'Because copying files is always forbidden', correct: false, explain: 'It is not always. Here it created a new liability.' },
          { text: 'Because the seller asked for the documents not to be copied', correct: false, explain: 'That is one reason, and the main one is the law about holding data.' },
          { text: 'Because the files were too large', correct: false, explain: 'Size was not the problem.' },
        ],
      },
      {
        id: 'ic-gr-bury',
        question: 'Why was leaving the findings out of the report to protect the deal the worst option?',
        options: [
          { text: 'Contoso would have known of an unreported breach and the retained card data when it signed, and the board would have approved the purchase on an incomplete picture; the truth told early is a negotiating position, and the truth hidden is a liability', correct: true, explain: 'Disclosure turned the problem into conditions and a lower price. Concealment turned it into Contoso\'s own wrongdoing.' },
          { text: 'Because reports must always be long', correct: false, explain: 'Length was not the point.' },
          { text: 'Because the seller would find out', correct: false, explain: 'The reason is what Contoso owes its own board and its customers.' },
          { text: 'Because it would have been easier to disclose later', correct: false, explain: 'Later is worse, not easier.' },
        ],
      },
    ],
  },
];
