// Mide la latencia de whisper.cpp en CPU sobre ventanas crecientes de audio,
// que es lo que haría la transcripción parcial en vivo.
// Uso: pnpm bench [modelo] [archivo.wav 16kHz mono PCM16] [cpu|gpu]
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transcribe } = require("@kutalia/whisper-node-addon");

const here = path.dirname(fileURLToPath(import.meta.url));
const modelName = process.argv[2] ?? "base.en";
const wavPath = process.argv[3] ?? path.join(here, "sample.wav");
const useGpu = process.argv[4] === "gpu";
const model = path.join(here, "..", "models", `ggml-${modelName}.bin`);

function readWav16kMono(file) {
  const buf = readFileSync(file);
  const dataAt = buf.indexOf("data") + 8;
  const rate = buf.readUInt32LE(24);
  const ch = buf.readUInt16LE(22);
  if (rate !== 16000 || ch !== 1) throw new Error(`Se esperaba 16 kHz mono, llegó ${rate} Hz, ${ch} canales`);
  const n = (buf.length - dataAt) >> 1;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(dataAt + i * 2) / 32768;
  return out;
}

const pcm = readWav16kMono(wavPath);
const secs = pcm.length / 16000;
console.log(`Modelo ${modelName} | ${useGpu ? "GPU" : "CPU"} | audio ${secs.toFixed(1)} s`);

const run = async (slice) => {
  const t0 = performance.now();
  const r = await transcribe({ pcmf32: slice, model, language: "en", use_gpu: useGpu, no_prints: true });
  return { ms: performance.now() - t0, text: JSON.stringify(r.transcription).slice(0, 90) };
};

await run(pcm.subarray(0, 16000)); // calentamiento (carga del modelo)
for (const w of [1, 2, 4, 6, 8, 10]) {
  if (w > secs) break;
  const { ms, text } = await run(pcm.subarray(0, w * 16000));
  console.log(`ventana ${String(w).padStart(2)} s → ${ms.toFixed(0).padStart(5)} ms (x${(ms / 1000 / w).toFixed(2)} tiempo real) ${text}`);
}
