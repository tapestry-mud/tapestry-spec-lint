'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { newChange } = require('../../src/commands/new-change');
const { parseFrontmatter } = require('../../src/parser');

function freshSpecs() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-nc-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  return specsDir;
}

describe('newChange', () => {
  test('prepends today when the slug is undated and writes the record', () => {
    const specsDir = freshSpecs();
    const res = newChange(specsDir, 'telnet-crlf', { release: 'v0.1.35', specs: ['command-dispatch.md'] }, '2026-06-14');
    expect(res.ok).toBe(true);
    const file = path.join(specsDir, 'changes', '2026-06-14-telnet-crlf.md');
    expect(fs.existsSync(file)).toBe(true);
    const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    expect(fm.release).toBe('v0.1.35');
    expect(fm.specs).toEqual(['command-dispatch.md']);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('keeps an already-dated slug as-is', () => {
    const specsDir = freshSpecs();
    newChange(specsDir, '2026-05-01-prior', { release: 'v0.1.0', specs: ['a.md'] }, '2026-06-14');
    expect(fs.existsSync(path.join(specsDir, 'changes', '2026-05-01-prior.md'))).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('creates the changes/ dir if absent', () => {
    const specsDir = freshSpecs();
    newChange(specsDir, 'x', { release: 'v1', specs: [] }, '2026-06-14');
    expect(fs.existsSync(path.join(specsDir, 'changes'))).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('refuses to overwrite an existing record', () => {
    const specsDir = freshSpecs();
    newChange(specsDir, 'dup', { release: 'v1', specs: [] }, '2026-06-14');
    const res = newChange(specsDir, 'dup', { release: 'v1', specs: [] }, '2026-06-14');
    expect(res.ok).toBe(false);
    expect(res.messages.join(' ')).toMatch(/refus/i);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });
});
