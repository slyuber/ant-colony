// Counts ants per pixel into a "crowd" texture: r,g = colony A searching, carrying | b,a = colony B.
// The scene shader turns the counts into light, and in Fight the ants read them to find enemies.
@group(0) @binding(0) var<uniform> U: SimUniforms;
@group(0) @binding(1) var<storage, read> ants: array<Ant>;

struct VOut { @builtin(position) pos: vec4f, @location(0) col: vec4f };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let a = ants[vi];
  var o: VOut;
  if ((a.state & ALIVE) == 0u) {
    o.pos = vec4f(2.0, 2.0, 0.0, 1.0);
    return o;
  }
  o.pos = vec4f(a.pos.x / U.world.x * 2.0 - 1.0, 1.0 - a.pos.y / U.world.y * 2.0, 0.0, 1.0);
  let mine = select(vec2f(1.0, 0.0), vec2f(0.0, 1.0), (a.state & 1u) != 0u);
  o.col = select(vec4f(mine, 0.0, 0.0), vec4f(0.0, 0.0, mine), colonyOf(vi, U.colonies) == 1u);
  return o;
}

@fragment
fn fs(v: VOut) -> @location(0) vec4f {
  return v.col;
}
