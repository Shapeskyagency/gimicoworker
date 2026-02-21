import ora from 'ora';
import {
  printCollabHeader,
  printCollabRound,
  printCollabFooter,
  printAgentMessage,
  printToolExecution,
  printError,
  printWarning,
  theme,
} from '../ui/terminal.js';

const DEFAULT_MAX_ROUNDS = 6;

// Priority for planner role (lower = more planner-like)
const PLANNER_PRIORITY = {
  researcher: 1,
  general: 2,
  security: 3,
  sysadmin: 4,
  devops: 5,
  filemanager: 6,
  coder: 7,
  custom: 8,
};

export function assignRoles(agents) {
  const sorted = [...agents].sort((a, b) => {
    const pa = PLANNER_PRIORITY[a.role] || 99;
    const pb = PLANNER_PRIORITY[b.role] || 99;
    return pa - pb;
  });
  return { planner: sorted[0], executor: sorted[1] };
}

function isCollabDone(response) {
  return response.includes('COLLAB_DONE');
}

function buildPlannerInitialMessage(task, executorName, executorRole) {
  return `[COLLABORATION TASK — YOU ARE THE PLANNER]

You are the PLANNER in a multi-agent collaboration.
Your partner "${executorName}" (role: ${executorRole}) will do ALL the execution.

IMPORTANT: You have NO tools. You CANNOT execute commands, create files, or run anything.
Your ONLY job is to produce a detailed, step-by-step TEXT plan that "${executorName}" will follow.

TASK: ${task}

Write a clear, actionable plan with:
- Exact file paths and names to create
- Exact file contents (full code, not summaries)
- Exact commands to run (npm install, etc.)
- Expected project structure
- The order of operations

Be thorough — "${executorName}" will follow your plan literally.`;
}

function buildExecutorMessage(plannerResponse, plannerName) {
  return `[COLLABORATION — Instructions from ${plannerName}]

${plannerResponse}

Execute these instructions now using your tools. Create the files, run the commands, and set everything up exactly as described.
When finished, report what you accomplished: files created, commands run, and any issues encountered.`;
}

function buildPlannerReviewMessage(executorResponse, executorName, round, maxRounds) {
  return `[COLLABORATION — Report from ${executorName} (round ${round}/${maxRounds})]

${executorResponse}

Review the executor's report above. You have two options:

1. If the work is COMPLETE and satisfactory, respond with exactly "COLLAB_DONE" on its own line, followed by a brief summary of what was built.
2. If more work is needed, provide the NEXT set of detailed instructions for ${executorName} — include exact file contents and commands. Do NOT repeat work that's already done.`;
}

/**
 * Send a message to an agent with spinner and tool call output.
 */
async function sendToAgent(agent, message, consecutiveErrors) {
  let spinner = ora({
    text: theme.muted(`${agent.name} is thinking...`),
    spinner: 'dots12',
    color: 'magenta',
    discardStdin: false,
  }).start();

  try {
    const response = await agent.send(message, {
      onThinking: (text) => {
        if (spinner) spinner.text = theme.muted(text);
      },
      onToolCall: (name, args) => {
        if (spinner) spinner.stop();
        printToolExecution(name, args);
        spinner = ora({
          text: theme.muted(`${agent.name} is processing...`),
          spinner: 'dots12',
          color: 'magenta',
          discardStdin: false,
        }).start();
      },
    });

    if (spinner) spinner.stop();
    return { response, errors: 0 };
  } catch (err) {
    if (spinner) spinner.stop();
    printError(`Agent "${agent.name}" failed: ${err.message}`);
    return {
      response: `[Error occurred: ${err.message}. Please adapt and continue.]`,
      errors: consecutiveErrors + 1,
    };
  }
}

/**
 * Strip all tools from an agent so it can only produce text responses.
 * Returns a restore function to call when done.
 */
function stripAgentTools(agent) {
  const savedAllowedTools = agent._allowedTools;
  const savedChat = agent.chat;

  // Set to empty array — getTools() returns [] when _allowedTools is truthy
  agent._allowedTools = [];
  // Force chat re-init without tools on next send()
  agent.chat = null;

  return () => {
    agent._allowedTools = savedAllowedTools;
    agent.chat = null; // force re-init to restore tools
  };
}

/**
 * Run an autonomous collaboration between two agents.
 * The planner has NO tools (text-only planning).
 * The executor has ALL tools (full execution access).
 */
export async function runCollaboration({ task, planner, executor, maxRounds = DEFAULT_MAX_ROUNDS }) {
  // Strip tools from planner — it must only produce text plans, never execute
  const restorePlannerTools = stripAgentTools(planner);

  try {
    printCollabHeader(task, planner, executor, maxRounds);

    const responses = [];
    let round = 0;
    let completed = false;
    let consecutiveErrors = 0;

    // Round 1: Planner creates initial plan (no tools, text only)
    round++;
    printCollabRound(round, maxRounds, planner.name, 'planner');

    let result = await sendToAgent(
      planner,
      buildPlannerInitialMessage(task, executor.name, executor.role),
      consecutiveErrors
    );
    consecutiveErrors = result.errors;
    let plannerResponse = result.response;

    printAgentMessage(planner.name, plannerResponse);
    responses.push({ round, agent: planner.name, role: 'planner', content: plannerResponse });

    if (consecutiveErrors >= 2) {
      printError('Too many consecutive failures. Aborting collaboration.');
      printCollabFooter(round, maxRounds, false);
      return { rounds: round, completed: false, responses };
    }

    if (isCollabDone(plannerResponse)) {
      completed = true;
      printCollabFooter(round, maxRounds, completed);
      return { rounds: round, completed, responses };
    }

    // Alternating loop: executor works (with tools), planner reviews (text only)
    while (round < maxRounds) {
      // Executor turn — has full tool access
      round++;
      printCollabRound(round, maxRounds, executor.name, 'executor');

      result = await sendToAgent(
        executor,
        buildExecutorMessage(plannerResponse, planner.name),
        consecutiveErrors
      );
      consecutiveErrors = result.errors;
      const executorResponse = result.response;

      printAgentMessage(executor.name, executorResponse);
      responses.push({ round, agent: executor.name, role: 'executor', content: executorResponse });

      if (consecutiveErrors >= 2) {
        printError('Too many consecutive failures. Aborting collaboration.');
        break;
      }

      // Check round limit before planner review
      if (round >= maxRounds) {
        printWarning('Maximum rounds reached.');
        break;
      }

      // Planner review turn — no tools, text only
      round++;
      printCollabRound(round, maxRounds, planner.name, 'planner');

      result = await sendToAgent(
        planner,
        buildPlannerReviewMessage(executorResponse, executor.name, round, maxRounds),
        consecutiveErrors
      );
      consecutiveErrors = result.errors;
      plannerResponse = result.response;

      printAgentMessage(planner.name, plannerResponse);
      responses.push({ round, agent: planner.name, role: 'planner', content: plannerResponse });

      if (consecutiveErrors >= 2) {
        printError('Too many consecutive failures. Aborting collaboration.');
        break;
      }

      if (isCollabDone(plannerResponse)) {
        completed = true;
        break;
      }
    }

    printCollabFooter(round, maxRounds, completed);
    return { rounds: round, completed, responses };
  } finally {
    // Always restore planner's tools so it works normally after collaboration
    restorePlannerTools();
  }
}