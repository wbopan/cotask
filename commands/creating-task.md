---
description: Create a new task or phase in TASKS.md. Use this whenever the user wants to add, plan, or track work — even if they don't say "task" explicitly. Trigger on "add a task", "new task", "track this", "we should", "let's plan", "add a phase", "create phase", "I need to", "todo", "can you add", "put this on the board", or when the user describes future work that isn't in TASKS.md yet. Also use when creating a TASKS.md from scratch for a new project. When in doubt, use it — untracked work is invisible work.
---

## Context

- Args: {{ARGS}}
- Current TASKS.md:

!`cat TASKS.md 2>/dev/null || echo "No TASKS.md found in current directory"`

## What this command does

Creates tasks or phases in TASKS.md so work is tracked before it begins. Without this, planned work lives only in conversation and never reaches the dashboard.

## Workflow

### 1. Understand the request

Look at the args and conversation context:

- **A task title** (e.g. "Add dark mode support"): Create a task.
- **A phase title** (e.g. "Phase 4: Polish"): Create a new phase section.
- **Rich input** (e.g. "Add dark mode in Phase 2, AC: toggle works"): Extract title, phase, description, and AC.
- **Nothing or vague**: Ask the user what they want to create. Don't guess.

Before creating, scan TASKS.md for similar existing tasks. If something close already exists, point it out and ask — the user might want to update the existing task rather than create a duplicate.

### 2. Bootstrap TASKS.md if needed

If there's no TASKS.md in the project, create one from the template at `${CLAUDE_PLUGIN_ROOT}/skills/task-management/references/template.md`. Ask the user for a project title and first phase name, then fill in the template before adding the task.

### 3. Create the entry

**For a task:**

- **Target phase**: Use the phase the user specified. If none specified, use the last phase that still has `[ ]` or `[/]` tasks — that's where active work lives.
- **Slug**: Generate a `#slug` from the title (3-4 lowercase hyphenated words). Check for uniqueness in the file.
- **Status**: Default to `[-]` (backlog). If the user wants this done now (e.g. "do this", "start on this", "handle this right away"), mark `[/]` (ongoing) and begin executing the task immediately after confirmation — this becomes a `/starting-task` flow.
- **AC**: If the user provided one, use it. If not, suggest a testable, implementation-agnostic AC and flag it: "I suggested this AC — want to keep or change it?"
- **Placement**: Append at the end of the target phase's task list (before the next `## Phase` header or EOF). No blank lines between tasks.

Use `Edit` to insert. Follow the formatting from the `/task-management` skill: title line with `#slug`, indented description, `AC:` line.

**For a phase:**

- Use `## Phase N: Name` with the next sequential number.
- Draft a `Goal:` paragraph from context and confirm with the user.
- Insert after the last existing phase.
- Suggest a minimal set of tasks (3-5) that would satisfy the phase goal. These should be the smallest set of deliverables that, once done, meet the goal — not an exhaustive wishlist. Present them for the user to pick, edit, or discard before writing any to the file.

### 4. Confirm

Present each created task (or phase) in a summary table:

| Field | Value |
|-------|-------|
| Title | Fix Login Auth Bugs |
| ID | `#fix-auth-bug` |
| Phase | Phase 2: Polish |
| Status | Backlog |
| AC | SSO login succeeds on all tested providers; no 403 in logs. |

If multiple tasks were created (e.g. when bootstrapping a phase), show one table per task. If you auto-suggested the AC, note that below the table and ask if the user wants to adjust.

### 5. Resume prior work

If this command was triggered mid-task (e.g. the user thought of something to track while working on something else), don't derail the current flow. Create the task, show the summary table, and then resume whatever you were doing before the command was invoked.
