// OT/IoT Security senior-tier Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// The case is about a plant trip that looked like an attack and was not, and how to say so; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const OT_LEAD = [
  {
    id: 'phantom-trip',
    title: 'The trip that looked like an attack',
    skill: 'correlation',
    blurb: 'A pump station stopped at 11:42 and the plant monitor called it an unauthorised command. Work out what really happened before anyone tells the regulator that the plant was attacked.',
    brief: [
      'At 11:42 on Tuesday, the pump station at Contoso Water tripped and stopped pumping. The plant\'s monitoring raised an alert: "Unauthorised stop command to the pump controller from the control network." The operations manager has asked whether the plant is under attack, and the director wants to tell the regulator.',
      'You have the alert and the operator\'s log to start with, and deeper evidence as you find the right clues. Work out what really stopped the pump, flag the lines that matter and decide the right first move. The pumps have been restarted and supply is normal.',
    ],
    ratings: RATINGS,
    clues: {
      comms: { strength: 'strong', text: 'The pump controller\'s own log says it lost communication with the SCADA server at 11:41:50, and tripped to its safe state 30 seconds later, as designed.' },
      change: { strength: 'strong', text: 'The plant firewall\'s change log shows a rule change committed at 11:40 by an IT administrator, with no maintenance window or change ticket.' },
      nocommand: { strength: 'strong', text: 'The controller\'s command log shows no stop or write command from any source in the hour before the trip.' },
      designed: { strength: 'strong', text: 'The controller is configured to stop the pumps if it loses its control link for 30 seconds, as a safety measure.' },
      timing: { strength: 'weak', text: 'The trip happened two minutes after the firewall change.' },
    },
    artefacts: [
      {
        id: 'alert', title: 'The alert and the operator\'s log',
        blurb: 'What was reported at the time.',
        lines: [
          { id: 'a1', type: 'plain', text: 'Monitor alert 11:42: "Possible unauthorised stop command to PLC-PUMP-2 from the control network. Pump station stopped."', note: 'The monitor\'s interpretation. The monitor sees a stop, not who asked for it.' },
          { id: 'a2', type: 'clue', clue: 'designed', text: 'Operator log, 11:44: "Pump station 2 tripped. Restarted from the SCADA screen at 11:52. Normal flow by 11:58. Note: the controller does this if it loses contact with SCADA for 30 seconds."', note: 'The operator already knows this is how the controller is set to behave. It is a fail-safe, not a fault.' },
          { id: 'a3', type: 'herring', text: 'The alert was marked "high" by the monitor', note: 'The severity is a guess.' },
          { id: 'a4', type: 'herring', text: 'A news story that morning reported an attack on a water utility in another country', note: 'A coincidence in the news, with no link to this plant.' },
          { id: 'a5', type: 'plain', text: 'The pump station supplies about a third of customers; supply was down for 14 minutes', note: 'The effect.' },
        ],
      },
      {
        id: 'controller', title: 'The controller and the network',
        blurb: 'What the controller and the firewall recorded.',
        unlockedBy: 'designed',
        lines: [
          { id: 'b1', type: 'clue', clue: 'comms', text: 'PLC-PUMP-2 event log: "11:41:50 Communication with master lost. 11:42:20 Watchdog timeout: pumps stopped (safe state). 11:52:03 Restart command from master."', note: 'The controller stopped itself because it lost its link, exactly as designed. The only commands are the restart.' },
          { id: 'b2', type: 'clue', clue: 'nocommand', text: 'PLC-PUMP-2 command log, 10:42 to 11:42: "Write commands: 0. Stop commands: 0. Reads: 7,140 (normal polling)."', note: 'Nobody sent a stop command. The monitor\'s wording was a misreading of a trip.' },
          { id: 'b3', type: 'herring', text: 'The controller\'s firmware is 15 years old', note: 'A risk in general, and not an explanation here.' },
          { id: 'b4', type: 'herring', text: 'The SCADA server had been restarted on Sunday', note: 'Unrelated.' },
          { id: 'b5', type: 'plain', text: 'The watchdog setting was chosen in the plant\'s safety review', note: 'It is a deliberate design choice.' },
        ],
      },
      {
        id: 'firewall', title: 'The plant firewall\'s change log',
        blurb: 'What changed on the network at the time.',
        unlockedBy: 'comms',
        lines: [
          { id: 'c1', type: 'clue', clue: 'change', text: 'Firewall change log: "11:40:12 rule 47 modified by it.admin3. Comment: tidy up old rules. Window or ticket: none. 11:41:48 active sessions reset by policy reload."', note: 'An unplanned change reset the connection between SCADA and the controller. It had no window and no ticket.' },
          { id: 'c2', type: 'clue', clue: 'timing', text: 'The trip happened at 11:42:20, about two minutes after the rule was changed', note: 'Suggestive and not proof alone. With the controller\'s own log it becomes the explanation.' },
          { id: 'c3', type: 'herring', text: 'The administrator who made the change has been with the company for 11 years', note: 'Long service does not make a change safe, nor guilty.' },
          { id: 'c4', type: 'herring', text: 'Rule 47 was last used in 2021', note: 'The administrator thought it was unused. It was used for the link between SCADA and the controller.' },
          { id: 'c5', type: 'plain', text: 'IT is allowed to change office firewalls without a window, but not the plant firewall', note: 'The rule that was not followed.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'change', correct: true, text: 'An unplanned firewall change, made without a window or ticket, reset the link between SCADA and the pump controller, and the controller stopped the pumps as designed; no stop command was sent and there is no sign of an attack', explain: 'The controller\'s log, the firewall change, the empty command log and the designed fail-safe together explain the trip with no attacker.' },
        { id: 'attack', correct: false, text: 'An attacker sent a stop command to the pump controller', explain: 'The command log shows no stop or write command.' },
        { id: 'fault', correct: false, text: 'The pump controller is faulty and tripped on its own', explain: 'It did what it was configured to do when it lost contact.' },
        { id: 'operator', correct: false, text: 'An operator stopped the pumps by mistake', explain: 'The operator restarted them and the controller\'s log shows no stop command.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'control', correct: true, text: 'Tell the operations manager and the director that it was an unplanned change and not an attack, leave the fail-safe exactly as it is, bring every change to the plant firewall under change control with a window, rehearsal and a named owner, and change the monitor\'s wording so it does not call a trip an attack', explain: 'Reports the truth, protects the safety feature and fixes the cause and the alert.' },
        { id: 'regulator', correct: false, text: 'Tell the regulator the plant was attacked and shut down the control network', explain: 'Unsupported, and a false report and a shutdown would do more harm.' },
        { id: 'disable', correct: false, text: 'Turn off the 30-second fail-safe so the pumps do not trip again', explain: 'The fail-safe is a safety measure. Removing it removes protection.' },
        { id: 'blame', correct: false, text: 'Discipline the IT administrator and move on', explain: 'The cause was a process that allowed the change, not just one person.' },
      ],
    },
    story: [
      'At 11:40 an IT administrator tidied up what looked like an old firewall rule in the plant firewall, with no window and no ticket.',
      'The policy reload reset the connection between the SCADA server and the pump controller. The controller lost contact for 30 seconds, and its safety setting stopped the pumps.',
      'The plant monitor saw a stop and called it an unauthorised command. The controller\'s own logs show no command at all.',
      'The lesson is that a trip is a fact to be explained, not an attack to be announced. Change control protects the plant from well-meaning changes, and the fail-safe worked.',
    ],
  },
];
