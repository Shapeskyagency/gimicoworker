import path from 'path';

/**
 * Folder restriction sandbox.
 *
 * When allowedFolders is set, the agent can ONLY:
 * - Read/write/list files inside those folders
 * - Execute commands with cwd inside those folders
 * - Search inside those folders
 *
 * Paths outside allowed folders are BLOCKED.
 */
export class Sandbox {
  constructor(allowedFolders = []) {
    // Normalize all paths to absolute
    this.allowedFolders = allowedFolders.map(f => path.resolve(f));
    this.enabled = allowedFolders.length > 0;
  }

  /**
   * Check if a given path is inside any allowed folder.
   */
  isAllowed(targetPath) {
    if (!this.enabled) return true;

    const resolved = path.resolve(targetPath);
    return this.allowedFolders.some(folder =>
      resolved === folder || resolved.startsWith(folder + path.sep)
    );
  }

  /**
   * Validate a path and throw if blocked.
   */
  validatePath(targetPath, operation = 'access') {
    if (!this.enabled) return;

    if (!this.isAllowed(targetPath)) {
      const folders = this.allowedFolders.join(', ');
      throw new Error(
        `[SANDBOX] Blocked: Cannot ${operation} "${targetPath}". ` +
        `Agent is restricted to: ${folders}`
      );
    }
  }

  /**
   * Validate a shell command's working directory.
   */
  validateCwd(cwd) {
    if (!this.enabled || !cwd) return;
    this.validatePath(cwd, 'execute commands in');
  }

  /**
   * Wrap a tool executor with sandbox checks.
   * Returns a new executor that validates paths before calling the original.
   */
  wrapExecutor(originalExecutor) {
    if (!this.enabled) return originalExecutor;

    const sandbox = this;

    return async (toolName, args) => {
      // ─── Path-based tools ────────────────────────────────
      const pathArgs = ['filepath', 'dirpath', 'source', 'destination', 'directory'];
      for (const argName of pathArgs) {
        if (args[argName]) {
          sandbox.validatePath(args[argName], toolName);
        }
      }

      // ─── Shell commands: enforce cwd ─────────────────────
      if (toolName === 'execute_command' || toolName === 'execute_powershell') {
        if (args.cwd) {
          sandbox.validateCwd(args.cwd);
        } else {
          // Force cwd to first allowed folder if not specified
          args.cwd = sandbox.allowedFolders[0];
        }
      }

      // ─── Background processes ────────────────────────────
      if (toolName === 'run_background_process') {
        if (args.cwd) {
          sandbox.validateCwd(args.cwd);
        } else {
          args.cwd = sandbox.allowedFolders[0];
        }
      }

      // ─── Download destination ────────────────────────────
      if (toolName === 'download_file' && args.destination) {
        sandbox.validatePath(args.destination, 'download to');
      }

      return await originalExecutor(toolName, args);
    };
  }

  getInfo() {
    if (!this.enabled) return 'No restrictions (full OS access)';
    return `Restricted to: ${this.allowedFolders.join(', ')}`;
  }
}
