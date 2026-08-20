import type {
  RawSiteFeatureCollection,
  WaveBuoySiteDetailsFeature,
  MooringSiteDetailsFeature,
} from '@/types';
import { normalizeSiteDates } from '@/helpers';
import type { TIMEZONE } from '@/store';
import { formatUtcInstant, localToUTC } from '@/utils';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/**
 * Date convention for all site (wave buoy & mooring) APIs:
 *
 * Outbound — dates are always sent in UTC nanosecond format (via localToUTC). Naive
 *   calendar-day strings (`yyyy-mm-dd`) passed in are resolved against the app's
 *   `timezone` setting (UTC or LOCAL) before conversion.
 *
 * Inbound — UTC date strings in responses are converted to a naive calendar-day string
 *   matching the app's `timezone` setting (via utcInstantToCalendarDate). The *Details
 *   functions are the exception: they return [ms-timestamp, value][] pairs, which
 *   Highcharts and display formatting handle directly.
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
// pairs, which Highcharts and display formatting handle directly (no date conversion here).
// `from`/`to` are already-resolved instants, so no timezone param is needed.
function createGetDetails<T>(detailsPath: string, idParam: string) {
  return async (from: Date, to: Date, id: string): Promise<T> => {
    const details = await axios.get<T>(`${SITE_BASE_PATH}/${detailsPath}`, {
      params: { [idParam]: id, datetime: `${localToUTC(from)}/${localToUTC(to)}` },
    });
    return details.data;
  };
}

// Bound the query to the selected calendar day (resolved against `timezone`, then
// converted to UTC) so a site counts as "active" only when it reported on that date —
// not merely any time before it. Marks the active set the merge uses for
// hasDataForDate. Dates in the response are converted back to a calendar-day string
// matching `timezone`.
function createGetSitesByDate(sitesPath: string) {
  return async (date: string, timezone: TIMEZONE): Promise<RawSiteFeatureCollection> => {
    const base = timezone === 'UTC' ? dayjs.utc(date) : dayjs(date);
    const start = localToUTC(base.startOf('day').toDate());
    const end = localToUTC(base.endOf('day').toDate());
    const sites = await axios.get<RawSiteFeatureCollection>(`${SITE_BASE_PATH}/${sitesPath}`, {
      params: { datetime: `${start}/${end}` },
    });
    return normalizeSiteDates(sites.data, timezone);
  };
}

// Get all sites with their latest available observation (no datetime bound).
function createGetLatestSites(sitesPath: string) {
  return async (timezone: TIMEZONE): Promise<RawSiteFeatureCollection> => {
    const sites = await axios.get<RawSiteFeatureCollection>(`${SITE_BASE_PATH}/${sitesPath}`);
    return normalizeSiteDates(sites.data, timezone);
  };
}

// date in this response is converted to a calendar-day string matching `timezone`
function createGetLatestDate(latestDatePath: string) {
  return async (timezone: TIMEZONE): Promise<string> => {
    const latestDate = await axios.get(`${SITE_BASE_PATH}/${latestDatePath}`);
    return formatUtcInstant(latestDate.data.time, timezone, 'YYYY-MM-DD');
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
