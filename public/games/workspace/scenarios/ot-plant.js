// OT/IoT Security workspace, assignment 1: "The plant behind the office".
// Everything here is fictional: the utility, the plant, the devices and every result. Defensive judgement only: nothing in
// this file describes how to attack a control system. The skill is architecture and trade-offs.
//
// The shape of the day (kept here so the tests and the debrief can both use it):
//   Contoso Water treats and pumps drinking water. Its plant network, the systems that run pumps and chlorine dosing,
//   sits behind the office network, and over the years five routes into it have grown: a vendor remote desktop forwarded
//   from the internet, a new cellular sensor gateway with its default login, a published operator screen, a historian that
//   office PCs query directly and a remote-desktop rule that lets any office PC reach the SCADA server. Each one is an
//   exposure path. Each is closed by a control from the change board, and the obvious controls break something the plant
//   needs: the operations manager's rule is that nothing may stop the plant.
//   Changes that touch the control network can only go in during a maintenance window (12:00 to 13:00 and 17:00 to 18:00),
//   or as an emergency that trips a process. Attackers use the open paths at 14:30, 15:15, 15:45, 16:30 and 16:50 unless
//   they have been closed by then. The legacy pump controller cannot be patched: it is protected by keeping it out of reach.

const m = (h, mi = 0) => h * 60 + mi;

const zones = [
  { id: 'INTERNET', label: 'The internet', y: 1, h: 16 },
  { id: 'CORP', label: 'Corporate IT', y: 19, h: 15 },
  { id: 'DMZ', label: 'DMZ (between IT and the plant)', y: 36, h: 15 },
  { id: 'CTRL', label: 'Plant control network', y: 53, h: 22 },
  { id: 'FIELD', label: 'Field devices', y: 77, h: 21 },
];

const A = (id, name, zone, kind, o = {}) => ({ id, name, zone, kind, ...o });
const assets = [
  A('vendor', 'Sensor vendor support', 'INTERNET', 'external', { x: 16, y: 9, facts: ['The company that supplies and supports the sensor gateway and the SCADA software.', 'Connects remotely a few times a month.'] }),
  A('oncall', 'On-call manager\'s laptop', 'INTERNET', 'external', { x: 50, y: 9, facts: ['The on-call manager checks plant status from home at night.'] }),
  A('public', 'Anyone on the internet', 'INTERNET', 'external', { x: 84, y: 9, facts: ['Scanners find every reachable service within hours.'] }),
  A('office-pc', 'Office PCs', 'CORP', 'workstation', { x: 28, y: 27, facts: ['Standard managed laptops. Assume at least one will be compromised one day.'] }),
  A('hist-mirror', 'Historian copy (DMZ)', 'DMZ', 'server', { x: 66, y: 44, hidden: true, facts: ['A reporting copy of the historian that office PCs can read.'] }),
  A('jump', 'Remote access jump host', 'DMZ', 'server', { x: 34, y: 44, hidden: true, facts: ['A hardened host that requires a second factor and logs every session.'] }),
  A('scada', 'SCADA server', 'CTRL', 'server', { x: 50, y: 62, age: 6, patch: true, stops: 'Operators lose their screens and automatic control. The plant can be run by hand for a short time.', facts: ['Sends commands to the field controllers and collects their readings.'] }),
  A('hmi', 'Operator screens (HMI)', 'CTRL', 'workstation', { x: 24, y: 62, age: 4, patch: true, stops: 'Operators lose their screens in the control room.', facts: ['The control room screens. A web view of them was published for the on-call manager.'] }),
  A('historian', 'Data historian', 'CTRL', 'server', { x: 76, y: 62, age: 6, patch: true, stops: 'Trend history and the regulator\'s daily report stop. The plant itself keeps running.', facts: ['Stores every reading for trends and the regulator\'s daily report.', 'Office PCs query it directly.'] }),
  A('eng-ws', 'Plant engineering workstation', 'CTRL', 'workstation', { x: 38, y: 71, age: 5, patch: true, stops: 'Engineers cannot reprogram or maintain the controllers. The plant keeps running.', facts: ['Used by engineers and, remotely, by the vendor.'] }),
  A('plc-pump', 'Pump station controller', 'FIELD', 'controller', { x: 22, y: 90, critical: true, age: 15, patch: false, stops: 'The pump station stops: water supply to a third of customers is interrupted.', facts: ['Installed in 2011. The manufacturer ended support in 2016, so no patch exists.'] }),
  A('plc-chem', 'Chlorine dosing controller', 'FIELD', 'controller', { x: 46, y: 90, critical: true, age: 9, patch: true, stops: 'Chlorine dosing stops or goes wrong: a drinking-water safety issue.', facts: ['Doses chlorine into the treated water. Operators have alarms on its readings.'] }),
  A('plc-filter', 'Filter controller', 'FIELD', 'controller', { x: 68, y: 90, critical: true, age: 7, patch: true, stops: 'Filtration stops. Water quality alarms trip within the hour.', facts: ['Controls backwashing and flow through the filter beds.'] }),
  A('sensor-gw', 'Sensor gateway (new, cellular)', 'FIELD', 'gateway', { x: 88, y: 83, age: 0, patch: true, stops: 'The new remote sensors stop reporting. Nothing else depends on them yet.', facts: ['Installed last week by the vendor. It has a cellular modem for remote support, and its admin page still uses the default login.'] }),
];

