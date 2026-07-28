'use strict';

const fs = require('fs');
const path = require('path');

const plugin = require('../.claude-plugin/plugin.json');
const marketplace = require('../.claude-plugin/marketplace.json');

describe('CC plugin manifests', () => {
  // Neither manifest carries a version on purpose. With version unset, Claude Code falls back
  // to the git commit SHA, so adopters track the branch instead of waiting on a bump they
  // cannot see. Setting it would pin the plugin and serve a cached copy until it changed.
  test('neither manifest pins a version', () => {
    expect(plugin.version).toBeUndefined();
    expect(marketplace.plugins.every(p => p.version === undefined)).toBe(true);
  });

  test('plugin.json has a name and description', () => {
    expect(plugin.name).toBe('spec-lint');
    expect(typeof plugin.description).toBe('string');
    expect(plugin.description.length).toBeGreaterThan(0);
  });

  test('marketplace.json self-hosts the plugin with source "."', () => {
    expect(marketplace.plugins.some(p => p.name === 'spec-lint' && p.source === '.')).toBe(true);
  });

  test('every command-aligned skill ships with valid frontmatter', () => {
    const names = [
      'spec-lint-init',
      'spec-lint-new-spec',
      'spec-lint-new-change',
      'spec-lint-fix',
      'spec-lint-check',
    ];
    for (const name of names) {
      const skillPath = path.join(__dirname, '..', 'skills', name, 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
      const skill = fs.readFileSync(skillPath, 'utf8');
      expect(skill.startsWith('---')).toBe(true);
      expect(skill).toMatch(new RegExp(`name:\\s*${name}`));
      expect(skill).toMatch(/description:/);
    }
  });
});
