# Modernize Visual Style — Design Spec

**Task:** `#modernize-visual-style`
**Date:** 2026-03-18

## Goal

Replace the amber/warm visual style with a modern, neutral aesthetic. The dashboard should feel like a contemporary SaaS tool (Linear, Notion) rather than a craft/warm-toned app.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overall direction | Light neutral (Notion-style) | Cool gray bg, white cards, no warm tint |
| Accent color | Teal `#0d9488` | Ocean/octopus theme, distinctive, clashes with no status color |
| Status palette | Linear-style | Indigo/soft-orange/jade/gray — cohesive, high design quality |
| Primary font | Plus Jakarta Sans | Geometric + rounded balance, modern with personality |
| Mono font | JetBrains Mono | Rounded, developer-friendly, pairs with geometric sans |

## Complete Color System

```css
:root {
  /* Backgrounds — cool neutral */
  --bg:          #f7f7f5;
  --bg-warm:     #f0f0ee;
  --bg-card:     #ffffff;

  /* Text — neutral, no warm undertone */
  --text:           #1a1a1a;
  --text-secondary: #5c5c5c;
  --text-muted:     #6b6b6b;

  /* Accent — teal */
  --accent:       #0d9488;
  --accent-hover: #0f766e;
  --accent-light: rgba(13, 148, 136, 0.08);

  /* Borders — cool gray */
  --border:       #e5e5e5;
  --border-light: #ebebeb;

  /* Shadows — neutral base */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.07);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);

  /* Status — Linear palette */
  --status-ongoing:  #5e6ad2;
  --status-todo:     #f2994a;
  --status-done:     #4cb782;
  --status-canceled: #8b8f98;

  /* Typography */
  --font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

## Files to Change

### 1. `server/assets/dashboard.css`

- **`:root` block**: Replace all CSS variable values with the new color system above.
- **FAB shadow**: `rgba(196, 97, 60, 0.35)` → `rgba(13, 148, 136, 0.35)` (and hover variant).
- **Shimmer animation**: Replace `#1a1917` → `#1a1a1a` in gradient stops.
- **Session dots**: `#22c55e` (running) → `#4cb782`, `#f59e0b` (idle) → `#f2994a`. Permission purple `#a855f7` stays (or consider shifting to match indigo ongoing — optional).
- **Hardcoded colors**: Search for any remaining `#f8f6f1`, `#c4613c`, `#1a1917`, `#e3e1da`, `#edebe5`, `#5c5b56`, `#6b6a65`, `#f3f0e8` references and replace with new equivalents.

### 2. `server/assets/dashboard.html`

- **`<meta name="theme-color">`**: `#f8f6f1` → `#f7f7f5`.
- **Favicon SVG**: The inline octopus SVG uses `#c4613c` and `#d4785c` for the body. **Keep as-is** — the coral octopus provides nice brand contrast on the neutral bg.

### 3. `server/assets/manifest.json`

- `background_color`: `#f8f6f1` → `#f7f7f5`.
- `theme_color`: `#f8f6f1` → `#f7f7f5`.

### 4. Font files

- **Option A (recommended)**: Self-host via `server/assets/vendor/fonts.css`. Download Plus Jakarta Sans (400, 500, 600, 700) and JetBrains Mono (400, 700) woff2 files. Update `fonts.css` to reference the new fonts. This avoids external network dependency.
- **Option B**: Use Google Fonts CDN link in `dashboard.html`. Simpler but adds external dependency.
- Remove DM Sans and DM Mono font files from `server/assets/vendor/` after replacing.

### 5. PWA icons (minor)

- `icon-maskable-192.png` and `icon-maskable-512.png`: Background color `#f8f6f1` → `#f7f7f5`. Minimal visual difference, low priority.

## What Stays Unchanged

- Layout structure (sidebar + board, FAB position)
- Border radius values (`--radius: 10px`, `--radius-sm: 6px`)
- Card structure, drag-drop, modals
- All JavaScript logic
- Error banner red (`#dc2626`) — semantic error color
- File changed banner amber (`#b45309`) — semantic warning color
- Octopus favicon/icon body colors (coral on neutral = good brand contrast)

## Status Color Mapping

| Status | Old | New | Session Dot |
|--------|-----|-----|-------------|
| Ongoing | `#2563eb` blue | `#5e6ad2` indigo | running: `#4cb782`, idle: `#f2994a` |
| Todo | `#e09400` amber | `#f2994a` soft orange | — |
| Done | `#16a34a` green | `#4cb782` jade | — |
| Backlog | `#94a3b8` slate | `#8b8f98` gray | — |

## Risk Assessment

- **Low risk**: All changes are CSS variables + a few hardcoded color values. No logic changes.
- **Font swap**: Metrics differ slightly between DM Sans and Plus Jakarta Sans. May need minor `font-size` or `letter-spacing` tweaks if text overflows or looks cramped. Check sidebar project names, column headers, and card titles.
- **Backward compatibility**: No API changes, no data format changes. Pure visual.
