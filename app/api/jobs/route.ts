import { NextRequest, NextResponse } from 'next/server';
import { withPublic } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export const GET = withPublic(async (req, { supabase }) => {
  const searchParams = req.nextUrl.searchParams;

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
    query = query.textSearch('search_vector', q.trim(), { config: 'english' });
  }

  // Sorting
  switch (sort) {
    case 'ghost_score':
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

  const { data, error, count } = await query;

  if (error) {
    console.error('[JOBS_LIST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: {
      total: count ?? 0,
      page,
      per_page,
      total_pages: count ? Math.ceil(count / per_page) : 0,
    },
  });
});
