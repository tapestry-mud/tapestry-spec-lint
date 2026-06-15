---
release: @tapestry-mud/spec-lint@0.2.1
specs: [linting-engine.md, plugin-distribution.md]
---

# Anchor Regex Md And Files Allowlist

## Why

Surfaced by adopting the contract on this repo itself. Two gaps showed up the moment the
linter had to document its own Markdown-shaped artifacts and ship a clean package:

- The Behavior anchor regex omitted `md`, so a capability whose primary artifacts are
  Markdown files (the five SKILL.md skills, any docs-shaped capability) could not cite them
  and had to anchor sideways to a test that merely proves the file exists.
- package.json had no `files` allowlist and no .npmignore, so the npm tarball shipped
  everything not git-ignored - now including the freshly added `specs/` and `tests/` trees.

## What

- Added `md` to the anchor extension group in the base ruleset, so `(skills/x/SKILL.md)`
  and `(README.md)` are valid Behavior anchors. The rendered managed block and every
  adopting repo's contract update on the next `spec-lint fix`.
- Added a `files` allowlist to package.json (`src`, `.claude-plugin`, `skills`, `README.md`),
  so the tarball ships the linter and the plugin artifacts but not `specs/` or `tests/`.

No behavior change to the checks themselves beyond the wider anchor match; lenient/strict,
the nine checks, and the authoring commands are untouched.
