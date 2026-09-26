import { defineConfig } from 'astro/config';

// Fully static output: every page is built ahead of time, so it can be hosted
// anywhere that serves files (Vercel, Cloudflare Pages, GitHub Pages...).
//
// Set `site` to the real domain once it's bought, e.g. 'https://lixteam.com'.
// It is left out for now so no page claims an address that doesn't exist yet.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
});
