'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { lint } = require('../src/engine');
const { fix } = require('../src/commands/fix');
const { loadConfig } = require('../src/config');
const { renderManagedBlock } = require('../src/renderer');

// A valid capability that no change record names, so an empty Change Log is allowed.
const FEATURE_A = `---
capability: feature-a
last-updated: 2026-01-15
---

# Feature A

## Overview

Does a thing.

## Behavior

- Works. (src/a.js:1)

## Rejected and Reverted

- None on record.

## Change Log
`;

// A meta file that is not a capability at all - no frontmatter, no required sections.
const GARBAGE_LEDGER = `# Validation Ledger

Free-form notes. Not a capability. No frontmatter. No required sections.

- whatever
- the author wants
`;

function buildRepo(repoConfig) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-excl-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(path.join(specsDir, 'feature-a.md'), FEATURE_A);
  fs.writeFileSync(path.join(specsDir, 'validation-ledger.md'), GARBAGE_LEDGER);
  fs.writeFileSync(path.join(specsDir, 'lint.config.json'), JSON.stringify(repoConfig));
  // README index lists only the real capability; managed block is rendered from the
  // effective config so the exclude line (if any) is present and readme-drift is clean.
  const config = loadConfig(specsDir);
  const readme = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |

${renderManagedBlock(config)}
`;
  fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
  return { tmp, specsDir };
}

function allViolations(result) {
  return [...Object.values(result.fileResults).flat(), ...result.crossFileViolations];
}

describe('exclude (integration)', () => {
  test('excluded exact file produces zero violations; real capability lints normally', () => {
    const { tmp, specsDir } = buildRepo({ exclude: ['validation-ledger.md'] });
    const result = lint(specsDir, loadConfig(specsDir));
    expect(allViolations(result)).toHaveLength(0);
    // the ledger was never discovered as a capability
    expect(result.specs.some(s => path.basename(s.path) === 'validation-ledger.md')).toBe(false);
    expect(result.specs.some(s => path.basename(s.path) === 'feature-a.md')).toBe(true);
    fs.rmSync(tmp, { recursive: true });
  });

  test('excluded glob is skipped', () => {
    const { tmp, specsDir } = buildRepo({ exclude: ['*-ledger.md'] });
    const result = lint(specsDir, loadConfig(specsDir));
    expect(allViolations(result)).toHaveLength(0);
    fs.rmSync(tmp, { recursive: true });
  });

  test('default empty exclude changes nothing - the garbage ledger is still linted and flagged', () => {
    const { tmp, specsDir } = buildRepo({});
    const result = lint(specsDir, loadConfig(specsDir));
    const v = allViolations(result);
    expect(v.length).toBeGreaterThan(0);
    // discovered as a (malformed) capability and flagged by index-sync (direction B)
    expect(result.specs.some(s => path.basename(s.path) === 'validation-ledger.md')).toBe(true);
    expect(v.some(x => x.rule === 'index-sync' && x.detail.includes('validation-ledger.md'))).toBe(true);
    fs.rmSync(tmp, { recursive: true });
  });

  test('an excluded file full of garbage content still passes the run', () => {
    const { tmp, specsDir } = buildRepo({ exclude: ['validation-ledger.md'] });
    // make it even worse - random bytes that would shred every per-file check
    fs.writeFileSync(path.join(specsDir, 'validation-ledger.md'), '|table|row|\n```\nnot markdown at all\n');
    const result = lint(specsDir, loadConfig(specsDir));
    expect(allViolations(result)).toHaveLength(0);
    fs.rmSync(tmp, { recursive: true });
  });

  test('fix does not add an excluded file to the index and does not touch it', () => {
    const { tmp, specsDir } = buildRepo({ exclude: ['validation-ledger.md'] });
    const before = fs.readFileSync(path.join(specsDir, 'validation-ledger.md'), 'utf8');
    fix(specsDir);
    const readme = fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8');
    // not added as an index row (it legitimately appears in the managed block's exclude line)
    expect(readme).not.toContain('[validation-ledger.md](validation-ledger.md)');
    // excluded file is left byte-for-byte untouched (no sentinel injection)
    expect(fs.readFileSync(path.join(specsDir, 'validation-ledger.md'), 'utf8')).toBe(before);
    // and the repo is clean afterward
    const result = lint(specsDir, loadConfig(specsDir));
    expect(allViolations(result)).toHaveLength(0);
    fs.rmSync(tmp, { recursive: true });
  });
});
