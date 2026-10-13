import * as career from '../core/career.js';
import { COMPETENCIES, MISSIONS, TIERS, MEDALS, ROADMAP } from '../core/missions.js';

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

function render() {
  const s = career.load();
  const r = career.rankOf(s);

  // Rank and what the next promotion needs
  $('rank-name').textContent = r.rank.name;
  $('rank-blurb').textContent = r.rank.blurb;
  $('xp-num').textContent = String(s.xp);
  if (r.isTop) {
    $('next-title').textContent = 'You have reached the top rank in this campaign.';
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

  // Skills
  $('skills').replaceChildren(
    ...COMPETENCIES.map((c) => {
      const m = career.mastery(s, c.id);
      const bar = h('div', { class: 'bar', role: 'progressbar', 'aria-label': `${c.name} mastery`, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(m.score) }, Object.assign(h('div'), { style: `width:${m.score}%` }));
      return h('div', { class: 'skill' }, h('div', { class: 'skill-top' }, h('span', { text: c.name }), h('span', { text: m.attempted ? `${m.score}/100 · ${m.attempted} of ${m.count} missions` : `Not started · 0 of ${m.count} missions` })), h('small', { text: c.blurb }), bar);
    })
  );

  // Campaign map
  const camp = $('campaign');
  camp.replaceChildren();
  for (const tier of TIERS) {
    const list = MISSIONS.filter((m) => m.tier === tier.id && !m.exam);
    const exams = MISSIONS.filter((m) => m.tier === tier.id && m.exam);
    if (!list.length && !exams.length) continue;
    camp.append(h('p', { class: 'tier', text: `${tier.name} (${career.passedCount(s, tier.id)} of ${career.tierTotal(tier.id)} passed)` }));
    const wrap = h('div', { class: 'missions' });
    for (const m of [...list, ...exams]) wrap.append(missionCard(s, m));
    camp.append(wrap);
  }

  // Roadmap
  $('roadmap').replaceChildren(...ROADMAP.map((x) => h('li', {}, h('strong', { text: x.title }), x.note)));

  renderPortfolio(s);
  $('code-box').value = career.exportCode(s);
}

function missionCard(s, m) {
  const st = career.missionStatus(s, m.id);
  const badge = st.medal > 0 && st.passed ? h('span', { class: `badge m${st.medal}`, text: MEDALS[st.medal] }) : st.attempts > 0 ? h('span', { class: 'badge fail', text: m.exam ? 'Not passed' : 'No medal yet' }) : st.unlocked ? h('span', { class: 'badge', text: 'New' }) : h('span', { class: 'badge', text: 'Locked' });
  const card = h(
    'div',
    { class: `mission${st.unlocked ? '' : ' locked'}${m.exam ? ' exam' : ''}` },
    h('div', { class: 'mission-top' }, h('div', {}, h('h3', { text: m.title }), h('p', { text: m.blurb })), badge),
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
        h('summary', {}, h('span', {}, p.mission.title, h('small', { text: `${p.medal} · ${pct(p.bestPerf)} of full marks · ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}` })), h('span', { class: `badge m${p.tier}`, text: p.medal })),
        h(
          'div',
          { class: 'inner' },
          cmp ? h('p', { class: 'compare', text: `First attempt ${pct(cmp.first.perf)}, latest ${pct(cmp.latest.perf)}${cmp.latest.perf > cmp.first.perf ? ': you have improved.' : '.'}` }) : null,
          h('pre', { text }),
          copy
        )
      )
    );
  }
}

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

render();
