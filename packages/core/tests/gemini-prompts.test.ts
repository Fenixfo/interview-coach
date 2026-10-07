import { describe, expect, it } from "vitest";
import { GeminiClient, type GenAiLike } from "../src/gemini";
import { EMPTY_PROFILE } from "../src/profile";
import { answerSystemPrompt, parseQuestionList } from "../src/prompts";

function fakeClient(chunks: string[], fail?: unknown): GenAiLike {
  return {
    models: {
      async generateContentStream() {
        if (fail) throw fail;
        return (async function* () {
          for (const text of chunks) yield { text };
        })();
      },
    },
  };
}

describe("GeminiClient.stream", () => {
  it("entrega fragmentos y devuelve el texto completo", async () => {
    const c = new GeminiClient({ apiKey: "x", client: fakeClient(["I ", "led ", "a team."]) });
    const got: string[] = [];
    const full = await c.stream("q", (t) => got.push(t));
    expect(got).toEqual(["I ", "led ", "a team."]);
    expect(full).toBe("I led a team.");
  });

  it("convierte 429 en ApiError de cuota", async () => {
    const c = new GeminiClient({ apiKey: "x", client: fakeClient([], { status: 429, message: "x" }) });
    await expect(c.stream("q", () => {})).rejects.toMatchObject({ kind: "quota" });
  });

  it("convierte clave inválida en ApiError", async () => {
    const c = new GeminiClient({
      apiKey: "x",
      client: fakeClient([], { status: 400, message: "API key not valid. Please pass a valid API key." }),
    });
    await expect(c.stream("q", () => {})).rejects.toMatchObject({ kind: "invalid_key" });
  });
});

describe("prompts", () => {
  it("incluye el perfil y omite campos vacíos", () => {
    const p = { ...EMPTY_PROFILE, targetRole: "Data analyst", skills: "SQL" };
    const s = answerSystemPrompt(p, "B2");
    expect(s).toContain("Target role: Data analyst");
    expect(s).toContain("Skills: SQL");
    expect(s).not.toContain("Education:");
    expect(s).toContain("60 to 120 words");
    expect(s).toContain("[number of clients]");
  });

  it("parseQuestionList tolera bloques de código y basura", () => {
    expect(parseQuestionList('```json\n["A?", "B?"]\n```')).toEqual(["A?", "B?"]);
    expect(parseQuestionList("no json")).toEqual([]);
    expect(parseQuestionList('["ok", 3, ""]')).toEqual(["ok"]);
  });
});
