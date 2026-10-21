// Social Engineering workspace, assignment 1: "The service desk, Friday afternoon".
// Everything here is fictional: the company, the people, the vendor and the callers. This is the defender's view: the
// player is the service desk agent who must decide whom to help, using checks of different strength.
//
// The shape of the shift (kept here so the tests and the debrief can both use it):
//   13:00 to 17:00 on a Friday, with the weekly payment run at 15:00. Eight contacts arrive over the afternoon. Four are
//   genuine colleagues or suppliers who are under pressure and deserve help. Four are attempts to get something they
//   should not have: an MFA reset on the finance director's account, remote access for a "vendor", an administrator
//   password for a fake "security test", and every staff member's mobile number. They use the same tactics as the
//   genuine requests: authority, urgency and a believable story. What separates them is what the checks show.
//   Checks differ in strength. A caller ID display, a correct answer to a security question or a lookup of a public
//   fact proves little. A call back to the number on file, a message to the person's manager, or an independent
//   record (a ticket, an onboarding entry) reaches the real person through a channel the contact did not provide.
//   A real colleague refused is harm to the business, and an attacker helped has consequences later in the shift.

const m = (h, mi = 0) => h * 60 + mi;

const contacts = [
  {
    id: 'C1', at: m(13, 5), channel: 'call', from: 'Priya Nair (Finance)', title: 'Locked out before the payment run', genuine: true, risk: 'medium', needsVerify: true, patience: 30,
    transcript: [
      ['them', 'Hi, it\'s Priya in Finance. I changed my password this morning and now I\'m locked out. The payment run goes at 3 and I can\'t log in. Can you just reset it and read me a temporary one?'],
    ],
    pressure: 'Stressed but polite. The payment run is a real deadline.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Priya Nair, Finance analyst. Desk extension 4412. Mobile on file ending 218. Manager: Sam Whitlock. In the office today.' },
      ticket: { cost: 1, strength: 'weak', text: 'No open ticket for Priya.' },
      sender: { cost: 1, strength: 'weak', text: 'Caller ID shows the internal extension 4412. An internal extension can be spoofed, but it matches her desk.' },
      question: { cost: 2, strength: 'weak', text: 'She answers your question correctly (her employee number). That is information that is easy to find, so it proves little by itself.' },
      manager: { cost: 5, strength: 'strong', text: 'Sam replies: "Yes, Priya is at her desk and mentioned the lockout. Please help."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring the mobile on file. Priya answers, says she is at her desk and has just spoken to you. It is her.' },
    },
    strongTools: ['manager', 'callback'],
    actions: {
      help: { text: 'You reset the password and read a temporary one out over the phone. Priya signs in. It works, but the password was spoken aloud: the safe route sends a reset link to the phone on file.' },
      safe: { text: 'You send a reset link to the mobile on file and walk Priya through it. She is back in within five minutes and the payment run goes out on time.' },
      refuse: { text: 'You decline, and Priya has to wait for her manager. She misses the cut-off and the payment run slips by a day.', harm: 3 },
      escalate: { text: 'You report a genuine colleague to Security. They find nothing and Priya waits twenty minutes longer than she should have.', harm: 1 },
    },
    good: ['safe'], fine: ['help'],
    why: 'A genuine request with a real deadline. A call back or a word from her manager confirms it, and the safe route (a link to the phone on file) is faster than arguing.',
    verifyNote: 'A call back to the number on file, or her manager, would have settled it.',
    leftText: 'Priya gave up waiting and the payment run slipped.', leftHarm: 3,
  },
  {
    id: 'C2', at: m(13, 25), channel: 'call', from: '"Mel" from the CFO\'s office', title: 'Urgent MFA reset for the finance director', genuine: false, risk: 'high', needsVerify: true, patience: 35,
    transcript: [
      ['them', 'Hello, it\'s Mel from Dana Okafor\'s office. Dana is at the conference and has lost her phone, so she can\'t get her sign-in code. She needs to approve a board paper by two and she is furious. Can you reset her MFA and give me the new setup code? I\'ll pass it on.'],
      ['them', 'I\'d hate for you to be the reason the board paper is late.'],
    ],
    pressure: 'Polite, then pointed. Authority and a deadline.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Dana Okafor, Chief Financial Officer. Assistant on record: Theo Brandt. There is no one called Mel in her office. Status: travelling (conference). Mobile on file ending 044.' },
      ticket: { cost: 1, strength: 'weak', text: 'No ticket or change record for an MFA reset on Dana\'s account.' },
      sender: { cost: 1, strength: 'weak', text: 'Caller ID is withheld. That is neither proof nor disproof, but a real assistant would normally call from the office.' },
      question: { cost: 2, strength: 'weak', text: '"Mel" gives Dana\'s birthday and employee number correctly. Both are in a public conference biography and an old email, so this proves little.' },
      manager: { cost: 5, strength: 'strong', text: 'The CEO replies: "No idea about this. Dana is in sessions until six. I haven\'t heard she lost her phone."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring Dana\'s mobile on file. It rings out, then she picks up from a corridor: "I haven\'t lost my phone and I haven\'t asked anyone to do that."' },
    },
    strongTools: ['manager', 'callback'],
    actions: {
      help: { text: 'You reset Dana\'s MFA and read out the setup code. "Mel" thanks you warmly and hangs up. The caller now controls a second sign-in factor for the finance director.', breach: true, sets: ['breach:C2'] },
      safe: { text: 'You say a reset needs a call back to the number on file, and that you will make it. "Mel" says there is no time and hangs up.' },
      refuse: { text: 'You decline politely. "Mel" argues, then hangs up.' },
      escalate: { text: 'You decline and report the call to Security straight away, with the time and what was asked. They warn the CFO and watch her account.' },
    },
    good: ['escalate'], fine: ['safe', 'refuse'],
    why: 'Authority, urgency and a flattering sense of blame. Dana was reachable on the number on file and knew nothing. A caller who cannot be reached back is the point.',
    verifyNote: 'Dana was one call to her mobile on file away, and she knew nothing about it.',
    tactics: ['authority', 'urgency', 'pretext'],
  },
  {
    id: 'C3', at: m(13, 50), channel: 'chat', from: 'Jordan Reyes (new starter)', title: 'First day, no access', genuine: true, risk: 'medium', needsVerify: true, patience: 35,
    transcript: [
      ['them', 'Hi, I\'m Jordan, I started in Finance today. My laptop is here but I haven\'t got a username or password yet. Can you set me up? Sam said someone from IT would sort it out.'],
    ],
    pressure: 'Friendly and a little anxious.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Jordan Reyes: start date today, Finance, manager Sam Whitlock. Laptop issued this morning. No account created yet.' },
      ticket: { cost: 1, strength: 'strong', text: 'Onboarding ticket ONB-884 is open for Jordan Reyes, approved by HR, with Sam Whitlock as the contact.' },
      sender: { cost: 1, strength: 'weak', text: 'The chat comes from a new account on the company chat system, created this morning.' },
      question: { cost: 2, strength: 'weak', text: 'Jordan answers correctly about the start date and team. That is in the welcome email, so it proves little.' },
      manager: { cost: 5, strength: 'strong', text: 'Sam replies: "Yes, Jordan started today. Please send the first-day details to me and I\'ll hand them over."' },
      callback: { cost: 4, strength: 'weak', text: 'There is no phone number on file for Jordan yet, so there is nothing to call back.' },
    },
    strongTools: ['ticket', 'manager'],
    actions: {
      help: { text: 'You post the username and first-day password into the chat. Jordan signs in. It works, but credentials posted in chat are in the transcript for ever.' },
      safe: { text: 'You send the first-day details to Sam under the onboarding process and tell Jordan Sam will hand them over. Jordan is set up within the hour.' },
      refuse: { text: 'You decline. Jordan sits at an empty desk for the afternoon and Sam has to chase you.', harm: 2 },
      escalate: { text: 'You report a new starter to Security. It wastes their time and Jordan waits.', harm: 1 },
    },
    good: ['safe'], fine: ['help'],
    why: 'The onboarding ticket and the manager confirm it. The safe route sends credentials to the manager, not into a chat with someone you cannot yet verify.',
    verifyNote: 'The onboarding ticket and Sam would both have confirmed it.',
    leftText: 'Jordan sat idle on the first day.', leftHarm: 2,
  },
  {
    id: 'C4', at: m(14, 15), channel: 'call', from: 'Fabrikam Support (a vendor)', title: 'Remote access for an "urgent patch"', genuine: false, risk: 'high', needsVerify: true, patience: 35,
    transcript: [
      ['them', 'Afternoon, this is Fabrikam Support. We\'ve found a critical flaw in the version of our software you run on FS-02 and we need to push a patch today before it\'s exploited. I\'m going to send you a link: just click it and give me access so I can fix it.'],
    ],
    pressure: 'Technical and confident. Urgent, with a real-sounding fear.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Fabrikam is an approved vendor. Support line on file: 0114 555 0188. Account manager: Tom Weir (Procurement).' },
      ticket: { cost: 1, strength: 'strong', text: 'No change request, ticket or scheduled work involving Fabrikam this week.' },
      sender: { cost: 1, strength: 'weak', text: 'Caller ID shows an unknown mobile number, not the support line on file.' },
      question: { cost: 2, strength: 'weak', text: 'He knows the server is called FS-02. That name was in a conference talk by the company\'s own IT team, so it proves little.' },
      manager: { cost: 5, strength: 'strong', text: 'Tom Weir replies: "No work booked with Fabrikam this week. I haven\'t been told about any flaw."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring the support line on file. They have no record of a call to you and no open case for Contoso.' },
    },
    strongTools: ['ticket', 'manager', 'callback'],
    actions: {
      help: { text: 'You click the link and approve the remote session. The "engineer" connects to FS-02, the file server.', breach: true, sets: ['breach:C4'] },
      safe: { text: 'You say remote access needs an approved change request, and that you will call the support line on file. He says that will take too long and hangs up.' },
      refuse: { text: 'You decline. He tries to talk you round, then hangs up.' },
      escalate: { text: 'You decline and report the call to Security with the number he rang from. They warn Procurement and check FS-02.' },
    },
    good: ['escalate'], fine: ['safe', 'refuse'],
    why: 'A vendor name you recognise, a technical story and urgency. There was no change request, the real vendor knew nothing and Procurement had booked nothing.',
    verifyNote: 'The ticket system, Tom and the support line on file each showed nothing was happening.',
    tactics: ['authority', 'urgency', 'pretext'],
  },
  {
    id: 'C5', at: m(14, 40), channel: 'call', from: '"Colin" from Security', title: 'An "authorised phishing test" that needs your admin password', genuine: false, risk: 'high', needsVerify: true, patience: 35,
    transcript: [
      ['them', 'Hi, Colin from Security. We\'re running an authorised phishing simulation this afternoon and I need your service desk admin credentials to log the results correctly. It\'ll take two minutes and it counts towards your security awareness score.'],
    ],
    pressure: 'Breezy and official. A reward and an appeal to being a good citizen.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Security team: Ruth Adeyemi (lead), Imran Qureshi, Joy Chen. There is no Colin.' },
      ticket: { cost: 1, strength: 'strong', text: 'There is no phishing simulation scheduled or announced for today.' },
      sender: { cost: 1, strength: 'weak', text: 'Caller ID shows extension 5109, which belongs to the Security team. Internal numbers can be faked, and Security\'s real number is not shown.' },
      question: { cost: 2, strength: 'weak', text: '"Colin" correctly names the CISO. That is on the company website, so it proves little.' },
      manager: { cost: 5, strength: 'weak', text: 'Your manager replies: "Never give anyone your admin password, whoever they say they are." That is the rule, not a verification of this caller.' },
      callback: { cost: 4, strength: 'strong', text: 'You ring Ruth Adeyemi, the Security lead, on the number in the directory: "We aren\'t running a simulation. Nobody from Security will ever ask for your credentials."' },
    },
    strongTools: ['ticket', 'callback'],
    actions: {
      help: { text: 'You give Colin your administrator credentials. He thanks you and ends the call. The caller now holds an account that can reset any password in the company.', breach: true, sets: ['breach:C5'] },
      safe: { text: 'You say you can never share credentials with anyone and offer to put him through to the Security lead. He hangs up.' },
      refuse: { text: 'You decline. He sighs and ends the call.' },
      escalate: { text: 'You decline, then report the call to Security, who confirm there was no test and tell the other desks.' },
    },
    good: ['escalate'], fine: ['safe', 'refuse'],
    why: 'Nobody legitimate asks for your credentials, even Security. The caller did not exist in the directory and no test was scheduled.',
    verifyNote: 'There was no test on the calendar, and Ruth, the real lead, was a call away.',
    tactics: ['authority', 'pretext'],
  },
  {
    id: 'C6', at: m(15, 5), channel: 'email', from: 'Lena Kovacs (Head of Sales)', title: 'New phone, no MFA, a pitch in 40 minutes', genuine: true, risk: 'high', needsVerify: true, patience: 25,
    transcript: [
      ['them', 'Subject: URGENT, locked out of everything. I have just landed in Chicago, my old phone died on the flight and the new one has no authenticator on it. I have a customer pitch in 40 minutes and need my sign-in. Please reset my MFA and email me the setup code. I\'m in a taxi with no signal for calls. Lena'],
    ],
    pressure: 'Senior, rushed, and written like the C2 call. The pressure is real this time.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Lena Kovacs, Head of Sales. Status: travelling, flight to Chicago landed 20 minutes ago. Mobile on file ending 731. Manager: the CEO.' },
      ticket: { cost: 1, strength: 'strong', text: 'Lena opened ticket #3321 yesterday: "Upgrading my phone this weekend, may need MFA moved". It is in her name from her own account, with the date.' },
      sender: { cost: 1, strength: 'weak', text: 'The email header shows it was sent from Lena\'s account through the company mail system. A stolen password would look the same, so this is not proof.' },
      question: { cost: 2, strength: 'weak', text: 'You reply asking a question; she answers within a minute with the right detail. That can be guessed or looked up, so it proves little.' },
      manager: { cost: 5, strength: 'strong', text: 'The CEO replies: "Yes, Lena is pitching at four. Please help her, carefully."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring the mobile on file. She picks up in the taxi after all: the voice and the context fit, and she confirms the ticket.' },
    },
    strongTools: ['ticket', 'manager', 'callback'],
    actions: {
      help: { text: 'You reply to the email with a setup link for her new phone. It works, but if her mailbox had been compromised the code would have gone straight to an attacker. The standard route registers the new phone through the number on file.' },
      safe: { text: 'You register her new phone through the standard process, after the call back. She is in her pitch with five minutes to spare.' },
      refuse: { text: 'You decline until she can call, which she cannot do from the taxi. She loses her preparation time and the CEO calls you.', harm: 4 },
      escalate: { text: 'You report a genuine senior colleague to Security. They find nothing, and Lena is late.', harm: 3 },
    },
    good: ['safe'], fine: ['help'],
    why: 'Authority, urgency, travelling: the same tactics as the CFO call. The difference is what the checks show: a ticket she opened yesterday, her manager\'s word and a call back that she answered.',
    verifyNote: 'A ticket from yesterday, the CEO and a call back each confirmed her.',
    leftText: 'Lena lost her preparation time for the pitch.', leftHarm: 4,
  },
  {
    id: 'C7', at: m(15, 30), channel: 'email', from: '"Gareth" from Facilities', title: 'Every staff mobile number for an evacuation drill', genuine: false, risk: 'high', needsVerify: true, patience: 35,
    transcript: [
      ['them', 'Hi, Gareth in Facilities. We\'re running a surprise evacuation drill next week and I need a spreadsheet of every employee\'s name, department and mobile number so we can text people. Could you export it from the directory and email it back today? Thanks! Gareth'],
    ],
    pressure: 'Ordinary and friendly. A believable purpose, a small ask.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Gareth Pryce works in Facilities. His address on file is gareth.pryce@contoso.example.' },
      ticket: { cost: 1, strength: 'strong', text: 'No request from HR or a fire marshal. Evacuation drill contact lists are held by HR and are never exported by the service desk.' },
      sender: { cost: 1, strength: 'strong', text: 'The email did not come from contoso.example. It came from gareth@contoso-facilities.example, a lookalike domain registered six days ago.' },
      question: { cost: 2, strength: 'weak', text: 'You ask a question; "Gareth" answers with a plausible detail about the building that is on the public website.' },
      manager: { cost: 5, strength: 'strong', text: 'The HR Director replies: "We hold the drill lists. We would never route this through IT, and nobody has asked for it."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring Gareth on his extension: "I never sent that. I haven\'t emailed anyone about a drill."' },
    },
    strongTools: ['sender', 'ticket', 'manager', 'callback'],
    actions: {
      help: { text: 'You export every employee\'s name, department and mobile number and email it back. It leaves the company.', breach: true, sets: ['breach:C7'] },
      safe: { text: 'You reply that drill lists come from HR and send nothing. No answer comes back.' },
      refuse: { text: 'You decline the request and delete the email.' },
      escalate: { text: 'You send nothing and report the email to Security, with the headers. They block the lookalike domain.' },
    },
    good: ['escalate'], fine: ['safe', 'refuse'],
    why: 'A friendly, plausible request from a name that exists. The email came from a lookalike domain, and the real Gareth knew nothing about it. A list of mobile numbers is raw material for the next attack.',
    verifyNote: 'The sender domain was the giveaway, and Gareth himself would have told you.',
    tactics: ['pretext', 'familiarity'],
  },
  {
    id: 'C8', at: m(16, 0), channel: 'call', from: 'Ellis (an approved supplier)', title: 'Which backup software do you run?', genuine: true, risk: 'low', needsVerify: false, patience: 40,
    transcript: [
      ['them', 'Hi, Ellis from Northwind Systems, one of your approved suppliers. We\'re scheduling security patch calls for our customers and I wanted to confirm which version of the backup software you run so I can book the right engineer. Could you tell me?'],
    ],
    pressure: 'Relaxed and routine.',
    tools: {
      directory: { cost: 1, strength: 'context', text: 'Northwind Systems is an approved supplier. Account manager: Tom Weir (Procurement).' },
      ticket: { cost: 1, strength: 'weak', text: 'No open ticket involving Northwind.' },
      sender: { cost: 1, strength: 'weak', text: 'Caller ID shows Northwind\'s main switchboard number, the one on file.' },
      question: { cost: 2, strength: 'weak', text: 'Ellis answers an ordinary question about Contoso\'s account with the right account number.' },
      manager: { cost: 5, strength: 'strong', text: 'Tom Weir replies: "Yes, Northwind do plan patch calls. Send them to me and I\'ll book it."' },
      callback: { cost: 4, strength: 'strong', text: 'You ring the switchboard number on file. Ellis is a real employee and confirms the call.' },
    },
    strongTools: ['manager', 'callback'],
    actions: {
      help: { text: 'You tell Ellis the backup software and its version. Nothing bad follows today, but you have handed an outsider detail about the company\'s systems that nobody authorised you to share.', harm: 1 },
      safe: { text: 'You say technical details go through the account manager, and give Ellis Tom Weir\'s name. Tom books the call himself.' },
      refuse: { text: 'You say you cannot discuss the company\'s systems. Ellis shrugs and rings Tom, who deals with it.' },
      escalate: { text: 'You report a routine supplier call to Security. It wastes their time.', harm: 1 },
    },
    good: ['safe'], fine: ['refuse'],
    why: 'A genuine supplier asking something that is not theirs to ask the service desk. Even a real caller gets a pointer to the account manager, not details about your systems.',
  },
];

