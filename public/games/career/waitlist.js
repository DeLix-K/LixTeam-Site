// The waitlist for a possible paid plan: a demand test, not a purchase. It sends the email and up to two
// answers to the same narrow database function the other LixTeam waitlist pages use. The project URL and
// the anon key are public by design (they already ship inside the FitNFree web app); what the key can do is
// limited on the server to adding a waitlist row. Never put a secret key in this file.

const SUPABASE_URL = 'https://fuhvcclwsbltqvribpsq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aHZjY2x3c2JsdHF2cmlicHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzYwNTMsImV4cCI6MjEwMTM1MjA1M30.l6sKa4KXL0yvCtusmC0k1XPccYcIIM9V1pnCer521-c';
const LIST = 'cyber-career';

const $ = (id) => document.getElementById(id);
const form = $('waitlist-form');

if (form) {
  const status = $('waitlist-status');
  const done = $('waitlist-done');
  const button = form.querySelector('button[type="submit"]');

  // Which link brought them here (?src=linkedin, ?src=friend), reduced to what the database accepts.
  const src = (new URLSearchParams(location.search).get('src') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60) || null;
  // Answers are fixed slugs from the form, so they can be packed into one short string.
  const slug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);

  function showDone() {
    form.hidden = true;
    done.hidden = false;
  }
  function fail(text) {
    status.textContent = text;
    status.className = 'status error';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'status';
    const data = new FormData(form);

    // A filled-in honeypot means a bot: look successful and send nothing.
    if (String(data.get('website') || '').length > 0) return showDone();

    const email = String(data.get('email') || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Please enter a valid email address.');
    if (!data.get('consent')) return fail('Please tick the box to say you are happy to be emailed.');

    const parts = [slug(data.get('role')) && `role=${slug(data.get('role'))}`, slug(data.get('price')) && `price=${slug(data.get('price'))}`].filter(Boolean);
    const interest = parts.join('; ') || null;

    button.disabled = true;
    button.textContent = 'Joining...';
    try {
      // Signing up twice is a quiet no-op and the response is identical, so this cannot be used to
      // find out whether an address has already signed up.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_waitlist`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_list: LIST, p_email: email, p_interest: interest, p_source: src }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showDone();
    } catch {
      fail('Sorry, that did not work. Please try again, or email teamlix6@gmail.com.');
      button.disabled = false;
      button.textContent = 'Join the waitlist';
    }
  });
}
