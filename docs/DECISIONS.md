# Decisions (don't re-litigate without a strong reason)

| # | Decision | Why |
|---|---|---|
| 1 | **Web app, no backend** | One URL works on any laptop or projector. It can be opened offline from `dist/`, and there's no server to break during judging. |
| 2 | **Vanilla JS + Three.js, no React** | A solo 28 h project: fewer moving parts and faster iteration. The UI is small. |
| 3 | **Astronomy Engine instead of live JPL Horizons calls** | Instant results for thousands of time samples, and it works offline. Accuracy is proven by `npm run validate` against Horizons (0.004°). |
| 4 | **Precompute horizons offline in Python** | The LOLA DEMs are 235 MB. Masks plus terrain patches for 7 sites total about 1 MB. |
| 5 | **LOLA 40 m map near the pole, 240 m beyond 85°S** | Fine detail where terrain is closest. The 240 m map reaches 60°S, which covers Chandrayaan-3 and Luna-25. |
| 6 | **Visibility = >50% of the disc above the terrain** | One clear rule for the bars and countdowns. Power uses the exact visible fraction of the disc. |
| 7 | **Power shown for two panel types (upright tracking vs flat)** | Shows *why* polar landers use vertical panels, and stays honest at equatorial sites. |
| 8 | **Guided tour inside the app instead of slides** | The owner wants to present by talking over a live simulation. |
| 9 | **Real terrain only where we have it; label the rest** | Credibility. Apollo and mid-latitude sites say "Smooth horizon: terrain not modelled here". |
| 10 | **Team name "Rimlight"** | Crater rims that catch light at the pole are exactly what the tool finds. |
| 11 | **Time-lapse speeds: 1 h, 6 h, 12 h, 1 day, 3 days of Moon time per second (default 6 h)** | One Moon day (sunrise to sunrise) is ~29.5 Earth days, or ~709 h. At 6 h/s a full day takes ~2 min, slow enough to watch the Sun move. At 1 day/s it takes ~30 s, which suits a talk. Each menu option says how long one Moon day takes. The tour sets its own speed for each scene. |
| 12 | **Verdict line: "good" means 10+ days of light before the first sunset and Earth in view ≥ 50% of the 30 days; "poor" means in shadow now or under 2 days of light; anything else is "workable"** | It turns the numbers into a decision a non-expert can read aloud. 10 days is roughly one lunar day of surface operations, like the CLPS missions. The thresholds are named constants at the top of `renderVerdict` in `src/main.js`. |
| 13 | **Realistic 3D without photo textures** | NASA's photo mosaics have shadows frozen in from when they were taken, which would clash with our moving Sun. Instead we use finer real terrain (40 m data), a procedural regolith texture, physically motivated lighting and NASA's Earth image. Everything stays correct as the Sun moves. |
| 14 | **Eye-level auto-exposure and bounce light in shadow** | Physically, a shadowed crater floor is nearly black, which is useless on video. A camera would raise its exposure, and real shadowed craters are lit faintly by sunlight bouncing off sunlit walls. Both are visual only; the numbers are unchanged. |
