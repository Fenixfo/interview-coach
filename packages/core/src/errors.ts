export type ApiErrorKind = "quota" | "invalid_key" | "network" | "unknown";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    /** Mensaje en español para el usuario. */
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  quota:
    "Se agotó la cuota gratuita de Gemini. Espera unos minutos o hasta mañana, o usa otro modelo en Ajustes.",
  invalid_key:
    "La clave de Gemini no es válida. Revísala en Ajustes o crea una nueva en Google AI Studio.",
  network: "No hay conexión con Gemini. Revisa tu internet e inténtalo de nuevo.",
  unknown: "Ocurrió un error inesperado al llamar a Gemini.",
};

function statusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { status?: unknown; code?: unknown };
  const s = typeof e.status === "number" ? e.status : e.code;
  return typeof s === "number" ? s : undefined;
}

/** Convierte cualquier error del SDK o de red en un ApiError con mensaje claro. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const status = statusOf(err);
  const text = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(text)) {
    return new ApiError("quota", MESSAGES.quota);
  }
  if (
    status === 401 ||
    status === 403 ||
    /API[_ ]KEY[_ ]INVALID|API key not valid|PERMISSION_DENIED/i.test(text) ||
    (status === 400 && /API key/i.test(text))
  ) {
    return new ApiError("invalid_key", MESSAGES.invalid_key);
  }
  if (/fetch failed|network|ENOTFOUND|ECONNRESET|Failed to fetch/i.test(text)) {
    return new ApiError("network", MESSAGES.network);
  }
  return new ApiError("unknown", MESSAGES.unknown);
}
