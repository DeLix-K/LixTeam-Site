// Threat Intelligence Incident Commander incidents (see incidents.js for the format). Everything here
// is fictional. IP addresses come from the reserved documentation ranges.

export const TI = [
  {
    id: 'partner-warning',
    title: 'The warning from a friend',
    skill: 'hardening',
    blurb: 'A trusted partner sends an urgent, partial warning about attacks on your sector. You cannot confirm it yet. Find out whether you are exposed, act in proportion and tell leaders how sure you are.',
    role: 'Threat intelligence analyst, Contoso',
    startClock: '07:40',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Wednesday, 07:40. A message arrives from the sector sharing group: "Urgent: a campaign is sending emails to finance teams with a spreadsheet attachment. We have seen it at four members. Indicators attached. We do not know who is behind it. Treat with caution."',
      'You are the threat intelligence analyst. You do not yet know whether Contoso has received any of these emails. The head of IT is already asking whether to switch off email for finance. Every action takes time.',
    ],
    initial: {
      flags: {
        exposed: true, // an infected machine may exist
        infectedFound: false,
        blocked: false,
        isolated: false,
        financeWarned: false,
        partnerShared: false,
        boardTold: false,
        overblock: false,
        public: false,
        waited: false,
        soTold: false,
      },
    },
    passive: (s) => (s.flags.exposed ? 4 : 0),
    events: [
      {
        id: 'second-stage', at: 5, expires: true,
        when: (s) => s.flags.exposed && !s.flags.isolated,
        run: () => ({ threat: 20, severity: 'high', text: 'The program on the infected machine downloads a second stage and begins reading the finance mailbox.' }),
      },
      {
        id: 'more-clicks', at: 7, expires: true,
        when: (s) => !s.flags.financeWarned,
        run: () => ({ threat: 10, severity: 'medium', text: 'A second finance user opens the same attachment before anyone has warned them.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'assess', group: 'Investigate', label: 'Assess the warning: who sent it, how many cases, what they saw first-hand and how sure they are', hint: 'How far to trust it?', tag: 'key',
        run: () => ({
          reveal: { assess: 'The group is a trusted sector exchange. Four members saw the same emails between Monday and Tuesday. The indicators are specific: three sender domains, one attachment name and two download addresses. The message says "actor unknown, moderate confidence in the indicators".' },
          text: 'A reliable source, with specific indicators and honest uncertainty.',
        }),
      },
      {
        id: 'search', group: 'Investigate', label: 'Search Contoso\'s email and web records for the listed domains, file name and addresses over the past week', hint: 'Are we in it?', tag: 'key',
        when: (s) => !!s.facts.assess,
        run: () => ({
          reveal: { search: 'One finance mailbox received an email from one of the listed domains on Tuesday at 15:12 with the listed attachment name. The web records show one laptop connected to one of the listed download addresses at 15:30. No other matches.' },
          text: 'Contoso has been hit: one email, one laptop that appears to have opened it.',
        }),
      },
      {
        id: 'scope', group: 'Investigate', label: 'Check who else received the email and whether any other machine contacted the listed addresses', hint: 'How far has it gone?', tag: 'key',
        when: (s) => !!s.facts.search,
        run: () => ({
          set: { infectedFound: true },
          reveal: { scope: 'Six finance staff received the email. One opened it (the laptop already found). The mail gateway shows the other five did not open the attachment. No other machine has contacted the listed addresses.' },
          text: 'One infected laptop and five warned-off recipients. The spread is limited.',
        }),
      },
      {
        id: 'research', group: 'Investigate', label: 'Spend an hour searching public sources for who is behind the campaign', hint: 'Find a name?', tag: 'weak',
        run: () => ({ text: 'You find speculation and no evidence, and the hour is gone.' }),
      },
      // ── Contain
      {
        id: 'block', group: 'Contain', label: 'Block the listed sender domains and addresses with an expiry date, and remove the email from the other five mailboxes', hint: 'Proportionate protection.', tag: 'key',
        when: (s) => !!s.facts.assess && !s.flags.blocked,
        run: () => ({ set: { blocked: true }, disruption: 1, text: 'The listed indicators are blocked for 30 days and the emails are removed from the five unopened mailboxes.' }),
      },
      {
        id: 'isolate', group: 'Contain', label: 'Isolate the infected laptop, preserve it, and reset the user\'s accounts', hint: 'Contain the one that opened it.', tag: 'key',
        when: (s) => !!s.facts.scope && !s.flags.isolated,
        run: () => ({ set: { isolated: true, exposed: false }, disruption: 2, text: 'The laptop is isolated and kept for examination, and the user\'s sessions and passwords are reset. The attackers have no way left in.' }),
      },
      {
        id: 'warn', group: 'Contain', label: 'Send finance a short warning: what the email looks like, not to open it and who to call', hint: 'People are a control.', tag: 'key',
        when: (s) => !!s.facts.assess && !s.flags.financeWarned,
        run: () => ({ set: { financeWarned: true }, text: 'The finance team gets a clear two-line warning with an example. Staff report two more copies of the email within the hour, all unopened.' }),
      },
      {
        id: 'blockall', group: 'Contain', label: 'Switch off all inbound email attachments for the whole company until the campaign is understood', hint: 'Play safe?', tag: 'overreact',
        run: () => ({ set: { overblock: true }, disruption: 40, text: 'Sales, legal and support cannot receive documents. The campaign continues against other companies and the only affected machine here is untouched.' }),
      },
      {
        id: 'publish', group: 'Contain', label: 'Tell the press that Contoso has been targeted by a named foreign group', hint: 'Look prepared?', tag: 'bad',
        run: () => ({ set: { public: true }, threat: 15, text: 'You have no evidence for the name, and the statement would have to be withdrawn if the actor turns out to be someone else.' }),
      },
      {
        id: 'wait', group: 'Contain', label: 'Wait for more detail from the partner before changing anything', hint: 'Be sure first?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 12, text: 'You wait. The infected laptop stays online while you wait.' }),
      },
      // ── Communicate
      {
        id: 'share', group: 'Communicate', label: 'Share what you found with the sector group: the matching email, the laptop\'s contact with the address and the fact that it was contained', hint: 'Give back.', tag: 'useful',
        when: (s) => !!s.facts.scope && !s.flags.partnerShared,
        run: () => ({ set: { partnerShared: true }, text: 'The group thanks you. Two other members find the same traffic in their own records within the hour.' }),
      },
      {
        id: 'brief', group: 'Communicate', label: 'Brief the head of IT and the head of security: what is known, what is assessed, how sure you are and what you recommend', hint: 'Leaders need words they can use.', tag: 'useful',
        when: (s) => !!s.facts.search && !s.flags.boardTold,
        run: () => ({ set: { boardTold: true }, text: 'You tell them: we have confirmed one infected laptop (high confidence), the campaign is real (moderate confidence), the actor is unknown. They back the proportionate plan and drop the idea of switching off email.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.exposed && s.flags.blocked,
        run: () => ({ text: 'You declare the immediate risk contained.' }),
      },
    ],
    contained: (s) => !s.flags.exposed && s.flags.blocked,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.exposed ? { label: 'The infected laptop was left on the network', points: -20 } : { label: 'The infected laptop was isolated and preserved', points: 12 });
      out.push(s.flags.blocked ? { label: 'The listed indicators were blocked with an expiry', points: 8 } : { label: 'The indicators were not blocked', points: -10 });
      if (s.flags.infectedFound) out.push({ label: 'You found how far it had spread', points: 8 });
      else out.push({ label: 'You did not establish the scope', points: -10 });
      if (s.flags.financeWarned) out.push({ label: 'Finance were warned', points: 6 });
      else out.push({ label: 'Finance were not warned', points: -6 });
      if (s.flags.partnerShared) out.push({ label: 'Findings shared with the sector group', points: 6 });
      if (s.flags.boardTold) out.push({ label: 'Leaders told what is known, assessed and how sure you are', points: 8 });
      else out.push({ label: 'Leaders were not briefed', points: -6 });
      if (s.flags.public) out.push({ label: 'A named group was announced without evidence', points: -50 });
      if (s.flags.overblock) out.push({ label: 'Blocked all attachments for the company', points: -35 });
      if (s.flags.waited) out.push({ label: 'Waited while the laptop stayed online', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The infected machine stayed online, or an unsupported claim or overreaction did more harm than the threat.' },
      { min: 50, name: 'Costly', blurb: 'The threat was handled, with gaps: no scope, no warning, no briefing, or a disruptive overreaction.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 140, name: 'Textbook', blurb: 'You judged the source, found you were hit, contained it in proportion, warned people and briefed leaders with honest confidence levels.' },
    ],
    debrief: [
      {
        id: 'ic-pw-act',
        question: 'The warning was partial and the actor unknown. Why act on it at once?',
        options: [
          { text: 'It came from a reliable source with specific indicators you could check, and checking cost almost nothing; the right response is proportionate, based on what you can confirm', correct: true, explain: 'Good intelligence is used when it is specific and checkable, even if the author is unknown. Checking your own records confirmed you were hit.' },
          { text: 'Because every warning must be acted on without checking', correct: false, explain: 'You assessed the source first, and checked your own records before acting widely.' },
          { text: 'Because the actor is known to be dangerous', correct: false, explain: 'The actor was unknown. The method was the clue.' },
          { text: 'It should not have been acted on until the actor was identified', correct: false, explain: 'Waiting for a name would have left the laptop online.' },
        ],
      },
      {
        id: 'ic-pw-name',
        question: 'Why was it wrong to tell the press that a named foreign group was responsible?',
        options: [
          { text: 'You had no evidence for a name, and a wrong public claim damages trust and has to be retracted', correct: true, explain: 'The evidence supported the method and the indicators, not an actor. Saying more than you know is the commonest mistake in intelligence.' },
          { text: 'Because press statements are not allowed', correct: false, explain: 'Statements are allowed. This one would have been unsupported.' },
          { text: 'Because the group is not dangerous', correct: false, explain: 'Danger is not the issue. Evidence is.' },
          { text: 'It was right, because naming the group would have helped the investigation', correct: false, explain: 'It would not have helped and could have misled others.' },
        ],
      },
    ],
  },
];
