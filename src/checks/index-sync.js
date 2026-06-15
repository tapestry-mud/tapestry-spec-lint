'use strict';

const path = require('path');
const { isExcluded } = require('../exclude');

function parseIndexTable(readmeContent) {
  const entries = [];
  const lines = readmeContent.split(/\r?\n/);
  let inTable = false;
  for (const line of lines) {
    if (/^\|\s*Capability/i.test(line)) { inTable = true; continue; }
    if (inTable && /^\|[-| ]+\|$/.test(line.trim())) { continue; }
    if (inTable && line.startsWith('|')) {
      const cols = line.split('|').map(s => s.trim()).filter(Boolean);
      if (cols.length >= 3) {
        const linkMatch = cols[1].match(/\[([^\]]+)\]\(([^)]+)\)/);
        const file = linkMatch ? linkMatch[2] : cols[1];
        const date = cols[2];
        entries.push({ file, date });
      }
    } else if (inTable && line.trim() !== '') {
      inTable = false;
    }
  }
  return entries;
}

function checkIndexSync(specsDir, specs, readmeContent, config) {
  const violations = [];
  const exclude = (config && config.exclude) || [];
  const indexEntries = parseIndexTable(readmeContent);
  const indexFiles = new Set(indexEntries.map(e => e.file));
  const diskFiles = new Set(specs.map(s => path.basename(s.path)));

  for (const entry of indexEntries) {
    // An excluded file is allowed in or out of the index either way - skip both directions.
    if (isExcluded(entry.file, exclude)) { continue; }
    if (!diskFiles.has(entry.file)) {
      violations.push({ rule: 'index-sync', detail: `index references ${entry.file} but it does not exist on disk` });
    }
  }

  for (const spec of specs) {
    const filename = path.basename(spec.path);
    if (!indexFiles.has(filename)) {
      violations.push({ rule: 'index-sync', detail: `${filename} exists on disk but is not in the README index` });
    }
  }

  for (const spec of specs) {
    const filename = path.basename(spec.path);
    const entry = indexEntries.find(e => e.file === filename);
    const frontmatterDate = spec.frontmatter && spec.frontmatter['last-updated'];
    if (entry && frontmatterDate && entry.date !== frontmatterDate) {
      violations.push({
        rule: 'index-sync',
        detail: `${filename}: index date ${entry.date} does not match frontmatter last-updated ${frontmatterDate}`,
      });
    }
  }

  return violations;
}

module.exports = { checkIndexSync, parseIndexTable };
