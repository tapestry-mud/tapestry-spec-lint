'use strict';

const { normalizeEol, detectEol, applyEol, countLines } = require('../src/eol');

describe('normalizeEol', () => {
  test('converts CRLF to LF and leaves LF alone', () => {
    expect(normalizeEol('a\r\nb\r\n')).toBe('a\nb\n');
    expect(normalizeEol('a\nb\n')).toBe('a\nb\n');
  });
});

describe('detectEol', () => {
  test('reports CRLF when any CRLF is present, LF otherwise', () => {
    expect(detectEol('a\r\nb')).toBe('\r\n');
    expect(detectEol('a\nb')).toBe('\n');
    expect(detectEol('no newline at all')).toBe('\n');
  });
});

describe('applyEol', () => {
  test('rewrites an LF body to CRLF without doubling carriage returns', () => {
    expect(applyEol('a\nb\n', '\r\n')).toBe('a\r\nb\r\n');
    expect(applyEol('a\r\nb\r\n', '\r\n')).toBe('a\r\nb\r\n');
  });

  test('rewrites a CRLF body to LF', () => {
    expect(applyEol('a\r\nb\r\n', '\n')).toBe('a\nb\n');
  });
});

describe('countLines', () => {
  test('counts newline-terminated lines identically for LF and CRLF', () => {
    expect(countLines('a\nb\nc\n')).toBe(3);
    expect(countLines('a\r\nb\r\nc\r\n')).toBe(3);
  });

  test('counts a final line with no trailing newline', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });

  test('an empty file has no lines', () => {
    expect(countLines('')).toBe(0);
  });
});
