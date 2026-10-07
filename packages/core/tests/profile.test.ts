import { describe, expect, it } from "vitest";
import { EMPTY_PROFILE, MAX_SUMMARY, profileToPromptText } from "../src/profile";

describe("profileToPromptText", () => {
  it("incluye el resumen del CV", () => {
    const t = profileToPromptText({ ...EMPTY_PROFILE, summary: "5 years in logistics" });
    expect(t).toContain("CV / personal summary: 5 years in logistics");
  });

  it("recorta resúmenes demasiado largos", () => {
    const t = profileToPromptText({ ...EMPTY_PROFILE, summary: "x".repeat(MAX_SUMMARY + 500) });
    expect(t.length).toBeLessThan(MAX_SUMMARY + 100);
  });
});
