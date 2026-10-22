// Incident Response and Forensics senior-tier Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges. The case is about a gap in the evidence and how
// to say what it does and does not mean; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const DFIR_LEAD = [
  {
    id: 'missing-hour',
    title: 'The hour the logs forgot',
    skill: 'correlation',
    blurb: 'The one hour of the night that matters is missing from every log. The director says "somebody wiped them". Work out what the gap does and does not show before it goes into a report.',
    brief: [
      'Contoso is investigating a suspicious sign-in to the finance system at about 02:30 on Wednesday. When the incident lead pulls the central logs, there is nothing at all between 01:58 and 03:02. The finance director says: "They have covered their tracks. Put that in the report."',
      'You have the log summary to start with, and deeper evidence as you find the right clues. Work out why the hour is empty, flag the lines that matter and decide the right first move. A claim that logs were deleted is serious, and must be shown.',
    ],
    ratings: RATINGS,
    clues: {
      allsources: { strength: 'strong', text: 'The gap begins and ends at the same minute for every kind of log reaching the central server: firewall, directory, email and servers.' },
      diskfull: { strength: 'strong', text: 'The central log server\'s disk reached 100% at 01:58, and the log collector stopped accepting entries until space was freed at 03:02.' },
      noedit: { strength: 'strong', text: 'The log server\'s own audit trail shows no delete or clear commands, and the stored files are continuous before and after the gap.' },
      elsewhere: { strength: 'strong', text: 'The VPN appliance, the finance system and the laptops all kept their own local logs for the hour, and those can be collected.' },
      timing: { strength: 'weak', text: 'The gap covers the time of the suspicious sign-in.' },
    },
    artefacts: [
      {
        id: 'gap', title: 'The log summary',
        blurb: 'What the central log server shows for the night.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'allsources', text: 'Central log counts per minute, Wednesday: 01:57 about 4,100 entries from 38 sources. 01:58 to 03:01: zero entries from all sources. 03:02: about 4,200 entries, all sources return.', note: 'Everything vanished at once and returned at once. A targeted deletion would not look like this; a collection failure does.' },
          { id: 'a2', type: 'herring', text: 'The suspicious sign-in was to the finance system at 02:31', note: 'It is the reason the hour matters. It does not explain the gap.' },
          { id: 'a3', type: 'herring', text: 'The finance director has said "somebody wiped them" twice', note: 'Confidence is not evidence.' },
          { id: 'a4', type: 'plain', text: 'The finance system\'s own application records are not part of the central logs', note: 'Another place to look.' },
          { id: 'a5', type: 'plain', text: 'The central log server holds 14 months of logs and is checked once a week', note: 'Context for how a full disk could go unnoticed.' },
        ],
      },
      {
        id: 'server', title: 'The central log server',
        blurb: 'What the server itself says about the gap.',
        unlockedBy: 'allsources',
        lines: [
          { id: 'b1', type: 'clue', clue: 'diskfull', text: 'Server record: "01:58 /var/logs 100% full. Collector paused: no space. 03:02 old archives compressed by an automatic job: 12% free. Collector resumed."', note: 'An ordinary operational fault: the collector had nowhere to write, then resumed when space was freed.' },
          { id: 'b2', type: 'clue', clue: 'noedit', text: 'Server audit trail, 00:00 to 06:00: no delete, truncate or clear commands by any user. Files before and after the gap are intact and their hashes match the daily record.', note: 'Nothing was removed. The hour was never written. This matters because the director\'s claim is that someone erased it.' },
          { id: 'b3', type: 'herring', text: 'Two administrators had signed in to the log server that evening, before 20:00', note: 'Ordinary maintenance that finished hours earlier.' },
          { id: 'b4', type: 'herring', text: 'The disk alert email went to a mailbox nobody reads', note: 'Explains why nobody noticed, not why it happened.' },
          { id: 'b5', type: 'plain', text: 'The log disk was last resized three years ago', note: 'Context: it was not sized for the growth since.' },
        ],
      },
      {
        id: 'local', title: 'Where else the hour was recorded',
        blurb: 'Sources that keep their own records.',
        unlockedBy: 'diskfull',
        lines: [
          { id: 'c1', type: 'clue', clue: 'elsewhere', text: 'Local logs: VPN appliance (02:00 to 03:00 present), finance application database (present), the finance clerk\'s laptop event log (present). Retention on each: 30 days.', note: 'The hour is not lost. It can be rebuilt from the sources that kept their own copies, if they are collected before they expire.' },
          { id: 'c2', type: 'clue', clue: 'timing', text: 'The gap covers 02:31, the time of the suspicious sign-in', note: 'Interesting and not proof. A gap that covers an event is an unlucky coincidence until something shows it is not.' },
          { id: 'c3', type: 'herring', text: 'The directory server also lost its forwarded logs for the hour', note: 'It forwards to the same full collector, so it fits the same simple explanation.' },
          { id: 'c4', type: 'herring', text: 'Backups of the central log server run at 01:00', note: 'They finished before the gap.' },
          { id: 'c5', type: 'plain', text: 'Local retention on the laptop log is 30 days', note: 'A deadline for collecting it.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'diskfull', correct: true, text: 'The hour is missing because the central log server\'s disk filled and the collector stopped, which is an ordinary fault; nothing shows anyone deleted logs, and the hour can be rebuilt from local logs', explain: 'The gap hits every source at once, the disk record explains it, the audit trail shows no deletion and local copies exist.' },
        { id: 'wiped', correct: false, text: 'The attacker deleted the logs to cover their tracks', explain: 'Nothing shows that. The server\'s audit trail records no deletion and the pattern is a collection failure.' },
        { id: 'insider', correct: false, text: 'An administrator turned the logging off on purpose', explain: 'There is no evidence of anyone changing the collector, and the disk record explains the stop.' },
        { id: 'attackbug', correct: false, text: 'A fault in the finance system caused the gap', explain: 'The gap covers every source, not only the finance system.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'rebuild', correct: true, text: 'Collect the local logs from the VPN, the finance system and the laptop before they expire, record the gap and its cause honestly in the report without claiming deletion, and fix the log server\'s space and its alerting', explain: 'Rebuilds the missing evidence from other sources, keeps the report to what is shown, and closes the weakness.' },
        { id: 'accuse', correct: false, text: 'Report that logs were deliberately deleted and open a disciplinary case', explain: 'Unsupported, and it could wrongly accuse someone.' },
        { id: 'ignore', correct: false, text: 'Treat the gap as unimportant and rely on what the central logs do show', explain: 'The hour that matters is the hour missing, and the other sources should be collected.' },
        { id: 'wait', correct: false, text: 'Wait until the log server is repaired before collecting anything', explain: 'The local logs expire in 30 days and are the way to fill the gap.' },
      ],
    },
    story: [
      'The central log server\'s disk has been too small for years. At 01:58 on Wednesday it filled, and the collector stopped writing.',
      'An automatic job freed space at 03:02 and the collector resumed. The hour between was never written, for every source at once.',
      'The server\'s audit trail shows no deletion, and the VPN, the finance system and a laptop kept their own copies of the hour.',
      'The lesson is that a gap is a fact to be explained, not a confession. Say what it shows, rebuild what you can and never claim more than the evidence supports.',
    ],
  },
];
