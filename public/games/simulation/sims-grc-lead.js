// Governance, Risk and Compliance senior-tier simulations. Everything here is fictional: the companies, people, numbers
// and standards are invented or simplified. They are decision-based: how to set what the board will accept, how to
// report a compliance position honestly and how to hold a line when a cleaner story is on offer. They contain no
// attack technique and no legal advice.
//
// The tier's themes: a risk appetite is a decision, not a number to be discovered; "compliant" is a claim that has to be
// proved; and the truthful report is the product, whatever the audience hopes to hear.

const RATINGS = [
  { name: 'Box ticker', blurb: 'The comfortable answer won somewhere: a claim went further than the evidence, or a number was tidied. Read each stage note.' },
  { name: 'Senior analyst in training', blurb: 'Mostly honest and well argued, with gaps in how you set the question, proved a claim or held a line under pressure.' },
  { name: 'Senior GRC analyst', blurb: 'Decisions framed for the board, claims proved, and the truthful version told even when it was unwelcome.' },
  { name: 'Head of risk', blurb: 'The board could act on what you said, the evidence stood up to the auditor, and nothing had to be corrected afterwards.' },
];

export const GRC_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'risk-appetite',
    title: 'What the board will accept',
    skill: 'hardening',
    minutes: 22,
    blurb: 'The board wants "a risk appetite" by the end of the month. The chief executive wants it to say zero tolerance for data breaches. Decide what a usable appetite statement needs, and what to say about one that cannot be met.',
    brief: [
      'Contoso\'s board has asked you to produce a risk appetite statement for the year ahead. The chief executive has said: "Zero tolerance for data breaches. That is what the regulator wants to hear." The finance director has said: "Everything we have cannot cost more than the budget."',
      'You are the senior GRC analyst. You will rank what a usable statement needs, read the register and the budget, spend a limited number of hours, decide how to respond to a statement that cannot be met, and review the draft before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a usable risk appetite statement needs',
        intro: 'Tap the items in order, the most important first. Think about what lets the board make a decision and lets managers act on it.',
        items: [
          { id: 'a1', source: 'Measures', priority: 1, text: 'A level the board accepts for each type of risk, stated in measurable terms such as an amount lost or a time out of service.', why: 'Managers cannot act on "low" or "zero". They can act on a number or a time.' },
          { id: 'a2', source: 'Trade-offs', priority: 2, text: 'What the board will give up to stay inside the level, such as budget or speed.', why: 'An appetite with no cost attached is a wish.' },
          { id: 'a3', source: 'Owners', priority: 3, text: 'Who owns each risk and what they must do if it goes outside the level.', why: 'Turns the statement into action.' },
          { id: 'a4', source: 'Review', priority: 4, text: 'When the statement is reviewed, and what would trigger an earlier review.', why: 'Appetite changes with the business, and the statement should say so.' },
          { id: 'a5', source: 'Wording', priority: 5, text: 'Strong, confident wording that the regulator will like.', why: 'Wording matters least. A strong statement that cannot be met is a liability.' },
        ],
      },
      {
        id: 'register', type: 'evidence', title: 'Read the register and the budget',
        intro: 'You have the risk register, last year\'s incidents and the budget. Look for what shapes the statement. Flag only what the records support.',
        clues: {
          certain: { strength: 'strong', text: 'No organisation can reduce the chance of a data breach to zero, and Contoso had two minor breaches last year, both from lost devices.' },
          budget: { strength: 'strong', text: 'The security budget is £400,000 and the register\'s own estimate of what "zero tolerance" would need is about £1.9 million a year.' },
          gap: { strength: 'strong', text: 'The register has no figure for what the board is willing to lose on any risk, only the words "low", "medium" and "high".' },
          owners: { strength: 'strong', text: 'Eight of the fourteen top risks have no named owner.' },
          regulator: { strength: 'weak', text: 'The regulator\'s annual letter says "organisations should manage data risk".' },
        },
        artefacts: [
          {
            id: 'register', title: 'The register and last year\'s incidents',
            lines: [
              { id: 'b1', type: 'clue', clue: 'certain', text: 'Incident summary: "Two data incidents last year: a lost laptop (encrypted) and a mis-sent email (12 recipients). No regulator notification needed." Industry note: "A breach cannot be ruled out whatever is spent."', note: 'Zero cannot be promised, only managed. A statement that promises it will be broken.' },
              { id: 'b2', type: 'clue', clue: 'gap', text: 'Register, risk R3 data loss: Likelihood: medium. Impact: high. Appetite: "low". Owner: not set.', note: 'Without a figure, the board and the managers can each read "low" differently.' },
              { id: 'b3', type: 'clue', clue: 'owners', text: 'Register summary: "14 top risks. Owner named: 6. Owner not set: 8."', note: 'A risk with no owner has nobody who must act on it.' },
              { id: 'b4', type: 'herring', text: 'The register was last reviewed in a workshop with 30 people', note: 'Participation is not the same as ownership.' },
              { id: 'b5', type: 'herring', text: 'A competitor\'s annual report says it has "zero tolerance" for breaches', note: 'A competitor\'s wording is not evidence that it can be met.' },
              { id: 'b6', type: 'plain', text: 'The register uses a 5 by 5 scoring grid', note: 'Context.' },
            ],
          },
          {
            id: 'money', title: 'The budget and the regulator',
            lines: [
              { id: 'b7', type: 'clue', clue: 'budget', text: 'Budget paper: "Security and privacy budget £400,000. Estimate to meet zero tolerance across all data stores, including continuous monitoring and full encryption: £1.9m a year."', note: 'The chief executive\'s wording cannot be met with the money the board has set aside.' },
              { id: 'b8', type: 'clue', clue: 'regulator', text: 'Regulator letter: "Organisations should manage data risk and be able to show how."', note: 'It asks for management and evidence, not zero.' },
              { id: 'b9', type: 'herring', text: 'The chief executive says the regulator "will not accept anything less"', note: 'The letter does not say that.' },
              { id: 'b10', type: 'herring', text: 'The previous head of risk resigned last year', note: 'Unrelated to the numbers.' },
              { id: 'b11', type: 'plain', text: 'Cyber insurance premiums rose by 18% at renewal', note: 'Context for the cost of risk.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the board paper is due',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Measures', ideal: 4, text: 'Turn the register\'s "low, medium, high" into amounts and times the board can actually choose between.', why: 'The core of a usable statement.' },
          { id: 'e2', source: 'Options', ideal: 3, text: 'Prepare three options at different costs, showing what each level of appetite would cost and what risk would remain.', why: 'A decision for the board, not a number to discover.' },
          { id: 'e3', source: 'Owners', ideal: 2, text: 'Name owners for the eight risks with none, and agree what each must do if it goes outside the level.', why: 'Without owners the statement does nothing.' },
          { id: 'e4', source: 'Polish', ideal: 1, text: 'Polish the wording so it reads confidently.', why: 'Matters least, and is quick.' },
        ],
      },
      {
        id: 'zero', type: 'decision', title: 'Decide: the "zero tolerance" wording',
        intro: 'The chief executive says: "Put zero tolerance in the statement. It is what the regulator wants, and nobody will check." The board meets in a week.',
        prompt: 'What do you do?',
        options: [
          { id: 'options', quality: 3, text: 'Explain that zero cannot be met or shown, and give the board three costed options with the risk that remains in each, recommending a measured appetite with named owners, and let them choose', set: { options: true }, consequence: 'The chief executive is uncomfortable and the board is engaged. It chooses the middle option, and the statement can be defended to the regulator and the auditors.' },
          { id: 'soften', quality: 2, text: 'Use "very low tolerance" instead of zero, with no figures', set: { soften: true }, consequence: 'The wording is more honest, and still gives managers nothing to act on. The board approves it without discussion.' },
          { id: 'refuse', quality: 1, text: 'Refuse to write a statement until the board agrees a budget', set: { refuse: true }, consequence: 'You are right that the decision is the board\'s. The paper is late and the chief executive escalates.' },
          { id: 'zero', quality: 0, text: 'Write zero tolerance as asked', set: { zero: true }, consequence: 'The statement is approved. Six months later an auditor asks how zero tolerance is evidenced, and a minor breach shows that it was never achievable. The board is embarrassed.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement for the board',
        intro: 'A colleague has drafted parts of the paper.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'Contoso accepts a loss of up to £250,000 from a single data incident, and will invest to keep the chance of a larger loss below one in twenty a year.', why: 'A measurable, defensible appetite.' },
          { id: 'v2', sound: false, text: 'Contoso has zero tolerance for data breaches.', why: 'Cannot be met or shown, and the register itself says so.' },
          { id: 'v3', sound: true, text: 'Every top risk will have a named owner, who must report to the board if it goes outside the level.', why: 'Turns the statement into action.' },
          { id: 'v4', sound: false, text: 'The regulator requires zero tolerance.', why: 'The regulator\'s letter asks for management and evidence.' },
          { id: 'v5', sound: false, text: 'The current budget is enough to meet every risk target.', why: 'The register\'s own estimate for zero is £1.9m against £400,000.' },
          { id: 'v6', sound: true, text: 'The statement will be reviewed every year and after any serious incident.', why: 'Appetite changes with the business.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the cover note for the board',
        intro: 'Say what you are asking the board to decide, and what each choice means.',
        statements: [
          { id: 'r1', correct: true, text: 'A risk appetite is a decision the board makes, and the paper sets out three options with their cost and the risk that remains in each.', why: 'Frames it as the board\'s choice.' },
          { id: 'r2', correct: true, text: 'Zero tolerance for data breaches cannot be promised or shown, and the cost of trying (about £1.9m a year) is far above the current budget.', why: 'Shown by the budget paper.' },
          { id: 'r3', correct: true, text: 'Eight of the fourteen top risks have no named owner, and a statement without owners will not change what anyone does.', why: 'Shown by the register summary.' },
          { id: 'r4', correct: true, text: 'The regulator\'s letter asks organisations to manage data risk and show how, not to promise zero.', why: 'Shown by the letter.' },
          { id: 'r5', correct: false, text: 'Zero tolerance is what the regulator requires.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The current budget meets every target.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'A confident wording will protect the company if there is a breach.', why: 'Unsupported: it will make a breach harder to explain.' },
          { id: 'r8', when: 'options', correct: true, text: 'We told the board zero could not be met and gave three costed options, and it chose the middle one.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'soften', correct: true, text: 'We used "very low tolerance" with no figures, which was more honest and still gave managers nothing to act on.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused to write the statement until the board agreed a budget, which was right in principle and late.', why: 'An honest account.' },
          { id: 'r11', when: 'zero', correct: true, text: 'We wrote zero tolerance as asked, and later could not show how it was met.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Ask the board to choose between three costed options and to approve measurable levels for each type of risk.', why: 'A decision the board can make.' },
          { id: 'a2', correct: true, text: 'Name an owner for each of the eight unowned risks before the statement is published.', why: 'Makes it operational.' },
          { id: 'a3', correct: true, text: 'Review the statement every year and after any serious incident.', why: 'Keeps it current.' },
          { id: 'a4', correct: false, text: 'Publish "zero tolerance" to reassure the regulator.', why: 'Unsupported and unsafe.' },
          { id: 'a5', correct: false, text: 'Ask the chief executive to sign a statement that the budget is sufficient.', why: 'Unsupported.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'gr-senior-exam',
    title: 'Promotion exam: Senior GRC Analyst',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A certification audit in three weeks, a board that wants to hear "we are compliant", and a gap you have just found. Decide what to say and what to prove. Silver or better to pass.',
    brief: [
      'Contoso is three weeks from a certification audit against an information security standard. The board has asked you to confirm that the company is "compliant". You have found that two of the standard\'s requirements are not operating: user access reviews have not been done for eight months, and supplier security checks exist for only nine of forty suppliers.',
      'You will rank what to settle, spend a limited budget of hours, read the evidence, decide what to say to the board, and review the draft statement.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first at the top. Think about what the auditor will find and what the board needs to know.',
        items: [
          { id: 'x1', source: 'Truth', priority: 1, text: 'The board\'s question: "are we compliant?" The honest answer, with the two gaps, before it hears anything else.', why: 'The board is about to rely on it, and the audit will test it.' },
          { id: 'x2', source: 'Access reviews', priority: 2, text: 'The user access reviews not done for eight months.', why: 'A requirement that has not operated, with a risk that leavers keep access.' },
          { id: 'x3', source: 'Suppliers', priority: 3, text: 'Security checks for only nine of forty suppliers.', why: 'A larger project, and a real gap.' },
          { id: 'x4', source: 'Evidence', priority: 4, text: 'Gathering the evidence for the requirements that are met.', why: 'Needed, and only worth doing for what is true.' },
          { id: 'x5', source: 'Presentation', priority: 5, text: 'How the evidence is laid out for the auditor.', why: 'Useful, and last.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the board meeting',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Do the review', ideal: 3, text: 'Run the access review now, properly, and record when it was actually done.', why: 'Starts closing the gap, with honest dates.' },
          { id: 'e2', source: 'Plan', ideal: 3, text: 'Build a plan for the supplier checks, ranked by risk, with dates and owners.', why: 'A credible answer to the gap.' },
          { id: 'e3', source: 'Tell', ideal: 3, text: 'Write the honest position for the board, with the gaps, the plan and the effect on the audit.', why: 'What the board needs.' },
          { id: 'e4', source: 'Tidy', ideal: 1, text: 'Tidy the folder structure for the audit.', why: 'Quick, and least important.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the evidence',
        intro: 'You have the standard\'s requirements, the access review records and the supplier list. Look for what the auditor will find. Flag only what the records support.',
        clues: {
          review: { strength: 'strong', text: 'The access review register shows the last completed review on 12 February, and nothing since.' },
          leavers: { strength: 'strong', text: 'Fourteen people who left in the last eight months still have active accounts.' },
          suppliers: { strength: 'strong', text: 'The supplier register lists forty suppliers with access to company data; nine have a completed security check.' },
          policy: { strength: 'strong', text: 'The company\'s own policy says access reviews are quarterly and supplier checks are done before contract signature.' },
          ready: { strength: 'weak', text: 'The certification body has said it will send an auditor on the 18th.' },
        },
        artefacts: [
          {
            id: 'access', title: 'Access reviews and leavers',
            lines: [
              { id: 'f1', type: 'clue', clue: 'review', text: 'Access review register: "Q1 completed 12 February. Q2 due 12 May: not done. Q3 due 12 August: not done. Q4 due 12 November: not done."', note: 'The control has not operated for three quarters. It must be reported as it is.' },
              { id: 'f2', type: 'clue', clue: 'leavers', text: 'HR leavers list against the directory: "14 leavers since February with enabled accounts. 3 have signed in since leaving (two to read email, one to a file share)."', note: 'The gap has real consequences: leavers still have access, and three have used it.' },
              { id: 'f3', type: 'clue', clue: 'policy', text: 'Access control policy v4.2: "Reviews are completed quarterly. Supplier security checks are completed before a contract is signed."', note: 'Contoso\'s own rule is stricter than it practises. The auditor will test it against what is written.' },
              { id: 'f4', type: 'herring', text: 'The access review template was redesigned last year and won an internal award', note: 'A good template does not prove a review took place.' },
              { id: 'f5', type: 'herring', text: 'Four of the leavers were contractors', note: 'The accounts still need removing.' },
              { id: 'f6', type: 'plain', text: 'The directory has 1,350 accounts', note: 'Scale.' },
            ],
          },
          {
            id: 'suppliers', title: 'Suppliers and the audit date',
            lines: [
              { id: 'f7', type: 'clue', clue: 'suppliers', text: 'Supplier register: "40 suppliers with access to company data. Security check complete: 9. In progress: 6. Not started: 25."', note: 'Most suppliers have not been checked. A plan with dates is a response, and it is not a fix.' },
              { id: 'f8', type: 'clue', clue: 'ready', text: 'Certification body: "Audit confirmed for the 18th. The auditor will test a sample of controls."', note: 'A date, and a sample. Gaps will be found.' },
              { id: 'f9', type: 'herring', text: 'The sales director says a "compliant" badge is needed for the largest tender', note: 'Commercial pressure does not change the facts.' },
              { id: 'f10', type: 'herring', text: 'A competitor announced its certification last month', note: 'Not evidence about Contoso.' },
              { id: 'f11', type: 'plain', text: 'The company has never failed a certification audit', note: 'History is not a guarantee.' },
            ],
          },
        ],
      },
      {
        id: 'board', type: 'decision', title: 'Decide: what to tell the board',
        intro: 'The sales director says: "Tell the board we are compliant. We will fix the gaps before anyone checks." The chief executive adds: "Can you say that?"',
        prompt: 'What do you say?',
        options: [
          { id: 'honest', quality: 3, text: 'Tell the board the company is not yet compliant, show the two requirements that have not operated, say what has already been done (the review is running, the leavers are being closed) and give a dated plan, and recommend telling the certification body about the gaps rather than hiding them', set: { honest: true }, consequence: 'The board is unhappy and informed. The auditor appreciates the early disclosure, finds a minor non-conformity on suppliers and certifies conditionally. The tender is won on the strength of a credible plan.' },
          { id: 'partial', quality: 2, text: 'Tell the board the company is "largely compliant" and mention the gaps in an appendix', set: { partial: true }, consequence: 'The board reads the headline and not the appendix. The audit finds the gaps, and the board feels misled.' },
          { id: 'delay', quality: 1, text: 'Ask for the audit to be postponed without saying why', set: { delay: true }, consequence: 'The audit is delayed by two months, the tender is lost and nobody knows the real reason.' },
          { id: 'compliant', quality: 0, text: 'Tell the board the company is compliant, and hope to fix the gaps before the audit', set: { compliant: true }, consequence: 'The auditor finds both gaps within the first morning and records a statement to the board that was not true. The certificate is refused, and the board is told.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft board statement',
        intro: 'A colleague has drafted the statement.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'b1', sound: true, text: 'The user access review has not been completed since 12 February, against a policy of quarterly reviews.', why: 'Shown by the register.' },
          { id: 'b2', sound: false, text: 'The company is compliant with the standard.', why: 'Two requirements are not operating.' },
          { id: 'b3', sound: true, text: 'Fourteen leavers still have enabled accounts, and three have signed in since leaving; these are being closed and checked.', why: 'Shown by the HR comparison, and stated with the action.' },
          { id: 'b4', sound: false, text: 'We can finish all forty supplier checks before the audit.', why: 'Twenty-five have not been started, and three weeks is not enough.' },
          { id: 'b5', sound: false, text: 'The auditor is unlikely to find the gaps because they test only a sample.', why: 'Unsupported, and a poor basis for a board statement.' },
          { id: 'b6', sound: true, text: 'We recommend telling the certification body about the gaps and our plan.', why: 'Honest, and usually treated better than a finding made by the auditor.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the compliance position for the board',
        intro: 'Say where the company really stands, what you are doing about it and what it means for the audit.',
        statements: [
          { id: 'r1', correct: true, text: 'The company is not yet compliant: user access reviews have not operated since 12 February and only nine of forty suppliers have a completed security check.', why: 'Shown by the records.' },
          { id: 'r2', correct: true, text: 'Fourteen leavers have enabled accounts and three have used them since leaving, which makes the review gap a real risk and not a paperwork one.', why: 'Shown by the HR comparison.' },
          { id: 'r3', correct: true, text: 'The company\'s own policy requires quarterly reviews and supplier checks before contract, so the auditor will test against it.', why: 'Shown by the policy.' },
          { id: 'r4', correct: true, text: 'We cannot complete all supplier checks in three weeks, and are planning them in order of risk.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The company is compliant.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The auditor will not notice the gaps.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The review dates can be recorded as their original due dates.', why: 'Unsupported: it misstates when the work was done.' },
          { id: 'r8', when: 'honest', correct: true, text: 'We told the board and the certification body the truth with a dated plan, and certification was granted conditionally.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'partial', correct: true, text: 'We described the company as "largely compliant" and put the gaps in an appendix, and the board felt misled when the audit found them.', why: 'An honest account.' },
          { id: 'r10', when: 'delay', correct: true, text: 'We postponed the audit without saying why, which lost the tender and hid the real reason.', why: 'An honest account.' },
          { id: 'r11', when: 'compliant', correct: true, text: 'We told the board the company was compliant, and the auditor found both gaps in the first morning.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Run the access review now, record the real date, and close and check the leavers\' accounts.', why: 'Starts closing the gap honestly.' },
          { id: 'a2', correct: true, text: 'Build a dated, owned supplier-check plan ranked by risk, and tell the certification body early.', why: 'A credible response to the gap.' },
          { id: 'a3', correct: true, text: 'Add a recurring reminder and a named owner for access reviews, and report review status to the board each quarter.', why: 'Stops it recurring.' },
          { id: 'a4', correct: false, text: 'Date the missing reviews as if they had been done on time.', why: 'Misstates the record.' },
          { id: 'a5', correct: false, text: 'Tell the board the company is compliant.', why: 'Unsupported.' },
        ],
      },
    ],
  },
];
