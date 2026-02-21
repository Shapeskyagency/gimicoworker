import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync } from 'fs';

export const filesystemTools = [
  {
    declaration: {
      name: 'read_file',
      description: 'Read the contents of a file. Can read text files, config files, source code, logs, etc.',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Absolute or relative path to the file' },
          encoding: { type: 'string', description: 'File encoding (default: utf-8)' },
        },
        required: ['filepath'],
      },
    },
    execute: async ({ filepath, encoding = 'utf-8' }) => {
      try {
        const content = await fs.readFile(path.resolve(filepath), encoding);
        const stats = statSync(path.resolve(filepath));
        return `[File: ${filepath} | Size: ${stats.size} bytes]\n${content}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'write_file',
      description: 'Write content to a file. Creates the file if it does not exist. Creates parent directories automatically.',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to the file to write' },
          content: { type: 'string', description: 'Content to write to the file' },
          append: { type: 'boolean', description: 'If true, append instead of overwrite (default: false)' },
        },
        required: ['filepath', 'content'],
      },
    },
    execute: async ({ filepath, content, append = false }) => {
      try {
        const resolved = path.resolve(filepath);
        await fs.mkdir(path.dirname(resolved), { recursive: true });
        if (append) {
          await fs.appendFile(resolved, content);
          return `Appended ${content.length} characters to ${filepath}`;
        } else {
          await fs.writeFile(resolved, content);
          return `Wrote ${content.length} characters to ${filepath}`;
        }
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'list_directory',
      description: 'List files and directories in a path. Shows file sizes, types, and modification dates.',
      parameters: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Path to the directory to list' },
          recursive: { type: 'boolean', description: 'List recursively (default: false)' },
          showHidden: { type: 'boolean', description: 'Show hidden files (default: false)' },
        },
        required: ['dirpath'],
      },
    },
    execute: async ({ dirpath, recursive = false, showHidden = false }) => {
      try {
        const resolved = path.resolve(dirpath);
        const entries = await fs.readdir(resolved, { withFileTypes: true });

        const results = [];
        for (const entry of entries) {
          if (!showHidden && entry.name.startsWith('.')) continue;
          const fullPath = path.join(resolved, entry.name);
          try {
            const stats = await fs.stat(fullPath);
            const type = entry.isDirectory() ? 'DIR ' : 'FILE';
            const size = entry.isDirectory() ? '-' : formatSize(stats.size);
            const modified = stats.mtime.toISOString().split('T')[0];
            results.push(`${type}  ${size.padStart(10)}  ${modified}  ${entry.name}`);

            if (recursive && entry.isDirectory()) {
              const subEntries = await fs.readdir(fullPath, { withFileTypes: true });
              for (const sub of subEntries) {
                if (!showHidden && sub.name.startsWith('.')) continue;
                const subPath = path.join(fullPath, sub.name);
                const subStats = await fs.stat(subPath);
                const subType = sub.isDirectory() ? 'DIR ' : 'FILE';
                const subSize = sub.isDirectory() ? '-' : formatSize(subStats.size);
                results.push(`${subType}  ${subSize.padStart(10)}  ${subStats.mtime.toISOString().split('T')[0]}  ${entry.name}/${sub.name}`);
              }
            }
          } catch { /* skip inaccessible */ }
        }
        return `[Directory: ${dirpath}]\n${results.join('\n') || '(empty)'}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'move_path',
      description: 'Move or rename a file or directory.',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source path' },
          destination: { type: 'string', description: 'Destination path' },
        },
        required: ['source', 'destination'],
      },
    },
    execute: async ({ source, destination }) => {
      try {
        await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
        await fs.rename(path.resolve(source), path.resolve(destination));
        return `Moved: ${source} -> ${destination}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'copy_path',
      description: 'Copy a file or directory.',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source path' },
          destination: { type: 'string', description: 'Destination path' },
        },
        required: ['source', 'destination'],
      },
    },
    execute: async ({ source, destination }) => {
      try {
        await fs.mkdir(path.dirname(path.resolve(destination)), { recursive: true });
        await fs.cp(path.resolve(source), path.resolve(destination), { recursive: true });
        return `Copied: ${source} -> ${destination}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'delete_path',
      description: 'Delete a file or directory.',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to delete' },
          recursive: { type: 'boolean', description: 'Delete recursively for directories (default: false)' },
        },
        required: ['filepath'],
      },
    },
    execute: async ({ filepath, recursive = false }) => {
      try {
        const resolved = path.resolve(filepath);
        const stats = await fs.stat(resolved);
        if (stats.isDirectory()) {
          await fs.rm(resolved, { recursive, force: recursive });
        } else {
          await fs.unlink(resolved);
        }
        return `Deleted: ${filepath}`;
      } catch (err) {
        return `[ERROR]: ${err.message}`;
      }
    },
  },
  {
    declaration: {
      name: 'search_files',
      description: 'Search for files by name pattern in a directory tree. Returns matching file paths.',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Root directory to search in' },
          pattern: { type: 'string', description: 'Filename pattern to match (supports * and ? wildcards)' },
          maxResults: { type: 'number', description: 'Maximum number of results (default: 50)' },
        },
        required: ['directory', 'pattern'],
      },
    },
    execute: async ({ directory, pattern, maxResults = 50 }) => {
      const results = [];
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');

      async function walk(dir) {
        if (results.length >= maxResults) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const full = path.join(dir, entry.name);
            if (regex.test(entry.name)) results.push(full);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await walk(full);
            }
          }
        } catch { /* skip inaccessible */ }
      }

      await walk(path.resolve(directory));
      return results.length > 0
        ? `Found ${results.length} matches:\n${results.join('\n')}`
        : 'No matching files found.';
    },
  },
  {
    declaration: {
      name: 'search_in_files',
      description: 'Search for text content inside files (like grep). Returns matching lines with file paths.',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to search in' },
          query: { type: 'string', description: 'Text or regex pattern to search for' },
          filePattern: { type: 'string', description: 'File extension filter, e.g. "*.js" (optional)' },
          maxResults: { type: 'number', description: 'Maximum results (default: 30)' },
        },
        required: ['directory', 'query'],
      },
    },
    execute: async ({ directory, query, filePattern, maxResults = 30 }) => {
      const results = [];
      const regex = new RegExp(query, 'gi');
      const extFilter = filePattern ? new RegExp(filePattern.replace(/\*/g, '.*')) : null;

      async function walk(dir) {
        if (results.length >= maxResults) return;
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await walk(full);
            } else if (entry.isFile()) {
              if (extFilter && !extFilter.test(entry.name)) continue;
              try {
                const content = await fs.readFile(full, 'utf-8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  if (results.length >= maxResults) return;
                  if (regex.test(lines[i])) {
                    results.push(`${full}:${i + 1}: ${lines[i].trim()}`);
                  }
                  regex.lastIndex = 0;
                }
              } catch { /* skip binary/unreadable */ }
            }
          }
        } catch { /* skip inaccessible */ }
      }

      await walk(path.resolve(directory));
      return results.length > 0
        ? `Found ${results.length} matches:\n${results.join('\n')}`
        : 'No matches found.';
    },
  },
];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
