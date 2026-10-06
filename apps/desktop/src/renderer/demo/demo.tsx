// Harness solo para desarrollo (http://localhost:5173/demo/demo.html): servicios simulados con
// datos sintéticos, para ver todos los estados de la pantalla sin audio, clave ni red.
import "@fontsource-variable/public-sans/index.css";
import "@interview-coach/ui/src/styles.css";
import { createRoot } from "react-dom/client";
import { ApiError } from "@interview-coach/core";
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

const services: CoachServices = {
  availableSources: ["system", "microphone"],
  async startAudio(_s, onChunk) {
    const t0 = Date.now();
    const id = setInterval(() => {
      const loud = Date.now() - t0 < 7000;
      onChunk(new Float32Array(1600).fill(loud ? 0.2 : 0.001));
    }, 100);
    return () => clearInterval(id);
  },
  async transcribe(pcm) {
    const words = QUESTION.split(" ");
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
