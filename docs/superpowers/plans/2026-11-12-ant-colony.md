# Ant Colony Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A full-screen, interactive GPU ant-colony simulation in the browser that holds 60 fps with 250,000 ants at 1920x1080 on a GTX 1060.

**Architecture:** All simulation state lives in GPU textures and one GPU buffer. Each frame runs four GPU passes (ant step, deposit, field step, present). The CPU only turns pointer input into brush segments, holds UI state, and reads a frame meter.

**Tech Stack:** TypeScript, Vite, WebGPU + WGSL, Vitest, playwright-core (dev only, drives the installed Chrome for verification).

**Spec:** `docs/superpowers/specs/2026-11-12-ant-colony-design.md`

## Global Constraints

- Dev server binds `127.0.0.1` only (`server.host: '127.0.0.1'`, `port: 5173`, `strictPort: true`). Never `0.0.0.0`.
- No per-ant work on the CPU after initialisation.
- No UI framework. No runtime dependencies.
- Default ant count 250,000; range 50,000 to 1,000,000. Ant buffer allocated once for 1,000,000.
- World size = canvas backing-store size at startup; resize resets the world.
- Acceptance floor: 55 fps averaged over 30 s at 1920x1080, 250k ants.
- If the floor is missed: cut bloom quality first, scent resolution second, ant count last.
- No WebGPU: show a plain message, no fallback renderer.
- Git: branch `main`, terse commit messages, no AI attribution lines.
- After editing any `.html`, run the curly-quote check (both counts must be 0).

## Review Focus

1. **No WebGPU / null adapter / device lost** — page shows a plain readable message, not a blank canvas. (Task 1 probe, Task 3 device-lost handler.)
2. **Windows display scaling (devicePixelRatio 1.25/1.5)** — brush lands under the cursor. (Task 2 `clientToWorld` test.)
3. **Fast drag** — more segments than fit one frame are carried over, leaving no gaps in a wall. (Task 2 `BrushQueue` test.)
4. **Out-of-range or NaN settings** — clamped to range, NaN falls back to default. (Task 2 `clampParams` test.)
5. **Tab hidden then shown / window resized** — one fixed simulation step per frame, never a catch-up burst; resize rebuilds the world without errors. (Task 4 probe: resize the viewport, assert no console errors and stats still advancing.)

---

## File map

```
index.html                  canvas + UI mount points
vite.config.ts              127.0.0.1 binding, vitest config
src/main.ts                 wiring + frame loop
src/sim/params.ts           Params type, DEFAULTS, RANGES, clampParams
src/sim/ants.ts             packAnts (initial ant buffer)
src/input/brush.ts          Tool enum, Segment, BrushQueue, clientToWorld
src/input/pointer.ts        DOM pointer/wheel/key events -> BrushQueue, tool state
src/gpu/device.ts           initGpu
src/gpu/uniforms.ts         packSimUniforms, packSegments
src/gpu/simulation.ts       createSimulation: owns resources + the four passes
src/gpu/shaders/*.wgsl      common, antStep, deposit, field, scene, bloom, tonemap
src/ui/toolbar.ts panel.ts meter.ts style.css
scripts/probe.mjs           drives installed Chrome, returns stats + screenshot
```

Shared names used across tasks:

