'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config');
const { parseFrontmatter, parseSections } = require('../parser');
const {
  renderManagedBlock,
  MANAGED_BLOCK_START,
  MANAGED_BLOCK_END,
} = require('../renderer');
const { reconcileIndex } = require('../index-table');

function insertSentinel(content, sentinel) {
  const sections = parseSections(content);
  const rr = sections['Rejected and Reverted'];
  if (rr === undefined) { return content; }
  if (rr.trim() !== '') { return content; }
  return content.replace(
    /(^|\n)(## Rejected and Reverted[ \t]*\r?\n)/,
    `$1$2\n${sentinel}\n`,
  );
}

function resyncManagedBlock(readme, freshBlock) {
  const start = readme.indexOf(MANAGED_BLOCK_START);
  const end = readme.indexOf(MANAGED_BLOCK_END);
  if (start !== -1 && end !== -1) {
    return readme.slice(0, start) + freshBlock + readme.slice(end + MANAGED_BLOCK_END.length);
  }
  const trimmed = readme.replace(/\s*$/, '');
  return `${trimmed}\n\n${freshBlock}\n`;
}

function fix(specsDir) {
  const config = loadConfig(specsDir);
  const messages = [];

  const specFiles = fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => path.join(specsDir, f));

  // Repair 1: sentinel into empty R&R.
  for (const filePath of specFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const repaired = insertSentinel(content, config.sentinelText);
    if (repaired !== content) {
      fs.writeFileSync(filePath, repaired);
      messages.push(`inserted sentinel in ${path.basename(filePath)}`);
    }
  }

  // Repairs 2 + 3: managed block resync + index reconcile (re-read frontmatter after sentinel writes).
  const readmePath = path.join(specsDir, 'README.md');
  const before = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
  let readme = resyncManagedBlock(before, renderManagedBlock(config));
  const specs = specFiles.map(filePath => ({
    path: filePath,
    frontmatter: parseFrontmatter(fs.readFileSync(filePath, 'utf8')),
  }));
  readme = reconcileIndex(readme, specs);
  const normalized = readme.endsWith('\n') ? readme : `${readme}\n`;
  if (normalized !== before) {
    fs.writeFileSync(readmePath, normalized);
    messages.push('resynced README managed block and index');
  }

  if (messages.length === 0) {
    messages.push('nothing to fix - tree is clean');
  }
  return { ok: true, messages };
}

module.exports = { fix, insertSentinel, resyncManagedBlock };
