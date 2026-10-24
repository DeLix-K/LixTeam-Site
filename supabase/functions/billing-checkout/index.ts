// Starts a Stripe Checkout session for ROOTLINE Plus for the signed-in player. All the logic is in ../_shared/billing.js.
import { authenticate, corsHeaders, createCheckout, restDb } from '../_shared/billing.js';

Deno.serve(async (req: Request) => {
  const env = Deno.env.toObject();
  const cors = corsHeaders(req.headers.get('origin') || '', env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response('{"error":"method_not_allowed"}', { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  const user = await authenticate(req.headers.get('authorization'), env, fetch);
  const db = restDb({ url: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl: fetch });
  const r = await createCheckout({ user, env, db, fetchImpl: fetch });
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
});
