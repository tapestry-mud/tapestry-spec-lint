'use strict';

const path = require('path');
const { checkIndexSync } = require('../../src/checks/index-sync');
const { BASE_CONFIG } = require('../../src/base-config');

const GOOD_README = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |
`;

const goodSpecs = [
  { path: '/specs/feature-a.md', frontmatter: { 'last-updated': '2026-01-15' } },
];

describe('checkIndexSync', () => {
  test('passes when index and disk match', () => {
    const v = checkIndexSync('/specs', goodSpecs, GOOD_README, BASE_CONFIG);
    expect(v).toHaveLength(0);
  });

  test('fails (direction A) when index names file not on disk', () => {
    const readme = `# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Feature A | [feature-a.md](feature-a.md) | 2026-01-15 |
| Ghost | [ghost.md](ghost.md) | 2026-01-15 |
`;
    const v = checkIndexSync('/specs', goodSpecs, readme, BASE_CONFIG);
    expect(v.some(x => x.detail.includes('ghost.md') && x.detail.includes('not exist'))).toBe(true);
  });

  test('fails (direction B) when file on disk not in index', () => {
    const twoSpecs = [
      ...goodSpecs,
      { path: '/specs/feature-b.md', frontmatter: { 'last-updated': '2026-01-20' } },
    ];
    const v = checkIndexSync('/specs', twoSpecs, GOOD_README, BASE_CONFIG);
    expect(v.some(x => x.detail.includes('feature-b.md') && x.detail.includes('not in'))).toBe(true);
  });

  test('fails when index date does not match frontmatter last-updated', () => {
    const wrongDate = GOOD_README.replace('2026-01-15', '2026-02-01');
    const v = checkIndexSync('/specs', goodSpecs, wrongDate, BASE_CONFIG);
    expect(v.some(x => x.detail.includes('date') || x.detail.includes('last-updated'))).toBe(true);
  });

  test('does not flag an excluded file that is indexed but not a discovered spec', () => {
    // ledger is on disk but excluded, so engine never hands it to index-sync; if it is
    // also listed in the index, direction A must not flag it as "not on disk".
    const readme = `${GOOD_README}| Ledger | [validation-ledger.md](validation-ledger.md) | 2026-01-15 |\n`;
    const cfg = { ...BASE_CONFIG, exclude: ['validation-ledger.md'] };
    const v = checkIndexSync('/specs', goodSpecs, readme, cfg);
    expect(v).toHaveLength(0);
  });

  test('still flags a non-excluded indexed file that is missing from disk', () => {
    const readme = `${GOOD_README}| Ledger | [validation-ledger.md](validation-ledger.md) | 2026-01-15 |\n`;
    const v = checkIndexSync('/specs', goodSpecs, readme, BASE_CONFIG);
    expect(v.some(x => x.detail.includes('validation-ledger.md') && x.detail.includes('not exist'))).toBe(true);
  });
});
