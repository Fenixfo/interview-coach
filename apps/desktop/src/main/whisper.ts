import { app } from "electron";
import { createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ModelStatus } from "@interview-coach/ui";

const MODEL = "base.en";
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODEL}.bin`;

type Transcribe = (o: Record<string, unknown>) => Promise<{ transcription: string[][] | string[] }>;
let addon: Transcribe | null = null;
/** CPU por defecto: Vulkan en una GPU integrada comparte la RAM y puede tumbar equipos con poca memoria. COACH_WHISPER_GPU=1 lo activa. */
let useGpu = process.env["COACH_WHISPER_GPU"] === "1";
let downloading: Promise<void> | null = null;

const userModel = () => join(app.getPath("userData"), "models", `ggml-${MODEL}.bin`);
/** En desarrollo se reutiliza el modelo descargado por el spike. */
const devModels = () =>
  [join(process.cwd(), "models"), join(app.getAppPath(), "models")].map((d) => join(d, `ggml-${MODEL}.bin`));

export function modelPath(): string {
  return (!app.isPackaged && devModels().find(existsSync)) || userModel();
}

export const modelReady = (): boolean => existsSync(modelPath());

/** Descarga el modelo la primera vez (~140 MB), avisando el progreso. */
export function ensureModel(report: (s: ModelStatus) => void): Promise<void> {
  if (modelReady()) {
    report({ state: "ready" });
    return Promise.resolve();
  }
  downloading ??= (async () => {
    try {
      const dest = userModel();
      mkdirSync(dirname(dest), { recursive: true });
      report({ state: "downloading", percent: 0 });
      const res = await fetch(MODEL_URL);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length") ?? 0);
      let got = 0;
      let last = 0;
      const body = Readable.fromWeb(res.body as never);
      body.on("data", (c: Buffer) => {
        got += c.length;
        const pct = total ? (got / total) * 100 : 0;
        if (pct - last >= 1) {
          last = pct;
          report({ state: "downloading", percent: pct });
        }
      });
      await pipeline(body, createWriteStream(`${dest}.part`));
      renameSync(`${dest}.part`, dest);
      report({ state: "ready" });
    } catch (err) {
      report({
        state: "error",
        message: `No se pudo descargar el modelo de voz (${err instanceof Error ? err.message : "error"}). Revisa tu conexión.`,
      });
      throw err;
    } finally {
      downloading = null;
    }
  })();
  return downloading;
}

function segmentsToText(t: string[][] | string[]): string {
  const segs = Array.isArray(t[0]) ? (t as string[][]) : [t as string[]];
  return segs
    .map((s) => s[s.length - 1] ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function transcribe(pcm: Float32Array): Promise<string> {
  addon ??= (require("@kutalia/whisper-node-addon") as { transcribe: Transcribe }).transcribe;
  const run = (gpu: boolean) =>
    addon!({ pcmf32: pcm, model: modelPath(), language: "en", use_gpu: gpu, no_prints: true });
  try {
    return segmentsToText((await run(useGpu)).transcription);
  } catch (err) {
    if (!useGpu) throw err;
    useGpu = false; // sin Vulkan utilizable: seguimos en CPU
    return segmentsToText((await run(false)).transcription);
  }
}
