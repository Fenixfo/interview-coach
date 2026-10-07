import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, Menu, session, shell } from "electron";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  GeminiClient,
  answerSystemPrompt,
  answerUserPrompt,
  toApiError,
} from "@interview-coach/core";
import { CH, type AnswerRequest, type CompleteRequest, type Result, type UpdateStatus } from "../shared/ipc";
import {
  clearKey,
  getKey,
  hasKey,
  listHistory,
  loadPersisted,
  removeSession,
  savePersisted,
  saveSession,
  setKey,
} from "./store";
import { ensureModel, transcribe } from "./whisper";
import { translate } from "./translate";

let win: BrowserWindow | null = null;
let normalBounds: Electron.Rectangle | null = null;
const answers = new Map<string, AbortController>();
let updater: { quitAndInstall(): void } | null = null;

/** Busca actualizaciones en GitHub Releases (solo en la app instalada). */
function setupUpdates(): void {
  if (!app.isPackaged) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { autoUpdater } = require("electron-updater") as typeof import("electron-updater");
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  updater = autoUpdater;
  const send = (s: UpdateStatus) => win?.webContents.send(CH.updateStatus, s);
  autoUpdater.on("update-available", (i) => send({ state: "available", version: i.version }));
  autoUpdater.on("update-downloaded", (i) => send({ state: "downloaded", version: i.version }));
  autoUpdater.on("error", () => {}); // sin red o sin versión nueva: no molestamos
  void autoUpdater.checkForUpdates().catch(() => {});
}

async function wrap<T>(fn: () => Promise<T> | T): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    const e = toApiError(err);
    return { ok: false, kind: e.kind === "quota" || e.kind === "invalid_key" || e.kind === "network" ? e.kind : "unknown", message: err instanceof Error && e.kind === "unknown" ? err.message : e.message };
  }
}

function registerIpc(): void {
  ipcMain.handle(CH.load, () => loadPersisted());
  ipcMain.handle(CH.save, (_e, data: unknown) => savePersisted(data));
  ipcMain.handle(CH.keyHas, () => hasKey());
  ipcMain.handle(CH.keySet, (_e, key: unknown) => {
    if (typeof key !== "string" || key.length < 10 || key.length > 200) {
      throw new Error("La clave no tiene un formato válido.");
    }
    setKey(key);
  });
  ipcMain.handle(CH.keyClear, () => clearKey());

  ipcMain.handle(CH.transcribe, (_e, pcm: Float32Array) => wrap(() => transcribe(pcm)));

  ipcMain.handle(CH.translate, (_e, text: string, final: boolean, model: string) =>
    wrap(() => translate(String(text).slice(0, 2000), !!final, String(model))),
  );

  ipcMain.handle(CH.answer, (e, req: AnswerRequest) =>
    wrap(async () => {
      const key = getKey();
      if (!key) throw toApiError({ status: 401, message: "API key not valid" });
      const ctl = new AbortController();
      answers.set(req.id, ctl);
      try {
        const gemini = new GeminiClient({ apiKey: key, model: req.settings.model });
        return await gemini.stream(
          answerUserPrompt(req.question),
          (chunk) => e.sender.send(CH.answerChunk, req.id, chunk),
          ctl.signal,
          answerSystemPrompt(req.profile, req.settings.level),
        );
      } finally {
        answers.delete(req.id);
      }
    }),
  );
  ipcMain.handle(CH.complete, (_e, req: CompleteRequest) =>
    wrap(async () => {
      const key = getKey();
      if (!key) throw toApiError({ status: 401, message: "API key not valid" });
      const gemini = new GeminiClient({ apiKey: key, model: String(req.model) });
      return gemini.complete(String(req.prompt).slice(0, 20000), req.system?.slice(0, 20000));
    }),
  );

  ipcMain.handle(CH.historyList, () => listHistory());
  ipcMain.handle(CH.historySave, (_e, rec: { id?: unknown }) => {
    if (!rec || typeof rec.id !== "string") throw new Error("Sesión no válida.");
    saveSession(rec as { id: string });
  });
  ipcMain.handle(CH.historyRemove, (_e, id: string) => removeSession(String(id)));

  ipcMain.handle(CH.exportFile, async (_e, name: string, content: string) => {
    if (!win) return false;
    const safe = String(name).replace(/[\/:*?"<>|]/g, "-").slice(0, 120) || "sesion.md";
    const r = await dialog.showSaveDialog(win, {
      defaultPath: safe,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (r.canceled || !r.filePath) return false;
    await writeFile(r.filePath, String(content), "utf8");
    return true;
  });

  ipcMain.handle(CH.updateInstall, () => updater?.quitAndInstall());

  ipcMain.handle(CH.answerCancel, (_e, id: string) => answers.get(id)?.abort());

  ipcMain.handle(CH.floating, (_e, on: boolean) => {
    if (!win) return;
    if (on) {
      normalBounds = win.getBounds();
      win.setAlwaysOnTop(true, "floating");
      win.setBounds({ x: normalBounds.x, y: normalBounds.y, width: 460, height: 700 });
    } else {
      win.setAlwaysOnTop(false);
      if (normalBounds) win.setBounds(normalBounds);
    }
  });
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 360,
    minHeight: 420,
    backgroundColor: "#0f261b",
    title: "Coach de entrevistas",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Nada de navegación ni ventanas nuevas: los enlaces externos van al navegador.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://") && !url.startsWith(process.env["ELECTRON_RENDERER_URL"] ?? "\0")) {
      e.preventDefault();
    }
  });

  const dev = process.env["ELECTRON_RENDERER_URL"];
  if (dev) void win.loadURL(dev);
  else void win.loadFile(join(__dirname, "../renderer/index.html"));

  win.webContents.once("did-finish-load", () => {
    void ensureModel((s) => win?.webContents.send(CH.modelStatus, s)).catch(() => {});
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  // Solo se concede captura de audio/pantalla a nuestra propia ventana.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) =>
    cb(permission === "media" || permission === "display-capture"),
  );

  // Audio del sistema en Windows (loopback). El video se descarta en el renderizador.
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_req, callback) => {
      const sources = await desktopCapturer.getSources({ types: ["screen"] });
      const video = sources[0];
      if (!video) return callback({});
      callback({ video, audio: "loopback" });
    },
    { useSystemPicker: false },
  );

  registerIpc();
  createWindow();
  setupUpdates();
});

app.on("window-all-closed", () => app.quit());
