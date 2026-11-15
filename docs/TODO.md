# To-do

The one list to work from. Tick each box when the owner approves the item and it's committed.
One item at a time: build → checks → owner reviews in the browser → commit.

## 1. Core features (what the challenge asks for)
All done. See the Done list below.

## 2. Polish
All done. See the Done list below.

## 3. Ship
- [ ] Deploy to a public link, add a screenshot to the README
- [ ] Make the GitHub repo public
- [ ] **Film mode:** timed automatic tour with captions and no buttons, for clean screen recording
- [ ] Record the **30-second demo** (owner voice-over, English subtitles if needed)
- [ ] Record the **3-minute walkthrough**
- [ ] Write the Space Apps project page: summary, how it works, NASA data used, AI use, links
- [ ] **Submit** (guide says Sun 15 Nov, 23:59 local time; confirm your local event's cutoff)

## Done
- [x] v0 simulator: JPL-validated Sun and Earth, LOLA horizons for 7 polar sites, 3D view, timeline, comparison, 8-scene tour
- [x] Test setup: `npm test` science checks, `npm run screenshots`, review loop
- [x] Help panel (`?`), plain-English landing verdict, speed labels
- [x] "Mission control" redesign: full-window 3D, floating panels, serif titles, clear compare toggle
- [x] Realistic 3D: 40 m terrain near the landing spot, regolith texture, lunar lighting with earthshine, NASA Earth with correct phase, Sun hidden by real mountains
- [x] Landing-date chart: one bar per day of the 30-day window (sunlight before first sunset, Earth contact), best-day buttons, click to jump; verdict uses the same rule
- [x] Season view: Year switch in the dock, 12 months of Sun % and Earth % per site, instant tooltips, click a month to jump
- [x] Readability: right panel names its site, calm numbers while playing (3 updates/s, whole hours), selected site marked in timeline rows
- [x] Side-by-side comparison: a card per compared site under the verdict (verdict now, landing-day strip, Sun/Earth %, best day); click to switch
- [x] Date vs date: pin a date, compare two touchdowns side by side (verdict, light, Earth, longest night)
- [x] Moon vs Earth panel (top bar): day/night length, Sun height, temperature, sky, gravity
- [x] Libration explainer: Earth's real path in this site's sky, plus a 4-step explanation
- [x] Share link (address bar always matches the view) + Copy link + Download CSV (30 days, every 30 min)
- [x] More future targets: de Gerlache Rim, Haworth (Artemis III regions), Chang'e-7 target (Shackleton rim)
- [x] Real NASA terrain for all 17 sites (global LOLA map, 1.9 km, for non-polar sites)
- [x] Landing page at / (hero render, problem, product shots, NASA data, name story); navigator moved to /app.html (old links forward)
- [x] Hide panels button (same as F)
- [x] Polish: tour fixes (eye scenes follow the Sun, brighter crater floor), camera fly-in on site change, loading screen + plain error messages, 720p layout, cached timeline/skyline layers for performance
- [x] Rimlight picks (owner's Easter egg): 3 ideal south-pole spots found from NASA maps, verified by our engine, click to jump to the best date
- [x] Test suite: 150 Vitest unit tests (66 JPL Horizons fixtures, 100% coverage of src/core), 15 science checks, GitHub Actions CI
- [x] Custom coordinates near the south pole get real NASA terrain (live skyline + 3D in the browser)
