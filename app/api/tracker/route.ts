import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

const TrackerEntrySchema = z.object({
  external_job_id: z.string().min(1).max(200),
  role: z.string().min(1).max(240),
  company: z.string().min(1).max(240),
  source: z.string().max(120).optional(),
  stage: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).default('saved'),
  trust_score: z.number().int().min(0).max(100).nullable().optional(),
  salary: z.string().max(120).nullable().optional(),
  location: z.string().max(180).nullable().optional(),
  listing_url: z.string().max(2000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const GET = withAuth(async (_req, { user, supabase }) => {
  const { data, error } = await supabase
    .from('application_tracker')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[TRACKER_LIST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
});

export const POST = withAuth(async (req, { user, supabase }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = TrackerEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const entry = parsed.data;
  const now = new Date().toISOString();
  const payload = {
    user_id: user.id,
    external_job_id: entry.external_job_id,
    role: entry.role,
    company: entry.company,
    source: entry.source || null,
    stage: entry.stage,
    trust_score: entry.trust_score ?? null,
    salary: entry.salary || null,
    location: entry.location || null,
    listing_url: entry.listing_url || null,
    notes: entry.notes || null,
    applied_at: entry.stage === 'saved' ? null : now,
    last_activity_at: now,
    updated_at: now,
  };

  const query = supabase
    .from('application_tracker')
    .upsert(payload, {
      onConflict: 'user_id,external_job_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  const { data, error } = await query;

  if (error) {
    console.error('[TRACKER_UPSERT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
});
