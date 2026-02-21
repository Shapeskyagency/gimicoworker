import { createInterface } from 'readline';
import ora from 'ora';
import { AgentManager } from './core/agent-manager.js';
import { Sandbox } from './core/sandbox.js';
import { AGENT_ROLES } from './config/defaults.js';
import { PROVIDERS } from './providers/index.js';
import { configManager } from './config/config-manager.js';
import { runConfigMenu } from './config/onboarding.js';
import { listSkills, installSkill, loadSkillContext } from './skills/skill-manager.js';
import { renderMarkdown } from './ui/markdown.js';
import { killAllProcesses, getActiveProcessCount } from './tools/shell.js';
import {
  printBanner,
  printAgentMessage,
  printToolExecution,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  printAgentList,
  printToolList,
  printHelp,
  printStatus,
  getPromptPrefix,
  theme,
} from './ui/terminal.js';
import { assignRoles, runCollaboration } from './core/collaboration.js';

export class CLI {
  constructor() {
    const provider = configManager.getProvider();
    const model = configManager.getDefaultModel();
    const providerInfo = PROVIDERS[provider];
    this.providerName = providerInfo?.name || provider;
    this.modelName = model;
    this.manager = new AgentManager();
    this.rl = null;
    this.spinner = null;
    this.running = true;
    this._isProcessing = false; // Track if an agent request is in progress
  }

