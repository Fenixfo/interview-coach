# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(All targets are web technology: Electron desktop, Vite PWA, Capacitor mobile wrapper. Mobile ships as a web UI in a wrapper, so it stays `web`.)

## Stack

Monorepo (pnpm or npm workspaces), strict TypeScript, React.
- `packages/core`: platform-free logic (provider interfaces, question detection, turn segmentation, Gemini prompts and client, error handling).
- `packages/ui`: shared React components.
- `apps/desktop`: Electron, Windows first.
- `apps/web`: Vite + PWA on GitHub Pages, static, no backend.
- `apps/mobile`: Capacitor, Android first, iOS later.

This replaces the earlier Next.js + Tailwind answer. Styling stack is undecided.

## Users

Spanish-speaking job seekers who must interview in English. They practice before interviews, and may also use the tool live as an assistant while an interviewer speaks (YouTube, Zoom, Meet, Teams audio).

## Product Purpose

Practice English job interviews. The app transcribes the interviewer in English live, translates to Spanish live, detects when a question ends, and streams a suggested first-person English answer based on the user's profile. A simulation mode asks questions aloud for a role the user types, listens to their spoken answer, and gives English feedback (grammar, vocabulary, clarity) at the end.

## Positioning

Answers come from the user's own profile (education, experience, achievements, skills, proudest project, strengths, target role), never invented: missing data appears as placeholders like [número de clientes]. Free to run: each user brings their own Gemini key (BYOK), stored only on their device.

## Operating Context

- Delivery order: Windows desktop (priority), then GitHub Pages web, then Android, then iOS. A reference Python prototype exists (local Whisper, free Google Translate, Gemini).
- Desktop and web: three columns (live English | Spanish | question + suggested answer). Desktop adds an always-on-top floating window. Mobile: tabs or stacked cards, large buttons; simulation is the primary mobile experience, since other apps' audio cannot be captured.
- Controls: Start/Pause, "Mi turno" (skip the user's own voice), Answer last, Clear, Settings.
- Partial text gray, final text black, suggested answer in large type.

## Capabilities and Constraints

- Interface language: Spanish. Suggested answers: English, 60-120 words, B2 vocabulary (configurable), STAR for behavioral questions.
- Question end detected by a ~1.5 s pause (configurable). Gemini is called only when text looks like a question (heuristic: "?", what, why, how, tell me, describe, walk me through, can you...), with a force button.
- Providers sit behind interfaces: audio source (system | tab | mic | simulation), STT (local Whisper | Web Speech | Gemini Live), translation (free translator | Chrome Translator API | Gemini Flash-Lite), LLM (Gemini via @google/genai, model configurable, default the current Flash-Lite), secure key storage (per-platform adapter).
- Free services or Gemini free tier only. Clear Spanish messages for 429 (quota) and invalid-key errors.
- No key may ever enter the repository. Strict CSP, no third-party scripts. Electron: contextIsolation on, nodeIntegration off, minimal preload.
- Profile edited in Settings, stored locally, with a template.
- Visible privacy notice: audio and text may be processed by Google services.
- Session history stored locally, exportable to Markdown (phase 2).
- Open: product name and visual identity.

## Evidence on Hand

A Python prototype is referenced but is not in this repository. No users, testimonials or benchmarks. Do not fabricate any.

## Product Principles

- Never invent facts about the user: placeholders over fabrication.
- Low latency and low cognitive load: live use means glanceable text, large answer type, minimal chrome.
- Privacy by default: keys and profile stay on the device; disclose Google processing plainly.
- Degrade gracefully per platform: detect what the browser or device supports and hide what cannot work.
- Spend little quota: call Gemini only when it matters.

## Accessibility & Inclusion

Spanish-first UI for non-native English speakers. Text must stay legible at a glance and at a distance during live use. A formal standard is not yet set.
