import { browserManager } from './browser-manager.js';
import { EventEmitter } from 'events';

const WA_URL = 'https://web.whatsapp.com';

export class WhatsAppClient extends EventEmitter {
  constructor() {
    super();
    this.page = null;
    this.loggedIn = false;

    // ─── Message Watcher State ─────────────────────────────────────
    this._watchInterval = null;
    this._watchedChats = new Map();       // contactName -> lastMessageId
    this._autoReplyRules = [];            // [{ contact, match, reply, useAI }]
    this._onNewMessage = null;            // Callback: (contact, message) => {}
    this._lastUnreadSnapshot = new Map(); // contact -> unreadCount
  }

  // ─── Connection ──────────────────────────────────────────────────

  async connect(headless = false) {
    this.page = await browserManager.launch('whatsapp', { headless });
    await this.page.goto(WA_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for either QR code or the main chat list (already logged in)
    try {
      await Promise.race([
        this.page.waitForSelector('canvas[aria-label*="Scan"]', { timeout: 15000 }),
        this.page.waitForSelector('[data-testid="chat-list"]', { timeout: 15000 }),
        this.page.waitForSelector('#side', { timeout: 15000 }),
      ]);
    } catch {
      // Timeout - page might still be loading
    }

    // Check if already logged in
    const sidePanel = await this.page.$('#side');
    if (sidePanel) {
      this.loggedIn = true;
      return { status: 'logged_in', message: 'Already logged in to WhatsApp Web.' };
    }

    return { status: 'qr_displayed', message: 'WhatsApp Web opened. Scan the QR code with your phone to log in.' };
  }

  async waitForLogin(timeout = 120000) {
    if (this.loggedIn) return { status: 'already_logged_in' };
    if (!this.page) throw new Error('Not connected. Call connect() first.');

    await this.page.waitForSelector('#side', { timeout });
    this.loggedIn = true;

    // Small delay to let everything settle
    await this.page.waitForTimeout(2000);
    return { status: 'logged_in', message: 'Successfully logged in to WhatsApp Web!' };
  }

  // ─── Send Message ────────────────────────────────────────────────

  async sendMessage(contactName, message) {
    this._checkLogin();

    // Click the search/new chat area
    const searchBox = await this._getSearchBox();
    await searchBox.click();
    await searchBox.fill('');
    await this.page.waitForTimeout(300);
    await searchBox.fill(contactName);
    await this.page.waitForTimeout(2000);

    // Find and click the matching contact (fuzzy: exact first, then partial)
    const contact = await this.page.$(`span[title="${contactName}"]`) ||
                    await this.page.$(`span[title*="${contactName}" i]`);
    if (!contact) {
      await searchBox.fill('');
      throw new Error(`Contact "${contactName}" not found in WhatsApp.`);
    }
    await contact.click();
    await this.page.waitForTimeout(500);

    // Type in the message compose box
    const composeBox = await this._getComposeBox();
    await composeBox.click();

    // Use keyboard typing for better compatibility with contenteditable
    await composeBox.fill('');
    await this.page.keyboard.type(message, { delay: 10 });
    await this.page.waitForTimeout(300);

    // Send with Enter key (more reliable than clicking send button)
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);

    return `Message sent to "${contactName}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
  }

  // ─── Get Recent Chats ───────────────────────────────────────────

  async getRecentChats(count = 10) {
    this._checkLogin();

    // Clear any active search first
    await this._clearSearch();

    const chats = await this.page.evaluate((maxCount) => {
      const results = [];

      // Strategy: find all chat row containers in #pane-side
      const chatList = document.querySelector('#pane-side');
      if (!chatList) return results;

      const rows = chatList.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"], [role="row"]');

      // Fallback: try direct child divs of pane-side's scroll container
      const elements = rows.length > 0 ? rows : chatList.querySelectorAll(':scope > div > div > div > div');

      for (let i = 0; i < Math.min(elements.length, maxCount * 2) && results.length < maxCount; i++) {
        const el = elements[i];

        // Get contact name
        const nameEl = el.querySelector('span[title][dir="auto"]') ||
                       el.querySelector('span[title]');
        if (!nameEl || !nameEl.getAttribute('title')) continue;

        const name = nameEl.getAttribute('title');

        // Get last message text
        const msgEl = el.querySelector('span[title][dir="ltr"]') ||
                      el.querySelector('[data-testid="last-msg-status"] + span') ||
                      el.querySelector('span.matched-text') ||
                      el.querySelector('font.matched-text');
        const lastMessage = msgEl?.textContent?.trim() || '';

        // Get time
        const timeEl = el.querySelector('div[class*="Timestamp"], div._ak8i') ||
                       el.querySelector('[data-testid="msg-time"]');

        // Get unread badge count
        const unreadEl = el.querySelector('span[data-testid="icon-unread-count"]') ||
                         el.querySelector('[aria-label*="unread message"]') ||
                         el.querySelector('span.aumms1qt, span[class*="unread"]');

        let unread = 0;
        if (unreadEl) {
          const num = parseInt(unreadEl.textContent);
          unread = isNaN(num) ? 1 : num;
        }

        results.push({
          name,
          lastMessage,
          time: timeEl?.textContent?.trim() || '',
          unread,
        });
      }
      return results;
    }, count);

    if (chats.length === 0) {
      return 'No chats found. The chat list may still be loading.';
    }

    return JSON.stringify(chats, null, 2);
  }

  // ─── Get Unread Chats ──────────────────────────────────────────

  async getUnreadChats() {
    this._checkLogin();
    await this._clearSearch();

    const unread = await this.page.evaluate(() => {
      const results = [];
      const chatList = document.querySelector('#pane-side');
      if (!chatList) return results;

      const rows = chatList.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"], [role="row"]');
      const elements = rows.length > 0 ? rows : chatList.querySelectorAll(':scope > div > div > div > div');

      for (const el of elements) {
        // Look for unread badge
        const unreadEl = el.querySelector('span[data-testid="icon-unread-count"]') ||
                         el.querySelector('[aria-label*="unread message"]') ||
                         el.querySelector('span[class*="unread"]');
        if (!unreadEl) continue;

        const nameEl = el.querySelector('span[title][dir="auto"]') || el.querySelector('span[title]');
        if (!nameEl) continue;

        const num = parseInt(unreadEl.textContent);
        const msgEl = el.querySelector('span[title][dir="ltr"]') || el.querySelector('span.matched-text');

        results.push({
          name: nameEl.getAttribute('title'),
          unreadCount: isNaN(num) ? 1 : num,
          lastMessage: msgEl?.textContent?.trim() || '',
        });
      }
      return results;
    });

    if (unread.length === 0) {
      return 'No unread messages.';
    }

    return JSON.stringify(unread, null, 2);
  }

  // ─── Read Messages from Chat ─────────────────────────────────────

  async getMessagesFromChat(contactName, count = 20) {
    this._checkLogin();

    // Navigate to the contact's chat
    await this._openChat(contactName);

    // Wait for messages to load
    await this.page.waitForTimeout(1500);

    // Extract messages with multiple selector strategies
    const messages = await this.page.evaluate((maxCount) => {
      const results = [];

      // Strategy 1: message-in / message-out classes
      let msgElements = document.querySelectorAll('div.message-in, div.message-out');

      // Strategy 2: data-testid based
      if (msgElements.length === 0) {
        msgElements = document.querySelectorAll('[data-testid="msg-container"]');
      }

      // Strategy 3: role="row" inside conversation panel
      if (msgElements.length === 0) {
        const convPanel = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                          document.querySelector('#main [role="application"]') ||
                          document.querySelector('#main');
        if (convPanel) {
          msgElements = convPanel.querySelectorAll('[role="row"]');
        }
      }

      const startIdx = Math.max(0, msgElements.length - maxCount);
      for (let i = startIdx; i < msgElements.length; i++) {
        const el = msgElements[i];
        const isOut = el.classList.contains('message-out') ||
                      el.querySelector('[data-testid="msg-dblcheck"]') !== null ||
                      el.querySelector('[data-testid="msg-check"]') !== null;

        // Multi-strategy text extraction
        let text = null;

        // Try: copyable-text > selectable-text
        const copyable = el.querySelector('[data-testid="copyable-text"], [class*="copyable-text"]');
        if (copyable) {
          const selectableSpan = copyable.querySelector('span[dir]') || copyable.querySelector('span');
          text = selectableSpan?.textContent || copyable.textContent;
        }

        // Try: selectable-text directly
        if (!text) {
          const sel = el.querySelector('span.selectable-text span, span.selectable-text');
          text = sel?.textContent;
        }

        // Try: any span with dir="ltr" or dir="rtl" that looks like message text
        if (!text) {
          const spans = el.querySelectorAll('span[dir="ltr"], span[dir="rtl"]');
          for (const sp of spans) {
            const t = sp.textContent?.trim();
            // Skip timestamps and tiny text
            if (t && t.length > 1 && !t.match(/^\d{1,2}:\d{2}/)) {
              text = t;
              break;
            }
          }
        }

        // Try: any text content within the message bubble area
        if (!text) {
          const bubble = el.querySelector('[data-testid="balloon-message-text"]') ||
                         el.querySelector('[class*="message-text"]');
          text = bubble?.textContent;
        }

        if (!text) text = '[media/non-text]';

        // Get timestamp
        const timeEl = el.querySelector('[data-testid="msg-meta"] span') ||
                       el.querySelector('[data-pre-plain-text]') ||
                       el.querySelector('span[dir="auto"][class*="Time"]');
        let time = '';
        if (timeEl?.getAttribute('data-pre-plain-text')) {
          time = timeEl.getAttribute('data-pre-plain-text');
        } else if (timeEl) {
          time = timeEl.textContent?.trim() || '';
        }

        results.push({
          from: isOut ? 'me' : 'them',
          text: text.trim(),
          time,
        });
      }
      return results;
    }, count);

    if (messages.length === 0) {
      return `No messages found in chat with "${contactName}". The chat might still be loading, try again.`;
    }

    return JSON.stringify(messages, null, 2);
  }

  // ─── Search Messages ─────────────────────────────────────────────

  async searchMessages(query) {
    this._checkLogin();

    const searchBox = await this._getSearchBox();
    await searchBox.click();
    await searchBox.fill(query);
    await this.page.waitForTimeout(3000);

    const results = await this.page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="search-msg-result"], .matched-text, [role="listitem"]');
      return Array.from(items).slice(0, 10).map(el => {
        const nameEl = el.querySelector('span[title]');
        const textEl = el.querySelector('span.matched-text') || el.querySelector('span[dir="ltr"]');
        return {
          contact: nameEl?.getAttribute('title') || '',
          text: textEl?.textContent?.trim() || el.textContent?.trim()?.substring(0, 100) || '',
        };
      }).filter(r => r.text);
    });

    // Clear search
    await this._clearSearch();

    return results.length > 0
      ? JSON.stringify(results, null, 2)
      : `No results found for "${query}".`;
  }

  // ─── Message Watcher ─────────────────────────────────────────────

  /**
   * Start watching for new messages. Polls every `intervalMs` milliseconds.
   * When new unread messages are detected, calls the onNewMessage callback
   * and fires a 'new_message' event.
   */
  startWatching(intervalMs = 5000, onNewMessage = null) {
    if (this._watchInterval) {
      return 'Already watching for messages.';
    }
    this._onNewMessage = onNewMessage;

    this._watchInterval = setInterval(async () => {
      try {
        await this._pollForNewMessages();
      } catch {
        // Silently ignore polling errors (browser might be busy)
      }
    }, intervalMs);

    return `Started watching for new messages (polling every ${intervalMs / 1000}s).`;
  }

  /**
   * Stop watching for messages.
   */
  stopWatching() {
    if (this._watchInterval) {
      clearInterval(this._watchInterval);
      this._watchInterval = null;
      this._onNewMessage = null;
      return 'Stopped watching for messages.';
    }
    return 'Not currently watching.';
  }

  /**
   * Poll for new unread messages and trigger callbacks/auto-replies.
   */
  async _pollForNewMessages() {
    if (!this.loggedIn || !this.page) return;

    const currentUnread = await this.page.evaluate(() => {
      const results = [];
      const chatList = document.querySelector('#pane-side');
      if (!chatList) return results;

      const rows = chatList.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"], [role="row"]');
      const elements = rows.length > 0 ? rows : chatList.querySelectorAll(':scope > div > div > div > div');

      for (const el of elements) {
        const unreadEl = el.querySelector('span[data-testid="icon-unread-count"]') ||
                         el.querySelector('[aria-label*="unread message"]') ||
                         el.querySelector('span[class*="unread"]');
        if (!unreadEl) continue;

        const nameEl = el.querySelector('span[title][dir="auto"]') || el.querySelector('span[title]');
        if (!nameEl) continue;

        const num = parseInt(unreadEl.textContent);
        const msgEl = el.querySelector('span[title][dir="ltr"]') || el.querySelector('span.matched-text');

        results.push({
          name: nameEl.getAttribute('title'),
          unreadCount: isNaN(num) ? 1 : num,
          preview: msgEl?.textContent?.trim() || '',
        });
      }
      return results;
    });

    // Compare with last snapshot to detect truly new messages
    for (const chat of currentUnread) {
      const prevCount = this._lastUnreadSnapshot.get(chat.name) || 0;
      if (chat.unreadCount > prevCount) {
        // New message(s) detected
        const newCount = chat.unreadCount - prevCount;
        this.emit('new_message', {
          contact: chat.name,
          newCount,
          totalUnread: chat.unreadCount,
          preview: chat.preview,
        });

        if (this._onNewMessage) {
          this._onNewMessage(chat.name, chat.preview, newCount);
        }

        // Process auto-reply rules
        await this._processAutoReplies(chat.name, chat.preview);
      }
    }

    // Update snapshot
    this._lastUnreadSnapshot.clear();
    for (const chat of currentUnread) {
      this._lastUnreadSnapshot.set(chat.name, chat.unreadCount);
    }
  }

  // ─── Auto-Reply System ───────────────────────────────────────────

  /**
   * Add an auto-reply rule.
   * @param {object} rule - { contact?, match?, reply, useAI? }
   *   - contact: specific contact name (null = all contacts)
   *   - match: regex pattern to match message text (null = match all)
   *   - reply: reply text, or a function(contact, message) => string
   *   - useAI: if true, the reply will be generated by the active AI agent
   */
  addAutoReply(rule) {
    this._autoReplyRules.push({
      id: Date.now(),
      contact: rule.contact || null,
      match: rule.match || null,
      reply: rule.reply || null,
      useAI: rule.useAI || false,
      enabled: true,
    });
    return this._autoReplyRules.length - 1;
  }

  removeAutoReply(index) {
    if (index >= 0 && index < this._autoReplyRules.length) {
      this._autoReplyRules.splice(index, 1);
      return true;
    }
    return false;
  }

  getAutoReplyRules() {
    return this._autoReplyRules.map((r, i) => ({
      index: i,
      contact: r.contact || 'all',
      match: r.match || 'any message',
      reply: typeof r.reply === 'function' ? '[AI function]' : r.reply || '[AI generated]',
      useAI: r.useAI,
      enabled: r.enabled,
    }));
  }

  clearAutoReplies() {
    this._autoReplyRules = [];
  }

  /**
   * Process auto-reply rules for a new incoming message.
   */
  async _processAutoReplies(contactName, messagePreview) {
    for (const rule of this._autoReplyRules) {
      if (!rule.enabled) continue;

      // Check contact filter
      if (rule.contact && !contactName.toLowerCase().includes(rule.contact.toLowerCase())) continue;

      // Check message match
      if (rule.match) {
        try {
          const regex = new RegExp(rule.match, 'i');
          if (!regex.test(messagePreview)) continue;
        } catch {
          if (!messagePreview.toLowerCase().includes(rule.match.toLowerCase())) continue;
        }
      }

      // Determine reply text
      let replyText = null;
      if (typeof rule.reply === 'function') {
        replyText = await rule.reply(contactName, messagePreview);
      } else if (rule.reply) {
        replyText = rule.reply
          .replace('{{contact}}', contactName)
          .replace('{{message}}', messagePreview);
      }

      // Send the reply if we have one
      if (replyText) {
        try {
          await this.sendMessage(contactName, replyText);
          this.emit('auto_reply_sent', { contact: contactName, reply: replyText, rule });
        } catch (err) {
          this.emit('auto_reply_error', { contact: contactName, error: err.message });
        }
      }
    }
  }

  // ─── Mark Chat as Read ───────────────────────────────────────────

  async markAsRead(contactName) {
    this._checkLogin();
    await this._openChat(contactName);
    // Opening the chat marks it as read in WhatsApp
    await this.page.waitForTimeout(1000);
    return `Chat with "${contactName}" marked as read.`;
  }

  // ─── Status & Disconnect ─────────────────────────────────────────

  async getStatus() {
    return {
      connected: browserManager.isActive('whatsapp'),
      loggedIn: this.loggedIn,
      watching: this._watchInterval !== null,
      autoReplyRules: this._autoReplyRules.length,
      url: this.page ? await this.page.url() : null,
    };
  }

  async disconnect() {
    this.stopWatching();
    this.clearAutoReplies();
    await browserManager.close('whatsapp');
    this.loggedIn = false;
    this.page = null;
    return 'Disconnected from WhatsApp Web.';
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  _checkLogin() {
    if (!this.loggedIn) throw new Error('Not logged in to WhatsApp. Call whatsapp_connect first.');
    if (!this.page) throw new Error('Browser not connected. Call whatsapp_connect first.');
  }

  async _getSearchBox() {
    return await this.page.waitForSelector(
      '[data-testid="chat-list-search"], [aria-label="Search input textbox"], [title="Search input textbox"]',
      { timeout: 5000 }
    );
  }

  async _getComposeBox() {
    return await this.page.waitForSelector(
      '[data-testid="conversation-compose-box-input"], [aria-label="Type a message"], div[contenteditable="true"][data-tab="10"]',
      { timeout: 5000 }
    );
  }

  async _clearSearch() {
    try {
      const searchBox = await this.page.$('[data-testid="chat-list-search"], [aria-label="Search input textbox"]');
      if (searchBox) {
        await searchBox.fill('');
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch {}
  }

  async _openChat(contactName) {
    const searchBox = await this._getSearchBox();
    await searchBox.click();
    await searchBox.fill('');
    await this.page.waitForTimeout(300);
    await searchBox.fill(contactName);
    await this.page.waitForTimeout(2000);

    // Case-insensitive contact matching
    const contact = await this.page.$(`span[title="${contactName}"]`) ||
                    await this.page.$(`span[title*="${contactName}" i]`) ||
                    await this.page.evaluate((name) => {
                      const spans = document.querySelectorAll('span[title]');
                      for (const s of spans) {
                        if (s.getAttribute('title').toLowerCase().includes(name.toLowerCase())) {
                          s.click();
                          return true;
                        }
                      }
                      return false;
                    }, contactName);

    if (!contact) {
      await this._clearSearch();
      throw new Error(`Contact "${contactName}" not found.`);
    }

    if (typeof contact !== 'boolean') {
      await contact.click();
    }
    await this.page.waitForTimeout(1000);
  }
}

export const whatsappClient = new WhatsAppClient();
