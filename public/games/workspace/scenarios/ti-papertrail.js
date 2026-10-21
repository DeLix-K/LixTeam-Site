// Threat Intelligence workspace, assignment 1: "Is the Paper Trail campaign aimed at us?".
// Everything here is fictional: the company, the sources, the campaign, the malware and the actor cluster. Domains
// and addresses use reserved example and documentation ranges.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   09:00  The CISO of Contoso Logistics asks: is this campaign aimed at us, how worried should we be, and what should we
//          block or hunt for? A brief is needed by 15:00 for the decision meeting at 15:30.
//   Seven reports arrive from sources of very different quality. Some claims are facts, some are inferences, some are
//   assumptions and one is a rumour. Thirteen indicators sit under them: some are core to the campaign, and three would
//   do harm if blocked (a sinkholed domain, a shared hosting address and a legitimate software vendor's update server).
//   You have nine lookups to spend on thirteen indicators, so you cannot check everything.
//   During the day our own telemetry adds to the picture and the vendor retracts one of its indicators.

const m = (h, mi = 0) => h * 60 + mi;

const sources = [
  { id: 'S1', name: 'ThreatCo', kind: 'Commercial vendor', desc: 'A well-known security vendor with its own analysts and customers. It sells subscriptions, so it likes a good story.' },
  { id: 'S2', name: 'FreightShare', kind: 'Sector sharing group', desc: 'A trusted community of freight and port security teams. Members post what they see, unedited.' },
  { id: 'S3', name: 'ShellNotes', kind: 'Independent researcher blog', desc: 'A respected independent researcher who writes quickly and sometimes pastes lists without checking every item.' },
  { id: 'S4', name: '@leak_hawk', kind: 'Anonymous social media account', desc: 'An account with no history that posts claims about breaches. Nothing it has said before has been checked.' },
  { id: 'S5', name: 'IndicatorFeed Pro', kind: 'Paid automated feed', desc: 'A machine-generated feed of indicators from many sources, with confidence scores and no human review.' },
  { id: 'S6', name: 'Contoso email gateway', kind: 'Our own telemetry', desc: 'What our own systems saw. We know exactly how it was collected.' },
  { id: 'S7', name: 'National cyber agency', kind: 'Government advisory', desc: 'A national authority that publishes advisories with stated confidence levels, usually after cross-checking.' },
];

