// Writes supabase/rootline/002_missions.sql from the game's own mission list, so the server's idea of what a medal
// is worth can never drift from the game's. Run it after adding or changing a mission:
//   node tools/gen-rl-missions.mjs
// The test in tests/games/accounts.test.mjs fails if the committed file is out of date.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { missionRows, missionsSql } from '../public/games/core/sync.js';

const out = fileURLToPath(new URL('../supabase/rootline/002_missions.sql', import.meta.url));
writeFileSync(out, missionsSql(missionRows()));
console.log(`Wrote ${missionRows().length} missions to ${out}`);
