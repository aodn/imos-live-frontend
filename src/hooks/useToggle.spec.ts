// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  it('initialises with the given value', () => {
    expect(renderHook(() => useToggle(true)).result.current.open).toBe(true);
    expect(renderHook(() => useToggle(false)).result.current.open).toBe(false);
  });

  it('flips open on each toggle()', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current.toggle());
    expect(result.current.open).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
  });
});
