import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

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
