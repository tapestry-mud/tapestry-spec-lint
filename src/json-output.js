'use strict';

const path = require('path');

function levelForMode(mode) {
  return mode === 'strict' ? 'ERROR' : 'WARNING';
}

function rel(specsDir, p) {
  if (!p) {
    return null;
  }
  const r = path.relative(specsDir, p);
  return r === '' ? p : r;
}

function toJsonReport(specsDir, result, mode) {
  const level = levelForMode(mode);
  const files = [];
  let total = 0;

  for (const [absPath, violations] of Object.entries(result.fileResults)) {
    if (!violations || violations.length === 0) {
      continue;
    }
    const relPath = rel(specsDir, absPath);
    const entries = violations.map(v => ({
      level,
      rule: v.rule,
      file: relPath,
      detail: v.detail || v.message || '',
    }));
    files.push({ file: relPath, violations: entries });
    total += entries.length;
  }

  const crossFile = (result.crossFileViolations || []).map(v => ({
    level,
    rule: v.rule,
    file: rel(specsDir, v.file),
    detail: v.detail || v.message || '',
  }));
  total += crossFile.length;

  const passed = mode === 'strict' ? total === 0 : true;

  return {
    mode,
    summary: {
      files: files.length,
      violations: total,
      passed,
    },
    files,
    crossFile,
  };
}

module.exports = { toJsonReport, levelForMode };
