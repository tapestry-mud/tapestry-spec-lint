'use strict';

const { isExcluded, globToRegExp } = require('../src/exclude');

describe('isExcluded', () => {
  test('empty or missing list excludes nothing', () => {
    expect(isExcluded('validation-ledger.md', [])).toBe(false);
    expect(isExcluded('validation-ledger.md', undefined)).toBe(false);
  });

  test('matches an exact filename', () => {
    expect(isExcluded('validation-ledger.md', ['validation-ledger.md'])).toBe(true);
    expect(isExcluded('linting-engine.md', ['validation-ledger.md'])).toBe(false);
  });

  test('matches a simple glob', () => {
    expect(isExcluded('validation-ledger.md', ['*-ledger.md'])).toBe(true);
    expect(isExcluded('release-ledger.md', ['*-ledger.md'])).toBe(true);
    expect(isExcluded('linting-engine.md', ['*-ledger.md'])).toBe(false);
  });

  test('anchors the glob - a pattern does not match a superstring', () => {
    expect(isExcluded('validation-ledger.md.bak', ['validation-ledger.md'])).toBe(false);
    expect(isExcluded('not-validation-ledger.md', ['validation-ledger.md'])).toBe(false);
  });

  test('treats regex metacharacters in a pattern as literals', () => {
    expect(isExcluded('notes.md', ['note?.md'])).toBe(false);
    expect(isExcluded('note?.md', ['note?.md'])).toBe(true);
  });
});

describe('globToRegExp', () => {
  test('* becomes a wildcard run and the match is anchored', () => {
    const re = globToRegExp('*-ledger.md');
    expect(re.test('x-ledger.md')).toBe(true);
    expect(re.test('x-ledger.md.extra')).toBe(false);
  });
});
