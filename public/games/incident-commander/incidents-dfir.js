// Incident Response and Forensics Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. IP addresses come from the reserved documentation ranges.

export const DFIR = [
  {
    id: 'leaver-copy',
    title: 'The leaver and the customer list',
    skill: 'hardening',
    blurb: 'A sales manager resigned and, on his last day, copied the customer list. HR wants him confronted. Preserve what you need, work with Legal and HR, and find out what actually happened before anyone is accused.',
    role: 'Incident responder, Contoso',
    startClock: '09:30',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Monday, 09:30. Rhys, a sales manager, resigned on Friday to join a competitor. The CRM audit shows he exported 14,200 customer contacts at 17:41 on Friday. His laptop is in IT\'s cupboard, and his accounts are still active until HR finishes the leaving process on Wednesday.',
      'You are the incident responder. HR would like to phone Rhys today and ask him to return anything he took. Legal has asked that nothing is changed. Every action takes time, and evidence you do not preserve is gone.',
    ],
    initial: {
      flags: {
        accountsOpen: true, // his accounts are still active
        laptopRisk: true, // the laptop could be switched on, reissued or wiped
        legalIn: false,
        imaged: false,
        logsHeld: false,
        exportChecked: false,
        accusedEarly: false,
        reissued: false,
        monitoring: false,
        dpoTold: false,
        mgrTold: false,
        shutdown: false,
        waited: false,
      },
    },
    passive: (s) => (s.flags.accountsOpen ? 3 : 0) + (s.flags.laptopRisk ? 2 : 0),
    events: [
      {
        id: 'reissue', at: 4, expires: true,
        when: (s) => s.flags.laptopRisk && !s.flags.imaged,
        run: () => ({ set: { reissued: true }, threat: 18, severity: 'high', text: 'IT, following its usual routine, takes the laptop from the cupboard to prepare it for reissue. It is switched on and the disk begins to be reset.' }),
      },
      {
        id: 'more-copy', at: 7, expires: true,
        when: (s) => s.flags.accountsOpen && !s.flags.monitoring,
        run: () => ({ threat: 12, severity: 'medium', text: 'Rhys\'s account signs in from home and opens the CRM again.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'export', group: 'Investigate', label: 'Check the CRM and email audit logs for the export and what happened to the file', hint: 'What do the logs show?', tag: 'key',
        run: () => ({
          set: { exportChecked: true },
          reveal: { export: 'The export file was created at 17:41 on Friday. At 17:55 an email was sent from Rhys\'s work account to a personal address with a compressed attachment of the same size. The web gateway shows no upload to a cloud service.' },
          text: 'The export was emailed to a personal address 14 minutes later.',
        }),
      },
      {
        id: 'access', group: 'Investigate', label: 'Check what else his accounts have accessed in the last 30 days', hint: 'Is this the only thing?', tag: 'useful',
        when: (s) => !!s.facts.export,
        run: () => ({
          reveal: { access: 'Rhys opened pricing and pipeline folders on four occasions in the last month, which fits his role. He downloaded nothing else in bulk.' },
          text: 'The only unusual action is the customer export and the email that followed it.',
        }),
      },
      {
        id: 'wait', group: 'Investigate', label: 'Wait for HR to talk to him and see what he says', hint: 'Let people speak first?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 10, text: 'You wait. The accounts stay open and the laptop remains unprotected.' }),
      },
      // ── Contain
      {
        id: 'legal', group: 'Contain', label: 'Call Legal and the data protection officer, and agree who is authorised to examine the devices and accounts', hint: 'Get the authority right.', tag: 'key',
        when: (s) => !s.flags.legalIn,
        run: () => ({ set: { legalIn: true }, text: 'Legal and the DPO agree a written authority for the examination and for a legal hold on the relevant records.' }),
      },
      {
        id: 'image', group: 'Contain', label: 'Move the laptop to the evidence store, unpowered, and make a verified copy of the disk, logging who has handled it', hint: 'Keep it usable as evidence.', tag: 'key',
        when: (s) => s.flags.legalIn && !s.flags.imaged,
        run: () => ({ set: { imaged: true, laptopRisk: false }, disruption: 2, text: 'The laptop is in the locked store and a verified copy is made. The custody log has an entry for every hand it has been in.' }),
      },
      {
        id: 'hold', group: 'Contain', label: 'Place a legal hold on his mailbox, CRM audit records and web gateway logs so nothing is deleted', hint: 'Keep the logs.', tag: 'key',
        when: (s) => s.flags.legalIn && !s.flags.logsHeld,
        run: () => ({ set: { logsHeld: true }, disruption: 1, text: 'The hold is in place. The relevant logs and his mailbox cannot be deleted by routine clear-outs.' }),
      },
      {
        id: 'monitor', group: 'Contain', label: 'Restrict his accounts to read-only and watch them, with HR\'s agreement, until the leaving date', hint: 'Limit further harm.', tag: 'key',
        when: (s) => s.flags.legalIn && s.flags.accountsOpen,
        run: () => ({ set: { accountsOpen: false, monitoring: true }, disruption: 2, text: 'His accounts are read-only and watched. HR and Legal are comfortable, and Rhys can still work normally until Wednesday.' }),
      },
      {
        id: 'confront', group: 'Contain', label: 'Let HR phone Rhys now, accuse him of taking the list and demand it back', hint: 'Get it back fast?', tag: 'bad',
        run: () => ({ set: { accusedEarly: true }, threat: 15, text: 'Rhys denies it, deletes the email from his personal account within the hour and hires a solicitor.' }),
      },
      {
        id: 'reissue-now', group: 'Contain', label: 'Let IT reissue the laptop as normal to save time', hint: 'Business as usual?', tag: 'bad',
        run: () => ({ set: { reissued: true }, threat: 15, text: 'The laptop is wiped and reissued. Nothing on it can now be examined.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Disable all of Rhys\'s accounts and escort him out of the building today', hint: 'Remove him immediately?', tag: 'overreact',
        run: () => ({ set: { shutdown: true, accountsOpen: false }, disruption: 40, text: 'The accounts are disabled and the escort causes a scene. His clients are left without a contact, and his solicitor describes it as a dismissal.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the head of sales and the HR director on what is known, what is not, and what must not be done', hint: 'Keep the right people informed.', tag: 'useful',
        when: (s) => !!s.facts.export,
        run: () => ({ set: { mgrTold: true }, text: 'The head of sales and the HR director agree to say nothing to Rhys until Legal has advised.' }),
      },
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the data protection officer that 14,200 customer contacts were emailed to a personal address', hint: 'This may be a reportable breach.', tag: 'key',
        when: (s) => !!s.facts.export && !s.flags.dpoTold,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts an assessment of the data in the export and the 72-hour decision.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Hand the case to Legal and HR with the evidence secured', hint: 'Only when evidence is safe and the risk is limited.', tag: 'key', ends: true,
        when: (s) => s.flags.imaged && s.flags.logsHeld && !s.flags.accountsOpen,
        run: () => ({ text: 'You hand over the secured evidence and findings to Legal and HR.' }),
      },
    ],
    contained: (s) => s.flags.imaged && s.flags.logsHeld && !s.flags.accountsOpen,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.imaged ? { label: 'The laptop was imaged and its custody recorded', points: 12 } : { label: 'The laptop was not preserved', points: -18 });
      out.push(s.flags.logsHeld ? { label: 'The logs and mailbox were put on legal hold', points: 10 } : { label: 'The logs were not protected', points: -10 });
      out.push(s.flags.legalIn ? { label: 'Legal and the DPO authorised the work', points: 10 } : { label: 'Legal were not involved', points: -14 });
      if (s.flags.exportChecked) out.push({ label: 'You established what happened to the exported file', points: 8 });
      else out.push({ label: 'You did not check what happened to the export', points: -10 });
      if (s.flags.dpoTold) out.push({ label: 'DPO told that customer contacts were emailed away', points: 8 });
      else if (s.flags.exportChecked) out.push({ label: 'DPO not told about the data in the email', points: -16 });
      if (s.flags.monitoring) out.push({ label: 'His accounts were limited and watched without alarming him', points: 6 });
      if (s.flags.reissued) out.push({ label: 'The laptop was reissued before it was preserved', points: -20 });
      if (s.flags.accusedEarly) out.push({ label: 'He was accused before the evidence was secured', points: -40 });
      if (s.flags.waited) out.push({ label: 'Waited for HR to speak to him first', points: -14 });
      if (s.flags.mgrTold) out.push({ label: 'Sales and HR leadership briefed', points: 4 });
      if (s.flags.shutdown) out.push({ label: 'Removed him and his access at once, causing a dispute', points: -35 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Case spoiled', blurb: 'The evidence was lost, or he was accused before it was safe.' },
      { min: 55, name: 'Costly', blurb: 'Evidence kept, with gaps: no legal authority, no check on the export, or the DPO not told.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 145, name: 'Textbook', blurb: 'You got authority, preserved the laptop and logs, found what happened to the file and told the DPO, before anyone spoke to him.' },
    ],
    debrief: [
      {
        id: 'ic-leaver-order',
        question: 'Why preserve the laptop and logs before HR talks to Rhys?',
        options: [
          { text: 'Once he knows he is suspected, evidence can be deleted or changed, and what you secured first is what you can rely on', correct: true, explain: 'The first conversation changes what is possible. Evidence taken calmly and in order is far stronger than evidence rescued afterwards.' },
          { text: 'Because HR is not allowed to talk to staff', correct: false, explain: 'HR can and should talk to him, at the right time and with Legal\'s advice.' },
          { text: 'Because evidence expires on Monday', correct: false, explain: 'It does not expire. Delay simply risks loss.' },
          { text: 'It does not matter what order you do things in', correct: false, explain: 'It matters a great deal: he deleted the email within the hour in the early-accusation case.' },
        ],
      },
      {
        id: 'ic-leaver-fair',
        question: 'Why not simply decide that he is guilty because he emailed the list to himself?',
        options: [
          { text: 'The logs show what was sent, not why, and he may have an explanation; a fair investigation records the facts first and lets Legal and HR decide what they mean', correct: true, explain: 'Facts first, conclusions later. A fair process protects him and the company, and makes the evidence more useful.' },
          { text: 'Because emailing a file to yourself is never a problem', correct: false, explain: 'It can be a serious matter, and the export is a clear reason to investigate.' },
          { text: 'Because guilt is decided by the IT department', correct: false, explain: 'It is not. Legal and HR decide what to do with the facts.' },
          { text: 'Because the data protection officer says so', correct: false, explain: 'The reason is fairness and good practice, not a single rule.' },
        ],
      },
    ],
  },
];
