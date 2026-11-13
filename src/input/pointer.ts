import { RANGES } from '../sim/params';
import type { Actions, AppState } from '../ui/state';
import { BrushQueue, Tool, clientToWorld } from './brush';

export interface PointerInput {
  /** Call once per frame: keeps hold-to-use tools working while the pointer is still. */
  tick(): void;
  /** Call when the brush size or tool changes so the ring cursor matches. */
  syncRing(): void;
}

export function attachPointer(
  canvas: HTMLCanvasElement,
  state: AppState,
  queue: BrushQueue,
  worldSize: () => [number, number],
  actions: Actions,
): PointerInput {
  const ring = document.createElement('div');
  ring.className = 'ring';
  ring.hidden = true;
  document.body.appendChild(ring);

  let drawing = false;
  let last: [number, number] = [0, 0];
  let client: [number, number] = [0, 0];

  const toWorld = (e: PointerEvent): [number, number] => {
    const [w, h] = worldSize();
    return clientToWorld(e.clientX, e.clientY, canvas.getBoundingClientRect(), w, h);
  };

  const push = (a: [number, number], b: [number, number]): void => {
    queue.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], radius: state.params.brushRadius, tool: state.tool });
  };

  const syncRing = (): void => {
    const rect = canvas.getBoundingClientRect();
    const d = 2 * state.params.brushRadius * (rect.width / worldSize()[0]);
    ring.style.width = ring.style.height = `${d}px`;
    ring.style.transform = `translate(${client[0] - d / 2}px, ${client[1] - d / 2}px)`;
    ring.dataset.tool = String(state.tool);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    // A finger gives no hover first, so place the ring where it lands.
    client = [e.clientX, e.clientY];
    ring.hidden = false;
    syncRing();
    last = toWorld(e);
    push(last, last);
    if (!state.hasPainted) {
      state.hasPainted = true;
      actions.changed();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    client = [e.clientX, e.clientY];
    ring.hidden = false;
    syncRing();
    if (!drawing) return;
    const now = toWorld(e);
    push(last, now);
    last = now;
  });

  const stop = (e: PointerEvent): void => {
    drawing = false;
    // Released outside the window: no more move events will come, so do not leave the ring stranded.
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX >= r.right || e.clientY < r.top || e.clientY >= r.bottom) ring.hidden = true;
    if (e.pointerType !== 'mouse') ring.hidden = true;   // a lifted finger leaves no cursor behind
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', () => { if (!drawing) ring.hidden = true; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY === 0) return;   // a sideways swipe is not a size change
    const [lo, hi] = RANGES.brushRadius;
    const next = state.params.brushRadius * (e.deltaY < 0 ? 1.12 : 1 / 1.12);
    state.params.brushRadius = Math.min(hi, Math.max(lo, next));
    syncRing();
    actions.changed();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    const typing = target instanceof HTMLInputElement && target.type !== 'range';
    if (typing) return;
    const key = e.key.toLowerCase();
    if (key === ' ') {
      e.preventDefault();
      if (!e.repeat) state.paused = !state.paused;
    } else if (key === 'r') {
      if (!e.repeat) actions.reset();
    } else if (key === 'h') {
      state.uiHidden = !state.uiHidden;
    } else if (key === 'f') {
      state.meterOn = !state.meterOn;
    } else if (key >= '1' && key <= '4') {
      state.tool = (Number(key) - 1) as Tool;
      syncRing();
    } else {
      return;
    }
    actions.changed();
  });

  return {
    tick(): void {
      if (drawing && state.tool === Tool.Scatter && queue.pending === 0) push(last, last);
    },
    syncRing,
  };
}