const L = (id, a, b, label, both = false, o = {}) => ({ id, a, b, label, both, guarded: false, ...o });
const links = [
  L('L1', 'vendor', 'eng-ws', 'Vendor remote desktop, forwarded from the internet', false),
  L('L2', 'eng-ws', 'plc-chem', 'Engineering access to the chlorine controller'),
  L('L3', 'eng-ws', 'plc-pump', 'Engineering access to the pump controller'),
  L('L4', 'eng-ws', 'plc-filter', 'Engineering access to the filter controller'),
  L('L5', 'scada', 'plc-chem', 'Control commands to the chlorine controller'),
  L('L6', 'scada', 'plc-pump', 'Control commands to the pump controller'),
  L('L7', 'scada', 'plc-filter', 'Control commands to the filter controller'),
  L('L8', 'hmi', 'scada', 'Operator screens to SCADA'),
  L('L9', 'scada', 'historian', 'Process data to the historian (two-way)', true),
  L('L10', 'office-pc', 'historian', 'Office PCs query the historian directly'),
  L('L11', 'sensor-gw', 'scada', 'Sensor data to SCADA (the whole vendor protocol, both ways)', true),
  L('L12', 'vendor', 'sensor-gw', 'Cellular remote admin on the sensor gateway'),
  L('L13', 'oncall', 'hmi', 'Operator screens published to the internet'),
  L('L14', 'office-pc', 'scada', 'Remote desktop from any office PC to the SCADA server'),
];

