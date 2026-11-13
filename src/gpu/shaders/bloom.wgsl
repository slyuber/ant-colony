// Glow: keep only the bright parts at reduced size, then blur them. Standalone (no common prefix).
@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var<uniform> dir: vec4f;   // blur only: xy = one texel step along the blur axis

struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let p = vec2f(f32(i32(vi & 1u) * 4 - 1), f32(i32(vi >> 1u) * 4 - 1));
  return VOut(vec4f(p, 0.0, 1.0), vec2f(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5));
}

@fragment
fn fsDown(v: VOut) -> @location(0) vec4f {
  let c = textureSampleLevel(src, samp, v.uv, 0.0).rgb;
  let luma = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  return vec4f(c * smoothstep(0.25, 1.4, luma), 1.0);
}

@fragment
fn fsBlur(v: VOut) -> @location(0) vec4f {
  var c = textureSampleLevel(src, samp, v.uv, 0.0).rgb * 0.2270270270;
  let o1 = dir.xy * 1.3846153846;
  let o2 = dir.xy * 3.2307692308;
  c += (textureSampleLevel(src, samp, v.uv + o1, 0.0).rgb + textureSampleLevel(src, samp, v.uv - o1, 0.0).rgb) * 0.3162162162;
  c += (textureSampleLevel(src, samp, v.uv + o2, 0.0).rgb + textureSampleLevel(src, samp, v.uv - o2, 0.0).rgb) * 0.0702702703;
  return vec4f(c, 1.0);
}
