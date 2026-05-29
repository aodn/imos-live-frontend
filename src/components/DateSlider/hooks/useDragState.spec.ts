// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHandleDragState } from './useDragState';
import { TIMING } from '../constants';

describe('useHandleDragState', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('initialises with no drag in flight', () => {
    const { result } = renderHook(() => useHandleDragState());
    expect(result.current.isHandleDragging).toBeNull();
    expect(result.current.handleDragStarted).toBe(false);
  });

  it('records which handle is dragging and that a drag has started', () => {
    const { result } = renderHook(() => useHandleDragState());
    act(() => {
      result.current.setIsHandleDragging('point');
      result.current.setHandleDragStarted(true);
    });
    expect(result.current.isHandleDragging).toBe('point');
    expect(result.current.handleDragStarted).toBe(true);
  });

  it('handleDragComplete clears isHandleDragging immediately and handleDragStarted after delay', () => {
    const { result } = renderHook(() => useHandleDragState());
    act(() => {
      result.current.setIsHandleDragging('start');
      result.current.setHandleDragStarted(true);
    });
    act(() => {
      result.current.handleDragComplete();
    });
    // Synchronous clear:
    expect(result.current.isHandleDragging).toBeNull();
    // Still considered "started" until delay elapses:
    expect(result.current.handleDragStarted).toBe(true);

    act(() => {
      vi.advanceTimersByTime(TIMING.DRAG_COMPLETE_DELAY);
    });
    expect(result.current.handleDragStarted).toBe(false);
  });
});
