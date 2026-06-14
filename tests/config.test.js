'use strict';

const { BASE_CONFIG } = require('../src/base-config');

describe('BASE_CONFIG', () => {
  test('has required sections array with four entries', () => {
    expect(BASE_CONFIG.sections).toEqual([
      'Overview',
      'Behavior',
      'Rejected and Reverted',
      'Change Log',
    ]);
  });

  test('anchorRegex matches valid anchors', () => {
    const re = new RegExp(BASE_CONFIG.anchorRegex);
    expect(re.test('(src/Tapestry.Engine/CommandRouter.cs:26-64)')).toBe(true);
    expect(re.test('(src/engine.js:10)')).toBe(true);
    expect(re.test('(config/settings.yaml)')).toBe(true);
    expect(re.test('(@tapestry/core/index.js:5)')).toBe(true);
    expect(re.test('(README.md)')).toBe(false);
    expect(re.test('(src/plain-text.txt)')).toBe(false);
  });

  test('sentinelText is exact sentinel string', () => {
    expect(BASE_CONFIG.sentinelText).toBe('- None on record.');
  });

  test('defaultMode is strict', () => {
    expect(BASE_CONFIG.defaultMode).toBe('strict');
  });
});
