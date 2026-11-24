# LixTeam site

The LixTeam company website: who we are, the product portfolio, and one section per product. Each app lives
under its own path:

```
/                       LixTeam home (company story and the portfolio)
/company/               About the company
/fitnfree/              FitNFree landing page
/fitnfree/support/      Help and contact
/fitnfree/privacy/      Privacy Policy
/fitnfree/terms/        Terms & Conditions
/fitnfree/delete-account/   Account deletion instructions
```

Built with [Astro](https://astro.build). It is fully static: `npm run build` produces plain files in `dist/`
that any static host can serve.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # writes dist/
```

## Change company details

Edit `src/data/company.ts` (name, tagline, contact email, year). Every page picks it up.

## Add a product to the portfolio

The home page, the company page and the footer are generated from `src/data/portfolio.ts`. Add one entry there
(name, category, tagline, summary, three facts, a status that says where it really is today, links). Set
`show: false` to hide a product without deleting it. A new product with its own pages (privacy, support) also
needs the steps below.

The design system lives in `src/styles/lt.css` (tokens at the top, everything prefixed `lt-`). Fonts are Geist and
Geist Mono, self-hosted from npm, so the site's Content Security Policy needs no change.

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
