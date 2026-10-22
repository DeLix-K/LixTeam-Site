// Threat Intelligence senior-tier Cyber Detective cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges. The case is about an attribution that did not hold up and
// the habits of reasoning behind it; it contains no technique.

const RATINGS = [
  { min: -999, name: 'Rookie', blurb: 'You missed too much. Go back through the evidence and compare it with what you flagged.' },
  { min: 150, name: 'Junior detective', blurb: 'You got there, but missed clues or guessed along the way.' },
  { min: 200, name: 'Detective', blurb: 'Solid reasoning. You found the key evidence and built a sound case.' },
  { min: 245, name: 'Chief Inspector', blurb: 'Excellent. Precise evidence, the right conclusion and the right first move.' },
];

export const TI_LEAD = [
  {
    id: 'unravelled-attribution',
    title: 'The attribution that unravelled',
    skill: 'correlation',
    blurb: 'A month ago the team told the board that a named group was behind an attack. A partner now says the evidence does not point to them. Find where the reasoning went wrong and decide how to put it right.',
    brief: [
      'Last month Contoso\'s intelligence team wrote an assessment for the board: "We assess that the Marigold group was responsible for the attack on our finance system." The chief executive repeated it to a customer. This week a partner says the infrastructure the team used for the attribution is also used by several unrelated groups.',
      'You have the original assessment to start with, and deeper evidence as you find the right clues. Work out where the reasoning went wrong, flag the lines that matter and decide the right first move. Be fair to the analyst: the question is how a good analyst could be misled.',
    ],
    ratings: RATINGS,
    clues: {
      shared: { strength: 'strong', text: 'The address the assessment relied on sits in a hosting range used by thousands of customers, including at least four unrelated groups.' },
      tool: { strength: 'strong', text: 'The malware used in the attack is sold openly on a criminal marketplace, so having it does not identify who is using it.' },
      oneway: { strength: 'strong', text: 'The analyst compared the evidence with one candidate, Marigold, and did not compare it with any others.' },
      unsure: { strength: 'strong', text: 'The assessment gave no confidence level and did not say that other explanations were possible.' },
      urgency: { strength: 'weak', text: 'The board had asked for an answer within two days.' },
    },
    artefacts: [
      {
        id: 'assessment', title: 'The original assessment',
        blurb: 'What the board was told.',
        lines: [
          { id: 'a1', type: 'clue', clue: 'unsure', text: 'Assessment to the board: "We assess that the Marigold group was responsible for the attack on our finance system. The attack used infrastructure and tooling previously associated with Marigold."', note: 'A flat statement with no confidence level and no alternatives. The reader is given certainty the evidence does not support.' },
          { id: 'a2', type: 'herring', text: 'The assessment was two pages long and well formatted', note: 'Polish is not rigour.' },
          { id: 'a3', type: 'herring', text: 'The analyst has eight years\' experience and an excellent record', note: 'Experience does not remove the need to test a conclusion.' },
          { id: 'a4', type: 'plain', text: 'The finance system attack caused no loss, because the payment was caught', note: 'The impact.' },
          { id: 'a5', type: 'plain', text: 'The chief executive repeated the attribution to a customer on a call', note: 'Why it needs correcting.' },
        ],
      },
      {
        id: 'basis', title: 'The basis for the attribution',
        blurb: 'What the assessment rested on.',
        unlockedBy: 'unsure',
        lines: [
          { id: 'b1', type: 'clue', clue: 'shared', text: 'Registry record for 203.0.113.80: "Range allocated to Skyline Hosting. About 4,000 customers. Recent reports from partners involve four unrelated groups using addresses in this range."', note: 'A shared range tells you little about any one tenant. It is like blaming a whole building for one flat.' },
          { id: 'b2', type: 'clue', clue: 'tool', text: 'Analyst note: "The malware family is known; Marigold used it in 2023." Marketplace listing: "Tool X, licence £400, support included. 600 buyers."', note: 'A tool that anyone can buy cannot point to one buyer.' },
          { id: 'b3', type: 'herring', text: 'Three Marigold reports from last year mention the same malware', note: 'Marigold used it. So did hundreds of others.' },
          { id: 'b4', type: 'herring', text: 'The attack took place on a Tuesday, as Marigold attacks have before', note: 'A weekday is not a fingerprint.' },
          { id: 'b5', type: 'plain', text: 'The domain used for control was registered three weeks before the attack', note: 'A date, and no link to a group.' },
        ],
      },
      {
        id: 'process', title: 'How the conclusion was reached',
        blurb: 'The analyst\'s working.',
        unlockedBy: 'shared',
        lines: [
          { id: 'c1', type: 'clue', clue: 'oneway', text: 'Analyst working notes: "Checked against Marigold: 3 of 5 traits match (tool, hosting, day of week). Strong enough. Did not have time to check others."', note: 'Matching three traits to one candidate, without testing any other, proves little. Any group would match some traits.' },
          { id: 'c2', type: 'clue', clue: 'urgency', text: 'Email from the board secretary: "The board needs the answer by Thursday."', note: 'Pressure explains the shortcut without excusing it. A good assessment says what it does not know.' },
          { id: 'c3', type: 'herring', text: 'The analyst\'s manager reviewed the assessment and approved it', note: 'The review did not ask what was not considered.' },
          { id: 'c4', type: 'herring', text: 'The partner\'s own report was published on social media first', note: 'The route does not change the facts it contains.' },
          { id: 'c5', type: 'plain', text: 'Contoso has no written standard for how attribution claims are checked', note: 'A process gap.' },
        ],
      },
    ],
    solution: {
      attack: [
        { id: 'weak', correct: true, text: 'The attribution rested on a shared hosting range and a tool anyone can buy, was tested against only one candidate group, and was given to the board as a certainty; the evidence supports "one campaign, actor unknown"', explain: 'Shared hosting, a commodity tool, a single candidate and no confidence level together explain how a good analyst under time pressure came to overstate the evidence.' },
        { id: 'falseflag', correct: false, text: 'Another group deliberately imitated Marigold to fool Contoso', explain: 'Nothing supports that. Shared tools and shared hosting explain the match without any plot.' },
        { id: 'partner', correct: false, text: 'The partner is wrong and the attribution was correct', explain: 'The registry record and the marketplace listing support the partner.' },
        { id: 'invented', correct: false, text: 'The analyst invented the evidence', explain: 'The evidence was real; it was weighed too heavily.' },
      ],
      support: 'Choose up to three clues that best prove it.',
      action: [
        { id: 'correct', correct: true, text: 'Tell the board, and everyone who heard it including the customer, that the attribution is withdrawn and the assessment is now "one campaign, actor unknown", with a confidence level; keep the original on record; and add a rule that attribution claims state confidence, compare at least two explanations and are reviewed by someone who was not involved', explain: 'Corrects the record openly, keeps the history, and improves the method so it does not depend on one person\'s care.' },
        { id: 'quiet', correct: false, text: 'Quietly delete the old assessment and say nothing', explain: 'It has been repeated to a customer, and hiding it makes it worse.' },
        { id: 'defend', correct: false, text: 'Stand by the attribution until proven wrong', explain: 'It was never proved right.' },
        { id: 'swap', correct: false, text: 'Replace Marigold with another group that matches better', explain: 'It repeats the same mistake of naming a culprit the evidence cannot support.' },
      ],
    },
    story: [
      'A month ago, after an attack on the finance system, the board asked for a name. The analyst compared the evidence with one known group and found three matching traits.',
      'The address was in a hosting range used by thousands of customers, and the malware was sold openly to hundreds of buyers. Neither identifies a user. Nothing else was checked, and the board was told it was certain.',
      'The chief executive repeated it to a customer, and then a partner pointed out the shared range.',
      'The lesson is that a name is the last thing evidence can usually give. Say how sure you are, test more than one explanation, and correct yourself in the open.',
    ],
  },
];
