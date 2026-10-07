import { resolve } from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export default defineConfig(({ command }) => ({
  main: {
    build: {
      externalizeDeps: { exclude: ["@interview-coach/core"] },
      rollupOptions: {
        input: { index: resolve("src/main/index.ts") },
        external: ["electron", "electron-updater", "@kutalia/whisper-node-addon"],
        output: { format: "cjs", entryFileNames: "[name].js" },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve("src/preload/index.ts") },
        external: ["electron"],
        output: { format: "cjs", entryFileNames: "[name].js" },
      },
    },
  },
  renderer: {
    root: resolve("src/renderer"),
    build: {
      minify: !process.env["NO_MIN"],
      rollupOptions: { input: resolve("src/renderer/index.html") },
    },
    plugins: [
      react(),
      {
        // CSP estricta solo en la compilación: el servidor de desarrollo necesita scripts en línea.
        name: "csp-meta",
        transformIndexHtml(html: string) {
          if (command !== "build") return html;
          return html.replace(
            "<!--csp-->",
            `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
          );
        },
      },
    ],
  },
}));
