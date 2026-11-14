# Plan (28 hours, solo)

H0 = Sat 2026-11-14 11:20. Deadline ≈ H28 = Sun 2026-11-15 15:20. **Target submitting at H26** to leave a buffer.
Priority key: **P0** = must have for the demo · **P1** = makes it impressive · **P2** = only if ahead of schedule.

## Timeline

| Hours | Block | Goal |
|---|---|---|
| H0–H1 | Setup + core ✅ | Repo, docs, physics core validated vs JPL, LOLA horizons, v0 app |
| H1–H5 | Simulation polish (P0) | Every tour scene looks great and is correct, no visual glitches, smooth transitions |
| H5–H10 | Challenge coverage | Landing-date chart, 2D map + custom horizons, future targets, season view |
| H10–H11 | Deploy | Public URL live, README screenshot |
| **H11–H17** | **Sleep** | Non-negotiable. A tired solo presenter loses more than any feature gains. |
| H17–H21 | Finish coverage + content | Date-vs-date, libration, Earth vs Moon, share/export, global terrain, bug fixes, submission text, 30-s video |
| H21–H24 | Rehearse | Run `DEMO_SCRIPT.md` 3× out loud with a timer, fix whatever trips you up |
| H24–H26 | Freeze + submit | Code freeze, final deploy, submit on the Space Apps site |
| H26–H28 | Buffer | Only emergencies |

## Checklist

### Done
- [x] Repo, README, AGENTS.md hand-off, docs set
- [x] Ephemeris core + JPL Horizons validation script (worst error 0.004°)
- [x] LOLA DEM reader, orientation verified (Shackleton bowl, Malapert peak)
- [x] Horizon masks + 60 km terrain patches for 7 polar sites
- [x] Analysis: sunlit %, Earth %, both %, longest night/blackout, power, countdowns
- [x] 3D scene, eye-level view, panorama, timeline, comparison, readouts
- [x] 8-scene guided tour, keyboard controls, deep links, focus mode
- [x] Year-long sanity check matches literature (ridge 88.8% sunlit)

### P0: simulation polish (next)
*Revised in Session 5: the presentation is a recorded video, so looks matter more. One item at a time; the owner reviews each before it's committed.*
- [x] **Design overhaul ("mission control"):** full-window 3D, floating glass panels, Newsreader serif titles, clearer compare toggle
- [ ] **Cinematic 3D:** bloom and Sun glow (`postprocessing`), textured Earth with visible phase, Sun disc clipped by terrain
- [ ] **Smooth camera fly-to** and transitions (`gsap`)
- [ ] **1080p recording check** (plus the 720p check: the dock is too tall and scene 8's comparison table is out of view)
- [x] **Help and legend:** a "How to use" button and the `?` key open the controls and a "how to read the screen" panel. A one-time tip on first visit points to it.
- [x] **Verdict line:** a plain-English "Good / Workable / Poor time to land" summary for the current site and moment
- [x] **Speed labels:** each speed option says how long a Moon day takes; rationale in DECISIONS.md #11
- [ ] Click through all 8 tour scenes in a real browser, fix anything ugly or wrong
- [ ] Smooth camera fly-to when the site changes (instead of a hard cut)
- [ ] Sun disc visibly clipped by terrain when partially set (matches the % shown)
- [ ] Loading indicator while terrain loads, plus an error message if data is missing
- [ ] Earth phase readable (lit crescent and gibbous visible in the eye view)
- [ ] Projector check: text size and contrast at 1280×720, focus mode (`F`)
- [x] Make the "+" compare button discoverable (circle toggle with a ✓, plus an instruction line above the list)
- [ ] Performance: 60 fps while playing at 3 days/s with 4 compared sites

### Challenge coverage (REQUIRED: owner wants every item done before submission)
Each item closes a gap against the official Objectives / Potential Considerations. Estimates are in hours.
- [ ] **Landing-date chart** (~1.5 h): next 60 landing days for the active site, coloured by hours of sunlight before the first sunset, plus Earth hours. Click a day to jump there. *Covers: date flexibility, schedule changes.*
- [ ] **2D south-pole map** (~2 h): top-down LOLA hillshade (60°S–90°S) with all sites marked; click anywhere to make a custom site. *Covers: 2D maps, custom coordinates.*
- [ ] **Real horizon for custom polar points** (~1 h, with the map): ship a downsampled DEM (~1 km/px) and compute the 720-direction horizon in the browser. *Covers: LOLA topography for custom sites.*
- [ ] **More future targets** (~0.5 h): Artemis III candidate regions, Chang'e-7 target. *Covers: curated future targets.*
- [ ] **Season view** (~1 h): % sunlit / % Earth for each of 12 months at the active site (and compared sites). *Covers: lunar days and seasons.*
- [ ] **Date-vs-date comparison** (~1 h): compare the same site on two landing dates side by side. *Covers: site-date combinations.*
- [ ] **Libration explainer** (~0.5 h): an overlay that explains Earth's loop in the sky. *Covers: libration consideration.*
- [ ] **Earth vs Moon panel** (~0.5 h): day length, night length, Sun height, temperature swing, side by side. *Covers: extreme differences.*
- [ ] **Share link + export** (~0.5 h): URL keeps site, date and compare set; a "Copy link" button and a CSV export of the window metrics. *Covers: team coordination.*
- [ ] **Global terrain for non-polar sites** (~1.5 h, do last): LOLA global DEM so Apollo and others get real horizons. *Covers: actual topography everywhere.*

### Nice to have (only after everything above)
- [ ] "True scale" toggle for Sun and Earth sizes
- [ ] Hover tooltips on the timeline (time, Sun el, Earth el)
- [ ] Mobile layout polish

### Delivery
**Videos (the presentation is recorded, not live).** Official rule: the project demo must be a video of **30 seconds or less** (or ≤ 7 slides), linked rather than uploaded, with English subtitles if it isn't in English, and with no one under 18 in it.
- [ ] **30-second demo** (owner voice-over): 0:00 name and team · 0:02 challenge · 0:05 title and tagline · 0:10 how it works (floor goes red, ridge goes green, comparison, launch slip; NASA LOLA plus JPL) · 0:20 future (2D map, Artemis)
- [ ] **3-minute walkthrough** (for the final-project link): hook · equator vs pole · shadow vs light · Earth link · launch slip and landing-date chart · 2D map and comparison · NASA data and accuracy · future
- [ ] **Film mode:** timed automatic tours with large captions and no interface, for clean screen recording at 1920×1080 (build in the H17–21 block)
- [ ] Deploy (Vercel or GitHub Pages) and put the URL in the README
- [ ] Make the GitHub repo public
- [ ] Screenshot → `docs/img/screenshot.png`
- [ ] 30-second screen recording of the guided tour (check Space Apps submission requirements first)
- [ ] Space Apps project page text: summary, how it works, NASA data used, AI disclosure
- [ ] Rehearse 3×; have an offline build (`npm run build && npx vite preview`) on the laptop as backup
