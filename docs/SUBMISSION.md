# Space Apps submission: text to paste

## Project Name
Rimlight Navigator

## Summary (about 180 words)
Rimlight Navigator is a web app that answers the two questions that decide every lunar landing: will the lander have sunlight for power, and can it see Earth to talk home? Pick any of 20 sites (Apollo, CLPS landers, missions from five countries, NASA Artemis III candidate regions) or type your own coordinates, choose a date, and it shows the Sun and Earth against the real terrain skyline, computed from NASA LOLA laser-altimeter data, with positions validated against NASA JPL Horizons to 0.004°.

It turns that into decisions a planner, teacher or student can read in seconds: a good/workable/poor verdict, countdowns to sunset and Earthset, the best days to land, side-by-side site comparison, a "launch slipped" comparison of two dates, and the seasons month by month. A 3D view and an eye-level mode let anyone stand on the Moon and see why a crater floor gets 0% sunlight while a ridge 20 km away gets 89%.

Searching the whole south pole with NASA's own maps, it also found landing spots with power and Earth contact at the same time 60% of the year, more than any official candidate in the app.

## Project Demonstration
The 30-second video (recorded from `app.html?film=30`), uploaded to YouTube as Unlisted or to Google Drive with "anyone with the link", and the link pasted here.

## Project
https://rimlight-navigator.vercel.app

## Project Details

**What it does**
Rimlight Navigator lets mission planners, educators and the public compare lunar landing sites and dates quickly. For any site and moment it shows where the Sun and Earth sit relative to the real local skyline, how long until sunset and Earthset, solar power for upright and flat panels, and whether a direct link to Earth is possible. It then turns that into decisions:
- A verdict (good / workable / poor to land now), using one clear rule: at least 10 days of sunlight before the first sunset, and Earth in view at least half of the first two weeks.
- Best days to land: every day of the month rated; click one to jump there.
- Side-by-side comparison of up to four sites, and "date vs date" for when a launch slips.
- A Year view showing polar seasons (even the sunniest ridge drops from 100% to 62% sunlight in April).
- 3D terrain, an eye-level "stand on the surface" view, a 360° skyline strip and a 30-day timeline, with playback.
- A 9-scene guided tour, plus "Moon vs Earth" and libration explainers for students and the public.
- Share links and CSV export so science and engineering teams can look at exactly the same scenario.
- Custom coordinates: anywhere near the south pole, the real skyline is computed live in the browser from NASA terrain.

**How it works**
1. Ephemeris: Sun and Earth positions come from Astronomy Engine, rotated into the Moon's body-fixed frame (IAU model, including libration and topocentric parallax). They agree with NASA JPL Horizons to within 0.004°.
2. Terrain horizon: for each site we cast 720 rays out to 300 km through NASA LOLA elevation maps (40 m and 240 m at the pole, 1.9 km globally), including lunar curvature. There's no atmosphere, so no refraction. The Sun or Earth is visible when more than half its disc clears the skyline; power uses the exact visible fraction.
3. Mission metrics: sampled every 30–60 minutes over 30 days or a year: sunlit %, Earth-visible %, both at once, longest night, countdowns refined to the minute.

**Validation**
- 160 automated unit tests (100% coverage of the physics code), including 66 saved NASA JPL Horizons answers.
- 15 science checks against published results: the Shackleton–de Gerlache ridge is 88.8% sunlit (literature about 86–89%), the Shackleton crater floor 0%, the far side 0% Earth, and best landing windows at the equator one lunar day (29.6 days) apart.
- GitHub Actions runs all tests on every change.

**Creativity: Rimlight picks**
We searched every 120 m cell from 85°S to the pole using NASA's LOLA sunlight, Earth-visibility, permanent-shadow and slope maps, then re-checked the best candidates with our own engine. Two picks have power and direct Earth contact at the same time about 60% of the year, versus 49% for the best official candidate in the app, with possible ice (permanent shadow) within 1–5 km. Clicking a pick jumps to its best 2027 landing date.

**Benefits and impact**
When hardware or launch schedules slip, planners can evaluate alternative dates and nearby sites in seconds instead of navigating several expert tools. Educators and the public get an intuitive way to see why the south pole is so hard, and why past missions like Chandrayaan-3 never woke up after the lunar night.

**Tools and technologies**
JavaScript, Three.js (WebGL 3D), Astronomy Engine, Vite, Vitest; Python (NumPy, SciPy, Pillow) for processing NASA data; GitHub Actions for testing; Vercel for hosting. It's a static site with no backend, so it also works offline.

**Factors we considered**
Real topography at the pole, partial Sun discs at grazing angles, lunar curvature, libration, the lack of atmosphere, polar seasons, accessibility for non-specialists (a plain-English verdict, a guided tour, explainers), and honest labelling of limitations (approximate future targets, coarser terrain away from the pole).

**Links**
- Live app: https://rimlight-navigator.vercel.app
- Source code: https://github.com/MujtabaF/rimlight-navigator
- Technical write-up: https://github.com/MujtabaF/rimlight-navigator/blob/main/docs/TECHNICAL_OVERVIEW.md

**Use of AI**
The app's code and documentation were written with the help of an AI coding assistant (Anthropic's Claude), under the team's direction and review. This is disclosed in the README and in every commit message ("Helped by Claude"). All data comes from NASA, and all results are computed by the app and verified with automated tests against NASA JPL Horizons and published studies. No AI-generated images, video or audio are used: every frame is the app itself, rendered from NASA data, and the narration is the team member's own voice.

## Use of Super Intelligence (SI)
Select the options for **code** and for **text/documentation** (whatever the form calls them). Don't select images, video or audio.

## NASA Data (Link Text → Link URL)
| Link Text | Link URL |
|---|---|
| LRO LOLA polar elevation maps (LDEM 40 m, 240 m) | https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/ |
| LRO LOLA global elevation map (LDEM_16) | https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/ |
| LRO LOLA illumination and permanent shadow maps | https://imbrium.mit.edu/EXTRAS/ILLUMINATION/ |
| PDS Geosciences Node: LRO LOLA data | https://pds-geosciences.wustl.edu/missions/lro/lola.htm |
| NASA JPL Horizons System | https://ssd.jpl.nasa.gov/horizons/ |
| NASA SVS Blue Marble Earth (SVS 3615) | https://svs.gsfc.nasa.gov/3615/ |
| NASA Lunar Reconnaissance Orbiter (incl. Diviner) | https://science.nasa.gov/mission/lro/ |
| NASA Moon Trek | https://trek.nasa.gov/moon/ |

## Space Agency Partner & Other Data
| Link Text | Link URL |
|---|---|
| LROC QuickMap (Arizona State University) | https://quickmap.lroc.asu.edu/ |
| Astronomy Engine (ephemeris library, MIT licence) | https://github.com/cosinekitty/astronomy |
| Three.js (3D library, MIT licence) | https://threejs.org/ |
| Vite (build tool) | https://vitejs.dev/ |
| Vitest (testing) | https://vitest.dev/ |
| NumPy | https://numpy.org/ |
| SciPy | https://scipy.org/ |
| Newsreader typeface (OFL) | https://fonts.google.com/specimen/Newsreader |
| Archivo typeface (OFL) | https://fonts.google.com/specimen/Archivo |
| Claude, AI coding assistant (Anthropic) | https://www.anthropic.com/claude |
| Vercel (hosting) | https://vercel.com/ |
