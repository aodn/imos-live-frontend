import { useRef, useEffect, useMemo } from 'react';
import { TIMING } from '../constants';
import type { SelectionResult, ViewMode } from '../type';
import { createSelectionResult, debounce, toNaiveDateTimeString } from '../utils';
import type { DateSelectionResult } from '../utils';

function toNaiveSelection(selection: DateSelectionResult): SelectionResult {
  return Object.fromEntries(
    Object.entries(selection).map(([key, date]) => [key, toNaiveDateTimeString(date)]),
  ) as SelectionResult;
}

type UseOnChangeNotifierParams = {
  onChange: (selection: SelectionResult) => void;
  rangeStartPosition: number;
  rangeEndPosition: number;
  pointPosition: number;
  startDate: Date;
  endDate: Date;
  viewMode: ViewMode;
};

/**
 * Hook to handle debounced onChange notifications.
 * Creates selection results from positions and notifies parent component.
 */
export function useOnChangeNotifier({
  onChange,
  rangeStartPosition,
  rangeEndPosition,
  pointPosition,
  startDate,
  endDate,
  viewMode,
}: UseOnChangeNotifierParams) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const debouncedOnChange = useMemo(
    () =>
      debounce(
        (selection: SelectionResult) => onChangeRef.current(selection),
        TIMING.DEBOUNCE_DELAY,
      ),
    [],
  );

  useEffect(() => {
    const selection = createSelectionResult(
      rangeStartPosition,
      startDate,
      endDate,
      rangeEndPosition,
      pointPosition,
      viewMode,
    );
    debouncedOnChange(toNaiveSelection(selection));
  }, [
    debouncedOnChange,
    endDate,
    pointPosition,
    rangeEndPosition,
    rangeStartPosition,
    startDate,
    viewMode,
  ]);
}
