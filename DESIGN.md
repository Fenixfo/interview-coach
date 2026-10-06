---
name: Interview Coach
description: A bilingual museum wall label for live English interviews, set on ink-green wall with brass as the only accent.
colors:
  wall: "#0f261b"
  wall-raised: "#143024"
  plate: "#163325"
  seam: "#305040"
  ink: "#dcd8c8"
  ink-2: "#b2bcae"
  ink-3: "#9bab9f"
  brass: "#c9a45c"
  brass-hover: "#d4b06b"
  brass-ink: "#0f261b"
  clay: "#e8a08a"
  focus: "#e0bf7c"
typography:
  catalog-numeral:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 200
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  answer:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 420
    lineHeight: 1.42
  question-en:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.28
  question-es:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.5
  transcript:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans Variable, Public Sans, system-ui, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  plate: "2px"
  control: "6px"
  mark: "3px"
  round: "50%"
spacing:
  gap: "1rem"
  pad: "1.25rem"
  bar-y: "0.625rem"
  ficha-pad: "1.5rem"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.875rem"
    height: "2.25rem"
  button-hover:
    backgroundColor: "{colors.wall-raised}"
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-ink}"
    rounded: "{rounded.control}"
    padding: "0.375rem 0.875rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.brass-hover}"
  button-small:
    rounded: "{rounded.control}"
    padding: "0.125rem 0.625rem"
    height: "1.75rem"
  ficha:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "1.5rem 1.5rem 0.75rem"
  input:
    backgroundColor: "{colors.wall-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.625rem"
  alert:
    textColor: "{colors.clay}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  gap-mark:
    textColor: "{colors.ink}"
    rounded: "{rounded.mark}"
---

# Design System: Interview Coach

## Overview

**Creative North Star: "The Bilingual Wall Label"**

The screen is a gallery wall, not a dashboard. Each interviewer question is an exhibit with a catalogue number (P-07) and a plate that carries English above and Spanish below. The wall is deep ink green, never gray. Pieces are separated by 1px seams, not cards, and nothing casts a shadow. Type is a calm institutional grotesque in muted bone, with brightness held low because the user reads at night, on a call, and must not give the tool away on camera.

Hierarchy comes from scale and weight, not colour. The suggested answer is the largest running text on the screen because it is read aloud; the question plate carries equal weight at a glance. Brass is the single accent: it marks listening, the primary action and the catalogue numeral. Clay is reserved for errors. One layout serves two densities: a full wall of transcript and focus columns, and a floating compact mode where the transcript folds behind a toggle.

**Key Characteristics:**
- Ink-green wall, one raised plate, 1px seams as the only dividers.
- No shadows. Depth is tonal (wall, wall-raised, plate) plus hairline borders.
- Single typeface (Public Sans Variable), contrast through a large scale jump (15px to 32px) and a 200-weight numeral.
- Brass as sole accent; clay only for errors; partial text sinks to the quiet green-gray.
- Density switches by container query, not by viewport media query.

## Colors

A near-monochrome green wall with bone text, one muted metal accent and one muted error tone.

### Primary
- **Matte Brass** (brass): the only accent. Listening dot, primary button fill, catalogue numeral, pressed-toggle border, checkbox and slider accent, settings links, gap highlights (at 22% mix).
- **Brass Hover** (brass-hover): primary button hover only.
- **Brass Ink** (brass-ink): text on brass fills; identical to the wall green.
- **Focus Brass** (focus): 2px focus-visible outline, offset 2px, on every focusable element.

### Secondary
- **Muted Clay** (clay): errors only: the status-bar error line, its small action buttons, and the alert box border and text.

### Neutral
- **Ink Green Wall** (wall): page, bar, sticky headers, select background.
- **Raised Wall** (wall-raised): button hover and input fields.
- **Plate Green** (plate): the question plate (ficha) only.
- **Seam** (seam): every 1px divider, button and field border, scrollbar thumb.
- **Bone Ink** (ink): final text, headings, answer.
- **Sage Ink** (ink-2): column headers, status text, empty-state copy.
- **Quiet Sage** (ink-3): partial and pending transcript, hints, metadata, the "P-" prefix, footer.

### Named Rules
**The One Metal Rule.** Brass is the only accent and clay the only alarm. A third hue means the system has been left.
**The Partial Sinks Rule.** Unfinished text is Quiet Sage; final text is Bone Ink. Never differentiate with motion or glow.

## Typography

**Display Font:** Public Sans Variable (with Public Sans, system-ui, Segoe UI, sans-serif)
**Body Font:** Public Sans Variable (same stack)

**Character:** Institutional and plain, like exhibition signage. Contrast comes from size and from the extreme light numeral, not from a second family.