  async start() {
    printBanner(this.providerName, this.modelName);

    // Ensure all child processes are killed on any exit
    const cleanup = () => killAllProcesses();
    process.on('exit', cleanup);
    process.on('SIGTERM', () => { cleanup(); process.exit(1); });
    process.on('SIGHUP', () => { cleanup(); process.exit(1); });

    // Load saved agents from previous session
    await this.manager.loadState();

    if (this.manager.getAgentCount() === 0) {
      const defaultAgent = this.manager.createAgent({
        name: 'Gimi',
        role: 'general',
      });
      printSuccess(`Agent "${defaultAgent.name}" created (${defaultAgent.role}) using ${this.providerName}`);
    } else {
      const agents = this.manager.listAgents();
      printSuccess(`Restored ${agents.length} agent(s) from previous session`);
      const active = this.manager.getActiveAgent();
      if (active) printInfo(`Active: "${active.name}" (${active.role})`);
    }

    printInfo('Type /help for commands or just start chatting!\n');

    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (line) => this._completer(line),
    });

    this.rl.on('close', () => {
      this.running = false;
    });

    // Graceful Ctrl+C handling
    this.rl.on('SIGINT', () => {
      if (this._isProcessing) {
        // Cancel current operation and kill any running commands
        this._isProcessing = false;
        killAllProcesses();
        if (this.spinner) {
          this.spinner.stop();
          this.spinner = null;
        }
        printWarning('Operation cancelled. All running commands killed.');
        // Return to prompt (promptLoop continues)
      } else {
        // Double Ctrl+C to exit
        printInfo('Press Ctrl+C again or type /exit to quit.');
        this.rl.once('SIGINT', async () => {
          await this.exit();
        });
      }
    });

    await this.promptLoop();
  }

  // ─── Tab Auto-Completion ──────────────────────────────────────────

  _completer(line) {
    const allCommands = [
      '/create', '/list', '/switch', '/remove', '/rename', '/restrict',
      '/skill', '/skills', '/collab', '/reset', '/tools', '/model',
      '/config', '/status', '/history', '/clear', '/help', '/exit',
      '/social', '/workflow', '/schedule', '/template', '/screenshot',
      '/export', '/import', '/clip', '/notify',
    ];

    if (line.startsWith('/')) {
      // Complete command names
      if (!line.includes(' ')) {
        const hits = allCommands.filter(c => c.startsWith(line));
        return [hits.length ? hits : allCommands, line];
      }

      // Complete /create with role names
      if (line.startsWith('/create ')) {
        const partial = line.slice(8);
        const roles = Object.keys(AGENT_ROLES);
        const hits = roles.filter(r => r.startsWith(partial));
        return [hits.map(r => `/create ${r}`), line];
      }

      // Complete /switch with agent IDs
      if (line.startsWith('/switch ')) {
        const partial = line.slice(8);
        const ids = this.manager.listAgents().map(a => a.id.replace('agent_', ''));
        const hits = ids.filter(id => id.startsWith(partial));
        return [hits.map(id => `/switch ${id}`), line];
      }

      // Complete /social with platforms
      if (line.startsWith('/social ')) {
        const partial = line.slice(8);
        const platforms = ['whatsapp', 'instagram', 'status'];
        const hits = platforms.filter(p => p.startsWith(partial));
        return [hits.map(p => `/social ${p}`), line];
      }

      // Complete /workflow with subcommands
      if (line.startsWith('/workflow ')) {
        const partial = line.slice(10);
        const subs = ['create', 'list', 'run', 'delete'];
        const hits = subs.filter(s => s.startsWith(partial));
        return [hits.map(s => `/workflow ${s}`), line];
      }

      // Complete /schedule with subcommands
      if (line.startsWith('/schedule ')) {
        const partial = line.slice(10);
        const subs = ['add', 'list', 'remove', 'start', 'stop'];
        const hits = subs.filter(s => s.startsWith(partial));
        return [hits.map(s => `/schedule ${s}`), line];
      }

      // Complete /template with subcommands
      if (line.startsWith('/template ')) {
        const partial = line.slice(10);
        const subs = ['save', 'load', 'list', 'delete'];
        const hits = subs.filter(s => s.startsWith(partial));
        return [hits.map(s => `/template ${s}`), line];
      }
    }

    return [[], line];
  }

  // ─── Multi-Line Input ─────────────────────────────────────────────

  async _collectInput(prefix) {
    const firstLine = await this.question(prefix);
    const trimmed = firstLine.trim();

    // Multi-line mode triggers
    if (trimmed === '"""' || trimmed === '```') {
      const delimiter = trimmed;
      const lines = [];
      printInfo(`Multi-line mode. Type ${delimiter} on a new line to finish.`);

      while (true) {
        const line = await this.question(theme.muted('... '));
        if (line.trim() === delimiter) break;
        lines.push(line);
      }
      return lines.join('\n');
    }

    return firstLine;
  }

  // ─── Main Loop ────────────────────────────────────────────────────

  async promptLoop() {
    while (this.running) {
      try {
        const agent = this.manager.getActiveAgent();
        const prefix = agent ? getPromptPrefix(agent.name) : theme.muted('> ');
        const input = await this._collectInput(prefix);
        const trimmed = input.trim();

        if (!trimmed) continue;

        if (trimmed.startsWith('/')) {
          await this.handleCommand(trimmed);
        } else {
          await this.handleMessage(trimmed);
        }
      } catch (err) {
        if (!this.running) break;
        printError(err.message || 'Unknown error');
      }
    }
  }

  // ─── Command Router ───────────────────────────────────────────────

  async handleCommand(input) {
    const parts = input.slice(1).split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'create':
        await this.cmdCreate(args);
        break;
      case 'list':
      case 'ls':
        this.cmdList();
        break;
      case 'switch':
      case 'sw':
        this.cmdSwitch(args);
        break;
      case 'remove':
      case 'rm':
        this.cmdRemove(args);
        break;
      case 'rename':
        this.cmdRename(args);
        break;
      case 'restrict':
        this.cmdRestrict(args);
        break;
      case 'skill':
        await this.cmdSkill(args);
        break;
      case 'skills':
        this.cmdSkills();
        break;
      case 'collab':
        await this.cmdCollab(args);
        break;
      case 'reset':
        this.cmdReset();
        break;
      case 'tools':
        this.cmdTools();
        break;
      case 'model':
        this.cmdModel(args);
        break;
      case 'config':
        await this.cmdConfig();
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'history':
        this.cmdHistory();
        break;
      case 'clear':
      case 'cls':
        console.clear();
        printBanner(this.providerName, this.modelName);
        break;

      // ─── NEW COMMANDS ───────────────────────────────────────────
      case 'social':
        await this.cmdSocial(args);
        break;
      case 'workflow':
      case 'wf':
        await this.cmdWorkflow(args);
        break;
      case 'schedule':
      case 'cron':
        await this.cmdSchedule(args);
        break;
      case 'template':
      case 'tpl':
        await this.cmdTemplate(args);
        break;
      case 'screenshot':
      case 'ss':
        await this.cmdScreenshot();
        break;
      case 'export':
        await this.cmdExport(args);
        break;
      case 'import':
        await this.cmdImport(args);
        break;
      case 'clip':
      case 'clipboard':
        await this.cmdClipboard(args);
        break;
      case 'notify':
        await this.cmdNotify(args);
        break;

      case 'help':
      case '?':
        printHelp();
        break;
      case 'exit':
      case 'quit':
      case 'q':
        await this.exit();
        break;
      default:
        printError(`Unknown command: /${cmd}. Type /help for available commands.`);
    }
  }

  // ─── Original Commands ────────────────────────────────────────────

  async cmdCreate(args) {
    let role = args[0] || 'general';
    let name = args.slice(1).join(' ') || null;

    if (!AGENT_ROLES[role]) {
      const available = Object.keys(AGENT_ROLES).join(', ');
      printError(`Unknown role: "${role}". Available: ${available}`);
      return;
    }

    if (role === 'custom') {
      const customPrompt = await this.question(theme.muted('Enter custom system prompt: '));
      if (!customPrompt.trim()) {
        printError('Custom agents require a system prompt.');
        return;
      }
      const agent = this.manager.createAgent({ name, role, customPrompt });
      printSuccess(`Custom agent "${agent.name}" created (ID: ${agent.id})`);
      return;
    }

    const agent = this.manager.createAgent({ name, role });
    printSuccess(`Agent "${agent.name}" created as ${role} (ID: ${agent.id})`);
  }

  cmdRestrict(args) {
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }

    if (args.length === 0) {
      printInfo(`${agent.name}: ${agent.sandbox.getInfo()}`);
      return;
    }

    if (args[0] === 'clear' || args[0] === 'none') {
      agent.sandbox = new Sandbox([]);
      agent._allowedFolders = [];
      agent.resetChat();
      printSuccess(`Restrictions cleared for "${agent.name}"`);
      return;
    }

    agent.sandbox = new Sandbox(args);
    agent._allowedFolders = args;
    agent.resetChat();
    printSuccess(`"${agent.name}" restricted to: ${args.join(', ')}`);
  }

  async cmdSkill(args) {
    const subCmd = args[0];

    if (!subCmd) {
      printInfo('Usage: /skill install <owner/name> | /skill load <owner/name> | /skill remove <owner/name>');
      return;
    }

    if (subCmd === 'install') {
      const name = args[1];
      if (!name) { printError('Usage: /skill install <owner/name>'); return; }

      const spinner = ora({ text: theme.muted(`Installing skill "${name}"...`), spinner: 'dots12', color: 'magenta', discardStdin: false }).start();
      try {
        const result = await installSkill(name);
        spinner.stop();
        if (result.type === 'choose') {
          printInfo(`Found sub-skills: ${result.subSkills.join(', ')}`);
          printInfo(`Install specific one: /skill install ${result.owner}/<name>`);
        } else {
          printSuccess(`Installed "${result.displayName}" (${result.files} files)`);
        }
      } catch (err) {
        spinner.stop();
        printError(err.message);
      }
      return;
    }

    if (subCmd === 'load') {
      const name = args[1];
      if (!name) { printError('Usage: /skill load <owner/name>'); return; }

      const agent = this.manager.getActiveAgent();
      if (!agent) { printError('No active agent'); return; }

      try {
        const context = loadSkillContext(name);
        agent.systemPrompt += `\n\n--- SKILL: ${name} ---\n${context}`;
        agent.resetChat();
        printSuccess(`Skill "${name}" loaded into "${agent.name}"`);
      } catch (err) {
        printError(err.message);
      }
      return;
    }

    if (subCmd === 'remove') {
      const name = args[1];
      if (!name) { printError('Usage: /skill remove <owner/name>'); return; }
      try {
        const { removeSkill: rm } = await import('./skills/skill-manager.js');
        rm(name);
        printSuccess(`Removed skill "${name}"`);
      } catch (err) {
        printError(err.message);
      }
      return;
    }

    // If just a name, try to load it directly
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }

    try {
      const context = loadSkillContext(subCmd);
      agent.systemPrompt += `\n\n--- SKILL: ${subCmd} ---\n${context}`;
      agent.resetChat();
      printSuccess(`Skill "${subCmd}" loaded into "${agent.name}"`);
    } catch (err) {
      printError(err.message);
    }
  }

  cmdSkills() {
    const skills = listSkills();
    if (skills.length === 0) {
      printInfo('No skills installed. Install one: /skill install <owner/name>');
      return;
    }

    console.log(`\n${theme.bold('Installed Skills:')}\n`);
    for (const s of skills) {
      console.log(`  ${theme.secondary(`${s.owner}/${s.slug}`)}  ${theme.muted(`v${s.version}`)}  ${theme.text(s.displayName)}`);
    }
    console.log();
  }

  async cmdConfig() {
    this.rl.pause();
    try {
      await runConfigMenu();
    } catch {}
    this.rl.resume();
  }

  cmdList() {
    const agents = this.manager.listAgents();
    if (agents.length === 0) {
      printInfo('No agents created yet. Use /create to make one.');
      return;
    }
    printAgentList(agents, this.manager.activeAgentId);
  }

  cmdSwitch(args) {
    const id = args[0];
    if (!id) { printError('Usage: /switch <agent_id>'); return; }
    let targetId = id.startsWith('agent_') ? id : `agent_${id}`;

    try {
      const agent = this.manager.setActiveAgent(targetId);
      printSuccess(`Switched to agent "${agent.name}" (${agent.role})`);
    } catch (err) {
      printError(err.message);
      const agents = this.manager.listAgents();
      printInfo(`Available: ${agents.map(a => a.id).join(', ')}`);
    }
  }

  cmdRemove(args) {
    const id = args[0];
    if (!id) { printError('Usage: /remove <agent_id>'); return; }
    let targetId = id.startsWith('agent_') ? id : `agent_${id}`;
    try {
      const agent = this.manager.getAgent(targetId);
      this.manager.removeAgent(targetId);
      printSuccess(`Removed agent "${agent?.name || targetId}"`);
    } catch (err) {
      printError(err.message);
    }
  }

  cmdRename(args) {
    const newName = args.join(' ');
    if (!newName) { printError('Usage: /rename <new name>'); return; }
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }
    const old = agent.name;
    agent.name = newName;
    printSuccess(`Renamed "${old}" to "${newName}"`);
  }

  async cmdCollab(args) {
    const task = args.join(' ');
    if (!task) {
      printError('Usage: /collab <task description>');
      printInfo('Example: /collab Build a REST API with Express that has user CRUD endpoints');
      return;
    }

    const agentList = this.manager.listAgents();

    if (agentList.length < 2) {
      printWarning('Collaboration requires at least 2 agents.');
      printInfo('You have ' + agentList.length + ' agent(s). Creating a complementary agent...');

      const existingRoles = agentList.map(a => a.role);
      const newRole = existingRoles.includes('coder') ? 'researcher' : 'coder';
      const newAgent = this.manager.createAgent({ role: newRole });
      printSuccess(`Auto-created "${newAgent.name}" (${newRole}) for collaboration`);
    }

    const allAgents = Array.from(this.manager.agents.values());
    const { planner, executor } = assignRoles(allAgents);

    printInfo(`Planner: "${planner.name}" (${planner.role})`);
    printInfo(`Executor: "${executor.name}" (${executor.role})`);
    printInfo('Starting autonomous collaboration...\n');

    try {
      const result = await runCollaboration({ task, planner, executor, maxRounds: 6 });

      if (result.completed) {
        printSuccess(`Collaboration completed in ${result.rounds} round(s).`);
      } else {
        printWarning(`Collaboration ended after ${result.rounds} round(s) without explicit completion.`);
      }
    } catch (err) {
      printError(`Collaboration failed: ${err.message}`);
    }
  }

  cmdReset() {
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }
    agent.resetChat();
    printSuccess(`Reset conversation for "${agent.name}"`);
  }

  cmdTools() {
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }
    printToolList(agent.toolRegistry.listTools());
  }

  cmdModel(args) {
    const agent = this.manager.getActiveAgent();
    if (!args[0]) {
      const provider = configManager.getProvider();
      const info = PROVIDERS[provider];
      printInfo(`Available models: ${info?.models?.join(', ') || 'N/A'}`);
      if (agent) printInfo(`Current: ${agent.model}`);
      return;
    }
    if (!agent) { printError('No active agent'); return; }
    agent.model = args[0];
    agent.provider.model = args[0];
    agent.resetChat();
    printSuccess(`Model changed to ${args[0]} for "${agent.name}"`);
  }

  cmdStatus() {
    printStatus(this.manager);
  }

  cmdHistory() {
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent'); return; }
    if (agent.history.length === 0) {
      printInfo('No conversation history yet.');
      return;
    }

    console.log(`\n${theme.bold(`Conversation History - ${agent.name}`)}\n`);
    for (const entry of agent.history.slice(-20)) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      if (entry.role === 'user') {
        console.log(`  ${theme.muted(time)} ${theme.user('You')}: ${entry.content}`);
      } else if (entry.role === 'agent') {
        const preview = entry.content.length > 120 ? entry.content.substring(0, 120) + '...' : entry.content;
        console.log(`  ${theme.muted(time)} ${theme.agent(agent.name)}: ${preview}`);
      } else {
        console.log(`  ${theme.muted(time)} ${theme.error('Error')}: ${entry.content}`);
      }
    }
    console.log();
  }

  // ─── NEW: Social Media Commands ───────────────────────────────────

  async cmdSocial(args) {
    const sub = args[0];
    if (!sub) {
      printInfo('Social Media & Business Manager:');
      printInfo('');
      printInfo('  Connection:');
      printInfo('    /social whatsapp     - Connect to WhatsApp Web');
      printInfo('    /social instagram    - Connect to Instagram');
      printInfo('    /social status       - Show all connection status');
      printInfo('');
      printInfo('  WhatsApp:');
      printInfo('    /social unread       - Check unread WhatsApp messages');
      printInfo('    /social watch        - Start watching for new messages');
      printInfo('    /social autoreply    - Set up WhatsApp auto-reply rules');
      printInfo('');
      printInfo('  Instagram:');
      printInfo('    /social like <user>  - Like a user\'s latest posts');
      printInfo('    /social comment      - Comment on a post (prompts)');
      printInfo('    /social analytics    - Get Instagram page analytics');
      printInfo('    /social report       - Generate daily growth report');
      printInfo('    /social dmwatch      - Start watching Instagram DMs');
      printInfo('');
      printInfo('Tip: Create a social agent first: /create social');
      return;
    }

    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent. Create one: /create social'); return; }

    if (agent.role !== 'social') {
      printWarning(`Active agent "${agent.name}" is a ${agent.role} agent.`);
      printInfo('For best results, create a social agent: /create social');
      printInfo('Proceeding anyway - loading social tools...');
      await agent.toolRegistry.registerCategory('social');
    }

    switch (sub) {
      // ─── Connection ──────────────────────────────────────────────
      case 'whatsapp': case 'wa':
        printInfo('Connecting to WhatsApp Web...');
        await this.handleMessage('Connect to WhatsApp Web. Open the browser and help me log in.');
        break;
      case 'instagram': case 'ig':
        printInfo('Connecting to Instagram...');
        await this.handleMessage('Connect to Instagram. Open the browser and help me log in.');
        break;
      case 'status':
        await this.handleMessage('Check the status of ALL social media connections (WhatsApp and Instagram). Show watching status, auto-reply rules, and analytics snapshots.');
        break;

      // ─── WhatsApp ────────────────────────────────────────────────
      case 'unread':
        await this.handleMessage('Check all unread WhatsApp messages right now using whatsapp_get_unread. Show me who messaged and what they said.');
        break;
      case 'watch':
        printInfo('Starting WhatsApp message watcher...');
        await this.handleMessage('Start watching for new WhatsApp messages. Use whatsapp_watch with action "start". Notify me whenever new messages arrive.');
        break;
      case 'autoreply': {
        printInfo('Setting up auto-reply. Tell the agent your rules:');
        const rule = await this.question(theme.muted('  Reply rule (e.g., "reply to everyone with: I\'m busy right now"): '));
        if (rule.trim()) {
          await this.handleMessage(`Set up a WhatsApp auto-reply rule: ${rule.trim()}`);
        }
        break;
      }

      // ─── Instagram Engagement ────────────────────────────────────
      case 'like': {
        const username = args[1];
        if (!username) {
          const user = await this.question(theme.muted('  Username to like posts from: @'));
          if (user.trim()) await this.handleMessage(`Like the 3 latest posts from @${user.trim()} using instagram_like_multiple.`);
        } else {
          await this.handleMessage(`Like the 3 latest posts from @${username} using instagram_like_multiple.`);
        }
        break;
      }
      case 'comment': {
        const target = await this.question(theme.muted('  Post URL or @username: '));
        if (!target.trim()) break;
        const comment = await this.question(theme.muted('  Your comment: '));
        if (comment.trim()) {
          await this.handleMessage(`Comment "${comment.trim()}" on ${target.trim()}'s latest post using instagram_comment.`);
        }
        break;
      }

      // ─── Instagram Analytics ─────────────────────────────────────
      case 'analytics':
        printInfo('Fetching Instagram analytics...');
        await this.handleMessage('Get my Instagram page analytics using instagram_analytics. Show engagement rate, follower stats, and recent post performance.');
        break;
      case 'report':
        printInfo('Generating daily growth report...');
        await this.handleMessage('Generate my Instagram daily growth report using instagram_daily_report. Show everything: followers, engagement, growth, top posts.');
        break;

      // ─── Instagram DM Watch ──────────────────────────────────────
      case 'dmwatch':
        printInfo('Starting Instagram DM watcher...');
        await this.handleMessage('Start watching for new Instagram DMs using instagram_watch_dm with action "start".');
        break;

      default:
        printError(`Unknown subcommand: ${sub}. Type /social for all options.`);
    }
  }

  // ─── NEW: Workflow Commands ───────────────────────────────────────

  async cmdWorkflow(args) {
    const sub = args[0];
    if (!sub) {
      printInfo('Workflow Engine:');
      printInfo('  /workflow create <name>  - Create a multi-step workflow');
      printInfo('  /workflow list           - List saved workflows');
      printInfo('  /workflow run <name>     - Execute a workflow');
      printInfo('  /workflow delete <name>  - Delete a workflow');
      return;
    }

    if (sub === 'create') {
      const name = args[1];
      if (!name) { printError('Usage: /workflow create <name>'); return; }

      printInfo(`Creating workflow "${name}". Enter steps (one prompt per line).`);
      printInfo('Type DONE on a new line when finished.\n');

      const steps = [];
      let stepNum = 1;
      while (true) {
        const line = await this.question(theme.muted(`  Step ${stepNum}: `));
        if (line.trim().toUpperCase() === 'DONE') break;
        if (line.trim()) {
          steps.push({ name: `Step ${stepNum}`, prompt: line.trim(), outputVar: `step${stepNum}` });
          stepNum++;
        }
      }

      if (steps.length === 0) {
        printError('No steps defined. Workflow not created.');
        return;
      }

      const { saveWorkflow } = await import('./workflow/engine.js');
      saveWorkflow(name, `${steps.length}-step workflow`, steps);
      printSuccess(`Workflow "${name}" created with ${steps.length} step(s).`);

    } else if (sub === 'list') {
      const { listWorkflows } = await import('./workflow/engine.js');
      const workflows = listWorkflows();
      if (workflows.length === 0) {
        printInfo('No workflows saved. Create one: /workflow create <name>');
        return;
      }
      console.log(`\n${theme.bold('Saved Workflows:')}\n`);
      for (const w of workflows) {
        console.log(`  ${theme.secondary(w.name)}  ${theme.muted(w.description || '')}  ${theme.muted(`runs: ${w.run_count}`)}`);
      }
      console.log();

    } else if (sub === 'run') {
      const name = args[1];
      if (!name) { printError('Usage: /workflow run <name>'); return; }

      const { getWorkflow, WorkflowEngine } = await import('./workflow/engine.js');
      const workflow = getWorkflow(name);
      if (!workflow) { printError(`Workflow "${name}" not found.`); return; }

      printInfo(`Running workflow "${name}" (${workflow.steps.length} steps)...\n`);
      const engine = new WorkflowEngine(this.manager);
      const result = await engine.run(workflow, {
        onStepStart: (num, total, stepName) => {
          console.log(theme.info(`  [${num}/${total}] ${stepName}...`));
        },
        onStepComplete: (num, stepName, response) => {
          const preview = response.length > 100 ? response.substring(0, 100) + '...' : response;
          console.log(theme.success(`  [${num}] Done: ${preview}\n`));
        },
        onStepError: (num, stepName, error) => {
          console.log(theme.error(`  [${num}] Failed: ${error}\n`));
        },
      });

      if (result.completed) {
        printSuccess(`Workflow "${name}" completed in ${(result.duration / 1000).toFixed(1)}s`);
      } else {
        printError(`Workflow "${name}" failed: ${result.error}`);
      }

    } else if (sub === 'delete') {
      const name = args[1];
      if (!name) { printError('Usage: /workflow delete <name>'); return; }
      const { deleteWorkflow } = await import('./workflow/engine.js');
      deleteWorkflow(name);
      printSuccess(`Deleted workflow "${name}"`);

    } else {
      printError(`Unknown subcommand: ${sub}. Use: create, list, run, delete`);
    }
  }

  // ─── NEW: Schedule Commands ───────────────────────────────────────

  async cmdSchedule(args) {
    const sub = args[0];
    if (!sub) {
      printInfo('Task Scheduler:');
      printInfo('  /schedule add <name> <cron> <prompt>  - Add a scheduled task');
      printInfo('  /schedule list                        - List all scheduled tasks');
      printInfo('  /schedule remove <id>                 - Remove a task');
      printInfo('');
      printInfo('Cron examples: "0 * * * *" (every hour), "*/5 * * * *" (every 5 min), "0 9 * * *" (daily 9am)');
      return;
    }

    if (sub === 'add') {
      const name = args[1];
      const cronExpr = args[2];
      const prompt = args.slice(3).join(' ');

      if (!name || !cronExpr || !prompt) {
        printError('Usage: /schedule add <name> <cron_expression> <prompt>');
        printInfo('Example: /schedule add "disk-check" "0 */6 * * *" "Check disk usage and warn if above 90%"');
        return;
      }

      const { addScheduledTask } = await import('./scheduler/scheduler.js');
      const id = addScheduledTask(name, cronExpr, prompt);
      printSuccess(`Scheduled task "${name}" created (ID: ${id}, cron: ${cronExpr})`);

    } else if (sub === 'list') {
      const { getAllScheduledTasks } = await import('./scheduler/scheduler.js');
      const tasks = getAllScheduledTasks();
      if (tasks.length === 0) {
        printInfo('No scheduled tasks. Add one: /schedule add <name> <cron> <prompt>');
        return;
      }
      console.log(`\n${theme.bold('Scheduled Tasks:')}\n`);
      for (const t of tasks) {
        const status = t.enabled ? theme.success('active') : theme.error('disabled');
        console.log(`  ${theme.muted(`#${t.id}`)} ${theme.secondary(t.name)}  ${theme.muted(t.cron_expression)}  ${status}`);
        console.log(`     ${theme.muted('Prompt:')} ${theme.text(t.prompt.substring(0, 80))}${t.prompt.length > 80 ? '...' : ''}`);
        console.log(`     ${theme.muted(`Runs: ${t.run_count} | Last: ${t.last_run || 'never'}`)}\n`);
      }

    } else if (sub === 'remove') {
      const id = parseInt(args[1]);
      if (isNaN(id)) { printError('Usage: /schedule remove <id>'); return; }
      const { removeScheduledTask } = await import('./scheduler/scheduler.js');
      removeScheduledTask(id);
      printSuccess(`Removed scheduled task #${id}`);

    } else {
      printError(`Unknown subcommand: ${sub}. Use: add, list, remove`);
    }
  }

  // ─── NEW: Template Commands ───────────────────────────────────────

  async cmdTemplate(args) {
    const sub = args[0];
    if (!sub) {
      printInfo('Agent Templates:');
      printInfo('  /template save <name>    - Save current agent as a template');
      printInfo('  /template load <name>    - Create agent from a template');
      printInfo('  /template list           - List all templates');
      printInfo('  /template delete <name>  - Delete a template');
      return;
    }

    if (sub === 'save') {
      const name = args[1];
      if (!name) { printError('Usage: /template save <name>'); return; }
      const agent = this.manager.getActiveAgent();
      if (!agent) { printError('No active agent'); return; }

      const { saveTemplate } = await import('./templates/template-manager.js');
      const desc = await this.question(theme.muted('Description (optional): '));
      saveTemplate(name, agent, desc.trim());
      printSuccess(`Template "${name}" saved from agent "${agent.name}"`);

    } else if (sub === 'load') {
      const name = args[1];
      if (!name) { printError('Usage: /template load <name>'); return; }

      const { loadTemplate } = await import('./templates/template-manager.js');
      const tpl = loadTemplate(name);
      if (!tpl) { printError(`Template "${name}" not found.`); return; }

      const agent = this.manager.createAgent({
        name: `${tpl.role} (${name})`,
        role: tpl.role,
        model: tpl.model,
        customPrompt: tpl.system_prompt,
        tools: tpl.allowed_tools.length > 0 ? tpl.allowed_tools : null,
        allowedFolders: tpl.allowed_folders,
      });
      printSuccess(`Agent "${agent.name}" created from template "${name}"`);

    } else if (sub === 'list') {
      const { listTemplates } = await import('./templates/template-manager.js');
      const templates = listTemplates();
      if (templates.length === 0) {
        printInfo('No templates saved. Save one: /template save <name>');
        return;
      }
      console.log(`\n${theme.bold('Agent Templates:')}\n`);
      for (const t of templates) {
        console.log(`  ${theme.secondary(t.name)}  ${theme.muted(`role: ${t.role}`)}  ${theme.muted(`model: ${t.model || 'default'}`)}  ${theme.text(t.description || '')}`);
      }
      console.log();

    } else if (sub === 'delete') {
      const name = args[1];
      if (!name) { printError('Usage: /template delete <name>'); return; }
      try {
        const { deleteTemplate } = await import('./templates/template-manager.js');
        deleteTemplate(name);
        printSuccess(`Deleted template "${name}"`);
      } catch (err) {
        printError(err.message);
      }
    } else {
      printError(`Unknown subcommand: ${sub}. Use: save, load, list, delete`);
    }
  }

  // ─── NEW: Screenshot Command ──────────────────────────────────────

  async cmdScreenshot() {
    printInfo('Taking screenshot...');
    try {
      const { visionTools } = await import('./tools/vision-tools.js');
      const screenshotTool = visionTools.find(t => t.declaration.name === 'take_screenshot');
      const result = await screenshotTool.execute({});
      printSuccess(result);
    } catch (err) {
      printError(`Screenshot failed: ${err.message}`);
    }
  }

  // ─── NEW: Export/Import Commands ──────────────────────────────────

  async cmdExport(args) {
    const outputPath = args[0] || `gimi-backup-${Date.now()}.json`;
    printInfo(`Exporting data to ${outputPath}...`);
    try {
      const { exportAll } = await import('./utils/export-import.js');
      const stats = await exportAll(outputPath);
      printSuccess(`Exported to ${stats.path}`);
      printInfo(`  Agents: ${stats.agents} | Memories: ${stats.memories} | Templates: ${stats.templates} | Workflows: ${stats.workflows}`);
    } catch (err) {
      printError(`Export failed: ${err.message}`);
    }
  }

  async cmdImport(args) {
    const inputPath = args[0];
    if (!inputPath) { printError('Usage: /import <filepath>'); return; }
    printInfo(`Importing data from ${inputPath}...`);
    try {
      const { importAll } = await import('./utils/export-import.js');
      const counts = await importAll(inputPath);
      printSuccess(`Imported: ${counts.agents} agents, ${counts.memory} memories, ${counts.templates || 0} templates`);
    } catch (err) {
      printError(`Import failed: ${err.message}`);
    }
  }

  // ─── NEW: Clipboard Command ───────────────────────────────────────

  async cmdClipboard(args) {
    try {
      const { clipboardTools } = await import('./tools/clipboard-tools.js');
      if (args[0] === 'write' || args[0] === 'copy') {
        const text = args.slice(1).join(' ');
        if (!text) { printError('Usage: /clip copy <text>'); return; }
        const result = await clipboardTools[1].execute({ text });
        printSuccess(result);
      } else {
        const result = await clipboardTools[0].execute();
        console.log(`\n${theme.bold('Clipboard:')}\n${theme.text(result)}\n`);
      }
    } catch (err) {
      printError(`Clipboard error: ${err.message}`);
    }
  }

  // ─── NEW: Notify Command ──────────────────────────────────────────

  async cmdNotify(args) {
    const message = args.join(' ') || 'Task completed!';
    try {
      const { notificationTools } = await import('./tools/notification-tools.js');
      const result = await notificationTools[0].execute({ title: 'GimiCoworker', message });
      printSuccess(result);
    } catch (err) {
      printError(`Notification error: ${err.message}`);
    }
  }

  // ─── Message Handling ─────────────────────────────────────────────

  async handleMessage(message) {
    const agent = this.manager.getActiveAgent();
    if (!agent) { printError('No active agent. Create one with /create'); return; }

    this._isProcessing = true;

    this.spinner = ora({
      text: theme.muted('Thinking...'),
      spinner: 'dots12',
      color: 'magenta',
      discardStdin: false,
    }).start();

    try {
      const response = await agent.send(message, {
        onThinking: (text) => {
          if (this.spinner && this._isProcessing) this.spinner.text = theme.muted(text);
        },
        onToolCall: (name, args) => {
          if (this.spinner) this.spinner.stop();
          printToolExecution(name, args);
          if (this._isProcessing) {
            this.spinner = ora({
              text: theme.muted('Processing...'),
              spinner: 'dots12',
              color: 'magenta',
              discardStdin: false,
            }).start();
          }
        },
      });

      if (this.spinner) this.spinner.stop();
      this._isProcessing = false;

      // Render markdown in agent responses
      const header = theme.agent(`\n\u276F ${agent.name}`);
      console.log(header);
      console.log(renderMarkdown(response));
      console.log();
    } catch (err) {
      if (this.spinner) this.spinner.stop();
      this._isProcessing = false;
      printError(err.message);

      if (err.message.includes('API') || err.message.includes('key') || err.message.includes('401')) {
        printWarning('Check your API key with /config');
      }
    }
  }

  question(prompt) {
    return new Promise((resolve, reject) => {
      if (!this.running) return reject(new Error('CLI closed'));

      const onClose = () => reject(new Error('Input stream closed'));
      this.rl.once('close', onClose);

      this.rl.question(prompt, (answer) => {
        this.rl.removeListener('close', onClose);
        resolve(answer);
      });
    });
  }

  async exit() {
    this.running = false;
    printInfo('Saving agents...');
    await this.manager.saveState();

    // Kill all running shell commands immediately
    const procCount = getActiveProcessCount();
    if (procCount > 0) {
      printInfo(`Killing ${procCount} running process(es)...`);
    }
    killAllProcesses();

    // Stop social media watchers if running
    try {
      const { whatsappClient } = await import('./social/whatsapp.js');
      whatsappClient.stopWatching();
    } catch {}
    try {
      const { instagramClient } = await import('./social/instagram.js');
      instagramClient.stopDMWatch();
    } catch {}

    // Close any open social media browsers
    try {
      const { browserManager } = await import('./social/browser-manager.js');
      const platforms = browserManager.getActivePlatforms();
      if (platforms.length > 0) {
        printInfo(`Closing ${platforms.length} browser session(s)...`);
        await browserManager.closeAll();
      }
    } catch {}

    printSuccess('Goodbye!');
    if (this.rl) this.rl.close();
    process.exit(0);
  }
}
