@group(0) @binding(0) var<uniform> U: SimUniforms;
@group(0) @binding(1) var<uniform> S: Segments;
@group(0) @binding(2) var scentTex: texture_2d<f32>;
@group(0) @binding(3) var worldTex: texture_2d<f32>;
@group(0) @binding(4) var takenTex: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  return vec4f(f32(i32(vi & 1u) * 4 - 1), f32(i32(vi >> 1u) * 4 - 1), 0.0, 1.0);
}

struct FOut { @location(0) scent: vec4f, @location(1) world: vec4f };

@fragment
fn fs(@builtin(position) frag: vec4f) -> FOut {
  let c = vec2i(frag.xy);
  let hi = vec2i(U.world) - 1;
  var w = textureLoad(worldTex, c, 0);
  var s = textureLoad(scentTex, c, 0);

  if (U.paused < 0.5) {
    var sum = vec4f(0.0);
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        sum += textureLoad(scentTex, clamp(c + vec2i(dx, dy), vec2i(0), hi), 0);
      }
    }
    s = mix(s, sum / 9.0, U.diffusion) * U.evaporation;
    w.g = max(w.g - textureLoad(takenTex, c, 0).r, 0.0);

    // Rain washes scent away, hardest in the middle of the band.
    if (U.rainW > 0.0) {
      let d = abs(frag.x - U.rainX) / U.rainW;
      if (d < 1.0) { s *= mix(0.90, 1.0, d * d); }
    }
  }

  // The nests and their doorsteps cannot be painted over: a sealed nest ends the colony.
  var nearNest = distance(frag.xy, U.nest) <= U.nestRadius + 10.0;
  if (U.colonies > 1.5 && distance(frag.xy, U.nestB) <= U.nestRadius + 10.0) { nearNest = true; }

  let n = u32(S.head.x);
  for (var k = 0u; k < n; k++) {
    let sg = S.items[k];
    if (segDist(frag.xy, sg) <= sg.rt.x) {
      if (sg.rt.y == TOOL_FOOD) {
        // No food on a nest's doorstep either: it would feed that colony for free.
        if (w.r < 0.5 && !nearNest) { w.g = 1.0; }
      } else if (sg.rt.y == TOOL_WALL) {
        if (!nearNest) {
          w.r = 1.0;
          w.g = 0.0;
        }
      } else if (sg.rt.y == TOOL_ERASE) {
        w.r = 0.0;
        w.g = 0.0;
      }
    }
  }

  if (w.r > 0.5) { s = vec4f(0.0); }
  s = clamp(s, vec4f(0.0), vec4f(SCENT_MAX));
  return FOut(s, vec4f(w.rg, 0.0, 1.0));
}
