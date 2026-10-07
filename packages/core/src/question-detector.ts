const STARTERS = [
  "what", "why", "how", "when", "where", "who", "which",
  "tell me", "describe", "walk me through", "explain",
  "can you", "could you", "would you", "do you", "did you", "have you",
  "are you", "is there", "give me an example",
];

const STARTER_RE = new RegExp(
  `(^|[.!?]\\s+|\\b(?:so|and|okay|ok|now|well),?\\s+)(?:${STARTERS.join("|")})\\b`,
  "i",
);

/** Heurística barata: ¿el texto parece una pregunta del entrevistador? */
export function looksLikeQuestion(text: string): boolean {
  const t = text.trim();
  if (t.split(/\s+/).filter(Boolean).length < 3) return false;
  if (t.includes("?")) return true;
  return STARTER_RE.test(t);
}
