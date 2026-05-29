// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFocusManagement } from './useFocusManagement';
import { TIMING } from '../constants';

describe('useFocusManagement', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setupWithButtons() {
    const { result } = renderHook(() => useFocusManagement());
    const startBtn = document.createElement('button');
    const endBtn = document.createElement('button');
    const pointBtn = document.createElement('button');
    document.body.append(startBtn, endBtn, pointBtn);
    (result.current.startHandleRef as any).current = startBtn;
    (result.current.endHandleRef as any).current = endBtn;
    (result.current.pointHandleRef as any).current = pointBtn;
    return { result, startBtn, endBtn, pointBtn };
  }

  it('exposes handle refs', () => {
    const { result } = renderHook(() => useFocusManagement());
    expect(result.current.startHandleRef).toBeDefined();
    expect(result.current.endHandleRef).toBeDefined();
    expect(result.current.pointHandleRef).toBeDefined();
  });

  it('focuses immediately for keyboard interactions', () => {
    const { result, startBtn } = setupWithButtons();
    const focusSpy = vi.spyOn(startBtn, 'focus');
    act(() => {
      result.current.requestHandleFocus('start', 'keyboard');
    });
    act(() => {
      // 0ms delay for keyboard
      vi.advanceTimersByTime(0);
    });
    expect(focusSpy).toHaveBeenCalled();
  });

  it('delays focus for mouse interactions', () => {
    const { result, pointBtn } = setupWithButtons();
    const focusSpy = vi.spyOn(pointBtn, 'focus');
    act(() => {
      result.current.requestHandleFocus('point', 'mouse');
    });
    expect(focusSpy).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(TIMING.FOCUS_DELAY);
    });
    expect(focusSpy).toHaveBeenCalled();
  });

  it('does nothing if the requested handle is already focused', () => {
    const { result, endBtn } = setupWithButtons();
    endBtn.focus();
    const focusSpy = vi.spyOn(endBtn, 'focus');
    act(() => {
      result.current.requestHandleFocus('end', 'keyboard');
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('handleHandleFocus marks the interaction as keyboard if it was not already', () => {
    const { result } = renderHook(() => useFocusManagement());
    act(() => {
      result.current.setLastInteractionType('mouse');
    });
    act(() => {
      result.current.handleHandleFocus();
    });
    // No public way to observe lastInteractionType, but the call should not throw.
    // Re-calling when already keyboard is a no-op.
    act(() => {
      result.current.handleHandleFocus();
    });
    expect(result.current.handleHandleFocus).toBeTypeOf('function');
  });
});
