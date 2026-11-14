# Demo script (about 5 minutes, no slides)

Setup: open the app in full screen and press `F` if the side panels feel busy. Click **Guided tour**, or open `?tour=1`. Use `N` / PageDown to advance (a presentation clicker works, because it sends PageDown).

| # | Scene (auto-set by the tour) | What you say (adapt it, don't read it) | Do |
|---|---|---|---|
| 0 | Title screen, ridge site | "Picking where and when to land on the Moon comes down to two questions: will I have power, and can I talk to Earth? At the south pole, where NASA is going next, those answers change every few kilometres and every few days." | Slowly orbit the 3D view |
| 1 | Apollo 11 | "On the equator it's simple. The Sun goes overhead, a day lasts two weeks, and Earth just hangs there." | Let it play |
| 2 | Chandrayaan-3 | "Go to 69° south and the Sun never gets above 22°. India's lander got one lunar day and then never woke up." | |
| 3 | Shackleton floor, eye level | "Now go to the pole. This is the floor of Shackleton crater. The Sun is up there at 1°, and the wall is 20° high. Zero sunlight, ever. That's why there's ice." | Drag to look around at the wall |
| 4 | Ridge, eye level | "About 20 km away on the rim, the Sun just circles you. 89% of the year in light, and that matches what NASA's own LRO studies found." | Point at the Sun skimming the skyline |
| 5 | Malapert vs ridge | "But power isn't everything. Look at the blue bars: Earth. The 5 km-high Malapert mountain sees Earth 80% of the time, the ridge only about half." | Point at the timeline rows |
| 6 | IM-2, launch slip | "Here's the real-world problem: the launch slips. Watch the countdown." | Press `Shift+→` 3–4 times; the countdown drops |
| 7 | Chang'e far side | "On the far side, Earth never rises, so you need a relay satellite." | |
| 8 | Comparison | "And this is the tool. Four candidate sites, a full month, side by side, every number recalculated from NASA's laser-altimeter terrain, and checked against JPL Horizons to four thousandths of a degree." | Change the date, and the bars update |

Close: "Planners, teachers, or anyone curious can get the answer in seconds, instead of piecing it together across three expert tools."

## Likely judge questions
* *How accurate is it?* JPL Horizons agreement to 0.004°. The horizons come from LOLA 40 m / 240 m data. The ridge illumination matches the literature (88.8% vs ~86–89%).
* *Why not just use Horizons?* We do use it as ground truth. Computing locally is instant across thousands of time steps and it works offline.
* *What about libration?* It's included: the body-fixed rotation model plus the true Earth–Moon geometry. It's visible as Earth's little loop in the sky.
* *Limitations?* See `SCIENCE.md` → Limitations.

## Backup plan
* No internet: `npm run build` beforehand, then `npx vite preview`. Everything is local, fonts included.
* A scene glitches: jump directly with `?tour=N`.
