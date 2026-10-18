// Senior Network Security Breach Room cases (see cases.js for the format). Everything here is fictional.
// IP addresses come from the reserved documentation ranges and private ranges.

const RATINGS = [
  { min: -999, name: 'Trail went cold', blurb: 'Too many guesses and missed connections. Go back through the evidence and the explanation below.' },
  { min: 140, name: 'Analyst', blurb: 'You rebuilt most of the attack. Pivoting on indicators and fewer wrong placements would tighten it up.' },
  { min: 215, name: 'Senior analyst', blurb: 'A confident reconstruction with sound root-cause thinking.' },
  { min: 255, name: 'Master investigator', blurb: 'Precise placements, evidence connected by pivoting, and the right conclusions on cause and prevention.' },
];

export const NETWORK_LEAD = [
  {
    id: 'edge-appliance',
    title: 'The gateway that let them in',
    skill: 'data',
    blurb: 'Files from the finance share have turned up on a leak site. Nothing was phished. Rebuild how someone got from the internet to a file server that was never meant to be reachable.',
    brief: [
      'On Thursday a journalist tells Contoso that documents from its finance share are being offered online. The finance team did not click anything suspicious, and no one reports losing a laptop.',
      'You have evidence from the remote access gateway, the firewall, the identity system, the file server and the network. Place each card in the right stage of the attack and spot the noise. Tap an indicator (a device, an account or an address) to see every card it appears in.',
    ],
    ratings: RATINGS,
    stages: [
      { id: 'initial', name: 'The front door', desc: 'How the attacker got a first foothold.', story: 'Contoso\'s remote access gateway had a known flaw for which the vendor had released a fix three weeks earlier. The fix had not yet been applied. The attacker used the flaw to run commands on the gateway itself.' },
      { id: 'foothold', name: 'Making it stick', desc: 'Keeping access to the gateway.', story: 'On the gateway, the attacker created their own administrator account and installed a small tool that gave them a lasting connection, so patching later would not remove them.' },
      { id: 'pivot', name: 'Looking inside', desc: 'Exploring the inside network from the gateway.', story: 'Remote access users and the gateway itself can reach every internal address. The attacker scanned the inside, found the finance file server and tried the accounts that remote users normally use.' },
      { id: 'abuse', name: 'Taking the files', desc: 'Collecting and sending out the data.', story: 'Using a stolen service account that had been reused on the gateway, the attacker opened the finance share, compressed the files and sent them out over an ordinary encrypted connection.' },
    ],
    cards: [
      { id: 'e1', source: 'Gateway', time: '02:14', stage: 'initial', text: 'A request to a gateway web page contains a long, malformed value. The gateway returns an error and then starts a process it does not normally run.', indicators: ['VPN-GW-1', '203.0.113.66'], note: 'The pattern of an attempt to run commands on a device through one of its own web pages. Devices that face the internet are targeted for exactly this reason.', hint: 'How does the attacker get a first foothold?' },
      { id: 'e2', source: 'Gateway', time: '02:21', stage: 'initial', text: 'The gateway\'s management log shows a command run as the web service account, from 203.0.113.66, which lists the files on the gateway.', indicators: ['VPN-GW-1', '203.0.113.66'], note: 'The attacker now has commands running on the device. The vendor\'s fix three weeks ago would have prevented this.', hint: 'The attacker begins to run commands.' },
      { id: 'n1', source: 'Firewall', time: '02:30', text: 'The firewall records 400 blocked connection attempts from various addresses to the guest wireless network.', indicators: [], note: 'Constant background noise from the internet, unrelated to the gateway or the finance server.', hint: 'Does it involve the gateway, the account or the address?' },
      { id: 'e3', source: 'Gateway', time: '02:40', stage: 'foothold', text: 'A new local administrator account "svc-update" is created on VPN-GW-1. It does not appear in the identity system.', indicators: ['VPN-GW-1', 'svc-update'], note: 'An account that exists only on the device will survive a password reset elsewhere and may not be noticed.', hint: 'A way back is created.' },
      { id: 'e4', source: 'Network', time: '02:44', stage: 'foothold', text: 'VPN-GW-1 opens a long-lived outbound connection to 203.0.113.66 on port 443 and keeps it open.', indicators: ['VPN-GW-1', '203.0.113.66'], note: 'A device that normally only accepts connections now holds one out to an unfamiliar address. This is how the attacker keeps their lasting access.', hint: 'The gateway starts to call out.' },
      { id: 'n2', source: 'Identity', time: '03:05', text: 'Routine nightly synchronisation of 14 staff accounts completes.', indicators: [], note: 'Normal housekeeping unrelated to the attack.', hint: 'Does it involve the gateway or the outside address?' },
      { id: 'e5', source: 'Firewall', time: '03:12', stage: 'pivot', text: 'VPN-GW-1 opens connections to 2,100 internal addresses in 20 minutes, mostly on ports 445 and 3389. Most are refused.', indicators: ['VPN-GW-1'], note: 'A device that normally forwards a few dozen connections suddenly looks at the whole inside network. This is an internal scan.', hint: 'The attacker maps the inside.' },
      { id: 'e6', source: 'File server', time: '03:34', stage: 'pivot', text: 'FIN-FS-01 records repeated failed sign-ins for "svc-backup" from VPN-GW-1\'s internal address, then one success.', indicators: ['FIN-FS-01', 'svc-backup', 'VPN-GW-1'], note: 'The attacker guessed or reused a service account on the finance server. It worked.', hint: 'The attacker gets onto the finance server.' },
      { id: 'n3', source: 'Network', time: '03:50', text: 'The nightly backup job copies 40 GB from FIN-FS-01 to the backup server.', indicators: ['FIN-FS-01'], note: 'The file server is involved but this is the routine backup, to the usual place.', hint: 'The server appears, but is this part of the chain?' },
      { id: 'e7', source: 'File server', time: '04:10', stage: 'abuse', text: 'svc-backup reads 9,400 files in the "Finance\\Reports" share, then creates a single 3.2 GB compressed archive.', indicators: ['FIN-FS-01', 'svc-backup'], note: 'Reading a large number of files and packing them into one archive is how data is prepared to be taken out.', hint: 'The attacker collects the files.' },
      { id: 'e8', source: 'Network', time: '04:32', stage: 'abuse', text: 'VPN-GW-1 sends 3.2 GB to 203.0.113.66 on port 443 over 18 minutes.', indicators: ['VPN-GW-1', '203.0.113.66'], note: 'The archive leaves through the gateway to the same outside address that started the attack.', hint: 'The data leaves.' },
      { id: 'n4', source: 'Gateway', time: '05:00', text: 'Eight staff members sign in to the remote access gateway from home.', indicators: [], note: 'Normal early-start staff using the gateway as they should.', hint: 'Does it involve the attacker\'s address or account?' },
    ],
    questions: [
      {
        id: 'cause', short: 'Root cause', prompt: 'What let an attacker get from the internet to the finance file server?',
        options: [
          { id: 'unpatched', correct: true, text: 'An internet-facing gateway with a known, fixable flaw, and an internal network that let the gateway reach every server', explain: 'The flaw gave the first foothold, and the lack of separation turned one device into access to the finance server.' },
          { id: 'phish', correct: false, text: 'A staff member was phished', explain: 'The chain begins with a request to the gateway. No email or sign-in by a person is involved.' },
          { id: 'insider', correct: false, text: 'A malicious insider', explain: 'The attacker came from an outside address and had no account until they created one.' },
          { id: 'cloud', correct: false, text: 'A weakness in the cloud provider', explain: 'The gateway and file server are Contoso\'s own.' },
        ],
      },
      {
        id: 'prevent', short: 'Best prevention', prompt: 'Which set of controls would have stopped the chain earliest and most reliably?',
        options: [
          { id: 'layers', correct: true, text: 'Apply the vendor\'s fix promptly to internet-facing devices, restrict what the gateway can reach on the inside, stop service accounts being reused across systems, and alert on unusual outbound connections from the gateway', explain: 'Each breaks a link. Patching stops the entry, restricting the gateway limits the spread, and unique service accounts and alerts limit the damage and speed up detection.' },
          { id: 'av', correct: false, text: 'Antivirus on the file server', explain: 'The attacker used legitimate administration steps.' },
          { id: 'training', correct: false, text: 'Staff training on phishing', explain: 'No staff member was involved in the first steps.' },
          { id: 'bigger', correct: false, text: 'A bigger firewall at the edge', explain: 'The attack used the gateway\'s own legitimate service, which the firewall allows.' },
        ],
      },
      {
        id: 'respond', short: 'Response', prompt: 'What should the response include beyond blocking the address?',
        options: [
          { id: 'full', correct: true, text: 'Take the gateway out of service and rebuild it from clean media after applying the fix, remove svc-update, replace svc-backup and every credential stored on the gateway, assess what was taken from the finance share, and tell the data protection officer', explain: 'The device cannot be trusted, the account and credentials are compromised, and personal or financial data may have been taken.' },
          { id: 'block', correct: false, text: 'Block 203.0.113.66 and carry on', explain: 'The attacker has an account on the device and can use another address.' },
          { id: 'patch', correct: false, text: 'Apply the vendor fix and carry on', explain: 'The fix does not remove an attacker who is already on the device.' },
          { id: 'wait', correct: false, text: 'Wait to see whether the files appear anywhere else', explain: 'The data is already out, and the legal clock is running.' },
        ],
      },
    ],
    summary: 'No one clicked anything. A fixable flaw in an internet-facing device and a network that trusted it gave an attacker a route from the internet to the finance share. Prompt patching, limits on what edge devices can reach, unique service accounts and alerts on odd outbound connections each break the chain.',
  },
];
