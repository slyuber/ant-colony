import { describe, expect, it } from 'vitest';
import { DEFAULTS, RANGES } from './params';
import { firstRunParams, stepDown } from './quality';

describe('stepDown', () => {
  it('lowers the glow first', () => {
    expect(stepDown({ ...DEFAULTS, bloom: 2 })).toEqual({ ...DEFAULTS, bloom: 1 });
    expect(stepDown({ ...DEFAULTS, bloom: 1 })).toEqual({ ...DEFAULTS, bloom: 0 });
  });
  it('then thins the ants, in round steps', () => {
    const next = stepDown({ ...DEFAULTS, bloom: 0, antCount: 250_000 })!;
    expect(next.antCount).toBe(170_000);
    expect(next.bloom).toBe(0);
  });
  it('stops at the smallest colony', () => {
    const low = { ...DEFAULTS, bloom: 0, antCount: RANGES.antCount[0] };
    expect(stepDown(low)).toBeNull();
    expect(stepDown({ ...low, antCount: 60_000 })!.antCount).toBe(RANGES.antCount[0]);
  });
});

describe('firstRunParams', () => {
  it('leaves a desktop alone', () => {
    expect(firstRunParams(DEFAULTS, false, new Set())).toEqual(DEFAULTS);
  });
  it('starts a phone with fewer ants, softer glow and a bigger brush', () => {
    const p = firstRunParams(DEFAULTS, true, new Set());
    expect(p.antCount).toBe(100_000);
    expect(p.bloom).toBe(1);
    expect(p.brushRadius).toBeGreaterThan(DEFAULTS.brushRadius);
  });
  it('never overrides what the address asked for', () => {
    const p = firstRunParams({ ...DEFAULTS, antCount: 400_000 }, true, new Set(['antCount']));
    expect(p.antCount).toBe(400_000);
    expect(p.bloom).toBe(1);
  });
});
