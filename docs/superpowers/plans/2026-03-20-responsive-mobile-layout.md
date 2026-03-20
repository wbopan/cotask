# Responsive Mobile Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Octask dashboard usable at smaller window sizes by progressively collapsing sidebar and board columns.

**Architecture:** Two CSS media query breakpoints (≤1100px and ≤850px) with minimal JS additions. At ≤1100px the sidebar becomes an overlay. At ≤850px a column picker dropdown lets users toggle which board columns are visible. All new UI elements are hidden by default and shown only at their respective breakpoints.

**Tech Stack:** CSS media queries, vanilla JS, HTML. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-03-20-responsive-mobile-layout-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/assets/dashboard.html` | Modify | Add hamburger button, sidebar backdrop div, column picker dropdown |
| `server/assets/dashboard.css` | Modify | Add responsive styles, two `@media` blocks, overlay/backdrop/picker styles |
| `server/assets/dashboard.js` | Modify | Add `toggleSidebar()`, column picker state, `initColumnPicker()`, event listeners |

---

### Task 1: Sidebar Overlay — HTML + CSS + JS inline style fix

Add the hamburger button and backdrop to HTML, add the ≤1100px media query, and fix JS inline `style.display` on sidebar so CSS media queries can work.

**Important context:** The existing JS sets `$('sidebar').style.display = 'flex'` and `$('sidebar').style.display = 'none'` as inline styles in `loadProject()` and `showOfflineState()`. Inline styles override CSS rules (even `!important`), so the sidebar overlay media query would never take effect. We must replace these inline styles with a CSS class approach.

**Files:**
- Modify: `server/assets/dashboard.html:47` (board-header)
- Modify: `server/assets/dashboard.html:19` (app-body, add backdrop div after sidebar)
- Modify: `server/assets/dashboard.css` (append responsive block)
- Modify: `server/assets/dashboard.js` (replace inline style.display with class toggles)

- [ ] **Step 1: Add hamburger button and backdrop div to HTML**

In `dashboard.html`, change the board-header line (line 47) from:

```html
<div class="board-header"><h1 class="board-project-name" id="boardProjectName"></h1></div>
```

to:

```html
<div class="board-header">
  <button class="hamburger-btn" id="hamburgerBtn" title="Toggle sidebar">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <h1 class="board-project-name" id="boardProjectName"></h1>
</div>
```

Add a backdrop div right after the closing `</div>` of the sidebar (after line 43):

```html
<div class="sidebar-backdrop" id="sidebarBackdrop"></div>
```

Also remove the inline `style="display:none;"` from the sidebar div (line 26) and `style="display:none;"` from the board-wrapper div (line 46). These will be controlled by CSS classes instead:

Change `<div class="sidebar" id="sidebar" style="display:none;">` to `<div class="sidebar" id="sidebar">`

Change `<div class="board-wrapper" id="boardWrapper" style="display:none;">` to `<div class="board-wrapper" id="boardWrapper">`

- [ ] **Step 2: Add CSS for project-loaded visibility + hamburger + backdrop**

The sidebar and board-wrapper need to be hidden by default (replacing the inline styles), then shown when the project loads via a `.project-loaded` class on `.app-body`.

Append to `dashboard.css`, before the existing `@media` blocks:

```css
/* ===== PROJECT LOADING STATE ===== */
/* Sidebar and board hidden until project data loads (replaces inline style="display:none") */
.sidebar { display: none; }
.board-wrapper { display: none; }
.app-body.project-loaded .sidebar { display: flex; }
.app-body.project-loaded .board-wrapper { display: flex; }

/* ===== RESPONSIVE: hamburger button (hidden by default) ===== */
.hamburger-btn {
  display: none;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
}
.hamburger-btn:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

