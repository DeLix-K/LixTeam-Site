// Network Security Architect simulations. Everything here is fictional. IP addresses come from the
// reserved documentation ranges and private ranges.
//
// The tier's themes: moving a company from "inside the network is trusted" to "every request is checked",
// doing it in steps the business can survive, and holding the line when cost or speed would flatten the design.

const RATINGS = [
  { name: 'Moat and castle', blurb: 'The edge was strong and the inside stayed trusted, or the change was rushed. Read each stage note: the design decides how far one mistake can travel.' },
  { name: 'Network lead', blurb: 'You moved the design the right way, with gaps in order, evidence or how you handled pressure.' },
  { name: 'Network architect', blurb: 'A design that checks every request, a migration the business could survive, and the judgement to stage a risky decision.' },
  { name: 'Trusted architect', blurb: 'An architecture that limits the damage from any single failure, and a plan the whole company could follow.' },
];

export const NETWORK_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'zero-trust-journey',
    title: 'Beyond the VPN',
    skill: 'hardening',
    minutes: 24,
    blurb: 'Contoso\'s staff connect by VPN and are then trusted almost everywhere. Work out where to start moving to "check every request", look at what the VPN logs show, spend a limited budget and deal with an executive who wants the VPN switched off in two weeks.',
    brief: [
      'Contoso\'s 1,500 staff, 200 contractors and eleven suppliers reach internal systems through one VPN. Once connected, a person can reach most of the internal network. The VPN has had two serious flaws in a year, and the board wants to "go zero trust".',
      'You are the network security architect. You will rank what to move first, check what the VPN logs really show, spend a limited budget of engineer-weeks, decide how to respond to a demand to remove the VPN quickly, and review the summary before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to move off the VPN first',
        intro: 'Tap the groups in order, the most urgent to move first. Think about how much damage a stolen connection could do, how many people it affects, and how hard the move is.',
        items: [
          { id: 'a1', source: 'Suppliers and contractors', priority: 1, text: 'Eleven suppliers and 200 contractors connect with shared accounts and then reach the same network as staff.', why: 'The least controlled people have the widest access. A stolen supplier account is the most likely way in.' },
          { id: 'a2', source: 'Administrators', priority: 2, text: 'Administrators connect by VPN and then reach servers directly with their normal accounts.', why: 'The most powerful accounts need the strongest checks and the narrowest paths.' },
          { id: 'a3', source: 'Finance and customer data', priority: 3, text: 'The finance system and customer database are reachable by anyone on the VPN.', why: 'The most valuable data, and a clear first set of applications to put behind per-request checks.' },
          { id: 'a4', source: 'Office applications', priority: 4, text: 'Intranet, wiki and other low-risk applications are only available through the VPN.', why: 'Easy to move, though they carry little risk. Good for early wins after the above.' },
          { id: 'a5', source: 'Printers', priority: 5, text: 'Staff reach printers through the VPN when working from home.', why: 'An inconvenience with no security consequence.' },
        ],
      },
      {
        id: 'logs', type: 'evidence', title: 'Check what the VPN logs show',
        intro: 'You have a month of VPN logs and the supplier access list. Look for what should shape the plan. Flag only what the records support.',
        clues: {
          shared: { strength: 'strong', text: 'Supplier access uses 7 shared accounts, each used by several people from different addresses.' },
          wide: { strength: 'strong', text: 'A typical VPN session reached 340 different internal servers in the month, though the person\'s job needs about 12.' },
          odd: { strength: 'strong', text: 'One supplier account connected from three countries in 24 hours.' },
          flaws: { strength: 'strong', text: 'The VPN appliance had two serious vendor flaws in a year, and the last was patched 19 days after the fix was released.' },
          cost: { strength: 'weak', text: 'The VPN licence costs £140,000 a year.' },
        },
        artefacts: [
          {
            id: 'sessions', title: 'VPN session analysis',
            lines: [
              { id: 'b1', type: 'clue', clue: 'wide', text: 'Median distinct internal servers reached per VPN session in a month: 340. Median needed by role, from job descriptions: 12', note: 'The VPN grants far more reach than anyone needs. A stolen session could roam the network.' },
              { id: 'b2', type: 'clue', clue: 'odd', text: 'Account supp-conveyor-2: sign-ins from the UK, Poland and Singapore within 24 hours, and from 8 different addresses', note: 'A shared account used from several countries looks like credential sharing at best and theft at worst.' },
              { id: 'b3', type: 'herring', text: 'Peak concurrent VPN sessions: 1,100', note: 'A capacity measure.' },
              { id: 'b4', type: 'herring', text: 'Average session length: 7 hours 40 minutes', note: 'Not a finding.' },
              { id: 'b5', type: 'plain', text: 'Multi-factor sign-in is required for staff', note: 'Good, and it does not limit what staff can reach once connected.' },
            ],
          },
          {
            id: 'suppliers', title: 'Supplier access and the VPN appliance',
            lines: [
              { id: 'b6', type: 'clue', clue: 'shared', text: 'Supplier VPN accounts: 7 shared, passwords last changed 14 months ago on average. No second factor on 5 of them', note: 'Shared, old, weakly protected accounts reaching the full network. The first thing to fix.' },
              { id: 'b7', type: 'clue', clue: 'flaws', text: 'VPN appliance: vendor fix released 4 March; applied 23 March. Previous flaw: fix released 11 September; applied 2 October (21 days)', note: 'A front door that is repeatedly left exposed for weeks. Part of the case for reducing reliance on it.' },
              { id: 'b8', type: 'clue', clue: 'cost', text: 'VPN licence and support: £140,000 a year', note: 'A cost that moves with the plan. It does not decide what is urgent.' },
              { id: 'b9', type: 'herring', text: 'The VPN vendor is a market leader', note: 'Popularity does not reduce risk.' },
              { id: 'b10', type: 'herring', text: 'The VPN was installed in 2017', note: 'Age alone is not a finding.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next quarter.',
        items: [
          { id: 'c1', source: 'Suppliers', ideal: 3, text: 'Replace shared supplier accounts with individual, multi-factor accounts and give each supplier access only to the systems they maintain, through a gateway that checks each request.', why: 'The most exposed group, and a real piece of work across eleven suppliers.' },
          { id: 'c2', source: 'Administrators', ideal: 2, text: 'Put administrator access behind jump hosts with hardware-key sign-in and session recording.', why: 'Narrows the most powerful paths.' },
          { id: 'c3', source: 'Crown jewels', ideal: 3, text: 'Put the finance system and customer database behind per-request access checks based on who and which device, and remove them from the open VPN network.', why: 'The first applications to move, and complex because many systems depend on them.' },
          { id: 'c4', source: 'Monitoring', ideal: 2, text: 'Log every access request, alert on impossible travel and unusual reach, and keep the VPN patched within a week of a fix.', why: 'Shows the new design working and shrinks the exposure of the old one.' },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the demand to switch the VPN off',
        intro: 'The COO says: "The board has said zero trust. The VPN is the problem and costs £140,000. Switch it off in two weeks and the savings and the story will both be ours."',
        prompt: 'What do you do?',
        options: [
          { id: 'staged', quality: 3, text: 'Offer a dated plan that retires the VPN in steps: suppliers and administrators within six weeks, finance and customer systems in three months, the rest by the end of the year, with the VPN kept in monitor-and-shrink mode until each group has moved', set: { staged: true }, consequence: 'The COO has real dates and an early milestone for the board. Each group moves with a tested fallback, and the VPN is switched off nine months later with no outage.' },
          { id: 'fast', quality: 2, text: 'Agree to the two weeks for suppliers and administrators only, and leave the rest on the VPN for now', set: { fast: true }, consequence: 'The riskiest groups move fast. A rush leaves two suppliers without access for a week, and the remaining VPN is left running without a plan.' },
          { id: 'refuse', quality: 1, text: 'Refuse: the VPN cannot be switched off without a full redesign first', set: { refuse: true }, consequence: 'The COO stops listening. The VPN stays for another two years, and the supplier risk stays too.' },
          { id: 'agree', quality: 0, text: 'Agree and switch off the VPN in two weeks, using a cheap remote-access tool to replace it', set: { agree: true }, consequence: 'The replacement gives everyone the same wide reach as before. Production support is locked out for a day and the savings are cancelled by the new tool.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft summary for the board',
        intro: 'A colleague has drafted the summary.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'A typical VPN session reaches about 340 servers in a month, against around 12 that the person\'s role needs.', why: 'Supported by the VPN analysis.' },
          { id: 'p2', sound: false, text: 'The shared supplier account used from three countries has been used by an attacker.', why: 'Unsupported. The pattern is suspicious, and the records do not show who used it.' },
          { id: 'p3', sound: false, text: 'Requiring multi-factor sign-in for staff means the VPN is safe.', why: 'It protects the sign-in but not what a connected person can reach.' },
          { id: 'p4', sound: true, text: 'Seven shared supplier accounts have passwords about 14 months old, and five have no second factor.', why: 'Supported by the supplier list.' },
          { id: 'p5', sound: false, text: 'Switching off the VPN will save £140,000 with no downside.', why: 'Overstated. A replacement has to be built, and the saving depends on how it is done.' },
          { id: 'p6', sound: true, text: 'Moving suppliers and administrators first removes the most exposed access earliest.', why: 'Well-founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Once connected, a VPN user can reach far more of the network than their job needs, about 340 servers against about 12.', why: 'Shown by the VPN analysis.' },
          { id: 'r2', correct: true, text: 'Seven shared supplier accounts have old passwords, five without a second factor, and one was used from three countries in a day.', why: 'Shown by the records.' },
          { id: 'r3', correct: true, text: 'The VPN appliance has been left unpatched for about three weeks after two serious vendor fixes.', why: 'Shown by the patch history.' },
          { id: 'r4', correct: true, text: 'It is not yet known whether the supplier account that connected from three countries was misused.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'Contoso has been breached through the VPN.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'Zero trust is a product we can buy and install.', why: 'Overstated. It is a design approach that takes planning.' },
          { id: 'r7', correct: false, text: 'The network team has been negligent.', why: 'A judgement about people.' },
          { id: 'r8', when: 'staged', correct: true, text: 'The VPN will be retired in steps, with suppliers and administrators moved within six weeks and the rest by year end, each with a fallback.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'fast', correct: true, text: 'Suppliers and administrators were moved in two weeks, two suppliers lost access for a week, and the remaining VPN has no plan.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'The VPN replacement was refused until a full redesign was done, and the supplier risk remained.', why: 'An honest account of the cost of refusing.' },
          { id: 'r11', when: 'agree', correct: true, text: 'The VPN was switched off in two weeks and replaced by a tool that gives the same wide reach, and production support was locked out for a day.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Move suppliers to individual multi-factor accounts and per-system access first.', why: 'The most exposed group.' },
          { id: 'a2', correct: true, text: 'Put administrator access behind jump hosts with hardware keys, then the finance and customer systems behind per-request checks.', why: 'Protects the most powerful paths and the most valuable data.' },
          { id: 'a3', correct: true, text: 'Keep the VPN patched within a week of a fix while it is being retired, and log and alert on how it is used.', why: 'Reduces the exposure of the old design during the move.' },
          { id: 'a4', correct: false, text: 'Replace the VPN with another tool that gives the same network access.', why: 'It changes the product, not the design.' },
          { id: 'a5', correct: false, text: 'Leave everything as it is until the VPN is attacked.', why: 'The exposure is already real.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'net-architect-exam',
    title: 'Promotion exam: Network Security Architect',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A hundred and twenty stores, a compromised till and a board that wants one flat network to cut costs. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso Retail has 120 stores. Last month, malware reached the tills in one store, and it was cleaned up. The finance director has proposed a single flat network across all stores to cut the cost of managing separate ones.',
      'The case tests the role: ranking risks across a large estate, spending limited effort, finding what really happened, standing firm on a design that would let one store\'s problem reach all of them, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the risks in the store network design',
        intro: 'A first review found five risks. Rank them by how much damage they could do across the whole chain, highest first.',
        items: [
          { id: 'x1', source: 'Store-to-store', priority: 1, text: 'Every store\'s network can reach every other store and head office with no rules in between.', why: 'One compromised till can spread to 119 stores and head office. The proposed flat network makes this permanent.' },
          { id: 'x2', source: 'Payment', priority: 2, text: 'Card payment devices share a network with staff laptops and the guest wireless in some stores.', why: 'A serious exposure of payment data, and a compliance problem.' },
          { id: 'x3', source: 'Remote management', priority: 3, text: 'A shared support account can sign in to every store router from the internet.', why: 'One credential controls the whole chain\'s network. A common route in.' },
          { id: 'x4', source: 'Visibility', priority: 4, text: 'There is no central monitoring of store networks.', why: 'You would not see the next store\'s problem. Important, but it follows the controls above.' },
          { id: 'x5', source: 'Wi-fi names', priority: 5, text: 'Store wireless networks use inconsistent names.', why: 'Untidy and unimportant.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-weeks', budget: 10, title: 'Spend your ten engineer-weeks',
        intro: 'Spend all ten weeks across these four pieces of work over the next two months.',
        items: [
          { id: 'y1', source: 'Segmentation', ideal: 3, text: 'Design a standard store network with separate zones for payments, staff, and guests, and rules between stores.', why: 'The structural fix, applied once and repeated 120 times.' },
          { id: 'y2', source: 'Payment', ideal: 3, text: 'Separate payment devices in the stores that mix them with other devices, and verify the result.', why: 'The most urgent exposure of payment data.' },
          { id: 'y3', source: 'Remote management', ideal: 2, text: 'Replace the shared support account with individual accounts, hardware keys and access only through a controlled gateway.', why: 'Closes a route that controls everything.' },
          { id: 'y4', source: 'Monitoring', ideal: 2, text: 'Send store network logs to a central place, and alert on unusual traffic between stores.', why: 'Shows the design working and catches the next incident quickly.' },
        ],
      },
      {
        id: 'incident', type: 'evidence', title: 'Find out what really happened in the compromised store',
        intro: 'You have the clean-up report from last month and the store network details. Check them for what matters. Flag only what the records support.',
        clues: {
          spread: { strength: 'strong', text: 'The malware on the till tried to connect to the tills in 14 other stores, and succeeded in 3 before it was stopped.' },
          shared: { strength: 'strong', text: 'The support account used to clean up the first store is the same account that can sign in to every store router.' },
          mixed: { strength: 'strong', text: 'In the first store, card payment devices were on the same network as the staff laptops.' },
          nocheck: { strength: 'strong', text: 'Nothing monitored traffic between stores, so the spread was found by a store manager, not by an alert.' },
          cost: { strength: 'weak', text: 'The clean-up took 11 days and cost £48,000.' },
        },
        artefacts: [
          {
            id: 'cleanup', title: 'Clean-up report',
            lines: [
              { id: 'z1', type: 'clue', clue: 'spread', text: 'Network logs: the infected till attempted connections to tills in 14 other stores over 6 hours. Successful in 3 stores (Leeds 4, Bath 2, Hull 1)', note: 'The malware moved from store to store because nothing stopped it. This is exactly what a flat network invites.' },
              { id: 'z2', type: 'clue', clue: 'nocheck', text: 'How it was found: the Leeds store manager reported slow tills. No security alert was raised', note: 'A person noticed, not the monitoring. Without a person, it would have spread further.' },
              { id: 'z3', type: 'clue', clue: 'cost', text: 'Clean-up: 11 days, £48,000, 3 stores affected', note: 'A real cost. It supports the case for the work and does not decide what it is.' },
              { id: 'z4', type: 'herring', text: 'The malware family was named in a security news article last year', note: 'Interesting, with no bearing on the design.' },
              { id: 'z5', type: 'herring', text: 'The first store\'s tills run the same software version as all the others', note: 'Normal, and it does not explain how the problem spread.' },
            ],
          },
          {
            id: 'design', title: 'Store network and the proposal',
            lines: [
              { id: 'z6', type: 'clue', clue: 'shared', text: 'Support account "retail-support": sign-in permitted to all 120 store routers, from any internet address. Used to clean the first store. Password last changed 20 months ago', note: 'One credential controls the whole chain, and it is old. Its theft would be catastrophic.' },
              { id: 'z7', type: 'clue', clue: 'mixed', text: 'Store 41 (first affected): card payment devices, staff laptops and guest Wi-Fi on one network. Stores with the same layout: 38', note: 'Payment data is exposed on a network where infections spread freely, in 38 stores.' },
              { id: 'z8', type: 'herring', text: 'Proposal: "A single network across all stores would reduce management costs by about 20%"', note: 'The saving is real. It describes the cost, not the risk.' },
              { id: 'z9', type: 'herring', text: 'The finance director has asked for a decision by Friday', note: 'Time pressure, not evidence.' },
              { id: 'z10', type: 'plain', text: 'Store networks today: 120 separate ones, connected to head office by private links', note: 'The current design, which at least contains each store.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the finance director\'s flat network',
        intro: 'The finance director says: "The clean-up cost £48,000, and one network would save 20% a year. If we are going to spend money on security, let us at least make the network simple. Merge the stores into one."',
        prompt: 'What do you do?',
        options: [
          { id: 'segment', quality: 3, text: 'Show that the cost came from the spread between stores, which a flat network would make worse; propose a standard store design with separate zones and rules between stores that still gets most of the management saving through central, template-based management', set: { segment: true }, consequence: 'The finance director sees that the saving comes from central management, not a flat network. The standard design is approved, and the next infection in a store stays in that store.' },
          { id: 'partial', quality: 2, text: 'Agree to a flat network inside regions of about ten stores, with rules between regions', set: { partial: true }, consequence: 'It halves the cost of management and limits spread to ten stores. The next infection reaches nine others before it is stopped.' },
          { id: 'refuse', quality: 1, text: 'Refuse to discuss changing the network until the security work is complete', set: { refuse: true }, consequence: 'The finance director goes to the IT director, and a flat network is approved for the stores that are not yet segmented.' },
          { id: 'agree', quality: 0, text: 'Agree, because it saves money and you can add protections later', set: { agree: true }, consequence: 'Eight months later a till infection reaches 60 stores in an afternoon, and head office is affected.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft update for the board',
        intro: 'A colleague has drafted the update.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The malware spread to three other stores because nothing stopped traffic between stores.', why: 'Supported by the clean-up report.' },
          { id: 'j2', sound: false, text: 'The compromised store\'s manager was responsible for the infection.', why: 'Unsupported. The manager reported the problem.' },
          { id: 'j3', sound: false, text: 'A flat network will make the chain safer because it is simpler.', why: 'Simplicity does not limit spread. A flat network lets one infection reach every store.' },
          { id: 'j4', sound: true, text: 'A shared support account can sign in to all 120 store routers from the internet.', why: 'Supported by the account record.' },
          { id: 'j5', sound: false, text: 'The finance director is wrong to want to save money.', why: 'A judgement about a colleague. The saving is legitimate and can be pursued safely.' },
          { id: 'j6', sound: true, text: 'Central, template-based management can capture much of the saving while keeping stores separate.', why: 'A workable alternative.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the board',
        intro: 'Your own summary. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'q1', correct: true, text: 'The malware tried to reach 14 other stores and succeeded in three, because nothing restricted traffic between stores.', why: 'Shown by the clean-up report.' },
          { id: 'q2', correct: true, text: 'A shared support account with a 20-month-old password can sign in to every store router from the internet.', why: 'Shown by the account record.' },
          { id: 'q3', correct: true, text: 'Card payment devices share a network with staff laptops in 38 stores.', why: 'Shown by the store designs.' },
          { id: 'q4', correct: true, text: 'We do not know whether the shared support account has been used by anyone else, and we are reviewing its logs.', why: 'An honest statement of the limit.' },
          { id: 'q5', correct: false, text: 'Card data has been stolen.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'A flat network cannot be made safe.', why: 'Overstated. The point is that it removes containment.' },
          { id: 'q7', correct: false, text: 'The store teams were careless.', why: 'A judgement about people.' },
          { id: 'q8', when: 'segment', correct: true, text: 'A standard segmented store design was approved, which keeps most of the management saving and keeps the next infection inside one store.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'partial', correct: true, text: 'Regional flat networks of about ten stores were agreed, which limits spread to ten stores.', why: 'An honest account of the compromise.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'Changes were refused until security work was done, and a flat network was approved elsewhere for unsegmented stores.', why: 'An honest account of the cost of refusing.' },
          { id: 'q11', when: 'agree', correct: true, text: 'A flat network was approved for the saving, and a later infection reached 60 stores and head office.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Replace the shared support account with individual accounts, hardware keys and access through a controlled gateway.', why: 'Closes the single route that controls every store.' },
          { id: 'a2', correct: true, text: 'Separate payment devices from staff and guest networks in the 38 stores that mix them.', why: 'Protects payment data.' },
          { id: 'a3', correct: true, text: 'Roll out a standard store design with separate zones and rules between stores, managed from templates.', why: 'Limits spread and keeps costs low.' },
          { id: 'a4', correct: false, text: 'Merge all stores into one network.', why: 'Removes containment.' },
          { id: 'a5', correct: false, text: 'Do nothing until the next infection.', why: 'The exposure is clear now.' },
        ],
      },
    ],
  },
];
