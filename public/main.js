'use strict';

function ensureFilsonProLoaded() {
  const showHeroText = () => {
    document.documentElement.classList.add('filson-pro-loaded');
  };

  if (!document.fonts) {
    showHeroText();
    return;
  }

  document.fonts.load('1em "Filson Pro"').then(() => {
    showHeroText();
  }).catch(() => {
    showHeroText();
  });
}

function initHomeInteractions() {
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  const tabs = document.querySelectorAll('.showcase-tab');
  const panels = document.querySelectorAll('.showcase-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const index = tab.getAttribute('data-tab');
      tabs.forEach((item) => item.classList.remove('active'));
      panels.forEach((panel) => panel.classList.remove('active'));
      tab.classList.add('active');
      const activePanel = document.getElementById(`showcase-panel-${index}`);
      if (activePanel) activePanel.classList.add('active');
    });
  });
}

const LOCATIONS = ['Minneapolis, MN', 'Chicago, IL', 'Remote', 'Austin, TX', 'New York, NY', 'Seattle, WA'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const PREVIEW_LISTINGS = [];

const TRACKER_STAGES = ['Applied', 'Reviewing', 'Interview', 'Offer'];

const DEFAULT_TRACKER_APPLICATIONS = [
  {
    id: 'adobe-product',
    role: 'Associate Product Designer',
    company: 'Adobe',
    source: 'Company Direct',
    appliedDaysAgo: 3,
    stage: 'Interview',
    status: 'needs-action',
    trustScore: 96,
    location: 'Remote',
    salary: '$98k-$122k',
    lastActivity: 'Recruiter replied 6h ago',
    nextAction: 'Send panel availability and 2 portfolio samples before tonight.',
    actionLabel: 'Reply today',
    secondaryAction: 'Prep brief',
    tags: ['Direct company link', 'Hiring contact replied', 'Portfolio requested'],
    interviewsThisWeek: true
  },
  {
    id: 'spotify-growth',
    role: 'Growth Marketing Analyst',
    company: 'Spotify',
    source: 'LinkedIn',
    appliedDaysAgo: 12,
    stage: 'Reviewing',
    status: 'active',
    trustScore: 91,
    location: 'Hybrid',
    salary: '$88k-$110k',
    lastActivity: 'Application viewed yesterday',
    nextAction: 'Hold until Friday, then send one short follow-up if there is still no response.',
    actionLabel: 'Set follow-up',
    secondaryAction: 'Open listing',
    tags: ['High trust listing', 'Direct employer page found', 'No recruiter yet'],
    interviewsThisWeek: false
  },
  {
    id: 'airbnb-research',
    role: 'UX Research Intern',
    company: 'Airbnb',
    source: 'Company Direct',
    appliedDaysAgo: 5,
    stage: 'Reviewing',
    status: 'interview',
    trustScore: 89,
    location: 'Remote',
    salary: '$42/hr',
    lastActivity: 'Recruiter screen booked for Thursday',
    nextAction: 'Review case-study stories and prep three questions about scope.',
    actionLabel: 'Prep interview',
    secondaryAction: 'View timeline',
    tags: ['Interview scheduled', 'Hiring team active', 'High-trust role'],
    interviewsThisWeek: true
  },
  {
    id: 'target-finance',
    role: 'Corporate Finance Intern',
    company: 'Target',
    source: 'Handshake',
    appliedDaysAgo: 9,
    stage: 'Applied',
    status: 'needs-action',
    trustScore: 73,
    location: 'Minneapolis, MN',
    salary: '$29/hr',
    lastActivity: 'No reply yet',
    nextAction: 'Follow up with the campus recruiter tomorrow morning while the role is still fresh.',
    actionLabel: 'Follow up',
    secondaryAction: 'Find contact',
    tags: ['Campus pipeline', 'Direct recruiter listed', 'Fresh posting'],
    interviewsThisWeek: false
  },
  {
    id: 'bestbuy-ops',
    role: 'Business Operations Analyst',
    company: 'Best Buy',
    source: 'Company Direct',
    appliedDaysAgo: 18,
    stage: 'Offer',
    status: 'offer',
    trustScore: 84,
    location: 'Hybrid',
    salary: '$82k-$96k',
    lastActivity: 'Offer came in this morning',
    nextAction: 'Compare compensation, ask about team structure, and request the deadline in writing.',
    actionLabel: 'Review offer',
    secondaryAction: 'Compare comp',
    tags: ['Offer stage', 'Direct company link', 'Real team opening'],
    interviewsThisWeek: false
  },
  {
    id: 'lyft-community',
    role: 'Community Partnerships Coordinator',
    company: 'Lyft',
    source: 'Indeed',
    appliedDaysAgo: 29,
    stage: 'Applied',
    status: 'archived',
    trustScore: 37,
    location: 'Chicago, IL',
    salary: '$58k-$68k',
    lastActivity: 'No activity for 29 days',
    nextAction: 'Archive this one and stop spending follow-up energy on a low-signal listing.',
    actionLabel: 'Archive',
    secondaryAction: 'View notes',
    tags: ['Low trust listing', 'Long silence', 'Likely stale'],
    interviewsThisWeek: false
  }
];

const TRACKER_REPLY_MOMENTUM = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 3 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 5, highlight: true },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 2 },
  { label: 'Sun', value: 1 }
];

const TRACKER_STORAGE_KEY = 'emploid-tracker-applications-v1';
const REACT_TRACKER_STORAGE_KEY = 'emploid-tracker-board-v2';
const RESUME_STORAGE_KEY = 'emploid-resume-profile-v1';
const AI_INSIGHTS_STORAGE_KEY = 'emploid-ai-insights-v1';
const AUTH_SESSION_STORAGE_KEY = 'emploid-auth-session-v1';
const AUTH_ACCOUNTS_STORAGE_KEY = 'emploid-auth-accounts-v1';
const AUTH_LAST_EMAIL_STORAGE_KEY = 'emploid-auth-last-email-v1';
const PREVIOUS_SEARCHES_STORAGE_KEY = 'emploid-prev-searches-v1';

const RESUME_ROLE_PROFILES = [
  {
    label: 'IT Intern',
    jobTitles: ['IT Support Intern', 'IT Operations Intern', 'Software Engineer'],
    terms: ['it support', 'help desk', 'ticketing', 'active directory', 'windows', 'hardware', 'network', 'troubleshooting']
  },
  {
    label: 'Product Designer',
    jobTitles: ['Product Designer'],
    terms: ['product designer', 'ux', 'ui', 'figma', 'wireframe', 'prototype', 'design system', 'user research']
  },
  {
    label: 'Software Engineer',
    jobTitles: ['Software Engineer', 'Frontend Engineer'],
    terms: ['software engineer', 'frontend', 'react', 'javascript', 'typescript', 'developer', 'web app', 'node']
  },
  {
    label: 'Marketing Manager',
    jobTitles: ['Marketing Manager'],
    terms: ['marketing', 'growth', 'campaign', 'brand', 'content', 'seo', 'performance marketing']
  },
  {
    label: 'Data Analyst',
    jobTitles: ['Data Analyst', 'Financial Analyst'],
    terms: ['data', 'analytics', 'sql', 'tableau', 'excel', 'python', 'forecasting', 'reporting']
  },
  {
    label: 'Business Operations Manager',
    jobTitles: ['Business Operations Manager', 'Program Coordinator'],
    terms: ['operations', 'program', 'process', 'strategy', 'cross-functional', 'business operations']
  },
  {
    label: 'Customer Success Manager',
    jobTitles: ['Customer Success Manager'],
    terms: ['customer success', 'account management', 'renewal', 'client', 'onboarding']
  },
  {
    label: 'Recruiting Coordinator',
    jobTitles: ['Recruiting Coordinator'],
    terms: ['recruiting', 'talent', 'sourcing', 'candidate', 'hr', 'interview scheduling']
  }
];

const PAGE_SIZE = 8;
const MAX_ASSISTANT_MESSAGES = 10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatSalary(value) {
  return `$${Math.round(value / 1000)}k`;
}

function formatJobSalaryLabel(job, estimatedSuffix = ' (Est.)') {
  if (job.salaryDisclosed && job.salaryText) return job.salaryText;
  const min = Number(job.salary && job.salary.min) || 0;
  const max = Number(job.salary && job.salary.max) || 0;
  if (!min && !max) return 'Salary not listed';
  return `${formatSalary(min)}-${formatSalary(Math.max(max, min))}${job.salaryDisclosed ? '' : estimatedSuffix}`;
}

function formatPostedAge(days) {
  if (days < 7) return `${days}d ago`;
  return `${Math.max(1, Math.round(days / 7))}w ago`;
}

function getTrustInfo(score) {
  if (score >= 80) return { tone: 'high', label: 'High Trust', description: 'Fresh posting, clear compensation, and strong employer signals.' };
  if (score >= 50) return { tone: 'mid', label: 'Review Carefully', description: 'Worth a look, but some details still need a closer review.' };
  return { tone: 'low', label: 'Low Trust', description: 'Stale or thin signals suggest this role may not be actively open.' };
}

function scoreColor(score) {
  if (score >= 80) return 'var(--score-high)';
  if (score >= 50) return 'var(--score-mid)';
  return 'var(--score-low)';
}

function sourceClass(source) {
  return String(source || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'source';
}

function bookmarkIcon(saved) {
  return saved
    ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.6L5 21V4a1 1 0 0 1 1-1Z"></path></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.6L5 21V4a1 1 0 0 1 1-1Z"></path></svg>';
}

function buildTrustRing(score, size = 'small') {
  const dimension = size === 'large' ? 72 : 30;
  const radius = size === 'large' ? 29 : 12;
  const center = dimension / 2;
  const circumference = 2 * Math.PI * radius;
  const active = (score / 100) * circumference;
  return `
    <svg viewBox="0 0 ${dimension} ${dimension}" aria-hidden="true">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--ring-track)" stroke-width="${size === 'large' ? 6 : 4}"></circle>
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${scoreColor(score)}" stroke-width="${size === 'large' ? 6 : 4}" stroke-linecap="round" stroke-dasharray="${active} ${circumference - active}" transform="rotate(-90 ${center} ${center})"></circle>
    </svg>
    <span class="trust-ring-value">${score}</span>
  `;
}

function buildSourceMarkup(source) {
  return `<span class="source-inline source-${sourceClass(source)}">via ${escapeHtml(source)}</span>`;
}

function buildSignalTag(type, label) {
  return `<span class="signal-chip ${type}">${escapeHtml(label)}</span>`;
}

function repostTagTone(score) {
  if (score >= 80) return 'gray';
  if (score >= 50) return 'amber';
  return 'red';
}

function buildApplyLabel(domain) {
  return domain ? `Open on ${domain} →` : 'Open listing →';
}

function trackerActionIcon(action) {
  if (action === 'restore') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path></svg>';
  }

  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 12h8l1-12"></path></svg>';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value) {
  const withoutTags = String(value ?? '').replace(/<[^>]*>/g, ' ');
  const decoder = document.createElement('textarea');
  decoder.innerHTML = withoutTags;
  return decoder.value.replace(/\s+/g, ' ').trim();
}

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeAuthEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function authAccountKey(email) {
  return normalizeAuthEmail(email).replace(/[^a-z0-9._-]+/g, '_');
}

function loadRawAuthSession() {
  const stored = safeParseJSON(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY), null);
  if (!stored || typeof stored.email !== 'string') return null;
  const email = normalizeAuthEmail(stored.email);
  if (!email) return null;
  return {
    ...stored,
    email,
    accountKey: stored.accountKey || authAccountKey(email),
  };
}

function activeAccountKey() {
  const session = loadRawAuthSession();
  return session && session.accountKey ? session.accountKey : null;
}

function scopedStorageKey(baseKey, accountKey = activeAccountKey()) {
  return accountKey ? `${baseKey}:account:${accountKey}` : baseKey;
}

window.emploidScopedStorageKey = scopedStorageKey;

function readStorageArray(baseKey, accountKey = activeAccountKey()) {
  const parsed = safeParseJSON(window.localStorage.getItem(scopedStorageKey(baseKey, accountKey)), []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeStorageArray(baseKey, values, accountKey = activeAccountKey()) {
  window.localStorage.setItem(scopedStorageKey(baseKey, accountKey), JSON.stringify(Array.isArray(values) ? values : []));
}

function mergeUniqueBy(items, getKey) {
  const seen = new Set();
  const merged = [];
  items.forEach((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

function mergeSearchHistory(primary, secondary) {
  return mergeUniqueBy([...(primary || []), ...(secondary || [])], (item) => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

function trackerMergeKey(item) {
  if (!item) return '';
  return item.id || `${String(item.company || '').toLowerCase()}::${String(item.role || item.title || '').toLowerCase()}`;
}

function mergeTrackerRecords(primary, secondary) {
  return mergeUniqueBy([...(primary || []), ...(secondary || [])], trackerMergeKey);
}

function loadAuthAccounts() {
  const accounts = safeParseJSON(window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY), {});
  return accounts && typeof accounts === 'object' && !Array.isArray(accounts) ? accounts : {};
}

function saveAuthAccounts(accounts) {
  window.localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts || {}));
}

function makeLocalPasswordToken(password) {
  return window.btoa(unescape(encodeURIComponent(String(password || ''))));
}

function migrateCookieSearchesToStorage() {
  const cookieSearches = loadPreviousSearchesFromCookie();
  if (!cookieSearches.length) return;
  const guestSearches = readStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, null);
  writeStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, mergeSearchHistory(guestSearches, cookieSearches), null);
  setCookie('emploid_prev_searches', '', -1);
}

function syncGuestDataToAccount(accountKey) {
  if (!accountKey) return;

  const guestSearches = readStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, null);
  const accountSearches = readStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, accountKey);
  writeStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, mergeSearchHistory(accountSearches, guestSearches), accountKey);

  const guestTracker = readStorageArray(TRACKER_STORAGE_KEY, null);
  const accountTracker = readStorageArray(TRACKER_STORAGE_KEY, accountKey);
  if (guestTracker.length || accountTracker.length) {
    writeStorageArray(TRACKER_STORAGE_KEY, mergeTrackerRecords(accountTracker, guestTracker), accountKey);
  }

  const guestBoard = readStorageArray(REACT_TRACKER_STORAGE_KEY, null);
  const accountBoard = readStorageArray(REACT_TRACKER_STORAGE_KEY, accountKey);
  if (guestBoard.length || accountBoard.length) {
    writeStorageArray(REACT_TRACKER_STORAGE_KEY, mergeTrackerRecords(accountBoard, guestBoard), accountKey);
  }
}

function syncAccountBoundState() {
  trackerApplications = loadTrackerApplications();
  renderTracker();
  renderPreviousSearches();
  window.dispatchEvent(new CustomEvent('emploid:tracker-updated'));
  window.dispatchEvent(new CustomEvent('emploid:auth-changed', { detail: { accountKey: activeAccountKey() } }));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const PAGE_ROUTES = {
  home: '/',
  jobs: '/browse',
  tracker: '/tracker',
  about: '/about',
  blog: '/blog',
};

const ROUTE_TO_PAGE = {
  '/': 'home',
  '/index.html': 'home',
  '/search': 'home',
  '/browse': 'jobs',
  '/tracker': 'tracker',
  '/about': 'about',
  '/blog': 'blog',
};

function normalizePageId(pageId) {
  if (pageId === 'search') return 'home';
  if (pageId === 'browse') return 'jobs';
  if (pageId === 'home' || pageId === 'jobs' || pageId === 'tracker' || pageId === 'about' || pageId === 'blog') return pageId;
  return 'home';
}

function getPagePath(pageId) {
  return PAGE_ROUTES[normalizePageId(pageId)] || PAGE_ROUTES.home;
}

function getPageIdFromPath(pathname) {
  const normalizedPath = pathname && pathname !== '/'
    ? pathname.replace(/\/+$/, '') || '/'
    : '/';
  return ROUTE_TO_PAGE[normalizedPath] || 'home';
}

function buildPageUrl(pageId, params = new URLSearchParams()) {
  const nextParams = new URLSearchParams(params);
  nextParams.delete('page');
  const query = nextParams.toString();
  return `${getPagePath(pageId)}${query ? `?${query}` : ''}`;
}

function buildInternalListingUrl(job) {
  const query = encodeURIComponent([job.title, job.company].filter(Boolean).join(' '));
  return `/browse?job=${encodeURIComponent(String(job.id))}&q=${query}`;
}

function buildReactTrackerRecord(job) {
  return {
    id: `tracked-${job.id}`,
    role: job.title,
    company: job.company,
    source: job.source,
    stage: 'applied',
    trust: job.trustScore,
    salary: formatJobSalaryLabel(job),
    location: job.location,
    applied: todayIso(),
    updatedAt: todayIso(),
    notes: job.hiringContact
      ? 'Hiring contact spotted. Follow up quickly while this listing is still warm.'
      : 'Added from search. Revisit within 5 business days if the listing still looks active.',
    hot: false,
    stall: false,
    listingUrl: buildInternalListingUrl(job),
    tags: [
      job.directCompanyLink ? 'Live source link' : 'No source link',
      job.hiringContact ? 'Hiring contact spotted' : 'No recruiter listed',
      `${job.workMode} role`
    ]
  };
}

function syncReactTrackerStorage(job) {
  const current = safeParseJSON(window.localStorage.getItem(scopedStorageKey(REACT_TRACKER_STORAGE_KEY)), []);
  const tracker = Array.isArray(current) ? current : [];
  const existingIndex = tracker.findIndex((application) => application.company === job.company && application.role === job.title);
  const nextRecord = buildReactTrackerRecord(job);

  if (existingIndex >= 0) {
    tracker[existingIndex] = {
      ...tracker[existingIndex],
      listingUrl: tracker[existingIndex].listingUrl || nextRecord.listingUrl,
      updatedAt: nextRecord.updatedAt,
      applied: tracker[existingIndex].applied || nextRecord.applied,
      notes: tracker[existingIndex].notes || nextRecord.notes,
    };
  } else {
    tracker.unshift(nextRecord);
  }

  window.localStorage.setItem(scopedStorageKey(REACT_TRACKER_STORAGE_KEY), JSON.stringify(tracker));
  window.dispatchEvent(new CustomEvent('emploid:tracker-updated'));
}

function loadTrackerApplications() {
  const saved = safeParseJSON(window.localStorage.getItem(scopedStorageKey(TRACKER_STORAGE_KEY)), []);
  if (!Array.isArray(saved) || !saved.length) return DEFAULT_TRACKER_APPLICATIONS.map((application) => ({ ...application }));

  const defaultMap = new Map(DEFAULT_TRACKER_APPLICATIONS.map((application) => [application.id, application]));
  const merged = saved.map((application) => {
    const seeded = defaultMap.get(application.id);
    return seeded ? { ...seeded, ...application } : application;
  });

  DEFAULT_TRACKER_APPLICATIONS.forEach((application) => {
    if (!merged.some((entry) => entry.id === application.id)) merged.push({ ...application });
  });

  return merged;
}

function saveTrackerApplications() {
  window.localStorage.setItem(scopedStorageKey(TRACKER_STORAGE_KEY), JSON.stringify(trackerApplications));
}

function loadResumeProfile() {
  return safeParseJSON(window.localStorage.getItem(RESUME_STORAGE_KEY), null);
}

function saveResumeProfile() {
  if (resumeProfile) window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resumeProfile));
  else window.localStorage.removeItem(RESUME_STORAGE_KEY);
}

