'use strict';

const { BASE_CONFIG } = require('./base-config');
const { normalizeEol } = require('./eol');

const MANAGED_BLOCK_START = '<!-- spec-lint:start -->';
const MANAGED_BLOCK_END = '<!-- spec-lint:end -->';

function renderContract(effectiveConfig) {
  const sections = effectiveConfig.sections || BASE_CONFIG.sections;
  const anchorRegex = effectiveConfig.anchorRegex || BASE_CONFIG.anchorRegex;
  const sentinelText = effectiveConfig.sentinelText || BASE_CONFIG.sentinelText;
  const mode = effectiveConfig.mode || BASE_CONFIG.defaultMode;
  const exclude = effectiveConfig.exclude || BASE_CONFIG.exclude;

  const lines = [
    `Mode: ${mode}`,
    '',
    `Required sections: ${sections.join(', ')}`,
    '',
    `Anchor regex (Behavior): ${anchorRegex}`,
    '',
    `Empty-reversal sentinel: ${sentinelText}`,
    '',
    'Change Log: list, newest-first by date, not a table. Empty is valid for unmodified capabilities.',
    '',
    'Index sync: every capability .md on disk appears in README index; every indexed file exists on disk; index date matches file last-updated.',
    '',
    'Currency: for each change record naming a capability, the top Change Log entry references that record and last-updated >= record date. A capability named by zero records may have an empty Change Log.',
    '',
    'Tombstone: a change record with status:reverted requires a tombstone entry in the capability Rejected and Reverted (not the empty sentinel).',
  ];

  // Only rendered when off, so a repo on the default sees an unchanged contract.
  if (effectiveConfig.anchorResolve === false) {
    lines.push('', 'Anchor resolution: disabled - anchors are checked for presence only.');
  } else {
    lines.push(
      '',
      'Anchor resolution: every Behavior anchor must resolve - the target file exists and the line or range is within it. A line number cannot prove it still points at the right code, so prefer symbol and test-name anchors; :line is a disposable hint.',
    );
  }

  // Only rendered when set, so a repo with no exclude sees an unchanged contract.
  if (exclude && exclude.length > 0) {
    lines.push('', `Excluded from capability checks: ${exclude.join(', ')}`);
  }

  return lines.join('\n');
}

function renderManagedBlock(effectiveConfig) {
  return `${MANAGED_BLOCK_START}\n${renderContract(effectiveConfig)}\n${MANAGED_BLOCK_END}`;
}

function extractManagedBlock(readmeContent) {
  const startIdx = readmeContent.indexOf(MANAGED_BLOCK_START);
  const endIdx = readmeContent.indexOf(MANAGED_BLOCK_END);
  if (startIdx === -1 || endIdx === -1) { return null; }
  // Normalized so a CRLF checkout of an unchanged README does not read as drift.
  return normalizeEol(
    readmeContent.slice(startIdx + MANAGED_BLOCK_START.length, endIdx),
  ).trim();
}

module.exports = { renderContract, renderManagedBlock, extractManagedBlock, MANAGED_BLOCK_START, MANAGED_BLOCK_END };
