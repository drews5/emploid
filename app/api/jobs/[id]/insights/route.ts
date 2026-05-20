import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withPublic } from '@/lib/middleware';
import { assistant, ASSISTANT_MODEL, parseAssistantJson } from '@/lib/assistant';

export const dynamic = 'force-dynamic';

const JobInsightInput = z.object({
  job: z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    source: z.string().optional(),
    workMode: z.string().optional(),
    jobType: z.string().optional(),
    trustScore: z.number().optional(),
    daysPosted: z.number().optional(),
    repostCount: z.number().optional(),
    sentiment: z.string().optional(),
    description: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    salaryDisclosed: z.boolean().optional(),
    directCompanyLink: z.boolean().optional(),
    recentHiringActivity: z.boolean().optional(),
    hiringContact: z.boolean().optional(),
    companyContext: z.string().optional(),
  }),
});

type JobInsights = {
  verdict: string;
  greenFlags: string[];
  redFlags: string[];
  keyRequirements: string[];
  interviewAngle: string;
  applyAdvice: string;
};

const insightsSchema = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    greenFlags: { type: 'array', items: { type: 'string' } },
    redFlags: { type: 'array', items: { type: 'string' } },
    keyRequirements: { type: 'array', items: { type: 'string' } },
    interviewAngle: { type: 'string' },
    applyAdvice: { type: 'string' },
  },
  required: ['verdict', 'greenFlags', 'redFlags', 'keyRequirements', 'interviewAngle', 'applyAdvice'],
  additionalProperties: false,
} as const;

const emptyInsights: JobInsights = {
  verdict: 'This listing has enough signal to review, but the evidence is mixed.',
  greenFlags: [],
  redFlags: [],
  keyRequirements: [],
  interviewAngle: 'Prepare one concise story that connects your background to the role requirements.',
  applyAdvice: 'Apply through the employer link when available and follow up only if there is a clear hiring contact.',
};

async function buildInsights(job: unknown) {
  if (!process.env.ASSISTANT_API_KEY) {
    return NextResponse.json({ error: 'Assistant is not configured.' }, { status: 503 });
  }

  try {
    const completion = await assistant.chat.completions.create({
      model: ASSISTANT_MODEL,
      temperature: 0.2,
      max_completion_tokens: 900,
      messages: [
        {
          role: 'system',
          content: [
            'You write concise job-trust insights for Emploid.',
            'Use only the supplied job and company signals. Do not invent facts about the company or listing.',
            'Green flags and red flags should be short evidence-based phrases. Keep advice practical and plain-English.',
            `Return only valid JSON matching this schema: ${JSON.stringify(insightsSchema)}.`,
          ].join(' '),
        },
        {
          role: 'user',
          content: `Job record:\n${JSON.stringify(job, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const insights = parseAssistantJson<JobInsights>(completion.choices[0]?.message?.content, emptyInsights);
    return NextResponse.json({
      verdict: insights.verdict,
      greenFlags: insights.greenFlags.slice(0, 4),
      redFlags: insights.redFlags.slice(0, 4),
      keyRequirements: insights.keyRequirements.slice(0, 5),
      interviewAngle: insights.interviewAngle,
      applyAdvice: insights.applyAdvice,
    });
  } catch (error) {
    console.error('[JOB_INSIGHTS_ERROR]', error);
    return NextResponse.json({ error: 'Could not generate job insights.' }, { status: 502 });
  }
}

export const GET = withPublic(async (_req, { supabase, params }) => {
  const id = params?.id;
  const uuid = z.string().uuid().safeParse(id);
  if (!uuid.success) {
    return NextResponse.json({ error: 'Pass generated demo jobs with POST.' }, { status: 400 });
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('id', uuid.data)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return buildInsights(job);
});

export async function POST(req: Request) {
  const parsed = JobInsightInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Send a job summary to analyze.' }, { status: 400 });
  }

  return buildInsights(parsed.data.job);
}
