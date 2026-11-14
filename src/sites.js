// Loads the curated site catalog and, where available, the precomputed LOLA horizon + terrain.
import catalog from './data/sites.json';
import { smoothHorizon, terrainHorizon } from './core/horizon.js';

const BASE = import.meta.env.BASE_URL;

export async function loadSites() {
  return Promise.all(catalog.sites.map(async (s) => {
    const site = { ...s, heightM: 0, horizon: smoothHorizon(), hasTerrain: false };
    if (s.lat > -60) return site;
    try {
      const r = await fetch(`${BASE}data/sites/${s.id}.json`);
      if (!r.ok) return site;
      const d = await r.json();
      Object.assign(site, { lat: d.lat, lon: d.lon, heightM: d.heightM, horizon: terrainHorizon(d),
        hasTerrain: true, patchMeta: d.patch, horizonDistKm: d.horizonDistKm });
    } catch { /* offline or missing — falls back to smooth horizon */ }
    return site;
  }));
}

export function customSite(lat, lon) {
  return { id: 'custom', name: `Custom ${fmtLat(lat)}, ${fmtLon(lon)}`, group: 'Custom', lat, lon,
    heightM: 0, horizon: smoothHorizon(), hasTerrain: false,
    blurb: 'Custom coordinates. Horizon assumes smooth terrain (no LOLA mask computed for this point).' };
}

const patchCache = new Map();
export async function loadPatch(site) {
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
