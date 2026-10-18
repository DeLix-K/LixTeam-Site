// Builds the RootLine review pack: one self-contained HTML file with every scenario, answer and
// explanation in the game, laid out for an expert reviewer. Each item has a verdict and a comment box;
// the reviewer's notes are kept in their browser and can be exported to send back.
//
// Run:  node tools/build-review-pack.mjs
// Out:  docs/review-pack/rootline-review-pack.html   (not served by the site)

import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const G = (p) => import(pathToFileURL(path.join(root, 'public/games', p)).href);

const { MISSIONS, PATHS, TIERS, COMPETENCIES } = await G('core/missions.js');
const { SCENARIOS: PHISH } = await G('phish-or-legit/scenarios.js');
const { CASES: DET } = await G('cyber-detective/cases.js');
const { CASES: BR } = await G('breach-room/cases.js');
const { INCIDENTS: IC } = await G('incident-commander/incidents.js');
const { SIMS } = await G('simulation/sims.js');
const { SCENARIOS: SE } = await G('social-engineering/scenarios.js');
const { ESCAPES: ER } = await G('escape-room/escapes.js');

// ── helpers ─────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const p = (s) => (s ? `<p>${esc(s)}</p>` : '');
const paras = (a) => (Array.isArray(a) ? a : [a]).filter(Boolean).map(p).join('');
const tag = (cls, text) => `<span class="tag ${cls}">${esc(text)}</span>`;
const tick = (ok) => (ok ? tag('ok', 'Correct') : tag('no', 'Not correct'));
let itemCount = 0;
const items = []; // for the contents list

function item(id, title, meta, bodyHtml) {
  itemCount += 1;
  items.push({ id, title });
  return `
<section class="item" id="${esc(id)}" data-id="${esc(id)}">
  <header class="item-head">
    <h4>${esc(title)}</h4>
    <div class="meta">${meta}</div>
  </header>
  <div class="item-body">${bodyHtml}</div>
  <div class="review" data-review="${esc(id)}">
    <div class="verdicts" role="radiogroup" aria-label="Verdict for ${esc(title)}">
      <label><input type="radio" name="v-${esc(id)}" value="ok"> Accurate</label>
      <label><input type="radio" name="v-${esc(id)}" value="minor"> Minor edit</label>
      <label><input type="radio" name="v-${esc(id)}" value="change"> Needs change</label>
      <label><input type="radio" name="v-${esc(id)}" value="remove"> Remove</label>
      <label><input type="radio" name="v-${esc(id)}" value="skip"> Outside my area</label>
    </div>
    <textarea rows="2" placeholder="Comments: what is wrong or unclear, and what it should say instead"></textarea>
  </div>
</section>`;
}

// ── renderers for each kind of content ──────────────────────────
function renderDetective(c) {
  const lines = (a) =>
    `<ul class="lines">${a.lines
      .map((l) => `<li class="${l.type}"><span class="lt">${l.type === 'clue' ? 'CLUE' : l.type === 'herring' ? 'red herring' : 'plain'}</span>${esc(l.text)}<em>${esc(l.note)}</em></li>`)
      .join('')}</ul>`;
  const opts = (arr) =>
    `<ul class="opts">${arr.map((o) => `<li class="${o.correct ? 'right' : ''}">${tick(o.correct)} ${esc(o.text)}<em>${esc(o.explain)}</em></li>`).join('')}</ul>`;
  return (
    paras(c.brief) +
    `<h5>Evidence</h5>` +
    c.artefacts.map((a) => `<div class="sub"><strong>${esc(a.title)}</strong>${a.unlockedBy ? ` <small>(opens after clue "${esc(a.unlockedBy)}")</small>` : ''}${lines(a)}</div>`).join('') +
    `<h5>Clues the case is built on</h5><ul>${Object.entries(c.clues).map(([k, v]) => `<li><b>${esc(k)}</b> (${esc(v.strength)}): ${esc(v.text)}</li>`).join('')}</ul>` +
    `<h5>What happened (answer options)</h5>${opts(c.solution.attack)}` +
    `<h5>Best first move</h5>${opts(c.solution.action)}` +
    `<h5>Story shown at the end</h5>${paras(c.story)}`
  );
}

