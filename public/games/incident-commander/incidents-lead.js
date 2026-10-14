// Lead-level and cloud-track Incident Commander incidents (see incidents.js for the
// format). Everything here is fictional. IP addresses come from the reserved
// documentation ranges (203.0.113.0/24, 198.51.100.0/24).

export const LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'data-extortion',
    title: 'We have your data',
    skill: 'data',
    blurb: 'An email claims 40 GB of customer data has been stolen and will be published. Is it true, and what must you do first?',
    role: 'Incident lead, Contoso',
    startClock: '09:15',
    minutesPerUnit: 20,
    maxTime: 12,
    brief: [
      'Wednesday, 09:15. The CEO has forwarded you an email from a group claiming to have stolen 40 GB of customer data. It includes 100 sample records, demands £120,000 in cryptocurrency within five days, and says the data will be published if you do not pay.',
      'You are the incident lead. You do not yet know whether the claim is true. Work out what is real, stop anything that is still going on, and meet your legal and communication duties without paying and without panicking. Every action takes time.',
    ],
    initial: {
      flags: {
        tokenActive: true, // the stolen API token still works
        tokenRevoked: false,
        tokensAudited: false,
        legalTold: false,
        dpoTold: false,
        icoStarted: false,
        reported: false,
        holdingStatement: false,
        customersPrepared: false,
        mgrTold: false,
        paid: false,
        replied: false,
        tellNow: false,
        tookDown: false,
      },
    },
    passive: (s) => (s.flags.tokenActive ? 5 : 0),
    events: [
      {
        id: 'more-theft', at: 3, expires: true,
        when: (s) => s.flags.tokenActive,
        run: () => ({ threat: 12, severity: 'high', text: 'The attacker pulls another export using the same token: 6 GB more customer data.' }),
      },
      {
        id: 'journalist', at: 6, expires: true,
        when: (s) => !s.flags.holdingStatement,
        run: () => ({ disruption: 14, severity: 'high', text: 'A journalist emails asking for comment: the group has contacted them. You have no prepared line, and staff begin guessing on social media.' }),
      },
      {
        id: 'publish-sample', at: 9, expires: true,
        when: (s) => s.flags.tokenActive,
        run: () => ({ threat: 15, severity: 'high', text: 'The group posts a sample of 1,000 records on a leak site to add pressure, because the stolen access is still live.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'sample', group: 'Investigate', label: 'Check the 100 sample records against your own systems', hint: 'Is the claim even true?', tag: 'key',
        run: () => ({
          reveal: { sample: 'All 100 sample records match real customers: names, emails, postcodes and order history. The fields match the export format of the ReportHub analytics tool, not the main database. There is no card data and no password in any of them.' },
          text: 'The claim is credible, and the data looks like it came from ReportHub, the analytics tool, rather than the main customer database.',
        }),
      },
      {
        id: 'logs', group: 'Investigate', label: 'Review the ReportHub API and access logs', hint: 'How could anyone take it?', tag: 'key',
        when: (s) => !!s.facts.sample,
        run: () => ({
          reveal: { logs: 'An API token created 14 months ago for a former contractor has been used every day for six weeks from 203.0.113.58, pulling complete customer exports. The token is still valid.' },
          text: 'There it is: a forgotten API token, still working, has been quietly taking data for six weeks.',
        }),
      },
      {
        id: 'scope', group: 'Investigate', label: 'Work out how many people and which fields are affected', hint: 'You will need this for the regulator.', tag: 'key',
        when: (s) => !!s.facts.logs,
        run: () => ({
          reveal: { scope: 'About 210,000 customers: names, emails, postcodes and order history. No payment cards or passwords. Roughly 40 GB in total.' },
          text: 'You now know the scale: about 210,000 people and the exact fields. Without this you could not describe the breach to anyone.',
        }),
      },
      {
        id: 'egress', group: 'Investigate', label: 'Check firewall and data loss logs for any other data leaving', hint: 'Is it only ReportHub?', tag: 'useful',
        when: (s) => !!s.facts.sample,
        run: () => ({
          reveal: { egress: 'No sign of the main database, the file servers or email being accessed. The activity is limited to ReportHub.' },
          text: 'The loss looks limited to ReportHub. That tells you where to focus, and what you do not need to shut down.',
        }),
      },
      // ── Contain
      {
        id: 'revoke-token', group: 'Contain', label: 'Revoke the API token and rotate ReportHub\'s other credentials', hint: 'Stop the theft.', tag: 'key',
        when: (s) => !!s.facts.logs && !s.flags.tokenRevoked,
        run: () => ({ set: { tokenRevoked: true, tokenActive: false }, disruption: 3, text: 'The token is revoked and ReportHub\'s other credentials are rotated. The attacker can no longer pull data.' }),
      },
      {
        id: 'audit-tokens', group: 'Contain', label: 'Audit every other API token and contractor account', hint: 'Are there more forgotten keys?', tag: 'useful',
        when: (s) => !!s.facts.logs && !s.flags.tokensAudited,
        run: () => ({
          set: { tokensAudited: true },
          reveal: { tokens: 'Three more unused tokens belonging to former staff and contractors were found and disabled.' },
          disruption: 2,
          text: 'Three more forgotten tokens are found and disabled before anyone else uses them.',
        }),
      },
      {
        id: 'ip-block', group: 'Contain', label: 'Block 203.0.113.58 at the firewall', hint: 'Cut off that address.', tag: 'weak',
        run: () => ({ text: 'The address is blocked. An attacker with a working token will simply use another one within minutes, so it does not solve the problem.' }),
      },
      {
        id: 'takedown', group: 'Contain', label: 'Take the website and the reporting tool offline', hint: 'Stop everything?', tag: 'overreact',
        run: () => ({ set: { tookDown: true }, disruption: 35, text: 'You take the website and ReportHub offline. Customers cannot order, and the token still works against the API. Nothing was solved.' }),
      },
      // ── Legal and communication
      {
        id: 'legal', group: 'Legal and communication', label: 'Bring in Legal counsel and notify the cyber insurer', hint: 'Before anyone talks to the attackers.', tag: 'key',
        run: () => ({ set: { legalTold: true }, text: 'Legal counsel take over advice on regulators, contracts and communications. The cyber insurer\'s response team joins the call.' }),
      },
      {
        id: 'dpo', group: 'Legal and communication', label: 'Tell the Data Protection Officer', hint: 'Personal data may have been taken.', tag: 'key',
        run: () => ({ set: { dpoTold: true }, text: 'The DPO treats it as a likely personal data breach. The 72-hour reporting window runs from when the company became aware, so it has already started.' }),
      },
      {
        id: 'ico', group: 'Legal and communication', label: 'Start the notification to the Information Commissioner\'s Office (ICO)', hint: 'Within 72 hours of awareness.', tag: 'key',
        when: (s) => s.flags.dpoTold && !!s.facts.scope && !s.flags.icoStarted,
        run: () => ({ set: { icoStarted: true }, text: 'The ICO notification is drafted with the data types, the number of people, the likely effects and the steps taken. It is on track to go in well inside 72 hours.' }),
      },
      {
        id: 'police', group: 'Legal and communication', label: 'Report the extortion to the police fraud reporting service and the NCSC', hint: 'Law enforcement and national guidance.', tag: 'useful',
        run: () => ({ set: { reported: true }, text: 'The extortion is reported. The NCSC and the police can advise and help track the group.' }),
      },
      {
        id: 'holding', group: 'Legal and communication', label: 'Prepare a holding statement and brief customer services and press', hint: 'Be ready if it becomes public.', tag: 'useful',
        run: () => ({ set: { holdingStatement: true }, text: 'A short, accurate holding statement is agreed, and customer services and the press office know what to say and what not to.' }),
      },
      {
        id: 'customers', group: 'Legal and communication', label: 'Draft the notice to affected customers for the DPO to approve', hint: 'Ready when the risk is confirmed.', tag: 'useful',
        when: (s) => s.flags.dpoTold && !!s.facts.scope && !s.flags.customersPrepared,
        run: () => ({ set: { customersPrepared: true }, text: 'A clear customer notice is drafted, with what was taken, what it means for them and what they should do. It is ready to send once the DPO confirms.' }),
      },
      {
        id: 'mgr', group: 'Legal and communication', label: 'Brief the executive team', hint: 'Keep leadership informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The executive team is briefed with what is known and what is not, and agrees a single spokesperson.' }),
      },
      {
        id: 'tell-now', group: 'Legal and communication', label: 'Email all customers now that they have been breached', hint: 'Tell everyone straight away?', tag: 'overreact',
        run: () => ({ set: { tellNow: true }, disruption: 15, text: 'The email goes out before you know the scope or the wording is agreed. It is inaccurate in places, panics customers and floods the call centre.' }),
      },
      {
        id: 'reply', group: 'Legal and communication', label: 'Reply to the attackers to start negotiating', hint: 'Buy some time?', tag: 'bad',
        run: () => ({ set: { replied: true }, threat: 8, text: 'Replying without legal and law-enforcement advice invites escalation and may expose the company legally. The group now knows you are worried.' }),
      },
      {
        id: 'pay', group: 'Legal and communication', label: 'Agree to pay the £120,000', hint: 'Make it go away?', tag: 'bad',
        run: () => ({ set: { paid: true }, threat: 15, text: 'The NCSC and law enforcement advise against paying. It funds crime, it does not guarantee the data is deleted, and the stolen token is still working.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the theft stopped and move to recovery and notification', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.tokenActive,
        run: () => ({ text: 'You declare the theft stopped and move to recovery and notification.' }),
      },
    ],
    contained: (s) => !s.flags.tokenActive,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.tokenRevoked ? { label: 'The stolen token was revoked', points: 12 } : { label: 'The stolen token was left working', points: -14 });
      out.push(s.flags.dpoTold ? { label: 'DPO told and the 72-hour clock managed', points: 10 } : { label: 'DPO not told', points: -12 });
      out.push(s.flags.icoStarted ? { label: 'ICO notification started in time', points: 10 } : { label: 'No ICO notification started', points: -8 });
      out.push(s.flags.legalTold ? { label: 'Legal counsel and insurer involved early', points: 8 } : { label: 'Legal not involved', points: -6 });
      if (s.flags.reported) out.push({ label: 'Reported to law enforcement and the NCSC', points: 5 });
      out.push(s.flags.holdingStatement ? { label: 'Holding statement ready', points: 5 } : { label: 'No holding statement when the press called', points: -4 });
      if (s.flags.tokensAudited) out.push({ label: 'Other forgotten tokens found and disabled', points: 5 });
      if (s.flags.customersPrepared) out.push({ label: 'Customer notice prepared for approval', points: 5 });
      if (s.flags.mgrTold) out.push({ label: 'Executive team briefed', points: 4 });
      if (s.flags.tellNow) out.push({ label: 'Told every customer before the facts were known', points: -10 });
      if (s.flags.tookDown) out.push({ label: 'Took the business offline without stopping the theft', points: -8 });
      if (s.flags.replied) out.push({ label: 'Engaged with the attackers without advice', points: -10 });
      if (s.flags.paid) out.push({ label: 'Agreed to pay the ransom demand', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The theft went on, and the company lost control of what happened next.' },
      { min: 55, name: 'Costly', blurb: 'The theft was stopped, but late, with gaps in who was told or what was said.' },
      { min: 100, name: 'Solid', blurb: 'The theft stopped, the right people were involved and the main duties were met.' },
      { min: 150, name: 'Textbook', blurb: 'You verified before reacting, stopped the theft at its source, met the 72-hour duty and stayed calm in public.' },
    ],
    debrief: [
      {
        id: 'ic-extort-verify',
        question: 'The attackers sent 100 sample records. What is the best first step?',
        options: [
          { text: 'Check whether the sample is genuine by matching it to your own data, and use that to find where it came from', correct: true, explain: 'A claim is not a fact. Matching the sample to your systems told you the claim was real and led you to ReportHub and the leaked token.' },
          { text: 'Assume it is a bluff and ignore it', correct: false, explain: 'Many extortion claims are true. Ignoring one could leave a live theft going on.' },
          { text: 'Assume it is all true and tell every customer at once', correct: false, explain: 'You do not yet know the scope or the facts. Premature notification can be inaccurate and cause panic.' },
          { text: 'Ask the attackers for more proof', correct: false, explain: 'Engaging them invites escalation, and you can verify the data yourself.' },
        ],
      },
      {
        id: 'ic-extort-72',
        question: 'When must a personal data breach normally be reported to the ICO?',
        options: [
          { text: 'Within 72 hours of becoming aware of it, unless it is unlikely to result in a risk to people', correct: true, explain: 'UK GDPR sets a 72-hour limit from awareness. A report can be made in stages if all the details are not yet known.' },
          { text: 'Within 30 days, once the investigation is complete', correct: false, explain: 'That is far too late. The clock runs from when you become aware, not from when you finish investigating.' },
          { text: 'Only if the attackers publish the data', correct: false, explain: 'The duty arises from the breach and the risk to people, whether or not anything is published.' },
          { text: 'Never, if the data did not include payment cards', correct: false, explain: 'Names, emails and purchase histories are personal data, and a breach of them can put people at risk.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'exposed-console',
    title: 'The open admin console',
    skill: 'data',
    blurb: 'Your cloud bill is climbing and the cluster is at full load. The management console has no sign-in.',
    role: 'On-call cloud security analyst, Contoso',
    startClock: '07:40',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Saturday, 07:40. A cost alert and a performance alert have fired together: the production container cluster is running at full load and the bill is climbing. You are on call.',
      'Containers are packaged applications running together on shared servers. Work out what is running that should not be, how it got there, and what it could already have taken. The order of your actions matters, because an attacker who can still get in will simply undo your clean-up.',
    ],
    initial: {
      flags: {
        exposed: true, // the management console is open to the internet with no sign-in
        minerRunning: true,
        persistence: true, // a scheduled job the attacker planted on a node
        secretsRotated: false,
        nodeCleaned: false,
        dbAccessed: false,
        redeployed: false,
        mgrTold: false,
        dpoTold: false,
        tookDown: false,
      },
    },
    passive: (s) => (s.flags.minerRunning ? 2 : 0) + (s.flags.exposed ? 3 : 0),
    events: [
      {
        id: 'db-login', at: 7, expires: true,
        when: (s) => !s.flags.secretsRotated,
        run: () => ({ set: { dbAccessed: true }, threat: 25, severity: 'high', text: 'Someone logs in to the production database from 203.0.113.58 using the password that was read from the cluster\'s secrets.' }),
      },
      {
        id: 'comes-back', at: 9, expires: true,
        when: (s) => s.flags.persistence && !s.flags.nodeCleaned,
        run: () => ({ set: { minerRunning: true }, threat: 15, severity: 'high', text: 'The miner returns. A scheduled job planted on a node downloads and starts it again.' }),
      },
    ],
    reactions: [
      {
        id: 'redeploy',
        when: (s) => !s.flags.minerRunning && s.flags.exposed && !s.flags.redeployed,
        run: () => ({ set: { minerRunning: true, redeployed: true }, threat: 15, severity: 'high', text: 'The attacker still has an open console, so they simply deploy the miner again. Removing the workload without closing the door achieved nothing.' }),
      },
    ],
    actions: [
      // ── Investigate
      {
        id: 'workloads', group: 'Investigate', label: 'List what is running on the cluster', hint: 'What is using all the capacity?', tag: 'key',
        run: () => ({
          reveal: { workloads: 'A workload called "sys-cache" that nobody on the team deployed is running 12 copies. Its image is from an unknown public registry and its process is a cryptocurrency miner.' },
          text: 'A workload called "sys-cache" is a cryptocurrency miner. It is what is draining the capacity and the budget.',
        }),
      },
      {
        id: 'exposure', group: 'Investigate', label: 'Check how that workload was deployed', hint: 'Who put it there?', tag: 'key',
        when: (s) => !!s.facts.workloads,
        run: () => ({
          reveal: { exposure: 'The cluster\'s management console is reachable from the internet and does not require a sign-in. The audit log shows the deployment came from 203.0.113.58 at 02:14.' },
          text: 'The management console is open to the whole internet with no sign-in. That is how the attacker got in.',
        }),
      },
      {
        id: 'secrets', group: 'Investigate', label: 'Check whether secrets were read', hint: 'What else could they have taken?', tag: 'key',
        when: (s) => !!s.facts.exposure,
        run: () => ({
          reveal: { secrets: 'The attacker\'s workload mounted the namespace secrets, and the audit log shows the production database password being read at 02:20.' },
          text: 'The database password was read. The attacker may now be able to reach the production database directly.',
        }),
      },
      {
        id: 'nodes', group: 'Investigate', label: 'Check the cluster servers (nodes) for signs the attacker went further', hint: 'Did they escape the container?', tag: 'key',
        when: (s) => !!s.facts.exposure,
        run: () => ({
          reveal: { nodes: 'A privileged workload mounted the host file system on node-3, and a scheduled job on node-3 now downloads and starts the miner every few hours.' },
          text: 'The attacker left a way back: a scheduled job on node-3 that reinstalls the miner. Deleting the workload alone will not end this.',
        }),
      },
      // ── Contain
      {
        id: 'restrict', group: 'Contain', label: 'Restrict the console to the company network and require sign-in', hint: 'Close the door.', tag: 'key',
        when: (s) => !!s.facts.exposure && s.flags.exposed,
        run: () => ({ set: { exposed: false }, disruption: 3, text: 'The console is restricted to the company network and sign-in is required. The attacker can no longer reach it.' }),
      },
      {
        id: 'delete-miner', group: 'Contain', label: 'Delete the "sys-cache" workload', hint: 'Remove the miner.', tag: 'useful',
        when: (s) => !!s.facts.workloads && s.flags.minerRunning,
        run: () => ({ set: { minerRunning: false }, disruption: 2, text: 'The "sys-cache" workload is deleted and the capacity comes back.' }),
      },
      {
        id: 'rotate-secrets', group: 'Contain', label: 'Rotate the database password and every secret the cluster holds', hint: 'They were read.', tag: 'key',
        when: (s) => !!s.facts.secrets && !s.flags.secretsRotated,
        run: () => ({ set: { secretsRotated: true }, disruption: 6, text: 'The database password and the other secrets are rotated and the applications are updated. The stolen password no longer works.' }),
      },
      {
        id: 'clean-node', group: 'Contain', label: 'Remove the scheduled job and rebuild node-3 from a clean image', hint: 'Remove the way back.', tag: 'key',
        when: (s) => !!s.facts.nodes && !s.flags.nodeCleaned,
        run: () => ({ set: { nodeCleaned: true, persistence: false }, disruption: 4, text: 'node-3 is drained and rebuilt from a clean image. The scheduled job is gone.' }),
      },
      {
        id: 'scale', group: 'Contain', label: 'Scale the cluster down to cut the cost', hint: 'Limit the bill.', tag: 'weak',
        run: () => ({ disruption: 6, text: 'The bill stops climbing as quickly, but the miner, the open console and the attacker are all still there.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the whole production cluster', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { minerRunning: false, tookDown: true }, disruption: 45, text: 'The miner stops, and so does every customer-facing service. The console is still open and the secrets still compromised.' }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the on-call manager', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The on-call manager is briefed and makes sure the business knows what is affected.' }),
      },
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the Data Protection Officer that the database password was read', hint: 'Personal data may be at risk.', tag: 'useful',
        when: (s) => !!s.facts.secrets,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts working out whether personal data in the database was accessed, and whether a report is needed.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.minerRunning && !s.flags.exposed,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.minerRunning && !s.flags.exposed,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.exposed ? { label: 'The console was left open to the internet', points: -14 } : { label: 'The console was closed to the internet', points: 12 });
      out.push(s.flags.secretsRotated ? { label: 'Exposed secrets rotated', points: 10 } : { label: 'Exposed secrets left working', points: -12 });
      out.push(s.flags.nodeCleaned ? { label: 'The attacker\'s scheduled job removed and node rebuilt', points: 10 } : { label: 'The attacker\'s way back left in place', points: -10 });
      if (s.flags.dbAccessed) out.push({ label: 'The database was logged in to with the stolen password', points: -15 });
      if (s.flags.dpoTold) out.push({ label: 'DPO told that the database password was read', points: 6 });
      if (s.flags.mgrTold) out.push({ label: 'On-call manager briefed', points: 4 });
      if (s.flags.redeployed) out.push({ label: 'Removed the miner before closing the door, so it came straight back', points: -10 });
      if (s.flags.tookDown) out.push({ label: 'Shut down the whole production cluster', points: -10 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker kept control and took more than they should have.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with a clean-up out of order or steps missing.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'You closed the door first, removed the attacker\'s foothold and rotated what was read.' },
    ],
    debrief: [
      {
        id: 'ic-console-order',
        question: 'Why does the order of your clean-up matter in this incident?',
        options: [
          { text: 'Close the attacker\'s way in first, then remove what they planted. Otherwise they can simply redeploy it', correct: true, explain: 'The open console was the way in. Deleting the miner first leaves them free to put it straight back, as happened if you tried it that way.' },
          { text: 'Always delete the malicious workload first, because it costs money', correct: false, explain: 'Stopping the cost matters, but the attacker can restore it in minutes if the door is still open.' },
          { text: 'The order does not matter if you do everything within an hour', correct: false, explain: 'It matters a great deal. Wasted clean-up steps just give the attacker more time.' },
          { text: 'Shut down everything and start again', correct: false, explain: 'It takes down the business and leaves the stolen secrets and the open console untouched.' },
        ],
      },
      {
        id: 'ic-console-secrets',
        question: 'You cannot prove the attacker used the database password. Why rotate it anyway?',
        options: [
          { text: 'It was read from the cluster, so it must be treated as compromised', correct: true, explain: 'Once a secret has been read by an attacker, you have to assume it is theirs. Rotating it is cheap, and not rotating it can lead to a database breach.' },
          { text: 'Passwords should always be rotated on Saturdays', correct: false, explain: 'There is no such rule. The reason is that this one was exposed.' },
          { text: 'It is unnecessary: the attacker only wanted the miner', correct: false, explain: 'You cannot know their aims, and they read a database password for a reason.' },
          { text: 'To make the incident look more serious in the report', correct: false, explain: 'Reports should state the facts. You rotate because the secret was exposed.' },
        ],
      },
    ],
  },
];
