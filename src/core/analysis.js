// Turns raw Sun/Earth angles into mission-planning numbers:
// sunlight %, Earth-visibility %, time until sunset / Earthset, longest night, power index.

import { skyAt } from './ephemeris.js';
import { visibleFraction } from './horizon.js';

const HOUR = 3600e3;

/** One instant: angles + horizon-aware visibility. */
export function stateAt(site, horizon, date) {
  const s = skyAt(site, date);
  const sunH = horizon.elAt(s.sun.az);
  const earthH = horizon.elAt(s.earth.az);
  s.sun.horizonEl = sunH;
  s.earth.horizonEl = earthH;
  s.sun.visible = visibleFraction(s.sun.el, sunH, s.sun.radiusDeg);
  s.earth.visible = visibleFraction(s.earth.el, earthH, s.earth.radiusDeg);
  // Power proxies (fraction of the 1361 W/m^2 solar constant):
  //  - vertical panel that tracks the Sun in azimuth: cos(el) — ideal at the poles
  //  - horizontal (deck-mounted) panel: sin(el)
  const el = Math.max(0, s.sun.el) * Math.PI / 180;
  s.power = {
    verticalTracking: s.sun.visible * Math.cos(el),
    horizontal: s.sun.visible * Math.sin(el),
  };
  return s;
}

/**
 * Sample a time span and summarise. stepMin=30 over 30 days = 1440 samples (~15 ms).
 * Returns per-sample series (for timelines) + summary metrics + event list.
 */
export function analyse(site, horizon, start, days = 30, stepMin = 30) {
  const n = Math.round((days * 24 * 60) / stepMin) + 1;
  const t0 = start.getTime();
  const series = new Array(n);
  let sunSum = 0, earthSum = 0, bothSum = 0, pv = 0, ph = 0, elMax = -90;
  for (let i = 0; i < n; i++) {
    const s = stateAt(site, horizon, new Date(t0 + i * stepMin * 60e3));
    series[i] = { t: s.date.getTime(), sunEl: s.sun.el, sunAz: s.sun.az, sunVis: s.sun.visible,
      earthEl: s.earth.el, earthAz: s.earth.az, earthVis: s.earth.visible, pv: s.power.verticalTracking };
    sunSum += s.sun.visible;
    earthSum += s.earth.visible > 0.5 ? 1 : 0;
    bothSum += s.sun.visible > 0.5 && s.earth.visible > 0.5 ? 1 : 0;
    pv += s.power.verticalTracking;
    ph += s.power.horizontal;
    if (s.sun.el > elMax) elMax = s.sun.el;
  }
  const sunIntervals = intervals(series, (p) => p.sunVis > 0.5, stepMin);
  const earthIntervals = intervals(series, (p) => p.earthVis > 0.5, stepMin);
  return {
    start, days, stepMin, series,
    summary: {
      sunlitPct: (100 * sunSum) / n,
      earthVisiblePct: (100 * earthSum) / n,
      bothPct: (100 * bothSum) / n,
      maxSunEl: elMax,
      meanPowerVertical: pv / n,
      meanPowerHorizontal: ph / n,
      longestDarkHours: longestGap(series, (p) => p.sunVis > 0.5, stepMin),
      longestNoEarthHours: longestGap(series, (p) => p.earthVis > 0.5, stepMin),
    },
    sunIntervals, earthIntervals,
  };
}

function intervals(series, pred, stepMin) {
  const out = [];
  let open = null;
  for (const p of series) {
    if (pred(p) && open === null) open = p.t;
    if (!pred(p) && open !== null) { out.push([open, p.t]); open = null; }
  }
  if (open !== null) out.push([open, series[series.length - 1].t + stepMin * 60e3]);
  return out;
}

function longestGap(series, pred, stepMin) {
  let best = 0, run = 0;
  for (const p of series) { run = pred(p) ? 0 : run + 1; best = Math.max(best, run); }
  return (best * stepMin) / 60;
}

/**
 * Next time (ms) the body's visibility crosses 0.5 in the wanted direction, searched forward
 * from `date` up to `maxDays`, refined by bisection to ~1 minute.
 * body: 'sun' | 'earth'; wantVisible=false -> next set, true -> next rise.
 */
export function nextTransition(site, horizon, date, body, wantVisible, maxDays = 40) {
  const vis = (t) => stateAt(site, horizon, new Date(t))[body].visible > 0.5;
  const t0 = date.getTime();
  const step = 2 * HOUR;
  let prev = vis(t0);
  for (let t = t0 + step; t <= t0 + maxDays * 24 * HOUR; t += step) {
    const cur = vis(t);
    if (cur !== prev && cur === wantVisible) {
      let lo = t - step, hi = t;
      while (hi - lo > 60e3) {
        const mid = (lo + hi) / 2;
        if (vis(mid) === wantVisible) hi = mid; else lo = mid;
      }
      return hi;
    }
    prev = cur;
  }
  return null; // never within the window (e.g. permanent shadow, far side)
}
