// Lead-level simulations. Everything here is fictional. IP addresses come from the
// reserved documentation ranges (203.0.113.0/24, 198.51.100.0/24), and the .example
// domains are not real.
//
// At this level the skills are leadership ones: ranking what matters, establishing
// facts before briefing anyone, telling leaders and regulators the truth in the right
// order, and checking other people's words before they go out. The stage types are the
// same as the senior simulations (see engine.js).

const RATINGS = [
  { name: 'Out of control', blurb: 'Decisions and messages ran ahead of the facts, or important people were left out. Read each stage note: leading an incident is mostly about order and honesty.' },
  { name: 'Coping', blurb: 'You kept the worst from happening, with gaps in priorities, facts or communication.' },
  { name: 'Incident lead', blurb: 'Sound priorities, facts before messages, and honest, proportionate decisions.' },
  { name: 'Calm under fire', blurb: 'Precise priorities, well-founded decisions, accurate communication and a report others can rely on.' },
];

export const LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'board-brief',
    title: 'Operation Glass House',
    skill: 'data',
    minutes: 22,
    blurb: 'A payment problem and a suspected breach hit during peak trading. You have to establish the facts, brief the board, meet your obligations and not overpromise.',
    brief: [
      'It is Friday 06:40 at Contoso, in the middle of the busiest trading week of the year. The security director is on a flight and you are the incident lead. Customers are being charged twice for orders, and the payment systems team has found something that should not be there.',
      'Your job is not only to investigate. It is to decide what matters most, find out what is true before anyone is told anything, brief the board, meet your duties to the bank and the regulator, and check what goes out to customers. The board will act on whatever you tell them.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'priorities', type: 'prioritise', title: 'Rank what matters first',
        intro: 'Five things are demanding your attention. Tap them in order, most urgent first. Think about live harm to customers, what is still getting worse, and what has a deadline.',
        items: [
          { id: 'g1', source: 'Payments', priority: 1, text: 'Customers are being charged twice at checkout, and the amount of duplicate charges is growing by the minute.', why: 'Active financial harm to real people that is happening right now. Stopping it comes before anything else.' },
          { id: 'g2', source: 'Identity', priority: 2, text: 'A service account no one recognises is active on the payment gateway servers.', why: 'A possible live intruder. You must understand it quickly, but you need the facts and the charging problem is hurting people already.' },
          { id: 'g3', source: 'Legal', priority: 3, text: 'The contract with your acquiring bank requires notice of any suspected compromise of payment systems within a fixed period.', why: 'A real deadline with real consequences, but it is measured in hours, not minutes, so it follows the live harm.' },
          { id: 'g4', source: 'Press office', priority: 4, text: 'A journalist has emailed asking whether Contoso has "a payments problem".', why: 'It needs a prepared line soon, but it is not harming anyone and a premature statement would be worse than none.' },
          { id: 'g5', source: 'Board office', priority: 5, text: 'The quarterly board pack is due for approval on Friday afternoon.', why: 'Planned work. It can move.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Establish the facts before you brief anyone',
        intro: 'You will be asked to say what happened. Work out what the records actually show and flag only what you can support. Anything you cannot prove stays out of the briefing.',
        clues: {
          account: { strength: 'strong', text: 'A new service account "svc-gw-sync" was created on the gateway at 03:12, using an administrator login that is rarely used.' },
          script: { strength: 'strong', text: 'The checkout confirmation script was edited at 03:40 so that it submits each payment twice.' },
          scope: { strength: 'strong', text: 'The duplicate charges only affect orders after 03:40, and only through the web checkout.' },
          cards: { strength: 'strong', text: 'The card vault shows no unusual reads or exports: there is no sign that stored card data was accessed.' },
          mfa: { strength: 'weak', text: 'The administrator login that created the account did not use MFA, as the gateway admin console is exempt from it.' },
        },
        artefacts: [
          {
            id: 'gateway', title: 'Gateway and change records',
            lines: [
              { id: 'k1', type: 'clue', clue: 'account', text: '03:12  Gateway admin: user "svc-gw-sync" created by admin account "pay-admin2" from 203.0.113.58', note: 'An account created by a rarely used administrator login, from an outside address, at night. That is not routine administration.' },
              { id: 'k2', type: 'clue', clue: 'script', text: '03:40  checkout-confirm.js modified: payment call now runs twice per order; edited by "svc-gw-sync"', note: 'The cause of the duplicate charges, and made by the account that should not exist.' },
              { id: 'k3', type: 'herring', text: '02:00  Scheduled deployment: promotional banner for the Friday sale published', note: 'A planned marketing change with no link to payments.' },
              { id: 'k4', type: 'herring', text: '06:10  Traffic to the checkout is 3x normal', note: 'Expected: this is the busiest week of the year. Volume does not explain double charging.' },
            ],
          },
          {
            id: 'orders', title: 'Orders and the card vault',
            lines: [
              { id: 'k5', type: 'clue', clue: 'scope', text: 'Duplicate charges: 1,840 orders, all after 03:40, all through the web checkout. None via the mobile app or in store.', note: 'A tight boundary, which tells you when it started and what it affects.' },
              { id: 'k6', type: 'clue', clue: 'cards', text: 'Card vault audit: no bulk reads, no exports, normal access by the payment service only', note: 'Good news you can state with evidence. It does not mean the attacker could not have done something else, only that this record shows nothing.' },
              { id: 'k7', type: 'herring', text: '05:30  Nightly reconciliation report sent to Finance', note: 'A routine report, and it is how the problem was first noticed, but it explains nothing about the cause.' },
              { id: 'k8', type: 'herring', text: 'Mobile app payments: no duplicates, normal volume', note: 'Useful for scope, but it adds nothing about the cause.' },
            ],
          },
          {
            id: 'admin', title: 'Admin console settings',
            lines: [
              { id: 'k9', type: 'clue', clue: 'mfa', text: 'Gateway admin console: MFA exempt for "pay-admin*" accounts (set 2 years ago for a vendor integration)', note: 'A weakness the attacker may have used. Nothing yet proves that, so it is a lead and not a finding.' },
              { id: 'k10', type: 'herring', text: 'Gateway version 8.4.2, last patched 3 weeks ago', note: 'Reasonably current. Nothing links it to this incident.' },
            ],
          },
        ],
      },
      {
        id: 'board', type: 'decision', title: 'Decide: what do you tell the board?',
        intro: 'The chair has called. It is 07:30 and the board is nervous. They will act on whatever you say.',
        prompt: 'How do you brief them?',
        options: [
          { id: 'honest', quality: 3, text: 'A short, factual briefing: what we know, what we do not know, what we are doing, what we need from them, and when the next update is', set: { honestBrief: true }, consequence: 'The board has a clear picture and a time to expect more. They back your plan and stay out of your way.' },
          { id: 'detail', quality: 2, text: 'Send them the full technical logs and a long timeline', set: { overload: true }, consequence: 'They have the facts, but no one can find the decisions that matter, and the chair calls you three more times to ask what it means.' },
          { id: 'reassure', quality: 1, text: 'Tell them it is under control and nothing was stolen', set: { overpromise: true }, consequence: 'It is not yet true. If you turn out to be wrong, you have lost the board\'s trust at the worst moment.' },
          { id: 'silent', quality: 0, text: 'Say nothing until the investigation is finished', set: { silence: true }, consequence: 'The board hears about it from the journalist first. They are angry, and they begin giving their own instructions to your team.' },
        ],
      },
      {
        id: 'notify', type: 'decision', title: 'Decide: bank, regulator and the card scheme',
        intro: 'The facts are partly clear: someone got into the gateway, and customers have been double-charged. You do not yet know whether any personal data was taken.',
        notes: [
          { when: 'overpromise', text: 'You have already told the board that nothing was stolen. Whatever you do now has to be consistent with the facts, not with that statement.' },
          { when: 'silence', text: 'The board found out from the press. Pressure to "make a statement" is high.' },
        ],
        prompt: 'What do you do about your obligations?',
        options: [
          { id: 'now', quality: 3, text: 'Tell the DPO and Legal now, notify the acquiring bank as the contract requires, and begin the regulator assessment, so the clock is respected', set: { notified: true }, consequence: 'The bank and the regulator hear it from you, early and accurately. You keep the right to update them as the facts firm up.' },
          { id: 'proof', quality: 2, text: 'Notify the bank now, but wait until you can prove card data was taken before involving the regulator', set: { partial: true }, consequence: 'The bank is told. Waiting for proof of theft before assessing personal data risk means the 72-hour window may be missed.' },
          { id: 'final', quality: 1, text: 'Wait for the final investigation report before telling anyone outside', set: { late: true }, consequence: 'The report is days away. The contract and the regulator\'s timelines will not wait for it.' },
          { id: 'hide', quality: 0, text: 'Do not notify anyone: no card data was taken, so there is nothing to report', set: { hidden: true }, consequence: 'You have breached your contract and perhaps the law, and the bank will find out in the worst possible way.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft customer statement',
        intro: 'Customer care has drafted a statement for the website and social media. Customers will take it at its word, and so will the regulator.',
        draftIntro: 'Read each line of the draft. Flag every claim that is wrong, unsupported or overstated, so it can be corrected before it goes out.',
        statements: [
          { id: 'c1', sound: true, text: 'Some customers were charged twice for web orders placed after 03:40 today. We will refund the duplicate charges automatically.', why: 'Supported by the order records, and it says what customers need to know.' },
          { id: 'c2', sound: false, text: 'No customer data has been affected by this incident.', why: 'Unsupported. The card vault shows no unusual access, but you have an unknown account in the gateway and the scope is not yet confirmed. Say what you know and that you are still investigating.' },
          { id: 'c3', sound: false, text: 'This was a sophisticated attack by a foreign government.', why: 'There is no evidence of who is responsible, and naming a state would be speculation that could cause real harm.' },
          { id: 'c4', sound: true, text: 'We are investigating and will update this page by 18:00 today.', why: 'It commits to something you can deliver and tells customers when to look next.' },
          { id: 'c5', sound: false, text: 'The problem is fixed and will not happen again.', why: 'You cannot promise that, and you have not finished containing it.' },
          { id: 'c6', sound: true, text: 'If you see an unexpected charge, contact us on the number below and do not share your card details with anyone who calls you.', why: 'Useful, practical advice that helps customers and reduces the chance of follow-up scams.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the summary for the board',
        intro: 'The board will read this and act on it, so include what the evidence supports and nothing more. Be honest about how your own decisions affected things.',
        statements: [
          { id: 'b1', correct: true, text: 'A service account was created on the payment gateway at 03:12 using a rarely used administrator login from an outside address.', why: 'Shown by the gateway record.' },
          { id: 'b2', correct: true, text: 'The checkout script was modified at 03:40 so that each payment is submitted twice, which caused duplicate charges on about 1,840 web orders.', why: 'Shown by the change record and the order data.' },
          { id: 'b3', correct: true, text: 'The card vault audit shows no unusual reads or exports so far.', why: 'Accurately reports what the record shows, without claiming more.' },
          { id: 'b4', correct: true, text: 'It is not yet known what else the attacker did with their access, or whether any personal data was taken.', why: 'An honest statement of what is unknown. A good report says what you do not know.' },
          { id: 'b5', correct: false, text: 'The incident was caused by a foreign state.', why: 'Unsupported attribution.' },
          { id: 'b6', correct: false, text: 'No customer data was accessed.', why: 'Unsupported. The record shows no unusual reads of the vault, but the full scope is not yet known.' },
          { id: 'b7', correct: false, text: 'The payments team failed to secure the gateway.', why: 'A judgement about colleagues is not a finding. A report states facts and leaves blame for a proper review.' },
          { id: 'b8', when: 'honestBrief', correct: true, text: 'The board was briefed at 07:30 with the facts known, the unknowns and a time for the next update.', why: 'An accurate record of how the board was informed.' },
          { id: 'b9', when: 'overpromise', correct: true, text: 'The board was told at 07:30 that the incident was under control and that nothing was stolen, which was not yet supported.', why: 'An honest account of a mistake in your own communication.' },
          { id: 'b10', when: 'silence', correct: true, text: 'The board was not briefed until after a journalist asked about the incident.', why: 'An honest record of the delay.' },
          { id: 'b11', when: 'notified', correct: true, text: 'The acquiring bank was notified, and the DPO and Legal began their assessment, at the same time as the board briefing.', why: 'An accurate record of meeting the obligations.' },
          { id: 'b12', when: 'late', correct: true, text: 'The bank and the regulator were not notified until after the investigation report was complete, which is later than the contract and the 72-hour window allow.', why: 'The honest consequence of waiting.' },
        ],
        actions: [
          { id: 'x1', correct: true, text: 'Remove the unauthorised account and the edited script, reset the gateway administrator credentials, and require MFA on all gateway administrator accounts.', why: 'It closes the door, removes the changes and fixes the weakness that may have let the attacker in.' },
          { id: 'x2', correct: true, text: 'Continue the investigation into everything the account touched, and give the board and the bank a written update by the agreed time.', why: 'The scope is still open, and a promised update keeps trust.' },
          { id: 'x3', correct: true, text: 'Refund all duplicate charges automatically and contact affected customers with the same message everywhere.', why: 'It puts customers right and keeps the communication consistent.' },
          { id: 'x4', correct: false, text: 'Take the whole website offline until the investigation is finished.', why: 'Disproportionate. The harm comes from one script that can be corrected.' },
          { id: 'x5', correct: false, text: 'Tell customers their card details are safe.', why: 'You cannot say so yet.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'lead-exam',
    title: 'Promotion exam: Incident Response Lead',
    skill: 'data',
    minutes: 28,
    blurb: 'Launch day. A hidden script is stealing card details at checkout while the business wants the launch to go ahead. Silver or better to pass.',
    brief: [
      'It is Thursday 07:30 and Contoso launches its biggest product of the year at 10:00. You are the incident lead, and this is your promotion exam. Marketing, the CEO and a hundred thousand customers are waiting for that launch.',
      'The case tests the whole of the lead role: what to deal with first, the facts behind it, a hard call between security and the business, what you say and to whom, and whether other people\'s statements are safe to release. Unsupported claims and ignored people cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'priorities', type: 'prioritise', title: 'Rank the morning\'s problems',
        intro: 'Rank these from most to least urgent. One of them is much more serious than it first appears.',
        items: [
          { id: 'x1', source: 'Web monitoring', priority: 1, text: 'The checkout page is loading a script from an external domain that was not there yesterday.', why: 'Possible live theft of card details from every customer who pays. It is quiet, so it is easy to underrate, and it gets worse with every order.' },
          { id: 'x2', source: 'Identity', priority: 2, text: 'The e-commerce admin portal was signed in to at 04:10 from an address in another country.', why: 'This is probably how someone changed the page. It matters, but it is a lead to the first problem and not the harm itself.' },
          { id: 'x3', source: 'Operations', priority: 3, text: 'The content delivery network reports a small spike in errors for the new product images.', why: 'It will affect the launch experience, but it harms nobody and can be fixed later.' },
          { id: 'x4', source: 'Supplier', priority: 4, text: 'A supplier has emailed about a planned maintenance window next Tuesday.', why: 'Planned, routine and not urgent.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Investigate the checkout page',
        intro: 'The business wants a quick answer: is this serious enough to delay the launch? Work out what the page is doing and how it got there. Flag only what you can justify.',
        clues: {
          extscript: { strength: 'strong', text: 'The checkout page loads a script from cdn-analytics.example, a domain registered five days ago.' },
          capture: { strength: 'strong', text: 'The script reads the card number and security code from the payment form and sends them to an outside server as customers type.' },
          admin: { strength: 'strong', text: 'The page was edited at 04:12 by the content admin account, straight after a sign-in from an unfamiliar country.' },
          stolen: { strength: 'strong', text: 'The admin password appears in a list of credentials taken from a staff member\'s personal computer by information-stealing malware.' },
          nomfa: { strength: 'weak', text: 'The content admin account does not use MFA.' },
        },
        artefacts: [
          {
            id: 'page', title: 'The checkout page and its scripts',
            lines: [
              { id: 'p1', type: 'clue', clue: 'extscript', text: 'checkout.html: new <script src="https://cdn-analytics.example/t.js"> added; domain registered 5 days ago', note: 'A new script from a brand-new domain on the page where card details are typed. The strongest sign of a skimmer.' },
              { id: 'p2', type: 'clue', clue: 'capture', text: 't.js (decoded): listens for input in the card number and CVV fields and posts them to 203.0.113.58', note: 'It does exactly what a card skimmer does. Card details are being copied as people type.' },
              { id: 'p3', type: 'herring', text: 'checkout.html: existing analytics script from the company\'s own domain (unchanged)', note: 'Part of the normal page. Do not mistake the genuine analytics for the malicious one.' },
              { id: 'p4', type: 'herring', text: 'Page load time is 1.9 s, within normal range', note: 'A skimmer does not slow a page down, so speed tells you nothing here.' },
            ],
          },
          {
            id: 'admin', title: 'Admin portal and account',
            lines: [
              { id: 'a1', type: 'clue', clue: 'admin', text: '04:10  content-admin signs in from 203.0.113.58 (another country); 04:12 checkout.html edited', note: 'The edit followed straight after an unusual sign-in. This is how the script got on to the page.' },
              { id: 'a2', type: 'clue', clue: 'nomfa', text: 'content-admin: password only, MFA not enabled', note: 'A real weakness that probably helped, but a missing control is not proof of what happened.' },
              { id: 'a3', type: 'herring', text: '09:05 yesterday  marketing user updates the product description text', note: 'A normal change by a different user, with no link to the checkout.' },
            ],
          },
          {
            id: 'intel', title: 'Threat intelligence',
            lines: [
              { id: 'i1', type: 'clue', clue: 'stolen', text: 'Credential feed: content-admin@contoso.com and its password found in an infostealer log, collected 6 days ago', note: 'This explains how the attacker obtained the password: a staff member\'s personal computer was infected.' },
              { id: 'i2', type: 'herring', text: 'Industry bulletin: a general warning about card skimmers in online shops', note: 'Background reading that fits, but it is not evidence about your site.' },
              { id: 'i3', type: 'herring', text: 'An old, unrelated blocklist entry for a different domain', note: 'Noise.' },
            ],
          },
        ],
      },
      {
        id: 'launch', type: 'decision', title: 'Decide: the launch',
        intro: 'The CEO calls: "We launch at ten. Whatever it is, fix it without stopping the launch. We have spent two million on this."',
        prompt: 'What do you do?',
        options: [
          { id: 'fix', quality: 3, text: 'Remove the malicious script and the account\'s access now, reset the credentials and add MFA, move the payment step to the payment provider\'s hosted page, preserve the evidence, then tell the CEO the launch can go ahead safely once these steps are done', set: { balanced: true }, consequence: 'The skimmer is removed and card entry no longer touches your page. The launch proceeds on time with the risk closed. You told the CEO what is needed and why.' },
          { id: 'delay', quality: 2, text: 'Stop the launch and take the whole site offline until the investigation is complete', set: { delayed: true }, consequence: 'It is safe, but you have cancelled the launch and cost the business millions, when removing the script would have been enough.' },
          { id: 'ignore', quality: 1, text: 'Let the launch go ahead and fix the script afterwards, as the CEO asked', set: { skimmed: true }, consequence: 'Thousands more customers enter their card details into a page that is stealing them. Many of them are launch customers.' },
          { id: 'quiet', quality: 0, text: 'Delete the script and say nothing to anyone, so the launch is not disturbed', set: { skimmed: true, evidenceLost: true }, consequence: 'The script is gone, and so is the evidence of what it took. Nobody can assess the harm and nobody knows to check for fraud.' },
        ],
      },
      {
        id: 'tell', type: 'decision', title: 'Decide: card data has been taken',
        intro: 'The script has been running for about three hours. You do not yet know how many cards were captured, but it will be hundreds.',
        notes: [
          { when: 'skimmed', text: 'The skimmer ran for longer than it should have, so the number of captured cards will be larger.' },
          { when: 'evidenceLost', text: 'You deleted the script without keeping a copy, so working out exactly what it captured will be harder.' },
        ],
        prompt: 'Who do you tell, and when?',
        options: [
          { id: 'all', quality: 3, text: 'Tell Legal, the DPO, the acquiring bank and the card schemes now, report to the police and the NCSC, and prepare accurate customer notices once the scope is known', set: { notified: true }, consequence: 'Each party hears it from you, early. The banks can watch for fraud on the affected cards, and the regulator\'s timeline is respected.' },
          { id: 'bank', quality: 2, text: 'Tell only the acquiring bank and handle the rest after the launch', set: { partial: true }, consequence: 'The bank can act, but the regulator and the card schemes are left waiting, and the 72-hour window runs on.' },
          { id: 'count', quality: 1, text: 'Wait until you know exactly how many cards were taken before telling anyone', set: { late: true }, consequence: 'Counting takes days. Meanwhile the stolen cards are being used.' },
          { id: 'none', quality: 0, text: 'Do not tell anyone outside the company: the script has been removed', set: { hidden: true }, consequence: 'The banks cannot warn cardholders, the cards are used for fraud, and when it comes out you have also broken your obligations.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the junior\'s executive summary',
        intro: 'Part of leading is making sure what goes up to the executives is right before it leaves your team.',
        draftIntro: 'Sam, a junior analyst, has drafted this summary for the executive team. Flag every claim that is wrong, unsupported or overstated, so Sam can fix it before it is sent.',
        statements: [
          { id: 'j1', sound: true, text: 'A script from a recently registered domain was added to the checkout page and copies card details as customers type.', why: 'Supported by the page and the decoded script.' },
          { id: 'j2', sound: true, text: 'The page was edited at 04:12 using the content admin account, shortly after a sign-in from an unfamiliar country.', why: 'Supported by the admin portal record.' },
          { id: 'j3', sound: false, text: 'Only a handful of cards were captured.', why: 'Unsupported. The script ran for hours on the busiest page of the site, so the real number is likely far higher and is not yet known.' },
          { id: 'j4', sound: false, text: 'The attack was carried out by an organised crime group from Eastern Europe.', why: 'Attribution is unsupported. All you have is an address and a script.' },
          { id: 'j5', sound: false, text: 'The content admin was careless and should be disciplined.', why: 'A judgement about a person, not a finding. The credential was stolen from a personal computer, and a missing MFA control is a company weakness.' },
          { id: 'j6', sound: true, text: 'The content admin password appeared in a credential list collected by infostealer malware six days ago.', why: 'Supported by the intelligence feed.' },
          { id: 'j7', sound: false, text: 'The incident is fully contained and no further checks are needed.', why: 'Overstated. You have not yet confirmed that there are no other changes or other compromised accounts.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the incident summary',
        intro: 'Your own summary for the executive team and the regulator file. Include what the evidence supports and recommend proportionate actions.',
        statements: [
          { id: 'r1', correct: true, text: 'A malicious script from cdn-analytics.example was added to the checkout page at 04:12, using the content admin account, and copies card details to an outside server.', why: 'Shown by the page, the script and the admin record.' },
          { id: 'r2', correct: true, text: 'The content admin password was taken from a staff member\'s personal computer by information-stealing malware, and the account had no MFA.', why: 'Shown by the intelligence feed and the account settings.' },
          { id: 'r3', correct: true, text: 'The script ran from 04:12 until it was removed, so every card entered on the page in that period may have been captured.', why: 'The proper way to describe the exposure without claiming a figure.' },
          { id: 'r4', correct: true, text: 'The number of cards captured, and whether any other data was taken, is not yet known.', why: 'An honest statement of what is unknown.' },
          { id: 'r5', correct: false, text: 'The incident was caused by a foreign state.', why: 'Unsupported attribution.' },
          { id: 'r6', correct: false, text: 'No customer was harmed.', why: 'Unsupported, and probably false: captured card details are being used for fraud.' },
          { id: 'r7', correct: false, text: 'The payments team is responsible for the breach.', why: 'A judgement about colleagues is not a finding.' },
          { id: 'r8', when: 'balanced', correct: true, text: 'The script and the account\'s access were removed, credentials were reset, MFA was added and the payment step was moved to the provider\'s hosted page, so the launch went ahead on time.', why: 'An accurate record of a balanced decision.' },
          { id: 'r9', when: 'delayed', correct: true, text: 'The launch was cancelled and the whole site taken offline, which stopped the skimming but cost the business the launch.', why: 'An honest account of the cost of that decision.' },
          { id: 'r10', when: 'skimmed', correct: true, text: 'The launch went ahead before the script was removed, so more cards were captured than would otherwise have been.', why: 'The consequence of that choice belongs in the record.' },
          { id: 'r11', when: 'evidenceLost', correct: true, text: 'The script was deleted without a copy being kept, so the exact scope of the capture is harder to determine.', why: 'Honest reporting of your own action.' },
          { id: 'r12', when: 'notified', correct: true, text: 'Legal, the DPO, the acquiring bank, the card schemes, the police and the NCSC were informed promptly.', why: 'An accurate record that the obligations were met.' },
          { id: 'r13', when: 'late', correct: true, text: 'Notification was delayed until the number of affected cards could be confirmed, which is later than the 72-hour window and the card scheme rules allow.', why: 'The honest consequence of waiting.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Identify every card entered during the exposure window and give the bank the list so that cardholders can be protected against fraud.', why: 'It is the step that protects the people affected.' },
          { id: 'a2', correct: true, text: 'Require MFA on all admin accounts, review who can change checkout pages, and add monitoring for new external scripts on payment pages.', why: 'Fixes the weaknesses that let it happen and the gap in visibility.' },
          { id: 'a3', correct: true, text: 'Check the personal computer that leaked the credential, and look for other credentials from the same infection.', why: 'The same malware may have taken other passwords.' },
          { id: 'a4', correct: false, text: 'Permanently remove every third-party script from the website.', why: 'Out of proportion. The aim is to control and monitor scripts, not to remove all of them.' },
          { id: 'a5', correct: false, text: 'Tell customers that their cards are safe.', why: 'It is false, and could lead to harm.' },
        ],
      },
    ],
  },
];
