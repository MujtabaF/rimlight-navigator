// Prints a year of sunlight / Earth-visibility stats for every curated site.
// Expected from literature: Shackleton ridge ~80-90% sunlit; Shackleton floor 0%;
// far-side sites 0% Earth; equatorial sites ~50% sunlit.
import { readFileSync, existsSync } from 'node:fs';
import { analyse, nextTransition } from '../src/core/analysis.js';
import { smoothHorizon, terrainHorizon } from '../src/core/horizon.js';

const { sites } = JSON.parse(readFileSync(new URL('../src/data/sites.json', import.meta.url)));
const start = new Date(process.argv[2] || '2027-01-01T00:00:00Z');
const t = performance.now();
for (const s of sites) {
  const f = new URL(`../public/data/sites/${s.id}.json`, import.meta.url);
  let site = s, hz = smoothHorizon();
  if (existsSync(f)) { const d = JSON.parse(readFileSync(f)); site = { ...s, lat: d.lat, lon: d.lon, heightM: d.heightM }; hz = terrainHorizon(d); }
  const a = analyse(site, hz, start, 365, 60).summary;
  const ss = nextTransition(site, hz, start, 'sun', false);
  console.log(`${s.id.padEnd(17)} ${hz.kind.padEnd(7)} sun ${a.sunlitPct.toFixed(1).padStart(5)}%  earth ${a.earthVisiblePct.toFixed(1).padStart(5)}%  both ${a.bothPct.toFixed(1).padStart(5)}%  maxEl ${a.maxSunEl.toFixed(1).padStart(5)}  longestDark ${a.longestDarkHours.toFixed(0).padStart(5)} h  nextSunset ${ss ? new Date(ss).toISOString().slice(0,16) : '—'}`);
}
console.log(`(${((performance.now() - t) / 1000).toFixed(1)} s)`);
