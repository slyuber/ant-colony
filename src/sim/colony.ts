import { MAX_ANTS } from './ants';

/** Ants alive in colony A and colony B. */
export type Pops = [number, number];

// A delivery feeds a sixteenth of a new ant; every ant costs 0.4% of itself per second to keep.
// A colony whose ants all have work doubles in a few minutes; one with no food halves in about three.
export const GROW_PER_DELIVERY = 0.06;
export const UPKEEP_PER_SEC = 0.004;
const START_SHARE = 0.35;
const FLOOR_SHARE = 0.02;
const CAP_SHARE = 0.75;

const cap = (budget: number): number => Math.min(budget * CAP_SHARE, MAX_ANTS / 2);
const clean = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);

export function startPopulations(budget: number, colonies: number): Pops {
  if (colonies < 2) return [Math.min(budget, MAX_ANTS), 0];
  const each = Math.min(budget * START_SHARE, MAX_ANTS / 2);
  return [each, each];
}

/**
 * The contest rule. `delivered` and `deaths` are what happened to each colony over the last `seconds`.
 * Food brought home adds ants, deaths and upkeep remove them. Each colony stays between a small floor
 * (so it can always come back) and a cap, and together they never exceed the budget.
 */
export function stepPopulations(
  pops: Pops, delivered: Pops, deaths: Pops, seconds: number, budget: number, colonies: number,
): Pops {
  if (colonies < 2) return [Math.min(budget, MAX_ANTS), 0];
  const floor = budget * FLOOR_SHARE;
  const next = pops.map((pop, i) => {
    const v = pop + clean(delivered[i]) * GROW_PER_DELIVERY - clean(deaths[i]) - pop * UPKEEP_PER_SEC * seconds;
    return Math.min(cap(budget), Math.max(floor, v));
  }) as Pops;
  const total = next[0] + next[1];
  if (total > budget) {
    next[0] *= budget / total;
    next[1] *= budget / total;
  }
  return next;
}

/** The Ants slider moved: keep each colony's share of the new budget. */
export function rescalePopulations(pops: Pops, oldBudget: number, newBudget: number, colonies: number): Pops {
  if (colonies < 2) return [Math.min(newBudget, MAX_ANTS), 0];
  const k = newBudget / Math.max(1, oldBudget);
  return [Math.min(cap(newBudget), pops[0] * k), Math.min(cap(newBudget), pops[1] * k)];
}

/** Nest centres. Two colonies face each other along the long side of the screen. */
export function nestPositions(width: number, height: number, colonies: number): [[number, number], [number, number]] {
  const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
  if (colonies < 2) return [[cx, cy], [cx, cy]];
  if (width >= height) return [[Math.floor(width * 0.3), cy], [Math.floor(width * 0.7), cy]];
  return [[cx, Math.floor(height * 0.3)], [cx, Math.floor(height * 0.7)]];
}

const RAIN_PERIOD = 5400;   // frames: about 90 seconds
const RAIN_FIRST = 2400;    // the first shower comes after about 40 seconds
const RAIN_CROSSING = 360;  // frames for the band's centre to cross the screen: about 6 seconds

/** Where the shower is at this frame: centre `x` and half-width `w` in world pixels. `w` is 0 when dry. */
export function rainBand(frame: number, worldW: number, on: boolean): { x: number; w: number } {
  if (!on) return { x: 0, w: 0 };
  const w = Math.max(80, worldW * 0.09);
  const speed = worldW / RAIN_CROSSING;
  const t = (((frame - RAIN_FIRST) % RAIN_PERIOD) + RAIN_PERIOD) % RAIN_PERIOD;
  if (frame < RAIN_FIRST || t * speed > worldW + 2 * w + speed) return { x: 0, w: 0 };
  return { x: -w + t * speed, w };
}

/** Frames between new food sprouts for a Food growth setting of 0 to 1. 0 means never. */
export function sproutEvery(growth: number): number {
  if (!(growth > 0)) return 0;
  const g = Math.min(1, growth);
  return Math.round(1800 * Math.pow(150 / 1800, g));   // 30 seconds down to 2.5 seconds, evenly by ratio
}
