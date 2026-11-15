// The landing planner: the shared verdict rule, best days, date vs date, seasons.
import { describe, it, expect } from 'vitest';
import { classify, landingDays, bestDays, rateTouchdown, GOOD_LIGHT_DAYS, POOR_LIGHT_DAYS, GOOD_EARTH } from '../src/core/landing.js';
import { monthlyStats } from '../src/core/seasons.js';
import { analyse } from '../src/core/analysis.js';
import { loadSite, D } from './helpers.js';

describe('classify: one rule for good / workable / poor', () => {
  it('uses the documented thresholds', () => {
    expect([GOOD_LIGHT_DAYS, POOR_LIGHT_DAYS, GOOD_EARTH]).toEqual([10, 2, 0.5]);
  });
  it.each([
    [0, 1, 'poor'], [1.99, 1, 'poor'], [2, 0, 'ok'], [9.99, 1, 'ok'],
    [10, 0.49, 'ok'], [10, 0.5, 'good'], [30, 1, 'good'],
  ])('%s days of light, %s Earth → %s', (light, earth, want) => expect(classify(light, earth)).toBe(want));
});

describe('landingDays and bestDays', () => {
  const m = loadSite('malapert');
  const days = landingDays(m.site, m.horizon, D('2027-01-01'), 30);
  it('rates every day', () => expect(days).toHaveLength(30));
  it('each day matches the rule applied to its own numbers', () => {
    for (const d of days) expect(d.level).toBe(classify(d.lightHours / 24, d.earthFrac));
  });
  it('best days are never poor and are spaced apart', () => {
    const picks = bestDays(days, 3, 4);
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect(p.level).not.toBe('poor');
    for (let i = 0; i < picks.length; i++) for (let j = i + 1; j < picks.length; j++) expect(Math.abs(picks[i].i - picks[j].i)).toBeGreaterThanOrEqual(4);
  });
  it('the crater floor has no usable day', () => {
    const f = loadSite('shackleton-floor');
    expect(bestDays(landingDays(f.site, f.horizon, D('2027-01-01'), 30))).toHaveLength(0);
  });
});

describe('rateTouchdown (date vs date)', () => {
  const m = loadSite('malapert');
  it('agrees with the planner for the same moment', () => {
    const day = landingDays(m.site, m.horizon, D('2027-01-13'), 1)[0];
    const r = rateTouchdown(m.site, m.horizon, day.date);
    expect(r.level).toBe(day.level);
    expect(Math.abs(r.lightHours - day.lightHours)).toBeLessThanOrEqual(1);
  });
  it('a later landing in the same lunar day gets less light', () => {
    const a = rateTouchdown(m.site, m.horizon, D('2027-01-13T05:00'));
    const b = rateTouchdown(m.site, m.horizon, D('2027-01-20T12:00'));
    expect(b.lightHours).toBeLessThan(a.lightHours);
  });
});

describe('monthlyStats (Year view)', () => {
  it('12 months that average back to the yearly figure', () => {
    const r = loadSite('shackleton-ridge');
    const months = monthlyStats(r.site, r.horizon, 2027, 180);
    expect(months).toHaveLength(12);
    const len = months.map((_, i) => (Date.UTC(2027, i + 1, 1) - Date.UTC(2027, i, 1)) / 864e5);
    const mean = months.reduce((s, x, i) => s + x.sunPct * len[i], 0) / 365;
    const year = analyse(r.site, r.horizon, D('2027-01-01'), 365, 180).summary.sunlitPct;
    expect(Math.abs(mean - year)).toBeLessThan(1.5);
  });
});
