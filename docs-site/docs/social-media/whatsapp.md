---
sidebar_position: 1
title: WhatsApp Automation
description: Automate WhatsApp messaging, monitoring, and auto-replies using GimiCoworker's Playwright-based WhatsApp Web integration.
---

# WhatsApp Automation

GimiCoworker provides a full suite of WhatsApp automation tools powered by **Playwright browser automation**. Rather than relying on unofficial APIs, GimiCoworker opens a real WhatsApp Web session in a Playwright-controlled browser, interacts with the interface programmatically, and exposes 12 tools that let you send messages, monitor chats, set up auto-replies, and more -- all through natural language commands.

## How It Works

```
User (natural language) --> GimiCoworker Agent --> WhatsApp Tools --> Playwright Browser --> WhatsApp Web
```

1. GimiCoworker launches a Chromium browser instance via Playwright.
2. It navigates to `web.whatsapp.com` and waits for you to authenticate by scanning the QR code with your phone.
3. Once authenticated, the agent can execute any of the 12 WhatsApp tools on your behalf.
4. All interactions happen through the real WhatsApp Web UI -- no unofficial or third-party APIs are involved.

## Prerequisites

Before using the WhatsApp tools, make sure the following requirements are met:

| Requirement | Details |
|---|---|
| **Playwright browser** | Playwright and its Chromium browser must be installed. Run `npx playwright install chromium` if not already installed. |
| **WhatsApp account** | An active WhatsApp account linked to a phone number. |
| **Phone with WhatsApp** | Your phone must be connected to the internet to complete the initial QR code scan and maintain the session. |
| **Network access** | The machine running GimiCoworker must be able to reach `web.whatsapp.com`. |

## Setup Guide

### Step 1: Install Playwright Browser

If you have not already installed the Playwright Chromium browser, run:

```bash
npx playwright install chromium
```

### Step 2: Connect to WhatsApp Web

Tell the agent to connect:

> "Connect to WhatsApp"

This triggers the `whatsapp_connect` tool, which launches a Playwright browser and navigates to WhatsApp Web. A browser window will open showing the WhatsApp Web QR code.

### Step 3: Scan the QR Code

Open WhatsApp on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the QR code displayed in the browser window.

Then tell the agent:

> "Wait for me to log in"

This triggers the `whatsapp_wait_login` tool, which polls the page until the QR code disappears and the chat list loads, confirming a successful login.

### Step 4: Start Using WhatsApp Tools

Once logged in, you can issue any WhatsApp command in natural language. The session persists until you disconnect or close the browser.

## Tool Reference

GimiCoworker exposes **12 WhatsApp tools**:

| # | Tool | Description |
|---|---|---|
| 1 | `whatsapp_connect` | Launch a Playwright browser instance and open WhatsApp Web. |
| 2 | `whatsapp_wait_login` | Wait for the user to scan the QR code and complete authentication. |
| 3 | `whatsapp_send` | Send a text message to a specific phone number or contact name. |
| 4 | `whatsapp_get_chats` | Retrieve the list of recent chats visible in the sidebar. |
| 5 | `whatsapp_read_messages` | Read messages from a specific chat by contact name or number. |
| 6 | `whatsapp_get_unread` | Fetch all chats that have unread messages along with their content. |
| 7 | `whatsapp_mark_read` | Mark messages in a specific chat as read. |
| 8 | `whatsapp_watch` | Start polling for new incoming messages at a defined interval. |
| 9 | `whatsapp_auto_reply` | Configure automatic reply rules based on message content or sender. |
| 10 | `whatsapp_search` | Search for messages across all chats using a keyword or phrase. |
| 11 | `whatsapp_status` | Check whether the WhatsApp Web session is active and connected. |
| 12 | `whatsapp_disconnect` | Close the Playwright browser and end the WhatsApp Web session. |

## Usage Examples

Below are examples showing what you say in natural language and what the agent does behind the scenes.

### Connecting and Disconnecting

| You say | Agent action |
|---|---|
| "Connect to WhatsApp" | Calls `whatsapp_connect` to launch browser and open WhatsApp Web. |
| "Wait for login" | Calls `whatsapp_wait_login` to wait for QR scan completion. |
| "Is WhatsApp connected?" | Calls `whatsapp_status` and reports back the session state. |
| "Disconnect from WhatsApp" | Calls `whatsapp_disconnect` to close the browser. |

### Sending Messages

| You say | Agent action |
|---|---|
| "Send 'Hello!' to +1234567890" | Calls `whatsapp_send` with the phone number and message text. |
| "Message John saying 'Meeting at 3pm'" | Calls `whatsapp_send` with contact name "John" and the message. |
| "Tell Mom I'll be late for dinner" | Calls `whatsapp_send` with contact name "Mom" and an appropriate message. |

