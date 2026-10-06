import { useState } from "react";
import { PROFILE_FIELDS, type AudioSourceKind, type EnglishLevel } from "@interview-coach/core";
import type { Coach } from "./useCoach";

const LEVELS: EnglishLevel[] = ["A2", "B1", "B2", "C1"];

export function SettingsView({ coach: c }: { coach: Coach }) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await c.saveKey(key);
      setKey("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <div className="settings__inner">
        <h2>Ajustes</h2>

        <section aria-labelledby="h-key">
          <h3 id="h-key">Clave de Gemini</h3>
          <div className="field">
            <label htmlFor="key">
              {c.hasKey ? "Clave guardada en este equipo" : "Pega tu clave"}
            </label>
            <div className="row">
              <input
                id="key"
                className="input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={c.hasKey ? "••••••••••••••••" : "AIza…"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <button type="button" className="btn btn--primary" disabled={!key.trim() || saving} onClick={save}>
                Guardar
              </button>
              {c.hasKey && (
                <button type="button" className="btn" onClick={() => void c.clearKey()}>
                  Quitar
                </button>
              )}
            </div>
            <span className="field__hint">
              Cada persona usa su propia clave gratuita, creada en Google AI Studio. Se cifra con el sistema
              operativo y nunca sale de este equipo salvo hacia Google.
            </span>
          </div>
        </section>

        <section aria-labelledby="h-audio">
          <h3 id="h-audio">Audio</h3>
          <div className="field">
            <label htmlFor="source">Fuente de audio</label>
            <select
              id="source"
              className="select"
              value={c.settings.audioSource}
              disabled={c.running}
              onChange={(e) => c.setSettings({ ...c.settings, audioSource: e.target.value as AudioSourceKind })}
            >
              <option value="system">Audio del sistema (YouTube, Zoom, Meet, Teams)</option>
              <option value="microphone">Micrófono</option>
            </select>
            <span className="field__hint">
              {c.running ? "Pausa la sesión para cambiarla." : "El audio del sistema es lo que oyes por tus altavoces o audífonos."}
            </span>
          </div>
        </section>

        <section aria-labelledby="h-resp">
          <h3 id="h-resp">Respuestas</h3>
          <div className="field">
            <label htmlFor="model">Modelo de Gemini</label>
            <input
              id="model"
              className="input"
              value={c.settings.model}
              onChange={(e) => c.setSettings({ ...c.settings, model: e.target.value })}
            />
            <span className="field__hint">
              Por defecto, el Flash-Lite vigente: tiene la cuota gratuita más amplia.
            </span>
          </div>
          <div className="field">
            <label htmlFor="level">Nivel de inglés de la respuesta</label>
            <select
              id="level"
              className="select"
              value={c.settings.level}
              onChange={(e) => c.setSettings({ ...c.settings, level: e.target.value as EnglishLevel })}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="silence">
              Pausa que cierra la pregunta: {(c.settings.silenceMs / 1000).toFixed(1)} s
            </label>
            <input
              id="silence"
              type="range"
              min={800}
              max={3000}
              step={100}
              value={c.settings.silenceMs}
              onChange={(e) => c.setSettings({ ...c.settings, silenceMs: Number(e.target.value) })}
            />
            <span className="field__hint">Se aplica la próxima vez que pulses Iniciar.</span>
          </div>
          <div className="field">
            <label className="check">
              <input
                type="checkbox"
                checked={c.settings.autoAnswer}
                onChange={(e) => c.setSettings({ ...c.settings, autoAnswer: e.target.checked })}
              />
              <span>
                Generar la respuesta sola cuando el texto parezca una pregunta
                <span className="field__hint" style={{ display: "block" }}>
                  Ahorra cuota: si lo desactivas, solo se llama a Gemini con Responder última.
                </span>
              </span>
            </label>
          </div>
        </section>

        <section aria-labelledby="h-perfil">
          <h3 id="h-perfil">Tu perfil profesional</h3>
          <p className="field__hint" style={{ marginTop: 0 }}>
            Las respuestas se basan solo en esto. Si falta un dato, verás un marcador como [número de
            clientes] en vez de una cifra inventada.
          </p>
          {PROFILE_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`p-${f.key}`}>{f.label}</label>
              {f.key === "targetRole" ? (
                <input
                  id={`p-${f.key}`}
                  className="input"
                  placeholder={f.hint}
                  value={c.profile[f.key]}
                  onChange={(e) => c.setProfile({ ...c.profile, [f.key]: e.target.value })}
                />
              ) : (
                <textarea
                  id={`p-${f.key}`}
                  className="textarea"
                  placeholder={f.hint}
                  value={c.profile[f.key]}
                  onChange={(e) => c.setProfile({ ...c.profile, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
