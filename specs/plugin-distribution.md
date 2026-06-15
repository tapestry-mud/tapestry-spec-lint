---
capability: plugin-distribution
last-updated: 2026-06-15
---

# Plugin Distribution

## Overview

The repo ships as a self-hosted Claude Code plugin: it is both the marketplace and
the single plugin that marketplace lists. The plugin bundles five command-aligned
skills, one per spec-lint subcommand, so an agent that adds the marketplace and
installs the plugin gets init, new-spec, new-change, fix, and check guidance in
context. The plugin version mirrors the npm package version, and a test suite
asserts the manifest shape and the presence of all five skills.

## Behavior

- The plugin manifest declares name `spec-lint`, a description, and a version (.claude-plugin/plugin.json), and a test asserts the name is `spec-lint` with a non-empty string description (tests/plugin.test.js:15-19).
- The marketplace manifest names itself `tapestry-spec-lint`, sets owner `tapestry-mud`, and lists one plugin (.claude-plugin/marketplace.json).
- That single plugin entry uses `source: "."`, which makes the repo serve as both the marketplace and the plugin it hosts; a test asserts a plugin named `spec-lint` with `source === "."` is present (tests/plugin.test.js:21-23).
- The plugin version mirrors the npm package version: both read `0.2.0`, and a test asserts `plugin.version` equals `pkg.version` (tests/plugin.test.js:11-13).
- Five command-aligned skills ship with the plugin, each scoped to one spec-lint subcommand, and a test loads all five SKILL.md files and asserts each starts with frontmatter carrying a matching `name:` and a `description:` (tests/plugin.test.js:25-41).
- The five skill slugs the test enumerates are `spec-lint-init`, `spec-lint-new-spec`, `spec-lint-new-change`, `spec-lint-fix`, and `spec-lint-check` (tests/plugin.test.js:26-32).
- spec-lint-init covers first-time adoption (scaffold specs/, lenient config, README managed block, empty index, wiring), per its enumerated slug (tests/plugin.test.js:27).
- spec-lint-new-spec covers authoring a born-conformant capability spec, per its enumerated slug (tests/plugin.test.js:28).
- spec-lint-new-change covers scaffolding a change record, the sole change-record generator, per its enumerated slug (tests/plugin.test.js:29).
- spec-lint-fix covers bounded mechanical repair (resync README, insert sentinel, rebuild index), per its enumerated slug (tests/plugin.test.js:30).
- spec-lint-check covers the read-only lint gate with strict/lenient/explain/json modes, per its enumerated slug (tests/plugin.test.js:31).
- The same manifests and skills ship inside the npm package `@tapestry-mud/spec-lint`: package.json declares no `files` allowlist and the repo has no .npmignore, so the `.claude-plugin/` manifests and the `skills/` tree are published with the package, not held back as plugin-only artifacts (package.json).
- An agent adopts the plugin by adding the marketplace then installing the listed plugin; the marketplace `name` (`tapestry-spec-lint`) and the plugin entry `name` (`spec-lint`) with `source: "."` are the fields the `/plugin marketplace add` and `/plugin install` commands resolve against (.claude-plugin/marketplace.json).

## Rejected and Reverted

- None on record.

## Change Log

- 2026-06-14: five command-aligned skills and the self-hosted plugin marketplace added in @tapestry-mud/spec-lint@0.2.0 (changes/2026-06-14-authoring-agent-surface.md)
