# LixTeam site

One website for every app LixTeam publishes. Each app lives under its own path:

```
/                       LixTeam home (lists all apps)
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
