// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useViewportSize } from './useViewPortSize';
import { BREAKPOINT } from '../constants';

type Listener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(initialMatches: boolean) {
  const listeners: Listener[] = [];
  const mql = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_evt: string, l: Listener) => listeners.push(l),
    removeEventListener: (_evt: string, l: Listener) => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    },
    dispatchEvent: () => true,
  };
  Object.defineProperty(window, 'matchMedia', {
    value: () => mql,
    writable: true,
  });
  return {
    fireChange(matches: boolean) {
      mql.matches = matches;
      listeners.forEach(l => l({ matches } as MediaQueryListEvent));
    },
    listeners,
  };
}

describe('useViewportSize', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    });
  });

  it('reports isSmallScreen=false when innerWidth >= BREAKPOINT', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: BREAKPOINT,
      writable: true,
      configurable: true,
    });
    mockMatchMedia(false);
    const { result } = renderHook(() => useViewportSize());
    expect(result.current.isSmallScreen).toBe(false);
  });

  it('reports isSmallScreen=true when innerWidth < BREAKPOINT', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: BREAKPOINT - 1,
      writable: true,
      configurable: true,
    });
    mockMatchMedia(true);
    const { result } = renderHook(() => useViewportSize());
    expect(result.current.isSmallScreen).toBe(true);
  });

  it('updates when the media query fires a change event', () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useViewportSize());
    expect(result.current.isSmallScreen).toBe(false);
    act(() => mm.fireChange(true));
    expect(result.current.isSmallScreen).toBe(true);
    act(() => mm.fireChange(false));
    expect(result.current.isSmallScreen).toBe(false);
  });

  it('cleans up the listener on unmount', () => {
    const mm = mockMatchMedia(false);
    const { unmount } = renderHook(() => useViewportSize());
    expect(mm.listeners.length).toBe(1);
    unmount();
    expect(mm.listeners.length).toBe(0);
  });
});
