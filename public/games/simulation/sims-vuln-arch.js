// Vulnerability Management Lead simulations. Everything here is fictional.
//
// The tier's themes: making the case for a programme with honest numbers, knowing what a "closed" ticket
// really means, and giving a customer or an auditor the truth when a cleaner story is available.

const RATINGS = [
  { name: 'Ticket counter', blurb: 'The numbers looked busy and the risk stayed. Read each stage note: the job is fewer exploitable weaknesses, not fewer tickets.' },
  { name: 'Programme owner', blurb: 'You ran a real programme, with gaps in evidence, balance or honesty under pressure.' },
  { name: 'Programme lead', blurb: 'Measures that mean something, effort matched to risk, and the courage to give the real picture.' },
  { name: 'Risk leader', blurb: 'A programme the business funds because it can see what it buys, and an honesty that customers and auditors can rely on.' },
];

export const VULN_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'programme-case',
    title: 'Making the case',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The finance director wants to cut the vulnerability programme\'s budget by a quarter because "the numbers are flat". Show what the numbers really mean, spend what you keep well and decide how to answer.',
    brief: [
      'Contoso\'s vulnerability programme costs £620,000 a year. Open critical findings have stayed at about 400 for two quarters. The finance director has asked for a 25% cut, saying the programme "finds things but does not reduce them".',
      'You are the vulnerability management lead. You will rank what matters in the data, check what the 400 figure really hides, spend a limited budget of engineer-weeks, decide how to answer the cut, and review the summary before it goes to the executive team.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the points that tell the real story',
        intro: 'Tap the points in order, the most important for the executive team first. Think about what they say about risk, and how likely a reader is to misread them.',
        items: [
          { id: 'p1', source: 'Exploited', priority: 1, text: 'Of the 400 open critical findings, 38 are known to be exploited in the wild and 17 of those are on internet-facing systems.', why: 'These are the ones attackers use. The whole programme exists to close these first.' },
          { id: 'p2', source: 'Inflow', priority: 2, text: 'Scanning now covers 1,100 more assets than two quarters ago, so new findings arrive as fast as old ones are closed.', why: 'The flat number hides progress: the programme is finding more because it is looking at more.' },
          { id: 'p3', source: 'Time to fix', priority: 3, text: 'The time to fix a known-exploited critical finding has fallen from 41 days to 14.', why: 'A true measure of improvement, and the one that matters for risk.' },
          { id: 'p4', source: 'Count', priority: 4, text: 'The total number of open findings, all severities, is 12,400.', why: 'A large number that says little about risk and invites bad conclusions.' },
          { id: 'p5', source: 'Scans', priority: 5, text: 'The programme completed 96 scans last quarter.', why: 'An activity measure with no bearing on the outcome.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what the flat number really hides',
        intro: 'You have two quarters of programme data. Look for what explains the flat count. Flag only what the data supports.',
        clues: {
          coverage: { strength: 'strong', text: 'Scan coverage grew from 3,100 to 4,200 assets, and 1,100 newly scanned assets brought 280 new critical findings.' },
          fixes: { strength: 'strong', text: 'The programme closed 610 critical findings in two quarters, a record, and 560 of them were genuine fixes confirmed by a rescan.' },
          exploited: { strength: 'strong', text: 'Known-exploited criticals fell from 71 to 38, and from 29 to 17 on internet-facing systems.' },
          ttf: { strength: 'strong', text: 'The median time to close a known-exploited critical finding fell from 41 to 14 days.' },
          count: { strength: 'weak', text: 'The total number of open findings is 12,400, roughly flat.' },
        },
        artefacts: [
          {
            id: 'trend', title: 'Two-quarter trend',
            lines: [
              { id: 'k1', type: 'clue', clue: 'coverage', text: 'Assets scanned: 3,100 then 4,200 (+1,100). Critical findings on newly scanned assets: 280', note: 'Better coverage found more problems. A flat total is the sign of a programme seeing more, not fixing less.' },
              { id: 'k2', type: 'clue', clue: 'fixes', text: 'Critical findings closed in two quarters: 610 (previous two quarters: 380). Confirmed closed by rescan: 560', note: 'Real fixing, and checked. A 60% increase in closures.' },
              { id: 'k3', type: 'clue', clue: 'count', text: 'Open findings, all severities: 12,400 (two quarters ago: 12,300)', note: 'A flat total that conceals the shift in what matters.' },
              { id: 'k4', type: 'herring', text: 'Programme staff: 7, unchanged', note: 'A resource fact.' },
              { id: 'k5', type: 'plain', text: 'Scanner licence renewed at the same price', note: 'Context.' },
            ],
          },
          {
            id: 'risk', title: 'Risk measures',
            lines: [
              { id: 'k6', type: 'clue', clue: 'exploited', text: 'Known-exploited critical findings open: 38 (two quarters ago: 71). On internet-facing systems: 17 (two quarters ago: 29)', note: 'The measure closest to real risk has nearly halved.' },
              { id: 'k7', type: 'clue', clue: 'ttf', text: 'Median days to close a known-exploited critical finding: 14 (two quarters ago: 41)', note: 'Faster fixing of the dangerous ones. A strong improvement.' },
              { id: 'k8', type: 'herring', text: 'Reports sent to teams: 1,900', note: 'An activity measure.' },
              { id: 'k9', type: 'herring', text: 'Dashboard views by executives: 41', note: 'Not a result.' },
              { id: 'k10', type: 'plain', text: 'Exceptions granted: 22, all with owners and expiry', note: 'A well-run exception process.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'If the budget is cut, you must still use your time well. Spend all ten weeks across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Exploited', ideal: 4, text: 'Close the 38 known-exploited criticals, starting with the 17 on the internet.', why: 'The most dangerous findings.' },
          { id: 'e2', source: 'Measures', ideal: 2, text: 'Replace the headline total with risk measures: known-exploited findings open, time to fix and coverage of discovered assets.', why: 'Keeps the programme\'s value visible and stops people reading the wrong number.' },
          { id: 'e3', source: 'Coverage', ideal: 2, text: 'Finish bringing the remaining unscanned assets into scope.', why: 'Finds the hidden risk, though it adds findings.' },
          { id: 'e4', source: 'Automation', ideal: 2, text: 'Automate the rescan that confirms a fix and the routing of findings to the right team.', why: 'Reduces effort on the most repetitive part of the programme.' },
        ],
      },
      {
        id: 'cut', type: 'decision', title: 'Decide: how to answer the budget cut',
        intro: 'The finance director says: "The number has not moved. I want a quarter off the budget, and a short answer in one slide."',
        prompt: 'What do you do?',
        options: [
          { id: 'evidence', quality: 3, text: 'Show one slide with the three measures that matter (known-exploited findings nearly halved, fix time cut from 41 to 14 days, coverage up by a third) and explain that the total stayed flat because the programme now looks at more; offer a smaller saving from automation that does not reduce the work on the dangerous findings', set: { evidence: true }, consequence: 'The finance director sees the risk falling and agrees to a 5% saving from automation. The programme keeps its capacity for the work that matters.' },
          { id: 'accept', quality: 2, text: 'Accept the cut but ask for it to be spread across all activities equally', set: { accept: true }, consequence: 'Work on known-exploited findings slows with everything else, and fix time creeps back toward 25 days.' },
          { id: 'defend', quality: 1, text: 'Refuse any cut and send a long report', set: { defend: true }, consequence: 'The report is not read. The cut is made anyway, without your input on where it falls.' },
          { id: 'game', quality: 0, text: 'Reduce the scan scope so the open count drops, and present the lower number', set: { game: true }, consequence: 'The number falls and the risk does not. A customer audit later finds the unscanned systems.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the executive team',
        intro: 'A colleague has drafted the summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'q1', sound: true, text: 'Known-exploited critical findings have fallen from 71 to 38 over two quarters.', why: 'Supported by the risk measures.' },
          { id: 'q2', sound: false, text: 'The flat total shows that the programme is not reducing risk.', why: 'Contradicted. The total is flat because scanning now covers 1,100 more assets.' },
          { id: 'q3', sound: false, text: 'Risk has fallen to a low level.', why: 'Overstated. 38 known-exploited findings are still open, and 17 are on the internet.' },
          { id: 'q4', sound: true, text: 'The median time to fix a known-exploited critical finding fell from 41 to 14 days.', why: 'Supported.' },
          { id: 'q5', sound: false, text: 'The programme team has worked harder than any other team.', why: 'Unsupported and not relevant. Report results, not effort.' },
          { id: 'q6', sound: true, text: 'Better coverage found 280 new critical findings on assets that were not scanned before.', why: 'Supported.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the executive team',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not yet fixed.',
        statements: [
          { id: 'r1', correct: true, text: 'Known-exploited critical findings fell from 71 to 38, and from 29 to 17 on internet-facing systems.', why: 'Shown by the risk measures.' },
          { id: 'r2', correct: true, text: 'The median time to fix a known-exploited critical finding fell from 41 days to 14.', why: 'Shown by the risk measures.' },
          { id: 'r3', correct: true, text: 'The total open count stayed flat because scanning grew by 1,100 assets, which brought 280 new critical findings.', why: 'Shown by the trend.' },
          { id: 'r4', correct: true, text: 'Thirty-eight known-exploited findings remain open, and closing them is the priority.', why: 'An honest statement of what is not done.' },
          { id: 'r5', correct: false, text: 'The programme has removed the company\'s exposure to attack.', why: 'Overstated.' },
          { id: 'r6', correct: false, text: 'The programme costs too much.', why: 'Unsupported. The evidence shows value.' },
          { id: 'r7', correct: false, text: 'The finance director misunderstands the numbers.', why: 'A judgement about a colleague. Explain the numbers.' },
          { id: 'r8', when: 'evidence', correct: true, text: 'Three risk measures were shown and a 5% saving from automation was agreed, with capacity for dangerous findings protected.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'accept', correct: true, text: 'The cut was accepted across all activities, and fix time for dangerous findings began to rise.', why: 'An honest account.' },
          { id: 'r10', when: 'defend', correct: true, text: 'A long report was sent, the cut was made without input, and the programme lost control of where it fell.', why: 'An honest account.' },
          { id: 'r11', when: 'game', correct: true, text: 'Scan scope was reduced to lower the open count, and a later audit found the unscanned systems.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Report known-exploited findings open, time to fix and coverage of discovered assets, in place of the headline total.', why: 'Measures that reflect risk.' },
          { id: 'a2', correct: true, text: 'Close the 38 known-exploited findings, starting with the 17 on the internet.', why: 'The most dangerous work.' },
          { id: 'a3', correct: true, text: 'Automate rescans and routing to find savings that do not reduce work on dangerous findings.', why: 'A saving that does not cut capability.' },
          { id: 'a4', correct: false, text: 'Reduce scanning so the total looks lower.', why: 'Hides risk without removing it.' },
          { id: 'a5', correct: false, text: 'Cut the programme equally across every activity.', why: 'Slows the most valuable work.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'vm-lead-exam',
    title: 'Promotion exam: Vulnerability Management Lead',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A big customer wants proof of patching within a fortnight, the data is messy and a tidy answer is on offer. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso\'s largest customer, Fabrikam Retail, has asked for evidence that all critical vulnerabilities on the systems that handle its data were fixed within 14 days over the last year. The contract renewal depends on it. The sales director wants to send a confident answer by Friday.',
      'The case tests the role: ranking what matters, spending limited effort, working out what the data really shows, standing firm on an honest answer, and reporting accurately. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to do before answering the customer',
        intro: 'A first look at the data found five things. Rank them by how urgently they need dealing with before the answer goes out, highest first.',
        items: [
          { id: 'x1', source: 'Overdue and exploited', priority: 1, text: 'Six critical findings on systems that hold Fabrikam\'s data are still open, past 14 days, and two are known to be exploited.', why: 'A live exposure of the customer\'s data, and the facts the answer must be honest about.' },
          { id: 'x2', source: 'Closed but not fixed', priority: 2, text: 'Forty tickets for these systems are marked closed, but a rescan still finds the flaw.', why: 'The records overstate what was done. The answer cannot rely on them.' },
          { id: 'x3', source: 'Gaps in scanning', priority: 3, text: 'Two of the systems were not scanned for three months last year.', why: 'You cannot claim a fix within 14 days if you did not look.' },
          { id: 'x4', source: 'Process', priority: 4, text: 'The patching policy says 30 days, not 14, for criticals.', why: 'A mismatch to explain, and not the most urgent matter.' },
          { id: 'x5', source: 'Report format', priority: 5, text: 'The customer wants the evidence as a spreadsheet, not a PDF.', why: 'A format point with no bearing on the facts.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'You have ten engineer-days before Friday. Spend all ten across these four pieces of work.',
        items: [
          { id: 'y1', source: 'Fix', ideal: 3, text: 'Fix or mitigate the six open critical findings, starting with the two known to be exploited.', why: 'Reduces the real exposure.' },
          { id: 'y2', source: 'Verify', ideal: 3, text: 'Rescan the 40 closed tickets and the full list of systems, and rebuild the record from what the rescan confirms.', why: 'Gives an answer that stands up to checking.' },
          { id: 'y3', source: 'Gaps', ideal: 2, text: 'Work out which systems were not scanned and when, and state the gaps.', why: 'Needed for an honest answer.' },
          { id: 'y4', source: 'Write-up', ideal: 2, text: 'Prepare a clear, evidenced answer for the customer, with the gaps and the fixes stated.', why: 'The deliverable itself.' },
        ],
      },
      {
        id: 'data', type: 'evidence', title: 'Work out what the data really shows',
        intro: 'You have the ticket export and rescan results for the 31 systems that handle Fabrikam\'s data. Look for what matters. Flag only what the data supports.',
        clues: {
          closed: { strength: 'strong', text: 'Of 190 critical tickets closed over the year, 40 were marked "risk accepted" or "duplicate", and a rescan still finds the flaw on those systems.' },
          late: { strength: 'strong', text: '23 critical findings took longer than 14 days to fix, the longest 71 days.' },
          open: { strength: 'strong', text: 'Six critical findings are still open, and two are on the known-exploited list.' },
          gap: { strength: 'strong', text: 'Two systems have no scan records for three months last year.' },
          fast: { strength: 'weak', text: 'The median fix time for criticals was 9 days.' },
        },
        artefacts: [
          {
            id: 'tickets', title: 'Ticket export and rescan',
            lines: [
              { id: 'z1', type: 'clue', clue: 'closed', text: 'Critical tickets closed: 190. Closed as "risk accepted" (22) or "duplicate" (18): 40. Rescan this week: the flaw is still present on all 40', note: 'These are not fixes. A claim of "closed within 14 days" would be false for these.' },
              { id: 'z2', type: 'clue', clue: 'late', text: 'Critical findings fixed after more than 14 days: 23 of 190 (12%). Longest: 71 days', note: 'The 14-day claim is not true for all findings. The honest answer states the proportion.' },
              { id: 'z3', type: 'clue', clue: 'fast', text: 'Median time to fix a critical finding: 9 days', note: 'A good headline. The median hides the long tail and the closed-but-unfixed tickets.' },
              { id: 'z4', type: 'herring', text: 'The programme has won an internal award', note: 'No bearing on the data.' },
              { id: 'z5', type: 'herring', text: 'Number of different teams who own the 31 systems: 9', note: 'A fact about ownership, not about the answer.' },
            ],
          },
          {
            id: 'scan', title: 'Scan records and open findings',
            lines: [
              { id: 'z6', type: 'clue', clue: 'gap', text: 'Systems with no scan record for 14 weeks last year: pay-gw-02, crm-batch-01', note: 'You cannot say you fixed things within 14 days if the systems were not scanned for 14 weeks.' },
              { id: 'z7', type: 'clue', clue: 'open', text: 'Open critical findings on the 31 systems: 6, age 15 to 52 days. On the known-exploited list: 2 (on crm-web-03 and crm-api-01)', note: 'Two open, exploited flaws on systems that hold the customer\'s data, past the 14-day mark.' },
              { id: 'z8', type: 'herring', text: 'The customer\'s contract was signed in 2021', note: 'Not relevant to the evidence.' },
              { id: 'z9', type: 'herring', text: 'The sales director has been with Contoso for 15 years', note: 'No bearing on the facts.' },
              { id: 'z10', type: 'plain', text: 'Response needed by Friday', note: 'The time available.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the sales director wants a confident answer',
        intro: 'The sales director says: "The median is 9 days. Say that all criticals were fixed within 14 days, leave out the gaps and the open ones. If we are honest, we lose the renewal."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Send an honest answer that states the real position (about two thirds fixed within 14 days, the long tail, the 40 closed-not-fixed tickets now being fixed, the six open findings with dates, the scan gap), and offer the customer a follow-up evidence pack and a joint review once the open ones are closed', set: { honest: true }, consequence: 'The customer values the transparency. They ask for the review, find the remediation convincing, and renew with an added right to audit.' },
          { id: 'soft', quality: 2, text: 'State the fixed-within-14-days figure and the open findings, but leave out the closed-not-fixed tickets and the scan gap', set: { soft: true }, consequence: 'The answer is mostly true and incomplete. Months later the customer\'s own rescan finds the closed-not-fixed items and asks why they were not mentioned.' },
          { id: 'refuse', quality: 1, text: 'Refuse to answer until every finding is fixed', set: { refuse: true }, consequence: 'The customer treats the delay as evasion, and the sales director goes around you.' },
          { id: 'spin', quality: 0, text: 'Send the confident answer as the sales director asked', set: { spin: true }, consequence: 'The customer\'s auditors test one of the 40 systems, find the flaw and conclude that the answer was false. The contract is terminated and Contoso is accused of misleading them.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft answer to the customer',
        intro: 'A colleague has drafted the answer.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Of 190 critical tickets on the systems that handle your data, 127 were genuinely fixed within 14 days, 23 were fixed later (the longest after 71 days) and 40 were closed without a fix.', why: 'Supported by the ticket export.' },
          { id: 'j2', sound: false, text: 'All critical findings were fixed within 14 days.', why: 'Contradicted. 23 took longer, and 6 are still open.' },
          { id: 'j3', sound: false, text: 'The 40 tickets closed as risk accepted or duplicate were fixed.', why: 'Contradicted. A rescan still finds the flaw on all 40.' },
          { id: 'j4', sound: true, text: 'Two systems were not scanned for 14 weeks last year, so we cannot give evidence for that period.', why: 'Supported by the scan records.' },
          { id: 'j5', sound: false, text: 'No customer data has been exposed.', why: 'Unsupported. Two exploited findings are open on systems that hold the data.' },
          { id: 'j6', sound: true, text: 'Six critical findings remain open, and fixes are scheduled with dates.', why: 'Supported and honest.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your answer for the customer',
        intro: 'Your own answer. Include what the data supports and be honest about the gaps.',
        statements: [
          { id: 'q1', correct: true, text: 'Of 190 critical tickets, 127 were fixed within 14 days, 23 were fixed later (the longest after 71 days) and 40 were closed without a fix.', why: 'Shown by the export.' },
          { id: 'q2', correct: true, text: 'Forty tickets were closed as risk accepted or duplicate, and a rescan shows the flaw is still present; we are fixing them.', why: 'Shown by the rescan.' },
          { id: 'q3', correct: true, text: 'Six critical findings are open, two of them known to be exploited, and fixes are scheduled with dates.', why: 'Shown by the open findings.' },
          { id: 'q4', correct: true, text: 'Two systems were not scanned for 14 weeks last year, so we cannot evidence that period, and we have corrected the process.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'We have met the 14-day target in full.', why: 'Contradicted.' },
          { id: 'q6', correct: false, text: 'Your data has been stolen.', why: 'Unsupported.' },
          { id: 'q7', correct: false, text: 'Our vulnerability programme is poor.', why: 'Unsupported. It is good and has gaps to be honest about.' },
          { id: 'q8', when: 'honest', correct: true, text: 'The customer was given the real position and a follow-up review, and renewed with an added right to audit.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'soft', correct: true, text: 'The fixed-within-14-days figure and open findings were stated, and the closed-not-fixed tickets and scan gap were left out, which the customer later found.', why: 'An honest account of a partial answer.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'No answer was given until everything was fixed, and the delay was seen as evasion.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'spin', correct: true, text: 'A confident answer was sent that the data did not support, and the contract was terminated when the customer\'s auditors found the flaw.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Fix or mitigate the six open critical findings, starting with the two known to be exploited.', why: 'Reduces the live exposure.' },
          { id: 'a2', correct: true, text: 'Reopen and fix the 40 tickets that were closed without a fix, and change how tickets can be closed so a rescan must confirm the fix.', why: 'Stops the records overstating the work.' },
          { id: 'a3', correct: true, text: 'Close the scan gaps and offer the customer a follow-up evidence pack and a joint review.', why: 'Rebuilds trust with honest evidence.' },
          { id: 'a4', correct: false, text: 'Send the median figure and leave out the rest.', why: 'Misleading by omission.' },
          { id: 'a5', correct: false, text: 'Close the open tickets so the numbers look better.', why: 'Repeats the original problem.' },
        ],
      },
    ],
  },
];
