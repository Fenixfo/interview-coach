import type { AudioSourceKind, EnglishLevel, SessionRecord, UserProfile } from "@interview-coach/core";

export interface Settings {
  model: string;
  level: EnglishLevel;
  /** Pausa (ms) que cierra la pregunta del entrevistador. */
  silenceMs: number;
  audioSource: AudioSourceKind;
  /** Genera la respuesta sola cuando el texto parece una pregunta. */
  autoAnswer: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  model: "gemini-3.5-flash-lite",
  level: "B2",
  silenceMs: 1500,
  audioSource: "system",
  autoAnswer: true,
};

export interface Persisted {
  settings: Settings;
  profile: UserProfile;
}

export type ModelStatus =
  | { state: "ready" }
  | { state: "downloading"; percent: number }
  | { state: "error"; message: string };

/** Lo que cada plataforma debe aportar a la interfaz compartida. */
export interface CoachServices {
  availableSources: AudioSourceKind[];
  /** Entrega PCM mono a 16 kHz. Devuelve la función que detiene la captura. */
  startAudio(source: AudioSourceKind, onChunk: (pcm: Float32Array) => void): Promise<() => void>;
  transcribe(pcm: Float32Array): Promise<string>;
  /** `final` = frase completa (el respaldo de pago de cuota solo se usa con frases completas). */
  translate(text: string, opts: { final: boolean }): Promise<string>;
  /** Respuesta sugerida en streaming. Lanza ApiError con mensaje en español. */
  streamAnswer(
    req: { question: string; profile: UserProfile; settings: Settings },
    onChunk: (text: string) => void,
    signal: AbortSignal,
  ): Promise<string>;
  /** Una sola respuesta de Gemini (preguntas de simulación, retroalimentación). */
  complete(req: { prompt: string; system?: string; model: string }): Promise<string>;
  history: {
    list(): Promise<SessionRecord[]>;
    save(rec: SessionRecord): Promise<void>;
    remove(id: string): Promise<void>;
  };
  /** Pide dónde guardar y escribe el archivo. Devuelve false si se cancela. */
  exportFile(name: string, content: string): Promise<boolean>;
  key: {
    has(): Promise<boolean>;
    set(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  load(): Promise<Persisted | null>;
  save(p: Persisted): Promise<void>;
  /** Estado del modelo de voz local (solo escritorio). */
  onModelStatus?(cb: (s: ModelStatus) => void): () => void;
  /** Avisos de actualización automática (solo escritorio instalado). */
  onUpdate?(cb: (s: UpdateInfo) => void): () => void;
  installUpdate?(): Promise<void>;
  /** Modo flotante: ventana compacta y siempre visible (solo escritorio). */
  setFloating?(on: boolean): Promise<void>;
}

export type UpdateInfo = { state: "available" | "downloaded"; version: string };
