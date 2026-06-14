'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { fix } = require('../../src/commands/fix');
const { loadConfig } = require('../../src/config');
const { lint } = require('../../src/engine');
const { renderManagedBlock } = require('../../src/renderer');
const { BASE_CONFIG } = require('../../src/base-config');

// A spec with an empty R&R (missing sentinel) and a valid Behavior anchor.
const SPEC_EMPTY_RR = `---
capability: feature-a
last-updated: 2026-03-01
---

# Feature A

## Overview

Does a thing.

## Behavior

- Works. (src/a.js:1)

## Rejected and Reverted

## Change Log
`;

// A spec missing its Behavior anchor (authoring-required failure that must survive fix).
const SPEC_NO_ANCHOR = `---
capability: feature-b
last-updated: 2026-02-01
---

# Feature B

## Overview

Does another thing.

## Behavior

- No anchor here at all.

## Rejected and Reverted

- None on record.

## Change Log
`;

function driftedRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-fix-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(path.join(specsDir, 'feature-a.md'), SPEC_EMPTY_RR);
  fs.writeFileSync(path.join(specsDir, 'feature-b.md'), SPEC_NO_ANCHOR);
  // README: stale managed block + index missing feature-b (direction B) + ghost row (direction A) + wrong date.
  const readme = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Feature A | [feature-a.md](feature-a.md) | 1999-01-01 |
| Ghost | [ghost.md](ghost.md) | 2026-01-01 |

<!-- spec-lint:start -->
Mode: strict

Stale and wrong contract body.
<!-- spec-lint:end -->
`;
  fs.writeFileSync(path.join(specsDir, 'README.md'), readme);
  return specsDir;
}

describe('fix', () => {
  test('repairs the mechanical rules; authoring failure survives', () => {
    const specsDir = driftedRepo();
    fix(specsDir);
    const result = lint(specsDir, loadConfig(specsDir));
    const violations = [
      ...Object.values(result.fileResults).flat(),
      ...result.crossFileViolations,
    ];
    // The only thing left is feature-b's missing Behavior anchor.
    expect(violations.every(v => v.rule === 'behavior')).toBe(true);
    expect(violations.some(v => v.rule === 'behavior')).toBe(true);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('inserts the sentinel into an empty R&R only', () => {
    const specsDir = driftedRepo();
    fix(specsDir);
    const a = fs.readFileSync(path.join(specsDir, 'feature-a.md'), 'utf8');
    expect(a).toContain('## Rejected and Reverted\n\n- None on record.');
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('resyncs the managed block to the rendered contract', () => {
    const specsDir = driftedRepo();
    fix(specsDir);
    const readme = fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8');
    expect(readme).toContain(renderManagedBlock(loadConfig(specsDir)));
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('does not touch lint.config.json', () => {
    const specsDir = driftedRepo();
    fs.writeFileSync(path.join(specsDir, 'lint.config.json'), JSON.stringify({ mode: 'lenient' }));
    fix(specsDir);
    expect(JSON.parse(fs.readFileSync(path.join(specsDir, 'lint.config.json'), 'utf8'))).toEqual({ mode: 'lenient' });
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });

  test('is idempotent (second run writes nothing)', () => {
    const specsDir = driftedRepo();
    fix(specsDir);
    const snapshot = {
      a: fs.readFileSync(path.join(specsDir, 'feature-a.md'), 'utf8'),
      readme: fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8'),
    };
    const res2 = fix(specsDir);
    expect(res2.messages.join(' ')).toMatch(/nothing to fix/i);
    expect(fs.readFileSync(path.join(specsDir, 'feature-a.md'), 'utf8')).toBe(snapshot.a);
    expect(fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8')).toBe(snapshot.readme);
    fs.rmSync(path.dirname(specsDir), { recursive: true });
  });
});
