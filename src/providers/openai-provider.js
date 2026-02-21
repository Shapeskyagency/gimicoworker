import OpenAI from 'openai';
import { BaseProvider, extractErrorMessage } from './base-provider.js';

/**
 * OpenAI Provider - Works with OpenAI API and any OpenAI-compatible API
 * (Moonshot/Kimi, Local AI via Ollama, etc.)
 */
export class OpenAIProvider extends BaseProvider {
  constructor(apiKey, model, baseURL = undefined) {
    super(apiKey, model || OpenAIProvider.defaultModel);
    this.client = new OpenAI({
      apiKey,
      ...(baseURL && { baseURL }),
    });
    this.baseURL = baseURL;
  }

  static get displayName() { return 'OpenAI'; }

  static get availableModels() {
    return [
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4o',
      'gpt-4o-mini',
      'o3-mini',
    ];
  }

  static get defaultModel() { return 'gpt-4.1-mini'; }

  // Convert our tool declarations to OpenAI format
  _formatTools(tools) {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.declaration.name,
        description: t.declaration.description,
        parameters: t.declaration.parameters || { type: 'object', properties: {} },
      },
    }));
  }

  createChat(systemPrompt, tools = []) {
    return {
      messages: [{ role: 'system', content: systemPrompt }],
      tools: this._formatTools(tools),
      model: this.model,
    };
  }

  async sendMessage(chat, message) {
    try {
      // Add user message
      if (typeof message === 'string') {
        chat.messages.push({ role: 'user', content: message });
      } else if (Array.isArray(message)) {
        // Tool results
        for (const toolResult of message) {
          chat.messages.push(toolResult);
        }
      }

      const params = {
        model: chat.model,
        messages: chat.messages,
      };

      if (chat.tools.length > 0) {
        params.tools = chat.tools;
      }

      const response = await this.client.chat.completions.create(params);
      const choice = response.choices[0];

      // Add assistant message to history
      chat.messages.push(choice.message);

      return choice;
    } catch (err) {
      const error = new Error(extractErrorMessage(err));
      error.originalError = err;
      throw error;
    }
  }

  async sendWithToolHandling(chat, message, toolExecutor, onThinking) {
    let choice = await this.sendMessage(chat, message);
    let rounds = 0;
    const maxRounds = 25;

    while (rounds < maxRounds) {
      const toolCalls = choice.message?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        return choice.message?.content || '[No response]';
      }

      // Execute tool calls
      const toolResults = [];
      for (const tc of toolCalls) {
        const name = tc.function.name;
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}

        if (onThinking) onThinking(`Executing: ${name}`);

        try {
          const result = await toolExecutor(name, args);
          const output = result == null ? 'Done'
            : (typeof result === 'string' ? result : JSON.stringify(result));
          toolResults.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: output,
          });
        } catch (err) {
          toolResults.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: `Error: ${err.message}`,
          });
        }
      }

      choice = await this.sendMessage(chat, toolResults);
      rounds++;
    }

    return choice.message?.content || '[Max tool rounds reached]';
  }
}

/**
 * Moonshot/Kimi Provider - Uses OpenAI-compatible API
 */
export class MoonshotProvider extends OpenAIProvider {
  constructor(apiKey, model) {
    super(apiKey, model || MoonshotProvider.defaultModel, 'https://api.moonshot.cn/v1');
  }

  static get displayName() { return 'Moonshot (Kimi)'; }

  static get availableModels() {
    return [
      'moonshot-v1-auto',
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k',
    ];
  }

  static get defaultModel() { return 'moonshot-v1-auto'; }
}

/**
 * Local AI Provider (Ollama) - Uses OpenAI-compatible API at localhost
 */
export class LocalAIProvider extends OpenAIProvider {
  constructor(apiKey, model, baseURL) {
    super(
      apiKey || 'ollama',
      model || LocalAIProvider.defaultModel,
      baseURL || 'http://localhost:11434/v1'
    );
  }

  static get displayName() { return 'Local AI (Ollama)'; }

  static get availableModels() {
    return [
      'llama3.3',
      'qwen2.5-coder',
      'deepseek-r1',
      'mistral',
      'gemma2',
      'phi4',
    ];
  }

  static get defaultModel() { return 'llama3.3'; }
}
