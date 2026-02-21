---
sidebar_position: 3
---

# Telegram Commands Reference

## Master Bot Commands

The master bot (from `TELEGRAM_BOT_TOKEN` in `.env`) manages multiple agents:

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Welcome message and quick start | `/start` |
| `/setkey <key>` | Set your Gemini API key | `/setkey AIzaSy...` |
| `/create <role> [name]` | Create new agent | `/create devops MyBot` |
| `/list` | List all your agents | `/list` |
| `/switch <id>` | Switch active agent | `/switch agent_2` |
| `/remove <id>` | Remove an agent | `/remove agent_3` |
| `/reset` | Reset active agent conversation | `/reset` |
| `/model <name>` | Change active agent's model | `/model gemini-2.5-pro-preview-05-06` |
| `/roles` | List available agent roles | `/roles` |
| `/status` | System status dashboard | `/status` |
| `/memory [query]` | Search agent memory | `/memory database` |
| `/help` | Show all commands | `/help` |

## Dedicated Bot Commands

Each dedicated bot (added via `bot:add`) controls a single agent:

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Welcome + bot identity | `/start` |
| `/setkey <key>` | Set Gemini API key | `/setkey AIzaSy...` |
| `/reset` | Reset conversation | `/reset` |
| `/model <name>` | Change model | `/model gemini-2.0-flash` |
| `/status` | Bot statistics | `/status` |
| `/whoami` | Bot identity and role | `/whoami` |
| `/memory [query]` | Search memory | `/memory` |
| `/help` | Show commands | `/help` |

## Usage Examples

### Setting up from scratch
```
/start
/setkey AIzaSyAxxxxxxxxxxxxxxx
Hello! What can you do?
```

### Creating an agent team (master bot)
```
/create devops "Deploy Bot"
/create coder "Code Bot"
/create security "Guard Bot"
/list
/switch agent_2
Write a Python hello world script
```

### Checking on agents
```
/status
/list
/memory project
```

## Tips

- `/setkey` auto-deletes your message for security
- Type naturally after setting up — no commands needed for chatting
- Use `/reset` if the agent gets confused
- Tool usage is shown with a wrench icon in responses
- Long responses are automatically split into multiple messages
