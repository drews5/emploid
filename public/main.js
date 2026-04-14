'use strict';

const COMPANIES = [
  { name: 'Target', context: 'Retail | Fortune 50', sentiment: 'growing' },
  { name: 'Google', context: 'Technology | Public', sentiment: 'stable' },
  { name: 'Best Buy', context: 'Retail | Public', sentiment: 'stable' },
  { name: 'UnitedHealth Group', context: 'Healthcare | Public', sentiment: 'growing' },
  { name: 'Adobe', context: 'Software | Public', sentiment: 'growing' },
  { name: 'Airbnb', context: 'Travel | Public', sentiment: 'stable' },
  { name: 'Spotify', context: 'Media | Public', sentiment: 'stable' },
  { name: 'Stripe', context: 'Fintech | Private', sentiment: 'growing' },
  { name: 'Lyft', context: 'Mobility | Public', sentiment: 'layoffs' },
  { name: 'Peloton', context: 'Consumer | Public', sentiment: 'layoffs' }
];

const JOB_TITLES = [
  'Financial Analyst',
  'Product Designer',
  'Software Engineer',
  'Marketing Manager',
  'Data Analyst',
  'Business Operations Manager',
  'Frontend Engineer',
  'Program Coordinator',
  'Customer Success Manager',
  'Recruiting Coordinator'
];

const LOCATIONS = ['Minneapolis, MN', 'Chicago, IL', 'Remote', 'Austin, TX', 'New York, NY', 'Seattle, WA'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const JOB_TYPES = ['Full-time', 'Full-time', 'Full-time', 'Contract'];
const SOURCES = ['LinkedIn', 'Indeed', 'Handshake', 'Glassdoor', 'Company Direct'];

const SALARY_BY_TITLE = {
  'Financial Analyst': [75, 95],
  'Product Designer': [105, 145],
  'Software Engineer': [120, 170],
  'Marketing Manager': [95, 125],
  'Data Analyst': [80, 115],
  'Business Operations Manager': [95, 135],
  'Frontend Engineer': [115, 160],
  'Program Coordinator': [62, 84],
  'Customer Success Manager': [72, 102],
  'Recruiting Coordinator': [58, 82]
};

const DESCRIPTIONS = [
  'This team is hiring for a role with immediate business impact and clear ownership from day one.',
  'You will work across functions, communicate often, and ship practical outcomes in a fast-moving team.',
  'The company is looking for someone who can keep quality high while navigating ambiguity and multiple stakeholders.',
  'This is a strong fit for someone who wants visible work, steady collaboration, and a direct path to outcomes.'
];

const REQUIREMENTS_POOL = [
  [
    '2+ years of relevant experience in a comparable role',
    'Strong communication across cross-functional teams',
    'Comfort with ambiguity and evolving priorities',
    'Evidence of delivering measurable outcomes'
  ],
  [
    'Bachelor\'s degree or equivalent practical experience',
    'Experience with modern tools and workflows in your discipline',
    'Clear written communication and stakeholder management',
    'Ability to work independently with good judgment'
  ],
  [
    'Experience in a startup, agency, or high-growth environment',
    'Ability to prioritize quickly without losing quality',
    'Strong analytical thinking and operational rigor',
    'Comfort presenting recommendations clearly'
  ]
];

const PREVIEW_LISTINGS = [
  { title: 'Financial Analyst', company: 'Target', location: 'Minneapolis, MN', source: 'LinkedIn', trustScore: 98, salary: '$75k-$90k', workMode: 'Hybrid', jobType: 'Full-time', age: '2d ago' },
  { title: 'Senior Financial Planning and Strategy Analyst', company: 'Northwestern Mutual Life Insurance Company', location: 'Minneapolis, MN', source: 'LinkedIn', trustScore: 91, salary: '$120k-$145k', workMode: 'Remote', jobType: 'Full-time', age: '1d ago' },
  { title: 'Marketing Manager', company: 'Best Buy', location: 'Minneapolis, MN', source: 'Handshake', trustScore: 67, salary: '$85k-$102k', workMode: 'Hybrid', jobType: 'Full-time', age: '5d ago' },
  { title: 'Operations Coordinator', company: 'Peloton', location: 'New York, NY', source: 'Glassdoor', trustScore: 34, salary: '$58k-$68k', workMode: 'On-site', jobType: 'Full-time', age: '3w ago' },
  { title: 'Software Engineer', company: 'Google', location: 'Chicago, IL', source: 'Company Direct', trustScore: 95, salary: '$135k-$168k', workMode: 'Hybrid', jobType: 'Full-time', age: '4d ago' }
];

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
const RESUME_STORAGE_KEY = 'emploid-resume-profile-v1';

const RESUME_ROLE_PROFILES = [
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

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatSalary(value) {
  return `$${Math.round(value / 1000)}k`;
}

function buildSalary(title) {
  const [low, high] = SALARY_BY_TITLE[title] || [70, 120];
  const min = Math.round((low + Math.random() * (high - low) * 0.4) / 5) * 5;
  const max = Math.round((min + (high - low) * 0.35 + Math.random() * (high - low) * 0.18) / 5) * 5;
  return { min: min * 1000, max: max * 1000 };
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
  return source.toLowerCase().replace(/\s+/g, '-');
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
  return `<span class="source-inline source-${sourceClass(source)}">via ${source}</span>`;
}

function buildSignalTag(type, label) {
  return `<span class="signal-chip ${type}">${label}</span>`;
}

function repostTagTone(score) {
  if (score >= 80) return 'gray';
  if (score >= 50) return 'amber';
  return 'red';
}

function buildApplyLabel(domain) {
  return `Apply on ${domain}/careers →`;
}

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadTrackerApplications() {
  const saved = safeParseJSON(window.localStorage.getItem(TRACKER_STORAGE_KEY), []);
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
  window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerApplications));
}

