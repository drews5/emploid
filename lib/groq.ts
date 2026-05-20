type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type CreateChatCompletionArgs = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_completion_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const baseUrl = 'https://api.groq.com/openai/v1';

  if (!apiKey) {
    throw new Error('Groq is not configured.');
  }

  return { apiKey, baseUrl, model };
}

class GroqClient {
  async create(args: CreateChatCompletionArgs) {
    const { apiKey, baseUrl, model } = getGroqConfig();
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
      throw new Error(detail || 'Groq request failed.');
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }
}

const groqClient = new GroqClient();

export const groq = {
  chat: {
    completions: {
      create: (args: CreateChatCompletionArgs) => groqClient.create(args),
    },
  },
};

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export function parseGroqJson<T>(content: string | null | undefined, fallback: T): T {
  if (!content) return fallback;

  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return fallback;

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return fallback;
    }
  }
}
