---
release: @tapestry-mud/spec-lint@0.2.0
specs: [authoring-commands.md, output-rendering.md, plugin-distribution.md, cli-surface.md]
---

# Authoring Agent Surface

## Why

v1 was the deterministic checker only: markdown in, pass/fail out. It told you a spec
was broken but did nothing to stop specs from being born broken or to repair the drift
it found. The first v1 run proved the gap - 15 specs were missing the empty-reversal
sentinel purely because they were hand-authored against a contract a human eyeballed.
A checker without an authoring surface just relocates the toil.

## What

Added the create / adopt / repair legs the checker was missing, plus an agent-facing
distribution:

- Four authoring verbs: `new <capability>` and `new change <slug>` scaffold
  born-conformant specs and change records from the package templates; `fix` performs
  bounded mechanical repair (resync the README managed block, insert a missing
  sentinel, rebuild the index from disk); `init` adopts a repo in one idempotent
  command and prints the lockfile/CI wiring it will not perform.
- `lint` gained a `--fix` redirect nudge (lint stays read-only and points the caller
  at `fix`) and `--json` structured output (per-file violations with an ERROR/WARNING
  level, plus a summary) so CI and agents consume results without scraping text.
- Five command-aligned skills (`spec-lint-init`, `-new-spec`, `-new-change`, `-fix`,
  `-check`) ship via a self-hosted Claude Code plugin marketplace in this repo, so an
  agent authoring a spec reaches for the commands rather than hand-rolling markdown.

Every template and managed block renders from the one package base, so nothing drifts;
the only hand-authored file is each repo's `lint.config.json`.
