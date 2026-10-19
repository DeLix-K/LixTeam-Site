// Weekly simulations (released on a schedule: see core/weekly.js). Everything here is fictional.

const RATINGS = [
  { name: 'Taken in', blurb: 'The pressure worked. Read each stage note: every one of these moves is learnable.' },
  { name: 'Cautious', blurb: 'You avoided the worst, with gaps in checking, evidence or how you handled the pressure.' },
  { name: 'Sharp', blurb: 'Good instincts, a sound check and a calm answer to the pressure.' },
  { name: 'Unshakeable', blurb: 'You verified properly, stayed polite under pressure and told the right people.' },
];

export const WEEKLY = [
  {
    id: 'voice-clone',
    title: 'The voice on the phone',
    skill: 'ai',
    minutes: 18,
    blurb: 'The finance director rings, sounding stressed, and asks you to make an urgent payment. It sounds exactly like her. Decide how to check before you act.',
    brief: [
      'It is 16:40 on a Thursday. You work in accounts payable. A call comes in on your desk phone from a number that looks like the finance director\'s, Dana\'s. She sounds hurried: "I am boarding a flight. A supplier must be paid £48,000 in the next hour or we lose the contract. I will send the details. Please do not tell anyone, it is confidential."',
      'You will rank the checks to make, read what the call really shows, spend a few minutes of checking, decide how to answer her insistence, and review the note you will leave for your manager.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the checks to make',
        intro: 'Tap the checks in order, the most reliable first. Think about what an impersonator could fake, and what only the real person could do.',
        items: [
          { id: 'k1', source: 'Call back', priority: 1, text: 'Hang up and ring Dana back on the number in the company directory, not the one that called you.', why: 'An impersonator cannot answer a call to Dana\'s real number. It is the strongest and quickest check.' },
          { id: 'k2', source: 'Second person', priority: 2, text: 'Ask a second approver, such as the chief executive or your manager, to confirm the payment through a separate channel.', why: 'A payment this size should never rest on one voice. A second person is a control, not an insult.' },
          { id: 'k3', source: 'The details', priority: 3, text: 'Check the supplier name and bank details against the supplier record, and look for anything new.', why: 'A changed bank account is the classic sign of fraud, and the records will show it.' },
          { id: 'k4', source: 'The voice', priority: 4, text: 'Judge whether the voice sounds like Dana.', why: 'Voices can now be copied with very little audio, so this proves nothing and can mislead you.' },
          { id: 'k5', source: 'Caller ID', priority: 5, text: 'Check that the number shown is Dana\'s.', why: 'Numbers can be faked. It is the weakest check of all.' },
        ],
      },
      {
        id: 'call', type: 'evidence', title: 'Read what the call really shows',
        intro: 'You have your notes on the call and the supplier record. Look for the signs of pressure and the facts that need checking. Flag only what the facts support.',
        clues: {
          urgency: { strength: 'strong', text: 'The caller said the payment must be made within the hour or the contract would be lost.' },
          secrecy: { strength: 'strong', text: 'The caller told you not to tell anyone and to keep it confidential.' },
          newbank: { strength: 'strong', text: 'The details sent afterwards give a new bank account for the supplier, different from the one on the supplier record.' },
          bypass: { strength: 'strong', text: 'The request skips the normal two-person approval that applies to every payment over £10,000.' },
          voice: { strength: 'weak', text: 'The voice sounded exactly like Dana, with her usual way of speaking.' },
        },
        artefacts: [
          {
            id: 'notes', title: 'Your notes on the call',
            lines: [
              { id: 'z1', type: 'clue', clue: 'urgency', text: 'Notes, 16:40: "Must be paid within the hour or we lose the contract. I am boarding now."', note: 'Urgency stops you thinking, and is on every list of the signs of a scam.' },
              { id: 'z2', type: 'clue', clue: 'secrecy', text: 'Notes, 16:41: "Please do not mention this to anyone. It is confidential until the deal is announced."', note: 'Secrecy is how a scammer stops you from checking.' },
              { id: 'z3', type: 'clue', clue: 'voice', text: 'Notes, 16:42: "Sounded just like Dana: same accent, same way of saying my name."', note: 'It proves little. Voices can be copied from a few seconds of a speech or a video.' },
              { id: 'z4', type: 'herring', text: 'The call came in on your desk phone, not your mobile', note: 'Calls can reach a desk phone from anywhere.' },
              { id: 'z5', type: 'herring', text: 'Dana is known to travel often', note: 'It explains why the story is plausible, not whether it is true.' },
            ],
          },
          {
            id: 'details', title: 'The payment details and the policy',
            lines: [
              { id: 'z6', type: 'clue', clue: 'newbank', text: 'Email from "dana.m@contoso-group.example" at 16:50: supplier Fabrikam Parts, account ending 0912. Supplier record: account ending 3377, unchanged for 4 years', note: 'A new bank account for an old supplier, plus an email from a slightly different address. Both are red flags.' },
              { id: 'z7', type: 'clue', clue: 'bypass', text: 'Payment policy: "Payments over £10,000 require two approvers and a call-back to the supplier on a known number. No exceptions for urgency."', note: 'The request would break the policy that exists to stop this.' },
              { id: 'z8', type: 'herring', text: 'The email signature matches Dana\'s usual one', note: 'Signatures are easy to copy.' },
              { id: 'z9', type: 'herring', text: 'The sender\'s display name reads "Dana Mehta"', note: 'Display names can say anything. The address is what counts.' },
              { id: 'z10', type: 'plain', text: 'The company\'s real address ends @contoso.example', note: 'The email came from a lookalike, "contoso-group".' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'minutes', budget: 10, title: 'Spend your ten minutes of checking',
        intro: 'You have ten minutes before the "deadline". Spend all ten across these four checks.',
        items: [
          { id: 'c1', source: 'Call back', ideal: 3, text: 'Ring Dana on the number in the directory and, if there is no answer, her assistant.', why: 'The best check, and it may take a couple of tries.' },
          { id: 'c2', source: 'Second approver', ideal: 3, text: 'Contact your manager or the chief executive by a separate channel and ask them to confirm.', why: 'Brings in a person who can say yes or no.' },
          { id: 'c3', source: 'Records', ideal: 2, text: 'Compare the new bank account and sender address with the supplier record and the real address.', why: 'Quick, and shows the red flags clearly.' },
          { id: 'c4', source: 'Report', ideal: 2, text: 'Tell the security team about the call and the email so the others are warned.', why: 'Other people in the company may get the same call.' },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: she rings back, angrier',
        intro: 'The caller rings again at 17:05: "Why have you not paid? I am about to lose a £2 million contract because of you. Do it now or I will remember this when your review comes round."',
        prompt: 'What do you do?',
        options: [
          { id: 'verify', quality: 3, text: 'Stay polite, say you will pay as soon as it has been confirmed in the usual way, hang up and ring Dana on her directory number and your manager, and report the call', set: { verify: true }, consequence: 'Dana is in a meeting and has not called you. Your manager confirms there is no such contract. The call and the email are reported, and two colleagues are warned in time.' },
          { id: 'half', quality: 2, text: 'Ring the director\'s number but also start preparing the payment so it is ready', set: { half: true }, consequence: 'The real Dana tells you nothing was asked of you. The payment is prepared but not released, and your manager reminds you not to prepare a payment before it is confirmed.' },
          { id: 'ask', quality: 1, text: 'Ask the caller a personal question to prove who she is, and pay if she answers', set: { ask: true }, consequence: 'The caller answers confidently, because the details came from a public profile. You pay, and the money has gone by 17:20.' },
          { id: 'pay', quality: 0, text: 'Make the payment to avoid trouble', set: { pay: true }, consequence: 'The £48,000 is gone within the hour, and Dana never made the call.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft note for your manager',
        intro: 'A colleague has drafted the note.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'A caller who sounded like Dana asked for a £48,000 payment within the hour and asked me to tell nobody.', why: 'Supported by your notes.' },
          { id: 'p2', sound: false, text: 'The caller was Dana, and the payment was genuine.', why: 'Unsupported. The caller was not verified.' },
          { id: 'p3', sound: false, text: 'The call was made by a cloned voice.', why: 'Unsupported. The voice sounded right, but nothing proves how it was made. State what happened.' },
          { id: 'p4', sound: true, text: 'The bank account in the request was different from the supplier\'s record, and the email came from a lookalike address.', why: 'Supported by the records.' },
          { id: 'p5', sound: false, text: 'The caller must have had access to our systems.', why: 'Unsupported. The details could have come from public information.' },
          { id: 'p6', sound: true, text: 'I did not release the payment, and I confirmed with Dana by phone on her directory number.', why: 'Supported, if done.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your note for your manager',
        intro: 'Your own note. Include what the facts support and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'I received a call at 16:40 from a caller who sounded like Dana, asking me to pay £48,000 within the hour and not to tell anyone.', why: 'Shown by your notes.' },
          { id: 'r2', correct: true, text: 'An email from a lookalike address gave a new bank account for Fabrikam Parts that differs from the supplier record.', why: 'Shown by the records.' },
          { id: 'r3', correct: true, text: 'The request skipped the two-approver and call-back rules in the payment policy.', why: 'Shown by the policy.' },
          { id: 'r4', correct: true, text: 'We do not yet know who made the call or how they learned about the supplier.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'The caller used an artificial copy of Dana\'s voice.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'Dana is being impersonated by someone inside the company.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'It was foolish of the caller to try this.', why: 'A judgement, not a finding.' },
          { id: 'r8', when: 'verify', correct: true, text: 'I stayed polite, refused to pay until it was confirmed in the usual way, and rang Dana and my manager.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'half', correct: true, text: 'I verified with Dana but prepared the payment first, which I should not have done.', why: 'An honest account.' },
          { id: 'r10', when: 'ask', correct: true, text: 'I asked the caller a personal question, paid after a good answer, and the money was lost.', why: 'An honest account.' },
          { id: 'r11', when: 'pay', correct: true, text: 'I made the payment under pressure and the £48,000 was lost.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Report the call and the email to the security team, and warn other finance staff.', why: 'Others may get the same call.' },
          { id: 'a2', correct: true, text: 'Ask the bank to flag the account in the request, and keep the email and call notes.', why: 'Preserves evidence and may help recover money.' },
          { id: 'a3', correct: true, text: 'Remind everyone that urgent payments always need two approvers and a call-back, however senior the request sounds.', why: 'Keeps the rule clear.' },
          { id: 'a4', correct: false, text: 'Make the payment and ask questions afterwards.', why: 'The money would be gone.' },
          { id: 'a5', correct: false, text: 'Tell nobody to avoid embarrassing Dana.', why: 'It leaves others exposed.' },
        ],
      },
    ],
  },
];
