# The security games (`public/games/`)

Static, dependency-free browser games: plain HTML, CSS and ES modules. No account, no tracking and no
server. Progress lives in the player's own browser (`localStorage`). The only thing that ever leaves the
browser is a waitlist sign-up, and only if the player chooses to send one.

```
public/games/
  index.html, hub.js        the hub (practice modes, career card)
  shared.css, skin.css      styling shared by every page / every mode
  core/                     career.js, missions.js (data), profile.js, mission-link.js, art.js, chrome.js
  career/                   the career campaign page, plus waitlist.js
  privacy/                  the privacy notice
  phish-or-legit/ ...       one folder per mode (game.js, engine.js, content, style.css)
tests/games/                engine and content tests (npm run test:games)
```

## What the player sees

The player first chooses a **career path**. Each path is its own ladder with its own ranks, XP, skills and promotion exams, and a player can try any of them at any time. The six on the chooser are Cyber Security Analyst, Security Engineer, Cloud Security, Network Security, Vulnerability Management and Ethical Hacking/PenTest. Paths with no missions yet are shown as "coming soon".

The analyst path has six ranks: Recruit, Junior Analyst, SOC Analyst, Senior Analyst, Incident Response Lead and SOC Manager. On every path, rank is **earned, not accumulated**: each promotion needs XP, missions passed, skill mastery and a promotion
exam. XP only rewards improving a medal, so easy missions cannot be ground. Skill mastery is shown separately
(a radar and bars). There is also a featured case each week,
a case history with case reports, a challenge code to compare a result with a friend, a downloadable summary,
and a progress code to move between devices by hand.

Ranks and scores are game progression. They are not qualifications and not validated assessments. The pages say so.

## Adding content (no engine changes needed)

1. **Add the case to its mode.** Each mode keeps its content in plain data files next to its engine:

   | Mode | Add to | Format notes |
   | --- | --- | --- |
   | Cyber Detective | `cyber-detective/cases-*.js` | artefacts of lines; each clue is on exactly one line; at least 4 strong clues and 6 non-clue lines |
   | The Breach Room | `breach-room/cases-*.js` | cards with `stage`, `indicators`, `time` (HH:MM); at least 4 stages, 3 noise cards, 4 sources |
   | Incident Commander | `incident-commander/incidents-*.js` | actions with `run(state)`; `bonuses`, `ratings`, two debrief questions |
   | Social Engineering | `social-engineering/scenarios.js` | a graph of nodes with `choices` and `end` |
   | Incident Simulation | `simulation/sims-*.js` | stages: `triage`, `evidence`, `prioritise`, `allocate`, `decision`, `review`, `report` |
   | Phish or Legit | `phish-or-legit/scenarios-*.js` | email, text, call or situation; scams need `flags`, genuine items need `why` |

   Then add the new file's export to that mode's aggregator (`cases.js`, `incidents.js`, `sims.js`, `scenarios.js`).

2. **Add a mission** in `core/missions.js`. A mission belongs to the path of its tier (`tier.path`, default analyst): `id`, `title`, `tier`, `kind`, `mode`, `ref` (the case id),
   `competencies` (weights that add up to 1), `par`, and `unlock`. Exams add `exam: true`, `promotes`, `passTier`.
   Ranks and their requirements are in the same file. Specialist titles are in `SPECIALISMS`.

3. **Adding a whole path** means: add its competencies and tiers (with `path: 'id'`), a ranks array, and fill in its entry in `PATHS` (`tiers`, `competencies`, `ranks`, `roadmap`). A path with missions appears on the chooser automatically. A `rank` requirement or a mission's `unlock.rank` is read inside its own path, and XP and mastery are counted per path.

4. **Run `npm run test:games`.** The tests fail if a mission points at a case that does not exist, if a case
   is malformed, if a perfect run is not top-rated, if guessing everything is not punished, or if the rank
   ladder can no longer be completed with silver medals alone.

The browser flows (a full campaign run through the real pages, the waitlist, the simulation resume) need
Puppeteer and are not in this repo yet.

## Rules the design keeps to

- No streaks and nothing that punishes a missed day. The hub's "daily missions done" count only ever goes up.
- No pay-to-win. `access: 'free' | 'plus'` on a mission records which tier it is meant for; nothing enforces it yet.
- If paid access is ever added, **rank and case history must never be locked or removed when a plan ends.**
  Only access to premium cases may end.
- Anything built from content (names, text, scenario data) is added with `textContent`, never parsed as HTML.
- No network calls from the games, apart from the waitlist form.

## What exists against the original brief

| Brief | Status |
| --- | --- |
| Five-level career ladder | Six ranks, Recruit to SOC Manager. Done |
| Rank by mastery and a practical exam, not XP alone | Done, with tests |
| Skill profile | Done (10 skills; cloud and leadership appear when relevant) |
| Case ratings, portfolio, case reports, replay and compare | Done; summary download added |
| Branching decisions | Done (decisions set flags that change later stages and the honest report) |
| Larger incident simulation, promotion assessments | Done (four exams) |
| Skill-based recommendation | Done (one recommended next case; cloud skill never overrides core skills) |
| Pause and resume | Done for the simulations (saved after each stage). Other modes are short and restart |
| Separate career paths (analyst, security engineer, cloud, network, vulnerability management, ethical hacking) | Chooser and per-path ladders built. Live: Analyst, Cloud, Vulnerability Management. Security Engineer, Network and PenTest are "coming soon". DFIR, GRC and threat intelligence are planned |
| New case every week | **Not met.** One existing case is featured each week. Real weekly drops need new writing |
| Friendly competition | Challenge codes only. Team leagues and public rankings need a server and accounts |
| Progress across devices | Manual progress code only. Accounts and sync are not built |
| Free and paid tiers, payments | Not built. A waitlist tests demand first (see `public/games/career/waitlist.js`) |
| Employer or team features | Not built |
| Name check | "Cyber Quest" is widely used for security training. Keep the name provisional |
