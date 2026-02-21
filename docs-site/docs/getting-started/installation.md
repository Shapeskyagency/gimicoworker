---
sidebar_position: 1
---

# Installation

## Prerequisites

Before installing GimiCoworker, make sure you have:

| Requirement | Version | Check Command |
|------------|---------|---------------|
| **Node.js** | 18 or higher | `node --version` |
| **npm** | 9 or higher | `npm --version` |
| **Git** | Any | `git --version` |

### Install Node.js (if needed)

**Windows:**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version
3. Run the installer (check "Add to PATH")
4. Open a new terminal and verify: `node --version`

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Step 1: Install from npm

```bash
npm install -g gimicoworker
```

This installs GimiCoworker globally. You can now run `gimi` from any directory.

:::tip Expected Output
```
added 370+ packages in 15s
```
If you see errors about `better-sqlite3`, you may need build tools:
- **Windows:** `npm install --global windows-build-tools`
- **macOS:** `xcode-select --install`
- **Linux:** `sudo apt-get install build-essential python3`
:::

### Alternative: Clone the Repository

If you prefer to install from source:

```bash
git clone https://github.com/Shapeskyagency/gimicoworker.git
cd gimicoworker
npm install
```

## Step 2: Get a Gemini API Key

1. Go to **[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select any Google Cloud project (or create one)
5. **Copy the key** — it looks like: `AIzaSyA...`

:::info Free Tier
Gemini API has a generous free tier. For `gemini-2.0-flash`:
- **15 requests per minute**
- **1 million tokens per day**
- No credit card required
:::

## Step 3: Configure

On first run, GimiCoworker will prompt you for your API key. Alternatively, create a `.env` file in your working directory:

```env title=".env"
GEMINI_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Configuration is stored in an OS-specific config directory via the `conf` package:
- **Windows:** `AppData/gimicoworker-nodejs/`
- **macOS:** `~/Library/Preferences/gimicoworker-nodejs/`
- **Linux:** `~/.config/gimicoworker-nodejs/`

## Step 4: Verify Installation

```bash
gimi --version
```

Expected output:
```
1.0.0
```

Test that roles load:
```bash
gimi roles
```

Expected output:
```
Available Agent Roles:

  general        General Assistant - A versatile agent that can handle any task
  devops         DevOps Engineer - Manages deployments, containers, CI/CD...
  security       Security Analyst - Monitors security, audits systems...
  filemanager    File Manager - Organizes, searches, and manages files...
  coder          Software Developer - Writes, reviews, debugs code...
  sysadmin       System Administrator - Manages OS configuration...
  researcher     Research Agent - Gathers information, analyzes data...
  custom         Custom Agent - User-defined role and instructions
```

## Step 5: Run

```bash
gimi
```

You should see the GimiCoworker banner and a prompt. Type anything to start chatting!

On startup, GimiCoworker automatically checks for updates. If a new version is available, you will see:
```
Update available: 1.0.0 → 1.1.0 / Run: gimi update
```

If you had agents from a previous session, they are restored automatically:
```
Restored 3 agent(s) from previous session
```

All data is stored in `~/.gimicoworker/`, so the CLI works the same no matter which directory you run it from.

---

## Troubleshooting

### "GEMINI_API_KEY is not set"

Make sure your `.env` file exists in the project root and contains a valid key.

### "Cannot find module better-sqlite3"

Run `npm rebuild better-sqlite3` or reinstall with `npm install -g gimicoworker`.

### "EACCES permission denied" (Linux/Mac)

Use `sudo npm install -g gimicoworker` or fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### PowerShell "export not recognized" (Windows)

Use PowerShell syntax:
```powershell
$env:GEMINI_API_KEY="your-key-here"
```

Or just use the `.env` file — the app reads it automatically.

**Next:** [Configuration →](./configuration)
