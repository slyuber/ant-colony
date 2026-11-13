(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e){let t=!1;return{report(n,r=!1){if(t)return;t=!0;let i=n instanceof Error&&n.message?n.message:typeof n==`string`&&n?n:`unknown error`;e(r?i:`The graphics card reported a problem: ${i}. Reload the page.`)},get failed(){return t}}}function t(e){if(!e)return`unknown adapter`;let t=[e.vendor,e.architecture,e.device,e.description].filter(Boolean);return t.length?t.join(` | `):`unknown adapter`}var n=`This browser has no WebGPU. Use a current Chrome or Edge.`;async function r(e){if(!(`gpu`in navigator)||!navigator.gpu)throw Error(n);let r=await navigator.gpu.requestAdapter();if(!r)throw Error(n);let i=r.features.has(`timestamp-query`),a=await r.requestDevice({requiredFeatures:i?[`timestamp-query`]:[]}),o=e.getContext(`webgpu`);if(!o)throw Error(n);let s=navigator.gpu.getPreferredCanvasFormat();return o.configure({device:a,format:s,alphaMode:`opaque`}),{device:a,context:o,format:s,hasTimestamps:i,adapterInfo:t(r.info)}}var i=function(e){return e[e.Food=0]=`Food`,e[e.Wall=1]=`Wall`,e[e.Erase=2]=`Erase`,e[e.Scatter=3]=`Scatter`,e}({}),a=class{items=[];push(e){this.items.push(e)}take(){return this.items.splice(0,8)}clear(){this.items.length=0}get pending(){return this.items.length}};function o(e,t,n,r,i){let a=(e-n.left)*(r/n.width),o=(t-n.top)*(i/n.height);return[Math.min(r-1,Math.max(0,a)),Math.min(i-1,Math.max(0,o))]}var s=1e6;function c(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function l(e,t,n,r,i){let a=new ArrayBuffer(s*24),o=new Float32Array(a),l=new Uint32Array(a),u=c(i),d=Math.PI*2;for(let e=0;e<s;e++){let i=e*6,a=u()*d,s=Math.sqrt(u())*r*.999;o[i]=t+Math.cos(a)*s,o[i+1]=n+Math.sin(a)*s,o[i+2]=Math.min(u()*d,6.2831845),o[i+3]=0,l[i+4]=0,l[i+5]=u()*4294967296>>>0}return a}var u=.06,d=.004,f=.35,p=.02,m=.75,h=e=>Math.min(e*m,s/2),g=e=>Number.isFinite(e)&&e>0?e:0;function _(e,t){if(t<2)return[Math.min(e,s),0];let n=Math.min(e*f,s/2);return[n,n]}function v(e,t,n,r,i,a){if(a<2)return[Math.min(i,s),0];let o=i*p,c=e.map((e,a)=>{let s=e+g(t[a])*u-g(n[a])-e*d*r;return Math.min(h(i),Math.max(o,s))}),l=c[0]+c[1];return l>i&&(c[0]*=i/l,c[1]*=i/l),c}function y(e,t,n,r){if(r<2)return[Math.min(n,s),0];let i=n/Math.max(1,t);return[Math.min(h(n),e[0]*i),Math.min(h(n),e[1]*i)]}function b(e,t,n){let r=Math.floor(e/2),i=Math.floor(t/2);return n<2?[[r,i],[r,i]]:e>=t?[[Math.floor(e*.3),i],[Math.floor(e*.7),i]]:[[r,Math.floor(t*.3)],[r,Math.floor(t*.7)]]}var x=5400,S=2400,C=360;function w(e,t,n){if(!n)return{x:0,w:0};let r=Math.max(80,t*.09),i=t/C,a=((e-S)%x+x)%x;return e<S||a*i>t+2*r+i?{x:0,w:0}:{x:-r+a*i,w:r}}function ee(e){return e>0?Math.round(1800*(150/1800)**Math.min(1,e)):0}var T=5;function E(e,t,n,r,a){let o=c(a*7919+13),s=Math.min(1,Math.min(e,t)/900),l=8*s,u=Math.min(110,t*.12),d=o()*Math.PI*2,f=[];for(let a=0;a<T;a++){let c=null;for(let p=0;p<40&&!c;p++){let m=Math.max(6,(18+26*o())*s*(p<20?1:.6)),h=d+(a+(o()-.5)*.5)/T*Math.PI*2,g=Math.cos(h),_=Math.sin(h),v=g>0?e-l-m-n:n-l-m,y=_>0?t-u-m-r:r-l-m,b=Math.min(v/Math.max(Math.abs(g),1e-6),y/Math.max(Math.abs(_),1e-6)),x=74+m;if(b<x&&p<39)continue;let S=b<x?Math.max(0,b):x+(b-x)*(.3+.7*o()),C=n+g*S,w=r+_*S;(f.every(e=>Math.hypot(e.ax-C,e.ay-w)-e.radius-m>24)||p===39)&&(c={ax:C,ay:w,bx:C,by:w,radius:m,tool:i.Food})}f.push(c)}return f}function D(e,t,n,r,a){let o=c(r*104729+71),s=Math.min(1,Math.min(e,t)/900),l=8*s,u=Math.min(110,t*.12),d=[];for(let r=0;r<a;r++){let r=null;for(let a=0;a<200&&!r;a++){let c=a<80?1:a<160?.6:.3,f=Math.max(5,(18+26*o())*s*c),p=l+f+o()*Math.max(0,e-2*(l+f)),m=l+f+o()*Math.max(0,t-u-l-2*f),h=n.every(([e,t])=>Math.hypot(p-e,m-t)-f>=74*s*c),g=d.every(e=>Math.hypot(e.ax-p,e.ay-m)-e.radius-f>24*c);(h&&g||a===199)&&(r={ax:p,ay:m,bx:p,by:m,radius:f,tool:i.Food})}d.push(r)}return d}function te(e,t,n,r,a){let o=c(r*31337+a*977+5),s=Math.min(1,Math.min(e,t)/900),l=Math.min(110,t*.12),u=null;for(let r=0;r<40;r++){let r=Math.max(5,(10+8*o())*s),a=r+o()*Math.max(0,e-2*r),c=r+o()*Math.max(0,t-l-2*r);if(u={ax:a,ay:c,bx:a,by:c,radius:r,tool:i.Food},n.every(([e,t])=>Math.hypot(a-e,c-t)>90*s+r))break}return u}var ne=`// Counts ants per pixel into a "crowd" texture: r,g = colony A searching, carrying | b,a = colony B.
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
`,re=`@group(0) @binding(0) var<uniform> U: SimUniforms;
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
`,ie=`// Shared by every shader. Layouts mirror gpu/uniforms.ts and sim/ants.ts.
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
`,ae=`@group(0) @binding(0) var<uniform> U: SimUniforms;
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
`,oe=`@group(0) @binding(0) var<uniform> U: SimUniforms;
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
`,se=`// Glow: keep only the bright parts at reduced size, then blur them. Standalone (no common prefix).
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
`,ce=`// Turns the simulation textures into a picture, in linear light with values above 1 allowed.
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
`,le=`// Last pass: picture + glow, squeezed into screen range. Standalone (no common prefix).
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
`;function ue(e,t){return Float32Array.of(t.worldW,t.worldH,t.nests[0][0],t.nests[0][1],t.nestRadius,t.frame,t.slots,e.speed,e.wobble,e.evaporation,e.diffusion,e.palette,e.bloom,+!!t.paused,e.colonies,e.fight,t.nests[1][0],t.nests[1][1],t.pops[0],t.pops[1],t.rainX,t.rainW,0,0)}function de(e){if(e.length>8)throw Error(`at most 8 segments per frame`);let t=new Float32Array(72);return t[0]=e.length,e.forEach((e,n)=>t.set([e.ax,e.ay,e.bx,e.by,e.radius,e.tool],8+n*8)),t}var O=`rgba16float`,fe={color:{srcFactor:`one`,dstFactor:`one`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one`,operation:`add`}};function k(e,t,n,r,i=1){let{device:a,context:o,format:c}=e,u=1,d=b(t,n,1),f=[0,0],p=0,m=0,h=r,g=(e,t)=>a.createShaderModule({code:`${ie}\n${e}`,label:t}),x=e=>a.createTexture({label:e,size:[t,n],format:O,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}),S=[x(`scent0`),x(`scent1`)],C=[x(`world0`),x(`world1`)],T=x(`taken`),k=S.map(e=>e.createView()),A=C.map(e=>e.createView()),j=T.createView(),pe=x(`crowd`),M=pe.createView(),N=a.createBuffer({label:`ants`,size:s*24,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),P=a.createBuffer({label:`sim`,size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),F=a.createBuffer({label:`segments`,size:288,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),I=a.createBuffer({label:`tally`,size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),L=a.createBuffer({label:`tallyRead`,size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),R=!1,z=[0,0,0,0],B=0,V=0,me=a.createComputePipeline({label:`antStep`,layout:`auto`,compute:{module:g(re,`antStep`),entryPoint:`main`}}),H=g(ae,`deposit`),U=a.createRenderPipeline({label:`deposit`,layout:`auto`,vertex:{module:H,entryPoint:`vs`},fragment:{module:H,entryPoint:`fs`,targets:[{format:O,blend:fe},{format:O,blend:fe}]},primitive:{topology:`point-list`}}),W=g(oe,`field`),he=a.createRenderPipeline({label:`field`,layout:`auto`,vertex:{module:W,entryPoint:`vs`},fragment:{module:W,entryPoint:`fs`,targets:[{format:O},{format:O}]}}),G=g(ce,`scene`),ge=a.createRenderPipeline({label:`scene`,layout:`auto`,vertex:{module:G,entryPoint:`vs`},fragment:{module:G,entryPoint:`fs`,targets:[{format:O}]}}),_e=g(ne,`antDraw`),K=a.createRenderPipeline({label:`antDraw`,layout:`auto`,vertex:{module:_e,entryPoint:`vs`},fragment:{module:_e,entryPoint:`fs`,targets:[{format:O,blend:fe}]},primitive:{topology:`point-list`}}),q=e=>({buffer:e}),ve=x(`hdr`),ye=ve.createView(),be=a.createSampler({magFilter:`linear`,minFilter:`linear`}),J=a.createShaderModule({code:se,label:`bloom`}),xe=a.createRenderPipeline({label:`bloomDown`,layout:`auto`,vertex:{module:J,entryPoint:`vs`},fragment:{module:J,entryPoint:`fsDown`,targets:[{format:O}]}}),Se=a.createRenderPipeline({label:`bloomBlur`,layout:`auto`,vertex:{module:J,entryPoint:`vs`},fragment:{module:J,entryPoint:`fsBlur`,targets:[{format:O}]}}),Ce=a.createShaderModule({code:le,label:`tonemap`}),we=a.createRenderPipeline({label:`tonemap`,layout:`auto`,vertex:{module:Ce,entryPoint:`vs`},fragment:{module:Ce,entryPoint:`fs`,targets:[{format:c}]}}),Te=[ve],Ee=[],De=e=>{let t=a.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return a.queue.writeBuffer(t,0,Float32Array.from(e)),Ee.push(t),t};function Oe(e,r){let i=Math.max(1,Math.floor(t/e)),o=Math.max(1,Math.floor(n/e)),s=[0,1].map(t=>a.createTexture({label:`bloom${e}-${t}`,size:[i,o],format:O,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING}));Te.push(...s);let c=s.map(e=>e.createView());return{views:c,down:a.createBindGroup({layout:xe.getBindGroupLayout(0),entries:[{binding:0,resource:be},{binding:1,resource:ye}]}),blurs:[[1/i,0],[0,1/o],[2/i,0],[0,2/o]].map((e,t)=>({target:1-t%2,bg:a.createBindGroup({layout:Se.getBindGroupLayout(0),entries:[{binding:0,resource:be},{binding:1,resource:c[t%2]},{binding:2,resource:q(De([e[0],e[1],0,0]))}]})})),present:a.createBindGroup({layout:we.getBindGroupLayout(0),entries:[{binding:0,resource:be},{binding:1,resource:ye},{binding:2,resource:c[0]},{binding:3,resource:q(De([r,0,0,0]))}]})}}let ke=[Oe(4,0),Oe(4,.55),Oe(2,.7)],Ae=[0,1].map(e=>a.createBindGroup({layout:me.getBindGroupLayout(0),entries:[{binding:0,resource:q(P)},{binding:1,resource:q(F)},{binding:2,resource:q(N)},{binding:3,resource:k[e]},{binding:4,resource:A[e]},{binding:5,resource:M},{binding:6,resource:q(I)}]})),je=a.createBindGroup({layout:U.getBindGroupLayout(0),entries:[{binding:0,resource:q(P)},{binding:1,resource:q(N)}]}),Me=[0,1].map(e=>a.createBindGroup({layout:he.getBindGroupLayout(0),entries:[{binding:0,resource:q(P)},{binding:1,resource:q(F)},{binding:2,resource:k[e]},{binding:3,resource:A[e]},{binding:4,resource:j}]})),Ne=[0,1].map(e=>a.createBindGroup({layout:ge.getBindGroupLayout(0),entries:[{binding:0,resource:q(P)},{binding:1,resource:k[e]},{binding:2,resource:A[e]},{binding:3,resource:M}]})),Pe=a.createBindGroup({layout:K.getBindGroupLayout(0),entries:[{binding:0,resource:q(P)},{binding:1,resource:q(N)}]}),Y=e.hasTimestamps?a.createQuerySet({type:`timestamp`,count:2}):null,Fe=a.createBuffer({size:16,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),X=a.createBuffer({size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),Ie=!1,Le=0,Re=0,ze=!1,Be=()=>Y?{querySet:Y,beginningOfPassWriteIndex:0}:void 0,Ve=()=>Y?{querySet:Y,endOfPassWriteIndex:1}:void 0,Z=0,Q=0,He=[],Ue=i,We=i,Ge=0,$={r:0,g:0,b:0,a:0};function Ke(){let e=Ue++;We=e,u=h.colonies>=2?2:1,d=b(t,n,u),p=h.antCount,f=_(p,u),m=0,Ge=0,V++,z=[0,0,0,0],B=0,a.queue.writeBuffer(I,0,new Uint32Array(4)),a.queue.writeBuffer(N,0,l(s,d[0][0],d[0][1],24,e));let r=a.createCommandEncoder();for(let e of[...k,...A,j,M])r.beginRenderPass({colorAttachments:[{view:e,loadOp:`clear`,storeOp:`store`,clearValue:$}]}).end();a.queue.submit([r.finish()]),He=u===2?D(t,n,d,e,7):E(t,n,d[0][0],d[0][1],e),Q=0}function qe(e){if(u<2||R)return null;e.copyBufferToBuffer(I,0,L,0,16);let t=V,n=Q-B;return B=Q,()=>{R=!0,L.mapAsync(GPUMapMode.READ).then(()=>{if(ze)return;let e=Array.from(new Uint32Array(L.getMappedRange()));if(L.unmap(),R=!1,t!==V)return;let r=e.map((e,t)=>e-z[t]>>>0);z=e,f=v(f,[r[0],r[1]],[r[2],r[3]],n/60,p,u)}).catch(()=>{R=!1})}}function Je(e,r,i){h=e,(e.colonies>=2?2:1)!==u&&Ke(),e.antCount!==p&&(f=y(f,p,e.antCount,u),p=e.antCount);let c=[...He,...r],l=ee(e.foodGrowth);!i&&l>0&&Q>0&&Q%l===0&&c.push(te(t,n,u===2?d:[d[0]],We,Ge++));let g=c.slice(0,8);He=c.slice(8);let _=u===2?2*Math.ceil(Math.max(f[0],f[1])):Math.ceil(f[0]);m=Math.min(s,Math.max(m,_));let v=m,b=w(Q,t,e.rain>0),x=ue(e,{worldW:t,worldH:n,frame:Q,nests:d,nestRadius:24,slots:v,pops:f,paused:i,rainX:b.x,rainW:b.w});a.queue.writeBuffer(P,0,x.buffer),a.queue.writeBuffer(F,0,de(g).buffer);let S=a.createCommandEncoder();if(!i){let e=S.beginComputePass({timestampWrites:Be()});e.setPipeline(me),e.setBindGroup(0,Ae[Z]),e.dispatchWorkgroups(Math.ceil(v/256)),e.end()}{let e=S.beginRenderPass({colorAttachments:[{view:k[Z],loadOp:`load`,storeOp:`store`},{view:j,loadOp:`clear`,storeOp:`store`,clearValue:$}],timestampWrites:i?Be():void 0});i||(e.setPipeline(U),e.setBindGroup(0,je),e.draw(v)),e.end()}{let e=1-Z,t=S.beginRenderPass({colorAttachments:[{view:k[e],loadOp:`clear`,storeOp:`store`,clearValue:$},{view:A[e],loadOp:`clear`,storeOp:`store`,clearValue:$}]});t.setPipeline(he),t.setBindGroup(0,Me[Z]),t.draw(3),t.end(),Z=e}{let e=S.beginRenderPass({colorAttachments:[{view:M,loadOp:`clear`,storeOp:`store`,clearValue:$}]});e.setPipeline(K),e.setBindGroup(0,Pe),e.draw(v),e.end();let t=S.beginRenderPass({colorAttachments:[{view:ye,loadOp:`clear`,storeOp:`store`,clearValue:$}]});t.setPipeline(ge),t.setBindGroup(0,Ne[Z]),t.draw(3),t.end()}let C=Math.min(2,Math.max(0,Math.round(e.bloom))),T=ke[C];if(C>0){let e=(e,t,n)=>{let r=S.beginRenderPass({colorAttachments:[{view:e,loadOp:`clear`,storeOp:`store`,clearValue:$}]});r.setPipeline(t),r.setBindGroup(0,n),r.draw(3),r.end()};e(T.views[0],xe,T.down);for(let t of T.blurs)e(T.views[t.target],Se,t.bg)}{let e=S.beginRenderPass({colorAttachments:[{view:o.getCurrentTexture().createView(),loadOp:`clear`,storeOp:`store`,clearValue:$}],timestampWrites:Ve()});e.setPipeline(we),e.setBindGroup(0,T.present),e.draw(3),e.end()}let E=Y!==null&&!Ie&&Re%10==0;Y&&S.resolveQuerySet(Y,0,2,Fe,0),E&&S.copyBufferToBuffer(Fe,0,X,0,16);let D=!i&&Re%30==15?qe(S):null;a.queue.submit([S.finish()]),D?.(),E&&(Ie=!0,X.mapAsync(GPUMapMode.READ).then(()=>{if(ze)return;let e=new BigInt64Array(X.getMappedRange()),t=Number(e[1]-e[0])/1e6;t>0&&t<1e3&&(Le=Le===0?t:Le*.8+t*.2),X.unmap(),Ie=!1}).catch(()=>{Ie=!1})),Re++,i||Q++}function Ye(){ze=!0;for(let e of[...S,...C,T,pe,...Te])e.destroy();for(let e of Ee)e.destroy();for(let e of[N,P,F,Fe,X,I,L])e.destroy();Y?.destroy()}return Ke(),{frame:Je,reset:Ke,destroy:Ye,get gpuMs(){return Le},get pops(){return[f[0],f[1]]},worldW:t,worldH:n}}var A={antCount:25e4,evaporation:.985,diffusion:.25,speed:1.5,wobble:.25,palette:0,bloom:2,brushRadius:24,colonies:2,fight:0,rain:1,foodGrowth:.3},j={antCount:[5e4,1e6],evaporation:[.9,.999],diffusion:[0,1],speed:[.5,4],wobble:[0,1],palette:[0,2],bloom:[0,2],brushRadius:[4,120],colonies:[1,2],fight:[0,1],rain:[0,1],foodGrowth:[0,1]},pe=new Set([`antCount`,`palette`,`bloom`,`colonies`,`fight`,`rain`]);function M(e){let t={...A};for(let n of Object.keys(A)){let r=e[n];if(r==null||typeof r==`string`&&r.trim()===``)continue;let i=typeof r==`number`?r:Number(r);if(Number.isNaN(i))continue;let[a,o]=j[n];i=Math.min(o,Math.max(a,i)),t[n]=pe.has(n)?Math.floor(i):i}return t}function N(e,t,n,r,a){let s=document.createElement(`div`);s.className=`ring`,s.hidden=!0,document.body.appendChild(s);let c=!1,l=[0,0],u=[0,0],d=t=>{let[n,i]=r();return o(t.clientX,t.clientY,e.getBoundingClientRect(),n,i)},f=(e,r)=>{n.push({ax:e[0],ay:e[1],bx:r[0],by:r[1],radius:t.params.brushRadius,tool:t.tool})},p=()=>{let n=e.getBoundingClientRect(),i=2*t.params.brushRadius*(n.width/r()[0]);s.style.width=s.style.height=`${i}px`,s.style.transform=`translate(${u[0]-i/2}px, ${u[1]-i/2}px)`,s.dataset.tool=String(t.tool)};e.addEventListener(`pointerdown`,n=>{n.button===0&&(e.setPointerCapture(n.pointerId),c=!0,u=[n.clientX,n.clientY],s.hidden=!1,p(),l=d(n),f(l,l),t.hasPainted||(t.hasPainted=!0,a.changed()))}),e.addEventListener(`pointermove`,e=>{if(u=[e.clientX,e.clientY],s.hidden=!1,p(),!c)return;let t=d(e);f(l,t),l=t});let m=t=>{c=!1;let n=e.getBoundingClientRect();(t.clientX<n.left||t.clientX>=n.right||t.clientY<n.top||t.clientY>=n.bottom)&&(s.hidden=!0),t.pointerType!==`mouse`&&(s.hidden=!0)};return e.addEventListener(`pointerup`,m),e.addEventListener(`pointercancel`,m),e.addEventListener(`pointerleave`,()=>{c||(s.hidden=!0)}),e.addEventListener(`wheel`,e=>{if(e.preventDefault(),e.deltaY===0)return;let[n,r]=j.brushRadius,i=t.params.brushRadius*(e.deltaY<0?1.12:1/1.12);t.params.brushRadius=Math.min(r,Math.max(n,i)),p(),a.changed()},{passive:!1}),window.addEventListener(`keydown`,e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;let n=e.target;if(n instanceof HTMLInputElement&&n.type!==`range`)return;let r=e.key.toLowerCase();if(r===` `)e.preventDefault(),e.repeat||(t.paused=!t.paused);else if(r===`r`)e.repeat||a.reset();else if(r===`h`)t.uiHidden=!t.uiHidden;else if(r===`f`)t.meterOn=!t.meterOn;else if(r>=`1`&&r<=`4`)t.tool=Number(r)-1,p();else return;a.changed()}),{tick(){c&&t.tool===i.Scatter&&n.pending===0&&f(l,l)},syncRing:p}}function P(e){if(e.bloom>0)return{...e,bloom:e.bloom-1};let t=j.antCount[0];return e.antCount<=t?null:{...e,antCount:Math.max(t,Math.floor(e.antCount*.7/1e4)*1e4)}}function F(e,t,n){if(!t)return e;let r={...e};return n.has(`antCount`)||(r.antCount=1e5),n.has(`bloom`)||(r.bloom=1),n.has(`brushRadius`)||(r.brushRadius=34),r}function I(e,t){let n=document.createElement(`dl`);n.className=`meter`,n.title=`Smoothness. 60 pictures per second is the most this screen can show. F hides this.`;let r=e=>{let t=document.createElement(`dt`);t.textContent=e;let r=document.createElement(`dd`);return r.textContent=`0`,n.append(r,t),r},i=r(`pictures / s`),a=r(`ms per picture`),o=r(`ms graphics card`);return e.append(n),{sync(){n.hidden=!t.meterOn},update(e,t,r){n.hidden||(i.textContent=e.toFixed(0),a.textContent=t.toFixed(1),o.textContent=r<0?`n/a`:r.toFixed(1))}}}var L=[`Ember`,`Tide`,`Bone`],R=[{key:`colonies`,label:`Colonies`,choices:[`One`,`Two`]},{key:`fight`,label:`Rivals`,choices:[`Race`,`Fight`],when:e=>e.colonies>1},{key:`antCount`,label:`Ants`,step:1e4,show:e=>e.toLocaleString(`en-US`)},{key:`foodGrowth`,label:`Food growth`,step:.05,show:e=>e<=0?`Off`:e<.34?`Slow`:e<.67?`Steady`:`Fast`},{key:`rain`,label:`Rain`,choices:[`Off`,`On`]},{key:`speed`,label:`Ant speed`,step:.1,show:e=>e.toFixed(1)},{key:`wobble`,label:`Wander`,step:.01,show:e=>e.toFixed(2)},{key:`evaporation`,label:`Trail life`,step:.001,show:e=>e.toFixed(3)},{key:`diffusion`,label:`Trail spread`,step:.01,show:e=>e.toFixed(2)},{key:`brushRadius`,label:`Brush size`,step:1,show:e=>String(Math.round(e))},{key:`bloom`,label:`Glow`,choices:[`Off`,`Soft`,`Full`]}];function z(e,t,n){let r=document.createElement(`section`);r.id=`panel`,r.className=`panel`,r.setAttribute(`aria-label`,`Settings`);let i=(e,r)=>{t.params=M({...t.params,[e]:r}),n.changed()},a=[];for(let e of R){let n=document.createElement(`span`);n.className=`row-name`,n.textContent=e.label;let o=j[e.key][0];if(e.choices){let s=document.createElement(`div`);s.className=`row row-choice`,s.setAttribute(`role`,`group`),s.setAttribute(`aria-label`,e.label);let c=document.createElement(`div`);c.className=`seg`;let l=e.choices.map((t,n)=>{let r=document.createElement(`button`);return r.type=`button`,r.className=`seg-btn`,r.textContent=t,r.addEventListener(`click`,()=>i(e.key,o+n)),c.append(r),r});s.append(n,c),r.append(s),a.push(()=>{let n=!e.when||e.when(t.params);s.classList.toggle(`off`,!n),l.forEach((r,i)=>{r.disabled=!n,r.setAttribute(`aria-pressed`,String(t.params[e.key]===o+i))})});continue}let s=document.createElement(`label`);s.className=`row`;let c=document.createElement(`output`);c.className=`row-value`;let l=document.createElement(`input`);l.type=`range`,l.min=String(o),l.max=String(j[e.key][1]),l.step=String(e.step),l.addEventListener(`input`,()=>i(e.key,l.value)),s.append(n,c,l),r.append(s),a.push(()=>{let n=t.params[e.key];Number(l.value)!==n&&(l.value=String(n)),c.textContent=e.show(n)})}let o=document.createElement(`div`);o.className=`row`;let s=document.createElement(`span`);s.className=`row-name`,s.textContent=`Colours`;let c=document.createElement(`output`);c.className=`row-value`;let l=document.createElement(`div`);l.className=`swatches`;let u=L.map((e,t)=>{let n=document.createElement(`button`);return n.type=`button`,n.className=`swatch swatch-${t}`,n.title=e,n.setAttribute(`aria-label`,`${e} colours`),n.addEventListener(`click`,()=>i(`palette`,t)),l.append(n),n});return o.append(s,c,l),r.append(o),e.append(r),{sync(){r.hidden=!t.panelOpen;for(let e of a)e();c.textContent=L[t.params.palette],u.forEach((e,n)=>e.setAttribute(`aria-pressed`,String(n===t.params.palette)))}}}var B=e=>e>=1e3?`${Math.round(e/1e3)}k`:String(Math.round(e));function V(e,t){let n=document.createElement(`div`);n.className=`share`,n.setAttribute(`role`,`img`);let r=document.createElement(`span`);r.className=`share-count share-a`;let i=document.createElement(`span`);i.className=`share-bar`;let a=document.createElement(`span`);a.className=`share-fill`,i.append(a);let o=document.createElement(`span`);return o.className=`share-count share-b`,n.append(r,i,o),e.append(n),{sync(){n.hidden=t.params.colonies<2},update(e){if(n.hidden)return;let t=Math.max(1,e[0]+e[1]);a.style.width=`${(e[0]/t*100).toFixed(1)}%`,r.textContent=B(e[0]),o.textContent=B(e[1]),n.setAttribute(`aria-label`,`Left colony ${B(e[0])} ants, right colony ${B(e[1])} ants`)}}}var me={[i.Food]:`Food`,[i.Wall]:`Wall`,[i.Erase]:`Erase`,[i.Scatter]:`Scatter`},H={[i.Food]:`Drag to drop food`,[i.Wall]:`Drag to draw a wall`,[i.Erase]:`Drag to remove walls and food`,[i.Scatter]:`Hold to push ants away`},U=(e,t,n)=>{let r=document.createElement(e);return t&&(r.className=t),n!==void 0&&(r.textContent=n),r};function W(e,t,n){let r=U(`button`,`btn`);return r.type=`button`,r.title=`${n} (${t})`,r.append(U(`span`,`btn-label`,e),U(`kbd`,void 0,t)),r}function he(e,t,n){let r=U(`div`,`dock`),a=U(`p`,`hint`),o=U(`div`,`strip`);o.setAttribute(`role`,`toolbar`),o.setAttribute(`aria-label`,`Tools`);let s=[i.Food,i.Wall,i.Erase,i.Scatter].map(e=>{let r=W(me[e],String(e+1),H[e]);return r.classList.add(`tool`),r.dataset.tool=String(e),r.addEventListener(`click`,()=>{t.tool=e,n.changed()}),r}),c=W(`Pause`,`Space`,`Pause or resume the colony`);c.addEventListener(`click`,()=>{t.paused=!t.paused,n.changed()});let l=W(`Reset`,`R`,`Start again with a fresh colony`);l.addEventListener(`click`,()=>n.reset());let u=U(`button`,`btn`,`Settings`);return u.type=`button`,u.setAttribute(`aria-controls`,`panel`),u.addEventListener(`click`,()=>{t.panelOpen=!t.panelOpen,n.changed()}),o.append(...s,U(`span`,`sep`),c,l,U(`span`,`sep`),u),r.append(a,o),e.append(r),{sync(){for(let e of s)e.setAttribute(`aria-pressed`,String(Number(e.dataset.tool)===t.tool));c.querySelector(`.btn-label`).textContent=t.paused?`Resume`:`Pause`,c.setAttribute(`aria-pressed`,String(t.paused)),u.setAttribute(`aria-expanded`,String(t.panelOpen)),a.textContent=t.touch?`${H[t.tool]}.`:`${H[t.tool]}. Scroll to change the brush size. H hides these controls.`,a.classList.toggle(`gone`,t.hasPainted)}}}window.__stats={fps:0,frameMs:0,gpuMs:0,frames:0,ants:0,adapter:``,error:null,pops:[0,0],touch:!1};var G=e(e=>{let t=document.getElementById(`fatal`);t.textContent=e,t.classList.add(`on`),document.getElementById(`ui`).classList.add(`gone`),window.__stats.error=e});function ge(e){let t={};return new URLSearchParams(location.search).forEach((e,n)=>{t[n]=e}),F(M({...A,...t}),e,new Set(Object.keys(t)))}function _e(){let e=Number(new URLSearchParams(location.search).get(`seed`));return Number.isInteger(e)&&e>0?e:1+Math.floor(Math.random()*1e6)}function K(e,t,n){let r=t.device.limits.maxTextureDimension2D,i=Math.min(window.devicePixelRatio||1,n?1.5:4);return[Math.max(64,Math.min(r,Math.round(e.clientWidth*i))),Math.max(64,Math.min(r,Math.round(e.clientHeight*i)))]}function q(e,t,n){let[r,i]=K(e,t,n);return e.width=r,e.height=i,[r,i]}async function ve(){let e=document.getElementById(`view`),t=document.getElementById(`ui`),n;try{n=await r(e)}catch(e){G.report(e,!0);return}let o=window.__stats;o.adapter=n.adapterInfo,n.device.lost.then(()=>{G.report(`The graphics device was lost. Reload the page.`,!0)}),n.device.addEventListener(`uncapturederror`,e=>{let t=e.error.message;console.error(`WebGPU:`,t),G.report(t.split(/\r?\n/)[0])});let s=window.matchMedia(`(pointer: coarse)`).matches;o.touch=s;let c={params:ge(s),tool:i.Food,paused:!1,uiHidden:!1,meterOn:!s,panelOpen:!1,hasPainted:!1,touch:s};t.classList.toggle(`touch`,s);let l=new a,[u,d]=q(e,n,s),f=_e(),p=k(n,u,d,c.params,f),m={changed:()=>b(),reset:()=>{l.clear(),p.reset()}},h=he(t,c,m),g=z(t,c,m),_=I(t,c),v=V(t,c),y=N(e,c,l,()=>[p.worldW,p.worldH],m);function b(){t.classList.toggle(`hidden`,c.uiHidden),t.dataset.palette=String(c.params.palette),h.sync(),v.sync(),v.update(p.pops),g.sync(),_.sync(),y.syncRing()}b();let x=0;window.addEventListener(`resize`,()=>{clearTimeout(x),x=window.setTimeout(()=>{if(G.failed)return;let[t,r]=K(e,n,s);(t!==u||r!==d)&&(l.clear(),p.destroy(),[u,d]=q(e,n,s),p=k(n,u,d,c.params,f),y.syncRing())},200)});let S=performance.now(),C=S,w=0,ee=S,T=0,E=(e,t)=>{if(t-ee>3e4||c.paused||document.hidden||(T=e<45?T+1:0,T<3))return;T=0;let n=P(c.params);n&&(c.params=n,b())};document.addEventListener(`visibilitychange`,()=>{document.hidden||(S=C=performance.now(),w=0,T=0)});let D=e=>{G.failed||(y.tick(),p.frame(c.params,l.take(),c.paused),o.frames++,o.ants=c.params.antCount,o.frameMs=e-S,o.gpuMs=p.gpuMs,S=e,w++,e-C>=1e3&&(o.fps=Math.round(w*1e4/(e-C))/10,_.update(o.fps,(e-C)/w,n.hasTimestamps?o.gpuMs:-1),o.pops=p.pops,v.update(o.pops),E(o.fps,e),C=e,w=0),requestAnimationFrame(D))};requestAnimationFrame(D)}ve().catch(e=>G.report(e));