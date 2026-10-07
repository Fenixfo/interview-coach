import { useCallback, useEffect, useRef, useState } from "react";
import {
  RollingTranscriber,
  feedbackPrompt,
  parseQuestionList,
  simulationQuestionsPrompt,
  toApiError,
  type SessionRecord,
} from "@interview-coach/core";
import type { CoachServices, Settings } from "./types";

export type SimPhase = "setup" | "preparing" | "asking" | "listening" | "evaluating" | "done";

export interface SimState {
  phase: SimPhase;
  role: string;
  questions: string[];
  index: number;
  answers: string[];
  /** Lo que lleva dicho el usuario en la pregunta actual (finales + parcial). */
  heard: string;
  partial: boolean;
  feedback: string;
  error: string | null;
}

const INITIAL: SimState = {
  phase: "setup",
  role: "",
  questions: [],
  index: 0,
  answers: [],
  heard: "",
  partial: false,
  feedback: "",
  error: null,
};

/** Pausa tras la última frase final que da por terminada la respuesta. */
const ANSWER_PAUSE_MS = 3500;

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!synth) return resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang === "en-US");
    if (voice) u.voice = voice;
    // Si la síntesis se atasca (sin voces instaladas, por ejemplo), seguimos igual.
    const safety = setTimeout(resolve, 4000 + text.length * 90);
    const done = () => {
      clearTimeout(safety);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  });
}

