# To-do

The one list to work from. Tick each box when the owner approves the item and it's committed.
One item at a time: build → checks → owner reviews in the browser → commit.

## 1. Core features (what the challenge asks for)
- [ ] **Side-by-side comparison in the right panel:** when sites are compared with **+**, show each one's verdict, sunlight, Earth contact and best day next to each other near the top of the panel; click one to switch to it
- [ ] **Date vs date:** the same site on two landing dates, side by side
- [ ] **Earth vs Moon panel:** day length, night length, Sun height, temperature swing, side by side
- [ ] **Libration explainer:** a short overlay on why Earth traces a small loop in the sky
- [ ] **Share link + CSV export:** the link keeps site, date and compare set; "Copy link" button; download the 30-day numbers
- [ ] **More future targets:** Artemis III candidate regions, Chang'e-7 target
- [ ] **Real terrain for non-polar sites** (Apollo, SLIM, Blue Ghost and others) from the global LOLA map

## 2. Polish
- [ ] **Tour click-through:** fix anything ugly or wrong in the 8 scenes
- [ ] **Smooth camera fly-to** when the site changes
- [ ] **Loading and error messages** (never a blank screen)
- [ ] **Screen-size check:** 1080p for recording, 720p (the dock is too tall and the scene 8 table is hidden)
- [ ] **Performance:** smooth while playing fast with 4 sites compared

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
