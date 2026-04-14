import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { UpdateSavedJobSchema } from '@/lib/validations';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid job ID'),
});

export const PATCH = withAuth(async (req, { user, supabase, params }) => {
  const paramsParsed = ParamsSchema.safeParse(params);
  if (!paramsParsed.success) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = UpdateSavedJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updateData[key] = value;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_jobs')
    .update(updateData)
    .eq('job_id', paramsParsed.data.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[SAVED_JOB_UPDATE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Saved job not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
});

export const DELETE = withAuth(async (req, { user, supabase, params }) => {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const { error, count } = await supabase
    .from('saved_jobs')
    .delete({ count: 'exact' })
    .eq('job_id', parsed.data.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[SAVED_JOB_DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (count === 0) {
    return NextResponse.json({ error: 'Saved job not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
