#!/usr/bin/env node

import 'dotenv/config';
import { program } from 'commander';
import chalk from 'chalk';

const VERSION = '1.0.0';

// ─── Global Error Handlers ──────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('ETELEGRAM: 409')) return;
  const clean = msg.length > 300 ? msg.substring(0, 300) + '...' : msg;
  console.error(chalk.red(`\n  Unhandled error: ${clean}\n`));
});

process.on('uncaughtException', (err) => {
  const msg = err?.message || String(err);
  const clean = msg.length > 300 ? msg.substring(0, 300) + '...' : msg;
  console.error(chalk.red(`\n  Fatal error: ${clean}\n`));
  process.exit(1);
});

// ─── CLI Program ───────────────────────────────────────────────────

program
  .name('gimi')
  .version(VERSION)
  .description('GimiCoworker: Multi-AI Agent OS Control System');

// ─── Interactive mode (default) ─────────────────────────────────────

program
  .command('interactive', { isDefault: true })
  .alias('i')
  .description('Start interactive multi-agent session')
  .action(async () => {
    const { configManager } = await import('../src/config/config-manager.js');

    // First run? Run onboarding
    if (!configManager.isSetupComplete()) {
      const { runOnboarding } = await import('../src/config/onboarding.js');
      await runOnboarding();

      // Re-check after onboarding
      if (!configManager.isSetupComplete()) {
        console.log(chalk.yellow('\n  Setup not completed. Run `gimi setup` to configure.\n'));
        process.exit(0);
      }
    }

    // Check for updates in background (non-blocking)
    import('../src/utils/updater.js')
      .then(({ checkForUpdates }) => checkForUpdates(VERSION))
      .catch(() => {});

    const { CLI } = await import('../src/cli.js');
    const cli = new CLI();
    await cli.start();
  });

// ─── Setup / Onboarding ────────────────────────────────────────────

program
  .command('setup')
  .description('Run the setup wizard (choose AI provider, enter API key)')
  .action(async () => {
    const { runOnboarding } = await import('../src/config/onboarding.js');
    await runOnboarding();
  });

// ─── Config Menu ────────────────────────────────────────────────────

program
  .command('config')
  .alias('settings')
  .description('View and modify configuration (provider, API key, model)')
  .action(async () => {
    const { configManager } = await import('../src/config/config-manager.js');

    if (!configManager.isSetupComplete()) {
      console.log(chalk.yellow('\n  Not set up yet. Running setup wizard...\n'));
      const { runOnboarding } = await import('../src/config/onboarding.js');
      await runOnboarding();
      return;
    }

    const { runConfigMenu } = await import('../src/config/onboarding.js');
    await runConfigMenu();
  });

// ─── Quick run ──────────────────────────────────────────────────────

