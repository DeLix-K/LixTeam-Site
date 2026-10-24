// The ROOTLINE Plus panel: the offer for a free player, the status for a subscriber. Shared by the account page and the Plus
// page. Built with textContent only. It says only what the database says the player's plan is.

import { offer, startCheckout, openPortal } from './billing.js';
import { messageFor } from './sync.js';
import { AuthError } from './auth.js';

const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return n;
};
const day = (iso) => (iso ? new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const codeOf = (e) => (e instanceof AuthError ? e.code : 'unknown');

function action(button, fn, note) {
  button.addEventListener('click', async () => {
    button.disabled = true;
    note.textContent = '';
    note.className = 'ac-status';
    try {
      await fn();
    } catch (e) {
      note.textContent = messageFor(codeOf(e));
      note.className = 'ac-status bad';
      button.disabled = false;
    }
  });
}

// plan: what rl_my_plan returned. onContinue: what "Continue free" does (optional).
export function planPanel(plan, { onContinue } = {}) {
  const note = el('p', { class: 'ac-status', role: 'status' });
  const box = el('section', { class: 'ac-sec ac-plan', id: 'ac-plan' }, el('h2', { text: 'ROOTLINE Plus' }));

  if (plan.state === 'active' || plan.state === 'cancelling' || plan.state === 'past_due') {
    const head = plan.state === 'active' ? 'ROOTLINE Plus is active' : plan.state === 'cancelling' ? 'ROOTLINE Plus: not renewing' : 'ROOTLINE Plus: payment problem';
    const line = plan.state === 'active' ? `Your plan renews on ${day(plan.current_period_end)}.` : plan.state === 'cancelling' ? `You keep Plus until ${day(plan.current_period_end)}. It will not renew. Your progress and free access stay either way.` : 'Your last payment did not go through. Update your card in Manage billing to keep Plus. Your progress is safe either way.';
    const manage = el('button', { class: 'btn', type: 'button', id: 'ac-manage' }, 'Manage billing');
    action(manage, openPortal, note);
    box.append(el('p', { class: 'ac-plan-state', 'data-state': plan.state, text: head }), el('p', { class: 'ac-fine', text: line }), el('div', { class: 'btn-row' }, manage), note);
    return box;
  }

  const o = offer();
  if (plan.state === 'pending') box.append(el('p', { class: 'ac-fine', text: 'We have not had confirmation of a payment yet. If you have just paid, this can take a minute. Plus turns on once your payment is confirmed.' }));
  box.append(
    el('p', { class: 'ac-plan-state', text: `ROOTLINE Plus: ${o.price}` }),
    el('p', { class: 'ac-fine', text: 'Ready for your next investigation? ROOTLINE Plus gives you:' }),
    el('ul', { class: 'ac-why' }, ...o.benefits.map((b) => el('li', { text: b })))
  );
  const buy = el('button', { class: 'btn primary big', type: 'button', id: 'ac-unlock' }, 'UNLOCK ROOTLINE PLUS');
  action(buy, startCheckout, note);
  const keep = el('button', { class: 'btn big', type: 'button', id: 'ac-continue-free' }, 'CONTINUE FREE');
  keep.addEventListener('click', () => (onContinue ? onContinue() : (location.href = '/games/levelup/')));
  box.append(el('div', { class: 'btn-row' }, buy, keep), note, el('p', { class: 'ac-fine', text: `You can cancel any time from Manage billing. You pay on Stripe's secure page, and your progress is never deleted if you stop paying. Nothing is charged until you confirm there.` }));
  return box;
}
