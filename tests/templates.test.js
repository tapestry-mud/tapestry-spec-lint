'use strict';

const { renderCapabilitySpec, renderChangeRecord, slugToTitle, stripDate } = require('../src/templates');
const { BASE_CONFIG } = require('../src/base-config');
const { parseFrontmatter, parseSections } = require('../src/parser');

describe('slugToTitle', () => {
  test('title-cases a kebab slug', () => {
    expect(slugToTitle('command-dispatch')).toBe('Command Dispatch');
  });
});

describe('stripDate', () => {
  test('removes a leading YYYY-MM-DD- prefix', () => {
    expect(stripDate('2026-06-14-telnet-crlf')).toBe('telnet-crlf');
  });
  test('leaves an undated slug untouched', () => {
    expect(stripDate('telnet-crlf')).toBe('telnet-crlf');
  });
});

describe('renderCapabilitySpec', () => {
  const out = renderCapabilitySpec('command-dispatch', '2026-06-14', BASE_CONFIG);

  test('frontmatter carries slug and date', () => {
    const fm = parseFrontmatter(out);
    expect(fm.capability).toBe('command-dispatch');
    expect(fm['last-updated']).toBe('2026-06-14');
  });

  test('every required section is present', () => {
    const sections = parseSections(out);
    for (const name of BASE_CONFIG.sections) {
      expect(name in sections).toBe(true);
    }
  });

  test('Rejected and Reverted is pre-filled with the sentinel', () => {
    const sections = parseSections(out);
    expect(sections['Rejected and Reverted']).toBe(BASE_CONFIG.sentinelText);
  });

  test('Change Log is empty', () => {
    const sections = parseSections(out);
    expect(sections['Change Log']).toBe('');
  });

  test('Behavior is empty (author fills the anchor)', () => {
    const sections = parseSections(out);
    expect(sections['Behavior']).toBe('');
  });

  test('a new section in config appears in the scaffold', () => {
    const cfg = { ...BASE_CONFIG, sections: [...BASE_CONFIG.sections, 'Security'] };
    const sections = parseSections(renderCapabilitySpec('x', '2026-06-14', cfg));
    expect('Security' in sections).toBe(true);
  });
});

describe('renderChangeRecord', () => {
  const out = renderChangeRecord('2026-06-14-telnet-crlf', 'v0.1.35', ['command-dispatch.md'], BASE_CONFIG);

  test('frontmatter carries release and specs list', () => {
    const fm = parseFrontmatter(out);
    expect(fm.release).toBe('v0.1.35');
    expect(fm.specs).toEqual(['command-dispatch.md']);
  });

  test('body has Why and What sections', () => {
    const sections = parseSections(out);
    expect('Why' in sections).toBe(true);
    expect('What' in sections).toBe(true);
  });
});
