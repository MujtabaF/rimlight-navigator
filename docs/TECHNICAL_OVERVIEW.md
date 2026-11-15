# Rimlight Navigator: technical overview

Everything you need to explain the project to a judge, an engineer or a teammate: the problem, what we built, the tech stack and why, how the physics works, the data, how we checked it, the challenges, the limitations, and what every number means.

All figures below come from the app's own calculations (one year from 1 Jan 2027, `node scripts/sanity-check.mjs`) unless a source is given.

---

## 1. The problem

NASA's next landers (commercial CLPS missions, then Artemis crews), plus China's and India's next missions, are heading to the **Moon's south pole**, because water ice may be trapped in craters there. Two questions decide whether a landing site and date work:

1. **Power.** Is the Sun above the local skyline? Most landers are solar powered, and the lunar night lasts up to two weeks. Many never wake up afterwards.
2. **Communication.** Is **Earth** above the skyline? If yes, the lander can radio home directly. If not, every message needs a relay satellite.

At the pole, the Sun and Earth both sit within a few degrees of the horizon, so a hill or crater rim decides everything. Move 20 km, or slip the launch a few days, and a site can go from great to impossible.

NASA's tools (LROC QuickMap, Moon Trek, JPL Horizons) can work this out, but they're built for specialists and each scenario takes many steps. The Space Apps challenge asked for an intuitive tool to **compare landing sites and dates**.

## 2. Why past missions are in it, if the goal is the future

The tool answers a question about **future** landings: *if a lander touched down here on this date, would it have power and a line to Earth?* The past missions have three jobs:

1. **Proof the tool is right.** We know what happened to them. Chandrayaan-3 got one lunar day of power and never woke up. Chang'e 4 needed a relay satellite because Earth never rises there. Apollo crews always had Earth in the sky. The tool reproduces all of this. If it gets known history right, you can trust it for missions that haven't flown yet.
2. **Contrast that explains the problem.** At the equator (Apollo 11) the Sun goes overhead and Earth never leaves the sky, so landing is easy. At the pole the Sun skims the horizon and a rim decides everything. Seeing both makes the polar problem obvious.
3. **Real "what if" examples.** What if IM-2 had landed a week later? The same reasoning applies to the next mission.

**Why the south pole is the focus:** it's where everyone is going next (the ice is there), and it's where the problem is hard. At the equator any day after sunrise works, so you barely need a tool. At the pole the answer changes every few kilometres and every few days.

**But it works anywhere on the Moon, on any date.** All 17 sites have real NASA terrain, including the equator and the far side, and you can type in any coordinates.

> **One line to say:** "Past missions prove the tool is right. The next missions are why it exists, and they're all heading to the south pole, where a few kilometres or a few days decide everything."

## 3. What we built

A static web app with two pages:

- **Landing page** (`index.html`): the pitch, with the live simulator in the hero, an animated 360° skyline, and real screenshots.
- **The navigator** (`app.html`). Pick any of **17 sites**, or your own coordinates, and a date:
  - **3D view** of real NASA terrain, with the Sun and Earth in their true positions. **Stand on the surface** gives an eye-level view.
  - **Verdict:** good, workable or poor to land right now, with countdowns to sunset and Earthset.
  - **Best days to land:** each day of the 30-day window rated, with the top three picked out.
  - **Side-by-side comparison** of up to 4 sites, **date vs date** (pin one landing date, compare another), and a **Year view** showing the seasons month by month.
  - **360° skyline strip** and a **30-day timeline** of Sun-up and Earth-up periods.
  - **Guided tour** (9 scenes, ending on a Rimlight pick), **Moon vs Earth** and **libration** explainers.
  - **Copy link** (the address bar always holds the exact view) and **Download CSV** (the 30-day numbers).

## 4. Tech stack and why

