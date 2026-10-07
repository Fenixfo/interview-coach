import type { UserProfile } from "@interview-coach/core";

/** Canales IPC: lista cerrada, sin canales genéricos. */
export const CH = {
  load: "persist:load",
  save: "persist:save",
  keyHas: "key:has",
  keySet: "key:set",
  keyClear: "key:clear",
  transcribe: "stt:transcribe",
  translate: "tr:translate",
  answer: "llm:answer",
  answerChunk: "llm:chunk",
  answerCancel: "llm:cancel",
  floating: "win:floating",
  modelStatus: "model:status",
  complete: "llm:complete",
  historyList: "history:list",
  historySave: "history:save",
  historyRemove: "history:remove",
  exportFile: "file:export",
  updateStatus: "update:status",
  updateInstall: "update:install",
} as const;

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; kind: "quota" | "invalid_key" | "network" | "unknown"; message: string };

export interface AnswerRequest {
  id: string;
  question: string;
  profile: UserProfile;
  settings: { model: string; level: "A2" | "B1" | "B2" | "C1" };
}

export interface CompleteRequest {
  prompt: string;
  system?: string;
  model: string;
}

export type UpdateStatus =
  | { state: "available"; version: string }
  | { state: "downloaded"; version: string };