function loadResumeProfile() {
  return safeParseJSON(window.localStorage.getItem(RESUME_STORAGE_KEY), null);
}

function saveResumeProfile() {
  if (resumeProfile) window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resumeProfile));
  else window.localStorage.removeItem(RESUME_STORAGE_KEY);
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
  const roleScores = RESUME_ROLE_PROFILES
    .map((profile) => ({
      ...profile,
      score: profile.terms.reduce((total, term) => total + (normalized.includes(term) ? 2 : 0), 0)
    }))
    .filter((profile) => profile.score > 0)
    .sort((left, right) => right.score - left.score);

  const focusProfiles = roleScores.slice(0, 2);
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
    summary: focusRoles.length ? focusRoles.join(' + ') : 'Personalized search',
    chips: [
      ...focusRoles,
      ...workModes,
      ...locations.slice(0, 1),
      ...skills.slice(0, 2)
    ].filter((value, index, array) => value && array.indexOf(value) === index).slice(0, 6)
  };
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

function makeData() {
  return Array.from({ length: 72 }, (_, index) => {
    const company = pick(COMPANIES);
    const title = pick(JOB_TITLES);
    const workMode = pick(WORK_MODES);
    const location = workMode === 'Remote' ? 'Remote' : pick(LOCATIONS.filter((item) => item !== 'Remote'));
    const source = pick(SOURCES);
    const jobType = pick(JOB_TYPES);
    const salary = buildSalary(title);
    const salaryDisclosed = Math.random() > 0.28;
    const directCompanyLink = source === 'Company Direct' || Math.random() > 0.2;
    const recentHiringActivity = company.sentiment === 'growing' || Math.random() > 0.65;
    const daysPosted = Math.floor(Math.random() * 36) + 1;
    const repostCount = clamp(Math.floor(Math.random() * 4) + (daysPosted > 18 ? 1 : 0), 0, 4);
    const hiringContact = Math.random() > 0.48;
    const domain = `${company.name.toLowerCase().replace(/\s+/g, '')}.com`;

    let trustScore = 44;
    if (salaryDisclosed) trustScore += 18;
    if (directCompanyLink) trustScore += 16;
    if (recentHiringActivity) trustScore += 14;
    if (daysPosted < 7) trustScore += 14;
    else if (daysPosted > 24) trustScore -= 14;
    if (repostCount > 1) trustScore -= 18;
    if (company.sentiment === 'layoffs') trustScore -= 10;
    if (company.sentiment === 'growing') trustScore += 8;
    trustScore += Math.round((Math.random() - 0.5) * 12);
    trustScore = clamp(trustScore, 8, 99);

    return {
      id: index,
      title,
      company: company.name,
      companyContext: company.context,
      location,
      source,
      jobType,
      workMode,
      salary,
      salaryDisclosed,
      daysPosted,
      repostCount,
      trustScore,
      recentHiringActivity,
      directCompanyLink,
      hiringContact,
      sentiment: company.sentiment,
      description: DESCRIPTIONS[index % DESCRIPTIONS.length],
      requirements: REQUIREMENTS_POOL[index % REQUIREMENTS_POOL.length],
      domain,
      url: `https://www.${domain}/careers/${8200 + index}`,
      saved: false
    };
  });
}

