# 3-minute live presentation: cue card

**Format:** a recorded video of the app playing its own tour (film mode, below), with you talking over it live. Or present live by pressing `N` through the tour; the script is the same.
**Length:** about 390 words, around 2 min 45 s at a calm pace, leaving 15 seconds of slack.
**Rule:** say the **bold** line in each scene; the rest is optional if you're running late.

---

## Recording the video (film mode, hands-free)
1. Dev server running (`npm run dev`), or use the live site once this is pushed.
2. Chrome, one tab, full screen (`Cmd + Ctrl + F`). Type **http://localhost:5173/?film=1** in the address bar, but don't press Enter yet.
3. Start the recording: `Cmd + Shift + 5`, choose **Record Entire Screen**, then **Record**.
4. Press Enter, then don't touch anything. It plays by itself for 3:00 (timings below). In the "try it yourself" part, an orange pointer clicks and types like a real user.
5. Stop the recording from the menu bar (⏹) at about 3:00.

**Presenting over the video:** play it full screen (QuickTime, `Cmd + F`). Each scene change is your cue. If you fall behind, drop the non-bold sentence.

## Before you start (setup, 5 minutes before)
- Laptop charged, notifications off (Do Not Disturb), other apps closed.
- Chrome, one tab: **https://rimlight-navigator.vercel.app**, full screen (`Cmd + Ctrl + F`).
- Let the landing page sit for about 5 seconds so the live Sun fades in.
- Backup tab (hidden): `localhost:4173` running from `npx vite preview` (works without Wi-Fi).
- If any scene misbehaves: put `/app.html?tour=N` in the address bar (N = the scene number). Don't debug, just jump.

---

## The script (timings match film mode exactly)

### 0:00–0:15 · Landing page (the live Sun on the horizon)
**"This is the Moon's south pole, where NASA is sending its next landers. Two questions decide every landing: will it have sunlight for power, and can it see Earth to talk home?"**

### 0:15–0:27 · Scene 1, Apollo 11
**"At the equator it's easy: the Sun takes two weeks to cross the sky, and Earth never leaves it."**

### 0:27–0:39 · Scene 2, Chandrayaan-3
**"Go south and the Sun stays low. India's lander got one lunar day of power and never woke up."**

### 0:39–0:57 · Scene 3, Shackleton crater floor
**"At the pole, this crater floor has a wall twenty degrees high, and the Sun never tops two. Zero sunlight for billions of years, which is why water ice survives here."**

### 0:57–1:11 · Scene 4, the ridge
**"Twenty kilometres away on the ridge, the Sun circles the horizon: 89% sunlight, matching NASA's published studies."**

### 1:11–1:25 · Scene 5, Malapert vs ridge
**"The blue bars are Earth contact. The mountain sees Earth 80% of the time, the ridge half. One gives power, the other gives comms."**

### 1:25–1:39 · Scene 6, IM-2 (the launch slips by itself)
**"And launches slip. Every day late, the countdown to sunset shrinks: a day of mission lost."**

### 1:39–1:47 · Scene 7, far side
**"On the far side, Earth never rises: you need a relay satellite."**

### 1:47–2:32 · Try it yourself (the pointer uses the app)
- *Typing coordinates:* **"Anyone can type in any spot near the pole. Its real skyline is computed right in the browser from NASA terrain."**
- *Clicking a best day:* **"It rates every day of the month and picks the best days to land."**
- *Pin and +1 day ×3:* **"If the launch slips, pin the date and compare: exactly what you gain or lose."**
- *Clicking +:* **"Compare up to four sites side by side."**
- *Year view:* **"And see every season, month by month."**

### 2:32–3:00 · Scene 9, your pick, and close
**"Then we searched the whole pole with NASA's maps. Our pick has power and Earth contact at the same time 60% of the year, more than any official candidate."**
**"Positions match NASA JPL to four thousandths of a degree, with 160 automated tests. Rimlight Navigator: pick a spot, pick a date, find the light. Thank you."**

---

## If you're running long
Drop the non-bold lines and shorten the try-it-yourself lines to a few words each.

## If they ask questions
- **"How accurate?"** "Within 0.004° of NASA JPL Horizons, real NASA LOLA terrain, and the ridge's 89% matches published studies."
- **"Why past missions?"** "They prove the tool is right; the next missions are why it exists."
- **"Only the south pole?"** "Any site, any date. The pole gets the finest terrain because that's where precision decides missions."
- **"What's the name?"** "At the pole only the crater rims catch the light. Finding that rim light is what the tool does."
- **"Did you use AI?"** "Yes, as a coding assistant, disclosed in the repo. The data is all NASA, and the results are tested against JPL."