function loadInsightsCache() {
  return safeParseJSON(window.sessionStorage.getItem(AI_INSIGHTS_STORAGE_KEY), {});
}

function saveInsightsCache(cache) {
  window.sessionStorage.setItem(AI_INSIGHTS_STORAGE_KEY, JSON.stringify(cache));
}

function loadAuthSession() {
  return loadRawAuthSession();
}

function saveAuthSession(session) {
  if (session) window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

function loadRememberedAuthEmail() {
  return window.localStorage.getItem(AUTH_LAST_EMAIL_STORAGE_KEY) || '';
}

function rememberAuthEmail(email) {
  if (email) window.localStorage.setItem(AUTH_LAST_EMAIL_STORAGE_KEY, email);
}

function authDisplayEmail(session) {
  return session && (session.name || session.email) ? (session.name || session.email) : 'you@example.com';
}

function renderAuthState() {
  const signedIn = Boolean(authSession);
  const email = authDisplayEmail(authSession);

  if (navAuthGuest) navAuthGuest.hidden = signedIn;
  if (navAuthUser) navAuthUser.hidden = !signedIn;
  if (navUserEmail) navUserEmail.textContent = email;

  if (navMobileAuthGuest) navMobileAuthGuest.hidden = signedIn;
  if (navMobileAuthUser) navMobileAuthUser.hidden = !signedIn;
  if (navMobileUserEmail) navMobileUserEmail.textContent = email;
}

function setAuthMode() {
  currentAuthMode = 'google';
  if (authKicker) authKicker.textContent = 'Google sign in';
  if (authTitle) authTitle.textContent = 'Continue to Emploid';
  if (authSubtitle) authSubtitle.textContent = 'Use your Google account to save searches, tracker activity, and account details in Supabase.';
  if (authSubmit) authSubmit.querySelector('span:last-child').textContent = 'Continue with Google';
  if (authNote) authNote.textContent = 'Your Google name, email, and profile image are synced to your Emploid profile.';
}

function openAuthModal(mode = 'signup') {
  if (!authOverlay) return;
  setAuthMode(mode);
  authOverlay.classList.add('open');
  authOverlay.setAttribute('aria-hidden', 'false');
  closeMobileMenu();
  syncModalLock();
  initializeGoogleSignIn({ showPrompt: false });
  window.setTimeout(() => {
    if (authGoogleSubmit) authGoogleSubmit.focus();
  }, 0);
}

function closeAuthModal() {
  if (!authOverlay) return;
  authOverlay.classList.remove('open');
  authOverlay.setAttribute('aria-hidden', 'true');
  syncModalLock();
}

function buildAuthSessionFromProfile(profile, user = {}) {
  const email = normalizeAuthEmail(profile && profile.email ? profile.email : user.email);
  if (!email) return null;

  return {
    email,
    name: profile && profile.name ? profile.name : user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name),
    avatarUrl: profile && profile.avatar_url ? profile.avatar_url : user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture),
    provider: profile && profile.auth_provider ? profile.auth_provider : 'google',
    accountKey: user.id || (profile && profile.id) || authAccountKey(email),
    createdAt: new Date().toISOString(),
  };
}

function applySignedInSession(nextSession, announce = true) {
  if (!nextSession) return;
  syncGuestDataToAccount(nextSession.accountKey);
  authSession = nextSession;
  saveAuthSession(authSession);
  rememberAuthEmail(authSession.email);
  renderAuthState();
  syncAccountBoundState();
  closeAuthModal();
  if (announce) showToast(`Signed in as ${authSession.email}.`);
}

function setGoogleAuthBusy(isBusy) {
  if (!authGoogleSubmit) return;
  authGoogleSubmit.disabled = isBusy;
  const label = authGoogleSubmit.querySelector('span:last-child');
  if (label) label.textContent = isBusy ? 'Connecting...' : 'Continue with Google';
}

async function fetchAuthConfig() {
  if (!authConfigPromise) {
    authConfigPromise = fetch('/api/auth/config', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : {})
      .catch(() => ({}));
  }
  return authConfigPromise;
}

async function generateGoogleNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const nonce = window.btoa(String.fromCharCode(...bytes));
  const encoded = new TextEncoder().encode(nonce);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return { nonce, hashedNonce };
}

function waitForGoogleIdentity(timeout = 5000) {
  if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve(true);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.clearInterval(timer);
        resolve(true);
      } else if (Date.now() - startedAt > timeout) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

async function syncCurrentSupabaseSession() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return;
    const payload = await response.json();
    const nextSession = buildAuthSessionFromProfile(payload.profile);
    if (nextSession) applySignedInSession(nextSession, false);
  } catch (error) {
    console.warn('[AUTH_SESSION]', error);
  }
}

async function handleGoogleCredentialResponse(response) {
  if (!response || !response.credential) return;
  setGoogleAuthBusy(true);

  try {
    const signInResponse = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        credential: response.credential,
        nonce: googleNonce && googleNonce.nonce,
      }),
    });
    const payload = await signInResponse.json().catch(() => ({}));

    if (!signInResponse.ok) {
      throw new Error(payload.error || 'Google sign in failed');
    }

    const nextSession = buildAuthSessionFromProfile(payload.profile || {}, payload.user || {});
    applySignedInSession(nextSession);
  } catch (error) {
    console.warn('[GOOGLE_AUTH]', error);
    showToast(error.message || 'Google sign in could not finish.');
  } finally {
    setGoogleAuthBusy(false);
  }
}

async function initializeGoogleSignIn(options = {}) {
  const { showPrompt = true } = options;
  const config = await fetchAuthConfig();

  if (!config.googleConfigured || !config.supabaseConfigured) {
    if (authNote) authNote.textContent = 'Add Supabase keys and NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign in.';
    return false;
  }

  const googleReady = await waitForGoogleIdentity();
  if (!googleReady) {
    showToast('Google sign in is still loading. Try again in a moment.');
    return false;
  }

  if (!googleNonce) googleNonce = await generateGoogleNonce();

  if (!googleSignInInitialized) {
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleGoogleCredentialResponse,
      context: 'signin',
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
      nonce: googleNonce.hashedNonce,
    });

    if (authGoogleButton) {
      window.google.accounts.id.renderButton(authGoogleButton, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(400, authGoogleButton.clientWidth || 400),
      });
    }

    googleSignInInitialized = true;
  }

  if (showPrompt && !authSession) {
    window.google.accounts.id.prompt();
  }

  return true;
}

async function startGoogleSignIn() {
  const initialized = await initializeGoogleSignIn({ showPrompt: false });
  if (!initialized) return;
  window.google.accounts.id.prompt();
}

async function initializeAuth() {
  await syncCurrentSupabaseSession();
  if (!authSession) {
    await initializeGoogleSignIn({ showPrompt: true });
  }
}

