---
sidebar_position: 1
---

# Agents

An **Agent** is an AI-powered entity that can talk to you and control your computer. Each agent has a role, a model, tools, and persistent memory. Agents are **persistent** — they survive restarts and are automatically restored when you launch GimiCoworker.

## Agent Anatomy

```
┌─────────────────────────────────────┐
│           Agent: "CodeBot"          │
├─────────────────────────────────────┤
│  Role:     coder                    │
│  Provider: openai                   │
│  Model:    gpt-4o                   │
│  Status:   idle / thinking / exec   │
├─────────────────────────────────────┤
│  System Prompt (role instructions)  │
│  + Memory context (from DB)         │
├─────────────────────────────────────┤
│  Tools: 60+ available               │
│  Shell, Files, Process, Net, Memory │
│  Social, Vision, Scraping, etc.     │
├─────────────────────────────────────┤
│  AI Chat Session                    │
│  (maintains conversation context)   │
├─────────────────────────────────────┤
│  SQLite: history, memories, stats   │
└─────────────────────────────────────┘
```

## Built-in Roles

| Role | Agent Type | Best For |
|------|-----------|----------|
| `general` | General Assistant | Anything — default all-purpose agent |
| `devops` | DevOps Engineer | Docker, CI/CD, deployments, infrastructure |
| `security` | Security Analyst | Port scanning, permission audits, hardening |
| `filemanager` | File Manager | Organizing files, searching, disk cleanup |
| `coder` | Software Developer | Writing code, debugging, git, packages |
| `sysadmin` | System Administrator | OS config, services, users, monitoring |
| `researcher` | Research Agent | Reading files, analyzing data, reports |
| `custom` | Custom Agent | Your own system prompt |

Each role has a specialized **system prompt** that tells the AI how to behave and what to focus on.

## Creating Agents

### In Interactive Mode

```
/create general Atlas
/create coder CodeBot
/create devops DeployBot
/create security Guardian
/create custom                  # will ask for your prompt
```

### Via CLI

```bash
gimi run -r coder "Write a REST API"
```

## Switching Between Agents

```
/list                   # See all agents with IDs
/switch agent_2         # Switch to agent_2
/switch 2               # Shorthand (same thing)
```

Each agent maintains its own:
- Conversation history
- Chat context with the AI provider
- Statistics (messages, tool calls, errors)
- Persistent memory
- Model and provider selection

## Agent Lifecycle

```
Create → Chat → (tools execute) → Response → Repeat → /exit (saved)
  │                                              │           │
  └── Memory saved to DB ◄─────────────────────┘           │
  └── Agent state saved to agents.json ◄────────────────────┘
```

1. **Create** — Agent is initialized with a role, model, and system prompt
2. **Chat** — User sends a message, AI processes it
3. **Tool Execution** — AI decides which tools to call (shell, files, etc.)
4. **Response** — AI returns the final answer
5. **Memory** — Conversation and memories persisted to SQLite
6. **Save** — On `/exit`, all agent state is saved to `~/.gimicoworker/data/agents.json`
7. **Restore** — On next startup, agents are automatically restored: `Restored 3 agent(s) from previous session`

## Agent Statistics

View with `/status` or `/list`:

- **Messages** — Total user + agent messages
- **Tool Calls** — How many OS tools were invoked
- **Errors** — Any failures encountered

## Removing Agents

```
/remove agent_2
```

:::warning
Removing an agent is permanent. Its in-session history is lost and it will not be restored on next startup. However, memories saved to the database persist.
:::

## Resetting Conversation

```
/reset
```

This clears the chat context but **keeps memories intact**. The agent starts fresh but remembers important things.
