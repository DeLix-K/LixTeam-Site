import * as career from '../core/career.js';
import { MISSIONS, TIERS, MEDALS, ROADMAP, PATHS } from '../core/missions.js';
import { rankBadge, medalIcon, skillRadar, pathIcon } from '../core/art.js';

const $ = (id) => document.getElementById(id);

// Elements are built with textContent only; nothing from the data is parsed as HTML.
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}

const missionUrl = (m) => `/games/${m.mode}/?mission=${m.id}`;
const pct = (x) => `${Math.round(x * 100)}%`;

// The career paths. Choosing one is saved; paths without missions yet are marked "coming soon".
function renderPaths(s) {
  const grid = $('path-grid');
  grid.replaceChildren();
  for (const path of PATHS) {
    const sum = career.pathSummary(s, path.id);
    const chosen = s.path === path.id;
    const status = sum.started ? `${sum.rank.name} · ${sum.passed} of ${sum.total} missions passed` : sum.live ? 'Start this path' : 'Coming soon';
    const card = h(
      'button',
      { class: `path-card${chosen ? ' chosen' : ''}${sum.live ? '' : ' soon'}`, type: 'button', 'aria-pressed': chosen ? 'true' : 'false', disabled: !sum.live, 'data-path': path.id },
      h('span', { class: 'path-icon' }, pathIcon(path.id, 26)),
      h('span', { class: 'path-body' }, h('strong', { text: path.name }), h('span', { class: 'path-blurb', text: path.blurb }), h('span', { class: 'path-status', text: status })),
      sum.started ? h('span', { class: 'bar path-bar', 'aria-hidden': 'true' }, Object.assign(h('div'), { style: `width:${Math.round(sum.progress * 100)}%` })) : null
    );
    card.style.setProperty('--path', path.colour);
    if (sum.live) {
      card.addEventListener('click', () => {
        const now = career.load();
        career.setPath(now, path.id);
        career.save();
        render();
        $('path-view').scrollIntoView({ block: 'start' });
      });
    }
    grid.append(card);
  }
  $('more-paths').replaceChildren(...ROADMAP.map((x) => h('li', {}, h('strong', { text: x.title }), x.note)));
}

