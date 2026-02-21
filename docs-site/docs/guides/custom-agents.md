---
sidebar_position: 4
---

# Custom Agents

When the built-in roles don't fit your needs, create a **custom agent** with your own system prompt.

## Creating a Custom Agent

### Interactive mode

```bash
/create custom "My Custom Bot"
```

You'll be prompted:
```
Enter custom system prompt: You are an expert Python data scientist.
You specialize in pandas, numpy, and matplotlib. Always write clean,
well-documented Python code with type hints.
```

### Via CLI

```bash
gimi run -r custom "Analyze this CSV data"
```

### For Telegram bots

```bash
gimi bot:add \
  --token "YOUR_BOT_TOKEN" \
  --name "Python Expert" \
  --role custom \
  --prompt "You are a Python expert specializing in data science..."
```

## Custom Prompt Examples

### Database Administrator

```
You are a Database Administrator AI agent. You specialize in PostgreSQL,
MySQL, and Redis. You can execute SQL queries, optimize schemas, manage
backups, monitor performance, and troubleshoot connection issues.
Always explain query plans and suggest indexes for slow queries.
```

### Technical Writer

```
You are a Technical Writing AI agent. You read codebases and produce
clear, well-structured documentation. You write READMEs, API docs,
architecture guides, and tutorials. You follow the Divio documentation
system (tutorials, how-to guides, reference, explanation).
```

### Git/GitHub Manager

```
You are a Git and GitHub management AI agent. You handle branching
strategies, pull requests, merge conflicts, release management,
and repository maintenance. You follow conventional commits and
semantic versioning. You can execute any git command.
```

### Docker Specialist

```
You are a Docker and containerization AI agent. You write Dockerfiles,
docker-compose configurations, manage images and containers, debug
networking issues, and optimize image sizes. You follow best practices
for multi-stage builds and security.
```

### API Tester

```
You are an API Testing AI agent. You test REST APIs by making HTTP
requests, validating responses, checking status codes, and verifying
JSON schemas. You write test scripts and report issues clearly.
Always test edge cases and error handling.
```

## Tips for Good Prompts

1. **Be specific** — "You are a React expert" is better than "You know coding"
2. **Define behavior** — "Always explain before executing" or "Ask before deleting"
3. **Set boundaries** — "Only modify files in the src/ directory"
4. **Add preferences** — "Use TypeScript, prefer functional components"
5. **Include safety** — "Always create backups before modifying config files"
