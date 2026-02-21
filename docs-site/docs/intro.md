---
sidebar_position: 1
slug: /
---

# GimiCoworker

**Multi-AI Agent OS Control System — Gemini, OpenAI, Claude, Moonshot & Ollama**

GimiCoworker lets you create **unlimited AI agents**, each with a specialized role, that can **fully control your computer**. Manage files, run commands, monitor processes, make API calls, automate social media, scrape websites — all through natural language. Access your agents from the terminal or remotely via **Telegram**.

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
You:   "Send a WhatsApp message to John: the deployment is done"
Agent: *whatsapp_send* Message sent to John successfully.
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent** | Create unlimited agents with different roles |
| **5 AI Providers** | Gemini, OpenAI, Claude, Moonshot/Kimi, Ollama (local) |
| **60+ Tools** | Shell, filesystem, network, social media, vision, scraping, and more |
| **Persistent Memory** | Agents remember across conversations (SQLite) |
| **Persistent Agents** | Agents survive restarts — automatically saved and restored |
| **Shared Memory** | Agents communicate with each other |
| **Folder Restrictions** | Lock agents to specific directories |
| **Telegram Bots** | Unlimited bots, each controlling one agent |
| **Social Media** | WhatsApp (12 tools) and Instagram (19 tools) automation |
| **Vision & Scraping** | Take screenshots, analyze images, scrape webpages |
| **Workflows** | Multi-step automation pipelines with variable interpolation |
| **Task Scheduler** | Cron-based recurring AI tasks |
| **8 Built-in Roles** | General, DevOps, Coder, Security, SysAdmin, FileManager, Researcher, Custom |
| **Per-Agent Models** | Each agent can use a different AI provider and model |
| **Auto Update** | Checks for new versions on startup; update with `gimi update` |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│               CLI   /   Telegram Bots                    │
│              (User Interface Layer)                       │
├──────────────────────────────────────────────────────────┤
│                  Agent Manager                            │
│       (Create, Switch, Remove, Restrict)                  │
├────────┬────────┬────────┬────────┬──────────────────────┤
│Agent 1 │Agent 2 │Agent 3 │  ...   │      Agent N         │
│Gemini  │OpenAI  │Claude  │        │      Ollama          │
├────────┴────────┴────────┴────────┴──────────────────────┤
│              Multi-Provider AI Layer                      │
│    Gemini │ OpenAI │ Claude │ Moonshot │ Ollama           │
├──────────────────────────────────────────────────────────┤
│              Tool Registry (60+ tools)                    │
│ Shell │ Files │ Process │ Network │ Memory │ Social       │
│ Vision │ Scraping │ Clipboard │ Notifications             │
├──────────────────────────────────────────────────────────┤
│       Workflow Engine  │  Task Scheduler (Cron)           │
├──────────────────────────────────────────────────────────┤
│          Data Storage (~/.gimicoworker/)                   │
│  SQLite DB │ Agents JSON │ Skills │ Config                │
└──────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
npm install -g gimicoworker
```

Set your API key on first run:
```
GEMINI_API_KEY=your-api-key-here
```

Optionally add other providers:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MOONSHOT_API_KEY=sk-...
```

Run:
```bash
gimi
```

That's it. You're talking to an AI agent that controls your OS. Your agents persist across restarts, and all data is stored in `~/.gimicoworker/` so it works no matter which directory you run `gimi` from.

**Next:** [Installation Guide →](./getting-started/installation)