function renderBreach(c) {
  const stageName = Object.fromEntries(c.stages.map((s) => [s.id, s.name]));
  return (
    paras(c.brief) +
    `<h5>Stages of the attack</h5><ol>${c.stages.map((s) => `<li><b>${esc(s.name)}</b> (${esc(s.desc)}): ${esc(s.story)}</li>`).join('')}</ol>` +
    `<h5>Evidence cards</h5><ul class="lines">${c.cards
      .map((k) => `<li class="${k.stage ? 'clue' : 'herring'}"><span class="lt">${esc(k.time)} · ${esc(k.source)} · ${k.stage ? esc(stageName[k.stage]) : 'NOISE'}</span>${esc(k.text)}<em>${esc(k.note)}</em></li>`)
      .join('')}</ul>` +
    `<h5>Questions</h5>${c.questions
      .map((q) => `<div class="sub"><strong>${esc(q.prompt)}</strong><ul class="opts">${q.options.map((o) => `<li class="${o.correct ? 'right' : ''}">${tick(o.correct)} ${esc(o.text)}<em>${esc(o.explain)}</em></li>`).join('')}</ul></div>`)
      .join('')}` +
    `<h5>Summary shown at the end</h5>${p(c.summary)}`
  );
}

function renderIncident(inc) {
  const state = { flags: JSON.parse(JSON.stringify(inc.initial.flags)), facts: {}, T: 0, threat: 0, disruption: 0, used: [] };
  const groups = {};
  for (const a of inc.actions) {
    let res = {};
    try {
      res = a.run(state) || {};
    } catch {
      res = {};
    }
    const g = a.group || 'Other';
    (groups[g] ||= []).push(
      `<li class="t-${esc(a.tag || '')}"><span class="lt">${esc(a.tag || '')}${a.ends ? ' · ends the game' : ''}</span><b>${esc(a.label)}</b> <small>${esc(a.hint || '')}</small><em>Result: ${esc(res.text || '')}${res.reveal ? ' Learned: ' + esc(Object.values(res.reveal).join(' ')) : ''}</em></li>`
    );
  }
  return (
    `<p><b>Role:</b> ${esc(inc.role)}. <b>Starts:</b> ${esc(inc.startClock)}.</p>` +
    paras(inc.brief) +
    `<h5>Actions the player can take</h5><p class="small">The tag shows how the game treats each move: key = needed, useful = helpful, weak = wasted effort, bad = harmful, overreact = disproportionate. Several actions only unlock after earlier ones.</p>` +
    Object.entries(groups).map(([g, li]) => `<div class="sub"><strong>${esc(g)}</strong><ul class="lines">${li.join('')}</ul></div>`).join('') +
    `<h5>Ratings</h5><ul>${inc.ratings.map((r) => `<li><b>${esc(r.name)}</b>: ${esc(r.blurb)}</li>`).join('')}</ul>` +
    `<h5>Debrief questions</h5>${inc.debrief.map((q) => `<div class="sub"><strong>${esc(q.question)}</strong><ul class="opts">${q.options.map((o) => `<li class="${o.correct ? 'right' : ''}">${tick(o.correct)} ${esc(o.text)}<em>${esc(o.explain)}</em></li>`).join('')}</ul></div>`).join('')}`
  );
}

