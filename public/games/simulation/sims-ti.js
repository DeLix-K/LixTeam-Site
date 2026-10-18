// Threat Intelligence simulations. Everything here is fictional: the groups, campaigns, reports and
// addresses are invented, and addresses come from the reserved documentation ranges.
//
// These are decision-based: how far to trust a source, what an indicator is worth, and how to tell a
// decision-maker what you know, what you assess and how sure you are. They contain no technique.
//
// The path's themes: a source is judged before a claim is acted on, saying how sure you are is part of the
// answer, and a name for the culprit is the last thing the evidence can usually give you.

const RATINGS = [
  { name: 'Headline chaser', blurb: 'The loudest claim won, or certainty was invented. Read each stage note: good intelligence is calibrated, not confident.' },
  { name: 'Junior analyst', blurb: 'You weighed sources sensibly, with gaps in evidence, balance or how you handled pressure to be certain.' },
  { name: 'Intelligence analyst', blurb: 'Sources weighed, judgements labelled with how sure you are, and decision-makers told what they need.' },
  { name: 'Trusted adviser', blurb: 'Judgements that stood up afterwards, uncertainty stated plainly, and the courage to say "we do not know yet".' },
];

export const TI = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'sorting-reports',
    title: 'Which report to trust',
    skill: 'hardening',
    minutes: 20,
    blurb: 'Four reports describe the same new campaign against Contoso\'s sector. Decide how far to trust each source, find what they really support and decide what to do about a vendor press release.',
    brief: [
      'Over one weekend, four reports about a fictional campaign called "Marigold" reach the security team: a bulletin from a sector information-sharing group, a security vendor\'s press release, an anonymous social media post and your own security operations team\'s notes from a similar email.',
      'You are the threat intelligence analyst. You will rank the sources, read what each one actually says, spend a limited budget of analyst-hours, decide how to answer a call to take drastic action, and check your assessment before it goes to the head of security.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the sources by how far to trust them',
        intro: 'Tap the sources in order, the most reliable first. Think about who is reporting, whether they saw it first-hand, whether they show their evidence and what they gain.',
        items: [
          { id: 's1', source: 'Own SOC', priority: 1, text: 'Notes from Contoso\'s own security operations team, who received a similar email and examined it directly.', why: 'First-hand, from people you know, about your own environment. Small in scale, but the most direct evidence you have.' },
          { id: 's2', source: 'Sector group', priority: 2, text: 'A bulletin from a sector sharing group, written by analysts at three member companies, listing the email sender domains and file names they have seen.', why: 'Specific, based on several members\' observations, from a group with a track record. Not first-hand for you.' },
          { id: 's3', source: 'Vendor', priority: 3, text: 'A press release from a security vendor describing "a sophisticated state-backed campaign" against the sector.', why: 'The vendor has some data, but the release is promotional, gives no evidence and has a reason to sound alarming.' },
          { id: 's4', source: 'Anonymous post', priority: 4, text: 'An anonymous social media post claiming "an unpatched flaw in a popular document reader is being used and nobody has been told".', why: 'No source, no evidence and an attention-seeking claim. It should be noted and checked, not acted on.' },
          { id: 's5', source: 'Forum chatter', priority: 5, text: 'A forum thread of people speculating about who is behind it.', why: 'Speculation with no evidence, and the least useful source here.' },
        ],
      },
      {
        id: 'reports', type: 'evidence', title: 'Read what each report actually says',
        intro: 'You have the four reports. Look for what they genuinely support, and where they overreach. Flag only what the reports support.',
        clues: {
          specific: { strength: 'strong', text: 'The sector bulletin lists 6 sender domains, 3 file names and a date range, from three separate member companies.' },
          ours: { strength: 'strong', text: 'Contoso\'s own SOC received one matching email on Friday, from one of the listed domains, with a listed file name.' },
          noevidence: { strength: 'strong', text: 'The vendor\'s press release gives no domains, files or technical details, and says "state-backed" without explaining why.' },
          unverified: { strength: 'strong', text: 'The anonymous post names a flaw and a product, but gives no sample, no indicator and no other evidence.' },
          scale: { strength: 'weak', text: 'The bulletin says about 30 organisations have been targeted.' },
        },
        artefacts: [
          {
            id: 'inside', title: 'Sector bulletin and Contoso\'s own notes',
            lines: [
              { id: 'k1', type: 'clue', clue: 'specific', text: 'Sector bulletin: "Observed by three members between 4 and 11 October: emails from invoices-ontime.example, payroll-docs.example and four similar domains, with attachments named Remittance_Advice.docm and Pay_Review.docm. Targets: finance teams. Impact: unknown."', note: 'Specific, checkable and from several independent members. A solid basis for action. It says impact is unknown.' },
              { id: 'k2', type: 'clue', clue: 'ours', text: 'Contoso SOC note, Friday: one email to a finance mailbox from payroll-docs.example with attachment Pay_Review.docm. Not opened; quarantined', note: 'First-hand evidence that the same campaign has reached you. It shows exposure, not harm.' },
              { id: 'k3', type: 'clue', clue: 'scale', text: 'Bulletin: "At least 30 organisations are believed to have been targeted"', note: 'An estimate with no stated basis. Treat it as context.' },
              { id: 'k4', type: 'herring', text: 'The bulletin was posted at 02:00 on a Saturday', note: 'Timing has no bearing on reliability.' },
              { id: 'k5', type: 'plain', text: 'The sector group has 140 members and a code of conduct for sharing', note: 'Context for how reliable it is.' },
            ],
          },
          {
            id: 'outside', title: 'The vendor release, the anonymous post and the forum thread',
            lines: [
              { id: 'k6', type: 'clue', clue: 'noevidence', text: 'Vendor press release: "Our researchers have uncovered a sophisticated, state-backed campaign (codenamed Marigold) threatening the financial sector. Contact us for a briefing."', note: 'It does not say what was seen or why it is state-backed. It ends with a sales call.' },
              { id: 'k7', type: 'clue', clue: 'unverified', text: 'Anonymous post: "Marigold uses an unpatched hole in the doc reader everyone has. Vendor knows and is hiding it. Nobody is safe."', note: 'An unverifiable claim with an alarming message. It may be wrong, and it gives you nothing to check.' },
              { id: 'k8', type: 'herring', text: 'The vendor release has been shared 2,300 times', note: 'Popularity is not reliability.' },
              { id: 'k9', type: 'herring', text: 'The forum thread suggests a named country is responsible', note: 'Speculation without evidence.' },
              { id: 'k10', type: 'plain', text: 'The vendor is a well-known company with a large threat research team', note: 'Reputation is context. The release itself shows no evidence.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'analyst-hours', budget: 10, title: 'Spend your ten analyst-hours',
        intro: 'Spend all ten across these four pieces of work this morning.',
        items: [
          { id: 'e1', source: 'Check ours', ideal: 4, text: 'Search Contoso\'s email, web and endpoint records for the bulletin\'s domains and file names over the last month.', why: 'The most useful thing you can do: find out whether you have been hit.' },
          { id: 'e2', source: 'Protect', ideal: 2, text: 'Block the listed sender domains and file names, with an expiry date and a note of the source.', why: 'A quick, proportionate protective step.' },
          { id: 'e3', source: 'Verify', ideal: 2, text: 'Ask the sector group for more detail, and check the claim about the document reader against the vendor\'s own advisories.', why: 'Tests the claims that matter.' },
          { id: 'e4', source: 'Tell', ideal: 2, text: 'Write a short note for the head of security: what is known, what is assessed and how sure you are.', why: 'Keeps leaders informed with the right words.' },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the call to take drastic action',
        intro: 'The head of IT has read the vendor\'s press release and says: "If this is state-backed we cannot take any chances. Block all email attachments company-wide and turn off the document reader on every machine until it is over."',
        prompt: 'What do you recommend?',
        options: [
          { id: 'measured', quality: 3, text: 'Recommend a proportionate response based on the sector bulletin and your own observation: block the listed domains and file names, warn finance, check your logs, and keep the wider measures ready if you find evidence of the document-reader claim or of spread', set: { measured: true }, consequence: 'Finance is protected within the hour. Your check finds no other recipients, and the vendor later confirms the anonymous claim was false. The company keeps working.' },
          { id: 'half', quality: 2, text: 'Block attachments for finance teams only, and keep an eye on the reader', set: { half: true }, consequence: 'Finance is protected. Two teams complain about the disruption, and you have restricted more than the evidence supported.' },
          { id: 'refuse', quality: 1, text: 'Say that nothing should change until there is more evidence', set: { refuse: true }, consequence: 'Finance remains open to the email for another day, and the head of IT feels dismissed.' },
          { id: 'all', quality: 0, text: 'Agree: block all attachments and disable the reader everywhere', set: { all: true }, consequence: 'Sales, legal and the support team cannot open documents for two days. The anonymous claim is later shown to be false.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft assessment for the head of security',
        intro: 'A colleague has drafted the assessment.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'A sector bulletin from three member companies lists six sender domains and three file names used against finance teams, and we received one matching email on Friday.', why: 'Supported by the bulletin and our own note.' },
          { id: 'p2', sound: false, text: 'The campaign is state-backed.', why: 'Unsupported. Only the vendor says so, with no evidence.' },
          { id: 'p3', sound: false, text: 'An unpatched flaw in the document reader is being used.', why: 'Unsupported. It comes from an anonymous post that gives nothing to check.' },
          { id: 'p4', sound: true, text: 'The email we received was quarantined and not opened, so we have no evidence of harm at Contoso.', why: 'Supported by the SOC note.' },
          { id: 'p5', sound: false, text: 'Thirty organisations have been breached.', why: 'Overstated. The bulletin says "targeted", not breached.' },
          { id: 'p6', sound: true, text: 'We have blocked the listed domains and file names, with an expiry date.', why: 'Supported, if done.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your assessment for the head of security',
        intro: 'Your own assessment. Include what the evidence supports and be honest about how sure you are.',
        statements: [
          { id: 'r1', correct: true, text: 'A campaign against finance teams is under way in our sector, seen by three sector members between 4 and 11 October, and one matching email reached Contoso on Friday.', why: 'Shown by the bulletin and our note.' },
          { id: 'r2', correct: true, text: 'We have high confidence that this campaign has reached us, based on a matching sender and file name in our own records.', why: 'Stated with a confidence level, and supported.' },
          { id: 'r3', correct: true, text: 'The vendor\'s claim that it is state-backed, and the anonymous claim about the document reader, are unverified and we are not acting on them.', why: 'Honest about what is not supported.' },
          { id: 'r4', correct: true, text: 'We do not yet know the impact on other organisations or who is behind the campaign.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'A foreign government is attacking our sector.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The document reader is unsafe and must be switched off.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The vendor is lying.', why: 'Unsupported. The release is simply not evidence.' },
          { id: 'r8', when: 'measured', correct: true, text: 'We blocked the listed indicators, warned finance and checked our logs, keeping wider measures ready if the evidence supported them.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'half', correct: true, text: 'We blocked attachments for finance only, which protected them and disrupted two other teams.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We made no changes while waiting for more evidence, leaving finance exposed for another day.', why: 'An honest account.' },
          { id: 'r11', when: 'all', correct: true, text: 'All attachments were blocked and the reader disabled for two days, on the basis of an unverified claim that was later shown to be false.', why: 'An honest record of an overreaction.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Block the listed domains and file names with an expiry date, and warn the finance team.', why: 'Proportionate protection.' },
          { id: 'a2', correct: true, text: 'Search our records for the same indicators and report what we find to the sector group.', why: 'Finds out whether we are hit and helps others.' },
          { id: 'a3', correct: true, text: 'Check the document reader claim with the vendor\'s own advisories before changing anything.', why: 'Tests the one drastic claim.' },
          { id: 'a4', correct: false, text: 'Block all attachments company-wide.', why: 'Out of proportion to the evidence.' },
          { id: 'a5', correct: false, text: 'Tell the board a foreign government is attacking us.', why: 'Unsupported.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'rival-breach-brief',
    title: 'One page for the board',
    skill: 'hardening',
    minutes: 20,
    blurb: 'A competitor has been breached and the board wants to know who did it and whether Contoso is next. Decide what to say, what to leave out, and how to be honest about how sure you are.',
    brief: [
      'A rival company, Northwind, has announced a breach. The board has asked for a one-page note by tomorrow: who was behind it, how it happened, and whether Contoso is at risk. The chief executive has said: "I want a name."',
      'You are the threat intelligence analyst. You will rank what the brief should contain, separate what is known from what is assessed, spend a limited budget of hours, decide what to do about the request for a name, and review the draft before it goes to the board.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what the brief should contain',
        intro: 'Tap the contents in order, the most useful for the board first. Think about the decisions the board has to make.',
        items: [
          { id: 'b1', source: 'Bottom line', priority: 1, text: 'An opening line that answers the question: how likely is it that Contoso is targeted in the same way, and what you recommend.', why: 'Boards read the first lines. They need the answer, not the background.' },
          { id: 'b2', source: 'Confidence', priority: 2, text: 'How sure you are of each judgement, and what would change your mind.', why: 'Lets the board decide how much weight to give it.' },
          { id: 'b3', source: 'Evidence', priority: 3, text: 'A short list of what is known from reliable sources, kept separate from your assessment.', why: 'Shows what the judgement rests on.' },
          { id: 'b4', source: 'Actions', priority: 4, text: 'Two or three things Contoso is doing or should do, with owners.', why: 'The board must decide on resources. Useful, and follows the judgement.' },
          { id: 'b5', source: 'Attacker profile', priority: 5, text: 'A detailed biography of the group the press says is responsible.', why: 'Interesting and unlikely to help the board decide anything.' },
        ],
      },
      {
        id: 'sources', type: 'evidence', title: 'Separate what is known from what is assessed',
        intro: 'You have Northwind\'s statement, press reports and a partner bulletin. Look for what is known, and what is merely claimed. Flag only what the sources support.',
        clues: {
          known: { strength: 'strong', text: 'Northwind\'s own statement says attackers used stolen staff logins to reach a file server and copied customer files.' },
          press: { strength: 'strong', text: 'Press reports attribute the breach to a named group, citing "people familiar with the matter", with no evidence shown.' },
          partner: { strength: 'strong', text: 'A partner bulletin describes the same way in (stolen logins, no second factor) used against four companies in the sector this quarter.' },
          nogroup: { strength: 'strong', text: 'Neither Northwind nor the partner bulletin names a group or gives evidence that links the activity to one.' },
          timing: { strength: 'weak', text: 'Northwind announced the breach on a Monday morning.' },
        },
        artefacts: [
          {
            id: 'statement', title: 'Northwind\'s statement and the partner bulletin',
            lines: [
              { id: 'm1', type: 'clue', clue: 'known', text: 'Northwind statement: "An unauthorised party used credentials belonging to staff to access a file server and copied customer files. We have no evidence that other systems were affected."', note: 'A first-hand statement from the victim. It is the best evidence of what happened, and it names no group.' },
              { id: 'm2', type: 'clue', clue: 'partner', text: 'Partner bulletin: "Four members report intrusions this quarter beginning with valid staff logins, no second factor on the account, and access to file servers. Attribution: not established."', note: 'A reliable source showing a pattern across companies, and says attribution is not established.' },
              { id: 'm3', type: 'clue', clue: 'nogroup', text: 'Neither document mentions any named group, tool, or infrastructure linking the cases', note: 'The honest position is that the technique is shared, and the actor is unknown.' },
              { id: 'm4', type: 'herring', text: 'The partner bulletin is marked "TLP:AMBER, share within your organisation only"', note: 'Handling instructions. Respect them in the brief, and they do not change the content.' },
              { id: 'm5', type: 'plain', text: 'Northwind has 900 staff and sells to retail customers', note: 'Context.' },
            ],
          },
          {
            id: 'press', title: 'Press reports',
            lines: [
              { id: 'm6', type: 'clue', clue: 'press', text: 'Newspaper report: "Sources say the attack was carried out by the \'Marigold\' group, known for targeting retailers. The group has not commented."', note: 'Anonymous sources, no evidence, and the group "has not commented". Treat this as a rumour.' },
              { id: 'm7', type: 'clue', clue: 'timing', text: 'Northwind announcement: Monday 08:30', note: 'Timing says nothing about who was responsible.' },
              { id: 'm8', type: 'herring', text: 'A commentator on a news channel says the group is "probably state-run"', note: 'Opinion with no evidence.' },
              { id: 'm9', type: 'herring', text: 'The same newspaper has reported on the group before', note: 'A track record of reporting on the group is not a track record of being right about this.' },
              { id: 'm10', type: 'plain', text: 'The chief executive has asked for "a name"', note: 'The request. It does not change what the evidence can say.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the deadline',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'c1', source: 'Our exposure', ideal: 4, text: 'Check whether Contoso has the same weaknesses: staff accounts without a second factor, reachable file servers, and recent sign-ins from unusual places.', why: 'The question the board really cares about, and it needs real checking.' },
          { id: 'c2', source: 'Sources', ideal: 2, text: 'Ask the sector group and two peers what they know about the actor, and what they do not.', why: 'Tests the press claim cheaply.' },
          { id: 'c3', source: 'Writing', ideal: 3, text: 'Write the one page: bottom line first, confidence stated, evidence separate, three actions.', why: 'The deliverable, and it takes care to make short.' },
          { id: 'c4', source: 'Rehearse', ideal: 1, text: 'Prepare answers to the questions the board is likely to ask.', why: 'Helps in the room, and it is quick.' },
        ],
      },
      {
        id: 'name', type: 'decision', title: 'Decide: the chief executive wants a name',
        intro: 'The chief executive says: "The board will not accept \'we do not know\'. The press says Marigold. Put Marigold in the brief as the attacker, so we can say we know who we are facing."',
        prompt: 'What do you do?',
        options: [
          { id: 'calibrated', quality: 3, text: 'Give a clear bottom line without naming a group: the technique is common across the sector, Contoso is exposed in two specific ways you have found, and here are the two fixes; state that the actor is unknown, that the press attribution is unverified, and what evidence would let you name one', set: { calibrated: true }, consequence: 'The board has a decision it can make, and understands why the name is absent. When the real actor is later identified as another group, the brief is still right.' },
          { id: 'hedge', quality: 2, text: 'Mention the press attribution as "reported but unconfirmed" and focus on the exposure', set: { hedge: true }, consequence: 'The board remembers the name and forgets the caveat. They ask in later meetings about Marigold.' },
          { id: 'refuse', quality: 1, text: 'Refuse to give any assessment until more is known', set: { refuse: true }, consequence: 'The chief executive writes a note himself, and the board sees only the headline.' },
          { id: 'name', quality: 0, text: 'Put "Marigold" in as the attacker, as asked', set: { name: true }, consequence: 'Two weeks later the real intruders are found to be an unrelated group, and the board asks why they were told otherwise.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft brief',
        intro: 'A colleague has drafted the brief.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Northwind says attackers used stolen staff logins to reach a file server and copy customer files.', why: 'Supported by Northwind\'s statement.' },
          { id: 'j2', sound: false, text: 'The attack was carried out by Marigold.', why: 'Unsupported. Only anonymous press sources say so.' },
          { id: 'j3', sound: false, text: 'We are almost certain to be attacked in the same way.', why: 'Overstated. Four companies have been hit this quarter, and Contoso is exposed in two ways, but "almost certain" is not supported.' },
          { id: 'j4', sound: true, text: 'The partner bulletin reports the same starting method at four companies this quarter and says attribution is not established.', why: 'Supported by the bulletin.' },
          { id: 'j5', sound: false, text: 'A foreign government is behind the breach.', why: 'Unsupported.' },
          { id: 'j6', sound: true, text: 'We have moderate confidence that Contoso is likely to be targeted using stolen staff logins, because the method is common and we found two matching weaknesses.', why: 'A calibrated judgement with a stated confidence level.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your note for the board',
        intro: 'Your own note. Include what the evidence supports and say how sure you are.',
        statements: [
          { id: 'q1', correct: true, text: 'Northwind has said attackers used stolen staff logins to copy customer files, and four companies in the sector have reported a similar way in this quarter.', why: 'Shown by the statement and bulletin.' },
          { id: 'q2', correct: true, text: 'We assess with moderate confidence that Contoso is likely to be targeted in the same way, because we have found two matching weaknesses.', why: 'A judgement with a confidence level, based on checking.' },
          { id: 'q3', correct: true, text: 'We do not know who is responsible, and the press attribution to a named group is unverified.', why: 'An honest statement of the limit.' },
          { id: 'q4', correct: true, text: 'We recommend requiring a second factor on all staff accounts and reviewing access to file servers, both of which we can start now.', why: 'A concrete recommendation.' },
          { id: 'q5', correct: false, text: 'Marigold is responsible.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'We are certain to be attacked.', why: 'Overstated.' },
          { id: 'q7', correct: false, text: 'Northwind was careless.', why: 'A judgement about a rival with no basis.' },
          { id: 'q8', when: 'calibrated', correct: true, text: 'The brief gave a clear bottom line, named no group, stated what was unknown, and said what evidence would let us name one.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'hedge', correct: true, text: 'The press attribution was mentioned as unconfirmed, and the board remembered the name more than the caveat.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'No assessment was given, and the chief executive wrote his own note.', why: 'An honest account.' },
          { id: 'q11', when: 'name', correct: true, text: 'A group was named on the basis of anonymous press reports, and it was later shown to be wrong.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Require a second factor on all staff accounts, starting with those that can reach file servers.', why: 'Addresses the shared weakness.' },
          { id: 'a2', correct: true, text: 'Review who can reach the file servers and from where, and alert on sign-ins from unusual places.', why: 'Narrows what a stolen login could do.' },
          { id: 'a3', correct: true, text: 'Keep sharing with the sector group, and update the board if the actor is identified.', why: 'Keeps the picture current.' },
          { id: 'a4', correct: false, text: 'Tell the board the attacker is Marigold so that they can plan.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Say nothing about Northwind until it is certain.', why: 'The board asked and needs an answer.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ioc-triage',
    title: 'Four thousand indicators',
    skill: 'hardening',
    minutes: 20,
    blurb: 'A threat feed delivers four thousand indicators a day and the team cannot read them all. Decide what to block, what to watch and what to ignore, and what to do about a request to block everything.',
    brief: [
      'Contoso subscribes to a commercial threat feed that delivers about 4,000 indicators a day: addresses, domains and file fingerprints. The firewall can block at most 10,000 entries, and last month a blocked address broke a payroll service. The security manager wants to "just block all of them".',
      'You are the threat intelligence analyst. You will rank which indicators deserve most attention, check the feed data, spend a limited budget of analyst-hours, decide how to answer the request, and review the plan.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank which indicators deserve attention first',
        intro: 'Tap the groups in order, the most valuable to act on first. Think about relevance to Contoso, how recent and specific they are, and how costly a mistake would be.',
        items: [
          { id: 'i1', source: 'Seen here', priority: 1, text: 'Indicators that match something Contoso has seen in its own records in the last 30 days.', why: 'Confirmed relevance. These need investigating at once.' },
          { id: 'i2', source: 'Sector campaign', priority: 2, text: 'Indicators from a recent campaign targeting Contoso\'s sector, shared by a trusted partner with context.', why: 'Relevant, recent and with context. Worth blocking and hunting.' },
          { id: 'i3', source: 'Fresh and specific', priority: 3, text: 'Newly reported indicators with a clear description and a short life expectancy (days).', why: 'Useful for a short time and cheap to block, with an expiry.' },
          { id: 'i4', source: 'Old', priority: 4, text: 'Indicators first reported more than a year ago and never seen since.', why: 'Likely stale. Blocking them adds clutter and risk without much benefit.' },
          { id: 'i5', source: 'Shared hosting', priority: 5, text: 'Addresses that belong to big shared hosting or cloud services used by thousands of legitimate sites.', why: 'Blocking them hurts legitimate traffic. They need context before any action.' },
        ],
      },
      {
        id: 'feed', type: 'evidence', title: 'Check the feed data',
        intro: 'You have a sample of the feed with its dates and sources. Look for what should shape your approach. Flag only what the data supports.',
        clues: {
          old: { strength: 'strong', text: 'Of 1,000 sampled indicators, 640 were first reported over a year ago, and only 12 of those have been seen anywhere in the last 90 days.' },
          shared: { strength: 'strong', text: 'About 18% of the addresses in the sample belong to large shared hosting or cloud providers, including the one that served the payroll service.' },
          nocontext: { strength: 'strong', text: 'Only 9% of indicators in the sample have any description of what they were used for.' },
          hit: { strength: 'strong', text: 'Eleven indicators in the sample match activity in Contoso\'s own logs in the last month.' },
          volume: { strength: 'weak', text: 'The feed delivers about 4,000 indicators a day.' },
        },
        artefacts: [
          {
            id: 'sample', title: 'A sample of 1,000 indicators',
            lines: [
              { id: 'f1', type: 'clue', clue: 'old', text: 'Age of sampled indicators: under 7 days 140; 7 to 90 days 120; 91 days to a year 100; over a year 640. Over-a-year indicators seen again in the last 90 days: 12', note: 'Most of the feed is old and almost none of the old entries are still active. Blocking them is mostly noise.' },
              { id: 'f2', type: 'clue', clue: 'hit', text: 'Indicators matching Contoso\'s own records in the last 30 days: 11 (7 addresses, 3 domains, 1 file fingerprint)', note: 'Eleven of a thousand is a very small number, and exactly where to start.' },
              { id: 'f3', type: 'clue', clue: 'volume', text: 'Daily volume: about 4,000 new indicators', note: 'A big number, which is why a rule for sorting them is needed.' },
              { id: 'f4', type: 'herring', text: 'The feed vendor says it processes 2 billion events a day', note: 'A marketing figure.' },
              { id: 'f5', type: 'plain', text: 'Firewall limit: 10,000 block entries; currently 6,200 used', note: 'The room left to use.' },
            ],
          },
          {
            id: 'quality', title: 'Context and the payroll incident',
            lines: [
              { id: 'f6', type: 'clue', clue: 'shared', text: 'Hosting analysis: 183 of 1,000 addresses belong to 9 large providers. Payroll incident: blocked address 203.0.113.140, belonging to a cloud provider; hosts payroll service and about 4,000 other sites', note: 'Shared addresses are dangerous to block. One mistake stopped payroll.' },
              { id: 'f7', type: 'clue', clue: 'nocontext', text: 'Indicators with a description of use (malware family, campaign, expected life): 91 of 1,000', note: 'Without context, you cannot tell how long an indicator should live or what it means.' },
              { id: 'f8', type: 'herring', text: 'The feed claims "99.9% accuracy"', note: 'A claim without a stated method.' },
              { id: 'f9', type: 'herring', text: 'The feed costs £55,000 a year', note: 'A cost, not a measure of value.' },
              { id: 'f10', type: 'plain', text: 'Staff available for feed work: 1.5 analysts', note: 'The capacity you have.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'analyst-hours', budget: 10, title: 'Spend your ten analyst-hours a week',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Hits', ideal: 4, text: 'Investigate every indicator that matches Contoso\'s own records.', why: 'The most valuable and most urgent work.' },
          { id: 'e2', source: 'Rules', ideal: 2, text: 'Write rules for what is blocked automatically, what is only watched, and what expires, with shared hosting excluded.', why: 'A reusable rule saves hours every day.' },
          { id: 'e3', source: 'Partners', ideal: 2, text: 'Read the partner and sector bulletins that give context, and act on them.', why: 'Context makes an indicator worth acting on.' },
          { id: 'e4', source: 'Review', ideal: 2, text: 'Review the blocklist and remove entries past their expiry.', why: 'Keeps the list useful and safe.' },
        ],
      },
      {
        id: 'block', type: 'decision', title: 'Decide: block everything',
        intro: 'The security manager says: "Blocking is cheap. Block every indicator the feed sends, and nobody can say we missed one. If it breaks something, we will unblock it."',
        prompt: 'What do you do?',
        options: [
          { id: 'tiered', quality: 3, text: 'Propose tiers: block automatically only specific, recent indicators with context (with an expiry of days or weeks), watch and alert on the rest, exclude shared hosting from automatic blocks, and review the list weekly; and show the payroll incident as the cost of blocking everything', set: { tiered: true }, consequence: 'Blocks fall from 4,000 a day to about 150 with a clear reason for each. Three real detections are made in the first month, and nothing legitimate is blocked.' },
          { id: 'most', quality: 2, text: 'Block everything under 90 days old and watch the rest', set: { most: true }, consequence: 'Fewer problems, though one more shared address is blocked and a supplier\'s portal breaks for two hours.' },
          { id: 'refuse', quality: 1, text: 'Refuse to block anything automatically', set: { refuse: true }, consequence: 'Nothing is blocked without a person reading it, and the team falls behind within a week.' },
          { id: 'all', quality: 0, text: 'Block everything, as asked', set: { all: true }, consequence: 'The firewall fills up in 3 days, two business services break, and when the list is cleared in a rush, real threats are removed with the false ones.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft plan',
        intro: 'A colleague has drafted the plan for the security manager.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'Of 1,000 sampled indicators, 640 are over a year old and only 12 of those have been seen since.', why: 'Supported by the sample.' },
          { id: 'j2', sound: false, text: 'Blocking everything in the feed makes the company safe.', why: 'Contradicted. It broke payroll and does little against old, inactive indicators.' },
          { id: 'j3', sound: false, text: 'Indicators on shared hosting are the most dangerous.', why: 'Unsupported. They are the most dangerous to block, not the most dangerous threats.' },
          { id: 'j4', sound: true, text: 'Eleven indicators in the sample match Contoso\'s own records and should be investigated first.', why: 'Supported.' },
          { id: 'j5', sound: false, text: 'The feed is poor quality and should be cancelled.', why: 'Unsupported. It is useful when sorted.' },
          { id: 'j6', sound: true, text: 'Automatic blocks should have an expiry, because most indicators stop being useful in days or weeks.', why: 'Well-founded.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your plan for the security manager',
        intro: 'Your own plan. Include what the evidence supports and be honest about what is not known.',
        statements: [
          { id: 'r1', correct: true, text: 'Of 1,000 sampled indicators, 640 are over a year old and only 12 of those have been seen in the last 90 days.', why: 'Shown by the sample.' },
          { id: 'r2', correct: true, text: 'Eleven indicators match Contoso\'s own records from the last month and are the first priority.', why: 'Shown by the sample.' },
          { id: 'r3', correct: true, text: 'About 18% of the addresses are on shared hosting, one of which stopped payroll when it was blocked.', why: 'Shown by the sample and the incident.' },
          { id: 'r4', correct: true, text: 'We do not yet know how many of the 11 matches are real threats rather than coincidence, and are investigating them.', why: 'An honest statement of the limit.' },
          { id: 'r5', correct: false, text: 'All the old indicators are harmless.', why: 'Overstated. A few were seen again.' },
          { id: 'r6', correct: false, text: 'The feed vendor is selling us rubbish.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Nothing in the feed needs blocking.', why: 'Unsupported.' },
          { id: 'r8', when: 'tiered', correct: true, text: 'Automatic blocks were limited to specific, recent indicators with expiry, shared hosting was excluded, and blocks fell from 4,000 a day to about 150.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'most', correct: true, text: 'Everything under 90 days old was blocked, and one shared address broke a supplier portal for two hours.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'No automatic blocking was allowed, and the team fell behind within a week.', why: 'An honest account.' },
          { id: 'r11', when: 'all', correct: true, text: 'Everything was blocked, the firewall filled in 3 days and two services broke.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Investigate the 11 indicators that match our own records first.', why: 'The most valuable work.' },
          { id: 'a2', correct: true, text: 'Block automatically only specific, recent indicators with an expiry, and exclude shared hosting.', why: 'Safe and effective.' },
          { id: 'a3', correct: true, text: 'Watch and alert on the rest, review the list weekly, and keep the payroll incident as a reminder of the cost of mistakes.', why: 'Keeps the list useful.' },
          { id: 'a4', correct: false, text: 'Block every indicator the feed sends.', why: 'It broke payroll once.' },
          { id: 'a5', correct: false, text: 'Cancel the feed.', why: 'It has value when sorted.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ti-exam',
    title: 'Promotion exam: Threat Intelligence Analyst',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A sector warning, a partial report and a chief executive who wants a name. Silver or better to pass.',
    brief: [
      'This is your promotion exam. A trusted partner has sent a partial warning: attackers are targeting companies in your sector with a new way of getting staff to approve sign-in requests. Contoso\'s chief executive has seen a news story and wants Contoso to announce publicly that it has been targeted by "a named foreign group".',
      'The case tests the role: ranking what to do, spending limited effort, working out what the evidence supports, standing firm on calibrated judgement under pressure, and reporting honestly. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank your first actions',
        intro: 'Tap the actions in order, the most urgent first. Think about the risk to Contoso now, the value of what you can confirm, and what could go wrong if you act on too little.',
        items: [
          { id: 'x1', source: 'Check', priority: 1, text: 'Search Contoso\'s sign-in records for the pattern described: repeated approval requests followed by an approval, and sign-ins from the listed addresses.', why: 'Finds out whether Contoso is already affected, which is the most important fact.' },
          { id: 'x2', source: 'Protect', priority: 2, text: 'Warn staff and tighten the approval step, for example by requiring a number match instead of a simple approve button.', why: 'A cheap step that blocks the method whoever is behind it.' },
          { id: 'x3', source: 'Source', priority: 3, text: 'Ask the partner what they saw, how many cases, and how sure they are.', why: 'Tests the quality of the warning.' },
          { id: 'x4', source: 'Brief', priority: 4, text: 'Brief the chief executive and the head of security on what is known and assessed.', why: 'Keeps leaders informed with the right words.' },
          { id: 'x5', source: 'Public statement', priority: 5, text: 'Prepare a public statement about being targeted.', why: 'Premature. Nothing yet shows Contoso has been affected.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'analyst-hours', budget: 10, title: 'Spend your ten analyst-hours',
        intro: 'Spend all ten across these four pieces of work today.',
        items: [
          { id: 'y1', source: 'Search', ideal: 4, text: 'Search sign-in, mail and helpdesk records for the described pattern and the listed addresses over the last 60 days.', why: 'The main investigation.' },
          { id: 'y2', source: 'Protect', ideal: 2, text: 'Change the approval prompt to a number match, warn staff and brief the helpdesk.', why: 'Quick and effective.' },
          { id: 'y3', source: 'Source', ideal: 1, text: 'Get the partner\'s detail and confidence.', why: 'A short conversation with high value.' },
          { id: 'y4', source: 'Write-up', ideal: 3, text: 'Write a calibrated assessment for leadership, with a recommendation about public statements.', why: 'Needs care.' },
        ],
      },
      {
        id: 'evidence', type: 'evidence', title: 'Work out what the evidence supports',
        intro: 'You have the partner\'s warning and the first results from your own records. Look for what it really supports. Flag only what the records support.',
        clues: {
          pattern: { strength: 'strong', text: 'Your records show one account, in finance, with 14 approval requests in 40 minutes on Tuesday, then one approval, then a sign-in from an address on the partner\'s list.' },
          partner: { strength: 'strong', text: 'The partner reports seven cases in the sector, with the same pattern, and says "actor unknown, assessment moderate confidence".' },
          noname: { strength: 'strong', text: 'Nothing in the partner\'s warning or in your records links the activity to a named group.' },
          scope: { strength: 'strong', text: 'The sign-in from the listed address did not complete: it was stopped at the next step, and no data access followed.' },
          news: { strength: 'weak', text: 'A news story says "a foreign group is attacking the sector".' },
        },
        artefacts: [
          {
            id: 'ours', title: 'Contoso\'s own sign-in records',
            lines: [
              { id: 'z1', type: 'clue', clue: 'pattern', text: 'Account j.fenn (finance): Tue 09:12 to 09:52, 14 approval requests; approval at 09:53; sign-in from 198.51.100.77 at 09:54', note: 'A repeated-prompt pattern followed by an approval and a sign-in from an address on the partner\'s list. Contoso has been targeted.' },
              { id: 'z2', type: 'clue', clue: 'scope', text: 'Sign-in 09:54: session started, then ended at 09:55 when the second check (device compliance) failed. No data access recorded', note: 'The attempt got through the approval and was stopped by another control. It shows exposure and a near miss, not a breach.' },
              { id: 'z3', type: 'herring', text: 'J. Fenn has worked at Contoso for 11 years', note: 'No bearing.' },
              { id: 'z4', type: 'herring', text: 'The account is in the finance team on the third floor', note: 'No bearing.' },
              { id: 'z5', type: 'plain', text: 'Helpdesk ticket on Tuesday 09:40: "annoying pop-ups on my phone"', note: 'Context: the user was being prompted and asked for help.' },
            ],
          },
          {
            id: 'partner', title: 'The partner\'s warning and the news',
            lines: [
              { id: 'z6', type: 'clue', clue: 'partner', text: 'Partner warning: "Seven cases across five organisations since 10 October. Repeated approval prompts, then an approval, then sign-in from the listed addresses. Actor unknown. Moderate confidence in the pattern; low confidence on anything else"', note: 'A good-quality warning with confidence stated, and a clear statement that the actor is unknown.' },
              { id: 'z7', type: 'clue', clue: 'noname', text: 'No group name, tool or infrastructure beyond the listed addresses appears in the warning or in Contoso\'s records', note: 'There is no basis for naming a group.' },
              { id: 'z8', type: 'clue', clue: 'news', text: 'News story: "A foreign group is behind attacks on the sector, say officials". No names, no evidence shown', note: 'Unattributed and without evidence. Treat it as a rumour.' },
              { id: 'z9', type: 'herring', text: 'The listed addresses are registered to a hosting company in a named country', note: 'Where an address is hosted says very little about who uses it.' },
              { id: 'z10', type: 'herring', text: 'The partner has shared three previous warnings that turned out to be accurate', note: 'A good track record, and it does not make an unstated claim reliable.' },
            ],
          },
        ],
      },
      {
        id: 'pressure', type: 'decision', title: 'Decide: the chief executive wants to announce a named group',
        intro: 'The chief executive says: "Our competitors are saying they have been targeted by a foreign group. If we say it first we look prepared. Put out a statement that we were targeted by the group in the news."',
        prompt: 'What do you do?',
        options: [
          { id: 'calibrated', quality: 3, text: 'Recommend no named group in any statement because the evidence does not support one; offer a short, true statement (we detected and stopped a sign-in attempt that matches a pattern reported across the sector, no data was accessed) if the chief executive wants to say something; and give the board a note with your confidence levels and what would let you name an actor', set: { calibrated: true }, consequence: 'The chief executive makes a short, accurate statement. When the actor is later reported by officials to be a different group, Contoso\'s statement stands.' },
          { id: 'hedge', quality: 2, text: 'Agree to a statement that mentions "reports of a foreign group" while saying Contoso cannot confirm who is responsible', set: { hedge: true }, consequence: 'The statement is accurate, and the news repeats the foreign-group phrase as if Contoso had confirmed it.' },
          { id: 'refuse', quality: 1, text: 'Advise against any statement at all', set: { refuse: true }, consequence: 'The chief executive makes one himself, without your wording, and it overstates.' },
          { id: 'name', quality: 0, text: 'Agree and write the statement naming the group', set: { name: true }, consequence: 'Officials later attribute the activity elsewhere, and Contoso has to retract a public statement.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft statement and assessment',
        intro: 'A colleague has drafted both.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'On Tuesday we detected an account receiving 14 approval prompts, an approval, and a sign-in attempt from a listed address, which was stopped before any data was accessed.', why: 'Supported by our records.' },
          { id: 'j2', sound: false, text: 'We were attacked by a named foreign group.', why: 'Unsupported. Nothing links the activity to a named group.' },
          { id: 'j3', sound: false, text: 'Our systems were breached.', why: 'Contradicted. The sign-in was stopped and no data was accessed.' },
          { id: 'j4', sound: true, text: 'A partner reports seven similar cases across five organisations, with moderate confidence in the pattern.', why: 'Supported by the warning.' },
          { id: 'j5', sound: false, text: 'The listed addresses prove that the attackers are in a particular country.', why: 'Unsupported. An address\'s hosting location is a weak clue.' },
          { id: 'j6', sound: true, text: 'We have changed the approval prompt to a number match and warned staff.', why: 'Supported, if done.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your assessment for the chief executive',
        intro: 'Your own assessment. Include what the evidence supports and how sure you are.',
        statements: [
          { id: 'q1', correct: true, text: 'Contoso was targeted on Tuesday using a pattern a partner has reported at five organisations, and the attempt was stopped.', why: 'Shown by our records and the warning.' },
          { id: 'q2', correct: true, text: 'We have high confidence that this was a real attempt against us and that no data was accessed.', why: 'Stated with a confidence level and supported.' },
          { id: 'q3', correct: true, text: 'We do not know who is responsible and have only low confidence about anything beyond the method.', why: 'An honest statement of the limit.' },
          { id: 'q4', correct: true, text: 'We recommend a short, factual public statement without a named group, and have tightened the approval step.', why: 'A clear recommendation.' },
          { id: 'q5', correct: false, text: 'A foreign group attacked us.', why: 'Unsupported.' },
          { id: 'q6', correct: false, text: 'We have been breached.', why: 'Contradicted.' },
          { id: 'q7', correct: false, text: 'Our competitors are lying about being targeted.', why: 'Unsupported.' },
          { id: 'q8', when: 'calibrated', correct: true, text: 'No group was named, a short factual statement was made, and it stood when officials later named a different actor.', why: 'An accurate record of a sound decision.' },
          { id: 'q9', when: 'hedge', correct: true, text: 'The statement mentioned reports of a foreign group, and the news repeated it as if confirmed.', why: 'An honest account.' },
          { id: 'q10', when: 'refuse', correct: true, text: 'We advised against a statement, and the chief executive issued one without our wording.', why: 'An honest account.' },
          { id: 'q11', when: 'name', correct: true, text: 'A group was named publicly and the statement had to be retracted.', why: 'An honest record of a failure.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Check the rest of Contoso\'s accounts for the same pattern, and share the listed addresses and our findings with the partner.', why: 'Finds other cases and helps the sector.' },
          { id: 'a2', correct: true, text: 'Move all staff to a number-match approval step and warn them about repeated prompts.', why: 'Blocks the method whoever is behind it.' },
          { id: 'a3', correct: true, text: 'Revisit the assessment if evidence emerges that links the activity to a named actor.', why: 'Keeps the judgement open.' },
          { id: 'a4', correct: false, text: 'Name the group from the news in the statement.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Do nothing until the actor has been identified.', why: 'The method can be blocked now.' },
        ],
      },
    ],
  },
];
