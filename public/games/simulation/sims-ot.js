// OT/IoT Security simulations. Everything here is fictional: the utility, the plant, the devices, the vendors and
// the people are invented. They are decision-based: what to protect first, how to protect something that cannot be
// patched, and how to work with the people who run a plant. They contain no technique for attacking control systems.
//
// The path's themes: safety and availability come before confidentiality, a plant is protected by structure
// (zones, conduits, monitoring) more than by patching, and the people who run the plant are partners, not obstacles.

const RATINGS = [
  { name: 'Office thinking', blurb: 'Plant decisions made with an office mindset: scanning, patching and locking down first, and asking operations afterwards. Read each stage note: in a plant the order is safety, availability, then confidentiality.' },
  { name: 'Junior OT analyst', blurb: 'You put safety first in most places, with gaps in how you protected old devices, worked with operations or kept the plant running.' },
  { name: 'OT security engineer', blurb: 'Safety and availability first, structure over patching, and operations brought along. Sound judgement for a live plant.' },
  { name: 'Plant security lead', blurb: 'Every change justified in the plant owner\'s terms, old devices protected by structure and watching, and the courage to say "not on the live plant".' },
];

export const OT = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'plant-priorities',
    title: 'Nothing may stop the plant',
    skill: 'hardening',
    minutes: 20,
    blurb: 'You have just become the security lead at a water utility. The operations manager says nothing may stop the plant, IT wants to scan it tonight and a vendor wants remote access. Decide what matters, in what order, and what to do first.',
    brief: [
      'It is your first week at Contoso Water. The plant treats and pumps drinking water for 200,000 people. Its control systems sit on a network behind the office network. The operations manager, Priya, has made one rule clear: "Nothing may stop the plant."',
      'You will rank what matters in a plant, read the walk-round notes, spend a limited budget of hours, decide what to do about IT\'s proposal to scan the plant network tonight, and review the draft plan before it goes to the operations manager.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what matters in a plant',
        intro: 'Tap the goals in order, the most important first. In an office, confidentiality usually comes first. Ask whether that is true here.',
        items: [
          { id: 'g1', source: 'Safety', priority: 1, text: 'Nobody is hurt and the water is safe to drink: the plant does not do anything dangerous, whether by accident or by attack.', why: 'People and the public come first. A control system that is wrong about a chemical dose can harm people.' },
          { id: 'g2', source: 'Availability', priority: 2, text: 'The plant keeps running: water keeps flowing, and control and monitoring stay up.', why: 'A plant that stops cannot supply water, and stopping it suddenly can itself be unsafe.' },
          { id: 'g3', source: 'Integrity', priority: 3, text: 'Readings and commands can be trusted: a value that has been changed or faked leads to wrong decisions.', why: 'In a plant, a wrong value is more dangerous than a missing one.' },
          { id: 'g4', source: 'Confidentiality', priority: 4, text: 'Plant data, drawings and settings are kept private.', why: 'It matters, and in a plant it comes after the first three, which is the reverse of most offices.' },
          { id: 'g5', source: 'Convenience', priority: 5, text: 'Staff and vendors can work with the least friction possible.', why: 'Convenience is worth having and is the first thing to give up for safety.' },
        ],
      },
      {
        id: 'walk', type: 'evidence', title: 'Read the notes from your walk round the plant',
        intro: 'You walked the plant with an operator, and read the network sketch and the last audit. Look for what really matters for security. Flag only what the notes support.',
        clues: {
          flat: { strength: 'strong', text: 'Office PCs, the engineering workstation and the controllers are all on one network, with no firewall between the office and the plant.' },
          old: { strength: 'strong', text: 'The pump station controller runs firmware from 2011. The manufacturer stopped supporting it in 2016, so no updates exist.' },
          remote: { strength: 'strong', text: 'The vendor reaches the plant through a remote desktop port forwarded from the internet, using one shared password written on a sticky note.' },
          fragile: { strength: 'strong', text: 'The controller manual warns that heavy network scanning can make the device freeze or restart.' },
          quiet: { strength: 'weak', text: 'The plant has run for fifteen years with no known security incident.' },
        },
        artefacts: [
          {
            id: 'network', title: 'The network sketch and the audit',
            lines: [
              { id: 'w1', type: 'clue', clue: 'flat', text: 'Network sketch: one switch, one address range. Office PCs (192.0.2.x), the SCADA server, the engineering workstation and all three controllers share it. "Firewall: office to internet only."', note: 'There is no wall between the office and the plant. Anything that infects an office PC can see the controllers.' },
              { id: 'w2', type: 'clue', clue: 'remote', text: 'Audit note: "Vendor support uses remote desktop on the engineering workstation. Port 3389 is forwarded from the internet. One shared password, last changed 2019."', note: 'A route from the whole internet to the engineering workstation, protected by one old shared password.' },
              { id: 'w3', type: 'clue', clue: 'quiet', text: 'Audit note: "No security incidents recorded in 15 years."', note: 'The absence of a recorded incident is not evidence of safety: nobody was looking.' },
              { id: 'w4', type: 'herring', text: 'The plant was built to a respected design standard in 2009', note: 'A good build in 2009 says little about its network today.' },
              { id: 'w5', type: 'herring', text: 'The control room has a keycard door and a visitor book', note: 'Physical security is good and does not change the network findings.' },
              { id: 'w6', type: 'plain', text: 'The plant supplies about 200,000 people', note: 'Context for why safety comes first.' },
            ],
          },
          {
            id: 'devices', title: 'The controllers and the operator\'s warnings',
            lines: [
              { id: 'w7', type: 'clue', clue: 'old', text: 'Asset list: pump station controller, installed 2011, firmware 2.1. "Supported until 2016. No patch available. Replacement quoted at £60,000, not budgeted."', note: 'It cannot be patched, so it must be protected some other way.' },
              { id: 'w8', type: 'clue', clue: 'fragile', text: 'Operator Sam: "Last year an engineer at another site ran a full network scan and the controller froze. They had to stop the pumps and restart it by hand." Manual, section 9: "Heavy scanning may cause the device to stop responding."', note: 'Active scanning is a risk to the plant itself. Controllers are not office PCs.' },
              { id: 'w9', type: 'herring', text: 'The newest controller was installed last year and runs current firmware', note: 'One modern device does not make the old ones safe.' },
              { id: 'w10', type: 'herring', text: 'The vendor is a well-known supplier with an ISO certificate', note: 'A certificate does not make a shared password safe.' },
              { id: 'w11', type: 'plain', text: 'Priya: "The plant has a manual mode, but it takes four operators and cannot run for long."', note: 'Context: stopping automatic control has a cost and a limit.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your first ten hours',
        intro: 'Spend all ten across these five pieces of work this week.',
        items: [
          { id: 'e1', source: 'Map', ideal: 4, text: 'Walk the plant with an operator and list every device and every connection, so you know what is there.', why: 'You cannot protect what you have not found. This comes first, and it is done with operators, not scanners.' },
          { id: 'e2', source: 'Remote access', ideal: 2, text: 'Close the forwarded remote desktop and replace it with a jump host and a second factor for the vendor.', why: 'The most dangerous route in, and a change outside the control network.' },
          { id: 'e3', source: 'Operations', ideal: 2, text: 'Meet Priya and the shift leads to agree what may change, when, and who is told.', why: 'Every later change needs their agreement. It also teaches you how the plant really runs.' },
          { id: 'e4', source: 'Watch', ideal: 2, text: 'Plan passive monitoring of the plant network, so new devices and unexpected commands show up.', why: 'Watching costs the plant nothing and finds problems early.' },
          { id: 'e5', source: 'Scan', ideal: 0, text: 'Run IT\'s vulnerability scanner across the plant network to find every weakness.', why: 'An active scan can freeze a controller. It is the one thing to avoid on the live plant.' },
        ],
      },
      {
        id: 'scan', type: 'decision', title: 'Decide: IT\'s plan to scan the plant tonight',
        intro: 'The head of IT says: "Our scanner finds everything in an hour. Let us run it across the plant network tonight and get a list of weaknesses by morning." Priya is on holiday until Thursday.',
        prompt: 'What do you recommend?',
        options: [
          { id: 'inventory', quality: 3, text: 'Do not run active scans on the live plant. Build the inventory by walking the plant with the operators and by watching the traffic passively, and agree any later testing with Priya, on a spare device or in a maintenance window', set: { inventory: true }, consequence: 'You have a full device list within three days, with no risk to the plant. Priya, when she returns, says it is the first time security has asked before acting.' },
          { id: 'office', quality: 2, text: 'Scan only the office side of the plant network, leaving the controllers alone', set: { office: true }, consequence: 'The scan is safe and finds some office-side issues. It tells you nothing about the controllers, which are the part that matters.' },
          { id: 'wait', quality: 1, text: 'Do nothing until Priya returns on Thursday', set: { wait: true }, consequence: 'No harm is done, and nothing is learned for three days while the shared password stays on its sticky note.' },
          { id: 'scanall', quality: 0, text: 'Run the full scan tonight, as IT suggests, and tell Priya afterwards', set: { scanall: true }, consequence: 'At 23:40 the pump station controller freezes. Two operators spend the night restarting the pumps by hand. Priya\'s first question is why nobody asked her.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the operations manager',
        intro: 'A colleague has drafted the first-month plan.',
        draftIntro: 'Read each statement. Flag every one that is wrong, risky or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Safety and availability come before confidentiality in every decision about the plant.', why: 'The right order for a plant.' },
          { id: 'p2', sound: false, text: 'The pump station controller should be patched this month.', why: 'No patch exists: support ended in 2016. It must be protected some other way.' },
          { id: 'p3', sound: true, text: 'The forwarded remote desktop will be replaced by a jump host with a second factor.', why: 'Closes the most dangerous route and keeps vendor support.' },
          { id: 'p4', sound: false, text: 'The plant has had no incidents in 15 years, so the risk is low.', why: 'Nobody has been watching, so the absence of a record means little.' },
          { id: 'p5', sound: false, text: 'We will run the office vulnerability scanner across the controllers to find their weaknesses.', why: 'Active scanning can freeze a controller. Use inventory and passive monitoring.' },
          { id: 'p6', sound: true, text: 'No change will be made to the control network without Priya\'s agreement and a maintenance window.', why: 'The plant owners decide when the plant may be touched.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your first-week note for the operations manager',
        intro: 'Say what you found, what you did and what you will do next, in terms Priya can act on.',
        statements: [
          { id: 'r1', correct: true, text: 'The office network and the plant network are not separated, so anything that infects an office PC can reach the controllers.', why: 'Shown by the network sketch.' },
          { id: 'r2', correct: true, text: 'The vendor reaches the engineering workstation through a remote desktop forwarded from the internet with one shared password, which is the most urgent route to close.', why: 'Shown by the audit note.' },
          { id: 'r3', correct: true, text: 'The pump station controller is unsupported and cannot be patched, so it will be protected by separating it from the office and watching its traffic.', why: 'The right way to treat an unpatchable device.' },
          { id: 'r4', correct: true, text: 'We will not run active scans on the live plant, because controllers can freeze under them.', why: 'Shown by the manual and the operator\'s story.' },
          { id: 'r5', correct: false, text: 'The plant is secure because nothing has gone wrong in 15 years.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'All the controllers will be patched within a month.', why: 'Unsupported: the oldest cannot be patched.' },
          { id: 'r7', correct: false, text: 'Security should decide when changes are made to the plant.', why: 'The plant owners decide that.' },
          { id: 'r8', when: 'inventory', correct: true, text: 'We built the device list by walking the plant with the operators and by watching traffic, and ran no scans, so the plant was never at risk.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'office', correct: true, text: 'We scanned the office side only, which was safe and told us little about the controllers.', why: 'An honest account.' },
          { id: 'r10', when: 'wait', correct: true, text: 'We waited three days for the operations manager, which was safe and left the shared password in place.', why: 'An honest account.' },
          { id: 'r11', when: 'scanall', correct: true, text: 'We ran a full scan without agreement, a controller froze and operators ran the pumps by hand overnight.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Close the forwarded remote desktop and give the vendor a jump host with a second factor.', why: 'Closes the most dangerous route.' },
          { id: 'a2', correct: true, text: 'Agree with Priya and the shift leads what may change and when, including maintenance windows.', why: 'The basis for every later change.' },
          { id: 'a3', correct: true, text: 'Plan a firewall between the office and the plant, and passive monitoring of the plant network.', why: 'Structure and watching protect a plant that cannot be patched.' },
          { id: 'a4', correct: false, text: 'Run IT\'s scanner across the controllers this week.', why: 'Risks the plant.' },
          { id: 'a5', correct: false, text: 'Disconnect the plant from the office network today.', why: 'Would cut reporting and support without agreement, and could stop things that depend on it.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'cant-patch',
    title: 'The controller that cannot be patched',
    skill: 'hardening',
    minutes: 20,
    blurb: 'The pump station controller and the operator PC are too old to patch, and replacing them is not budgeted. Decide how to protect what cannot be fixed, and what to do about a request to "just install the update".',
    brief: [
      'Contoso Water\'s pump station is run by a 2011 controller and a Windows 7 operator PC. Neither can be updated: the manufacturer has stopped supporting the controller, and the operator software only works on that version of Windows. Replacement costs £90,000 and is two years away.',
      'You are the security lead. You will rank the protections, read what is known about the two devices, spend a limited budget of weeks, decide what to do about the finance director\'s request to simply "install the updates", and review the draft plan before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the protections for a device that cannot be patched',
        intro: 'Tap the protections in order, the most valuable first. Think about what can be done without touching the device.',
        items: [
          { id: 'p1', source: 'Separate', priority: 1, text: 'Put the old devices in their own zone, behind a firewall that allows only the few connections they really need.', why: 'It removes most of the ways to reach them without changing them at all.' },
          { id: 'p2', source: 'Watch', priority: 2, text: 'Watch the traffic to and from the devices passively, so anything unusual stands out.', why: 'You will see the thing the firewall did not stop, and it costs the plant nothing.' },
          { id: 'p3', source: 'Back up', priority: 3, text: 'Keep a tested copy of the controller\'s program and settings and of the operator PC, so either can be rebuilt quickly.', why: 'If the device fails or is damaged, recovery is fast.' },
          { id: 'p4', source: 'Remove', priority: 4, text: 'Take away what the devices do not need: web browsing, email, USB sticks and internet access.', why: 'Fewer ways in, and costs almost nothing.' },
          { id: 'p5', source: 'Plan', priority: 5, text: 'Plan and budget the replacement, so the problem has an end.', why: 'Necessary, and it does not protect the plant this year.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read what is known about the two devices',
        intro: 'You have the asset record, the operator PC\'s settings and a note from the vendor. Look for what shapes the right protection. Flag only what the notes support.',
        clues: {
          nopatch: { strength: 'strong', text: 'The controller\'s manufacturer ended support in 2016. No security updates exist for it.' },
          tied: { strength: 'strong', text: 'The operator software only runs on Windows 7, and the vendor has not tested it on anything newer.' },
          reach: { strength: 'strong', text: 'The operator PC has internet access and a USB port in use, and is reachable from every office PC.' },
          breaks: { strength: 'strong', text: 'In 2022 a Windows update on this PC stopped the operator software from starting, and it took two days to recover.' },
          cost: { strength: 'weak', text: 'Replacement of both devices is quoted at £90,000.' },
        },
        artefacts: [
          {
            id: 'records', title: 'The asset record and the vendor note',
            lines: [
              { id: 'f1', type: 'clue', clue: 'nopatch', text: 'Asset record: "Pump station controller. Installed 2011. End of support 2016. Security updates: none."', note: 'It cannot be patched. No amount of effort changes that.' },
              { id: 'f2', type: 'clue', clue: 'tied', text: 'Vendor note: "Operator software version 5 is certified for Windows 7 only. Version 6 (Windows 10) is available for £35,000."', note: 'The PC cannot move to a newer system without paying for new software and testing.' },
              { id: 'f3', type: 'clue', clue: 'cost', text: 'Quote: replace the controller and the PC, £90,000, six weeks of work, during a plant shutdown', note: 'Money and downtime. It is a plan for later and not a protection now.' },
              { id: 'f4', type: 'herring', text: 'The controller has run for 13 years without a fault', note: 'Reliable as a machine, and not a measure of security.' },
              { id: 'f5', type: 'herring', text: 'The pump station is in a locked building at the edge of the plant', note: 'Physical security helps, and the devices are reachable over the network.' },
              { id: 'f6', type: 'plain', text: 'The pump station supplies about a third of customers', note: 'Why the risk matters.' },
            ],
          },
          {
            id: 'settings', title: 'The operator PC and its history',
            lines: [
              { id: 'f7', type: 'clue', clue: 'reach', text: 'Operator PC settings: internet access: allowed. USB storage: allowed. Reachable from: any address on the office network. Antivirus: last updated 2021.', note: 'It is reachable, exposed to the internet and open to removable media. All of that can be reduced without touching the software.' },
              { id: 'f8', type: 'clue', clue: 'breaks', text: 'Incident log, 2022: "Windows update applied. Operator software would not start. Restored from a backup after two days. Pumps run by hand."', note: 'A patch that is normal elsewhere caused an outage here. This is why operations is wary of updates.' },
              { id: 'f9', type: 'herring', text: 'The operator PC has a strong local administrator password', note: 'A good habit, and it does not change the exposure.' },
              { id: 'f10', type: 'herring', text: 'The finance director says "everyone patches their PCs"', note: 'True of an office. This is not one.' },
              { id: 'f11', type: 'plain', text: 'Backups of the PC were last tested in 2022', note: 'The recovery exists, and has not been tried recently.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'weeks', budget: 8, title: 'Spend eight weeks of work',
        intro: 'Spend all eight across these four pieces of work over the quarter.',
        items: [
          { id: 'e1', source: 'Zone', ideal: 3, text: 'Build a separate zone for the pump station with a firewall that allows only SCADA and the engineering workstation to reach the controller and the PC.', why: 'The single biggest reduction in exposure.' },
          { id: 'e2', source: 'Harden', ideal: 2, text: 'Remove internet access and USB use from the operator PC, and turn off everything it does not need.', why: 'Cheap, and agreed with operations first.' },
          { id: 'e3', source: 'Watch', ideal: 2, text: 'Put passive monitoring on the pump station zone and agree what normal traffic looks like.', why: 'Shows anything that gets past the firewall.' },
          { id: 'e4', source: 'Recover', ideal: 1, text: 'Take and test fresh backups of the controller\'s program and the operator PC image.', why: 'Makes recovery fast, and the test is quick.' },
        ],
      },
      {
        id: 'update', type: 'decision', title: 'Decide: the request to "install the updates"',
        intro: 'The finance director has read about unpatched systems and says: "Just install the Windows updates on the operator PC. If it cannot be done, we should shut the pump station down until it can."',
        prompt: 'What do you recommend?',
        options: [
          { id: 'compensate', quality: 3, text: 'Explain that no update exists for the controller and that updates on the PC have broken the plant before, and recommend the zone, the hardening, the monitoring and the tested backup, with the replacement planned in the budget', set: { compensate: true }, consequence: 'The finance director accepts the plan, and asks for the replacement to be put in next year\'s budget. The pump station stays running and is better protected within the quarter.' },
          { id: 'testfirst', quality: 2, text: 'Apply the Windows updates to a copy of the PC first, then to the live PC in a maintenance window', set: { testfirst: true }, consequence: 'The copy fails to start the operator software, as before. You have learnt it safely, and you have no fix yet for the real exposure.' },
          { id: 'accept', quality: 1, text: 'Record the risk as accepted until the replacement and do nothing else', set: { accept: true }, consequence: 'The record is honest and nothing is protected. The PC is still reachable from every office PC.' },
          { id: 'update', quality: 0, text: 'Install the updates on the live PC tonight', set: { update: true }, consequence: 'The operator software stops starting. Operators run the pump station by hand for two days, exactly as in 2022.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan for the board',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every one that is wrong, risky or unsupported.',
        statements: [
          { id: 's1', sound: true, text: 'The pump station controller cannot be patched, so its risk is reduced by separating it, watching it and keeping a tested backup.', why: 'The right approach for a device with no fix.' },
          { id: 's2', sound: false, text: 'Installing the Windows updates on the live operator PC is low risk, because updates are normally safe.', why: 'An update caused a two-day outage in 2022. Normal assumptions do not hold here.' },
          { id: 's3', sound: true, text: 'The operator PC will lose internet access and USB use, with the operators\' agreement.', why: 'Cheap and effective.' },
          { id: 's4', sound: false, text: 'The pump station should be shut down until the devices can be replaced.', why: 'A third of customers would lose supply. It would be a far bigger harm than the risk.' },
          { id: 's5', sound: false, text: 'Because the building is locked, the devices do not need network protection.', why: 'The devices are reachable over the network from every office PC.' },
          { id: 's6', sound: true, text: 'The replacement is planned and budgeted so the problem has an end.', why: 'Necessary, and it follows the protections.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the note for the board',
        intro: 'Say what the risk is, what you will do about it and what you will not do, in terms the board can decide on.',
        statements: [
          { id: 'r1', correct: true, text: 'The pump station controller is unsupported and cannot be patched, and the operator PC runs software that only works on an old operating system.', why: 'Shown by the asset record and the vendor note.' },
          { id: 'r2', correct: true, text: 'Both devices are reachable from every office PC and the operator PC has internet and USB access, which is where the risk lies.', why: 'Shown by the settings.' },
          { id: 'r3', correct: true, text: 'A normal Windows update caused a two-day outage on this PC in 2022, so updating it live is itself a risk to the plant.', why: 'Shown by the incident log.' },
          { id: 'r4', correct: true, text: 'The risk will be reduced by a separate zone, hardening, passive monitoring and tested backups, none of which touch the devices.', why: 'The protections the evidence supports.' },
          { id: 'r5', correct: false, text: 'The devices are safe because they are in a locked building.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'Installing updates will remove the risk.', why: 'Unsupported: no update exists for the controller.' },
          { id: 'r7', correct: false, text: 'The pump station can be shut down while the risk is fixed.', why: 'It would cut supply to a third of customers.' },
          { id: 'r8', when: 'compensate', correct: true, text: 'We recommended the zone, hardening, monitoring and backup, with replacement budgeted for next year, and the pump station stayed running.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'testfirst', correct: true, text: 'We tried the updates on a copy first, which failed safely, and the exposure on the live device remained.', why: 'An honest account.' },
          { id: 'r10', when: 'accept', correct: true, text: 'We recorded the risk as accepted and did nothing further, leaving the devices reachable from every office PC.', why: 'An honest account.' },
          { id: 'r11', when: 'update', correct: true, text: 'We updated the live operator PC, the software failed to start and operators ran the pumps by hand for two days.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Build a separate, firewalled zone for the pump station that only SCADA and engineering can reach.', why: 'The biggest reduction in exposure.' },
          { id: 'a2', correct: true, text: 'Remove internet and USB access from the operator PC, with the operators\' agreement.', why: 'Cheap and effective.' },
          { id: 'a3', correct: true, text: 'Add passive monitoring and test the backups of the controller program and the operator PC.', why: 'Shows what gets through, and makes recovery fast.' },
          { id: 'a4', correct: false, text: 'Install the updates on the live PC outside a maintenance window.', why: 'Risks an outage.' },
          { id: 'a5', correct: false, text: 'Shut the pump station down until the replacement arrives.', why: 'Cuts supply to a third of customers.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ot-exam',
    title: 'Promotion exam: OT Security Engineer',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A vendor wants permanent remote access, the board wants a statement that the plant is secure, and operations wants nothing to change. Decide what to allow, how to say it, and what to refuse to say. Silver or better to pass.',
    brief: [
      'Contoso Water has asked a new sensor vendor to install a cellular gateway that sends readings to the SCADA server. The vendor wants permanent remote access to the gateway and to the engineering workstation "for support". The board has asked you to confirm that the plant is secure. The operations manager wants nothing to change.',
      'You will rank what to settle first, spend a limited budget of hours, read what is known, decide how to handle the vendor\'s request, and review the draft statement for the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the one to settle first at the top. Think about what could harm the plant soonest and what is cheapest to fix.',
        items: [
          { id: 'o1', source: 'Remote access', priority: 1, text: 'The vendor\'s request for permanent remote access to the gateway and the engineering workstation, with a shared password.', why: 'The most direct route into the plant, and it can be decided today.' },
          { id: 'o2', source: 'Gateway', priority: 2, text: 'The new gateway has a cellular modem and a default admin login, and is linked straight to the SCADA server.', why: 'A new exposed device with a direct line to the control system.' },
          { id: 'o3', source: 'Separation', priority: 3, text: 'The office network and the plant network are not separated.', why: 'The underlying weakness, and a larger project.' },
          { id: 'o4', source: 'Watching', priority: 4, text: 'Nothing watches the plant network for new devices or unexpected commands.', why: 'Important, and it does not stop anything by itself.' },
          { id: 'o5', source: 'Statement', priority: 5, text: 'The board\'s request for a statement that the plant is secure.', why: 'It matters, and it is the last thing to settle: the statement must follow the facts.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours this week',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Vendor', ideal: 3, text: 'Agree with the vendor how remote support will work: a jump host, a second factor, sessions agreed in advance and logged.', why: 'Keeps support and removes the shared password.' },
          { id: 'e2', source: 'Gateway', ideal: 3, text: 'Change the gateway\'s default login, turn off its direct admin access and limit what it can send to SCADA to the sensor data protocol.', why: 'Closes the exposed device without breaking the sensors.' },
          { id: 'e3', source: 'Operations', ideal: 2, text: 'Agree the changes and the maintenance window with the operations manager and the shift lead.', why: 'Nothing goes in without the plant owners.' },
          { id: 'e4', source: 'Statement', ideal: 2, text: 'Write an honest status note for the board: what is protected, what is not and what is planned.', why: 'The board needs a true picture more than a reassuring one.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read what is known',
        intro: 'You have the vendor\'s proposal, the gateway\'s settings and the network record. Look for what the decision depends on. Flag only what the notes support.',
        clues: {
          shared: { strength: 'strong', text: 'The vendor\'s proposal uses a single shared password for all of its customers\' gateways.' },
          direct: { strength: 'strong', text: 'The gateway is connected directly to the SCADA server over a link that carries the whole vendor protocol in both directions.' },
          internet: { strength: 'strong', text: 'The gateway\'s cellular admin page is reachable from the internet and still accepts the manufacturer\'s default login.' },
          flat: { strength: 'strong', text: 'There is no firewall between the office network and the plant network.' },
          award: { strength: 'weak', text: 'The vendor won an industry award last year for its sensors.' },
        },
        artefacts: [
          {
            id: 'vendor', title: 'The vendor\'s proposal and the gateway settings',
            lines: [
              { id: 'k1', type: 'clue', clue: 'shared', text: 'Vendor proposal: "For support we require permanent remote access to the gateway and your engineering workstation, using our standard support account (one password for all customers)."', note: 'A password shared by many customers is a route into all of them, and it has no accountability.' },
              { id: 'k2', type: 'clue', clue: 'internet', text: 'Gateway settings: "Cellular remote admin: enabled. Login: admin / (manufacturer default). Reachable from: internet."', note: 'Anyone who finds the modem can try the default login.' },
              { id: 'k3', type: 'clue', clue: 'direct', text: 'Gateway settings: "Link to SCADA 10.4.0.5: full vendor protocol, both directions, no filtering."', note: 'If the gateway is taken over, it has an unrestricted line to the control system.' },
              { id: 'k4', type: 'herring', text: 'The proposal includes a 99.9% uptime promise', note: 'A service promise, not a security measure.' },
              { id: 'k5', type: 'herring', text: 'The gateway has a metal case and a tamper alarm', note: 'Physical protection is good, and the exposure is over the network.' },
              { id: 'k6', type: 'plain', text: 'The vendor needs to update the gateway\'s firmware twice a year', note: 'A real need: support must be possible, and it can be safe.' },
            ],
          },
          {
            id: 'network', title: 'The network record and the operations note',
            lines: [
              { id: 'k7', type: 'clue', clue: 'flat', text: 'Network record: "Office and plant share one network. Firewall: office to internet only."', note: 'Anything in the office can reach the plant. Another reason not to add a new route in.' },
              { id: 'k8', type: 'clue', clue: 'award', text: 'Industry news: "Northwind Sensors wins Best New Product 2025."', note: 'An award says nothing about how it is configured here.' },
              { id: 'k9', type: 'herring', text: 'The vendor offers a discount if the contract is signed this week', note: 'Pressure to decide quickly is not a reason to skip checks.' },
              { id: 'k10', type: 'herring', text: 'Three other utilities already use the same gateway', note: 'Others using it does not show it is configured safely.' },
              { id: 'k11', type: 'plain', text: 'Operations manager: "The plant needs these sensors by the end of the month, and I do not want anything to stop."', note: 'The business need and the constraint.' },
            ],
          },
        ],
      },
      {
        id: 'vendor', type: 'decision', title: 'Decide: the vendor\'s request',
        intro: 'The vendor says: "Our standard terms are permanent remote access with our support account. We cannot change that, and the discount ends on Friday." The board has asked whether the plant is secure.',
        prompt: 'What do you recommend?',
        options: [
          { id: 'broker', quality: 3, text: 'Accept the sensors and the support, on your terms: access only through a jump host with a second factor and named accounts, sessions agreed in advance and logged, the gateway\'s default login changed and its link to SCADA limited to the sensor data protocol, all fitted in a maintenance window agreed with operations', set: { broker: true }, consequence: 'The vendor agrees after a day, since their other utility customers already work this way. The sensors report from the end of the month, and no route into the plant has been added.' },
          { id: 'noremote', quality: 2, text: 'Accept the sensors and refuse all remote access, with the vendor to visit when needed', set: { noremote: true }, consequence: 'It is safe and slow: the first firmware update needs a site visit, and the vendor adds a charge.' },
          { id: 'reject', quality: 1, text: 'Reject the vendor and the sensors', set: { reject: true }, consequence: 'The plant stays as it was. The operations manager is unhappy: the sensors were needed this month.' },
          { id: 'accept', quality: 0, text: 'Accept the vendor\'s terms as offered, to get the discount and the sensors', set: { accept: true }, consequence: 'The sensors work. Within the month, the vendor\'s shared password appears in a leak of another customer\'s files. The plant has an open door and no way to know who used it.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement for the board',
        intro: 'A colleague has drafted the statement the board asked for.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'b1', sound: true, text: 'The office network and the plant network are not yet separated, and separating them is the main project for the year.', why: 'True, and the board needs to know.' },
          { id: 'b2', sound: false, text: 'The plant is secure.', why: 'Not supported: the networks are not separated, and the pump controller cannot be patched.' },
          { id: 'b3', sound: true, text: 'Remote access by suppliers will go through a jump host with a second factor and named accounts.', why: 'A proportionate control that keeps support.' },
          { id: 'b4', sound: false, text: 'Three other utilities use the same gateway, so it is safe.', why: 'Others using it does not show it is configured safely.' },
          { id: 'b5', sound: false, text: 'No incidents have been recorded, so the risk is low.', why: 'Nobody has been watching the plant network.' },
          { id: 'b6', sound: true, text: 'Changes to the plant will be made with operations in agreed maintenance windows.', why: 'The plant owners decide.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the status note for the board',
        intro: 'Say what is true, what is not yet true and what you are doing about it. Do not say the plant is secure.',
        statements: [
          { id: 'r1', correct: true, text: 'The office and plant networks are not separated, and the oldest pump controller cannot be patched.', why: 'Shown by the network record and the asset record.' },
          { id: 'r2', correct: true, text: 'The vendor\'s standard terms (permanent remote access with one shared support password) are not acceptable for a control system.', why: 'Shown by the proposal.' },
          { id: 'r3', correct: true, text: 'The new gateway was installed with its default login, internet-reachable admin and an unfiltered link to SCADA, and these will be changed.', why: 'Shown by the gateway settings.' },
          { id: 'r4', correct: true, text: 'We do not yet watch the plant network, and will add passive monitoring.', why: 'An honest statement of a gap.' },
          { id: 'r5', correct: false, text: 'The plant is secure.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The vendor\'s award shows its products are secure.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'No incidents have been recorded, so no action is needed.', why: 'Unsupported.' },
          { id: 'r8', when: 'broker', correct: true, text: 'We accepted the sensors and the support on our terms: a jump host, named accounts, a changed login and a limited link, fitted in a maintenance window.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'noremote', correct: true, text: 'We accepted the sensors and refused remote access, which is safe and means site visits for updates.', why: 'An honest account.' },
          { id: 'r10', when: 'reject', correct: true, text: 'We rejected the vendor and the sensors, which kept the plant unchanged and left the business need unmet.', why: 'An honest account.' },
          { id: 'r11', when: 'accept', correct: true, text: 'We accepted the vendor\'s shared-password terms and the password was later found in a leak.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Require a jump host, a second factor and named accounts for all vendor access.', why: 'Keeps support and removes the shared password.' },
          { id: 'a2', correct: true, text: 'Change the gateway\'s default login and limit its link to SCADA to the sensor data protocol, in a maintenance window agreed with operations.', why: 'Closes the exposed device.' },
          { id: 'a3', correct: true, text: 'Plan the separation of the office and plant networks and add passive monitoring, and tell the board honestly where this stands.', why: 'The structural fix, with an honest status.' },
          { id: 'a4', correct: false, text: 'Tell the board the plant is secure.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Sign the vendor\'s terms this week to keep the discount.', why: 'Accepts a shared password on a control system.' },
        ],
      },
    ],
  },
];
