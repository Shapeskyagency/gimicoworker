---
sidebar_position: 2
---

# Configuration

GimiCoworker stores its configuration in an OS-specific config directory via the `conf` package, and all data in `~/.gimicoworker/`. You can also use a `.env` file in your working directory.

## The `.env` File

```env title=".env"
# ─── Required ──────────────────────────────────────────
# Your Gemini API key
GEMINI_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Telegram (optional) ──────────────────────────────
# Master bot token for multi-agent Telegram bot
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJKLmnOPQRstUVwxYZ
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key |
| `TELEGRAM_BOT_TOKEN` | No | Master Telegram bot token (for multi-agent bot) |

## Getting a Gemini API Key

1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy and paste into `.env`

### Free Tier Limits

| Model | Requests/Min | Tokens/Day |
|-------|-------------|------------|
| gemini-2.0-flash | 15 | 1,000,000 |
| gemini-2.0-flash-lite | 30 | 1,000,000 |
| gemini-2.5-pro-preview | 5 | 250,000 |
| gemini-2.5-flash-preview | 10 | 500,000 |

## Selecting a Model

Each agent can use a different model. Change it with:

```bash
# In interactive mode
/model gemini-2.5-pro-preview-05-06

# When creating via CLI
gimi run -m gemini-2.5-pro-preview-05-06 "your question"
```

### When to Use Which Model

| Use Case | Recommended Model |
|----------|------------------|
| Daily tasks, quick questions | `gemini-2.0-flash` (default) |
| Simple, high-volume tasks | `gemini-2.0-flash-lite` |
| Complex architecture, planning | `gemini-2.5-pro-preview-05-06` |
| Balanced speed & quality | `gemini-2.5-flash-preview-04-17` |

## Data Storage Locations

All data is stored in your home directory, so GimiCoworker works the same no matter which directory you run `gimi` from:

| Data | Location |
|------|----------|
| Database | `~/.gimicoworker/data/cli-agent.db` |
| Agents | `~/.gimicoworker/data/agents.json` |
| Skills | `~/.gimicoworker/skills/` |
| Config | OS-specific via `conf` package |

### Config directory by OS

| OS | Config Location |
|----|----------------|
| Windows | `AppData/gimicoworker-nodejs/` |
| macOS | `~/Library/Preferences/gimicoworker-nodejs/` |
| Linux | `~/.config/gimicoworker-nodejs/` |

The SQLite database stores:
- Agent configurations
- Conversation history
- Agent memories
- Telegram bot configs
- User settings

Agent state (for persistent agents) is stored separately in `agents.json`.

To reset everything:
```bash
rm -rf ~/.gimicoworker/data/
```

**Next:** [Your First Run →](./first-run)
