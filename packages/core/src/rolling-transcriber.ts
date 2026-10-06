import type { TranscriptEvent } from "./providers";

export interface RollingOptions {
  /** Transcribe un tramo de PCM mono 16 kHz. */
  transcribe: (pcm: Float32Array) => Promise<string>;
  onEvent: (e: TranscriptEvent) => void;
  sampleRate?: number;
  /** RMS por encima del cual hay voz. */
  voiceThreshold?: number;
  /** Silencio que cierra el tramo actual como final. */
  silenceMs?: number;
  /** Máximo de audio por llamada; si se supera, el tramo se cierra como final. */
  maxWindowSec?: number;
  /** Audio previo a la voz que se conserva, para no cortar la primera sílaba. */
  preRollMs?: number;
  /** Tramos más cortos que esto no se transcriben (evita alucinaciones con ruidos). */
  minSpeechMs?: number;
}

const rms = (a: Float32Array): number => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] as number) ** 2;
  return Math.sqrt(s / Math.max(1, a.length));
};

/**
 * Transcripción parcial en vivo sobre un transcriptor por lotes (p. ej. Whisper).
 * Filtra el silencio, emite parciales en cada `tick()` y un final al detectar pausa.
 * No usa temporizadores propios: el consumidor llama a `tick()` (~cada 1 s).
 */
export class RollingTranscriber {
  private chunks: Float32Array[] = [];
  private samples = 0;
  private speechSamples = 0;
  private active = false;
  private lastVoiceAt = 0;
  private busy = false;
  private readonly rate: number;
  private readonly threshold: number;
  private readonly silenceMs: number;
  private readonly maxSamples: number;
  private readonly preRollSamples: number;
  private readonly minSpeechSamples: number;

  constructor(private readonly o: RollingOptions) {
    this.rate = o.sampleRate ?? 16000;
    this.threshold = o.voiceThreshold ?? 0.012;
    this.silenceMs = o.silenceMs ?? 700;
    this.maxSamples = (o.maxWindowSec ?? 12) * this.rate;
    this.preRollSamples = ((o.preRollMs ?? 300) / 1000) * this.rate;
    this.minSpeechSamples = ((o.minSpeechMs ?? 300) / 1000) * this.rate;
  }

  push(pcm: Float32Array, now: number): void {
    const voiced = rms(pcm) > this.threshold;
    if (voiced) {
      this.lastVoiceAt = now;
      this.active = true;
      this.speechSamples += pcm.length;
    }
    if (!this.active) {
      // En reposo solo guardamos un pre-roll corto.
      this.chunks.push(pcm);
      this.samples += pcm.length;
      while (this.samples - (this.chunks[0]?.length ?? 0) >= this.preRollSamples && this.chunks.length > 1) {
        this.samples -= (this.chunks.shift() as Float32Array).length;
      }
      return;
    }
    this.chunks.push(pcm);
    this.samples += pcm.length;
  }

  /** Llamar ~cada segundo. Devuelve cuando termina la transcripción en curso. */
  async tick(now: number): Promise<void> {
    if (!this.active || this.busy) return;
    if (this.speechSamples < this.minSpeechSamples) {
      if (now - this.lastVoiceAt > this.silenceMs) this.reset();
      return;
    }
    const silent = now - this.lastVoiceAt > this.silenceMs;
    const overflow = this.samples >= this.maxSamples;
    const final = silent || overflow;

    this.busy = true;
    const pcm = this.concat();
    try {
      const text = (await this.o.transcribe(pcm)).trim();
      if (final) {
        if (text) this.o.onEvent({ text, isFinal: true });
        // Audio que llegó mientras transcribíamos se conserva solo si seguimos en medio de una frase.
        this.reset();
      } else if (text) {
        this.o.onEvent({ text, isFinal: false });
      }
    } finally {
      this.busy = false;
    }
  }

  reset(): void {
    this.chunks = [];
    this.samples = 0;
    this.speechSamples = 0;
    this.active = false;
  }

  private concat(): Float32Array {
    const out = new Float32Array(this.samples);
    let o = 0;
    for (const c of this.chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }
}
