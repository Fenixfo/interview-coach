import { net } from "electron";
import { GeminiClient, GeminiTranslator } from "@interview-coach/core";
import { getKey } from "./store";

const cache = new Map<string, string>();

/** Traductor gratuito de Google (endpoint no oficial): funciona aquí porque el proceso principal no tiene CORS. */
async function freeTranslate(text: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
    encodeURIComponent(text);
  const res = await net.fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  const parts = Array.isArray(data) && Array.isArray(data[0]) ? (data[0] as unknown[]) : [];
  const out = parts.map((p) => (Array.isArray(p) ? String(p[0] ?? "") : "")).join("");
  if (!out.trim()) throw new Error("respuesta vacía");
  return out.trim();
}

export async function translate(text: string, final: boolean, model: string): Promise<string> {
  const hit = cache.get(text);
  if (hit) return hit;
  let out: string;
  try {
    out = await freeTranslate(text);
  } catch (err) {
    // Respaldo con Gemini: solo frases completas y solo si hay clave, para cuidar la cuota.
    const key = getKey();
    if (!final || !key) throw err;
    out = await new GeminiTranslator(new GeminiClient({ apiKey: key, model })).translate(text);
  }
  if (cache.size > 300) cache.clear();
  cache.set(text, out);
  return out;
}
