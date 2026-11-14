// Science regression test: one year of sunlight / Earth-visibility stats for every site,
// checked against what physics and published studies say. Exits 1 if anything is off.
// Run: node scripts/sanity-check.mjs   (part of `npm test`)
import { readFileSync, existsSync } from 'node:fs';
import { analyse, nextTransition } from '../src/core/analysis.js';
import { smoothHorizon, terrainHorizon } from '../src/core/horizon.js';

const { sites } = JSON.parse(readFileSync(new URL('../src/data/sites.json', import.meta.url)));
const start = new Date(process.argv[2] || '2027-01-01T00:00:00Z');

// [site id, metric, min, max, why]
const EXPECT = [
  ['shackleton-ridge', 'sunlitPct', 80, 95, 'literature: connecting ridge ~86–89% sunlit'],
  ['shackleton-floor', 'sunlitPct', 0, 0.5, 'permanently shadowed region'],
  ['change4', 'earthVisiblePct', 0, 0.5, 'far side: Earth never rises'],
  ['change6', 'earthVisiblePct', 0, 0.5, 'far side: Earth never rises'],
  ['apollo11', 'earthVisiblePct', 99.5, 100, 'near side: Earth always up'],
  ['apollo11', 'sunlitPct', 45, 55, 'equator: ~half the time sunlit'],
  ['apollo11', 'maxSunEl', 80, 90, 'equator: Sun passes near the zenith'],
  ['malapert', 'earthVisiblePct', 70, 90, 'high massif sees Earth most of the time'],
];

const results = new Map();
const t = performance.now();
for (const s of sites) {
  const f = new URL(`../public/data/sites/${s.id}.json`, import.meta.url);
  let site = s, hz = smoothHorizon();
  if (existsSync(f)) { const d = JSON.parse(readFileSync(f)); site = { ...s, lat: d.lat, lon: d.lon, heightM: d.heightM }; hz = terrainHorizon(d); }
  const a = analyse(site, hz, start, 365, 60).summary;
  results.set(s.id, a);
  const ss = nextTransition(site, hz, start, 'sun', false);
  console.log(`${s.id.padEnd(17)} ${hz.kind.padEnd(7)} sun ${a.sunlitPct.toFixed(1).padStart(5)}%  earth ${a.earthVisiblePct.toFixed(1).padStart(5)}%  both ${a.bothPct.toFixed(1).padStart(5)}%  maxEl ${a.maxSunEl.toFixed(1).padStart(5)}  longestDark ${a.longestDarkHours.toFixed(0).padStart(5)} h  nextSunset ${ss ? new Date(ss).toISOString().slice(0, 16) : '—'}`);
}
console.log(`(${((performance.now() - t) / 1000).toFixed(1)} s)\n`);

let fail = 0;
for (const [id, k, lo, hi, why] of EXPECT) {
  const v = results.get(id)?.[k];
  const ok = v >= lo && v <= hi;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${k} = ${v?.toFixed(2)}  (expected ${lo}–${hi}: ${why})`);
}
// Landing-date planner (core/landing.js): no usable day on a permanently shadowed floor, and at the
// equator good landing windows come once per lunar day (synodic month, ~29.5 days).
{
  const { landingDays, bestDays } = await import('../src/core/landing.js');
  const load = (id) => {
    const s = sites.find((x) => x.id === id), f = new URL(`../public/data/sites/${id}.json`, import.meta.url);
    if (!existsSync(f)) return [s, smoothHorizon()];
    const d = JSON.parse(readFileSync(f));
    return [{ ...s, lat: d.lat, lon: d.lon, heightM: d.heightM }, terrainHorizon(d)];
  };
  const floor = landingDays(...load('shackleton-floor'), start, 60);
  const usable = floor.filter((d) => d.level !== 'poor').length;
  let ok = usable === 0; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  planner shackleton-floor usable days = ${usable}  (expected 0: never sunlit)`);
  const picks = bestDays(landingDays(...load('apollo11'), start, 60), 2, 10).sort((a, b) => a.date - b.date);
  const gap = picks.length === 2 ? (picks[1].date - picks[0].date) / 864e5 : NaN;
  ok = gap >= 27 && gap <= 32; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  planner apollo11 gap between best windows = ${gap.toFixed(1)} d  (expected ~29.5: one lunar day)`);
}

// Season view (core/seasons.js): the 12 monthly values must average to the yearly figure, and the
// polar ridge must show real seasons (the Moon's 1.5° tilt matters at the pole).
{
  const { monthlyStats } = await import('../src/core/seasons.js');
  const d = JSON.parse(readFileSync(new URL('../public/data/sites/shackleton-ridge.json', import.meta.url)));
  const site = { lat: d.lat, lon: d.lon, heightM: d.heightM };
  const months = monthlyStats(site, terrainHorizon(d), 2027, 60);
  const days = months.map((m, i) => (Date.UTC(2027, i + 1, 1) - Date.UTC(2027, i, 1)) / 864e5);
  const mean = months.reduce((s, m, i) => s + m.sunPct * days[i], 0) / days.reduce((a, b) => a + b, 0);
  const year = results.get('shackleton-ridge').sunlitPct;
  let ok = Math.abs(mean - year) <= 1; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  seasons ridge monthly mean = ${mean.toFixed(1)}%  (expected ${year.toFixed(1)} ± 1, the yearly value)`);
  const swing = Math.max(...months.map((m) => m.sunPct)) - Math.min(...months.map((m) => m.sunPct));
  ok = swing >= 20; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  seasons ridge best-minus-worst month = ${swing.toFixed(0)} points  (expected ≥ 20: polar seasons)`);
}

console.log(fail ? `\n${fail} science check(s) FAILED` : '\nAll science checks passed');
process.exit(fail ? 1 : 0);
