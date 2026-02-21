import { getDb } from '../db/database.js';

/**
 * Task Scheduler - Runs recurring agent tasks using cron expressions.
 */
export class TaskScheduler {
  constructor(agentManager) {
    this.agentManager = agentManager;
    this.jobs = new Map(); // id -> { task, job }
    this._cron = null;
  }

  async _getCron() {
    if (!this._cron) {
      this._cron = await import('node-cron');
    }
    return this._cron.default || this._cron;
  }

  /**
   * Load and start all enabled scheduled tasks from database.
   */
  async loadAll() {
    const tasks = getScheduledTasks();
    for (const task of tasks) {
      await this.schedule(task);
    }
    return tasks.length;
  }

  /**
   * Schedule a single task with a cron expression.
   */
  async schedule(task) {
    const cron = await this._getCron();

    if (!cron.validate(task.cron_expression)) {
      throw new Error(`Invalid cron expression: ${task.cron_expression}`);
    }

    // Stop existing job if re-scheduling
    this.stop(task.id);

    const job = cron.schedule(task.cron_expression, async () => {
      const agent = this.agentManager.getActiveAgent();
      if (!agent) return;

      try {
        const response = await agent.send(task.prompt);
        updateTaskRun(task.id);

        // Send desktop notification on completion
        try {
          const { default: notifier } = await import('node-notifier');
          notifier.notify({
            title: `GimiCoworker: ${task.name}`,
            message: `Scheduled task completed.`,
            sound: true,
          });
        } catch {}

        return response;
      } catch (err) {
        console.error(`[Scheduler] Task "${task.name}" failed: ${err.message}`);
      }
    });

    this.jobs.set(task.id, { task, job });
    return task;
  }

  /**
   * Stop a specific scheduled job.
   */
  stop(id) {
    const entry = this.jobs.get(id);
    if (entry) {
      entry.job.stop();
      this.jobs.delete(id);
    }
  }

  /**
   * Stop all scheduled jobs.
   */
  stopAll() {
    for (const [id, entry] of this.jobs) {
      entry.job.stop();
    }
    this.jobs.clear();
  }

  /**
   * Get list of running jobs.
   */
  getRunningJobs() {
    return Array.from(this.jobs.entries()).map(([id, entry]) => ({
      id,
      name: entry.task.name,
      cron: entry.task.cron_expression,
      prompt: entry.task.prompt,
    }));
  }
}

// ─── Database Operations ──────────────────────────────────────────

export function addScheduledTask(name, cronExpression, prompt, agentId = null) {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO scheduled_tasks (name, cron_expression, agent_id, prompt)
    VALUES (?, ?, ?, ?)
  `).run(name, cronExpression, agentId, prompt);
  return info.lastInsertRowid;
}

export function getScheduledTasks() {
  const db = getDb();
  return db.prepare('SELECT * FROM scheduled_tasks WHERE enabled = 1 ORDER BY name').all();
}

export function getAllScheduledTasks() {
  const db = getDb();
  return db.prepare('SELECT * FROM scheduled_tasks ORDER BY name').all();
}

export function removeScheduledTask(id) {
  const db = getDb();
  db.prepare('DELETE FROM scheduled_tasks WHERE id = ?').run(id);
}

export function toggleScheduledTask(id, enabled) {
  const db = getDb();
  db.prepare('UPDATE scheduled_tasks SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
}

export function updateTaskRun(id) {
  const db = getDb();
  db.prepare(`
    UPDATE scheduled_tasks SET last_run = datetime('now'), run_count = run_count + 1 WHERE id = ?
  `).run(id);
}
