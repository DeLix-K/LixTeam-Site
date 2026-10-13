// More Breach Room cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.
// Cloud terms are generic ("access key", "compute instances") on purpose.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const EXTRA = [
  {
    id: 'cloudkey',
    title: 'The key in the repository',
    skill: 'identity',
    blurb: 'A cloud bill jumped 4,000% in two hours. Trace it back to a developer\'s commit.',
    brief: [
      'At 12:05, a spending alert fires: cloud costs are up 4,000% in two hours. Forty large machines are running in a region the company has never used.',
      'You have evidence from the code repository, the cloud audit log, network records and billing. Place each card in the right stage of the attack and spot the noise. Tap an indicator (an account, address or key) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Initial access', desc: 'How the attacker got a foothold.', story: 'A developer committed a configuration file containing a long-lived cloud access key to a public repository. Automated scanners watch for exactly this, and within half an hour the attacker was using the key from a hosting provider address.' },
      { id: 'discovery', name: 'Discovery', desc: 'Learning what the key can reach.', story: 'The attacker listed the storage buckets, the running machines and the users and roles in the account, to work out how much power the key had.' },
      { id: 'persist', name: 'Persistence', desc: 'Making sure they keep access.', story: 'Because the key was powerful, the attacker created a new administrator user with its own access key and added another key to an existing deploy user, so that revoking the first key would not remove them.' },
      { id: 'impact', name: 'Impact', desc: 'What they did with the access.', story: 'They launched 40 large compute instances in an unused region to mine cryptocurrency at the company\'s expense. The first sign anyone noticed was the bill.' },
    ],
    cards: [
      { id: 'n1', source: 'Identity', time: '08:00', text: 'The quarterly access-review reminder is sent to all managers.', indicators: [], note: 'A routine notification with no connection to the incident.', hint: 'Does this involve any account, key or address in the rest of the evidence?' },
      { id: 'e1', source: 'Code', time: '09:12', stage: 'initial', text: 'Developer j.sato commits config.env to a public repository. The file contains a cloud access key.', indicators: ['j.sato', 'AKEY-7731'], note: 'The origin of the whole incident: a secret published to the world.', hint: 'Where does an attack start: how did the attacker get something to use?' },
      { id: 'n2', source: 'Cloud', time: '09:30', text: 'The scheduled nightly snapshot job (svc-backup) completes.', indicators: ['svc-backup'], note: 'A routine job running as its normal account.', hint: 'Compare the account and the activity with the rest of the chain.' },
      { id: 'e2', source: 'Cloud', time: '09:41', stage: 'initial', text: 'The access key AKEY-7731 is used for the first time, from 203.0.113.58 (a hosting provider).', indicators: ['AKEY-7731', '203.0.113.58'], note: 'The key is now in someone else\'s hands. Scanners find published keys within minutes.', hint: 'This is the first time an outsider uses the thing that was exposed.' },
      { id: 'e3', source: 'Cloud', time: '09:44', stage: 'discovery', text: 'Calls to list storage buckets and describe running instances are made with AKEY-7731 from the same address.', indicators: ['AKEY-7731', '203.0.113.58'], note: 'Looking around to see what the key can see.', hint: 'The attacker already has access. What are they learning?' },
      { id: 'e4', source: 'Cloud', time: '09:47', stage: 'discovery', text: 'AKEY-7731 lists every user, role and policy in the account.', indicators: ['AKEY-7731'], note: 'Enumerating identities to see how powerful the key is and where to go next.', hint: 'Mapping out who and what exists in the account.' },
      { id: 'e5', source: 'Cloud', time: '09:55', stage: 'persist', text: 'A new user "svc-monitor" is created with administrator permissions and its own access key, using AKEY-7731.', indicators: ['AKEY-7731', 'svc-monitor'], note: 'A new backdoor account named to look routine. Revoking the first key would not remove it.', hint: 'They are making sure they do not lose their access.' },
      { id: 'e6', source: 'Cloud', time: '10:02', stage: 'persist', text: 'A second access key is created for the existing deploy user.', indicators: ['AKEY-7731'], note: 'Another spare key, on an account nobody watches closely.', hint: 'Why would an outsider add a key to an existing account?' },
      { id: 'n3', source: 'Identity', time: '10:10', text: 'j.sato signs in to the cloud console from the London office with MFA.', indicators: ['j.sato'], note: 'The developer working normally. It does not follow that the developer did anything wrong here.', hint: 'Same person as the commit, but is the activity part of the attack?' },
      { id: 'e7', source: 'Cloud', time: '10:20', stage: 'impact', text: '40 large compute instances are launched in a region the company has never used.', indicators: ['svc-monitor'], note: 'Resources for the attacker\'s benefit, running on the company\'s bill.', hint: 'What do they do with the access, and who pays for it?' },
      { id: 'e8', source: 'Network', time: '10:35', stage: 'impact', text: 'The new instances connect outbound to a cryptocurrency mining pool.', indicators: [], note: 'The purpose of those machines: mining for the attacker.', hint: 'What are the machines for?' },
      { id: 'n4', source: 'Code', time: '11:00', text: 'The dependency bot opens three routine update pull requests.', indicators: [], note: 'Automated housekeeping, unrelated.', hint: 'Does it involve any of the accounts or keys?' },
      { id: 'e9', source: 'Billing', time: '12:05', stage: 'impact', text: 'Spending alert: cloud costs up 4,000% in two hours.', indicators: [], note: 'The consequence, and the first thing anyone noticed.', hint: 'It is the result of the attacker\'s activity, not its start.' },
    ],
    questions: [
      {
        id: 'entry', short: 'Entry point', prompt: 'How did the attacker first get in?',
        options: [
          { id: 'key', correct: true, text: 'A cloud access key was exposed in a public code repository', explain: 'The first card is the commit that published the key, and the first use of that key came half an hour later from a hosting address.' },
          { id: 'pw', correct: false, text: 'They guessed an administrator password', explain: 'There are no failed sign-ins or password guessing. Every action uses the access key.' },
          { id: 'phish', correct: false, text: 'A phishing email led to a stolen console login', explain: 'No email or console sign-in appears in the chain. The attacker used the key directly.' },
          { id: 'insider', correct: false, text: 'j.sato deliberately gave the attacker access', explain: 'j.sato\'s later console sign-in is normal and from the usual place. The mistake was committing a secret, not helping an attacker.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which control would have stopped it earliest?',
        options: [
          { id: 'scan', correct: true, text: 'Secret scanning that blocks commits containing keys, and short-lived credentials instead of long-lived keys', explain: 'It stops the secret reaching the public repository at all, and a short-lived credential would have expired before it was useful.' },
          { id: 'mfa', correct: false, text: 'MFA on the cloud console', explain: 'Good practice, but access keys do not go through the console sign-in, so MFA on it would not have stopped this.' },
          { id: 'budget', correct: false, text: 'Tighter budget alerts', explain: 'Useful for detection, but it only shows the problem after the damage has begun.' },
          { id: 'region', correct: false, text: 'Blocking unused regions', explain: 'A helpful guardrail that would have limited the mining, but it would not have stopped the key being used for everything else.' },
        ],
      },
      {
        id: 'cleanup', short: 'Clean-up', prompt: 'What must the response include beyond revoking the exposed key?',
        options: [
          { id: 'all', correct: true, text: 'Delete the attacker\'s new user and extra keys, review everything the key did, and shut down the instances', explain: 'Revoking the first key alone would leave the backdoor user and the second key in place, and the machines running.' },
          { id: 'only', correct: false, text: 'Nothing more: revoking the key ends the incident', explain: 'The attacker made persistence precisely so that revoking the first key would not matter.' },
          { id: 'dev', correct: false, text: 'Discipline the developer and move on', explain: 'Blame does not fix the access or the machines, and it discourages people from reporting mistakes quickly.' },
          { id: 'pay', correct: false, text: 'Dispute the bill and wait', explain: 'Billing is a separate matter. The attacker still has access while you wait.' },
        ],
      },
    ],
    summary: 'One secret in a public repository gave an attacker administrator access, a hidden way back, and a bill of thousands. Long-lived keys, secret scanning and alerts on new identities would each have limited it.',
  },
];
