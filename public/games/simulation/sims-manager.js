// Manager-level simulations: running a SOC rather than working an incident. Everything here is
// fictional. IP addresses come from the reserved documentation ranges
// (203.0.113.0/24, 198.51.100.0/24).
//
// The skills are about capacity, risk and honest reporting: spending limited people and money
// where they matter, reading metrics critically, and telling the board the truth in a form it can
// act on. They use the same stage types as the other simulations, plus `allocate` (see engine.js).

const RATINGS = [
  { name: 'Overstretched', blurb: 'Resources and messages went to the loudest demand, not the biggest risk. Read each stage note: management is mostly about what you choose not to do.' },
  { name: 'Managing', blurb: 'You kept things running, with gaps in priorities, evidence or how you reported.' },
  { name: 'SOC manager', blurb: 'Resources followed risk, the numbers were read critically and the reporting was honest.' },
  { name: 'Security leader', blurb: 'Well-judged priorities and allocations, metrics that were challenged rather than trusted, and reporting a board can rely on.' },
];

export const MANAGER = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'night-shift',
    title: 'Operation Short Staffed',
    skill: 'data',
    minutes: 22,
    blurb: 'You are acting SOC manager with a stretched team. Decide where people go, read what the dashboards really say, and report honestly to the CIO.',
    brief: [
      'It is Monday 08:00 and you have been made acting manager of the SOC while your manager is away. The team should be ten analysts. Today it is eight, and the demands on them are bigger than ever.',
      'The CIO is asking why the team keeps missing deadlines, and a junior team lead has drafted a monthly report to send up. Before anything goes out you need to decide where your people go, find out what the numbers really show, and make sure what you tell leadership is true.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'staffing', type: 'allocate', unit: 'analysts', budget: 8, title: 'Assign today\'s eight analysts',
        intro: 'You have eight analysts for five demands. Give each demand a number of analysts, using all eight. Think about what is live, what has a deadline and what fixes the root cause.',
        items: [
          { id: 'live', source: 'Incident', ideal: 3, text: 'A live ransomware investigation on the finance servers, needing round-the-clock cover.', why: 'Active, high-impact harm that cannot wait. It needs the biggest share, and enough people to rotate.' },
          { id: 'phish', source: 'Queue', ideal: 2, text: 'The phishing queue: 140 reports, 30 of which were clicked.', why: 'A real risk of stolen credentials, but each report is quick. A pair clears it and watches for follow-up.' },
          { id: 'audit', source: 'Compliance', ideal: 1, text: 'Evidence collection for an external audit due on Friday.', why: 'A firm deadline, but the work is steady and predictable. One person can keep it on track.' },
          { id: 'train', source: 'People', ideal: 1, text: 'Onboarding for two new starters, who need a mentor.', why: 'New starters make the team stronger and leave quickly if ignored. A mentor each day is enough.' },
          { id: 'tuning', source: 'Project', ideal: 1, text: 'Tuning the alerts that cause most of the false positives.', why: 'It is the long-term fix for the overload. Give it a little protected time or it never happens.' },
        ],
      },
      {
        id: 'numbers', type: 'evidence', title: 'Find out what the dashboards really say',
        intro: 'Everything looks green on the dashboard the CIO sees. Work out what is genuinely behind it. Flag only what you can support: anything that is just a good-sounding number stays out.',
        clues: {
          autoclose: { strength: 'strong', text: 'An auto-close rule introduced in March has been closing 31% of alerts untouched.' },
          clock: { strength: 'strong', text: 'The 40% fall in response time only happened because the timer now stops when a ticket is first assigned, not when it is resolved.' },
          overtime: { strength: 'strong', text: 'Analysts averaged about nine hours of unpaid overtime a week over the last quarter.' },
          leavers: { strength: 'strong', text: 'Two experienced analysts resigned in the last eight weeks, and both cited workload.' },
          volume: { strength: 'weak', text: 'Phishing reports from staff are up 25%, which may reflect better awareness as well as more attacks.' },
        },
        artefacts: [
          {
            id: 'dash', title: 'The CIO\'s dashboard and the data behind it',
            lines: [
              { id: 'n1', type: 'clue', clue: 'autoclose', text: 'Alerts handled: 4,100 this month. 31% closed by rule "AUTO-LOW-RISK" with no analyst action (rule created in March).', note: 'The "handled" figure includes alerts nobody looked at. It is not wrong, but it is not what it appears to be.' },
              { id: 'n2', type: 'clue', clue: 'clock', text: 'Mean time to respond: 41 min (was 68 min). Clock definition changed in April: "stops at first assignment".', note: 'The metric was redefined. The apparent improvement comes from changing how it is measured, not from the team working faster.' },
              { id: 'n3', type: 'herring', text: 'Detection rules in production: 640 (up from 590)', note: 'A count of rules says nothing about how good they are or whether anybody can respond to them.' },
              { id: 'n4', type: 'herring', text: 'The SOC won the internal "Team of the Quarter" award', note: 'Good for morale, and a reminder of effort, but it does not measure workload or risk.' },
            ],
          },
          {
            id: 'people', title: 'People and workload records',
            lines: [
              { id: 'n5', type: 'clue', clue: 'overtime', text: 'Timesheets: average 9.1 hours a week beyond contracted hours across the 8 analysts last quarter; none of it paid or taken back.', note: 'Sustained unpaid overtime is a retention and quality risk, and it hides the real capacity shortfall.' },
              { id: 'n6', type: 'clue', clue: 'leavers', text: 'HR: 2 analysts resigned in the last 8 weeks. Exit interviews: "workload" and "no time to learn".', note: 'Losing experienced people makes the shortfall worse. It is the clearest sign that the numbers hide a problem.' },
              { id: 'n7', type: 'clue', clue: 'volume', text: 'Phishing reports from staff: 1,250 this month (was 1,000).', note: 'More reports could mean more attacks or better reporting habits. It is context, not a conclusion.' },
              { id: 'n8', type: 'herring', text: 'SIEM licence renewed for another year at the same price', note: 'Routine procurement with no bearing on capacity.' },
              { id: 'n9', type: 'herring', text: 'Analyst average tenure: 3.1 years', note: 'An average that includes the two who have just left, so it needs care, and says nothing about workload.' },
            ],
          },
        ],
      },
      {
        id: 'cover', type: 'decision', title: 'Decide: cover the night shift',
        intro: 'Two analysts on tonight\'s shift have called in sick, and the ransomware investigation needs overnight cover. You cannot split the day team any further.',
        prompt: 'What do you do?',
        options: [
          { id: 'partner', quality: 3, text: 'Use your contracted managed-detection partner for overnight triage this week, pause the lowest-value project work, agree fair time off in lieu with the team, and tell your director plainly where the risk is', set: { partner: true }, consequence: 'Nights are covered by people who are rested and trained for it. The team sees you protecting them, and leadership knows the risk and what you have done about it.' },
          { id: 'overtime', quality: 2, text: 'Ask the day team to stay late and take the nights in turn for the week', set: { overtime: true }, consequence: 'The nights are covered, but people who are already tired make mistakes, and another resignation follows.' },
          { id: 'thin', quality: 1, text: 'Cover nights with a single analyst and say nothing, hoping it stays quiet', set: { thin: true }, consequence: 'An alert at 02:00 waits 40 minutes for one overloaded person. Nobody above you knows the cover was that thin.' },
          { id: 'blind', quality: 0, text: 'Switch off non-critical overnight alerting for the week to save effort', set: { blind: true }, consequence: 'You have made yourself blind during a live ransomware incident, and a real alert goes unseen.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft report to the CIO',
        intro: 'Your team lead, Chris, has drafted the monthly report. It will shape how leadership sees the team, so it has to be right.',
        draftIntro: 'Read each line of Chris\'s draft. Flag every claim that is wrong, misleading or unsupported, so it can be fixed before it goes out.',
        statements: [
          { id: 'd1', sound: true, text: 'We handled 4,100 alerts this month; 31% were closed automatically by a rule introduced in March.', why: 'Accurate and complete: it tells the reader how many were closed without analyst review.' },
          { id: 'd2', sound: false, text: 'Response times improved by 40%, which shows the team is working faster.', why: 'Misleading. The improvement comes from redefining how the timer works, not from faster work. Report the old and new methods side by side.' },
          { id: 'd3', sound: false, text: '98% of alerts were investigated by an analyst.', why: 'Contradicted by the data: nearly a third were closed by a rule with no analyst involved.' },
          { id: 'd4', sound: true, text: 'Two analysts have resigned in the last eight weeks, and both gave workload as a reason.', why: 'Supported by the HR records and exit interviews.' },
          { id: 'd5', sound: false, text: 'The team is coping well with current staffing.', why: 'Unsupported. Nine hours of unpaid overtime a week and two resignations suggest the opposite.' },
          { id: 'd6', sound: true, text: 'Analysts worked about nine hours of unpaid overtime a week on average last quarter.', why: 'Supported by the timesheets.' },
          { id: 'd7', sound: false, text: 'Automation means we do not need to recruit.', why: 'Overstated. The automation is part of the problem, and nothing shows it can replace the capacity that has been lost.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the director',
        intro: 'This is your own account of the day, for your director. Include what the evidence supports, be honest about your own choices, and recommend sensible actions.',
        statements: [
          { id: 's1', correct: true, text: 'About 31% of this month\'s alerts were closed by an automatic rule without analyst review.', why: 'Shown directly by the alert data.' },
          { id: 's2', correct: true, text: 'The reported 40% improvement in response time results from a change in how the timer is defined and should not be read as a performance gain.', why: 'Shown by the change in definition.' },
          { id: 's3', correct: true, text: 'The team averaged about nine hours of unpaid overtime a week last quarter, and two experienced analysts have resigned citing workload.', why: 'Shown by the timesheets and the HR records.' },
          { id: 's4', correct: true, text: 'The reduction in staff means priorities have to be chosen, and the live incident and the phishing queue have taken most of today\'s capacity.', why: 'An honest description of how capacity was used.' },
          { id: 's5', correct: false, text: 'The team\'s performance has improved significantly this quarter.', why: 'Unsupported: the headline measure changed definition and the people measures are worse.' },
          { id: 's6', correct: false, text: 'The resignations were caused by poor management.', why: 'A judgement about a person or a decision that the evidence does not support. Report what the leavers said, not why you think they went.' },
          { id: 's7', correct: false, text: 'The auto-close rule is dangerous and should be switched off immediately.', why: 'An overreaction. It should be reviewed and measured, not thrown out without understanding what it protects.' },
          { id: 's8', when: 'partner', correct: true, text: 'Overnight triage was covered by the managed-detection partner, lower-priority projects were paused, and fair time off in lieu was agreed.', why: 'An accurate record of a sound decision.' },
          { id: 's9', when: 'overtime', correct: true, text: 'Overnight cover was provided by asking the day team to stay late, which added to existing overtime and fatigue.', why: 'An honest account of the cost of that choice.' },
          { id: 's10', when: 'thin', correct: true, text: 'Overnight cover was one analyst, and that was not reported to leadership at the time.', why: 'Honest reporting of a risk you took without telling anyone.' },
          { id: 's11', when: 'blind', correct: true, text: 'Non-critical overnight alerting was switched off for the week, which left the team without visibility during a live incident.', why: 'An honest record of a risky decision.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Review the auto-close rule with the detection engineers, and report on alerts investigated by an analyst, not just alerts closed.', why: 'It keeps the benefit of automation while making the number honest.' },
          { id: 'a2', correct: true, text: 'Report response time using both the old and new definitions side by side until leadership agrees which to keep.', why: 'It makes the change visible instead of hiding it.' },
          { id: 'a3', correct: true, text: 'Present a short, evidence-based case for two more analyst posts and a plan to keep the experienced people you have.', why: 'It responds to the real cause, and it is something the director can act on.' },
          { id: 'a4', correct: false, text: 'Tell analysts to close alerts faster to bring the numbers up.', why: 'It rewards the number, not the outcome, and it will make quality worse.' },
          { id: 'a5', correct: false, text: 'Leave the resignations out of the report so as not to worry the CIO.', why: 'Leadership cannot fix a problem it has not been told about.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'risk-register',
    title: 'The Risk Appetite Meeting',
    skill: 'data',
    minutes: 24,
    blurb: 'Rank the company\'s risks, check the facts on the biggest one, spend a limited security budget, and tell the board what they must hear.',
    brief: [
      'The board meets on Thursday to agree how much security risk the company is willing to carry, and how much to spend reducing it. You are the SOC manager and the board has asked you to present.',
      'You have a long list of risks and a budget that will not cover all of them. You need to rank them properly, check the facts behind the biggest one, decide where the money goes, handle a push from the finance director, and make sure the paper that goes to the board says what is true.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks',
        intro: 'Tap the risks in order, highest overall risk first. Think about how likely each is and how bad it would be, not only how easy it is to talk about.',
        items: [
          { id: 'r1', source: 'Infrastructure', priority: 1, text: 'An unsupported (end-of-life) server holds customer records and can be reached from the internet.', why: 'Very likely to be attacked, because it cannot be patched, and the impact is high because of the data it holds.' },
          { id: 'r2', source: 'Resilience', priority: 2, text: 'There is no tested plan for restoring from backups after a ransomware attack.', why: 'Ransomware is common and costly, and untested backups often fail when they are needed. High impact, medium likelihood.' },
          { id: 'r3', source: 'Supplier', priority: 3, text: 'The payroll supplier handles employee data and has never had a security review.', why: 'Real data in the hands of a third party with unknown controls. Serious, but less likely and less immediate than the first two.' },
          { id: 'r4', source: 'Identity', priority: 4, text: 'Some staff use easily guessed passwords on low-risk internal tools.', why: 'Real but limited: the tools hold little of value, and the fix is cheap.' },
          { id: 'r5', source: 'Premises', priority: 5, text: 'The visitor sign-in tablet in reception runs an old web browser.', why: 'Low likelihood and low impact: it holds only names and visit times.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Check the facts behind the top risk',
        intro: 'The finance director has heard of the end-of-life server and is sceptical that it is as serious as you say. Establish what is true. Flag only what you can support.',
        clues: {
          eol: { strength: 'strong', text: 'The server\'s operating system reached end of life in March: it no longer receives security patches.' },
          exposed: { strength: 'strong', text: 'Its administration page is reachable from the internet with a password only.' },
          data: { strength: 'strong', text: 'It holds about 400,000 customer records, including names, addresses and order history.' },
          nocontrols: { strength: 'strong', text: 'There are no compensating controls: it is not segmented from the main network and has no extra monitoring.' },
          pentest: { strength: 'weak', text: 'The last penetration test that covered it was 14 months ago.' },
        },
        artefacts: [
          {
            id: 'asset', title: 'Asset and configuration records',
            lines: [
              { id: 'f1', type: 'clue', clue: 'eol', text: 'CMDB: CUSTDB-OLD, Windows Server 2012 R2, vendor support ended (no security updates since March)', note: 'No new vulnerabilities will ever be fixed on this machine. Any flaw found from now on is permanent.' },
              { id: 'f2', type: 'clue', clue: 'exposed', text: 'External scan: CUSTDB-OLD admin console reachable on the internet, password only, no MFA', note: 'An unpatchable system with an exposed login page is exactly what attackers scan for.' },
              { id: 'f3', type: 'herring', text: 'External scan: marketing website, all checks passed', note: 'A good result for a different system. It says nothing about this one.' },
              { id: 'f4', type: 'herring', text: 'Server uptime: 612 days', note: 'A server that has not restarted for 612 days has missed patches, not shown it is healthy. This is a warning, but it is not a separate finding.' },
            ],
          },
          {
            id: 'data', title: 'Data and network records',
            lines: [
              { id: 'f5', type: 'clue', clue: 'data', text: 'Data inventory: CUSTDB-OLD holds 400,312 customer records (name, address, email, order history)', note: 'The size and sensitivity of the data decide how bad a breach would be.' },
              { id: 'f6', type: 'clue', clue: 'nocontrols', text: 'Network map: CUSTDB-OLD sits on the main server network with no segmentation; no EDR agent installed (unsupported)', note: 'If it is compromised, nothing contains the attacker and nothing would detect them.' },
              { id: 'f7', type: 'clue', clue: 'pentest', text: 'Pen test register: last test covering CUSTDB-OLD was 14 months ago, before the support end date', note: 'Out of date, but not a fact about how exposed it is today.' },
              { id: 'f8', type: 'herring', text: 'Backup job for CUSTDB-OLD: completed last night', note: 'A successful job does not tell you the backup can be restored, and it does not reduce the exposure.' },
            ],
          },
        ],
      },
      {
        id: 'budget', type: 'allocate', unit: 'budget units', budget: 10, title: 'Spend the security budget',
        intro: 'You have ten budget units (each about £10,000) for the year, not enough to do everything. Spend all ten across these five pieces of work.',
        items: [
          { id: 'b1', source: 'Infrastructure', ideal: 4, text: 'Retire or properly isolate the end-of-life server.', why: 'It is the biggest risk and the most expensive to fix, so it takes the largest share.' },
          { id: 'b2', source: 'Resilience', ideal: 3, text: 'Test restoring from backups and fix the gaps.', why: 'It turns an unknown into a known and is the difference between recovering and paying a ransom.' },
          { id: 'b3', source: 'Supplier', ideal: 1, text: 'A security review of the payroll supplier.', why: 'A modest, targeted piece of work that closes a blind spot.' },
          { id: 'b4', source: 'Identity', ideal: 1, text: 'A password policy and MFA rollout for the internal tools.', why: 'Cheap, effective and worth doing, but it is not where most of the money should go.' },
          { id: 'b5', source: 'Premises', ideal: 1, text: 'Replace the visitor sign-in tablet.', why: 'Low risk, but it is cheap, so a small amount tidies it up.' },
        ],
      },
      {
        id: 'accept', type: 'decision', title: 'Decide: the finance director\'s challenge',
        intro: 'The finance director says: "The replacement server costs too much. Let\'s accept that risk for a year and spend the money elsewhere."',
        prompt: 'How do you respond?',
        options: [
          { id: 'treat', quality: 3, text: 'Do not accept it as it stands. Propose isolating the server behind a firewall rule with MFA now, plan the replacement for next quarter, and have an executive formally own the remaining risk with a review date', set: { treated: true }, consequence: 'The exposure drops straight away at low cost, the replacement is planned, and a named executive owns what remains. The finance director gets a plan they can fund.' },
          { id: 'registered', quality: 2, text: 'Agree to accept the risk, and record it in the risk register', set: { registeredOnly: true }, consequence: 'It is written down, but nothing reduces the exposure. A year later it is still open and nobody remembers who agreed to it.' },
          { id: 'crisis', quality: 1, text: 'Take it to the board as a crisis, and warn that a breach is certain', set: { crisis: true }, consequence: 'The warning is overstated, so people stop listening. You lose credibility for the next risk you raise.' },
          { id: 'hide', quality: 0, text: 'Leave it off the paper to avoid the argument', set: { hidden: true }, consequence: 'The board never hears about the biggest risk in the company, and you are the one who decided that.' },
        ],
      },
      {
        id: 'paper', type: 'review', title: 'Review the draft board paper',
        intro: 'A colleague has drafted the paper for Thursday. The board will decide how much risk to carry based on it.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported, so it can be corrected before it reaches the board.',
        statements: [
          { id: 'p1', sound: true, text: 'The highest-rated risk is an unsupported server that holds about 400,000 customer records and is reachable from the internet.', why: 'Supported by the asset, data and scan records.' },
          { id: 'p2', sound: false, text: 'The ransomware risk is effectively zero because we run nightly backups.', why: 'Unsupported. The backups have never been restore-tested, so recovery is unproven.' },
          { id: 'p3', sound: false, text: 'Spending the whole budget on the top risk would remove our security risk.', why: 'Overstated. It would reduce one risk and leave the others untouched. Risk is managed, not eliminated.' },
          { id: 'p4', sound: true, text: 'Backups have not been tested for restoration, so recovery time is uncertain.', why: 'Accurate and appropriately cautious.' },
          { id: 'p5', sound: false, text: 'The payroll supplier is safe because it is a well-known company.', why: 'Reputation is not a security review. You have no evidence about its controls.' },
          { id: 'p6', sound: false, text: 'No customer data is at risk.', why: 'Contradicted by the data inventory: the server holds about 400,000 customer records.' },
          { id: 'p7', sound: true, text: 'Some risk will remain after the proposed spend, and each remaining risk needs a named owner and a review date.', why: 'An honest statement: accepted risk should be owned and revisited.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your recommendation to the board',
        intro: 'Your own recommendation, on one page. Include what the evidence supports and what you propose, and be honest about how the discussion went.',
        statements: [
          { id: 'q1', correct: true, text: 'The end-of-life customer server is the highest risk: it no longer receives security patches, is reachable from the internet, holds about 400,000 customer records and has no compensating controls.', why: 'Shown directly by the evidence.' },
          { id: 'q2', correct: true, text: 'Our backups have never been tested by restoring from them, so our ability to recover from ransomware is unproven.', why: 'An honest and accurate statement.' },
          { id: 'q3', correct: true, text: 'The payroll supplier has not been reviewed, so the risk it carries is unknown.', why: 'An honest statement of what is not known.' },
          { id: 'q4', correct: true, text: 'The budget does not cover all of the work, so it has been allocated in proportion to the size of each risk.', why: 'A clear account of how the money was used.' },
          { id: 'q5', correct: false, text: 'A data breach is certain within the next year.', why: 'Overstated. The risk is high, not certain.' },
          { id: 'q6', correct: false, text: 'The lower-rated risks can be ignored.', why: 'Low risks still need an owner. They are cheap to deal with, not irrelevant.' },
          { id: 'q7', correct: false, text: 'The finance director does not understand security.', why: 'A judgement about a colleague, not a finding. The recommendation should speak for itself.' },
          { id: 'q8', when: 'treated', correct: true, text: 'The server will be isolated behind a firewall rule with MFA now, replaced next quarter, and an executive will own the remaining risk with a review date.', why: 'An accurate record of a balanced decision.' },
          { id: 'q9', when: 'registeredOnly', correct: true, text: 'The risk was accepted for a year and recorded in the register, without any change to the exposure in the meantime.', why: 'An honest description of an acceptance that did nothing to reduce the risk.' },
          { id: 'q10', when: 'crisis', correct: true, text: 'The risk was presented to the board in alarming terms that went beyond what the evidence supports.', why: 'An honest account of an overstatement.' },
          { id: 'q11', when: 'hidden', correct: true, text: 'The end-of-life server risk was left out of the initial board paper.', why: 'An honest record of an omission, and the board should know.' },
        ],
        actions: [
          { id: 'x1', correct: true, text: 'Approve the proposed split of the budget, with the largest share going to the end-of-life server and the backup test.', why: 'It follows the risk.' },
          { id: 'x2', correct: true, text: 'Name an executive owner and a review date for each risk that remains after the spend.', why: 'Accepted risk with no owner is risk nobody manages.' },
          { id: 'x3', correct: true, text: 'Ask the SOC to report back in three months on restore-test results and the supplier review.', why: 'It keeps the work accountable.' },
          { id: 'x4', correct: false, text: 'Put the whole budget into the end-of-life server and leave the rest.', why: 'It leaves the second-largest risk untreated.' },
          { id: 'x5', correct: false, text: 'Postpone all decisions until a full audit is complete.', why: 'The exposure continues while you wait.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'manager-exam',
    title: 'Promotion exam: SOC Manager',
    skill: 'data',
    minutes: 30,
    blurb: 'Quarter-end week: a live phishing attack, a supplier breach, an outage and an audit, with eight analysts. Silver or better to pass.',
    brief: [
      'It is Tuesday of quarter-end week and this is your promotion exam. You run the SOC at Contoso with eight analysts. Four things are happening at once, and the executives want answers.',
      'The case tests the whole of the manager role: ranking competing demands, putting limited people where they matter, finding the facts about the most uncertain problem, resisting pressure to say more than you know, and checking what other people send up. Unsupported claims and wasted resources cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the demands',
        intro: 'Rank these from most to least urgent, thinking about harm in progress, deadlines and what is still uncertain.',
        items: [
          { id: 'x1', source: 'Finance', priority: 1, text: 'Five finance staff clicked a phishing link, one entered a password, and a large payment approval is waiting.', why: 'Money may be about to leave, and a live attacker may hold an account. Time matters most here.' },
          { id: 'x2', source: 'Supplier', priority: 2, text: 'The HR software supplier says its systems were breached and your staff data may be affected.', why: 'Potentially large personal-data breach with a legal clock starting, but the scope is still unknown, so it follows the live fraud risk.' },
          { id: 'x3', source: 'IT operations', priority: 3, text: 'The Leeds office network is down and 40 staff cannot work.', why: 'A real business impact, but it is an outage, not an attack, and IT operations are already on it.' },
          { id: 'x4', source: 'Compliance', priority: 4, text: 'The external auditor wants evidence of access reviews by Friday.', why: 'A firm deadline with days to go, so it is planned work rather than urgent.' },
          { id: 'x5', source: 'People', priority: 5, text: 'A junior analyst asks for study time for a certification.', why: 'It matters for retention and should not be ignored, but it can wait until the week is under control.' },
        ],
      },
      {
        id: 'people', type: 'allocate', unit: 'analysts', budget: 8, title: 'Assign your eight analysts',
        intro: 'You have eight analysts for the four live workstreams. Use all eight.',
        items: [
          { id: 'a1', source: 'Finance', ideal: 3, text: 'Finance phishing response: stop the payment, reset the account, and find any other victims.', why: 'The most time-critical work. It needs people quickly and in several roles at once.' },
          { id: 'a2', source: 'Supplier', ideal: 3, text: 'HR supplier breach assessment: work out whether your data was taken and how much.', why: 'Uncertain and large. It needs real investigative capacity, and the legal clock is running.' },
          { id: 'a3', source: 'IT operations', ideal: 1, text: 'Support the Leeds outage, in case it is related.', why: 'One analyst keeps watch on whether the outage is anything other than a fault, without taking the people from the real incidents.' },
          { id: 'a4', source: 'Compliance', ideal: 1, text: 'Prepare the audit evidence for Friday.', why: 'Steady, deadline-driven work that one person can keep moving.' },
        ],
      },
      {
        id: 'supplier', type: 'evidence', title: 'Investigate the HR supplier breach',
        intro: 'The supplier\'s notice is vague. Work out from your own records whether you were affected, and how. Flag only what you can support.',
        clues: {
          window: { strength: 'strong', text: 'The supplier says attackers had access to its customer-support database from 2 to 9 October.' },
          token: { strength: 'strong', text: 'Your HR integration token is on the supplier\'s list of affected credentials.' },
          misuse: { strength: 'strong', text: 'Your own logs show that token used from an unfamiliar address on 5 October, within the attackers\' window.' },
          scope: { strength: 'strong', text: 'The token could read staff names, addresses, national insurance numbers and bank details.' },
          nodata: { strength: 'weak', text: 'The supplier says it has "no evidence of data theft" so far.' },
        },
        artefacts: [
          {
            id: 'notice', title: 'The supplier\'s notice',
            lines: [
              { id: 'h1', type: 'clue', clue: 'window', text: 'Notice: "An unauthorised party accessed our customer-support database between 2 and 9 October."', note: 'This gives you the window. You can now check your own records inside it.' },
              { id: 'h2', type: 'clue', clue: 'nodata', text: 'Notice: "We currently have no evidence that customer data was stolen."', note: 'Reassuring wording, but "no evidence yet" is not the same as "no data was taken". Do not rely on it.' },
              { id: 'h3', type: 'herring', text: 'Supplier marketing email: "Introducing our new reporting dashboard"', note: 'Unrelated and untimely. It tells you nothing about the breach.' },
              { id: 'h4', type: 'herring', text: 'Supplier\'s ISO 27001 certificate, valid until next year', note: 'A certificate shows a management system was audited at some point, not that this attack could not happen.' },
            ],
          },
          {
            id: 'ours', title: 'Your own integration and logs',
            lines: [
              { id: 'h5', type: 'clue', clue: 'token', text: 'Supplier affected-credentials list: includes the Contoso HR integration token (hr-int-02)', note: 'Your token is on the list. That turns "possibly" into "likely".' },
              { id: 'h6', type: 'clue', clue: 'misuse', text: '5 Oct 03:12: hr-int-02 used from 203.0.113.58 (hosting provider); normal use is from the supplier\'s published addresses only', note: 'Use of the token from somewhere new, inside the window, is the strongest sign that the attacker used it against you.' },
              { id: 'h7', type: 'clue', clue: 'scope', text: 'Token permissions: read access to staff name, address, national insurance number and bank details', note: 'This determines how bad it could be, and it matters for the legal assessment.' },
              { id: 'h8', type: 'herring', text: 'SOC dashboard: all internal systems green', note: 'The breach is at the supplier. Your own systems being healthy does not mean your data is safe.' },
              { id: 'h9', type: 'herring', text: 'HR system patch level: fully up to date', note: 'A good thing, but irrelevant to a stolen integration token.' },
            ],
          },
        ],
      },
      {
        id: 'exec', type: 'decision', title: 'Decide: the CEO wants reassurance',
        intro: 'The CEO calls: "Staff are worried. Send a message saying no data was lost, so we can all get on with the week."',
        prompt: 'What do you do?',
        options: [
          { id: 'accurate', quality: 3, text: 'Brief the executives on what is known and unknown, agree a holding message that says an investigation is under way, rotate the HR token, and start the data protection assessment with the DPO', set: { accurate: true }, consequence: 'Staff hear that something is being looked into and that you will update them. The token stops working, and the DPO starts the 72-hour clock from the right moment.' },
          { id: 'detailed', quality: 2, text: 'Send staff a detailed technical explanation of the breach', set: { detailed: true }, consequence: 'It is honest, but too long and technical. It worries people more, and it gets forwarded outside the company.' },
          { id: 'overassured', quality: 1, text: 'Send the "no data was lost" message as the CEO asked', set: { overassured: true }, consequence: 'It is not true. When the supplier confirms the theft two days later, staff trust the company less than before.' },
          { id: 'silent', quality: 0, text: 'Say nothing to anyone, including the DPO, until the supplier confirms', set: { silent: true }, consequence: 'The legal clock has already started and you did not act on it. Staff hear about it from the news.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft update for the executive team',
        intro: 'A senior analyst, Jo, has drafted the update that goes to the executive team. Executives will act on every line.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported, so Jo can fix it before it goes up.',
        statements: [
          { id: 'j1', sound: true, text: 'Our HR integration token is on the supplier\'s list of affected credentials.', why: 'Supported by the supplier\'s list.' },
          { id: 'j2', sound: true, text: 'The token was used from an unfamiliar address on 5 October, within the period the supplier says it was breached.', why: 'Supported by your own logs.' },
          { id: 'j3', sound: false, text: 'Staff data has been stolen.', why: 'Not yet proven. You know the token was misused and what it could read, but not what was actually copied.' },
          { id: 'j4', sound: false, text: 'No staff data was affected, because the supplier has no evidence of theft.', why: 'Unsupported. "No evidence yet" is not evidence of absence, and your logs show the token being misused.' },
          { id: 'j5', sound: false, text: 'The attackers are the same group that attacked a competitor last year.', why: 'Attribution without evidence. It is speculation and could mislead decisions.' },
          { id: 'j6', sound: true, text: 'The token could read staff names, addresses, national insurance numbers and bank details, so the potential impact is high.', why: 'Supported by the token\'s permissions, and the honest way to describe the risk.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary of the week for the board. Include what the evidence supports and recommend proportionate actions.',
        statements: [
          { id: 'r1', correct: true, text: 'The HR software supplier was breached between 2 and 9 October, and our integration token is on its list of affected credentials.', why: 'Shown by the notice and the supplier\'s list.' },
          { id: 'r2', correct: true, text: 'Our logs show the token used from an unfamiliar address on 5 October, within the supplier\'s breach window.', why: 'Shown by your own records.' },
          { id: 'r3', correct: true, text: 'The token could read staff names, addresses, national insurance numbers and bank details.', why: 'Shown by the token\'s permissions.' },
          { id: 'r4', correct: true, text: 'It is not yet known which data was actually copied, so the assessment is continuing.', why: 'An honest statement of what is unknown.' },
          { id: 'r5', correct: false, text: 'No staff data was affected.', why: 'Unsupported, and probably false.' },
          { id: 'r6', correct: false, text: 'The supplier deliberately concealed the breach.', why: 'There is no evidence of intent. A judgement about a third party is not a finding.' },
          { id: 'r7', correct: false, text: 'The finance phishing attempt and the supplier breach are the same attack.', why: 'Unsupported: nothing links them.' },
          { id: 'r8', when: 'accurate', correct: true, text: 'The executives were briefed on what was known and unknown, a holding message was issued, the token was rotated and the DPO started the assessment.', why: 'An accurate record of a sound response.' },
          { id: 'r9', when: 'detailed', correct: true, text: 'A detailed technical explanation was sent to all staff, which raised concern and was shared outside the company.', why: 'An honest account of the cost of that decision.' },
          { id: 'r10', when: 'overassured', correct: true, text: 'Staff were told that no data had been lost, which was not supported by the evidence and had to be corrected.', why: 'An honest account of an overstatement.' },
          { id: 'r11', when: 'silent', correct: true, text: 'The DPO was not told until the supplier confirmed the theft, which delayed the assessment and the notification clock.', why: 'The honest consequence of waiting.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Complete the data protection assessment with the DPO, and notify the ICO within 72 hours of awareness if there is a risk to people.', why: 'It meets the legal duty and puts the right people in charge of the decision.' },
          { id: 'a2', correct: true, text: 'Tell affected staff accurately once the scope is known, with advice on protecting their bank and identity details.', why: 'People at risk need clear, practical information when you have it.' },
          { id: 'a3', correct: true, text: 'Review every supplier credential we have issued, and require shorter lifetimes and address restrictions.', why: 'The token worked from anywhere for as long as it existed. That is the weakness.' },
          { id: 'a4', correct: false, text: 'Terminate the supplier contract immediately.', why: 'Premature. It may be right later, but it does not address the exposure now.' },
          { id: 'a5', correct: false, text: 'Reassure staff that their bank details are safe.', why: 'You cannot say that yet.' },
        ],
      },
    ],
  },
];
