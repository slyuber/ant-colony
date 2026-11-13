// Turns the simulation textures into a picture, in linear light with values above 1 allowed.
// The tonemap pass brings it back into screen range.
@group(0) @binding(0) var<uniform> U: SimUniforms;
@group(0) @binding(1) var scentTex: texture_2d<f32>;
@group(0) @binding(2) var worldTex: texture_2d<f32>;
@group(0) @binding(3) var crowdTex: texture_2d<f32>;

// bg ground | home, trail: the two scent hazes of a lone colony | outC, backC: the two ant colours |
// hot: the core of a busy highway | food | nest
// One colony: outC = ants leaving, backC = ants returning. Two colonies: backC = colony A, outC = colony B.
struct Pal { bg: vec3f, home: vec3f, trail: vec3f, outC: vec3f, backC: vec3f, hot: vec3f, food: vec3f, nest: vec3f };

fn palette(i: f32) -> Pal {
  if (i < 0.5) {   // Ember: amber against blue
    return Pal(vec3f(0.0030, 0.0036, 0.0065), vec3f(0.03, 0.10, 0.85), vec3f(1.00, 0.30, 0.04),
               vec3f(0.16, 0.42, 1.00), vec3f(1.00, 0.46, 0.08), vec3f(1.00, 0.86, 0.52),
               vec3f(0.42, 0.95, 0.26), vec3f(1.00, 0.80, 0.50));
  }
  if (i < 1.5) {   // Tide: sea green against violet
    return Pal(vec3f(0.0022, 0.0040, 0.0060), vec3f(0.26, 0.06, 0.90), vec3f(0.02, 0.80, 0.52),
               vec3f(0.55, 0.30, 1.00), vec3f(0.05, 0.95, 0.62), vec3f(0.72, 1.00, 0.90),
               vec3f(1.00, 0.60, 0.72), vec3f(0.80, 0.95, 1.00));
  }
  // Bone: paper against slate
  return Pal(vec3f(0.0040, 0.0040, 0.0045), vec3f(0.12, 0.15, 0.22), vec3f(0.70, 0.60, 0.44),
             vec3f(0.36, 0.46, 0.66), vec3f(1.00, 0.90, 0.72), vec3f(1.00, 0.97, 0.90),
             vec3f(1.00, 0.58, 0.18), vec3f(1.00, 0.96, 0.88));
}

fn grain(c: vec2i) -> f32 {
  return f32(pcg(u32(c.x) + pcg(u32(c.y))) >> 8u) / 16777216.0;
}

// Brightness follows the logarithm of the head count: one ant is a visible speck,
// a highway of sixty per pixel is bright but never burns out to white.
fn levelOf(heads: f32) -> f32 {
  return log(1.0 + heads * 1.2) / log(61.0);
}

// Light from one colony's ants here. c = (searching, carrying). Carriers are the bright ones.
fn colonyLight(c: vec2f, hue: vec3f, hot: vec3f) -> vec3f {
  let heads = c.x + c.y;
  let level = levelOf(heads);
  let carry = c.y / max(heads, 0.0001);
  let tint = mix(hue, hot, 0.45 * smoothstep(0.70, 1.05, level) * carry);
  return tint * (level * 0.9 + level * level * 0.55) * mix(0.50, 1.0, carry);
}

