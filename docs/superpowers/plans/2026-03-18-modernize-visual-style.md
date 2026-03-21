# Modernize Visual Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the warm amber visual style with a cool neutral + teal accent + Linear-style status colors + new typography.

**Architecture:** Pure visual change — CSS variables, hardcoded color values, font files, and one JS constant. No logic changes. Six files touched total.

**Tech Stack:** CSS custom properties, Google Fonts (self-hosted woff2), Pillow for PWA icon recolor.

**Spec:** `docs/superpowers/specs/2026-03-18-modernize-visual-style-design.md`

---

### Task 1: Download and install new font files

**Files:**
- Modify: `server/assets/vendor/fonts.css`
- Create: new woff2 files in `server/assets/vendor/fonts/`
- Delete: old DM Sans / DM Mono woff2 files from `server/assets/vendor/fonts/`

- [ ] **Step 1: Download Plus Jakarta Sans woff2 files (400, 500, 600, 700, latin + latin-ext)**

Use the Google Fonts CSS API to get the woff2 URLs, then download them:

```bash
# Get the CSS with woff2 URLs (need modern user-agent header for woff2)
curl -sH "User-Agent: Mozilla/5.0" \
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" \
  > /tmp/pjs-fonts.css

# Extract and download each woff2 URL, saving with descriptive names
# Parse the CSS, download each src url to server/assets/vendor/fonts/
# Name pattern: PlusJakartaSans-{weight}-{subset}.woff2
```

Download each woff2 URL from the CSS output into `server/assets/vendor/fonts/`. Keep latin and latin-ext subsets.

- [ ] **Step 2: Download JetBrains Mono woff2 files (400, 700, latin + latin-ext)**

```bash
curl -sH "User-Agent: Mozilla/5.0" \
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" \
  > /tmp/jbm-fonts.css
```

Download each woff2 URL into `server/assets/vendor/fonts/`.

- [ ] **Step 3: Rewrite `server/assets/vendor/fonts.css`**

Replace the entire file. New content should define `@font-face` blocks for:
- `Plus Jakarta Sans` weights 400, 500, 600, 700 (latin + latin-ext each)
- `JetBrains Mono` weights 400, 700 (latin + latin-ext each)

Use the same `url(/assets/vendor/fonts/...)` path pattern as the existing file. Copy `unicode-range` values from the Google Fonts CSS output.

- [ ] **Step 4: Delete old DM Sans and DM Mono font files**

Remove the 6 old woff2 files from `server/assets/vendor/fonts/`:
- `aFTU7PB1QTsUX8KYthSQBK6PYK3EXw.woff2` (DM Mono 400 latin-ext)
- `aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2` (DM Mono 400 latin)
- `aFTR7PB1QTsUX8KYvumzEY2tbYf-Vlh3uA.woff2` (DM Mono 500 latin-ext)
- `aFTR7PB1QTsUX8KYvumzEYOtbYf-Vlg.woff2` (DM Mono 500 latin)
- `rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6z9mXgjU0.woff2` (DM Sans latin-ext)
- `rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2` (DM Sans latin)

- [ ] **Step 5: Commit**

```bash
git add server/assets/vendor/
git commit -m "feat(fonts): replace DM Sans/Mono with Plus Jakarta Sans + JetBrains Mono"
```

---

### Task 2: Update CSS color system and typography variables

**Files:**
- Modify: `server/assets/dashboard.css` (lines 3-26, the `:root` block)

- [ ] **Step 1: Replace the entire `:root` block**

Old values → new values:

```css
:root {
  --bg: #f7f7f5;
  --bg-warm: #f0f0ee;
  --bg-card: #ffffff;
  --text: #1a1a1a;
  --text-secondary: #5c5c5c;
  --text-muted: #6b6b6b;
  --accent: #0d9488;
  --accent-hover: #0f766e;
  --accent-light: rgba(13, 148, 136, 0.08);
  --border: #e5e5e5;
  --border-light: #ebebeb;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.07);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
  --status-todo: #f2994a;
  --status-ongoing: #5e6ad2;
  --status-done: #4cb782;
  --status-canceled: #8b8f98;
  --radius: 10px;
  --radius-sm: 6px;
  --font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

- [ ] **Step 2: Verify no visual breakage**

```bash
# Start server if not running
./scripts/start-server.sh
```

Open `http://localhost:3847` in browser. Check: background color changed, accent teal on FAB and active states, status column headers show new palette, fonts loaded.

