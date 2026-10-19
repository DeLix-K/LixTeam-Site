// Weekly Cyber Detective cases (released on a schedule: see core/weekly.js). Everything here is fictional.
// IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const WEEKLY = [
  {
    id: 'qr-meter',
    title: 'The code on the parking meter',
    skill: 'email',
    blurb: 'Drivers say the pay-by-phone page looks wrong, and some have been charged and fined anyway. Find out where the sticker on the meter really sends them.',
    brief: [
      'Last week the council received 31 complaints from drivers in the Station Road car park. Each paid by scanning the QR code on the meter, was charged, and still got a parking ticket. The council says its own app and its own QR codes are fine.',
      'You have the complaint summary and the car park records to start with, and deeper evidence as you find the right clues. Work out what is going on, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      overlay: { strength: 'strong', text: 'A printed sticker has been placed over the council\'s own QR code on four of the twelve meters.' },
      domain: { strength: 'strong', text: 'The sticker leads to city-parkpay.example, a lookalike of the council\'s real address, registered four days ago.' },
      source: { strength: 'strong', text: 'All 31 complaints come from drivers who used one of the four stickered meters.' },
      relay: { strength: 'strong', text: 'The fake page asks for the card number and then for a code sent by the driver\'s bank, so the criminals can use the card at once.' },
      location: { strength: 'weak', text: 'The four stickered meters are the ones closest to the station.' },
    },
    artefacts: [
      {
        id: 'complaints', title: 'The complaints',
        blurb: 'What drivers reported.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'source', text: 'Complaint log: 31 complaints in 6 days. Meter numbers given: M3 (9), M4 (8), M7 (7), M8 (7). No complaints naming any of the other eight meters', note: 'Every complaint points at the same four meters, which is a strong sign that something is different about them.' },
          { id: 'a2', type: 'herring', text: 'Twenty-two of the complainants are regular commuters', note: 'Commuters use the car park more, so they are more likely to be affected. It does not explain the cause.' },
          { id: 'a3', type: 'herring', text: 'The council\'s app was updated on 4 October', note: 'The complaints came after, but the app was not used by anyone who complained.' },
          { id: 'a4', type: 'plain', text: 'Typical complaint: "I scanned the code, paid £6.50, and still got a ticket"', note: 'The payment never reached the council.' },
        ],
      },
      {
        id: 'meters', title: 'The meters and the page',
        blurb: 'What was found on site and what the code opens.',
        unlockedBy: 'source',
        lines: [
          { id: 'b1', type: 'clue', clue: 'overlay', text: 'Site check, meters M3, M4, M7, M8: a glossy sticker over the matt council QR label. Edges lift with a fingernail. The council label is intact underneath', note: 'Someone stuck a fake code on top of the real one. The council\'s own code was never changed.' },
          { id: 'b2', type: 'clue', clue: 'location', text: 'Meters M3, M4, M7 and M8 are the four nearest the station entrance and the least overlooked', note: 'A sensible place to put stickers without being seen. It is context, not proof.' },
          { id: 'b3', type: 'herring', text: 'The meters are 11 years old', note: 'Age has no bearing on the sticker.' },
          { id: 'b4', type: 'herring', text: 'The four meters take 60% of the car park\'s payments', note: 'Explains why many drivers were affected, not how.' },
          { id: 'b5', type: 'plain', text: 'Meters M1, M2, M5, M6, M9 to M12 carry only the original label', note: 'The unaffected meters.' },
        ],
      },
      {
        id: 'page', title: 'Where the sticker leads',
        blurb: 'The website behind the fake code.',
        unlockedBy: 'overlay',
        lines: [
          { id: 'c1', type: 'clue', clue: 'domain', text: 'The sticker\'s code opens city-parkpay.example. The council\'s real address is cityparking.example. Registration record for city-parkpay.example: created four days ago, owner hidden by a privacy service', note: 'A lookalike address registered days ago, copying the council\'s name. The council never used it.' },
          { id: 'c2', type: 'clue', clue: 'relay', text: 'The page copies the council\'s logo. It asks for card number, expiry and security code, then says "Enter the code we have just texted you". A real council payment would not ask for a code from the bank', note: 'The second code is the bank\'s own check, and the page is collecting it live so the thieves can use the card immediately.' },
          { id: 'c3', type: 'herring', text: 'The page uses a padlock symbol and "https"', note: 'Any website can have a padlock. It shows the connection is private, not that the site is honest.' },
          { id: 'c4', type: 'herring', text: 'The page has a cookie banner', note: 'Copying a banner is easy and proves nothing.' },
          { id: 'c5', type: 'plain', text: 'The page is a copy of the council\'s pay screen, with a small spelling mistake in "Reciept"', note: 'Poor spelling is a clue, though the good fakes have none.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'overlay', correct: true, text: 'Someone stuck fake QR codes over the council\'s labels on four meters, leading to a lookalike payment page that collects card details and the bank\'s confirmation code', explain: 'The overlay stickers, the new lookalike address and the code relay explain the charges without payments reaching the council.' },
        { id: 'app', correct: false, text: 'The council\'s app was hacked', explain: 'None of the complainants used the app, and the council\'s own codes are untouched.' },
        { id: 'meters', correct: false, text: 'The parking meters malfunctioned', explain: 'The meters did not process these payments at all.' },
        { id: 'drivers', correct: false, text: 'The drivers entered their details wrongly', explain: 'The complaints all involve four meters and a page the council does not run.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Remove the stickers from the four meters and keep them as evidence, put up a notice and a safe payment option, tell drivers who paid on those meters to contact their bank and ask for the cards to be replaced, report the fake address to be taken down and to the police, and check the other car parks', explain: 'Stop the scam, protect the people affected, and look for the same thing elsewhere.' },
        { id: 'ignore', correct: false, text: 'Cancel the fines and carry on', explain: 'It leaves the stickers in place and the drivers\' cards exposed.' },
        { id: 'qr', correct: false, text: 'Remove QR codes from every meter permanently', explain: 'Out of proportion. Checking and protecting the codes is enough.' },
        { id: 'blame', correct: false, text: 'Tell drivers it was their fault for scanning the code', explain: 'The code looked official, and blaming drivers does not fix anything.' },
      ],
    },
    story: [
      'Someone prints stickers carrying a QR code and sticks them over the real labels on the four meters nearest the station.',
      'The code opens a lookalike payment page registered four days earlier. It collects card details and the bank\'s confirmation code.',
      'Drivers think they have paid. The criminals use the cards at once, and the council receives nothing, so tickets are issued.',
      'The lesson: a QR code is just a link. Check the address it opens, and be wary of a sticker on top of another label.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'cafe-wifi',
    title: 'The café Wi-Fi',
    skill: 'everyday',
    blurb: 'A traveller\'s laptop saw two networks with the same name in a café. One of them was not the café\'s. Work out which one, and what it did.',
    brief: [
      'Sam, a consultant, worked from a café on Thursday. By evening, two of Sam\'s accounts had sign-in alerts from another country. The café says its Wi-Fi has a password printed on the receipt.',
      'You have the laptop\'s network history to start with, and deeper evidence as you find the right clues. Work out how Sam\'s sign-ins were taken, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      twin: { strength: 'strong', text: 'Two networks called "BeanCounter Guest" were visible, and Sam joined the one with no password and a stronger signal.' },
      portal: { strength: 'strong', text: 'The network showed a "free Wi-Fi" sign-in page that asked for an email address and password to continue.' },
      warning: { strength: 'strong', text: 'The browser showed certificate warnings on three sites, which Sam clicked through.' },
      alerts: { strength: 'strong', text: 'Sam\'s mail and cloud accounts were signed in from an address in another country within two hours.' },
      time: { strength: 'weak', text: 'Sam was in the café for about three hours.' },
    },
    artefacts: [
      {
        id: 'network', title: 'The laptop\'s network history',
        blurb: 'Which networks it saw and joined.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'twin', text: 'Wi-Fi log, 13:05: "BeanCounter Guest" (secured, signal 52%) and "BeanCounter Guest" (open, signal 88%). Joined: the open one', note: 'The café\'s real network has a password. An open network with the same name and a stronger signal is a classic fake.' },
          { id: 'a2', type: 'herring', text: 'The laptop also saw 14 other networks, including "Hotel_Lobby"', note: 'Unrelated networks nearby.' },
          { id: 'a3', type: 'herring', text: 'The laptop has remembered "BeanCounter Guest" since a visit last year', note: 'It makes it more likely to join automatically. It does not tell you which network it joined.' },
          { id: 'a4', type: 'plain', text: 'The café\'s router label reads "BeanCounter Guest", security WPA2', note: 'The genuine network.' },
        ],
      },
      {
        id: 'session', title: 'What happened after Sam joined',
        blurb: 'The sign-in page and the browser warnings.',
        unlockedBy: 'twin',
        lines: [
          { id: 'b1', type: 'clue', clue: 'portal', text: 'A page opened by itself: "Free Wi-Fi: sign in with your email to continue". Fields: email address, email password. Sam entered both at 13:07', note: 'No real café needs your email password for Wi-Fi. This page collected it.' },
          { id: 'b2', type: 'clue', clue: 'warning', text: 'Browser log, 13:09 to 13:22: three "connection is not private" warnings, on a webmail site, a cloud-storage site and a work portal. Sam chose "continue anyway" each time', note: 'The warnings appeared because someone was sitting between Sam and those sites. Clicking through let them read the traffic.' },
          { id: 'b3', type: 'herring', text: 'The page used the café\'s logo and colours', note: 'Easy to copy.' },
          { id: 'b4', type: 'herring', text: 'The page loaded quickly', note: 'Speed says nothing about honesty.' },
          { id: 'b5', type: 'plain', text: 'The laptop\'s battery was at 40%', note: 'Context.' },
        ],
      },
      {
        id: 'accounts', title: 'Sam\'s accounts',
        blurb: 'What happened to the accounts afterwards.',
        unlockedBy: 'portal',
        lines: [
          { id: 'c1', type: 'clue', clue: 'alerts', text: 'Mail provider alert, 15:02: new sign-in from 198.51.100.200, another country. Cloud storage alert, 15:10: same address. Sam\'s second factor was not requested for the mail account because the session was already open', note: 'The attacker used what they had collected within two hours.' },
          { id: 'c2', type: 'clue', clue: 'time', text: 'Sam\'s time in the café: about three hours', note: 'The length of stay is context.' },
          { id: 'c3', type: 'herring', text: 'Sam uses a long, unique password for the work portal', note: 'A good habit, and not the point here: the warning let the session be read.' },
          { id: 'c4', type: 'herring', text: 'The sign-in address belongs to a hosting company', note: 'Common, and says nothing about who used it.' },
          { id: 'c5', type: 'plain', text: 'Sam changed the mail password at 16:30', note: 'The right response, a little late.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'twin', correct: true, text: 'An attacker set up an open network with the café\'s name and a stronger signal, collected Sam\'s email password on a fake sign-in page, and read traffic when Sam clicked through certificate warnings', explain: 'The duplicate network, the fake page and the clicked-through warnings explain how the sign-ins were taken.' },
        { id: 'cafe', correct: false, text: 'The café\'s own router was hacked', explain: 'The café\'s real network was secured and was not the one Sam joined.' },
        { id: 'weakpw', correct: false, text: 'Sam\'s password was guessed', explain: 'Sam typed the password into a page that asked for it.' },
        { id: 'malware', correct: false, text: 'Malware was installed on the laptop', explain: 'Nothing in the evidence shows software being installed. The data was handed over or intercepted.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Change the email password from a safe device, end all open sessions and require a second factor on every account, check what was read or changed in the mailbox and storage, tell the employer\'s security team, and in future use mobile data or a VPN on public Wi-Fi and never click through a certificate warning', explain: 'Close the doors that were opened, find what was taken, and fix the habits.' },
        { id: 'reboot', correct: false, text: 'Restart the laptop and carry on', explain: 'The attacker already has the password and sessions.' },
        { id: 'cafe', correct: false, text: 'Ask the café to change its Wi-Fi password', explain: 'The fake network was not the café\'s.' },
        { id: 'ignore', correct: false, text: 'Do nothing because the alerts might be mistakes', explain: 'Two accounts were signed in from another country within two hours.' },
      ],
    },
    story: [
      'In a busy café, an attacker\'s device broadcasts an open network with the same name as the café\'s and a stronger signal.',
      'Sam\'s laptop joins it, and a "free Wi-Fi" page collects an email address and password.',
      'Certificate warnings appear on three sites, and Sam clicks through them. The attacker reads the traffic and signs in to Sam\'s accounts.',
      'The lesson: two networks with one name is a red flag. Never type a password into a Wi-Fi sign-in page, and treat certificate warnings as a stop sign.',
    ],
  },
];
