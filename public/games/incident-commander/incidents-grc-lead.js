// Governance, Risk and Compliance senior-tier Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional. The incident is about a data breach at a supplier and the duties it triggers for the
// customer. It is simplified and is not legal advice. It contains no technique.

export const GRC_LEAD = [
  {
    id: 'supplier-late-friday',
    title: 'The supplier\'s late-Friday email',
    skill: 'hardening',
    blurb: 'At 17:10 on Friday a supplier tells you your customers\' data was in a breach on Tuesday. The clock has started. Find the facts, record when you became aware, assess the risk to people and decide what must be told, and to whom.',
    role: 'Senior GRC analyst, Contoso',
    startClock: '17:10',
    minutesPerUnit: 60,
    maxTime: 12,
    brief: [
      'Friday, 17:10. A supplier that hosts Contoso\'s customer account database emails: "On Tuesday an unauthorised party accessed part of our systems. Your customer records may have been affected. We are still investigating."',
      'You are the senior GRC analyst. The data protection officer is on a train. The supplier gives no details. Under the data protection rules Contoso must tell the regulator within 72 hours of becoming aware of a breach that is likely to put people at risk. Every action takes an hour.',
    ],
    initial: {
      flags: {
        logged: false,
        factsKnown: false,
        dpoTold: false,
        assessed: false,
        notified: false,
        customersTold: false,
        supplierSecured: false,
        waited: false,
        denied: false,
        blamed: false,
        terminated: false,
      },
    },
    passive: (s) => (s.flags.logged ? 0 : 2) + (s.flags.notified || s.flags.assessed ? 0 : 1),
    events: [
      {
        id: 'press', at: 6, expires: true,
        when: (s) => !s.flags.customersTold && s.flags.factsKnown && !s.flags.notified,
        run: () => ({ threat: 15, severity: 'medium', text: 'A customer posts online that they have received a phishing email using details only the company holds. Contoso has said nothing yet.' }),
      },
      {
        id: 'deadline', at: 9, expires: true,
        when: (s) => !s.flags.notified,
        run: () => ({ threat: 25, severity: 'high', text: 'Monday afternoon: the 72-hour period is nearly over and the regulator has not been told.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Record and understand
      {
        id: 'log', group: 'Record', label: 'Open a breach log and record the time the supplier\'s email arrived as the time Contoso became aware', hint: 'Start the clock honestly.', tag: 'key',
        run: () => ({ set: { logged: true }, text: 'The log records that Contoso became aware at 17:10 on Friday, so the 72-hour period ends at 17:10 on Monday. Every decision from here is recorded with its reason.' }),
      },
      {
        id: 'facts', group: 'Record', label: 'Call the supplier\'s security lead and ask what was accessed, when, whether the data was encrypted, and whether the access is closed', hint: 'You need facts, not a promise.', tag: 'key',
        run: () => ({
          set: { factsKnown: true },
          reveal: { facts: 'The supplier says: customer names, email addresses, dates of birth and home addresses for about 30,000 customers were accessible and may have been copied. Passwords and payment details are separate and not affected. The data was not encrypted at rest in that system. The access has been closed since Wednesday.' },
          text: 'The supplier confirms identity data for about 30,000 customers, unencrypted, accessed on Tuesday and closed on Wednesday.',
        }),
      },
      // ── Assess
      {
        id: 'dpo', group: 'Assess', label: 'Reach the data protection officer by phone, share the facts and agree who decides what', hint: 'The right people, now.', tag: 'key',
        when: (s) => !!s.facts.facts && !s.flags.dpoTold,
        run: () => ({ set: { dpoTold: true }, text: 'The data protection officer takes the call from the train. She agrees to lead the assessment and asks for everything to be written down.' }),
      },
      {
        id: 'assess', group: 'Assess', label: 'Assess the risk to the people affected: what could be done with names, addresses and birth dates, and how likely harm is', hint: 'Likely to put people at risk?', tag: 'key',
        when: (s) => !!s.flags.dpoTold && !s.flags.assessed,
        run: () => ({ set: { assessed: true }, reveal: { assess: 'With names, addresses, birth dates and emails together, the risk of impersonation, targeted phishing and identity fraud is real. The data was not encrypted and may have been copied. The assessment: likely to result in a risk to people. The regulator must be told, and the customers probably must be told too.' }, text: 'The assessment concludes that the breach is likely to put people at risk, and that the regulator must be told.' }),
      },
      // ── Act
      {
        id: 'notify', group: 'Act', label: 'Notify the regulator now with what is known and what is not, and say you will update it as the supplier reports', hint: 'Do not wait for a perfect report.', tag: 'key',
        when: (s) => !!s.flags.assessed && !s.flags.notified,
        run: () => ({ set: { notified: true }, text: 'The notification goes in on Saturday morning, well inside the 72 hours. It says plainly what is known (30,000 customers, identity data, unencrypted, accessed Tuesday), what is not (whether it was copied) and when the next update will come.' }),
      },
      {
        id: 'customers', group: 'Act', label: 'Tell the affected customers plainly what was exposed, what they should watch for and who to contact', hint: 'People at risk need to know.', tag: 'useful',
        when: (s) => !!s.flags.assessed && !s.flags.customersTold,
        run: () => ({ set: { customersTold: true }, text: 'A clear message goes out on Saturday afternoon, with advice on phishing and a contact line. Customer calls rise and are handled calmly.' }),
      },
      {
        id: 'secure', group: 'Act', label: 'Ask the supplier for written confirmation that the access is closed, the data is now encrypted and what has been done to stop it recurring', hint: 'Close it properly.', tag: 'useful',
        when: (s) => !!s.facts.facts && !s.flags.supplierSecured,
        run: () => ({ set: { supplierSecured: true }, text: 'The supplier confirms in writing that the access route is closed, the database is now encrypted and a review is under way.' }),
      },
      // ── Poor choices
      {
        id: 'wait', group: 'Act', label: 'Wait for the supplier\'s full investigation report before doing anything', hint: 'Be sure first?', tag: 'bad',
        run: () => ({ set: { waited: true }, threat: 10, text: 'You wait. The 72 hours run down, and the supplier says the full report is two weeks away.' }),
      },
      {
        id: 'deny', group: 'Act', label: 'Tell customers who ask that there is no evidence their data was taken', hint: 'Keep calm?', tag: 'bad',
        run: () => ({ set: { denied: true }, threat: 15, text: 'The statement is true only in the narrowest sense. A day later the supplier confirms the data may have been copied, and the company is seen to have misled customers.' }),
      },
      {
        id: 'blame', group: 'Act', label: 'Publish a statement naming the supplier as responsible', hint: 'Own the story?', tag: 'bad',
        run: () => ({ set: { blamed: true }, threat: 10, text: 'The statement is seen as shifting the blame. The company remains responsible to its customers for their data, and the supplier stops cooperating.' }),
      },
      {
        id: 'terminate', group: 'Act', label: 'Terminate the supplier\'s contract tonight and move the database', hint: 'Cut it off?', tag: 'overreact',
        run: () => ({ set: { terminated: true }, disruption: 60, text: 'Customer accounts go offline for two days while the database is moved in a hurry, and the migration brings new errors.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the immediate duties met', hint: 'Only when logged, assessed and notified.', tag: 'key', ends: true,
        when: (s) => s.flags.logged && s.flags.assessed && s.flags.notified,
        run: () => ({ text: 'You declare the immediate duties met and hand over the log to the data protection officer for the follow-up.' }),
      },
    ],
    contained: (s) => s.flags.logged && s.flags.assessed && s.flags.notified,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.logged ? { label: 'The time of awareness was recorded and every decision logged', points: 10 } : { label: 'No breach log was started', points: -14 });
      out.push(s.flags.factsKnown ? { label: 'You got the facts from the supplier', points: 8 } : { label: 'You did not establish what was exposed', points: -12 });
      out.push(s.flags.dpoTold ? { label: 'The data protection officer was brought in', points: 8 } : { label: 'The data protection officer was not told', points: -12 });
      out.push(s.flags.assessed ? { label: 'The risk to people was assessed', points: 8 } : { label: 'The risk to people was not assessed', points: -12 });
      out.push(s.flags.notified ? { label: 'The regulator was told in time, with what was known and not known', points: 12 } : { label: 'The regulator was not told in time', points: -30 });
      if (s.flags.customersTold) out.push({ label: 'Affected customers were told plainly', points: 8 });
      if (s.flags.supplierSecured) out.push({ label: 'The supplier confirmed in writing that the exposure was closed', points: 6 });
      if (s.flags.waited) out.push({ label: 'You waited for the full report while the clock ran', points: -20 });
      if (s.flags.denied) out.push({ label: 'Customers were told there was no evidence their data was taken', points: -30 });
      if (s.flags.blamed) out.push({ label: 'The supplier was named in public as responsible', points: -15 });
      if (s.flags.terminated) out.push({ label: 'The supplier was terminated overnight', points: -30 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The deadline was missed, or customers were misled, or an overreaction did more harm than the breach.' },
      { min: 50, name: 'Costly', blurb: 'The duties were met, with gaps: the log, the assessment, telling customers, or a poor choice along the way.' },
      { min: 85, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 162, name: 'Textbook', blurb: 'You started the log at the moment you became aware, got the facts, brought in the right person, assessed the risk to people, told the regulator in time with an honest account and told customers plainly.' },
    ],
    debrief: [
      {
        id: 'ic-gr-aware',
        question: 'Why was the clock for telling the regulator treated as starting at 17:10 on Friday, when the breach itself happened on Tuesday?',
        options: [
          { text: 'The duty runs from when the company becomes aware of the breach, and the supplier\'s email is the moment it learned of it; recording that time honestly is the first step', correct: true, explain: 'It is awareness that starts the period, and the record of that moment is what you will later be asked to show.' },
          { text: 'Because the breach was on Tuesday, so the period had already expired', correct: false, explain: 'It runs from awareness, not from the date of the breach.' },
          { text: 'The clock starts when the supplier finishes its investigation', correct: false, explain: 'Waiting for a perfect report is the commonest way to miss the deadline.' },
          { text: 'The clock only starts if customers complain', correct: false, explain: 'It starts when the company knows, whether or not anyone has complained.' },
        ],
      },
      {
        id: 'ic-gr-deny',
        question: 'Why was it wrong to tell customers there was "no evidence" their data was taken?',
        options: [
          { text: 'The company had been told the data may have been copied, so a statement that sounds reassuring but is true only in a narrow sense misleads people and damages trust when the facts emerge', correct: true, explain: 'Say what is known, what is not and what people should do. Reassurance that is not backed by the facts is the worst thing to offer.' },
          { text: 'Because customers do not read statements', correct: false, explain: 'They do, and they will act on what you say.' },
          { text: 'Because statements to customers are not allowed', correct: false, explain: 'They are allowed and, here, expected.' },
          { text: 'Because the supplier should have made the statement', correct: false, explain: 'Contoso owes its customers the truth about their data.' },
        ],
      },
    ],
  },
];
