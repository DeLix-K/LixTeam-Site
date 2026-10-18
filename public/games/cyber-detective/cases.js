// Cyber Detective cases. Everything here is fictional. IP addresses come from
// the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24), and the
// ".example" and other made-up domains are not real organisations.
//
// A case has artefacts (evidence). Each artefact has lines of type:
//   clue    - a real finding (links to a clue id, may unlock more evidence)
//   herring - looks suspicious but is not; the note says why
//   plain   - ordinary context
// Clue strength: 'strong' = the evidence that actually proves the attack;
// 'weak' = true, but not enough on its own.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right attack and the right first move.' },
];

import { EXTRA } from './cases-extra.js';
import { LEAD } from './cases-lead.js';
import { VULN } from './cases-vuln.js';
import { NETWORK } from './cases-network.js';
import { PENTEST } from './cases-pentest.js';
import { ENGINEER } from './cases-engineer.js';
import { CLOUD } from './cases-cloud.js';
import { ENGINEER_LEAD } from './cases-engineer-lead.js';
import { VULN_LEAD } from './cases-vuln-lead.js';
import { PENTEST_LEAD } from './cases-pentest-lead.js';

const CORE = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'invoice',
    title: 'The invoice that was not',
    skill: 'email',
    blurb: 'A finance colleague clicked a supplier invoice link and typed her password. Trace what really happened.',
    brief: [
      'Priya Nair (Finance) reports an email called "Invoice 88213 - payment overdue" from your supplier Fabrikam Parts. She clicked the link and, because the page asked her to sign in, she typed her work password. She now feels uneasy.',
      'Your real supplier uses the domain fabrikamparts.com. You have the email headers and the message, and you can look up more evidence as you find your way in. Flag the lines you think matter.',
    ],
    ratings: RATINGS,
    clues: {
      lookalike: { strength: 'strong', text: 'The sender domain fabrikam-parts.com is a lookalike of the real fabrikamparts.com.' },
      urlmismatch: { strength: 'strong', text: 'The link\'s real domain is invoice-view.net; "fabrikamparts.com" is only a subdomain used to fool the eye.' },
      newdomain: { strength: 'strong', text: 'invoice-view.net was registered two days ago.' },
      newlogin: { strength: 'strong', text: 'Eleven minutes after the email arrived, Priya\'s account signed in from a datacentre abroad on a new device.' },
      urgency: { strength: 'weak', text: 'The subject pressures her to act now ("overdue", "view now").' },
      generic: { strength: 'weak', text: 'The greeting is generic ("Dear customer").' },
      scope: { strength: 'weak', text: 'Fourteen people received it and three clicked, so more accounts may be exposed.' },
    },
    artefacts: [
      {
        id: 'headers',
        title: 'Email headers',
        blurb: 'The hidden technical details of the message.',
        lines: [
          { id: 'h-from', type: 'clue', clue: 'lookalike', text: 'From: "Fabrikam Parts Accounts" <accounts@fabrikam-parts.com>', note: 'Your real supplier is fabrikamparts.com. This is fabrikam-parts.com, with a hyphen: a lookalike domain made to imitate it.' },
          { id: 'h-reply', type: 'plain', text: 'Reply-To: accounts@fabrikam-parts.com', note: 'The same as the From address, so it adds nothing new.' },
          { id: 'h-rp', type: 'herring', text: 'Return-Path: <bounce@mailer-7712.bulkmail-relay.net>', note: 'A different Return-Path is normal for mail sent through a mailing service. On its own it is not suspicious.' },
          { id: 'h-spf', type: 'herring', text: 'Received-SPF: pass (fabrikam-parts.com designates 198.51.100.24 as a permitted sender)', note: 'SPF only proves the mail came from a server that domain allows. The attacker owns the lookalike domain, so it passes. A pass does not mean the domain is the real supplier.' },
          { id: 'h-dmarc', type: 'herring', text: 'Authentication-Results: dkim=pass header.d=fabrikam-parts.com; dmarc=pass (p=none)', note: 'These checks pass for the attacker\'s own domain, and "p=none" means receivers are told to take no action anyway. Authentication shows the domain was not forged, not that it can be trusted.' },
          { id: 'h-date', type: 'herring', text: 'Date: Tue, 13 Oct 2026 03:14:09 +0000', note: 'That is 04:14 UK time. Odd hours can hint at another time zone, but scheduled mail goes out at any time. Not enough alone.' },
          { id: 'h-mailer', type: 'herring', text: 'X-Mailer: Microsoft Outlook 16.0', note: 'Headers like this are written by the sender and are trivial to fake. They prove nothing.' },
          { id: 'h-subject', type: 'clue', clue: 'urgency', text: 'Subject: Invoice 88213 - payment overdue, view now', note: 'Pressure to act fast is a common phishing trait, though real suppliers do chase overdue invoices too. Weak evidence on its own.' },
          { id: 'h-size', type: 'plain', text: 'Content-Length: 18,402', note: 'Nothing unusual.' },
        ],
      },
      {
        id: 'message',
        title: 'The email as Priya saw it',
        blurb: 'The message body and link.',
        lines: [
          { id: 'm-greet', type: 'clue', clue: 'generic', text: 'Dear customer,', note: 'A supplier you deal with regularly would address you or your company by name.' },
          { id: 'm-body', type: 'plain', text: 'Your invoice 88213 is overdue. Please view and pay it using the secure link below.', note: 'The wording is ordinary. The link is what matters.' },
          { id: 'm-link', type: 'clue', clue: 'urlmismatch', text: '[ View invoice 88213 ]  ->  https://fabrikamparts.com.invoice-view.net/login?id=88213', note: 'Read a web address up to the first single slash and look at the last two parts before it. The real domain is invoice-view.net. "fabrikamparts.com" is just a subdomain put in front to fool you.' },
          { id: 'm-sign', type: 'plain', text: 'Fabrikam Parts Accounts Team', note: 'A signature is only text. Anyone can type it.' },
        ],
      },
      {
        id: 'whois',
        title: 'Domain registration lookup',
        blurb: 'Who registered invoice-view.net, and when?',
        unlockedBy: 'urlmismatch',
        lines: [
          { id: 'w-domain', type: 'plain', text: 'Domain: invoice-view.net', note: 'This is just the domain being looked up.' },
          { id: 'w-created', type: 'clue', clue: 'newdomain', text: 'Created: 2026-10-11 (2 days ago)', note: 'A domain registered two days ago that is already collecting logins is very suspicious. Real suppliers use domains that have existed for years.' },
          { id: 'w-reg', type: 'herring', text: 'Registrar: budget registrar, WHOIS privacy enabled', note: 'Privacy services are used by many legitimate owners. Not suspicious on its own.' },
          { id: 'w-ns', type: 'herring', text: 'Name servers: ns1.cloudhost-dns.net', note: 'Common hosting infrastructure. Nothing to see.' },
          { id: 'w-host', type: 'plain', text: 'Web host: shared hosting provider', note: 'Ordinary.' },
        ],
      },
      {
        id: 'logins',
        title: 'Priya Nair: sign-in history',
        blurb: 'What did her account do before and after the click?',
        unlockedBy: 'newdomain',
        lines: [
          { id: 'l-1', type: 'plain', text: '2026-10-12 08:02  Success  London office (known device)', note: 'Normal: her usual place and device.' },
          { id: 'l-2', type: 'plain', text: '2026-10-12 17:31  Success  London office (known device)', note: 'Normal.' },
          { id: 'l-3', type: 'herring', text: '2026-10-13 07:55  Success  Mobile app, home broadband (known device)', note: 'Her usual phone at her usual home address. Normal.' },
          { id: 'l-4', type: 'herring', text: '2026-10-13 09:19  Mail read  Outlook web, London office', note: 'She opened the email from her normal location, which fits her account of events. This is where the phishing began.' },
          { id: 'l-5', type: 'clue', clue: 'newlogin', text: '2026-10-13 09:31  Success  203.0.113.58, datacentre (other country), new device', note: 'The email landed at 09:20 and this sign-in came 11 minutes later from a datacentre abroad on a device she has never used. This is the attacker using the password she typed into the fake page.' },
        ],
      },
      {
        id: 'scope',
        title: 'Mail flow: who else received it?',
        blurb: 'How far did the message spread?',
        unlockedBy: 'newlogin',
        lines: [
          { id: 's-1', type: 'clue', clue: 'scope', text: 'Recipients: 14 staff in Finance and Procurement. Link clicked by 3.', note: 'It was not just Priya: three people clicked, so more accounts may be exposed. This changes how widely you must respond.' },
          { id: 's-2', type: 'herring', text: 'Spam score: 2.1 / 10', note: 'A low score only means it did not look like bulk spam. Targeted phishing is written to avoid filters.' },
          { id: 's-3', type: 'plain', text: 'Delivered: 09:20, all 14 mailboxes', note: 'Delivered at the same time to everyone.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'cred', correct: true, text: 'Phishing to steal credentials, leading to an account takeover', explain: 'A lookalike sender, a link that leads to a fake sign-in page on a brand-new domain, and a sign-in from abroad minutes after the click is a textbook credential-harvesting phish.' },
        { id: 'supplier', correct: false, text: 'The real supplier\'s mailbox was hacked', explain: 'The email did not come from the real supplier\'s domain. It came from a lookalike, so the real supplier was not necessarily compromised.' },
        { id: 'malware', correct: false, text: 'Malware delivered by an attachment', explain: 'There was no attachment. The link led to a sign-in page designed to collect a password.' },
        { id: 'spray', correct: false, text: 'A password-spraying attack', explain: 'Password spraying tries one common password against many accounts. Here, one user typed her real password into a fake page.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'contain', correct: true, text: 'Reset Priya\'s password, revoke her sessions, block the domains, and warn the three who clicked', explain: 'The attacker already holds a working session, so you must remove it and the stolen password, cut off the infrastructure and protect the other people who clicked.' },
        { id: 'delete', correct: false, text: 'Delete the email from her inbox and close the ticket', explain: 'Deleting the email does nothing about the stolen password or the live attacker session.' },
        { id: 'allstaff', correct: false, text: 'Send a company-wide warning and wait for replies', explain: 'Warning people is useful, but waiting leaves a compromised account open. Contain first, then communicate.' },
        { id: 'blockfrom', correct: false, text: 'Block fabrikam-parts.com in the mail filter only', explain: 'That blocks one lookalike domain but leaves the attacker\'s session, the stolen password and the real phishing link untouched.' },
      ],
    },
    story: [
      '11 Oct: the attacker registers the lookalike fabrikam-parts.com and the page host invoice-view.net, and builds a fake sign-in page.',
      '13 Oct, 09:20: a convincing "overdue invoice" email lands in 14 inboxes.',
      '09:22: Priya clicks, sees a sign-in page, and types her password. Three people clicked in total.',
      '09:31: the attacker signs in from a datacentre abroad using her real password. From here they could add a rogue MFA device, set a forwarding rule and attempt invoice fraud, exactly the steps you practised in Incident Commander.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'budget',
    title: 'The budget spreadsheet',
    skill: 'everyday',
    blurb: 'A salesperson opened a spreadsheet, clicked Enable Content, and his laptop has been behaving oddly since.',
    brief: [
      'Daniel Okoye (Sales) opened "Q3_Budget_Final.xlsm", which arrived by email from someone he thought was in Finance, and clicked "Enable Content" when Excel asked. An hour later his laptop is slow and the endpoint tool raised a low-priority alert.',
      'You can examine the file and, as you find clues, more telemetry from his laptop. Flag the lines that matter.',
    ],
    ratings: RATINGS,
    clues: {
      macro: { strength: 'strong', text: 'The file contains an AutoOpen macro with heavily obfuscated code.' },
      newhash: { strength: 'strong', text: 'The file appeared two hours ago and is already circulating to other organisations.' },
      excelps: { strength: 'strong', text: 'Excel started a hidden PowerShell running an encoded command.' },
      beacon: { strength: 'strong', text: 'PowerShell contacts 198.51.100.9 every 60 seconds like a heartbeat.' },
      macrofile: { strength: 'weak', text: 'A "budget" saved as a macro-enabled .xlsm file is unusual.' },
      freshfile: { strength: 'weak', text: 'A "final" Q3 budget was created two hours before it was sent.' },
      rarenew: { strength: 'weak', text: 'The beacon domain is brand new and only this one laptop has ever looked it up.' },
    },
    artefacts: [
      {
        id: 'meta',
        title: 'File properties',
        blurb: 'Metadata and reputation for Q3_Budget_Final.xlsm.',
        lines: [
          { id: 'f-name', type: 'clue', clue: 'macrofile', text: 'File: Q3_Budget_Final.xlsm', note: '.xlsm means a macro-enabled workbook. Budgets rarely need macros, so this is a mild flag.' },
          { id: 'f-author', type: 'herring', text: 'Author: admin', note: '"admin" is a generic author name found on many files, including internal templates. Not conclusive.' },
          { id: 'f-created', type: 'clue', clue: 'freshfile', text: 'Created: 2026-10-13 07:02 (2 hours before it was emailed)', note: 'A "final" document created two hours earlier is a mild flag. Real final budgets usually have a longer history.' },
          { id: 'f-app', type: 'herring', text: 'Application: Microsoft Excel 16.0', note: 'Metadata is written by whoever made the file and can be set to anything. It proves nothing.' },
          { id: 'f-size', type: 'herring', text: 'Size: 4.1 MB', note: 'File size is not a reliable indicator either way.' },
          { id: 'f-macro', type: 'clue', clue: 'macro', text: 'Macros: yes. AutoOpen routine, 1 module, heavily obfuscated', note: 'An AutoOpen macro runs the moment content is enabled, and obfuscated code is written to hide what it does. Legitimate macros are normally readable.' },
          { id: 'f-rep', type: 'clue', clue: 'newhash', text: 'Reputation: first seen 2 hours ago, also seen at 3 other organisations', note: 'A file that appeared hours ago and is already reaching other organisations fits a live campaign.' },
        ],
      },
      {
        id: 'proc',
        title: 'Endpoint process tree',
        blurb: 'What did the laptop run after the file was opened?',
        unlockedBy: 'macro',
        lines: [
          { id: 'p-1', type: 'plain', text: 'explorer.exe', note: 'The Windows desktop. Normal parent of most user programs.' },
          { id: 'p-2', type: 'herring', text: '  OUTLOOK.EXE', note: 'Outlook is how the file arrived. Normal.' },
          { id: 'p-3', type: 'plain', text: '  EXCEL.EXE  "Q3_Budget_Final.xlsm"', note: 'This is the file being opened. What it did next is the question.' },
          { id: 'p-4', type: 'clue', clue: 'excelps', text: '    powershell.exe -nop -w hidden -enc JABzAD0ATgBlAHcA...', note: 'Excel launching a hidden PowerShell with an encoded command is a classic malware pattern. Office programs almost never need to start PowerShell.' },
          { id: 'p-5', type: 'herring', text: '  OneDrive.exe', note: 'Normal background file syncing.' },
          { id: 'p-6', type: 'herring', text: '  chrome.exe', note: 'Normal browsing.' },
        ],
      },
      {
        id: 'net',
        title: 'Network connections',
        blurb: 'Where is the laptop talking to?',
        unlockedBy: 'excelps',
        lines: [
          { id: 'n-1', type: 'clue', clue: 'beacon', text: 'powershell.exe -> 198.51.100.9:443  every 60 seconds (1,440 connections today)', note: 'Regular, identical connections like a heartbeat are beaconing: malware checking in with its operator for instructions.' },
          { id: 'n-2', type: 'herring', text: 'OUTLOOK.EXE -> outlook.office365.com:443', note: 'Normal mail traffic.' },
          { id: 'n-3', type: 'herring', text: 'Teams.exe -> teams.microsoft.com:443', note: 'Normal.' },
          { id: 'n-4', type: 'plain', text: 'chrome.exe -> various websites', note: 'Ordinary browsing.' },
        ],
      },
      {
        id: 'dns',
        title: 'DNS lookups',
        blurb: 'What names did the laptop look up?',
        unlockedBy: 'beacon',
        lines: [
          { id: 'd-1', type: 'clue', clue: 'rarenew', text: 'update-check.cdn-sync.example  ->  198.51.100.9  (first seen yesterday, asked by 1 host in the company)', note: 'A brand-new domain that nobody else has ever looked up, used by a single machine. Genuine update domains are widely used.' },
          { id: 'd-2', type: 'herring', text: 'time.windows.com', note: 'The normal clock-sync service.' },
          { id: 'd-3', type: 'herring', text: 'settings-win.data.microsoft.com', note: 'A normal Windows telemetry address.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'c2', correct: true, text: 'A malicious macro installed malware that now beacons to an attacker\'s server (command and control)', explain: 'The file ran a macro, which started a hidden PowerShell, which now contacts a rare new server on a timer. That is malware delivery followed by command and control.' },
        { id: 'ransom', correct: false, text: 'Ransomware is encrypting his files', explain: 'There is no sign of encryption or ransom notes yet. The beaconing shows the stage before: the attacker has a foothold and may deploy more later.' },
        { id: 'cred', correct: false, text: 'Credential phishing', explain: 'No fake sign-in page or password entry appears in this evidence. The danger is code running on the laptop.' },
        { id: 'insider', correct: false, text: 'An insider stealing data', explain: 'Nothing shows a person copying data. The activity is automated and starts from a file that arrived by email.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'isolate', correct: true, text: 'Isolate the laptop from the network, keep it on to preserve evidence, block the server, and find who else received the file', explain: 'Isolation stops the attacker talking to the laptop while preserving memory and evidence. Blocking the address and finding other recipients limits the spread.' },
        { id: 'reboot', correct: false, text: 'Restart it and see whether the problem clears', explain: 'A restart destroys volatile evidence and does not remove the malware, which usually persists.' },
        { id: 'av', correct: false, text: 'Run a quick antivirus scan and give it back to Daniel', explain: 'A quick scan can miss a fresh sample and you would not know what the attacker already took.' },
        { id: 'wipe', correct: false, text: 'Wipe and re-image it straight away', explain: 'Re-imaging removes the malware but destroys the evidence and skips scoping who else was hit and what was taken.' },
      ],
    },
    story: [
      '13 Oct, 07:02: the attacker builds a macro-enabled workbook posing as a Q3 budget.',
      '~08:50: it is emailed to many organisations, including Daniel.',
      '~09:10: Daniel clicks "Enable Content". The AutoOpen macro runs and starts a hidden PowerShell.',
      'From then on: the laptop beacons every minute to 198.51.100.9, waiting for the operator\'s instructions. The next steps could be stealing credentials, moving to other machines, or deploying ransomware.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'spray',
    title: 'Midnight sign-ins',
    skill: 'identity',
    blurb: 'Hundreds of failed overnight logins, and one that succeeded. Work out what you are looking at.',
    brief: [
      'Your SIEM flagged an unusual burst of overnight authentication failures across the company. One account, d.kim, shows a successful sign-in in the middle of it. You have the overnight summary and can dig into the account as you find the right clues.',
      'Not everything unusual is malicious: a colleague is travelling this week. Flag only what you can justify.',
    ],
    ratings: RATINGS,
    clues: {
      spray: { strength: 'strong', text: 'One address tried one password each against 412 accounts: password spraying.' },
      success: { strength: 'strong', text: 'The same address then succeeded on d.kim\'s account at 02:41.' },
      nomfa: { strength: 'strong', text: 'd.kim has a legacy exemption from MFA, so one guessed password was enough.' },
      rule: { strength: 'strong', text: 'Three minutes after signing in, the attacker created a rule forwarding d.kim\'s mail to an outside address.' },
      lowslow: { strength: 'weak', text: 'There were no lockouts: the attempt was slow and spread out to avoid them.' },
      weakpw: { strength: 'weak', text: 'd.kim\'s password follows a very common "Season+Year+!" pattern.' },
    },
    artefacts: [
      {
        id: 'auth',
        title: 'Overnight authentication summary',
        blurb: 'Sign-in attempts from 02:00 to 08:00.',
        lines: [
          { id: 'a-spray', type: 'clue', clue: 'spray', text: '02:11-02:39  203.0.113.58  412 accounts, 1 attempt each (411 failed)', note: 'One source trying a single password against hundreds of accounts is password spraying. Each account sees only one failure, so nothing looks wrong per account.' },
          { id: 'a-lock', type: 'clue', clue: 'lowslow', text: 'Account lockouts triggered: 0', note: 'Spraying is deliberately slow and spread out to stay under lockout limits. Zero lockouts despite 411 failures is itself a clue.' },
          { id: 'a-succ', type: 'clue', clue: 'success', text: '02:41  d.kim  Success  203.0.113.58', note: 'The same address that just failed against 411 accounts succeeded on one. That account probably had the password the attacker was trying.' },
          { id: 'a-vpn', type: 'herring', text: '03:05  j.owen  Success  VPN, Manchester (new city)', note: 'HR confirms j.owen is travelling for work this week, on his known laptop. An unusual location alone is not a compromise.' },
          { id: 'a-lee', type: 'herring', text: '07:58  a.lee  Success  London office (known device)', note: 'Normal: her usual place and device.' },
          { id: 'a-total', type: 'plain', text: 'Total sign-ins in the last 24 hours: 3,902', note: 'Context only.' },
        ],
      },
      {
        id: 'acct',
        title: 'd.kim: account activity',
        blurb: 'What happened on the account that succeeded?',
        unlockedBy: 'success',
        lines: [
          { id: 'u-rule', type: 'clue', clue: 'rule', text: '02:44  Mailbox rule created: forward all mail to an external address', note: 'Three minutes after the sign-in, a rule was created to send copies of everything outside. This is the attacker settling in and starting to collect.' },
          { id: 'u-mfa', type: 'clue', clue: 'nomfa', text: 'Conditional access: MFA not required (legacy exemption, since 2023)', note: 'This is why one guessed password was enough. MFA would have stopped the attacker at the next step.' },
          { id: 'u-pw', type: 'herring', text: 'Last password change: 14 months ago', note: 'Old, but password age alone does not show it was guessed.' },
          { id: 'u-dev', type: 'herring', text: 'Client: Chrome on Windows', note: 'Browser details are trivially faked and tell you nothing.' },
        ],
      },
      {
        id: 'pwaudit',
        title: 'Password audit for d.kim',
        blurb: 'Was the password easy to guess?',
        unlockedBy: 'nomfa',
        lines: [
          { id: 'w-pat', type: 'clue', clue: 'weakpw', text: 'Password matches a common seasonal pattern ("Season+Year+!")', note: 'Password sprays try a handful of very common passwords, such as a season and a year. This account used one.' },
          { id: 'w-len', type: 'herring', text: 'Password length: 11 characters', note: 'The length met policy. It was the predictability that mattered, not the length.' },
          { id: 'w-hist', type: 'plain', text: 'Found in known breach lists: no', note: 'It was weak and common, not leaked, which is why this was a guess and not a stolen credential.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'spray', correct: true, text: 'Password spraying', explain: 'One address tried a single common password against hundreds of accounts, stayed under lockout limits, and one account used that password.' },
        { id: 'brute', correct: false, text: 'Brute force against d.kim', explain: 'Brute force hammers one account with many guesses. Here each account got a single attempt.' },
        { id: 'stuffing', correct: false, text: 'Credential stuffing with leaked username and password pairs', explain: 'Stuffing replays real pairs from past breaches. The pattern here is one common password across many accounts, and the password was not in breach lists.' },
        { id: 'insider', correct: false, text: 'An insider misusing their access', explain: 'The activity came from an outside datacentre address and targeted hundreds of accounts, which is not what an insider does.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'contain', correct: true, text: 'Reset d.kim\'s password and revoke sessions, remove the forwarding rule, block the address, and enforce MFA for everyone, including legacy exemptions', explain: 'You must evict the attacker and undo what they set up, then remove the weakness that let them in: MFA exemptions.' },
        { id: 'blockip', correct: false, text: 'Block the IP address and carry on', explain: 'The attacker is already in via a session and a forwarding rule, and can return from another address. Blocking the IP alone leaves both.' },
        { id: 'resetall', correct: false, text: 'Force a password reset on all 412 accounts right now', explain: 'Only one account was compromised, so this is out of proportion and does not remove the attacker\'s session or the forwarding rule.' },
        { id: 'monitor', correct: false, text: 'Watch d.kim\'s account for a few days to see what the attacker does', explain: 'Leaving an attacker in while their mail is forwarded out means data leaves every minute. Contain first.' },
      ],
    },
    story: [
      '02:11: from one address, the attacker begins trying a single common password against hundreds of accounts, slowly enough to avoid lockouts.',
      '02:41: d.kim, who still has a legacy exemption from MFA and uses a Season+Year+! password, is the only account that falls.',
      '02:44: the attacker creates a forwarding rule so every new email is copied outside.',
      'Anything MFA would have blocked: this is the lesson. A weak password plus an MFA exemption is an open door.',
    ],
  },
];

// Everything the game draws from.
export const CASES = [...CORE, ...EXTRA, ...LEAD, ...VULN, ...NETWORK, ...PENTEST, ...ENGINEER, ...CLOUD, ...ENGINEER_LEAD, ...VULN_LEAD, ...PENTEST_LEAD];
