'use strict';

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../config');
const { renderChangeRecord } = require('../templates');

function newChange(specsDir, slug, opts, today) {
  const dated = /^\d{4}-\d{2}-\d{2}-/.test(slug) ? slug : `${today}-${slug}`;
  const changesDir = path.join(specsDir, 'changes');
  if (!fs.existsSync(changesDir)) {
    fs.mkdirSync(changesDir, { recursive: true });
  }
  const filePath = path.join(changesDir, `${dated}.md`);
  if (fs.existsSync(filePath)) {
    return { ok: false, messages: [`refusing to overwrite existing change record: ${dated}.md`] };
  }
  const config = loadConfig(specsDir);
  const release = opts.release || '';
  const specsList = opts.specs || [];
  fs.writeFileSync(filePath, renderChangeRecord(dated, release, specsList, config));
  return {
    ok: true,
    file: filePath,
    messages: [`created specs/changes/${dated}.md`],
  };
}

module.exports = { newChange };
