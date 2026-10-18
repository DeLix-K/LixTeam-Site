// Senior Cloud Security Incident Commander incidents (see incidents.js for the format). Everything
// here is fictional. IP addresses come from the reserved documentation ranges. Cloud terms are generic.

export const CLOUD_LEAD = [
  {
    id: 'leaked-admin-key',
    title: 'The key in the public repository',
    skill: 'identity',
    blurb: 'An administrator access key has been posted in a public code repository. Before you reach it, someone has used it. Stop them, find what they changed and protect what they read.',
    role: 'Senior cloud security engineer, Contoso',
    startClock: '07:15',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Sunday, 07:15. A billing alert fires: spend in the main cloud account is 20 times the normal rate. At the same moment, a code scanning service reports a live administrator access key in a public repository, committed on Friday.',
      'You are the senior cloud security engineer on call. The key has administrator rights across the account. Every action takes time, and the weekly customer reports run at 10:00.',
    ],
    initial: {
      flags: {
        keyActive: true, // the leaked key still works
        persistence: true, // the attacker created their own user and keys
        machinesRunning: true, // the attacker started large machines
        secretsRotated: false,
        secretsMisused: false,
        preserved: false,
        evidenceLost: false,
        repoPrivate: false,
        historyPurged: false,
        mgrTold: false,
        shutdown: false,
      },
    },
    passive: (s) => (s.flags.keyActive ? 3 : 0) + (s.flags.persistence ? 2 : 0) + (s.flags.machinesRunning ? 2 : 0),
    events: [
      {
        id: 'more-machines', at: 4, expires: true,
        when: (s) => s.flags.machinesRunning && (s.flags.keyActive || s.flags.persistence),
        run: () => ({ threat: 12, severity: 'high', text: 'The attacker starts another forty large machines in three more regions. The bill climbs faster.' }),
      },
      {
        id: 'secrets-used', at: 7, expires: true,
        when: (s) => !s.flags.secretsRotated,
        run: () => ({ set: { secretsMisused: true }, threat: 20, severity: 'high', text: 'A database password the attacker read from the secrets store is used from 203.0.113.12 to connect to the customer database.' }),
      },
      {
        id: 'second-key-used', at: 6, expires: true,
        when: (s) => s.flags.persistence && !s.flags.keyActive,
        run: () => ({ set: { keyActive: true }, threat: 15, severity: 'high', text: 'You disabled the leaked key, but the attacker created their own user and keys. They carry on.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'activity', group: 'Investigate', label: 'Read the audit log for the leaked key', hint: 'What has the attacker done?', tag: 'key',
        run: () => ({
          reveal: { activity: 'Key AKEY-7742 has been used from 203.0.113.12 since Saturday 01:40. It created a new user "svc-backup2" with administrator rights and its own access keys, started about 60 large machines in four regions, and read the secrets store, including a database password.' },
          text: 'The attacker has made their own user, is running machines at your expense, and has read secrets.',
        }),
      },
      {
        id: 'repo', group: 'Investigate', label: 'Look at the repository and its history', hint: 'How did the key get there?', tag: 'useful',
        run: () => ({
          reveal: { repo: 'The key was committed on Friday in a configuration file. The developer deleted it in a later commit, but it remains in the repository\'s history, which is public. Automated tools that watch for keys will already have found it.' },
          text: 'The key is in the public history. Deleting a file does not remove it from history, and others have likely copied it.',
        }),
      },
      {
        id: 'scan', group: 'Investigate', label: 'Scan every repository in the company for other secrets', hint: 'Look for more leaks?', tag: 'weak',
        run: () => ({ text: 'The scan will take hours and turn up many old findings. Worth doing later. It does not stop what is happening right now.' }),
      },
      // ── Contain
      {
        id: 'preserve', group: 'Contain', label: 'Copy the audit log and the details of the attacker\'s machines and user to protected storage before you change anything', hint: 'Keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.activity && !s.flags.preserved,
        run: () => ({ set: { preserved: true }, disruption: 1, text: 'The audit trail, resource lists and the attacker\'s user details are copied to a protected account.' }),
      },
      {
        id: 'disable-key', group: 'Contain', label: 'Disable the leaked access key', hint: 'Stop its use.', tag: 'key',
        when: (s) => !!s.facts.activity && s.flags.keyActive,
        run: () => ({ set: { keyActive: false }, disruption: 2, text: 'The leaked key stops working. The attacker\'s own user is untouched.' }),
      },
      {
        id: 'remove-user', group: 'Contain', label: 'Disable the attacker\'s user svc-backup2 and every key it owns', hint: 'Remove the way back.', tag: 'key',
        when: (s) => !!s.facts.activity && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 2, text: 'The user and its keys are disabled. The attacker has no working access left.' }),
      },
      {
        id: 'stop-machines', group: 'Contain', label: 'Stop the attacker\'s machines and delete them', hint: 'Stop the spend.', tag: 'key',
        when: (s) => !!s.facts.activity && s.flags.machinesRunning,
        run: (s) => ({ set: { machinesRunning: false, evidenceLost: !s.flags.preserved }, disruption: 2, text: s.flags.preserved ? 'The machines are stopped and deleted. Their details were saved first.' : 'The machines are deleted. Their contents and details, which would show what they were doing, are gone.' }),
      },
      {
        id: 'rotate-secrets', group: 'Eradicate & recover', label: 'Replace the secrets the attacker read, starting with the database password', hint: 'Protect what they saw.', tag: 'key',
        when: (s) => !!s.facts.activity && !s.flags.secretsRotated,
        run: () => ({ set: { secretsRotated: true }, disruption: 5, text: 'The database password and other secrets are replaced, and the applications pick up the new values. The stolen copies no longer work.' }),
      },
      {
        id: 'private', group: 'Contain', label: 'Make the repository private', hint: 'Stop further copying.', tag: 'useful',
        when: (s) => !!s.facts.repo && !s.flags.repoPrivate,
        run: () => ({ set: { repoPrivate: true }, text: 'The repository is private. Anyone who has already copied the key still has it.' }),
      },
      {
        id: 'purge', group: 'Contain', label: 'Rewrite the repository history to remove the key and treat the problem as solved', hint: 'Clean up the leak?', tag: 'bad',
        when: (s) => !!s.facts.repo,
        run: () => ({ set: { historyPurged: true }, threat: 5, text: 'The history is cleaned, but the key was copied the day it was posted. Cleaning the repository does nothing about copies elsewhere, and the key is still live.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the entire cloud account', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { shutdown: true, machinesRunning: false }, disruption: 60, text: 'The attacker\'s machines stop, and so does every customer service. The attacker\'s user and keys are untouched.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Tell the head of engineering and the data protection officer what is known', hint: 'A database password was read.', tag: 'useful',
        when: (s) => !!s.facts.activity,
        run: () => ({ set: { mgrTold: true }, text: 'The head of engineering is briefed, and the DPO starts an assessment because a database holding customer data may have been reached.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.keyActive && !s.flags.persistence && !s.flags.machinesRunning,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.keyActive && !s.flags.persistence && !s.flags.machinesRunning,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.keyActive ? { label: 'The leaked key was left working', points: -15 } : { label: 'The leaked key was disabled', points: 10 });
      out.push(s.flags.persistence ? { label: 'The attacker\'s own user was left in place', points: -15 } : { label: 'The attacker\'s user and keys were removed', points: 12 });
      if (s.flags.machinesRunning) out.push({ label: 'The attacker\'s machines were left running', points: -8 });
      if (s.flags.secretsMisused) out.push({ label: 'The stolen database password was used before it was replaced', points: -20 });
      else if (s.flags.secretsRotated) out.push({ label: 'Secrets replaced before they were misused', points: 12 });
      else out.push({ label: 'Secrets the attacker read were not replaced', points: -12 });
      if (s.flags.evidenceLost) out.push({ label: 'The attacker\'s machines were deleted before their details were saved', points: -12 });
      else if (s.flags.preserved) out.push({ label: 'Evidence saved before changes', points: 8 });
      if (s.flags.historyPurged) out.push({ label: 'Treated cleaning the repository as the fix', points: -8 });
      if (s.flags.mgrTold) out.push({ label: 'Leadership and the DPO informed', points: 6 });
      else out.push({ label: 'Leadership and the DPO not told', points: -8 });
      if (s.flags.shutdown) out.push({ label: 'Shut down the whole account', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept access, the secrets were misused, or you destroyed what you needed to investigate.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: secrets not replaced, evidence lost, or someone not told.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 120, name: 'Textbook', blurb: 'You saved the evidence, removed every way in, replaced the secrets in time and told the right people.' },
    ],
    debrief: [
      {
        id: 'ic-leak-history',
        question: 'The developer deleted the key from the repository on Friday. Why was that not enough?',
        options: [
          { text: 'The key stays in the repository\'s history, and automated tools copy keys within minutes of them being posted, so the key must be treated as stolen and replaced', correct: true, explain: 'Removing the file hides it from view but does not remove it from history, and others have probably already copied it. Only disabling the key helps.' },
          { text: 'Deleting a file always takes a week to apply', correct: false, explain: 'It applies immediately. The history is the issue.' },
          { text: 'A deleted key can still be guessed', correct: false, explain: 'Keys are not guessed. They are copied.' },
          { text: 'It was enough, and the attacker found another way', correct: false, explain: 'The attacker used the leaked key.' },
        ],
      },
      {
        id: 'ic-leak-order',
        question: 'Why replace the secrets the attacker read, and not just disable the keys?',
        options: [
          { text: 'The attacker already has copies of those secrets, which work from anywhere, even after their access is gone', correct: true, explain: 'Cutting off access stops new actions. It does not make copied passwords stop working. They must be replaced.' },
          { text: 'Because disabling keys deletes secrets', correct: false, explain: 'It does not.' },
          { text: 'Because secrets expire on their own', correct: false, explain: 'Many do not, and none should be relied on to.' },
          { text: 'There is no need if the key is disabled', correct: false, explain: 'The database password was used from the attacker\'s address if it was not replaced in time.' },
        ],
      },
    ],
  },
];
