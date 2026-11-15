// Terrain horizons for any south-polar point, computed in the browser (or in Node for tests)
// from the downsampled NASA LOLA grids written by scripts/build_map.py.
// Same method as scripts/build_horizons.py: march outward along great circles in every
// direction and keep the highest elevation angle, including lunar curvature.
// Pure maths, no DOM.

export const R_M = 1737400;
const D2R = Math.PI / 180;

/** Polar stereographic (south pole) lat/lon (deg) -> x, y (m). Same convention as the LOLA products. */
export function toXY(lat, lon) {
  const rho = 2 * R_M * Math.tan(Math.PI / 4 + (lat * D2R) / 2);
  return [rho * Math.sin(lon * D2R), rho * Math.cos(lon * D2R)];
}
/** Inverse of toXY. */
export function fromXY(x, y) {
  const rho = Math.hypot(x, y);
  return [(2 * Math.atan(rho / (2 * R_M)) - Math.PI / 2) / D2R, Math.atan2(x, y) / D2R];
}

/**
 * A square elevation grid: Int16 metres above the 1737.4 km sphere, row 0 = +y edge,
 * col 0 = -x edge, `scale` metres per pixel, centred on the pole.
 */
export function makeGrid(heights, n, scale) {
  const c = (n - 1) / 2;
  return {
    n, scale, heights,
    halfM: c * scale,
    /** Bilinear height at x, y (m), or NaN outside the grid. */
    at(x, y) {
      const col = x / scale + c, row = c - y / scale;
      if (!(col >= 0 && row >= 0 && col < n - 1 && row < n - 1)) return NaN;
      const c0 = col | 0, r0 = row | 0, fc = col - c0, fr = row - r0, i = r0 * n + c0;
      return (heights[i] * (1 - fc) + heights[i + 1] * fc) * (1 - fr)
        + (heights[i + n] * (1 - fc) + heights[i + n + 1] * fc) * fr;
    },
  };
}

/** Sample the first (finest) grid that covers the point. */
export function heightAt(grids, x, y) {
  for (const g of grids) { const h = g.at(x, y); if (h === h) return h; }
  return NaN;
}

/**
 * Ground height for a lander at x, y: the highest of the four surrounding grid nodes.
 * A lander is placed on the local high point (as the curated rim sites are snapped to the
 * crest), and bilinear blending would otherwise sink it below a narrow ridge.
 */
export function groundAt(g, x, y) {
  const c = (g.n - 1) / 2, col = x / g.scale + c, row = c - y / g.scale;
  if (!(col >= 0 && row >= 0 && col < g.n - 1 && row < g.n - 1)) return NaN;
  const i = (row | 0) * g.n + (col | 0), h = g.heights;
  return Math.max(h[i], h[i + 1], h[i + g.n], h[i + g.n + 1]);
}

/** Great-circle destination from lat/lon (deg) along azimuth az (deg) for distance d (m). */
function destination(sinP1, cosP1, l1, sinA, cosA, d) {
  const t = d / R_M, st = Math.sin(t), ct = Math.cos(t);
  const sinP2 = sinP1 * ct + cosP1 * st * cosA;
  const p2 = Math.asin(sinP2);
  const l2 = l1 + Math.atan2(sinA * st * cosP1, ct - sinP1 * sinP2);
  return [p2, l2];
}

/**
 * Horizon mask for a point: elevation angle (deg) of the skyline in each azimuth.
 * Returns the same shape as public/data/sites/<id>.json so core/horizon.js can use it.
 */
export function computeHorizon(grids, lat, lon, { azStep = 0.5, observerM = 2, maxDistM = 300000 } = {}) {
  const [x0, y0] = toXY(lat, lon);
  let h0 = NaN, g0 = grids[0];
  for (const g of grids) { h0 = groundAt(g, x0, y0); if (h0 === h0) { g0 = g; break; } }
  if (!(h0 === h0)) return null; // outside coverage
  const step0 = g0.scale / 2;
  const dists = [];
  for (let d = step0; d <= maxDistM; d *= 1.012) dists.push(d);
  const p1 = lat * D2R, l1 = lon * D2R, sinP1 = Math.sin(p1), cosP1 = Math.cos(p1);
  const r0 = R_M + h0 + observerM;
  const n = Math.round(360 / azStep);
  const horizonEl = new Array(n), horizonDistKm = new Array(n);
  for (let k = 0; k < n; k++) {
    const az = k * azStep * D2R, sinA = Math.sin(az), cosA = Math.cos(az);
    let best = -90, bestD = 0;
    for (const d of dists) {
      const [p2, l2] = destination(sinP1, cosP1, l1, sinA, cosA, d);
      const rho = 2 * R_M * Math.tan(Math.PI / 4 + p2 / 2);
      const ht = heightAt(grids, rho * Math.sin(l2), rho * Math.cos(l2));
      if (!(ht === ht)) break; // ran off the data
      const t = d / R_M, rt = R_M + ht;
      const el = Math.atan2(rt * Math.cos(t) - r0, rt * Math.sin(t));
      if (el > best) { best = el; bestD = d; }
    }
    horizonEl[k] = +(best / D2R).toFixed(3);
    horizonDistKm[k] = +(bestD / 1000).toFixed(2);
  }
  return { lat, lon, heightM: +h0.toFixed(1), azStep, horizonEl, horizonDistKm };
}

/**
 * Local 3D terrain patch (Int16 metres relative to the site), n x n over +/- halfM,
 * row 0 = north, col 0 = west. Same layout as the precomputed .bin patches.
 */
export function computePatch(grids, lat, lon, h0, { n = 129, halfM = 30000 } = {}) {
  const out = new Int16Array(n * n);
  const p1 = lat * D2R, l1 = lon * D2R, sinP1 = Math.sin(p1), cosP1 = Math.cos(p1);
  for (let r = 0; r < n; r++) {
    const Y = halfM - (2 * halfM * r) / (n - 1);
    for (let c = 0; c < n; c++) {
      const X = -halfM + (2 * halfM * c) / (n - 1);
      const d = Math.hypot(X, Y), az = Math.atan2(X, Y);
      const [p2, l2] = d ? destination(sinP1, cosP1, l1, Math.sin(az), Math.cos(az), d) : [p1, l1];
      const rho = 2 * R_M * Math.tan(Math.PI / 4 + p2 / 2);
      const h = heightAt(grids, rho * Math.sin(l2), rho * Math.cos(l2));
      out[r * n + c] = h === h ? Math.max(-32000, Math.min(32000, Math.round(h - h0))) : 0;
    }
  }
  return { n, halfSizeM: halfM, heights: out };
}
