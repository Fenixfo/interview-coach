export interface UserProfile {
  targetRole: string;
  education: string;
  experience: string;
  achievements: string;
  skills: string;
  proudestProject: string;
  strengths: string;
}

export const EMPTY_PROFILE: UserProfile = {
  targetRole: "",
  education: "",
  experience: "",
  achievements: "",
  skills: "",
  proudestProject: "",
  strengths: "",
};

/** Plantilla que se muestra en Ajustes para guiar al usuario (en español). */
export const PROFILE_FIELDS: ReadonlyArray<{
  key: keyof UserProfile;
  label: string;
  hint: string;
}> = [
  { key: "targetRole", label: "Cargo objetivo", hint: "Ej.: Analista de datos junior" },
  { key: "education", label: "Educación", hint: "Carrera, institución, año" },
  { key: "experience", label: "Experiencia", hint: "Empresa, cargo, años y qué hacías" },
  { key: "achievements", label: "Logros", hint: "Resultados concretos, con cifras si las tienes" },
  { key: "skills", label: "Habilidades", hint: "Técnicas y blandas" },
  { key: "proudestProject", label: "Proyecto del que más te enorgulleces", hint: "Qué hiciste y qué lograste" },
  { key: "strengths", label: "Fortalezas", hint: "Tres o cuatro, con un ejemplo" },
];

const SECTION_TITLES: Record<keyof UserProfile, string> = {
  targetRole: "Target role",
  education: "Education",
  experience: "Experience",
  achievements: "Achievements",
  skills: "Skills",
  proudestProject: "Proudest project",
  strengths: "Strengths",
};

/** Perfil en texto para los prompts. Los campos vacíos se omiten. */
export function profileToPromptText(p: UserProfile): string {
  const lines = (Object.keys(SECTION_TITLES) as Array<keyof UserProfile>)
    .filter((k) => p[k].trim())
    .map((k) => `${SECTION_TITLES[k]}: ${p[k].trim()}`);
  return lines.length ? lines.join("\n") : "(The profile is empty.)";
}
