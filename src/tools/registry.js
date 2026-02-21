import { shellTools } from './shell.js';
import { filesystemTools } from './filesystem.js';
import { processTools } from './process-manager.js';
import { systemTools } from './system-info.js';
import { networkTools } from './network.js';

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this._loadedCategories = new Set();
    this.registerDefaults();
  }

  registerDefaults() {
    const allTools = [
      ...shellTools,
      ...filesystemTools,
      ...processTools,
      ...systemTools,
      ...networkTools,
    ];

    for (const tool of allTools) {
      this.tools.set(tool.declaration.name, tool);
    }
  }

  /**
   * Lazy-load optional tool categories on demand.
   * Categories: social, vision, scraping, clipboard, notification
   */
  async registerCategory(category) {
    if (this._loadedCategories.has(category)) return;

    try {
      switch (category) {
        case 'social': {
          const { createWhatsAppTools, createInstagramTools } = await import('./social-tools.js');
          for (const tool of [...createWhatsAppTools(), ...createInstagramTools()]) {
            this.tools.set(tool.declaration.name, tool);
          }
          break;
        }
        case 'vision': {
          const { visionTools } = await import('./vision-tools.js');
          for (const tool of visionTools) this.tools.set(tool.declaration.name, tool);
          break;
        }
        case 'scraping': {
          const { scrapingTools } = await import('./scraping-tools.js');
          for (const tool of scrapingTools) this.tools.set(tool.declaration.name, tool);
          break;
        }
        case 'clipboard': {
          const { clipboardTools } = await import('./clipboard-tools.js');
          for (const tool of clipboardTools) this.tools.set(tool.declaration.name, tool);
          break;
        }
        case 'notification': {
          const { notificationTools } = await import('./notification-tools.js');
          for (const tool of notificationTools) this.tools.set(tool.declaration.name, tool);
          break;
        }
        default:
          return; // Unknown category, skip silently
      }
      this._loadedCategories.add(category);
    } catch (err) {
      // Silently skip if a category's dependency isn't installed
      // (e.g. playwright not installed -> social tools won't load)
    }
  }

  register(tool) {
    this.tools.set(tool.declaration.name, tool);
  }

  getAll() {
    return Array.from(this.tools.values());
  }

  getAllDeclarations() {
    return Array.from(this.tools.values()).map(t => t.declaration);
  }

  getToolsByNames(names) {
    return names
      .map(name => this.tools.get(name))
      .filter(Boolean);
  }

  async execute(toolName, args) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return await tool.execute(args);
  }

  listTools() {
    const list = [];
    for (const [name, tool] of this.tools) {
      list.push({
        name,
        description: tool.declaration.description,
      });
    }
    return list;
  }

  getToolCount() {
    return this.tools.size;
  }
}
