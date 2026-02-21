---
sidebar_position: 2
---

# Multi-Bot Setup

Create **unlimited Telegram bots**, each dedicated to a single agent role. One bot = one agent.

## Why Multiple Bots?

Instead of one bot that manages all agents (master bot), you can have:

```
@devops_bot     → DevOps Agent (deployments, Docker, CI/CD)
@coder_bot      → Coder Agent (writes and debugs code)
@security_bot   → Security Agent (audits, monitoring)
@files_bot      → File Manager (organize, search, cleanup)
@my_custom_bot  → Custom Agent (your own prompt)
```

Benefits:
- **Clean separation** — Each bot has one job
- **Easy to use** — No need to `/switch` between agents
- **Share specific bots** — Give the devops bot to your DevOps team
- **Different models** — Each bot can use a different Gemini model

## Step 1: Create Bots on Telegram

Message **@BotFather** for each bot:

```
/newbot → "DevOps Bot" → @your_devops_bot → copy token
/newbot → "Coder Bot"  → @your_coder_bot  → copy token
/newbot → "Security Bot" → @your_security_bot → copy token
```

## Step 2: Register Each Bot

```bash
# Add a DevOps bot
gimi bot:add \
  --token "TOKEN_FROM_BOTFATHER_1" \
  --name "DevOps Bot" \
  --role devops \
  --username devops_bot

# Add a Coder bot
gimi bot:add \
  --token "TOKEN_FROM_BOTFATHER_2" \
  --name "Coder Bot" \
  --role coder \
  --username coder_bot

# Add a Security bot
gimi bot:add \
  --token "TOKEN_FROM_BOTFATHER_3" \
  --name "Security Bot" \
  --role security

# Add a custom bot with your own prompt
gimi bot:add \
  --token "TOKEN_FROM_BOTFATHER_4" \
  --name "Data Analyst" \
  --role custom \
  --prompt "You are a data analyst expert in Python, pandas, and SQL"

# Add a bot with a specific model
gimi bot:add \
  --token "TOKEN_FROM_BOTFATHER_5" \
  --name "Smart Planner" \
  --role general \
  --model gemini-2.5-pro-preview-05-06
```

## Step 3: Verify

```bash
gimi bots
```

Output:
```
  Configured Telegram Bots:

  ● Master Bot (from .env)
    Role: multi-agent | Token: 8320679018...

  ● #1 DevOps Bot @devops_bot
    Role: devops | Model: gemini-2.0-flash | Token: 1111111:FA...

  ● #2 Coder Bot @coder_bot
    Role: coder | Model: gemini-2.0-flash | Token: 2222222:FA...

  ● #3 Security Bot
    Role: security | Model: gemini-2.0-flash | Token: 3333333:FA...

  ● #4 Data Analyst
    Role: custom | Model: gemini-2.0-flash | Token: 4444444:FA...
    Prompt: You are a data analyst expert in Python, pandas, a...

  ● #5 Smart Planner
    Role: general | Model: gemini-2.5-pro-preview-05-06 | Token: 5555555:FA...

  Total: 5 dedicated bot(s) + 1 master
```

## Step 4: Start ALL Bots

```bash
gimi telegram
```

This starts **every bot simultaneously**:
```
  ═══ CLI-AGT Multi-Bot System ═══

  Starting all Telegram bots...

  [master] Multi-Agent Commander - Running
  [1] DevOps Bot (devops) - Running
  [2] Coder Bot (coder) - Running
  [3] Security Bot (security) - Running
  [4] Data Analyst (custom) - Running
  [5] Smart Planner (general) - Running

  Total bots running: 6
  Press Ctrl+C to stop.
```

## Managing Bots

### List all bots
```bash
gimi bots
```

### Remove a bot
```bash
gimi bot:remove 3   # Removes bot #3
```

### Add options reference
```bash
gimi bot:add --help
```

| Option | Required | Description |
|--------|----------|-------------|
| `--token, -t` | Yes | Telegram bot token |
| `--name, -n` | Yes | Display name |
| `--role, -r` | No | Agent role (default: general) |
| `--model, -m` | No | Gemini model (default: gemini-2.0-flash) |
| `--prompt, -p` | No | Custom system prompt |
| `--username, -u` | No | Bot @username |

## Dedicated Bot Commands

Each dedicated bot has simpler commands (since it only manages one agent):

| Command | Description |
|---------|-------------|
| `/start` | Welcome + bot identity |
| `/setkey <key>` | Set Gemini API key |
| `/reset` | Reset conversation |
| `/model <name>` | Change model |
| `/status` | Bot stats |
| `/whoami` | Bot identity and role |
| `/memory [query]` | Search memory |
| `/help` | Commands |

Just type normally to chat — no need to create or switch agents.

## Architecture

```
gimi telegram
         │
         ├── Master Bot (TELEGRAM_BOT_TOKEN from .env)
         │   └── Manages multiple agents per user
         │
         ├── Dedicated Bot #1 (from DB)
         │   └── One role: DevOps
         │
         ├── Dedicated Bot #2 (from DB)
         │   └── One role: Coder
         │
         ├── Dedicated Bot #3 (from DB)
         │   └── One role: Security
         │
         └── ... unlimited
```

All bots share the same SQLite database (`~/.gimicoworker/data/cli-agent.db`), so agents can use **shared memory** to communicate across bots.
