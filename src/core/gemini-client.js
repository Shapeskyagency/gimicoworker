import { GoogleGenAI } from '@google/genai';
import { DEFAULT_MODEL } from '../config/defaults.js';

// ─── Extract clean error message from Gemini SDK errors ─────────────
function extractErrorMessage(err) {
  if (typeof err === 'string') return err;

  const msg = err?.message || String(err);

  // Try to parse JSON error body from Gemini API
  // The SDK often wraps the JSON response as the error message
  try {
    // Check if message contains a JSON object with error details
    const jsonMatch = msg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        return `Gemini API: ${parsed.error.message}`;
      }
    }
  } catch { /* not JSON, continue */ }

  // Try direct error properties from SDK
  if (err?.errorDetails?.length > 0) {
    return err.errorDetails.map(d => d.message || d.reason).join('; ');
  }

  if (err?.status && err?.statusText) {
    return `Gemini API error ${err.status}: ${err.statusText}`;
  }

  // Strip raw HTTP response dumps (headers, symbols, etc.)
  if (msg.includes('Symbol(') || msg.includes('kHeadersCount')) {
    const statusMatch = msg.match(/(\d{3})\s+([\w\s]+)/);
    if (statusMatch) return `Gemini API error ${statusMatch[1]}: ${statusMatch[2].trim()}`;
    return 'Gemini API request failed. Check your API key and model name.';
  }

  // Trim overly long messages
  if (msg.length > 300) {
    const firstLine = msg.split('\n')[0];
    if (firstLine.length > 20 && firstLine.length < 200) return firstLine;
    return msg.substring(0, 200) + '...';
  }

  return msg || 'Unknown Gemini API error';
}

export class GeminiClient {
  constructor(apiKey, model = DEFAULT_MODEL) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  createChat(systemPrompt, tools = []) {
    const toolDeclarations = tools.length > 0
      ? [{ functionDeclarations: tools.map(t => t.declaration) }]
      : [];

    const chat = this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemPrompt,
        tools: toolDeclarations,
      },
    });

    return chat;
  }

  async sendMessage(chat, message) {
    try {
      const response = await chat.sendMessage({ message });
      return response;
    } catch (err) {
      const cleanMsg = extractErrorMessage(err);
      const error = new Error(cleanMsg);
      error.originalError = err;
      throw error;
    }
  }

  async sendWithToolHandling(chat, message, toolExecutor, onThinking) {
    let response;
    try {
      response = await this.sendMessage(chat, message);
    } catch (err) {
      throw err; // Already cleaned by sendMessage
    }

    let rounds = 0;
    const maxRounds = 25;

    while (rounds < maxRounds) {
      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        return response.text || '[No response]';
      }

      // Execute all function calls and build functionResponse Parts
      const functionResponseParts = [];
      for (const fc of functionCalls) {
        const { name, args } = fc;

        if (onThinking) {
          onThinking(`Executing: ${name}`);
        }

        try {
          const result = await toolExecutor(name, args || {});
          const output = result === undefined || result === null
            ? 'Done'
            : (typeof result === 'string' ? result : JSON.stringify(result));
          functionResponseParts.push({
            functionResponse: {
              name,
              response: { result: output },
            },
          });
        } catch (err) {
          functionResponseParts.push({
            functionResponse: {
              name,
              response: { error: err.message },
            },
          });
        }
      }

      // Send tool results back as proper Part objects
      try {
        response = await this.sendMessage(chat, functionResponseParts);
      } catch (err) {
        throw err; // Already cleaned by sendMessage
      }
      rounds++;
    }

    return response.text || '[Agent completed task after maximum tool rounds]';
  }
}
