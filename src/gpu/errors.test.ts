import { describe, expect, it } from 'vitest';
import { createFatalReporter, describeAdapter } from './errors';

describe('createFatalReporter', () => {
  it('shows a readable message for an Error', () => {
    const shown: string[] = [];
    createFatalReporter((m) => shown.push(m)).report(new Error('out of memory'));
    expect(shown).toEqual(['The graphics card reported a problem: out of memory. Reload the page.']);
  });
  it('shows only the first problem', () => {
    const shown: string[] = [];
    const r = createFatalReporter((m) => shown.push(m));
    r.report(new Error('first'));
    r.report(new Error('second'));
    expect(shown.length).toBe(1);
    expect(shown[0]).toContain('first');
    expect(r.failed).toBe(true);
  });
  it('copes with things that are not Errors', () => {
    const shown: string[] = [];
    createFatalReporter((m) => shown.push(m)).report(undefined);
    expect(shown).toEqual(['The graphics card reported a problem: unknown error. Reload the page.']);
  });
  it('passes through messages that are already written for people', () => {
    const shown: string[] = [];
    createFatalReporter((m) => shown.push(m)).report(new Error('This browser has no WebGPU. Use a current Chrome or Edge.'), true);
    expect(shown).toEqual(['This browser has no WebGPU. Use a current Chrome or Edge.']);
  });
});

describe('describeAdapter', () => {
  it('joins the parts that exist', () => {
    expect(describeAdapter({ vendor: 'nvidia', architecture: 'pascal', device: '', description: '' })).toBe('nvidia | pascal');
  });
  it('survives a browser with no adapter info', () => {
    expect(describeAdapter(undefined)).toBe('unknown adapter');
  });
});
