// Threat Intelligence lead-tier Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. The incident is about a trusted sharing channel being used to deliver a false warning: verify outside the
// channel, stop it spreading and tell the others. It contains no technique.

export const TI_ARCH = [
  {
    id: 'false-urgent-advisory',
    title: 'The urgent warning from a trusted friend',
    skill: 'hardening',
    blurb: 'An urgent advisory appears in the sector sharing platform from a trusted partner\'s account, telling members to switch off their endpoint agent and install an update from a link. It does not look right. Verify it outside the channel, stop it spreading and warn the others.',
    role: 'Intelligence lead, Contoso',
    startClock: '14:00',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Thursday, 14:00. In the sector sharing platform, a post appears from the account of Northwind\'s security director, a trusted partner: "URGENT: a critical flaw in the Sentinel endpoint agent is being exploited. Disable the agent on finance and executive machines now and install the emergency update from the link below."',
      'You are the intelligence lead. Contoso uses Sentinel on every machine. The head of IT has already read the post and is asking whether to act. Other members are reading it too. Every action takes time.',
    ],
    initial: {
      flags: {
        live: true,
        verified: false,
        held: false,
        checked: false,
        groupWarned: false,
        adminTold: false,
        briefed: false,
        forwarded: false,
        disabled: false,
        left: false,
        ignored: false,
      },
    },
    passive: (s) => (s.flags.live ? 3 : 0),
    events: [
      {
        id: 'click', at: 3, expires: true,
        when: (s) => s.flags.live && !s.flags.held,
        run: () => ({ threat: 20, severity: 'high', text: 'Two finance staff, forwarded the post by a well-meaning colleague, follow the link and install the "emergency update".' }),
      },
      {
        id: 'spread', at: 7, expires: true,
        when: (s) => s.flags.live && !s.flags.groupWarned,
        run: () => ({ threat: 20, severity: 'high', text: 'Members across the sector start posting that they have acted on the advisory. Several have already switched their agents off.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Verify
      {
        id: 'verify', group: 'Verify', label: 'Phone Northwind\'s security director on the number you already hold, not from the post, and ask whether she wrote it', hint: 'Check outside the channel.', tag: 'key',
        run: () => ({
          set: { verified: true },
          reveal: { verify: 'She did not write it. She is at a conference and says her account has been behaving oddly since this morning. The link, she thinks, is not Sentinel\'s. She will report it to the platform.' },
          text: 'Northwind confirms the post is false and that the account has been taken over.',
        }),
      },
      // ── Contain
      {
        id: 'hold', group: 'Contain', label: 'Tell your SOC and the head of IT not to act on the post, and block the link and its domain', hint: 'Stop it at home.', tag: 'key',
        when: (s) => !!s.facts.verify && !s.flags.held,
        run: () => ({ set: { held: true }, disruption: 1, text: 'The SOC and IT are told to ignore the advisory. The link and its domain are blocked at the gateway.' }),
      },
      {
        id: 'check', group: 'Contain', label: 'Find out whether anyone in Contoso has already followed the link or switched off the agent, and put it right', hint: 'Who acted?', tag: 'key',
        when: (s) => !!s.flags.held && !s.flags.checked,
        run: () => ({ set: { checked: true, live: false }, reveal: { check: 'Two finance laptops installed the update and one has its agent switched off. All three are isolated, rebuilt from a clean image and their users\' passwords are reset. Nothing else has been affected.' }, disruption: 3, text: 'Three machines were affected and have been isolated and rebuilt. The rest of Contoso is clear.' }),
      },
      // ── Warn others
      {
        id: 'warn', group: 'Warn', label: 'Warn the other members through a separate channel (the group\'s phone tree and email list) that the post is false and must not be acted on', hint: 'Reach the people who have not read this.', tag: 'key',
        when: (s) => !!s.facts.verify && !s.flags.groupWarned,
        run: () => ({ set: { groupWarned: true }, text: 'The phone tree and email list reach most members within the hour. Several confirm they have not acted, and two who had begin to put it right.' }),
      },
      {
        id: 'admin', group: 'Warn', label: 'Tell the platform\'s administrators and Northwind so that the post is removed and the account is locked and reset', hint: 'Remove the source.', tag: 'useful',
        when: (s) => !!s.facts.verify && !s.flags.adminTold,
        run: () => ({ set: { adminTold: true }, text: 'The administrators remove the post, lock the account and begin to look for other posts made from it.' }),
      },
      {
        id: 'brief', group: 'Warn', label: 'Brief the head of IT and the head of security on what happened and how it was checked, and agree that urgent advisories are verified by phone before anyone acts', hint: 'A habit for next time.', tag: 'useful',
        when: (s) => !!s.facts.verify && !s.flags.briefed,
        run: () => ({ set: { briefed: true }, text: 'Both agree. A one-line rule is added to the SOC runbook: urgent advice to switch off a control is verified by phone with the named person first.' }),
      },
      // ── Poor choices
      {
        id: 'forward', group: 'Contain', label: 'Forward the advisory to IT and ask them to act on it quickly, since it is from a trusted partner', hint: 'Trust the source?', tag: 'bad',
        run: () => ({ set: { forwarded: true }, threat: 20, text: 'IT begins to roll out the "update". It is stopped after forty minutes, with sixty machines affected.' }),
      },
      {
        id: 'disable', group: 'Contain', label: 'Switch off the endpoint agent company-wide to be safe, then install the update', hint: 'Take no chances?', tag: 'overreact',
        run: () => ({ set: { disabled: true }, disruption: 45, text: 'The agent is switched off on 2,000 machines. For two days nothing is protecting them, and the "update" is installed on all of them.' }),
      },
      {
        id: 'leave', group: 'Warn', label: 'Leave the sharing group, since it cannot be trusted', hint: 'Cut the link?', tag: 'overreact',
        run: () => ({ set: { left: true }, disruption: 20, text: 'You withdraw Contoso from the group. It loses access to the shared indicators that protect it every day.' }),
      },
      {
        id: 'ignore', group: 'Verify', label: 'Do nothing and see whether anyone else raises it', hint: 'Probably spam?', tag: 'bad',
        run: () => ({ set: { ignored: true }, threat: 15, text: 'You wait. The post stays up, and more people act on it.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when it is verified, held, checked and the others warned.', tag: 'key', ends: true,
        when: (s) => !!s.flags.held && !!s.flags.checked && !!s.flags.groupWarned,
        run: () => ({ text: 'You declare the immediate risk contained and ask the platform for a review of how the account was taken.' }),
      },
    ],
    contained: (s) => !!s.flags.held && !!s.flags.checked && !!s.flags.groupWarned,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.verified ? { label: 'You verified the advisory with the named person, outside the channel', points: 12 } : { label: 'You did not verify the advisory', points: -16 });
      out.push(s.flags.held ? { label: 'Your own organisation was told not to act and the link was blocked', points: 10 } : { label: 'Your organisation was not told to hold', points: -16 });
      out.push(s.flags.checked ? { label: 'You found and fixed the machines that had acted', points: 10 } : { label: 'You did not check whether anyone had acted', points: -14 });
      out.push(s.flags.groupWarned ? { label: 'The other members were warned by a separate channel', points: 12 } : { label: 'The other members were not warned', points: -16 });
      if (s.flags.adminTold) out.push({ label: 'The platform and the partner were told', points: 6 });
      if (s.flags.briefed) out.push({ label: 'A verification rule was agreed with IT and security', points: 6 });
      if (s.flags.forwarded) out.push({ label: 'The advisory was forwarded to IT to act on', points: -30 });
      if (s.flags.disabled) out.push({ label: 'The endpoint agent was switched off company-wide', points: -35 });
      if (s.flags.left) out.push({ label: 'Contoso left the sharing group', points: -20 });
      if (s.flags.ignored) out.push({ label: 'You waited to see whether the post mattered', points: -20 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The false advisory was acted on across Contoso or the sector, or an overreaction did more harm than the post.' },
      { min: 50, name: 'Costly', blurb: 'The post was handled, with gaps: verifying, holding, checking, warning others or a poor choice.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 156, name: 'Textbook', blurb: 'You verified by phone outside the channel, held your own organisation, found the machines that had acted, warned the others by a separate route and agreed a rule for next time.' },
    ],
    debrief: [
      {
        id: 'ic-ti-verify',
        question: 'Why phone Northwind on a number Contoso already held, instead of replying in the platform?',
        options: [
          { text: 'The account that posted the advisory was the thing in doubt, so any answer through the same channel could come from the same attacker; verification must go through a route the attacker does not control', correct: true, explain: 'A trusted channel is only as safe as the account behind it. Check with the person, by a means you already trusted.' },
          { text: 'Because phone calls are more polite', correct: false, explain: 'Politeness was not the point.' },
          { text: 'Because the platform was down', correct: false, explain: 'It was working. It was the source of the false post.' },
          { text: 'Because Northwind prefers phone calls', correct: false, explain: 'The reason is control of the route.' },
        ],
      },
      {
        id: 'ic-ti-disable',
        question: 'Why was switching off the endpoint agent everywhere, as the post asked, the wrong response even if it might have been genuine?',
        options: [
          { text: 'A request to switch off a protective control is exactly what an attacker would ask for; it should be verified before it is done, and a genuine flaw would have been confirmed through the vendor\'s own channel', correct: true, explain: 'Advice that removes protection needs the strongest verification. The cost of checking was an hour; the cost of being wrong was two days with no protection.' },
          { text: 'Because the agent is too important to ever switch off', correct: false, explain: 'It can be switched off for a good reason, once verified.' },
          { text: 'Because the update was too large', correct: false, explain: 'Size was not the issue.' },
          { text: 'Because IT would have refused', correct: false, explain: 'IT was ready to act, which is part of the danger.' },
        ],
      },
    ],
  },
];
