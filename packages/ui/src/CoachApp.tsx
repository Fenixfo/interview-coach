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
import { SimulationView } from "./SimulationView";
import { HistoryView } from "./HistoryView";
import type { CoachServices, UpdateInfo } from "./types";

type View = "coach" | "sim" | "history" | "settings";

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
  const [view, setView] = useState<View>("coach");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const off = services.onUpdate?.(setUpdate);
    return () => {
      off?.();
    };
  }, [services]);

  if (!coach.loaded) return <div className="app" aria-busy="true" />;

  const toSettings = () => setView("settings");

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
        </>
      ) : (
        <>
          <Nav
            view={view}
            onView={setView}
            update={update}
            onInstall={() => void services.installUpdate?.()}
            liveRunning={coach.running}
          />
          {view === "coach" && (
            <div className="screen">
              <Toolbar
                coach={coach}
                sources={services.availableSources}
                canFloat={!!services.setFloating}
                transcriptOpen={transcriptOpen}
                onToggleTranscript={() => setTranscriptOpen((v) => !v)}
              />
              <main className="body">
                <LivePanel coach={coach} />
                <FocusPanel coach={coach} onSettings={toSettings} />
              </main>
            </div>
          )}
          {view === "sim" && (
            <SimulationView
              services={services}
              settings={coach.settings}
              defaultRole={coach.profile.targetRole}
              hasKey={coach.hasKey}
              blocked={coach.running}
              onSettings={toSettings}
            />
          )}
          {view === "history" && <HistoryView services={services} />}
        </>
      )}
      <Privacy />
    </div>
  );
}

function Nav(props: {
  view: View;
  onView: (v: View) => void;
  update: UpdateInfo | null;
  onInstall: () => void;
  liveRunning: boolean;
}) {
  const tabs: Array<[View, string]> = [
    ["coach", "En vivo"],
    ["sim", "Simulación"],
    ["history", "Historial"],
  ];
  return (
    <header className="nav">
      <div className="tabs" role="tablist" aria-label="Modo">
        {tabs.map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            className="tab"
            aria-selected={props.view === v}
            onClick={() => props.onView(v)}
          >
            {label}
            {v === "coach" && props.liveRunning && props.view !== "coach" && (
              <span className="tab__dot" role="img" aria-label="en curso" />
            )}
          </button>
        ))}
      </div>
      {props.update && (
        <div className="nav__update" role="status">
          {props.update.state === "downloaded" ? (
            <>
              <span>Versión {props.update.version} lista.</span>
              <button type="button" className="btn btn--sm" onClick={props.onInstall}>
                Reiniciar e instalar
              </button>
            </>
          ) : (
            <span>Descargando la versión {props.update.version}…</span>
          )}
        </div>
      )}
      <button
        type="button"
        className="btn btn--quiet nav__settings"
        onClick={() => props.onView("settings")}
        aria-label="Ajustes"
        title="Ajustes"
      >
        <SettingsIcon size={18} aria-hidden /> <span className="label">Ajustes</span>
      </button>
    </header>
  );
}

function Toolbar(props: {
  coach: Coach;
  sources: AudioSourceKind[];
  canFloat: boolean;
  transcriptOpen: boolean;
  onToggleTranscript: () => void;
}) {
  const { coach: c } = props;
  const model = c.modelStatus;
  return (
    <header className="bar">
      <div className="bar__status" role={c.error ? "alert" : "status"} aria-live="polite">
        {c.error ? (
          <>
            <span className="status__error" title={c.error.message}>
              {c.error.message}
            </span>
            <button type="button" className="btn btn--sm" onClick={c.dismissError}>
              Cerrar
            </button>
          </>
        ) : (
          <>
            <span className="dot" data-on={c.running && !c.myTurn} aria-hidden />
            <span>
              {model.state === "downloading"
                ? `Descargando el modelo de voz local… ${Math.round(model.percent)} %`
                : STATUS_TEXT[c.status]}
            </span>
          </>
        )}
      </div>

      <div className="bar__group bar__main">
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

      </div>

      <div className="bar__group bar__aux">
        <button
          type="button"
          className="btn"
          title="Limpiar la sesión"
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
          title="Mostrar u ocultar la transcripción"
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
          <article className="ficha" aria-label={`Pregunta P-${pad(turn.n)}`}>
            <p className="ficha__no" aria-hidden>
              <span className="ficha__p">P-</span>
              {pad(turn.n)}
            </p>
            <div className="ficha__body">
              <p className="ficha__en" lang="en">
                {turn.en}
              </p>
              <p className="ficha__es" lang="es">
                {turn.es || "…"}
              </p>
            </div>
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
          </article>

          <section className="answer" aria-label="Respuesta sugerida">
            <h2 className="sr-only">Respuesta sugerida</h2>
            {turn.answer ? (
              <p className="answer__text" lang="en" aria-live="off">
                {withGaps(turn.answer)}
              </p>
            ) : null}
            {turn.answer ? (
              <p className="answer__meta">{wordCount(turn.answer)} palabras</p>
            ) : turn.answering ? (
              <p className="hint">Preparando la respuesta…</p>
            ) : c.error && c.error.kind !== "audio" && c.error.kind !== "stt" ? (
              <p className="hint">
                {c.error.message} Cuando se resuelva, usa Responder última para reintentar.
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
