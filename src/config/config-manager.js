import Conf from 'conf';
import { PROVIDERS } from '../providers/index.js';

const config = new Conf({
  projectName: 'gimicoworker',
  schema: {
    provider: { type: 'string', default: '' },
    apiKeys: { type: 'object', default: {} },
    defaultModel: { type: 'string', default: '' },
    localAIUrl: { type: 'string', default: 'http://localhost:11434/v1' },
    setupComplete: { type: 'boolean', default: false },
    telegramBotToken: { type: 'string', default: '' },
  },
});

export const configManager = {
  // ─── Setup State ─────────────────────────────────────────────────

  isSetupComplete() {
    return config.get('setupComplete') && !!config.get('provider');
  },

  completeSetup() {
    config.set('setupComplete', true);
  },

  // ─── Provider ────────────────────────────────────────────────────

  getProvider() {
    return config.get('provider');
  },

  setProvider(provider) {
    if (!PROVIDERS[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    config.set('provider', provider);
  },

  // ─── API Keys ────────────────────────────────────────────────────

  getApiKey(provider) {
    provider = provider || config.get('provider');
    // Check config first, then env vars
    const stored = config.get(`apiKeys.${provider}`);
    if (stored) return stored;

    // Fallback to environment variables
    const info = PROVIDERS[provider];
    if (info?.envKey) {
      return process.env[info.envKey] || null;
    }
    return null;
  },

  setApiKey(provider, key) {
    config.set(`apiKeys.${provider}`, key);
  },

  removeApiKey(provider) {
    config.delete(`apiKeys.${provider}`);
  },

  // ─── Model ───────────────────────────────────────────────────────

  getDefaultModel() {
    const model = config.get('defaultModel');
    if (model) return model;
    const provider = config.get('provider');
    return PROVIDERS[provider]?.defaultModel || '';
  },

  setDefaultModel(model) {
    config.set('defaultModel', model);
  },

  // ─── Local AI ────────────────────────────────────────────────────

  getLocalAIUrl() {
    return config.get('localAIUrl');
  },

  setLocalAIUrl(url) {
    config.set('localAIUrl', url);
  },

  // ─── Telegram ────────────────────────────────────────────────────

  getTelegramToken() {
    return config.get('telegramBotToken') || process.env.TELEGRAM_BOT_TOKEN || '';
  },

  setTelegramToken(token) {
    config.set('telegramBotToken', token);
  },

  // ─── Full Config ─────────────────────────────────────────────────

  getAll() {
    return {
      provider: config.get('provider'),
      defaultModel: this.getDefaultModel(),
      setupComplete: config.get('setupComplete'),
      localAIUrl: config.get('localAIUrl'),
      hasTelegram: !!this.getTelegramToken(),
      configPath: config.path,
    };
  },

  reset() {
    config.clear();
  },

  getPath() {
    return config.path;
  },
};
