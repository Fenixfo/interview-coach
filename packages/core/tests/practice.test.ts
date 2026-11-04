import { describe, expect, it } from "vitest";
import { answerFeedbackPrompt, contextQuestionsPrompt, parsePastedQuestions } from "../src/prompts";
import { sessionToMarkdown, suggestedFilename, type SessionRecord } from "../src/session";

describe("parsePastedQuestions", () => {
  it("quita viñetas, números y prefijos Q: y descarta líneas vacías", () => {
    const raw = "1. Tell me about yourself.\n- Why EPAM?\n\nQ3: What is ETL vs ELT?\r\n* How do you optimize a query?";
    expect(parsePastedQuestions(raw)).toEqual([
      "Tell me about yourself.",
      "Why EPAM?",
      "What is ETL vs ELT?",
      "How do you optimize a query?",
    ]);
  });

  it("no toca preguntas que empiezan con una palabra normal", () => {
    expect(parsePastedQuestions("Quick question: do you use dbt?")).toEqual(["Quick question: do you use dbt?"]);
  });
});

describe("prompts de práctica", () => {
  it("incluye el contexto y pide un arreglo JSON", () => {
    const p = contextQuestionsPrompt("  Data engineer at EPAM, Snowflake  ", 5);
    expect(p).toContain("Write 5");
    expect(p).toContain("Data engineer at EPAM, Snowflake");
    expect(p).toContain("JSON array");
  });

  it("el feedback lleva pregunta, respuesta y contexto solo si existe", () => {
    const withCtx = answerFeedbackPrompt("Why EPAM?", "Because I like it.", "Data role");
    expect(withCtx).toContain("QUESTION: Why EPAM?");
    expect(withCtx).toContain("ANSWER: Because I like it.");
    expect(withCtx).toContain("INTERVIEW CONTEXT");
    expect(answerFeedbackPrompt("Q", "A")).not.toContain("INTERVIEW CONTEXT");
    expect(answerFeedbackPrompt("Q", "  ")).toContain("ANSWER: (no answer)");
  });
});

describe("sesión de práctica", () => {
  const rec: SessionRecord = {
    id: "p",
    kind: "practice",
    startedAt: "2026-11-04T15:00:00Z",
    role: "Data engineer",
    turns: [{ question: "Why EPAM?", answer: "I like it.", feedback: "**Puntuación:** 3" }],
  };

  it("exporta la retroalimentación de cada pregunta", () => {
    const md = sessionToMarkdown(rec, "UTC");
    expect(md).toContain("# Práctica, 2026-11-04 15:00");
    expect(md).toContain("**Tu respuesta:**");
    expect(md).toContain("**Retroalimentación:**");
    expect(suggestedFilename(rec, "UTC")).toBe("entrevista-practica-2026-11-04.md");
  });
});
