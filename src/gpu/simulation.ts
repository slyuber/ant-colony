import { MAX_SEGMENTS, type Segment } from '../input/brush';
import { ANT_STRIDE, MAX_ANTS, packAnts } from '../sim/ants';
import { nestPositions, rainBand, rescalePopulations, sproutEvery, startPopulations, stepPopulations, type Pops } from '../sim/colony';
import { scatterFood, sprout, startingFood } from '../sim/food';
import type { Params } from '../sim/params';
import type { Gpu } from './device';
import antDrawSrc from './shaders/antDraw.wgsl?raw';
import antStepSrc from './shaders/antStep.wgsl?raw';
import commonSrc from './shaders/common.wgsl?raw';
import depositSrc from './shaders/deposit.wgsl?raw';
import fieldSrc from './shaders/field.wgsl?raw';
import bloomSrc from './shaders/bloom.wgsl?raw';
import sceneSrc from './shaders/scene.wgsl?raw';
import tonemapSrc from './shaders/tonemap.wgsl?raw';
import { packSegments, packSimUniforms } from './uniforms';

export interface Simulation {
  frame(p: Params, segs: Segment[], paused: boolean): void;
  reset(): void;
  destroy(): void;
  readonly gpuMs: number;
  /** Ants alive in colony A and colony B right now. */
  readonly pops: Pops;
  readonly worldW: number;
  readonly worldH: number;
}

const FIELD_FORMAT: GPUTextureFormat = 'rgba16float';
const ADDITIVE: GPUBlendState = {
  color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
  alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
};

