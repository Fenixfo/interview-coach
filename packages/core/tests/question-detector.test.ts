import { describe, expect, it } from "vitest";
import { looksLikeQuestion } from "../src/question-detector";

describe("looksLikeQuestion", () => {
  it.each([
    "Tell me about yourself",
    "Why do you want to work here?",
    "Can you walk me through your last project",
    "Describe a time you handled conflict",
    "Okay, so how did you solve that problem",
    "You worked at Acme for two years, right?",
  ])("detecta pregunta: %s", (t) => expect(looksLikeQuestion(t)).toBe(true));

  it.each([
    "",
    "Thanks.",
    "Yes",
    "We are a growing company in fintech",
    "I am happy to be here today",
  ])("ignora no-pregunta: %s", (t) => expect(looksLikeQuestion(t)).toBe(false));
});
