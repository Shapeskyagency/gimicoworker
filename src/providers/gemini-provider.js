import { GoogleGenAI } from '@google/genai';
import { BaseProvider, extractErrorMessage } from './base-provider.js';

export class GeminiProvider extends BaseProvider {
  constructor(apiKey, model) {
    super(apiKey, model || GeminiProvider.defaultModel);
    this.ai = new GoogleGenAI({ apiKey });
  }

  static get displayName() { return 'Google Gemini'; }

  static get availableModels() {
    return [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3.1-pro-preview',
    ];
  }

  static get defaultModel() { return 'gemini-2.5-flash'; }

  createChat(systemPrompt, tools = []) {
    const toolDeclarations = tools.length > 0
      ? [{ functionDeclarations: tools.map(t => t.declaration) }]
      : [];

    return this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemPrompt,
        tools: toolDeclarations,
      },
    });
  }

  async sendMessage(chat, message) {
    try {
      return await chat.sendMessage({ message });
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
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        return response.text || '[No response]';
      }

      const functionResponseParts = [];
      for (const fc of functionCalls) {
        const { name, args } = fc;
        if (onThinking) onThinking(`Executing: ${name}`);

        try {
          const result = await toolExecutor(name, args || {});
          const output = result == null ? 'Done'
            : (typeof result === 'string' ? result : JSON.stringify(result));
          functionResponseParts.push({
            functionResponse: { name, response: { result: output } },
          });
        } catch (err) {
          functionResponseParts.push({
            functionResponse: { name, response: { error: err.message } },
          });
        }
      }

      try {
        response = await this.sendMessage(chat, functionResponseParts);
      } catch (err) {
        throw err;
      }
      rounds++;
    }

    return response.text || '[Max tool rounds reached]';
  }
}
