import { ApiError } from "@interview-coach/core";
import type { CoachServices, ModelStatus, Persisted } from "@interview-coach/ui";
import type { CoachBridge } from "../preload";
import type { Result } from "../shared/ipc";
import { startAudio } from "./audio";

declare global {
  interface Window {
    coachBridge: CoachBridge;
  }
}

const b = () => window.coachBridge;

function unwrap<T>(r: Result<T>): T {
  if (r.ok) return r.value;
  throw new ApiError(r.kind, r.message);
}

export const desktopServices: CoachServices = {
  availableSources: ["system", "microphone"],
  startAudio,
  transcribe: async (pcm) => unwrap(await b().transcribe(pcm)),
  translate: async (text, { final }) => {
    const settings = (await b().load()) as Persisted | null;
    return unwrap(await b().translate(text, final, settings?.settings.model ?? ""));
  },
  streamAnswer: async ({ question, profile, settings }, onChunk, signal) => {
    const id = crypto.randomUUID();
    const off = b().onAnswerChunk((cid, chunk) => cid === id && onChunk(chunk));
    const cancel = () => void b().answerCancel(id);
    signal.addEventListener("abort", cancel, { once: true });
    try {
      return unwrap(
        await b().answer({ id, question, profile, settings: { model: settings.model, level: settings.level } }),
      );
    } finally {
      off();
      signal.removeEventListener("abort", cancel);
    }
  },
  key: {
    has: () => b().keyHas(),
    set: (k) => b().keySet(k),
    clear: () => b().keyClear(),
  },
  load: async () => (await b().load()) as Persisted | null,
  save: (p) => b().save(p),
  onModelStatus: (cb) => b().onModelStatus((s) => cb(s as ModelStatus)),
  setFloating: (on) => b().setFloating(on),
};
