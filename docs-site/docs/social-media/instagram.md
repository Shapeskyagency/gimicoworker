---
sidebar_position: 2
---

# Instagram Automation

Automate your Instagram engagement, messaging, posting, and analytics using browser-based automation powered by Playwright.

## Overview

GimiCoworker provides **19 Instagram tools** that let your AI agent control a real browser session to interact with Instagram. Unlike API-based approaches, this uses **Playwright browser automation** to drive an actual Chrome/Chromium instance, which means:

- No Instagram API keys or app approvals needed
- Works with any standard Instagram account
- The agent sees and interacts with Instagram exactly like a human would
- All actions go through the real Instagram web interface

```
You: "Like the latest 5 posts from @designinspo and comment something nice"
Agent: *launches browser* → *navigates to profile* → *likes posts* → *comments*
       Done! Liked 5 posts and left comments on each.
```

```
You: "Check my DMs and reply to anyone who asked about pricing"
Agent: *opens inbox* → *reads threads* → *sends replies*
       Replied to 3 conversations about pricing.
```

## Prerequisites

Before using Instagram tools, make sure you have:

1. **Playwright installed** -- GimiCoworker uses Playwright for browser automation. Install browsers if you haven't:
   ```bash
   npx playwright install chromium
   ```

2. **An Instagram account** -- Any standard account works. A dedicated account for automation is recommended.

3. **GimiCoworker running** -- Either via CLI (`gimi`) or Telegram bot.

## Setup Guide

### Step 1: Connect to Instagram

Tell your agent to open Instagram:

```
You: "Connect to Instagram"
```

The agent calls `instagram_connect`, which launches a Chromium browser window and navigates to Instagram.

### Step 2: Log In

The browser window will appear on your screen. You have two options:

- **Manual login** -- Type your username and password in the browser window yourself. This is the safest approach since your credentials never pass through the agent.
- **Agent-assisted login** -- The agent can wait for you to complete login.

```
You: "Wait for me to log in to Instagram"
```

The agent calls `instagram_wait_login`, which polls the page until it detects a successful login (the home feed loads).

### Step 3: Verify Connection

```
You: "Check Instagram status"
```

The agent calls `instagram_status` to confirm the browser is connected and logged in.

### Step 4: Start Automating

Once connected, all 19 tools are available. The browser session stays open until you disconnect.

## Tool Reference

All 19 Instagram tools available to your agent:

### Connection & Status

| Tool | Description |
|------|-------------|
| `instagram_connect` | Launch a Chromium browser and open Instagram's website |
| `instagram_wait_login` | Wait for the user to complete login (polls until home feed loads) |
| `instagram_status` | Check whether the browser is connected and logged in |
| `instagram_disconnect` | Close the browser window and end the session |

### Engagement

| Tool | Description |
|------|-------------|
| `instagram_like_post` | Like a specific post by its URL |
| `instagram_like_multiple` | Like multiple posts in batch (accepts an array of URLs) |
| `instagram_comment` | Leave a comment on a specific post |
| `instagram_follow` | Follow a user by username |
| `instagram_unfollow` | Unfollow a user by username |

### Direct Messages

| Tool | Description |
|------|-------------|
| `instagram_send_dm` | Send a direct message to a user |
| `instagram_get_inbox` | Retrieve the DM inbox (list of conversations) |
| `instagram_read_dm` | Read messages in a specific DM thread |
| `instagram_watch_dm` | Watch for new incoming DMs using polling |
| `instagram_auto_reply` | Set up automated reply rules for incoming DMs |

### Content & Publishing

| Tool | Description |
|------|-------------|
| `instagram_post` | Publish an image with caption to your feed |

### Analytics & Reporting

| Tool | Description |
|------|-------------|
| `instagram_analytics` | Get engagement analytics for specific posts |
| `instagram_daily_report` | Generate a daily engagement summary report |

### Profile

| Tool | Description |
|------|-------------|
| `instagram_get_profile` | Retrieve profile information for any user |
| `instagram_get_notifications` | Get your recent notifications |

## Usage Examples

### Engagement Workflows

**Like a single post:**
```
You: "Like this post: https://www.instagram.com/p/ABC123/"
```

**Batch-like multiple posts:**
```
You: "Like these posts:
      https://www.instagram.com/p/ABC123/
      https://www.instagram.com/p/DEF456/
      https://www.instagram.com/p/GHI789/"
```

**Comment on a post:**
```
You: "Comment 'Great shot! Love the composition' on https://www.instagram.com/p/ABC123/"
```

**Follow/unfollow users:**
```
You: "Follow @designinspo"
You: "Unfollow @oldaccount"
```

**Combined engagement flow:**
```
You: "Go to @natgeo's profile, like their latest 3 posts, and follow them"
```

The agent will chain `instagram_get_profile`, `instagram_like_multiple`, and `instagram_follow` together automatically.

### DM Management

**Send a direct message:**
```
You: "Send a DM to @johndoe saying 'Hey! Thanks for the follow. Love your work.'"
```

**Check your inbox:**
```
You: "Show me my Instagram DMs"
```

**Read a specific conversation:**
```
You: "Read my DM conversation with @janedoe"
```

**Watch for new messages:**
```
You: "Watch my Instagram DMs and notify me when new messages arrive"
```

The agent uses `instagram_watch_dm` to poll the inbox at intervals and alerts you when new messages come in.

### Posting Content

**Publish a post:**
```
You: "Post the image at D:\photos\sunset.jpg with caption 'Golden hour never disappoints #photography #sunset'"
```