```ts
// src/sim/params.ts
export interface Params {
  antCount: number;      // 50_000..1_000_000, default 250_000
  evaporation: number;   // per-frame keep factor, 0.90..0.999, default 0.985
  diffusion: number;     // 0..1, default 0.25
  speed: number;         // px per frame, 0.5..4, default 1.5
  wobble: number;        // radians, 0..1, default 0.25
  palette: number;       // 0|1|2, default 0
  bloom: number;         // 0 off | 1 low | 2 high, default 2
  brushRadius: number;   // 4..120, default 24
}
export const DEFAULTS: Params;
export const RANGES: Record<keyof Params, [number, number]>;
export function clampParams(p: Partial<Record<keyof Params, unknown>>): Params;

// src/sim/ants.ts — 24 bytes per ant: pos f32x2, heading f32, timer f32, state u32, seed u32
export const ANT_STRIDE = 24;
export const MAX_ANTS = 1_000_000;
export function packAnts(count: number, nestX: number, nestY: number, nestRadius: number, seed: number): ArrayBuffer;

// src/input/brush.ts
export enum Tool { Food = 0, Wall = 1, Erase = 2, Scatter = 3 }
export interface Segment { ax: number; ay: number; bx: number; by: number; radius: number; tool: Tool }
export const MAX_SEGMENTS = 8;
export class BrushQueue { push(s: Segment): void; take(): Segment[]; /* at most MAX_SEGMENTS, rest kept */ readonly pending: number }
export function clientToWorld(clientX: number, clientY: number, rect: {left:number;top:number;width:number;height:number}, worldW: number, worldH: number): [number, number];

// src/gpu/device.ts
export interface Gpu { device: GPUDevice; context: GPUCanvasContext; format: GPUTextureFormat; hasTimestamps: boolean; adapterInfo: string }
export function initGpu(canvas: HTMLCanvasElement): Promise<Gpu>; // throws Error with a user-readable message

// src/gpu/uniforms.ts
export function packSimUniforms(p: Params, worldW: number, worldH: number, frame: number, nestX: number, nestY: number, nestRadius: number): Float32Array;
export function packSegments(segs: Segment[]): Float32Array; // MAX_SEGMENTS * 8 floats + count

// src/gpu/simulation.ts
export interface Simulation { frame(p: Params, segs: Segment[], paused: boolean): void; reset(): void; destroy(): void; readonly gpuMs: number; readonly worldW: number; readonly worldH: number }
export function createSimulation(gpu: Gpu, width: number, height: number, p: Params): Simulation;

// exposed for the probe
window.__stats = { fps: number, frameMs: number, gpuMs: number, frames: number, ants: number, adapter: string, error: string | null }
```

---

### Task 1: Scaffold and WebGPU gate

**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/gpu/device.ts`, `scripts/probe.mjs`, `.gitignore`.

**Interfaces:** Produces `initGpu`, `Gpu`, `window.__stats.adapter/error`, and `node scripts/probe.mjs [--seconds N] [--shot path] [--width W --height H] [--actions name]` printing one JSON line of `__stats` plus console errors.

- [ ] **Step 1:** `git init -b main`; `npm init`; dev deps: `vite`, `typescript`, `vitest`, `@webgpu/types`, `playwright-core`. Scripts: `dev` (`vite`), `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `probe` (`node scripts/probe.mjs`).
- [ ] **Step 2:** `initGpu`: request adapter with `powerPreference: 'high-performance'`; request `timestamp-query` only if the adapter has it; configure the canvas with the preferred format. Throw `Error('This browser has no WebGPU. Use a current Chrome or Edge.')` when `navigator.gpu` or the adapter is missing.
- [ ] **Step 3:** `main.ts`: call `initGpu`; on failure put the message in a centred `<p id="fatal">` and in `__stats.error`; on success set `__stats.adapter`.
- [ ] **Step 4:** `probe.mjs`: start nothing itself (expects dev server on `127.0.0.1:5173`); launch `chromium.launch({ channel: 'chrome', headless: false })` with a 1920x1080 viewport; open the page; wait N seconds; print `__stats` and collected console errors as JSON; optional screenshot.
- [ ] **Step 5:** Run `npm run dev` (background) then `npm run probe`. Expected: `error: null` and an adapter string naming the NVIDIA GTX 1060. **If the adapter is missing or is a software adapter (SwiftShader / Basic Render Driver), stop and report to the owner.**
- [ ] **Step 6:** Curly-quote check on `index.html`; commit `scaffold + webgpu gate`.

### Task 2: CPU-side pure logic (TDD)

