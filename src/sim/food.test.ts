import { describe, expect, it } from 'vitest';
import { Tool } from '../input/brush';
import { scatterFood, sprout, startingFood } from './food';

describe('startingFood', () => {
  const W = 1920, H = 1080, NX = 960, NY = 540;

  it('places five food piles', () => {
    const piles = startingFood(W, H, NX, NY, 1);
    expect(piles).toHaveLength(5);
    for (const p of piles) expect(p.tool).toBe(Tool.Food);
  });

  it('keeps every pile on screen, clear of the nest and of the bottom controls', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const p of startingFood(W, H, NX, NY, seed)) {
        expect(p.ax - p.radius).toBeGreaterThanOrEqual(8);
        expect(p.ax + p.radius).toBeLessThanOrEqual(W - 8);
        expect(p.ay - p.radius).toBeGreaterThanOrEqual(8);
        expect(p.ay + p.radius).toBeLessThanOrEqual(H - 110);
        expect(Math.hypot(p.ax - NX, p.ay - NY) - p.radius).toBeGreaterThanOrEqual(70);
      }
    }
  });

  it('keeps piles apart from each other', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const piles = startingFood(W, H, NX, NY, seed);
      for (let i = 0; i < piles.length; i++) {
        for (let j = i + 1; j < piles.length; j++) {
          const gap = Math.hypot(piles[i].ax - piles[j].ax, piles[i].ay - piles[j].ay) - piles[i].radius - piles[j].radius;
          expect(gap).toBeGreaterThan(20);
        }
      }
    }
  });

  it('gives the same layout for the same seed and a different one for the next', () => {
    expect(startingFood(W, H, NX, NY, 7)).toEqual(startingFood(W, H, NX, NY, 7));
    expect(startingFood(W, H, NX, NY, 7)).not.toEqual(startingFood(W, H, NX, NY, 8));
  });

  it('still fits a small window', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const p of startingFood(480, 360, 240, 180, seed)) {
        expect(p.ax - p.radius).toBeGreaterThanOrEqual(0);
        expect(p.ax + p.radius).toBeLessThanOrEqual(480);
        expect(p.ay - p.radius).toBeGreaterThanOrEqual(0);
        expect(p.ay + p.radius).toBeLessThanOrEqual(360);
        expect(p.radius).toBeGreaterThanOrEqual(6);
      }
    }
  });
});

describe('scatterFood', () => {
  const W = 1920, H = 1080;
  const nests: [number, number][] = [[576, 540], [1344, 540]];

  it('places the number of piles asked for', () => {
    expect(scatterFood(W, H, nests, 3, 7)).toHaveLength(7);
  });
  it('keeps piles on screen, off both nests and apart', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const piles = scatterFood(W, H, nests, seed, 7);
      piles.forEach((p, i) => {
        expect(p.tool).toBe(Tool.Food);
        expect(p.ax - p.radius).toBeGreaterThanOrEqual(8);
        expect(p.ax + p.radius).toBeLessThanOrEqual(W - 8);
        expect(p.ay - p.radius).toBeGreaterThanOrEqual(8);
        expect(p.ay + p.radius).toBeLessThanOrEqual(H - 110);
        for (const [nx, ny] of nests) expect(Math.hypot(p.ax - nx, p.ay - ny) - p.radius).toBeGreaterThanOrEqual(70);
        for (let j = i + 1; j < piles.length; j++) {
          expect(Math.hypot(p.ax - piles[j].ax, p.ay - piles[j].ay) - p.radius - piles[j].radius).toBeGreaterThan(20);
        }
      });
    }
  });
  it('is repeatable per seed', () => {
    expect(scatterFood(W, H, nests, 4, 7)).toEqual(scatterFood(W, H, nests, 4, 7));
    expect(scatterFood(W, H, nests, 4, 7)).not.toEqual(scatterFood(W, H, nests, 5, 7));
  });
  it('still fits a phone screen', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const p of scatterFood(585, 1266, [[292, 380], [292, 886]], seed, 7)) {
        expect(p.ax - p.radius).toBeGreaterThanOrEqual(0);
        expect(p.ax + p.radius).toBeLessThanOrEqual(585);
        expect(p.ay + p.radius).toBeLessThanOrEqual(1266);
      }
    }
  });
});

describe('sprout', () => {
  const nests: [number, number][] = [[576, 540], [1344, 540]];
  it('is one small food pile, on screen and off the nests', () => {
    for (let n = 0; n < 300; n++) {
      const p = sprout(1920, 1080, nests, 9, n);
      expect(p.tool).toBe(Tool.Food);
      expect(p.radius).toBeLessThanOrEqual(20);
      expect(p.ax - p.radius).toBeGreaterThanOrEqual(0);
      expect(p.ax + p.radius).toBeLessThanOrEqual(1920);
      expect(p.ay + p.radius).toBeLessThanOrEqual(1080 - 100);
      for (const [nx, ny] of nests) expect(Math.hypot(p.ax - nx, p.ay - ny)).toBeGreaterThan(80);
    }
  });
  it('lands somewhere new each time', () => {
    expect(sprout(1920, 1080, nests, 9, 1)).not.toEqual(sprout(1920, 1080, nests, 9, 2));
    expect(sprout(1920, 1080, nests, 9, 1)).toEqual(sprout(1920, 1080, nests, 9, 1));
  });
});
