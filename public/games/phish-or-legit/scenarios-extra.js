// Extra scenarios beyond email, so every skill has content.
// New fields on top of scenarios.js:
//   channel: 'email' (default) | 'text' | 'call' | 'situation'
//   details: [[label, value], ...]  small fact table shown under the body
//   verdict: { legit: 'Safe', phish: 'Risky' }  button labels for non-email items
// For channel 'situation', `from` is omitted and `subject` is the title.
// kind keeps its meaning: 'phish' = the scam or risky choice, 'legit' = genuine or safe.
export const EXTRA = [
  // ───────────── DATA PROTECTION & PRIVACY ─────────────
  {
    id: 'd-autocomplete',
    skill: 'data',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'About to send the customer spreadsheet',
    body: [
      'You are emailing a spreadsheet of 800 customer names, emails and order histories to your colleague Sam Jones in the sales team. You type "Sam" and press Enter on the first suggestion. You are in a hurry and press Send.',
    ],
    details: [
      ['Recipient chosen', 'sam.jones@gmail.com'],
      ['Sam in your company directory', 'sam.jones@contoso.com'],
    ],
    flags: [
      'Autocomplete picked a personal Gmail address of a different Sam Jones instead of the colleague. That is a misdirected email, one of the most common data breaches.',
      'Always check the full address, not just the display name, before sending anything containing personal data.',
      'Safer habits: send a link to the file in the shared drive, turn on external-recipient warnings, and delay sending for a few seconds.',
    ],
  },
  {
    id: 'd-public-ai',
    skill: 'data',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Summarising complaints with a free chatbot',
    body: [
      'You have 40 customer complaint emails to summarise before a meeting. You paste them, with names, addresses and account numbers, into a free public AI chatbot you use at home to get a quick summary.',
    ],
    details: [
      ['Tool', 'Free public chatbot, personal account'],
      ['Contains', 'Names, addresses, account numbers'],
    ],
    flags: [
      'You have sent personal data to a third party the company has no contract with. It may be stored, reviewed or used to train a model.',
      'Free personal tools are not covered by your organisation\'s data-protection agreements.',
      'Use only AI tools your employer has approved, and strip or anonymise personal details first.',
    ],
  },
  {
    id: 'd-approved-ai',
    skill: 'data',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Summarising complaints with the approved assistant',
    body: [
      'You need to summarise 40 customer complaints. You use the company\'s approved AI assistant, which has a contract and data-protection terms in place. Before pasting, you replace names and account numbers with codes like "Customer A".',
    ],
    details: [
      ['Tool', 'Company-approved assistant (SSO sign-in)'],
      ['Contains', 'No names, addresses or account numbers'],
    ],
    why: 'The tool is approved and covered by a contract, you signed in with your work account, and you removed identifying details first. Data minimisation plus an approved tool is exactly right.',
  },
  {
    id: 'd-sar',
    skill: 'data',
    kind: 'legit',
    context: 'Your company has a process for handling data requests from customers.',
    from: { name: 'Hannah Price', addr: 'hannah.price@fabrikam-mail.com' },
    subject: 'Request for a copy of my personal data',
    body: [
      'Hello, I was a customer of Contoso last year. Under data protection law, I would like a copy of the personal data you hold about me. My customer reference is CN-20931.',
    ],
    why: 'A customer is making a normal rights request, and the email asks for their own data using a reference only they would know. It asks you for nothing risky: the right move is to forward it to the Data Protection Officer straight away, who will verify identity and respond within a month. Never send the data from the first email.',
  },
  {
    id: 'd-director-hr',
    skill: 'data',
    kind: 'phish',
    from: { name: 'Marcus Webb (Director)', addr: 'marcus.webb.office@outlook.com' },
    subject: 'Need John Alvarez\'s HR file today',
    body: [
      'Hi, I am in back-to-back meetings. Please send me John Alvarez\'s full HR file (contract, salary history, performance notes) to this address today. It is confidential, so do not mention it to anyone.',
    ],
    flags: [
      'A director writing from a personal Outlook address, not the company domain.',
      'It asks for highly sensitive personal data, with secrecy, urgency and "I am unavailable" so you cannot check.',
      'Genuine requests for HR files go through HR with a clear purpose, never to a personal address.',
    ],
  },

  // ───────────── EVERYDAY DIGITAL SAFETY ─────────────
  {
    id: 'e-evil-twin',
    skill: 'everyday',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Coffee shop Wi-Fi',
    body: [
      'You are working from a coffee shop. Your phone shows two networks. The till receipt says the guest Wi-Fi is "BrewHouse_Guest". A new open network has appeared with a stronger signal, and you pick that one because it is faster.',
    ],
    details: [
      ['Network you join', 'BrewHouse_Guest_FREE (no password)'],
      ['Network on the receipt', 'BrewHouse_Guest (password on receipt)'],
    ],
    flags: [
      'An open network with a near-identical name is a classic "evil twin": an attacker can see and alter your traffic.',
      'Always join the network the venue actually tells you, and confirm the name with staff if unsure.',
      'On public Wi-Fi, use a VPN for work and avoid signing in to sensitive accounts if you can use mobile data instead.',
    ],
  },
  {
    id: 'e-usb-found',
    skill: 'everyday',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'A USB stick in the car park',
    body: [
      'Walking in to work you find a USB stick on the ground labelled "Payroll 2026". You are curious and a little worried someone lost something important, so you plug it into your work laptop to see who it belongs to.',
    ],
    flags: [
      'Planting USB drives where people will find them is a real attack. Plugging it in can run malware or act as a keyboard that types commands.',
      'The label is bait: it is chosen to make you curious or kind.',
      'Hand it to IT or security without plugging it in anywhere.',
    ],
  },
  {
    id: 'e-os-update',
    skill: 'everyday',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'A system update notification',
    body: [
      'Your work laptop shows a notification from the operating system: "Updates are ready. Restart tonight to finish installing." You open the built-in Settings app yourself, see the update listed there too, and schedule the restart for the end of the day.',
    ],
    why: 'You verified the update through the operating system\'s own Settings rather than clicking something in a pop-up. Installing updates promptly closes security holes that attackers use.',
  },
  {
    id: 'e-techsupport-popup',
    skill: 'everyday',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'A browser pop-up warns of a virus',
    body: [
      'While reading the news, your browser fills with a full-screen warning in red: "YOUR COMPUTER IS INFECTED. Do not turn off. Call Microsoft Support now on 0800 000 0000." A siren sound plays.',
    ],
    flags: [
      'Real security software and operating systems never ask you to phone a number from a web page.',
      'Fear, a siren and "do not turn off" are pressure tactics. Calling leads to a fake support agent who will ask for remote access or payment.',
      'Close the browser (or force-quit it), do not call, and run a normal scan if you are worried.',
    ],
  },
  {
    id: 'e-own-charger',
    skill: 'everyday',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Charging at the airport',
    body: [
      'Your phone battery is low at the airport. You plug your own charger into a mains wall socket and decline the offer of a free "charging kiosk" with a USB port.',
    ],
    why: 'Using your own charger and a plain power socket avoids "juice jacking", where a public USB port tries to transfer data or install something. A power-only cable or a power bank is also fine.',
  },

  // ───────────── AI-POWERED SCAMS ─────────────
  {
    id: 'a-voice-clone',
    skill: 'ai',
    kind: 'phish',
    channel: 'call',
    verdict: { legit: 'Real', phish: 'Scam' },
    from: { name: 'Unknown number', addr: '+44 7700 900123' },
    subject: 'A call from "your daughter"',
    body: [
      '"Mum, it\'s me. I\'ve lost my phone and I\'m calling from a friend\'s. I\'ve had an accident and I need £400 sent to this account right now. Please don\'t tell Dad, I\'ll explain later."',
      'The voice sounds exactly like your daughter, but a little flat and robotic at the end of sentences, and she won\'t answer when you ask what you had for dinner together on Sunday.',
    ],
    flags: [
      'Voice cloning can copy someone\'s voice from a few seconds of audio from social media.',
      'An unknown number, an emergency, secrecy ("do not tell Dad") and a request for money are the standard scam recipe.',
      'Hang up and ring your daughter on her usual number, or use a family code word you agreed in advance.',
    ],
  },
  {
    id: 'a-deepfake-cfo',
    skill: 'ai',
    kind: 'phish',
    from: { name: 'Contoso Finance', addr: 'finance-calendar@contoso-meetings.net' },
    subject: 'Urgent: join a private video call with the CFO',
    body: [
      'You are invited to a video call with the CFO about a confidential acquisition. On the call, the CFO and a colleague appear on screen, with slightly odd lip-sync and a blurry background.',
      'They say the call quality is bad so you cannot use chat, and ask you to transfer £180,000 today to a "deal escrow account", to keep it secret from the rest of the team.',
    ],
    link: { text: 'Join the video call', href: 'https://contoso-meetings.net/join/2291' },
    flags: [
      'Deepfake video calls have been used to steal millions: attackers fake several "executives" at once.',
      'The invite comes from a look-alike domain, and the call asks you to avoid normal channels and keep it secret.',
      'Large payment requests must follow your normal approval process, whoever appears on screen. Verify by calling the person back on a known number.',
    ],
  },
  {
    id: 'a-callback',
    skill: 'ai',
    kind: 'legit',
    context: 'Your company has a rule that unusual payment requests are verified by calling back.',
    from: { name: 'Priya Shah (CFO)', addr: 'priya.shah@contoso.com' },
    subject: 'Can you join a quick call at 3?',
    body: [
      'Hi, I need a quick chat about a supplier payment this afternoon. Can you join my usual meeting room link at 3pm?',
      'You call Priya\'s number from the company directory to confirm. She answers, confirms she sent it, and the payment later goes through the normal approval workflow.',
    ],
    why: 'It comes from the company domain, the meeting link is her usual room, and crucially you verified it yourself by calling a known number. The payment still uses the normal approval process, so no single person can be tricked into moving money.',
  },
  {
    id: 'a-polished-supplier',
    skill: 'ai',
    kind: 'phish',
    from: { name: 'Emma Lindqvist, Northwind Logistics', addr: 'emma.lindqvist@northwind-logistics.co' },
    subject: 'Re: Q3 pallet delivery and revised remittance details',
    body: [
      'Hi Sam, thank you for the pleasant call last Tuesday about the Q3 pallet delivery and your plans for the Leeds depot. It was lovely to hear about your promotion.',
      'Our bank has changed, so please send future payments to the account below. The attached letter explains the change. Warm regards, Emma.',
    ],
    attachment: 'Remittance_update.pdf',
    flags: [
      'The email is flawless and weirdly personal. AI tools can write perfect, tailored messages using details scraped from LinkedIn and company news, so good grammar no longer proves anything.',
      'A change of bank details by email is always a red flag, however friendly the message is.',
      'Verify changes of payment details with a known contact by phone, using a number you already have.',
    ],
  },
  {
    id: 'a-safe-word',
    skill: 'ai',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'A strange voice message from a colleague',
    body: [
      'A voice message arrives from a colleague asking you to approve something urgently. It sounds like her, but something feels slightly off. You message her on the team chat asking for the code word the team agreed for exactly this situation. She replies with it and explains she really did send the voice note.',
    ],
    why: 'Agreeing a code word or a second verification channel in advance is a strong defence against voice cloning and deepfakes. You did not trust the voice alone, and you checked on a separate channel.',
  },

  // ───────────── CONNECTED DEVICES ─────────────
  {
    id: 'i-default-password',
    skill: 'iot',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Setting up a new smart camera',
    body: [
      'You plug in a new indoor camera and it works straight away. The setup guide says the web login is "admin" with password "admin" and mentions you can change it later. You leave it because it is only for the hallway.',
    ],
    details: [
      ['Login', 'admin / admin (unchanged)'],
      ['Reachable from the internet', 'Yes (remote viewing enabled)'],
    ],
    flags: [
      'Default passwords are public. Attackers constantly scan for devices that still use them, and many cameras have been taken over this way.',
      'An internet-facing camera with a default login can be watched by strangers or recruited into a botnet.',
      'Change the password immediately, use a unique one, turn off features you do not need and keep the firmware updated.',
    ],
  },
  {
    id: 'i-qr-app',
    skill: 'iot',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'A no-name camera that needs its own app',
    body: [
      'You buy a very cheap camera from an unknown online marketplace seller. The leaflet says to scan a QR code to install the control app, which downloads from a website rather than the official app store. The app asks for access to your contacts, microphone and location.',
    ],
    details: [
      ['App source', 'Direct download from a website'],
      ['Permissions asked', 'Contacts, microphone, location'],
    ],
    flags: [
      'Apps installed outside the official stores are not reviewed and can carry malware.',
      'A camera app has no need for your contacts or location, so these are excessive permissions.',
      'Buy from reputable brands that publish security updates, and install apps only from official stores.',
    ],
  },
  {
    id: 'i-updates-strong',
    skill: 'iot',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Your home router settings',
    body: [
      'You log in to your router\'s admin page by typing its address yourself. You have already changed the default admin password, automatic firmware updates are on, and remote administration from the internet is switched off.',
    ],
    details: [
      ['Admin password', 'Changed, unique, stored in a password manager'],
      ['Firmware updates', 'Automatic'],
      ['Remote admin', 'Off'],
    ],
    why: 'Your router is the front door for every device at home. A unique admin password, automatic updates and remote administration switched off are the three most important settings.',
  },
  {
    id: 'i-unknown-device',
    skill: 'iot',
    kind: 'phish',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'An unfamiliar device on your network',
    body: [
      'While checking your router\'s connected-devices list, you spot something called "ESP_8F3A21" that you do not recognise. It has been online for three days. You assume it belongs to a housemate and ignore it.',
    ],
    details: [
      ['Device name', 'ESP_8F3A21'],
      ['Online', '3 days'],
      ['Matches any device you own?', 'No'],
    ],
    flags: [
      'An unknown device on your network might be a smart gadget someone added, or an intruder. You should not assume.',
      'Check with the household first, and if nobody owns it, block it, change your Wi-Fi password and review your router settings.',
      'Keep a list of your own devices so a stranger stands out.',
    ],
  },
  {
    id: 'i-separate-network',
    skill: 'iot',
    kind: 'legit',
    channel: 'situation',
    verdict: { legit: 'Safe', phish: 'Risky' },
    subject: 'Putting smart gadgets on their own network',
    body: [
      'You connect your smart plugs, bulbs and camera to the guest Wi-Fi network, away from your laptops and phone. Each device has a unique password and you turned off any feature you do not use.',
    ],
    why: 'Separating cheap connected gadgets from your main devices means a compromised plug cannot easily reach your laptop or phone. Unique passwords and disabling unused features reduce the attack surface further.',
  },
];
