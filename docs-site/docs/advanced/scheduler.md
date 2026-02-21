---
sidebar_position: 3
---

# Task Scheduler

GimiCoworker includes a cron-based task scheduler that lets you run AI agent commands on a recurring basis. Schedules are persistent, meaning they survive application restarts, so you can set up monitoring, reporting, and maintenance tasks that run reliably in the background.

## Overview

The scheduler allows you to:

- **Schedule recurring tasks** using standard cron expressions.
- **Run any agent command** on each scheduled tick — shell commands, file operations, scraping, notifications, and more.
- **Persist schedules** so they are restored automatically when GimiCoworker restarts.
- **Manage schedules** with simple add, list, and remove operations.

## Cron Syntax

Schedules are defined using standard cron expressions with five fields:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7, where 0 and 7 are Sunday)
│ │ │ │ │
* * * * *
```

**Special Characters:**

| Character | Meaning | Example |
|-----------|---------|---------|
| `*` | Every value | `* * * * *` = every minute |
| `,` | Multiple values | `0,30 * * * *` = at minute 0 and 30 |
| `-` | Range of values | `0 9-17 * * *` = every hour from 9 AM to 5 PM |
| `/` | Step values | `*/15 * * * *` = every 15 minutes |

**Common Expressions:**

| Expression | Description |
|------------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour (at minute 0) |
| `0 */2 * * *` | Every 2 hours |
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1-5` | Every weekday at 9:00 AM |
| `0 0 * * *` | Every day at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 0 1 * *` | First day of every month at midnight |

## Creating Schedules

To add a new schedule, provide a name, a cron expression, and the command the agent should execute on each tick.

**Basic Example:**

```
Schedule a task called "hourly-ping" that runs every hour and checks if https://example.com is up.
```

The agent will register a persistent schedule that triggers every hour at minute 0.

**With Explicit Cron:**

```
Add a schedule called "morning-report" with cron "0 9 * * 1-5" that generates a summary of yesterday's log files in /var/log/myapp/.
```

This creates a schedule that runs every weekday at 9:00 AM.

## Schedule Management Commands

### Add a Schedule

Register a new recurring task with a name, cron expression, and command.

```
Add a schedule called "my-task" with cron "*/30 * * * *" that runs: check disk usage and alert if above 90%.
```

The schedule is saved persistently and begins executing on the defined interval.

### List Schedules

View all active schedules, their cron expressions, and what command they run.

```
List all my scheduled tasks.
```

The agent will display each schedule with its name, cron expression, next run time, and associated command.

### Remove a Schedule

Delete a schedule that is no longer needed.

```
Remove the schedule called "my-task".
```

The schedule will stop executing and be permanently removed.

## Examples

### Hourly Health Check

Monitor an application's health endpoint every hour and send a notification if something is wrong.

```
Add a schedule called "health-check" with cron "0 * * * *" that does the following:
Scrape https://myapp.example.com/health and check if the status is "ok". If not, send a notification saying "Health check failed for myapp".
```

**What this does:**

- Runs at the top of every hour.
- Scrapes the health endpoint of your application.
- Analyzes the response to determine if the service is healthy.
- Sends a desktop notification only if the check fails, so you are alerted immediately.

### Daily Reports

Generate a daily summary report every morning before work.

```
Add a schedule called "daily-report" with cron "0 8 * * 1-5" that does the following:
1. Read the log files in /var/log/myapp/ from the last 24 hours.
2. Summarize any errors or warnings.
3. Write the summary to /home/user/reports/daily-report-today.md.
4. Send a notification saying "Daily report is ready".
```

**What this does:**

- Runs at 8:00 AM every weekday (Monday through Friday).
- Reads recent log files and identifies errors and warnings.
- Produces a written summary report saved to a known location.
- Notifies you that the report is ready for review.

### Weekly Backups

Run a full project backup every Sunday night.

```
Add a schedule called "weekly-backup" with cron "0 2 * * 0" that does the following:
1. Create a compressed archive of /home/user/projects/my-app into /mnt/backups/my-app-weekly.tar.gz.
2. Verify the archive was created and check its file size.
3. Delete backup archives older than 30 days from /mnt/backups/.
4. Send a notification saying "Weekly backup complete".
```

**What this does:**

- Runs at 2:00 AM every Sunday.
- Compresses the entire project directory into a single archive.
- Verifies that the archive was created successfully.
- Cleans up old backups to prevent disk space from filling up.
- Sends a confirmation notification.

### Every-5-Minutes Uptime Monitor

Keep a close watch on a critical service.

```
Add a schedule called "uptime-monitor" with cron "*/5 * * * *" that does the following:
Scrape https://critical-service.example.com/status. If the page does not contain "operational", send a notification saying "ALERT: critical-service may be down".
```

**What this does:**

- Runs every 5 minutes around the clock.
- Fetches the status page of the critical service.
- Checks for the presence of the word "operational" in the response.
- Sends an urgent notification if the expected text is missing.

## Persistence

All schedules are saved to disk. When GimiCoworker restarts:

1. The scheduler reads saved schedules from persistent storage.
2. Each schedule is re-registered with its original cron expression and command.
3. Execution resumes on the next matching cron tick.

You do not need to re-add schedules after a restart. They will continue running automatically.

## Best Practices

- **Use descriptive schedule names.** Names like `daily-report` and `weekly-backup` make it easy to identify what each schedule does when listing them.
- **Start with longer intervals.** When testing a new schedule, start with a less frequent interval (e.g., every 30 minutes) and tighten it once you confirm it works correctly.
- **Include a notification step.** Adding a `send_notification` step to your scheduled command ensures you are aware of each run's result without having to check manually.
- **Review schedules regularly.** Use the list command periodically to audit active schedules and remove any that are no longer needed.
- **Be mindful of resource usage.** Very frequent schedules (e.g., every minute) that perform heavy operations like scraping or file I/O can consume significant resources. Use the minimum frequency that meets your needs.
