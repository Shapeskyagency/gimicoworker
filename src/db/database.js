import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Use stable home directory path so DB persists regardless of cwd
const DB_DIR = path.join(os.homedir(), '.gimicoworker', 'data');
const DB_PATH = path.join(DB_DIR, 'cli-agent.db');

let _db = null;

export function getDb() {
  if (_db) return _db;

  fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');

  initTables(_db);
  return _db;
}

function initTables(db) {
  db.exec(`
    -- Saved agent configurations
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      model TEXT NOT NULL,
      system_prompt TEXT,
      custom_tools TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Conversation messages (full history)
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    -- Agent memory / knowledge base (key-value with context)
    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      importance INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    -- Global memory shared across all agents
    CREATE TABLE IF NOT EXISTS global_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Sessions for tracking conversations
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      source TEXT DEFAULT 'cli',
      started_at TEXT DEFAULT (datetime('now')),
      last_active TEXT DEFAULT (datetime('now')),
      message_count INTEGER DEFAULT 0
    );

    -- Telegram user settings
    CREATE TABLE IF NOT EXISTS telegram_users (
      chat_id INTEGER PRIMARY KEY,
      username TEXT,
      api_key TEXT,
      active_agent_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Telegram bot configurations (unlimited bots)
    CREATE TABLE IF NOT EXISTS telegram_bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_token TEXT NOT NULL UNIQUE,
      bot_name TEXT NOT NULL,
      bot_username TEXT,
      agent_role TEXT NOT NULL DEFAULT 'general',
      agent_model TEXT DEFAULT 'gemini-2.0-flash',
      custom_prompt TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Workflows (multi-step automated pipelines)
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      steps TEXT NOT NULL,
      trigger_type TEXT DEFAULT 'manual',
      trigger_config TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_run TEXT,
      run_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      status TEXT DEFAULT 'running',
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      results TEXT,
      error TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    );

    -- Scheduled Tasks (cron-based recurring agent tasks)
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      agent_id TEXT,
      prompt TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      run_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Agent Templates (reusable agent configurations)
    CREATE TABLE IF NOT EXISTS agent_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      model TEXT,
      system_prompt TEXT,
      allowed_tools TEXT,
      allowed_folders TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Social Media Sessions
    CREATE TABLE IF NOT EXISTS social_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'disconnected',
      last_connected TEXT,
      auto_reply_enabled INTEGER DEFAULT 0,
      auto_reply_prompt TEXT,
      config TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory(agent_id);
    CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(agent_id, key);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs ON workflow_runs(workflow_id);
  `);
}

// ─── Agent CRUD ────────────────────────────────────────────────────

export function saveAgent(agent) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agents (id, name, role, model, system_prompt, custom_tools, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(agent.id, agent.name, agent.role, agent.model, agent.systemPrompt || '', JSON.stringify(agent._allowedTools || []));
}

export function loadAgents() {
  const db = getDb();
  return db.prepare('SELECT * FROM agents ORDER BY created_at').all();
}

export function deleteAgent(agentId) {
  const db = getDb();
  db.prepare('DELETE FROM agents WHERE id = ?').run(agentId);
}

// ─── Message History ───────────────────────────────────────────────

export function saveMessage(agentId, sessionId, role, content, toolCalls = null) {
  const db = getDb();
  db.prepare(`
    INSERT INTO messages (agent_id, session_id, role, content, tool_calls)
    VALUES (?, ?, ?, ?, ?)
  `).run(agentId, sessionId, role, content, toolCalls ? JSON.stringify(toolCalls) : null);

  // Update session
  db.prepare(`
    INSERT INTO sessions (id, agent_id, message_count) VALUES (?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET last_active = datetime('now'), message_count = message_count + 1
  `).run(sessionId, agentId);
}

