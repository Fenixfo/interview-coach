import { GoogleGenAI } from "@google/genai";
import { toApiError } from "./errors";
import type { LlmProvider, TranslationProvider } from "./providers";
import { translationPrompt } from "./prompts";

export const DEFAULT_MODEL = "gemini-3.5-flash-lite";

/** Subconjunto del SDK que usamos; permite sustituirlo en pruebas. */
export interface GenAiLike {
  models: {
    generateContentStream(params: {
      model: string;
      contents: string;
      config?: { systemInstruction?: string; abortSignal?: AbortSignal; temperature?: number };
    }): Promise<AsyncIterable<{ text?: string }>>;
  };
}

export interface GeminiOptions {
  apiKey: string;
  model?: string;
  /** Solo para pruebas. */
  client?: GenAiLike;
}

export class GeminiClient implements LlmProvider {
  private readonly ai: GenAiLike;
  readonly model: string;

  constructor(opts: GeminiOptions) {
    this.model = opts.model ?? DEFAULT_MODEL;
    this.ai = opts.client ?? (new GoogleGenAI({ apiKey: opts.apiKey }) as unknown as GenAiLike);
  }

  /** Streaming: llama onChunk con cada fragmento y devuelve el texto completo. */
  async stream(
    prompt: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    systemInstruction?: string,
  ): Promise<string> {
    let full = "";
    try {
      const config: { systemInstruction?: string; abortSignal?: AbortSignal } = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (signal) config.abortSignal = signal;
      const res = await this.ai.models.generateContentStream({
        model: this.model,
        contents: prompt,
        config,
      });
      for await (const chunk of res) {
        const t = chunk.text ?? "";
        if (t) {
          full += t;
          onChunk(t);
        }
      }
      return full;
    } catch (err) {
      if (signal?.aborted) return full;
      throw toApiError(err);
    }
  }

  /** Respuesta completa sin streaming visible. */
  complete(prompt: string, systemInstruction?: string): Promise<string> {
    return this.stream(prompt, () => {}, undefined, systemInstruction);
  }
}

/** Traducción con Gemini: respaldo del traductor gratuito. Solo para frases completas. */
export class GeminiTranslator implements TranslationProvider {
  readonly name = "gemini";
  constructor(private readonly gemini: GeminiClient) {}

  async translate(text: string): Promise<string> {
    return (await this.gemini.complete(translationPrompt(text))).trim();
  }
}
