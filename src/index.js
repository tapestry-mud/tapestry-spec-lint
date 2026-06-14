'use strict';

const { lint } = require('./engine');
const { loadConfig } = require('./config');
const { formatResults } = require('./formatter');
const { renderContract, renderManagedBlock, extractManagedBlock } = require('./renderer');
const { BASE_CONFIG } = require('./base-config');
const { renderCapabilitySpec, renderChangeRecord, slugToTitle, stripDate } = require('./templates');
const indexTable = require('./index-table');
const { toJsonReport } = require('./json-output');
const { newCapability } = require('./commands/new');
const { newChange } = require('./commands/new-change');
const { fix } = require('./commands/fix');
const { init } = require('./commands/init');

module.exports = {
  lint,
  loadConfig,
  formatResults,
  renderContract,
  renderManagedBlock,
  extractManagedBlock,
  BASE_CONFIG,
  renderCapabilitySpec,
  renderChangeRecord,
  slugToTitle,
  stripDate,
  indexTable,
  toJsonReport,
  newCapability,
  newChange,
  fix,
  init,
};
