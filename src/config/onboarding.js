import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import { PROVIDERS } from '../providers/index.js';
import { configManager } from './config-manager.js';

const g = gradient(['#7C3AED', '#06B6D4', '#10B981']);

export async function runOnboarding() {
  console.clear();

  // Welcome banner
  const banner = g.multiline(`
   ██████╗ ██╗███╗   ███╗██╗
  ██╔════╝ ██║████╗ ████║██║
  ██║  ███╗██║██╔████╔██║██║
  ██║   ██║██║██║╚██╔╝██║██║
  ╚██████╔╝██║██║ ╚═╝ ██║██║
   ╚═════╝ ╚═╝╚═╝     ╚═╝╚═╝
  `);

  console.log(banner);
  console.log(boxen(
    chalk.bold.white('Welcome to GimiCoworker!') + '\n\n' +
    chalk.gray('Multi-AI Agent OS Control System\n') +
    chalk.gray('Build unlimited AI agents that can control your computer.'),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: '#7C3AED',
      textAlignment: 'center',
    }
  ));
  console.log();

  // Step 1: Choose AI Provider
  console.log(chalk.bold.hex('#7C3AED')('  Step 1: Choose your AI Provider\n'));

  const providerChoices = Object.entries(PROVIDERS).map(([key, info]) => ({
    name: `${chalk.bold(info.name)} ${chalk.gray('- ' + info.description)}`,
    value: key,
  }));

  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: 'Which AI provider do you want to use?',
    choices: providerChoices,
    pageSize: 10,
  }]);

  configManager.setProvider(provider);
  const providerInfo = PROVIDERS[provider];

  // Step 2: API Key
  if (!providerInfo.noKey) {
    console.log();
    console.log(chalk.bold.hex('#06B6D4')('  Step 2: Enter your API Key\n'));

    // Check if key exists in env
    const envKey = providerInfo.envKey ? process.env[providerInfo.envKey] : null;
    if (envKey) {
      console.log(chalk.green(`  Found ${providerInfo.envKey} in environment!`));
      const { useEnv } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useEnv',
        message: `Use the ${providerInfo.envKey} from your environment?`,
        default: true,
      }]);

      if (useEnv) {
        configManager.setApiKey(provider, envKey);
      } else {
        await promptApiKey(provider, providerInfo);
      }
    } else {
      await promptApiKey(provider, providerInfo);
    }
  } else {
    // Local AI - ask for URL
    console.log();
    console.log(chalk.bold.hex('#06B6D4')('  Step 2: Configure Local AI\n'));
    console.log(chalk.gray(`  Make sure Ollama is running: ${chalk.cyan('ollama serve')}`));
    console.log();

    const { localUrl } = await inquirer.prompt([{
      type: 'input',
      name: 'localUrl',
      message: 'Ollama API URL:',
      default: 'http://localhost:11434/v1',
    }]);

    configManager.setLocalAIUrl(localUrl);
  }

  // Step 3: Choose default model
  console.log();
  console.log(chalk.bold.hex('#10B981')('  Step 3: Choose default model\n'));

  const modelChoices = providerInfo.models.map(m => ({
    name: m === providerInfo.defaultModel ? `${m} ${chalk.green('(recommended)')}` : m,
    value: m,
  }));

  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: 'Select default AI model:',
    choices: modelChoices,
    default: providerInfo.defaultModel,
  }]);

  configManager.setDefaultModel(model);

  // Step 4: Optional Telegram
  console.log();
  const { setupTelegram } = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupTelegram',
    message: 'Set up Telegram bot integration? (optional)',
    default: false,
  }]);

  if (setupTelegram) {
    const { tgToken } = await inquirer.prompt([{
      type: 'password',
      name: 'tgToken',
      message: 'Enter Telegram Bot Token (from @BotFather):',
      mask: '*',
    }]);
    if (tgToken.trim()) {
      configManager.setTelegramToken(tgToken.trim());
    }
  }

  // Done!
  configManager.completeSetup();

  console.log();
  console.log(boxen(
    chalk.green.bold('Setup Complete!') + '\n\n' +
    `${chalk.gray('Provider:')} ${chalk.bold(providerInfo.name)}\n` +
    `${chalk.gray('Model:')}    ${chalk.bold(model)}\n` +
    `${chalk.gray('Config:')}   ${chalk.gray(configManager.getPath())}\n\n` +
    chalk.hex('#7C3AED')('Run ') + chalk.bold('gimi') + chalk.hex('#7C3AED')(' to start!'),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: '#10B981',
      textAlignment: 'center',
    }
  ));
  console.log();
}

