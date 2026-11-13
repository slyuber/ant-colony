import { initGpu, type Gpu } from './gpu/device';
import { createFatalReporter } from './gpu/errors';
import { createSimulation, type Simulation } from './gpu/simulation';
import { BrushQueue, Tool } from './input/brush';
import { attachPointer } from './input/pointer';
import { DEFAULTS, clampParams, type Params } from './sim/params';
import { firstRunParams, stepDown } from './sim/quality';
import { createMeter } from './ui/meter';
import { createPanel } from './ui/panel';
import { createShareBar } from './ui/share';
import type { Actions, AppState } from './ui/state';
import './ui/style.css';
import { createToolbar } from './ui/toolbar';

export interface Stats {
  fps: number; frameMs: number; gpuMs: number; frames: number; ants: number;
  adapter: string; error: string | null;
  pops: [number, number]; touch: boolean;
}
declare global { interface Window { __stats: Stats } }

window.__stats = { fps: 0, frameMs: 0, gpuMs: 0, frames: 0, ants: 0, adapter: '', error: null, pops: [0, 0], touch: false };

const problems = createFatalReporter((message) => {
  const el = document.getElementById('fatal')!;
  el.textContent = message;
  el.classList.add('on');
  document.getElementById('ui')!.classList.add('gone');
  window.__stats.error = message;
});

function paramsFromUrl(touch: boolean): Params {
  const raw: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => { raw[k] = v; });
  return firstRunParams(clampParams({ ...DEFAULTS, ...raw }), touch, new Set(Object.keys(raw)));
}

/** A fresh food layout each visit, or the same one every time with ?seed=7 in the address. */
function firstSeed(): number {
  const asked = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(asked) && asked > 0 ? asked : 1 + Math.floor(Math.random() * 1_000_000);
}

function measure(canvas: HTMLCanvasElement, gpu: Gpu, touch: boolean): [number, number] {
  const max = gpu.device.limits.maxTextureDimension2D;
  // Phones pack three or more dots per point. Drawing every one would triple the work for no visible gain.
  const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 4);
  const w = Math.max(64, Math.min(max, Math.round(canvas.clientWidth * dpr)));
  const h = Math.max(64, Math.min(max, Math.round(canvas.clientHeight * dpr)));
  return [w, h];
}

function sizeCanvas(canvas: HTMLCanvasElement, gpu: Gpu, touch: boolean): [number, number] {
  const [w, h] = measure(canvas, gpu, touch);
  canvas.width = w;
  canvas.height = h;
  return [w, h];
}

async function start(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const ui = document.getElementById('ui')!;
  let gpu: Gpu;
  try {
    gpu = await initGpu(canvas);
  } catch (e) {
    problems.report(e, true);
    return;
  }
  const stats = window.__stats;
  stats.adapter = gpu.adapterInfo;
  void gpu.device.lost.then(() => {
    problems.report('The graphics device was lost. Reload the page.', true);
  });
  // Out of memory, a driver refusing a texture size, a shader that will not compile: say so on screen.
  gpu.device.addEventListener('uncapturederror', (e) => {
    const message = (e as GPUUncapturedErrorEvent).error.message;
    console.error('WebGPU:', message);
    problems.report(message.split(/\r?\n/)[0]);
  });

  const touch = window.matchMedia('(pointer: coarse)').matches;
  stats.touch = touch;
  const state: AppState = {
    params: paramsFromUrl(touch),
    tool: Tool.Food,
    paused: false,
    uiHidden: false,
    meterOn: !touch,
    panelOpen: false,
    hasPainted: false,
    touch,
  };
  ui.classList.toggle('touch', touch);
  const queue = new BrushQueue();
  let [w, h] = sizeCanvas(canvas, gpu, touch);
  const seed = firstSeed();
  let sim: Simulation = createSimulation(gpu, w, h, state.params, seed);

  const actions: Actions = {
    changed: () => sync(),
    reset: () => {
      queue.clear();
      sim.reset();
    },
  };
  const toolbar = createToolbar(ui, state, actions);
  const panel = createPanel(ui, state, actions);
  const meter = createMeter(ui, state);
  const share = createShareBar(ui, state);
  const input = attachPointer(canvas, state, queue, () => [sim.worldW, sim.worldH], actions);
  function sync(): void {
    ui.classList.toggle('hidden', state.uiHidden);
    ui.dataset.palette = String(state.params.palette);
    toolbar.sync();
    share.sync();
    share.update(sim.pops);
    panel.sync();
    meter.sync();
    input.syncRing();
  }
  sync();

  // A new window size means a new world: the world is exactly the canvas, pixel for pixel.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (problems.failed) return;
      // Browsers also fire "resize" when nothing really changed (a scrollbar, a zoom bounce). Keep the colony then.
      const [nw, nh] = measure(canvas, gpu, touch);
      if (nw === w && nh === h) return;
      queue.clear();
      sim.destroy();
      [w, h] = sizeCanvas(canvas, gpu, touch);
      sim = createSimulation(gpu, w, h, state.params, seed);
      input.syncRing();
    }, 200);
  });

  let last = performance.now();
  let windowStart = last;
  let windowFrames = 0;
  // A device that cannot keep up gets a lighter picture: glow first, then fewer ants.
  // Only in the first half minute, so it never fights a setting the person chose later.
  const started = last;
  let slowSeconds = 0;
  const tuneForDevice = (fps: number, now: number): void => {
    if (now - started > 30_000 || state.paused || document.hidden) return;
    slowSeconds = fps < 45 ? slowSeconds + 1 : 0;
    if (slowSeconds < 3) return;
    slowSeconds = 0;
    const lighter = stepDown(state.params);
    if (!lighter) return;
    state.params = lighter;
    sync();
  };
  // Coming back to a hidden tab: start the smoothness count afresh instead of averaging in the pause.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    last = windowStart = performance.now();
    windowFrames = 0;
    slowSeconds = 0;
  });
  const loop = (now: number): void => {
    if (problems.failed) return;
    input.tick();
    // Exactly one simulation step per picture, however long the gap was: no catch-up bursts after a hidden tab.
    sim.frame(state.params, queue.take(), state.paused);
    stats.frames++;
    stats.ants = state.params.antCount;
    stats.frameMs = now - last;
    stats.gpuMs = sim.gpuMs;
    last = now;
    windowFrames++;
    if (now - windowStart >= 1000) {
      stats.fps = Math.round((windowFrames * 10000) / (now - windowStart)) / 10;
      meter.update(stats.fps, (now - windowStart) / windowFrames, gpu.hasTimestamps ? stats.gpuMs : -1);
      stats.pops = sim.pops;
      share.update(stats.pops);
      tuneForDevice(stats.fps, now);
      windowStart = now;
      windowFrames = 0;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

start().catch((e) => problems.report(e));
