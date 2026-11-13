import { describe, expect, it } from 'vitest';
import { MAX_SEGMENTS, Tool, type Segment } from '../input/brush';
import { DEFAULTS } from '../sim/params';
import { packSegments, packSimUniforms } from './uniforms';

const s: Segment = { ax: 1, ay: 2, bx: 3, by: 4, radius: 5, tool: Tool.Erase };

describe('packSegments', () => {
  it('has a fixed size with a count header', () => {
    const none = packSegments([]);
    expect(none.length).toBe(MAX_SEGMENTS * 8 + 8);
    expect(none[0]).toBe(0);
    expect(packSegments([s, s])[0]).toBe(2);
  });
  it('lays out one segment after the header', () => {
    expect(packSegments([s]).slice(8, 14)).toEqual(Float32Array.of(1, 2, 3, 4, 5, Tool.Erase));
  });
  it('places the second segment 8 floats later', () => {
    expect(packSegments([s, { ...s, ax: 9 }])[16]).toBe(9);
  });
  it('refuses more than a frame can hold', () => {
    expect(() => packSegments(new Array(9).fill(s))).toThrow();
  });
});

describe('packSimUniforms', () => {
  const u = packSimUniforms(DEFAULTS, {
    worldW: 1920, worldH: 1080, frame: 7, nests: [[576, 540], [1344, 541]], nestRadius: 24,
    slots: 123_456, pops: [60_000, 61_728], paused: true, rainX: 300, rainW: 170,
  });
  it('is 24 floats in the documented order', () => {
    expect(u.length).toBe(24);
    expect(Array.from(u.slice(0, 7))).toEqual([1920, 1080, 576, 540, 24, 7, 123_456]);
    expect(u[7]).toBeCloseTo(DEFAULTS.speed);
    expect(u[8]).toBeCloseTo(DEFAULTS.wobble);
    expect(u[9]).toBeCloseTo(DEFAULTS.evaporation);
    expect(u[10]).toBeCloseTo(DEFAULTS.diffusion);
    expect(u[11]).toBe(DEFAULTS.palette);
    expect(u[12]).toBe(DEFAULTS.bloom);
    expect(u[13]).toBe(1);
    expect(u[14]).toBe(DEFAULTS.colonies);
    expect(u[15]).toBe(DEFAULTS.fight);
    expect(Array.from(u.slice(16, 22))).toEqual([1344, 541, 60_000, 61_728, 300, 170]);
  });
});