/* Sidebar backdrop (hidden by default) */
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.25);
  z-index: 199;
}
```

- [ ] **Step 3: Replace JS inline style.display with class toggles**

In `dashboard.js`, find and replace all inline style.display toggling for sidebar and boardWrapper.

Find all occurrences of:
- `$('sidebar').style.display = 'flex'` → replace with `$('appBody').classList.add('project-loaded')`
- `$('sidebar').style.display = 'none'` → replace with `$('appBody').classList.remove('project-loaded')`
- `$('boardWrapper').style.display = 'flex'` → remove (handled by same `.project-loaded` class)
- `$('boardWrapper').style.display = 'none'` → remove (handled by same `.project-loaded` class)

Specifically in `loadProject()` (around line 1366-1368), change:
```javascript
$('emptyState').style.display = 'none';
$('sidebar').style.display = 'flex';
$('boardWrapper').style.display = 'flex';
```
to:
```javascript
$('emptyState').style.display = 'none';
$('appBody').classList.add('project-loaded');
```

In `showOfflineState()` (around line 114-116), change:
```javascript
$('sidebar').style.display = 'none';
$('boardWrapper').style.display = 'none';
```
to:
```javascript
$('appBody').classList.remove('project-loaded');
```

- [ ] **Step 4: Add ≤1100px media query for sidebar overlay with slide animation**

Append to `dashboard.css`:

```css
/* ===== RESPONSIVE: ≤1100px — sidebar overlay ===== */
@media (max-width: 1100px) {
  .hamburger-btn {
    display: flex;
  }

  /* Sidebar: always positioned as overlay at this breakpoint, hidden via transform */
  .app-body.project-loaded .sidebar {
    display: flex;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    width: 350px;
    min-width: 350px;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .app-body.sidebar-open .sidebar {
    transform: translateX(0);
  }

  .app-body.sidebar-open .sidebar-backdrop {
    display: block;
  }
}
```

Note: The sidebar is always `display:flex` at this breakpoint but hidden off-screen via `transform:translateX(-100%)`. The `.sidebar-open` class slides it in with `translateX(0)`, giving a smooth slide animation. The backdrop only appears when `.sidebar-open` is active.

- [ ] **Step 5: Verify visually**

Open the dashboard in a browser, resize window to ≤1100px. Confirm:
- Sidebar disappears (slid off-screen)
- Hamburger button appears left of project name
- (Clicking it won't work yet — JS is next task)
- At >1100px, sidebar shows normally (not fixed/overlay)

- [ ] **Step 6: Commit**

```bash
git add server/assets/dashboard.html server/assets/dashboard.css server/assets/dashboard.js
git commit -m "feat: add sidebar overlay HTML/CSS for ≤1100px breakpoint

Replace inline style.display with .project-loaded class so CSS media
queries can control sidebar visibility. Sidebar slides in/out via
transform at narrow viewports."
```

---

### Task 2: Sidebar Overlay — JS Toggle

Wire up the hamburger button and backdrop click to toggle sidebar visibility.

**Files:**
- Modify: `server/assets/dashboard.js` (add toggleSidebar function and event listeners)

- [ ] **Step 1: Add toggleSidebar function and event listeners**

Add the following to `dashboard.js`, right after the `uid()` function (around line 141):

```javascript
// ===== SIDEBAR TOGGLE (responsive) =====
function toggleSidebar() {
  $('appBody').classList.toggle('sidebar-open');
}

function closeSidebar() {
  $('appBody').classList.remove('sidebar-open');
}

$('hamburgerBtn').addEventListener('click', toggleSidebar);
$('sidebarBackdrop').addEventListener('click', closeSidebar);
```

- [ ] **Step 2: Close sidebar on project switch**

In the `switchProject()` function (around line 1449), add `closeSidebar();` as the first line inside the function, before the `if (newProjectId === projectId) return;` check — actually add it right after that guard:

Find in `dashboard.js`:
```javascript
async function switchProject(newProjectId) {
    if (newProjectId === projectId) return;
```

Add after the guard:
```javascript
    closeSidebar();
```

- [ ] **Step 3: Verify visually**

Open dashboard, resize to ≤1100px:
- Click hamburger → sidebar slides over content with backdrop
- Click backdrop → sidebar closes
- Click hamburger again → reopens
- Switch project in sidebar → sidebar closes

- [ ] **Step 4: Commit**

```bash
git add server/assets/dashboard.js
git commit -m "feat: wire up sidebar overlay toggle for ≤1100px"
```

---

### Task 3: Column Picker — HTML + CSS

Add the column picker dropdown button and dropdown menu to the board header, styled and hidden by default, shown at ≤850px.

**Files:**
- Modify: `server/assets/dashboard.html:47-51` (board-header area)
- Modify: `server/assets/dashboard.css` (column picker styles + ≤850px media query)

- [ ] **Step 1: Add column picker HTML to board-header**

In `dashboard.html`, update the board-header (which now contains the hamburger + h1) to also include the column picker. The full board-header becomes:

```html
<div class="board-header">
  <button class="hamburger-btn" id="hamburgerBtn" title="Toggle sidebar">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <h1 class="board-project-name" id="boardProjectName"></h1>
  <div class="column-picker" id="columnPicker">
    <button class="column-picker-btn" id="columnPickerBtn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span id="columnPickerLabel">2 / 4</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="column-picker-dropdown" id="columnPickerDropdown"></div>
  </div>
</div>
```

- [ ] **Step 2: Add column picker CSS**

Append to `dashboard.css`, after the hamburger/backdrop styles but before the media queries:

```css
/* ===== RESPONSIVE: column picker (hidden by default) ===== */
.column-picker {
  display: none;
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.column-picker-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font);
  transition: border-color 0.15s;
}

.column-picker-btn:hover {
  border-color: var(--text-muted);
}

.column-picker-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  min-width: 180px;
  z-index: 100;
}

