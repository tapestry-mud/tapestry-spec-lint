---
name: spec-lint-new-spec
description: Use when authoring a new Tapestry capability spec - run spec-lint new <capability> to scaffold a born-conformant spec (frontmatter, four sections, sentinel, index row), then fill the Behavior anchors. Triggers - "author a capability spec", "spec-lint new", "new spec", "write a current-state spec".
---

# spec-lint-new-spec

Scaffold a born-conformant capability spec, then author its content. CLI is `spec-lint`.

## Run it

`spec-lint new <capability> [path]` writes `specs/<capability>.md` from the package
template and appends the matching index row to `specs/README.md`. It refuses to
overwrite an existing slug. The scaffold is structurally lint-clean out of the box;
only authored content remains.

## The contract you are filling

A capability spec is `specs/<slug>.md` with:

- Frontmatter: `capability: <slug>` (matches the filename) and `last-updated: YYYY-MM-DD`.
- Four sections: `## Overview`, `## Behavior`, `## Rejected and Reverted`, `## Change Log`.
- Behavior carries at least one inline anchor, e.g. `(src/CommandRouter.cs:26-64)` or
  `(config/settings.yaml)`. This is the one thing the scaffold cannot fill - add it.
- Empty `Rejected and Reverted` holds exactly the sentinel `- None on record.` (pre-filled).
- Change Log is a newest-first list (not a table); empty is valid for an unmodified capability.

`spec-lint --explain` prints the effective contract for the repo. That printed block is the
source of truth. After authoring, run the gate (see spec-lint-check).
