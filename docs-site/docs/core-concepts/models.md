---
sidebar_position: 4
---

# Models

GimiCoworker supports **5 AI providers** with many models. Each agent can use a different provider and model, so you can optimize for speed, cost, or intelligence.

For detailed provider setup, see the [Providers](/docs/core-concepts/providers) guide.

## Available Models

### Google Gemini (Default)

| Model | Speed | Intelligence | Best For |
|-------|-------|-------------|----------|
| `gemini-2.0-flash` | Fast | Good | **Default.** Daily tasks, general use |
| `gemini-2.0-flash-lite` | Fastest | Basic | High-volume simple tasks, cheap operations |
| `gemini-2.5-pro-preview-05-06` | Slow | Excellent | Complex reasoning, architecture, planning |
| `gemini-2.5-flash-preview-04-17` | Medium | Very Good | Balance of speed and quality |

### OpenAI

| Model | Speed | Intelligence | Best For |
|-------|-------|-------------|----------|
| `gpt-4o` | Fast | Excellent | Complex tasks, multimodal |
| `gpt-4o-mini` | Very Fast | Good | Quick tasks, cost-efficient |
| `gpt-4-turbo` | Medium | Excellent | Detailed analysis, long context |
| `gpt-3.5-turbo` | Fastest | Basic | Simple tasks, very cheap |

### Anthropic Claude

| Model | Speed | Intelligence | Best For |
|-------|-------|-------------|----------|
| `claude-sonnet` | Fast | Very Good | General tasks, coding |
| `claude-haiku` | Fastest | Good | Quick tasks, cost-efficient |
| `claude-3-opus` | Slow | Excellent | Complex reasoning, writing |

### Moonshot / Kimi

| Model | Speed | Context | Best For |
|-------|-------|---------|----------|
| `moonshot-v1-128k` | Medium | 128K tokens | Very long documents |
| `moonshot-v1-32k` | Fast | 32K tokens | Medium documents |
| `moonshot-v1-8k` | Fastest | 8K tokens | Quick tasks |

### Ollama (Local)

| Model | Speed | Intelligence | Best For |
|-------|-------|-------------|----------|
| `llama3` | Depends on hardware | Good | Privacy-focused, offline |
| `codellama` | Depends on hardware | Good (code) | Code generation, offline |
| `mistral` | Depends on hardware | Good | General use, offline |
| Any model | Varies | Varies | Whatever you need locally |

:::tip
Ollama runs locally — no API key needed, no data leaves your machine. Install from [ollama.ai](https://ollama.ai).
:::

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
gimi run -m gpt-4o "Review this code for security issues"
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

### Use `gpt-4o` or `gemini-2.5-pro-preview` when:
- Planning complex architectures
- Multi-step reasoning tasks
- Code review requiring deep analysis
- Writing complex code from scratch

### Use `claude-sonnet` when:
- Detailed code generation
- Long-form writing or documentation
- Nuanced analysis

### Use Ollama when:
- Privacy is a concern (no data leaves your machine)
- Offline or air-gapped environments
- Experimentation with open models

## Multi-Provider Agent Teams

A powerful pattern is assigning different providers and models to agents based on their role:

```
/create general "Quick Helper"           # Uses Gemini Flash (fast + free)
/model gemini-2.0-flash

/create coder "Architect"                # Uses GPT-4o (smart)
/switch agent_2
/model gpt-4o

/create devops "DeployBot"               # Uses Gemini Flash (fast)
/switch agent_3
/model gemini-2.0-flash

/create security "Guardian"              # Uses Claude (thorough)
/switch agent_4
/model claude-sonnet
```

Now:
- **Quick Helper** answers simple questions fast (free Gemini tier)
- **Architect** handles complex design decisions with GPT-4o
- **DeployBot** runs deployment commands quickly
- **Guardian** does thorough security analysis with Claude
