// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDateLabelPersist } from './useDateLabelPersist';
import { TIMING } from '../constants';

describe('useDateLabelPersist', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts hidden by default', () => {
    const { result } = renderHook(() => useDateLabelPersist(false, undefined, false));
    expect(result.current.showDateLabel).toBe(false);
  });

  it('shows the label briefly when a label is supplied, then hides it', () => {
    const { result } = renderHook(() => useDateLabelPersist(false, 'May 29', false));
    expect(result.current.showDateLabel).toBe(false);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.showDateLabel).toBe(true);
    act(() => {
      vi.advanceTimersByTime(TIMING.LABEL_PERSISTENCE);
    });
    expect(result.current.showDateLabel).toBe(false);
  });

  it('stays hidden when handleLabelPersistent is true (handled by parent)', () => {
    // When persistent, this hook does nothing — the parent handles visibility.
    const { result } = renderHook(() => useDateLabelPersist(false, 'May 29', true));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.showDateLabel).toBe(false);
  });

  it('clears immediately when immediateDisappear flips to true', () => {
    const { result, rerender } = renderHook(
      ({ immediate, label }) => useDateLabelPersist(immediate, label, false),
      { initialProps: { immediate: false, label: 'May 29' as string | undefined } },
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.showDateLabel).toBe(true);
    act(() => {
      rerender({ immediate: true, label: 'May 29' });
    });
    expect(result.current.showDateLabel).toBe(false);
  });
});
