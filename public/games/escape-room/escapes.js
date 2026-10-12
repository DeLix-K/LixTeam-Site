// Cyber Escape Room content. Everything here is fictional.
//
// An escape has rooms. Each room has objects to look at (clue: true = relevant,
// false = a red herring), and one puzzle. Puzzle types:
//   choose  options: [{ id, text, correct?, explain }]
//   select  options: [{ id, text, detail, correct? }]   pick every one that applies
//   order   items: [{ id, text }], order: [ids]         put the steps in order
//   toggle  settings: [{ id, text, on, secure }]        flip settings to their safe state
//   match   items: [{ id, text, answer }], options: [{ id, text }]
// Each room gives one letter of the escape's code word (SAFE, LOCK) when solved.
// Every puzzle has hints (progressive) and an explanation shown when solved.

const RATINGS = [
  { name: 'Locked in', blurb: 'The clock beat you this time. The explanations below show how to crack each room.' },
  { min: -999, name: 'Escaped', blurb: 'You got out. Look at what cost you tries and hints, and you will go faster next time.' },
  { min: 150, name: 'Clean escape', blurb: 'Good reasoning, few wasted moves.' },
  { min: 220, name: 'Master escapist', blurb: 'First-time solutions, hidden clues found, and time to spare.' },
];

