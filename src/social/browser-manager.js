import path from 'path';
import os from 'os';
import fs from 'fs';

const BROWSER_DATA_DIR = path.join(os.homedir(), '.gimicoworker', 'browser-data');

class BrowserManager {
  constructor() {
    this.contexts = new Map();   // platform -> BrowserContext
    this.pages = new Map();      // platform -> Page
  }

  /**
   * Launch a persistent browser context for a platform.
   * Persistent contexts store cookies/sessions so logins survive restarts.
   */
  async launch(platform, options = {}) {
    // Return existing page if already open
    if (this.isActive(platform)) {
      return this.pages.get(platform);
    }

    const { chromium } = await import('playwright');
    const userDataDir = path.join(BROWSER_DATA_DIR, platform);
    fs.mkdirSync(userDataDir, { recursive: true });

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: options.headless ?? false,
      viewport: { width: 1366, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      ...options,
    });

    const page = context.pages()[0] || await context.newPage();

    // Hide automation indicators
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    this.contexts.set(platform, context);
    this.pages.set(platform, page);
    return page;
  }

  getPage(platform) {
    return this.pages.get(platform);
  }

  isActive(platform) {
    const ctx = this.contexts.get(platform);
    if (!ctx) return false;
    try {
      // Check if context is still alive
      ctx.pages();
      return true;
    } catch {
      this.contexts.delete(platform);
      this.pages.delete(platform);
      return false;
    }
  }

  async close(platform) {
    const context = this.contexts.get(platform);
    if (context) {
      try { await context.close(); } catch {}
      this.contexts.delete(platform);
      this.pages.delete(platform);
    }
  }

  async closeAll() {
    for (const platform of [...this.contexts.keys()]) {
      await this.close(platform);
    }
  }

  getActivePlatforms() {
    const active = [];
    for (const [platform] of this.contexts) {
      if (this.isActive(platform)) active.push(platform);
    }
    return active;
  }
}

// Singleton
export const browserManager = new BrowserManager();
