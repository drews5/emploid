import { NextRequest, NextResponse } from 'next/server';
import { withPublic } from '@/lib/middleware';
import {
  analyzeJobSearchQuery,
  sanitizeJobSearchInput,
  scoreSemanticJobMatch,
} from '@/lib/neural-job-search';

export const dynamic = 'force-dynamic';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_LOW_RESULT_THRESHOLD = 12;
const JSEARCH_CACHE_TTL_MS = Math.max(60 * 60 * 1000, Number(process.env.JSEARCH_CACHE_TTL_MS || 12 * 60 * 60 * 1000));
const JSEARCH_RATE_LIMIT_MS = Math.max(15 * 1000, Number(process.env.JSEARCH_RATE_LIMIT_MS || 60 * 1000));
const JSEARCH_SUPPLEMENT_LIMIT = Math.min(Math.max(1, Number(process.env.JSEARCH_SUPPLEMENT_LIMIT || 8)), 20);
const KNOWN_LOCATION_ALIASES = [
  'atlanta',
  'austin',
  'boston',
  'chicago',
  'dallas',
  'denver',
  'los angeles',
  'miami',
  'minneapolis',
  'new york',
  'nyc',
  'phoenix',
  'portland',
  'raleigh',
  'remote us',
  'san diego',
  'san francisco',
  'san jose',
  'seattle',
  'washington dc',
];
const ROLE_HINT_PATTERN = /\b(account|analyst|assistant|backend|business|customer|data|designer|developer|engineer|finance|frontend|fullstack|manager|marketing|nurse|operations|product|program|recruiter|sales|scientist|security|software|specialist|support|ux)\b/i;
const JOB_LIST_SELECT = [
  'id',
  'title',
  'company_id',
  'location',
  'remote_type',
  'salary_min',
  'salary_max',
  'source',
  'source_url',
  'apply_url',
  'job_type',
  'posted_at',
  'first_seen_at',
  'ghost_score',
  'companies(name, logo_url, slug, total_active_listings, avg_ghost_score)',
].join(',');

type JSearchDisplayJob = {
  _display_only: true;
  _display_source: 'jsearch';
  id: string;
  title: string;
  company: string | null;
  companyContext: string;
  location: string | null;
  source: string;
  jobType: string | null;
  workMode: string | null;
  salary: { min: number | null; max: number | null };
  salaryText: string;
  salaryDisclosed: boolean;
  daysPosted: number | null;
  repostCount: number;
  trustScore: number;
  recentHiringActivity: boolean;
  directCompanyLink: boolean;
  hiringContact: boolean;
  sentiment: string;
  description: string | null;
  requirements: string[];
  domain: string;
  url: string;
  saved: boolean;
};

type JSearchCacheEntry = {
  expiresAt: number;
  jobs: JSearchDisplayJob[];
};

const globalForJSearch = globalThis as typeof globalThis & {
  __emploidJSearchCache?: Map<string, JSearchCacheEntry>;
  __emploidJSearchRateLimit?: Map<string, number>;
  __emploidJSearchInflight?: Map<string, Promise<JSearchDisplayJob[]>>;
};

const jsearchCache = globalForJSearch.__emploidJSearchCache ||= new Map();
const jsearchRateLimit = globalForJSearch.__emploidJSearchRateLimit ||= new Map();
const jsearchInflight = globalForJSearch.__emploidJSearchInflight ||= new Map();

function sanitizeSearchInput(value: string | null) {
  return sanitizeJobSearchInput(value);
}

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function ilikePattern(value: string) {
  return `%${escapeIlike(value)}%`;
}

