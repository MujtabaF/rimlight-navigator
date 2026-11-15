// Skyline models and the partial-disc geometry used for power.
import { describe, it, expect } from 'vitest';
import { visibleFraction, smoothHorizon, terrainHorizon } from '../src/core/horizon.js';

describe('visibleFraction (how much of a disc clears the skyline)', () => {
  it('is 1 fully above, 0 fully below, 0.5 when centred on the skyline', () => {
    expect(visibleFraction(5, 0, 0.27)).toBe(1);
    expect(visibleFraction(-5, 0, 0.27)).toBe(0);
    expect(visibleFraction(0, 0, 0.27)).toBeCloseTo(0.5, 10);
  });
  it('rises steadily as the disc rises', () => {
    let prev = -1;
    for (let el = -0.3; el <= 0.3; el += 0.01) { const f = visibleFraction(el, 0, 0.27); expect(f).toBeGreaterThanOrEqual(prev); prev = f; }
  });
  it('is symmetric: f(+d) + f(-d) = 1', () => {
    for (const d of [0.05, 0.1, 0.2]) expect(visibleFraction(d, 0, 0.27) + visibleFraction(-d, 0, 0.27)).toBeCloseTo(1, 10);
  });
});

describe('horizon models', () => {
  it('smooth horizon is just below level everywhere', () => {
    const h = smoothHorizon();
    for (const az of [0, 90, 233.3]) expect(h.elAt(az)).toBeCloseTo(-0.05);
  });
  it('terrain horizon interpolates between samples and wraps around north', () => {
    const h = terrainHorizon({ azStep: 90, horizonEl: [0, 10, 20, 30] });
    expect(h.elAt(45)).toBeCloseTo(5);
    expect(h.elAt(315)).toBeCloseTo(15); // between 270° (30) and 360° = 0° (0)
    expect(h.elAt(-90)).toBeCloseTo(30);
    expect(h.elAt(450)).toBeCloseTo(10);
  });
});
