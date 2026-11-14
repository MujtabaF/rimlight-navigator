# Progress log

Append-only. Newest entry at the bottom. Each entry covers what changed, what was verified, and what's next.
Any AI or human picking this up should read the **last entry** first.

---

## Session 1: Sat 2026-11-14, ~11:20–12:30 (H0–H1)

**Done**
- Read the challenge (details and resources tabs). The brief is in `docs/PROJECT_BRIEF.md`.
- Picked the team name **Rimlight** and the product name **Rimlight Navigator**.
- Created a standalone git repo in `~/Nasa Space App` (note: the home folder `~` is itself a git repo, so this nested repo is intentional and separate).
- Stack: Vite + vanilla JS + Three.js + Astronomy Engine. Python with numpy is used for offline DEM processing (venv in `.venv`, Python 3.14, so use the latest numpy and pillow because old pins have no wheels).
- `src/core/ephemeris.js`: Sun and Earth az/el from a lunar surface point, using the IAU Moon rotation model and topocentric parallax.
- `scripts/validate-horizons.mjs`: compared against JPL Horizons (`coord@301`, AIRLESS). **Worst error 0.004°.**
- Downloaded LOLA `LDEM_85S_40M` and `LDEM_60S_240M` into `data/raw/` (gitignored).
- `scripts/dem.py`: **the line axis is flipped** relative to the naive formula (`line = LINE_OFFSET - y/scale`). This was verified with Shackleton centre at −2789 m and Malapert peak at +5127 m, and both DEMs agree.
- `scripts/build_horizons.py`: horizon masks (720 az, ray to 300 km, curvature included) and Int16 terrain patches (257², 60 km) for the 7 polar sites. Rim sites are snapped to the local high point within 1.5 km.
- `scripts/sanity-check.mjs`, 1 year from 2027-01-01: ridge **88.8%** sunlit (literature ~86–89%), Shackleton floor 0%, Chang'e 4/6 0% Earth. Malapert has 80% Earth versus 51% for the ridge.
- v0 UI: 3D terrain with sun-cast shadows, eye-level mode, panorama, timeline, comparison, readouts, two power types, countdowns (refined by bisection, with a 60-day fallback search), and an 8-chapter guided tour. Deep links: `?tour=N`, `?site=&t=&eye=1`.
- Screenshot-tested with headless Chrome (`--use-angle=swiftshader`). Fixed stale CSS2D labels on site switch, the "13 d 24 h" rounding bug, and dark terrain at grazing sun (raised the fill light).

**Known issues / notes**
- The 3D terrain patch is only 60 km, so very distant horizon features (which are in the mask) aren't drawn in 3D. The mask is the authority for the numbers.
- Non-polar sites use a smooth horizon and illustrative procedural terrain, and the UI says so.
- Polar site coordinates marked `approx` in sites.json are region centres, not exact points.

**Next**: the P0 list in `docs/PLAN.md`, starting with clicking through all tour scenes in a real browser.

## Session 2: Sat 2026-11-14, ~12:30–13:00

**Done**
- Created the private GitHub repo **https://github.com/MujtabaF/rimlight-navigator** and pushed v0.
- The main working copy is now **iCloud Drive → Mujtaba → Rimlight Navigator** (cloned from GitHub, NASA DEMs copied into `data/raw/`, `npm install` done). The old `~/Nasa Space App` folder is obsolete.
- Audited the app against the official Objectives and Potential Considerations. The owner decided that **every gap must be closed before submission**, so they are now listed as required in `docs/PLAN.md` → *Challenge coverage*.

**Next**: Landing-date chart, then the 2D south-pole map with real custom horizons, then future targets.

## Session 3: Sat 2026-11-14 (testing setup), approved by owner and committed

**Done (owner approved, committed)**
- `npm test` now runs 8 pass/fail science checks (`scripts/sanity-check.mjs`) and the build. All pass.
- `npm run screenshots` (`scripts/screenshots.sh`) captures every tour scene into `review/` (gitignored).
- `docs/TESTING.md` sets up the one-step-at-a-time review loop: build one item → auto-checks → show the owner → **owner approves** → commit and push.
- Added a presenter cheat sheet (`docs/PRESENTATION.md`, already committed).

**Process rule (owner's request):** one item at a time. Explain it, give a "how to test it" checklist, and wait for approval before committing or moving on.

- On review: restored the literal "—" in `package.json`, and made the 720p screenshot a single 1280×720 capture (it was being taken twice).

**Next**: PLAN.md → *P0: simulation polish*, one item at a time, starting with the tour-scene click-through.
