import type { AppState } from './state';

export interface ShareBar {
  sync(): void;
  /** Ants alive in colony A and colony B. */
  update(pops: [number, number]): void;
}

const short = (n: number): string => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n)));

/** The contest at a glance: one bar, split by each colony's share of the ants. Only shown with two colonies. */
export function createShareBar(root: HTMLElement, state: AppState): ShareBar {
  const box = document.createElement('div');
  box.className = 'share';
  box.setAttribute('role', 'img');
  const a = document.createElement('span');
  a.className = 'share-count share-a';
  const bar = document.createElement('span');
  bar.className = 'share-bar';
  const fill = document.createElement('span');
  fill.className = 'share-fill';
  bar.append(fill);
  const b = document.createElement('span');
  b.className = 'share-count share-b';
  box.append(a, bar, b);
  root.append(box);

  return {
    sync(): void { box.hidden = state.params.colonies < 2; },
    update(pops): void {
      if (box.hidden) return;
      const total = Math.max(1, pops[0] + pops[1]);
      fill.style.width = `${((pops[0] / total) * 100).toFixed(1)}%`;
      a.textContent = short(pops[0]);
      b.textContent = short(pops[1]);
      box.setAttribute('aria-label', `Left colony ${short(pops[0])} ants, right colony ${short(pops[1])} ants`);
    },
  };
}
