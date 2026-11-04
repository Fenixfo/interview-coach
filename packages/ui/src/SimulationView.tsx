import { useEffect, useState, type ReactNode } from "react";
import { Download, Play, RotateCcw, Settings as SettingsIcon, Flag, SkipForward } from "lucide-react";
import { sessionToMarkdown, suggestedFilename, type SessionRecord } from "@interview-coach/core";
import type { CoachServices, Settings } from "./types";
import { lengthTier } from "./lengthTier";
import { useSimulation } from "./useSimulation";

const pad = (n: number) => String(n).padStart(2, "0");

/** Gemini a veces escribe flechas en LaTeX ($\rightarrow$); se muestran como símbolos. */
const unLatex = (t: string) =>
  t
    .replace(/\$\s*\\(?:rightarrow|to)\s*\$/g, "→")
    .replace(/\$\s*\\leftarrow\s*\$/g, "←")
    .replace(/\$\s*\\Rightarrow\s*\$/g, "⇒")
    .replace(/\s-+>\s/g, " → ");

/** Convierte **negritas** y *cursivas* en <strong> y <em> sin usar HTML crudo. */
function inline(text: string): ReactNode[] {
  return unLatex(text)
    .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
    .map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i}>{p.slice(2, -2)}</strong>
      ) : p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
        <em key={i}>{p.slice(1, -1)}</em>
      ) : (
        p
      ),
    );
}

const BULLET = /^\s*(?:[-*•])\s+/;

/** La retroalimentación llega en texto con secciones numeradas; se muestra como párrafos y títulos. */
export function FeedbackText({ text }: { text: string }) {
  const lines = text
    .replace(/^#+\s*/gm, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nodes: ReactNode[] = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i] ?? "";
    if (BULLET.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET.test(lines[i] ?? "")) items.push((lines[i++] ?? "").replace(BULLET, ""));
      nodes.push(
        <ul key={nodes.length}>
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>,
      );
    } else if (/^(\d+\.\s+)?\*\*[^*]+\*\*:?$/.test(line)) {
      nodes.push(<h3 key={nodes.length}>{inline(line.replace(/^\d+\.\s+/, ""))}</h3>);
      i++;
    } else {
      nodes.push(<p key={nodes.length}>{inline(line)}</p>);
      i++;
    }
  }
  return <div className="feedback">{nodes}</div>;
}

export function SimulationView(props: {
  services: CoachServices;
  settings: Settings;
  defaultRole: string;
  hasKey: boolean;
  /** La sesión en vivo está activa: no se puede usar el micrófono para simular. */
  blocked: boolean;
  onSettings: () => void;
}) {
  const sim = useSimulation(props.services, props.settings);
  const { state: s } = sim;
  const [role, setRole] = useState(props.defaultRole);
  const [count, setCount] = useState(5);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setRole((r) => r || props.defaultRole);
  }, [props.defaultRole]);

  if (!props.hasKey) {
    return (
      <main className="sim">
        <div className="empty">
          <p>
            La simulación usa Gemini para crear las preguntas y para evaluar tu inglés. Agrega tu clave
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
    return (
      <main className="sim">
        <form
          className="sim__setup"
          onSubmit={(e) => {
            e.preventDefault();
            if (role.trim()) void sim.start(role.trim(), count);
          }}
        >
          <h2>Simulación de entrevista</h2>
          <p className="hint">
            Gemini te hará preguntas para el cargo que escribas, escuchará tu respuesta por el
            micrófono y pasas a la siguiente pregunta cuando tú lo decidas. Al final recibes retroalimentación sobre tu inglés: gramática,
            vocabulario y claridad.
          </p>
          {props.blocked && (
            <p className="status__error status__error--block" role="status">
              Pausa la sesión en vivo antes de empezar una simulación.
            </p>
          )}
          {s.error && (
            <p className="status__error status__error--block" role="alert">
              {s.error}
            </p>
          )}
          <div className="field">
            <label htmlFor="sim-role">Cargo</label>
            <input
              id="sim-role"
              className="input"
              placeholder="Ej.: Analista de datos junior"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sim-count">Número de preguntas</label>
            <select
              id="sim-count"
              className="select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[3, 5, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <button type="submit" className="btn btn--primary" disabled={!role.trim() || props.blocked}>
              <Play size={18} aria-hidden /> Comenzar simulación
            </button>
          </div>
        </form>
      </main>
    );
  }

  if (s.phase === "preparing" || s.phase === "evaluating") {
    return (
      <main className="sim">
        <div className="empty" role="status">
          <p>
            {s.phase === "preparing"
              ? "Preparando las preguntas para el cargo…"
              : "Preparando la retroalimentación…"}
          </p>
        </div>
      </main>
    );
  }

  if (s.phase === "done") {
    const rec: SessionRecord = {
      id: "export",
      kind: "simulation",
      startedAt: new Date().toISOString(),
      role: s.role,
      turns: s.questions.slice(0, s.answers.length).map((question, i) => ({ question, answer: s.answers[i] ?? "" })),
      feedback: s.feedback,
    };
    return (
      <main className="sim sim--done">
        <article className="sim__feedback">
          <h2>Retroalimentación</h2>
          <FeedbackText text={s.feedback} />
          <div className="row sim__actions">
            <button type="button" className="btn btn--primary" onClick={sim.reset}>
              <RotateCcw size={18} aria-hidden /> Nueva simulación
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
              {saved ?? "Esta sesión quedó guardada en el historial."}
            </span>
          </div>
        </article>
      </main>
    );
  }

  const last = s.index >= s.questions.length - 1;
  return (
    <main className="sim">
      <article className="ficha" aria-label={`Pregunta ${s.index + 1} de ${s.questions.length}`}>
        <p className="ficha__no" aria-hidden>
          <span className="ficha__p">P-</span>
          {pad(s.index + 1)}
        </p>
        <div className="ficha__body">
          <p className="ficha__en" lang="en">
            {s.questions[s.index]}
          </p>
          <p className="ficha__es">
            Pregunta {s.index + 1} de {s.questions.length}
          </p>
        </div>
      </article>

      <section className="answer" aria-label="Tu respuesta">
        <h2 className="sr-only">Tu respuesta</h2>
        <p className="hint" role="status">
          Te escucho. Cuando termines, pulsa «{last ? "Terminar y ver retroalimentación" : "Siguiente pregunta"}».
        </p>
        {s.heard && (
          <p className="answer__text" lang="en" data-partial={s.partial ? "true" : undefined} data-len={lengthTier(s.heard)}>
            {s.heard}
          </p>
        )}
        <div className="row sim__actions">
          <button type="button" className="btn btn--primary" onClick={sim.finishAnswer}>
            <SkipForward size={18} aria-hidden /> {last ? "Terminar y ver retroalimentación" : "Siguiente pregunta"}
          </button>
          <button type="button" className="btn btn--quiet" onClick={sim.endEarly}>
            <Flag size={18} aria-hidden /> Terminar ahora
          </button>
        </div>
      </section>
    </main>
  );
}
