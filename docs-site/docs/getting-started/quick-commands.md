---
sidebar_position: 4
---

# Quick Commands

Besides interactive mode, CLI-AGT has quick one-shot commands for fast tasks.

## `run` — Single Question

Send a single message and get a response:

```bash
gimi run "What processes are using the most memory?"
```

### With a specific role:

```bash
gimi run -r security "Check for open ports on this machine"
gimi run -r coder "Write a Python function to merge two sorted lists"
gimi run -r devops "Show all running Docker containers"
```

### With a specific model:

```bash
gimi run -m gemini-2.5-pro-preview-05-06 "Design a database schema for an e-commerce platform"
```

## `exec` — AI-Powered Command Execution

Let the AI interpret and execute a command, then explain the output:

```bash
gimi exec "show disk usage"
gimi exec "find large files over 500MB"
gimi exec "what's my IP address"
gimi exec "list all Node.js processes"
```

The AI translates your natural language into the right OS command, runs it, and explains the result.

## `roles` — List Available Roles

```bash
gimi roles
```

## `models` — List Available Models

```bash
gimi models
```

## `bots` — List Telegram Bots

```bash
gimi bots
```

## `telegram` — Start All Telegram Bots

```bash
gimi telegram
```

## `update` — Update to Latest Version

```bash
gimi update
```

On every startup, GimiCoworker checks the npm registry for a newer version. If one is found, you see:
```
Update available: 1.0.0 → 1.1.0 / Run: gimi update
```

Running `gimi update` installs the latest version from npm.

## `uninstall` — Complete Removal

```bash
gimi uninstall
```

Performs a full cleanup:
- Removes the config directory (`AppData/gimicoworker-nodejs/` on Windows)
- Removes the data directory (`~/.gimicoworker/` — skills, agents, database)
- Asks to self-uninstall the npm package (`npm uninstall -g gimicoworker`)

After uninstall, nothing remains on the system.

## Examples for Common Tasks

```bash
# System info
gimi run "Give me a full system health report"

# File operations
gimi run -r filemanager "Organize my Downloads folder by file type"

# Development
gimi run -r coder "Create a .gitignore for a Node.js project"

# Security
gimi run -r security "Audit file permissions in /etc"

# Research
gimi run -r researcher "Read package.json and summarize the project dependencies"
```
