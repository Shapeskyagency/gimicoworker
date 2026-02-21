---
sidebar_position: 2
---

# Workflow Engine

GimiCoworker includes a built-in workflow engine that lets you define and run multi-step automations. Instead of issuing commands one at a time, you can create a workflow that chains multiple steps together, passing data between them using variable interpolation. This is ideal for repetitive processes like deployments, backups, and monitoring routines.

## Overview

A workflow is an ordered sequence of steps where each step executes an agent tool or command. Workflows support:

- **Sequential execution** — Steps run one after another in the order you define them.
- **Variable interpolation** — Use `{{varName}}` syntax to inject dynamic values into any step.
- **Any agent tool** — Each step can use any tool available to the agent (file operations, shell commands, scraping, vision, etc.).
- **Data passing** — Output from earlier steps can be referenced by later steps, enabling powerful data pipelines.
- **Full lifecycle management** — Create, list, run, and delete workflows through simple commands.

## Creating Workflows

To create a workflow, define a name and a list of steps. Each step specifies a tool and its parameters.

**Basic Example:**

```
Create a workflow called "greet" with these steps:
1. Write "Hello, {{name}}!" to the file greeting.txt
2. Read the file greeting.txt
```

The agent will register this as a reusable workflow that you can run at any time.

**Detailed Step Structure:**

Each step in a workflow consists of:

- **Step number** — The order in which it executes.
- **Tool/action** — Which agent capability to use (e.g., write a file, run a shell command, scrape a page).
- **Parameters** — The inputs for that tool, which can include `{{variables}}` for dynamic values.

## Variable Interpolation

Variables let you parameterize your workflows so the same workflow can be reused with different inputs. Use the `{{varName}}` syntax anywhere within step parameters.

**How it works:**

- Define placeholders with `{{variableName}}` in your workflow steps.
- When you run the workflow, supply values for each variable.
- The engine substitutes all occurrences of `{{variableName}}` with the provided value before executing each step.

**Example:**

```
Create a workflow called "deploy-app" with these steps:
1. Run shell command: git checkout {{branch}}
2. Run shell command: npm install
3. Run shell command: npm run build
4. Run shell command: scp -r dist/ {{server}}:/var/www/{{appName}}
5. Send notification: "{{appName}} deployed from {{branch}} to {{server}}"
```

When you run this workflow, you provide values:

```
Run workflow "deploy-app" with branch=main, server=prod-1.example.com, appName=my-app
```

The engine replaces every `{{branch}}`, `{{server}}`, and `{{appName}}` before executing the steps.

## Workflow Management Commands

GimiCoworker provides four core operations for managing workflows:

### Create

Register a new workflow with a name and a sequence of steps.

```
Create a workflow called "my-workflow" with these steps:
1. ...
2. ...
3. ...
```

### List

View all saved workflows and their steps.

```
List all my workflows.
```

The agent will display each workflow by name along with a summary of its steps.

### Run

Execute a saved workflow, optionally providing variable values.

```
Run the workflow "my-workflow" with var1=value1, var2=value2.
```

The engine will execute each step sequentially, substituting variables as needed.

### Delete

Remove a workflow that is no longer needed.

```
Delete the workflow "my-workflow".
```

The workflow will be permanently removed from the saved list.

## Examples

### Backup Workflow

A workflow that backs up a project directory to a timestamped archive.

```
Create a workflow called "backup-project" with these steps:
1. Run shell command: mkdir -p {{backupDir}}
2. Run shell command: tar -czf {{backupDir}}/{{projectName}}-$(date +%Y%m%d-%H%M%S).tar.gz {{projectPath}}
3. Run shell command: ls -lh {{backupDir}} | tail -5
4. Send notification: "Backup of {{projectName}} completed successfully"
```

**Running the backup:**

```
Run workflow "backup-project" with backupDir=/mnt/backups, projectName=my-api, projectPath=/home/user/projects/my-api
```

This will create the backup directory if it does not exist, compress the project into a timestamped archive, list recent backups, and send a desktop notification when finished.

### Deployment Workflow

A workflow that handles a full deployment pipeline — pull latest code, install dependencies, build, deploy, and verify.

```
Create a workflow called "full-deploy" with these steps:
1. Run shell command: cd {{repoPath}} && git pull origin {{branch}}
2. Run shell command: cd {{repoPath}} && npm ci
3. Run shell command: cd {{repoPath}} && npm run test
4. Run shell command: cd {{repoPath}} && npm run build
5. Run shell command: rsync -avz {{repoPath}}/dist/ {{deployUser}}@{{deployHost}}:{{deployPath}}
6. Scrape webpage: https://{{deployHost}}/health
7. Send notification: "Deployment of {{branch}} to {{deployHost}} complete"
```

**Running the deployment:**

```
Run workflow "full-deploy" with repoPath=/home/user/my-app, branch=main, deployUser=deploy, deployHost=prod.example.com, deployPath=/var/www/app
```

Each step runs in sequence. If the tests fail in step 3, the workflow stops, preventing a broken build from being deployed.

### Monitoring Workflow

A workflow that checks multiple services and compiles a status report.

```
Create a workflow called "service-check" with these steps:
1. Scrape webpage: https://{{service1}}/health
2. Scrape webpage: https://{{service2}}/health
3. Scrape webpage: https://{{service3}}/health
4. Write results to file: {{reportPath}}/status-report-$(date +%Y%m%d).md
5. Send notification: "Service health check complete — report saved"
```

**Running the check:**

```
Run workflow "service-check" with service1=api.example.com, service2=auth.example.com, service3=cdn.example.com, reportPath=/home/user/reports
```

This scrapes the health endpoint of three services, writes a consolidated report, and notifies you when done.

## Best Practices

- **Keep workflows focused.** Each workflow should handle one logical process. If a workflow grows too large, consider splitting it into smaller workflows.
- **Use descriptive variable names.** Names like `{{deployHost}}` and `{{backupDir}}` are self-documenting and make workflows easier to reuse.
- **Add a notification step at the end.** A final `send_notification` step lets you walk away and get alerted when the workflow finishes.
- **Test with safe values first.** Before running a deployment or destructive workflow in production, test it with a staging environment or a dry-run flag.
- **List workflows periodically.** Use the list command to review your saved workflows and delete any that are outdated.