const allJobs = makeData();
let filteredJobs = [];
let currentPage = 1;
let activeModalJobId = null;

const mainNav = document.getElementById('main-nav');
const heroSearch = document.getElementById('hero-search');
const heroSearchButton = document.getElementById('hero-search-btn');
const searchInput = document.getElementById('search-input');
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
const toastEl = document.getElementById('toast');
const mobileMenu = document.getElementById('nav-mobile-menu');
const hamburger = document.getElementById('nav-hamburger');
const homePreviewList = document.getElementById('home-preview-list');
const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
const jobsFilters = document.getElementById('jobs-filters');
const trackerSummaryGrid = document.getElementById('tracker-summary-grid');
const trackerListEl = document.getElementById('tracker-list');
const trackerChart = document.getElementById('tracker-chart');
const trackerChartStat = document.getElementById('tracker-chart-stat');
const trackerCalloutCard = document.getElementById('tracker-callout-card');
const trackerToolbarNote = document.getElementById('tracker-toolbar-note');
const trackerFilterButtons = document.querySelectorAll('[data-tracker-filter]');
const homeResumeTrigger = document.getElementById('home-resume-trigger');
const jobsResumeTrigger = document.getElementById('jobs-resume-trigger');
const homeResumeStatus = document.getElementById('home-resume-status');
const resumeMatchSummary = document.getElementById('resume-match-summary');
const resumeMatchChips = document.getElementById('resume-match-chips');
const clearResumeMatchButton = document.getElementById('clear-resume-match');
const resumeUploadInput = document.getElementById('resume-upload-input');

let toastTimer;
let activeTrackerFilter = 'all';
let expandedTrackerId = null;
let trackerApplications = loadTrackerApplications();
let resumeProfile = loadResumeProfile();

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

function trackerStageMarkup(stage) {
  const stageIndex = TRACKER_STAGES.indexOf(stage);
  return `
    <div class="tracker-progress">
      <div class="tracker-stage-labels">
        ${TRACKER_STAGES.map((label, index) => {
          const className = index === stageIndex ? 'current' : index < stageIndex ? 'active' : '';
          return `<span class="${className}">${label}</span>`;
        }).join('')}
      </div>
      <div class="tracker-stage-track">
        ${TRACKER_STAGES.map((_, index) => {
          const className = index === stageIndex ? 'current' : index < stageIndex ? 'filled' : '';
          return `<span class="${className}"></span>`;
        }).join('')}
      </div>
    </div>
  `;
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
  if (application.status === 'archived') return { label: 'Restore', action: 'restore' };
  if (application.stage === 'Offer') return { label: 'View Offer', action: 'toggle' };
  if (application.status === 'needs-action') return { label: 'Send Follow-up', action: 'follow-up' };
  if (application.stage === 'Interview') return { label: 'Prep Guide', action: 'toggle' };
  return { label: 'Details', action: 'toggle' };
}

