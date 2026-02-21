import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const systemTools = [
  {
    declaration: {
      name: 'get_system_info',
      description: 'Get detailed system information: OS, CPU, memory, network, uptime, etc.',
      parameters: { type: 'object', properties: {} },
    },
    execute: async () => {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const nets = os.networkInterfaces();

      let networkInfo = '';
      for (const [name, interfaces] of Object.entries(nets)) {
        for (const iface of interfaces) {
          if (!iface.internal) {
            networkInfo += `  ${name}: ${iface.address} (${iface.family})\n`;
          }
        }
      }

      return `[System Information]
Platform:    ${os.platform()} ${os.arch()}
OS:          ${os.type()} ${os.release()}
Hostname:    ${os.hostname()}
Username:    ${os.userInfo().username}
Home Dir:    ${os.homedir()}
Temp Dir:    ${os.tmpdir()}
CPU:         ${cpus[0]?.model || 'Unknown'} (${cpus.length} cores)
Memory:      ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${((usedMem / totalMem) * 100).toFixed(1)}% used)
Free Memory: ${formatBytes(freeMem)}
Uptime:      ${formatUptime(os.uptime())}
Node.js:     ${process.version}
Network:\n${networkInfo || '  No external interfaces'}`;
    },
  },
  {
    declaration: {
      name: 'get_environment_variable',
      description: 'Get the value of an environment variable, or list all environment variables.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Variable name (omit to list all)' },
        },
      },
    },
    execute: async ({ name } = {}) => {
      if (name) {
        const val = process.env[name];
        return val ? `${name}=${val}` : `Environment variable "${name}" is not set`;
      }
      const vars = Object.entries(process.env)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
      return `[Environment Variables]\n${vars}`;
    },
  },
  {
    declaration: {
      name: 'set_environment_variable',
      description: 'Set an environment variable for the current agent session.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Variable name' },
          value: { type: 'string', description: 'Variable value' },
        },
        required: ['name', 'value'],
      },
    },
    execute: async ({ name, value }) => {
      process.env[name] = value;
      return `Set ${name}=${value}`;
    },
  },
  {
    declaration: {
      name: 'get_installed_programs',
      description: 'List installed programs/packages on the system.',
      parameters: {
        type: 'object',
        properties: {
          filter: { type: 'string', description: 'Optional filter by name' },
        },
      },
    },
    execute: async ({ filter } = {}) => {
      try {
        const isWin = process.platform === 'win32';
        let cmd;
        if (isWin) {
          cmd = `powershell -NoProfile -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion | Format-Table -AutoSize"`;
          if (filter) {
            cmd = `powershell -NoProfile -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object {$_.DisplayName -like '*${filter}*'} | Select-Object DisplayName, DisplayVersion | Format-Table -AutoSize"`;
          }
        } else {
          cmd = filter ? `dpkg -l | grep -i "${filter}" || rpm -qa | grep -i "${filter}"` : 'dpkg -l | head -50 || rpm -qa | head -50';
        }
        const { stdout } = await execAsync(cmd, { timeout: 30000 });
        return `[Installed Programs${filter ? ` (filter: ${filter})` : ''}]\n${stdout}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024 ** 3).toFixed(1) + ' GB';
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
