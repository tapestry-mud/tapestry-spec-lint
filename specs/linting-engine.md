---
capability: linting-engine
last-updated: 2026-06-15
---

# Linting Engine

## Overview

The linting engine is the deterministic checker core of spec-lint. It reads a specs/ directory, parses each capability spec into frontmatter and named sections, and runs a fixed set of checks that enforce the capability-spec contract: required frontmatter, required sections, anchored Behavior bullets, the Rejected and Reverted sentinel, Change Log shape, and cross-file invariants tying specs to the README index and to change records. The engine is mode-agnostic and read-only: it always collects every violation it finds and returns them as data. Severity (whether a violation fails a gate) and presentation are decided outside the core, by the CLI and formatter.

## Behavior

- The effective ruleset is the BASE_CONFIG (the four required sections Overview / Behavior / Rejected and Reverted / Change Log, the Behavior anchor regex, the sentinel text "- None on record.", defaultMode strict, and an empty `exclude` list) (src/base-config.js:3-14) merged with a per-repo override read from `lint.config.json` in the specs directory, where each field falls back to base when absent and `exclude` is taken from the repo only when it is an array (src/config.js:7-25).
- The `exclude` list names files to drop from capability discovery, each entry an exact filename or a simple glob where `*` matches any run of characters, matched (anchored) against the file name relative to the specs dir (src/exclude.js:8-23).
- Section overrides can either replace the whole list (an array) or append to the base list (a `{ extra: [...] }` object); a missing `sections` key keeps the base four (src/config.js:26-31).
- `lint(specsDir, effectiveConfig)` enumerates the specs directory, treats every `.md` file except `README.md` and any file matching the effective `exclude` list as a capability spec, and parses each into `{ path, content, frontmatter, sections }` so excluded files are never run through the per-file checks (src/engine.js:17-32).
- It also loads `README.md` (empty string if absent) and every `.md` under a `changes/` subdirectory, splitting each change filename into a leading `YYYY-MM-DD` date and a trailing slug and parsing its frontmatter (src/engine.js:32-55).
- It returns `{ specs, fileResults, crossFileViolations }`: `fileResults` maps each spec path to its per-file violations, and `crossFileViolations` is a flat list from the four cross-file checks (src/engine.js:57-75).
- Per-file frontmatter check: the spec must have a `---` block; `capability` is required and must equal the file slug; `last-updated` is required and must be a `YYYY-MM-DD` date (src/checks/frontmatter.js:6-25).
- Per-file sections check: every section name in the effective config must be present as an `## ` heading (src/checks/sections.js:5-15).
- Per-file behavior check: if a Behavior section exists, its text must contain at least one substring matching the pinned anchor regex; a missing Behavior section is left to the sections check (src/checks/behavior.js:5-19).
- Per-file sentinel check: an empty Rejected and Reverted section (no real `- ` bullet other than the sentinel) must contain exactly the configured sentinel text; once a real tombstone bullet is present the sentinel is no longer required (src/checks/sentinel.js:5-24).
- Per-file changelog check: a non-empty Change Log must be a list not a table (no `|` rows), and its dated `- YYYY-MM-DD` entries must be newest-first; a seeded-empty Change Log is valid (src/checks/changelog.js:5-34).
- Cross-file index-sync check: README index rows and on-disk specs must be in one-to-one correspondence, and each spec's index date must equal its frontmatter `last-updated`; excluded files are skipped in both directions, so an excluded file is neither required in the index nor flagged when it appears there (src/checks/index-sync.js:28-62).
- Cross-file currency check: for each capability named by a change record, it finds the latest record date; if the spec's Change Log is empty, or its top entry references none of that date's slugs, or its `last-updated` predates the record, that is a violation; capabilities with no record are left alone (src/checks/currency.js:5-62).
- Cross-file tombstone check: any change record with frontmatter `status: reverted` requires the specs it names to carry at least one real tombstone bullet (a `- ` line other than the sentinel) in Rejected and Reverted (src/checks/tombstone.js:5-32).
- Cross-file readme-drift check: if the README contains a spec-lint managed block, its content must match the block rendered from the effective ruleset; an absent block is not a violation (src/checks/readme-drift.js:5-19).
- Frontmatter parsing extracts a leading `---` block and reads each line as either a `key: [a, b]` list or a `key: scalar`; section parsing strips the frontmatter, splits the body on `## ` headings, trims each section, and skips bare `---` thematic breaks so dividers are not mistaken for content (src/parser.js:3-45).
- The engine never decides pass/fail. Strict-versus-lenient is resolved at the CLI: violations only force a nonzero exit in strict mode, while lenient always exits 0 (src/cli.js:73-85).

## Rejected and Reverted

- None on record.

## Change Log

- 2026-06-15: config `exclude` skips named files/globs from capability discovery and index-sync in @tapestry-mud/spec-lint@0.2.2 (changes/2026-06-15-config-exclude-option.md)
- 2026-06-14: anchor regex accepts .md files for Behavior anchors in @tapestry-mud/spec-lint@0.2.1 (changes/2026-06-14-anchor-regex-md-and-files-allowlist.md)
