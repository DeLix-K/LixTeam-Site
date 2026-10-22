// Governance, Risk and Compliance lead-tier simulations. Everything here is fictional: the companies, people, numbers and
// standards are invented or simplified. They are decision-based: how to give a board a risk picture it can use, and how to
// hold a line of integrity when the chief executive would like a delay. They contain no attack technique and no legal advice.
//
// The tier's themes: a risk number is only as good as what it hides, the board is owed the truth earlier than is
// comfortable, and independence is the thing that makes a head of risk worth having.

const RATINGS = [
  { name: 'Reporter of comfort', blurb: 'The comfortable version won: a number hid more than it showed, or a disclosure waited until it suited someone. Read each stage note.' },
  { name: 'Head of risk in training', blurb: 'Mostly honest and useful to the board, with gaps in what the number hid, what was said when, or who was told.' },
  { name: 'Head of risk', blurb: 'A risk picture the board could act on, disclosures made in time and a line held without drama.' },
  { name: 'Trusted risk adviser', blurb: 'The board asked better questions because of you, the auditors trusted your numbers, and nothing had to be corrected afterwards.' },
];

export const GRC_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'board-risk-report',
    title: 'The risk report the board will actually read',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The board wants a one-page risk heat map and a single score. You know the scores hide as much as they show. Decide what the board needs, what to show and what to say about a number that looks reassuring.',
    brief: [
      'Contoso\'s board meets in ten days. The chief executive has asked for "a heat map and a single risk score out of 100, so the board can see at a glance that we are under control". The current score, calculated by multiplying likelihood and impact ratings, is 62.',
      'You are the head of risk. You will rank what the board needs from a risk report, read how the score is made, spend a limited number of hours, decide how to respond to the request for a single number, and review the draft paper.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what the board needs from a risk report',
        intro: 'Tap the items in order, the most important first. Think about what lets directors decide and ask good questions.',
        items: [
          { id: 'a1', source: 'Decisions', priority: 1, text: 'The few risks that need a board decision, and what the options are.', why: 'A board paper exists to support decisions.' },
          { id: 'a2', source: 'Ranges', priority: 2, text: 'For the biggest risks, a plausible range of loss and how sure you are of it, rather than a single score.', why: 'A range shows uncertainty, which a single score hides.' },
          { id: 'a3', source: 'Change', priority: 3, text: 'What has changed since the last report and why.', why: 'Directors can see the movement.' },
          { id: 'a4', source: 'Evidence', priority: 4, text: 'How the ratings were reached, and which controls were tested rather than assumed.', why: 'Lets the board judge how far to trust the picture.' },
          { id: 'a5', source: 'Score', priority: 5, text: 'A single overall risk score out of 100.', why: 'Easy to read and easy to be misled by. It comes last.' },
        ],
      },
      {
        id: 'method', type: 'evidence', title: 'Read how the score is made',
        intro: 'You have the register, the scoring method and the test results. Look for what the single number hides. Flag only what the records support.',
        clues: {
          multiply: { strength: 'strong', text: 'The score multiplies a likelihood rating (1 to 5) by an impact rating (1 to 5), so a rare disaster and a frequent nuisance can both score 10.' },
          tested: { strength: 'strong', text: 'Of 52 controls rated "effective" in the register, only 11 were tested in the last twelve months.' },
          tail: { strength: 'strong', text: 'The largest single risk, a loss of the customer database, is rated 3 by 3, the same as a risk of paper jams in the print room being rated 3 by 3.' },
          average: { strength: 'strong', text: 'The 62 is an average across 40 risks, so ten red risks and thirty green ones give the same figure as forty amber ones.' },
          trend: { strength: 'weak', text: 'The score fell from 68 to 62 since last quarter.' },
        },
        artefacts: [
          {
            id: 'register', title: 'The register and the scoring method',
            lines: [
              { id: 'b1', type: 'clue', clue: 'multiply', text: 'Scoring guide: "Risk score = Likelihood (1-5) x Impact (1-5). Examples: a rare major incident (L1 x I5 = 5) and a frequent minor one (L5 x I1 = 5) score the same."', note: 'Multiplying ordinal ratings treats a rare disaster and a common nuisance as equal. The board cannot tell them apart.' },
              { id: 'b2', type: 'clue', clue: 'average', text: 'Dashboard note: "Overall risk score: 62 (average across 40 risks)."', note: 'An average hides the spread. A few very large risks can sit behind a comfortable figure.' },
              { id: 'b3', type: 'herring', text: 'The register uses a respected colour scheme', note: 'Appearance, not accuracy.' },
              { id: 'b4', type: 'herring', text: 'The previous head of risk used the same method for eight years', note: 'Longevity is not validity.' },
              { id: 'b5', type: 'plain', text: 'The register has 40 risks, rated by the risk owners', note: 'Context.' },
            ],
          },
          {
            id: 'tests', title: 'The test results and the biggest risks',
            lines: [
              { id: 'b6', type: 'clue', clue: 'tested', text: 'Control testing log: "Controls rated effective: 52. Tested in the last 12 months: 11. Of those tested: 4 failed."', note: 'Most of the ratings are assumptions, and a third of the tested controls failed.' },
              { id: 'b7', type: 'clue', clue: 'tail', text: 'Register extract: "R7 loss of the customer database: L3 x I3 = 9. R31 print room paper jams: L3 x I3 = 9."', note: 'The same score for a risk that could cost millions and one that costs nothing.' },
              { id: 'b8', type: 'clue', clue: 'trend', text: 'Score history: "Q1 68, Q2 65, Q3 62."', note: 'A fall in a score that is partly made of assumptions says little about real risk.' },
              { id: 'b9', type: 'herring', text: 'An external benchmark says the average score for the sector is 58', note: 'A comparison of numbers produced by different methods.' },
              { id: 'b10', type: 'herring', text: 'The chief executive says a score above 70 would "alarm" the board', note: 'A reason not to choose the number in advance.' },
              { id: 'b11', type: 'plain', text: 'The estimated cost of losing the customer database is £2m to £15m', note: 'A range the board can understand.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the board pack goes out',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Top risks', ideal: 3, text: 'Pick the five largest risks and write each as a plausible range of loss with a confidence level and a decision the board could take.', why: 'The core of a useful paper.' },
          { id: 'e2', source: 'Test', ideal: 3, text: 'Ask for testing of the controls the five largest risks depend on, and report what the tests found.', why: 'Replaces assumptions with evidence for the risks that matter most.' },
          { id: 'e3', source: 'Explain', ideal: 2, text: 'Write a short explanation of what the heat map and the score show and do not show.', why: 'Lets directors use it properly.' },
          { id: 'e4', source: 'Design', ideal: 2, text: 'Design the one page so it reads clearly in two minutes.', why: 'A board reads quickly.' },
        ],
      },
      {
        id: 'score', type: 'decision', title: 'Decide: the request for a single score',
        intro: 'The chief executive says: "A single score of 62 and a heat map, please. The board likes to see it improving." You know the score hides a loss that could be £15m.',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Give the board the heat map if it wants one, with the five biggest risks shown as ranges, say plainly what the score hides, show how many controls were really tested, and ask for the decisions that follow; tell the chief executive beforehand', set: { honest: true }, consequence: 'The chief executive is uneasy and the board is engaged. A director asks about the customer database, and the board approves a testing and backup programme.' },
          { id: 'both', quality: 2, text: 'Give the score and heat map as asked and add a page of the five biggest risks at the back', set: { both: true }, consequence: 'The front page reassures. The extra page is read by one director, who asks a sharp question and is told it is "in the appendix".' },
          { id: 'refuse', quality: 1, text: 'Refuse to produce a single score', set: { refuse: true }, consequence: 'You are right about the number, and the board gets a late and awkward paper. The chief executive questions your judgement.' },
          { id: 'score', quality: 0, text: 'Give the score and heat map as asked, showing the improvement', set: { score: true }, consequence: 'The board is reassured. Eight months later the customer database is lost, and the minutes show the board was told risk was under control.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft board paper',
        intro: 'A colleague has drafted parts of the paper.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'The loss of the customer database could plausibly cost between £2m and £15m, and we are moderately confident of the range.', why: 'A range with a confidence level.' },
          { id: 'v2', sound: false, text: 'The overall risk score has fallen from 68 to 62, showing that risk is under control.', why: 'The score is an average of partly untested ratings, and a fall does not show control.' },
          { id: 'v3', sound: true, text: 'Eleven of the 52 controls rated effective were tested last year, and four of those failed.', why: 'Shown by the testing log.' },
          { id: 'v4', sound: false, text: 'The score of 62 is better than the sector average of 58.', why: 'Different methods produce different numbers, and the comparison is not meaningful.' },
          { id: 'v5', sound: false, text: 'All 52 controls are operating effectively.', why: 'Forty-one have not been tested.' },
          { id: 'v6', sound: true, text: 'We recommend the board decides whether to fund testing of the controls behind the five largest risks.', why: 'A decision the board can take.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the cover note for the board',
        intro: 'Say what the report shows, what it hides and what you are asking the board to decide.',
        statements: [
          { id: 'r1', correct: true, text: 'The overall score is an average of 40 risks and multiplies ratings, so it hides the few very large risks behind it.', why: 'Shown by the scoring guide and the dashboard.' },
          { id: 'r2', correct: true, text: 'Only 11 of 52 controls rated effective were tested in the last year, and four of those failed.', why: 'Shown by the testing log.' },
          { id: 'r3', correct: true, text: 'The loss of the customer database could cost £2m to £15m, yet it carries the same score as a paper jam in the print room.', why: 'Shown by the register and the cost estimate.' },
          { id: 'r4', correct: true, text: 'A fall in the score since last quarter does not show that risk has fallen.', why: 'The score is partly made of assumptions.' },
          { id: 'r5', correct: false, text: 'Risk is under control because the score is below 70.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The company is safer than its sector peers.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'All controls rated effective can be relied on.', why: 'Unsupported.' },
          { id: 'r8', when: 'honest', correct: true, text: 'We told the board what the score hides, showed the five biggest risks as ranges and asked for decisions, and it funded testing and backups.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'both', correct: true, text: 'We gave the score and the heat map with the five biggest risks at the back, and only one director read them.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused to produce a single score, which was right in principle and produced a late, awkward paper.', why: 'An honest account.' },
          { id: 'r11', when: 'score', correct: true, text: 'We gave the score as asked, and the board was told risk was under control before a major loss.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Show the five largest risks as ranges with confidence levels and the decisions the board could take.', why: 'Gives directors something to decide.' },
          { id: 'a2', correct: true, text: 'Test the controls behind the five largest risks and report the results.', why: 'Replaces assumptions with evidence.' },
          { id: 'a3', correct: true, text: 'Say plainly what the score and the heat map do not show.', why: 'Lets the board judge how far to rely on them.' },
          { id: 'a4', correct: false, text: 'Report the overall score as the main measure of control.', why: 'Misleads.' },
          { id: 'a5', correct: false, text: 'Compare the score with the sector average.', why: 'Not comparable.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'gr-lead-exam',
    title: 'Promotion exam: Head of Risk',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A significant control failure, a chief executive who would like to wait until after results, an auditor and a regulator. Decide what is disclosed, to whom and when. Silver or better to pass.',
    brief: [
      'Two weeks before Contoso announces its annual results, you have found that a control over payments approval did not operate for nine months. £1.4 million was paid on approvals that never had the second signature the policy requires. No fraud has been found, and the cause is a workflow change that dropped the second approval. The chief executive says: "We are three weeks from the announcement. Let us fix it quietly and tell the auditors after the results."',
      'You are the head of risk. You will rank what to settle, spend a limited number of hours, read the evidence, decide what to do about the request to wait, and review the draft.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first at the top. Think about who is owed the truth and when.',
        items: [
          { id: 'x1', source: 'Audit committee', priority: 1, text: 'Telling the chair of the audit committee, who is independent of management, before results.', why: 'The audit committee exists to hear this, and delaying it undermines its role.' },
          { id: 'x2', source: 'Facts', priority: 2, text: 'Establishing exactly what was paid, to whom and whether anything was wrong with it.', why: 'A disclosure must say what is known and what is not.' },
          { id: 'x3', source: 'Auditors', priority: 3, text: 'What the external auditors must be told and when.', why: 'They are about to give an opinion on the accounts.' },
          { id: 'x4', source: 'Fix', priority: 4, text: 'Restoring the second approval in the workflow.', why: 'Quick, and it does not change what must be disclosed.' },
          { id: 'x5', source: 'Announcement', priority: 5, text: 'The timing of the results announcement.', why: 'A consequence of the others, not a reason to delay them.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours this week',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Facts', ideal: 4, text: 'Reconcile the £1.4m of payments, check each recipient and approval, and record what is verified and what is not.', why: 'The foundation of an honest disclosure.' },
          { id: 'e2', source: 'Tell', ideal: 3, text: 'Prepare the briefing for the audit committee chair and the external auditors, with the facts, the cause and the fix.', why: 'Must be accurate and timely.' },
          { id: 'e3', source: 'Fix', ideal: 2, text: 'Restore the second approval and add a monthly check that it is working.', why: 'Closes the gap.' },
          { id: 'e4', source: 'Lessons', ideal: 1, text: 'Note what the failure shows about how workflow changes are approved.', why: 'Useful, and last.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the evidence',
        intro: 'You have the payment records, the workflow change and the policy. Look for what must be disclosed. Flag only what the records support.',
        clues: {
          dropped: { strength: 'strong', text: 'A workflow change in March removed the second approval step for payments over £50,000, without a risk assessment or sign-off.' },
          amount: { strength: 'strong', text: 'Between March and December, 23 payments totalling £1.4 million went out on a single approval.' },
          noloss: { strength: 'strong', text: 'A check of all 23 payments against purchase orders and invoices found them genuine; no loss has been identified.' },
          policy: { strength: 'strong', text: 'The payments policy requires two approvals for any payment over £50,000, and results will state that key controls operated throughout the year.' },
          timing: { strength: 'weak', text: 'The results announcement is in three weeks.' },
        },
        artefacts: [
          {
            id: 'payments', title: 'The workflow change and the payments',
            lines: [
              { id: 'f1', type: 'clue', clue: 'dropped', text: 'Change record, March: "Simplified approval workflow. Payments over £50,000 now need one approver. Requested by Finance Operations. Risk assessment: none. Approved by: IT change manager."', note: 'A control was removed by a change process that did not consider it as a control.' },
              { id: 'f2', type: 'clue', clue: 'amount', text: 'Payments report, March to December: "Payments over £50,000 with one approval: 23. Total: £1,412,000."', note: 'The size and number of payments that went out without the required control.' },
              { id: 'f3', type: 'clue', clue: 'noloss', text: 'Reconciliation by Finance Control: "All 23 payments matched to purchase orders, goods received notes and supplier invoices. No exceptions."', note: 'A genuine finding, and good news. It does not change that the control failed.' },
              { id: 'f4', type: 'herring', text: 'The workflow change saved the finance team about two hours a week', note: 'The motive for the change, not a defence.' },
              { id: 'f5', type: 'herring', text: 'The approver on all 23 payments was the finance director', note: 'A person did the approving. The policy still required two.' },
              { id: 'f6', type: 'plain', text: 'Annual payments over £50,000 total about £18m', note: 'Scale.' },
            ],
          },
          {
            id: 'rules', title: 'The policy and the results',
            lines: [
              { id: 'f7', type: 'clue', clue: 'policy', text: 'Payments policy v3, section 5: "Any payment over £50,000 requires two authorised approvers." Draft results statement: "Key financial controls operated effectively throughout the year."', note: 'A statement about to be published is not true as written.' },
              { id: 'f8', type: 'clue', clue: 'timing', text: 'Company calendar: "Results announcement: 14 days from today."', note: 'A date, and a reason for pressure. It does not change what the committee and the auditors are owed.' },
              { id: 'f9', type: 'herring', text: 'The chief executive says the matter is "immaterial" because no money was lost', note: 'Materiality is for the auditors and the audit committee to judge, with the facts.' },
              { id: 'f10', type: 'herring', text: 'A competitor announced a similar control problem last year without effect on its share price', note: 'Not evidence about Contoso.' },
              { id: 'f11', type: 'plain', text: 'The audit committee chair is available tomorrow', note: 'There is time to tell them properly.' },
            ],
          },
        ],
      },
      {
        id: 'wait', type: 'decision', title: 'Decide: the request to wait',
        intro: 'The chief executive says: "Nothing was lost. Fix it quietly and tell the auditors after the results. Telling them now just makes trouble." The audit committee chair is available tomorrow.',
        prompt: 'What do you do?',
        options: [
          { id: 'tell', quality: 3, text: 'Tell the chief executive you will brief the audit committee chair tomorrow and the external auditors straight after, with the facts (what failed, the £1.4m, the clean reconciliation, the fix) and without a view on materiality, and ask the committee to consider the draft results statement', set: { tell: true }, consequence: 'The chair thanks you and takes the matter to the auditors. The results statement is amended to describe the deficiency and the fix. The auditors give a clean opinion with a note, and the announcement goes ahead on time.' },
          { id: 'ceo', quality: 2, text: 'Tell the chief executive you will brief the audit committee after the results, as requested, but fix the control now', set: { ceo: true }, consequence: 'The control is fixed. The audit committee learns of it later, learns it was known before the results and asks why it was not told sooner.' },
          { id: 'auditors', quality: 1, text: 'Tell the external auditors directly without informing the chief executive or the committee', set: { auditors: true }, consequence: 'The auditors are informed. The chief executive learns it from them, and trust in your judgement and your methods is damaged.' },
          { id: 'quiet', quality: 0, text: 'Fix it quietly and tell nobody, as the chief executive asked', set: { quiet: true }, consequence: 'The results state that controls operated throughout the year. Three months later the auditors find the change record. The statement is withdrawn, the chief executive resigns and you are asked why you knew.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft note to the audit committee',
        intro: 'A colleague has drafted the note.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'A workflow change in March removed the second approval for payments over £50,000, and 23 payments totalling £1.4m went out on a single approval.', why: 'Shown by the change record and the payments report.' },
          { id: 'v2', sound: false, text: 'The control failure is immaterial, so no disclosure is needed.', why: 'Materiality is for the committee and the auditors to judge.' },
          { id: 'v3', sound: true, text: 'A reconciliation of all 23 payments found them genuine, and no loss has been identified.', why: 'Shown by the reconciliation.' },
          { id: 'v4', sound: false, text: 'Key controls operated effectively throughout the year.', why: 'Not true of this control.' },
          { id: 'v5', sound: false, text: 'The finance director acted fraudulently.', why: 'No evidence of that.' },
          { id: 'v6', sound: true, text: 'The control has been restored and will be checked monthly, and the change process will assess any change to a control.', why: 'The fix and the lesson.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the briefing for the audit committee chair',
        intro: 'Say what failed, what is known, what is not and what you recommend. Do not offer a view of materiality.',
        statements: [
          { id: 'r1', correct: true, text: 'The second approval for payments over £50,000 was removed in March by a workflow change that was not assessed as a control change.', why: 'Shown by the change record.' },
          { id: 'r2', correct: true, text: 'Twenty-three payments totalling £1.4m were made on one approval, and all have been matched to orders and invoices with no loss found.', why: 'Shown by the payments report and the reconciliation.' },
          { id: 'r3', correct: true, text: 'The draft results statement says key controls operated throughout the year, which is not accurate for this control.', why: 'Shown by the draft.' },
          { id: 'r4', correct: true, text: 'The materiality of the failure is for the committee and the auditors to judge, and we recommend telling the auditors now.', why: 'The right allocation of judgement.' },
          { id: 'r5', correct: false, text: 'The failure is immaterial and does not need to be disclosed.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'Fraud has taken place.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The matter can wait until after results.', why: 'Unsupported.' },
          { id: 'r8', when: 'tell', correct: true, text: 'We briefed the committee chair and the auditors with the facts, the results statement was amended and the announcement went ahead on time.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'ceo', correct: true, text: 'We agreed to brief the committee after the results, and it later asked why it was not told sooner.', why: 'An honest account.' },
          { id: 'r10', when: 'auditors', correct: true, text: 'We told the auditors directly, without telling the chief executive or the committee, which damaged trust.', why: 'An honest account.' },
          { id: 'r11', when: 'quiet', correct: true, text: 'We fixed it quietly and told nobody, and the results statement was later withdrawn.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Brief the audit committee chair and the external auditors now, with the facts and without a view on materiality.', why: 'Gives those responsible the truth in time.' },
          { id: 'a2', correct: true, text: 'Ask the committee to consider whether the draft results statement needs to change.', why: 'The committee\'s decision.' },
          { id: 'a3', correct: true, text: 'Restore the second approval, check it monthly and require a control risk assessment for every workflow change.', why: 'Closes the gap and the cause.' },
          { id: 'a4', correct: false, text: 'Wait until after the results to tell the auditors.', why: 'They are about to give an opinion.' },
          { id: 'a5', correct: false, text: 'Describe the failure as immaterial in the briefing.', why: 'Not for you to decide.' },
        ],
      },
    ],
  },
];
