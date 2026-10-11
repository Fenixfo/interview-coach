import type { ModelStatus } from "@interview-coach/ui";
import type { Out } from "./whisper.worker";

let worker: Worker | null = null;
let nextId = 0;
let status: ModelStatus = { state: "downloading", percent: 0 };
const pending = new Map<number, { ok: (t: string) => void; fail: (e: Error) => void }>();
const listeners = new Set<(s: ModelStatus) => void>();

/** Whisper inventa marcas como [BLANK_AUDIO] o (música) con ruido; se descartan. */
const clean = (t: string) => t.replace(/\[[^\]]*\]|\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<Out>) => {
    const m = e.data;
    if (m.type === "status") {
      status = m.state === "downloading" ? { state: "downloading", percent: m.percent } : m;
      listeners.forEach((l) => l(status));
    } else if (m.type === "result") {
      pending.get(m.id)?.ok(clean(m.text));
      pending.delete(m.id);
    } else {
      pending.get(m.id)?.fail(new Error(m.message));
      pending.delete(m.id);
    }
  };
  worker.postMessage({ type: "load" });
  return worker;
}

export function onModelStatus(cb: (s: ModelStatus) => void): () => void {
  ensureWorker();
  listeners.add(cb);
  cb(status);
  return () => {
    listeners.delete(cb);
  };
}

export function transcribe(pcm: Float32Array): Promise<string> {
  const w = ensureWorker();
  const id = ++nextId;
  return new Promise((ok, fail) => {
    pending.set(id, { ok, fail });
    w.postMessage({ type: "run", id, pcm }, [pcm.buffer]);
  });
}
