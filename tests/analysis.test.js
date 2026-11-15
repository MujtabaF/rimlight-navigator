// Mission metrics on real sites: states, 30-day summaries, countdowns.
import { describe, it, expect } from 'vitest';
import { stateAt, analyse, nextTransition } from '../src/core/analysis.js';
import { smoothHorizon } from '../src/core/horizon.js';
import { loadSite, D, DAY } from './helpers.js';

const ridge = loadSite('shackleton-ridge');
const floor = loadSite('shackleton-floor');

describe('stateAt', () => {
  it('power is never more than visible sunlight, and zero in shadow', () => {
    for (let d = 0; d < 30; d += 1.7) {
      const s = stateAt(ridge.site, ridge.horizon, new Date(+D('2027-01-01') + d * DAY));
      expect(s.power.verticalTracking).toBeLessThanOrEqual(s.sun.visible + 1e-9);
      expect(s.power.horizontal).toBeLessThanOrEqual(s.sun.visible + 1e-9);
      expect(s.sun.visible).toBeGreaterThanOrEqual(0);
      expect(s.sun.visible).toBeLessThanOrEqual(1);
    }
  });
  it('the crater floor never gets any sunlight', () => {
    for (let d = 0; d < 60; d += 2) expect(stateAt(floor.site, floor.horizon, new Date(+D('2027-01-01') + d * DAY)).sun.visible).toBe(0);
  });
});

describe('analyse', () => {
  const a = analyse(ridge.site, ridge.horizon, D('2027-01-01'), 30, 30);
  it('samples every 30 minutes for 30 days', () => expect(a.series.length).toBe(30 * 48 + 1));
  it('"both at once" can never exceed Sun or Earth alone', () => {
    expect(a.summary.bothPct).toBeLessThanOrEqual(Math.min(a.summary.sunlitPct, a.summary.earthVisiblePct) + 1e-9);
  });
  it('a smooth equator site is sunlit about half the time', () => {
    const eq = analyse({ lat: 0, lon: 0, heightM: 0 }, smoothHorizon(), D('2027-01-01'), 59, 60).summary;
    expect(eq.sunlitPct).toBeGreaterThan(45); expect(eq.sunlitPct).toBeLessThan(55);
  });
});

describe('nextTransition (countdowns)', () => {
  it('finds a sunset at Malapert and the Sun really is up just before and down just after', () => {
    const m = loadSite('malapert');
    const start = D('2027-01-14T00:00');
    const set = nextTransition(m.site, m.horizon, start, 'sun', false, 40);
    expect(set).not.toBeNull();
    expect(stateAt(m.site, m.horizon, new Date(set - 5 * 60e3)).sun.visible).toBeGreaterThan(0.5);
    expect(stateAt(m.site, m.horizon, new Date(set + 5 * 60e3)).sun.visible).toBeLessThanOrEqual(0.5);
  });
  it('returns null when it never happens (no sunrise on the crater floor)', () => {
    expect(nextTransition(floor.site, floor.horizon, D('2027-01-01'), 'sun', true, 30)).toBeNull();
  });
});
