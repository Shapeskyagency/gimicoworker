import { getDb } from '../db/database.js';

/**
 * Workflow Engine - Runs multi-step automated pipelines through AI agents.
 * Each step sends a prompt to the active agent, optionally capturing output
 * for use in subsequent steps via {{variable}} interpolation.
 */
export class WorkflowEngine {
  constructor(agentManager) {
    this.agentManager = agentManager;
  }

  /**
   * Execute a workflow by running each step sequentially.
   * @param {Object} workflow - { name, steps: [{ name, prompt, outputVar?, condition? }] }
   * @param {Object} callbacks - { onStepStart, onStepComplete, onStepError }
   */
  async run(workflow, callbacks = {}) {
    const results = [];
    const context = {};
    const startTime = Date.now();

    // Record run start
    const runId = saveWorkflowRun(workflow.id, 'running');

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];

        // Conditional step - skip if condition not met
        if (step.condition && !this._evaluateCondition(step.condition, context)) {
          results.push({ step: step.name, status: 'skipped', reason: 'Condition not met' });
          continue;
        }

        if (callbacks.onStepStart) {
          callbacks.onStepStart(i + 1, workflow.steps.length, step.name);
        }

        // Interpolate context variables into the prompt
        const prompt = this._interpolate(step.prompt, context);

        const agent = this.agentManager.getActiveAgent();
        if (!agent) throw new Error('No active agent available for workflow execution.');

        try {
          const response = await agent.send(prompt);
          results.push({ step: step.name, status: 'completed', response });

          // Capture output variable if defined
          if (step.outputVar) {
            context[step.outputVar] = response;
          }

          if (callbacks.onStepComplete) {
            callbacks.onStepComplete(i + 1, step.name, response);
          }
        } catch (err) {
          const errorResult = { step: step.name, status: 'failed', error: err.message };
          results.push(errorResult);

          if (callbacks.onStepError) {
            callbacks.onStepError(i + 1, step.name, err.message);
          }

          // Stop workflow on error unless step is marked as optional
          if (!step.optional) {
            updateWorkflowRun(runId, 'failed', results, err.message);
            return { completed: false, results, error: err.message, duration: Date.now() - startTime };
          }
        }
      }

      updateWorkflowRun(runId, 'completed', results);
      return { completed: true, results, duration: Date.now() - startTime };
    } catch (err) {
      updateWorkflowRun(runId, 'failed', results, err.message);
      return { completed: false, results, error: err.message, duration: Date.now() - startTime };
    }
  }

  _interpolate(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || `{{${key}}}`);
  }

  _evaluateCondition(condition, context) {
    if (!condition) return true;
    const { variable, contains, notContains, equals } = condition;
    const value = context[variable] || '';

    if (contains) return value.includes(contains);
    if (notContains) return !value.includes(notContains);
    if (equals) return value === equals;
    return true;
  }
}

// ─── Workflow Storage ─────────────────────────────────────────────

export function saveWorkflow(name, description, steps) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO workflows (name, description, steps, updated_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(name, description || '', JSON.stringify(steps));
}

export function getWorkflow(name) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM workflows WHERE name = ?').get(name);
  if (row) row.steps = JSON.parse(row.steps);
  return row;
}

export function listWorkflows() {
  const db = getDb();
  return db.prepare('SELECT id, name, description, run_count, last_run FROM workflows ORDER BY name').all();
}

export function deleteWorkflow(name) {
  const db = getDb();
  db.prepare('DELETE FROM workflows WHERE name = ?').run(name);
}

export function saveWorkflowRun(workflowId, status) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO workflow_runs (workflow_id, status) VALUES (?, ?)
  `).run(workflowId, status);
  return info.lastInsertRowid;
}

export function updateWorkflowRun(runId, status, results, error = null) {
  const db = getDb();
  db.prepare(`
    UPDATE workflow_runs SET status = ?, finished_at = datetime('now'), results = ?, error = ?
    WHERE id = ?
  `).run(status, JSON.stringify(results), error, runId);
}