async function promptApiKey(provider, providerInfo) {
  console.log(chalk.gray(`  Get your API key at: ${chalk.cyan(providerInfo.keyUrl)}`));
  console.log();

  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: `Enter your ${providerInfo.name} API key:`,
    mask: '*',
    validate: (input) => input.trim().length > 0 ? true : 'API key is required',
  }]);

  configManager.setApiKey(provider, apiKey.trim());
  console.log(chalk.green('  API key saved securely!'));
}

/**
 * Quick setup to change provider/key without full onboarding
 */
export async function runConfigMenu() {
  const config = configManager.getAll();

  console.log();
  console.log(boxen(
    chalk.bold('Current Configuration') + '\n\n' +
    `${chalk.gray('Provider:')}  ${chalk.bold(PROVIDERS[config.provider]?.name || 'Not set')}\n` +
    `${chalk.gray('Model:')}     ${chalk.bold(config.defaultModel || 'Not set')}\n` +
    `${chalk.gray('Telegram:')}  ${config.hasTelegram ? chalk.green('Configured') : chalk.gray('Not set')}\n` +
    `${chalk.gray('Config at:')} ${chalk.gray(configManager.getPath())}`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: '#7C3AED',
    }
  ));
  console.log();

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: `${chalk.bold('Change AI Provider')}`, value: 'provider' },
      { name: `${chalk.bold('Update API Key')}`, value: 'apikey' },
      { name: `${chalk.bold('Change Default Model')}`, value: 'model' },
      { name: `${chalk.bold('Setup Telegram')}`, value: 'telegram' },
      { name: `${chalk.red('Reset All Config')}`, value: 'reset' },
      { name: `${chalk.gray('Back')}`, value: 'back' },
    ],
  }]);

  switch (action) {
    case 'provider': {
      const providerChoices = Object.entries(PROVIDERS).map(([key, info]) => ({
        name: `${chalk.bold(info.name)} ${chalk.gray('- ' + info.description)}`,
        value: key,
      }));
      const { provider } = await inquirer.prompt([{
        type: 'list',
        name: 'provider',
        message: 'Select new provider:',
        choices: providerChoices,
      }]);
      configManager.setProvider(provider);

      const info = PROVIDERS[provider];
      if (!info.noKey) {
        await promptApiKey(provider, info);
      }
      configManager.setDefaultModel(info.defaultModel);
      console.log(chalk.green(`\n  Switched to ${info.name}!\n`));
      break;
    }

    case 'apikey': {
      const provider = configManager.getProvider();
      const info = PROVIDERS[provider];
      if (info?.noKey) {
        console.log(chalk.gray('\n  Local AI doesn\'t need an API key.\n'));
      } else if (info) {
        await promptApiKey(provider, info);
        console.log(chalk.green('\n  API key updated!\n'));
      }
      break;
    }

    case 'model': {
      const provider = configManager.getProvider();
      const info = PROVIDERS[provider];
      if (info) {
        const { model } = await inquirer.prompt([{
          type: 'list',
          name: 'model',
          message: 'Select model:',
          choices: info.models,
          default: configManager.getDefaultModel(),
        }]);
        configManager.setDefaultModel(model);
        console.log(chalk.green(`\n  Model set to ${model}!\n`));
      }
      break;
    }

    case 'telegram': {
      const { tgToken } = await inquirer.prompt([{
        type: 'password',
        name: 'tgToken',
        message: 'Telegram Bot Token:',
        mask: '*',
      }]);
      if (tgToken.trim()) {
        configManager.setTelegramToken(tgToken.trim());
        console.log(chalk.green('\n  Telegram token saved!\n'));
      }
      break;
    }

    case 'reset': {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: chalk.red('This will erase all settings. Continue?'),
        default: false,
      }]);
      if (confirm) {
        configManager.reset();
        console.log(chalk.yellow('\n  Config reset. Run `gimi` to set up again.\n'));
      }
      break;
    }
  }
}
