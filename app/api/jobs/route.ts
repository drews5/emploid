import { NextRequest, NextResponse } from 'next/server';
import { withPublic } from '@/lib/middleware';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_LOW_RESULT_THRESHOLD = 12;

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

function buildJobsQuery(supabase: any, searchParams: URLSearchParams) {
  const q = searchParams.get('q');
  const source = searchParams.get('source');
  const ghost_score_min = searchParams.get('ghost_score_min');
  const salary_min = searchParams.get('salary_min');
  const remote_type = searchParams.get('remote_type');
  const job_type = searchParams.get('job_type');
  const experience_level = searchParams.get('experience_level');
  const sort = searchParams.get('sort') || 'relevance';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const per_page = Math.min(Math.max(1, parseInt(searchParams.get('per_page') || '20')), 50);

  let query = supabase
    .from('jobs')
    .select(
      '*, companies(name, logo_url, slug, total_active_listings, avg_ghost_score)',
      { count: 'exact' }
    );

  // Base filter: only active jobs
  query = query.eq('is_active', true);

  // Optional filters
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

  // Full-text search using the generated search_vector column
  if (q && q.trim() !== '') {
    query = query.textSearch('search_vector', q.trim(), { config: 'english', type: 'plain' });
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

async function runJobsQuery(supabase: any, searchParams: URLSearchParams) {
  const { query, page, per_page } = buildJobsQuery(supabase, searchParams);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count ?? 0, page, per_page };
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
  const q = searchParams.get('q');

  let result;
  try {
    result = await runJobsQuery(supabase, searchParams);
  } catch (error: any) {
    console.error('[JOBS_LIST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let jsearchMeta = { attempted: false, inserted: 0 };
  if (
    q?.trim() &&
    result.page === 1 &&
    result.data.length < Math.min(result.per_page, JSEARCH_LOW_RESULT_THRESHOLD)
  ) {
    try {
      jsearchMeta = await upsertJSearchJobs(q.trim());
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
