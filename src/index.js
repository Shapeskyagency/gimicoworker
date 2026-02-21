// GimiCoworker: Multi-AI Agent OS Control System
// Public API exports for programmatic usage

export { Agent } from './core/agent.js';
export { AgentManager } from './core/agent-manager.js';
export { ToolRegistry } from './tools/registry.js';
export { CLI } from './cli.js';
export { AGENT_ROLES } from './config/defaults.js';
export { PROVIDERS, createProvider } from './providers/index.js';
export { configManager } from './config/config-manager.js';
