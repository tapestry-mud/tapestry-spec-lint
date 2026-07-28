'use strict';

const { parseAnchors, isPathQualified } = require('../src/anchors');

describe('parseAnchors', () => {
  test('parses a file-only anchor', () => {
    expect(parseAnchors('text (src/Router.cs) more')).toEqual([
      { target: 'src/Router.cs', start: null, end: null, raw: 'src/Router.cs' },
    ]);
  });

  test('parses a single line and a range', () => {
    const a = parseAnchors('(src/Router.cs:26) and (src/Other.cs:26-64)');
    expect(a).toHaveLength(2);
    expect(a[0]).toMatchObject({ target: 'src/Router.cs', start: 26, end: null });
    expect(a[1]).toMatchObject({ target: 'src/Other.cs', start: 26, end: 64 });
  });

  test('parses several anchors in one paren', () => {
    const a = parseAnchors('(a/x.cs:7; b/y.cs:32-37)');
    expect(a.map(x => x.target)).toEqual(['a/x.cs', 'b/y.cs']);
    expect(a[1]).toMatchObject({ start: 32, end: 37 });
  });

  test('a bare range continues the previous target', () => {
    const a = parseAnchors('(src/Filter.cs:85-103; 153-166)');
    expect(a).toHaveLength(2);
    expect(a[0]).toMatchObject({ target: 'src/Filter.cs', start: 85, end: 103 });
    expect(a[1]).toMatchObject({ target: 'src/Filter.cs', start: 153, end: 166 });
  });

  test('ignores a free note without inventing an anchor', () => {
    const a = parseAnchors('(src/Filter.cs:14-18; guarded by the outer lock)');
    expect(a).toHaveLength(1);
    expect(a[0].target).toBe('src/Filter.cs');
  });

  test('ignores ordinary parenthetical prose', () => {
    expect(parseAnchors('the handler (see below) does the work')).toHaveLength(0);
  });

  test('does not treat a leading note as an anchor paren', () => {
    expect(parseAnchors('(note; src/Router.cs:12)')).toHaveLength(0);
  });

  test('parses a sibling capability link', () => {
    const a = parseAnchors('see (vehicle-search.md) for the query path');
    expect(a).toEqual([
      { target: 'vehicle-search.md', start: null, end: null, raw: 'vehicle-search.md' },
    ]);
  });

  test('returns nothing for empty input', () => {
    expect(parseAnchors('')).toHaveLength(0);
    expect(parseAnchors(undefined)).toHaveLength(0);
  });
});

describe('isPathQualified', () => {
  test('true for forward and back slashes, false for a bare basename', () => {
    expect(isPathQualified('src/Router.cs')).toBe(true);
    expect(isPathQualified('src\\Router.cs')).toBe(true);
    expect(isPathQualified('Router.cs')).toBe(false);
  });
});
