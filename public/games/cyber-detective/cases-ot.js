// OT/IoT Security Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. The case is about finding what is on a plant
// network and judging it without overclaiming; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const OT = [
  {
    id: 'forgotten-device',
    title: 'The device nobody remembered',
    skill: 'correlation',
    blurb: 'At 03:20 the plant\'s passive monitor sees a device at a remote pumping station talking to an address abroad. Nobody can say what it is. Work out what it is, how worried to be and what to do first without stopping the pumps.',
    brief: [
      'Contoso Water has just switched on passive monitoring of its plant network. At 03:20 on a Tuesday it raises its first alert: a device at remote Pumping Station 4 has made a connection to an address outside the country. The device is not in the asset list, and the night operator does not recognise it.',
      'You have the alert and the asset list to start with, and deeper evidence as you find the right clues. Work out what the device is, whether anything has been done through it, flag the lines that matter and decide the right first move. The pumps must keep running.',
    ],
    ratings: RATINGS,
    clues: {
      unknown: { strength: 'strong', text: 'The device is not in the asset list, and the operations team does not recognise it.' },
      cellular: { strength: 'strong', text: 'It is a cellular router with its own public address, installed by a contractor three years ago for pump telemetry.' },
      default: { strength: 'strong', text: 'Its admin page is reachable from the internet and still accepts the manufacturer\'s default login.' },
      linked: { strength: 'strong', text: 'It is plugged into the same small network as the pump controller and the local control panel.' },
      nocommands: { strength: 'strong', text: 'The traffic shows only a routine check-in with the router maker\'s cloud service and the pump\'s readings going out. No commands have reached the controller from outside.' },
      timing: { strength: 'weak', text: 'The connection happened at 03:20.' },
    },
    artefacts: [
      {
        id: 'alert', title: 'The alert and the asset list',
        blurb: 'What the monitor saw, and what the records say should be there.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'unknown', text: 'Monitor alert 03:20: "New device 192.0.2.44 on the Pumping Station 4 network, first seen 02:58. Connected to 198.51.100.77 (outside the country) on port 443. Device type: unknown."', note: 'A device the plant did not know it had. Finding it is the first job, and it does not yet say anything about harm.' },
          { id: 'a2', type: 'plain', text: 'Asset list, Pumping Station 4: pump controller, local control panel, one network switch. Three devices.', note: 'The record the monitor is comparing against.' },
          { id: 'a3', type: 'herring', text: 'Pumping Station 4 is the furthest from the main plant', note: 'Distance has no bearing on risk.' },
          { id: 'a4', type: 'herring', text: 'The alert was raised during the night shift, when only one operator is on duty', note: 'Timing makes it harder to ask questions. It does not make the device suspicious.' },
          { id: 'a5', type: 'plain', text: 'The monitoring system was turned on at 02:58, and this is the first time it has looked at this site', note: 'The device may have been there for years: the monitor simply had not looked before.' },
        ],
      },
      {
        id: 'device', title: 'What the device is',
        blurb: 'Its settings and its history.',
        unlockedBy: 'unknown',
        lines: [
          { id: 'b1', type: 'clue', clue: 'cellular', text: 'Router label and settings: "Cellular router, public address 198.51.100.200. Installed by Northwind Telemetry, March three years ago, for pump readings to the control room."', note: 'A cellular router is a second way into the site that bypasses the plant firewall. It was installed for a real reason and then forgotten.' },
          { id: 'b2', type: 'clue', clue: 'default', text: 'Router admin page: "Remote admin: on. Login: admin / (manufacturer default). Last password change: never."', note: 'Anyone on the internet who finds the router can try the default login. This is the real exposure.' },
          { id: 'b3', type: 'clue', clue: 'linked', text: 'Switch port list, Pumping Station 4: "Port 3 pump controller, port 4 control panel, port 5 router (unlabelled)."', note: 'The router sits on the pump controller\'s own network. If it were taken over, it would have a direct line to the pump.' },
          { id: 'b4', type: 'herring', text: 'The router is a well-known brand', note: 'A good brand does not make a default password safe.' },
          { id: 'b5', type: 'herring', text: 'The contractor still sends the utility an annual invoice for the telemetry service', note: 'Shows the service exists, not that it is secure.' },
        ],
      },
      {
        id: 'traffic', title: 'What the device has been doing',
        blurb: 'The monitor\'s record of its traffic.',
        unlockedBy: 'default',
        lines: [
          { id: 'c1', type: 'clue', clue: 'nocommands', text: 'Traffic summary, 02:58 to 03:30: "198.51.100.77:443, 6 connections, 4 KB, certificate belongs to the router maker\'s cloud service. Pump readings to 192.0.2.10 (control room), 12 KB. No inbound connections to the pump controller from outside the site."', note: 'The outside address belongs to the maker\'s management service, and nothing has been sent to the controller. There is no sign that anyone has used the route. The danger is that they could.' },
          { id: 'c2', type: 'clue', clue: 'timing', text: 'First connection to the maker\'s service: 03:20, then every 5 minutes', note: 'A routine check-in schedule. The timing is not suspicious in itself.' },
          { id: 'c3', type: 'herring', text: 'The maker\'s cloud service is hosted in another country', note: 'Where a service is hosted says little about whether it is harmful.' },
          { id: 'c4', type: 'herring', text: 'The router has been online continuously for 1,060 days', note: 'It has been exposed for a long time. That is the problem, and it is not evidence of an attack.' },
          { id: 'c5', type: 'plain', text: 'The pump has run normally all night: flow, pressure and motor current match the daily pattern', note: 'Nothing has been done to the pump.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'forgotten', correct: true, text: 'A forgotten cellular router with its default login gives the internet a direct route to the pump network, and nobody knew it was there because the asset list had never been checked against the network. There is no sign yet that anyone has used it', explain: 'The unlisted router, the default login, its place on the pump network and the harmless traffic together show a real exposure with no evidence of abuse.' },
        { id: 'attack', correct: false, text: 'An attacker has taken over the pumping station and is controlling the pump', explain: 'Nothing supports that. The traffic is a routine check-in and the pump has run normally.' },
        { id: 'faulty', correct: false, text: 'The new monitoring system is faulty and has invented a device', explain: 'The device is real and has a label, a public address and a contractor invoice.' },
        { id: 'contractor', correct: false, text: 'The contractor is deliberately spying on the plant', explain: 'Nothing suggests bad faith. It was installed for pump readings and then forgotten.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Keep the pump running and tell operations. Confirm the router\'s purpose with the contractor, change its login and turn off its remote admin, put it behind a firewall or replace it with a supported, managed link in an agreed window, and check every other remote site against the network for the same kind of device', explain: 'Keeps the plant running, fixes the exposure in the right order and looks for more of the same.' },
        { id: 'pull', correct: false, text: 'Pull the router out of the switch straight away', explain: 'The pump readings reach the control room through it. Removing it blindly would blind operators at that site and could trip alarms.' },
        { id: 'shutdown', correct: false, text: 'Shut down Pumping Station 4 until the router is understood', explain: 'The pump is serving customers and has not been touched. Stopping it is a far bigger harm.' },
        { id: 'ignore', correct: false, text: 'Leave it, because nothing has happened', explain: 'It is a standing route to the pump with a default password.' },
      ],
    },
    story: [
      'Three years ago a contractor installed a cellular router at a remote pumping station so the pump\'s readings could reach the control room. It was never added to the asset list, and its admin login was never changed.',
      'On Tuesday the plant switches on passive monitoring for the first time. At 03:20 it notices the router checking in with its maker\'s cloud service.',
      'Nothing has been done through the router: the traffic is routine and the pump has run normally. The danger is the route itself, open to the internet with a default password and a direct line to the pump network.',
      'The lesson is that you cannot protect what you do not know you have, and that the first move in a plant is to understand and plan before you pull anything out.',
    ],
  },
];
