---
sidebar_position: 100
---

# CLI Reference

Complete reference of all CLI commands and interactive mode commands.

## CLI Commands

Run these from your terminal:

### `gimi` (interactive mode)
Start the full interactive multi-agent session.

```bash
gimi
gimi interactive
gimi i
```

On startup, GimiCoworker automatically checks the npm registry for new versions. If an update is available, you will see a banner:
```
Update available: 1.0.0 → 1.1.0 / Run: gimi update
```

Previously created agents are also restored automatically:
```
Restored 3 agent(s) from previous session
```

### `gimi run <message>`
Send a single message and get a response.

```bash
gimi run "What's my disk usage?"
gimi run -r coder "Write a hello world in Python"
gimi run -m gpt-4o "Plan an API"
```

| Flag | Description |
|------|-------------|
| `-r, --role <role>` | Agent role (default: general) |
| `-m, --model <model>` | AI model to use (any provider) |

### `gimi exec <command>`
AI-interpreted command execution.

```bash
gimi exec "show disk usage"
gimi exec "find large files"
```

### `gimi update`
Check for and install the latest version from npm.

```bash
gimi update
```

This updates the globally installed `gimicoworker` package to the latest version.

### `gimi uninstall`
Completely remove GimiCoworker and all its data from your system.

```bash
gimi uninstall
```

This performs a full cleanup:
- Removes the config directory (`AppData/gimicoworker-nodejs/` on Windows)
- Removes the data directory (`~/.gimicoworker/` — skills, agents, database)
- Asks to self-uninstall the npm package (`npm uninstall -g gimicoworker`)

After uninstall, nothing remains on the system.

### `gimi telegram`
Start all Telegram bots.

```bash
gimi telegram
gimi tg
```

### `gimi bot:add`
Register a new dedicated Telegram bot.

```bash
gimi bot:add -t TOKEN -n "Bot Name" -r coder
```

| Flag | Required | Description |
|------|----------|-------------|
| `-t, --token` | Yes | Bot token from @BotFather |
| `-n, --name` | Yes | Display name |
| `-r, --role` | No | Agent role (default: general) |
| `-m, --model` | No | AI model (default: gemini-2.0-flash) |
| `-p, --prompt` | No | Custom system prompt |
| `-u, --username` | No | Bot @username |

### `gimi bot:list`
List all configured Telegram bots.

```bash
gimi bots
gimi bot:list
```

### `gimi bot:remove <id>`
Remove a dedicated bot by ID.

```bash
gimi bot:remove 3
```

### `gimi roles`
List all available agent roles.

### `gimi models`
List all available AI models across all providers.

---

## Interactive Mode Commands

These commands work inside the interactive session (`gimi`):

| Command | Description |
|---------|-------------|
| `/create <role> [name]` | Create a new agent |
| `/create custom` | Create agent with custom prompt |
| `/list` | List all agents with stats |
| `/switch <id>` | Switch to another agent |
| `/remove <id>` | Delete an agent |
| `/rename <name>` | Rename active agent |
| `/restrict <folders...>` | Restrict agent to specific folders |
| `/restrict clear` | Remove folder restrictions |
| `/restrict` | Show current restrictions |
| `/reset` | Reset conversation (keeps memory) |
| `/tools` | Show all available tools |
| `/model <model>` | Change AI model (any provider) |
| `/status` | System status dashboard |
| `/history` | Show last 20 messages |
| `/clear` | Clear the terminal |
| `/help` | Show all commands |
| `/exit` | Save all agents and exit |

:::note
When you `/exit`, all agents are automatically saved to `~/.gimicoworker/data/agents.json`. On the next startup, they are restored automatically.
:::

---

## Data Storage Locations

All data is stored in your home directory and persists regardless of which directory you run `gimi` from:

| Data | Location |
|------|----------|
| Database | `~/.gimicoworker/data/cli-agent.db` |
| Agents | `~/.gimicoworker/data/agents.json` |
| Skills | `~/.gimicoworker/skills/` |
| Config | OS-specific via `conf` package (`AppData` on Windows, `~/Library` on macOS, `~/.config` on Linux) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic Claude API key |
| `MOONSHOT_API_KEY` | No | Moonshot/Kimi API key |
| `TELEGRAM_BOT_TOKEN` | No | Master Telegram bot token |

Set in `.env` file or as system environment variables.
