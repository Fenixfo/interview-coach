export interface SegmenterOptions {
  /** Silencio (ms) que cierra un turno. Por defecto 1500. */
  silenceMs?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (id: unknown) => void;
}

/**
 * Agrupa fragmentos de transcripción en turnos. Un turno se cierra tras `silenceMs`
 * sin texto nuevo. Los parciales reemplazan al texto en curso; los finales se acumulan.
 */
export class TurnSegmenter {
  private finals: string[] = [];
  private partial = "";
  private timer: unknown;
  private readonly silenceMs: number;
  private readonly setTimer: (fn: () => void, ms: number) => unknown;
  private readonly clearTimer: (id: unknown) => void;

  constructor(
    private readonly onTurn: (text: string) => void,
    opts: SegmenterOptions = {},
  ) {
    this.silenceMs = opts.silenceMs ?? 1500;
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer =
      opts.clearTimer ?? ((id) => clearTimeout(id as ReturnType<typeof setTimeout>));
  }

  /** Texto del turno en curso (finales + parcial). */
  get current(): string {
    return [...this.finals, this.partial].filter(Boolean).join(" ").trim();
  }

  push(text: string, isFinal: boolean): void {
    const clean = text.trim();
    if (!clean) return;
    if (isFinal) {
      this.finals.push(clean);
      this.partial = "";
    } else {
      this.partial = clean;
    }
    this.rearm();
  }

  /** Cierra el turno ahora (p. ej. botón "Responder última"). */
  flush(): void {
    this.cancel();
    const text = this.current;
    this.finals = [];
    this.partial = "";
    if (text) this.onTurn(text);
  }

  reset(): void {
    this.cancel();
    this.finals = [];
    this.partial = "";
  }

  private rearm(): void {
    this.cancel();
    this.timer = this.setTimer(() => this.flush(), this.silenceMs);
  }

  private cancel(): void {
    if (this.timer !== undefined) this.clearTimer(this.timer);
    this.timer = undefined;
  }
}
