// Spike: audio del sistema (loopback de Windows) → whisper.cpp local, con parciales.
const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require("electron");
const path = require("node:path");

let transcribe;
const modelFor = (name) => path.join(__dirname, "..", "models", `ggml-${name}.bin`);

app.whenReady().then(() => {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      const sources = await desktopCapturer.getSources({ types: ["screen"] });
      callback({ video: sources[0], audio: "loopback" });
    },
    { useSystemPicker: false },
  );

  ipcMain.handle("transcribe", async (_e, pcm, modelName, useGpu) => {
    transcribe ??= require("@kutalia/whisper-node-addon").transcribe;
    const t0 = performance.now();
    const r = await transcribe({
      pcmf32: pcm,
      model: modelFor(modelName),
      language: "en",
      use_gpu: !!useGpu,
      no_prints: true,
    });
    // Cada segmento llega como [inicio, fin, texto]; solo nos interesa el texto.
    const segs = Array.isArray(r.transcription[0]) ? r.transcription : [r.transcription];
    const text = segs.map((s) => s[s.length - 1]).join(" ").replace(/\s+/g, " ").trim();
    return { text, ms: performance.now() - t0 };
  });

  const win = new BrowserWindow({
    width: 900,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "index.html"));
  if (process.argv.includes("--auto")) {
    win.webContents.on("console-message", (e) => console.log("[renderer]", e.message));
    win.webContents.once("did-finish-load", async () => {
      await win.webContents.executeJavaScript("document.getElementById(\"go\").click()", true);
      setTimeout(() => app.quit(), 22000);
    });
  }
});

app.on("window-all-closed", () => app.quit());