function render() {
  const s = career.load();
  renderPaths(s);
  const chosen = !!s.path;
  const pid = career.pathOf(s);
  const path = PATHS.find((x) => x.id === pid);

  // Heading follows the chosen path
  $('c-eyebrow').textContent = chosen ? `${path.name} path` : 'Cyber security career';
  $('c-h').replaceChildren(document.createTextNode(chosen ? path.headline[0] : 'Choose your '), h('span', { class: 'accent-text', text: chosen ? path.headline[1] : 'path.' }));
  $('c-lead').textContent = chosen ? path.lead : 'Pick an area. Each path is its own ladder with its own ranks, skills and promotion exams. You can try any of them whenever you like, and your progress on each is kept separately.';
  $('path-view').hidden = !chosen;
  $('more-box').hidden = chosen;
  renderPortfolio(s);
  $('code-box').value = career.exportCode(s);
  if (!chosen) return;

  const r = career.rankOf(s, pid);

  // Rank and what the next promotion needs
  $('rank-name').textContent = r.rank.name;
  $('rank-badge').replaceChildren(rankBadge(career.rankBadgeSpec(pid, r.rank), 96, { label: `Rank: ${r.rank.name}` }));
  const pct100 = Math.round(r.progress * 100);
  $('rank-progress').hidden = r.isTop;
  $('rank-bar').setAttribute('aria-valuenow', String(pct100));
  $('rank-bar').firstChild.style.width = `${pct100}%`;
  $('rank-pct').textContent = r.isTop ? '' : `${pct100}% of the way to ${r.next.name}`;
  $('rank-path').replaceChildren(
    ...path.ranks.map((x, i) =>
      h('li', { class: i < r.index ? 'passed' : i === r.index ? 'current' : 'ahead', 'aria-current': i === r.index ? 'step' : null }, rankBadge(career.rankBadgeSpec(pid, x), 40, { locked: i > r.index }), h('span', { text: x.name }))
    )
  );
  $('rank-blurb').textContent = r.rank.blurb;
  $('xp-num').textContent = String(career.xpOf(s, pid));
  if (r.isTop) {
    $('next-title').textContent = 'You have reached the top rank on this path.';
    $('checks').replaceChildren();
  } else {
    $('next-title').textContent = `To become ${r.next.name}:`;
    $('checks').replaceChildren(
      ...r.checklist.map((c) =>
        h(
          'li',
          { class: `${c.done ? 'done' : ''}${c.available === false ? ' unavailable' : ''}` },
          h('span', { class: 'tick', 'aria-hidden': 'true', text: c.done ? '✓' : '' }),
          h('span', { text: `${c.label}${c.done ? ' (done)' : ''}` }),
          h('span', { class: 'detail', text: c.detail }),
          c.key !== 'exam' && !c.done ? h('div', { class: 'bar', 'aria-hidden': 'true' }, Object.assign(h('div'), { style: `width:${Math.round(c.progress * 100)}%` })) : null
        )
      )
    );
  }

  // Recommendation
  const rec = career.recommend(s);
  $('rec-panel').hidden = !rec;
  if (rec) {
    $('rec-title').textContent = rec.mission.title;
    $('rec-why').textContent = rec.reason;
    $('rec-go').href = missionUrl(rec.mission);
    $('rec-go').textContent = rec.mission.exam ? 'Take the promotion exam' : career.bestTier(s, rec.mission.id) > 0 ? 'Replay this mission' : 'Start this mission';
  }
  // Short on time? A different, shorter case that still works on the weakest skill.
  const quick = career.recommend(s, { maxMinutes: 12 });
  const showQuick = quick && (!rec || quick.mission.id !== rec.mission.id);
  $('rec-quick').hidden = !showQuick;
  if (showQuick) {
    const a = h('a', { href: missionUrl(quick.mission), text: quick.mission.title });
    $('rec-quick').replaceChildren(document.createTextNode('Short on time? '), a, document.createTextNode(` (about ${quick.mission.minutes} minutes).`));
  }

  // Featured case of the week
  const feat = career.featured(s);
  $('feat-panel').hidden = !feat;
  if (feat) {
    $('feat-panel').classList.toggle('done', feat.done);
    $('feat-title').textContent = feat.mission.title;
    $('feat-why').textContent = feat.done ? 'Finished this week. A different case is featured from next Monday.' : feat.mission.blurb;
    $('feat-go').href = missionUrl(feat.mission);
    $('feat-go').textContent = feat.done ? 'Replay it' : "Play this week's case";
    $('feat-go').classList.toggle('primary', !feat.done);
    const n = career.featuredCount(s);
    $('feat-count').textContent = n ? `Featured cases finished: ${n}` : 'Finish it with any medal to count it.';
  }

  // Skills on this path
  const comps = career.visibleCompetencies(s, pid);
  $('radar').replaceChildren(skillRadar(comps.map((c) => ({ id: c.id, name: c.name, score: career.mastery(s, c.id, undefined, pid).score }))));
  $('skills').replaceChildren(
    ...comps.map((c) => {
      const m = career.mastery(s, c.id, undefined, pid);
      const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-label': `${c.name} mastery`, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(m.score) }, Object.assign(h('div'), { style: `width:${m.score}%` }));
      return h('div', { class: 'skill' }, h('div', { class: 'skill-top' }, h('span', { text: c.name }), h('span', { text: m.attempted ? `${m.score}/100 · ${m.attempted} of ${m.count} missions` : `Not started · 0 of ${m.count} missions` })), h('small', { text: c.blurb }), bar);
    })
  );

  // Campaign map: the tiers of this path
  const camp = $('campaign');
  camp.replaceChildren();
  for (const tier of TIERS.filter((t) => (t.path || 'analyst') === pid)) {
    const list = MISSIONS.filter((m) => m.tier === tier.id && !m.exam);
    const exams = MISSIONS.filter((m) => m.tier === tier.id && m.exam);
    if (!list.length && !exams.length) continue;
    const done = career.passedCount(s, tier.id);
    const total = career.tierTotal(tier.id);
    camp.append(h('div', { class: 'tier-head' }, h('p', { class: 'tier', text: tier.name }), h('span', { class: 'tier-count', text: `${done} of ${total} passed` }), h('div', { class: 'bar tier-bar', 'aria-hidden': 'true' }, Object.assign(h('div'), { style: `width:${total ? Math.round((done / total) * 100) : 0}%` }))));
    if (tier.note) camp.append(h('p', { class: 'tier-note', text: tier.note }));
    const wrap = h('div', { class: 'missions' });
    for (const m of [...list, ...exams]) wrap.append(missionCard(s, m));
    camp.append(wrap);
  }

  // Roadmap for this path
  $('roadmap-box').hidden = !path.roadmap.length;
  $('roadmap').replaceChildren(...path.roadmap.map((x) => h('li', {}, h('strong', { text: x.title }), x.note)));
}