const reports = [
  { id: 'R1', source: 'S1', title: 'ThreatCo: the "Paper Trail" campaign against freight forwarders', rel: 'A', cred: '2',
    text: 'Since about two weeks ago, freight forwarders have received invoices that appear to come from Fabrikam Freight, a well-known supplier. The emails link to a "document portal" on a lookalike domain. We analysed one sample: the portal serves an installer that we call PaperLoad, a loader that steals saved browser credentials and sends them to an address we have observed. The lookalike domains were registered within the last ten days by a contact using the same throwaway address, and they share one TLS certificate and one hosting address. We assess with low to moderate confidence that this activity is linked to a group we track as Heron.',
    why: 'A reputable vendor with its own analysis, whose attribution is hedged: reliable, probably true.' },
  { id: 'R2', source: 'S2', title: 'FreightShare member post: suspicious supplier invoices', rel: 'B', cred: '2',
    text: 'Member post, Tuesday: three of us have now seen invoices claiming to be from Fabrikam Freight, sent from accounts@invoices-fabrikam.example, with a link to a document portal. One team clicked in a sandbox and got an installer. We think they will go after the ports next.',
    why: 'Real observation from peers, but one line of it is a guess.' },
  { id: 'R3', source: 'S3', title: 'ShellNotes blog: Paper Trail indicators', rel: 'B', cred: '3',
    text: 'Here is my list of indicators for Paper Trail. All ten belong to the same campaign. The domains share infrastructure and a registrant. I also include old-paper.example from an older Paper Trail run, the address 198.51.100.200 where one of the domains once resolved, and a hash from an earlier PaperLoad build.',
    why: 'A respected researcher, but the list is pasted without checking: some entries are stale or shared. Usually reliable, content doubtful.' },
  { id: 'R4', source: 'S4', title: '@leak_hawk: "Contoso breached"', rel: 'C', cred: '3',
    text: 'BREAKING: Contoso Logistics has been breached and customer data is for sale. Sources say foreign government hackers did it. More soon.',
    why: 'An anonymous account with no history and no evidence.' },
  { id: 'R5', source: 'S5', title: 'IndicatorFeed Pro export: PAPERLOAD', rel: 'B', cred: '3',
    text: 'Feed export, 18 indicators tagged PAPERLOAD or PAPER-TRAIL. All entries carry confidence scores of 80 or more. First-seen dates range from last week to 2023. Includes domains, addresses, hashes and the family name. The feed does not distinguish active infrastructure from historical.',
    why: 'An automated feed with no review: it mixes active and historical entries, including a sinkholed domain and a shared hosting address.' },
  { id: 'R6', source: 'S6', title: 'Contoso email gateway: a lookalike sender domain', rel: 'A', cred: '1',
    text: 'Last Thursday two messages from accounts@invoices-fabrikam.example were delivered to two finance staff. The messages contain a link to a "document portal". Proxy logs for the last 30 days show no connection from any Contoso device to the portal domains. Nothing else about the senders is known. The messages were sent from the mail relay 203.0.113.9.',
    why: 'Our own telemetry: reliable, and what it records is confirmed by the logs.' },
  { id: 'R7', source: 'S7', title: 'National cyber agency: phishing against the freight sector', rel: 'A', cred: '2',
    text: 'We assess with moderate confidence that financially motivated criminals are targeting freight and port operators in the UK with supplier-themed phishing. Organisations should warn finance and procurement staff and block the indicators that vendors have confirmed. This advisory does not attribute the activity to any named group.',
    why: 'A national authority with a stated confidence level and no overreach.' },
];

const claims = [
  { id: 'c1', report: 'R1', text: 'The emails impersonate Fabrikam Freight and link to a fake document portal.', truth: 'fact', why: 'Confirmed by the sector group, the agency and our own gateway.' },
  { id: 'c2', report: 'R1', text: 'The lookalike domains were registered within the last ten days.', truth: 'fact', why: 'Lookups show registration dates six to nine days ago.' },
  { id: 'c3', report: 'R1', text: 'The payload is a credential stealer called PaperLoad.', truth: 'assessment', why: 'One vendor analysed one sample. Credible, but not independently confirmed.' },
  { id: 'c4', report: 'R1', text: 'The activity is linked to a group called Heron.', truth: 'assessment', why: 'Attribution is an assessment. The vendor itself says low to moderate confidence.' },
  { id: 'c5', report: 'R2', text: 'At least three freight forwarders received the same lookalike invoices.', truth: 'fact', why: 'The sector group, the vendor and the agency all say so.' },
  { id: 'c6', report: 'R2', text: 'The attackers will go after the ports next.', truth: 'assumption', why: 'A guess with no support.' },
  { id: 'c7', report: 'R3', text: 'All ten indicators in the post belong to the same campaign.', truth: 'assumption', why: 'Two are old and one is a shared hosting address. The list was not checked.' },
  { id: 'c8', report: 'R3', text: 'The campaign\'s domains share infrastructure and a registrant.', truth: 'fact', why: 'The vendor says so and lookups show it.' },
  { id: 'c9', report: 'R4', text: 'Contoso has been breached and customer data is for sale.', truth: 'rumour', why: 'An anonymous account, no evidence, and our own telemetry shows nothing.' },
  { id: 'c10', report: 'R4', text: 'The attackers are a foreign government.', truth: 'rumour', why: 'No evidence. The agency attributes the activity to criminals.' },
  { id: 'c11', report: 'R5', text: 'Every indicator in the feed is active and malicious.', truth: 'assumption', why: 'It includes a sinkholed domain, a shared hosting address and a legitimate update server.' },
  { id: 'c12', report: 'R5', text: 'The campaign began about two weeks ago.', truth: 'assessment', why: 'The feed\'s first-seen dates, the vendor\'s timeline and the registration dates agree, but no one saw the first email.' },
  { id: 'c13', report: 'R6', text: 'Two lookalike emails were delivered to finance staff and nobody visited the portal.', truth: 'fact', why: 'Our own gateway and proxy logs.' },
  { id: 'c14', report: 'R6', text: 'There is no sign of an intrusion at Contoso so far.', truth: 'assessment', why: 'Absence of evidence in our own data: a reasonable inference that could change.' },
  { id: 'c15', report: 'R7', text: 'Freight and port operators in the UK are being targeted by financially motivated criminals.', truth: 'assessment', why: 'A credible authority with a stated moderate confidence: an assessment, not a certainty.' },
];

