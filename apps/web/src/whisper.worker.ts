/// <reference lib="webworker" />
import { env, pipeline } from "@huggingface/transformers";

// Whisper corre aquí, en el navegador: el audio no sale del equipo.
env.allowLocalModels = false;

const MODEL = "Xenova/whisper-base.en";

type In = { type: "load" } | { type: "run"; id: number; pcm: Float32Array };
export type Out =
  | { type: "status"; state: "ready" }
  | { type: "status"; state: "downloading"; percent: number }
  | { type: "status"; state: "error"; message: string }
  | { type: "result"; id: number; text: string }
  | { type: "failed"; id: number; message: string };

type Asr = (pcm: Float32Array) => Promise<{ text: string } | Array<{ text: string }>>;
let asr: Promise<Asr> | null = null;
const post = (m: Out) => (self as unknown as Worker).postMessage(m);

function load(): Promise<Asr> {
  asr ??= (async () => {
    const files = new Map<string, { loaded: number; total: number }>();
    let last = -1;
    try {
      const pipe = await pipeline("automatic-speech-recognition", MODEL, {
        device: "wasm",
        dtype: "q8",
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status !== "progress" || !p.file) return;
          files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
          let loaded = 0;
          let total = 0;
          for (const f of files.values()) {
            loaded += f.loaded;
            total += f.total;
          }
          const pct = total ? Math.floor((loaded / total) * 100) : 0;
          if (pct !== last) {
            last = pct;
            post({ type: "status", state: "downloading", percent: pct });
          }
        },
      });
      post({ type: "status", state: "ready" });
      return pipe as unknown as Asr;
    } catch (err) {
      asr = null;
      post({
        type: "status",
        state: "error",
        message: `No se pudo cargar el modelo de voz (${err instanceof Error ? err.message : "error"}). Revisa tu conexión.`,
      });
      throw err;
    }
  })();
  return asr;
}

self.onmessage = async (e: MessageEvent<In>) => {
  const m = e.data;
  if (m.type === "load") {
    void load().catch(() => {});
    return;
  }
  try {
    const run = await load();
    const out = await run(m.pcm);
    const text = (Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text) ?? "";
    post({ type: "result", id: m.id, text });
  } catch (err) {
    post({ type: "failed", id: m.id, message: err instanceof Error ? err.message : "Falló la transcripción local." });
  }
};
