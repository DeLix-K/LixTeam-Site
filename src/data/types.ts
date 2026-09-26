import type { ImageMetadata } from 'astro';

export type Feature = { icon: string; title: string; points: string[] };
export type Faq = { q: string; a: string };
export type Screenshot = { src: ImageMetadata; alt: string };

// Where a person can get the app. A null url means "not available yet" and the
// page shows a "Coming soon" button instead of a link.
export type StoreLink = { label: string; url: string | null };

// One entry per app. To add an app, copy src/apps/fitnfree, fill this in, add
// its legal pages, and list it in src/data/apps.ts. Nothing else changes: the
// home page card and the app's pages (/<slug>/, /privacy/, /terms/, /support/,
// /delete-account/) are generated from this.
export type AppInfo = {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  icon: ImageMetadata;
  hero: { headline: string; sub: string };
  webApp: { label: string; url: string } | null;
  stores: { ios: StoreLink; android: StoreLink };
  features: Feature[];
  screenshots: Screenshot[];
  pricing: {
    free: { title: string; price: string; points: string[] };
    premium: { title: string; price: string; points: string[] };
  } | null;
  notice: string;
  faqs: Faq[];
  support: { intro: string; topics: Faq[] };
  // Raw HTML for each legal page, kept as files next to the app.
  legal: { privacy: string; terms: string; deleteAccount: string };
  legalEffective: { privacy: string; terms: string; deleteAccount: string };
};