function getTrackerSecondaryAction(application) {
  if (application.status === 'archived') return { label: 'Details', action: 'toggle' };
  return { label: 'Timeline', action: 'toggle' };
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
    showToast('Application stage updated.');
    return;
  }

  if (action === 'archive') {
    updateTrackerApplication(applicationId, (entry) => ({
      ...entry,
      status: 'archived',
      lastActivity: 'Archived today',
      nextAction: 'Archived to keep your board focused on live roles.'
    }));
    showToast('Application archived.');
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
    salary: `${formatSalary(job.salary.min)}-${formatSalary(job.salary.max)}${job.salaryDisclosed ? '' : ' (Est.)'}`,
    lastActivity: 'Added from search just now',
    nextAction: job.hiringContact
      ? 'A recruiter signal was found here. Follow up within 48 hours while the role is still warm.'
      : 'Give this role 5 business days, then send one concise follow-up if it still looks active.',
    tags: [
      job.directCompanyLink ? 'Direct company link' : 'Aggregator posting',
      job.hiringContact ? 'Hiring contact spotted' : 'No recruiter listed',
      `${job.workMode} role`
    ],
    interviewsThisWeek: false,
    url: job.url
  };

  trackerApplications = [application, ...trackerApplications];
  saveTrackerApplications();
  renderTracker();
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
            ${trackerStageMarkup(application.stage)}
            <div class="tracker-meta-row">
              ${metaPills.map((item) => `<span class="tracker-meta-pill">${item}</span>`).join('')}
            </div>
            <div class="tracker-note tone-${trustInfo.tone}"><strong>Next move:</strong> ${application.nextAction}</div>
          </div>

          <div class="tracker-card-actions">
            <button class="btn btn-primary" type="button" data-tracker-action="${primary.action}" data-tracker-id="${application.id}">${primary.label}</button>
            <button class="btn btn-secondary tracker-secondary-btn" type="button" data-tracker-action="${secondary.action}" data-tracker-id="${application.id}">${secondary.label}</button>
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
                <button class="btn btn-secondary" type="button" data-tracker-action="${application.status === 'archived' ? 'restore' : 'archive'}" data-tracker-id="${application.id}">${application.status === 'archived' ? 'Restore to board' : 'Archive role'}</button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderResumeMatchUI() {
  if (homeResumeStatus) {
    homeResumeStatus.textContent = resumeProfile
      ? `${resumeProfile.fileName}: tailoring around ${resumeProfile.summary}.`
      : 'Upload your resume and we’ll tailor the search instantly.';
  }

  if (resumeMatchSummary) {
    resumeMatchSummary.textContent = resumeProfile
      ? `Matching for ${resumeProfile.summary}. Uploading a new resume refreshes the results immediately.`
      : 'Upload a PDF or plain-text resume and we’ll surface the strongest matching roles in this feed.';
  }

  if (resumeMatchChips) {
    resumeMatchChips.innerHTML = resumeProfile
      ? resumeProfile.chips.map((chip) => `<span class="resume-match-chip">${chip}</span>`).join('')
      : '';
  }

  if (clearResumeMatchButton) clearResumeMatchButton.classList.toggle('visible', Boolean(resumeProfile));
}

function renderTracker() {
  renderTrackerSummary();
  renderTrackerList();
  renderTrackerInsights();
}

function openResumeUpload() {
  if (resumeUploadInput) resumeUploadInput.click();
}

