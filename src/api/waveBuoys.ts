import type { RawSiteFeatureCollection, WaveBuoySiteDetailsFeature } from '@/types';
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

const WAVE_BUOY_COLLECTION_URL = '/api/v1/ogc/collections/dummy_collection_id_satisfying_api/items';

export const getWaveBuoyDetails = async (
  from: Date,
  to: Date,
  buoy: string,
): Promise<WaveBuoySiteDetailsFeature> => {
  const waveDetails = await axios.get<WaveBuoySiteDetailsFeature>(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoy_details_between_dates?waveBuoy=${buoy}&datetime=${localToUTC(from)}/${localToUTC(to)}`,
  );
  return waveDetails.data;
};

// Bound the query to the selected *local* day (converted to UTC) so a buoy counts as
// "active" only when it reported on that date — not merely any time before it. Marks the
// active set the merge uses for hasDataForDate. Dates in the response are converted back
// to local date strings for display.
export const getWaveBuoySitesByDate = async (
  localDate: string,
): Promise<RawSiteFeatureCollection> => {
  const start = localToUTC(dayjs(localDate).startOf('day').toDate());
  const end = localToUTC(dayjs(localDate).endOf('day').toDate());
  const wavebuoysSites = await axios.get<RawSiteFeatureCollection>(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoys_between_dates?datetime=${start}/${end}`,
  );
  return normalizeWaveBuoyDates(wavebuoysSites.data);
};

//This is to get all buoy sites with their latest available observation
export const getLatestWaveBuoySites = async (): Promise<RawSiteFeatureCollection> => {
  const wavebuoysSites = await axios.get<RawSiteFeatureCollection>(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoys_between_dates`,
  );
  return normalizeWaveBuoyDates(wavebuoysSites.data);
};

// date in this response is converted to local date string, which is what the app displays
export const getWaveBuoyLatestDate = async (): Promise<string> => {
  const latestDate = await axios.get(
    `${WAVE_BUOY_COLLECTION_URL}/wave_buoys_latest_available_date`,
  );
  return utcToLocalDateTime(latestDate.data.time, 'YYYY-MM-DD');
};

/**
 * datetime: either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots.
 * Examples:
 * * A date-time: \"2018-02-12T23:20:50Z\"
 * * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\"
 * * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\"
 */
