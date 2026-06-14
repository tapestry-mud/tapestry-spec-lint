'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { newCapability } = require('../../src/commands/new');
const { loadConfig } = require('../../src/config');
const { lint } = require('../../src/engine');
const { parseIndexRows } = require('../../src/index-table');
const { renderManagedBlock } = require('../../src/renderer');
const { BASE_CONFIG } = require('../../src/base-config');

function freshRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-new-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  const readme = `# Specs\n\n| Capability | File | Last Updated |\n|------------|------|--------------|\n\n${renderManagedBlock(BASE_CONFIG)}\n`;
  fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
  return specsDir;
}

describe('newCapability', () => {
  test('writes a spec file and an index row', () => {
    const specsDir = freshRepo();
    const res = newCapability(specsDir, 'command-dispatch', '2026-06-14');
    expect(res.ok).toBe(true);
    expect(fs.existsSync(path.join(specsDir, 'command-dispatch.md'))).toBe(true);
    const rows = parseIndexRows(fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8'));
    expect(rows.some(r => r.file === 'command-dispatch.md' && r.date === '2026-06-14')).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('the scaffold lints clean for every rule except the Behavior anchor', () => {
    const specsDir = freshRepo();
    newCapability(specsDir, 'command-dispatch', '2026-06-14');
    const result = lint(specsDir, loadConfig(specsDir));
    const violations = [
      ...Object.values(result.fileResults).flat(),
      ...result.crossFileViolations,
    ];
    expect(violations.every(v => v.rule === 'behavior')).toBe(true);
    expect(violations.some(v => v.rule === 'behavior')).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('refuses to overwrite an existing slug', () => {
    const specsDir = freshRepo();
    newCapability(specsDir, 'command-dispatch', '2026-06-14');
    const res = newCapability(specsDir, 'command-dispatch', '2026-06-14');
    expect(res.ok).toBe(false);
    expect(res.messages.join(' ')).toMatch(/refus/i);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });
});