The agent calls `instagram_post` which navigates through Instagram's web upload flow, selects the image, adds your caption, and publishes.

### Analytics & Reporting

**Get post analytics:**
```
You: "Get the analytics for https://www.instagram.com/p/ABC123/"
```

Returns engagement data such as likes, comments, and other available metrics from the post page.

**Generate a daily report:**
```
You: "Generate my Instagram daily report"
```

The agent calls `instagram_daily_report` to compile a summary of your account's engagement activity for the day, including likes received, comments, new followers, and post performance.

## Auto-Reply Setup

The `instagram_auto_reply` tool lets you define rules so the agent automatically responds to incoming DMs based on keywords or patterns.

**Basic auto-reply:**
```
You: "Set up auto-reply on Instagram: if someone messages me with 'pricing' or 'how much', reply with 'Thanks for your interest! Our pricing starts at $99/mo. Check out example.com/pricing for details.'"
```

**Multiple rules:**
```
You: "Set up these Instagram auto-replies:
      - If they say 'hello' or 'hi', reply 'Hey there! Thanks for reaching out. How can I help?'
      - If they say 'hours' or 'open', reply 'We are open Mon-Fri 9am-6pm EST'
      - If they say 'portfolio', reply 'Check out our work at example.com/portfolio'"
```

**How it works:**

1. The agent calls `instagram_auto_reply` with your rules.
2. It uses `instagram_watch_dm` to continuously poll the inbox for new messages.
3. When a new message matches a rule's keywords, the agent calls `instagram_send_dm` to send the configured reply.
4. The polling continues until you tell the agent to stop.

**Stop auto-reply:**
```
You: "Stop the Instagram auto-reply"
```

## Daily Report Feature

The daily report gives you a quick overview of your Instagram activity and engagement. Ask for it at any time:

```
You: "Give me my Instagram daily report"
```

**Example output from the agent:**

```
Instagram Daily Report - Feb 22, 2026
--------------------------------------
Profile: @youraccount
Followers: 12,450
Following: 890

Today's Activity:
- Posts published: 1
- Likes received: 347
- Comments received: 23
- New followers: +18
- DMs received: 5

Top Performing Post:
- sunset.jpg - 195 likes, 12 comments

Notifications Summary:
- 18 new follow notifications
- 3 mention notifications
- 2 comment replies
```

You can also schedule this by combining it with other GimiCoworker features:

```
You: "Every day at 9am, generate my Instagram daily report and send it to me on Telegram"
```

## Tips and Best Practices

### Rate Limits

Instagram monitors activity patterns. To avoid triggering rate limits or temporary blocks:

- **Space out actions** -- Don't like 100 posts in 1 minute. Ask the agent to add delays between actions.
- **Keep volumes reasonable** -- Stick to human-like activity levels:
  - Likes: up to 50-60 per hour
  - Comments: up to 15-20 per hour
  - Follows/unfollows: up to 20-30 per hour
  - DMs: up to 30-40 per hour
- **Take breaks** -- Avoid running automation 24/7 without pauses.

**Example with pacing:**
```
You: "Like the latest 10 posts from #photography but wait 15-30 seconds between each like"
```

### Detection Avoidance

Since GimiCoworker uses a real browser, the footprint is minimal compared to API-based bots. However, keep these tips in mind:

- **Don't repeat identical comments** -- Vary your comment text. Instagram flags repetitive identical comments as spam.
- **Use natural language** -- Let the AI generate unique, contextual comments rather than copy-pasting the same text.
- **Keep the browser window visible** -- Running in headless mode can sometimes trigger additional checks. A visible browser session is more reliable.
- **Log in manually** -- Always log in yourself in the browser window rather than passing credentials through the agent. This keeps your password secure and avoids login challenge issues.
- **Handle challenges** -- If Instagram shows a verification challenge (CAPTCHA, phone confirmation), you can resolve it manually in the browser window. The agent will wait and resume once the page returns to normal.

### Session Management

- **One session at a time** -- Only one browser session per Instagram account. Calling `instagram_connect` while already connected will use the existing session.
- **Session persistence** -- The browser session lasts until you call `instagram_disconnect` or the process ends. There is no automatic cookie persistence between sessions; you need to log in again after disconnecting.
- **Disconnect when done** -- Always disconnect when finished to free up system resources:
  ```
  You: "Disconnect from Instagram"
  ```

### Limitations

| Limitation | Details |
|------------|---------|
| **No headless guaranteed support** | Instagram may behave differently in headless mode; visible browser is recommended |
| **Login required each session** | Cookies are not persisted between sessions; manual login is needed each time |
| **One account per session** | Cannot manage multiple Instagram accounts simultaneously in one session |
| **Web interface only** | Features only available in the mobile app (Reels creation, Stories from camera) are not supported |
| **Rate limits apply** | Instagram's own rate limits and spam detection still apply |
| **Browser must stay open** | The Chromium window must remain open for the duration of automation |
| **No Story posting** | Story creation is a mobile-only feature not available through the web interface |

## Combining with Other GimiCoworker Features

Instagram tools work alongside all other GimiCoworker capabilities:

**Save engagement data to memory:**
```
You: "Get analytics for my last post and save the results to memory"
```

**Cross-platform workflow:**
```
You: "Check my Instagram DMs, summarize any new messages, and send the summary to me on Telegram"
```

**File-based workflows:**
```
You: "Read the caption from D:\content\captions.txt and post the image D:\content\photo.jpg with that caption"
```

**Next:** Check the [Tools Reference](../core-concepts/tools) for the full list of all GimiCoworker tools.
