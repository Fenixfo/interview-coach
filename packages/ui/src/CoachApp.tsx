import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eraser,
  MicOff,
  Pause,
  PictureInPicture2,
  Play,
  Reply,
  Settings as SettingsIcon,
  Captions,
} from "lucide-react";
import type { AudioSourceKind } from "@interview-coach/core";
import { useCoach, type Coach, type Status, type Turn } from "./useCoach";
import { SettingsView } from "./SettingsView";
import type { CoachServices } from "./types";

const SOURCE_LABEL: Record<AudioSourceKind, string> = {
  system: "Audio del sistema",
  tab: "Pestaña del navegador",
  microphone: "Micrófono",
  simulation: "Simulación",
};

const STATUS_TEXT: Record<Status, string> = {
  idle: "En pausa",
  listening: "Escuchando",
  hearing: "Oyendo al entrevistador",
  paused: "Es tu turno: no transcribo",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Resalta los marcadores [así] que el modelo deja cuando falta un dato del perfil. */
function withGaps(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <mark key={i} className="gap">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function CoachApp({ services }: { services: CoachServices }) {
  const coach = useCoach(services);
  const [view, setView] = useState<"coach" | "settings">("coach");
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  if (!coach.loaded) return <div className="app" aria-busy="true" />;

  return (
    <div className="app" data-transcript={transcriptOpen ? "open" : "closed"}>
      {view === "settings" ? (
        <>
          <header className="bar">
            <button type="button" className="btn btn--quiet" onClick={() => setView("coach")}>
              <ArrowLeft size={18} aria-hidden /> <span>Volver</span>
            </button>
          </header>
          <SettingsView coach={coach} />
          <Privacy />
        </>
      ) : (
        <>
          <Toolbar
            coach={coach}
            sources={services.availableSources}
            canFloat={!!services.setFloating}
            transcriptOpen={transcriptOpen}
            onToggleTranscript={() => setTranscriptOpen((v) => !v)}
            onSettings={() => setView("settings")}
          />
          <main className="body">
            <LivePanel coach={coach} />
            <FocusPanel coach={coach} onSettings={() => setView("settings")} />
          </main>
          <Privacy />
        </>
      )}
    </div>
  );
}

function Toolbar(props: {
  coach: Coach;
  sources: AudioSourceKind[];
  canFloat: boolean;
  transcriptOpen: boolean;
  onToggleTranscript: () => void;
  onSettings: () => void;
}) {
  const { coach: c } = props;
  const model = c.modelStatus;
  return (
    <header className="bar">
      <div className="bar__status" role="status" aria-live="polite">
        <span className="dot" data-on={c.running && !c.myTurn} aria-hidden />
        <span>
          {model.state === "downloading"
            ? `Descargando el modelo de voz local… ${Math.round(model.percent)} %`
            : STATUS_TEXT[c.status]}
        </span>
      </div>

      <div className="bar__group">
        <select
          className="select only-wide"
          aria-label="Fuente de audio"
          value={c.settings.audioSource}
          disabled={c.running}
          onChange={(e) =>
            c.setSettings({ ...c.settings, audioSource: e.target.value as AudioSourceKind })
          }
        >
          {props.sources.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--primary"
          onClick={c.toggleRunning}
          disabled={model.state === "downloading"}
          aria-label={c.running ? "Pausar" : "Iniciar"}
        >
          {c.running ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          <span className="label">{c.running ? "Pausar" : "Iniciar"}</span>
        </button>

        <button
          type="button"
          className="btn"
          aria-pressed={c.myTurn}
          disabled={!c.running}
          onClick={c.toggleMyTurn}
          aria-label="Mi turno"
          title="Mi turno: no transcribe tu propia voz"
        >
          <MicOff size={18} aria-hidden /> <span className="label">Mi turno</span>
        </button>

        <button
          type="button"
          className="btn"
          disabled={!c.canAnswer}
          onClick={c.answerLast}
          aria-label="Responder última"
          title="Genera la respuesta de la última pregunta"
        >
          <Reply size={18} aria-hidden /> <span className="label">Responder última</span>
        </button>

        <button
          type="button"
          className="btn"
          onClick={c.clear}
          disabled={c.turns.length === 0 && c.lines.length === 0}
          aria-label="Limpiar"
        >
          <Eraser size={18} aria-hidden /> <span className="label">Limpiar</span>
        </button>

        <button
          type="button"
          className="btn only-compact"
          aria-pressed={props.transcriptOpen}
          onClick={props.onToggleTranscript}
          aria-label="Transcripción"
        >
          <Captions size={18} aria-hidden /> <span className="label">Transcripción</span>
        </button>

        {props.canFloat && (
          <button
            type="button"
            className="btn"
            aria-pressed={c.floating}
            onClick={() => c.setFloating(!c.floating)}
            aria-label="Ventana flotante"
            title="Ventana compacta, siempre visible"
          >
            <PictureInPicture2 size={18} aria-hidden /> <span className="label">Flotante</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn--quiet"
          onClick={props.onSettings}
          aria-label="Ajustes"
        >
          <SettingsIcon size={18} aria-hidden /> <span className="label">Ajustes</span>
        </button>
      </div>
    </header>
  );
}

function LivePanel({ coach: c }: { coach: Coach }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [c.lines, c.partial, c.partialEs]);

  return (
    <section className="live" aria-label="Transcripción en vivo">
      <h2 className="live__head">Inglés, en vivo</h2>
      <h2 className="live__head">Español</h2>

      {c.lines.length === 0 && !c.partial && (
        <p className="live__empty">
          {c.running
            ? "Esperando a que alguien hable."
            : "Pulsa Iniciar y reproduce la entrevista: el texto aparecerá aquí en inglés y en español."}
        </p>
      )}

      {c.lines.map((l) => (
        <Row key={l.id} en={l.en} es={l.es} />
      ))}
      {c.partial && <Row en={c.partial} es={c.partialEs} partial />}
      <div ref={end} style={{ gridColumn: "1 / -1" }} aria-hidden />
    </section>
  );
}

function Row({ en, es, partial }: { en: string; es: string; partial?: boolean }) {
  return (
    <>
      <p className="cell" lang="en" data-partial={partial ? "true" : undefined}>
        {en}
      </p>
      <p
        className="cell cell--es"
        lang="es"
        data-partial={partial ? "true" : undefined}
        data-pending={!es ? "true" : undefined}
      >
        {es || "…"}
      </p>
    </>
  );
}

function FocusPanel({ coach: c, onSettings }: { coach: Coach; onSettings: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const idx = picked === null || picked >= c.turns.length ? c.turns.length - 1 : picked;
  const turn: Turn | undefined = c.turns[idx];

  // Una pregunta nueva siempre pasa al frente.
  useEffect(() => {
    setPicked(null);
  }, [c.turns.length]);

  return (
    <section className="focus" aria-label="Pregunta y respuesta sugerida">
      {c.error && (
        <div className="alert" role="alert">
          <p>{c.error.message}</p>
          {c.error.kind === "invalid_key" && (
            <button type="button" className="btn" onClick={onSettings}>
              Abrir Ajustes
            </button>
          )}
          <button type="button" className="btn btn--quiet" onClick={c.dismissError}>
            Cerrar
          </button>
        </div>
      )}

      {!turn ? (
        <div className="empty">
          <p>
            {c.running
              ? "Cuando el entrevistador termine una pregunta, aparecerá aquí con su traducción y una respuesta sugerida."
              : "Aquí verás cada pregunta del entrevistador y la respuesta sugerida, lista para leer en voz alta."}
          </p>
          {!c.hasKey && (
            <>
              <p>Para generar respuestas necesitas tu propia clave gratuita de Gemini.</p>
              <button type="button" className="btn" onClick={onSettings}>
                <SettingsIcon size={18} aria-hidden /> Agregar clave en Ajustes
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <article className="ficha" aria-label={`Pregunta ${pad(turn.n)}`}>
            <div className="ficha__head">
              <p className="ficha__no">P-{pad(turn.n)}</p>
              <div className="ficha__nav">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Pregunta anterior"
                  disabled={idx <= 0}
                  onClick={() => setPicked(idx - 1)}
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Pregunta siguiente"
                  disabled={idx >= c.turns.length - 1}
                  onClick={() => setPicked(idx + 1)}
                >
                  <ChevronRight size={18} aria-hidden />
                </button>
              </div>
            </div>
            <p className="ficha__en" lang="en">
              {turn.en}
            </p>
            <p className="ficha__es" lang="es">
              {turn.es || "…"}
            </p>
          </article>

          <section className="answer" aria-label="Respuesta sugerida">
            <h2 className="answer__head">
              Respuesta sugerida
              {turn.answer && <span className="answer__meta">{wordCount(turn.answer)} palabras</span>}
            </h2>
            {turn.answer ? (
              <p className="answer__text" lang="en" aria-live="off">
                {withGaps(turn.answer)}
              </p>
            ) : turn.answering ? (
              <p className="hint">Preparando la respuesta…</p>
            ) : c.error && c.error.kind !== "audio" && c.error.kind !== "stt" ? (
              <p className="hint">
                No se pudo generar la respuesta. Cuando se resuelva, usa Responder última para reintentar.
              </p>
            ) : c.hasKey ? (
              <p className="hint">
                Esto no parece una pregunta. Si lo es, usa Responder última para generar la respuesta.
              </p>
            ) : (
              <div className="empty" style={{ padding: 0 }}>
                <p>Agrega tu clave de Gemini para recibir una respuesta sugerida.</p>
                <button type="button" className="btn" onClick={onSettings}>
                  <SettingsIcon size={18} aria-hidden /> Abrir Ajustes
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function Privacy() {
  return (
    <footer className="foot">
      <p>
        Privacidad: el audio y el texto pueden procesarse con servicios de Google (traducción y Gemini).
        Tu clave y tu perfil se guardan solo en este equipo.
      </p>
    </footer>
  );
}
