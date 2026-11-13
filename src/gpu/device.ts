import { describeAdapter } from './errors';

export interface Gpu {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  hasTimestamps: boolean;
  adapterInfo: string;
}

const NO_WEBGPU = 'This browser has no WebGPU. Use a current Chrome or Edge.';

export async function initGpu(canvas: HTMLCanvasElement): Promise<Gpu> {
  if (!('gpu' in navigator) || !navigator.gpu) throw new Error(NO_WEBGPU);
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error(NO_WEBGPU);
  const hasTimestamps = adapter.features.has('timestamp-query');
  const device = await adapter.requestDevice({
    requiredFeatures: hasTimestamps ? ['timestamp-query'] : [],
  });
  const context = canvas.getContext('webgpu');
  if (!context) throw new Error(NO_WEBGPU);
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });
  const adapterInfo = describeAdapter(adapter.info);
  return { device, context, format, hasTimestamps, adapterInfo };
}
