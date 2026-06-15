---
capability: output-rendering
last-updated: 2026-06-15
---

# Output Rendering

## Overview

Output rendering turns lint results and the effective config into read-only views. Three
modules cover it: the human formatter prints per-file OK/FAIL/WARN lines plus a summary, the
JSON reporter emits a machine-readable shape with a mode-aware level and totals, and the
renderer prints the contract managed block that --explain shows and that init/fix write into
the README. None of these modules mutate specs; they only render.

## Behavior

- The human formatter walks fileResults and prints `OK  <rel>` for a file with zero violations, otherwise one line per violation as `<label>  <rel>  <rule>: <detail>` (src/formatter.js:11-21).
- The line label is mode-driven: `FAIL` in strict, `WARN` in lenient (src/formatter.js:9).
- File paths are rendered relative to the specs dir via path.relative (src/formatter.js:12; src/formatter.js:24).
- Cross-file violations render after the per-file lines, prefixing the relative file only when v.file is set, else just `<rule>: <detail>` (src/formatter.js:23-27).
- The trailing summary line counts files and violations: `N files, 0 violations` when clean, `N files, M failures` in strict, or `N files, M warnings (lenient: not blocking)` in lenient (src/formatter.js:29-36).
- The JSON reporter maps mode to a per-violation level: `ERROR` in strict, `WARNING` otherwise (src/json-output.js:5-7).
- Each per-file violation is rendered as an object with level, rule, file (relative), and detail, where detail falls back to v.message or '' (src/json-output.js:27-35).
- Files with zero violations are skipped from the JSON files array (src/json-output.js:22-24).
- Cross-file violations render into a separate top-level crossFile array with the same level/rule/file/detail shape (src/json-output.js:37-43).
- The top-level report carries mode plus a summary of files (count of file entries), violations (per-file total plus cross-file), and passed; passed is `total === 0` in strict but always true in lenient (src/json-output.js:45-56).
- The contract renders from the effective config, falling back to BASE_CONFIG for each field, as lines for mode, required sections, the Behavior anchor regex, and the empty-reversal sentinel (src/renderer.js:8-22; src/base-config.js:3-13).
- The contract also states the Change Log, index-sync, currency, and tombstone rules as fixed prose lines (src/renderer.js:23-30).
- renderManagedBlock wraps the contract between the start and end markers (src/renderer.js:33-35), which are `<!-- spec-lint:start -->` and `<!-- spec-lint:end -->` (src/renderer.js:5-6).
- extractManagedBlock returns the trimmed text between the markers, or null when either marker is absent (src/renderer.js:37-42).
- The CLI prints the live ruleset for --explain by calling renderContract on the loaded config and returning early before linting (src/cli.js:69-72), and selects JSON vs human output via --json (src/cli.js:77-81).

## Rejected and Reverted

- None on record.

## Change Log

- 2026-06-14: lint --json structured output added in @tapestry-mud/spec-lint@0.2.0 (changes/2026-06-14-authoring-agent-surface.md)
