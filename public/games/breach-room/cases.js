// The Breach Room cases. Everything here is fictional. IP addresses come from
// the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// A case has stages (the shape of the attack) and evidence cards. Each card
// belongs to one stage, or has no stage and is unrelated noise.
//   indicators: things you can pivot on (an account, an address, a host)
//   note:       shown when the card is placed correctly (why it belongs)
//   hint:       shown when it is placed wrongly (nudges, does not give it away)

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

import { EXTRA } from './cases-extra.js';
import { LEAD } from './cases-lead.js';
import { VULN } from './cases-vuln.js';

const CORE = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'friday',
    title: 'The Friday breach',
    skill: 'data',
    blurb: 'HR data left the company. Reconstruct how, from a phishing email to a 2 GB upload.',
    brief: [
      'Late on Friday, a network alert shows 2.1 GB leaving Contoso for an address nobody recognises. Legal confirms the data came from the HR share.',
      'You have evidence from email, identity, endpoint, file and network tools. Decide which stage of the attack each card belongs to, and which are just routine noise. Tap an indicator (an account, address or host) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Initial access', desc: 'How the attacker first got in.', story: 'A lookalike "invoice" email led d.kim to a fake sign-in page, which captured their password. The attacker then signed in from a hosting provider abroad, getting past MFA when d.kim tapped Approve on a prompt after several denials.' },
      { id: 'persist', name: 'Persistence', desc: 'How they made sure they could stay.', story: 'To keep access even if the password changed, the attacker registered their own authenticator on the account and set a forwarding rule that quietly copied d.kim\'s mail outside the company.' },
      { id: 'lateral', name: 'Lateral movement', desc: 'Moving to other systems and accounts.', story: 'Using d.kim\'s account over the VPN, the attacker reached the file server and HR share, which d.kim had never touched, and tried to read credentials from memory to spread further. EDR blocked that attempt.' },
      { id: 'theft', name: 'Data theft', desc: 'Taking what they came for.', story: 'They packed 2.1 GB of HR records into one archive and sent it out over HTTPS to an address they controlled.' },
    ],
    cards: [
      { id: 'n1', source: 'Identity', time: '08:02', text: 'd.kim signs in from the London office on their usual laptop.', indicators: ['d.kim'], note: 'Routine: usual place, usual device, before anything happened.', hint: 'Compare it with how d.kim normally works.' },
      { id: 'n2', source: 'Endpoint', time: '09:00', text: 'Windows updates are installed on 14 laptops.', indicators: [], note: 'A scheduled patch run across many machines is normal.', hint: 'Is this tied to one account or action, or is it routine maintenance?' },
      { id: 'n3', source: 'Email', time: '09:05', text: 'IT newsletter: "Phishing Awareness Month starts Monday".', indicators: [], note: 'An internal newsletter, unrelated to the attack.', hint: 'Look at who sent it and what it asks of the reader.' },
      { id: 'e1', source: 'Email', time: '09:12', stage: 'initial', text: '"Invoice 88213 overdue" arrives for d.kim from fabrikam-parts.com, a lookalike of the real supplier.', indicators: ['d.kim', 'fabrikam-parts.com'], note: 'The lure. A lookalike sender with an urgent invoice is how it began.', hint: 'Where does an attack start: how did something get in front of the victim?' },
      { id: 'e2', source: 'Proxy', time: '09:14', stage: 'initial', text: 'd.kim\'s browser opens invoice-view.net/login and submits a form.', indicators: ['d.kim', 'invoice-view.net'], note: 'd.kim typed credentials into the fake sign-in page.', hint: 'This is the victim\'s action, immediately after the lure.' },
      { id: 'e3', source: 'Identity', time: '09:31', stage: 'initial', text: 'd.kim signs in from 203.0.113.58 (a hosting provider in another country) on a new device. MFA is satisfied by an Approve tap after four denied prompts.', indicators: ['d.kim', '203.0.113.58'], note: 'The attacker using the stolen password and an approved prompt: access achieved.', hint: 'This is the moment an outsider first gets into the account.' },
      { id: 'e4', source: 'Identity', time: '09:36', stage: 'persist', text: 'A new authenticator, "iPhone 13", is registered on d.kim\'s account from 203.0.113.58.', indicators: ['d.kim', '203.0.113.58'], note: 'A way back in that survives a password reset.', hint: 'They are already in. What are they doing to make sure they can stay?' },
      { id: 'e5', source: 'Email', time: '09:41', stage: 'persist', text: 'A mailbox rule named "Invoices" is created on d.kim\'s mailbox, forwarding mail to an external address.', indicators: ['d.kim'], note: 'Quiet, lasting access to d.kim\'s mail.', hint: 'It keeps working even when the attacker is not signed in.' },
      { id: 'e10', source: 'Network', time: '10:03', stage: 'lateral', text: 'A VPN session opens for d.kim from 203.0.113.58.', indicators: ['d.kim', '203.0.113.58'], note: 'The attacker moves from the cloud account into the internal network.', hint: 'They are now getting closer to the internal systems.' },
      { id: 'e6', source: 'Files', time: '10:08', stage: 'lateral', text: 'd.kim\'s account accesses FILESRV02 and HR-SHARE for the first time ever.', indicators: ['d.kim', 'FILESRV02', 'HR-SHARE'], note: 'The account reaching systems it has never used is classic lateral movement.', hint: 'Has this account ever done this before? What does a first-ever visit suggest?' },
      { id: 'e7', source: 'Endpoint', time: '10:20', stage: 'lateral', text: 'EDR alert on FILESRV02: a process tries to read credentials from memory (blocked).', indicators: ['FILESRV02'], note: 'Attackers harvest credentials to spread further. The EDR stopped this attempt.', hint: 'The attacker is trying to get more access than they already have.' },
      { id: 'e8', source: 'Files', time: '10:41', stage: 'theft', text: 'A 2.1 GB archive, hr_export.zip, is created on HR-SHARE by d.kim\'s account.', indicators: ['d.kim', 'HR-SHARE'], note: 'Staging data into one file before taking it.', hint: 'They have what they want. What do they do with it next?' },
      { id: 'e9', source: 'Network', time: '10:48', stage: 'theft', text: '2.1 GB is sent outbound to 198.51.100.77 over HTTPS.', indicators: ['198.51.100.77'], note: 'The data leaves the building.', hint: 'Size and destination are the clues.' },
      { id: 'n4', source: 'Identity', time: '14:30', text: 'j.owen signs in from Manchester (travelling for work, known device).', indicators: ['j.owen'], note: 'A colleague on approved travel, nothing to do with this.', hint: 'Does this involve the same account, address or systems as the rest?' },
    ],
    questions: [
      {
        id: 'entry', short: 'Entry point', prompt: 'Where did the attacker first get in?',
        options: [
          { id: 'phish', correct: true, text: 'A phishing email led d.kim to a fake sign-in page that stole their password', explain: 'The chain starts with a lookalike invoice email, a fake page that took the password, and then a sign-in from abroad.' },
          { id: 'vpn', correct: false, text: 'An unpatched VPN server', explain: 'The VPN session came after the account was already taken over: it was used with d.kim\'s stolen credentials, not exploited.' },
          { id: 'malware', correct: false, text: 'Malware on d.kim\'s laptop', explain: 'Nothing here shows malware. The activity came from a hosting provider abroad using the stolen password.' },
          { id: 'insider', correct: false, text: 'An insider copying the HR data', explain: 'The actions came from outside, through a new device and an overseas address, not from a trusted person at their usual place.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which single change would have stopped the breach earliest?',
        options: [
          { id: 'mfa', correct: true, text: 'Phishing-resistant MFA (such as passkeys), so a stolen password and an approved prompt are not enough', explain: 'It stops the chain at step one. Everything afterwards depended on the attacker getting into the account.' },
          { id: 'enc', correct: false, text: 'Encrypting the HR share', explain: 'Encryption at rest does not stop an authenticated user (or someone using their account) from reading files.' },
          { id: 'dlp', correct: false, text: 'Alerts on large outbound transfers', explain: 'Useful, but it only catches the attack at the very end, after the data has been gathered.' },
          { id: 'len', correct: false, text: 'A longer password policy', explain: 'The attacker was handed the password by a fake page, so length would not have helped.' },
        ],
      },
      {
        id: 'access', short: 'Why it spread', prompt: 'Why could d.kim\'s account reach the HR share at all?',
        options: [
          { id: 'priv', correct: true, text: 'The account had broader permissions than its job needed (a least-privilege failure)', explain: 'd.kim had never used the HR share, so there was no reason for access. Least privilege shrinks what a stolen account can reach.' },
          { id: 'pub', correct: false, text: 'The HR share was public on the internet', explain: 'It was reached through the internal network after a VPN session, not from the internet directly.' },
          { id: 'fw', correct: false, text: 'The firewall was switched off', explain: 'Nothing here points to a firewall problem. The attacker used legitimate access via a stolen account.' },
          { id: 'bug', correct: false, text: 'A bug in the file server', explain: 'No vulnerability was exploited. The account simply had the access.' },
        ],
      },
    ],
    summary: 'A single phished password became a data breach because of three gaps: MFA that an approved prompt could satisfy, an account with access it never needed, and no early warning when it started using it.',
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ransom',
    title: 'The macro that kept going',
    skill: 'everyday',
    blurb: 'Files on the main server were encrypted at lunchtime. Trace it back to a spreadsheet and find the last chance to stop it.',
    brief: [
      'At 11:49, staff report that every file on FILESRV01 has a .locked extension and a ransom note in each folder.',
      'Work backwards. Place each piece of evidence in the right stage of the attack, and spot the noise. The most useful skill here is knowing which earlier alert was the last chance to stop it.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Initial access', desc: 'How it got in.', story: 'A macro-enabled "budget" workbook arrived by email. The user enabled content, Excel ran the macro, and the macro started a hidden PowerShell.' },
      { id: 'foothold', name: 'Foothold and control', desc: 'Staying in and calling home.', story: 'The malware created a scheduled task to survive reboots and began contacting its operator every minute, waiting for instructions.' },
      { id: 'spread', name: 'Lateral movement', desc: 'Spreading to other systems.', story: 'Using the user\'s credentials, the operator moved to the file server and other servers within minutes, installing remote services to run commands.' },
      { id: 'impact', name: 'Impact', desc: 'What the attacker did to cause damage.', story: 'Before encrypting, the attackers deleted the shadow copies so files could not be restored easily. Then thousands of files were encrypted and a ransom note left in every folder.' },
    ],
    cards: [
      { id: 'n1', source: 'Endpoint', time: '08:30', text: 'A quarterly antivirus scan completes on 40 laptops.', indicators: [], note: 'Scheduled housekeeping across many machines.', hint: 'Is it tied to a single account or host, or is it a routine job?' },
      { id: 'e1', source: 'Email', time: '09:10', stage: 'initial', text: '"Q3_Budget_Final.xlsm" arrives for m.okoye from an unknown external sender.', indicators: ['m.okoye'], note: 'The lure: a macro-enabled file from someone unknown.', hint: 'This is how something arrived in front of the victim.' },
      { id: 'e2', source: 'Endpoint', time: '09:16', stage: 'initial', text: 'EXCEL.EXE on LAPTOP-114 opens the file; the user enables macros.', indicators: ['LAPTOP-114', 'm.okoye'], note: 'The victim lets the macro run.', hint: 'This is the user\'s action that let the attack start.' },
      { id: 'e3', source: 'Endpoint', time: '09:17', stage: 'initial', text: 'Excel starts a hidden PowerShell running an encoded command.', indicators: ['LAPTOP-114'], note: 'Office launching hidden PowerShell is the macro doing its job: the foothold begins here.', hint: 'Excel should never need to launch a hidden shell.' },
      { id: 'n2', source: 'Network', time: '09:20', text: 'LAPTOP-114 contacts update.microsoft.com for a patch.', indicators: ['LAPTOP-114'], note: 'A normal Windows update check, even though it is on the same laptop.', hint: 'Same laptop, but is it tied to the attack? Look at the destination.' },
      { id: 'e4', source: 'Endpoint', time: '09:22', stage: 'foothold', text: 'A scheduled task named "WinUpdateSvc" is created on LAPTOP-114.', indicators: ['LAPTOP-114'], note: 'A disguised name to survive a reboot.', hint: 'The attacker is trying to make sure it survives a restart.' },
      { id: 'e5', source: 'Network', time: '09:23', stage: 'foothold', text: 'LAPTOP-114 contacts 198.51.100.9 every 60 seconds.', indicators: ['LAPTOP-114', '198.51.100.9'], note: 'Beaconing: waiting for instructions from the operator.', hint: 'A regular heartbeat to one address is a pattern. What is it waiting for?' },
      { id: 'e6', source: 'Identity', time: '10:30', stage: 'spread', text: 'm.okoye\'s account authenticates to FILESRV01 and three other servers within two minutes.', indicators: ['m.okoye', 'FILESRV01'], note: 'An ordinary user suddenly reaching many servers quickly is lateral movement.', hint: 'Does an account like this normally touch four servers in two minutes?' },
      { id: 'e7', source: 'Endpoint', time: '10:34', stage: 'spread', text: 'Remote services are created on FILESRV01 and APPSRV03 from LAPTOP-114.', indicators: ['LAPTOP-114', 'FILESRV01'], note: 'Running commands on other machines remotely: spreading.', hint: 'The infected laptop is now acting on other machines.' },
      { id: 'n3', source: 'Identity', time: '11:00', text: 'A backup operator signs in to BACKUP01 to check the nightly job.', indicators: ['BACKUP01'], note: 'Routine admin work on a different host and account.', hint: 'Does it share an account, host or address with the rest of the chain?' },
      { id: 'e8', source: 'Endpoint', time: '11:42', stage: 'impact', text: '"vssadmin delete shadows /all" runs on FILESRV01 and the shadow copies are deleted.', indicators: ['FILESRV01'], note: 'Removing the restore points, a classic step just before encrypting.', hint: 'It removes your ability to recover easily. When would an attacker do that?' },
      { id: 'e9', source: 'Files', time: '11:47', stage: 'impact', text: 'Thousands of files on FILESRV01 are renamed with a .locked extension within minutes.', indicators: ['FILESRV01'], note: 'The encryption itself.', hint: 'This is the damage the staff noticed.' },
      { id: 'e10', source: 'Files', time: '11:49', stage: 'impact', text: 'README_RESTORE.txt appears in every folder, demanding payment.', indicators: ['FILESRV01'], note: 'The ransom note, part of the impact.', hint: 'This is the demand, left after the damage is done.' },
      { id: 'n4', source: 'Email', time: '12:10', text: 'Out-of-office auto-replies arrive from 12 staff.', indicators: [], note: 'Normal lunchtime email, unrelated.', hint: 'Does it tie to any account or host in the evidence?' },
    ],
    questions: [
      {
        id: 'entry', short: 'Entry point', prompt: 'How did the attacker get in?',
        options: [
          { id: 'macro', correct: true, text: 'A macro-enabled spreadsheet emailed to a user, who enabled content', explain: 'The chain starts with the .xlsm email, the user enabling macros, and Excel starting a hidden PowerShell.' },
          { id: 'rdp', correct: false, text: 'An exposed remote desktop service', explain: 'Nothing here shows a remote desktop login from outside. The first activity is the user opening the file.' },
          { id: 'usb', correct: false, text: 'An infected USB stick', explain: 'There is no sign of removable media. The first event is an email attachment.' },
          { id: 'weak', correct: false, text: 'A guessed password', explain: 'No failed logins or password guessing appear. The attack started on a user\'s laptop.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which control would have stopped the chain earliest?',
        options: [
          { id: 'block', correct: true, text: 'Blocking macros in files that arrive from the internet or email', explain: 'It stops the attack at step one. Everything afterwards depended on the macro running.' },
          { id: 'backup', correct: false, text: 'Offline backups', explain: 'Essential for recovering, and they limit the damage, but they do not prevent the attack.' },
          { id: 'pass', correct: false, text: 'Stronger passwords', explain: 'No password was guessed or cracked here, so it would not have helped.' },
          { id: 'perim', correct: false, text: 'A stricter perimeter firewall', explain: 'The attack started inside, on a laptop, and called out over a normal connection.' },
        ],
      },
      {
        id: 'last', short: 'Last chance', prompt: 'Which was the last realistic chance to stop the encryption before it started?',
        options: [
          { id: 'vss', correct: true, text: 'The shadow copies being deleted on FILESRV01', explain: 'Deleting the restore points is a well-known ransomware precursor. Responding to it, by isolating the server, would have stopped the encryption minutes later.' },
          { id: 'beacon', correct: false, text: 'The first beaconing from the laptop', explain: 'An earlier chance, certainly, but the question is the last one before encryption.' },
          { id: 'rename', correct: false, text: 'The files being renamed', explain: 'By then encryption is already underway: it is too late to stop it.' },
          { id: 'ransom', correct: false, text: 'The ransom note appearing', explain: 'The note appears after encryption has finished.' },
        ],
      },
    ],
    summary: 'The attack took under three hours from one enabled macro to a ransom note. Each stage left a clear alert, and the shadow-copy deletion was the last warning before encryption began.',
  },
];

// Everything the game draws from.
export const CASES = [...CORE, ...EXTRA, ...LEAD, ...VULN];
