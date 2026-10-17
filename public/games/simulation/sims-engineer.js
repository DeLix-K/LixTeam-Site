// Security Engineer simulations. Everything here is fictional. IP addresses come from the reserved
// documentation ranges (203.0.113.0/24, 198.51.100.0/24).
//
// The path is about building security in rather than reacting to it: hardening systems to an agreed
// baseline, keeping secrets and access under control, and securing the pipelines that build and ship
// code. The decisions are mostly about sequencing and trade-offs: what to fix first, how to roll it out
// without breaking the business, and how to tell whether it stayed fixed.

const RATINGS = [
  { name: 'Bolted on', blurb: 'Security was added late, unevenly or by policy alone. Read each stage note: engineering is about making the secure way the easy way, and checking it stays that way.' },
  { name: 'Hardening', blurb: 'You closed real gaps, with gaps in priorities, evidence or how you rolled changes out.' },
  { name: 'Security engineer', blurb: 'Sound priorities, safe rollouts, automation instead of promises, and honest reporting.' },
  { name: 'Security architect', blurb: 'Well-judged priorities and designs, changes that stick, and reporting leadership can act on.' },
];

export const ENGINEER = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 'hardening-baseline',
    title: 'The server nobody hardened',
    skill: 'data',
    minutes: 18,
    blurb: 'A new web server is about to go live with its default settings. Decide what to harden first, check what is really wrong, and plan a rollout that will not break the applications.',
    brief: [
      'Contoso is about to put a new web server into production, and the build team has used the vendor\'s default settings. A hardening baseline exists on paper, but nobody has applied it. The launch is on Friday.',
      'You are the security engineer on the project. You will rank what to fix first, check the server\'s actual configuration against the baseline, decide how to apply the baseline to the 40 servers already running without breaking the applications on them, and review a colleague\'s draft of the hardening standard.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the hardening gaps',
        intro: 'Tap the gaps in order, the one to fix first. Think about how likely it is to be used against the server, how bad the result would be, and how quick it is to fix.',
        items: [
          { id: 'h1', source: 'Remote access', priority: 1, text: 'Remote administration is open to the whole network with password sign-in, the root account can log in directly and a default admin account is still enabled.', why: 'The most direct way for an attacker to take full control, and quick to close.' },
          { id: 'h2', source: 'Services', priority: 2, text: 'Several services nobody needs (an old file-transfer service and a legacy remote shell) are running and listening for connections.', why: 'Every running service is a possible way in. Switching off what is not needed removes risk at no cost.' },
          { id: 'h3', source: 'Logging', priority: 3, text: 'Logs stay only on the server for three days and are not sent anywhere else.', why: 'It will not stop an attack, but without logs you will not know that one happened or what the attacker did.' },
          { id: 'h4', source: 'Software', priority: 4, text: 'A compiler and several development tools are installed on a production server.', why: 'Unneeded tools make an attacker\'s job easier after a break-in, so they should go, but this is less urgent than closing the ways in.' },
          { id: 'h5', source: 'Banner', priority: 5, text: 'There is no legal warning banner on the sign-in screen.', why: 'A policy and legal nicety with no direct security effect. Do it when convenient.' },
        ],
      },
      {
        id: 'config', type: 'evidence', title: 'Check the real configuration against the baseline',
        intro: 'The build team says the server is "basically hardened". Compare what is actually set with what the baseline requires. Flag only what the records support.',
        clues: {
          sshroot: { strength: 'strong', text: 'The remote administration service allows password sign-in and direct root login.' },
          defaultacct: { strength: 'strong', text: 'A default admin account with the vendor\'s well-known password is still enabled.' },
          ftp: { strength: 'strong', text: 'An old file-transfer service is listening on all network interfaces.' },
          audit: { strength: 'strong', text: 'Auditing is switched off, so administrative actions are not recorded.' },
          banner: { strength: 'weak', text: 'The sign-in warning banner required by the baseline is missing.' },
        },
        artefacts: [
          {
            id: 'access', title: 'Access and account settings',
            lines: [
              { id: 'c1', type: 'clue', clue: 'sshroot', text: 'sshd_config: PasswordAuthentication yes; PermitRootLogin yes; AllowUsers (not set)', note: 'Anyone who can reach the service can try passwords against the most powerful account. The baseline requires keys, no root login and a list of allowed users.' },
              { id: 'c2', type: 'clue', clue: 'defaultacct', text: 'Local accounts: "admin" enabled, password unchanged from the vendor default', note: 'The default password is published in the vendor\'s manual, so anyone can look it up.' },
              { id: 'c3', type: 'herring', text: 'Hostname follows the company naming standard (WEB-PRD-14)', note: 'A tidy naming convention is good practice, but it has nothing to do with the baseline.' },
              { id: 'c4', type: 'herring', text: 'Disk usage: 38%', note: 'Healthy, and irrelevant to security.' },
            ],
          },
          {
            id: 'services', title: 'Running services and logging',
            lines: [
              { id: 'c5', type: 'clue', clue: 'ftp', text: 'Listening ports: 22 (admin), 80, 443, 21 (file transfer) on 0.0.0.0', note: 'The web service is expected. The file-transfer service is not needed, and sends passwords in clear text.' },
              { id: 'c6', type: 'clue', clue: 'audit', text: 'auditd: not running; syslog forwarding: not configured', note: 'No record of administrative actions, and nothing forwarded to a safe place.' },
              { id: 'c7', type: 'clue', clue: 'banner', text: '/etc/issue.net: empty', note: 'A baseline item, but it protects nothing technical.' },
              { id: 'c8', type: 'herring', text: 'Time zone set to UTC', note: 'A normal and sensible setting.' },
              { id: 'c9', type: 'herring', text: 'Uptime: 6 days', note: 'A new server. It says nothing about hardening.' },
            ],
          },
        ],
      },
      {
        id: 'rollout', type: 'decision', title: 'Decide: rolling the baseline out',
        intro: 'You now need to apply the baseline to the 40 production servers already running. The application teams are nervous: "Last time security changed settings, our payment job broke."',
        prompt: 'How do you approach it?',
        options: [
          { id: 'rings', quality: 3, text: 'Build a hardened image for new servers first, pilot the baseline on a few non-critical servers in audit mode to see what would break, then enforce in waves with a rollback plan, and apply it through automation so it can be checked', set: { rings: true }, consequence: 'You learn what would break before anything does, and the application teams see that you have listened. Automation means you can also prove the settings stay in place.' },
          { id: 'allnow', quality: 2, text: 'Apply the whole baseline to every server tonight', set: { allnow: true }, consequence: 'It is fast, but two applications fail in the morning because settings were enforced that nobody had tested.' },
          { id: 'policy', quality: 1, text: 'Publish the baseline as a policy and ask the teams to comply by the end of the year', set: { policy: true }, consequence: 'Eleven servers comply. The rest do not, and nobody can tell which, because nothing checks.' },
          { id: 'newonly', quality: 0, text: 'Only harden new servers and leave the existing 40 alone', set: { newonly: true }, consequence: 'New builds are good. The 40 servers that hold the real data and the real risk are unchanged.' },
        ],
      },
      {
        id: 'standard', type: 'review', title: 'Review the draft hardening standard',
        intro: 'A colleague, Noor, has drafted the standard the company will publish.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported, so Noor can fix it before it goes out.',
        statements: [
          { id: 's1', sound: true, text: 'Baseline settings must be applied through automation, so they can be checked for drift.', why: 'Settings applied by hand cannot be reliably checked, and they drift.' },
          { id: 's2', sound: false, text: 'Once a server is hardened at build time it never needs to be checked again.', why: 'Servers change over time. Hardening has to be re-verified regularly, or configurations drift from the baseline.' },
          { id: 's3', sound: false, text: 'Meeting the benchmark means the server is secure.', why: 'A benchmark covers configuration. It says nothing about missing patches, weak application code or a stolen credential.' },
          { id: 's4', sound: true, text: 'The baseline will be tailored to each system\'s role, and any exception needs an owner and a reason.', why: 'A single setting for all roles would break some systems, and unexplained exceptions become permanent gaps.' },
          { id: 's5', sound: false, text: 'Switching off every service makes a server impossible to attack.', why: 'The services you need still run, and an attacker can use them. Reducing what is exposed lowers risk but does not remove it.' },
          { id: 's6', sound: true, text: 'Changes are tested in audit mode before they are enforced.', why: 'It shows what would break without breaking it.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the project board',
        intro: 'Your own summary. Include what the evidence supports, be honest about the decisions made, and recommend sensible next steps.',
        statements: [
          { id: 'r1', correct: true, text: 'The new server was built with default settings: remote administration allows password and root login, a default admin account is enabled, and an unneeded file-transfer service is listening.', why: 'Shown by the configuration.' },
          { id: 'r2', correct: true, text: 'Auditing is switched off and logs are not forwarded, so administrative actions are not recorded off the server.', why: 'Shown by the configuration.' },
          { id: 'r3', correct: true, text: 'Nothing shows that the server has been attacked. These are exposures that the baseline would close.', why: 'An honest statement of what is and is not known.' },
          { id: 'r4', correct: true, text: 'The baseline will be applied through automation so that drift can be detected.', why: 'An accurate description of the approach.' },
          { id: 'r5', correct: false, text: 'The server has been compromised.', why: 'Unsupported. You have gaps, not evidence of an attack.' },
          { id: 'r6', correct: false, text: 'The build team was careless.', why: 'A judgement about colleagues, not a finding. The baseline was not applied by anyone.' },
          { id: 'r7', correct: false, text: 'The server is fully hardened.', why: 'Contradicted by the evidence.' },
          { id: 'r8', when: 'rings', correct: true, text: 'A hardened image is used for new servers, and the baseline is being piloted in audit mode and rolled out in waves with a rollback plan.', why: 'An accurate record of a sound approach.' },
          { id: 'r9', when: 'allnow', correct: true, text: 'The baseline was applied to all servers overnight without a pilot, and two applications failed the next morning.', why: 'An honest account of the cost of rushing.' },
          { id: 'r10', when: 'policy', correct: true, text: 'The baseline was published as a policy with no automation or checking, so compliance is not known.', why: 'An honest statement that nothing verifies it.' },
          { id: 'r11', when: 'newonly', correct: true, text: 'Only new servers are being hardened, leaving the 40 existing servers unchanged.', why: 'An honest account of what was and was not done.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Close remote administration to the admin network with key-based sign-in, and disable root login and the default account on every server.', why: 'The most important changes, and quick to do.' },
          { id: 'a2', correct: true, text: 'Remove services that are not needed, and send logs to a central place.', why: 'Reduces exposure and improves detection.' },
          { id: 'a3', correct: true, text: 'Check compliance automatically every day, and report servers that drift.', why: 'Keeps the baseline in place.' },
          { id: 'a4', correct: false, text: 'Delay the launch indefinitely until every setting in the baseline is perfect.', why: 'Out of proportion. Close the serious gaps now and the rest on a plan.' },
          { id: 'a5', correct: false, text: 'Rely on the application teams to harden their own servers.', why: 'Without a shared baseline and checks, results will be uneven.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'secrets-sprawl',
    title: 'Secrets everywhere',
    skill: 'data',
    minutes: 20,
    blurb: 'Passwords and keys are scattered through code, logs and wikis. Work out where they are, spend limited effort well, and rotate the right ones without taking production down.',
    brief: [
      'A routine review has found that Contoso\'s engineering teams have been putting secrets (passwords, access keys and tokens) in places they should not be. Nobody knows how many, and some may be used in production.',
      'You are the security engineer given two weeks and ten engineer-days to fix it. You will allocate your effort, find out where the secrets really are, decide how to rotate a production database password without an outage, and check the draft plan before it goes to the engineering directors.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'Spend all ten days across these five pieces of work. Think about what removes the most risk, and what keeps the problem from coming back.',
        items: [
          { id: 'a1', source: 'Exposed', ideal: 3, text: 'Rotate and remove the secrets already found in source code repositories.', why: 'They are known and exposed, and any one could be in use. Rotating them is the most urgent work.' },
          { id: 'a2', source: 'Production', ideal: 3, text: 'Move the production database passwords into a secrets manager, so applications fetch them instead of storing them.', why: 'It removes the biggest category of risk permanently, and takes real engineering effort.' },
          { id: 'a3', source: 'Prevention', ideal: 2, text: 'Add secret scanning to the build pipeline so new secrets are blocked before they are committed.', why: 'Stops the problem returning. Quick to do, and it pays off for years.' },
          { id: 'a4', source: 'Clean-up', ideal: 1, text: 'Find and delete old access keys that nobody uses.', why: 'Unused keys are free access for anyone who finds them. Worthwhile, but small.' },
          { id: 'a5', source: 'Policy', ideal: 1, text: 'Write a company-wide secrets policy.', why: 'A policy helps people know what to do, but it fixes nothing on its own, so it gets a small share.' },
        ],
      },
      {
        id: 'where', type: 'evidence', title: 'Find out where the secrets really are',
        intro: 'Search the places secrets tend to hide. Flag only what the records support.',
        clues: {
          history: { strength: 'strong', text: 'A cloud access key sits in a repository\'s commit history. It was removed from the current code, but the old version is still visible to anyone with access.' },
          cilogs: { strength: 'strong', text: 'The pipeline logs print environment variables, including a deployment token.' },
          wiki: { strength: 'strong', text: 'A shared wiki page lists production passwords in a table, readable by all 900 staff.' },
          reuse: { strength: 'strong', text: 'The same database password is used in development, testing and production.' },
          age: { strength: 'weak', text: 'Some of these passwords have not changed in over three years.' },
        },
        artefacts: [
          {
            id: 'code', title: 'Code repositories and pipeline logs',
            lines: [
              { id: 'w1', type: 'clue', clue: 'history', text: 'Repo billing-api: commit 4f9a "remove key" deleted config.env. The previous commit still contains AKEY-4471 in plain text.', note: 'Deleting a file does not remove it from history. The key is still readable, and must be treated as exposed.' },
              { id: 'w2', type: 'clue', clue: 'cilogs', text: 'Build log #8812: environment dump includes DEPLOY_TOKEN=... (visible to everyone with pipeline access)', note: 'Pipeline logs are widely read and kept for a long time. A token printed there is effectively public inside the company.' },
              { id: 'w3', type: 'herring', text: 'Repo docs-site: contains example keys clearly marked "EXAMPLE-NOT-REAL"', note: 'Dummy values for documentation. Not a leak.' },
              { id: 'w4', type: 'herring', text: 'Repo billing-api: 3,200 commits, 41 contributors', note: 'Size and activity say nothing about secrets.' },
            ],
          },
          {
            id: 'docs', title: 'Wiki and shared documents',
            lines: [
              { id: 'w5', type: 'clue', clue: 'wiki', text: 'Wiki page "Prod access (DO NOT SHARE)": table of 14 production system passwords; page permissions: all staff', note: 'Marked "do not share" and visible to everyone. Anyone in the company, or anyone who gets one staff password, has them.' },
              { id: 'w6', type: 'clue', clue: 'reuse', text: 'Password audit: DB_PASSWORD identical across dev, test and prod environments (hash match)', note: 'A leak from a development system exposes production. Environments should never share secrets.' },
              { id: 'w7', type: 'clue', clue: 'age', text: 'Credential age report: 23 credentials unchanged for more than 3 years', note: 'Old credentials are more likely to have leaked. It is a hygiene issue rather than a leak.' },
              { id: 'w8', type: 'herring', text: 'Wiki search: 12 pages mention the word "password"', note: 'Mostly instructions about password policy. A search count is not a finding.' },
              { id: 'w9', type: 'herring', text: 'Wiki edits last month: 640', note: 'Activity level with no bearing on the question.' },
            ],
          },
        ],
      },
      {
        id: 'rotate', type: 'decision', title: 'Decide: rotating the production database password',
        intro: 'The production database password is on the wiki and the same as in development. Rotating it would break every application that uses the old one. Trading peaks at lunchtime.',
        prompt: 'What do you do?',
        options: [
          { id: 'planned', quality: 3, text: 'Rotate it in a planned low-traffic window using an overlap, where both the old and new passwords work for a short time, update the applications, then remove the old one, and give each environment its own new secret', set: { planned: true }, consequence: 'No outage. The exposed password stops working, and development can no longer reach production data.' },
          { id: 'peak', quality: 2, text: 'Rotate it immediately, because it is exposed', set: { peak: true }, consequence: 'The password is safe, but several applications fail at lunchtime because they were not updated in step.' },
          { id: 'wait', quality: 1, text: 'Wait until next quarter\'s maintenance window', set: { waited: true }, consequence: 'A production password stays readable by 900 people for three more months.' },
          { id: 'scrub', quality: 0, text: 'Remove the wiki page and the history entry, and leave the password as it is', set: { scrubbed: true }, consequence: 'The page is gone, but anyone who has already seen it, or copied it, still has a working password.' },
        ],
      },
      {
        id: 'plan', type: 'review', title: 'Review the draft remediation plan',
        intro: 'A colleague, Sam, has drafted the plan that goes to the engineering directors.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'p1', sound: true, text: 'Any secret that has appeared in a repository, a log or a wiki must be treated as exposed and rotated, even after it has been deleted.', why: 'Deleting does not undo exposure.' },
          { id: 'p2', sound: false, text: 'Deleting the old commits from the repository makes the leaked key safe.', why: 'Anyone who already cloned or read it still has it. Only rotating the key makes it safe.' },
          { id: 'p3', sound: false, text: 'Only production secrets matter, so development secrets can be left.', why: 'The same password was used across environments, and development is easier to break into.' },
          { id: 'p4', sound: true, text: 'Secret scanning in the pipeline will block most new accidental commits.', why: 'A fair, appropriately limited claim.' },
          { id: 'p5', sound: false, text: 'Once the secrets manager is in place, the problem is solved for good.', why: 'People can still paste secrets into the wrong place. Scanning, training and review remain necessary.' },
          { id: 'p6', sound: true, text: 'Rotation will be planned in low-traffic windows with an overlap period to avoid outages.', why: 'The safe way to rotate a secret that applications rely on.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write your summary for the engineering directors',
        intro: 'Your own summary. Include what the evidence supports, be honest about the decisions made, and recommend sensible actions.',
        statements: [
          { id: 's1', correct: true, text: 'A cloud access key remains readable in a repository\'s commit history, and a deployment token is printed in pipeline logs.', why: 'Shown by the repository and log review.' },
          { id: 's2', correct: true, text: 'A wiki page readable by all staff lists 14 production passwords, and the production database password is shared with development and testing.', why: 'Shown by the wiki and the password audit.' },
          { id: 's3', correct: true, text: 'Nothing shows that any of these secrets has been misused. They must still be treated as exposed.', why: 'An honest statement of what is and is not known.' },
          { id: 's4', correct: true, text: 'Effort has been concentrated on rotating exposed secrets, moving production secrets into a secrets manager and preventing new ones from being committed.', why: 'An accurate description of where the effort went.' },
          { id: 's5', correct: false, text: 'Attackers have used these secrets.', why: 'Unsupported. You have exposure, not evidence of misuse.' },
          { id: 's6', correct: false, text: 'The developers are to blame.', why: 'A judgement about colleagues. The report states the findings and the fixes.' },
          { id: 's7', correct: false, text: 'Removing the wiki page has fixed the problem.', why: 'The passwords still work until they are rotated.' },
          { id: 's8', when: 'planned', correct: true, text: 'The production database password was rotated in a planned low-traffic window with an overlap, and each environment now has its own secret.', why: 'An accurate record of a sound decision.' },
          { id: 's9', when: 'peak', correct: true, text: 'The production database password was rotated at lunchtime without an overlap, and several applications failed.', why: 'An honest account of the cost of rushing.' },
          { id: 's10', when: 'waited', correct: true, text: 'The production database password rotation was deferred to next quarter, leaving it exposed to all staff in the meantime.', why: 'An honest consequence of waiting.' },
          { id: 's11', when: 'scrubbed', correct: true, text: 'The wiki page was removed but the password was not rotated, so it still works for anyone who saw it.', why: 'An honest statement that the exposure remains.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Rotate every secret found in code, logs and the wiki, starting with the production and cloud keys.', why: 'The most urgent work.' },
          { id: 'a2', correct: true, text: 'Move production secrets into a secrets manager, with a separate secret per environment.', why: 'Removes the cause.' },
          { id: 'a3', correct: true, text: 'Add secret scanning to the pipeline and mask secrets in build logs.', why: 'Stops it happening again.' },
          { id: 'a4', correct: false, text: 'Ban all use of passwords.', why: 'Out of proportion and not possible.' },
          { id: 'a5', correct: false, text: 'Wait for an incident before spending the effort.', why: 'The exposure is already real.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'design-review',
    title: 'The architecture review',
    skill: 'data',
    minutes: 20,
    blurb: 'A new internal app wants to launch on Friday. Review its design, rank the risks, check the facts on the worst, and decide what has to be fixed first.',
    brief: [
      'The finance team has built a new expenses app and wants to launch on Friday. The security engineers review designs before launch, and yours is the review. A design review is your best chance to fix things cheaply, before they are built into something that is used by 900 people.',
      'You will rank the risks in the design, check the facts about the most worrying, decide what to do when the product manager asks to launch anyway, review the draft review notes, and report on the outcome.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'risks', type: 'prioritise', title: 'Rank the risks in the design',
        intro: 'Tap the risks in order, the biggest first. Think about how likely each is to be used and how bad the result would be.',
        items: [
          { id: 'd1', source: 'Access', priority: 1, text: 'Every part of the app runs with one shared administrator credential that can read and change everything.', why: 'If any part is compromised the attacker gets all of it. Least privilege is the most basic design rule.' },
          { id: 'd2', source: 'Data', priority: 2, text: 'The database holding employees\' bank details can be reached directly from the general user network.', why: 'There is no reason for users to reach the database. It should only be reachable from the app.' },
          { id: 'd3', source: 'Secrets', priority: 3, text: 'The app\'s passwords sit in a configuration file committed to the code repository.', why: 'Anyone with repository access has them, and they remain in history.' },
          { id: 'd4', source: 'Login', priority: 4, text: 'There is no limit on failed sign-in attempts.', why: 'Allows password guessing, but sign-in goes through the company\'s single sign-on, which already limits attempts.' },
          { id: 'd5', source: 'Errors', priority: 5, text: 'Error pages show detailed technical messages.', why: 'Helps an attacker a little and can be turned off easily. Low risk.' },
        ],
      },
      {
        id: 'facts', type: 'evidence', title: 'Check the facts about the shared credential',
        intro: 'The developers say the shared credential is "temporary and low risk". Find out what it really allows. Flag only what the records support.',
        clues: {
          scope: { strength: 'strong', text: 'The shared credential has administrator rights on the app\'s servers, its database and the storage that holds receipts.' },
          reach: { strength: 'strong', text: 'It is stored in the configuration file that the front-end web servers read.' },
          nodata: { strength: 'strong', text: 'The database holds names, bank account numbers and expense claims for 900 staff.' },
          noalert: { strength: 'strong', text: 'No alert is configured for use of the credential, so misuse would not be noticed.' },
          temp: { strength: 'weak', text: 'A comment in the code says "temporary, to be replaced before launch".' },
        },
        artefacts: [
          {
            id: 'perms', title: 'Permissions and configuration',
            lines: [
              { id: 'f1', type: 'clue', clue: 'scope', text: 'Credential svc-expenses: administrator on APP01-03, DB-EXP01 and the receipts storage', note: 'One credential reaches everything. Compromise one front-end server and all of it is lost.' },
              { id: 'f2', type: 'clue', clue: 'reach', text: 'App config (web tier): DB_ADMIN_USER / DB_ADMIN_PASSWORD stored in /etc/app/config.yml, readable by the web process', note: 'The most exposed part of the app holds the most powerful secret.' },
              { id: 'f3', type: 'clue', clue: 'temp', text: 'Code comment: "TODO temporary: use admin until the roles are ready"', note: 'It shows the intention to fix it. Temporary arrangements that ship tend to stay.' },
              { id: 'f4', type: 'herring', text: 'App framework: current stable release', note: 'A good choice, and not related to the credential.' },
              { id: 'f5', type: 'herring', text: 'TLS is used between the browser and the app', note: 'Good, and does not affect how powerful the credential is.' },
            ],
          },
          {
            id: 'data', title: 'Data and monitoring',
            lines: [
              { id: 'f6', type: 'clue', clue: 'nodata', text: 'DB-EXP01 tables: employees (900 rows), bank_details (880 rows), claims (14,200 rows)', note: 'Bank details for most of the company. The impact of a compromise is high.' },
              { id: 'f7', type: 'clue', clue: 'noalert', text: 'Monitoring rules for svc-expenses: none', note: 'If someone used the credential from the wrong place, nobody would be told.' },
              { id: 'f8', type: 'herring', text: 'The app\'s weekly usage is expected to be around 300 claims', note: 'A forecast with no bearing on security.' },
              { id: 'f9', type: 'herring', text: 'The database backup is encrypted', note: 'Good practice, but it does not reduce the damage from the live credential.' },
            ],
          },
        ],
      },
      {
        id: 'launch', type: 'decision', title: 'Decide: the product manager wants to launch',
        intro: 'The product manager says: "We launch on Friday. We will fix the permissions in the next release. Can you sign it off?"',
        prompt: 'What do you do?',
        options: [
          { id: 'gate', quality: 3, text: 'Do not sign it off as it is. Tell them the three serious items must be fixed first, show a plan to fix them in three days (separate low-privilege accounts, a database reachable only from the app, secrets in a vault), accept the lower items as tracked tickets, and offer to re-review on Thursday', set: { gate: true }, consequence: 'The launch moves by a few days and the serious items are fixed properly. The product manager sees you as someone who helps ship safely.' },
          { id: 'conditional', quality: 2, text: 'Allow the launch with a condition that the fixes will be made within a month', set: { conditional: true }, consequence: 'It launches on time. The month passes, the fixes keep slipping, and 900 staff\'s bank details sit behind an administrator credential for six months.' },
          { id: 'signoff', quality: 1, text: 'Sign it off: the developers say it is temporary', set: { signedoff: true }, consequence: 'It launches with all the serious problems and no plan to fix them.' },
          { id: 'block', quality: 0, text: 'Block the launch indefinitely until the entire design is perfect', set: { blocked: true }, consequence: 'The finance team stops talking to security and builds the next app without telling you.' },
        ],
      },
      {
        id: 'notes', type: 'review', title: 'Review the draft review notes',
        intro: 'A junior engineer, Priya, has drafted the notes from the design review.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'n1', sound: true, text: 'The shared administrator credential gives access to the servers, the database and the receipts storage, and is held in a file readable by the web process.', why: 'Supported by the permissions and the configuration.' },
          { id: 'n2', sound: false, text: 'The app has been breached.', why: 'Unsupported. The design has serious weaknesses, with no sign of an attack.' },
          { id: 'n3', sound: false, text: 'The credential is low risk because it is only used internally.', why: 'An internal system holding bank details with an administrator credential is not low risk, and a compromised internal machine reaches it.' },
          { id: 'n4', sound: true, text: 'The database holds bank details for about 880 staff, so a compromise would have a high impact.', why: 'Supported by the data records.' },
          { id: 'n5', sound: false, text: 'The developers deliberately made the app insecure.', why: 'There is no evidence of that. It was a shortcut meant to be temporary.' },
          { id: 'n6', sound: true, text: 'No alerting exists for use of the credential, so misuse would not be noticed.', why: 'Supported by the monitoring records.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the outcome of the review',
        intro: 'Your own record of the review. Include what the evidence supports, be honest about the decisions made, and recommend sensible actions.',
        statements: [
          { id: 'r1', correct: true, text: 'The design uses a shared administrator credential that reaches the servers, the database and the receipts storage.', why: 'Shown by the permissions.' },
          { id: 'r2', correct: true, text: 'The database holds bank details for about 880 staff, and the credential is stored in a file read by the front-end web servers.', why: 'Shown by the data and configuration records.' },
          { id: 'r3', correct: true, text: 'There is no monitoring on the credential, and the database is reachable from the general user network.', why: 'Shown by the review.' },
          { id: 'r4', correct: true, text: 'Nothing shows that the credential has been misused.', why: 'An honest statement.' },
          { id: 'r5', correct: false, text: 'The finance team ignored security advice.', why: 'Unsupported, and unhelpful.' },
          { id: 'r6', correct: false, text: 'The app should never have been built.', why: 'Out of proportion. It needs fixing, not scrapping.' },
          { id: 'r7', correct: false, text: 'The design is secure once the error pages are fixed.', why: 'The error pages are a minor point. The serious items are the shared credential, the database reach and the secrets.' },
          { id: 'r8', when: 'gate', correct: true, text: 'Launch was held for three days while low-privilege accounts, restricted database access and a secrets vault were put in place, with a re-review before launch.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'conditional', correct: true, text: 'Launch went ahead with a commitment to fix the issues within a month, which has not yet been met.', why: 'An honest account of a decision that carried risk.' },
          { id: 'r10', when: 'signedoff', correct: true, text: 'The app was signed off with the serious issues unresolved and no fix date.', why: 'An honest record of a poor decision.' },
          { id: 'r11', when: 'blocked', correct: true, text: 'Launch was blocked without a plan, and the team has since built another app without a review.', why: 'An honest account of the cost of an unhelpful block.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Give each part of the app its own low-privilege account, and keep the administrator credential for administrators only.', why: 'Least privilege.' },
          { id: 'a2', correct: true, text: 'Move the database behind the app so that only the app servers can reach it, and store secrets in a vault.', why: 'Closes the other two serious items.' },
          { id: 'a3', correct: true, text: 'Add monitoring for any use of the old administrator credential, and re-review before launch.', why: 'Detect misuse and confirm the fixes.' },
          { id: 'a4', correct: false, text: 'Encrypt the database and treat the problem as solved.', why: 'Encryption does not help if the attacker holds an administrator credential.' },
          { id: 'a5', correct: false, text: 'Ask the developers to be more careful.', why: 'A request is not a control.' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: 'se-exam',
    title: 'Promotion exam: Security Engineer',
    skill: 'data',
    minutes: 26,
    blurb: 'A cloud migration, a deadline and a shortcut that is not safe. Silver or better to pass.',
    brief: [
      'This is your promotion exam. Contoso is moving its customer portal to a new cloud platform in three weeks. You lead the security engineering for the move. The project is behind and the pressure to cut corners is rising.',
      'The case tests the role: ranking what matters, spending limited effort well, finding what is really wrong in the build pipeline, standing firm on a shortcut that is not safe, and writing a report that the board can trust. Unsupported claims and misplaced effort cost points.',
    ],
    ratings: RATINGS,
    stages: [
      {
        id: 'rank', type: 'prioritise', title: 'Rank the migration risks',
        intro: 'Tap the risks in order, the most serious first.',
        items: [
          { id: 'x1', source: 'Pipeline', priority: 1, text: 'Anyone who can merge to the main branch can deploy to production, with no review or approval step.', why: 'One compromised or careless account could ship anything to customers. Controlling what reaches production is the most important protection.' },
          { id: 'x2', source: 'Cloud account', priority: 2, text: 'The migration team all use the account owner login, which has no second factor.', why: 'It is the most powerful credential in the platform, and a stolen password would give full control.' },
          { id: 'x3', source: 'Network', priority: 3, text: 'The cloud network has a wide-open internal rule so that "things just work".', why: 'It lets a single compromised component reach all the others. Important, but secondary to the first two.' },
          { id: 'x4', source: 'Logging', priority: 4, text: 'Audit logging is switched on but only kept for seven days.', why: 'Limits investigations. It does not make an attack more likely.' },
          { id: 'x5', source: 'Tagging', priority: 5, text: 'Resources are not consistently tagged with an owner.', why: 'A housekeeping gap that makes things harder to manage.' },
        ],
      },
      {
        id: 'effort', type: 'allocate', unit: 'engineer-days', budget: 10, title: 'Spend your ten engineer-days',
        intro: 'Spend all ten days across these four pieces of work, before the migration.',
        items: [
          { id: 'y1', source: 'Pipeline', ideal: 4, text: 'Add review and approval gates to the deployment pipeline, and restrict who can deploy to production.', why: 'The most important control, and the one that needs the most design and testing.' },
          { id: 'y2', source: 'Identity', ideal: 3, text: 'Replace the shared owner login with individual accounts, a second factor and least privilege.', why: 'Closes the other serious gap, and involves several teams.' },
          { id: 'y3', source: 'Network', ideal: 2, text: 'Replace the wide-open internal rule with rules that allow only what each component needs.', why: 'Contains any compromise. It needs design and testing so it is a firm share.' },
          { id: 'y4', source: 'Logging', ideal: 1, text: 'Extend log retention and send audit logs to a separate, protected account.', why: 'Cheap and it makes everything else investigable.' },
        ],
      },
      {
        id: 'pipeline', type: 'evidence', title: 'Find what is really wrong in the pipeline',
        intro: 'The project lead says the pipeline is "fine, it works". Check what it actually does. Flag only what the records support.',
        clues: {
          nogate: { strength: 'strong', text: 'A commit to the main branch deploys straight to production with no review or approval.' },
          sharedtoken: { strength: 'strong', text: 'The deployment uses a single long-lived token with administrator rights, shared by the whole team.' },
          logged: { strength: 'strong', text: 'That token is printed in the pipeline logs, which all 60 engineers can read.' },
          unpinned: { strength: 'strong', text: 'Builds pull the newest version of third-party packages each time, with no version pinning or checking.' },
          fast: { strength: 'weak', text: 'The pipeline is fast: a change reaches production in six minutes.' },
        },
        artefacts: [
          {
            id: 'config', title: 'Pipeline configuration',
            lines: [
              { id: 'p1', type: 'clue', clue: 'nogate', text: 'deploy.yml: on push to main: build, test, deploy to production. Required approvals: 0', note: 'Nothing stands between a merge and customers. A single bad or malicious change goes straight out.' },
              { id: 'p2', type: 'clue', clue: 'sharedtoken', text: 'Secret DEPLOY_TOKEN: scope administrator; created 14 months ago; used by 22 people', note: 'A long-lived, all-powerful credential held by many people. Nobody can tell who did what with it.' },
              { id: 'p3', type: 'clue', clue: 'fast', text: 'Median time from merge to production: 6 minutes', note: 'Speed is a good thing in a pipeline. It is a fact about convenience, not a weakness on its own.' },
              { id: 'p4', type: 'herring', text: 'Unit test coverage: 83%', note: 'Good for quality. It does not control who can deploy.' },
              { id: 'p5', type: 'herring', text: 'Pipeline runs on the platform\'s managed runners', note: 'A reasonable choice that does not explain the problems here.' },
            ],
          },
          {
            id: 'logs', title: 'Pipeline logs and dependencies',
            lines: [
              { id: 'p6', type: 'clue', clue: 'logged', text: 'Build log #3019 (readable by group "engineering", 60 people): "DEPLOY_TOKEN=..." in the environment dump', note: 'The most powerful credential is visible to everyone with log access.' },
              { id: 'p7', type: 'clue', clue: 'unpinned', text: 'requirements: all packages listed without version numbers; no lockfile; no hash checking', note: 'Each build takes whatever the newest version is. If a package is hijacked, it is pulled in automatically.' },
              { id: 'p8', type: 'herring', text: 'Pipeline log retention: 90 days', note: 'A reasonable setting. Not related to the findings.' },
              { id: 'p9', type: 'herring', text: 'The repository has 14 open pull requests', note: 'Normal activity.' },
            ],
          },
        ],
      },
      {
        id: 'shortcut', type: 'decision', title: 'Decide: the shortcut',
        intro: 'The project lead says: "We are three weeks out and behind. Keep the pipeline as it is for the migration. We can add the gates after go-live."',
        prompt: 'What do you do?',
        options: [
          { id: 'minimum', quality: 3, text: 'Agree a minimum set before go-live that costs little: require one reviewer for production deploys, replace the shared token with short-lived credentials per person, mask secrets in logs and pin dependencies; and defer the rest to a dated plan', set: { minimum: true }, consequence: 'The most dangerous gaps close within a week and the project keeps its date. The rest has an owner and a deadline.' },
          { id: 'defer', quality: 2, text: 'Let it go live as it is, with a written promise to fix it in the next quarter', set: { deferred: true }, consequence: 'A single shared token and no review ship to customers. The promise slips for two quarters.' },
          { id: 'go', quality: 1, text: 'Agree to the shortcut and not mention it in the project risk log', set: { silent: true }, consequence: 'Nobody outside the team knows. Three months later a hijacked package is pulled into a build and deployed automatically.' },
          { id: 'stop', quality: 0, text: 'Refuse to support the migration until the pipeline is redesigned', set: { stopped: true }, consequence: 'The project loses three weeks and the business starts a second, unreviewed migration of its own.' },
        ],
      },
      {
        id: 'review', type: 'review', title: 'Review the draft risk statement',
        intro: 'A colleague has drafted the security statement for the board.',
        draftIntro: 'Read each statement. Flag every claim that is wrong, overstated or unsupported.',
        statements: [
          { id: 'j1', sound: true, text: 'The pipeline currently deploys to production with no review or approval step.', why: 'Supported by the configuration.' },
          { id: 'j2', sound: false, text: 'The pipeline is secure because it is fast and well tested.', why: 'Speed and test coverage are about quality, not about who can deploy or what secrets are exposed.' },
          { id: 'j3', sound: false, text: 'No credentials are at risk.', why: 'Contradicted by the log showing the deployment token visible to 60 people.' },
          { id: 'j4', sound: true, text: 'Dependencies are pulled without pinned versions, which exposes builds to a hijacked package.', why: 'Supported by the build configuration.' },
          { id: 'j5', sound: false, text: 'The migration is unsafe and should not go ahead.', why: 'Not supported. The issues are fixable, and the decision is the business\'s.' },
          { id: 'j6', sound: true, text: 'Nothing shows that any of these weaknesses has been used.', why: 'An honest statement of what is known.' },
        ],
      },
      {
        id: 'report', type: 'report', title: 'Write the summary for the board',
        intro: 'Your own summary. Include what the evidence supports and recommend proportionate actions.',
        statements: [
          { id: 'r1', correct: true, text: 'A merge to the main branch deploys straight to production with no review, using a single shared administrator token.', why: 'Shown by the pipeline configuration.' },
          { id: 'r2', correct: true, text: 'The deployment token is printed in logs readable by about 60 engineers, and third-party packages are pulled without version pinning.', why: 'Shown by the logs and the build configuration.' },
          { id: 'r3', correct: true, text: 'The migration team uses a shared account-owner login with no second factor.', why: 'Shown by the review.' },
          { id: 'r4', correct: true, text: 'There is no evidence that any of these weaknesses has been exploited.', why: 'An honest statement.' },
          { id: 'r5', correct: false, text: 'The company has been compromised.', why: 'Unsupported.' },
          { id: 'r6', correct: false, text: 'The project team has been negligent.', why: 'A judgement about colleagues, not a finding.' },
          { id: 'r7', correct: false, text: 'The pipeline is acceptable as it is.', why: 'Contradicted by the evidence.' },
          { id: 'r8', when: 'minimum', correct: true, text: 'A minimum set of controls was agreed before go-live (a required reviewer, short-lived per-person credentials, masked logs and pinned dependencies), with the rest on a dated plan.', why: 'An accurate record of a sound decision.' },
          { id: 'r9', when: 'deferred', correct: true, text: 'The pipeline will go live unchanged with a written commitment to fix it next quarter.', why: 'An honest account of a decision that carries risk.' },
          { id: 'r10', when: 'silent', correct: true, text: 'The shortcut was accepted and was not recorded in the project risk log.', why: 'An honest record of a decision that was kept quiet.' },
          { id: 'r11', when: 'stopped', correct: true, text: 'Support for the migration was withdrawn until the pipeline was redesigned, which delayed the project by three weeks.', why: 'An honest account of the cost of refusing to compromise.' },
        ],
        actions: [
          { id: 'a1', correct: true, text: 'Require review and approval for production deploys, and restrict who can deploy.', why: 'The most important control.' },
          { id: 'a2', correct: true, text: 'Replace the shared token with short-lived credentials per person, rotate it now and mask secrets in logs.', why: 'Closes the credential exposure.' },
          { id: 'a3', correct: true, text: 'Pin and verify third-party dependencies, and give each person an individual cloud account with a second factor.', why: 'Closes the supply-chain and identity gaps.' },
          { id: 'a4', correct: false, text: 'Cancel the migration.', why: 'Out of proportion.' },
          { id: 'a5', correct: false, text: 'Accept the risk and add it to a list nobody reviews.', why: 'An unreviewed risk register is not a control.' },
        ],
      },
    ],
  },
];
