import type { AppState } from './state';

export interface Meter {
  sync(): void;
  /** gpuMs < 0 means the browser cannot measure it. */
  update(fps: number, frameMs: number, gpuMs: number): void;
}

export function createMeter(root: HTMLElement, state: AppState): Meter {
  const box = document.createElement('dl');
  box.className = 'meter';
  box.title = 'Smoothness. 60 pictures per second is the most this screen can show. F hides this.';
  const cell = (label: string): HTMLElement => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = '0';
    box.append(dd, dt);
    return dd;
  };
  const fpsEl = cell('pictures / s');
  const frameEl = cell('ms per picture');
  const gpuEl = cell('ms graphics card');
  root.append(box);

  return {
    sync(): void { box.hidden = !state.meterOn; },
    update(fps, frameMs, gpuMs): void {
      if (box.hidden) return;
      fpsEl.textContent = fps.toFixed(0);
      frameEl.textContent = frameMs.toFixed(1);
      gpuEl.textContent = gpuMs < 0 ? 'n/a' : gpuMs.toFixed(1);
    },
  };
}
