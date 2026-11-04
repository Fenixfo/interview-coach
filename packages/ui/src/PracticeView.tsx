import { useState } from "react";
import { Download, Mic, Play, RotateCcw, Send, Settings as SettingsIcon, SkipForward, Square } from "lucide-react";
import { sessionToMarkdown, suggestedFilename, type SessionRecord } from "@interview-coach/core";
import type { CoachServices, Settings } from "./types";
import { FeedbackText } from "./SimulationView";
import { usePractice, type PracticeSource } from "./usePractice";

const pad = (n: number) => String(n).padStart(2, "0");

export function PracticeView(props: {
  services: CoachServices;
  settings: Settings;
  hasKey: boolean;
  /** La sesión en vivo está usando el micrófono: no se puede dictar. */
  blocked: boolean;
  onSettings: () => void;
}) {
  const practice = usePractice(props.services, props.settings);
  const { state: s } = practice;
  const [source, setSource] = useState<PracticeSource>("context");
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [saved, setSaved] = useState<string | null>(null);

  if (!props.hasKey) {
    return (
      <main className="sim">
        <div className="empty">
          <p>
            La práctica usa Gemini para crear las preguntas y para analizar tus respuestas. Agrega tu clave
            gratuita en Ajustes para empezar.
          </p>
          <button type="button" className="btn" onClick={props.onSettings}>
            <SettingsIcon size={18} aria-hidden /> Agregar clave en Ajustes
          </button>
        </div>
      </main>
    );
  }

  if (s.phase === "setup") {
    const fromContext = source === "context";
    return (
      <main className="sim">
        <form
          className="sim__setup"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) void practice.start(source, text, count);
          }}
        >
          <h2>Práctica de preguntas</h2>
          <p className="hint">
            Responde pregunta por pregunta, escribiendo o dictando. Después de cada respuesta, Gemini analiza la
            pregunta y lo que contestaste, y te dice qué mejorar.
          </p>
          {s.error && (
            <p className="status__error status__error--block" role="alert">
              {s.error}
            </p>
          )}
          <div className="field">
            <span className="field__label" id="prac-source">
              Preguntas
            </span>
            <div className="tabs tabs--inline" role="radiogroup" aria-labelledby="prac-source">
              <button
                type="button"
                role="radio"
                className="tab"
                aria-checked={fromContext}
                aria-selected={fromContext}
                onClick={() => setSource("context")}
              >
                Generar desde el contexto
              </button>
              <button
                type="button"
                role="radio"
                className="tab"
                aria-checked={!fromContext}
                aria-selected={!fromContext}
                onClick={() => setSource("questions")}
              >
                Ya tengo las preguntas
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="prac-text">{fromContext ? "Contexto de la entrevista" : "Tus preguntas"}</label>
            <textarea
              id="prac-text"
              className="textarea"
              rows={fromContext ? 8 : 10}
              placeholder={
                fromContext
                  ? "Cargo, empresa, etapa (técnica, RR. HH.), tecnologías de la oferta, cosas que te dijo el reclutador…"
                  : "Una pregunta por línea. Se ignoran las viñetas y los números."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          {fromContext && (
            <div className="field">
              <label htmlFor="prac-count">Número de preguntas</label>
              <select
                id="prac-count"
                className="select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="row">
            <button type="submit" className="btn btn--primary" disabled={!text.trim()}>
              <Play size={18} aria-hidden /> Empezar práctica
            </button>
          </div>
        </form>
      </main>
    );
  }

  if (s.phase === "preparing") {
    return (
      <main className="sim">
        <div className="empty" role="status">
          <p>Preparando las preguntas…</p>
        </div>
      </main>
    );
  }

  if (s.phase === "done") {
    const rec: SessionRecord = {
      id: "export",
      kind: "practice",
      startedAt: new Date().toISOString(),
      role: s.title,
      turns: s.answers.map((answer, i) => ({
        question: s.questions[i] ?? "",
        answer,
        feedback: s.feedbacks[i] ?? "",
      })),
    };
    return (
      <main className="sim sim--done">
        <article className="sim__feedback">
          <h2>Práctica terminada</h2>
          <p className="hint">
            Respondiste {s.answers.length} {s.answers.length === 1 ? "pregunta" : "preguntas"}. La retroalimentación
            de cada una quedó guardada en el historial.
          </p>
          {s.answers.map((a, i) => (
            <section className="history__turn" key={i}>
              <h3>
                <span className="history__no">P-{pad(i + 1)}</span>
                <span lang="en">{s.questions[i]}</span>
              </h3>
              <p className="history__label">Tu respuesta</p>
              <p lang="en">{a}</p>
              <FeedbackText text={s.feedbacks[i] ?? ""} />
            </section>
          ))}
          <div className="row sim__actions">
            <button type="button" className="btn btn--primary" onClick={practice.reset}>
              <RotateCcw size={18} aria-hidden /> Nueva práctica
            </button>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const ok = await props.services.exportFile(suggestedFilename(rec), sessionToMarkdown(rec));
                setSaved(ok ? "Archivo guardado." : null);
              }}
            >
              <Download size={18} aria-hidden /> Exportar a Markdown
            </button>
            <span className="hint" role="status">
              {saved ?? ""}
            </span>
          </div>
        </article>
      </main>
    );
  }

  const last = s.index >= s.questions.length - 1;
  const reviewed = s.phase === "reviewed";
  const busy = s.phase === "evaluating";
  return (
    <main className="sim">
      <article className="ficha" aria-label={`Pregunta ${s.index + 1} de ${s.questions.length}`}>
        <p className="ficha__no" aria-hidden>
          <span className="ficha__p">P-</span>
          {pad(s.index + 1)}
        </p>
        <div className="ficha__body">
          <p className="ficha__en" lang="en">
            {practice.current}
          </p>
          <p className="ficha__es">
            Pregunta {s.index + 1} de {s.questions.length}
          </p>
        </div>
      </article>

      <section className="answer" aria-label="Tu respuesta">
        <h2 className="sr-only">Tu respuesta</h2>
        {s.error && (
          <p className="status__error status__error--block" role="alert">
            {s.error}
          </p>
        )}
        {reviewed ? (
          <>
            <p className="history__label">Tu respuesta</p>
            <p className="answer__text" lang="en">
              {s.answers[s.index]}
            </p>
            <FeedbackText text={s.feedbacks[s.index] ?? ""} />
            <div className="row sim__actions">
              <button type="button" className="btn btn--primary" onClick={practice.next}>
                <SkipForward size={18} aria-hidden /> {last ? "Ver resumen" : "Siguiente pregunta"}
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="hint" htmlFor="prac-answer">
              Responde en inglés. Puedes escribir o dictar con el micrófono y corregir antes de enviar.
            </label>
            <textarea
              id="prac-answer"
              className="textarea"
              lang="en"
              rows={7}
              value={s.draft}
              onChange={(e) => practice.setDraft(e.target.value)}
              disabled={busy}
              placeholder="Your answer…"
            />
            <div className="row sim__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void practice.submit()}
                disabled={busy || !s.draft.trim()}
              >
                <Send size={18} aria-hidden /> {busy ? "Analizando…" : "Enviar y recibir retroalimentación"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => void practice.toggleDictation()}
                disabled={busy || (props.blocked && !s.dictating)}
                aria-pressed={s.dictating}
                title={props.blocked ? "Pausa la sesión en vivo para dictar" : undefined}
              >
                {s.dictating ? <Square size={18} aria-hidden /> : <Mic size={18} aria-hidden />}{" "}
                {s.dictating ? "Detener dictado" : "Dictar"}
              </button>
              <button type="button" className="btn btn--quiet" onClick={practice.skip} disabled={busy}>
                <SkipForward size={18} aria-hidden /> Saltar
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
