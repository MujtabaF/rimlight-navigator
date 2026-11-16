# Demo script: the two videos

The presentation is **recorded**, not live. There are two videos:

1. **The 30-second demo**: the official Space Apps project demo. It must be **30 seconds or less**, linked (not uploaded), with English subtitles if it isn't in English, and no one under 18 in it.
2. **The 3-minute walkthrough**: linked from the project page for judges who want more.

**Recording setup:** Chrome, full screen, 1920×1080. Use macOS screen recording (`Cmd + Shift + 5`, "Record Selected Portion"). Close other tabs and turn on Do Not Disturb. Record the picture first, then add the voice-over, so you never have to talk and click at the same time.

**Handy links** (open on the deployed site, or `http://localhost:5173/` locally):

| Shot | Link |
|---|---|
| 30-second demo, self-playing | `/app.html?film=30` |
| Landing page hero (live Sun on the ridge) | `/` |
| Clean Moon, no interface | `/app.html?clean=1&site=shackleton-ridge&t=2027-01-11T15:00&eye=1&play=1&speed=1.5&follow=1` |
| Tour scene N (1–9) | `/app.html?tour=N` |
| Crater floor vs ridge | `/app.html?tour=3`, then `?tour=4` |
| Launch slip | `/app.html?tour=6` (press `Shift + →` a few times) |
| Your pick on its best date | `/app.html?tour=9` |
| Date vs date | `/app.html?site=malapert&t=2027-01-20T12:00&pin=2027-01-13T05:00` |
| Seasons | `/app.html?site=shackleton-ridge&dock=year&cmp=malapert` |
| Custom point inside a crater | `/app.html?lat=-87.5&lon=45&t=2027-01-12T00:00` |
| Moon vs Earth / libration | `/app.html?site=shackleton-ridge&explain=evm`, `/app.html?site=malapert&explain=lib` |

---

## Video 1: 30 seconds (self-playing, captioned)

Open **`/app.html?film=30`** (or `/?film=30`), full screen, and record the screen. It plays by itself for 30 seconds: a pointer clicks through the app and large captions tell the story, so the video works with the sound off. The captions are also the voice-over script and the subtitles.

| Time | On screen | Caption = voice-over |
|---|---|---|
| 0:00–0:04 | Ridge at eye level, the Sun skimming the skyline | "The Moon's south pole: where NASA lands next." |
| 0:04–0:08 | Shackleton crater floor, the wall towering above | "This crater floor: 0% sunlight." |
| 0:08–0:12 | Back on the ridge | "20 km away, the ridge: 89%." |
| 0:12–0:17 | Malapert: "Poor time to land", then the pointer clicks the best day | "Pick a site. It finds the best day to land." |
| 0:17–0:22 | Four candidates side by side, all good on the best shared day | "Compare sites side by side, in seconds." |
| 0:22–0:27 | Rimlight pick 1 on its best date | "Our pick: power and Earth contact 60% of the year." |
| 0:27–0:30 | Same view | "Rimlight Navigator. Find the light." |

**Voice-over:** your own voice, recorded over the finished video (QuickTime: File → New Audio Recording while the video plays, then combine in iMovie). Read one line per caption, about 60 words in total.

---|---|---|
| 0:00–0:03 | Landing page hero, the Sun skimming the horizon | "I'm [your name], Team Rimlight." |
| 0:03–0:07 | Tour scene 3 (crater floor), then scene 4 (ridge) | "NASA's next landers go to the Moon's south pole, where sunlight and contact with Earth are rare." |
| 0:07–0:11 | The name on the landing page, then the navigator | "Rimlight Navigator shows where and when a lander gets both." |
| 0:11–0:21 | Quick cuts: verdict turning green, the best-days chart, comparison cards, date vs date | "It uses NASA's laser terrain maps and Sun and Earth positions checked against JPL. Pick a site and a date, and get the answer in seconds." |
| 0:21–0:30 | Tour scene 9 (your pick), then pull back | "It even found landing spots that beat NASA's own candidates. Find the light, before we land." |

