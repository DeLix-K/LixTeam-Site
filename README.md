# LixTeam site

The LixTeam company website: the company, the product portfolio, and one page per product.

```
/                           LixTeam home
/products/                  Product directory (reads src/data/products.ts)
/products/fitnfree/         FitNFree product page
/products/rootline/         ROOTLINE product page (the game itself is at /games/)
/about/                     About the company
/contact/                   Contact (mailto links, there is no form backend)
/fitnfree/support/          FitNFree help and contact
/fitnfree/privacy/          Privacy Policy
/fitnfree/terms/            Terms & Conditions
/fitnfree/delete-account/   Account deletion instructions
/games/                     ROOTLINE (static game pages)
/radar/                     Opportunity Radar early-access list (a demand test)
```

The old addresses `/fitnfree/` and `/company/` redirect to `/products/fitnfree/` and `/about/` (301 on Vercel, see
`vercel.json`). The legal and support addresses under `/fitnfree/` are deliberately not redirected: the App Store
listing and the app link to them.

Built with [Astro](https://astro.build). It is fully static: `npm run build` produces plain files in `dist/`
that any static host can serve.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # writes dist/
```

## Change company details

Edit `src/data/company.ts` (name, tagline, contact email, year, site URL). Every page picks it up. Company facts
that are not confirmed yet (legal name, founding year, location, team size) are `null` there and stay hidden on the
About page until you fill them in. Only fill in what is true.

## Add a product to the portfolio

The home page, the product directory, the footer and the sitemap are generated from `src/data/products.ts`. Add
one entry: name, slug, category, summary, three benefits, a status (`available`, `in-development` or
`coming-soon`) that says where it really is today, images, a call to action, an accent colour and a theme. Set
`show: false` to hide a product without deleting it. Cards and the directory need nothing else. A product that
gets its own page also needs a file in `src/pages/products/` (copy `rootline.astro`).

The design system is `src/styles/lt.css` (tokens at the top, everything prefixed `lt-`, product themes at the
bottom). Fonts are Geist and Geist Mono, self-hosted from npm, so the Content Security Policy needs no change.
Social sharing images are `public/og*.png` (1200x630).

## Domain

`site` in `astro.config.mjs`, `siteUrl` in `src/data/company.ts` and the sitemap line in `public/robots.txt`
all use the Vercel address today. Change all three when a custom domain is connected.

## Contact

There is no form backend. The Contact page opens the visitor's email app with a subject filled in. A real form
needs a service to receive it (for example Formspree, Resend or a Supabase Edge Function) and the site's
Content Security Policy `form-action` / `connect-src` updated to allow it.

## Add a new app

1. Copy `src/apps/fitnfree` to `src/apps/<new-slug>`.
2. In `app.ts`, fill in the name, tagline, features, screenshots, pricing (or `null`), FAQs and support topics.
   Put the app icon and screenshots in `src/assets/<new-slug>/`.
3. Replace the three legal files in `legal/` with that app's own. **Each app needs its own privacy policy**:
   what it says depends on what that app collects.
4. Add the app to the list in `src/data/apps.ts`.

The home page card and all of the app's pages are then generated automatically.

## Store links

Set `stores.ios.url` and `stores.android.url` in the app's `app.ts` once the app is live. While a link is `null`,
the page shows a "Coming soon" button.

## Before going live

- Buy the domain, then set `site` in `astro.config.mjs`.
- Read the legal pages carefully. They are drafts and not legal advice.
- Keep the old legal addresses working (or redirect them) until the app-store listings and the in-app links have
  been updated to the new ones.
