---
sidebar_position: 5
title: Providers
description: Configure and use multiple AI providers in GimiCoworker — Google Gemini, OpenAI, Anthropic Claude, Moonshot/Kimi, and Ollama.
---

# Providers

GimiCoworker is built with a **multi-provider architecture**, giving you the freedom to choose the AI backend that best fits each task, budget, and privacy requirement. You can mix and match providers across agents in the same team, swap models on the fly, and even run fully local inference with Ollama.

## Supported Providers

| Provider | Prefix | Default Model | API Key Required | Notes |
|---|---|---|---|---|
| **Google Gemini** | `gemini` | `gemini-2.0-flash` | No (free tier available) | Default provider out of the box |
| **OpenAI** | `openai` | `gpt-4o` | Yes | Industry-standard GPT models |
| **Anthropic Claude** | `anthropic` | `claude-sonnet` | Yes | Strong reasoning and long context |
| **Moonshot / Kimi** | `moonshot` | `moonshot-v1-128k` | Yes | Optimized for Chinese + English bilingual tasks |
| **Ollama** | `ollama` | _(user-defined)_ | No | Fully local, offline-capable inference |

## Available Models

### Google Gemini (default provider)

| Model | Context Window | Best For |
|---|---|---|
| `gemini-2.0-flash` **(default)** | 1M tokens | General-purpose tasks, fast responses |
| `gemini-2.0-flash-lite` | 1M tokens | Cost-sensitive workloads, high throughput |
| `gemini-2.5-pro-preview-05-06` | 1M tokens | Complex reasoning, code generation |
| `gemini-2.5-flash-preview-04-17` | 1M tokens | Balanced speed and quality |

Google Gemini is the default provider. It works immediately with no additional configuration because the Gemini API offers a free tier.

### OpenAI

| Model | Context Window | Best For |
|---|---|---|
| `gpt-4o` | 128K tokens | High-quality general tasks, multimodal |
| `gpt-4o-mini` | 128K tokens | Fast, affordable everyday tasks |
| `gpt-4-turbo` | 128K tokens | Complex instructions, long documents |
| `gpt-3.5-turbo` | 16K tokens | Simple tasks, lowest cost |

### Anthropic Claude

| Model | Context Window | Best For |
|---|---|---|
| `claude-sonnet` | 200K tokens | Balanced quality and speed |
| `claude-haiku` | 200K tokens | Ultra-fast, cost-effective tasks |
| `claude-3-opus` | 200K tokens | Most capable, deep reasoning and analysis |

### Moonshot / Kimi

| Model | Context Window | Best For |
|---|---|---|
| `moonshot-v1-128k` | 128K tokens | Long-document analysis, bilingual (CN/EN) |
| `moonshot-v1-32k` | 32K tokens | Medium-length tasks, balanced cost |
| `moonshot-v1-8k` | 8K tokens | Short tasks, fastest in the Moonshot family |

### Ollama (Local Models)

| Model | Context Window | Best For |
|---|---|---|
| `llama3` | 8K tokens | General-purpose local inference |
| `codellama` | 16K tokens | Code generation and analysis |
| `mistral` | 32K tokens | Instruction following, European languages |
| _(any installed model)_ | Varies | Whatever you pull with `ollama pull` |

Ollama runs entirely on your machine. No data leaves your network, making it ideal for sensitive or air-gapped environments.

## Configuring API Keys

All provider credentials are stored in a **`.env`** file at the root of your project.

### 1. Create the `.env` file

```bash
cp .env.example .env
```

### 2. Add the keys you need

```dotenv
# Google Gemini (optional — free tier works without a key)
# GEMINI_API_KEY=your-gemini-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key

# Moonshot / Kimi
MOONSHOT_API_KEY=your-moonshot-api-key

# Ollama — no key needed, just make sure the Ollama server is running
# OLLAMA_HOST=http://localhost:11434   # default, override if needed
```

:::tip
You only need to set keys for the providers you actually use. If you only work with Gemini and Ollama, you can leave the other variables empty or omit them entirely.
:::

:::caution
Never commit your `.env` file to version control. The default `.gitignore` already excludes it.
:::

## Selecting a Provider and Model

There are two ways to assign a provider and model to an agent: the **interactive command** inside a session, and the **CLI flag** when launching a run.

### Method 1 — Interactive `/model` command

While chatting with an agent, type:

```
/model provider:model-name
```

**Examples:**

```
/model gemini:gemini-2.5-pro-preview-05-06
/model openai:gpt-4o
/model anthropic:claude-sonnet
/model moonshot:moonshot-v1-128k
/model ollama:llama3
```

The change takes effect immediately for that agent's subsequent messages.

### Method 2 — CLI flag

When launching a run from the command line, pass the `-m` (or `--model`) flag:

```bash
gimi run -m provider:model-name
```

**Examples:**

```bash
# Use GPT-4o for this run
gimi run -m openai:gpt-4o

# Use a local Ollama model
gimi run -m ollama:codellama

# Use Claude for deep analysis
gimi run -m anthropic:claude-3-opus
```

### Default Behavior

