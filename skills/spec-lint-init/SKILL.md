---
name: spec-lint-init
description: Use when adopting the spec-lint tooling in a repo for the first time - run spec-lint init to scaffold specs/, a lenient config, the README managed block, and an empty index, and to print the devDependency / npm-script / CI wiring. Triggers - "adopt spec-lint", "spec-lint init", "set up the spec contract in this repo".
---

# spec-lint-init

Adopt the spec-lint tooling in a repo in one idempotent command. CLI is `spec-lint`
(npm package `@tapestry-mud/spec-lint`).

## Run it

`spec-lint init [path]` (path defaults to the current dir). It is setup-only and
idempotent - re-running repairs rather than duplicates.

Performed directly:

- Creates `specs/` if missing.
- Writes `specs/lint.config.json` with the minimal opening config: `{ "mode": "lenient" }`.
  Nothing else - the regex and rules live in the package base and are NEVER seeded per-repo.
- Writes the README managed block (the rendered contract) into `specs/README.md`.
- Seeds an empty index table.

Printed, NOT performed (touches lockfiles / CI - apply by hand):

- The pinned devDependency line to add to `package.json`.
- The npm script to add.
- The CI step to add.

`init` does NOT scaffold a first capability spec. It ends by printing the next step:

run `spec-lint new <capability>` to author your first spec (see spec-lint-new-spec).

## Graduating lenient -> strict

There is no command. When the repo is ready, delete the `mode` line from
`specs/lint.config.json` - a deliberate, PR-visible, once-per-repo edit.
