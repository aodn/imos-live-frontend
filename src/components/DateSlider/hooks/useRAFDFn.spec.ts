// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRAFDFn } from './useRAFDFn';

describe('useRAFDFn', () => {
  let rafQueue: FrameRequestCallback[];
  let rafSpy: ReturnType<typeof vi.fn>;
  let cafSpy: ReturnType<typeof vi.fn>;
  let originalRaf: typeof window.requestAnimationFrame;
  let originalCaf: typeof window.cancelAnimationFrame;

  beforeEach(() => {
    rafQueue = [];
    originalRaf = window.requestAnimationFrame;
    originalCaf = window.cancelAnimationFrame;
    rafSpy = vi.fn((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    cafSpy = vi.fn();
    window.requestAnimationFrame = rafSpy as unknown as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = cafSpy as unknown as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCaf;
  });

  const flushFrame = () => {
    const callbacks = rafQueue.slice();
    rafQueue.length = 0;
    callbacks.forEach(cb => cb(performance.now()));
  };

  it('schedules a single rAF for many calls in the same frame', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useRAFDFn(fn));

    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(fn).not.toHaveBeenCalled();

    act(() => flushFrame());
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3); // latest args win
  });

  it('schedules a new frame after the previous one fires', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useRAFDFn(fn));

    act(() => result.current('a'));
    act(() => flushFrame());
    act(() => result.current('b'));
    act(() => flushFrame());

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('cancels any pending rAF on unmount', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useRAFDFn(fn));
    act(() => result.current('x'));
    unmount();
    expect(cafSpy).toHaveBeenCalled();
  });
});