export const ESCAPES = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'vault',
    title: 'The Vault Lockdown',
    skill: 'identity',
    blurb: 'An attacker is inside the admin systems and the vault will seal in ten minutes. Four rooms, four security puzzles.',
    premise: 'You are the on-call analyst at Contoso. An attacker is guessing their way into the admin account, and the digital vault door will lock for good unless you shut them out. Work through each room: look around for clues, then solve the puzzle to unlock the next.',
    totalSeconds: 600,
    ratings: RATINGS,
    rooms: [
      {
        id: 'reception',
        title: 'Room 1: Reception',
        skill: 'identity',
        concept: 'Password security',
        fragment: 'S',
        scene: 'The reception desk is deserted. A terminal shows an attacker\'s tool running through guesses against the admin account.',
        objects: [
          { id: 'note', label: 'The sticky note under the keyboard', text: 'It reads "Contoso2026!" in marker pen. Someone has been writing passwords down.', clue: true },
          { id: 'poster', label: 'The policy poster', text: '"Minimum 12 characters. No names, dates or seasons. Use a password manager."', clue: true },
          { id: 'breach', label: 'The breach-monitor printout', text: '"Password1" appears in 4.6 million leaked passwords. "Summer2026!" follows a common season-and-year pattern that attackers try early.', clue: true },
          { id: 'plant', label: 'The plant on the desk', text: 'Slightly wilted. Nothing useful here.', clue: false },
        ],
        puzzle: {
          type: 'choose',
          prompt: 'The attacker is working through guesses. Which of these admin passwords would fall first?',
          options: [
            { id: 'pw1', text: 'Password1', correct: true, explain: '' },
            { id: 'pw2', text: 'Summer2026!', explain: 'This is predictable and would not last, but it is not as widely leaked as the very commonest passwords, so it would be tried a little later.' },
            { id: 'pw3', text: 'Blue-Kettle-Orbit-Lantern-92', explain: 'A long passphrase of random words is very hard to guess. This one is strong.' },
            { id: 'pw4', text: 'q7$Lm!2vZp#9Xr', explain: 'Random and long enough to resist guessing. Strong, though hard to remember without a password manager.' },
          ],
          hints: ['Think about the very first guesses an attacker would try.', 'Attackers start with lists of passwords leaked in earlier breaches.', 'One of these is among the most commonly leaked passwords of all time.'],
          explain: 'Attackers begin with the most common passwords from past breaches, so "Password1" goes first. Long, random or passphrase-style passwords, kept in a password manager, are far harder to guess than short clever ones or seasonal patterns.',
        },
      },
      {
        id: 'closet',
        title: 'Room 2: The Server Closet',
        skill: 'identity',
        concept: 'MFA prompts',
        fragment: 'A',
        scene: 'Cold air and blinking lights. Your phone buzzes on the shelf. You are not logging in to anything.',
        objects: [
          { id: 'history', label: 'Your phone\'s notification history', text: 'Five similar sign-in prompts in the last ten minutes. You denied them all.', clue: true },
          { id: 'laptop', label: 'The admin laptop on the rack', text: 'Locked, with no sign-in in progress. Nobody on site is trying to log in.', clue: true },
          { id: 'prompt', label: 'Look closely at the prompt', text: 'It shows only Approve and Deny. There is no number to match and no detail about which device is signing in.', clue: true },
          { id: 'board', label: 'The visitor badge board', text: 'A few spare badges. Nothing to do with the prompt.', clue: false },
        ],
        puzzle: {
          type: 'choose',
          prompt: 'Your phone shows: "Approve sign-in? Contoso VPN, Manchester, 03:12." You did not start a sign-in. What do you do?',
          options: [
            { id: 'a', text: 'Approve it so the prompts stop', explain: 'Approving gives the attacker a live session. This is exactly what prompt-bombing is designed to get.' },
            { id: 'b', text: 'Deny it and report it to Security', correct: true, explain: '' },
            { id: 'c', text: 'Deny it and carry on', explain: 'Denying is right, but repeated prompts mean someone has the password. Without a report, nobody can reset it or watch for the attacker.' },
            { id: 'd', text: 'Approve it, then change your password', explain: 'The attacker already has a session once you approve, and changing the password does not end it.' },
          ],
          hints: ['You did not start this sign-in.', 'Repeated prompts mean someone already knows the password.', 'Deny it, and make sure someone who can reset the account knows.'],
          explain: 'Repeated prompts you did not trigger mean an attacker has your password and is hoping you will tap Approve out of frustration (MFA fatigue). Deny, and report it so the password can be reset and sessions revoked. Number matching makes this attack much harder.',
        },
      },
      {
        id: 'archive',
        title: 'Room 3: The Archive',
        skill: 'data',
        concept: 'Data exposure and permissions',
        fragment: 'F',
        scene: 'Rows of screens show the company file store. Something here is visible to people who should never see it.',
        objects: [
          { id: 'log', label: 'The access log', text: '"Customer_Export_2026.xlsx" was downloaded 38 times by unknown external addresses this week.', clue: true },
          { id: 'sign', label: 'The sign above the door', text: '"Public share: marketing images and the staff lunch menu only."', clue: true },
          { id: 'cabinet', label: 'The locked stationery cabinet', text: 'Pens, paper and a stapler. Nothing to do with the files.', clue: false },
        ],
        puzzle: {
          type: 'select',
          prompt: 'Which files are shared more widely than they should be? Select every one.',
          options: [
            { id: 'customer', text: 'Customer_Export_2026.xlsx', detail: 'Anyone with the link can view', correct: true },
            { id: 'salaries', text: 'HR_Salaries.xlsx', detail: 'Everyone in the company can view', correct: true },
            { id: 'keys', text: 'Backup_Keys.txt', detail: 'Public on the internet', correct: true },
            { id: 'menu', text: 'Team_Lunch_Menu.pdf', detail: 'Anyone with the link can view' },
            { id: 'board', text: 'Board_Minutes_Q3.docx', detail: 'Board members only' },
          ],
          hints: ['Think about how sensitive each file is, and who can see it.', 'A lunch menu can be public. Customer data and keys cannot.', 'Three files are wrongly exposed, and one of them is only "too broad" inside the company.'],
          explain: 'Sensitive files should be shared with the fewest people who need them. Customer data and backup keys must never be public. Salaries are not for everyone in the company either. The lunch menu is harmless to share and the board minutes are correctly restricted.',
        },
      },
      {
        id: 'control',
        title: 'Room 4: The Control Room',
        skill: 'data',
        concept: 'Recovery procedure',
        fragment: 'E',
        scene: 'The last door. A console waits for the recovery procedure before it will open the vault.',
        objects: [
          { id: 'runbook', label: 'The incident runbook', text: '"Contain first. Preserve evidence before you change or wipe anything. Then clean up and recover."', clue: true },
          { id: 'backup', label: 'The backup schedule', text: 'Last known-clean backup: Tuesday 02:00, before the intrusion on Wednesday.', clue: true },
          { id: 'coffee', label: 'The cold mug of coffee', text: 'Stone cold. Whoever was here left in a hurry.', clue: false },
        ],
        puzzle: {
          type: 'order',
          prompt: 'Put the recovery steps in the right order.',
          items: [
            { id: 'report', text: 'Report the incident and record the lessons learned' },
            { id: 'restore', text: 'Restore from a known-clean backup' },
            { id: 'isolate', text: 'Isolate the affected accounts and systems' },
            { id: 'monitor', text: 'Verify everything and monitor for the attacker returning' },
            { id: 'reset', text: 'Reset credentials and revoke sessions' },
            { id: 'evidence', text: 'Preserve the logs and evidence' },
          ],
          order: ['isolate', 'evidence', 'reset', 'restore', 'monitor', 'report'],
          hints: ['Stop the spread before you do anything else.', 'Keep a copy of the evidence before you change or wipe things.', 'Clean up access first, then restore, then check it held, and finally write it up.'],
          explain: 'Contain (isolate), preserve evidence, eradicate (reset credentials and sessions), recover (restore from a clean backup), verify and monitor, then report and learn. Wiping or restoring before preserving evidence loses the trail that shows what the attacker did.',
        },
      },
    ],
    finale: 'The vault door unseals with a heavy clunk. The attacker is locked out, the account is safe, and the exposed files are fixed.',
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'office',
    title: 'Smart Office Lockdown',
    skill: 'iot',
    blurb: 'The smart office has been probed overnight. Fix the devices, the permissions and the network before the morning shift arrives.',
    premise: 'It is 05:40 at Contoso. Overnight, someone has been probing the smart office: cameras, plugs and the network. You have ten minutes before the morning shift arrives. Work through each room, find the clues, and fix what is wrong.',
    totalSeconds: 600,
    ratings: RATINGS,
    rooms: [
      {
        id: 'cameras',
        title: 'Room 1: The Camera Cabinet',
        skill: 'iot',
        concept: 'Secure configuration',
        fragment: 'L',
        scene: 'A cabinet of cameras with an admin panel open on a tablet. Several settings look wrong.',
        objects: [
          { id: 'manual', label: 'The setup leaflet', text: 'It says the camera "works out of the box" and the admin password can be changed "later".', clue: true },
          { id: 'scan', label: 'The scan report', text: 'This camera is reachable from the internet, and automatic port forwarding (UPnP) opened it up without anyone choosing to.', clue: true },
          { id: 'sticker', label: 'The sticker on the back', text: 'Model number and a serial number. Nothing sensitive.', clue: false },
        ],
        puzzle: {
          type: 'toggle',
          prompt: 'Flip each setting to its safe state. Leave harmless settings alone.',
          settings: [
            { id: 'remote', text: 'Remote access from the internet', on: true, secure: false },
            { id: 'pw', text: 'Unique admin password set', on: false, secure: true },
            { id: 'updates', text: 'Automatic firmware updates', on: false, secure: true },
            { id: 'upnp', text: 'UPnP (automatic port forwarding)', on: true, secure: false },
            { id: 'motion', text: 'Motion alerts', on: true, secure: true },
            { id: 'night', text: 'Night vision', on: true, secure: true },
          ],
          hints: ['Some settings expose the device, and some protect it.', 'Remote access and automatic port forwarding open doors you did not choose.', 'Motion alerts and night vision are features, not risks.'],
          explain: 'Turn off internet-facing access and UPnP unless you really need them, set a unique admin password, and keep firmware updating automatically. Harmless features like motion alerts and night vision can stay as they are.',
        },
      },
      {
        id: 'permissions',
        title: 'Room 2: The Server Room',
        skill: 'data',
        concept: 'Least privilege',
        fragment: 'O',
        scene: 'A permissions console lists four people who need access. Give each person only what they need, and no more.',
        objects: [
          { id: 'policy', label: 'The access policy on the wall', text: '"People get the least access needed to do their job. Contractors get time-limited access."', clue: true },
          { id: 'audit', label: 'The audit printout', text: 'Last quarter, three interns had full administrator rights "to save time".', clue: true },
          { id: 'fan', label: 'The cooling fan', text: 'Loud, but fine.', clue: false },
        ],
        puzzle: {
          type: 'match',
          prompt: 'Assign the right role to each person.',
          items: [
            { id: 'intern', text: 'Intern: needs to read the weekly reports', answer: 'viewer' },
            { id: 'accountant', text: 'Accountant: edits invoices, in the Finance folder only', answer: 'editor' },
            { id: 'admin', text: 'IT administrator: manages all systems', answer: 'admin' },
            { id: 'contractor', text: 'Contractor: needs two days of access to one folder', answer: 'temp' },
          ],
          options: [
            { id: 'viewer', text: 'Viewer (read only)' },
            { id: 'editor', text: 'Editor (Finance folder only)' },
            { id: 'admin', text: 'Administrator' },
            { id: 'temp', text: 'Temporary viewer (expires in two days)' },
          ],
          hints: ['Give each person the smallest role that lets them do their job.', 'Only one person needs to manage everything.', 'The contractor\'s access should end by itself.'],
          explain: 'Least privilege means each person gets only the access they need. The intern reads, the accountant edits one folder, the contractor\'s access expires on its own, and only the IT administrator has full rights.',
        },
      },
      {
        id: 'network',
        title: 'Room 3: The Network Closet',
        skill: 'iot',
        concept: 'Unknown devices',
        fragment: 'C',
        scene: 'The router\'s connected-devices list is open. Two entries do not look right.',
        objects: [
          { id: 'inventory', label: 'The asset inventory', text: 'It lists the printer, the lobby TV and employee phones. It does not list anything called ESP_8F3A21 or RASPBERRYPI.', clue: true },
          { id: 'log', label: 'The router log', text: 'RASPBERRYPI joined at 02:14 last night and has been sending data out ever since.', clue: true },
          { id: 'cable', label: 'A spare network cable', text: 'Just a cable.', clue: false },
        ],
        puzzle: {
          type: 'select',
          prompt: 'Which connected devices should you investigate or block? Select every one.',
          options: [
            { id: 'printer', text: 'HP-Printer-3F', detail: 'Known: office printer' },
            { id: 'esp', text: 'ESP_8F3A21', detail: 'Unknown: online for three days', correct: true },
            { id: 'phone', text: 'Josh-iPhone', detail: 'Known: employee phone' },
            { id: 'tv', text: 'SmartTV-Lobby', detail: 'Known: facilities' },
            { id: 'pi', text: 'RASPBERRYPI', detail: 'Unknown: connected at 02:14 last night', correct: true },
          ],
          hints: ['Compare the list with the asset inventory.', 'Anything you cannot account for deserves a closer look.', 'Two devices are not in the inventory.'],
          explain: 'You should know what is on your network. Devices you cannot account for might be a gadget someone added or an intruder\'s foothold. Check with the owner, and block anything unknown while you investigate.',
        },
      },
      {
        id: 'exit',
        title: 'Room 4: The Exit',
        skill: 'iot',
        concept: 'Network segmentation',
        fragment: 'K',
        scene: 'The final door. The audit report is on the console: the smart plugs, cameras and finance laptops all share one network.',
        objects: [
          { id: 'report', label: 'The audit report', text: '"A compromised smart plug on this network could reach the finance laptops directly."', clue: true },
          { id: 'diagram', label: 'The network diagram', text: 'A single flat network. Everything can talk to everything.', clue: true },
          { id: 'poster', label: 'A motivational poster', text: '"Teamwork makes the dream work." Unrelated to the network.', clue: false },
        ],
        puzzle: {
          type: 'choose',
          prompt: 'What is the best fix for the shared network?',
          options: [
            { id: 'a', text: 'Put the smart devices on a separate network from the finance laptops', correct: true, explain: '' },
            { id: 'b', text: 'Change the Wi-Fi password and leave the layout alone', explain: 'A new password does not change the problem: a compromised gadget can still reach your important machines.' },
            { id: 'c', text: 'Remove every smart device from the office', explain: 'It would work but is far out of proportion. Segmentation gives you the same protection and you keep the devices.' },
            { id: 'd', text: 'Hide the Wi-Fi network name', explain: 'Hiding the name is trivial to get around and does nothing about what devices can reach each other.' },
          ],
          hints: ['The problem is that everything can reach everything.', 'Gadgets rarely need to talk to the finance laptops.', 'Separate the risky devices from the important ones.'],
          explain: 'Segmentation puts connected gadgets on their own network, so a compromised plug or camera cannot reach the finance laptops. It protects the important systems without giving up the devices.',
        },
      },
    ],
    finale: 'The last door clicks open. The cameras are locked down, access is least-privilege, the intruder\'s devices are blocked, and the gadgets can no longer reach finance.',
  },
];
