// Weekly Breach Room cases (released on a schedule: see core/weekly.js). Everything here is fictional.
// IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const WEEKLY = [
  {
    id: 'sim-swap',
    title: 'The text that took the phone number',
    skill: 'identity',
    blurb: 'A manager\'s phone lost its signal at lunch. By the evening, her email, her bank and her social accounts were in someone else\'s hands. Rebuild how a phone number was stolen.',
    brief: [
      'On Friday, Anya, a regional manager, saw her phone drop to "No service" at 12:40. By 19:00 she could not sign in to her email, her bank had messaged her about a £6,800 transfer she did not make, and her social media had posted a link she had not written.',
      'You have evidence from her phone, the mobile provider, her email and bank, and the web. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a number, an account or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'collect', name: 'Collecting her details', desc: 'How the attacker learned enough about her.', story: 'Anya received a text, supposedly from a delivery company, asking her to pay a small redelivery fee on a website. The page collected her name, address, date of birth and the last digits of her card, which are exactly what a mobile provider asks to confirm an identity.' },
      { id: 'swap', name: 'Taking the number', desc: 'How her number moved to another SIM.', story: 'Armed with those details, the attacker rang her mobile provider pretending to be Anya, said her phone was lost, and asked for her number to be moved to a new SIM card. The provider\'s check was a few questions that the attacker could answer.' },
      { id: 'reset', name: 'Resetting her passwords', desc: 'What they did with the number.', story: 'With her number on their SIM, the attacker asked her email provider to "reset the password" and received the code by text. They then did the same for her bank and her social accounts, all of which used text messages as the way to recover an account.' },
      { id: 'steal', name: 'Using her accounts', desc: 'What they gained.', story: 'The attacker moved £6,800 from a savings account, changed the contact details on her accounts, and used her social media to send a link to her contacts.' },
    ],
    cards: [
      { id: 'e1', source: 'Phone', time: '09:12', stage: 'collect', text: 'A text arrives from "ParcelPoint" saying "Your parcel could not be delivered. Pay £1.45 to rearrange: parcelpoint-redelivery.example". Anya taps the link at 09:15.', indicators: ['parcelpoint-redelivery.example'], note: 'A small fee is a favourite excuse for collecting personal and card details.', hint: 'How did the attacker find out about her?' },
      { id: 'e2', source: 'Web', time: '09:16', stage: 'collect', text: 'The page parcelpoint-redelivery.example, registered two days earlier, asks Anya for her name, address, date of birth and the first and last four digits of her card. She enters them.', indicators: ['parcelpoint-redelivery.example'], note: 'Those are the details a mobile provider asks to prove who you are.', hint: 'What did the page collect?' },
      { id: 'n1', source: 'Email', time: '09:40', text: 'Anya receives the weekly newsletter from her gym.', indicators: [], note: 'Routine mail unrelated to the attack.', hint: 'Does it involve the text, the website or the provider?' },
      { id: 'e3', source: 'Mobile provider', time: '11:50', stage: 'swap', text: 'A caller to the provider\'s call centre gives Anya\'s name, address and date of birth, says the phone is lost, and asks for her number to be moved to a new SIM. The agent asks two security questions and approves it.', indicators: ['SIM ending 4471'], note: 'Everything the caller needed had just been collected. The provider\'s check was weak.', hint: 'How was the number moved?' },
      { id: 'e10', source: 'Mobile provider', time: '12:10', stage: 'swap', text: 'The provider\'s record shows the SIM change was made by a phone call to the main line, not in a shop, and no message was sent to the old SIM to ask Anya to confirm.', indicators: ['SIM ending 4471'], note: 'A change made by phone, with no check with the current owner of the number, is the weak spot the attacker used.', hint: 'Why was it so easy to move the number?' },
      { id: 'e4', source: 'Phone', time: '12:40', stage: 'swap', text: 'Anya\'s phone shows "No service". The number is now active on a SIM ending 4471, which she does not hold.', indicators: ['SIM ending 4471'], note: 'The sudden loss of signal is the sign that the number has moved.', hint: 'When did she notice?' },
      { id: 'n2', source: 'Provider', time: '13:05', text: 'The provider sends an automated text to Anya\'s number confirming the SIM change.', indicators: ['SIM ending 4471'], note: 'The message went to the new SIM, so Anya never saw it. It relates to the swap but is a record, not a step.', hint: 'Is this a step of the attack, or a record of it?' },
      { id: 'e5', source: 'Email', time: '13:20', stage: 'reset', text: 'A password reset is requested on Anya\'s email account. The code is sent by text to her number and entered within a minute. The password is changed.', indicators: ['SIM ending 4471', 'anya.p@mail.example'], note: 'The text code went to the attacker\'s SIM. The email, which controls every other reset, is now theirs.', hint: 'What did they take first?' },
      { id: 'e6', source: 'Bank', time: '15:30', stage: 'reset', text: 'A reset is requested on the bank account using the text code. A new device is registered.', indicators: ['SIM ending 4471', 'anya.p@mail.example'], note: 'The bank also used text codes for recovery.', hint: 'And the bank?' },
      { id: 'e9', source: 'Social', time: '15:45', stage: 'reset', text: 'A reset is requested on Anya\'s social media account. The code is sent by text to her number and entered within a minute.', indicators: ['SIM ending 4471', 'anya.p@mail.example'], note: 'The same trick again. Every account that recovers by text falls to whoever holds the number.', hint: 'Which other account fell the same way?' },
      { id: 'n3', source: 'Web', time: '16:00', text: 'The company intranet logs 300 normal sign-ins from staff.', indicators: [], note: 'Normal traffic unrelated to Anya\'s accounts.', hint: 'Does it involve her accounts or the new SIM?' },
      { id: 'e7', source: 'Bank', time: '17:45', stage: 'steal', text: 'A transfer of £6,800 is made from Anya\'s savings account to a new payee.', indicators: ['anya.p@mail.example'], note: 'The money moves. This is the goal.', hint: 'What did they do with the access?' },
      { id: 'e8', source: 'Social', time: '18:30', stage: 'steal', text: 'Anya\'s social media account posts a link to her 600 contacts, "Look at this photo of you!".', indicators: ['anya.p@mail.example'], note: 'The attacker uses her account to reach her contacts and spread the scam.', hint: 'How did they spread it?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What was the weakness that let one text lead to all of this?',
        options: [
          { id: 'sms', correct: true, text: 'Her accounts could be recovered with a code sent by text, and the mobile provider would move her number after a few questions that the attacker could answer', explain: 'A phone number was treated as proof of identity. Anyone who controls it can recover the accounts that rely on it.' },
          { id: 'weakpw', correct: false, text: 'Anya used weak passwords', explain: 'The passwords were never guessed. They were reset using codes.' },
          { id: 'malware', correct: false, text: 'Malware on her phone', explain: 'Nothing in the evidence shows malware. The phone just lost its number.' },
          { id: 'hack', correct: false, text: 'The bank\'s computers were hacked', explain: 'The bank was used as designed, by someone who passed its recovery check.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of protections would have stopped the attack most reliably?',
        options: [
          { id: 'app', correct: true, text: 'Use an authenticator app or a security key instead of text codes for email, banking and social accounts, set a PIN or passcode with the mobile provider for any SIM change, and do not enter personal details on a link from an unexpected text', explain: 'Each breaks a link. A code that does not travel by text cannot be taken by moving the number.' },
          { id: 'pw', correct: false, text: 'Use longer passwords', explain: 'The passwords were bypassed by resets.' },
          { id: 'av', correct: false, text: 'Install antivirus on the phone', explain: 'The attack did not run software on her phone.' },
          { id: 'cheap', correct: false, text: 'Use a cheaper mobile provider', explain: 'The weakness was the check, not the price.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should Anya do first once she realises?',
        options: [
          { id: 'full', correct: true, text: 'Phone the provider from another phone to get the number back and block the SIM, then contact the bank straight away to freeze the account and recover the money, and recover the email and social accounts using a safer method before changing any other passwords', explain: 'The number is the key, and the bank and email are the quickest ways to lose more.' },
          { id: 'wait', correct: false, text: 'Wait for the signal to come back', explain: 'It will not, and every hour gives the attacker more time.' },
          { id: 'post', correct: false, text: 'Post a warning on social media from her phone', explain: 'The account is not hers at the moment.' },
          { id: 'pw', correct: false, text: 'Change only the social media password', explain: 'The email and the bank are the priority, and the number is still not hers.' },
        ],
      },
    ],
    summary: 'A fake delivery text collected enough details to pass a mobile provider\'s check, the attacker moved Anya\'s number to their own SIM, and used text codes to reset her email, her bank and her social accounts. Authenticator apps or keys instead of text codes, a PIN with the provider, and care with unexpected links each break the chain.',
  },
];
