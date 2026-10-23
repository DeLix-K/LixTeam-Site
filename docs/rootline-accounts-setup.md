# ROOTLINE accounts and leaderboard: setup and review

Accounts are **switched off** in the code until you do the steps below. With `accounts-config.js` empty, the Account and
Leaderboard links are hidden, the two pages say "not switched on yet", and nothing is sent anywhere.

## What was built

| Piece | Where |
|---|---|
| Database: tables, row-level security, functions | `supabase/rootline/001_accounts.sql` |
| Mission reward table (generated from the game) | `supabase/rootline/002_missions.sql` (`node tools/gen-rl-missions.mjs`) |
| Sign-in client (email + password, Google, GitHub, Apple; PKCE) | `public/games/core/auth.js` |
| Browser wiring, sync of progress | `public/games/core/account.js`, `core/sync.js`, `core/account-nav.js` |
| Account page | `public/games/levelup/account.html`, `account.js` |
| Leaderboard page | `public/games/levelup/leaderboard.html`, `leaderboard.js` |
| Where the project lives (empty = off) | `public/games/core/accounts-config.js` |
| Privacy notice (updated draft) | `public/games/privacy/index.html` |

## Decisions you made, and how they are implemented

* **Sign-in:** email and password, plus Google, GitHub and Apple.
* **Leaderboard identity:** a nickname the player chooses (3 to 20 letters, numbers, `.` `-` `_`). Unique ignoring case,
  checked against a block-list (look-alikes and separators are normalised), changeable once a week, with a Report button.
  Email and real name are never returned by any public function. Players can also hide themselves.
* **Age:** "I am 16 or older" is required before an account is created (email sign-up), and again at the nickname step for
  anyone who signed in with a provider. It is **self-confirmed**: nothing verifies it.
* **Anti-cheat ("self-reported with limits"):** the browser sends only its best medal per mission. The server ignores
  unknown missions, accepts only medals 1 to 3, never lowers a medal, and works out the XP itself from `rl_missions`.
  After the one-off first sync (an import of progress the player already had) it allows at most 15 improvements per rolling
  hour and 3000 XP per rolling 24 hours (the rest waits and is accepted later), and one sync per 15 seconds. The board says
  "Self-reported". You can hide a player or delete their results (operator notes at the end of `001_accounts.sql`).

**Honest limit:** a determined person can still invent a profile, because the first sync is unlimited and nothing proves a
mission was played. These rules stop casual tampering and stop scores growing unrealistically fast. They are not proof.

## Before you switch it on: things only you can do

### 1. Use a dedicated Supabase project (strongly recommended)

The project the waitlist uses (`fuhvcclwsbltqvribpsq`) is shared with the FitNFree app. Accounts there would be the **same
logins** as FitNFree's, provider settings and redirect lists would affect FitNFree sign-in, and "delete my account" could
delete a FitNFree login. Create a separate free project for ROOTLINE instead. The code supports either, but the delete
function only removes the login itself when you set `allow_auth_user_delete` to `true`, which you should do only in the
dedicated project.

### 2. Review and run the SQL (in the dedicated project's SQL editor)

1. Read `supabase/rootline/001_accounts.sql`. Edit the starter block-list (`rl_blocked_terms`) to suit.
2. Run `001_accounts.sql`, then `002_missions.sql`. Both can be run again safely.
3. To let "delete my account" remove the login too (dedicated project only):
   `update public.rl_config set value = 'true' where key = 'allow_auth_user_delete';`

### 3. Authentication settings (Supabase dashboard)

* **Authentication > URL configuration:** Site URL `https://lix-team-site.vercel.app`; add Redirect URL
  `https://lix-team-site.vercel.app/games/levelup/account.html` (and a `http://localhost:...` one for testing).
* **Providers > Email:** leave "Confirm email" **on** (otherwise anyone can register an address that is not theirs).
  Set minimum password length to **10** or more. Turn on leaked-password protection if your plan has it.
* **Email sending:** Supabase's built-in sender is heavily rate-limited and meant for testing. Set up custom SMTP before
  real use, or confirmation and reset emails will not arrive reliably.
* **Bot protection:** consider enabling CAPTCHA protection for sign-up. It is not built into this client yet (it needs a
  CSP change and a token in the sign-up request).
* **Google:** create an OAuth client in Google Cloud (Web application); authorised redirect URI is the callback shown on
  Supabase's Google provider page. Paste the client ID and secret into Supabase.
* **GitHub:** create an OAuth App; callback URL is shown on Supabase's GitHub provider page.
* **Apple:** needs your Apple Developer account: an App ID with Sign in with Apple, a Services ID (the web client ID), a key,
  and the return URL from Supabase. Supabase needs a client secret **generated from that key, and it expires after at most 6
  months**, so put a reminder in your calendar or Apple sign-in will silently stop working.
* Enable only the providers you have actually set up, then list them in `providers` (next step).

### 4. Switch it on in the code

1. Edit `public/games/core/accounts-config.js`: project URL, the **anon (public)** key, and `providers`. Never use the
   service-role key. `npm run test:games` fails if the key is not an anon-role key.
2. Add the project URL to `connect-src` in `vercel.json` (the test fails if it is missing). Keep the old host only if the
   waitlist still needs it, which it does.
3. Review the updated privacy notice (`public/games/privacy/index.html`) and correct anything that is not true for your setup.

### 5. Check it, then ship it

Sign up with a real email, confirm, choose a nickname, pass a mission, check the board; try each provider you enabled; reset
a password; download your data; delete the account. Then check the board from a signed-out browser.

## What was tested, and what was not

Tested here:
* the SQL (run twice, then 20 checks against a real in-process Postgres: table lockdown, nickname rules, XP and rate limits,
  board contents, hiding, reports, export, deletion);
* the sign-in client against a stand-in service (PKCE, refresh, errors, no password storage);
* the whole flow in a real browser against a stand-in Supabase **whose database functions are the real SQL**: sign-up,
  confirmation link, nickname rules, Google-style sign-in, board, report, nickname change, hiding, export, sign-out, password
  reset, deletion, expired-token refresh, phone layout.

**Not tested** (needs your project and accounts): real Supabase Auth behaviour and its email delivery, the real Google,
GitHub and Apple consent screens, Supabase's own rate limits, Row-Level Security under Supabase's exact role setup, behaviour
in Safari and on real phones, other-tab sign-out, and any load beyond a handful of players. The leaderboard query computes
totals on the fly, which is fine for hundreds or a few thousand players. At larger scale it should keep running totals.

## Running the SQL test

The SQL test needs PGlite, which is deliberately not a dependency of the site:

```
npm install --no-save @electric-sql/pglite
node tests/games/accounts-sql.test.mjs
```

Without it, the test says it was skipped and `npm run test:games` still passes.
