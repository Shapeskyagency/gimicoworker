/**
 * WhatsApp Web automation tools for AI agents.
 * Uses Playwright browser automation to control WhatsApp Web.
 * Includes: connect, messaging, watching, auto-reply, and unread detection.
 */
export function createWhatsAppTools() {
  return [
    {
      declaration: {
        name: 'whatsapp_connect',
        description: 'Connect to WhatsApp Web. Opens a browser window for QR code scanning if not already logged in. Must be called before any other WhatsApp operations.',
        parameters: {
          type: 'object',
          properties: {
            headless: { type: 'boolean', description: 'Run browser headless (default: false). Must be false for first-time QR scan.' },
          },
        },
      },
      execute: async ({ headless = false } = {}) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          const result = await whatsappClient.connect(headless);
          if (result.status === 'qr_displayed') {
            return 'WhatsApp Web opened in browser. The user needs to scan the QR code with their phone.\nAfter scanning, call whatsapp_wait_login to confirm the login.';
          }
          return 'Already logged in to WhatsApp Web. Ready to send/receive messages.';
        } catch (err) {
          return `[ERROR]: ${err.message}. Make sure Playwright browsers are installed: npx playwright install chromium`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_wait_login',
        description: 'Wait for the user to complete WhatsApp Web QR code scanning. Call this after whatsapp_connect when QR is displayed.',
        parameters: {
          type: 'object',
          properties: {
            timeout: { type: 'number', description: 'Max seconds to wait for login (default: 120)' },
          },
        },
      },
      execute: async ({ timeout = 120 } = {}) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          const result = await whatsappClient.waitForLogin(timeout * 1000);
          return result.message || 'WhatsApp login successful! You can now send and receive messages.';
        } catch (err) {
          return `[ERROR]: Login timeout or failed: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_send',
        description: 'Send a WhatsApp message to a contact or group by name.',
        parameters: {
          type: 'object',
          properties: {
            contact: { type: 'string', description: 'Contact name or group name (case-insensitive partial match supported)' },
            message: { type: 'string', description: 'Message text to send' },
          },
          required: ['contact', 'message'],
        },
      },
      execute: async ({ contact, message }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.sendMessage(contact, message);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_get_chats',
        description: 'Get a list of recent WhatsApp chats with last message preview, timestamp, and unread count.',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of chats to retrieve (default: 10)' },
          },
        },
      },
      execute: async ({ count = 10 } = {}) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.getRecentChats(count);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_read_messages',
        description: 'Read recent messages from a specific WhatsApp chat conversation. Returns message text, sender (me/them), and timestamp.',
        parameters: {
          type: 'object',
          properties: {
            contact: { type: 'string', description: 'Contact or group name to read messages from' },
            count: { type: 'number', description: 'Number of recent messages to read (default: 20)' },
          },
          required: ['contact'],
        },
      },
      execute: async ({ contact, count = 20 }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.getMessagesFromChat(contact, count);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_get_unread',
        description: 'Get all chats with unread messages. Shows contact name, unread count, and last message preview. Use this to check what new messages have arrived.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.getUnreadChats();
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_mark_read',
        description: 'Mark a WhatsApp chat as read by opening it.',
        parameters: {
          type: 'object',
          properties: {
            contact: { type: 'string', description: 'Contact or group name to mark as read' },
          },
          required: ['contact'],
        },
      },
      execute: async ({ contact }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.markAsRead(contact);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_watch',
        description: 'Start or stop watching for new incoming WhatsApp messages. When watching, the system polls for new unread messages and can trigger auto-replies. The agent will be notified of new messages.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '"start" to begin watching, "stop" to stop watching, "status" to check if watching', enum: ['start', 'stop', 'status'] },
            interval: { type: 'number', description: 'Polling interval in seconds (default: 5). Lower = faster detection but more CPU.' },
          },
          required: ['action'],
        },
      },
      execute: async ({ action, interval = 5 }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');

          if (action === 'start') {
            const result = whatsappClient.startWatching(interval * 1000, (contact, preview, count) => {
              // This callback is triggered for each new message
              console.log(`\n📱 [WhatsApp] New message from ${contact} (${count} new): ${preview}`);
            });
            return result + '\nYou will be notified of new messages. Use whatsapp_auto_reply to set up automatic responses.';
          } else if (action === 'stop') {
            return whatsappClient.stopWatching();
          } else {
            const status = await whatsappClient.getStatus();
            return `Watching: ${status.watching ? 'Active' : 'Inactive'}\nAuto-reply rules: ${status.autoReplyRules}`;
          }
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_auto_reply',
        description: 'Manage automatic reply rules for WhatsApp messages. When watching is active and a new message matches a rule, an auto-reply is sent. Supports contact filtering, message pattern matching, and template replies with {{contact}} and {{message}} variables.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '"add" to add a rule, "list" to show rules, "remove" to remove a rule, "clear" to remove all rules', enum: ['add', 'list', 'remove', 'clear'] },
            contact: { type: 'string', description: 'For "add": specific contact name to reply to (leave empty for all contacts)' },
            match: { type: 'string', description: 'For "add": regex pattern or text to match in incoming message (leave empty to match all messages)' },
            reply: { type: 'string', description: 'For "add": the reply text. Use {{contact}} for sender name and {{message}} for their message text.' },
            index: { type: 'number', description: 'For "remove": the rule index number to remove' },
          },
          required: ['action'],
        },
      },
      execute: async ({ action, contact, match, reply, index }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');

          if (action === 'add') {
            if (!reply) return '[ERROR]: "reply" text is required when adding a rule.';
            whatsappClient.addAutoReply({ contact, match, reply });
            const target = contact ? `messages from "${contact}"` : 'messages from anyone';
            const trigger = match ? `matching "${match}"` : '';
            return `Auto-reply rule added: Reply to ${target} ${trigger} with: "${reply}"`;
          } else if (action === 'list') {
            const rules = whatsappClient.getAutoReplyRules();
            if (rules.length === 0) return 'No auto-reply rules configured. Use action "add" to create one.';
            return 'Auto-reply rules:\n' + rules.map(r =>
              `  #${r.index}: ${r.contact === 'all' ? 'Any contact' : r.contact} | Match: ${r.match} | Reply: "${r.reply}" | ${r.enabled ? 'Enabled' : 'Disabled'}`
            ).join('\n');
          } else if (action === 'remove') {
            if (index === undefined) return '[ERROR]: "index" is required for remove.';
            const ok = whatsappClient.removeAutoReply(index);
            return ok ? `Removed auto-reply rule #${index}.` : `Rule #${index} not found.`;
          } else if (action === 'clear') {
            whatsappClient.clearAutoReplies();
            return 'All auto-reply rules cleared.';
          }
          return '[ERROR]: Unknown action. Use: add, list, remove, clear';
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_search',
        description: 'Search for messages across all WhatsApp chats.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query text' },
          },
          required: ['query'],
        },
      },
      execute: async ({ query }) => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.searchMessages(query);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_status',
        description: 'Check WhatsApp Web connection, login, watching, and auto-reply status.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          const status = await whatsappClient.getStatus();
          return `WhatsApp Status:\n  Connected: ${status.connected}\n  Logged In: ${status.loggedIn}\n  Watching: ${status.watching}\n  Auto-reply Rules: ${status.autoReplyRules}${status.url ? `\n  URL: ${status.url}` : ''}`;
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'whatsapp_disconnect',
        description: 'Disconnect from WhatsApp Web and close the browser. Stops watching and clears auto-reply rules. Session cookies are preserved for next connect.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { whatsappClient } = await import('../social/whatsapp.js');
          return await whatsappClient.disconnect();
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
  ];
}

