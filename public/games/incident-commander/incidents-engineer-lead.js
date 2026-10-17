// Senior Security Engineer Incident Commander incidents (see incidents.js for the format). Everything
// here is fictional. IP addresses come from the reserved documentation ranges. Platform terms are generic.

export const ENGINEER_LEAD = [
  {
    id: 'cluster-breakout',
    title: 'The container that reached the host',
    skill: 'hardening',
    blurb: 'A service on your shared container platform is running a program nobody deployed. It has reached beyond its container. Contain it without taking down thirty teams, and keep the evidence.',
    role: 'Senior security engineer, Contoso',
    startClock: '14:05',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Tuesday, 14:05. An alert shows a customer-facing service on the shared container platform making outbound connections to an unknown address, and starting a program that is not in its image.',
      'You are the senior security engineer on call. Thirty teams run on this platform. Every action takes time, and the platform team wants to be told before you change anything that could affect other teams.',
    ],
    initial: {
      flags: {
        footholdLive: true, // the attacker's program is running in the pod
        tokenActive: true, // the service's access token has been stolen and works
        persistence: true, // a scheduled job was created to bring the foothold back
        snapshotTaken: false,
        isolated: false,
        spread: false,
        nodeRebuilt: false,
        mgrTold: false,
        shutdown: false,
        evidenceLost: false,
        usedLatest: false,
      },
    },
    passive: (s) => (s.flags.footholdLive ? 4 : 0) + (s.flags.tokenActive ? 3 : 0) + (s.flags.persistence ? 2 : 0),
    events: [
      {
        id: 'lateral', at: 6, expires: true,
        // With a working token and no isolation, the attacker starts a program in a second team's space.
        when: (s) => s.flags.tokenActive && !s.flags.isolated,
        run: () => ({ set: { spread: true }, threat: 22, severity: 'high', text: 'The stolen token is used to start a program in another team\'s space on the platform.' }),
      },
      {
        id: 'job-returns', at: 9, expires: true,
        when: (s) => s.flags.persistence && !s.flags.footholdLive,
        run: () => ({ set: { footholdLive: true }, threat: 15, severity: 'high', text: 'The scheduled job the attacker created starts the program again. The foothold is back.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'audit', group: 'Investigate', label: 'Read the platform audit log for the service and its token', hint: 'What did it do, and what can the token do?', tag: 'key',
        run: () => ({
          reveal: { audit: 'The service\'s token was used from 203.0.113.91 to list other namespaces and read a secret. The token has permission to create workloads in the namespace.' },
          text: 'The token is stolen, and it can create workloads. It has already been used from outside.',
        }),
      },
      {
        id: 'inspect', group: 'Investigate', label: 'Inspect the suspect workload and its configuration', hint: 'How did it get beyond its container?', tag: 'key',
        when: (s) => !!s.facts.audit,
        run: () => ({
          reveal: { inspect: 'The workload runs as administrator with the host\'s file system mounted. The unknown program was written to the host\'s disk and a scheduled job was created that restarts it.' },
          text: 'The container has a window onto the host, and the attacker has made a way to come back.',
        }),
      },
      {
        id: 'image', group: 'Investigate', label: 'Check where the service\'s image came from', hint: 'Was it the way in?', tag: 'useful',
        when: (s) => !!s.facts.audit,
        run: () => ({
          reveal: { image: 'The image was pulled from a public source by the tag "latest", and its contents changed nine days ago.' },
          text: 'The image changed after it was approved. It is the likely way in.',
        }),
      },
      {
        id: 'fullscan', group: 'Investigate', label: 'Run a full vulnerability scan of every workload on the platform', hint: 'Look for the weakness?', tag: 'weak',
        run: () => ({ text: 'The scan will take hours and lists hundreds of routine findings. It tells you nothing about what is happening now.' }),
      },
      // ── Contain
      {
        id: 'snapshot', group: 'Contain', label: 'Capture the workload\'s files, memory and logs before changing anything', hint: 'Keep the evidence.', tag: 'key',
        when: (s) => !!s.facts.audit && !s.flags.snapshotTaken,
        run: () => ({ set: { snapshotTaken: true }, disruption: 1, text: 'Files, running processes and logs are captured and stored safely for the investigation.' }),
      },
      {
        id: 'isolate', group: 'Contain', label: 'Cut the workload\'s network access, and block the namespace from reaching other teams', hint: 'Stop it spreading and calling home.', tag: 'key',
        when: (s) => !!s.facts.audit && !s.flags.isolated,
        run: () => ({ set: { isolated: true, footholdLive: false }, disruption: 4, text: 'The workload can no longer reach outside or other teams. The attacker\'s connection is cut. The service itself is still there for investigation.' }),
      },
      {
        id: 'revoke', group: 'Contain', label: 'Revoke the stolen token and issue the service a new one', hint: 'Remove the attacker\'s access.', tag: 'key',
        when: (s) => !!s.facts.audit && s.flags.tokenActive,
        run: () => ({ set: { tokenActive: false }, disruption: 3, text: 'The token is revoked. The stolen copy no longer works and the service gets a fresh credential.' }),
      },
      {
        id: 'remove-job', group: 'Contain', label: 'Delete the attacker\'s scheduled job and the permission that let the service create it', hint: 'Remove the way back.', tag: 'key',
        when: (s) => !!s.facts.inspect && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 3, text: 'The job is deleted. The service\'s permissions are cut to what it actually uses, which no longer includes creating workloads.' }),
      },
      {
        id: 'kill-pod', group: 'Contain', label: 'Delete the workload immediately', hint: 'Stop it fast?', tag: 'bad',
        run: (s) => ({ set: { footholdLive: false, evidenceLost: !s.flags.snapshotTaken }, disruption: 6, text: s.flags.snapshotTaken ? 'The workload is deleted. The attacker keeps their token and their scheduled job.' : 'The workload is deleted and with it the files and memory you needed. The attacker keeps their token and their scheduled job.' }),
      },
      {
        id: 'rebuild', group: 'Eradicate & recover', label: 'Rebuild the host from a clean image and redeploy the service from the company registry', hint: 'Make sure nothing is left on the host.', tag: 'key',
        when: (s) => !!s.facts.inspect && s.flags.snapshotTaken && !s.flags.nodeRebuilt,
        run: () => ({ set: { nodeRebuilt: true }, disruption: -8, text: 'The host is rebuilt from a clean image, and the service returns from the company\'s signed image. Other teams on that host are moved without a break.' }),
      },
      {
        id: 'redeploy', group: 'Eradicate & recover', label: 'Redeploy the same image so the service comes straight back', hint: 'Restore service quickly?', tag: 'bad',
        run: () => ({ set: { usedLatest: true }, threat: 20, text: 'The same image that was tampered with is running again, on the same host.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the whole platform', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { shutdown: true, footholdLive: false }, disruption: 60, text: 'Thirty teams\' services go down, and the attacker\'s token and scheduled job remain untouched.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Tell the platform lead and the on-call manager what is happening and what you will change', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The platform lead and the on-call manager are told. They cover communication to the other teams and agree to the changes.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.footholdLive && !s.flags.tokenActive && !s.flags.persistence,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.footholdLive && !s.flags.tokenActive && !s.flags.persistence,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.tokenActive ? { label: 'The stolen token was left working', points: -15 } : { label: 'The stolen token was revoked', points: 10 });
      out.push(s.flags.persistence ? { label: 'The attacker\'s scheduled job was left in place', points: -15 } : { label: 'The scheduled job and its permission were removed', points: 12 });
      if (s.flags.spread) out.push({ label: 'The attacker reached another team\'s space', points: -15 });
      else if (s.flags.isolated) out.push({ label: 'The workload and namespace were isolated before it spread', points: 10 });
      if (s.flags.evidenceLost) out.push({ label: 'The workload was deleted before the evidence was captured', points: -15 });
      else if (s.flags.snapshotTaken) out.push({ label: 'Evidence captured before changes', points: 8 });
      if (s.flags.nodeRebuilt) out.push({ label: 'The host was rebuilt from a clean image', points: 14 });
      else out.push({ label: 'The host was not rebuilt, so the attacker\'s file may remain', points: -16 });
      if (s.flags.usedLatest) out.push({ label: 'The tampered image was redeployed', points: -25 });
      if (s.flags.mgrTold) out.push({ label: 'Platform lead and on-call manager informed', points: 5 });
      else out.push({ label: 'Platform leadership not told', points: -5 });
      if (s.flags.shutdown) out.push({ label: 'Shut down the whole platform', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept access, spread, or you destroyed what you needed to investigate.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: evidence lost, a way back left, or the host not cleaned.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 118, name: 'Textbook', blurb: 'You kept the evidence, cut off the attacker\'s access, removed their way back, cleaned the host and kept the other teams running.' },
    ],
    debrief: [
      {
        id: 'ic-cluster-evidence',
        question: 'Why capture the workload before isolating or rebuilding anything?',
        options: [
          { text: 'Memory and files disappear when a workload is deleted, and you need them to learn how far the attacker got', correct: true, explain: 'Evidence is lost when you delete or rebuild. Capture first, then contain, then clean up.' },
          { text: 'Capturing makes the attacker leave', correct: false, explain: 'It does not affect the attacker.' },
          { text: 'It is required before any network change', correct: false, explain: 'It is good practice because of the evidence, not a technical requirement.' },
          { text: 'There is no need, because the logs are enough', correct: false, explain: 'Logs show what was recorded. The files and memory show what the attacker actually ran.' },
        ],
      },
      {
        id: 'ic-cluster-image',
        question: 'What would have prevented the attacker\'s way in?',
        options: [
          { text: 'Only running signed images from a trusted registry, pinned to a fixed digest rather than a tag that can change', correct: true, explain: 'A tag like "latest" can be swapped silently. A signed, pinned image cannot.' },
          { text: 'Running a bigger server', correct: false, explain: 'Irrelevant to image trust.' },
          { text: 'Renaming the service', correct: false, explain: 'It changes nothing about how the image was tampered with.' },
          { text: 'A longer password for the platform team', correct: false, explain: 'The way in was a changed image, not a password.' },
        ],
      },
    ],
  },
];
