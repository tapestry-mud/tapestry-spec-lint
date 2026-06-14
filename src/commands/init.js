'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config');
const { renderManagedBlock } = require('../renderer');
const { emptyTable } = require('../index-table');
const pkg = require('../../package.json');

function appendBlock(content, block) {
  const trimmed = content.replace(/\s*$/, '');
  return `${trimmed}\n\n${block}\n`;
}

function init(repoDir) {
  const messages = [];
  const specsDir = path.join(repoDir, 'specs');
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true });
    messages.push('created specs/');
  }

  const configPath = path.join(specsDir, 'lint.config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, `${JSON.stringify({ mode: 'lenient' }, null, 2)}\n`);
    messages.push('wrote specs/lint.config.json (mode: lenient)');
  }

  const config = loadConfig(specsDir);
  const readmePath = path.join(specsDir, 'README.md');
  let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '# Specs\n';

  if (!/\|\s*Capability\s*\|/i.test(readme)) {
    readme = appendBlock(readme, emptyTable());
    messages.push('seeded empty index table');
  }
  if (readme.indexOf('<!-- spec-lint:start -->') === -1) {
    readme = appendBlock(readme, renderManagedBlock(config));
    messages.push('seeded README managed block');
  }
  fs.writeFileSync(readmePath, readme.endsWith('\n') ? readme : `${readme}\n`);

  const wiring = [
    '',
    'Add the wiring below (printed, not applied):',
    '',
    '  devDependency (package.json):',
    `    "@tapestry-mud/spec-lint": "${pkg.version}"`,
    '',
    '  npm script (package.json):',
    '    "spec-lint": "spec-lint specs/"',
    '',
    '  CI step (.github/workflows/ci.yml):',
    '    - run: npm ci',
    '    - run: npm run spec-lint',
    '',
    "Repo initialized. Run 'spec-lint new <capability>' to author your first spec.",
  ];

  return { ok: true, messages, wiring };
}

module.exports = { init };
