// Threat Intelligence senior-tier simulations. Everything here is fictional: the companies, groups, feeds and people
// are invented. They are decision-based: what to collect and why, how to share and what handling rules mean, and how to
// give a judgement that decision-makers can use without overreaching. They contain no attack technique.
//
// The tier's themes: collection should answer a question someone has to decide, sharing is a duty with rules, and a good
// analyst is known by how often the judgement still stands afterwards.

const RATINGS = [
  { name: 'Feed collector', blurb: 'More was collected than anyone could use, or a rule about sharing was broken, or a judgement went beyond the evidence. Read each stage note.' },
  { name: 'Senior analyst in training', blurb: 'Mostly sound, with gaps in tying collection to decisions, in how you shared, or in how sure you said you were.' },
  { name: 'Senior intelligence analyst', blurb: 'Collection tied to decisions, sharing within the rules and judgements stated with honest confidence.' },
  { name: 'Intelligence lead', blurb: 'Leaders asked better questions because of you, partners trusted what you shared, and your judgements stood up afterwards.' },
];

export const TI_LEAD = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'collection-plan',
    title: 'What should we collect?',
    skill: 'hardening',
    minutes: 22,
    blurb: 'The head of security says: "Give me everything about threats to us." You have forty analyst-hours a month and a pile of feeds. Decide what questions the work should answer, what to collect and what to turn down.',
    brief: [
      'Contoso\'s intelligence function is two analysts and a budget for one more feed. The head of security has asked for "everything about threats to us". A sales representative is offering a feed of 4,000 new indicators a day, and a colleague wants to subscribe to every free list she can find.',
      'You are the senior intelligence analyst. You will rank what a collection plan needs, read last quarter\'s reporting, spend a limited budget of hours, decide how to answer the call to collect everything, and review the draft plan.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what a collection plan needs',
        intro: 'Tap the items in order, the most important first. Think about what makes intelligence useful rather than merely plentiful.',
        items: [
          { id: 'a1', source: 'Questions', priority: 1, text: 'A short list of questions that someone has to decide on, such as which attackers target firms like us and what they do first.', why: 'Collection without a question produces volume, not intelligence.' },
          { id: 'a2', source: 'Customers', priority: 2, text: 'A named reader for each question, and what they will do with the answer.', why: 'If nobody will act on an answer, the question is not worth collecting for.' },
          { id: 'a3', source: 'Sources', priority: 3, text: 'The sources best placed to answer each question, with a view of how reliable each one is.', why: 'Matches the effort to the question.' },
          { id: 'a4', source: 'Capacity', priority: 4, text: 'What the team can process in forty hours a month, and what has to be dropped.', why: 'A plan that cannot be delivered is a wish.' },
          { id: 'a5', source: 'Volume', priority: 5, text: 'The number of indicators and reports collected each day.', why: 'Volume is the least useful measure of intelligence.' },
        ],
      },
      {
        id: 'quarter', type: 'evidence', title: 'Read last quarter\'s reporting',
        intro: 'You have the list of reports sent last quarter, who read them and what happened as a result. Look for what shaped the value. Flag only what the records support.',
        clues: {
          unread: { strength: 'strong', text: 'Of 120 reports sent last quarter, readers opened 31 and records show action taken on four.' },
          requested: { strength: 'strong', text: 'The four that led to action all answered a question a named person had asked in advance.' },
          volume: { strength: 'strong', text: 'The team spent about 70% of its time triaging the existing feed, most of which matched nothing in Contoso\'s environment.' },
          gap: { strength: 'strong', text: 'Nobody has asked which attackers target firms in Contoso\'s sector, which is the question the head of security cares about most.' },
          award: { strength: 'weak', text: 'The existing feed vendor won an industry award last year.' },
        },
        artefacts: [
          {
            id: 'reports', title: 'The reports and what became of them',
            lines: [
              { id: 'b1', type: 'clue', clue: 'unread', text: 'Report log: "Sent 120. Opened 31. Reply or action recorded: 4. No response: 85."', note: 'Most of what was produced was ignored. Output is not value.' },
              { id: 'b2', type: 'clue', clue: 'requested', text: 'The four actioned reports: "Is our VPN vendor affected?" (asked by IT), "Who targets our sector?" (asked by the head of security), "Is this invoice email part of a campaign?" (asked by finance), "Which indicators should we block?" (asked by the SOC).', note: 'Each answered a question somebody had asked. Intelligence gets used when it answers a decision.' },
              { id: 'b3', type: 'herring', text: 'Fifteen reports were praised in the weekly team meeting', note: 'Praise is not action.' },
              { id: 'b4', type: 'herring', text: 'The report template was redesigned in March', note: 'A better template does not change whether it is read.' },
              { id: 'b5', type: 'plain', text: 'The team is two analysts and a part-time manager', note: 'The capacity available.' },
            ],
          },
          {
            id: 'time', title: 'Where the time went',
            lines: [
              { id: 'b6', type: 'clue', clue: 'volume', text: 'Time record: "Triage of the daily feed (about 3,800 indicators): 70% of analyst hours. Matches in Contoso\'s environment: 6."', note: 'Nearly all the time went on a feed that almost never mattered.' },
              { id: 'b7', type: 'clue', clue: 'gap', text: 'Head of security, email: "I do not know which groups would go after a company like ours, and I need to for the budget."', note: 'The question that matters most has not been answered, while the team processes indicators.' },
              { id: 'b8', type: 'clue', clue: 'award', text: 'Vendor: "Voted Best Threat Feed of the Year."', note: 'An award says nothing about how many indicators matter here.' },
              { id: 'b9', type: 'herring', text: 'A competitor says it subscribes to 40 feeds', note: 'Quantity is not a measure of quality.' },
              { id: 'b10', type: 'herring', text: 'The sales representative says the new feed has "twice the coverage"', note: 'Coverage is not relevance.' },
              { id: 'b11', type: 'plain', text: 'The feed contract renews in six weeks', note: 'A decision point.' },
            ],
          },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'analyst-hours', budget: 10, title: 'Spend ten analyst-hours next week',
        intro: 'Spend all ten across these five pieces of work.',
        items: [
          { id: 'e1', source: 'Ask', ideal: 3, text: 'Meet the head of security, IT, finance and the SOC and agree the five questions the function will answer this quarter.', why: 'The foundation of a plan.' },
          { id: 'e2', source: 'Sector', ideal: 3, text: 'Answer the question the head of security cares about: who targets firms like Contoso, and what they do first.', why: 'The question nobody has asked, and the most useful answer.' },
          { id: 'e3', source: 'Trim', ideal: 2, text: 'Cut the existing feed down to the sources that matched anything in the last quarter.', why: 'Frees time for work that matters.' },
          { id: 'e4', source: 'Measure', ideal: 2, text: 'Set up a simple record of who reads what and what changes because of it.', why: 'Lets you show the value.' },
          { id: 'e5', source: 'More feeds', ideal: 0, text: 'Evaluate the sales representative\'s feed and the free lists.', why: 'More input is not the problem.' },
        ],
      },
      {
        id: 'all', type: 'decision', title: 'Decide: the call to collect everything',
        intro: 'The head of security says: "I asked for everything. Take the new feed and every free list, and show me the volume." The contract renews in six weeks.',
        prompt: 'What do you recommend?',
        options: [
          { id: 'questions', quality: 3, text: 'Agree a short list of questions with named readers, put the effort there (starting with who targets the sector), trim the existing feed to what matches, decline the new feed for now and report on what changed because of the intelligence, not on volume', set: { questions: true }, consequence: 'The head of security is surprised, then engaged. The first sector assessment shapes the budget, and the team\'s reports are opened three times as often.' },
          { id: 'trial', quality: 2, text: 'Take the new feed on a two-month trial and put the rest of the effort into the questions', set: { trial: true }, consequence: 'The trial costs time, and finds that almost none of the new indicators match anything. You learn it cheaply.' },
          { id: 'refuse', quality: 1, text: 'Say that "everything" cannot be done and refuse to collect more', set: { refuse: true }, consequence: 'You are right, and the head of security hears a no. Nothing changes and the relationship cools.' },
          { id: 'everything', quality: 0, text: 'Take the new feed and every free list, and report the volume each month', set: { everything: true }, consequence: 'The team drowns in 9,000 indicators a day. Nobody reads the reports, and the one that mattered is lost in the noise.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft collection plan',
        intro: 'A colleague has drafted the plan.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'v1', sound: true, text: 'The function will answer five questions this quarter, each with a named reader who has said what they will do with the answer.', why: 'A plan tied to decisions.' },
          { id: 'v2', sound: false, text: 'Success will be measured by the number of indicators collected each month.', why: 'Volume is not value, as last quarter\'s numbers show.' },
          { id: 'v3', sound: true, text: 'The existing feed will be cut to the sources that matched something in the last quarter.', why: 'Frees time, supported by the time record.' },
          { id: 'v4', sound: false, text: 'Adding the new feed will give complete coverage of threats to Contoso.', why: 'Unsupported: no feed can, and the old one matched six indicators from 3,800 a day.' },
          { id: 'v5', sound: false, text: 'Intelligence is working well because the reports are praised in the weekly meeting.', why: 'Praise is not action. Four of 120 reports led to action.' },
          { id: 'v6', sound: true, text: 'The plan will be reviewed at the end of the quarter against what changed because of the reports.', why: 'Measures what matters.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the note for the head of security',
        intro: 'Say what you recommend collecting, what you are turning down and how you will show the value.',
        statements: [
          { id: 'r1', correct: true, text: 'Last quarter the team sent 120 reports, 31 were opened and four led to action, each of which answered a question somebody had asked.', why: 'Shown by the report log.' },
          { id: 'r2', correct: true, text: 'About 70% of analyst time went on triaging a feed that matched six indicators in Contoso\'s environment.', why: 'Shown by the time record.' },
          { id: 'r3', correct: true, text: 'The question the head of security cares about most, who targets firms like Contoso, has not been answered, and will be this quarter.', why: 'Shown by the email.' },
          { id: 'r4', correct: true, text: 'More collection will not help without questions to answer, and we will report on what changes because of the intelligence.', why: 'Frames the value.' },
          { id: 'r5', correct: false, text: 'More feeds will give the board complete visibility.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The team\'s work is valued, as the praise in team meetings shows.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'Volume of indicators is the right measure of the function.', why: 'Unsupported.' },
          { id: 'r8', when: 'questions', correct: true, text: 'We agreed five questions with named readers, trimmed the feed, declined the new one and began with the sector question.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'trial', correct: true, text: 'We trialled the new feed for two months, which cost time and showed it matched almost nothing.', why: 'An honest account.' },
          { id: 'r10', when: 'refuse', correct: true, text: 'We refused to collect more, which was right in principle and cooled the relationship with the head of security.', why: 'An honest account.' },
          { id: 'r11', when: 'everything', correct: true, text: 'We took every feed and reported volume, and the one report that mattered was lost in the noise.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Agree five questions and named readers with the head of security, IT, finance and the SOC.', why: 'The basis of the plan.' },
          { id: 'a2', correct: true, text: 'Produce the sector assessment first and report what changed because of it.', why: 'The most valuable answer, and the proof of value.' },
          { id: 'a3', correct: true, text: 'Trim the existing feed to the sources that matched something and decline the new one for now.', why: 'Saves time and money.' },
          { id: 'a4', correct: false, text: 'Subscribe to every free list to be thorough.', why: 'Volume without questions.' },
          { id: 'a5', correct: false, text: 'Report indicator counts to the board each month.', why: 'Measures the wrong thing.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'ti-senior-exam',
    title: 'Promotion exam: Senior Intelligence Analyst',
    skill: 'hardening',
    minutes: 28,
    blurb: 'A partner asks you to share an indicator list, a journalist asks for a comment and the board wants a sector brief. Decide what you may share, what you may say and how sure you are. Silver or better to pass.',
    brief: [
      'Contoso investigated a phishing campaign last week. A sector sharing group has asked for the indicators, and says it will pass them to its members. A journalist has asked Contoso to confirm that it was targeted. The board has asked for a one-page sector brief by Friday.',
      'You are the senior intelligence analyst. You will rank what to settle, spend a limited budget of hours, read the material, decide how to handle the request to share, and review the draft brief.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank what to settle first',
        intro: 'Tap the issues in order, the first at the top. Think about what cannot be taken back.',
        items: [
          { id: 'x1', source: 'Sharing rules', priority: 1, text: 'What the handling markings on your own material and on the partner\'s material allow you to share, and with whom.', why: 'A shared indicator list cannot be recalled, and breaking a rule costs trust.' },
          { id: 'x2', source: 'Contents', priority: 2, text: 'Whether the list contains anything about Contoso\'s staff, customers or systems that must be removed before sharing.', why: 'Sharing indicators is useful. Sharing victims is not.' },
          { id: 'x3', source: 'Journalist', priority: 3, text: 'What, if anything, to confirm to the journalist.', why: 'A public statement cannot be withdrawn, and it should come from the right person.' },
          { id: 'x4', source: 'Confidence', priority: 4, text: 'How sure you are of what the indicators show, and how to say so.', why: 'Partners will act on it.' },
          { id: 'x5', source: 'The brief', priority: 5, text: 'The one-page sector brief for the board.', why: 'Important, with a deadline of Friday.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'hours', budget: 10, title: 'Spend your ten hours before Friday',
        intro: 'Spend all ten across these four pieces of work.',
        items: [
          { id: 'e1', source: 'Prepare', ideal: 3, text: 'Prepare a version of the indicator list that is safe to share: only the attacker infrastructure, with the confidence and the handling marking stated.', why: 'Makes sharing useful and safe.' },
          { id: 'e2', source: 'Brief', ideal: 3, text: 'Write the sector brief: what we know, what we assess, how sure we are and what to do.', why: 'Has a deadline and a board reader.' },
          { id: 'e3', source: 'Press', ideal: 2, text: 'Agree with Communications and Legal what, if anything, may be said to the journalist, and by whom.', why: 'A public statement is for the right people.' },
          { id: 'e4', source: 'Partner', ideal: 2, text: 'Agree with the sharing group the marking under which the list is shared and who may receive it.', why: 'Protects Contoso and the recipients.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Read the material',
        intro: 'You have the draft indicator list, the sharing group\'s rules and the journalist\'s email. Look for what affects what you may share and say. Flag only what the sources support.',
        clues: {
          victims: { strength: 'strong', text: 'The draft list includes the email address and name of the finance clerk who received the phishing email.' },
          marking: { strength: 'strong', text: 'The sharing group\'s rules say material marked "amber" may be shared with members\' organisations but not made public.' },
          journalist: { strength: 'strong', text: 'The journalist asks Contoso to confirm that it was "attacked by a named group".' },
          confidence: { strength: 'strong', text: 'The indicators link the campaign to a cluster of activity, and nothing in the evidence names a group or a country.' },
          press: { strength: 'weak', text: 'The journalist says three other companies have already confirmed.' },
        },
        artefacts: [
          {
            id: 'list', title: 'The draft list and the sharing rules',
            lines: [
              { id: 'f1', type: 'clue', clue: 'victims', text: 'Draft indicator list, row 14: "Target: j.moore@contoso.example (finance clerk), received 04 Oct 09:12". Row 15: "Attachment name: Remittance_Advice.docm".', note: 'Row 14 identifies a member of staff. It is not an indicator, and it should not leave Contoso.' },
              { id: 'f2', type: 'clue', clue: 'marking', text: 'Sharing group rules, section 3: "Material marked AMBER may be shared within members\' organisations and with their trusted partners, and must not be published. RED may not be shared beyond the named recipients."', note: 'The rules say what the marking allows. Choosing the marking is part of the job.' },
              { id: 'f3', type: 'herring', text: 'The sharing group has 140 members and a good reputation', note: 'Reputation does not remove the need for rules.' },
              { id: 'f4', type: 'herring', text: 'The list was assembled in an afternoon', note: 'Speed does not affect what is safe to share.' },
              { id: 'f5', type: 'plain', text: 'The list contains 6 domains, 3 file names, 2 addresses and 1 target row', note: 'The contents.' },
            ],
          },
          {
            id: 'press', title: 'The journalist and the evidence',
            lines: [
              { id: 'f6', type: 'clue', clue: 'journalist', text: 'Journalist\'s email: "We understand Contoso was hit by the Marigold group. Can you confirm by 15:00?"', note: 'A request to confirm something your evidence does not show, to be answered by the right person.' },
              { id: 'f7', type: 'clue', clue: 'confidence', text: 'Analysis note: "Indicators link the incidents at three companies to one cluster of activity. No infrastructure, tooling or language ties the cluster to any named group or country. Confidence that it is one campaign: high. Confidence in any attribution: none."', note: 'You can say it is one campaign, and that the actor is unknown.' },
              { id: 'f8', type: 'clue', clue: 'press', text: 'Journalist: "Three other companies have already confirmed it."', note: 'Pressure. Other companies\' statements are not a reason to say what your evidence does not show.' },
              { id: 'f9', type: 'herring', text: 'The deadline for the journalist is 15:00 today', note: 'A deadline is not a reason to confirm unsupported claims.' },
              { id: 'f10', type: 'plain', text: 'Contoso has a policy that only the Communications director speaks to the press', note: 'Who may answer.' },
            ],
          },
        ],
      },
      {
        id: 'share', type: 'decision', title: 'Decide: the request to share the list',
        intro: 'The sharing group says: "Send us the full list as it is, and we will pass it to everyone." The journalist\'s deadline is in three hours.',
        prompt: 'What do you do?',
        options: [
          { id: 'safe', quality: 3, text: 'Remove the staff row and anything identifying Contoso, mark the list AMBER with a stated confidence and "attribution: none", share it with the group, and refer the journalist to the Communications director with a line that says what is known (one campaign, actor unknown)', set: { safe: true }, consequence: 'The group finds the list immediately useful and two members block the domains the same day. The journalist receives a short, accurate statement from the Communications director.' },
          { id: 'asis', quality: 2, text: 'Share the list with the staff row removed, but no marking and no confidence statement', set: { asis: true }, consequence: 'The group shares it widely. No one is harmed, and a member later posts it publicly because it carried no marking.' },
          { id: 'hold', quality: 1, text: 'Share nothing until a lawyer has approved every word', set: { hold: true }, consequence: 'Nothing is leaked. The campaign continues against three other members while the list waits for a week.' },
          { id: 'full', quality: 0, text: 'Send the full list as it is, and confirm to the journalist that Contoso was hit by the named group', set: { full: true }, consequence: 'The clerk\'s name and address appear in a post that evening. The story names a group the evidence does not support. Contoso has to retract it and apologise.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft sector brief',
        intro: 'A colleague has drafted parts of the one-page brief.',
        draftIntro: 'Read each statement. Flag every one that is wrong, overstated or unsupported.',
        statements: [
          { id: 'b1', sound: true, text: 'We assess with high confidence that three companies in our sector were targeted by one campaign, from the shared infrastructure.', why: 'Supported, and states confidence.' },
          { id: 'b2', sound: false, text: 'The campaign was carried out by the Marigold group.', why: 'No evidence ties the activity to any group.' },
          { id: 'b3', sound: true, text: 'We have no basis to attribute the campaign to any group or country, and will say so if that changes.', why: 'The honest position.' },
          { id: 'b4', sound: false, text: 'The campaign has stopped.', why: 'Unsupported: it has been seen against three companies and nothing shows it has ended.' },
          { id: 'b5', sound: false, text: 'The finance clerk was careless.', why: 'Blames a person and has no place in a brief.' },
          { id: 'b6', sound: true, text: 'Finance teams should confirm any change of bank details by phone, whoever asks.', why: 'A proportionate action tied to the goal of the campaign.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the sector brief for the board',
        intro: 'Say what you know, what you assess and how sure you are. Name no person and no group you cannot support.',
        statements: [
          { id: 'r1', correct: true, text: 'We assess with high confidence that one campaign has targeted three companies in our sector, based on shared infrastructure and file names.', why: 'Shown by the analysis note.' },
          { id: 'r2', correct: true, text: 'We have no evidence of who is behind it, and cannot attribute it to any group or country.', why: 'An honest statement of the limit.' },
          { id: 'r3', correct: true, text: 'The indicators have been shared with the sector group under an AMBER marking with the staff details removed.', why: 'An accurate account of the sharing rules applied.' },
          { id: 'r4', correct: true, text: 'The campaign appears aimed at finance teams, and the call-back check for changes of bank details is the most useful defence.', why: 'Follows from the evidence.' },
          { id: 'r5', correct: false, text: 'A named foreign group is responsible.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The campaign has ended.', why: 'Unsupported.' },
          { id: 'r7', correct: false, text: 'The finance clerk was responsible for the incident.', why: 'Unsupported, and unfair.' },
          { id: 'r8', when: 'safe', correct: true, text: 'We shared a cleaned list marked AMBER with a stated confidence and referred the journalist to Communications, and the group acted on it the same day.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'asis', correct: true, text: 'We shared the list without a marking, and it was later made public by a member.', why: 'An honest account.' },
          { id: 'r10', when: 'hold', correct: true, text: 'We held the list for a week for legal review, and the campaign continued against three other members meanwhile.', why: 'An honest account.' },
          { id: 'r11', when: 'full', correct: true, text: 'We sent the full list including the clerk\'s details and confirmed an unsupported attribution, and had to retract and apologise.', why: 'An honest record of the mistake.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Share the cleaned indicators with a marking and a confidence statement, and nothing that identifies Contoso\'s staff.', why: 'Useful and safe.' },
          { id: 'a2', correct: true, text: 'Refer press enquiries to Communications, with a line that says what is known and not known.', why: 'The right person says the right thing.' },
          { id: 'a3', correct: true, text: 'Alert finance teams to confirm changes of bank details by phone.', why: 'Stops the goal of the campaign.' },
          { id: 'a4', correct: false, text: 'Confirm the attribution to the journalist before the deadline.', why: 'Unsupported.' },
          { id: 'a5', correct: false, text: 'Publish the indicator list on the company website.', why: 'Breaches the marking and the sharing rules.' },
        ],
      },
    ],
  },
];
