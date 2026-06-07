import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAssistantClient, ASSISTANT_MODEL, parseAssistantJson } from '@/lib/assistant';

export const dynamic = 'force-dynamic';

const AssistantRequest = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(3000),
  })).max(12),
  resumeProfile: z.unknown().nullable().optional(),
  currentPage: z.enum(['home', 'jobs', 'tracker', 'about', 'blog']).optional(),
  trackerApplications: z.array(z.unknown()).max(30).optional(),
  jobs: z.array(z.unknown()).max(80).optional(),
  filters: z.record(z.unknown()).optional(),
});

function sse(data: unknown) {
  return 'data: ' + JSON.stringify(data) + '\n\n';
}

type AssistantDecision = {
  message: string;
  recommendedJobIds: string[];
};

function latestUserMessage(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function shouldSearchJobs(input: {
  prompt: string;
  currentPage?: string;
  filters?: Record<string, unknown>;
}) {
  const query = typeof input.filters?.query === 'string' ? input.filters.query : '';
  const text = `${input.prompt} ${query}`.toLowerCase().trim();

  // 1. If we are on the 'jobs' page and have any query or simple job indicator
  if (input.currentPage === 'jobs' && (query || /\b(job|jobs|role|roles|opening|openings|search|find|recommend|match|apply|hiring|intern|internship)\b/.test(text))) {
    return true;
  }

  // 2. High-intent direct roles or keyword combinations
  if (/\b(it intern|software engineer|product designer|data scientist|frontend engineer|backend engineer|fullstack engineer|entry level)\b/i.test(text)) {
    return true;
  }

  // 3. Action verbs indicating job query
  const hasAction = /\b(find|search|recommend|suggest|match|show|list|look for|looking for|hiring)\b/i.test(text);

  // 4. Job-related nouns/indicators
  const hasJobNoun = /\b(job|role|opening|listing|position|vacancy|career|internship|co-op)s?\b/i.test(text);

  // 5. Job role titles/specialties
  const hasRoleTitle = /\b(engineer|developer|designer|analyst|manager|coordinator|marketing|sales|nurse|assistant|intern|specialist|technician|consultant|programmer|representative|lead|senior|junior|support|admin|administrator|associate|clerk|officer)(s|ing)?\b/i.test(text);

  // 6. Location or work mode context
  const hasLocationOrMode = /\b(remote|hybrid|onsite|in|near|at)\b/i.test(text) || /in\s+[a-z]{3,}/i.test(text) || /near\s+[a-z]{3,}/i.test(text);

  // Match configurations:
  // - Action verb combined with a Job noun or Role title (e.g., "find jobs", "recommend software developers")
  if (hasAction && (hasJobNoun || hasRoleTitle)) return true;

  // - Job noun combined with a Role title or location (e.g., "software engineering roles", "jobs in minneapolis")
  if (hasJobNoun && (hasRoleTitle || hasLocationOrMode)) return true;

  // - Role title combined with location/work mode (e.g., "intern in minneapolis", "developer remote")
  if (hasRoleTitle && hasLocationOrMode) return true;

  // - General queries like just asking for "jobs" or "internships"
  if (hasJobNoun && text.split(/\s+/).length <= 4) return true;

  return false;
}

function jobSearchQuery(input: {
  prompt: string;
  filters?: Record<string, unknown>;
  resumeProfile?: unknown;
}) {
  const filterQuery = typeof input.filters?.query === 'string' ? input.filters.query.trim() : '';
  if (filterQuery) return filterQuery;

  if (input.resumeProfile && typeof input.resumeProfile === 'object' && 'summary' in input.resumeProfile) {
    const summary = String((input.resumeProfile as { summary?: unknown }).summary || '').trim();
    if (summary && /\b(match|recommend|jobs|roles|openings)\b/i.test(input.prompt)) return summary;
  }

  return input.prompt.trim().replace(/\s+/g, ' ').slice(0, 180);
}

async function searchLiveJobs(req: Request, query: string) {
  if (!query) return [];

  const searchUrl = new URL('/api/google-jobs', req.url);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('max', '8');

  const response = await fetch(searchUrl, { cache: 'no-store' });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !Array.isArray(payload.data)) return [];

  return payload.data.slice(0, 8);
}

