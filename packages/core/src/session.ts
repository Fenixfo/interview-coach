/** Registro de una sesión de práctica, guardado localmente y exportable a Markdown. */
export interface SessionTurn {
  question: string;
  /** Traducción al español de la pregunta (sesión en vivo). */
  translation?: string;
  /** En vivo: respuesta sugerida. En simulación: lo que dijo el usuario. */
  answer: string;
}

export interface SessionRecord {
  id: string;
  kind: "live" | "simulation";
  /** ISO 8601. */
  startedAt: string;
  /** Cargo practicado (simulación). */
  role?: string;
  turns: SessionTurn[];
  /** Retroalimentación en español (simulación). */
  feedback?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parts(iso: string, timeZone?: string) {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  });
  const get = (t: string) => f.formatToParts(d).find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function sessionTitle(rec: SessionRecord, timeZone?: string): string {
  const { date, time } = parts(rec.startedAt, timeZone);
  const kind = rec.kind === "simulation" ? "Simulación" : "Sesión en vivo";
  return `${kind}, ${date} ${time}`;
}

export function suggestedFilename(rec: SessionRecord, timeZone?: string): string {
  const { date } = parts(rec.startedAt, timeZone);
  return `entrevista-${rec.kind === "simulation" ? "simulacion" : "en-vivo"}-${date}.md`;
}

export function sessionToMarkdown(rec: SessionRecord, timeZone?: string): string {
  const out: string[] = [`# ${sessionTitle(rec, timeZone)}`, ""];
  if (rec.role) out.push(`**Cargo:** ${rec.role}`, "");
  rec.turns.forEach((t, i) => {
    out.push(`## P-${pad(i + 1)}`, "", `**Pregunta:** ${t.question.trim()}`, "");
    if (t.translation?.trim()) out.push(`**Traducción:** ${t.translation.trim()}`, "");
    const label = rec.kind === "simulation" ? "Tu respuesta" : "Respuesta sugerida";
    out.push(`**${label}:**`, "", t.answer.trim() ? t.answer.trim() : "_(sin respuesta)_", "");
  });
  if (rec.feedback?.trim()) out.push("## Retroalimentación", "", rec.feedback.trim(), "");
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Una sesión sin preguntas no vale la pena guardarla. */
export const isWorthSaving = (rec: SessionRecord): boolean => rec.turns.length > 0;