export function createSimulation(gpu: Gpu, width: number, height: number, p0: Params, seed0 = 1): Simulation {
  const { device, context, format } = gpu;
  const nestRadius = 24;
  // Set by reset(): how many colonies this world has, where they live and how many ants each has.
  let colonies = 1;
  let nests = nestPositions(width, height, 1);
  let pops: Pops = [0, 0];
  let budget = 0;
  let slotsHigh = 0;      // highest slot ever used, so shrunken colonies still get their ants switched off
  let lastParams = p0;

  const module = (code: string, label: string) => device.createShaderModule({ code: `${commonSrc}\n${code}`, label });
  const fieldTexture = (label: string) => device.createTexture({
    label, size: [width, height], format: FIELD_FORMAT,
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });

  const scent = [fieldTexture('scent0'), fieldTexture('scent1')];
  const world = [fieldTexture('world0'), fieldTexture('world1')];
  const taken = fieldTexture('taken');
  const scentView = scent.map((t) => t.createView());
  const worldView = world.map((t) => t.createView());
  const takenView = taken.createView();
  // Ants per pixel this frame (r = searching, g = carrying). The scene shader turns counts into light.
  const crowd = fieldTexture('crowd');
  const crowdView = crowd.createView();

  const ants = device.createBuffer({
    label: 'ants', size: MAX_ANTS * ANT_STRIDE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const simUniforms = device.createBuffer({ label: 'sim', size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const segUniforms = device.createBuffer({
    label: 'segments', size: (MAX_SEGMENTS * 8 + 8) * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Running totals written by the ant shader: food delivered by A, by B, deaths of A, of B.
  const tally = device.createBuffer({
    label: 'tally', size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  const tallyRead = device.createBuffer({ label: 'tallyRead', size: 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  let tallyBusy = false;
  let tallySeen = [0, 0, 0, 0];
  let tallyFrame = 0;
  let epoch = 0;          // bumped by reset(), so a reading still in flight from the old world is thrown away

  const antStep = device.createComputePipeline({
    label: 'antStep', layout: 'auto',
    compute: { module: module(antStepSrc, 'antStep'), entryPoint: 'main' },
  });
  const depositModule = module(depositSrc, 'deposit');
  const deposit = device.createRenderPipeline({
    label: 'deposit', layout: 'auto',
    vertex: { module: depositModule, entryPoint: 'vs' },
    fragment: {
      module: depositModule, entryPoint: 'fs',
      targets: [{ format: FIELD_FORMAT, blend: ADDITIVE }, { format: FIELD_FORMAT, blend: ADDITIVE }],
    },
    primitive: { topology: 'point-list' },
  });
  const fieldModule = module(fieldSrc, 'field');
  const field = device.createRenderPipeline({
    label: 'field', layout: 'auto',
    vertex: { module: fieldModule, entryPoint: 'vs' },
    fragment: { module: fieldModule, entryPoint: 'fs', targets: [{ format: FIELD_FORMAT }, { format: FIELD_FORMAT }] },
  });
  const sceneModule = module(sceneSrc, 'scene');
  const scene = device.createRenderPipeline({
    label: 'scene', layout: 'auto',
    vertex: { module: sceneModule, entryPoint: 'vs' },
    fragment: { module: sceneModule, entryPoint: 'fs', targets: [{ format: FIELD_FORMAT }] },
  });
  const antDrawModule = module(antDrawSrc, 'antDraw');
  const antDraw = device.createRenderPipeline({
    label: 'antDraw', layout: 'auto',
    vertex: { module: antDrawModule, entryPoint: 'vs' },
    fragment: { module: antDrawModule, entryPoint: 'fs', targets: [{ format: FIELD_FORMAT, blend: ADDITIVE }] },
    primitive: { topology: 'point-list' },
  });

  const buf = (buffer: GPUBuffer) => ({ buffer });

  // Picture pipeline: scene -> hdr, bright parts -> small blurred copy (glow), both -> screen.
  const hdr = fieldTexture('hdr');
  const hdrView = hdr.createView();
  const linear = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  const bloomModule = device.createShaderModule({ code: bloomSrc, label: 'bloom' });
  const bloomDown = device.createRenderPipeline({
    label: 'bloomDown', layout: 'auto',
    vertex: { module: bloomModule, entryPoint: 'vs' },
    fragment: { module: bloomModule, entryPoint: 'fsDown', targets: [{ format: FIELD_FORMAT }] },
  });
  const bloomBlur = device.createRenderPipeline({
    label: 'bloomBlur', layout: 'auto',
    vertex: { module: bloomModule, entryPoint: 'vs' },
    fragment: { module: bloomModule, entryPoint: 'fsBlur', targets: [{ format: FIELD_FORMAT }] },
  });
  const tonemapModule = device.createShaderModule({ code: tonemapSrc, label: 'tonemap' });
  const tonemap = device.createRenderPipeline({
    label: 'tonemap', layout: 'auto',
    vertex: { module: tonemapModule, entryPoint: 'vs' },
    fragment: { module: tonemapModule, entryPoint: 'fs', targets: [{ format }] },
  });
  const ownedTextures: GPUTexture[] = [hdr];
  const ownedBuffers: GPUBuffer[] = [];
  const vec4Uniform = (values: number[]): GPUBuffer => {
    const b = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(b, 0, Float32Array.from(values));
    ownedBuffers.push(b);
    return b;
  };

  interface Glow { views: GPUTextureView[]; down: GPUBindGroup; blurs: { bg: GPUBindGroup; target: number }[]; present: GPUBindGroup }
  // Level 1 "Soft" works at quarter size, level 2 "Full" at half size. Level 0 skips the blur passes.
  function makeGlow(divisor: number, strength: number): Glow {
    const gw = Math.max(1, Math.floor(width / divisor));
    const gh = Math.max(1, Math.floor(height / divisor));
    const tex = [0, 1].map((i) => device.createTexture({
      label: `bloom${divisor}-${i}`, size: [gw, gh], format: FIELD_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    }));
    ownedTextures.push(...tex);
    const views = tex.map((t) => t.createView());
    const down = device.createBindGroup({
      layout: bloomDown.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: linear }, { binding: 1, resource: hdrView }],
    });
    // Two rounds of across-then-down; the second round reaches twice as far.
    const blurs = [[1 / gw, 0], [0, 1 / gh], [2 / gw, 0], [0, 2 / gh]].map((d, i) => ({
      target: 1 - (i % 2),
      bg: device.createBindGroup({
        layout: bloomBlur.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: linear }, { binding: 1, resource: views[i % 2] },
          { binding: 2, resource: buf(vec4Uniform([d[0], d[1], 0, 0])) },
        ],
      }),
    }));
    const present = device.createBindGroup({
      layout: tonemap.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: linear }, { binding: 1, resource: hdrView }, { binding: 2, resource: views[0] },
        { binding: 3, resource: buf(vec4Uniform([strength, 0, 0, 0])) },
      ],
    });
    return { views, down, blurs, present };
  }
  const glowLevels = [makeGlow(4, 0), makeGlow(4, 0.55), makeGlow(2, 0.7)];
  const antStepBG = [0, 1].map((i) => device.createBindGroup({
    layout: antStep.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: buf(simUniforms) }, { binding: 1, resource: buf(segUniforms) },
      { binding: 2, resource: buf(ants) }, { binding: 3, resource: scentView[i] }, { binding: 4, resource: worldView[i] },
      { binding: 5, resource: crowdView }, { binding: 6, resource: buf(tally) },
    ],
  }));
  const depositBG = device.createBindGroup({
    layout: deposit.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: buf(simUniforms) }, { binding: 1, resource: buf(ants) }],
  });
  const fieldBG = [0, 1].map((i) => device.createBindGroup({
    layout: field.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: buf(simUniforms) }, { binding: 1, resource: buf(segUniforms) },
      { binding: 2, resource: scentView[i] }, { binding: 3, resource: worldView[i] }, { binding: 4, resource: takenView },
    ],
  }));
  const sceneBG = [0, 1].map((i) => device.createBindGroup({
    layout: scene.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: buf(simUniforms) }, { binding: 1, resource: scentView[i] }, { binding: 2, resource: worldView[i] },
      { binding: 3, resource: crowdView },
    ],
  }));
  const antDrawBG = device.createBindGroup({
    layout: antDraw.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: buf(simUniforms) }, { binding: 1, resource: buf(ants) }],
  });

  // Graphics-card stopwatch: one mark as the first pass begins, one as the last pass ends.
  const querySet = gpu.hasTimestamps ? device.createQuerySet({ type: 'timestamp', count: 2 }) : null;
  const resolveBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
  const readBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  let readBusy = false;
  let gpuMs = 0;
  let tick = 0;
  let destroyed = false;
  const startMark = (): GPUComputePassTimestampWrites | undefined =>
    querySet ? { querySet, beginningOfPassWriteIndex: 0 } : undefined;
  const endMark = (): GPURenderPassTimestampWrites | undefined =>
    querySet ? { querySet, endOfPassWriteIndex: 1 } : undefined;

  let cur = 0;
  let frameNo = 0;
  let carry: Segment[] = [];
  let resetSeed = seed0;
  let worldSeed = seed0;
  let sprouts = 0;
  const clear = { r: 0, g: 0, b: 0, a: 0 };

  function reset(): void {
    const seed = resetSeed++;
    worldSeed = seed;
    colonies = lastParams.colonies >= 2 ? 2 : 1;
    nests = nestPositions(width, height, colonies);
    budget = lastParams.antCount;
    pops = startPopulations(budget, colonies);
    slotsHigh = 0;
    sprouts = 0;
    epoch++;
    tallySeen = [0, 0, 0, 0];
    tallyFrame = 0;
    device.queue.writeBuffer(tally, 0, new Uint32Array(4));
    // Every slot starts switched off; the ant shader places each ant in its own nest as it comes alive.
    device.queue.writeBuffer(ants, 0, packAnts(MAX_ANTS, nests[0][0], nests[0][1], nestRadius, seed));
    const enc = device.createCommandEncoder();
    for (const view of [...scentView, ...worldView, takenView, crowdView]) {
      enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: clear }] }).end();
    }
    device.queue.submit([enc.finish()]);
    carry = colonies === 2
      ? scatterFood(width, height, nests, seed, 7)
      : startingFood(width, height, nests[0][0], nests[0][1], seed);
    frameNo = 0;
  }

  /** Read the ant shader's totals and let the colonies grow or shrink by what happened since last time. */
  function readTally(enc: GPUCommandEncoder): (() => void) | null {
    if (colonies < 2 || tallyBusy) return null;
    enc.copyBufferToBuffer(tally, 0, tallyRead, 0, 16);
    const at = epoch;
    const frames = frameNo - tallyFrame;
    tallyFrame = frameNo;
    return () => {
      tallyBusy = true;
      tallyRead.mapAsync(GPUMapMode.READ).then(() => {
        if (destroyed) return;
        const now = Array.from(new Uint32Array(tallyRead.getMappedRange()));
        tallyRead.unmap();
        tallyBusy = false;
        if (at !== epoch) return;
        const d = now.map((v, i) => (v - tallySeen[i]) >>> 0);
        tallySeen = now;
        pops = stepPopulations(pops, [d[0], d[1]], [d[2], d[3]], frames / 60, budget, colonies);
      }).catch(() => { tallyBusy = false; });
    };
  }

  function frame(p: Params, segs: Segment[], paused: boolean): void {
    lastParams = p;
    if ((p.colonies >= 2 ? 2 : 1) !== colonies) reset();   // a different number of nests is a different world
    if (p.antCount !== budget) {
      pops = rescalePopulations(pops, budget, p.antCount, colonies);
      budget = p.antCount;
    }
    const all = [...carry, ...segs];
    const every = sproutEvery(p.foodGrowth);
    if (!paused && every > 0 && frameNo > 0 && frameNo % every === 0) {
      all.push(sprout(width, height, colonies === 2 ? nests : [nests[0]], worldSeed, sprouts++));
    }
    const now = all.slice(0, MAX_SEGMENTS);
    carry = all.slice(MAX_SEGMENTS);
    const slots = colonies === 2 ? 2 * Math.ceil(Math.max(pops[0], pops[1])) : Math.ceil(pops[0]);
    slotsHigh = Math.min(MAX_ANTS, Math.max(slotsHigh, slots));
    const count = slotsHigh;
    const rain = rainBand(frameNo, width, p.rain > 0);

    const u = packSimUniforms(p, {
      worldW: width, worldH: height, frame: frameNo, nests, nestRadius, slots: count, pops, paused,
      rainX: rain.x, rainW: rain.w,
    });
    device.queue.writeBuffer(simUniforms, 0, u.buffer);
    device.queue.writeBuffer(segUniforms, 0, packSegments(now).buffer);

    const enc = device.createCommandEncoder();

    if (!paused) {
      const pass = enc.beginComputePass({ timestampWrites: startMark() });
      pass.setPipeline(antStep);
      pass.setBindGroup(0, antStepBG[cur]);
      pass.dispatchWorkgroups(Math.ceil(count / 256));
      pass.end();
    }
    {
      const pass = enc.beginRenderPass({
        colorAttachments: [
          { view: scentView[cur], loadOp: 'load', storeOp: 'store' },
          { view: takenView, loadOp: 'clear', storeOp: 'store', clearValue: clear },
        ],
        timestampWrites: paused ? startMark() : undefined,
      });
      if (!paused) {
        pass.setPipeline(deposit);
        pass.setBindGroup(0, depositBG);
        pass.draw(count);
      }
      pass.end();
    }
    {
      const next = 1 - cur;
      const pass = enc.beginRenderPass({
        colorAttachments: [
          { view: scentView[next], loadOp: 'clear', storeOp: 'store', clearValue: clear },
          { view: worldView[next], loadOp: 'clear', storeOp: 'store', clearValue: clear },
        ],
      });
      pass.setPipeline(field);
      pass.setBindGroup(0, fieldBG[cur]);
      pass.draw(3);
      pass.end();
      cur = next;
    }
    {
      const counting = enc.beginRenderPass({
        colorAttachments: [{ view: crowdView, loadOp: 'clear', storeOp: 'store', clearValue: clear }],
      });
      counting.setPipeline(antDraw);
      counting.setBindGroup(0, antDrawBG);
      counting.draw(count);
      counting.end();
      const pass = enc.beginRenderPass({
        colorAttachments: [{ view: hdrView, loadOp: 'clear', storeOp: 'store', clearValue: clear }],
      });
      pass.setPipeline(scene);
      pass.setBindGroup(0, sceneBG[cur]);
      pass.draw(3);
      pass.end();
    }
    const level = Math.min(2, Math.max(0, Math.round(p.bloom)));
    const glow = glowLevels[level];
    if (level > 0) {
      const fullscreen = (view: GPUTextureView, pipeline: GPURenderPipeline, bg: GPUBindGroup): void => {
        const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: clear }] });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bg);
        pass.draw(3);
        pass.end();
      };
      fullscreen(glow.views[0], bloomDown, glow.down);
      for (const b of glow.blurs) fullscreen(glow.views[b.target], bloomBlur, b.bg);
    }
    {
      const pass = enc.beginRenderPass({
        colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: clear }],
        timestampWrites: endMark(),
      });
      pass.setPipeline(tonemap);
      pass.setBindGroup(0, glow.present);
      pass.draw(3);
      pass.end();
    }
    const read = querySet !== null && !readBusy && tick % 10 === 0;
    if (querySet) enc.resolveQuerySet(querySet, 0, 2, resolveBuf, 0);
    if (read) enc.copyBufferToBuffer(resolveBuf, 0, readBuf, 0, 16);
    const afterSubmit = !paused && tick % 30 === 15 ? readTally(enc) : null;
    device.queue.submit([enc.finish()]);
    afterSubmit?.();
    if (read) {
      readBusy = true;
      readBuf.mapAsync(GPUMapMode.READ).then(() => {
        if (destroyed) return;
        const t = new BigInt64Array(readBuf.getMappedRange());
        const ms = Number(t[1] - t[0]) / 1e6;
        if (ms > 0 && ms < 1000) gpuMs = gpuMs === 0 ? ms : gpuMs * 0.8 + ms * 0.2;
        readBuf.unmap();
        readBusy = false;
      }).catch(() => { readBusy = false; });
    }
    tick++;
    if (!paused) frameNo++;
  }

  function destroy(): void {
    destroyed = true;
    for (const t of [...scent, ...world, taken, crowd, ...ownedTextures]) t.destroy();
    for (const b of ownedBuffers) b.destroy();
    for (const b of [ants, simUniforms, segUniforms, resolveBuf, readBuf, tally, tallyRead]) b.destroy();
    querySet?.destroy();
  }

  reset();
  return {
    frame, reset, destroy,
    get gpuMs() { return gpuMs; },
    get pops(): Pops { return [pops[0], pops[1]]; },
    worldW: width, worldH: height,
  };
}
