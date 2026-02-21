import TelegramBot from 'node-telegram-bot-api';
import { AgentManager } from '../core/agent-manager.js';
import { AGENT_ROLES } from '../config/defaults.js';
import {
  saveTelegramUser,
  getTelegramUser,
  updateTelegramActiveAgent,
} from '../db/database.js';

export class TelegramBotService {
  constructor(botToken, defaultApiKey = null) {
    this.botToken = botToken;
    this.defaultApiKey = defaultApiKey;
    this.bot = null;
    this.userManagers = new Map(); // chatId -> AgentManager
  }

  start() {
    this.bot = new TelegramBot(this.botToken, { polling: true });
    console.log('[Telegram] Bot started. Waiting for messages...');

    // ─── Commands ──────────────────────────────────────────────────

    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/setkey (.+)/, (msg, match) => this.handleSetKey(msg, match[1]));
    this.bot.onText(/\/create(?:\s+(\w+))?(?:\s+(.+))?/, (msg, match) => this.handleCreate(msg, match));
    this.bot.onText(/\/list/, (msg) => this.handleList(msg));
    this.bot.onText(/\/switch (.+)/, (msg, match) => this.handleSwitch(msg, match[1]));
    this.bot.onText(/\/remove (.+)/, (msg, match) => this.handleRemove(msg, match[1]));
    this.bot.onText(/\/reset/, (msg) => this.handleReset(msg));
    this.bot.onText(/\/model (.+)/, (msg, match) => this.handleModel(msg, match[1]));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/roles/, (msg) => this.handleRoles(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/memory(?:\s+(.+))?/, (msg, match) => this.handleMemory(msg, match?.[1]));

    // ─── Regular messages (chat with agent) ────────────────────────

