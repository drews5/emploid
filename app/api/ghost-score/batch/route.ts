import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { calculateGhostScore } from '@/lib/ghost-score';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const BatchSchema = z.object({
  // If provided, only score these specific jobs. Otherwise score all unscored jobs.
  job_ids: z.array(z.string().uuid()).max(500).optional(),
  // If true, re-score jobs that already have a score
  force: z.boolean().optional().default(false),
});

/**
 * Batch ghost score recalculation — internal/admin only.
 * Call this after a scrape run to score all newly ingested jobs.
 *
 * POST /api/ghost-score/batch
 * Headers: x-api-key: <INTERNAL_API_KEY>
 * Body: { job_ids?: string[], force?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || '';
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey || !safeCompare(apiKey, expectedKey)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { job_ids, force } = parsed.data;
    const supabase = createServiceClient();

    // Build query for jobs to score
    let query = supabase
      .from('jobs')
      .select('*, companies(*), job_recruiters(recruiters(*))')
      .eq('is_active', true);

    if (job_ids && job_ids.length > 0) {
      query = query.in('id', job_ids);
    }

    if (!force) {
      query = query.is('ghost_score', null);
    }

    // Process in pages of 100 to avoid memory issues
    const PAGE_SIZE = 100;
    let offset = 0;
    let scored = 0;
    let errors = 0;
    let total = 0;

    while (true) {
      const { data: jobs, error: fetchErr } = await query
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) {
        console.error('[GHOST_SCORE_BATCH] Fetch error:', fetchErr);
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      if (!jobs || jobs.length === 0) break;
      total += jobs.length;

      // Score each job and prepare batch update
      for (const job of jobs) {
        try {
          const result = calculateGhostScore(job, job.companies, []);

          const { error: updateErr } = await supabase
            .from('jobs')
            .update({
              ghost_score: result.score,
              ghost_factors: result.factors,
              ghost_label: result.label,
            })
            .eq('id', job.id);

          if (updateErr) {
            console.error(`[GHOST_SCORE_BATCH] Update failed for job ${job.id}:`, updateErr);
            errors++;
          } else {
            scored++;
          }
        } catch (err) {
          console.error(`[GHOST_SCORE_BATCH] Score calc failed for job ${job.id}:`, err);
          errors++;
        }
      }

      if (jobs.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return NextResponse.json({
      success: true,
      total_processed: total,
      scored,
      errors,
    });
  } catch (err) {
    console.error('[GHOST_SCORE_BATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
