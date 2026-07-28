'use strict';

// Anchor grammar, as authored in Behavior prose:
//
//   (path/to/File.cs)                     file-only
//   (path/to/File.cs:12)                  single line
//   (path/to/File.cs:12-40)               range
//   (a.cs:7; b.cs:32-37)                  several anchors in one paren
//   (File.cs:85-103; 153-166)             extra ranges continue the previous target
//   (File.cs:14-18; note)                 free note, ignored
//   (sibling-capability.md)               cross-link to another spec, resolved in specs/
//
// parseAnchors never guesses. A part it cannot parse is skipped, so an unfamiliar
// shape can never become a false violation - the resolver only reports what it proved.

const PAREN = /\(([^)]*)\)/g;
const TARGET = /^([@\w./\\-]+\.(?:cs|js|ts|json|ya?ml|md))(?::(\d+)(?:-(\d+))?)?$/;
const RANGE_ONLY = /^(\d+)(?:-(\d+))?$/;

function parseAnchors(text) {
  const anchors = [];
  if (!text) {
    return anchors;
  }
  let paren;
  PAREN.lastIndex = 0;
  while ((paren = PAREN.exec(text)) !== null) {
    const parts = paren[1].split(';').map(p => p.trim());
    // A paren only counts as an anchor when its first part names a target. This keeps
    // ordinary parenthetical prose out of the resolver.
    if (!TARGET.test(parts[0])) {
      continue;
    }
    let lastTarget = null;
    for (const part of parts) {
      const target = TARGET.exec(part);
      if (target) {
        lastTarget = target[1];
        anchors.push({
          target: lastTarget,
          start: target[2] ? Number(target[2]) : null,
          end: target[3] ? Number(target[3]) : null,
          raw: part,
        });
        continue;
      }
      const range = RANGE_ONLY.exec(part);
      if (range && lastTarget !== null) {
        anchors.push({
          target: lastTarget,
          start: Number(range[1]),
          end: range[2] ? Number(range[2]) : null,
          raw: part,
        });
      }
      // anything else is a free note - ignored
    }
  }
  return anchors;
}

function isPathQualified(target) {
  return target.includes('/') || target.includes('\\');
}

module.exports = { parseAnchors, isPathQualified };
