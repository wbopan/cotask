---
description: Start working on a task — marks it ongoing in TASKS.md and begins execution. Use this whenever starting a task, beginning work, picking up a task, or when the user says "start", "work on", "do", "let's do", "begin", or references a task by slug. Also use when the user asks to "start task X" or just drops a task slug like "#fix-auth". Trigger on "/starting-task" too. If in doubt whether to use this, use it — it's the right entry point for any task execution.
---

## Context

- Args: {{ARGS}}
- Current TASKS.md:

!`cat TASKS.md 2>/dev/null || echo "No TASKS.md found in current directory"`

## What this command does

This is the "start button" for task execution. It bridges the gap between deciding what to work on and actually doing it — making sure the task is tracked in TASKS.md before any code gets written. Without this, tasks get started without being recorded, and the dashboard shows stale state.

## Workflow

### 1. Find the task

Look at what the user gave you in the args:

- **A `#slug`** (e.g. `#fix-auth-bug`): Match it against TASKS.md. If there's no match, say so and stop — don't guess.
- **A title or description** (e.g. "Fix the login page"): Find the closest match in TASKS.md. If nothing fits, create a new task — generate a slug, write a description, suggest an AC, and place it in the right phase.
- **Nothing**: Infer from the conversation. What has the user been talking about? What did they just ask you to do? If you genuinely can't tell, ask.

When creating a new task, always suggest an AC even if the user didn't provide one — a task without an AC is a task without a definition of done.

### 2. Mark it `[/]`

Use the `Edit` tool to change the task's checkbox:
- `[ ]` → `[/]` — the normal case
- Already `[/]` — leave it, just move on
- `[x]` or `[-]` — this task was already completed or shelved. Warn the user and ask if they want to reopen it before continuing.

### 3. Go

Announce the task briefly (title + slug), then start working. The user invoked this command because they want execution, not a planning discussion. Read the task's description and AC, then do the work.

When you finish, add a `CM:` line, report what you did, and let the user decide whether to mark it `[x]`. Don't mark it done yourself.