**Subtitles:** if the voice-over is in English, captions are optional, but they help when judges watch muted. Burn them in with iMovie or CapCut.

---

## Video 2: 3-minute walkthrough

| Time | Section | Show | Say (adapt, don't read) |
|---|---|---|---|
| 0:00–0:15 | **Hook** | Landing page hero, live Sun on the ridge | "Where do you land on the Moon? At the south pole, the answer changes every few kilometres and every few days." |
| 0:15–0:35 | **Equator vs pole** | Tour 1 (Apollo 11), tour 2 (Chandrayaan-3) | "At the equator the Sun goes overhead and Earth never leaves the sky. Go south and the Sun stays low. Chandrayaan-3 got one lunar day of power and never woke up." |
| 0:35–1:00 | **Shadow vs light** | Tour 3 (crater floor, eye level), tour 4 (ridge) | "This crater floor hasn't seen the Sun in billions of years, which is why ice survives there. Twenty kilometres away, the ridge is sunlit 89% of the year." |
| 1:00–1:20 | **Talking to Earth** | Tour 5 (Malapert vs ridge), the libration explainer | "Earth bobs along the horizon. Malapert sees it 80% of the time, the ridge about half. One gives power, the other gives contact." |
| 1:20–1:45 | **The launch slips** | Tour 6, `Shift + →`, the best-days chart, date vs date | "Launches slip. Every day late is a day of mission lost. The best-days chart and date vs date show exactly what you gain or lose." |
| 1:45–2:05 | **Any site, side by side** | Tour 8 (comparison), the Year view, a custom point | "Compare up to four sites, see the seasons, or type in any coordinates, and the real skyline is computed in your browser from NASA terrain." |
| 2:05–2:30 | **Rimlight picks** | Tour 9, then the ★ group | "We searched the whole pole with NASA's maps. Our pick has power and Earth contact at the same time 60% of the year, more than any official candidate." |
| 2:30–2:50 | **Built on NASA data** | The landing page's NASA data section | "NASA LOLA terrain, positions checked against JPL to four thousandths of a degree, and 160 automated tests." |
| 2:50–3:00 | **Close** | Landing page closing line | "Pick a spot. Pick a date. Find the light." |

---

## The guided tour (9 scenes)

Press **Guided tour**, then `N` (or the Next button) to move on. A presentation clicker also works, because it sends PageDown.

| # | Scene | What it shows |
|---|---|---|
| 1 | Apollo 11 | Equator: a day lasts a month, Earth never moves |
| 2 | Chandrayaan-3 | 69°S: the Sun stays low; one lunar day of power |
| 3 | Shackleton floor (eye level) | Permanent shadow, a 20° crater wall, ice |
| 4 | Shackleton ridge (eye level) | 89% sunlight; the camera follows the Sun |
| 5 | Malapert vs ridge | Earth contact 80% vs about 50%: power or comms |
| 6 | IM-2 | The launch slips: press `Shift + →` |
| 7 | Chang'e 4 and 6 | The far side never sees Earth |
| 8 | Four candidates | Side-by-side comparison |
| 9 | Rimlight pick 1 | Our spot beats the official candidates, on its best date |

## Likely judge questions
See `TECHNICAL_OVERVIEW.md` section 11 for full answers. The short versions:
* **How accurate?** 0.004° against NASA JPL Horizons, NASA LOLA terrain, ridge sunlight matching published studies, 160 automated tests.
* **Only the south pole?** No: any site, any date. The pole gets the most detailed terrain because that's where precision decides missions.
* **Why past missions?** They prove the tool is right; the next missions are why it exists.
* **Launch date?** It plans touchdown. Launch is about 4–5 days earlier on a direct trip.

## Backup plan
* No internet: `npm run build`, then `npx vite preview`. Everything runs locally, fonts included.
* A scene looks wrong: jump straight to it with `?tour=N`.
