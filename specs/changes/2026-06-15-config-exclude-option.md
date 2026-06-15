---
release: @tapestry-mud/spec-lint@0.2.2
specs: [linting-engine.md, output-rendering.md, authoring-commands.md]
---

# Config Exclude Option

## Why

The linter discovers a capability as every top-level `specs/*.md` except `README.md`. A meta
file that legitimately lives alongside the capabilities - a validation ledger, a design note -
was therefore linted as a malformed capability (no `capability:` frontmatter, wrong sections)
and flagged by index-sync as "on disk but not in index." A real adopter hit this and had to
relocate their ledger out of `specs/` as a workaround. There was no way to keep a non-capability
file in the specs tree.

## What

- `lint.config.json` gains an `exclude` array (default `[]` in base-config). Each entry is an
  exact filename or a simple glob where `*` matches any run of characters, matched against the
  file name relative to the specs dir (src/exclude.js, src/base-config.js, src/config.js).
- Discovery skips excluded files in all three discovery sites, so they are never treated as
  capabilities: the linter core (src/engine.js), the index-rebuild in `fix` (src/commands/fix.js),
  and the per-file checks that run off the discovered set.
- index-sync respects exclude in both directions: an excluded file is not required in the README
  index and an excluded entry that does appear in the index is not flagged as missing from disk
  (src/checks/index-sync.js).
- The exclude list renders into the README managed block as a single line, but only when it is
  non-empty, so a repo with no exclude sees an unchanged contract and the readme-drift check still
  covers the exclude when set (src/renderer.js). renderContract, the readme-drift check, and `fix`
  all read the same rendered contract, so they stay in agreement.

Scope is the top-level capability glob only; `changes/` records are discovered separately and are
out of scope. README.md remains excluded implicitly. The npm package and plugin both bump to
0.2.2.
