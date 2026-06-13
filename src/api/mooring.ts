import type { RawSiteFeatureCollection, MooringSiteDetailsFeature } from '@/types';
import { normalizeWaveBuoyDates } from '@/helpers';
import { utcToLocalDateTime, localToUTC } from '@/utils';
import axios from 'axios';
import dayjs from 'dayjs';

/**
 * Date convention for all wave buoy APIs:
 *
 * Outbound — dates are always sent in UTC nanosecond format (via utcToLocalDateTime).
 *   The app stores and displays dates in local time; callers convert to UTC before calling these functions.
 *
 * Inbound — UTC date strings in responses are converted to local date strings (via toLocalDateTime)
 *   at the call site (React Query select). getWaveBuoyDetails is the exception: it returns
 *   [ms-timestamp, value][] pairs, which Highcharts and toLocalDateTime handle directly.
 *
 * Because data sources are all in UTC, and in this application, we display local datetime to user.
 */

// const WAVE_BUOY_COLLECTION_URL =
//   '/api/v1/ogc/collections/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc/items';

// date in this response is timestamp in ms, which is what Highcharts accepts, so we don't convert to local date string here, which will be processed in wavebuoy chart component
export const getMooringDetails = async (
  from: Date,
  to: Date,
  mooring: string,
): Promise<MooringSiteDetailsFeature> => {
  const mooringDetails = await axios.get<MooringSiteDetailsFeature>(
    `http://127.0.0.1:8000/mooring/sites/${mooring}?start=${localToUTC(from)}&end=${localToUTC(to)}`,
  );
  return mooringDetails.data;
};

// Bound the query to the selected *local* day (converted to UTC) so a buoy counts as
// "active" only when it reported on that date — not merely any time before it. Marks the
// active set the merge uses for hasDataForDate. Dates in the response are converted back
// to local date strings for display.
export const getMooringSitesByDate = async (
  localDate: string,
): Promise<RawSiteFeatureCollection> => {
  const start = localToUTC(dayjs(localDate).startOf('day').toDate());
  const end = localToUTC(dayjs(localDate).endOf('day').toDate());
  const mooringSites = await axios.get<RawSiteFeatureCollection>(
    `http://127.0.0.1:8000/mooring/sites?start=${start}&end=${end}`,
  );
  return normalizeWaveBuoyDates(mooringSites.data);
};

//This is to get all buoy sites with their latest available observation
export const getLatestMooringSites = async (): Promise<RawSiteFeatureCollection> => {
  const mooringSites = await axios.get<RawSiteFeatureCollection>(
    `http://127.0.0.1:8000/mooring/sites`,
  );
  return normalizeWaveBuoyDates(mooringSites.data);
};

// date in this response is converted to local date string, which is what the app displays
export const getMooringLatestDate = async (): Promise<string> => {
  const latestDate = await axios.get(`http://127.0.0.1:8000/mooring/latest-time`);
  return utcToLocalDateTime(latestDate.data.time, 'YYYY-MM-DD');
};