async function signOutAuth() {
  try {
    await fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' });
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (error) {
    console.warn('[SIGN_OUT]', error);
  }

  authSession = null;
  saveAuthSession(null);
  renderAuthState();
  syncAccountBoundState();
  closeAuthModal();
  closeMobileMenu();
  showToast('Signed out.');
}

function normalizeHeroScannerCards() {
  const cards = document.querySelectorAll('.scanner-layer-detailed .job-card-detailed');
  if (!cards.length) return;

  cards.forEach((card) => {
    const info = card.querySelector('.card-info');
    if (info) {
      const company = info.textContent.split('•')[0].trim();
      info.textContent = company || 'Hiring company';
    }

    const tags = card.querySelector('.card-tags');
    if (tags) tags.setAttribute('hidden', '');

    const scoreValue = card.querySelector('.trust-ring-value');
    const targetScore = Number.parseInt(scoreValue && scoreValue.textContent ? scoreValue.textContent : '0', 10);
    if (scoreValue && Number.isFinite(targetScore)) {
      scoreValue.dataset.score = String(targetScore);
      scoreValue.textContent = '0';
    }
  });
}

function animateHeroTrustScores() {
  const scoreEls = Array.from(document.querySelectorAll('.scanner-layer-detailed .trust-ring-value'));
  if (!scoreEls.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    scoreEls.forEach((scoreEl) => {
      if (scoreEl.dataset.score) scoreEl.textContent = scoreEl.dataset.score;
    });
    return;
  }

  const cycleMs = 5800;
  const rampStartMs = 1450;
  const rampMs = 900;

  function updateScores(now) {
    scoreEls.forEach((scoreEl, index) => {
      const targetScore = Number.parseInt(scoreEl.dataset.score || scoreEl.textContent || '0', 10);
      const delay = (index % 3) * 350;
      const elapsed = (now - delay) % cycleMs;

      if (elapsed < rampStartMs) {
        scoreEl.textContent = '0';
        return;
      }

      if (elapsed > rampStartMs + rampMs) {
        scoreEl.textContent = String(targetScore);
        return;
      }

      const progress = Math.min(1, Math.max(0, (elapsed - rampStartMs) / rampMs));
      const eased = 1 - Math.pow(1 - progress, 3);
      scoreEl.textContent = String(Math.round(targetScore * eased));
    });

    window.requestAnimationFrame(updateScores);
  }

  window.requestAnimationFrame(updateScores);
}

function initHeroScannerAnimation() {
  normalizeHeroScannerCards();
  animateHeroTrustScores();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function decodePdfEscapes(value) {
  return value
    .replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function extractPdfText(buffer) {
  const raw = new TextDecoder('latin1').decode(buffer);
  const collected = [];

  raw.replace(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g, (_match, group) => {
    collected.push(decodePdfEscapes(group));
    return _match;
  });

  raw.replace(/\[(.*?)\]\s*TJ/gs, (_match, group) => {
    group.replace(/\(([^()]*(?:\\.[^()]*)*)\)/g, (_inner, text) => {
      collected.push(decodePdfEscapes(text));
      return _inner;
    });
    return _match;
  });

  return collected.join(' ').replace(/\s+/g, ' ').trim();
}

async function extractResumeText(file) {
  const fileName = file.name.toLowerCase();
  if (file.type.startsWith('text/') || /\.(txt|md|rtf)$/.test(fileName)) {
    return file.text();
  }

  if (file.type === 'application/pdf' || /\.pdf$/.test(fileName)) {
    return extractPdfText(await file.arrayBuffer());
  }

  throw new Error('Upload a PDF or plain-text resume for now.');
}

function buildResumeProfile(text, fileName) {
  const normalized = text.toLowerCase();
  const itInternProfile = RESUME_ROLE_PROFILES.find((profile) => profile.label === 'IT Intern');
  const roleScores = RESUME_ROLE_PROFILES
    .map((profile) => ({
      ...profile,
      score: profile.terms.reduce((total, term) => total + (normalized.includes(term) ? 2 : 0), 0)
    }))
    .filter((profile) => profile.score > 0)
    .sort((left, right) => right.score - left.score);

  const focusProfiles = [
    ...(itInternProfile ? [{ ...itInternProfile, score: (itInternProfile.terms.reduce((total, term) => total + (normalized.includes(term) ? 2 : 0), 0)) + 10 }] : []),
    ...roleScores.filter((profile) => profile.label !== 'IT Intern')
  ].slice(0, 2);
  const focusRoles = focusProfiles.flatMap((profile) => profile.jobTitles).filter((value, index, array) => array.indexOf(value) === index);
  const skills = focusProfiles.flatMap((profile) => profile.terms.slice(0, 4)).filter((value, index, array) => array.indexOf(value) === index).slice(0, 6);
  const workModes = WORK_MODES.filter((mode) => normalized.includes(mode.toLowerCase()));
  const locations = LOCATIONS.filter((location) => normalized.includes(location.toLowerCase()));

  if (!focusRoles.length && !skills.length) throw new Error('Could not find clear role signals in that resume yet.');

  return {
    fileName,
    focusRoles,
    skills,
    workModes,
    locations,
    summary: focusRoles.length ? focusRoles.join(' + ') : 'IT Intern',
    chips: [
      'Simulated IT intern profile',
      ...focusRoles,
      ...workModes,
      ...locations.slice(0, 1),
      ...skills.slice(0, 2)
    ].filter((value, index, array) => value && array.indexOf(value) === index).slice(0, 6)
  };
}

async function parseResumeProfile(text, fileName) {
  try {
    const response = await fetch('/api/resume/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName })
    });

    if (!response.ok) throw new Error('Resume parsing is unavailable right now.');

    const profile = await response.json();
    return {
      ...profile,
      fileName,
      workModes: Array.isArray(profile.workModes) ? profile.workModes : (profile.preferredWorkModes || []),
      locations: Array.isArray(profile.locations) ? profile.locations : (profile.preferredLocations || [])
    };
  } catch (error) {
    console.warn('[RESUME_PARSE_FALLBACK]', error);
    return buildResumeProfile(text, fileName);
  }
}

function getResumeMatchScore(job, profile) {
  if (!profile) return 0;
  const haystack = `${job.title} ${job.company} ${job.location} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
  let score = 0;

  profile.focusRoles.forEach((role) => {
    if (job.title === role) score += 7;
    else if (job.title.toLowerCase().includes(role.toLowerCase())) score += 5;
  });

  profile.skills.forEach((skill) => {
    if (skill && haystack.includes(skill.toLowerCase())) score += 1;
  });

  profile.workModes.forEach((mode) => {
    if (job.workMode.toLowerCase() === mode.toLowerCase()) score += 2;
  });

  profile.locations.forEach((location) => {
    if (job.location.toLowerCase() === location.toLowerCase()) score += 2;
  });

  if (job.trustScore >= 85) score += 1;
  if (job.directCompanyLink) score += 1;
  return score;
}

let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
let activeModalJobId = null;
let liveJobSearchState = {
  hasSearched: false,
  isLoading: false,
  query: '',
  source: '',
  error: '',
};

const mainNav = document.getElementById('main-nav');
const heroSearch = document.getElementById('hero-search');
const heroSearchButton = document.getElementById('hero-search-btn');
const searchInput = document.getElementById('search-input');
const jobsSearchCanvas = document.getElementById('jobs-search-canvas');
const jobsSearchForm = document.getElementById('jobs-search-form');
const jobsSearchQuery = document.getElementById('jobs-search-query');
const jobsLocationPicker = document.getElementById('jobs-location-picker');
const jobsLocationInput = document.getElementById('jobs-search-location');
const jobsLocationTrigger = document.getElementById('jobs-location-trigger');
const jobsLocationMenu = document.getElementById('jobs-location-menu');
const jobsLocationLabel = document.getElementById('jobs-location-label');
const jobsLocationHint = document.getElementById('jobs-location-hint');
const jobsIpLocationLabel = document.getElementById('jobs-ip-location-label');
const jobsLocationCustom = document.getElementById('jobs-location-custom');
const jobsLiveSearchBtn = document.getElementById('jobs-live-search-btn');
const trustFilter = document.getElementById('trust-score-filter');
const trustFilterValue = document.getElementById('trust-score-val');
const salaryFilter = document.getElementById('salary-filter');
const sentimentFilter = document.getElementById('sentiment-filter');
const sortSelect = document.getElementById('sort-select');
const directToggle = document.getElementById('direct-apply-toggle');
const recruiterToggle = document.getElementById('recruiter-toggle');
const workModeCheckboxes = document.querySelectorAll('.checkbox-label input');
const jobsList = document.getElementById('jobs-list');
const jobsCount = document.getElementById('jobs-count');
const jobsCountSub = document.getElementById('jobs-count-sub');
const paginationEl = document.getElementById('jobs-pagination');
const overlayEl = document.getElementById('job-modal-overlay');
const modalArea = document.getElementById('modal-content-area');
const resumeUploadOverlay = document.getElementById('resume-upload-overlay');
const resumeUploadModal = document.getElementById('resume-upload-modal');
const resumeUploadCloseButton = document.getElementById('resume-upload-close');
const resumeUploadTag = document.getElementById('resume-upload-tag');
const resumeUploadTitle = document.getElementById('resume-upload-title');
const resumeUploadDetail = document.getElementById('resume-upload-detail');
const resumeUploadFileName = document.getElementById('resume-upload-file-name');
const resumeUploadStatus = document.getElementById('resume-upload-status');
const resumeUploadMeter = document.getElementById('resume-upload-meter');
const resumeUploadStepEls = document.querySelectorAll('[data-upload-step]');
const toastEl = document.getElementById('toast');
const navAuthGuest = document.getElementById('nav-auth-guest');
const navAuthUser = document.getElementById('nav-auth-user');
const navLoginTrigger = document.getElementById('nav-login-trigger');
const navSignUpTrigger = document.getElementById('nav-sign-up-trigger');
const navUserEmail = document.getElementById('nav-user-email');
const navSignOutTrigger = document.getElementById('nav-sign-out-trigger');
const mobileMenu = document.getElementById('nav-mobile-menu');
const navMobileAuthGuest = document.getElementById('nav-mobile-auth-guest');
const navMobileAuthUser = document.getElementById('nav-mobile-auth-user');
const navMobileLoginTrigger = document.getElementById('nav-mobile-login-trigger');
const navMobileSignUpTrigger = document.getElementById('nav-mobile-sign-up-trigger');
const navMobileUserEmail = document.getElementById('nav-mobile-user-email');
const navMobileOpenTracker = document.getElementById('nav-mobile-open-tracker');
const navMobileSignOutTrigger = document.getElementById('nav-mobile-sign-out-trigger');
const hamburger = document.getElementById('nav-hamburger');
const homePreviewList = document.getElementById('home-preview-list');
const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
const mobileFilterScrim = document.getElementById('mobile-filter-scrim');
const mobileFilterClose = document.getElementById('mobile-filter-close');
const jobsFilters = document.getElementById('jobs-filters');
const authOverlay = document.getElementById('auth-overlay');
const authModal = document.getElementById('auth-modal');
const authCloseButton = document.getElementById('auth-close');
const authKicker = document.getElementById('auth-kicker');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authGoogleSubmit = document.getElementById('auth-google-submit');
const authGoogleButton = document.getElementById('auth-google-button');
const authNote = document.getElementById('auth-note');
const authSubmit = authGoogleSubmit;
const assistantTrigger = document.getElementById('assistant-trigger');
const assistantDrawer = document.getElementById('assistant-drawer');
const assistantClose = document.getElementById('assistant-close');
const assistantMessagesEl = document.getElementById('assistant-messages');
const assistantForm = document.getElementById('assistant-form');
const assistantInput = document.getElementById('assistant-input');
const assistantStatus = document.getElementById('assistant-status');
const trackerSummaryGrid = document.getElementById('tracker-summary-grid');
const trackerListEl = document.getElementById('tracker-list');
const trackerChart = document.getElementById('tracker-chart');
const trackerChartStat = document.getElementById('tracker-chart-stat');
const trackerCalloutCard = document.getElementById('tracker-callout-card');
const trackerToolbarNote = document.getElementById('tracker-toolbar-note');
const trackerFilterButtons = document.querySelectorAll('[data-tracker-filter]');
const heroResumeTrigger = document.getElementById('hero-resume-trigger');
const jobsResumeTrigger = document.getElementById('jobs-resume-trigger');
const resumeUploadInput = document.getElementById('resume-upload-input');

let toastTimer;
let activeTrackerFilter = 'all';
let expandedTrackerId = null;
let trackerApplications = loadTrackerApplications();
let resumeProfile = null;
let resumeMatchActive = false;
let pendingInitialJobId = null;
let waveTrackerId = null;
let waveTrackerTimer;
let resumeUploadBusy = false;
let assistantMessages = [];
let assistantBusy = false;
let authSession = loadAuthSession();
let currentAuthMode = 'google';
let authConfigPromise = null;
let googleSignInInitialized = false;
let googleNonce = null;

function renderHomePreview() {
  if (!homePreviewList) return;
  homePreviewList.innerHTML = PREVIEW_LISTINGS.map((listing) => {
    const trustInfo = getTrustInfo(listing.trustScore);
    return `
      <article class="preview-job-card tone-${trustInfo.tone}">
        <div class="preview-job-main">
          <h3 class="preview-card-title">${listing.title}</h3>
          <p class="preview-card-company">${listing.company} · ${listing.location} · ${buildSourceMarkup(listing.source)}</p>
          <div class="preview-job-meta">
            <span>${listing.salary}</span>
            <span>${listing.workMode}</span>
            <span>${listing.jobType}</span>
            <span>${listing.age}</span>
          </div>
        </div>
        <div class="preview-trust">
          <div class="trust-ring">${buildTrustRing(listing.trustScore)}</div>
          <span class="preview-trust-label tone-${trustInfo.tone}">${trustInfo.label}</span>
        </div>
      </article>
    `;
  }).join('');
}

function companyMark(company) {
  return company.split(/\s+/).slice(0, 2).map((chunk) => chunk[0]).join('').toUpperCase();
}

function trackerStatusLabel(status) {
  if (status === 'needs-action') return 'Follow-up due';
  if (status === 'interview') return 'Interviewing';
  if (status === 'offer') return 'Offer in hand';
  if (status === 'archived') return 'Archived';
  return 'Active';
}

function trackerMatchesFilter(application) {
  if (activeTrackerFilter === 'all') return true;
  if (activeTrackerFilter === 'interview') return application.stage === 'Interview';
  return application.status === activeTrackerFilter;
}

function trackerProgressPercent(stageIndex) {
  return (stageIndex / (TRACKER_STAGES.length - 1)) * 100;
}

function trackerStageMarkup(stage, applicationId, label, isAnimating = false) {
  const stageIndex = TRACKER_STAGES.indexOf(stage);
  const progress = trackerProgressPercent(stageIndex);
  return `
    <div class="tracker-progress">
      <div class="tracker-stage-labels">
        ${TRACKER_STAGES.map((label, index) => {
          const className = index === stageIndex ? 'current' : index < stageIndex ? 'active' : '';
          return `<span class="${className}">${label}</span>`;
        }).join('')}
      </div>
      <div class="tracker-stage-slider-shell${isAnimating ? ' is-animating' : ''}" style="--tracker-progress:${progress}%;">
        <div class="tracker-stage-base"></div>
        <div class="tracker-stage-fill"></div>
        <div class="tracker-stage-track">
          ${TRACKER_STAGES.map((_, index) => {
            const className = index === stageIndex ? 'current' : index < stageIndex ? 'filled' : '';
            return `<span class="${className}"></span>`;
          }).join('')}
        </div>
        <input
          class="tracker-stage-slider"
          type="range"
          min="0"
          max="${TRACKER_STAGES.length - 1}"
          step="1"
          value="${stageIndex}"
          data-tracker-stage
          data-tracker-id="${applicationId}"
          aria-label="Update application stage for ${label}"
          aria-valuetext="${TRACKER_STAGES[stageIndex]}"
        />
      </div>
    </div>
  `;
}

function paintTrackerProgress(progressEl, stageIndex) {
  const progressRoot = progressEl && progressEl.classList.contains('tracker-progress')
    ? progressEl
    : progressEl && progressEl.closest('.tracker-progress');
  if (!progressRoot) return;

  const clampedStage = Math.max(0, Math.min(TRACKER_STAGES.length - 1, stageIndex));
  const sliderShell = progressRoot.querySelector('.tracker-stage-slider-shell');
  if (sliderShell) sliderShell.style.setProperty('--tracker-progress', `${trackerProgressPercent(clampedStage)}%`);

  progressRoot.querySelectorAll('.tracker-stage-labels span').forEach((labelEl, index) => {
    labelEl.classList.toggle('current', index === clampedStage);
    labelEl.classList.toggle('active', index < clampedStage);
  });

  progressRoot.querySelectorAll('.tracker-stage-track span').forEach((dotEl, index) => {
    dotEl.classList.toggle('current', index === clampedStage);
    dotEl.classList.toggle('filled', index < clampedStage);
  });
}

function nextTrackerStage(stage) {
  const currentIndex = TRACKER_STAGES.indexOf(stage);
  return TRACKER_STAGES[Math.min(TRACKER_STAGES.length - 1, currentIndex + 1)];
}

function syncTrackerStatus(application) {
  if (application.status === 'archived') return application;
  if (application.stage === 'Offer') return { ...application, status: 'offer' };
  if (application.stage === 'Interview') return { ...application, status: 'interview' };
  return application;
}

function getTrackerPrimaryAction(application) {
  if (application.status === 'archived') return { label: 'Details', action: 'toggle' };
  if (application.stage === 'Offer') return { label: 'View Offer', action: 'toggle' };
  if (application.status === 'needs-action') return { label: 'Send Follow-up', action: 'follow-up' };
  if (application.stage === 'Interview') return { label: 'Prep Guide', action: 'toggle' };
  return { label: 'Details', action: 'toggle' };
}

function getTrackerSecondaryAction(application) {
  return { label: 'Timeline', action: 'toggle' };
}

function getTrackerTertiaryAction(application) {
  if (application.status === 'archived') {
    return { label: 'Restore', action: 'restore', className: 'btn btn-secondary tracker-danger-btn' };
  }

  return { label: 'Reject', action: 'archive', className: 'btn btn-danger tracker-danger-btn' };
}

function buildTrackerTimeline(application) {
  return [
    { time: 'Applied', copy: `Submitted to ${application.company} via ${application.source} ${application.appliedDaysAgo} days ago.` },
    { time: 'Signal', copy: `${application.trustScore} trust score and ${application.lastActivity.toLowerCase()}.` },
    { time: 'Next', copy: application.nextAction }
  ];
}

function updateTrackerApplication(applicationId, updater) {
  trackerApplications = trackerApplications.map((application) => {
    if (application.id !== applicationId) return application;
    return syncTrackerStatus(updater({ ...application }));
  });
  saveTrackerApplications();
  renderTracker();
}

function triggerTrackerWave(applicationId) {
  waveTrackerId = applicationId;
  clearTimeout(waveTrackerTimer);
  renderTracker();
  waveTrackerTimer = setTimeout(() => {
    waveTrackerId = null;
    renderTracker();
  }, 850);
}

function setTrackerStage(applicationId, stageIndex) {
  const application = trackerApplications.find((entry) => entry.id === applicationId);
  if (!application) return;

  const nextStage = TRACKER_STAGES[Math.max(0, Math.min(TRACKER_STAGES.length - 1, stageIndex))];
  if (application.stage === nextStage) return;

  updateTrackerApplication(applicationId, (entry) => ({
    ...entry,
    stage: nextStage,
    status: nextStage === 'Applied'
      ? (entry.status === 'archived' ? 'archived' : 'active')
      : entry.status,
    lastActivity: `${nextStage} updated just now`,
    nextAction: nextStage === 'Applied'
      ? 'Wait for the first signal, then follow up if the role still looks active.'
      : nextStage === 'Reviewing'
        ? 'Watch for recruiter movement and prep a short follow-up.'
        : nextStage === 'Interview'
          ? 'Prep stories, questions, and role-specific examples before the conversation.'
          : 'Review compensation, timeline, and reporting structure before deciding.'
  }));
  triggerTrackerWave(applicationId);
}

function handleTrackerAction(applicationId, action) {
  const application = trackerApplications.find((entry) => entry.id === applicationId);
  if (!application) return;

  if (action === 'toggle') {
    expandedTrackerId = expandedTrackerId === applicationId ? null : applicationId;
    renderTracker();
    return;
  }

  if (action === 'follow-up') {
    updateTrackerApplication(applicationId, (entry) => ({
      ...entry,
      status: 'active',
      lastActivity: 'Follow-up sent just now',
      nextAction: 'Wait 3 business days for a reply, then decide whether to keep it active or archive it.'
    }));
    triggerTrackerWave(applicationId);
    showToast('Follow-up logged in your tracker.');
    return;
  }

  if (action === 'advance') {
    updateTrackerApplication(applicationId, (entry) => {
      const nextStage = nextTrackerStage(entry.stage);
      return {
        ...entry,
        stage: nextStage,
        lastActivity: `${nextStage} activity logged just now`,
        nextAction: nextStage === 'Interview'
          ? 'Prep stories, questions, and role-specific examples before the conversation.'
          : nextStage === 'Offer'
            ? 'Review compensation, deadline, and team scope before making a decision.'
            : 'Keep momentum up and watch for recruiter movement.'
      };
    });
    triggerTrackerWave(applicationId);
    showToast('Application stage updated.');
    return;
  }

  if (action === 'archive') {
    updateTrackerApplication(applicationId, (entry) => ({
      ...entry,
      status: 'archived',
      lastActivity: 'Rejected today',
      nextAction: 'Removed from the active board so you can focus on live roles.'
    }));
    triggerTrackerWave(applicationId);
    showToast('Application removed from your active board.');
    return;
  }

  if (action === 'restore') {
    updateTrackerApplication(applicationId, (entry) => ({
      ...entry,
      status: 'active',
      stage: entry.stage === 'Applied' ? 'Reviewing' : entry.stage,
      lastActivity: 'Restored today',
      nextAction: 'Re-check the role and decide if it still deserves a follow-up.'
    }));
    triggerTrackerWave(applicationId);
    showToast('Application restored.');
  }
}

function trackJobApplication(job) {
  const existing = trackerApplications.find((application) => application.company === job.company && application.role === job.title);
  if (existing) {
    updateTrackerApplication(existing.id, (entry) => ({
      ...entry,
      lastActivity: 'Opened from search just now'
    }));
    syncReactTrackerStorage(job);
    return;
  }

  const status = job.hiringContact ? 'needs-action' : 'active';
  const application = {
    id: `tracked-${job.id}`,
    role: job.title,
    company: job.company,
    source: job.source,
    appliedDaysAgo: 0,
    stage: 'Applied',
    status,
    trustScore: job.trustScore,
    location: job.location,
    salary: formatJobSalaryLabel(job),
    lastActivity: 'Added from search just now',
    nextAction: job.hiringContact
      ? 'A recruiter signal was found here. Follow up within 48 hours while the role is still warm.'
      : 'Give this role 5 business days, then send one concise follow-up if it still looks active.',
    tags: [
      job.directCompanyLink ? 'Live source link' : 'No source link',
      job.hiringContact ? 'Hiring contact spotted' : 'No recruiter listed',
      `${job.workMode} role`
    ],
    interviewsThisWeek: false,
    url: job.url
  };

  trackerApplications = [application, ...trackerApplications];
  saveTrackerApplications();
  syncReactTrackerStorage(job);
  renderTracker();
  triggerTrackerWave(application.id);
}

function renderTrackerSummary() {
  if (!trackerSummaryGrid) return;
  const activeCount = trackerApplications.filter((application) => application.status !== 'archived').length;
  const interviewCount = trackerApplications.filter((application) => application.stage === 'Interview').length;
  const followUpsDue = trackerApplications.filter((application) => application.status === 'needs-action').length;
  const highTrustCount = trackerApplications.filter((application) => application.status !== 'archived' && application.trustScore >= 85).length;

  const cards = [
    {
      label: 'Active Applications',
      value: activeCount,
      detail: 'Open roles still worth checking',
      tone: 'accent-soft'
    },
    {
      label: 'Interviews This Week',
      value: interviewCount,
      detail: 'Roles already in conversation',
      tone: 'accent-orange'
    },
    {
      label: 'Follow-ups Due',
      value: followUpsDue,
      detail: 'The board should tell you what to do next',
      tone: 'accent-navy'
    },
    {
      label: 'High-Trust Roles',
      value: highTrustCount,
      detail: 'Best signal-to-effort opportunities',
      tone: 'accent-green'
    }
  ];

  trackerSummaryGrid.innerHTML = cards.map((card) => `
    <article class="tracker-summary-card ${card.tone}">
      <span class="tracker-summary-label">${card.label}</span>
      <div class="tracker-summary-value">${String(card.value).padStart(2, '0')}</div>
      <p class="tracker-summary-detail">${card.detail}</p>
    </article>
  `).join('');
}

function renderTrackerInsights() {
  if (!trackerChart || !trackerChartStat || !trackerCalloutCard) return;

  const totalTouches = TRACKER_REPLY_MOMENTUM.reduce((sum, day) => sum + day.value, 0);
  trackerChartStat.innerHTML = `${String(totalTouches).padStart(2, '0')}<span> touches</span>`;

  trackerChart.innerHTML = TRACKER_REPLY_MOMENTUM.map((day) => `
    <div class="tracker-bar-col">
      <span class="tracker-bar-value">${day.value}</span>
      <div class="tracker-bar${day.highlight ? ' active' : ''}" style="height:${48 + day.value * 24}px;"></div>
      <span class="tracker-bar-label">${day.label}</span>
    </div>
  `).join('');

  const bestOdds = trackerApplications.filter((application) => application.status !== 'archived' && application.trustScore >= 85).slice(0, 2);
  const interviewRole = trackerApplications.find((application) => application.stage === 'Interview');
  const lowSignal = trackerApplications.find((application) => application.status === 'archived' || application.trustScore < 55);

  trackerCalloutCard.innerHTML = `
    <p class="tracker-callout-kicker">This Week</p>
    <h3>Keep the board honest.</h3>
    <p class="tracker-callout-copy">
      ${trackerApplications.filter((application) => application.status === 'needs-action').length} roles need attention.
      Push on ${bestOdds.map((application) => application.company).join(' and ') || 'your strongest openings'} before they cool off.
    </p>
    <div class="tracker-callout-list">
      <div class="tracker-callout-item"><strong>Push:</strong> ${bestOdds[0] ? bestOdds[0].nextAction : 'No clear priority yet.'}</div>
      <div class="tracker-callout-item"><strong>Prep:</strong> ${interviewRole ? interviewRole.nextAction : 'No interview prep on deck.'}</div>
      <div class="tracker-callout-item"><strong>Cut:</strong> ${lowSignal ? lowSignal.nextAction : 'No dead-end roles to cut this week.'}</div>
    </div>
    <span class="tracker-callout-link">Use this board instead of a spreadsheet</span>
  `;
}

function renderTrackerList() {
  if (!trackerListEl) return;

  const priorityOrder = {
    'needs-action': 0,
    interview: 1,
    offer: 2,
    active: 3,
    archived: 4
  };

  const filteredApplications = trackerApplications
    .filter(trackerMatchesFilter)
    .sort((left, right) => {
      const leftPriority = priorityOrder[left.status] ?? 99;
      const rightPriority = priorityOrder[right.status] ?? 99;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      if (right.trustScore !== left.trustScore) return right.trustScore - left.trustScore;
      return left.appliedDaysAgo - right.appliedDaysAgo;
    });

  if (trackerToolbarNote) {
    if (activeTrackerFilter === 'all') {
      trackerToolbarNote.textContent = `${trackerApplications.filter((application) => application.status === 'needs-action').length} roles need attention in the next 48 hours.`;
    } else if (activeTrackerFilter === 'needs-action') {
      trackerToolbarNote.textContent = 'Short, well-timed follow-ups beat random extra applications here.';
    } else if (activeTrackerFilter === 'interview') {
      trackerToolbarNote.textContent = 'Use this view to prep stories, deadlines, and recruiter asks.';
    } else if (activeTrackerFilter === 'offer') {
      trackerToolbarNote.textContent = 'Offers deserve side-by-side comparison, not gut feeling.';
    } else {
      trackerToolbarNote.textContent = 'Archive stale roles so your active board stays honest.';
    }
  }

  if (!filteredApplications.length) {
    trackerListEl.innerHTML = '<div class="empty-state"><h3>No applications in this view.</h3><p>Try another filter to see the rest of your pipeline.</p></div>';
    return;
  }

  trackerListEl.innerHTML = filteredApplications.map((application) => {
    const trustInfo = getTrustInfo(application.trustScore);
    const trustClass = trustInfo.tone === 'high' ? 'trust-high' : trustInfo.tone === 'mid' ? 'trust-mid' : 'trust-low';
    const primary = getTrackerPrimaryAction(application);
    const secondary = getTrackerSecondaryAction(application);
    const tertiary = getTrackerTertiaryAction(application);
    const metaPills = [application.location, application.salary, ...application.tags.slice(0, 2)];
    const timeline = buildTrackerTimeline(application);

    return `
      <article class="tracker-card tone-${trustInfo.tone}">
        <div class="tracker-card-top">
          <div class="tracker-company-mark">${companyMark(application.company)}</div>

          <div class="tracker-card-body">
            <div class="tracker-card-topline">
              <span class="tracker-chip stage">${trackerStatusLabel(application.status)}</span>
              <span class="tracker-chip ${trustClass}">${application.trustScore} Trust Score</span>
            </div>
            <h3 class="tracker-card-title">${application.role}</h3>
            <p class="tracker-card-subline">${application.company} · ${buildSourceMarkup(application.source)} · Applied ${application.appliedDaysAgo} days ago</p>
            ${trackerStageMarkup(application.stage, application.id, `${application.role} at ${application.company}`, waveTrackerId === application.id)}
            <div class="tracker-meta-row">
              ${metaPills.map((item) => `<span class="tracker-meta-pill">${item}</span>`).join('')}
            </div>
            <div class="tracker-note tone-${trustInfo.tone}"><strong>Next move:</strong> ${application.nextAction}</div>
          </div>

          <div class="tracker-card-actions">
            <button class="btn btn-primary" type="button" data-tracker-action="${primary.action}" data-tracker-id="${application.id}">${primary.label}</button>
            <button class="btn btn-secondary tracker-secondary-btn" type="button" data-tracker-action="${secondary.action}" data-tracker-id="${application.id}">${secondary.label}</button>
            <button class="${tertiary.className}" type="button" data-tracker-action="${tertiary.action}" data-tracker-id="${application.id}">${trackerActionIcon(tertiary.action)}<span>${tertiary.label}</span></button>
          </div>
        </div>
        <div class="tracker-expand${expandedTrackerId === application.id ? ' open' : ''}">
          <div class="tracker-expand-grid">
            <div class="tracker-expand-card">
              <h4>Timeline</h4>
              <div class="tracker-event-list">
                ${timeline.map((event) => `
                  <div class="tracker-event-item">
                    <span class="tracker-event-time">${event.time}</span>
                    <div class="tracker-event-copy">${event.copy}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="tracker-expand-card">
              <h4>Quick actions</h4>
              <p>Log movement the moment it happens so this board can replace your spreadsheet.</p>
              <div class="tracker-quick-actions">
                <button class="btn btn-secondary" type="button" data-tracker-action="advance" data-tracker-id="${application.id}">Log reply / advance</button>
                <button class="${application.status === 'archived' ? 'btn btn-secondary' : 'btn btn-danger'}" type="button" data-tracker-action="${application.status === 'archived' ? 'restore' : 'archive'}" data-tracker-id="${application.id}">${application.status === 'archived' ? 'Restore to board' : 'Reject role'}</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderResumeMatchUI() {
  if (!heroResumeTrigger) return;
  heroResumeTrigger.classList.toggle('has-resume', Boolean(resumeProfile));
  heroResumeTrigger.setAttribute(
    'aria-label',
    resumeProfile
      ? `Upload a new resume. Current match profile: ${resumeProfile.summary}.`
      : 'Upload resume'
  );
}

function renderTracker() {
  // disabled as we use React now
}

function syncModalLock() {
  const hasJobModal = Boolean(overlayEl && overlayEl.classList.contains('open'));
  const hasResumeModal = Boolean(resumeUploadOverlay && resumeUploadOverlay.classList.contains('open'));
  const hasAuthModal = Boolean(authOverlay && authOverlay.classList.contains('open'));
  const hasMobileFilters = Boolean(
    jobsFilters
    && jobsFilters.classList.contains('mobile-open')
    && window.innerWidth <= 760
  );
  document.body.classList.toggle('modal-open', hasJobModal || hasResumeModal || hasAuthModal || hasMobileFilters);
}

function setResumeUploadState(phase, overrides = {}) {
  if (!resumeUploadModal) return;

  const states = {
    uploading: {
      tag: 'Resume Match',
      title: 'Uploading your resume',
      detail: 'We are securing the file and preparing it for parsing.',
      status: 'Uploading securely...',
      progress: 28,
      allowClose: false,
      steps: { upload: 'active', parse: 'pending', match: 'pending' }
    },
    parsing: {
      tag: 'Resume Match',
      title: 'Parsing experience and skills',
      detail: 'We are pulling out roles, skills, and work preferences from your file.',
      status: 'Parsing your resume...',
      progress: 68,
      allowClose: false,
      steps: { upload: 'complete', parse: 'active', match: 'pending' }
    },
    matching: {
      tag: 'Resume Match',
      title: 'Matching the best roles',
      detail: 'We are scoring openings against your background so the feed can update.',
      status: 'Ranking the strongest matches...',
      progress: 92,
      allowClose: false,
      steps: { upload: 'complete', parse: 'complete', match: 'active' }
    },
    matched: {
      tag: 'Resume Ready',
      title: 'Resume match complete',
      detail: 'Your tailored job feed is ready.',
      status: 'Opening your matches...',
      progress: 100,
      allowClose: false,
      steps: { upload: 'complete', parse: 'complete', match: 'complete' }
    },
    error: {
      tag: 'Upload issue',
      title: 'We could not parse that resume',
      detail: 'Try another PDF or a plain-text resume and we can run it again.',
      status: 'Parsing stopped before we found usable signals.',
      progress: 100,
      allowClose: true,
      steps: { upload: 'complete', parse: 'error', match: 'pending' }
    }
  };

  const state = { ...(states[phase] || states.uploading), ...overrides };
  const stateLabel = {
    pending: 'Waiting',
    active: 'In progress',
    complete: 'Done',
    error: 'Needs attention'
  };

  resumeUploadModal.dataset.uploadPhase = phase;
  if (resumeUploadTag) resumeUploadTag.textContent = state.tag;
  if (resumeUploadTitle) resumeUploadTitle.textContent = state.title;
  if (resumeUploadDetail) resumeUploadDetail.textContent = state.detail;
  if (resumeUploadStatus) resumeUploadStatus.textContent = state.status;
  if (resumeUploadMeter) resumeUploadMeter.style.width = `${state.progress}%`;

  if (resumeUploadCloseButton) {
    resumeUploadCloseButton.hidden = !state.allowClose;
    resumeUploadCloseButton.disabled = !state.allowClose;
  }

  resumeUploadStepEls.forEach((stepEl) => {
    const step = stepEl.dataset.uploadStep;
    const stepState = state.steps[step] || 'pending';
    stepEl.dataset.stepState = stepState;

    const stateEl = stepEl.querySelector('.resume-upload-step-state');
    if (stateEl) stateEl.textContent = stateLabel[stepState] || stateLabel.pending;
  });
}

function openResumeUploadModal(fileName) {
  if (!resumeUploadOverlay || !resumeUploadModal) return;

  if (resumeUploadFileName) resumeUploadFileName.textContent = fileName;
  resumeUploadOverlay.classList.add('open');
  resumeUploadOverlay.setAttribute('aria-hidden', 'false');
  setResumeUploadState('uploading');
  syncModalLock();
}

function closeResumeUploadModal(force = false) {
  if (!resumeUploadOverlay) return;
  if (resumeUploadBusy && !force) return;

  resumeUploadOverlay.classList.remove('open');
  resumeUploadOverlay.setAttribute('aria-hidden', 'true');
  if (resumeUploadModal) resumeUploadModal.dataset.uploadPhase = 'idle';
  syncModalLock();
}

function openResumeUpload() {
  if (resumeUploadBusy) return;
  if (resumeUploadInput) resumeUploadInput.click();
}

async function handleResumeUpload() {
  const file = resumeUploadInput && resumeUploadInput.files && resumeUploadInput.files[0];
  if (!file) return;

  let parsingComplete = false;

  resumeUploadBusy = true;
  openResumeUploadModal(file.name);

  try {
    const textPromise = extractResumeText(file);

    await wait(420);
    setResumeUploadState('parsing', {
      detail: `Pulling out role signals from ${file.name}.`
    });

    const text = await textPromise;
    parsingComplete = true;
    resumeProfile = await parseResumeProfile(text, file.name);
    resumeMatchActive = true;
    saveResumeProfile();
    renderResumeMatchUI();

    setResumeUploadState('matching', {
      detail: `Scoring openings around ${resumeProfile.summary}.`
    });
    await wait(420);

    navigateTo('jobs');
    applyFilters();
    setResumeUploadState('matched', {
      detail: `We found the strongest roles around ${resumeProfile.summary}.`
    });
    await wait(520);

    resumeUploadBusy = false;
    closeResumeUploadModal();
    showToast(`Matched your search to ${resumeProfile.summary}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read that resume yet.';
    resumeUploadBusy = false;
    setResumeUploadState('error', {
      detail: message,
      status: message,
      steps: parsingComplete
        ? { upload: 'complete', parse: 'complete', match: 'error' }
        : { upload: 'complete', parse: 'error', match: 'pending' }
    });
    showToast(message);
  } finally {
    if (resumeUploadInput) resumeUploadInput.value = '';
  }
}

function clearResumeMatch() {
  resumeProfile = null;
  resumeMatchActive = false;
  saveResumeProfile();
  renderResumeMatchUI();
  applyFilters();
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
}

function setMobileFiltersOpen(isOpen) {
  if (!mobileFilterToggle || !jobsFilters) return;
  mobileFilterToggle.setAttribute('aria-expanded', String(isOpen));
  jobsFilters.classList.toggle('mobile-open', isOpen);
  if (mobileFilterScrim) {
    mobileFilterScrim.hidden = !isOpen;
    mobileFilterScrim.classList.toggle('open', isOpen);
  }
  syncModalLock();
}

function closeMobileFilters() {
  if (window.innerWidth <= 760) setMobileFiltersOpen(false);
}

function navigateTo(pageId, options = {}) {
  const {
    params = null,
    replace = false,
    scroll = true,
    syncLocation = true,
  } = options;
  const normalizedPageId = normalizePageId(pageId);

  document.querySelectorAll('.page').forEach((pageEl) => pageEl.classList.remove('active'));
  document.querySelectorAll('.nav-link, .nav-mobile-link').forEach((linkEl) => linkEl.classList.remove('active'));
  const pageEl = document.getElementById(`page-${normalizedPageId}`);
  if (pageEl) pageEl.classList.add('active');
  document.querySelectorAll(`[data-page="${normalizedPageId}"]`).forEach((linkEl) => {
    if (linkEl.classList.contains('nav-link') || linkEl.classList.contains('nav-mobile-link')) linkEl.classList.add('active');
  });
  document.body.dataset.page = normalizedPageId;

  if (normalizedPageId === 'jobs') {
    const q = params ? params.get('q') : '';
    if (!q) {
      liveJobSearchState.hasSearched = false;
      if (jobsSearchQuery) jobsSearchQuery.value = '';
      if (searchInput) searchInput.value = '';
      selectLocation('remote');
      renderJobs();
    }
  }

  if (!['jobs', 'tracker'].includes(normalizedPageId)) setAssistantOpen(false);
  closeMobileMenu();
  closeMobileFilters();

  if (normalizedPageId === 'blog') {
    let articleSlug = null;
    if (params) {
      articleSlug = params.get('article');
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      articleSlug = urlParams.get('article');
    }
    if (articleSlug) {
      setActiveBlogArticle(articleSlug, false);
    } else {
      showBlogIndex(false);
    }
    if (syncLocation) {
      const nextParams = params ? new URLSearchParams(params) : new URLSearchParams();
      if (articleSlug) nextParams.set('article', articleSlug);
      else nextParams.delete('article');
      const targetUrl = buildPageUrl('blog', nextParams);
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (targetUrl !== currentUrl) {
        const historyMethod = replace ? 'replaceState' : 'pushState';
        window.history[historyMethod]({}, '', targetUrl);
      }
    }
  } else {
    if (syncLocation) {
      const targetUrl = buildPageUrl(normalizedPageId, params || new URLSearchParams());
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (targetUrl !== currentUrl) {
        const historyMethod = replace ? 'replaceState' : 'pushState';
        window.history[historyMethod]({}, '', targetUrl);
      }
    }
  }

  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBlogIndex(updateUrl = true) {
  const blogIndex = document.getElementById('blog-index');
  const reader = document.getElementById('blog-reader');
  if (blogIndex) blogIndex.hidden = false;
  if (reader) reader.hidden = true;

  document.querySelectorAll('.blog-article').forEach((article) => {
    article.style.display = 'none';
  });
  document.querySelectorAll('.blog-toc-item').forEach((tocItem) => tocItem.classList.remove('active'));

  if (updateUrl) {
    const targetUrl = buildPageUrl('blog', new URLSearchParams());
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (targetUrl !== currentUrl) {
      window.history.pushState({}, '', targetUrl);
    }
  }
}

function setActiveBlogArticle(slug, updateUrl = true) {
  const blogIndex = document.getElementById('blog-index');
  const reader = document.getElementById('blog-reader');
  if (blogIndex) blogIndex.hidden = true;
  if (reader) reader.hidden = false;

  document.querySelectorAll('.blog-article').forEach((article) => {
    article.style.display = article.id === `article-${slug}` ? 'block' : 'none';
  });

  document.querySelectorAll('.blog-toc-item').forEach((tocItem) => {
    if (tocItem.dataset.tocSlug === slug) {
      tocItem.classList.add('active');
    } else {
      tocItem.classList.remove('active');
    }
  });

  if (updateUrl) {
    const params = new URLSearchParams(window.location.search);
    params.set('article', slug);
    const targetUrl = buildPageUrl('blog', params);
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (targetUrl !== currentUrl) {
      window.history.pushState({}, '', targetUrl);
    }
  }
}

function initBlogEvents() {
  const backBtn = document.getElementById('blog-back-to-home');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showBlogIndex(true);
    });
  }

  document.querySelectorAll('[data-blog-index-article]').forEach((card) => {
    const openCard = () => {
      const slug = card.getAttribute('data-blog-index-article');
      if (slug) setActiveBlogArticle(slug, true);
    };
    card.addEventListener('click', openCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  document.querySelectorAll('.blog-toc-item a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = link.closest('.blog-toc-item').dataset.tocSlug;
      setActiveBlogArticle(slug, true);
    });
  });

  const renderToolResult = (targetId, tone, eyebrow, value, heading, detailsHtml) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.className = `tool-result is-visible tool-result-${tone}`;
    target.innerHTML = `
      <div class="tool-result-kicker">${escapeHtml(eyebrow)}</div>
      <div class="tool-result-score">${escapeHtml(value)}</div>
      <h3>${escapeHtml(heading)}</h3>
      <div class="tool-result-detail">${detailsHtml}</div>
    `;
  };

  const getNumber = (formData, field, fallback = 0) => {
    const value = Number(formData.get(field));
    return Number.isFinite(value) ? value : fallback;
  };

  const ghostJobForm = document.getElementById('ghost-job-detector-form');
  if (ghostJobForm) {
    ghostJobForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(ghostJobForm);
      const title = String(formData.get('jobTitle') || 'this role').trim();
      const daysPosted = Math.max(0, getNumber(formData, 'daysPosted'));
      let score = 0;

      if (daysPosted > 90) score += 45;
      else if (daysPosted > 60) score += 35;
      else if (daysPosted > 30) score += 25;
      else if (daysPosted > 14) score += 10;

      if (!formData.has('hasSalary')) score += 20;
      if (!formData.has('hasRecruiter')) score += 20;
      if (!formData.has('knownLinkedIn')) score += 15;

      const riskScore = Math.min(100, score);
      const tone = riskScore >= 65 ? 'risk' : riskScore >= 35 ? 'caution' : 'good';
      const label = riskScore >= 65 ? 'High ghost risk' : riskScore >= 35 ? 'Medium ghost risk' : 'Low ghost risk';
      const details = `
        <p>${escapeHtml(title)} scores ${riskScore}/100 based on listing age, salary visibility, recruiter accountability, and company LinkedIn presence.</p>
        <p>${riskScore >= 65 ? 'Verify the role on the company career page and contact a recruiter before tailoring a full application.' : riskScore >= 35 ? 'Run one source check before applying, especially if the role has been refreshed more than once.' : 'This listing has several signs of active hiring intent. A tailored direct application is reasonable.'}</p>
      `;

      renderToolResult('ghost-job-detector-result', tone, 'Ghost risk score', `${riskScore}/100`, label, details);
    });
  }

  const hiringIndexForm = document.getElementById('company-hiring-index-form');
  if (hiringIndexForm) {
    hiringIndexForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(hiringIndexForm);
      const companyName = String(formData.get('companyName') || 'This company').trim();
      const openRoles = Math.max(0, getNumber(formData, 'openRoles'));
      const closedRoles = Math.max(0, getNumber(formData, 'closedRoles'));
      const rating = Math.min(5, Math.max(1, getNumber(formData, 'glassdoorRating', 3)));
      const totalActivity = openRoles + closedRoles;
      const closeRatio = totalActivity ? closedRoles / totalActivity : 0;
      const activityScore = Math.min(20, totalActivity * 1.5);
      const score = Math.round((closeRatio * 55) + (rating * 5) + activityScore);
      const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
      const tone = score >= 70 ? 'good' : score >= 45 ? 'caution' : 'risk';
      const explanation = grade === 'A' || grade === 'B'
        ? 'Recent closes and employee sentiment suggest a healthier hiring engine.'
        : grade === 'C'
          ? 'There is some movement, but verify the specific team before investing heavy effort.'
          : 'Open roles are outpacing visible closes, so treat postings with caution until you confirm active interviews.';
      const details = `
        <p>${escapeHtml(companyName)} has ${openRoles} open roles, ${closedRoles} recently closed roles, and a ${rating.toFixed(1)}/5 employee rating signal.</p>
        <p>${escapeHtml(explanation)}</p>
      `;

      renderToolResult('company-hiring-index-result', tone, 'Hiring health grade', grade, `${score}/100 hiring health`, details);
    });
  }

  const atsScorerForm = document.getElementById('ats-resume-scorer-form');
  if (atsScorerForm) {
    atsScorerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(atsScorerForm);
      const jobDescription = String(formData.get('jobDescription') || '').toLowerCase();
      const keywords = String(formData.get('resumeKeywords') || '')
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);
      const uniqueKeywords = [...new Set(keywords.map((keyword) => keyword.toLowerCase()))];
      const matched = uniqueKeywords.filter((keyword) => jobDescription.includes(keyword));
      const missing = uniqueKeywords.filter((keyword) => !jobDescription.includes(keyword));
      const score = uniqueKeywords.length ? Math.round((matched.length / uniqueKeywords.length) * 100) : 0;
      const tone = score >= 75 ? 'good' : score >= 45 ? 'caution' : 'risk';
      const heading = score >= 75 ? 'Strong ATS keyword match' : score >= 45 ? 'Partial ATS keyword match' : 'Weak ATS keyword match';
      const listItems = (items) => items.length
        ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        : '<li>None</li>';
      const details = `
        <p>${matched.length} of ${uniqueKeywords.length} resume keywords appear in the job description.</p>
        <div class="tool-result-columns">
          <div><strong>Matched</strong><ul>${listItems(matched)}</ul></div>
          <div><strong>Missing</strong><ul>${listItems(missing)}</ul></div>
        </div>
      `;

      renderToolResult('ats-resume-scorer-result', tone, 'ATS match score', `${score}%`, heading, details);
    });
  }

  const linkVerifierForm = document.getElementById('job-link-verifier-form');
  if (linkVerifierForm) {
    linkVerifierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(linkVerifierForm);
      const urlValue = String(formData.get('jobUrl') || '').trim();
      let parsedUrl;

      try {
        parsedUrl = new URL(urlValue);
      } catch {
        renderToolResult('job-link-verifier-result', 'risk', 'Link check', 'Invalid URL', 'Enter a full job posting URL', '<p>Include the protocol, such as https://company.com/careers/role.</p>');
        return;
      }

      const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();
      const path = parsedUrl.pathname.toLowerCase();
      const isAggregator = host.includes('indeed.com')
        || (host.includes('linkedin.com') && path.includes('/jobs'))
        || host.includes('ziprecruiter.com')
        || host.includes('glassdoor.com');
      const tone = isAggregator ? 'caution' : 'good';
      const value = isAggregator ? 'Aggregator' : 'Direct';
      const heading = isAggregator ? 'Aggregator link - find the direct career page' : 'Direct career page link ✓';
      const details = `
        <p>${escapeHtml(parsedUrl.hostname)} ${isAggregator ? 'looks like a third-party job board. Use it for discovery, then apply through the employer career page.' : 'does not match the common aggregator domains checked here. Confirm the page belongs to the employer before applying.'}</p>
      `;

      renderToolResult('job-link-verifier-result', tone, 'Job link type', value, heading, details);
    });
  }

  const velocityForm = document.getElementById('hiring-velocity-calculator-form');
  if (velocityForm) {
    velocityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(velocityForm);
      const rolesPosted = Math.max(0, getNumber(formData, 'rolesPosted'));
      const rolesFilled = Math.max(0, getNumber(formData, 'rolesFilled'));
      const avgDaysToFill = Math.max(1, getNumber(formData, 'avgDaysToFill', 45));
      const fillRate = rolesPosted ? Math.min(100, Math.round((rolesFilled / rolesPosted) * 100)) : 0;
      const speedScore = Math.max(0, Math.round(100 - ((avgDaysToFill - 20) * 1.8)));
      const velocityScore = Math.round((fillRate * 0.65) + (Math.min(100, speedScore) * 0.35));
      const tone = velocityScore >= 70 ? 'good' : velocityScore >= 45 ? 'caution' : 'risk';
      const recommendation = velocityScore >= 70
        ? 'Prioritize these roles. The company appears to be closing openings at a healthy pace.'
        : velocityScore >= 45
          ? 'Apply selectively and verify that the specific role is actively interviewing.'
          : 'Treat the funnel as slow until a recruiter confirms timeline and urgency.';
      const details = `
        <p>Fill rate: ${fillRate}%. Average time to fill: ${avgDaysToFill} days.</p>
        <p>${escapeHtml(recommendation)}</p>
      `;

      renderToolResult('hiring-velocity-calculator-result', tone, 'Velocity score', `${velocityScore}/100`, 'Hiring funnel movement', details);
    });
  }

  document.querySelectorAll('[data-article-slug]').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = card.getAttribute('data-article-slug');
      navigateTo('blog', { params: new URLSearchParams({ article: slug }) });
    });
  });
}


