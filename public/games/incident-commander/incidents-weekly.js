// Weekly Incident Commander incidents (released on a schedule: see core/weekly.js). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

export const WEEKLY = [
  {
    id: 'usb-in-car-park',
    title: 'The USB stick in the car park',
    skill: 'everyday',
    blurb: 'A receptionist plugged in a stick she found by the bins, to try to find its owner. A file opened, and nothing seemed to happen. Decide what to do in the first hour.',
    role: 'IT security analyst, Contoso',
    startClock: '09:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Monday, 09:30. The receptionist, Jo, tells the helpdesk she found a USB stick by the bins at 08:55 and plugged it into the reception computer "to see whose it was". A document opened with a message to "enable content", which she did. Nothing seemed to happen.',
      'You are the security analyst on call. The reception computer is signed in to the visitor system and to Jo\'s email. Every action takes time, and the stick may be the only way to learn what it was meant to do.',
    ],
    initial: {
      flags: {
        pcLive: true, // the reception computer may be running something harmful
        accountsOpen: true, // Jo\'s accounts and sessions may be in use by someone else
        stickKept: false,
        pcPreserved: false,
        plugged: false,
        reimaged: false,
        staffTold: false,
        mgrTold: false,
        shutdown: false,
        waited: false,
      },
    },
    passive: (s) => (s.flags.pcLive ? 4 : 0) + (s.flags.accountsOpen ? 2 : 0),
    events: [
      {
        id: 'second-stage', at: 5, expires: true,
        when: (s) => s.flags.pcLive,
        run: () => ({ threat: 20, severity: 'high', text: 'The reception computer downloads a second program and begins looking at the other computers on the office network.' }),
      },
      {
        id: 'mailbox', at: 7, expires: true,
        when: (s) => s.flags.accountsOpen,
        run: () => ({ threat: 10, severity: 'medium', text: 'Someone signs in to Jo\'s email from an address she has never used.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'ask', group: 'Investigate', label: 'Ask Jo exactly what she did, what she saw and where the stick is now', hint: 'Get the facts calmly.', tag: 'key',
        run: () => ({
          reveal: { ask: 'Jo plugged the stick in at 09:02, opened "Staff_Pay_Review.docm", clicked "enable content" and then closed it. The stick is still in the computer\'s port. Nobody else has touched it.' },
          text: 'The stick is still plugged in, and Jo clicked "enable content" on a document called Staff_Pay_Review.',
        }),
      },
      {
        id: 'logs', group: 'Investigate', label: 'Check the reception computer\'s activity and network connections since 09:02', hint: 'What is it doing?', tag: 'key',
        when: (s) => !!s.facts.ask,
        run: () => ({
          reveal: { logs: 'At 09:03 a new program started under Jo\'s account. At 09:04 the computer began contacting 203.0.113.77 every five minutes. It has not yet touched any other computer.' },
          text: 'Something started within a minute and is contacting an outside address. It has not spread yet.',
        }),
      },
      {
        id: 'fullscan', group: 'Investigate', label: 'Start a full scan of every computer in the office', hint: 'Look at everything?', tag: 'weak',
        run: () => ({ text: 'The scan will take hours and does not tell you what this particular stick does.' }),
      },
      // ── Contain
      {
        id: 'isolate', group: 'Contain', label: 'Disconnect the reception computer from the network, leaving it switched on', hint: 'Cut it off, keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.ask && s.flags.pcLive,
        run: () => ({ set: { pcLive: false }, disruption: 2, text: 'The computer is cut off from the network and its outside connection stops. It is left running, so that what is in memory is kept.' }),
      },
      {
        id: 'keepstick', group: 'Contain', label: 'Remove the stick with gloves, bag and label it, and note who handled it and when', hint: 'Keep it as evidence.', tag: 'key',
        when: (s) => !!s.facts.ask && !s.flags.stickKept,
        run: () => ({ set: { stickKept: true }, text: 'The stick is in a labelled bag with a note of who handled it and when. Nobody will plug it in again.' }),
      },
      {
        id: 'accounts', group: 'Contain', label: 'Sign Jo out everywhere, reset her password and require a second factor', hint: 'Her sessions may be in use.', tag: 'key',
        when: (s) => !!s.facts.logs && s.flags.accountsOpen,
        run: () => ({ set: { accountsOpen: false }, disruption: 2, text: 'Jo\'s sessions end, her password is reset and a second factor is added. Anyone using her account is locked out.' }),
      },
      {
        id: 'preserve', group: 'Contain', label: 'Capture the reception computer\'s memory and disk for the investigation before changing anything', hint: 'Keep what it shows.', tag: 'useful',
        when: (s) => !!s.facts.logs && !s.flags.pcPreserved,
        run: () => ({ set: { pcPreserved: true }, disruption: 1, text: 'The computer\'s memory and disk are captured, so what the stick did can be examined later.' }),
      },
      {
        id: 'plugin', group: 'Contain', label: 'Plug the stick into your own laptop to see what is on it', hint: 'Find out quickly?', tag: 'bad',
        run: () => ({ set: { plugged: true }, threat: 20, text: 'The stick runs its program on your laptop too, and now the thing you were meant to be investigating is on the machine you work from.' }),
      },
      {
        id: 'reimage', group: 'Contain', label: 'Wipe and reinstall the reception computer straight away', hint: 'Clean it quickly?', tag: 'bad',
        run: () => ({ set: { reimaged: true, pcLive: false }, disruption: 3, text: 'The computer is clean, and the evidence of what the stick did is gone.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Disconnect the whole office from the internet', hint: 'Be safe?', tag: 'overreact',
        run: () => ({ set: { shutdown: true, pcLive: false }, disruption: 45, text: 'Nobody can work or take calls for an hour, and the stick and the account are still untouched.' }),
      },
      {
        id: 'wait', group: 'Contain', label: 'Wait to see whether anything else happens', hint: 'Leave it?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 12, text: 'You wait. The computer stays on the network.' }),
      },
      // ── Communicate
      {
        id: 'staff', group: 'Communicate', label: 'Tell all staff: do not plug in any found device, hand it to IT, and report anything odd', hint: 'Stop the next one.', tag: 'useful',
        when: (s) => !!s.facts.ask && !s.flags.staffTold,
        run: () => ({ set: { staffTold: true }, text: 'A short, kind message goes to everyone, and the finance team hands in two more sticks found in the car park, unopened.' }),
      },
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the IT manager and the office manager', hint: 'Keep the right people informed.', tag: 'useful',
        when: (s) => !!s.facts.ask && !s.flags.mgrTold,
        run: () => ({ set: { mgrTold: true }, text: 'Both are briefed. Reception moves to a spare computer, and Jo is thanked for owning up quickly.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate risk contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.pcLive && !s.flags.accountsOpen,
        run: () => ({ text: 'You declare the immediate risk contained.' }),
      },
    ],
    contained: (s) => !s.flags.pcLive && !s.flags.accountsOpen,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.pcLive ? { label: 'The reception computer was left on the network', points: -18 } : { label: 'The computer was cut off from the network', points: 10 });
      out.push(s.flags.accountsOpen ? { label: 'Jo\'s accounts were left open', points: -14 } : { label: 'Jo\'s sessions were ended and her password reset', points: 10 });
      if (s.flags.stickKept) out.push({ label: 'The stick was bagged and logged as evidence', points: 8 });
      else out.push({ label: 'The stick was not secured', points: -8 });
      if (s.flags.pcPreserved) out.push({ label: 'The computer was captured before it was changed', points: 8 });
      if (s.flags.plugged) out.push({ label: 'You plugged the stick into your own laptop', points: -60 });
      if (s.flags.reimaged) out.push({ label: 'The computer was wiped before it was examined', points: -35 });
      if (s.flags.staffTold) out.push({ label: 'All staff warned', points: 6 });
      if (s.flags.mgrTold) out.push({ label: 'Managers briefed', points: 4 });
      if (s.flags.waited) out.push({ label: 'Waited while the computer stayed connected', points: -30 });
      if (s.flags.shutdown) out.push({ label: 'Cut the whole office off the internet', points: -35 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The computer stayed connected, or the stick ended up somewhere it could do more harm.' },
      { min: 45, name: 'Costly', blurb: 'Contained, with gaps: the account left open, the stick not kept, or evidence lost.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 140, name: 'Textbook', blurb: 'You cut the computer off but kept it running, secured the stick, ended the sessions and told everyone.' },
    ],
    debrief: [
      {
        id: 'ic-usb-never',
        question: 'Why is plugging a found USB stick into a computer, even to find the owner, such a risk?',
        options: [
          { text: 'A stick can start a program the moment it is connected, or hold a document designed to trick you, so the person plugging it in gives it access to their computer and everything they are signed in to', correct: true, explain: 'The stick is an easy way for an attacker to put something inside the building. Attackers leave them where people will pick them up.' },
          { text: 'Because USB sticks are always broken', correct: false, explain: 'They usually work fine, which is part of the trap.' },
          { text: 'Because it damages the port', correct: false, explain: 'The risk is what the stick runs, not the port.' },
          { text: 'It is only a risk on old computers', correct: false, explain: 'Modern computers are at risk too.' },
        ],
      },
      {
        id: 'ic-usb-kind',
        question: 'Jo owned up quickly. How should she be treated?',
        options: [
          { text: 'Thanked for telling you straight away, and given a simple rule to follow next time, because people who fear blame stop reporting', correct: true, explain: 'The speed of her report is what let you contain this. Blame would make the next person hide it.' },
          { text: 'Disciplined as a warning to others', correct: false, explain: 'It would stop people owning up.' },
          { text: 'Ignored, since the damage is done', correct: false, explain: 'She needs a kind, clear explanation.' },
          { text: 'Banned from using computers', correct: false, explain: 'Out of proportion.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'mailbox-rule',
    title: 'The rule nobody set',
    skill: 'identity',
    blurb: 'The chief executive\'s assistant says some emails never arrive. Find what is quietly changing the mailbox, remove it and find out what was seen.',
    role: 'IT security analyst, Contoso',
    startClock: '10:00',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Wednesday, 10:00. Priya, the chief executive\'s assistant, tells IT that invoices and messages from two suppliers have stopped appearing in her inbox for about a week, though the suppliers say they have sent them.',
      'You are the security analyst on call. Priya\'s mailbox is used by the chief executive and the finance team. Every action takes time, and the person who set this up may still be watching it.',
    ],
    initial: {
      flags: {
        ruleLive: true, // a hidden rule forwards and hides messages
        accountOpen: true, // someone else can sign in to the mailbox
        rulesChecked: false,
        signinsChecked: false,
        evidenceKept: false,
        financeWarned: false,
        dpoTold: false,
        resetAll: false,
        shutdown: false,
        deleted: false,
      },
    },
    passive: (s) => (s.flags.ruleLive ? 3 : 0) + (s.flags.accountOpen ? 3 : 0),
    events: [
      {
        id: 'payment', at: 5, expires: true,
        when: (s) => s.flags.ruleLive,
        run: () => ({ threat: 20, severity: 'high', text: 'The finance team receives a message, apparently from a supplier, with new bank details for a payment due tomorrow.' }),
      },
      {
        id: 'new-rule', at: 8, expires: true,
        when: (s) => s.flags.accountOpen && !s.flags.signinsChecked,
        run: () => ({ threat: 10, severity: 'medium', text: 'The mailbox rules change again, adding a second supplier\'s name to the list that is hidden.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'rules', group: 'Investigate', label: 'Look at every rule on Priya\'s mailbox, including ones that are hidden from her view', hint: 'What is changing her mail?', tag: 'key',
        run: () => ({
          set: { rulesChecked: true },
          reveal: { rules: 'A rule created eight days ago: "If the sender contains Fabrikam or Northline, forward to ap.records@mail-relay.example, then move to the RSS Subscriptions folder and mark as read". It does not show in her normal Rules list.' },
          text: 'A hidden rule forwards messages from two suppliers to an outside address and hides the originals.',
        }),
      },
      {
        id: 'signins', group: 'Investigate', label: 'Check Priya\'s sign-in history for the last two weeks', hint: 'Who has been in?', tag: 'key',
        run: () => ({
          set: { signinsChecked: true },
          reveal: { signins: 'Eight days ago, a sign-in from 198.51.100.77, in another country, with a password only. Priya\'s second factor was not asked for, because it was switched off for her group during a phone migration. Sign-ins from the same address continue daily.' },
          text: 'Someone else has been signing in for eight days, and Priya\'s second factor was not asked for.',
        }),
      },
      {
        id: 'sent', group: 'Investigate', label: 'Check what the attacker has seen or sent from the mailbox', hint: 'How much did they read?', tag: 'useful',
        when: (s) => !!s.facts.signins,
        run: () => ({
          reveal: { sent: 'The attacker read about 300 messages, including invoices and bank details, and sent one message to the finance team from the mailbox asking for a change of supplier bank account.' },
          text: 'The attacker read the finance mail and has already tried to change a supplier\'s bank account.',
        }),
      },
      {
        id: 'fullscan', group: 'Investigate', label: 'Run a security scan of every mailbox in the company', hint: 'Look at everything?', tag: 'weak',
        run: () => ({ text: 'The scan takes hours and tells you nothing about this mailbox\'s rule.' }),
      },
      // ── Contain
      {
        id: 'preserve', group: 'Contain', label: 'Save a copy of the rule, the sign-in history and the sent message before changing anything', hint: 'Keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.rules && !s.flags.evidenceKept,
        run: () => ({ set: { evidenceKept: true }, disruption: 1, text: 'The rule, the sign-in records and the message the attacker sent are copied and kept.' }),
      },
      {
        id: 'removerule', group: 'Contain', label: 'Remove the hidden rule and restore the hidden messages to the inbox', hint: 'Stop the forwarding.', tag: 'key',
        when: (s) => !!s.facts.rules && s.flags.ruleLive,
        run: () => ({ set: { ruleLive: false }, disruption: 2, text: 'The rule is removed, and the 40 hidden messages come back to Priya\'s inbox. Forwarding stops.' }),
      },
      {
        id: 'secure', group: 'Contain', label: 'Sign Priya out everywhere, reset her password, require a second factor and check for other forwarding or app access', hint: 'Lock the attacker out.', tag: 'key',
        when: (s) => !!s.facts.signins && s.flags.accountOpen,
        run: () => ({ set: { accountOpen: false }, disruption: 3, text: 'All sessions end, her password is reset, the second factor is required and no other forwarding or app access is found. The attacker is out.' }),
      },
      {
        id: 'delete', group: 'Contain', label: 'Delete the rule without saving anything, to get on with other work', hint: 'Quick fix?', tag: 'bad',
        run: () => ({ set: { ruleLive: false, deleted: true }, threat: 6, text: 'The rule disappears, and with it the details you needed to see where the mail went.' }),
      },
      {
        id: 'resetall', group: 'Contain', label: 'Force every one of the 1,500 staff to reset their password now', hint: 'Be safe?', tag: 'bad',
        run: () => ({ set: { resetAll: true }, disruption: 30, text: 'Everyone is signed out mid-morning and the helpdesk is swamped. Priya\'s account is still open.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Switch off email for the whole company', hint: 'Stop it dead?', tag: 'overreact',
        run: () => ({ set: { shutdown: true }, disruption: 55, text: 'Nobody can send or receive email, and the attacker\'s forwarding rule is untouched.' }),
      },
      // ── Communicate
      {
        id: 'finance', group: 'Communicate', label: 'Tell the finance team not to act on the new bank details, and to check any bank change by phone on a known number', hint: 'Stop the payment.', tag: 'key',
        when: (s) => !!s.facts.rules && !s.flags.financeWarned,
        run: () => ({ set: { financeWarned: true }, text: 'Finance holds the payment and phones the real supplier on a number from their records. The supplier confirms they sent no such message.' }),
      },
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the data protection officer that a mailbox holding personal and financial data was read by an outsider', hint: 'It may be reportable.', tag: 'useful',
        when: (s) => !!s.facts.sent && !s.flags.dpoTold,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts an assessment of what was in the messages read.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.ruleLive && !s.flags.accountOpen,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.ruleLive && !s.flags.accountOpen,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.ruleLive ? { label: 'The hidden rule was left in place', points: -15 } : { label: 'The hidden rule was removed', points: 10 });
      out.push(s.flags.accountOpen ? { label: 'The attacker was left able to sign in', points: -18 } : { label: 'The attacker was locked out', points: 12 });
      if (s.flags.evidenceKept) out.push({ label: 'The rule and sign-in records were kept before changes', points: 8 });
      else out.push({ label: 'No evidence was kept', points: -8 });
      out.push(s.flags.financeWarned ? { label: 'Finance warned before the payment was made', points: 10 } : { label: 'Finance were not warned about the bank-details request', points: -12 });
      if (s.flags.dpoTold) out.push({ label: 'DPO told', points: 6 });
      if (s.flags.deleted) out.push({ label: 'The rule was deleted without saving it', points: -30 });
      if (s.flags.resetAll) out.push({ label: 'Forced a company-wide password reset', points: -35 });
      if (s.flags.shutdown) out.push({ label: 'Switched off email for everyone', points: -15 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept the mailbox, or the payment request went through.' },
      { min: 45, name: 'Costly', blurb: 'Contained, with gaps: no evidence, finance not warned, or an overreaction.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 135, name: 'Textbook', blurb: 'You found the rule and the sign-ins, kept the evidence, locked the attacker out and stopped the payment.' },
    ],
    debrief: [
      {
        id: 'ic-rule-why',
        question: 'Why would an attacker set up a hidden rule instead of just reading the mailbox?',
        options: [
          { text: 'The rule keeps working after they sign out, copies new messages to them automatically and hides the originals so the owner does not notice', correct: true, explain: 'It gives them lasting, quiet access to what matters, such as invoices, and lets them pick the moment to strike.' },
          { text: 'Because rules are the only way to read mail', correct: false, explain: 'They could sign in and read it. The rule makes it automatic and hidden.' },
          { text: 'Because rules are faster than reading', correct: false, explain: 'Speed is not the reason.' },
          { text: 'Because the owner asked for the rule', correct: false, explain: 'Priya never saw it.' },
        ],
      },
      {
        id: 'ic-rule-fix',
        question: 'Which single change would have stopped the attacker signing in?',
        options: [
          { text: 'A second factor on the account, which had been switched off during a migration and never turned back on', correct: true, explain: 'With a second factor, the stolen password alone would not have been enough.' },
          { text: 'A longer password', correct: false, explain: 'The attacker already had the password.' },
          { text: 'A bigger mailbox', correct: false, explain: 'Irrelevant.' },
          { text: 'Faster email delivery', correct: false, explain: 'Irrelevant.' },
        ],
      },
    ],
  },
];
