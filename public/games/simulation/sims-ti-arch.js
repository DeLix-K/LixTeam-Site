// Threat Intelligence lead-tier simulations. Everything here is fictional: the companies, countries, groups and people
// are invented. They are decision-based: how to give leaders a calibrated judgement about the future, how to handle
// disagreement inside a team and how to keep the judgement honest under pressure. They contain no attack technique.
//
// The tier's themes: an estimate says how likely and how sure, disagreement is information, and an intelligence lead is
// measured by whether leaders decided better, not by whether the forecast was lucky.

const RATINGS = [
  { name: 'Oracle', blurb: 'A forecast was stated as a certainty, or a dissent was lost, or the answer was shaped to the question. Read each stage note.' },
  { name: 'Lead in training', blurb: 'Mostly calibrated and useful, with gaps in how likely and how sure were said, how disagreement was handled or how the leader was served.' },
  { name: 'Intelligence lead', blurb: 'Estimates with probabilities and confidence, dissent recorded and leaders able to decide.' },
  { name: 'Trusted adviser', blurb: 'Leaders decided better because of your assessment, your team trusted you to record what they thought, and your calls held up.' },
];

export const TI_ARCH = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'strategic-assessment',
    title: 'Should we open an office there?',
    skill: 'hardening',
    minutes: 24,
    blurb: 'The board wants to know whether it is safe to open a regional office in a new country. The chief executive wants a yes or no. Decide how to say what you assess, how likely and how sure, and what to watch.',
    brief: [
      'Contoso is thinking of opening an office in the fictional country of Valdoria. The board has asked the intelligence team for "a threat assessment: is it safe?". The chief executive has said: "Give me a yes or a no."',
      'You are the intelligence lead. You will rank what a useful assessment contains, read what you have, spend a limited number of analyst-hours, decide how to answer the demand for a yes or no, and review the draft paper.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a useful strategic assessment contains',
        intro: 'Tap the items in order, the most important first. Think about what lets a board decide and revisit the decision.',
        items: [
          { id: 'a1', source: 'Judgements', priority: 1, text: 'A small number of clear judgements, each with how likely it is and how sure you are.', why: 'A board can weigh a likelihood and a confidence. It cannot weigh an unqualified claim.' },
          { id: 'a2', source: 'Indicators', priority: 2, text: 'The signs that would change the judgement, and who will watch for them.', why: 'Lets the board revisit the decision without waiting for the next paper.' },
          { id: 'a3', source: 'Assumptions', priority: 3, text: 'The assumptions the judgements rest on, stated openly.', why: 'Makes it possible to challenge and update.' },
          { id: 'a4', source: 'Options', priority: 4, text: 'What could be done to reduce each risk, and what it would cost.', why: 'Turns the assessment into a decision.' },
          { id: 'a5', source: 'Detail', priority: 5, text: 'A long background section on the country\'s history and politics.', why: 'Context, and what a board skips.' },
        ],
      },
      {
        id: 'sources', type: 'evidence', title: 'Read what you have',
        intro: 'You have a government travel advisory, a vendor report, notes from a staff member who grew up there and a news summary. Look for what the evidence supports and what it does not. Flag only what the sources support.',
        clues: {
          crime: { strength: 'strong', text: 'The government advisory rates street crime in the capital as moderate, in line with other cities where Contoso already operates.' },
          cyber: { strength: 'strong', text: 'The vendor report says organisations in Valdoria receive about 30% more phishing than the regional average, based on its own customers there.' },
          local: { strength: 'strong', text: 'The staff member says local rules require foreign companies to keep customer data in the country, which would affect how Contoso runs its systems.' },
          unknown: { strength: 'strong', text: 'No source covers the risk of state interference with a foreign company\'s staff or data in Valdoria, which is the question the chief executive cares about.' },
          mood: { strength: 'weak', text: 'A news summary says the national mood is "tense" ahead of an election in six months.' },
        },
        artefacts: [
          {
            id: 'official', title: 'The advisory and the vendor report',
            lines: [
              { id: 'b1', type: 'clue', clue: 'crime', text: 'Government travel advisory: "Valdoria: street crime in the capital is at a level similar to other large cities. Take usual precautions. No specific threats to business travellers."', note: 'A reasonable source on a limited point, and it says nothing about cyber or state interference.' },
              { id: 'b2', type: 'clue', clue: 'cyber', text: 'Vendor report: "Our customers in Valdoria (about 90 organisations) received 30% more phishing emails than our regional average this year."', note: 'Useful, and limited: it is the vendor\'s customers only, and the vendor sells protection against phishing.' },
              { id: 'b3', type: 'herring', text: 'The vendor report has an attractive map of "high-risk regions"', note: 'Presentation, not evidence.' },
              { id: 'b4', type: 'herring', text: 'The advisory was last updated three weeks ago', note: 'Recent, and not about the risks asked about.' },
              { id: 'b5', type: 'plain', text: 'Contoso would employ about 40 people in the new office', note: 'Scale.' },
            ],
          },
          {
            id: 'local', title: 'Local knowledge and the news',
            lines: [
              { id: 'b6', type: 'clue', clue: 'local', text: 'Notes from Elena, who grew up in Valdoria: "Foreign companies have to store customer data in-country, on servers in a registered data centre. The regulator can ask to inspect them."', note: 'First-hand and specific, though it needs checking with a lawyer. It affects the design, not just the risk.' },
              { id: 'b7', type: 'clue', clue: 'unknown', text: 'Research log: "Searches for state interference with foreign firms in Valdoria: no reliable reporting found. Three forum posts with no evidence."', note: 'A genuine gap on the question that matters most. The honest answer says it is not known.' },
              { id: 'b8', type: 'clue', clue: 'mood', text: 'News summary: "Observers describe the mood ahead of the election as tense."', note: 'Vague, and no basis for a probability.' },
              { id: 'b9', type: 'herring', text: 'A colleague says "I would not go there, it feels dodgy"', note: 'An impression, with no source.' },
              { id: 'b10', type: 'herring', text: 'The country is on a list of "emerging risk markets" published by a consultancy', note: 'A label, with no method shown.' },
              { id: 'b11', type: 'plain', text: 'Two competitors already have offices there', note: 'Context.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'analyst-hours', budget: 10, title: 'Spend ten analyst-hours before the board meets',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Judgements', ideal: 3, text: 'Write the key judgements, each with a likelihood and a confidence level, using the sources properly.', why: 'The core of the paper.' },
          { id: 'e2', source: 'Gaps', ideal: 3, text: 'Ask a local lawyer and two companies already operating there about data rules and state interference.', why: 'Fills the gap on the question that matters most.' },
          { id: 'e3', source: 'Indicators', ideal: 2, text: 'List the signs that would change the assessment and who will watch for them.', why: 'Lets the board revisit the decision.' },
          { id: 'e4', source: 'Options', ideal: 2, text: 'Set out options to reduce the main risks, with costs.', why: 'Turns the paper into a decision.' },
        ],
      },
      {
        id: 'yesno', type: 'decision', title: 'Decide: the demand for a yes or no',
        intro: 'The chief executive says: "I do not want a paper. I want a yes or no. Is it safe?" The board is split and wants a clear lead.',
        prompt: 'What do you do?',
        options: [
          { id: 'calibrated', quality: 3, text: 'Give the board a one-page assessment: the risk of ordinary crime is low and in line with Contoso\'s other offices (high confidence), phishing is somewhat higher (moderate confidence), state interference is unknown and cannot be assessed on current evidence; recommend a decision on whether Contoso can accept that gap, with the data-location rule and indicators to watch', set: { calibrated: true }, consequence: 'The chief executive is frustrated and then relieved that the unknown is stated. The board approves a staged opening, with data held in-country and a review after the election.' },
          { id: 'yes', quality: 2, text: 'Say "yes, with sensible precautions", as the evidence on crime and phishing supports', set: { yes: true }, consequence: 'It is a reasonable yes, and the unknown risk is left out. Six months later the question of interference comes up and nobody has thought about it.' },
          { id: 'nodata', quality: 1, text: 'Say that there is not enough evidence to give any view', set: { nodata: true }, consequence: 'It is true of one risk and not of the others. The board gets no help with the risks that can be assessed, and the chief executive decides without you.' },
          { id: 'safe', quality: 0, text: 'Say "yes, it is safe", to give the board the clear lead it asked for', set: { safe: true }, consequence: 'The board proceeds with confidence. Nine months later the regulator inspects the servers and Contoso discovers a rule nobody had checked.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft assessment',
        intro: 'A colleague has drafted the key judgements.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'We assess with high confidence that ordinary crime in the capital is at a level similar to Contoso\'s other offices.', why: 'Supported by the advisory, with a confidence level.' },
          { id: 'v2', sound: false, text: 'Valdoria is safe for a foreign company.', why: 'Unsupported: the largest risk is not assessed.' },
          { id: 'v3', sound: true, text: 'We cannot assess the risk of state interference on the evidence available, and say so.', why: 'The honest position on the key gap.' },
          { id: 'v4', sound: false, text: 'The election will be peaceful.', why: 'Unsupported: a tense mood is not a forecast.' },
          { id: 'v5', sound: false, text: 'Phishing is 30% higher in Valdoria than anywhere else.', why: 'The vendor figure compares only its own customers against its own regional average.' },
          { id: 'v6', sound: true, text: 'Local rules may require customer data to be stored in the country, and this needs checking with a local lawyer.', why: 'Supported by the staff member\'s account, with the check needed.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the one-page assessment for the board',
        intro: 'Say what you judge, how likely and how sure, and what you cannot say. Do not say it is safe.',
        statements: [
          { id: 'r1', correct: true, text: 'We assess with high confidence that ordinary crime risk is similar to Contoso\'s existing offices.', why: 'Shown by the advisory.' },
          { id: 'r2', correct: true, text: 'We assess with moderate confidence that phishing against firms there is somewhat higher than elsewhere in the region, based on one vendor\'s customer data.', why: 'Stated with its limit.' },
          { id: 'r3', correct: true, text: 'We cannot assess the risk of state interference with Contoso\'s staff or data, because no reliable reporting exists, and that is the board\'s main decision.', why: 'An honest statement of the gap.' },
          { id: 'r4', correct: true, text: 'Local rules may require customer data to be held in the country, which would shape the design of the office\'s systems.', why: 'Supported, with a check needed.' },
          { id: 'r5', correct: false, text: 'Valdoria is safe for Contoso.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The election will not affect business.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'There is no risk of state interference.', why: 'Unsupported.' },
          { id: 'r8', when: 'calibrated', correct: true, text: 'We gave likelihoods and confidence, said what is unknown and recommended a staged opening, which the board approved.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'yes', correct: true, text: 'We said yes with precautions and left out the unknown risk, which later came up unexamined.', why: 'An honest account.' },
          { id: 'r10', when: 'nodata', correct: true, text: 'We said there was not enough evidence for any view, which helped the board with nothing.', why: 'An honest account.' },
          { id: 'r11', when: 'safe', correct: true, text: 'We said it was safe and the board proceeded, and a rule nobody had checked was found later.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Ask a local lawyer to confirm the data-location rule before any decision on systems.', why: 'Checks the most concrete finding.' },
          { id: 'a2', correct: true, text: 'Approach two companies already operating there about state interference, and report what they say with its limits.', why: 'Fills the gap on the key question.' },
          { id: 'a3', correct: true, text: 'Agree the indicators that would change the assessment and review it after the election.', why: 'Lets the board revisit the decision.' },
          { id: 'a4', correct: false, text: 'Tell the board that Valdoria is safe.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Give the board a score out of ten for the country.', why: 'False precision.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ti-lead-exam',
    title: 'Promotion exam: Intelligence Lead',
    skill: 'hardening',
    minutes: 28,
    blurb: 'Your two best analysts disagree about a judgement the board is about to rely on. Decide how to handle the disagreement, what to tell the board and how to protect the team. Silver or better to pass.',
    brief: [
      'Your team has assessed that a group is planning attacks on Contoso\'s sector in the next quarter. Maya, a senior analyst, rates this "likely, high confidence". Ben, equally experienced, rates it "possible, low confidence" and says the evidence is thin. The chief executive has asked for one judgement for tomorrow\'s board meeting and says: "Pick one. I do not want a debate."',
      'You are the intelligence lead. You will rank what to settle, spend a limited number of hours, read the evidence behind both views, decide how to answer the demand for one judgement, and review the draft.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first at the top. Think about what decides how much weight the board can put on it.',
        items: [
          { id: 'x1', source: 'The evidence', priority: 1, text: 'What each view rests on, checked against the sources, before either is repeated to anyone.', why: 'Disagreement is resolved by looking at the evidence, not by seniority.' },
          { id: 'x2', source: 'Judgement', priority: 2, text: 'A single wording that states the judgement, the confidence and the point of disagreement.', why: 'What the board needs.' },
          { id: 'x3', source: 'Dissent', priority: 3, text: 'A record of the alternative view and the evidence that would settle it.', why: 'Protects the board and the analyst.' },
          { id: 'x4', source: 'Team', priority: 4, text: 'Keeping both analysts willing to speak up next time.', why: 'A team that stops disagreeing stops being right.' },
          { id: 'x5', source: 'Format', priority: 5, text: 'Presenting the judgement on one slide.', why: 'Matters least.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before the board meets',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Evidence', ideal: 4, text: 'Go through the sources with Maya and Ben together, separating what is known from what is inferred.', why: 'Settles most of the disagreement and shows what is left.' },
          { id: 'e2', source: 'Wording', ideal: 2, text: 'Draft the judgement with its confidence and the alternative view.', why: 'What the board needs.' },
          { id: 'e3', source: 'Test', ideal: 2, text: 'Ask a third analyst, who has not seen either view, to try to knock the judgement down.', why: 'A cheap, strong check.' },
          { id: 'e4', source: 'Brief', ideal: 2, text: 'Brief the chief executive on the wording and the reason for including the alternative.', why: 'No surprises.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the evidence behind both views',
        intro: 'You have the reports each analyst relied on. Look for what is solid and what is inferred. Flag only what the sources support.',
        clues: {
          intent: { strength: 'strong', text: 'Two reliable sources report that the group discussed targeting the sector, in forum posts from last month.' },
          capability: { strength: 'strong', text: 'No source shows that the group has the capability, or has built the infrastructure, to carry out such an attack.' },
          single: { strength: 'strong', text: 'The two "reliable sources" turn out to be the same original post, republished by a second site.' },
          history: { strength: 'strong', text: 'The group has talked about targets in forums eleven times in two years, and acted on one.' },
          seniority: { strength: 'weak', text: 'Maya has been in the team for nine years and Ben for six.' },
        },
        artefacts: [
          {
            id: 'maya', title: 'Maya\'s evidence',
            lines: [
              { id: 'f1', type: 'clue', clue: 'intent', text: 'Maya\'s note: "Two sources say the group is discussing the sector: a forum post on 4 October and a report on a security news site on 7 October. Intent confirmed."', note: 'Claims of intent, and her conclusion rests on both being independent.' },
              { id: 'f2', type: 'clue', clue: 'single', text: 'Ben\'s check: "The news site report quotes the forum post and adds nothing. It is one source seen twice."', note: 'The confidence rested on two sources that are one. A good catch, and it lowers the weight.' },
              { id: 'f3', type: 'herring', text: 'The forum post received 400 replies', note: 'Popularity is not reliability.' },
              { id: 'f4', type: 'herring', text: 'The news site is well known', note: 'It repeated the post. Its reputation does not add evidence.' },
              { id: 'f5', type: 'plain', text: 'Maya\'s previous forecasts have been right about 70% of the time', note: 'A good record, and no guarantee.' },
            ],
          },
          {
            id: 'ben', title: 'Ben\'s evidence and the history',
            lines: [
              { id: 'f6', type: 'clue', clue: 'capability', text: 'Ben\'s note: "No sign the group has built or bought the tools or hosting it would need. The post expresses wishes, not preparations."', note: 'The absence of capability evidence matters, though absence of evidence is not proof it is not there.' },
              { id: 'f7', type: 'clue', clue: 'history', text: 'Group history: "Mentioned targets in forums 11 times in 24 months. Acted on one."', note: 'A base rate. Talk is common; action is rare.' },
              { id: 'f8', type: 'clue', clue: 'seniority', text: 'Team roster: "Maya: lead analyst, 9 years. Ben: analyst, 6 years."', note: 'Seniority does not settle a disagreement about evidence.' },
              { id: 'f9', type: 'herring', text: 'Ben is known in the team as "the pessimist"', note: 'A label, not an argument.' },
              { id: 'f10', type: 'herring', text: 'A rival team inside the company has rated the same threat "high"', note: 'A rating without a method shown.' },
              { id: 'f11', type: 'plain', text: 'The board meets tomorrow at 10:00', note: 'The deadline.' },
            ],
          },
        ],
      },
      {
        id: 'pick', type: 'decision', title: 'Decide: the demand for one judgement',
        intro: 'The chief executive says: "Pick one. Either it is likely or it is not. I do not want to hear that my analysts disagree."',
        prompt: 'What do you do?',
        options: [
          { id: 'both', quality: 3, text: 'After going through the evidence with both analysts, give the board one judgement with its confidence ("we assess it is possible but not likely that the group acts in the next quarter; confidence low, because the group has stated intent but no capability has been seen and the intent comes from one source"), record the alternative view and what would change it, and tell both analysts what you wrote', set: { both: true }, consequence: 'The chief executive reads one clear judgement and asks what would change it. Both analysts feel heard. A month later a capability indicator does appear and the team revises the assessment in a day.' },
          { id: 'maya', quality: 2, text: 'Go with Maya\'s "likely, high confidence" because she is the senior analyst, and mention Ben\'s view in a footnote', set: { maya: true }, consequence: 'The board spends £200,000 on preparations. Nothing happens, and Ben stops raising concerns.' },
          { id: 'average', quality: 1, text: 'Average the two: "possible to likely, moderate confidence"', set: { average: true }, consequence: 'The wording satisfies both and informs nobody. The board does not know what to do with it.' },
          { id: 'ceo', quality: 0, text: 'Tell the board the team is confident the attack is likely, since the chief executive wants a clear answer', set: { ceo: true }, consequence: 'The confidence was not there. The board acts on a judgement the evidence does not support, and Ben learns that disagreement is not welcome.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft board paper',
        intro: 'A colleague has drafted the judgement.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'The group has expressed intent to target the sector, based on one forum post that has also been reported by a news site.', why: 'States the source accurately.' },
          { id: 'v2', sound: false, text: 'Two independent sources confirm the group is planning an attack.', why: 'They are one source seen twice.' },
          { id: 'v3', sound: true, text: 'No evidence shows that the group has the tools or infrastructure to carry out an attack, and we would change the judgement if some appeared.', why: 'States the gap and what would change the view.' },
          { id: 'v4', sound: false, text: 'The group has a history of acting on its stated targets.', why: 'It has acted on one in eleven.' },
          { id: 'v5', sound: false, text: 'The team unanimously agrees the attack is likely.', why: 'The team does not agree.' },
          { id: 'v6', sound: true, text: 'One senior analyst rates the risk higher; the evidence that would settle it is any sign of preparation.', why: 'Records the alternative view.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the judgement for the board',
        intro: 'Say what you judge, how sure you are, what the alternative is and what would change your mind.',
        statements: [
          { id: 'r1', correct: true, text: 'We assess it is possible but not likely that the group acts against the sector in the next quarter, with low confidence.', why: 'The calibrated judgement.' },
          { id: 'r2', correct: true, text: 'The intent comes from a single forum post that has been republished, and no evidence shows the group has the capability to act.', why: 'Shown by the evidence.' },
          { id: 'r3', correct: true, text: 'The group has discussed targets eleven times in two years and acted on one.', why: 'Shown by the history.' },
          { id: 'r4', correct: true, text: 'A senior analyst rates the risk as likely, and the evidence that would settle the difference is any sign of preparation.', why: 'Records the alternative view.' },
          { id: 'r5', correct: false, text: 'Two independent sources confirm an imminent attack.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The team is united that the attack is likely.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'There is nothing to worry about.', why: 'Unsupported.' },
          { id: 'r8', when: 'both', correct: true, text: 'We gave one calibrated judgement with the alternative view and the evidence that would settle it, and told both analysts what we wrote.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'maya', correct: true, text: 'We went with the senior analyst\'s view and footnoted the other, and the board spent money on a threat that did not come.', why: 'An honest account.' },
          { id: 'r10', when: 'average', correct: true, text: 'We averaged the two views, which satisfied both and informed nobody.', why: 'An honest account.' },
          { id: 'r11', when: 'ceo', correct: true, text: 'We stated confidence the evidence did not support to give the chief executive a clear answer.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Watch for any sign of preparation, such as new infrastructure or tooling, and revise the judgement at once if it appears.', why: 'Uses the indicators.' },
          { id: 'a2', correct: true, text: 'Ask a third analyst to challenge the judgement, as a standing habit for important calls.', why: 'A cheap check.' },
          { id: 'a3', correct: true, text: 'Record dissent in every assessment, with the evidence that would settle it.', why: 'Protects the board and the team.' },
          { id: 'a4', correct: false, text: 'Settle disagreements by seniority.', why: 'Evidence should settle them.' },
          { id: 'a5', correct: false, text: 'Present the judgement as unanimous.', why: 'Not true.' },
        ],
      },
    ],
  },
];