**Files:** Create `src/sim/params.ts`, `src/sim/ants.ts`, `src/input/brush.ts`, `src/gpu/uniforms.ts`, and a `.test.ts` beside each.

**Interfaces:** Produces everything in the shared-names block for these four files.

- [ ] **Step 1: Failing tests**

```ts
// params.test.ts
expect(clampParams({})).toEqual(DEFAULTS);
expect(clampParams({ antCount: 5 }).antCount).toBe(50_000);
expect(clampParams({ antCount: 9e9 }).antCount).toBe(1_000_000);
expect(clampParams({ antCount: 250_000.7 }).antCount).toBe(250_000);      // integer
expect(clampParams({ evaporation: NaN }).evaporation).toBe(DEFAULTS.evaporation);
expect(clampParams({ speed: 'abc' }).speed).toBe(DEFAULTS.speed);
expect(clampParams({ palette: 7 }).palette).toBe(2);

// ants.test.ts
const buf = packAnts(1000, 960, 540, 20, 1);
expect(buf.byteLength).toBe(MAX_ANTS * ANT_STRIDE);          // always full size
// every one of the first 1000 ants lies within 20 px of (960,540); heading in [0, 2pi); state 0; timer 0
// seeds: at least 990 distinct values among the first 1000
// same seed -> identical bytes; different seed -> different bytes
// ants beyond `count` are also initialised inside the nest (so raising antCount later is safe)

// brush.test.ts
const q = new BrushQueue(); for (let i = 0; i < 20; i++) q.push(seg(i));
expect(q.take().length).toBe(8); expect(q.pending).toBe(12);
expect(q.take().length).toBe(8); expect(q.take().length).toBe(4); expect(q.take()).toEqual([]);
// order preserved across takes (first taken segment has ax === 0, ninth has ax === 8)
expect(clientToWorld(100, 50, { left: 0, top: 0, width: 1536, height: 864 }, 1920, 1080)).toEqual([125, 62.5]); // 125% scaling
expect(clientToWorld(-10, 9999, { left: 0, top: 0, width: 100, height: 100 }, 200, 200)).toEqual([0, 199]);      // clamped inside world

// uniforms.test.ts
expect(packSegments([]).length).toBe(MAX_SEGMENTS * 8 + 8);   // header of 8 floats, count at index 0
expect(packSegments([s]).slice(8, 14)).toEqual(Float32Array.of(s.ax, s.ay, s.bx, s.by, s.radius, s.tool));
expect(() => packSegments(new Array(9).fill(s))).toThrow();
const u = packSimUniforms(DEFAULTS, 1920, 1080, 7, 960, 540, 24);
expect(u.length % 4).toBe(0); expect(u[0]).toBe(1920); expect(u[1]).toBe(1080);
```

- [ ] **Step 2:** `npm test` — expect all four files to fail on missing exports.
- [ ] **Step 3:** Implement. `packAnts` uses a small deterministic PRNG (mulberry32). `packSimUniforms` layout is defined once here and mirrored by the `SimUniforms` struct in `common.wgsl` (Task 3): `worldSize.xy, nest.xy, nestRadius, frame, antCount, speed, wobble, evaporation, diffusion, palette, bloom, pad x3`.
- [ ] **Step 4:** `npm test` — expect PASS.
- [ ] **Step 5:** Commit `params, ant packing, brush queue, uniforms`.

### Task 3: The four GPU passes

**Files:** Create `src/gpu/simulation.ts`, `src/gpu/shaders/common.wgsl`, `antStep.wgsl`, `deposit.wgsl`, `field.wgsl`, `scene.wgsl`. Modify `src/main.ts`.

**Interfaces:** Consumes Task 1 and 2 exports. Produces `createSimulation`, `Simulation`, full `window.__stats`.

Resources (all `rgba16float`, world-sized, two copies each where marked):

