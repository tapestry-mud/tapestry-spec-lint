'use strict';

// Excludes are matched against a file's name relative to the specs dir. The top-level
// capability glob only ever yields basenames, so an exclude pattern is either an exact
// filename (validation-ledger.md) or a simple glob where `*` matches any run of characters
// (*-ledger.md). Matches are anchored, so a pattern never matches a superstring.

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function isExcluded(filename, excludeList) {
  if (!Array.isArray(excludeList) || excludeList.length === 0) { return false; }
  for (const pattern of excludeList) {
    if (pattern.includes('*')) {
      if (globToRegExp(pattern).test(filename)) { return true; }
    } else if (pattern === filename) {
      return true;
    }
  }
  return false;
}

module.exports = { isExcluded, globToRegExp };
