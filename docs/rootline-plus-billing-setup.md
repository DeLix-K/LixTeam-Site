# ROOTLINE Plus billing: how it works, how to set it up, and how to launch it

**Status: built and tested against stand-ins, switched off, not connected to a real Stripe account.** Nothing in this
document has been verified against real Stripe. Test mode first, always.

## What was decided

* **Scope:** billing only. No mission or feature is locked yet, and every current mission stays free for everyone.
  Plus unlocks content only once premium content exists. The site will not show an offer unless `BILLING.benefits` in
  `public/games/core/accounts-config.js` lists something real, so nothing can be advertised that does not exist.
* **Server code:** Supabase Edge Functions in the ROOTLINE project (`supabase/functions/`). The website stays static.
* **Provider:** Stripe Checkout and Billing, test mode first. Price: £5.99 per month in GBP, set up in Stripe, never in the browser.

## How it works

1. The player (signed in, with a nickname) clicks **UNLOCK ROOTLINE PLUS**. The browser calls `billing-checkout` with only its
   sign-in token. No price, amount or plan is sent.
2. `billing-checkout` checks who they are, creates (or reuses) a Stripe customer, and creates a Checkout Session for the one
   price in `STRIPE_PRICE_ID`. The player is sent only to Stripe's own page.
3. Stripe sends signed webhooks to `stripe-webhook`. Its signature is verified (HMAC-SHA256, 5-minute tolerance, constant-time
   comparison). Only then is `rl_billing_apply_event` called. Each event id is stored, so a repeat does nothing, and an older
   event cannot overwrite a newer one.
4. The database decides access (`rl_plus_state` in `003_billing.sql`). The success page grants nothing: it only shows
   "confirming" and then reads the real plan.
5. **Manage billing** opens the Stripe billing portal (card, invoices, cancel).

| Stripe says | ROOTLINE state | Plus access |
|---|---|---|
| never subscribed | free | no |
| `incomplete` | pending | no |
| `active` / `trialing` | active (or cancelling if it will not renew) | yes (until the paid period ends, if cancelling) |
| `past_due` | past_due | yes for up to 7 days after the period end, while Stripe retries |
| `canceled`, `unpaid`, `incomplete_expired`, `paused` | ended | no |

Safety net: an `active` plan whose paid-until date is more than 3 days old counts as ended, so a missed webhook cannot leave
Plus on for ever. Cancelling never touches the account, free access, achievements, leaderboard entry or saved progress.
Account deletion is refused while a paid plan is still running, so a deleted account cannot keep being billed.

## Files

| File | Purpose |
|---|---|
| `supabase/rootline/003_billing.sql` | Tables, access rules, and the service-only functions. Run after 001 and 002 |
| `supabase/functions/_shared/billing.js` | All the logic (signature check, checkout, portal), tested in Node |
| `supabase/functions/billing-checkout/`, `billing-portal/`, `stripe-webhook/` | Thin entry points (about 15 lines each) |
| `supabase/config.toml` | `stripe-webhook` runs without a Supabase sign-in token; the other two require one |
| `public/games/core/billing.js`, `plan-ui.js`, `levelup/plus.html` | The browser side. Dark behind `BILLING.enabled` |

## Environment variables (Supabase secrets, never in the repository or the browser)

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Test-mode secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | The signing secret of the webhook endpoint (`whsec_...`) |
| `STRIPE_PRICE_ID` | The id of the £5.99/month price (`price_...`) |
| `SITE_URL` | `https://lix-team-site.vercel.app` (also the only origin allowed to call the functions from a browser) |
| `ALLOW_LIVE_BILLING` | Leave unset. A live key (`sk_live_...`) is refused unless this is `yes` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions by Supabase itself.
Never paste the secret key, the webhook secret or the service-role key into a chat, a file in the site, or a commit.

## Setup, in test mode

1. **Stripe (test mode switch on):** Products, add **ROOTLINE Plus**, recurring price **£5.99 GBP monthly**. Copy the price id.
2. **Stripe, Billing > Customer portal:** enable it; allow cancelling subscriptions (at period end) and updating payment methods.
3. **Run the SQL** `003_billing.sql` in the ROOTLINE project (after 001 and 002).
4. **Supabase CLI** (install it, then `supabase login` and `supabase link --project-ref utbeawqwhrdawsstnyly`):
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_PRICE_ID=price_... SITE_URL=https://lix-team-site.vercel.app
   supabase functions deploy billing-checkout
   supabase functions deploy billing-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
5. **Stripe, Developers > Webhooks:** add endpoint `https://utbeawqwhrdawsstnyly.supabase.co/functions/v1/stripe-webhook`, events
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret, then `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`.
6. **Try it** with an account and Stripe's test card `4242 4242 4242 4242`: pay, cancel, fail a renewal, expire. Use the Stripe
   dashboard's test clocks to check renewal and expiry. Check **Developers > Webhooks > the endpoint** for delivery results.
7. To show the offer in a test build, set `BILLING.enabled: true` and list the real benefits in `accounts-config.js`.

## Before real money (launch checklist)

* There is real premium content, and `BILLING.benefits` lists exactly and only what exists.
* Terms of service, refund and cancellation policy, and the privacy notice cover subscriptions. Draft wording for the privacy
  notice is below. UK consumer law gives a 14-day cancellation right for digital services unless the buyer agrees to start
  immediately and acknowledges losing it: take advice and set Stripe's checkout consent text accordingly.
* VAT/tax is configured in Stripe (Stripe Tax or manual), and your Stripe business details are complete.
* The age rule is 16 and over, self-confirmed. Decide whether paying needs anything more.
* Use test clocks to see a renewal, a failed payment and an expiry end to end, and confirm the webhook shows 200s.
* Only then create live-mode versions of the product, price, webhook and secret, set `ALLOW_LIVE_BILLING=yes` with the live key,
  and check one real payment of your own, refunded afterwards.

### Draft privacy-notice wording (not published; review before use)

> **ROOTLINE Plus (optional paid plan).** If you subscribe, payment is handled by Stripe. We never see or store your card
> details. We keep a record of your plan (its status and renewal date) and a Stripe customer reference so we can give you
> access and let you manage billing. Stripe keeps billing records as the law requires. Legal basis: contract. If you stop paying, your
> account and progress stay. Deleting your account requires cancelling the plan first.

## What was tested, and what was not

Tested here (no real Stripe): 21 checks of the billing logic (signatures, replay, tampering, checkout parameters, live-key refusal,
redirect allow-list, caller identification, CORS); 17 checks of the billing SQL in a real in-process Postgres, driven by the real
webhook handler (access rules, duplicates, out-of-order events, cancellation, past-due, expiry, deleted players, deletion
blocking, lock-down); and a real-browser run through a stand-in Stripe covering offer, abandoned checkout, payment, forged
webhook, success page without payment, portal cancellation, account-deletion block, expiry and phone layout.

**Not tested:** real Stripe (Checkout, the portal, real webhook delivery and retries, the exact shape of live events), the Edge
Function entry files under real Deno (they are 15 lines each, and neither Deno nor the Supabase CLI is installed here), Supabase
function deployment and secrets, tax, the real consent screens, and any load.

## Limits to know about

* All mission content is static JavaScript served to everyone. A browser can read it. So "premium missions" cannot be truly
  protected by hiding buttons or by this entitlement check alone. Real protection needs premium content to be delivered by a
  function only after `rl_require_plus()` passes. Design that when premium content exists.
* Checkout attempts are limited to 10 an hour per player. Webhook processing is idempotent but is not otherwise rate limited
  (Stripe's signature is the control).
