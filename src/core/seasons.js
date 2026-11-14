// Season view: % of time sunlit and % with Earth in view, for each month of a year.
// The Moon's axis is tilted only ~1.5°, but at the poles that small tilt decides whether the Sun
// clears the skyline, so polar sites have real seasons. Pure maths, no DOM.
import { analyse } from './analysis.js';

/** [{ month: 0..11, start: Date, sunPct, earthPct, bothPct }] for the given UTC year. */
export function monthlyStats(site, horizon, year, stepMin = 120) {
  const out = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(Date.UTC(year, m, 1));
    const days = (Date.UTC(year, m + 1, 1) - start) / 864e5;
    const { summary } = analyse(site, horizon, start, days, stepMin);
    out.push({ month: m, start, sunPct: summary.sunlitPct, earthPct: summary.earthVisiblePct, bothPct: summary.bothPct });
  }
  return out;
}
