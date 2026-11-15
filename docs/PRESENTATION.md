# Presentation notes

Your personal cheat sheet for presenting. The scene-by-scene script is in `DEMO_SCRIPT.md`; this file covers the story behind the project and the lines worth memorising.

---

## Why "Rimlight"?

**Short version (say this when asked):**
> "At the Moon's south pole the Sun barely clears the horizon, so almost everything sits in shadow. The only places that catch light are the raised rims of craters. Finding that rim light is what our tool does, so we named it Rimlight."

**The two meanings behind it:**

1. **The science.** At the lunar south pole the Sun never rises more than about 1.5° above the horizon. Crater floors stay dark, and some have stayed dark for billions of years, which is where water ice can survive. Only the high **rims** and ridges catch the **light**. Choosing a landing site there is literally a search for rim light.
   * Proof from our own app: the Shackleton–de Gerlache ridge is sunlit **89%** of the year, while the floor of Shackleton crater, about **20 km away**, gets **0%**.

2. **The visual.** In photography and film, a *rim light* is a light placed behind a subject so a bright outline separates it from a dark background. That's exactly how the polar terrain looks in our 3D view: the Sun skims the horizon and outlines the ridges in gold.

**Why it works as a name:** it's short, memorable, and explaining it means explaining the core problem of the challenge in one sentence. If a judge asks about the name, that's a free chance to pitch.

**Bonus line if it fits:**
> "Rimlight is also just me. I'm a solo team, so I'm the one standing on the rim."

---

## The one-sentence pitch

> "Rimlight Navigator lets anyone pick a spot on the Moon and a date, and instantly see whether a lander there would have sunlight for power and a line of sight to Earth, using real NASA terrain."

## The 30-second pitch (hallways, judges, the video)

> "NASA is going back to the Moon's south pole, but there the Sun and Earth both sit right on the horizon. Move a few kilometres, or slip the launch a few days, and a site can go from great to impossible. Rimlight Navigator puts the whole decision on one screen: real NASA laser-altimeter terrain, Sun and Earth positions checked against JPL to four thousandths of a degree, a verdict, the best days to land, and side-by-side comparison. It even found spots that beat NASA's own candidates."

---

## Numbers worth memorising
*(`TECHNICAL_OVERVIEW.md` section 10 explains each one in depth.)*

| Number | What it means |
|---|---|
| **0.004°** | Our worst disagreement with NASA JPL Horizons, the official ephemeris |
| **89% vs 0%** | Ridge sunlight vs the Shackleton crater floor, **about 20 km** apart |
| **About 2°** | The highest the Sun gets at the pole |
| **20°** | The Shackleton crater wall, seen from the floor |
| **80% vs 51%** | Earth contact at Malapert vs the ridge (but the ridge has more Sun): power or comms |
| **60% vs 49%** | Power and Earth **at the same time**: our Pick 1 vs the best official candidate |
| **47 days** | Unbroken sunlight at our Pole Ridge pick if you land on Oct 9, 2027 |
| **29.5 days** | One lunar day; at most sites you get one landing window a month |
| **9 vs 15 days** | Longest night on the ridge vs at the equator |
| **20 sites** | Apollo, CLPS, five countries, Artemis III candidates, Chang'e-7, plus 3 Rimlight picks |
| **160 tests** | Automated tests, 100% coverage of the physics, checked against 66 NASA JPL answers |
| **NASA LOLA** | The Lunar Reconnaissance Orbiter's laser altimeter, the source of our terrain |

---

## Three messages to land, whatever happens

1. **Small changes, huge impact.** Twenty kilometres or a few days can decide whether a mission works.
2. **It's real.** It uses NASA terrain data and is validated against JPL Horizons, not a toy.
3. **It's for everyone.** Planners get the numbers, students get the story, and both get it in seconds.

## Recording tips

* Record the picture first, then the voice-over. The tour sets every scene for you, so you just press `N`.
* Let the visuals breathe: pause for a second when a sunset happens in the 3D view.
* If a take glitches, jump straight to the scene with `?tour=N` and re-record just that bit.
* End on scene 9 (your pick beating the official candidates). It's your strongest original result.