const J = (id, a, b, label) => L(id, a, b, label, false, { guarded: true });
const controls = [
  {
    id: 'jump-vendor', label: 'A jump host with a second factor for vendor access', cost: 14, minutes: 30, window: false,
    text: 'Put a hardened jump host in the DMZ. The vendor signs in to it with a second factor, it logs the session, and it is the only thing that can reach the engineering workstation. The forwarded remote desktop goes away.',
    impact: { safety: 'None: the plant is not touched.', availability: 'Vendor support carries on through the jump host.' },
    effect: { addAssets: [assets.find((a) => a.id === 'jump')], remove: ['L1'], add: [J('J1', 'vendor', 'jump', 'Vendor to the jump host (second factor)'), J('J2', 'jump', 'eng-ws', 'Jump host to the engineering workstation')] },
  },
  {
    id: 'cell-off', label: 'Turn off the gateway\'s cellular remote admin', cost: 1, minutes: 10, window: false,
    text: 'Switch the remote admin service off on the sensor gateway. Nobody outside can reach its admin page any more.',
    impact: { safety: 'None.', availability: 'The vendor can no longer update or support the gateway remotely.' },
    effect: { remove: ['L12'] },
  },
  {
    id: 'jump-gw', label: 'Route the gateway\'s remote admin through the jump host', cost: 4, minutes: 15, window: false, needs: ['jump-vendor'],
    text: 'The vendor reaches the gateway only through the jump host. The direct cellular admin goes away.',
    impact: { safety: 'None.', availability: 'Vendor support of the gateway carries on through the jump host.' },
    effect: { remove: ['L12'], add: [J('J3', 'jump', 'sensor-gw', 'Jump host to the sensor gateway')] },
  },
  {
    id: 'fw-sensor', label: 'An industrial firewall between the gateway and SCADA: sensor data only', cost: 8, minutes: 40, window: true,
    text: 'Put an industrial firewall inline on the gateway\'s link that allows only the sensor data protocol. Anything else the gateway sends is dropped.',
    impact: { safety: 'It is fitted in the control network: the link is cut for a few minutes, so it needs a maintenance window.', availability: 'Sensor data carries on.' },
    effect: { guard: ['L11'] },
  },
  {
    id: 'hmi-off', label: 'Take the operator screens off the internet', cost: 0.5, minutes: 10, window: false,
    text: 'Stop publishing the HMI web view. Nobody outside can reach it.',
    impact: { safety: 'None.', availability: 'The on-call manager can no longer check the plant from home.' },
    effect: { remove: ['L13'] },
  },
  {
    id: 'dash', label: 'A read-only dashboard from the DMZ copy for the on-call manager', cost: 4, minutes: 20, window: false, needs: ['replica'],
    text: 'Publish a read-only dashboard from the historian copy in the DMZ. The on-call manager signs in with a second factor. The real operator screens are no longer published.',
    impact: { safety: 'None: the dashboard has no way to send commands.', availability: 'The on-call manager can still see the plant.' },
    effect: { remove: ['L13'], add: [J('L17', 'oncall', 'hist-mirror', 'On-call manager to the dashboard (second factor)')] },
  },
  {
    id: 'replica', label: 'A copy of the historian in the DMZ for office reporting', cost: 10, minutes: 40, window: false,
    text: 'The historian pushes a copy of its data to a server in the DMZ. Office PCs read their reports from the copy, and no longer reach the historian itself.',
    impact: { safety: 'None: the historian only sends data out.', availability: 'The daily regulator report carries on, read from the copy.' },
    effect: { addAssets: [assets.find((a) => a.id === 'hist-mirror')], remove: ['L10'], add: [L('L15', 'historian', 'hist-mirror', 'Historian pushes a copy to the DMZ'), L('L16', 'office-pc', 'hist-mirror', 'Office PCs read reports from the copy')] },
  },
  {
    id: 'oneway', label: 'A one-way gateway from SCADA to the historian', cost: 9, minutes: 45, window: true,
    text: 'A one-way gateway lets process data flow from SCADA to the historian and nothing flow back. Whatever reaches the historian can no longer go on to SCADA.',
    impact: { safety: 'It is fitted inline in the control network, so it needs a maintenance window.', availability: 'Process data and reports carry on.' },
    effect: { oneway: ['L9'] },
  },
  {
    id: 'jump-admin', label: 'Move IT admin access to SCADA behind the jump host', cost: 3, minutes: 15, window: false, needs: ['jump-vendor'],
    text: 'IT administrators reach the SCADA server only through the jump host. The direct remote desktop from office PCs goes away.',
    impact: { safety: 'None.', availability: 'IT can still administer the SCADA server.' },
    effect: { remove: ['L14'], add: [J('J4', 'office-pc', 'jump', 'IT admins to the jump host'), J('J5', 'jump', 'scada', 'Jump host to the SCADA server')] },
  },
  {
    id: 'block-admin', label: 'Block office PCs from the SCADA server', cost: 0.5, minutes: 10, window: false,
    text: 'Remove the rule that lets office PCs reach the SCADA server.',
    impact: { safety: 'None.', availability: 'IT can no longer administer the SCADA server from the office.' },
    effect: { remove: ['L14'] },
  },
  {
    id: 'tap-edge', label: 'A monitoring tap on the internet edge', cost: 5, minutes: 20, window: false, monitors: 'edge',
    text: 'A passive tap copies everything crossing the plant\'s internet edge to a monitoring system. It cannot block or change anything.',
    impact: { safety: 'None: it only listens.', availability: 'No effect.' },
    effect: {},
  },
  {
    id: 'tap-inner', label: 'A monitoring tap on the control network boundary', cost: 11, minutes: 30, window: false, monitors: 'inner',
    text: 'A passive tap on the boundary of the control network. It shows every new device and every command from an unexpected place.',
    impact: { safety: 'None: it only listens.', availability: 'No effect.' },
    effect: {},
  },
  {
    id: 'block-all', label: 'Block everything between the corporate network and the plant', cost: 3, minutes: 20, window: true, trip: 10,
    text: 'Cut every link from the internet and the office into the plant. Nothing can get in.',
    impact: { safety: 'It touches the plant boundary, so it needs a maintenance window.', availability: 'Everything that uses those links stops: vendor support, reporting, the on-call view, IT administration.' },
    effect: { remove: ['L1', 'L10', 'L12', 'L13', 'L14'] },
  },
  {
    id: 'patch-pump', label: 'Patch the pump controller\'s firmware', cost: 2, minutes: 20, window: true, trip: 10,
    text: 'Apply the latest firmware to the pump station controller.',
    impact: { safety: 'A firmware change restarts the controller and stops the pump station while it happens.', availability: 'No patch exists for this model: support ended in 2016.' },
    effect: {},
    result: 'There is no patch to apply: the manufacturer ended support for this model in 2016. Nothing changed, and the time was wasted. A controller that cannot be patched is protected by keeping it out of reach and watching what talks to it.',
  },
];

const T = (id, label, entry, source, points, why) => ({ id, label, entry, source, points, why });
const threats = [
  T('T1', 'the vendor remote desktop reachable from the internet', 'L1', 'INTERNET', 7, 'A remote desktop on the engineering workstation, open to the internet, leads straight to every controller. Put it behind a jump host with a second factor.'),
  T('T2', 'the new sensor gateway\'s cellular admin with its default login', 'L12', 'INTERNET', 7, 'Anyone on the internet could sign in to the gateway and use its link to SCADA. Close the admin service, route it through the jump host, or limit what the gateway can say to SCADA.'),
  T('T3', 'the operator screens published to the internet', 'L13', 'INTERNET', 7, 'The control room screens are visible to anyone who finds them. Take them off the internet, or publish a read-only copy instead.'),
  T('T4', 'office PCs reaching the historian, and through it SCADA', 'L10', 'office-pc', 7, 'Assume an office PC will be compromised. It must not be able to reach the historian directly, or the historian must not be able to reach SCADA.'),
  T('T5', 'any office PC reaching the SCADA server by remote desktop', 'L14', 'office-pc', 7, 'Any office PC could connect to the server that commands every controller. IT administration belongs behind the jump host.'),
];

