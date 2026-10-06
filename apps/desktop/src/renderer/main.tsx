import "@fontsource-variable/public-sans/index.css";
import "@interview-coach/ui/src/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CoachApp } from "@interview-coach/ui";
import { desktopServices } from "./services";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoachApp services={desktopServices} />
  </StrictMode>,
);
