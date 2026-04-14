import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { SaveJobSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, { user, supabase }) => {
  const status = req.nextUrl.searchParams.get('status');
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const per_page = Math.min(Math.max(1, parseInt(req.nextUrl.searchParams.get('per_page') || '20')), 50);

  let query = supabase
    .from('saved_jobs')
    .select('*, jobs(*, companies(*))', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  // Pagination
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[SAVED_JOBS_LIST]', error);
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

export const POST = withAuth(async (req, { user, supabase }) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = SaveJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verify the job actually exists before saving
  const { data: job } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', parsed.data.job_id)
    .single();

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .insert({
      user_id: user.id,
      job_id: parsed.data.job_id,
      status: 'saved',
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Job already saved' }, { status: 409 });
    }
    console.error('[SAVED_JOBS_INSERT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
});
