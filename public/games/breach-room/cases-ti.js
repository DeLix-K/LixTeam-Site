// Threat Intelligence Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. The case is about linking evidence and the
// limits of attribution; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the campaign. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound judgement about what the evidence can and cannot say.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right restraint on naming anyone.' },
];

export const TI = [
  {
    id: 'campaign-cluster',
    title: 'One campaign or three?',
    skill: 'data',
    blurb: 'Three companies in the sector have each reported a suspicious incident. Decide which pieces of evidence link them, which are coincidence, and how far to go in saying who is behind it.',
    brief: [
      'In one fortnight, three companies in the sector (Contoso, Northwind and Fabrikam) have each reported an incident involving a fake invoice email. Some people think they are the work of one group. You have indicators and observations from all three, shared through the sector group.',
      'Place each piece of evidence in the right stage of the campaign and spot the noise. Tap an indicator (a domain, an address or a file) to see every card it appears in. Be careful: similar is not the same as linked.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'lure', name: 'The lure', desc: 'How the targets were approached.', story: 'Finance staff at each company received an email from a newly registered lookalike domain, with an attachment disguised as an invoice. Each company saw a different lookalike domain, but all four were registered on the same day, through the same registrar, from the same payment account.' },
      { id: 'delivery', name: 'The delivery', desc: 'What the attachment did.', story: 'Opening the attachment ran a small program that looked up a web address and downloaded a second program. The same file name, "inv_viewer.exe", and the same download location appeared at all three companies.' },
      { id: 'access', name: 'The access', desc: 'What the second program did.', story: 'The second program contacted one of two outside addresses, 203.0.113.50 or 203.0.113.51, every five minutes. Both are hosted by the same provider and registered to the same account, and appear at all three companies.' },
      { id: 'goal', name: 'The goal', desc: 'What the attackers appear to have wanted.', story: 'At each company, the attackers read finance mailboxes and, at two of them, tried to change the bank details on supplier invoices. At the third, the attempt was stopped before any change was made.' },
    ],
    cards: [
      { id: 'e1', source: 'Registrar data', time: '08:00', stage: 'lure', text: 'Four domains (invoices-ontime.example, remit-docs.example, supplier-pay.example, ap-records.example) were registered on 1 October through the same registrar, paid from the same account.', indicators: ['invoices-ontime.example', 'remit-docs.example'], note: 'Registered together, paid for together, and used in a matching way. This is a strong link between the lures.', hint: 'What connects the sender domains?' },
      { id: 'n1', source: 'Sector group', time: '08:20', text: 'The sector group notes that a different fake-invoice campaign, using a different attachment type, is also circulating this month.', indicators: [], note: 'A separate campaign using the same kind of lure. Similar tactics are common and are not by themselves a link.', hint: 'Is this part of this campaign, or just a similar one?' },
      { id: 'e2', source: 'Contoso email', time: '09:15', stage: 'lure', text: 'Contoso finance receives an email from invoices-ontime.example with an attachment "Remittance_Advice.docm".', indicators: ['invoices-ontime.example', 'Remittance_Advice.docm'], note: 'Contoso\'s own first sighting. The lookalike domain is one of the four registered together.', hint: 'Contoso\'s part in the campaign.' },
      { id: 'e3', source: 'Northwind email', time: '10:05', stage: 'lure', text: 'Northwind finance receives an email from remit-docs.example with an attachment "Remittance_Advice.docm".', indicators: ['remit-docs.example', 'Remittance_Advice.docm'], note: 'Another of the four domains and the same attachment name. This strengthens the link.', hint: 'Does Northwind match?' },
      { id: 'e4', source: 'Contoso endpoint', time: '10:12', stage: 'delivery', text: 'On a Contoso finance laptop, opening the attachment starts "inv_viewer.exe", which downloads a second file from files.cdn-update.example.', indicators: ['inv_viewer.exe', 'files.cdn-update.example'], note: 'The same program name and the same download location as the other companies.', hint: 'What did the attachment do?' },
      { id: 'e5', source: 'Fabrikam endpoint', time: '11:30', stage: 'delivery', text: 'On a Fabrikam laptop, a file called "inv_viewer.exe" also downloads from files.cdn-update.example.', indicators: ['inv_viewer.exe', 'files.cdn-update.example'], note: 'The same file name and download location again, at a third company.', hint: 'Does Fabrikam match too?' },
      { id: 'n2', source: 'Northwind email', time: '11:40', text: 'Northwind also receives a spam email promoting discount software from a different domain.', indicators: [], note: 'Ordinary spam, unrelated to this campaign.', hint: 'Is this part of the chain?' },
      { id: 'e6', source: 'Contoso network', time: '12:05', stage: 'access', text: 'The Contoso laptop contacts 203.0.113.50 every five minutes.', indicators: ['inv_viewer.exe', '203.0.113.50'], note: 'The regular call to a controlling address. It is one of the two addresses in the shared cluster.', hint: 'Where does it call?' },
      { id: 'e7', source: 'Northwind network', time: '12:40', stage: 'access', text: 'A Northwind laptop contacts 203.0.113.51 every five minutes.', indicators: ['203.0.113.51'], note: 'A second address with the same registration details as the first.', hint: 'Does Northwind call the same place?' },
      { id: 'n3', source: 'Sector group', time: '13:00', text: 'A press article says "a well-known foreign group" is behind attacks on the sector.', indicators: [], note: 'Anonymous attribution in the press. It is not evidence and is not part of the technical chain.', hint: 'Is this evidence about the campaign?' },
      { id: 'e8', source: 'Contoso mail log', time: '15:20', stage: 'goal', text: 'The attackers read the shared finance mailbox at Contoso and search for the words "invoice" and "bank".', indicators: ['203.0.113.50'], note: 'The aim at Contoso appears to be supplier payments.', hint: 'What did they want?' },
      { id: 'e9', source: 'Northwind finance', time: '16:10', stage: 'goal', text: 'At Northwind, a supplier invoice is changed to a new bank account. The change is found and reversed before payment.', indicators: ['203.0.113.51'], note: 'The same goal, at a second company, stopped in time.', hint: 'Did it succeed anywhere?' },
    ],
    questions: [
      {
        id: 'link', short: 'What links them', prompt: 'Which evidence best supports the view that the three incidents are one campaign?',
        options: [
          { id: 'shared', correct: true, text: 'Shared infrastructure that is unlikely to be coincidence: domains registered together, the same attachment and program names, the same download location and two closely related control addresses, all seen at three companies', explain: 'Several independent matches in specific details, such as registration, file names and addresses, are far stronger than a similar lure.' },
          { id: 'lure', correct: false, text: 'All three received a fake invoice email', explain: 'Fake invoices are one of the commonest lures. A similar lure alone proves nothing.' },
          { id: 'press', correct: false, text: 'The press says a single named group is responsible', explain: 'An anonymous claim in the press is not evidence about linking.' },
          { id: 'sector', correct: false, text: 'All three are in the same sector', explain: 'Many attackers target the same sector. It is context, not a link.' },
        ],
      },
      {
        id: 'who', short: 'Who is behind it', prompt: 'How far can you go in saying who is behind it?',
        options: [
          { id: 'cluster', correct: true, text: 'You can say it is one cluster of activity, give it a working name, and say that the actor behind it is unknown; naming a group or a country needs much stronger evidence', explain: 'Linking incidents is much easier than identifying the people behind them. A cluster with a neutral label is honest.' },
          { id: 'group', correct: false, text: 'It is the group named in the press', explain: 'The press gives no evidence, and the technical clues do not point to any named group.' },
          { id: 'country', correct: false, text: 'It is run from the country where the control addresses are hosted', explain: 'Where an address is hosted says little about who uses it.' },
          { id: 'nothing', correct: false, text: 'You cannot say anything, since you do not know who did it', explain: 'You can say a great deal: it is one campaign, with these indicators and this goal.' },
        ],
      },
      {
        id: 'respond', short: 'What to do', prompt: 'What is the most useful thing the three companies can do with this picture?',
        options: [
          { id: 'share', correct: true, text: 'Share the shared indicators and the goal (supplier bank-detail changes) with the sector group, block and hunt for them, alert finance teams to confirm any change of bank details by phone, and keep the assessment under review', explain: 'It lets everyone protect themselves, and the call-back control stops the goal even if everything earlier fails.' },
          { id: 'announce', correct: false, text: 'Announce the name of the group in the press so everyone is warned', explain: 'It would be an unsupported claim and would not help anyone defend themselves.' },
          { id: 'wait', correct: false, text: 'Wait until the actor is identified before doing anything', explain: 'The indicators can be used now, whoever is behind them.' },
          { id: 'hide', correct: false, text: 'Keep it private to each company so that nobody looks bad', explain: 'Sharing is how the pattern was found, and it protects the sector.' },
        ],
      },
    ],
    summary: 'The three incidents are best explained as one cluster: domains registered together, the same program and file names, the same download location and related control addresses, and the same goal. Those are strong, specific links. The similar lure, the sector and the press story are not. The honest conclusion is "one campaign, actor unknown", which is enough to share indicators and to protect payment changes.',
  },
];
