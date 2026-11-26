// Everything that is about the company, not any one product. Change it here and
// every page picks it up.
export const company = {
  name: 'LixTeam',
  // Used in canonical links, the sitemap and link previews. Change it when a
  // custom domain is connected (also update public/robots.txt).
  siteUrl: 'https://lix-team-site.vercel.app',
  tagline: 'A growing technology company building digital products.',
  // One-sentence description for search engines and link previews.
  description:
    'LixTeam is a growing technology company building digital products across fitness, wellness, cybersecurity and emerging technology.',
  // Temporary: this is the contact address in use today. Replace it with a
  // company address when one exists.
  contactEmail: 'teamlix6@gmail.com',
  year: 2026,
  // Official profiles, shown in the footer and on the Contact page. Plain
  // profile addresses only: no tracking parameters.
  socials: [
    { name: 'Instagram', handle: '@lixpro.co', href: 'https://www.instagram.com/lixpro.co' },
    { name: 'TikTok', handle: '@lixteam.com', href: 'https://www.tiktok.com/@lixteam.com' },
    { name: 'YouTube', handle: '@lixdeteam', href: 'https://www.youtube.com/@lixdeteam' },
    { name: 'Facebook', handle: 'LixDeTeam', href: 'https://www.facebook.com/LixDeTeam/' },
    { name: 'Threads', handle: '@lixpro.co', href: 'https://www.threads.com/@lixpro.co' },
  ],
  // Facts we have not confirmed yet. Fill one in and it appears on the About
  // page; leave it null and nothing is shown. Never state one that is not true.
  facts: {
    legalName: null as string | null, // e.g. 'LixTeam Ltd', only once it is incorporated
    founded: null as string | null,
    location: null as string | null,
    team: null as string | null,
  },
};
