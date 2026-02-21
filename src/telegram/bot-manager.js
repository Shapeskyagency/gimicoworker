import { DedicatedBot } from './dedicated-bot.js';
import { TelegramBotService } from './bot.js';
import {
  getAllTelegramBots,
  addTelegramBot,
  removeTelegramBot,
  getTelegramBotById,
  toggleTelegramBot,
} from '../db/database.js';
import { AGENT_ROLES } from '../config/defaults.js';

/**
 * Manages unlimited Telegram bots.
 * Each bot is a separate Telegram bot token linked to a specific agent role.
 *
 * Bot types:
 *   - "master" bot: The original multi-agent bot (from .env TELEGRAM_BOT_TOKEN)
 *   - "dedicated" bots: One bot = one agent role (from DB)
 */
export class BotManager {
  constructor(geminiApiKey) {
    this.geminiApiKey = geminiApiKey;
    this.bots = new Map(); // id -> DedicatedBot | TelegramBotService
    this.masterBot = null;
  }

  // ─── Start all bots ──────────────────────────────────────────────

  startAll(masterToken = null) {
    console.log('\n  Starting all Telegram bots...\n');

    // 1. Start master bot if token provided
    if (masterToken) {
      this.masterBot = new TelegramBotService(masterToken, this.geminiApiKey);
      this.masterBot.start();
      this.bots.set('master', this.masterBot);
      console.log(`  [master] Multi-Agent Commander - Running`);
    }

    // 2. Start all dedicated bots from DB
    const botConfigs = getAllTelegramBots();

    for (const config of botConfigs) {
      try {
        const bot = new DedicatedBot({
          id: config.id,
          botToken: config.bot_token,
          botName: config.bot_name,
          agentRole: config.agent_role,
          agentModel: config.agent_model,
          customPrompt: config.custom_prompt,
          geminiApiKey: this.geminiApiKey,
        });
        bot.start();
        this.bots.set(config.id, bot);
      } catch (err) {
        console.error(`  [${config.id}] ${config.bot_name} - FAILED: ${err.message}`);
      }
    }

    const total = this.bots.size;
    console.log(`\n  Total bots running: ${total}`);
    console.log('  Press Ctrl+C to stop all.\n');
  }

  // ─── Add a new bot ───────────────────────────────────────────────

  static addBot({ botToken, botName, botUsername, agentRole, agentModel, customPrompt }) {
    if (!botToken || !botName) {
      throw new Error('Bot token and name are required');
    }
    if (agentRole && agentRole !== 'custom' && !AGENT_ROLES[agentRole]) {
      throw new Error(`Unknown role: ${agentRole}. Available: ${Object.keys(AGENT_ROLES).join(', ')}`);
    }

    addTelegramBot({ botToken, botName, botUsername, agentRole, agentModel, customPrompt });
  }

  // ─── Remove a bot ────────────────────────────────────────────────

  static removeBot(id) {
    const bot = getTelegramBotById(id);
    if (!bot) throw new Error(`Bot #${id} not found`);
    removeTelegramBot(id);
    return bot;
  }

  // ─── List all configured bots ────────────────────────────────────

  static listBots() {
    return getAllTelegramBots();
  }

  // ─── Enable/Disable ──────────────────────────────────────────────

  static toggleBot(id, enabled) {
    toggleTelegramBot(id, enabled);
  }

  // ─── Stop all ────────────────────────────────────────────────────

  stopAll() {
    for (const [id, bot] of this.bots) {
      bot.stop();
    }
    this.bots.clear();
    console.log('  All bots stopped.');
  }
}
