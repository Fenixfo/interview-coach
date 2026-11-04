# Graph Report - interview-coach  (2026-11-04)

## Corpus Check
- 77 files · ~24,490 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .webmanifest 1, .css 1)

## Summary
- 563 nodes · 1000 edges · 33 communities (23 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6c18d76`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CoachApp.tsx
- core/src/index.ts
- desktop/package.json
- usePractice.ts
- bench.mjs
- main/index.ts
- scripts
- web/package.json
- src/services.ts
- TurnSegmenter
- ui/package.json
- types.ts
- devDependencies
- Product brief (Interview Coach)
- compilerOptions
- electron.vite.config.ts
- Bilingual Wall Label (creative north star)
- compilerOptions
- compilerOptions
- ui/tsconfig.json
- electron-builder config (NSIS, GitHub publish)
- core/tsconfig.json
- Capture
- Capture
- Capture
- renderer/css.d.ts
- src/css.d.ts
- Project instructions: claude-mem work state and graphify
- dependencies
- setupUpdates
- core/package.json

## God Nodes (most connected - your core abstractions)
1. `CoachServices` - 25 edges
2. `registerIpc()` - 20 edges
3. `toApiError()` - 18 edges
4. `useCoach()` - 17 edges
5. `CoachApp()` - 15 edges
6. `RollingTranscriber` - 14 edges
7. `usePractice()` - 14 edges
8. `useSimulation()` - 14 edges
9. `SessionRecord` - 13 edges
10. `compilerOptions` - 13 edges

## Surprising Connections (you probably didn't know these)
- `App icon: brass P-01 plate on ink-green square` --implements--> `Ink-green wall palette with brass accent and clay errors`  [INFERRED]
  apps/web/public/icon.svg → DESIGN.md
- `App icon: brass P-01 plate on ink-green square` --conceptually_related_to--> `Question plate (ficha) with catalogue numeral`  [INFERRED]
  apps/web/public/icon.svg → DESIGN.md
- `Interview Coach design system` --semantically_similar_to--> `Desktop renderer direction contract (museum wall label)`  [INFERRED] [semantically similar]
  DESIGN.md → apps/desktop/.impeccable/surfaces/apps-desktop-src-renderer.md
- `unwrap()` --calls--> `ApiError`  [EXTRACTED]
  apps/desktop/src/renderer/services.ts → packages/core/src/errors.ts
- `wrap()` --calls--> `toApiError()`  [EXTRACTED]
  apps/desktop/src/main/index.ts → packages/core/src/errors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **HTML entry points across apps** — apps_web_index_web_entry, apps_desktop_src_renderer_index_renderer_html, apps_desktop_src_renderer_demo_demo_demo_page, apps_desktop_spike_index_spike_page [INFERRED 0.75]
- **GitHub Actions delivery pipelines** — github_workflows_ci_ci_workflow, github_workflows_pages_pages_workflow, github_workflows_release_desktop_release_workflow [INFERRED 0.85]
- **Visual identity system** — design_interview_coach_design_system, design_brass_accent_palette, design_question_plate_ficha, apps_web_public_icon_app_icon, apps_desktop_impeccable_surfaces_apps_desktop_src_renderer_direction_contract [INFERRED 0.85]

## Communities (33 total, 10 thin omitted)

### Community 0 - "CoachApp.tsx"
Cohesion: 0.07
Nodes (27): EnglishLevel, AudioSourceKind, CoachApp(), FocusPanel(), LivePanel(), Nav(), pad(), Privacy() (+19 more)

### Community 1 - "core/src/index.ts"
Cohesion: 0.07
Nodes (19): DEFAULT_MODEL, GeminiOptions, GeminiTranslator, GenAiLike, generateContentStream(), EMPTY_PROFILE, MAX_SUMMARY, PROFILE_FIELDS (+11 more)

### Community 2 - "desktop/package.json"
Cohesion: 0.10
Nodes (19): author, description, @fontsource-variable/public-sans, @interview-coach/core, @interview-coach/ui, react, react-dom, @types/react (+11 more)

### Community 3 - "usePractice.ts"
Cohesion: 0.07
Nodes (27): ApiError, ApiErrorKind, MESSAGES, statusOf(), toApiError(), answerFeedbackPrompt(), contextQuestionsPrompt(), feedbackPrompt() (+19 more)

### Community 4 - "bench.mjs"
Cohesion: 0.20
Nodes (6): here, model, pcm, require, { transcribe }, @kutalia/whisper-node-addon

### Community 5 - "main/index.ts"
Cohesion: 0.08
Nodes (38): DLLS, fs, path, dir, file, { app, BrowserWindow, desktopCapturer, session, ipcMain }, path, { contextBridge, ipcRenderer } (+30 more)

### Community 6 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, bench, build, demo, dev, dist, model, release (+3 more)

### Community 7 - "web/package.json"
Cohesion: 0.05
Nodes (38): dependencies, @huggingface/transformers, devDependencies, @fontsource-variable/public-sans, @interview-coach/core, @interview-coach/ui, react, react-dom (+30 more)

### Community 8 - "src/services.ts"
Cohesion: 0.05
Nodes (36): bridge, CoachBridge, startAudio(), fail, FEEDBACK, q, seed, services (+28 more)

### Community 9 - "TurnSegmenter"
Cohesion: 0.09
Nodes (18): devDependencies, typescript, vitest, typescript, name, packageManager, private, scripts (+10 more)

### Community 10 - "ui/package.json"
Cohesion: 0.08
Nodes (23): dependencies, @fontsource-variable/public-sans, @interview-coach/core, lucide-react, react, react-dom, devDependencies, @types/react (+15 more)

### Community 11 - "types.ts"
Cohesion: 0.12
Nodes (22): isWorthSaving(), KIND_FILE, KIND_TITLE, pad(), parts(), SessionRecord, sessionTitle(), sessionToMarkdown() (+14 more)

### Community 12 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, electron, electron-builder, electron-vite, @fontsource-variable/public-sans, @interview-coach/core, @interview-coach/ui, react (+7 more)

### Community 13 - "Product brief (Interview Coach)"
Cohesion: 0.13
Nodes (14): Spike page (transcription latency test), Spike: Windows loopback plus local Whisper, Demo page (synthetic data), pnpm workspace (packages/*, apps/*), BYOK Gemini key, stored only on device, Monorepo stack (core, ui, desktop, web, mobile), Product brief (Interview Coach), Provider interfaces (audio, STT, translation, LLM, key storage) (+6 more)

### Community 14 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleResolution, noImplicitOverride (+5 more)

### Community 16 - "Bilingual Wall Label (creative north star)"
Cohesion: 0.18
Nodes (10): Desktop renderer direction contract (museum wall label), Desktop renderer HTML entry, Web PWA HTML entry, App icon: brass P-01 plate on ink-green square, Bilingual Wall Label (creative north star), Ink-green wall palette with brass accent and clay errors, Compact density via container query at 759px, Interview Coach design system (+2 more)

### Community 17 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowArbitraryExtensions, jsx, noEmit, types, extends, include, ../../tsconfig.base.json

### Community 18 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowArbitraryExtensions, jsx, lib, noEmit, extends, include, ../../tsconfig.base.json

### Community 19 - "ui/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, jsx, extends, include, ../../tsconfig.base.json

### Community 20 - "electron-builder config (NSIS, GitHub publish)"
Cohesion: 0.40
Nodes (5): electron-builder config (NSIS, GitHub publish), Whisper native addon unpacked from asar, CI workflow (typecheck, test, build desktop), Desktop release workflow (v* tags, GitHub Releases), Automatic updates via GitHub Releases

### Community 21 - "core/tsconfig.json"
Cohesion: 0.50
Nodes (3): extends, include, ../../tsconfig.base.json

### Community 30 - "dependencies"
Cohesion: 0.67
Nodes (3): dependencies, electron-updater, @kutalia/whisper-node-addon

### Community 32 - "core/package.json"
Cohesion: 0.15
Nodes (12): dependencies, @google/genai, main, name, private, scripts, test, typecheck (+4 more)

## Knowledge Gaps
- **47 isolated node(s):** `@fontsource-variable/public-sans`, `@interview-coach/core`, `@interview-coach/ui`, `@types/node`, `@types/react` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 284 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `main/index.ts` to `src/services.ts`, `desktop/package.json`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `registerIpc()` (e.g. with `.complete()` and `.stream()`) actually correct?**
  _`registerIpc()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@fontsource-variable/public-sans`, `@interview-coach/core`, `@interview-coach/ui` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CoachApp.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07092198581560284 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `types.ts` to `CoachApp.tsx`, `ui/package.json`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useCoach()` (e.g. with `.load()` and `.onModelStatus()`) actually correct?**
  _`useCoach()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `core/src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06829268292682927 - nodes in this community are weakly interconnected._