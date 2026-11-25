import { defineConfig } from 'astro/config';

// Fully static output: every page is built ahead of time, so it can be hosted
// anywhere that serves files (Vercel, Cloudflare Pages, GitHub Pages...).
//
// `site` is the address canonical links and the sitemap use. When a custom
// domain is connected, change it here, in src/data/company.ts (siteUrl) and in
// public/robots.txt.
//
// The old FitNFree and company addresses redirect to their new homes. On
// Vercel the same redirects are real 301s (see vercel.json); these cover other
// hosts and `astro preview`. The legal and support addresses under /fitnfree/
// are NOT redirected: app-store listings and the app link to them.
export default defineConfig({
  site: 'https://lix-team-site.vercel.app',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/fitnfree': '/products/fitnfree/',
    '/company': '/about/',
  },
});
