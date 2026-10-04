// Public values only -- the same project URL and anon key that already ship
// inside the FitNFree web app. The anon key is designed to be public: what it
// can do is limited by Row-Level Security, and on waitlist_signups that is
// INSERT only (see FitNFree repo: supabase/waitlist_signups.sql). Never put a
// service-role or secret key in this site.
export const SUPABASE_URL = "https://fuhvcclwsbltqvribpsq.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aHZjY2x3c2JsdHF2cmlicHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzYwNTMsImV4cCI6MjEwMTM1MjA1M30.l6sKa4KXL0yvCtusmC0k1XPccYcIIM9V1pnCer521-c";
