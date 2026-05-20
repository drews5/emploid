import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing or empty.');
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

export function getGroqClient() {
  return createGroqClient();
}

export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    const client = createGroqClient() as any;
    return client[prop as keyof Groq];
  },
}) as Groq;

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

export function parseGroqJson<T>(content: string | null | undefined, fallback: T): T {
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
