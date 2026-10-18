// Senior Vulnerability Management simulations. Everything here is fictional.
//
// The tier's themes: running a programme rather than a single scan, measuring it honestly, and holding the
// line on the numbers when leadership wants a cleaner headline than the facts support.

const RATINGS = [
  { name: 'Green on paper', blurb: 'The numbers looked good and the risk stayed. Read each stage note: a metric that cannot be wrong is not a metric.' },
  { name: 'Running scans', blurb: 'You fixed real things, with gaps in priorities, evidence or how you reported it.' },
  { name: 'Programme lead', blurb: 'Sound priorities, honest measures, and a programme that stays useful as it grows.' },
  { name: 'Risk leader', blurb: 'Measures leadership can trust, effort spent where risk is highest, and the judgement to hold a line.' },
];

export const VULN_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'honest-dashboard',
    title: 'The dashboard that looks green',
    skill: 'hardening',
    minutes: 22,
    blurb: 'The vulnerability dashboard says 97% of systems are patched. Check what the number really covers, spend a small budget well and decide what the board is told.',
    brief: [
      'Contoso\'s vulnerability dashboard has been green for three quarters: 97% of assets are "compliant". The board likes it. Last week an external tester reached the company\'s internal network through a server that was on no report.',
      'You are the senior vulnerability management analyst. You will rank what is wrong with the programme, check what the dashboard really measures, spend a limited budget of engineer-weeks, decide what to tell the board, and check the draft before it goes out.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the weaknesses in the programme',
        intro: 'Tap the weaknesses in order, the most serious first. Think about how much risk is hidden, how likely it is to matter, and how hard it is to put right.',
        items: [
          { id: 'w1', source: 'Coverage', priority: 1, text: 'The dashboard only counts assets that are in the asset register. Nobody compares the register with what is actually on the network.', why: 'Anything not in the register is never scanned and never reported. The tester reached the network through exactly this kind of system.' },
          { id: 'w2', source: 'Exceptions', priority: 2, text: 'Systems with an approved exception are removed from the percentage. There are 410 exceptions, 160 of them past their review date.', why: 'The compliant figure is flattered by hiding exactly the systems that are not fixed. The review dates show nobody is checking.' },
          { id: 'w3', source: 'Measure', priority: 3, text: 'The headline measure counts every finding equally, so one critical flaw and one cosmetic issue are worth the same.', why: 'A percentage by count can rise while the dangerous issues stay. It does not describe risk.' },
          { id: 'w4', source: 'Timing', priority: 4, text: 'Scans run monthly, so a new critical flaw can sit for up to four weeks before it is seen.', why: 'A real delay, but easier to improve once the coverage and the measure are fixed.' },
          { id: 'w5', source: 'Reports', priority: 5, text: 'Reports go out as a spreadsheet that takes a day to assemble.', why: 'Inefficient. It does not hide any risk.' },
        ],
      },
      {
        id: 'records', type: 'evidence', title: 'Check what the dashboard really measures',
        intro: 'You have the asset register, the network discovery results and the exception list. Look for the facts that decide the plan. Flag only what the records support.',
        clues: {
          gap: { strength: 'strong', text: 'Network discovery found 4,060 live addresses. The asset register lists 3,100, so 960 are unknown to the programme.' },
          excluded: { strength: 'strong', text: 'The 97% figure excludes the 410 systems with exceptions. Counting them, 84% of assets are fully patched.' },
          crit: { strength: 'strong', text: 'Of the 410 excepted systems, 63 carry a critical vulnerability that is known to be exploited.' },
          stale: { strength: 'strong', text: '160 exceptions are past their review date, the oldest by 19 months.' },
          speed: { strength: 'weak', text: 'The monthly scan means a new critical flaw can go unseen for up to four weeks.' },
        },
        artefacts: [
          {
            id: 'coverage', title: 'Register versus discovery',
            lines: [
              { id: 'k1', type: 'clue', clue: 'gap', text: 'Asset register: 3,100 assets. Addresses responding on the network (discovery, last week): 4,060. Matched: 3,100. Unmatched: 960 (38 reachable from the internet)', note: 'Almost a thousand systems nobody scans, including 38 on the internet. This is where the tester got in.' },
              { id: 'k2', type: 'clue', clue: 'speed', text: 'Scan schedule: monthly, first weekend of the month. Critical flaw announcements: about 6 a month', note: 'A genuine delay, but a smaller problem than coverage.' },
              { id: 'k3', type: 'herring', text: 'Scanner licence: 3,500 assets, renewed last quarter', note: 'Budget detail with no bearing on what is covered.' },
              { id: 'k4', type: 'herring', text: 'Scans take an average of 6 hours to complete', note: 'A performance figure.' },
              { id: 'k5', type: 'plain', text: 'Discovery scan has never been run before last week', note: 'Explains why the gap was never seen.' },
            ],
          },
          {
            id: 'exceptions', title: 'Exceptions and the headline figure',
            lines: [
              { id: 'k6', type: 'clue', clue: 'excluded', text: 'Compliance = patched assets / (all assets minus excepted assets) = 2,609 / 2,690 = 97%. Counting every asset: 2,609 / 3,100 = 84%', note: 'The way the number is calculated hides the 410 systems that are not fixed. The honest figure is far lower.' },
              { id: 'k7', type: 'clue', clue: 'crit', text: 'Excepted systems with a critical, known-exploited vulnerability: 63', note: 'These are the dangerous ones, and they are all outside the headline figure.' },
              { id: 'k8', type: 'clue', clue: 'stale', text: 'Exceptions past review date: 160 (oldest: 19 months). Reviewer on 112 of them: a person who has left the company', note: 'No one is looking at the exceptions, and some have no owner at all.' },
              { id: 'k9', type: 'herring', text: 'Exception request form completion time: 4 minutes on average', note: 'A process detail with no bearing on the finding.' },
              { id: 'k10', type: 'plain', text: 'Dashboard colour thresholds: green above 95%', note: 'Why it has looked green for so long.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work this quarter.',
        items: [
          { id: 'e1', source: 'Coverage', ideal: 3, text: 'Run discovery every week, reconcile it with the register, and get the 960 unknown systems owned, scanned or removed, starting with the 38 on the internet.', why: 'The biggest hidden risk and a substantial job.' },
          { id: 'e2', source: 'Exceptions', ideal: 3, text: 'Review every exception, starting with the 63 with a known-exploited flaw; give each an owner and an expiry, and fix or isolate the worst.', why: 'The dangerous systems currently sit outside every figure.' },
          { id: 'e3', source: 'Measure', ideal: 2, text: 'Replace the headline with measures that reflect risk: known-exploited flaws open and how long, exceptions by age, and coverage of discovered systems.', why: 'Honest numbers are what keep the programme funded and trusted.' },
          { id: 'e4', source: 'Timing', ideal: 2, text: 'Scan internet-facing systems daily and trigger a scan when a new critical flaw is announced.', why: 'Shrinks the time a serious flaw can sit unseen.' },
        ],
      },
      {
        id: 'board', type: 'decision', title: 'Decide: what the board is told',
        intro: 'The CIO says: "The board is happy with 97%. A drop to 84% will look like we have failed. Keep reporting 97% and tell them about the new measures next quarter."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Show both figures side by side with a plain explanation: the old method hid 410 excepted systems and 960 unknown ones; the new method is the true position; here is the plan to improve it and the expected trend over two quarters', set: { honest: true }, consequence: 'The board is surprised and then supportive. The CIO is credited with finding the gap, and the plan is funded.' },
          { id: 'both', quality: 2, text: 'Report the old figure with a footnote explaining that excepted systems are excluded', set: { both: true }, consequence: 'It is technically honest and nobody reads footnotes. The board still thinks 97% of systems are patched.' },
          { id: 'delay', quality: 1, text: 'Agree to wait a quarter, keep the old figure and prepare the new measures', set: { delay: true }, consequence: 'A tester\'s report names an unscanned server. The board asks why they were told 97%.' },
          { id: 'keep', quality: 0, text: 'Keep reporting 97% as the CIO asked', set: { keep: true }, consequence: 'Six months later an attacker uses an unscanned server to get in. The board finds that the figure was known to be misleading.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft board paper',
        intro: 'A colleague has drafted the board paper.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Network discovery found 960 systems that are not in the asset register, so they are not scanned or reported.', why: 'Supported by the discovery results.' },
          { id: 'p2', sound: false, text: 'The 63 excepted systems with a known-exploited flaw have been attacked.', why: 'Unsupported. They are exposed, and the records do not show attacks.' },
          { id: 'p3', sound: false, text: 'A 97% compliance figure shows the programme is working well.', why: 'The calculation excludes the systems that are not fixed.' },
          { id: 'p4', sound: true, text: 'Counting every asset, 84% are fully patched, against the 97% reported.', why: 'Supported by the calculation.' },
          { id: 'p5', sound: false, text: 'The previous reports were deliberately misleading.', why: 'Unsupported. The method was a design flaw, and no one has shown it was intended.' },
          { id: 'p6', sound: true, text: 'Reporting known-exploited flaws open and exceptions by age gives a truer picture of risk than a percentage of findings.', why: 'Well-founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'The 97% figure excludes 410 systems with exceptions; including them, 84% of assets are fully patched.', why: 'Shown by the calculation.' },
          { id: 'r2', correct: true, text: '960 systems on the network are not in the asset register, 38 of them reachable from the internet, so they are not scanned.', why: 'Shown by the discovery results.' },
          { id: 'r3', correct: true, text: '63 excepted systems carry a flaw that is known to be exploited, and 160 exceptions are past their review date.', why: 'Shown by the exception records.' },
          { id: 'r4', correct: true, text: 'It is not yet known what is on the 960 unregistered systems, and there is no evidence yet that any of them has been attacked.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The company has been breached.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The previous reporting was fraudulent.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Vulnerability management is not worth the investment.', why: 'Not what the evidence supports.' },
          { id: 'r8', when: 'honest', correct: true, text: 'Both figures were shown side by side with a plan and an expected trend, and the plan was funded.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'both', correct: true, text: 'The old figure was reported with a footnote, and the board still believed 97% of systems were patched.', why: 'An honest account.' },
          { id: 'r10', when: 'delay', correct: true, text: 'The board was told the old figure for another quarter, and a tester\'s report then named an unscanned server.', why: 'An honest account of the cost of waiting.' },
          { id: 'r11', when: 'keep', correct: true, text: 'The 97% figure was reported again although the programme knew it left out 410 systems and 960 unknown ones.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Run discovery weekly and reconcile it with the register, starting with internet-facing systems.', why: 'Finds the hidden risk.' },
          { id: 'a2', correct: true, text: 'Review every exception, with an owner and an expiry for each, and fix or isolate those with known-exploited flaws first.', why: 'Brings the worst systems back into view.' },
          { id: 'a3', correct: true, text: 'Report measures that reflect risk (known-exploited flaws open and their age, exceptions by age, coverage of discovered systems).', why: 'Makes the numbers trustworthy.' },
          { id: 'a4', correct: false, text: 'Remove the exception process.', why: 'Some exceptions are legitimate. The problem is that nobody reviews them.' },
          { id: 'a5', correct: false, text: 'Wait for the next external test to show what is wrong.', why: 'The test already showed it.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'vm-senior-exam',
    title: 'Promotion exam: Senior Vulnerability Analyst',
    skill: 'hardening',
    minutes: 28,
    blurb: 'An audit in three weeks, twelve thousand findings and a division that wants a blanket exception. Silver or better to pass.',
    brief: [
      'This is your promotion exam. An external audit starts in three weeks. The vulnerability register holds 12,000 open findings. The manufacturing division wants a blanket exception for its older systems because its monthly production run cannot stop, and the CFO wants the audit to show no critical findings.',
      'The case tests the role: ranking what to do first, spending limited effort, working out what is really in the numbers, standing firm on an honest position, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to deal with before the audit',
        intro: 'A first look at the register found five groups of findings. Rank them by the risk they pose to the company, highest first.',
        items: [
          { id: 'x1', source: 'Internet-facing', priority: 1, text: '41 critical findings on internet-facing systems, 9 of them known to be exploited.', why: 'Reachable by anyone and already used by attackers. The most urgent.' },
          { id: 'x2', source: 'Manufacturing', priority: 2, text: '2,300 findings on older manufacturing systems that cannot be patched without a production stop, including 18 critical.', why: 'Hard to fix and high impact. They need protecting by other means while a patch window is arranged.' },
          { id: 'x3', source: 'Internal servers', priority: 3, text: '310 high-severity findings on internal servers, none known to be exploited.', why: 'Real, and a good target for the normal patching cycle. Less urgent than the first two.' },
          { id: 'x4', source: 'Laptops', priority: 4, text: '5,600 findings on laptops, mostly out-of-date applications that update themselves.', why: 'A large count with low risk, and most will clear on their own.' },
          { id: 'x5', source: 'Informational', priority: 5, text: '3,700 informational findings about banners, headers and certificates.', why: 'Noise for this exercise. No exposure.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'Spend all ten days across these four pieces of work in the next three weeks.',
        items: [
          { id: 'y1', source: 'Internet-facing', ideal: 4, text: 'Fix or mitigate the 41 critical findings on internet-facing systems, starting with the nine known to be exploited.', why: 'The most urgent and the largest piece of work.' },
          { id: 'y2', source: 'Manufacturing', ideal: 3, text: 'Protect the older manufacturing systems: separate them on the network, restrict who can reach them and monitor them, and book the patch window.', why: 'Cannot patch now, so protect now.' },
          { id: 'y3', source: 'Internal servers', ideal: 2, text: 'Schedule the 310 high findings into the normal patching cycle.', why: 'A reasonable share of effort.' },
          { id: 'y4', source: 'Reporting', ideal: 1, text: 'Prepare an audit pack that shows the real position, the exceptions with owners and dates, and the plan.', why: 'Needed, and a smaller job once the rest is clear.' },
        ],
      },
      {
        id: 'register', type: 'evidence', title: 'Work out what is really in the numbers',
        intro: 'You have the findings export and the manufacturing division\'s exception request. Check them for what matters. Flag only what the records support.',
        clues: {
          exploited: { strength: 'strong', text: 'Nine of the internet-facing critical findings are on a list of flaws known to be exploited in the wild.' },
          reach: { strength: 'strong', text: 'The manufacturing systems are on the same network as the office, and a scanner found one of them answering on the remote desktop port.' },
          blanket: { strength: 'strong', text: 'The blanket exception request has no expiry date, no owner and no compensating controls.' },
          audit: { strength: 'strong', text: 'The audit scope explicitly includes exceptions and requires an owner, an expiry and a compensating control for each.' },
          age: { strength: 'weak', text: 'The oldest manufacturing system was installed 14 years ago.' },
        },
        artefacts: [
          {
            id: 'export', title: 'Findings export and network position',
            lines: [
              { id: 'z1', type: 'clue', clue: 'exploited', text: 'Internet-facing, critical: 41. Present on the known-exploited list: 9. First seen: between 11 and 54 days ago', note: 'Nine flaws that attackers are using, on systems anyone can reach, left open for weeks. This is the most urgent group.' },
              { id: 'z2', type: 'clue', clue: 'reach', text: 'Manufacturing zone: same network as office laptops. MFG-PLC-GW-02 answers on port 3389 to any internal address', note: 'The old systems cannot be patched, and they are not protected either. An office compromise reaches them.' },
              { id: 'z3', type: 'herring', text: 'Total open findings: 12,000, down from 12,400 last quarter', note: 'A count that looks like progress and says nothing about risk.' },
              { id: 'z4', type: 'herring', text: 'Average age of laptop findings: 9 days', note: 'Fresh and self-clearing. Not a priority.' },
              { id: 'z5', type: 'plain', text: 'Audit fieldwork begins in 15 working days', note: 'The time available.' },
            ],
          },
          {
            id: 'request', title: 'The exception request and the audit scope',
            lines: [
              { id: 'z6', type: 'clue', clue: 'blanket', text: 'Request from Manufacturing: "Exempt all manufacturing systems from patching and scanning, permanently. Owner: the plant. Expiry: none. Controls: none."', note: 'A blanket, permanent exception with no owner of substance and no protection. It is the opposite of what an exception is meant to be.' },
              { id: 'z7', type: 'clue', clue: 'audit', text: 'Audit scope (section 4.2): "Auditors will review all exceptions. Each must have a named owner, an expiry date and compensating controls."', note: 'The request as written would fail the audit by itself. A proper exception would pass.' },
              { id: 'z8', type: 'clue', clue: 'age', text: 'MFG-LINE-04 control system: installed 14 years ago; vendor support ended 6 years ago', note: 'It explains why patching is hard. It does not change what must be done to protect the system.' },
              { id: 'z9', type: 'herring', text: 'Manufacturing division head is also on the audit committee', note: 'It may explain the pressure. It does not change the evidence.' },
              { id: 'z10', type: 'herring', text: 'The monthly production run is worth £2.4 million', note: 'A reason the stop is costly, not a reason to leave the systems unprotected.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the CFO wants no critical findings in the audit',
        intro: 'The CFO says: "I want the audit to show no critical findings. Approve the manufacturing exception as asked, and mark the 41 internet-facing ones as accepted risk so they drop off the report."',
        prompt: 'What do you do?',
        options: [
          { id: 'real', quality: 3, text: 'Decline to hide anything, and offer what will pass: fix or mitigate the 41 internet-facing findings before the audit, grant manufacturing a time-limited exception with a named owner and compensating controls, and give the CFO a short note on the real position and what will be closed by the audit date', set: { real: true }, consequence: 'Most of the internet-facing findings are closed by the audit date. The manufacturing exception is accepted by the auditors because it has an owner, an expiry and controls. The CFO has an honest message for the committee.' },
          { id: 'partial', quality: 2, text: 'Grant the manufacturing exception with an owner and expiry, but mark the 41 as accepted risk until after the audit', set: { partial: true }, consequence: 'The audit finds the accepted-risk findings on exploited internet-facing systems and records that the risk acceptance was inappropriate.' },
          { id: 'refuse', quality: 1, text: 'Refuse all exceptions and tell the CFO the audit will show what it shows', set: { refuse: true }, consequence: 'The manufacturing division escalates over your head, and the exceptions that are granted have no controls at all.' },
          { id: 'agree', quality: 0, text: 'Approve both requests as asked', set: { agree: true }, consequence: 'The auditors find nine exploited flaws marked as accepted risk and a permanent exception with no owner. The report is worse than the findings themselves.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft audit statement',
        intro: 'A colleague has drafted the statement for the auditors.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Nine internet-facing critical findings are on the known-exploited list and are being fixed or mitigated before the audit.', why: 'Supported by the export and the plan.' },
          { id: 'j2', sound: false, text: 'Manufacturing systems are not exposed because they cannot be patched.', why: 'The reverse is true. Unpatched systems need protection by other means.' },
          { id: 'j3', sound: false, text: 'The register has no critical findings.', why: 'Contradicted by the export: there are 41 on internet-facing systems alone.' },
          { id: 'j4', sound: true, text: 'The manufacturing exception will have an owner, an expiry date and compensating controls, as the audit scope requires.', why: 'Supported by the audit scope.' },
          { id: 'j5', sound: false, text: 'The manufacturing division is refusing to cooperate.', why: 'Unsupported and unfair. They have a real production constraint.' },
          { id: 'j6', sound: true, text: 'Separating the old systems from the office network and restricting access reduces risk where a patch is not possible.', why: 'Sound compensating controls.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the audit committee',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: '41 critical findings sit on internet-facing systems, and nine of them are on the known-exploited list.', why: 'Shown by the export.' },
          { id: 'q2', correct: true, text: 'The older manufacturing systems cannot be patched without a production stop, and are currently reachable from the office network.', why: 'Shown by the records.' },
          { id: 'q3', correct: true, text: 'The manufacturing exception request as written has no owner, expiry or compensating controls and does not meet the audit scope.', why: 'Shown by the request and the scope.' },
          { id: 'q4', correct: true, text: 'It is not known whether any of these findings has been exploited in Contoso, and no evidence of that has been found.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'The company has already been breached through these findings.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'The manufacturing division is negligent.', why: 'A judgement about people.' },
          { id: 'q7', correct: false, text: 'All findings will be closed before the audit.', why: 'Overstated. The priority groups will be, not all 12,000.' },
          { id: 'q8', when: 'real', correct: true, text: 'The internet-facing findings were fixed or mitigated before the audit, and manufacturing has a time-limited exception with an owner and compensating controls.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'partial', correct: true, text: 'The manufacturing exception met the audit scope, but nine exploited internet-facing flaws were marked accepted risk and the auditors recorded this as inappropriate.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'All exceptions were refused, the division escalated and the exceptions that were eventually granted had no compensating controls.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'Both requests were approved as asked, and the auditors recorded exploited internet-facing flaws accepted as risk and a permanent exception with no owner.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Fix or mitigate the 41 internet-facing critical findings, starting with the nine known to be exploited.', why: 'The most urgent risk.' },
          { id: 'a2', correct: true, text: 'Replace the blanket exception with a time-limited one that has a named owner and compensating controls, and book the patch window.', why: 'Meets the need and the audit scope.' },
          { id: 'a3', correct: true, text: 'Separate the manufacturing systems from the office network and restrict and monitor access to them.', why: 'Protects what cannot be patched.' },
          { id: 'a4', correct: false, text: 'Hide the findings from the audit report.', why: 'Dishonest and the auditors will find them.' },
          { id: 'a5', correct: false, text: 'Stop production to patch everything in one weekend.', why: 'Out of proportion and risky.' },
        ],
      },
    ],
  },
];
