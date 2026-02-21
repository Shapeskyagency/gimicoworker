import chalk from 'chalk';

/**
 * Render markdown text for terminal display using chalk styling.
 */
export function renderMarkdown(text) {
  if (!text) return '';

  return text
    // Fenced code blocks: ```lang\ncode\n```
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const header = lang ? chalk.gray(`  [${ lang }]`) : '';
      const formatted = code
        .split('\n')
        .map(l => `  ${chalk.green(l)}`)
        .join('\n');
      return `${header}\n${chalk.gray('  ┌─')}\n${formatted}\n${chalk.gray('  └─')}`;
    })
    // Inline code: `code`
    .replace(/`([^`]+)`/g, (_, code) => chalk.cyan(code))
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t))
    // Italic: *text* (not preceded/followed by *)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_, t) => chalk.italic(t))
    // H1: # text
    .replace(/^# (.+)$/gm, (_, t) => chalk.bold.underline(t))
    // H2: ## text
    .replace(/^## (.+)$/gm, (_, t) => chalk.bold(t))
    // H3: ### text
    .replace(/^### (.+)$/gm, (_, t) => chalk.bold.gray(t))
    // Bullet lists: - or *
    .replace(/^(\s*)[*-] (.+)$/gm, (_, indent, t) => `${indent}  ${chalk.gray('\u2022')} ${t}`)
    // Numbered lists: 1. text
    .replace(/^(\s*)(\d+)\. (.+)$/gm, (_, indent, num, t) => `${indent}  ${chalk.gray(num + '.')} ${t}`)
    // Horizontal rules
    .replace(/^---+$/gm, chalk.gray('\u2500'.repeat(50)))
    // Blockquotes: > text
    .replace(/^>\s?(.+)$/gm, (_, t) => `  ${chalk.gray('\u2502')} ${chalk.italic.gray(t)}`);
}
