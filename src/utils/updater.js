import { execSync } from 'child_process';
import chalk from 'chalk';

const PACKAGE_NAME = 'gimicoworker';

/**
 * Get the latest version from npm registry
 */
async function getLatestVersion() {
  try {
    const resp = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.version || null;
  } catch {
    return null;
  }
}

/**
 * Compare semver versions. Returns true if latest > current
 */
function isNewer(current, latest) {
  if (!current || !latest) return false;
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

/**
 * Check for updates silently on startup - shows banner if update available
 */
export async function checkForUpdates(currentVersion) {
  try {
    const latest = await getLatestVersion();
    if (!latest || !isNewer(currentVersion, latest)) return;

    console.log();
    console.log(chalk.yellow(`  Update available: ${chalk.gray(currentVersion)} → ${chalk.green(latest)}`));
    console.log(chalk.gray(`  Run: ${chalk.cyan('gimi update')} or ${chalk.cyan(`npm install -g ${PACKAGE_NAME}@latest`)}`));
    console.log();
  } catch {
    // Silent fail - never disrupt the user's session
  }
}

/**
 * Perform the update (called by `gimi update`)
 */
export async function performUpdate() {
  // First check if there's actually an update
  const latest = await getLatestVersion();

  if (!latest) {
    console.log(chalk.yellow('\n  Could not check npm registry. Try again later.\n'));
    return false;
  }

  // Read current version from package
  let currentVersion;
  try {
    const result = execSync(`npm list -g ${PACKAGE_NAME} --json --depth=0 2>/dev/null`, { encoding: 'utf-8' });
    const pkg = JSON.parse(result);
    currentVersion = pkg.dependencies?.[PACKAGE_NAME]?.version;
  } catch {
    currentVersion = null;
  }

  if (currentVersion && !isNewer(currentVersion, latest)) {
    console.log(chalk.green(`\n  Already on the latest version (${currentVersion})!\n`));
    return true;
  }

  console.log(chalk.cyan(`\n  Updating ${PACKAGE_NAME}${currentVersion ? ` ${currentVersion} → ${latest}` : ` to ${latest}`}...\n`));

  try {
    execSync(`npm install -g ${PACKAGE_NAME}@latest`, { stdio: 'inherit' });
    console.log(chalk.green(`\n  Updated to v${latest}! Restart with: gimi\n`));
    return true;
  } catch (err) {
    console.log(chalk.red(`\n  Update failed. Try manually:`));
    console.log(chalk.cyan(`  npm install -g ${PACKAGE_NAME}@latest\n`));
    return false;
  }
}
