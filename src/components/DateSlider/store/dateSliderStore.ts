import { useRef, useSyncExternalStore } from 'react';
import type { DateSliderState, DateSliderStore, TimeUnit } from '../type';

const INITIAL_STATE: DateSliderState = {
  pointDate: null,
  timeUnit: 'day',
  isMonthValid: false,
  isYearValid: false,
};

function isSameState(a: DateSliderState, b: DateSliderState): boolean {
  return (
    a.timeUnit === b.timeUnit &&
    a.isMonthValid === b.isMonthValid &&
    a.isYearValid === b.isYearValid &&
    a.pointDate?.getTime() === b.pointDate?.getTime()
  );
}

/**
 * Create a DateSlider state store. The slider writes to it via `setState`;
 * subscribers read via `useDateSliderState`. The snapshot identity is kept
 * stable across no-op writes so `useSyncExternalStore` doesn't re-render.
 */
export function createDateSliderStore(initialTimeUnit: TimeUnit = 'day'): DateSliderStore {
  let snapshot: DateSliderState = { ...INITIAL_STATE, timeUnit: initialTimeUnit };
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    setState(next) {
      if (isSameState(snapshot, next)) return;
      snapshot = next;
      listeners.forEach(listener => listener());
    },
  };
}

/** Create a DateSlider state store that is stable for the component's lifetime. */
export function useDateSliderStore(initialTimeUnit: TimeUnit = 'day'): DateSliderStore {
  const storeRef = useRef<DateSliderStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createDateSliderStore(initialTimeUnit);
  }
  return storeRef.current;
}

/** Subscribe to a slider's live state (selected date, time unit, range validity). */
export function useDateSliderState(store: DateSliderStore): DateSliderState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
