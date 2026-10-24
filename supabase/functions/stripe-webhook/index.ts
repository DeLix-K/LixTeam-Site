// Receives Stripe's signed webhooks and updates subscriptions. It is called by Stripe, not by a signed-in player, so it is
// deployed with --no-verify-jwt (see supabase/config.toml). The Stripe signature is the only thing that authorises a request.
// Logic is in ../_shared/billing.js.
import { handleWebhook, restDb } from '../_shared/billing.js';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('{"error":"method_not_allowed"}', { status: 405, headers: { 'Content-Type': 'application/json' } });
  const env = Deno.env.toObject();
  const rawBody = await req.text(); // the exact bytes Stripe signed
  const db = restDb({ url: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl: fetch });
  const r = await handleWebhook({ rawBody, signature: req.headers.get('stripe-signature') || '', env, db });
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
});
