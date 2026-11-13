// One ant = 24 bytes: pos f32 x2, heading f32, timer f32, state u32, seed u32.
// Mirrors the `Ant` struct in gpu/shaders/common.wgsl.
export const ANT_STRIDE = 24;
export const MAX_ANTS = 1_000_000;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Initial ant buffer. Always MAX_ANTS long so the ant count can be raised later
 * without touching the CPU again. `count` is accepted for the caller's intent;
 * every slot is initialised the same way.
 */
export function packAnts(_count: number, nestX: number, nestY: number, nestRadius: number, seed: number): ArrayBuffer {
  const buf = new ArrayBuffer(MAX_ANTS * ANT_STRIDE);
  const f = new Float32Array(buf);
  const u = new Uint32Array(buf);
  const rand = mulberry32(seed);
  const TAU = Math.PI * 2;
  for (let i = 0; i < MAX_ANTS; i++) {
    const o = i * 6;
    const angle = rand() * TAU;
    const r = Math.sqrt(rand()) * nestRadius * 0.999;
    f[o] = nestX + Math.cos(angle) * r;
    f[o + 1] = nestY + Math.sin(angle) * r;
    f[o + 2] = Math.min(rand() * TAU, 6.2831845);
    f[o + 3] = 0;
    u[o + 4] = 0;
    u[o + 5] = (rand() * 4294967296) >>> 0;
  }
  return buf;
}
