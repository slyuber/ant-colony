@group(0) @binding(0) var<uniform> U: SimUniforms;
@group(0) @binding(1) var<storage, read> ants: array<Ant>;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) scent: vec4f,
  @location(1) taken: vec4f,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VOut {
  let a = ants[vi];
  var o: VOut;
  if ((a.state & ALIVE) == 0u) {
    o.pos = vec4f(2.0, 2.0, 0.0, 1.0);   // off screen: an empty slot lays nothing
    return o;
  }
  o.pos = vec4f(a.pos.x / U.world.x * 2.0 - 1.0, 1.0 - a.pos.y / U.world.y * 2.0, 0.0, 1.0);
  // Scent is only laid by ants that touched the nest or food recently, so a trail always leads somewhere real.
  let carrying = (a.state & 1u) != 0u;
  let home = DEPOSIT_STRENGTH * max(0.0, 1.0 - a.timer / HOME_FADE_FRAMES);
  let food = DEPOSIT_STRENGTH * exp(-a.timer / DEPOSIT_FADE_FRAMES);
  let mine = select(vec2f(home, 0.0), vec2f(0.0, food), carrying);
  // Each colony writes its own two slots, so neither can smell the other's trails.
  o.scent = select(vec4f(mine, 0.0, 0.0), vec4f(0.0, 0.0, mine), colonyOf(vi, U.colonies) == 1u);
  o.taken = vec4f(select(0.0, PICKUP_AMOUNT, (a.state & 2u) != 0u), 0.0, 0.0, 0.0);
  return o;
}

struct FOut { @location(0) scent: vec4f, @location(1) taken: vec4f };

@fragment
fn fs(v: VOut) -> FOut {
  return FOut(v.scent, v.taken);
}
