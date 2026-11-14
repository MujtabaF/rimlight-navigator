// Horizon models.
//  - Terrain mask: precomputed from NASA LOLA DEMs (scripts/build_horizons.py), 0.5 deg azimuth step.
//  - Smooth sphere: used where no DEM is loaded. A 2 m-tall observer on a bare sphere sees
//    the horizon ~0.05 deg below level — effectively 0.

export function smoothHorizon() {
  return { kind: 'sphere', elAt: () => -0.05, samples: null };
}

export function terrainHorizon(data) {
  const el = data.horizonEl;
  const step = data.azStep;
  const n = el.length;
  return {
    kind: 'terrain',
    samples: el,
    azStep: step,
    elAt(az) {
      const x = (((az % 360) + 360) % 360) / step;
      const i = Math.floor(x) % n;
      const f = x - Math.floor(x);
      return el[i] * (1 - f) + el[(i + 1) % n] * f;
    },
  };
}

/**
 * Fraction (0..1) of a disc of angular radius r (deg) centred at elevation `el` that sits above
 * the local horizon elevation `h`. Exact circular-segment area — the Sun at the south pole often
 * grazes the horizon, so partial discs matter for power.
 */
export function visibleFraction(el, h, r) {
  const d = (el - h) / r; // -1 .. 1 across the disc
  if (d >= 1) return 1;
  if (d <= -1) return 0;
  // area of segment above a chord at signed distance d (in radii) from the centre
  return (Math.acos(-d) + d * Math.sqrt(1 - d * d)) / Math.PI;
}
