// Lead-level and cloud-track Breach Room cases (see cases.js for the format).
// Everything here is fictional. IP addresses come from the reserved documentation
// ranges. Cloud terms are generic ("access key", "role", "snapshot") on purpose.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'supply-chain',
    title: 'The update that came with a visitor',
    skill: 'data',
    blurb: 'A trusted monitoring tool updated itself overnight. By afternoon, 3.4 GB had left the building.',
    brief: [
      'At 14:40 your network team reports 3.4 GB sent to an address nobody recognises, from the finance file server. Nothing was phished, and there is no suspicious sign-in. But last night a monitoring tool called Northgate Monitor, which runs on 38 servers, updated itself.',
      'You have evidence from the vendor, endpoint, network, identity and file tools. Place each card in the right stage of the attack and spot the noise. Tap an indicator (an account, address or agent) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Trusted foothold', desc: 'How the attacker got code running.', story: 'The attacker did not break into Contoso. They broke into the vendor\'s build system and added a hidden implant to the next release of Northgate Monitor. The update was signed with the vendor\'s genuine certificate and delivered through the normal update channel, so Contoso\'s servers installed it automatically.' },
      { id: 'c2', name: 'Command and control', desc: 'The implant calls home.', story: 'The implant waited a few hours, then began to contact an address controlled by the attacker, using a lookalike domain registered nine days earlier, so it could receive instructions and send back what it found.' },
      { id: 'lateral', name: 'Credentials and movement', desc: 'Using the agent\'s own power to spread.', story: 'The monitoring agent runs with powerful rights on every server. The implant used that service account to sign in to the file server and a domain controller, and ran a credential-dumping tool to take more accounts.' },
      { id: 'exfil', name: 'Data theft', desc: 'Taking what they came for.', story: 'The attacker packaged the finance shares into compressed archives and sent them out over HTTPS to the same address that was controlling the implant.' },
    ],
    cards: [
      { id: 'e1', source: 'Vendor', time: '02:00', stage: 'initial', text: 'Northgate Monitor automatically updates to version 4.2.1 on 38 servers. The package is signed with the vendor\'s valid certificate.', indicators: ['northgate-agent'], note: 'The attack arrives through something Contoso trusts. A valid signature proves who signed it, not that the build was clean.', hint: 'This is how something new got onto the servers. Who sent it?' },
      { id: 'e2', source: 'Endpoint', time: '02:04', stage: 'initial', text: 'The updated agent process starts a hidden child process (rundll32.exe) it has never started before, then goes quiet.', indicators: ['northgate-agent'], note: 'The implant is running and waiting. A trusted process doing something new and unexplained is the tell.', hint: 'Code is now running. Is it part of the foothold or a later step?' },
      { id: 'n1', source: 'Identity', time: '08:00', text: 'The quarterly access-review reminder is sent to all managers.', indicators: [], note: 'A routine notification with no connection to the incident.', hint: 'Does this involve any account, address or tool in the rest of the evidence?' },
      { id: 'n2', source: 'Email', time: '09:05', text: 'Vendor newsletter: "Northgate Monitor 4.3 preview: new dashboards coming soon".', indicators: [], note: 'Marketing mail with no technical link to the incident.', hint: 'It mentions the product, but does it show anything the attacker did?' },
      { id: 'e3', source: 'Network', time: '09:31', stage: 'c2', text: 'Six of the 38 servers look up telemetry-northgate.example, a domain registered nine days ago.', indicators: ['telemetry-northgate.example', 'northgate-agent'], note: 'Only some servers were activated, and the domain is a lookalike of the vendor\'s real one. This is the implant calling home.', hint: 'What is the first thing a freshly installed implant does after waiting?' },
      { id: 'e4', source: 'Network', time: '09:33', stage: 'c2', text: 'The agent begins an HTTPS beacon every five minutes to 203.0.113.58, sending small encrypted messages.', indicators: ['203.0.113.58', 'northgate-agent'], note: 'Regular, small, encrypted messages to one address is the rhythm of command and control.', hint: 'Regular contact with an outside address to receive orders.' },
      { id: 'n3', source: 'Endpoint', time: '10:15', text: 'Monthly Windows updates are installed on 12 laptops.', indicators: [], note: 'Routine patching on different machines.', hint: 'Does this share an account, address or tool with the incident?' },
      { id: 'e5', source: 'Identity', time: '11:10', stage: 'lateral', text: 'The monitoring service account svc-northgate signs in to FILESRV02 and DC02, which it has never done before.', indicators: ['svc-northgate', 'FILESRV02'], note: 'A service account behaving like a person who is exploring. It has the rights to go almost anywhere.', hint: 'Using the agent\'s privileges to move to other systems.' },
      { id: 'e6', source: 'Endpoint', time: '11:25', stage: 'lateral', text: 'A credential-dumping tool is run on DC02 by the Northgate agent process.', indicators: ['northgate-agent'], note: 'Stealing more passwords from the domain controller means the attacker no longer depends on the one service account.', hint: 'Taking more credentials to widen access.' },
      { id: 'e7', source: 'Identity', time: '11:50', stage: 'lateral', text: 'The domain admin account sa-backup is used from FILESRV02 for the first time, from the same session.', indicators: ['FILESRV02'], note: 'A stolen high-privilege account in use. It gives the attacker the keys to the file shares.', hint: 'A powerful account suddenly appears, from an odd place.' },
      { id: 'n4', source: 'Network', time: '13:00', text: 'The nightly backup job sends 600 GB to the offsite backup provider (198.51.100.40, the usual address).', indicators: ['198.51.100.40'], note: 'A large transfer, but to the usual backup address and at the usual time. It looks like exfiltration but is the real backup.', hint: 'It is big and outbound. Is the destination one you already trust?' },
      { id: 'e8', source: 'Files', time: '14:05', stage: 'exfil', text: 'Compressed archives (finance-2026.7z, hr-records.7z) are created on FILESRV02 by sa-backup.', indicators: ['FILESRV02'], note: 'Gathering and packaging the data for removal.', hint: 'Preparing the data to take it away.' },
      { id: 'e9', source: 'Network', time: '14:40', stage: 'exfil', text: 'FILESRV02 sends 3.4 GB over HTTPS to 203.0.113.58.', indicators: ['203.0.113.58', 'FILESRV02'], note: 'The same address that was controlling the implant now receives the data. This is what finally triggered the alert.', hint: 'The data leaves the building.' },
    ],
    questions: [
      {
        id: 'entry', short: 'Entry point', prompt: 'How did the attacker first get code running on the servers?',
        options: [
          { id: 'supply', correct: true, text: 'Through a signed update to trusted monitoring software, after the vendor itself was compromised', explain: 'The first card is the automatic update, and the process that began the unusual activity is the monitoring agent itself.' },
          { id: 'phish', correct: false, text: 'A phishing email to a member of the finance team', explain: 'There is no suspicious email or click in the chain, and the first activity is a software update at 02:00.' },
          { id: 'vpn', correct: false, text: 'A stolen VPN login', explain: 'No VPN sign-ins feature, and the first events are on the servers themselves, not from outside.' },
          { id: 'patch', correct: false, text: 'An unpatched flaw in the file server', explain: 'Nothing is exploited. The attacker already had code running through the update.' },
        ],
      },
      {
        id: 'missed', short: 'Why it was missed', prompt: 'Why did code signing and the usual security checks not stop it?',
        options: [
          { id: 'signed', correct: true, text: 'The update really was signed by the vendor and arrived through the normal channel, so it looked trusted', explain: 'A valid signature shows who signed the package, not that nothing was added to it before signing. Trusted software with high privileges is exactly what the attacker wanted to ride.' },
          { id: 'expired', correct: false, text: 'The signing certificate had expired and nobody noticed', explain: 'The certificate was valid. That is why the update was accepted.' },
          { id: 'av', correct: false, text: 'Antivirus had been switched off on the servers', explain: 'Nothing indicates that. Security tools often treat a trusted vendor\'s agent as safe.' },
          { id: 'logs', correct: false, text: 'The attacker deleted all the logs', explain: 'The logs exist, which is how you have this evidence.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What is the best response now?',
        options: [
          { id: 'full', correct: true, text: 'Isolate the affected servers, block the domain and address, hunt for the implant on every server that took the update, reset the credentials the agent could reach, and follow the vendor\'s advisory before reconnecting', explain: 'You have to deal with the implant, the stolen accounts and the other servers that took the same update, not only the machines that were activated.' },
          { id: 'uninstall', correct: false, text: 'Uninstall the monitoring agent everywhere and carry on', explain: 'It does not remove stolen credentials, other footholds or anything the attacker already planted.' },
          { id: 'wait', correct: false, text: 'Wait for the vendor to publish a fix before doing anything', explain: 'The data is leaving now and the attacker holds domain admin access. You must act first.' },
          { id: 'one', correct: false, text: 'Reset only the svc-northgate password', explain: 'The attacker already has other credentials from the domain controller, including a domain admin account.' },
        ],
      },
    ],
    summary: 'A trusted, signed update delivered the attacker\'s code with high privileges to 38 servers. Supplier compromise is hard to prevent, so the defence is limiting what a trusted tool can reach, watching what it does, and being able to find and isolate every machine that took the bad update.',
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'role-chain',
    title: 'The role anyone could assume',
    skill: 'identity',
    blurb: 'A read-only key leaks in a build log. Within an hour it has become administrator access.',
    brief: [
      'At 11:02 an alert fires: a snapshot of the production customer database has been shared with a cloud account outside the company. Nobody on the team shared it.',
      'You have evidence from the code system, the cloud audit log, billing and identity. Place each card in the right stage of the attack and spot the noise. Tap an indicator (an account, key or role) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Exposed credential', desc: 'How the attacker got a foothold.', story: 'A build job printed its environment variables into a public build log, including the access key for a read-only account called ci-reader. Within half an hour someone was using it from a hosting provider address.' },
      { id: 'discovery', name: 'Discovery', desc: 'Working out what the key can reach.', story: 'The key could not do much directly, but it could list roles and read their policies. That was enough to find a very powerful role with a flaw.' },
      { id: 'escalate', name: 'Privilege escalation', desc: 'Turning a small key into a big one.', story: 'The deploy-admin role\'s trust policy said any identity in the account could assume it. The attacker used the read-only key to assume it and received temporary administrator credentials. When they tried to switch off the audit trail, a protection policy stopped them.' },
      { id: 'exfil', name: 'Data theft', desc: 'Taking the data.', story: 'With administrator rights, the attacker copied the production customer database to a snapshot and shared that snapshot with a cloud account they control, so they could restore a full copy of it there.' },
    ],
    cards: [
      { id: 'n1', source: 'Billing', time: '07:30', text: 'The monthly cost report is emailed to the finance team.', indicators: [], note: 'A routine report with no link to the incident.', hint: 'Does it involve any key, role or address in the rest of the evidence?' },
      { id: 'e1', source: 'CI', time: '08:50', stage: 'initial', text: 'Build log #4471 for the public repository prints environment variables, including the access key AKEY-5520 for ci-reader.', indicators: ['ci-reader', 'AKEY-5520'], note: 'A secret published in plain sight. Build logs on public repositories are read by anyone, including scanners.', hint: 'Where did the attacker get something to use?' },
      { id: 'n2', source: 'CI', time: '09:00', text: 'The dependency bot opens its nightly update pull requests.', indicators: [], note: 'Routine automation unrelated to the key.', hint: 'Is it connected to any of the accounts or keys?' },
      { id: 'e2', source: 'Cloud', time: '09:14', stage: 'initial', text: 'AKEY-5520 is used for the first time, from 203.0.113.58 (a hosting provider).', indicators: ['AKEY-5520', '203.0.113.58'], note: 'The key is now in someone else\'s hands. ci-reader normally only runs from the build system.', hint: 'The first time an outsider uses the thing that leaked.' },
      { id: 'e3', source: 'Cloud', time: '09:16', stage: 'discovery', text: 'AKEY-5520 calls ListRoles and GetRolePolicy for several roles.', indicators: ['AKEY-5520'], note: 'A read-only key still lets someone look around. They are reading how the account is built.', hint: 'The attacker already has the key. What are they learning?' },
      { id: 'e4', source: 'Cloud', time: '09:19', stage: 'discovery', text: 'The trust policy for the deploy-admin role is read with AKEY-5520.', indicators: ['AKEY-5520', 'deploy-admin'], note: 'They are checking who is allowed to take on that role. The answer is the weakness they need.', hint: 'Looking for the role that can be abused.' },
      { id: 'e5', source: 'Cloud', time: '09:24', stage: 'escalate', text: 'AKEY-5520 assumes the deploy-admin role and receives temporary administrator credentials.', indicators: ['AKEY-5520', 'deploy-admin'], note: 'The pivotal moment. The role\'s trust policy allowed any identity in the account, so a read-only key was able to become an administrator.', hint: 'A small key becomes a powerful one.' },
      { id: 'e6', source: 'Cloud', time: '09:31', stage: 'escalate', text: 'Using deploy-admin, an attempt to stop the audit trail is denied by a protection policy.', indicators: ['deploy-admin'], note: 'The attacker tried to hide their tracks. This one safeguard worked, and it is why you can see everything else.', hint: 'Trying to avoid being recorded.' },
      { id: 'n3', source: 'Cloud', time: '09:40', text: 'svc-backup creates its nightly snapshot of the staging database. It stays inside the company account.', indicators: ['svc-backup'], note: 'A routine snapshot by the usual account, and it is not shared with anyone.', hint: 'A snapshot, but is it shared and who made it?' },
      { id: 'e7', source: 'Cloud', time: '10:05', stage: 'exfil', text: 'Using deploy-admin, a snapshot of the production customer database is created.', indicators: ['deploy-admin'], note: 'A full copy of the data, ready to be moved.', hint: 'Preparing the data to take it away.' },
      { id: 'e8', source: 'Cloud', time: '10:12', stage: 'exfil', text: 'The snapshot is shared with an account outside the company (ext-acct-4455).', indicators: ['deploy-admin', 'ext-acct-4455'], note: 'The data is now available for the attacker to restore elsewhere.', hint: 'The copy goes to someone who should not have it.' },
      { id: 'e9', source: 'Alerts', time: '11:02', stage: 'exfil', text: 'Alert: a database snapshot has been shared outside the organisation.', indicators: ['ext-acct-4455'], note: 'The first time anyone noticed, nearly two hours after the key was first used.', hint: 'The detection, after the damage was done.' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What let a read-only key become full administrator access?',
        options: [
          { id: 'trust', correct: true, text: 'A powerful role whose trust policy let any identity in the account assume it', explain: 'The attacker did not break anything. The role was open to anyone in the account, so any key, however weak, could take it.' },
          { id: 'mfa', correct: false, text: 'No MFA on the read-only account', explain: 'Access keys do not use the console sign-in, and MFA on the account would not have stopped a key being used.' },
          { id: 'pw', correct: false, text: 'A weak password on the deploy-admin role', explain: 'Roles are assumed, not signed in to with a password.' },
          { id: 'public', correct: false, text: 'The repository being public', explain: 'It is how the key leaked, but not why a leaked read-only key was able to become an administrator.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of controls would have limited this most?',
        options: [
          { id: 'least', correct: true, text: 'Limit who can assume the role to named identities with conditions, give CI only the permissions it needs, and keep secrets out of logs', explain: 'Closing the open trust policy stops the escalation, narrow CI permissions limit what a leaked key can do, and masking secrets stops the leak in the first place.' },
          { id: 'hide', correct: false, text: 'Rename the roles so they are harder to guess', explain: 'Obscurity does not help: the attacker listed the roles directly.' },
          { id: 'logs', correct: false, text: 'Turn off the audit trail to reduce noise', explain: 'It would have left you blind. The audit trail is how you could reconstruct this.' },
          { id: 'region', correct: false, text: 'Block all non-UK network addresses on the account', explain: 'A hosting provider address can sit anywhere, and the key was valid from anywhere.' },
        ],
      },
      {
        id: 'cleanup', short: 'Clean-up', prompt: 'What must the response include beyond revoking AKEY-5520?',
        options: [
          { id: 'all', correct: true, text: 'End the temporary admin sessions, fix the trust policy, unshare and delete the snapshot, and work with the DPO to assess the data that was copied', explain: 'The attacker holds temporary credentials and has already copied the data, so you must end their access, close the weakness and treat this as a possible personal data breach.' },
          { id: 'only', correct: false, text: 'Nothing more: revoking the key ends the incident', explain: 'The temporary credentials and the shared snapshot still exist, and the weakness in the role is untouched.' },
          { id: 'blame', correct: false, text: 'Find out which developer printed the secrets and discipline them', explain: 'Blame does not fix the access or the data, and a good process catches mistakes before they cause harm.' },
          { id: 'wait', correct: false, text: 'Monitor and wait to see if the attacker restores the snapshot', explain: 'They already have what they need. Waiting only gives them more time.' },
        ],
      },
    ],
    summary: 'A leaked read-only key was harmless on its own. The open trust policy on an administrator role turned it into full control, and a single protection policy meant the attacker could not cover their tracks. Least privilege, narrow trust policies and secrets kept out of logs each break the chain.',
  },
];
