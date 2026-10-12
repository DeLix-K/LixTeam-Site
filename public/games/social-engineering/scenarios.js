// Social Engineering Simulator scenarios. All people and companies are fictional.
//
// A scenario is a graph of nodes. Node fields:
//   lines:    [{ who, text }]   who is a key in `cast`, or 'narr' for narration
//   mood:     'calm' | 'friendly' | 'pushy' | 'angry'   how the other person is acting
//   choices:  [{ id, label, next, tag: 'good'|'ok'|'bad', coach, risk?, rel?, set? }]
//   continue: node id, for nodes with no choice (the player just carries on)
//   end:      { outcome: 'safe'|'partial'|'compromised'|'obstructive', title, text }
// `set` flags used by the scorer: verified, reported.

const RATINGS = [
  { min: -999, name: 'Taken in', blurb: 'The pressure worked. Read the notes: every one of these moves is learnable.' },
  { min: 60, name: 'Cautious', blurb: 'You avoided the worst, but there were better moves available.' },
  { min: 100, name: 'Sharp', blurb: 'Good instincts, and a mostly safe route through.' },
  { min: 140, name: 'Unshakeable', blurb: 'You held steady under pressure, verified properly, and told the right people.' },
];

export const SCENARIOS = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'it-chat',
    title: 'Approve this sign-in?',
    skill: 'identity',
    channel: 'Chat',
    blurb: 'A friendly "IT support" message says a sign-in prompt is about to appear and asks you to approve it.',
    setting: 'It is 09:14 and you are at your desk in Finance. You are Sam. The weekly payment run is at 11:00.',
    cast: { alex: { name: 'Alex (IT Support)', role: 'Chat message' }, desk: { name: 'IT Service Desk', role: 'Phone' }, sec: { name: 'Security team', role: 'Phone' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'Do not approve a prompt you did not start. Check through a channel you open yourself (ring the IT desk on the number in the directory), then report the message to Security.',
    tactics: [
      { name: 'Pretexting', desc: 'Inventing a believable reason to contact you ("we see failed sign-ins on your account").' },
      { name: 'Impersonating authority', desc: 'Posing as IT, whom people are used to trusting and obeying.' },
      { name: 'Urgency', desc: 'Warning that the payment run will fail, so you act before you think.' },
    ],
    question: {
      text: 'What was the real warning sign in this conversation?',
      options: [
        { text: 'IT was asking me to approve a sign-in prompt I had not started, and adding urgency.', correct: true, explain: 'Nobody legitimate needs you to approve a login you did not start. That request plus pressure is the signal, whatever the channel or tone.' },
        { text: 'It arrived as a chat message, and IT never uses chat.', correct: false, explain: 'Plenty of real IT teams use chat. The channel is not what gives it away: what they ask you to do is.' },
        { text: 'Alex used my name.', correct: false, explain: 'Names are easy to find from email signatures and social media. Knowing your name proves nothing.' },
        { text: 'The message was polite and friendly.', correct: false, explain: 'Politeness is not a signal either way. Good social engineers are charming.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'calm',
        lines: [
          { who: 'narr', text: 'A chat message pops up on your screen.' },
          { who: 'alex', text: 'Hi Sam, Alex from IT Support here. Our monitoring is showing repeated failed sign-ins on your account and we need to confirm it is really you.' },
          { who: 'alex', text: 'In a moment you will get a sign-in approval prompt on your phone. Please approve it so I can clear the block.' },
        ],
        choices: [
          { id: 'a1', label: 'Sure, I will approve it when it appears.', next: 'approve', tag: 'bad', risk: 45, coach: 'You agreed to approve a sign-in you did not start. That prompt is the attacker logging in with your stolen password.' },
          { id: 'a2', label: 'Which ticket is this? Can you send me the number?', next: 'ticket', tag: 'ok', coach: 'Asking for a ticket is a sensible instinct, but the attacker can keep talking. You still need to check through a channel you control.' },
          { id: 'a3', label: 'I have not started a sign-in. I will ring the IT desk on the number in the staff directory.', next: 'verify', tag: 'good', set: { verified: true }, coach: 'Checking through a channel you chose yourself, not the one the other person opened, is the heart of verification.' },
          { id: 'a4', label: 'Ignore the chat and carry on working.', next: 'ignored', tag: 'ok', risk: 10, coach: 'Ignoring it avoids the trap for now, but the attacker keeps trying and nobody who could stop them has been told.' },
        ],
      },
      approve: {
        id: 'approve',
        lines: [
          { who: 'narr', text: 'Your phone buzzes. You tap Approve.' },
          { who: 'alex', text: 'Perfect, thanks Sam. All sorted!' },
          { who: 'narr', text: 'The chat goes quiet. Twenty minutes later, your manager asks why a supplier received a strange email from your account.' },
        ],
        continue: 'end-comp',
      },
      'end-comp': {
        id: 'end-comp',
        lines: [],
        end: { outcome: 'compromised', title: 'You approved the attacker\'s sign-in', text: 'That prompt was the attacker signing in with your password. Approving it gave them a live session on your account: your mailbox, your files and, in Finance, the payment system.' },
      },
      ticket: {
        id: 'ticket',
        mood: 'pushy',
        lines: [
          { who: 'alex', text: 'It is a high-priority security ticket. The number has not generated yet, the system is slow.' },
          { who: 'alex', text: 'Honestly it is urgent. If the prompt expires, your account locks and the 11:00 payment run will fail. Please just approve it.' },
        ],
        choices: [
          { id: 'b1', label: 'OK, I do not want the payment run to fail.', next: 'approve', tag: 'bad', risk: 45, coach: 'The deadline pressure worked. A real ticket would exist, and a real deadline would never need you to skip checking.' },
          { id: 'b2', label: 'No ticket, no approval. I will ring the IT desk on its normal number.', next: 'verify', tag: 'good', set: { verified: true }, coach: 'When the pressure rises, it is a sign. You stayed polite and held your ground.' },
          { id: 'b3', label: 'That is not how IT works with me. I am reporting this to Security.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'Reporting a suspicious request straight away lets Security protect everyone, not just you.' },
        ],
      },
      verify: {
        id: 'verify',
        lines: [
          { who: 'narr', text: 'You ring the IT service desk using the number in the staff directory.' },
          { who: 'desk', text: 'IT Service Desk, hello Sam. No, we have not contacted you, and we never ask anyone to approve a sign-in over chat. Can you send me that chat?' },
        ],
        choices: [
          { id: 'v1', label: 'Yes, forwarding it now. And I will not reply to Alex.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'Reporting hands Security the evidence to block the account that contacted you and watch for others being targeted.' },
          { id: 'v2', label: 'Thanks. I will just block him and move on.', next: 'end-partial', tag: 'ok', coach: 'Blocking protects you, but without a report nobody can stop the same attacker contacting your colleagues.' },
        ],
      },
      ignored: {
        id: 'ignored',
        lines: [
          { who: 'narr', text: 'You close the chat. Over the next hour, your phone buzzes with six more sign-in prompts.' },
        ],
        choices: [
          { id: 'i1', label: 'Approve one just to make it stop.', next: 'end-comp', tag: 'bad', risk: 45, coach: 'Giving in to prompt fatigue is exactly what the attacker was waiting for.' },
          { id: 'i2', label: 'Deny them all and tell Security straight away.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'Repeated prompts you did not start mean someone has your password. Report it so your password can be reset.' },
          { id: 'i3', label: 'Keep denying them and carry on.', next: 'end-partial', tag: 'ok', risk: 15, coach: 'Denying is right, but the attacker still has your password and nobody is dealing with it.' },
        ],
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'You stopped it', text: 'You did not trust the way the request arrived, you made sure it was real through a channel you chose, and you reported it so Security could protect everyone else.' },
      },
      'end-partial': {
        id: 'end-partial',
        lines: [],
        end: { outcome: 'partial', title: 'Contained, but unreported', text: 'You did not fall for it, but nobody who could reset your password or watch for other targets knows what happened. The attacker is free to try again, on you or on others.' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ceo-pay',
    title: 'The CEO needs a payment today',
    skill: 'email',
    channel: 'Chat',
    blurb: 'The CEO messages from the airport: a confidential, urgent £48,000 payment to a new supplier.',
    setting: 'It is 16:40 on a Friday. You are Sam in Finance. A message arrives from "Marcus Webb", the CEO, on a chat app.',
    cast: { marcus: { name: 'Marcus Webb (CEO)', role: 'Chat message' }, lena: { name: 'Lena (Marcus\'s assistant)', role: 'Phone' }, fd: { name: 'Priya Shah (Finance Director)', role: 'Phone' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'Seniority does not change the payment process. Check with the CEO or his assistant on a number you already have, bring in the Finance Director, and report it. Never pay a new payee on a message alone.',
    tactics: [
      { name: 'Authority', desc: 'Using a senior title so you hesitate to question the request.' },
      { name: 'Urgency', desc: 'A deadline before close of business, so there is no time to check.' },
      { name: 'Secrecy and isolation', desc: '"Keep this between us" cuts you off from the colleagues who would spot the fraud.' },
    ],
    question: {
      text: 'Which part should have raised the alarm first?',
      options: [
        { text: 'A new payee, a deadline and a demand for secrecy, all outside the normal approval process.', correct: true, explain: 'Each is a classic business email compromise ingredient. Together they are a strong signal, however senior the sender appears.' },
        { text: 'It came through a chat app.', correct: false, explain: 'Executives do use chat. The medium is not the problem. The request is.' },
        { text: 'The amount was large.', correct: false, explain: 'Finance moves large amounts every week. The size alone is not suspicious: the way this one is being requested is.' },
        { text: 'It was sent on a Friday.', correct: false, explain: 'Attackers like Friday afternoons because teams are tired and fewer people are around, but a Friday payment is not suspicious on its own.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'calm',
        lines: [
          { who: 'marcus', text: 'Sam, are you at your desk? I need a favour and it has to stay confidential.' },
          { who: 'marcus', text: 'We are closing an acquisition. I need £48,000 paid today to a new supplier, Halden Advisory. Details are below. I am boarding a flight and will have no signal, so it needs to be done before 5.' },
          { who: 'narr', text: 'Below the message: a company name, a sort code and an account number.' },
        ],
        choices: [
          { id: 'a1', label: 'Of course. I will set it up right now.', next: 'pay', tag: 'bad', risk: 60, coach: 'A new payee, a deadline and secrecy, all in one message, and you paid it. That is how business email compromise works.' },
          { id: 'a2', label: 'Can you send me the invoice and a purchase order first?', next: 'ask', tag: 'ok', coach: 'Asking for paperwork is fine, but a forged invoice is easy to produce. You still need to confirm with the person, not the message.' },
          { id: 'a3', label: 'I will phone you on your mobile to confirm.', next: 'call', tag: 'good', set: { verified: true }, coach: 'Calling a number you already have, not one from the message, is the right instinct.' },
          { id: 'a4', label: 'I cannot do it before 5. I will process it on Monday through the normal approval.', next: 'delay', tag: 'ok', coach: 'Refusing to skip the process is good. But you have not checked who you are talking to, and the sender will push back.' },
        ],
      },
      pay: {
        id: 'pay',
        lines: [
          { who: 'narr', text: 'You make the payment. At 17:02, Marcus replies: "Done, thanks. Delete this chat, please."' },
          { who: 'narr', text: 'On Monday, the real Marcus walks into Finance, puzzled. He never sent any message.' },
        ],
        continue: 'end-comp',
      },
      'end-comp': {
        id: 'end-comp',
        lines: [],
        end: { outcome: 'compromised', title: '£48,000 gone', text: 'The message did not come from the CEO. Money sent to a new account on the strength of a chat message is almost impossible to recover once the criminals move it on.' },
      },
      ask: {
        id: 'ask',
        mood: 'pushy',
        lines: [
          { who: 'marcus', text: 'Attaching it now. I have no time for the usual back and forth, Sam. This is exactly the sort of thing I rely on you for.' },
          { who: 'narr', text: 'A polished-looking PDF invoice arrives from "Halden Advisory".' },
        ],
        choices: [
          { id: 'b1', label: 'The invoice looks fine. I will pay it.', next: 'pay', tag: 'bad', risk: 60, coach: 'A convincing invoice proves nothing: it was made by the same person who sent the message.' },
          { id: 'b2', label: 'I will ring you on your mobile, and Lena too, to confirm.', next: 'call', tag: 'good', set: { verified: true }, coach: 'Pressure and flattery are tactics. Verifying anyway is what protects both of you.' },
          { id: 'b3', label: 'I will take it to Priya, the Finance Director, before doing anything.', next: 'fd', tag: 'good', coach: 'Bringing a second person in breaks the isolation the attacker is relying on.' },
        ],
      },
      delay: {
        id: 'delay',
        mood: 'angry',
        lines: [
          { who: 'marcus', text: 'Monday? That is far too late. I did not think I would have to explain myself to you. Do it now, and do not mention this to anyone.' },
        ],
        choices: [
          { id: 'c1', label: 'I am sorry, you are right. I will do it now.', next: 'pay', tag: 'bad', risk: 60, coach: 'Annoyance and "do not tell anyone" are pressure, not proof. Caving to authority is the whole attack.' },
          { id: 'c2', label: 'I will stick with the normal process, and I will confirm with you by phone.', next: 'call', tag: 'good', set: { verified: true }, coach: 'You held your ground without being rude. A real CEO would respect that.' },
          { id: 'c3', label: 'Let me check this with Priya, the Finance Director.', next: 'fd', tag: 'good', coach: 'A second pair of eyes defeats isolation.' },
        ],
      },
      call: {
        id: 'call',
        lines: [
          { who: 'narr', text: 'You ring Marcus\'s mobile, the number saved in your phone. It goes straight to voicemail. You ring his assistant, Lena.' },
          { who: 'lena', text: 'Hi Sam. Marcus is in a board meeting until six, and he has not mentioned any acquisition payment. He is not travelling today. What is this about?' },
        ],
        choices: [
          { id: 'd1', label: 'Someone is pretending to be Marcus. I will not pay it, and I am telling Security and the Finance Director now.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'You stopped the payment and told the people who can warn the rest of the company.' },
          { id: 'd2', label: 'Odd. I will just ignore the message.', next: 'end-partial', tag: 'ok', coach: 'Ignoring it keeps your money safe but leaves the impersonator free to try someone else.' },
        ],
      },
      fd: {
        id: 'fd',
        lines: [
          { who: 'narr', text: 'You ring Priya, the Finance Director.' },
          { who: 'fd', text: 'No. Marcus would never ask for a payment like that outside the approval process, and a new payee needs two sign-offs. Do not pay it. Send me the chat. I will tell Security.' },
        ],
        choices: [
          { id: 'e1', label: 'Forwarding it now. I will also confirm with Marcus\'s assistant.', next: 'end-safe', tag: 'good', set: { reported: true, verified: true }, coach: 'Escalating and checking through other people kills the fraud and protects the company.' },
        ],
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'Fraud stopped', text: 'You refused to let a title, a deadline and secrecy override the payment process. You checked through people you already knew, and the right people now know the CEO is being impersonated.' },
      },
      'end-partial': {
        id: 'end-partial',
        lines: [],
        end: { outcome: 'partial', title: 'Money safe, fraudster free', text: 'You did not pay. But nobody has been told the CEO is being impersonated, so the same message may reach someone who does not check.' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'auditor',
    title: 'The auditor on the phone',
    skill: 'data',
    channel: 'Phone call',
    blurb: 'A caller says they are auditing customer data on the Director\'s authority and wants a full export today.',
    setting: 'It is 14:20. You are Sam, working with the customer database. Your desk phone rings from an unknown number.',
    cast: { dan: { name: 'Daniel Pryce (caller)', role: 'Phone call' }, dpo: { name: 'Hannah (Data Protection Officer)', role: 'Phone' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'Do not send personal data to someone who has contacted you. Ask them to go through the Data Protection Officer, check any claimed authority yourself, and report the approach.',
    tactics: [
      { name: 'Pretexting', desc: 'A believable role (an external auditor) that explains why they want the data.' },
      { name: 'Name-dropping', desc: 'Using the Director\'s name to borrow authority and make you think it has already been approved.' },
      { name: 'Urgency and flattery', desc: '"Today, please" and "you are the only person who can help" to rush and soften you.' },
    ],
    question: {
      text: 'What is the safest rule for a request like this?',
      options: [
        { text: 'Customer data goes out only through the formal request process, via the Data Protection Officer, never because someone phoned you.', correct: true, explain: 'The route matters more than how convincing the caller sounds. A genuine audit can follow the formal process and will not mind.' },
        { text: 'If the caller knows my manager\'s name, it is probably genuine.', correct: false, explain: 'Names are public on websites and LinkedIn. Knowing them proves nothing.' },
        { text: 'Send only the names, not the full details.', correct: false, explain: 'Even partial personal data is still personal data. Sending any of it to an unverified person is a breach.' },
        { text: 'Send it, but password-protect the spreadsheet.', correct: false, explain: 'Encryption helps if the right person receives it. It does not help if you have just sent it to a criminal.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'friendly',
        lines: [
          { who: 'dan', text: 'Hello, Sam? Daniel Pryce from Northwind Assurance. We are doing the annual data audit for your Director, Marcus Webb. Lovely man.' },
          { who: 'dan', text: 'I just need the full customer export (names, emails, phone numbers) sent to me today, so we can finish the sampling. My work address is down at the moment, so my Gmail is fine.' },
        ],
        choices: [
          { id: 'a1', label: 'Sure. Give me your email address and I will send it over.', next: 'send', tag: 'bad', risk: 60, coach: 'You were about to send personal data to a personal email address of someone who phoned you. That is a data breach before the file even leaves.' },
          { id: 'a2', label: 'Can you tell me who in the company approved this?', next: 'name', tag: 'ok', coach: 'Asking is sensible, but anything he says is just words. You need to check, not ask.' },
          { id: 'a3', label: 'I cannot send customer data on a phone request. This has to go through our Data Protection Officer.', next: 'dpo', tag: 'good', coach: 'Routing the request through the formal process is the right answer, and it is polite and professional.' },
          { id: 'a4', label: 'I can give you just the names and emails for now.', next: 'send', tag: 'bad', risk: 40, coach: 'Partial data is still personal data. The caller still got something that should never have left.' },
        ],
      },
      send: {
        id: 'send',
        lines: [
          { who: 'narr', text: 'You send the file. The caller thanks you warmly and hangs up.' },
          { who: 'narr', text: 'A week later, your customers start receiving convincing phishing messages that use their real details.' },
        ],
        continue: 'end-comp',
      },
      'end-comp': {
        id: 'end-comp',
        lines: [],
        end: { outcome: 'compromised', title: 'A data breach', text: 'Customer data went to someone with no right to it. The company will probably need to assess and report the breach, and your customers are now targets.' },
      },
      name: {
        id: 'name',
        mood: 'pushy',
        lines: [
          { who: 'dan', text: 'Marcus approved it personally last week, he is expecting this. Honestly, I am up against a deadline and you are the only person who can help me. Everyone else is useless.' },
        ],
        choices: [
          { id: 'b1', label: 'OK, I do not want to hold you up. Let me send it.', next: 'send', tag: 'bad', risk: 60, coach: 'Name-dropping and flattery were enough to get past you. Neither is evidence.' },
          { id: 'b2', label: 'If it is approved, the Data Protection Officer will know. I will put you in touch.', next: 'dpo', tag: 'good', coach: 'Letting the people who own the process confirm it removes you from the pressure.' },
          { id: 'b3', label: 'I will check with Marcus\'s office and ring you back on a number from your firm\'s website.', next: 'check', tag: 'good', set: { verified: true }, coach: 'Verifying the claimed approval yourself, through your own channels, is exactly right.' },
        ],
      },
      dpo: {
        id: 'dpo',
        mood: 'pushy',
        lines: [
          { who: 'dan', text: 'The DPO? That will take days. Look, this is routine, I have done it a hundred times. Just send it, and I will make sure everyone knows how helpful you were.' },
        ],
        choices: [
          { id: 'c1', label: 'If it takes days, it takes days. I will pass your details to the DPO and let you go.', next: 'report', tag: 'good', coach: 'You did not let the deadline become your problem. Genuine auditors expect the process.' },
          { id: 'c2', label: 'Fine, you win. I will send just the names.', next: 'send', tag: 'bad', risk: 40, coach: 'Persistence is a tactic. Giving in after saying no is how it works.' },
        ],
      },
      check: {
        id: 'check',
        lines: [
          { who: 'narr', text: 'You ring Marcus\'s office. His assistant says there is no audit planned and never heard of Northwind Assurance.' },
        ],
        continue: 'report',
      },
      report: {
        id: 'report',
        lines: [
          { who: 'narr', text: 'You hang up and ring the Data Protection Officer.' },
          { who: 'dpo', text: 'Thanks for calling, Sam. No audit is booked, and we would never request data like that over the phone. Please send me the caller\'s details and the time of the call. I will log it and warn the team.' },
        ],
        choices: [
          { id: 'r1', label: 'Sending the details now. Thanks, Hannah.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'Reporting lets the company warn others and record the attempt.' },
          { id: 'r2', label: 'I will leave it with you and not bother filing anything.', next: 'end-partial', tag: 'ok', coach: 'The call is now logged by the DPO, but the details you hold would help warn colleagues.' },
        ],
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'Data kept safe', text: 'You did not let a confident voice, a famous name and a deadline override the formal process. Because you reported it, the company can warn others the caller may phone next.' },
      },
      'end-partial': {
        id: 'end-partial',
        lines: [],
        end: { outcome: 'partial', title: 'Safe, but quiet', text: 'You protected the data, but with less detail passed on, the company is less able to warn colleagues who may be called next.' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'real-it',
    title: 'The genuine IT call',
    skill: 'identity',
    channel: 'Phone call',
    blurb: 'This time the caller is real. Can you verify properly without being difficult?',
    setting: 'It is 11:05. You are Sam. Your desk phone rings. Not every call is an attack, and refusing to cooperate with real IT has a cost too.',
    cast: { tom: { name: 'Tom (IT Service Desk)', role: 'Phone call' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'Verify through a channel you control (the service portal, or ring back on the published number), then cooperate politely. Refusing everything is not security. It is just friction.',
    tactics: [
      { name: 'None, this one is genuine', desc: 'This call was real. The skill being tested is proportion: checking calmly, then helping.' },
    ],
    question: {
      text: 'What is the best way to handle a call that might be genuine?',
      options: [
        { text: 'Verify through a channel I started (the portal or the published number), then cooperate politely.', correct: true, explain: 'You get safety and you keep the relationship. A genuine caller will welcome the check.' },
        { text: 'Refuse to talk to anyone who phones me.', correct: false, explain: 'That blocks real IT too, so patches and fixes never happen, and people stop reporting. Security that nobody can work with does not last.' },
        { text: 'Do whatever they ask if they sound confident.', correct: false, explain: 'Confidence is exactly what a good social engineer sounds like. Verify first.' },
        { text: 'Ask them to prove who they are over the same call.', correct: false, explain: 'Anything said on the call can be invented. Verification must come through a channel the caller does not control.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'friendly',
        lines: [
          { who: 'tom', text: 'Hi Sam, Tom from the IT Service Desk. This week we are rolling out a security update to laptops, and yours is booked in. I have raised ticket INC-20931 under your name.' },
          { who: 'tom', text: 'It takes about ten minutes. I will talk you through it. I will not need your password, just open the Company Portal on your laptop and we can start.' },
        ],
        choices: [
          { id: 'a1', label: 'OK, opening it now. What do I click?', next: 'trust', tag: 'ok', risk: 10, coach: 'It was genuine this time, but you had no way of knowing. You got lucky: you never checked.' },
          { id: 'a2', label: 'Sure, but I would like to see the ticket in the service portal first. Give me a minute.', next: 'portal', tag: 'good', set: { verified: true }, coach: 'You verified through the company\'s own portal without making the caller feel accused.' },
          { id: 'a3', label: 'Give me your name and extension. I will ring you back on the main service desk line.', next: 'callback', tag: 'good', set: { verified: true }, coach: 'Calling back on a published number is the gold standard for checking a caller.' },
          { id: 'a4', label: 'I do not trust unexpected calls. Goodbye.', next: 'end-obstruct', tag: 'bad', rel: -35, coach: 'Hanging up on a genuine caller fixes nothing. The laptop stays unpatched and next time IT will not bother to ring. The skill is to verify, not to refuse.' },
        ],
      },
      trust: {
        id: 'trust',
        lines: [
          { who: 'narr', text: 'You open the Company Portal and Tom guides you through the install. It takes ten minutes and goes smoothly.' },
          { who: 'narr', text: 'Nothing went wrong, but only because the caller happened to be genuine.' },
        ],
        continue: 'end-lucky',
      },
      portal: {
        id: 'portal',
        lines: [
          { who: 'narr', text: 'You open the service portal. INC-20931 is there, raised by Tom, assigned to your laptop, "Security update".' },
          { who: 'tom', text: 'Great, you found it. Good call, by the way. People should check. Shall we start?' },
        ],
        choices: [
          { id: 'b1', label: 'Yes please. Open the Company Portal and walk me through it.', next: 'end-safe', tag: 'good', rel: 8, coach: 'Verified, polite, and now cooperating: the ideal combination.' },
        ],
      },
      callback: {
        id: 'callback',
        lines: [
          { who: 'narr', text: 'You ring the main IT service desk number from the staff directory and ask for Tom.' },
          { who: 'tom', text: 'Hi again, Sam, same Tom. Ticket INC-20931 is live. Ready when you are.' },
        ],
        choices: [
          { id: 'c1', label: 'Thanks for waiting. Let us get the update done.', next: 'end-safe', tag: 'good', rel: 8, coach: 'You checked and cooperated. IT will find it easy to work with you.' },
        ],
      },
      'end-lucky': {
        id: 'end-lucky',
        lines: [],
        end: { outcome: 'partial', title: 'It worked out, by luck', text: 'The call was genuine, so nothing bad happened. But you would have done exactly the same for an attacker. Checking costs a minute and makes this safe every time.' },
      },
      'end-obstruct': {
        id: 'end-obstruct',
        lines: [],
        end: { outcome: 'obstructive', title: 'Safe, but unhelpful', text: 'Your instinct to be careful was good, but refusing to engage blocked a genuine security update. The aim is to verify and then help, not to treat everyone as a threat.' },
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'Verified, then helpful', text: 'You checked the request through a channel you controlled, without making a fuss, and then cooperated. That is exactly how security should feel to the people you work with.' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'tailgate',
    title: 'Hold the door',
    skill: 'everyday',
    channel: 'In person',
    blurb: 'Someone friendly with their hands full asks you to hold a secure door.',
    setting: 'It is 08:50 in the office lobby. You are Sam. You tap your badge on the secure door. Behind you, a man in a smart jacket is balancing two coffees and a laptop bag.',
    cast: { visitor: { name: 'Man with coffees', role: 'In person' }, guard: { name: 'Reception', role: 'In person' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'Be friendly but firm. Do not let anyone through a badge-controlled door on your badge. Walk them to reception, or call security.',
    tactics: [
      { name: 'Tailgating', desc: 'Following an authorised person through a secured door instead of using their own access.' },
      { name: 'Distraction and friendliness', desc: 'Full hands, a smile and a plausible story make refusing feel rude.' },
      { name: 'Social pressure', desc: '"I will be late and HR will be annoyed" makes you the obstacle.' },
    ],
    question: {
      text: 'What is the best way to deal with someone asking you to hold a secure door?',
      options: [
        { text: 'Be friendly, but take them to reception or ask security, so they get in through the proper route.', correct: true, explain: 'It is courteous, it solves their problem if they are genuine, and it stops an intruder getting in on your badge.' },
        { text: 'Hold the door. They have a coffee tray and look harmless.', correct: false, explain: 'Attackers deliberately look harmless, with full hands and a smile. Looks prove nothing.' },
        { text: 'Tap them in with your badge. It is only a second.', correct: false, explain: 'It is your badge and your responsibility. Anything they do inside is traced to you.' },
        { text: 'Say nothing and let the door close.', correct: false, explain: 'It is safe for the door, but a genuine visitor is left stranded, and a would-be intruder is not reported or redirected.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'friendly',
        lines: [
          { who: 'visitor', text: 'Oh, brilliant, could you hold that for me? My badge is buried in my bag, and my hands are full. I am here to interview with HR at nine.' },
        ],
        choices: [
          { id: 'a1', label: 'Sure. Come on through.', next: 'inside', tag: 'bad', risk: 55, coach: 'You let someone through a secured door on your badge. If they are not who they say, they now have the run of the office.' },
          { id: 'a2', label: 'Sorry. You will need to sign in at reception. I will take you there.', next: 'reception', tag: 'good', set: { verified: true }, coach: 'Friendly and firm. You solve their problem through the proper route.' },
          { id: 'a3', label: 'Let me just tap you in. No problem.', next: 'inside', tag: 'bad', risk: 55, coach: 'It is your badge, so anything they do inside leads back to you.' },
          { id: 'a4', label: 'I will let the door close and ring security to say there is a visitor with no badge.', next: 'security', tag: 'ok', coach: 'Safe, but a bit abrupt. A genuine candidate is left standing at the door.' },
        ],
      },
      inside: {
        id: 'inside',
        lines: [
          { who: 'narr', text: 'He thanks you warmly and heads off down the corridor, not towards HR.' },
          { who: 'narr', text: 'An hour later, a laptop is reported missing from a meeting room, and the camera shows a man in a smart jacket walking out with it.' },
        ],
        continue: 'end-comp',
      },
      'end-comp': {
        id: 'end-comp',
        lines: [],
        end: { outcome: 'compromised', title: 'An intruder got in on your badge', text: 'Politeness was turned against you. Once inside, the intruder could take equipment, plug in a device, or just photograph screens, and your badge is on the log.' },
      },
      reception: {
        id: 'reception',
        mood: 'pushy',
        lines: [
          { who: 'visitor', text: 'Oh, come on, I will be late and HR will be furious. It is just one door. You are making this difficult.' },
        ],
        choices: [
          { id: 'b1', label: 'It will only take a minute at reception, and I will walk you over. HR can confirm you are expected.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'Holding your ground kindly, and offering help, keeps the relationship and the door secure.' },
          { id: 'b2', label: 'Oh, fine, in you go.', next: 'inside', tag: 'bad', risk: 55, coach: 'Pressure to be nice is the whole trick. You said no, then gave in.' },
        ],
      },
      security: {
        id: 'security',
        lines: [
          { who: 'narr', text: 'Security arrives and takes the man to reception. He turns out to be a genuine candidate.' },
        ],
        continue: 'end-partial',
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'Door secure, visitor helped', text: 'You kept the secure area secure without being unkind. If the man was genuine, he is signed in and on time. If he was not, he never got past reception.' },
      },
      'end-partial': {
        id: 'end-partial',
        lines: [],
        end: { outcome: 'partial', title: 'Safe, but abrupt', text: 'The door stayed secure. Next time, offering to walk the visitor to reception keeps people safe and still feels welcoming.' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'voice',
    title: 'The CFO\'s voice',
    skill: 'ai',
    channel: 'Phone call',
    blurb: 'It sounds exactly like the CFO, and the caller ID matches. She wants a payment batch released before 3.',
    setting: 'It is 14:25. You are Sam in Finance. Your mobile rings. The screen shows "Priya Shah (CFO)".',
    cast: { priya: { name: 'Priya Shah (CFO)', role: 'Phone call' }, real: { name: 'Priya Shah (the real CFO)', role: 'Phone, after you ring back' } },
    ratings: RATINGS,
    start: 'start',
    ideal: 'A familiar voice and caller ID are not proof. Hang up, ring back on a number you already have, and use any agreed safe word. Release nothing on a call.',
    tactics: [
      { name: 'AI voice cloning', desc: 'A realistic copy of a real person\'s voice, built from a few seconds of public audio.' },
      { name: 'Caller ID spoofing', desc: 'Making the screen show a trusted name. Caller ID can be faked.' },
      { name: 'Urgency and authority', desc: 'A deadline from a senior person, and a request to act now and sort the approval later.' },
    ],
    question: {
      text: 'Why is "it sounds just like her" not enough to trust a call?',
      options: [
        { text: 'AI can clone a voice from a few seconds of audio, and caller ID can be faked, so voice and number are not proof.', correct: true, explain: 'The safe habit is a second check through a different channel: ring back on a known number or use a pre-agreed safe word.' },
        { text: 'Real executives never phone staff.', correct: false, explain: 'They do. The question is how you confirm it is really them when money is involved.' },
        { text: 'Voice cloning does not exist yet.', correct: false, explain: 'It does, and it has been used in real frauds.' },
        { text: 'The call was probably short.', correct: false, explain: 'Length proves nothing. A short call just leaves less time to think.' },
      ],
    },
    nodes: {
      start: {
        id: 'start',
        mood: 'pushy',
        lines: [
          { who: 'narr', text: 'The voice is warm and unmistakable, with Priya\'s usual cadence.' },
          { who: 'priya', text: 'Sam, I am between client meetings and cannot talk long. I need you to release the £120,000 supplier batch before 3. I will send the approval email afterwards, there is just no time right now.' },
        ],
        choices: [
          { id: 'a1', label: 'Understood, releasing it now.', next: 'release', tag: 'bad', risk: 70, coach: 'A voice and a caller ID were enough to skip the approval process, and that is exactly what voice cloning is built to achieve.' },
          { id: 'a2', label: 'Priya, what was the name of that restaurant we went to after the audit?', next: 'question', tag: 'ok', coach: 'A personal question helps, but cloned voices can be paired with a live human who bluffs, and the attacker may have researched you.' },
          { id: 'a3', label: 'What is our safe word?', next: 'safeword', tag: 'good', set: { verified: true }, coach: 'A pre-agreed safe word is a very strong check, and hard to guess.' },
          { id: 'a4', label: 'I will call you straight back on your number from the directory.', next: 'callback', tag: 'good', set: { verified: true }, coach: 'Ringing back on a number you already have is the simplest, strongest check.' },
        ],
      },
      release: {
        id: 'release',
        lines: [
          { who: 'narr', text: 'You release the batch. The approval email never arrives.' },
          { who: 'narr', text: 'At 15:30, the real Priya texts: "Why is there a £120k payment I do not recognise?"' },
        ],
        continue: 'end-comp',
      },
      'end-comp': {
        id: 'end-comp',
        lines: [],
        end: { outcome: 'compromised', title: '£120,000 released', text: 'The voice was a clone and the number was spoofed. A payment released on a phone call, before approval, is a fraud waiting to happen.' },
      },
      question: {
        id: 'question',
        mood: 'angry',
        lines: [
          { who: 'priya', text: 'Sam, I do not have time for games. That is not relevant. I told you, there is a deadline. Just do it, please.' },
        ],
        choices: [
          { id: 'b1', label: 'You are right, sorry. Releasing it now.', next: 'release', tag: 'bad', risk: 70, coach: 'Irritation from a senior person is a pressure tactic. A real CFO would want you to check.' },
          { id: 'b2', label: 'I am going to hang up and ring you back on your usual number.', next: 'callback', tag: 'good', set: { verified: true }, coach: 'Dodging a simple check and getting angry is itself a warning sign. You verified anyway.' },
        ],
      },
      safeword: {
        id: 'safeword',
        mood: 'angry',
        lines: [
          { who: 'priya', text: 'A safe word? Sam, really? I am the CFO. We do not have time for this. Release the payment.' },
        ],
        choices: [
          { id: 'c1', label: 'I am sorry, I cannot release anything without the safe word. I will ring you back on your usual number.', next: 'callback', tag: 'good', coach: 'The one thing the real Priya would have, and the caller would not, is the word. You stuck to the check.' },
          { id: 'c2', label: 'Never mind then, I will just do it.', next: 'release', tag: 'bad', risk: 70, coach: 'You asked the right question, and then dropped it when the pressure came.' },
        ],
      },
      callback: {
        id: 'callback',
        lines: [
          { who: 'narr', text: 'You hang up and ring Priya on the number from the company directory.' },
          { who: 'real', text: 'Hi Sam. No, I have not rung you, I am in a meeting. Nobody should release a batch like that on a call. Please do not do anything, and tell Security straight away.' },
        ],
        choices: [
          { id: 'd1', label: 'I will report it to Security and send them the call details now.', next: 'end-safe', tag: 'good', set: { reported: true }, coach: 'You stopped the fraud and gave Security a chance to warn others. Voice clones are often used on several people.' },
          { id: 'd2', label: 'Thanks, I will just ignore any further calls from that number.', next: 'end-partial', tag: 'ok', coach: 'Ignoring it protects you, but reporting helps the company find who else was called.' },
        ],
      },
      'end-safe': {
        id: 'end-safe',
        lines: [],
        end: { outcome: 'safe', title: 'Clone caught', text: 'You treated a perfect voice and a matching caller ID as claims to check, not proof. You rang back on a known number, stopped the payment, and reported it.' },
      },
      'end-partial': {
        id: 'end-partial',
        lines: [],
        end: { outcome: 'partial', title: 'Payment stopped, fraud unreported', text: 'You protected the money, but the people who could warn others about the voice clone do not yet know it exists.' },
      },
    },
  },
];