.column-picker-dropdown.open {
  display: block;
}

.column-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background 0.1s;
  font-size: 12px;
}

.column-picker-row:hover {
  background: var(--bg-warm);
}

.column-picker-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid var(--border);
  transition: background 0.15s, border-color 0.15s;
}

.column-picker-row.active .column-picker-check {
  border-color: transparent;
  color: white;
}

.column-picker-check svg {
  width: 10px;
  height: 10px;
}

.column-picker-name {
  font-weight: 600;
  flex: 1;
}

.column-picker-count {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--mono);
}
```

- [ ] **Step 3: Add ≤850px media query**

Append to `dashboard.css`:

```css
/* ===== RESPONSIVE: ≤850px — column picker visible ===== */
@media (max-width: 850px) {
  .column-picker {
    display: flex;
  }

  .status-column.column-hidden {
    display: none;
  }

  .status-column {
    min-width: 0;
  }
}
```

- [ ] **Step 4: Verify visually**

Resize to ≤850px. Confirm:
- Column picker button appears right-aligned in board header
- Shows "2 / 4" text
- Dropdown doesn't open yet (JS is next)
- All 4 columns still visible (hiding logic is next)

- [ ] **Step 5: Commit**

```bash
git add server/assets/dashboard.html server/assets/dashboard.css
git commit -m "feat: add column picker HTML/CSS for ≤850px breakpoint"
```

---

### Task 4: Column Picker — JS Logic

Wire up the column picker: toggle dropdown, toggle column visibility, persist to localStorage, update count label.

**Files:**
- Modify: `server/assets/dashboard.js`

- [ ] **Step 1: Add column visibility state and init function**

Add after the `closeSidebar()` function:

```javascript
// ===== COLUMN PICKER (responsive) =====
const COLUMN_PICKER_DEFAULT = ['ongoing', 'todo'];
const COLUMN_PICKER_STORAGE_KEY = 'octask-visible-columns';