- `scent[2]`: r = home scent, g = food scent.
- `world[2]`: r = wall (0/1), g = food amount, b = nest mask.
- `taken`: r = food picked up this frame. Cleared every frame.
- `ants`: storage buffer, `MAX_ANTS * ANT_STRIDE` bytes.

Per frame, in this order:

1. **antStep (compute, 256 per workgroup, dispatch ceil(antCount/256))** reads `scent[cur]`, `world[cur]`, writes `ants`.
   - Not carrying: seeks g (food scent). Carrying: seeks r (home scent).
   - Three sensors at heading and heading ± 0.6 rad, 9 px ahead. A sensor inside a wall or off-world scores -1. A sensor directly on the target (food for seekers, nest for carriers) scores +1000.
   - Turn toward the best sensor by up to 0.35 rad; add `wobble * (rand - 0.5)`.
   - Move `speed` px. If the new cell is wall or off-world: stay, pick a random heading.
   - Seeker on a cell with food > 0: set carrying, set picked-up bit, timer = 0, heading += pi.
   - Carrier inside the nest: clear carrying, timer = 0, heading += pi. Seeker inside the nest: timer = 0.
   - Clear the picked-up bit at the start of the step; timer += 1.
   - Scatter segments: an ant within a segment's radius gets its heading set directly away from the segment.
2. **deposit (render, point-list, additive blend, 2 targets)**: one vertex per ant, read from `ants` by vertex index. Target 0 = `scent[cur]`: seekers add to r, carriers add to g, strength `depositStrength * exp(-timer / 600)`. Target 1 = `taken`: `pickupAmount` if the picked-up bit is set, else 0.
3. **field (render, fullscreen triangle, 2 targets)** reads `scent[cur]`, `world[cur]`, `taken`; writes `scent[next]`, `world[next]`.
   - Scent: `mix(centre, mean of 3x3, diffusion) * evaporation`, clamped to `[0, scentMax]`, zero inside walls.
   - World: apply Food / Wall / Erase segments (distance to capsule <= radius); `food = max(food - taken, 0)`; Food never paints into walls; Wall clears food; world edges are not stored as walls (off-world is handled in antStep).
   - Then swap cur/next.
4. **scene (render to canvas, minimal for this task)**: scent as two colours, walls grey, food and nest bright; then ants drawn as additive points. Bloom and tone mapping arrive in Task 5.

`reset()` re-uploads `packAnts`, clears scent, and repaints the starting world: nest radius 24 at the centre, three food discs of radius 40 at roughly 300 px from the nest. When `paused`, skip passes 1 to 3 except that segments are still applied to the world.

Constants `depositStrength`, `pickupAmount`, `scentMax` start at 0.2, 0.02, 4.0 and are tuned in Task 6.

Device lost: `device.lost.then` puts `'The graphics device was lost. Reload the page.'` in `#fatal` and `__stats.error`.

- [ ] **Step 1:** Write `common.wgsl` (`SimUniforms`, `Segments`, `Ant`, hash-based `rand`) and the four shaders plus `simulation.ts`.
- [ ] **Step 2:** `main.ts` frame loop: one `sim.frame` per `requestAnimationFrame`; update `__stats` (fps as a 1 s rolling mean).
- [ ] **Step 3:** `npm run build` — expect no type errors.
- [ ] **Step 4:** `npm run probe -- --seconds 40 --shot <scratchpad>/t3.png`. Expected: no console errors, `frames` > 1500, and the screenshot shows ants spread from the nest and at least one bright line between the nest and a food disc.
- [ ] **Step 5:** Commit `gpu passes: ants, deposit, field, scene`.

### Task 4: Interaction and UI

**Files:** Create `src/input/pointer.ts`, `src/ui/toolbar.ts`, `src/ui/panel.ts`, `src/ui/meter.ts`, `src/ui/style.css`. Modify `index.html`, `src/main.ts`, `src/gpu/simulation.ts` (timestamp queries).

**Interfaces:** Consumes `BrushQueue`, `clientToWorld`, `Tool`, `Params`, `clampParams`, `RANGES`, `Simulation.gpuMs`.