const indicators = [
  { id: 'I1', type: 'domain', value: 'invoices-fabrikam.example', from: ['R1', 'R3', 'R5', 'R6'], role: 'core', block: 'must', x: 14, y: 14, enrich: 'Registered nine days ago through a bulk registrar. Registrant contact: tmp-reg@mailbox.example. Mail is sent from the relay 203.0.113.9. Seen in our own email telemetry (two messages).' },
  { id: 'I2', type: 'domain', value: 'docs-fabrikam-portal.example', from: ['R1', 'R3', 'R5'], role: 'core', block: 'must', x: 42, y: 8, enrich: 'Registered eight days ago. Registrant contact: tmp-reg@mailbox.example. Resolves to 198.51.100.77. TLS certificate fingerprint 7C:4A:1B:90 (issued eight days ago).' },
  { id: 'I3', type: 'domain', value: 'fabrikam-secure-docs.example', from: ['R1', 'R3', 'R5'], role: 'core', block: 'must', x: 70, y: 14, enrich: 'Registered six days ago. Registrant contact: tmp-reg@mailbox.example. Resolves to 198.51.100.77. TLS certificate fingerprint 7C:4A:1B:90, the same as docs-fabrikam-portal. Serves a download of the installer fabrikam-doc.exe.' },
  { id: 'I4', type: 'domain', value: 'old-paper.example', from: ['R3', 'R5'], role: 'noise', block: 'never', harm: 'it has been sinkholed since 2023 and does nothing, so blocking it only pads the list with an entry nobody can verify', x: 85, y: 8, enrich: 'Registered in 2023. Taken over (sinkholed) by a security vendor in November 2023 and points to a sinkhole address. Inert. Not part of this campaign.' },
  { id: 'I5', type: 'ip', value: '198.51.100.77', from: ['R1', 'R3', 'R5'], role: 'core', block: 'must', x: 54, y: 40, enrich: 'A small virtual-server host. Created nine days ago. Hosts exactly two sites: docs-fabrikam-portal.example and fabrikam-secure-docs.example. Receives the credentials PaperLoad steals.' },
  { id: 'I6', type: 'ip', value: '198.51.100.200', from: ['R3', 'R5'], role: 'noise', block: 'never', harm: 'it is a shared hosting address with 412 unrelated websites, including a regional charity and a bakery', x: 84, y: 40, enrich: 'Shared hosting: 412 unrelated websites. One of the campaign domains pointed here briefly three days ago before it moved. Not a campaign address.' },
  { id: 'I7', type: 'ip', value: '203.0.113.9', from: ['R1', 'R6'], role: 'core', block: 'fine', x: 10, y: 42, enrich: 'A mail relay at a virtual-server host. Sent the two messages we received. Three domains from this campaign have sent mail from it this fortnight.' },
  { id: 'I8', type: 'hash', value: 'sha256 4be19a…c07d (fabrikam-doc.exe, PaperLoad)', from: ['R1'], role: 'core', block: 'must', x: 40, y: 66, enrich: 'The installer the vendor analysed. A loader that steals saved browser credentials and sends them to 198.51.100.77. Downloaded from fabrikam-secure-docs.example.' },
  { id: 'I9', type: 'hash', value: 'sha256 91c0d2…8e4f (older PaperLoad build)', from: ['R3'], role: 'core', block: 'fine', x: 72, y: 68, enrich: 'An older build from last year with the same code structure as the current one. No longer distributed.' },
  { id: 'I10', type: 'cert', value: 'TLS certificate 7C:4A:1B:90', from: ['R3'], role: 'core', block: 'fine', blockable: true, x: 30, y: 24, enrich: 'Presented by two sites this fortnight: docs-fabrikam-portal.example and fabrikam-secure-docs.example. Issued eight days ago.' },
  { id: 'I11', type: 'email', value: 'tmp-reg@mailbox.example', from: ['R1'], role: 'core', block: 'fine', blockable: false, x: 12, y: 64, enrich: 'A throwaway address used as the registrant contact for three domains registered in the last ten days.' },
  { id: 'I12', type: 'malware', value: 'PaperLoad', from: ['R1', 'R5'], role: 'core', block: 'fine', blockable: false, x: 56, y: 90, enrich: 'The name the vendor gives the family. A downloader and credential stealer. Two builds are known.' },
  { id: 'I13', type: 'domain', value: 'freightdocs-update.example', from: ['R5'], role: 'noise', block: 'never', harm: 'it is the update server for the freight management software Contoso uses, so blocking it would stop the company\'s own updates', x: 85, y: 66, enrich: 'Registered in 2016. The update server for a freight management product that Contoso uses. Legitimate. Listed in the feed because its name matched a pattern.' },
];

