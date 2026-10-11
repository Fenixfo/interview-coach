import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativo: funciona igual en la raíz de un dominio y en https://usuario.github.io/repositorio/
export default defineConfig({
  base: "./",
  plugins: [react()],
  worker: { format: "es" },
  build: { target: "es2022" },
});
