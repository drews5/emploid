type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CreateChatCompletionArgs = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_completion_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
};

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function getAssistantConfig() {
  const apiKey = process.env.ASSISTANT_API_KEY;
  const baseUrl = process.env.ASSISTANT_API_BASE_URL;
  const model = process.env.ASSISTANT_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey || !baseUrl) {
    throw new Error('Assistant is not configured.');
  }

  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model };
}

async function* parseSseStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventChunk of events) {
      const line = eventChunk.split('\n').find((item) => item.startsWith('data: '));
      if (!line) continue;

      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;

      try {
        const payload = JSON.parse(raw) as ChatCompletionChunk & { error?: string };
        const delta = payload.choices?.[0]?.delta?.content;
        if (delta) {
          yield { choices: [{ delta: { content: delta } }] };
        }
      } catch {
        continue;
      }
    }
  }
}

class AssistantClient {
  async create(args: CreateChatCompletionArgs) {
    const { apiKey, baseUrl, model } = getAssistantConfig();
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: args.model || model,
        temperature: args.temperature,
        max_completion_tokens: args.max_completion_tokens,
        response_format: args.response_format,
        stream: args.stream,
        messages: args.messages,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || 'Assistant request failed.');
    }

    if (args.stream) {
      if (!response.body) {
        throw new Error('Assistant stream is unavailable.');
      }
      return parseSseStream(response.body);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}

const chat = {
  completions: {
    create: (args: CreateChatCompletionArgs) => new AssistantClient().create(args),
  },
};

export function getAssistantClient() {
  return { chat };
}

export const assistant = { chat };

export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || 'llama-3.1-8b-instant';

export function parseAssistantJson<T>(content: string | null | undefined, fallback: T): T {
  if (!content) return fallback;

  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/{[\s\S]*}/);
    if (!match) return fallback;

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return fallback;
    }
  }
}
