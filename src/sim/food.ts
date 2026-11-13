import { Tool, type Segment } from '../input/brush';
import { mulberry32 } from './ants';

const PILES = 5;

/**
 * Where the food sits when a colony starts: five piles of mixed size, spread around the nest
 * at mixed distances. A different seed gives a different layout, so every reset is a new picture.
 */
export function startingFood(width: number, height: number, nestX: number, nestY: number, seed: number): Segment[] {
  const rand = mulberry32(seed * 7919 + 13);
  const scale = Math.min(1, Math.min(width, height) / 900);
  const edge = 8 * scale;
  const bottom = Math.min(110, height * 0.12);   // keep clear of the tool strip
  const base = rand() * Math.PI * 2;
  const out: Segment[] = [];

  for (let i = 0; i < PILES; i++) {
    let best: Segment | null = null;
    for (let attempt = 0; attempt < 40 && !best; attempt++) {
      const radius = Math.max(6, (18 + 26 * rand()) * scale * (attempt < 20 ? 1 : 0.6));
      const angle = base + ((i + (rand() - 0.5) * 0.5) / PILES) * Math.PI * 2;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      // How far this direction can go before the pile would leave the allowed box.
      const roomX = dx > 0 ? width - edge - radius - nestX : nestX - edge - radius;
      const roomY = dy > 0 ? height - bottom - radius - nestY : nestY - edge - radius;
      const far = Math.min(roomX / Math.max(Math.abs(dx), 1e-6), roomY / Math.max(Math.abs(dy), 1e-6));
      const near = 74 + radius;
      if (far < near && attempt < 39) continue;
      const t = far < near ? Math.max(0, far) : near + (far - near) * (0.3 + 0.7 * rand());
      const x = nestX + dx * t, y = nestY + dy * t;
      const clear = out.every((p) => Math.hypot(p.ax - x, p.ay - y) - p.radius - radius > 24);
      if (clear || attempt === 39) best = { ax: x, ay: y, bx: x, by: y, radius, tool: Tool.Food };
    }
    out.push(best!);
  }
  return out;
}

/**
 * Food for a two-colony world: piles anywhere on the map, clear of every nest and of each other.
 * Not mirrored on purpose: an uneven map is what gives each contest its story.
 */
export function scatterFood(width: number, height: number, nests: [number, number][], seed: number, count: number): Segment[] {
  const rand = mulberry32(seed * 104729 + 71);
  const scale = Math.min(1, Math.min(width, height) / 900);
  const edge = 8 * scale;
  const bottom = Math.min(110, height * 0.12);
  const out: Segment[] = [];
  for (let i = 0; i < count; i++) {
    let placed: Segment | null = null;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      // Later attempts try smaller piles and accept tighter spacing, so a small screen still gets its food.
      const tight = attempt < 80 ? 1 : attempt < 160 ? 0.6 : 0.3;
      const radius = Math.max(5, (18 + 26 * rand()) * scale * tight);
      const x = edge + radius + rand() * Math.max(0, width - 2 * (edge + radius));
      const y = edge + radius + rand() * Math.max(0, height - bottom - edge - 2 * radius);
      const offNests = nests.every(([nx, ny]) => Math.hypot(x - nx, y - ny) - radius >= 74 * scale * tight);
      const apart = out.every((p) => Math.hypot(p.ax - x, p.ay - y) - p.radius - radius > 24 * tight);
      if ((offNests && apart) || attempt === 199) placed = { ax: x, ay: y, bx: x, by: y, radius, tool: Tool.Food };
    }
    out.push(placed!);
  }
  return out;
}

/** One small new pile at a random open spot: sprout number `n` of this world. */
export function sprout(width: number, height: number, nests: [number, number][], seed: number, n: number): Segment {
  const rand = mulberry32(seed * 31337 + n * 977 + 5);
  const scale = Math.min(1, Math.min(width, height) / 900);
  const bottom = Math.min(110, height * 0.12);
  let best: Segment | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const radius = Math.max(5, (10 + 8 * rand()) * scale);
    const x = radius + rand() * Math.max(0, width - 2 * radius);
    const y = radius + rand() * Math.max(0, height - bottom - 2 * radius);
    best = { ax: x, ay: y, bx: x, by: y, radius, tool: Tool.Food };
    if (nests.every(([nx, ny]) => Math.hypot(x - nx, y - ny) > 90 * scale + radius)) break;
  }
  return best!;
}
