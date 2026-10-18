// Incident Response and Forensics Breach Room cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges. The artefacts are described in
// general terms; the case contains no technique.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const DFIR = [
  {
    id: 'what-it-left-behind',
    title: 'What it left behind',
    skill: 'data',
    blurb: 'The attacker is gone, and so is most of the live evidence. Rebuild the attack from the traces left on the disk, in memory snapshots and in the logs.',
    brief: [
      'A laptop belonging to a finance analyst was seized after a customer reported fraudulent invoices. The attacker had been gone for a week. You have a forensic copy of the disk, a memory capture taken at the time of seizure, and logs from the email, directory and file systems.',
      'Place each piece of evidence in the right stage of the attack and spot the noise. Tap an indicator (a file, an account or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'How it started', desc: 'The first sign of the attacker on the laptop.', story: 'The analyst received an email with an attached invoice document. Opening it started a small program that she did not know about, which called out to an address on the internet.' },
      { id: 'persist', name: 'Staying on the machine', desc: 'How the attacker kept their access.', story: 'The program set itself to start every time the laptop was switched on, and copied itself to a quiet folder with a name that looked like a system file, so it would survive a restart.' },
      { id: 'creds', name: 'Using the analyst\'s access', desc: 'What the attacker did with her accounts.', story: 'The attacker used the analyst\'s signed-in sessions to read her mailbox and the finance share, and created a rule that quietly forwarded invoice emails to an outside address.' },
      { id: 'fraud', name: 'The fraud', desc: 'How the access was turned into money.', story: 'The attacker used the forwarded invoices to send near-identical invoices from a lookalike address with a changed bank account, and two customers paid.' },
    ],
    cards: [
      { id: 'e1', source: 'Email log', time: '09:08', stage: 'initial', text: 'An email from "accounts@fabrikam-parts.example" with an attachment "Invoice_88413.docm" is delivered to the analyst. The sender domain was registered 3 days earlier.', indicators: ['Invoice_88413.docm', 'fabrikam-parts.example'], note: 'A newly registered lookalike domain with a document that can contain macros is a common way to start an attack.', hint: 'How did it begin?' },
      { id: 'n1', source: 'Directory', time: '09:30', text: 'The nightly sync of 14 staff accounts completes normally.', indicators: [], note: 'Routine housekeeping unrelated to the attack.', hint: 'Does it involve the document, the sender or the address?' },
      { id: 'e2', source: 'Disk', time: '09:12', stage: 'initial', text: 'The forensic copy shows Invoice_88413.docm was opened at 09:12 and that a new program, "winupdt.exe", was written to the user\'s temporary folder four seconds later.', indicators: ['Invoice_88413.docm', 'winupdt.exe'], note: 'A program appearing seconds after a document opens strongly suggests the document started it.', hint: 'What happened when she opened it?' },
      { id: 'e3', source: 'Network log', time: '09:13', stage: 'initial', text: 'The laptop contacts 203.0.113.44 on port 443 for the first time. The connection repeats every 5 minutes.', indicators: ['winupdt.exe', '203.0.113.44'], note: 'A regular call to an address the laptop never used before is how a small program checks in with its controller.', hint: 'The program calls home.' },
      { id: 'e4', source: 'Disk', time: '09:20', stage: 'persist', text: 'A scheduled task "OneDriveUpdateCheck" is created. It runs a copy of winupdt.exe from C:\\ProgramData\\Microsoft\\Crypto each time the laptop starts.', indicators: ['winupdt.exe', 'OneDriveUpdateCheck'], note: 'A task named like a real update that runs the attacker\'s program at start-up is a classic persistence trick, and why a restart did not remove it.', hint: 'How does it survive a restart?' },
      { id: 'n2', source: 'Disk', time: '09:45', text: 'The laptop installs a routine security update and restarts.', indicators: [], note: 'A normal update on the same day. It is not part of the attack.', hint: 'Does it involve the program or the task?' },
      { id: 'e5', source: 'Memory capture', time: '10:02', stage: 'persist', text: 'The memory capture shows winupdt.exe running under the analyst\'s account, with a copy running from the ProgramData folder as well.', indicators: ['winupdt.exe'], note: 'Memory shows it was still active when the laptop was seized, and in two places.', hint: 'Was it still running?' },
      { id: 'e6', source: 'Email log', time: '11:40', stage: 'creds', text: 'A mailbox rule is created on the analyst\'s account from the laptop\'s address: forward any message containing "invoice" to ap.records@mail-relay.example and then delete the forwarded copy.', indicators: ['ap.records@mail-relay.example', 'winupdt.exe'], note: 'A hidden rule that forwards invoices and deletes the evidence is how the attacker saw real invoices without the analyst noticing.', hint: 'What did they set up in her mailbox?' },
      { id: 'e7', source: 'File server', time: '12:15', stage: 'creds', text: 'The analyst\'s account reads 214 invoice files from the finance share in 6 minutes, from the laptop, while she was in a meeting.', indicators: ['winupdt.exe'], note: 'Reading hundreds of files at speed while the user is away is not human activity. It is the program using her access.', hint: 'The attacker collects real invoices.' },
      { id: 'n3', source: 'Directory', time: '13:00', text: 'The analyst signs in to the finance system and completes her normal payment approvals.', indicators: [], note: 'Her real work, in the same period. It is not part of the attack.', hint: 'Is this the attacker or the analyst?' },
      { id: 'e9', source: 'Email log', time: '16:15', stage: 'fraud', text: 'A customer replies to accounts@fabrikam-parts.example asking to confirm a change of bank details. A reply confirming the new account is sent from that address within four minutes.', indicators: ['fabrikam-parts.example'], note: 'The attacker answers the customer\'s query from the lookalike address, which makes the changed bank details seem genuine.', hint: 'How did the customer come to trust it?' },
      { id: 'e8', source: 'Email log', time: '16:30', stage: 'fraud', text: 'Three days later, two customers receive invoices from "accounts@fabrikam-parts.example" with a new bank account. Both pay, £38,400 in total.', indicators: ['fabrikam-parts.example'], note: 'Near-identical invoices from the lookalike domain, with changed bank details, are how stolen invoices become money.', hint: 'How was it turned into money?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What allowed the attack to begin and to last?',
        options: [
          { id: 'macro', correct: true, text: 'A document with active content was allowed to run on a laptop, and nothing stopped a new program starting or creating a hidden start-up task', explain: 'The first step relied on active content running. The start-up task is what let it survive restarts.' },
          { id: 'zero', correct: false, text: 'A previously unknown flaw in the operating system', explain: 'Nothing in the evidence needs a hidden flaw. It used features working as designed.' },
          { id: 'insider', correct: false, text: 'A malicious insider', explain: 'The analyst was away when the files were read, and the evidence points to a program running under her account.' },
          { id: 'weakpw', correct: false, text: 'A weak password on the finance share', explain: 'The attacker used the analyst\'s signed-in access, not a guessed password.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which controls would have stopped the chain earliest and most reliably?',
        options: [
          { id: 'layers', correct: true, text: 'Block macros in documents from outside, restrict what programs can run and where, alert on new start-up tasks and on hidden mail-forwarding rules, and require a call-back to confirm any change of bank details', explain: 'Each breaks a link. The call-back control stops the fraud even if everything earlier fails.' },
          { id: 'av', correct: false, text: 'More frequent antivirus scans', explain: 'The program was new and may not have been recognised. The controls above do not depend on that.' },
          { id: 'training', correct: false, text: 'Training the analyst not to open invoices', explain: 'Invoices are her job. The design should not depend on nobody ever being fooled.' },
          { id: 'cloud', correct: false, text: 'Moving the finance share to a different provider', explain: 'The attack never needed the share to be weak. It used her access.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should the response include beyond cleaning the laptop?',
        options: [
          { id: 'full', correct: true, text: 'Keep the laptop and its images as evidence, remove the mailbox forwarding rule and reset the analyst\'s credentials, find and warn the two customers and try to recover the payments, check other staff for the same document and sender, and review how bank-detail changes are confirmed', explain: 'The evidence, the hidden rule, the customers, other victims and the process gap all need attention.' },
          { id: 'reinstall', correct: false, text: 'Reinstall the laptop and move on', explain: 'It leaves the mailbox rule, the customers and other victims untouched.' },
          { id: 'block', correct: false, text: 'Block the sender domain and close the incident', explain: 'The attacker has copies of invoices and a hidden rule, and money has been lost.' },
          { id: 'wait', correct: false, text: 'Wait to see whether further fraud appears', explain: 'Money has already been paid, and more could follow.' },
        ],
      },
    ],
    summary: 'A single document started a small program that hid itself, used the analyst\'s access to read real invoices and set up a hidden forwarding rule, and turned them into near-identical invoices with a changed bank account. Blocking active content, limiting what can run, alerting on new start-up tasks and hidden rules, and a call-back for bank changes each break the chain.',
  },
];
