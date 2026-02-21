import { getDb } from '../db/database.js';

/**
 * Agent Template Manager - Save and load agent configurations as reusable templates.
 */

export function saveTemplate(name, agent, description = '') {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO agent_templates (name, role, model, system_prompt, allowed_tools, allowed_folders, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    agent.role,
    agent.model,
    agent.systemPrompt,
    JSON.stringify(agent._allowedTools || []),
    JSON.stringify(agent._allowedFolders || []),
    description
  );
}

export function loadTemplate(name) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM agent_templates WHERE name = ?').get(name);
  if (row) {
    row.allowed_tools = JSON.parse(row.allowed_tools || '[]');
    row.allowed_folders = JSON.parse(row.allowed_folders || '[]');
  }
  return row;
}

export function listTemplates() {
  const db = getDb();
  return db.prepare('SELECT name, role, model, description, created_at FROM agent_templates ORDER BY name').all();
}

export function deleteTemplate(name) {
  const db = getDb();
  const result = db.prepare('DELETE FROM agent_templates WHERE name = ?').run(name);
  if (result.changes === 0) throw new Error(`Template "${name}" not found.`);
}
