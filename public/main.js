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

let toastTimer;

function renderHomePreview() {
  if (!homePreviewList) return;
  homePreviewList.innerHTML = PREVIEW_LISTINGS.map((listing) => {
    const trustInfo = getTrustInfo(listing.trustScore);
    return `
      <article class="preview-job-card tone-${trustInfo.tone}">
        <div class="preview-job-main">
          <h3 class="preview-card-title">${listing.title}</h3>
          <p>${listing.company} · ${listing.location} · ${buildSourceMarkup(listing.source)}</p>
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

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
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
if (heroSearch) heroSearch.addEventListener('keypress', (event) => { if (event.key === 'Enter') submitHeroSearch(); });
if (heroSearchButton) heroSearchButton.addEventListener('click', submitHeroSearch);

function showToast(message) {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function sortJobs(list, sortValue, query) {
  if (sortValue === 'trust-desc') return list.sort((a, b) => b.trustScore - a.trustScore || a.daysPosted - b.daysPosted);
  if (sortValue === 'salary-desc') return list.sort((a, b) => b.salary.max - a.salary.max || b.trustScore - a.trustScore);
  if (sortValue === 'recent') return list.sort((a, b) => a.daysPosted - b.daysPosted || b.trustScore - a.trustScore);
  return list.sort((a, b) => {
    const matchA = query && (a.title.toLowerCase().includes(query) || a.company.toLowerCase().includes(query)) ? 1 : 0;
    const matchB = query && (b.title.toLowerCase().includes(query) || b.company.toLowerCase().includes(query)) ? 1 : 0;
    return matchB - matchA || b.trustScore - a.trustScore;
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

  filteredJobs = allJobs.filter((job) => {
    if (query && ![job.title, job.company, job.location].some((value) => value.toLowerCase().includes(query))) return false;
    if (job.trustScore < minTrustScore) return false;
    if (job.salary.max < minSalary) return false;
    if (sentiment !== 'all' && job.sentiment !== sentiment) return false;
    if (directOnly && !job.directCompanyLink) return false;
    if (recruiterOnly && !job.hiringContact) return false;
    if (selectedModes.length && !selectedModes.includes(job.workMode)) return false;
    return true;
  });

  sortJobs(filteredJobs, (sortSelect && sortSelect.value) || 'relevance', query);
  currentPage = 1;
  renderJobs();
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
    if (applyButton) applyButton.addEventListener('click', (event) => event.stopPropagation());
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
  if (closeButton) closeButton.addEventListener('click', closeModal);
  if (bookmarkButton) bookmarkButton.addEventListener('click', () => {
    toggleSave(id);
    renderJobs();
  });

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
applyFilters();
