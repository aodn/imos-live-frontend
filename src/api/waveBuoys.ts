import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { s3Api } from './instance';
import { appendCacheBuster } from '@/utils';

export const getWaveBuoyDetails = async (
  date: string,
  buoy: string,
): Promise<WaveBuoyDetailsFeatureCollection> => {
  const path = '/BUOY/buoy_details/' + `${buoy}_${date}.geojson`;
  const response = await s3Api.get<WaveBuoyDetailsFeatureCollection>(appendCacheBuster(path));
  return response.data;
};

export const getWaveBuoyLocations = async (
  date: string,
): Promise<GeoJSON.FeatureCollection | GeoJSON.Feature> => {
  const path = '/BUOY/buoy_locations/' + `buoy_locations_${date}.geojson`;
  const response = await s3Api.get<GeoJSON.FeatureCollection | GeoJSON.Feature>(
    appendCacheBuster(path),
  );
  return response.data;
};
