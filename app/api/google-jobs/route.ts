import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleJobsUrl,
  getPreparsedJobs,
  normalizeGoogleJobQuery,
  parseGoogleJobsHtml,
} from '@/lib/google-jobs';

export const dynamic = 'force-dynamic';

const GOOGLE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function parseSalaryText(value: string) {
  const fallback = { min: 52000, max: 92000 };
  const matches = value.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*([Kk])?/g) || [];
  const amounts = matches
    .map((match) => {
      const amountMatch = match.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*([Kk])?/);
      if (!amountMatch) return null;
      let amount = Number(amountMatch[1]);
      if (!Number.isFinite(amount)) return null;
      if (amountMatch[2]) amount *= 1000;
      if (/\b(hour|hr)\b/i.test(value) && amount < 1000) amount *= 2080;
      return Math.round(amount);
    })
    .filter((amount): amount is number => amount !== null);

  if (!amounts.length) return fallback;
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return { min, max: max === min ? Math.round(max * 1.12) : max };
}

function postedTextToDays(value: string) {
  const text = String(value || '').toLowerCase();
  if (!text || text === 'today') return 0;
  if (text === 'yesterday') return 1;
  const match = text.match(/(\d+)\s+(hour|day|week|month)/);
  if (!match) return 7;
  const amount = Number(match[1]);
  if (match[2].startsWith('hour')) return 0;
  if (match[2].startsWith('day')) return amount;
  if (match[2].startsWith('week')) return amount * 7;
  return amount * 30;
}

function externalJobToEmploidJob(job: any, index: number, sourceName: string) {
  const title = job.title || job.job_title || 'Untitled role';
  const company = job.company_name || job.company || job.employer_name || 'Company not listed';
  const location = job.location || job.job_location || 'Location not listed';
  const via = String(job.via || job.source || job.publisher || sourceName || 'Listing source').replace(/^via\s+/i, '');
  const applyOptions = job.apply_options || job.apply_links || job.related_links || [];
  const applyLink =
    job.apply_link ||
    job.link ||
    job.share_link ||
    job.sharing_link ||
    job.job_apply_link ||
    applyOptions.find((option: any) => option?.link)?.link ||
    applyOptions.find((option: any) => option?.url)?.url ||
    buildGoogleJobsUrl(`${title} ${company}`);
  const salaryText =
    job.salary ||
    job.salary_range ||
    job.extensions?.find?.((item: string) => /\$|salary|hour|year/i.test(item)) ||
    '';
  const salary = parseSalaryText(String(salaryText || ''));
  const postedText =
    job.detected_extensions?.posted_at ||
    job.detected_extensions?.posted_at_date ||
    job.extensions?.find?.((item: string) => /ago|today|yesterday/i.test(item)) ||
    '';
  const jobType =
    job.detected_extensions?.schedule ||
    job.detected_extensions?.schedule_type ||
    job.extensions?.find?.((item: string) => /full-time|part-time|contract|internship/i.test(item)) ||
    'Full-time';
  const daysPosted = postedTextToDays(String(postedText || ''));
  const domain = (() => {
    try {
      return new URL(applyLink).hostname.replace(/^www\./, '');
    } catch {
      return 'google.com';
    }
  })();
  const key = `${title}|${company}|${location}|${index}`;

  return {
    id: `live-${hashText(key)}`,
    title,
    company,
    companyContext: `${via} listing`,
    location,
    source: via,
    jobType,
    workMode: /remote/i.test(`${title} ${location}`) ? 'Remote' : /hybrid/i.test(`${title} ${location}`) ? 'Hybrid' : 'On-site',
    salary,
    salaryText: String(salaryText || ''),
    salaryDisclosed: Boolean(salaryText),
    daysPosted,
    repostCount: daysPosted > 21 ? 1 : 0,
    trustScore: Math.max(30, Math.min(98, 52 + (salaryText ? 16 : 0) + (daysPosted <= 7 ? 16 : 0) + (domain !== 'google.com' ? 12 : 0))),
    recentHiringActivity: daysPosted <= 7,
    directCompanyLink: domain !== 'google.com',
    hiringContact: /linkedin|recruit|talent/i.test(via),
    sentiment: daysPosted <= 10 ? 'growing' : 'stable',
    description: job.description || job.snippet || `${company} is listing ${title} in ${location}.`,
    requirements: Array.isArray(job.job_highlights)
      ? job.job_highlights.flatMap((group: any) => group?.items || []).slice(0, 4)
      : Array.isArray(job.highlights)
        ? job.highlights.slice(0, 4)
        : ['Review the source listing for role-specific requirements.'],
    domain,
    url: applyLink,
    saved: false,
  };
}

function parseLiveSearchQuery(query: string) {
  const cleaned = query.replace(/\bjobs?\b/gi, ' ').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(.+?)\s+(?:in|near)\s+(.+)$/i);
  if (!match) return { what: cleaned, where: '' };

  return {
    what: match[1].trim(),
    where: match[2].trim(),
  };
}

