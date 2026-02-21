---
sidebar_position: 2
---

# Multi-Agent Teams

The most powerful feature of CLI-AGT is running **multiple specialized agents** that work together. This guide shows you how to set up agent teams for real-world scenarios.

## How Teams Work

```
┌──────────────┐   shared memory   ┌──────────────┐
│  Architect   │ ◄───────────────► │  Frontend    │
│  (Planner)   │                   │  Dev         │
└──────┬───────┘                   └──────────────┘
       │ shared memory
       │                           ┌──────────────┐
       ├──────────────────────────►│  Backend     │
       │                           │  Dev         │
       │                           └──────────────┘
       │
       │                           ┌──────────────┐
       └──────────────────────────►│  DevOps      │
                                   │  Engineer    │
                                   └──────────────┘
```

Agents communicate through **shared memory**. One agent saves a decision, others read it.

## Team Setup: Software Development

### Step 1: Create the team

```bash
/create coder "Lead Architect"
/create coder "Frontend Dev"
/create coder "Backend Dev"
/create devops "DevOps Engineer"
/create security "Security Reviewer"
```

### Step 2: Restrict each agent to its area

```bash
/switch agent_1
/restrict D:\projects\my-app

/switch agent_2
/restrict D:\projects\my-app\frontend

/switch agent_3
/restrict D:\projects\my-app\backend

/switch agent_4
/restrict D:\projects\my-app\infra D:\projects\my-app\docker

/switch agent_5
/restrict D:\projects\my-app
```

### Step 3: Workflow

**1. Start with the Architect:**
```bash
/switch agent_1
You: Plan a full-stack e-commerce app. We need:
     - React frontend with product pages and cart
     - Node.js Express API with authentication
     - PostgreSQL database
     - Docker deployment
     Save the architecture plan to shared memory.
```

**2. Switch to Frontend Dev:**
```bash
/switch agent_2
You: Check shared memory for the architecture plan.
     Set up the React frontend with the product page and cart.
```

**3. Switch to Backend Dev:**
```bash
/switch agent_3
You: Check shared memory for the architecture plan.
     Build the Express API with the routes and database models.
```

**4. Switch to DevOps:**
```bash
/switch agent_4
You: Check shared memory for the architecture plan.
     Create Dockerfiles and docker-compose for the full stack.
```

**5. Switch to Security Reviewer:**
```bash
/switch agent_5
You: Review all the code in the project for security vulnerabilities.
     Check for SQL injection, XSS, auth issues, and secrets in code.
```

## Team Setup: System Administration

```bash
/create sysadmin "Server Manager"
/create security "Security Monitor"
/create devops "Deployment Bot"
/create researcher "Log Analyst"
```

### Workflow

```bash
# Server Manager: routine maintenance
/switch agent_1
You: Check system health — disk space, memory, CPU load.
     Update any packages that need it.
     Save the system status to shared memory.

# Security Monitor: security audit
/switch agent_2
You: Check shared memory for system status.
     Scan for open ports, check file permissions on sensitive dirs.
     Look for any suspicious processes.

# Log Analyst: investigate issues
/switch agent_4
You: Read the system logs and find any errors or warnings
     from the last 24 hours. Summarize findings to shared memory.

# Deployment Bot: deploy updates
/switch agent_3
You: Check shared memory for any issues.
     If everything is clear, deploy the latest code from the main branch.
```

## Team Setup: Data Pipeline

```bash
/create researcher "Data Collector"
/create coder "Data Engineer"
/create coder "Analyst"
/create researcher "Report Writer"
```

### Workflow

```bash
# Collector: gather raw data
/switch agent_1
You: Download the CSV from https://example.com/data.csv
     Save it to D:\data\raw\
     Save the file location to shared memory.

# Data Engineer: clean and transform
/switch agent_2
You: Check shared memory for the data file location.
     Write a Python script to clean the CSV — remove nulls,
     normalize dates, and output to D:\data\processed\

# Analyst: analyze
/switch agent_3
You: Check shared memory. Read the processed data.
     Write a Python analysis script that calculates key metrics.
     Save findings to shared memory.

# Report Writer: produce report
/switch agent_4
You: Check shared memory for analysis findings.
     Write a markdown report summarizing the data analysis.
```

## Team Setup: Personal Productivity

```bash
/create general "Daily Assistant"
/create filemanager "Organizer"
/create sysadmin "Maintenance Bot"
```

```bash
# Daily Assistant
/switch agent_1
You: What time is it? Check my calendar file and remind me
     of today's tasks. Save today's priorities to shared memory.

# Organizer
/switch agent_2
You: Clean up my Downloads folder — sort by type,
     delete anything older than 30 days.

# Maintenance Bot
/switch agent_3
You: Check disk space. Clear temp files. Check for system updates.
     Report status to shared memory.
```

## Best Practices

### 1. Always start with a planner
The first agent should plan the work and save it to shared memory. Other agents read the plan.

### 2. Use descriptive names
```bash
# Good
/create coder "Frontend Dev"
/create coder "API Developer"

# Bad
/create coder "Agent 1"
/create coder "Agent 2"
```

### 3. Use folder restrictions
Prevent agents from stepping on each other's work:
```bash
/restrict D:\projects\my-app\frontend   # Frontend only
/restrict D:\projects\my-app\backend    # Backend only
```

### 4. Use the right model for the role
```bash
# Planner/architect: use the smartest model
/switch agent_1
/model gemini-2.5-pro-preview-05-06

# Execution agents: use the fast model
/switch agent_2
/model gemini-2.0-flash
```

### 5. Check shared memory
Tell agents to "check shared memory first" so they stay coordinated.

### 6. Use Telegram for monitoring
Set up dedicated bots for each agent and monitor them from your phone while they work.
