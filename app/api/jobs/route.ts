import { NextRequest, NextResponse } from 'next/server';
import { withPublic } from '@/lib/middleware';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_LOW_RESULT_THRESHOLD = 12;
const JOB_LIST_SELECT = [
  'id',
  'title',
  'company_id',
  'location',
  'remote_type',
  'salary_min',
  'salary_max',
  'source',
  'source_provider',
  'external_source',
  'source_url',
  'apply_url',
  'job_type',
  'posted_at',
  'first_seen_at',
  'trust_flags',
  'ghost_score',
  'company_trust_score',
  'canonical_company_key',
  'companies(name, logo_url, slug, total_active_listings, avg_ghost_score)',
].join(',');

function sanitizeSearchInput(value: string | null) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9\s@.+#/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function splitSearchTerms(value: string) {
  return sanitizeSearchInput(value)
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

function ilikePattern(value: string) {
  return `%${escapeIlike(value)}%`;
}

function slugify(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'unknown';
}

function stripHtml(value: string) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashDescription(value: string) {
  const text = stripHtml(value).toLowerCase();
  if (!text) return null;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function inferRemoteType(job: any) {
  const text = `${job.job_title || ''} ${job.job_location || ''} ${job.job_description || ''}`.toLowerCase();
  if (job.job_is_remote || job.work_arrangement === 'remote' || text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

function mapSource(publisher: string) {
  const text = String(publisher || '').toLowerCase();
  if (text.includes('linkedin')) return 'linkedin';
  if (text.includes('indeed')) return 'indeed';
  if (text.includes('glassdoor')) return 'glassdoor';
  if (text.includes('ziprecruiter')) return 'ziprecruiter';
  return 'company_direct';
}

function mapJobType(value: string) {
  const text = String(value || '').toLowerCase();
  if (text.includes('part')) return 'part-time';
  if (text.includes('contract') || text.includes('temporary')) return 'contract';
  if (text.includes('intern')) return 'internship';
  return 'full-time';
}

function ghostLabel(score: number) {
  if (score >= 80) return 'Verified';
  if (score >= 50) return 'Uncertain';
  return 'Likely Ghost';
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
  const q = sanitizeSearchInput(searchParams.get('q'));
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

  return { query, q };
}

function buildTextSearchFilter(q: string) {
  const terms = splitSearchTerms(q);
  const slugValues = [slugify(q), ...terms.map(slugify)].filter((value) => value && value !== 'unknown');
  const values = [q, ...terms].filter(Boolean);
  const clauses = new Set<string>();

  for (const value of values) {
    const pattern = ilikePattern(value);
    clauses.add(`title.ilike.${pattern}`);
    clauses.add(`location.ilike.${pattern}`);
  }

  for (const value of slugValues) {
    clauses.add(`canonical_company_key.ilike.${ilikePattern(value)}`);
  }

  return Array.from(clauses).join(',');
}

function scoreJobSearchMatch(job: any, q: string) {
  const normalizedQuery = q.toLowerCase();
  const terms = splitSearchTerms(q);
  const company = String(job.companies?.name || job.company_name || '').toLowerCase();
  const title = String(job.title || '').toLowerCase();
  const location = String(job.location || '').toLowerCase();
  const description = stripHtml(job.description || '').toLowerCase();
  let score = 0;

  if (title === normalizedQuery) score += 120;
  if (title.startsWith(normalizedQuery)) score += 80;
  if (title.includes(normalizedQuery)) score += 60;
  if (company === normalizedQuery) score += 95;
  if (company.includes(normalizedQuery)) score += 65;
  if (location.includes(normalizedQuery)) score += 25;

  for (const term of terms) {
    if (title.includes(term)) score += 18;
    if (company.includes(term)) score += 14;
    if (location.includes(term)) score += 7;
    if (description.includes(term)) score += 3;
  }

  score += Math.min(25, Math.max(0, Number(job.ghost_score || 0)) / 4);
  const postedAt = job.posted_at ? new Date(job.posted_at) : null;
  if (postedAt && !Number.isNaN(postedAt.getTime())) {
    const daysOld = Math.max(0, Math.round((Date.now() - postedAt.getTime()) / 86400000));
    score += Math.max(0, 14 - Math.min(14, daysOld / 3));
  }

  return score;
}

function buildJobsQuery(supabase: any, searchParams: URLSearchParams, options: { textSearch?: boolean } = {}) {
  const sort = searchParams.get('sort') || 'relevance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const per_page = Math.min(Math.max(1, parseInt(searchParams.get('per_page') || '20')), 50);

  let query = supabase
    .from('jobs')
    .select(JOB_LIST_SELECT, { count: 'planned' });

  const filtered = applyJobFilters(query, searchParams);
  query = filtered.query;
  const q = filtered.q;

  if (q) {
    const broadFilter = buildTextSearchFilter(q);
    if (options.textSearch === false || !broadFilter) {
      if (broadFilter) query = query.or(broadFilter);
    } else {
      query = query.textSearch('search_vector', q, { config: 'english', type: 'plain' });
    }
  }

  // Sorting
  switch (sort) {
    case 'ghost_score':
      query = query.order('ghost_score', { ascending: false });
      break;
    case 'trust':
      query = query.order('ghost_score', { ascending: false });
      break;
    case 'salary':
      query = query.order('salary_max', { ascending: false, nullsFirst: false });
      break;
    case 'date_posted':
      query = query.order('posted_at', { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  return { query, page, per_page };
}

async function runJobsQuery(supabase: any, searchParams: URLSearchParams, options: { textSearch?: boolean } = {}) {
  const { query, page, per_page } = buildJobsQuery(supabase, searchParams, options);
  const { data, error, count } = await query;
  if (error) throw error;
  const q = sanitizeSearchInput(searchParams.get('q'));
  let rows = data || [];

  if (q && searchParams.get('sort') !== 'salary' && searchParams.get('sort') !== 'date_posted') {
    rows = rows
      .map((job: any) => ({ ...job, _search_rank: scoreJobSearchMatch(job, q) }))
      .sort((a: any, b: any) => b._search_rank - a._search_rank);
    rows = rows.slice(0, per_page);
    rows = rows.map(({ _search_rank, ...job }: any) => job);
  }
  return { data: rows, count: count ?? 0, page, per_page };
}

async function runSuggestionQuery(supabase: any, searchParams: URLSearchParams) {
  const q = sanitizeSearchInput(searchParams.get('q'));
  if (q.length < 2) return [];

  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '8')), 12);
  const suggestionQuery = await supabase
    .from('jobs')
    .select('id,title,location,ghost_score,posted_at,companies(name, logo_url, slug)')
    .eq('is_active', true)
    .or(buildTextSearchFilter(q))
    .order('ghost_score', { ascending: false, nullsFirst: false })
    .limit(Math.max(limit, 12));

  if (suggestionQuery.error) throw suggestionQuery.error;
  const rows = suggestionQuery.data || [];

  const seen = new Set<string>();
  return rows
    .map((job: any) => ({ ...job, _search_rank: scoreJobSearchMatch(job, q) }))
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

async function canUseJSearch(service: any) {
  const limit = Math.max(0, Number(process.env.JSEARCH_DAILY_LIMIT || 6));
  if (!process.env.RAPIDAPI_KEY || limit <= 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await service
    .from('jsearch_usage')
    .select('usage_date, request_count')
    .eq('usage_date', today)
    .maybeSingle();
  const currentCount = Number(usage?.request_count || 0);
  if (currentCount >= limit) return false;

  await service
    .from('jsearch_usage')
    .upsert({
      usage_date: today,
      request_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'usage_date' });

  return true;
}

async function fetchJSearch(query: string) {
  const response = await fetch(`https://${JSEARCH_HOST}/search?${new URLSearchParams({
    query,
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

async function upsertJSearchJobs(query: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
    return { attempted: false, inserted: 0 };
  }

  const service = createServiceClient();
  const allowed = await canUseJSearch(service);
  if (!allowed) return { attempted: false, inserted: 0 };

  const jobs = await fetchJSearch(query);
  let inserted = 0;

  for (const job of jobs) {
    const companyName = String(job.employer_name || 'Unknown Company').trim();
    const companySlug = slugify(companyName);
    const description = String(job.job_description || '');
    const score = simpleTrustScore(job);

    const companyResponse = await service
      .from('companies')
      .upsert({
        name: companyName,
        slug: companySlug,
        canonical_key: companySlug,
        last_crawled_at: new Date().toISOString(),
      }, { onConflict: 'slug' })
      .select('id, trust_score')
      .single();

    if (companyResponse.error || !companyResponse.data) {
      console.error('[JSEARCH_UPSERT_COMPANY]', companyResponse.error);
      continue;
    }

    const sourceJobId = String(job.job_id || `${companySlug}:${job.job_title || ''}`);
    const applyUrl = job.job_apply_link || job.job_google_link;
    if (!applyUrl || !job.job_title) continue;

    const existing = await service
      .from('jobs')
      .select('id')
      .eq('source_provider', 'jsearch')
      .eq('source_job_id', sourceJobId)
      .maybeSingle();

    const row = {
      company_id: companyResponse.data.id,
      title: job.job_title,
      location: job.job_location || [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
      remote_type: inferRemoteType(job),
      salary_min: Number(job.job_min_salary) || null,
      salary_max: Number(job.job_max_salary) || null,
      salary_is_estimate: false,
      description,
      source: mapSource(job.job_publisher || ''),
      source_provider: 'jsearch',
      source_job_id: sourceJobId,
      external_source: job.job_publisher || 'JSearch',
      source_url: job.job_google_link || applyUrl,
      apply_url: applyUrl,
      job_type: mapJobType(job.job_employment_type),
      ghost_score: score,
      ghost_label: ghostLabel(score),
      ghost_factors: {
        flags: ['jsearch_client_fallback'],
        company_trust_score: companyResponse.data.trust_score || 0.5,
      },
      trust_flags: ['jsearch_client_fallback'],
      company_trust_score: companyResponse.data.trust_score || 0.5,
      canonical_company_key: companySlug,
      posted_at: job.job_posted_at_datetime_utc || null,
      last_seen_at: new Date().toISOString(),
      is_active: true,
      description_hash: hashDescription(description),
      raw: job,
    };

    if (existing.data?.id) {
      await service.from('jobs').update(row).eq('id', existing.data.id);
    } else {
      await service.from('jobs').insert({ ...row, first_seen_at: new Date().toISOString() });
      inserted += 1;
    }
  }

  return { attempted: true, inserted };
}

export const GET = withPublic(async (req, { supabase }) => {
  const searchParams = req.nextUrl.searchParams;
  const q = sanitizeSearchInput(searchParams.get('q'));

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
      result = await runJobsQuery(supabase, searchParams, { textSearch: false });
    } catch (fallbackError: any) {
      console.error('[JOBS_LIST]', fallbackError);
      return NextResponse.json({ error: fallbackError.message || 'Job search failed' }, { status: 500 });
    }
  }

  let jsearchMeta = { attempted: false, inserted: 0 };
  if (
    searchParams.get('live_jsearch') === '1' &&
    q &&
    result.page === 1 &&
    result.data.length < Math.min(result.per_page, JSEARCH_LOW_RESULT_THRESHOLD)
  ) {
    try {
      jsearchMeta = await upsertJSearchJobs(q);
      if (jsearchMeta.attempted && jsearchMeta.inserted > 0) {
        result = await runJobsQuery(supabase, searchParams);
      }
    } catch (error: any) {
      console.error('[JSEARCH_CLIENT_FALLBACK]', error);
    }
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
