# AGENTS.md: start here (for any AI assistant or new collaborator)

This is a **28-hour solo hackathon project** for NASA Space Apps 2026, challenge *Lunar Landing Site Navigator*.
The deadline is about **Sun 2026-11-15, 15:30 local time** (the project started Sat 2026-11-14 11:20). If you're picking this up mid-way, read these in order:

0. `docs/TODO.md`: **the to-do list. Work top to bottom, tick boxes as items are approved.**
1. `docs/PROJECT_BRIEF.md`: what the challenge asks for and what we're building (5 min)
2. `docs/PLAN.md`: the hour-by-hour plan and the **task checklist with status**
3. `docs/PROGRESS_LOG.md`: what has happened so far, newest at the bottom. **Read the last entry.**
4. `docs/DECISIONS.md`: choices that were already made and why (don't re-argue them)
5. `docs/SCIENCE.md`: how the physics works, only needed if you touch `src/core/` or `scripts/`
6. `docs/DEMO_SCRIPT.md`: the live presentation, which runs on the app's guided tour
7. `docs/PRESENTATION.md`: presenter cheat sheet (why the name "Rimlight", pitches, key numbers)
8. `docs/TESTING.md`: test commands and the one-step-at-a-time review loop (follow it)

## Current status (update this block every session)

* **Phase:** v0 working end-to-end; pushed to GitHub (private), not deployed. Working copy: iCloud Mujtaba/Rimlight Navigator. Owner requires ALL "Challenge coverage" items in PLAN.md before submission.
* **Works:** ephemeris (JPL-validated, 0.004°), LOLA horizons for 7 polar sites, 3D terrain view, eye-level view, panorama, 30-day timeline, comparison, countdowns, power, 8-scene guided tour, custom coordinates, deep links, "How to use" help panel (`?`), plain-English landing verdict.
* **Next up:** the first unchecked box in **`docs/TODO.md`**, the single to-do list.

## Rules of the road

* The **simulation is the presentation**, so polish and reliability beat new features. Never leave `main` in a broken state.
* `src/core/` is pure physics with no DOM. Keep it that way so `scripts/*.mjs` can run it in Node.
* Any change to `src/core/` must pass both `npm run validate` (needs internet) and `node scripts/sanity-check.mjs`.
* Site coordinates live only in `src/data/sites.json`. After editing polar sites, re-run `scripts/build_horizons.py`.
* **Log every work session** by appending to `docs/PROGRESS_LOG.md` (what changed, what's verified, what's next) and by ticking boxes in `docs/PLAN.md`.
* Commit messages end with the line `Helped by Claude`. Don't add a Co-Authored-By trailer. The owner wants each change explained before it's committed.
* The owner presents live. Any text shown on screen must be plain English that a non-specialist can read aloud.

## Commands

```bash
npm run dev                         # dev server
npm run build                       # production build -> dist/
npm test                            # science checks (13 pass/fail) + build
npm run validate                    # JPL Horizons comparison (exit 1 if > 0.1°)
npm run screenshots                 # all tour scenes -> review/*.png
node scripts/sanity-check.mjs       # 1-year stats per site
.venv/bin/python scripts/build_horizons.py   # regenerate public/data/sites/*
bash scripts/fetch_dems.sh          # download raw NASA DEMs: polar 40 m/240 m + global 1.9 km (gitignored)
```