let visibleColumns = (() => {
  try {
    const stored = localStorage.getItem(COLUMN_PICKER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...COLUMN_PICKER_DEFAULT];
})();

function isNarrowViewport() {
  return window.matchMedia('(max-width: 850px)').matches;
}

function applyColumnVisibility() {
  if (!isNarrowViewport()) {
    // Wide/medium: show all columns
    document.querySelectorAll('.status-column').forEach(col => {
      col.classList.remove('column-hidden');
    });
    return;
  }
  document.querySelectorAll('.status-column').forEach(col => {
    const status = col.dataset.status;
    col.classList.toggle('column-hidden', !visibleColumns.includes(status));
  });
}

function toggleColumnVisibility(status) {
  const idx = visibleColumns.indexOf(status);
  if (idx !== -1) {
    if (visibleColumns.length <= 1) return; // keep at least 1 visible
    visibleColumns.splice(idx, 1);
  } else {
    visibleColumns.push(status);
  }
  localStorage.setItem(COLUMN_PICKER_STORAGE_KEY, JSON.stringify(visibleColumns));
  applyColumnVisibility();
  renderColumnPickerDropdown();
  updateColumnPickerLabel();
}

function updateColumnPickerLabel() {
  $('columnPickerLabel').textContent = `${visibleColumns.length} / ${STATUS_ORDER.length}`;
}

function renderColumnPickerDropdown() {
  const dropdown = $('columnPickerDropdown');
  dropdown.innerHTML = '';
  STATUS_ORDER.forEach(status => {
    const isActive = visibleColumns.includes(status);
    const color = STATUS_COLORS[status];
    const row = document.createElement('div');
    row.className = `column-picker-row ${isActive ? 'active' : ''}`;
    row.innerHTML = `
      <div class="column-picker-check" style="${isActive ? `background:${color};` : ''}">
        ${isActive ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>' : ''}
      </div>
      <span class="column-picker-name" style="${isActive ? `color:${color}` : 'color:var(--text-muted)'}">${STATUS_LABELS[status]}</span>
      <span class="column-picker-count">${sections.flatMap(s => s.tasks).filter(t => t.status === status).length}</span>
    `;
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleColumnVisibility(status);
    });
    dropdown.appendChild(row);
  });
}
```

- [ ] **Step 2: Add dropdown open/close logic**

Add after the dropdown rendering code:

```javascript
$('columnPickerBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = $('columnPickerDropdown');
  const isOpen = dropdown.classList.contains('open');
  if (isOpen) {
    dropdown.classList.remove('open');
  } else {
    renderColumnPickerDropdown();
    dropdown.classList.add('open');
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.column-picker')) {
    $('columnPickerDropdown').classList.remove('open');
  }
});
```

- [ ] **Step 3: Hook into renderBoard to apply visibility**

In the existing `renderBoard()` function, find the closing of the `STATUS_ORDER.forEach` loop. Right after the line `board.appendChild(col);` (inside the forEach), add the column-hidden class application.

Actually, it's simpler to call `applyColumnVisibility()` after the entire `renderBoard()` finishes. Find the `render()` function:

```javascript
function render() {
  renderSidebar();
  renderBoard();
  lucide.createIcons();
```

Change it to:

```javascript
function render() {
  renderSidebar();
  renderBoard();
  applyColumnVisibility();
  updateColumnPickerLabel();
  lucide.createIcons();
```

- [ ] **Step 4: Add resize listener**

Add after the dropdown close listener:

```javascript
// Re-apply column visibility when crossing the 850px breakpoint
window.matchMedia('(max-width: 850px)').addEventListener('change', () => {
  applyColumnVisibility();
});
```

- [ ] **Step 5: Verify end-to-end**

Open dashboard, resize through all breakpoints:
- \>1100px: full sidebar + 4 columns, no hamburger, no column picker
- ≤1100px: sidebar hidden, hamburger works, 4 columns visible, no column picker
- ≤850px: column picker appears showing "2 / 4", only Ongoing + Pending visible
- Click column picker → dropdown opens with checkboxes
- Toggle Backlog on → 3 columns show, label says "3 / 4"
- Toggle Ongoing off → prevented if it's the last column
- Reload page → column selection persists
- Resize back to >1100px → all 4 columns visible, picker hidden

- [ ] **Step 6: Commit**

```bash
git add server/assets/dashboard.js
git commit -m "feat: wire up column picker with localStorage persistence"
```

---

### Task 5: Polish and Edge Cases

Handle edge cases: Escape to close dropdown, close sidebar on Escape, ensure board-header layout is correct at all breakpoints.

**Files:**
- Modify: `server/assets/dashboard.js` (keyboard handlers)
- Modify: `server/assets/dashboard.css` (board-header flex at all sizes)

- [ ] **Step 1: Add Escape key handling**

Find the existing keydown listener in `dashboard.js`:

```javascript
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); autoSave(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey && !isTextInput(e.target)) { e.preventDefault(); undo(); }
});
```

Add before the existing handlers:

```javascript
  // Close overlays on Escape
  if (e.key === 'Escape') {
    if ($('columnPickerDropdown').classList.contains('open')) {
      $('columnPickerDropdown').classList.remove('open');
      return;
    }
    if ($('appBody').classList.contains('sidebar-open')) {
      closeSidebar();
      return;
    }
  }
```

- [ ] **Step 2: Make board-header flex at all sizes**

The current `.board-header` has only padding, no `display:flex`. The hamburger and column picker need flex layout. Update the base style.

In `dashboard.css`, find:
```css
.board-header {
  padding: 20px 24px 16px;
  flex-shrink: 0;
  background: var(--bg);
}
```

Change to:
```css
.board-header {
  padding: 20px 24px 16px;
  flex-shrink: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  gap: 12px;
}
```

- [ ] **Step 3: Verify everything works together**

Full regression test:
- \>1100px: layout unchanged, hamburger hidden, column picker hidden
- ≤1100px: hamburger visible, sidebar overlay works, Escape closes it
- ≤850px: column picker visible, toggles work, Escape closes dropdown
- Drag-and-drop works on visible columns
- Edit modal opens correctly
- Quick create FAB works
- SSE file watching still works
- Project switching works and closes sidebar

- [ ] **Step 4: Commit**

```bash
git add server/assets/dashboard.css server/assets/dashboard.js
git commit -m "feat: add keyboard handling and polish for responsive layout"
```
