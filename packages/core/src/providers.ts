/** Interfaces de proveedores: cada plataforma aporta su propia implementación. */

export type AudioSourceKind = "system" | "tab" | "microphone" | "simulation";

export interface AudioSource {
  readonly kind: AudioSourceKind;
  /** Entrega PCM mono Float32 a 16 kHz. Devuelve una función para detener. */
  start(onChunk: (pcm: Float32Array) => void): Promise<() => void>;
}

export interface TranscriptEvent {
  text: string;
  /** false = parcial (puede cambiar); true = final. */
  isFinal: boolean;
}

export interface SttProvider {
  readonly name: string;
  start(onEvent: (e: TranscriptEvent) => void): Promise<void>;
  feed?(pcm: Float32Array): void;
  stop(): Promise<void>;
}

export interface TranslationProvider {
  readonly name: string;
  translate(text: string, from: string, to: string): Promise<string>;
}

export interface LlmProvider {
  /** Genera texto en streaming; entrega fragmentos acumulables. */
  stream(prompt: string, onChunk: (text: string) => void, signal?: AbortSignal): Promise<string>;
}

export interface SecureKeyStore {
  get(): Promise<string | null>;
  set(key: string): Promise<void>;
  clear(): Promise<void>;
}
