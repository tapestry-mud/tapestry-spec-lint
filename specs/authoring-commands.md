---
capability: authoring-commands
last-updated: 2026-06-15
---

# Authoring Commands

## Overview

Authoring commands are the write surface of spec-lint: the four subcommands that
create, adopt, and repair the specs/ tree. They are the only paths that mutate
files (lint is strictly read-only). Each one is a thin command wrapper over shared
engines - the single-source scaffold templates and the index-table engine - so that
every generated artifact is born conformant to the same contract the linter checks.
The repair and adoption commands are idempotent, and every generator refuses to
overwrite an existing file.

## Behavior

- `new <slug>` scaffolds a new capability spec and refuses to overwrite an existing one: it returns an error if `specs/<slug>.md` already exists, otherwise writes the spec from the template and indexes it (src/commands/new.js:9-30).
- The scaffold a `new` capability produces is single-source from the config: it renders frontmatter, the four required sections in order, and the empty-reversal sentinel under Rejected and Reverted, drawn from `cfg.sections` and `cfg.sentinelText` (src/templates.js:17-37; src/commands/new.js:14-15).
- After writing the spec, `new` appends an index row to the README using the shared engine and titleizes the slug for the capability cell, then prints the next step (fill a Behavior anchor, run spec-lint) (src/commands/new.js:17-29; src/index-table.js:74-84).
- `new change <slug>` is the sole change-record generator: it date-prepends the slug when undated (matches `YYYY-MM-DD-` else prepends today), creates `specs/changes/`, and writes `specs/changes/<dated>.md` (src/commands/new-change.js:8-26).
- `new change` refuses to overwrite an existing change record, returning an error if the dated file already exists (src/commands/new-change.js:15-17).
- The change record carries `--release` and `--specs` into its frontmatter (`release:` and the `specs: [...]` list); its body is fixed (Why / What) and is not config-driven (src/commands/new-change.js:19-21; src/templates.js:39-56).
- `fix` performs three mechanical repairs and is idempotent, reporting "nothing to fix" when the tree is already clean (src/commands/fix.js:35-71).
- Repair 1 inserts the sentinel only into a Rejected and Reverted section that is present and empty; a missing section or a non-empty one is left untouched (src/commands/fix.js:14-23, src/commands/fix.js:44-51).
- Repair 2 regenerates the README managed block in place between its start and end markers, or appends a fresh block if the markers are absent (src/commands/fix.js:25-33, src/commands/fix.js:54-56).
- Repair 3 reconciles the index from disk while preserving curated order: surviving rows keep their position and capability cell with only the date refreshed, ghost rows drop out, and genuinely-new disk files append at the end (the index engine never re-sorts a curated table) (src/index-table.js:86-115, src/index-table.js:41-44).
- `fix` never touches `lint.config.json` and never invents prose: it only writes the sentinel, the managed block, and reconciled index rows, all mechanical (src/commands/fix.js:35-66).
- `init` adopts the contract idempotently: it creates `specs/` if missing and writes `lint.config.json` with `{mode: lenient}` only when the file does not already exist (src/commands/init.js:15-27).
- `init` seeds the README with an empty index table and the managed block, each guarded so a re-run leaves an already-seeded README unchanged (src/commands/init.js:29-41; src/index-table.js:14-16).
- `init` prints the devDependency, npm-script, and CI wiring rather than performing it, and does not scaffold a first capability (src/commands/init.js:43-60).
- `init` prints the `new <capability>` next step as the final wiring line (src/commands/init.js:57).

## Rejected and Reverted

- None on record.

## Change Log

- 2026-06-14: new, new change, fix, and init verbs added in @tapestry-mud/spec-lint@0.2.0 (changes/2026-06-14-authoring-agent-surface.md)