    this.bot.on('message', (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        this.handleMessage(msg);
      }
    });

    this.bot.on('polling_error', (err) => {
      console.error('[Telegram] Polling error:', err.message);
    });
  }

  // ─── User Manager ─────────────────────────────────────────────────

  getManager(chatId) {
    if (this.userManagers.has(chatId)) {
      return this.userManagers.get(chatId);
    }

    const user = getTelegramUser(chatId);
    const apiKey = user?.api_key || this.defaultApiKey;

    if (!apiKey) return null;

    const manager = new AgentManager(apiKey);
    this.userManagers.set(chatId, manager);
    return manager;
  }

  requireManager(chatId) {
    const manager = this.getManager(chatId);
    if (!manager) {
      this.bot.sendMessage(chatId,
        '⚠️ *No API key set!*\n\nSet your Gemini API key first:\n`/setkey YOUR_GEMINI_API_KEY`\n\nGet one free at [Google AI Studio](https://aistudio.google.com/apikey)',
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
      return null;
    }
    return manager;
  }

  // ─── Command Handlers ─────────────────────────────────────────────

  async handleStart(msg) {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'User';

    await this.bot.sendMessage(chatId,
      `🤖 *CLI-AGT | Multi-Agent OS Control*\n\nWelcome ${name}!\n\nI'm your AI agent commander. Create multiple AI agents, each with different roles, and control your systems from anywhere.\n\n*Quick Start:*\n1. /setkey YOUR\\_GEMINI\\_API\\_KEY\n2. /create general MyAgent\n3. Just type to chat!\n\n/help for all commands`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleSetKey(msg, apiKey) {
    const chatId = msg.chat.id;
    const key = apiKey.trim();

    saveTelegramUser(chatId, msg.from.username || msg.from.first_name, key);
    this.userManagers.delete(chatId); // Force refresh

    // Delete the message with the API key for security
    try {
      await this.bot.deleteMessage(chatId, msg.message_id);
    } catch { /* might not have permission */ }

    await this.bot.sendMessage(chatId,
      '✅ *API key saved!*\n\nYour key has been stored securely. The message with your key was deleted for safety.\n\nNow create an agent: `/create general MyBot`',
      { parse_mode: 'Markdown' }
    );
  }

  async handleCreate(msg, match) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const role = match?.[1] || 'general';
    const name = match?.[2] || null;

    if (!AGENT_ROLES[role]) {
      const roles = Object.keys(AGENT_ROLES).join(', ');
      await this.bot.sendMessage(chatId, `❌ Unknown role: "${role}"\n\nAvailable: ${roles}`);
      return;
    }

    const agent = manager.createAgent({ name, role });

    await this.bot.sendMessage(chatId,
      `✅ *Agent Created!*\n\n🆔 \`${agent.id}\`\n📛 ${agent.name}\n🎭 ${agent.role}\n🧠 ${agent.model}\n\nThis agent is now active. Just type to chat!`,
      { parse_mode: 'Markdown' }
    );
  }

  async handleList(msg) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const agents = manager.listAgents();
    if (agents.length === 0) {
      await this.bot.sendMessage(chatId, 'No agents yet. Create one: `/create general MyBot`', { parse_mode: 'Markdown' });
      return;
    }

    let text = '🤖 *Your Agents:*\n\n';
    for (const a of agents) {
      const active = a.id === manager.activeAgentId ? ' ◀️ active' : '';
      text += `\`${a.id}\` *${a.name}*${active}\n  Role: ${a.role} | Model: ${a.model}\n  Messages: ${a.stats.messages} | Tools: ${a.stats.toolCalls}\n\n`;
    }

    await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  async handleSwitch(msg, agentId) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const id = agentId.startsWith('agent_') ? agentId : `agent_${agentId}`;

    try {
      const agent = manager.setActiveAgent(id);
      await this.bot.sendMessage(chatId, `✅ Switched to *${agent.name}* (${agent.role})`, { parse_mode: 'Markdown' });
    } catch {
      const ids = manager.listAgents().map(a => `\`${a.id}\``).join(', ');
      await this.bot.sendMessage(chatId, `❌ Agent not found.\n\nAvailable: ${ids}`, { parse_mode: 'Markdown' });
    }
  }

  async handleRemove(msg, agentId) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const id = agentId.startsWith('agent_') ? agentId : `agent_${agentId}`;

    try {
      manager.removeAgent(id);
      await this.bot.sendMessage(chatId, `✅ Agent \`${id}\` removed.`, { parse_mode: 'Markdown' });
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  }

  async handleReset(msg) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const agent = manager.getActiveAgent();
    if (!agent) {
      await this.bot.sendMessage(chatId, '❌ No active agent.');
      return;
    }
    agent.resetChat();
    await this.bot.sendMessage(chatId, `✅ Reset conversation for *${agent.name}*`, { parse_mode: 'Markdown' });
  }

  async handleModel(msg, model) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const agent = manager.getActiveAgent();
    if (!agent) {
      await this.bot.sendMessage(chatId, '❌ No active agent.');
      return;
    }

    agent.model = model.trim();
    agent.gemini.model = model.trim();
    agent.resetChat();
    await this.bot.sendMessage(chatId, `✅ Model changed to \`${model.trim()}\` for *${agent.name}*`, { parse_mode: 'Markdown' });
  }

  async handleStatus(msg) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const agents = manager.listAgents();
    const active = manager.getActiveAgent();

    const text = `📊 *System Status*\n\n` +
      `Active: ${active ? active.name : 'None'}\n` +
      `Agents: ${agents.length}\n` +
      `Total Messages: ${agents.reduce((s, a) => s + a.stats.messages, 0)}\n` +
      `Total Tool Calls: ${agents.reduce((s, a) => s + a.stats.toolCalls, 0)}\n` +
      `Errors: ${agents.reduce((s, a) => s + a.stats.errors, 0)}`;

    await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  async handleRoles(msg) {
    const chatId = msg.chat.id;
    let text = '🎭 *Available Roles:*\n\n';
    for (const [key, role] of Object.entries(AGENT_ROLES)) {
      text += `\`${key}\` - ${role.name}\n  _${role.description}_\n\n`;
    }
    await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }

  async handleMemory(msg, query) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    const agent = manager.getActiveAgent();
    if (!agent) {
      await this.bot.sendMessage(chatId, '❌ No active agent.');
      return;
    }

    // Tell agent to recall or list memories
    const prompt = query
      ? `Recall your memories about: ${query}`
      : `List all your saved memories`;

    await this.handleAgentChat(chatId, manager, prompt);
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId,
      `📖 *CLI-AGT Commands*\n\n` +
      `/setkey <key> - Set Gemini API key\n` +
      `/create <role> [name] - Create agent\n` +
      `/list - List all agents\n` +
      `/switch <id> - Switch active agent\n` +
      `/remove <id> - Remove agent\n` +
      `/reset - Reset conversation\n` +
      `/model <name> - Change model\n` +
      `/roles - List available roles\n` +
      `/status - System status\n` +
      `/memory [query] - Search agent memory\n` +
      `/help - This message\n\n` +
      `Just type normally to chat with the active agent!`,
      { parse_mode: 'Markdown' }
    );
  }

  // ─── Chat with Agent ──────────────────────────────────────────────

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const manager = this.requireManager(chatId);
    if (!manager) return;

    // Auto-create a default agent if none exist
    if (manager.getAgentCount() === 0) {
      manager.createAgent({ name: 'Atlas', role: 'general' });
    }

    await this.handleAgentChat(chatId, manager, msg.text);
  }

  async handleAgentChat(chatId, manager, text) {
    const agent = manager.getActiveAgent();
    if (!agent) {
      await this.bot.sendMessage(chatId, '❌ No active agent. Create one: `/create general MyBot`', { parse_mode: 'Markdown' });
      return;
    }

    // Send "typing" indicator
    await this.bot.sendChatAction(chatId, 'typing');
    const typingInterval = setInterval(() => {
      this.bot.sendChatAction(chatId, 'typing').catch(() => {});
    }, 4000);

    try {
      const toolsUsed = [];

      const response = await agent.send(text, {
        onToolCall: (name) => {
          toolsUsed.push(name);
        },
      });

      clearInterval(typingInterval);

      // Build response with tool usage header
      let reply = '';
      if (toolsUsed.length > 0) {
        reply += `🔧 _${toolsUsed.join(' → ')}_\n\n`;
      }
      reply += response;

      // Telegram has a 4096 char limit, split if needed
      if (reply.length > 4000) {
        const chunks = splitMessage(reply, 4000);
        for (const chunk of chunks) {
          await this.bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' }).catch(() =>
            this.bot.sendMessage(chatId, chunk) // Retry without markdown on parse failure
          );
        }
      } else {
        await this.bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' }).catch(() =>
          this.bot.sendMessage(chatId, reply) // Retry without markdown
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
      console.log('[Telegram] Bot stopped.');
    }
  }
}

function splitMessage(text, maxLen) {
  const chunks = [];
  while (text.length > 0) {
    if (text.length <= maxLen) {
      chunks.push(text);
      break;
    }
    let splitAt = text.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(text.substring(0, splitAt));
    text = text.substring(splitAt);
  }
  return chunks;
}
