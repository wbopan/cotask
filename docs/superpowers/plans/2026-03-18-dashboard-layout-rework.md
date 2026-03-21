# Dashboard Layout Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the top header bar, move logo/title into the sidebar, replace Add Task with a FAB, and remove the Save button (auto-save suffices).

**Architecture:** The HTML already has the header removed and a `sidebar-brand` block added (from uncommitted changes). CSS still has stale header styles and lacks sidebar-brand/FAB styles. JS still references `saveBtn` (5 locations) and `globalAddTaskBtn` (1 location) which no longer exist in the DOM. All three files need to be synchronized.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step), Express server serves static assets.

---

### Task 1: CSS — Remove header styles, add sidebar-brand and FAB styles

**Files:**
- Modify: `server/assets/dashboard.css:39-71` (header section → sidebar-brand)
- Modify: `server/assets/dashboard.css:1193` (add FAB styles after line 1193, before `@media (display-mode: standalone)` block)
- Modify: `server/assets/dashboard.css:1226-1239` (remove window-controls-overlay media query)

- [ ] **Step 1: Replace header CSS block with sidebar-brand styles**

Replace lines 39-71 (the `/* ===== HEADER ===== */` section through `.header-right`) with:

```css
/* ===== SIDEBAR BRAND ===== */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 12px;
  flex-shrink: 0;
}

.sidebar-brand .logo { width: 40px; height: 40px; flex-shrink: 0; }

.sidebar-brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text);
}
```

- [ ] **Step 2: Add FAB styles before the `@media (display-mode: standalone)` block**

Insert before line 1194:

```css
/* ===== FAB ===== */
.fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(196, 97, 60, 0.35);
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  z-index: 100;
  padding: 0;
}

.fab:hover {
  background: var(--accent-hover);
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(196, 97, 60, 0.45);
  border: none;
}

.fab:active {
  transform: scale(0.95);
}

.fab svg {
  width: 28px;
  height: 28px;
}
```

- [ ] **Step 3: Delete the `@media (display-mode: window-controls-overlay)` block**

Remove lines 1226-1239 entirely (the media query that references the now-deleted `header` element).

- [ ] **Step 4: Verify CSS parses correctly**

Run: `node -e "require('fs').readFileSync('server/assets/dashboard.css', 'utf8'); console.log('CSS file reads OK')"`

- [ ] **Step 5: Commit**

```bash
git add server/assets/dashboard.css
git commit -m "style: replace header CSS with sidebar-brand and FAB styles"
```

---

### Task 2: HTML — Add the FAB button

**Files:**
- Modify: `server/assets/dashboard.html:86` (add FAB before status-bar div)

- [ ] **Step 1: Add the FAB element to the HTML**

Insert before `<div class="status-bar" id="status"></div>` (line 86):

```html
<button class="fab" id="fabAddTask" title="New Task">
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
</button>
```

- [ ] **Step 2: Commit**

```bash
git add server/assets/dashboard.html
git commit -m "feat: add FAB button for new task creation"
```

---

### Task 3: JS — Rewire FAB, remove saveBtn references

**Files:**
- Modify: `server/assets/dashboard.js:36` (remove saveBtn.disabled in undo)
- Modify: `server/assets/dashboard.js:1081` (globalAddTaskBtn → fabAddTask)
- Modify: `server/assets/dashboard.js:1118` (remove saveBtn.disabled in markChanged)
- Modify: `server/assets/dashboard.js:1128` (remove saveBtn.disabled in autoSave noop path)
- Modify: `server/assets/dashboard.js:1143` (remove saveBtn.disabled in autoSave success)
- Modify: `server/assets/dashboard.js:1377` (remove saveBtn.disabled in switchProject)
- Modify: `server/assets/dashboard.js:1438` (remove saveBtn click listener)

- [ ] **Step 1: Remove `$('saveBtn').disabled = false` from `undo()` (line 36)**

Delete the line `$('saveBtn').disabled = false;` from the undo function.

- [ ] **Step 2: Change globalAddTaskBtn to fabAddTask (line 1081)**

Change:
```js
$('globalAddTaskBtn').addEventListener('click', () => {
```
To:
```js
$('fabAddTask').addEventListener('click', () => {
```

- [ ] **Step 3: Remove `$('saveBtn').disabled = false` from `markChanged()` (line 1118)**

Delete the line `$('saveBtn').disabled = false;` from markChanged.

- [ ] **Step 4: Remove `$('saveBtn').disabled = true` from autoSave noop path (line 1128)**

Delete the line `$('saveBtn').disabled = true;` from the early-return branch in autoSave.

- [ ] **Step 5: Remove `$('saveBtn').disabled = true` from autoSave success (line 1143)**

Delete the line `$('saveBtn').disabled = true;` from the try block in autoSave.

- [ ] **Step 6: Remove `$('saveBtn').disabled = true` from switchProject (line 1377)**

Delete the line `$('saveBtn').disabled = true;` from switchProject.

- [ ] **Step 7: Remove `$('saveBtn').addEventListener('click', autoSave)` (line 1438)**

Delete the line `$('saveBtn').addEventListener('click', autoSave);`.

- [ ] **Step 8: Verify no remaining saveBtn or globalAddTaskBtn references**

Run: `grep -n 'saveBtn\|globalAddTaskBtn' server/assets/dashboard.js`
Expected: No output (zero matches).

- [ ] **Step 9: Verify the server starts and serves the dashboard**

Run: `node server/server.js &` then `curl -s http://localhost:3847/ -o /dev/null -w '%{http_code}'`
Expected: `302` (redirect to first project).

Kill the background server after verification.

- [ ] **Step 10: Commit**

```bash
git add server/assets/dashboard.js
git commit -m "refactor: rewire FAB, remove stale saveBtn references"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start the server and open the dashboard**

Run: `./scripts/start-server.sh` and open `http://localhost:3847` in the browser.

- [ ] **Step 2: Verify layout**

Check:
- No top header bar visible
- Logo (40px octopus) and "Octask" text at the top of the left sidebar
- Orange circular FAB with `+` icon in the bottom-right corner
- Clicking the FAB opens the new-task modal
- Auto-save works (drag a card → status toast says "Saved")
- No JS console errors

- [ ] **Step 3: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: layout rework polish"
```
