// Last pass: picture + glow, squeezed into screen range. Standalone (no common prefix).
@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var hdrTex: texture_2d<f32>;
@group(0) @binding(2) var bloomTex: texture_2d<f32>;
@group(0) @binding(3) var<uniform> glow: vec4f;   // x = glow strength

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let p = vec2f(f32(i32(vi & 1u) * 4 - 1), f32(i32(vi >> 1u) * 4 - 1));
  return VOut(vec4f(p, 0.0, 1.0), vec2f(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5));
}

// ACES-style curve (Narkowicz fit): bright areas roll off to white instead of clipping flat.
fn aces(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
}

@fragment
fn fs(v: VOut) -> @location(0) vec4f {
  var c = textureLoad(hdrTex, vec2i(v.pos.xy), 0).rgb;
  c += textureSampleLevel(bloomTex, samp, v.uv, 0.0).rgb * glow.x;
  let d = v.uv - 0.5;
  c *= 1.0 - 0.55 * dot(d, d);
  c = pow(aces(c), vec3f(1.0 / 2.2));
  // A pinch of noise so dark gradients do not show bands.
  let n = fract(52.9829189 * fract(dot(v.pos.xy, vec2f(0.06711056, 0.00583715))));
  return vec4f(c + (n - 0.5) / 255.0, 1.0);
}