### Hierarchy
- **Catalog numeral** (200, 3.5rem, 1, -0.02em, tabular): "P-07" in the plate gutter, brass, with the "P-" in Quiet Sage. 2.25rem in compact.
- **Answer** (420, 2rem, 1.42): the suggested answer, max 30em, text-wrap pretty. 2.125rem at 1200px container width and up; 1.75rem in compact.
- **Question EN** (600, 1.625rem, 1.28, balanced): English question on the plate. 1.125rem in compact.
- **Question ES** (400, 1.25rem, 1.4, max 52ch): translation under the English. 0.9375rem in compact.
- **Title** (600, 1.375rem): settings page heading; settings section heads use 1.0625rem 600 over a seam rule.
- **Transcript** (400, 1.0625rem, 1.45): live English and Spanish cells.
- **Body** (400, 0.9375rem, 1.5): default UI text, column headers at 600.
- **Label** (0.8125rem footer; 0.875rem hints and small buttons).

### Named Rules
**The Answer Is Loudest Rule.** The answer is the largest running text on any surface; nothing else exceeds it except the numeral, which is light and brief.

## Layout

The app is a three-row grid (bar, body, foot) that fills the window and declares itself a size container. The body is two regions: live transcript (1fr) with English and Spanish cells in two equal columns split by a full-height 1px seam that is drawn even when empty, and the focus column (1.25fr) holding the plate above the answer. Spacing rhythm is a 1.25rem page pad and 1rem gap; plates sit 1.25rem from the edges; settings content is a centred 46rem column with 1.75rem between sections.

At container width 759px and below (compact, floating), the transcript is hidden and the body stacks; a Transcript toggle reveals it at 40% height. The bar reflows into status, auxiliary and a full-width main row; auxiliary buttons drop their labels; the footer privacy line is hidden. The answer gets 1.75rem and the plate shrinks. Pad tightens to 0.75rem.

## Elevation & Depth

Flat. There are no box-shadows used for elevation anywhere. Depth is tonal: wall, raised wall (hover and fields) and plate, each separated from neighbours by a 1px seam. The only box-shadow is the inset ring that draws the empty status dot.

### Named Rules
**The Seam Not Shadow Rule.** Separate with a 1px seam or a tonal step. Never a shadow, never a card inside a card.

## Shapes

Nearly square and sober. The question plate is cut at 2px, controls (buttons, selects, inputs, alerts) at 6px, the gap highlight at 3px, and the status dot is a circle. Borders are always 1px; the only thicker line is the 2px focus outline.

## Components

### Buttons
- **Shape:** 6px corners, 2.25rem min height, 1px seam border, transparent fill.
- **Primary:** brass fill, brass-ink text, weight 600; hover shifts to brass-hover. One per bar (Start/Pause).
- **Hover / Focus:** hover fills Raised Wall and lightens the border; 120ms colour transition only, under no-preference reduced motion. Disabled is 45% opacity.
- **Toggle:** aria-pressed shows an 18% brass tint on wall with a brass border.
- **Quiet:** transparent border (Settings, back).
- **Small:** 1.75rem tall, 0.875rem text; in error context uses clay border and text.

### Inputs / Fields
- **Style:** Raised Wall fill, 1px seam border, 6px radius, 0.5rem 0.625rem padding. Labels at 600 with a 0.875rem Quiet Sage hint beneath. Range and checkbox use brass accent.
- **Focus:** the global 2px focus outline.

### Navigation
A single bar: status on the left (brass dot when listening, ring when idle), controls wrapping on the right, 1px seam beneath. Icons are line SVGs 18px (lucide) paired with Spanish labels.

### Question Plate (signature)
Plate Green rectangle, 2px corners, 1px seam border, 1.5rem padding. Two-column grid: catalogue numeral and prev/next navigation in the gutter, English over Spanish in the body. The answer sits directly on the wall below it, not in a second card.

### Alert and Status Error
Alert: 1px clay border, 6px radius, clay text with a clay-bordered action. In the bar, errors are a single ellipsised line that never moves the controls.

### Gap Mark
Placeholders such as [número de clientes] in the answer take a 22% brass tint with 3px corners and unchanged ink text.

## Do's and Don'ts

### Do:
- **Do** keep the wall green (#0f261b family); lift with Raised Wall or Plate Green, never with gray.
- **Do** divide with 1px Seam lines.
- **Do** keep the answer the largest running text and cap it at 30em.
- **Do** switch density with the `app` container query at 759px, not viewport media queries.
- **Do** render the numeral as `P-` in Quiet Sage plus digits in brass, tabular, weight 200.
- **Do** show the 2px Focus Brass outline on every focusable control.

### Don't:
- **Don't** add shadows, glows or flicker; nothing may blink or shine on camera.
- **Don't** introduce a second accent or use clay for anything but errors.
- **Don't** nest cards or put the answer in a bordered box.
- **Don't** use a second typeface.
- **Don't** use pure white or pure black text; the brightest value is Bone Ink.
