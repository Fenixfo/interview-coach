import { contextBridge, ipcRenderer } from "electron";
import { CH } from "../shared/ipc";
import type { AnswerRequest, Result } from "../shared/ipc";

/** API mínima: cada método llama a un canal fijo. No se expone ipcRenderer. */
const bridge = {
  load: (): Promise<unknown> => ipcRenderer.invoke(CH.load),
  save: (data: unknown): Promise<void> => ipcRenderer.invoke(CH.save, data),
  keyHas: (): Promise<boolean> => ipcRenderer.invoke(CH.keyHas),
  keySet: (key: string): Promise<void> => ipcRenderer.invoke(CH.keySet, key),
  keyClear: (): Promise<void> => ipcRenderer.invoke(CH.keyClear),
  transcribe: (pcm: Float32Array): Promise<Result<string>> => ipcRenderer.invoke(CH.transcribe, pcm),
  translate: (text: string, final: boolean, model: string): Promise<Result<string>> =>
    ipcRenderer.invoke(CH.translate, text, final, model),
  answer: (req: AnswerRequest): Promise<Result<string>> => ipcRenderer.invoke(CH.answer, req),
  answerCancel: (id: string): Promise<void> => ipcRenderer.invoke(CH.answerCancel, id),
  onAnswerChunk: (cb: (id: string, chunk: string) => void): (() => void) => {
    const h = (_e: unknown, id: string, chunk: string) => cb(id, chunk);
    ipcRenderer.on(CH.answerChunk, h);
    return () => ipcRenderer.removeListener(CH.answerChunk, h);
  },
  setFloating: (on: boolean): Promise<void> => ipcRenderer.invoke(CH.floating, on),
  onModelStatus: (cb: (s: unknown) => void): (() => void) => {
    const h = (_e: unknown, s: unknown) => cb(s);
    ipcRenderer.on(CH.modelStatus, h);
    return () => ipcRenderer.removeListener(CH.modelStatus, h);
  },
};

contextBridge.exposeInMainWorld("coachBridge", bridge);

export type CoachBridge = typeof bridge;
