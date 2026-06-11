import "server-only";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.0-flash";

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

/** Call Gemini with an image + prompt, forcing a JSON response that matches `responseSchema`. */
export async function generateStructured<T>(args: {
  prompt: string;
  image: ImagePart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: Record<string, any>;
}): Promise<T> {
  const ai = getClient();
  const res = await ai.models.generateContent({
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
  });
  const text = res.text;
  if (!text) throw new Error("Gemini mengembalikan respons kosong");
  return JSON.parse(text) as T;
}

/** Call Gemini for a free-text narrative (no image). */
export async function generateText(prompt: string): Promise<string> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: 0.4 },
  });
  return res.text ?? "";
}
