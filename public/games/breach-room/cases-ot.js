// OT/IoT Security Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. The case is about how a problem in an office
// reached a plant, and what that says about structure; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the chain. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound judgement about what the evidence can and cannot say.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right restraint about what the incident was and was not.' },
];

export const OT = [
  {
    id: 'office-to-plant',
    title: 'How the office reached the plant',
    skill: 'data',
    blurb: 'A mistake in the office in the morning became a problem for the plant control system by the evening. Rebuild the route, decide how bad it really was and what the plant should change.',
    brief: [
      'On Thursday evening, operators at Contoso Water noticed the historian had stopped recording and the SCADA server was running slowly. No pump was affected. The security team has logs from the office, the DMZ, the plant network and the operators.',
      'Place each piece of evidence in the right stage of the incident and spot the noise. Tap an indicator (a host, a file or an address) to see every card it appears in. Be careful: not everything unusual is part of the story.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'foothold', name: 'The foothold', desc: 'How it started in the office.', story: 'That morning a finance assistant opened an invoice attachment that ran a small program on their office PC. The program began calling an outside address, 203.0.113.60, every five minutes.' },
      { id: 'reach', name: 'The reach', desc: 'How it crossed into the plant.', story: 'That afternoon the program on the office PC found that the historian, in the plant network, accepted connections from any office PC. It reached the historian directly, using a database account that the plant\'s reporting tool shared with everyone.' },
      { id: 'spread', name: 'The spread', desc: 'How far it went inside the plant.', story: 'From the historian the program tried the SCADA server, which the historian is also allowed to reach. The attempts were refused by the SCADA server\'s own login, and were repeated for two hours.' },
      { id: 'effect', name: 'The effect', desc: 'What the operators noticed.', story: 'The repeated attempts slowed the SCADA server, and a disk on the historian filled with the program\'s own files, so it stopped recording. No command reached a controller, and no pump or valve was touched.' },
    ],
    cards: [
      { id: 'e1', source: 'Mail gateway', time: '09:10', stage: 'foothold', text: 'A finance assistant receives an email "Invoice_4471.docm" from supplier-docs.example and opens it at 09:14.', indicators: ['supplier-docs.example', 'Invoice_4471.docm'], note: 'The first contact. A lookalike supplier domain and an attachment that runs code.', hint: 'How did it start?' },
      { id: 'e2', source: 'Office endpoint', time: '09:15', stage: 'foothold', text: 'On the finance PC, "Invoice_4471.docm" starts a program, "viewer_svc.exe", that was not there before.', indicators: ['Invoice_4471.docm', 'viewer_svc.exe'], note: 'The attachment ran a program. This is the foothold.', hint: 'What did the attachment do?' },
      { id: 'n1', source: 'Sector group', time: '09:30', text: 'The sector group warns of a different fake-invoice campaign aimed at retailers.', indicators: [], note: 'A separate campaign using a similar lure. Similar is not the same as linked.', hint: 'Is this part of this chain?' },
      { id: 'e3', source: 'Office network', time: '10:05', stage: 'foothold', text: 'The finance PC contacts 203.0.113.60 every five minutes.', indicators: ['viewer_svc.exe', '203.0.113.60'], note: 'A regular call to an outside address. The program is checking in.', hint: 'Where does it call?' },
      { id: 'e4', source: 'Plant firewall', time: '13:12', stage: 'reach', text: 'The finance PC connects to the historian on the database port. The plant firewall allows any office PC to do so.', indicators: ['viewer_svc.exe', 'historian'], note: 'Where the office meets the plant. Nothing stopped it.', hint: 'How did it get into the plant?' },
      { id: 'e5', source: 'Historian', time: '13:14', stage: 'reach', text: 'A sign-in to the historian database as "reporting" from the finance PC. The "reporting" account is shared by every office user of the reporting tool.', indicators: ['historian', 'reporting account'], note: 'A shared account turned an office PC into a user of the plant historian.', hint: 'Whose account was used?' },
      { id: 'n2', source: 'Operations', time: '14:40', text: 'The shift operator logs a routine pump 2 inspection at 14:40.', indicators: [], note: 'Normal operations, unrelated to the incident.', hint: 'Is this part of the chain?' },
      { id: 'e6', source: 'SCADA server', time: '15:30', stage: 'spread', text: 'The SCADA server logs repeated failed sign-ins from the historian\'s address, 40 a minute.', indicators: ['historian', 'SCADA server'], note: 'The attempt to go further. The server\'s own login held.', hint: 'Did it get into SCADA?' },
      { id: 'e7', source: 'Plant firewall', time: '15:31', stage: 'spread', text: 'The plant firewall allows the historian to reach the SCADA server, and logs the attempts as allowed.', indicators: ['historian', 'SCADA server'], note: 'The historian\'s access to SCADA is why the attempts could be made at all.', hint: 'Why could the historian reach SCADA?' },
      { id: 'n3', source: 'IT', time: '16:00', text: 'The office backup runs as scheduled and uploads 80 GB to the offsite provider.', indicators: [], note: 'A normal scheduled job.', hint: 'Is this part of it?' },
      { id: 'e8', source: 'Historian', time: '17:15', stage: 'effect', text: 'The historian\'s disk reaches 100% full from files named "viewer_cache" in the database folder. Recording stops.', indicators: ['viewer_svc.exe', 'historian'], note: 'The program\'s own files filled the disk. The effect was a lost record, not a changed one.', hint: 'Why did recording stop?' },
      { id: 'e9', source: 'Operations', time: '18:20', stage: 'effect', text: 'Operators report the historian has stopped and the SCADA screens are slow. All pumps and valves are running normally.', indicators: ['SCADA server'], note: 'What the operators saw. No process was affected.', hint: 'What did the operators notice?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Why it could happen', prompt: 'What made it possible for an office PC to affect the plant?',
        options: [
          { id: 'structure', correct: true, text: 'The office and the plant were not separated: any office PC could reach the historian, a shared database account let it in, and the historian could reach SCADA', explain: 'Each step was allowed by the structure of the network, not by a clever technique. Separation and least access would have stopped it at the first hop.' },
          { id: 'phish', correct: false, text: 'A finance assistant opened an attachment', explain: 'That started the incident in the office. Offices will always have this. What turned it into a plant problem was the lack of separation.' },
          { id: 'scada', correct: false, text: 'The SCADA server was weak', explain: 'Its own login held. It was slowed, not entered.' },
          { id: 'zero', correct: false, text: 'A new, unknown flaw in the historian', explain: 'Nothing here needed a flaw. The firewall allowed it and the account was shared.' },
        ],
      },
      {
        id: 'bad', short: 'How bad it was', prompt: 'How serious was the incident, on the evidence?',
        options: [
          { id: 'near', correct: true, text: 'Serious as a near miss: the office reached the plant network and lost a record, but nothing reached a controller and no process was touched; the same route could have gone further', explain: 'It is honest about what happened (a lost record and a slow server) and about what could have happened. Overstating or understating both mislead.' },
          { id: 'catastrophe', correct: false, text: 'A major attack on the water supply', explain: 'No command reached a controller and no process was affected.' },
          { id: 'nothing', correct: false, text: 'Minor: only a historian disk filled up', explain: 'The route from the office to the plant had been open for years. That is the serious part.' },
          { id: 'unknown', correct: false, text: 'Impossible to say anything yet', explain: 'The logs say a good deal: how it started, how far it went and what it did.' },
        ],
      },
      {
        id: 'fix', short: 'What to change', prompt: 'What should change first?',
        options: [
          { id: 'zones', correct: true, text: 'Separate the office from the plant with a firewall that allows only what is needed, stop the shared database account, and make the historian unable to reach SCADA; add passive monitoring so the next attempt is seen at once', explain: 'Fixes the structure that made every step possible, and adds watching. It can be planned with operations and fitted in a window.' },
          { id: 'train', correct: false, text: 'Train finance staff not to open attachments', explain: 'Worth doing, and it will not stop every future mistake. The plant must survive one.' },
          { id: 'disconnect', correct: false, text: 'Disconnect the plant from the office completely', explain: 'Reporting, vendor support and monitoring depend on connections. A controlled link is the aim.' },
          { id: 'patch', correct: false, text: 'Patch the historian and SCADA server', explain: 'Good housekeeping, and the incident was not caused by missing patches.' },
        ],
      },
    ],
    summary: 'A finance assistant opened a fake invoice in the morning. That afternoon the program on that PC reached the plant historian, because the firewall allowed any office PC to connect and a shared database account let it in. From the historian it tried the SCADA server, which was allowed but refused the login. The effect was a lost record and a slow server, with no command to any controller. The real lesson is structural: separate the office from the plant, stop shared accounts and watch the boundary.',
  },
];
