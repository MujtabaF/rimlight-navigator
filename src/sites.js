// Loads the curated site catalog and, where available, the precomputed LOLA horizon + terrain.
import catalog from './data/sites.json';
import { smoothHorizon, terrainHorizon } from './core/horizon.js';
import { makeGrid, computeHorizon, computePatch } from './core/terrain.js';

const BASE = import.meta.env.BASE_URL;

export async function loadSites() {
  return Promise.all(catalog.sites.map(async (s) => {
    const site = { ...s, heightM: 0, horizon: smoothHorizon(), hasTerrain: false };
    try {
      const r = await fetch(`${BASE}data/sites/${s.id}.json`);
      if (!r.ok) return site;
      const d = await r.json();
      Object.assign(site, { lat: d.lat, lon: d.lon, heightM: d.heightM, horizon: terrainHorizon(d),
        hasTerrain: true, patchMeta: d.patch, horizonDistKm: d.horizonDistKm, source: d.sourceLabel });
    } catch { /* offline or missing — falls back to smooth horizon */ }
    return site;
  }));
}

// South-polar elevation grids (scripts/build_terrain_grids.py), loaded once, on first use.
let gridsPromise = null;
function loadGrids() {
  gridsPromise ??= (async () => {
    const meta = await (await fetch(`${BASE}data/terrain/meta.json`)).json();
    const grid = async (m) => makeGrid(new Int16Array(await (await fetch(`${BASE}data/terrain/${m.file}`)).arrayBuffer()), m.n, m.scale);
    return Promise.all([grid(meta.fine), grid(meta.coarse)]);
  })();
  return gridsPromise;
}

// A user-typed point. Near the south pole (south of about 82.9°S) it gets a real skyline and 3D
// terrain computed live from NASA LOLA data; elsewhere a smooth horizon.
export async function customSite(lat, lon) {
  const base = { id: 'custom', name: `Custom ${fmtLat(lat)}, ${fmtLon(lon)}`, group: 'Custom', lat, lon };
  const smooth = { ...base, heightM: 0, horizon: smoothHorizon(), hasTerrain: false,
    blurb: 'Custom coordinates outside the south-polar terrain maps, so the skyline assumes smooth ground.' };
  if (lat > -82.8) return smooth;
  try {
    const grids = await loadGrids();
    const h = computeHorizon(grids, lat, lon);
    if (!h) return smooth;
    return { ...base, heightM: h.heightM, horizon: terrainHorizon(h), hasTerrain: true,
      patch: computePatch(grids, lat, lon, h.heightM),
      source: 'Skyline computed live from NASA LOLA terrain (240 m and 960 m maps)',
      blurb: 'Custom coordinates. The skyline and 3D terrain were computed in your browser from NASA LOLA elevation data.' };
  } catch { return smooth; } // data missing or offline: still usable with a smooth horizon
}

const patchCache = new Map();
export async function loadPatch(site) {
  if (site.patch) return site.patch; // custom points carry their own computed patch
  if (!site.hasTerrain) return null;
  if (patchCache.has(site.id)) return patchCache.get(site.id);
  const r = await fetch(`${BASE}data/sites/${site.patchMeta.file}`);
  const heights = new Int16Array(await r.arrayBuffer());
  const patch = { ...site.patchMeta, heights };
  patchCache.set(site.id, patch);
  return patch;
}

export const fmtLat = (v) => `${Math.abs(v).toFixed(2)}°${v < 0 ? 'S' : 'N'}`;
export const fmtLon = (v) => `${Math.abs(v).toFixed(2)}°${v < 0 ? 'W' : 'E'}`;
