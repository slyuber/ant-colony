import { describe, expect, it } from 'vitest';
import { DEFAULTS, RANGES, clampParams } from './params';

describe('clampParams', () => {
  it('returns defaults for an empty input', () => {
    expect(clampParams({})).toEqual(DEFAULTS);
  });
  it('raises ant count to the minimum', () => {
    expect(clampParams({ antCount: 5 }).antCount).toBe(50_000);
  });
  it('lowers ant count to the maximum', () => {
    expect(clampParams({ antCount: 9e9 }).antCount).toBe(1_000_000);
  });
  it('makes ant count a whole number', () => {
    expect(clampParams({ antCount: 250_000.7 }).antCount).toBe(250_000);
  });
  it('replaces NaN with the default', () => {
    expect(clampParams({ evaporation: NaN }).evaporation).toBe(DEFAULTS.evaporation);
  });
  it('replaces a non-number with the default', () => {
    expect(clampParams({ speed: 'abc' }).speed).toBe(DEFAULTS.speed);
  });
  it('clamps palette to the last choice', () => {
    expect(clampParams({ palette: 7 }).palette).toBe(2);
  });
  it('accepts numeric strings from sliders', () => {
    expect(clampParams({ speed: '2.5' }).speed).toBe(2.5);
  });
  it('has defaults inside every range', () => {
    for (const k of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
      expect(DEFAULTS[k]).toBeGreaterThanOrEqual(RANGES[k][0]);
      expect(DEFAULTS[k]).toBeLessThanOrEqual(RANGES[k][1]);
    }
    expect(DEFAULTS.antCount).toBe(250_000);
  });
  it('treats a blank or space-only value as not given', () => {
    expect(clampParams({ speed: ' ' }).speed).toBe(DEFAULTS.speed);
    expect(clampParams({ antCount: '	' }).antCount).toBe(DEFAULTS.antCount);
  });
  it('defaults to two racing colonies in a living world', () => {
    expect(DEFAULTS.colonies).toBe(2);
    expect(DEFAULTS.fight).toBe(0);
    expect(DEFAULTS.rain).toBe(1);
    expect(DEFAULTS.foodGrowth).toBeGreaterThan(0);
  });
  it('keeps the switches to their two positions', () => {
    expect(clampParams({ colonies: 5 }).colonies).toBe(2);
    expect(clampParams({ colonies: 0 }).colonies).toBe(1);
    expect(clampParams({ fight: 0.9 }).fight).toBe(0);
    expect(clampParams({ rain: '1' }).rain).toBe(1);
  });
});
