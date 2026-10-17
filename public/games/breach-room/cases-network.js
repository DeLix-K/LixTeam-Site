// Network Security Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges and private ranges (10.x). The .example
// domains are not real.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const NETWORK = [
  {
    id: 'dns-beacon',
    title: 'The quiet lookups',
    skill: 'data',
    blurb: 'Nothing was blocked and nothing alarmed. But one laptop made an odd number of DNS lookups, and 6 GB left the building.',
    brief: [
      'On Thursday a routine review of outbound traffic notices that 6 GB left the company over the previous four days, mostly through DNS. No antivirus alert fired and no firewall rule was broken, because DNS is allowed everywhere.',
      'You have evidence from email, the endpoint, the DNS resolver, network flow records and the web proxy. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a laptop, domain or address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'The way in', desc: 'How the malware got on the laptop.', story: 'A member of the sales team opened an attachment in an email that pretended to be an invoice. It ran a small program that did nothing visible, so the user noticed nothing.' },
      { id: 'c2', name: 'Calling home', desc: 'The malware contacts its controller.', story: 'The program contacted its operator through DNS, which is allowed out of almost every network. It asked for a long random-looking subdomain of a domain registered a week earlier, once every minute, and the answers carried back instructions.' },
      { id: 'discovery', name: 'Looking around', desc: 'Mapping the network from the inside.', story: 'On the operator\'s instructions the laptop scanned nearby networks for file shares and servers, and listed what it could reach.' },
      { id: 'exfil', name: 'Taking data', desc: 'Sending files out.', story: 'The operator had the laptop copy files from a shared drive, split them into small pieces, and send them out inside DNS queries, which is slow but rarely watched.' },
    ],
    cards: [
      { id: 'e1', source: 'Email', time: '09:12', stage: 'initial', text: 'Mia Chen (Sales) receives "Invoice 88213 - overdue" with an attachment named invoice.js.', indicators: ['SALES-LT14'], note: 'A script file posing as an invoice is a classic way in.', hint: 'How does something first get on a laptop?' },
      { id: 'e2', source: 'Endpoint', time: '09:14', stage: 'initial', text: 'SALES-LT14 runs invoice.js, which starts a hidden process and then closes.', indicators: ['SALES-LT14'], note: 'The attachment was run. The user would see nothing happen.', hint: 'The attachment is opened: what does it do?' },
      { id: 'e3', source: 'DNS', time: '09:17', stage: 'c2', text: 'SALES-LT14 asks for xk29fj3.update-sync.example, the first of 5,760 such lookups a day.', indicators: ['SALES-LT14', 'update-sync.example'], note: 'A first, long, random-looking name. Real services do not use names like this.', hint: 'The malware makes contact.' },
      { id: 'e4', source: 'DNS', time: '09:18', stage: 'c2', text: 'The same laptop repeats a new random subdomain of update-sync.example every 60 seconds. The domain was registered 8 days ago.', indicators: ['SALES-LT14', 'update-sync.example'], note: 'A steady beat to a brand-new domain. It looks like machine activity, not a person.', hint: 'Regular signals to a new domain.' },
      { id: 'n1', source: 'Endpoint', time: '09:30', text: 'Monthly operating system updates install on 12 laptops.', indicators: [], note: 'Routine patching on different machines.', hint: 'Does it share a laptop or domain with the attack?' },
      { id: 'n2', source: 'DNS', time: '10:00', text: 'The resolver sees 2.1 million lookups from 900 devices; top domains are the usual cloud and web services.', indicators: [], note: 'Ordinary background traffic, and the sort of volume that hides an odd one.', hint: 'Does it involve the laptop or the odd domain?' },
      { id: 'e5', source: 'Flows', time: '14:05', stage: 'discovery', text: 'SALES-LT14 connects to 380 addresses on 10.20.0.0/16 on tcp/445 within 6 minutes.', indicators: ['SALES-LT14', 'FILESRV02'], note: 'A sales laptop scanning for file shares is not normal.', hint: 'Looking around the network.' },
      { id: 'e6', source: 'Identity', time: '14:21', stage: 'discovery', text: 'SALES-LT14 lists the shares on FILESRV02 using Mia\'s account, including the finance share, which she has never opened.', indicators: ['SALES-LT14', 'FILESRV02'], note: 'The malware uses the user\'s rights to look at what is available.', hint: 'Using the account to see what is reachable.' },
      { id: 'n3', source: 'Proxy', time: '14:40', text: 'Mia browses the intranet and a news site.', indicators: [], note: 'The user doing normal work, unaware of the malware.', hint: 'Does it involve the odd domain or the file server?' },
      { id: 'e7', source: 'Endpoint', time: '22:10', stage: 'exfil', text: 'SALES-LT14 reads 1,900 files from \\\\FILESRV02\\Finance and writes them to a temporary archive.', indicators: ['SALES-LT14', 'FILESRV02'], note: 'Collecting the data at a quiet time.', hint: 'Gathering what they came for.' },
      { id: 'e8', source: 'DNS', time: '22:30', stage: 'exfil', text: 'From 22:30 for 3 days, SALES-LT14 sends 1.1 million DNS lookups to update-sync.example with long, encoded names. About 6 GB in total.', indicators: ['SALES-LT14', 'update-sync.example'], note: 'The data leaves in pieces hidden inside the names of DNS queries.', hint: 'The data goes out.' },
      { id: 'n4', source: 'Proxy', time: '23:15', text: 'Backup software uploads 12 GB to the usual offsite provider.', indicators: [], note: 'A large transfer, but to the usual provider at the usual time.', hint: 'Large and outbound. Is it to a destination you already trust?' },
    ],
    questions: [
      {
        id: 'detect', short: 'What gave it away', prompt: 'Which pattern in the DNS records showed this was not normal?',
        options: [
          { id: 'beat', correct: true, text: 'A single laptop asking for long random subdomains of one new domain, at regular intervals, thousands of times a day', explain: 'People and normal software do not make a request to a new domain every minute, with a new random name each time. Both the regularity and the random names are signs of automated command and control.' },
          { id: 'volume', correct: false, text: 'The total number of lookups the resolver handled', explain: 'Two million lookups a day was normal. The odd traffic was a small part of it, which is why it was missed.' },
          { id: 'cloud', correct: false, text: 'Lookups for well-known cloud services', explain: 'Those are normal and expected.' },
          { id: 'time', correct: false, text: 'Lookups happening during working hours', explain: 'Most normal traffic does. The beat continued around the clock, which is what stood out.' },
        ],
      },
      {
        id: 'why', short: 'Why DNS', prompt: 'Why did the attacker use DNS to carry the data out?',
        options: [
          { id: 'allowed', correct: true, text: 'DNS is allowed out of almost every network and is rarely inspected, so it passes without alarms', explain: 'Firewalls usually let DNS through because nothing works without it. That makes it a quiet channel for an attacker, though slow.' },
          { id: 'fast', correct: false, text: 'DNS is the fastest way to move large files', explain: 'It is slow. The attacker accepted the slow speed for the sake of staying unseen.' },
          { id: 'encrypted', correct: false, text: 'DNS traffic is always encrypted so it cannot be read', explain: 'Ordinary DNS is not encrypted. It simply is not usually examined.' },
          { id: 'rule', correct: false, text: 'The attacker broke a firewall rule to use it', explain: 'No rule was broken. DNS was allowed.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What is the best way to respond and stop it happening again?',
        options: [
          { id: 'full', correct: true, text: 'Isolate the laptop, block the domain at the DNS resolver, find any other devices that looked it up, and monitor DNS for long random names and regular beats', explain: 'Contain the infected machine, stop the channel, find who else is affected, and add detection for the technique.' },
          { id: 'wipe', correct: false, text: 'Reinstall the laptop and carry on', explain: 'It removes the malware but does not show what was taken, whether others are infected, or stop the channel.' },
          { id: 'blockdns', correct: false, text: 'Block DNS to the internet for everyone', explain: 'Nothing would work. Devices need DNS, so control it through your own resolver instead.' },
          { id: 'av', correct: false, text: 'Install more antivirus', explain: 'It might catch the script, but it would not find other devices or the data that has already left.' },
        ],
      },
    ],
    summary: 'The attacker moved data through the one channel that almost every network allows. Regular, long, random DNS lookups to a new domain are a clear pattern once you look for it, so watching DNS and forcing devices through your own resolver matters.',
  },
];
