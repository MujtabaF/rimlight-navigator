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

## The 30-second pitch (for hallways, judges walking by, the video)

> "NASA is going back to the Moon's south pole, but there the Sun and Earth both sit right on the horizon. Move a few kilometres, or slip the launch a few days, and a site can go from great to impossible. The tools that work this out today are built for specialists. Rimlight Navigator puts it on one screen: real NASA laser-altimeter terrain, the true positions of the Sun and Earth checked against JPL to four thousandths of a degree, and countdowns to sunset and Earthset. You can compare sites side by side and see a slipped launch play out in seconds."

---

## Numbers worth memorising

| Number | What it means |
|---|---|
| **0.004°** | Our worst disagreement with NASA JPL Horizons, the official ephemeris |
| **89%** | Share of 2027 the Shackleton ridge is sunlit (published studies: ~86–89%) |
| **0%** | Sunlight on the Shackleton crater floor: permanent shadow, which is where ice survives |
| **~20 km** | Distance between those two places |
| **~1.5°** | The highest the Sun gets above the horizon at the pole |
| **20°** | How high the Shackleton crater wall rises when you stand on the floor |
| **80% vs 51%** | Earth visibility at Malapert Massif versus the ridge: the power-vs-comms trade-off |
| **~14 days** | Length of a lunar day, and of a lunar night |
| **14 sites** | Apollo, commercial (CLPS), India, Japan, China, Russia, and Artemis candidates |
| **NASA LOLA** | The laser altimeter on the Lunar Reconnaissance Orbiter, the source of our terrain data |

---

## Three messages to land, whatever happens

1. **Small changes, huge impact.** Twenty kilometres or a few days can decide whether a mission works.
2. **It's real.** It uses NASA terrain data and is validated against JPL Horizons, not a toy.
3. **It's for everyone.** Planners get the numbers, students get the story, and both get it in seconds.

## Presenting tips

* Talk to people, not to the screen. The tour sets every scene for you, so you just press `N`.
* Let the visuals breathe: pause for a second when a sunset happens in the 3D view.
* If something glitches, say "let me jump ahead", then use `?tour=N` or press `N`. Don't debug live.
* End on the comparison scene, with the four sites side by side. It's the most "tool-like" image to leave judges with.
