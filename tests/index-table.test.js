'use strict';

const {
  parseIndexRows,
  renderRow,
  emptyTable,
  reconcileIndex,
  appendRow,
  TABLE_HEADER,
} = require('../src/index-table');

const README = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |

<!-- spec-lint:start -->
Mode: strict
<!-- spec-lint:end -->
`;

describe('parseIndexRows', () => {
  test('parses capability, file, and date', () => {
    const rows = parseIndexRows(README);
    expect(rows).toEqual([{ capability: 'Feature A', file: 'feature-a.md', date: '2026-01-15' }]);
  });

  test('returns empty array when no table present', () => {
    expect(parseIndexRows('# Specs\n\nNo table.')).toEqual([]);
  });
});

describe('renderRow / emptyTable', () => {
  test('renders a markdown row with a link', () => {
    expect(renderRow({ capability: 'Feature B', file: 'feature-b.md', date: '2026-02-01' }))
      .toBe('| Feature B | [feature-b.md](feature-b.md) | 2026-02-01 |');
  });

  test('emptyTable is header + divider only', () => {
    expect(emptyTable()).toContain(TABLE_HEADER);
    expect(emptyTable().split('\n')).toHaveLength(2);
  });
});

describe('appendRow', () => {
  test('adds a row and leaves the managed block intact', () => {
    const out = appendRow(README, { capability: 'Feature B', file: 'feature-b.md', date: '2026-02-01' });
    expect(out).toContain('[feature-b.md](feature-b.md)');
    expect(out).toContain('<!-- spec-lint:start -->');
  });

  test('upsert: re-appending the same file does not duplicate it', () => {
    const once = appendRow(README, { capability: 'Feature B', file: 'feature-b.md', date: '2026-02-01' });
    const twice = appendRow(once, { capability: 'Feature B', file: 'feature-b.md', date: '2026-02-01' });
    expect(parseIndexRows(twice).filter(r => r.file === 'feature-b.md')).toHaveLength(1);
  });

  test('appends at the END without re-sorting a curated (non-alphabetical) order', () => {
    const curated = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Zebra | [zebra.md](zebra.md) | 2026-01-01 |
| Alpha | [alpha.md](alpha.md) | 2026-01-02 |
`;
    const out = appendRow(curated, { capability: 'Middle', file: 'middle.md', date: '2026-01-03' });
    expect(parseIndexRows(out).map(r => r.file)).toEqual(['zebra.md', 'alpha.md', 'middle.md']);
  });
});

describe('reconcileIndex', () => {
  const specs = [
    { path: '/x/specs/feature-a.md', frontmatter: { 'last-updated': '2026-03-01' } },
    { path: '/x/specs/feature-b.md', frontmatter: { 'last-updated': '2026-02-01' } },
  ];

  test('adds a disk file missing from the index (direction B)', () => {
    const rows = parseIndexRows(reconcileIndex(README, specs));
    expect(rows.some(r => r.file === 'feature-b.md')).toBe(true);
  });

  test('drops an index row whose file is gone (direction A)', () => {
    const withGhost = README.replace(
      '| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |',
      '| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |\n| Ghost | [ghost.md](ghost.md) | 2026-01-15 |',
    );
    const rows = parseIndexRows(reconcileIndex(withGhost, specs));
    expect(rows.some(r => r.file === 'ghost.md')).toBe(false);
  });

  test('refreshes the date column from frontmatter', () => {
    const rows = parseIndexRows(reconcileIndex(README, specs));
    const a = rows.find(r => r.file === 'feature-a.md');
    expect(a.date).toBe('2026-03-01');
  });

  test('preserves the human capability cell for a surviving file', () => {
    const rows = parseIndexRows(reconcileIndex(README, specs));
    const a = rows.find(r => r.file === 'feature-a.md');
    expect(a.capability).toBe('Feature A');
  });

  test('is idempotent (a second pass is byte-identical)', () => {
    const once = reconcileIndex(README, specs);
    const twice = reconcileIndex(once, specs);
    expect(twice).toBe(once);
  });

  test('preserves a curated non-alphabetical order and appends new files at the END', () => {
    const curated = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Zebra | [zebra.md](zebra.md) | 2026-01-01 |
| Alpha | [alpha.md](alpha.md) | 2026-01-02 |
`;
    const curatedSpecs = [
      { path: '/x/specs/zebra.md', frontmatter: { 'last-updated': '2026-01-01' } },
      { path: '/x/specs/alpha.md', frontmatter: { 'last-updated': '2026-01-02' } },
      { path: '/x/specs/middle.md', frontmatter: { 'last-updated': '2026-01-03' } },
    ];
    const rows = parseIndexRows(reconcileIndex(curated, curatedSpecs));
    // curated order (zebra before alpha) survives; the new file lands last, NOT alphabetized into the middle
    expect(rows.map(r => r.file)).toEqual(['zebra.md', 'alpha.md', 'middle.md']);
  });
});
