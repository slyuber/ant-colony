import { describe, expect, it } from 'vitest';
import { BrushQueue, MAX_SEGMENTS, Tool, clientToWorld, type Segment } from './brush';

const seg = (i: number): Segment => ({ ax: i, ay: 0, bx: i + 1, by: 0, radius: 10, tool: Tool.Wall });

describe('BrushQueue', () => {
  it('hands out at most 8 segments per frame and keeps the rest', () => {
    expect(MAX_SEGMENTS).toBe(8);
    const q = new BrushQueue();
    for (let i = 0; i < 20; i++) q.push(seg(i));
    expect(q.take().length).toBe(8);
    expect(q.pending).toBe(12);
    expect(q.take().length).toBe(8);
    expect(q.take().length).toBe(4);
    expect(q.take()).toEqual([]);
  });
  it('keeps segments in drawing order across frames', () => {
    const q = new BrushQueue();
    for (let i = 0; i < 20; i++) q.push(seg(i));
    expect(q.take()[0].ax).toBe(0);
    expect(q.take()[0].ax).toBe(8);
    expect(q.take()[3].ax).toBe(19);
  });
});

describe('clientToWorld', () => {
  it('scales by display scaling (125%)', () => {
    expect(clientToWorld(100, 50, { left: 0, top: 0, width: 1536, height: 864 }, 1920, 1080)).toEqual([125, 62.5]);
  });
  it('accounts for the canvas offset and clamps the far edge', () => {
    expect(clientToWorld(110, 60, { left: 10, top: 10, width: 100, height: 100 }, 100, 100)).toEqual([99, 50]);
  });
  it('clamps to stay inside the world', () => {
    expect(clientToWorld(-10, 9999, { left: 0, top: 0, width: 100, height: 100 }, 200, 200)).toEqual([0, 199]);
  });
});