const JOB_QUERY_WORDS = new Set([
  'accounting',
  'admin',
  'analyst',
  'assistant',
  'care',
  'cashier',
  'customer',
  'data',
  'design',
  'developer',
  'driver',
  'engineer',
  'finance',
  'health',
  'information',
  'intern',
  'it',
  'legal',
  'manager',
  'marketing',
  'nurse',
  'operations',
  'product',
  'project',
  'remote',
  'retail',
  'sales',
  'server',
  'software',
  'support',
  'teacher',
  'technology',
  'warehouse',
]);

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function looksLikeCompanyQuery(what: string, where: string) {
  const words = normalizeWords(what);
  if (where || words.length !== 1) return false;
  return !JOB_QUERY_WORDS.has(words[0]);
}

function scoreAdzunaResult(job: any, what: string, where: string) {
  const queryWords = normalizeWords(what);
  const whereWords = normalizeWords(where);
  const title = String(job.title || '').toLowerCase();
  const company = String(job.company?.display_name || '').toLowerCase();
  const category = String(job.category?.label || '').toLowerCase();
  const location = String(job.location?.display_name || '').toLowerCase();
  const description = String(job.description || '').toLowerCase();
  let score = 0;

  if (what && title.includes(what.toLowerCase())) score += 14;
  if (what && company.includes(what.toLowerCase())) score += 18;
  for (const word of queryWords) {
    if (title.includes(word)) score += 7;
    if (company.includes(word)) score += 10;
    if (category.includes(word)) score += 3;
    if (description.includes(word)) score += 1;
  }
  for (const word of whereWords) {
    if (location.includes(word)) score += 4;
  }

  return score;
}

function adzunaJobToEmploidJob(job: any, index: number) {
  const title = job.title || 'Untitled role';
  const company = job.company?.display_name || 'Company not listed';
  const location = job.location?.display_name || 'Location not listed';
  const salaryMin = Number(job.salary_min) || 52000;
  const salaryMax = Number(job.salary_max) || salaryMin || 92000;
  const salaryDisclosed = Boolean(job.salary_min || job.salary_max);
  const createdAt = job.created ? new Date(job.created) : null;
  const daysPosted = createdAt && !Number.isNaN(createdAt.getTime())
    ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / 86400000))
    : 7;
  const applyLink = job.redirect_url || job.adref || '';
  const domain = (() => {
    try {
      return new URL(applyLink).hostname.replace(/^www\./, '');
    } catch {
      return 'adzuna.com';
    }
  })();
  const jobType = job.contract_time === 'part_time' ? 'Part-time' : job.contract_type === 'contract' ? 'Contract' : 'Full-time';
  const key = `${title}|${company}|${location}|adzuna|${index}`;

  return {
    id: `adzuna-${hashText(key)}`,
    title,
    company,
    companyContext: job.category?.label || 'Job listing',
    location,
    source: 'Adzuna',
    jobType,
    workMode: /remote/i.test(`${title} ${location} ${job.description || ''}`) ? 'Remote' : /hybrid/i.test(`${title} ${location} ${job.description || ''}`) ? 'Hybrid' : 'On-site',
    salary: {
      min: Math.round(salaryMin),
      max: Math.round(Math.max(salaryMax, salaryMin)),
    },
    salaryText: salaryDisclosed ? `$${Math.round(salaryMin).toLocaleString()}-$${Math.round(Math.max(salaryMax, salaryMin)).toLocaleString()} a year` : '',
    salaryDisclosed,
    daysPosted,
    repostCount: daysPosted > 21 ? 1 : 0,
    trustScore: Math.max(30, Math.min(98, 52 + (salaryDisclosed ? 16 : 0) + (daysPosted <= 7 ? 16 : 0) + 10)),
    recentHiringActivity: daysPosted <= 7,
    directCompanyLink: Boolean(applyLink),
    hiringContact: false,
    sentiment: daysPosted <= 10 ? 'growing' : 'stable',
    description: job.description || `${company} is listing ${title} in ${location}.`,
    requirements: ['Review the source listing for role-specific requirements.'],
    domain,
    url: applyLink || `https://www.adzuna.com/search?q=${encodeURIComponent(title)}`,
    saved: false,
  };
}