function applyInitialPageState() {
  const params = new URLSearchParams(window.location.search);
  const legacyPage = params.get('page');
  const query = params.get('q');
  const jobId = params.get('job');
  const page = normalizePageId(legacyPage || getPageIdFromPath(window.location.pathname));

  if (legacyPage) params.delete('page');

  navigateTo(page, {
    params,
    replace: Boolean(legacyPage) || window.location.pathname === '/' || window.location.pathname === '/index.html',
    scroll: false,
  });

  if (searchInput) searchInput.value = query || '';
  if (jobsSearchQuery) jobsSearchQuery.value = query || '';
  pendingInitialJobId = jobId || null;
}

function submitHeroSearch() {
  const query = heroSearch && heroSearch.value.trim();
  if (!query || !searchInput) return;
  searchInput.value = query;
  runLiveJobSearch(query);
}

document.querySelectorAll('[data-page]').forEach((el) => {
  if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'SPAN') {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      const pageId = el.dataset.page;
      if (pageId) navigateTo(pageId);
    });
  }
});

window.addEventListener('popstate', () => {
  applyInitialPageState();
  applyFilters();
});

window.addEventListener('scroll', () => {
  if (mainNav) mainNav.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

if (hamburger) hamburger.addEventListener('click', () => mobileMenu && mobileMenu.classList.toggle('open'));
if (mobileFilterToggle) {
  mobileFilterToggle.addEventListener('click', () => {
    const isOpen = mobileFilterToggle.getAttribute('aria-expanded') === 'true';
    setMobileFiltersOpen(!isOpen);
  });
}
if (mobileFilterScrim) mobileFilterScrim.addEventListener('click', closeMobileFilters);
if (mobileFilterClose) mobileFilterClose.addEventListener('click', closeMobileFilters);
if (navLoginTrigger) navLoginTrigger.addEventListener('click', () => openAuthModal('login'));
if (navSignUpTrigger) navSignUpTrigger.addEventListener('click', () => openAuthModal('signup'));
if (navSignOutTrigger) navSignOutTrigger.addEventListener('click', signOutAuth);
if (navMobileLoginTrigger) navMobileLoginTrigger.addEventListener('click', () => openAuthModal('login'));
if (navMobileSignUpTrigger) navMobileSignUpTrigger.addEventListener('click', () => openAuthModal('signup'));
if (navMobileOpenTracker) {
  navMobileOpenTracker.addEventListener('click', () => {
    navigateTo('tracker');
    closeMobileMenu();
  });
}
if (navMobileSignOutTrigger) navMobileSignOutTrigger.addEventListener('click', signOutAuth);
if (authGoogleSubmit) authGoogleSubmit.addEventListener('click', startGoogleSignIn);
if (authOverlay) authOverlay.addEventListener('click', closeAuthModal);
if (authModal) authModal.addEventListener('click', (event) => event.stopPropagation());
if (authCloseButton) authCloseButton.addEventListener('click', closeAuthModal);
if (heroSearch) heroSearch.addEventListener('keypress', (event) => { if (event.key === 'Enter') submitHeroSearch(); });
if (heroSearchButton) heroSearchButton.addEventListener('click', submitHeroSearch);
if (jobsSearchForm) {
  jobsSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runLiveJobSearch(jobsSearchQuery && jobsSearchQuery.value);
  });
}
if (jobsLiveSearchBtn) jobsLiveSearchBtn.addEventListener('click', () => runLiveJobSearch(searchInput && searchInput.value));
if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runLiveJobSearch(searchInput.value);
    }
  });
}
document.querySelectorAll('[data-live-query]').forEach((button) => {
  button.addEventListener('click', () => {
    const query = button.getAttribute('data-live-query') || '';
    if (jobsSearchQuery) jobsSearchQuery.value = query;
    runLiveJobSearch(query);
  });
});
if (heroResumeTrigger) heroResumeTrigger.addEventListener('click', openResumeUpload);
if (jobsResumeTrigger) jobsResumeTrigger.addEventListener('click', openResumeUpload);
if (resumeUploadInput) resumeUploadInput.addEventListener('change', handleResumeUpload);
if (resumeUploadOverlay) resumeUploadOverlay.addEventListener('click', () => closeResumeUploadModal());
if (resumeUploadModal) resumeUploadModal.addEventListener('click', (event) => event.stopPropagation());
if (resumeUploadCloseButton) resumeUploadCloseButton.addEventListener('click', () => closeResumeUploadModal());
trackerFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeTrackerFilter = button.dataset.trackerFilter || 'all';
    trackerFilterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderTracker();
  });
});
if (trackerListEl) {
  trackerListEl.addEventListener('click', (event) => {
    const target = event.target.closest('[data-tracker-action]');
    if (!target) return;
    handleTrackerAction(target.dataset.trackerId, target.dataset.trackerAction);
  });
  trackerListEl.addEventListener('input', (event) => {
    const target = event.target.closest('[data-tracker-stage]');
    if (!target) return;
    target.setAttribute('aria-valuetext', TRACKER_STAGES[Number(target.value)]);
    paintTrackerProgress(target.closest('.tracker-stage-slider-shell'), Number(target.value));
  });
  trackerListEl.addEventListener('change', (event) => {
    const target = event.target.closest('[data-tracker-stage]');
    if (!target) return;
    setTrackerStage(target.dataset.trackerId, Number(target.value));
  });
}
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) {
    if (jobsFilters) jobsFilters.classList.remove('mobile-open');
    if (mobileFilterToggle) mobileFilterToggle.setAttribute('aria-expanded', 'false');
    if (mobileFilterScrim) {
      mobileFilterScrim.classList.remove('open');
      mobileFilterScrim.hidden = true;
    }
    syncModalLock();
  }
});

