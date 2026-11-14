// Landing-date planner: for each of the next N days, how good is it to touch down?
// Uses the same physics as everything else (analysis.js), sampled hourly. Pure maths, no DOM.
import { analyse } from './analysis.js';

// One rule for "good / workable / poor", shared by the verdict box and the date chart.
// Recorded in docs/DECISIONS.md (#12).
export const GOOD_LIGHT_DAYS = 10; // about one lunar day of surface operations
export const POOR_LIGHT_DAYS = 2;
export const GOOD_EARTH = 0.5;     // Earth in view at least half of the first two weeks
export const EARTH_DAYS = 14;

export function classify(lightDays, earthFrac) {
  if (lightDays < POOR_LIGHT_DAYS) return 'poor';
  return lightDays >= GOOD_LIGHT_DAYS && earthFrac >= GOOD_EARTH ? 'good' : 'ok';
}
const RANK = { poor: 0, ok: 1, good: 2 };
// Within a level: light matters up to ~20 days (beyond that a mission is long over), then Earth
// contact. 10 days of light are worth the same as going from 0% to 100% Earth contact.
const score = (d) => Math.min(d.lightHours / 24, 20) + 10 * d.earthFrac;

/**
 * For each day starting at `startDay` (UTC midnight), the best hour to land that day:
 *  lightHours  hours of sunlight from touchdown until the first sunset
 *  capped      true if the Sun was still up at the end of the look-ahead (so "30+ days")
 *  earthFrac   fraction of the first EARTH_DAYS days with Earth above the skyline
 *  level       'good' | 'ok' | 'poor' (classify)
 *  date        the best touchdown time that day
 */
export function landingDays(site, horizon, startDay, days = 60, lookaheadDays = 30) {
  const { series: s } = analyse(site, horizon, startDay, days + lookaheadDays, 60);
  const n = s.length;
  // hours of continuous sunlight from each sample onward
  const run = new Int32Array(n + 1);
  for (let i = n - 1; i >= 0; i--) run[i] = s[i].sunVis > 0.5 ? run[i + 1] + 1 : 0;
  // prefix sums of Earth-visible hours
  const earth = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) earth[i + 1] = earth[i] + (s[i].earthVis > 0.5 ? 1 : 0);
  const span = EARTH_DAYS * 24;

  const out = [];
  for (let d = 0; d < days; d++) {
    let best = null;
    for (let h = 0; h < 24; h++) {
      const i = d * 24 + h;
      const lightHours = run[i];
      const end = Math.min(n, i + span);
      const earthFrac = (earth[end] - earth[i]) / Math.max(1, end - i);
      const level = classify(lightHours / 24, earthFrac);
      const cand = { date: new Date(s[i].t), lightHours, capped: i + lightHours >= n, earthFrac, level };
      if (!best || RANK[level] > RANK[best.level] || (level === best.level && score(cand) > score(best))) best = cand;
    }
    out.push(best);
  }
  return out;
}

/** Top `count` days (best first), at least `minGapDays` apart, so the picks aren't all one stretch. */
export function bestDays(days, count = 3, minGapDays = 4) {
  const order = days.map((d, i) => ({ ...d, i }))
    .filter((d) => d.level !== 'poor')
    .sort((a, b) => RANK[b.level] - RANK[a.level] || score(b) - score(a));
  const picks = [];
  for (const d of order) {
    if (picks.every((p) => Math.abs(p.i - d.i) >= minGapDays)) picks.push(d);
    if (picks.length === count) break;
  }
  return picks;
}
