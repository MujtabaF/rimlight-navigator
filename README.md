# Rimlight Navigator

**Live: https://rimlight-navigator.vercel.app** · [Open the navigator](https://rimlight-navigator.vercel.app/app.html) · [Take the guided tour](https://rimlight-navigator.vercel.app/app.html?tour=1) · [Watch the 30-second demo](https://rimlight-navigator.vercel.app/app.html?film=30)

**Team Rimlight**, NASA Space Apps Challenge 2026, challenge [*Lunar Landing Site Navigator*](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)

[![CI](https://github.com/MujtabaF/rimlight-navigator/actions/workflows/ci.yml/badge.svg)](https://github.com/MujtabaF/rimlight-navigator/actions/workflows/ci.yml)

Pick a spot on the Moon and a date. Rimlight Navigator shows whether a lander there would have **sunlight for power** and **a clear line to Earth**, computed against the **real terrain skyline** from NASA laser-altimeter data.

![Rimlight Navigator](docs/img/screenshot.png)

## The problem

NASA, its commercial partners and other space agencies are heading for the Moon's south pole, because its permanently shadowed craters hold water ice. But the pole is a hard place to land:

- **The Sun never climbs more than about 2°** above the horizon. A crater rim a few kilometres away can block it for days or for ever.
- **Earth sits low too**, bobbing above and below the skyline as the Moon wobbles (libration). No Earth in view means no direct radio link.
- **A few kilometres or a few days change everything.** The Shackleton–de Gerlache ridge is sunlit 89% of the year. The crater floor 20 km away has seen no sunlight in billions of years. A launch that slips by a few days can cut a mission's daylight in half.

Answering "will my lander have power and contact here, on this date?" usually means combining several specialist tools. Rimlight puts the answer on one screen, in seconds, for planners, teachers and the public alike.

## What it does

| | |
|---|---|
| **20 sites, any coordinates** | Apollo 11/15/17, CLPS landers (IM-1, IM-2, Blue Ghost), India, Japan, China and Russia, NASA Artemis III candidate regions, the Chang'e-7 target, plus 3 **Rimlight picks**. Type any coordinates; near the south pole the real skyline is computed live in your browser. |
| **Verdict** | Good, workable or poor to land right now, with countdowns to sunset and Earthset. |
| **Best days to land** | Every day of the month rated by sunlight before the first sunset and Earth contact. Click a day to jump there. |
| **Compare** | Up to four sites side by side, or **two landing dates** for the same site ("the launch slipped, now what?"). |
| **Seasons** | Sunlight and Earth contact for each month of the year. |
| **3D and eye level** | Real NASA terrain (about 29 m detail at the landing spot), the Sun and Earth at their true positions, Earth with its correct phase. Stand on the surface and watch the Sun skim the skyline. |
| **Skyline and timeline** | The 360° horizon unrolled flat, and 30 days of Sun-up and Earth-up periods. |
| **Explainers** | A 9-scene guided tour, Moon vs Earth, and why Earth moves in the Moon's sky (libration). |
| **Share** | The address bar always holds the exact view (Copy link), plus a CSV export of the numbers. |
| **Film modes** | The app can present itself: `?film=30` plays a captioned 30-second demo, `?film=1` a 3-minute walkthrough with a pointer that uses the app like a person would. |

## Rimlight picks: we found better landing spots

We searched the whole south pole for places that get **both** power and Earth contact.

1. **Score every 120 m cell from 85°S to the pole** (`scripts/find_picks.py`) with NASA's LOLA team maps: average sunlight × (0.4 + 0.6 × Earth visibility) × safe slope (8° or less) × ice nearby (permanent shadow within 1–5 km).
2. **Keep the best spots** at least 12 km apart and away from existing sites.
3. **Re-check every candidate with our own engine** (our skyline, our ephemeris, a full year) and find its best landing dates.

| Pick | Sunlight | Earth in view | Power and Earth at once | Best 2027 landing |
|---|---|---|---|---|
| **1: Malapert Shoulder** (85.92°S, 4.10°W) | 60.5% | 100% | **60.5%** | Sep 8 (about 19 days of light) |
| **2: Nobile Plateau** (84.37°S, 43.37°E) | 60.2% | 100% | **60.2%** | Sep 30 |
| **3: Pole Ridge** (89.80°S, 53.99°E) | 77.3% | 49% | 36.1% | Oct 9 (47 days of light) |
| *Shackleton ridge, best official candidate* | 88.8% | 51% | *48.9%* | |

**Picks 1 and 2 have power and a direct link to Earth at the same time about 60% of the year, versus 49% for the best official candidate in the app.** Clicking a pick jumps to its best landing date.

## How it works

Three models, each tested on its own.

### 1. Where are the Sun and Earth? (`src/core/ephemeris.js`)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) gives the Sun's and Moon's positions at any moment.
- We rotate them into the **Moon's own body-fixed frame** with the IAU rotation model, which builds in **libration**, the Moon's monthly wobble.
- Then we convert them to compass direction and height above the horizon **as seen from the exact landing point**, including the site's elevation and **topocentric parallax** (standing on the surface instead of at the Moon's centre shifts Earth by up to about 1°).
- **Checked against NASA JPL Horizons: worst error 0.004°**, under 1% of the Sun's width.

### 2. What blocks them? The terrain skyline (`scripts/build_horizons.py`, `src/core/horizon.js`)
- For each site we cast **720 rays**, one every half degree, each **300 km** long through NASA LOLA elevation maps, following great circles.
- **Lunar curvature** is included: the Moon is small, so distant terrain drops about 26 km over 300 km.
- The highest angle along each ray becomes the skyline in that direction.
- The Sun or Earth counts as **visible** when more than half its disc clears the skyline. **Power** uses the exact visible fraction of the Sun's disc, because at the pole the Sun often grazes the ridge line.
- There's no atmosphere, so there's no refraction to correct for.

### 3. What does it mean for a mission? (`src/core/analysis.js`, `landing.js`, `seasons.js`)
- Every 30–60 minutes over 30 days or a full year, the app records: sunlit %, Earth-visible %, both at once, the longest night, the longest Earth blackout, power for upright and flat solar panels, and countdowns refined to the minute.
- **One verdict rule is used everywhere** (verdict, best-days chart, comparison cards, date vs date):
  - **Good:** at least 10 days of sunlight before the first sunset (about one lunar day of operations, like a CLPS mission) and Earth in view at least half of the first two weeks.
  - **Poor:** less than 2 days of sunlight.
  - **Workable:** anything in between.
- **Best days** are ranked by verdict, then by sunlight (counted up to 20 days) plus Earth contact.

### Custom coordinates: live terrain (`src/core/terrain.js`)
Type any point south of about 83°S, and the browser computes its skyline the same way the Python builder does, from two NASA LOLA grids (240 m near the point, 960 m out to 600 km). It also builds a 3D terrain patch. This takes about 50 ms. The grids are tested to agree with the detailed 40 m skylines within 3 points of yearly sunlight.

### The 3D view (`src/scene.js`)
- **Terrain:** a 513 × 513 mesh covering 60 × 60 km, with points about 29 m apart at the landing spot and wider towards the edges, including curvature.
- **Surface:** a procedural regolith texture (small craters, dust ripples) that lights correctly as the Sun moves.
- **Lighting:** the Sun is the only strong light, so shadows are near-black, as on the Moon. Earthshine comes from Earth's real direction and grows with Earth's phase.
- **Earth:** NASA's Blue Marble image, lit by the true Sun direction, so its phase is correct.
- **Eye level:** distant mountains are drawn from the skyline data, so the Sun and Earth disappear exactly where the numbers say they do.

## Data (all NASA)

| Data | Source | Used for |
|---|---|---|
| LOLA elevation maps, 40 m and 240 m per pixel | NASA LRO Lunar Orbiter Laser Altimeter (PDS Geosciences Node) | Skylines and 3D terrain at the pole; grids for custom coordinates |
| LOLA global elevation map, 1.9 km per pixel | Same | Skylines for non-polar sites (Apollo, SLIM, Blue Ghost, Chang'e 4/6) |
| LOLA illumination and permanent-shadow maps | LOLA team products | Searching the pole for the Rimlight picks |
| JPL Horizons | NASA Jet Propulsion Laboratory | Ground truth for Sun and Earth positions |
| Blue Marble (SVS 3615) | NASA Scientific Visualization Studio | Earth in the sky |
| Diviner temperatures | NASA LRO Diviner | Figures in the Moon vs Earth explainer |

NASA Moon Trek and ASU LROC QuickMap were used for reference. The raw NASA files (about 270 MB) are processed once, offline; the browser loads about 16 MB of compact skylines, terrain patches and grids from `public/data/`.

## How we know it's right

`npm test` runs three layers, and **GitHub Actions** runs them on every push:

1. **160 unit tests** (Vitest), including **66 saved NASA JPL Horizons answers**, the partial-Sun geometry, the verdict rule at every threshold, best days, seasons, share links, CSV export and the live terrain engine. **100% line and branch coverage of the physics core** (`src/core/`).
2. **15 science checks** against physics and published studies:

| Check | Result |
|---|---|
| Shackleton ridge, yearly sunlight | **88.8%** (published studies: about 86–89%) |
| Shackleton crater floor | **0%** sunlight, **0** usable landing days |
| Chang'e 4 and 6 (far side) | **0%** Earth in view |
| Apollo 11 (near-side equator) | **100%** Earth, **48.5%** sunlight, Sun peaks at **89.8°** |
| Apollo 11 best landing windows | **29.6 days** apart, one lunar day |
| Malapert Massif | **80.2%** Earth in view |
| Ridge, best month minus worst month | **38 points**: polar seasons are real |
| Apollo 15 highest skyline | **12.4°**: the Apennine mountains show up |
| Rimlight picks, power and Earth at once | **60.5% and 60.2%** vs 48.9% for the best official site |

3. **A production build**, plus headless-Chrome screenshots of every tour scene (`npm run screenshots`).

## How we built it

| Layer | Choice | Why |
|---|---|---|
| App | **Vanilla JavaScript** | A small interface and a solo team: fewer moving parts, faster to change |
| 3D | **Three.js** (WebGL) | Terrain mesh, real-time shadows, bloom on the Sun, labels |
| Astronomy | **Astronomy Engine** | Accurate positions computed in the browser, instantly, offline |
| Build | **Vite** | Fast dev server; two-page build (landing page and navigator) |
| Data processing | **Python** (NumPy, SciPy, Pillow) | Reads NASA's raw elevation files once and writes small files for the browser |
| Testing | **Vitest**, Node science checks, **GitHub Actions** | The physics is verified on every change |
| Hosting | **Vercel**, static site, no backend | Nothing server-side can break; the built site also works offline |

**Architecture rule:** `src/core/` is pure maths with no web-page code, so exactly the same physics runs in the browser and in the tests.

**Process:** one feature at a time. Each feature went through automated checks, then a review in the browser, then a commit. Design and science decisions are recorded in [docs/DECISIONS.md](docs/DECISIONS.md), and the session-by-session history is in [docs/PROGRESS_LOG.md](docs/PROGRESS_LOG.md).

### Challenges we solved
- **NASA's map orientation.** The textbook pixel formula put features in the wrong place because one axis is flipped. We proved the correct orientation with known landmarks: Shackleton's bowl and Malapert's peak.
- **Tiny angles matter.** With the Sun at 2°, lunar curvature, site height, the partial Sun disc and the lander's own height all change the answer, so all of them are modelled.
- **Realism with a moving Sun.** NASA's photo maps have shadows baked in from when they were taken, which would clash with our moving Sun. We built realism that stays correct instead: finer terrain, a procedural surface and physically motivated lighting.
- **Pitch-black shadow scenes.** Physically true, but useless on screen. Camera-style auto-exposure and a soft bounce light (sunlight reflected off crater walls) make them readable without changing any number.
- **Placing future targets.** NASA describes Artemis III candidates as regions. We place each at the highest point on its crater rim, found from the terrain data.
- **One rule everywhere.** The verdict, best-days chart and comparison cards started with slightly different definitions. We unified them, so a green day always means a green verdict.

### Honest limitations
- Terrain is 40 m and 240 m at the pole but 1.9 km elsewhere, so non-polar skylines are smooth up close.
- The 3D patch is 60 km across; more distant mountains are in the numbers but not drawn.
- Future targets are approximate points inside regions.
- Lander-scale hazards like boulders aren't modelled.
- The Sun and Earth are drawn 6× and 3× larger than true so they're visible.
- It plans touchdown, not launch: launch is about 4–5 days earlier on a direct trajectory.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173 (landing page) and /app.html (navigator)
npm test           # unit tests + science checks + build
npm run coverage   # coverage report in coverage/index.html
npm run build      # static site in dist/ (works offline and on any static host)
npm run validate   # compare against NASA JPL Horizons (needs internet)
```

Processed data is already in `public/data/`. To rebuild it from NASA's raw files (optional, about 270 MB):

```bash
python3 -m venv .venv && .venv/bin/pip install numpy pillow scipy
bash scripts/fetch_dems.sh
.venv/bin/python scripts/build_horizons.py         # site skylines + 3D terrain
.venv/bin/python scripts/build_terrain_grids.py    # grids for custom coordinates
.venv/bin/python scripts/find_picks.py             # the Rimlight picks search
```

**Keyboard:** `Space` play/pause · `←/→` ±1 hour · `Shift+←/→` ±1 day · `N`/`P` tour scenes · `F` hide panels · `?` help.

**Direct links:** `?site=malapert&t=2027-01-20T12:00` (site and time), `?lat=-89.47&lon=-137.4` (custom point), `?cmp=malapert,im2` (compare), `?pin=2027-01-13T05:00` (date vs date), `?dock=year` (seasons), `?tour=N` (tour scene), `?film=30` and `?film=1` (self-playing demos).

## Project structure

```
src/core/       physics, no UI: ephemeris, horizon, analysis, landing planner, seasons, live terrain
src/            UI: main.js, scene.js (3D), panorama, timeline, charts, tour, landing page
src/data/       sites.json (the site catalogue)
public/data/    processed NASA LOLA skylines, terrain patches and grids
scripts/        Python data builders, pick finder, JPL validation, science checks
tests/          Vitest unit tests (+ saved JPL answers)
docs/           technical overview, science, decisions, testing, demo scripts
```

**Further reading:** the full technical write-up with every number explained is [docs/TECHNICAL_OVERVIEW.md](docs/TECHNICAL_OVERVIEW.md). The method is in [docs/SCIENCE.md](docs/SCIENCE.md), and the test plan is in [docs/TESTING.md](docs/TESTING.md).

## Team

**Rimlight** is a solo team. At the lunar south pole almost everything sits in shadow; only the raised crater rims catch the light. Finding that rim light is what this tool does.

**AI disclosure:** development was assisted by an AI coding assistant (Claude), under the team's direction and review, and every commit says so. All data comes from NASA, and all results are computed by the app and tested as described above. No AI-generated images, video or audio are used. Not an official NASA product.

License: MIT
