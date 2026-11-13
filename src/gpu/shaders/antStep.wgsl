@group(0) @binding(0) var<uniform> U: SimUniforms;
@group(0) @binding(1) var<uniform> S: Segments;
@group(0) @binding(2) var<storage, read_write> ants: array<Ant>;
@group(0) @binding(3) var scentTex: texture_2d<f32>;   // r,g = colony A home, food | b,a = colony B
@group(0) @binding(4) var worldTex: texture_2d<f32>;
@group(0) @binding(5) var crowdTex: texture_2d<f32>;   // last picture's head count: r,g = colony A | b,a = colony B
// Running totals the page reads twice a second: food delivered by A, by B, deaths of A, of B.
@group(0) @binding(6) var<storage, read_write> tally: array<atomic<u32>, 4>;

const SENSOR_ANGLE = 0.6;
const SENSOR_DIST = 9.0;
const TURN = 0.35;
const HOME_PULL = 0.3;
const SCOUT_ONE_IN = 12u;
const FIGHT_RATE = 0.10;

fn inWorld(p: vec2f) -> bool {
  return p.x >= 0.0 && p.y >= 0.0 && p.x < U.world.x && p.y < U.world.y;
}

// What one feeler reports: -1 blocked, 1000 the goal itself, otherwise the scent being followed.
// Carriers also feel a pull toward the nest (real ants keep a rough sense of where home is).
fn sense(origin: vec2f, angle: f32, carrying: bool, scout: bool, col: u32, nest: vec2f) -> f32 {
  let dir = vec2f(cos(angle), sin(angle));
  let p = origin + dir * SENSOR_DIST;
  if (!inWorld(p)) { return -1.0; }
  let c = vec2i(p);
  let w = textureLoad(worldTex, c, 0);
  if (w.r > 0.5) { return -1.0; }
  let s = textureLoad(scentTex, c, 0);
  if (carrying) {
    if (distance(p, nest) < U.nestRadius) { return 1000.0; }
    let home = nest - origin;
    return select(s.r, s.b, col == 1u) + HOME_PULL * dot(dir, home / max(length(home), 0.001));
  }
  if (w.g > 0.0) { return 1000.0; }
  // Scouts ignore the trails everyone else follows, so new food far from any highway still gets found.
  if (scout) { return 0.0; }
  return select(s.g, s.a, col == 1u);
}

// A new (or reborn) ant: somewhere inside its own nest, facing anywhere, carrying nothing.
fn spawn(nest: vec2f, seed: ptr<function, u32>) -> Ant {
  var a: Ant;
  let angle = rand01(seed) * TAU;
  let r = sqrt(rand01(seed)) * U.nestRadius * 0.9;
  a.pos = nest + vec2f(cos(angle), sin(angle)) * r;
  a.heading = rand01(seed) * TAU;
  a.timer = 0.0;
  a.state = ALIVE;
  a.seed = *seed;
  return a;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= u32(U.antCount)) { return; }
  var a = ants[i];
  var seed = a.seed;
  let col = colonyOf(i, U.colonies);
  let nest = select(U.nest, U.nestB, col == 1u);
  let wanted = f32(rankOf(i, U.colonies)) < select(U.popA, U.popB, col == 1u);
  let alive = (a.state & ALIVE) != 0u;
  if (!wanted) {
    // The colony shrank below this ant's place in the queue.
    if (alive) { a.state = 0u; ants[i] = a; }
    return;
  }
  if (!alive) {
    ants[i] = spawn(nest, &seed);
    return;
  }

  // Fight: an ant standing where enemies stood last picture may die. The more outnumbered, the likelier.
  if (U.fight > 0.5 && U.colonies > 1.5) {
    let cw = textureLoad(crowdTex, vec2i(a.pos), 0);
    let mine = max(select(cw.r + cw.g, cw.b + cw.a, col == 1u), 1.0);
    let foes = select(cw.b + cw.a, cw.r + cw.g, col == 1u);
    if (foes > 0.0 && distance(a.pos, nest) > U.nestRadius && rand01(&seed) < FIGHT_RATE * foes / (foes + mine)) {
      atomicAdd(&tally[2u + col], 1u);
      ants[i] = spawn(nest, &seed);
      return;
    }
  }

  let carrying = (a.state & 1u) != 0u;
  var state = a.state & 1u;
  a.timer += 1.0;

  let h = a.heading;
  let scout = (rankOf(i, U.colonies) % SCOUT_ONE_IN) == 0u;
  let fC = sense(a.pos, h, carrying, scout, col, nest);
  let fL = sense(a.pos, h - SENSOR_ANGLE, carrying, scout, col, nest);
  let fR = sense(a.pos, h + SENSOR_ANGLE, carrying, scout, col, nest);
  var turn = 0.0;
  if (fC >= fL && fC >= fR) { turn = 0.0; }
  else if (fL > fR) { turn = -TURN; }
  else if (fR > fL) { turn = TURN; }
  else { turn = (rand01(&seed) - 0.5) * 2.0 * TURN; }
  a.heading = h + turn + U.wobble * (rand01(&seed) - 0.5);

  let n = u32(S.head.x);
  for (var k = 0u; k < n; k++) {
    let sg = S.items[k];
    if (sg.rt.y == TOOL_SCATTER && segDist(a.pos, sg) < sg.rt.x) {
      let mid = (sg.ab.xy + sg.ab.zw) * 0.5;
      let away = a.pos - mid;
      a.heading = atan2(away.y, away.x) + (rand01(&seed) - 0.5) * 0.8;
    }
  }

  let np = a.pos + vec2f(cos(a.heading), sin(a.heading)) * U.speed;
  let hereWall = textureLoad(worldTex, vec2i(a.pos), 0).r > 0.5;
  var blocked = !inWorld(np);
  if (!blocked && !hereWall) { blocked = textureLoad(worldTex, vec2i(np), 0).r > 0.5; }
  if (blocked) {
    a.heading = rand01(&seed) * TAU;
  } else {
    a.pos = np;
  }

  let w = textureLoad(worldTex, vec2i(a.pos), 0);
  if (!carrying && w.g > 0.0) {
    // Every ant that finds food carries some home, but only one trip in FOOD_TRIPS uses food up.
    // (The food texture cannot store steps much finer than PICKUP_AMOUNT.)
    state = select(1u, 3u, rand01(&seed) < 1.0 / FOOD_TRIPS);
    a.timer = 0.0;
    a.heading += PI;
  } else if (distance(a.pos, nest) < U.nestRadius) {
    if (carrying) {
      state = 0u;
      a.heading += PI;
      atomicAdd(&tally[col], 1u);
    }
    a.timer = 0.0;
  }

  a.heading = fract(a.heading / TAU) * TAU;
  a.state = state | ALIVE;
  a.seed = seed;
  ants[i] = a;
}
