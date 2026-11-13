import { describe, expect, it } from 'vitest';
import { ANT_STRIDE, MAX_ANTS, packAnts } from './ants';

const read = (buf: ArrayBuffer, i: number) => {
  const f = new Float32Array(buf, i * ANT_STRIDE, 4);
  const u = new Uint32Array(buf, i * ANT_STRIDE + 16, 2);
  return { x: f[0], y: f[1], heading: f[2], timer: f[3], state: u[0], seed: u[1] };
};

describe('packAnts', () => {
  const buf = packAnts(1000, 960, 540, 20, 1);

  it('always fills the full-size buffer', () => {
    expect(ANT_STRIDE).toBe(24);
    expect(buf.byteLength).toBe(MAX_ANTS * ANT_STRIDE);
  });
  it('places every ant inside the nest, including ants beyond count', () => {
    for (const i of [...Array(1000).keys(), 1000, 500_000, MAX_ANTS - 1]) {
      const a = read(buf, i);
      expect(Math.hypot(a.x - 960, a.y - 540)).toBeLessThanOrEqual(20.001);
    }
  });
  it('gives each ant a valid heading and a clean state', () => {
    for (let i = 0; i < 1000; i++) {
      const a = read(buf, i);
      expect(a.heading).toBeGreaterThanOrEqual(0);
      expect(a.heading).toBeLessThan(Math.PI * 2);
      expect(a.state).toBe(0);
      expect(a.timer).toBe(0);
    }
  });
  it('spreads headings around the circle', () => {
    const quadrants = [0, 0, 0, 0];
    for (let i = 0; i < 1000; i++) quadrants[Math.floor(read(buf, i).heading / (Math.PI / 2))]++;
    for (const q of quadrants) expect(q).toBeGreaterThan(150);
  });
  it('gives ants distinct random seeds', () => {
    const seeds = new Set<number>();
    for (let i = 0; i < 1000; i++) seeds.add(read(buf, i).seed);
    expect(seeds.size).toBeGreaterThanOrEqual(990);
  });
  it('is deterministic per seed', () => {
    const a = new Uint8Array(packAnts(1000, 960, 540, 20, 1), 0, 24_000);
    const b = new Uint8Array(buf, 0, 24_000);
    const c = new Uint8Array(packAnts(1000, 960, 540, 20, 2), 0, 24_000);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
