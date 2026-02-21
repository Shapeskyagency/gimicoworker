---
sidebar_position: 1
slug: /
---

# CLI-AGT

**Multi-Agent OS Control System powered by Google Gemini**

CLI-AGT lets you create **unlimited AI agents**, each with a specialized role, that can **fully control your computer**. Manage files, run commands, monitor processes, make API calls — all through natural language. Access your agents from the terminal or remotely via **Telegram**.

## What Can It Do?

```
You:   "Find all JavaScript files larger than 1MB and list them by size"
Agent: *searches filesystem* Found 3 files:
       D:\projects\bundle.js (4.2 MB)
       D:\projects\vendor.js (2.1 MB)
       D:\projects\app.min.js (1.3 MB)
```

```
You:   "Set up a new React project in D:\projects\my-app"
Agent: *executes commands* Created React project with TypeScript template.
       Installed dependencies. Project ready at D:\projects\my-app
```

```
You:   "Check which ports are open and what's listening on port 3000"
Agent: *checks network* Port 3000: node.exe (PID 12345) - your dev server
       Port 5432: postgres (PID 6789) - PostgreSQL database
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent** | Create unlimited agents with different roles |
| **29 OS Tools** | Shell, filesystem, processes, network, memory |
| **Persistent Memory** | Agents remember across conversations (SQLite) |
| **Persistent Agents** | Agents survive restarts — automatically saved and restored |
| **Shared Memory** | Agents communicate with each other |
| **Folder Restrictions** | Lock agents to specific directories |
| **Telegram Bots** | Unlimited bots, each controlling one agent |
| **7 Built-in Roles** | General, DevOps, Coder, Security, SysAdmin, FileManager, Researcher |
| **Custom Roles** | Define your own agent with a custom prompt |
| **Multiple Models** | Gemini Flash, Pro, and more per agent |
| **Auto Update** | Checks for new versions on startup; update with `gimi update` |
| **Home Directory Storage** | All data stored in `~/.gimicoworker/` — works from any directory |

## Architecture

```
┌──────────────────────────────────────────────────┐
│              CLI   /   Telegram Bots              │
│             (User Interface Layer)                │
├──────────────────────────────────────────────────┤
│                Agent Manager                      │
│      (Create, Switch, Remove, Restrict)           │
├───────┬───────┬───────┬───────┬──────────────────┤
│Agent 1│Agent 2│Agent 3│  ...  │     Agent N      │
│General│DevOps │Coder  │       │     Custom       │
├───────┴───────┴───────┴───────┴──────────────────┤
│              Gemini API Client                    │
│         (Tool calling + Chat loop)                │
├──────────────────────────────────────────────────┤
│             Tool Registry (29 tools)              │
│ Shell │ Files │ Process │ Network │ Memory        │
├──────────────────────────────────────────────────┤
│         Data Storage (~/.gimicoworker/)           │
│  SQLite DB │ Agents JSON │ Skills │ Config        │
└──────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install -g gimicoworker
```

Set your API key on first run:
```
GEMINI_API_KEY=your-api-key-here
```

Run:
```bash
gimi
```

That's it. You're talking to an AI agent that controls your OS. Your agents persist across restarts, and all data is stored in `~/.gimicoworker/` so it works no matter which directory you run `gimi` from.

**Next:** [Installation Guide →](./getting-started/installation)