export function useSimulation(services: CoachServices, settings: Settings) {
  const [state, setState] = useState<SimState>(INITIAL);
  const ctl = useRef({
    run: 0,
    finish: null as null | (() => void),
    startedAt: "",
    id: "",
  });

  const patch = useCallback((p: Partial<SimState>) => setState((s) => ({ ...s, ...p })), []);

  /** Escucha la respuesta del usuario por micrófono hasta una pausa larga o hasta `finishAnswer()`. */
  const listen = useCallback(
    (token: number) =>
      new Promise<string>((resolve, reject) => {
        const finals: string[] = [];
        let partial = "";
        let lastFinalAt = 0;
        let stopAudio: (() => void) | null = null;
        let tick: ReturnType<typeof setInterval> | undefined;
        let settled = false;

        const rolling = new RollingTranscriber({
          transcribe: (pcm) => services.transcribe(pcm),
          onEvent: (e) => {
            if (token !== ctl.current.run) return;
            if (e.isFinal) {
              finals.push(e.text);
              partial = "";
              lastFinalAt = Date.now();
            } else {
              partial = e.text;
            }
            patch({ heard: [...finals, partial].filter(Boolean).join(" "), partial: partial !== "" });
          },
        });

        const done = () => {
          if (settled) return;
          settled = true;
          clearInterval(tick);
          stopAudio?.();
          ctl.current.finish = null;
          resolve([...finals, partial].filter(Boolean).join(" ").trim());
        };
        ctl.current.finish = done;

        services
          .startAudio("microphone", (pcm) => rolling.push(pcm, Date.now()))
          .then((stop) => {
            if (settled || token !== ctl.current.run) return stop();
            stopAudio = stop;
            tick = setInterval(() => {
              if (token !== ctl.current.run) return done();
              rolling.tick(Date.now()).catch(() => {});
              if (finals.length > 0 && Date.now() - lastFinalAt > ANSWER_PAUSE_MS) done();
            }, 1000);
          })
          .catch((err) => {
            settled = true;
            reject(err);
          });
      }),
    [services, patch],
  );

  const start = useCallback(
    async (role: string, count: number) => {
      const token = ++ctl.current.run;
      const alive = () => token === ctl.current.run;
      ctl.current.startedAt = new Date().toISOString();
      ctl.current.id = crypto.randomUUID();
      setState({ ...INITIAL, role, phase: "preparing" });

      try {
        const raw = await services.complete({
          prompt: simulationQuestionsPrompt(role, count),
          model: settings.model,
        });
        const questions = parseQuestionList(raw).slice(0, count);
        if (!alive()) return;
        if (questions.length === 0) {
          return patch({
            phase: "setup",
            error: "No se pudieron generar las preguntas. Inténtalo de nuevo.",
          });
        }
        const answers: string[] = [];
        patch({ questions, answers: [] });

        for (let i = 0; i < questions.length; i++) {
          if (!alive()) return;
          patch({ index: i, phase: "asking", heard: "", partial: false });
          await speak(questions[i] as string);
          if (!alive()) return;
          patch({ phase: "listening" });
          const answer = await listen(token);
          if (!alive()) return;
          answers.push(answer);
          patch({ answers: [...answers] });
        }
        await finish(token, role, questions, answers);
      } catch (err) {
        if (!alive()) return;
        const message =
          err instanceof Error && /Permission|NotAllowed|denied/i.test(err.message)
            ? "No hay permiso para usar el micrófono. Revisa los permisos de Windows."
            : toApiError(err).message;
        patch({ phase: "setup", error: message });
      }

      async function finish(tok: number, r: string, qs: string[], ans: string[]) {
        patch({ phase: "evaluating" });
        const turns = qs.slice(0, ans.length).map((question, i) => ({ question, answer: ans[i] ?? "" }));
        let feedback = "No registré ninguna respuesta, así que no hay retroalimentación. Prueba de nuevo.";
        if (turns.some((t) => t.answer.trim())) {
          try {
            feedback = (
              await services.complete({ prompt: feedbackPrompt(r, turns), model: settings.model })
            ).trim();
          } catch (err) {
            feedback = `No se pudo generar la retroalimentación: ${toApiError(err).message}`;
          }
        }
        if (tok !== ctl.current.run) return;
        const rec: SessionRecord = {
          id: ctl.current.id,
          kind: "simulation",
          startedAt: ctl.current.startedAt,
          role: r,
          turns,
          feedback,
        };
        await services.history.save(rec).catch(() => {});
        patch({ phase: "done", feedback });
      }
    },
    [services, settings.model, listen, patch],
  );

  const repeat = useCallback(() => {
    // Repite la pregunta en voz alta sin interrumpir la escucha.
    const q = state.questions[state.index];
    if (q) void speak(q);
  }, [state.questions, state.index]);

  const finishAnswer = useCallback(() => ctl.current.finish?.(), []);

  const stopAll = useCallback(() => {
    ctl.current.run++;
    window.speechSynthesis?.cancel();
    ctl.current.finish?.();
    setState(INITIAL);
  }, []);

  /** Termina antes de tiempo y pide retroalimentación con lo respondido hasta ahora. */
  const endEarly = useCallback(() => {
    const answers = state.answers;
    const questions = state.questions;
    const role = state.role;
    const heard = state.heard;
    ctl.current.run++;
    window.speechSynthesis?.cancel();
    ctl.current.finish?.();
    const all = heard.trim() ? [...answers, heard.trim()] : answers;
    const token = ++ctl.current.run;
    void (async () => {
      patch({ phase: "evaluating" });
      const turns = questions.slice(0, all.length).map((question, i) => ({ question, answer: all[i] ?? "" }));
      let feedback = "No registré ninguna respuesta, así que no hay retroalimentación.";
      if (turns.some((t) => t.answer.trim())) {
        try {
          feedback = (await services.complete({ prompt: feedbackPrompt(role, turns), model: settings.model })).trim();
        } catch (err) {
          feedback = `No se pudo generar la retroalimentación: ${toApiError(err).message}`;
        }
      }
      if (token !== ctl.current.run) return;
      await services.history
        .save({ id: ctl.current.id, kind: "simulation", startedAt: ctl.current.startedAt, role, turns, feedback })
        .catch(() => {});
      patch({ phase: "done", feedback });
    })();
  }, [state, services, settings.model, patch]);

  useEffect(
    () => () => {
      ctl.current.run++;
      window.speechSynthesis?.cancel();
      ctl.current.finish?.();
    },
    [],
  );

  return { state, start, repeat, finishAnswer, stopAll, endEarly, reset: stopAll };
}

export type Simulation = ReturnType<typeof useSimulation>;
