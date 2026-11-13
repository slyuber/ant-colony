# Ant Colony — design

Date: 2026-11-12. Status: awaiting owner approval.

## Intent and why

The owner wants a beautiful, interactive physics simulation that runs smoothly on
this specific computer, ideally with "AI like an ant simulation". He also wants to
see whether the work is well scoped and well architected for the hardware. He
handed scoping and all technical choices to the builder.

What he said: beautiful; physics; can interact / play around; ants with AI would
be "ultimate"; scope it yourself. Everything else below is the builder's call.

## What it is

A full-screen, dark canvas. A nest sits in the middle. A few hundred thousand ants
pour out and wander. An ant that finds food turns round and carries it home,
leaving a scent trail. Other ants follow scent. Short routes get reinforced faster
than long ones, so glowing highways appear on their own between nest and food.
Nobody programs the routes. That is the "AI": swarm intelligence, where simple
rules per ant add up to smart colony behaviour. No neural network.

The physics is the scent: it spreads (diffusion) and fades (evaporation) every
frame, like ink in water.

The owner plays by drawing with the mouse: drop food, draw walls, erase, and watch
the colony reroute.

## Target hardware (measured 2026-11-12)

- GPU: NVIDIA GTX 1060 6 GB
- CPU: Intel i3-8350K, 4 cores / 4 threads
- RAM: 32 GB
- Display: 1920x1080 at 60 Hz
- Chrome 157, Edge 157, Node 22.22, npm 10.9

## Goals

1. Holds 60 frames per second at 1920x1080 with 250,000 ants on this machine
   (frame time at or under 16.7 ms; acceptance floor 55 fps averaged over 30 s).
2. Trails emerge: with default settings, a visible nest-to-food highway forms
   within about 30 seconds of placing food.
3. Rerouting: draw a wall across a highway and the colony finds a new route
   within about 60 seconds.
4. Beautiful at rest and in motion: glowing trails, soft bloom, a restrained
   colour palette, no visible grid or pixel stair-stepping at normal zoom.
5. Usable with no instructions: one small tool strip, one collapsible settings
   panel, sensible defaults, starts running on page load with food already placed.
6. One command to start (`npm run dev`), opens in Chrome.

## Non-goals

- Neural networks, training, evolution of ant brains.
- 3D, zoom/pan camera, saving and loading worlds, sharing, mobile, touch.
- Browsers without WebGPU. Show a plain message instead of a fallback renderer.
- Multiple colonies or predators (candidate for a later version).

## Anti-goals

- Stutter or frame drops in normal play. Smoothness beats ant count.
- A dashboard look: many sliders, charts and labels crowding the picture.
- Simulation work on the CPU. The i3 is the weak part; it only handles input and UI.
- Any server listening on anything but 127.0.0.1.

## Approaches considered

A. **Scent-trail ant colony on the GPU, in the browser (chosen).** Ants are a
   list of points the graphics card updates in parallel; scent lives in images the
   card blurs and fades. Trade-off: needs WebGPU (present in Chrome 157), and the
   "AI" is emergent rather than learned. Gives the ants he asked for, real
   physics in the scent, and fits the card with room to spare.

B. **Fluid / ink simulation.** Very pretty and easy to hit 60 fps. No ants, no
   AI, so it misses the thing he called "ultimate".

C. **Ants with small evolved neural-net brains.** Closest to literal "AI".
   Heavy for a 4-core i3, slow to show anything interesting, hard to make
   beautiful, and high risk of an unfinished result.

Platform alternatives for A: a native desktop app in Rust (more headroom, slower
to iterate, an install step) and older WebGL2 (works everywhere, but updating
agents on the card is awkward). Browser + WebGPU chosen: no install, fast
iteration, proper GPU compute.

Chosen by the builder under the owner's "scope it yourself".

## Architecture (builder's calls)

