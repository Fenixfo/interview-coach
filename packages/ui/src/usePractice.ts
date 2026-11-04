import { useCallback, useEffect, useRef, useState } from "react";
import {
  RollingTranscriber,
  answerFeedbackPrompt,
  contextQuestionsPrompt,
  parsePastedQuestions,
  parseQuestionList,
  toApiError,
  type SessionRecord,
} from "@interview-coach/core";
import type { CoachServices, Settings } from "./types";

export type PracticePhase = "setup" | "preparing" | "answering" | "evaluating" | "reviewed" | "done";
export type PracticeSource = "context" | "questions";

export interface PracticeState {
  phase: PracticePhase;
  title: string;
  /** Contexto de la entrevista; vacío cuando el usuario pegó sus propias preguntas. */
  context: string;
  questions: string[];
  index: number;
  /** Respuestas ya evaluadas, una por pregunta. */
  answers: string[];
  feedbacks: string[];
  draft: string;
  dictating: boolean;
  error: string | null;
}

const INITIAL: PracticeState = {
  phase: "setup",
  title: "",
  context: "",
  questions: [],
  index: 0,
  answers: [],
  feedbacks: [],
  draft: "",
  dictating: false,
  error: null,
};

const MAX_QUESTIONS = 20;

export function usePractice(services: CoachServices, settings: Settings) {
  const [state, setState] = useState<PracticeState>(INITIAL);
  const ctl = useRef({
    run: 0,
    id: "",
    startedAt: "",
    stopDictation: null as null | (() => void),
  });

  const patch = useCallback((p: Partial<PracticeState>) => setState((s) => ({ ...s, ...p })), []);

  const stopDictation = useCallback(() => {
    ctl.current.stopDictation?.();
    ctl.current.stopDictation = null;
    patch({ dictating: false });
  }, [patch]);

  const start = useCallback(
    async (source: PracticeSource, text: string, count: number) => {
      const token = ++ctl.current.run;
      ctl.current.id = crypto.randomUUID();
      ctl.current.startedAt = new Date().toISOString();
      const input = text.trim();
      const title = input.split("\n")[0]?.slice(0, 80) ?? "";
      setState({ ...INITIAL, phase: "preparing", title, context: source === "context" ? input : "" });
      try {
        let questions: string[];
        if (source === "questions") {
          questions = parsePastedQuestions(input).slice(0, MAX_QUESTIONS);
        } else {
          const raw = await services.complete({
            prompt: contextQuestionsPrompt(input, count),
            model: settings.model,
          });
          questions = parseQuestionList(raw).slice(0, count);
        }
        if (token !== ctl.current.run) return;
        if (questions.length === 0) {
          return patch({
            phase: "setup",
            error:
              source === "questions"
                ? "No encontré preguntas en el texto. Escribe una por línea."
                : "No se pudieron generar las preguntas. Inténtalo de nuevo.",
          });
        }
        patch({ phase: "answering", questions });
      } catch (err) {
        if (token === ctl.current.run) patch({ phase: "setup", error: toApiError(err).message });
      }
    },
    [services, settings.model, patch],
  );

  const setDraft = useCallback((draft: string) => patch({ draft }), [patch]);

  /** Dicta la respuesta por micrófono; el texto se agrega al borrador y se puede corregir a mano. */
  const toggleDictation = useCallback(async () => {
    if (ctl.current.stopDictation) return stopDictation();
    const token = ctl.current.run;
    const finals: string[] = [];
    const base = state.draft.trim();
    const compose = (partial: string) => [base, ...finals, partial].filter(Boolean).join(" ");
    const rolling = new RollingTranscriber({
      transcribe: (pcm) => services.transcribe(pcm),
      onEvent: (e) => {
        if (token !== ctl.current.run) return;
        if (e.isFinal) finals.push(e.text);
        patch({ draft: compose(e.isFinal ? "" : e.text) });
      },
    });
    let tick: ReturnType<typeof setInterval> | undefined;
    patch({ dictating: true, error: null });
    try {
      const stopAudio = await services.startAudio("microphone", (pcm) => rolling.push(pcm, Date.now()));
      tick = setInterval(() => {
        if (token !== ctl.current.run) return stopDictation();
        rolling.tick(Date.now()).catch(() => {});
      }, 1000);
      ctl.current.stopDictation = () => {
        clearInterval(tick);
        stopAudio();
      };
    } catch (err) {
      clearInterval(tick);
      patch({
        dictating: false,
        error:
          err instanceof Error && /Permission|NotAllowed|denied/i.test(err.message)
            ? "No hay permiso para usar el micrófono. Revisa los permisos del navegador."
            : toApiError(err).message,
      });
    }
  }, [services, state.draft, patch, stopDictation]);

  const record = useCallback(
    (s: PracticeState, answers: string[], feedbacks: string[]): SessionRecord => ({
      id: ctl.current.id,
      kind: "practice",
      startedAt: ctl.current.startedAt,
      role: s.title,
      ...(s.context ? { context: s.context } : {}),
      turns: answers.map((answer, i) => ({
        question: s.questions[i] ?? "",
        answer,
        feedback: feedbacks[i] ?? "",
      })),
    }),
    [],
  );

  /** Analiza pregunta + respuesta y muestra la retroalimentación de esa pregunta. */
  const submit = useCallback(async () => {
    const s = state;
    const answer = s.draft.trim();
    if (!answer) return;
    stopDictation();
    const token = ++ctl.current.run;
    patch({ phase: "evaluating", error: null });
    let feedback: string;
    try {
      feedback = (
        await services.complete({
          prompt: answerFeedbackPrompt(s.questions[s.index] ?? "", answer, s.context),
          model: settings.model,
        })
      ).trim();
    } catch (err) {
      if (token === ctl.current.run) patch({ phase: "answering", error: toApiError(err).message });
      return;
    }
    if (token !== ctl.current.run) return;
    const answers = [...s.answers, answer];
    const feedbacks = [...s.feedbacks, feedback];
    await services.history.save(record(s, answers, feedbacks)).catch(() => {});
    patch({ phase: "reviewed", answers, feedbacks });
  }, [state, services, settings.model, patch, stopDictation, record]);

  const next = useCallback(() => {
    setState((s) =>
      s.index + 1 >= s.questions.length
        ? { ...s, phase: "done" }
        : { ...s, phase: "answering", index: s.index + 1, draft: "" },
    );
  }, []);

  /** Salta la pregunta actual sin responderla. */
  const skip = useCallback(() => {
    stopDictation();
    setState((s) => {
      const last = s.index + 1 >= s.questions.length;
      // Las preguntas saltadas se quitan: el historial solo lleva lo evaluado.
      const questions = s.questions.filter((_, i) => i !== s.index);
      if (questions.length === 0) return { ...INITIAL, error: "No quedan preguntas por responder." };
      return { ...s, questions, draft: "", phase: last ? "done" : s.phase };
    });
  }, [stopDictation]);

  const reset = useCallback(() => {
    ctl.current.run++;
    stopDictation();
    setState(INITIAL);
  }, [stopDictation]);

  useEffect(
    () => () => {
      ctl.current.run++;
      ctl.current.stopDictation?.();
    },
    [],
  );

  const current = state.questions[state.index] ?? "";
  return { state, current, start, setDraft, toggleDictation, submit, next, skip, reset };
}

export type Practice = ReturnType<typeof usePractice>;
