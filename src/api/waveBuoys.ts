import type { BuoyItem, SiteDetailsFeature, RawSiteFeatureCollection } from '@/types';
import { normalizeWaveBuoyDates } from '@/helpers';
import { utcToLocalDateTime, localToUTC } from '@/utils';
import axios from 'axios';

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
export const getWaveBuoyDetails = async (
  from: Date,
  to: Date,
  buoy: string,
): Promise<SiteDetailsFeature<BuoyItem>> => {
  const searchParams = new URLSearchParams();
  searchParams.append('datetime', `${localToUTC(from)}/${localToUTC(to)}`);
  searchParams.append('waveBuoy', buoy);
  const waveDetails = await axios.get<SiteDetailsFeature<BuoyItem>>(
    `http://127.0.0.1:8000/wave-buoy/sites/${buoy}/details?start=${localToUTC(from)}&end=${localToUTC(to)}`,
  );
  console.log('getWaveBuoyDetails', waveDetails.data);
  return waveDetails.data;
};

// date in request is converted to UTC string, but in response, it's converted back to local date string, which is what the app displays
export const getWaveBuoySitesByDate = async (
  localDate: string,
): Promise<RawSiteFeatureCollection> => {
  const wavebuoysSites = await axios.get<RawSiteFeatureCollection>(
    `http://127.0.0.1:8000/wave-buoy/sites?start=${localToUTC(localDate)}`,
  );
  console.log('getWaveBuoySitesByDate', wavebuoysSites.data);
  return normalizeWaveBuoyDates(wavebuoysSites.data);
};

//This is to get all buoy sites with their latest available observation
export const getLatestWaveBuoySites = async (): Promise<RawSiteFeatureCollection> => {
  const wavebuoysSites = await axios.get<RawSiteFeatureCollection>(
    `http://127.0.0.1:8000/wave-buoy/sites`,
  );
  console.log('getLatestWaveBuoySites', wavebuoysSites.data);
  return normalizeWaveBuoyDates(wavebuoysSites.data);
};

// date in this response is converted to local date string, which is what the app displays
export const getWaveBuoyLatestDate = async (): Promise<string> => {
  const latestDate = await axios.get(`http://127.0.0.1:8000/wave-buoy/latest-time`);
  return utcToLocalDateTime(latestDate.data.time, 'YYYY-MM-DD');
};
