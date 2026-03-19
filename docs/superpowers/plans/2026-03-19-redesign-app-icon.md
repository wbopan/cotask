# Redesign App Icon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace overlapping-octagons icon with a Lucide badge-check on navy-to-teal gradient, optimized for Liquid Glass.

**Architecture:** Write new SVG source, rewrite the PNG generation script to rasterize SVG instead of pixel-art, update the favicon link in dashboard HTML.

**Tech Stack:** SVG, sharp (SVG rasterization), Node.js ESM

**Spec:** `docs/superpowers/specs/2026-03-19-redesign-app-icon-design.md`

---

### Task 1: Write the new SVG icon

**Files:**
- Modify: `server/assets/octopus.svg`

- [ ] **Step 1: Verify the badge-check path from pinned Lucide**

Open `server/assets/vendor/lucide.min.js` and search for the `badge-check` icon definition. Extract the outer seal path and the checkmark path. Compare against the paths in the spec:
- Seal: `M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z`
- Check: `m9 12 2 2 4-4`

If they differ, use the paths from the pinned Lucide version.

- [ ] **Step 2: Write the new SVG**

Replace `server/assets/octopus.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a3a5c"/>
      <stop offset="40%" stop-color="#115e59"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256,256) scale(20.5)">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          transform="translate(-12,-12)"
          fill="rgba(255,255,255,0.93)" stroke="none"/>
    <path d="m9 12 2 2 4-4"
          transform="translate(-12,-12)"
          fill="none" stroke="#115e59"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
```

- [ ] **Step 3: Visual verification**

Run: `open server/assets/octopus.svg`

Verify: navy-to-teal gradient background, white badge-check shape filling ~80% of the canvas, dark teal checkmark visible inside.

- [ ] **Step 4: Commit**

```bash
git add server/assets/octopus.svg
git commit -m "feat(icon): replace octagon SVG with badge-check design"
```

---

### Task 2: Rewrite PNG generation script

**Files:**
- Modify: `scripts/generate-icons.mjs`

The current script renders pixel-art from a hardcoded bitmap buffer. Rewrite it to rasterize the SVG source using sharp.

- [ ] **Step 1: Rewrite generate-icons.mjs**

Replace the entire file with:

```js
#!/usr/bin/env node
// Generate PWA icons from octopus.svg.
// Run: node scripts/generate-icons.mjs
// Requires sharp (installed in server/node_modules)

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, '..', 'server', 'assets');
const require = createRequire(path.join(__dirname, '..', 'server', 'package.json'));
const sharp = require('sharp');

const SVG_SRC = path.join(ASSETS, 'octopus.svg');

// Scale factors from spec (Lucide badge-check spans ~20 units in 24-unit space):
// "any":      scale(20.5) → 20 × 20.5 = 410px ≈ 80% of 512
// "maskable": scale(16.4) → 20 × 16.4 = 328px ≈ 64% of 512
const ANY_SCALE = 20.5;
const MASKABLE_SCALE = 16.4;

function buildSvg(scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a3a5c"/>
      <stop offset="40%" stop-color="#115e59"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256,256) scale(${scale})">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          transform="translate(-12,-12)"
          fill="rgba(255,255,255,0.93)" stroke="none"/>
    <path d="m9 12 2 2 4-4"
          transform="translate(-12,-12)"
          fill="none" stroke="#115e59"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function main() {
  for (const size of [192, 512]) {
    // "any" icon — badge at 80% fill
    await sharp(Buffer.from(buildSvg(ANY_SCALE)))
      .resize(size, size)
      .png()
      .toFile(path.join(ASSETS, `icon-${size}.png`));

    // "maskable" icon — badge at 64% fill (safe zone)
    await sharp(Buffer.from(buildSvg(MASKABLE_SCALE)))
      .resize(size, size)
      .png()
      .toFile(path.join(ASSETS, `icon-maskable-${size}.png`));

    console.log(`[octask] Generated ${size}x${size} icons`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the script**

Run: `node scripts/generate-icons.mjs`

Expected output:
```
[octask] Generated 192x192 icons
[octask] Generated 512x512 icons
```

- [ ] **Step 3: Visually verify generated PNGs**

Run: `open server/assets/icon-512.png server/assets/icon-maskable-512.png`

Verify:
- `icon-512.png`: badge-check fills ~80% of canvas
- `icon-maskable-512.png`: badge-check is smaller (~64%), more padding around edges
- Both have the navy-to-teal gradient background
- Checkmark is clearly visible

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-icons.mjs server/assets/icon-192.png server/assets/icon-512.png server/assets/icon-maskable-192.png server/assets/icon-maskable-512.png
git commit -m "feat(icon): rewrite PNG generator for SVG rasterization, generate new icons"
```

---

### Task 3: Update favicon link in dashboard HTML

**Files:**
- Modify: `server/assets/dashboard.html:10`

- [ ] **Step 1: Replace the inline data URI favicon**

In `server/assets/dashboard.html`, line 10, replace:
```html
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">
```
with:
```html
<link rel="icon" type="image/svg+xml" href="/assets/octopus.svg">
```

- [ ] **Step 2: Verify in browser**

Run: `node server/server.js` (or confirm it's already running on port 3847)

Open `http://localhost:3847` in browser. Check:
- Favicon in browser tab shows the new badge-check icon
- PWA install prompt (if triggered) shows the new icon

- [ ] **Step 3: Commit**

```bash
git add server/assets/dashboard.html
git commit -m "fix(icon): replace inline pixel-art favicon with new SVG reference"
```
