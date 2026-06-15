# Specs

| Capability | File | Last Updated |
|------------|------|--------------|
| Linting Engine | [linting-engine.md](linting-engine.md) | 2026-06-15 |
| Authoring Commands | [authoring-commands.md](authoring-commands.md) | 2026-06-15 |
| Output Rendering | [output-rendering.md](output-rendering.md) | 2026-06-15 |
| Plugin Distribution | [plugin-distribution.md](plugin-distribution.md) | 2026-06-15 |
| Cli Surface | [cli-surface.md](cli-surface.md) | 2026-06-15 |

<!-- spec-lint:start -->
Mode: strict

Required sections: Overview, Behavior, Rejected and Reverted, Change Log

Anchor regex (Behavior): \([@\w./\\-]+\.(cs|js|ts|json|ya?ml|md)(:\d+(-\d+)?)?[^)]*\)

Empty-reversal sentinel: - None on record.

Change Log: list, newest-first by date, not a table. Empty is valid for unmodified capabilities.

Index sync: every capability .md on disk appears in README index; every indexed file exists on disk; index date matches file last-updated.

Currency: for each change record naming a capability, the top Change Log entry references that record and last-updated >= record date. A capability named by zero records may have an empty Change Log.

Tombstone: a change record with status:reverted requires a tombstone entry in the capability Rejected and Reverted (not the empty sentinel).
<!-- spec-lint:end -->
