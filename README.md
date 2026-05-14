# Cryptic — solving companion

A calm, paper-like workspace for cryptic crossword solving. Open multiple clues side by side, annotate wordplay structure, branch theories, and rearrange letters — without ever being given the answer.

---

## What it does (and doesn't do)

**Does:**
- Let you work on up to 6 clues simultaneously in independent workspaces
- Annotate clue words as definition, indicator, or fodder
- Build and compare multiple solving theories per clue
- Rearrange letter tiles for anagram and hidden-word work
- Save everything automatically to your browser (no account needed)
- Export and import sessions as `.json` files
- Work fully offline once loaded

**Never does:**
- Provide answers
- Validate guesses
- Generate clues
- Suggest solutions
- Connect to a clue database

---

## Quick start

**Prerequisites:** Node.js 20 or later

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# → http://localhost:5173
```

---

## Building for production

```bash
npm run build     # TypeScript check + Vite bundle → dist/
npm run preview   # Preview the production build locally
```

The build output goes to `dist/`. All assets are fingerprinted for cache-busting.

---

## Deploying to GitHub Pages

### Automatic (recommended)

1. Push this repository to GitHub.
2. In your repository: **Settings → Pages → Source → GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

Your app will be live at:
```
https://<your-username>.github.io/<repo-name>/
```

The workflow reads your repository name from GitHub's context and sets the Vite base path automatically. No manual configuration is required.

### Manual

If you prefer to deploy the `dist/` folder yourself:

```bash
VITE_BASE_URL=/<repo-name>/ npm run build
```

Then serve the `dist/` directory from any static host.

---

## Self-hosting fonts (GDPR compliance)

By default, the app loads fonts from Google Fonts CDN. Each visitor's browser contacts Google servers — this may require disclosure under GDPR for EU deployments.

**To self-host:**

1. Download the fonts (e.g. using [google-webfonts-helper](https://gwfh.mranftl.com/fonts)):
   - **Fraunces** (variable: wght 300–900, opsz 9–144, SOFT, WONK axes)
   - **IBM Plex Mono** (weights 400, 500, 600)
   - **IBM Plex Sans** (weights 400, 500, 600, 700)

2. Place `.woff2` files in `public/fonts/` matching the names in `typography.css`.

3. In `src/styles/typography.css`:
   - Comment out the `@import url('https://fonts.googleapis.com/...')` line
   - Uncomment the `@font-face` block below it

4. Rebuild: `npm run build`

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 | Stable, well-understood, large ecosystem |
| State | Zustand | Minimal API, built-in localStorage persistence |
| Bundler | Vite 6 | Fast dev server, excellent TypeScript support |
| Styling | Plain CSS + CSS custom properties | No framework needed; full control |
| TypeScript | Strict mode | Catches bugs at compile time |
| Fonts | Fraunces · IBM Plex Mono · IBM Plex Sans | Editorial + precision + readability |

No UI component library. No CSS framework. No backend. No database.

---

## Architecture notes

```
src/
  store/
    workspaceStore.ts    — all solving content (workspaces, attempts, tiles)
    preferencesStore.ts  — display preferences (theme, mode, font size)
  components/
    layout/              — AppShell, Topbar, WorkspaceTabBar, SessionControls
    clue/                — ClueCard, ClueText (click-to-annotate), ClueBreakdown
    workspace/           — AttemptCard accordion, ConfidenceDots
    tools/               — Toolbar, Scratchpad, TileRack, CandidateInput
    learning/            — LearningPanel (clue-type reference guide)
    common/              — Toggle, ErrorBoundary, VisuallyHidden
  styles/
    tokens.css           — all design tokens (colours, spacing, radii, motion)
    typography.css       — font loading + scale
    globals.css          — body reset + global styles
    accessibility.css    — focus rings, sr-only, reduced motion
    density.css          — beginner/expert layout overrides
    reset.css            — minimal browser reset
  utils/
    session.ts           — export/import serialisation (no React, no side effects)
    cn.ts                — classname utility
  types/
    index.ts             — all shared TypeScript types
