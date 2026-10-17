// Vulnerability Management Cyber Detective cases (see cases.js for the format). Everything here is
// fictional. Vulnerability ids use the impossible year 2099 so they cannot be mistaken for real flaws.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const VULN = [
  {
    id: 'recurring-vuln',
    title: 'The finding that keeps coming back',
    skill: 'data',
    blurb: 'A critical finding has been closed four times and keeps returning on new servers. Find out why.',
    brief: [
      'Finding VULN-2099-3302, a critical flaw in a web server package, has been fixed and closed four times in the last two months. Each time, the next weekly scan finds it again, on different servers. The patching team says their tool reports success every time, and the scanner team says the scanner is fine.',
      'You have the scan history to start with, and deeper records as you find the right clues. Work out why it keeps coming back, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      newbuilds: { strength: 'strong', text: 'All 14 affected servers were built in the last three weeks: none of the long-running servers has the flaw.' },
      image: { strength: 'strong', text: 'All 14 were deployed from the same template, "win-2019-base-v3".' },
      stale: { strength: 'strong', text: 'That template was last updated nine months ago, before the flaw was fixed upstream.' },
      patchworks: { strength: 'strong', text: 'Patching a running server removes the flaw, and the patch tool reports success: the tool is working.' },
      nogate: { strength: 'strong', text: 'The build pipeline has no vulnerability scan before a new server goes live.' },
      reopened: { strength: 'weak', text: 'The ticket has been reopened four times, each time closed after patching the servers it listed.' },
    },
    artefacts: [
      {
        id: 'scans', title: 'Scan history',
        blurb: 'What the weekly scans show.',
        lines: [
          { id: 'h1', type: 'clue', clue: 'newbuilds', text: 'Scan 14 Oct: VULN-2099-3302 on 14 hosts, all with first-seen dates in the last 21 days. Hosts older than 21 days: 0 affected.', note: 'The flaw only appears on recent builds. That points at what new servers start from, not at the patching of old ones.' },
          { id: 'h2', type: 'herring', text: 'Scanner engine updated to 9.4 on 10 Oct', note: 'A scanner update could change results, but the finding appeared before the update and only on new hosts.' },
          { id: 'h3', type: 'herring', text: 'Scan duration: 6 h 40 min (up from 5 h 50)', note: 'The scan takes longer as the estate grows. It has no bearing on the finding.' },
          { id: 'h4', type: 'plain', text: 'Authenticated scan success rate: 99%', note: 'The scanner can log in almost everywhere, so a false positive from missing credentials is unlikely.' },
        ],
      },
      {
        id: 'builds', title: 'Build and deployment records',
        blurb: 'Where do the new servers come from?',
        unlockedBy: 'newbuilds',
        lines: [
          { id: 'b1', type: 'clue', clue: 'image', text: 'Deployment log: 14 of 14 affected servers cloned from template win-2019-base-v3', note: 'A single shared origin. Every server built from it starts with the same flaw.' },
          { id: 'b2', type: 'clue', clue: 'stale', text: 'Template register: win-2019-base-v3, last updated 11 January (9 months ago); upstream fix released in July', note: 'The template predates the fix, so every new server is born vulnerable.' },
          { id: 'b3', type: 'clue', clue: 'nogate', text: 'Pipeline config: stages are build, configure, deploy. No security scan stage.', note: 'Nothing checks a new server before it goes live, so the same flaw is reintroduced every time.' },
          { id: 'b4', type: 'herring', text: 'Template win-2022-base-v1: updated last week', note: 'A different, current template that is not used by the affected servers.' },
          { id: 'b5', type: 'plain', text: '31 other servers were cloned from the same template last quarter', note: 'Worth following up, but it is a consequence of the cause, not a separate finding.' },
        ],
      },
      {
        id: 'patching', title: 'Patch tool and ticket history',
        blurb: 'Is the patching tool failing?',
        unlockedBy: 'image',
        lines: [
          { id: 'p1', type: 'clue', clue: 'patchworks', text: 'Patch tool: 14 of 14 hosts patched and verified within 3 days of each ticket; the finding cleared on the next scan', note: 'The tool does its job on running servers. That rules out a patching failure.' },
          { id: 'p2', type: 'clue', clue: 'reopened', text: 'Ticket VULN-2099-3302: closed 4 times, reopened 4 times; each closure cites "patched affected hosts"', note: 'The pattern of repeated closure shows the team treats the symptom. It is evidence of the cycle, not of its cause.' },
          { id: 'p3', type: 'herring', text: 'Patch tool licence renewal due next month', note: 'Administrative detail with no bearing on this problem.' },
          { id: 'p4', type: 'plain', text: 'Patch window: Wednesdays 18:00', note: 'The schedule is normal and does not explain the recurrence.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'template', correct: true, text: 'New servers are built from an out-of-date template, so every rebuild reintroduces the flaw', explain: 'Only new builds are affected, they all share one old template, and patching running servers works. The source of the flaw is the template.' },
        { id: 'tool', correct: false, text: 'The patch tool is failing to apply the fix', explain: 'The tool patches and verifies every running host successfully. The flaw returns on new servers.' },
        { id: 'falsepos', correct: false, text: 'The scanner is reporting false positives', explain: 'Authenticated scans confirm the vulnerable version on each host, and the scanner reports no other anomalies.' },
        { id: 'attacker', correct: false, text: 'An attacker keeps reinstalling the vulnerable package', explain: 'Nothing suggests an attacker. The affected hosts are all fresh builds from the same template.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'fixsource', correct: true, text: 'Update the template, rebuild or patch the affected servers and those from the same template, and add a vulnerability scan stage to the build pipeline', explain: 'Fix the source, clean up what it has produced, and stop it happening again with a gate.' },
        { id: 'patchagain', correct: false, text: 'Patch the 14 servers again and close the ticket', explain: 'That is what has been done four times. The next build brings the flaw back.' },
        { id: 'exclude', correct: false, text: 'Exclude those servers from scanning so the finding stops appearing', explain: 'It hides the problem and leaves the flaw in place.' },
        { id: 'severity', correct: false, text: 'Raise the severity so the patching team treats it as more urgent', explain: 'The team is already patching it quickly. Urgency is not the issue.' },
      ],
    },
    story: [
      'Nine months ago the team builds a new server template. It is fine at the time.',
      'In July the vendor releases a fix for a critical flaw, and the patching team patches every running server. The template is not updated.',
      'Over the next weeks, new servers are cloned from the old template. Each one is born with the flaw. Each week the scan finds the new ones, the patching team fixes them, and the ticket is closed.',
      'The cycle only ends when the template is fixed and the build pipeline checks new servers before they go live.',
    ],
  },
];
