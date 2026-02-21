import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import figures from 'figures';
import gradient from 'gradient-string';

// ─── Color Theme ───────────────────────────────────────────────────

const theme = {
  primary: chalk.hex('#7C3AED'),
  secondary: chalk.hex('#06B6D4'),
  success: chalk.hex('#10B981'),
  warning: chalk.hex('#F59E0B'),
  error: chalk.hex('#EF4444'),
  info: chalk.hex('#3B82F6'),
  muted: chalk.hex('#6B7280'),
  agent: chalk.hex('#8B5CF6'),
  user: chalk.hex('#06B6D4'),
  tool: chalk.hex('#F59E0B'),
  text: chalk.hex('#E5E7EB'),
  bold: chalk.bold.hex('#FFFFFF'),
};

const g = gradient(['#7C3AED', '#06B6D4', '#10B981']);

// ─── Banner ────────────────────────────────────────────────────────

export function printBanner(providerName, model) {
  const banner = g.multiline(`
   ██████╗ ██╗███╗   ███╗██╗
  ██╔════╝ ██║████╗ ████║██║
  ██║  ███╗██║██╔████╔██║██║
  ██║   ██║██║██║╚██╔╝██║██║
  ╚██████╔╝██║██║ ╚═╝ ██║██║
   ╚═════╝ ╚═╝╚═╝     ╚═╝╚═╝
  `);

  console.log(banner);

  const tagline = `${theme.bold('GimiCoworker')} ${theme.muted('v1.0.0')}  ${theme.muted('│')}  ${theme.secondary('Multi-AI Agent OS Control')}`;
  const providerLine = providerName
    ? `  ${theme.muted('Provider:')} ${theme.primary(providerName)}  ${theme.muted('│')}  ${theme.muted('Model:')} ${theme.secondary(model || 'default')}`
    : '';

  console.log(`  ${tagline}`);
  if (providerLine) console.log(providerLine);
  console.log(theme.muted('  ─'.repeat(30)));
  console.log();
}

// ─── Messages ──────────────────────────────────────────────────────

export function printAgentMessage(agentName, message) {
  const header = theme.agent(`${figures.pointer} ${agentName}`);
  console.log(`\n${header}`);
  console.log(theme.text(message));
  console.log();
}

export function printUserMessage(message) {
  console.log(`\n${theme.user(`${figures.arrowRight} You`)}: ${theme.text(message)}\n`);
}

export function printToolExecution(toolName, args) {
  const argsStr = Object.entries(args || {})
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => {
      const val = typeof v === 'string' && v.length > 60 ? v.substring(0, 60) + '...' : v;
      return `${theme.muted(k)}=${theme.text(String(val))}`;
    })
    .join(' ');
  console.log(`  ${theme.tool(`${figures.play} ${toolName}`)} ${argsStr}`);
}

export function printError(message) {
  console.log(`\n${theme.error(`${figures.cross} Error`)}: ${message}\n`);
}

export function printSuccess(message) {
  console.log(`${theme.success(`${figures.tick} ${message}`)}`);
}

export function printInfo(message) {
  console.log(`${theme.info(`${figures.info} ${message}`)}`);
}

export function printWarning(message) {
  console.log(`${theme.warning(`${figures.warning} ${message}`)}`);
}

// ─── Agent Table ───────────────────────────────────────────────────

