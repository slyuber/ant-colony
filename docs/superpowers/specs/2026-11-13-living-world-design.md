# Living world: rival colonies, regrowing food, rain

Date: 2026-11-13. Builds on `2026-11-12-ant-colony-design.md`; everything there still holds
unless this page says otherwise.

## Intent

Today the picture settles after two minutes and waits for the owner. The owner asked for
competing colonies and interesting world conditions, and answered "both" to race-or-fight.
After this work the world keeps changing by itself, and the owner's walls and food tip a
real contest between two colonies.

## Goals (each one is checked on the target PC: GTX 1060, Chrome, 1920x1080)

1. Two colonies, each with its own nest, colour and scent. Ants follow only their own colony's trails.
2. A colony that brings home more food grows; one that brings home less shrinks. A bar at the
   top shows each side's share of the ants at a glance.
3. A switch, **Rivals: Race / Fight**. Race: the colonies ignore each other. Fight: where ants of
   both colonies meet, some die, and the meeting place visibly glows.
4. Food grows back: new small piles sprout at a rate set by a **Food growth** slider (off to fast).
5. Rain: with **Rain** on, a shower crosses the screen about every 90 seconds and washes away
   the scent it passes over. Trails behind it rebuild.
6. Smoothness unchanged: 60 pictures a second at 250,000 ants in total, floor 55.
7. **Colonies: 1 / 2** in Settings. With 1 the app behaves as it does today.

## Non-goals

- Three or more colonies. Wind, mud, day and night. Smarter individual ants. Sound.
- Ants steering toward or away from enemies. In Fight they only die where they happen to meet.
- A winner screen. A colony never drops below a small floor, so it can always come back.

## Anti-goals

- No per-ant work on the processor. (A handful of colony totals every half second is allowed.)
- No listener other than `127.0.0.1`.
- The single-colony look and speed must not get worse.

## Approaches considered

- **A. Share what exists (chosen).** The scent picture has four slots and uses two; colony B takes
  the other two. One ant list; odd and even slots belong to the two colonies. No extra passes,
  about no extra video memory. Limit: exactly two colonies.
- **B. A full copy per colony.** Separate ant lists and scent pictures. Scales to many colonies,
  doubles the memory and the per-picture work for a feature nobody asked for yet.
- **C. Layered textures for N colonies.** Most flexible, most rework of every shader.

A is chosen because the owner handed over the how, it is free on this graphics card, and two
colonies is what was asked for.

## How it works

- **Ownership.** Ant slot `i` belongs to colony `i & 1`. It is alive when `i >> 1` is below that
  colony's population. A slot that becomes alive starts at its nest (an "alive" bit in the ant's
  state tells the two cases apart).
- **Scent.** Slots r,g stay colony A (home, food); b,a become colony B. Walls and food are shared.
- **Nests.** Two colonies: nests at 30% and 70% of the width, mid height. One colony: centre, as now.
  Neither nest can be walled over.
- **Population.** The ant shader adds to two small counters on the graphics card: food delivered
  and deaths, per colony. The page reads them about twice a second and updates the two
  populations: up with deliveries, down with deaths and a slow upkeep. The **Ants** slider is the
  total budget; each colony starts with a quarter of it, is capped at three quarters, and never
  falls below 2%.
- **Fight.** The per-pixel head count already made for drawing gains the colony split. An ant
  reads last picture's count where it stands; if enemies are there it dies with a chance that
  rises with how outnumbered it is. A dead ant restarts at its nest and its colony's population
  drops by one. The scene adds a white-hot glint where both colonies are present.
- **Colour.** Each theme gets one hue per colony (Ember: amber against blue). Leaving and
  returning are now told apart by brightness, not hue. This changes today's two-tone trails
  when two colonies are on; with one colony today's look is kept.
- **Regrowing food.** The page drops a small food pile at a random open spot on a timer, through
  the same path as the Food brush.
- **Rain.** A vertical band sweeps left to right in about 6 seconds. Inside it scent fades fast and
  faint streaks are drawn. Starting food and walls are untouched.

## Controls added

- Settings: Colonies (1 / 2), Rivals (Race / Fight), Food growth (slider), Rain (Off / On).
- Top centre: the two-colour share bar. Hidden with one colony, and with H like the rest.
- Defaults: 2 colonies, Race, slow food growth, rain on.

## Left to the builder

Exact rates (growth per delivery, upkeep, death chance, sprout interval, rain fade), the colours
for Tide and Bone, the bar's styling, uniform and buffer layouts, and how the alive bit is packed.
Tune by looking at 3-minute runs.

## How it will be checked

Unit tests for the population rule and the sprout placement. Scripted Chrome runs with
screenshots for goals 1 to 5 and 7, and the frame counter for goal 6. What a script cannot
judge (does Fight feel good) is said plainly in the acceptance record.
