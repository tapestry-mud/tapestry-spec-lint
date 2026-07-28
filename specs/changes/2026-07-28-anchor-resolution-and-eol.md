---
release: @tapestry-mud/spec-lint@0.3.0
specs: [linting-engine.md, output-rendering.md, plugin-distribution.md, cli-surface.md, authoring-commands.md]
---

# Anchor Resolution and EOL Agnosticism

## Why

Two findings from a real adopter (Atlas-InventoryService, 14 capability specs, 426 Behavior
anchors) that the gate reported as clean.

**Anchors were checked for presence, never resolution.** The behavior check regex-tests that the
Behavior section contains at least one anchor; it never opens the file. Six weeks after the specs
were authored strict-green, the branch was rebased onto a `develop` that had moved 17 commits and
58 `.cs` files. The linter still reported 14/14, zero violations. Measured against that tree:
80 anchors pointed into files that had changed, one anchor's range ended past the end of its file,
and one named a path that no longer existed - the file had moved from `Inventory.Domain/` to
`Inventory.Database/`, meaning the anchor had been wrong since the day it was written and had
passed every run since. A gate that accepts a pointer into the void is not a gate.

**readme-drift failed on any fresh checkout on Windows.** `extractManagedBlock` sliced the raw
README between the markers and compared it to a contract rendered with `\n`. A CRLF checkout of a
byte-identical README therefore read as drift: same content per git, different bytes, instant FAIL.
Adopting this as a PR gate in a Windows shop would have failed the gate on clone, for everyone.

## What

- New check `anchor-resolve` (check 10) opens what the Behavior anchors point at and reports only
  what it can prove: the target does not exist, or the line (or the end of the range) is past the
  end of the file (src/checks/anchor-resolve.js). Targets are resolved from the repo root for code
  and from `specs/` for sibling capability links. A missing target is reported once per target, not
  once per anchor.
- It deliberately does not claim that a line still points at the *right* code - unprovable from a
  line number alone, and the standing argument for preferring symbol and test-name anchors. The
  contract prose says so, so `--explain` and the README managed block carry the guidance
  (src/renderer.js).
- A bare basename (no path separator) is skipped rather than resolved by searching the tree, so the
  result never depends on where a duplicate basename happens to live. Skipped, never flagged.
- `parseAnchors` gives the anchor grammar one home (src/anchors.js): file-only, `:line`, `:from-to`,
  several anchors in one paren separated by `;`, a bare range continuing the previous target, and
  free notes. A part it cannot parse is skipped, so an unfamiliar shape can never become a false
  violation.
- `anchorResolve: false` in `lint.config.json` turns the check off for a repo not ready for it; the
  contract renders the disabled state explicitly so the README always states which gate is in force
  (src/config.js, src/base-config.js, src/renderer.js).
- Line endings are treated as a checkout artifact, never contract content (src/eol.js). Comparisons
  normalize to LF: `extractManagedBlock` normalizes what it extracts, so a CRLF checkout of an
  unchanged README is clean. Writers preserve the host file's existing endings, so `fix` on a CRLF
  README no longer injects LF-only lines and stays idempotent (src/commands/fix.js).

- Hardcoded feature counts are gone from the docs and specs prose - "the ten checks", "five
  command-aligned skills", "four verbs", "three mechanical repairs", "three modules". Every one of
  those was a standing lie waiting for the next feature, and the same class of rot as the literal
  version below. The counts that describe the contract itself rather than a feature set (the four
  required sections) stay, because they only move when the contract moves. Enumerations that earn
  their place - the actual verb and skill names - are kept without the tally.

- `plugin-distribution.md` stated the mirrored version as a literal (`both read 0.2.0`), which was
  false the moment this release bumped. Worth noting the check added here could never have caught
  it: unanchored prose, and no deterministic rule reaches a plain factual assertion.
- The plugin manifests no longer carry a `version` at all, which removes that claim rather than
  restating it. Per the Claude Code plugin reference, `version` in `plugin.json` is optional and
  setting it *pins* the plugin - adopters keep a cached copy until the string is bumped, and pushing
  commits alone does not reach them. Unset, Claude Code falls back to the git commit SHA, so an
  adopter tracks the branch. The docs recommend exactly this for a plugin under active development.
  A test now asserts both manifests stay unset. The npm package keeps its semantic version, since
  that is the artifact a repo pins in `devDependencies`.

Adopters on 0.2.x will see the README managed block go stale on upgrade, because the contract gained
the anchor-resolution line - `spec-lint fix` resyncs it. They should also expect new `anchor-resolve`
failures on first run; those are the point.

Version: 0.3.0. Breaking, and under 0.x that is the minor - a repo upgrading with no config change
gets new failures on specs that passed before, which is a gate behavior change even though no API
moved. The `anchorResolve: false` escape hatch exists so adoption can be staged rather than blocked.
