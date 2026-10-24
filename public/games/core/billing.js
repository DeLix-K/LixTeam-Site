// The browser side of ROOTLINE Plus. It can ask what the player's plan is, and ask the billing functions for a Stripe
// checkout or billing-portal address. It never sends a price, an amount or a plan: those live on the server, and access to
// Plus is decided by the database from what Stripe has confirmed, not by anything here.

import { ACCOUNTS, BILLING } from './accounts-config.js';
import { auth, AuthError } from './account.js';

// Billing shows up only when it is switched on AND something real is on offer.
export const billingOn = () => !!(ACCOUNTS.url && ACCOUNTS.anonKey && BILLING.enabled && BILLING.benefits.length);
export const offer = () => ({ price: BILLING.priceLabel, benefits: BILLING.benefits.slice() });

export const myPlan = () => auth.rpc('rl_my_plan');

async function call(name) {
  const token = await auth.accessToken();
  if (!token) throw new AuthError('not_signed_in');
  let res;
  try {
    res = await fetch(`${ACCOUNTS.url}/functions/v1/${name}`, {
      method: 'POST',
      headers: { apikey: ACCOUNTS.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    throw new AuthError('network');
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) throw new AuthError(body && /^[a-z_]{3,40}$/.test(body.error || '') ? body.error : 'billing_unavailable');
  return body;
}

// Only Stripe's own pages (or a host the site is explicitly configured to trust) are followed.
export function trustedUrl(u) {
  try {
    const x = new URL(u);
    return (x.protocol === 'https:' || x.hostname === 'localhost') && BILLING.allowedHosts.some((h) => x.host === h);
  } catch {
    return false;
  }
}

async function go(name) {
  const r = await call(name);
  if (!r || !trustedUrl(r.url)) throw new AuthError('billing_unavailable');
  location.assign(r.url);
}
export const startCheckout = () => go('billing-checkout');
export const openPortal = () => go('billing-portal');

// After coming back from Stripe the webhook may still be on its way: look a few times, then say so honestly.
export async function waitForPlus({ tries = 15, everyMs = 2000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  for (let i = 0; i < tries; i++) {
    const p = await myPlan();
    if (p.plus) return p;
    await sleep(everyMs);
  }
  return null;
}