// A nest: a lit ring with a soft heart, and a wide faint glow around it.
fn drawNest(col: vec3f, p: vec2f, centre: vec2f, tint: vec3f) -> vec3f {
  let nd = distance(p, centre) / U.nestRadius;
  let disc = smoothstep(1.0, 0.86, nd);
  let ring = smoothstep(0.62, 0.86, nd) * disc;
  return mix(col, tint * (0.38 + 0.95 * ring), disc) + tint * 0.16 * exp(-nd * nd * 0.30);
}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
  return vec4f(f32(i32(vi & 1u) * 4 - 1), f32(i32(vi >> 1u) * 4 - 1), 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) frag: vec4f) -> @location(0) vec4f {
  let c = vec2i(frag.xy);
  let hi = vec2i(U.world) - 1;
  let pal = palette(U.palette);
  let s = textureLoad(scentTex, c, 0);
  let two = U.colonies > 1.5;

  // Average the neighbours: soft edges for walls and food, and ants read as a flow instead of pixel noise.
  var wall = 0.0;
  var food = 0.0;
  var crowd = vec4f(0.0);
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let q = clamp(c + vec2i(dx, dy), vec2i(0), hi);
      let w = textureLoad(worldTex, q, 0);
      wall += w.r;
      food += min(w.g, 1.0);
      let k = select(0.08, 0.36, dx == 0 && dy == 0);   // the pixel the ant stands on counts most
      crowd += textureLoad(crowdTex, q, 0) * k;
    }
  }
  wall /= 9.0;
  food /= 9.0;

  var col = pal.bg;
  if (two) {
    // Two colonies: one hue each. Scent is a soft haze under each colony's ants.
    let hueA = pal.backC;
    let hueB = pal.outC;
    col += hueA * (1.0 - exp(-(s.g + s.r * 0.35) * 0.30)) * 0.10;
    col += hueB * (1.0 - exp(-(s.a + s.b * 0.35) * 0.30)) * 0.10;
    col += colonyLight(crowd.rg, hueA, pal.hot);
    col += colonyLight(crowd.ba, hueB, mix(hueB, vec3f(1.0), 0.55));
    if (U.fight > 0.5) {
      // Where both colonies stand on the same ground, the fight glints white.
      // Two stray ants passing do not count: it takes a crowd on both sides.
      let clash = max(min(crowd.r + crowd.g, crowd.b + crowd.a) - 0.6, 0.0);
      col += vec3f(1.0, 0.94, 0.88) * (1.0 - exp(-clash * 1.2)) * 1.7;
    }
  } else {
    col += pal.home * (1.0 - exp(-s.r * 0.30)) * 0.085;
    col += pal.trail * (1.0 - exp(-s.g * 0.30)) * 0.11;
    // Whichever direction has more ants here gives the colour. Leaving and returning ants are opposite
    // colours, so a shared lane flickers between the two instead of averaging to grey.
    let heads = crowd.r + crowd.g;
    let level = levelOf(heads);
    let homeward = smoothstep(0.35, 0.65, crowd.g / max(heads, 0.0001));
    var antCol = mix(pal.outC, pal.backC, homeward);
    antCol = mix(antCol, pal.hot, 0.45 * smoothstep(0.70, 1.05, level) * homeward);
    col += antCol * (level * 0.9 + level * level * 0.55) * mix(0.62, 1.0, homeward);
  }

  // Food: a pile of crumbs, not a flat disc. It dims as it is eaten.
  let here = min(textureLoad(worldTex, c, 0).g, 1.0);
  let crumb = grain(c / 2);
  let fine = grain(c);
  let foodCol = pal.food * (0.035 + here * (0.07 + 0.34 * crumb * crumb * (0.6 + 0.4 * fine) + 1.1 * step(0.94, crumb)));
  col = mix(col, foodCol, smoothstep(0.0, 0.5, food));

  // Rain: a faint cool veil with falling streaks.
  if (U.rainW > 0.0) {
    let d = abs(frag.x - U.rainX) / U.rainW;
    if (d < 1.0) {
      let fall = 1.0 - d * d;
      let drop = vec2i(c.x, i32(floor((frag.y - U.frame * 22.0) / 46.0)));
      let streak = step(0.972, grain(drop));
      col += vec3f(0.34, 0.46, 0.70) * fall * (0.012 + 0.12 * streak * fall);
    }
  }

  // Walls: matte and dark, with a thin lit rim.
  let rim = 4.0 * wall * (1.0 - wall);
  col = mix(col, pal.bg * 5.0 + vec3f(0.012), smoothstep(0.2, 0.8, wall));
  col += vec3f(0.10, 0.11, 0.14) * rim;

  if (two) {
    col = drawNest(col, frag.xy, U.nest, mix(pal.backC, vec3f(1.0), 0.45));
    col = drawNest(col, frag.xy, U.nestB, mix(pal.outC, vec3f(1.0), 0.45));
  } else {
    col = drawNest(col, frag.xy, U.nest, pal.nest);
  }
  return vec4f(col, 1.0);
}