const links = [
  { a: 'I2', b: 'I3', basis: 'same-cert', strength: 'strong' },
  { a: 'I10', b: 'I2', basis: 'same-cert', strength: 'strong' },
  { a: 'I10', b: 'I3', basis: 'same-cert', strength: 'strong' },
  { a: 'I2', b: 'I5', basis: 'resolves-to', strength: 'strong' },
  { a: 'I3', b: 'I5', basis: 'resolves-to', strength: 'strong' },
  { a: 'I1', b: 'I7', basis: 'sends-from', strength: 'strong' },
  { a: 'I1', b: 'I11', basis: 'same-registrant', strength: 'strong' },
  { a: 'I2', b: 'I11', basis: 'same-registrant', strength: 'strong' },
  { a: 'I3', b: 'I11', basis: 'same-registrant', strength: 'strong' },
  { a: 'I3', b: 'I8', basis: 'delivers', strength: 'strong' },
  { a: 'I8', b: 'I12', basis: 'same-family', strength: 'strong' },
  { a: 'I9', b: 'I12', basis: 'same-family', strength: 'strong' },
  { a: 'I1', b: 'I2', basis: 'same-pattern', strength: 'weak' },
];

const judgements = [
  { id: 'J1', text: 'The campaign targets freight and port operators in the UK, and Contoso is a plausible target.', include: true, conf: 'moderate', weight: 4, why: 'Three independent sources and our own gateway agree that freight firms are targeted, but intent is an assessment.' },
  { id: 'J2', text: 'The emails use lookalike domains of a real supplier and a fake document portal.', include: true, conf: 'high', weight: 3, why: 'Confirmed by several sources and by our own gateway.' },
  { id: 'J3', text: 'The payload is PaperLoad, a loader that steals browser credentials.', include: true, conf: 'moderate', weight: 3, why: 'One vendor analysed one sample. Credible, not independently confirmed.' },
  { id: 'J4', text: 'The lookalike domains share a registrant, a TLS certificate and a hosting address, so they are one operation.', include: true, conf: 'high', weight: 3, why: 'Our own lookups confirm each link.' },
  { id: 'J5', text: 'A group called Heron may be responsible.', include: true, conf: 'low', weight: 3, why: 'The vendor itself says low to moderate, and the agency does not attribute. Attribution is rarely better than moderate.' },
  { id: 'J6', text: 'Two lookalike emails reached Contoso finance and nobody visited the portal. There is no sign of intrusion so far.', include: true, conf: 'moderate', weight: 4, why: 'The delivery and the lack of connections are fact. "No intrusion" is an inference from absence of evidence, so moderate.' },
  { id: 'J7', text: 'The campaign is state-sponsored.', include: false, conf: 'low', weight: 4, why: 'Only the anonymous account says so. The agency assesses financially motivated criminals.' },
  { id: 'J8', text: 'Contoso has been breached.', include: false, conf: 'low', weight: 4, why: 'Our own telemetry shows no intrusion. The claim comes from an anonymous account.' },
  { id: 'J9', text: 'Every indicator in the commercial feed is malicious.', include: false, conf: 'low', weight: 4, why: 'The feed includes a sinkholed domain, a shared hosting address and a legitimate update server.' },
  { id: 'J10', text: 'The attackers will move on to the ports next.', include: false, conf: 'low', weight: 4, why: 'A guess from a single post, with nothing to support it.' },
];

