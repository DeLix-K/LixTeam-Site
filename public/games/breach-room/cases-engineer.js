// Security Engineer Breach Room cases (see cases.js for the format). Everything here is fictional. IP
// addresses come from the reserved documentation ranges. The .example domains and package names are not
// real. Cloud terms are generic ("access key", "storage") on purpose.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const ENGINEER = [
  {
    id: 'dependency-chain',
    title: 'The package that was not ours',
    skill: 'data',
    blurb: 'A build pulled in a library with the same name as an internal one. Within minutes, the pipeline\'s keys were being used from somewhere else.',
    brief: [
      'On Tuesday afternoon the cloud security team reports that an access key belonging to the build pipeline was used from an address outside the company. Nothing was phished, and no developer clicked anything.',
      'You have evidence from the code repository, the package registry, the build system, the network and the cloud audit log. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a package, a key or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'A lookalike package', desc: 'How the malicious code reached the build.', story: 'Contoso uses an internal library called contoso-utils, hosted on its own registry. An attacker published a public package with the same name and a higher version number. The build system, configured to look at the public registry as well, chose the higher version, which was the attacker\'s.' },
      { id: 'exec', name: 'Running on the build', desc: 'The code starts to work.', story: 'When the package was installed, a script bundled with it ran automatically on the build machine, with the same rights as the build.' },
      { id: 'steal', name: 'Taking the keys', desc: 'Collecting what the build holds.', story: 'The script read the build\'s environment, which held the pipeline\'s cloud access key and a deployment token, and sent them to an address the attacker controlled.' },
      { id: 'abuse', name: 'Using the keys', desc: 'What the attacker did with them.', story: 'Using the stolen access key from outside the company, the attacker listed the company\'s storage and began copying files from the build artefact bucket.' },
    ],
    cards: [
      { id: 'e1', source: 'Registry', time: '11:02', stage: 'initial', text: 'A public package "contoso-utils" version 99.0.0 is published by a new, unverified account. Contoso\'s internal contoso-utils is at version 2.4.1.', indicators: ['contoso-utils'], note: 'A public package that copies an internal name with a much higher version, so any build that checks public sources will prefer it.', hint: 'Where does the attacker place something for the build to find?' },
      { id: 'n1', source: 'Repo', time: '11:20', text: 'The dependency bot opens three routine update pull requests.', indicators: [], note: 'Routine automation unrelated to the attack.', hint: 'Does it involve the package, the key or the address?' },
      { id: 'e2', source: 'Build', time: '13:05', stage: 'initial', text: 'Build #8841 for the billing service resolves contoso-utils to 99.0.0 from the public registry instead of 2.4.1 from the internal one.', indicators: ['contoso-utils', 'BUILD-RUNNER-07'], note: 'The build chose the attacker\'s package. This is the moment the chain starts.', hint: 'The build picks the wrong source.' },
      { id: 'e3', source: 'Build', time: '13:06', stage: 'exec', text: 'During installation of contoso-utils 99.0.0, a script runs on BUILD-RUNNER-07 and opens a network connection.', indicators: ['contoso-utils', 'BUILD-RUNNER-07'], note: 'A package that does something when installed, rather than when used, is a warning sign.', hint: 'The code begins to run.' },
      { id: 'e4', source: 'Network', time: '13:06', stage: 'exec', text: 'BUILD-RUNNER-07 connects to 203.0.113.58 on port 443, an address it has never contacted.', indicators: ['BUILD-RUNNER-07', '203.0.113.58'], note: 'A build machine talking to a new outside address during installation.', hint: 'The script calls home.' },
      { id: 'e5', source: 'Build', time: '13:07', stage: 'steal', text: 'The installation script reads the runner\'s environment variables, which include AKEY-9120 (pipeline cloud key) and DEPLOY_TOKEN.', indicators: ['AKEY-9120', 'BUILD-RUNNER-07'], note: 'Build machines hold powerful secrets in their environment. This is what the attacker came for.', hint: 'What does the build hold that is worth taking?' },
      { id: 'e6', source: 'Network', time: '13:07', stage: 'steal', text: 'A 4 KB upload leaves BUILD-RUNNER-07 for 203.0.113.58.', indicators: ['BUILD-RUNNER-07', '203.0.113.58'], note: 'A small upload exactly the size of a few secrets.', hint: 'The secrets leave.' },
      { id: 'n2', source: 'Network', time: '13:30', text: 'BUILD-RUNNER-07 uploads 200 MB of build artefacts to the internal artefact store.', indicators: ['BUILD-RUNNER-07'], note: 'The normal output of a build, to the normal place.', hint: 'The runner is involved, but is this part of the attack?' },
      { id: 'n3', source: 'Cloud', time: '14:00', text: 'The nightly storage lifecycle job archives 300 old objects.', indicators: [], note: 'Routine housekeeping by the usual account.', hint: 'Does it involve the stolen key or the address?' },
      { id: 'e7', source: 'Cloud', time: '14:12', stage: 'abuse', text: 'AKEY-9120 is used from 203.0.113.58 for the first time, to list all storage buckets.', indicators: ['AKEY-9120', '203.0.113.58'], note: 'The key now works from outside. It is normally used only by the build runners.', hint: 'The stolen key is used.' },
      { id: 'e8', source: 'Cloud', time: '14:19', stage: 'abuse', text: 'AKEY-9120 downloads 6,300 objects from the build artefact bucket.', indicators: ['AKEY-9120', '203.0.113.58'], note: 'Taking build outputs, which may contain source code and configuration.', hint: 'The attacker takes what they can.' },
      { id: 'n4', source: 'Repo', time: '14:50', text: 'A developer merges a documentation change.', indicators: [], note: 'Normal activity.', hint: 'Does it involve the package or the key?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What allowed the attacker\'s package to be chosen over the company\'s own?',
        options: [
          { id: 'confusion', correct: true, text: 'The build looked at the public registry as well as the internal one, and chose the higher version number', explain: 'This is dependency confusion. An internal package name that is also available on the public registry can be claimed by an attacker with a higher version.' },
          { id: 'phish', correct: false, text: 'A developer was phished', explain: 'There is no email or sign-in in the chain. The first event is a public package appearing.' },
          { id: 'weak', correct: false, text: 'A weak password on the registry', explain: 'The attacker never touched the company\'s registry. They used the public one.' },
          { id: 'zero', correct: false, text: 'An unpatched flaw in the build tool', explain: 'The build behaved as configured. The configuration was the weakness.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of controls would have prevented this most reliably?',
        options: [
          { id: 'scoped', correct: true, text: 'Resolve internal package names only from the internal registry, pin versions with lockfiles and hashes, and reserve the internal names on the public registry', explain: 'Each stops the build from accepting a lookalike. Pinning and hashes also mean an unexpected new version is never installed.' },
          { id: 'av', correct: false, text: 'Antivirus on the build machines', explain: 'The script used legitimate steps. Antivirus is unlikely to treat it as malware.' },
          { id: 'training', correct: false, text: 'Training developers to spot suspicious packages', explain: 'No developer chose this package. The build chose it automatically.' },
          { id: 'faster', correct: false, text: 'Faster builds', explain: 'Speed is irrelevant.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What must the response include beyond blocking the address?',
        options: [
          { id: 'full', correct: true, text: 'Revoke and replace AKEY-9120 and the deployment token, find every build that installed the bad package, check what was taken from the bucket, and fix how packages are resolved', explain: 'The secrets are the real loss, other builds may have run the same script, the bucket contents need assessing, and the cause needs fixing.' },
          { id: 'block', correct: false, text: 'Block 203.0.113.58 and carry on', explain: 'The attacker can use another address, and the stolen key still works.' },
          { id: 'delete', correct: false, text: 'Delete the public package', explain: 'You do not control the public registry, and the secrets have already been taken.' },
          { id: 'wait', correct: false, text: 'Wait to see whether anything else happens', explain: 'The attacker has working keys and is downloading data now.' },
        ],
      },
    ],
    summary: 'The attack needed no phishing and no flaw: it relied on the build choosing a public package over an internal one with the same name. Resolving packages from the right place, pinning versions, and keeping powerful secrets away from build steps each break the chain.',
  },
];
