import type { AppInfo } from '../../data/types';
import icon from '../../assets/fitnfree/icon.png';
import home from '../../assets/fitnfree/01-home.png';
import coach from '../../assets/fitnfree/02-coach.png';
import nutrition from '../../assets/fitnfree/03-nutrition.png';
import exercises from '../../assets/fitnfree/04-exercises.png';
import merch from '../../assets/fitnfree/05-merch.png';
import privacy from './legal/privacy.html?raw';
import terms from './legal/terms.html?raw';
import deleteAccount from './legal/delete-account.html?raw';

export const fitnfree: AppInfo = {
  slug: 'fitnfree',
  name: 'FitNFree',
  tagline: 'Your AI health companion',
  blurb:
    'Workouts, nutrition, sleep and recovery in one app that adapts to how you are actually doing.',
  icon,
  hero: {
    headline: 'Your AI health companion.',
    sub: 'Workouts, nutrition, sleep and recovery, all in one app that adapts to how you are actually doing, instead of four apps you have to juggle.',
  },
  webApp: { label: 'Try it on the web', url: 'https://fitnfree-lilac.vercel.app' },
  stores: {
    ios: { label: 'App Store', url: null },
    android: { label: 'Google Play', url: null },
  },
  features: [
    {
      icon: '🏋️',
      title: 'Train',
      points: [
        'Home, gym and outdoor plans built around the equipment you have',
        'Point your camera at gym equipment for an instant workout',
        'Real streaks, badges and weekly targets you set yourself',
        'Squad challenges and leaderboards to stay accountable',
      ],
    },
    {
      icon: '🥗',
      title: 'Eat',
      points: [
        'Food search backed by real USDA nutrition data',
        'Snap a meal for an instant calorie and macro estimate',
        'Scan a barcode to log packaged food',
        'Daily calorie and protein targets based on your own stats',
      ],
    },
    {
      icon: '🤖',
      title: 'AI Coach',
      points: [
        'A daily briefing that reads your sleep, mood and streak',
        'Post-workout insights from your actual logged activity',
        'Talk to your Coach by voice and hear replies read back',
        'Choose a style: Encouraging, Strict or Data-Focused',
      ],
    },
    {
      icon: '😴',
      title: 'Sleep & recovery',
      points: [
        'Log sleep manually or sync automatically from Oura',
        'Daily readiness score and sleep-debt tracking',
        'Breathwork, ambient sound and binaural beats to wind down',
        'Calming AI bedtime stories',
      ],
    },
    {
      icon: '🧘',
      title: 'Wellness & habits',
      points: [
        'Daily mood check-ins with an optional AI reflection',
        'A forgiving habit tracker with streak freezes, not harsh resets',
        'A free grounding tool for in-the-moment stress',
      ],
    },
    {
      icon: '🤝',
      title: 'Learn & connect',
      points: [
        'A library of guides and courses across five categories',
        'Chat with real trainers and book live sessions',
        'Official FitNFree merch shipped to your door',
      ],
    },
  ],
  screenshots: [
    { src: home, alt: 'FitNFree home screen with your streak and daily overview' },
    { src: coach, alt: 'FitNFree AI Coach conversation' },
    { src: nutrition, alt: 'FitNFree nutrition tracking screen' },
    { src: exercises, alt: 'FitNFree exercise library' },
    { src: merch, alt: 'FitNFree merch store' },
  ],
  pricing: {
    free: {
      title: 'Free',
      price: '$0',
      points: [
        'Core tracking: workouts, nutrition, sleep, habits',
        '5 AI actions a day',
        'Free starter guides in every category',
        'Streaks, challenges and the trainer marketplace',
      ],
    },
    premium: {
      title: 'Premium',
      price: '$9.99 / month',
      points: [
        'Unlimited AI Coach and scans',
        'The full library of programmes and courses, with new content added regularly',
        'Deeper insights',
        'Extra streak protection',
        'US price shown. Prices vary by country (for example £8.99 in the UK); the exact price appears in the app before you subscribe.',
      ],
    },
  },
  notice:
    'FitNFree gives general fitness and wellness information. It is not a doctor, therapist, dietitian or licensed trainer, and it is not medical advice. Speak to a professional before starting a new exercise or nutrition programme. For adults aged 16 and over.',
  faqs: [
    {
      q: 'Is FitNFree free?',
      a: 'Yes to start. You get core tracking, 5 AI actions a day and free starter guides. Premium is an optional monthly subscription that unlocks unlimited AI and the full library.',
    },
    {
      q: 'Where can I get it?',
      a: 'FitNFree is coming to the App Store and Google Play. A web app is available today.',
    },
    {
      q: 'How do I cancel Premium?',
      a: 'If you subscribed in the iPhone app, open Settings, tap your name, then Subscriptions. On Android, open Google Play, then Payments & subscriptions, then Subscriptions. For anything bought on the web, email us and we will sort it out.',
    },
    {
      q: 'Do you sell my data?',
      a: 'No. Most of your workout, sleep, mood and habit data is private to your account, and we do not use health data for advertising. The Privacy Policy explains exactly what we collect and who processes it.',
    },
    {
      q: 'How do I delete my account?',
      a: 'In the app, go to More, then Profile, then Danger Zone, then Delete My Account. It takes effect immediately. You can also email us. Deleting your account does not cancel an App Store or Google Play subscription, so cancel that separately.',
    },
    {
      q: 'Is the AI Coach medical advice?',
      a: 'No. It is a supportive tool for general fitness and wellness information, not a substitute for a doctor or other professional.',
    },
  ],
  support: {
    intro:
      'Need a hand with FitNFree? Start with the answers below, and email us if you are still stuck.',
    topics: [
      {
        q: 'I bought Premium but the app still shows the free plan',
        a: 'Go to More, then Profile, then Account, and tap Restore Purchases. Make sure you are signed in to the same FitNFree account and the same Apple ID or Google account you bought with.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'iPhone and iPad: Settings, tap your name, Subscriptions, FitNFree. Android: Google Play, Payments & subscriptions, Subscriptions, FitNFree. Deleting your FitNFree account does not cancel it.',
      },
      {
        q: 'I forgot my password',
        a: 'On the sign-in screen, choose Forgot password and follow the link we email you. If nothing arrives, check your spam folder or email us.',
      },
      {
        q: 'How do I delete my account and data?',
        a: 'Open the app, go to More, Profile, Danger Zone, then Delete My Account. If you cannot open the app, follow the steps on the Delete account page or email us from your account address.',
      },
      {
        q: 'How do I report or block someone in trainer chat?',
        a: 'Open the chat, tap the ••• menu at the top, then choose Report or Block. Blocking stops messages in both directions. We review reports.',
      },
      {
        q: 'Something is broken or wrong',
        a: 'Email us with what you were doing, what you expected, and what happened, plus your device and app version if you can. Screenshots help.',
      },
    ],
  },
  legal: { privacy, terms, deleteAccount },
  legalEffective: {
    privacy: 'October 4, 2026',
    terms: 'September 26, 2026',
    deleteAccount: 'September 26, 2026',
  },
};
