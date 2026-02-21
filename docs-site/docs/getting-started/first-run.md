---
sidebar_position: 3
---

# Your First Run

Let's walk through your first interactive session step by step.

## Step 1: Launch

```bash
gimi
```

You'll see the CLI-AGT banner:
```
  ╔═══════════════════════════════════════════════════════╗
  ║     ██████╗██╗     ██╗       █████╗  ██████╗ ████████╗║
  ║    ██╔════╝██║     ██║      ██╔══██╗██╔════╝ ╚══██╔══╝║
  ║    ██║     ██║     ██║█████╗███████║██║  ███╗   ██║   ║
  ║    ╚██████╗███████╗██║      ██║  ██║╚██████╔╝   ██║   ║
  ║     ╚═════╝╚══════╝╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ║
  ╠═══════════════════════════════════════════════════════╣
  ║  Multi-Agent OS Control System   Powered by Gemini   ║
  ╚═══════════════════════════════════════════════════════╝

  ✔ Agent "Atlas" created (general)
  ℹ Type /help for commands or just start chatting!
```

A default agent named **Atlas** is created automatically.

If you have agents from a previous session, they are restored automatically:
```
  Restored 3 agent(s) from previous session
```

If a new version is available, you will also see an update banner:
```
  Update available: 1.0.0 → 1.1.0 / Run: gimi update
```

## Step 2: Talk to Your Agent

Just type naturally:

```
Atlas > What operating system am I running?
```

The agent will use the `get_system_info` tool and respond:

```
  ▶ get_system_info

  ❯ Atlas
  You're running Windows 11 Home (10.0.26200) on an x64 architecture.
  CPU: AMD Ryzen 7 5800H (16 cores)
  Memory: 10.2 GB / 15.8 GB (64.5% used)
  Node.js: v22.19.0
```

## Step 3: Give It Real Tasks

### Explore your files
```
Atlas > List what's in my Documents folder
```

### Run commands
```
Atlas > Check how much disk space I have left
```

### Create files
```
Atlas > Create a Python script that downloads a webpage and saves it as text
```

### Manage processes
```
Atlas > What's using the most CPU right now?
```

### Network operations
```
Atlas > Is anything running on port 3000?
```

## Step 4: Create More Agents

Create a specialized agent:

```
Atlas > /create coder CodeBot
```

Output:
```
  ✔ Agent "CodeBot" created as coder (ID: agent_2)
```

Switch to it:
```
Atlas > /switch agent_2
  ✔ Switched to agent "CodeBot" (coder)
```

Now CodeBot handles your coding tasks:
```
CodeBot > Create a Node.js Express API with 3 endpoints: GET /users, POST /users, DELETE /users/:id
```

## Step 5: See Your Agents

```
/list
```

Output:
```
┌───┬──────────┬──────────┬─────────┬──────────────────┬────────┬──────────┬────────────┐
│   │ ID       │ Name     │ Role    │ Model            │ Status │ Messages │ Tools Used │
├───┼──────────┼──────────┼─────────┼──────────────────┼────────┼──────────┼────────────┤
│ ○ │ agent_1  │ Atlas    │ general │ gemini-2.0-flash │ idle   │ 3        │ 5          │
│ ◉ │ agent_2  │ CodeBot  │ coder   │ gemini-2.0-flash │ idle   │ 1        │ 2          │
└───┴──────────┴──────────┴─────────┴──────────────────┴────────┴──────────┴────────────┘
```

## Step 6: Use Memory

The agent automatically remembers things. You can also ask it to:

```
CodeBot > Remember that this project uses React 19 with TypeScript and Tailwind
```

Next session, the agent recalls this:
```
CodeBot > What framework does my project use?
```

Agent checks memory and responds with the saved info.

## Step 7: System Status

```
/status
```

Shows a dashboard of all agents, message counts, tool usage, and errors.

## Common First Session Commands

| What You Want | What to Type |
|--------------|-------------|
| See all commands | `/help` |
| Create agent | `/create devops MyBot` |
| List agents | `/list` |
| Switch agent | `/switch agent_2` |
| See tools | `/tools` |
| Clear screen | `/clear` |
| Exit (agents saved) | `/exit` |

:::tip Agents persist across restarts
When you `/exit`, all agents are saved automatically to `~/.gimicoworker/data/agents.json`. Next time you run `gimi`, they are restored with the message: `Restored N agent(s) from previous session`.
:::

**Next:** [Quick Commands →](./quick-commands)
