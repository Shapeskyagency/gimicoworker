---
sidebar_position: 1
---

# Deployment Overview

Share CLI-AGT with others or deploy it on a server.

## Options

| Method | Best For | Complexity |
|--------|----------|------------|
| **GitHub** | Sharing with developers | Easy |
| **npm publish** | Public distribution | Medium |
| **Server (VPS)** | 24/7 Telegram bots | Medium |

## Quick Deploy to GitHub

```bash
cd cli-agent
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/cli-agt.git
git push -u origin main
```

Others install:
```bash
git clone https://github.com/your-username/cli-agt.git
cd cli-agt
npm install
cp .env.example .env
# Edit .env with their API key
gimi
```

## What Users Need

Every user needs:
1. **Node.js 18+** installed
2. Their own **Gemini API key** (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
3. The `.env` file configured

That's it. No server, no cloud, no database setup — SQLite creates itself automatically. All data is stored in `~/.gimicoworker/` in the user's home directory, so it works from any directory.

## Data Locations

When deploying, keep in mind where GimiCoworker stores its data:

| Data | Location |
|------|----------|
| Database | `~/.gimicoworker/data/cli-agent.db` |
| Agents | `~/.gimicoworker/data/agents.json` |
| Skills | `~/.gimicoworker/skills/` |
| Config | OS-specific via `conf` package |

These paths are relative to the user's home directory (`~`), not the installation directory.

## Updating

Users can update to the latest version at any time:

```bash
gimi update
```

GimiCoworker also checks for updates automatically on startup and shows a banner when a new version is available.

## Complete Uninstall

To fully remove GimiCoworker from a system:

```bash
gimi uninstall
```

This removes all config, data, and the npm package itself. Nothing remains on the system.
