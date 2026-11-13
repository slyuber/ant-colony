import { MAX_SEGMENTS, type Segment } from '../input/brush';
import type { Params } from '../sim/params';

export interface FrameInfo {
  worldW: number; worldH: number; frame: number;
  nests: [[number, number], [number, number]];
  nestRadius: number;
  /** How many ant slots the shaders walk this frame. */
  slots: number;
  pops: [number, number];
  paused: boolean;
  rainX: number; rainW: number;
}

/** Mirrors `SimUniforms` in shaders/common.wgsl: 24 floats. */
export function packSimUniforms(p: Params, f: FrameInfo): Float32Array {
  return Float32Array.of(
    f.worldW, f.worldH, f.nests[0][0], f.nests[0][1],
    f.nestRadius, f.frame, f.slots, p.speed,
    p.wobble, p.evaporation, p.diffusion, p.palette,
    p.bloom, f.paused ? 1 : 0, p.colonies, p.fight,
    f.nests[1][0], f.nests[1][1], f.pops[0], f.pops[1],
    f.rainX, f.rainW, 0, 0,
  );
}

/** Mirrors `Segments` in shaders/common.wgsl: 8-float header (count first), then 8 floats per segment. */
export function packSegments(segs: Segment[]): Float32Array {
  if (segs.length > MAX_SEGMENTS) throw new Error(`at most ${MAX_SEGMENTS} segments per frame`);
  const out = new Float32Array(MAX_SEGMENTS * 8 + 8);
  out[0] = segs.length;
  segs.forEach((s, i) => out.set([s.ax, s.ay, s.bx, s.by, s.radius, s.tool], 8 + i * 8));
  return out;
}