function renderSim(s) {
  const out = [paras(s.brief)];
  for (const st of s.stages) {
    let h = `<div class="sub stage"><strong>Stage: ${esc(st.title)}</strong> <small>(${esc(st.type)})</small>${p(st.intro)}`;
    if (st.type === 'prioritise') {
      h += `<ol>${[...st.items].sort((a, b) => a.priority - b.priority).map((i) => `<li><b>${esc(i.source)}:</b> ${esc(i.text)}<em>${esc(i.why)}</em></li>`).join('')}</ol><p class="small">Listed in the order the game treats as correct.</p>`;
    } else if (st.type === 'allocate') {
      h += `<p class="small">Budget: ${esc(st.budget)} ${esc(st.unit)}. Ideal split shown.</p><ul>${st.items.map((i) => `<li><b>${esc(i.source)}</b> (ideal ${esc(i.ideal)}): ${esc(i.text)}<em>${esc(i.why)}</em></li>`).join('')}</ul>`;
    } else if (st.type === 'evidence') {
      h += `<ul class="lines">${(st.artefacts || []).flatMap((a) => a.lines.map((l) => `<li class="${l.type}"><span class="lt">${esc(a.title)} · ${l.type === 'clue' ? 'CLUE' : l.type === 'herring' ? 'red herring' : 'plain'}</span>${esc(l.text)}<em>${esc(l.note)}</em></li>`)).join('')}</ul>`;
    } else if (st.type === 'decision') {
      h += `${p(st.prompt)}<ul class="opts">${st.options.map((o) => `<li class="${o.quality === 3 ? 'right' : ''}">${tag(o.quality === 3 ? 'ok' : 'no', 'Quality ' + o.quality + ' of 3')} ${esc(o.text)}<em>Consequence: ${esc(o.consequence)}</em></li>`).join('')}</ul>`;
    } else if (st.type === 'review') {
      h += `<p class="small">${esc(st.draftIntro || '')}</p><ul class="opts">${st.statements.map((x) => `<li class="${x.sound ? 'right' : ''}">${tag(x.sound ? 'ok' : 'no', x.sound ? 'Sound' : 'Wrong or unsupported')} ${esc(x.text)}<em>${esc(x.why)}</em></li>`).join('')}</ul>`;
    } else if (st.type === 'report') {
      h += `<ul class="opts">${st.statements.map((x) => `<li class="${x.correct ? 'right' : ''}">${tag(x.correct ? 'ok' : 'no', x.correct ? 'Include' : 'Leave out')} ${x.when ? `<small>(only if you chose "${esc(x.when)}")</small> ` : ''}${esc(x.text)}<em>${esc(x.why)}</em></li>`).join('')}</ul>` +
        `<p class="small">Recommended next steps:</p><ul class="opts">${(st.actions || []).map((x) => `<li class="${x.correct ? 'right' : ''}">${tag(x.correct ? 'ok' : 'no', x.correct ? 'Include' : 'Leave out')} ${esc(x.text)}<em>${esc(x.why)}</em></li>`).join('')}</ul>`;
    } else if (st.type === 'triage') {
      h += `<ul>${(st.alerts || []).map((a) => `<li>${esc(a.text || a.title || a.id)} <em>Answer: ${esc(a.answer)}. ${esc(a.why || a.explain || '')}</em></li>`).join('')}</ul>`;
    } else {
      h += `<pre class="raw">${esc(JSON.stringify(st, null, 1).slice(0, 4000))}</pre>`;
    }
    out.push(h + '</div>');
  }
  out.push(`<h5>Ratings</h5><ul>${s.ratings.map((r) => `<li><b>${esc(r.name)}</b>: ${esc(r.blurb)}</li>`).join('')}</ul>`);
  return out.join('');
}

