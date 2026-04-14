import { NextRequest, NextResponse } from 'next/server';
import { withPublic } from '@/lib/middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid job ID'),
});

export const GET = withPublic(async (req, { supabase, params }) => {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const jobId = parsed.data.id;

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (*),
      job_recruiters (
        recruiters (*)
      )
    `)
    .eq('id', jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Use getUser() instead of getSession() for server-side auth verification
  let savedStatus = null;
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: savedJob } = await supabase
      .from('saved_jobs')
      .select('status, notes, applied_at')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .single();

    if (savedJob) savedStatus = savedJob;
  }

  return NextResponse.json({
    data: job,
    saved_status: savedStatus,
  });
});
