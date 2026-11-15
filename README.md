# Rimlight Navigator

**Live: https://rimlight-navigator.vercel.app** · [Open the navigator](https://rimlight-navigator.vercel.app/app.html) · [Take the guided tour](https://rimlight-navigator.vercel.app/app.html?tour=1)

**Team Rimlight**, NASA Space Apps Challenge 2026, challenge [*Lunar Landing Site Navigator*](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)

[![CI](https://github.com/MujtabaF/rimlight-navigator/actions/workflows/ci.yml/badge.svg)](https://github.com/MujtabaF/rimlight-navigator/actions/workflows/ci.yml)

Pick a spot on the Moon and a date. Rimlight Navigator shows whether a lander there would have **sunlight for power** and **a clear line to Earth**, computed against the **real terrain skyline** from NASA laser-altimeter data.

> At the lunar south pole the Sun never climbs more than about 2° above the horizon. A ridge can be sunlit 89% of the year, while a crater floor 20 km away hasn't seen the Sun in billions of years. Move a few kilometres, or slip the launch a few days, and a site goes from great to impossible. The tools that work this out are built for specialists. Rimlight puts the answer on one screen in seconds.

![Rimlight Navigator](docs/img/screenshot.png)

## What it does

| | |
|---|---|
| **20 sites, any coordinates** | Apollo 11/15/17, CLPS landers (IM-1, IM-2, Blue Ghost), India, Japan, China and Russia, NASA Artemis III candidate regions, the Chang'e-7 target, plus 3 **Rimlight picks**. Type any coordinates; near the south pole the real skyline is computed live in your browser. |
| **Verdict** | Good, workable or poor to land right now, with countdowns to sunset and Earthset. |
| **Best days to land** | Every day of the month rated by sunlight before the first sunset and Earth contact; click a day to jump there. |
| **Compare** | Up to four sites side by side, or **two landing dates** for the same site ("the launch slipped, now what?"). |
| **Seasons** | Sunlight and Earth contact for each month of the year. |
| **3D and eye level** | Real NASA terrain (about 29 m detail at the landing spot), the Sun and Earth at their true positions, Earth with its correct phase. Stand on the surface and watch the Sun skim the skyline. |
| **Skyline and timeline** | The 360° horizon unrolled flat, and 30 days of Sun-up and Earth-up periods. |
| **Explainers** | A 9-scene guided tour, Moon vs Earth, and why Earth moves in the Moon's sky (libration). |
| **Share** | The address bar always holds the exact view (Copy link), plus a CSV export of the numbers. |

### Rimlight picks
We searched the whole south pole with NASA's own sunlight, Earth-visibility, shadow and slope maps (`scripts/find_picks.py`), then re-checked each candidate with our engine. **Two picks have power and a direct link to Earth at the same time about 60% of the year, more than any official candidate in the app (49%).** Clicking a pick jumps to its best landing date.

## Accuracy

* **Sun and Earth positions** agree with **NASA JPL Horizons to within 0.004°** (`npm run validate`). They come from [Astronomy Engine](https://github.com/cosinekitty/astronomy), rotated into the Moon's body-fixed frame (IAU model), including libration and topocentric parallax.
* **Terrain skylines** come from **NASA LRO LOLA** elevation maps (40 m and 240 m at the pole, 1.9 km globally): 720 directions, out to 300 km, with lunar curvature. No atmosphere, so no refraction.
* **Matches published results:** the Shackleton–de Gerlache ridge comes out **88.8% sunlit** in 2027 (literature: about 86–89%), the Shackleton crater floor **0%**, and the far side **0% Earth**.

## Testing

* **160 unit tests** (Vitest), including **66 saved NASA JPL Horizons answers**. **100% line coverage of the physics core** (`src/core/`).
* **15 science checks** against physics and published studies.
* **GitHub Actions** runs everything, plus a production build, on every push.

```bash
npm test           # unit tests + science checks + build
npm run coverage   # coverage report in coverage/index.html
```

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173 (landing page) and /app.html (navigator)
npm run build      # static site in dist/ (works offline and on any static host)
npm run validate   # compare against NASA JPL Horizons (needs internet)
```

Processed data is already in `public/data/`. To rebuild it from NASA's raw files (optional, about 270 MB):

```bash
python3 -m venv .venv && .venv/bin/pip install numpy pillow scipy
bash scripts/fetch_dems.sh
.venv/bin/python scripts/build_horizons.py         # site skylines + 3D terrain
.venv/bin/python scripts/build_terrain_grids.py    # grids for custom coordinates
```

**Keyboard:** `Space` play/pause · `←/→` ±1 hour · `Shift+←/→` ±1 day · `N`/`P` tour scenes · `F` hide panels · `?` help.

## How it works

The full technical write-up, with every number explained, is in **[docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md)**. The method is in [docs/SCIENCE.md](docs/SCIENCE.md).

```
src/core/       physics, no UI: ephemeris, horizon, analysis, landing planner, seasons, live terrain
src/            UI: main.js, scene.js (3D), panorama, timeline, charts, tour, landing page
src/data/       sites.json (the site catalogue)
public/data/    processed NASA LOLA skylines, terrain patches and grids
scripts/        Python data builders, JPL validation, science checks, pick finder
tests/          Vitest unit tests (+ saved JPL answers)
docs/           technical overview, science, decisions, testing, demo script
```

**Stack:** vanilla JavaScript, Three.js (WebGL), Astronomy Engine, Vite; Python (numpy, scipy) for offline data processing. Static site with no backend, hosted on Vercel.

## Data

* NASA LRO **LOLA** elevation maps and illumination products, PDS Geosciences Node (mirror: imbrium.mit.edu)
* NASA/JPL **Horizons**, the validation reference
* NASA Scientific Visualization Studio **Blue Marble** (Earth), NASA LRO **Diviner** (temperatures)
* NASA **Moon Trek** and ASU **LROC QuickMap**, for reference

## Team

**Rimlight** is a solo team. At the lunar south pole almost everything sits in shadow; only the raised crater rims catch the light. Finding that rim light is what this tool does.

**AI disclosure:** development was assisted by an AI coding assistant (Claude). All data comes from NASA, and all results are computed and tested as described above. Not an official NASA product.

License: MIT
