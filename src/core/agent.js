import { createProvider } from '../providers/index.js';
import { ToolRegistry } from '../tools/registry.js';
import { Sandbox } from './sandbox.js';
import { createMemoryTools } from '../tools/memory-tools.js';
import { saveMessage, getRecentMessages, saveAgent } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

// Map roles to extra tool categories they should load
const ROLE_TOOL_CATEGORIES = {
  social: ['social', 'clipboard', 'notification'],
  researcher: ['scraping', 'vision', 'clipboard', 'notification'],
  general: ['clipboard', 'notification', 'scraping'],
  coder: ['clipboard', 'notification'],
  devops: ['clipboard', 'notification'],
  security: ['clipboard', 'notification', 'scraping'],
  sysadmin: ['clipboard', 'notification', 'vision'],
  filemanager: ['clipboard', 'notification'],
};

export class Agent {
  constructor({ id, name, role, model, provider, apiKey, providerName, systemPrompt, tools, allowedFolders, skillContext }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.model = model;
    this.providerName = providerName || 'gemini';
    this.systemPrompt = systemPrompt;
    this.toolRegistry = new ToolRegistry();
    this.chat = null;
    this.sessionId = uuidv4();
    this.history = [];
    this.createdAt = new Date().toISOString();
    this.status = 'idle';
    this.stats = { messages: 0, toolCalls: 0, errors: 0 };
    this._allowedTools = tools || null;
    this._allowedFolders = allowedFolders || [];
    this._toolCategoriesLoaded = false;

    // Determine which extra tool categories this role needs
    this._pendingToolCategories = ROLE_TOOL_CATEGORIES[role] || ['clipboard', 'notification'];

    // Use passed provider instance or create one
    if (provider) {
      this.provider = provider;
    } else {
      this.provider = createProvider(providerName || 'gemini', apiKey, model);
    }

    // Folder restriction sandbox
    this.sandbox = new Sandbox(this._allowedFolders);

    // Register memory tools for this agent
    const memTools = createMemoryTools(this.id);
    for (const tool of memTools) {
      this.toolRegistry.register(tool);
    }

    // Enhance system prompt with memory awareness
    this.systemPrompt += `\n\nYou have PERSISTENT MEMORY. Use memory_save to remember important things and memory_recall to retrieve them. Use shared_memory_save/recall for cross-agent info. Always check memory at the start of complex tasks.`;

    // Add skill context if provided
    if (skillContext) {
      this.systemPrompt += `\n\n--- SKILL KNOWLEDGE ---\n${skillContext}`;
    }

    // Add folder restriction context to system prompt
    if (this.sandbox.enabled) {
      const folders = this.sandbox.allowedFolders.join(', ');
      this.systemPrompt += `\n\nIMPORTANT: You are RESTRICTED to these folders only: ${folders}. All file operations and commands MUST target paths within these directories.`;
    }
  }

  getTools() {
    if (this._allowedTools) {
      return this.toolRegistry.getToolsByNames(this._allowedTools);
    }
    return this.toolRegistry.getAll();
  }

  /**
   * Load role-specific tool categories (lazy, once per agent lifetime).
   */
  async _loadToolCategories() {
    if (this._toolCategoriesLoaded) return;
    for (const category of this._pendingToolCategories) {
      await this.toolRegistry.registerCategory(category);
    }
    this._toolCategoriesLoaded = true;
  }

  async initChat() {
    // Load role-specific extra tools before creating the chat
    await this._loadToolCategories();

    const recentMsgs = getRecentMessages(this.id, 10);
    let contextPrompt = this.systemPrompt;
    if (recentMsgs.length > 0) {
      const summary = recentMsgs.map(m => `${m.role}: ${m.content.substring(0, 200)}`).join('\n');
      contextPrompt += `\n\nRecent conversation context:\n${summary}`;
    }

    const tools = this.getTools();
    this.chat = this.provider.createChat(contextPrompt, tools);
  }

  async send(message, { onThinking, onToolCall } = {}) {
    if (!this.chat) await this.initChat();

    this.status = 'thinking';
    this.stats.messages++;
    this.history.push({ role: 'user', content: message, timestamp: Date.now() });
    saveMessage(this.id, this.sessionId, 'user', message);

    try {
      const toolCalls = [];

      const baseExecutor = async (name, args) => {
        this.status = 'executing';
        this.stats.toolCalls++;
        toolCalls.push({ name, args });
        if (onToolCall) onToolCall(name, args);
        return await this.toolRegistry.execute(name, args);
      };

      const toolExecutor = this.sandbox.wrapExecutor(baseExecutor);

      const response = await this.provider.sendWithToolHandling(
        this.chat,
        message,
        toolExecutor,
        onThinking
      );

      this.status = 'idle';
      this.history.push({ role: 'agent', content: response, timestamp: Date.now() });
      saveMessage(this.id, this.sessionId, 'agent', response, toolCalls.length > 0 ? toolCalls : null);

      return response;
    } catch (err) {
      this.status = 'error';
      this.stats.errors++;
      const msg = err?.message || String(err);
      const cleanMsg = msg.length > 500 ? msg.substring(0, 500) + '...' : msg;
      const errMsg = `[Agent Error]: ${cleanMsg}`;
      this.history.push({ role: 'error', content: errMsg, timestamp: Date.now() });
      saveMessage(this.id, this.sessionId, 'error', errMsg);
      const cleanErr = new Error(cleanMsg);
      cleanErr.originalError = err;
      throw cleanErr;
    }
  }

  resetChat() {
    this.chat = null;
    this.sessionId = uuidv4();
    this.history = [];
    this.stats = { messages: 0, toolCalls: 0, errors: 0 };
  }

  persist() {
    saveAgent(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      model: this.model,
      provider: this.providerName,
      createdAt: this.createdAt,
      status: this.status,
      stats: this.stats,
      toolCount: this.toolRegistry.getToolCount(),
      historyLength: this.history.length,
      sandbox: this.sandbox.getInfo(),
    };
  }
}
