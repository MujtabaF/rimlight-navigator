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
