import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { calculateGhostScore } from '@/lib/ghost-score';
import { JobIdSchema } from '@/lib/validations';
import { timingSafeEqual } from 'crypto';

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to keep timing more consistent,
    // even though length mismatch reveals inequality
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Ghost score calculation — internal/admin only.
 * Protected by API key since this writes to the database without user context.
 */
export async function POST(req: NextRequest) {
  try {
    // Validate API key for internal access
    const apiKey = req.headers.get('x-api-key') || '';
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey || !safeCompare(apiKey, expectedKey)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = JobIdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Use service client — this is an admin operation
    const supabase = createServiceClient();

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('*, companies(*), job_recruiters(recruiters(*))')
      .eq('id', parsed.data.job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const scoreResult = calculateGhostScore(job, job.companies, []);

    const { error: updateErr } = await supabase
      .from('jobs')
      .update({
        ghost_score: scoreResult.score,
        ghost_factors: scoreResult.factors,
        ghost_label: scoreResult.label,
      })
      .eq('id', parsed.data.job_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score: scoreResult.score,
      label: scoreResult.label,
    });
  } catch (err) {
    console.error('[GHOST_SCORE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
