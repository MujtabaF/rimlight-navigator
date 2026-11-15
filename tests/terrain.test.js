// Live terrain engine (custom coordinates): must agree with the detailed precomputed skylines.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { makeGrid, computeHorizon, computePatch, toXY, fromXY, heightAt } from '../src/core/terrain.js';
import { terrainHorizon } from '../src/core/horizon.js';
import { analyse } from '../src/core/analysis.js';
import { loadSite, ROOT, D } from './helpers.js';

const meta = JSON.parse(readFileSync(new URL('public/data/terrain/meta.json', ROOT)));
const grid = (m) => { const b = readFileSync(new URL(`public/data/terrain/${m.file}`, ROOT)); return makeGrid(new Int16Array(b.buffer, b.byteOffset, b.length / 2), m.n, m.scale); };
const grids = [grid(meta.fine), grid(meta.coarse)];

describe('polar stereographic projection', () => {
  it('round-trips lat/lon', () => {
    for (const [la, lo] of [[-89.45, -137.3], [-85, 2], [-83.1, 120]]) {
      const [x, y] = toXY(la, lo); const [la2, lo2] = fromXY(x, y);
      expect(la2).toBeCloseTo(la, 9); expect(lo2).toBeCloseTo(lo, 9);
    }
  });
  it('puts the pole at the centre', () => { const [x, y] = toXY(-90, 0); expect(Math.hypot(x, y)).toBeLessThan(1e-6); });
});

describe('elevation grids', () => {
  it('know Shackleton is a deep bowl and Malapert a high peak', () => {
    expect(heightAt(grids, ...toXY(-89.67, 129.78))).toBeLessThan(-2000);
    expect(heightAt(grids, ...toXY(-85.98, 2.23))).toBeGreaterThan(4500);
  });
  it('return nothing outside coverage', () => expect(computeHorizon(grids, -40, 0)).toBeNull());
});

describe('live skylines match the detailed 40 m ones (year of sunlight within 3 points)', () => {
  it.each(['shackleton-ridge', 'im2', 'chandrayaan3', 'pick-polar-ridge'])('%s', (id) => {
    const ref = loadSite(id);
    const live = computeHorizon(grids, ref.site.lat, ref.site.lon);
    expect(live.horizonEl).toHaveLength(720);
    const a = analyse(ref.site, ref.horizon, D('2027-01-01'), 365, 180).summary.sunlitPct;
    const b = analyse(ref.site, terrainHorizon(live), D('2027-01-01'), 365, 180).summary.sunlitPct;
    expect(Math.abs(a - b)).toBeLessThan(3);
  });
  it('a crater floor stays dark', () => {
    const live = computeHorizon(grids, -89.67, 129.78);
    expect(analyse({ lat: -89.67, lon: 129.78, heightM: live.heightM }, terrainHorizon(live), D('2027-01-01'), 365, 180).summary.sunlitPct).toBeLessThan(1);
  });
});

describe('computePatch (3D terrain for custom points)', () => {
  it('makes an n×n patch, level with the site at its centre', () => {
    const h = computeHorizon(grids, -87.5, 45);
    const p = computePatch(grids, -87.5, 45, h.heightM, { n: 65 });
    expect(p.heights).toHaveLength(65 * 65);
    expect(Math.abs(p.heights[32 * 65 + 32])).toBeLessThan(300);
  });
});