const op = (id, label, weight, routes, note) => ({ id, label, weight, routes, note });
const ops = [
  op('O1', 'SCADA commanding the three controllers', 8, [['L5', 'L6', 'L7']], 'The plant loses automatic control.'),
  op('O2', 'Process data reaching the historian', 4, [['L9']], 'Trends and the regulator\'s report stop being recorded.'),
  op('O3', 'The daily regulator report', 5, [['L10'], ['L15', 'L16']], 'The regulator\'s daily report cannot be produced.'),
  op('O4', 'Operators using their screens', 6, [['L8']], 'The control room loses its screens.'),
  op('O5', 'Vendor support of the SCADA system', 4, [['L1'], ['J1', 'J2']], 'The vendor cannot support the SCADA system.'),
  op('O6', 'The new sensors reporting to SCADA', 3, [['L11']], 'The new remote sensors stop reporting.'),
  op('O7', 'Vendor support of the sensor gateway', 3, [['L12'], ['J1', 'J3']], 'The vendor cannot update or support the new gateway.'),
  op('O8', 'The on-call manager seeing the plant', 3, [['L13'], ['L15', 'L17']], 'The on-call manager cannot check the plant from home.'),
  op('O9', 'IT administering the SCADA server', 3, [['L14'], ['J4', 'J5']], 'IT cannot administer the SCADA server.'),
  op('O10', 'Engineers maintaining the controllers', 3, [['L2', 'L3', 'L4']], 'Engineers cannot maintain the controllers.'),
];

// ── The events ──────────────────────────────────────────────────
const hostIds = new Set(assets.map((x) => x.id));
function fl(id, t, src, dst, port, proto, o = {}) {
  const sz = (assets.find((x) => x.id === src) || {}).zone || 'INTERNET';
  const dz = (assets.find((x) => x.id === dst) || {}).zone || 'INTERNET';
  const { fields = {}, summary, ...rest } = o;
  return { id, t, type: 'flow', host: hostIds.has(dst) ? dst : src, sev: 'info', summary: summary || `${src} to ${dst}:${port}/${proto}`, fields: { src, dst, port, proto, szone: sz, dzone: dz, ...fields }, ...rest };
}

const found = [
  { id: 'e-brief', t: m(8, 0), type: 'note', sev: 'info', summary: 'Operations manager: nothing may stop the plant today. Changes to the control network wait for a maintenance window (12:00 to 13:00 or 17:00 to 18:00), unless it is an emergency', fields: { from: 'operations manager' } },
  { id: 'e-vendor', t: m(8, 20), type: 'note', sev: 'info', summary: 'Vendor: we installed the new cellular sensor gateway last week. Please keep it reachable for remote support. It reports to the SCADA server', fields: { from: 'sensor vendor' } },
  { id: 'e-it', t: m(8, 40), type: 'note', sev: 'info', summary: 'IT: our administrators use remote desktop from the office to reach the SCADA server when something needs a restart', fields: { from: 'IT service desk' } },
  { id: 'e-reg', t: m(9, 0), type: 'note', sev: 'info', summary: 'Compliance: the regulator\'s daily report is produced from the historian. It must not be late', fields: { from: 'compliance' } },
  { id: 'e-oncall', t: m(9, 10), type: 'note', sev: 'info', summary: 'Operations manager: the on-call manager uses the web view of the operator screens from home at night. Keep that working if you can', fields: { from: 'operations manager' } },
  { id: 'e-pump', t: m(9, 30), type: 'note', sev: 'info', summary: 'Maintenance: the pump station controller dates from 2011, and the manufacturer stopped supporting it in 2016. It still works well and nobody wants to replace it this year', fields: { from: 'maintenance' } },
  { id: 'e-scan-vendor', t: m(9, 40), type: 'monitor', host: 'eng-ws', sev: 'high', key: 'exposed', summary: 'External scan: remote desktop on the plant engineering workstation is reachable from the internet (a port forward on the plant firewall)', fields: { src: 'public', dst: 'eng-ws', port: 3389, proto: 'tcp', szone: 'INTERNET', dzone: 'CTRL', result: 'open' } },
  { id: 'e-scan-hmi', t: m(10, 50), type: 'monitor', host: 'hmi', sev: 'medium', key: 'hmi', summary: 'External scan: the operator screens web page is reachable from the internet', fields: { src: 'public', dst: 'hmi', port: 443, proto: 'tcp', szone: 'INTERNET', dzone: 'CTRL', result: 'open' } },
  { id: 'e-newdev', t: m(10, 15), type: 'device', host: 'sensor-gw', sev: 'medium', key: 'gateway', summary: 'New device on the field network: sensor-gw, a cellular modem. Its admin page still accepts the manufacturer\'s default login', fields: { zone: 'FIELD', modem: 'cellular', login: 'manufacturer default' } },
  { id: 'e-corp-rdp', t: m(11, 30), type: 'flow', host: 'scada', sev: 'medium', key: 'corp', summary: 'An office PC opened remote desktop to the SCADA server. The plant firewall allows any office PC to do so', fields: { src: 'office-pc', dst: 'scada', port: 3389, proto: 'tcp', szone: 'CORP', dzone: 'CTRL', result: 'allowed' } },
];

