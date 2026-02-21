import { exec, spawn } from 'child_process';

// ─── Process Tracker ──────────────────────────────────────────────
// Tracks all running child processes so they can be killed on CLI exit.

const activeProcesses = new Set();

function trackProcess(child) {
  activeProcesses.add(child);
  child.once('exit', () => activeProcesses.delete(child));
  child.once('error', () => activeProcesses.delete(child));
}

/**
 * Kill all tracked child processes immediately.
 * Called on CLI exit to abort every running command.
 */
export function killAllProcesses() {
  for (const child of activeProcesses) {
    try {
      // On Windows, use taskkill to kill the process tree
      if (process.platform === 'win32' && child.pid) {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else if (child.pid) {
        // On Unix, kill the process group
        process.kill(-child.pid, 'SIGKILL');
      }
    } catch {
      // Process may already be dead - ignore
    }
    try { child.kill('SIGKILL'); } catch {}
  }
  activeProcesses.clear();
}

/**
 * Get count of currently running processes.
 */
export function getActiveProcessCount() {
  return activeProcesses.size;
}

// Helper: run exec with tracking
function execTracked(command, options) {
  return new Promise((resolve, reject) => {
    const child = exec(command, options, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
    trackProcess(child);
  });
}

export const shellTools = [
  {
    declaration: {
      name: 'execute_command',
      description: 'Execute any shell/terminal command on the operating system. Returns stdout and stderr. Use this for ANY system operation - installing packages, running scripts, compiling code, managing services, etc.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute',
          },
          cwd: {
            type: 'string',
            description: 'Working directory for the command (optional)',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 60000)',
          },
        },
        required: ['command'],
      },
    },
    execute: async ({ command, cwd, timeout = 60000 }) => {
      try {
        const { stdout, stderr } = await execTracked(command, {
          cwd: cwd || process.cwd(),
          timeout,
          maxBuffer: 10 * 1024 * 1024,
          shell: true,
        });
        let result = '';
        if (stdout) result += stdout;
        if (stderr) result += (result ? '\n[STDERR]: ' : '[STDERR]: ') + stderr;
        return result || '[Command completed with no output]';
      } catch (err) {
        return `[ERROR] Exit code ${err.code || 'unknown'}: ${err.message}\n${err.stdout || ''}${err.stderr ? '\n[STDERR]: ' + err.stderr : ''}`;
      }
    },
  },
  {
    declaration: {
      name: 'execute_powershell',
      description: 'Execute a PowerShell command or script. Useful for Windows-specific operations, registry access, WMI queries, and advanced system management.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The PowerShell command or script to execute',
          },
          cwd: {
            type: 'string',
            description: 'Working directory (optional)',
          },
        },
        required: ['command'],
      },
    },
    execute: async ({ command, cwd }) => {
      try {
        const { stdout, stderr } = await execTracked(
          `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command.replace(/"/g, '\\"')}"`,
          { cwd: cwd || process.cwd(), timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
        );
        let result = '';
        if (stdout) result += stdout;
        if (stderr) result += (result ? '\n[STDERR]: ' : '[STDERR]: ') + stderr;
        return result || '[Command completed with no output]';
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'run_background_process',
      description: 'Start a long-running background process (like a server, watcher, or daemon). Returns the process ID. These are tracked and will be killed when the CLI exits.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The command to run in the background',
          },
          cwd: {
            type: 'string',
            description: 'Working directory (optional)',
          },
        },
        required: ['command'],
      },
    },
    execute: async ({ command, cwd }) => {
      try {
        const parts = command.split(' ');
        const child = spawn(parts[0], parts.slice(1), {
          cwd: cwd || process.cwd(),
          detached: false,
          stdio: 'ignore',
          shell: true,
        });
        trackProcess(child);
        return `Background process started with PID: ${child.pid}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
