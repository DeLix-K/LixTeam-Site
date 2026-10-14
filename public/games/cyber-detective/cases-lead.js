// Lead-level and cloud-track Cyber Detective cases (see cases.js for the format).
// Everything here is fictional. IP addresses come from the reserved documentation
// ranges (203.0.113.0/24, 198.51.100.0/24), and the .example domains are not real.
//
// These cases are as much about judgement as about technique: who you involve, what
// you are allowed to look at, and what you preserve before you act.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'insider',
    title: 'The departing engineer',
    skill: 'data',
    blurb: 'An engineer who resigned two weeks ago has been moving a lot of data. Is it theft, and how do you handle it properly?',
    brief: [
      'R. Kaur, a senior engineer, resigned two weeks ago and is working a one-month notice period. Your data loss prevention (DLP) tool has raised an alert about an unusual volume of data sent to a personal storage account. You have the alert to start with, and deeper records as you find the right clues.',
      'This is not only a technical question. Kaur is a person with rights, and a wrong accusation does real harm. Work out what the evidence shows, flag the lines that matter and leave the noise alone, then decide the right first move.',
    ],
    ratings: RATINGS,
    clues: {
      upload: { strength: 'strong', text: 'Over three evenings, 6.8 GB was uploaded from Kaur\'s work laptop to a personal cloud storage account.' },
      usb: { strength: 'strong', text: 'A 64 GB USB drive was connected on the last evening and the "Product-Roadmap" folder was copied to it.' },
      crm: { strength: 'strong', text: 'Kaur exported the full client list from the CRM, which is outside an engineer\'s role and had never been done before.' },
      device: { strength: 'strong', text: 'Every action came from Kaur\'s own managed laptop, from their usual location, with normal MFA: it is Kaur, not a hijacked account.' },
      norole: { strength: 'strong', text: 'Kaur\'s current project does not involve client data or the roadmap, so nothing in their work explains the transfers.' },
      resign: { strength: 'weak', text: 'Kaur resigned two weeks ago, and HR holds a note that they are joining a competitor.' },
    },
    artefacts: [
      {
        id: 'dlp', title: 'DLP alert and upload log',
        blurb: 'What the alert says and what else the tool saw.',
        lines: [
          { id: 'd1', type: 'clue', clue: 'upload', text: '19:42-21:10 on 3 consecutive evenings  KAUR-LT to personal-storage.example: 6.8 GB uploaded, mostly .zip archives', note: 'Large compressed archives to a personal account, repeated three nights running. That is deliberate and it is the heart of the alert.' },
          { id: 'd2', type: 'herring', text: '09:00 daily  Kaur\'s Documents folder syncs to the corporate file store (140 MB, approved service)', note: 'Company-approved sync to a company system. Not a leak.' },
          { id: 'd3', type: 'plain', text: '12:30  Kaur printed 6 pages to the office printer', note: 'Ordinary, low volume, and nothing suggests it matters.' },
          { id: 'd4', type: 'herring', text: '03:15  The nightly server backup reads 400 GB from the file server (svc-backup)', note: 'A different account doing its normal scheduled job. It is not Kaur.' },
        ],
      },
      {
        id: 'device', title: 'Laptop and sign-in records',
        blurb: 'What happened on Kaur\'s machine, and whose hands were on it.',
        unlockedBy: 'upload',
        lines: [
          { id: 'e1', type: 'clue', clue: 'usb', text: '21:15 (last evening)  USB mass storage (64 GB) connected to KAUR-LT; 3.1 GB copied from the Product-Roadmap folder', note: 'Copying a confidential folder to removable storage, straight after the uploads. A second route for the same kind of data.' },
          { id: 'e2', type: 'clue', clue: 'device', text: 'All sessions: managed laptop KAUR-LT, home address in London, MFA approved on Kaur\'s registered phone', note: 'The device, the place and the MFA are all Kaur\'s own. This rules out a stolen account and points at the person.' },
          { id: 'e3', type: 'herring', text: '02:00  Windows security update installed on KAUR-LT', note: 'Routine patching that happens to every laptop.' },
          { id: 'e4', type: 'plain', text: '08:55  Bluetooth headset paired to KAUR-LT', note: 'A normal peripheral. It has nothing to do with data moving out.' },
        ],
      },
      {
        id: 'records', title: 'CRM, project and HR records',
        blurb: 'Does anything in Kaur\'s job explain this?',
        unlockedBy: 'usb',
        lines: [
          { id: 'r1', type: 'clue', clue: 'crm', text: '20:30 (middle evening)  CRM: full client list exported (11,200 records) by Kaur; no earlier export by this user', note: 'The client list is valuable to a competitor, and an engineer has no reason to export it. This is the sharpest sign of intent.' },
          { id: 'r2', type: 'clue', clue: 'norole', text: 'Project tracker: Kaur is assigned to the billing migration only. No task involves client data or the roadmap.', note: 'There is no business reason for any of it. That is what separates a theft from a legitimate hand-over.' },
          { id: 'r3', type: 'clue', clue: 'resign', text: 'HR note: resignation received 14 days ago. New employer recorded as a competitor.', note: 'Relevant context, but resigning is not wrongdoing and the new employer proves nothing on its own.' },
          { id: 'r4', type: 'herring', text: 'Engineering wiki: Kaur reads pages daily as usual', note: 'Normal work in the area they are assigned to.' },
          { id: 'r5', type: 'plain', text: 'Employment contract: Kaur signed a confidentiality clause on joining', note: 'Important for HR and Legal later, but it does not show what happened.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'insider', correct: true, text: 'A departing employee deliberately taking company data', explain: 'The upload, the USB copy and the CRM export all come from Kaur\'s own device, at normal times with normal MFA, are unrelated to Kaur\'s work, and follow a resignation to a competitor.' },
        { id: 'external', correct: false, text: 'An external attacker using Kaur\'s stolen account', explain: 'Every action used Kaur\'s own managed laptop, home location and MFA. Nothing suggests anyone else was involved.' },
        { id: 'accident', correct: false, text: 'An accidental sync of personal and work files by Kaur\'s own software', explain: 'An accident does not copy a folder to a USB drive or export an entire client list from the CRM. These were separate, deliberate actions.' },
        { id: 'malware', correct: false, text: 'Malware quietly sending files out of the laptop', explain: 'There are no malware alerts, and the key actions (USB copy, CRM export) are things a person does by hand.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'preserve', correct: true, text: 'Preserve the logs and records, brief HR, Legal and the DPO, and let them decide on access and on any approach to Kaur', explain: 'Evidence must be kept intact, and decisions about an employee\'s access, an interview or any legal step belong with HR and Legal, with the data protection officer advising on lawful handling.' },
        { id: 'confront', correct: false, text: 'Confront Kaur today and demand the USB drive back', explain: 'An untrained confrontation can tip them off, lead to evidence being destroyed, and cause legal and employment problems for the company.' },
        { id: 'personal', correct: false, text: 'Look inside Kaur\'s personal cloud storage account to see what was taken', explain: 'You have no right to access a personal account, and doing so could break the law. Work from your own company\'s records.' },
        { id: 'wipe', correct: false, text: 'Disable the account and wipe the laptop straight away', explain: 'It destroys the evidence and acts on a colleague without HR and Legal. Image the device first, and agree access changes with them.' },
      ],
    },
    story: [
      'Kaur resigns. A competitor will pay more, and Kaur is thinking about what to take.',
      'Over three evenings, Kaur uploads 6.8 GB of archives to a personal storage account.',
      'On the last evening, Kaur copies the roadmap folder to a USB drive and exports the whole client list from the CRM.',
      'The right response is careful rather than quick: keep the evidence, bring in HR and Legal, and make sure a person is treated fairly and lawfully.',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'open-bucket',
    title: 'The bucket anyone could read',
    skill: 'data',
    blurb: 'A scanner reports that a cloud storage bucket is readable by the whole internet. It was private yesterday.',
    brief: [
      'An external security scanner your company pays for has reported that the cloud storage bucket "contoso-exports" can be read by anyone on the internet. Yesterday it was private. The bucket holds exports used by the data team.',
      'You have the bucket\'s configuration and change history to start with. Work out how it happened, whether anyone has taken anything, and what you must do first.',
    ],
    ratings: RATINGS,
    clues: {
      policy: { strength: 'strong', text: 'At 14:02 yesterday the bucket\'s access policy was changed to allow public reads.' },
      deploy: { strength: 'strong', text: 'The change came from an automated deployment: a commit titled "temp: open for testing" that was never reverted.' },
      anon: { strength: 'strong', text: 'Anonymous downloads of customers.csv began 40 minutes later: 14 downloads from 9 outside addresses.' },
      personal: { strength: 'strong', text: 'The file holds names, emails and order history for 18,400 customers, so it is personal data.' },
      logs: { strength: 'strong', text: 'Access logging was on from the start with 90 days kept, so you can see exactly who downloaded the file.' },
      guardrail: { strength: 'weak', text: 'The account-wide "block public access" setting was switched off two months ago, so nothing stopped the change.' },
    },
    artefacts: [
      {
        id: 'config', title: 'Bucket configuration and change history',
        blurb: 'What changed, when and who or what changed it.',
        lines: [
          { id: 'c1', type: 'clue', clue: 'policy', text: 'contoso-exports: policy updated 14:02 yesterday. Principal "*" (anyone) granted read access.', note: 'This is the moment the data became public. Everything else follows from it.' },
          { id: 'c2', type: 'clue', clue: 'deploy', text: 'Change source: pipeline "infra-deploy", commit 9be4: "temp: open for testing". No reviewer recorded.', note: 'A temporary change meant for testing went to production and was never undone. It was a mistake in the company\'s own process.' },
          { id: 'c3', type: 'herring', text: 'contoso-assets-public: public read, marketing images (unchanged for 2 years)', note: 'A different bucket that is meant to be public and holds no personal data.' },
          { id: 'c4', type: 'plain', text: 'contoso-exports: versioning enabled', note: 'A useful setting for recovery, but it is not part of this problem.' },
          { id: 'c5', type: 'clue', clue: 'guardrail', text: 'Account setting "block public access": switched off on 12 August', note: 'A missing safety net, not the cause of the event. If it had been on, the change would have been blocked.' },
        ],
      },
      {
        id: 'logs', title: 'Access logs',
        blurb: 'Who has read the data since it became public?',
        unlockedBy: 'policy',
        lines: [
          { id: 'a1', type: 'clue', clue: 'anon', text: '14:42 onwards  14 anonymous GET requests for customers.csv from 9 addresses outside the company (203.0.113.58 among them)', note: 'Real people or tools have taken the file. This turns an exposure into a likely data breach.' },
          { id: 'a2', type: 'clue', clue: 'logs', text: 'Server access logging: enabled at creation, 90 days retained', note: 'You are able to prove who accessed it, which is what lets you assess the real impact.' },
          { id: 'a3', type: 'herring', text: '14:05-14:40  svc-data-analyst reads customers.csv from the corporate VPN address', note: 'The data team\'s normal use of the file, from an internal address.' },
          { id: 'a4', type: 'herring', text: '15:20  HEAD request from 198.51.100.7 (your security scanner vendor)', note: 'The scanner that reported the problem. It checked that the file exists and did not download it.' },
          { id: 'a5', type: 'plain', text: '03:00  Lifecycle job moved 200 old objects to archive storage', note: 'Routine housekeeping.' },
        ],
      },
      {
        id: 'data', title: 'The exposed file',
        blurb: 'How sensitive is what was exposed?',
        unlockedBy: 'anon',
        lines: [
          { id: 'f1', type: 'clue', clue: 'personal', text: 'customers.csv: 18,400 rows with name, email, last order date and total', note: 'Named individuals with contact details and purchase history: personal data under UK data protection law.' },
          { id: 'f2', type: 'plain', text: 'Columns: id, name, email, last_order_date, last_order_total', note: 'The structure of the file. It supports the point above but is not a separate finding.' },
          { id: 'f3', type: 'herring', text: 'File size 2.1 MB, last modified 3 days ago', note: 'Housekeeping detail that does not explain how or why it was exposed.' },
          { id: 'f4', type: 'plain', text: 'No card numbers, passwords or home addresses in the file', note: 'Good news for assessing the risk to people, but not proof that no harm is possible.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'misconfig', correct: true, text: 'A misconfiguration exposed the data: an exposure, not a break-in', explain: 'The company\'s own deployment made the bucket public. No credentials were stolen and nobody broke in. People still downloaded the data, so it is serious.' },
        { id: 'creds', correct: false, text: 'An attacker stole cloud credentials and made the bucket public', explain: 'The change came from the company\'s own pipeline through a commit, and there are no unusual sign-ins or keys.' },
        { id: 'ransom', correct: false, text: 'Ransomware encrypted or copied the data', explain: 'Nothing was encrypted and nothing ran in the environment. The file simply became readable.' },
        { id: 'insider', correct: false, text: 'A malicious insider leaked the data on purpose', explain: 'A commit called "temp: open for testing" is evidence of a mistake, not malice, and there is nothing pointing to deliberate leaking.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'block', correct: true, text: 'Block public access on the bucket now, keep the access logs, then work out with the DPO who downloaded the file and whether it is a reportable personal data breach', explain: 'Stop the exposure first, keep the evidence, and then assess the real impact with the person responsible for data protection. A reportable breach has a 72-hour clock from when you become aware.' },
        { id: 'delete', correct: false, text: 'Delete the bucket', explain: 'It removes the data the business needs and destroys the logs you need to assess who took the file. Closing access is enough.' },
        { id: 'rotate', correct: false, text: 'Rotate every cloud credential in the company', explain: 'No credentials were involved, so it would cause disruption without stopping the exposure.' },
        { id: 'email', correct: false, text: 'Email all 18,400 customers immediately about a breach', explain: 'Premature. You do not yet know who accessed the data or the level of risk to individuals. Assess first with the DPO, then tell people accurately if required.' },
      ],
    },
    story: [
      'A developer commits "temp: open for testing" and the deployment pipeline applies it without a reviewer.',
      '14:02: the bucket becomes readable by anyone. A safety setting that would have blocked it had been turned off two months earlier.',
      '14:42: automated tools and strangers begin downloading the customer file. Fourteen downloads follow.',
      'The first job is to close the door. The second is to use the logs to find out what actually happened and who must be told.',
    ],
  },
];
