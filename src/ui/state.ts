import { Tool } from '../input/brush';
import type { Params } from '../sim/params';

/** Everything the person can change. One object, shared by input, UI and the frame loop. */
export interface AppState {
  params: Params;
  tool: Tool;
  paused: boolean;
  uiHidden: boolean;
  meterOn: boolean;
  panelOpen: boolean;
  hasPainted: boolean;
  /** A finger-first device (phone, tablet): no hover, no wheel, no keyboard. */
  touch: boolean;
}

export interface Actions {
  /** Call after changing state so the UI redraws. */
  changed(): void;
  reset(): void;
}

export const TOOL_NAMES: Record<Tool, string> = {
  [Tool.Food]: 'Food',
  [Tool.Wall]: 'Wall',
  [Tool.Erase]: 'Erase',
  [Tool.Scatter]: 'Scatter',
};

export const TOOL_HINTS: Record<Tool, string> = {
  [Tool.Food]: 'Drag to drop food',
  [Tool.Wall]: 'Drag to draw a wall',
  [Tool.Erase]: 'Drag to remove walls and food',
  [Tool.Scatter]: 'Hold to push ants away',
};