const recommendations = [
  { id: 'A1', text: 'Block the sender domain, the two link domains, the hosting address and the loader hash at the mail, web and endpoint tools.', good: true },
  { id: 'A2', text: 'Search mail and proxy logs for the last 14 days for the sender and link domains, and endpoints for the loader hash.', good: true },
  { id: 'A3', text: 'Warn finance and procurement staff about fake supplier invoices and the portal links.', good: true },
  { id: 'A4', text: 'Confirm that nobody clicked or entered credentials, and reset passwords if anyone did.', good: true },
  { id: 'A5', text: 'Share the confirmed indicators with the sector sharing group.', good: true },
  { id: 'A6', text: 'Block the whole 198.51.100.0/24 range.', good: false, why: 'It would block hundreds of unrelated sites and tells you nothing about the attacker.' },
  { id: 'A7', text: 'Block every indicator in the commercial feed without checking.', good: false, why: 'It includes a legitimate update server Contoso depends on and a shared hosting address.' },
  { id: 'A8', text: 'Tell the board that Contoso has been breached.', good: false, why: 'There is no evidence of a breach.' },
  { id: 'A9', text: 'Ignore it: it is only a rumour.', good: false, why: 'The core of it is confirmed by several sources and two emails reached our finance staff.' },
  { id: 'A10', text: 'Publish the attribution to the press as fact.', good: false, why: 'Attribution is a low-confidence assessment.' },
];

const decisions = [
  { id: 'raise', text: 'Raise the phishing alert level for finance to elevated, block and hunt now, and brief again if anything changes.', credit: 1, why: 'The campaign is real, aimed at the sector and has already reached us. The response is proportionate: block, hunt, warn.' },
  { id: 'watch', text: 'Keep watching and brief again when something changes.', credit: 0.4, why: 'Too passive: two emails already reached finance, and blocking is cheap and safe.' },
  { id: 'incident', text: 'Declare a major incident.', credit: 0, why: 'There is no evidence of an intrusion. Declaring one would cost time and credibility.' },
  { id: 'nothing', text: 'Do nothing.', credit: 0, why: 'The evidence is strong enough to act.' },
];

const events = [
  { id: 'e-req', t: m(9, 0), type: 'request', sev: 'medium', summary: 'Request from the CISO: Is this campaign aimed at us, how worried should we be, and what should we block or hunt for? A brief is needed by 15:00 for the 15:30 decision meeting.', fields: { from: 'CISO' } },
  { id: 'e-tel1', t: m(8, 50), type: 'telemetry', sev: 'low', summary: 'Email gateway: last Thursday two messages from accounts@invoices-fabrikam.example were delivered to two finance staff', fields: { from: 'accounts@invoices-fabrikam.example', source: 'email gateway' } },
  { id: 'e-tel2', t: m(10, 15), type: 'telemetry', sev: 'info', summary: 'Proxy: no connections to docs-fabrikam-portal.example or fabrikam-secure-docs.example from any Contoso device in the last 30 days', fields: { source: 'proxy' } },
  { id: 'e-tel3', t: m(11, 40), type: 'telemetry', sev: 'medium', summary: 'Email gateway: a third message from invoices-fabrikam.example was held by a heuristic filter this morning and not delivered', fields: { from: 'accounts@invoices-fabrikam.example', source: 'email gateway' } },
  { id: 'e-tel4', t: m(12, 30), type: 'update', sev: 'medium', summary: 'ThreatCo update: the vendor withdraws old-paper.example from its Paper Trail list. It was sinkholed in 2023 and is inert', fields: { source: 'ThreatCo' } },
  { id: 'e-tel5', t: m(13, 10), type: 'update', sev: 'high', summary: 'FreightShare: another member reports that one employee clicked a link from a lookalike invoice and entered credentials', fields: { source: 'FreightShare' } },
  { id: 'e-late', t: m(15, 0), type: 'request', sev: 'high', summary: 'The decision meeting starts without a brief from you', fields: { from: 'CISO' }, unless: ['submitted'], consequence: { cost: 5, label: 'The brief missed the decision meeting', prevented: 'the brief reached the decision meeting on time', text: 'The CISO went into the decision meeting without your assessment and had to guess.' } },
];

