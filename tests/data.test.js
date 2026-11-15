// Data integrity: every catalogue site has valid NASA-derived data the app can load.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { catalog, ROOT } from './helpers.js';

describe('site catalogue', () => {
  it('ids are unique', () => expect(new Set(catalog.map((s) => s.id)).size).toBe(catalog.length));
  it('coordinates are valid', () => {
    for (const s of catalog) { expect(Math.abs(s.lat)).toBeLessThanOrEqual(90); expect(Math.abs(s.lon)).toBeLessThanOrEqual(180); }
  });
  it('Rimlight picks have a best landing date', () => {
    const picks = catalog.filter((s) => s.id.startsWith('pick-'));
    expect(picks.length).toBeGreaterThanOrEqual(3);
    for (const p of picks) expect(Number.isNaN(Date.parse(p.tryDate + 'Z'))).toBe(false);
  });
});

describe.each(catalog.map((s) => [s.id]))('%s data', (id) => {
  const f = new URL(`public/data/sites/${id}.json`, ROOT);
  it('has a horizon file with 720 directions and plausible angles', () => {
    expect(existsSync(f)).toBe(true);
    const d = JSON.parse(readFileSync(f));
    expect(d.horizonEl).toHaveLength(720);
    for (const v of d.horizonEl) { expect(v).toBeGreaterThan(-10); expect(v).toBeLessThan(45); }
  });
  it('has a terrain patch of the declared size', () => {
    const d = JSON.parse(readFileSync(f));
    expect(statSync(new URL(`public/data/sites/${d.patch.file}`, ROOT)).size).toBe(d.patch.n * d.patch.n * 2);
  });
});
