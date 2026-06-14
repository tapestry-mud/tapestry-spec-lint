'use strict';

const path = require('path');
const { slugToTitle } = require('./templates');

const TABLE_HEADER = '| Capability | File | Last Updated |';
const TABLE_DIVIDER = '|------------|------|--------------|';
const MANAGED_START = '<!-- spec-lint:start -->';

function renderRow(row) {
  return `| ${row.capability} | [${row.file}](${row.file}) | ${row.date} |`;
}

function emptyTable() {
  return `${TABLE_HEADER}\n${TABLE_DIVIDER}`;
}

function parseIndexRows(readmeContent) {
  const rows = [];
  const lines = readmeContent.split(/\r?\n/);
  let inTable = false;
  for (const line of lines) {
    if (/^\|\s*Capability\s*\|/i.test(line)) { inTable = true; continue; }
    if (inTable && /^\|[-| ]+\|$/.test(line.trim())) { continue; }
    if (inTable && line.startsWith('|')) {
      const cols = line.split('|').map(s => s.trim());
      const capability = cols[1] || '';
      const fileCell = cols[2] || '';
      const date = cols[3] || '';
      if (!fileCell) { continue; }
      const linkMatch = fileCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const file = linkMatch ? linkMatch[2] : fileCell;
      rows.push({ capability, file, date });
    } else if (inTable && line.trim() !== '') {
      inTable = false;
    }
  }
  return rows;
}

function writeTable(readmeContent, rows) {
  // Render rows in the order given - callers own ordering; this never re-sorts.
  const tableText = [TABLE_HEADER, TABLE_DIVIDER, ...rows.map(renderRow)].join('\n');
  return replaceTable(readmeContent, tableText);
}

function replaceTable(readmeContent, newTableText) {
  const lines = readmeContent.split(/\r?\n/);
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*Capability\s*\|/i.test(lines[i])) {
      start = i;
      end = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('|')) { end = j; } else { break; }
      }
      break;
    }
  }
  if (start === -1) {
    const idx = readmeContent.indexOf(MANAGED_START);
    if (idx !== -1) {
      return `${readmeContent.slice(0, idx)}${newTableText}\n\n${readmeContent.slice(idx)}`;
    }
    const trimmed = readmeContent.replace(/\s*$/, '');
    return `${trimmed}\n\n${newTableText}\n`;
  }
  const before = lines.slice(0, start);
  const after = lines.slice(end + 1);
  return [...before, ...newTableText.split('\n'), ...after].join('\n');
}

function appendRow(readmeContent, row) {
  // Update in place if the file is already indexed; otherwise append at the end. No global sort.
  const rows = parseIndexRows(readmeContent);
  const idx = rows.findIndex(r => r.file === row.file);
  if (idx === -1) {
    rows.push(row);
  } else {
    rows[idx] = row;
  }
  return writeTable(readmeContent, rows);
}

function reconcileIndex(readmeContent, specs) {
  const byFile = {};
  for (const spec of specs) {
    byFile[path.basename(spec.path)] = spec;
  }
  const rows = [];
  const placed = new Set();

  // Surviving rows keep their existing position (ghosts dropped in place); refresh date, preserve capability cell.
  for (const r of parseIndexRows(readmeContent)) {
    const spec = byFile[r.file];
    if (!spec) { continue; }
    const date = (spec.frontmatter && spec.frontmatter['last-updated']) || '';
    rows.push({ capability: r.capability, file: r.file, date });
    placed.add(r.file);
  }

  // Genuinely-new disk files append at the END, deterministic order among only the new rows.
  const newFiles = specs
    .map(spec => path.basename(spec.path))
    .filter(file => !placed.has(file))
    .sort((a, b) => a.localeCompare(b));
  for (const file of newFiles) {
    const spec = byFile[file];
    const date = (spec.frontmatter && spec.frontmatter['last-updated']) || '';
    rows.push({ capability: slugToTitle(file.replace(/\.md$/, '')), file, date });
  }

  return writeTable(readmeContent, rows);
}

module.exports = {
  parseIndexRows,
  renderRow,
  emptyTable,
  replaceTable,
  writeTable,
  appendRow,
  reconcileIndex,
  TABLE_HEADER,
  TABLE_DIVIDER,
};