export const TI_PAPERTRAIL = {
  id: 'ti-papertrail',
  title: 'Is the Paper Trail campaign aimed at us?',
  workspace: 'ti',
  path: 'ti',
  pathLabel: 'Threat Intelligence',
  blurb: 'Seven reports from seven sources of very different quality, thirteen indicators and nine lookups. Judge the sources, separate fact from assumption, link what really belongs together, and tell the CISO what to do.',
  brief: [
    'It is 09:00 on Wednesday. A peer in the freight sector has warned that a phishing campaign is going round. The CISO of Contoso Logistics has asked you a plain question: is this campaign aimed at us, how worried should we be, and what should we block or hunt for before the decision meeting at 15:30?',
    'Seven reports have come in: a vendor, a sector sharing group, a researcher\'s blog, an anonymous social media account, an automated feed, our own telemetry and a government advisory. They disagree, overlap and contain mistakes. Read them, rate the sources, decide what is fact and what is assumption, connect the indicators that really belong together (you have only nine lookups), and write a brief the CISO can act on by 15:00.',
  ],
  clockStart: m(9, 0),
  horizon: m(16, 0),
  ti: { credits: 9, minSummary: 40, points: { reports: 12, claims: 18, links: 25, judgements: 20, iocs: 8, recs: 9, decision: 4, summary: 4 }, sources, reports, claims, indicators, links, judgements, recommendations, decisions },
  ui: {
    name: 'Contoso threat intelligence desk',
    nav: ['brief', 'sources', 'claims', 'graph', 'logs', 'assess'],
    labels: { sources: 'Sources & reports', claims: 'Fact or assumption', graph: 'Indicator graph', logs: 'Telemetry & updates', assess: 'Intelligence brief' },
    reportView: 'assess',
    noPins: true,
    examples: ['type:telemetry', 'type:update', 'invoices-fabrikam', 'finance', 'clicked'],
    searchHint: 'type:telemetry   type:update   invoices-fabrikam   or plain words',
    toolkit: [
      ['Case brief', 'The CISO\'s question and what is known.'],
      ['Sources & reports', 'Read each report (five minutes each), then rate the source\'s reliability and how credible this particular report is. A reliable source can still say something doubtful.'],
      ['Fact or assumption', 'Every claim in the reports you have read. Mark each as a fact (confirmed by independent sources or our own data), an assessment (a reasoned inference), an assumption (no support) or a rumour (an unreliable source with no evidence).'],
      ['Indicator graph', 'Indicators from the reports you have read. Look them up (you have nine lookups), then link the ones that really belong together and say why. Coincidence and shared hosting are not links.'],
      ['Telemetry & updates', 'What our own systems saw and what sources have updated. It changes during the day.'],
      ['Intelligence brief', 'Your brief for the CISO: judgements with a confidence level, what to block, what to do, and a decision. Due by 15:00.'],
    ],
    briefPanel: {
      heading: 'Request: is this campaign aimed at us?',
      paragraphs: ['A peer has warned of a supplier-themed phishing campaign hitting freight firms. The CISO wants to know whether Contoso is a target, how worried to be, and what to block or hunt for.', 'Contoso Logistics moves freight for retail clients across the UK. Finance and procurement staff receive supplier invoices all day.'],
      known: ['Seven reports are waiting, from sources of very different quality.', 'Two lookalike emails have already been delivered to finance staff, according to our own email gateway.', 'You have nine lookups to spend on thirteen indicators.', 'The brief is due at 15:00. The decision meeting is at 15:30.'],
      asks: ['Rate each source and each report, and say what is fact and what is assumption.', 'Link the indicators that really belong together, and leave out the ones that do not.', 'Say how confident you are in each judgement, and no more confident than the evidence allows.', 'Recommend what to block, what to do and whether to raise the alert level.'],
    },
    tips: {
      brief: 'Read the request first. Your job is to help someone decide, not to collect everything.',
      sources: 'Read a report, then rate it. Reliability is about the source over time. Credibility is about this report: is it confirmed by others, plausible or doubtful?',
      claims: 'Only claims from reports you have read appear here. A fact needs independent confirmation or our own data. An inference is an assessment. A rumour is an unreliable source with no evidence.',
      graph: 'Click an indicator, look it up if it matters (it costs one of your nine lookups), then link it to another and say why. A link needs a reason you can show. Similar names and shared hosting are not enough.',
      logs: 'Our own telemetry and updates from the sources. Read them: a retraction or a new report may change your judgement.',
      assess: 'Include only what the evidence supports, say how confident you are, and do not block what would do harm. Late is the same as never.',
    },
    groupLabels: { triage: 'Sources and claims', evidence: 'Indicator links', report: 'The brief' },
  },
  entities: [],
  targets: {},
  actions: [],
  responses: [],
  defaults: {},
  events,
  alerts: [],
  roleLabels: {},
  roleHints: {},
  report: [],
  grading: { triage: 30, evidence: 25, response: 0, reportTotal: 45, harmScale: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'ti-blog',
      question: 'The researcher\'s blog is usually reliable, yet its claim that "all ten indicators belong to the campaign" was an assumption. How can both be true?',
      options: [
        { text: 'Reliability is about the source over time; credibility is about this particular claim. A good source can paste an unchecked list, and two entries were old or shared', correct: true, explain: 'Rating a source and rating a report are separate judgements. Checking an indicator yourself is how you decide which entries to keep.' },
        { text: 'Blogs are never reliable', correct: false, explain: 'This one is usually reliable. The mistake was a pasted list.' },
        { text: 'The researcher lied', correct: false, explain: 'Nothing suggests that. The list was not checked.' },
        { text: 'The claim was true and the lookups were wrong', correct: false, explain: 'The lookups showed an inert sinkholed domain and a shared hosting address.' },
      ],
    },
    {
      id: 'ti-conf',
      question: 'Why was "Group Heron may be responsible" included at low confidence while "the domains are one operation" went in at high confidence?',
      options: [
        { text: 'Linking the domains rests on checks you made yourself (the same registrant, certificate and address). Attribution rests on one vendor\'s hedged opinion, and the agency does not attribute at all', correct: true, explain: 'Confidence follows the quality and independence of the evidence. Attribution is rarely better than moderate, and a brief that overclaims costs the reader their trust.' },
        { text: 'Attribution is never worth including', correct: false, explain: 'It is worth including, with the confidence it deserves.' },
        { text: 'High confidence means we have the most sources', correct: false, explain: 'Quantity is not the point. Independence and checkable evidence are.' },
        { text: 'The vendor has no standing to attribute', correct: false, explain: 'The vendor can offer an assessment. It is just not strong enough to be stated as fact.' },
      ],
    },
  ],
  story: [
    '09:00 The CISO asks whether the Paper Trail campaign is aimed at Contoso. Seven reports have arrived from seven sources of very different quality.',
    'The core is solid: lookalike supplier domains, one registrant, one certificate, one hosting address, and a loader that steals browser credentials. Two of those emails already reached our finance staff, and nobody clicked.',
    'The noise is not: a sinkholed domain, a shared hosting address with 412 unrelated sites and a legitimate software vendor\'s update server all appear in feeds. Blocking them would do harm.',
    'The rumour that Contoso was breached came from an anonymous account. Our own telemetry shows no intrusion. Attribution to a named group was low confidence at best.',
    '12:30 The vendor retracts the sinkholed domain. 13:10 another member reports a real click and credential theft elsewhere. The right call was to block, hunt and warn, and not to declare an incident.',
  ],
};
