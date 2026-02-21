---
sidebar_position: 2
---

# Publish to npm

Make CLI-AGT installable with a single `npm install` command.

## Step 1: Create an npm Account

1. Go to [https://www.npmjs.com/signup](https://www.npmjs.com/signup)
2. Create an account
3. Verify your email

## Step 2: Login

```bash
npm login
```

Enter your username, password, and email.

## Step 3: Update package.json

Edit `package.json` and set your details:

```json
{
  "name": "cli-agt",
  "version": "1.0.0",
  "author": "Your Name <your@email.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/cli-agt"
  }
}
```

:::tip
The package name must be unique on npm. Check availability at [npmjs.com](https://www.npmjs.com).
:::

## Step 4: Publish

```bash
npm publish
```

## Step 5: Users Install

Now anyone can:

```bash
# Install globally
npm install -g gimicoworker

# Create .env (or set key on first run)
echo "GEMINI_API_KEY=their-key" > .env

# Run from any directory
gimi
```

All data is stored in `~/.gimicoworker/` so users can run `gimi` from any directory.

## Updating

### For publishers

Bump the version and publish again:

```bash
npm version patch   # 1.0.0 → 1.0.1
npm publish
```

### For users

Users are notified of updates automatically on startup:
```
Update available: 1.0.0 → 1.0.1 / Run: gimi update
```

They can update with a single command:
```bash
gimi update
```
