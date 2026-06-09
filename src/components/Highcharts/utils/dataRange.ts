import type { SeriesData } from '../type';

/**
 * Get the min/max timestamps spanning every series in the dataset.
 * Returns `{ min: null, max: null }` if there's nothing to measure.
 *
 * Note: callers tend to read `data[i][0]` directly (the array-pair form),
 * so this helper assumes the same. Use `calculateDataRange` for the
 * object-form fallback.
 */
export function calculateDateRange(seriesData: SeriesData[]): {
  min: number | null;
  max: number | null;
} {
  if (!seriesData || seriesData.length === 0) return { min: null, max: null };

  let minDate = Infinity;
  let maxDate = -Infinity;

  seriesData.forEach(series => {
    if (series.data && series.data.length > 0) {
      const first = series.data[0] as [number, number];
      const last = series.data[series.data.length - 1] as [number, number];
      minDate = Math.min(minDate, first[0]);
      maxDate = Math.max(maxDate, last[0]);
    }
  });

  return {
    min: minDate === Infinity ? null : minDate,
    max: maxDate === -Infinity ? null : maxDate,
  };
}

export type DataRange = {
  minTime: number;
  maxTime: number;
  rangeDays: number;
  rangeHours: number;
};

/**
 * Like `calculateDateRange` but tolerates both array-pair and object-form
 * data points (`{ x, y }`). Returns null if no timestamps are present.
 */
export function calculateDataRange(seriesData: SeriesData[]): DataRange | null {
  if (!seriesData?.length) return null;

  let allTimestamps: number[] = [];

  seriesData.forEach(series => {
    if (series.data?.length) {
      const timestamps = series.data
        .map(point => {
          if (Array.isArray(point)) {
            return point[0] as number;
          } else if (typeof point === 'object' && point !== null && 'x' in point) {
            return (point as { x: number }).x;
          }
          return undefined;
        })
        .filter((t): t is number => typeof t === 'number');
      allTimestamps = allTimestamps.concat(timestamps);
    }
  });

  if (!allTimestamps.length) return null;

  const minTime = Math.min(...allTimestamps);
  const maxTime = Math.max(...allTimestamps);
  const rangeDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);

  return {
    minTime,
    maxTime,
    rangeDays,
    rangeHours: rangeDays * 24,
  };
}

type RangeSelectorButtonType =
  | 'all'
  | 'hour'
  | 'day'
  | 'month'
  | 'year'
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'week';

const RANGE_SELECTION_TYPES = [
  '6H',
  '12H',
  '1D',
  '3D',
  '1W',
  '2W',
  '1M',
  '3M',
  '6M',
  '1Y',
  'All',
] as const;

type RangeSelectionLabel = (typeof RANGE_SELECTION_TYPES)[number];

type DynamicButton = {
  type: RangeSelectorButtonType;
  count?: number;
  text: RangeSelectionLabel;
};

/**
 * Build a list of Highcharts range-selector buttons appropriate for the
 * span of data we actually have. Buttons whose duration exceeds the data
 * range are dropped so the UI never offers a button that does nothing.
 *
 * `minRange` filters out buttons strictly *shorter than* the given label —
 * useful for charts that don't render meaningfully under, say, 12h.
 */
export function generateDynamicButtons(
  dataRange: DataRange | null,
  minRange: RangeSelectionLabel = '12H',
): DynamicButton[] {
  if (!dataRange) return [{ type: 'all', text: 'All' }];

  const { rangeDays, rangeHours } = dataRange;
  const buttons: DynamicButton[] = [];

  if (rangeHours >= 6) buttons.push({ type: 'hour', count: 6, text: '6H' });
  if (rangeHours >= 12) buttons.push({ type: 'hour', count: 12, text: '12H' });
  if (rangeHours >= 24) buttons.push({ type: 'day', count: 1, text: '1D' });

  if (rangeDays >= 3) buttons.push({ type: 'day', count: 3, text: '3D' });
  if (rangeDays >= 7) buttons.push({ type: 'day', count: 7, text: '1W' });
  if (rangeDays >= 14) buttons.push({ type: 'day', count: 14, text: '2W' });

  if (rangeDays >= 30) buttons.push({ type: 'month', count: 1, text: '1M' });
  if (rangeDays >= 90) buttons.push({ type: 'month', count: 3, text: '3M' });
  if (rangeDays >= 180) buttons.push({ type: 'month', count: 6, text: '6M' });
  if (rangeDays >= 365) buttons.push({ type: 'year', count: 1, text: '1Y' });

  buttons.push({ type: 'all', text: 'All' });

  return buttons.filter(
    b => RANGE_SELECTION_TYPES.indexOf(b.text) > RANGE_SELECTION_TYPES.indexOf(minRange),
  );
}