### Reading and Monitoring

| You say | Agent action |
|---|---|
| "Show my recent chats" | Calls `whatsapp_get_chats` and displays the chat list. |
| "Read messages from Alice" | Calls `whatsapp_read_messages` with contact name "Alice". |
| "Do I have any unread messages?" | Calls `whatsapp_get_unread` and summarizes unread conversations. |
| "Mark Alice's chat as read" | Calls `whatsapp_mark_read` for the chat with Alice. |
| "Watch for new messages" | Calls `whatsapp_watch` to begin polling for incoming messages. |

### Searching

| You say | Agent action |
|---|---|
| "Search my WhatsApp for 'invoice'" | Calls `whatsapp_search` with the keyword "invoice". |
| "Find messages about the project deadline" | Calls `whatsapp_search` with a relevant search term. |

## Auto-Reply Setup Guide

The `whatsapp_auto_reply` tool lets you configure rules that automatically respond to incoming messages. This is useful for away messages, FAQ responses, or routing inquiries.

### Basic Auto-Reply

> "Set up an auto-reply: when anyone sends 'hello', reply with 'Hi! I'm currently away. I'll get back to you soon.'"

The agent calls `whatsapp_auto_reply` with a rule that matches incoming messages containing "hello" and sends the configured response.

### Conditional Auto-Replies

You can set up multiple rules with different conditions:

> "Auto-reply to messages from +1234567890 with 'Thanks for reaching out, I'll respond shortly.'"

> "If anyone asks about pricing, auto-reply with 'Please visit our website at example.com/pricing for current rates.'"

### Managing Auto-Replies

| You say | Agent action |
|---|---|
| "Set up an auto-reply for 'hello'" | Configures a new auto-reply rule via `whatsapp_auto_reply`. |
| "What auto-replies are active?" | Queries `whatsapp_auto_reply` to list current rules. |
| "Remove the auto-reply for 'hello'" | Removes the specified auto-reply rule. |

### Example Workflow: Out-of-Office Setup

```
You:    "Connect to WhatsApp"
Agent:  Launches browser, opens WhatsApp Web.

You:    "Wait for login"
Agent:  Waits for QR scan. Reports success once logged in.

You:    "Set up an auto-reply: reply to all messages with
         'I'm out of office until Monday. For urgent matters,
         call +1234567890.'"
Agent:  Configures the auto-reply rule.

You:    "Watch for new messages"
Agent:  Starts polling. When a new message arrives, the
        auto-reply rule fires and sends the response
        automatically.
```

## Tips

- **Session persistence**: WhatsApp Web sessions can persist across browser restarts if the linked device stays authorized on your phone. However, GimiCoworker starts a fresh browser session each time you call `whatsapp_connect`.

- **Use contact names or phone numbers**: The `whatsapp_send` and `whatsapp_read_messages` tools accept either a contact name (as it appears in your WhatsApp) or a full phone number with country code (e.g., `+1234567890`).

- **Combine with watching**: Use `whatsapp_watch` alongside `whatsapp_auto_reply` for a fully automated messaging workflow. The watch tool detects new messages, and auto-reply rules handle the responses.

- **Check status before acting**: If you are unsure whether the session is still alive, ask "Is WhatsApp connected?" before sending messages. This calls `whatsapp_status` and avoids errors from a stale session.

- **Batch operations**: You can ask the agent to perform multiple actions in sequence, such as "Read my unread messages and reply to each one with 'Got it, thanks!'"

## Limitations

- **QR code scan required**: Every new session requires a manual QR code scan. There is no way to bypass this step since it is enforced by WhatsApp's security model.

- **No media sending**: The current toolset supports text messages only. Sending images, videos, documents, or voice messages is not supported.

- **Single session**: Only one WhatsApp Web session can be active at a time per phone number. Connecting from GimiCoworker will log out any other WhatsApp Web session.

- **Rate limiting**: Sending too many messages in a short period may trigger WhatsApp's anti-spam measures. Space out bulk messaging operations.

- **UI dependency**: Because the tools rely on Playwright automating the WhatsApp Web interface, changes to WhatsApp Web's HTML structure could temporarily break tool functionality until selectors are updated.

- **No group management**: While you can send messages to groups and read group chats, creating or modifying groups is not supported.

- **Phone must stay online**: Your phone needs an active internet connection to maintain the WhatsApp Web session. If the phone goes offline for an extended period, the session may drop.
