---
name: spec-lint-fix
description: Use when spec-lint flags mechanical drift - run spec-lint fix to resync the README managed block after a dependabot bump, insert a missing sentinel, and rebuild the index from disk. Mechanical repair only; never invents prose. Triggers - "fix the specs", "spec-lint fix", "resync the spec README", "rebuild the specs index".
---

# spec-lint-fix

Mechanical repair and resync - the deterministic fixes drift creates. CLI is `spec-lint`.

## Run it

`spec-lint fix [path]` performs exactly three bounded repairs and nothing else:

- Regenerate the README managed block from the effective ruleset. This is the load-bearing
  repair: a dependabot bump of `@tapestry-mud/spec-lint` changes the rendered contract and
  turns the index/contract check red until the block is re-synced.
- Insert the empty-reversal sentinel - a `Rejected and Reverted` section with no records and
  no sentinel gets exactly `- None on record.` inserted.
- Rebuild the index from disk - reconcile the README index against the `*.md` files present
  (both directions), refresh each row's date from frontmatter, PRESERVE existing row order,
  and append genuinely-new files at the end. It never re-sorts the curated index.

## The boundary

`fix` is idempotent (a clean tree is a no-op) and mechanical only. It NEVER invents Behavior
text, anchors, Overview prose, or Change Log entries, and NEVER touches `lint.config.json`
(the human-owned policy file). Anything requiring judgment stays a lint failure the author
resolves by hand - run the gate after (see spec-lint-check).

## When to run

- After a dependabot bump turns the README contract red.
- When a spec is missing its sentinel, or the index drifts from disk.