- [ ] **Step 1:** `pointer.ts`: left-drag pushes one `Segment` per pointermove from the previous point to the current one (a click pushes a zero-length segment); wheel changes `brushRadius` within range; Space pause, R reset, H hide all UI, F toggle meter, 1-4 pick tool. Pointer events on UI elements never paint.
- [ ] **Step 2:** `toolbar.ts`: four tool buttons (Food, Wall, Erase, Scatter) plus Pause and Reset, each with a `title` and `aria-pressed`. A ring cursor on the canvas shows the brush radius.
- [ ] **Step 3:** `panel.ts`: collapsed by default; range inputs generated from `RANGES` for antCount, evaporation, diffusion, speed, wobble; three palette swatches; every change goes through `clampParams`.
- [ ] **Step 4:** `meter.ts`: `fps`, `frame ms`, `gpu ms` in a small corner block. `gpuMs` from timestamp queries around the whole frame's passes when `gpu.hasTimestamps`, resolved through a mapped buffer no more often than every 10 frames; shows `n/a` otherwise.
- [ ] **Step 5:** Resize: debounce 200 ms, then `sim.destroy()` and `createSimulation` at the new size.
- [ ] **Step 6:** Extend `probe.mjs` with `--actions wall` (drag a wall with the Wall tool across the screen centre-right at t = 30 s) and `--actions resize` (change the viewport to 1280x720 mid-run). Run `--actions resize --seconds 15`: expect no console errors and `frames` still increasing after the resize.
- [ ] **Step 7:** Invoke the `frontend-design:frontend-design` skill before finalising `style.css`; the UI must stay out of the picture's way (one strip, one panel).
- [ ] **Step 8:** `npm test && npm run build`; curly-quote check on `index.html`; commit `tools, panel, meter, keys`.

### Task 5: The look

**Files:** Create `src/gpu/shaders/bloom.wgsl`, `tonemap.wgsl`. Modify `scene.wgsl`, `simulation.ts`.

- [ ] **Step 1:** Scene now renders to a world-sized `rgba16float` target in linear light: near-black background, warm hue for food scent, cool hue for home scent, matte walls with a soft edge, luminous food, ants as faint specks. Three palettes selected by `palette`.
- [ ] **Step 2:** Bloom: threshold + downsample to 1/2 (`bloom = 2`) or 1/4 (`bloom = 1`) resolution, separable 9-tap blur, two iterations; skipped entirely at `bloom = 0`.
- [ ] **Step 3:** Tonemap pass to the canvas: scene + bloom, ACES-style curve, slight vignette, ordered dither to hide banding in dark gradients.
- [ ] **Step 4:** Probe with screenshots at 10 s and 60 s for each palette; look at them. Expected: highways glow without flat white clipping, no visible banding, no pixel stair-stepping on wall edges.
- [ ] **Step 5:** Commit `hdr scene, bloom, tonemap, palettes`.

### Task 6: Tune and accept

**Files:** Modify constants in `simulation.ts` / shaders, defaults in `params.ts`. Create `docs/acceptance.md`.

- [ ] **Step 1 (goal 1):** `npm run probe -- --seconds 40` at 1920x1080 fullscreen, defaults. Record fps, frame ms, gpu ms. If the 30 s mean fps is under 55, apply the fallback order from Global Constraints and re-measure.
- [ ] **Step 2 (goal 2):** screenshot at 30 s after reset; a nest-to-food highway must be visible. Tune `depositStrength`, `evaporation`, sensor distance until it is.
- [ ] **Step 3 (goal 3):** `--actions wall --seconds 100 --shot`; the screenshot at 90 s must show a route around the wall.
- [ ] **Step 4:** Also record gpu ms at 500k and 1M ants, for the owner's information.
- [ ] **Step 5:** Write measured numbers and what was not checked into `docs/acceptance.md`; `npm test && npm run build`; commit `tuning + acceptance`.
