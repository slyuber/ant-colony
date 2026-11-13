# Acceptance record — 2026-11-13

Measured on the target machine (GTX 1060 6 GB, i3-8350K, Chrome 157) with
`node scripts/probe.mjs`, which opens the installed Chrome full-screen at 1920x1080
against the dev server and reads the app's own counters.

"gpu ms" is time the graphics card spends per picture. The budget at 60 pictures
per second is 16.7 ms.

## Goal 1 — smoothness

| Ants | Mean pictures/s (last 30 s) | gpu ms | Run length |
|---|---|---|---|
| 250,000 (default) | 59.9 | 3.3 to 4.5 | 45 s and 60 s |
| 500,000 | 59.4 (includes start-up second) | 8.3 | 20 s |
| 1,000,000 | 59.4 (includes start-up second) | 7.6 | 20 s |

Floor was 55. Met, with glow on Full. No fallback was needed.
The screen caps the rate at 60, so gpu ms is the honest headroom number.

## Goal 2 — trails emerge

Met. Highways between the nest and all three food piles are visible in the
10-second and 30-second screenshots after a reset.

## Goal 3 — rerouting

Met. A wall drawn across the right-hand highway at 30 s; by 95 s the highway runs
around the lower end of the wall (second colour theme, 0 console errors).

## Other checks

- Window resize mid-run: picture keeps advancing, 0 console errors.
- Unit tests: 31 passing (error messages, settings clamping, ant setup, brush queue, cursor
  mapping at 125% display scaling, uniform packing).
- All three colour themes rendered and looked at.

## Controls click-through (scripted, in Chrome)

Run with `node scripts/probe.mjs --actions ui`. All passed, 0 console errors:
Food, Wall and Erase painted where the cursor was; Scatter pushed ants away while
held; scroll wheel resized the brush; Space paused (two pictures a second apart
were pixel-identical outside the meter) and resumed, also with a slider focused;
the Ants slider moved the count from 250,000 to 300,000; colour theme switched;
F hid the meter; H hid the controls; R reset; the starting hint faded after the
first paint.

## Not checked

- A person using it by hand. Everything above was a script driving Chrome.
- A long run (over 2 minutes), Edge, a second monitor, or display scaling other
  than 100% in the browser (125% is covered by a unit test only).
- The no-WebGPU, device-lost and graphics-error messages: the wording and
  show-once logic are unit tested, but none was triggered in a real browser.
- gpu ms above 250,000 ants: short runs, smoothed reading. Treat as rough.
- Screens faster than 60 Hz: the colony would run proportionally faster.

## Changes from the design, decided during the build

- Ants carrying food have a sense of where the nest is. Pure scent-following made
  pretty loops that never reached home.
- Only one food trip in sixteen uses food up, so food lasts minutes, not seconds.
- The nest is a fixed disc, not something brushes can change.

## Independent review (fresh reviewer, whole branch)

No critical findings. Two important findings, both fixed:

- Graphics errors after start-up only went to the console; now the first one is
  shown on screen (tests: errors.test.ts, failed first, then passed; suite 31/31).
- Controls had never been exercised in a browser; see the click-through above.

Also fixed because the design asked for it: `npm run dev` now opens the browser.

Minor findings: eight of ten fixed in the second pass (below). Still open:

- Scatter does nothing while paused.
- An unused number (`frame`) is still sent to the graphics card.

## Second pass ("check over and improve") - 2026-11-13

Looked at 150-second screenshots of the first build and found two things a person would notice:
busy trails burned out to flat white tubes, and after two minutes most of the screen was empty.

Changed:

- Ants are now counted per pixel and the count is turned into light on a logarithmic scale. One ant
  is a visible speck; a packed highway is bright but keeps its colour. Ants leaving are one colour,
  ants coming home the other.
- One ant in twelve is a scout that ignores trails, so the dark never empties and new food far from
  any highway is still found.
- A colony starts with five food piles of mixed size and distance, laid out differently each time
  (`?seed=7` in the address repeats a layout). Was three identical piles.
- Food looks like a pile of crumbs. The nest is a lit ring.
- Walls cannot be painted over the nest or its doorstep.
- Fixed: holding R; resize events that change nothing; sideways scroll; ring cursor stranded after
  releasing outside the window; stale Brush size slider; blank address values; first meter reading
  after a hidden tab.

Measured after the changes (same method as above):

| Ants | Mean pictures/s | gpu ms | Run length |
|---|---|---|---|
| 250,000 | 59.9 | 3.5 to 4.5 | 75 s and 100 s |
| 1,000,000 | 60.0 | 6.2 | 40 s |

- Unit tests: 37 passing (6 new: food layout, blank settings).
- Controls click-through re-run: all controls responded, 0 console errors.
- Food dropped far away at 50 s: ants were streaming to one pile by 100 s, the other not yet joined.
- All three colour themes looked at.