async function handleResumeUpload() {
  const file = resumeUploadInput && resumeUploadInput.files && resumeUploadInput.files[0];
  if (!file) return;

  try {
    const text = await extractResumeText(file);
    resumeProfile = buildResumeProfile(text, file.name);
    saveResumeProfile();
    renderResumeMatchUI();
    navigateTo('jobs');
    applyFilters();
    showToast(`Matched your search to ${resumeProfile.summary}.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not read that resume yet.');
  } finally {
    if (resumeUploadInput) resumeUploadInput.value = '';
  }
}

function clearResumeMatch() {
  resumeProfile = null;
  saveResumeProfile();
  renderResumeMatchUI();
  applyFilters();
  showToast('Resume match cleared.');
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
}

function setMobileFiltersOpen(isOpen) {
  if (!mobileFilterToggle || !jobsFilters) return;
  mobileFilterToggle.setAttribute('aria-expanded', String(isOpen));
  jobsFilters.classList.toggle('mobile-open', isOpen);
}

function closeMobileFilters() {
  if (window.innerWidth <= 760) setMobileFiltersOpen(false);
}

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach((pageEl) => pageEl.classList.remove('active'));
  document.querySelectorAll('.nav-link, .nav-mobile-link').forEach((linkEl) => linkEl.classList.remove('active'));
  const pageEl = document.getElementById(`page-${pageId}`);
  if (pageEl) pageEl.classList.add('active');
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach((linkEl) => {
    if (linkEl.classList.contains('nav-link') || linkEl.classList.contains('nav-mobile-link')) linkEl.classList.add('active');
  });
  document.body.dataset.page = pageId;
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function submitHeroSearch() {
  const query = heroSearch && heroSearch.value.trim();
  if (!query || !searchInput) return;
  searchInput.value = query;
  navigateTo('jobs');
  applyFilters();
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
if (heroSearch) heroSearch.addEventListener('keypress', (event) => { if (event.key === 'Enter') submitHeroSearch(); });
if (heroSearchButton) heroSearchButton.addEventListener('click', submitHeroSearch);
if (homeResumeTrigger) homeResumeTrigger.addEventListener('click', openResumeUpload);
if (jobsResumeTrigger) jobsResumeTrigger.addEventListener('click', openResumeUpload);
if (clearResumeMatchButton) clearResumeMatchButton.addEventListener('click', clearResumeMatch);
if (resumeUploadInput) resumeUploadInput.addEventListener('change', handleResumeUpload);
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
}
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) {
    if (jobsFilters) jobsFilters.classList.remove('mobile-open');
    if (mobileFilterToggle) mobileFilterToggle.setAttribute('aria-expanded', 'false');
  }
});

function showToast(message) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function sortJobs(list, sortValue, query) {
  if (sortValue === 'trust-desc') return list.sort((a, b) => b.trustScore - a.trustScore || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || a.daysPosted - b.daysPosted);
  if (sortValue === 'salary-desc') return list.sort((a, b) => b.salary.max - a.salary.max || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || b.trustScore - a.trustScore);
  if (sortValue === 'recent') return list.sort((a, b) => a.daysPosted - b.daysPosted || (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || b.trustScore - a.trustScore);
  return list.sort((a, b) => {
    const matchA = query && (a.title.toLowerCase().includes(query) || a.company.toLowerCase().includes(query)) ? 1 : 0;
    const matchB = query && (b.title.toLowerCase().includes(query) || b.company.toLowerCase().includes(query)) ? 1 : 0;
    return (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0) || matchB - matchA || b.trustScore - a.trustScore;
  });
}

function applyFilters() {
  const query = (searchInput && searchInput.value.trim().toLowerCase()) || '';
  const minTrustScore = parseInt((trustFilter && trustFilter.value) || '0', 10);
  const minSalary = parseInt((salaryFilter && salaryFilter.value) || '0', 10);
  const sentiment = (sentimentFilter && sentimentFilter.value) || 'all';
  const directOnly = Boolean(directToggle && directToggle.checked);
  const recruiterOnly = Boolean(recruiterToggle && recruiterToggle.checked);
  const selectedModes = Array.from(workModeCheckboxes).filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);

  if (trustFilterValue) trustFilterValue.textContent = String(minTrustScore);

  const baseJobs = allJobs.filter((job) => {
    if (query && ![job.title, job.company, job.location].some((value) => value.toLowerCase().includes(query))) return false;
    if (job.trustScore < minTrustScore) return false;
    if (job.salary.max < minSalary) return false;
    if (sentiment !== 'all' && job.sentiment !== sentiment) return false;
    if (directOnly && !job.directCompanyLink) return false;
    if (recruiterOnly && !job.hiringContact) return false;
    if (selectedModes.length && !selectedModes.includes(job.workMode)) return false;
    return true;
  });

  filteredJobs = baseJobs.map((job) => ({
    ...job,
    resumeMatchScore: resumeProfile ? getResumeMatchScore(job, resumeProfile) : 0
  }));

  if (resumeProfile && !query) {
    const strongMatches = filteredJobs.filter((job) => job.resumeMatchScore >= 4);
    if (strongMatches.length >= 3) filteredJobs = strongMatches;
  }

  sortJobs(filteredJobs, (sortSelect && sortSelect.value) || 'relevance', query);
  currentPage = 1;
  renderJobs();
  closeMobileFilters();
}

[searchInput, trustFilter, salaryFilter, sentimentFilter, sortSelect].forEach((el) => el && el.addEventListener('input', applyFilters));
[directToggle, recruiterToggle].forEach((el) => el && el.addEventListener('change', applyFilters));
workModeCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', applyFilters));

function buildSmartTags(job) {
  const tags = [];
  if (job.directCompanyLink) tags.push(buildSignalTag('green', 'Direct Company Link'));
  if (job.recentHiringActivity) tags.push(buildSignalTag('green', 'Actively Hiring'));
  if (!job.salaryDisclosed) tags.push(buildSignalTag('amber', 'Salary Not Disclosed'));
  if (job.repostCount > 1) tags.push(buildSignalTag(repostTagTone(job.trustScore), 'Reposted'));
  return tags.join('');
}

function renderJobs() {
  if (!jobsList || !jobsCount || !jobsCountSub || !paginationEl) return;

  jobsList.innerHTML = '';
  paginationEl.innerHTML = '';

  if (filteredJobs.length === 0) {
    jobsCount.textContent = '0 openings across 6 job boards';
    jobsCountSub.textContent = 'Scanning job boards...';
    jobsList.innerHTML = '<div class="empty-state"><h3>No matches for that search.</h3><p>Try broadening your filters or searching for a different role.</p></div>';
    return;
  }

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filteredJobs.length);
  const pageJobs = filteredJobs.slice(start, end);

  jobsCount.textContent = `${filteredJobs.length.toLocaleString()} openings across 6 job boards`;
  jobsCountSub.textContent = `Showing ${start + 1}-${end} of ${filteredJobs.length.toLocaleString()} matches`;

  pageJobs.forEach((job) => {
    const trustInfo = getTrustInfo(job.trustScore);
    const salaryLabel = `${formatSalary(job.salary.min)}-${formatSalary(job.salary.max)}${job.salaryDisclosed ? '' : ' (Est.)'}`;
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
            <h3 class="job-title">${job.title}</h3>
          </div>
          <p class="job-company-line">${job.company} · ${job.location} · ${buildSourceMarkup(job.source)}</p>
          <div class="job-meta-line">
            ${resumeChip}
            <span class="meta-pill">${salaryLabel}</span>
            <span class="meta-pill">${job.workMode}</span>
            <span class="meta-pill">${job.jobType}</span>
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
        <a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary job-apply-btn">${buildApplyLabel(job.domain)}</a>
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
          ${job.directCompanyLink ? buildSignalTag('green', 'Direct Company Link') : ''}
          ${job.recentHiringActivity ? buildSignalTag('green', 'Recent Hiring Activity') : ''}
          ${!job.salaryDisclosed ? buildSignalTag('amber', 'Salary Not Disclosed') : ''}
          ${job.repostCount > 1 ? buildSignalTag(repostTagTone(job.trustScore), 'Reposted') : ''}
        </div>
        <h3>Qualifications</h3>
        <ul>${job.requirements.map((requirement) => `<li>${requirement}</li>`).join('')}</ul>
      </div>
      <aside class="modal-sidebar">
        <div class="sidebar-apply-block">
          <a href="${job.url}" target="_blank" rel="noopener" class="btn btn-primary btn-lg sidebar-apply-btn">${buildApplyLabel(job.domain)}</a>
          <p class="sidebar-apply-note">Routes straight to the employer's own site</p>
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
            ${buildBreakdownRow('Direct Company Link', directScore)}
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
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  document.body.classList.remove('modal-open');
  activeModalJobId = null;
}

if (overlayEl) overlayEl.addEventListener('click', closeModal);
if (modalArea) modalArea.addEventListener('click', (event) => event.stopPropagation());
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && activeModalJobId !== null) closeModal(); });

renderHomePreview();
renderResumeMatchUI();
renderTracker();
applyFilters();
