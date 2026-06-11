// @vitest-environment jsdom
// jsdom is required because importing this helper transitively pulls in
// `useDrawerStore`, which calls `isSmallScreen()` (uses `window.matchMedia`)
// at module init. `src/test/setup.ts` polyfills `matchMedia` for jsdom.

import { describe, expect, it } from 'vitest';
import type { SiteFeatureCollection } from '@/types';
import { mergeAndFilterBuoyFeatures } from './mergeAndFilterBuoyFeatures';

function fc(
  entries: { date: string; buoy: string; coords?: [number, number] }[],
): SiteFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: entries.map(({ date, buoy, coords = [150, -30] }) => ({
      type: 'Feature',
      properties: { date, buoy, _id: `${buoy}-id` },
      geometry: { type: 'Point', coordinates: coords },
    })),
  };
}

const selectedDate = '2026-05-29';

// The helper attaches `hasDataForDate` at runtime but the source type
// `WaveBuoySiteProperties` doesn't declare it — narrow locally so the
// assertions type-check.
type WithFlag = { properties: { buoy: string; date: string; hasDataForDate: boolean } };

describe('mergeAndFilterBuoyFeatures', () => {
  it('marks buoys present in `buoySites` as hasDataForDate: true', () => {
    const all = fc([{ date: selectedDate, buoy: 'A' }]);
    const active = fc([{ date: selectedDate, buoy: 'A' }]);
    const result = mergeAndFilterBuoyFeatures(all, active, selectedDate) as unknown as WithFlag[];
    expect(result).toHaveLength(1);
    expect(result[0].properties.hasDataForDate).toBe(true);
  });

  it('marks buoys absent from `buoySites` as hasDataForDate: false', () => {
    const all = fc([
      { date: '2026-05-28', buoy: 'A' },
      { date: '2026-05-28', buoy: 'B' },
    ]);
    const active = fc([{ date: selectedDate, buoy: 'A' }]);
    const result = mergeAndFilterBuoyFeatures(all, active, selectedDate) as unknown as WithFlag[];
    const a = result.find(f => f.properties.buoy === 'A')!;
    const b = result.find(f => f.properties.buoy === 'B')!;
    expect(a.properties.hasDataForDate).toBe(true);
    expect(b.properties.hasDataForDate).toBe(false);
  });

  it('replaces the feature wholesale for active buoys (date comes from buoySites)', () => {
    // `all` says buoy A was last seen on 2026-01-01 (stale); `active` says it has data
    // on `selectedDate`. After merge, A's date should reflect the active feature.
    const all = fc([{ date: '2026-01-01', buoy: 'A' }]);
    const active = fc([{ date: selectedDate, buoy: 'A' }]);
    const result = mergeAndFilterBuoyFeatures(all, active, selectedDate);
    expect(result[0].properties.date).toBe(selectedDate);
  });

  it('filters out buoys whose date is more than 30 days before selected', () => {
    // 2026-04-01 is 58 days before 2026-05-29 — should be dropped.
    const all = fc([
      { date: '2026-04-01', buoy: 'STALE' },
      { date: '2026-05-15', buoy: 'RECENT' },
    ]);
    const active = fc([]);
    const result = mergeAndFilterBuoyFeatures(all, active, selectedDate);
    expect(result.map(f => f.properties.buoy)).toEqual(['RECENT']);
  });

  it('filters out buoys whose date is after selected (future)', () => {
    const all = fc([{ date: '2026-06-15', buoy: 'FUTURE' }]);
    const result = mergeAndFilterBuoyFeatures(all, fc([]), selectedDate);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the input collections', () => {
    const all = fc([{ date: selectedDate, buoy: 'A' }]);
    const active = fc([{ date: selectedDate, buoy: 'A' }]);
    const allSnapshot = JSON.parse(JSON.stringify(all));
    const activeSnapshot = JSON.parse(JSON.stringify(active));
    mergeAndFilterBuoyFeatures(all, active, selectedDate);
    expect(all).toEqual(allSnapshot);
    expect(active).toEqual(activeSnapshot);
  });
});