| Layer | Choice | Why |
|---|---|---|
| App code | **Vanilla JavaScript**, no framework | A 28-hour solo project: fewer moving parts, faster to change. The interface is small. |
| 3D | **Three.js 0.170** (WebGL) | The standard browser 3D library: terrain mesh, real-time shadows, bloom on the Sun. |
| Astronomy | **Astronomy Engine 2.1.19** | Accurate Sun, Moon and Earth positions computed **in the browser**. Instant for thousands of time steps, works offline. Checked against NASA JPL. |
| Build | **Vite 5** | Fast dev server; two-page build (landing page and app). |
| Data processing | **Python** (numpy, Pillow, scipy) | Reads NASA's raw elevation files (hundreds of MB) **once, offline**, and writes small files the browser loads. |
| Fonts | Newsreader (serif) and Archivo, bundled | A distinctive look that works with no internet. |
| Hosting | **Static site, no backend** | One URL works anywhere, nothing server-side can break during judging, and the built `dist/` folder runs offline. |
| Testing | Node science checks, plus headless-Chrome screenshots | The physics is verified on every change, plus a visual regression check. |

**Scale:** about 3,800 lines of code plus about 300 lines of tests and about 9.5 MB of processed data shipped to the browser. The raw NASA files (about 270 MB) stay offline.

**Architecture rule:** `src/core/` is pure maths with no web-page code, so exactly the same physics runs in the browser and in the Node tests.

## 5. How it works: three models

### ① Ephemeris: where are the Sun and Earth? (`src/core/ephemeris.js`)
1. Astronomy Engine gives the Sun's and Moon's positions relative to Earth at any moment.
2. We rotate those into the **Moon's own body-fixed frame** using the IAU rotation model. This automatically includes **libration**, the Moon's monthly wobble.
3. We convert them to **azimuth** (compass direction) and **elevation** (angle above the horizon) as seen from the exact landing point. This includes the site's height and **topocentric parallax**: you stand on the surface, not at the Moon's centre, which shifts Earth's position by up to about 1°.
4. **Validated against NASA JPL Horizons: worst error 0.004°** (`npm run validate`).

### ② Terrain horizon: what blocks them? (`scripts/build_horizons.py`, `src/core/horizon.js`)
1. For each site we cast **720 rays** (one every 0.5° of compass direction), each out to **300 km**, sampling NASA elevation data along great circles.
2. **Lunar curvature** is included: the Moon is small, so distant terrain drops away. Over 300 km the drop is about 26 km.
3. The highest angle along each ray is the skyline in that direction. Together they form the **horizon mask**.
4. The Sun or Earth counts as **visible** when more than 50% of its disc is above the mask. **Power** uses the exact visible fraction of the Sun's disc (circular-segment geometry), because at the pole the Sun often grazes the skyline.
5. There's no atmosphere on the Moon, so no refraction correction is needed.

### ③ Mission metrics: what does it mean? (`analysis.js`, `landing.js`, `seasons.js`)
- The app samples every 30–60 minutes over 30 days, a year, or 12 months to get: sunlit %, Earth-visible %, both at once, longest night, longest Earth blackout, power for an upright Sun-tracking panel and a flat panel, and countdowns refined to the minute by bisection.
- **One verdict rule** is used everywhere (verdict box, best-days chart, comparison cards, date vs date):
  - **Good:** at least 10 days of sunlight before the first sunset, *and* Earth in view at least 50% of the first 14 days.
  - **Poor:** less than 2 days of sunlight (or in shadow now).
  - **Workable:** anything in between.
  - Why 10 days: that's roughly one lunar day of surface operations, the length of a typical CLPS mission.

### Custom coordinates: live terrain (`src/core/terrain.js`)
Type any point south of about 83°S and the browser computes its skyline the same way the Python builder does (720 directions, great circles, lunar curvature) from two NASA LOLA grids (240 m near, 960 m out to 600 km; `scripts/build_terrain_grids.py`, about 6 MB, loaded only on first use). It also builds a 3D terrain patch. It takes about 50 ms. The grids are tested to agree with the detailed 40 m skylines within 3 points of yearly sunlight.

