// Runs every game test, one file at a time, and fails if any of them does.
//   npm run test:games
// These are plain Node scripts with no dependencies. They check the rules of each game
// mode, the career system, and that every case, mission and exam in the data is well formed.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort();
let failed = 0;

for (const file of files) {
  const r = spawnSync(process.execPath, [dir + file], { encoding: 'utf8' });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const summary = out.split('\n').reverse().find((l) => /^\d+ passed$/.test(l.trim())) || 'no result line';
  const bad = out.split('\n').filter((l) => /^\s*FAIL\b/.test(l));
  const ok = r.status === 0 && !bad.length && /passed/.test(summary);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${file.replace('.test.mjs', '').padEnd(22)} ${summary.trim()}`);
  if (!ok) {
    failed += 1;
    for (const l of bad) console.log('      ' + l.trim());
    if (r.status !== 0 && !bad.length) console.log(out.split('\n').slice(-12).join('\n'));
  }
}

console.log(failed ? `\n${failed} of ${files.length} test files failed` : `\nAll ${files.length} test files passed`);
process.exit(failed ? 1 : 0);