- [ ] **Step 3: Commit**

```bash
git add server/assets/dashboard.css
git commit -m "style: update CSS variables to new color system and typography"
```

---

### Task 3: Update hardcoded colors in CSS

**Files:**
- Modify: `server/assets/dashboard.css`

- [ ] **Step 1: Update FAB shadow colors**

Replace amber-tinted FAB shadows in `.fab` and `.fab:hover` rules.

```css
/* Old */
box-shadow: 0 4px 14px rgba(196, 97, 60, 0.35);
/* New */
box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);

/* Old hover */
box-shadow: 0 6px 20px rgba(196, 97, 60, 0.45);
/* New hover */
box-shadow: 0 6px 20px rgba(13, 148, 136, 0.45);
```

- [ ] **Step 2: Update shimmer animation colors**

Lines ~604, ~613, ~627, ~636: Replace all shimmer gradient stops.

Running shimmer (title):
```css
/* Old */ linear-gradient(90deg, #1a1917 25%, #22c55e 45%, #22c55e 55%, #1a1917 75%)
/* New */ linear-gradient(90deg, #1a1a1a 25%, #4cb782 45%, #4cb782 55%, #1a1a1a 75%)
```

Running shimmer (desc/ac):
```css
/* Old */ linear-gradient(90deg, #64748b 25%, #22c55e 45%, #22c55e 55%, #64748b 75%)
/* New */ linear-gradient(90deg, #64748b 25%, #4cb782 45%, #4cb782 55%, #64748b 75%)
```

bg-active shimmer (title):
```css
/* Old */ linear-gradient(90deg, #1a1917 25%, #3b82f6 45%, #3b82f6 55%, #1a1917 75%)
/* New */ linear-gradient(90deg, #1a1a1a 25%, #5e6ad2 45%, #5e6ad2 55%, #1a1a1a 75%)
```

bg-active shimmer (desc/ac):
```css
/* Old */ linear-gradient(90deg, #64748b 25%, #3b82f6 45%, #3b82f6 55%, #64748b 75%)
/* New */ linear-gradient(90deg, #64748b 25%, #5e6ad2 45%, #5e6ad2 55%, #64748b 75%)
```

- [ ] **Step 3: Update session capsule colors**

Lines 840-844:

```css
/* Old */
.session-capsule.running   { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
.session-capsule.idle      { background: rgba(245, 158, 11, 0.12); color: #d97706; }
.session-capsule.notfound  { background: rgba(148, 163, 184, 0.12); color: #94a3b8; }
.session-capsule.bg-active { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
/* New */
.session-capsule.running   { background: rgba(76, 183, 130, 0.12); color: #4cb782; }
.session-capsule.idle      { background: rgba(242, 153, 74, 0.12); color: #f2994a; }
.session-capsule.notfound  { background: rgba(139, 143, 152, 0.12); color: #8b8f98; }
.session-capsule.bg-active { background: rgba(94, 106, 210, 0.12); color: #5e6ad2; }
```

Permission capsule (`#a855f7` / `#9333ea`) stays as-is — purple is semantically distinct.

- [ ] **Step 4: Update modal overlay scrim**

Line 886:

```css
/* Old */
background: rgba(26,25,23,0.45);
/* New */
background: rgba(26,26,26,0.45);
```

- [ ] **Step 5: Scan for any remaining old color references**

```bash
grep -n '#f8f6f1\|#c4613c\|#1a1917\|#e3e1da\|#edebe5\|#5c5b56\|#6b6a65\|#f3f0e8\|#e09400\|#2563eb\|#16a34a\|#22c55e\|#f59e0b\|#3b82f6' server/assets/dashboard.css
```

Fix any remaining hits. Most should be gone from the variable change; this catches hardcoded leftovers.

- [ ] **Step 6: Commit**

