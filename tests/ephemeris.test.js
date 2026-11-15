// Sun and Earth positions vs NASA JPL Horizons (66 saved answers), plus physical invariants.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { skyAt, bodyFixedVectors, subPoint, MOON_RADIUS_KM } from '../src/core/ephemeris.js';

const jpl = JSON.parse(readFileSync(new URL('./fixtures/jpl-horizons.json', import.meta.url)));

describe('ephemeris vs NASA JPL Horizons', () => {
  it('has the saved JPL answers', () => expect(jpl.rows.length).toBeGreaterThanOrEqual(60));

  it.each(jpl.rows.map((r) => [r.site.name, r.body, r.date, r]))('%s %s %s within 0.01°', (_n, body, date, r) => {
    const m = skyAt(r.site, new Date(date))[body];
    let daz = Math.abs(m.az - r.az); if (daz > 180) daz = 360 - daz;
    expect(Math.abs(m.el - r.el)).toBeLessThan(0.01);
    expect(daz * Math.cos((r.el * Math.PI) / 180)).toBeLessThan(0.01);
  });
});

describe('ephemeris physical sanity', () => {
  const t = new Date('2027-03-01T00:00:00Z');
  it('Sun is about 1 AU away and Earth 356 000–407 000 km', () => {
    const { toSun, toEarth } = bodyFixedVectors(t);
    expect(Math.hypot(...toSun) / 1.496e8).toBeGreaterThan(0.97);
    expect(Math.hypot(...toSun) / 1.496e8).toBeLessThan(1.03);
    expect(Math.hypot(...toEarth)).toBeGreaterThan(356000);
    expect(Math.hypot(...toEarth)).toBeLessThan(407000);
  });
  it('the sub-Earth point stays near the near-side centre (libration ≤ 8°)', () => {
    for (let d = 0; d < 30; d += 3) {
      const p = subPoint(bodyFixedVectors(new Date(+t + d * 864e5)).toEarth);
      expect(Math.abs(p.lat)).toBeLessThan(7.5);
      expect(Math.abs(p.lon)).toBeLessThan(8.5);
    }
  });
  it('at the pole the Sun never climbs above ~2°', () => {
    for (let d = 0; d < 365; d += 5) expect(skyAt({ lat: -89.9, lon: 0 }, new Date(+t + d * 864e5)).sun.el).toBeLessThan(2.2);
  });
  it('Sun and Earth angular sizes are right (0.25–0.28° and 0.89–1.03° radius)', () => {
    const s = skyAt({ lat: 0, lon: 0 }, t);
    expect(s.sun.radiusDeg).toBeGreaterThan(0.25); expect(s.sun.radiusDeg).toBeLessThan(0.28);
    expect(s.earth.radiusDeg).toBeGreaterThan(0.89); expect(s.earth.radiusDeg).toBeLessThan(1.03);
  });
  it('uses the IAU mean lunar radius', () => expect(MOON_RADIUS_KM).toBe(1737.4));
});
