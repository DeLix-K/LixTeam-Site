// Incident Commander scenarios. Everything here is fictional. IP addresses are
// from the reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// An incident is data plus small functions over the game state `s`
// (s.flags, s.facts, s.threat, s.disruption, s.T). See engine.js.
// Action tags: key = a strong move worth knowing, useful, weak = tempting but
// does little, overreact = disproportionate, bad = harmful.

import { EXTRA } from './incidents-extra.js';
import { LEAD } from './incidents-lead.js';
import { VULN } from './incidents-vuln.js';
import { NETWORK } from './incidents-network.js';
import { PENTEST } from './incidents-pentest.js';

const CORE = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mfa-fatigue',
    title: 'The sixth prompt',
    skill: 'identity',
    blurb: 'A finance colleague approved a sign-in prompt she did not start. How far has it gone?',
    role: 'Security analyst, Contoso SOC',
    startClock: '09:12',
    minutesPerUnit: 5,
    maxTime: 12,
    brief: [
      'Helpdesk ticket #4471. Priya Nair (Finance Operations) says her phone buzzed with a flood of sign-in approval prompts around 08:40. She denied five, then tapped Approve on the sixth "to make it stop". Nothing looks wrong, but she is worried.',
      'Finance runs the weekly supplier payment run at 11:00 today. You have identity logs, mailbox tools and session controls. You have about an hour of working time before the payment run: each action takes time, and the clock does not stop.',
    ],
    initial: {
      flags: {
        sessionActive: true, // the attacker is signed in right now
        rogueDevice: true, // an authenticator the attacker registered
        ruleExists: true, // a mailbox forwarding rule the attacker made
        pwReset: false,
        sessionsRevoked: false,
        revokedAt: -1,
        disabled: false,
        financeWarned: false,
        escalated: false,
        paymentSent: false,
      },
    },
    passive: (s) => (s.flags.sessionActive ? 5 : 0),
    events: [
      {
        id: 'siem-device',
        at: 1,
        run: () => ({ severity: 'info', text: 'SIEM alert (delayed): a new authenticator app was registered on Priya\'s account at 08:52.' }),
      },
      {
        id: 'siem-rule',
        at: 2,
        run: () => ({ severity: 'info', text: 'SIEM alert (delayed): a mailbox rule named "Invoices" was created on Priya\'s mailbox at 08:58, forwarding to an external address.' }),
      },
      {
        id: 'bec',
        at: 3,
        expires: true,
        when: (s) => s.flags.sessionActive && s.flags.ruleExists,
        run: (s) =>
          s.flags.financeWarned
            ? { set: { paymentSent: true }, threat: 5, severity: 'medium', text: 'A supplier received a "we have changed banks" email from Priya\'s mailbox, but Finance had already been warned to verify any bank-detail change by phone. They ignored it.' }
            : { set: { paymentSent: true }, threat: 25, severity: 'high', text: 'A supplier (Fabrikam Parts) received an email from Priya\'s mailbox saying their bank details have changed. Finance has not been warned. The payment run is at 11:00.' },
      },
      {
        id: 'exfil',
        at: 5,
        expires: true,
        when: (s) => s.flags.sessionActive,
        run: () => ({ threat: 20, severity: 'high', text: 'The attacker downloaded the Supplier Master list (names, bank details) from SharePoint using Priya\'s session.' }),
      },
    ],
    reactions: [
      {
        id: 'reentry',
        when: (s) => s.flags.sessionsRevoked && !s.flags.pwReset && !s.flags.disabled && !s.flags.sessionActive && s.T > s.flags.revokedAt,
        run: () => ({
          set: { sessionActive: true },
          threat: 5,
          severity: 'high',
          text: 'The attacker signed straight back in. They still know Priya\'s password, so a fresh prompt and a rogue device got them through.',
        }),
      },
    ],
    actions: [
      // ── Investigate
      {
        id: 'logs', group: 'Investigate', label: 'Review Priya\'s sign-in logs', hint: 'What actually happened, from where?', tag: 'key',
        run: () => ({
          reveal: { ip: 'Six MFA prompts from 08:41, then a successful sign-in at 08:47 from 203.0.113.58, a hosting provider in another country. Priya normally signs in from the Contoso office.' },
          text: 'Six failed or denied prompts, then a successful sign-in from a datacentre address in another country. That is not Priya.',
        }),
      },
      {
        id: 'devices', group: 'Investigate', label: 'Check Priya\'s registered MFA devices', hint: 'Has anything been added to her account?', tag: 'key',
        run: () => ({
          reveal: { device: 'A second authenticator, "iPhone 13", was registered at 08:52 from the same foreign IP. Priya has not got one.' },
          text: 'There is a second authenticator on her account that is not hers. The attacker has built a way back in.',
        }),
      },
      {
        id: 'rules', group: 'Investigate', label: 'Check Priya\'s mailbox rules and forwarding', hint: 'Attackers love quiet forwarding rules.', tag: 'key',
        run: (s) =>
          s.flags.ruleExists
            ? { reveal: { rule: 'A rule called "Invoices" forwards anything mentioning "invoice" or "payment" to an external address, then marks it read. Created 08:58.' }, text: 'Found it: a hidden rule forwarding payment emails out of the company.' }
            : { reveal: { rule: 'No suspicious mailbox rules remain.' }, text: 'No suspicious mailbox rules.' },
      },
      {
        id: 'call', group: 'Investigate', label: 'Phone Priya to confirm what she did', hint: 'Verify with the person, using her desk number.', tag: 'useful',
        run: () => ({
          reveal: { call: 'Priya confirms she approved the 6th prompt at about 08:47 and did not register any new device. She is at her desk and is happy to be signed out.' },
          text: 'Priya confirms the approval and that she did not add a device. She is at her desk and cooperative.',
        }),
      },
      {
        id: 'mail', group: 'Investigate', label: 'Look at Priya\'s outbound mail', hint: 'Has her account been used to send anything?', repeat: true, tag: 'useful',
        run: (s) =>
          s.flags.paymentSent
            ? { reveal: { mail: 'An email to Fabrikam Parts says Contoso\'s supplier bank details have changed, with a new account number. Priya did not write it.' }, text: 'Her account sent a fraudulent "changed bank details" email to a supplier.' }
            : { reveal: { mail: 'Nothing unusual has been sent yet. The forwarding rule only copies incoming mail so far, but that can change.' }, text: 'No suspicious outbound mail so far. That can change.' },
      },
      {
        id: 'scope', group: 'Investigate', label: 'Hunt for other accounts using that IP', hint: 'Is it only Priya?', tag: 'useful',
        run: () => ({
          reveal: { scope: 'No other account has signed in from 203.0.113.58. Only Priya is affected so far.' },
          text: 'Only Priya\'s account has been touched. That keeps the response proportionate.',
        }),
      },
      // ── Contain
      {
        id: 'revoke', group: 'Contain', label: 'Revoke all of Priya\'s sessions and tokens', hint: 'Signs the attacker out right now.', tag: 'key',
        run: (s) => ({
          // One turn of grace: the attacker can only try again after the next action.
          set: { sessionActive: false, sessionsRevoked: true, revokedAt: s.T + 1 },
          disruption: 3,
          text: 'The attacker\'s live session ends. Priya is signed out too. But they still know her password.',
        }),
      },
      {
        id: 'resetpw', group: 'Contain', label: 'Reset Priya\'s password', hint: 'Takes the stolen password away.', tag: 'key',
        run: (s) => ({
          set: { pwReset: true },
          disruption: 3,
          text: s.flags.sessionActive
            ? 'Password reset, but the attacker\'s existing session token is still valid. A password change alone does not kick them out.'
            : 'Password reset. The stolen password is now worthless.',
        }),
      },
      {
        id: 'disable', group: 'Contain', label: 'Disable Priya\'s account completely', hint: 'Stops everything, including Priya.', tag: 'useful',
        run: () => ({
          set: { sessionActive: false, disabled: true },
          disruption: 20,
          text: 'Account disabled. The attacker is locked out, but Priya cannot work, and the 11:00 payment run depends on her. Effective, but heavy for one account.',
        }),
      },
      {
        id: 'blockip', group: 'Contain', label: 'Block the attacker\'s IP address', hint: 'Cheap and quick.', tag: 'weak',
        when: (s) => !!s.facts.ip,
        run: () => ({
          text: 'Blocked 203.0.113.58. It feels good, but attackers change address in minutes. This does not remove their session, device or password.',
        }),
      },
      {
        id: 'allpw', group: 'Contain', label: 'Force a password reset for all 2,000 staff', hint: 'Better safe than sorry?', tag: 'overreact',
        run: () => ({
          disruption: 45,
          text: 'Chaos. The helpdesk is flooded and half the company is locked out. Priya\'s attacker still has a live session, because resets do not end tokens.',
        }),
      },
      // ── Eradicate & recover
      {
        id: 'rmdevice', group: 'Eradicate & recover', label: 'Remove the unknown authenticator', hint: 'Closes the back door.', tag: 'key',
        when: (s) => !!s.facts.device,
        run: () => ({ set: { rogueDevice: false }, text: 'The rogue "iPhone 13" authenticator is removed.' }),
      },
      {
        id: 'rmrule', group: 'Eradicate & recover', label: 'Delete the forwarding rule', hint: 'Stops invoices leaking out.', tag: 'key',
        when: (s) => !!s.facts.rule && s.flags.ruleExists,
        run: () => ({ set: { ruleExists: false }, text: 'The "Invoices" rule is deleted. Priya\'s mail stays inside the company again.' }),
      },
      // ── Communicate
      {
        id: 'warnfinance', group: 'Communicate', label: 'Warn Finance: verify any bank-detail change by phone', hint: 'Protects the 11:00 payment run.', tag: 'key',
        run: () => ({
          set: { financeWarned: true },
          disruption: 3,
          text: 'The Finance lead pauses bank-detail changes until each is confirmed by phone. A small slowdown for a big protection.',
        }),
      },
      {
        id: 'escalate', group: 'Communicate', label: 'Brief the incident manager', hint: 'Right people know, record starts.', tag: 'useful',
        run: () => ({ set: { escalated: true }, text: 'The incident manager opens a P2 incident and takes executive comms off your plate.' }),
      },
      // ── Close
      {
        id: 'closeticket', group: 'Close', label: 'Close the ticket as user error', hint: 'She did approve it herself, after all.', tag: 'bad',
        run: () => ({
          text: 'Ticket closed. The attacker is still inside Priya\'s account, and now nobody is looking.',
        }),
      },
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained and write it up', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.sessionActive && (s.flags.pwReset || s.flags.disabled),
        run: () => ({ text: 'You declare the incident contained.' }),
      },
    ],
    contained: (s) => !s.flags.sessionActive && (s.flags.pwReset || s.flags.disabled),
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.rogueDevice ? { label: 'Rogue device left in place (attacker can return)', points: -20 } : { label: 'Rogue device removed', points: 10 });
      out.push(s.flags.ruleExists ? { label: 'Forwarding rule left in place', points: -15 } : { label: 'Forwarding rule removed', points: 10 });
      if (s.flags.paymentSent && !s.flags.financeWarned) out.push({ label: 'Finance not warned about the fake bank details', points: -15 });
      if (s.flags.financeWarned) out.push({ label: 'Finance warned', points: 8 });
      if (s.flags.escalated) out.push({ label: 'Escalated to the incident manager', points: 5 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'The attacker got what they came for.' },
      { min: 55, name: 'Costly', blurb: 'You stopped it, but it cost the company dearly.' },
      { min: 95, name: 'Solid', blurb: 'A sound response with room to tighten up.' },
      { min: 125, name: 'Textbook', blurb: 'Fast containment, full clean-up, proportionate impact.' },
    ],
    debrief: [
      {
        id: 'ic-mfa-cause',
        question: 'What most likely happened?',
        options: [
          { text: 'Her password was already stolen. The attacker repeated MFA prompts until she approved one, then set up persistence.', correct: true, explain: 'This is MFA fatigue (prompt bombing). The attacker had her password, so the prompt was the only barrier, and one tired tap was enough. The new device and forwarding rule were persistence.' },
          { text: 'Malware on Priya\'s laptop captured her session.', correct: false, explain: 'The sign-in came from a datacentre abroad, not from her laptop, and the prompts were for a fresh login. Nothing points to malware on her device.' },
          { text: 'Priya\'s phone was cloned.', correct: false, explain: 'A cloned phone would not explain a flood of prompts she was seeing on her own phone, or a new device appearing on her account.' },
          { text: 'It was a false alarm: nothing happened.', correct: false, explain: 'The logs, the new authenticator and the forwarding rule are all real evidence of a compromise.' },
        ],
      },
      {
        id: 'ic-mfa-prevent',
        question: 'Which single change would best stop this happening again?',
        options: [
          { text: 'Number matching or phishing-resistant MFA (such as passkeys), so a blind "Approve" tap is not enough.', correct: true, explain: 'Number matching makes the user type a number shown on the sign-in screen, which an attacker prompt-bombing from elsewhere cannot supply. Passkeys go further and cannot be approved by mistake.' },
          { text: 'Force longer passwords.', correct: false, explain: 'Helpful, but the attacker already had the password. Length does not stop a stolen one being used.' },
          { text: 'Block every foreign IP address.', correct: false, explain: 'Easy to bypass (attackers use local proxies) and it breaks legitimate travel and remote work. It is not a fix for approving prompts.' },
          { text: 'More training only.', correct: false, explain: 'Training helps people report prompts, but a control that cannot be tapped through by accident is stronger than relying on perfect behaviour.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'lost-laptop',
    title: 'The laptop on the train',
    skill: 'data',
    blurb: 'A salesperson left a laptop full of customer data on a train. What do you do, and what do you owe the regulator?',
    role: 'Security analyst, Contoso SOC',
    startClock: '09:30',
    minutesPerUnit: 5,
    maxTime: 12,
    brief: [
      'Jordan Blake (Sales) has just told the helpdesk he left his work laptop on a train last night. He kept quiet at first because he was embarrassed. It holds an export of about 4,000 customer records (names, emails, phone numbers) and he is not sure it is encrypted.',
      'You can see the device inventory, sign-in logs and device management tools. Your job is to limit the exposure, make the right notifications and decide what the company needs to do. Under UK GDPR the clock for assessing and, if needed, reporting a breach starts when you become aware of it.',
    ],
    initial: {
      flags: {
        tokenActive: true, // cached sign-in on the laptop still works
        deviceLocked: false,
        pwReset: false,
        dpoNotified: false,
        policeReported: false,
        managerTold: false,
        customersNotified: false,
        icoPremature: false,
      },
    },
    passive: (s) => (s.flags.tokenActive ? 4 : 0),
    events: [
      {
        id: 'checkin',
        at: 1,
        run: () => ({ severity: 'info', text: 'MDM alert: the lost laptop has just checked in from an unknown home Wi-Fi network. Someone has it powered on.' }),
      },
      {
        id: 'mailbox',
        at: 3,
        expires: true,
        when: (s) => s.flags.tokenActive,
        run: () => ({ threat: 15, severity: 'high', text: 'Jordan\'s mailbox was opened from the lost laptop using a cached sign-in.' }),
      },
      {
        id: 'crm',
        at: 5,
        expires: true,
        when: (s) => s.flags.tokenActive,
        run: () => ({ threat: 25, severity: 'high', text: 'A large export was downloaded from the CRM using Jordan\'s cached session. Customer data has left the company.' }),
      },
    ],
    reactions: [],
    actions: [
      // ── Investigate
      {
        id: 'inventory', group: 'Investigate', label: 'Check the device inventory and encryption status', hint: 'Is the disk protected?', tag: 'key',
        run: () => ({
          reveal: { enc: 'Full-disk encryption (BitLocker) is ON for this laptop, with a start-up PIN. The device last checked in at 09:35.' },
          text: 'The disk is encrypted with a PIN, so the files themselves are protected. The bigger problem is what the laptop is still signed in to.',
        }),
      },
      {
        id: 'signins', group: 'Investigate', label: 'Review Jordan\'s recent sign-ins', hint: 'Is the laptop still logged in anywhere?', tag: 'key',
        run: () => ({
          reveal: { sess: 'The laptop still holds active cached sessions to email, SharePoint and the CRM. Anyone who gets past the lock screen could use them without a password.' },
          text: 'Cached sessions are still live on the missing laptop. This is the real exposure.',
        }),
      },
      {
        id: 'ask', group: 'Investigate', label: 'Speak to Jordan (calmly, no blame)', hint: 'When, where, what was on it?', tag: 'useful',
        run: () => ({
          reveal: { ask: 'Left on the 18:40 train last night. It held a spreadsheet export of about 4,000 customers (names, emails, phone numbers). No financial data and no passwords written down.' },
          text: 'Jordan confirms the timing and contents. A calm, blame-free conversation gets you the facts faster.',
        }),
      },
      // ── Contain
      {
        id: 'revoke', group: 'Contain', label: 'Revoke Jordan\'s sessions and tokens', hint: 'Cuts the laptop off from company systems.', tag: 'key',
        run: () => ({ set: { tokenActive: false }, disruption: 3, text: 'All cached sessions are revoked. The laptop can no longer reach company data.' }),
      },
      {
        id: 'resetpw', group: 'Contain', label: 'Reset Jordan\'s password', hint: 'Stops any saved credentials working.', tag: 'key',
        run: () => ({ set: { pwReset: true }, disruption: 3, text: 'Jordan\'s password is reset. Saved logins on the laptop are now useless.' }),
      },
      {
        id: 'lock', group: 'Contain', label: 'Remote lock (and wipe) the laptop via device management', hint: 'The laptop is online right now.', tag: 'key',
        run: () => ({ set: { deviceLocked: true }, disruption: 2, text: 'The lock-and-wipe command is queued. It will complete the next time the laptop connects, and it is online now.' }),
      },
      {
        id: 'blockacct', group: 'Contain', label: 'Disable Jordan\'s whole account', hint: 'Blocks everything.', tag: 'overreact',
        run: () => ({ set: { tokenActive: false }, disruption: 20, text: 'It works, but Jordan loses email and the CRM for a day, with a customer meeting this afternoon. Revoking tokens would have been enough.' }),
      },
      // ── Governance & communication
      {
        id: 'dpo', group: 'Communicate', label: 'Tell the Data Protection Officer and log it in the breach register', hint: 'They assess risk and decide on reporting.', tag: 'key',
        run: () => ({ set: { dpoNotified: true }, text: 'The DPO starts an assessment and records the incident in the breach register, with the time you became aware of it.' }),
      },
      {
        id: 'manager', group: 'Communicate', label: 'Tell Jordan\'s manager and the incident lead', hint: 'Right people, right time.', tag: 'useful',
        run: () => ({ set: { managerTold: true }, text: 'His manager and the incident lead are aware, and a blame-free review is agreed.' }),
      },
      {
        id: 'police', group: 'Communicate', label: 'Report the loss to the transport police', hint: 'Crime reference for insurance and records.', tag: 'useful',
        run: () => ({ set: { policeReported: true }, text: 'Reported. You get a crime reference number for the file.' }),
      },
      {
        id: 'ico', group: 'Communicate', label: 'Report to the ICO straight away, before any assessment', hint: 'Cover yourself?', tag: 'weak',
        run: () => ({ set: { icoPremature: true }, disruption: 8, text: 'The report goes in without the facts: you do not yet know if the data was accessed or what the real risk is. The DPO should assess first and make the call.' }),
      },
      {
        id: 'notifycust', group: 'Communicate', label: 'Email all 4,000 customers about the loss now', hint: 'Transparency is good, right?', tag: 'overreact',
        run: () => ({ set: { customersNotified: true }, disruption: 40, text: 'Panic and a flood of calls. Telling individuals is only required when the risk to them is high, and nobody has assessed that yet.' }),
      },
      // ── Close
      {
        id: 'declare', group: 'Close', label: 'Declare the incident contained and hand over to the DPO', hint: 'Only when you are sure.', tag: 'key', ends: true,
        when: (s) => !s.flags.tokenActive && (s.flags.deviceLocked || s.flags.pwReset),
        run: () => ({ text: 'You declare the incident contained and hand the file to the DPO.' }),
      },
    ],
    contained: (s) => !s.flags.tokenActive && (s.flags.deviceLocked || s.flags.pwReset),
    bonuses: (s) => {
      const out = [];
      out.push(s.flags.dpoNotified ? { label: 'DPO told and breach logged', points: 15 } : { label: 'DPO not told, no breach record', points: -25 });
      out.push(s.flags.deviceLocked ? { label: 'Device locked and wiped', points: 10 } : { label: 'Device left usable', points: -15 });
      out.push(s.flags.pwReset ? { label: 'Password reset', points: 5 } : { label: 'Password not reset', points: -5 });
      if (s.flags.policeReported) out.push({ label: 'Police report made', points: 3 });
      if (s.flags.managerTold) out.push({ label: 'Manager informed', points: 3 });
      if (s.flags.icoPremature) out.push({ label: 'Reported to the ICO before assessment', points: -8 });
      if (s.flags.customersNotified) out.push({ label: 'Customers notified without a risk assessment', points: -15 });
      return out;
    },
    ratings: [
      { min: -999, name: 'Breach', blurb: 'Customer data left the company.' },
      { min: 55, name: 'Costly', blurb: 'Contained, but with avoidable damage or missing steps.' },
      { min: 95, name: 'Solid', blurb: 'A sound, defensible response.' },
      { min: 125, name: 'Textbook', blurb: 'Quick containment, the right people told, nothing overdone.' },
    ],
    debrief: [
      {
        id: 'ic-laptop-ico',
        question: 'The disk was encrypted. What decides whether the ICO must be told?',
        options: [
          { text: 'Whether the breach is likely to result in a risk to people\'s rights and freedoms. The DPO assesses and documents it, and if it is, reports within 72 hours.', correct: true, explain: 'Under UK GDPR you must report a personal data breach to the ICO within 72 hours of becoming aware unless it is unlikely to result in a risk to individuals, and you must document every breach either way. This is general guidance, not legal advice.' },
          { text: 'Always report every lost device immediately.', correct: false, explain: 'Not every incident is reportable. The test is likely risk to individuals, and you still record all breaches internally.' },
          { text: 'Only if the press finds out.', correct: false, explain: 'Media interest is irrelevant to the legal test. It is about risk to the people whose data was affected.' },
          { text: 'Never: lost devices are the user\'s responsibility.', correct: false, explain: 'The organisation is the data controller. It is accountable for the data on its devices, whoever lost them.' },
        ],
      },
      {
        id: 'ic-laptop-prevent',
        question: 'Which combination best prevents a repeat?',
        options: [
          { text: 'Enforced disk encryption with a PIN, device management that can lock and wipe, short-lived sign-in tokens, and a culture where people report losses straight away without blame.', correct: true, explain: 'Encryption protects the files, remote wipe and short tokens limit what a finder can reach, and blame-free reporting shortens the time before you can act, which is often the biggest factor.' },
          { text: 'Ban laptops from leaving the office.', correct: false, explain: 'Unrealistic for sales and remote work, and it pushes people to hide problems.' },
          { text: 'Warn staff to be more careful.', correct: false, explain: 'Reminders alone do not limit the damage when someone inevitably forgets a bag.' },
          { text: 'Stop storing customer data anywhere.', correct: false, explain: 'Good data minimisation helps, but you cannot operate a sales team without any customer data.' },
        ],
      },
    ],
  },
];

// Everything the game draws from.
export const INCIDENTS = [...CORE, ...EXTRA, ...LEAD, ...VULN, ...NETWORK, ...PENTEST];
