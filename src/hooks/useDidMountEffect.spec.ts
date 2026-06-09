// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDidMountEffect } from './useDidMountEffect';

describe('useDidMountEffect', () => {
  it('does not run the effect on the first render', () => {
    const effect = vi.fn();
    renderHook(({ dep }) => useDidMountEffect(effect, [dep]), { initialProps: { dep: 0 } });
    expect(effect).not.toHaveBeenCalled();
  });

  it('runs the effect on each dependency change after mount', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useDidMountEffect(effect, [dep]), {
      initialProps: { dep: 0 },
    });

    expect(effect).not.toHaveBeenCalled();
    rerender({ dep: 1 });
    expect(effect).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it('does not re-run when the dependency is unchanged', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useDidMountEffect(effect, [dep]), {
      initialProps: { dep: 5 },
    });
    rerender({ dep: 5 });
    expect(effect).not.toHaveBeenCalled();
  });

  it('runs the effect cleanup before the next run and on unmount', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);
    const { rerender, unmount } = renderHook(({ dep }) => useDidMountEffect(effect, [dep]), {
      initialProps: { dep: 0 },
    });

    rerender({ dep: 1 }); // first real run — registers cleanup, nothing to clean yet
    expect(cleanup).not.toHaveBeenCalled();

    rerender({ dep: 2 }); // cleanup of run #1, then run #2
    expect(cleanup).toHaveBeenCalledTimes(1);

    unmount(); // cleanup of run #2
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
