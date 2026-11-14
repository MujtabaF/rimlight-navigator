# Plan (28 hours, solo)

H0 = Sat 2026-11-14 11:20. Deadline ≈ H28 = Sun 2026-11-15 15:20. **Target submitting at H26** to leave a buffer.
Priority key: **P0** = must have for the demo · **P1** = makes it impressive · **P2** = only if ahead of schedule.

## Timeline

| Hours | Block | Goal |
|---|---|---|
| H0–H1 | Setup + core ✅ | Repo, docs, physics core validated vs JPL, LOLA horizons, v0 app |
| H1–H5 | Simulation polish (P0) | Every tour scene looks great and is correct, no visual glitches, smooth transitions |
| H5–H9 | Planner features (P1) | Landing-date explorer, share links, custom polar points get a real horizon |
| H9–H10 | Deploy | Public URL live, repo public, README screenshot |
| **H10–H17** | **Sleep** | Non-negotiable. A tired solo presenter loses more than any feature gains. |
| H17–H21 | Fix + content | Bugs found after sleep, copy pass, submission text, 30-s demo video |
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
- [ ] Click through all 8 tour scenes in a real browser, fix anything ugly or wrong
- [ ] Smooth camera fly-to when the site changes (instead of a hard cut)
- [ ] Sun disc visibly clipped by terrain when partially set (matches the % shown)
- [ ] Loading indicator while terrain loads, plus an error message if data is missing
- [ ] Earth phase readable (lit crescent and gibbous visible in the eye view)
- [ ] Projector check: text size and contrast at 1280×720, focus mode (`F`)
- [ ] Make the "+" compare button discoverable (tooltip or first-run hint)
- [ ] Performance: 60 fps while playing at 3 days/s with 4 compared sites

### P1: planner power features
- [ ] **Landing-date explorer:** for the active site, a strip of the next 60 landing days coloured by "hours of sunlight until first sunset" (answers "the launch slipped, what now?")
- [ ] Share link: URL updates with site, time and compare set
- [ ] Custom polar coordinates get a real horizon: ship a ~1 km downsampled DEM and compute the mask in the browser
- [ ] "True scale" toggle for Sun and Earth sizes
- [ ] Hover tooltips on the timeline (time, Sun el, Earth el)

### P2: stretch
- [ ] Global LOLA DEM so Apollo and mid-latitude sites get real horizons
- [ ] Click on the terrain to pick a custom site
- [ ] Earth libration explainer overlay
- [ ] Mobile layout polish

### Delivery
- [ ] Deploy (Vercel or GitHub Pages) and put the URL in the README
- [ ] Make the GitHub repo public
- [ ] Screenshot → `docs/img/screenshot.png`
- [ ] 30-second screen recording of the guided tour (check Space Apps submission requirements first)
- [ ] Space Apps project page text: summary, how it works, NASA data used, AI disclosure
- [ ] Rehearse 3×; have an offline build (`npm run build && npx vite preview`) on the laptop as backup