export function getMessages(agentId, sessionId, limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM messages WHERE agent_id = ? AND session_id = ?
    ORDER BY timestamp DESC LIMIT ?
  `).all(agentId, sessionId, limit).reverse();
}

export function getRecentMessages(agentId, limit = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM messages WHERE agent_id = ?
    ORDER BY timestamp DESC LIMIT ?
  `).all(agentId, limit).reverse();
}

export function getConversationSummary(agentId) {
  const db = getDb();
  return db.prepare(`
    SELECT COUNT(*) as total,
           MIN(timestamp) as first_message,
           MAX(timestamp) as last_message
    FROM messages WHERE agent_id = ?
  `).get(agentId);
}

// ─── Agent Memory ──────────────────────────────────────────────────

export function remember(agentId, key, value, category = 'general', importance = 5) {
  const db = getDb();
  db.prepare(`
    INSERT INTO memory (agent_id, key, value, category, importance)
    VALUES (?, ?, ?, ?, ?)
  `).run(agentId, key, value, category, importance);
}

export function recall(agentId, key) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM memory WHERE agent_id = ? AND key LIKE ?
    ORDER BY importance DESC, created_at DESC
  `).all(agentId, `%${key}%`);
}

export function recallByCategory(agentId, category) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM memory WHERE agent_id = ? AND category = ?
    ORDER BY importance DESC
  `).all(agentId, category);
}

export function getAllMemories(agentId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM memory WHERE agent_id = ?
    ORDER BY category, importance DESC
  `).all(agentId);
}

export function forgetMemory(memoryId) {
  const db = getDb();
  db.prepare('DELETE FROM memory WHERE id = ?').run(memoryId);
}

// ─── Global Memory ─────────────────────────────────────────────────

export function globalRemember(key, value, category = 'general') {
  const db = getDb();
  db.prepare(`
    INSERT INTO global_memory (key, value, category, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = ?, category = ?, updated_at = datetime('now')
  `).run(key, value, category, value, category);
}

export function globalRecall(key) {
  const db = getDb();
  return db.prepare('SELECT * FROM global_memory WHERE key LIKE ?').all(`%${key}%`);
}

// ─── Telegram Users ────────────────────────────────────────────────

export function saveTelegramUser(chatId, username, apiKey) {
  const db = getDb();
  db.prepare(`
    INSERT INTO telegram_users (chat_id, username, api_key)
    VALUES (?, ?, ?)
    ON CONFLICT(chat_id) DO UPDATE SET username = ?, api_key = ?
  `).run(chatId, username, apiKey, username, apiKey);
}

export function getTelegramUser(chatId) {
  const db = getDb();
  return db.prepare('SELECT * FROM telegram_users WHERE chat_id = ?').get(chatId);
}

export function updateTelegramActiveAgent(chatId, agentId) {
  const db = getDb();
  db.prepare('UPDATE telegram_users SET active_agent_id = ? WHERE chat_id = ?').run(agentId, chatId);
}

// ─── Sessions ──────────────────────────────────────────────────────

export function getSessions(agentId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM sessions WHERE agent_id = ?
    ORDER BY last_active DESC
  `).all(agentId);
}

// ─── Telegram Bots (Multi-Bot) ─────────────────────────────────────

export function addTelegramBot({ botToken, botName, botUsername, agentRole, agentModel, customPrompt }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO telegram_bots (bot_token, bot_name, bot_username, agent_role, agent_model, custom_prompt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(botToken, botName, botUsername || null, agentRole || 'general', agentModel || 'gemini-2.0-flash', customPrompt || null);
}

export function getAllTelegramBots() {
  const db = getDb();
  return db.prepare('SELECT * FROM telegram_bots WHERE enabled = 1 ORDER BY created_at').all();
}

export function getTelegramBotById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM telegram_bots WHERE id = ?').get(id);
}

export function removeTelegramBot(id) {
  const db = getDb();
  db.prepare('DELETE FROM telegram_bots WHERE id = ?').run(id);
}

export function toggleTelegramBot(id, enabled) {
  const db = getDb();
  db.prepare('UPDATE telegram_bots SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