Stack: TypeScript, Vite dev server bound to 127.0.0.1, WebGPU, shaders in WGSL.
No UI framework; plain DOM for the tool strip and panel. No runtime dependencies
beyond what Vite needs for dev.

World: a 2D grid the size of the canvas backing store (1920x1080 by default),
held as GPU textures.

- **World texture**: walls, food amount, nest mask.
- **Scent textures**: two scents, "home" (laid by ants leaving the nest) and
  "food" (laid by ants carrying food). Two copies each, swapped every frame.
- **Ant buffer**: per ant, position, heading, carrying flag, a random seed, and a
  timer since last nest/food visit (scent laid weakens as the timer grows).

Per frame, all on the GPU:

1. **Ant step** (compute): each ant samples scent at three points ahead (left,
   centre, right), turns toward the strongest of the scent it is seeking, adds a
   little random wobble, moves, bounces off walls, and flips state on touching
   food or nest.
2. **Deposit** (render): ants are drawn as additive points into the scent
   textures. Drawing rather than writing from the compute step avoids two ants
   fighting over one pixel.
3. **Field step** (compute or fullscreen pass): blur slightly (diffusion),
   multiply by a fade factor (evaporation), clear scent inside walls, apply food
   taken this frame.
4. **Present**: map scent and ants to colour, add bloom, draw to screen.

Food depletion: ants that pick up food are drawn additively into a small
"taken" target; the field step subtracts it from the food amount. Exact method
is the builder's to settle.

CPU side: pointer input turned into brush stamps sent to the GPU, UI state, a
frame-time meter. Nothing per-ant ever runs on the CPU.

Modules, each with one job:

- `gpu/` — device setup, resource creation, the four passes above.
- `sim/params` — every tunable number in one typed object with defaults and ranges.
- `input/` — pointer to brush stamps.
- `ui/` — tool strip, settings panel, frame meter.
- `main` — wires them and runs the frame loop.

## Interaction

- Tools: Food, Wall, Erase, Scatter (pushes ants away). Left-drag paints.
  Brush size on scroll wheel.
- Keys: Space pause, R reset, H hide all UI.
- Settings panel (collapsed by default): ant count (50k to 1M), evaporation,
  diffusion, ant speed, wobble, palette (3 choices).
- Frame meter: small, corner, toggle with F. Shows fps and frame ms.
- Above the 250k default, ant count is the owner's risk; the meter shows the cost.

## Look

Dark near-black background. Scent drawn as light: one warm hue for "food" trails,
one cool hue for "home" trails, ants as faint bright specks, walls as matte dark
shapes with a soft edge, food as luminous clusters. Bloom on the bright end.
Rendering in a high-range format with tone mapping so busy highways glow rather
than clip to flat white. Palette and exact tuning are the builder's, to be judged
by eye in the running app.

## Verification

- Unit tests (Vitest) for the CPU-side pure logic: params clamping, brush stamp
  generation, ant buffer packing.
- Frame meter evidence for goal 1, read from the running app on this machine.
- Goals 2 and 3 checked by running the app and watching, with screenshots.
- WebGPU availability on this machine checked as the very first build step,
  before anything else is written. If it fails, stop and return to the owner.

## Left to the builder

Exact shader maths, scent strengths and fade rates, bloom method, texture
formats, whether the field step is a compute or render pass, file names inside
the modules, and default parameter values, tuned by eye.

## Settled after reviewer check (builder's calls)

- If 60 fps cannot be held at 250k ants: cut bloom quality first, scent
  resolution second, ant count last.
- World matches the canvas at startup. Resizing the window resets the world.
  The 1920x1080 measurement is taken in browser fullscreen (F11).
- Frame meter shows GPU pass time as well as fps, because the 60 Hz screen caps
  fps and hides spare headroom.
- Screen edges act as walls. Erase removes walls and food. R restores the
  starting world. Food runs out and does not refill. All ants exist from the
  start and do not die.

## Later, not now

Second rival colony; ants that dig through soft terrain; evolving ant traits;
zoom and pan.
