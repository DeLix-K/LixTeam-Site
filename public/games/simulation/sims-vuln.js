// Vulnerability Management simulations. Everything here is fictional. Vulnerability ids use the
// impossible year 2099 (CVE-2099-xxxx) so none of them can be mistaken for a real flaw. IP addresses
// come from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// The point of the path: severity is not risk. A score describes how bad a flaw could be in theory.
// Risk also depends on whether it is being exploited, whether the system can be reached, and what the
// system holds. The simulations practise ranking by risk, checking what a scanner says, spending a
// limited patching budget, and being honest about what is and is not fixed.

const RATINGS = [
  { name: 'Drowning in findings', blurb: 'Fixes followed the scores and the noise, not the risk. Read each stage note: the skill is knowing which few findings matter.' },
  { name: 'Patching', blurb: 'You fixed real problems, with gaps in priorities, evidence or reporting.' },
  { name: 'Risk-based', blurb: 'You ranked by exploitability, exposure and impact, checked the facts and reported honestly.' },
  { name: 'Vulnerability lead', blurb: 'Well-judged priorities, patching effort in the right places, and reporting that leadership can act on.' },
];

export const VULN = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'scan-triage',
    title: 'Monday\'s scan',
    skill: 'data',
    minutes: 16,
    blurb: 'The weekly scan found 2,400 findings. Rank the ones that matter, check the top one is real, decide how fast to act and report it honestly.',
    brief: [
      'It is Monday 09:00 and the weekly vulnerability scan has finished: 2,400 findings across 600 systems. Nobody can fix 2,400 things this week, so your job is to work out which few matter most and make sure they get fixed.',
      'You will rank five representative findings, check whether the top one is genuinely exploitable, decide what to do when the web team asks to wait, and review the junior analyst\'s draft of the weekly report before it goes to the IT director.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the findings by risk',
        intro: 'Tap the findings in order, highest risk first. The score is only part of the picture: think about whether it is being exploited, whether it can be reached, and what the system holds.',
        items: [
          { id: 'v1', source: 'Public web server', priority: 1, text: 'Remote code execution in the web framework (CVSS 8.1). It is on the known-exploited list, and the server is reachable from the internet.', why: 'Attackers are already using it and anyone on the internet can try. A lower score than the others does not make it less urgent.' },
          { id: 'v2', source: 'HR file server', priority: 2, text: 'Remote code execution in the file-sharing service (CVSS 9.8). A public exploit exists. The server holds HR records and is reachable by every staff member, but not from the internet.', why: 'Very damaging and easy to exploit, but it needs an attacker inside first. It comes straight after anything being exploited from the internet.' },
          { id: 'v4', source: 'Customer portal', priority: 3, text: 'An outdated TLS version is still accepted (CVSS 7.5). The portal is on the internet.', why: 'A real weakness on an exposed system, but exploiting it is hard and nothing suggests anyone is trying.' },
          { id: 'v3', source: 'Build server', priority: 4, text: 'Remote code execution in an unused library (CVSS 9.8). The server is isolated, holds no data and only two administrators can reach it.', why: 'The highest score, but the library is not used and the server cannot be reached. Fix it on the normal schedule.' },
          { id: 'v5', source: 'Office printers', priority: 5, text: 'The printers reveal their firmware version to anyone on the network (CVSS 5.3).', why: 'Low impact and low likelihood. Note it, and fix it when convenient.' },
        ],
      },
      {
        id: 'verify', type: 'evidence', title: 'Check the top finding is real',
        intro: 'Scanners guess. Before you ask the web team to drop everything, find out whether this one is genuine and whether anyone is already using it. Flag only what the records support.',
        clues: {
          version: { strength: 'strong', text: 'A credentialed scan confirms the vulnerable framework version is installed on the server.' },
          exposed: { strength: 'strong', text: 'The server is reachable from the internet through the load balancer on ports 80 and 443.' },
          kev: { strength: 'strong', text: 'The flaw is on the known-exploited list: attackers are using it in real attacks.' },
          probes: { strength: 'strong', text: 'The web server logs show exploit-style requests from addresses that have never visited before.' },
          confidence: { strength: 'weak', text: 'The scanner rates its own confidence in this finding as high.' },
        },
        artefacts: [
          {
            id: 'scan', title: 'Scanner and inventory records',
            lines: [
              { id: 's1', type: 'clue', clue: 'version', text: 'Credentialed scan of WEB01: framework 4.2.1 installed (vulnerable range 4.0.0 to 4.2.3)', note: 'The scanner logged in and read the installed version itself. That is much stronger than guessing from a banner.' },
              { id: 's2', type: 'clue', clue: 'confidence', text: 'Finding confidence: High', note: 'The scanner\'s own opinion. Useful, but it is not evidence the flaw can actually be used here.' },
              { id: 's3', type: 'herring', text: 'Last month\'s report listed WEB01 with a different finding, now fixed', note: 'History about another issue. It does not bear on this one.' },
              { id: 's4', type: 'herring', text: 'WEB01 passed its quarterly compliance benchmark', note: 'A configuration benchmark does not check for this flaw. Passing it proves nothing here.' },
            ],
          },
          {
            id: 'net', title: 'Network and web logs',
            lines: [
              { id: 's5', type: 'clue', clue: 'exposed', text: 'Firewall: WEB01 published to the internet via the load balancer, ports 80 and 443', note: 'Anyone on the internet can send requests to it, so the flaw can be tried by anyone.' },
              { id: 's6', type: 'clue', clue: 'kev', text: 'Threat feed: the framework flaw is listed as known exploited, added 9 days ago', note: 'This is the strongest sign of urgency: it is not a theoretical risk.' },
              { id: 's7', type: 'clue', clue: 'probes', text: 'Web logs, last 48 hours: 37 requests with exploit-style payloads from 203.0.113.58 and 198.51.100.77, none seen before', note: 'Someone is already trying it against you. It also means you should check whether any attempt succeeded.' },
              { id: 's8', type: 'herring', text: 'WEB01 uptime: 41 days', note: 'Uptime says nothing about whether this flaw is present or being used.' },
              { id: 's9', type: 'herring', text: 'Normal traffic: 12,000 requests an hour from known customers', note: 'Ordinary background activity. It is not part of the problem.' },
            ],
          },
        ],
      },
      {
        id: 'window', type: 'decision', title: 'Decide: the web team wants to wait',
        intro: 'The web team lead says: "Our change window is on the 28th. Can this wait? A rushed patch last time broke the site."',
        prompt: 'What do you do?',
        options: [
          { id: 'careful', quality: 3, text: 'Use the emergency change process to patch within 24 hours, put a web application firewall rule in place now as a stopgap, and check the logs for any sign that an attempt already succeeded', set: { careful: true }, consequence: 'The exposure is reduced within minutes and closed within a day. Checking the logs means you find out whether you were already hit, and you keep the web team on side by planning the patch properly.' },
          { id: 'patchonly', quality: 2, text: 'Patch it tonight, but do not look at the logs', set: { patchonly: true }, consequence: 'The hole is closed. If anyone got in before the patch, nobody is looking for them.' },
          { id: 'wait', quality: 1, text: 'Wait for the change window on the 28th and monitor in the meantime', set: { waited: true }, consequence: 'For nineteen days an actively exploited flaw sits on an internet-facing server. An attempt succeeds on day six.' },
          { id: 'ignore', quality: 0, text: 'Mark it as a false positive because the website looks fine', set: { waited: true, dismissed: true }, consequence: 'A working website is not evidence that nobody is inside it. The finding is closed, and it will not be looked at again.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the junior analyst\'s weekly report',
        intro: 'The weekly report goes to the IT director. Jamie, a junior analyst, has drafted it.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, misleading or unsupported, so Jamie can fix it before it goes out.',
        statements: [
          { id: 'r1', sound: true, text: 'The top priority is the remote code execution flaw on the public web server, because it is internet-facing and on the known-exploited list.', why: 'Supported by the exposure and the threat feed.' },
          { id: 'r2', sound: false, text: 'All 2,400 findings must be fixed this week.', why: 'Unrealistic and unhelpful. A report should say which findings matter most and when each group will be dealt with.' },
          { id: 'r3', sound: false, text: 'The highest CVSS score tells us which finding to fix first.', why: 'A score describes severity in theory, not risk. Exploitation, exposure and what the system holds all change the order.' },
          { id: 'r4', sound: true, text: 'Scan coverage is limited to systems in the asset inventory, so systems that are not in it have not been checked.', why: 'An honest statement of a real limit.' },
          { id: 'r5', sound: false, text: 'The build server\'s 9.8 is our biggest risk.', why: 'The server is isolated, holds no data and the library is not used. It has a high score and a low risk.' },
          { id: 'r6', sound: true, text: 'Lower-risk findings, such as the isolated build server, will follow the normal patch schedule and have been noted.', why: 'Sound: the finding is recorded and will be dealt with, in proportion to its risk.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the IT director',
        intro: 'Your own summary for the director. Include what the evidence supports, be honest about the decisions made, and recommend sensible next steps.',
        statements: [
          { id: 's1', correct: true, text: 'The most urgent finding is a remote code execution flaw in the web framework on an internet-facing server, which is on the known-exploited list.', why: 'Shown by the records.' },
          { id: 's2', correct: true, text: 'The web logs show 37 exploit-style requests from two previously unseen addresses over the last 48 hours.', why: 'Shown by the logs.' },
          { id: 's3', correct: true, text: 'The vulnerable version was confirmed by a credentialed scan, so this is not a false positive.', why: 'Shown by the scan record.' },
          { id: 's4', correct: true, text: 'Findings are ranked by exploitation, exposure and impact, not by CVSS score alone.', why: 'It is how the ranking was made and the reader should know it.' },
          { id: 's5', correct: false, text: 'The server has been compromised.', why: 'Unsupported. You have seen attempts, not a successful attack. Say that it has not yet been ruled out.' },
          { id: 's6', correct: false, text: 'The web team failed to patch in time.', why: 'A judgement about a colleague, not a finding. The flaw was added to the list only nine days ago.' },
          { id: 's7', correct: false, text: 'The remaining 2,399 findings can be ignored.', why: 'They still need handling on a schedule that fits their risk. Ignoring them is not the same as ranking them lower.' },
          { id: 's8', when: 'careful', correct: true, text: 'A firewall rule was applied as a stopgap, an emergency patch was scheduled within 24 hours, and the logs were checked for a successful attempt.', why: 'An accurate record of a sound decision.' },
          { id: 's9', when: 'patchonly', correct: true, text: 'The server was patched, but the logs were not checked, so it is not known whether an earlier attempt succeeded.', why: 'An honest account of what was and was not done.' },
          { id: 's10', when: 'waited', correct: true, text: 'The fix was deferred to the scheduled change window, leaving a known-exploited flaw exposed to the internet in the meantime.', why: 'The honest consequence of waiting.' },
          { id: 's11', when: 'dismissed', correct: true, text: 'The finding was closed as a false positive without evidence, and has been reopened.', why: 'Honest reporting about your own mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Check the web server for signs of a successful attack, including new files, accounts and outbound connections.', why: 'Patching closes the hole but does not show whether someone already got in.' },
          { id: 'a2', correct: true, text: 'Add known-exploited flaws to the asset-owner alert with a 24-hour target, and rank other findings by exposure and impact.', why: 'Builds the ranking into the process, so it does not depend on one person.' },
          { id: 'a3', correct: true, text: 'Work with the web team on a faster, safer change process so urgent patches do not need to wait for the monthly window.', why: 'Fixes the cause of the delay.' },
          { id: 'a4', correct: false, text: 'Switch off the web server until the patch is applied.', why: 'Out of proportion if a rule and a patch within a day will do, and it takes the business offline.' },
          { id: 'a5', correct: false, text: 'Ask the team to fix every critical finding by Friday.', why: 'It treats all critical scores alike, and it will swamp the teams and delay the ones that matter.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'patch-tuesday',
    title: 'Patch Tuesday',
    skill: 'data',
    minutes: 20,
    blurb: 'A big patch release lands. Spread a limited patching capacity where it reduces the most risk, find what last month missed, and handle a patch that breaks payroll.',
    brief: [
      'It is Patch Tuesday. Your vendors have released a large batch of fixes, and your patching team has limited capacity this week. You manage vulnerability remediation, so it is your job to decide where the effort goes.',
      'You will allocate the team\'s capacity, work out why last month\'s 97% compliance figure was misleading, decide what to do when a patch breaks the payroll application, and review the status report that is about to go to the IT director.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'capacity', type: 'allocate', unit: 'patching slots', budget: 10, title: 'Spend this week\'s patching capacity',
        intro: 'You have ten patching slots this week (each is a team-day of testing, deployment and checking). Spend all ten across these five groups.',
        items: [
          { id: 'edge', source: 'Internet-facing', ideal: 4, text: 'Internet-facing servers with flaws that are being exploited in the wild.', why: 'Highest risk and the most urgent. Anyone can reach them and attackers are already using the flaws, so they take the biggest share.' },
          { id: 'dc', source: 'Identity', ideal: 2, text: 'Domain controllers, which run the company\'s sign-in.', why: 'Few systems, but if one is compromised the attacker controls everything. Worth a firm share.' },
          { id: 'laptops', source: 'Endpoints', ideal: 2, text: 'Staff laptops: the monthly rollout, in waves.', why: 'The bulk of the systems, but low individual risk. The normal wave process is enough.' },
          { id: 'pilot', source: 'Testing', ideal: 1, text: 'A pilot group to test the patches before wide release.', why: 'A small amount of testing prevents big outages. It is cheap insurance.' },
          { id: 'legacy', source: 'Legacy', ideal: 1, text: 'Old systems that cannot be patched, which need other controls such as isolation.', why: 'They cannot be fixed the normal way, so someone has to design the alternative. A small, steady effort.' },
        ],
      },
      {
        id: 'missed', type: 'evidence', title: 'Find out what last month missed',
        intro: 'Last month\'s dashboard showed 97% patch compliance, yet a flaw you had "fixed" was used against you. Work out what the dashboard does not show. Flag only what the records support.',
        clues: {
          checkin: { strength: 'strong', text: '340 servers have not reported to the patch tool for over 30 days, so they are not in the 97%.' },
          reboot: { strength: 'strong', text: '40 servers installed the patch but never restarted, so they still run the vulnerable code.' },
          failing: { strength: 'strong', text: '61 patch jobs fail every night with no alert, and nobody reviews them.' },
          exceptions: { strength: 'strong', text: '22 exceptions are over a year old, with no owner and no expiry.' },
          pilotskip: { strength: 'weak', text: 'The pilot group was skipped last month to save time.' },
        },
        artefacts: [
          {
            id: 'dash', title: 'The compliance dashboard and the data behind it',
            lines: [
              { id: 'p1', type: 'clue', clue: 'checkin', text: 'Compliance: 97% of reporting systems patched. Systems not reported in 30+ days: 340 (excluded from the percentage)', note: 'The percentage only counts machines that talk to the tool. Silent machines do not count against it, so a hidden problem looks like good news.' },
              { id: 'p2', type: 'clue', clue: 'reboot', text: 'Patch state: 40 servers "installed, pending restart" for more than 14 days', note: 'Until the machine restarts, the old, vulnerable code is still running. "Installed" is not the same as "fixed".' },
              { id: 'p3', type: 'herring', text: 'Patch tool version updated to 8.2 last month', note: 'A change to the tool itself, with no bearing on what it missed.' },
              { id: 'p4', type: 'herring', text: 'Average time to deploy a patch: 6 days', note: 'An average that hides the long tail. It does not tell you what was missed.' },
            ],
          },
          {
            id: 'ops', title: 'Operations records',
            lines: [
              { id: 'p5', type: 'clue', clue: 'failing', text: 'Deployment log: 61 jobs failed again last night (error 0x80070005). No alert is configured.', note: 'The same failures every night, unseen. The systems stay unpatched while the dashboard looks fine.' },
              { id: 'p6', type: 'clue', clue: 'exceptions', text: 'Exception register: 22 entries older than 12 months; owner: blank; review date: blank', note: 'An exception with no owner and no end date is just a permanent hole that nobody has accepted.' },
              { id: 'p7', type: 'clue', clue: 'pilotskip', text: 'Change record: pilot ring skipped for the March rollout "to save time"', note: 'Skipping testing raises the chance of an outage, but it did not cause a missed patch.' },
              { id: 'p8', type: 'herring', text: 'Maintenance window for the data centre moved to Sunday', note: 'A scheduling change that explains nothing about what was missed.' },
            ],
          },
        ],
      },
      {
        id: 'payroll', type: 'decision', title: 'Decide: the patch breaks payroll',
        intro: 'In the pilot, one security patch stops the payroll application working. Payroll runs on Friday and finance is nervous. The patch fixes a flaw that is being exploited, though only against the payroll servers\' sign-in service.',
        prompt: 'What do you do?',
        options: [
          { id: 'hold', quality: 3, text: 'Hold that patch for the payroll servers only, restrict access to the affected service now as a stopgap, agree a date to patch after payroll with finance, and apply everything else as planned', set: { held: true }, consequence: 'Payroll runs on time. The affected service is no longer reachable by most of the network, the patch is booked, and the rest of the estate is still protected.' },
          { id: 'delay', quality: 2, text: 'Delay all patching until the payroll problem is understood', set: { delayall: true }, consequence: 'Payroll is safe, but internet-facing servers wait for a week for a problem that does not affect them.' },
          { id: 'force', quality: 1, text: 'Patch the payroll servers anyway and fix the application afterwards', set: { forced: true }, consequence: 'Payroll fails on Friday and people are paid late. Finance will not trust the next urgent patch request.' },
          { id: 'hide', quality: 0, text: 'Remove the payroll servers from the scan so the finding disappears', set: { hidden: true }, consequence: 'The dashboard goes green and the risk stays. You have made yourself blind to the most sensitive servers.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the status report',
        intro: 'Sam, a patch coordinator, has drafted the report to the IT director.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, misleading or unsupported.',
        statements: [
          { id: 'x1', sound: true, text: 'Reported compliance was 97%, but 340 servers that had not checked in for over 30 days were not counted in that figure.', why: 'Accurate and complete.' },
          { id: 'x2', sound: false, text: 'We are 97% patched.', why: 'Misleading. The figure leaves out hundreds of silent servers and counts installed-but-not-restarted patches as fixed.' },
          { id: 'x3', sound: false, text: 'Patching is complete once the patch is installed.', why: 'Many patches only take effect after a restart, and 40 servers are still running the old code.' },
          { id: 'x4', sound: true, text: '61 deployment jobs fail every night and have been unnoticed because no alert is set.', why: 'Supported by the deployment log.' },
          { id: 'x5', sound: false, text: 'The 22 old exceptions are accepted risks.', why: 'An accepted risk has an owner and a review date. These have neither, so nobody has accepted them.' },
          { id: 'x6', sound: true, text: 'The pilot ring was skipped last month, which increases the risk of an unexpected outage.', why: 'An honest and relevant statement.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the IT director',
        intro: 'Your own summary of the month. Include what the evidence supports, how your decisions went, and what you recommend.',
        statements: [
          { id: 'y1', correct: true, text: 'Last month\'s 97% compliance figure excluded 340 servers that had not reported in 30 days.', why: 'Shown by the dashboard data.' },
          { id: 'y2', correct: true, text: '40 servers have the patch installed but have not restarted, so they are still vulnerable.', why: 'Shown by the patch state.' },
          { id: 'y3', correct: true, text: 'Sixty-one patch jobs fail nightly without an alert, and 22 exceptions have no owner or expiry date.', why: 'Shown by the logs and the register.' },
          { id: 'y4', correct: true, text: 'This week\'s capacity was concentrated on internet-facing servers with exploited flaws and on the domain controllers.', why: 'An accurate description of where the effort went.' },
          { id: 'y5', correct: false, text: 'Everything is fully patched.', why: 'Unsupported by any of the evidence.' },
          { id: 'y6', correct: false, text: 'The patching team has been careless.', why: 'A judgement about colleagues, not a finding. The reporting design is the problem.' },
          { id: 'y7', correct: false, text: 'The exploited flaws pose no real risk because our firewalls will stop them.', why: 'Unsupported. Those servers are the ones the firewall exposes.' },
          { id: 'y8', when: 'held', correct: true, text: 'The payroll patch was held, access to the affected service was restricted as a stopgap, and the patch was booked for after payroll with finance\'s agreement.', why: 'An accurate record of a balanced decision.' },
          { id: 'y9', when: 'delayall', correct: true, text: 'All patching was delayed for a week because of the payroll problem, which left internet-facing servers exposed for longer than necessary.', why: 'The honest cost of that choice.' },
          { id: 'y10', when: 'forced', correct: true, text: 'The payroll servers were patched against advice and the application failed, delaying payment.', why: 'An honest account of a decision that backfired.' },
          { id: 'y11', when: 'hidden', correct: true, text: 'The payroll servers were removed from the scan, which hid their findings and is being reversed.', why: 'Honest reporting of your own mistake.' },
        ],
        actions: [
          { id: 'z1', correct: true, text: 'Report compliance including the silent servers, and add an alert for any server that has not reported in for seven days.', why: 'Makes the number honest and finds hidden systems.' },
          { id: 'z2', correct: true, text: 'Restart pending servers on a schedule, and report "installed" and "fixed" separately.', why: 'Counts only what has taken effect.' },
          { id: 'z3', correct: true, text: 'Set up alerts for repeated patch failures and give every exception an owner and an expiry date.', why: 'Closes the gaps the evidence found.' },
          { id: 'z4', correct: false, text: 'Stop reporting compliance to avoid confusion.', why: 'Leadership still needs a figure. It must be honest, not absent.' },
          { id: 'z5', correct: false, text: 'Patch every system in one weekend.', why: 'It ignores risk, ignores testing, and will cause outages.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'risk-exception',
    title: 'The exception request',
    skill: 'data',
    minutes: 20,
    blurb: 'A department wants to keep running a critical flaw. Rank the exception requests, check the facts on the worst one, and decide what to approve and on what terms.',
    brief: [
      'Several departments have asked for exceptions: permission to leave a vulnerability unfixed. As the vulnerability manager you recommend a decision on each, and the risk owner signs. Exceptions are legitimate, but they have to be earned: an owner, a reason, other protections and a date by which it is reviewed.',
      'You will rank the requests by the risk they carry, investigate the most worrying one, decide the terms, check the written exception record before it is filed, and report to the risk committee.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'requests', type: 'prioritise', title: 'Rank the exception requests',
        intro: 'Tap the requests in order, the one carrying the most risk first. Think about exposure, how bad a compromise would be, and what other protection is in place.',
        items: [
          { id: 'e1', source: 'Finance', priority: 1, text: 'Keep the old payment gateway unpatched for a year. It is reachable from the internet and processes card payments.', why: 'Exposed, valuable and handling cards. The strongest case for refusing or heavily conditioning an exception.' },
          { id: 'e2', source: 'Engineering', priority: 2, text: 'Leave an unpatched database server alone until the next release. It is only reachable from two application servers, and holds customer records.', why: 'Sensitive data, but the access path is narrow. It can be held with strong conditions and a firm date.' },
          { id: 'e3', source: 'Facilities', priority: 3, text: 'Do not patch the building access-control controllers. They are on their own isolated network and hold only door schedules.', why: 'Hard to patch and low impact. A reasonable exception, if the isolation is real.' },
          { id: 'e4', source: 'Marketing', priority: 4, text: 'Skip the browser update on three design workstations because it breaks a plug-in. They are used offline.', why: 'Small exposure and limited impact. An easy exception with a short review.' },
          { id: 'e5', source: 'Training', priority: 5, text: 'Leave the old demo server in the training room as it is. It is switched off and has no data.', why: 'A server that is off and holds nothing carries almost no risk. Note it and move on.' },
        ],
      },
      {
        id: 'gateway', type: 'evidence', title: 'Investigate the payment gateway request',
        intro: 'Finance says the gateway is "safe because nobody knows about it". Find out whether that is true, and what the exposure really is. Flag only what the records support.',
        clues: {
          exposed: { strength: 'strong', text: 'The gateway\'s management page is reachable from the internet with a password only.' },
          exploit: { strength: 'strong', text: 'A working exploit for its flaw is publicly available.' },
          cards: { strength: 'strong', text: 'It processes about 3,000 card payments a day.' },
          nocomp: { strength: 'strong', text: 'There are no compensating controls: no web application firewall, no network restriction and no extra monitoring.' },
          vendor: { strength: 'weak', text: 'The vendor stopped supporting the product 14 months ago.' },
        },
        artefacts: [
          {
            id: 'exposure', title: 'Exposure and configuration',
            lines: [
              { id: 'g1', type: 'clue', clue: 'exposed', text: 'External scan: GW-OLD management page reachable on the internet (443), password only, no MFA', note: 'It is findable, so "nobody knows about it" is wrong. Scanners find such pages within hours.' },
              { id: 'g2', type: 'clue', clue: 'exploit', text: 'Public exploit database: working exploit for the gateway\'s remote code execution flaw, published 5 months ago', note: 'Anyone can use it, without special skills.' },
              { id: 'g3', type: 'herring', text: 'Gateway uptime: 902 days', note: 'A long uptime means missed patches, not safety. It is worth noting, but it is not a separate finding.' },
              { id: 'g4', type: 'herring', text: 'Last backup: completed last night', note: 'Good practice, but it does not reduce the exposure.' },
            ],
          },
          {
            id: 'business', title: 'Business and control records',
            lines: [
              { id: 'g5', type: 'clue', clue: 'cards', text: 'Payments: GW-OLD processed 3,012 card transactions yesterday', note: 'A compromise could expose card data and stop trading, so the impact is high.' },
              { id: 'g6', type: 'clue', clue: 'nocomp', text: 'Control register: GW-OLD: no WAF, no IP restriction, not segmented, no EDR (unsupported)', note: 'Nothing else would stop or detect an attacker. An exception without these is just a gap.' },
              { id: 'g7', type: 'clue', clue: 'vendor', text: 'Vendor: end of support reached 14 months ago; no further security updates', note: 'There will be no vendor fix, so a real plan to replace it is needed. It is context, not a measure of exposure.' },
              { id: 'g8', type: 'herring', text: 'Finance says: "The replacement project is budgeted for next year"', note: 'A plan for later does not reduce today\'s risk. It matters when setting the end date.' },
            ],
          },
        ],
      },
      {
        id: 'terms', type: 'decision', title: 'Decide: the terms of the exception',
        intro: 'The finance director presses: "We will take the risk. Just sign it off for a year."',
        prompt: 'What do you recommend?',
        options: [
          { id: 'conditional', quality: 3, text: 'Do not grant a blanket year. Recommend a short exception, with compensating controls in place first (restrict access to the management page, add a web application firewall rule and monitoring), a named executive owner, a 90-day review and a dated replacement plan', set: { conditional: true }, consequence: 'The exposure falls straight away at a low cost, someone senior owns what is left, and the replacement has a date. The finance director gets a workable path.' },
          { id: 'year', quality: 2, text: 'Approve the year, and record it in the register', set: { blanket: true }, consequence: 'It is written down, but nothing reduces the exposure and nobody looks at it again until it fails.' },
          { id: 'refuse', quality: 1, text: 'Refuse outright and tell finance to patch it', set: { refused: true }, consequence: 'It cannot be patched, because there is no fix. Finance ignores the refusal and runs the system without any controls.' },
          { id: 'quiet', quality: 0, text: 'Leave it unrecorded and hope for the best', set: { hiddenx: true }, consequence: 'The risk exists and nobody has accepted it. When it is used, no one knows it was ever discussed.' },
        ],
      },
      {
        id: 'record', type: 'review', title: 'Review the draft exception record',
        intro: 'Before the exception is filed, a colleague has written up the record. The risk committee will rely on it.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'k1', sound: true, text: 'The gateway is reachable from the internet and processes about 3,000 card payments a day.', why: 'Supported by the scan and the payment data.' },
          { id: 'k2', sound: false, text: 'The risk is low because nobody knows the gateway exists.', why: 'Obscurity is not a control. Scanners find exposed systems routinely.' },
          { id: 'k3', sound: false, text: 'The exploit is theoretical.', why: 'A working exploit has been public for five months.' },
          { id: 'k4', sound: true, text: 'The vendor has ended support, so no fix will be issued and replacement is the only permanent answer.', why: 'Supported by the vendor\'s support notice.' },
          { id: 'k5', sound: false, text: 'An exception means the risk has been removed.', why: 'An exception records that someone has accepted the risk. It does not reduce it.' },
          { id: 'k6', sound: true, text: 'The exception is conditional on compensating controls and has an owner and a review date.', why: 'That is what makes an exception acceptable.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your report to the risk committee',
        intro: 'Your recommendation to the committee. Include what the evidence supports, how the discussion went and what you recommend.',
        statements: [
          { id: 'q1', correct: true, text: 'The payment gateway is internet-facing, has a public exploit, processes about 3,000 card payments a day and has no compensating controls.', why: 'Shown by the evidence.' },
          { id: 'q2', correct: true, text: 'The vendor no longer supports the product, so replacement is the only permanent fix.', why: 'Shown by the support notice.' },
          { id: 'q3', correct: true, text: 'The other four requests carry lower risk and have been ranked accordingly.', why: 'An accurate description of the ranking.' },
          { id: 'q4', correct: true, text: 'Any exception needs an owner, other protections in place, a reason and a review date.', why: 'The conditions that make an exception defensible.' },
          { id: 'q5', correct: false, text: 'The gateway has been compromised.', why: 'Unsupported. There is exposure, not evidence of an attack.' },
          { id: 'q6', correct: false, text: 'Finance has acted irresponsibly.', why: 'A judgement about a colleague, not a finding.' },
          { id: 'q7', correct: false, text: 'All exceptions should be refused.', why: 'Some are reasonable. The job is to set sensible conditions, not to say no to everything.' },
          { id: 'q8', when: 'conditional', correct: true, text: 'A short, conditional exception was recommended: controls first, a named executive owner, a 90-day review and a dated replacement.', why: 'An accurate record of a sound recommendation.' },
          { id: 'q9', when: 'blanket', correct: true, text: 'A one-year exception was recorded with no change to the exposure.', why: 'An honest description of an exception that did not reduce the risk.' },
          { id: 'q10', when: 'refused', correct: true, text: 'The request was refused outright, and the system continues to run without controls because no patch exists.', why: 'An honest account of an outcome that did not help.' },
          { id: 'q11', when: 'hiddenx', correct: true, text: 'The risk was not recorded, so nobody has formally accepted it.', why: 'An honest record of an omission.' },
        ],
        actions: [
          { id: 'w1', correct: true, text: 'Put the access restriction and firewall rule in place this week, and review progress in 90 days.', why: 'The quickest way to reduce the exposure.' },
          { id: 'w2', correct: true, text: 'Agree a dated plan to replace the gateway, with the funding brought forward if the risk does not fall.', why: 'It deals with the cause.' },
          { id: 'w3', correct: true, text: 'Record every exception with an owner, a reason, the controls in place and an expiry date, and report expired ones.', why: 'It stops exceptions becoming permanent by default.' },
          { id: 'w4', correct: false, text: 'Switch the gateway off until it is replaced.', why: 'It stops payments and ignores cheaper protections.' },
          { id: 'w5', correct: false, text: 'Approve all five requests for a year.', why: 'It ignores the large differences in risk.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'vm-exam',
    title: 'Promotion exam: Vulnerability Management Analyst',
    skill: 'data',
    minutes: 26,
    blurb: 'A critical flaw, thin capacity and a sceptical director. Silver or better to pass.',
    brief: [
      'It is Wednesday and this is your promotion exam. A vendor has disclosed a critical flaw affecting several of your systems. The CTO wants a plan by lunchtime. You have limited people, incomplete data and one system where the fix is hard.',
      'The case tests the whole of the role: ranking by risk, spending limited capacity well, finding out what is actually exposed, standing firm on a request to delay, and making sure the report to leadership says what the evidence supports. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the affected systems',
        intro: 'The vendor flaw (CVE-2099-4417, remote code execution, no authentication needed) affects five systems. Rank them by risk, highest first.',
        items: [
          { id: 'a1', source: 'Customer VPN', priority: 1, text: 'The VPN gateway: internet-facing, used by 800 staff, and the vendor says exploitation has begun.', why: 'Exposed to the internet, a way into everything, and already being exploited.' },
          { id: 'a2', source: 'Partner portal', priority: 2, text: 'The partner portal: internet-facing, holds contract documents, no sign of exploitation yet.', why: 'Exposed and valuable, but not yet attacked. Straight after the VPN.' },
          { id: 'a3', source: 'Internal wiki', priority: 3, text: 'The internal wiki: reachable by all staff, holds internal procedures.', why: 'An insider or an attacker already inside could use it, but it is not exposed to the internet.' },
          { id: 'a4', source: 'Test lab', priority: 4, text: 'The test lab server: internal, holds only fake data and is reset weekly.', why: 'Little to lose, and easily rebuilt.' },
          { id: 'a5', source: 'Old archive', priority: 5, text: 'The archive server: switched off since March, kept for audit.', why: 'It cannot be attacked while it is off. Note it, and patch before it is next powered on.' },
        ],
      },
      {
        id: 'capacity', type: 'allocate', unit: 'analyst-days', budget: 9, title: 'Spend this week\'s effort',
        intro: 'You have nine analyst-days to deal with this. Spend all nine across these four pieces of work.',
        items: [
          { id: 'b1', source: 'VPN', ideal: 3, text: 'Patch the VPN gateway and check it for signs it was already exploited.', why: 'It is the most urgent and needs patching and checking, so it takes the biggest share.' },
          { id: 'b2', source: 'Portal', ideal: 3, text: 'Patch the partner portal, test it and check its logs.', why: 'Exposed and valuable, and a business system that needs careful testing.' },
          { id: 'b3', source: 'Scoping', ideal: 2, text: 'Find out whether any other system runs the affected product that is not in the inventory.', why: 'The flaw you do not know about is the one that gets you. A little effort here pays off.' },
          { id: 'b4', source: 'Internal', ideal: 1, text: 'Patch the internal wiki and the test lab in the normal cycle.', why: 'Low exposure, so the normal cycle is enough.' },
        ],
      },
      {
        id: 'scope', type: 'evidence', title: 'Find out what is really exposed',
        intro: 'The inventory lists five systems, but the CTO asks: "Is that everything?" Check. Flag only what the records support.',
        clues: {
          unlisted: { strength: 'strong', text: 'A sixth server runs the affected product but is not in the asset inventory.' },
          internet: { strength: 'strong', text: 'That unlisted server is reachable from the internet.' },
          unscanned: { strength: 'strong', text: 'It has never been scanned, because scans only cover inventory systems.' },
          probe: { strength: 'strong', text: 'The firewall shows scans for the affected product\'s port against that server yesterday from 203.0.113.58.' },
          owner: { strength: 'weak', text: 'It appears to belong to a team that left the company last year.' },
        },
        artefacts: [
          {
            id: 'inv', title: 'Inventory and network scan',
            lines: [
              { id: 'c1', type: 'clue', clue: 'unlisted', text: 'External scan of the company\'s address range found product banner on 198.51.100.40: not in the CMDB', note: 'A system you did not know you had. It is exactly the sort of gap that gets exploited.' },
              { id: 'c2', type: 'clue', clue: 'unscanned', text: 'Scan scope: inventory systems only. 198.51.100.40 has no scan history.', note: 'Nobody has ever checked it, so its state is unknown.' },
              { id: 'c3', type: 'herring', text: 'Inventory: 1,204 systems, last audited 6 months ago', note: 'An old audit date explains how a gap could arise, but is not itself a finding.' },
              { id: 'c4', type: 'herring', text: 'Scan completion rate: 98%', note: 'The scan finished successfully for the systems it covers. It says nothing about the ones outside its scope.' },
            ],
          },
          {
            id: 'fw', title: 'Firewall and ownership records',
            lines: [
              { id: 'c5', type: 'clue', clue: 'internet', text: 'Firewall: NAT rule publishes 198.51.100.40 on port 8443 to the internet', note: 'Anyone can reach it.' },
              { id: 'c6', type: 'clue', clue: 'probe', text: 'Firewall log: 203.0.113.58 probed 198.51.100.40:8443 yesterday (12 connections)', note: 'Someone is already looking at it, which makes the unknown server urgent.' },
              { id: 'c7', type: 'clue', clue: 'owner', text: 'DNS note: record created by a team that no longer exists', note: 'Useful for tracking it down, but it does not change the risk.' },
              { id: 'c8', type: 'herring', text: 'Firewall: 4,100 blocked connections an hour (normal level)', note: 'Background noise. It is not specific to this server.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the CTO wants it quiet',
        intro: 'The CTO says: "Patch the VPN and the portal, then tell the board it is all done. I do not want to alarm them about an unknown server."',
        prompt: 'What do you do?',
        options: [
          { id: 'honest', quality: 3, text: 'Patch the VPN and portal as planned, take the unlisted server off the internet today until it is understood, and tell the CTO the report must include the unknown server and what is not yet known', set: { honest: true }, consequence: 'The exposure falls quickly and the CTO has an accurate account for the board. It is less comfortable, but it is the version that survives questions.' },
          { id: 'partial', quality: 2, text: 'Patch the VPN and portal, and note the unlisted server in the report but leave it online while you investigate', set: { partial: true }, consequence: 'The report is honest, but a probed, unscanned server stays on the internet for another week.' },
          { id: 'comply', quality: 1, text: 'Patch the two systems and tell the board it is all done, as the CTO asked', set: { complied: true }, consequence: 'The board is told something untrue. The unknown server is breached ten days later.' },
          { id: 'ignore', quality: 0, text: 'Patch nothing until the full inventory is complete', set: { frozen: true }, consequence: 'Nothing is fixed for a month while you wait for a perfect picture, and the VPN is exploited on day three.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft for the board',
        intro: 'A colleague has drafted the update to the board.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'A critical flaw in a vendor product affects at least six systems, two of which are internet-facing and in active use.', why: 'Supported by the inventory and the scan results.' },
          { id: 'j2', sound: false, text: 'All affected systems have been patched.', why: 'Unsupported. An unlisted server has not been dealt with and the others have only just been patched.' },
          { id: 'j3', sound: false, text: 'There is no evidence anyone has attacked us.', why: 'Contradicted by the firewall log, which shows probing of the unlisted server and the vendor\'s report of exploitation.' },
          { id: 'j4', sound: true, text: 'We have found a server that is missing from the inventory and have taken it off the internet while we investigate.', why: 'Accurate and appropriately cautious.' },
          { id: 'j5', sound: false, text: 'The inventory is accurate and complete.', why: 'Contradicted by the finding of the unlisted server.' },
          { id: 'j6', sound: true, text: 'We do not yet know whether any of the affected systems was successfully attacked before patching.', why: 'An honest statement of what is not known.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not yet known.',
        statements: [
          { id: 'r1', correct: true, text: 'A vendor flaw (CVE-2099-4417, remote code execution without authentication) affects the VPN gateway and the partner portal, both internet-facing.', why: 'Shown by the inventory.' },
          { id: 'r2', correct: true, text: 'A further server running the affected product was found that was not in the asset inventory, so it had never been scanned.', why: 'Shown by the external scan.' },
          { id: 'r3', correct: true, text: 'The firewall shows someone probing the unlisted server yesterday.', why: 'Shown by the firewall log.' },
          { id: 'r4', correct: true, text: 'It is not yet known whether any system was attacked successfully, and checking is under way.', why: 'An honest statement of what is unknown.' },
          { id: 'r5', correct: false, text: 'The company has been breached.', why: 'Unsupported. You have exposure and probing, not a confirmed breach.' },
          { id: 'r6', correct: false, text: 'The inventory team failed.', why: 'A judgement about colleagues. The report states the gap and recommends a fix.' },
          { id: 'r7', correct: false, text: 'The risk is now fully removed.', why: 'Unsupported while the investigation continues.' },
          { id: 'r8', when: 'honest', correct: true, text: 'The VPN and portal were patched, the unlisted server was taken off the internet, and the report was kept complete at the CTO\'s request to be accurate.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'partial', correct: true, text: 'The unlisted server was reported but left online during the investigation.', why: 'An honest account of a decision that carried risk.' },
          { id: 'r10', when: 'complied', correct: true, text: 'The board was told that everything had been patched, which was not accurate because of the unlisted server.', why: 'An honest account of a misleading statement.' },
          { id: 'r11', when: 'frozen', correct: true, text: 'No patching was done while the inventory was being completed, which left known exploited systems exposed.', why: 'The honest consequence of waiting for perfect information.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Investigate the unlisted server for signs of compromise, then patch or retire it, and find its owner.', why: 'The urgent unknown.' },
          { id: 'a2', correct: true, text: 'Scan the company\'s whole address range regularly, not only the inventory, and add everything found to the inventory.', why: 'Closes the gap that hid the server.' },
          { id: 'a3', correct: true, text: 'Check the VPN gateway and the portal logs for any sign of an attack before patching.', why: 'Patching does not show whether someone already got in.' },
          { id: 'a4', correct: false, text: 'Rebuild the whole estate.', why: 'Out of proportion and unnecessary.' },
          { id: 'a5', correct: false, text: 'Tell the board nothing until the investigation is finished.', why: 'Leadership needs an honest, interim account.' },
        ],
      },
    ],
  },
];
