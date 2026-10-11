import {
  GeminiClient,
  GeminiTranslator,
  answerSystemPrompt,
  answerUserPrompt,
  toApiError,
  type AudioSourceKind,
  type SessionRecord,
} from "@interview-coach/core";
import type { CoachServices, Persisted } from "@interview-coach/ui";
import { startAudio } from "./audio";
import { onModelStatus, transcribe } from "./speech";

const K = { settings: "coach.settings", key: "coach.gemini.key", history: "coach.history" } as const;
const MAX_SESSIONS = 200;

function read<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(name);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(name: string, value: unknown): void {
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    throw new Error("No hay espacio o permiso para guardar datos en este navegador.");
  }
}

const getKey = (): string | null => read<string>(K.key);
function needKey(): string {
  const k = getKey();
  if (!k) throw toApiError({ status: 401, message: "API key not valid" });
  return k;
}

const cache = new Map<string, string>();

/** Traductor gratuito de Google (endpoint no oficial). Si el navegador lo bloquea, se usa Gemini. */
async function freeTranslate(text: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  const parts = Array.isArray(data) && Array.isArray(data[0]) ? (data[0] as unknown[]) : [];
  const out = parts.map((p) => (Array.isArray(p) ? String(p[0] ?? "") : "")).join("");
  if (!out.trim()) throw new Error("respuesta vacía");
  return out.trim();
}

const sources: AudioSourceKind[] = [
  ...(typeof navigator.mediaDevices?.getDisplayMedia === "function" ? (["tab"] as const) : []),
  "microphone",
];

export const webServices: CoachServices = {
  availableSources: sources,
  startAudio,
  transcribe,
  translate: async (text, { final }) => {
    const hit = cache.get(text);
    if (hit) return hit;
    let out: string;
    try {
      out = await freeTranslate(text);
    } catch (err) {
      const key = getKey();
      if (!final || !key) throw err;
      const model = read<Persisted>(K.settings)?.settings.model;
      out = await new GeminiTranslator(
        new GeminiClient({ apiKey: key, ...(model ? { model } : {}) }),
      ).translate(text);
    }
    if (cache.size > 300) cache.clear();
    cache.set(text, out);
    return out;
  },
  streamAnswer: ({ question, profile, settings }, onChunk, signal) =>
    new GeminiClient({ apiKey: needKey(), model: settings.model }).stream(
      answerUserPrompt(question),
      onChunk,
      signal,
      answerSystemPrompt(profile, settings.level),
    ),
  complete: async ({ prompt, system, model }) =>
    new GeminiClient({ apiKey: needKey(), model }).complete(prompt.slice(0, 20000), system?.slice(0, 20000)),
  history: {
    list: async () => read<SessionRecord[]>(K.history) ?? [],
    save: async (rec) => {
      const rest = (read<SessionRecord[]>(K.history) ?? []).filter((r) => r.id !== rec.id);
      write(K.history, [rec, ...rest].slice(0, MAX_SESSIONS));
    },
    remove: async (id) =>
      write(K.history, (read<SessionRecord[]>(K.history) ?? []).filter((r) => r.id !== id)),
  },
  exportFile: async (name, content) => {
    const safe = name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || "sesion.md";
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: safe });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  },
  key: {
    has: async () => !!getKey(),
    set: async (k) => {
      if (k.length < 10 || k.length > 200) throw new Error("La clave no tiene un formato válido.");
      write(K.key, k);
    },
    clear: async () => localStorage.removeItem(K.key),
  },
  load: async () => read<Persisted>(K.settings),
  save: async (p) => write(K.settings, p),
  onModelStatus,
};
