import type {
  RawSiteFeatureCollection,
  WaveBuoySiteDetailsFeature,
  MooringSiteDetailsFeature,
} from '@/types';
import { normalizeSiteDates } from '@/helpers';
import { utcToLocalDateTime, localToUTC } from '@/utils';
import axios from 'axios';
import dayjs from 'dayjs';

/**
 * Date convention for all site (wave buoy & mooring) APIs:
 *
 * Outbound — dates are always sent in UTC nanosecond format (via utcToLocalDateTime).
 *   The app stores and displays dates in local time; callers convert to UTC before calling these functions.
 *
 * Inbound — UTC date strings in responses are converted to local date strings (via toLocalDateTime)
 *   at the call site (React Query select). The *Details functions are the exception: they return
 *   [ms-timestamp, value][] pairs, which Highcharts and toLocalDateTime handle directly.
 *
 * Because data sources are all in UTC, and in this application, we display local datetime to user.
 *
 * datetime: either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots.
 * Examples:
 * * A date-time: "2018-02-12T23:20:50Z"
 * * A closed interval: "2018-02-12T00:00:00Z/2018-03-18T12:31:12Z"
 * * Open intervals: "2018-02-12T00:00:00Z/.." or "../2018-03-18T12:31:12Z"
 */

const SITE_BASE_PATH = '/api/v1/ogc/collections/dummy_collection_id_satisfying_api/items';

// Wave buoys and moorings share the same OGC collection and only differ by the path
// segment of each endpoint, so the request shapes below are built once and bound to
// per-product paths at the bottom of the file.

// Fetch a single site's timeseries between two dates. Returns [ms-timestamp, value][]
// pairs, which Highcharts and toLocalDateTime handle directly (no date conversion here).
function createGetDetails<T>(detailsPath: string, idParam: string) {
  return async (from: Date, to: Date, id: string): Promise<T> => {
    const details = await axios.get<T>(`${SITE_BASE_PATH}/${detailsPath}`, {
      params: { [idParam]: id, datetime: `${localToUTC(from)}/${localToUTC(to)}` },
    });
    return details.data;
  };
}

// Bound the query to the selected *local* day (converted to UTC) so a site counts as
// "active" only when it reported on that date — not merely any time before it. Marks the
// active set the merge uses for hasDataForDate. Dates in the response are converted back
// to local date strings for display.
function createGetSitesByDate(sitesPath: string) {
  return async (localDate: string): Promise<RawSiteFeatureCollection> => {
    const start = localToUTC(dayjs(localDate).startOf('day').toDate());
    const end = localToUTC(dayjs(localDate).endOf('day').toDate());
    const sites = await axios.get<RawSiteFeatureCollection>(`${SITE_BASE_PATH}/${sitesPath}`, {
      params: { datetime: `${start}/${end}` },
    });
    return normalizeSiteDates(sites.data);
  };
}

// Get all sites with their latest available observation (no datetime bound).
function createGetLatestSites(sitesPath: string) {
  return async (): Promise<RawSiteFeatureCollection> => {
    const sites = await axios.get<RawSiteFeatureCollection>(`${SITE_BASE_PATH}/${sitesPath}`);
    return normalizeSiteDates(sites.data);
  };
}

// date in this response is converted to local date string, which is what the app displays
function createGetLatestDate(latestDatePath: string) {
  return async (): Promise<string> => {
    const latestDate = await axios.get(`${SITE_BASE_PATH}/${latestDatePath}`);
    return utcToLocalDateTime(latestDate.data.time, 'YYYY-MM-DD');
  };
}

// Wave buoys
export const getWaveBuoyDetails = createGetDetails<WaveBuoySiteDetailsFeature>(
  'wave_buoy_details_between_dates',
  'waveBuoy',
);
export const getWaveBuoySitesByDate = createGetSitesByDate('wave_buoys_between_dates');
export const getLatestWaveBuoySites = createGetLatestSites('wave_buoys_between_dates');
export const getWaveBuoyLatestDate = createGetLatestDate('wave_buoys_latest_available_date');

// Moorings
export const getMooringDetails = createGetDetails<MooringSiteDetailsFeature>(
  'mooring_details_between_dates',
  'mooring',
);
export const getMooringSitesByDate = createGetSitesByDate('moorings_between_dates');
export const getLatestMooringSites = createGetLatestSites('moorings_between_dates');
export const getMooringLatestDate = createGetLatestDate('moorings_latest_available_date');