```bash
git add server/assets/dashboard.css
git commit -m "style: update all hardcoded colors to new palette"
```

---

### Task 4: Update JavaScript status colors

**Files:**
- Modify: `server/assets/dashboard.js` (line ~45)

- [ ] **Step 1: Update STATUS_COLORS object**

```javascript
/* Old */
const STATUS_COLORS = { ongoing: '#2563eb', todo: '#e09400', done: '#16a34a', canceled: '#94a3b8' };
/* New */
const STATUS_COLORS = { ongoing: '#5e6ad2', todo: '#f2994a', done: '#4cb782', canceled: '#8b8f98' };
```

- [ ] **Step 2: Scan for any other hardcoded old colors in JS**

```bash
grep -n '#2563eb\|#e09400\|#16a34a\|#94a3b8\|#22c55e\|#f59e0b\|#1a1917\|#c4613c' server/assets/dashboard.js
```

Fix any hits.

- [ ] **Step 3: Commit**

```bash
git add server/assets/dashboard.js
git commit -m "style: update JS STATUS_COLORS to Linear palette"
```

---

### Task 5: Update HTML meta and manifest

**Files:**
- Modify: `server/assets/dashboard.html` (line 8)
- Modify: `server/assets/manifest.json` (lines 8-9)

- [ ] **Step 1: Update theme-color in HTML**

```html
<!-- Old -->
<meta name="theme-color" content="#f8f6f1">
<!-- New -->
<meta name="theme-color" content="#f7f7f5">
```

**Note:** The inline favicon SVG in `dashboard.html` contains `#c4613c` and `#d4785c` for the octopus body — **leave these unchanged**. The coral octopus on neutral background provides intentional brand contrast.

- [ ] **Step 2: Update manifest.json colors**

```json
"background_color": "#f7f7f5",
"theme_color": "#f7f7f5",
```

- [ ] **Step 3: Commit**

```bash
git add server/assets/dashboard.html server/assets/manifest.json
git commit -m "style: update theme-color and manifest to new bg color"
```

---

### Task 6: Update PWA maskable icon backgrounds

**Files:**
- Modify: `server/assets/icon-maskable-192.png`
- Modify: `server/assets/icon-maskable-512.png`

- [ ] **Step 1: Recolor icon backgrounds with Pillow**

```bash
uv run --with Pillow python3 -c "
from PIL import Image
for size in [192, 512]:
    path = f'server/assets/icon-maskable-{size}.png'
    img = Image.open(path).convert('RGBA')
    data = img.load()
    old_bg = (248, 246, 241, 255)  # #f8f6f1
    new_bg = (247, 247, 245, 255)  # #f7f7f5
    for y in range(img.height):
        for x in range(img.width):
            if data[x, y] == old_bg:
                data[x, y] = new_bg
    img.save(path)
    print(f'Updated {path}')
"
```

- [ ] **Step 2: Commit**

```bash
git add server/assets/icon-maskable-192.png server/assets/icon-maskable-512.png
git commit -m "style: update PWA icon backgrounds to #f7f7f5"
```

---

### Task 7: Visual verification

- [ ] **Step 1: Start server and verify in browser**

```bash
./scripts/start-server.sh
open http://localhost:3847
```

Check each item:
- Background is cool neutral (#f7f7f5), not warm cream
- FAB is teal, shadow is teal-tinted
- Column headers: Ongoing=indigo, Todo=soft-orange, Done=jade, Backlog=gray
- Status icons (play, clock, check, archive) match column header colors
- Cards are white with cool gray borders
- Font is Plus Jakarta Sans (check: letter 'a' should have a double-story form)
- Mono font (slugs, percentages) is JetBrains Mono
- Sidebar active section has teal left border
- Modal overlay is neutral dark scrim
- AC labels are teal
- Shimmer animations use jade green (running) and indigo (bg-active)
- **Font metrics**: Check sidebar project names, column headers, card titles for overflow or cramping. Plus Jakarta Sans has slightly wider tracking than DM Sans — adjust `font-size` or `letter-spacing` if needed.

- [ ] **Step 2: Sync to plugin cache**

```bash
./scripts/sync-to-cache.sh
```
