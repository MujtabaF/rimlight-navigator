# Project brief

## The challenge in plain words

NASA is sending landers (CLPS commercial missions, then Artemis crews) to the Moon's **south pole**, because there may be water ice there. Two questions decide whether a landing site and date will work:

1. **Power:** is the Sun above the horizon, how high, and for how long? Solar panels need it, and when the Sun sets the night lasts up to two weeks.
2. **Communication:** is **Earth** above the horizon? If it is, the lander can radio home directly. If not, it needs a relay satellite.

At the pole both bodies hug the horizon, so a hill or crater rim can block them. Move a few kilometres, or slip the launch a few days, and the answer changes completely. Launches slip all the time.

NASA's current tools (QuickMap, Moon Trek, JPL Horizons) can work this out, but they're built for experts and each scenario takes many steps. **The ask:** build an intuitive tool that lets mission planners, teachers and the public **compare landing sites and dates quickly**. It should show Sun and Earth relative to the horizon, power potential, and direct-to-Earth windows.

The challenge suggests (all optional): curated plus custom sites, side-by-side comparison, date flexibility, Sun/Earth sky visualisation, time until sunset or Earthset, solar elevation, sunlight duration, Earth windows, 2D/3D views, animations, and suitability for all skill levels. The considerations it lists: use JPL Horizons-type ephemeris, LOLA topography for real horizons, no atmosphere means no refraction, and libration.

## What we're building: *Rimlight Navigator*

A web app where **the simulation is the presentation**:

* **Model** (the "brain"): a deterministic physics model, not machine learning.
  * The *ephemeris model* computes where the Sun and Earth are from any point on the Moon at any time. It is validated against JPL Horizons to 0.004°.
  * The *terrain horizon model* uses NASA LOLA elevation data to compute how high the terrain rises in each of 720 compass directions.
  * The *mission metrics model* combines the two: is the Sun or Earth above the terrain, what fraction of the solar disc is visible, power output, countdowns to set and rise, and percentages over a month.
* **Simulation** (the "face"): a 3D terrain scene with a moving Sun and Earth, a 360° skyline chart, a 30-day timeline, and a guided tour you click through while talking.

## Why this can win

* It's scientifically credible: real NASA terrain, validated against JPL, and it reproduces published illumination figures.
* It's immediately understandable: anyone can watch a sunset happen in 3D.
* It answers the real planner question, "the launch slipped a week, now what?", in one click.
* The live demo replaces slides, which makes the presentation natural and memorable.

## Who it's for

| User | What they get |
|---|---|
| Mission planner | Countdown numbers, % metrics, side-by-side site comparison, date scrubbing |
| Educator / student | The guided tour, eye-level view, and why the pole is weird |
| Public | Pretty, intuitive 3D, "stand on the Moon" |
