// Governance, Risk and Compliance simulations. Everything here is fictional.
//
// These are decision-based: how to rank risk, how to check a control against reality, what the law
// requires after a breach, and how to answer someone who wants the paperwork to look better than the
// facts. Legal references are deliberately general (UK data protection law); they are not legal advice.
//
// The path's themes: a control that exists on paper is not a control that works, a risk accepted by someone
// who does not own it is not accepted, and the record must say what happened.

const RATINGS = [
  { name: 'Box ticker', blurb: 'The paperwork was tidy and the risk was real. Read each stage note: governance is judged by what happens, not what is written.' },
  { name: 'Analyst', blurb: 'You tested some claims and rated risk sensibly, with gaps in evidence, ownership or honesty under pressure.' },
  { name: 'GRC analyst', blurb: 'Risks ranked on evidence, controls tested against practice, and the record kept straight under pressure.' },
  { name: 'Trusted adviser', blurb: 'A record that leaders, auditors and regulators could all rely on, and the courage to say the uncomfortable thing.' },
];

export const GRC = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'register-review',
    title: 'The risk register nobody reads',
    skill: 'hardening',
    minutes: 20,
    blurb: 'Contoso\'s risk register has 120 entries and most are "medium". Work out which risks really matter, check what the evidence says, and decide what to do about a request to accept a large risk.',
    brief: [
      'Contoso\'s risk register is reviewed once a year and has barely changed in three years. Most entries are rated "medium", and the executive team has stopped reading it. The head of operations has asked you to help him "accept" the risk of an unsupported production system until next year.',
      'You are the GRC analyst. You will rank the risks, check the evidence behind two of them, spend a limited budget of review-days, decide how to answer the request to accept the risk, and review the summary before it goes to the risk committee.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks',
        intro: 'Tap the risks in order, the most serious first. Think about how likely each is, how bad it would be, and how well it is controlled today.',
        items: [
          { id: 'r1', source: 'Unsupported system', priority: 1, text: 'The order-processing system runs on software the vendor stopped supporting two years ago, is reachable from the internet and holds customer orders.', why: 'High likelihood (known flaws, internet-facing) and high impact (orders and customer data), with no vendor fixes available.' },
          { id: 'r2', source: 'Backups', priority: 2, text: 'Backups of the finance database have not been test-restored in 26 months.', why: 'A backup that has never been tested may not work. The impact of losing finance data is severe, and the likelihood is unknown.' },
          { id: 'r3', source: 'Supplier', priority: 3, text: 'A key supplier holds a copy of the customer database and has not been reviewed for three years.', why: 'A real risk, with an uncertain likelihood. It needs evidence before a rating.' },
          { id: 'r4', source: 'Laptop loss', priority: 4, text: 'Staff laptops could be lost or stolen.', why: 'Likely, but the disks are encrypted, so the impact is low.' },
          { id: 'r5', source: 'Office power', priority: 5, text: 'The main office has no backup power for more than 20 minutes.', why: 'An inconvenience. Operations run in the cloud, so impact is low.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Check the evidence behind two risks',
        intro: 'You have the vendor notice and the last backup test records. Look for what should change the ratings. Flag only what the records support.',
        clues: {
          eol: { strength: 'strong', text: 'The vendor ended support two years ago, and 11 published flaws affect the version Contoso runs, 4 of them known to be exploited.' },
          net: { strength: 'strong', text: 'The system is reachable from the internet through a remote access page used by three suppliers.' },
          backup: { strength: 'strong', text: 'The last test restore of the finance database failed to complete, and the failure was not followed up.' },
          owner: { strength: 'strong', text: 'The "risk owner" on the register for the unsupported system is a person who left the company 18 months ago.' },
          cost: { strength: 'weak', text: 'Replacing the system is estimated at £280,000.' },
        },
        artefacts: [
          {
            id: 'system', title: 'The unsupported system',
            lines: [
              { id: 'e1', type: 'clue', clue: 'eol', text: 'Vendor notice: support ended two years ago. Published advisories for the installed version: 11, of which 4 are listed as known exploited', note: 'Known-exploited flaws with no vendor fix make the likelihood high, not medium.' },
              { id: 'e2', type: 'clue', clue: 'net', text: 'Exposure: remote access page reachable from the internet; used by 3 suppliers; no second factor', note: 'An internet-facing system with known flaws and weak sign-in is the combination attackers look for.' },
              { id: 'e3', type: 'clue', clue: 'owner', text: 'Register entry R-044: owner "T. Kerr" (left 18 months ago). Rating: Medium. Last reviewed: 2 years ago', note: 'The rating is old and nobody who owns the risk is looking at it.' },
              { id: 'e4', type: 'herring', text: 'The system has run without a major outage for 6 years', note: 'Reliability says nothing about security.' },
              { id: 'e5', type: 'plain', text: 'Annual revenue processed by the system: £41 million', note: 'The impact if it is lost or attacked.' },
            ],
          },
          {
            id: 'backups', title: 'Backups and cost',
            lines: [
              { id: 'e6', type: 'clue', clue: 'backup', text: 'Last test restore of the finance database: 26 months ago. Result: "failed at 62%, retry later". No retry recorded', note: 'The one time it was tested it failed, and nobody followed up. The register entry says "backups in place: effective".' },
              { id: 'e7', type: 'clue', clue: 'cost', text: 'Estimate to replace the order system: £280,000 over 9 months', note: 'A real cost that the operations head will cite. It does not change the rating.' },
              { id: 'e8', type: 'herring', text: 'Backup jobs report "successful" every night', note: 'A job finishing does not prove that its output can be restored.' },
              { id: 'e9', type: 'herring', text: 'Finance has 14 staff', note: 'No bearing on the risk.' },
              { id: 'e10', type: 'plain', text: 'Cyber insurance policy renews in four months', note: 'Context: insurers ask about unsupported systems and backups.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'review-days', budget: 10, title: 'Spend your ten review-days',
        intro: 'Spend all ten across these four pieces of work before the risk committee meets.',
        items: [
          { id: 'f1', source: 'Unsupported system', ideal: 3, text: 'Re-rate the risk with the evidence, find a current owner and agree interim protections (take the remote page off the internet, add a second factor).', why: 'The highest-rated risk with the most evidence.' },
          { id: 'f2', source: 'Backups', ideal: 3, text: 'Run a proper restore test, record the result and correct the register entry.', why: 'Turns an unknown into a fact.' },
          { id: 'f3', source: 'Register', ideal: 2, text: 'Check the owners and ratings on the top 20 entries and remove those that are stale.', why: 'Makes the register trustworthy again.' },
          { id: 'f4', source: 'Reporting', ideal: 2, text: 'Write a one-page summary for the committee showing the top risks, the evidence and the decisions needed.', why: 'The register is useless if nobody reads it.' },
        ],
      },
      {
        id: 'accept', type: 'decision', title: 'Decide: the request to accept the risk',
        intro: 'The head of operations says: "The replacement costs £280,000 and we cannot afford it this year. Just record the risk as accepted until next year and rate it low. Nobody is going to attack an old order system."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Record it as it is: a high risk with the evidence, a named owner and an interim plan; explain that a risk can be accepted only by someone with the authority to do so, for a stated period and with conditions; and ask the risk committee to decide', set: { honest: true }, consequence: 'The committee accepts the risk for six months on three conditions: no internet access to the system, a second factor and a funded replacement plan. The operations head gets the extra time and the record is honest.' },
          { id: 'medium', quality: 2, text: 'Record it as accepted, but keep the rating at medium and note the interim steps', set: { medium: true }, consequence: 'The record looks fine. The rating understates the risk and the committee never discusses it.' },
          { id: 'refuse', quality: 1, text: 'Refuse to record anything until the system is replaced', set: { refuse: true }, consequence: 'The operations head complains to the finance director. The risk is recorded by someone else, as low.' },
          { id: 'low', quality: 0, text: 'Record the risk as low and accepted, as asked', set: { low: true }, consequence: 'Eight months later, attackers use a known flaw to take the system. The register had said it was low and accepted.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the risk committee',
        intro: 'A colleague has drafted the summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'The order system has been unsupported for two years, has 11 published flaws, four of them known to be exploited, and is reachable from the internet.', why: 'Supported by the vendor notice and the exposure record.' },
          { id: 'p2', sound: false, text: 'The order system has been attacked.', why: 'Unsupported. The records show exposure, not an attack.' },
          { id: 'p3', sound: false, text: 'Finance backups are effective because the nightly jobs report success.', why: 'Contradicted. The one test restore failed, and a job finishing does not prove a restore works.' },
          { id: 'p4', sound: true, text: 'The owner on the register for the order system left the company 18 months ago.', why: 'Supported by the register.' },
          { id: 'p5', sound: false, text: 'Replacing the order system is unaffordable and should be dropped.', why: 'Unsupported. The cost is a fact, the decision belongs to the committee.' },
          { id: 'p6', sound: true, text: 'Taking the remote page off the internet and adding a second factor would reduce the risk while a replacement is planned.', why: 'A sound interim step.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the risk committee',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'The order system is unsupported, has four known-exploited flaws and is reachable from the internet, and its register entry rates it Medium.', why: 'Shown by the records.' },
          { id: 'r2', correct: true, text: 'The last test restore of the finance database failed 26 months ago and was never repeated.', why: 'Shown by the backup record.' },
          { id: 'r3', correct: true, text: 'The register entry for the order system names an owner who left 18 months ago.', why: 'Shown by the register.' },
          { id: 'r4', correct: true, text: 'We do not know whether the order system has been attacked, and we are checking its logs.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The company has been breached through the order system.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The operations team has been negligent.', why: 'A judgement about people.' },
          { id: 'r7', correct: false, text: 'The risk is acceptable.', why: 'Not a judgement for the analyst to make, and not supported by the evidence.' },
          { id: 'r8', when: 'honest', correct: true, text: 'The risk was recorded as high with evidence and an interim plan, and the committee accepted it for six months on three conditions.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'medium', correct: true, text: 'The risk was accepted at Medium with the interim steps noted, and the committee did not discuss it.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'The risk was not recorded by us, and was later recorded by someone else as low.', why: 'An honest account of the cost of refusing.' },
          { id: 'r11', when: 'low', correct: true, text: 'The risk was recorded as low and accepted, and the system was later attacked through a known flaw.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Re-rate the order system as high, name a current owner, and ask the committee to decide on acceptance, with conditions and an end date.', why: 'Puts the decision with the right people.' },
          { id: 'a2', correct: true, text: 'Take the remote access page off the internet and add a second factor now, while the replacement is planned.', why: 'Reduces the risk cheaply.' },
          { id: 'a3', correct: true, text: 'Run a real restore test of the finance database and correct the register.', why: 'Replaces an assumption with a fact.' },
          { id: 'a4', correct: false, text: 'Record the risk as accepted and low to meet the operations head\'s request.', why: 'Falsifies the record.' },
          { id: 'a5', correct: false, text: 'Remove the order system from the register since it is too expensive to fix.', why: 'Hides the risk.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'breach-notification',
    title: 'The 72-hour clock',
    skill: 'identity',
    minutes: 20,
    blurb: 'A data incident has happened, the chief executive wants to wait until the investigation is finished and a clock is running. Decide who must be told and when.',
    brief: [
      'On Monday morning, Contoso found that an email containing a spreadsheet of 2,300 customers\' names, addresses and order histories was sent on Friday evening to the wrong external address. Contoso became aware of it at 09:10 on Monday.',
      'You are the GRC analyst working with the data protection officer (DPO). You will rank what to do first, read the facts, spend a limited budget of hours, decide how to respond to a request to wait, and review the notification before it goes to the regulator.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank your first actions',
        intro: 'Tap the actions in order, the most urgent first. Think about harm to people, the legal time limit, and what you do not yet know.',
        items: [
          { id: 'a1', source: 'Contain', priority: 1, text: 'Ask the recipient to delete the email and confirm in writing, and recall or block it where possible.', why: 'Limits harm to the 2,300 people as quickly as possible.' },
          { id: 'a2', source: 'DPO', priority: 2, text: 'Tell the data protection officer immediately and log the time Contoso became aware.', why: 'The legal clock runs from the moment the organisation is aware, so it needs a clear record.' },
          { id: 'a3', source: 'Facts', priority: 3, text: 'Establish exactly what data was in the spreadsheet, whose it was and who received it.', why: 'You cannot judge the risk to people without knowing what was exposed.' },
          { id: 'a4', source: 'Risk', priority: 4, text: 'Assess the risk to the people affected and decide whether the regulator and the individuals must be told.', why: 'The core legal decision. It depends on the facts above.' },
          { id: 'a5', source: 'Message', priority: 5, text: 'Draft the wording of the customer email.', why: 'Important, and it follows the decision about whether to tell people.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the facts so far',
        intro: 'You have the sent email, the recipient\'s details and the data list. Look for what should decide the notification. Flag only what the records support.',
        clues: {
          data: { strength: 'strong', text: 'The spreadsheet holds names, home addresses, phone numbers and order histories for 2,300 customers, including 140 who bought sensitive health-related products.' },
          wrong: { strength: 'strong', text: 'The recipient is an external address at a personal email provider, not a company, and has not confirmed deletion.' },
          aware: { strength: 'strong', text: 'Contoso became aware at 09:10 on Monday, when a customer replied to the email, so the 72 hours end at 09:10 on Thursday.' },
          unencrypted: { strength: 'strong', text: 'The spreadsheet was not password protected or encrypted.' },
          size: { strength: 'weak', text: 'The spreadsheet was 1.1 MB.' },
        },
        artefacts: [
          {
            id: 'email', title: 'The email and the data',
            lines: [
              { id: 'b1', type: 'clue', clue: 'data', text: 'Attachment "Orders_Q3_customers.xlsx": 2,300 rows: name, address, phone, order history. 140 rows include products in the "health and wellbeing" category', note: 'Names, addresses and what people bought, including sensitive purchases. The risk of harm is higher than for a simple list of names.' },
              { id: 'b2', type: 'clue', clue: 'unencrypted', text: 'File properties: no password, no encryption. Sent in the body of an ordinary email', note: 'Nothing protects the data from whoever received it.' },
              { id: 'b3', type: 'herring', text: 'The email was sent by an experienced member of staff', note: 'Experience does not change the facts.' },
              { id: 'b4', type: 'herring', text: 'The mistake was a one-letter typo in the address', note: 'How it happened does not change what was exposed.' },
              { id: 'b5', type: 'plain', text: 'The email subject line: "Q3 orders for review"', note: 'Context.' },
            ],
          },
          {
            id: 'recipient', title: 'The recipient and the timeline',
            lines: [
              { id: 'b6', type: 'clue', clue: 'wrong', text: 'Recipient: a personal address at a free email provider, apparently unrelated to Contoso. Contoso asked for deletion at 09:25 Monday; no reply yet', note: 'The data is in the hands of an unknown private person who has not confirmed deletion.' },
              { id: 'b7', type: 'clue', clue: 'aware', text: 'Log: customer reply received 09:10 Monday ("I think you sent me someone else\'s order list"). Sent: Friday 17:48', note: 'The time Contoso became aware is clear and recorded. The 72-hour limit runs to 09:10 on Thursday.' },
              { id: 'b8', type: 'clue', clue: 'size', text: 'File size 1.1 MB', note: 'Irrelevant to the decision.' },
              { id: 'b9', type: 'herring', text: 'The chief executive was on holiday until Monday', note: 'It does not change the awareness time or the duty.' },
              { id: 'b10', type: 'herring', text: 'The same member of staff has sent 400 emails this month', note: 'No bearing.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the deadline',
        intro: 'Spend all ten across these four pieces of work before the notification decision.',
        items: [
          { id: 'c1', source: 'Containment', ideal: 2, text: 'Chase the recipient\'s deletion, ask their provider to act, and recall what is possible.', why: 'Reduces the risk of further exposure.' },
          { id: 'c2', source: 'Facts', ideal: 3, text: 'Confirm exactly what data, whose, how many people and any special-category data.', why: 'The decision depends on it.' },
          { id: 'c3', source: 'Decision', ideal: 3, text: 'Work through the risk to people with the DPO and record the decision and reasons.', why: 'The legal judgement, and the record has to be sound.' },
          { id: 'c4', source: 'Notification', ideal: 2, text: 'Prepare the regulator notification and the message to affected people, ready to send.', why: 'The deadline leaves no time to start late.' },
        ],
      },
      {
        id: 'wait', type: 'decision', title: 'Decide: the chief executive wants to wait',
        intro: 'The chief executive says: "We will not tell anyone until the investigation is complete. Telling the regulator or customers will cause panic. The recipient will probably delete it."',
        prompt: 'What do you do?',
        options: [
          { id: 'notify', quality: 3, text: 'Explain that the time limit runs from when Contoso became aware, not from the end of the investigation, and that the facts so far point to a likely risk to people; recommend the DPO notifies the regulator within the limit with what is known and says more will follow, and tells the affected people without undue delay', set: { notify: true }, consequence: 'The regulator is told on Wednesday with a clear initial report. The customers are told on Thursday, and the recipient confirms deletion on Friday. The regulator notes the prompt, honest handling.' },
          { id: 'partial', quality: 2, text: 'Notify the regulator within the limit but delay telling the customers until the recipient confirms deletion', set: { partial: true }, consequence: 'The regulator is told on time. A customer finds out from social media, and the regulator asks why people were not told sooner.' },
          { id: 'wait', quality: 1, text: 'Wait until the investigation is complete, as the chief executive asked, but prepare the notification', set: { wait: true }, consequence: 'The investigation finishes on day five. The notification is late, and the regulator asks why.' },
          { id: 'silent', quality: 0, text: 'Do not notify anyone and record it as an incident with no risk to people', set: { silent: true }, consequence: 'A customer complains to the regulator six weeks later. The company is found to have known about a likely breach and not reported it.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft notification',
        intro: 'A colleague has drafted the notification to the regulator.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'On Friday 17:48 an email containing a spreadsheet of 2,300 customers\' personal data was sent to an incorrect external address, and we became aware at 09:10 on Monday.', why: 'Supported by the log.' },
          { id: 'j2', sound: false, text: 'The recipient has deleted the email.', why: 'Contradicted. They have not confirmed deletion.' },
          { id: 'j3', sound: false, text: 'No special-category data was involved.', why: 'Contradicted. 140 customers bought health-related products.' },
          { id: 'j4', sound: true, text: 'The spreadsheet was not encrypted or password protected.', why: 'Supported by the file properties.' },
          { id: 'j5', sound: false, text: 'There is no risk to the people affected.', why: 'Unsupported. Names, addresses and sensitive purchases are in unknown hands.' },
          { id: 'j6', sound: true, text: 'We have asked for deletion and will provide further information as our investigation continues.', why: 'An honest statement that more will follow.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your notification summary',
        intro: 'Your own summary for the DPO. Include what the evidence supports and be honest about what is not yet known.',
        statements: [
          { id: 'q1', correct: true, text: 'A spreadsheet of 2,300 customers\' names, addresses, phone numbers and order histories was emailed in error on Friday 17:48 to an unknown private address.', why: 'Shown by the email.' },
          { id: 'q2', correct: true, text: '140 of the people had bought health-related products, so some of the data may be special-category data.', why: 'Shown by the data.' },
          { id: 'q3', correct: true, text: 'Contoso became aware at 09:10 on Monday, and the file was not encrypted.', why: 'Shown by the log and file properties.' },
          { id: 'q4', correct: true, text: 'The recipient has not yet confirmed deletion, and we do not know whether the data has been read or shared.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'The data has been misused.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'The member of staff was careless and has been dismissed.', why: 'A judgement about a person, not a finding.' },
          { id: 'q7', correct: false, text: 'The incident does not need to be reported.', why: 'Contradicted by the facts.' },
          { id: 'q8', when: 'notify', correct: true, text: 'The regulator was told within the 72 hours with an initial report, and the customers were told without undue delay.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'partial', correct: true, text: 'The regulator was told on time, and the customers were told late after one found out from social media.', why: 'An honest account.' },
          { id: 'q10', when: 'wait', correct: true, text: 'Notification waited for the end of the investigation and was late.', why: 'An honest account.' },
          { id: 'q11', when: 'silent', correct: true, text: 'The incident was recorded as no risk and not reported, and a complaint later revealed it.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Notify the regulator within 72 hours of becoming aware, with what is known now and a commitment to follow up.', why: 'Meets the time limit and is honest.' },
          { id: 'a2', correct: true, text: 'Tell the affected people without undue delay, say what happened, what data and what to do, and who to contact.', why: 'Respects the people at risk.' },
          { id: 'a3', correct: true, text: 'Continue to pursue deletion and record every step, and change how spreadsheets of personal data are sent.', why: 'Reduces further harm and recurrence.' },
          { id: 'a4', correct: false, text: 'Wait for the recipient to confirm deletion before deciding.', why: 'The clock is running.' },
          { id: 'a5', correct: false, text: 'Dismiss the member of staff to show the regulator action was taken.', why: 'Not a proportionate or required step.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'supplier-diligence',
    title: 'The supplier questionnaire',
    skill: 'hardening',
    minutes: 20,
    blurb: 'A new supplier answered every security question "yes" and the business wants to go live next week. Test the answers, find what the evidence shows and decide what to recommend.',
    brief: [
      'Contoso wants to use a small software supplier, Tailwind Analytics, to process customer records. Its security questionnaire is full of "yes". The sales director wants a signature by Friday so the project can start on Monday.',
      'You are the GRC analyst doing third-party risk. You will rank what to check, read the supplier\'s evidence, spend a limited budget of review-days, decide what to recommend, and review your summary for the sales director.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to check first',
        intro: 'Tap the checks in order, the most important first. Think about what data the supplier will hold, and what would hurt most if the answer were untrue.',
        items: [
          { id: 'c1', source: 'Data and access', priority: 1, text: 'What customer data Tailwind will hold, where it will be stored, and who at Tailwind can see it.', why: 'The core of the risk. Every other check depends on knowing what is at stake.' },
          { id: 'c2', source: 'Incident handling', priority: 2, text: 'Whether Tailwind can detect a breach and tell Contoso quickly, and whether the contract requires it.', why: 'Contoso remains responsible for its customers\' data, and needs prompt notice.' },
          { id: 'c3', source: 'Evidence', priority: 3, text: 'Whether the "yes" answers are backed by evidence such as an independent audit or test report.', why: 'A "yes" without evidence is a claim, not a control.' },
          { id: 'c4', source: 'Their suppliers', priority: 4, text: 'Which other companies Tailwind uses to run the service.', why: 'Contoso\'s data may pass through companies it has never heard of.' },
          { id: 'c5', source: 'Company', priority: 5, text: 'How long Tailwind has been trading.', why: 'Context. It does not tell you how the data is protected.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Read the supplier\'s evidence',
        intro: 'You have the questionnaire and the documents Tailwind sent. Look for what the evidence really shows. Flag only what the records support.',
        clues: {
          noaudit: { strength: 'strong', text: 'Tailwind answered "Yes" to "independently audited", but the only document sent is a certificate for a different company with a similar name.' },
          admin: { strength: 'strong', text: 'The questionnaire says "access is restricted", but the architecture diagram shows all 11 staff share one administrator account.' },
          region: { strength: 'strong', text: 'Customer data will be stored outside the UK, with a sub-supplier Tailwind did not name in its answers.' },
          notify: { strength: 'strong', text: 'The draft contract gives Tailwind 30 days to tell Contoso about a breach.' },
          size: { strength: 'weak', text: 'Tailwind has 11 employees.' },
        },
        artefacts: [
          {
            id: 'quest', title: 'The questionnaire and the certificate',
            lines: [
              { id: 'd1', type: 'clue', clue: 'noaudit', text: 'Q14 "Has your service been independently audited?": Yes. Evidence supplied: ISO 27001 certificate issued to "Tailwind Analytics Group Ltd"', note: 'The certificate belongs to a differently named company. It is not evidence about this supplier.' },
              { id: 'd2', type: 'clue', clue: 'region', text: 'Q22 "Where will data be stored?": "Secure European cloud". Sub-suppliers named: none. Architecture diagram label: "Data store: CloudBox Asia-Pacific (Singapore)"', note: 'The diagram contradicts the answer and shows a sub-supplier and a non-UK location that Contoso must assess.' },
              { id: 'd3', type: 'herring', text: 'All 48 questions answered "Yes"', note: 'A perfect score should prompt questions, not comfort.' },
              { id: 'd4', type: 'herring', text: 'The questionnaire was completed in 20 minutes', note: 'Speed is not evidence either way.' },
              { id: 'd5', type: 'plain', text: 'Supplier signature on the questionnaire: the managing director', note: 'Context.' },
            ],
          },
          {
            id: 'diagram', title: 'The architecture diagram and the draft contract',
            lines: [
              { id: 'd6', type: 'clue', clue: 'admin', text: 'Diagram note: "Admin access: shared account \'tw-admin\' (11 users)". Questionnaire Q31 "Is access restricted to named individuals?": Yes', note: 'A shared account cannot be traced to a person and contradicts the questionnaire answer.' },
              { id: 'd7', type: 'clue', clue: 'notify', text: 'Draft contract clause 9: "The Supplier shall notify the Customer of a personal data breach within 30 days of becoming aware"', note: 'Contoso has only 72 hours to tell the regulator once it knows. A 30-day notice period makes that impossible.' },
              { id: 'd8', type: 'clue', clue: 'size', text: 'Company size: 11 employees', note: 'A small company can still be safe. Size is context, not a verdict.' },
              { id: 'd9', type: 'herring', text: 'Tailwind has won an award for innovation', note: 'No bearing on security.' },
              { id: 'd10', type: 'herring', text: 'The sales director has worked with Tailwind\'s founder before', note: 'A relationship, not evidence.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'review-days', budget: 10, title: 'Spend your ten review-days',
        intro: 'You have ten days before Friday. Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Evidence', ideal: 3, text: 'Ask Tailwind for its own audit report or a recent independent test, and check the certificate.', why: 'Turns "yes" into evidence.' },
          { id: 'e2', source: 'Contract', ideal: 3, text: 'Negotiate breach notification within 24 to 48 hours, a right to audit and limits on sub-suppliers.', why: 'The contract is Contoso\'s main protection.' },
          { id: 'e3', source: 'Data', ideal: 2, text: 'Agree what data is needed, minimise it, and require UK or approved locations and named individual accounts.', why: 'Reduces what can go wrong.' },
          { id: 'e4', source: 'Decision', ideal: 2, text: 'Write a clear recommendation with conditions for the project sponsor.', why: 'The deliverable.' },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the sales director wants a signature on Friday',
        intro: 'The sales director says: "They answered yes to everything and we need to start on Monday. Mark them low risk and get it signed. We can tidy up the detail later."',
        prompt: 'What do you recommend?',
        options: [
          { id: 'conditional', quality: 3, text: 'Recommend a conditional go: a limited start with test data only, the contract changes (24-hour breach notice, audit right, named sub-suppliers), proof of the audit and a fix for the shared account within 30 days, and real customer data only once those conditions are met; and record Tailwind as medium risk with conditions', set: { conditional: true }, consequence: 'The project starts on Monday with test data. Tailwind accepts the contract changes, fixes the shared account in three weeks and provides a real audit report. Real data goes live in week five.' },
          { id: 'goaccept', quality: 2, text: 'Agree to sign on Friday with the questions logged for follow-up after go-live', set: { goaccept: true }, consequence: 'Real customer data goes to Tailwind on Monday. Follow-up takes four months, and a shared account is found in use by a former employee.' },
          { id: 'block', quality: 1, text: 'Refuse to approve Tailwind until every question has been resolved', set: { block: true }, consequence: 'The project slips by three months, and a different team buys an unvetted tool instead.' },
          { id: 'low', quality: 0, text: 'Mark Tailwind as low risk and sign as asked', set: { low: true }, consequence: 'Eight months later Tailwind has a breach, tells Contoso on day 27 under the contract, and Contoso misses its own deadline to the regulator.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the sales director',
        intro: 'A colleague has drafted the summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The certificate Tailwind supplied was issued to a differently named company and does not evidence Tailwind\'s own security.', why: 'Supported by the certificate.' },
          { id: 'j2', sound: false, text: 'Tailwind has lied on the questionnaire.', why: 'Unsupported. Some answers contradict the evidence, which needs asking about.' },
          { id: 'j3', sound: false, text: 'Tailwind is secure because it answered "yes" to every question.', why: 'Contradicted by the shared administrator account and the missing evidence.' },
          { id: 'j4', sound: true, text: 'The draft contract allows 30 days to notify Contoso of a breach, which is not compatible with Contoso\'s own 72-hour duty.', why: 'Supported by clause 9.' },
          { id: 'j5', sound: false, text: 'Small suppliers are always unsafe.', why: 'Overstated. Size is not the issue.' },
          { id: 'j6', sound: true, text: 'The architecture diagram shows data stored in Singapore with a sub-supplier that Tailwind did not name.', why: 'Supported by the diagram.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your recommendation for the sales director',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'The independent audit Tailwind cited is not supported by its evidence: the certificate is for a differently named company.', why: 'Shown by the certificate.' },
          { id: 'r2', correct: true, text: 'Tailwind\'s 11 staff share one administrator account, which contradicts its answer about named access.', why: 'Shown by the diagram.' },
          { id: 'r3', correct: true, text: 'Data would be stored in Singapore with a sub-supplier that is not named in the questionnaire.', why: 'Shown by the diagram.' },
          { id: 'r4', correct: true, text: 'We have not yet seen an independent audit of Tailwind, so we cannot say how well customer data would be protected.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'Tailwind is untrustworthy.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The project should be cancelled.', why: 'Not what the evidence supports.' },
          { id: 'r7', correct: false, text: 'Tailwind meets all of our security requirements.', why: 'Contradicted.' },
          { id: 'r8', when: 'conditional', correct: true, text: 'The project starts with test data, and real customer data goes live once the contract changes, audit evidence and shared-account fix are in place.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'goaccept', correct: true, text: 'The contract was signed with follow-up after go-live, and a shared account was later found in use by a former employee.', why: 'An honest account.' },
          { id: 'r10', when: 'block', correct: true, text: 'Tailwind was blocked until every question was resolved, the project slipped by three months, and another team bought an unvetted tool.', why: 'An honest account.' },
          { id: 'r11', when: 'low', correct: true, text: 'Tailwind was recorded as low risk and signed, and a later breach was notified under the contract after 27 days.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Change the contract to require breach notice within 24 hours, a right to audit and named sub-suppliers.', why: 'Protects Contoso\'s own legal position.' },
          { id: 'a2', correct: true, text: 'Start with test data, and ask Tailwind for a real audit report and named individual accounts before real data is shared.', why: 'Lets the project begin safely.' },
          { id: 'a3', correct: true, text: 'Assess CloudBox, the Singapore sub-supplier, and the transfer of data outside the UK.', why: 'Finds out who else holds the data.' },
          { id: 'a4', correct: false, text: 'Accept the "yes" answers as a record of assurance.', why: 'They are claims, not evidence.' },
          { id: 'a5', correct: false, text: 'Reject Tailwind and the project outright.', why: 'Out of proportion.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'gr-exam',
    title: 'Promotion exam: GRC Analyst',
    skill: 'hardening',
    minutes: 28,
    blurb: 'An audit in two weeks, a request to mark weak controls as effective and a regulator watching. Silver or better to pass.',
    brief: [
      'This is your promotion exam. An external audit of Contoso begins in two weeks. You have been asked to prepare the control self-assessment, and the head of IT has asked you to rate all 40 controls "effective" so that the audit goes smoothly. A regulator has also asked a question about last year\'s data incident.',
      'The case tests the role: ranking what to check, spending limited time, working out which controls really work, standing firm on honest ratings, and reporting accurately. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the controls to test first',
        intro: 'There is no time to test all 40. Tap the controls in order, the most important to test first. Think about how serious the risk is if the control does not work, and how doubtful it is.',
        items: [
          { id: 'x1', source: 'Access review', priority: 1, text: 'Quarterly review of who has access to the finance systems.', why: 'A key control over the most valuable data, and the evidence is thin.' },
          { id: 'x2', source: 'Backups', priority: 2, text: 'Backups of critical systems can be restored.', why: 'Recovery depends on it, and an earlier test had failed.' },
          { id: 'x3', source: 'Leavers', priority: 3, text: 'Access is removed within 24 hours when someone leaves.', why: 'A common failure with serious consequences.' },
          { id: 'x4', source: 'Patching', priority: 4, text: 'Critical patches are applied within 14 days.', why: 'Important and measurable from existing reports.' },
          { id: 'x5', source: 'Training', priority: 5, text: 'All staff complete annual security training.', why: 'A simple, well-evidenced control with low impact if slightly imperfect.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'review-days', budget: 10, title: 'Spend your ten review-days',
        intro: 'Spend all ten across these four pieces of work before the audit.',
        items: [
          { id: 'y1', source: 'Test', ideal: 4, text: 'Test the five highest-risk controls against real evidence, not against the control owner\'s description.', why: 'The heart of an honest assessment.' },
          { id: 'y2', source: 'Rate', ideal: 2, text: 'Rate every control on the evidence and record the reasons.', why: 'The assessment itself.' },
          { id: 'y3', source: 'Plan', ideal: 2, text: 'Agree owners and dates for the controls that are found to be weak.', why: 'Shows the auditors a credible plan.' },
          { id: 'y4', source: 'Regulator', ideal: 2, text: 'Gather accurate records to answer the regulator\'s question about last year\'s incident.', why: 'A separate deadline with real consequences.' },
        ],
      },
      {
        id: 'controls', type: 'evidence', title: 'Work out which controls really work',
        intro: 'You have tested the top three controls. Look at what the evidence shows. Flag only what the records support.',
        clues: {
          review: { strength: 'strong', text: 'No access review for the finance systems has been done in 14 months, though the control owner says it is "quarterly".' },
          restore: { strength: 'strong', text: 'A test restore of the main finance database failed on Monday.' },
          leavers: { strength: 'strong', text: 'Of 36 leavers in the last year, 11 still had active accounts after 24 hours, and 4 were still active after a month.' },
          signoff: { strength: 'strong', text: 'The previous year\'s self-assessment rated all 40 controls effective, and the auditors then found five failed ones.' },
          size: { strength: 'weak', text: 'The company has 1,600 staff.' },
        },
        artefacts: [
          {
            id: 'tests', title: 'The results of your tests',
            lines: [
              { id: 'z1', type: 'clue', clue: 'review', text: 'Access review, finance systems: control description "quarterly review by each system owner". Evidence found: reviews completed in March and June of last year; none since. Owner\'s statement: "we do them every quarter"', note: 'The owner\'s description does not match the evidence. The control has not operated for 14 months.' },
              { id: 'z2', type: 'clue', clue: 'restore', text: 'Backups: test restore of finance database on Monday: "failed at 62%: corrupt backup set". Previous successful test: 26 months ago', note: 'The control is not working. If recovery were needed today, the data might be lost.' },
              { id: 'z3', type: 'clue', clue: 'leavers', text: 'Leavers: 36 in 12 months. Accounts active more than 24 hours after leaving: 11. More than 30 days: 4', note: 'The control fails in nearly a third of cases, and four accounts remained open for a month.' },
              { id: 'z4', type: 'herring', text: 'Patching: 94% of critical patches applied within 14 days', note: 'A strong figure. It does not affect the three weak controls.' },
              { id: 'z5', type: 'herring', text: 'The training platform shows 97% completion', note: 'A good result and not the issue.' },
            ],
          },
          {
            id: 'history', title: 'Last year and the request',
            lines: [
              { id: 'z6', type: 'clue', clue: 'signoff', text: 'Last year: self-assessment, 40 of 40 effective. Audit: 5 controls ineffective, including access review and backups', note: 'Last year\'s tidy self-assessment was contradicted by the audit. A second tidy one would look worse.' },
              { id: 'z7', type: 'clue', clue: 'size', text: 'Staff: 1,600', note: 'Context.' },
              { id: 'z8', type: 'herring', text: 'The head of IT has a bonus linked to a clean audit', note: 'A pressure to be aware of. It is not evidence about the controls.' },
              { id: 'z9', type: 'herring', text: 'Audit fieldwork starts in two weeks', note: 'The time available.' },
              { id: 'z10', type: 'plain', text: 'Regulator question: "Please describe the controls in place to prevent the incident last March from recurring"', note: 'The answer must match what is true.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the head of IT wants all 40 marked effective',
        intro: 'The head of IT says: "I do not want to start the audit with a list of failures. Mark all 40 as effective. We will fix them after the audit. The auditors will not test everything."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Rate the controls on the evidence (three ineffective, the rest effective), attach a short remediation plan with owners and dates, and explain that auditors rate a company by how honestly it knows its own weaknesses, and that last year\'s all-effective rating was contradicted by the audit', set: { honest: true }, consequence: 'The head of IT is unhappy and then relieved. The auditors note the candid self-assessment, test the three controls, and agree the plan. The regulator receives an answer that matches.' },
          { id: 'soften', quality: 2, text: 'Rate the three weak controls "partially effective" rather than "ineffective", with the plan', set: { soften: true }, consequence: 'The auditors regard the three as ineffective anyway and ask why they were softened.' },
          { id: 'refuse', quality: 1, text: 'Refuse to complete the assessment until the controls are fixed', set: { refuse: true }, consequence: 'The self-assessment is completed by someone else, with every control rated effective.' },
          { id: 'tidy', quality: 0, text: 'Mark all 40 as effective, as asked', set: { tidy: true }, consequence: 'The auditors find the same five failures as last year, and write that management\'s self-assessment was not reliable. The regulator asks why the same controls were rated effective after a data incident.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement for the regulator',
        intro: 'A colleague has drafted the answer to the regulator\'s question.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Since the incident, we have found that access reviews for the finance systems have not been run for 14 months and have restarted them.', why: 'Supported, if reviews have restarted.' },
          { id: 'j2', sound: false, text: 'All controls to prevent a recurrence are in place and effective.', why: 'Contradicted. Three controls were found ineffective.' },
          { id: 'j3', sound: false, text: 'Backups of finance data are tested every quarter.', why: 'Contradicted. The last successful test was 26 months ago and the latest test failed.' },
          { id: 'j4', sound: true, text: 'In the last year, 11 of 36 leavers kept active accounts for over 24 hours, and the process is being changed.', why: 'Supported by the test.' },
          { id: 'j5', sound: false, text: 'The incident could not have been prevented.', why: 'Unsupported.' },
          { id: 'j6', sound: true, text: 'Corrective actions have named owners and completion dates.', why: 'Supported, if the plan exists.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the audit committee',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'Three of the five highest-risk controls tested are ineffective: the finance access review, backup restore and removal of leavers\' access.', why: 'Shown by the tests.' },
          { id: 'q2', correct: true, text: 'No finance access review has been done in 14 months, a test restore of the finance database failed this week, and 11 of 36 leavers kept access for over 24 hours.', why: 'Shown by the tests.' },
          { id: 'q3', correct: true, text: 'Last year\'s self-assessment rated all 40 controls effective, and the audit found five that were not.', why: 'Shown by the history.' },
          { id: 'q4', correct: true, text: 'We have tested the five highest-risk controls only, and the remaining 35 are rated on the owners\' evidence.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'All 40 controls are effective.', why: 'Contradicted.' },
          { id: 'q6', correct: false, text: 'The head of IT has acted dishonestly.', why: 'Unsupported.' },
          { id: 'q7', correct: false, text: 'The company\'s security is poor.', why: 'Overstated. Most controls look sound.' },
          { id: 'q8', when: 'honest', correct: true, text: 'The self-assessment rated three controls ineffective, with a remediation plan, and the auditors recognised the candour.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'soften', correct: true, text: 'The three weak controls were rated partially effective, and the auditors asked why they had been softened.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'The assessment was completed by someone else and rated every control effective.', why: 'An honest account.' },
          { id: 'q11', when: 'tidy', correct: true, text: 'All 40 controls were rated effective, and the auditors found the same failures and described the self-assessment as unreliable.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Restart the finance access review, fix the backup set and re-test the restore, and remove leavers\' access automatically.', why: 'Fixes the three failed controls.' },
          { id: 'a2', correct: true, text: 'Test more of the 35 remaining controls against evidence before the audit if time allows.', why: 'Extends the honest picture.' },
          { id: 'a3', correct: true, text: 'Answer the regulator with the true position and the corrective plan, matching the self-assessment.', why: 'Keeps the record consistent.' },
          { id: 'a4', correct: false, text: 'Rate all controls effective and fix problems after the audit.', why: 'Repeats last year\'s mistake.' },
          { id: 'a5', correct: false, text: 'Delay the audit until the controls are fixed.', why: 'Out of proportion.' },
        ],
      },
    ],
  },
];