const aftermath = [
  { id: 'e-t1', t: m(14, 30), type: 'incident', host: 'eng-ws', sev: 'high', unlessClosed: 'T1', summary: 'An unauthorised remote session on the engineering workstation changed the chlorine dosing setpoint. Operators caught it on the alarm and reverted it', fields: { source: 'incident' }, consequence: { cost: 12, label: 'An outsider changed the chlorine dosing through the vendor remote desktop', prevented: 'the vendor remote desktop was closed to the internet in time', text: 'The remote desktop was open to the whole internet and led straight to the controllers. A drinking-water safety alarm was the only thing between the plant and a bad dose.' } },
  { id: 'e-t2', t: m(15, 15), type: 'incident', host: 'sensor-gw', sev: 'high', unlessClosed: 'T2', summary: 'Someone signed in to the new sensor gateway with its default login and sent false readings to SCADA. Operators noticed the mismatch', fields: { source: 'incident' }, consequence: { cost: 8, label: 'The new sensor gateway was taken over and fed false readings to SCADA', prevented: 'the gateway could not be reached or could not say anything but sensor data', text: 'A cellular modem with the default login is on the internet for anyone to find, and it had a direct, unrestricted link to SCADA.' } },
  { id: 'e-t3', t: m(15, 45), type: 'incident', host: 'hmi', sev: 'medium', unlessClosed: 'T3', summary: 'A stranger viewed the live operator screens through the published web page for forty minutes before an operator noticed', fields: { source: 'incident' }, consequence: { cost: 6, label: 'The operator screens were watched by a stranger', prevented: 'the operator screens were taken off the internet in time', text: 'Anyone who found the published page could watch the plant. It was a lucky catch that they only watched.' } },
  { id: 'e-t4', t: m(16, 30), type: 'incident', host: 'historian', sev: 'high', unlessClosed: 'T4', summary: 'A compromised office PC reached the historian directly, and from the historian reached the SCADA network', fields: { source: 'incident' }, consequence: { cost: 10, label: 'An office compromise reached the plant control network through the historian', prevented: 'the historian could not be used as a way from the office into the plant', text: 'Office PCs reached the historian directly, and the historian could reach SCADA. An infection in the office became a problem in the plant.' } },
  { id: 'e-t5', t: m(16, 50), type: 'incident', host: 'scada', sev: 'high', unlessClosed: 'T5', summary: 'A compromised office PC connected to the SCADA server by remote desktop, using a stolen administrator password', fields: { source: 'incident' }, consequence: { cost: 10, label: 'An office PC reached the SCADA server', prevented: 'office PCs could no longer reach the SCADA server', text: 'Any office PC could reach the server that commands every controller. A stolen password was all it took.' } },
];

