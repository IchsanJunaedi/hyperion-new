import "server-only";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash-lite";

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super("GEMINI_API_KEY belum dikonfigurasi");
    this.name = "GeminiNotConfiguredError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiNotConfiguredError();
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export interface ImagePart {
  mimeType: string;
  /** base64-encoded image bytes (no data: prefix) */
  data: string;
}

const MAX_ATTEMPTS = 3;

function statusOf(err: unknown): number | null {
  if (err && typeof err === "object") {
    const e = err as { status?: unknown; code?: unknown };
    if (typeof e.status === "number") return e.status;
    if (typeof e.code === "number") return e.code;
  }
  return null;
}

/** Retry transient overload/rate-limit responses (429/503) with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = statusOf(err);
      const retryable = status === 503 || status === 429;
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}

/** Call Gemini with an image + prompt, forcing a JSON response that matches `responseSchema`. */
export async function generateStructured<T>(args: {
  prompt: string;
  image: ImagePart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: Record<string, any>;
}): Promise<T> {
  const ai = getClient();
  const res = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: args.prompt },
            { inlineData: { mimeType: args.image.mimeType, data: args.image.data } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: args.responseSchema,
        temperature: 0,
      },
    }),
  );
  const text = res.text;
  if (!text) throw new Error("Gemini mengembalikan respons kosong");
  return JSON.parse(text) as T;
}

/** Call Gemini for a free-text narrative (no image). */
export async function generateText(prompt: string): Promise<string> {
  const ai = getClient();
  const res = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 },
    }),
  );
  return res.text ?? "";
}
