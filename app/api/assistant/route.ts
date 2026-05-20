import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAssistantClient, ASSISTANT_MODEL } from '@/lib/assistant';

export const dynamic = 'force-dynamic';

const AssistantRequest = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(3000),
  })).max(12),
  resumeProfile: z.unknown().nullable().optional(),
  currentPage: z.enum(['home', 'jobs', 'tracker', 'about']).optional(),
  trackerApplications: z.array(z.unknown()).max(30).optional(),
  jobs: z.array(z.unknown()).max(80).optional(),
  filters: z.record(z.unknown()).optional(),
});

function sse(data: unknown) {
  return 'data: ' + JSON.stringify(data) + '\n\n';
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
        const stream = await assistant.chat.completions.create({
          model: ASSISTANT_MODEL,
          temperature: 0.35,
          max_completion_tokens: 900,
          stream: true,
          messages: [
            {
              role: 'system',
              content: [
                'You are Emploid Assistant, a practical job-search copilot inside Emploid.',
                'Use the provided resume profile, current filters, job summaries, and tracker applications.',
                'Recommend jobs only from the supplied job context. If the user wants filtering, guide them to the filter sidebar or name the matching supplied jobs.',
                'For tracker questions, give concrete next steps using the listed application stage, next action, and recent activity.',
                'Keep responses concise, warm, and action-oriented.',
              ].join(' '),
            },
            {
              role: 'user',
              content: 'Current Emploid context:\n' + JSON.stringify({
                currentPage: parsed.data.currentPage || 'home',
                resumeProfile: parsed.data.resumeProfile || null,
                filters: parsed.data.filters || {},
                jobs: parsed.data.jobs || [],
                trackerApplications: parsed.data.trackerApplications || [],
              }),
            },
            ...parsed.data.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        });

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content || '';
          if (delta) controller.enqueue(encoder.encode(sse({ delta })));
        }

        controller.enqueue(encoder.encode(sse({ done: true })));
        controller.close();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : 'The assistant could not answer right now.';
        console.error('[ASSISTANT_ERROR]', error);
        controller.enqueue(encoder.encode(sse({ error: message })));
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
