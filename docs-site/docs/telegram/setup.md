---
sidebar_position: 1
---

# Telegram Setup

Control your AI agents from anywhere using Telegram bots.

## Step 1: Create a Bot on Telegram

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `My CLI Agent`
4. Choose a username: `my_cli_agent_bot`
5. Copy the **bot token** — looks like: `123456789:ABCDefGhIJKLmnOPQRstUVwxYZ`

## Step 2: Add Token to `.env`

```env title=".env"
GEMINI_API_KEY=your-gemini-key
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJKLmnOPQRstUVwxYZ
```

## Step 3: Start the Bot

```bash
gimi telegram
```

Output:
```
  ═══ CLI-AGT Multi-Bot System ═══

  Starting all Telegram bots...

  [master] Multi-Agent Commander - Running

  Total bots running: 1
  Press Ctrl+C to stop.
```

## Step 4: Chat on Telegram

Open Telegram and message your bot:

1. Send `/start` — Get the welcome message
2. Send `/setkey YOUR_GEMINI_API_KEY` — Set your API key (the message is auto-deleted for security)
3. Just type! — `What's my system info?`

## Master Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/setkey <key>` | Set Gemini API key |
| `/create <role> [name]` | Create a new agent |
| `/list` | List all agents |
| `/switch <id>` | Switch active agent |
| `/remove <id>` | Remove an agent |
| `/reset` | Reset conversation |
| `/model <name>` | Change AI model |
| `/roles` | List available roles |
| `/status` | System status |
| `/memory [query]` | Search agent memory |
| `/help` | All commands |

## Multi-User Support

The master bot supports **multiple users**. Each person:
- Sets their own API key with `/setkey`
- Has their own agents (isolated)
- Uses their own Gemini quota

You can share the bot with your team — everyone gets their own workspace.

## Running 24/7

To keep the bot running permanently on a server:

```bash
# Install pm2
npm install -g pm2

# Start bot (use `which gimi` to find the full path if needed)
pm2 start $(which gimi) -- telegram

# Auto-restart on crash
pm2 save
pm2 startup
```

**Next:** [Multi-Bot Setup →](./multi-bot)