function renderPhish(s) {
  return (
    `<p><b>From:</b> ${esc(s.from?.name)} &lt;${esc(s.from?.addr)}&gt;<br><b>Subject:</b> ${esc(s.subject)}</p>` +
    (s.context ? `<p class="small">Context shown to the player: ${esc(s.context)}</p>` : '') +
    paras(s.body) +
    (s.link ? `<p class="small">Link shows: ${esc(s.link.text)}${s.link.href ? ` · really goes to: ${esc(s.link.href)}` : ''}</p>` : '') +
    (s.kind === 'phish'
      ? `<h5>Why it is a phish</h5><ul>${(s.flags || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
      : `<h5>Why it is safe</h5>${p(s.why)}`)
  );
}

function renderSE(s) {
  const nodes = Object.values(s.nodes);
  return (
    p(s.setting) +
    `<p><b>Best approach:</b> ${esc(s.ideal)}</p>` +
    `<h5>Tactics shown</h5><ul>${s.tactics.map((t) => `<li><b>${esc(t.name)}:</b> ${esc(t.desc)}</li>`).join('')}</ul>` +
    `<h5>The conversation</h5>` +
    nodes
      .map((n) => {
        const lines = (n.lines || []).map((l) => `<p class="line"><b>${esc(s.cast?.[l.who]?.name || (l.who === 'narr' ? 'Narration' : l.who))}:</b> ${esc(l.text)}</p>`).join('');
        const ch = (n.choices || []).map((c) => `<li class="t-${esc(c.tag)}"><span class="lt">${esc(c.tag)}</span>${esc(c.label)}<em>Coaching: ${esc(c.coach)}</em></li>`).join('');
        const end = n.end ? `<p class="endnode"><b>Ending (${esc(n.end.outcome)}): ${esc(n.end.title)}.</b> ${esc(n.end.text)}</p>` : '';
        return `<div class="sub node">${lines}${ch ? `<ul class="lines">${ch}</ul>` : ''}${end}</div>`;
      })
      .join('') +
    `<h5>Question at the end</h5><p>${esc(s.question.text)}</p><ul class="opts">${s.question.options.map((o) => `<li class="${o.correct ? 'right' : ''}">${tick(o.correct)} ${esc(o.text)}<em>${esc(o.explain)}</em></li>`).join('')}</ul>`
  );
}

function renderER(e) {
  return (
    p(e.premise) +
    e.rooms
      .map((r) => {
        const pz = r.puzzle;
        let body = `<p><b>${esc(r.title)}</b> (${esc(r.concept)}). ${esc(r.scene)}</p><ul class="lines">${(r.objects || []).map((o) => `<li class="${o.clue ? 'clue' : 'herring'}"><span class="lt">${o.clue ? 'CLUE' : 'red herring'}</span>${esc(o.label)}: ${esc(o.text)}</li>`).join('')}</ul><p><b>Puzzle (${esc(pz.type)}):</b> ${esc(pz.prompt)}</p>`;
        if (pz.options) body += `<ul class="opts">${pz.options.map((o) => `<li class="${o.correct ? 'right' : ''}">${o.correct !== undefined ? tick(o.correct) : ''} ${esc(o.text)}${o.detail ? ' <small>' + esc(o.detail) + '</small>' : ''}<em>${esc(o.explain || '')}</em></li>`).join('')}</ul>`;
        else if (pz.items) body += `<ul>${pz.items.map((i) => `<li>${esc(i.text)}${i.answer ? ' → ' + esc(i.answer) : ''}</li>`).join('')}</ul>`;
        else if (pz.settings) body += `<ul>${pz.settings.map((i) => `<li>${esc(i.text)} (safe setting: ${i.secure ? 'on' : 'off'})</li>`).join('')}</ul>`;
        if (pz.hints) body += `<p class="small">Hints: ${esc(pz.hints.join(' / '))}</p>`;
        if (pz.explain || pz.explanation) body += `<p><b>Explanation shown:</b> ${esc(pz.explain || pz.explanation)}</p>`;
        return `<div class="sub">${body}</div>`;
      })
      .join('')
  );
}

// ── assemble: by career path, then free practice ────────────────
const byMode = { simulation: SIMS, 'cyber-detective': DET, 'breach-room': BR, 'incident-commander': IC };
const render = { simulation: renderSim, 'cyber-detective': renderDetective, 'breach-room': renderBreach, 'incident-commander': renderIncident };
const modeLabel = { simulation: 'Incident Simulation', 'cyber-detective': 'Cyber Detective', 'breach-room': 'The Breach Room', 'incident-commander': 'Incident Commander', 'social-engineering': 'Social Engineering Simulator', 'phish-or-legit': 'Phish or Legit', 'escape-room': 'Cyber Escape Room' };
const used = new Set();
const tierName = Object.fromEntries(TIERS.map((t) => [t.id, t.name]));
const sections = [];

for (const path of PATHS) {
  const pm = MISSIONS.filter((m) => (TIERS.find((t) => t.id === m.tier)?.path || 'analyst') === path.id);
  let html = `<h2 class="path" id="path-${esc(path.id)}" style="--c:${esc(path.colour)}">${esc(path.name)}</h2><p class="lead">${esc(path.blurb)}</p>`;
  html += `<h3>Ranks on this path</h3><ol class="ranks">${path.ranks.map((r) => `<li><b>${esc(r.name)}.</b> ${esc(r.blurb)}</li>`).join('')}</ol>`;
  html += `<h3>Missions</h3>`;
  for (const m of pm) {
    const key = `${m.mode}:${m.ref}`;
    const meta = `${tag('mode', modeLabel[m.mode] || m.mode)} ${tag('tier', tierName[m.tier] || m.tier)}${m.exam ? ' ' + tag('exam', 'Promotion exam') : ''}`;
    const data = byMode[m.mode]?.find((x) => x.id === m.ref);
    const se = m.mode === 'social-engineering' ? SE.find((x) => x.id === m.ref) : null;
    if (m.kind === 'triage') {
      html += item(`m-${m.id}`, `${m.title}`, meta, `<p>This mission uses a set of Phish or Legit emails (reviewed in the practice section).</p>${p(m.blurb)}`);
      continue;
    }
    used.add(key);
    const body = `<p class="blurb"><b>Mission blurb:</b> ${esc(m.blurb)}</p>` + (data ? render[m.mode](data) : se ? renderSE(se) : '<p>(content not found)</p>');
    html += item(`m-${m.id}`, m.title, meta, body);
  }
  sections.push(html);
}

// free practice content
let free = `<h2 class="path" id="path-free" style="--c:#94a3b8">Free practice content</h2><p class="lead">Content that players can open from the home screen in free practice. Some of it also appears as missions above.</p>`;
free += `<h3>Phish or Legit (${PHISH.length} emails)</h3>` + PHISH.map((s) => item(`pl-${s.id}`, s.subject, tag('mode', s.kind === 'phish' ? 'Phish' : 'Legit') + ' ' + tag('tier', s.skill), renderPhish(s))).join('');
free += `<h3>Social Engineering scenarios (${SE.length})</h3>` + SE.filter((s) => !used.has(`social-engineering:${s.id}`)).map((s) => item(`se-${s.id}`, s.title, tag('mode', s.channel || 'Conversation'), renderSE(s))).join('');
free += `<h3>Cyber Escape Room (${ER.length})</h3>` + ER.map((e) => item(`er-${e.id}`, e.title, tag('mode', 'Escape room'), renderER(e))).join('');
for (const [mode, list] of Object.entries(byMode)) {
  const rest = list.filter((x) => !used.has(`${mode}:${x.id}`));
  if (rest.length) free += `<h3>${esc(modeLabel[mode])}: not used by a career mission (${rest.length})</h3>` + rest.map((x) => item(`f-${mode}-${x.id}`, x.title, tag('mode', modeLabel[mode]), render[mode](x))).join('');
}
sections.push(free);

const counts = {
  phish: PHISH.length, se: SE.length, er: ER.length, det: DET.length, br: BR.length, ic: IC.length, sim: SIMS.length, missions: MISSIONS.length, paths: PATHS.length,
};
const now = new Date().toISOString().slice(0, 10);

const css = `
:root{--bg:#fff;--fg:#111827;--mut:#4b5563;--line:#e5e7eb;--accent:#0f766e}
*{box-sizing:border-box}body{margin:0;font:15px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg)}
.wrap{max-width:900px;margin:0 auto;padding:24px 20px 80px}
h1{font-size:30px;margin:0 0 6px}h2.path{font-size:24px;margin:56px 0 4px;padding-top:18px;border-top:4px solid var(--c,#0f766e)}h3{font-size:19px;margin:30px 0 8px}h4{font-size:17px;margin:0}h5{font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:18px 0 6px}
p{margin:6px 0}.lead{color:var(--mut)}.small{font-size:13px;color:var(--mut)}small{color:var(--mut)}
.box{background:#f9fafb;border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin:16px 0}
.item{border:1px solid var(--line);border-radius:12px;margin:18px 0;overflow:hidden;break-inside:avoid-page}
.item-head{background:#f3f4f6;padding:10px 16px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between}
.item-body{padding:6px 16px 12px}.item.done .item-head{background:#dcfce7}.item.flag .item-head{background:#fee2e2}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:99px;border:1px solid var(--line);background:#fff;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.tag.ok{background:#dcfce7;color:#166534;border-color:#86efac}.tag.no{background:#fee2e2;color:#991b1b;border-color:#fca5a5}.tag.exam{background:#fef3c7;color:#92400e;border-color:#fcd34d}.tag.mode{background:#e0f2fe;color:#075985;border-color:#7dd3fc}
ul,ol{margin:6px 0;padding-left:22px}li{margin:5px 0}em{display:block;color:var(--mut);font-style:normal;font-size:13.5px;margin-top:1px}
ul.lines,ul.opts{list-style:none;padding-left:0}ul.lines li,ul.opts li{border-left:3px solid var(--line);padding:3px 0 3px 10px}
ul.lines li.clue,ul.opts li.right{border-left-color:#16a34a}ul.lines li.herring{border-left-color:#f59e0b}
.lt{display:inline-block;font-size:11px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-right:8px}
.sub{margin:10px 0;padding:8px 12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:8px}.line{margin:3px 0}.endnode{background:#fef9c3;padding:6px 10px;border-radius:6px}
pre.raw{white-space:pre-wrap;font-size:12px;background:#f3f4f6;padding:8px;border-radius:6px}
.review{border-top:1px solid var(--line);padding:10px 16px;background:#fcfcfd}.verdicts{display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:6px;font-size:14px}.verdicts label{cursor:pointer}
textarea{width:100%;font:inherit;padding:8px;border:1px solid #d1d5db;border-radius:8px}
.bar{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);padding:8px 20px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.bar input[type=text]{font:inherit;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px}.bar button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid #0f766e;background:#0f766e;color:#fff;cursor:pointer}.bar button.alt{background:#fff;color:#0f766e}
.toc a{display:inline-block;margin:2px 10px 2px 0}.toc h3{margin-top:12px}
@media print{.bar,.review textarea{display:none}.review{padding:4px 16px}.item{break-inside:auto}body{font-size:12px}.wrap{padding:0}}
`;

const js = `
(function(){
  var KEY='rootline-review-pack-v1';var data={};
  try{data=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){data={}}
  var meta=data.__meta||{reviewer:''};data.__meta=meta;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
  var secs=[].slice.call(document.querySelectorAll('.item'));
  function refresh(){
    var done=0,flag=0;
    secs.forEach(function(s){var r=data[s.dataset.id]||{};var v=r.v;s.classList.toggle('done',!!v&&v!=='change'&&v!=='remove');s.classList.toggle('flag',v==='change'||v==='remove');if(v)done++;if(v==='change'||v==='remove')flag++;});
    document.getElementById('prog').textContent=done+' of '+secs.length+' reviewed, '+flag+' flagged';
  }
  secs.forEach(function(s){
    var id=s.dataset.id;var r=data[id]||{};
    var ta=s.querySelector('textarea');ta.value=r.c||'';
    if(r.v){var rb=s.querySelector('input[value='+r.v+']');if(rb)rb.checked=true;}
    s.querySelectorAll('input[type=radio]').forEach(function(rb){rb.addEventListener('change',function(){data[id]=data[id]||{};data[id].v=rb.value;save();refresh();});});
    ta.addEventListener('input',function(){data[id]=data[id]||{};data[id].c=ta.value;save();});
  });
  var nm=document.getElementById('who');nm.value=meta.reviewer||'';nm.addEventListener('input',function(){meta.reviewer=nm.value;save();});
  function build(){
    var out={reviewer:meta.reviewer,exported:new Date().toISOString(),pack:'${now}',items:[]};
    secs.forEach(function(s){var r=data[s.dataset.id];if(r&&(r.v||r.c)){out.items.push({id:s.dataset.id,title:s.querySelector('h4').textContent,verdict:r.v||'',comment:r.c||''});}});
    return out;
  }
  function download(name,text,type){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
  document.getElementById('exp').addEventListener('click',function(){var o=build();download('rootline-review-'+(meta.reviewer||'reviewer').replace(/[^a-z0-9]+/gi,'-')+'.json',JSON.stringify(o,null,2),'application/json');});
  document.getElementById('expt').addEventListener('click',function(){var o=build();var L=['RootLine review','Reviewer: '+(o.reviewer||'(not given)'),'Exported: '+o.exported,''];o.items.forEach(function(i){L.push('['+(i.verdict||'no verdict').toUpperCase()+'] '+i.title+' ('+i.id+')');if(i.comment)L.push('   '+i.comment.replace(/\\n/g,'\\n   '));L.push('');});download('rootline-review.txt',L.join('\\n'),'text/plain');});
  document.getElementById('clr').addEventListener('click',function(){if(confirm('Clear all of your verdicts and comments from this browser?')){data={__meta:{reviewer:''}};save();location.reload();}});
  refresh();
})();
`;

const tocHtml = PATHS.map((x) => `<a href="#path-${x.id}">${esc(x.name)}</a>`).join('') + '<a href="#path-free">Free practice content</a>';

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RootLine review pack</title><style>${css}</style></head><body>
<div class="bar"><strong>RootLine review pack</strong><label>Your name <input type="text" id="who" placeholder="Reviewer name"></label><span id="prog" class="small"></span><button id="exp">Export my review (JSON)</button><button id="expt" class="alt">Export as text</button><button id="clr" class="alt">Clear my notes</button></div>
<div class="wrap">
<h1>RootLine review pack</h1>
<p class="lead">Every scenario, answer and explanation in the game, laid out for a security professional to check. Built on ${now} from the live content.</p>
<div class="box"><h3 style="margin-top:0">What we are asking you to do</h3>
<p>For each item, choose a verdict and add a comment if something is wrong. You do not have to review everything: use "Outside my area" for anything you would rather not judge. Your notes are saved in this browser as you type. When you finish, use <b>Export my review</b> and send us the file.</p>
<h5>What to look for</h5><ul>
<li><b>Factual accuracy:</b> terms, laws and numbers (for example data protection duties and the 72-hour notification window), and how the technology really works.</li>
<li><b>Is the "correct" answer really the best one?</b> Could a reasonable professional choose differently? Are any wrong options actually fine, or any "best" options debatable?</li>
<li><b>Fairness and realism:</b> would a real organisation behave this way, and do the consequences feel plausible?</li>
<li><b>Safety of the content:</b> the game is meant to teach judgement, not technique. Flag anything that reads like instructions for causing harm. All names, companies and addresses are fictional.</li>
<li><b>Tone and wording:</b> no blaming of individuals, plain language, UK spelling.</li></ul>
<h5>How the game scores things (so you know what the options mean)</h5>
<ul><li>In investigation games, <b>clues</b> are what a careful analyst should notice, <b>red herrings</b> look interesting but do not change the answer, and <b>plain</b> lines are background.</li>
<li>In Incident Commander, each action is tagged: key = needed, useful = helpful, weak = wasted effort, bad = harmful, overreact = disproportionate.</li>
<li>In simulations, decisions are graded 0 to 3 (3 is the best), and report statements are either supported by the evidence (include) or not (leave out).</li></ul></div>
<div class="box"><b>Contents:</b> ${counts.paths} career paths, ${counts.missions} missions; ${counts.phish} Phish or Legit emails, ${counts.det} detective cases, ${counts.br} breach cases, ${counts.ic} incidents, ${counts.sim} simulations, ${counts.se} social engineering scenarios and ${counts.er} escape rooms. ${itemCount} items to review.
<div class="toc"><h3>Jump to</h3>${tocHtml}</div></div>
${sections.join('\n')}
</div><script>${js}</script></body></html>`;

const outDir = path.join(root, 'docs', 'review-pack');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'rootline-review-pack.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out}\n${itemCount} items, ${(html.length / 1024 / 1024).toFixed(2)} MB`);
