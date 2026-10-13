import * as profile from './core/profile.js';
import * as career from './core/career.js';

const $ = (id) => document.getElementById(id);

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids) if (kid) el.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  return el;
}

// The free-practice modes. The career campaign (career/) uses these same modes as missions.
const MODES = [
  { n: 1, name: 'Phish or Legit', blurb: 'Judge emails, calls and everyday choices, say how sure you are, learn the red flags.', href: 'phish-or-legit/' },
  { n: 2, name: 'Incident Commander', blurb: 'An incident unfolds and your choices change what happens next.', href: 'incident-commander/' },
  { n: 3, name: 'Cyber Detective', blurb: 'Collect clues from headers, URLs and logs, then name the attack.', href: 'cyber-detective/' },
  { n: 4, name: 'Social Engineering Simulator', blurb: 'Talk to people who are not who they say they are.', href: 'social-engineering/' },
  { n: 5, name: 'Cyber Escape Room', blurb: 'Solve connected security puzzles to protect the vault.', href: 'escape-room/' },
  { n: 6, name: 'The Breach Room', blurb: 'Reconstruct how an organisation was compromised.', href: 'breach-room/' },
  { n: 7, name: 'Incident Simulation', blurb: 'Work a whole incident from the first alert to the final report.', href: 'simulation/' },
];

function renderCareer() {
  const s = career.load();
  const r = career.rankOf(s);
  const started = s.attempts.length > 0;
  $('career-rank').textContent = r.rank.name;
  $('career-line').textContent = started
    ? r.isTop
      ? 'You have reached the top rank in this campaign.'
      : `${s.xp} XP. Next: ${r.next.name}.`
    : 'Start as a Recruit and work up to SOC Analyst by solving realistic cases.';
  $('career-btn').textContent = started ? 'Continue your career' : 'Start your career';
}

function render() {
  renderCareer();
  const p = profile.load();
  const info = profile.levelInfo(p.xp);

  $('p-level').textContent = String(info.level);
  $('p-xp').textContent = `${p.xp} XP`;
  $('p-next').textContent = `${info.to - p.xp} to level ${info.level + 1}`;
  $('p-bar').style.width = `${Math.round(info.progress * 100)}%`;
  $('p-streak').textContent = String(p.daily.total || 0);

  // Daily mission
  const done = profile.dailyDone();
  const due = profile.dueItems().length;
  $('daily').classList.toggle('done', done);
  $('daily-text').textContent = done
    ? 'Done for today. Come back whenever you like for the next one.'
    : due > 0
      ? `Five quick emails, about two minutes. ${Math.min(due, 5)} are ideas you missed before, so they stick.`
      : 'Five quick emails. About two minutes.';
  $('daily-btn').textContent = done ? 'Play again' : 'Start';
  if (done) $('daily-btn').classList.remove('primary');
  else $('daily-btn').classList.add('primary');

  // Modes
  const modes = $('modes');
  modes.replaceChildren();
  for (const m of MODES) {
    const inner = [
      h('span', { class: 'num', text: String(m.n) }),
      h('div', {}, h('h3', { text: m.name }), h('p', { text: m.blurb })),
      h('span', { class: m.href ? 'tag play' : 'tag', text: m.href ? 'Play' : 'Coming soon' }),
    ];
    modes.append(m.href ? h('a', { class: 'mode', href: m.href }, ...inner) : h('div', { class: 'mode soon' }, ...inner));
  }

  // Skills
  const skills = $('skills');
  skills.replaceChildren();
  let anySeen = false;
  for (const s of profile.SKILLS) {
    const rec = p.skills[s.id] || { seen: 0, correct: 0 };
    const acc = profile.skillAccuracy(s.id);
    if (rec.seen) anySeen = true;
    const bar = h('div', { class: 'progress' }, h('div', {}));
    bar.firstChild.style.width = `${acc ?? 0}%`;
    skills.append(
      h(
        'div',
        { class: 'skill' },
        h('div', { class: 'skill-top' }, h('span', { text: s.name }), h('span', { text: acc === null ? 'Not played yet' : `${acc}% · ${rec.seen} answered` })),
        h('small', { text: s.blurb }),
        bar
      )
    );
  }
  $('skills-sub').hidden = anySeen;
}

$('reset-btn').addEventListener('click', () => {
  if (confirm('Reset your level, XP, streak and skill history on this device?')) {
    profile.reset();
    render();
  }
});

render();