function missionCard(s, m) {
  const st = career.missionStatus(s, m.id);
  const badge = st.medal > 0 && st.passed ? h('span', { class: `badge m${st.medal}`, text: MEDALS[st.medal] }) : st.attempts > 0 ? h('span', { class: 'badge fail', text: m.exam ? 'Not passed' : 'No medal yet' }) : st.unlocked ? h('span', { class: 'badge', text: 'New' }) : h('span', { class: 'badge', text: 'Locked' });
  const card = h(
    'div',
    { class: `mission${st.unlocked ? '' : ' locked'}${m.exam ? ' exam' : ''}` },
    h('div', { class: 'mission-top' }, medalIcon(st.passed && st.medal > 0 ? st.medal : st.unlocked ? 0 : 'lock', 40), h('div', { class: 'mission-main' }, h('h3', { text: m.title }), h('p', { text: m.blurb })), badge),
    h('div', { class: 'meta' }, h('span', { text: `About ${m.minutes} min` }), m.exam ? h('span', { text: 'Silver or better to pass' }) : null, st.attempts ? h('span', { text: `Best ${pct(st.bestPerf)} of full marks` }) : null, st.attempts ? h('span', { text: `${st.attempts} attempt${st.attempts === 1 ? '' : 's'}` }) : null)
  );
  if (!st.unlocked) {
    card.append(h('ul', { class: 'reqs' }, ...st.missing.map((x) => h('li', { text: `${x.label} (${x.detail})` }))));
  } else {
    const label = m.exam ? (st.attempts ? 'Retake the exam' : 'Take the promotion exam') : st.attempts ? 'Replay' : 'Start';
    card.append(h('a', { class: `btn ${st.attempts ? '' : 'primary'}`, href: missionUrl(m), text: label }));
  }
  return card;
}

function renderPortfolio(s) {
  const box = $('portfolio');
  box.replaceChildren();
  const items = career.portfolio(s);
  if (!items.length) {
    box.append(h('p', { class: 'empty', text: 'No cases yet. Finish a mission and its case report will appear here.' }));
    return;
  }
  for (const p of items) {
    const cmp = career.compare(s, p.mission.id);
    const text = career.reportText(s, p.mission.id);
    const challenge = h('button', { class: 'btn', type: 'button', text: 'Copy challenge code' });
    challenge.addEventListener('click', async () => {
      const code = career.challengeCode(s, p.mission.id);
      try {
        await navigator.clipboard.writeText(code);
        $('progress-status').textContent = `Challenge code copied for "${p.mission.title}". Send it to a friend.`;
      } catch {
        $('progress-status').textContent = `Select and copy this code: ${code}`;
      }
    });
    const copy = h('button', { class: 'btn', type: 'button', text: 'Copy case report' });
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        $('progress-status').textContent = `Copied the case report for "${p.mission.title}".`;
      } catch {
        $('progress-status').textContent = 'Could not copy automatically: select the report text and copy it.';
      }
    });
    box.append(
      h(
        'details',
        { class: 'case' },
        h('summary', {}, medalIcon(p.tier, 28), h('span', { class: 'case-title' }, p.mission.title, h('small', { text: `${p.medal} · ${pct(p.bestPerf)} of full marks · ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}` })), h('span', { class: `badge m${p.tier}`, text: p.medal })),
        h(
          'div',
          { class: 'inner' },
          cmp ? h('p', { class: 'compare', text: `First attempt ${pct(cmp.first.perf)}, latest ${pct(cmp.latest.perf)}${cmp.latest.perf > cmp.first.perf ? ': you have improved.' : '.'}` }) : null,
          h('pre', { text }),
          h('div', { class: 'btn-row' }, copy, challenge)
        )
      )
    );
  }
}

