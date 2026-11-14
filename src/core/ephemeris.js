// Sun & Earth positions as seen from a point on the lunar surface.
//
// Method (see docs/SCIENCE.md for the full explanation):
//   1. Astronomy Engine (VSOP87 + ELP/MPP02-class lunar theory) gives geocentric
//      J2000 (EQJ) vectors of the Sun and the Moon.
//   2. Moon->Sun and Moon->Earth vectors are rotated into the Moon's body-fixed
//      frame using the IAU WGCCRE rotation model (pole RA/Dec + prime-meridian spin W).
//   3. We subtract the site's position on the lunar sphere (topocentric parallax —
//      matters for Earth: up to ~1 degree) and project onto local East/North/Up.
//
// No atmosphere on the Moon => no refraction term. The horizon is pure geometry
// (sphere) plus terrain (see horizon.js).

import * as Astronomy from 'astronomy-engine';

export const MOON_RADIUS_KM = 1737.4;
export const SUN_RADIUS_KM = 695700;
export const EARTH_RADIUS_KM = 6371;
const AU_KM = 149597870.7;
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Rotation EQJ -> Moon body-fixed:  R = Rz(W) * Rx(90 - dec) * Rz(90 + ra)
function moonFrame(time) {
  const axis = Astronomy.RotationAxis(Astronomy.Body.Moon, time);
  const a = (axis.ra * 15 + 90) * D2R;
  const b = (90 - axis.dec) * D2R;
  const w = axis.spin * D2R;
  const rz = (t) => [[Math.cos(t), Math.sin(t), 0], [-Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
  const rx = (t) => [[1, 0, 0], [0, Math.cos(t), Math.sin(t)], [0, -Math.sin(t), Math.cos(t)]];
  return mul(rz(w), mul(rx(b), rz(a)));
}

function mul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
const apply = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

/** Body-fixed (km) vectors from Moon centre to Sun and to Earth at `date`. */
export function bodyFixedVectors(date) {
  const time = Astronomy.MakeTime(date);
  const sun = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
  const moon = Astronomy.GeoMoon(time);
  const M = moonFrame(time);
  const toSun = apply(M, [(sun.x - moon.x) * AU_KM, (sun.y - moon.y) * AU_KM, (sun.z - moon.z) * AU_KM]);
  const toEarth = apply(M, [-moon.x * AU_KM, -moon.y * AU_KM, -moon.z * AU_KM]);
  return { toSun, toEarth };
}

/** Selenographic lat/lon (deg, lon East) of the point directly below a body-fixed vector. */
export function subPoint(v) {
  const r = Math.hypot(v[0], v[1], v[2]);
  return { lat: Math.asin(v[2] / r) * R2D, lon: Math.atan2(v[1], v[0]) * R2D, distKm: r };
}

/** Az (deg, clockwise from lunar North) / El (deg above the local horizontal plane). */
function topocentric(v, site) {
  const lat = site.lat * D2R, lon = site.lon * D2R;
  const r = MOON_RADIUS_KM + (site.heightM || 0) / 1000;
  const cl = Math.cos(lat), sl = Math.sin(lat), co = Math.cos(lon), so = Math.sin(lon);
  const t = [v[0] - r * cl * co, v[1] - r * cl * so, v[2] - r * sl];
  const e = -so * t[0] + co * t[1];
  const n = -sl * co * t[0] - sl * so * t[1] + cl * t[2];
  const u = cl * co * t[0] + cl * so * t[1] + sl * t[2];
  const dist = Math.hypot(e, n, u);
  let az = Math.atan2(e, n) * R2D;
  if (az < 0) az += 360;
  return { az, el: Math.asin(u / dist) * R2D, distKm: dist };
}

/**
 * Full sky state for a site at a date.
 * site = { lat, lon, heightM? }   (deg, East-positive longitude)
 */
export function skyAt(site, date) {
  const { toSun, toEarth } = bodyFixedVectors(date);
  const sun = topocentric(toSun, site);
  const earth = topocentric(toEarth, site);
  sun.radiusDeg = Math.asin(SUN_RADIUS_KM / sun.distKm) * R2D; // ~0.267 deg
  earth.radiusDeg = Math.asin(EARTH_RADIUS_KM / earth.distKm) * R2D; // ~0.95 deg
  return { date, sun, earth, subSolar: subPoint(toSun), subEarth: subPoint(toEarth) };
}