const events = [
  { id: 'e-n1', t: m(13, 0), type: 'notice', sev: 'info', summary: 'Handover: a normal Friday queue. The weekly payment run goes at 15:00, so Finance will be pressing for fast answers', fields: { from: 'desk lead' } },
  { id: 'e-n2', t: m(14, 10), type: 'notice', sev: 'medium', summary: 'Security bulletin: a peer organisation reports callers impersonating executives, vendors and security staff to service desks this week', fields: { from: 'Security' } },
  { id: 'e-n3', t: m(15, 0), type: 'notice', sev: 'info', summary: 'Security team: if a contact looks wrong, tell us straight away through the Security channel with the time and what was asked', fields: { from: 'Security' } },
  { id: 'e-n4', t: m(16, 45), type: 'notice', sev: 'info', summary: 'Reminder: the shift ends at 17:00. Write up anything unusual for Security', fields: { from: 'desk lead' } },
  { id: 'e-b2', t: m(15, 40), type: 'alert', sev: 'high', summary: 'Unusual sign-in: Dana Okafor\'s account signed in from a new device in another country', fields: { account: 'dana.okafor' }, when: ['breach:C2'], consequence: { cost: 6, label: 'The finance director\'s account was taken over', prevented: 'nobody took over the finance director\'s account', text: 'The caller registered a new device on Dana\'s account and signed in. They now see the board papers and payment approvals.' } },
  { id: 'e-b4', t: m(16, 10), type: 'alert', sev: 'high', summary: 'Unknown remote session open on FS-02 from the vendor link', fields: { host: 'FS-02' }, when: ['breach:C4'], consequence: { cost: 6, label: 'A stranger got onto the file server', prevented: 'nobody reached the file server', text: 'The "engineer" had a remote session on the file server for 40 minutes before it was noticed.' } },
  { id: 'e-b5', t: m(15, 50), type: 'alert', sev: 'high', summary: 'The administrator account was used from an unfamiliar address and three accounts were changed', fields: { account: 'service-desk-admin' }, when: ['breach:C5'], consequence: { cost: 6, label: 'The administrator account was taken over', prevented: 'the administrator account stayed safe', text: 'The caller used your credentials to reset three accounts, including a finance approver.' } },
  { id: 'e-b7', t: m(16, 30), type: 'alert', sev: 'medium', summary: 'Staff are reporting text messages that pretend to be from HR and ask them to "confirm their details"', fields: { source: 'staff reports' }, when: ['breach:C7'], consequence: { cost: 4, label: 'Every staff mobile number was used for a text-message attack', prevented: 'the staff mobile numbers stayed private', text: 'The list you sent out was used within hours to text every employee a fake HR link.' } },
];

