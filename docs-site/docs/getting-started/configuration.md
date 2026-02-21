---
sidebar_position: 2
---

# Configuration

GimiCoworker stores its configuration in an OS-specific config directory via the `conf` package, and all data in `~/.gimicoworker/`. You can also use a `.env` file in your working directory.

## The `.env` File

```env title=".env"
# ─── Required ──────────────────────────────────────────
# At least one AI provider key is required (Gemini recommended)
GEMINI_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Additional AI Providers (optional) ─────────────────
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MOONSHOT_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Telegram (optional) ──────────────────────────────
# Master bot token for multi-agent Telegram bot
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJKLmnOPQRstUVwxYZ
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key |
| `OPENAI_API_KEY` | No | OpenAI API key (for GPT-4o, GPT-3.5, etc.) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (for Claude models) |
| `MOONSHOT_API_KEY` | No | Moonshot/Kimi API key |
| `TELEGRAM_BOT_TOKEN` | No | Master Telegram bot token (for multi-agent bot) |

:::tip Ollama (Local Models)
Ollama doesn't need an API key — it runs locally. Just install it from [ollama.ai](https://ollama.ai) and pull a model (`ollama pull llama3`).
:::

## Getting API Keys

### Google Gemini (Recommended — Free Tier)

1. Visit [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy and paste into `.env`

#### Free Tier Limits

| Model | Requests/Min | Tokens/Day |
|-------|-------------|------------|
| gemini-2.0-flash | 15 | 1,000,000 |
| gemini-2.0-flash-lite | 30 | 1,000,000 |
| gemini-2.5-pro-preview | 5 | 250,000 |
| gemini-2.5-flash-preview | 10 | 500,000 |

### OpenAI

1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add to `.env` as `OPENAI_API_KEY`

### Anthropic Claude

1. Visit [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

### Moonshot / Kimi

1. Visit the Moonshot platform
2. Generate an API key
3. Add to `.env` as `MOONSHOT_API_KEY`

## Selecting a Model

Each agent can use a different model from any provider. Change it with:

```bash
# In interactive mode
/model gemini-2.5-pro-preview-05-06
/model gpt-4o
/model claude-sonnet
/model llama3    # Ollama local model

# When creating via CLI
gimi run -m gpt-4o "your question"
```

### When to Use Which Provider

| Use Case | Recommended |
|----------|-------------|
| Daily tasks, quick questions | `gemini-2.0-flash` (default, free) |
| Complex architecture, planning | `gpt-4o` or `gemini-2.5-pro-preview` |
| Code generation, writing | `claude-sonnet` |
| Privacy-sensitive, offline | Ollama (`llama3`, `mistral`) |
| Long documents | `moonshot-v1-128k` (128K context) |

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
