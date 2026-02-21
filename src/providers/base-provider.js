/**
 * Base AI Provider - Abstract interface for all AI providers.
 * Each provider (Gemini, OpenAI, Claude, etc.) extends this.
 */
export class BaseProvider {
  constructor(apiKey, model) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is abstract - use a specific provider');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /** Create a new chat session */
  createChat(systemPrompt, tools = []) {
    throw new Error('createChat() not implemented');
  }

  /** Send a message and get response */
  async sendMessage(chat, message) {
    throw new Error('sendMessage() not implemented');
  }

  /** Send message with automatic tool/function calling loop */
  async sendWithToolHandling(chat, message, toolExecutor, onThinking) {
    throw new Error('sendWithToolHandling() not implemented');
  }

  /** Get provider display name */
  static get displayName() {
    return 'Base Provider';
  }

  /** Get available models for this provider */
  static get availableModels() {
    return [];
  }

  /** Get default model */
  static get defaultModel() {
    return '';
  }
}

// Clean error message extraction shared across providers
export function extractErrorMessage(err) {
  if (typeof err === 'string') return err;
  const msg = err?.message || String(err);

  // Try JSON error body
  try {
    const jsonMatch = msg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) return parsed.error.message;
    }
  } catch { /* not JSON */ }

  if (err?.status && err?.statusText) {
    return `API error ${err.status}: ${err.statusText}`;
  }

  if (msg.includes('Symbol(') || msg.includes('kHeadersCount')) {
    return 'API request failed. Check your API key and model.';
  }

  if (msg.length > 300) {
    const firstLine = msg.split('\n')[0];
    if (firstLine.length > 20 && firstLine.length < 200) return firstLine;
    return msg.substring(0, 200) + '...';
  }

  return msg || 'Unknown API error';
}
