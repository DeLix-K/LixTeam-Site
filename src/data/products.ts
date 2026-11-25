// The LixTeam product portfolio: the one place that says what we make.
//
// The home page, the products directory and the footer are all generated from
// this list. To add a product, add one entry. Keep every claim true: `status`
// says where the product really is today, and nothing here may promise a
// product that does not exist.
//
// status
//   available       people can use it now
//   in-development  being built, not usable yet
//   coming-soon     announced or being tested (an interest list), not built
import type { ImageMetadata } from 'astro';
import fitnfreeIcon from '../assets/fitnfree/icon.png';
import fitnfreeHome from '../assets/fitnfree/01-home.png';
import fitnfreeCoach from '../assets/fitnfree/02-coach.png';
import fitnfreeNutrition from '../assets/fitnfree/03-nutrition.png';
import fitnfreeExercises from '../assets/fitnfree/04-exercises.png';
import rootlineLanding from '../assets/rootline/landing.png';
import rootlineWorkspace from '../assets/rootline/workspace.png';

export type ProductStatus = 'available' | 'in-development' | 'coming-soon';
export type Cta = { label: string; href: string; external?: boolean };
export type Shot = { src: ImageMetadata; alt: string };

export type Product = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  /** One or two sentences, used on cards. */
  summary: string;
  /** The longer description, used on the product's own page. */
  description: string;
  status: ProductStatus;
  /** Overrides the default status wording (e.g. "Early access list"). */
  statusLabel?: string;
  /** Exactly three short benefits, shown on cards. */
  benefits: [string, string, string];
  /** A square logo or app icon, if the product has one. */
  logo?: ImageMetadata;
  /** The main image. */
  hero?: Shot;
  /** Extra images for galleries. */
  gallery: Shot[];
  features: { title: string; text: string }[];
  /** The main call to action. */
  cta: Cta;
  /** Where "View product" goes: its page on this site. null = no page yet. */
  page: string | null;
  /** The product's own accent colour, used on its card and page. */
  accent: string;
  /** Visual treatment of the product's card and page. */
  theme: 'fitnfree' | 'rootline' | 'neutral';
  /** Set to false to hide a product from every public page without deleting it. */
  show: boolean;
};

export const statusText: Record<ProductStatus, string> = {
  available: 'Available',
  'in-development': 'In development',
  'coming-soon': 'Coming soon',
};

export const products: Product[] = [
  {
    slug: 'fitnfree',
    name: 'FitNFree',
    category: 'Fitness & wellness',
    tagline: 'Your fitness and wellness journey, brought together.',
    summary:
      'An AI-powered app for workouts, nutrition, sleep and daily habits, with a coach that reads how you are doing before it speaks.',
    description:
      'FitNFree brings training, food, sleep and mood into one app that adapts to how you are actually doing, instead of four apps you have to juggle.',
    status: 'available',
    statusLabel: 'On the App Store',
    benefits: [
      'AI coach that adapts to your sleep, mood and streak',
      'Log meals with a photo, a barcode or a search',
      'Free to start, no ads',
    ],
    logo: fitnfreeIcon,
    hero: { src: fitnfreeHome, alt: 'FitNFree home screen with the daily overview and streak' },
    gallery: [
      { src: fitnfreeCoach, alt: 'FitNFree AI coach conversation' },
      { src: fitnfreeNutrition, alt: 'FitNFree nutrition tracking' },
      { src: fitnfreeExercises, alt: 'FitNFree exercise library' },
    ],
    features: [],
    cta: { label: 'Download on the App Store', href: 'https://apps.apple.com/us/app/fitnfree/id6809598004', external: true },
    page: '/products/fitnfree/',
    accent: '#a3e635',
    theme: 'fitnfree',
    show: true,
  },
  {
    slug: 'rootline',
    name: 'ROOTLINE',
    category: 'Cybersecurity training',
    tagline: 'Learn cybersecurity by doing, not just watching.',
    summary:
      'A free, browser-based cyber range where you investigate simulated incidents with real tools and a moving clock, then climb a ladder of missions and ranks.',
    description:
      'ROOTLINE is a hands-on cybersecurity simulator and learning game. It feels like an operations floor, not a course: you search the evidence, decide what matters, respond, and report.',
    status: 'available',
    statusLabel: 'Playable now',
    benefits: [
      '11 simulated workplaces, from a SOC to a water plant',
      '10 career paths and 133 missions, with XP, ranks and medals',
      'Free to play, no account needed',
    ],
    hero: { src: rootlineWorkspace, alt: 'ROOTLINE hands-on cyber workspace with the case files list' },
    gallery: [{ src: rootlineLanding, alt: 'ROOTLINE home with its two games' }],
    features: [],
    cta: { label: 'Play ROOTLINE free', href: '/games/' },
    page: '/products/rootline/',
    accent: '#3b82f6',
    theme: 'rootline',
    show: true,
  },
  {
    slug: 'opportunity-radar',
    name: 'Opportunity Radar',
    category: 'Market intelligence',
    tagline: 'See what to build next, with the evidence.',
    summary:
      'A working name for a tool that reads search trends, reviews and forum conversations together and ranks the gaps in a market. We are testing demand first.',
    description:
      'Opportunity Radar is not built yet. We are collecting an early-access list to learn whether people want it before we write the product.',
    status: 'coming-soon',
    statusLabel: 'Early access list',
    benefits: [
      'Ideas, product gaps and niches in one place',
      'A source behind every finding',
      'Built only if enough people want it',
    ],
    gallery: [],
    features: [],
    cta: { label: 'Join the early-access list', href: '/radar/' },
    page: '/radar/',
    accent: '#a78bfa',
    theme: 'neutral',
    show: true,
  },
];

export const visibleProducts = products.filter((p) => p.show);
/** Products people can use today. */
export const liveProducts = visibleProducts.filter((p) => p.status === 'available');
/** Products that are being built or tested but are not usable yet. */
export const upcomingProducts = visibleProducts.filter((p) => p.status !== 'available');
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
