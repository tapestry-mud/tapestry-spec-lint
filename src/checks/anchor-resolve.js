'use strict';

const fs = require('fs');
const path = require('path');
const { parseSections } = require('../parser');
const { parseAnchors, isPathQualified } = require('../anchors');
const { countLines } = require('../eol');

// Check 3 (behavior) proves an anchor is PRESENT. It never opens the file, so a spec
// stays green while the code it points at moves out from under it. This check opens the
// file and reports only what it can prove:
//
//   - the target no longer exists
//   - the line (or the end of the range) is past the end of the file
//
// What it deliberately does NOT claim: that a line still points at the right code. That
// is unprovable from a line number alone, which is the standing argument for preferring
// symbol- and test-name anchors over `:line`.

// Anchors are authored against two bases: code and docs from the repo root, sibling
// capabilities and change records from specs/. Rather than guess which one an author meant,
// try both and only report a target that resolves against neither - a check that reports
// only what it can prove cannot afford to be clever about paths.
function resolveTarget(target, ctx) {
  const rel = target.replace(/\\/g, '/');
  for (const base of [ctx.repoRoot, ctx.specsDir]) {
    const candidate = path.join(base, rel);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function checkAnchorResolve(filePath, content, config, ctx) {
  if (config && config.anchorResolve === false) {
    return [];
  }
  if (!ctx || !ctx.repoRoot || !ctx.specsDir) {
    return []; // no filesystem context - nothing can be proved
  }

  const behaviorText = parseSections(content)['Behavior'];
  if (behaviorText === undefined) {
    return []; // check 2 owns the missing-section violation
  }

  const violations = [];
  const lineCounts = new Map();
  const reportedMissing = new Set();

  for (const anchor of parseAnchors(behaviorText)) {
    // A bare filename cannot be resolved without searching the tree, and searching would
    // make the result depend on where a duplicate basename happens to live. Skipped, not flagged.
    if (!isPathQualified(anchor.target) && !anchor.target.endsWith('.md')) {
      continue;
    }

    const abs = resolveTarget(anchor.target, ctx);

    if (abs === null) {
      if (!reportedMissing.has(anchor.target)) {
        reportedMissing.add(anchor.target);
        violations.push({
          rule: 'anchor-resolve',
          detail: `anchor target no longer exists: ${anchor.target}`,
        });
      }
      continue;
    }

    const top = anchor.end !== null ? anchor.end : anchor.start;
    if (top === null) {
      continue; // file-only anchor: existence is all there is to prove
    }

    if (!lineCounts.has(abs)) {
      lineCounts.set(abs, countLines(fs.readFileSync(abs, 'utf8')));
    }
    const total = lineCounts.get(abs);

    if (top > total) {
      violations.push({
        rule: 'anchor-resolve',
        detail: `anchor ${anchor.target}:${anchor.raw.replace(/^[^:]*:/, '')} points past end of file (${total} lines)`,
      });
    }
  }

  return violations;
}

module.exports = { checkAnchorResolve };
