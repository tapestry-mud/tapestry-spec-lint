'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { toJsonReport } = require('../src/json-output');
const { lint } = require('../src/engine');
const { loadConfig } = require('../src/config');
const { renderManagedBlock } = require('../src/renderer');
const { BASE_CONFIG } = require('../src/base-config');
const { newCapability } = require('../src/commands/new');

// A scaffolded spec lints clean for every structural rule except the missing Behavior anchor,
// so it is a deterministic source of exactly one violation class for the JSON shape assertions.
function repoWithOneViolation() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-json-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  const readme = `# Specs\n\n| Capability | File | Last Updated |\n|------------|------|--------------|\n\n${renderManagedBlock(BASE_CONFIG)}\n`;
  fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
  newCapability(specsDir, 'command-dispatch', '2026-06-14');
  return specsDir;
}

describe('toJsonReport', () => {
  test('emits mode, a summary with totals, and per-file violations with ERROR level in strict', () => {
    const specsDir = repoWithOneViolation();
    const report = toJsonReport(specsDir, lint(specsDir, loadConfig(specsDir)), 'strict');
    expect(report.mode).toBe('strict');
    expect(report.summary.violations).toBeGreaterThan(0);
    expect(report.summary.passed).toBe(false);
    const all = report.files.flatMap(f => f.violations);
    expect(all.length).toBe(report.summary.violations);
    expect(all.every(v => v.level === 'ERROR')).toBe(true);
    expect(all.every(v => typeof v.rule === 'string' && typeof v.file === 'string')).toBe(true);
    expect(all.some(v => v.rule === 'behavior')).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('level tracks lenient mode and pass/fail matches the human run (lenient never fails)', () => {
    const specsDir = repoWithOneViolation();
    const report = toJsonReport(specsDir, lint(specsDir, loadConfig(specsDir)), 'lenient');
    expect(report.mode).toBe('lenient');
    const all = report.files.flatMap(f => f.violations);
    expect(all.every(v => v.level === 'WARNING')).toBe(true);
    expect(report.summary.passed).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('a clean tree reports zero violations and passes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-json-clean-'));
    const specsDir = path.join(tmp, 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    // Empty specs dir with a minimal README
    const readme = `# Specs\n\n| Capability | File | Last Updated |\n|------------|------|--------------|\n\n${renderManagedBlock(BASE_CONFIG)}\n`;
    fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
    const report = toJsonReport(specsDir, lint(specsDir, loadConfig(specsDir)), 'strict');
    expect(report.summary.violations).toBe(0);
    expect(report.summary.passed).toBe(true);
    expect(report.files).toEqual([]);
    fs.rmSync(tmp, { recursive: true });
  });

  test('crossFile violations appear in crossFile array with correct level and shape', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-json-cf-'));
    const specsDir = path.join(tmp, 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    const readme = `# Specs\n\n| Capability | File | Last Updated |\n|------------|------|--------------|\n\n${renderManagedBlock(BASE_CONFIG)}\n`;
    fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
    // Create a capability
    newCapability(specsDir, 'feat-trigger', '2026-01-01');
    // Create a change record that references feat-trigger but feat-trigger has no Change Log entry
    fs.mkdirSync(path.join(specsDir, 'changes'), { recursive: true });
    const changeRecord = '---\nrelease: v1.0\nspecs: [feat-trigger.md]\n---\n\n# My Change\n\n## Why\n\nTest cross-file.\n\n## What\n\nTest cross-file.\n';
    fs.writeFileSync(path.join(specsDir, 'changes', '2026-01-15-my-change.md'), changeRecord);
    const report = toJsonReport(specsDir, lint(specsDir, loadConfig(specsDir)), 'strict');
    expect(report.crossFile.length).toBeGreaterThan(0);
    expect(report.crossFile.every(v => v.level === 'ERROR')).toBe(true);
    expect(report.crossFile.every(v => typeof v.rule === 'string')).toBe(true);
    expect(report.crossFile.every(v => typeof v.file === 'string' && typeof v.detail === 'string')).toBe(true);
    // crossFile violations are counted in summary.violations
    const fileCount = report.files.flatMap(f => f.violations).length;
    expect(report.summary.violations).toBe(fileCount + report.crossFile.length);
    fs.rmSync(tmp, { recursive: true });
  });
});