Not checked in this pass: the owner was using the test window during some runs, so those
screenshots include their strokes and the scripted results are less clean than the first pass.
The wall-reroute timing (goal 3) was not re-measured, though rerouting around hand-drawn walls
is visible in two screenshots. Cost of the new look: about 16 MB more video memory.

## Every decision made on the owner's behalf during the build

1. Worked on a branch called `build`; `main` holds only the design and plan. Not merged.
2. Made local saves (commits) at each step. Nothing was pushed anywhere.
3. Dropped a "prefer the fast graphics card" request that Chrome on Windows ignores.
   Cost if wrong: on a two-card laptop it might pick the weaker card.
4. Nest is a fixed disc, not paintable. Cost: cannot move the nest later without rework.
5. Starting food is placed through the same path as the Food brush.
6. Carrying ants sense where home is; home scent is only laid for about 8 seconds
   after leaving the nest. Cost: slightly less "pure" emergence.
7. Ants are drawn by their own small shader file.
8. Added one shared file for UI state.
9. The smoothness meter is on by default. F hides it.
10. Scatter keeps pushing while the button is held still.
11. One food trip in sixteen uses food up. Cost: food is conserved on average, not exactly.
12. Glow "Off" still reserves about 4 MB of video memory.
13. Screens faster than 60 Hz run the colony faster. Left as is: the design targets this 60 Hz screen.
14. Second pass: scouts (1 in 12) and a random five-pile start. Cost: a little less food carried per minute; layouts are not repeatable without `?seed=`.
15. Second pass: the nest cannot be walled over.

## Third pass: living world and phone support - 2026-11-13

Design: `docs/superpowers/specs/2026-11-13-living-world-design.md`. The owner said scope and
decisions were mine to make and added one requirement: make it usable on a phone.

Built: two rival colonies with their own nests, colours and scent; populations that grow with
food brought home and shrink with upkeep and deaths; a share bar; Rivals: Race / Fight;
food that sprouts back; rain; Colonies: One / Two; touch input and a phone layout.

Measured (same method as above, 1920x1080, Chrome on the GTX 1060):

| Run | Mean pictures/s | gpu ms | Result |
|---|---|---|---|
| Two colonies, Fight, 250,000 budget, 170 s | 59.9 | 3.5 | 97k against 94k ants at the end |
| Two colonies, Fight, 1,000,000 budget, 60 s | 59.9 | 6.5 | 209k against 316k |
| One colony, 250,000, 45 s | 59.9 | 2.5 | behaves as before |
| Phone-sized screen (390x844, touch, emulated), 12 s | 53 mean, start-up dip to 28 | 1.0 | see below |

Checked against the design goals:

1. Two colonies, own trails: met (screenshots; the two colours never share a trail).
2. Growth and the share bar: met (bar and counts move; numbers above).
3. Race / Fight switch: met. Fight shows a white glint where crowds of both colonies overlap.
4. Food growth: met (new small piles appear over a run).
5. Rain: met (band with streaks at about 44 s; trails behind it were gone, then rebuilt).
6. Smoothness: met, floor 55 not approached on the desktop.
7. One colony: met.

Phone, emulated in desktop Chrome: finger painting worked, the tool strip and Settings fit a
390-point-wide screen, the page starts at 100,000 ants with soft glow and draws at most 1.5 dots
per point. If a device stays under 45 pictures a second for 3 seconds in its first half minute,
the page steps down by itself: glow first, then ants.

Unit tests: 73 passing (36 new: contest rule and its pace, nests, rain timing, sprouting, food
scatter, phone start-up settings, quality ladder, settings switches, uniform layout).

Not checked:

- A real phone. The phone run was desktop Chrome pretending, on the desktop graphics card. Speed
  on a real phone is unknown.
- Reaching the page from a phone at all. The server listens on this computer only (`127.0.0.1`),
  and phone browsers refuse the graphics feature on a plain `http://` network address. It needs
  either a published copy on an `https://` address or a secure tunnel: the owner's call.
- Whether Fight feels good. Deaths only happen where trails overlap, which is mostly at shared
  food piles; colonies that settle into separate territories rarely fight.
- Runs longer than 3 minutes, and Safari or Firefox.

Decisions made on the owner's behalf in this pass:

16. Colonies start with 35% of the ant budget each, not the 25% in the design, so the screen is
    not half empty at the start.
17. Growth is slow on purpose (a busy colony doubles in minutes). The first setting let one side
    hit its cap in 14 seconds.
18. Food cannot be painted onto a nest. It fed that colony for free.
19. Two stray ants passing do not glint in Fight; it takes a crowd on both sides.
20. On phones the smoothness meter starts hidden and the hint drops the mouse and keyboard tips.
21. No plan document was written for this pass; the design page was the plan.
