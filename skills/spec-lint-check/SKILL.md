---
name: spec-lint-check
description: Use when gating Tapestry capability specs (pre-commit, CI, ship) - run spec-lint to check the specs/ tree read-only, with --strict / --lenient / --explain / --json. lint never writes; --fix redirects to spec-lint fix. Triggers - "lint the specs", "spec-lint check", "gate the specs", "spec-lint --json".
---

# spec-lint-check

The deterministic gate: markdown in, pass/fail out, zero model judgment. CLI is `spec-lint`.

## Run it

`spec-lint [path]` (path defaults to `./specs`). Read-only - it never writes.

- `--strict` exits 1 on any violation (the real signal).
- `--lenient` warns and exits 0 (a repo still adopting).
- `--explain` prints the effective contract (base ruleset merged with `specs/lint.config.json`).
  That printed block is the source of truth for the contract.
- `--json` emits machine-readable results instead of the human OK/FAIL/WARN lines: one entry
  per file with its violations, each carrying a `level` (`ERROR` in strict, `WARNING` in
  lenient), the rule id, the file path, and the detail, plus a top-level summary with the
  totals and the effective mode. Read-only and opt-in; the pass/fail matches the human run.
  Use it from CI and agents instead of scraping text.

## Read-only vs mutating

`lint` never writes. Reaching for `--fix` (eslint muscle memory) errors with a redirect:
run `spec-lint fix` instead (see spec-lint-fix). lint never writes, fix always writes.

## When to run

- Before commit and in CI: `spec-lint specs/` (or `npm run spec-lint`); `--json` for tooling.
- At ship time as the final gate.
