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
  url: 'https://utbeawqwhrdawsstnyly.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0YmVhd3F3aHJkYXdzc3RueWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3Nzc5ODYsImV4cCI6MjEwODM1Mzk4Nn0.nPEBmVlp0o7zD6gQqyNoXAbIyPlc5gEylBW2-iQM-WM',
  providers: [], // add each one only after it is enabled in Supabase; any of 'google', 'github', 'apple'
};
