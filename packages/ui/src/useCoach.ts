import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiError,
  EMPTY_PROFILE,
  RollingTranscriber,
  TurnSegmenter,
  looksLikeQuestion,
  toApiError,
  type UserProfile,
} from "@interview-coach/core";
import {
  DEFAULT_SETTINGS,
  type CoachServices,
  type ModelStatus,
  type Settings,
} from "./types";

export interface Line {
  id: number;
  en: string;
  es: string;
}

export interface Turn {
  /** Número de ficha: P-01, P-02… */
  n: number;
  en: string;
  es: string;
  answer: string;
  answering: boolean;
}

export type Status = "idle" | "listening" | "hearing" | "paused";

export interface CoachError {
  kind: "quota" | "invalid_key" | "network" | "unknown" | "audio" | "stt";
  message: string;
}

export function useCoach(services: CoachServices) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [hasKey, setHasKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [myTurn, setMyTurn] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const [partialEs, setPartialEs] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<CoachError | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ state: "ready" });
  const [floating, setFloatingState] = useState(false);

  const sess = useRef<{ id: string; startedAt: string } | null>(null);

  const live = useRef({
    settings,
    profile,
    hasKey,
    myTurn: false,
    lineId: 0,
    turnN: 0,
    stop: null as null | (() => void),
    timer: 0 as unknown as ReturnType<typeof setInterval>,
    rolling: null as RollingTranscriber | null,
    segmenter: null as TurnSegmenter | null,
    abort: null as AbortController | null,
    partialTimer: 0 as unknown as ReturnType<typeof setTimeout>,
  });
  live.current.settings = settings;
  live.current.profile = profile;
  live.current.hasKey = hasKey;
  live.current.myTurn = myTurn;

  // Carga inicial.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, k] = await Promise.all([services.load(), services.key.has()]);
      if (!alive) return;
      if (p) {
        setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
        setProfile({ ...EMPTY_PROFILE, ...p.profile });
      }
      setHasKey(k);
      setLoaded(true);
    })();
    const off = services.onModelStatus?.(setModelStatus);
    return () => {
      alive = false;
      off?.();
    };
  }, [services]);

  // Guarda ajustes y perfil con retardo.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => void services.save({ settings, profile }), 400);
    return () => clearTimeout(t);
  }, [settings, profile, loaded, services]);

  // Cada sesión en vivo con al menos una pregunta se guarda sola en el historial local.
  useEffect(() => {
    if (turns.length === 0) {
      sess.current = null;
      return;
    }
    sess.current ??= { id: crypto.randomUUID(), startedAt: new Date().toISOString() };
    if (turns.some((t) => t.answering)) return;
    const rec = {
      id: sess.current.id,
      kind: "live" as const,
      startedAt: sess.current.startedAt,
      turns: turns.map((t) => ({ question: t.en, translation: t.es, answer: t.answer })),
    };
    const timer = setTimeout(() => void services.history.save(rec).catch(() => {}), 800);
    return () => clearTimeout(timer);
  }, [turns, services]);

  const fail = useCallback((err: unknown) => {
    const e = err instanceof ApiError ? err : toApiError(err);
    setError({ kind: e.kind, message: e.message });
  }, []);

  const generate = useCallback(
    async (n: number, question: string) => {
      const l = live.current;
      l.abort?.abort();
      const ctl = new AbortController();
      l.abort = ctl;
      setError(null);
      setTurns((ts) => ts.map((t) => (t.n === n ? { ...t, answer: "", answering: true } : t)));
      try {
        await services.streamAnswer(
          { question, profile: l.profile, settings: l.settings },
          (chunk) =>
            setTurns((ts) => ts.map((t) => (t.n === n ? { ...t, answer: t.answer + chunk } : t))),
          ctl.signal,
        );
      } catch (err) {
        if (!ctl.signal.aborted) fail(err);
      } finally {
        setTurns((ts) => ts.map((t) => (t.n === n ? { ...t, answering: false } : t)));
      }
    },
    [services, fail],
  );

  const onTurn = useCallback(
    (text: string) => {
      const l = live.current;
      const n = ++l.turnN;
      setTurns((ts) => [...ts, { n, en: text, es: "", answer: "", answering: false }]);
      services
        .translate(text, { final: true })
        .then((es) => setTurns((ts) => ts.map((t) => (t.n === n ? { ...t, es } : t))))
        .catch(() => {});
      if (l.settings.autoAnswer && l.hasKey && looksLikeQuestion(text)) void generate(n, text);
    },
    [services, generate],
  );

  const onTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      const l = live.current;
      l.segmenter?.push(text, isFinal);
      if (isFinal) {
        const id = ++l.lineId;
        setLines((ls) => [...ls, { id, en: text, es: "" }]);
        setPartial("");
        setPartialEs("");
        services
          .translate(text, { final: true })
          .then((es) => setLines((ls) => ls.map((x) => (x.id === id ? { ...x, es } : x))))
          .catch(() => {});
      } else {
        setPartial(text);
        clearTimeout(l.partialTimer);
        l.partialTimer = setTimeout(() => {
          services
            .translate(text, { final: false })
            .then(setPartialEs)
            .catch(() => {});
        }, 1200);
      }
    },
    [services],
  );

  const stop = useCallback(() => {
    const l = live.current;
    clearInterval(l.timer);
    clearTimeout(l.partialTimer);
    l.stop?.();
    l.stop = null;
    l.rolling?.reset();
    l.segmenter?.flush();
    setRunning(false);
    setHearing(false);
    setPartial("");
    setPartialEs("");
  }, []);

  const start = useCallback(async () => {
    const l = live.current;
    setError(null);
    l.segmenter = new TurnSegmenter(onTurn, { silenceMs: l.settings.silenceMs });
    l.rolling = new RollingTranscriber({
      transcribe: (pcm) => services.transcribe(pcm),
      onEvent: (e) => onTranscript(e.text, e.isFinal),
    });
    try {
      l.stop = await services.startAudio(l.settings.audioSource, (pcm) => {
        if (l.myTurn) return;
        l.rolling?.push(pcm, Date.now());
      });
    } catch (err) {
      const message =
        err instanceof Error && /Permission|NotAllowed|denied/i.test(err.message)
          ? "No hay permiso para capturar audio. Revisa los permisos de Windows."
          : "No se pudo iniciar la captura de audio. Prueba con otra fuente en Ajustes.";
      setError({ kind: "audio", message });
      return;
    }
    l.timer = setInterval(() => {
      l.rolling?.tick(Date.now()).catch((err) => {
        setError({
          kind: "stt",
          message: err instanceof Error ? err.message : "Falló la transcripción local.",
        });
      });
    }, 1000);
    setRunning(true);
  }, [services, onTurn, onTranscript]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // El indicador "oyendo" sigue al texto parcial.
  useEffect(() => {
    setHearing(running && partial.length > 0);
  }, [running, partial]);

  const toggleRunning = useCallback(() => (running ? stop() : void start()), [running, start, stop]);

  const toggleMyTurn = useCallback(() => {
    setMyTurn((v) => {
      const next = !v;
      if (next) {
        live.current.rolling?.reset();
        live.current.segmenter?.flush();
        setPartial("");
        setPartialEs("");
      }
      return next;
    });
  }, []);

  const answerLast = useCallback(() => {
    const l = live.current;
    l.segmenter?.flush();
    setTurns((ts) => {
      const last = ts[ts.length - 1];
      if (last) queueMicrotask(() => void generate(last.n, last.en));
      return ts;
    });
  }, [generate]);

  const clear = useCallback(() => {
    const l = live.current;
    l.abort?.abort();
    l.rolling?.reset();
    l.segmenter?.reset();
    l.turnN = 0;
    l.lineId = 0;
    setLines([]);
    setTurns([]);
    setPartial("");
    setPartialEs("");
    setError(null);
  }, []);

  const setFloating = useCallback(
    (on: boolean) => {
      setFloatingState(on);
      void services.setFloating?.(on);
    },
    [services],
  );

  const saveKey = useCallback(
    async (key: string) => {
      await services.key.set(key.trim());
      setHasKey(true);
      setError(null);
    },
    [services],
  );

  const clearKey = useCallback(async () => {
    await services.key.clear();
    setHasKey(false);
  }, [services]);

  const status: Status = !running ? "idle" : myTurn ? "paused" : hearing ? "hearing" : "listening";

  return useMemo(
    () => ({
      settings,
      setSettings,
      profile,
      setProfile,
      hasKey,
      saveKey,
      clearKey,
      loaded,
      running,
      toggleRunning,
      myTurn,
      toggleMyTurn,
      answerLast,
      clear,
      lines,
      partial,
      partialEs,
      turns,
      error,
      dismissError: () => setError(null),
      modelStatus,
      floating,
      setFloating,
      status,
      canAnswer: turns.length > 0 && hasKey,
    }),
    [
      settings, profile, hasKey, saveKey, clearKey, loaded, running, toggleRunning, myTurn,
      toggleMyTurn, answerLast, clear, lines, partial, partialEs, turns, error, modelStatus,
      floating, setFloating, status,
    ],
  );
}

export type Coach = ReturnType<typeof useCoach>;
