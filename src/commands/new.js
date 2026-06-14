'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config');
const { renderCapabilitySpec, slugToTitle } = require('../templates');
const { appendRow } = require('../index-table');

function newCapability(specsDir, slug, today) {
  const filePath = path.join(specsDir, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    return { ok: false, messages: [`refusing to overwrite existing spec: ${slug}.md`] };
  }
  const config = loadConfig(specsDir);
  fs.writeFileSync(filePath, renderCapabilitySpec(slug, today, config));

  const readmePath = path.join(specsDir, 'README.md');
  let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '# Specs\n';
  readme = appendRow(readme, { capability: slugToTitle(slug), file: `${slug}.md`, date: today });
  fs.writeFileSync(readmePath, readme.endsWith('\n') ? readme : `${readme}\n`);

  return {
    ok: true,
    messages: [
      `created specs/${slug}.md`,
      `indexed ${slug}.md in README`,
      `next: fill the Behavior section with at least one anchor, then run spec-lint`,
    ],
  };
}

module.exports = { newCapability };
