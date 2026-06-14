#!/usr/bin/env node
'use strict';

const path = require('path');
const { lint } = require('./engine');
const { loadConfig } = require('./config');
const { formatResults } = require('./formatter');
const { toJsonReport } = require('./json-output');
const { renderContract } = require('./renderer');
const { newCapability } = require('./commands/new');
const { newChange } = require('./commands/new-change');
const { fix } = require('./commands/fix');
const { init } = require('./commands/init');

const VERBS = new Set(['lint', 'fix', 'new', 'init']);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(args) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--release') {
      flags.release = args[i + 1];
      i++;
    } else if (a === '--specs') {
      flags.specs = (args[i + 1] || '').split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (a.startsWith('--')) {
      flags[a.slice(2)] = true;
    } else if (a === '-h') {
      flags.help = true;
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

function resolveSpecsDir(p) {
  return path.resolve(p || './specs');
}

function printHelp() {
  console.log([
    'Usage:',
    '  spec-lint [path] [--strict|--lenient] [--explain|--json]   gate specs/ (read-only)',
    '  spec-lint fix [path]                                mechanical repairs',
    '  spec-lint new <capability> [path]                   scaffold a capability spec',
    '  spec-lint new change <slug> --release <ver> --specs a.md,b.md [path]',
    '  spec-lint init [path]                               adopt the tooling in a repo',
  ].join('\n'));
}

function runLint(flags, positionals) {
  if (flags.help) {
    printHelp();
    return 0;
  }
  if (flags.fix) {
    process.stderr.write("lint does not mutate. Run 'spec-lint fix [path]' to repair.\n");
    return 2;
  }
  const specsDir = resolveSpecsDir(positionals[0]);
  const config = loadConfig(specsDir);
  if (flags.explain) {
    console.log(renderContract(config));
    return 0;
  }
  let mode = config.mode || 'strict';
  if (flags.strict) { mode = 'strict'; }
  if (flags.lenient) { mode = 'lenient'; }
  const result = lint(specsDir, config);
  if (flags.json) {
    console.log(JSON.stringify(toJsonReport(specsDir, result, mode), null, 2));
  } else {
    console.log(formatResults(specsDir, result, mode));
  }
  const hasViolations =
    Object.values(result.fileResults).some(vs => vs.length > 0) ||
    result.crossFileViolations.length > 0;
  return (mode === 'strict' && hasViolations) ? 1 : 0;
}

function runNew(flags, positionals) {
  if (positionals[0] === 'change') {
    const slug = positionals[1];
    if (!slug) {
      process.stderr.write('usage: spec-lint new change <slug> --release <ver> --specs a.md,b.md [path]\n');
      return 2;
    }
    const specsDir = resolveSpecsDir(positionals[2]);
    const res = newChange(specsDir, slug, { release: flags.release, specs: flags.specs }, today());
    res.messages.forEach(m => console.log(m));
    return res.ok ? 0 : 1;
  }
  const cap = positionals[0];
  if (!cap) {
    process.stderr.write('usage: spec-lint new <capability> [path]\n');
    return 2;
  }
  const specsDir = resolveSpecsDir(positionals[1]);
  const res = newCapability(specsDir, cap, today());
  res.messages.forEach(m => console.log(m));
  return res.ok ? 0 : 1;
}

function runFix(flags, positionals) {
  const res = fix(resolveSpecsDir(positionals[0]));
  res.messages.forEach(m => console.log(m));
  return 0;
}

function runInit(flags, positionals) {
  const res = init(path.resolve(positionals[0] || '.'));
  res.messages.forEach(m => console.log(m));
  res.wiring.forEach(line => console.log(line));
  return 0;
}

function main() {
  const argv = process.argv.slice(2);
  const hasVerb = VERBS.has(argv[0]);
  const verb = hasVerb ? argv[0] : 'lint';
  const { flags, positionals } = parseArgs(hasVerb ? argv.slice(1) : argv);
  if (verb === 'fix') { return runFix(flags, positionals); }
  if (verb === 'new') { return runNew(flags, positionals); }
  if (verb === 'init') { return runInit(flags, positionals); }
  return runLint(flags, positionals);
}

process.exit(main());
