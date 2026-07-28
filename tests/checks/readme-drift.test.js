'use strict';

const { checkReadmeDrift } = require('../../src/checks/readme-drift');
const { BASE_CONFIG } = require('../../src/base-config');

const MANAGED_BLOCK_START = '<!-- spec-lint:start -->';
const MANAGED_BLOCK_END = '<!-- spec-lint:end -->';

function wrapBlock(content) {
  return `# Specs\n\n${MANAGED_BLOCK_START}\n${content}\n${MANAGED_BLOCK_END}\n`;
}

describe('checkReadmeDrift', () => {
  test('passes when block matches rendered contract', () => {
    const { renderContract } = require('../../src/renderer');
    const expected = renderContract(BASE_CONFIG);
    const readme = wrapBlock(expected);
    expect(checkReadmeDrift(readme, BASE_CONFIG)).toHaveLength(0);
  });

  // Regression: a CRLF checkout of an unchanged README used to fail readme-drift, so the
  // gate went red on every fresh clone on Windows.
  test('passes when the block is byte-identical but checked out with CRLF endings', () => {
    const { renderContract } = require('../../src/renderer');
    const readme = wrapBlock(renderContract(BASE_CONFIG)).replace(/\n/g, '\r\n');
    expect(checkReadmeDrift(readme, BASE_CONFIG)).toHaveLength(0);
  });

  test('still fails on real drift when the file uses CRLF endings', () => {
    const readme = wrapBlock('Mode: strict\n\nOutdated.').replace(/\n/g, '\r\n');
    expect(checkReadmeDrift(readme, BASE_CONFIG)).toHaveLength(1);
  });

  test('passes when no managed block present (absent = not a violation)', () => {
    const readme = '# Specs\n\nNo managed block here.\n';
    expect(checkReadmeDrift(readme, BASE_CONFIG)).toHaveLength(0);
  });

  test('fails when managed block content differs from rendered contract', () => {
    const staleBlock = 'Mode: strict\n\nThis is outdated content that does not match.';
    const readme = wrapBlock(staleBlock);
    const v = checkReadmeDrift(readme, BASE_CONFIG);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('readme-drift');
  });
});
