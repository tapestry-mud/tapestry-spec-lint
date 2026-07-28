'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkAnchorResolve } = require('../../src/checks/anchor-resolve');
const { BASE_CONFIG } = require('../../src/base-config');

function spec(behavior) {
  return `---
capability: feature-a
last-updated: 2026-01-15
---

# Feature A

## Overview

Does a thing.

## Behavior

${behavior}

## Rejected and Reverted

- None on record.

## Change Log
`;
}

// repoRoot/
//   src/Router.cs          (40 lines)
//   specs/vehicle-search.md
function buildRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-anchor-'));
  const specsDir = path.join(tmp, 'specs');
  fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
  fs.mkdirSync(specsDir, { recursive: true });
  fs.writeFileSync(
    path.join(tmp, 'src', 'Router.cs'),
    Array.from({ length: 40 }, (_, i) => `// line ${i + 1}`).join('\n') + '\n',
  );
  fs.writeFileSync(path.join(specsDir, 'vehicle-search.md'), '# Vehicle Search\n');
  // A path-qualified markdown doc that lives at the repo root, not under specs/.
  fs.mkdirSync(path.join(tmp, 'skills', 'do-a-thing'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'skills', 'do-a-thing', 'SKILL.md'), '# Skill\n');
  return { tmp, ctx: { specsDir, repoRoot: tmp } };
}

function run(behavior, config = BASE_CONFIG) {
  const { tmp, ctx } = buildRepo();
  try {
    return checkAnchorResolve('feature-a.md', spec(behavior), config, ctx);
  } finally {
    fs.rmSync(tmp, { recursive: true });
  }
}

describe('checkAnchorResolve', () => {
  test('passes when the target exists and the line is inside it', () => {
    expect(run('- Routes. (src/Router.cs:26)')).toHaveLength(0);
  });

  test('passes for a range fully inside the file', () => {
    expect(run('- Routes. (src/Router.cs:26-40)')).toHaveLength(0);
  });

  test('passes for a file-only anchor', () => {
    expect(run('- Routes. (src/Router.cs)')).toHaveLength(0);
  });

  test('reports a target that no longer exists', () => {
    const v = run('- Routes. (src/Gone.cs:12)');
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('anchor-resolve');
    expect(v[0].detail).toMatch(/no longer exists/);
  });

  test('reports a missing target once, not once per anchor', () => {
    expect(run('- A. (src/Gone.cs:12) B. (src/Gone.cs:30)')).toHaveLength(1);
  });

  test('reports a line past the end of the file', () => {
    const v = run('- Routes. (src/Router.cs:41)');
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('anchor-resolve');
    expect(v[0].detail).toMatch(/points past end of file \(40 lines\)/);
  });

  test('reports a range whose end is past the end of the file', () => {
    expect(run('- Routes. (src/Router.cs:30-99)')).toHaveLength(1);
  });

  test('reports a continuation range that is past the end of the file', () => {
    const v = run('- Routes. (src/Router.cs:10-20; 90-99)');
    expect(v).toHaveLength(1);
    expect(v[0].detail).toMatch(/src\/Router\.cs:90-99/);
  });

  test('resolves a sibling capability link relative to specs/', () => {
    expect(run('- See (vehicle-search.md) for the query path.')).toHaveLength(0);
  });

  // Regression: markdown was resolved only against specs/, so a repo-root doc such as
  // skills/<name>/SKILL.md was reported missing when it was sitting right there.
  test('resolves a path-qualified markdown doc from the repo root', () => {
    expect(run('- Documented in (skills/do-a-thing/SKILL.md).')).toHaveLength(0);
  });

  test('reports a sibling capability link that does not exist', () => {
    expect(run('- See (no-such-capability.md) for details.')).toHaveLength(1);
  });

  test('skips a bare filename rather than guessing where it lives', () => {
    expect(run('- Routes. (Router.cs:26)')).toHaveLength(0);
  });

  test('honours anchorResolve: false', () => {
    const off = Object.assign({}, BASE_CONFIG, { anchorResolve: false });
    expect(run('- Routes. (src/Gone.cs:12)', off)).toHaveLength(0);
  });

  test('returns nothing without filesystem context', () => {
    const v = checkAnchorResolve('feature-a.md', spec('- (src/Gone.cs:1)'), BASE_CONFIG, null);
    expect(v).toHaveLength(0);
  });

  test('returns nothing when Behavior is missing (sections check owns that)', () => {
    const { tmp, ctx } = buildRepo();
    const noSection = `---
capability: feature-a
last-updated: 2026-01-15
---

## Overview

.
`;
    expect(checkAnchorResolve('feature-a.md', noSection, BASE_CONFIG, ctx)).toHaveLength(0);
    fs.rmSync(tmp, { recursive: true });
  });
});
