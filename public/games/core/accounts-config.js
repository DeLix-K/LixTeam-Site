// Where ROOTLINE accounts live. Until `url` and `anonKey` are filled in, accounts are switched OFF everywhere on the site:
// the account and leaderboard pages say so, and nothing is sent anywhere.
//
// To switch accounts on (see docs/rootline-accounts-setup.md):
//   1. Create a DEDICATED Supabase project for ROOTLINE (not the one the FitNFree app uses) and run
//      supabase/rootline/001_accounts.sql and 002_missions.sql in it.
//   2. Put the project URL and its PUBLIC anon key below. The anon key is public by design; what it can do is
//      limited by the database rules. Never put a service-role or secret key in this file.
//   3. Add the same project URL to `connect-src` in vercel.json.
//   4. Set up whichever sign-in providers you want in the Supabase dashboard, then list them in `providers`.
//
// `providers` are the "Continue with ..." buttons shown. List only providers that are enabled in Supabase,
// otherwise the button leads to an error page.

export const ACCOUNTS = {
  url: '',
  anonKey: '',
  providers: [], // any of 'google', 'github', 'apple'
};
