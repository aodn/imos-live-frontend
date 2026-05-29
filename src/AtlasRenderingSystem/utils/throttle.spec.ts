import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttle } from './throttle';

describe('throttle (AtlasRenderingSystem)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('invokes immediately on the leading edge', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled('a');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('schedules a trailing call with the latest args when more calls arrive in-window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled('a');
    throttled('b');
    throttled('c');
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    // Trailing call carries the latest args captured at the moment the timer fires.
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  it('allows another leading call after the wait window elapses', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled('a');
    vi.advanceTimersByTime(100);
    throttled('b');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('does not schedule a trailing call when no further calls arrive', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled('a');
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
