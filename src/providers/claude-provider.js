import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, extractErrorMessage } from './base-provider.js';

export class ClaudeProvider extends BaseProvider {
  constructor(apiKey, model) {
    super(apiKey, model || ClaudeProvider.defaultModel);
    this.client = new Anthropic({ apiKey });
  }

  static get displayName() { return 'Anthropic Claude'; }

  static get availableModels() {
    return [
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-6',
    ];
  }

  static get defaultModel() { return 'claude-sonnet-4-6'; }

  // Convert our tool declarations to Claude format
  _formatTools(tools) {
    return tools.map(t => ({
      name: t.declaration.name,
      description: t.declaration.description,
      input_schema: t.declaration.parameters || { type: 'object', properties: {} },
    }));
  }

  createChat(systemPrompt, tools = []) {
    return {
      system: systemPrompt,
      messages: [],
      tools: this._formatTools(tools),
      model: this.model,
    };
  }

  async sendMessage(chat, message) {
    try {
      if (typeof message === 'string') {
        chat.messages.push({ role: 'user', content: message });
      } else if (Array.isArray(message)) {
        // Tool results - wrap in user message
        chat.messages.push({
          role: 'user',
          content: message,
        });
      }

      const params = {
        model: chat.model,
        max_tokens: 8192,
        system: chat.system,
        messages: chat.messages,
      };

      if (chat.tools.length > 0) {
        params.tools = chat.tools;
      }

      const response = await this.client.messages.create(params);

      // Add assistant response to history
      chat.messages.push({ role: 'assistant', content: response.content });

      return response;
    } catch (err) {
      const error = new Error(extractErrorMessage(err));
      error.originalError = err;
      throw error;
    }
  }

  async sendWithToolHandling(chat, message, toolExecutor, onThinking) {
    let response = await this.sendMessage(chat, message);
    let rounds = 0;
    const maxRounds = 25;

    while (rounds < maxRounds) {
      // Check if response has tool_use blocks
      const toolUseBlocks = response.content?.filter(b => b.type === 'tool_use') || [];

      if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
        const textBlocks = response.content?.filter(b => b.type === 'text') || [];
        return textBlocks.map(b => b.text).join('\n') || '[No response]';
      }

      // Execute tool calls
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const { name, input, id } = block;
        if (onThinking) onThinking(`Executing: ${name}`);

        try {
          const result = await toolExecutor(name, input || {});
          const output = result == null ? 'Done'
            : (typeof result === 'string' ? result : JSON.stringify(result));
          toolResults.push({
            type: 'tool_result',
            tool_use_id: id,
            content: output,
          });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: id,
            content: `Error: ${err.message}`,
            is_error: true,
          });
        }
      }

      response = await this.sendMessage(chat, toolResults);
      rounds++;
    }

    const textBlocks = response.content?.filter(b => b.type === 'text') || [];
    return textBlocks.map(b => b.text).join('\n') || '[Max tool rounds reached]';
  }
}
