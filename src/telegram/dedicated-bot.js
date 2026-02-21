import TelegramBot from 'node-telegram-bot-api';
import { AgentManager } from '../core/agent-manager.js';
import { AGENT_ROLES } from '../config/defaults.js';
import { saveTelegramUser, getTelegramUser } from '../db/database.js';

/**
 * A dedicated Telegram bot that controls a SINGLE agent.
 * Each bot instance = one bot token = one agent role.
 * Users still get their own agent instance (isolated per chat).
 */
export class DedicatedBot {
  constructor({ id, botToken, botName, agentRole, agentModel, customPrompt, geminiApiKey }) {
    this.id = id;
    this.botToken = botToken;
    this.botName = botName;
    this.agentRole = agentRole;
    this.agentModel = agentModel;
    this.customPrompt = customPrompt;
    this.defaultApiKey = geminiApiKey;
    this.bot = null;
    this.userAgents = new Map(); // chatId -> Agent
  }

  start() {
    this.bot = new TelegramBot(this.botToken, { polling: true });

    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/setkey (.+)/, (msg, match) => this.handleSetKey(msg, match[1]));
    this.bot.onText(/\/reset/, (msg) => this.handleReset(msg));
    this.bot.onText(/\/model (.+)/, (msg, match) => this.handleModel(msg, match[1]));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/memory(?:\s+(.+))?/, (msg, match) => this.handleMemory(msg, match?.[1]));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/whoami/, (msg) => this.handleWhoami(msg));

    this.bot.on('message', (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        this.handleMessage(msg);
      }
    });

    this.bot.on('polling_error', (err) => {
      if (!err.message.includes('ETELEGRAM: 409')) {
        console.error(`[${this.botName}] Polling error:`, err.message);
      }
    });

    console.log(`  [${this.id}] ${this.botName} (${this.agentRole}) - Running`);
  }

  // ─── Get or create agent for a user ──────────────────────────────

  getAgentForUser(chatId) {
    if (this.userAgents.has(chatId)) {
      return this.userAgents.get(chatId);
    }

    const user = getTelegramUser(chatId);
    const apiKey = user?.api_key || this.defaultApiKey;
    if (!apiKey) return null;

    const manager = new AgentManager(apiKey);
    const agent = manager.createAgent({
      name: this.botName,
      role: this.agentRole,
      model: this.agentModel,
      customPrompt: this.customPrompt,
    });

    this.userAgents.set(chatId, { manager, agent });
    return { manager, agent };
  }

  requireAgent(chatId) {
    const result = this.getAgentForUser(chatId);
    if (!result) {
      this.bot.sendMessage(chatId,
        `⚠️ *No API key set!*\n\nSend your Gemini API key:\n\`/setkey YOUR_GEMINI_API_KEY\`\n\nGet one free at [Google AI Studio](https://aistudio.google.com/apikey)`,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
      return null;
    }
    return result.agent;
  }

  // ─── Handlers ────────────────────────────────────────────────────

  async handleStart(msg) {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'User';
    const roleInfo = AGENT_ROLES[this.agentRole] || AGENT_ROLES.general;

    await this.bot.sendMessage(chatId,
      `🤖 *${this.botName}*\n\n` +
      `Welcome ${name}! I'm a dedicated *${roleInfo.name}* agent.\n\n` +
      `_${roleInfo.description}_\n\n` +
      `*Quick Start:*\n` +
      (this.defaultApiKey
        ? `Just type your message and I'll help!\n`
        : `1. /setkey YOUR\\_GEMINI\\_API\\_KEY\n2. Just type your message!\n`) +
      `\n/help for all commands`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleSetKey(msg, apiKey) {
    const chatId = msg.chat.id;
    saveTelegramUser(chatId, msg.from.username || msg.from.first_name, apiKey.trim());
    this.userAgents.delete(chatId);

    try { await this.bot.deleteMessage(chatId, msg.message_id); } catch {}

    await this.bot.sendMessage(chatId,
      '✅ *API key saved!* Your message was deleted for safety.\n\nNow just type to chat with me!',
      { parse_mode: 'Markdown' }
    );
  }

  async handleReset(msg) {
    const chatId = msg.chat.id;
    this.userAgents.delete(chatId);
    await this.bot.sendMessage(chatId, '✅ Conversation reset. Memory is preserved.');
  }

  async handleModel(msg, model) {
    const chatId = msg.chat.id;
    const data = this.userAgents.get(chatId);
    if (!data) {
      await this.bot.sendMessage(chatId, '❌ Start chatting first, then change the model.');
      return;
    }
    data.agent.model = model.trim();
    data.agent.gemini.model = model.trim();
    data.agent.resetChat();
    await this.bot.sendMessage(chatId, `✅ Model changed to \`${model.trim()}\``, { parse_mode: 'Markdown' });
  }

  async handleStatus(msg) {
    const chatId = msg.chat.id;
    const data = this.userAgents.get(chatId);
    const stats = data?.agent?.stats || { messages: 0, toolCalls: 0, errors: 0 };

    await this.bot.sendMessage(chatId,
      `📊 *${this.botName} Status*\n\n` +
      `Role: ${this.agentRole}\n` +
      `Model: ${data?.agent?.model || this.agentModel}\n` +
      `Messages: ${stats.messages}\n` +
      `Tool Calls: ${stats.toolCalls}\n` +
      `Errors: ${stats.errors}`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleWhoami(msg) {
    const chatId = msg.chat.id;
    const roleInfo = AGENT_ROLES[this.agentRole] || {};
    await this.bot.sendMessage(chatId,
      `🤖 *${this.botName}*\n` +
      `Role: ${roleInfo.name || this.agentRole}\n` +
      `Model: ${this.agentModel}\n` +
      `Bot ID: ${this.id}\n\n` +
      `_${roleInfo.description || 'Custom agent'}_`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleMemory(msg, query) {
    const chatId = msg.chat.id;
    const agent = this.requireAgent(chatId);
    if (!agent) return;

    const prompt = query
      ? `Recall your memories about: ${query}`
      : `List all your saved memories`;

    await this.chat(chatId, agent, prompt);
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId,
      `📖 *${this.botName} Commands*\n\n` +
      `/setkey <key> - Set your Gemini API key\n` +
      `/reset - Reset conversation (keeps memory)\n` +
      `/model <name> - Change AI model\n` +
      `/status - Bot status & stats\n` +
      `/whoami - Bot identity & role\n` +
      `/memory [query] - Search agent memory\n` +
      `/help - This message\n\n` +
      `Just type normally to chat!`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const agent = this.requireAgent(chatId);
    if (!agent) return;
    await this.chat(chatId, agent, msg.text);
  }

  async chat(chatId, agent, text) {
    await this.bot.sendChatAction(chatId, 'typing');
    const typingInterval = setInterval(() => {
      this.bot.sendChatAction(chatId, 'typing').catch(() => {});
    }, 4000);

    try {
      const toolsUsed = [];
      const response = await agent.send(text, {
        onToolCall: (name) => { toolsUsed.push(name); },
      });

      clearInterval(typingInterval);

      let reply = '';
      if (toolsUsed.length > 0) {
        reply += `🔧 _${toolsUsed.join(' → ')}_\n\n`;
      }
      reply += response;

      if (reply.length > 4000) {
        const chunks = splitMessage(reply, 4000);
        for (const chunk of chunks) {
          await this.bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' }).catch(() =>
            this.bot.sendMessage(chatId, chunk)
          );
        }
      } else {
        await this.bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' }).catch(() =>
          this.bot.sendMessage(chatId, reply)
        );
      }
    } catch (err) {
      clearInterval(typingInterval);
      const msg = err?.message || String(err);
      const clean = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
      await this.bot.sendMessage(chatId, `❌ *Error:* ${clean}`, { parse_mode: 'Markdown' }).catch(() =>
        this.bot.sendMessage(chatId, `❌ Error: ${clean}`)
      );
    }
  }

  stop() {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }
}

function splitMessage(text, maxLen) {
  const chunks = [];
  while (text.length > 0) {
    if (text.length <= maxLen) { chunks.push(text); break; }
    let splitAt = text.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(text.substring(0, splitAt));
    text = text.substring(splitAt);
  }
  return chunks;
}
