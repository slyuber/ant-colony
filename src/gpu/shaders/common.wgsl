// Shared by every shader. Layouts mirror gpu/uniforms.ts and sim/ants.ts.
struct SimUniforms {
  world: vec2f,
  nest: vec2f,        // colony A
  nestRadius: f32,
  frame: f32,
  antCount: f32,      // ant slots walked this frame (alive or not)
  speed: f32,
  wobble: f32,
  evaporation: f32,
  diffusion: f32,
  palette: f32,
  bloom: f32,
  paused: f32,
  colonies: f32,      // 1 or 2
  fight: f32,         // 1 = ants die where the colonies meet
  nestB: vec2f,       // colony B
  popA: f32,
  popB: f32,
  rainX: f32,         // centre of the shower band, world pixels
  rainW: f32,         // half-width of the band; 0 = dry
  pad1: f32,
  pad2: f32,
};

struct Seg { ab: vec4f, rt: vec4f };            // a.xy, b.xy | radius, tool
struct Segments { head: vec4f, head2: vec4f, items: array<Seg, 8> };  // head.x = count

// state bit0 = carrying food, bit1 = picked food up this frame, bit2 = alive
struct Ant { pos: vec2f, heading: f32, timer: f32, state: u32, seed: u32 };

const TAU = 6.2831853;
const PI = 3.14159265;
const ALIVE = 4u;
const DEPOSIT_STRENGTH = 0.2;
const DEPOSIT_FADE_FRAMES = 600.0;
const HOME_FADE_FRAMES = 500.0;
const PICKUP_AMOUNT = 0.02;
const FOOD_TRIPS = 16.0;
const SCENT_MAX = 4.0;

const TOOL_FOOD = 0.0;
const TOOL_WALL = 1.0;
const TOOL_ERASE = 2.0;
const TOOL_SCATTER = 3.0;

fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

fn rand01(seed: ptr<function, u32>) -> f32 {
  *seed = pcg(*seed);
  return f32(*seed >> 8u) / 16777216.0;
}

// With two colonies, even ant slots are colony A and odd slots colony B.
fn colonyOf(i: u32, colonies: f32) -> u32 {
  if (colonies < 1.5) { return 0u; }
  return i & 1u;
}

// An ant's place in its own colony's queue: it is alive while this is below the colony's population.
fn rankOf(i: u32, colonies: f32) -> u32 {
  if (colonies < 1.5) { return i; }
  return i >> 1u;
}

// Distance from p to the centre line of a brush capsule.
fn segDist(p: vec2f, s: Seg) -> f32 {
  let a = s.ab.xy;
  let ab = s.ab.zw - a;
  let d = dot(ab, ab);
  var t = 0.0;
  if (d > 0.0001) { t = clamp(dot(p - a, ab) / d, 0.0, 1.0); }
  return distance(p, a + ab * t);
}
