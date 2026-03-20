---
name: starting-task
description: Start working on a task — marks it ongoing in TASKS.md and begins execution. Use this whenever starting a task, beginning work, picking up a task, or when the user says "start", "work on", "do", "let's do", "begin", or references a task by slug. Also use when the user asks to "start task X" or just drops a task slug like "#fix-auth". Trigger on "/starting-task" too. If in doubt whether to use this, use it — it's the right entry point for any task execution.
---

## Context

- Args: {{ARGS}}
- Current TASKS.md:

!`cat .claude/TASKS.md 2>/dev/null || echo "No .claude/TASKS.md found in current directory"`

## What this command does

This is the "start button" for task execution. It ensures the task is tracked in TASKS.md before any work begins, so the dashboard stays in sync.

## Workflow

### 1. Find the task

Look at what the user gave you in the args:

- **A `#slug`** (e.g. `#fix-auth-bug`): Match it against TASKS.md. If there's no match, say so and stop — don't guess.
- **A title or description** (e.g. "Fix the login page"): Find the closest match in TASKS.md. If nothing fits, use the `/creating-task` skill to create the task first, then continue from step 2.
- **Nothing**: Infer from the conversation. What has the user been talking about? If you genuinely can't tell, ask. If you can infer it but no matching task exists, use `/creating-task` to create it first.

**Important**: Never skip task creation. If no task exists in TASKS.md for what the user wants to do, create it first via `/creating-task`. Do not jump to solving the problem without a tracked task.

### 2. Mark it `[/]`

Edit TASKS.md to change the task's status to `[/]`. Do this before any other output.

If the task status is:
- `[ ]` → Edit it to `[/]`.
- `[/]` → Already ongoing. Skip the edit.
- `[x]` or `[-]` → Tell the user and ask if they want to reopen it.

### 3. Understand and plan

Read the task's description and AC. Before touching any code:

1. **Say what you understand** — restate the goal and AC in your own words, briefly.
2. **Outline your approach** — describe what you'll change, in what order, and why. A few bullet points is enough.

**Respect the user's args and the task description.** If either one contains execution instructions — like "plan first", "discuss before implementing", "just analyze" — follow those instructions. Present your understanding and plan, then wait for the user to respond before proceeding to step 4. Don't assume the user wants you to execute immediately.

If neither the args nor the task description asks you to stop, you may continue to step 4 in the same response.

### 4. Execute

Do the work described in your plan. When you finish, add a `CM:` line to the task, report what you did, and ask the user whether to mark it `[x]`. Don't mark it done yourself.
