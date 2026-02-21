import { Agent } from './agent.js';
import { AGENT_ROLES } from '../config/defaults.js';
import { createProvider, PROVIDERS } from '../providers/index.js';
import { configManager } from '../config/config-manager.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Use stable home directory path so agents persist regardless of cwd
const DATA_DIR = path.join(os.homedir(), '.gimicoworker', 'data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

export class AgentManager {
  constructor(apiKey, providerName, model) {
    // Use config if not explicitly provided
    this.providerName = providerName || configManager.getProvider() || 'gemini';
    this.apiKey = apiKey || configManager.getApiKey(this.providerName);
    this.defaultModel = model || configManager.getDefaultModel() || PROVIDERS[this.providerName]?.defaultModel;
    this.agents = new Map();
    this.activeAgentId = null;
    this.nextId = 1;
  }

  createAgent({ name, role = 'general', model, customPrompt, tools, allowedFolders, skillContext } = {}) {
    const id = `agent_${this.nextId++}`;
    const roleConfig = AGENT_ROLES[role] || AGENT_ROLES.general;

    let systemPrompt = roleConfig.systemPrompt;
    if (role === 'custom' && customPrompt) {
      systemPrompt = customPrompt;
    } else if (customPrompt) {
      systemPrompt += `\n\nAdditional instructions: ${customPrompt}`;
    }

    const agentName = name || `${roleConfig.name} #${this.nextId - 1}`;
    const agentModel = model || this.defaultModel;

    const agent = new Agent({
      id,
      name: agentName,
      role,
      model: agentModel,
      apiKey: this.apiKey,
      providerName: this.providerName,
      systemPrompt,
      tools,
      allowedFolders,
      skillContext,
    });

    this.agents.set(id, agent);

    if (!this.activeAgentId) {
      this.activeAgentId = id;
    }

    return agent;
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  getActiveAgent() {
    return this.agents.get(this.activeAgentId);
  }

  setActiveAgent(id) {
    if (!this.agents.has(id)) {
      throw new Error(`Agent ${id} not found`);
    }
    this.activeAgentId = id;
    return this.agents.get(id);
  }

  removeAgent(id) {
    if (this.agents.size <= 1) {
      throw new Error('Cannot remove the last agent');
    }
    this.agents.delete(id);
    if (this.activeAgentId === id) {
      this.activeAgentId = this.agents.keys().next().value;
    }
  }

  listAgents() {
    return Array.from(this.agents.values()).map(a => a.toJSON());
  }

  getAgentCount() {
    return this.agents.size;
  }

  async saveState() {
    const state = {
      nextId: this.nextId,
      activeAgentId: this.activeAgentId,
      providerName: this.providerName,
      agents: Array.from(this.agents.values()).map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        model: a.model,
        providerName: a.providerName,
        createdAt: a.createdAt,
        allowedFolders: a._allowedFolders || [],
      })),
    };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(AGENTS_FILE, JSON.stringify(state, null, 2));
  }

  async loadState() {
    try {
      const data = await fs.readFile(AGENTS_FILE, 'utf-8');
      const state = JSON.parse(data);

      if (!state.agents || state.agents.length === 0) return;

      this.nextId = state.nextId || 1;

      for (const agentData of state.agents) {
        const roleConfig = AGENT_ROLES[agentData.role] || AGENT_ROLES.general;
        const agentModel = agentData.model || this.defaultModel;

        const agent = new Agent({
          id: agentData.id,
          name: agentData.name,
          role: agentData.role,
          model: agentModel,
          apiKey: this.apiKey,
          providerName: agentData.providerName || this.providerName,
          systemPrompt: roleConfig.systemPrompt,
          allowedFolders: agentData.allowedFolders || [],
        });

        this.agents.set(agentData.id, agent);
      }

      if (state.activeAgentId && this.agents.has(state.activeAgentId)) {
        this.activeAgentId = state.activeAgentId;
      } else if (this.agents.size > 0) {
        this.activeAgentId = this.agents.keys().next().value;
      }
    } catch {
      // No saved state or corrupted file
    }
  }
}
