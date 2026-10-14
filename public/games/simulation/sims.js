// Incident Simulation content. Everything here is fictional. IP addresses come
// from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// A simulation is a list of stages (see engine.js for scoring and branching).
// Any alert, evidence line, option, report statement or action can carry
// `when: 'flag'` to appear only if an earlier decision set that flag.
// A stage can have `notes: [{ when?, text }]` shown when it opens, so the story
// reacts to what the player did.

const RATINGS = [
  { name: 'Incident missed', blurb: 'The response fell apart somewhere. Read the stage notes: each one shows what a strong analyst would have done.' },
  { name: 'Contained', blurb: 'You got there, but with gaps in triage, evidence, decisions or the report.' },
  { name: 'Handled well', blurb: 'A sound, defensible response from the first alert to the final report.' },
  { name: 'Textbook response', blurb: 'Accurate triage, the right evidence, proportionate decisions and an honest, well-supported report.' },
];

import { SENIOR } from './sims-senior.js';
import { LEAD } from './sims-lead.js';

const CORE = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'harbour',
    title: 'Operation Quiet Harbour',
    skill: 'data',
    minutes: 18,
    blurb: 'A supplier portal, a strange file and a large upload. Work the incident from the first alert to the final report.',
    brief: [
      'It is 08:40 on Monday. You are the on-call analyst at Contoso. Three suppliers have reported odd behaviour on the supplier portal, and the overnight queue has six alerts waiting.',
      'You will triage the alerts, investigate the evidence, make containment and communication decisions, and write the incident report. Your choices change what happens next, and what an honest report has to say.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'triage', type: 'triage', title: 'Triage the overnight alerts',
        intro: 'For each alert, decide: routine noise, worth investigating, or escalate now. Escalate what could be a live compromise.',
        alerts: [
          { id: 'a1', source: 'WAF', time: '01:50', text: '312 requests containing SQL-injection patterns to /login from 203.0.113.58 in ten minutes. All were blocked.', answer: 'noise', explain: 'Internet-wide scanning is constant, and every request was blocked. Worth a note, but not an incident by itself.' },
          { id: 'a2', source: 'Web server', time: '02:14', text: 'A file named invoice_2291.php was uploaded to /uploads/ through the supplier portal. The upload claimed to be an image (image/jpeg).', answer: 'escalate', explain: 'A script file uploaded to a public web server, disguised as an image, is a likely web shell. This needs escalating now.' },
          { id: 'a3', source: 'Endpoint', time: '03:00', text: 'The scheduled antivirus definition update completed on 40 laptops.', answer: 'noise', explain: 'Routine maintenance across many machines.' },
          { id: 'a4', source: 'Identity', time: '02:31', text: 'The service account svc-portal signed in to the database from the web server at an unusual hour.', answer: 'investigate', explain: 'Service accounts are expected to be quiet at night. It is unusual, and you need to look, but on its own it is not proof of compromise.' },
          { id: 'a5', source: 'Network', time: '03:05', text: 'WEB01 sent 1.4 GB outbound over HTTPS to 198.51.100.77, an address nobody recognises.', answer: 'escalate', explain: 'A web server sending gigabytes to an unfamiliar address is possible data theft, and it may still be happening.' },
          { id: 'a6', source: 'Email', time: '07:52', text: 'A user reports an email from a "supplier" with a spelling mistake in the sender name.', answer: 'investigate', explain: 'Probably an ordinary phish, but check it and see whether it links to anything else. It is not urgent.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Investigate the evidence',
        intro: 'Flag the lines that show how the attacker got in, what they did and what they took. Flagging routine or blocked activity costs you.',
        clues: {
          upload: { strength: 'strong', text: 'A PHP script was uploaded as a fake image through the portal.' },
          shell: { strength: 'strong', text: 'The script was then used to run commands on the server.' },
          config: { strength: 'strong', text: 'The attacker read the application\'s configuration file, which holds database credentials.' },
          db: { strength: 'strong', text: 'The stolen database credentials were used to read supplier and bank-detail tables.' },
          exfil: { strength: 'strong', text: 'About 1.4 GB was sent out to 198.51.100.77.' },
          recon: { strength: 'weak', text: 'The same address had probed the site earlier, though those attempts were blocked.' },
        },
        artefacts: [
          {
            id: 'web', title: 'Web server access log',
            lines: [
              { id: 'w1', type: 'herring', text: '01:50  203.0.113.58  POST /login  403  (blocked by WAF, x312)', note: 'Blocked requests did nothing. They are background noise.' },
              { id: 'w2', type: 'plain', text: '02:02  198.51.100.31  GET /portal/orders  200  (normal supplier traffic)', note: 'Ordinary supplier activity.' },
              { id: 'w3', type: 'clue', clue: 'upload', text: '02:14  203.0.113.58  POST /portal/upload.php  200  stored: /uploads/invoice_2291.php  (declared type image/jpeg)', note: 'A .php file accepted by an upload form that should only take images. The server will run it if requested.' },
              { id: 'w4', type: 'clue', clue: 'shell', text: '02:15  203.0.113.58  GET /uploads/invoice_2291.php?c=whoami  200', note: 'A command passed to the uploaded script and answered: the web shell is working.' },
              { id: 'w5', type: 'clue', clue: 'recon', text: '01:50  The same address, 203.0.113.58, appears in the blocked login attempts above.', note: 'The attacker probed first, was blocked, then found a different way in. Useful context, but not proof of the break-in.' },
              { id: 'w6', type: 'herring', text: '09:05 (last week)  Patch Tuesday updates applied to WEB01.', note: 'Routine patching, a week earlier. Not part of this chain.' },
            ],
          },
          {
            id: 'proc', title: 'Process activity on WEB01',
            lines: [
              { id: 'p1', type: 'plain', text: '01:00  svc-backup  nightly backup job started and finished', note: 'The normal nightly job.' },
              { id: 'p2', type: 'clue', clue: 'config', text: '02:19  php-fpm (www-data) spawned: /bin/sh -c "cat /var/www/portal/config.php"', note: 'The web process reading the application config, where database credentials are kept. The attacker is collecting the keys.' },
              { id: 'p3', type: 'herring', text: '04:00  cron: logrotate ran', note: 'Standard log rotation.' },
            ],
          },
          {
            id: 'db', title: 'Database and network records',
            lines: [
              { id: 'd1', type: 'clue', clue: 'db', text: '02:40  DB01: login by portal_app from WEB01, then SELECT * FROM suppliers; SELECT * FROM bank_details', note: 'The stolen credentials used to dump supplier names and bank details.' },
              { id: 'd2', type: 'clue', clue: 'exfil', text: '03:05  WEB01 -> 198.51.100.77:443  1.4 GB transferred over HTTPS', note: 'The data leaving the building, right after it was collected.' },
              { id: 'd3', type: 'herring', text: '03:20  DB01: scheduled statistics refresh completed', note: 'A routine database job.' },
              { id: 'd4', type: 'plain', text: '08:12  Three supplier tickets opened about "slow pages"', note: 'The first symptom users noticed.' },
            ],
          },
        ],
      },
      {
        id: 'contain', type: 'decision', title: 'Decide: first containment move',
        intro: 'You have confirmed a web shell on a public server and a large outbound transfer.',
        prompt: 'What is your first containment move?',
        options: [
          { id: 'isolate', quality: 3, text: 'Isolate WEB01 from the network (keep it powered on), block 198.51.100.77, and snapshot the disk', set: { preserved: true }, consequence: 'The attacker is cut off, and you keep the server\'s memory and disk as evidence. This is the strongest first move.' },
          { id: 'delete', quality: 1, text: 'Take the portal offline and delete the uploaded file', set: { evidenceLost: true }, consequence: 'It stops the shell, but you destroyed evidence and the attacker still holds the stolen database credentials.' },
          { id: 'blockip', quality: 0, text: 'Block the attacker\'s IP address and carry on', set: { attackerBack: true }, consequence: 'It feels decisive, but the web shell is still there. Within the hour, the attacker returns from a different address.' },
          { id: 'monitor', quality: 0, text: 'Keep monitoring for a while to learn more', set: { moreExfil: true }, consequence: 'You learn a little, but the exfiltration carries on: another 600 MB leaves while you watch.' },
          { id: 'resetall', quality: 1, text: 'Force a password reset for every supplier account', consequence: 'A lot of disruption, and it does nothing about the web shell or the stolen database credentials.' },
        ],
      },
      {
        id: 'comms', type: 'decision', title: 'Decide: who to tell, and what to say',
        intro: 'The server is dealt with. Now you must tell people.',
        notes: [
          { when: 'attackerBack', text: 'Because the shell was left in place, a second connection from a new address has just been seen. Your update will need to say so.' },
          { when: 'moreExfil', text: 'Another 600 MB left the server while you were monitoring. The scope is bigger than it needed to be.' },
          { when: 'evidenceLost', text: 'Remember that the uploaded file was deleted: some evidence is gone, and your update should be honest about that.' },
        ],
        prompt: 'Who do you tell first, and what do you say?',
        options: [
          { id: 'brief', quality: 3, text: 'Brief the incident manager and the Data Protection Officer with facts, scope and what is contained, and flag that supplier bank details were accessed', consequence: 'The right people have accurate facts quickly, and the DPO can start assessing whether anything must be reported.' },
          { id: 'allsuppliers', quality: 1, text: 'Email all suppliers straight away about a "security issue"', consequence: 'Premature. Telling people before you know the scope causes alarm and can contradict what the company later has to say.' },
          { id: 'it', quality: 1, text: 'Tell only the IT team', consequence: 'IT knows, but the people who decide on legal and regulatory duties do not. Time is being lost.' },
          { id: 'wait', quality: 0, text: 'Wait until the investigation is finished before telling anyone', consequence: 'Decision-makers are blind while the clock on any reporting duty is already running.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the incident report',
        intro: 'Include only what the evidence supports, and be honest about gaps. Choose the findings and recommendations that belong in the report.',
        statements: [
          { id: 's1', correct: true, text: 'A malicious PHP file was uploaded through the supplier portal at 02:14, disguised as an image.', why: 'Directly shown by the web server log.' },
          { id: 's2', correct: true, text: 'The attacker ran commands through that file and read the application\'s configuration file.', why: 'Shown by the access log and the process record.' },
          { id: 's3', correct: true, text: 'The attacker used the database credentials to read the supplier and bank-detail tables.', why: 'Shown by the database audit log.' },
          { id: 's4', correct: true, text: 'About 1.4 GB was sent out from WEB01 to 198.51.100.77.', why: 'Shown by the network record.' },
          { id: 's8', correct: true, text: 'The same IP address had earlier carried out blocked reconnaissance against the login page.', why: 'The same address appears in both. Supported, and useful context.' },
          { id: 's5', correct: false, text: 'A supplier\'s password was phished.', why: 'Nothing in the evidence shows credential phishing. The route in was the upload form.' },
          { id: 's6', correct: false, text: 'The attacker used a zero-day vulnerability in the web server software.', why: 'Unsupported. The flaw shown is a weak upload check, which is not a zero-day. Do not claim more than you can prove.' },
          { id: 's7', correct: false, text: 'The blocked SQL-injection attempts were how the attacker got in.', why: 'Those requests were blocked. The break-in came through the file upload.' },
          { id: 's9', when: 'evidenceLost', correct: true, text: 'Some evidence was lost when the uploaded file was deleted before it was preserved.', why: 'Honest reporting. Your containment choice destroyed evidence, and the report must say so.' },
          { id: 's10', when: 'attackerBack', correct: true, text: 'The attacker returned from a new address after only the first address had been blocked.', why: 'It happened, and it shows why blocking one address is not containment.' },
          { id: 's11', when: 'moreExfil', correct: true, text: 'A further 600 MB left the server while the incident was being monitored rather than contained.', why: 'It is what happened, and the report should not hide it.' },
          { id: 's12', when: 'preserved', correct: true, text: 'Disk and memory snapshots of WEB01 were captured before any rebuild.', why: 'A good result of your containment choice, and it supports any later forensic work.' },
        ],
        actions: [
          { id: 'r1', correct: true, text: 'Fix the upload validation: check file content, rename uploads, store them outside the web root and prevent script execution.', why: 'Closes the weakness that let the web shell in.' },
          { id: 'r2', correct: true, text: 'Rotate the database credentials and any other secrets stored in the config file.', why: 'The attacker has read them, so they must be treated as stolen.' },
          { id: 'r3', correct: true, text: 'Ask the Data Protection Officer to assess whether the exposed supplier and bank details need reporting.', why: 'A decision for the DPO, based on the facts you have supplied.' },
          { id: 'r4', correct: true, text: 'Rebuild WEB01 from a clean image once evidence has been captured.', why: 'You cannot trust a server an attacker has controlled.' },
          { id: 'r5', correct: false, text: 'Disable the supplier portal permanently.', why: 'Disproportionate. Fix the weakness and restore the service.' },
          { id: 'r6', correct: false, text: 'Block all file uploads company-wide.', why: 'Out of proportion, and it breaks legitimate work without fixing this flaw.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'soc-exam',
    title: 'Promotion exam: SOC Analyst',
    skill: 'identity',
    minutes: 20,
    blurb: 'One larger case that tests triage, identity investigation, response and reporting together.',
    brief: [
      'It is 09:30 on Monday at Contoso. You are the analyst on shift, and this is your promotion exam. The case combines everything you have practised: triage, evidence, decisions and a report.',
      'The scoring rewards precision. Wrong calls and unsupported claims cost points, and you need silver or better to pass.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'triage', type: 'triage', title: 'Triage the alerts',
        intro: 'Six alerts arrived in the last half hour. Decide what each one needs.',
        alerts: [
          { id: 'x1', source: 'Identity', time: '09:03', text: 'n.ahmed granted consent to an application called "DocViewer Pro" (publisher not verified). Permissions requested: read mail, read and write all files, offline access.', answer: 'investigate', explain: 'Broad permissions to an unverified app is a strong prompt to look closer, but you need to see what the app has done with that access.' },
          { id: 'x2', source: 'Mailbox', time: '09:41', text: 'A rule was created on n.ahmed\'s mailbox through the Graph API: forward messages containing "invoice" to an external address.', answer: 'escalate', explain: 'A hidden forwarding rule created programmatically is a classic account-takeover signature. It can leak mail right now.' },
          { id: 'x3', source: 'Identity', time: '09:10', text: 'j.owen signed in from Manchester on a known laptop. HR confirms they are travelling this week.', answer: 'noise', explain: 'Approved travel on a known device. Not a concern.' },
          { id: 'x4', source: 'Endpoint', time: '09:00', text: 'PowerShell script-block logging was enabled by group policy on all servers.', answer: 'noise', explain: 'A deliberate security improvement. Nothing to investigate.' },
          { id: 'x5', source: 'Identity', time: '08:55', text: 'n.ahmed signed in with MFA from the London office on their usual laptop.', answer: 'noise', explain: 'Normal for n.ahmed. It does not mean the account is clean, but this event alone is routine.' },
          { id: 'x6', source: 'Cloud', time: '09:20', text: 'The "DocViewer Pro" application signed in from 203.0.113.58 (a hosting provider abroad) and read about 4,300 mail items in three minutes.', answer: 'escalate', explain: 'An unknown app bulk-reading a mailbox from a hosting address is active data theft. Escalate now.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Investigate',
        intro: 'Work out what actually happened. Notice what is missing as well as what is present. Flag only what you can justify.',
        clues: {
          consent: { strength: 'strong', text: 'n.ahmed consented to an unverified app with broad mail and file permissions.' },
          newapp: { strength: 'strong', text: 'The app was registered only three days ago.' },
          appsignin: { strength: 'strong', text: 'The app signed in from a hosting provider abroad and bulk-read mail.' },
          rule: { strength: 'strong', text: 'The app created a forwarding rule to an external address.' },
          cleanlogins: { strength: 'strong', text: 'n.ahmed\'s own sign-ins are normal: the password and MFA were not stolen, so this was consent phishing.' },
          lure: { strength: 'weak', text: 'The consent followed a "shared document" email the user received a few minutes earlier.' },
        },
        artefacts: [
          {
            id: 'consent', title: 'Application consent audit',
            lines: [
              { id: 'c1', type: 'clue', clue: 'consent', text: '09:03  User n.ahmed consented to "DocViewer Pro". Permissions: Mail.Read, Files.ReadWrite.All, offline_access. Publisher: unverified.', note: 'Broad mail and file access for an unverified publisher, including permission to keep access when the user is offline.' },
              { id: 'c2', type: 'clue', clue: 'newapp', text: 'App registration created 3 days ago in a tenant belonging to an unrelated company.', note: 'A brand-new app from an unrelated tenant. Legitimate document tools are not like this.' },
              { id: 'c3', type: 'herring', text: 'Consent recorded for "Teams Calendar Sync" by j.owen (verified publisher).', note: 'A verified, widely used app, and a different user. Not part of this.' },
            ],
          },
          {
            id: 'signins', title: 'Sign-in logs',
            lines: [
              { id: 'l1', type: 'clue', clue: 'cleanlogins', text: 'n.ahmed: 08:55 London office, known laptop, MFA satisfied. No sign-ins from any other location today.', note: 'The user\'s own account shows nothing odd. So the attacker did not steal a password or MFA code. They got access through the app.' },
              { id: 'l2', type: 'clue', clue: 'appsignin', text: 'DocViewer Pro (service principal): 09:20 from 203.0.113.58, hosting provider abroad. 4,312 mail items read in 3 minutes.', note: 'The app, using the user\'s granted access, bulk-reading mail from a hosting address abroad.' },
              { id: 'l3', type: 'herring', text: 'j.owen: 09:10 Manchester, known device.', note: 'Approved travel.' },
              { id: 'l4', type: 'herring', text: 'svc-backup: 01:00 nightly job, no anomalies.', note: 'A routine service account.' },
            ],
          },
          {
            id: 'mail', title: 'Mailbox and email records',
            lines: [
              { id: 'm1', type: 'clue', clue: 'rule', text: '09:41  Rule "Invoices" created via Graph API (app: DocViewer Pro): forward to an external address.', note: 'Created by the app, not by the user, and it quietly forwards mail outside the company.' },
              { id: 'm2', type: 'clue', clue: 'lure', text: '08:59  n.ahmed received a "shared document" email from an external sender, then followed its link.', note: 'The likely lure. True and useful, but it does not on its own prove what the app did.' },
              { id: 'm3', type: 'herring', text: '09:15  Newsletter from the IT team: "Phishing Awareness Month".', note: 'An internal newsletter, unrelated.' },
            ],
          },
        ],
      },
      {
        id: 'contain', type: 'decision', title: 'Decide: containment',
        intro: 'You now know the attacker is using an OAuth app, not a stolen password.',
        prompt: 'What is the right containment action?',
        options: [
          { id: 'revoke', quality: 3, text: 'Revoke the app\'s consent and tokens, disable the enterprise app, and delete the forwarding rule', set: { cleaned: true }, consequence: 'The app loses all access immediately and the leak stops. This addresses the actual mechanism of the attack.' },
          { id: 'pw', quality: 1, text: 'Reset n.ahmed\'s password and require MFA again', set: { appStays: true }, consequence: 'It feels right, but the app\'s tokens do not depend on the password. The attacker still has access.' },
          { id: 'disable', quality: 1, text: 'Disable n.ahmed\'s whole account', set: { appStays: true }, consequence: 'It disrupts the user and the app\'s consent and access can persist.' },
          { id: 'ip', quality: 0, text: 'Block 203.0.113.58 only', set: { appStays: true }, consequence: 'The attacker uses another address and the app keeps working.' },
          { id: 'tenant', quality: 1, text: 'Block all third-party app consent for everyone, immediately and with no review', consequence: 'A useful long-term control, but as an emergency move it disrupts the business and leaves this app\'s access in place.' },
        ],
      },
      {
        id: 'comms', type: 'decision', title: 'Decide: talk to the user',
        intro: 'n.ahmed is at their desk and does not yet know.',
        notes: [{ when: 'appStays', text: 'The attacker\'s access is still live. Your conversation needs to be quick, and you will need to correct your containment.' }],
        prompt: 'How do you handle n.ahmed?',
        options: [
          { id: 'call', quality: 3, text: 'Call n.ahmed, explain calmly and without blame, and ask what they clicked so you can find others who received the same email', consequence: 'You get facts quickly, n.ahmed stays an ally, and you can hunt for other victims.' },
          { id: 'formal', quality: 0, text: 'Send a formal warning email about clicking links', consequence: 'Blame makes people hide things next time, and you still have not learned what happened.' },
          { id: 'silent', quality: 0, text: 'Say nothing to avoid alarming them', consequence: 'You lose the best source of information, and the next person to click will not know to report it.' },
          { id: 'name', quality: 0, text: 'Tell the whole company who clicked', consequence: 'Public shaming. It breaks trust and discourages anyone from reporting.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the incident report',
        intro: 'Include what the evidence supports, and recommend proportionate actions.',
        statements: [
          { id: 'c1', correct: true, text: 'n.ahmed was tricked into granting an unverified app access to their mailbox and files (consent phishing).', why: 'Shown by the consent audit and the lure email.' },
          { id: 'c3', correct: true, text: 'MFA did not stop this because the attacker used the app\'s access token rather than signing in as the user.', why: 'This is the key insight: OAuth access does not go through the user\'s sign-in.' },
          { id: 'c4', correct: true, text: 'The app read about 4,300 mail items and created a rule forwarding invoice-related mail to an external address.', why: 'Shown by the sign-in and mailbox records.' },
          { id: 'c6', correct: true, text: 'The app\'s activity came from a hosting provider address abroad.', why: 'Shown by the application sign-in log.' },
          { id: 'c2', correct: false, text: 'n.ahmed\'s password was stolen.', why: 'Nothing supports it. n.ahmed\'s own sign-ins are normal.' },
          { id: 'c5', correct: false, text: 'The attack began on n.ahmed\'s compromised laptop.', why: 'No endpoint evidence. The consent happened in the cloud.' },
          { id: 'c7', correct: false, text: 'MFA was defeated by prompt fatigue.', why: 'No prompts appear anywhere in the evidence. Do not invent a mechanism.' },
          { id: 'cx', when: 'appStays', correct: true, text: 'An initial containment attempt (a password reset) did not remove the app\'s access, so the app continued to operate until its consent was revoked.', why: 'Honest reporting. Your first containment choice did not stop the attacker, and the report should say so.' },
          { id: 'cy', when: 'cleaned', correct: true, text: 'Revoking the app\'s consent and tokens ended the attacker\'s access and the forwarding rule was removed.', why: 'A good outcome of your decision, and it belongs in the record.' },
        ],
        actions: [
          { id: 'r1', correct: true, text: 'Require admin approval for user consent to apps from unverified publishers.', why: 'Closes the door this attack used.' },
          { id: 'r2', correct: true, text: 'Search for other users who received the email or consented to the same app.', why: 'Consent phishing is rarely aimed at one person.' },
          { id: 'r3', correct: true, text: 'Work with the DPO to assess the exposure of the roughly 4,300 emails.', why: 'The mail may contain personal data. Assessing is the DPO\'s job, with your facts.' },
          { id: 'r4', correct: false, text: 'Reset every user\'s password.', why: 'Out of proportion, and it would not have stopped an OAuth-based attack.' },
          { id: 'r5', correct: false, text: 'Permanently ban all third-party apps.', why: 'Disproportionate. Use verified publishers and approval workflows instead.' },
        ],
      },
    ],
  },
];

// Everything the simulation draws from.
export const SIMS = [...CORE, ...SENIOR, ...LEAD];
