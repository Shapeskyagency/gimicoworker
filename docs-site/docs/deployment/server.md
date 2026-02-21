---
sidebar_position: 3
---

# Deploy on a Server

Run CLI-AGT Telegram bots 24/7 on a VPS.

## Option A: Any VPS (DigitalOcean, Linode, AWS, etc.)

### 1. Set up the server

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools (for better-sqlite3)
sudo apt-get install -y build-essential python3
```

### 2. Install GimiCoworker

```bash
npm install -g gimicoworker
```

Alternatively, deploy from source:
```bash
git clone https://github.com/your-username/cli-agt.git
cd cli-agt
npm install
```

### 3. Configure

```bash
cp .env.example .env
nano .env
```

Add your keys:
```env
GEMINI_API_KEY=your-key
TELEGRAM_BOT_TOKEN=your-master-bot-token
```

Add dedicated bots:
```bash
gimi bot:add --token "TOKEN_1" --name "DevOps Bot" --role devops
gimi bot:add --token "TOKEN_2" --name "Coder Bot" --role coder
```

### 4. Run with pm2

```bash
# Install pm2
npm install -g pm2

# Start the Telegram bots
pm2 start $(which gimi) --name "cli-agt" -- telegram

# Save process list
pm2 save

# Auto-start on reboot
pm2 startup
```

### 5. Monitor

```bash
pm2 status          # Check if running
pm2 logs cli-agt    # View logs
pm2 restart cli-agt # Restart
pm2 stop cli-agt    # Stop
```

## Option B: Railway (One-Click Deploy)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Add environment variables: `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`
5. Set start command: `gimi telegram`

## Option C: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-slim
RUN npm install -g gimicoworker
CMD ["gimi", "telegram"]
```

Build and run:
```bash
docker build -t cli-agt .
docker run -d --name cli-agt --env-file .env \
  -v /home/youruser/.gimicoworker:/root/.gimicoworker \
  cli-agt
```

The volume mount ensures data (database, agents, skills) persists across container restarts.

## Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 512 MB | 1 GB |
| CPU | 1 core | 2 cores |
| Disk | 1 GB | 5 GB |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 |
| Node.js | 18+ | 20 LTS |

The main resource usage comes from the SQLite database growing over time. 1 GB disk is enough for months of use.

## Data Paths on Server

On a Linux server, GimiCoworker stores data in the home directory of the user running it:

| Data | Location |
|------|----------|
| Database | `~/.gimicoworker/data/cli-agent.db` |
| Agents | `~/.gimicoworker/data/agents.json` |
| Skills | `~/.gimicoworker/skills/` |
| Config | `~/.config/gimicoworker-nodejs/` |

When using Docker, make sure to mount a volume for `~/.gimicoworker/` to persist data across container restarts:

```bash
docker run -d --name cli-agt --env-file .env \
  -v /home/youruser/.gimicoworker:/root/.gimicoworker \
  cli-agt
```

## Updating on Server

To update GimiCoworker on the server:

```bash
gimi update
```

Or manually:
```bash
npm update -g gimicoworker
```
