# @tapestry-mud/spec-lint

Deterministic capability-spec linter for [Tapestry](https://github.com/tapestry-mud/tapestry) projects.

Enforces the [spec contract](https://github.com/tapestry-mud/tapestry/blob/master/specs/README.md) - eight mechanical rules checked on every commit and CI run.

## Installation

Add as a pinned devDependency (no `^` or `~`):

```json
{
  "devDependencies": {
    "@tapestry-mud/spec-lint": "0.1.0"
  }
}
```

Add an npm script:

```json
{
  "scripts": {
    "spec-lint": "spec-lint specs/"
  }
}
```

Run `npm ci` to install from the lockfile. Run `npm run spec-lint` to lint.

For C# repos with no existing package.json, add a minimal tooling manifest:

```json
{
  "private": true,
  "scripts": {
    "spec-lint": "spec-lint specs/"
  },
  "devDependencies": {
    "@tapestry-mud/spec-lint": "0.1.0"
  }
}
```

## Usage

```
npm run spec-lint           # lint specs/ in strict mode
npm run spec-lint -- --lenient   # warn only, exit 0
npm run spec-lint -- --strict    # force strict even if config says lenient
spec-lint --explain         # print the effective contract for this repo
```

## Commands

`lint` is the read-only gate; the others create or repair.

```
spec-lint [path]                    gate specs/ (read-only; --strict / --lenient / --explain / --json)
spec-lint init [path]               adopt: specs/ + lenient config + README block + empty index
spec-lint new <capability> [path]   scaffold a born-conformant capability spec + index row
spec-lint new change <slug> --release <ver> --specs a.md,b.md [path]
spec-lint fix [path]                mechanical repairs: managed block, sentinel, index rebuild
```

`lint` never writes. Passing `--fix` errors and redirects you to `spec-lint fix`.
`--json` gives CI and agents machine-readable results (per-violation ERROR/WARNING
level plus a summary) without scraping text. `fix` is idempotent and never invents
prose - authoring-required failures stay lint failures. `new change` is the single
generator of a change-record skeleton.

## Config

Add `specs/lint.config.json` to extend or override the base rules:

```json
{
  "mode": "lenient"
}
```

Available fields:

- `mode`: `"strict"` (default) or `"lenient"`. Strict exits 1 on any violation; lenient exits 0 with warnings.
- `sections.extra`: additional required section headings beyond the base four.
- `anchorRegex`: override the pinned anchor regex (rarely needed).
- `sentinelText`: override the empty-reversal sentinel (rarely needed).

Precedence: `--strict`/`--lenient` flag > `mode` in config > default strict.

## Skill (Claude Code plugin)

This repo self-hosts a Claude Code plugin so an agent can install the spec-lint
authoring skills (five command-aligned skills - init, new-spec, new-change, fix,
check - all ship in the one plugin):

```
/plugin marketplace add tapestry-mud/tapestry-spec-lint
/plugin install spec-lint@tapestry-spec-lint
```

One install makes all five skills available. Refresh with `/plugin marketplace update`.
The plugin version mirrors the npm package version. The skills are guidance; the pinned
`lint` in each repo is the version-locked backstop, so a slightly stale skill can never
ship a bad spec.

## The eight checks

<!-- spec-lint:start -->
Mode: strict

Required sections: Overview, Behavior, Rejected and Reverted, Change Log

Anchor regex (Behavior): \([@\w./\\-]+\.(cs|js|ts|json|ya?ml)(:\d+(-\d+)?)?[^)]*\)

Empty-reversal sentinel: - None on record.

Change Log: list, newest-first by date, not a table. Empty is valid for unmodified capabilities.

Index sync: every capability .md on disk appears in README index; every indexed file exists on disk; index date matches file last-updated.

Currency: for each change record naming a capability, the top Change Log entry references that record and last-updated >= record date. A capability named by zero records may have an empty Change Log.

Tombstone: a change record with status:reverted requires a tombstone entry in the capability Rejected and Reverted (not the empty sentinel).
<!-- spec-lint:end -->

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
