// Social engineering logic for the service desk workspace: contacts that arrive over a shift, verification tools of
// different strength, decisions with consequences, and scoring. Pure functions: no page, no clock.
//
// Everything here is the defender's view. The player is the service desk agent who must decide whom to help. The
// lesson is that the strength of a check matters more than the number of checks: a call back to the number on file
// settles a question that a caller ID display or a correct answer to a "security question" cannot.

export const ACTIONS = [
  ['help', 'Do what they ask'],
  ['safe', 'Offer the standard safe route'],
  ['refuse', 'Politely decline'],
  ['escalate', 'Report it to Security'],
];
export const TOOLS = [
  ['directory', 'Look them up in the staff directory'],
  ['ticket', 'Check for a ticket or change record'],
  ['sender', 'Check the caller ID or the email header'],
  ['question', 'Ask a verification question'],
  ['manager', 'Ask their manager (by message)'],
  ['callback', 'Call back on the number held on file'],
];

export const newState = () => ({ used: {}, decisions: {}, harm: [], breaches: 0 });

export const arrived = (scn, st) => scn.se.contacts.filter((c) => c.at <= st.clock);
export const usedTools = (st, cid) => st.se.used[cid] || [];
export const toolOf = (c, id) => (c.tools || {})[id] || null;

// A check is "strong" if it reaches the real person through a channel the contact did not provide.
export const strongUsed = (c, st) => usedTools(st, c.id).some((t) => (c.strongTools || []).includes(t));
export const anyUsed = (st, cid) => usedTools(st, cid).length > 0;

export function decisionScore(c, d) {
  if (!d || d.action === 'left') return 0;
  if (c.good.includes(d.action)) return 1;
  if ((c.fine || []).includes(d.action)) return 0.5;
  return 0;
}

// Verification before a risky decision. A contact that did not need it earns the full share.
export function verifyShare(c, st) {
  if (!c.needsVerify) return 1;
  if (strongUsed(c, st)) return 1;
  return anyUsed(st, c.id) ? 0.35 : 0;
}

export const label = (list, id) => (list.find((x) => x[0] === id) || [])[1];
