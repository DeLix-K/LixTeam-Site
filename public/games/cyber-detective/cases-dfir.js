// Incident Response and Forensics Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const DFIR = [
  {
    id: 'clock-skew',
    title: 'Times that do not agree',
    skill: 'correlation',
    blurb: 'Three systems each recorded the same attack, but their timelines disagree about what came first. Put them in the true order before the report goes to the board.',
    brief: [
      'A draft incident report says an alert fired four minutes before data left the network, "so the response was fast". Another analyst thinks the alert came after the data had gone. The logs come from three systems, and the times do not match.',
      'You have the log extracts to start with, and deeper records as you find the right clues. Work out the true order of events, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      naive: { strength: 'strong', text: 'The draft report lines up the three logs by their printed times, without checking each system\'s time zone or clock.' },
      zone: { strength: 'strong', text: 'The firewall log is in UTC, and the endpoint and alert logs are in local time, which was one hour ahead (summer time) on that day.' },
      drift: { strength: 'strong', text: 'The web proxy\'s clock was 11 minutes ahead of the true time, according to a time check at the start of the investigation.' },
      order: { strength: 'strong', text: 'Once all three are corrected, the data began leaving the network at 14:02 and the alert fired at 14:09, seven minutes later, not four minutes before.' },
      sync: { strength: 'strong', text: 'The proxy is the only one of the three that does not take its time from the company time server.' },
      size: { strength: 'weak', text: 'The alert log has 14,000 entries for the day.' },
    },
    artefacts: [
      {
        id: 'draft', title: 'The draft timeline',
        blurb: 'How the three logs were first combined.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'naive', text: 'Draft report: "Alert (14:09 local) fired 4 minutes before the upload began (14:13 per proxy). Response was prompt."', note: 'The report lines up the times as written. The three clocks do not use the same reference, so the claim cannot be trusted.' },
          { id: 'a2', type: 'herring', text: 'The report has been reviewed by two managers and signed off', note: 'A sign-off does not correct a timing error.' },
          { id: 'a3', type: 'herring', text: 'The incident is classified as "medium"', note: 'A classification, not evidence.' },
          { id: 'a4', type: 'plain', text: 'Three sources: firewall, web proxy, alert system', note: 'Each has its own clock.' },
        ],
      },
      {
        id: 'clocks', title: 'How each system keeps time',
        blurb: 'What time zone and clock accuracy each log uses.',
        unlockedBy: 'naive',
        lines: [
          { id: 'b1', type: 'clue', clue: 'zone', text: 'Firewall log header: "timestamps in UTC". Alert system and endpoint log header: "timestamps in Europe/London". Date of incident: 14 June', note: 'On 14 June, London is one hour ahead of UTC. The alert at 14:09 local is 13:09 UTC. Mixing them without converting shifts events by an hour.' },
          { id: 'b2', type: 'clue', clue: 'drift', text: 'Time check at 16:30 (investigator\'s watch against each system): firewall 0 seconds, alert system +2 seconds, proxy +11 minutes', note: 'The proxy\'s clock is 11 minutes ahead, so every proxy entry is too late by 11 minutes and has to be corrected.' },
          { id: 'b3', type: 'clue', clue: 'sync', text: 'Configuration: firewall and alert system use ntp.contoso.example. Proxy: "manual time", last set 9 months ago', note: 'The proxy\'s time was set by hand, which is why it has drifted. This is why the clocks should be linked to one source.' },
          { id: 'b4', type: 'herring', text: 'The proxy is the newest of the three systems', note: 'Irrelevant to its time accuracy.' },
          { id: 'b5', type: 'plain', text: 'The firewall is located in the main data centre', note: 'Context.' },
        ],
      },
      {
        id: 'true', title: 'The corrected timeline',
        blurb: 'What the events look like in one agreed time.',
        unlockedBy: 'zone',
        lines: [
          { id: 'c1', type: 'clue', clue: 'order', text: 'Corrected to London time: upload began 14:02 (proxy 14:13 minus its 11-minute drift); alert fired 14:09; upload ended 14:19 (firewall 13:19 UTC plus one hour)', note: 'The upload began seven minutes before the alert, not four minutes after it. The response was slower than the draft claimed, and data kept leaving for 17 minutes.' },
          { id: 'c2', type: 'clue', clue: 'size', text: 'Alert system volume that day: 14,000 entries', note: 'A reason the alert might not have been seen quickly. It does not change the order of events.' },
          { id: 'c3', type: 'herring', text: 'The upload went to a common cloud storage provider', note: 'A detail with no bearing on the order.' },
          { id: 'c4', type: 'herring', text: 'Three staff members worked on the draft', note: 'No bearing.' },
          { id: 'c5', type: 'plain', text: 'Data moved: 1.4 GB over 17 minutes', note: 'The size of the incident.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'skew', correct: true, text: 'The three logs use different time zones and one clock has drifted, so combining them without correction put the alert before the upload when it really came after', explain: 'The UTC versus local difference and the proxy\'s 11-minute drift explain why the order was wrong.' },
        { id: 'tamper', correct: false, text: 'An attacker altered the logs to hide the upload', explain: 'There is no sign of tampering. The timing errors are explained by ordinary clock differences.' },
        { id: 'slow', correct: false, text: 'The alert system was slow to produce the alert', explain: 'Its own clock was accurate to two seconds. The error is in the combination of the logs.' },
        { id: 'fine', correct: false, text: 'The draft is right and the second analyst is wrong', explain: 'The corrected timeline shows the opposite order.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'correct', correct: true, text: 'Convert every log to one reference time, apply the proxy correction, rebuild the timeline, tell the report\'s readers the response was slower than stated, and fix the proxy so all systems use the company time source', explain: 'Correct the record honestly, and remove the cause of the error so it cannot recur.' },
        { id: 'leave', correct: false, text: 'Leave the report as it is because the difference is only minutes', explain: 'The difference changes the conclusion about the response.' },
        { id: 'blame', correct: false, text: 'Ask the analyst who wrote it to redo the report', explain: 'The error is in the systems as much as the author.' },
        { id: 'ignore', correct: false, text: 'Stop using the proxy logs', explain: 'They are useful once corrected.' },
      ],
    },
    story: [
      'An analyst builds a timeline from three logs and reads the times as if they were all the same kind.',
      'The firewall is in UTC, the others in London time, and the proxy\'s clock is 11 minutes fast because it was set by hand nine months ago.',
      'Corrected, the upload began before the alert, not after it. A reassuring report becomes a more honest and less comfortable one.',
      'The lesson is to agree one time reference first, check each clock, and say what you corrected.',
    ],
  },
];
