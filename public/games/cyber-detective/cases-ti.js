// Threat Intelligence Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const TI = [
  {
    id: 'stale-indicators',
    title: 'The indicator that blocked payroll',
    skill: 'correlation',
    blurb: 'An address from a threat feed was blocked automatically, and payroll stopped. The feed said the address was malicious. Find out how an old indicator did more damage than the threat it described.',
    brief: [
      'On Thursday at 06:10, an address from the company\'s threat feed was added to the firewall blocklist automatically. At 06:40, the payroll provider\'s service stopped responding, and 1,600 staff could not be paid that morning.',
      'You have the feed entry and the payroll incident record to start with, and deeper evidence as you find the right clues. Work out how a blocked address could stop payroll, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      old: { strength: 'strong', text: 'The feed entry for the address was first reported 14 months ago, and the address has not been reported by any source since.' },
      reassigned: { strength: 'strong', text: 'The address was reassigned to a large cloud provider 9 months ago, and now hosts the payroll service and about 4,000 other sites.' },
      auto: { strength: 'strong', text: 'The feed\'s indicators are added to the blocklist automatically, with no check on age, hosting or context, and no expiry.' },
      nocontext: { strength: 'strong', text: 'The feed entry says only "malicious infrastructure", with no malware name, campaign or date of last activity.' },
      volume: { strength: 'weak', text: 'The feed adds about 4,000 indicators a day.' },
    },
    artefacts: [
      {
        id: 'entry', title: 'The feed entry and the incident',
        blurb: 'What the feed said, and what happened.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'nocontext', text: 'Feed entry: 203.0.113.140. Type: IP address. Tag: "malicious". Confidence: "high". First seen: 14 months ago. Last seen: not stated. Description: "malicious infrastructure"', note: 'A bare tag with no context. It cannot tell you what it was used for or whether it is still active.' },
          { id: 'a2', type: 'herring', text: 'The feed vendor is highly rated by analysts', note: 'Reputation does not make an old entry current.' },
          { id: 'a3', type: 'herring', text: 'Payroll processing runs every second Thursday', note: 'Explains the timing of the effect, not the cause.' },
          { id: 'a4', type: 'plain', text: 'Incident: payroll service unreachable from 06:40 until the block was removed at 08:25', note: 'The effect of the mistake.' },
        ],
      },
      {
        id: 'address', title: 'What the address is now',
        blurb: 'The current owner and use of the address.',
        unlockedBy: 'nocontext',
        lines: [
          { id: 'b1', type: 'clue', clue: 'reassigned', text: 'Registry record: 203.0.113.140 allocated to "Skyline Cloud Hosting" on 14 January (9 months ago). Previously allocated to a small hosting company. Currently hosts payroll.provider.example and about 4,000 other sites', note: 'The address changed hands. A criminal who used it 14 months ago no longer does, and a legitimate service has taken its place.' },
          { id: 'b2', type: 'clue', clue: 'old', text: 'Sightings of this address in any source in the last 12 months: 0. First report: 14 months ago, one source', note: 'A single old report and no sightings since. It is very likely out of date.' },
          { id: 'b3', type: 'herring', text: 'The address is in a country that has been mentioned in threat reports', note: 'Where an address is does not make it malicious.' },
          { id: 'b4', type: 'herring', text: 'The payroll provider has had two outages this year', note: 'Unrelated.' },
          { id: 'b5', type: 'plain', text: 'Blocklist entries added from the feed last month: 118,000', note: 'The scale of automatic blocking.' },
        ],
      },
      {
        id: 'process', title: 'How indicators become blocks',
        blurb: 'The rules for adding indicators.',
        unlockedBy: 'reassigned',
        lines: [
          { id: 'c1', type: 'clue', clue: 'auto', text: 'Process note: "All indicators with confidence high are added to the firewall blocklist within 30 minutes. Entries are kept until removed manually"', note: 'No checks and no expiry mean old indicators stay for ever and can hit legitimate services.' },
          { id: 'c2', type: 'clue', clue: 'volume', text: 'Feed volume: about 4,000 indicators a day. Analysts who review the blocklist: 0.5 of one person', note: 'Too much to review, which is why a rule for sorting is needed. It does not excuse missing checks.' },
          { id: 'c3', type: 'herring', text: 'The firewall has capacity for 400,000 entries', note: 'Having room is not a reason to fill it.' },
          { id: 'c4', type: 'herring', text: 'The blocklist is shown on the monthly security dashboard', note: 'Visibility without review.' },
          { id: 'c5', type: 'plain', text: 'Last review of the blocklist for stale entries: 11 months ago', note: 'Context.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'stale', correct: true, text: 'An old, contextless indicator was blocked automatically, and the address had since been reassigned to a cloud provider that hosts the payroll service, with no check on age, hosting or expiry', explain: 'The bare entry, the reassignment and the automatic blocking with no expiry explain how an old indicator broke payroll.' },
        { id: 'attack', correct: false, text: 'An attacker deliberately got the address blocked to cause an outage', explain: 'Nothing suggests this. It was an ordinary feed entry from 14 months ago.' },
        { id: 'fw', correct: false, text: 'The firewall malfunctioned', explain: 'It blocked exactly the address it was told to block.' },
        { id: 'vendor', correct: false, text: 'The feed vendor deliberately sent a false indicator', explain: 'The indicator was probably accurate when first reported. It is the processing that was wrong.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'respond', correct: true, text: 'Remove the block now and confirm payroll recovers, then set automatic blocks to apply only to recent, specific indicators with an expiry, exclude shared hosting from automatic blocking, review existing entries for age and hosting, and add a quick check before any block is applied', explain: 'Fix the damage, then change the rules so the mistake cannot recur.' },
        { id: 'unblock', correct: false, text: 'Unblock the address and carry on as before', explain: 'The same process would block the next reassigned address.' },
        { id: 'stop', correct: false, text: 'Stop using the threat feed', explain: 'The feed has value if its indicators are sorted and expire.' },
        { id: 'blame', correct: false, text: 'Tell the payroll provider to move to a different address', explain: 'It is not their fault and not within your control.' },
      ],
    },
    story: [
      'A feed reports an address as malicious. Fourteen months later, nobody has seen it used.',
      'In the meantime, the address is reassigned to a cloud provider that hosts thousands of sites, including the payroll service.',
      'An automatic rule blocks every high-confidence indicator, with no checks and no expiry. At 06:10 the old entry is added, and at 06:40 payroll stops.',
      'The lesson is that an indicator has a shelf life: give it context and an expiry, and be careful with shared hosting.',
    ],
  },
];
