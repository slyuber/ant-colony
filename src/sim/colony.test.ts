import { describe, expect, it } from 'vitest';
import {
  GROW_PER_DELIVERY as G, UPKEEP_PER_SEC as U, nestPositions, rainBand, rescalePopulations, sproutEvery,
  startPopulations, stepPopulations,
} from './colony';

describe('startPopulations', () => {
  it('gives a lone colony the whole budget', () => {
    expect(startPopulations(250_000, 1)).toEqual([250_000, 0]);
  });
  it('starts two colonies level, with room left for either to grow', () => {
    expect(startPopulations(200_000, 2)).toEqual([70_000, 70_000]);
  });
  it('never asks for more ants per colony than the buffer holds', () => {
    const [a, b] = startPopulations(1_000_000, 2);
    expect(a).toBeLessThanOrEqual(500_000);
    expect(b).toBeLessThanOrEqual(500_000);
  });
});

describe('stepPopulations', () => {
  const B = 200_000;
  it('leaves a lone colony at the full budget', () => {
    expect(stepPopulations([B, 0], [900, 0], [50, 0], 0.5, B, 1)).toEqual([B, 0]);
  });
  it('grows the colony that brings food home', () => {
    const [a, b] = stepPopulations([50_000, 50_000], [4000, 0], [0, 0], 0.5, B, 2);
    expect(a).toBeGreaterThan(50_000);
    expect(b).toBeLessThan(50_000);
  });
  it('shrinks a colony by one ant per death', () => {
    const calm = stepPopulations([50_000, 50_000], [0, 0], [0, 0], 0.5, B, 2);
    const war = stepPopulations([50_000, 50_000], [0, 0], [300, 0], 0.5, B, 2);
    expect(calm[0] - war[0]).toBeCloseTo(300, 5);
    expect(war[1]).toBeCloseTo(calm[1], 5);
  });
  it('never lets a colony fall below the floor, so it can come back', () => {
    const [a] = stepPopulations([4100, 100_000], [0, 0], [90_000, 0], 0.5, B, 2);
    expect(a).toBe(B * 0.02);
  });
  it('caps one colony at three quarters of the budget', () => {
    const [a] = stepPopulations([149_000, 10_000], [900_000, 0], [0, 0], 0.5, B, 2);
    expect(a).toBe(B * 0.75);
  });
  it('keeps the total within the budget by shrinking both in proportion', () => {
    const [a, b] = stepPopulations([120_000, 80_000], [500_000, 500_000], [0, 0], 0.5, B, 2);
    expect(a + b).toBeLessThanOrEqual(B + 1e-6);
    expect(a / b).toBeCloseTo(
      Math.min(150_000, 120_000 + 500_000 * G - 120_000 * U * 0.5) / (80_000 + 500_000 * G - 80_000 * U * 0.5), 5);
  });
  it('ignores nonsense readings', () => {
    expect(stepPopulations([50_000, 50_000], [NaN, -5], [NaN, -1], 0.5, B, 2)).toEqual(
      stepPopulations([50_000, 50_000], [0, 0], [0, 0], 0.5, B, 2));
  });
});

describe('rescalePopulations', () => {
  it('keeps each share when the Ants slider moves', () => {
    expect(rescalePopulations([60_000, 20_000], 200_000, 400_000, 2)).toEqual([120_000, 40_000]);
  });
  it('gives a lone colony the new budget', () => {
    expect(rescalePopulations([200_000, 0], 200_000, 300_000, 1)).toEqual([300_000, 0]);
  });
});

describe('nestPositions', () => {
  it('puts a lone nest in the middle', () => {
    expect(nestPositions(1920, 1080, 1)).toEqual([[960, 540], [960, 540]]);
  });
  it('puts two nests left and right on a wide screen', () => {
    expect(nestPositions(1920, 1080, 2)).toEqual([[576, 540], [1344, 540]]);
  });
  it('puts two nests above and below on a tall phone screen', () => {
    const [a, b] = nestPositions(600, 1200, 2);
    expect(a[0]).toBe(300);
    expect(b[0]).toBe(300);
    expect(a[1]).toBeLessThan(b[1]);
  });
});

describe('rainBand', () => {
  it('is dry when rain is off', () => {
    for (let f = 0; f < 12_000; f += 50) expect(rainBand(f, 1920, false).w).toBe(0);
  });
  it('is dry for the first half minute', () => {
    for (let f = 0; f < 1800; f += 10) expect(rainBand(f, 1920, true).w).toBe(0);
  });
  it('sweeps a band from off the left edge to off the right edge', () => {
    const wet: number[] = [];
    for (let f = 0; f < 5400; f++) {
      const r = rainBand(f, 1920, true);
      if (r.w > 0) wet.push(r.x);
    }
    expect(wet.length).toBeGreaterThan(200);
    expect(wet.length).toBeLessThan(900);
    expect(wet[0]).toBeLessThan(0);
    expect(wet[wet.length - 1]).toBeGreaterThan(1920);
    for (let i = 1; i < wet.length; i++) expect(wet[i]).toBeGreaterThan(wet[i - 1]);
  });
  it('comes back about every 90 seconds', () => {
    const a = rainBand(2500, 1920, true);
    const b = rainBand(2500 + 5400, 1920, true);
    expect(a.w).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });
});

describe('sproutEvery', () => {
  it('never sprouts when growth is off', () => {
    expect(sproutEvery(0)).toBe(0);
  });
  it('sprouts faster as growth rises', () => {
    expect(sproutEvery(1)).toBeLessThan(sproutEvery(0.3));
    expect(sproutEvery(0.3)).toBeLessThan(sproutEvery(0.05));
    expect(sproutEvery(1)).toBeGreaterThanOrEqual(120);
  });
});

describe('the pace of the contest', () => {
  it('lets a colony with steady work double in minutes, not seconds', () => {
    // 60,000 ants each bringing food home every nine seconds, checked twice a second for one minute.
    let pops: [number, number] = [60_000, 60_000];
    for (let i = 0; i < 120; i++) pops = stepPopulations(pops, [(pops[0] / 9) * 0.5, 0], [0, 0], 0.5, 1_000_000, 2);
    expect(pops[0]).toBeGreaterThan(63_000);
    expect(pops[0]).toBeLessThan(90_000);
    expect(pops[1]).toBeLessThan(60_000);
    expect(pops[1]).toBeGreaterThan(40_000);
  });
});
