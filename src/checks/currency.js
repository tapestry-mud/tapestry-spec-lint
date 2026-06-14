'use strict';

const path = require('path');

function checkCurrency(specs, changeRecords, config) {
  const violations = [];
  const latestRecord = {};

  for (const record of changeRecords) {
    const fm = record.frontmatter;
    if (!fm || !fm.specs) { continue; }
    const specsList = Array.isArray(fm.specs) ? fm.specs : [fm.specs];
    for (const capFile of specsList) {
      if (!latestRecord[capFile] || record.date > latestRecord[capFile].date) {
        latestRecord[capFile] = { date: record.date, slug: record.slug };
      }
    }
  }

  for (const spec of specs) {
    const filename = path.basename(spec.path);
    const record = latestRecord[filename];
    if (!record) {
      continue; // seeded-empty: no records name it, empty log is valid
    }

    const clText = (spec.sections && spec.sections['Change Log']) || '';
    if (clText.trim() === '') {
      violations.push({
        rule: 'currency',
        file: spec.path,
        detail: `${filename}: Change Log is empty but change record ${record.slug} (${record.date}) names this capability`,
      });
      continue;
    }

    const firstEntry = clText.split('\n').map(l => l.trim()).find(l => l.startsWith('- '));
    if (!firstEntry || !firstEntry.includes(record.slug)) {
      violations.push({
        rule: 'currency',
        file: spec.path,
        detail: `${filename}: top Change Log entry does not reference the latest change record ${record.slug}`,
      });
    }

    const lastUpdated = spec.frontmatter && spec.frontmatter['last-updated'];
    if (lastUpdated && lastUpdated < record.date) {
      violations.push({
        rule: 'currency',
        file: spec.path,
        detail: `${filename}: last-updated ${lastUpdated} is older than change record date ${record.date}`,
      });
    }
  }

  return violations;
}

module.exports = { checkCurrency };
