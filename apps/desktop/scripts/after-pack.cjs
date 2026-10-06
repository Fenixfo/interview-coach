// Copia el runtime de Visual C++ junto al addon de Whisper, para que cargue en equipos
// que no lo tienen instalado (se permite redistribuirlo con la app).
const fs = require("node:fs");
const path = require("node:path");

const DLLS = ["vcruntime140.dll", "vcruntime140_1.dll", "msvcp140.dll"];

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;
  const sys32 = path.join(process.env.SystemRoot ?? "C:\Windows", "System32");
  const dest = path.join(
    context.appOutDir,
    "resources",
    "app.asar.unpacked",
    "node_modules",
    "@kutalia",
    "whisper-node-addon",
    "dist",
    "win32-x64",
  );
  if (!fs.existsSync(dest)) throw new Error(`No se encontró el addon de Whisper en ${dest}`);
  for (const dll of DLLS) {
    const src = path.join(sys32, dll);
    if (!fs.existsSync(src)) throw new Error(`Falta ${src}: instala el Visual C++ Redistributable x64.`);
    fs.copyFileSync(src, path.join(dest, dll));
  }
  console.log(`  • runtime de Visual C++ copiado (${DLLS.join(", ")})`);
};
