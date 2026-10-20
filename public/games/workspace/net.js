// Firewall and topology logic for the network workspaces. Pure functions: no page, no clock.
//
// A policy is an ordered list of rules plus a default. The first rule that matches a flow decides it.
// A rule's source and destination may be a host, an address, a zone or '*'. Zones are how the network is
// divided (guest, office, servers, cameras, public web, internet); every host belongs to one.

export const ANY = '*';

export const zoneOf = (scn, id) => {
  const e = scn.entities.find((x) => x.id === id);
  return e ? e.zone || 'INTERNET' : 'INTERNET';
};

const selMatches = (scn, sel, id) => sel === ANY || sel === id || sel === zoneOf(scn, id);

export function ruleMatches(scn, rule, flow) {
  return selMatches(scn, rule.src, flow.src) && selMatches(scn, rule.dst, flow.dst) && (rule.port === ANY || Number(rule.port) === Number(flow.port)) && (rule.proto === ANY || rule.proto === flow.proto);
}

// -> { action: 'allow' | 'deny', rule, index }  (rule is null when the default applied)
export function decide(scn, policy, flow) {
  for (let i = 0; i < policy.rules.length; i++) if (ruleMatches(scn, policy.rules[i], flow)) return { action: policy.rules[i].action, rule: policy.rules[i], index: i };
  return { action: policy.def, rule: null, index: -1 };
}

export const initialPolicy = (scn) => ({ def: scn.net.def, rules: scn.net.rules.map((r) => ({ ...r })) });
export const clonePolicy = (p) => ({ def: p.def, rules: p.rules.map((r) => ({ ...r })) });

// The policy in force at a given minute. History is in time order; the first entry covers all of the past.
export function policyAt(st, t) {
  let cur = st.fw.history[0].policy;
  for (const h of st.fw.history) if (h.at <= t) cur = h.policy;
  return cur;
}
export const currentPolicy = (st) => st.fw.history[st.fw.history.length - 1].policy;

// Does the policy let this service's traffic through?
export const serviceStatus = (scn, policy) => scn.net.services.map((s) => ({ ...s, ok: decide(scn, policy, s.flow).action === 'allow' }));
export const brokenWeight = (scn, policy) => serviceStatus(scn, policy).reduce((n, s) => n + (s.ok ? 0 : s.weight), 0);
export const threatStatus = (scn, policy) => scn.net.threats.map((th) => ({ ...th, blocked: th.flows.every((f) => decide(scn, policy, f).action === 'deny') }));

// The hops a connection takes. Inside one zone it stays on that zone's switch; between zones it crosses the firewall.
export function pathOf(scn, flow) {
  const sz = zoneOf(scn, flow.src);
  const dz = zoneOf(scn, flow.dst);
  const hops = [{ id: flow.src, kind: 'host', zone: sz }, { id: `SW-${sz}`, kind: 'switch', zone: sz }];
  if (sz !== dz) hops.push({ id: scn.net.fw, kind: 'fw' }, { id: `SW-${dz}`, kind: 'switch', zone: dz });
  hops.push({ id: flow.dst, kind: 'host', zone: dz });
  return hops;
}

export const describeSel = (scn, sel) => {
  if (sel === ANY) return 'Anything';
  const z = (scn.net.zones || []).find((x) => x.id === sel);
  if (z) return `${z.label} (zone)`;
  return sel;
};

// Validate a rule typed by the player.
export function checkRule(scn, r) {
  const known = (s) => s === ANY || (scn.net.zones || []).some((z) => z.id === s) || scn.entities.some((e) => e.id === s);
  if (!['allow', 'deny'].includes(r.action)) return 'Choose allow or deny.';
  if (!known(r.src) || !known(r.dst)) return 'Choose where the traffic comes from and goes to.';
  if (r.port !== ANY && !(Number.isInteger(Number(r.port)) && Number(r.port) >= 1 && Number(r.port) <= 65535)) return 'The port must be a number from 1 to 65535, or any.';
  if (!['*', 'tcp', 'udp'].includes(r.proto)) return 'Choose tcp, udp or any.';
  return null;
}

export const ruleText = (scn, r) => `${r.action === 'allow' ? 'Allow' : 'Deny'} ${describeSel(scn, r.src)} to ${describeSel(scn, r.dst)}, ${r.port === ANY ? 'any port' : 'port ' + r.port}, ${r.proto === ANY ? 'any protocol' : r.proto}`;
