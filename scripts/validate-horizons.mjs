// Validates src/core/ephemeris.js against NASA JPL Horizons (observer on the lunar surface).
// Usage: node scripts/validate-horizons.mjs [--save]
//   --save also writes the JPL answers to tests/fixtures/jpl-horizons.json, so the unit tests can
//   check against NASA's values offline (tests/ephemeris.test.js).
import { writeFileSync, mkdirSync } from 'node:fs';
import { skyAt } from '../src/core/ephemeris.js';

const sites = [
  { name: 'Apollo 11', lat: 0.6741, lon: 23.473 },
  { name: 'Shackleton rim', lat: -89.45, lon: -137.31 },
  { name: 'Chandrayaan-3', lat: -69.3733, lon: 32.3191 },
];
const START = '2026-11-14 00:00', STOP = '2026-12-14 00:00', STEP = '3 d';

async function horizons(body, s) {
  const p = new URLSearchParams({
    format: 'json', COMMAND: `'${body}'`, CENTER: "'coord@301'", COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${s.lon},${s.lat},0'`, MAKE_EPHEM: "'YES'", EPHEM_TYPE: "'OBSERVER'",
    START_TIME: `'${START}'`, STOP_TIME: `'${STOP}'`, STEP_SIZE: `'${STEP}'`,
    QUANTITIES: "'4'", APPARENT: "'AIRLESS'", CSV_FORMAT: "'YES'", TIME_TYPE: "'UT'",
  });
  const r = await fetch('https://ssd.jpl.nasa.gov/api/horizons.api?' + p);
  const txt = (await r.json()).result;
  const block = txt.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n');
  return block.map((l) => {
    const c = l.split(',').map((x) => x.trim());
    return { date: new Date(c[0].replace(/^(\d{4})-(\w{3})-(\d{2})/, '$2 $3 $1') + ' UTC'), az: +c[3], el: +c[4] };
  });
}

let worst = 0;
const fixture = [];
for (const s of sites) {
  for (const [body, key] of [['10', 'sun'], ['399', 'earth']]) {
    const rows = await horizons(body, s);
    for (const h of rows) {
      fixture.push({ site: s, body: key, date: h.date.toISOString(), az: h.az, el: h.el });
      const m = skyAt(s, h.date)[key];
      let daz = Math.abs(m.az - h.az); if (daz > 180) daz = 360 - daz;
      const del = Math.abs(m.el - h.el);
      // azimuth error matters less near the zenith; weight by cos(el)
      const err = Math.max(del, daz * Math.cos(h.el * Math.PI / 180));
      worst = Math.max(worst, err);
      console.log(`${s.name.padEnd(15)} ${key.padEnd(5)} ${h.date.toISOString().slice(0, 16)}  JPL el ${h.el.toFixed(3).padStart(8)} az ${h.az.toFixed(2).padStart(7)} | ours el ${m.el.toFixed(3).padStart(8)} az ${m.az.toFixed(2).padStart(7)} | dEl ${del.toFixed(3)}`);
    }
  }
}
if (process.argv.includes('--save')) {
  mkdirSync(new URL('../tests/fixtures/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../tests/fixtures/jpl-horizons.json', import.meta.url), JSON.stringify({ source: 'NASA JPL Horizons API, observer on the lunar surface (coord@301), AIRLESS', fetched: new Date().toISOString(), rows: fixture }, null, 1));
  console.log(`Saved ${fixture.length} JPL rows to tests/fixtures/jpl-horizons.json`);
}
console.log(`\nWorst angular disagreement vs JPL Horizons: ${worst.toFixed(3)} deg`);
process.exit(worst < 0.1 ? 0 : 1);
