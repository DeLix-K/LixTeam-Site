// A light list of the workspace assignments, for pages that should not load every scenario (the ROOTLINE landing page
// and the Level Up home). The difficulty is the author's judgement of how much a first-time player has to hold in
// their head. tests/games/shell.test.mjs checks that this list matches the real scenarios, so the two cannot drift.

export const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced'];

export const CATALOG = [
  { id: 'soc-invoice', difficulty: 0, minutes: 25 },
  { id: 'se-servicedesk', difficulty: 0, minutes: 20 },
  { id: 'dfir-laptop', difficulty: 1, minutes: 25 },
  { id: 'net-flat', difficulty: 1, minutes: 25 },
  { id: 'vm-patch', difficulty: 1, minutes: 25 },
  { id: 'grc-audit', difficulty: 1, minutes: 25 },
  { id: 'cloud-bucket', difficulty: 2, minutes: 25 },
  { id: 'ti-papertrail', difficulty: 2, minutes: 25 },
  { id: 'pt-lab', difficulty: 2, minutes: 30 },
  { id: 'eng-tickets', difficulty: 2, minutes: 28 },
  { id: 'ot-plant', difficulty: 2, minutes: 30 },
];

export const difficultyOf = (id) => {
  const c = CATALOG.find((x) => x.id === id);
  return c ? DIFFICULTY[c.difficulty] : '';
};
