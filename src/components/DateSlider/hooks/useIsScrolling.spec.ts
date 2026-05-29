// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIsScrolling } from './useIsScrolling';

describe('useIsScrolling', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns false when there is no target', () => {
    const { result } = renderHook(() => useIsScrolling(null));
    expect(result.current).toBe(false);
  });

  it('flips to true on scroll and back to false after the debounce window', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const { result } = renderHook(() => useIsScrolling(target, 200));
    expect(result.current).toBe(false);

    act(() => {
      target.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('resets the debounce window on each subsequent scroll event', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const { result } = renderHook(() => useIsScrolling(target, 200));

    act(() => target.dispatchEvent(new Event('scroll')));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    act(() => target.dispatchEvent(new Event('scroll')));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(false);
  });

  it('attaches to document when passed window', () => {
    const { result } = renderHook(() => useIsScrolling(window, 100));
    act(() => document.dispatchEvent(new Event('scroll')));
    expect(result.current).toBe(true);
  });

  it('detaches listener on unmount', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const removeSpy = vi.spyOn(target, 'removeEventListener');
    const { unmount } = renderHook(() => useIsScrolling(target));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
