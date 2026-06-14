'use strict';

const { BASE_CONFIG } = require('./base-config');

function slugToTitle(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripDate(slug) {
  return slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function renderCapabilitySpec(slug, lastUpdated, effectiveConfig) {
  const cfg = effectiveConfig || BASE_CONFIG;
  const sections = cfg.sections || BASE_CONFIG.sections;
  const sentinel = cfg.sentinelText || BASE_CONFIG.sentinelText;
  const lines = [
    '---',
    `capability: ${slug}`,
    `last-updated: ${lastUpdated}`,
    '---',
    '',
    `# ${slugToTitle(slug)}`,
    '',
  ];
  for (const section of sections) {
    lines.push(`## ${section}`, '');
    if (section === 'Rejected and Reverted') {
      lines.push(sentinel, '');
    }
  }
  return lines.join('\n').replace(/\s*$/, '\n');
}

function renderChangeRecord(slug, release, specsList, effectiveConfig) {
  const specs = (specsList || []).join(', ');
  const lines = [
    '---',
    `release: ${release || ''}`,
    `specs: [${specs}]`,
    '---',
    '',
    `# ${slugToTitle(stripDate(slug))}`,
    '',
    '## Why',
    '',
    '## What',
    '',
  ];
  return lines.join('\n').replace(/\s*$/, '\n');
}

module.exports = { renderCapabilitySpec, renderChangeRecord, slugToTitle, stripDate };
