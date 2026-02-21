import { GeminiProvider } from './gemini-provider.js';
import { OpenAIProvider, MoonshotProvider, LocalAIProvider } from './openai-provider.js';
import { ClaudeProvider } from './claude-provider.js';

// ─── Provider Registry ─────────────────────────────────────────────

export const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    class: GeminiProvider,
    envKey: 'GEMINI_API_KEY',
    keyUrl: 'https://aistudio.google.com/apikey',
    description: 'Google\'s Gemini models - fast, capable, free tier available',
    models: GeminiProvider.availableModels,
    defaultModel: GeminiProvider.defaultModel,
  },
  openai: {
    name: 'OpenAI',
    class: OpenAIProvider,
    envKey: 'OPENAI_API_KEY',
    keyUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4.1, GPT-4o, o3-mini - industry standard',
    models: OpenAIProvider.availableModels,
    defaultModel: OpenAIProvider.defaultModel,
  },
  claude: {
    name: 'Anthropic Claude',
    class: ClaudeProvider,
    envKey: 'ANTHROPIC_API_KEY',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude Opus, Sonnet, Haiku - excellent reasoning',
    models: ClaudeProvider.availableModels,
    defaultModel: ClaudeProvider.defaultModel,
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    class: MoonshotProvider,
    envKey: 'MOONSHOT_API_KEY',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    description: 'Kimi AI - great for Chinese + English, long context',
    models: MoonshotProvider.availableModels,
    defaultModel: MoonshotProvider.defaultModel,
  },
  local: {
    name: 'Local AI (Ollama)',
    class: LocalAIProvider,
    envKey: null,
    keyUrl: 'https://ollama.com/download',
    description: 'Run models locally with Ollama - private, free, no API key',
    models: LocalAIProvider.availableModels,
    defaultModel: LocalAIProvider.defaultModel,
    noKey: true,
  },
};

/**
 * Create a provider instance
 */
export function createProvider(providerName, apiKey, model) {
  const info = PROVIDERS[providerName];
  if (!info) {
    throw new Error(`Unknown provider: "${providerName}". Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const ProviderClass = info.class;
  return new ProviderClass(apiKey, model || info.defaultModel);
}

export { GeminiProvider, OpenAIProvider, ClaudeProvider, MoonshotProvider, LocalAIProvider };
