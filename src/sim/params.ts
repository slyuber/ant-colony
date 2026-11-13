export interface Params {
  antCount: number;
  evaporation: number;
  diffusion: number;
  speed: number;
  wobble: number;
  palette: number;
  bloom: number;
  brushRadius: number;
  /** 1 or 2 nests. */
  colonies: number;
  /** 0 = the colonies only race for food, 1 = ants die where the colonies meet. */
  fight: number;
  /** 0 = dry, 1 = a shower crosses about every 90 seconds. */
  rain: number;
  /** 0 = no new food, 1 = a new pile every few seconds. */
  foodGrowth: number;
}

export const DEFAULTS: Params = {
  antCount: 250_000,
  evaporation: 0.985,
  diffusion: 0.25,
  speed: 1.5,
  wobble: 0.25,
  palette: 0,
  bloom: 2,
  brushRadius: 24,
  colonies: 2,
  fight: 0,
  rain: 1,
  foodGrowth: 0.3,
};

export const RANGES: Record<keyof Params, [number, number]> = {
  antCount: [50_000, 1_000_000],
  evaporation: [0.9, 0.999],
  diffusion: [0, 1],
  speed: [0.5, 4],
  wobble: [0, 1],
  palette: [0, 2],
  bloom: [0, 2],
  brushRadius: [4, 120],
  colonies: [1, 2],
  fight: [0, 1],
  rain: [0, 1],
  foodGrowth: [0, 1],
};

const WHOLE: ReadonlySet<keyof Params> = new Set(['antCount', 'palette', 'bloom', 'colonies', 'fight', 'rain']);

export function clampParams(p: Partial<Record<keyof Params, unknown>>): Params {
  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof Params)[]) {
    const raw = p[key];
    if (raw === undefined || raw === null) continue;
    if (typeof raw === 'string' && raw.trim() === '') continue;
    let v = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isNaN(v)) continue;
    const [lo, hi] = RANGES[key];
    v = Math.min(hi, Math.max(lo, v));
    out[key] = WHOLE.has(key) ? Math.floor(v) : v;
  }
  return out;
}
