// More Incident Commander incidents (see incidents.js for the format).
// Everything here is fictional.

export const EXTRA = [
  {
    id: 'ransomware-day',
    title: 'Ransomware on Tuesday',
    skill: 'data',
    blurb: 'Files on the finance share are being encrypted. Stop it, protect the backups, and recover without reinfecting the network.',
    role: 'Incident lead, Contoso SOC',
    startClock: '10:05',
    minutesPerUnit: 5,
    maxTime: 12,
    brief: [
      'Tuesday, 10:05. The helpdesk reports that files on the finance share have strange ".locked" extensions, and a note has appeared in the folders. Your EDR shows mass file changes on FILESRV01.',
      'You are the incident lead until the incident manager arrives. Every action takes time, and the encryption is still running. Think about what must be protected before it is attacked, and what must be cleaned before you restore.',
    ],
    initial: {
      flags: {
        encrypting: true,
        pzIsolated: false, // patient zero (the infected laptop)
        srvIsolated: false,
        sharesOff: false,
        backupsProtected: false,
        backupsHit: false,
        persistence: true, // patient zero still carries the attacker's foothold
        credsReset: false,
        restored: false,
        reinfected: false,
        paid: false,
        mgrTold: false,
        dpoTold: false,
        reported: false,
        evidenceLost: false,
      },
    },
    passive: (s) => (s.flags.encrypting ? 7 : 0),
    events: [
      {
        id: 'spread1', at: 1, expires: true,
        when: (s) => s.flags.encrypting && !s.flags.srvIsolated,
        run: () => ({ threat: 10, severity: 'high', text: 'The encryption has spread to a second share on FILESRV01.' }),
      },
      {
        id: 'backups-hit', at: 4, expires: true,
        // The attacker holds stolen credentials, so stopping the encryption is not
        // enough: until the backups are locked down or the credentials are reset,
        // they can go after the backups from anywhere.
        when: (s) => !s.flags.backupsProtected && !s.flags.credsReset,
        run: () => ({ set: { backupsHit: true }, threat: 20, severity: 'high', text: 'Using the stolen credentials, the attacker has reached BACKUP01. The backups themselves are being encrypted.' }),
      },
      {
        id: 'spread2', at: 6, expires: true,
        when: (s) => s.flags.encrypting,
        run: () => ({ threat: 15, severity: 'high', text: 'The encryption has reached FILESRV02 and the drawings share.' }),
      },
    ],
    reactions: [
      {
        id: 'reinfect',
        when: (s) => s.flags.restored && s.flags.persistence && !s.flags.reinfected,
        run: () => ({
          set: { encrypting: true, restored: false, reinfected: true },
          threat: 25,
          severity: 'high',
          text: 'The restored files are being encrypted again. Patient zero was never cleaned, so it simply started over.',
        }),
      },
    ],
    actions: [
      // ── Investigate
      {
        id: 'edr', group: 'Investigate', label: 'Review the EDR alerts for the first sign of the attack', hint: 'Where did it start?', tag: 'key',
        run: () => ({
          reveal: { edr: 'The first EDR alert came from LAPTOP-114 at 09:41, after a user opened a macro-enabled document. Using m.okoye\'s credentials, it then reached FILESRV01 over SMB and began encrypting shares. LAPTOP-114 is patient zero.' },
          text: 'The EDR trail leads back to one laptop, LAPTOP-114, and one account. That is where the encryption is being driven from.',
        }),
      },
      {
        id: 'backups', group: 'Investigate', label: 'Check the state of the backups', hint: 'Can you recover, and are the backups safe?', tag: 'key',
        run: () => ({
          reveal: { backups: 'BACKUP01 is joined to the domain and reachable from the file servers, so the attacker can reach it too. The offline tape copy from Sunday night is intact.' },
          text: 'The online backups are exposed to the same network. The offline tapes are safe, but they are Sunday\'s.',
        }),
      },
      {
        id: 'note', group: 'Investigate', label: 'Read the ransom note', hint: 'What are they claiming?', tag: 'useful',
        run: () => ({
          reveal: { note: 'The note demands cryptocurrency within 72 hours and claims that data was copied before encryption (a "double extortion" threat).' },
          text: 'They claim to have stolen data as well as encrypted it. That changes who you must tell.',
        }),
      },
      // ── Contain
      {
        id: 'isolate-pz', group: 'Contain', label: 'Isolate LAPTOP-114 from the network', hint: 'Cut off the source.', tag: 'key',
        when: (s) => !!s.facts.edr && !s.flags.pzIsolated,
        run: () => ({ set: { pzIsolated: true, encrypting: false }, disruption: 3, text: 'LAPTOP-114 is cut off. With the driver gone, the encryption stops.' }),
      },
      {
        id: 'isolate-srv', group: 'Contain', label: 'Isolate FILESRV01 from the network', hint: 'Protect the server that is being hit.', tag: 'useful',
        when: (s) => !s.flags.srvIsolated,
        run: (s) => ({
          set: { srvIsolated: true, encrypting: !(s.flags.pzIsolated || s.flags.sharesOff) },
          disruption: 8,
          text: s.flags.pzIsolated || s.flags.sharesOff
            ? 'FILESRV01 is isolated and the encryption has nothing left to reach.'
            : 'FILESRV01 is isolated, but the infected laptop is still live and carries on hitting other shares.',
        }),
      },
      {
        id: 'shares', group: 'Contain', label: 'Disable file shares across the company', hint: 'Blunt, but it limits the spread.', tag: 'useful',
        when: (s) => !s.flags.sharesOff,
        run: (s) => ({
          set: { sharesOff: true, encrypting: !(s.flags.pzIsolated || s.flags.srvIsolated) },
          disruption: 12,
          text: 'File sharing is switched off company-wide. It slows the spread, but nobody can open shared files.',
        }),
      },
      {
        id: 'protect-backups', group: 'Contain', label: 'Take BACKUP01 off the network and lock the backup credentials', hint: 'Protect your way back.', tag: 'key',
        when: (s) => !!s.facts.backups && !s.flags.backupsProtected,
        run: () => ({ set: { backupsProtected: true }, disruption: 3, text: 'BACKUP01 is disconnected and its credentials are locked down. The attacker can no longer reach the backups.' }),
      },
      {
        id: 'acct', group: 'Contain', label: 'Disable m.okoye\'s account', hint: 'The account the attacker is using.', tag: 'useful',
        when: (s) => !!s.facts.edr,
        run: () => ({ disruption: 4, text: 'm.okoye\'s account is disabled. They are told why and given a temporary route to keep working.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Power off every server and laptop in the company', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({
          set: { encrypting: false, evidenceLost: true, srvIsolated: true, pzIsolated: true, sharesOff: true, backupsProtected: true },
          disruption: 50,
          text: 'The encryption stops, and so does the entire business. You have also lost the memory evidence on every machine.',
        }),
      },
      {
        id: 'pay', group: 'Contain', label: 'Open negotiations and pay the ransom', hint: 'Get the files back quickly?', tag: 'bad',
        run: () => ({
          set: { paid: true },
          threat: 10,
          text: 'Authorities such as the NCSC advise against paying. It funds crime, it does not guarantee you get your files back, and the attackers still have their foothold. The encryption carries on while you talk.',
        }),
      },
      // ── Eradicate and recover
      {
        id: 'clean-pz', group: 'Eradicate & recover', label: 'Rebuild LAPTOP-114 from a clean image', hint: 'Remove the attacker\'s foothold.', tag: 'key',
        when: (s) => s.flags.pzIsolated && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 2, text: 'LAPTOP-114 is wiped and rebuilt. The attacker\'s foothold on it is gone.' }),
      },
      {
        id: 'reset', group: 'Eradicate & recover', label: 'Reset the compromised and privileged credentials', hint: 'The attacker has used real accounts.', tag: 'key',
        when: (s) => !!s.facts.edr && !s.flags.credsReset,
        run: () => ({ set: { credsReset: true }, disruption: 5, text: 'm.okoye\'s password and the privileged accounts are reset. The stolen credentials no longer work.' }),
      },
      {
        id: 'restore', group: 'Eradicate & recover', label: 'Restore the shares from the clean offline backup', hint: 'Only once it is safe to.', tag: 'key',
        when: (s) => s.flags.backupsProtected && !s.flags.encrypting && !s.flags.backupsHit && !s.flags.restored,
        run: () => ({
          set: { restored: true },
          disruption: -15,
          text: 'The shares are restored from Sunday\'s tapes. People start getting their files back.',
        }),
      },
      // ── Communicate
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the incident manager and executives', hint: 'The right people, early.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The incident manager takes over executive communications and the business continuity plan.' }),
      },
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the Data Protection Officer about the data theft claim', hint: 'They claim to have copied data.', tag: 'key',
        run: () => ({ set: { dpoTold: true }, text: 'The DPO starts assessing whether personal data was taken, and starts the reporting clock properly.' }),
      },
      {
        id: 'ncsc', group: 'Communicate', label: 'Report the attack to the NCSC and the police', hint: 'Law enforcement and national guidance.', tag: 'useful',
        run: () => ({ set: { reported: true }, text: 'The incident is reported to the National Cyber Security Centre and the police, who can offer advice and help track the attackers.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained and move to recovery', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.encrypting,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.encrypting,
    bonuses: (s) => {
      const out = [];
      if (s.flags.backupsHit) out.push({ label: 'The backups were encrypted', points: -25 });
      else if (s.flags.backupsProtected) out.push({ label: 'Backups protected from the attacker', points: 15 });
      else out.push({ label: 'Backups left exposed', points: -12 });
      out.push(s.flags.persistence ? { label: 'Patient zero left infected: the attacker can return', points: -12 } : { label: 'Patient zero rebuilt from a clean image', points: 10 });
      out.push(s.flags.credsReset ? { label: 'Compromised credentials reset', points: 5 } : { label: 'Stolen credentials left working', points: -8 });
      out.push(s.flags.dpoTold ? { label: 'DPO told about the data theft claim', points: 10 } : { label: 'DPO not told', points: -8 });
      if (s.flags.reported) out.push({ label: 'Reported to the NCSC and police', points: 5 });
      if (s.flags.mgrTold) out.push({ label: 'Incident manager briefed', points: 5 });
      if (s.flags.restored && !s.flags.reinfected) out.push({ label: 'Recovered from clean backups', points: 10 });
      if (s.flags.reinfected) out.push({ label: 'Restored onto an infected network, and hit again', points: -20 });
      if (s.flags.evidenceLost) out.push({ label: 'Evidence lost by powering everything off', points: -10 });
      if (s.flags.paid) out.push({ label: 'Paid the ransom', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attackers took the business down and you did not stop them in time.' },
      { min: 55, name: 'Costly', blurb: 'Stopped, but at a high price: lost backups, long outage or missing steps.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'Fast containment, protected backups, a clean recovery and the right people told.' },
    ],
    debrief: [
      {
        id: 'ic-ransom-backups',
        question: 'Which single protection mattered most to your ability to recover?',
        options: [
          { text: 'Getting the backups out of the attacker\'s reach before they were attacked', correct: true, explain: 'Ransomware operators go after online backups first, because without them the victim has no way back except to pay. Offline or isolated backups are what make recovery possible.' },
          { text: 'Negotiating with the attackers', correct: false, explain: 'It does not guarantee anything. Recovery depends on having clean backups, not on the attackers\' goodwill.' },
          { text: 'Restoring as fast as possible', correct: false, explain: 'Speed without cleaning patient zero and the credentials means the attacker simply encrypts the restored files again.' },
          { text: 'Rebooting the servers', correct: false, explain: 'A reboot does not stop an attacker who is driving the encryption from another machine, and it can destroy evidence.' },
        ],
      },
      {
        id: 'ic-ransom-pay',
        question: 'The attackers claim to have stolen data too. What is the best approach to the ransom demand?',
        options: [
          { text: 'Do not pay. Contain, protect the backups, assess the data theft claim with the DPO and report to the authorities', correct: true, explain: 'National guidance advises against paying: it funds crime and gives no guarantee of recovery or of the data being deleted. Your strongest position is containment, clean backups and a clear assessment of what may have been taken.' },
          { text: 'Pay quickly to limit the damage', correct: false, explain: 'Paying does not remove the attacker\'s foothold, does not guarantee decryption, and does not guarantee they will delete any stolen data.' },
          { text: 'Ignore the data theft claim: it is probably a bluff', correct: false, explain: 'Treat it as credible until the facts show otherwise. Many groups do copy data first, and you may have legal duties to assess it.' },
          { text: 'Tell customers they were definitely breached', correct: false, explain: 'You do not yet know what was taken. Assess first with the DPO, then communicate accurately.' },
        ],
      },
    ],
  },
];
