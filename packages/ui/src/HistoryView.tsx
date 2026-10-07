import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import {
  sessionTitle,
  sessionToMarkdown,
  suggestedFilename,
  type SessionRecord,
} from "@interview-coach/core";
import type { CoachServices } from "./types";
import { FeedbackText } from "./SimulationView";

const pad = (n: number) => String(n).padStart(2, "0");

export function HistoryView({ services }: { services: CoachServices }) {
  const [items, setItems] = useState<SessionRecord[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const reload = useCallback(async () => {
    setItems(await services.history.list());
  }, [services]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (items === null) return <main className="history" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <main className="history">
        <div className="empty">
          <p>
            Aún no hay sesiones guardadas. Cada práctica en vivo o simulación con al menos una pregunta se
            guarda aquí, solo en este equipo.
          </p>
        </div>
      </main>
    );
  }

  const open = items.find((r) => r.id === openId) ?? null;

  return (
    <main className="history" data-open={open ? "true" : "false"}>
      <nav className="history__list" aria-label="Sesiones guardadas">
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="history__item"
                aria-current={r.id === openId ? "true" : undefined}
                onClick={() => {
                  setOpenId(r.id);
                  setNote("");
                }}
              >
                <span className="history__title">{sessionTitle(r)}</span>
                <span className="history__meta">
                  {r.role ? `${r.role} · ` : ""}
                  {r.turns.length} {r.turns.length === 1 ? "pregunta" : "preguntas"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="history__detail" aria-label="Detalle de la sesión">
        {!open ? (
          <p className="hint history__hint">Elige una sesión para verla.</p>
        ) : (
          <article>
            <div className="row history__bar">
              <button type="button" className="btn btn--quiet only-compact" onClick={() => setOpenId(null)}>
                <ArrowLeft size={18} aria-hidden /> Volver
              </button>
              <h2>{sessionTitle(open)}</h2>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  const ok = await services.exportFile(suggestedFilename(open), sessionToMarkdown(open));
                  setNote(ok ? "Archivo guardado." : "");
                }}
              >
                <Download size={18} aria-hidden /> Exportar a Markdown
              </button>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await services.history.remove(open.id);
                  setOpenId(null);
                  await reload();
                }}
              >
                <Trash2 size={18} aria-hidden /> Eliminar
              </button>
            </div>
            {note && (
              <p className="hint" role="status">
                {note}
              </p>
            )}
            {open.role && <p className="hint">Cargo: {open.role}</p>}
            {open.turns.map((t, i) => (
              <section className="history__turn" key={i}>
                <h3>
                  <span className="history__no">P-{pad(i + 1)}</span>
                  <span lang="en">{t.question}</span>
                </h3>
                {t.translation && <p className="history__es">{t.translation}</p>}
                <p className="history__label">{open.kind === "simulation" ? "Tu respuesta" : "Respuesta sugerida"}</p>
                <p lang="en">{t.answer || "(sin respuesta)"}</p>
              </section>
            ))}
            {open.feedback && (
              <section className="history__turn">
                <h3>Retroalimentación</h3>
                <FeedbackText text={open.feedback} />
              </section>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
