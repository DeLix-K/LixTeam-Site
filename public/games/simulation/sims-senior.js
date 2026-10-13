// Senior-level simulations. Everything here is fictional. IP addresses come
// from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// These use the stage types that appear at Senior level:
//   prioritise  rank competing incidents from most to least urgent
//   review      find the flawed or unsupported claims in a junior analyst's draft
// alongside evidence, decision and report stages (see engine.js).

const RATINGS = [
  { name: 'Overwhelmed', blurb: 'Too much slipped. Read each stage note: this is the level where prioritising and judgement matter more than speed.' },
  { name: 'Holding it together', blurb: 'You kept the worst from happening, with gaps in priorities, evidence or judgement.' },
  { name: 'Senior judgement', blurb: 'Sound priorities, defensible decisions and careful, honest reporting.' },
  { name: 'Exceptional', blurb: 'Precise priorities, the right evidence, proportionate decisions, sharp mentoring and an accurate report.' },
];

export const SENIOR = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'long-weekend',
    title: 'Operation Long Weekend',
    skill: 'data',
    minutes: 20,
    blurb: 'It is 16:30 before a bank holiday and four things have landed at once. Decide what matters most, then work the worst one properly.',
    brief: [
      'It is 16:30 on the Friday before a long weekend. You are the senior analyst on shift for the next four hours, and four separate issues have just landed. You cannot work them all at once.',
      'First decide the order. Then investigate and contain the worst one, hand the rest over properly, and write it up.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'priorities', type: 'prioritise', title: 'Rank the four incidents',
        intro: 'Tap the incidents in order, most urgent first. Think about what is actively getting worse, how many people are affected, and what can wait.',
        items: [
          { id: 'i1', source: 'EDR', priority: 1, text: 'Ransomware-style behaviour on FILESRV02: mass file renames and shadow copy deletion, still running.', why: 'Active destruction right now, and it can reach every share. Nothing else is getting worse as quickly.' },
          { id: 'i2', source: 'SIEM', priority: 2, text: 'The same phishing email reached 38 finance staff. Five have clicked the link.', why: 'Likely live credential theft with a wide blast radius. It needs action soon, but the ransomware is more urgent.' },
          { id: 'i3', source: 'Helpdesk', priority: 3, text: 'A director\'s laptop was stolen from a car. The disk is encrypted.', why: 'Important, and it needs a remote lock and token revocation, but those are quick and nothing is actively unfolding.' },
          { id: 'i4', source: 'Scanner', priority: 4, text: 'A medium-severity missing patch has been found on 12 workstations.', why: 'Routine. Raise a ticket for next week.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Investigate the top incident',
        intro: 'There is plenty of noise on a busy server. Flag only what shows how this started and what it is doing.',
        clues: {
          shadow: { strength: 'strong', text: 'Shadow copies were deleted just before the encryption began.' },
          renames: { strength: 'strong', text: 'About 4,200 files were renamed with a .locked extension within three minutes.' },
          source: { strength: 'strong', text: 'All the writes come from one workstation, WKS-0872, using m.okoye\'s account.' },
          vpn: { strength: 'strong', text: 'm.okoye\'s account had just signed in over the VPN from an unfamiliar address.' },
          task: { strength: 'weak', text: 'A suspicious scheduled task was created on WKS-0872 shortly before.' },
        },
        artefacts: [
          {
            id: 'srv', title: 'FILESRV02 activity',
            lines: [
              { id: 'f1', type: 'herring', text: '16:00  Nightly-style backup job started (agent: backup-svc), heavy read activity', note: 'Heavy file reads are normal for the backup agent. It reads. It does not rename or delete.' },
              { id: 'f2', type: 'clue', clue: 'shadow', text: '16:22  vssadmin delete shadows /all  (run by m.okoye from WKS-0872)', note: 'Deleting restore points is a classic step just before encrypting. It is deliberate and hostile.' },
              { id: 'f3', type: 'clue', clue: 'renames', text: '16:23-16:26  4,212 files renamed to *.locked in \\\\FILESRV02\\Shared', note: 'Mass renaming to a new extension in minutes is the encryption itself.' },
              { id: 'f4', type: 'herring', text: '16:10  AV agent scan completed on FILESRV02: no detections', note: 'A clean scan earlier does not clear a server that changed afterwards. Scans do not show what the attacker did next.' },
            ],
          },
          {
            id: 'ws', title: 'WKS-0872 and the account',
            lines: [
              { id: 'w1', type: 'clue', clue: 'source', text: '16:22-16:26  SMB write operations to FILESRV02 originate from WKS-0872 (user m.okoye)', note: 'One workstation is the source of everything. That is where the attacker is operating from.' },
              { id: 'w2', type: 'clue', clue: 'vpn', text: '15:58  m.okoye: VPN sign-in from 203.0.113.58 (hosting provider, new device)', note: 'm.okoye normally works in the London office. A VPN session from a hosting address just before is how the attacker came in.' },
              { id: 'w3', type: 'clue', clue: 'task', text: '15:40  WKS-0872: scheduled task "WinUpdateSvc" created, running an encoded command', note: 'A disguised persistence mechanism. True and useful, but on its own it does not prove the encryption.' },
              { id: 'w4', type: 'herring', text: '09:05  m.okoye: office sign-in from the London desk (usual)', note: 'A normal sign-in hours earlier. It does not tell you what happened later.' },
              { id: 'w5', type: 'herring', text: '14:10  WKS-0872: Windows update installed', note: 'Routine patching.' },
            ],
          },
        ],
      },
      {
        id: 'contain', type: 'decision', title: 'Decide: contain the ransomware',
        intro: 'The encryption is spreading across a shared drive that 600 people use before the holiday.',
        prompt: 'What do you do first?',
        options: [
          { id: 'full', quality: 3, text: 'Isolate FILESRV02 and WKS-0872 from the network, disable m.okoye\'s account, and capture the evidence', set: { contained: true }, consequence: 'The encryption stops and the attacker loses their foothold and their account. You keep what you need to investigate.' },
          { id: 'srv', quality: 2, text: 'Isolate FILESRV02 only', set: { wsLeft: true }, consequence: 'The server stops being encrypted, but the infected workstation and the account are still live. The attacker moves to another share within the hour.' },
          { id: 'allshutdown', quality: 1, text: 'Power off all file servers across the company', set: { evidenceLost: true }, consequence: 'It stops the spread, but you lose memory evidence and cut 600 people off for the whole weekend.' },
          { id: 'wait', quality: 0, text: 'Wait until the weekend team comes on shift', set: { spread: true }, consequence: 'The encryption carries on while you wait, and it reaches two more servers before anyone acts.' },
        ],
      },
      {
        id: 'handoff', type: 'decision', title: 'Decide: handing over the other three',
        intro: 'You have contained the worst one. The other three are still open, and you finish in an hour.',
        notes: [
          { when: 'wsLeft', text: 'The attacker moved to another share while the workstation was left connected. Your handover needs to flag that more is still open.' },
          { when: 'spread', text: 'The encryption reached two more servers while you waited. The weekend team inherits a much bigger problem.' },
        ],
        prompt: 'How do you hand over the phishing incident, the stolen laptop and the patching?',
        options: [
          { id: 'written', quality: 3, text: 'Write a prioritised handover: reset the five clickers and block the link domain, confirm the remote wipe and token revocation for the stolen laptop, and a patch ticket for next week', consequence: 'The weekend team knows exactly what is urgent, what is routine and who has already been dealt with.' },
          { id: 'verbal', quality: 1, text: 'Leave a quick verbal note for the weekend team', consequence: 'Details get lost, and nobody can check later what was agreed.' },
          { id: 'allmyself', quality: 1, text: 'Try to deal with all three yourself before you leave', consequence: 'You are tired and rushed. You miss that two of the five clickers also entered their password.' },
          { id: 'ignore', quality: 0, text: 'Leave them until Tuesday', consequence: 'Five stolen passwords sit unattended for four days.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the ransomware incident report',
        intro: 'Report what the evidence supports. Be honest about anything your choices affected.',
        statements: [
          { id: 's1', correct: true, text: 'The attacker signed in over the VPN using m.okoye\'s account from a hosting provider address at 15:58.', why: 'Shown by the VPN record.' },
          { id: 's2', correct: true, text: 'A scheduled task was created on WKS-0872 at 15:40, shortly before the activity began.', why: 'Shown by the workstation record.' },
          { id: 's3', correct: true, text: 'Shadow copies on FILESRV02 were deleted at 16:22 using the m.okoye account from WKS-0872, followed by about 4,200 files being renamed to .locked.', why: 'Both are shown directly.' },
          { id: 's4', correct: true, text: 'All of the write activity came from WKS-0872.', why: 'Shown by the SMB records.' },
          { id: 's5', correct: false, text: 'The backup job caused the file changes.', why: 'The backup agent only reads. It does not rename files or delete restore points.' },
          { id: 's6', correct: false, text: 'The attack was carried out by a named criminal group.', why: 'Attribution is unsupported. You have no evidence of who is behind it, and naming a group would be speculation.' },
          { id: 's7', correct: false, text: 'No data was stolen.', why: 'Unsupported. You have shown encryption, not what else the attacker may have copied. Say it is not yet known.' },
          { id: 's8', when: 'contained', correct: true, text: 'Isolating both machines and disabling the account stopped the encryption, and evidence was preserved.', why: 'A good result of your choice, and it belongs in the record.' },
          { id: 's9', when: 'wsLeft', correct: true, text: 'Isolating only the server left the infected workstation connected, and the attacker moved on to another share.', why: 'It happened, and an honest report says so.' },
          { id: 's10', when: 'spread', correct: true, text: 'Delaying containment allowed the encryption to reach two further servers.', why: 'The report should state the consequence of the delay.' },
          { id: 's11', when: 'evidenceLost', correct: true, text: 'Powering off all file servers removed volatile evidence and made the shared drive unavailable to about 600 staff over the weekend.', why: 'An honest account of the cost of that decision.' },
        ],
        actions: [
          { id: 'r1', correct: true, text: 'Rebuild WKS-0872 and the affected servers from clean images, and restore data from the last known-clean offline backup.', why: 'You cannot trust machines the attacker controlled.' },
          { id: 'r2', correct: true, text: 'Reset m.okoye\'s credentials and check for other accounts used from the same address.', why: 'The account was the way in, and the attacker may have used others.' },
          { id: 'r3', correct: true, text: 'Assess whether any data was copied before the encryption, with the DPO, before deciding what to tell anyone.', why: 'Ransomware groups often copy data first. Assess it before assuming it was only encrypted.' },
          { id: 'r4', correct: false, text: 'Pay the ransom to get the files back quickly.', why: 'Law enforcement advises against it: it funds crime, offers no guarantee and does not remove the attacker.' },
          { id: 'r5', correct: false, text: 'Ban VPN access for everyone.', why: 'Out of proportion. Require stronger authentication and conditional access instead.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'senior-exam',
    title: 'Promotion exam: Senior Analyst',
    skill: 'data',
    minutes: 25,
    blurb: 'Ambiguous evidence, competing priorities and a junior analyst who needs your review. Silver or better to pass.',
    brief: [
      'It is Wednesday morning, the second-to-last day of month-end close at Contoso. You are the senior analyst on shift, and this is your promotion exam.',
      'The case is deliberately ambiguous: some evidence has an innocent explanation, there is business pressure to leave systems alone, and a junior analyst has drafted findings that you must check. Judgement matters more than speed, and unsupported claims cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'priorities', type: 'prioritise', title: 'Rank the morning\'s incidents',
        intro: 'Rank these from most to least urgent. One of them might be an attack or might be IT\'s new automation. Decide how seriously to take it.',
        items: [
          { id: 'q1', source: 'EDR', priority: 1, text: 'FINSRV01 (the finance application server) runs a scheduled task at 02:00 that executes an encoded PowerShell command and contacts an external address.', why: 'On the server that matters most this week, running hidden code. Even if there is an innocent explanation, it needs checking first.' },
          { id: 'q2', source: 'Cloud', priority: 2, text: 'A storage bucket holding marketing images was made publicly readable.', why: 'A real exposure, but the contents are low sensitivity. Fix it today.' },
          { id: 'q3', source: 'Identity', priority: 3, text: 'Eleven failed sign-ins for the account of a user on holiday.', why: 'Possibly a guessing attempt, but nothing succeeded and MFA protects the account. Watch it.' },
          { id: 'q4', source: 'Compliance', priority: 4, text: 'The quarterly access review is due next week.', why: 'Planned work with a deadline. Not an incident.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Investigate FINSRV01',
        intro: 'IT says they are rolling out new automation this week. Decide what is genuinely suspicious and what could be that. Flag only what you can justify.',
        clues: {
          nochange: { strength: 'strong', text: 'The task was created with no change ticket, on a server outside the automation rollout.' },
          newdomain: { strength: 'strong', text: 'The task fetches a payload from a domain registered five days ago.' },
          account: { strength: 'strong', text: 'The task runs as a service account that has never signed in to this server before.' },
          encoded: { strength: 'strong', text: 'The command is encoded and hidden, which legitimate automation rarely needs.' },
          oldpw: { strength: 'weak', text: 'The service account\'s password has not changed for two years.' },
        },
        artefacts: [
          {
            id: 'task', title: 'The scheduled task',
            lines: [
              { id: 't1', type: 'clue', clue: 'encoded', text: 'Task "SysHealthSync" (02:00 daily): powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAA...', note: 'Hidden window and an encoded command. Genuine IT automation is normally readable and signed.' },
              { id: 't2', type: 'clue', clue: 'newdomain', text: 'Decoded: downloads and runs a script from sync-health.example, a domain registered 5 days ago', note: 'A brand-new domain delivering code to the finance server is the strongest single sign this is not routine.' },
              { id: 't3', type: 'clue', clue: 'account', text: 'Runs as svc-automation. First ever sign-in to FINSRV01 was last night at 23:48.', note: 'A service account touching this server for the first time, at night, is out of pattern.' },
            ],
          },
          {
            id: 'ctx', title: 'Context and change records',
            lines: [
              { id: 'c1', type: 'clue', clue: 'nochange', text: 'Change calendar: automation rollout covers the HR and Sales servers this week. No change record covers FINSRV01.', note: 'The innocent explanation does not cover this server. The rollout does not include it.' },
              { id: 'c2', type: 'herring', text: 'IT announcement: "New automation tooling rolling out all week to reduce manual patching"', note: 'It sounds relevant, but it is a general announcement. Read the scope before you accept it as an explanation.' },
              { id: 'c3', type: 'clue', clue: 'oldpw', text: 'svc-automation: password last changed 2 years ago; no MFA (service account)', note: 'A weak spot an attacker could have exploited. It is plausible, but it does not prove that happened.' },
              { id: 'c4', type: 'herring', text: 'FINSRV01: month-end close batch jobs running 01:00-04:00', note: 'Heavy batch activity at night is expected this week. It does not explain a new hidden task.' },
              { id: 'c5', type: 'herring', text: 'FINSRV01: backup agent heartbeat every 5 minutes', note: 'Normal and unrelated.' },
            ],
          },
        ],
      },
      {
        id: 'contain', type: 'decision', title: 'Decide: act, but protect month-end',
        intro: 'The finance director calls: "Do not touch FINSRV01 until close finishes on Friday. We cannot afford downtime."',
        prompt: 'What do you do?',
        options: [
          { id: 'targeted', quality: 3, text: 'Cut the server\'s outbound network access, disable the task and the service account, snapshot the server, and keep the finance application running for staff, then agree the plan with the finance director', set: { balanced: true }, consequence: 'You stop the suspicious activity and keep the application available for close. You talked to the business instead of ignoring or overruling them.' },
          { id: 'isolate', quality: 2, text: 'Isolate FINSRV01 completely and tell finance close will slip', set: { disruptive: true }, consequence: 'It is safe, but you have halted the finance team\'s most important week without trying to keep them working.' },
          { id: 'monitor', quality: 1, text: 'Leave it running and monitor until Friday, as the finance director asked', set: { exposed: true }, consequence: 'The task runs again at 02:00 and downloads a second-stage script before anyone responds.' },
          { id: 'delete', quality: 0, text: 'Delete the scheduled task and carry on', set: { exposed: true, evidenceLost: true }, consequence: 'The task is gone, but so is the evidence, the payload may already be running and the service account is still live.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Mentor: review the junior\'s draft',
        intro: 'Part of a senior analyst\'s job is making sure other people\'s findings are accurate before they go any further.',
        draftIntro: 'Priya, a junior analyst, has drafted these findings for the incident manager. Flag every claim that is wrong, unsupported or overstated, so she can fix it before it goes out.',
        statements: [
          { id: 'j1', sound: true, text: 'A scheduled task on FINSRV01 runs an encoded PowerShell command that downloads a script from a recently registered domain.', why: 'Supported by the task record.' },
          { id: 'j2', sound: true, text: 'The task was created outside the automation rollout and has no change record.', why: 'Supported by the change calendar.' },
          { id: 'j3', sound: false, text: 'This is a nation-state attack.', why: 'Nothing supports attribution of any kind. Claiming it would be speculation and could escalate the incident unfairly.' },
          { id: 'j4', sound: false, text: 'svc-automation\'s password was cracked.', why: 'An old password is a risk, not evidence of cracking. How the account was used is not yet known.' },
          { id: 'j5', sound: false, text: 'No financial data left the server.', why: 'Unsupported. You have no data on what the downloaded script did. The honest statement is that this is not yet known.' },
          { id: 'j6', sound: false, text: 'IT\'s automation rollout caused this task.', why: 'The rollout does not cover FINSRV01, and nothing links the task to it. This was a plausible but unsupported claim.' },
          { id: 'j7', sound: true, text: 'The service account first signed in to FINSRV01 at 23:48 last night.', why: 'Supported by the sign-in record.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the incident report',
        intro: 'Your own report for the incident manager. Include what the evidence supports and recommend proportionate actions.',
        statements: [
          { id: 'n1', correct: true, text: 'A hidden, encoded scheduled task on FINSRV01 downloads code from a domain registered five days ago.', why: 'Shown directly.' },
          { id: 'n2', correct: true, text: 'The task runs as svc-automation, which had never signed in to FINSRV01 before last night.', why: 'Shown by the sign-in record.' },
          { id: 'n3', correct: true, text: 'The task was not covered by any change record, and FINSRV01 is outside the automation rollout.', why: 'Shown by the change calendar.' },
          { id: 'n4', correct: true, text: 'It is not yet known what the downloaded script did or whether any data was accessed.', why: 'An honest statement of what is unknown. A good report says what you do not know.' },
          { id: 'n5', correct: false, text: 'The incident has been attributed to a specific threat actor.', why: 'Unsupported.' },
          { id: 'n6', correct: false, text: 'The service account\'s password was stolen in a known data breach.', why: 'No such evidence.' },
          { id: 'n7', correct: false, text: 'The finance director\'s request to leave the server running was unreasonable.', why: 'A judgement about a colleague is not a finding, and it was a reasonable worry. Reports record facts.' },
          { id: 'n8', when: 'balanced', correct: true, text: 'Outbound access, the task and the service account were disabled while the finance application stayed available for month-end close.', why: 'An accurate record of a balanced decision.' },
          { id: 'n9', when: 'disruptive', correct: true, text: 'Isolating FINSRV01 fully stopped the activity but paused the finance team\'s month-end work.', why: 'An honest account of the trade-off.' },
          { id: 'n10', when: 'exposed', correct: true, text: 'The task executed again before containment, so a second-stage script may have run.', why: 'The consequence of leaving it in place, and it belongs in the report.' },
          { id: 'n11', when: 'evidenceLost', correct: true, text: 'The scheduled task was deleted before it was captured, so some evidence has been lost.', why: 'Honest reporting about your own action.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Investigate what the downloaded script did on FINSRV01, including any outbound connections and file access.', why: 'Scope is the key open question.' },
          { id: 'a2', correct: true, text: 'Rotate svc-automation\'s credentials, move it to a managed credential with restricted logon rights, and check where else it has been used.', why: 'It is the foothold, and it is shared infrastructure.' },
          { id: 'a3', correct: true, text: 'Add alerting for new scheduled tasks and encoded PowerShell on finance servers.', why: 'Closes the visibility gap that let this run until morning.' },
          { id: 'a4', correct: false, text: 'Disable all service accounts company-wide.', why: 'Out of proportion, and it would break the business.' },
          { id: 'a5', correct: false, text: 'Notify all staff of a "major breach".', why: 'Premature and inaccurate. You do not yet know the scope.' },
        ],
      },
    ],
  },
];
