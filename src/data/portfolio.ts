// The LixTeam portfolio. The home page, the company page and the footer are all
// generated from this list, so adding a new business or product is one entry
// here (plus a visual, if you want one). Keep every claim true: a status says
// where the product really is today.
//
// tone: 'live'  = people can use it now
//       'test'  = validating demand, not built yet
//       'next'  = an open slot, shown as a placeholder
export type Product = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  summary: string;
  facts: string[];
  status: { label: string; tone: 'live' | 'test' | 'next' };
  accent: string; // any CSS colour
  links: { label: string; href: string; primary?: boolean; external?: boolean }[];
  visual: 'fitnfree' | 'rootline' | 'radar' | 'next';
  // Set to false to hide a product from the public pages without deleting it.
  show: boolean;
};

export const products: Product[] = [
  {
    id: 'fitnfree',
    name: 'FitNFree',
    category: 'Health & fitness',
    tagline: 'Your AI health companion.',
    summary:
      'Workouts, nutrition, sleep and recovery in one app that adapts to how you are actually doing, instead of four apps you have to juggle.',
    facts: [
      'An AI coach that reads your sleep, mood and streak before it speaks',
      'Meal logging backed by USDA nutrition data',
      'No ads and no ad trackers',
    ],
    status: { label: 'Live on iPhone', tone: 'live' },
    accent: '#a3e635',
    links: [
      { label: 'Get it on the App Store', href: 'https://apps.apple.com/app/id6809598004', primary: true, external: true },
      { label: 'Product page', href: '/fitnfree/' },
    ],
    visual: 'fitnfree',
    show: true,
  },
  {
    id: 'rootline',
    name: 'ROOTLINE',
    category: 'Security training',
    tagline: 'Cyber security you play, not read.',
    summary:
      'A free browser game where you work simulated incidents with real tools and a moving clock, then climb a career ladder of missions, skills and ranks.',
    facts: [
      '11 simulated workplaces, from a SOC to a water plant',
      '10 career paths, each with its own ranks',
      'Free, no sign-up, progress stays on your device',
    ],
    status: { label: 'Playable now', tone: 'live' },
    accent: '#38bdf8',
    links: [
      { label: 'Play free', href: '/games/', primary: true },
      { label: 'Privacy', href: '/games/privacy/' },
    ],
    visual: 'rootline',
    show: true,
  },
  {
    id: 'radar',
    name: 'Opportunity Radar',
    category: 'Market intelligence',
    tagline: 'See what to build next, with the evidence.',
    summary:
      'Search trends, reviews and forum conversations read together as one picture: the gaps in a market, ranked, with a source behind every claim.',
    facts: [
      'Ideas, product gaps and niches in one place',
      'Every finding links to the post or review it came from',
      'A working name; we are testing demand first',
    ],
    status: { label: 'Early access list', tone: 'test' },
    accent: '#a78bfa',
    links: [{ label: 'Join the early-access list', href: '/radar/', primary: true }],
    visual: 'radar',
    show: true,
  },
  {
    id: 'next',
    name: 'The next one',
    category: 'In the lab',
    tagline: 'Room for what comes next.',
    summary:
      'New businesses and technologies are tested the same way every time: a clear question, a small experiment, and a decision based on what people actually do.',
    facts: [],
    status: { label: 'Open slot', tone: 'next' },
    accent: '#fbbf24',
    links: [{ label: 'Pitch us something', href: 'mailto:teamlix6@gmail.com?subject=Idea%20for%20LixTeam', external: true }],
    visual: 'next',
    show: true,
  },
];

export const visibleProducts = products.filter((p) => p.show);
