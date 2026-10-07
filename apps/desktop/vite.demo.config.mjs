import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Solo para ver la pantalla con datos sintéticos: pnpm demo → http://localhost:5199/demo/demo.html
export default defineConfig({ root: "src/renderer", plugins: [react()], server: { port: 5199, strictPort: true } });
