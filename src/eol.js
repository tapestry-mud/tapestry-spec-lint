'use strict';

// Line endings are a checkout artifact, never contract content. Comparisons and
// parsing normalize to LF; writers preserve whatever the file on disk already uses,
// so a CRLF repo stays CRLF.

function normalizeEol(text) {
  return text.replace(/\r\n/g, '\n');
}

function detectEol(text) {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}

function applyEol(text, eol) {
  if (eol === '\n') {
    return normalizeEol(text);
  }
  return normalizeEol(text).replace(/\n/g, eol);
}

function countLines(text) {
  const lines = normalizeEol(text).split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.length;
}

module.exports = { normalizeEol, detectEol, applyEol, countLines };
