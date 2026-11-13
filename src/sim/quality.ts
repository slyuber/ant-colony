import { RANGES, type Params } from './params';

/**
 * One step down the quality ladder, for a device that cannot keep up: glow first, then ant count.
 * Returns null when there is nothing left to give up.
 */
export function stepDown(p: Params): Params | null {
  if (p.bloom > 0) return { ...p, bloom: p.bloom - 1 };
  const min = RANGES.antCount[0];
  if (p.antCount <= min) return null;
  return { ...p, antCount: Math.max(min, Math.floor((p.antCount * 0.7) / 10_000) * 10_000) };
}

/** Starting settings for this device. A phone starts lighter; anything given in the address is kept. */
export function firstRunParams(p: Params, phone: boolean, given: ReadonlySet<string>): Params {
  if (!phone) return p;
  const out = { ...p };
  if (!given.has('antCount')) out.antCount = 100_000;
  if (!given.has('bloom')) out.bloom = 1;
  if (!given.has('brushRadius')) out.brushRadius = 34;
  return out;
}