const noise = [];
for (let t = m(8, 10), i = 0; t <= m(17, 50); t += 30, i++) {
  for (const p of ['plc-chem', 'plc-pump', 'plc-filter']) noise.push(fl(`s-poll-${p}-${t}`, t, 'scada', p, 502, 'tcp', { summary: `scada polled ${p} (control traffic, normal)`, fields: { bytes_out: 220, bytes_in: 340, packets: 6 } }));
  noise.push(fl(`s-hist-${t}`, t + 5, 'scada', 'historian', 4840, 'tcp', { summary: 'scada sent process data to historian (normal)', fields: { bytes_out: 52000, bytes_in: 1200, packets: 70 } }));
}
noise.push(fl('s-report', m(8, 30), 'office-pc', 'historian', 1433, 'tcp', { sev: 'low', summary: 'office-pc queried the historian for the regulator\'s daily report (4,100 rows, normal)', fields: { bytes_out: 800, bytes_in: 612000, packets: 540 } }));
noise.push(fl('s-hmi-restart', m(9, 20), 'hmi', 'scada', 443, 'tcp', { sev: 'low', summary: 'hmi restarted its display service and reconnected to scada (scheduled)', fields: { bytes_out: 900, bytes_in: 4000, packets: 12 } }));
noise.push(fl('s-fw-query', m(12, 20), 'eng-ws', 'plc-pump', 502, 'tcp', { sev: 'low', summary: 'eng-ws read the firmware version from the pump controller (engineers\' routine inventory)', fields: { bytes_out: 90, bytes_in: 140, packets: 2 } }));
noise.push(fl('s-sensor', m(10, 20), 'sensor-gw', 'scada', 4840, 'tcp', { summary: 'sensor-gw sent sensor readings to scada (normal)', fields: { bytes_out: 6000, bytes_in: 400, packets: 9 } }));
for (let t = m(10, 25); t <= m(17, 55); t += 30) noise.push(fl(`s-sensor-${t}`, t, 'sensor-gw', 'scada', 4840, 'tcp', { summary: 'sensor-gw sent sensor readings to scada (normal)', fields: { bytes_out: 6000, bytes_in: 400, packets: 9 } }));
for (let t = m(8, 30); t <= m(17, 50); t += 47) noise.push(fl(`s-scanner-${t}`, t, 'public', 'eng-ws', 3389, 'tcp', { summary: 'A background scanner knocked on the plant firewall (reached the remote desktop forward)', fields: { bytes_out: 60, bytes_in: 0, packets: 1, flags: 'SYN' } }));

const events = [...found, ...noise, ...aftermath];

const entities = assets.map((a) => ({ id: a.id, kind: 'host', zone: a.zone, name: a.name, role: a.kind, facts: [...a.facts, ...(a.age !== undefined ? [`Age: ${a.age} years. ${a.patch ? 'Can be patched.' : 'Cannot be patched.'}`] : []), ...(a.stops ? [`If it stops: ${a.stops}`] : [])], x: a.x, y: a.y }));

const targets = { contact: ['Operations manager', 'Control room shift lead', 'Sensor vendor', 'Everyone at the plant'] };
const actions = [{ id: 'notify', label: 'Tell', targetKind: 'contact', cost: 2, group: 'Tell people' }];
const responses = [
  { action: 'notify', target: 'Operations manager', good: true, points: 3, label: 'Tell the operations manager', why: 'The plant owner decides what may change and when. Telling them your plan is how you keep the plant running.', text: 'The operations manager agrees the plan and the maintenance window, and asks to be told before anything touches the control network.' },
  { action: 'notify', target: 'Control room shift lead', good: true, points: 3, label: 'Tell the control room shift lead', why: 'Operators watch the plant minute by minute. They need to know when something may blip, and what to do if it does.', text: 'The shift lead notes the planned changes and will have an operator watching the screens.' },
  { action: 'notify', target: 'Sensor vendor', good: false, points: 0, label: 'Tell the vendor', text: 'The vendor acknowledges and asks when remote access will be back.' },
  { action: 'notify', target: 'Everyone at the plant', good: false, points: 0, label: 'Email everyone at the plant', harm: 2, text: 'A plant-wide email about "security problems in the control system" goes out and causes worry and rumours on every shift.' },
];

