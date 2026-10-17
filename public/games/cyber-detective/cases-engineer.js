// Security Engineer Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges and private ranges (10.x).

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const ENGINEER = [
  {
    id: 'config-drift',
    title: 'The secure build that stopped being secure',
    skill: 'data',
    blurb: 'Every server was built from a hardened template, and the configuration tool says they all comply. An audit disagrees.',
    brief: [
      'Contoso builds its servers from a hardened template, and the configuration management dashboard shows 100% compliance. An internal audit has just sampled 40 production servers and found 11 that do not match the baseline: remote administration settings are looser, and on two servers the host firewall is switched off.',
      'You have the audit results to start with, and deeper records as you find the right clues. Work out how secure servers became insecure without the dashboard noticing, flag the lines that matter, and decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      manual: { strength: 'strong', text: 'The differences were made by hand, directly on the running servers, and never put back into the configuration code.' },
      incident: { strength: 'strong', text: 'Most of the changes date from an outage two months ago, when engineers loosened settings to get things working.' },
      blind: { strength: 'strong', text: 'The dashboard checks only that each server was built from the template, not what is actually set on it now.' },
      nodetect: { strength: 'strong', text: 'Nothing watches for changes to the settings, so the drift was never flagged.' },
      shared: { strength: 'strong', text: 'The 11 servers all belong to one team whose engineers sign in directly rather than through the automation.' },
      template: { strength: 'weak', text: 'The template was last updated eight months ago.' },
    },
    artefacts: [
      {
        id: 'audit', title: 'Audit results',
        blurb: 'What the audit found on the sample of 40 servers.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'shared', text: 'Audit: 11 of 40 sampled servers deviate from the baseline. All 11 are owned by the Payments platform team. The other 29 match.', note: 'The problem is concentrated in one team, which points at how they work rather than at the template, which is shared by all.' },
          { id: 'a2', type: 'herring', text: 'Audit: all 40 servers are patched within 30 days', note: 'Good news, and a separate matter from configuration drift.' },
          { id: 'a3', type: 'herring', text: 'Audit: asset inventory 100% complete for the sample', note: 'Every server was found, which is good, but it does not explain the drift.' },
          { id: 'a4', type: 'plain', text: 'Audit: no evidence of unauthorised access on any sampled server', note: 'Reassuring, but loosened settings are still a weakness.' },
        ],
      },
      {
        id: 'history', title: 'Change and sign-in records for the 11 servers',
        blurb: 'How were they changed, and by whom?',
        unlockedBy: 'shared',
        lines: [
          { id: 'h1', type: 'clue', clue: 'manual', text: 'Shell history on 9 of 11 servers: direct edits to /etc/ssh/sshd_config and firewall rules by named engineers; no corresponding change in the configuration repository', note: 'Changes made by hand on a running machine and never recorded as code. The next rebuild would undo them, or worse, nobody knows they exist.' },
          { id: 'h2', type: 'clue', clue: 'incident', text: 'Change timestamps on 10 of 11 servers cluster between 02:10 and 04:45 on 14 August, the night of Incident INC-2208 (payments outage)', note: 'Settings were loosened during an emergency to restore service, and never tightened afterwards. That is how most drift starts.' },
          { id: 'h3', type: 'herring', text: 'Payments team headcount: 14 engineers', note: 'Team size does not explain the drift.' },
          { id: 'h4', type: 'herring', text: 'Quarterly access review for the Payments team: completed', note: 'Access reviews check who can sign in, not what they changed.' },
        ],
      },
      {
        id: 'tooling', title: 'The configuration dashboard and monitoring',
        blurb: 'Why did nothing notice?',
        unlockedBy: 'manual',
        lines: [
          { id: 't1', type: 'clue', clue: 'blind', text: 'Dashboard definition: "compliant" = server was provisioned from template v3.2; it does not read live configuration', note: 'The dashboard answers "was this built correctly?", not "is it still correct?". A green tick can be wrong the day after.' },
          { id: 't2', type: 'clue', clue: 'nodetect', text: 'File integrity monitoring: not enabled on any production server; no alerts on changes to sshd_config or firewall settings', note: 'Without detection, changes made by hand are invisible until an audit finds them.' },
          { id: 't3', type: 'clue', clue: 'template', text: 'Template v3.2 last updated 8 months ago', note: 'Somewhat old, but the other 29 servers built from it are fine, so it is not the cause.' },
          { id: 't4', type: 'herring', text: 'The dashboard has 12,000 monthly views', note: 'Popularity does not make it accurate.' },
          { id: 't5', type: 'plain', text: 'Configuration management agent version: 4.1 (current)', note: 'The tool is up to date. The problem is what it checks.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'drift', correct: true, text: 'Manual changes made during an incident drifted the servers from the baseline, and nothing was checking the live settings', explain: 'Hand edits during an outage loosened the settings, were never recorded as code, and the dashboard only checks how a server was built, so everything still looked compliant.' },
        { id: 'template', correct: false, text: 'The hardened template itself is insecure', explain: 'The 29 other servers built from it match the baseline. The problem is on the 11 that were changed afterwards.' },
        { id: 'attacker', correct: false, text: 'An attacker changed the settings to weaken the servers', explain: 'The changes are traced to named engineers on the night of an outage, and the audit found no sign of unauthorised access.' },
        { id: 'scanner', correct: false, text: 'The audit tool is wrong', explain: 'The shell history confirms the changes. The audit is accurate.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'restore', correct: true, text: 'Restore the intended settings from code, require changes to go through the repository with review, and add drift detection that alerts on changes to live settings', explain: 'Put the servers back to the agreed state, make the secure path the normal one, and detect any future drift.' },
        { id: 'newbase', correct: false, text: 'Accept the current settings and update the baseline to match them', explain: 'It makes the loosened settings the standard and removes the control.' },
        { id: 'blockadmin', correct: false, text: 'Remove all engineers\' access to production', explain: 'Incidents need access. The fix is to make changes recorded and reviewed, not to stop them.' },
        { id: 'policy', correct: false, text: 'Send a reminder to engineers not to change settings by hand', explain: 'A reminder is not a control. Under pressure at 03:00, people will do it again.' },
      ],
    },
    story: [
      'Servers are built from a hardened template, and the dashboard shows they all comply.',
      'On 14 August a payments outage hits at 02:00. Engineers, working fast, loosen remote access and switch off the firewall on two servers to get service back.',
      'Service returns. Nobody records the changes as code and nobody tightens the settings again. The dashboard only checks how servers were built, so it stays green.',
      'The fix is to restore the settings from code, route changes through review, and detect drift, so a good emergency fix does not become a permanent weakness.',
    ],
  },
];