export const SE_SERVICEDESK = {
  id: 'se-servicedesk',
  title: 'The service desk, Friday afternoon',
  workspace: 'se',
  path: 'analyst',
  pathLabel: 'Social engineering (all paths)',
  blurb: 'Eight contacts, four of them genuine and four attacks, all using the same pressure. Decide whom to help, with checks that range from useless to decisive, while the clock and the payment run keep moving.',
  brief: [
    'It is 13:00 on Friday and you are on the service desk at Contoso. The weekly payment run goes at 15:00, so everyone is in a hurry. Over the afternoon, calls, chats and emails will arrive asking for resets, access and information.',
    'Some of the people are who they say they are, and they deserve quick, safe help. Some are not. They will use authority, urgency and a believable story, just as the real ones do. Each contact will wait only so long. You have six kinds of check, from a caller ID display to a call back on the number on file, and they are not equally good. Decide whom to help, how, and when to tell Security.',
  ],
  clockStart: m(13, 0),
  horizon: m(17, 30),
  se: { outcomePoints: 10, contacts },
  ui: {
    name: 'Contoso service desk',
    nav: ['brief', 'inbox', 'logs', 'case', 'report'],
    labels: { inbox: 'Contacts', logs: 'Security notices', case: 'Shift' },
    noPins: true,
    examples: ['type:notice', 'type:alert', 'Security'],
    searchHint: 'type:notice   type:alert   Security   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known.'],
      ['Contacts', 'The calls, chats and emails waiting for you. Open one, run any checks you think are worth the time, then decide. Each contact will give up if you leave them too long.'],
      ['Security notices', 'Bulletins from the Security team, and any alert that follows from what you decided.'],
      ['Shift', 'Who you have dealt with and who is still waiting.'],
    ],
    briefPanel: {
      heading: 'Handover: the service desk shift',
      paragraphs: ['You are the agent on the service desk from 13:00 to 17:00. The desk lead has left you a short note: the weekly payment run goes at 15:00, so Finance will be pressing for quick answers.', 'Requests will come in by phone, chat and email. You can reset passwords and MFA, create accounts and answer questions, but not everyone who asks should get what they ask for.'],
      known: ['You have six kinds of check: the staff directory, a ticket lookup, the caller ID or email header, a verification question, a message to the person\'s manager, and a call back on the number on file.', 'They are not equally strong: some only reach the person who contacted you, and some reach the real person through a channel the contact did not provide.', 'Each contact will wait only so long. A genuine colleague left hanging is harm to the business.', 'Security will want to hear about anything suspicious.'],
      asks: ['Help the genuine people quickly and safely.', 'Do not give anything to anyone who has not been verified through a strong check.', 'Tell Security about attacks, with details.', 'At the end of the shift, summarise what happened and what should change.'],
    },
    tips: {
      brief: 'Read the handover first. Everyone will sound urgent. The question is who has been checked.',
      inbox: 'Open a contact and read what they ask. Run the checks you think are worth the time, then decide. A strong check reaches the real person through a channel the contact did not provide. A weak one only asks the contact to vouch for themselves.',
      logs: 'Notices from Security, and any alert that follows from your decisions.',
      case: 'Who has been handled and who is still waiting. Waiting costs genuine colleagues.',
      report: 'Your summary is graded against what actually happened. Say which were attacks, which tactics they used and what should change.',
    },
    groupLabels: { triage: 'Decisions', evidence: 'Verification', response: 'Outcomes' },
  },
  entities: [],
  targets: {},
  actions: [],
  responses: [],
  defaults: {},
  events,
  alerts: [],
  roleLabels: {},
  roleHints: {},
  report: [
    { id: 'attempts', kind: 'set', title: 'Attack attempts', label: 'Which contacts were attacks?', options: contacts.map((c) => [c.id, `${c.from}: ${c.title}`]), truth: ['C2', 'C4', 'C5', 'C7'], points: 8, note: 'The CFO\'s "assistant", the "vendor", the "Security" caller and the "Facilities" email. Priya, Jordan, Lena and Ellis were real, though Ellis was asking for something that was not his to ask.' },
    { id: 'tactics', kind: 'set', title: 'Tactics', label: 'Which pressure tactics did the attackers use?', options: [['authority', 'Posing as someone senior or official'], ['urgency', 'A deadline and a reason you cannot wait'], ['pretext', 'A believable story to justify the request'], ['reward', 'A prize or reward for helping'], ['threat', 'A threat of legal or physical harm'], ['curiosity', 'A tempting file or link to open']], truth: ['authority', 'urgency', 'pretext'], points: 5, note: 'Authority, urgency and a believable story. A reward appeared once, but it was a small part of one call, and there were no threats or tempting links.' },
    { id: 'pattern', kind: 'choice', title: 'What was happening', label: 'What was happening this afternoon?', options: [['campaign', 'A coordinated social engineering campaign against the service desk, using different stories to reach credentials, access and personal data'], ['coincidence', 'Four unrelated coincidences'], ['difficult', 'Genuine staff being difficult under pressure'], ['outage', 'A technical outage causing odd requests']], truth: 'campaign', points: 4, note: 'Four attacks in one afternoon, with different stories but the same shape, matching the bulletin from a peer organisation.' },
    { id: 'fixes', kind: 'set', title: 'What should change', label: 'What should change?', options: [['callback', 'Require a call back to the number on file before any MFA or password reset'], ['no-admin-pw', 'Nobody is ever asked for an administrator password, and nobody ever gives one'], ['data-hr', 'Staff personal data is only released through HR, with a ticket'], ['vendor-ticket', 'Vendor remote access only through an approved change request and a call back to the vendor\'s known number'], ['brief-desk', 'Brief the desk on these patterns and rehearse them'], ['callerid', 'Trust the caller ID display'], ['faster', 'Resolve every request in under five minutes, whatever it takes'], ['no-resets', 'Stop all password resets']], truth: ['callback', 'no-admin-pw', 'data-hr', 'vendor-ticket', 'brief-desk'], points: 8, note: 'The five controls that would have stopped all four. Trusting caller ID, going faster and stopping resets would each make it worse.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Handover note for Security', minLength: 40, points: 5, placeholder: 'What you were asked, what you checked, what you did, which contacts you suspect and why.' },
  ],
  grading: { triage: 40, evidence: 20, response: 10, reportTotal: 30, harmScale: 1.5, cap: 'You gave an attacker something they should not have had, and it was used before the end of the shift. A good record elsewhere does not undo that.', capAt: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'se-callback',
      question: 'The caller "Mel" gave the CFO\'s birthday and employee number correctly. Why did that prove nothing, when a call to the CFO\'s mobile on file settled it?',
      options: [
        { text: 'The birthday and number are in public sources and old emails, so anyone can have them. The call back reached the real CFO through a number the caller did not provide', correct: true, explain: 'A check is strong when the contact cannot control it. Knowledge the caller can look up or guess only shows they did some homework.' },
        { text: 'The CFO\'s birthday was wrong', correct: false, explain: 'It was right. That is exactly why it is weak: it was easy to find.' },
        { text: 'A call back is always slow and should be avoided', correct: false, explain: 'It took four minutes and decided the question.' },
        { text: 'Security questions are only for customers', correct: false, explain: 'They are weak for anyone whose answers can be found.' },
      ],
    },
    {
      id: 'se-lena',
      question: 'Lena\'s email looked like the CFO call: senior, urgent, travelling. Why was helping Lena right and helping "Mel" wrong?',
      options: [
        { text: 'The tactics were the same, but Lena\'s checks came back: a ticket from yesterday, her manager\'s word and a call back she answered. "Mel" failed every strong check', correct: true, explain: 'Pressure and urgency are not evidence. What you check and what comes back is. Refusing Lena by reflex would have been harm to the business.' },
        { text: 'Senior people should always be helped', correct: false, explain: 'Seniority is exactly what attackers borrow.' },
        { text: 'Emails are safer than phone calls', correct: false, explain: 'A stolen mailbox looks identical. The header only said it came from her account.' },
        { text: 'Lena was nicer', correct: false, explain: 'Charm and rudeness are both used by attackers and by real people.' },
      ],
    },
  ],
  story: [
    '13:00 A Friday shift on the service desk, with the payment run at 15:00. Eight contacts arrive over the afternoon.',
    'Four are real: Priya, locked out before the run; Jordan, a new starter; Lena, travelling with a dead phone; and Ellis, a supplier asking for something that was not his to ask.',
    'Four are attacks: a "CFO\'s assistant" wanting an MFA reset, a "vendor" wanting remote access, a "Security" caller wanting the administrator password, and a "Facilities" email wanting every staff mobile number.',
    'They used the same pressure as the real ones. The difference was in the checks: a call back to a number on file, a ticket, a manager and a lookalike domain separated them every time.',
    'Any attack that was helped had consequences later in the afternoon: a taken-over account, a stranger on the file server, a compromised administrator, and a text-message attack on every employee.',
  ],
};
