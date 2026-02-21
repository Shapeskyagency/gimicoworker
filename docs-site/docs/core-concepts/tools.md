---
sidebar_position: 2
---

# Tools

Tools are the actions an agent can perform on your computer. When you ask the agent to do something, the AI decides which tools to call and with what parameters.

GimiCoworker provides **60+ tools** across 11 categories — from shell execution to social media automation.

## How Tools Work

```
You: "Create a file called hello.py with a print statement"
         │
         ▼
    AI decides:
    → Call write_file(filepath="hello.py", content="print('Hello!')")
         │
         ▼
    Tool executes on your OS
         │
         ▼
    Result sent back to AI
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

**Examples:**
```bash
execute_command("git status")
execute_command("npm install express")
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

### Social Media — WhatsApp (12 tools)

| Tool | What It Does |
|------|-------------|
| `whatsapp_connect` | Launch browser and open WhatsApp Web |
| `whatsapp_wait_login` | Wait for QR code scan to complete |
| `whatsapp_send` | Send a message to a contact |
| `whatsapp_get_chats` | Get list of recent chats |
| `whatsapp_read_messages` | Read messages from a specific chat |
| `whatsapp_get_unread` | Get all unread messages |
| `whatsapp_mark_read` | Mark messages as read |
| `whatsapp_watch` | Watch for new incoming messages |
| `whatsapp_auto_reply` | Set up automatic reply rules |
| `whatsapp_search` | Search messages across chats |
| `whatsapp_status` | Check connection status |
| `whatsapp_disconnect` | Close browser and disconnect |

:::info
WhatsApp tools use Playwright to automate WhatsApp Web. See the [WhatsApp Guide](/docs/social-media/whatsapp) for setup instructions.
:::

### Social Media — Instagram (19 tools)

| Tool | What It Does |
|------|-------------|
| `instagram_connect` | Launch browser and open Instagram |
| `instagram_wait_login` | Wait for login to complete |
| `instagram_like_post` | Like a specific post by URL |
| `instagram_like_multiple` | Like multiple posts (batch) |
| `instagram_comment` | Comment on a post |
| `instagram_send_dm` | Send a direct message |
| `instagram_get_inbox` | Get DM inbox |
| `instagram_read_dm` | Read messages in a DM thread |
| `instagram_watch_dm` | Watch for new DMs |
| `instagram_auto_reply` | Set up auto-reply rules for DMs |
| `instagram_post` | Post an image/content |
| `instagram_analytics` | Get analytics for posts |
| `instagram_daily_report` | Generate daily engagement report |
| `instagram_get_profile` | Get profile information |
| `instagram_follow` | Follow a user |
| `instagram_unfollow` | Unfollow a user |
| `instagram_get_notifications` | Get recent notifications |
| `instagram_status` | Check connection status |
| `instagram_disconnect` | Close browser and disconnect |

:::info
Instagram tools use Playwright to automate the Instagram website. See the [Instagram Guide](/docs/social-media/instagram) for setup instructions.
:::

### Vision (2 tools)

| Tool | What It Does |
|------|-------------|
| `take_screenshot` | Capture a screenshot of the current screen |
| `analyze_image` | Analyze an image file using AI vision |

### Web Scraping (2 tools)

| Tool | What It Does |
|------|-------------|
| `scrape_webpage` | Scrape content from a webpage URL |
| `extract_links` | Extract all links from a webpage |

### Clipboard (2 tools)

| Tool | What It Does |
|------|-------------|
| `clipboard_read` | Read current clipboard contents |
| `clipboard_write` | Write text to clipboard |

### Notifications (1 tool)

| Tool | What It Does |
|------|-------------|
| `send_notification` | Send an OS-level desktop notification |

## Tool Count Summary

| Category | Count |
|----------|-------|
| Shell & Execution | 3 |
| File System | 8 |
| Process Management | 3 |
| System Information | 4 |
| Network | 5 |
| Memory | 6 |
| WhatsApp | 12 |
| Instagram | 19 |
| Vision | 2 |
| Web Scraping | 2 |
| Clipboard | 2 |
| Notifications | 1 |
| **Total** | **67** |

## Viewing Available Tools

In interactive mode:
```
/tools
```

This shows all tools with descriptions in a formatted table.

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
