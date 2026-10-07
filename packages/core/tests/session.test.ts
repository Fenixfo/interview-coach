import { describe, expect, it } from "vitest";
import {
  isWorthSaving,
  sessionToMarkdown,
  suggestedFilename,
  type SessionRecord,
} from "../src/session";

const live: SessionRecord = {
  id: "a",
  kind: "live",
  startedAt: "2026-10-06T19:30:00Z",
  turns: [
    {
      question: "Tell me about yourself.",
      translation: "Cuéntame sobre ti.",
      answer: "I am an engineer with [years] years of experience.",
    },
    { question: "Why this job?", translation: "", answer: "" },
  ],
};

describe("sessionToMarkdown", () => {
  it("exporta una sesión en vivo con preguntas, traducción y respuesta", () => {
    const md = sessionToMarkdown(live, "UTC");
    expect(md).toContain("# Sesión en vivo, 2026-10-06 19:30");
    expect(md).toContain("## P-01");
    expect(md).toContain("**Traducción:** Cuéntame sobre ti.");
    expect(md).toContain("**Respuesta sugerida:**");
    expect(md).toContain("[years]");
    expect(md).toContain("## P-02");
    expect(md).toContain("_(sin respuesta)_");
    expect(md).not.toMatch(/\n{3,}/);
  });

  it("exporta una simulación con cargo y retroalimentación", () => {
    const md = sessionToMarkdown(
      {
        id: "b",
        kind: "simulation",
        startedAt: "2026-10-06T19:30:00Z",
        role: "Data analyst",
        turns: [{ question: "What is SQL?", answer: "It is a language for data." }],
        feedback: "Buen trabajo.",
      },
      "UTC",
    );
    expect(md).toContain("# Simulación, 2026-10-06 19:30");
    expect(md).toContain("**Cargo:** Data analyst");
    expect(md).toContain("**Tu respuesta:**");
    expect(md).toContain("## Retroalimentación\n\nBuen trabajo.");
  });
});

describe("suggestedFilename / isWorthSaving", () => {
  it("nombra el archivo por tipo y fecha", () => {
    expect(suggestedFilename(live, "UTC")).toBe("entrevista-en-vivo-2026-10-06.md");
    expect(suggestedFilename({ ...live, kind: "simulation" }, "UTC")).toBe(
      "entrevista-simulacion-2026-10-06.md",
    );
  });
  it("no guarda sesiones vacías", () => {
    expect(isWorthSaving({ ...live, turns: [] })).toBe(false);
    expect(isWorthSaving(live)).toBe(true);
  });
});
