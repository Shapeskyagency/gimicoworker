---
sidebar_position: 3
---

# Working with Folders

This guide shows how agents interact with your filesystem — how to point them at specific folders, manage project directories, and handle common file operations.

## Telling the Agent Where to Work

### Just say the path

```
You: List everything in D:\projects\my-app
Agent: *calls list_directory*
  DIR     -          2024-01-15  src
  DIR     -          2024-01-15  node_modules
  FILE   1.2 KB     2024-01-15  package.json
  FILE   245 B      2024-01-14  .gitignore
  ...
```

### Use natural language

```
You: Go through my Desktop folder and tell me what's taking the most space
You: Find all .env files in D:\projects
You: Search for "TODO" comments in D:\projects\my-app\src
```

## Common Folder Operations

### Organizing files

```
You: Sort all files in D:\Downloads by extension into subfolders
```

The agent will:
1. Read the Downloads directory
2. Create subfolders (Images, Documents, Videos, etc.)
3. Move each file to the right subfolder

### Project setup

```
You: Create a new Express.js project in D:\projects\my-api with TypeScript
```

The agent will:
1. Create the directory
2. Run `npm init`
3. Install dependencies
4. Create `tsconfig.json`, `src/index.ts`, etc.

### Bulk file operations

```
You: Rename all .jpeg files in D:\photos to .jpg
You: Delete all node_modules folders in D:\projects recursively
You: Copy the src folder from D:\project-a to D:\project-b
```

### Searching

```
You: Find all files containing "database_url" in D:\projects\my-app
You: Search for Python files larger than 100KB in D:\code
```

## Working Directory for Commands

When the agent runs shell commands, it needs a working directory.

### Without restrictions

The agent uses the CLI-AGT project directory as default. You can specify:

```
You: Run "npm test" in D:\projects\my-app
You: Execute "git status" in D:\projects\my-app
```

The agent will set `cwd` to your specified path.

### With restrictions

When folder restrictions are active, the working directory is **automatically set** to the first allowed folder:

```
/restrict D:\projects\my-app

You: Run npm install
Agent: *executes in D:\projects\my-app* npm install completed.
```

## Real-World Examples

### Example 1: Code Review

```
You: Read the file D:\projects\api\src\auth\login.js and review it for security issues
```

### Example 2: Log Analysis

```
You: Read the last 100 lines of D:\projects\api\logs\error.log and summarize the errors
```

### Example 3: Config Management

```
You: Read D:\projects\api\.env.example and create a new .env file with the same keys but empty values
```

### Example 4: Backup

```
You: Copy D:\projects\important-project to D:\backups\important-project-backup
```

### Example 5: Cleanup

```
You: Find and delete all .tmp and .log files in D:\projects older than 30 days
```

### Example 6: Project Analysis

```
You: Analyze the D:\projects\my-app project structure and tell me:
     - What framework it uses
     - How many source files there are
     - The total lines of code
     - Any potential issues you notice
```

## Tips

1. **Be specific with paths** — Use full paths like `D:\projects\my-app` instead of relative paths
2. **Use restrictions for safety** — If the agent only needs one folder, restrict it
3. **Let the agent search** — Say "find the config file" instead of guessing the path
4. **Chain operations** — "Read package.json, then install missing dependencies, then run tests"
5. **Verify before deleting** — Ask the agent to list files before bulk deletion
