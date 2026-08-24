import { useRef, useSyncExternalStore } from 'react';
import type { DateSliderState, DateSliderStore, TimeUnit } from '../type';

const INITIAL_STATE: DateSliderState = {
  pointDate: null,
  rangeStartDate: null,
  rangeEndDate: null,
  timeUnit: 'day',
  isMonthValid: false,
  isYearValid: false,
  isDragging: false,
};

function isSameState(a: DateSliderState, b: DateSliderState): boolean {
  return (
    a.timeUnit === b.timeUnit &&
    a.isMonthValid === b.isMonthValid &&
    a.isYearValid === b.isYearValid &&
    a.isDragging === b.isDragging &&
    a.pointDate === b.pointDate &&
    a.rangeStartDate === b.rangeStartDate &&
    a.rangeEndDate === b.rangeEndDate
  );
}

// This is just like create a zustand store, have state: INITIAL_STATE, and method setState. setState can mutate the
// states, and whenever state updates, the component consuming the states will get rerendered.

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

/** Subscribe to a slider's live state (selected dates, time unit, range validity, drag status). */
export function useDateSliderState(store: DateSliderStore): DateSliderState {
  // inside useSyncExternalStore, react will create a onStoreChange function and subscribe it,
  // this function will force rerender.
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