If no provider or model is specified, GimiCoworker defaults to **`gemini:gemini-2.0-flash`**.

## Provider-Specific Setup

### Google Gemini

Gemini works out of the box. For higher rate limits or production use, obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey) and set it in your `.env`:

```dotenv
GEMINI_API_KEY=your-gemini-api-key
```

### OpenAI

1. Create an account at [platform.openai.com](https://platform.openai.com).
2. Navigate to **API keys** and generate a new secret key.
3. Add it to your `.env`:

```dotenv
OPENAI_API_KEY=sk-...
```

### Anthropic Claude

1. Sign up at [console.anthropic.com](https://console.anthropic.com).
2. Go to **API Keys** and create one.
3. Add it to your `.env`:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...
```

### Moonshot / Kimi

1. Register at [platform.moonshot.cn](https://platform.moonshot.cn).
2. Generate an API key from the dashboard.
3. Add it to your `.env`:

```dotenv
MOONSHOT_API_KEY=your-moonshot-api-key
```

### Ollama (Local)

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull the model(s) you want:

```bash
ollama pull llama3
ollama pull codellama
ollama pull mistral
```

3. Make sure the Ollama server is running:

```bash
ollama serve
```

No API key is needed. By default GimiCoworker connects to `http://localhost:11434`. Override the host in `.env` if your Ollama instance runs elsewhere:

```dotenv
OLLAMA_HOST=http://192.168.1.50:11434
```

## Provider Comparison

| | Speed | Cost | Max Context | Strengths |
|---|---|---|---|---|
| **Gemini 2.0 Flash** | Fast | Free / Low | 1M tokens | Huge context, multimodal, default choice |
| **Gemini 2.5 Pro** | Medium | Medium | 1M tokens | Advanced reasoning, code |
| **GPT-4o** | Fast | Medium | 128K tokens | Multimodal, strong general quality |
| **GPT-4o-mini** | Very Fast | Low | 128K tokens | Best cost-performance for simple tasks |
| **GPT-3.5-turbo** | Very Fast | Very Low | 16K tokens | Legacy, budget-friendly |
| **Claude Sonnet** | Fast | Medium | 200K tokens | Balanced, great for writing |
| **Claude Haiku** | Very Fast | Low | 200K tokens | Fastest Claude, good for triage |
| **Claude 3 Opus** | Slower | High | 200K tokens | Deepest reasoning, nuanced analysis |
| **Moonshot v1-128k** | Medium | Low | 128K tokens | Long docs, Chinese/English bilingual |
| **Ollama (local)** | Varies | Free | Varies | Full privacy, no network dependency |

## Multi-Provider Team Example

One of GimiCoworker's most powerful features is assigning **different providers to different agents** within the same team. This lets you optimize for cost, speed, and capability on a per-role basis.

### Scenario: Research & Report Team

```yaml
team:
  name: research-report-team
  description: A team that researches a topic, writes a report, and reviews it.

  agents:
    - name: researcher
      role: Gather information and extract key findings
      model: gemini:gemini-2.5-pro-preview-05-06   # large 1M context for ingesting sources
      tools:
        - web-search
        - file-reader

    - name: writer
      role: Draft a polished, well-structured report
      model: anthropic:claude-sonnet                # strong prose and structured output
      tools:
        - file-writer

    - name: reviewer
      role: Proofread, fact-check, and suggest edits
      model: openai:gpt-4o                          # fast multimodal review
      tools:
        - file-reader

    - name: translator
      role: Translate the final report into Chinese
      model: moonshot:moonshot-v1-128k              # bilingual specialist
      tools:
        - file-reader
        - file-writer

    - name: code-assistant
      role: Generate and validate any code snippets in the report
      model: ollama:codellama                       # local, no data leaves the machine
      tools:
        - code-runner
```

### Why mix providers?

- **Researcher** uses Gemini 2.5 Pro for its massive 1M-token context window, perfect for processing many source documents at once.
- **Writer** uses Claude Sonnet for its excellent prose quality and ability to follow detailed formatting instructions.
- **Reviewer** uses GPT-4o for fast, thorough review with multimodal capabilities (can check charts/images too).
- **Translator** uses Moonshot for its native Chinese/English bilingual optimization.
- **Code Assistant** uses a local Ollama model to keep proprietary code completely offline.

This approach lets you **use the right tool for the right job** while keeping costs under control — expensive models only where they matter most, affordable or free models everywhere else.

## Troubleshooting

| Problem | Solution |
|---|---|
| `API key not found for provider openai` | Make sure `OPENAI_API_KEY` is set in your `.env` file and the file is in the project root. |
| `Connection refused` for Ollama | Verify `ollama serve` is running and the host/port match `OLLAMA_HOST`. |
| Model not found on Ollama | Run `ollama pull <model-name>` first. |
| Rate limit errors on Gemini free tier | Add a `GEMINI_API_KEY` for higher quotas, or switch to `gemini-2.0-flash-lite`. |
| Moonshot returns garbled text | Ensure your prompt is in Chinese or English; other languages have limited support. |
| `/model` command not recognized | Make sure you are inside an active agent session, not at the top-level CLI. |
