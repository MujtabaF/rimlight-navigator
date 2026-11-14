# Testing & review workflow

## How we work: one step at a time
Each feature goes through the same loop. Nothing moves forward until the owner approves it.

1. **Build:** the AI implements ONE item from `PLAN.md`.
2. **Auto-check:** the AI runs `npm test`, plus `npm run validate` if physics changed, plus `npm run screenshots`.
3. **Show:** the AI explains what changed and why, shows screenshots, and gives a short **"How to test it"** checklist for that item.
4. **Owner review:** run `npm run dev`, follow the checklist, and say *approved* or list what to fix.
5. **Ship:** only after approval, the AI commits, pushes, updates `PROGRESS_LOG.md`, and ticks `PLAN.md`.

## The four kinds of testing

| Test | Command | What it proves | When |
|---|---|---|---|
| **Science test** | `npm test` | A year of results for every site still matches physics and published studies: ridge ~89% sunlit, crater floor 0%, far side never sees Earth, equator ~50% sunlit, and so on. **10 pass/fail checks** (8 site checks + 2 landing-planner checks). Also confirms the app builds. | Every step |
| **JPL validation** | `npm run validate` | Our Sun and Earth positions agree with NASA JPL Horizons to within 0.1° (currently **0.004°**). Needs internet. | Whenever `src/core/` changes |
| **Visual check** | `npm run screenshots` | Captures all 8 tour scenes, the default view and a 720p projector-size view into `review/`, so you can see glitches without clicking through. | Every step |
| **Manual review** | `npm run dev` → browser | What only a human can judge: does it feel right, is it clear, would it impress a judge? | Every step (by the owner) |

## Standard manual checklist (do this every review, about 3 minutes)
- [ ] The page loads with no blank areas, and the 3D terrain appears.
- [ ] Click **Guided tour** and press `N` through all 8 scenes. Each one shows the right site and reads correctly.
- [ ] **Play** works and the Sun moves smoothly. `Space` pauses it.
- [ ] Click a few sites in the left list; the 3D view, numbers and timeline all change.
- [ ] Click the timeline; time jumps there.
- [ ] Press `F` for focus mode. The side panels hide, and pressing `F` again brings them back.
- [ ] Nothing looks broken or overlapping. Note anything confusing, because judges will feel it too.
- [ ] Plus the **feature-specific checklist** the AI gives you for that step.

## What "done" means for any item
* `npm test` passes, with all 10 science checks and the build.
* Screenshots look right.
* The owner has reviewed and approved it.
* It's committed and pushed, with the log and plan updated.
