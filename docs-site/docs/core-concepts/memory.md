---
sidebar_position: 3
---

# Persistent Memory

Every agent has persistent memory backed by SQLite. Memories survive across conversations, sessions, and restarts.

## How It Works

```
Session 1:
  You: "My project uses Next.js 15 with Prisma and PostgreSQL"
  Agent: *saves to memory* Got it, I'll remember your stack.

Session 2 (next day):
  You: "Add a new database model for users"
  Agent: *recalls memory* Since you're using Prisma with PostgreSQL,
         I'll create a Prisma model...
```

The agent decides **on its own** when to save and recall memories. It's built into the system prompt.

## Memory Types

### Agent Memory (Private)

Each agent has its own private memory store. Agent A cannot see Agent B's private memories.

```
Agent "CodeBot" memories:
  [project] tech_stack = "Next.js 15, Prisma, PostgreSQL"
  [user_preference] code_style = "Prefers functional components"
  [decision] auth_method = "JWT with refresh tokens"
```

### Shared Memory (Global)

All agents can read and write to shared memory. This enables **cross-agent communication**.

```
Shared memories:
  project_name = "MyApp"
  deployment_url = "https://myapp.vercel.app"
  database_host = "localhost:5432"
```

## Memory Categories

| Category | Use For |
|----------|---------|
| `general` | General information |
| `user_preference` | How the user likes things done |
| `project` | Project-specific details |
| `decision` | Architecture or design decisions |
| `fact` | System facts, configurations |
| `task` | Ongoing tasks and their status |

## Memory Importance

Each memory has an importance score (1-10):

- **1-3:** Nice to know, low priority
- **4-6:** Useful context (default: 5)
- **7-8:** Important decisions or preferences
- **9-10:** Critical information

Higher-importance memories are recalled first.

## Manually Managing Memory

### Ask the agent to remember

```
You: Remember that the API runs on port 8080
You: Save to memory: deploy using Docker on AWS
```

### Ask the agent to recall

```
You: What do you remember about the deployment?
You: Recall your memories about the database
```

### Use the `/memory` command (Telegram)

```
/memory database       # Search memories about "database"
/memory                # List all memories
```

## Memory in Multi-Agent Teams

This is where shared memory becomes powerful:

```
Step 1: Architect agent saves the plan
  → shared_memory_save("architecture", "Microservices with 3 services...")

Step 2: Backend agent reads the plan
  → shared_memory_recall("architecture")
  → Builds according to the plan

Step 3: DevOps agent reads the plan
  → shared_memory_recall("architecture")
  → Creates Docker configs for each service
```

## Database Location

All memories are stored in:
```
~/.gimicoworker/data/cli-agent.db
```

This path is in your home directory, so memories persist regardless of which directory you run `gimi` from.

### Viewing Raw Data

You can inspect the database directly:

```bash
# If you have sqlite3 installed
sqlite3 ~/.gimicoworker/data/cli-agent.db "SELECT * FROM memory;"
sqlite3 ~/.gimicoworker/data/cli-agent.db "SELECT * FROM global_memory;"
```

### Clearing All Memory

```bash
# Delete the entire database
rm ~/.gimicoworker/data/cli-agent.db

# Or clear just memories
sqlite3 ~/.gimicoworker/data/cli-agent.db "DELETE FROM memory;"
sqlite3 ~/.gimicoworker/data/cli-agent.db "DELETE FROM global_memory;"
```
