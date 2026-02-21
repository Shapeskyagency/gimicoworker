# GimiCoworker

**Multi-AI Agent OS Control System**

Build unlimited AI agents that can fully control your computer. Supports **Gemini, OpenAI, Claude, Moonshot/Kimi, and Local AI (Ollama)**. Access agents from your terminal or remotely via Telegram. Full WhatsApp & Instagram automation. Every agent has persistent memory across conversations.

```bash
npm install -g gimicoworker
gimi
```

---

## Features

- **Multi-AI Provider** — Gemini, OpenAI, Claude, Moonshot/Kimi, Ollama (Local AI)
- **Unlimited Agents** — Create as many AI agents as you need, each with a different role
- **54+ Tools** — Shell, files, processes, network, web scraping, clipboard, vision, notifications, social media
- **WhatsApp Automation** — Send/read messages, auto-reply, message watcher, unread detection
- **Instagram Automation** — DMs, like/comment posts, analytics, daily growth reports, auto-reply
- **Telegram Bots** — Master bot + unlimited dedicated bots, control from anywhere
- **Workflow Engine** — Build multi-step automation pipelines with variable interpolation
- **Task Scheduler** — Cron-based scheduled prompts
- **Persistent Agents** — Your agents survive restarts, pick up where you left off
- **Persistent Memory** — SQLite-backed memory that survives across conversations
- **Shared Memory** — Agents can share knowledge with each other
- **Agent Templates** — Save and reuse agent configurations
- **Pipeline Mode** — Pipe stdin through AI: `cat logs.txt | gimi pipe "analyze"`
- **Skills System** — Install community skills from [openclaw/skills](https://github.com/openclaw/skills)
- **9 Built-in Roles** — General, DevOps, Security, FileManager, Coder, SysAdmin, Researcher, Social, Custom
- **Interactive Onboarding** — Guided setup wizard on first run
- **Auto Updates** — Checks for new versions and updates with one command
- **Clean Uninstall** — Removes 100% of data, config, and package from your computer

---

## Quick Start

### Install

```bash
npm install -g gimicoworker
```

### Run

```bash
gimi
```

On first run, the interactive setup wizard will guide you through:
1. Choose your AI provider (Gemini, OpenAI, Claude, Moonshot, Local AI)
2. Enter your API key (saved securely, never asked again)
3. Choose your default model
4. Optional: Set up Telegram bot

That's it! Start chatting with your AI agent.

---

## Supported AI Providers

| Provider | Models | API Key |
|----------|--------|---------|
| **Google Gemini** | gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite, + more | [Get key](https://aistudio.google.com/apikey) |
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo | [Get key](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | claude-sonnet-4-20250514, claude-haiku-4-20250414, claude-3-opus | [Get key](https://console.anthropic.com/settings/keys) |
| **Moonshot/Kimi** | moonshot-v1-128k, moonshot-v1-32k, moonshot-v1-8k | [Get key](https://platform.moonshot.cn/console/api-keys) |
| **Local AI (Ollama)** | llama3, codellama, mistral, mixtral, + any Ollama model | No key needed |

Switch provider anytime:
```bash
gimi config
```

---

## CLI Commands

### Terminal Commands

```bash
gimi                          # Start interactive session
gimi setup                    # Re-run setup wizard
gimi config                   # Change provider, API key, model
gimi run "your question"      # Quick single question
gimi run -r coder "fix this"  # Use a specific role
gimi exec "show disk usage"   # Execute via AI agent
gimi providers                # List all providers
gimi models                   # List available models
gimi roles                    # List agent roles
gimi social whatsapp          # Launch WhatsApp manager
gimi social instagram         # Launch Instagram manager
gimi skill install owner/name # Install a skill
gimi skill list               # List installed skills
gimi skill search query       # Search skills
gimi telegram                 # Start Telegram bots
gimi bot:add -t TOKEN -n Name # Add dedicated Telegram bot
gimi bot:list                 # List Telegram bots
gimi export ./backup.json     # Export all data
gimi import ./backup.json     # Import data
gimi update                   # Update to latest version
gimi uninstall                # Completely remove from computer
```

### Pipeline Mode

```bash
# Pipe any input through AI
cat logs.txt | gimi pipe "Analyze these errors"
git diff | gimi pipe -r coder "Review this diff"
cat data.csv | gimi pipe -r researcher "Summarize this data"
```

### Interactive Mode Commands

| Command | Description |
|---------|-------------|
| `/create <role> [name]` | Create a new agent |
| `/create custom` | Create agent with your own prompt |
| `/list` | List all agents |
| `/switch <id>` | Switch active agent |
| `/remove <id>` | Remove an agent |
| `/rename <name>` | Rename active agent |
| `/restrict <folders>` | Restrict agent to specific folders |
| `/social wa` | Open WhatsApp Web |
| `/social ig` | Open Instagram |
| `/social status` | Check social connections |
| `/social unread` | Check WhatsApp unread |
| `/social watch` | Start WhatsApp message watcher |
| `/social autoreply` | Manage WhatsApp auto-replies |
| `/social like <user> [n]` | Like Instagram posts |
| `/social comment <user>` | Comment on Instagram post |
| `/social analytics` | Instagram analytics |
| `/social report` | Instagram daily report |
| `/social dmwatch` | Start Instagram DM watcher |
| `/workflow create` | Create automation workflow |
| `/workflow list` | List workflows |
| `/workflow run <id>` | Run a workflow |
| `/schedule add` | Add a scheduled task |
| `/schedule list` | List scheduled tasks |
| `/template save` | Save agent as template |
| `/template load` | Load agent from template |
| `/export <path>` | Export all data to JSON |
| `/import <path>` | Import data from JSON |
| `/tools` | List all 54+ tools |
| `/model <model>` | Change AI model |
| `/config` | Open config menu |
| `/status` | System dashboard |
| `/help` | Show all commands |
| `/exit` | Exit (agents saved automatically) |

---

## Social Media Automation

### WhatsApp

```bash
# Start WhatsApp (scan QR code on first launch)
/social wa

# Then ask your social agent:
"Send hello to John"
"Read last 10 messages from Mom"
"Check unread messages"
"Start watching for new messages"
"Auto-reply to everyone: I'm busy, will respond later"
```

**WhatsApp Tools (12):** connect, wait_login, send, get_chats, read_messages, get_unread, mark_read, watch, auto_reply, search, status, disconnect

### Instagram

```bash
# Start Instagram (login on first launch)
/social ig

# Then ask your social agent:
"Like 5 posts from @thevibefounder"
"Comment 'Great post!' on @user's latest"
"Send DM to @user: Hey, loved your content!"
"Show me my analytics"
"Generate a daily growth report"
"Auto-reply to DMs: Thanks for reaching out!"
```

**Instagram Tools (19):** connect, wait_login, like_post, like_multiple, comment, send_dm, get_inbox, read_dm, watch_dm, auto_reply, post, analytics, daily_report, get_profile, follow, unfollow, get_notifications, status, disconnect

---

## Workflow Engine

Build multi-step automation pipelines:

```
/workflow create
Name: Daily Report
Steps:
  1. Check Instagram analytics
  2. Generate growth report
  3. Send summary to WhatsApp contact
```

Workflows support variable interpolation with `{{varName}}` syntax.

---

## Task Scheduler

Schedule recurring AI tasks:

```
/schedule add
Cron: 0 9 * * *          (Every day at 9 AM)
Prompt: Generate Instagram daily report and send to my WhatsApp
```

---

## Agent Roles

| Role | Specialization |
|------|---------------|
| `general` | General-purpose assistant |
| `coder` | Programming, debugging, code review |
| `researcher` | Web research, data analysis |
| `writer` | Content creation, documentation |
| `social` | WhatsApp & Instagram management, business/sales |
| `sysadmin` | System administration |
| `devops` | CI/CD, deployment, infrastructure |
| `security` | Security auditing, vulnerability analysis |
| `filemanager` | File organization, bulk operations |

---

## All 54+ Tools

| Category | Tools |
|----------|-------|
| **Shell** | execute_command, execute_powershell, run_background_process |
| **Files** | read_file, write_file, list_directory, move_path, copy_path, delete_path, search_files, search_in_files |
| **Process** | list_processes, kill_process, get_resource_usage |
| **System** | get_system_info, get_environment_variable, set_environment_variable, get_installed_programs |
| **Network** | http_request, check_port, get_network_info, ping_host, download_file |
| **Memory** | memory_save, memory_recall, memory_list, memory_forget, shared_memory_save, shared_memory_recall |
| **WhatsApp** | whatsapp_connect, whatsapp_wait_login, whatsapp_send, whatsapp_get_chats, whatsapp_read_messages, whatsapp_get_unread, whatsapp_mark_read, whatsapp_watch, whatsapp_auto_reply, whatsapp_search, whatsapp_status, whatsapp_disconnect |
| **Instagram** | instagram_connect, instagram_wait_login, instagram_like_post, instagram_like_multiple, instagram_comment, instagram_send_dm, instagram_get_inbox, instagram_read_dm, instagram_watch_dm, instagram_auto_reply, instagram_post, instagram_analytics, instagram_daily_report, instagram_get_profile, instagram_follow, instagram_unfollow, instagram_get_notifications, instagram_status, instagram_disconnect |
| **Scraping** | scrape_webpage, extract_links |
| **Vision** | take_screenshot, analyze_image |
| **Clipboard** | clipboard_read, clipboard_write |
| **Notifications** | send_notification |

---

## Persistent Memory

Every agent has persistent SQLite-backed memory:

- **Save memories** — Important facts, preferences, decisions
- **Recall memories** — Search past knowledge
- **Share globally** — Write to shared memory other agents can read
- **Categories** — general, user_preference, project, decision, fact, task

```
You: My project uses React with TypeScript
Agent: I'll remember that. (saves to memory)

--- next day ---

You: Set up a new component
Agent: (recalls your tech stack) Creating a React TypeScript component...
```

---

## Telegram Setup

### Master Bot

```bash
# 1. Get a bot token from @BotFather on Telegram
# 2. Set it up during onboarding or:
gimi config    # → Setup Telegram

# 3. Start the bot
gimi telegram
```

### Dedicated Bots

Create unlimited specialized Telegram bots:

```bash
gimi bot:add --token BOT_TOKEN --name "CodeBot" --role coder
gimi bot:add --token BOT_TOKEN2 --name "OpsBot" --role devops
gimi bot:list
gimi telegram
```

---

## Deploy Telegram Bot on Server

```bash
# On your VPS
npm install -g gimicoworker
gimi setup    # Configure provider + Telegram token

# Run with pm2
npm install -g pm2
pm2 start gimi -- telegram
pm2 save
pm2 startup
```

Your bot runs 24/7 and anyone on Telegram can use it with their own API key.

---

## Data Storage

All data is stored in your home directory:

| What | Location |
|------|----------|
| **Agents & DB** | `~/.gimicoworker/data/` |
| **Skills** | `~/.gimicoworker/skills/` |
| **Browser Sessions** | `~/.gimicoworker/browser-data/` |
| **Config (Windows)** | `%APPDATA%/gimicoworker-nodejs/Config/config.json` |
| **Config (macOS)** | `~/Library/Preferences/gimicoworker-nodejs/config.json` |
| **Config (Linux)** | `~/.config/gimicoworker-nodejs/config.json` |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│            CLI / Telegram / Pipeline          │
│              (User Interface Layer)           │
├──────────────────────────────────────────────┤
│               Agent Manager                   │
│   (Create, Switch, Remove, Save, Restore)    │
├───────┬───────┬───────┬───────┬──────────────┤
│Agent 1│Agent 2│Agent 3│  ...  │   Agent N    │
│General│DevOps │Social │       │   Custom     │
├───────┴───────┴───────┴───────┴──────────────┤
│             Multi-Provider Layer              │
│  Gemini │ OpenAI │ Claude │ Moonshot │ Ollama │
├──────────────────────────────────────────────┤
│            Tool Registry (54+ tools)          │
│  Shell │ Files │ Network │ Social │ Memory   │
├──────────────────────────────────────────────┤
│             Browser Automation                │
│  WhatsApp │ Instagram │ Web Scraping         │
├──────────────────────────────────────────────┤
│             SQLite Database                   │
│  Agents │ Memory │ Workflows │ Schedules     │
├──────────────────────────────────────────────┤
│    Skills │ Workflows │ Scheduler │ Updates   │
└──────────────────────────────────────────────┘
```

---

## Uninstall

```bash
gimi uninstall
```

Removes everything: config, data, database, browser sessions, and the npm package itself.

---

## Requirements

- **Node.js** >= 18.0.0
- At least one AI provider API key (Gemini, OpenAI, Claude, or Moonshot)
- For social media features: Chromium browser (auto-installed by Playwright)

---

## License

MIT