function showToast(message) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQueryTokens(query) {
  const normalized = normalizeSearchText(query);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

function buildJobSearchIndex(job) {
  return normalizeSearchText([
    job.title,
    job.company,
    job.location,
    job.source,
    job.workMode,
    job.jobType,
    job.description,
    ...(job.requirements || []),
  ].join(' '));
}

function getJobQueryMatchScore(job, query) {
  if (!query) return 0;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const haystack = buildJobSearchIndex(job);
  const title = normalizeSearchText(job.title);
  const company = normalizeSearchText(job.company);
  const titleCompany = normalizeSearchText(`${job.title} ${job.company}`);
  const companyTitle = normalizeSearchText(`${job.company} ${job.title}`);
  const tokens = getQueryTokens(query);

  let score = 0;

  if (title === normalizedQuery) score += 180;
  if (company === normalizedQuery) score += 160;
  if (titleCompany === normalizedQuery || companyTitle === normalizedQuery) score += 320;
  if (title.includes(normalizedQuery)) score += 140;
  if (company.includes(normalizedQuery)) score += 120;
  if (titleCompany.includes(normalizedQuery) || companyTitle.includes(normalizedQuery)) score += 220;
  if (haystack.includes(normalizedQuery)) score += 90;

  const matchedTokens = tokens.filter((token) => haystack.includes(token));
  if (matchedTokens.length !== tokens.length) return 0;

  score += matchedTokens.length * 18;
  if (tokens.some((token) => title.includes(token))) score += 24;
  if (tokens.some((token) => company.includes(token))) score += 24;
  if (tokens.every((token) => titleCompany.includes(token))) score += 36;

  return score;
}

function sortJobs(list, sortValue, query) {
  if (sortValue === 'trust-desc') return list.sort((a, b) => b.trustScore - a.trustScore || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || a.daysPosted - b.daysPosted);
  if (sortValue === 'salary-desc') return list.sort((a, b) => b.salary.max - a.salary.max || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || b.trustScore - a.trustScore);
  if (sortValue === 'recent') return list.sort((a, b) => a.daysPosted - b.daysPosted || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || b.trustScore - a.trustScore);
  return list.sort((a, b) => {
    return (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0)
      || (b.queryMatchScore || 0) - (a.queryMatchScore || 0)
      || b.trustScore - a.trustScore
      || a.daysPosted - b.daysPosted;
  });
}

function normalizeLiveJob(job) {
  const salary = job && job.salary && typeof job.salary === 'object' ? job.salary : {};
  const minSalary = Number(salary.min) || 0;
  const maxSalary = Number(salary.max) || minSalary || 0;
  let url = String(job && job.url ? job.url : '');
  let domain = String(job && job.domain ? job.domain : '');

  try {
    const parsedUrl = new URL(url);
    if (!/^https?:$/i.test(parsedUrl.protocol)) url = '';
  } catch {
    url = '';
  }

  if (!domain && url) {
    try {
      domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      domain = '';
    }
  }

  const source = stripHtml(job && job.source ? job.source : liveJobSearchState.source || 'Live source');
  const directSignal = Boolean(job && job.directCompanyLink);
  const aggregatorDomain = /(^|\.)google\.com$|(^|\.)linkedin\.com$|(^|\.)indeed\.com$|(^|\.)glassdoor\.com$|(^|\.)ziprecruiter\.com$|(^|\.)monster\.com$|(^|\.)adzuna\.com$|(^|\.)greenhouse\.io$|(^|\.)lever\.co$/i.test(domain);
  const aggregatorSource = /google|linkedin|indeed|glassdoor|ziprecruiter|monster|adzuna/i.test(source);

  return {
    id: String(job && job.id ? job.id : `live-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    title: stripHtml(job && job.title ? job.title : 'Untitled role'),
    company: stripHtml(job && job.company ? job.company : 'Company not listed'),
    companyContext: stripHtml(job && job.companyContext ? job.companyContext : 'Live job listing'),
    location: stripHtml(job && job.location ? job.location : 'Location not listed'),
    source,
    jobType: stripHtml(job && job.jobType ? job.jobType : 'Full-time'),
    workMode: stripHtml(job && job.workMode ? job.workMode : 'On-site'),
    salary: {
      min: minSalary,
      max: Math.max(maxSalary, minSalary),
    },
    salaryText: String(job && job.salaryText ? job.salaryText : ''),
    salaryDisclosed: Boolean(job && job.salaryDisclosed),
    daysPosted: Math.max(0, Number(job && job.daysPosted) || 0),
    repostCount: Math.max(0, Number(job && job.repostCount) || 0),
    trustScore: Math.max(0, Math.min(100, Number(job && job.trustScore) || 50)),
    recentHiringActivity: Boolean(job && job.recentHiringActivity),
    directCompanyLink: directSignal || Boolean(url && domain && !aggregatorDomain && !aggregatorSource),
    hiringContact: Boolean(job && job.hiringContact),
    sentiment: stripHtml(job && job.sentiment ? job.sentiment : 'stable'),
    description: stripHtml(job && job.description ? job.description : 'Open the source listing to verify details and apply.'),
    requirements: Array.isArray(job && job.requirements) ? job.requirements.map(stripHtml).filter(Boolean) : ['Review the source listing for role-specific requirements.'],
    domain,
    url,
    saved: Boolean(job && job.saved),
  };
}

function normalizeStoredJob(job) {
  const company = job && job.companies ? job.companies : {};
  const title = job && job.title ? job.title : 'Untitled role';
  const companyName = company.name || job.company_name || 'Company not listed';
  const location = job && job.location ? job.location : 'Location not listed';
  const applyUrl = job && job.apply_url ? job.apply_url : job && job.source_url ? job.source_url : '';
  const sourceProvider = job && (job.external_source || job.source_provider || job.source) ? (job.external_source || job.source_provider || job.source) : 'Stored listing';
  const postedAt = job && (job.posted_at || job.first_seen_at) ? new Date(job.posted_at || job.first_seen_at) : null;
  const daysPosted = postedAt && !Number.isNaN(postedAt.getTime())
    ? Math.max(0, Math.round((Date.now() - postedAt.getTime()) / 86400000))
    : 7;
  const salaryMin = Number(job && job.salary_min) || 0;
  const salaryMax = Number(job && job.salary_max) || salaryMin || 0;
  let domain = '';
  try {
    domain = applyUrl ? new URL(applyUrl).hostname.replace(/^www\./, '') : '';
  } catch {
    domain = '';
  }

  return normalizeLiveJob({
    id: job && job.id,
    title,
    company: companyName,
    companyContext: company.trust_score
      ? `Company trust ${Math.round(Number(company.trust_score) * 100)}`
      : 'Stored Supabase listing',
    location,
    source: sourceProvider,
    jobType: job && job.job_type ? job.job_type : 'Full-time',
    workMode: job && job.remote_type === 'remote' ? 'Remote' : job && job.remote_type === 'hybrid' ? 'Hybrid' : 'On-site',
    salary: { min: salaryMin, max: Math.max(salaryMax, salaryMin) },
    salaryText: salaryMin || salaryMax ? `$${(salaryMin || salaryMax).toLocaleString()}-${Math.max(salaryMax, salaryMin).toLocaleString()} a year` : '',
    salaryDisclosed: Boolean(salaryMin || salaryMax),
    daysPosted,
    repostCount: Array.isArray(job && job.trust_flags) && job.trust_flags.some((flag) => /repost/i.test(flag)) ? 2 : 0,
    trustScore: Number(job && job.ghost_score) || Math.round(Number(job && job.company_trust_score ? job.company_trust_score : 0.6) * 100),
    recentHiringActivity: daysPosted <= 14 || (Array.isArray(job && job.trust_flags) && job.trust_flags.includes('recently_edited')),
    directCompanyLink: Boolean(applyUrl && !/(linkedin|indeed|glassdoor|ziprecruiter|google|adzuna)/i.test(domain)),
    hiringContact: false,
    sentiment: daysPosted <= 14 ? 'growing' : 'stable',
    description: job && job.description ? job.description : 'Open the source listing to verify details and apply.',
    requirements: Array.isArray(job && job.trust_flags) && job.trust_flags.length
      ? job.trust_flags.map((flag) => String(flag).replace(/_/g, ' '))
      : ['Review the source listing for role-specific requirements.'],
    domain,
    url: applyUrl,
    saved: false,
  });
}

const LOCATION_PRESETS = {
  remote: { label: 'Remote', hint: 'Work from home', query: 'remote' },
  hybrid: { label: 'Hybrid', hint: 'Office + home', query: 'hybrid' },
  anywhere: { label: 'Anywhere', hint: 'No location filter', query: '' },
};

function formatLocationParts(city, region, fallback) {
  const cleanCity = String(city || '').trim();
  const cleanRegion = String(region || '').trim();
  if (cleanCity && cleanRegion) return `${cleanCity}, ${cleanRegion}`;
  if (cleanCity) return cleanCity;
  if (cleanRegion) return cleanRegion;
  return String(fallback || '').trim();
}

function openLocationMenu() {
  if (!jobsLocationMenu || !jobsLocationTrigger) return;
  jobsLocationMenu.hidden = false;
  jobsLocationTrigger.setAttribute('aria-expanded', 'true');
  if (typeof hideAutocompletePanel === 'function') hideAutocompletePanel();
}

function closeLocationMenu() {
  if (!jobsLocationMenu || !jobsLocationTrigger) return;
  jobsLocationMenu.hidden = true;
  jobsLocationTrigger.setAttribute('aria-expanded', 'false');
}

function getLocationSearchValue() {
  const value = jobsLocationInput ? String(jobsLocationInput.value || '').trim() : '';
  if (!value || value === 'anywhere') return '';
  return LOCATION_PRESETS[value] ? LOCATION_PRESETS[value].query : value;
}

function selectLocation(value, label, hint, source = 'custom') {
  const normalizedValue = String(value || '').trim();
  const preset = LOCATION_PRESETS[normalizedValue];
  const nextLabel = label || (preset && preset.label) || normalizedValue || 'Anywhere';
  const nextHint = hint || (preset && preset.hint) || (source === 'ip' ? 'Approximate from IP' : source === 'precise' ? 'Precise location' : 'Specific location');

  if (jobsLocationInput) jobsLocationInput.value = preset ? normalizedValue : nextLabel;
  if (jobsLocationLabel) jobsLocationLabel.textContent = nextLabel;
  if (jobsLocationHint) jobsLocationHint.textContent = nextHint;

  if (jobsLocationMenu) {
    jobsLocationMenu.querySelectorAll('.location-option').forEach((option) => {
      const optionValue = option.getAttribute('data-value') || '';
      const isSelected = preset
        ? optionValue === normalizedValue
        : option.getAttribute('data-location-option') === source && source !== 'custom';
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-selected', String(isSelected));
    });
  }
}

async function fetchIpLocationSuggestion() {
  const option = jobsLocationMenu && jobsLocationMenu.querySelector('[data-location-option="ip"]');
  if (!option || !jobsIpLocationLabel) return;

  try {
    const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!response.ok) throw new Error('IP location unavailable');
    const payload = await response.json();
    const location = formatLocationParts(payload.city, payload.region_code || payload.region, payload.country_name);
    if (!location) throw new Error('IP location unavailable');

    option.dataset.value = location;
    option.classList.remove('is-loading');
    jobsIpLocationLabel.textContent = location;
  } catch (error) {
    option.dataset.value = '';
    option.classList.remove('is-loading');
    jobsIpLocationLabel.textContent = 'Use my approximate area';
    const detail = option.querySelector('small');
    if (detail) detail.textContent = 'IP lookup unavailable';
  }
}

async function reverseGeocodeLocation(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const coordinates = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Reverse geocode unavailable');
    const payload = await response.json();
    const address = payload && payload.address ? payload.address : {};
    const city = address.city || address.town || address.village || address.hamlet || address.county;
    const region = address.state_code || address.state;
    return formatLocationParts(city, region, coordinates) || coordinates;
  } catch (error) {
    return coordinates;
  }
}

function requestPreciseLocation() {
  const preciseOption = jobsLocationMenu && jobsLocationMenu.querySelector('[data-location-option="precise"]');
  if (!navigator.geolocation) {
    showToast('Precise location is not available in this browser.');
    return;
  }

  if (preciseOption) preciseOption.classList.add('is-loading');
  navigator.geolocation.getCurrentPosition(async (position) => {
    const location = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
    if (preciseOption) {
      preciseOption.classList.remove('is-loading');
      preciseOption.dataset.value = location;
      const label = preciseOption.querySelector('strong');
      const detail = preciseOption.querySelector('small');
      if (label) label.textContent = location;
      if (detail) detail.textContent = 'Precise browser location';
    }
    selectLocation(location, location, 'Precise location', 'precise');
    closeLocationMenu();
  }, () => {
    if (preciseOption) preciseOption.classList.remove('is-loading');
    showToast('Location permission was not granted.');
  }, {
    enableHighAccuracy: true,
    timeout: 9000,
    maximumAge: 300000,
  });
}

function initLocationPicker() {
  if (!jobsLocationPicker || !jobsLocationInput || !jobsLocationTrigger || !jobsLocationMenu) return;

  selectLocation(jobsLocationInput.value || 'remote');
  fetchIpLocationSuggestion();

  jobsLocationTrigger.addEventListener('click', () => {
    if (jobsLocationMenu.hidden) openLocationMenu();
    else closeLocationMenu();
  });

  jobsLocationMenu.addEventListener('click', (event) => {
    const option = event.target.closest('.location-option');
    if (!option) return;

    const type = option.getAttribute('data-location-option');
    if (type === 'precise') {
      requestPreciseLocation();
      return;
    }

    const value = option.dataset.value || '';
    if (!value) return;
    const strong = option.querySelector('strong');
    const small = option.querySelector('small');
    selectLocation(value, strong ? strong.textContent : value, small ? small.textContent : '', type === 'ip' ? 'ip' : 'preset');
    closeLocationMenu();
  });

  if (jobsLocationCustom) {
    jobsLocationCustom.addEventListener('input', () => {
      const value = jobsLocationCustom.value.trim();
      if (value) selectLocation(value, value, 'Specific location', 'custom');
    });
    jobsLocationCustom.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const value = jobsLocationCustom.value.trim();
        if (value) {
          selectLocation(value, value, 'Specific location', 'custom');
          closeLocationMenu();
          if (jobsSearchQuery) jobsSearchQuery.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeLocationMenu();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!jobsLocationPicker.contains(event.target)) closeLocationMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLocationMenu();
  });
}

function setLiveSearchLoading(isLoading, query = liveJobSearchState.query) {
  liveJobSearchState = {
    ...liveJobSearchState,
    hasSearched: liveJobSearchState.hasSearched || isLoading,
    isLoading,
    query,
    error: isLoading ? '' : liveJobSearchState.error,
  };
  renderJobs();
}

async function runLiveJobSearch(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (!query) {
    showToast('Enter a role, company, skill, or location to search.');
    if (jobsSearchQuery) jobsSearchQuery.focus();
    else if (searchInput) searchInput.focus();
    return;
  }

  if (searchInput) searchInput.value = query;
  if (jobsSearchQuery) jobsSearchQuery.value = query;

  if (typeof saveSearchToHistory === 'function') {
    saveSearchToHistory(query);
    renderPreviousSearches();
  }
  if (typeof hideAutocompletePanel === 'function') {
    hideAutocompletePanel();
  }

  // Read location selection and construct API query
  let apiQuery = query;
  const loc = getLocationSearchValue();
  if (loc && !query.toLowerCase().includes(loc.toLowerCase())) {
    apiQuery = `${query} ${loc}`;
  }

  navigateTo('jobs', { params: new URLSearchParams({ q: query }), scroll: false });
  setLiveSearchLoading(true, query);

  try {
    const response = await fetch(`/api/jobs?q=${encodeURIComponent(apiQuery)}&per_page=50&sort=trust`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Live job search failed.');

    allJobs = Array.isArray(payload.data) ? payload.data.map(normalizeStoredJob).filter((job) => job.url) : [];
    liveJobSearchState = {
      hasSearched: true,
      isLoading: false,
      query,
      source: 'supabase',
      error: '',
    };
    applyFilters();
  } catch (error) {
    allJobs = [];
    filteredJobs = [];
    liveJobSearchState = {
      hasSearched: true,
      isLoading: false,
      query,
      source: '',
      error: error instanceof Error ? error.message : 'Live job search failed.',
    };
    renderJobs();
    showToast('Live job search is unavailable right now.');
  }
}

function applyFilters() {
  if (typeof syncQuickFiltersUI === 'function') {
    syncQuickFiltersUI();
  }
  const query = (searchInput && searchInput.value.trim()) || '';
  const minTrustScore = parseInt((trustFilter && trustFilter.value) || '0', 10);
  const minSalary = parseInt((salaryFilter && salaryFilter.value) || '0', 10);
  const sentiment = (sentimentFilter && sentimentFilter.value) || 'all';
  const directOnly = Boolean(directToggle && directToggle.checked);
  const recruiterOnly = Boolean(recruiterToggle && recruiterToggle.checked);
  const selectedModes = Array.from(workModeCheckboxes).filter((cb) => cb.checked).map((cb) => cb.value);

  if (trustFilterValue) trustFilterValue.textContent = String(minTrustScore);

  const chipHighTrust = activeChipFilters.has('high-trust');
  const chipSalary50k = activeChipFilters.has('salary-50k');
  const chipDirect = activeChipFilters.has('direct-apply');
  const effectiveMinTrustScore = chipHighTrust ? Math.max(minTrustScore, 85) : minTrustScore;
  const effectiveMinSalary = chipSalary50k ? Math.max(minSalary, 50000) : minSalary;
  const effectiveDirectOnly = directOnly || chipDirect;
  const selectedModeSet = new Set(selectedModes);
  if (activeChipFilters.has('remote')) selectedModeSet.add('Remote');
  if (activeChipFilters.has('hybrid')) selectedModeSet.add('Hybrid');
  const effectiveModes = Array.from(selectedModeSet);

  const baseJobs = allJobs.filter((job) => {
    if (query && getJobQueryMatchScore(job, query) === 0) return false;
    if (job.trustScore < effectiveMinTrustScore) return false;
    if (job.salary.max < effectiveMinSalary) return false;
    if (sentiment !== 'all' && job.sentiment !== sentiment) return false;
    if (effectiveDirectOnly && !job.directCompanyLink) return false;
    if (recruiterOnly && !job.hiringContact) return false;
    if (effectiveModes.length && !effectiveModes.includes(job.workMode)) return false;
    return true;
  });

  filteredJobs = baseJobs.map((job) => ({
    ...job,
    resumeMatchScore: resumeProfile ? getResumeMatchScore(job, resumeProfile) : 0,
    queryMatchScore: query ? getJobQueryMatchScore(job, query) : 0,
  }));

  if (resumeMatchActive && resumeProfile && !query) {
    const strongMatches = filteredJobs.filter((job) => job.resumeMatchScore >= 4);
    if (strongMatches.length >= 3) filteredJobs = strongMatches;
  }

  sortJobs(filteredJobs, (sortSelect && sortSelect.value) || 'relevance', query);
  if (resumeMatchActive && resumeProfile && !query && filteredJobs.length > 13) {
    filteredJobs = filteredJobs.slice(0, 13);
  }
  currentPage = 1;
  renderJobs();
  if (pendingInitialJobId) {
    const matchedJob = filteredJobs.find((job) => String(job.id) === String(pendingInitialJobId));
    if (matchedJob) {
      openModal(matchedJob.id);
      pendingInitialJobId = null;
    }
  }
  closeMobileFilters();
}

[searchInput, trustFilter, salaryFilter, sentimentFilter, sortSelect].forEach((el) => el && el.addEventListener('input', applyFilters));
[directToggle, recruiterToggle].forEach((el) => el && el.addEventListener('change', applyFilters));
workModeCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', applyFilters));


function buildSmartTags(job) {
  const tags = [];
  if (job.directCompanyLink) tags.push(buildSignalTag('green', 'Live Source Link'));
  if (job.recentHiringActivity) tags.push(buildSignalTag('green', 'Actively Hiring'));
  if (!job.salaryDisclosed) tags.push(buildSignalTag('amber', 'Salary Not Disclosed'));
  if (job.repostCount > 1) tags.push(buildSignalTag(repostTagTone(job.trustScore), 'Reposted'));
  return tags.join('');
}

function renderJobs() {
  if (!jobsList || !jobsCount || !jobsCountSub || !paginationEl) return;

  const dirASearchWorkspace = document.getElementById('dirA-search-workspace');
  const jobsShell = document.getElementById('jobs-shell');
  if (dirASearchWorkspace) {
    if (liveJobSearchState.hasSearched) {
      dirASearchWorkspace.setAttribute('hidden', '');
      dirASearchWorkspace.style.display = 'none';
    } else {
      dirASearchWorkspace.removeAttribute('hidden');
      dirASearchWorkspace.style.display = 'block';
    }
  }
  if (jobsShell) {
    if (liveJobSearchState.hasSearched) {
      jobsShell.removeAttribute('hidden');
      jobsShell.style.display = 'grid';
    } else {
      jobsShell.setAttribute('hidden', '');
      jobsShell.style.display = 'none';
    }
  }

  jobsList.innerHTML = '';
  paginationEl.innerHTML = '';

  if (!liveJobSearchState.hasSearched) {
    jobsCount.textContent = 'Search live jobs';
    jobsCountSub.textContent = 'Start with a role, company, skill, or location.';
    return;
  }

  if (liveJobSearchState.isLoading) {
    jobsCount.textContent = 'Searching live jobs...';
    jobsCountSub.textContent = liveJobSearchState.query ? `Looking for "${liveJobSearchState.query}"` : 'Contacting live job providers.';
    jobsList.innerHTML = `
      <div class="jobs-loading-state">
        <span></span>
        <strong>Scanning live listings</strong>
        <p>We are pulling current openings and keeping source links attached.</p>
      </div>
    `;
    return;
  }

  if (filteredJobs.length === 0) {
    jobsCount.textContent = '0 openings';
    jobsCountSub.textContent = liveJobSearchState.error || (liveJobSearchState.query ? `No live matches for "${liveJobSearchState.query}".` : 'No live matches yet.');
    jobsList.innerHTML = '<div class="empty-state"><h3>No live jobs found.</h3><p>Try a broader title, remove strict filters, or search a nearby location.</p></div>';
    return;
  }

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filteredJobs.length);
  const pageJobs = filteredJobs.slice(start, end);

  jobsCount.textContent = `${filteredJobs.length.toLocaleString()} openings`;
  jobsCountSub.textContent = `Showing ${start + 1}-${end} of ${filteredJobs.length.toLocaleString()} live matches${liveJobSearchState.query ? ` for "${liveJobSearchState.query}"` : ''}`;

  pageJobs.forEach((job) => {
    const trustInfo = getTrustInfo(job.trustScore);
    const salaryLabel = formatJobSalaryLabel(job);
    const resumeChip = resumeProfile && job.resumeMatchScore > 0
      ? `<span class="meta-pill meta-pill-highlight">Resume Match ${Math.min(99, 58 + job.resumeMatchScore * 6)}%</span>`
      : '';
    const card = document.createElement('article');
    card.className = `job-card tone-${trustInfo.tone}`;
    card.innerHTML = `
      <button class="btn-bookmark job-bookmark-btn${job.saved ? ' saved' : ''}" type="button" aria-label="${job.saved ? 'Remove bookmark' : 'Save job'}">${bookmarkIcon(job.saved)}</button>
      <div class="job-card-grid">
        <div class="job-card-content">
          <div class="job-card-title-row">
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
          </div>
          <p class="job-company-line">${job.company} · ${job.location} · ${buildSourceMarkup(job.source)}</p>
          <div class="job-meta-line">
            ${resumeChip}
            <span class="meta-pill">${escapeHtml(salaryLabel)}</span>
            <span class="meta-pill">${escapeHtml(job.workMode)}</span>
            <span class="meta-pill">${escapeHtml(job.jobType)}</span>
            <span class="job-posted-age">${formatPostedAge(job.daysPosted)}</span>
          </div>
          <div class="job-smart-tags">${buildSmartTags(job)}</div>
        </div>

        <div class="job-trust-panel">
          <div class="trust-ring">${buildTrustRing(job.trustScore)}</div>
          <span class="job-score-status tone-${trustInfo.tone}">${trustInfo.label}</span>
        </div>
      </div>

      <div class="job-card-footer">
        <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener" class="btn btn-primary job-apply-btn">${escapeHtml(buildApplyLabel(job.domain))}</a>
      </div>
    `;

    const bookmarkButton = card.querySelector('.job-bookmark-btn');
    const applyButton = card.querySelector('.job-apply-btn');
    if (bookmarkButton) {
      bookmarkButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSave(job.id);
        renderJobs();
      });
    }
    if (applyButton) {
      applyButton.addEventListener('click', (event) => {
        event.stopPropagation();
        trackJobApplication(job);
        showToast('Added to your tracker and opened the application.');
      });
    }
    card.addEventListener('click', () => openModal(job.id));
    jobsList.appendChild(card);
  });

  renderPagination(totalPages);
}

function createPaginationButton(label, config) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `pagination-btn${config.active ? ' active' : ''}${config.text ? ' text' : ''}`;
  button.textContent = label;
  button.disabled = Boolean(config.disabled);
  button.addEventListener('click', config.onClick);
  return button;
}

function renderPagination(totalPages) {
  if (!paginationEl || totalPages <= 1) return;
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const normalizedStart = Math.max(1, endPage - 4);

  paginationEl.appendChild(createPaginationButton('Previous', {
    text: true,
    disabled: currentPage === 1,
    onClick: () => { if (currentPage > 1) { currentPage -= 1; renderJobs(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  }));

  for (let pageNumber = normalizedStart; pageNumber <= endPage; pageNumber += 1) {
    paginationEl.appendChild(createPaginationButton(String(pageNumber), {
      active: currentPage === pageNumber,
      onClick: () => { currentPage = pageNumber; renderJobs(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }));
  }

  paginationEl.appendChild(createPaginationButton('Next', {
    text: true,
    disabled: currentPage === totalPages,
    onClick: () => { if (currentPage < totalPages) { currentPage += 1; renderJobs(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  }));
}

function toggleSave(id) {
  const job = allJobs.find((entry) => entry.id === id);
  if (!job) return;
  job.saved = !job.saved;
  showToast(job.saved ? 'Saved. We\'ll keep an eye on this one.' : 'Removed from saved jobs.');
  if (activeModalJobId === id) syncModalBookmark(job);
}

function syncModalBookmark(job) {
  if (!modalArea) return;
  const button = modalArea.querySelector('.job-modal-bookmark');
  if (!button) return;
  button.classList.toggle('saved', job.saved);
  button.innerHTML = bookmarkIcon(job.saved);
}

function buildBreakdownRow(label, value) {
  return `
    <div class="factor-row">
      <div class="factor-row-top"><span>${label}</span><span>${value}/100</span></div>
      <div class="factor-bar-bg"><div class="factor-bar-fill" style="width:${value}%; background:${scoreColor(value)};"></div></div>
    </div>
  `;
}

function compactJobForAi(job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyContext: job.companyContext,
    location: job.location,
    source: job.source,
    jobType: job.jobType,
    workMode: job.workMode,
    salaryDisclosed: job.salaryDisclosed,
    daysPosted: job.daysPosted,
    repostCount: job.repostCount,
    trustScore: job.trustScore,
    recentHiringActivity: job.recentHiringActivity,
    directCompanyLink: job.directCompanyLink,
    hiringContact: job.hiringContact,
    sentiment: job.sentiment,
    description: job.description,
    requirements: job.requirements
  };
}

function buildInsightsList(items, className) {
  if (!items || !items.length) return '<p class="ai-insights-empty">No clear signal found.</p>';
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderInsightsLoading() {
  return `
    <div class="ai-insights ai-insights-loading" id="ai-insights-section">
      <div class="ai-insights-head">
        <p class="intel-card-label">AI Insights</p>
        <span>Analyzing</span>
      </div>
      <div class="ai-insights-skeleton"></div>
      <div class="ai-insights-skeleton short"></div>
      <div class="ai-insights-grid">
        <div class="ai-insights-skeleton"></div>
        <div class="ai-insights-skeleton"></div>
      </div>
    </div>
  `;
}

function renderInsights(jobId, insights) {
  if (activeModalJobId !== jobId || !modalArea) return;
  const container = modalArea.querySelector('#ai-insights-section');
  if (!container) return;

  container.className = 'ai-insights';
  container.innerHTML = `
    <div class="ai-insights-head">
      <p class="intel-card-label">AI Insights</p>
      <span>Live read</span>
    </div>
    <p class="ai-insights-verdict">${escapeHtml(insights.verdict)}</p>
    <div class="ai-insights-grid">
      <div>
        <h4>Green flags</h4>
        ${buildInsightsList(insights.greenFlags, 'ai-insights-list positive')}
      </div>
      <div>
        <h4>Red flags</h4>
        ${buildInsightsList(insights.redFlags, 'ai-insights-list warning')}
      </div>
    </div>
    <h4>Key requirements</h4>
    ${buildInsightsList(insights.keyRequirements, 'ai-insights-list')}
    <div class="ai-insights-advice">
      <p><strong>Interview angle</strong>${escapeHtml(insights.interviewAngle)}</p>
      <p><strong>Apply advice</strong>${escapeHtml(insights.applyAdvice)}</p>
    </div>
  `;
}

async function loadJobInsights(job) {
  const cache = loadInsightsCache();
  if (cache[job.id]) {
    renderInsights(job.id, cache[job.id]);
    return;
  }

  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job: compactJobForAi(job) })
    });

    if (!response.ok) throw new Error('Insights unavailable.');

    const insights = await response.json();
    cache[job.id] = insights;
    saveInsightsCache(cache);
    renderInsights(job.id, insights);
  } catch (error) {
    console.warn('[JOB_INSIGHTS]', error);
    if (activeModalJobId !== job.id || !modalArea) return;
    const container = modalArea.querySelector('#ai-insights-section');
    if (container) container.remove();
  }
}

function openModal(id) {
  if (!overlayEl || !modalArea) return;
  const job = allJobs.find((entry) => entry.id === id);
  if (!job) return;

  activeModalJobId = id;
  const trustInfo = getTrustInfo(job.trustScore);
  const salaryScore = job.salaryDisclosed ? 90 : 42;
  const freshnessScore = clamp(100 - job.daysPosted * 3, 18, 96);
  const directScore = job.directCompanyLink ? 95 : 52;
  const activityScore = job.recentHiringActivity ? 88 : 40;

  modalArea.innerHTML = `
    <div class="modal-header">
      <div class="modal-header-left">
        <p class="modal-report-label">Listing Trust Score Report</p>
        <h2>${job.title}</h2>
        <p>${job.company} · ${job.location} · ${buildSourceMarkup(job.source)}</p>
      </div>
      <div class="modal-header-right">
        <button class="btn-bookmark job-modal-bookmark${job.saved ? ' saved' : ''}" type="button" aria-label="${job.saved ? 'Remove bookmark' : 'Save job'}">${bookmarkIcon(job.saved)}</button>
        <button class="btn btn-secondary" id="modal-close-trigger" type="button">Close</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-desc">
        <h3>Role snapshot</h3>
        <p>${job.description}</p>
        <h3>What we found</h3>
        <div class="modal-signal-grid">
          ${job.directCompanyLink ? buildSignalTag('green', 'Live Source Link') : ''}
          ${job.recentHiringActivity ? buildSignalTag('green', 'Recent Hiring Activity') : ''}
          ${!job.salaryDisclosed ? buildSignalTag('amber', 'Salary Not Disclosed') : ''}
          ${job.repostCount > 1 ? buildSignalTag(repostTagTone(job.trustScore), 'Reposted') : ''}
        </div>
        <h3>Qualifications</h3>
        <ul>${job.requirements.map((requirement) => `<li>${requirement}</li>`).join('')}</ul>
        ${renderInsightsLoading()}
      </div>
      <aside class="modal-sidebar">
        <div class="sidebar-apply-block">
          <a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary btn-lg sidebar-apply-btn">${buildApplyLabel(job.domain)}</a>
          <p class="sidebar-apply-note">Opens the live source listing in a new tab</p>
        </div>
        <div class="intel-card">
          <p class="intel-card-label">Trust Breakdown</p>
          <div class="trust-breakdown-header">
            <div class="trust-ring trust-ring-large">${buildTrustRing(job.trustScore, 'large')}</div>
            <div class="ghost-detail-text">
              <h4 class="tone-${trustInfo.tone}">${trustInfo.label}</h4>
              <p>${trustInfo.description}</p>
            </div>
          </div>
          <div class="factor-list">
            ${buildBreakdownRow('Salary transparency', salaryScore)}
            ${buildBreakdownRow('Posting freshness', freshnessScore)}
            ${buildBreakdownRow('Live source link', directScore)}
            ${buildBreakdownRow('Recent Hiring Activity', activityScore)}
          </div>
        </div>
      </aside>
    </div>
  `;

  const closeButton = modalArea.querySelector('#modal-close-trigger');
  const bookmarkButton = modalArea.querySelector('.job-modal-bookmark');
  const applyButton = modalArea.querySelector('.sidebar-apply-btn');
  if (closeButton) closeButton.addEventListener('click', closeModal);
  if (bookmarkButton) bookmarkButton.addEventListener('click', () => {
    toggleSave(id);
    renderJobs();
  });
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      trackJobApplication(job);
      showToast('Added to your tracker and opened the application.');
    });
  }

  overlayEl.classList.add('open');
  syncModalLock();
  loadJobInsights(job);
}

function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  activeModalJobId = null;
  syncModalLock();
}

if (overlayEl) overlayEl.addEventListener('click', closeModal);
if (modalArea) modalArea.addEventListener('click', (event) => event.stopPropagation());

function getAssistantJobContext() {
  const jobs = (filteredJobs.length ? filteredJobs : allJobs)
    .slice(0, 12)
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      workMode: job.workMode,
      trustScore: job.trustScore,
      source: job.source,
      domain: job.domain,
      url: job.url,
      salary: formatJobSalaryLabel(job, ' est.'),
      daysPosted: job.daysPosted,
      directCompanyLink: job.directCompanyLink,
      recentHiringActivity: job.recentHiringActivity,
      summary: job.description,
    }));

  return jobs;
}

function getAssistantFilters() {
  return {
    query: (searchInput && searchInput.value.trim()) || '',
    trustScoreMinimum: trustFilter ? Number(trustFilter.value) : null,
    salaryMinimum: salaryFilter ? Number(salaryFilter.value) * 1000 : null,
    sentiment: sentimentFilter ? sentimentFilter.value : 'all',
    sort: sortSelect ? sortSelect.value : 'relevance',
    directOnly: directToggle ? directToggle.checked : false,
    recruiterOnly: recruiterToggle ? recruiterToggle.checked : false,
    workModes: Array.from(workModeCheckboxes).filter((input) => input.checked).map((input) => input.value)
  };
}

function setAssistantOpen(isOpen) {
  if (!assistantDrawer || !assistantTrigger) return;
  assistantDrawer.classList.toggle('open', isOpen);
  assistantDrawer.setAttribute('aria-hidden', String(!isOpen));
  assistantTrigger.setAttribute('aria-expanded', String(isOpen));
  if (isOpen && assistantInput) assistantInput.focus();
}

function appendAssistantMessage(role, content = '') {
  if (!assistantMessagesEl) return null;
  const messageEl = document.createElement('div');
  messageEl.className = `assistant-message ${role}`;
  messageEl.textContent = content;
  assistantMessagesEl.appendChild(messageEl);
  assistantMessagesEl.scrollTop = assistantMessagesEl.scrollHeight;
  return messageEl;
}

function setAssistantStatus(text) {
  if (assistantStatus) assistantStatus.textContent = text;
}

function isJobRecommendationPrompt(text) {
  return /\b(recommend|suggest|match|best|good fit|which jobs|what jobs|openings|roles|listings|apply)\b/i.test(text);
}

function renderAssistantMarkdown(content) {
  const escaped = escapeHtml(content);
  const lines = escaped.split(/\r?\n/);
  let html = '';
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html += '</ul>';
      listOpen = false;
    }
  };

  const formatInline = (value) => value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

  lines.forEach((line) => {
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (!listOpen) {
        html += '<ul>';
        listOpen = true;
      }
      html += `<li>${formatInline(bullet[1])}</li>`;
      return;
    }

    closeList();
    if (!line.trim()) {
      html += '<br>';
      return;
    }
    html += `<p>${formatInline(line)}</p>`;
  });

  closeList();
  return html;
}

function getJobMentionScore(job, normalizedAnswer) {
  const title = normalizeSearchText(job.title);
  const company = normalizeSearchText(job.company);
  const titleCompany = normalizeSearchText(`${job.title} ${job.company}`);
  const companyTitle = normalizeSearchText(`${job.company} ${job.title}`);
  const titleTokens = title.split(' ').filter((token) => token.length > 2);
  const companyMentioned = normalizedAnswer.includes(company);
  const exactTitleMentioned = normalizedAnswer.includes(title);
  const allTitleTokensMentioned = titleTokens.length > 0 && titleTokens.every((token) => normalizedAnswer.includes(token));

  if (normalizedAnswer.includes(titleCompany) || normalizedAnswer.includes(companyTitle)) return 100;
  if (companyMentioned && exactTitleMentioned) return 95;
  if (companyMentioned && allTitleTokensMentioned) return 90;
  if (exactTitleMentioned) return 70;
  return 0;
}

function findAssistantRecommendedJobs(answer, prompt) {
  const sourceJobs = filteredJobs.length ? filteredJobs : allJobs;
  const normalizedAnswer = normalizeSearchText(answer);
  const selected = sourceJobs
    .map((job) => ({ job, score: getJobMentionScore(job, normalizedAnswer) }))
    .filter((entry) => entry.score >= 70)
    .sort((a, b) => b.score - a.score || b.job.trustScore - a.job.trustScore)
    .map((entry) => entry.job);

  if (selected.length) return selected.slice(0, 4);
  return [];
}

function mergeLiveJobsIntoBoard(jobs) {
  const normalizedJobs = (jobs || []).map(normalizeLiveJob).filter((job) => job.url);
  if (!normalizedJobs.length) return [];

  const existingIds = new Set(allJobs.map((job) => job.id));
  normalizedJobs.forEach((job) => {
    if (!existingIds.has(job.id)) {
      allJobs.push(job);
      existingIds.add(job.id);
    }
  });

  return normalizedJobs;
}

function appendAssistantJobCards(jobs) {
  if (!assistantMessagesEl || !jobs.length) return;

  const group = document.createElement('div');
  group.className = 'assistant-job-card-group';
  group.setAttribute('aria-label', 'Recommended job listings');

  jobs.forEach((job) => {
    const trustInfo = getTrustInfo(job.trustScore);
    const salaryLabel = formatJobSalaryLabel(job, ' est.');
    const card = document.createElement('article');
    card.className = `assistant-job-card tone-${trustInfo.tone}`;
    card.innerHTML = `
      <div class="assistant-job-card-main">
        <div>
          <p class="assistant-job-card-company">${escapeHtml(job.company)} &middot; ${escapeHtml(job.location)}</p>
          <h3>${escapeHtml(job.title)}</h3>
        </div>
        <div class="assistant-job-score">
          <span>${job.trustScore}</span>
          <small>${escapeHtml(trustInfo.label)}</small>
        </div>
      </div>
      <p class="assistant-job-description">${escapeHtml(job.description)}</p>
      <div class="assistant-job-meta">
        <span>${escapeHtml(salaryLabel)}</span>
        <span>${escapeHtml(job.workMode)}</span>
        <span>${escapeHtml(formatPostedAge(job.daysPosted))}</span>
      </div>
      <div class="assistant-job-actions">
        <button class="assistant-job-detail" type="button">Details</button>
        <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener" class="assistant-job-open">Open listing</a>
      </div>
    `;

    const detailButton = card.querySelector('.assistant-job-detail');
    const openLink = card.querySelector('.assistant-job-open');
    if (detailButton) detailButton.addEventListener('click', () => openModal(job.id));
    if (openLink) {
      openLink.addEventListener('click', () => {
        trackJobApplication(job);
        showToast('Added to your tracker and opened the listing.');
      });
    }
    group.appendChild(card);
  });

  assistantMessagesEl.appendChild(group);
  assistantMessagesEl.scrollTop = assistantMessagesEl.scrollHeight;
}

async function sendAssistantMessage(event) {
  event.preventDefault();
  if (assistantBusy || !assistantInput) return;

  const content = assistantInput.value.trim();
  if (!content) return;

  assistantInput.value = '';
  assistantMessages.push({ role: 'user', content });
  assistantMessages = assistantMessages.slice(-MAX_ASSISTANT_MESSAGES);
  appendAssistantMessage('user', content);

  const assistantMessageEl = appendAssistantMessage('assistant', '');
  assistantBusy = true;
  setAssistantStatus('emplAID is reading your context...');

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: assistantMessages,
        resumeProfile,
        currentPage: document.body.dataset.page || 'home',
        trackerApplications,
        jobs: getAssistantJobContext(),
        filters: getAssistantFilters()
      })
    });

    if (!response.ok || !response.body) throw new Error('Assistant unavailable.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let assistantRecommendedJobs = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      events.forEach((eventChunk) => {
        const line = eventChunk.split('\n').find((item) => item.startsWith('data: '));
        if (!line) return;
        const payload = safeParseJSON(line.slice(6), null);
        if (!payload) return;
        if (payload.error) throw new Error(payload.error);
        if (payload.done && Array.isArray(payload.jobs)) {
          assistantRecommendedJobs = mergeLiveJobsIntoBoard(payload.jobs);
          return;
        }
        if (payload.delta) {
          answer += payload.delta;
          if (assistantMessageEl) assistantMessageEl.textContent = answer;
          if (assistantMessagesEl) assistantMessagesEl.scrollTop = assistantMessagesEl.scrollHeight;
        }
      });
    }

    const finalAnswer = answer.trim() || 'I could not find enough context to answer that cleanly yet.';
    if (assistantMessageEl) assistantMessageEl.innerHTML = renderAssistantMarkdown(finalAnswer);
    assistantMessages.push({ role: 'assistant', content: finalAnswer });
    assistantMessages = assistantMessages.slice(-MAX_ASSISTANT_MESSAGES);
    appendAssistantJobCards(assistantRecommendedJobs);
    setAssistantStatus('Ready');
  } catch (error) {
    console.warn('[ASSISTANT]', error);
    const message = 'I could not reach emplAID right now. Try again in a moment.';
    if (assistantMessageEl) assistantMessageEl.textContent = message;
    assistantMessages.push({ role: 'assistant', content: message });
    setAssistantStatus('Offline');
  } finally {
    assistantBusy = false;
  }
}

if (assistantTrigger) assistantTrigger.addEventListener('click', () => setAssistantOpen(!assistantDrawer.classList.contains('open')));
if (assistantClose) assistantClose.addEventListener('click', () => setAssistantOpen(false));
if (assistantForm) assistantForm.addEventListener('submit', sendAssistantMessage);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (assistantDrawer && assistantDrawer.classList.contains('open')) {
    setAssistantOpen(false);
    return;
  }
  if (authOverlay && authOverlay.classList.contains('open')) {
    closeAuthModal();
    return;
  }
  if (resumeUploadOverlay && resumeUploadOverlay.classList.contains('open')) {
    closeResumeUploadModal();
    return;
  }
  if (jobsFilters && jobsFilters.classList.contains('mobile-open') && window.innerWidth <= 760) {
    closeMobileFilters();
    return;
  }
  if (activeModalJobId !== null) closeModal();
});


/* ==========================================================================
   Redesigned Search & Smart Suggest logic
   ========================================================================== */

const autocompleteSuggestions = {
  roles: [
    { title: 'Software Engineer', meta: '2.8k+ jobs scanned · 73 avg trust' },
    { title: 'Product Designer', meta: '840 jobs scanned · 81 avg trust' },
    { title: 'Product Analyst', meta: '620 jobs scanned · 79 avg trust' },
    { title: 'Data Scientist', meta: '430 jobs scanned · 75 avg trust' },
    { title: 'Frontend Engineer', meta: '1.2k+ jobs scanned · 78 avg trust' },
    { title: 'Product Manager', meta: '950 jobs scanned · 80 avg trust' },
    { title: 'Operations Manager', meta: '310 jobs scanned · 72 avg trust' },
    { title: 'Marketing Specialist', meta: '540 jobs scanned · 70 avg trust' }
  ],
  companies: [
    { name: 'Stripe', initial: 'S', color: '#635bff', openings: 84 },
    { name: 'Anthropic', initial: 'A', color: '#cc785c', openings: 62 },
    { name: 'Vercel', initial: 'V', color: '#000000', openings: 28 },
    { name: 'Figma', initial: 'F', color: '#f24e1e', openings: 41 },
    { name: 'Ramp', initial: 'R', color: '#1a1f2c', openings: 33 },
    { name: 'Linear', initial: 'L', color: '#5e6ad2', openings: 15 }
  ]
};

var selectedSuggestionIndex = -1;
var currentFilteredSuggestions = [];

// Active chip filters — independent state so they work even before jobs-shell is visible
const activeChipFilters = new Set();

const QUICK_FILTERS_CONFIG = {
  'high-trust':    { label: 'High Trust Score',   emoji: '⭐' },
  'remote':        { label: 'Remote-only',         emoji: '🌐' },
  'salary-50k':    { label: '$50k+',               emoji: '💰' },
  'hybrid':        { label: 'Hybrid',               emoji: '🏢' },
  'direct-apply':  { label: 'Direct Apply',         emoji: '✅' }
};

// Cookie utilities
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function loadPreviousSearchesFromCookie() {
  const raw = getCookie('emploid_prev_searches');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function loadPreviousSearches() {
  migrateCookieSearchesToStorage();
  return readStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY);
}

function saveSearchToHistory(query) {
  const term = String(query || '').trim();
  if (!term) return;
  
  let history = loadPreviousSearches();
  history = history.filter(h => h.toLowerCase() !== term.toLowerCase());
  history.unshift(term);
  history = history.slice(0, 5);
  
  writeStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, history);
}

function renderPreviousSearches() {
  const container = document.getElementById('dirA-previous-searches');
  const list = document.getElementById('previous-searches-list');
  if (!container || !list) return;
  
  const history = loadPreviousSearches();
  if (history.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  list.innerHTML = history.map((h, idx) => `
    <div class="dirA-activity-row previous-search-item" data-query="${escapeHtml(h)}" data-index="${idx}">
      <div class="text">
        <span class="query">${escapeHtml(h)}</span>
      </div>
      <button type="button" class="prev-search-delete" data-index="${idx}" title="Remove this search" aria-label="Remove search: ${escapeHtml(h)}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
      <span class="go">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="8 7 17 7 17 16"></polyline></svg>
      </span>
    </div>
  `).join('');
  
  // Click on row to re-run search
  list.querySelectorAll('.previous-search-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      // Don't trigger if delete button was clicked
      if (e.target.closest('.prev-search-delete')) return;
      const query = item.getAttribute('data-query');
      if (jobsSearchQuery) jobsSearchQuery.value = query;
      runLiveJobSearch(query);
    });
  });

  // Per-item delete
  list.querySelectorAll('.prev-search-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      let history = loadPreviousSearches();
      history.splice(idx, 1);
      writeStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, history);
      renderPreviousSearches();
    });
  });
}

function clearSearchHistory() {
  writeStorageArray(PREVIOUS_SEARCHES_STORAGE_KEY, []);
  renderPreviousSearches();
  showToast('Search history cleared.');
}

// Autocomplete suggestions panel logic
function hideAutocompletePanel() {
  const panel = document.getElementById('search-autocomplete-panel');
  if (panel) {
    panel.hidden = true;
  }
  selectedSuggestionIndex = -1;
}

function showAutocompletePanel() {
  const panel = document.getElementById('search-autocomplete-panel');
  if (panel && currentFilteredSuggestions.length > 0) {
    panel.hidden = false;
  }
}

function updateFilteredSuggestions(typed) {
  const val = String(typed || '').trim().toLowerCase();
  
  if (!val) {
    currentFilteredSuggestions = [];
    selectedSuggestionIndex = -1;
    hideAutocompletePanel();
    return;
  }

  // Filter roles
  const filteredRoles = autocompleteSuggestions.roles.filter(r => 
    r.title.toLowerCase().includes(val)
  );
  
  // Filter companies
  const filteredCompanies = autocompleteSuggestions.companies.filter(c => 
    c.name.toLowerCase().includes(val)
  );
  
  currentFilteredSuggestions = [];
  
  if (filteredRoles.length > 0) {
    currentFilteredSuggestions.push({ type: 'section', label: 'Suggested Roles' });
    filteredRoles.forEach(r => {
      currentFilteredSuggestions.push({
        type: 'role',
        title: r.title,
        meta: r.meta,
        value: r.title
      });
    });
  }
  
  if (filteredCompanies.length > 0) {
    currentFilteredSuggestions.push({ type: 'section', label: 'Suggested Companies' });
    filteredCompanies.forEach(c => {
      currentFilteredSuggestions.push({
        type: 'company',
        title: c.name,
        meta: `${c.openings} open roles`,
        value: c.name,
        initial: c.initial,
        color: c.color
      });
    });
  }
  
  selectedSuggestionIndex = -1;
  renderAutocompletePanel();
}

function renderAutocompletePanel() {
  const panel = document.getElementById('search-autocomplete-panel');
  if (!panel) return;
  
  if (currentFilteredSuggestions.length === 0) {
    panel.hidden = true;
    return;
  }
  
  panel.hidden = false;
  
  let html = '';
  let selectableIndex = 0;
  
  currentFilteredSuggestions.forEach((item) => {
    if (item.type === 'section') {
      html += `<div class="autocomplete-section-label">${item.label}</div>`;
    } else {
      item.selectableIndex = selectableIndex;
      const isSelected = selectableIndex === selectedSuggestionIndex;
      
      const iconMarkup = item.type === 'role' 
        ? `<div class="autocomplete-row-icon" style="background: var(--orange-soft); color: var(--orange-500);">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7.5"></circle><line x1="20.5" y1="20.5" x2="17" y2="17"></line></svg>
           </div>`
        : `<div class="autocomplete-row-icon" style="background: ${item.color || '#bcc9d8'}; color: #fff;">${item.initial}</div>`;
        
      html += `
        <button type="button" class="autocomplete-row ${isSelected ? 'is-selected' : ''}" data-index="${selectableIndex}">
          ${iconMarkup}
          <div class="autocomplete-row-text">
            <div class="autocomplete-row-title">${escapeHtml(item.title)}</div>
            <div class="autocomplete-row-meta">${escapeHtml(item.meta)}</div>
          </div>
          ${isSelected ? '<span class="autocomplete-row-enter"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg></span>' : ''}
        </button>
      `;
      selectableIndex++;
    }
  });
  
  html += `
    <div class="autocomplete-footer">
      <div class="hints">
        <span class="hint"><span class="kbd">↵</span> open</span>
        <span class="hint"><span class="kbd">↑</span><span class="kbd">↓</span> navigate</span>
        <span class="hint"><span class="kbd">esc</span> close</span>
      </div>
      <span class="brand">Emploid Smart Suggest</span>
    </div>
  `;
  
  panel.innerHTML = html;
  
  panel.querySelectorAll('.autocomplete-row').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(row.getAttribute('data-index'), 10);
      selectAutocompleteIndex(idx);
    });
  });
}

function selectAutocompleteIndex(idx) {
  const item = currentFilteredSuggestions.find(i => i.selectableIndex === idx);
  if (item) {
    if (jobsSearchQuery) {
      jobsSearchQuery.value = item.value;
    }
    hideAutocompletePanel();
    runLiveJobSearch(item.value);
  }
}

function handleSearchInputKeydown(event) {
  const panel = document.getElementById('search-autocomplete-panel');
  if (!panel || panel.hidden) {
    return;
  }
  
  const selectableCount = currentFilteredSuggestions.filter(i => i.type !== 'section').length;
  
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (selectedSuggestionIndex < selectableCount - 1) {
      selectedSuggestionIndex++;
    } else {
      selectedSuggestionIndex = 0;
    }
    renderAutocompletePanel();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (selectedSuggestionIndex > 0) {
      selectedSuggestionIndex--;
    } else {
      selectedSuggestionIndex = selectableCount - 1;
    }
    renderAutocompletePanel();
  } else if (event.key === 'Enter') {
    if (selectedSuggestionIndex >= 0) {
      event.preventDefault();
      selectAutocompleteIndex(selectedSuggestionIndex);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    hideAutocompletePanel();
    if (jobsSearchQuery) {
      jobsSearchQuery.blur();
    }
  }
}

// Quick Filters Sync logic — reads from activeChipFilters set
function syncQuickFiltersUI() {
  for (const filterId of Object.keys(QUICK_FILTERS_CONFIG)) {
    const chip = document.getElementById(`qf-${filterId}`);
    if (!chip) continue;
    const isActive = activeChipFilters.has(filterId);
    chip.classList.toggle('is-active', isActive);
    chip.setAttribute('aria-pressed', String(isActive));
  }
}

function getWorkModeCheckbox(mode) {
  return Array.from(workModeCheckboxes).find((checkbox) => checkbox.value === mode);
}

function applyQuickFilterToControls(filterId, isActive) {
  if (filterId === 'high-trust' && trustFilter) {
    if (isActive && Number(trustFilter.value) < 85) {
      trustFilter.value = '85';
      trustFilter.dataset.quickFilter = filterId;
    } else if (!isActive && trustFilter.dataset.quickFilter === filterId) {
      trustFilter.value = '0';
      delete trustFilter.dataset.quickFilter;
    }
    if (trustFilterValue) trustFilterValue.textContent = String(trustFilter.value);
  }

  if (filterId === 'salary-50k' && salaryFilter) {
    if (isActive && Number(salaryFilter.value) < 50000) {
      salaryFilter.value = '50000';
      salaryFilter.dataset.quickFilter = filterId;
    } else if (!isActive && salaryFilter.dataset.quickFilter === filterId) {
      salaryFilter.value = '0';
      delete salaryFilter.dataset.quickFilter;
    }
  }

  if (filterId === 'direct-apply' && directToggle) {
    if (isActive) {
      directToggle.checked = true;
      directToggle.dataset.quickFilter = filterId;
    } else if (directToggle.dataset.quickFilter === filterId) {
      directToggle.checked = false;
      delete directToggle.dataset.quickFilter;
    }
  }

  const modeByFilter = { remote: 'Remote', hybrid: 'Hybrid' };
  const mode = modeByFilter[filterId];
  const modeCheckbox = mode ? getWorkModeCheckbox(mode) : null;
  if (modeCheckbox) {
    if (isActive) {
      modeCheckbox.checked = true;
      modeCheckbox.dataset.quickFilter = filterId;
    } else if (modeCheckbox.dataset.quickFilter === filterId) {
      modeCheckbox.checked = false;
      delete modeCheckbox.dataset.quickFilter;
    }
  }
}

function clearQuickFilterFromManualControls(event) {
  const target = event.currentTarget;
  if (!target || !target.dataset || !target.dataset.quickFilter) return;

  const filterId = target.dataset.quickFilter;
  const shouldClear =
    (filterId === 'high-trust' && Number(target.value) < 85) ||
    (filterId === 'salary-50k' && Number(target.value) < 50000) ||
    (filterId === 'direct-apply' && !target.checked) ||
    ((filterId === 'remote' || filterId === 'hybrid') && !target.checked);

  if (shouldClear) {
    activeChipFilters.delete(filterId);
    delete target.dataset.quickFilter;
    syncQuickFiltersUI();
  }
}

function handleQuickFilterClick(filterId) {
  if (!QUICK_FILTERS_CONFIG[filterId]) return;

  const chip = document.getElementById(`qf-${filterId}`);
  if (!chip) return;

  if (activeChipFilters.has(filterId)) {
    activeChipFilters.delete(filterId);
  } else {
    activeChipFilters.add(filterId);
  }

  applyQuickFilterToControls(filterId, activeChipFilters.has(filterId));

  chip.classList.remove('is-toggling');
  void chip.offsetWidth;
  chip.classList.add('is-toggling');
  window.setTimeout(() => chip.classList.remove('is-toggling'), 560);

  syncQuickFiltersUI();

  if (liveJobSearchState && liveJobSearchState.hasSearched) {
    applyFilters();
    return;
  }

  const pendingQuery = jobsSearchQuery && jobsSearchQuery.value.trim();
  if (pendingQuery) {
    runLiveJobSearch(pendingQuery);
  }
}

// Initialize Redesigned Search Page
function initSearchRedesign() {
  if (!jobsSearchQuery) return;
  initLocationPicker();
  
  // 1. Previous Searches from Cookies
  renderPreviousSearches();
  const clearHistBtn = document.getElementById('clear-history-btn');
  if (clearHistBtn) {
    clearHistBtn.addEventListener('click', clearSearchHistory);
  }
  
  // 2. Autocomplete Panel setup — only show suggestions when user has typed something
  jobsSearchQuery.addEventListener('focus', () => {
    if (jobsSearchQuery.value.trim()) {
      updateFilteredSuggestions(jobsSearchQuery.value);
      showAutocompletePanel();
    }
  });
  
  jobsSearchQuery.addEventListener('input', () => {
    updateFilteredSuggestions(jobsSearchQuery.value);
    showAutocompletePanel();
  });
  
  jobsSearchQuery.addEventListener('keydown', handleSearchInputKeydown);
  
  // Hide panel when clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.search-input-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      hideAutocompletePanel();
    }
  });
  
  // 3. Quick Filters Click Listeners
  for (const filterId of Object.keys(QUICK_FILTERS_CONFIG)) {
    const chip = document.getElementById(`qf-${filterId}`);
    if (chip) {
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => handleQuickFilterClick(filterId));
    }
  }

  [trustFilter, salaryFilter].forEach((el) => {
    if (el) el.addEventListener('input', clearQuickFilterFromManualControls);
  });
  [directToggle, ...Array.from(workModeCheckboxes)].forEach((el) => {
    if (el) el.addEventListener('change', clearQuickFilterFromManualControls);
  });
  
  // Initial sync
  syncQuickFiltersUI();

  // 5. Activity Rail Click Listeners
  document.querySelectorAll('.dirA-activity-row').forEach(row => {
    row.addEventListener('click', () => {
      const query = row.getAttribute('data-activity-query');
      if (query) {
        if (jobsSearchQuery) jobsSearchQuery.value = query;
        runLiveJobSearch(query);
      }
    });
  });
  
  // 4. Global Keyboard Shortcut '/' to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) && !document.activeElement.isContentEditable) {
      if (jobsSearchQuery) {
        e.preventDefault();
        jobsSearchQuery.focus();
        jobsSearchQuery.select();
        // Trigger suggestions dropdown on focus
        updateFilteredSuggestions(jobsSearchQuery.value);
        showAutocompletePanel();
      }
    }
  });
}

// Page initialization
ensureFilsonProLoaded();
renderAuthState();
setAuthMode();
initializeAuth();
renderHomePreview();
renderResumeMatchUI();
renderTracker();
initBlogEvents();
initHomeInteractions();
initSearchRedesign(); // Initialize search redesign
applyInitialPageState();
if (document.body.dataset.page === 'jobs' && searchInput && searchInput.value.trim()) {
  runLiveJobSearch(searchInput.value.trim());
} else {
  applyFilters();
}
