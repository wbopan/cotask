# Octask

A Claude Code plugin that adds task management via `TASKS.md` files and a real-time kanban dashboard.

## What It Does

- **TASKS.md convention** — a lightweight task format with statuses (`[ ]` todo, `[/]` ongoing, `[x]` done, `[-]` backlog), slugs, acceptance criteria, and completion memos.
- **Kanban dashboard** — a browser-based board that parses and renders TASKS.md, with drag-and-drop status changes, live file watching (SSE), multi-project switching, and undo.
- **Slash commands** — `/dashboard` opens the board, `/starting-task` marks a task ongoing and begins work, `/creating-task` adds a new task.
- **Session tracking** — heartbeat hooks report Claude Code session state to the dashboard, with PID-based liveness detection and Ghostty tab focus integration.

## Install

```bash
claude plugins install octask@octask-marketplace
```

After installation, the `task-dashboard` CLI command is available to start the server directly.

## Usage

```bash
# Open the dashboard from Claude Code
/dashboard

# Start working on a task
/starting-task #my-task-slug

# Create a new task
/creating-task Add dark mode support
```

## Development

```bash
cd server && npm install --production
node --watch server/server.js
```

Dashboard runs at `http://localhost:3847`. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

[MIT](LICENSE)
