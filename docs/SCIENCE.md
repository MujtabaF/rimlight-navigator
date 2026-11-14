# How the model works

## 1. Where are the Sun and Earth? (`src/core/ephemeris.js`)

1. Astronomy Engine gives the geocentric J2000 positions of the Sun and Moon.
2. Moon→Sun = Sun − Moon. Moon→Earth = −Moon.
3. Rotate both into the **Moon's body-fixed frame** using the IAU/WGCCRE rotation model (pole RA/Dec plus the spin angle W). The rotation is `R = Rz(W) · Rx(90° − δ) · Rz(90° + α)`. This frame is what lunar latitude and longitude are defined in, and it includes the Moon's physical libration terms.
4. Subtract the site's position on the 1737.4 km sphere. This **topocentric parallax** matters for Earth: up to ~1° of shift across the Moon.
5. Project onto local East/North/Up to get azimuth (clockwise from north) and elevation.

There's no atmosphere, so **there is no refraction**. Earth's apparent radius is ~0.95° and the Sun's is ~0.27°.

**Validation:** `npm run validate` asks JPL Horizons for the Sun and Earth az/el for observers at `coord@301` (geodetic, AIRLESS) and compares. The worst disagreement is **0.004°**.

**Why Earth wobbles but doesn't cross the sky:** the Moon always shows Earth the same face, so Earth stays near one spot in the sky. Libration (from orbital eccentricity and tilt) moves it by about ±7–8° over a month. At the south pole Earth's "spot" sits on the horizon, so that wobble decides whether you can talk to home.

## 2. What blocks them? (`scripts/build_horizons.py`, `src/core/horizon.js`)

* Data: NASA LRO **LOLA** gridded DEMs in polar stereographic projection, `LDEM_85S_40M` (40 m/px) and `LDEM_60S_240M` (240 m/px). Height = DN × 0.5 m above the 1737.4 km sphere.
* Projection gotcha: the line index is `LINE_OFFSET − y/scale` (flipped). This was verified with Shackleton's bowl and Malapert's peak.
* For each of 720 azimuths (0.5° step), march outward from 40 m to 300 km with 1% geometric spacing. At each step, compute the elevation angle of the terrain including lunar curvature:

  `el = atan2((R+h_t)·cos θ − (R+h_0), (R+h_t)·sin θ)`, with `θ = d/R`

  The horizon is the maximum along the ray. The observer is 2 m above the ground (about lander-deck height).
* Rim and peak sites are snapped to the highest LOLA point within 1.5 km, because landers target high ground.

## 3. Mission metrics (`src/core/analysis.js`)

* **Visible fraction** of the disc is the exact circular-segment area above the horizon line. This matters because the polar Sun is often half-hidden.
* **Sunlit / Earth in view:** visible fraction > 0.5, sampled every 30 min over 30 days.
* **Power:** fraction of full sunlight for an upright Sun-tracking panel (`visible·cos(el)`) and for a flat panel (`visible·sin(el)`).
* **Countdowns:** take the next crossing from the 30-min series, then refine it by bisection to about 1 minute. If there's no crossing in the window, search up to 60 days ahead.

## 4. Cross-checks

| Check | Expected (literature / physics) | Ours (2027) |
|---|---|---|
| Shackleton–de Gerlache ridge, % sunlit | ~86–89% (Bussey et al. 2010; Mazarico et al. 2011) | 88.8% |
| Shackleton floor, % sunlit | 0% (permanently shadowed) | 0.0% |
| Far side (Chang'e 4/6), Earth visible | 0% | 0.0% |
| Equatorial sites, % sunlit | ~50% | 48.6–49% |
| Max Sun elevation at the pole | ≈ 1.5° + terrain/libration effects | 1.9–2.1° |

## 5. How the 3D view is drawn (`src/scene.js`)
* **Terrain:** NASA LOLA heights on a 513 × 513 grid over 60 km. It's dense at the landing spot (~29 m, close to the 40 m source data) and coarser at the edges (~290 m), and includes lunar curvature.
* **Surface detail:** a procedurally generated regolith texture (albedo mottling plus small craters and dust ripples, tiled every ~40 m) is used only for shading detail. It doesn't change any number.
* **Lighting:** the Sun is the only strong light, and shadows come from the terrain itself. Earthshine comes from Earth's real direction and scales with Earth's phase. A faint scattered-light floor keeps shadows readable.
* **Visual aids at eye level when you stand in shadow:** the "camera" raises its exposure (like a phone in a dark room), and a soft bounce light from the Sun's side stands in for sunlight reflected off sunlit crater walls. These only make dark scenes visible. The readouts still say "In shadow" and 0% power.
* **Distant mountains** (eye level) are drawn as a wall whose top follows the real horizon mask, so the Sun and Earth are hidden exactly where the numbers say they are.
* **Earth:** NASA Scientific Visualization Studio Blue Marble map (SVS 3615). It's lit by the true Sun direction, so its phase is correct, and turned so the hemisphere that really faces the Moon is the one shown. Earth's axial tilt isn't modelled.
* **Sizes:** the Sun is drawn 6× and Earth 3× larger than true, so they're visible on screen.

## Limitations (say these honestly if asked)

* The 3D view draws 60 km of terrain. The horizon numbers use terrain out to 300 km.
* Non-polar sites use a smooth horizon (no DEM loaded).
* A small observer-height change can matter at rim sites (a 10 m mast sees more Sun). This is a possible extension.
* The Earth-visibility threshold ignores antenna beamwidth and terrain multipath.