async function requestAdzunaJobs(what: string, where: string, maxResults: number) {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return null;

  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: String(maxResults),
    'content-type': 'application/json',
  });

  if (what) params.set('what', what);
  if (where) params.set('where', where);

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params.toString()}`, { cache: 'no-store' });
  const text = await response.text();
  let payload: any = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(response.ok ? 'Adzuna returned a malformed response.' : `Adzuna search failed with status ${response.status}.`);
  }

  if (!response.ok) throw new Error(payload.error || payload.display || 'Adzuna search failed.');

  return Array.isArray(payload.results) ? payload.results : [];
}

async function fetchAdzunaJobs(query: string, maxResults: number) {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) return null;

  const { what, where } = parseLiveSearchQuery(query);
  const companyQuery = looksLikeCompanyQuery(what, where);
  let results = await requestAdzunaJobs(companyQuery ? `${what} inc` : what, where, maxResults);

  if (companyQuery && !results?.length) {
    results = await requestAdzunaJobs(what, where, maxResults);
  }

  return (results || [])
    .sort((a: any, b: any) => scoreAdzunaResult(b, what, where) - scoreAdzunaResult(a, what, where))
    .slice(0, maxResults)
    .map((job: any, index: number) => adzunaJobToEmploidJob(job, index));
}

async function fetchSearchApiJobs(query: string, maxResults: number) {
  if (!process.env.SEARCHAPI_API_KEY) return null;

  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: normalizeGoogleJobQuery(query),
    gl: 'us',
    hl: 'en',
    api_key: process.env.SEARCHAPI_API_KEY,
  });

  const response = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Search provider failed.');

  const results = payload.jobs || payload.jobs_results || payload.google_jobs_results || [];
  return results.slice(0, maxResults).map((job: any, index: number) => externalJobToEmploidJob(job, index, 'Search'));
}

async function fetchSerpApiJobs(query: string, maxResults: number) {
  if (!process.env.SERPAPI_API_KEY) return null;

  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: normalizeGoogleJobQuery(query),
    gl: 'us',
    hl: 'en',
    api_key: process.env.SERPAPI_API_KEY,
  });

  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Search provider failed.');

  const results = payload.jobs_results || payload.google_jobs_results || [];
  return results.slice(0, maxResults).map((job: any, index: number) => externalJobToEmploidJob(job, index, 'Search'));
}

async function fetchGoogleJobs(query: string) {
  const url = buildGoogleJobsUrl(query);
  const response = await fetch(url, {
    headers: GOOGLE_HEADERS,
    cache: 'no-store',
  });

  const html = await response.text();
  const jobs = response.ok ? parseGoogleJobsHtml(html, url) : [];

  return {
    query: normalizeGoogleJobQuery(query),
    url,
    status: response.status,
    blocked:
      response.status === 429 ||
      /unusual traffic|enable javascript|enablejs|not redirected|captcha/i.test(html),
    jobs,
  };
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get('q') || '';
  const maxResults = Math.min(Math.max(Number(searchParams.get('max') || 30), 1), 60);

  if (!q.trim()) {
    const seeded = getPreparsedJobs('', maxResults);
    return NextResponse.json({
      data: seeded,
      meta: {
        source: 'preparsed',
        total: seeded.length,
        query: 'common job searches',
        attempts: [],
        blocked: false,
      },
    });
  }

  const providerAttempts = [];

  try {
    const adzunaJobs = await fetchAdzunaJobs(q, maxResults);
    if (adzunaJobs) {
      return NextResponse.json({
        data: adzunaJobs,
        meta: {
          source: 'live',
          total: adzunaJobs.length,
          query: normalizeGoogleJobQuery(q),
          attempts: [{ provider: 'adzuna', count: adzunaJobs.length }],
          blocked: false,
        },
      });
    }
  } catch (error: any) {
    providerAttempts.push({ provider: 'adzuna', error: error.message });
  }

  try {
    const searchApiJobs = await fetchSearchApiJobs(q, maxResults);
    if (searchApiJobs) {
      return NextResponse.json({
        data: searchApiJobs,
        meta: {
          source: 'live',
          total: searchApiJobs.length,
          query: normalizeGoogleJobQuery(q),
          attempts: [{ provider: 'searchapi', count: searchApiJobs.length }],
          blocked: false,
        },
      });
    }
  } catch (error: any) {
    providerAttempts.push({ provider: 'searchapi', error: error.message });
  }

  try {
    const serpApiJobs = await fetchSerpApiJobs(q, maxResults);
    if (serpApiJobs) {
      return NextResponse.json({
        data: serpApiJobs,
        meta: {
          source: 'live',
          total: serpApiJobs.length,
          query: normalizeGoogleJobQuery(q),
          attempts: [{ provider: 'serpapi', count: serpApiJobs.length }, ...providerAttempts],
          blocked: false,
        },
      });
    }
  } catch (error: any) {
    providerAttempts.push({ provider: 'serpapi', error: error.message });
  }

  const merged = [];
  const attempts = [];

  const result = await fetchGoogleJobs(q);
  attempts.push({
    query: result.query,
    status: result.status,
    blocked: result.blocked,
    count: result.jobs.length,
    url: result.url,
    provider: 'raw',
  });

  for (const job of result.jobs) {
    merged.push(job);
    if (merged.length >= maxResults) break;
  }

  return NextResponse.json({
    data: merged,
    meta: {
      source: 'live',
      total: merged.length,
      query: normalizeGoogleJobQuery(q),
      attempts: [...providerAttempts, ...attempts],
      blocked: attempts.some((attempt) => attempt.blocked) && merged.length === 0,
    },
  });
}
