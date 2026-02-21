---
sidebar_position: 4
---

# Models

CLI-AGT supports multiple Gemini models. Each agent can use a different model, so you can optimize for speed, cost, or intelligence.

## Available Models

| Model | Speed | Intelligence | Best For |
|-------|-------|-------------|----------|
| `gemini-2.0-flash` | Fast | Good | **Default.** Daily tasks, general use |
| `gemini-2.0-flash-lite` | Fastest | Basic | High-volume simple tasks, cheap operations |
| `gemini-2.5-pro-preview-05-06` | Slow | Excellent | Complex reasoning, architecture, planning |
| `gemini-2.5-flash-preview-04-17` | Medium | Very Good | Balance of speed and quality |

## Changing Models

### In Interactive Mode

```
/model gemini-2.5-pro-preview-05-06
```

This changes the model for the **active agent** only. Other agents keep their models.

:::note
Changing the model resets the conversation context (the agent starts a new chat). Persistent memories are preserved.
:::

### Via CLI

```bash
gimi run -m gemini-2.5-pro-preview-05-06 "Design a microservices architecture"
```

### For Telegram Bots

```bash
gimi bot:add --token TOKEN --name "Pro Bot" --role coder --model gemini-2.5-pro-preview-05-06
```

## Model Selection Strategy

### Use `gemini-2.0-flash` (default) when:
- Doing routine tasks (file operations, running commands)
- Quick Q&A about the system
- Most daily operations

### Use `gemini-2.0-flash-lite` when:
- Running high volumes of simple queries
- Budget-conscious operations
- Simple file reads or status checks

### Use `gemini-2.5-pro-preview` when:
- Planning complex architectures
- Multi-step reasoning tasks
- Code review requiring deep analysis
- Writing complex code from scratch

### Use `gemini-2.5-flash-preview` when:
- Need better quality than Flash but faster than Pro
- Moderate complexity tasks
- Good balance for development work

## Multi-Model Agent Teams

A powerful pattern is assigning different models to agents based on their role:

```
/create general "Quick Helper"           # Uses flash (fast)
/model gemini-2.0-flash

/create coder "Architect"                # Switch to it
/switch agent_2
/model gemini-2.5-pro-preview-05-06     # Uses Pro (smart)

/create devops "DeployBot"               # Switch to it
/switch agent_3
/model gemini-2.0-flash                 # Uses flash (fast)
```

Now:
- **Quick Helper** answers simple questions fast
- **Architect** handles complex design decisions with the best model
- **DeployBot** runs deployment commands quickly
