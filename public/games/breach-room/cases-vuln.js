// Vulnerability Management Breach Room cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges. Vulnerability ids use the
// impossible year 2099.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const VULN = [
  {
    id: 'unscanned-server',
    title: 'The server nobody scanned',
    skill: 'data',
    blurb: 'Ransomware hit the company through a flaw that was fixed everywhere except one forgotten server.',
    brief: [
      'On Saturday morning, ransomware encrypted the file servers. The company\'s vulnerability management team is certain the flaw used was fixed across the estate within a week of its disclosure: the dashboard showed 100% of scanned systems patched.',
      'You have evidence from the asset inventory, the scanner, the network, endpoint and identity tools. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a server, account or address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'Exploiting the flaw', desc: 'How the attacker got in.', story: 'The attacker found a web application server on the internet running a vulnerable version of a framework with a public exploit. It was a test server created by a project team two years earlier, and it was in nobody\'s inventory, so it had never been scanned or patched.' },
      { id: 'foothold', name: 'Foothold and credentials', desc: 'Settling in and taking passwords.', story: 'The attacker used the flaw to run commands, created a local administrator account to keep access, and found a service account password stored in a configuration file on the server.' },
      { id: 'lateral', name: 'Moving through the network', desc: 'Using stolen access to reach valuable systems.', story: 'The service account had been reused for a backup system. The attacker used it to sign in to the backup server and then to the file servers, which they could reach because the test server sat on the main network.' },
      { id: 'impact', name: 'Ransomware', desc: 'What they did with the access.', story: 'The attacker deleted the online backups, then encrypted the file servers on Saturday morning, when few staff were around.' },
    ],
    cards: [
      { id: 'e1', source: 'Network', time: '01:18', stage: 'initial', text: 'Probes from 203.0.113.58 against TEST-APP02 (198.51.100.40) on port 8443, followed by a long request that triggers an error.', indicators: ['203.0.113.58', 'TEST-APP02'], note: 'A scanner and then an exploit attempt aimed at a specific service on one server.', hint: 'Who touches the internet-facing server first, and with what?' },
      { id: 'e2', source: 'Endpoint', time: '01:22', stage: 'initial', text: 'The web service on TEST-APP02 starts a command shell, which it has never done before.', indicators: ['TEST-APP02'], note: 'A web server spawning a shell is the sign that the exploit worked.', hint: 'The exploit has succeeded: what does the server do that it should not?' },
      { id: 'e3', source: 'Identity', time: '01:40', stage: 'foothold', text: 'A new local administrator account "support2" is created on TEST-APP02.', indicators: ['TEST-APP02', 'support2'], note: 'A backdoor so the attacker does not depend on the original flaw.', hint: 'The attacker wants to keep access if the flaw is fixed.' },
      { id: 'e4', source: 'Files', time: '01:55', stage: 'foothold', text: 'The configuration file /opt/app/config.yml on TEST-APP02 is read by the new account. It contains the service account svc-backup and its password.', indicators: ['TEST-APP02', 'svc-backup'], note: 'A password sitting in plain text, ready to be taken.', hint: 'What does the attacker find that opens more doors?' },
      { id: 'n1', source: 'Inventory', time: '02:00', text: 'The monthly asset-inventory reconciliation job completes with 1,204 systems.', indicators: [], note: 'A routine job. The interesting thing is what it does not list.', hint: 'Does it involve any server in the attack?' },
      { id: 'n2', source: 'Scanner', time: '03:00', text: 'The weekly scan finishes: 100% of scanned systems patched for the framework flaw.', indicators: [], note: 'True for the systems it scanned, which is precisely the problem.', hint: 'It is about the flaw, but does it cover TEST-APP02?' },
      { id: 'e5', source: 'Identity', time: '04:12', stage: 'lateral', text: 'svc-backup signs in to BACKUP01 from TEST-APP02. It normally signs in only from the backup scheduler.', indicators: ['svc-backup', 'TEST-APP02', 'BACKUP01'], note: 'The stolen service account is used from a new place, the first step across the network.', hint: 'A stolen password is used somewhere new.' },
      { id: 'e6', source: 'Network', time: '04:40', stage: 'lateral', text: 'svc-backup connects from BACKUP01 to FILESRV01 and FILESRV02 over SMB.', indicators: ['svc-backup', 'BACKUP01', 'FILESRV01'], note: 'The backup account\'s wide reach carries the attacker to the file servers.', hint: 'Reaching the valuable systems.' },
      { id: 'n3', source: 'Endpoint', time: '05:30', text: 'Monthly operating system updates install on 12 laptops.', indicators: [], note: 'Routine patching on unrelated machines.', hint: 'Does it share a server or account with the attack?' },
      { id: 'e7', source: 'Files', time: '06:05', stage: 'impact', text: 'The online backup repository on BACKUP01 is deleted by svc-backup.', indicators: ['svc-backup', 'BACKUP01'], note: 'Removing the way back before the attack. A standard step.', hint: 'What do they destroy before they encrypt?' },
      { id: 'e8', source: 'Endpoint', time: '06:50', stage: 'impact', text: 'Mass file renames to .locked begin on FILESRV01 and FILESRV02.', indicators: ['FILESRV01'], note: 'The encryption itself.', hint: 'The result of the whole chain.' },
      { id: 'n4', source: 'Identity', time: '07:15', text: 'The quarterly access review reminder is sent to managers.', indicators: [], note: 'A routine notification with no connection to the incident.', hint: 'Does it involve any server or account from the attack?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'Why was a flaw that had been "fixed everywhere" still used successfully?',
        options: [
          { id: 'inventory', correct: true, text: 'The server was missing from the asset inventory, so it was never scanned or patched', explain: 'The scanner only covers systems in the inventory. A forgotten test server was outside the process, so the dashboard was right about what it checked and wrong about what mattered.' },
          { id: 'tool', correct: false, text: 'The patch tool failed on that server', explain: 'The server was never managed by the patch tool at all. There was no failure to find.' },
          { id: 'zero', correct: false, text: 'The attacker used a brand new flaw with no fix', explain: 'The flaw was known and a fix existed. This server just never received it.' },
          { id: 'insider', correct: false, text: 'An employee gave the attacker access', explain: 'Nothing suggests an insider. The first activity is an exploit from the internet.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which control would have caught this earliest?',
        options: [
          { id: 'discovery', correct: true, text: 'Regularly scanning the whole address range, not only the inventory, and adding what is found to the inventory', explain: 'Discovery finds systems that nobody has told you about, so they can be scanned and patched or removed.' },
          { id: 'faster', correct: false, text: 'Scanning inventory systems more often', explain: 'More frequent scans of the same list would still miss the server that is not on it.' },
          { id: 'av', correct: false, text: 'Better antivirus on the file servers', explain: 'It might slow the ransomware, but it would not close the way in.' },
          { id: 'passwords', correct: false, text: 'Longer passwords for staff', explain: 'The weakness was a stored service account password and an unpatched server, not weak staff passwords.' },
        ],
      },
      {
        id: 'metric', short: 'The metric', prompt: 'What was wrong with reporting "100% of scanned systems patched"?',
        options: [
          { id: 'scope', correct: true, text: 'It said nothing about systems that were not scanned, so it gave false comfort', explain: 'A percentage of what you look at is only as good as what you look at. It must be accompanied by how much of the estate it covers.' },
          { id: 'low', correct: false, text: 'The percentage was too low', explain: 'It was 100%, which was true of the systems it covered.' },
          { id: 'old', correct: false, text: 'Scans should be run daily', explain: 'Frequency is not the problem here. Coverage is.' },
          { id: 'tool', correct: false, text: 'It should have used a different scanner', explain: 'A different scanner would have the same blind spot if it used the same inventory.' },
        ],
      },
    ],
    summary: 'A forgotten test server turned a "patched everywhere" flaw into a ransomware attack. A vulnerability programme can only protect what it knows about, so discovery, inventory and honest coverage figures matter as much as patching.',
  },
];
