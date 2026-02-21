import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

const SKILLS_DIR = path.join(os.homedir(), '.gimicoworker', 'skills');
const SKILLS_REPO = 'https://api.github.com/repos/openclaw/skills/contents/skills';

// Ensure skills directory exists
function ensureDir() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

/**
 * List all locally installed skills
 */
export function listSkills() {
  ensureDir();
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Each skill folder may have sub-skills
    const skillPath = path.join(SKILLS_DIR, entry.name);
    const subEntries = fs.readdirSync(skillPath, { withFileTypes: true });

    for (const sub of subEntries) {
      if (!sub.isDirectory()) continue;
      const metaPath = path.join(skillPath, sub.name, '_meta.json');
      const skillMd = path.join(skillPath, sub.name, 'SKILL.md');

      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          skills.push({
            owner: entry.name,
            slug: sub.name,
            displayName: meta.displayName || sub.name,
            version: meta.latest?.version || '?',
            path: path.join(skillPath, sub.name),
            hasSkillMd: fs.existsSync(skillMd),
          });
        } catch {
          skills.push({
            owner: entry.name,
            slug: sub.name,
            displayName: sub.name,
            version: '?',
            path: path.join(skillPath, sub.name),
            hasSkillMd: fs.existsSync(skillMd),
          });
        }
      }
    }
  }

  return skills;
}

/**
 * Search for skills on the remote repo
 */
export async function searchSkills(query) {
  try {
    const resp = await fetch(`${SKILLS_REPO}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
    const items = await resp.json();

    if (!query) return items.slice(0, 20).map(i => i.name);

    const q = query.toLowerCase();
    return items
      .filter(i => i.name.toLowerCase().includes(q))
      .slice(0, 20)
      .map(i => i.name);
  } catch (err) {
    throw new Error(`Failed to search skills: ${err.message}`);
  }
}

/**
 * Install a skill from the openclaw/skills repo
 * Format: owner/slug (e.g., "0xguardbot/megaeth")
 */
export async function installSkill(fullName) {
  ensureDir();
  const [owner, slug] = fullName.includes('/') ? fullName.split('/') : [fullName, null];

  if (!slug) {
    // List sub-skills for this owner
    const resp = await fetch(`${SKILLS_REPO}/${owner}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!resp.ok) throw new Error(`Skill "${owner}" not found (${resp.status})`);
    const items = await resp.json();
    const subSkills = items.filter(i => i.type === 'dir').map(i => i.name);

    if (subSkills.length === 0) throw new Error(`No sub-skills found for "${owner}"`);
    if (subSkills.length === 1) {
      return await installSkill(`${owner}/${subSkills[0]}`);
    }

    return { type: 'choose', owner, subSkills };
  }

  // Download the skill files
  const apiUrl = `${SKILLS_REPO}/${owner}/${slug}`;
  const resp = await fetch(apiUrl, {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
  });
  if (!resp.ok) throw new Error(`Skill "${owner}/${slug}" not found (${resp.status})`);
  const items = await resp.json();

  const skillDir = path.join(SKILLS_DIR, owner, slug);
  fs.mkdirSync(skillDir, { recursive: true });

  let filesDownloaded = 0;
  for (const item of items) {
    if (item.type !== 'file') continue;
    if (!item.download_url) continue;

    const fileResp = await fetch(item.download_url);
    if (!fileResp.ok) continue;

    const content = await fileResp.text();
    fs.writeFileSync(path.join(skillDir, item.name), content, 'utf-8');
    filesDownloaded++;
  }

  // Read meta
  let displayName = slug;
  const metaPath = path.join(skillDir, '_meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      displayName = meta.displayName || slug;
    } catch {}
  }

  return {
    type: 'installed',
    owner,
    slug,
    displayName,
    files: filesDownloaded,
    path: skillDir,
  };
}

/**
 * Remove an installed skill
 */
export function removeSkill(fullName) {
  const [owner, slug] = fullName.includes('/') ? fullName.split('/') : [fullName, null];

  const targetDir = slug
    ? path.join(SKILLS_DIR, owner, slug)
    : path.join(SKILLS_DIR, owner);

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Skill "${fullName}" not found locally`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  return true;
}

/**
 * Load a skill's content as context string for an agent
 */
export function loadSkillContext(fullName) {
  const [owner, slug] = fullName.includes('/') ? fullName.split('/') : [fullName, null];

  // Find the skill
  let skillDir;
  if (slug) {
    skillDir = path.join(SKILLS_DIR, owner, slug);
  } else {
    // Try to find a single sub-skill
    const ownerDir = path.join(SKILLS_DIR, owner);
    if (!fs.existsSync(ownerDir)) throw new Error(`Skill "${fullName}" not installed`);

    const subs = fs.readdirSync(ownerDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    if (subs.length === 0) throw new Error(`No skills found for "${owner}"`);
    skillDir = path.join(ownerDir, subs[0]);
  }

  if (!fs.existsSync(skillDir)) {
    throw new Error(`Skill "${fullName}" not installed. Install with: /skill install ${fullName}`);
  }

  // Read SKILL.md first (main instruction), then all other .md files
  const parts = [];

  const skillMd = path.join(skillDir, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    parts.push(fs.readFileSync(skillMd, 'utf-8'));
  }

  const files = fs.readdirSync(skillDir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    if (file === 'SKILL.md' || file === 'README.md') continue;

    const content = fs.readFileSync(path.join(skillDir, file), 'utf-8');
    parts.push(`\n--- ${file.replace('.md', '')} ---\n${content}`);
  }

  if (parts.length === 0) {
    throw new Error(`Skill "${fullName}" has no content files`);
  }

  return parts.join('\n\n');
}