function normalizeSearchText(value: string) {
  return sanitizeSearchInput(value)
    .toLowerCase()
    .replace(/[^\w+#.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLocationAlias(value: string) {
  return normalizeSearchText(value)
    .replace(/\b(mn|minnesota)\b/g, '')
    .replace(/\b(ca|california)\b/g, '')
    .replace(/\b(il|illinois)\b/g, '')
    .replace(/\b(ny|new york)\b/g, (match) => match === 'ny' ? '' : match)
    .replace(/\b(tx|texas)\b/g, '')
    .replace(/\b(wa|washington)\b/g, (match) => match === 'wa' ? '' : match)
    .replace(/\b(co|colorado)\b/g, '')
    .replace(/\b(ma|massachusetts)\b/g, '')
    .replace(/\bga|georgia\b/g, '')
    .replace(/\bremote,\s*us\b/g, 'remote us')
    .replace(/\s+/g, ' ')
    .trim();
}

function isKnownLocation(value: string) {
  const normalized = normalizeLocationAlias(value);
  if (!normalized) return false;
  if (normalized.includes(',')) return true;
  return KNOWN_LOCATION_ALIASES.includes(normalized);
}

function splitKnownLocationSuffix(value: string) {
  const normalized = normalizeSearchText(value);
  for (const alias of [...KNOWN_LOCATION_ALIASES].sort((a, b) => b.length - a.length)) {
    if (normalized === alias) return { keyword: '', location: value };
    if (normalized.endsWith(` ${alias}`)) {
      const locationStart = normalized.length - alias.length;
      return {
        keyword: value.slice(0, locationStart).trim(),
        location: value.slice(locationStart).trim(),
      };
    }
  }
  return null;
}

function parseJobSearchInputs(searchParams: URLSearchParams) {
  const rawQ = sanitizeSearchInput(searchParams.get('q'));
  const explicitLocation = sanitizeSearchInput(searchParams.get('location'));
  let keyword = rawQ;
  let location = explicitLocation;

  if (!location && rawQ) {
    const locationPhrase = rawQ.match(/^(.*?)\b(?:in|near|around)\s+([a-zA-Z0-9\s,.-]{2,80})$/i);
    if (locationPhrase) {
      keyword = sanitizeSearchInput(locationPhrase[1]);
      location = sanitizeSearchInput(locationPhrase[2]);
    }
  }

  if (!location && rawQ) {
    const suffixMatch = splitKnownLocationSuffix(rawQ);
    if (suffixMatch && (suffixMatch.keyword || !ROLE_HINT_PATTERN.test(rawQ))) {
      keyword = sanitizeSearchInput(suffixMatch.keyword);
      location = sanitizeSearchInput(suffixMatch.location);
    }
  }

  if (!location && rawQ && isKnownLocation(rawQ) && !ROLE_HINT_PATTERN.test(rawQ)) {
    keyword = '';
    location = rawQ;
  }

  return { rawQ, keyword, location };
}

function keywordFilterTerms(keyword: string) {
  const intent = analyzeJobSearchQuery(keyword);
  const terms = [
    keyword,
    ...intent.importantTerms,
    ...intent.expandedTerms,
  ]
    .map((term) => normalizeSearchText(term).replace(/,/g, ' '))
    .filter((term) => term.length >= 2)
    .slice(0, 18);
  return Array.from(new Set(terms));
}

function buildKeywordFallbackFilter(keyword: string) {
  const clauses = new Set<string>();
  for (const term of keywordFilterTerms(keyword)) {
    const pattern = ilikePattern(term);
    clauses.add(`title.ilike.${pattern}`);
    clauses.add(`description.ilike.${pattern}`);
  }
  return Array.from(clauses).join(',');
}

function applyKeywordSearch(query: any, keyword: string) {
  if (!keyword) return query;

  const fallbackFilter = buildKeywordFallbackFilter(keyword);
  return fallbackFilter ? query.or(fallbackFilter) : query;
}

function stripHtml(value: string) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferRemoteType(job: any) {
  const text = `${job.job_title || ''} ${job.job_location || ''} ${job.job_description || ''}`.toLowerCase();
  if (job.job_is_remote || job.work_arrangement === 'remote' || text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

function mapJobType(value: string) {
  const text = String(value || '').toLowerCase();
  if (text.includes('part')) return 'part-time';
  if (text.includes('contract') || text.includes('temporary')) return 'contract';
  if (text.includes('intern')) return 'internship';
  return 'full-time';
}

function simpleTrustScore(job: any) {
  const postedAt = job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : null;
  const daysPosted = postedAt && !Number.isNaN(postedAt.getTime())
    ? Math.max(0, Math.round((Date.now() - postedAt.getTime()) / 86400000))
    : 14;
  const hasSalary = Boolean(job.job_min_salary || job.job_max_salary);
  const hasDirectApply = Boolean(job.job_apply_link);
  const hasDetailedDescription = stripHtml(job.job_description || '').split(/\s+/).length >= 180;

  let score = 58;
  if (daysPosted <= 7) score += 14;
  else if (daysPosted > 45) score -= 18;
  if (hasSalary) score += 10;
  if (hasDirectApply) score += 8;
  if (hasDetailedDescription) score += 8;
  if (/staffing|recruiter|talent/i.test(job.job_publisher || '')) score -= 6;
  return Math.max(25, Math.min(95, score));
}

function applyJobFilters(query: any, searchParams: URLSearchParams) {
  const { rawQ, keyword, location } = parseJobSearchInputs(searchParams);
  const source = searchParams.get('source');
  const ghost_score_min = searchParams.get('ghost_score_min');
  const salary_min = searchParams.get('salary_min');
  const remote_type = searchParams.get('remote_type');
  const job_type = searchParams.get('job_type');
  const experience_level = searchParams.get('experience_level');

  query = query.eq('is_active', true);

  if (ghost_score_min) {
    const min = parseInt(ghost_score_min);
    if (!isNaN(min)) query = query.gte('ghost_score', min);
  }

  if (salary_min) {
    const min = parseInt(salary_min);
    if (!isNaN(min)) query = query.gte('salary_max', min);
  }

  if (source) query = query.in('source', source.split(',').filter(Boolean));
  if (remote_type) query = query.in('remote_type', remote_type.split(',').filter(Boolean));
  if (job_type) query = query.in('job_type', job_type.split(',').filter(Boolean));
  if (experience_level) query = query.in('experience_level', experience_level.split(',').filter(Boolean));
  if (location) query = query.ilike('location', ilikePattern(location));

  return { query, rawQ, keyword, location };
}

function buildJobsQuery(supabase: any, searchParams: URLSearchParams) {
  const sort = searchParams.get('sort') || 'relevance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const per_page = Math.min(Math.max(1, parseInt(searchParams.get('per_page') || '20')), 50);

  let query = supabase
    .from('jobs')
    .select(JOB_LIST_SELECT, { count: 'planned' });

  const filtered = applyJobFilters(query, searchParams);
  query = filtered.query;
  const { rawQ, keyword, location } = filtered;
  const intent = analyzeJobSearchQuery(keyword || rawQ);

  if (rawQ && !searchParams.get('remote_type') && intent.remoteTypes.length) {
    query = query.in('remote_type', intent.remoteTypes);
  }

  if (rawQ && !searchParams.get('job_type') && intent.jobTypes.length) {
    query = query.in('job_type', intent.jobTypes);
  }

  query = applyKeywordSearch(query, keyword);

  // Sorting
  switch (sort) {
    case 'ghost_score':
      query = query.order('ghost_score', { ascending: false });
      query = query.order('created_at', { ascending: false });
      break;
    case 'trust':
      query = query.order('ghost_score', { ascending: false });
      query = query.order('created_at', { ascending: false });
      break;
    case 'salary':
      query = query.order('salary_max', { ascending: false, nullsFirst: false });
      query = query.order('created_at', { ascending: false });
      break;
    case 'date_posted':
      query = query.order('posted_at', { ascending: false, nullsFirst: false });
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('ghost_score', { ascending: false, nullsFirst: false });
      query = query.order('created_at', { ascending: false });
  }

  query = query.order('id', { ascending: true });

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  return { query, page, per_page, rawQ, keyword, location };
}

async function runJobsQuery(supabase: any, searchParams: URLSearchParams) {
  const { query, page, per_page } = buildJobsQuery(supabase, searchParams);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0, page, per_page };
}

async function runSuggestionQuery(supabase: any, searchParams: URLSearchParams) {
  const { rawQ, keyword, location } = parseJobSearchInputs(searchParams);
  if (rawQ.length < 2 && !location) return [];

  const intent = analyzeJobSearchQuery(keyword || rawQ);
  const keywordFallbackFilter = buildKeywordFallbackFilter(keyword);
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '8')), 12);
  let suggestionQuery = supabase
    .from('jobs')
    .select('id,title,location,ghost_score,posted_at,companies(name, logo_url, slug)')
    .eq('is_active', true);

  if (location) suggestionQuery = suggestionQuery.ilike('location', ilikePattern(location));
  if (keywordFallbackFilter) suggestionQuery = suggestionQuery.or(keywordFallbackFilter);
  suggestionQuery = suggestionQuery
    .order('ghost_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(Math.max(limit * 3, 24));

  const result = await suggestionQuery;
  let rows = result.data || [];

  if (result.error) throw result.error;
  if (rows.length < limit && keywordFallbackFilter) {
    let fallbackQuery = supabase
      .from('jobs')
      .select('id,title,location,ghost_score,posted_at,companies(name, logo_url, slug)')
      .eq('is_active', true);
    if (location) fallbackQuery = fallbackQuery.ilike('location', ilikePattern(location));
    const fallback = await fallbackQuery
      .order('ghost_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .limit(Math.max(limit * 4, 32));
    if (fallback.error) throw fallback.error;
    rows = [...rows, ...(fallback.data || [])];
  }

  const seen = new Set<string>();
  return rows
    .map((job: any) => ({ ...job, _search_rank: scoreSemanticJobMatch(job, intent) }))
    .sort((a: any, b: any) => b._search_rank - a._search_rank)
    .filter((job: any) => {
      const key = `${String(job.title || '').toLowerCase()}|${String(job.companies?.name || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((job: any) => ({
      type: 'job',
      title: job.title,
      company: job.companies?.name || 'Company',
      location: job.location || 'Location not listed',
      trustScore: Math.round(Number(job.ghost_score || 0)),
      value: [job.title, job.companies?.name].filter(Boolean).join(' '),
    }));
}

function getClientKey(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

function jsearchCacheKey(query: string, location: string) {
  return `${normalizeSearchText(query)}|${normalizeSearchText(location)}`;
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

async function canUseJSearch(db: any) {
  const limit = Math.max(0, Number(process.env.JSEARCH_DAILY_LIMIT || 6));
  if (!process.env.RAPIDAPI_KEY || limit <= 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await db
    .from('jsearch_usage')
    .select('usage_date, request_count')
    .eq('usage_date', today)
    .maybeSingle();
  const currentCount = Number(usage?.request_count || 0);
  if (currentCount >= limit) return false;

  await db
    .from('jsearch_usage')
    .upsert({
      usage_date: today,
      request_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'usage_date' });

  return true;
}

async function fetchJSearch(query: string, location: string) {
  const combinedQuery = [query, location].filter(Boolean).join(' ');
  const response = await fetch(`https://${JSEARCH_HOST}/search?${new URLSearchParams({
    query: combinedQuery,
    page: '1',
    num_pages: '1',
    country: 'us',
    date_posted: 'week',
  })}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': JSEARCH_HOST,
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || 'JSearch request failed');
  return Array.isArray(payload.data) ? payload.data : [];
}

function jobDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function postedDays(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
}

function salaryText(min: number | null, max: number | null, period: string | null) {
  if (!min && !max) return '';
  const suffix = period ? ` ${period}` : ' a year';
  if (min && max && min !== max) return `$${min.toLocaleString()}-$${max.toLocaleString()}${suffix}`;
  return `$${(min || max || 0).toLocaleString()}${suffix}`;
}

function normalizeJSearchDisplayJob(job: any): JSearchDisplayJob | null {
  const title = String(job.job_title || '').trim();
  const applyUrl = String(job.job_apply_link || job.job_google_link || '').trim();
  if (!title || !applyUrl) return null;

  const sourceId = String(job.job_id || `${title}|${job.employer_name || ''}|${applyUrl}`);
  const minSalary = Number(job.job_min_salary) || null;
  const maxSalary = Number(job.job_max_salary) || null;
  const daysPosted = postedDays(job.job_posted_at_datetime_utc);
  const remoteType = inferRemoteType(job);
  const domain = jobDomain(applyUrl);
  const publisher = String(job.job_publisher || 'JSearch').trim();

  return {
    _display_only: true,
    _display_source: 'jsearch',
    id: `jsearch-${hashText(sourceId)}`,
    title,
    company: job.employer_name ? String(job.employer_name).trim() : null,
    companyContext: `${publisher} supplement`,
    location: job.job_location || [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ') || null,
    source: publisher,
    jobType: job.job_employment_type ? mapJobType(job.job_employment_type) : null,
    workMode: remoteType === 'remote' ? 'Remote' : remoteType === 'hybrid' ? 'Hybrid' : 'On-site',
    salary: { min: minSalary, max: maxSalary },
    salaryText: salaryText(minSalary, maxSalary, job.job_salary_period ? String(job.job_salary_period) : null),
    salaryDisclosed: Boolean(minSalary || maxSalary),
    daysPosted,
    repostCount: 0,
    trustScore: simpleTrustScore(job),
    recentHiringActivity: daysPosted !== null ? daysPosted <= 14 : false,
    directCompanyLink: Boolean(domain && !/(linkedin|indeed|glassdoor|ziprecruiter|google|adzuna)/i.test(domain)),
    hiringContact: false,
    sentiment: daysPosted !== null && daysPosted <= 14 ? 'growing' : 'stable',
    description: job.job_description ? String(job.job_description) : null,
    requirements: [],
    domain,
    url: applyUrl,
    saved: false,
  };
}

async function getJSearchSupplement(db: any, req: NextRequest, query: string, location: string) {
  const key = jsearchCacheKey(query, location);
  const now = Date.now();
  const cached = jsearchCache.get(key);
  if (cached && cached.expiresAt > now) {
    return { jobs: cached.jobs, meta: { attempted: false, cached: true, rate_limited: false, count: cached.jobs.length } };
  }

  const clientKey = `${getClientKey(req)}|${key}`;
  const lastAttempt = jsearchRateLimit.get(clientKey) || 0;
  if (now - lastAttempt < JSEARCH_RATE_LIMIT_MS) {
    return { jobs: [], meta: { attempted: false, cached: false, rate_limited: true, count: 0 } };
  }
  jsearchRateLimit.set(clientKey, now);

  const allowed = await canUseJSearch(db);
  if (!allowed) {
    return { jobs: [], meta: { attempted: false, cached: false, rate_limited: true, count: 0 } };
  }

  let inflight = jsearchInflight.get(key);
  if (!inflight) {
    inflight = fetchJSearch(query, location)
      .then((rows) => rows
        .map(normalizeJSearchDisplayJob)
        .filter((job: JSearchDisplayJob | null): job is JSearchDisplayJob => Boolean(job))
        .slice(0, JSEARCH_SUPPLEMENT_LIMIT))
      .finally(() => {
        jsearchInflight.delete(key);
      });
    jsearchInflight.set(key, inflight);
  }

  const jobs = await inflight;
  jsearchCache.set(key, { jobs, expiresAt: now + JSEARCH_CACHE_TTL_MS });
  return { jobs, meta: { attempted: true, cached: false, rate_limited: false, count: jobs.length } };
}

async function buildSupplementedResult(db: any, req: NextRequest, searchParams: URLSearchParams, result: any, inputs: { rawQ: string; keyword: string; location: string }) {
  if (!inputs.rawQ || result.count >= JSEARCH_LOW_RESULT_THRESHOLD) {
    return { result, jsearchMeta: { attempted: false, cached: false, rate_limited: false, count: 0 } };
  }

  const page = result.page;
  const perPage = result.per_page;
  const allParams = new URLSearchParams(searchParams);
  allParams.set('page', '1');
  allParams.set('per_page', String(JSEARCH_LOW_RESULT_THRESHOLD));
  const allDbResult = await runJobsQuery(db, allParams);
  const supplement = await getJSearchSupplement(db, req, inputs.keyword || inputs.rawQ, inputs.location);
  const merged = [...allDbResult.data, ...supplement.jobs];
  const from = (page - 1) * perPage;
  const data = merged.slice(from, from + perPage);

  return {
    result: {
      data,
      count: merged.length,
      page,
      per_page: perPage,
    },
    jsearchMeta: supplement.meta,
  };
}

export const GET = withPublic(async (req, { supabase }) => {
  const searchParams = req.nextUrl.searchParams;
  const searchInputs = parseJobSearchInputs(searchParams);

  if (searchParams.get('suggest') === '1') {
    try {
      const suggestions = await runSuggestionQuery(supabase, searchParams);
      return NextResponse.json({ data: suggestions });
    } catch (error: any) {
      console.error('[JOBS_SUGGEST]', error);
      return NextResponse.json({ error: error.message || 'Job suggestions failed' }, { status: 500 });
    }
  }

  let result;
  try {
    result = await runJobsQuery(supabase, searchParams);
  } catch (error: any) {
    console.warn('[JOBS_LIST_TEXT_SEARCH_FALLBACK]', error);
    try {
      result = await runJobsQuery(supabase, searchParams);
    } catch (fallbackError: any) {
      console.error('[JOBS_LIST]', fallbackError);
      return NextResponse.json({ error: fallbackError.message || 'Job search failed' }, { status: 500 });
    }
  }

  let jsearchMeta = { attempted: false, cached: false, rate_limited: false, count: 0 };
  try {
    const supplemented = await buildSupplementedResult(supabase, req, searchParams, result, searchInputs);
    result = supplemented.result;
    jsearchMeta = supplemented.jsearchMeta;
  } catch (error: any) {
    console.error('[JSEARCH_SUPPLEMENT]', error);
  }

  return NextResponse.json({
    data: result.data,
    meta: {
      total: result.count,
      page: result.page,
      per_page: result.per_page,
      total_pages: result.count ? Math.ceil(result.count / result.per_page) : 0,
      jsearch: jsearchMeta,
    },
  });
});
