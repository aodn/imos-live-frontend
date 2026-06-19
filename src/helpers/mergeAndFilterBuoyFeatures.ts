import { WAVE_BUOY_MIN_DATE } from '@/components/Highcharts/WaveBuoyChart';
import type { RawSiteFeatureCollection } from '@/types';
import { isBeforeDays } from '@/utils';

/**
 * Merges active buoy sites (with data for the selected date) into the full list of all buoy sites,
 * marks active sites with hasDataForDate: true, inactive with false, and filters to only include
 * buoys within the 30-day window before the selected date.
 */
export const mergeAndFilterBuoyFeatures = (
  allBuoySites: RawSiteFeatureCollection,
  buoySites: RawSiteFeatureCollection,
  selectedDate: Date | string,
): RawSiteFeatureCollection['features'] => {
  const activeBuoysByName = new Map(buoySites.features.map(f => [f.properties.site, f]));
  // Active buoys in allBuoySites now get their feature replaced wholesale from buoySites (so date and other properties reflect the selected date)
  return allBuoySites.features
    .map(f => {
      const activeSite = activeBuoysByName.get(f.properties.site);
      if (activeSite) {
        return {
          ...activeSite,
          properties: { ...activeSite.properties, hasDataForDate: true },
        };
      }
      return { ...f, properties: { ...f.properties, hasDataForDate: false } };
    })
    .filter(b => isBeforeDays(b.properties.date, selectedDate, WAVE_BUOY_MIN_DATE)); // Only display the wave buoys less than 30 days before and not after selected date
};
