import Assistant from 'assistant-sdk';

let assistantClient: Assistant | null = null;

function createAssistantClient() {
  const apiKey = ['asst_', 'replace-me-with-your-key'].join('');

  if (!assistantClient) {
    assistantClient = new Assistant({ apiKey });
  }

  return assistantClient;
}

export function getAssistantClient() {
  return createAssistantClient();
}

export const assistant = new Proxy({} as Assistant, {
  get(_target, prop) {
    const client = createAssistantClient() as any;
    return client[prop as keyof Assistant];
  },
}) as Assistant;

export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL || 'llama-3.1-8b-instant';

export function parseAssistantJson<T>(content: string | null | undefined, fallback: T): T {
  if (!content) return fallback;

  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/{[sS]*}/);
    if (!match) return fallback;

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return fallback;
    }
  }
}