```

**State persistence:** Zustand's `persist` middleware writes to `localStorage` on every state change. On reload, state is restored automatically. A `merge` function in each store handles schema migrations — new fields get safe defaults when loading old saves.

**Multi-workspace:** Each workspace is independent (`WorkspaceState[]`). The active workspace is tracked by `activeWorkspaceId`. All store actions operate on the active workspace via pure helpers (`selectActiveWorkspace`, `patchActiveAttempt`).

---

## Known limitations

- **Maximum 6 open workspaces** — a soft cap to keep the tab bar readable. Close one to open another.
- **localStorage storage** — browsers typically allow 5–10 MB per origin. A heavily-used session with many workspaces and tile states could approach this. Export sessions regularly as a backup.
- **No sync between devices** — data lives in your browser. Use Export/Import to move sessions between devices.
- **Font flash on first load** — if using Google Fonts CDN, fonts may render with fallbacks for ~100ms on the first ever visit. Subsequent visits use the browser cache.
- **Vite dev server security** — `npm audit` may report a moderate advisory about the Vite dev server (esbuild). This only affects the development server, not the production build. Do not expose the dev server to untrusted networks.

---

## Testing checklist

Run through these before deploying a new version:

### Core solving flow
- [ ] Enter a clue via the Edit button; enumeration and reference display correctly
- [ ] Click clue words to cycle annotations (def → ind → fod → none)
- [ ] Breakdown panel shows annotated parts with correct colours
- [ ] Add a second and third theory; each accordion expands/collapses independently
- [ ] Edit theory title and strategy (live-save, visible in collapsed header)
- [ ] Delete a theory (confirms before deleting; unavailable when only 1 remains)

### Letter manipulation
- [ ] Enter source text → tiles appear
- [ ] Click a tile to select (lifts); click another to move it
- [ ] Arrow keys move selected tile left/right
- [ ] L key toggles lock on focused tile; lock button works on hover
- [ ] Shuffle randomises order; Reset restores source order
- [ ] Copy writes tile arrangement to working answer field
- [ ] Tile state persists after page reload

### Tool keyboard shortcuts (H / A / C / P / S)
- [ ] Shortcuts switch tools when focus is outside an input
- [ ] Shortcuts do NOT fire while typing in a text field

### Multi-workspace
- [ ] Open a second workspace via the + button; tab bar shows both
- [ ] Switch between workspaces; each maintains independent state
- [ ] Close a workspace with content (confirm dialog); empty workspace closes silently
- [ ] All 6 workspaces can be open simultaneously

### Export / Import
- [ ] Export downloads a `.json` file with the correct filename
- [ ] Import the exported file; workspaces are added (not replaced)
- [ ] Import a file with too many workspaces; clear error message shown
- [ ] Import a non-JSON file or wrong format; clear error message shown

### Preferences
- [ ] Dark mode: all colours update, no flash on toggle
- [ ] Expert mode: strategy text hidden, tips hidden, learning panel suppressed
- [ ] Beginner mode: reference panel open by default on first visit
- [ ] Preferences persist after page reload

### Accessibility
- [ ] Tab key reaches every interactive element
- [ ] Skip link visible on first Tab press; jumps to main content
- [ ] Focus rings visible on all interactive elements
- [ ] Tile rack keyboard nav: Tab between tiles, Enter/Space selects
- [ ] OS-level "reduce motion" suppresses tile animations
- [ ] App-level reduced motion preference works independently

### Mobile (≤640px)
- [ ] Single-column layout; clue panel stacks above workspace
- [ ] Topbar toggle labels hidden; dots remain; all toggles still work
- [ ] Tab bar scrolls horizontally with many workspaces
- [ ] Tiles wrap to multiple rows on narrow screens

### Error recovery
- [ ] Corrupt localStorage: delete `cryptic:workspace` key; app loads with defaults
- [ ] Error boundary: if a component crashes, recovery UI shown; data preserved

---

## Licence

MIT
