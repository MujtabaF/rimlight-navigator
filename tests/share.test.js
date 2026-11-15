// Share links and CSV export.
import { describe, it, expect, beforeAll } from 'vitest';
import { stateUrl, windowCsv } from '../src/share.js';
import { analyse } from '../src/core/analysis.js';
import { loadSite, D } from './helpers.js';

beforeAll(() => { globalThis.location = { origin: 'https://example.org', pathname: '/app.html' }; });

describe('stateUrl', () => {
  const app = { active: { id: 'malapert', lat: -86, lon: 2 }, compare: [{ id: 'malapert' }, { id: 'im2' }, { id: 'custom' }], date: D('2027-01-13T05:00') };
  it('keeps site, time and compared sites (not the active one or custom points)', () => {
    const q = new URL(stateUrl(app)).searchParams;
    expect(q.get('site')).toBe('malapert');
    expect(q.get('t')).toBe('2027-01-13T05:00');
    expect(q.get('cmp')).toBe('im2');
  });
  it('writes lat/lon for a custom point and remembers eye and Year views', () => {
    const q = new URL(stateUrl({ ...app, active: { id: 'custom', lat: -87.5, lon: 45 } }, { eye: true, dock: 'year' })).searchParams;
    expect([q.get('lat'), q.get('lon'), q.get('eye'), q.get('dock')]).toEqual(['-87.5000', '45.0000', '1', 'year']);
    expect(q.get('site')).toBeNull();
  });
});

describe('windowCsv', () => {
  const m = loadSite('malapert');
  const csv = windowCsv([{ site: { ...m.site, name: 'Malapert "Massif"' }, analysis: analyse(m.site, m.horizon, D('2027-01-01'), 30, 30) }]);
  const lines = csv.trim().split('\n');
  it('has a header and one row per 30-minute sample', () => {
    expect(lines[0].split(',')).toHaveLength(11);
    expect(lines.length - 1).toBe(1441);
  });
  it('escapes quotes in site names and writes UTC times', () => {
    expect(lines[1].startsWith('"Malapert ""Massif""",')).toBe(true);
    expect(lines[1]).toContain('2027-01-01T00:00Z');
  });
});
