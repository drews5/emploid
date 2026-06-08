export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://emploid.com')
).replace(/\/$/, '');

export const SITE_NAME = 'emploid';

export const SITE_DESCRIPTION =
  'Emploid verifies active hiring signals, scores listing trust, and helps job seekers focus on jobs that are actually hiring.';

export const PAGE_METADATA = {
  home: {
    path: '/',
    title: 'emploid | Find jobs that are actually hiring',
    description: SITE_DESCRIPTION,
  },
  search: {
    path: '/search',
    title: 'Search jobs | emploid',
    description: 'Search verified job listings by role, company, skill, location, trust score, and pay.',
  },
  browse: {
    path: '/browse',
    title: 'Find Job | emploid',
    description: 'Browse active job listings with trust scores, pay filters, direct apply links, and posting freshness signals.',
  },
  tracker: {
    path: '/tracker',
    title: 'Application Tracker | emploid',
    description: 'Track saved jobs, applications, follow-ups, interviews, offers, and listing trust in one focused workspace.',
  },
  about: {
    path: '/about',
    title: 'About and methodology | emploid',
    description: 'Learn how Emploid evaluates job listing trust, posting quality, posting age, salary transparency, and hiring signals.',
  },
  blog: {
    path: '/blog',
    title: 'Job search resources | emploid',
    description: 'Read practical job-search guides and use tools for spotting ghost jobs, verifying listings, and prioritizing applications.',
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | emploid',
    description: 'Read how Emploid collects, uses, protects, and shares information for job search, resume, account, and tracker features.',
  },
  terms: {
    path: '/terms',
    title: 'Terms of Service | emploid',
    description: 'Read the terms that govern use of Emploid job search, application tracking, and related tools.',
  },
} as const;

export type LegacyPageId = keyof typeof PAGE_METADATA;
