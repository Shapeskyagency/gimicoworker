import { getDb } from '../db/database.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Export all GimiCoworker data to a JSON file for backup.
 */
export async function exportAll(outputPath) {
  const db = getDb();

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    agents: db.prepare('SELECT * FROM agents').all(),
    memory: db.prepare('SELECT * FROM memory').all(),
    globalMemory: db.prepare('SELECT * FROM global_memory').all(),
    sessions: db.prepare('SELECT * FROM sessions').all(),
  };

  // Optional tables (may not exist yet)
  try { data.templates = db.prepare('SELECT * FROM agent_templates').all(); } catch { data.templates = []; }
  try { data.workflows = db.prepare('SELECT * FROM workflows').all(); } catch { data.workflows = []; }
  try { data.scheduledTasks = db.prepare('SELECT * FROM scheduled_tasks').all(); } catch { data.scheduledTasks = []; }

  const resolved = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, JSON.stringify(data, null, 2));

  return {
    path: resolved,
    agents: data.agents.length,
    memories: data.memory.length,
    globalMemories: data.globalMemory.length,
    templates: data.templates.length,
    workflows: data.workflows.length,
    scheduledTasks: data.scheduledTasks.length,
  };
}

/**
 * Import GimiCoworker data from a JSON backup file.
 */
export async function importAll(inputPath) {
  const resolved = path.resolve(inputPath);
  const raw = await fs.readFile(resolved, 'utf-8');
  const data = JSON.parse(raw);
  const db = getDb();

  const counts = { agents: 0, memory: 0, globalMemory: 0, templates: 0, workflows: 0 };

  // Import agents
  const insertAgent = db.prepare(
    'INSERT OR IGNORE INTO agents (id, name, role, model, system_prompt, custom_tools) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const a of data.agents || []) {
    insertAgent.run(a.id, a.name, a.role, a.model, a.system_prompt || '', a.custom_tools || '[]');
    counts.agents++;
  }

  // Import memory
  const insertMemory = db.prepare(
    'INSERT INTO memory (agent_id, key, value, category, importance) VALUES (?, ?, ?, ?, ?)'
  );
  for (const m of data.memory || []) {
    insertMemory.run(m.agent_id, m.key, m.value, m.category || 'general', m.importance || 5);
    counts.memory++;
  }

  // Import global memory
  const insertGlobal = db.prepare(
    'INSERT OR IGNORE INTO global_memory (key, value, category) VALUES (?, ?, ?)'
  );
  for (const g of data.globalMemory || []) {
    insertGlobal.run(g.key, g.value, g.category || 'general');
    counts.globalMemory++;
  }

  // Import templates
  try {
    const insertTemplate = db.prepare(
      'INSERT OR IGNORE INTO agent_templates (name, role, model, system_prompt, allowed_tools, allowed_folders, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const t of data.templates || []) {
      insertTemplate.run(t.name, t.role, t.model, t.system_prompt || '', t.allowed_tools || '[]', t.allowed_folders || '[]', t.description || '');
      counts.templates++;
    }
  } catch {}

  // Import workflows
  try {
    const insertWorkflow = db.prepare(
      'INSERT OR IGNORE INTO workflows (name, description, steps) VALUES (?, ?, ?)'
    );
    for (const w of data.workflows || []) {
      insertWorkflow.run(w.name, w.description || '', w.steps);
      counts.workflows++;
    }
  } catch {}

  return counts;
}

/**
 * Export conversation history for a specific agent.
 */
export async function exportConversations(agentId, outputPath) {
  const db = getDb();
  const messages = db.prepare('SELECT * FROM messages WHERE agent_id = ? ORDER BY timestamp').all(agentId);

  const data = {
    agentId,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages,
  };

  const resolved = path.resolve(outputPath);
  await fs.writeFile(resolved, JSON.stringify(data, null, 2));
  return { path: resolved, messages: messages.length };
}
