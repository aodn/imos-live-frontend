import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLODController } from './LODController';

describe('createLODController', () => {
  let now = 0;
  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function advance(ms: number) {
    now += ms;
  }

  it('starts at value 0 and is not animating', () => {
    const lod = createLODController();
    expect(lod.getValue()).toBe(0);
    expect(lod.isAnimating()).toBe(false);
  });

  it('startBlendIn transitions to animating', () => {
    const lod = createLODController();
    lod.startBlendIn();
    expect(lod.isAnimating()).toBe(true);
  });

  it('eases out from 0 toward 1 over 300ms', () => {
    const lod = createLODController();
    lod.startBlendIn();

    advance(0);
    expect(lod.getValue()).toBeCloseTo(0, 5);

    advance(150);
    // ease-out at t=0.5: 0.5 * (2 - 0.5) = 0.75
    expect(lod.getValue()).toBeCloseTo(0.75, 5);

    advance(150); // total 300ms
    expect(lod.getValue()).toBe(1);
    expect(lod.isAnimating()).toBe(false);
  });

  it('clamps to 1 once duration elapses', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(500);
    expect(lod.getValue()).toBe(1);
    expect(lod.isAnimating()).toBe(false);
  });

  it('startBlendIn is a no-op when already at 1', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(500);
    expect(lod.getValue()).toBe(1);

    lod.startBlendIn();
    expect(lod.isAnimating()).toBe(false);
    expect(lod.getValue()).toBe(1);
  });

  it('reset snaps value to 0 and cancels animation', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(100);
    lod.getValue(); // advance state
    expect(lod.isAnimating()).toBe(true);

    lod.reset();
    expect(lod.getValue()).toBe(0);
    expect(lod.isAnimating()).toBe(false);
  });

  it('startBlendIn after partial progress continues from current value', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(150);
    const mid = lod.getValue(); // ~0.75
    expect(mid).toBeCloseTo(0.75, 5);

    // Resume from mid — re-arming should treat current value as the new startValue.
    lod.startBlendIn();
    advance(0);
    expect(lod.getValue()).toBeCloseTo(mid, 5);

    advance(300);
    expect(lod.getValue()).toBe(1);
  });

  it('getValue returns the cached value without advancing when not animating', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(500);
    expect(lod.getValue()).toBe(1);
    // Subsequent calls return 1 without changing state
    advance(1000);
    expect(lod.getValue()).toBe(1);
    expect(lod.isAnimating()).toBe(false);
  });

  it('destroy resets state', () => {
    const lod = createLODController();
    lod.startBlendIn();
    advance(150);
    lod.getValue();

    lod.destroy();
    expect(lod.getValue()).toBe(0);
    expect(lod.isAnimating()).toBe(false);
  });
});
