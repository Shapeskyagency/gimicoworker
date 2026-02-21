import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const networkTools = [
  {
    declaration: {
      name: 'http_request',
      description: 'Make an HTTP request (GET, POST, PUT, DELETE, etc.) to any URL. Useful for API calls, downloading content, testing endpoints.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to request' },
          method: { type: 'string', description: 'HTTP method (default: GET)' },
          headers: { type: 'string', description: 'JSON string of headers (optional)' },
          body: { type: 'string', description: 'Request body (optional)' },
        },
        required: ['url'],
      },
    },
    execute: async ({ url, method = 'GET', headers, body }) => {
      try {
        const opts = { method };
        if (headers) {
          opts.headers = JSON.parse(headers);
        }
        if (body) {
          opts.body = body;
          if (!opts.headers) opts.headers = {};
          if (!opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, opts);
        const contentType = response.headers.get('content-type') || '';
        let responseBody;
        if (contentType.includes('json')) {
          responseBody = JSON.stringify(await response.json(), null, 2);
        } else {
          responseBody = await response.text();
        }

        // Truncate very large responses
        if (responseBody.length > 10000) {
          responseBody = responseBody.substring(0, 10000) + '\n... [truncated]';
        }

        return `[HTTP ${method} ${url}]\nStatus: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\n\n${responseBody}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'check_port',
      description: 'Check if a specific port is open/in-use on the system.',
      parameters: {
        type: 'object',
        properties: {
          port: { type: 'number', description: 'Port number to check' },
        },
        required: ['port'],
      },
    },
    execute: async ({ port }) => {
      try {
        const isWin = process.platform === 'win32';
        const cmd = isWin
          ? `netstat -ano | findstr :${port}`
          : `lsof -i :${port} || netstat -tlnp 2>/dev/null | grep :${port}`;

        const { stdout } = await execAsync(cmd, { timeout: 10000 });
        return stdout.trim()
          ? `[Port ${port}] IN USE:\n${stdout.trim()}`
          : `[Port ${port}] Available (not in use)`;
      } catch {
        return `[Port ${port}] Available (not in use)`;
      }
    },
  },
  {
    declaration: {
      name: 'get_network_info',
      description: 'Get network configuration, active connections, and routing table.',
      parameters: {
        type: 'object',
        properties: {
          detail: { type: 'string', description: 'What to show: config, connections, routes, dns, all (default: config)' },
        },
      },
    },
    execute: async ({ detail = 'config' } = {}) => {
      try {
        const isWin = process.platform === 'win32';
        let result = '';

        if (detail === 'config' || detail === 'all') {
          const cmd = isWin ? 'ipconfig /all' : 'ip addr show 2>/dev/null || ifconfig';
          const { stdout } = await execAsync(cmd, { timeout: 10000 });
          result += `[Network Configuration]\n${stdout}\n`;
        }
        if (detail === 'connections' || detail === 'all') {
          const cmd = isWin ? 'netstat -an | findstr ESTABLISHED' : 'ss -tuln 2>/dev/null || netstat -tuln';
          const { stdout } = await execAsync(cmd, { timeout: 10000 });
          result += `\n[Active Connections]\n${stdout}\n`;
        }
        if (detail === 'routes' || detail === 'all') {
          const cmd = isWin ? 'route print' : 'ip route show 2>/dev/null || route -n';
          const { stdout } = await execAsync(cmd, { timeout: 10000 });
          result += `\n[Routing Table]\n${stdout}\n`;
        }
        if (detail === 'dns' || detail === 'all') {
          const cmd = isWin
            ? 'powershell -Command "Get-DnsClientServerAddress | Format-Table"'
            : 'cat /etc/resolv.conf';
          const { stdout } = await execAsync(cmd, { timeout: 10000 });
          result += `\n[DNS Configuration]\n${stdout}\n`;
        }

        return result || '[No data retrieved]';
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'ping_host',
      description: 'Ping a host to check connectivity and latency.',
      parameters: {
        type: 'object',
        properties: {
          host: { type: 'string', description: 'Hostname or IP address to ping' },
          count: { type: 'number', description: 'Number of ping packets (default: 4)' },
        },
        required: ['host'],
      },
    },
    execute: async ({ host, count = 4 }) => {
      try {
        const isWin = process.platform === 'win32';
        const cmd = isWin ? `ping -n ${count} ${host}` : `ping -c ${count} ${host}`;
        const { stdout } = await execAsync(cmd, { timeout: 30000 });
        return `[Ping ${host}]\n${stdout}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'download_file',
      description: 'Download a file from a URL and save it to disk.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to download from' },
          destination: { type: 'string', description: 'Local path to save the file' },
        },
        required: ['url', 'destination'],
      },
    },
    execute: async ({ url, destination }) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return `[ERROR]: HTTP ${response.status} ${response.statusText}`;

        const fs = await import('fs/promises');
        const path = await import('path');
        const buffer = Buffer.from(await response.arrayBuffer());
        const resolved = path.resolve(destination);
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        await fs.writeFile(resolved, buffer);
        return `Downloaded ${url} -> ${destination} (${buffer.length} bytes)`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
];