function compactJob(job: any) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    jobType: job.jobType,
    workMode: job.workMode,
    salary: job.salary,
    salaryText: job.salaryText,
    salaryDisclosed: job.salaryDisclosed,
    daysPosted: job.daysPosted,
    trustScore: job.trustScore,
    recentHiringActivity: job.recentHiringActivity,
    directCompanyLink: job.directCompanyLink,
    domain: job.domain,
    url: job.url,
    description: String(job.description || '').replace(/\s+/g, ' ').slice(0, 360),
  };
}

export async function POST(req: Request) {
  const parsed = AssistantRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid assistant payload.' }, { status: 400 });
  }

  let assistant;
  try {
    assistant = getAssistantClient();
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Assistant is not configured.';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        const prompt = latestUserMessage(parsed.data.messages);
        const shouldSearch = shouldSearchJobs({
          prompt,
          currentPage: parsed.data.currentPage,
          filters: parsed.data.filters,
        });
        const searchQuery = shouldSearch
          ? jobSearchQuery({
              prompt,
              filters: parsed.data.filters,
              resumeProfile: parsed.data.resumeProfile,
            })
          : '';
        const liveJobs = shouldSearch ? await searchLiveJobs(req, searchQuery) : [];
        const suppliedJobs = parsed.data.jobs || [];
        const availableJobs = liveJobs.length ? liveJobs : suppliedJobs;

        const completion = await assistant.chat.completions.create({
          model: ASSISTANT_MODEL,
          temperature: 0.35,
          max_completion_tokens: 900,
          messages: [
            {
              role: 'system',
              content: [
                'You are Jobspector Assistant, a practical job-search copilot inside Jobspector.',
                'The backend may have already searched live jobs before this step. Decide whether job recommendation cards are useful.',
                'Return only JSON with keys: message (string) and recommendedJobIds (array of strings).',
                'Use recommendedJobIds only when the user asks for jobs, listings, matches, openings, or recommendations and the provided availableJobs are relevant.',
                'Use only ids from availableJobs. Do not invent jobs or ids. Do not recommend tracker applications as job postings.',
                'When recommending jobs, include the exact title, company, location, salary signal if available, trust score, and link the job title with Markdown syntax like [Exact title](provided-url). Do not write the words "Markdown link".',
                'If no live jobs are relevant, explain what to search next and return an empty recommendedJobIds array.',
                'If the user wants filtering, guide them to the filter sidebar or name the matching supplied jobs.',
                'Use tracker applications only when the user asks about their application tracker, follow-ups, stages, or next actions.',
                'Keep responses concise, warm, and action-oriented.',
              ].join(' '),
            },
            {
              role: 'user',
              content: 'Current Jobspector context:\n' + JSON.stringify({
                currentPage: parsed.data.currentPage || 'home',
                resumeProfile: parsed.data.resumeProfile || null,
                filters: parsed.data.filters || {},
                searchedLiveJobs: shouldSearch,
                liveJobSearchQuery: searchQuery,
                availableJobs: availableJobs.map(compactJob),
                trackerApplications: parsed.data.trackerApplications || [],
              }),
            },
            ...parsed.data.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        });

        const content = completion.choices?.[0]?.message?.content || '';
        const assistantResult = parseAssistantJson<AssistantDecision>(content, {
          message: 'I could not find enough context to answer that cleanly yet.',
          recommendedJobIds: [],
        });
        const availableById = new Map(availableJobs.map((job: any) => [String(job.id), job]));
        const recommendedJobs = Array.isArray(assistantResult.recommendedJobIds)
          ? assistantResult.recommendedJobIds
              .map((id: unknown) => availableById.get(String(id)))
              .filter(Boolean)
              .slice(0, 4)
          : [];
        const message = typeof assistantResult.message === 'string'
          ? assistantResult.message
          : 'I could not find enough context to answer that cleanly yet.';

        controller.enqueue(encoder.encode(sse({ delta: message })));
        controller.enqueue(encoder.encode(sse({ done: true, jobs: recommendedJobs, searchedLiveJobs: shouldSearch, searchQuery })));
        controller.close();
      } catch (error) {
        console.error('[ASSISTANT_ERROR]', error);
        controller.enqueue(encoder.encode(sse({ error: 'The assistant could not answer right now.' })));
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
