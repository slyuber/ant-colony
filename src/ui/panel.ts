import { RANGES, clampParams, type Params } from '../sim/params';
import type { Actions, AppState } from './state';

export interface Panel { sync(): void }

/** A slider row, or (with `choices`) a row of buttons for a setting with two or three positions. */
interface Row {
  key: keyof Params; label: string;
  step?: number; show?: (v: number) => string;
  choices?: string[];
  /** Greyed out when this returns false. */
  when?: (p: Params) => boolean;
}

export const PALETTE_NAMES = ['Ember', 'Tide', 'Bone'];

const growth = (v: number): string => (v <= 0 ? 'Off' : v < 0.34 ? 'Slow' : v < 0.67 ? 'Steady' : 'Fast');

const ROWS: Row[] = [
  { key: 'colonies', label: 'Colonies', choices: ['One', 'Two'] },
  { key: 'fight', label: 'Rivals', choices: ['Race', 'Fight'], when: (p) => p.colonies > 1 },
  { key: 'antCount', label: 'Ants', step: 10_000, show: (v) => v.toLocaleString('en-US') },
  { key: 'foodGrowth', label: 'Food growth', step: 0.05, show: growth },
  { key: 'rain', label: 'Rain', choices: ['Off', 'On'] },
  { key: 'speed', label: 'Ant speed', step: 0.1, show: (v) => v.toFixed(1) },
  { key: 'wobble', label: 'Wander', step: 0.01, show: (v) => v.toFixed(2) },
  { key: 'evaporation', label: 'Trail life', step: 0.001, show: (v) => v.toFixed(3) },
  { key: 'diffusion', label: 'Trail spread', step: 0.01, show: (v) => v.toFixed(2) },
  { key: 'brushRadius', label: 'Brush size', step: 1, show: (v) => String(Math.round(v)) },
  { key: 'bloom', label: 'Glow', choices: ['Off', 'Soft', 'Full'] },
];

export function createPanel(root: HTMLElement, state: AppState, actions: Actions): Panel {
  const panel = document.createElement('section');
  panel.id = 'panel';
  panel.className = 'panel';
  panel.setAttribute('aria-label', 'Settings');

  const set = (key: keyof Params, value: unknown): void => {
    state.params = clampParams({ ...state.params, [key]: value });
    actions.changed();
  };

  const syncs: (() => void)[] = [];
  for (const row of ROWS) {
    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = row.label;
    const lo = RANGES[row.key][0];

    if (row.choices) {
      const wrap = document.createElement('div');
      wrap.className = 'row row-choice';
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', row.label);
      const seg = document.createElement('div');
      seg.className = 'seg';
      const buttons = row.choices.map((text, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'seg-btn';
        b.textContent = text;
        b.addEventListener('click', () => set(row.key, lo + i));
        seg.append(b);
        return b;
      });
      wrap.append(name, seg);
      panel.append(wrap);
      syncs.push(() => {
        const on = row.when ? row.when(state.params) : true;
        wrap.classList.toggle('off', !on);
        buttons.forEach((b, i) => {
          b.disabled = !on;
          b.setAttribute('aria-pressed', String(state.params[row.key] === lo + i));
        });
      });
      continue;
    }

    const label = document.createElement('label');
    label.className = 'row';
    const value = document.createElement('output');
    value.className = 'row-value';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(lo);
    input.max = String(RANGES[row.key][1]);
    input.step = String(row.step);
    input.addEventListener('input', () => set(row.key, input.value));
    label.append(name, value, input);
    panel.append(label);
    syncs.push(() => {
      const v = state.params[row.key];
      // Write only on a real difference, so a drag in progress is never fought but a focused slider cannot go stale.
      if (Number(input.value) !== v) input.value = String(v);
      value.textContent = row.show!(v);
    });
  }

  const colours = document.createElement('div');
  colours.className = 'row';
  const coloursName = document.createElement('span');
  coloursName.className = 'row-name';
  coloursName.textContent = 'Colours';
  const coloursValue = document.createElement('output');
  coloursValue.className = 'row-value';
  const swatches = document.createElement('div');
  swatches.className = 'swatches';
  const swatchButtons = PALETTE_NAMES.map((name, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `swatch swatch-${i}`;
    b.title = name;
    b.setAttribute('aria-label', `${name} colours`);
    b.addEventListener('click', () => set('palette', i));
    swatches.append(b);
    return b;
  });
  colours.append(coloursName, coloursValue, swatches);
  panel.append(colours);
  root.append(panel);

  return {
    sync(): void {
      panel.hidden = !state.panelOpen;
      for (const s of syncs) s();
      coloursValue.textContent = PALETTE_NAMES[state.params.palette];
      swatchButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.params.palette)));
    },
  };
}
