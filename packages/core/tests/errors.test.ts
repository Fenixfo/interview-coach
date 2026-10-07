import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "../src/errors";

describe("toApiError", () => {
  it("429 → quota", () => {
    const e = toApiError({ status: 429, message: "Too many" });
    expect(e.kind).toBe("quota");
    expect(e.message).toMatch(/cuota/i);
  });
  it("RESOURCE_EXHAUSTED → quota", () => {
    expect(toApiError(new Error("RESOURCE_EXHAUSTED: quota exceeded")).kind).toBe("quota");
  });
  it("clave inválida (400 con texto de API key)", () => {
    expect(toApiError({ status: 400, message: "API key not valid" }).kind).toBe("invalid_key");
  });
  it("403 → invalid_key", () => {
    expect(toApiError({ status: 403, message: "x" }).kind).toBe("invalid_key");
  });
  it("red", () => {
    expect(toApiError(new TypeError("Failed to fetch")).kind).toBe("network");
  });
  it("desconocido", () => {
    expect(toApiError("boom").kind).toBe("unknown");
  });
  it("no re-envuelve ApiError", () => {
    const a = new ApiError("quota", "x");
    expect(toApiError(a)).toBe(a);
  });
});
