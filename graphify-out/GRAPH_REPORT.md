# Graph Report - interview-coach  (2026-10-10)

## Corpus Check
- Corpus is ~21,976 words - fits in a single context window. You may not need a graph.

## Summary
- 541 nodes · 914 edges · 30 communities (22 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Demo y datos sintéticos
- Traductor Gemini
- Config Electron Vite
- Errores de API
- Empaquetado y benchmark
- Proceso principal Electron
- Puente preload y audio
- Dependencias web PWA
- Servicios web y captura
- Raíz del monorepo
- Dependencias UI
- Sesiones e historial
- Dependencias desktop
- Spike, stack y BYOK
- tsconfig base
- Dependencias core
- Diseño y marca
- tsconfig desktop
- tsconfig web
- tsconfig UI
- CI, releases y actualizaciones
- tsconfig core
- Worklet captura spike
- Worklet captura desktop
- Worklet captura web
- Tipos CSS desktop
- Tipos CSS web
- Instrucciones del proyecto

## God Nodes (most connected - your core abstractions)
1. `CoachServices` - 23 edges
2. `registerIpc()` - 20 edges
3. `useCoach()` - 17 edges
4. `toApiError()` - 16 edges
5. `CoachApp()` - 14 edges
6. `useSimulation()` - 14 edges
7. `compilerOptions` - 13 edges
8. `RollingTranscriber` - 12 edges
9. `TurnSegmenter` - 12 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Interview Coach design system` --semantically_similar_to--> `Desktop renderer direction contract (museum wall label)`  [INFERRED] [semantically similar]
  DESIGN.md → apps/desktop/.impeccable/surfaces/apps-desktop-src-renderer.md
- `App icon: brass P-01 plate on ink-green square` --implements--> `Ink-green wall palette with brass accent and clay errors`  [INFERRED]
  apps/web/public/icon.svg → DESIGN.md
- `App icon: brass P-01 plate on ink-green square` --conceptually_related_to--> `Question plate (ficha) with catalogue numeral`  [INFERRED]
  apps/web/public/icon.svg → DESIGN.md
- `unwrap()` --calls--> `ApiError`  [EXTRACTED]
  apps/desktop/src/renderer/services.ts → packages/core/src/errors.ts
- `wrap()` --calls--> `toApiError()`  [EXTRACTED]
  apps/desktop/src/main/index.ts → packages/core/src/errors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **GitHub Actions delivery pipelines** — github_workflows_ci_ci_workflow, github_workflows_pages_pages_workflow, github_workflows_release_desktop_release_workflow [INFERRED 0.85]
- **Visual identity system** — design_interview_coach_design_system, design_brass_accent_palette, design_question_plate_ficha, apps_web_public_icon_app_icon, apps_desktop_impeccable_surfaces_apps_desktop_src_renderer_direction_contract [INFERRED 0.85]
- **HTML entry points across apps** — apps_web_index_web_entry, apps_desktop_src_renderer_index_renderer_html, apps_desktop_src_renderer_demo_demo_demo_page, apps_desktop_spike_index_spike_page [INFERRED 0.75]

## Communities (30 total, 8 thin omitted)

### Community 0 - "Demo y datos sintéticos"
Cohesion: 0.07
Nodes (28): fail, FEEDBACK, q, seed, services, PROFILE_FIELDS, CoachApp(), FocusPanel() (+20 more)

### Community 1 - "Traductor Gemini"
Cohesion: 0.07
Nodes (22): DEFAULT_MODEL, GeminiOptions, GeminiTranslator, GenAiLike, generateContentStream(), EMPTY_PROFILE, MAX_SUMMARY, profileToPromptText() (+14 more)

### Community 2 - "Config Electron Vite"
Cohesion: 0.05
Nodes (37): CSP, author, dependencies, electron-updater, @kutalia/whisper-node-addon, description, @fontsource-variable/public-sans, @interview-coach/core (+29 more)

### Community 3 - "Errores de API"
Cohesion: 0.07
Nodes (18): ApiError, ApiErrorKind, MESSAGES, statusOf(), toApiError(), feedbackPrompt(), AudioSourceKind, rms() (+10 more)

### Community 4 - "Empaquetado y benchmark"
Cohesion: 0.08
Nodes (21): DLLS, fs, path, here, model, pcm, require, { transcribe } (+13 more)

### Community 5 - "Proceso principal Electron"
Cohesion: 0.16
Nodes (23): { contextBridge, ipcRenderer }, answers, quitAndInstall(), registerIpc(), wrap(), clearKey(), file(), getKey() (+15 more)

### Community 6 - "Puente preload y audio"
Cohesion: 0.09
Nodes (16): bridge, CoachBridge, startAudio(), desktopServices, unwrap(), Window, AnswerRequest, CH (+8 more)

### Community 7 - "Dependencias web PWA"
Cohesion: 0.06
Nodes (32): dependencies, @huggingface/transformers, devDependencies, @fontsource-variable/public-sans, @interview-coach/core, @interview-coach/ui, react, react-dom (+24 more)

### Community 8 - "Servicios web y captura"
Cohesion: 0.09
Nodes (22): startAudio(), cache, getKey(), K, needKey(), read(), sources, webServices (+14 more)

### Community 9 - "Raíz del monorepo"
Cohesion: 0.09
Nodes (18): devDependencies, typescript, vitest, typescript, name, packageManager, private, scripts (+10 more)

### Community 10 - "Dependencias UI"
Cohesion: 0.08
Nodes (24): dependencies, @fontsource-variable/public-sans, @interview-coach/core, lucide-react, react, react-dom, devDependencies, @types/react (+16 more)

### Community 11 - "Sesiones e historial"
Cohesion: 0.20
Nodes (15): isWorthSaving(), pad(), parts(), SessionRecord, sessionTitle(), sessionToMarkdown(), SessionTurn, suggestedFilename() (+7 more)

### Community 12 - "Dependencias desktop"
Cohesion: 0.13
Nodes (15): devDependencies, electron, electron-builder, electron-vite, @fontsource-variable/public-sans, @interview-coach/core, @interview-coach/ui, react (+7 more)

### Community 13 - "Spike, stack y BYOK"
Cohesion: 0.13
Nodes (14): Spike page (transcription latency test), Spike: Windows loopback plus local Whisper, Demo page (synthetic data), pnpm workspace (packages/*, apps/*), BYOK Gemini key, stored only on device, Monorepo stack (core, ui, desktop, web, mobile), Product brief (Interview Coach), Provider interfaces (audio, STT, translation, LLM, key storage) (+6 more)

### Community 14 - "tsconfig base"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleResolution, noImplicitOverride (+5 more)

### Community 15 - "Dependencias core"
Cohesion: 0.15
Nodes (12): dependencies, @google/genai, main, name, private, scripts, test, typecheck (+4 more)

### Community 16 - "Diseño y marca"
Cohesion: 0.18
Nodes (10): Desktop renderer direction contract (museum wall label), Desktop renderer HTML entry, Web PWA HTML entry, App icon: brass P-01 plate on ink-green square, Bilingual Wall Label (creative north star), Ink-green wall palette with brass accent and clay errors, Compact density via container query at 759px, Interview Coach design system (+2 more)

### Community 17 - "tsconfig desktop"
Cohesion: 0.22
Nodes (8): compilerOptions, allowArbitraryExtensions, jsx, noEmit, types, extends, include, ../../tsconfig.base.json

### Community 18 - "tsconfig web"
Cohesion: 0.22
Nodes (8): compilerOptions, allowArbitraryExtensions, jsx, lib, noEmit, extends, include, ../../tsconfig.base.json

### Community 19 - "tsconfig UI"
Cohesion: 0.33
Nodes (5): compilerOptions, jsx, extends, include, ../../tsconfig.base.json

### Community 20 - "CI, releases y actualizaciones"
Cohesion: 0.40
Nodes (5): electron-builder config (NSIS, GitHub publish), Whisper native addon unpacked from asar, CI workflow (typecheck, test, build desktop), Desktop release workflow (v* tags, GitHub Releases), Automatic updates via GitHub Releases

### Community 21 - "tsconfig core"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

## Knowledge Gaps
- **47 isolated node(s):** `@fontsource-variable/public-sans`, `@interview-coach/core`, `@interview-coach/ui`, `@types/node`, `@types/react` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Proceso principal Electron` to `Config Electron Vite`, `Empaquetado y benchmark`, `Puente preload y audio`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerIpc()` (e.g. with `.complete()` and `.stream()`) actually correct?**
  _`registerIpc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@fontsource-variable/public-sans`, `@interview-coach/core`, `@interview-coach/ui` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Demo y datos sintéticos` be split into smaller, more focused modules?**
  _Cohesion score 0.07092198581560284 - nodes in this community are weakly interconnected._
- **Why does `@huggingface/transformers` connect `Servicios web y captura` to `Dependencias web PWA`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useCoach()` (e.g. with `.load()` and `.onModelStatus()`) actually correct?**
  _`useCoach()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Traductor Gemini` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._