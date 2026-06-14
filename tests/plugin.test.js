'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const plugin = require('../.claude-plugin/plugin.json');
const marketplace = require('../.claude-plugin/marketplace.json');

describe('CC plugin manifests', () => {
  test('plugin.json version mirrors package.json', () => {
    expect(plugin.version).toBe(pkg.version);
  });

  test('plugin.json has a name and description', () => {
    expect(plugin.name).toBe('spec-lint');
    expect(typeof plugin.description).toBe('string');
    expect(plugin.description.length).toBeGreaterThan(0);
  });

  test('marketplace.json self-hosts the plugin with source "."', () => {
    expect(marketplace.plugins.some(p => p.name === 'spec-lint' && p.source === '.')).toBe(true);
  });

  test('all five command-aligned skills ship with valid frontmatter', () => {
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