program
  .command('run <message...>')
  .alias('r')
  .description('Send a single message to an agent and get a response')
  .option('-r, --role <role>', 'Agent role', 'general')
  .option('-m, --model <model>', 'Model to use')
  .action(async (messageParts, opts) => {
    const { configManager } = await import('../src/config/config-manager.js');
    if (!configManager.isSetupComplete()) {
      console.log(chalk.yellow('\n  Run `gimi setup` first.\n'));
      process.exit(1);
    }

    const { AgentManager } = await import('../src/core/agent-manager.js');
    const message = messageParts.join(' ');
    const manager = new AgentManager();
    const agent = manager.createAgent({ role: opts.role, model: opts.model });

    const ora = (await import('ora')).default;
    const spinner = ora({ text: chalk.gray('Thinking...'), spinner: 'dots12', color: 'magenta' }).start();

    try {
      const response = await agent.send(message, {
        onThinking: (text) => { spinner.text = chalk.gray(text); },
        onToolCall: (name) => {
          spinner.stop();
          console.log(chalk.yellow(`  > ${name}`));
          spinner.start();
        },
      });
      spinner.stop();
      console.log(`\n${response}\n`);
    } catch (err) {
      spinner.stop();
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ─── Roles ──────────────────────────────────────────────────────────

program
  .command('roles')
  .description('List available agent roles')
  .action(async () => {
    const { AGENT_ROLES } = await import('../src/config/defaults.js');
    console.log(chalk.bold('\nAvailable Agent Roles:\n'));
    for (const [key, role] of Object.entries(AGENT_ROLES)) {
      console.log(`  ${chalk.cyan(key.padEnd(14))} ${chalk.white(role.name)} - ${chalk.gray(role.description)}`);
    }
    console.log();
  });

// ─── Models ─────────────────────────────────────────────────────────

program
  .command('models')
  .description('List available models for current provider')
  .action(async () => {
    const { configManager } = await import('../src/config/config-manager.js');
    const { PROVIDERS } = await import('../src/providers/index.js');

    const provider = configManager.getProvider();
    const info = PROVIDERS[provider];

    if (!info) {
      console.log(chalk.yellow('\n  Run `gimi setup` first.\n'));
      return;
    }

    console.log(chalk.bold(`\n  ${info.name} Models:\n`));
    for (const model of info.models) {
      const isDefault = model === info.defaultModel;
      console.log(`  ${isDefault ? chalk.green('●') : chalk.gray('○')} ${chalk.cyan(model)}${isDefault ? chalk.green(' (default)') : ''}`);
    }

    console.log(chalk.gray(`\n  All providers:`));
    for (const [key, p] of Object.entries(PROVIDERS)) {
      const active = key === provider ? chalk.green(' ◀') : '';
      console.log(`  ${chalk.gray('·')} ${chalk.bold(p.name)}${active} - ${p.models.length} models`);
    }
    console.log();
  });

// ─── Providers ──────────────────────────────────────────────────────

program
  .command('providers')
  .description('List all supported AI providers')
  .action(async () => {
    const { PROVIDERS } = await import('../src/providers/index.js');
    const { configManager } = await import('../src/config/config-manager.js');
    const current = configManager.getProvider();

    console.log(chalk.bold('\n  Supported AI Providers:\n'));
    for (const [key, info] of Object.entries(PROVIDERS)) {
      const active = key === current ? chalk.green(' ◀ active') : '';
      const keyStatus = info.noKey ? chalk.gray('no key needed') : (configManager.getApiKey(key) ? chalk.green('key set') : chalk.yellow('no key'));
      console.log(`  ${chalk.bold(info.name)}${active}`);
      console.log(`    ${chalk.gray(info.description)}`);
      console.log(`    ${chalk.gray('Models:')} ${info.models.slice(0, 3).join(', ')}  ${chalk.gray(`[${keyStatus}]`)}`);
      console.log();
    }
  });

// ─── Skills ─────────────────────────────────────────────────────────

program
  .command('skill <action> [name]')
  .description('Manage skills: install, list, remove, search')
  .action(async (action, name) => {
    const { listSkills, installSkill, removeSkill, searchSkills } = await import('../src/skills/skill-manager.js');

    switch (action) {
      case 'list': {
        const skills = listSkills();
        if (skills.length === 0) {
          console.log(chalk.gray('\n  No skills installed.\n'));
          console.log(chalk.gray('  Install one: gimi skill install <owner/name>\n'));
          return;
        }
        console.log(chalk.bold('\n  Installed Skills:\n'));
        for (const s of skills) {
          console.log(`  ${chalk.cyan(`${s.owner}/${s.slug}`)}  ${chalk.gray(`v${s.version}`)}  ${s.displayName}`);
        }
        console.log();
        break;
      }

      case 'install': {
        if (!name) { console.log(chalk.red('\n  Usage: gimi skill install <owner/name>\n')); return; }
        const ora = (await import('ora')).default;
        const spinner = ora({ text: chalk.gray(`Installing "${name}"...`), spinner: 'dots12', color: 'magenta' }).start();
        try {
          const result = await installSkill(name);
          spinner.stop();
          if (result.type === 'choose') {
            console.log(chalk.bold(`\n  Sub-skills for "${result.owner}":\n`));
            for (const s of result.subSkills) {
              console.log(`  ${chalk.cyan(`${result.owner}/${s}`)}`);
            }
            console.log(chalk.gray(`\n  Install: gimi skill install ${result.owner}/<name>\n`));
          } else {
            console.log(chalk.green(`\n  Installed "${result.displayName}" (${result.files} files)\n`));
          }
        } catch (err) {
          spinner.stop();
          console.error(chalk.red(`\n  Error: ${err.message}\n`));
        }
        break;
      }

      case 'remove': {
        if (!name) { console.log(chalk.red('\n  Usage: gimi skill remove <owner/name>\n')); return; }
        try {
          removeSkill(name);
          console.log(chalk.green(`\n  Removed "${name}"\n`));
        } catch (err) {
          console.error(chalk.red(`\n  Error: ${err.message}\n`));
        }
        break;
      }

      case 'search': {
        const ora = (await import('ora')).default;
        const spinner = ora({ text: chalk.gray('Searching...'), spinner: 'dots12', color: 'magenta' }).start();
        try {
          const results = await searchSkills(name || '');
          spinner.stop();
          console.log(chalk.bold(`\n  Skills (showing ${results.length}):\n`));
          for (const r of results) {
            console.log(`  ${chalk.cyan(r)}`);
          }
          console.log(chalk.gray(`\n  Install: gimi skill install <name>\n`));
        } catch (err) {
          spinner.stop();
          console.error(chalk.red(`\n  Error: ${err.message}\n`));
        }
        break;
      }

      default:
        console.log(chalk.yellow(`\n  Unknown action: ${action}`));
        console.log(chalk.gray('  Available: install, list, remove, search\n'));
    }
  });

// ─── Telegram ───────────────────────────────────────────────────────

program
  .command('telegram')
  .alias('tg')
  .description('Start ALL Telegram bots')
  .action(async () => {
    const { configManager } = await import('../src/config/config-manager.js');
    if (!configManager.isSetupComplete()) {
      console.log(chalk.yellow('\n  Run `gimi setup` first.\n'));
      process.exit(1);
    }

    const { BotManager } = await import('../src/telegram/bot-manager.js');
    const masterToken = configManager.getTelegramToken();

    if (!masterToken && BotManager.listBots().length === 0) {
      console.log(chalk.red('\n  No bots configured!\n'));
      console.log(chalk.yellow('  Run: gimi config  (to set Telegram token)'));
      console.log(chalk.yellow('  Or:  gimi bot:add --token BOT_TOKEN --name "My Bot" --role general\n'));
      process.exit(1);
    }

    const apiKey = configManager.getApiKey();
    const manager = new BotManager(apiKey);
    console.log(chalk.magenta('\n  ═══ GimiCoworker Multi-Bot System ═══\n'));
    manager.startAll(masterToken);

    process.on('SIGINT', () => { manager.stopAll(); process.exit(0); });
  });

// ─── Bot Management ─────────────────────────────────────────────────

program
  .command('bot:add')
  .description('Add a new dedicated Telegram bot')
  .requiredOption('-t, --token <token>', 'Telegram bot token')
  .requiredOption('-n, --name <name>', 'Bot display name')
  .option('-r, --role <role>', 'Agent role', 'general')
  .option('-m, --model <model>', 'Model name')
  .option('-p, --prompt <prompt>', 'Custom system prompt')
  .option('-u, --username <username>', 'Bot @username')
  .action(async (opts) => {
    const { BotManager } = await import('../src/telegram/bot-manager.js');
    try {
      BotManager.addBot({
        botToken: opts.token,
        botName: opts.name,
        botUsername: opts.username,
        agentRole: opts.role,
        agentModel: opts.model,
        customPrompt: opts.prompt,
      });
      console.log(chalk.green(`\n  Bot "${opts.name}" added! (role: ${opts.role})`));
      console.log(chalk.gray(`  Start with: gimi telegram\n`));
    } catch (err) {
      console.error(chalk.red(`\n  Error: ${err.message}\n`));
    }
  });

program
  .command('bot:list')
  .alias('bots')
  .description('List configured Telegram bots')
  .action(async () => {
    const { BotManager } = await import('../src/telegram/bot-manager.js');
    const { configManager } = await import('../src/config/config-manager.js');
    const bots = BotManager.listBots();
    const masterToken = configManager.getTelegramToken();

    console.log(chalk.bold('\n  Telegram Bots:\n'));
    if (masterToken) {
      console.log(`  ${chalk.green('●')} ${chalk.bold('Master Bot')} ${chalk.gray('(from config)')}`);
      console.log(`    Token: ${chalk.gray(masterToken.slice(0, 10) + '...')}\n`);
    }
    if (bots.length === 0 && !masterToken) {
      console.log(chalk.gray('  No bots configured.\n'));
      return;
    }
    for (const bot of bots) {
      const status = bot.enabled ? chalk.green('●') : chalk.red('○');
      console.log(`  ${status} ${chalk.bold(`#${bot.id} ${bot.bot_name}`)}${bot.bot_username ? chalk.gray(` @${bot.bot_username}`) : ''}`);
      console.log(`    Role: ${chalk.cyan(bot.agent_role)} | Model: ${chalk.gray(bot.agent_model)}\n`);
    }
  });

program
  .command('bot:remove <id>')
  .description('Remove a Telegram bot')
  .action(async (id) => {
    const { BotManager } = await import('../src/telegram/bot-manager.js');
    try {
      BotManager.removeBot(parseInt(id));
      console.log(chalk.green(`\n  Removed bot #${id}\n`));
    } catch (err) {
      console.error(chalk.red(`\n  Error: ${err.message}\n`));
    }
  });

// ─── Update ─────────────────────────────────────────────────────────

program
  .command('update')
  .description('Update GimiCoworker to the latest version')
  .action(async () => {
    const { performUpdate } = await import('../src/utils/updater.js');
    await performUpdate();
  });

// ─── Uninstall ──────────────────────────────────────────────────────

program
  .command('uninstall')
  .description('Completely remove GimiCoworker from your computer')
  .action(async () => {
    const inquirer = (await import('inquirer')).default;
    const { configManager } = await import('../src/config/config-manager.js');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const { execSync } = await import('child_process');

    const homeDir = os.homedir();
    const gimiDir = path.join(homeDir, '.gimicoworker');
    const configPath = configManager.getPath();
    const configDir = path.dirname(configPath);

    console.log(chalk.bold('\n  GimiCoworker - Complete Uninstall\n'));
    console.log(chalk.gray('  This will remove EVERYTHING:'));
    console.log(chalk.gray(`    1. Config:     ${configDir}`));
    console.log(chalk.gray(`    2. Data:       ${gimiDir}`));
    console.log(chalk.gray(`    3. Package:    npm uninstall -g gimicoworker`));
    console.log();

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: chalk.red('Completely remove GimiCoworker from your computer?'),
      default: false,
    }]);

    if (!confirm) {
      console.log(chalk.gray('\n  Cancelled.\n'));
      return;
    }

    // Step 1: Clear config store
    console.log(chalk.gray('  Removing config...'));
    configManager.reset();
    // Also remove the config directory
    if (fs.existsSync(configDir)) {
      try { fs.rmSync(configDir, { recursive: true, force: true }); } catch {}
    }

    // Step 2: Remove ~/.gimicoworker (skills, data, agents)
    console.log(chalk.gray('  Removing data & skills...'));
    if (fs.existsSync(gimiDir)) {
      try { fs.rmSync(gimiDir, { recursive: true, force: true }); } catch {}
    }

    // Step 3: Remove local data dir if it exists
    const localData = path.join(process.cwd(), 'data');
    if (fs.existsSync(path.join(localData, 'cli-agent.db'))) {
      try { fs.rmSync(localData, { recursive: true, force: true }); } catch {}
    }

    console.log(chalk.green('\n  All data removed!'));

    // Step 4: Self-uninstall the npm package
    const { uninstallPkg } = await inquirer.prompt([{
      type: 'confirm',
      name: 'uninstallPkg',
      message: 'Also uninstall the npm package (npm uninstall -g gimicoworker)?',
      default: true,
    }]);

    if (uninstallPkg) {
      console.log(chalk.gray('\n  Uninstalling package...'));
      try {
        execSync('npm uninstall -g gimicoworker', { stdio: 'inherit' });
        console.log(chalk.green('\n  GimiCoworker completely removed from your computer!'));
        console.log(chalk.gray('  To reinstall: npm install -g gimicoworker\n'));
      } catch {
        console.log(chalk.yellow('\n  Could not auto-uninstall. Run manually:'));
        console.log(chalk.cyan('  npm uninstall -g gimicoworker\n'));
      }
    } else {
      console.log(chalk.green('\n  Data removed. Package still installed.'));
      console.log(chalk.gray('  To remove package: npm uninstall -g gimicoworker\n'));
    }
  });

// ─── Exec ───────────────────────────────────────────────────────────

program
  .command('exec <command...>')
  .alias('x')
  .description('Execute an OS command through AI agent')
  .action(async (commandParts) => {
    const { configManager } = await import('../src/config/config-manager.js');
    if (!configManager.isSetupComplete()) {
      console.log(chalk.yellow('\n  Run `gimi setup` first.\n'));
      process.exit(1);
    }

    const { AgentManager } = await import('../src/core/agent-manager.js');
    const command = commandParts.join(' ');
    const manager = new AgentManager();
    const agent = manager.createAgent({ role: 'sysadmin' });

    const ora = (await import('ora')).default;
    const spinner = ora({ text: chalk.gray('Processing...'), spinner: 'dots12', color: 'magenta' }).start();

    try {
      const response = await agent.send(`Execute this and explain the output: ${command}`, {
        onThinking: (text) => { spinner.text = chalk.gray(text); },
        onToolCall: (name) => { spinner.stop(); console.log(chalk.yellow(`  > ${name}`)); spinner.start(); },
      });
      spinner.stop();
      console.log(`\n${response}\n`);
    } catch (err) {
      spinner.stop();
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ─── Pipeline Mode ──────────────────────────────────────────────────

program
  .command('pipe [message...]')
  .alias('p')
  .description('Pipeline mode: read stdin, process with AI, write to stdout. Usage: cat file | gimi pipe "analyze this"')
  .option('-r, --role <role>', 'Agent role', 'general')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --system <prompt>', 'Custom system prompt')
  .action(async (messageParts, opts) => {
    const { configManager } = await import('../src/config/config-manager.js');
    if (!configManager.isSetupComplete()) {
      process.stderr.write('Run `gimi setup` first.\n');
      process.exit(1);
    }

    const { AgentManager } = await import('../src/core/agent-manager.js');
    const manager = new AgentManager();
    const agent = manager.createAgent({
      role: opts.role,
      model: opts.model,
      customPrompt: opts.system,
    });

    // Collect stdin if piped
    let stdinData = '';
    if (!process.stdin.isTTY) {
      for await (const chunk of process.stdin) {
        stdinData += chunk;
      }
    }

    const userMessage = messageParts?.join(' ') || '';
    const fullMessage = stdinData
      ? `${userMessage}\n\n--- INPUT DATA ---\n${stdinData}`
      : userMessage;

    if (!fullMessage.trim()) {
      process.stderr.write('No input. Pipe data or provide a message: gimi pipe "your question"\n');
      process.exit(1);
    }

    try {
      const response = await agent.send(fullMessage);
      process.stdout.write(response + '\n');
    } catch (err) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    }
  });

// ─── Export ─────────────────────────────────────────────────────────

program
  .command('export [path]')
  .description('Export all GimiCoworker data to a JSON backup file')
  .action(async (outputPath) => {
    const filepath = outputPath || `gimi-backup-${Date.now()}.json`;
    try {
      const { exportAll } = await import('../src/utils/export-import.js');
      const stats = await exportAll(filepath);
      console.log(chalk.green(`\n  Exported to ${stats.path}`));
      console.log(chalk.gray(`  Agents: ${stats.agents} | Memories: ${stats.memories} | Templates: ${stats.templates} | Workflows: ${stats.workflows}\n`));
    } catch (err) {
      console.error(chalk.red(`\n  Export failed: ${err.message}\n`));
    }
  });

// ─── Import ─────────────────────────────────────────────────────────

program
  .command('import <path>')
  .description('Import GimiCoworker data from a JSON backup file')
  .action(async (inputPath) => {
    try {
      const { importAll } = await import('../src/utils/export-import.js');
      const counts = await importAll(inputPath);
      console.log(chalk.green(`\n  Imported successfully!`));
      console.log(chalk.gray(`  Agents: ${counts.agents} | Memories: ${counts.memory} | Templates: ${counts.templates || 0}\n`));
    } catch (err) {
      console.error(chalk.red(`\n  Import failed: ${err.message}\n`));
    }
  });

// ─── Social Media ───────────────────────────────────────────────────

program
  .command('social [platform]')
  .description('Start interactive mode with a social media agent (whatsapp, instagram)')
  .action(async (platform) => {
    const { configManager } = await import('../src/config/config-manager.js');
    if (!configManager.isSetupComplete()) {
      console.log(chalk.yellow('\n  Run `gimi setup` first.\n'));
      process.exit(1);
    }

    console.log(chalk.magenta('\n  ═══ GimiCoworker Social Media Manager ═══\n'));

    if (platform === 'setup') {
      console.log(chalk.bold('  Installing Playwright browser...\n'));
      const { execSync } = await import('child_process');
      try {
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log(chalk.green('\n  Chromium browser installed for social media automation!\n'));
      } catch {
        console.log(chalk.yellow('\n  Failed to install browser. Try: npx playwright install chromium\n'));
      }
      return;
    }

    // Launch interactive mode with a social agent pre-created
    const { CLI } = await import('../src/cli.js');
    const cli = new CLI();

    // Override start to create a social agent
    const origStart = cli.start.bind(cli);
    cli.start = async function() {
      await origStart();
    };

    console.log(chalk.green(`  Launching social media mode! Platform: ${platform || 'all'}`));
    console.log(chalk.gray('  Use /social whatsapp or /social instagram to connect.\n'));

    const { CLI: CLIClass } = await import('../src/cli.js');
    const socialCli = new CLIClass();
    await socialCli.start();
  });

program.parse();
