# Dashboard Quick-Create CLI Input Bar

## Summary

Replace the FAB (floating action button) with a bottom capsule input bar. User types a task description, clicks copy to get `cd {path} && claude "/creating-task {desc}"` on clipboard.

## Design

### Visual

- **Shape**: Full capsule (`border-radius: 999px`), fixed at the bottom of the board area
- **Empty state**: White capsule with `+` icon, placeholder "Describe a new task...", dimmed clipboard button
- **Filled state**: Border turns teal (`--accent`), two action buttons appear:
  - **Pencil** (outlined circle) — opens the existing new-task editor modal with description pre-filled
  - **Clipboard** (filled teal circle) — copies the CLI command to clipboard

### Behavior

- Capsule replaces the FAB button entirely
- `Enter` key triggers copy (same as clicking clipboard button)
- After copy: show "Copied" toast via `showStatus()`, clear the input
- Pencil button: calls `openNewTaskModal()` with description pre-filled, clears the input
- `Escape` blurs the input (no dismissal needed — it's always visible)

### Command Format

```
cd '/path/to/project' && claude "/creating-task {user input}"
```

Uses existing `getCurrentProjectPath()` and `shellQuote()` utilities.

### Positioning

- Fixed at bottom of `.board-wrapper`, not the viewport (so it scrolls with the board, not the sidebar)
- Horizontal padding matches board columns
- Sits where the FAB used to be, but spans the full board width

## Files Changed

| File | Changes |
|------|---------|
| `server/assets/dashboard.html` | Remove FAB button, add capsule input bar HTML |
| `server/assets/dashboard.css` | Remove `.fab` styles, add `.quick-create-bar` styles |
| `server/assets/dashboard.js` | Remove FAB click handler, add capsule input/copy/editor handlers |

## Out of Scope

- `/starting-task` toggle (may add later)
- Multi-line input / textarea expansion
- Server-side task creation (stays clipboard-only)
