import "@fontsource-variable/public-sans/index.css";
import "@interview-coach/ui/src/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CoachApp } from "@interview-coach/ui";
import { webServices } from "./services";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoachApp services={webServices} />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
