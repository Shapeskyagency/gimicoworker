import {
  remember,
  recall,
  recallByCategory,
  getAllMemories,
  forgetMemory,
  globalRemember,
  globalRecall,
} from '../db/database.js';

// These tools are injected into each agent so the AI can manage its own memory

export function createMemoryTools(agentId) {
  return [
    {
      declaration: {
        name: 'memory_save',
        description: 'Save important information to your persistent memory. Use this to remember facts, user preferences, project details, decisions, or anything you might need later across conversations.',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Short descriptive key for this memory (e.g., "user_name", "project_framework", "server_port")' },
            value: { type: 'string', description: 'The information to remember' },
            category: { type: 'string', description: 'Category: general, user_preference, project, decision, fact, task (default: general)' },
            importance: { type: 'number', description: 'Importance 1-10, higher = more important (default: 5)' },
          },
          required: ['key', 'value'],
        },
      },
      execute: async ({ key, value, category = 'general', importance = 5 }) => {
        remember(agentId, key, value, category, importance);
        return `Saved to memory: [${category}] ${key} = ${value}`;
      },
    },
    {
      declaration: {
        name: 'memory_recall',
        description: 'Search your persistent memory for previously saved information. Use this when you need to remember something from past conversations.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term to look up in memory' },
            category: { type: 'string', description: 'Optional: filter by category' },
          },
          required: ['query'],
        },
      },
      execute: async ({ query, category }) => {
        let results;
        if (category) {
          results = recallByCategory(agentId, category);
          results = results.filter(r => r.key.includes(query) || r.value.includes(query));
        } else {
          results = recall(agentId, query);
        }

        if (results.length === 0) {
          return 'No memories found matching that query.';
        }

        return results.map(r =>
          `[${r.category}] (importance: ${r.importance}) ${r.key}: ${r.value} (saved: ${r.created_at})`
        ).join('\n');
      },
    },
    {
      declaration: {
        name: 'memory_list',
        description: 'List all your saved memories, optionally filtered by category.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Optional category filter' },
          },
        },
      },
      execute: async ({ category } = {}) => {
        let memories;
        if (category) {
          memories = recallByCategory(agentId, category);
        } else {
          memories = getAllMemories(agentId);
        }

        if (memories.length === 0) {
          return 'No memories saved yet.';
        }

        return `Total memories: ${memories.length}\n\n` +
          memories.map(r =>
            `[${r.id}] [${r.category}] ${r.key}: ${r.value}`
          ).join('\n');
      },
    },
    {
      declaration: {
        name: 'memory_forget',
        description: 'Delete a specific memory by its ID.',
        parameters: {
          type: 'object',
          properties: {
            memory_id: { type: 'number', description: 'The memory ID to delete' },
          },
          required: ['memory_id'],
        },
      },
      execute: async ({ memory_id }) => {
        forgetMemory(memory_id);
        return `Memory #${memory_id} deleted.`;
      },
    },
    {
      declaration: {
        name: 'shared_memory_save',
        description: 'Save information to the shared global memory that ALL agents can access. Use for cross-agent coordination.',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Key for the shared memory' },
            value: { type: 'string', description: 'Value to store' },
          },
          required: ['key', 'value'],
        },
      },
      execute: async ({ key, value }) => {
        globalRemember(key, value);
        return `Saved to shared memory: ${key} = ${value}`;
      },
    },
    {
      declaration: {
        name: 'shared_memory_recall',
        description: 'Search the shared global memory accessible by all agents.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term' },
          },
          required: ['query'],
        },
      },
      execute: async ({ query }) => {
        const results = globalRecall(query);
        if (results.length === 0) return 'No shared memories found.';
        return results.map(r => `${r.key}: ${r.value} (updated: ${r.updated_at})`).join('\n');
      },
    },
  ];
}
