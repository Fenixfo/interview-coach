import { profileToPromptText, type UserProfile } from "./profile";

export type EnglishLevel = "A2" | "B1" | "B2" | "C1";

const LEVEL_NOTES: Record<EnglishLevel, string> = {
  A2: "very simple words and short sentences",
  B1: "common everyday words and short-to-medium sentences",
  B2: "simple, clear vocabulary; avoid rare idioms and jargon",
  C1: "natural professional vocabulary",
};

export function answerSystemPrompt(profile: UserProfile, level: EnglishLevel = "B2"): string {
  return [
    "You help a Spanish-speaking candidate answer a job interview question in English.",
    "Write the answer in the first person, as if the candidate were speaking.",
    "Length: 60 to 120 words. No headings, no bullet points, no preamble.",
    `Language level ${level}: use ${LEVEL_NOTES[level]}.`,
    "For behavioral questions (past situations, 'tell me about a time...'), follow the STAR method",
    "(Situation, Task, Action, Result) in natural spoken sentences, without labeling the parts.",
    "Base every fact on the candidate profile below. Never invent facts, names, employers or numbers.",
    "If a needed detail is missing from the profile, insert a short placeholder in square brackets,",
    "for example [number of clients] or [name of the company].",
    "",
    "CANDIDATE PROFILE",
    profileToPromptText(profile),
  ].join("\n");
}

export function answerUserPrompt(question: string): string {
  return `Interview question: "${question.trim()}"`;
}

export function translationPrompt(text: string): string {
  return [
    "Translate the following English text to natural Spanish.",
    "Reply with the translation only, no quotes or comments.",
    "",
    text,
  ].join("\n");
}

export function simulationQuestionsPrompt(role: string, count: number): string {
  return [
    `Write ${count} realistic job interview questions in English for the role: ${role}.`,
    "Mix behavioral and role-specific questions, from easier to harder.",
    "Return only a JSON array of strings, with no extra text.",
  ].join("\n");
}

export interface SimulationTurn {
  question: string;
  answer: string;
}

export function feedbackPrompt(role: string, turns: SimulationTurn[]): string {
  const transcript = turns
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer.trim() || "(no answer)"}`)
    .join("\n\n");
  return [
    `A Spanish-speaking candidate practiced an interview for the role: ${role}.`,
    "Answers are speech transcripts, so ignore punctuation and capitalization.",
    "Write the feedback IN SPANISH, quoting short English examples where useful. Structure:",
    "1. Resumen general (2-3 frases).",
    "2. Gramática: errores concretos con la corrección.",
    "3. Vocabulario: palabras o frases a mejorar y alternativas.",
    "4. Claridad y estructura de las respuestas.",
    "5. Tres prácticas recomendadas para mejorar.",
    "",
    transcript,
  ].join("\n");
}

/** Extrae un arreglo de preguntas de la respuesta del modelo (tolera ```json ... ```). */
export function parseQuestionList(raw: string): string[] {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  try {
    const data: unknown = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(data)
      ? data.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}
