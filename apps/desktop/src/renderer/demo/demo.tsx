// Harness solo para desarrollo (http://localhost:5173/demo/demo.html): servicios simulados con
// datos sintéticos, para ver todos los estados de la pantalla sin audio, clave ni red.
import "@fontsource-variable/public-sans/index.css";
import "@interview-coach/ui/src/styles.css";
import { createRoot } from "react-dom/client";
import { ApiError, type SessionRecord } from "@interview-coach/core";
import { CoachApp, DEFAULT_SETTINGS, type CoachServices } from "@interview-coach/ui";

const q = new URLSearchParams(location.search);
const hasKey = q.get("key") !== "0";
const fail = q.get("fail"); // quota | invalid_key

const QUESTION =
  "Tell me about a time you led a project under a tight deadline. What was the result?";
const QUESTION_ES =
  "Cuéntame sobre una ocasión en la que lideraste un proyecto con una fecha límite ajustada. ¿Cuál fue el resultado?";
const ANSWER =
  "Last year I led a small team that had to launch a customer portal in six weeks. My task was to keep the project on track while we served [number of clients] clients. I split the work into weekly goals, ran a short daily check-in, and cut two features that were not essential. We launched on time, and support calls dropped by [percentage] in the first month. I learned that clear priorities matter more than long hours.";

const MY_ANSWER =
  "I led a small team and we finished the portal on time because we cut two features and checked our progress every day.";
const FEEDBACK = [
  "1. **Resumen general**",
  "Tus respuestas son claras y tienen estructura. Con un poco más de detalle sonarás más seguro.",
  "2. **Gramática**",
  "Dijiste \"we finished the portal on time because we cut\": está bien. Cuida el uso de \"did\" en preguntas.",
  "3. **Vocabulario**",
  "Cambia \"cut features\" por \"reduced the scope\" para sonar más profesional.",
  "4. **Claridad y estructura**",
  "Cierra cada respuesta con el resultado y una cifra concreta.",
  "5. **Tres prácticas recomendadas**",
  "Practica la respuesta en voz alta, grábate y repite la misma pregunta con otro ejemplo.",
].join("\n\n");
let mode: "question" | "answer" = "question";
const seed: SessionRecord[] = [
  {
    id: "s1",
    kind: "simulation",
    startedAt: "2026-10-05T20:10:00Z",
    role: "Project coordinator",
    turns: [
      { question: "Tell me about yourself.", answer: "I am an industrial engineer with four years of experience in logistics." },
      { question: "Describe a conflict you solved.", answer: MY_ANSWER },
    ],
    feedback: FEEDBACK,
  },
  {
    id: "s2",
    kind: "live",
    startedAt: "2026-10-04T15:00:00Z",
    turns: [{ question: QUESTION, translation: QUESTION_ES, answer: ANSWER }],
  },
];

const services: CoachServices = {
  async complete({ prompt }) {
    await new Promise((r) => setTimeout(r, 400));
    if (fail === "quota") throw new ApiError("quota", "Se agotó la cuota gratuita de Gemini. Espera unos minutos o hasta mañana, o usa otro modelo en Ajustes.");
    if (/JSON array/.test(prompt)) {
      return JSON.stringify([
        "Tell me about yourself.",
        "Describe a time you handled a difficult stakeholder.",
        "How do you prioritize when everything is urgent?",
      ]);
    }
    return FEEDBACK;
  },
  history: {
    list: async () => [...seed],
    save: async (rec) => {
      const i = seed.findIndex((r) => r.id === rec.id);
      if (i >= 0) seed[i] = rec;
      else seed.unshift(rec);
    },
    remove: async (id) => {
      const i = seed.findIndex((r) => r.id === id);
      if (i >= 0) seed.splice(i, 1);
    },
  },
  exportFile: async () => true,
  availableSources: ["system", "microphone"],
  async startAudio(source, onChunk) {
    mode = source === "microphone" ? "answer" : "question";
    const t0 = Date.now();
    const id = setInterval(() => {
      const loud = Date.now() - t0 < (mode === "answer" ? 6000 : 7000);
      onChunk(new Float32Array(1600).fill(loud ? 0.2 : 0.001));
    }, 100);
    return () => clearInterval(id);
  },
  async transcribe(pcm) {
    const words = (mode === "answer" ? MY_ANSWER : QUESTION).split(" ");
    const n = Math.min(words.length, Math.max(3, Math.round((pcm.length / 16000) * 2.4)));
    return words.slice(0, n).join(" ");
  },
  async translate(text) {
    await new Promise((r) => setTimeout(r, 300));
    return text.split(" ").length >= 14 ? QUESTION_ES : "Cuéntame sobre una ocasión en la que lideraste…";
  },
  async streamAnswer(_req, onChunk) {
    if (fail === "quota") throw new ApiError("quota", "Se agotó la cuota gratuita de Gemini. Espera unos minutos o hasta mañana, o usa otro modelo en Ajustes.");
    if (fail === "invalid_key") throw new ApiError("invalid_key", "La clave de Gemini no es válida. Revísala en Ajustes o crea una nueva en Google AI Studio.");
    for (const w of ANSWER.split(" ")) {
      await new Promise((r) => setTimeout(r, 35));
      onChunk(w + " ");
    }
    return ANSWER;
  },
  key: { has: async () => hasKey, set: async () => {}, clear: async () => {} },
  load: async () => ({
    settings: DEFAULT_SETTINGS,
    profile: {
      targetRole: "Project coordinator",
      education: "BSc in Industrial Engineering",
      experience: "4 years coordinating logistics projects",
      achievements: "",
      skills: "Planning, SQL, stakeholder communication",
      proudestProject: "",
      strengths: "",
    },
  }),
  save: async () => {},
  setFloating: async () => {},
};

createRoot(document.getElementById("root")!).render(<CoachApp services={services} />);
