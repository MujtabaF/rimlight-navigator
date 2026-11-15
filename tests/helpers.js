// Shared helpers: load a site's real NASA-derived horizon, exactly as the app does.
import { readFileSync } from 'node:fs';
import { terrainHorizon } from '../src/core/horizon.js';

export const ROOT = new URL('../', import.meta.url);
export const catalog = JSON.parse(readFileSync(new URL('src/data/sites.json', ROOT))).sites;

export function loadSite(id) {
  const d = JSON.parse(readFileSync(new URL(`public/data/sites/${id}.json`, ROOT)));
  const meta = catalog.find((s) => s.id === id);
  const horizon = terrainHorizon(d);
  // same shape as the app's site objects (src/sites.js), which carry their own skyline
  return { site: { ...meta, lat: d.lat, lon: d.lon, heightM: d.heightM, horizon, hasTerrain: true }, horizon, data: d };
}

export const D = (iso) => new Date(iso.endsWith('Z') ? iso : iso + 'Z');
export const DAY = 864e5;
