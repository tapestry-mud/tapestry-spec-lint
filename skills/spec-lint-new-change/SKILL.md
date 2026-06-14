---
name: spec-lint-new-change
description: Use when recording a change against existing capability specs - run spec-lint new change <slug> --release <ver> --specs a.md,b.md to scaffold the change record (this is the sole generator; /ship calls it). Triggers - "new change record", "spec-lint new change", "record a spec change", "ship fold change record".
---

# spec-lint-new-change

Scaffold a change record - the sole generator of the change-record skeleton. CLI is `spec-lint`.

## Run it

`spec-lint new change <slug> --release <ver> --specs a.md,b.md [path]` writes
`specs/changes/<date>-<slug>.md`. If the slug lacks a leading `YYYY-MM-DD-`, today's date
is prepended (the engine reads the record date from the filename). It refuses to overwrite.

This is the SINGLE generator of the change-record skeleton. `/ship`'s fold step calls it
(then fills the prose) rather than hand-writing the record; outside adopters call it directly.

## The record contract you are filling

- Frontmatter: `release:` and the `specs:` list (the capabilities this change touches).
- Prose body: a Why record and a What record - author-judged narrative that distils to a
  public-facing changelog. (We deliberately kept prose records, not a machine-merged
  structured delta.)

Cross-file rule: a change record that names a capability must be reflected by that spec's top
Change Log entry and its `last-updated`; a `status: reverted` record requires a tombstone in
the spec's Rejected and Reverted. After authoring, run the gate (see spec-lint-check).