// ── Challenge a friend ──────────────────────────────────────────
$('challenge-go').addEventListener('click', () => {
  const out = $('challenge-out');
  const ch = career.readChallenge($('challenge-input').value);
  if (!ch.ok) {
    out.replaceChildren(h('p', { class: 'empty', text: ch.error }));
    return;
  }
  const s = career.load();
  const cmp = career.compareChallenge(s, ch);
  const st = career.missionStatus(s, ch.mission.id);
  const verdict = { ahead: 'You are ahead of your friend.', level: 'You are level with your friend.', behind: 'Your friend is ahead. Replay it to catch up.', untried: 'You have not tried this case yet.' }[cmp.result];
  const kids = [
    h('h3', { text: ch.mission.title }),
    h('p', { text: `Your friend: ${MEDALS[ch.tier]}, ${ch.percent}% of full marks.` }),
    h('p', { text: cmp.yours ? `You: ${MEDALS[cmp.yours.tier]}, ${cmp.yours.percent}% of full marks.` : 'You: not played yet.' }),
    h('p', { class: 'verdict-line', text: verdict }),
  ];
  if (st.unlocked) kids.push(h('a', { class: 'btn primary', href: missionUrl(ch.mission), text: cmp.yours ? 'Replay this case' : 'Play this case' }));
  else kids.push(h('p', { class: 'empty', text: `This case is still locked for you. ${st.missing.map((x) => `${x.label} (${x.detail})`).join('; ')}` }));
  out.replaceChildren(...kids);
});

// ── Progress export / import / reset ────────────────────────────
$('copy-code').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('code-box').value);
    $('progress-status').textContent = 'Progress code copied. Keep it somewhere safe.';
  } catch {
    $('code-box').select();
    $('progress-status').textContent = 'Select the code above and copy it.';
  }
});
$('copy-summary').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(career.summaryText(career.load()));
    $('progress-status').textContent = 'Summary copied.';
  } catch {
    $('progress-status').textContent = 'Could not copy automatically. Use Download my summary instead.';
  }
});
$('download-summary').addEventListener('click', () => {
  try {
    const url = URL.createObjectURL(new Blob([career.summaryText(career.load())], { type: 'text/plain' }));
    const a = h('a', { href: url, download: 'career-summary.txt' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('progress-status').textContent = 'Summary downloaded.';
  } catch {
    $('progress-status').textContent = 'Could not download. Use Copy my summary instead.';
  }
});
$('show-import').addEventListener('click', () => {
  $('import-box').hidden = !$('import-box').hidden;
  if (!$('import-box').hidden) $('import-input').focus();
});
$('do-import').addEventListener('click', () => {
  const res = career.importCode($('import-input').value);
  if (res.ok) {
    $('import-input').value = '';
    $('import-box').hidden = true;
    $('progress-status').textContent = 'Progress restored.';
    render();
  } else {
    $('progress-status').textContent = res.error;
  }
});
$('reset-career').addEventListener('click', () => {
  if (confirm('Reset your career? Your rank, XP, mastery and case history on this device will be erased. This cannot be undone.')) {
    career.reset();
    $('progress-status').textContent = 'Career reset.';
    render();
  }
});

// Deep link from the games home: career/?path=cloud chooses that path (only if it exists and has missions).
{
  const want = new URLSearchParams(location.search).get('path');
  if (want && career.pathById(want) && career.pathSummary(career.load(), want).live) {
    career.setPath(career.load(), want);
    career.save();
  }
  if (want) history.replaceState(null, '', location.pathname);
}
render();
