# Octask

A Claude Code plugin that adds task management via `TASKS.md` files and a real-time kanban dashboard.

## What It Does

- **TASKS.md convention** — a lightweight task format with statuses (`[ ]` todo, `[/]` ongoing, `[x]` done, `[-]` backlog), slugs, acceptance criteria, and completion memos.
- **Kanban dashboard** — a browser-based board that parses and renders TASKS.md, with drag-and-drop status changes, live file watching (SSE), multi-project switching, and undo.
- **Slash commands** — `/starting-task` marks a task ongoing and begins work, `/creating-task` adds a new task.
- **Session tracking** — heartbeat hooks report Claude Code session state to the dashboard, with PID-based liveness detection and Ghostty tab focus integration.

## Getting Started

### 1. Install the plugin

```bash
claude plugins add-marketplace https://github.com/wbopan/octask-marketplace.git
claude plugins install octask@octask
```

### 2. Create your first task

Open any project in Claude Code and run:

```
/creating-task Set up project README
```

This creates a `TASKS.md` file in your project with your first task.

### 3. Open the dashboard

```
/dashboard
```

Claude will start the dashboard server and open it in your browser at `http://localhost:3847`. You can also save it as a PWA for quick access.

### 4. Work on tasks

Tell Claude to start a task by slug:

```
/starting-task #set-up-project-readme
```

Claude marks the task as ongoing, understands the requirements, plans the approach, then executes. The dashboard updates in real-time as work progresses.

## Commands

| Command | Description |
|---------|-------------|
| `/dashboard` | Start the dashboard server and open it in the browser |
| `/creating-task <description>` | Create a new task in TASKS.md |
| `/starting-task #slug` | Mark a task as ongoing and begin working on it |
| `/octask` | View the full TASKS.md convention reference |

## How It Works

Octask tracks tasks in a `TASKS.md` file at the project root using a simple markdown format:

```markdown
# TASKS

Project description here.

- [ ] Add user authentication #add-auth
    Implement OAuth2 login flow.
    AC: Users can log in with Google and GitHub accounts.
- [/] Fix search performance #fix-search
    Search queries over 1s need optimization.
    AC: Search returns results in under 200ms.
- [x] Set up CI pipeline #setup-ci
    CM: Configured GitHub Actions with lint, test, and build steps.
    AC: PRs run tests automatically before merge.
```

Status symbols: `[ ]` todo, `[/]` ongoing, `[x]` done, `[-]` backlog.

## Development

```bash
bun --watch server/server.js
```

Dashboard runs at `http://localhost:3847`. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

[MIT](LICENSE)
