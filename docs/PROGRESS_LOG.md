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

## Session 4: Sat 2026-11-14 (help, verdict, speed labels), approved by owner and committed

**Context:** the owner tried the app and found it hard to tell what to do or how to control it. We agreed the goal is to help planners find the best **place and time** to land (the best spot changes with the date), not to have the app pick one spot.

**Done**
- **Help panel:** a "How to use" button, or `?` / `H`. It covers what the app tells you, 5 steps for making a decision, every control, and a legend for the 3D view, skyline strip, timeline and right panel. It's a native `<dialog>`: Esc or a click outside closes it. Deep link: `?help=1`.
- **First-visit tip** at the top-left of the 3D view. It's shown once per browser (localStorage, try/catch) and never in tour or deep-link mode.
- **Verdict box** under the site name: Good, Workable or Poor for a solar lander touching down now, plus one plain sentence on light and Earth link. Thresholds are in DECISIONS.md #12 and in constants in `renderVerdict` (`src/main.js`).
- **Speed labels:** each option says how long a Moon day takes. Rationale in DECISIONS.md #11.
- `npm run screenshots` now also captures `review/help.png`.

**Verified:** `npm test` passes (8/8 science checks plus the build). Screenshots reviewed. Green verdicts confirmed for Malapert (2027-01-14), IM-2 (01-15), IM-1 (01-18) and the ridge (01-11). Red on Shackleton floor.

**Known:** at 1280×720 the verdict box pushes the Earth readout below the fold. This goes to the projector-check item.

**Ideas parked:** a "best spots" heatmap on the 2D map (stretch, ~2–3 h). The owner has Easter-egg ideas to add at the end.

**Next**: the tour click-through (P0), then the projector check, then the loading indicator, then Challenge coverage starting with the landing-date chart.

## Session 5: Sat 2026-11-14 (design overhaul), approved by owner and committed

**Context:** the owner said the app "looks AI-coded", and the presentation is now a **recorded video**: a 30-second official demo with the owner's voice-over, plus a 3-minute walkthrough. Checked the official 2026 submission guide: the demo must be a video of 30 s or less (or ≤ 7 slides), linked rather than uploaded, with English subtitles if needed and no one under 18. Both video plans are in PLAN.md → Delivery. The owner picked the **"mission control"** look.

**Done**
- Full-window 3D. The top bar, site list, readout, time dock and tour card float over it. Panel heights follow the dock through a `--dock-h` CSS variable set from JS.
- `scene.setInsetBottom()`: the camera view offset centres the 3D scene in the part not covered by the dock.
- Site name as a large Newsreader serif title over the sky (new dependency `@fontsource-variable/newsreader`). Serif for the verdict, tour titles and help headings. Archivo stays for interface text and numbers.
- Site list as text on a dark fade with an amber active dot. The compare toggle is a circle that turns blue with a ✓. An instruction line sits above the list. The site list hides during the tour.
- Frosted-glass readout and dock, pill buttons, glowing numbers. Countdowns keep each number with its unit (non-breaking spaces).

**Verified:** `npm test` passes (8/8 plus the build). Screenshots reviewed at 1600×900 and 1280×720 and on the tour scenes. The owner approved ("looks so much better").

**Known:** at 720p the dock takes nearly half the height, and scene 8's comparison table is scrolled out of view. This goes to the 1080p/720p check.

**Next**: the owner wants to find *where* to land (and where the water is), not only when. A proposed site-finder map is under discussion.

## Session 6: Sat 2026-11-14 (realistic 3D), approved by owner and committed

**Context:** the owner asked why the NASA tools look realistic and ours didn't. Their tools drape LRO photographs over terrain, but those have frozen shadows that would clash with our moving Sun. So we made the 3D realistic in ways that stay correct as the Sun moves. Earlier this session a site-finder map (NASA sunlight, Earth, ice and slope layers) was built, but the owner preferred the existing design. It's parked on local branch `parked/site-finder-map` (not pushed), and extras were cut from scope. `docs/TODO.md` is now the single to-do list.

**Done**
- `build_horizons.py`: terrain patches are now 513² on a warped grid (`warp` = 0.25 in the patch metadata), ~29 m at the centre and ~290 m at the edges. Horizons are byte-identical to before.
- `scene.js`: warped grid plus km-based UVs. Procedural regolith albedo (3 km tile) and bump map (~40 m tile). Hemisphere fill removed. Earthshine from Earth's direction × phase, plus faint ambient. The Sun lights the landscape whenever it's above the flat horizon (shadows decide the rest). HDR Sun sprite with bloom (EffectComposer, MSAA, UnrealBloom, OutputPass). NASA SVS 3615 Earth texture in a custom shader (true-Sun phase, atmosphere rim, sub-lunar longitude facing the viewer). Horizon wall from the mask at eye level, so the Sun and Earth are clipped where the numbers say. Eye-level auto-exposure and bounce light when the site is in shadow (visual only).
- Tour scene 3 faces the sunlit crater wall (`faceAway`).
- Docs: SCIENCE.md §5 (how the 3D is drawn, including visual aids), DECISIONS #13–14.

**Verified:** `npm test` passes (8/8 plus the build). Screenshots of all tour scenes plus ridge, Malapert and floor close-ups. Owner approved.

**Next**: `docs/TODO.md` → Core features, starting with the landing-date chart.

## Session 7: Sat 2026-11-14 (landing-date chart), approved by owner and committed

**Done**
- `src/core/landing.js` (pure): `landingDays()` samples hourly with `analyse()` and gives, for each day, the best touchdown hour: hours of light until the first sunset, Earth fraction over the first 14 days, and good/ok/poor (`classify`, shared with the verdict). `bestDays()` returns the top picks, kept a few days apart. Ranking within a level: min(light, 20 d) + 10 × Earth.
- `src/datechart.js`: bar chart in the readout under the verdict. Height = light days (capped at 20, dotted 10-day line), colour = level, blue strip = Earth. Hover gives a plain-English description; click jumps there. Three "Best" day buttons.
- The owner asked for the chart to match the main timeline's rhythm, so it covers **the same 30-day window as the timeline** and recomputes when the window moves.
- Verdict now uses the same rule (Earth over the next 14 days), so a green day always gives a green verdict.
- `npm test`: 10 checks. New: the floor has 0 usable days, and Apollo 11's best windows are 29.6 days apart (one lunar day).

**Next**: Season view.
