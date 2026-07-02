# Breaking News — Ad Creative Generator

A single-page web app that generates Instagram-style "breaking news" ad
creatives: hero photo on top, black gradient fade, red badge, big condensed
all-caps headline with a highlighted phrase, and an IG profile row at the
bottom.

Everything is drawn natively with the **Canvas 2D API** at a full
1080×1350 export resolution (no `html2canvas`/DOM screenshotting), so exports
are pixel-perfect.

> This app is self-contained in its own directory and is independent of the
> parent Bookuj.sk Next.js project. It has its own `package.json`,
> `pnpm-workspace.yaml` (standalone root) and `node_modules`.

## Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS v4
- Self-hosted display fonts (Anton, Archivo Black, Bebas Neue, Inter, Poppins)
  bundled as `woff2` and registered via the `FontFace` API — the canvas never
  renders before fonts are ready and never depends on a runtime CDN.

## Getting started

```bash
pnpm install
pnpm dev        # start the dev server
pnpm build      # typecheck + production build
pnpm preview    # preview the production build
```

## Architecture

The renderer is a **pure function** so it can drive both the live preview and
the export bitmap identically, and is easy to reason about / test:

```ts
renderCreative(ctx, state, images, dims)
```

- `src/render/renderCreative.ts` — the pure renderer + layout math
  (`computeRegions`, `computeHeadlineLayout`).
- `src/render/text.ts` — headline tokenization, word wrapping, highlight tokens.
- `src/render/geometry.ts` — cover-fit + clamped pan for the hero image.
- `src/render/fonts.ts` — bundles & registers the display faces.
- `src/state/` — default state, presets (fonts, format dims).
- `src/components/` — canvas preview (pan/zoom/keyboard), avatar crop modal, and
  the collapsible control-panel sections.
- `src/App.tsx` — state orchestration, persistence, export/copy.

## Features

- **Hero image**: drag-and-drop / picker upload, direct pan (drag) and zoom
  (wheel / pinch / slider 100–300%), always cover-fit with clamped panning,
  Center reset, and a two-slider gradient fade. Huge uploads (up to 8000px) are
  downscaled to a 3000px long edge before being held in memory.
- **Headline**: multiline text with manual + auto line breaks, auto-uppercase,
  binary-searched auto font-size (fits width *and* the space between badge and
  profile row) with a manual override, line-height, per-word highlight chips
  (multi-word phrases), 4 highlight styles (color / underline / box / outline)
  with a color picker + presets, center/left alignment, and an optional drop
  shadow.
- **Badge**: editable text, on/off, colors, corner radius, vertical position.
- **Profile row**: circular-crop avatar modal (pan/zoom inside a circle), IG
  gradient ring, nickname + verified check, grey byline, 7 carousel dots.
- **Layout & Style**: 5 headline presets, independent font override, and 3
  canvas formats (4:5, 1:1, 9:16) that preserve relative positions.
- **Persistence & export**: full state saved to `localStorage` (images
  re-prompt on reload with a placeholder), PNG export named
  `creative-{first-4-headline-words}-{timestamp}.png`, copy-to-clipboard, and a
  "Randomize placeholder" button so the canvas is never empty.

## Keyboard

Focus the canvas and use the arrow keys to nudge the hero image 1px (10px with
Shift).
