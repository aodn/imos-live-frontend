// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResizeObserver } from './useResizeObserver';

type Captured = {
  cb: ResizeObserverCallback;
  observed: Element[];
  disconnect: ReturnType<typeof vi.fn>;
};

describe('useResizeObserver', () => {
  let captured: Captured[];

  beforeEach(() => {
    vi.useFakeTimers();
    captured = [];
    (globalThis as any).ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        captured.push({ cb, observed: [], disconnect: vi.fn() });
      }
      observe(target: Element) {
        captured[captured.length - 1].observed.push(target);
      }
      disconnect() {
        captured[captured.length - 1].disconnect();
      }
      unobserve() {}
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as any).ResizeObserver;
  });

  it('observes the element when given a ref and debounces the callback', () => {
    const el = document.createElement('div');
    const callback = vi.fn();
    const ref = { current: el };

    renderHook(() => useResizeObserver(ref, callback, 100));
    expect(captured).toHaveLength(1);
    expect(captured[0].observed).toEqual([el]);

    const entry = { target: el, contentRect: {} } as unknown as ResizeObserverEntry;
    act(() => {
      captured[0].cb([entry], {} as ResizeObserver);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(entry);
  });

  it('disconnects on unmount', () => {
    const ref = { current: document.createElement('div') };
    const { unmount } = renderHook(() => useResizeObserver(ref, vi.fn()));
    unmount();
    expect(captured[0].disconnect).toHaveBeenCalled();
  });

  it('does nothing when the ref is null', () => {
    const callback = vi.fn();
    renderHook(() => useResizeObserver({ current: null }, callback));
    expect(captured).toHaveLength(0);
  });

  it('listens to window resize when ref is "window"', () => {
    const callback = vi.fn();
    renderHook(() => useResizeObserver('window', callback, 50));
    // initial call happens immediately (then debounce fires)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(50);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
