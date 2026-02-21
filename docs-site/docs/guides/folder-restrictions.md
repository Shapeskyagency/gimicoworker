---
sidebar_position: 1
---

# Folder Restrictions

By default, agents have **full OS access** — they can read, write, and execute anywhere. Folder restrictions let you **lock an agent to specific directories**, preventing it from touching anything else.

## Why Restrict?

- **Safety** — Prevent an agent from accidentally deleting system files
- **Project isolation** — Each agent works only in its assigned project
- **Multi-tenant** — Different users/agents can't interfere with each other
- **Compliance** — Ensure agents only access authorized data

## How It Works

When you restrict an agent to folders, a **sandbox** wraps every tool call:

```
Agent tries: read_file("C:\Windows\system32\config")
Sandbox:     ❌ BLOCKED — outside allowed folders

Agent tries: read_file("D:\projects\my-app\src\index.js")
Sandbox:     ✅ ALLOWED — inside allowed folder
```

The sandbox validates paths for **all** file, directory, and shell operations.

## Setting Restrictions

### In Interactive Mode

```bash
# Restrict active agent to one folder
/restrict D:\projects\my-app

# Restrict to multiple folders
/restrict D:\projects\my-app D:\projects\shared-libs

# View current restrictions
/restrict

# Remove restrictions (full access)
/restrict clear
```

### When Creating Agents (Programmatic)

```javascript
import { AgentManager } from './src/core/agent-manager.js';

const manager = new AgentManager(apiKey);

// Create agent restricted to a project folder
const agent = manager.createAgent({
  name: 'ProjectBot',
  role: 'coder',
  allowedFolders: ['D:\\projects\\my-app'],
});

// This agent can ONLY work inside D:\projects\my-app
```

### For Telegram Bots

When creating a dedicated bot, you can restrict it programmatically:

```javascript
const bot = new DedicatedBot({
  botToken: '...',
  botName: 'Project Bot',
  agentRole: 'coder',
  geminiApiKey: apiKey,
  // Agent will be restricted when created for each user
});
```

## What Gets Restricted

| Tool | Restricted How |
|------|---------------|
| `read_file` | Can only read files inside allowed folders |
| `write_file` | Can only create/write files inside allowed folders |
| `list_directory` | Can only list allowed directories |
| `move_path` | Source AND destination must be in allowed folders |
| `copy_path` | Source AND destination must be in allowed folders |
| `delete_path` | Can only delete inside allowed folders |
| `search_files` | Search directory must be inside allowed folders |
| `search_in_files` | Search directory must be inside allowed folders |
| `execute_command` | Working directory forced to first allowed folder |
| `execute_powershell` | Working directory forced to first allowed folder |
| `run_background_process` | Working directory forced to first allowed folder |
| `download_file` | Download destination must be inside allowed folders |

### What's NOT Restricted

These tools work regardless of folder restrictions:
- `get_system_info` — Read-only system info
- `list_processes` / `kill_process` — Process management
- `get_resource_usage` — System monitoring
- `http_request` / `ping_host` — Network operations
- `check_port` / `get_network_info` — Network info
- Memory tools — Agent memory is always accessible

## Example: Dev Team with Folder Isolation

```bash
# Create frontend agent — can only touch frontend code
/create coder "Frontend Dev"
/restrict D:\projects\my-app\frontend

# Create backend agent — can only touch backend code
/switch agent_1  # switch back to first agent or create new
/create coder "Backend Dev"
/switch agent_3
/restrict D:\projects\my-app\backend

# Create DevOps agent — can only touch infra configs
/create devops "Infra Bot"
/switch agent_4
/restrict D:\projects\my-app\infra D:\projects\my-app\docker
```

Now each agent is sandboxed:

```
Frontend Dev → D:\projects\my-app\frontend\  only
Backend Dev  → D:\projects\my-app\backend\   only
Infra Bot    → D:\projects\my-app\infra\ + docker\  only
```

## Example: Client Project Isolation

If you manage multiple client projects:

```bash
/create coder "Client A Bot"
/restrict D:\clients\client-a

/create coder "Client B Bot"
/switch agent_2
/restrict D:\clients\client-b
```

Client A Bot cannot see Client B's files, and vice versa.

## Error Messages

When an agent tries to access a blocked path:

```
[SANDBOX] Blocked: Cannot read_file "C:\Users\secret\passwords.txt".
Agent is restricted to: D:\projects\my-app
```

The AI receives this error and will adjust — it learns from the sandbox rejection and stays within bounds.

## Checking Restrictions

```bash
# In interactive mode
/restrict

# Output:
# ℹ MyBot: Restricted to: D:\projects\my-app, D:\shared\libs
```

The `/list` command also shows sandbox status for each agent.
