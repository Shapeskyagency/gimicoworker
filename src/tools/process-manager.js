import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const processTools = [
  {
    declaration: {
      name: 'list_processes',
      description: 'List all running processes on the system. Can filter by name.',
      parameters: {
        type: 'object',
        properties: {
          filter: { type: 'string', description: 'Optional process name filter' },
          sortBy: { type: 'string', description: 'Sort by: cpu, memory, pid, name (default: memory)' },
        },
      },
    },
    execute: async ({ filter, sortBy = 'memory' } = {}) => {
      try {
        const isWin = process.platform === 'win32';
        let cmd;
        if (isWin) {
          cmd = 'tasklist /FO CSV /NH';
          if (filter) cmd = `tasklist /FO CSV /NH /FI "IMAGENAME eq *${filter}*"`;
        } else {
          cmd = 'ps aux --sort=-%mem';
          if (filter) cmd += ` | grep -i "${filter}"`;
          cmd += ' | head -30';
        }

        const { stdout } = await execAsync(cmd, { timeout: 15000 });
        return `[Running Processes${filter ? ` (filter: ${filter})` : ''}]\n${stdout}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'kill_process',
      description: 'Kill/terminate a running process by PID or name.',
      parameters: {
        type: 'object',
        properties: {
          pid: { type: 'number', description: 'Process ID to kill' },
          name: { type: 'string', description: 'Process name to kill (alternative to PID)' },
          force: { type: 'boolean', description: 'Force kill (default: false)' },
        },
      },
    },
    execute: async ({ pid, name, force = false }) => {
      try {
        const isWin = process.platform === 'win32';
        let cmd;
        if (pid) {
          cmd = isWin
            ? `taskkill /PID ${pid}${force ? ' /F' : ''}`
            : `kill ${force ? '-9' : '-15'} ${pid}`;
        } else if (name) {
          cmd = isWin
            ? `taskkill /IM "${name}"${force ? ' /F' : ''}`
            : `pkill ${force ? '-9' : '-15'} "${name}"`;
        } else {
          return '[ERROR]: Provide either pid or name';
        }

        const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });
        return stdout || stderr || `Process terminated successfully`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'get_resource_usage',
      description: 'Get current CPU, memory, and disk usage of the system.',
      parameters: { type: 'object', properties: {} },
    },
    execute: async () => {
      try {
        const isWin = process.platform === 'win32';
        let result = '[System Resource Usage]\n';

        if (isWin) {
          const { stdout: cpu } = await execAsync(
            'wmic cpu get loadpercentage /value', { timeout: 10000 }
          );
          const { stdout: mem } = await execAsync(
            'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value', { timeout: 10000 }
          );
          const { stdout: disk } = await execAsync(
            'wmic logicaldisk get size,freespace,caption', { timeout: 10000 }
          );
          result += `CPU:\n${cpu.trim()}\n\nMemory:\n${mem.trim()}\n\nDisk:\n${disk.trim()}`;
        } else {
          const { stdout: cpu } = await execAsync("top -bn1 | head -5", { timeout: 10000 });
          const { stdout: mem } = await execAsync("free -h", { timeout: 10000 });
          const { stdout: disk } = await execAsync("df -h", { timeout: 10000 });
          result += `CPU & Load:\n${cpu}\n\nMemory:\n${mem}\n\nDisk:\n${disk}`;
        }

        return result;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
