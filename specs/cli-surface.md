---
capability: cli-surface
last-updated: 2026-06-15
---

# Cli Surface

## Overview

The cli-surface is the `spec-lint` command-line entry point: a verb dispatcher over
`lint`, `fix`, `new`, and `init`, with a bare `spec-lint [path]` defaulting to lint.
It parses flags (`--strict`, `--lenient`, `--explain`, `--json`, `--fix`, `--release`,
`--specs`), enforces a read-only boundary on lint, and maps outcomes to exit codes 0
(pass), 1 (fail), and 2 (usage). It also defines the package's public programmatic API
re-exported from `src/index.js`.

## Behavior

- The dispatcher recognizes four verbs (`lint`, `fix`, `new`, `init`) and routes the
  first argument when it matches one of them (src/cli.js:15; src/cli.js:128-136).
- A bare invocation with no recognized verb falls back to lint, treating all arguments
  as lint flags and positionals (src/cli.js:130-132; src/cli.js:136).
- `parseArgs` consumes `--release <value>` and `--specs <a,b,c>` as value flags (splitting
  specs on commas and trimming), treats any other `--name` as a boolean true, maps `-h` to
  help, and collects the rest as positionals (src/cli.js:21-41).
- The specs directory resolves from the first positional, defaulting to `./specs`
  (src/cli.js:43-45; src/cli.js:67).
- `lint` is read-only: it loads config and runs the linter without writing, then prints
  human output via the formatter or, with `--json`, a JSON report (src/cli.js:67-81).
- `--fix` on lint does not mutate; it writes
  "lint does not mutate. Run 'spec-lint fix [path]' to repair." to stderr and returns exit
  2, redirecting the user to the `fix` verb (src/cli.js:63-66).
- `--explain` prints the rendered contract for the loaded config and returns 0 without
  linting (src/cli.js:69-72).
- Mode defaults to the config mode (or strict), with `--strict` and `--lenient` overriding;
  `--lenient` is the last override checked (src/cli.js:73-75).
- `--json` is a read-only path that prints `toJsonReport` output but preserves the same
  exit code as the human run: the report's level and pass/fail track the mode, and exit
  stays driven by violations in strict mode (src/cli.js:77-85; src/json-output.js:17-56).
- Lint returns exit 1 only when mode is strict and there is at least one per-file or
  cross-file violation; otherwise it returns 0, so lenient mode never fails
  (src/cli.js:82-85).
- `new change <slug>` requires `--release` and a slug, erroring to stderr with exit 2 when
  either is missing, then scaffolds the change record via `newChange` (src/cli.js:88-103).
- Plain `new <capability>` requires a capability positional, erroring to stderr with exit 2
  when absent, then scaffolds the spec via `newCapability` (src/cli.js:104-112).
- `fix` and `init` resolve their target path and delegate to the respective command,
  returning 0 on success or 1 on failure; `init` also prints wiring lines
  (src/cli.js:115-126).
- `--help` (or `-h`) on lint prints usage and returns 0 (src/cli.js:34; src/cli.js:47-62).
- The process exit code is the return value of `main` (src/cli.js:139).
- The public API re-exports the linter, config loader, formatter, renderer helpers, base
  config, templates, index table, JSON reporter, and the four command functions from
  `src/index.js` (src/index.js:16-34).
- The `bin` field maps the `spec-lint` command to `src/cli.js`, and `main` points programmatic
  consumers at `src/index.js` (package.json:5-8).

## Rejected and Reverted

- None on record.

## Change Log

- 2026-06-14: verb dispatcher and the lint --fix redirect nudge added in @tapestry-mud/spec-lint@0.2.0 (changes/2026-06-14-authoring-agent-surface.md)
