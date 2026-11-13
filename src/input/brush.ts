export enum Tool { Food = 0, Wall = 1, Erase = 2, Scatter = 3 }

/** A brush stroke piece: a capsule from a to b with a radius, in world pixels. */
export interface Segment { ax: number; ay: number; bx: number; by: number; radius: number; tool: Tool }

export const MAX_SEGMENTS = 8;

/** Holds strokes between frames. A frame takes at most MAX_SEGMENTS; the rest wait, in order. */
export class BrushQueue {
  private items: Segment[] = [];
  push(s: Segment): void { this.items.push(s); }
  take(): Segment[] { return this.items.splice(0, MAX_SEGMENTS); }
  clear(): void { this.items.length = 0; }
  get pending(): number { return this.items.length; }
}

/** Pointer position (CSS pixels) to world pixels, clamped inside the world. */
export function clientToWorld(
  clientX: number, clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  worldW: number, worldH: number,
): [number, number] {
  const x = (clientX - rect.left) * (worldW / rect.width);
  const y = (clientY - rect.top) * (worldH / rect.height);
  return [Math.min(worldW - 1, Math.max(0, x)), Math.min(worldH - 1, Math.max(0, y))];
}
