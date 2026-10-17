// Cloud Security Incident Commander incidents (see incidents.js for the format). Everything here is
// fictional. IP addresses come from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
// Cloud terms are generic ("access key", "storage bucket", "versioning") on purpose.

export const CLOUD = [
  {
    id: 'bucket-wipe',
    title: 'The bucket that emptied itself',
    skill: 'identity',
    blurb: 'Files are vanishing from your production storage, and then a message demands payment. Stop the deletion, protect your way back, and get the data back.',
    role: 'Cloud security engineer, Contoso',
    startClock: '06:40',
    minutesPerUnit: 10,
    maxTime: 12,
    brief: [
      'Saturday, 06:40. Your storage monitoring shows the production data bucket losing objects fast: 41,000 gone in 30 minutes. A text file has appeared in the bucket demanding payment to "get your data back".',
      'You are the cloud security engineer on call. Something with a valid access key is deleting data, and it may go after the backups next. Every action takes time, and the weekly reports that customers depend on run at 09:00.',
    ],
    initial: {
      flags: {
        keyActive: true, // the stolen access key still works
        deleting: true, // objects are being deleted now
        persistence: true, // the attacker created a second access key
        backupsLocked: false,
        backupsHit: false,
        restored: false,
        dpoTold: false,
        mgrTold: false,
        paid: false,
        shutdown: false,
        deletedAgain: false,
      },
    },
    passive: (s) => (s.flags.deleting ? 5 : 0) + (s.flags.persistence ? 2 : 0),
    events: [
      {
        id: 'backups-hit', at: 4, expires: true,
        // The stolen key can also reach the backup account, so until the key is revoked or deletion
        // there is blocked, the attacker can go after the copies.
        when: (s) => !s.flags.backupsLocked && s.flags.keyActive,
        run: () => ({ set: { backupsHit: true }, threat: 25, severity: 'high', text: 'The attacker turns to the backup account and deletes the backup copies as well.' }),
      },
      {
        id: 'second-key', at: 6, expires: true,
        when: (s) => s.flags.persistence && !s.flags.keyActive,
        run: () => ({ set: { keyActive: true, deleting: true }, threat: 15, severity: 'high', text: 'You revoked the first key, but the attacker had created a second one. The deletion starts again.' }),
      },
    ],
    reactions: [
      {
        id: 'deleted-again',
        when: (s) => s.flags.restored && s.flags.keyActive && !s.flags.deletedAgain,
        run: () => ({ set: { restored: false, deletedAgain: true, deleting: true }, threat: 20, severity: 'high', text: 'You restored the data while the attacker still had a working key. They delete it again.' }),
      },
    ],
    actions: [
      // ── Investigate
      {
        id: 'logs', group: 'Investigate', label: 'Read the cloud audit log for the bucket', hint: 'Who, from where and since when?', tag: 'key',
        run: () => ({
          reveal: { logs: 'Access key AKEY-3310, belonging to a build service account, is being used from 203.0.113.58 to download and then delete objects. It was first used from that address at 06:08. It has also been used to create a second access key for another service account.' },
          text: 'A build account\'s key is being used from outside, and it has made a second key to come back with.',
        }),
      },
      {
        id: 'scope', group: 'Investigate', label: 'Check what has been taken and deleted, and whether versions and backups exist', hint: 'What can you get back?', tag: 'key',
        run: () => ({
          reveal: { scope: 'Versioning is on for the production bucket, so deleted objects can be restored. About 2 GB was downloaded before deletion began. A copy of the bucket exists in a separate backup account, which the same key can reach.' },
          text: 'You can get the data back, but some of it was copied first, and the backups are not yet safe.',
        }),
      },
      {
        id: 'inventory', group: 'Investigate', label: 'Look for other keys, roles and users created in the last day', hint: 'Has the attacker left a way back?', tag: 'key',
        when: (s) => !!s.facts.logs,
        run: () => ({
          reveal: { inventory: 'A second access key was created for service account svc-reports at 06:15, and it is also being used from 203.0.113.58.' },
          text: 'You have found the attacker\'s second key.',
        }),
      },
      {
        id: 'rescan', group: 'Investigate', label: 'Run a security posture scan of the whole account', hint: 'Look for the weakness?', tag: 'weak',
        run: () => ({ text: 'The scan lists dozens of routine findings. It does not tell you what the attacker is doing right now.' }),
      },
      // ── Contain
      {
        id: 'revoke', group: 'Contain', label: 'Disable the stolen access key and end its sessions', hint: 'Stop the deletion.', tag: 'key',
        when: (s) => !!s.facts.logs && s.flags.keyActive,
        run: () => ({ set: { keyActive: false, deleting: false }, disruption: 4, text: 'The key is disabled and the deletion stops. The build account is replaced with a new one for the weekend\'s jobs.' }),
      },
      {
        id: 'remove-key', group: 'Contain', label: 'Disable the second key the attacker created, and review the account that owns it', hint: 'Remove the way back.', tag: 'key',
        when: (s) => !!s.facts.inventory && s.flags.persistence,
        run: () => ({ set: { persistence: false }, disruption: 3, text: 'The second key is disabled and svc-reports gets a fresh credential. The attacker has no key left.' }),
      },
      {
        id: 'lock-backups', group: 'Contain', label: 'Switch on deletion protection in the backup account so that no key can delete the copies', hint: 'Protect your way back.', tag: 'key',
        when: (s) => !!s.facts.scope && !s.flags.backupsLocked,
        run: () => ({ set: { backupsLocked: true }, disruption: 2, text: 'The backup account now refuses deletions from every key, including administrators\', for a set period. The backups cannot be touched.' }),
      },
      {
        id: 'restore', group: 'Eradicate & recover', label: 'Restore the deleted objects from their previous versions', hint: 'Get the data back.', tag: 'key',
        when: (s) => !!s.facts.scope && !s.flags.restored,
        run: () => ({ set: { restored: true }, disruption: -12, text: 'The objects are restored from their earlier versions. Reports can run again.' }),
      },
      {
        id: 'shutdown', group: 'Contain', label: 'Shut down the entire cloud account', hint: 'Stop everything.', tag: 'overreact',
        run: () => ({ set: { shutdown: true, deleting: false }, disruption: 55, text: 'The deletion stops, and so does every service that customers use. The attacker\'s second key is untouched.' }),
      },
      {
        id: 'pay', group: 'Contain', label: 'Open negotiations and pay what they ask', hint: 'Get the data back quickly?', tag: 'bad',
        run: () => ({ set: { paid: true }, threat: 10, text: 'Paying funds crime, gives no guarantee, and does nothing about the attacker\'s keys. The deletion carries on while you talk.' }),
      },
      // ── Communicate
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the data protection officer that 2 GB of data was downloaded', hint: 'Personal data may have been taken.', tag: 'key',
        when: (s) => !!s.facts.scope,
        run: () => ({ set: { dpoTold: true }, text: 'The DPO begins an assessment: data was copied as well as deleted, so this may be a reportable personal data breach.' }),
      },
      {
        id: 'mgr', group: 'Communicate', label: 'Brief the head of engineering and the on-call manager', hint: 'Keep the right people informed.', tag: 'useful',
        run: () => ({ set: { mgrTold: true }, text: 'The head of engineering and the on-call manager are briefed and take charge of customer messages.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.keyActive && !s.flags.persistence,
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.keyActive && !s.flags.persistence,
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.keyActive ? { label: 'The stolen key was left working', points: -14 } : { label: 'The stolen key was disabled', points: 10 });
      out.push(s.flags.persistence ? { label: 'The attacker\'s second key was left in place', points: -15 } : { label: 'The attacker\'s second key was removed', points: 12 });
      if (s.flags.backupsHit) out.push({ label: 'The backup copies were deleted', points: -25 });
      else if (s.flags.backupsLocked) out.push({ label: 'Backups protected from deletion', points: 12 });
      else out.push({ label: 'Backups left exposed', points: -10 });
      if (s.flags.restored && !s.flags.deletedAgain) out.push({ label: 'Data restored from versions', points: 10 });
      else if (!s.flags.restored) out.push({ label: 'Data not restored', points: -8 });
      if (s.flags.deletedAgain) out.push({ label: 'Restored data was deleted again because the key was still live', points: -15 });
      out.push(s.flags.dpoTold ? { label: 'DPO told that data was downloaded', points: 8 } : { label: 'DPO not told', points: -8 });
      if (s.flags.mgrTold) out.push({ label: 'Engineering leadership briefed', points: 4 });
      if (s.flags.shutdown) out.push({ label: 'Shut down the whole account', points: -10 });
      if (s.flags.paid) out.push({ label: 'Agreed to pay the demand', points: -25 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The deletion went on, the backups were lost, or the attacker kept control.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with gaps: backups hit, a second key left, or data not recovered.' },
      { min: 100, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 145, name: 'Textbook', blurb: 'You stopped the deletion, removed every key, protected the backups, recovered the data and told the right people.' },
    ],
    debrief: [
      {
        id: 'ic-bucket-versions',
        question: 'Which protection made recovery possible in this incident?',
        options: [
          { text: 'Versioning on the bucket and a separate backup account, ideally with deletion protection that no key can override', correct: true, explain: 'An attacker with a valid key can delete the live data. Versions and protected copies elsewhere are what mean the data can be recovered without paying.' },
          { text: 'Encrypting the data', correct: false, explain: 'Encryption does not stop a key holder deleting objects, and the attacker was able to read them anyway.' },
          { text: 'A firewall around the bucket', correct: false, explain: 'Storage is reached through the cloud provider\'s service using keys, not through a firewall in the usual sense.' },
          { text: 'Faster internet', correct: false, explain: 'Irrelevant.' },
        ],
      },
      {
        id: 'ic-bucket-order',
        question: 'Why did you have to cut off the attacker\'s keys before restoring the data?',
        options: [
          { text: 'Otherwise they could simply delete the restored data again', correct: true, explain: 'Recovery is wasted effort while the attacker still has a working key. Close the way in first, then restore.' },
          { text: 'Because restoring is not allowed during an incident', correct: false, explain: 'It is allowed. The order is what matters.' },
          { text: 'Because the data cannot be restored without a new key', correct: false, explain: 'Versions can be restored whenever you choose. The risk is the attacker deleting them again.' },
          { text: 'It does not matter what order you do things in', correct: false, explain: 'It matters a great deal. The attacker deleted restored data again if the key was still live.' },
        ],
      },
    ],
  },
];
