// Descarga un modelo ggml de whisper.cpp a apps/desktop/models/ (ignorado por git).
// Uso: pnpm model [tiny.en|base.en|small.en]
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const name = process.argv[2] ?? "base.en";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "models");
const file = path.join(dir, `ggml-${name}.bin`);
mkdirSync(dir, { recursive: true });
if (existsSync(file)) {
  console.log("Ya existe:", file);
  process.exit(0);
}
const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${name}.bin`;
console.log("Descargando", url);
const res = await fetch(url);
if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
console.log("Listo:", file);