export function printAgentList(agents, activeId) {
  const table = new Table({
    head: [
      theme.bold(''),
      theme.bold('ID'),
      theme.bold('Name'),
      theme.bold('Role'),
      theme.bold('Model'),
      theme.bold('Provider'),
      theme.bold('Status'),
      theme.bold('Msgs'),
    ],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
  });

  for (const agent of agents) {
    const isActive = agent.id === activeId;
    const marker = isActive ? theme.success(figures.radioOn) : theme.muted(figures.radioOff);
    const statusColor = {
      idle: theme.success,
      thinking: theme.info,
      executing: theme.warning,
      error: theme.error,
    }[agent.status] || theme.muted;

    table.push([
      marker,
      theme.muted(agent.id),
      isActive ? theme.bold(agent.name) : theme.text(agent.name),
      theme.secondary(agent.role),
      theme.muted(agent.model),
      theme.primary(agent.provider || 'gemini'),
      statusColor(agent.status),
      theme.text(String(agent.stats.messages)),
    ]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}

// ─── Tools Table ───────────────────────────────────────────────────

export function printToolList(tools) {
  const table = new Table({
    head: [theme.bold('Tool'), theme.bold('Description')],
    style: { head: [], border: ['gray'] },
    colWidths: [25, 70],
    wordWrap: true,
  });

  for (const tool of tools) {
    table.push([theme.secondary(tool.name), theme.muted(tool.description)]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}

// ─── Help ──────────────────────────────────────────────────────────

export function printHelp() {
  const help = `
${theme.bold('Agent Management:')}

  ${theme.secondary('/create')}  ${theme.muted('<role> [name]')}     Create a new agent
  ${theme.secondary('/list')}                       List all agents
  ${theme.secondary('/switch')}  ${theme.muted('<id>')}              Switch active agent
  ${theme.secondary('/remove')}  ${theme.muted('<id>')}              Remove an agent
  ${theme.secondary('/rename')}  ${theme.muted('<name>')}            Rename active agent
  ${theme.secondary('/restrict')} ${theme.muted('<folders...>')}     Restrict agent to specific folders
  ${theme.secondary('/reset')}                      Reset active agent's conversation
  ${theme.secondary('/collab')}  ${theme.muted('<task>')}            Multi-agent collaboration

${theme.bold('Social Media:')}

  ${theme.secondary('/social')}  ${theme.muted('whatsapp')}          Connect to WhatsApp Web
  ${theme.secondary('/social')}  ${theme.muted('instagram')}         Connect to Instagram
  ${theme.secondary('/social')}  ${theme.muted('status')}            Show connection status

${theme.bold('Automation:')}

  ${theme.secondary('/workflow')} ${theme.muted('create|list|run')}  Multi-step automated pipelines
  ${theme.secondary('/schedule')} ${theme.muted('add|list|remove')}  Cron-based recurring tasks
  ${theme.secondary('/template')} ${theme.muted('save|load|list')}   Reusable agent configurations

${theme.bold('Tools & Skills:')}

  ${theme.secondary('/tools')}                      List available tools
  ${theme.secondary('/skill')}   ${theme.muted('<name>')}            Load a skill
  ${theme.secondary('/skills')}                     List installed skills
  ${theme.secondary('/screenshot')}                 Capture screen
  ${theme.secondary('/clip')}                       Read clipboard
  ${theme.secondary('/notify')}  ${theme.muted('<message>')}         Desktop notification

${theme.bold('Data & Settings:')}

  ${theme.secondary('/export')}  ${theme.muted('<path>')}            Export all data to JSON
  ${theme.secondary('/import')}  ${theme.muted('<path>')}            Import data from backup
  ${theme.secondary('/model')}   ${theme.muted('<model>')}           Change AI model
  ${theme.secondary('/config')}                     Open config menu
  ${theme.secondary('/status')}                     Show system status
  ${theme.secondary('/history')}                    Conversation history
  ${theme.secondary('/clear')}                      Clear the screen
  ${theme.secondary('/help')}                       This help message
  ${theme.secondary('/exit')}                       Exit

${theme.bold('Agent Roles:')}

  ${theme.secondary('general')}      General-purpose assistant
  ${theme.secondary('devops')}       DevOps & infrastructure
  ${theme.secondary('security')}     Security analysis
  ${theme.secondary('filemanager')}  File management
  ${theme.secondary('coder')}        Software development
  ${theme.secondary('sysadmin')}     System administration
  ${theme.secondary('researcher')}   Research & analysis
  ${theme.secondary('social')}       ${theme.primary('WhatsApp & Instagram manager')}
  ${theme.secondary('custom')}       Custom role (your own prompt)

${theme.bold('Tips:')}

  ${theme.muted(figures.bullet)} Type naturally to talk to the active agent
  ${theme.muted(figures.bullet)} Use ${theme.secondary('"""')} or ${theme.secondary('\`\`\`')} for multi-line input
  ${theme.muted(figures.bullet)} Tab key auto-completes commands & arguments
  ${theme.muted(figures.bullet)} Ctrl+C cancels current operation, double Ctrl+C exits
  ${theme.muted(figures.bullet)} Agent responses render with markdown formatting
  ${theme.muted(figures.bullet)} Agents have 40+ tools (OS, social, scraping, vision, clipboard)
`;
  console.log(help);
}

// ─── Status Box ────────────────────────────────────────────────────

export function printStatus(agentManager) {
  const agents = agentManager.listAgents();
  const active = agentManager.getActiveAgent();

  const content = `${theme.bold('Provider:')}     ${agentManager.providerName}
${theme.bold('Active Agent:')} ${active ? active.name : 'None'}
${theme.bold('Agent Count:')}  ${agents.length}
${theme.bold('Total Msgs:')}   ${agents.reduce((s, a) => s + a.stats.messages, 0)}
${theme.bold('Total Tools:')}  ${agents.reduce((s, a) => s + a.stats.toolCalls, 0)}
${theme.bold('Errors:')}       ${agents.reduce((s, a) => s + a.stats.errors, 0)}`;

  console.log();
  console.log(boxen(content, {
    title: 'GimiCoworker Status',
    titleAlignment: 'center',
    padding: 1,
    borderStyle: 'round',
    borderColor: '#7C3AED',
  }));
  console.log();
}

// ─── Collaboration UI ─────────────────────────────────────────────

export function printCollabHeader(task, planner, executor, maxRounds) {
  const line = theme.primary('═'.repeat(54));
  console.log(`\n  ${line}`);
  console.log(`  ${theme.bold('COLLABORATION STARTED')}`);
  console.log(`  ${theme.muted('Task:')} ${theme.text(task.length > 80 ? task.substring(0, 80) + '...' : task)}`);
  console.log(`  ${theme.muted('Planner:')} ${theme.agent(planner.name)} ${theme.muted(`(${planner.role})`)}  ${theme.muted('|')}  ${theme.muted('Executor:')} ${theme.secondary(executor.name)} ${theme.muted(`(${executor.role})`)}`);
  console.log(`  ${theme.muted('Max rounds:')} ${theme.text(String(maxRounds))}`);
  console.log(`  ${line}\n`);
}

export function printCollabRound(round, maxRounds, agentName, role) {
  const roleIcon = role === 'planner' ? figures.pointer : figures.play;
  const roleColor = role === 'planner' ? theme.agent : theme.secondary;
  const label = `Round ${round}/${maxRounds}`;
  const agentLabel = `${role === 'planner' ? 'Planner' : 'Executor'}: ${agentName}`;
  const pad = Math.max(0, 30 - agentLabel.length);
  console.log(`\n  ${theme.muted('──')} ${theme.bold(label)} ${theme.muted('──')} ${roleColor(`${roleIcon} ${agentLabel}`)} ${theme.muted('─'.repeat(pad))}`);
}

export function printCollabFooter(rounds, maxRounds, completed) {
  const line = theme.primary('═'.repeat(54));
  const status = completed
    ? theme.success('Completed: Yes')
    : theme.warning('Completed: No (max rounds reached)');
  console.log(`\n  ${line}`);
  console.log(`  ${theme.bold('COLLABORATION ' + (completed ? 'COMPLETE' : 'ENDED'))}`);
  console.log(`  ${theme.muted('Rounds:')} ${theme.text(`${rounds}/${maxRounds}`)}  ${theme.muted('|')}  ${status}`);
  console.log(`  ${line}\n`);
}

// ─── Prompt ────────────────────────────────────────────────────────

export function getPromptPrefix(agentName) {
  return `${theme.agent(agentName)} ${theme.muted('>')} `;
}

export { theme };
