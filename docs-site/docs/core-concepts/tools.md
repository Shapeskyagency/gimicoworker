---
sidebar_position: 2
---

# Tools

Tools are the actions an agent can perform on your computer. When you ask the agent to do something, Gemini decides which tools to call and with what parameters.

## How Tools Work

```
You: "Create a file called hello.py with a print statement"
         │
         ▼
    Gemini AI decides:
    → Call write_file(filepath="hello.py", content="print('Hello!')")
         │
         ▼
    Tool executes on your OS
         │
         ▼
    Result sent back to Gemini
         │
         ▼
    Agent: "I've created hello.py with a print('Hello!') statement"
```

The AI can chain multiple tools in one response. For example, "Set up a Node.js project" might trigger:
1. `execute_command` → `mkdir my-project`
2. `execute_command` → `cd my-project && npm init -y`
3. `write_file` → create `index.js`
4. `execute_command` → `npm install express`

## Tool Categories

### Shell & Execution (3 tools)

| Tool | What It Does |
|------|-------------|
| `execute_command` | Run **any** shell command (`ls`, `git`, `npm`, etc.) |
| `execute_powershell` | Run PowerShell commands (Windows — registry, WMI, etc.) |
| `run_background_process` | Start long-running processes (servers, watchers) |

**Examples the AI might execute:**
```bash
execute_command("git status")
execute_command("npm install express")
execute_command("docker ps")
execute_powershell("Get-Process | Sort-Object CPU -Descending | Select -First 10")
```

### File System (8 tools)

| Tool | What It Does |
|------|-------------|
| `read_file` | Read any file (code, configs, logs) |
| `write_file` | Create or overwrite files (auto-creates directories) |
| `list_directory` | List folder contents with sizes and dates |
| `move_path` | Move or rename files/directories |
| `copy_path` | Copy files or entire directories |
| `delete_path` | Delete files or directories |
| `search_files` | Find files by name pattern (wildcards: `*.js`, `*.log`) |
| `search_in_files` | Search text inside files (like grep) |

### Process Management (3 tools)

| Tool | What It Does |
|------|-------------|
| `list_processes` | List running processes (filter by name) |
| `kill_process` | Kill a process by PID or name |
| `get_resource_usage` | CPU, memory, and disk usage |

### System Information (4 tools)

| Tool | What It Does |
|------|-------------|
| `get_system_info` | OS, CPU, RAM, network, uptime |
| `get_environment_variable` | Read env vars (or list all) |
| `set_environment_variable` | Set env vars for the session |
| `get_installed_programs` | List installed software |

### Network (5 tools)

| Tool | What It Does |
|------|-------------|
| `http_request` | Make HTTP requests (GET, POST, PUT, DELETE) |
| `check_port` | Check if a port is in use |
| `get_network_info` | Network config, connections, routes, DNS |
| `ping_host` | Ping a host for connectivity |
| `download_file` | Download a file from a URL |

### Memory (6 tools)

| Tool | What It Does |
|------|-------------|
| `memory_save` | Save info to agent's private memory |
| `memory_recall` | Search agent's memories |
| `memory_list` | List all saved memories |
| `memory_forget` | Delete a specific memory |
| `shared_memory_save` | Save to global memory (all agents can read) |
| `shared_memory_recall` | Read from global shared memory |

## Viewing Available Tools

In interactive mode:
```
/tools
```

This shows all 29 tools with descriptions in a formatted table.

## Tool Execution Flow

When the AI calls a tool:

1. The tool name and arguments appear in your terminal:
   ```
   ▶ execute_command command="git status"
   ```
2. The tool runs on your system
3. The output is sent back to the AI
4. The AI may call more tools or give you the final answer

The AI can call **up to 25 tools** in a single response for complex tasks.