### The 3D view (`src/scene.js`)
- **Terrain patch:** 513 × 513 points covering 60 × 60 km. Points are about 29 m apart at the landing spot (matching NASA's 40 m data) and about 290 m apart at the edges. Lunar curvature is included.
- **Surface:** a procedural regolith texture (small craters, dust ripples) that responds correctly to the moving Sun.
- **Lighting:** the Sun is the only strong light, so shadows are near-black. Earthshine comes from Earth's real direction and grows with Earth's phase. Bloom makes the Sun glow.
- **Earth:** NASA's Blue Marble image, lit by the true Sun direction so its phase (crescent, half, full) is correct, and turned so the side really facing the Moon is the one you see.
- **Eye level:** distant mountains are drawn from the horizon mask, so the Sun and Earth disappear exactly where the numbers say they do.

## 6. The data (all NASA)

| Data | Source | Used for |
|---|---|---|
| **LOLA elevation maps:** 40 m per pixel (85°S to the pole) and 240 m per pixel (60°S to the pole) | NASA Lunar Reconnaissance Orbiter Laser Altimeter, via the PDS Geosciences Node (MIT mirror) | Skylines and 3D terrain for the 10 polar sites |
| **LOLA global elevation map:** 1.9 km per pixel | Same | Skylines and terrain for the 7 non-polar sites (Apollo 11/15/17, SLIM, Blue Ghost, Chang'e 4/6) |
| **JPL Horizons** | NASA Jet Propulsion Laboratory | Ground truth for checking our Sun and Earth positions |
| **Blue Marble Earth** (SVS 3615) | NASA Scientific Visualization Studio | Earth in the sky |
| **Diviner temperatures** | NASA LRO Diviner radiometer | Rounded figures in the Moon vs Earth panel |

**The 17 sites**
- **Artemis south pole:** Shackleton–de Gerlache Ridge, Shackleton Crater Floor, Malapert Massif
- **Future targets (approximate):** de Gerlache Rim and Haworth (both NASA Artemis III candidate regions), the Chang'e-7 target (Shackleton rim)
- **Commercial (CLPS):** IM-1 Odysseus, IM-2 Athena, Blue Ghost M1
- **International:** Chandrayaan-3, Luna-25 (target), SLIM, Chang'e 4, Chang'e 6
- **Apollo:** Apollo 11, 15, 17

## 7. How we know it's right

Three layers of testing run with `npm test`, and **GitHub Actions** runs all of them automatically on every push (`.github/workflows/ci.yml`):

1. **160 unit tests (Vitest)** in `tests/`. They check Sun and Earth positions against **66 saved NASA JPL Horizons answers** (each within 0.01°), the partial-Sun geometry, mission metrics, the verdict rule at every threshold, best days, date vs date, seasons, share links, the CSV export, the explainers, the live terrain engine for custom coordinates (it must agree with the detailed 40 m skylines within 3 points of yearly sunlight), and that every site's data file is valid. **Coverage: 100% of lines and branches in the physics core (`src/core/`), 96% overall.**
2. **15 science checks** (below): year-long results compared with physics and published studies.
3. **A production build** plus headless-browser screenshots of every tour scene.

The science checks:

| Check | Result | Why it matters |
|---|---|---|
| Shackleton ridge, year-long sunlight | **88.8%** (expected 80–95; published studies 86–89%) | Matches independent research |
| Shackleton crater floor sunlight | **0%** | A known permanently shadowed region |
| Chang'e 4 and 6 Earth visibility | **0%** | The far side never faces Earth |
| Apollo 11 Earth visibility | **100%** | The near-side equator always sees Earth |
| Apollo 11 sunlight | **48.5%** (expected about 50%) | At the equator, day and night are equal |
| Apollo 11 highest Sun | **89.8°** | The Sun passes almost overhead at the equator |
| Malapert Earth visibility | **80.2%** | A tall mountain sees over the horizon |
| Crater floor: usable landing days | **0** | The planner never recommends a dark crater |
| Apollo 11: gap between best landing windows | **29.6 days** | Exactly one lunar day (29.5 days) |
| Ridge: 12 monthly values averaged | **88.8%** = the yearly value | The Year view is consistent |
| Ridge: best month minus worst month | **38 points** | Polar seasons are real |
| Apollo 15 highest skyline | **12.4°** | The real Apennine mountains show up |
| Rimlight picks: power and Earth at once | **60.5% and 60.2%** vs 48.9% for the best official candidate | Our picks really are better on the combined measure |
| Pole Ridge pick sunlight | **77.3%** | The power pick stays mostly sunlit |

Plus the **JPL Horizons comparison (0.004°)** and screenshot checks of every tour scene.

## 7b. Rimlight picks: our own ideal spots

`scripts/find_picks.py` scores every 120 m cell from 85°S to the pole using NASA's LOLA team maps: sunlight × (0.4 + 0.6 × Earth visibility) × safe slope (≤ 8°) × ice nearby (permanent shadow within 1–5 km). It keeps the best spots at least 12 km apart and away from existing sites. The app then **re-checks every pick with its own skyline and ephemeris** and finds the best landing dates:

| Pick | Sunlight | Earth | Power + Earth at once | Best 2027 landings |
|---|---|---|---|---|
| **1: Malapert Shoulder** (85.92°S, 4.10°W) | 60.5% | 100% | **60.5%** | Sep 8, Oct 7, Nov 6 (about 19 days of light each) |
| **2: Nobile Plateau** (84.37°S, 43.37°E) | 60.2% | 100% | **60.2%** | Sep 30, Oct 30, Nov 29 |
| **3: Pole Ridge** (89.80°S, 53.99°E) | 77.3% | 49% | 36.1% | **Oct 9: 47 days of sunlight** |
| *Shackleton ridge (official)* | 88.8% | 51% | *48.9%* | |

**Picks 1 and 2 have power and a direct link to Earth at the same time for about 60% of the year, more than any official candidate in the app.** Clicking a pick in the app jumps straight to its best landing date.

## 8. Challenges and how we solved them

1. **NASA's map orientation.** The textbook pixel formula put features in the wrong place: one axis is flipped. We proved the correct orientation with known landmarks: Shackleton's bowl (2.8 km below the reference) and Malapert's peak (5.1 km above).
2. **Tiny angles matter.** At the pole the Sun only reaches about 2°. Lunar curvature, site height, the partial Sun disc and the lander standing 2 m above the ground all had to be modelled, or the answers came out wrong.
3. **Realism vs a moving Sun.** NASA's photo maps have shadows frozen in from the moment each photo was taken, so draping them over our terrain would show two sets of shadows. We built realism that stays correct as the Sun moves instead: finer terrain, a procedural surface, and physically motivated lighting.
4. **Shadowed scenes were pitch black.** That's physically true, but useless on video. We added camera-style auto-exposure and a soft "bounce light" (sunlight reflected off sunlit crater walls, the same effect that lets NASA's ShadowCam see inside dark craters). These are visual only; the numbers are unchanged.
5. **Placing future targets.** NASA describes Artemis III candidates as regions, not points. We place each at the highest point on its crater rim, found from the terrain data. Nobile Rim was dropped because its data didn't check out.
6. **Slow NASA servers.** The more detailed global map (531 MB) was downloading at about 35 KB/s, about 4 hours. We used the 1.9 km global map instead, which is detailed enough for the distant mountains that shape those skylines.
7. **One rule, everywhere.** The verdict, the best-days chart and the comparison cards originally used slightly different definitions. We unified them, so a green day always means a green verdict.
8. **A 28-hour solo build.** We used a strict loop: one feature at a time, automatic checks, owner review in the browser, then commit.

## 9. Honest limitations

- **Terrain detail varies:** 40 m and 240 m at the polar sites, 1.9 km elsewhere, so non-polar skylines are smooth up close.
- **Custom coordinates** get a real skyline and 3D terrain computed live (about 50 ms) anywhere south of about 83°S, from NASA LOLA grids at 240 m and 960 m. Elsewhere they use a flat horizon. On sharp summits, the 240 m grid can be slightly optimistic about Earth contact.
- **The 3D patch is 60 km across.** More distant mountains are in the numbers but not drawn in 3D.
- **Future targets are approximate points** inside regions NASA and CNSA describe as areas.
- **The Sun and Earth are drawn 6× and 3× larger** than true so they're visible on screen.
- **It plans touchdown, not launch.** Launch is roughly touchdown minus the trip: about 4–5 days on a direct route, weeks to months on a low-energy route.

---

## 10. The numbers, explained

### 0.004°: accuracy against NASA JPL
- **What it is:** the biggest difference we found between our Sun and Earth positions and NASA JPL Horizons, the official solar-system ephemeris used to navigate spacecraft.
- **How we got it:** `npm run validate` asks JPL for Sun and Earth positions as seen from points on the Moon, then compares them with ours.
- **Scale:** the Sun's disc is about 0.53° wide, so our error is less than 1% of the Sun's own width. That's like aiming at a football 100 m away and missing by under a centimetre.
- **Say it as:** "Our Sun and Earth positions agree with NASA JPL to four thousandths of a degree."

### 89% vs 0%, about 20 km apart
- **What it is:** the Shackleton–de Gerlache ridge is in sunlight **88.8%** of 2027. The floor of Shackleton crater, about 20 km away, gets **0%**.
- **Why:** the ridge sits high, so the Sun circling just above the horizon clears the skyline almost all the time. The floor is 2.8 km below the rim, and the crater wall rises **20–24°** around it, while the Sun never gets above about **2°**. It never peeks over.
- **Cross-check:** published studies of this ridge give about 86–89%. NASA's own LOLA illumination maps put the best spot within 500 m at 86.4%.
- **Why it matters:** that permanent darkness keeps the floor below about −200 °C, which is why water ice can survive there. The best power and the best ice are neighbours.
- **Say it as:** "89% sunlight on the ridge, 0% on the crater floor twenty kilometres away."

### About 2°: the highest the Sun gets at the pole
- **What it is:** at the ridge, the Sun's highest point all year is **2.1°** above the horizon. At the floor's latitude it's 1.9°.
- **Why:** the Moon's axis is tilted only 1.5° to the Sun's path, so at the pole the Sun circles the horizon and only rises or sinks by a degree or two over the year.
- **Compare:** Apollo 11 (equator) 89.8°, Chandrayaan-3 (69°S) 22.2°, Malapert 5.5°.
- **Say it as:** "At the pole the Sun never climbs higher than your fist held at arm's length, about two degrees."

### 80% vs 51%: the power-vs-comms trade-off
- **What it is:** Malapert Massif sees Earth **80.2%** of the year; the Shackleton ridge **51.1%**. But the ridge has more sunlight: **88.8%** vs Malapert's **46.9%**.
- **Why:** Earth sits low near the horizon, slightly towards the near side. Malapert is a 5 km-high mountain facing Earth, so it sees over the horizon. The ridge is better placed for the Sun.
- **Why it matters:** no single site wins on everything. A planner has to choose power or comms, or a date when both line up. That's exactly what the comparison and best-days features show.
- **Say it as:** "One site gives you power, the other gives you comms."

### 29.5 days: one lunar day
- **What it is:** the time from one sunrise to the next anywhere on the Moon (the synodic month). That's about **14.8 days** of light and **14.8 days** of night at the equator.
- **Our check:** the planner's best landing windows at Apollo 11 come **29.6 days apart**.
- **Why it matters:** at most sites you get one window per month. Miss it and you wait about a month.

### Longest night: 9 days vs 15 days vs forever
- **The ridge's** longest stretch of darkness in 2027 is **221 hours (about 9 days)**. **Apollo 11's** is **356 hours (about 15 days)**. **The crater floor** is dark for the **whole year**.
- **Why it matters:** surviving the night is the hardest part of a solar mission (heaters, batteries). A 9-day night is far easier to survive than a 15-day one.

### 720 directions, 300 km: how each skyline is built
- **What it is:** for every site we check the terrain in 720 compass directions (every half degree), each up to 300 km away.
- **Why 300 km:** at the pole, mountains that far away can still block a Sun sitting 1–2° high. Lunar curvature (about 26 km of drop over 300 km) is included.
- **Why half-degree steps:** the Sun is half a degree wide, so finer steps add little and coarser steps would miss narrow peaks.

### 40 m, 240 m, 1.9 km: terrain detail
- **What it is:** the size of one data point in NASA's elevation maps. 40 m near the pole, 240 m out to 60°S, 1.9 km for the whole Moon.
- **In the 3D view:** points are about 29 m apart at the landing spot, 8× sharper than our first version.
- **Why it varies:** precision matters most at the pole, where terrain decides everything.

### 20 sites, 160 tests, 15 checks
- **20 sites:** 17 known sites plus 3 Rimlight picks. Of the 17 known sites, 10 polar (with 40 m and 240 m terrain) and 7 elsewhere (with global terrain), spanning NASA, commercial landers, India, Japan, China and Russia, plus 3 future targets.
- **160 unit tests and 15 science checks** run on every change (section 7), with 100% coverage of the physics code.

### 10 days and 50%: the "good" thresholds
- **10 days of sunlight before the first sunset:** about one lunar day of operations, the length of a typical commercial (CLPS) mission.
- **Earth in view at least 50% of the first 14 days:** enough regular contact to send data home without a relay.
- **Under 2 days of light:** marked poor, because a lander would barely finish setting up before the dark.

### 4–5 days: Earth to the Moon
- A direct trip (Apollo, Artemis crews, many landers) takes about **4–5 days**, so you launch about 4–5 days before a green landing day. Low-energy routes take weeks to months.

### 38 points: polar seasons
- **What it is:** the ridge's sunlight swings from **100%** in some months (Jan, Aug–Dec) to **62%** in April, a 38-point difference.
- **Why:** the Moon's 1.5° tilt is small, but at the pole it decides whether the Sun clears the skyline. Even the sunniest spot on the Moon has a winter.

### 12.4°: Apollo 15's mountains
- **What it is:** the highest point of the skyline at the Apollo 15 site, from NASA's global terrain.
- **Why:** Apollo 15 landed in a valley beside the Apennine mountains (Mons Hadley and Hadley Delta rise 3–4 km above the plain). It proves the global terrain is real, not a flat stand-in.

### 6× and 3×: drawn sizes
- In the 3D view the Sun is drawn 6× and Earth 3× larger than their true sizes (0.53° and about 1.9° across), so they're visible on a screen. The calculations always use the true sizes.

---

## 11. Short answers to likely questions

- **"How accurate is it?"** Sun and Earth positions agree with NASA JPL to 0.004°. Terrain is NASA's laser-altimeter data. The ridge's 89% sunlight matches published studies.
- **"Why not just use JPL Horizons?"** We use it as ground truth. Computing locally is instant across thousands of time steps, works offline, and adds what Horizons doesn't: the terrain skyline, verdicts, best days and comparison.
- **"Is it only for the south pole?"** No. Any site, any date. The pole gets the most detailed terrain because that's where precision decides missions.
- **"What about libration?"** It's included through the Moon's rotation model and the true Earth–Moon geometry. You can see it as Earth's monthly loop in the sky (the libration explainer draws it).
- **"What's AI's role?"** The app was built with help from an AI coding assistant (Claude). All data is from NASA, and all numbers are computed and tested by the app.
