// Senior Cloud Security Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. Cloud terms are generic on purpose.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const CLOUD_LEAD = [
  {
    id: 'cross-account-pivot',
    title: 'One account to the next',
    skill: 'data',
    blurb: 'A developer\'s test account was compromised on Monday. By Wednesday, someone had deleted audit logs in the production account. Rebuild how the attacker moved between accounts.',
    brief: [
      'On Wednesday the cloud team notices that audit logs for the production account stop on Tuesday night, and a log bucket in the shared services account has lost objects. Nobody changed anything on purpose.',
      'You have evidence from the developer sign-in records, the test account, the shared services account, the production account and the network. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a user, a role or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'A stolen developer session', desc: 'How the attacker got a foothold.', story: 'A developer\'s laptop was infected by a program hidden in a game installer. It copied the developer\'s browser session, which held a signed-in cloud console session for the test account.' },
      { id: 'pivot', name: 'Moving to the shared account', desc: 'Using trust between accounts.', story: 'The test account has a role that is allowed to assume a "tools-admin" role in the shared services account, set up long ago for a deployment job. The attacker used it to move across.' },
      { id: 'steal', name: 'Taking the keys to production', desc: 'Collecting what the shared account holds.', story: 'The shared services account stores deployment credentials for production. The attacker read them and used them to sign in to the production account as the deployment role.' },
      { id: 'abuse', name: 'Covering their tracks', desc: 'What the attacker did with the access.', story: 'In production, the attacker switched off audit logging and deleted log objects in the shared account, which has no protection against deletion, to hide what they had read.' },
    ],
    cards: [
      { id: 'e1', source: 'Endpoint', time: '19:40', stage: 'initial', text: 'A game installer downloaded on DEV-LAPTOP-22 launches a hidden process that reads browser data, including the cloud console session for the test account.', indicators: ['DEV-LAPTOP-22', 'dev.okafor'], note: 'Cookies and sessions let the attacker act as a signed-in person without any password or second factor.', hint: 'How did the attacker get a signed-in session?' },
      { id: 'n1', source: 'Cloud', time: '19:55', text: 'The nightly cost report job runs in the shared services account.', indicators: [], note: 'Routine automation unrelated to the attack.', hint: 'Does it involve the developer, the role or the address?' },
      { id: 'e2', source: 'Identity', time: '22:08', stage: 'initial', text: 'The test account console is used by dev.okafor from 203.0.113.44, an address in another country. No second-factor prompt is recorded.', indicators: ['dev.okafor', '203.0.113.44'], note: 'The session is being used from somewhere the developer is not, and it skips sign-in checks because it already exists.', hint: 'The stolen session is used from outside.' },
      { id: 'e3', source: 'Cloud', time: '22:15', stage: 'pivot', text: 'From the test account, the role dev-deployer assumes the role tools-admin in the shared services account.', indicators: ['dev-deployer', 'tools-admin', '203.0.113.44'], note: 'A trust relationship set up for a deployment job is being used by a person at night. It lets the attacker cross into a more powerful account.', hint: 'Which step moves them to the next account?' },
      { id: 'e4', source: 'Cloud', time: '22:16', stage: 'pivot', text: 'tools-admin in the shared account lists every secret stored there, from 203.0.113.44.', indicators: ['tools-admin', '203.0.113.44'], note: 'The attacker looks at what the shared account holds. The role has far more permissions than a deployment job needs.', hint: 'Listing before taking.' },
      { id: 'n2', source: 'Network', time: '22:30', text: 'The office VPN gateway shows 120 normal sign-ins from known staff devices.', indicators: [], note: 'Normal evening traffic from the usual users.', hint: 'Does it involve the stolen session or the outside address?' },
      { id: 'e5', source: 'Cloud', time: '22:41', stage: 'steal', text: 'tools-admin reads the secret "prod-deploy-credentials" in the shared services account.', indicators: ['tools-admin', 'prod-deploy-credentials', '203.0.113.44'], note: 'This is the real prize: credentials to production, stored where an over-broad role can read them.', hint: 'What does the attacker take?' },
      { id: 'e6', source: 'Production', time: '22:50', stage: 'steal', text: 'The production account records a sign-in by prod-deployer from 203.0.113.44, a role that is only ever used by the build service.', indicators: ['prod-deployer', 'prod-deploy-credentials', '203.0.113.44'], note: 'The stolen credentials work in production, from the same outside address.', hint: 'The stolen credentials are used.' },
      { id: 'n3', source: 'Endpoint', time: '23:10', text: 'DEV-LAPTOP-22 installs a routine operating system update.', indicators: ['DEV-LAPTOP-22'], note: 'The laptop is involved, but this update is unrelated to the attack.', hint: 'The laptop appears, but is this part of the chain?' },
      { id: 'e7', source: 'Production', time: '23:24', stage: 'abuse', text: 'prod-deployer in production stops audit logging for the account.', indicators: ['prod-deployer', '203.0.113.44'], note: 'Switching off logging is the attacker hiding what comes next.', hint: 'The attacker blinds the investigators.' },
      { id: 'e8', source: 'Cloud', time: '23:41', stage: 'abuse', text: 'prod-deployer deletes 1,900 older log objects from the log bucket in the shared services account.', indicators: ['prod-deployer', '203.0.113.44'], note: 'Deleting stored logs removes the record of what happened earlier in the night.', hint: 'The evidence is destroyed.' },
      { id: 'n4', source: 'Cloud', time: '23:55', text: 'A scheduled job rotates the keys of the monitoring service.', indicators: [], note: 'Routine key rotation by the usual account.', hint: 'Does it involve the attacker\'s role or address?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What let a stolen session in a test account reach production?',
        options: [
          { id: 'trust', correct: true, text: 'An old trust relationship let a role in the test account use a powerful role in the shared account, which in turn could read production credentials', explain: 'Each account trusted the one before it more than it should have. A compromise in the least protected account became a path to the most protected.' },
          { id: 'password', correct: false, text: 'A weak password for the production account', explain: 'No password was guessed. The attacker used credentials stored in the shared account.' },
          { id: 'zero', correct: false, text: 'A flaw in the cloud provider\'s service', explain: 'Every step used a normal feature working as configured.' },
          { id: 'insider', correct: false, text: 'A malicious insider', explain: 'The first event is malware on a laptop, and the developer\'s session was used from elsewhere.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of controls would have stopped the chain earliest and most reliably?',
        options: [
          { id: 'scoped', correct: true, text: 'Remove the test-to-shared trust, give deployment roles only the permissions the job needs, keep production credentials out of reach of shared tools, and require fresh sign-in for sensitive roles', explain: 'Each breaks a link in the chain. Least privilege and removing old trust stop one account\'s compromise from becoming all of them.' },
          { id: 'av', correct: false, text: 'More antivirus on laptops', explain: 'It might have caught the installer, but a stolen session would still work if it had been taken any other way.' },
          { id: 'training', correct: false, text: 'Training developers not to install games on work laptops', explain: 'Helpful, but one slip should not reach production. The design should not depend on nobody ever slipping.' },
          { id: 'faster', correct: false, text: 'Faster log review', explain: 'It would help detection. It would not stop the access.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should the response include beyond blocking the address?',
        options: [
          { id: 'full', correct: true, text: 'End the stolen sessions and replace prod-deploy-credentials, remove the trust and over-broad role, restore logging and protect the log bucket from deletion, rebuild the laptop, and work out what the attacker read in production', explain: 'The credentials, the path, the missing evidence and the exposure all need dealing with, as well as the laptop.' },
          { id: 'block', correct: false, text: 'Block 203.0.113.44 and carry on', explain: 'The attacker can use another address and the credentials still work.' },
          { id: 'delete', correct: false, text: 'Delete the test account', explain: 'It destroys evidence and leaves the credentials and the trust in place.' },
          { id: 'wait', correct: false, text: 'Wait to see whether anything else happens', explain: 'The attacker holds production credentials and has already deleted logs.' },
        ],
      },
    ],
    summary: 'No flaw was needed: the attacker used a stolen session, an old trust between accounts and credentials stored in the wrong place. Separating accounts properly, giving every role only what it needs and protecting logs from deletion each break the chain.',
  },
];
