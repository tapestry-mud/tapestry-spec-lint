'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { init } = require('../../src/commands/init');
const { renderManagedBlock } = require('../../src/renderer');
const { loadConfig } = require('../../src/config');
const pkg = require('../../package.json');

function bareRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sl-init-'));
}

describe('init', () => {
  test('creates specs/, lenient config, managed block, empty index', () => {
    const repo = bareRepo();
    init(repo);
    const specsDir = path.join(repo, 'specs');
    expect(fs.existsSync(specsDir)).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(specsDir, 'lint.config.json'), 'utf8'))).toEqual({ mode: 'lenient' });
    const readme = fs.readFileSync(path.join(specsDir, 'README.md'), 'utf8');
    expect(readme).toContain(renderManagedBlock(loadConfig(specsDir)));
    expect(readme).toContain('| Capability | File | Last Updated |');
    fs.rmSync(repo, { recursive: true });
  });

  test('prints (does not perform) the wiring and the next step', () => {
    const repo = bareRepo();
    const res = init(repo);
    const printed = res.wiring.join('\n');
    expect(printed).toContain(`"@tapestry-mud/spec-lint": "${pkg.version}"`);
    expect(printed).toContain('npm run spec-lint');
    expect(printed).toMatch(/spec-lint new <capability>/);
    // wiring is printed only: no package.json or workflow written
    expect(fs.existsSync(path.join(repo, 'package.json'))).toBe(false);
    expect(fs.existsSync(path.join(repo, '.github'))).toBe(false);
    fs.rmSync(repo, { recursive: true });
  });

  test('does not scaffold a first capability spec', () => {
    const repo = bareRepo();
    init(repo);
    const stray = fs.readdirSync(path.join(repo, 'specs')).filter(f => f.endsWith('.md') && f !== 'README.md');
    expect(stray).toEqual([]);
    fs.rmSync(repo, { recursive: true });
  });

  test('is idempotent: re-running does not clobber an edited config or duplicate the block', () => {
    const repo = bareRepo();
    init(repo);
    const cfgPath = path.join(repo, 'specs', 'lint.config.json');
    fs.writeFileSync(cfgPath, JSON.stringify({ mode: 'strict' }));
    init(repo);
    expect(JSON.parse(fs.readFileSync(cfgPath, 'utf8'))).toEqual({ mode: 'strict' });
    const readme = fs.readFileSync(path.join(repo, 'specs', 'README.md'), 'utf8');
    expect(readme.match(/<!-- spec-lint:start -->/g)).toHaveLength(1);
    fs.rmSync(repo, { recursive: true });
  });
});