export const OT_PLANT = {
  id: 'ot-plant',
  title: 'The plant behind the office',
  workspace: 'ot',
  path: 'network',
  pathLabel: 'OT/IoT Security',
  blurb: 'A water plant\'s control network has five routes in from the office and the internet, a pump controller that cannot be patched and an operations manager who says nothing may stop the plant. Close the paths with the right controls, in the right window, without breaking operations.',
  brief: [
    'It is 08:00 at Contoso Water. The plant treats and pumps drinking water. Its control systems sit behind the office network, and over the years a vendor remote desktop, a new cellular sensor gateway, published operator screens and some old office shortcuts have grown into routes an attacker could use. You are the security lead.',
    'Everything you can do is a change on the change board. Each shows what it closes and what it would break before you apply it. Changes to the control network wait for a maintenance window (12:00 to 13:00 or 17:00 to 18:00), because doing them live can trip a process. You have £45k. Attackers will use whatever is still open from 14:30.',
  ],
  clockStart: m(8, 0),
  horizon: m(18, 0),
  ot: {
    zones, assets, links, controls, threats, ops,
    budget: 45,
    windows: [[m(12, 0), m(13, 0)], [m(17, 0), m(18, 0)]],
    points: { monitor: 4 },
    reference: ['jump-vendor', 'jump-gw', 'replica', 'dash', 'jump-admin', 'tap-edge'],
  },
  ui: {
    name: 'Contoso Water security console',
    nav: ['brief', 'plant', 'inventory', 'logs', 'board', 'respond', 'case', 'report'],
    labels: { plant: 'Plant map', inventory: 'Asset inventory', logs: 'Traffic', board: 'Change board', respond: 'Tell people' },
    examples: ['type:monitor', 'type:device', 'host:eng-ws', 'port:3389', 'zone:INTERNET', 'type:flow sev:medium'],
    searchHint: 'host:eng-ws   port:3389   zone:INTERNET   type:monitor   sev:high   or plain words',
    toolkit: [
      ['Case brief', 'Your instructions and what is known.'],
      ['Plant map', 'The zones, the devices and every link between them. Red routes are open exposure paths from the internet or the office to a safety-critical controller.'],
      ['Asset inventory', 'Each device: age, whether it can be patched, and what happens if it stops.'],
      ['Traffic', 'What the monitoring sees. Search by host, port, zone or plain words. Pin what proves each path is real.'],
      ['Change board', 'The controls you can apply. Each shows what it closes, what it would break, what it costs and whether it needs a maintenance window.'],
      ['Tell people', 'Tell the operations manager and the control room before you change the control network.'],
    ],
    briefPanel: {
      heading: 'Task: close the routes into the plant',
      paragraphs: ['A review of the plant network found five routes in from the internet or the office. Each leads, by one way or another, to the controllers that dose chlorine, filter water and run the pumps.', 'The operations manager\'s rule is that nothing may stop the plant. A control that closes a path but breaks something the plant needs is not a win.'],
      known: ['The plant has three safety-critical controllers. The pump controller dates from 2011 and cannot be patched.', 'Changes to the control network can only go in during a maintenance window: 12:00 to 13:00 or 17:00 to 18:00.', 'The budget is £45k.', 'The attackers use whatever is still open from 14:30.'],
      asks: ['Close every exposure path with the cheapest control that does not break operations.', 'Put control-network changes in the right window.', 'Watch the plant boundary so the next problem is seen.', 'Write up what you did and why, for the operations manager.'],
    },
    tips: {
      brief: 'Read the task first. In a plant, safety and availability come before everything else, and the operations manager is your partner.',
      plant: 'Select a device or a red route. Each exposure path ends at a safety-critical controller. Look at which links it uses: closing the first one is not always the best place.',
      inventory: 'Age and patchability explain why some devices cannot be fixed by updating them. What happens if a device stops tells you how careful to be.',
      logs: 'The monitoring feed. Pin the events that show a route is really reachable.',
      board: 'Preview a control before you apply it. Some break things the plant needs. Controls that go inside the control network need a maintenance window: schedule them, or lose the day.',
      respond: 'Tell the people who run the plant before you change it. A plant-wide email does harm.',
      case: 'Your evidence timeline, in time order.',
      report: 'Your report is judged on whether you closed the paths without breaking the plant, and on whether you can say why.',
    },
    groupLabels: { evidence: 'Evidence pinned', response: 'Paths closed and operations kept' },
  },
  entities,
  targets,
  actions,
  responses,
  defaults: { notify: { text: 'Done.' } },
  events,
  alerts: [],
  roleLabels: {
    exposed: 'the remote desktop reachable from the internet',
    gateway: 'the new gateway with its default login',
    hmi: 'the operator screens reachable from the internet',
    corp: 'office PCs reaching the SCADA server',
  },
  roleHints: {
    exposed: 'Search type:monitor or host:eng-ws.',
    gateway: 'Search type:device.',
    hmi: 'Search host:hmi or type:monitor.',
    corp: 'Search port:3389 zone:CORP.',
  },
  report: [
    { id: 'worst', kind: 'choice', title: 'Most dangerous', label: 'Which route was the most dangerous?', options: [['vendor-rdp', 'The vendor remote desktop open to the internet'], ['gateway', 'The sensor gateway with its default login'], ['hmi', 'The published operator screens'], ['historian', 'Office PCs reaching the historian'], ['corp-rdp', 'Office PCs reaching the SCADA server']], truth: 'vendor-rdp', points: 5, note: 'A remote desktop open to the whole internet, on a workstation with direct links to every controller, was the shortest road from a stranger to a safety event.' },
    { id: 'legacy', kind: 'choice', title: 'The pump controller', label: 'The pump controller is 15 years old and cannot be patched. What do you do?', options: [['isolate', 'Keep it out of reach: only SCADA and the engineering workstation may talk to it, and watch what does'], ['patch-live', 'Patch it during the day'], ['replace', 'Replace it today'], ['ignore', 'Accept the risk and do nothing']], truth: 'isolate', points: 6, note: 'An unpatchable device is protected by segmentation and monitoring, not by patching. Replacing it is a project, not a Tuesday.' },
    { id: 'windows', kind: 'set', title: 'Maintenance window', label: 'Which controls could only go in during a maintenance window?', options: [['fw-sensor', 'An industrial firewall between the gateway and SCADA'], ['oneway', 'A one-way gateway from SCADA to the historian'], ['block-all', 'Blocking everything between the office and the plant'], ['jump', 'A jump host in the DMZ'], ['replica', 'A copy of the historian in the DMZ'], ['tap', 'A passive monitoring tap']], truth: ['fw-sensor', 'oneway', 'block-all'], points: 6, note: 'Anything fitted inline in the control network, or at its boundary, interrupts it briefly. Things in the DMZ and passive taps do not touch the plant.' },
    { id: 'broke', kind: 'set', title: 'What would break', label: 'Which of these would have broken something the plant needs?', options: [['cell-off', 'Turning off the gateway\'s remote admin'], ['hmi-off', 'Taking the operator screens off the internet'], ['block-admin', 'Blocking office PCs from the SCADA server'], ['block-all', 'Blocking everything between the office and the plant'], ['jump-vendor', 'A jump host for vendor access'], ['tap', 'A monitoring tap']], truth: ['cell-off', 'hmi-off', 'block-admin', 'block-all'], points: 6, note: 'The four cheap fixes each take something away: vendor support, the on-call view, IT administration, or all of them. The jump host and the tap break nothing.' },
    { id: 'first', kind: 'choice', title: 'What comes first', label: 'In a plant, what comes first?', options: [['safety', 'Safety and keeping the plant running'], ['confidentiality', 'Keeping data confidential'], ['cost', 'The cheapest fix'], ['speed', 'Closing everything as fast as possible']], truth: 'safety', points: 4, note: 'In a plant the order is safety, availability, then confidentiality: the opposite of an office.' },
    { id: 'owner', kind: 'choice', title: 'Who agrees', label: 'Who has to agree to a change on live control systems?', options: [['ops', 'The operations manager and the control room: they own the plant'], ['security', 'Only the security team'], ['vendor', 'Only the vendor'], ['nobody', 'Nobody, if it is urgent']], truth: 'ops', points: 4, note: 'The people who run the plant decide when it can be touched. Security advises and does the work.' },
    { id: 'summary', kind: 'text', title: 'Summary', label: 'Summary for the operations manager', minLength: 40, points: 4, placeholder: 'What you changed and why, what you put in which window, what you left alone and what the plant should do next.' },
  ],
  grading: { triage: 0, evidence: 20, response: 45, reportTotal: 35, harmScale: 1.5, cap: 'The plant was reached through a route you had not closed, or a change you made tripped a process. A good plan afterwards does not undo that.', capAt: 1, gold: 85, silver: 65, bronze: 45 },
  debrief: [
    {
      id: 'ot-first',
      question: 'The cheapest way to close the on-call manager\'s route was to take the operator screens off the internet. Why might the operations manager prefer the read-only dashboard?',
      options: [
        { text: 'It keeps the on-call manager able to check the plant from home, and it gives them a view that cannot send commands', correct: true, explain: 'A fix that removes a feature the plant uses gets pushed back. A fix that keeps the feature and removes the danger gets accepted.' },
        { text: 'It is always cheaper', correct: false, explain: 'It costs more: £4k plus the copy it depends on.' },
        { text: 'The operator screens cannot be taken off the internet', correct: false, explain: 'They can, which is the cheap option.' },
        { text: 'Dashboards are more secure than operator screens in every way', correct: false, explain: 'It is read-only, which is the point: it cannot be used to send a command.' },
      ],
    },
    {
      id: 'ot-legacy',
      question: 'The pump controller cannot be patched. Why is that not a reason to leave it exposed?',
      options: [
        { text: 'Its risk can be reduced without touching it: control who can reach it, keep office and internet routes away from it, and watch the traffic', correct: true, explain: 'Segmentation and monitoring are how legacy devices are protected. The device does not need to change.' },
        { text: 'Old devices are not attractive to attackers', correct: false, explain: 'They are attractive because they have known weaknesses and no fix.' },
        { text: 'It is protected because it is old', correct: false, explain: 'Age is not a protection.' },
        { text: 'It will be replaced soon anyway', correct: false, explain: 'Until it is, it is exposed. Plan the replacement, but protect it now.' },
      ],
    },
  ],
  story: [
    '08:00 Contoso Water runs a plant whose control network has grown five routes in: a vendor remote desktop forwarded from the internet, a new cellular gateway with its default login, published operator screens, a historian office PCs query directly and a remote desktop from any office PC to the SCADA server.',
    '12:00 to 13:00 is the first maintenance window. Controls that go inside the control network, or at its boundary, have to wait for it, or trip a process if forced.',
    '14:30 the vendor remote desktop is used to change the chlorine dosing setpoint. 15:15 the sensor gateway is taken over and feeds false readings. 15:45 a stranger watches the operator screens. 16:30 an office compromise crosses the historian. 16:50 an office PC reaches SCADA. Each happens only if its route was still open.',
    'The cheap fixes work but take something from the plant: vendor support, the on-call view, IT administration. The good fixes keep the feature and remove the danger, but cost more than the budget lets you do twice.',
    'The pump controller cannot be patched. The answer is to keep it out of reach and to watch what talks to it.',
  ],
};
