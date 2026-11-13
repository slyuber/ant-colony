import { Tool } from '../input/brush';
import { TOOL_HINTS, TOOL_NAMES, type Actions, type AppState } from './state';

export interface Toolbar { sync(): void }

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

function button(label: string, key: string, title: string): HTMLButtonElement {
  const b = el('button', 'btn');
  b.type = 'button';
  b.title = `${title} (${key})`;
  b.append(el('span', 'btn-label', label), el('kbd', undefined, key));
  return b;
}

export function createToolbar(root: HTMLElement, state: AppState, actions: Actions): Toolbar {
  const wrap = el('div', 'dock');
  const hint = el('p', 'hint');
  const strip = el('div', 'strip');
  strip.setAttribute('role', 'toolbar');
  strip.setAttribute('aria-label', 'Tools');

  const tools = [Tool.Food, Tool.Wall, Tool.Erase, Tool.Scatter].map((tool) => {
    const b = button(TOOL_NAMES[tool], String(tool + 1), TOOL_HINTS[tool]);
    b.classList.add('tool');
    b.dataset.tool = String(tool);
    b.addEventListener('click', () => {
      state.tool = tool;
      actions.changed();
    });
    return b;
  });

  const pause = button('Pause', 'Space', 'Pause or resume the colony');
  pause.addEventListener('click', () => {
    state.paused = !state.paused;
    actions.changed();
  });
  const reset = button('Reset', 'R', 'Start again with a fresh colony');
  reset.addEventListener('click', () => actions.reset());

  const settings = el('button', 'btn', 'Settings');
  settings.type = 'button';
  settings.setAttribute('aria-controls', 'panel');
  settings.addEventListener('click', () => {
    state.panelOpen = !state.panelOpen;
    actions.changed();
  });

  strip.append(...tools, el('span', 'sep'), pause, reset, el('span', 'sep'), settings);
  wrap.append(hint, strip);
  root.append(wrap);

  return {
    sync(): void {
      for (const b of tools) b.setAttribute('aria-pressed', String(Number(b.dataset.tool) === state.tool));
      pause.querySelector('.btn-label')!.textContent = state.paused ? 'Resume' : 'Pause';
      pause.setAttribute('aria-pressed', String(state.paused));
      settings.setAttribute('aria-expanded', String(state.panelOpen));
      hint.textContent = state.touch
        ? `${TOOL_HINTS[state.tool]}.`
        : `${TOOL_HINTS[state.tool]}. Scroll to change the brush size. H hides these controls.`;
      hint.classList.toggle('gone', state.hasPainted);
    },
  };
}