/**
 * Instagram Web automation tools for AI agents.
 * Includes: connect, post, like, comment, DM, analytics, auto-reply, daily reports.
 */
export function createInstagramTools() {
  return [
    // ─── Connection ─────────────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_connect',
        description: 'Connect to Instagram. Opens a browser window for login if not already authenticated.',
        parameters: {
          type: 'object',
          properties: {
            headless: { type: 'boolean', description: 'Run browser headless (default: false)' },
          },
        },
      },
      execute: async ({ headless = false } = {}) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          const result = await instagramClient.connect(headless);
          if (result.status === 'login_required') {
            return 'Instagram opened in browser. The user needs to log in manually.\nAfter logging in, call instagram_wait_login to confirm.';
          }
          return 'Already logged in to Instagram. Ready for operations.';
        } catch (err) {
          return `[ERROR]: ${err.message}. Make sure Playwright browsers are installed: npx playwright install chromium`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_wait_login',
        description: 'Wait for the user to complete Instagram login in the browser window.',
        parameters: {
          type: 'object',
          properties: {
            timeout: { type: 'number', description: 'Max seconds to wait (default: 120)' },
          },
        },
      },
      execute: async ({ timeout = 120 } = {}) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          const result = await instagramClient.waitForLogin(timeout * 1000);
          return result.message || 'Instagram login successful!';
        } catch (err) {
          return `[ERROR]: Login timeout or failed: ${err.message}`;
        }
      },
    },

    // ─── Like & Comment ─────────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_like_post',
        description: 'Like an Instagram post. Can target a specific post URL or like the latest post from a username.',
        parameters: {
          type: 'object',
          properties: {
            target: { type: 'string', description: 'Post URL (instagram.com/p/...) OR username to like their post' },
            postIndex: { type: 'number', description: 'If target is a username, which post to like (0=latest, 1=second latest, etc). Default: 0' },
          },
          required: ['target'],
        },
      },
      execute: async ({ target, postIndex = 0 }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.likePost(target, postIndex);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_like_multiple',
        description: 'Like multiple recent posts from a user. Useful for engagement building. Has built-in rate limiting.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Instagram username whose posts to like' },
            count: { type: 'number', description: 'Number of posts to like (default: 3, max: 10)' },
          },
          required: ['username'],
        },
      },
      execute: async ({ username, count = 3 }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.likeMultiplePosts(username, Math.min(count, 10));
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_comment',
        description: 'Comment on an Instagram post. Can target a post URL or a user\'s latest post.',
        parameters: {
          type: 'object',
          properties: {
            target: { type: 'string', description: 'Post URL (instagram.com/p/...) OR username to comment on their post' },
            comment: { type: 'string', description: 'Comment text to post' },
            postIndex: { type: 'number', description: 'If target is a username, which post to comment on (0=latest). Default: 0' },
          },
          required: ['target', 'comment'],
        },
      },
      execute: async ({ target, comment, postIndex = 0 }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.commentOnPost(target, comment, postIndex);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── DMs ────────────────────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_send_dm',
        description: 'Send a direct message to an Instagram user.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Instagram username to message (without @)' },
            message: { type: 'string', description: 'Message text to send' },
          },
          required: ['username', 'message'],
        },
      },
      execute: async ({ username, message }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.sendDM(username, message);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_get_inbox',
        description: 'Get Instagram DM inbox threads with usernames and message previews.',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of threads to retrieve (default: 10)' },
          },
        },
      },
      execute: async ({ count = 10 } = {}) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.getInbox(count);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_read_dm',
        description: 'Read messages from a specific Instagram DM thread.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Username of the DM thread to read' },
            count: { type: 'number', description: 'Number of messages to read (default: 20)' },
          },
          required: ['username'],
        },
      },
      execute: async ({ username, count = 20 }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.readDMThread(username, count);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── DM Watch & Auto-Reply ──────────────────────────────────────
    {
      declaration: {
        name: 'instagram_watch_dm',
        description: 'Start or stop watching for new Instagram DMs. Detects new message indicators and notifies.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '"start" to begin, "stop" to stop, "status" to check', enum: ['start', 'stop', 'status'] },
            interval: { type: 'number', description: 'Polling interval in seconds (default: 10)' },
          },
          required: ['action'],
        },
      },
      execute: async ({ action, interval = 10 }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          if (action === 'start') {
            return instagramClient.startDMWatch(interval * 1000, (count) => {
              console.log(`\n📸 [Instagram] New DM notification: ${count} new message(s)`);
            });
          } else if (action === 'stop') {
            return instagramClient.stopDMWatch();
          } else {
            const status = await instagramClient.getStatus();
            return `DM Watching: ${status.watching ? 'Active' : 'Inactive'}\nAuto-reply rules: ${status.autoReplyRules}`;
          }
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_auto_reply',
        description: 'Manage auto-reply rules for Instagram DMs. Acts as a business/sales auto-responder.',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '"add" to create rule, "list" to view, "remove" to delete, "clear" to remove all', enum: ['add', 'list', 'remove', 'clear'] },
            match: { type: 'string', description: 'For "add": keyword or regex to match in incoming DM (empty = match all)' },
            reply: { type: 'string', description: 'For "add": auto-reply message text' },
            index: { type: 'number', description: 'For "remove": rule index to remove' },
          },
          required: ['action'],
        },
      },
      execute: async ({ action, match, reply, index }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          if (action === 'add') {
            if (!reply) return '[ERROR]: "reply" text is required.';
            instagramClient.addAutoReply({ match, reply });
            return `Auto-reply rule added: Match "${match || 'any message'}" → Reply: "${reply}"`;
          } else if (action === 'list') {
            const rules = instagramClient.getAutoReplyRules();
            if (rules.length === 0) return 'No auto-reply rules. Use action "add" to create one.';
            return 'Instagram auto-reply rules:\n' + rules.map(r =>
              `  #${r.index}: Match: ${r.match} → Reply: "${r.reply}" [${r.enabled ? 'ON' : 'OFF'}]`
            ).join('\n');
          } else if (action === 'remove') {
            if (index === undefined) return '[ERROR]: "index" required.';
            return instagramClient.removeAutoReply(index) ? `Removed rule #${index}` : `Rule #${index} not found.`;
          } else if (action === 'clear') {
            instagramClient.clearAutoReplies();
            return 'All Instagram auto-reply rules cleared.';
          }
          return '[ERROR]: Unknown action.';
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── Post & Content ─────────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_post',
        description: 'Create a new Instagram post with an image and optional caption.',
        parameters: {
          type: 'object',
          properties: {
            imagePath: { type: 'string', description: 'Absolute path to the image file to post' },
            caption: { type: 'string', description: 'Post caption text (optional)' },
          },
          required: ['imagePath'],
        },
      },
      execute: async ({ imagePath, caption = '' }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.postContent(imagePath, caption);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── Analytics & Reports ────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_analytics',
        description: 'Get Instagram page analytics: follower count, engagement rate, average likes/comments, and growth tracking. Analyzes your recent posts for performance metrics.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.getAnalytics();
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_daily_report',
        description: 'Generate a comprehensive daily Instagram growth report. Includes account overview, follower changes, engagement metrics, and top-performing posts. Perfect for business/sales tracking.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.generateDailyReport();
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── Profile & Follow ───────────────────────────────────────────
    {
      declaration: {
        name: 'instagram_get_profile',
        description: 'Get profile information for any Instagram user: bio, followers, following, posts count, verified status.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Instagram username (without @). Leave empty for your own profile.' },
          },
        },
      },
      execute: async ({ username } = {}) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.getProfileInfo(username);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_follow',
        description: 'Follow an Instagram user.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Instagram username to follow (without @)' },
          },
          required: ['username'],
        },
      },
      execute: async ({ username }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.followUser(username);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_unfollow',
        description: 'Unfollow an Instagram user.',
        parameters: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Instagram username to unfollow' },
          },
          required: ['username'],
        },
      },
      execute: async ({ username }) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.unfollowUser(username);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },

    // ─── Notifications & Status ─────────────────────────────────────
    {
      declaration: {
        name: 'instagram_get_notifications',
        description: 'Get recent Instagram notifications (likes, comments, follows, mentions).',
        parameters: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of notifications (default: 10)' },
          },
        },
      },
      execute: async ({ count = 10 } = {}) => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.getNotifications(count);
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_status',
        description: 'Check Instagram connection, login, DM watching, auto-reply, and analytics status.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          const status = await instagramClient.getStatus();
          return `Instagram Status:\n  Connected: ${status.connected}\n  Logged In: ${status.loggedIn}\n  DM Watching: ${status.watching}\n  Auto-reply Rules: ${status.autoReplyRules}\n  Analytics Snapshots: ${status.analyticsSnapshots}${status.url ? `\n  URL: ${status.url}` : ''}`;
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
    {
      declaration: {
        name: 'instagram_disconnect',
        description: 'Disconnect from Instagram. Stops DM watching, clears auto-replies. Session cookies preserved.',
        parameters: { type: 'object', properties: {} },
      },
      execute: async () => {
        try {
          const { instagramClient } = await import('../social/instagram.js');
          return await instagramClient.disconnect();
        } catch (err) {
          return `[ERROR]: ${err.message}`;
        }
      },
    },
  ];
}
